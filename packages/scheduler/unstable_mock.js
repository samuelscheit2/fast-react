'use strict';

const reactCompatibilityTarget = 'react@19.2.6';
const schedulerCompatibilityTarget = 'scheduler@0.27.0';
const privateActQueueFlushDiagnosticsExport =
  '__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__';
const privateActQueueTestCallbackKind =
  'fast-react.react.private-act-queue-test-callback';
const privateActQueueTestCallbackBrand = Symbol.for(
  privateActQueueTestCallbackKind
);
const privateSchedulerMockExpiredWorkMetadataKind =
  'fast-react.scheduler.mock-expired-work-diagnostics';
const privateSchedulerMockExpiredWorkMetadataBrand = Symbol.for(
  privateSchedulerMockExpiredWorkMetadataKind
);
const privateSchedulerMockExpiredWorkMetadataVersion = 1;
const privateSchedulerMockFrameBudgetMetadataKind =
  'fast-react.scheduler.mock-frame-budget-diagnostics';
const privateSchedulerMockFrameBudgetMetadataBrand = Symbol.for(
  privateSchedulerMockFrameBudgetMetadataKind
);
const privateSchedulerMockFrameBudgetMetadataVersion = 1;
const privateSchedulerMockExpiredLaneFlushMetadataKind =
  'fast-react.scheduler.mock-expired-lane-priority-root-metadata';
const privateSchedulerMockExpiredLaneFlushMetadataBrand = Symbol.for(
  privateSchedulerMockExpiredLaneFlushMetadataKind
);
const privateSchedulerMockExpiredLaneFlushMetadataVersion = 1;
const privateSchedulerMockExpiredLaneFlushDiagnosticsKind =
  'fast-react.scheduler.mock-expired-lane-flush-diagnostics';
const privateSchedulerMockExpiredLaneFlushDiagnosticsBrand = Symbol.for(
  privateSchedulerMockExpiredLaneFlushDiagnosticsKind
);
const privateSchedulerMockExpiredLaneFlushDiagnosticsVersion = 1;
const acceptedExpiredLanePriorityMetadataKinds = Object.freeze([
  'RootLaneSchedulingSnapshot',
  'UpdateContainerResult',
  'RootScheduleUpdateRecord'
]);
const acceptedExpiredRootSchedulerMetadataKinds = Object.freeze([
  'RootTaskScheduleRecord',
  'SchedulerCallbackRequest',
  'RootSchedulerCallbackExecutionRecord'
]);

const scheduler =
  process.env.NODE_ENV === 'production'
    ? require('./cjs/scheduler-unstable_mock.production.js')
    : require('./cjs/scheduler-unstable_mock.development.js');

module.exports = createPrivateSchedulerMockDiagnosticsWrapper(scheduler);

function createPrivateSchedulerMockDiagnosticsWrapper(sourceScheduler) {
  const shadowState = {
    nextScheduleOrder: 1,
    taskRecords: [],
    nextYieldSequence: 1,
    nextYieldLogClearOrder: 1,
    lastYieldLogClearOrder: 0,
    yieldLogEntries: []
  };
  const sourceDiagnostics =
    sourceScheduler.unstable_flushAllWithoutAsserting[
      privateActQueueFlushDiagnosticsExport
    ];
  const diagnostics = createPrivateActQueueFlushDiagnostics(
    sourceScheduler,
    shadowState,
    sourceDiagnostics
  );
  const wrappedScheduler = {};

  for (const key of Object.keys(sourceScheduler)) {
    const value = sourceScheduler[key];
    wrappedScheduler[key] =
      typeof value === 'function'
        ? wrapSchedulerFunction(
            sourceScheduler,
            shadowState,
            diagnostics,
            key,
            value
          )
        : value;
  }

  return wrappedScheduler;
}

function createPrivateActQueueFlushDiagnostics(
  sourceScheduler,
  shadowState,
  sourceDiagnostics
) {
  return Object.freeze({
    ...sourceDiagnostics,
    mockSchedulerExpiredWorkActRouteDiagnosticsReady: true,
    recognizesExpiredMockSchedulerMetadata: true,
    describesExpiredMockSchedulerWorkWithoutFlushing: true,
    invokesPublicSchedulerFlushHelperForExpiredWorkMetadata: false,
    publicSchedulerFlushBehaviorExecutedForExpiredWorkMetadata: false,
    mockSchedulerFrameBudgetDiagnosticsReady: true,
    recognizesMockSchedulerFrameBudgetMetadata: true,
    describesMockSchedulerFrameBudgetWithoutFlushing: true,
    recordsMockSchedulerShouldYieldDecision: true,
    recordsMockSchedulerFrameBudgetDecision: true,
    recordsMockSchedulerYieldLogOrdering: true,
    recordsMockSchedulerRequestPaintFrameBudget: true,
    mockSchedulerExpiredLaneFlushDiagnosticsReady: true,
    recognizesExpiredLanePriorityRootSchedulerMetadata: true,
    recordsExpiredCallbackPriorityVirtualTimeFrameBudgetAndLaneLabel: true,
    rejectsUnsupportedExpiredCallbackPriorityLevels: true,
    rejectsStaleExpiredCallbackHandles: true,
    drainExpiredMockSchedulerWork(lanePriorityRootSchedulerMetadata) {
      if (arguments.length === 0) {
        return sourceDiagnostics.drainExpiredMockSchedulerWork();
      }
      return drainExpiredMockSchedulerWorkWithLaneMetadataForDiagnostics(
        sourceScheduler,
        shadowState,
        sourceDiagnostics,
        lanePriorityRootSchedulerMetadata
      );
    },
    describeExpiredLanePriorityRootSchedulerMetadataForDiagnostics(
      lanePriorityRootSchedulerMetadata
    ) {
      return describeExpiredLanePriorityRootSchedulerMetadataForDiagnostics(
        sourceScheduler,
        shadowState,
        lanePriorityRootSchedulerMetadata
      );
    },
    drainExpiredMockSchedulerWorkWithLaneMetadataForDiagnostics(
      lanePriorityRootSchedulerMetadata
    ) {
      return drainExpiredMockSchedulerWorkWithLaneMetadataForDiagnostics(
        sourceScheduler,
        shadowState,
        sourceDiagnostics,
        lanePriorityRootSchedulerMetadata
      );
    },
    describeExpiredMockSchedulerWorkForDiagnostics() {
      return describeExpiredMockSchedulerWorkForDiagnostics(
        sourceScheduler,
        shadowState
      );
    },
    describeMockSchedulerFrameBudgetForDiagnostics() {
      return describeMockSchedulerFrameBudgetForDiagnostics(
        sourceScheduler,
        shadowState,
        sourceDiagnostics
      );
    },
    requestPaintFrameBudgetForDiagnostics() {
      return requestPaintFrameBudgetForDiagnostics(
        sourceScheduler,
        shadowState,
        sourceDiagnostics
      );
    }
  });
}

