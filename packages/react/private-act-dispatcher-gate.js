'use strict';

const {
  compatibilityTarget,
  createUnimplementedError
} = require('./placeholder-utils.js');

const entrypoint = 'react';
const privateActDispatcherGateExport =
  '__FAST_REACT_PRIVATE_ACT_DISPATCHER_GATE__';
const privateActQueueFlushDiagnosticsExport =
  '__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__';
const privateActQueueMetadataSymbol = Symbol(
  'fast-react.react.private.actQueueMetadata'
);
const privateActDispatchers = new WeakSet();
const actDispatcherGateStatus =
  'blocked-until-renderer-roots-passive-effects-and-act-continuations';
const schedulerPrivateActQueueFlushDiagnosticsStatus =
  'private-scheduler-act-queue-flush-diagnostics';
const schedulerPrivateActContinuationConsumptionStatus =
  'consumed-accepted-scheduler-private-continuation-diagnostics';
const rendererBackedActDrainDiagnosticsStatus =
  'private-renderer-backed-act-drain-diagnostics';
const rendererBackedActDrainConsumptionStatus =
  'consumed-accepted-renderer-backed-act-drain-diagnostics';
const schedulerPostTaskYieldActRootHandoffConsumptionStatus =
  'consumed-accepted-scheduler-post-task-yield-act-root-handoff-diagnostics';
const schedulerMockExpiredActRootWorkConsumptionStatus =
  'consumed-accepted-scheduler-mock-expired-act-root-work-diagnostics';
const schedulerMockDelayedActRootWorkPreflightStatus =
  'preflighted-accepted-scheduler-mock-delayed-act-root-work-nested-expired-diagnostics';
const acceptedActQueueMetadataKind =
  'fast-react.react.act-queue-metadata';
const acceptedActQueueMetadataVersion = 1;
const acceptedActQueueRecordKinds = Object.freeze([
  'SchedulerActQueueRequest',
  'SchedulerActScopeBoundaryRecord',
  'SyncFlushActContinuationRecord'
]);
const acceptedActQueueTaskKinds = Object.freeze([
  'RootSchedule',
  'SchedulerCallback'
]);
const acceptedActQueueContinuationStatuses = Object.freeze([
  'NoContinuation',
  'PendingContinuation'
]);
const privateSyncFlushActExecutionDiagnosticKind =
  'fast-react.react.private-sync-flush-act-execution-diagnostic';
const privateSyncFlushActExecutionDiagnosticVersion = 1;
const acceptedPrivateActContinuationDrainRecords = Object.freeze([
  'SyncFlushActContinuationDrainRecord',
  'SyncFlushActPrivateExecutionDiagnosticsForCanary'
]);
const acceptedPrivateActContinuationDrainStatuses = Object.freeze([
  'PendingContinuation'
]);
const privateRendererBackedActDrainDiagnosticKind =
  'fast-react.react.private-renderer-backed-act-drain-diagnostic';
const privateRendererBackedActDrainDiagnosticVersion = 1;
const acceptedRendererBackedActDrainRenderers = Object.freeze([
  'fast-react-test-renderer'
]);
const acceptedRendererBackedActDrainSchedulerRecords = Object.freeze([
  'SchedulerActQueueRequest',
  'SchedulerActScopeBoundaryRecord',
  'SchedulerActContinuationRecord'
]);
const acceptedRendererBackedActDrainReconcilerRecords = Object.freeze([
  'SyncFlushActContinuationDrainRecord',
  'SyncFlushActPrivateExecutionDiagnosticsForCanary',
  'SyncFlushPostPassiveContinuationExecutionRecord',
  'PassiveEffectsFlushWithSyncFlushContinuationResult'
]);
const acceptedRendererBackedActDrainRendererRecords = Object.freeze([
  'FastReactTestRendererCurrentRustCanaryMetadata',
  'TestRendererHostOutputDiagnostics',
  'TestRendererCommittedFiberTreeInspection'
]);
const privateSchedulerMockExpiredActRootWorkDiagnosticsKind =
  'fast-react.scheduler.mock-expired-act-root-work-diagnostics';
const privateSchedulerMockExpiredActRootWorkDiagnosticsBrand = Symbol.for(
  privateSchedulerMockExpiredActRootWorkDiagnosticsKind
);
const privateSchedulerMockExpiredActRootWorkDiagnosticsVersion = 1;
const privateSchedulerMockExpiredActRootWorkSourceValidatorModuleRecordKind =
  'fast-react.scheduler.mock-expired-act-root-work-source-validator-module-record';
const privateSchedulerMockExpiredActRootWorkSourceValidatorModuleRecordKey =
  Symbol.for(
    privateSchedulerMockExpiredActRootWorkSourceValidatorModuleRecordKind
  );
const privateSchedulerMockExpiredActRootWorkMetadataKind =
  'fast-react.scheduler.mock-expired-act-root-work-metadata';
const privateSchedulerMockExpiredActRootWorkMetadataVersion = 1;
const schedulerMockExpiredActRootWorkDiagnosticsStatus =
  'drained-expired-mock-scheduler-work-with-act-root-metadata-for-diagnostics';
const privateSchedulerMockDelayedActRootWorkDiagnosticsKind =
  'fast-react.scheduler.mock-delayed-act-root-work-diagnostics';
const privateSchedulerMockDelayedActRootWorkDiagnosticsBrand = Symbol.for(
  privateSchedulerMockDelayedActRootWorkDiagnosticsKind
);
const privateSchedulerMockDelayedActRootWorkDiagnosticsVersion = 1;
const privateSchedulerMockDelayedActRootWorkMetadataKind =
  'fast-react.scheduler.mock-delayed-act-root-work-metadata';
const privateSchedulerMockDelayedActRootWorkMetadataVersion = 1;
const privateSchedulerMockDelayedRendererRootWorkMetadataKind =
  'fast-react.scheduler.mock-delayed-renderer-root-work-metadata';
const privateSchedulerMockDelayedRendererRootWorkMetadataVersion = 1;
const trustedSchedulerMockExpiredActRootWorkSourceValidatorRecords =
  new WeakSet();
const trustedSchedulerMockExpiredActRootWorkSourceValidators = [];
const schedulerMockDelayedActRootWorkDiagnosticsStatus =
  'drained-delayed-mock-scheduler-work-with-act-root-metadata-for-diagnostics';
const schedulerMockDelayedActRootWorkAcceptedRootProducerKind =
  'accepted-root-metadata';
const schedulerMockDelayedActRootWorkAcceptedRootProducerStatus =
  'produced-private-delayed-act-root-work-metadata-from-accepted-root-metadata';
const schedulerMockDelayedActRootWorkAcceptedRendererRootProducerKind =
  'accepted-renderer-root-metadata';
const schedulerMockDelayedActRootWorkAcceptedRendererRootProducerStatus =
  'produced-private-delayed-act-root-work-metadata-from-accepted-renderer-root-metadata';
const schedulerMockDelayedRendererRootWorkMetadataStatus =
  'accepted-private-delayed-renderer-root-work-metadata-for-diagnostics';
const schedulerMockDelayedRendererRootWorkProducerStatus =
  'produced-private-delayed-renderer-root-work-metadata-for-private-act-root-handoff';
const acceptedSchedulerMockExpiredActRootWorkRecords = Object.freeze([
  'RootLaneSchedulingSnapshot',
  'UpdateContainerResult',
  'RootScheduleUpdateRecord',
  'RootTaskScheduleRecord',
  'SchedulerCallbackRequest',
  'RootSchedulerCallbackExecutionRecord',
  'HostRootFinishedWorkPendingCommitRecordForCanary',
  'HostRootFinishedWorkCommitHandoffRecordForCanary'
]);
const schedulerMockExpiredActRootWorkRecordKeys = Object.freeze([
  'index',
  'recordKind',
  'rootId',
  'rootLabel',
  'lane',
  'laneLabel',
  'accepted',
  'rendererWorkExecutionBlocked',
  'rootWorkMetadataOnly',
  'publicCompatibilityClaimed',
  'publicSchedulerTimingCompatibilityClaimed',
  'publicReactActCompatibilityClaimed',
  'publicRootSchedulerCompatibilityClaimed',
  'publicRendererCompatibilityClaimed',
  'drainsPublicSchedulerTaskQueue',
  'drainsPublicReactActQueue',
  'executesQueuedWork',
  'executesEffects',
  'executesRendererWork',
  'executesRendererRoots'
]);
const schedulerMockExpiredActRootWorkConsumptionReportKeys = Object.freeze([
  'status',
  'accepted',
  'pendingBefore',
  'consumedCount',
  'remainingCount',
  'consumedRecords',
  'drainsPublicSchedulerTaskQueue',
  'drainsPublicReactActQueue',
  'publicSchedulerTimingCompatibilityClaimed',
  'publicReactActCompatibilityClaimed',
  'publicRootSchedulerCompatibilityClaimed',
  'publicRendererCompatibilityClaimed',
  'compatibilityClaimed',
  'executesQueuedWork',
  'executesEffects',
  'executesRendererWork',
  'executesRendererRoots'
]);
const schedulerMockExpiredActRootWorkActQueueDrainReportKeys =
  Object.freeze([
    'status',
    'accepted',
    'queueKind',
    'pendingBefore',
    'drainedCount',
    'executedCallbackCount',
    'recordedContinuationCount',
    'executedContinuationCount',
    'remainingCount',
    'drainedRecords',
    'recordedContinuations',
    'executedContinuations',
    'mockSchedulerPendingWorkBefore',
    'mockSchedulerPendingWorkAfter',
    'mockSchedulerNowBefore',
    'mockSchedulerNowAfter',
    'drainsPublicSchedulerTaskQueue',
    'drainsPublicReactActQueue',
    'executesBrandedInternalTestCallbacks',
    'recordsBrandedInternalTestContinuations',
    'executesBrandedInternalTestContinuations',
    'publicSchedulerTimingCompatibilityClaimed',
    'publicReactActCompatibilityClaimed',
    'executesQueuedWork',
    'executesEffects'
  ]);
const schedulerMockExpiredActRootWorkDrainedRecordKeys = Object.freeze([
  'index',
  'label',
  'recordKind',
  'taskKind',
  'continuationStatus',
  'callbackStatus',
  'callback',
  'returnedContinuation',
  'executesQueuedWork',
  'executesEffects'
]);
const schedulerMockExpiredActRootWorkCallbackSummaryKeys = Object.freeze([
  'kind',
  'label',
  'executesQueuedWork',
  'executesEffects'
]);
const schedulerMockExpiredActRootWorkMetadataCallbackSummaryKeys =
  Object.freeze([
    'status',
    'kind',
    'label',
    'executesQueuedWork',
    'executesEffects'
  ]);
const schedulerMockExpiredActRootWorkCancelledCallbackSummaryKeys =
  Object.freeze(['status']);
const schedulerMockExpiredActRootWorkContinuationKeys = Object.freeze([
  'sourceIndex',
  'sourceLabel',
  'status',
  'continuation',
  'returnedContinuation',
  'executesQueuedWork',
  'executesEffects'
]);
const schedulerMockExpiredActRootWorkRecordedContinuationKeys =
  Object.freeze([
    'status',
    'continuation',
    'executesQueuedWork',
    'executesEffects'
  ]);
const schedulerMockExpiredActRootWorkSourceDrainReportKeys = Object.freeze([
  'status',
  'pendingBefore',
  'pendingAfter',
  'flushedExpiredWork',
  'hasMoreWorkAfterDrain',
  'nowBefore',
  'nowAfter',
  'priorityLevelBefore',
  'priorityLevelAfter',
  'expiredCallbackCountBefore',
  'expiredCallbackCountAfter',
  'cancelledTombstoneCountBefore',
  'cancelledTombstoneCountAfter',
  'taskQueueBefore',
  'taskQueueAfter',
  'drainsExpiredMockSchedulerWork',
  'drainsPublicReactActQueue',
  'publicSchedulerTimingCompatibilityClaimed',
  'publicReactActCompatibilityClaimed'
]);
const schedulerCompatibilityTarget = 'scheduler@0.27.0';
const privatePostTaskPriorityDiagnosticsStatus =
  'private-scheduler-post-task-priority-diagnostics';
const privatePostTaskPriorityDiagnosticsVersion = 1;
const privatePostTaskPriorityDiagnosticsExport =
  '__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__';
const privatePostTaskPriorityDiagnosticsSymbolDescription =
  'fast-react.scheduler.unstable_post_task.priority-diagnostics';
const privatePostTaskRootContinuationExecutionRouteStatus =
  'private-scheduler-post-task-root-continuation-execution-route';
const privatePostTaskPendingRootContinuationExecutionStatus =
  'pending-private-root-continuation-execution-route';
const privatePostTaskActRootWorkHandoffStatus =
  'accepted-private-scheduler-post-task-act-root-work-handoff';
const privatePostTaskActRootWorkHandoffKind =
  'fast-react.scheduler.post_task.private-act-root-work-handoff';
const privatePostTaskActRootWorkHandoffVersion = 1;
const privatePostTaskAcceptedRootWorkRecordKinds = Object.freeze([
  'RootLaneSchedulingSnapshot',
  'RootTaskScheduleRecord'
]);
const privatePostTaskBlockedTrueKeys = Object.freeze([
  'browserPostTaskCompatibilityClaimed',
  'browserTaskOrderingCompatibilityClaimed',
  'publicSchedulerTimingCompatibilityClaimed',
  'publicReactActCompatibilityClaimed',
  'publicRootSchedulerCompatibilityClaimed',
  'publicRendererCompatibilityClaimed',
  'publicCompatibilityClaimed',
  'compatibilityClaimed',
  'packageCompatibilityClaimed',
  'rawTimingCaptured',
  'drainsPublicSchedulerTaskQueue',
  'drainsPublicReactActQueue',
  'executesQueuedWork',
  'executesEffects',
  'executesRendererWork',
  'executesRendererRoots',
  'publicRootExecution',
  'publicSchedulerFlush',
  'rendererWorkExecuted',
  'reconcilerWorkExecuted',
  'nativeRendererWorkExecuted'
]);
const privatePostTaskBlockedTrueKeySet = new Set(
  privatePostTaskBlockedTrueKeys
);
const privateActQueueTestQueueKind =
  'fast-react.react.private-act-queue-test-queue';
const privateActQueueTestTaskKind =
  'fast-react.react.private-act-queue-test-task';
const privateActQueueTestCallbackKind =
  'fast-react.react.private-act-queue-test-callback';
const privateActQueueTestQueueVersion = 1;
const privateActQueueTestQueueBrand = Symbol.for(
  'fast-react.react.private-act-queue-test-queue'
);
const privateActQueueTestTaskBrand = Symbol.for(
  'fast-react.react.private-act-queue-test-task'
);
const privateActQueueTestCallbackBrand = Symbol.for(
  'fast-react.react.private-act-queue-test-callback'
);

function isObjectLike(value) {
  return (
    (typeof value === 'object' && value !== null) ||
    typeof value === 'function'
  );
}

function hasExactStringSet(value, expectedValues) {
  if (!Array.isArray(value) || value.length !== expectedValues.length) {
    return false;
  }

  const valueSet = new Set(value);
  if (valueSet.size !== expectedValues.length) {
    return false;
  }

  return expectedValues.every((expectedValue) => valueSet.has(expectedValue));
}

function hasExactStringList(value, expectedValues) {
  if (!Array.isArray(value) || value.length !== expectedValues.length) {
    return false;
  }

  for (let index = 0; index < expectedValues.length; index++) {
    if (value[index] !== expectedValues[index]) {
      return false;
    }
  }

  return true;
}

function hasExactOwnStringKeys(value, expectedKeys) {
  if (!isObjectLike(value)) {
    return false;
  }

  const keys = Object.keys(value);
  return (
    keys.length === expectedKeys.length &&
    expectedKeys.every((expectedKey, index) => keys[index] === expectedKey)
  );
}

function includesString(value, expectedValues) {
  return typeof value === 'string' && expectedValues.includes(value);
}

function refreshSchedulerMockExpiredActRootWorkSourceValidators() {
  for (const resolvedModulePath of resolveSchedulerMockSourceProofPaths()) {
    loadSchedulerMockForExpiredActRootWorkSourceProof(resolvedModulePath);
    for (const moduleRecord of getSchedulerMockSourceProofModuleRecords(
      resolvedModulePath
    )) {
      trustSchedulerMockExpiredActRootWorkSourceValidatorFromModuleRecord(
        moduleRecord,
        resolvedModulePath
      );
    }
  }
}

function resolveSchedulerMockSourceProofPaths() {
  const resolvedModulePaths = [];

  try {
    resolvedModulePaths.push(require.resolve('../scheduler/unstable_mock.js'));
  } catch (relativeError) {
    if (relativeError === null || relativeError.code !== 'MODULE_NOT_FOUND') {
      throw relativeError;
    }
  }

  try {
    resolvedModulePaths.push(require.resolve('scheduler/unstable_mock.js'));
  } catch (packageError) {
    if (packageError === null || packageError.code !== 'MODULE_NOT_FOUND') {
      throw packageError;
    }
  }

  return resolvedModulePaths;
}

function loadSchedulerMockForExpiredActRootWorkSourceProof(
  resolvedModulePath
) {
  try {
    require(resolvedModulePath);
  } catch (error) {
    if (error === null || error.code !== 'MODULE_NOT_FOUND') {
      throw error;
    }
  }
}

function getSchedulerMockSourceProofModuleRecords(resolvedModulePath) {
  const moduleRecords = [];
  for (const childModule of module.children) {
    if (childModule && childModule.id === resolvedModulePath) {
      moduleRecords.push(childModule);
    }
  }
  return moduleRecords;
}

function trustSchedulerMockExpiredActRootWorkSourceValidatorFromModuleRecord(
  moduleRecord,
  resolvedModulePath
) {
  if (
    !isTrustedSchedulerMockSourceProofModuleRecord(
      moduleRecord,
      resolvedModulePath
    ) ||
    trustedSchedulerMockExpiredActRootWorkSourceValidatorRecords.has(
      moduleRecord
    )
  ) {
    return;
  }

  const Scheduler = moduleRecord.exports;
  if (!isObjectLike(Scheduler)) {
    return;
  }

  const flushExpiredDescriptor = Object.getOwnPropertyDescriptor(
    Scheduler,
    'unstable_flushExpired'
  );
  if (
    flushExpiredDescriptor === undefined ||
    flushExpiredDescriptor.enumerable !== true ||
    typeof flushExpiredDescriptor.value !== 'function'
  ) {
    return;
  }

  const validator =
    getSchedulerMockExpiredActRootWorkSourceValidatorFromModuleRecord(
      moduleRecord
    );
  if (validator === null) {
    return;
  }

  trustedSchedulerMockExpiredActRootWorkSourceValidatorRecords.add(
    moduleRecord
  );
  trustedSchedulerMockExpiredActRootWorkSourceValidators.push(validator);
}

