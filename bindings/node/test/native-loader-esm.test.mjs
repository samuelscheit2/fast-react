import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import * as nativeNamespace from '../index.mjs';
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
const nativeRootWorkLoopFinishedWorkMetadataFactorySymbol = Symbol.for(
  'fast.react_native.private_root_work_loop_finished_work_metadata_factory'
);

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
assert.equal(
  Object.hasOwn(
    nativeNamespace,
    'createNativeRootWorkLoopFinishedWorkMetadataForCanary'
  ),
  false
);
assert.equal(
  nativeDefault[nativeRootWorkLoopFinishedWorkMetadataFactorySymbol],
  cjsBinding[nativeRootWorkLoopFinishedWorkMetadataFactorySymbol]
);

const nativeRootWorkLoopFinishedWorkMetadata =
  nativeDefault[nativeRootWorkLoopFinishedWorkMetadataFactorySymbol]({
    hostType: 'div',
    renderUpdateId: 'esm-root-work-loop-update:1',
    rootId: 'esm-root-work-loop-root:1',
    rootTag: 'ConcurrentRoot',
    textContent: 'text'
  });
assert.equal(Object.isFrozen(nativeRootWorkLoopFinishedWorkMetadata), true);
assert.equal(
  Object.isFrozen(nativeRootWorkLoopFinishedWorkMetadata.facade),
  true
);
assert.deepEqual(nativeRootWorkLoopFinishedWorkMetadata.facade, {
  rootId: 'esm-root-work-loop-root:1',
  rootTag: 'ConcurrentRoot',
  renderUpdateId: 'esm-root-work-loop-update:1',
  hostType: 'div',
  hostOutputShape: 'host-component',
  hostComponentCount: 1,
  hostTextCount: 1,
  textContent: 'text'
});
assert.deepEqual(
  nativeRootWorkLoopFinishedWorkMetadata.completeWork.childTags,
  ['HostComponent', 'HostText']
);
assert.throws(
  () =>
    nativeDefault[nativeRootWorkLoopFinishedWorkMetadataFactorySymbol]({
      hostType: 'section',
      renderUpdateId: 'esm-root-work-loop-update:1',
      rootId: 'esm-root-work-loop-root:1',
      rootTag: 'ConcurrentRoot',
      textContent: 'text'
    }),
  {
    name: 'FastReactNativeRootWorkLoopFinishedWorkMetadataFactoryError',
    code:
      'FAST_REACT_NAPI_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_FACTORY_INVALID_OPTIONS',
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    compatibilityClaimed: false
  }
);

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
  shapeGate.jsonTransportSmoke.smokeStatus,
  nativeRootBridgeRequestShape.jsonTransportSmoke.smokeStatus
);
assert.equal(
  shapeGate.rustHandleTableAdmissionSmoke.handleTableModel,
  'fast-react-napi.BridgeHandleTable'
);
assert.equal(shapeGate.jsonTransportSmoke.transport, 'json');
assert.equal(shapeGate.jsonTransportSmoke.schemaVersion, 1);
assert.equal(
  shapeGate.jsonTransportSmoke.parserGate.parserGateStatus,
  nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate.parserGateStatus
);
assert.equal(shapeGate.jsonTransportSmoke.parserGate.nativeExecution, false);
assert.equal(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate.batchGateStatus,
  'validated-native-root-bridge-batched-json-transport-records'
);
assert.equal(
  nativeRootBridgeRequestShape.crossEnvironmentTeardownGate.teardownGateStatus,
  'diagnosed-native-root-bridge-cross-environment-teardown-isolation'
);
assert.equal(
  nativeBindingManifest.nativeRootBridgeRequestShape
    .crossEnvironmentTeardownGate,
  nativeRootBridgeRequestShape.crossEnvironmentTeardownGate
);
assert.equal(
  nativeBindingManifest.nativeRootBridgeRequestShape
    .transportWorkerThreadTeardownGate,
  nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
);
assert.equal(
  nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
    .workerThreadTeardownGateStatus,
  'diagnosed-native-root-bridge-transport-worker-thread-teardown'
);
assert.equal(
  nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
    .batchGateStatus,
  'validated-native-root-bridge-batched-json-transport-records'
);
assert.equal(
  nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
    .crossEnvironmentTeardownGateStatus,
  'diagnosed-native-root-bridge-cross-environment-teardown-isolation'
);
assert.deepEqual(
  nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate.rows.map(
    (row) => row.id
  ),
  [
    'worker-root-stale-after-thread-teardown',
    'worker-create-value-stale-after-thread-teardown',
    'worker-render-value-stale-after-thread-teardown',
    'peer-root-active-after-worker-thread-teardown'
  ]
);
assert.deepEqual(
  nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate.rows.map(
    (row) => row.errorCode
  ),
  [
    'FAST_REACT_NAPI_STALE_HANDLE',
    'FAST_REACT_NAPI_STALE_HANDLE',
    'FAST_REACT_NAPI_STALE_HANDLE',
    null
  ]
);
assert.deepEqual(
  nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate.rows.map(
    (row) => row.boundaryErrorCode
  ),
  [
    'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
    'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
    'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
    null
  ]
);
assert.equal(
  nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate.rows.every(
    (row) =>
      row.nativeAddonLoaded === false &&
      row.nativeExecution === false &&
      row.rendererExecution === false &&
      row.reconcilerExecution === false &&
      row.reactBehaviorError === false
  ),
  true
);
assert.equal(
  nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
    .publicNativeCompatibility,
  false
);
assert.equal(
  nativeBindingManifest.nativeRootBridgeRequestShape
    .workerThreadTeardownExecutablePreflight,
  nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
);
assert.equal(
  nativeBindingManifest.nativeRootBridgeRequestShape.batchLifecycleConsumer,
  nativeRootBridgeRequestShape.batchLifecycleConsumer
);
assert.equal(
  nativeRootBridgeRequestShape.batchLifecycleConsumer.consumerStatus,
  'consumed-native-root-bridge-batch-lifecycle-records'
);
assert.equal(
  nativeRootBridgeRequestShape.batchLifecycleConsumer.model,
  'fast-react-napi.NativeRootBridgeBatchLifecycleConsumer'
);
assert.equal(
  nativeRootBridgeRequestShape.batchLifecycleConsumer.nativeExecution,
  false
);
assert.deepEqual(
  nativeRootBridgeRequestShape.batchLifecycleConsumer.cleanupHookEvidenceStatuses,
  ['not-required', 'accepted', 'rejected']
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
    .preflightStatus,
  'preflighted-native-root-bridge-worker-thread-teardown-boundary'
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight.model,
  'fast-react-napi.WorkerThreadTeardownPreflight'
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
    .executionScope,
  'rust-only-handle-table-preflight-no-node-worker-thread-no-napi-cleanup-hook'
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
    .workerThreadId,
  764
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
    .peerEnvironmentId,
  1764
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
    .transportWorkerThreadTeardownGateStatus,
  nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
    .workerThreadTeardownGateStatus
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
    .acceptedBatchRecordCount,
  2
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
    .crossEnvironmentTeardownRowCount,
  nativeRootBridgeRequestShape.crossEnvironmentTeardownGate.rows.length
);
assert.deepEqual(
  nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight.rows.map(
    (row) => row.id
  ),
  [
    'worker-render-root-stale-executable-preflight',
    'worker-create-value-stale-executable-preflight',
    'worker-render-value-stale-executable-preflight',
    'peer-root-active-executable-preflight',
    'peer-value-active-executable-preflight'
  ]
);
assert.deepEqual(
  nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight.rows.map(
    (row) => row.sourceErrorCode
  ),
  [
    'FAST_REACT_NAPI_STALE_HANDLE',
    'FAST_REACT_NAPI_STALE_HANDLE',
    'FAST_REACT_NAPI_STALE_HANDLE',
    null,
    null
  ]
);
assert.deepEqual(
  nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight.rows.map(
    (row) => row.rejectedByBoundary
  ),
  [true, true, true, false, false]
);
assert.deepEqual(
  nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight.rows.map(
    (row) => row.peerInvariantPreserved
  ),
  [false, false, false, true, true]
);
assert.deepEqual(
  nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight.rows.map(
    (row) => row.recordId
  ),
  [null, null, null, 176401, 176402]
);
assert.deepEqual(
  nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight.rows.map(
    (row) => row.slot
  ),
  [1, 2, 3, 1, 2]
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight.rows.every(
    (row) =>
      row.preflightPassed === true &&
      row.nodeWorkerThreadsExecution === false &&
      row.napiCleanupHookExecution === false &&
      row.nativeAddonLoaded === false &&
      row.nativeExecution === false &&
      row.rendererExecution === false &&
      row.reconcilerExecution === false &&
      row.publicNativeCompatibility === false &&
      row.reactBehaviorError === false
  ),
  true
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
    .publicNativeCompatibility,
  false
);
assert.throws(
  () => {
    nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight.rows[0]
      .sourceErrorCode = null;
  },
  { name: 'TypeError' }
);
assert.equal(
  nativeBindingManifest.nativeRootBridgeRequestShape
    .workerThreadCleanupHookPreflight,
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
    .preflightStatus,
  'preflighted-native-root-bridge-worker-thread-cleanup-hook-order'
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight.model,
  'fast-react-napi.WorkerThreadCleanupHookOrderPreflight'
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight.executionScope,
  'rust-only-cleanup-hook-order-preflight-no-node-worker-thread-no-napi-cleanup-hook-execution'
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
    .sourceExecutablePreflightStatus,
  nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
    .preflightStatus
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight.workerThreadId,
  764
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
    .peerEnvironmentId,
  1764
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
    .canonicalExecutableEvidenceRequired,
  true
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
    .canonicalExecutableEvidenceAccepted,
  true
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
    .cleanupHookExecutionOrder,
  'reverse-registration-order'
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
    .cleanupHookRegistrationCount,
  2
);
assert.deepEqual(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight.rows.map(
    (row) => row.id
  ),
  [
    'cleanup-hook-worker-root-before-value-release',
    'cleanup-hook-worker-value-after-root-release',
    'cleanup-hook-stale-worker-transport-evidence-rejected',
    'cleanup-hook-forged-peer-active-evidence-rejected'
  ]
);
assert.deepEqual(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight.rows.map(
    (row) => row.registrationOrder
  ),
  [2, 1, 2, 1]
);
assert.deepEqual(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight.rows.map(
    (row) => row.expectedExecutionOrder
  ),
  [1, 2, 1, 2]
);
assert.deepEqual(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight.rows.map(
    (row) => row.observedExecutionOrder
  ),
  [1, 2, null, null]
);
assert.deepEqual(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight.rows.map(
    (row) => row.status
  ),
  ['accepted', 'accepted', 'rejected', 'rejected']
);
assert.deepEqual(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight.rows.map(
    (row) => row.code
  ),
  [
    null,
    null,
    'FAST_REACT_NAPI_CLEANUP_HOOK_STALE_EXECUTABLE_PREFLIGHT',
    'FAST_REACT_NAPI_CLEANUP_HOOK_FORGED_EVIDENCE'
  ]
);
assert.deepEqual(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight.rows.map(
    (row) => row.canonicalExecutableEvidence
  ),
  [true, true, false, false]
);
assert.deepEqual(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight.rows.map(
    (row) => row.staleOrForgedCleanupEvidenceRejected
  ),
  [false, false, true, true]
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight.rows.every(
    (row) =>
      row.cleanupHookOrderPrivate === true &&
      row.cleanupHookIdentityPrivate === true &&
      row.nodeWorkerThreadsExecution === false &&
      row.napiCleanupHookExecution === false &&
      row.nativeAddonLoaded === false &&
      row.nativeExecution === false &&
      row.rendererExecution === false &&
      row.reconcilerExecution === false &&
      row.publicNativeCompatibility === false &&
      row.reactBehaviorError === false
  ),
  true
);
assert.equal(
  nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
    .publicNativeCompatibility,
  false
);
assert.throws(
  () => {
    nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight.rows[0]
      .canonicalExecutableEvidence = false;
  },
  { name: 'TypeError' }
);
assert.deepEqual(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate.lifecycleRows.map(
    (row) => row.lifecycleTransition
  ),
  ['none->active', 'active->active', 'active->retired']
);
assert.deepEqual(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate.lifecycleRows.map(
    (row) => row.status
  ),
  ['accepted', 'accepted', 'accepted']
);
assert.deepEqual(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate.errorRows.map(
    (row) => row.id
  ),
  nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate.batchedRecordGate
    .jsonTransportBatchErrorCaseIds
);
assert.deepEqual(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate.errorRows.map(
    (row) => row.code
  ),
  [
    'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE',
    'FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_STATE_MISMATCH',
    'FAST_REACT_NAPI_ROOT_REQUEST_CREATE_AFTER_ROOT_CREATED',
    'FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT',
    'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_OUT_OF_ORDER'
  ]
);
assert.equal(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate.errorRows.every(
    (row) =>
      row.nativeAddonLoaded === false &&
      row.nativeExecution === false &&
      row.rendererExecution === false &&
      row.reconcilerExecution === false &&
      row.reactBehaviorError === false
  ),
  true
);
assert.equal(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate
    .responseSequenceGate.responseSequenceGateStatus,
  'diagnosed-native-root-bridge-json-batch-response-sequence'
);
assert.equal(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate
    .responseSequenceGate.batchId,
  'native-root-bridge-json-batch-552'
);
assert.deepEqual(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate
    .responseSequenceGate.rows.map((row) => row.requestOrder),
  [0, 1, 2]
);
assert.deepEqual(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate
    .responseSequenceGate.rows.map((row) => row.responseOrder),
  [0, 1, 2]
);
assert.deepEqual(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate
    .responseSequenceGate.rows.map((row) => row.teardownState),
  ['root-active', 'root-active', 'root-retired']
);
assert.deepEqual(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate
    .responseSequenceGate.errorRows.map((row) => row.errorRowStatus),
  [
    'deterministic-error-row',
    'deterministic-error-row',
    'deterministic-error-row',
    'deterministic-error-row',
    'deterministic-error-row'
  ]
);
assert.deepEqual(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate
    .responseSequenceGate.errorRows.map((row) => row.responseOrder),
  [0, 1, 2, 3, 4]
);
assert.equal(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate.responseSequenceGate
    .errorRows.every(
      (row) =>
        row.nativeAddonLoaded === false &&
        row.nativeExecution === false &&
        row.rendererExecution === false &&
        row.reconcilerExecution === false &&
        row.reactBehaviorError === false
    ),
  true
);
assert.equal(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate
    .responseSequenceGate.streamRoundtripGate.streamRoundtripGateStatus,
  'diagnosed-native-root-bridge-json-stream-batch-roundtrip'
);
assert.equal(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate
    .responseSequenceGate.streamRoundtripGate.streamId,
  'native-root-bridge-json-stream-batch-roundtrip-587'
);
assert.deepEqual(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate
    .responseSequenceGate.streamRoundtripGate.rows.map(
      (row) => row.batchSequence
    ),
  [0, 1, 2, 3, 4, 5]
);
assert.deepEqual(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate
    .responseSequenceGate.streamRoundtripGate.rows.map(
      (row) => row.assemblyState
    ),
  ['partial', 'assembled', 'partial', 'assembled', 'partial', 'assembled']
);
assert.deepEqual(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate
    .responseSequenceGate.streamRoundtripGate.errorRows.map((row) => row.code),
  [
    'FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_CHUNK_OUT_OF_ORDER',
    'FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_DUPLICATE_CHUNK',
    'FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_MISSING_CHUNK',
    'FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_CHUNK_AFTER_TEARDOWN'
  ]
);
assert.equal(
  shapeGate.jsonTransportSmoke.parserGate.batchedRecordGate
    .responseSequenceGate.streamRoundtripGate.errorRows.every(
      (row) =>
        row.chunkStatus === 'error' &&
        row.nativeExecution === false &&
        row.crossEnvironmentHandleReuseBlocked === true &&
        row.publicNativeCompatibility === false
    ),
  true
);
assert.deepEqual(
  nativeRootBridgeRequestShape.crossEnvironmentTeardownGate.rows.map(
    (row) => row.id
  ),
  [
    'first-root-active-after-mismatched-teardown',
    'first-value-active-after-mismatched-teardown',
    'first-root-stale-after-own-teardown',
    'first-value-stale-after-own-teardown',
    'first-root-wrong-environment-in-peer-table',
    'first-value-wrong-environment-in-peer-table',
    'peer-root-active-after-first-teardown',
    'peer-value-active-after-first-teardown',
    'first-root-stale-after-slot-reuse',
    'first-value-stale-after-slot-reuse',
    'replacement-root-active-after-slot-reuse',
    'replacement-value-active-after-slot-reuse'
  ]
);
assert.deepEqual(
  nativeRootBridgeRequestShape.crossEnvironmentTeardownGate.rows.map(
    (row) => row.errorCode
  ),
  [
    null,
    null,
    'FAST_REACT_NAPI_STALE_HANDLE',
    'FAST_REACT_NAPI_STALE_HANDLE',
    'FAST_REACT_NAPI_WRONG_ENVIRONMENT',
    'FAST_REACT_NAPI_WRONG_ENVIRONMENT',
    null,
    null,
    'FAST_REACT_NAPI_STALE_HANDLE',
    'FAST_REACT_NAPI_STALE_HANDLE',
    null,
    null
  ]
);
assert.equal(
  nativeRootBridgeRequestShape.crossEnvironmentTeardownGate.rows.every(
    (row) =>
      row.nativeAddonLoaded === false &&
      row.nativeExecution === false &&
      row.rendererExecution === false &&
      row.reconcilerExecution === false &&
      row.reactBehaviorError === false
  ),
  true
);
assert.deepEqual(
  shapeGate.jsonTransportSmoke.parserGate.deterministicParseErrors.map(
    (error) => error.code
  ),
  [
    nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate.parseErrorCodes
      .invalidJson,
    nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate.parseErrorCodes
      .expectedObject,
    nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate.parseErrorCodes
      .missingField,
    nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate.parseErrorCodes
      .unexpectedField,
    nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate.parseErrorCodes
      .invalidFieldType,
    nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate.parseErrorCodes
      .unsupportedFieldValue,
    nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate.parseErrorCodes
      .unsupportedFieldValue
  ]
);
assert.deepEqual(
  shapeGate.jsonTransportSmoke.parserGate.deterministicErrorRows.map(
    (row) => row.id
  ),
  nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .jsonTransportErrorDiagnosticCaseIds
);
assert.deepEqual(
  shapeGate.jsonTransportSmoke.parserGate.deterministicErrorRows.map(
    (row) => row.code
  ),
  [
    nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate.parseErrorCodes
      .invalidJson,
    'FAST_REACT_NAPI_WRONG_ENVIRONMENT',
    'FAST_REACT_NAPI_STALE_HANDLE',
    'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE'
  ]
);
assert.equal(
  shapeGate.jsonTransportSmoke.parserGate.deterministicErrorRows.every(
    (row) =>
      row.nativeAddonLoaded === false &&
      row.nativeExecution === false &&
      row.rendererExecution === false &&
      row.reconcilerExecution === false &&
      row.reactBehaviorError === false
  ),
  true
);
assert.equal(shapeGate.handleAdmissionPreflight.tableEnvironmentId, 418);
assert.equal(shapeGate.handleAdmissionPreflight.rootRetired, true);
assert.equal(shapeGate.rustHandleTableAdmissionSmoke.tableEnvironmentId, 418);
assert.equal(shapeGate.rustHandleTableAdmissionSmoke.rootRetired, true);
assert.equal(
  shapeGate.jsonTransportSmoke.rustHandleTableAdmissionSmoke.tableEnvironmentId,
  418
);
assert.equal(
  shapeGate.jsonTransportSmoke.rustHandleTableAdmissionSmoke.rootRetired,
  true
);
assert.deepEqual(
  JSON.parse(shapeGate.jsonTransportSmoke.json).requestRecords.map(
    (record) => record.kind
  ),
  ['create', 'render', 'unmount']
);
assert.deepEqual(
  shapeGate.jsonTransportSmoke.decodedRequestRecords.map(
    (record) => record.kind
  ),
  ['create', 'render', 'unmount']
);
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
  shapeGate.jsonTransportSmoke.rustHandleTableAdmissionSmoke.smokeRecords[2]
    .rustAdmissionSmokeRecord,
  shapeGate.rustHandleTableAdmissionSmoke.smokeRecords[2]
    .rustAdmissionSmokeRecord
);
assert.equal(
  shapeGate.batchLifecycleConsumer.consumerStatus,
  nativeRootBridgeRequestShape.batchLifecycleConsumer.consumerStatus
);
assert.equal(shapeGate.batchLifecycleConsumer.requestCount, 3);
assert.equal(shapeGate.batchLifecycleConsumer.consumedBatchRecordCount, 3);
assert.equal(
  shapeGate.batchLifecycleConsumer.cleanupHookCallablePreflightAccepted,
  true
);
assert.deepEqual(
  shapeGate.batchLifecycleConsumer.rows.map((row) => row.kind),
  ['create', 'render', 'unmount']
);
assert.deepEqual(
  shapeGate.batchLifecycleConsumer.rows.map(
    (row) => row.cleanupHookEvidenceStatus
  ),
  ['not-required', 'accepted', 'accepted']
);
assert.deepEqual(
  shapeGate.batchLifecycleConsumer.rows.map((row) => row.rootHandleAction),
  ['admit-root-handle', 'validate-active-root-handle', 'retire-root-handle']
);
assert.equal(
  shapeGate.batchLifecycleConsumer.jsonBatchRoundtripLink.linkStatus,
  'linked-native-root-bridge-batch-lifecycle-consumer-json-batch-roundtrip'
);
assert.equal(
  shapeGate.batchLifecycleConsumer.jsonBatchRoundtripLink
    .responseSequenceGateStatus,
  'diagnosed-native-root-bridge-json-batch-response-sequence'
);
assert.equal(
  shapeGate.batchLifecycleConsumer.jsonBatchRoundtripLink
    .streamRoundtripGateStatus,
  'diagnosed-native-root-bridge-json-stream-batch-roundtrip'
);
assert.deepEqual(
  shapeGate.batchLifecycleConsumer.jsonBatchRoundtripLink.rows.map(
    (row) => row.consumerRowId
  ),
  [
    'batch-lifecycle-consumer-0-create',
    'batch-lifecycle-consumer-1-render',
    'batch-lifecycle-consumer-2-unmount'
  ]
);
assert.deepEqual(
  shapeGate.batchLifecycleConsumer.jsonBatchRoundtripLink.rows.map(
    (row) => row.responseRowId
  ),
  [
    'batch-response-0-create',
    'batch-response-1-render',
    'batch-response-2-unmount'
  ]
);
assert.deepEqual(
  shapeGate.batchLifecycleConsumer.jsonBatchRoundtripLink.rows.map(
    (row) => row.streamPayloadRowId
  ),
  [
    'stream-batch-chunk-1-request-1-payload',
    'stream-batch-chunk-3-request-2-payload',
    'stream-batch-chunk-5-request-3-payload'
  ]
);
assert.deepEqual(
  shapeGate.batchLifecycleConsumer.jsonBatchRoundtripLink.rows.map(
    (row) => row.cleanupHookEvidenceStatus
  ),
  ['not-required', 'accepted', 'accepted']
);
assert.deepEqual(
  shapeGate.batchLifecycleConsumer.jsonBatchRoundtripLink.rows.map(
    (row) => row.status
  ),
  ['linked', 'linked', 'linked']
);
assert.equal(
  shapeGate.batchLifecycleConsumer.jsonBatchRoundtripLink.rejectedRowCount,
  0
);
assert.equal(
  shapeGate.batchLifecycleConsumer.rows.every(
    (row) =>
      row.nativeAddonLoaded === false &&
      row.nativeExecution === false &&
      row.rendererExecution === false &&
      row.reconcilerExecution === false &&
      row.nodeWorkerThreadsExecution === false &&
      row.napiCleanupHookExecution === false &&
      row.publicNativeCompatibility === false
  ),
  true
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