function wrapSchedulerFunction(
  sourceScheduler,
  shadowState,
  diagnostics,
  key,
  sourceFunction
) {
  let wrappedFunction;

  if (key === 'unstable_scheduleCallback') {
    wrappedFunction = function (priorityLevel, callback, options) {
      const task = sourceFunction.apply(sourceScheduler, arguments);
      recordScheduledTask(shadowState, task);
      return task;
    };
  } else if (key === 'unstable_cancelCallback') {
    wrappedFunction = function (task) {
      const result = sourceFunction.apply(sourceScheduler, arguments);
      markCancelledTask(shadowState, task);
      return result;
    };
  } else if (key === 'reset') {
    wrappedFunction = function () {
      const result = sourceFunction.apply(sourceScheduler, arguments);
      resetShadowTasks(shadowState);
      resetShadowYieldLog(shadowState);
      return result;
    };
  } else if (key === 'log') {
    wrappedFunction = function (value) {
      const before = getMockSchedulerYieldPaintSnapshot(
        sourceScheduler,
        sourceScheduler.unstable_flushAllWithoutAsserting[
          privateActQueueFlushDiagnosticsExport
        ]
      );
      const result = sourceFunction.apply(sourceScheduler, arguments);
      const after = getMockSchedulerYieldPaintSnapshot(
        sourceScheduler,
        sourceScheduler.unstable_flushAllWithoutAsserting[
          privateActQueueFlushDiagnosticsExport
        ]
      );
      recordShadowYieldLogMutation(shadowState, before, after);
      return result;
    };
  } else if (key === 'unstable_clearLog') {
    wrappedFunction = function () {
      const result = sourceFunction.apply(sourceScheduler, arguments);
      clearShadowYieldLog(shadowState);
      return result;
    };
  } else {
    wrappedFunction = createForwardingFunction(sourceScheduler, sourceFunction);
  }

  defineFunctionShape(wrappedFunction, sourceFunction.name, sourceFunction.length);

  if (shouldAttachPrivateActQueueFlushDiagnostics(key)) {
    Object.defineProperty(wrappedFunction, privateActQueueFlushDiagnosticsExport, {
      configurable: false,
      enumerable: false,
      value: diagnostics,
      writable: false
    });
  }

  return wrappedFunction;
}

function createForwardingFunction(sourceScheduler, sourceFunction) {
  switch (sourceFunction.length) {
    case 0:
      return function () {
        return sourceFunction.apply(sourceScheduler, arguments);
      };
    case 1:
      return function (arg0) {
        return sourceFunction.apply(sourceScheduler, arguments);
      };
    case 2:
      return function (arg0, arg1) {
        return sourceFunction.apply(sourceScheduler, arguments);
      };
    case 3:
      return function (arg0, arg1, arg2) {
        return sourceFunction.apply(sourceScheduler, arguments);
      };
    default:
      return function () {
        return sourceFunction.apply(sourceScheduler, arguments);
      };
  }
}

function defineFunctionShape(fn, name, length) {
  Object.defineProperties(fn, {
    length: {
      configurable: true,
      value: length
    },
    name: {
      configurable: true,
      value: name
    }
  });
}

function shouldAttachPrivateActQueueFlushDiagnostics(key) {
  return (
    key === 'unstable_flushAll' ||
    key === 'unstable_flushAllWithoutAsserting' ||
    key === 'unstable_flushExpired' ||
    key === 'unstable_flushNumberOfYields' ||
    key === 'unstable_flushUntilNextPaint'
  );
}

function recordScheduledTask(shadowState, task) {
  if (!isObjectLike(task)) {
    return;
  }

  shadowState.taskRecords.push({
    scheduleOrder: shadowState.nextScheduleOrder++,
    task
  });
}

function markCancelledTask(shadowState, task) {
  const record = findShadowTaskRecord(shadowState, task);
  if (record !== null) {
    record.cancelled = true;
  }
}

function findShadowTaskRecord(shadowState, task) {
  for (let index = shadowState.taskRecords.length - 1; index >= 0; index--) {
    const record = shadowState.taskRecords[index];
    if (record.task === task) {
      return record;
    }
  }
  return null;
}

function resetShadowTasks(shadowState) {
  shadowState.nextScheduleOrder = 1;
  shadowState.taskRecords.length = 0;
}

function resetShadowYieldLog(shadowState) {
  shadowState.nextYieldSequence = 1;
  shadowState.nextYieldLogClearOrder = 1;
  shadowState.lastYieldLogClearOrder = 0;
  shadowState.yieldLogEntries.length = 0;
}

function clearShadowYieldLog(shadowState) {
  shadowState.yieldLogEntries.length = 0;
  shadowState.lastYieldLogClearOrder = shadowState.nextYieldLogClearOrder++;
}