function isTrustedSchedulerMockSourceProofModuleRecord(
  moduleRecord,
  resolvedModulePath
) {
  return (
    isObjectLike(moduleRecord) &&
    moduleRecord instanceof module.constructor &&
    moduleRecord.id === resolvedModulePath &&
    moduleRecord.filename === resolvedModulePath &&
    moduleRecord.loaded === true &&
    hasSchedulerMockSourceProofModulePaths(moduleRecord) &&
    hasSchedulerMockSourceProofCjsChildModule(moduleRecord)
  );
}

function hasSchedulerMockSourceProofModulePaths(moduleRecord) {
  return (
    Array.isArray(moduleRecord.paths) &&
    moduleRecord.paths.length > 0 &&
    moduleRecord.paths.every((nodeModulePath) =>
      typeof nodeModulePath === 'string'
    )
  );
}

function hasSchedulerMockSourceProofCjsChildModule(moduleRecord) {
  return (
    Array.isArray(moduleRecord.children) &&
    moduleRecord.children.some((childModule) =>
      isSchedulerMockSourceProofCjsChildModule(childModule, moduleRecord)
    )
  );
}

function isSchedulerMockSourceProofCjsChildModule(
  childModule,
  parentModuleRecord
) {
  return (
    isObjectLike(childModule) &&
    childModule instanceof module.constructor &&
    childModule.parent === parentModuleRecord &&
    childModule.loaded === true &&
    typeof childModule.id === 'string' &&
    (childModule.id.endsWith(
      '/scheduler-unstable_mock.development.js'
    ) ||
      childModule.id.endsWith('/scheduler-unstable_mock.production.js')) &&
    isObjectLike(childModule.exports) &&
    typeof childModule.exports.unstable_flushExpired === 'function'
  );
}

function getSchedulerMockExpiredActRootWorkSourceValidatorFromModuleRecord(
  moduleRecord
) {
  if (!isObjectLike(moduleRecord)) {
    return null;
  }

  const sourceRecordDescriptor = Object.getOwnPropertyDescriptor(
    moduleRecord,
    privateSchedulerMockExpiredActRootWorkSourceValidatorModuleRecordKey
  );
  if (
    sourceRecordDescriptor === undefined ||
    sourceRecordDescriptor.configurable !== false ||
    sourceRecordDescriptor.enumerable !== false ||
    sourceRecordDescriptor.writable !== false
  ) {
    return null;
  }

  const sourceRecord = sourceRecordDescriptor.value;
  if (
    !isObjectLike(sourceRecord) ||
    !Object.isFrozen(sourceRecord) ||
    sourceRecord.status !==
      privateSchedulerMockExpiredActRootWorkSourceValidatorModuleRecordKind ||
    !isAcceptedSchedulerPrivateActQueueFlushDiagnostics(
      sourceRecord.diagnostics
    )
  ) {
    return null;
  }

  const diagnostics = sourceRecord.diagnostics;
  if (
    diagnostics.mockSchedulerExpiredActRootWorkDiagnosticsReady !== true ||
    diagnostics.providesExpiredActRootWorkSourceValidatorThroughPrivateDiagnostics !==
      true
  ) {
    return null;
  }

  const validator =
    sourceRecord.schedulerMockExpiredActRootWorkSourceValidator;
  if (
    !isObjectLike(validator) ||
    !Object.isFrozen(validator) ||
    validator !==
      diagnostics.schedulerMockExpiredActRootWorkSourceValidator ||
    validator.status !==
      'fast-react.scheduler.mock-expired-act-root-work-source-validator' ||
    typeof validator.isSchedulerMockExpiredActRootWorkSource !== 'function'
  ) {
    return null;
  }

  try {
    if (
      validator.isSchedulerMockExpiredActRootWorkSource(diagnostics) !== true
    ) {
      return null;
    }
  } catch (error) {
    return null;
  }

  return validator;
}

function hasSchedulerMockExpiredActRootWorkSourceProof(value) {
  refreshSchedulerMockExpiredActRootWorkSourceValidators();
  return (
    isObjectLike(value) &&
    Object.isFrozen(value) &&
    trustedSchedulerMockExpiredActRootWorkSourceValidators.some((validator) =>
      validator.isSchedulerMockExpiredActRootWorkSource(value) === true
    )
  );
}

function isAcceptedActQueueMetadata(metadata) {
  return (
    isObjectLike(metadata) &&
    metadata.kind === acceptedActQueueMetadataKind &&
    metadata.version === acceptedActQueueMetadataVersion &&
    metadata.compatibilityTarget === compatibilityTarget &&
    metadata.publicCompatibilityClaimed === false &&
    metadata.queueFlushingReady === false &&
    metadata.rendererRootsReady === false &&
    metadata.passiveEffectsReady === false &&
    metadata.continuationFlushingReady === false &&
    metadata.privateTestQueueFlushDiagnosticsReady === true &&
    metadata.drainsAcceptedInternalTestQueues === true &&
    metadata.privateSyncFlushActExecutionDiagnosticsReady === true &&
    metadata.privateSyncFlushActExecutionDiagnosticKind ===
      privateSyncFlushActExecutionDiagnosticKind &&
    metadata.privateSyncFlushActExecutionDiagnosticVersion ===
      privateSyncFlushActExecutionDiagnosticVersion &&
    metadata.committedHostOutputCanaryRequired === true &&
    metadata.drainsAcceptedInternalActContinuationRecords === true &&
    metadata.drainsPublicReactActQueue === false &&
    metadata.executesBrandedInternalTestCallbacks === true &&
    metadata.recordsBrandedInternalTestContinuations === true &&
    metadata.schedulerPrivateContinuationDiagnosticsReady === true &&
    metadata.consumesSchedulerPrivateContinuationDiagnostics === true &&
    metadata.rendererBackedActDrainDiagnosticsReady === true &&
    metadata.consumesRendererBackedActDrainDiagnostics === true &&
    metadata.rendererBackedActDrainDiagnosticKind ===
      privateRendererBackedActDrainDiagnosticKind &&
    metadata.rendererBackedActDrainDiagnosticVersion ===
      privateRendererBackedActDrainDiagnosticVersion &&
    metadata.drainsAcceptedRendererBackedActDiagnostics === true &&
    metadata.schedulerPostTaskYieldActRootHandoffDiagnosticsReady === true &&
    metadata.consumesSchedulerPostTaskYieldActRootHandoffDiagnostics === true &&
    metadata.schedulerMockExpiredActRootWorkDiagnosticsReady === true &&
    metadata.consumesSchedulerMockExpiredActRootWorkDiagnostics === true &&
    metadata.schedulerMockExpiredActRootWorkDiagnosticKind ===
      privateSchedulerMockExpiredActRootWorkDiagnosticsKind &&
    metadata.schedulerMockExpiredActRootWorkDiagnosticVersion ===
      privateSchedulerMockExpiredActRootWorkDiagnosticsVersion &&
    metadata.drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics ===
      true &&
    metadata.schedulerMockDelayedActRootWorkDiagnosticsReady === true &&
    metadata.preflightsSchedulerMockDelayedActRootWorkDiagnostics === true &&
    metadata.schedulerMockDelayedActRootWorkDiagnosticKind ===
      privateSchedulerMockDelayedActRootWorkDiagnosticsKind &&
    metadata.schedulerMockDelayedActRootWorkDiagnosticVersion ===
      privateSchedulerMockDelayedActRootWorkDiagnosticsVersion &&
    metadata.acceptsSchedulerMockDelayedActRootWorkOnlyAsNestedExpiredDiagnostics ===
      true &&
    metadata.publicSchedulerTimingCompatibilityClaimed === false &&
    metadata.publicReactActCompatibilityClaimed === false &&
    metadata.publicRootSchedulerCompatibilityClaimed === false &&
    metadata.publicRendererCompatibilityClaimed === false &&
    metadata.executesQueuedWork === false &&
    metadata.executesEffects === false &&
    metadata.executesRendererWork === false &&
    metadata.executesRendererRoots === false &&
    hasBlockedPublicCompatibilityClaims(metadata) &&
    hasBlockedPublicQueueAndExecutionClaims(metadata) &&
    hasExactStringSet(metadata.acceptedRecords, acceptedActQueueRecordKinds) &&
    hasExactStringSet(metadata.acceptedTaskKinds, acceptedActQueueTaskKinds) &&
    hasExactStringSet(
      metadata.acceptedContinuationStatuses,
      acceptedActQueueContinuationStatuses
    ) &&
    hasExactStringSet(
      metadata.acceptedPrivateActContinuationDrainRecords,
      acceptedPrivateActContinuationDrainRecords
    ) &&
    hasExactStringSet(
      metadata.acceptedPrivateActContinuationDrainStatuses,
      acceptedPrivateActContinuationDrainStatuses
    ) &&
    hasExactStringSet(
      metadata.acceptedRendererBackedActDrainRenderers,
      acceptedRendererBackedActDrainRenderers
    ) &&
    hasExactStringSet(
      metadata.acceptedRendererBackedActDrainSchedulerRecords,
      acceptedRendererBackedActDrainSchedulerRecords
    ) &&
    hasExactStringSet(
      metadata.acceptedRendererBackedActDrainReconcilerRecords,
      acceptedRendererBackedActDrainReconcilerRecords
    ) &&
    hasExactStringSet(
      metadata.acceptedRendererBackedActDrainRendererRecords,
      acceptedRendererBackedActDrainRendererRecords
    ) &&
    hasExactStringSet(
      metadata.acceptedSchedulerMockExpiredActRootWorkRecords,
      acceptedSchedulerMockExpiredActRootWorkRecords
    )
  );
}

function createActQueueMetadata(overrides = {}) {
  return Object.freeze({
    kind: acceptedActQueueMetadataKind,
    version: acceptedActQueueMetadataVersion,
    compatibilityTarget,
    acceptedRecords: acceptedActQueueRecordKinds,
    acceptedTaskKinds: acceptedActQueueTaskKinds,
    acceptedContinuationStatuses: acceptedActQueueContinuationStatuses,
    publicCompatibilityClaimed: false,
    queueFlushingReady: false,
    rendererRootsReady: false,
    passiveEffectsReady: false,
    continuationFlushingReady: false,
    privateTestQueueFlushDiagnosticsReady: true,
    drainsAcceptedInternalTestQueues: true,
    privateSyncFlushActExecutionDiagnosticsReady: true,
    privateSyncFlushActExecutionDiagnosticKind,
    privateSyncFlushActExecutionDiagnosticVersion,
    committedHostOutputCanaryRequired: true,
    drainsAcceptedInternalActContinuationRecords: true,
    drainsPublicReactActQueue: false,
    acceptedPrivateActContinuationDrainRecords,
    acceptedPrivateActContinuationDrainStatuses,
    executesBrandedInternalTestCallbacks: true,
    recordsBrandedInternalTestContinuations: true,
    schedulerPrivateContinuationDiagnosticsReady: true,
    consumesSchedulerPrivateContinuationDiagnostics: true,
    rendererBackedActDrainDiagnosticsReady: true,
    consumesRendererBackedActDrainDiagnostics: true,
    rendererBackedActDrainDiagnosticKind:
      privateRendererBackedActDrainDiagnosticKind,
    rendererBackedActDrainDiagnosticVersion:
      privateRendererBackedActDrainDiagnosticVersion,
    drainsAcceptedRendererBackedActDiagnostics: true,
    schedulerPostTaskYieldActRootHandoffDiagnosticsReady: true,
    consumesSchedulerPostTaskYieldActRootHandoffDiagnostics: true,
    acceptedRendererBackedActDrainRenderers,
    acceptedRendererBackedActDrainSchedulerRecords,
    acceptedRendererBackedActDrainReconcilerRecords,
    acceptedRendererBackedActDrainRendererRecords,
    schedulerMockExpiredActRootWorkDiagnosticsReady: true,
    consumesSchedulerMockExpiredActRootWorkDiagnostics: true,
    schedulerMockExpiredActRootWorkDiagnosticKind:
      privateSchedulerMockExpiredActRootWorkDiagnosticsKind,
    schedulerMockExpiredActRootWorkDiagnosticVersion:
      privateSchedulerMockExpiredActRootWorkDiagnosticsVersion,
    drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics: true,
    acceptedSchedulerMockExpiredActRootWorkRecords,
    schedulerMockDelayedActRootWorkDiagnosticsReady: true,
    preflightsSchedulerMockDelayedActRootWorkDiagnostics: true,
    schedulerMockDelayedActRootWorkDiagnosticKind:
      privateSchedulerMockDelayedActRootWorkDiagnosticsKind,
    schedulerMockDelayedActRootWorkDiagnosticVersion:
      privateSchedulerMockDelayedActRootWorkDiagnosticsVersion,
    acceptsSchedulerMockDelayedActRootWorkOnlyAsNestedExpiredDiagnostics:
      true,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false,
    ...overrides
  });
}

function isAcceptedInternalActQueueTestCallback(callback) {
  return (
    typeof callback === 'function' &&
    callback[privateActQueueTestCallbackBrand] === true &&
    callback.kind === privateActQueueTestCallbackKind &&
    callback.version === privateActQueueTestQueueVersion &&
    callback.compatibilityTarget === compatibilityTarget &&
    callback.schedulerCompatibilityTarget === schedulerCompatibilityTarget &&
    typeof callback.label === 'string' &&
    callback.publicCompatibilityClaimed === false &&
    callback.publicSchedulerTimingCompatibilityClaimed === false &&
    callback.publicReactActCompatibilityClaimed === false &&
    callback.executesQueuedWork === false &&
    callback.executesEffects === false
  );
}

function createInternalActQueueTestCallback(callback, options = {}) {
  if (isAcceptedInternalActQueueTestCallback(callback)) {
    return callback;
  }
  if (typeof callback !== 'function') {
    throw new TypeError(
      'createInternalActQueueTestCallback requires a function callback.'
    );
  }

  const normalizedOptions =
    typeof options === 'string'
      ? {
          label: options
        }
      : options ?? {};
  const testCallback = function () {
    return callback.apply(this, arguments);
  };

  Object.defineProperties(testCallback, {
    [privateActQueueTestCallbackBrand]: {
      value: true
    },
    kind: {
      value: privateActQueueTestCallbackKind
    },
    version: {
      value: privateActQueueTestQueueVersion
    },
    compatibilityTarget: {
      value: compatibilityTarget
    },
    schedulerCompatibilityTarget: {
      value: schedulerCompatibilityTarget
    },
    label: {
      value: String(
        normalizedOptions.label ??
          callback.displayName ??
          callback.name ??
          'act-queue-test-callback'
      )
    },
    publicCompatibilityClaimed: {
      value: false
    },
    publicSchedulerTimingCompatibilityClaimed: {
      value: false
    },
    publicReactActCompatibilityClaimed: {
      value: false
    },
    executesQueuedWork: {
      value: false
    },
    executesEffects: {
      value: false
    }
  });

  return Object.freeze(testCallback);
}

function normalizeInternalActQueueTestCallback(callback, label) {
  if (callback === undefined || callback === null) {
    return null;
  }
  if (isAcceptedInternalActQueueTestCallback(callback)) {
    return callback;
  }
  return createInternalActQueueTestCallback(callback, {
    label
  });
}

function isAcceptedInternalActQueueTestTask(task) {
  return (
    isObjectLike(task) &&
    task[privateActQueueTestTaskBrand] === true &&
    task.kind === privateActQueueTestTaskKind &&
    task.version === privateActQueueTestQueueVersion &&
    task.compatibilityTarget === compatibilityTarget &&
    task.schedulerCompatibilityTarget === schedulerCompatibilityTarget &&
    includesString(task.recordKind, acceptedActQueueRecordKinds) &&
    includesString(task.taskKind, acceptedActQueueTaskKinds) &&
    includesString(
      task.continuationStatus,
      acceptedActQueueContinuationStatuses
    ) &&
    typeof task.label === 'string' &&
    (task.callback === undefined ||
      task.callback === null ||
      isAcceptedInternalActQueueTestCallback(task.callback)) &&
    task.publicCompatibilityClaimed === false &&
    task.publicSchedulerTimingCompatibilityClaimed === false &&
    task.publicReactActCompatibilityClaimed === false &&
    task.executesQueuedWork === false &&
    task.executesEffects === false
  );
}

function createInternalActQueueTestTask(options = {}) {
  const normalizedOptions =
    typeof options === 'string'
      ? {
          label: options
        }
      : typeof options === 'function'
        ? {
            label: options.displayName ?? options.name,
            callback: options
          }
      : options ?? {};
  const task = {
    kind: privateActQueueTestTaskKind,
    version: privateActQueueTestQueueVersion,
    compatibilityTarget,
    schedulerCompatibilityTarget,
    recordKind:
      normalizedOptions.recordKind ?? 'SchedulerActQueueRequest',
    taskKind: normalizedOptions.taskKind ?? 'SchedulerCallback',
    continuationStatus:
      normalizedOptions.continuationStatus ?? 'NoContinuation',
    label: String(normalizedOptions.label ?? 'act-queue-test-task'),
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false
  };

  const callback = normalizeInternalActQueueTestCallback(
    normalizedOptions.callback,
    `${task.label}:callback`
  );
  if (callback !== null) {
    task.callback = callback;
  }

  Object.defineProperty(task, privateActQueueTestTaskBrand, {
    value: true
  });

  return Object.freeze(task);
}

function normalizeInternalActQueueTestTask(task) {
  if (isAcceptedInternalActQueueTestTask(task)) {
    return task;
  }

  return createInternalActQueueTestTask(task);
}

function isAcceptedInternalActQueueTestQueue(queue) {
  return (
    isObjectLike(queue) &&
    queue[privateActQueueTestQueueBrand] === true &&
    queue.kind === privateActQueueTestQueueKind &&
    queue.version === privateActQueueTestQueueVersion &&
    queue.compatibilityTarget === compatibilityTarget &&
    queue.schedulerCompatibilityTarget === schedulerCompatibilityTarget &&
    queue.publicCompatibilityClaimed === false &&
    queue.queueFlushingReady === false &&
    queue.privateTestQueueFlushDiagnosticsReady === true &&
    queue.drainsAcceptedInternalTestQueues === true &&
    queue.executesBrandedInternalTestCallbacks === true &&
    queue.recordsBrandedInternalTestContinuations === true &&
    queue.publicSchedulerTimingCompatibilityClaimed === false &&
    queue.publicReactActCompatibilityClaimed === false &&
    queue.executesQueuedWork === false &&
    queue.executesEffects === false &&
    Array.isArray(queue.records) &&
    queue.records.every(isAcceptedInternalActQueueTestTask)
  );
}

