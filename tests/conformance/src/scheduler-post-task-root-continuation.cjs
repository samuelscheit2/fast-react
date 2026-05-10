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
const ACCEPTED_ROOT_CONTINUATION_STATUS =
  'accepted-private-scheduler-post-task-root-continuation';
const ROOT_CONTINUATION_FALLBACK_STATUS =
  'private-scheduler-post-task-root-continuation-fallback';
const ROOT_CONTINUATION_SIGNAL_VALIDATION_STATUS =
  'validated-private-scheduler-post-task-root-continuation-signal';
const ROOT_CONTINUATION_EXECUTION_ROUTE_STATUS =
  'private-scheduler-post-task-root-continuation-execution-route';
const ROOT_CONTINUATION_ABORTED_EXECUTION_STATUS =
  'aborted-before-private-root-continuation-execution';
const ROOT_CONTINUATION_PENDING_EXECUTION_STATUS =
  'pending-private-root-continuation-execution-route';
const ROOT_CONTINUATION_ACT_ROOT_WORK_HANDOFF_STATUS =
  'accepted-private-scheduler-post-task-act-root-work-handoff';
const SCHEDULER_COMPATIBILITY_TARGET = 'scheduler@0.27.0';
const publicCompatibilityClaimKeys = new Set([
  'browserPostTaskCompatibilityClaimed',
  'browserTaskOrderingCompatibilityClaimed',
  'publicSchedulerTimingCompatibilityClaimed',
  'publicReactActCompatibilityClaimed',
  'publicRootSchedulerCompatibilityClaimed',
  'publicRendererCompatibilityClaimed',
  'publicCompatibilityClaimed',
  'compatibilityClaimed'
]);

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

  const compatibilityValidation = validateNoPublicCompatibilityClaims(record);
  if (compatibilityValidation !== null) {
    return createRejectedRow(
      base,
      compatibilityValidation.reason,
      compatibilityValidation
    );
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
  const signalValidation = createRootContinuationSignalValidation(
    continuation,
    signal
  );
  if (signalValidation.rejectionReason !== null) {
    return createRejectedRow(base, signalValidation.rejectionReason, {
      continuationIndex: continuationValidation.continuationIndex,
      continuationId: continuationValidation.continuationId,
      signalValidation
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
  const abortOrdering = readContinuationAbortOrdering(
    continuation,
    cancellation,
    delayAbortOrdering,
    signal,
    abortSignal
  );
  const executionRouteValidation = readRootContinuationExecutionRoute(
    record,
    continuationValidation,
    continuation
  );
  if (executionRouteValidation.reason) {
    return createRejectedRow(
      base,
      executionRouteValidation.reason,
      executionRouteValidation
    );
  }
  const rootContinuationExecutionRoute = executionRouteValidation.route;
  const acceptedActRootWorkHandoff =
    executionRouteValidation.actRootWorkHandoff;
  const continuationFallback = createRootContinuationFallbackMetadata(
    continuation
  );
  const acceptedRootContinuation = createAcceptedRootContinuationRecord({
    continuationId: continuationValidation.continuationId,
    continuation,
    signalValidation,
    abortOrdering,
    continuationFallback,
    rootContinuationExecutionRoute,
    acceptedActRootWorkHandoff
  });

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
    signalValidation: cloneDiagnosticValue(signalValidation),
    abortOrdering: cloneDiagnosticValue(abortOrdering),
    rootContinuationExecutionRoute: cloneDiagnosticValue(
      rootContinuationExecutionRoute
    ),
    privateRootContinuationExecution: cloneDiagnosticValue(
      rootContinuationExecutionRoute.privateRootContinuationExecution
    ),
    continuationFallback: cloneDiagnosticValue(continuationFallback),
    acceptedRootContinuation: cloneDiagnosticValue(acceptedRootContinuation),
    acceptedActRootWorkHandoff: cloneDiagnosticValue(
      acceptedActRootWorkHandoff
    ),
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
      continuationSignalValidationDiagnostics:
        record.continuationSignalValidationDiagnostics === true,
      continuationAbortOrderingDiagnostics:
        record.continuationAbortOrderingDiagnostics === true,
      rootContinuationExecutionRouteDiagnostics:
        record.rootContinuationExecutionRouteDiagnostics === true,
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

function validateNoPublicCompatibilityClaims(record) {
  return findPublicCompatibilityClaim(record, 'record', new Set());
}

function findPublicCompatibilityClaim(value, path, seen) {
  let index;
  if (value === null || typeof value !== 'object') {
    return null;
  }
  if (seen.has(value)) {
    return null;
  }
  seen.add(value);
  const keys = Object.keys(value);
  for (index = 0; index < keys.length; index++) {
    const key = keys[index];
    const nextPath = `${path}.${key}`;
    if (publicCompatibilityClaimKeys.has(key) && value[key] === true) {
      return {
        reason: 'public-compatibility-claimed',
        claimName: key,
        claimPath: nextPath,
        claimValue: true
      };
    }
    const nested = findPublicCompatibilityClaim(value[key], nextPath, seen);
    if (nested !== null) {
      return nested;
    }
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

function createRootContinuationSignalValidation(continuation, signal) {
  const sourceValidation =
    continuation &&
    continuation.signalValidation &&
    typeof continuation.signalValidation === 'object'
      ? continuation.signalValidation
      : null;
  const hasSignal = signal !== null && typeof signal === 'object';
  const hasSignalId =
    hasSignal && signal.id !== null && signal.id !== undefined;
  const sourceRejectionReason =
    sourceValidation && sourceValidation.rejectionReason
      ? sourceValidation.rejectionReason
      : null;
  const rejectionReason = hasSignalId
    ? sourceRejectionReason
    : 'missing-continuation-signal';
  return freezeRecord({
    status:
      rejectionReason === null
        ? ROOT_CONTINUATION_SIGNAL_VALIDATION_STATUS
        : 'rejected-private-scheduler-post-task-root-continuation-signal',
    signalSource:
      continuation && continuation.signal && typeof continuation.signal === 'object'
        ? 'continuation.signal'
        : continuation &&
            continuation.signalAtSchedule &&
            typeof continuation.signalAtSchedule === 'object'
          ? 'continuation.signalAtSchedule'
          : 'missing-continuation-signal',
    hasSignal,
    hasSignalId,
    signalId: hasSignal ? signal.id : null,
    signalPriority: hasSignal ? signal.priority : null,
    signalAbortedAtSchedule: hasSignal ? signal.aborted === true : null,
    signalOwnKeys: hasSignal ? cloneDiagnosticValue(signal.ownKeys || []) : [],
    sourceSignalValidation: cloneDiagnosticValue(sourceValidation),
    rejectionReason,
    browserPostTaskCompatibilityClaimed: false,
    browserTaskOrderingCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
}

function readRootContinuationExecutionRoute(
  record,
  continuationValidation,
  continuation
) {
  const route =
    record &&
    record.rootContinuationExecutionRoute &&
    typeof record.rootContinuationExecutionRoute === 'object'
      ? record.rootContinuationExecutionRoute
      : null;
  if (route === null) {
    return {
      reason: 'missing-root-continuation-execution-route',
      continuationIndex: continuationValidation.continuationIndex
    };
  }
  if (route.status !== ROOT_CONTINUATION_EXECUTION_ROUTE_STATUS) {
    return {
      reason: 'unsupported-root-continuation-execution-route',
      status: route.status || null
    };
  }
  if (route.accepted !== true || route.rejected === true) {
    return {
      reason: 'rejected-root-continuation-execution-route',
      accepted: route.accepted === true,
      rejected: route.rejected === true,
      rejectionReason: route.rejectionReason || null
    };
  }
  if (
    route.continuationIndex !== continuationValidation.continuationIndex ||
    route.continuationDiagnosticEventIndex !==
      continuation.diagnosticEventIndex ||
    route.sourceCallbackRunIndex !== continuation.sourceCallbackRunIndex
  ) {
    return {
      reason: 'stale-root-continuation-execution-route',
      routeContinuationIndex: route.continuationIndex,
      continuationIndex: continuationValidation.continuationIndex,
      routeContinuationDiagnosticEventIndex:
        route.continuationDiagnosticEventIndex,
      continuationDiagnosticEventIndex: continuation.diagnosticEventIndex,
      routeSourceCallbackRunIndex: route.sourceCallbackRunIndex,
      sourceCallbackRunIndex: continuation.sourceCallbackRunIndex
    };
  }
  const actRootWorkHandoffValidation = readActRootWorkHandoff(
    route,
    record,
    continuationValidation,
    continuation
  );
  if (
    (route.hasActRootWorkHandoff === true || route.actRootWorkHandoff) &&
    actRootWorkHandoffValidation.reason !== null
  ) {
    return actRootWorkHandoffValidation;
  }
  const isAbortedRoute =
    route.routeStatus === ROOT_CONTINUATION_ABORTED_EXECUTION_STATUS;
  const isPendingActRootWorkHandoffRoute =
    route.routeStatus === ROOT_CONTINUATION_PENDING_EXECUTION_STATUS &&
    actRootWorkHandoffValidation.reason === null;
  if (!isAbortedRoute && !isPendingActRootWorkHandoffRoute) {
    return {
      reason: 'pending-root-continuation-execution-route',
      routeStatus: route.routeStatus || null,
      actRootWorkHandoffRejectionReason:
        actRootWorkHandoffValidation.reason || null
    };
  }
  const privateExecution =
    route.privateRootContinuationExecution &&
    typeof route.privateRootContinuationExecution === 'object'
      ? route.privateRootContinuationExecution
      : null;
  if (privateExecution === null) {
    return {
      reason: 'missing-private-root-continuation-execution',
      continuationIndex: continuationValidation.continuationIndex
    };
  }
  if (
    privateExecution.status !== route.routeStatus ||
    privateExecution.rendererWorkExecuted !== false ||
    privateExecution.reconcilerWorkExecuted !== false ||
    privateExecution.nativeRendererWorkExecuted !== false ||
    privateExecution.publicRootExecution !== false ||
    privateExecution.publicSchedulerFlush !== false
  ) {
    return {
      reason: 'unsupported-private-root-continuation-execution-route',
      privateExecution: cloneDiagnosticValue(privateExecution)
    };
  }
  return {
    reason: null,
    route,
    actRootWorkHandoff: actRootWorkHandoffValidation.handoff
  };
}

function readActRootWorkHandoff(
  route,
  record,
  continuationValidation,
  continuation
) {
  const handoff =
    route &&
    route.actRootWorkHandoff &&
    typeof route.actRootWorkHandoff === 'object'
      ? route.actRootWorkHandoff
      : null;
  if (handoff === null) {
    return {
      reason: 'missing-act-root-work-handoff',
      handoff: null
    };
  }
  if (handoff.status !== ROOT_CONTINUATION_ACT_ROOT_WORK_HANDOFF_STATUS) {
    return {
      reason: 'unsupported-act-root-work-handoff',
      status: handoff.status || null,
      handoff: null
    };
  }
  if (handoff.accepted !== true || handoff.rejected === true) {
    return {
      reason: 'rejected-act-root-work-handoff',
      accepted: handoff.accepted === true,
      rejected: handoff.rejected === true,
      rejectionReason: handoff.rejectionReason || null,
      handoff: null
    };
  }
  if (
    handoff.continuationIndex !== continuationValidation.continuationIndex ||
    handoff.continuationDiagnosticEventIndex !==
      continuation.diagnosticEventIndex ||
    handoff.sourceCallbackRunIndex !== continuation.sourceCallbackRunIndex
  ) {
    return {
      reason: 'stale-act-root-work-handoff',
      handoffContinuationIndex: handoff.continuationIndex,
      continuationIndex: continuationValidation.continuationIndex,
      handoffContinuationDiagnosticEventIndex:
        handoff.continuationDiagnosticEventIndex,
      continuationDiagnosticEventIndex: continuation.diagnosticEventIndex,
      handoffSourceCallbackRunIndex: handoff.sourceCallbackRunIndex,
      sourceCallbackRunIndex: continuation.sourceCallbackRunIndex,
      handoff: null
    };
  }
  if (
    handoff.delayedCallbackPathAccepted !== true ||
    !handoff.delay ||
    handoff.delay.delayClassification !== 'delayed-task' ||
    !record.schedule ||
    !record.schedule.delay ||
    record.schedule.delay.delayClassification !== 'delayed-task'
  ) {
    return {
      reason: 'unsupported-act-root-work-handoff-delay',
      handoffDelay: cloneDiagnosticValue(handoff.delay || null),
      scheduleDelay: cloneDiagnosticValue(
        record.schedule ? record.schedule.delay || null : null
      ),
      handoff: null
    };
  }
  if (
    handoff.actQueueHandoffOnly !== true ||
    handoff.rootWorkMetadataOnly !== true ||
    handoff.rendererWorkExecutionBlocked !== true ||
    handoff.drainsPublicSchedulerTaskQueue !== false ||
    handoff.drainsPublicReactActQueue !== false ||
    handoff.executesQueuedWork !== false ||
    handoff.executesEffects !== false ||
    handoff.executesRendererWork !== false ||
    handoff.executesRendererRoots !== false
  ) {
    return {
      reason: 'unsupported-act-root-work-handoff-execution-policy',
      handoff: cloneDiagnosticValue(handoff)
    };
  }
  if (!Array.isArray(handoff.rootWorkRecords) || handoff.rootWorkRecords.length === 0) {
    return {
      reason: 'missing-act-root-work-handoff-records',
      handoff: null
    };
  }
  for (let index = 0; index < handoff.rootWorkRecords.length; index++) {
    const rootWorkRecord = handoff.rootWorkRecords[index];
    if (
      !rootWorkRecord ||
      typeof rootWorkRecord !== 'object' ||
      rootWorkRecord.accepted !== true ||
      rootWorkRecord.rendererWorkExecutionBlocked !== true ||
      rootWorkRecord.rootWorkMetadataOnly !== true ||
      rootWorkRecord.executesRendererWork !== false ||
      rootWorkRecord.executesRendererRoots !== false
    ) {
      return {
        reason: `unsupported-act-root-work-handoff-record-${index}`,
        rootWorkRecord: cloneDiagnosticValue(rootWorkRecord || null),
        handoff: null
      };
    }
  }
  return {
    reason: null,
    handoff
  };
}

function readContinuationAbortOrdering(
  continuation,
  cancellation,
  delayAbortOrdering,
  signal,
  abortSignal
) {
  if (
    continuation &&
    continuation.abortOrdering &&
    typeof continuation.abortOrdering === 'object'
  ) {
    return continuation.abortOrdering;
  }
  const cancellationAbortOrdering =
    cancellation &&
    cancellation.abortOrdering &&
    typeof cancellation.abortOrdering === 'object'
      ? cancellation.abortOrdering
      : null;
  return freezeRecord({
    status: cancellationAbortOrdering
      ? 'continuation-abort-ordering-observed-after-abort-call'
      : 'continuation-abort-ordering-pending-abort-call',
    requestEventIndex: cancellationAbortOrdering
      ? cancellationAbortOrdering.requestEventIndex
      : null,
    completionEventIndex: cancellationAbortOrdering
      ? cancellationAbortOrdering.completionEventIndex
      : null,
    continuationIndex: continuation.continuationIndex,
    sourceCallbackRunIndex: continuation.sourceCallbackRunIndex,
    callbackRunCountAtSchedule: continuation.callbackRunCountAtSchedule,
    callbackRunCountAtAbortRequest: cancellationAbortOrdering
      ? cancellationAbortOrdering.callbackRunCountAtRequest
      : null,
    callbackRunCountAtAbortCompletion: cancellationAbortOrdering
      ? cancellationAbortOrdering.callbackRunCountAtCompletion
      : null,
    continuationFallbackCountAtSchedule: continuation.continuationIndex + 1,
    continuationFallbackCountAtAbortRequest: cancellationAbortOrdering
      ? cancellationAbortOrdering.continuationFallbackCountAtRequest
      : null,
    continuationFallbackCountAtAbortCompletion: cancellationAbortOrdering
      ? cancellationAbortOrdering.continuationFallbackCountAtCompletion
      : null,
    signalAtSchedule: cloneDiagnosticValue(signal),
    signalBeforeAbort: delayAbortOrdering
      ? cloneDiagnosticValue(delayAbortOrdering.signalBeforeAbort)
      : null,
    signalAfterAbort: cloneDiagnosticValue(abortSignal),
    abortSignalStateAfterAbort:
      abortSignal && abortSignal.aborted === true ? 'aborted' : 'not-aborted',
    cancellationStatus: cancellation ? cancellation.status : null,
    browserPostTaskCompatibilityClaimed: false,
    browserTaskOrderingCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
}

function createRootContinuationFallbackMetadata(continuation) {
  return freezeRecord({
    status: ROOT_CONTINUATION_FALLBACK_STATUS,
    continuationStatus: continuation.continuationStatus,
    fallback: continuation.fallback,
    selectedFallback:
      continuation.continuationMetadata &&
      continuation.continuationMetadata.selectedFallback
        ? continuation.continuationMetadata.selectedFallback
        : continuation.fallback,
    continuationIndex: continuation.continuationIndex,
    sourceCallbackRunIndex: continuation.sourceCallbackRunIndex,
    callbackRunCountAtSchedule: continuation.callbackRunCountAtSchedule,
    reusesOriginalSignal: continuation.reusesOriginalSignal === true,
    continuationMetadata: cloneDiagnosticValue(
      continuation.continuationMetadata || null
    ),
    fallbackEnvironmentClassification: cloneDiagnosticValue(
      continuation.fallbackEnvironmentClassification || null
    ),
    browserPostTaskCompatibilityClaimed: false,
    browserTaskOrderingCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
}

function createAcceptedRootContinuationRecord({
  continuationId,
  continuation,
  signalValidation,
  abortOrdering,
  continuationFallback,
  rootContinuationExecutionRoute,
  acceptedActRootWorkHandoff
}) {
  return freezeRecord({
    status: ACCEPTED_ROOT_CONTINUATION_STATUS,
    accepted: true,
    continuationId,
    continuationIndex: continuation.continuationIndex,
    sourceCallbackRunIndex: continuation.sourceCallbackRunIndex,
    signalValidation: cloneDiagnosticValue(signalValidation),
    abortOrdering: cloneDiagnosticValue(abortOrdering),
    continuationFallback: cloneDiagnosticValue(continuationFallback),
    rootContinuationExecutionRoute: cloneDiagnosticValue(
      rootContinuationExecutionRoute
    ),
    privateRootContinuationExecution: cloneDiagnosticValue(
      rootContinuationExecutionRoute.privateRootContinuationExecution
    ),
    acceptedActRootWorkHandoff: cloneDiagnosticValue(
      acceptedActRootWorkHandoff
    ),
    rootContinuationMetadataOnly: true,
    rendererWorkExecuted: false,
    reconcilerWorkExecuted: false,
    nativeRendererWorkExecuted: false,
    publicRootExecution: false,
    publicSchedulerFlush: false,
    browserPostTaskCompatibilityClaimed: false,
    browserTaskOrderingCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
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
  ACCEPTED_ROOT_CONTINUATION_STATUS,
  POST_TASK_PRIORITY_DIAGNOSTIC_STATUS,
  ROOT_CONTINUATION_BLOCKED_STATUS,
  ROOT_CONTINUATION_FALLBACK_STATUS,
  ROOT_CONTINUATION_ABORTED_EXECUTION_STATUS,
  ROOT_CONTINUATION_ACT_ROOT_WORK_HANDOFF_STATUS,
  ROOT_CONTINUATION_EXECUTION_ROUTE_STATUS,
  ROOT_CONTINUATION_METADATA_STATUS,
  ROOT_CONTINUATION_PENDING_EXECUTION_STATUS,
  ROOT_CONTINUATION_RECORD_TYPE,
  ROOT_CONTINUATION_REJECTED_STATUS,
  ROOT_CONTINUATION_SIGNAL_VALIDATION_STATUS,
  createPrivatePostTaskRootContinuationMetadataRow,
  derivePrivatePostTaskRootContinuationId
};