function describeExpiredMockSchedulerWorkForDiagnostics(
  sourceScheduler,
  shadowState
) {
  const now = sourceScheduler.unstable_now();
  const pendingWork = sourceScheduler.unstable_hasPendingWork();
  const taskQueue = getMockSchedulerTaskQueueSnapshot(shadowState, now);
  const expiredCallbackCount =
    countMockSchedulerTasksByCallbackStatus(taskQueue, 'pending-callback', true);
  const cancelledTombstoneCount =
    countMockSchedulerTasksByCallbackStatus(
      taskQueue,
      'cancelled-tombstone',
      undefined
    );
  const metadata = {
    kind: privateSchedulerMockExpiredWorkMetadataKind,
    version: privateSchedulerMockExpiredWorkMetadataVersion,
    status: 'described-expired-mock-scheduler-work-for-diagnostics',
    accepted: true,
    compatibilityTarget: schedulerCompatibilityTarget,
    reactCompatibilityTarget,
    schedulerDiagnosticStatus: 'private-scheduler-act-queue-flush-diagnostics',
    now,
    pendingWork,
    hasExpiredMockSchedulerWork: expiredCallbackCount > 0,
    expiredCallbackCount,
    cancelledTombstoneCount,
    taskQueue,
    taskQueueCount: taskQueue.length,
    recognizesExpiredMockSchedulerMetadata: true,
    describesExpiredMockSchedulerWorkWithoutFlushing: true,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    drainsExpiredMockSchedulerWork: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false
  };

  Object.defineProperty(metadata, privateSchedulerMockExpiredWorkMetadataBrand, {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false
  });

  return Object.freeze(metadata);
}

function describeExpiredLanePriorityRootSchedulerMetadataForDiagnostics(
  sourceScheduler,
  shadowState,
  lanePriorityRootSchedulerMetadata
) {
  const now = sourceScheduler.unstable_now();
  const validation = validateExpiredLanePriorityRootSchedulerMetadata(
    sourceScheduler,
    shadowState,
    lanePriorityRootSchedulerMetadata,
    now
  );
  const metadataSummary =
    summarizeExpiredLanePriorityRootSchedulerMetadataForDiagnostics(
      sourceScheduler,
      lanePriorityRootSchedulerMetadata,
      validation
    );

  return Object.freeze({
    status:
      validation.rejectionReason === null
        ? 'accepted-expired-lane-priority-root-scheduler-metadata'
        : 'rejected-expired-lane-priority-root-scheduler-metadata',
    accepted: validation.rejectionReason === null,
    rejectionReason: validation.rejectionReason,
    compatibilityTarget: schedulerCompatibilityTarget,
    reactCompatibilityTarget,
    currentVirtualTime: now,
    metadata: metadataSummary,
    recognizesExpiredLanePriorityRootSchedulerMetadata: true,
    recordsExpiredCallbackPriorityVirtualTimeFrameBudgetAndLaneLabel: true,
    rejectsUnsupportedExpiredCallbackPriorityLevels: true,
    rejectsStaleExpiredCallbackHandles: true,
    drainsExpiredMockSchedulerWork: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false
  });
}

function drainExpiredMockSchedulerWorkWithLaneMetadataForDiagnostics(
  sourceScheduler,
  shadowState,
  sourceDiagnostics,
  lanePriorityRootSchedulerMetadata
) {
  const before = getMockSchedulerYieldPaintSnapshot(
    sourceScheduler,
    sourceDiagnostics
  );
  const validation = validateExpiredLanePriorityRootSchedulerMetadata(
    sourceScheduler,
    shadowState,
    lanePriorityRootSchedulerMetadata,
    before.now
  );
  if (validation.rejectionReason !== null) {
    throw createExpiredLaneFlushMetadataError(validation.rejectionReason);
  }

  const yieldLogBefore = getMockSchedulerYieldLogSnapshot(shadowState, before);
  const frameBudgetDecisionBefore = getMockSchedulerFrameBudgetDecision(
    before,
    yieldLogBefore
  );
  const taskQueueBefore = getMockSchedulerTaskQueueSnapshot(
    shadowState,
    before.now
  );
  const matchedTaskBefore = summarizeMockSchedulerTask(
    validation.taskRecord,
    before.now
  );
  const laneMetadata =
    summarizeExpiredLanePriorityRootSchedulerMetadataForDiagnostics(
      sourceScheduler,
      lanePriorityRootSchedulerMetadata,
      validation
    );

  const drainReport = sourceDiagnostics.drainExpiredMockSchedulerWork();

  const after = getMockSchedulerYieldPaintSnapshot(
    sourceScheduler,
    sourceDiagnostics
  );
  const yieldLogAfter = getMockSchedulerYieldLogSnapshot(shadowState, after);
  const frameBudgetDecisionAfter = getMockSchedulerFrameBudgetDecision(
    after,
    yieldLogAfter
  );
  const taskQueueAfter = getMockSchedulerTaskQueueSnapshot(
    shadowState,
    after.now
  );
  const matchedTaskAfter = summarizeMockSchedulerTask(
    validation.taskRecord,
    after.now
  );
  const metadata = {
    kind: privateSchedulerMockExpiredLaneFlushDiagnosticsKind,
    version: privateSchedulerMockExpiredLaneFlushDiagnosticsVersion,
    status:
      'drained-expired-mock-scheduler-work-with-lane-metadata-for-diagnostics',
    accepted: true,
    compatibilityTarget: schedulerCompatibilityTarget,
    reactCompatibilityTarget,
    schedulerDiagnosticStatus: 'private-scheduler-act-queue-flush-diagnostics',
    lanePriorityRootSchedulerMetadata: laneMetadata,
    expiredCallbackPriorityLevel: laneMetadata.priorityLevel,
    expiredCallbackPriorityLabel: laneMetadata.priorityLabel,
    expiredCallbackSchedulerPriority: laneMetadata.schedulerPriority,
    expiredCallbackVirtualTime: before.now,
    expiredCallbackLaneLabel: laneMetadata.laneLabel,
    expiredCallbackFrameBudget: frameBudgetDecisionBefore,
    frameBudgetDecisionBefore,
    frameBudgetDecisionAfter,
    yieldLogBefore,
    yieldLogAfter,
    nowBefore: before.now,
    nowAfter: after.now,
    pendingBefore: before.pendingWork,
    pendingAfter: after.pendingWork,
    requestedPaintBefore: before.needsPaint,
    requestedPaintAfter: after.needsPaint,
    matchedTaskBefore,
    matchedTaskAfter,
    taskQueueBefore,
    taskQueueAfter,
    taskQueueCountBefore: taskQueueBefore.length,
    taskQueueCountAfter: taskQueueAfter.length,
    sourceDrainReport: drainReport,
    sourceDrainStatus: drainReport.status,
    sourceDrainFlushedExpiredWork: drainReport.flushedExpiredWork === true,
    sourceDrainHasMoreWorkAfterDrain: drainReport.hasMoreWorkAfterDrain,
    recognizesExpiredLanePriorityRootSchedulerMetadata: true,
    recordsExpiredCallbackPriorityVirtualTimeFrameBudgetAndLaneLabel: true,
    rejectsUnsupportedExpiredCallbackPriorityLevels: true,
    rejectsStaleExpiredCallbackHandles: true,
    drainsExpiredMockSchedulerWork: true,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    executesAcceptedInternalTestCallbacks: true,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesScheduledCallbacks: true
  };

  Object.defineProperty(
    metadata,
    privateSchedulerMockExpiredLaneFlushDiagnosticsBrand,
    {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false
    }
  );

  return Object.freeze(metadata);
}