function createInternalActQueueTestQueue(records = []) {
  const normalizedRecords = Array.isArray(records) ? records : [];
  const queue = {
    kind: privateActQueueTestQueueKind,
    version: privateActQueueTestQueueVersion,
    compatibilityTarget,
    schedulerCompatibilityTarget,
    publicCompatibilityClaimed: false,
    queueFlushingReady: false,
    privateTestQueueFlushDiagnosticsReady: true,
    drainsAcceptedInternalTestQueues: true,
    executesBrandedInternalTestCallbacks: true,
    recordsBrandedInternalTestContinuations: true,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false,
    records: normalizedRecords.map(normalizeInternalActQueueTestTask)
  };

  Object.defineProperty(queue, privateActQueueTestQueueBrand, {
    value: true
  });

  return queue;
}

function isAcceptedSchedulerPrivateActQueueFlushDiagnostics(diagnostics) {
  return (
    isObjectLike(diagnostics) &&
    Object.isFrozen(diagnostics) &&
    diagnostics.status === schedulerPrivateActQueueFlushDiagnosticsStatus &&
    diagnostics.exportName === privateActQueueFlushDiagnosticsExport &&
    diagnostics.queueKind === privateActQueueTestQueueKind &&
    diagnostics.taskKind === privateActQueueTestTaskKind &&
    diagnostics.queueVersion === privateActQueueTestQueueVersion &&
    diagnostics.compatibilityTarget === schedulerCompatibilityTarget &&
    diagnostics.reactCompatibilityTarget === compatibilityTarget &&
    hasExactStringSet(
      diagnostics.acceptedRecordKinds,
      acceptedActQueueRecordKinds
    ) &&
    hasExactStringSet(
      diagnostics.acceptedTaskKinds,
      acceptedActQueueTaskKinds
    ) &&
    hasExactStringSet(
      diagnostics.acceptedContinuationStatuses,
      acceptedActQueueContinuationStatuses
    ) &&
    diagnostics.drainsAcceptedInternalTestQueues === true &&
    diagnostics.drainsPublicSchedulerTaskQueue === false &&
    diagnostics.drainsPublicReactActQueue === false &&
    diagnostics.publicSchedulerTimingCompatibilityClaimed === false &&
    diagnostics.publicReactActCompatibilityClaimed === false &&
    diagnostics.executesQueuedWork === false &&
    diagnostics.executesEffects === false &&
    typeof diagnostics.describeAcceptedInternalActQueue === 'function' &&
    typeof diagnostics.drainAcceptedInternalActQueue === 'function'
  );
}

function isAcceptedSchedulerPrivateActQueueDescription(
  description,
  pendingCount
) {
  return (
    isObjectLike(description) &&
    description.status === 'accepted-internal-test-queue' &&
    description.accepted === true &&
    description.rejectionReason === null &&
    description.queueKind === privateActQueueTestQueueKind &&
    description.pendingCount === pendingCount &&
    description.drainsAcceptedInternalTestQueues === true &&
    description.drainsPublicSchedulerTaskQueue === false &&
    description.drainsPublicReactActQueue === false &&
    description.publicSchedulerTimingCompatibilityClaimed === false &&
    description.publicReactActCompatibilityClaimed === false &&
    description.executesQueuedWork === false &&
    description.executesEffects === false
  );
}

function isAcceptedSchedulerPrivateActQueueDrainedRecord(record, index) {
  return (
    isObjectLike(record) &&
    record.index === index &&
    typeof record.label === 'string' &&
    includesString(record.recordKind, acceptedActQueueRecordKinds) &&
    includesString(record.taskKind, acceptedActQueueTaskKinds) &&
    includesString(
      record.continuationStatus,
      acceptedActQueueContinuationStatuses
    ) &&
    record.executesQueuedWork === false &&
    record.executesEffects === false
  );
}

function isAcceptedSchedulerPrivateActQueueDrainReport(report) {
  return (
    isObjectLike(report) &&
    report.status === 'drained-accepted-internal-test-queue' &&
    report.accepted === true &&
    report.queueKind === privateActQueueTestQueueKind &&
    Number.isInteger(report.pendingBefore) &&
    report.pendingBefore >= 0 &&
    Number.isInteger(report.drainedCount) &&
    report.drainedCount === report.pendingBefore &&
    report.remainingCount === 0 &&
    Array.isArray(report.drainedRecords) &&
    report.drainedRecords.length === report.drainedCount &&
    report.drainedRecords.every(
      isAcceptedSchedulerPrivateActQueueDrainedRecord
    ) &&
    typeof report.mockSchedulerPendingWorkBefore === 'boolean' &&
    report.mockSchedulerPendingWorkAfter ===
      report.mockSchedulerPendingWorkBefore &&
    typeof report.mockSchedulerNowBefore === 'number' &&
    report.mockSchedulerNowAfter === report.mockSchedulerNowBefore &&
    report.drainsPublicSchedulerTaskQueue === false &&
    report.drainsPublicReactActQueue === false &&
    report.publicSchedulerTimingCompatibilityClaimed === false &&
    report.publicReactActCompatibilityClaimed === false &&
    report.executesQueuedWork === false &&
    report.executesEffects === false
  );
}

function summarizeSchedulerPrivateActQueueDrainedRecords(records) {
  let noContinuationCount = 0;
  let pendingContinuationCount = 0;
  const summaries = records.map((record) => {
    if (record.continuationStatus === 'PendingContinuation') {
      pendingContinuationCount += 1;
    } else {
      noContinuationCount += 1;
    }

    return Object.freeze({
      index: record.index,
      label: record.label,
      recordKind: record.recordKind,
      taskKind: record.taskKind,
      continuationStatus: record.continuationStatus,
      executesQueuedWork: false,
      executesEffects: false
    });
  });

  return Object.freeze({
    recordCount: summaries.length,
    noContinuationCount,
    pendingContinuationCount,
    hasPendingContinuation: pendingContinuationCount > 0,
    records: Object.freeze(summaries)
  });
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function isNonNegativeFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPositiveFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function frozenStringArray(value, fallback) {
  const array = Array.isArray(value) ? value : fallback;
  return Object.freeze([...array]);
}

function findPrivatePostTaskBlockedTrueClaim(value, path, seen) {
  if (value === null || typeof value !== 'object') {
    return null;
  }
  if (seen.has(value)) {
    return null;
  }

  seen.add(value);

  const keys = Object.keys(value);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const nextPath = `${path}.${key}`;
    if (privatePostTaskBlockedTrueKeySet.has(key) && value[key] === true) {
      return Object.freeze({
        reason: 'public-or-execution-claim',
        claimName: key,
        claimPath: nextPath,
        claimValue: true
      });
    }

    const nested = findPrivatePostTaskBlockedTrueClaim(
      value[key],
      nextPath,
      seen
    );
    if (nested !== null) {
      return nested;
    }
  }

  return null;
}

function rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
  reason,
  details = {}
) {
  return Object.freeze({
    reason,
    ...details
  });
}

function rejectMutablePrivatePostTaskDiagnostics(mutablePath) {
  return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
    'mutable-private-post-task-diagnostics',
    {
      mutablePath
    }
  );
}

function validateFrozenPrivatePostTaskDiagnosticValue(value, mutablePath) {
  if (isObjectLike(value) && !Object.isFrozen(value)) {
    return rejectMutablePrivatePostTaskDiagnostics(mutablePath);
  }

  return null;
}

function isAcceptedPrivatePostTaskPriorityTimeout(priorityTimeout) {
  return (
    isObjectLike(priorityTimeout) &&
    priorityTimeout.status ===
      'scheduler-post-task-private-priority-timeout-diagnostics' &&
    priorityTimeout.priorityLevel === 4 &&
    priorityTimeout.schedulerPriorityName === 'unstable_LowPriority' &&
    priorityTimeout.recognizedPriority === true &&
    priorityTimeout.timeoutMs === 10000 &&
    priorityTimeout.timeoutReason === 'low-priority-timeout' &&
    priorityTimeout.timeoutClassification === 'finite-priority-timeout' &&
    priorityTimeout.didTimeoutArgument === false &&
    priorityTimeout.didTimeoutSource ===
      'scheduler-post-task-deprecated-didTimeout-is-always-false' &&
    priorityTimeout.expiresAt === null &&
    priorityTimeout.rawTimingCaptured === false &&
    priorityTimeout.browserPostTaskCompatibilityClaimed === false &&
    priorityTimeout.browserTaskOrderingCompatibilityClaimed === false &&
    priorityTimeout.publicSchedulerTimingCompatibilityClaimed === false &&
    priorityTimeout.compatibilityClaimed === false
  );
}

function matchesPrivatePostTaskPriorityTimeout(priorityTimeout, expected) {
  return (
    isAcceptedPrivatePostTaskPriorityTimeout(priorityTimeout) &&
    isAcceptedPrivatePostTaskPriorityTimeout(expected) &&
    priorityTimeout.status === expected.status &&
    priorityTimeout.priorityLevel === expected.priorityLevel &&
    priorityTimeout.schedulerPriorityName ===
      expected.schedulerPriorityName &&
    priorityTimeout.recognizedPriority === expected.recognizedPriority &&
    priorityTimeout.timeoutMs === expected.timeoutMs &&
    priorityTimeout.timeoutReason === expected.timeoutReason &&
    priorityTimeout.timeoutClassification ===
      expected.timeoutClassification &&
    priorityTimeout.didTimeoutArgument === expected.didTimeoutArgument &&
    priorityTimeout.didTimeoutSource === expected.didTimeoutSource &&
    priorityTimeout.expiresAt === expected.expiresAt &&
    priorityTimeout.rawTimingCaptured === expected.rawTimingCaptured &&
    priorityTimeout.browserPostTaskCompatibilityClaimed ===
      expected.browserPostTaskCompatibilityClaimed &&
    priorityTimeout.browserTaskOrderingCompatibilityClaimed ===
      expected.browserTaskOrderingCompatibilityClaimed &&
    priorityTimeout.publicSchedulerTimingCompatibilityClaimed ===
      expected.publicSchedulerTimingCompatibilityClaimed &&
    priorityTimeout.compatibilityClaimed === expected.compatibilityClaimed
  );
}

function matchesPrivatePostTaskDelay(delay, expected) {
  return (
    isObjectLike(delay) &&
    isObjectLike(expected) &&
    delay.hasDelayProperty === expected.hasDelayProperty &&
    delay.type === expected.type &&
    delay.value === expected.value &&
    delay.normalizedDelayType === expected.normalizedDelayType &&
    delay.normalizedDelayValue === expected.normalizedDelayValue &&
    delay.delayClassification === expected.delayClassification &&
    delay.browserPostTaskCompatibilityClaimed === false &&
    delay.publicSchedulerTimingCompatibilityClaimed === false &&
    delay.compatibilityClaimed === false
  );
}

function isAcceptedSchedulerPostTaskYieldFallbackEnvironment(
  fallbackEnvironment
) {
  return (
    isObjectLike(fallbackEnvironment) &&
    fallbackEnvironment.status ===
      'controlled-shim-fallback-environment-classification' &&
    fallbackEnvironment.environmentKind ===
      'controlled-task-scheduling-api-shim' &&
    fallbackEnvironment.classification ===
      'controlled-shim-scheduler-yield-continuation' &&
    fallbackEnvironment.selectedFallback === 'scheduler.yield' &&
    fallbackEnvironment.hasSchedulerPostTask === true &&
    fallbackEnvironment.hasSchedulerYield === true &&
    fallbackEnvironment.usesSchedulerYield === true &&
    fallbackEnvironment.usesSchedulerPostTaskFallback === false &&
    fallbackEnvironment.browserPostTaskCompatibilityClaimed === false &&
    fallbackEnvironment.browserTaskOrderingCompatibilityClaimed === false &&
    fallbackEnvironment.publicSchedulerTimingCompatibilityClaimed === false &&
    fallbackEnvironment.compatibilityClaimed === false
  );
}

function validateSchedulerPostTaskYieldCallbackRuns(diagnostics) {
  const expectedRuns = [
    {
      diagnosticEventIndex: 1,
      continuationStatus: 'scheduled-continuation-fallback',
      returnedContinuationType: 'function',
      callbackRunCountAtReturn: 1,
      continuationFallbackCountAtReturn: 0,
      continuationFallbackIndex: 0,
      expectsFallbackEnvironment: true
    },
    {
      diagnosticEventIndex: 3,
      continuationStatus: 'completed-without-continuation',
      returnedContinuationType: 'undefined',
      callbackRunCountAtReturn: 2,
      continuationFallbackCountAtReturn: 1,
      continuationFallbackIndex: null,
      expectsFallbackEnvironment: false
    }
  ];

  for (let index = 0; index < diagnostics.callbackRuns.length; index++) {
    const callbackRun = diagnostics.callbackRuns[index];
    const expectedRun = expectedRuns[index];
    const callbackRunPath = `diagnostics.callbackRuns.${index}`;
    const callbackRunMutableValidation =
      validateFrozenPrivatePostTaskDiagnosticValue(
        callbackRun,
        callbackRunPath
      );
    if (callbackRunMutableValidation !== null) {
      return callbackRunMutableValidation;
    }

    if (
      !isObjectLike(callbackRun) ||
      callbackRun.status !== 'ran-shimmed-post-task-callback' ||
      callbackRun.diagnosticEventIndex !==
        expectedRun.diagnosticEventIndex ||
      callbackRun.runIndex !== index ||
      callbackRun.priorityLevel !== 4 ||
      callbackRun.postTaskPriority !== 'user-visible' ||
      callbackRun.currentPriorityLevel !== 4 ||
      callbackRun.didTimeout !== false ||
      callbackRun.didTimeoutSource !==
        'scheduler-post-task-deprecated-didTimeout-is-always-false' ||
      callbackRun.shouldYieldAtStart !== false ||
      callbackRun.continuationStatus !== expectedRun.continuationStatus ||
      callbackRun.returnedContinuationType !==
        expectedRun.returnedContinuationType ||
      callbackRun.callbackRunCountAtReturn !==
        expectedRun.callbackRunCountAtReturn ||
      callbackRun.continuationFallbackCountAtReturn !==
        expectedRun.continuationFallbackCountAtReturn ||
      callbackRun.continuationFallbackIndex !==
        expectedRun.continuationFallbackIndex
    ) {
      return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
        'ambiguous-post-task-report'
      );
    }

    for (const [value, mutablePath] of [
      [callbackRun.scheduledDelay, `${callbackRunPath}.scheduledDelay`],
      [callbackRun.priorityTimeout, `${callbackRunPath}.priorityTimeout`],
      [callbackRun.signal, `${callbackRunPath}.signal`]
    ]) {
      const mutableValidation =
        validateFrozenPrivatePostTaskDiagnosticValue(value, mutablePath);
      if (mutableValidation !== null) {
        return mutableValidation;
      }
    }

    if (
      !matchesPrivatePostTaskDelay(
        callbackRun.scheduledDelay,
        diagnostics.schedule.delay
      ) ||
      !matchesPrivatePostTaskPriorityTimeout(
        callbackRun.priorityTimeout,
        diagnostics.priorityTimeout
      ) ||
      !isObjectLike(callbackRun.signal) ||
      callbackRun.signal.priority !== 'user-visible' ||
      callbackRun.signal.aborted !== false ||
      !hasExactStringList(callbackRun.signal.ownKeys, [
        'id',
        'aborted',
        'priority'
      ])
    ) {
      return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
        'ambiguous-post-task-report'
      );
    }

    if (expectedRun.expectsFallbackEnvironment) {
      const mutableValidation =
        validateFrozenPrivatePostTaskDiagnosticValue(
          callbackRun.fallbackEnvironmentClassification,
          `${callbackRunPath}.fallbackEnvironmentClassification`
        );
      if (mutableValidation !== null) {
        return mutableValidation;
      }
      if (
        !isAcceptedSchedulerPostTaskYieldFallbackEnvironment(
          callbackRun.fallbackEnvironmentClassification
        )
      ) {
        return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
          'ambiguous-post-task-report'
        );
      }
    } else if (callbackRun.fallbackEnvironmentClassification !== null) {
      return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
        'ambiguous-post-task-report'
      );
    }
  }

  return null;
}

