'use strict';

const assert = require('node:assert/strict');
const Module = require('node:module');

const forbiddenLoads = [];
const originalLoad = Module._load;
const originalNodeExtension = Module._extensions['.node'];

function isForbiddenLoad(request) {
  const specifier = String(request);
  return (
    specifier.endsWith('.node') ||
    specifier.startsWith('@fast-react/native-') ||
    specifier === 'child_process' ||
    specifier === 'node:child_process' ||
    specifier === 'worker_threads' ||
    specifier === 'node:worker_threads' ||
    specifier === 'http' ||
    specifier === 'node:http' ||
    specifier === 'https' ||
    specifier === 'node:https'
  );
}

function blockForbiddenLoad(kind, request) {
  const attemptedLoad = { kind, request: String(request) };
  forbiddenLoads.push(attemptedLoad);
  const error = new Error(
    `Forbidden native placeholder load attempted: ${attemptedLoad.request}`
  );
  error.attemptedLoad = attemptedLoad;
  throw error;
}

Module._extensions['.node'] = function blockedNodeExtension(module, filename) {
  blockForbiddenLoad('node-extension', filename);
};

Module._load = function guardedModuleLoad(request, parent, isMain) {
  if (isForbiddenLoad(request)) {
    blockForbiddenLoad('module-load', request);
  }

  return originalLoad.call(this, request, parent, isMain);
};