function validateExpiredLanePriorityRootSchedulerMetadata(
  sourceScheduler,
  shadowState,
  lanePriorityRootSchedulerMetadata,
  snapshotTime
) {
  const invalid = (rejectionReason) => ({
    rejectionReason,
    taskRecord: null,
    priorityLabel: null,
    schedulerPriority: null
  });

  if (!isObjectLike(lanePriorityRootSchedulerMetadata)) {
    return invalid('metadata-not-object');
  }
  if (
    lanePriorityRootSchedulerMetadata[
      privateSchedulerMockExpiredLaneFlushMetadataBrand
    ] !== true
  ) {
    return invalid('metadata-missing-internal-brand');
  }
  if (
    lanePriorityRootSchedulerMetadata.kind !==
    privateSchedulerMockExpiredLaneFlushMetadataKind
  ) {
    return invalid('metadata-kind');
  }
  if (
    lanePriorityRootSchedulerMetadata.version !==
    privateSchedulerMockExpiredLaneFlushMetadataVersion
  ) {
    return invalid('metadata-version');
  }
  if (
    lanePriorityRootSchedulerMetadata.compatibilityTarget !==
    schedulerCompatibilityTarget
  ) {
    return invalid('metadata-scheduler-target');
  }
  if (
    lanePriorityRootSchedulerMetadata.reactCompatibilityTarget !==
    reactCompatibilityTarget
  ) {
    return invalid('metadata-react-target');
  }
  if (
    !includesString(
      lanePriorityRootSchedulerMetadata.lanePriorityMetadataKind,
      acceptedExpiredLanePriorityMetadataKinds
    )
  ) {
    return invalid('lane-priority-metadata-kind');
  }
  if (
    !includesString(
      lanePriorityRootSchedulerMetadata.rootSchedulerMetadataKind,
      acceptedExpiredRootSchedulerMetadataKinds
    )
  ) {
    return invalid('root-scheduler-metadata-kind');
  }
  if (lanePriorityRootSchedulerMetadata.taskKind !== 'SchedulerCallback') {
    return invalid('task-kind');
  }
  if (
    typeof lanePriorityRootSchedulerMetadata.laneLabel !== 'string' ||
    lanePriorityRootSchedulerMetadata.laneLabel.length === 0
  ) {
    return invalid('lane-label');
  }

  const priorityLabel = getSchedulerPriorityLevelLabel(
    sourceScheduler,
    lanePriorityRootSchedulerMetadata.priorityLevel
  );
  if (priorityLabel === null) {
    return invalid('unsupported-priority-level');
  }
  const schedulerPriority =
    getSchedulerPriorityNameForPriorityLevelLabel(priorityLabel);
  if (
    lanePriorityRootSchedulerMetadata.schedulerPriority !== undefined &&
    lanePriorityRootSchedulerMetadata.schedulerPriority !== schedulerPriority
  ) {
    return invalid('scheduler-priority-mismatch');
  }

  if (
    lanePriorityRootSchedulerMetadata.publicCompatibilityClaimed !== false ||
    lanePriorityRootSchedulerMetadata.publicSchedulerTimingCompatibilityClaimed !==
      false ||
    lanePriorityRootSchedulerMetadata.publicReactActCompatibilityClaimed !==
      false ||
    lanePriorityRootSchedulerMetadata.publicRootSchedulerCompatibilityClaimed !==
      false
  ) {
    return invalid('metadata-public-claim');
  }
  if (
    lanePriorityRootSchedulerMetadata.drainsPublicSchedulerTaskQueue !== false ||
    lanePriorityRootSchedulerMetadata.drainsPublicReactActQueue !== false ||
    lanePriorityRootSchedulerMetadata.executesQueuedWork !== false ||
    lanePriorityRootSchedulerMetadata.executesEffects !== false ||
    lanePriorityRootSchedulerMetadata.executesRendererWork !== false
  ) {
    return invalid('metadata-execution-claim');
  }
  if (
    lanePriorityRootSchedulerMetadata.rendererWorkExecutionBlocked !== true ||
    lanePriorityRootSchedulerMetadata.rootSchedulerSchedulesMockCallbackOnly !==
      true
  ) {
    return invalid('metadata-renderer-work-policy');
  }

  const taskRecord = findShadowTaskRecord(
    shadowState,
    lanePriorityRootSchedulerMetadata.callbackHandle
  );
  if (taskRecord === null) {
    return invalid('stale-callback-handle');
  }
  if (taskRecord.cancelled === true || taskRecord.task.callback === null) {
    return invalid('stale-callback-handle');
  }
  if (typeof taskRecord.task.callback !== 'function') {
    return invalid('callback-handle-not-function');
  }
  if (taskRecord.task.callback[privateActQueueTestCallbackBrand] !== true) {
    return invalid('callback-handle-not-branded-internal-test-callback');
  }
  if (taskRecord.task.priorityLevel !== lanePriorityRootSchedulerMetadata.priorityLevel) {
    return invalid('callback-priority-mismatch');
  }
  if (
    getSchedulerPriorityLevelLabel(sourceScheduler, taskRecord.task.priorityLevel) ===
    null
  ) {
    return invalid('unsupported-callback-priority-level');
  }
  if (taskRecord.task.expirationTime > snapshotTime) {
    return invalid('callback-handle-not-expired');
  }

  const expiredPendingTaskRecords = getExpiredPendingShadowTaskRecords(
    shadowState,
    snapshotTime
  );
  if (expiredPendingTaskRecords.length === 0) {
    return invalid('no-expired-callback-handles');
  }
  if (expiredPendingTaskRecords.indexOf(taskRecord) === -1) {
    return invalid('callback-handle-not-expired-pending');
  }
  if (expiredPendingTaskRecords.length > 1) {
    return invalid('ambiguous-expired-callback-handles');
  }

  return {
    rejectionReason: null,
    taskRecord,
    priorityLabel,
    schedulerPriority
  };
}