function validateSchedulerPostTaskYieldActRootHandoffDiagnostics(
  diagnostics
) {
  if (
    !isObjectLike(diagnostics) ||
    !Object.isFrozen(diagnostics) ||
    diagnostics.status !== privatePostTaskPriorityDiagnosticsStatus ||
    diagnostics.version !== privatePostTaskPriorityDiagnosticsVersion ||
    diagnostics.exportName !== privatePostTaskPriorityDiagnosticsExport ||
    diagnostics.symbolDescription !==
      privatePostTaskPriorityDiagnosticsSymbolDescription ||
    diagnostics.entrypoint !== 'scheduler/unstable_post_task' ||
    diagnostics.compatibilityTarget !== schedulerCompatibilityTarget ||
    diagnostics.diagnosticKind !== 'shimmed-task-controller-priority'
  ) {
    return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
      'private-post-task-diagnostics-shape'
    );
  }

  const blockedClaim = findPrivatePostTaskBlockedTrueClaim(
    diagnostics,
    'diagnostics',
    new Set()
  );
  if (blockedClaim !== null) {
    return blockedClaim;
  }

  for (const [value, mutablePath] of [
    [diagnostics.priorityMapping, 'diagnostics.priorityMapping'],
    [diagnostics.priorityTimeout, 'diagnostics.priorityTimeout'],
    [diagnostics.schedule, 'diagnostics.schedule'],
    [
      diagnostics.schedule ? diagnostics.schedule.delay : null,
      'diagnostics.schedule.delay'
    ]
  ]) {
    const mutableValidation =
      validateFrozenPrivatePostTaskDiagnosticValue(value, mutablePath);
    if (mutableValidation !== null) {
      return mutableValidation;
    }
  }

  if (
    diagnostics.environmentCapabilityDiagnostics !== true ||
    diagnostics.priorityMappingDiagnostics !== true ||
    diagnostics.priorityTimeoutDiagnostics !== true ||
    diagnostics.continuationFallbackDiagnostics !== true ||
    diagnostics.continuationFallbackMetadataDiagnostics !== true ||
    diagnostics.continuationSignalValidationDiagnostics !== true ||
    diagnostics.rootContinuationExecutionRouteDiagnostics !== true ||
    diagnostics.fallbackEnvironmentClassificationDiagnostics !== true ||
    diagnostics.actRootWorkHandoffDiagnostics !== true
  ) {
    return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
      'private-post-task-diagnostics-shape'
    );
  }

  const environment = diagnostics.environmentCapabilities;
  if (
    !isObjectLike(environment) ||
    !Object.isFrozen(environment) ||
    environment.status !== 'controlled-task-scheduling-api-capability-snapshot' ||
    environment.hasSchedulerPostTask !== true ||
    environment.hasSchedulerYield !== true ||
    !hasExactStringSet(environment.schedulerOwnKeys, ['postTask', 'yield'])
  ) {
    return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
      'scheduler-yield-not-selected'
    );
  }

  if (
    !isObjectLike(diagnostics.priorityMapping) ||
    diagnostics.priorityMapping.priorityLevel !== 4 ||
    diagnostics.priorityMapping.schedulerPriorityName !==
      'unstable_LowPriority' ||
    diagnostics.priorityMapping.postTaskPriority !== 'user-visible' ||
    diagnostics.priorityMapping.taskControllerPriority !== 'user-visible' ||
    diagnostics.priorityMapping.recognizedPriority !== true
  ) {
    return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
      'ambiguous-post-task-report'
    );
  }

  if (
    !isAcceptedPrivatePostTaskPriorityTimeout(diagnostics.priorityTimeout)
  ) {
    return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
      'ambiguous-post-task-report'
    );
  }

  if (
    !isObjectLike(diagnostics.schedule) ||
    !isObjectLike(diagnostics.schedule.delay) ||
    diagnostics.schedule.delay.value !== 17 ||
    diagnostics.schedule.delay.delayClassification !== 'delayed-task'
  ) {
    return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
      'ambiguous-post-task-report'
    );
  }

  if (
    !Array.isArray(diagnostics.callbackRuns) ||
    diagnostics.callbackRuns.length !== 2 ||
    !Array.isArray(diagnostics.continuationFallbacks) ||
    diagnostics.continuationFallbacks.length !== 1
  ) {
    return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
      'ambiguous-post-task-report'
    );
  }

  for (const [value, mutablePath] of [
    [diagnostics.callbackRuns, 'diagnostics.callbackRuns'],
    [diagnostics.continuationFallbacks, 'diagnostics.continuationFallbacks']
  ]) {
    const mutableValidation =
      validateFrozenPrivatePostTaskDiagnosticValue(value, mutablePath);
    if (mutableValidation !== null) {
      return mutableValidation;
    }
  }

  const callbackRunsValidation =
    validateSchedulerPostTaskYieldCallbackRuns(diagnostics);
  if (callbackRunsValidation !== null) {
    return callbackRunsValidation;
  }

  const continuation = diagnostics.continuationFallbacks[0];
  const route = diagnostics.rootContinuationExecutionRoute;
  const handoff =
    route && isObjectLike(route) ? route.actRootWorkHandoff : null;

  if (
    !isObjectLike(continuation) ||
    !Object.isFrozen(continuation) ||
    !isObjectLike(route) ||
    !Object.isFrozen(route) ||
    !isObjectLike(handoff) ||
    !Object.isFrozen(handoff)
  ) {
    return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
      'ambiguous-post-task-report'
    );
  }

  if (
    continuation.status !== 'scheduled-shimmed-post-task-continuation' ||
    continuation.fallback !== 'scheduler.yield' ||
    continuation.continuationStatus !== 'scheduled-continuation-fallback' ||
    continuation.continuationIndex !== 0 ||
    continuation.sourceCallbackRunIndex !== 0 ||
    continuation.callbackRunCountAtSchedule !== 1
  ) {
    return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
      'stale-continuation-evidence'
    );
  }

  const continuationMetadata = continuation.continuationMetadata;
  const fallbackEnvironment =
    continuation.fallbackEnvironmentClassification;
  for (const [value, mutablePath] of [
    [
      continuationMetadata,
      'diagnostics.continuationFallbacks.0.continuationMetadata'
    ],
    [
      fallbackEnvironment,
      'diagnostics.continuationFallbacks.0.fallbackEnvironmentClassification'
    ],
    [
      route.privateRootContinuationExecution,
      'diagnostics.rootContinuationExecutionRoute.privateRootContinuationExecution'
    ],
    [
      handoff.priorityTimeout,
      'diagnostics.rootContinuationExecutionRoute.actRootWorkHandoff.priorityTimeout'
    ],
    [
      handoff.delay,
      'diagnostics.rootContinuationExecutionRoute.actRootWorkHandoff.delay'
    ],
    [
      handoff.actQueueHandoff,
      'diagnostics.rootContinuationExecutionRoute.actRootWorkHandoff.actQueueHandoff'
    ],
    [
      handoff.actQueueHandoff
        ? handoff.actQueueHandoff.priorityTimeout
        : null,
      'diagnostics.rootContinuationExecutionRoute.actRootWorkHandoff.actQueueHandoff.priorityTimeout'
    ],
    [
      handoff.rootWorkRecords,
      'diagnostics.rootContinuationExecutionRoute.actRootWorkHandoff.rootWorkRecords'
    ]
  ]) {
    const mutableValidation =
      validateFrozenPrivatePostTaskDiagnosticValue(value, mutablePath);
    if (mutableValidation !== null) {
      return mutableValidation;
    }
  }

  if (
    !isObjectLike(continuationMetadata) ||
    continuationMetadata.status !== 'shimmed-post-task-continuation-metadata' ||
    continuationMetadata.selectedFallback !== 'scheduler.yield' ||
    continuationMetadata.schedulerYieldAvailableAtSchedule !== true ||
    continuationMetadata.schedulerPostTaskAvailableAtSchedule !== true ||
    continuationMetadata.fallbackEnvironmentClassification !==
      'controlled-shim-scheduler-yield-continuation' ||
    continuationMetadata.fallbackEnvironmentKind !==
      'controlled-task-scheduling-api-shim' ||
    continuationMetadata.actRootWorkHandoffKind !==
      privatePostTaskActRootWorkHandoffKind ||
    continuationMetadata.actRootWorkHandoffStatus !==
      privatePostTaskActRootWorkHandoffStatus ||
    continuationMetadata.actRootWorkHandoffAccepted !== true ||
    continuationMetadata.actRootWorkRecordCount !== 2 ||
    continuationMetadata.delayedCallbackPathAccepted !== true ||
    !isObjectLike(fallbackEnvironment) ||
    fallbackEnvironment.status !==
      'controlled-shim-fallback-environment-classification' ||
    fallbackEnvironment.environmentKind !==
      'controlled-task-scheduling-api-shim' ||
    fallbackEnvironment.classification !==
      'controlled-shim-scheduler-yield-continuation' ||
    fallbackEnvironment.selectedFallback !== 'scheduler.yield' ||
    fallbackEnvironment.usesSchedulerYield !== true ||
    fallbackEnvironment.usesSchedulerPostTaskFallback !== false
  ) {
    return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
      'scheduler-yield-not-selected'
    );
  }

  if (
    route.status !== privatePostTaskRootContinuationExecutionRouteStatus ||
    route.routeVersion !== 1 ||
    route.routeStatus !==
      privatePostTaskPendingRootContinuationExecutionStatus ||
    route.accepted !== true ||
    route.rejected !== false ||
    route.continuationIndex !== continuation.continuationIndex ||
    route.continuationDiagnosticEventIndex !==
      continuation.diagnosticEventIndex ||
    route.sourceCallbackRunIndex !== continuation.sourceCallbackRunIndex ||
    route.callbackRunCountAtSchedule !==
      continuation.callbackRunCountAtSchedule ||
    route.fallback !== 'scheduler.yield' ||
    route.hasActRootWorkHandoff !== true
  ) {
    return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
      'stale-continuation-evidence'
    );
  }

  if (
    handoff.status !== privatePostTaskActRootWorkHandoffStatus ||
    handoff.handoffKind !== privatePostTaskActRootWorkHandoffKind ||
    handoff.handoffVersion !== privatePostTaskActRootWorkHandoffVersion ||
    handoff.entrypoint !== 'scheduler/unstable_post_task' ||
    handoff.compatibilityTarget !== schedulerCompatibilityTarget ||
    handoff.reactCompatibilityTarget !== compatibilityTarget ||
    handoff.routeStatus !==
      privatePostTaskPendingRootContinuationExecutionStatus ||
    handoff.accepted !== true ||
    handoff.rejected !== false ||
    handoff.continuationIndex !== continuation.continuationIndex ||
    handoff.continuationDiagnosticEventIndex !==
      continuation.diagnosticEventIndex ||
    handoff.sourceCallbackRunIndex !== continuation.sourceCallbackRunIndex ||
    handoff.callbackRunCountAtSchedule !==
      continuation.callbackRunCountAtSchedule ||
    !matchesPrivatePostTaskPriorityTimeout(
      handoff.priorityTimeout,
      diagnostics.priorityTimeout
    ) ||
    handoff.delayedCallbackPathAccepted !== true ||
    !isObjectLike(handoff.delay) ||
    handoff.delay.value !== 17 ||
    handoff.delay.delayClassification !== 'delayed-task' ||
    handoff.actQueueHandoffOnly !== true ||
    handoff.rootWorkMetadataOnly !== true ||
    handoff.rendererWorkExecutionBlocked !== true
  ) {
    return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
      'private-post-task-handoff-shape'
    );
  }

  if (
    !isObjectLike(handoff.actQueueHandoff) ||
    handoff.actQueueHandoff.status !==
      'accepted-private-scheduler-post-task-act-queue-handoff' ||
    handoff.actQueueHandoff.recordKind !== 'SchedulerActQueueRequest' ||
    handoff.actQueueHandoff.taskKind !== 'RootSchedule' ||
    handoff.actQueueHandoff.continuationStatus !== 'PendingContinuation' ||
    handoff.actQueueHandoff.accepted !== true ||
    !matchesPrivatePostTaskPriorityTimeout(
      handoff.actQueueHandoff.priorityTimeout,
      handoff.priorityTimeout
    ) ||
    handoff.actQueueHandoff.actQueueHandoffOnly !== true ||
    handoff.actQueueHandoff.rootWorkMetadataOnly !== true
  ) {
    return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
      'private-post-task-handoff-shape'
    );
  }

  if (
    !Array.isArray(handoff.rootWorkRecords) ||
    handoff.rootWorkRecords.length !==
      privatePostTaskAcceptedRootWorkRecordKinds.length ||
    !hasExactStringList(
      handoff.rootWorkRecords.map((record) => record.recordKind),
      privatePostTaskAcceptedRootWorkRecordKinds
    )
  ) {
    return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
      'ambiguous-post-task-report'
    );
  }

  for (let index = 0; index < handoff.rootWorkRecords.length; index++) {
    const rootWorkRecord = handoff.rootWorkRecords[index];
    const mutableValidation = validateFrozenPrivatePostTaskDiagnosticValue(
      rootWorkRecord,
      `diagnostics.rootContinuationExecutionRoute.actRootWorkHandoff.rootWorkRecords.${index}`
    );
    if (mutableValidation !== null) {
      return mutableValidation;
    }

    const priorityTimeoutMutableValidation =
      validateFrozenPrivatePostTaskDiagnosticValue(
        rootWorkRecord ? rootWorkRecord.priorityTimeout : null,
        `diagnostics.rootContinuationExecutionRoute.actRootWorkHandoff.rootWorkRecords.${index}.priorityTimeout`
      );
    if (priorityTimeoutMutableValidation !== null) {
      return priorityTimeoutMutableValidation;
    }

    if (
      !isObjectLike(rootWorkRecord) ||
      rootWorkRecord.accepted !== true ||
      rootWorkRecord.rootId !== 'post-task-delayed-continuation-root' ||
      rootWorkRecord.rootLabel !==
        'scheduler-post-task-delayed-continuation-root' ||
      rootWorkRecord.lane !== 'PostTaskContinuationLane' ||
      rootWorkRecord.laneLabel !== 'PostTaskContinuationLane' ||
      rootWorkRecord.continuationIndex !== continuation.continuationIndex ||
      rootWorkRecord.sourceCallbackRunIndex !==
        continuation.sourceCallbackRunIndex ||
      rootWorkRecord.priorityLevel !== 4 ||
      rootWorkRecord.schedulerPriorityName !== 'unstable_LowPriority' ||
      !matchesPrivatePostTaskPriorityTimeout(
        rootWorkRecord.priorityTimeout,
        handoff.priorityTimeout
      ) ||
      rootWorkRecord.postTaskPriority !== 'user-visible' ||
      rootWorkRecord.delayedCallbackPath !== true ||
      rootWorkRecord.rendererWorkExecutionBlocked !== true ||
      rootWorkRecord.rootWorkMetadataOnly !== true
    ) {
      return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
        'private-post-task-handoff-shape',
        {
          rootWorkRecordIndex: index
        }
      );
    }
  }

  const privateExecution = route.privateRootContinuationExecution;
  if (
    !isObjectLike(privateExecution) ||
    privateExecution.status !==
      privatePostTaskPendingRootContinuationExecutionStatus ||
    privateExecution.routeSelected !== true ||
    privateExecution.continuationIndex !== continuation.continuationIndex ||
    privateExecution.sourceCallbackRunIndex !==
      continuation.sourceCallbackRunIndex ||
    privateExecution.callbackRunCountAtSchedule !==
      continuation.callbackRunCountAtSchedule ||
    privateExecution.continuationFallbackCountAtSchedule !== 1 ||
    privateExecution.continuationCallbackExecuted !== false
  ) {
    return rejectSchedulerPostTaskYieldActRootHandoffDiagnostics(
      'stale-continuation-evidence'
    );
  }

  return null;
}

function isAcceptedSchedulerPostTaskYieldActRootHandoffDiagnostics(
  diagnostics
) {
  return (
    validateSchedulerPostTaskYieldActRootHandoffDiagnostics(diagnostics) ===
    null
  );
}

function isAcceptedRendererBackedActDrainDiagnostics(diagnostics) {
  return (
    isObjectLike(diagnostics) &&
    Object.isFrozen(diagnostics) &&
    diagnostics.kind === privateRendererBackedActDrainDiagnosticKind &&
    diagnostics.version === privateRendererBackedActDrainDiagnosticVersion &&
    diagnostics.status === rendererBackedActDrainDiagnosticsStatus &&
    diagnostics.compatibilityTarget === compatibilityTarget &&
    diagnostics.schedulerCompatibilityTarget === schedulerCompatibilityTarget &&
    includesString(
      diagnostics.renderer,
      acceptedRendererBackedActDrainRenderers
    ) &&
    diagnostics.schedulerMetadataSource === 'SchedulerBridge' &&
    diagnostics.reconcilerMetadataSource === 'fast-react-reconciler' &&
    diagnostics.rendererMetadataSource === 'fast-react-test-renderer' &&
    Object.isFrozen(diagnostics.acceptedSchedulerRecords) &&
    Object.isFrozen(diagnostics.acceptedReconcilerRecords) &&
    Object.isFrozen(diagnostics.acceptedRendererRecords) &&
    hasExactStringSet(
      diagnostics.acceptedSchedulerRecords,
      acceptedRendererBackedActDrainSchedulerRecords
    ) &&
    hasExactStringSet(
      diagnostics.acceptedReconcilerRecords,
      acceptedRendererBackedActDrainReconcilerRecords
    ) &&
    hasExactStringSet(
      diagnostics.acceptedRendererRecords,
      acceptedRendererBackedActDrainRendererRecords
    ) &&
    isPositiveInteger(diagnostics.pendingBefore) &&
    isPositiveInteger(diagnostics.drainedCount) &&
    isNonNegativeInteger(diagnostics.remainingCount) &&
    diagnostics.pendingBefore ===
      diagnostics.drainedCount + diagnostics.remainingCount &&
    isPositiveInteger(diagnostics.drainedContinuationCount) &&
    diagnostics.drainedContinuationCount <= diagnostics.drainedCount &&
    diagnostics.hostOutputCanaryCommitted === true &&
    diagnostics.blockedByPendingPostPassiveGate === false &&
    diagnostics.rendererBackedActDrainDiagnosticsReady === true &&
    diagnostics.consumesRendererBackedActDrainDiagnostics === true &&
    diagnostics.consumesSchedulerPrivateContinuationDiagnostics === true &&
    diagnostics.consumesReconcilerActDrainMetadata === true &&
    diagnostics.drainsAcceptedRendererBackedActDiagnostics === true &&
    diagnostics.queueFlushingReady === false &&
    diagnostics.rendererRootsReady === false &&
    diagnostics.passiveEffectsReady === false &&
    diagnostics.continuationFlushingReady === false &&
    diagnostics.publicCompatibilityClaimed === false &&
    diagnostics.publicSchedulerTimingCompatibilityClaimed === false &&
    diagnostics.publicReactActCompatibilityClaimed === false &&
    diagnostics.drainsPublicSchedulerTaskQueue === false &&
    diagnostics.drainsPublicReactActQueue === false &&
    diagnostics.executesQueuedWork === false &&
    diagnostics.executesEffects === false &&
    diagnostics.executesRendererRoots === false
  );
}

