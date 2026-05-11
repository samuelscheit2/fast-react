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

const expectedNativeRootBridgeEnvironmentTeardownFields = [
  'requestedEnvironmentId',
  'tableEnvironmentId',
  'environmentMatched',
  'rootHandlesInvalidated',
  'valueHandlesInvalidated',
  'totalHandlesInvalidated',
  'toreDownHandles'
];
const expectedNativeRootBridgeCrossEnvironmentTeardownRowFields = [
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
];
const expectedNativeRootBridgeCrossEnvironmentTeardownRows = [
  {
    id: 'first-root-active-after-mismatched-teardown',
    operation: 'mismatched-teardown',
    handleKind: 'root',
    tableEnvironmentId: 496,
    handleEnvironmentId: 496,
    slot: 1,
    handleGeneration: 1,
    currentGeneration: 1,
    recordId: 49601,
    errorCode: null,
    rejectedByHandleTable: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  },
  {
    id: 'first-value-active-after-mismatched-teardown',
    operation: 'mismatched-teardown',
    handleKind: 'value',
    tableEnvironmentId: 496,
    handleEnvironmentId: 496,
    slot: 2,
    handleGeneration: 1,
    currentGeneration: 1,
    recordId: 49602,
    errorCode: null,
    rejectedByHandleTable: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  },
  {
    id: 'first-root-stale-after-own-teardown',
    operation: 'matched-teardown',
    handleKind: 'root',
    tableEnvironmentId: 496,
    handleEnvironmentId: 496,
    slot: 1,
    handleGeneration: 1,
    currentGeneration: 2,
    recordId: null,
    errorCode: 'FAST_REACT_NAPI_STALE_HANDLE',
    rejectedByHandleTable: true,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  },
  {
    id: 'first-value-stale-after-own-teardown',
    operation: 'matched-teardown',
    handleKind: 'value',
    tableEnvironmentId: 496,
    handleEnvironmentId: 496,
    slot: 2,
    handleGeneration: 1,
    currentGeneration: 2,
    recordId: null,
    errorCode: 'FAST_REACT_NAPI_STALE_HANDLE',
    rejectedByHandleTable: true,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  },
  {
    id: 'first-root-wrong-environment-in-peer-table',
    operation: 'wrong-environment-validation',
    handleKind: 'root',
    tableEnvironmentId: 1496,
    handleEnvironmentId: 496,
    slot: 1,
    handleGeneration: 1,
    currentGeneration: null,
    recordId: null,
    errorCode: 'FAST_REACT_NAPI_WRONG_ENVIRONMENT',
    rejectedByHandleTable: true,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  },
  {
    id: 'first-value-wrong-environment-in-peer-table',
    operation: 'wrong-environment-validation',
    handleKind: 'value',
    tableEnvironmentId: 1496,
    handleEnvironmentId: 496,
    slot: 2,
    handleGeneration: 1,
    currentGeneration: null,
    recordId: null,
    errorCode: 'FAST_REACT_NAPI_WRONG_ENVIRONMENT',
    rejectedByHandleTable: true,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  },
  {
    id: 'peer-root-active-after-first-teardown',
    operation: 'post-teardown-peer-validation',
    handleKind: 'root',
    tableEnvironmentId: 1496,
    handleEnvironmentId: 1496,
    slot: 1,
    handleGeneration: 1,
    currentGeneration: 1,
    recordId: 149601,
    errorCode: null,
    rejectedByHandleTable: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  },
  {
    id: 'peer-value-active-after-first-teardown',
    operation: 'post-teardown-peer-validation',
    handleKind: 'value',
    tableEnvironmentId: 1496,
    handleEnvironmentId: 1496,
    slot: 2,
    handleGeneration: 1,
    currentGeneration: 1,
    recordId: 149602,
    errorCode: null,
    rejectedByHandleTable: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  },
  {
    id: 'first-root-stale-after-slot-reuse',
    operation: 'post-reuse-stale-validation',
    handleKind: 'root',
    tableEnvironmentId: 496,
    handleEnvironmentId: 496,
    slot: 1,
    handleGeneration: 1,
    currentGeneration: 2,
    recordId: null,
    errorCode: 'FAST_REACT_NAPI_STALE_HANDLE',
    rejectedByHandleTable: true,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  },
  {
    id: 'first-value-stale-after-slot-reuse',
    operation: 'post-reuse-stale-validation',
    handleKind: 'value',
    tableEnvironmentId: 496,
    handleEnvironmentId: 496,
    slot: 2,
    handleGeneration: 1,
    currentGeneration: 2,
    recordId: null,
    errorCode: 'FAST_REACT_NAPI_STALE_HANDLE',
    rejectedByHandleTable: true,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  },
  {
    id: 'replacement-root-active-after-slot-reuse',
    operation: 'post-reuse-active-validation',
    handleKind: 'root',
    tableEnvironmentId: 496,
    handleEnvironmentId: 496,
    slot: 1,
    handleGeneration: 2,
    currentGeneration: 2,
    recordId: 49603,
    errorCode: null,
    rejectedByHandleTable: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  },
  {
    id: 'replacement-value-active-after-slot-reuse',
    operation: 'post-reuse-active-validation',
    handleKind: 'value',
    tableEnvironmentId: 496,
    handleEnvironmentId: 496,
    slot: 2,
    handleGeneration: 2,
    currentGeneration: 2,
    recordId: 49604,
    errorCode: null,
    rejectedByHandleTable: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  }
];
const expectedNativeRootBridgeCrossEnvironmentTeardownGate = {
  teardownGateStatus:
    'diagnosed-native-root-bridge-cross-environment-teardown-isolation',
  handleTableModel: 'fast-react-napi.BridgeHandleTable',
  environmentTeardownFields:
    expectedNativeRootBridgeEnvironmentTeardownFields,
  teardownDiagnosticRowFields:
    expectedNativeRootBridgeCrossEnvironmentTeardownRowFields,
  mismatchedTeardown: {
    requestedEnvironmentId: 1496,
    tableEnvironmentId: 496,
    environmentMatched: false,
    rootHandlesInvalidated: 0,
    valueHandlesInvalidated: 0,
    totalHandlesInvalidated: 0,
    toreDownHandles: false
  },
  matchedTeardown: {
    requestedEnvironmentId: 496,
    tableEnvironmentId: 496,
    environmentMatched: true,
    rootHandlesInvalidated: 1,
    valueHandlesInvalidated: 1,
    totalHandlesInvalidated: 2,
    toreDownHandles: true
  },
  rows: expectedNativeRootBridgeCrossEnvironmentTeardownRows,
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false,
  reactBehaviorError: false
};

