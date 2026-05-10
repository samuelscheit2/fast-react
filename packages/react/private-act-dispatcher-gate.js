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
const schedulerCompatibilityTarget = 'scheduler@0.27.0';
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

function includesString(value, expectedValues) {
  return typeof value === 'string' && expectedValues.includes(value);
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
    metadata.publicSchedulerTimingCompatibilityClaimed === false &&
    metadata.publicReactActCompatibilityClaimed === false &&
    metadata.executesQueuedWork === false &&
    metadata.executesEffects === false &&
    metadata.executesRendererRoots === false &&
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
    acceptedRendererBackedActDrainRenderers,
    acceptedRendererBackedActDrainSchedulerRecords,
    acceptedRendererBackedActDrainReconcilerRecords,
    acceptedRendererBackedActDrainRendererRecords,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false,
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

function frozenStringArray(value, fallback) {
  const array = Array.isArray(value) ? value : fallback;
  return Object.freeze([...array]);
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
  acceptedRendererBackedActDrainRenderers,
  acceptedRendererBackedActDrainSchedulerRecords,
  acceptedRendererBackedActDrainReconcilerRecords,
  acceptedRendererBackedActDrainRendererRecords,
  publicSchedulerTimingCompatibilityClaimed: false,
  publicReactActCompatibilityClaimed: false,
  executesQueuedWork: false,
  executesEffects: false,
  executesRendererRoots: false,
  consumeRendererBackedActDrainDiagnostics,
  consumeSchedulerPrivateActContinuationDiagnostics,
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
  isAcceptedSchedulerPrivateActQueueFlushDiagnostics,
  isPrivateActDispatcher,
  markPrivateActDispatcher
});