function createRendererBackedActDrainDiagnostics(overrides = {}) {
  const normalizedOptions = overrides ?? {};
  const pendingBefore = normalizedOptions.pendingBefore ?? 1;
  const drainedCount = normalizedOptions.drainedCount ?? 1;
  const remainingCount = normalizedOptions.remainingCount ?? 0;
  const drainedContinuationCount =
    normalizedOptions.drainedContinuationCount ?? drainedCount;

  return Object.freeze({
    kind: privateRendererBackedActDrainDiagnosticKind,
    version: privateRendererBackedActDrainDiagnosticVersion,
    status: rendererBackedActDrainDiagnosticsStatus,
    compatibilityTarget,
    schedulerCompatibilityTarget,
    renderer:
      normalizedOptions.renderer ?? acceptedRendererBackedActDrainRenderers[0],
    schedulerMetadataSource:
      normalizedOptions.schedulerMetadataSource ?? 'SchedulerBridge',
    reconcilerMetadataSource:
      normalizedOptions.reconcilerMetadataSource ?? 'fast-react-reconciler',
    rendererMetadataSource:
      normalizedOptions.rendererMetadataSource ?? 'fast-react-test-renderer',
    acceptedSchedulerRecords: frozenStringArray(
      normalizedOptions.acceptedSchedulerRecords,
      acceptedRendererBackedActDrainSchedulerRecords
    ),
    acceptedReconcilerRecords: frozenStringArray(
      normalizedOptions.acceptedReconcilerRecords,
      acceptedRendererBackedActDrainReconcilerRecords
    ),
    acceptedRendererRecords: frozenStringArray(
      normalizedOptions.acceptedRendererRecords,
      acceptedRendererBackedActDrainRendererRecords
    ),
    pendingBefore,
    drainedCount,
    remainingCount,
    drainedContinuationCount,
    hostOutputCanaryCommitted:
      normalizedOptions.hostOutputCanaryCommitted ?? true,
    blockedByPendingPostPassiveGate:
      normalizedOptions.blockedByPendingPostPassiveGate ?? false,
    rendererBackedActDrainDiagnosticsReady:
      normalizedOptions.rendererBackedActDrainDiagnosticsReady ?? true,
    consumesRendererBackedActDrainDiagnostics:
      normalizedOptions.consumesRendererBackedActDrainDiagnostics ?? true,
    consumesSchedulerPrivateContinuationDiagnostics:
      normalizedOptions.consumesSchedulerPrivateContinuationDiagnostics ??
      true,
    consumesReconcilerActDrainMetadata:
      normalizedOptions.consumesReconcilerActDrainMetadata ?? true,
    drainsAcceptedRendererBackedActDiagnostics:
      normalizedOptions.drainsAcceptedRendererBackedActDiagnostics ?? true,
    queueFlushingReady: normalizedOptions.queueFlushingReady ?? false,
    rendererRootsReady: normalizedOptions.rendererRootsReady ?? false,
    passiveEffectsReady: normalizedOptions.passiveEffectsReady ?? false,
    continuationFlushingReady:
      normalizedOptions.continuationFlushingReady ?? false,
    publicCompatibilityClaimed:
      normalizedOptions.publicCompatibilityClaimed ?? false,
    publicSchedulerTimingCompatibilityClaimed:
      normalizedOptions.publicSchedulerTimingCompatibilityClaimed ?? false,
    publicReactActCompatibilityClaimed:
      normalizedOptions.publicReactActCompatibilityClaimed ?? false,
    drainsPublicSchedulerTaskQueue:
      normalizedOptions.drainsPublicSchedulerTaskQueue ?? false,
    drainsPublicReactActQueue:
      normalizedOptions.drainsPublicReactActQueue ?? false,
    executesQueuedWork: normalizedOptions.executesQueuedWork ?? false,
    executesEffects: normalizedOptions.executesEffects ?? false,
    executesRendererRoots: normalizedOptions.executesRendererRoots ?? false
  });
}

function hasBlockedPublicCompatibilityClaims(value) {
  return (
    isObjectLike(value) &&
    value.publicSchedulerTimingCompatibilityClaimed === false &&
    value.publicReactActCompatibilityClaimed === false &&
    (value.publicRootSchedulerCompatibilityClaimed === undefined ||
      value.publicRootSchedulerCompatibilityClaimed === false) &&
    (value.publicRendererCompatibilityClaimed === undefined ||
      value.publicRendererCompatibilityClaimed === false) &&
    (value.publicCompatibilityClaimed === undefined ||
      value.publicCompatibilityClaimed === false) &&
    (value.packageCompatibilityClaimed === undefined ||
      value.packageCompatibilityClaimed === false) &&
    (value.publicPackageCompatibilityClaimed === undefined ||
      value.publicPackageCompatibilityClaimed === false) &&
    (value.publicSchedulerFlushHelperCompatibilityClaimed === undefined ||
      value.publicSchedulerFlushHelperCompatibilityClaimed === false) &&
    (value.schedulerTimingAdmissionClaimed === undefined ||
      value.schedulerTimingAdmissionClaimed === false) &&
    (value.schedulerDelayedActRootAdmissionClaimed === undefined ||
      value.schedulerDelayedActRootAdmissionClaimed === false) &&
    (value.schedulerDelayedRendererRootAdmissionClaimed === undefined ||
      value.schedulerDelayedRendererRootAdmissionClaimed === false) &&
    (value.compatibilityClaimed === undefined ||
      value.compatibilityClaimed === false)
  );
}

function hasBlockedPublicQueueAndExecutionClaims(value) {
  return (
    isObjectLike(value) &&
    (value.drainsPublicSchedulerTaskQueue === undefined ||
      value.drainsPublicSchedulerTaskQueue === false) &&
    (value.drainsPublicReactActQueue === undefined ||
      value.drainsPublicReactActQueue === false) &&
    value.executesQueuedWork === false &&
    value.executesEffects === false &&
    (value.executesRendererWork === undefined ||
      value.executesRendererWork === false) &&
    (value.executesRendererRoots === undefined ||
      value.executesRendererRoots === false) &&
    (value.invokesPublicSchedulerFlushHelper === undefined ||
      value.invokesPublicSchedulerFlushHelper === false) &&
    (value.publicSchedulerFlushBehaviorExecuted === undefined ||
      value.publicSchedulerFlushBehaviorExecuted === false) &&
    (value.publicSchedulerFlushExecutionAvailable === undefined ||
      value.publicSchedulerFlushExecutionAvailable === false) &&
    (value.routesAcceptedMockSchedulerFlushHelperMetadata === undefined ||
      value.routesAcceptedMockSchedulerFlushHelperMetadata === false)
  );
}

function isAcceptedSchedulerMockExpiredActRootWorkRecord(record, index) {
  return (
    isObjectLike(record) &&
    hasSchedulerMockExpiredActRootWorkSourceProof(record) &&
    hasExactOwnStringKeys(
      record,
      schedulerMockExpiredActRootWorkRecordKeys
    ) &&
    record.index === index &&
    includesString(
      record.recordKind,
      acceptedSchedulerMockExpiredActRootWorkRecords
    ) &&
    record.rootId !== null &&
    record.rootId !== undefined &&
    typeof record.rootLabel === 'string' &&
    typeof record.lane === 'string' &&
    typeof record.laneLabel === 'string' &&
    record.accepted === true &&
    record.rendererWorkExecutionBlocked === true &&
    record.rootWorkMetadataOnly === true &&
    record.publicCompatibilityClaimed === false &&
    record.publicSchedulerTimingCompatibilityClaimed === false &&
    record.publicReactActCompatibilityClaimed === false &&
    record.publicRootSchedulerCompatibilityClaimed === false &&
    record.publicRendererCompatibilityClaimed === false &&
    record.drainsPublicSchedulerTaskQueue === false &&
    record.drainsPublicReactActQueue === false &&
    record.executesQueuedWork === false &&
    record.executesEffects === false &&
    record.executesRendererWork === false &&
    record.executesRendererRoots === false
  );
}

function areSchedulerMockExpiredActRootWorkRecordsEqual(left, right) {
  return (
    isObjectLike(left) &&
    isObjectLike(right) &&
    isAcceptedSchedulerMockExpiredActRootWorkRecord(left, left.index) &&
    isAcceptedSchedulerMockExpiredActRootWorkRecord(right, right.index) &&
    schedulerMockExpiredActRootWorkRecordKeys.every(
      (key) => left[key] === right[key]
    )
  );
}

function isAcceptedSchedulerMockExpiredActRootWorkActQueueSummary(
  summary
) {
  return (
    isObjectLike(summary) &&
    hasSchedulerMockExpiredActRootWorkSourceProof(summary) &&
    summary.accepted === true &&
    summary.kind === privateActQueueTestQueueKind &&
    summary.version === privateActQueueTestQueueVersion &&
    isPositiveInteger(summary.pendingCount) &&
    Array.isArray(summary.records) &&
    hasSchedulerMockExpiredActRootWorkSourceProof(summary.records) &&
    summary.records.length === summary.pendingCount &&
    summary.records.every(isAcceptedSchedulerMockExpiredActRootWorkActTask) &&
    summary.drainsAcceptedInternalTestQueues === true &&
    summary.drainsPublicSchedulerTaskQueue === false &&
    summary.drainsPublicReactActQueue === false &&
    summary.executesQueuedWork === false &&
    summary.executesEffects === false
  );
}

function isAcceptedSchedulerMockExpiredActRootWorkActTask(task, index) {
  return (
    isObjectLike(task) &&
    hasSchedulerMockExpiredActRootWorkSourceProof(task) &&
    task.index === index &&
    typeof task.label === 'string' &&
    includesString(task.recordKind, acceptedActQueueRecordKinds) &&
    includesString(task.taskKind, acceptedActQueueTaskKinds) &&
    includesString(
      task.continuationStatus,
      acceptedActQueueContinuationStatuses
    ) &&
    isAcceptedSchedulerMockExpiredActRootWorkMetadataCallbackSummary(
      task.callback
    ) &&
    hasBlockedPublicCompatibilityClaims(task) &&
    hasBlockedPublicQueueAndExecutionClaims(task)
  );
}

function isAcceptedSchedulerMockExpiredActRootWorkCallbackSummary(
  callback
) {
  return (
    callback === null ||
    (isObjectLike(callback) &&
      hasSchedulerMockExpiredActRootWorkSourceProof(callback) &&
      hasExactOwnStringKeys(
        callback,
        schedulerMockExpiredActRootWorkCallbackSummaryKeys
      ) &&
      callback.kind === privateActQueueTestCallbackKind &&
      typeof callback.label === 'string' &&
      callback.executesQueuedWork === false &&
      callback.executesEffects === false)
  );
}

function isAcceptedSchedulerMockExpiredActRootWorkMetadataCallbackSummary(
  callback
) {
  if (
    isObjectLike(callback) &&
    hasSchedulerMockExpiredActRootWorkSourceProof(callback) &&
    hasExactOwnStringKeys(
      callback,
      schedulerMockExpiredActRootWorkCancelledCallbackSummaryKeys
    )
  ) {
    return callback.status === 'cancelled-tombstone';
  }

  return (
    isObjectLike(callback) &&
    hasSchedulerMockExpiredActRootWorkSourceProof(callback) &&
    hasExactOwnStringKeys(
      callback,
      schedulerMockExpiredActRootWorkMetadataCallbackSummaryKeys
    ) &&
    callback.status === 'branded-internal-test-callback' &&
    callback.kind === privateActQueueTestCallbackKind &&
    typeof callback.label === 'string' &&
    callback.executesQueuedWork === false &&
    callback.executesEffects === false
  );
}

function isAcceptedSchedulerMockExpiredActRootWorkMetadataSummary(
  metadata
) {
  return (
    isObjectLike(metadata) &&
    hasSchedulerMockExpiredActRootWorkSourceProof(metadata) &&
    metadata.kind === privateSchedulerMockExpiredActRootWorkMetadataKind &&
    metadata.version ===
      privateSchedulerMockExpiredActRootWorkMetadataVersion &&
    metadata.accepted === true &&
    metadata.rejectionReason === null &&
    metadata.compatibilityTarget === schedulerCompatibilityTarget &&
    metadata.reactCompatibilityTarget === compatibilityTarget &&
    typeof metadata.rootLabel === 'string' &&
    typeof metadata.laneLabel === 'string' &&
    isPositiveInteger(metadata.priorityLevel) &&
    typeof metadata.priorityLabel === 'string' &&
    typeof metadata.schedulerPriority === 'string' &&
    metadata.callbackHandleMatched === true &&
    isAcceptedSchedulerMockExpiredActRootWorkActQueueSummary(
      metadata.actQueue
    ) &&
    metadata.actQueuePendingCount === metadata.actQueue.pendingCount &&
    isPositiveInteger(metadata.rootWorkRecordCount) &&
    Array.isArray(metadata.rootWorkRecords) &&
    hasSchedulerMockExpiredActRootWorkSourceProof(
      metadata.rootWorkRecords
    ) &&
    metadata.rootWorkRecords.length === metadata.rootWorkRecordCount &&
    metadata.rootWorkRecords.every(
      isAcceptedSchedulerMockExpiredActRootWorkRecord
    ) &&
    metadata.rendererWorkExecutionBlocked === true &&
    metadata.rootWorkMetadataOnly === true &&
    metadata.actQueueHandoffOnly === true &&
    hasBlockedPublicCompatibilityClaims(metadata) &&
    hasBlockedPublicQueueAndExecutionClaims(metadata)
  );
}

function isAcceptedSchedulerMockExpiredActRootWorkConsumptionReport(
  report,
  expectedCount
) {
  if (
    !isObjectLike(report) ||
    !hasSchedulerMockExpiredActRootWorkSourceProof(report) ||
    !hasExactOwnStringKeys(
      report,
      schedulerMockExpiredActRootWorkConsumptionReportKeys
    ) ||
    report.status !== 'consumed-accepted-expired-act-root-work-records' ||
    report.accepted !== true ||
    report.pendingBefore !== expectedCount ||
    report.consumedCount !== expectedCount ||
    !isPositiveInteger(report.consumedCount) ||
    report.remainingCount !== 0 ||
    !Array.isArray(report.consumedRecords) ||
    !hasSchedulerMockExpiredActRootWorkSourceProof(
      report.consumedRecords
    ) ||
    report.consumedRecords.length !== expectedCount ||
    !report.consumedRecords.every(
      isAcceptedSchedulerMockExpiredActRootWorkRecord
    ) ||
    !hasBlockedPublicCompatibilityClaims(report) ||
    !hasBlockedPublicQueueAndExecutionClaims(report)
  ) {
    return false;
  }

  return true;
}

function isAcceptedSchedulerMockExpiredActRootWorkActQueueDrainReport(
  report,
  actQueueSummary
) {
  if (
    !isAcceptedSchedulerPrivateActQueueDrainReport(report) ||
    !hasSchedulerMockExpiredActRootWorkSourceProof(report) ||
    !hasExactOwnStringKeys(
      report,
      schedulerMockExpiredActRootWorkActQueueDrainReportKeys
    ) ||
    report.accepted !== true ||
    report.queueKind !== privateActQueueTestQueueKind ||
    !isPositiveInteger(report.pendingBefore) ||
    report.pendingBefore !== actQueueSummary.pendingCount ||
    report.drainedCount !== report.pendingBefore ||
    report.remainingCount !== 0 ||
    !isNonNegativeInteger(report.executedCallbackCount) ||
    !isNonNegativeInteger(report.recordedContinuationCount) ||
    !isNonNegativeInteger(report.executedContinuationCount) ||
    report.executedCallbackCount > report.drainedCount ||
    report.recordedContinuationCount !== report.executedContinuationCount ||
    !Array.isArray(report.drainedRecords) ||
    !hasSchedulerMockExpiredActRootWorkSourceProof(
      report.drainedRecords
    ) ||
    report.drainedRecords.length !== report.drainedCount ||
    !Array.isArray(report.recordedContinuations) ||
    !hasSchedulerMockExpiredActRootWorkSourceProof(
      report.recordedContinuations
    ) ||
    report.recordedContinuations.length !==
      report.recordedContinuationCount ||
    !Array.isArray(report.executedContinuations) ||
    !hasSchedulerMockExpiredActRootWorkSourceProof(
      report.executedContinuations
    ) ||
    report.executedContinuations.length !==
      report.executedContinuationCount ||
    report.executesBrandedInternalTestCallbacks !== true ||
    report.recordsBrandedInternalTestContinuations !== true ||
    report.executesBrandedInternalTestContinuations !== true ||
    report.drainsPublicSchedulerTaskQueue !== false ||
    report.drainsPublicReactActQueue !== false ||
    report.publicSchedulerTimingCompatibilityClaimed !== false ||
    report.publicReactActCompatibilityClaimed !== false ||
    report.executesQueuedWork !== false ||
    report.executesEffects !== false
  ) {
    return false;
  }

  const returnedContinuations = [];
  for (let index = 0; index < report.drainedRecords.length; index++) {
    const record = report.drainedRecords[index];
    const actQueueTask = actQueueSummary.records[index];
    if (
      !isAcceptedSchedulerMockExpiredActRootWorkDrainedRecord(
        record,
        index,
        actQueueTask
      )
    ) {
      return false;
    }
    if (record.returnedContinuation !== null) {
      returnedContinuations.push(record.returnedContinuation);
    }
  }

  if (returnedContinuations.length !== report.recordedContinuationCount) {
    return false;
  }

  for (let index = 0; index < returnedContinuations.length; index++) {
    const continuation = returnedContinuations[index];
    const sourceRecord = report.drainedRecords[continuation.sourceIndex];
    if (
      continuation !== report.recordedContinuations[index] ||
      continuation !== report.executedContinuations[index] ||
      !isAcceptedSchedulerMockExpiredActRootWorkContinuation(
        continuation,
        sourceRecord
      )
    ) {
      return false;
    }
  }

  return true;
}

function isAcceptedSchedulerMockExpiredActRootWorkDrainedRecord(
  record,
  index,
  actQueueTask
) {
  if (
    !isObjectLike(record) ||
    !hasSchedulerMockExpiredActRootWorkSourceProof(record) ||
    !hasExactOwnStringKeys(
      record,
      schedulerMockExpiredActRootWorkDrainedRecordKeys
    ) ||
    record.index !== index ||
    typeof record.label !== 'string' ||
    !includesString(record.recordKind, acceptedActQueueRecordKinds) ||
    !includesString(record.taskKind, acceptedActQueueTaskKinds) ||
    !includesString(
      record.continuationStatus,
      acceptedActQueueContinuationStatuses
    ) ||
    record.executesQueuedWork !== false ||
    record.executesEffects !== false
  ) {
    return false;
  }
  if (
    !isObjectLike(actQueueTask) ||
    record.label !== actQueueTask.label ||
    record.recordKind !== actQueueTask.recordKind ||
    record.taskKind !== actQueueTask.taskKind ||
    record.continuationStatus !== actQueueTask.continuationStatus
  ) {
    return false;
  }

  if (record.callbackStatus === 'no-callback') {
    return (
      actQueueTask.callback.status === 'cancelled-tombstone' &&
      record.callback === null &&
      record.returnedContinuation === null
    );
  }
  if (record.callbackStatus !== 'executed-branded-internal-test-callback') {
    return false;
  }

  return (
    isAcceptedSchedulerMockExpiredActRootWorkCallbackSummary(
      record.callback
    ) &&
    actQueueTask.callback.status === 'branded-internal-test-callback' &&
    record.callback.kind === actQueueTask.callback.kind &&
    record.callback.label === actQueueTask.callback.label &&
    (record.returnedContinuation === null ||
      isAcceptedSchedulerMockExpiredActRootWorkContinuation(
        record.returnedContinuation,
        record
      ))
  );
}