const expectedNativeRootBridgeTransportWorkerThreadTeardownRowFields = [
  'id',
  'operation',
  'workerThreadId',
  'transport',
  'sourceBatchIndex',
  'requestId',
  'handleKind',
  'tableEnvironmentId',
  'handleEnvironmentId',
  'slot',
  'handleGeneration',
  'currentGeneration',
  'recordId',
  'errorCode',
  'boundaryErrorCode',
  'nativeAddonLoaded',
  'nativeExecution',
  'rendererExecution',
  'reconcilerExecution',
  'reactBehaviorError'
];
const expectedNativeRootBridgeTransportWorkerThreadTeardownRows = [
  {
    id: 'worker-root-stale-after-thread-teardown',
    operation: 'worker-thread-teardown',
    workerThreadId: 524,
    transport: 'json',
    sourceBatchIndex: 0,
    requestId: 1,
    handleKind: 'root',
    tableEnvironmentId: 524,
    handleEnvironmentId: 524,
    slot: 1,
    handleGeneration: 1,
    currentGeneration: 2,
    recordId: null,
    errorCode: 'FAST_REACT_NAPI_STALE_HANDLE',
    boundaryErrorCode: 'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  },
  {
    id: 'worker-create-value-stale-after-thread-teardown',
    operation: 'worker-thread-teardown',
    workerThreadId: 524,
    transport: 'json',
    sourceBatchIndex: 0,
    requestId: 1,
    handleKind: 'value',
    tableEnvironmentId: 524,
    handleEnvironmentId: 524,
    slot: 2,
    handleGeneration: 1,
    currentGeneration: 2,
    recordId: null,
    errorCode: 'FAST_REACT_NAPI_STALE_HANDLE',
    boundaryErrorCode: 'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  },
  {
    id: 'worker-render-value-stale-after-thread-teardown',
    operation: 'worker-thread-teardown',
    workerThreadId: 524,
    transport: 'json',
    sourceBatchIndex: 1,
    requestId: 2,
    handleKind: 'value',
    tableEnvironmentId: 524,
    handleEnvironmentId: 524,
    slot: 3,
    handleGeneration: 1,
    currentGeneration: 2,
    recordId: null,
    errorCode: 'FAST_REACT_NAPI_STALE_HANDLE',
    boundaryErrorCode: 'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  },
  {
    id: 'peer-root-active-after-worker-thread-teardown',
    operation: 'peer-environment-isolation',
    workerThreadId: 524,
    transport: 'json',
    sourceBatchIndex: null,
    requestId: null,
    handleKind: 'root',
    tableEnvironmentId: 1524,
    handleEnvironmentId: 1524,
    slot: 1,
    handleGeneration: 1,
    currentGeneration: 1,
    recordId: 152401,
    errorCode: null,
    boundaryErrorCode: null,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  }
];
const expectedNativeRootBridgeTransportWorkerThreadTeardownGate = {
  workerThreadTeardownGateStatus:
    'diagnosed-native-root-bridge-transport-worker-thread-teardown',
  transport: 'json',
  workerThreadId: 524,
  workerEnvironmentId: 524,
  peerEnvironmentId: 1524,
  validationModel: 'fast-react-napi.NativeRootBridgeRequestSequenceValidator',
  handleTableModel: 'fast-react-napi.BridgeHandleTable',
  batchGateStatus:
    'validated-native-root-bridge-batched-json-transport-records',
  crossEnvironmentTeardownGateStatus:
    'diagnosed-native-root-bridge-cross-environment-teardown-isolation',
  environmentTeardownFields:
    expectedNativeRootBridgeEnvironmentTeardownFields,
  workerThreadTeardownDiagnosticRowFields:
    expectedNativeRootBridgeTransportWorkerThreadTeardownRowFields,
  mismatchedTeardown: {
    requestedEnvironmentId: 524,
    tableEnvironmentId: 1524,
    environmentMatched: false,
    rootHandlesInvalidated: 0,
    valueHandlesInvalidated: 0,
    totalHandlesInvalidated: 0,
    toreDownHandles: false
  },
  matchedTeardown: {
    requestedEnvironmentId: 524,
    tableEnvironmentId: 524,
    environmentMatched: true,
    rootHandlesInvalidated: 1,
    valueHandlesInvalidated: 2,
    totalHandlesInvalidated: 3,
    toreDownHandles: true
  },
  rows: expectedNativeRootBridgeTransportWorkerThreadTeardownRows,
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false,
  publicNativeCompatibility: false,
  reactBehaviorError: false
};

const expectedNativeRootBridgeWorkerThreadTeardownExecutablePreflightRowFields =
  [
    'id',
    'operation',
    'assertion',
    'workerThreadId',
    'handleKind',
    'tableEnvironmentId',
    'handleEnvironmentId',
    'slot',
    'handleGeneration',
    'currentGeneration',
    'recordId',
    'sourceErrorCode',
    'boundaryErrorCode',
    'rejectedByBoundary',
    'peerInvariantPreserved',
    'preflightPassed',
    'nodeWorkerThreadsExecution',
    'napiCleanupHookExecution',
    'nativeAddonLoaded',
    'nativeExecution',
    'rendererExecution',
    'reconcilerExecution',
    'publicNativeCompatibility',
    'reactBehaviorError'
  ];
const expectedNativeRootBridgeWorkerThreadTeardownExecutablePreflightRows = [
  {
    id: 'worker-render-root-stale-executable-preflight',
    operation: 'post-teardown-render-boundary-validation',
    assertion: 'stale-worker-root-rejected-without-mutating-validator',
    workerThreadId: 764,
    handleKind: 'root',
    tableEnvironmentId: 764,
    handleEnvironmentId: 764,
    slot: 1,
    handleGeneration: 1,
    currentGeneration: 2,
    recordId: null,
    sourceErrorCode: 'FAST_REACT_NAPI_STALE_HANDLE',
    boundaryErrorCode: 'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
    rejectedByBoundary: true,
    peerInvariantPreserved: false,
    preflightPassed: true,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  },
  {
    id: 'worker-create-value-stale-executable-preflight',
    operation: 'post-teardown-value-boundary-validation',
    assertion: 'stale-worker-value-rejected-after-worker-teardown',
    workerThreadId: 764,
    handleKind: 'value',
    tableEnvironmentId: 764,
    handleEnvironmentId: 764,
    slot: 2,
    handleGeneration: 1,
    currentGeneration: 2,
    recordId: null,
    sourceErrorCode: 'FAST_REACT_NAPI_STALE_HANDLE',
    boundaryErrorCode: 'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
    rejectedByBoundary: true,
    peerInvariantPreserved: false,
    preflightPassed: true,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  },
  {
    id: 'worker-render-value-stale-executable-preflight',
    operation: 'post-teardown-value-boundary-validation',
    assertion: 'stale-worker-value-rejected-after-worker-teardown',
    workerThreadId: 764,
    handleKind: 'value',
    tableEnvironmentId: 764,
    handleEnvironmentId: 764,
    slot: 3,
    handleGeneration: 1,
    currentGeneration: 2,
    recordId: null,
    sourceErrorCode: 'FAST_REACT_NAPI_STALE_HANDLE',
    boundaryErrorCode: 'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
    rejectedByBoundary: true,
    peerInvariantPreserved: false,
    preflightPassed: true,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  },
  {
    id: 'peer-root-active-executable-preflight',
    operation: 'post-teardown-peer-root-validation',
    assertion: 'peer-handle-remains-active-after-worker-teardown',
    workerThreadId: 764,
    handleKind: 'root',
    tableEnvironmentId: 1764,
    handleEnvironmentId: 1764,
    slot: 1,
    handleGeneration: 1,
    currentGeneration: 1,
    recordId: 176401,
    sourceErrorCode: null,
    boundaryErrorCode: null,
    rejectedByBoundary: false,
    peerInvariantPreserved: true,
    preflightPassed: true,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  },
  {
    id: 'peer-value-active-executable-preflight',
    operation: 'post-teardown-peer-value-validation',
    assertion: 'peer-handle-remains-active-after-worker-teardown',
    workerThreadId: 764,
    handleKind: 'value',
    tableEnvironmentId: 1764,
    handleEnvironmentId: 1764,
    slot: 2,
    handleGeneration: 1,
    currentGeneration: 1,
    recordId: 176402,
    sourceErrorCode: null,
    boundaryErrorCode: null,
    rejectedByBoundary: false,
    peerInvariantPreserved: true,
    preflightPassed: true,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  }
];
const expectedNativeRootBridgeWorkerThreadTeardownExecutablePreflight = {
  preflightStatus:
    'preflighted-native-root-bridge-worker-thread-teardown-boundary',
  model: 'fast-react-napi.WorkerThreadTeardownPreflight',
  executionScope:
    'rust-only-handle-table-preflight-no-node-worker-thread-no-napi-cleanup-hook',
  transport: 'json',
  workerThreadId: 764,
  workerEnvironmentId: 764,
  peerEnvironmentId: 1764,
  validationModel: 'fast-react-napi.NativeRootBridgeRequestSequenceValidator',
  handleTableModel: 'fast-react-napi.BridgeHandleTable',
  transportWorkerThreadTeardownGateStatus:
    'diagnosed-native-root-bridge-transport-worker-thread-teardown',
  batchedRecordGateStatus:
    'validated-native-root-bridge-batched-json-transport-records',
  crossEnvironmentTeardownGateStatus:
    'diagnosed-native-root-bridge-cross-environment-teardown-isolation',
  acceptedBatchRecordCount: 2,
  crossEnvironmentTeardownRowCount: 12,
  environmentTeardownFields:
    expectedNativeRootBridgeEnvironmentTeardownFields,
  executablePreflightRowFields:
    expectedNativeRootBridgeWorkerThreadTeardownExecutablePreflightRowFields,
  mismatchedTeardown: {
    requestedEnvironmentId: 764,
    tableEnvironmentId: 1764,
    environmentMatched: false,
    rootHandlesInvalidated: 0,
    valueHandlesInvalidated: 0,
    totalHandlesInvalidated: 0,
    toreDownHandles: false
  },
  matchedTeardown: {
    requestedEnvironmentId: 764,
    tableEnvironmentId: 764,
    environmentMatched: true,
    rootHandlesInvalidated: 1,
    valueHandlesInvalidated: 2,
    totalHandlesInvalidated: 3,
    toreDownHandles: true
  },
  staleWorkerHandleRejectionCount: 3,
  activePeerHandleCount: 2,
  rootValidatorStatePreserved: true,
  rows: expectedNativeRootBridgeWorkerThreadTeardownExecutablePreflightRows,
  preflightEvaluated: true,
  nodeWorkerThreadsExecution: false,
  napiCleanupHookExecution: false,
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false,
  publicNativeCompatibility: false,
  reactBehaviorError: false
};

const expectedNativeRootBridgeWorkerThreadCleanupHookPreflightRowFields = [
  'id',
  'operation',
  'cleanupHookId',
  'cleanupHookFunctionIdentityToken',
  'cleanupHookArgumentIdentityToken',
  'registrationOrder',
  'expectedExecutionOrder',
  'observedExecutionOrder',
  'status',
  'code',
  'sourcePreflightStatus',
  'sourceWorkerThreadId',
  'sourceEnvironmentId',
  'sourceRowId',
  'sourceHandleKind',
  'sourceErrorCode',
  'sourceBoundaryErrorCode',
  'canonicalExecutableEvidence',
  'cleanupHookOrderPrivate',
  'cleanupHookIdentityPrivate',
  'staleOrForgedCleanupEvidenceRejected',
  'nodeWorkerThreadsExecution',
  'napiCleanupHookExecution',
  'nativeAddonLoaded',
  'nativeExecution',
  'rendererExecution',
  'reconcilerExecution',
  'publicNativeCompatibility',
  'reactBehaviorError'
];
const expectedNativeRootBridgeWorkerThreadCleanupHookPreflightRows = [
  {
    id: 'cleanup-hook-worker-root-before-value-release',
    operation: 'cleanup-hook-order-preflight',
    cleanupHookId: 'worker-root-handle-cleanup-hook',
    cleanupHookFunctionIdentityToken:
      'private-cleanup-hook-fn:worker-root-handle-teardown',
    cleanupHookArgumentIdentityToken:
      'private-cleanup-hook-arg:worker-764-root-slot-1',
    registrationOrder: 2,
    expectedExecutionOrder: 1,
    observedExecutionOrder: 1,
    status: 'accepted',
    code: null,
    sourcePreflightStatus:
      'preflighted-native-root-bridge-worker-thread-teardown-boundary',
    sourceWorkerThreadId: 764,
    sourceEnvironmentId: 764,
    sourceRowId: 'worker-render-root-stale-executable-preflight',
    sourceHandleKind: 'root',
    sourceErrorCode: 'FAST_REACT_NAPI_STALE_HANDLE',
    sourceBoundaryErrorCode: 'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
    canonicalExecutableEvidence: true,
    cleanupHookOrderPrivate: true,
    cleanupHookIdentityPrivate: true,
    staleOrForgedCleanupEvidenceRejected: false,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  },
  {
    id: 'cleanup-hook-worker-value-after-root-release',
    operation: 'cleanup-hook-order-preflight',
    cleanupHookId: 'worker-value-handle-cleanup-hook',
    cleanupHookFunctionIdentityToken:
      'private-cleanup-hook-fn:worker-value-handle-teardown',
    cleanupHookArgumentIdentityToken:
      'private-cleanup-hook-arg:worker-764-value-slot-3',
    registrationOrder: 1,
    expectedExecutionOrder: 2,
    observedExecutionOrder: 2,
    status: 'accepted',
    code: null,
    sourcePreflightStatus:
      'preflighted-native-root-bridge-worker-thread-teardown-boundary',
    sourceWorkerThreadId: 764,
    sourceEnvironmentId: 764,
    sourceRowId: 'worker-render-value-stale-executable-preflight',
    sourceHandleKind: 'value',
    sourceErrorCode: 'FAST_REACT_NAPI_STALE_HANDLE',
    sourceBoundaryErrorCode: 'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
    canonicalExecutableEvidence: true,
    cleanupHookOrderPrivate: true,
    cleanupHookIdentityPrivate: true,
    staleOrForgedCleanupEvidenceRejected: false,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  },
  {
    id: 'cleanup-hook-stale-worker-transport-evidence-rejected',
    operation: 'cleanup-hook-evidence-preflight-rejection',
    cleanupHookId: 'stale-worker-transport-cleanup-hook',
    cleanupHookFunctionIdentityToken:
      'private-cleanup-hook-fn:stale-worker-teardown',
    cleanupHookArgumentIdentityToken:
      'private-cleanup-hook-arg:worker-524-root-slot-1',
    registrationOrder: 2,
    expectedExecutionOrder: 1,
    observedExecutionOrder: null,
    status: 'rejected',
    code: 'FAST_REACT_NAPI_CLEANUP_HOOK_STALE_EXECUTABLE_PREFLIGHT',
    sourcePreflightStatus:
      'diagnosed-native-root-bridge-transport-worker-thread-teardown',
    sourceWorkerThreadId: 524,
    sourceEnvironmentId: 524,
    sourceRowId: 'worker-root-stale-after-thread-teardown',
    sourceHandleKind: 'root',
    sourceErrorCode: 'FAST_REACT_NAPI_STALE_HANDLE',
    sourceBoundaryErrorCode: 'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
    canonicalExecutableEvidence: false,
    cleanupHookOrderPrivate: true,
    cleanupHookIdentityPrivate: true,
    staleOrForgedCleanupEvidenceRejected: true,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  },
  {
    id: 'cleanup-hook-forged-peer-active-evidence-rejected',
    operation: 'cleanup-hook-evidence-preflight-rejection',
    cleanupHookId: 'forged-peer-active-cleanup-hook',
    cleanupHookFunctionIdentityToken:
      'private-cleanup-hook-fn:forged-peer-active',
    cleanupHookArgumentIdentityToken:
      'private-cleanup-hook-arg:worker-1764-peer-root',
    registrationOrder: 1,
    expectedExecutionOrder: 2,
    observedExecutionOrder: null,
    status: 'rejected',
    code: 'FAST_REACT_NAPI_CLEANUP_HOOK_FORGED_EVIDENCE',
    sourcePreflightStatus:
      'preflighted-native-root-bridge-worker-thread-teardown-boundary',
    sourceWorkerThreadId: 764,
    sourceEnvironmentId: 764,
    sourceRowId: 'peer-root-active-executable-preflight',
    sourceHandleKind: 'root',
    sourceErrorCode: null,
    sourceBoundaryErrorCode: null,
    canonicalExecutableEvidence: false,
    cleanupHookOrderPrivate: true,
    cleanupHookIdentityPrivate: true,
    staleOrForgedCleanupEvidenceRejected: true,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  }
];
const expectedNativeRootBridgeWorkerThreadCleanupHookPreflight = {
  preflightStatus:
    'preflighted-native-root-bridge-worker-thread-cleanup-hook-order',
  model: 'fast-react-napi.WorkerThreadCleanupHookOrderPreflight',
  executionScope:
    'rust-only-cleanup-hook-order-preflight-no-node-worker-thread-no-napi-cleanup-hook-execution',
  sourceExecutablePreflightStatus:
    'preflighted-native-root-bridge-worker-thread-teardown-boundary',
  workerThreadId: 764,
  workerEnvironmentId: 764,
  peerEnvironmentId: 1764,
  canonicalExecutableEvidenceRequired: true,
  canonicalExecutableEvidenceAccepted: true,
  cleanupHookRegistrationCount: 2,
  cleanupHookExecutionOrder: 'reverse-registration-order',
  acceptedCleanupEvidenceCount: 2,
  rejectedCleanupEvidenceCount: 2,
  staleOrForgedCleanupEvidenceRejectionCount: 2,
  cleanupHookOrderPrivate: true,
  cleanupHookIdentityPrivate: true,
  cleanupHookPreflightRowFields:
    expectedNativeRootBridgeWorkerThreadCleanupHookPreflightRowFields,
  rows: expectedNativeRootBridgeWorkerThreadCleanupHookPreflightRows,
  nodeWorkerThreadsExecution: false,
  napiCleanupHookExecution: false,
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false,
  publicNativeCompatibility: false,
  reactBehaviorError: false
};
const expectedNativeRootBridgeBatchLifecycleConsumerRowFields = [
  'id',
  'batchIndex',
  'requestId',
  'kind',
  'lifecycleTransition',
  'rootHandleAction',
  'rootHandleStateBefore',
  'rootHandleStateAfter',
  'rootHandleCurrentGeneration',
  'valueHandleAction',
  'valueHandleCurrentGeneration',
  'retiredRootSourceErrorCode',
  'cleanupHookEvidenceRequired',
  'cleanupHookEvidenceStatus',
  'cleanupHookEvidenceRowId',
  'cleanupHookSourceRowId',
  'cleanupHookSourceHandleKind',
  'cleanupHookCanonicalExecutableEvidence',
  'status',
  'code',
  'sourceErrorCode',
  'boundaryErrorCode',
  'nativeAddonLoaded',
  'nativeExecution',
  'rendererExecution',
  'reconcilerExecution',
  'nodeWorkerThreadsExecution',
  'napiCleanupHookExecution',
  'publicNativeCompatibility',
  'reactBehaviorError'
];
const expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowFields =
  [
    'id',
    'consumerRowId',
    'lifecycleRowId',
    'responseRowId',
    'streamMetadataRowId',
    'streamPayloadRowId',
    'batchId',
    'streamId',
    'batchIndex',
    'requestId',
    'kind',
    'lifecycleTransition',
    'rootHandleAction',
    'cleanupHookEvidenceStatus',
    'requestOrder',
    'responseOrder',
    'metadataBatchSequence',
    'payloadBatchSequence',
    'metadataChunkKind',
    'payloadChunkKind',
    'responseStatus',
    'payloadAssemblyState',
    'teardownState',
    'status',
    'code',
    'nativeAddonLoaded',
    'nativeExecution',
    'rendererExecution',
    'reconcilerExecution',
    'nodeWorkerThreadsExecution',
    'napiCleanupHookExecution',
    'publicNativeCompatibility',
    'reactBehaviorError'
  ];
const expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes =
  {
    cleanupHookStatusMismatch:
      'FAST_REACT_NAPI_BATCH_LIFECYCLE_CONSUMER_CLEANUP_STATUS_MISMATCH',
    consumerRowIdMismatch:
      'FAST_REACT_NAPI_BATCH_LIFECYCLE_CONSUMER_ROW_ID_MISMATCH',
    kindTransitionMismatch:
      'FAST_REACT_NAPI_BATCH_LIFECYCLE_CONSUMER_KIND_TRANSITION_MISMATCH',
    publicNativeExecutionClaim:
      'FAST_REACT_NAPI_BATCH_LIFECYCLE_CONSUMER_PUBLIC_NATIVE_EXECUTION_CLAIM',
    rowOrderMismatch:
      'FAST_REACT_NAPI_BATCH_LIFECYCLE_CONSUMER_ROW_ORDER_MISMATCH',
    staleOrForeignJsonBatchRow:
      'FAST_REACT_NAPI_BATCH_LIFECYCLE_CONSUMER_STALE_OR_FOREIGN_JSON_BATCH_ROW'
  };
const expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink = {
  linkStatus:
    'linked-native-root-bridge-batch-lifecycle-consumer-json-batch-roundtrip',
  model:
    'fast-react-napi.NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink',
  validationModel: 'fast-react-napi.NativeRootBridgeRequestSequenceValidator',
  handleTableModel: 'fast-react-napi.BridgeHandleTable',
  consumerStatus: 'consumed-native-root-bridge-batch-lifecycle-records',
  batchGateStatus: 'validated-native-root-bridge-batched-json-transport-records',
  responseSequenceGateStatus:
    'diagnosed-native-root-bridge-json-batch-response-sequence',
  streamRoundtripGateStatus:
    'diagnosed-native-root-bridge-json-stream-batch-roundtrip',
  batchId: 'native-root-bridge-json-batch-552',
  streamId: 'native-root-bridge-json-stream-batch-roundtrip-587',
  validateJsonBatchRoundtripLinkRowsName:
    'validateNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRows',
  rowStatuses: ['linked', 'rejected'],
  rejectionCaseIds: [
    'consumer-row-id-mismatch',
    'consumer-row-order-mismatch',
    'consumer-kind-transition-mismatch',
    'consumer-cleanup-status-mismatch',
    'stale-or-foreign-json-batch-row',
    'public-native-execution-claim'
  ],
  rejectionCodes:
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes,
  jsonBatchRoundtripLinkRowFields:
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowFields,
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false,
  nodeWorkerThreadsExecution: false,
  napiCleanupHookExecution: false,
  publicNativeCompatibility: false,
  reactBehaviorError: false
};
const expectedNativeRootBridgeBatchLifecycleConsumer = {
  consumerStatus: 'consumed-native-root-bridge-batch-lifecycle-records',
  model: 'fast-react-napi.NativeRootBridgeBatchLifecycleConsumer',
  validationModel: 'fast-react-napi.NativeRootBridgeRequestSequenceValidator',
  handleTableModel: 'fast-react-napi.BridgeHandleTable',
  batchGateStatus: 'validated-native-root-bridge-batched-json-transport-records',
  cleanupHookPreflightStatus:
    'preflighted-native-root-bridge-worker-thread-cleanup-hook-order',
  cleanupHookCallableName: 'validateCleanupHookEvidenceRows',
  cleanupHookEvidenceStatuses: ['not-required', 'accepted', 'rejected'],
  batchLifecycleConsumerRowFields:
    expectedNativeRootBridgeBatchLifecycleConsumerRowFields,
  jsonBatchRoundtripLink:
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink,
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false,
  nodeWorkerThreadsExecution: false,
  napiCleanupHookExecution: false,
  publicNativeCompatibility: false,
  reactBehaviorError: false
};

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
    parserGate: {
      parserGateStatus: 'parsed-native-root-bridge-json-transport-schema',
      transport: 'json',
      schemaVersion: 1,
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
      parseErrorCodes: {
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
      },
      jsonTransportErrorDiagnosticRowFields: [
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
      ],
      jsonTransportErrorDiagnosticCaseIds: [
        'malformed-payload',
        'wrong-environment-root-handle',
        'stale-value-handle-generation',
        'render-before-create-lifecycle-order'
      ],
      batchedRecordGate: {
        batchGateStatus:
          'validated-native-root-bridge-batched-json-transport-records',
        validationModel:
          'fast-react-napi.NativeRootBridgeRequestSequenceValidator',
        lifecycleStates: ['none', 'active', 'retired'],
        lifecycleStatuses: ['accepted', 'error'],
        jsonTransportBatchLifecycleRowFields: [
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
        ],
        jsonTransportBatchErrorCaseIds: [
          'batch-render-before-create-lifecycle-order',
          'batch-root-handle-state-mismatch',
          'batch-create-after-create-lifecycle-order',
          'batch-request-after-unmount-lifecycle-order',
          'batch-request-id-out-of-order'
        ],
        responseSequenceGate: {
          responseSequenceGateStatus:
            'diagnosed-native-root-bridge-json-batch-response-sequence',
          batchId: 'native-root-bridge-json-batch-552',
          validationModel:
            'fast-react-napi.NativeRootBridgeRequestSequenceValidator',
          jsonTransportBatchResponseSequenceRowFields: [
            'id',
            'batchId',
            'requestOrder',
            'responseOrder',
            'requestId',
            'kind',
            'responseStatus',
            'errorRowStatus',
            'teardownState',
            'code',
            'sourceErrorCode',
            'boundaryErrorCode',
            'nativeAddonLoaded',
            'nativeExecution',
            'rendererExecution',
            'reconcilerExecution',
            'reactBehaviorError'
          ],
          errorRowStatuses: [
            'not-error-row',
            'lifecycle-error-row',
            'deterministic-error-row'
          ],
          teardownStates: [
            'root-uninitialized',
            'root-active',
            'root-retired'
          ],
          streamRoundtripGate: {
            streamRoundtripGateStatus:
              'diagnosed-native-root-bridge-json-stream-batch-roundtrip',
            batchId: 'native-root-bridge-json-batch-552',
            streamId: 'native-root-bridge-json-stream-batch-roundtrip-587',
            validationModel:
              'fast-react-napi.NativeRootBridgeRequestSequenceValidator',
            jsonTransportStreamBatchRoundtripChunkRowFields: [
              'id',
              'batchId',
              'streamId',
              'requestId',
              'requestOrder',
              'responseOrder',
              'chunkOrder',
              'batchSequence',
              'chunkKind',
              'chunkStatus',
              'responseStatus',
              'assemblyState',
              'assembledResponse',
              'teardownState',
              'teardownBlocker',
              'code',
              'sourceErrorCode',
              'boundaryErrorCode',
              'nativeAddonLoaded',
              'nativeExecution',
              'rendererExecution',
              'reconcilerExecution',
              'crossEnvironmentHandleReuseBlocked',
              'publicNativeCompatibility',
              'reactBehaviorError'
            ],
            jsonTransportStreamBatchRoundtripErrorCaseIds: [
              'stream-chunk-out-of-order',
              'stream-chunk-duplicate',
              'stream-chunk-missing',
              'stream-chunk-after-teardown'
            ],
            chunkKinds: ['metadata', 'payload'],
            chunkStatuses: ['accepted', 'error'],
            assemblyStates: ['partial', 'assembled', 'rejected'],
            teardownBlockers: [
              'none',
              'root-retired-after-assembly',
              'post-teardown-chunk-blocked'
            ],
            nativeAddonLoaded: false,
            nativeExecution: false,
            rendererExecution: false,
            reconcilerExecution: false,
            crossEnvironmentHandleReuseBlocked: true,
            publicNativeCompatibility: false,
            reactBehaviorError: false
          },
          nativeAddonLoaded: false,
          nativeExecution: false,
          rendererExecution: false,
          reconcilerExecution: false,
          reactBehaviorError: false
        },
        nativeAddonLoaded: false,
        nativeExecution: false,
        rendererExecution: false,
        reconcilerExecution: false
      },
      nativeAddonLoaded: false,
      nativeExecution: false,
      rendererExecution: false,
      reconcilerExecution: false
    },
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false
  },
  crossEnvironmentTeardownGate:
    expectedNativeRootBridgeCrossEnvironmentTeardownGate,
  transportWorkerThreadTeardownGate:
    expectedNativeRootBridgeTransportWorkerThreadTeardownGate,
  workerThreadTeardownExecutablePreflight:
    expectedNativeRootBridgeWorkerThreadTeardownExecutablePreflight,
  workerThreadCleanupHookPreflight:
    expectedNativeRootBridgeWorkerThreadCleanupHookPreflight,
  batchLifecycleConsumer: expectedNativeRootBridgeBatchLifecycleConsumer,
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
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .jsonTransportEnvelopeFields,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .jsonTransportRequestRecordFields,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .jsonTransportHandleFields,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .parseErrorCodes,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .batchedRecordGate,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .batchedRecordGate.lifecycleStates,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .batchedRecordGate.lifecycleStatuses,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .batchedRecordGate.jsonTransportBatchLifecycleRowFields,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .batchedRecordGate.jsonTransportBatchErrorCaseIds,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .batchedRecordGate.responseSequenceGate,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .batchedRecordGate.responseSequenceGate
    .jsonTransportBatchResponseSequenceRowFields,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .batchedRecordGate.responseSequenceGate.errorRowStatuses,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .batchedRecordGate.responseSequenceGate.teardownStates,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .batchedRecordGate.responseSequenceGate.streamRoundtripGate,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .batchedRecordGate.responseSequenceGate.streamRoundtripGate
    .jsonTransportStreamBatchRoundtripChunkRowFields,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .batchedRecordGate.responseSequenceGate.streamRoundtripGate
    .jsonTransportStreamBatchRoundtripErrorCaseIds,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .batchedRecordGate.responseSequenceGate.streamRoundtripGate.chunkKinds,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .batchedRecordGate.responseSequenceGate.streamRoundtripGate.chunkStatuses,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .batchedRecordGate.responseSequenceGate.streamRoundtripGate.assemblyStates,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
    .batchedRecordGate.responseSequenceGate.streamRoundtripGate.teardownBlockers,
  native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate,
  native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate
    .environmentTeardownFields,
  native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate
    .teardownDiagnosticRowFields,
  native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate
    .mismatchedTeardown,
  native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate
    .matchedTeardown,
  native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate.rows,
  native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate,
  native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
    .environmentTeardownFields,
  native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
    .workerThreadTeardownDiagnosticRowFields,
  native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
    .mismatchedTeardown,
  native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
    .matchedTeardown,
  native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate.rows,
  native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight,
  native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
    .environmentTeardownFields,
  native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
    .executablePreflightRowFields,
  native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
    .mismatchedTeardown,
  native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
    .matchedTeardown,
  native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
    .rows,
  native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight,
  native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
    .cleanupHookPreflightRowFields,
  native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight.rows,
  native.nativeRootBridgeRequestShape.batchLifecycleConsumer,
  native.nativeRootBridgeRequestShape.batchLifecycleConsumer
    .cleanupHookEvidenceStatuses,
  native.nativeRootBridgeRequestShape.batchLifecycleConsumer
    .batchLifecycleConsumerRowFields,
  native.nativeRootBridgeRequestShape.batchLifecycleConsumer
    .jsonBatchRoundtripLink,
  native.nativeRootBridgeRequestShape.batchLifecycleConsumer
    .jsonBatchRoundtripLink.rowStatuses,
  native.nativeRootBridgeRequestShape.batchLifecycleConsumer
    .jsonBatchRoundtripLink.rejectionCaseIds,
  native.nativeRootBridgeRequestShape.batchLifecycleConsumer
    .jsonBatchRoundtripLink.rejectionCodes,
  native.nativeRootBridgeRequestShape.batchLifecycleConsumer
    .jsonBatchRoundtripLink.jsonBatchRoundtripLinkRowFields,
  native.nativeRootBridgeRequestShape.validationErrorCodes
]) {
  assert.ok(Object.isFrozen(shapeValue));
}
assertNativeRootBridgeCrossEnvironmentTeardownGate(
  native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate
);
assertNativeRootBridgeTransportWorkerThreadTeardownGate(
  native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
);
assertNativeRootBridgeWorkerThreadTeardownExecutablePreflight(
  native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
);
assertNativeRootBridgeWorkerThreadTeardownExecutablePreflightRejectsForgery(
  native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
);
assertNativeRootBridgeWorkerThreadCleanupHookPreflight(
  native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
);
assertNativeRootBridgeWorkerThreadCleanupHookPreflightRejectsForgery(
  native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
);
assertNativeRootBridgeBatchLifecycleConsumerMetadata(
  native.nativeRootBridgeRequestShape.batchLifecycleConsumer
);

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
assertNativeRootBridgeBatchLifecycleConsumer(
  nativeShapeGate.batchLifecycleConsumer
);
assertNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectsForgery(
  nativeShapeGate.batchLifecycleConsumer,
  nativeShapeGate.jsonTransportSmoke.parserGate.batchedRecordGate,
  nativeShapeGate.rustHandleTableAdmissionSmoke
);
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
  assertNativeRootBridgeJsonTransportParserGate(smoke.parserGate, expected);

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

