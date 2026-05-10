'use strict';

const POST_TASK_PRIORITY_DIAGNOSTIC_STATUS =
  'private-scheduler-post-task-priority-diagnostics';
const ROOT_CONTINUATION_METADATA_STATUS =
  'private-scheduler-post-task-root-continuation-metadata';
const ROOT_CONTINUATION_REJECTED_STATUS =
  'rejected-private-scheduler-post-task-root-continuation-metadata';
const ROOT_CONTINUATION_RECORD_TYPE =
  'fast.scheduler.post_task.private_root_continuation_metadata';
const ROOT_CONTINUATION_BLOCKED_STATUS =
  'blocked-private-root-continuation-execution';
const SCHEDULER_COMPATIBILITY_TARGET = 'scheduler@0.27.0';

const priorityLabelsByLevel = new Map([
  [1, 'immediate'],
  [2, 'user-blocking'],
  [3, 'normal'],
  [4, 'low'],
  [5, 'idle']
]);

function createPrivatePostTaskRootContinuationMetadataRow(record, options) {
  const normalizedOptions = options && typeof options === 'object' ? options : {};
  const base = createBaseRow(record);
  const priorityValidation = validatePriorityRecord(record);
  if (priorityValidation !== null) {
    return createRejectedRow(base, priorityValidation.reason, priorityValidation);
  }

  const continuationValidation = readContinuation(record, normalizedOptions);
  if (continuationValidation.reason) {
    return createRejectedRow(
      base,
      continuationValidation.reason,
      continuationValidation
    );
  }

  const continuation = continuationValidation.continuation;
  const signal = readContinuationSignal(continuation);
  if (signal === null || signal.id === null) {
    return createRejectedRow(base, 'missing-continuation-signal', {
      continuationIndex: continuationValidation.continuationIndex,
      continuationId: continuationValidation.continuationId,
      hasSignal: signal !== null
    });
  }

  const priorityLabel = priorityLabelsByLevel.get(
    record.priorityMapping.priorityLevel
  );
  const cancellation = record.cancellation || null;
  const delayAbortOrdering = cancellation
    ? cancellation.delayAbortOrdering || null
    : null;
  const abortSignal =
    delayAbortOrdering && delayAbortOrdering.signalAfterAbort
      ? delayAbortOrdering.signalAfterAbort
      : cancellation && cancellation.signal
        ? cancellation.signal
        : signal;

  return freezeRecord({
    ...base,
    status: ROOT_CONTINUATION_METADATA_STATUS,
    accepted: true,
    rejected: false,
    rejectionReason: null,
    sourceDiagnosticStatus: record.status,
    sourceDiagnosticKind: record.diagnosticKind || null,
    continuationId: continuationValidation.continuationId,
    continuationIndex: continuationValidation.continuationIndex,
    sourceCallbackRunIndex: continuation.sourceCallbackRunIndex,
    callbackRunCountAtSchedule: continuation.callbackRunCountAtSchedule,
    priorityLabel,
    priorityLevel: record.priorityMapping.priorityLevel,
    schedulerPriorityName: record.priorityMapping.schedulerPriorityName,
    postTaskPriority: record.priorityMapping.postTaskPriority,
    taskControllerPriority: record.priorityMapping.taskControllerPriority,
    delay: cloneDiagnosticValue(
      delayAbortOrdering && delayAbortOrdering.scheduledDelay
        ? delayAbortOrdering.scheduledDelay
        : record.schedule.delay
    ),
    signalAtSchedule: cloneDiagnosticValue(signal),
    abortSignal: cloneDiagnosticValue(abortSignal),
    abortSignalState:
      abortSignal && abortSignal.aborted === true ? 'aborted' : 'not-aborted',
    continuationStatus: continuation.continuationStatus,
    fallback: continuation.fallback,
    fallbackEnvironmentClassification: cloneDiagnosticValue(
      continuation.fallbackEnvironmentClassification || null
    ),
    delayAbortOrdering: cloneDiagnosticValue(delayAbortOrdering),
    blockedRootExecution: createBlockedRootExecutionMetadata(),
    sourceDiagnostics: freezeRecord({
      diagnosticEventCount: record.diagnosticEventCount || 0,
      callbackRunCount: Array.isArray(record.callbackRuns)
        ? record.callbackRuns.length
        : 0,
      continuationFallbackCount: Array.isArray(record.continuationFallbacks)
        ? record.continuationFallbacks.length
        : 0,
      delayAbortOrderingDiagnostics:
        record.delayAbortOrderingDiagnostics === true,
      continuationFallbackMetadataDiagnostics:
        record.continuationFallbackMetadataDiagnostics === true,
      taskControllerAbortOrderingDiagnostics:
        record.taskControllerAbortOrderingDiagnostics === true,
      fallbackEnvironmentClassificationDiagnostics:
        record.fallbackEnvironmentClassificationDiagnostics === true
    }),
    browserPostTaskCompatibilityClaimed: false,
    browserTaskOrderingCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
}

function derivePrivatePostTaskRootContinuationId(record, continuation) {
  const signal = readContinuationSignal(continuation);
  const signalId = signal === null ? 'missing-signal' : signal.id;
  const priorityLevel =
    record &&
    record.priorityMapping &&
    typeof record.priorityMapping.priorityLevel === 'number'
      ? record.priorityMapping.priorityLevel
      : 'unknown-priority';
  const continuationIndex =
    continuation && typeof continuation.continuationIndex === 'number'
      ? continuation.continuationIndex
      : 'unknown-continuation';
  return `postTask:${priorityLevel}:signal:${signalId}:continuation:${continuationIndex}`;
}

function validatePriorityRecord(record) {
  if (record === null || typeof record !== 'object') {
    return {
      reason: 'invalid-post-task-priority-record',
      hasRecord: false
    };
  }
  if (record.status !== POST_TASK_PRIORITY_DIAGNOSTIC_STATUS) {
    return {
      reason: 'unsupported-priority-record-status',
      status: record.status || null
    };
  }
  if (!record.priorityMapping || record.priorityMapping.recognizedPriority !== true) {
    return {
      reason: 'unsupported-priority-record',
      priorityMapping: cloneDiagnosticValue(record.priorityMapping || null)
    };
  }
  if (!priorityLabelsByLevel.has(record.priorityMapping.priorityLevel)) {
    return {
      reason: 'unsupported-priority-record',
      priorityLevel: record.priorityMapping.priorityLevel
    };
  }
  if (!record.schedule || !record.schedule.delay) {
    return {
      reason: 'invalid-post-task-delay-diagnostics',
      hasSchedule: !!record.schedule
    };
  }
  return null;
}

function readContinuation(record, options) {
  const continuations = Array.isArray(record.continuationFallbacks)
    ? record.continuationFallbacks
    : [];
  if (continuations.length === 0) {
    return {
      reason: 'missing-continuation-fallback',
      continuationCount: 0
    };
  }
  const continuationIndex =
    typeof options.continuationIndex === 'number'
      ? options.continuationIndex
      : continuations.length - 1;
  const continuation = continuations[continuationIndex];
  if (!continuation || typeof continuation !== 'object') {
    return {
      reason: 'stale-continuation',
      continuationIndex,
      continuationCount: continuations.length
    };
  }
  const expectedContinuationId = derivePrivatePostTaskRootContinuationId(
    record,
    continuation
  );
  const continuationId =
    typeof options.continuationId === 'string'
      ? options.continuationId
      : expectedContinuationId;
  const currentCallbackRunCount = Array.isArray(record.callbackRuns)
    ? record.callbackRuns.length
    : 0;
  if (
    continuationIndex !== continuations.length - 1 ||
    continuationId !== expectedContinuationId ||
    continuation.callbackRunCountAtSchedule !== currentCallbackRunCount
  ) {
    return {
      reason: 'stale-continuation',
      continuationIndex,
      continuationId,
      expectedContinuationId,
      callbackRunCountAtSchedule: continuation.callbackRunCountAtSchedule,
      currentCallbackRunCount,
      latestContinuationIndex: continuations.length - 1
    };
  }
  return {
    reason: null,
    continuation,
    continuationIndex,
    continuationId
  };
}

function readContinuationSignal(continuation) {
  if (!continuation || typeof continuation !== 'object') {
    return null;
  }
  if (continuation.signal && typeof continuation.signal === 'object') {
    return continuation.signal;
  }
  if (
    continuation.signalAtSchedule &&
    typeof continuation.signalAtSchedule === 'object'
  ) {
    return continuation.signalAtSchedule;
  }
  return null;
}

function createBaseRow(record) {
  return {
    type: ROOT_CONTINUATION_RECORD_TYPE,
    version: 1,
    entrypoint: 'scheduler/unstable_post_task',
    compatibilityTarget:
      record && record.compatibilityTarget
        ? record.compatibilityTarget
        : SCHEDULER_COMPATIBILITY_TARGET,
    diagnosticKind: 'post-task-root-continuation-link'
  };
}

function createRejectedRow(base, reason, details) {
  return freezeRecord({
    ...base,
    status: ROOT_CONTINUATION_REJECTED_STATUS,
    accepted: false,
    rejected: true,
    rejectionReason: reason,
    rejectionDetails: cloneDiagnosticValue(details || {}),
    blockedRootExecution: createBlockedRootExecutionMetadata(),
    browserPostTaskCompatibilityClaimed: false,
    browserTaskOrderingCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
}

function createBlockedRootExecutionMetadata() {
  return freezeRecord({
    status: ROOT_CONTINUATION_BLOCKED_STATUS,
    rootContinuationMetadataOnly: true,
    rendererWorkExecuted: false,
    reconcilerWorkExecuted: false,
    nativeRendererWorkExecuted: false,
    publicRootExecution: false,
    publicSchedulerFlush: false,
    reason:
      'diagnostic row only; renderer root work remains blocked until root scheduling and commit gates are accepted',
    compatibilityClaimed: false
  });
}

function cloneDiagnosticValue(value) {
  let key;
  let index;
  let clone;
  if (Array.isArray(value)) {
    clone = [];
    for (index = 0; index < value.length; index++) {
      clone.push(cloneDiagnosticValue(value[index]));
    }
    return freezeRecord(clone);
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  clone = {};
  const keys = Object.keys(value);
  for (index = 0; index < keys.length; index++) {
    key = keys[index];
    clone[key] = cloneDiagnosticValue(value[key]);
  }
  return freezeRecord(clone);
}

function freezeRecord(record) {
  return Object.freeze(record);
}

module.exports = {
  POST_TASK_PRIORITY_DIAGNOSTIC_STATUS,
  ROOT_CONTINUATION_BLOCKED_STATUS,
  ROOT_CONTINUATION_METADATA_STATUS,
  ROOT_CONTINUATION_RECORD_TYPE,
  ROOT_CONTINUATION_REJECTED_STATUS,
  createPrivatePostTaskRootContinuationMetadataRow,
  derivePrivatePostTaskRootContinuationId
};