function summarizeExpiredLanePriorityRootSchedulerMetadataForDiagnostics(
  sourceScheduler,
  lanePriorityRootSchedulerMetadata,
  validation
) {
  const isMetadataObject = isObjectLike(lanePriorityRootSchedulerMetadata);
  const callbackHandle = isMetadataObject
    ? lanePriorityRootSchedulerMetadata.callbackHandle
    : null;
  const priorityLevel = isMetadataObject
    ? lanePriorityRootSchedulerMetadata.priorityLevel
    : undefined;
  const priorityLabel =
    validation.priorityLabel ||
    getSchedulerPriorityLevelLabel(sourceScheduler, priorityLevel);
  const schedulerPriority =
    validation.schedulerPriority ||
    (priorityLabel === null
      ? null
      : getSchedulerPriorityNameForPriorityLevelLabel(priorityLabel));

  return Object.freeze({
    kind: isMetadataObject ? lanePriorityRootSchedulerMetadata.kind : null,
    version: isMetadataObject
      ? lanePriorityRootSchedulerMetadata.version
      : null,
    accepted: validation.rejectionReason === null,
    rejectionReason: validation.rejectionReason,
    compatibilityTarget: isMetadataObject
      ? lanePriorityRootSchedulerMetadata.compatibilityTarget
      : null,
    reactCompatibilityTarget: isMetadataObject
      ? lanePriorityRootSchedulerMetadata.reactCompatibilityTarget
      : null,
    lanePriorityMetadataKind: isMetadataObject
      ? lanePriorityRootSchedulerMetadata.lanePriorityMetadataKind
      : null,
    rootSchedulerMetadataKind: isMetadataObject
      ? lanePriorityRootSchedulerMetadata.rootSchedulerMetadataKind
      : null,
    taskKind: isMetadataObject
      ? lanePriorityRootSchedulerMetadata.taskKind
      : null,
    rootId: isMetadataObject ? lanePriorityRootSchedulerMetadata.rootId : null,
    rootLabel: isMetadataObject
      ? lanePriorityRootSchedulerMetadata.rootLabel
      : null,
    lane: isMetadataObject ? lanePriorityRootSchedulerMetadata.lane : null,
    laneLabel: isMetadataObject
      ? lanePriorityRootSchedulerMetadata.laneLabel
      : null,
    eventPriority: isMetadataObject
      ? lanePriorityRootSchedulerMetadata.eventPriority
      : null,
    sourcePriority: isMetadataObject
      ? lanePriorityRootSchedulerMetadata.sourcePriority
      : null,
    selectedNextLanes: isMetadataObject
      ? lanePriorityRootSchedulerMetadata.selectedNextLanes
      : null,
    pendingLanesBefore: isMetadataObject
      ? lanePriorityRootSchedulerMetadata.pendingLanesBefore
      : null,
    pendingLanesAfter: isMetadataObject
      ? lanePriorityRootSchedulerMetadata.pendingLanesAfter
      : null,
    priorityLevel: priorityLevel ?? null,
    priorityLabel,
    schedulerPriority,
    callbackHandleMatched: validation.taskRecord !== null,
    callbackHandleId: isObjectLike(callbackHandle)
      ? callbackHandle.id ?? null
      : null,
    callbackHandleScheduleOrder:
      validation.taskRecord === null
        ? null
        : validation.taskRecord.scheduleOrder,
    rendererWorkExecutionBlocked: isMetadataObject
      ? lanePriorityRootSchedulerMetadata.rendererWorkExecutionBlocked === true
      : false,
    rootSchedulerSchedulesMockCallbackOnly: isMetadataObject
      ? lanePriorityRootSchedulerMetadata.rootSchedulerSchedulesMockCallbackOnly ===
        true
      : false,
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false
  });
}

function createExpiredLaneFlushMetadataError(rejectionReason) {
  const error = new Error(
    '[fast-react] scheduler/unstable_mock private expired lane flush ' +
      'diagnostics rejected unsupported lane-priority/root-scheduler ' +
      'metadata: ' +
      rejectionReason +
      '. Only accepted private lane metadata for the matching expired mock ' +
      'Scheduler callback handle may be drained.'
  );
  error.name = 'FastReactSchedulerMockExpiredLaneFlushError';
  error.code = 'FAST_REACT_SCHEDULER_MOCK_EXPIRED_LANE_FLUSH_REJECTED';
  error.entrypoint = 'scheduler/unstable_mock';
  error.compatibilityTarget = schedulerCompatibilityTarget;
  error.publicSchedulerTimingCompatibilityClaimed = false;
  error.publicReactActCompatibilityClaimed = false;
  error.executesRendererWork = false;
  return error;
}