function isAcceptedSchedulerMockExpiredActRootWorkContinuation(
  continuation,
  sourceRecord
) {
  return (
    isObjectLike(continuation) &&
    hasSchedulerMockExpiredActRootWorkSourceProof(continuation) &&
    hasExactOwnStringKeys(
      continuation,
      schedulerMockExpiredActRootWorkContinuationKeys
    ) &&
    isNonNegativeInteger(continuation.sourceIndex) &&
    typeof continuation.sourceLabel === 'string' &&
    isObjectLike(sourceRecord) &&
    continuation.sourceIndex === sourceRecord.index &&
    continuation.sourceLabel === sourceRecord.label &&
    continuation.status === 'executed-branded-internal-test-continuation' &&
    isAcceptedSchedulerMockExpiredActRootWorkCallbackSummary(
      continuation.continuation
    ) &&
    (continuation.returnedContinuation === null ||
      isAcceptedSchedulerMockExpiredActRootWorkRecordedContinuation(
        continuation.returnedContinuation
      )) &&
    continuation.executesQueuedWork === false &&
    continuation.executesEffects === false
  );
}

function isAcceptedSchedulerMockExpiredActRootWorkRecordedContinuation(
  continuation
) {
  return (
    isObjectLike(continuation) &&
    hasSchedulerMockExpiredActRootWorkSourceProof(continuation) &&
    hasExactOwnStringKeys(
      continuation,
      schedulerMockExpiredActRootWorkRecordedContinuationKeys
    ) &&
    continuation.status ===
      'recorded-branded-internal-test-continuation' &&
    isAcceptedSchedulerMockExpiredActRootWorkCallbackSummary(
      continuation.continuation
    ) &&
    continuation.executesQueuedWork === false &&
    continuation.executesEffects === false
  );
}

function isAcceptedSchedulerMockExpiredActRootWorkFlushRoute(
  route,
  report
) {
  return (
    isObjectLike(route) &&
    hasSchedulerMockExpiredActRootWorkSourceProof(route) &&
    route.status ===
      'executed-expired-act-root-work-flush-all-or-expired-route' &&
    route.routeKind === 'flush-all-or-expired-act-root-work-diagnostics' &&
    hasSchedulerMockExpiredActRootWorkSourceProof(
      route.availableFlushHelpers
    ) &&
    hasExactStringSet(route.availableFlushHelpers, [
      'unstable_flushAll',
      'unstable_flushExpired'
    ]) &&
    includesString(route.selectedFlushHelper, [
      'unstable_flushAll',
      'unstable_flushExpired'
    ]) &&
    route.effectivePrivateDrainHelper === 'drainExpiredMockSchedulerWork' &&
    route.sourceDrainStatus === report.sourceDrainStatus &&
    route.sourceDrainFlushedExpiredWork === true &&
    route.rootWorkRecordConsumptionStatus ===
      report.rootWorkRecordConsumptionReport.status &&
    route.rootWorkRecordsPendingBefore === report.rootWorkRecordCount &&
    route.rootWorkRecordsPendingAfter === 0 &&
    route.rootWorkRecordsConsumedCount === report.rootWorkRecordCount &&
    route.actQueueDrainStatus === report.actQueueDrainReport.status &&
    route.actQueuePendingBefore === report.actQueuePendingBefore &&
    route.actQueuePendingAfter === 0 &&
    route.routesExpiredActRootWorkThroughFlushAllOrFlushExpiredDiagnostics ===
      true &&
    route.consumesAcceptedExpiredActRootWorkRecords === true &&
    route.drainsExpiredMockSchedulerWork === true &&
    route.drainsAcceptedInternalTestQueues === true &&
    route.invokesPublicSchedulerFlushHelper === false &&
    route.publicSchedulerFlushBehaviorExecuted === false &&
    route.executesAcceptedInternalTestCallbacks === true &&
    route.executesScheduledCallbacks === true &&
    hasBlockedPublicCompatibilityClaims(route) &&
    hasBlockedPublicQueueAndExecutionClaims(route)
  );
}

function isAcceptedSchedulerMockExpiredActRootWorkSourceDrain(report) {
  return (
    isObjectLike(report.sourceDrainReport) &&
    hasSchedulerMockExpiredActRootWorkSourceProof(report.sourceDrainReport) &&
    hasExactOwnStringKeys(
      report.sourceDrainReport,
      schedulerMockExpiredActRootWorkSourceDrainReportKeys
    ) &&
    report.sourceDrainStatus === report.sourceDrainReport.status &&
    report.sourceDrainFlushedExpiredWork === true &&
    report.sourceDrainReport.flushedExpiredWork === true &&
    report.sourceDrainHasMoreWorkAfterDrain ===
      report.sourceDrainReport.hasMoreWorkAfterDrain &&
    report.sourceDrainReport.status ===
      'drained-expired-mock-scheduler-work-for-diagnostics' &&
    report.sourceDrainReport.drainsExpiredMockSchedulerWork === true &&
    report.sourceDrainReport.expiredCallbackCountBefore === 1 &&
    report.sourceDrainReport.expiredCallbackCountAfter === 0 &&
    report.sourceDrainReport.drainsPublicReactActQueue === false &&
    report.sourceDrainReport.publicSchedulerTimingCompatibilityClaimed ===
      false &&
    report.sourceDrainReport.publicReactActCompatibilityClaimed === false
  );
}

function getRejectedSchedulerMockExpiredActRootWorkDiagnosticsReason(
  report
) {
  if (!isObjectLike(report)) {
    return 'scheduler-expired-act-root-diagnostics';
  }
  if (!Object.isFrozen(report)) {
    return 'scheduler-expired-act-root-diagnostics-not-frozen';
  }
  if (
    !Object.hasOwn(
      report,
      privateSchedulerMockExpiredActRootWorkDiagnosticsBrand
    ) ||
    report[privateSchedulerMockExpiredActRootWorkDiagnosticsBrand] !== true
  ) {
    return 'scheduler-expired-act-root-diagnostics-brand';
  }
  if (
    report.kind !== privateSchedulerMockExpiredActRootWorkDiagnosticsKind
  ) {
    return 'scheduler-expired-act-root-diagnostics-kind';
  }
  if (
    report.version !==
    privateSchedulerMockExpiredActRootWorkDiagnosticsVersion
  ) {
    return 'scheduler-expired-act-root-diagnostics-version';
  }
  if (
    report.status !== schedulerMockExpiredActRootWorkDiagnosticsStatus ||
    report.accepted !== true ||
    report.compatibilityTarget !== schedulerCompatibilityTarget ||
    report.reactCompatibilityTarget !== compatibilityTarget ||
    report.schedulerDiagnosticStatus !==
      schedulerPrivateActQueueFlushDiagnosticsStatus
  ) {
    return 'scheduler-expired-act-root-diagnostics-shape';
  }
  if (
    !hasBlockedPublicCompatibilityClaims(report) ||
    !hasBlockedPublicQueueAndExecutionClaims(report) ||
    report.drainsPublicSchedulerTaskQueue !== false ||
    report.drainsPublicReactActQueue !== false ||
    report.executesQueuedWork !== false ||
    report.executesEffects !== false ||
    report.executesRendererWork !== false ||
    report.executesRendererRoots !== false ||
    report.invokesPublicSchedulerFlushHelper !== false ||
    report.publicSchedulerFlushBehaviorExecuted !== false
  ) {
    return 'scheduler-expired-act-root-diagnostics-public-claim';
  }
  if (
    report.recognizesExpiredActRootWorkMetadata !== true ||
    report.linksExpiredCallbacksToAcceptedActRootWorkRecords !== true ||
    report.routesExpiredActRootWorkThroughFlushAllOrFlushExpiredDiagnostics !==
      true ||
    report.consumesAcceptedExpiredActRootWorkRecords !== true ||
    report.rejectsStaleExpiredActQueues !== true ||
    report.rejectsExpiredActRootWorkPublicCompatibilityClaims !== true ||
    report.drainsExpiredMockSchedulerWork !== true ||
    report.drainsAcceptedInternalTestQueues !== true ||
    report.executesAcceptedInternalTestCallbacks !== true
  ) {
    return 'scheduler-expired-act-root-diagnostics-policy';
  }
  if (
    !isAcceptedSchedulerMockExpiredActRootWorkMetadataSummary(
      report.expiredActRootWorkMetadata
    )
  ) {
    return 'scheduler-expired-act-root-diagnostics-metadata';
  }
  if (
    !isAcceptedSchedulerMockExpiredActRootWorkActQueueDrainReport(
      report.actQueueDrainReport,
      report.expiredActRootWorkMetadata.actQueue
    ) ||
    !isPositiveInteger(report.actQueuePendingBefore) ||
    report.actQueuePendingBefore !== report.actQueueDrainReport.pendingBefore ||
    report.actQueuePendingAfter !== 0 ||
    report.actQueuePendingAfter !== report.actQueueDrainReport.remainingCount
  ) {
    return 'scheduler-expired-act-root-diagnostics-act-queue-drain';
  }
  if (
    !isPositiveInteger(report.rootWorkRecordCount) ||
    !Array.isArray(report.rootWorkRecords) ||
    !Object.isFrozen(report.rootWorkRecords) ||
    report.rootWorkRecords !==
      report.expiredActRootWorkMetadata.rootWorkRecords ||
    report.rootWorkRecords.length !== report.rootWorkRecordCount ||
    !report.rootWorkRecords.every(
      isAcceptedSchedulerMockExpiredActRootWorkRecord
    ) ||
    report.rootWorkRecordsPendingBefore !== report.rootWorkRecordCount ||
    report.rootWorkRecordsPendingAfter !== 0 ||
    report.rootWorkRecordsConsumedCount !== report.rootWorkRecordCount ||
    !isAcceptedSchedulerMockExpiredActRootWorkConsumptionReport(
      report.rootWorkRecordConsumptionReport,
      report.rootWorkRecordCount
    ) ||
    !report.rootWorkRecords.every((record, index) =>
      areSchedulerMockExpiredActRootWorkRecordsEqual(
        record,
        report.rootWorkRecordConsumptionReport.consumedRecords[index]
      )
    )
  ) {
    return 'scheduler-expired-act-root-diagnostics-root-work-consumption';
  }
  if (
    !isAcceptedSchedulerMockExpiredActRootWorkFlushRoute(
      report.flushAllOrFlushExpiredRoute,
      report
    )
  ) {
    return 'scheduler-expired-act-root-diagnostics-flush-route';
  }
  if (!isAcceptedSchedulerMockExpiredActRootWorkSourceDrain(report)) {
    return 'scheduler-expired-act-root-diagnostics-source-drain';
  }
  if (!hasSchedulerMockExpiredActRootWorkSourceProof(report)) {
    return 'scheduler-expired-act-root-diagnostics-source-proof';
  }
  return null;
}

function isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(report) {
  return (
    getRejectedSchedulerMockExpiredActRootWorkDiagnosticsReason(report) ===
    null
  );
}

function summarizeSchedulerMockExpiredActRootWorkRecordConsumption(
  report
) {
  return Object.freeze({
    recordCount: report.rootWorkRecordCount,
    pendingBefore: report.rootWorkRecordsPendingBefore,
    consumedCount: report.rootWorkRecordsConsumedCount,
    remainingCount: report.rootWorkRecordsPendingAfter,
    records: report.rootWorkRecordConsumptionReport.consumedRecords
  });
}

function summarizeSchedulerMockExpiredActRootWorkActQueueDrain(report) {
  return Object.freeze({
    pendingBefore: report.actQueueDrainReport.pendingBefore,
    drainedCount: report.actQueueDrainReport.drainedCount,
    executedCallbackCount: report.actQueueDrainReport.executedCallbackCount,
    recordedContinuationCount:
      report.actQueueDrainReport.recordedContinuationCount,
    executedContinuationCount:
      report.actQueueDrainReport.executedContinuationCount,
    remainingCount: report.actQueueDrainReport.remainingCount,
    records: report.actQueueDrainReport.drainedRecords
  });
}

function consumeSchedulerMockExpiredActRootWorkDiagnostics(report) {
  const rejectionReason =
    getRejectedSchedulerMockExpiredActRootWorkDiagnosticsReason(report);
  if (rejectionReason !== null) {
    throw createSchedulerMockExpiredActRootWorkDiagnosticsGateError(
      rejectionReason
    );
  }

  return Object.freeze({
    status: schedulerMockExpiredActRootWorkConsumptionStatus,
    accepted: true,
    schedulerMockExpiredActRootWorkDiagnosticsStatus: report.status,
    schedulerMockExpiredActRootWorkDiagnosticKind: report.kind,
    schedulerMockExpiredActRootWorkDiagnosticVersion: report.version,
    schedulerDiagnosticStatus: report.schedulerDiagnosticStatus,
    expiredCallbackPriorityLevel: report.expiredCallbackPriorityLevel,
    expiredCallbackPriorityLabel: report.expiredCallbackPriorityLabel,
    expiredCallbackSchedulerPriority:
      report.expiredCallbackSchedulerPriority,
    expiredCallbackVirtualTime: report.expiredCallbackVirtualTime,
    expiredCallbackLaneLabel: report.expiredCallbackLaneLabel,
    selectedFlushHelper:
      report.flushAllOrFlushExpiredRoute.selectedFlushHelper,
    rootWorkRecordSummary:
      summarizeSchedulerMockExpiredActRootWorkRecordConsumption(report),
    actQueueDrainSummary:
      summarizeSchedulerMockExpiredActRootWorkActQueueDrain(report),
    expiredActRootWorkMetadata: report.expiredActRootWorkMetadata,
    actQueueDrainReport: report.actQueueDrainReport,
    rootWorkRecordConsumptionReport:
      report.rootWorkRecordConsumptionReport,
    flushAllOrFlushExpiredRoute: report.flushAllOrFlushExpiredRoute,
    schedulerMockExpiredActRootWorkDiagnosticsReady: true,
    consumesSchedulerMockExpiredActRootWorkDiagnostics: true,
    drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics: true,
    consumesAcceptedExpiredActRootWorkRecords: true,
    drainsAcceptedInternalTestQueues: true,
    queueFlushingReady: false,
    rendererRootsReady: false,
    passiveEffectsReady: false,
    continuationFlushingReady: false,
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false
  });
}

function isAcceptedSchedulerMockDelayedRendererRootWorkMetadataSummary(
  metadata,
  delayedActRootWorkMetadata
) {
  return (
    isObjectLike(metadata) &&
    Object.isFrozen(metadata) &&
    metadata.kind ===
      privateSchedulerMockDelayedRendererRootWorkMetadataKind &&
    metadata.version ===
      privateSchedulerMockDelayedRendererRootWorkMetadataVersion &&
    metadata.status === schedulerMockDelayedRendererRootWorkMetadataStatus &&
    metadata.accepted === true &&
    metadata.sourceEvidenceMatches === true &&
    metadata.compatibilityTarget === schedulerCompatibilityTarget &&
    metadata.reactCompatibilityTarget === compatibilityTarget &&
    metadata.rootId !== null &&
    metadata.rootId !== undefined &&
    typeof metadata.rootLabel === 'string' &&
    typeof metadata.lane === 'string' &&
    typeof metadata.laneLabel === 'string' &&
    metadata.producerStatus ===
      schedulerMockDelayedRendererRootWorkProducerStatus &&
    (metadata.rootRequestId === null ||
      typeof metadata.rootRequestId === 'string') &&
    (metadata.rootRequestSequence === null ||
      isNonNegativeInteger(metadata.rootRequestSequence)) &&
    (metadata.rootOperation === null ||
      typeof metadata.rootOperation === 'string') &&
    isPositiveInteger(metadata.actQueueRecordCount) &&
    isPositiveInteger(metadata.rootWorkRecordCount) &&
    isNonNegativeFiniteNumber(metadata.scheduledVirtualTime) &&
    isPositiveFiniteNumber(metadata.delayMs) &&
    isPositiveFiniteNumber(metadata.startTime) &&
    isPositiveFiniteNumber(metadata.expirationTime) &&
    isPositiveFiniteNumber(metadata.priorityTimeoutMs) &&
    metadata.rendererWorkExecutionBlocked === true &&
    metadata.rootWorkMetadataOnly === true &&
    metadata.actQueueHandoffOnly === true &&
    metadata.delayedCallbackPromotionOnly === true &&
    metadata.privateActRootHandoffOnly === true &&
    hasBlockedPublicCompatibilityClaims(metadata) &&
    hasBlockedPublicQueueAndExecutionClaims(metadata) &&
    (!isObjectLike(delayedActRootWorkMetadata) ||
      (metadata.rootId === delayedActRootWorkMetadata.rootId &&
        metadata.rootLabel === delayedActRootWorkMetadata.rootLabel &&
        metadata.lane === delayedActRootWorkMetadata.lane &&
        metadata.laneLabel === delayedActRootWorkMetadata.laneLabel &&
        metadata.scheduledVirtualTime ===
          delayedActRootWorkMetadata.scheduledVirtualTime &&
        metadata.delayMs === delayedActRootWorkMetadata.delayMs &&
        metadata.startTime === delayedActRootWorkMetadata.startTime &&
        metadata.expirationTime ===
          delayedActRootWorkMetadata.expirationTime &&
        metadata.priorityTimeoutMs ===
          delayedActRootWorkMetadata.priorityTimeoutMs))
  );
}

function isAcceptedSchedulerMockDelayedActRootWorkProducerSummary(
  metadata
) {
  if (
    metadata.producerKind ===
      schedulerMockDelayedActRootWorkAcceptedRootProducerKind ||
    metadata.producerKind === undefined
  ) {
    return (
      metadata.producerStatus ===
        schedulerMockDelayedActRootWorkAcceptedRootProducerStatus &&
      metadata.producedByPrivateDelayedRendererRootProducer === false &&
      metadata.rendererRootMetadata === null
    );
  }

  if (
    metadata.producerKind !==
    schedulerMockDelayedActRootWorkAcceptedRendererRootProducerKind
  ) {
    return false;
  }

  return (
    metadata.producerStatus ===
      schedulerMockDelayedActRootWorkAcceptedRendererRootProducerStatus &&
    metadata.producedByPrivateDelayedRendererRootProducer === true &&
    isAcceptedSchedulerMockDelayedRendererRootWorkMetadataSummary(
      metadata.rendererRootMetadata,
      metadata
    )
  );
}