function assertNativeRootBridgeJsonTransportParserGate(parserGate, expected) {
  assert.equal(Object.isFrozen(parserGate), true);
  assert.equal(Object.isFrozen(parserGate.decodedRequestRecords), true);
  assert.equal(Object.isFrozen(parserGate.deterministicParseErrors), true);
  assert.equal(Object.isFrozen(parserGate.deterministicErrorRows), true);
  assert.equal(Object.isFrozen(parserGate.batchedRecordGate), true);
  assert.equal(
    parserGate.parserGateStatus,
    'parsed-native-root-bridge-json-transport-schema'
  );
  assert.equal(parserGate.transport, 'json');
  assert.equal(parserGate.schemaVersion, 1);
  assert.equal(parserGate.requestCount, 3);
  assert.equal(parserGate.nativeAddonLoaded, false);
  assert.equal(parserGate.nativeExecution, false);
  assert.equal(parserGate.rendererExecution, false);
  assert.equal(parserGate.reconcilerExecution, false);
  assert.equal(
    parserGate.jsonTransportEnvelopeFields,
    native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
      .jsonTransportEnvelopeFields
  );
  assert.equal(
    parserGate.jsonTransportRequestRecordFields,
    native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
      .jsonTransportRequestRecordFields
  );
  assert.equal(
    parserGate.jsonTransportHandleFields,
    native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
      .jsonTransportHandleFields
  );
  assert.equal(
    parserGate.parseErrorCodes,
    native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
      .parseErrorCodes
  );
  assert.equal(
    parserGate.jsonTransportErrorDiagnosticRowFields,
    native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
      .jsonTransportErrorDiagnosticRowFields
  );
  assert.equal(
    parserGate.jsonTransportErrorDiagnosticCaseIds,
    native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
      .jsonTransportErrorDiagnosticCaseIds
  );
  assertNativeRootBridgeBatchedJsonTransportGate(parserGate.batchedRecordGate);
  assert.deepEqual(
    parserGate.decodedRequestRecords.map((record) => record.kind),
    ['create', 'render', 'unmount']
  );
  assert.deepEqual(parserGate.decodedRequestRecords[0], {
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
    parserGate.deterministicParseErrors.map((error) => error.id),
    [
      'invalid-json',
      'non-object-envelope',
      'missing-request-records',
      'unexpected-envelope-field',
      'request-records-not-array',
      'unsupported-transport',
      'unknown-request-kind'
    ]
  );
  assert.deepEqual(
    parserGate.deterministicParseErrors.map((error) => error.code),
    [
      parserGate.parseErrorCodes.invalidJson,
      parserGate.parseErrorCodes.expectedObject,
      parserGate.parseErrorCodes.missingField,
      parserGate.parseErrorCodes.unexpectedField,
      parserGate.parseErrorCodes.invalidFieldType,
      parserGate.parseErrorCodes.unsupportedFieldValue,
      parserGate.parseErrorCodes.unsupportedFieldValue
    ]
  );
  for (const error of parserGate.deterministicParseErrors) {
    assert.equal(Object.isFrozen(error), true);
    assert.equal(Object.isFrozen(error.details), true);
    assert.equal(error.name, 'FastReactNativeJsonTransportParserError');
    assert.equal(error.nativeAddonLoaded, false);
    assert.equal(error.nativeExecution, false);
    assert.equal(error.rendererExecution, false);
    assert.equal(error.reconcilerExecution, false);
  }
  assert.deepEqual(
    parserGate.deterministicErrorRows.map((row) => row.id),
    [
      'malformed-payload',
      'wrong-environment-root-handle',
      'stale-value-handle-generation',
      'render-before-create-lifecycle-order'
    ]
  );
  assert.deepEqual(
    parserGate.deterministicErrorRows.map((row) => row.category),
    [
      'malformed-payload',
      'wrong-environment',
      'stale-handle',
      'lifecycle-order'
    ]
  );
  assert.deepEqual(
    parserGate.deterministicErrorRows.map((row) => row.phase),
    ['parse', 'validation', 'validation', 'validation']
  );
  assert.deepEqual(
    parserGate.deterministicErrorRows.map((row) => row.code),
    [
      parserGate.parseErrorCodes.invalidJson,
      'FAST_REACT_NAPI_WRONG_ENVIRONMENT',
      'FAST_REACT_NAPI_STALE_HANDLE',
      'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE'
    ]
  );
  assert.deepEqual(
    parserGate.deterministicErrorRows.map((row) => row.sourceErrorCode),
    [
      null,
      'FAST_REACT_NAPI_WRONG_ENVIRONMENT',
      'FAST_REACT_NAPI_STALE_HANDLE',
      'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE'
    ]
  );
  assert.deepEqual(
    parserGate.deterministicErrorRows.map((row) => row.boundaryErrorCode),
    [
      null,
      'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_ENVIRONMENT',
      'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
      'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER'
    ]
  );
  for (const row of parserGate.deterministicErrorRows) {
    assert.equal(Object.isFrozen(row), true);
    assert.deepEqual(
      Object.keys(row),
      parserGate.jsonTransportErrorDiagnosticRowFields
    );
    assert.equal(row.nativeAddonLoaded, false);
    assert.equal(row.nativeExecution, false);
    assert.equal(row.rendererExecution, false);
    assert.equal(row.reconcilerExecution, false);
    assert.equal(row.reactBehaviorError, false);
  }
}

function assertNativeRootBridgeBatchedJsonTransportGate(batchGate) {
  assert.equal(Object.isFrozen(batchGate.lifecycleRows), true);
  assert.equal(Object.isFrozen(batchGate.errorRows), true);
  assert.equal(
    batchGate.batchGateStatus,
    'validated-native-root-bridge-batched-json-transport-records'
  );
  assert.equal(
    batchGate.validationModel,
    'fast-react-napi.NativeRootBridgeRequestSequenceValidator'
  );
  assert.equal(batchGate.requestCount, 3);
  assert.equal(
    batchGate.lifecycleStates,
    native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
      .batchedRecordGate.lifecycleStates
  );
  assert.equal(
    batchGate.lifecycleStatuses,
    native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
      .batchedRecordGate.lifecycleStatuses
  );
  assert.equal(
    batchGate.jsonTransportBatchLifecycleRowFields,
    native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
      .batchedRecordGate.jsonTransportBatchLifecycleRowFields
  );
  assert.equal(
    batchGate.jsonTransportBatchErrorCaseIds,
    native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
      .batchedRecordGate.jsonTransportBatchErrorCaseIds
  );
  assert.equal(Object.isFrozen(batchGate.responseSequenceGate), true);
  assertNativeRootBridgeBatchResponseSequenceGate(
    batchGate.responseSequenceGate
  );
  assert.deepEqual(
    batchGate.lifecycleRows.map((row) => row.id),
    ['batch-record-0-create', 'batch-record-1-render', 'batch-record-2-unmount']
  );
  assert.deepEqual(
    batchGate.lifecycleRows.map((row) => row.batchIndex),
    [0, 1, 2]
  );
  assert.deepEqual(
    batchGate.lifecycleRows.map((row) => row.requestId),
    [1, 2, 3]
  );
  assert.deepEqual(
    batchGate.lifecycleRows.map((row) => row.kind),
    ['create', 'render', 'unmount']
  );
  assert.deepEqual(
    batchGate.lifecycleRows.map((row) => row.lifecycleBefore),
    ['none', 'active', 'active']
  );
  assert.deepEqual(
    batchGate.lifecycleRows.map((row) => row.lifecycleAfter),
    ['active', 'active', 'retired']
  );
  assert.deepEqual(
    batchGate.lifecycleRows.map((row) => row.lifecycleTransition),
    ['none->active', 'active->active', 'active->retired']
  );
  assert.deepEqual(
    batchGate.lifecycleRows.map((row) => row.status),
    ['accepted', 'accepted', 'accepted']
  );
  assert.deepEqual(
    batchGate.lifecycleRows.map((row) => row.code),
    [null, null, null]
  );
  assert.deepEqual(batchGate.lifecycleRows[0], {
    id: 'batch-record-0-create',
    batchIndex: 0,
    requestId: 1,
    kind: 'create',
    lifecycleBefore: 'none',
    lifecycleAfter: 'active',
    lifecycleTransition: 'none->active',
    status: 'accepted',
    code: null,
    sourceErrorCode: null,
    boundaryErrorCode: null,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  });
  assert.deepEqual(
    batchGate.errorRows.map((row) => row.id),
    [
      'batch-render-before-create-lifecycle-order',
      'batch-root-handle-state-mismatch',
      'batch-create-after-create-lifecycle-order',
      'batch-request-after-unmount-lifecycle-order',
      'batch-request-id-out-of-order'
    ]
  );
  assert.deepEqual(
    batchGate.errorRows.map((row) => row.batchIndex),
    [0, 0, 1, 2, 1]
  );
  assert.deepEqual(
    batchGate.errorRows.map((row) => row.lifecycleBefore),
    ['none', 'none', 'active', 'retired', 'active']
  );
  assert.deepEqual(
    batchGate.errorRows.map((row) => row.lifecycleAfter),
    ['none', 'none', 'active', 'retired', 'active']
  );
  assert.deepEqual(
    batchGate.errorRows.map((row) => row.code),
    [
      'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE',
      'FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_STATE_MISMATCH',
      'FAST_REACT_NAPI_ROOT_REQUEST_CREATE_AFTER_ROOT_CREATED',
      'FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT',
      'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_OUT_OF_ORDER'
    ]
  );
  assert.deepEqual(
    batchGate.errorRows.map((row) => row.boundaryErrorCode),
    [
      'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER',
      'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER',
      'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER',
      'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER',
      'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER'
    ]
  );
  for (const row of [...batchGate.lifecycleRows, ...batchGate.errorRows]) {
    assert.equal(Object.isFrozen(row), true);
    assert.deepEqual(
      Object.keys(row),
      batchGate.jsonTransportBatchLifecycleRowFields
    );
    assert.equal(row.nativeAddonLoaded, false);
    assert.equal(row.nativeExecution, false);
    assert.equal(row.rendererExecution, false);
    assert.equal(row.reconcilerExecution, false);
    assert.equal(row.reactBehaviorError, false);
  }
}

function assertNativeRootBridgeBatchResponseSequenceGate(responseGate) {
  const staticResponseGate =
    native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
      .batchedRecordGate.responseSequenceGate;

  assert.equal(Object.isFrozen(responseGate.rows), true);
  assert.equal(Object.isFrozen(responseGate.errorRows), true);
  assert.equal(
    responseGate.responseSequenceGateStatus,
    'diagnosed-native-root-bridge-json-batch-response-sequence'
  );
  assert.equal(responseGate.batchId, 'native-root-bridge-json-batch-552');
  assert.equal(
    responseGate.validationModel,
    'fast-react-napi.NativeRootBridgeRequestSequenceValidator'
  );
  assert.equal(responseGate.requestCount, 3);
  assert.equal(responseGate.responseCount, 3);
  assert.equal(responseGate.errorRowCount, 5);
  assert.equal(
    responseGate.jsonTransportBatchResponseSequenceRowFields,
    staticResponseGate.jsonTransportBatchResponseSequenceRowFields
  );
  assert.equal(
    responseGate.errorRowStatuses,
    staticResponseGate.errorRowStatuses
  );
  assert.equal(responseGate.teardownStates, staticResponseGate.teardownStates);
  assert.equal(Object.isFrozen(responseGate.streamRoundtripGate), true);
  assertNativeRootBridgeJsonTransportStreamBatchRoundtripGate(
    responseGate.streamRoundtripGate
  );
  assert.deepEqual(
    responseGate.rows.map((row) => row.id),
    [
      'batch-response-0-create',
      'batch-response-1-render',
      'batch-response-2-unmount'
    ]
  );
  assert.deepEqual(
    responseGate.rows.map((row) => row.batchId),
    [
      'native-root-bridge-json-batch-552',
      'native-root-bridge-json-batch-552',
      'native-root-bridge-json-batch-552'
    ]
  );
  assert.deepEqual(
    responseGate.rows.map((row) => row.requestOrder),
    [0, 1, 2]
  );
  assert.deepEqual(
    responseGate.rows.map((row) => row.responseOrder),
    [0, 1, 2]
  );
  assert.deepEqual(
    responseGate.rows.map((row) => row.requestId),
    [1, 2, 3]
  );
  assert.deepEqual(
    responseGate.rows.map((row) => row.responseStatus),
    ['accepted', 'accepted', 'accepted']
  );
  assert.deepEqual(
    responseGate.rows.map((row) => row.errorRowStatus),
    ['not-error-row', 'not-error-row', 'not-error-row']
  );
  assert.deepEqual(
    responseGate.rows.map((row) => row.teardownState),
    ['root-active', 'root-active', 'root-retired']
  );
  assert.deepEqual(
    responseGate.errorRows.map((row) => row.id),
    [
      'batch-render-before-create-lifecycle-order',
      'batch-root-handle-state-mismatch',
      'batch-create-after-create-lifecycle-order',
      'batch-request-after-unmount-lifecycle-order',
      'batch-request-id-out-of-order'
    ]
  );
  assert.deepEqual(
    responseGate.errorRows.map((row) => row.requestOrder),
    [0, 0, 1, 2, 1]
  );
  assert.deepEqual(
    responseGate.errorRows.map((row) => row.responseOrder),
    [0, 1, 2, 3, 4]
  );
  assert.deepEqual(
    responseGate.errorRows.map((row) => row.errorRowStatus),
    [
      'deterministic-error-row',
      'deterministic-error-row',
      'deterministic-error-row',
      'deterministic-error-row',
      'deterministic-error-row'
    ]
  );
  assert.deepEqual(
    responseGate.errorRows.map((row) => row.teardownState),
    [
      'root-uninitialized',
      'root-uninitialized',
      'root-active',
      'root-retired',
      'root-active'
    ]
  );
  assert.deepEqual(
    responseGate.errorRows.map((row) => row.code),
    [
      'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE',
      'FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_STATE_MISMATCH',
      'FAST_REACT_NAPI_ROOT_REQUEST_CREATE_AFTER_ROOT_CREATED',
      'FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT',
      'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_OUT_OF_ORDER'
    ]
  );
  for (const row of [...responseGate.rows, ...responseGate.errorRows]) {
    assert.equal(Object.isFrozen(row), true);
    assert.deepEqual(
      Object.keys(row),
      responseGate.jsonTransportBatchResponseSequenceRowFields
    );
    assert.equal(row.nativeAddonLoaded, false);
    assert.equal(row.nativeExecution, false);
    assert.equal(row.rendererExecution, false);
    assert.equal(row.reconcilerExecution, false);
    assert.equal(row.reactBehaviorError, false);
  }
  assert.equal(responseGate.nativeAddonLoaded, false);
  assert.equal(responseGate.nativeExecution, false);
  assert.equal(responseGate.rendererExecution, false);
  assert.equal(responseGate.reconcilerExecution, false);
  assert.equal(responseGate.reactBehaviorError, false);
}

function assertNativeRootBridgeJsonTransportStreamBatchRoundtripGate(
  streamGate
) {
  const staticStreamGate =
    native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
      .batchedRecordGate.responseSequenceGate.streamRoundtripGate;

  assert.equal(Object.isFrozen(streamGate.rows), true);
  assert.equal(Object.isFrozen(streamGate.errorRows), true);
  assert.equal(
    streamGate.streamRoundtripGateStatus,
    'diagnosed-native-root-bridge-json-stream-batch-roundtrip'
  );
  assert.equal(streamGate.batchId, 'native-root-bridge-json-batch-552');
  assert.equal(
    streamGate.streamId,
    'native-root-bridge-json-stream-batch-roundtrip-587'
  );
  assert.equal(
    streamGate.validationModel,
    'fast-react-napi.NativeRootBridgeRequestSequenceValidator'
  );
  assert.equal(streamGate.requestCount, 3);
  assert.equal(streamGate.chunkCount, 6);
  assert.equal(streamGate.assembledResponseCount, 3);
  assert.equal(streamGate.errorRowCount, 4);
  assert.equal(
    streamGate.jsonTransportStreamBatchRoundtripChunkRowFields,
    staticStreamGate.jsonTransportStreamBatchRoundtripChunkRowFields
  );
  assert.equal(
    streamGate.jsonTransportStreamBatchRoundtripErrorCaseIds,
    staticStreamGate.jsonTransportStreamBatchRoundtripErrorCaseIds
  );
  assert.equal(streamGate.chunkKinds, staticStreamGate.chunkKinds);
  assert.equal(streamGate.chunkStatuses, staticStreamGate.chunkStatuses);
  assert.equal(streamGate.assemblyStates, staticStreamGate.assemblyStates);
  assert.equal(streamGate.teardownBlockers, staticStreamGate.teardownBlockers);
  assert.deepEqual(
    streamGate.rows.map((row) => row.id),
    [
      'stream-batch-chunk-0-request-1-metadata',
      'stream-batch-chunk-1-request-1-payload',
      'stream-batch-chunk-2-request-2-metadata',
      'stream-batch-chunk-3-request-2-payload',
      'stream-batch-chunk-4-request-3-metadata',
      'stream-batch-chunk-5-request-3-payload'
    ]
  );
  assert.deepEqual(
    streamGate.rows.map((row) => row.requestId),
    [1, 1, 2, 2, 3, 3]
  );
  assert.deepEqual(
    streamGate.rows.map((row) => row.requestOrder),
    [0, 0, 1, 1, 2, 2]
  );
  assert.deepEqual(
    streamGate.rows.map((row) => row.responseOrder),
    [0, 0, 1, 1, 2, 2]
  );
  assert.deepEqual(
    streamGate.rows.map((row) => row.chunkOrder),
    [0, 1, 0, 1, 0, 1]
  );
  assert.deepEqual(
    streamGate.rows.map((row) => row.batchSequence),
    [0, 1, 2, 3, 4, 5]
  );
  assert.deepEqual(
    streamGate.rows.map((row) => row.chunkKind),
    ['metadata', 'payload', 'metadata', 'payload', 'metadata', 'payload']
  );
  assert.deepEqual(
    streamGate.rows.map((row) => row.chunkStatus),
    ['accepted', 'accepted', 'accepted', 'accepted', 'accepted', 'accepted']
  );
  assert.deepEqual(
    streamGate.rows.map((row) => row.assemblyState),
    ['partial', 'assembled', 'partial', 'assembled', 'partial', 'assembled']
  );
  assert.deepEqual(
    streamGate.rows.map((row) => row.assembledResponse),
    [false, true, false, true, false, true]
  );
  assert.deepEqual(
    streamGate.rows.map((row) => row.teardownState),
    [
      'root-active',
      'root-active',
      'root-active',
      'root-active',
      'root-active',
      'root-retired'
    ]
  );
  assert.deepEqual(
    streamGate.rows.map((row) => row.teardownBlocker),
    [
      'none',
      'none',
      'none',
      'none',
      'none',
      'root-retired-after-assembly'
    ]
  );
  assert.deepEqual(
    streamGate.errorRows.map((row) => row.id),
    [
      'stream-chunk-out-of-order',
      'stream-chunk-duplicate',
      'stream-chunk-missing',
      'stream-chunk-after-teardown'
    ]
  );
  assert.deepEqual(
    streamGate.errorRows.map((row) => row.requestId),
    [1, 1, 1, 4]
  );
  assert.deepEqual(
    streamGate.errorRows.map((row) => row.responseOrder),
    [0, 0, 0, 3]
  );
  assert.deepEqual(
    streamGate.errorRows.map((row) => row.chunkOrder),
    [1, 0, 1, 0]
  );
  assert.deepEqual(
    streamGate.errorRows.map((row) => row.batchSequence),
    [0, 1, 1, 6]
  );
  assert.deepEqual(
    streamGate.errorRows.map((row) => row.chunkKind),
    ['payload', 'metadata', 'payload', 'metadata']
  );
  assert.deepEqual(
    streamGate.errorRows.map((row) => row.chunkStatus),
    ['error', 'error', 'error', 'error']
  );
  assert.deepEqual(
    streamGate.errorRows.map((row) => row.assemblyState),
    ['rejected', 'rejected', 'rejected', 'rejected']
  );
  assert.deepEqual(
    streamGate.errorRows.map((row) => row.teardownBlocker),
    ['none', 'none', 'none', 'post-teardown-chunk-blocked']
  );
  assert.deepEqual(
    streamGate.errorRows.map((row) => row.code),
    [
      'FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_CHUNK_OUT_OF_ORDER',
      'FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_DUPLICATE_CHUNK',
      'FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_MISSING_CHUNK',
      'FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_CHUNK_AFTER_TEARDOWN'
    ]
  );
  for (const row of [...streamGate.rows, ...streamGate.errorRows]) {
    assert.equal(Object.isFrozen(row), true);
    assert.deepEqual(
      Object.keys(row),
      streamGate.jsonTransportStreamBatchRoundtripChunkRowFields
    );
    assert.equal(row.nativeAddonLoaded, false);
    assert.equal(row.nativeExecution, false);
    assert.equal(row.rendererExecution, false);
    assert.equal(row.reconcilerExecution, false);
    assert.equal(row.crossEnvironmentHandleReuseBlocked, true);
    assert.equal(row.publicNativeCompatibility, false);
    assert.equal(row.reactBehaviorError, false);
  }
  assert.equal(streamGate.nativeAddonLoaded, false);
  assert.equal(streamGate.nativeExecution, false);
  assert.equal(streamGate.rendererExecution, false);
  assert.equal(streamGate.reconcilerExecution, false);
  assert.equal(streamGate.crossEnvironmentHandleReuseBlocked, true);
  assert.equal(streamGate.publicNativeCompatibility, false);
  assert.equal(streamGate.reactBehaviorError, false);
}

function assertNativeRootBridgeCrossEnvironmentTeardownGate(teardownGate) {
  assert.equal(Object.isFrozen(teardownGate), true);
  assert.equal(Object.isFrozen(teardownGate.environmentTeardownFields), true);
  assert.equal(Object.isFrozen(teardownGate.teardownDiagnosticRowFields), true);
  assert.equal(Object.isFrozen(teardownGate.mismatchedTeardown), true);
  assert.equal(Object.isFrozen(teardownGate.matchedTeardown), true);
  assert.equal(Object.isFrozen(teardownGate.rows), true);
  assert.equal(
    teardownGate.teardownGateStatus,
    'diagnosed-native-root-bridge-cross-environment-teardown-isolation'
  );
  assert.equal(
    teardownGate.handleTableModel,
    'fast-react-napi.BridgeHandleTable'
  );
  assert.equal(
    teardownGate.environmentTeardownFields,
    native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate
      .environmentTeardownFields
  );
  assert.equal(
    teardownGate.teardownDiagnosticRowFields,
    native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate
      .teardownDiagnosticRowFields
  );
  assert.deepEqual(
    teardownGate.environmentTeardownFields,
    expectedNativeRootBridgeEnvironmentTeardownFields
  );
  assert.deepEqual(
    teardownGate.teardownDiagnosticRowFields,
    expectedNativeRootBridgeCrossEnvironmentTeardownRowFields
  );
  assert.deepEqual(teardownGate.mismatchedTeardown, {
    requestedEnvironmentId: 1496,
    tableEnvironmentId: 496,
    environmentMatched: false,
    rootHandlesInvalidated: 0,
    valueHandlesInvalidated: 0,
    totalHandlesInvalidated: 0,
    toreDownHandles: false
  });
  assert.deepEqual(teardownGate.matchedTeardown, {
    requestedEnvironmentId: 496,
    tableEnvironmentId: 496,
    environmentMatched: true,
    rootHandlesInvalidated: 1,
    valueHandlesInvalidated: 1,
    totalHandlesInvalidated: 2,
    toreDownHandles: true
  });
  assert.deepEqual(
    teardownGate.rows.map((row) => row.id),
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
    teardownGate.rows.map((row) => row.errorCode),
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
  assert.deepEqual(
    teardownGate.rows.map((row) => row.currentGeneration),
    [1, 1, 2, 2, null, null, 1, 1, 2, 2, 2, 2]
  );
  assert.deepEqual(
    teardownGate.rows.map((row) => row.rejectedByHandleTable),
    [
      false,
      false,
      true,
      true,
      true,
      true,
      false,
      false,
      true,
      true,
      false,
      false
    ]
  );
  assert.deepEqual(
    teardownGate.rows[10],
    expectedNativeRootBridgeCrossEnvironmentTeardownRows[10]
  );
  for (const row of teardownGate.rows) {
    assert.equal(Object.isFrozen(row), true);
    assert.deepEqual(
      Object.keys(row),
      teardownGate.teardownDiagnosticRowFields
    );
    assert.equal(row.nativeAddonLoaded, false);
    assert.equal(row.nativeExecution, false);
    assert.equal(row.rendererExecution, false);
    assert.equal(row.reconcilerExecution, false);
    assert.equal(row.reactBehaviorError, false);
  }
  assert.equal(teardownGate.nativeAddonLoaded, false);
  assert.equal(teardownGate.nativeExecution, false);
  assert.equal(teardownGate.rendererExecution, false);
  assert.equal(teardownGate.reconcilerExecution, false);
  assert.equal(teardownGate.reactBehaviorError, false);
}

function assertNativeRootBridgeTransportWorkerThreadTeardownGate(workerGate) {
  assert.equal(Object.isFrozen(workerGate), true);
  assert.equal(Object.isFrozen(workerGate.environmentTeardownFields), true);
  assert.equal(
    Object.isFrozen(workerGate.workerThreadTeardownDiagnosticRowFields),
    true
  );
  assert.equal(Object.isFrozen(workerGate.mismatchedTeardown), true);
  assert.equal(Object.isFrozen(workerGate.matchedTeardown), true);
  assert.equal(Object.isFrozen(workerGate.rows), true);
  assert.equal(
    workerGate.workerThreadTeardownGateStatus,
    'diagnosed-native-root-bridge-transport-worker-thread-teardown'
  );
  assert.equal(workerGate.transport, 'json');
  assert.equal(workerGate.workerThreadId, 524);
  assert.equal(workerGate.workerEnvironmentId, 524);
  assert.equal(workerGate.peerEnvironmentId, 1524);
  assert.equal(
    workerGate.validationModel,
    'fast-react-napi.NativeRootBridgeRequestSequenceValidator'
  );
  assert.equal(workerGate.handleTableModel, 'fast-react-napi.BridgeHandleTable');
  assert.equal(
    workerGate.batchGateStatus,
    'validated-native-root-bridge-batched-json-transport-records'
  );
  assert.equal(
    workerGate.crossEnvironmentTeardownGateStatus,
    'diagnosed-native-root-bridge-cross-environment-teardown-isolation'
  );
  assert.deepEqual(
    workerGate.environmentTeardownFields,
    expectedNativeRootBridgeEnvironmentTeardownFields
  );
  assert.deepEqual(
    workerGate.workerThreadTeardownDiagnosticRowFields,
    expectedNativeRootBridgeTransportWorkerThreadTeardownRowFields
  );
  assert.deepEqual(workerGate.mismatchedTeardown, {
    requestedEnvironmentId: 524,
    tableEnvironmentId: 1524,
    environmentMatched: false,
    rootHandlesInvalidated: 0,
    valueHandlesInvalidated: 0,
    totalHandlesInvalidated: 0,
    toreDownHandles: false
  });
  assert.deepEqual(workerGate.matchedTeardown, {
    requestedEnvironmentId: 524,
    tableEnvironmentId: 524,
    environmentMatched: true,
    rootHandlesInvalidated: 1,
    valueHandlesInvalidated: 2,
    totalHandlesInvalidated: 3,
    toreDownHandles: true
  });
  assert.deepEqual(
    workerGate.rows.map((row) => row.id),
    [
      'worker-root-stale-after-thread-teardown',
      'worker-create-value-stale-after-thread-teardown',
      'worker-render-value-stale-after-thread-teardown',
      'peer-root-active-after-worker-thread-teardown'
    ]
  );
  assert.deepEqual(
    workerGate.rows.map((row) => row.sourceBatchIndex),
    [0, 0, 1, null]
  );
  assert.deepEqual(
    workerGate.rows.map((row) => row.requestId),
    [1, 1, 2, null]
  );
  assert.deepEqual(
    workerGate.rows.map((row) => row.handleKind),
    ['root', 'value', 'value', 'root']
  );
  assert.deepEqual(
    workerGate.rows.map((row) => row.currentGeneration),
    [2, 2, 2, 1]
  );
  assert.deepEqual(
    workerGate.rows.map((row) => row.recordId),
    [null, null, null, 152401]
  );
  assert.deepEqual(
    workerGate.rows.map((row) => row.errorCode),
    [
      'FAST_REACT_NAPI_STALE_HANDLE',
      'FAST_REACT_NAPI_STALE_HANDLE',
      'FAST_REACT_NAPI_STALE_HANDLE',
      null
    ]
  );
  assert.deepEqual(
    workerGate.rows.map((row) => row.boundaryErrorCode),
    [
      'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
      'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
      'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
      null
    ]
  );
  assert.deepEqual(
    workerGate.rows[3],
    expectedNativeRootBridgeTransportWorkerThreadTeardownRows[3]
  );
  for (const row of workerGate.rows) {
    assert.equal(Object.isFrozen(row), true);
    assert.deepEqual(
      Object.keys(row),
      workerGate.workerThreadTeardownDiagnosticRowFields
    );
    assert.equal(row.nativeAddonLoaded, false);
    assert.equal(row.nativeExecution, false);
    assert.equal(row.rendererExecution, false);
    assert.equal(row.reconcilerExecution, false);
    assert.equal(row.reactBehaviorError, false);
  }
  assert.equal(workerGate.nativeAddonLoaded, false);
  assert.equal(workerGate.nativeExecution, false);
  assert.equal(workerGate.rendererExecution, false);
  assert.equal(workerGate.reconcilerExecution, false);
  assert.equal(workerGate.publicNativeCompatibility, false);
  assert.equal(workerGate.reactBehaviorError, false);
}

function assertNativeRootBridgeWorkerThreadTeardownExecutablePreflight(
  preflight
) {
  assert.equal(Object.isFrozen(preflight), true);
  assert.equal(Object.isFrozen(preflight.environmentTeardownFields), true);
  assert.equal(Object.isFrozen(preflight.executablePreflightRowFields), true);
  assert.equal(Object.isFrozen(preflight.mismatchedTeardown), true);
  assert.equal(Object.isFrozen(preflight.matchedTeardown), true);
  assert.equal(Object.isFrozen(preflight.rows), true);
  assert.deepEqual(
    preflight,
    expectedNativeRootBridgeWorkerThreadTeardownExecutablePreflight
  );
  assert.equal(
    preflight.preflightStatus,
    'preflighted-native-root-bridge-worker-thread-teardown-boundary'
  );
  assert.equal(
    preflight.model,
    'fast-react-napi.WorkerThreadTeardownPreflight'
  );
  assert.equal(
    preflight.executionScope,
    'rust-only-handle-table-preflight-no-node-worker-thread-no-napi-cleanup-hook'
  );
  assert.equal(preflight.transport, 'json');
  assert.equal(preflight.workerThreadId, 764);
  assert.equal(preflight.workerEnvironmentId, 764);
  assert.equal(preflight.peerEnvironmentId, 1764);
  assert.equal(
    preflight.transportWorkerThreadTeardownGateStatus,
    native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
      .workerThreadTeardownGateStatus
  );
  assert.equal(
    preflight.batchedRecordGateStatus,
    'validated-native-root-bridge-batched-json-transport-records'
  );
  assert.equal(
    preflight.crossEnvironmentTeardownGateStatus,
    native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate
      .teardownGateStatus
  );
  assert.equal(
    preflight.crossEnvironmentTeardownRowCount,
    native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate.rows.length
  );
  assert.deepEqual(
    preflight.environmentTeardownFields,
    expectedNativeRootBridgeEnvironmentTeardownFields
  );
  assert.deepEqual(
    preflight.executablePreflightRowFields,
    expectedNativeRootBridgeWorkerThreadTeardownExecutablePreflightRowFields
  );
  assert.deepEqual(preflight.mismatchedTeardown, {
    requestedEnvironmentId: 764,
    tableEnvironmentId: 1764,
    environmentMatched: false,
    rootHandlesInvalidated: 0,
    valueHandlesInvalidated: 0,
    totalHandlesInvalidated: 0,
    toreDownHandles: false
  });
  assert.deepEqual(preflight.matchedTeardown, {
    requestedEnvironmentId: 764,
    tableEnvironmentId: 764,
    environmentMatched: true,
    rootHandlesInvalidated: 1,
    valueHandlesInvalidated: 2,
    totalHandlesInvalidated: 3,
    toreDownHandles: true
  });
  assert.equal(preflight.acceptedBatchRecordCount, 2);
  assert.equal(preflight.staleWorkerHandleRejectionCount, 3);
  assert.equal(preflight.activePeerHandleCount, 2);
  assert.equal(preflight.rootValidatorStatePreserved, true);
  assert.equal(preflight.preflightEvaluated, true);

  const rejectedRows = preflight.rows.filter((row) => row.rejectedByBoundary);
  const peerRows = preflight.rows.filter((row) => row.peerInvariantPreserved);
  assert.equal(rejectedRows.length, preflight.staleWorkerHandleRejectionCount);
  assert.equal(peerRows.length, preflight.activePeerHandleCount);
  assert.deepEqual(
    preflight.rows.map((row) => row.id),
    [
      'worker-render-root-stale-executable-preflight',
      'worker-create-value-stale-executable-preflight',
      'worker-render-value-stale-executable-preflight',
      'peer-root-active-executable-preflight',
      'peer-value-active-executable-preflight'
    ]
  );
  assert.deepEqual(
    rejectedRows.map((row) => row.sourceErrorCode),
    [
      'FAST_REACT_NAPI_STALE_HANDLE',
      'FAST_REACT_NAPI_STALE_HANDLE',
      'FAST_REACT_NAPI_STALE_HANDLE'
    ]
  );
  assert.deepEqual(
    rejectedRows.map((row) => row.boundaryErrorCode),
    [
      'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
      'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
      'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE'
    ]
  );
  assert.deepEqual(
    rejectedRows.map((row) => row.preflightPassed),
    [true, true, true]
  );
  assert.deepEqual(
    peerRows.map((row) => row.recordId),
    [176401, 176402]
  );
  assert.deepEqual(
    peerRows.map((row) => row.slot),
    [1, 2]
  );
  assert.deepEqual(
    peerRows.map((row) => row.rejectedByBoundary),
    [false, false]
  );
  assert.deepEqual(
    preflight.rows[0],
    expectedNativeRootBridgeWorkerThreadTeardownExecutablePreflightRows[0]
  );

  for (const row of preflight.rows) {
    assert.equal(Object.isFrozen(row), true);
    assert.deepEqual(Object.keys(row), preflight.executablePreflightRowFields);
    assert.equal(row.nodeWorkerThreadsExecution, false);
    assert.equal(row.napiCleanupHookExecution, false);
    assert.equal(row.nativeAddonLoaded, false);
    assert.equal(row.nativeExecution, false);
    assert.equal(row.rendererExecution, false);
    assert.equal(row.reconcilerExecution, false);
    assert.equal(row.publicNativeCompatibility, false);
    assert.equal(row.reactBehaviorError, false);
  }
  assert.equal(preflight.nodeWorkerThreadsExecution, false);
  assert.equal(preflight.napiCleanupHookExecution, false);
  assert.equal(preflight.nativeAddonLoaded, false);
  assert.equal(preflight.nativeExecution, false);
  assert.equal(preflight.rendererExecution, false);
  assert.equal(preflight.reconcilerExecution, false);
  assert.equal(preflight.publicNativeCompatibility, false);
  assert.equal(preflight.reactBehaviorError, false);
}

function assertNativeRootBridgeWorkerThreadTeardownExecutablePreflightRejectsForgery(
  preflight
) {
  assert.throws(
    () => {
      preflight.rows[0].sourceErrorCode = null;
    },
    {
      name: 'TypeError'
    }
  );
  assert.throws(
    () =>
      assertNativeRootBridgeWorkerThreadTeardownExecutablePreflight(
        Object.freeze({
          ...preflight,
          rows: Object.freeze([
            Object.freeze({
              ...preflight.rows[0],
              rejectedByBoundary: false,
              sourceErrorCode: null
            }),
            ...preflight.rows.slice(1)
          ])
        })
      ),
    {
      name: 'AssertionError'
    }
  );
  assert.throws(
    () =>
      assertNativeRootBridgeWorkerThreadTeardownExecutablePreflight(
        Object.freeze({
          ...preflight,
          publicNativeCompatibility: true
        })
      ),
    {
      name: 'AssertionError'
    }
  );
}

function assertNativeRootBridgeWorkerThreadCleanupHookPreflight(preflight) {
  assert.equal(Object.isFrozen(preflight), true);
  assert.equal(Object.isFrozen(preflight.cleanupHookPreflightRowFields), true);
  assert.equal(Object.isFrozen(preflight.rows), true);
  assert.deepEqual(
    preflight,
    expectedNativeRootBridgeWorkerThreadCleanupHookPreflight
  );
  assert.equal(
    preflight.preflightStatus,
    'preflighted-native-root-bridge-worker-thread-cleanup-hook-order'
  );
  assert.equal(
    preflight.model,
    'fast-react-napi.WorkerThreadCleanupHookOrderPreflight'
  );
  assert.equal(
    preflight.executionScope,
    'rust-only-cleanup-hook-order-preflight-no-node-worker-thread-no-napi-cleanup-hook-execution'
  );
  assert.equal(
    preflight.sourceExecutablePreflightStatus,
    native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
      .preflightStatus
  );
  assert.equal(preflight.workerThreadId, 764);
  assert.equal(preflight.workerEnvironmentId, 764);
  assert.equal(preflight.peerEnvironmentId, 1764);
  assert.equal(preflight.canonicalExecutableEvidenceRequired, true);
  assert.equal(preflight.canonicalExecutableEvidenceAccepted, true);
  assert.equal(preflight.cleanupHookRegistrationCount, 2);
  assert.equal(
    preflight.cleanupHookExecutionOrder,
    'reverse-registration-order'
  );
  assert.equal(preflight.acceptedCleanupEvidenceCount, 2);
  assert.equal(preflight.rejectedCleanupEvidenceCount, 2);
  assert.equal(preflight.staleOrForgedCleanupEvidenceRejectionCount, 2);
  assert.equal(preflight.cleanupHookOrderPrivate, true);
  assert.equal(preflight.cleanupHookIdentityPrivate, true);
  assert.deepEqual(
    preflight.cleanupHookPreflightRowFields,
    expectedNativeRootBridgeWorkerThreadCleanupHookPreflightRowFields
  );
  assert.deepEqual(
    preflight.rows.map((row) => row.id),
    [
      'cleanup-hook-worker-root-before-value-release',
      'cleanup-hook-worker-value-after-root-release',
      'cleanup-hook-stale-worker-transport-evidence-rejected',
      'cleanup-hook-forged-peer-active-evidence-rejected'
    ]
  );

  const acceptedRows = preflight.rows.filter((row) => row.status === 'accepted');
  const rejectedRows = preflight.rows.filter((row) => row.status === 'rejected');
  assert.equal(acceptedRows.length, preflight.acceptedCleanupEvidenceCount);
  assert.equal(rejectedRows.length, preflight.rejectedCleanupEvidenceCount);
  assert.deepEqual(
    acceptedRows.map((row) => row.registrationOrder),
    [2, 1]
  );
  assert.deepEqual(
    acceptedRows.map((row) => row.expectedExecutionOrder),
    [1, 2]
  );
  assert.deepEqual(
    acceptedRows.map((row) => row.observedExecutionOrder),
    [1, 2]
  );
  assert.deepEqual(
    acceptedRows.map((row) => row.cleanupHookId),
    ['worker-root-handle-cleanup-hook', 'worker-value-handle-cleanup-hook']
  );
  assert.deepEqual(
    acceptedRows.map((row) => row.cleanupHookFunctionIdentityToken),
    [
      'private-cleanup-hook-fn:worker-root-handle-teardown',
      'private-cleanup-hook-fn:worker-value-handle-teardown'
    ]
  );
  assert.deepEqual(
    acceptedRows.map((row) => row.cleanupHookArgumentIdentityToken),
    [
      'private-cleanup-hook-arg:worker-764-root-slot-1',
      'private-cleanup-hook-arg:worker-764-value-slot-3'
    ]
  );
  assert.deepEqual(
    acceptedRows.map((row) => row.sourceRowId),
    [
      'worker-render-root-stale-executable-preflight',
      'worker-render-value-stale-executable-preflight'
    ]
  );
  assert.deepEqual(
    acceptedRows.map((row) => row.sourceHandleKind),
    ['root', 'value']
  );
  assert.deepEqual(
    acceptedRows.map((row) => row.canonicalExecutableEvidence),
    [true, true]
  );
  assert.deepEqual(
    rejectedRows.map((row) => row.code),
    [
      'FAST_REACT_NAPI_CLEANUP_HOOK_STALE_EXECUTABLE_PREFLIGHT',
      'FAST_REACT_NAPI_CLEANUP_HOOK_FORGED_EVIDENCE'
    ]
  );
  assert.deepEqual(
    rejectedRows.map((row) => row.sourcePreflightStatus),
    [
      'diagnosed-native-root-bridge-transport-worker-thread-teardown',
      'preflighted-native-root-bridge-worker-thread-teardown-boundary'
    ]
  );
  assert.deepEqual(
    rejectedRows.map((row) => row.sourceWorkerThreadId),
    [524, 764]
  );
  assert.deepEqual(
    rejectedRows.map((row) => row.sourceRowId),
    [
      'worker-root-stale-after-thread-teardown',
      'peer-root-active-executable-preflight'
    ]
  );
  assert.deepEqual(
    rejectedRows.map((row) => row.canonicalExecutableEvidence),
    [false, false]
  );
  assert.deepEqual(
    rejectedRows.map((row) => row.staleOrForgedCleanupEvidenceRejected),
    [true, true]
  );
  assert.deepEqual(
    rejectedRows.map((row) => row.observedExecutionOrder),
    [null, null]
  );

  for (const row of preflight.rows) {
    assert.equal(Object.isFrozen(row), true);
    assert.deepEqual(Object.keys(row), preflight.cleanupHookPreflightRowFields);
    assert.equal(row.cleanupHookOrderPrivate, true);
    assert.equal(row.cleanupHookIdentityPrivate, true);
    assert.equal(row.nodeWorkerThreadsExecution, false);
    assert.equal(row.napiCleanupHookExecution, false);
    assert.equal(row.nativeAddonLoaded, false);
    assert.equal(row.nativeExecution, false);
    assert.equal(row.rendererExecution, false);
    assert.equal(row.reconcilerExecution, false);
    assert.equal(row.publicNativeCompatibility, false);
    assert.equal(row.reactBehaviorError, false);
  }
  assert.equal(preflight.nodeWorkerThreadsExecution, false);
  assert.equal(preflight.napiCleanupHookExecution, false);
  assert.equal(preflight.nativeAddonLoaded, false);
  assert.equal(preflight.nativeExecution, false);
  assert.equal(preflight.rendererExecution, false);
  assert.equal(preflight.reconcilerExecution, false);
  assert.equal(preflight.publicNativeCompatibility, false);
  assert.equal(preflight.reactBehaviorError, false);
}

function assertNativeRootBridgeWorkerThreadCleanupHookPreflightRejectsForgery(
  preflight
) {
  assert.throws(
    () => {
      preflight.rows[0].canonicalExecutableEvidence = false;
    },
    {
      name: 'TypeError'
    }
  );
  assert.throws(
    () =>
      assertNativeRootBridgeWorkerThreadCleanupHookPreflight(
        Object.freeze({
          ...preflight,
          rows: Object.freeze([
            Object.freeze({
              ...preflight.rows[0],
              observedExecutionOrder: 2
            }),
            ...preflight.rows.slice(1)
          ])
        })
      ),
    {
      name: 'AssertionError'
    }
  );
  assert.throws(
    () =>
      assertNativeRootBridgeWorkerThreadCleanupHookPreflight(
        Object.freeze({
          ...preflight,
          publicNativeCompatibility: true
        })
      ),
    {
      name: 'AssertionError'
    }
  );
}

function assertNativeRootBridgeBatchLifecycleConsumerMetadata(consumer) {
  assert.equal(Object.isFrozen(consumer), true);
  assert.equal(Object.isFrozen(consumer.cleanupHookEvidenceStatuses), true);
  assert.equal(Object.isFrozen(consumer.batchLifecycleConsumerRowFields), true);
  assert.equal(Object.isFrozen(consumer.jsonBatchRoundtripLink), true);
  assert.deepEqual(consumer, expectedNativeRootBridgeBatchLifecycleConsumer);
  assert.equal(
    consumer.consumerStatus,
    'consumed-native-root-bridge-batch-lifecycle-records'
  );
  assert.equal(
    consumer.model,
    'fast-react-napi.NativeRootBridgeBatchLifecycleConsumer'
  );
  assert.equal(
    consumer.batchGateStatus,
    'validated-native-root-bridge-batched-json-transport-records'
  );
  assert.equal(
    consumer.cleanupHookPreflightStatus,
    'preflighted-native-root-bridge-worker-thread-cleanup-hook-order'
  );
  assert.deepEqual(
    consumer.cleanupHookEvidenceStatuses,
    ['not-required', 'accepted', 'rejected']
  );
  assert.deepEqual(
    consumer.batchLifecycleConsumerRowFields,
    expectedNativeRootBridgeBatchLifecycleConsumerRowFields
  );
  assertNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkMetadata(
    consumer.jsonBatchRoundtripLink
  );
  assert.equal(consumer.nativeAddonLoaded, false);
  assert.equal(consumer.nativeExecution, false);
  assert.equal(consumer.rendererExecution, false);
  assert.equal(consumer.reconcilerExecution, false);
  assert.equal(consumer.nodeWorkerThreadsExecution, false);
  assert.equal(consumer.napiCleanupHookExecution, false);
  assert.equal(consumer.publicNativeCompatibility, false);
  assert.equal(consumer.reactBehaviorError, false);
}

function assertNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkMetadata(
  link
) {
  assert.equal(Object.isFrozen(link), true);
  assert.equal(Object.isFrozen(link.rowStatuses), true);
  assert.equal(Object.isFrozen(link.rejectionCaseIds), true);
  assert.equal(Object.isFrozen(link.rejectionCodes), true);
  assert.equal(Object.isFrozen(link.jsonBatchRoundtripLinkRowFields), true);
  assert.deepEqual(
    {
      ...link,
      rows: undefined,
      rejectedRows: undefined,
      requestCount: undefined,
      linkedRowCount: undefined,
      rejectedRowCount: undefined
    },
    {
      ...expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink,
      rows: undefined,
      rejectedRows: undefined,
      requestCount: undefined,
      linkedRowCount: undefined,
      rejectedRowCount: undefined
    }
  );
  assert.equal(
    link.linkStatus,
    'linked-native-root-bridge-batch-lifecycle-consumer-json-batch-roundtrip'
  );
  assert.equal(
    link.model,
    'fast-react-napi.NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink'
  );
  assert.equal(
    link.responseSequenceGateStatus,
    'diagnosed-native-root-bridge-json-batch-response-sequence'
  );
  assert.equal(
    link.streamRoundtripGateStatus,
    'diagnosed-native-root-bridge-json-stream-batch-roundtrip'
  );
  assert.deepEqual(link.rowStatuses, ['linked', 'rejected']);
  assert.deepEqual(
    link.rejectionCodes,
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
  );
  assert.deepEqual(
    link.jsonBatchRoundtripLinkRowFields,
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowFields
  );
  assert.equal(link.nativeAddonLoaded, false);
  assert.equal(link.nativeExecution, false);
  assert.equal(link.rendererExecution, false);
  assert.equal(link.reconcilerExecution, false);
  assert.equal(link.nodeWorkerThreadsExecution, false);
  assert.equal(link.napiCleanupHookExecution, false);
  assert.equal(link.publicNativeCompatibility, false);
  assert.equal(link.reactBehaviorError, false);

  const descriptor = Object.getOwnPropertyDescriptor(
    link,
    'validateJsonBatchRoundtripLinkRows'
  );
  assert.equal(typeof descriptor.value, 'function');
  assert.equal(
    descriptor.value.name,
    'validateNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRows'
  );
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.writable, false);
  assert.equal(
    Object.keys(link).includes('validateJsonBatchRoundtripLinkRows'),
    false
  );
}

function assertNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink(
  link
) {
  assertNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkMetadata(
    link
  );
  assert.equal(Object.isFrozen(link.rows), true);
  assert.equal(Object.isFrozen(link.rejectedRows), true);
  assert.equal(link.requestCount, 3);
  assert.equal(link.linkedRowCount, 3);
  assert.equal(link.rejectedRowCount, 0);
  assert.deepEqual(link.rejectedRows, []);
  assert.deepEqual(
    link.rows.map((row) => row.id),
    [
      'batch-lifecycle-consumer-json-roundtrip-link-0-create',
      'batch-lifecycle-consumer-json-roundtrip-link-1-render',
      'batch-lifecycle-consumer-json-roundtrip-link-2-unmount'
    ]
  );
  assert.deepEqual(
    link.rows.map((row) => row.consumerRowId),
    [
      'batch-lifecycle-consumer-0-create',
      'batch-lifecycle-consumer-1-render',
      'batch-lifecycle-consumer-2-unmount'
    ]
  );
  assert.deepEqual(
    link.rows.map((row) => row.lifecycleRowId),
    ['batch-record-0-create', 'batch-record-1-render', 'batch-record-2-unmount']
  );
  assert.deepEqual(
    link.rows.map((row) => row.responseRowId),
    [
      'batch-response-0-create',
      'batch-response-1-render',
      'batch-response-2-unmount'
    ]
  );
  assert.deepEqual(
    link.rows.map((row) => row.streamMetadataRowId),
    [
      'stream-batch-chunk-0-request-1-metadata',
      'stream-batch-chunk-2-request-2-metadata',
      'stream-batch-chunk-4-request-3-metadata'
    ]
  );
  assert.deepEqual(
    link.rows.map((row) => row.streamPayloadRowId),
    [
      'stream-batch-chunk-1-request-1-payload',
      'stream-batch-chunk-3-request-2-payload',
      'stream-batch-chunk-5-request-3-payload'
    ]
  );
  assert.deepEqual(
    link.rows.map((row) => row.kind),
    ['create', 'render', 'unmount']
  );
  assert.deepEqual(
    link.rows.map((row) => row.lifecycleTransition),
    ['none->active', 'active->active', 'active->retired']
  );
  assert.deepEqual(
    link.rows.map((row) => row.rootHandleAction),
    ['admit-root-handle', 'validate-active-root-handle', 'retire-root-handle']
  );
  assert.deepEqual(
    link.rows.map((row) => row.cleanupHookEvidenceStatus),
    ['not-required', 'accepted', 'accepted']
  );
  assert.deepEqual(
    link.rows.map((row) => row.requestOrder),
    [0, 1, 2]
  );
  assert.deepEqual(
    link.rows.map((row) => row.responseOrder),
    [0, 1, 2]
  );
  assert.deepEqual(
    link.rows.map((row) => row.metadataBatchSequence),
    [0, 2, 4]
  );
  assert.deepEqual(
    link.rows.map((row) => row.payloadBatchSequence),
    [1, 3, 5]
  );
  assert.deepEqual(
    link.rows.map((row) => row.metadataChunkKind),
    ['metadata', 'metadata', 'metadata']
  );
  assert.deepEqual(
    link.rows.map((row) => row.payloadChunkKind),
    ['payload', 'payload', 'payload']
  );
  assert.deepEqual(
    link.rows.map((row) => row.responseStatus),
    ['accepted', 'accepted', 'accepted']
  );
  assert.deepEqual(
    link.rows.map((row) => row.payloadAssemblyState),
    ['assembled', 'assembled', 'assembled']
  );
  assert.deepEqual(
    link.rows.map((row) => row.teardownState),
    ['root-active', 'root-active', 'root-retired']
  );
  assert.deepEqual(
    link.rows.map((row) => row.status),
    ['linked', 'linked', 'linked']
  );
  assert.deepEqual(
    link.rows.map((row) => row.code),
    [null, null, null]
  );

  for (const row of link.rows) {
    assert.equal(Object.isFrozen(row), true);
    assert.deepEqual(
      Object.keys(row),
      expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowFields
    );
    assert.equal(row.batchId, 'native-root-bridge-json-batch-552');
    assert.equal(row.streamId, 'native-root-bridge-json-stream-batch-roundtrip-587');
    assert.equal(row.nativeAddonLoaded, false);
    assert.equal(row.nativeExecution, false);
    assert.equal(row.rendererExecution, false);
    assert.equal(row.reconcilerExecution, false);
    assert.equal(row.nodeWorkerThreadsExecution, false);
    assert.equal(row.napiCleanupHookExecution, false);
    assert.equal(row.publicNativeCompatibility, false);
    assert.equal(row.reactBehaviorError, false);
  }
}

function assertNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectsForgery(
  consumer,
  batchGate,
  rustHandleTableAdmissionSmoke
) {
  const link = consumer.jsonBatchRoundtripLink;
  const validate = link.validateJsonBatchRoundtripLinkRows;
  const source = {
    consumerRows: consumer.rows,
    lifecycleRows: batchGate.lifecycleRows,
    responseRows: batchGate.responseSequenceGate.rows,
    streamRows: batchGate.responseSequenceGate.streamRoundtripGate.rows,
    smokeRecords: rustHandleTableAdmissionSmoke.smokeRecords
  };
  const rejectionCode = (override) =>
    validate({ ...source, ...override }).rejectedRows[0].code;
  const replaceRow = (rows, index, patch) =>
    Object.freeze(
      rows.map((row, rowIndex) =>
        rowIndex === index ? Object.freeze({ ...row, ...patch }) : row
      )
    );

  assert.equal(
    rejectionCode({
      consumerRows: replaceRow(source.consumerRows, 0, {
        id: 'batch-lifecycle-consumer-0-render'
      })
    }),
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .consumerRowIdMismatch
  );
  assert.equal(
    rejectionCode({
      consumerRows: Object.freeze([
        source.consumerRows[1],
        source.consumerRows[0],
        source.consumerRows[2]
      ])
    }),
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .rowOrderMismatch
  );
  assert.equal(
    rejectionCode({
      consumerRows: replaceRow(source.consumerRows, 1, {
        lifecycleTransition: 'active->retired',
        rootHandleAction: 'retire-root-handle'
      })
    }),
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .kindTransitionMismatch
  );
  assert.equal(
    rejectionCode({
      consumerRows: replaceRow(source.consumerRows, 1, {
        cleanupHookEvidenceStatus: 'rejected'
      })
    }),
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .cleanupHookStatusMismatch
  );
  assert.equal(
    rejectionCode({
      responseRows: replaceRow(source.responseRows, 0, {
        batchId: 'foreign-native-root-bridge-json-batch'
      })
    }),
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .staleOrForeignJsonBatchRow
  );
  assert.equal(
    rejectionCode({
      streamRows: replaceRow(source.streamRows, 0, {
        streamId: 'foreign-native-root-bridge-json-stream'
      })
    }),
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .staleOrForeignJsonBatchRow
  );
  assert.equal(
    rejectionCode({
      responseRows: Object.freeze(
        source.responseRows.map((row) =>
          Object.freeze({
            ...row,
            batchId: 'foreign-native-root-bridge-json-batch'
          })
        )
      ),
      streamRows: Object.freeze(
        source.streamRows.map((row) =>
          Object.freeze({
            ...row,
            batchId: 'foreign-native-root-bridge-json-batch',
            streamId: 'foreign-native-root-bridge-json-stream'
          })
        )
      )
    }),
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .staleOrForeignJsonBatchRow
  );
  assert.equal(
    rejectionCode({
      streamRows: replaceRow(source.streamRows, 0, {
        chunkKind: 'payload'
      })
    }),
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .staleOrForeignJsonBatchRow
  );
  assert.equal(
    rejectionCode({
      streamRows: replaceRow(source.streamRows, 1, {
        chunkKind: 'metadata'
      })
    }),
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .staleOrForeignJsonBatchRow
  );
  assert.equal(
    rejectionCode({
      consumerRows: replaceRow(source.consumerRows, 0, {
        nativeExecution: true,
        publicNativeCompatibility: true
      })
    }),
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .publicNativeExecutionClaim
  );
  assert.equal(
    rejectionCode({
      consumerRows: replaceRow(source.consumerRows, 1, {
        cleanupHookEvidenceRowId:
          'cleanup-hook-worker-root-before-value-release'
      })
    }),
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .cleanupHookStatusMismatch
  );
  assert.equal(
    rejectionCode({
      consumerRows: replaceRow(source.consumerRows, 2, {
        cleanupHookSourceRowId:
          'worker-render-value-stale-executable-preflight'
      })
    }),
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .cleanupHookStatusMismatch
  );
  assert.equal(
    rejectionCode({
      consumerRows: replaceRow(source.consumerRows, 1, {
        cleanupHookSourceHandleKind: 'root'
      })
    }),
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .cleanupHookStatusMismatch
  );
  assert.equal(
    rejectionCode({
      consumerRows: replaceRow(source.consumerRows, 1, {
        valueHandleAction: null
      })
    }),
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .kindTransitionMismatch
  );
  assert.equal(
    rejectionCode({
      consumerRows: replaceRow(source.consumerRows, 1, {
        valueHandleCurrentGeneration: 2
      }),
      smokeRecords: replaceRow(source.smokeRecords, 1, {
        valueHandleCurrentGeneration: 2
      })
    }),
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .kindTransitionMismatch
  );
  assert.equal(
    rejectionCode({
      consumerRows: replaceRow(source.consumerRows, 2, {
        retiredRootSourceErrorCode: null
      })
    }),
    expectedNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .kindTransitionMismatch
  );
}

function assertNativeRootBridgeBatchLifecycleConsumer(consumer) {
  assert.equal(Object.isFrozen(consumer), true);
  assert.equal(Object.isFrozen(consumer.cleanupHookEvidenceStatuses), true);
  assert.equal(Object.isFrozen(consumer.batchLifecycleConsumerRowFields), true);
  assert.equal(Object.isFrozen(consumer.jsonBatchRoundtripLink), true);
  assert.equal(Object.isFrozen(consumer.rows), true);
  assert.equal(
    consumer.consumerStatus,
    'consumed-native-root-bridge-batch-lifecycle-records'
  );
  assert.equal(
    consumer.model,
    'fast-react-napi.NativeRootBridgeBatchLifecycleConsumer'
  );
  assert.equal(
    consumer.validationModel,
    'fast-react-napi.NativeRootBridgeRequestSequenceValidator'
  );
  assert.equal(consumer.handleTableModel, 'fast-react-napi.BridgeHandleTable');
  assert.equal(
    consumer.batchGateStatus,
    'validated-native-root-bridge-batched-json-transport-records'
  );
  assert.equal(
    consumer.cleanupHookPreflightStatus,
    'preflighted-native-root-bridge-worker-thread-cleanup-hook-order'
  );
  assert.equal(consumer.cleanupHookCallableName, 'validateCleanupHookEvidenceRows');
  assert.equal(consumer.requestCount, 3);
  assert.equal(consumer.consumedBatchRecordCount, 3);
  assert.equal(consumer.acceptedBatchRecordCount, 3);
  assert.equal(consumer.cleanupHookCallablePreflightAccepted, true);
  assert.equal(consumer.acceptedCleanupEvidenceCount, 2);
  assert.equal(consumer.rejectedCleanupEvidenceCount, 2);
  assert.deepEqual(
    consumer.cleanupHookEvidenceStatuses,
    ['not-required', 'accepted', 'rejected']
  );
  assert.deepEqual(
    consumer.batchLifecycleConsumerRowFields,
    expectedNativeRootBridgeBatchLifecycleConsumerRowFields
  );
  assertNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink(
    consumer.jsonBatchRoundtripLink
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.id),
    [
      'batch-lifecycle-consumer-0-create',
      'batch-lifecycle-consumer-1-render',
      'batch-lifecycle-consumer-2-unmount'
    ]
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.kind),
    ['create', 'render', 'unmount']
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.lifecycleTransition),
    ['none->active', 'active->active', 'active->retired']
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.rootHandleAction),
    ['admit-root-handle', 'validate-active-root-handle', 'retire-root-handle']
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.rootHandleStateBefore),
    [null, 'active', 'active']
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.rootHandleStateAfter),
    ['active', 'active', 'retired']
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.rootHandleCurrentGeneration),
    [1, 1, 2]
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.valueHandleAction),
    ['admit-value-handle', 'admit-value-handle', null]
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.cleanupHookEvidenceRequired),
    [false, true, true]
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.cleanupHookEvidenceStatus),
    ['not-required', 'accepted', 'accepted']
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.cleanupHookEvidenceRowId),
    [
      null,
      'cleanup-hook-worker-value-after-root-release',
      'cleanup-hook-worker-root-before-value-release'
    ]
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.cleanupHookSourceHandleKind),
    [null, 'value', 'root']
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.cleanupHookCanonicalExecutableEvidence),
    [null, true, true]
  );
  assert.equal(
    consumer.rows[2].retiredRootSourceErrorCode,
    'FAST_REACT_NAPI_STALE_HANDLE'
  );

  for (const row of consumer.rows) {
    assert.equal(Object.isFrozen(row), true);
    assert.deepEqual(Object.keys(row), consumer.batchLifecycleConsumerRowFields);
    assert.equal(row.status, 'accepted');
    assert.equal(row.code, null);
    assert.equal(row.sourceErrorCode, null);
    assert.equal(row.boundaryErrorCode, null);
    assert.equal(row.nativeAddonLoaded, false);
    assert.equal(row.nativeExecution, false);
    assert.equal(row.rendererExecution, false);
    assert.equal(row.reconcilerExecution, false);
    assert.equal(row.nodeWorkerThreadsExecution, false);
    assert.equal(row.napiCleanupHookExecution, false);
    assert.equal(row.publicNativeCompatibility, false);
    assert.equal(row.reactBehaviorError, false);
  }

  assert.equal(consumer.nativeAddonLoaded, false);
  assert.equal(consumer.nativeExecution, false);
  assert.equal(consumer.rendererExecution, false);
  assert.equal(consumer.reconcilerExecution, false);
  assert.equal(consumer.nodeWorkerThreadsExecution, false);
  assert.equal(consumer.napiCleanupHookExecution, false);
  assert.equal(consumer.publicNativeCompatibility, false);
  assert.equal(consumer.reactBehaviorError, false);
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