function getExpiredPendingShadowTaskRecords(shadowState, snapshotTime) {
  return shadowState.taskRecords.filter(function (record) {
    return (
      record.cancelled !== true &&
      isObjectLike(record.task) &&
      typeof record.task.callback === 'function' &&
      record.task.expirationTime <= snapshotTime
    );
  });
}

function getSchedulerPriorityLevelLabel(sourceScheduler, priorityLevel) {
  switch (priorityLevel) {
    case sourceScheduler.unstable_ImmediatePriority:
      return 'ImmediatePriority';
    case sourceScheduler.unstable_UserBlockingPriority:
      return 'UserBlockingPriority';
    case sourceScheduler.unstable_NormalPriority:
      return 'NormalPriority';
    case sourceScheduler.unstable_LowPriority:
      return 'LowPriority';
    case sourceScheduler.unstable_IdlePriority:
      return 'IdlePriority';
    default:
      return null;
  }
}

function getSchedulerPriorityNameForPriorityLevelLabel(priorityLabel) {
  switch (priorityLabel) {
    case 'ImmediatePriority':
      return 'Immediate';
    case 'UserBlockingPriority':
      return 'UserBlocking';
    case 'NormalPriority':
      return 'Normal';
    case 'LowPriority':
      return 'Low';
    case 'IdlePriority':
      return 'Idle';
    default:
      return null;
  }
}

function describeMockSchedulerFrameBudgetForDiagnostics(
  sourceScheduler,
  shadowState,
  sourceDiagnostics
) {
  const snapshot = getMockSchedulerYieldPaintSnapshot(
    sourceScheduler,
    sourceDiagnostics
  );
  const yieldLog = getMockSchedulerYieldLogSnapshot(shadowState, snapshot);
  const frameBudgetDecision = getMockSchedulerFrameBudgetDecision(
    snapshot,
    yieldLog
  );
  const taskQueue = getMockSchedulerTaskQueueSnapshot(
    shadowState,
    snapshot.now
  );
  const metadata = {
    kind: privateSchedulerMockFrameBudgetMetadataKind,
    version: privateSchedulerMockFrameBudgetMetadataVersion,
    status: 'described-mock-scheduler-frame-budget-for-diagnostics',
    accepted: true,
    compatibilityTarget: schedulerCompatibilityTarget,
    reactCompatibilityTarget,
    schedulerDiagnosticStatus: 'private-scheduler-act-queue-flush-diagnostics',
    now: snapshot.now,
    pendingWork: snapshot.pendingWork,
    requestedPaint: snapshot.needsPaint,
    yieldLog,
    yieldedValues: snapshot.yieldedValues,
    yieldedValueCount: snapshot.yieldedValueCount,
    expectedNumberOfYields: snapshot.expectedNumberOfYields,
    didStop: snapshot.didStop,
    shouldYieldForPaint: snapshot.shouldYieldForPaint,
    frameBudgetDecision,
    unstableShouldYieldDecision: frameBudgetDecision.shouldYield,
    unstableShouldYieldInvoked: false,
    unstableShouldYieldInvocationSkippedReason:
      'derived-from-private-mock-state-to-avoid-didStop-side-effect',
    unstableRequestPaintInvoked: false,
    taskQueue,
    taskQueueCount: taskQueue.length,
    recognizesMockSchedulerFrameBudgetMetadata: true,
    describesMockSchedulerFrameBudgetWithoutFlushing: true,
    recordsMockSchedulerShouldYieldDecision: true,
    recordsMockSchedulerFrameBudgetDecision: true,
    recordsMockSchedulerYieldLogOrdering: true,
    recordsMockSchedulerRequestPaintFrameBudget: true,
    drainsMockSchedulerWork: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    usesPublicSchedulerFrameInterval: false,
    usesWallClockTime: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesScheduledCallbacks: false
  };

  Object.defineProperty(metadata, privateSchedulerMockFrameBudgetMetadataBrand, {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false
  });

  return Object.freeze(metadata);
}