function isAcceptedSchedulerMockDelayedActRootWorkMetadataSummary(
  metadata
) {
  return (
    isObjectLike(metadata) &&
    Object.isFrozen(metadata) &&
    metadata.kind === privateSchedulerMockDelayedActRootWorkMetadataKind &&
    metadata.version ===
      privateSchedulerMockDelayedActRootWorkMetadataVersion &&
    metadata.accepted === true &&
    metadata.rejectionReason === null &&
    metadata.compatibilityTarget === schedulerCompatibilityTarget &&
    metadata.reactCompatibilityTarget === compatibilityTarget &&
    typeof metadata.rootLabel === 'string' &&
    typeof metadata.laneLabel === 'string' &&
    isPositiveInteger(metadata.priorityLevel) &&
    typeof metadata.priorityLabel === 'string' &&
    typeof metadata.schedulerPriority === 'string' &&
    metadata.callbackHandleMatched === true &&
    metadata.callbackHandleDelayedPending === true &&
    metadata.producedByPrivateDelayedActRootWorkMetadataProducer === true &&
    isAcceptedSchedulerMockDelayedActRootWorkProducerSummary(metadata) &&
    isNonNegativeFiniteNumber(metadata.scheduledVirtualTime) &&
    isPositiveFiniteNumber(metadata.delayMs) &&
    isPositiveFiniteNumber(metadata.startTime) &&
    isPositiveFiniteNumber(metadata.expirationTime) &&
    isPositiveFiniteNumber(metadata.priorityTimeoutMs) &&
    metadata.promotionTargetVirtualTime === metadata.expirationTime &&
    metadata.advanceTimeBy ===
      metadata.expirationTime - metadata.currentVirtualTime &&
    metadata.delayMatchesCallbackHandle === true &&
    metadata.startTimeMatchesCallbackHandle === true &&
    metadata.expirationTimeMatchesCallbackHandle === true &&
    metadata.priorityTimeoutMatchesCallbackHandle === true &&
    isAcceptedSchedulerMockExpiredActRootWorkMetadataSummary(
      metadata.expiredActRootWorkMetadata
    ) &&
    metadata.rootId === metadata.expiredActRootWorkMetadata.rootId &&
    metadata.rootLabel === metadata.expiredActRootWorkMetadata.rootLabel &&
    metadata.lane === metadata.expiredActRootWorkMetadata.lane &&
    metadata.laneLabel === metadata.expiredActRootWorkMetadata.laneLabel &&
    metadata.rendererWorkExecutionBlocked === true &&
    metadata.rootWorkMetadataOnly === true &&
    metadata.actQueueHandoffOnly === true &&
    metadata.delayedCallbackPromotionOnly === true &&
    hasBlockedPublicCompatibilityClaims(metadata) &&
    hasBlockedPublicQueueAndExecutionClaims(metadata)
  );
}

function hasAcceptedSchedulerMockDelayedActRootWorkRendererRootReportEvidence(
  report
) {
  if (!isObjectLike(report)) {
    return false;
  }

  const metadata = report.delayedActRootWorkMetadata;
  if (!isObjectLike(metadata)) {
    return false;
  }

  if (
    metadata.producerKind ===
      schedulerMockDelayedActRootWorkAcceptedRootProducerKind ||
    metadata.producerKind === undefined
  ) {
    return (
      report.producedByPrivateDelayedRendererRootProducer === false &&
      report.delayedRendererRootMetadata === null
    );
  }

  if (
    metadata.producerKind !==
    schedulerMockDelayedActRootWorkAcceptedRendererRootProducerKind
  ) {
    return false;
  }

  return (
    report.producedByPrivateDelayedRendererRootProducer === true &&
    report.delayedRendererRootMetadata === metadata.rendererRootMetadata &&
    isAcceptedSchedulerMockDelayedRendererRootWorkMetadataSummary(
      report.delayedRendererRootMetadata,
      metadata
    )
  );
}

function isAcceptedSchedulerMockDelayedActRootWorkPromotionEvidence(
  evidence,
  metadata,
  report
) {
  return (
    isObjectLike(evidence) &&
    Object.isFrozen(evidence) &&
    isObjectLike(metadata) &&
    evidence.status ===
      'promoted-delayed-callback-to-expired-mock-scheduler-work-for-diagnostics' &&
    evidence.accepted === true &&
    evidence.scheduledVirtualTime === metadata.scheduledVirtualTime &&
    evidence.delayMs === metadata.delayMs &&
    evidence.startTime === metadata.startTime &&
    evidence.expirationTime === metadata.expirationTime &&
    evidence.priorityTimeoutMs === metadata.priorityTimeoutMs &&
    evidence.virtualTimeBefore === report.delayedCallbackVirtualTimeBefore &&
    evidence.virtualTimeAfterPromotion ===
      report.delayedCallbackVirtualTimeAfterPromotion &&
    evidence.advanceTimeBy === report.delayedCallbackAdvanceTimeBy &&
    evidence.advanceTimeReturnedUndefined === true &&
    evidence.sortIndexBefore === metadata.startTime &&
    evidence.sortIndexAfterPromotion === metadata.expirationTime &&
    evidence.delayedPendingBefore === true &&
    evidence.expiredAfterPromotion === true &&
    evidence.promotedDelayedCallbackToExpiredWork === true &&
    evidence.usesWallClockTime === false &&
    evidence.usesPublicSchedulerFrameInterval === false &&
    hasBlockedPublicCompatibilityClaims(evidence) &&
    hasBlockedPublicQueueAndExecutionClaims(evidence)
  );
}

function isAcceptedSchedulerMockDelayedActRootWorkNestedExpiredLink(
  report,
  nestedExpiredReport
) {
  return (
    isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(
      nestedExpiredReport
    ) &&
    report.expiredActRootWorkDrainStatus === nestedExpiredReport.status &&
    report.expiredActRootWorkRouteSelectedFlushHelper ===
      nestedExpiredReport.flushAllOrFlushExpiredRoute.selectedFlushHelper &&
    report.delayedCallbackPriorityLevel ===
      report.delayedActRootWorkMetadata.priorityLevel &&
    report.delayedCallbackPriorityLabel ===
      report.delayedActRootWorkMetadata.priorityLabel &&
    report.delayedCallbackSchedulerPriority ===
      report.delayedActRootWorkMetadata.schedulerPriority &&
    report.delayedCallbackScheduledVirtualTime ===
      report.delayedActRootWorkMetadata.scheduledVirtualTime &&
    report.delayedCallbackDelayMs ===
      report.delayedActRootWorkMetadata.delayMs &&
    report.delayedCallbackStartTime ===
      report.delayedActRootWorkMetadata.startTime &&
    report.delayedCallbackExpirationTime ===
      report.delayedActRootWorkMetadata.expirationTime &&
    report.delayedCallbackPriorityTimeoutMs ===
      report.delayedActRootWorkMetadata.priorityTimeoutMs &&
    report.delayedCallbackVirtualTimeBefore === report.nowBefore &&
    report.delayedCallbackVirtualTimeAfterPromotion ===
      report.nowAfterPromotion &&
    report.delayedCallbackAdvanceTimeBy ===
      report.delayedCallbackExpirationTime - report.nowBefore &&
    report.actQueuePendingBefore ===
      nestedExpiredReport.actQueuePendingBefore &&
    report.actQueuePendingAfter === nestedExpiredReport.actQueuePendingAfter &&
    report.rootWorkRecordsPendingBefore ===
      nestedExpiredReport.rootWorkRecordsPendingBefore &&
    report.rootWorkRecordsPendingAfter ===
      nestedExpiredReport.rootWorkRecordsPendingAfter &&
    report.rootWorkRecordsConsumedCount ===
      nestedExpiredReport.rootWorkRecordsConsumedCount &&
    report.sourceDrainReport === nestedExpiredReport.sourceDrainReport &&
    report.sourceDrainStatus === nestedExpiredReport.sourceDrainStatus &&
    report.sourceDrainFlushedExpiredWork ===
      nestedExpiredReport.sourceDrainFlushedExpiredWork &&
    report.sourceDrainHasMoreWorkAfterDrain ===
      nestedExpiredReport.sourceDrainHasMoreWorkAfterDrain
  );
}

function getRejectedSchedulerMockDelayedActRootWorkDiagnosticsReason(
  report
) {
  if (!isObjectLike(report)) {
    return 'scheduler-delayed-act-root-diagnostics';
  }
  if (!Object.isFrozen(report)) {
    return 'scheduler-delayed-act-root-diagnostics-not-frozen';
  }
  if (
    !Object.hasOwn(
      report,
      privateSchedulerMockDelayedActRootWorkDiagnosticsBrand
    ) ||
    report[privateSchedulerMockDelayedActRootWorkDiagnosticsBrand] !== true
  ) {
    return 'scheduler-delayed-act-root-diagnostics-brand';
  }
  if (
    report.kind !== privateSchedulerMockDelayedActRootWorkDiagnosticsKind
  ) {
    return 'scheduler-delayed-act-root-diagnostics-kind';
  }
  if (
    report.version !==
    privateSchedulerMockDelayedActRootWorkDiagnosticsVersion
  ) {
    return 'scheduler-delayed-act-root-diagnostics-version';
  }
  if (
    report.status !== schedulerMockDelayedActRootWorkDiagnosticsStatus ||
    report.accepted !== true ||
    report.compatibilityTarget !== schedulerCompatibilityTarget ||
    report.reactCompatibilityTarget !== compatibilityTarget ||
    report.schedulerDiagnosticStatus !==
      schedulerPrivateActQueueFlushDiagnosticsStatus
  ) {
    return 'scheduler-delayed-act-root-diagnostics-shape';
  }
  if (
    !hasBlockedPublicCompatibilityClaims(report) ||
    !hasBlockedPublicQueueAndExecutionClaims(report) ||
    report.drainsPublicSchedulerTaskQueue !== false ||
    report.drainsPublicReactActQueue !== false ||
    report.executesQueuedWork !== false ||
    report.executesEffects !== false ||
    report.executesRendererWork !== false ||
    report.executesRendererRoots !== false ||
    report.invokesPublicSchedulerFlushHelper !== false ||
    report.publicSchedulerFlushBehaviorExecuted !== false
  ) {
    return 'scheduler-delayed-act-root-diagnostics-public-claim';
  }
  if (
    report.recognizesDelayedActRootWorkMetadata !== true ||
    report.validatesDelayedCallbackDelayStartAndExpirationMetadata !== true ||
    report.recordsDelayedCallbackVirtualTimePromotionEvidence !== true ||
    report.advancesMockVirtualTimeToDelayedCallbackExpiration !== true ||
    report.consumesDelayedActRootWorkThroughExpiredActRootRoute !== true ||
    report.rejectsAmbiguousDelayedOrExpiredCallbackHandles !== true ||
    report.rejectsDelayedActRootWorkPublicCompatibilityClaims !== true ||
    report.producesDelayedActRootWorkMetadataFromAcceptedRootMetadata !==
      true ||
    report.producesDelayedActRootWorkMetadataFromAcceptedRendererRootMetadata !==
      true ||
    report.createsDelayedRendererRootWorkMetadataForDiagnostics !== true ||
    report.recognizesDelayedRendererRootWorkMetadata !== true ||
    report.bindsDelayedRendererRootProducerEvidence !== true ||
    report.rejectsStaleDelayedRendererRootProducerEvidence !== true ||
    report.rejectsClonedDelayedRendererRootSourceEvidence !== true ||
    report.handsOffDelayedRendererRootWorkThroughPrivateActRootRoute !==
      true ||
    report.rejectsUnownedDelayedActRootWorkMetadata !== true ||
    report.rejectsClonedDelayedActRootWorkEvidence !== true ||
    report.bindsProducedDelayedActRootWorkNestedEvidence !== true ||
    report.rejectsMutatedDelayedActRootWorkNestedEvidence !== true ||
    report.recognizesExpiredActRootWorkMetadata !== true ||
    report.linksExpiredCallbacksToAcceptedActRootWorkRecords !== true ||
    report.routesExpiredActRootWorkThroughFlushAllOrFlushExpiredDiagnostics !==
      true ||
    report.consumesAcceptedExpiredActRootWorkRecords !== true ||
    report.drainsExpiredMockSchedulerWork !== true ||
    report.drainsAcceptedInternalTestQueues !== true ||
    report.executesAcceptedInternalTestCallbacks !== true
  ) {
    return 'scheduler-delayed-act-root-diagnostics-policy';
  }
  if (
    !isAcceptedSchedulerMockDelayedActRootWorkMetadataSummary(
      report.delayedActRootWorkMetadata
    )
  ) {
    return 'scheduler-delayed-act-root-diagnostics-metadata';
  }
  if (
    !hasAcceptedSchedulerMockDelayedActRootWorkRendererRootReportEvidence(
      report
    )
  ) {
    return 'scheduler-delayed-act-root-diagnostics-renderer-root-source';
  }
  if (
    !isAcceptedSchedulerMockDelayedActRootWorkPromotionEvidence(
      report.delayedCallbackPromotionEvidence,
      report.delayedActRootWorkMetadata,
      report
    )
  ) {
    return 'scheduler-delayed-act-root-diagnostics-promotion-evidence';
  }
  if (
    !isObjectLike(report.expiredActRootWorkDrainReport) ||
    !isAcceptedSchedulerMockDelayedActRootWorkNestedExpiredLink(
      report,
      report.expiredActRootWorkDrainReport
    )
  ) {
    return 'scheduler-delayed-act-root-diagnostics-nested-expired';
  }
  if (!isAcceptedSchedulerMockExpiredActRootWorkSourceDrain(report)) {
    return 'scheduler-delayed-act-root-diagnostics-source-drain';
  }
  if (!hasSchedulerMockExpiredActRootWorkSourceProof(report)) {
    return 'scheduler-delayed-act-root-diagnostics-source-proof';
  }
  return null;
}

function isAcceptedSchedulerMockDelayedActRootWorkDiagnostics(report) {
  return (
    getRejectedSchedulerMockDelayedActRootWorkDiagnosticsReason(report) ===
    null
  );
}

function preflightSchedulerMockDelayedActRootWorkDiagnostics(report) {
  const rejectionReason =
    getRejectedSchedulerMockDelayedActRootWorkDiagnosticsReason(report);
  if (rejectionReason !== null) {
    throw createSchedulerMockDelayedActRootWorkDiagnosticsGateError(
      rejectionReason
    );
  }

  const nestedExpiredConsumption =
    consumeSchedulerMockExpiredActRootWorkDiagnostics(
      report.expiredActRootWorkDrainReport
    );

  return Object.freeze({
    status: schedulerMockDelayedActRootWorkPreflightStatus,
    accepted: true,
    schedulerMockDelayedActRootWorkDiagnosticsStatus: report.status,
    schedulerMockDelayedActRootWorkDiagnosticKind: report.kind,
    schedulerMockDelayedActRootWorkDiagnosticVersion: report.version,
    schedulerMockExpiredActRootWorkDiagnosticsStatus:
      report.expiredActRootWorkDrainReport.status,
    schedulerMockExpiredActRootWorkDiagnosticKind:
      report.expiredActRootWorkDrainReport.kind,
    schedulerMockExpiredActRootWorkDiagnosticVersion:
      report.expiredActRootWorkDrainReport.version,
    schedulerDiagnosticStatus: report.schedulerDiagnosticStatus,
    delayedCallbackPriorityLevel: report.delayedCallbackPriorityLevel,
    delayedCallbackPriorityLabel: report.delayedCallbackPriorityLabel,
    delayedCallbackSchedulerPriority:
      report.delayedCallbackSchedulerPriority,
    delayedCallbackScheduledVirtualTime:
      report.delayedCallbackScheduledVirtualTime,
    delayedCallbackDelayMs: report.delayedCallbackDelayMs,
    delayedCallbackStartTime: report.delayedCallbackStartTime,
    delayedCallbackExpirationTime: report.delayedCallbackExpirationTime,
    delayedCallbackPriorityTimeoutMs:
      report.delayedCallbackPriorityTimeoutMs,
    delayedCallbackVirtualTimeBefore:
      report.delayedCallbackVirtualTimeBefore,
    delayedCallbackVirtualTimeAfterPromotion:
      report.delayedCallbackVirtualTimeAfterPromotion,
    delayedCallbackAdvanceTimeBy: report.delayedCallbackAdvanceTimeBy,
    delayedActRootWorkProducerKind:
      report.delayedActRootWorkMetadata.producerKind,
    delayedActRootWorkProducerStatus:
      report.delayedActRootWorkMetadata.producerStatus,
    producedByPrivateDelayedRendererRootProducer:
      report.producedByPrivateDelayedRendererRootProducer === true,
    rendererRootSourceEvidencePresent:
      isObjectLike(report.delayedRendererRootMetadata),
    rendererRootSourceEvidenceOwned:
      report.producedByPrivateDelayedRendererRootProducer === true &&
      isAcceptedSchedulerMockDelayedRendererRootWorkMetadataSummary(
        report.delayedRendererRootMetadata,
        report.delayedActRootWorkMetadata
      ),
    selectedFlushHelper: report.expiredActRootWorkRouteSelectedFlushHelper,
    nestedExpiredActRootWorkConsumption: nestedExpiredConsumption,
    rootWorkRecordSummary:
      nestedExpiredConsumption.rootWorkRecordSummary,
    actQueueDrainSummary: nestedExpiredConsumption.actQueueDrainSummary,
    delayedActRootWorkMetadata: report.delayedActRootWorkMetadata,
    delayedRendererRootMetadata: report.delayedRendererRootMetadata,
    expiredActRootWorkDrainReport: report.expiredActRootWorkDrainReport,
    delayedCallbackPromotionEvidence:
      report.delayedCallbackPromotionEvidence,
    schedulerMockDelayedActRootWorkDiagnosticsReady: true,
    preflightsSchedulerMockDelayedActRootWorkDiagnostics: true,
    acceptsSchedulerMockDelayedActRootWorkOnlyAsNestedExpiredDiagnostics:
      true,
    acceptsTopLevelDelayedActRootWorkAsPublicActEvidence: false,
    consumesSchedulerMockExpiredActRootWorkDiagnostics: true,
    drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics: true,
    consumesAcceptedExpiredActRootWorkRecords: true,
    drainsAcceptedInternalTestQueues: true,
    queueFlushingReady: false,
    rendererRootsReady: false,
    passiveEffectsReady: false,
    continuationFlushingReady: false,
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false
  });
}

function getDispatcherActQueueMetadata(dispatcher) {
  if (!isObjectLike(dispatcher)) {
    return null;
  }

  return dispatcher[privateActQueueMetadataSymbol] ?? null;
}

function createPrivateActDispatcherGateError() {
  return createUnimplementedError(
    entrypoint,
    `${privateActDispatcherGateExport}.markPrivateActDispatcher`,
    'rejected dispatcher metadata',
    'Only accepted data-only act queue metadata can pass this package-private gate.'
  );
}

