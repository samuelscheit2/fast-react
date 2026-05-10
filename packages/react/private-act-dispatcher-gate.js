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
const schedulerCompatibilityTarget = 'scheduler@0.27.0';
const privateActQueueTestQueueKind =
  'fast-react.react.private-act-queue-test-queue';
const privateActQueueTestTaskKind =
  'fast-react.react.private-act-queue-test-task';
const privateActQueueTestQueueVersion = 1;
const privateActQueueTestQueueBrand = Symbol.for(
  'fast-react.react.private-act-queue-test-queue'
);
const privateActQueueTestTaskBrand = Symbol.for(
  'fast-react.react.private-act-queue-test-task'
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
    metadata.schedulerPrivateContinuationDiagnosticsReady === true &&
    metadata.consumesSchedulerPrivateContinuationDiagnostics === true &&
    metadata.publicSchedulerTimingCompatibilityClaimed === false &&
    metadata.publicReactActCompatibilityClaimed === false &&
    metadata.executesQueuedWork === false &&
    metadata.executesEffects === false &&
    hasExactStringSet(metadata.acceptedRecords, acceptedActQueueRecordKinds) &&
    hasExactStringSet(metadata.acceptedTaskKinds, acceptedActQueueTaskKinds) &&
    hasExactStringSet(
      metadata.acceptedContinuationStatuses,
      acceptedActQueueContinuationStatuses
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
    schedulerPrivateContinuationDiagnosticsReady: true,
    consumesSchedulerPrivateContinuationDiagnostics: true,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false,
    ...overrides
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
  requiredRecords: acceptedActQueueRecordKinds,
  requiredTaskKinds: acceptedActQueueTaskKinds,
  requiredContinuationStatuses: acceptedActQueueContinuationStatuses,
  internalTestQueueKind: privateActQueueTestQueueKind,
  internalTestTaskKind: privateActQueueTestTaskKind,
  internalTestQueueVersion: privateActQueueTestQueueVersion,
  publicCompatibilityClaimed: false,
  queueFlushingReady: false,
  rendererRootsReady: false,
  passiveEffectsReady: false,
  continuationFlushingReady: false,
  privateTestQueueFlushDiagnosticsReady: true,
  drainsAcceptedInternalTestQueues: true,
  schedulerPrivateContinuationDiagnosticsReady: true,
  consumesSchedulerPrivateContinuationDiagnostics: true,
  publicSchedulerTimingCompatibilityClaimed: false,
  publicReactActCompatibilityClaimed: false,
  executesQueuedWork: false,
  executesEffects: false,
  consumeSchedulerPrivateActContinuationDiagnostics,
  createActQueueMetadata,
  createInternalActQueueTestQueue,
  createInternalActQueueTestTask,
  getPrivateActQueueMetadata,
  isAcceptedActQueueMetadata,
  isAcceptedInternalActQueueTestQueue,
  isAcceptedInternalActQueueTestTask,
  isAcceptedSchedulerPrivateActQueueFlushDiagnostics,
  isPrivateActDispatcher,
  markPrivateActDispatcher
});