function requestPaintFrameBudgetForDiagnostics(
  sourceScheduler,
  shadowState,
  sourceDiagnostics
) {
  const before = getMockSchedulerYieldPaintSnapshot(
    sourceScheduler,
    sourceDiagnostics
  );
  const yieldLogBefore = getMockSchedulerYieldLogSnapshot(shadowState, before);
  const frameBudgetDecisionBefore = getMockSchedulerFrameBudgetDecision(
    before,
    yieldLogBefore
  );
  const taskQueueBefore = getMockSchedulerTaskQueueSnapshot(
    shadowState,
    before.now
  );
  const requestPaintReport =
    sourceDiagnostics &&
    typeof sourceDiagnostics.requestPaintForDiagnostics === 'function'
      ? sourceDiagnostics.requestPaintForDiagnostics()
      : requestPaintWithPublicMockScheduler(sourceScheduler, before);
  const after = getMockSchedulerYieldPaintSnapshot(
    sourceScheduler,
    sourceDiagnostics
  );
  const yieldLogAfter = getMockSchedulerYieldLogSnapshot(shadowState, after);
  const frameBudgetDecisionAfter = getMockSchedulerFrameBudgetDecision(
    after,
    yieldLogAfter
  );
  const taskQueueAfter = getMockSchedulerTaskQueueSnapshot(
    shadowState,
    after.now
  );
  const metadata = {
    kind: privateSchedulerMockFrameBudgetMetadataKind,
    version: privateSchedulerMockFrameBudgetMetadataVersion,
    status: 'requested-paint-frame-budget-for-diagnostics',
    accepted: true,
    compatibilityTarget: schedulerCompatibilityTarget,
    reactCompatibilityTarget,
    schedulerDiagnosticStatus: 'private-scheduler-act-queue-flush-diagnostics',
    requestPaintReport,
    requestPaintReturnedUndefined:
      requestPaintReport.requestPaintReturnedUndefined === true,
    nowBefore: before.now,
    nowAfter: after.now,
    pendingBefore: before.pendingWork,
    pendingAfter: after.pendingWork,
    requestedPaintBefore: before.needsPaint,
    requestedPaintAfter: after.needsPaint,
    yieldLogBefore,
    yieldLogAfter,
    yieldedValuesBefore: before.yieldedValues,
    yieldedValuesAfter: after.yieldedValues,
    yieldedValuesAdded: getMockSchedulerYieldedValuesAdded(
      before.yieldedValues,
      after.yieldedValues
    ),
    yieldedValueCountBefore: before.yieldedValueCount,
    yieldedValueCountAfter: after.yieldedValueCount,
    expectedNumberOfYieldsBefore: before.expectedNumberOfYields,
    expectedNumberOfYieldsAfter: after.expectedNumberOfYields,
    didStopBefore: before.didStop,
    didStopAfter: after.didStop,
    shouldYieldForPaintBefore: before.shouldYieldForPaint,
    shouldYieldForPaintAfter: after.shouldYieldForPaint,
    frameBudgetDecisionBefore,
    frameBudgetDecisionAfter,
    unstableShouldYieldDecisionBefore: frameBudgetDecisionBefore.shouldYield,
    unstableShouldYieldDecisionAfter: frameBudgetDecisionAfter.shouldYield,
    unstableShouldYieldInvoked: false,
    unstableShouldYieldInvocationSkippedReason:
      'derived-from-private-mock-state-to-avoid-didStop-side-effect',
    unstableRequestPaintInvoked: true,
    taskQueueBefore,
    taskQueueAfter,
    taskQueueUnchanged: areMockSchedulerTaskQueuesEqual(
      taskQueueBefore,
      taskQueueAfter
    ),
    recognizesMockSchedulerFrameBudgetMetadata: true,
    describesMockSchedulerFrameBudgetWithoutFlushing: true,
    recordsMockSchedulerShouldYieldDecision: true,
    recordsMockSchedulerFrameBudgetDecision: true,
    recordsMockSchedulerYieldLogOrdering: true,
    recordsMockSchedulerRequestPaintFrameBudget: true,
    drainsMockSchedulerWork: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    usesPublicSchedulerFrameInterval: false,
    usesWallClockTime: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesScheduledCallbacks: false
  };

  Object.defineProperty(metadata, privateSchedulerMockFrameBudgetMetadataBrand, {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false
  });

  return Object.freeze(metadata);
}

function requestPaintWithPublicMockScheduler(sourceScheduler, before) {
  const requestPaintReturnValue = sourceScheduler.unstable_requestPaint();
  const after = getMockSchedulerYieldPaintSnapshot(sourceScheduler, null);
  return Object.freeze({
    status: 'requested-paint-for-diagnostics',
    requestPaintReturnedUndefined: requestPaintReturnValue === undefined,
    nowBefore: before.now,
    nowAfter: after.now,
    pendingBefore: before.pendingWork,
    pendingAfter: after.pendingWork,
    yieldedValuesBefore: before.yieldedValues,
    yieldedValuesAfter: after.yieldedValues,
    yieldedValuesAdded: getMockSchedulerYieldedValuesAdded(
      before.yieldedValues,
      after.yieldedValues
    ),
    yieldedValueCountBefore: before.yieldedValueCount,
    yieldedValueCountAfter: after.yieldedValueCount,
    needsPaintBefore: before.needsPaint,
    needsPaintAfter: after.needsPaint,
    shouldYieldForPaintBefore: before.shouldYieldForPaint,
    shouldYieldForPaintAfter: after.shouldYieldForPaint,
    drainsMockSchedulerWork: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false
  });
}

function getMockSchedulerYieldPaintSnapshot(sourceScheduler, sourceDiagnostics) {
  if (
    sourceDiagnostics &&
    typeof sourceDiagnostics.describeMockSchedulerYieldPaintState === 'function'
  ) {
    return sourceDiagnostics.describeMockSchedulerYieldPaintState();
  }

  return Object.freeze({
    status: 'mock-scheduler-yield-paint-state-for-diagnostics',
    now: sourceScheduler.unstable_now(),
    pendingWork: sourceScheduler.unstable_hasPendingWork(),
    yieldedValues: Object.freeze([]),
    yieldedValueCount: 0,
    expectedNumberOfYields: -1,
    didStop: false,
    needsPaint: false,
    shouldYieldForPaint: false,
    recordsMockSchedulerYieldedValues: true,
    recordsMockSchedulerRequestPaint: true,
    recordsMockSchedulerContinuationOrdering: true,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false
  });
}

function recordShadowYieldLogMutation(shadowState, before, after) {
  const addedValues = getMockSchedulerYieldedValuesAdded(
    before.yieldedValues,
    after.yieldedValues
  );
  if (addedValues.length === 0) {
    return;
  }

  for (const value of addedValues) {
    shadowState.yieldLogEntries.push({
      sequence: shadowState.nextYieldSequence++,
      value
    });
  }
}

function getMockSchedulerYieldedValuesAdded(beforeValues, afterValues) {
  if (afterValues.length < beforeValues.length) {
    return Object.freeze(afterValues.slice());
  }
  return Object.freeze(afterValues.slice(beforeValues.length));
}