async function main() {
  try {
    const native = require('../index.cjs');
    const expectedBoundaryErrorCodeMap = {
      unsupportedNativeExecution: 'FAST_REACT_NATIVE_BINDING_UNIMPLEMENTED',
      rustNativeExportsNotBuilt: 'FAST_REACT_NAPI_EXPORTS_NOT_BUILT',
      rootBridgeWrongEnvironment:
        'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_ENVIRONMENT',
      rootBridgeStaleHandle: 'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
      rootBridgeWrongLifecycleOrder:
        'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER'
    };
    const expectedRootBridgeEvidence = [
      {
        scenario: 'wrong-environment-root-handle',
        sourceErrorCode: 'FAST_REACT_NAPI_WRONG_ENVIRONMENT',
        boundaryErrorCode:
          'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_ENVIRONMENT',
        nativeExecution: false,
        reactBehaviorError: false
      },
      {
        scenario: 'stale-root-or-value-handle',
        sourceErrorCode: 'FAST_REACT_NAPI_STALE_HANDLE',
        boundaryErrorCode: 'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
        nativeExecution: false,
        reactBehaviorError: false
      },
      {
        scenario: 'wrong-root-lifecycle-order',
        sourceErrorCode:
          'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE',
        boundaryErrorCode:
          'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER',
        nativeExecution: false,
        reactBehaviorError: false
      }
    ];

    assert.equal(native.bindingStatus, 'placeholder');
    assert.equal(native.nativeBindingManifest.status, 'placeholder');
    const actualRootBridgeEvidence =
      native.nativeBindingManifest.nativeRootBridgeValidationEvidence;

    assert.deepEqual(
      native.nativeBindingManifest.nativeBoundaryErrorCodeMap,
      expectedBoundaryErrorCodeMap
    );
    assert.ok(
      Object.isFrozen(native.nativeBindingManifest.nativeBoundaryErrorCodeMap)
    );
    assert.deepEqual(
      actualRootBridgeEvidence,
      expectedRootBridgeEvidence
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate
        .teardownGateStatus,
      'diagnosed-native-root-bridge-cross-environment-teardown-isolation'
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate
        .nativeAddonLoaded,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate
        .nativeExecution,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate.rows
        .length,
      12
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
        .workerThreadTeardownGateStatus,
      'diagnosed-native-root-bridge-transport-worker-thread-teardown'
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
        .nativeAddonLoaded,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
        .nativeExecution,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
        .publicNativeCompatibility,
      false
    );
    assert.deepEqual(
      native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
        .rows.map((row) => row.id),
      [
        'worker-root-stale-after-thread-teardown',
        'worker-create-value-stale-after-thread-teardown',
        'worker-render-value-stale-after-thread-teardown',
        'peer-root-active-after-worker-thread-teardown'
      ]
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate.rows
        .every(
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
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
        .preflightStatus,
      'preflighted-native-root-bridge-worker-thread-teardown-boundary'
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
        .workerThreadId,
      764
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
        .nodeWorkerThreadsExecution,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
        .napiCleanupHookExecution,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
        .nativeAddonLoaded,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
        .nativeExecution,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
        .publicNativeCompatibility,
      false
    );
    assert.deepEqual(
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
        .rows.map((row) => row.id),
      [
        'worker-render-root-stale-executable-preflight',
        'worker-create-value-stale-executable-preflight',
        'worker-render-value-stale-executable-preflight',
        'peer-root-active-executable-preflight',
        'peer-value-active-executable-preflight'
      ]
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight.rows
        .every(
          (row) =>
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
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .preflightStatus,
      'preflighted-native-root-bridge-worker-thread-cleanup-hook-order'
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .workerThreadId,
      764
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .sourceExecutablePreflightStatus,
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
        .preflightStatus
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .canonicalExecutableEvidenceAccepted,
      true
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .napiCleanupHookExecution,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .nativeAddonLoaded,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .nativeExecution,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .publicNativeCompatibility,
      false
    );
    assert.deepEqual(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .rows.map((row) => row.id),
      [
        'cleanup-hook-worker-root-before-value-release',
        'cleanup-hook-worker-value-after-root-release',
        'cleanup-hook-stale-worker-transport-evidence-rejected',
        'cleanup-hook-forged-peer-active-evidence-rejected'
      ]
    );
    assert.deepEqual(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .rows.map((row) => row.status),
      ['accepted', 'accepted', 'rejected', 'rejected']
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight.rows
        .every(
          (row) =>
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
      native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
        .batchedRecordGate.responseSequenceGate.responseSequenceGateStatus,
      'diagnosed-native-root-bridge-json-batch-response-sequence'
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
        .batchedRecordGate.responseSequenceGate.batchId,
      'native-root-bridge-json-batch-552'
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
        .batchedRecordGate.responseSequenceGate.nativeExecution,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
        .batchedRecordGate.responseSequenceGate.streamRoundtripGate
        .streamRoundtripGateStatus,
      'diagnosed-native-root-bridge-json-stream-batch-roundtrip'
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
        .batchedRecordGate.responseSequenceGate.streamRoundtripGate
        .nativeExecution,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
        .batchedRecordGate.responseSequenceGate.streamRoundtripGate
        .crossEnvironmentHandleReuseBlocked,
      true
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
        .batchedRecordGate.responseSequenceGate.streamRoundtripGate
        .publicNativeCompatibility,
      false
    );
    assert.ok(Object.isFrozen(actualRootBridgeEvidence));
    for (const evidence of actualRootBridgeEvidence) {
      assert.ok(Object.isFrozen(evidence));
    }
    assert.deepEqual(
      native.getNativeBindingLoadPlan({
        platform: 'linux',
        arch: 'x64',
        libc: 'musl'
      }).candidateSpecifiers,
      [
        '@fast-react/native-linux-x64-musl',
        '@fast-react/native-linux-x64-musl/fast_react_napi.linux-x64-musl.node'
      ]
    );
    assert.throws(
      () =>
        native.loadNativeBinding({
          platform: 'linux',
          arch: 'x64',
          libc: 'musl'
        }),
      (error) => {
        assert.ok(error instanceof native.FastReactNativeBindingUnavailableError);
        assert.equal(error.code, native.unavailableErrorCode);
        assert.equal(error.nativeExecution, false);
        assert.equal(
          error.nativeBoundaryErrorCode,
          expectedBoundaryErrorCodeMap.unsupportedNativeExecution
        );
        assert.equal(error.loadPlan.nativeExecution, false);
        assert.equal(
          error.loadPlan.unsupportedNativeExecutionCode,
          expectedBoundaryErrorCodeMap.unsupportedNativeExecution
        );
        return true;
      }
    );

    const esmNative = await import('../index.mjs');
    assert.equal(esmNative.default, native);
    assert.equal(esmNative.nativeBindingManifest, native.nativeBindingManifest);
  } finally {
    Module._load = originalLoad;
    Module._extensions['.node'] = originalNodeExtension;
  }

  assert.deepEqual(
    forbiddenLoads,
    [],
    'placeholder imports and loadNativeBinding() must not load native artifacts, platform packages, child_process, worker_threads, or network modules'
  );

  console.log('Fast React native no-load guard checks passed.');
}

main().catch((error) => {
  Module._load = originalLoad;
  Module._extensions['.node'] = originalNodeExtension;
  console.error(error);
  process.exitCode = 1;
});