function createSchedulerPrivateActContinuationDiagnosticsGateError(reason) {
  const error = createUnimplementedError(
    entrypoint,
    `${privateActDispatcherGateExport}.consumeSchedulerPrivateActContinuationDiagnostics`,
    'rejected Scheduler private continuation diagnostics',
    'Only accepted Scheduler private continuation diagnostics can pass this package-private gate.'
  );
  error.reason = reason;
  error.publicCompatibilityClaimed = false;
  error.publicSchedulerTimingCompatibilityClaimed = false;
  error.publicReactActCompatibilityClaimed = false;
  return error;
}

function createRendererBackedActDrainDiagnosticsGateError(reason) {
  const error = createUnimplementedError(
    entrypoint,
    `${privateActDispatcherGateExport}.consumeRendererBackedActDrainDiagnostics`,
    'rejected renderer-backed act drain diagnostics',
    'Only accepted private Scheduler/reconciler renderer-backed act drain diagnostics can pass this package-private gate.'
  );
  error.reason = reason;
  error.publicCompatibilityClaimed = false;
  error.publicSchedulerTimingCompatibilityClaimed = false;
  error.publicReactActCompatibilityClaimed = false;
  return error;
}

function createSchedulerPostTaskYieldActRootHandoffDiagnosticsGateError(
  reason,
  details
) {
  const error = createUnimplementedError(
    entrypoint,
    `${privateActDispatcherGateExport}.consumeSchedulerPostTaskYieldActRootHandoffDiagnostics`,
    'rejected Scheduler postTask scheduler.yield act/root handoff diagnostics',
    'Only the accepted private scheduler.yield postTask act/root handoff diagnostics can pass this package-private gate.'
  );
  error.reason = reason;
  error.details = details || null;
  error.publicCompatibilityClaimed = false;
  error.browserPostTaskCompatibilityClaimed = false;
  error.browserTaskOrderingCompatibilityClaimed = false;
  error.publicSchedulerTimingCompatibilityClaimed = false;
  error.publicReactActCompatibilityClaimed = false;
  error.publicRootSchedulerCompatibilityClaimed = false;
  error.publicRendererCompatibilityClaimed = false;
  return error;
}

function createSchedulerMockExpiredActRootWorkDiagnosticsGateError(
  reason
) {
  const error = createUnimplementedError(
    entrypoint,
    `${privateActDispatcherGateExport}.consumeSchedulerMockExpiredActRootWorkDiagnostics`,
    'rejected Scheduler mock expired act/root work diagnostics',
    'Only accepted private scheduler/unstable_mock expired act/root work diagnostics can pass this package-private gate.'
  );
  error.reason = reason;
  error.publicCompatibilityClaimed = false;
  error.publicSchedulerTimingCompatibilityClaimed = false;
  error.publicReactActCompatibilityClaimed = false;
  error.publicRootSchedulerCompatibilityClaimed = false;
  error.publicRendererCompatibilityClaimed = false;
  error.drainsPublicSchedulerTaskQueue = false;
  error.drainsPublicReactActQueue = false;
  error.executesQueuedWork = false;
  error.executesEffects = false;
  error.executesRendererWork = false;
  error.executesRendererRoots = false;
  return error;
}

function createSchedulerMockDelayedActRootWorkDiagnosticsGateError(
  reason
) {
  const error = createUnimplementedError(
    entrypoint,
    `${privateActDispatcherGateExport}.preflightSchedulerMockDelayedActRootWorkDiagnostics`,
    'rejected Scheduler mock delayed act/root work diagnostics',
    'Only accepted private scheduler/unstable_mock delayed act/root work diagnostics with nested expired act/root evidence can pass this package-private preflight.'
  );
  error.reason = reason;
  error.publicCompatibilityClaimed = false;
  error.publicSchedulerTimingCompatibilityClaimed = false;
  error.publicReactActCompatibilityClaimed = false;
  error.publicRootSchedulerCompatibilityClaimed = false;
  error.publicRendererCompatibilityClaimed = false;
  error.drainsPublicSchedulerTaskQueue = false;
  error.drainsPublicReactActQueue = false;
  error.acceptsTopLevelDelayedActRootWorkAsPublicActEvidence = false;
  error.executesQueuedWork = false;
  error.executesEffects = false;
  error.executesRendererWork = false;
  error.executesRendererRoots = false;
  return error;
}

function markPrivateActDispatcher(dispatcher) {
  if (!isAcceptedActQueueMetadata(getDispatcherActQueueMetadata(dispatcher))) {
    throw createPrivateActDispatcherGateError();
  }

  privateActDispatchers.add(dispatcher);
  return dispatcher;
}

function isPrivateActDispatcher(dispatcher) {
  return isObjectLike(dispatcher) && privateActDispatchers.has(dispatcher);
}

function getPrivateActQueueMetadata(dispatcher) {
  if (!isPrivateActDispatcher(dispatcher)) {
    return null;
  }

  const metadata = getDispatcherActQueueMetadata(dispatcher);
  return isAcceptedActQueueMetadata(metadata) ? metadata : null;
}

function consumeSchedulerPrivateActContinuationDiagnostics(
  diagnostics,
  queue
) {
  if (!isAcceptedSchedulerPrivateActQueueFlushDiagnostics(diagnostics)) {
    throw createSchedulerPrivateActContinuationDiagnosticsGateError(
      'scheduler-diagnostics'
    );
  }
  if (!isAcceptedInternalActQueueTestQueue(queue)) {
    throw createSchedulerPrivateActContinuationDiagnosticsGateError(
      'internal-act-queue'
    );
  }

  const pendingBefore = queue.records.length;
  const description = diagnostics.describeAcceptedInternalActQueue(queue);
  if (
    !isAcceptedSchedulerPrivateActQueueDescription(
      description,
      pendingBefore
    )
  ) {
    throw createSchedulerPrivateActContinuationDiagnosticsGateError(
      'scheduler-description'
    );
  }

  const drainReport = diagnostics.drainAcceptedInternalActQueue(queue);
  if (!isAcceptedSchedulerPrivateActQueueDrainReport(drainReport)) {
    throw createSchedulerPrivateActContinuationDiagnosticsGateError(
      'scheduler-drain-report'
    );
  }

  const continuationSummary =
    summarizeSchedulerPrivateActQueueDrainedRecords(
      drainReport.drainedRecords
    );

  return Object.freeze({
    status: schedulerPrivateActContinuationConsumptionStatus,
    accepted: true,
    schedulerDiagnosticsStatus: diagnostics.status,
    schedulerDiagnosticsExportName: diagnostics.exportName,
    queueKind: drainReport.queueKind,
    pendingBefore: drainReport.pendingBefore,
    drainedCount: drainReport.drainedCount,
    remainingCount: drainReport.remainingCount,
    continuationSummary,
    schedulerDescription: description,
    schedulerDrainReport: drainReport,
    consumesSchedulerPrivateContinuationDiagnostics: true,
    drainsAcceptedInternalTestQueues: true,
    queueFlushingReady: false,
    continuationFlushingReady: false,
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererRoots: false
  });
}

function consumeSchedulerPostTaskYieldActRootHandoffDiagnostics(
  diagnostics
) {
  const validation =
    validateSchedulerPostTaskYieldActRootHandoffDiagnostics(diagnostics);
  if (validation !== null) {
    throw createSchedulerPostTaskYieldActRootHandoffDiagnosticsGateError(
      validation.reason,
      validation
    );
  }

  const continuation = diagnostics.continuationFallbacks[0];
  const route = diagnostics.rootContinuationExecutionRoute;
  const handoff = route.actRootWorkHandoff;
  const priorityTimeout = handoff.priorityTimeout;
  const rootWorkRecordKinds = Object.freeze(
    handoff.rootWorkRecords.map((record) => record.recordKind)
  );

  return Object.freeze({
    status: schedulerPostTaskYieldActRootHandoffConsumptionStatus,
    accepted: true,
    schedulerDiagnosticsStatus: diagnostics.status,
    schedulerDiagnosticsExportName: diagnostics.exportName,
    schedulerDiagnosticsSymbolDescription: diagnostics.symbolDescription,
    schedulerCompatibilityTarget: diagnostics.compatibilityTarget,
    reactCompatibilityTarget: handoff.reactCompatibilityTarget,
    consumesSchedulerPostTaskYieldActRootHandoffDiagnostics: true,
    selectedFallback: 'scheduler.yield',
    schedulerYieldAvailable: true,
    schedulerPostTaskAvailable: true,
    controlledTaskSchedulingApiShim: true,
    continuationIndex: continuation.continuationIndex,
    callbackRunCountAtSchedule: continuation.callbackRunCountAtSchedule,
    currentCallbackRunCount: diagnostics.callbackRuns.length,
    controlledYieldThenContinuationAlreadyRan: true,
    staleContinuationEvidenceRejected: true,
    staleContinuationRejectionReason: 'stale-continuation',
    rootContinuationExecutionAdmitted: false,
    rootSchedulingAdmitted: false,
    rootWorkMetadataOnly: true,
    actQueueHandoffOnly: true,
    rendererWorkExecutionBlocked: true,
    rootWorkRecordKinds,
    rootWorkRecordCount: rootWorkRecordKinds.length,
    priorityLevel: handoff.priorityLevel,
    schedulerPriorityName: handoff.schedulerPriorityName,
    postTaskPriority: handoff.postTaskPriority,
    taskControllerPriority: handoff.taskControllerPriority,
    timeoutMs: priorityTimeout.timeoutMs,
    timeoutReason: priorityTimeout.timeoutReason,
    sourceCallbackDidTimeout: handoff.sourceCallbackDidTimeout,
    queueFlushingReady: false,
    rendererRootsReady: false,
    passiveEffectsReady: false,
    continuationFlushingReady: false,
    publicCompatibilityClaimed: false,
    browserPostTaskCompatibilityClaimed: false,
    browserTaskOrderingCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false,
    packageCompatibilityClaimed: false
  });
}

function consumeRendererBackedActDrainDiagnostics(diagnostics) {
  if (!Object.isFrozen(diagnostics)) {
    throw createRendererBackedActDrainDiagnosticsGateError(
      'renderer-backed-diagnostics'
    );
  }
  if (!isAcceptedRendererBackedActDrainDiagnostics(diagnostics)) {
    throw createRendererBackedActDrainDiagnosticsGateError(
      'renderer-backed-diagnostics'
    );
  }

  const drainSummary = Object.freeze({
    pendingBefore: diagnostics.pendingBefore,
    drainedCount: diagnostics.drainedCount,
    remainingCount: diagnostics.remainingCount,
    drainedContinuationCount: diagnostics.drainedContinuationCount,
    hostOutputCanaryCommitted: diagnostics.hostOutputCanaryCommitted,
    blockedByPendingPostPassiveGate:
      diagnostics.blockedByPendingPostPassiveGate
  });

  return Object.freeze({
    status: rendererBackedActDrainConsumptionStatus,
    accepted: true,
    rendererBackedActDrainDiagnosticsStatus: diagnostics.status,
    rendererBackedActDrainDiagnosticKind: diagnostics.kind,
    rendererBackedActDrainDiagnosticVersion: diagnostics.version,
    renderer: diagnostics.renderer,
    schedulerMetadataSource: diagnostics.schedulerMetadataSource,
    reconcilerMetadataSource: diagnostics.reconcilerMetadataSource,
    rendererMetadataSource: diagnostics.rendererMetadataSource,
    acceptedSchedulerRecords: diagnostics.acceptedSchedulerRecords,
    acceptedReconcilerRecords: diagnostics.acceptedReconcilerRecords,
    acceptedRendererRecords: diagnostics.acceptedRendererRecords,
    drainSummary,
    rendererBackedActDrainDiagnosticsReady: true,
    consumesRendererBackedActDrainDiagnostics: true,
    consumesSchedulerPrivateContinuationDiagnostics: true,
    consumesReconcilerActDrainMetadata: true,
    drainsAcceptedRendererBackedActDiagnostics: true,
    queueFlushingReady: false,
    rendererRootsReady: false,
    passiveEffectsReady: false,
    continuationFlushingReady: false,
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererRoots: false
  });
}

module.exports = Object.freeze({
  status: actDispatcherGateStatus,
  metadataKind: acceptedActQueueMetadataKind,
  metadataVersion: acceptedActQueueMetadataVersion,
  metadataSymbol: privateActQueueMetadataSymbol,
  schedulerDiagnosticsExportName: privateActQueueFlushDiagnosticsExport,
  schedulerDiagnosticsStatus:
    schedulerPrivateActQueueFlushDiagnosticsStatus,
  schedulerContinuationConsumptionStatus:
    schedulerPrivateActContinuationConsumptionStatus,
  rendererBackedActDrainDiagnosticsStatus,
  rendererBackedActDrainConsumptionStatus,
  schedulerPostTaskYieldActRootHandoffConsumptionStatus,
  schedulerPostTaskPriorityDiagnosticsStatus:
    privatePostTaskPriorityDiagnosticsStatus,
  schedulerPostTaskPriorityDiagnosticsVersion:
    privatePostTaskPriorityDiagnosticsVersion,
  schedulerPostTaskPriorityDiagnosticsExportName:
    privatePostTaskPriorityDiagnosticsExport,
  schedulerPostTaskPriorityDiagnosticsSymbolDescription:
    privatePostTaskPriorityDiagnosticsSymbolDescription,
  schedulerPostTaskActRootWorkHandoffStatus:
    privatePostTaskActRootWorkHandoffStatus,
  schedulerPostTaskActRootWorkHandoffKind:
    privatePostTaskActRootWorkHandoffKind,
  schedulerPostTaskActRootWorkHandoffVersion:
    privatePostTaskActRootWorkHandoffVersion,
  schedulerMockExpiredActRootWorkDiagnosticsStatus,
  schedulerMockExpiredActRootWorkConsumptionStatus,
  schedulerMockDelayedActRootWorkDiagnosticsStatus,
  schedulerMockDelayedActRootWorkPreflightStatus,
  requiredRecords: acceptedActQueueRecordKinds,
  requiredTaskKinds: acceptedActQueueTaskKinds,
  requiredContinuationStatuses: acceptedActQueueContinuationStatuses,
  internalTestQueueKind: privateActQueueTestQueueKind,
  internalTestTaskKind: privateActQueueTestTaskKind,
  internalTestCallbackKind: privateActQueueTestCallbackKind,
  internalTestQueueVersion: privateActQueueTestQueueVersion,
  publicCompatibilityClaimed: false,
  queueFlushingReady: false,
  rendererRootsReady: false,
  passiveEffectsReady: false,
  continuationFlushingReady: false,
  privateTestQueueFlushDiagnosticsReady: true,
  drainsAcceptedInternalTestQueues: true,
  privateSyncFlushActExecutionDiagnosticsReady: true,
  privateSyncFlushActExecutionDiagnosticKind,
  privateSyncFlushActExecutionDiagnosticVersion,
  committedHostOutputCanaryRequired: true,
  drainsAcceptedInternalActContinuationRecords: true,
  drainsPublicReactActQueue: false,
  acceptedPrivateActContinuationDrainRecords,
  acceptedPrivateActContinuationDrainStatuses,
  executesBrandedInternalTestCallbacks: true,
  recordsBrandedInternalTestContinuations: true,
  schedulerPrivateContinuationDiagnosticsReady: true,
  consumesSchedulerPrivateContinuationDiagnostics: true,
  rendererBackedActDrainDiagnosticsReady: true,
  consumesRendererBackedActDrainDiagnostics: true,
  rendererBackedActDrainDiagnosticKind:
    privateRendererBackedActDrainDiagnosticKind,
  rendererBackedActDrainDiagnosticVersion:
    privateRendererBackedActDrainDiagnosticVersion,
  drainsAcceptedRendererBackedActDiagnostics: true,
  schedulerPostTaskYieldActRootHandoffDiagnosticsReady: true,
  consumesSchedulerPostTaskYieldActRootHandoffDiagnostics: true,
  acceptedRendererBackedActDrainRenderers,
  acceptedRendererBackedActDrainSchedulerRecords,
  acceptedRendererBackedActDrainReconcilerRecords,
  acceptedRendererBackedActDrainRendererRecords,
  acceptedSchedulerPostTaskRootWorkRecordKinds:
    privatePostTaskAcceptedRootWorkRecordKinds,
  schedulerMockExpiredActRootWorkDiagnosticsReady: true,
  consumesSchedulerMockExpiredActRootWorkDiagnostics: true,
  schedulerMockExpiredActRootWorkDiagnosticKind:
    privateSchedulerMockExpiredActRootWorkDiagnosticsKind,
  schedulerMockExpiredActRootWorkDiagnosticVersion:
    privateSchedulerMockExpiredActRootWorkDiagnosticsVersion,
  drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics: true,
  acceptedSchedulerMockExpiredActRootWorkRecords,
  schedulerMockDelayedActRootWorkDiagnosticsReady: true,
  preflightsSchedulerMockDelayedActRootWorkDiagnostics: true,
  schedulerMockDelayedActRootWorkDiagnosticKind:
    privateSchedulerMockDelayedActRootWorkDiagnosticsKind,
  schedulerMockDelayedActRootWorkDiagnosticVersion:
    privateSchedulerMockDelayedActRootWorkDiagnosticsVersion,
  acceptsSchedulerMockDelayedActRootWorkOnlyAsNestedExpiredDiagnostics:
    true,
  publicSchedulerTimingCompatibilityClaimed: false,
  publicReactActCompatibilityClaimed: false,
  publicRootSchedulerCompatibilityClaimed: false,
  publicRendererCompatibilityClaimed: false,
  executesQueuedWork: false,
  executesEffects: false,
  executesRendererWork: false,
  executesRendererRoots: false,
  consumeRendererBackedActDrainDiagnostics,
  consumeSchedulerPrivateActContinuationDiagnostics,
  consumeSchedulerPostTaskYieldActRootHandoffDiagnostics,
  consumeSchedulerMockExpiredActRootWorkDiagnostics,
  preflightSchedulerMockDelayedActRootWorkDiagnostics,
  createActQueueMetadata,
  createInternalActQueueTestCallback,
  createInternalActQueueTestQueue,
  createInternalActQueueTestTask,
  createRendererBackedActDrainDiagnostics,
  getPrivateActQueueMetadata,
  isAcceptedActQueueMetadata,
  isAcceptedInternalActQueueTestCallback,
  isAcceptedInternalActQueueTestQueue,
  isAcceptedInternalActQueueTestTask,
  isAcceptedRendererBackedActDrainDiagnostics,
  isAcceptedSchedulerMockDelayedActRootWorkDiagnostics,
  isAcceptedSchedulerMockExpiredActRootWorkDiagnostics,
  isAcceptedSchedulerPrivateActQueueFlushDiagnostics,
  isAcceptedSchedulerPostTaskYieldActRootHandoffDiagnostics,
  isPrivateActDispatcher,
  markPrivateActDispatcher
});