function getMockSchedulerYieldLogSnapshot(shadowState, schedulerSnapshot) {
  if (!shadowYieldLogMatchesSchedulerSnapshot(shadowState, schedulerSnapshot)) {
    syncShadowYieldLogWithSchedulerSnapshot(shadowState, schedulerSnapshot);
  }

  const entries = Object.freeze(
    shadowState.yieldLogEntries.map(function (entry, index) {
      return Object.freeze({
        index,
        sequence: entry.sequence,
        value: entry.value
      });
    })
  );

  return Object.freeze({
    state: entries.length === 0 ? 'empty' : 'yielded-values',
    empty: entries.length === 0,
    values: schedulerSnapshot.yieldedValues,
    valueCount: schedulerSnapshot.yieldedValueCount,
    entries,
    lastClearOrder: shadowState.lastYieldLogClearOrder,
    nextSequence: shadowState.nextYieldSequence
  });
}

function shadowYieldLogMatchesSchedulerSnapshot(
  shadowState,
  schedulerSnapshot
) {
  if (shadowState.yieldLogEntries.length !== schedulerSnapshot.yieldedValueCount) {
    return false;
  }
  for (let index = 0; index < shadowState.yieldLogEntries.length; index++) {
    if (
      !Object.is(
        shadowState.yieldLogEntries[index].value,
        schedulerSnapshot.yieldedValues[index]
      )
    ) {
      return false;
    }
  }
  return true;
}

function syncShadowYieldLogWithSchedulerSnapshot(
  shadowState,
  schedulerSnapshot
) {
  shadowState.yieldLogEntries.length = 0;
  for (const value of schedulerSnapshot.yieldedValues) {
    shadowState.yieldLogEntries.push({
      sequence: shadowState.nextYieldSequence++,
      value
    });
  }
}

function getMockSchedulerFrameBudgetDecision(schedulerSnapshot, yieldLog) {
  const noYieldBudgetReached =
    schedulerSnapshot.expectedNumberOfYields === 0 && yieldLog.empty;
  const yieldCountBudgetReached =
    schedulerSnapshot.expectedNumberOfYields !== -1 &&
    !yieldLog.empty &&
    schedulerSnapshot.yieldedValueCount >=
      schedulerSnapshot.expectedNumberOfYields;
  const requestedPaintYield =
    schedulerSnapshot.shouldYieldForPaint && schedulerSnapshot.needsPaint;
  const reasons = [];

  if (noYieldBudgetReached) {
    reasons.push('expected-number-of-yields-zero-with-empty-log');
  }
  if (yieldCountBudgetReached) {
    reasons.push('expected-number-of-yields-reached');
  }
  if (requestedPaintYield) {
    reasons.push('requested-paint-while-flushing-until-next-paint');
  }

  return Object.freeze({
    decisionSource: 'private-mock-yield-and-paint-state',
    shouldYield: reasons.length > 0,
    reasons: Object.freeze(reasons),
    virtualTime: schedulerSnapshot.now,
    requestedPaint: schedulerSnapshot.needsPaint,
    yieldedValueCount: schedulerSnapshot.yieldedValueCount,
    expectedNumberOfYields: schedulerSnapshot.expectedNumberOfYields,
    noYieldBudgetReached,
    yieldCountBudgetReached,
    requestedPaintYield,
    didStopBeforeDecision: schedulerSnapshot.didStop,
    wouldSetDidStopIfUnstableShouldYieldWereInvoked: reasons.length > 0,
    usesPublicSchedulerFrameInterval: false,
    usesWallClockTime: false,
    executesScheduledCallbacks: false
  });
}

function areMockSchedulerTaskQueuesEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let index = 0; index < a.length; index++) {
    if (JSON.stringify(a[index]) !== JSON.stringify(b[index])) {
      return false;
    }
  }
  return true;
}

function getMockSchedulerTaskQueueSnapshot(shadowState, snapshotTime) {
  return Object.freeze(
    shadowState.taskRecords
      .map(function (record) {
        return summarizeMockSchedulerTask(record, snapshotTime);
      })
      .sort(compareShadowTaskSummaries)
  );
}

function summarizeMockSchedulerTask(record, snapshotTime) {
  const task = record.task;
  const callback = isObjectLike(task) ? task.callback : undefined;
  const callbackStatus =
    callback === null || record.cancelled === true
      ? 'cancelled-tombstone'
      : typeof callback === 'function'
        ? 'pending-callback'
        : 'unknown-callback';

  return Object.freeze({
    id: Number.isInteger(task.id) ? task.id : null,
    scheduleOrder: record.scheduleOrder,
    priorityLevel: task.priorityLevel,
    startTime: task.startTime,
    expirationTime: task.expirationTime,
    sortIndex: task.sortIndex,
    expired: task.expirationTime <= snapshotTime,
    callbackStatus,
    callback: summarizeMockSchedulerCallback(callback)
  });
}

function summarizeMockSchedulerCallback(callback) {
  if (callback === null) {
    return Object.freeze({
      status: 'cancelled-tombstone'
    });
  }
  if (typeof callback === 'function') {
    if (callback[privateActQueueTestCallbackBrand] === true) {
      return Object.freeze({
        status: 'branded-internal-test-callback',
        kind: callback.kind,
        label: callback.label,
        executesQueuedWork: false,
        executesEffects: false
      });
    }
    return Object.freeze({
      status: 'function',
      name: callback.name,
      length: callback.length
    });
  }
  return Object.freeze({
    status: 'unknown',
    type: typeof callback
  });
}

function compareShadowTaskSummaries(a, b) {
  const sortIndexDifference = a.sortIndex - b.sortIndex;
  if (sortIndexDifference !== 0) {
    return sortIndexDifference;
  }
  return a.scheduleOrder - b.scheduleOrder;
}

function countMockSchedulerTasksByCallbackStatus(
  tasks,
  callbackStatus,
  expired
) {
  return tasks.filter(function (task) {
    return (
      task.callbackStatus === callbackStatus &&
      (expired === undefined || task.expired === expired)
    );
  }).length;
}

function isObjectLike(value) {
  return (
    (typeof value === 'object' && value !== null) ||
    typeof value === 'function'
  );
}

function includesString(value, expectedValues) {
  return typeof value === 'string' && expectedValues.includes(value);
}
