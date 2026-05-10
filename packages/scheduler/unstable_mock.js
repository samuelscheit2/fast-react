'use strict';

const reactCompatibilityTarget = 'react@19.2.6';
const schedulerCompatibilityTarget = 'scheduler@0.27.0';
const privateActQueueFlushDiagnosticsExport =
  '__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__';
const privateActQueueTestQueueKind =
  'fast-react.react.private-act-queue-test-queue';
const privateActQueueTestTaskKind =
  'fast-react.react.private-act-queue-test-task';
const privateActQueueTestCallbackKind =
  'fast-react.react.private-act-queue-test-callback';
const privateActQueueTestQueueVersion = 1;
const privateActQueueTestQueueBrand = Symbol.for(
  privateActQueueTestQueueKind
);
const privateActQueueTestTaskBrand = Symbol.for(
  privateActQueueTestTaskKind
);
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
const privateSchedulerMockExpiredActRootWorkMetadataKind =
  'fast-react.scheduler.mock-expired-act-root-work-metadata';
const privateSchedulerMockExpiredActRootWorkMetadataBrand = Symbol.for(
  privateSchedulerMockExpiredActRootWorkMetadataKind
);
const privateSchedulerMockExpiredActRootWorkMetadataVersion = 1;
const privateSchedulerMockExpiredActRootWorkDiagnosticsKind =
  'fast-react.scheduler.mock-expired-act-root-work-diagnostics';
const privateSchedulerMockExpiredActRootWorkDiagnosticsBrand = Symbol.for(
  privateSchedulerMockExpiredActRootWorkDiagnosticsKind
);
const privateSchedulerMockExpiredActRootWorkDiagnosticsVersion = 1;
const privateSchedulerMockExpiredActRootWorkSourceValidator = Symbol(
  'fast-react.scheduler.mock-expired-act-root-work-source-validator'
);
const schedulerMockExpiredActRootWorkSources = new WeakSet();
const schedulerMockExpiredActRootWorkSourceValidator = Object.freeze({
  status: 'fast-react.scheduler.mock-expired-act-root-work-source-validator',
  isSchedulerMockExpiredActRootWorkSource
});
const acceptedExpiredActRootWorkRecordKinds = Object.freeze([
  'RootLaneSchedulingSnapshot',
  'UpdateContainerResult',
  'RootScheduleUpdateRecord',
  'RootTaskScheduleRecord',
  'SchedulerCallbackRequest',
  'RootSchedulerCallbackExecutionRecord',
  'HostRootFinishedWorkPendingCommitRecordForCanary',
  'HostRootFinishedWorkCommitHandoffRecordForCanary'
]);
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

function freezeSchedulerOwnedExpiredActRootWorkSource(value) {
  schedulerMockExpiredActRootWorkSources.add(value);
  return Object.freeze(value);
}

function freezeSchedulerOwnedExpiredActRootWorkSourceArray(values) {
  return freezeSchedulerOwnedExpiredActRootWorkSource(values);
}

function isSchedulerMockExpiredActRootWorkSource(value) {
  return (
    isObjectLike(value) &&
    schedulerMockExpiredActRootWorkSources.has(value)
  );
}

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
    const wrappedValue =
      typeof value === 'function'
        ? wrapSchedulerFunction(
            sourceScheduler,
            shadowState,
            diagnostics,
            key,
            value
          )
        : value;
    Object.defineProperty(wrappedScheduler, key, {
      configurable: typeof value !== 'function',
      enumerable: true,
      value: wrappedValue,
      writable: typeof value !== 'function'
    });
  }

  return wrappedScheduler;
}

function createPrivateActQueueFlushDiagnostics(
  sourceScheduler,
  shadowState,
  sourceDiagnostics
) {
  return freezeSchedulerOwnedExpiredActRootWorkSource({
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
    mockSchedulerExpiredActRootWorkDiagnosticsReady: true,
    recognizesExpiredActRootWorkMetadata: true,
    linksExpiredCallbacksToAcceptedActRootWorkRecords: true,
    routesExpiredActRootWorkThroughFlushAllOrFlushExpiredDiagnostics: true,
    consumesAcceptedExpiredActRootWorkRecords: true,
    rejectsStaleExpiredActQueues: true,
    rejectsExpiredActRootWorkPublicCompatibilityClaims: true,
    drainExpiredMockSchedulerWork(lanePriorityRootSchedulerMetadata) {
      if (arguments.length === 0) {
        return sourceDiagnostics.drainExpiredMockSchedulerWork();
      }
      if (
        isExpiredActRootWorkMetadataObject(lanePriorityRootSchedulerMetadata)
      ) {
        return drainExpiredMockSchedulerWorkWithActRootMetadataForDiagnostics(
          sourceScheduler,
          shadowState,
          sourceDiagnostics,
          lanePriorityRootSchedulerMetadata
        );
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
    describeExpiredActRootWorkMetadataForDiagnostics(
      expiredActRootWorkMetadata
    ) {
      return describeExpiredActRootWorkMetadataForDiagnostics(
        sourceScheduler,
        shadowState,
        expiredActRootWorkMetadata
      );
    },
    drainExpiredMockSchedulerWorkWithActRootMetadataForDiagnostics(
      expiredActRootWorkMetadata
    ) {
      return drainExpiredMockSchedulerWorkWithActRootMetadataForDiagnostics(
        sourceScheduler,
        shadowState,
        sourceDiagnostics,
        expiredActRootWorkMetadata
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
  } else if (isFlushAllOrExpiredHelper(key)) {
    wrappedFunction = function (privateMetadata) {
      if (
        arguments.length > 0 &&
        isExpiredActRootWorkMetadataObject(privateMetadata)
      ) {
        return drainExpiredMockSchedulerWorkWithActRootMetadataForDiagnostics(
          sourceScheduler,
          shadowState,
          sourceScheduler.unstable_flushAllWithoutAsserting[
            privateActQueueFlushDiagnosticsExport
          ],
          privateMetadata,
          key
        );
      }
      return sourceFunction.apply(sourceScheduler, arguments);
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
    Object.defineProperty(
      wrappedFunction,
      privateSchedulerMockExpiredActRootWorkSourceValidator,
      {
        configurable: false,
        enumerable: false,
        value: schedulerMockExpiredActRootWorkSourceValidator,
        writable: false
      }
    );
  }

  return Object.freeze(wrappedFunction);
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

function isFlushAllOrExpiredHelper(key) {
  return (
    key === 'unstable_flushAll' ||
    key === 'unstable_flushAllWithoutAsserting' ||
    key === 'unstable_flushExpired'
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
  const callbackRejectionReason =
    getRejectedExpiredActRootWorkCallbackReason(
      taskRecord.task.callback,
      'callback-handle'
    );
  if (callbackRejectionReason !== null) {
    return invalid(callbackRejectionReason);
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

function describeExpiredActRootWorkMetadataForDiagnostics(
  sourceScheduler,
  shadowState,
  expiredActRootWorkMetadata
) {
  const now = sourceScheduler.unstable_now();
  const validation = validateExpiredActRootWorkMetadata(
    sourceScheduler,
    shadowState,
    expiredActRootWorkMetadata,
    now
  );
  const metadataSummary = summarizeExpiredActRootWorkMetadataForDiagnostics(
    sourceScheduler,
    expiredActRootWorkMetadata,
    validation
  );

  return Object.freeze({
    status:
      validation.rejectionReason === null
        ? 'accepted-expired-act-root-work-metadata'
        : 'rejected-expired-act-root-work-metadata',
    accepted: validation.rejectionReason === null,
    rejectionReason: validation.rejectionReason,
    compatibilityTarget: schedulerCompatibilityTarget,
    reactCompatibilityTarget,
    currentVirtualTime: now,
    metadata: metadataSummary,
    recognizesExpiredActRootWorkMetadata: true,
    linksExpiredCallbacksToAcceptedActRootWorkRecords: true,
    routesExpiredActRootWorkThroughFlushAllOrFlushExpiredDiagnostics: true,
    consumesAcceptedExpiredActRootWorkRecords: true,
    rejectsStaleExpiredActQueues: true,
    rejectsExpiredActRootWorkPublicCompatibilityClaims: true,
    drainsExpiredMockSchedulerWork: false,
    drainsAcceptedInternalTestQueues: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false
  });
}

function drainExpiredMockSchedulerWorkWithActRootMetadataForDiagnostics(
  sourceScheduler,
  shadowState,
  sourceDiagnostics,
  expiredActRootWorkMetadata,
  flushHelperName = 'unstable_flushExpired'
) {
  const before = getMockSchedulerYieldPaintSnapshot(
    sourceScheduler,
    sourceDiagnostics
  );
  const validation = validateExpiredActRootWorkMetadata(
    sourceScheduler,
    shadowState,
    expiredActRootWorkMetadata,
    before.now
  );
  if (validation.rejectionReason !== null) {
    throw createExpiredActRootWorkMetadataError(validation.rejectionReason);
  }

  const yieldLogBefore = getMockSchedulerYieldLogSnapshot(shadowState, before);
  const taskQueueBefore = getMockSchedulerTaskQueueSnapshot(
    shadowState,
    before.now
  );
  const matchedTaskBefore = summarizeMockSchedulerTask(
    validation.taskRecord,
    before.now
  );
  const metadataSummary = summarizeExpiredActRootWorkMetadataForDiagnostics(
    sourceScheduler,
    expiredActRootWorkMetadata,
    validation
  );

  const expiredDrainReport = cloneExpiredActRootWorkSourceDrainReport(
    sourceDiagnostics.drainExpiredMockSchedulerWork()
  );
  const rootWorkRecordConsumptionReport =
    consumeAcceptedExpiredActRootWorkRecords(validation.rootWorkRecords);
  const actQueueDrainReport = cloneExpiredActRootWorkActQueueDrainReport(
    sourceDiagnostics.drainAcceptedInternalActQueue(validation.actQueue)
  );
  const flushRouteReport =
    createExpiredActRootWorkFlushRouteReportForDiagnostics(
      flushHelperName,
      expiredDrainReport,
      rootWorkRecordConsumptionReport,
      actQueueDrainReport
    );

  const after = getMockSchedulerYieldPaintSnapshot(
    sourceScheduler,
    sourceDiagnostics
  );
  const yieldLogAfter = getMockSchedulerYieldLogSnapshot(shadowState, after);
  const taskQueueAfter = getMockSchedulerTaskQueueSnapshot(
    shadowState,
    after.now
  );
  const matchedTaskAfter = summarizeMockSchedulerTask(
    validation.taskRecord,
    after.now
  );
  const metadata = {
    kind: privateSchedulerMockExpiredActRootWorkDiagnosticsKind,
    version: privateSchedulerMockExpiredActRootWorkDiagnosticsVersion,
    status:
      'drained-expired-mock-scheduler-work-with-act-root-metadata-for-diagnostics',
    accepted: true,
    compatibilityTarget: schedulerCompatibilityTarget,
    reactCompatibilityTarget,
    schedulerDiagnosticStatus: 'private-scheduler-act-queue-flush-diagnostics',
    expiredActRootWorkMetadata: metadataSummary,
    expiredCallbackPriorityLevel: metadataSummary.priorityLevel,
    expiredCallbackPriorityLabel: metadataSummary.priorityLabel,
    expiredCallbackSchedulerPriority: metadataSummary.schedulerPriority,
    expiredCallbackVirtualTime: before.now,
    expiredCallbackLaneLabel: metadataSummary.laneLabel,
    actQueuePendingBefore: validation.actQueuePendingCount,
    actQueuePendingAfter: validation.actQueue.records.length,
    actQueueDrainReport,
    flushAllOrFlushExpiredRoute: flushRouteReport,
    rootWorkRecords: metadataSummary.rootWorkRecords,
    rootWorkRecordCount: metadataSummary.rootWorkRecordCount,
    rootWorkRecordsPendingBefore:
      rootWorkRecordConsumptionReport.pendingBefore,
    rootWorkRecordsPendingAfter:
      rootWorkRecordConsumptionReport.remainingCount,
    rootWorkRecordsConsumedCount:
      rootWorkRecordConsumptionReport.consumedCount,
    rootWorkRecordConsumptionReport,
    yieldLogBefore,
    yieldLogAfter,
    nowBefore: before.now,
    nowAfter: after.now,
    pendingBefore: before.pendingWork,
    pendingAfter: after.pendingWork,
    matchedTaskBefore,
    matchedTaskAfter,
    taskQueueBefore,
    taskQueueAfter,
    taskQueueCountBefore: taskQueueBefore.length,
    taskQueueCountAfter: taskQueueAfter.length,
    sourceDrainReport: expiredDrainReport,
    sourceDrainStatus: expiredDrainReport.status,
    sourceDrainFlushedExpiredWork:
      expiredDrainReport.flushedExpiredWork === true,
    sourceDrainHasMoreWorkAfterDrain:
      expiredDrainReport.hasMoreWorkAfterDrain,
    recognizesExpiredActRootWorkMetadata: true,
    linksExpiredCallbacksToAcceptedActRootWorkRecords: true,
    routesExpiredActRootWorkThroughFlushAllOrFlushExpiredDiagnostics: true,
    consumesAcceptedExpiredActRootWorkRecords: true,
    rejectsStaleExpiredActQueues: true,
    rejectsExpiredActRootWorkPublicCompatibilityClaims: true,
    drainsExpiredMockSchedulerWork: true,
    drainsAcceptedInternalTestQueues: true,
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
    executesRendererRoots: false,
    executesScheduledCallbacks: true
  };

  Object.defineProperty(
    metadata,
    privateSchedulerMockExpiredActRootWorkDiagnosticsBrand,
    {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false
    }
  );
  return freezeSchedulerOwnedExpiredActRootWorkSource(metadata);
}

function validateExpiredActRootWorkMetadata(
  sourceScheduler,
  shadowState,
  expiredActRootWorkMetadata,
  snapshotTime
) {
  const invalid = (rejectionReason) => ({
    rejectionReason,
    taskRecord: null,
    priorityLabel: null,
    schedulerPriority: null,
    actQueue: null,
    actQueuePendingCount: 0,
    rootWorkRecords: []
  });

  if (!isObjectLike(expiredActRootWorkMetadata)) {
    return invalid('metadata-not-object');
  }
  if (!isExpiredActRootWorkMetadataObject(expiredActRootWorkMetadata)) {
    return invalid('metadata-missing-internal-brand');
  }
  if (
    expiredActRootWorkMetadata.kind !==
    privateSchedulerMockExpiredActRootWorkMetadataKind
  ) {
    return invalid('metadata-kind');
  }
  if (
    expiredActRootWorkMetadata.version !==
    privateSchedulerMockExpiredActRootWorkMetadataVersion
  ) {
    return invalid('metadata-version');
  }
  if (
    expiredActRootWorkMetadata.compatibilityTarget !==
    schedulerCompatibilityTarget
  ) {
    return invalid('metadata-scheduler-target');
  }
  if (
    expiredActRootWorkMetadata.reactCompatibilityTarget !==
    reactCompatibilityTarget
  ) {
    return invalid('metadata-react-target');
  }
  if (
    expiredActRootWorkMetadata.publicCompatibilityClaimed !== false ||
    expiredActRootWorkMetadata.publicSchedulerTimingCompatibilityClaimed !==
      false ||
    expiredActRootWorkMetadata.publicReactActCompatibilityClaimed !== false ||
    expiredActRootWorkMetadata.publicRootSchedulerCompatibilityClaimed !==
      false ||
    expiredActRootWorkMetadata.publicRendererCompatibilityClaimed !== false
  ) {
    return invalid('metadata-public-claim');
  }
  if (
    expiredActRootWorkMetadata.drainsPublicSchedulerTaskQueue !== false ||
    expiredActRootWorkMetadata.drainsPublicReactActQueue !== false ||
    expiredActRootWorkMetadata.executesQueuedWork !== false ||
    expiredActRootWorkMetadata.executesEffects !== false ||
    expiredActRootWorkMetadata.executesRendererWork !== false ||
    expiredActRootWorkMetadata.executesRendererRoots !== false
  ) {
    return invalid('metadata-execution-claim');
  }
  if (
    expiredActRootWorkMetadata.rendererWorkExecutionBlocked !== true ||
    expiredActRootWorkMetadata.rootWorkMetadataOnly !== true ||
    expiredActRootWorkMetadata.actQueueHandoffOnly !== true
  ) {
    return invalid('metadata-renderer-work-policy');
  }

  const actQueueValidation = validateExpiredActRootWorkActQueue(
    expiredActRootWorkMetadata.actQueue
  );
  if (actQueueValidation.rejectionReason !== null) {
    return invalid(actQueueValidation.rejectionReason);
  }
  if (
    expiredActRootWorkMetadata.expectedActQueuePendingCount !== undefined &&
    expiredActRootWorkMetadata.expectedActQueuePendingCount !==
      actQueueValidation.pendingCount
  ) {
    return invalid('stale-act-queue');
  }

  const rootWorkValidation = validateExpiredActRootWorkRecords(
    expiredActRootWorkMetadata.rootWorkRecords
  );
  if (rootWorkValidation.rejectionReason !== null) {
    return invalid(rootWorkValidation.rejectionReason);
  }

  const taskRecord = findShadowTaskRecord(
    shadowState,
    expiredActRootWorkMetadata.callbackHandle
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

  const priorityLabel = getSchedulerPriorityLevelLabel(
    sourceScheduler,
    taskRecord.task.priorityLevel
  );
  if (priorityLabel === null) {
    return invalid('unsupported-callback-priority-level');
  }
  const schedulerPriority =
    getSchedulerPriorityNameForPriorityLevelLabel(priorityLabel);
  if (
    expiredActRootWorkMetadata.priorityLevel !== undefined &&
    expiredActRootWorkMetadata.priorityLevel !== taskRecord.task.priorityLevel
  ) {
    return invalid('callback-priority-mismatch');
  }
  if (
    expiredActRootWorkMetadata.schedulerPriority !== undefined &&
    expiredActRootWorkMetadata.schedulerPriority !== schedulerPriority
  ) {
    return invalid('scheduler-priority-mismatch');
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
    schedulerPriority,
    actQueue: actQueueValidation.queue,
    actQueuePendingCount: actQueueValidation.pendingCount,
    rootWorkRecords: rootWorkValidation.records
  };
}

function isExpiredActRootWorkMetadataObject(value) {
  return (
    isObjectLike(value) &&
    value[privateSchedulerMockExpiredActRootWorkMetadataBrand] === true
  );
}

function validateExpiredActRootWorkActQueue(queue) {
  const invalid = (rejectionReason) => ({
    rejectionReason,
    queue: null,
    pendingCount: 0
  });

  if (!isObjectLike(queue)) {
    return invalid('act-queue-not-object');
  }
  if (queue[privateActQueueTestQueueBrand] !== true) {
    return invalid('act-queue-missing-internal-brand');
  }
  if (queue.kind !== privateActQueueTestQueueKind) {
    return invalid('act-queue-kind');
  }
  if (queue.version !== privateActQueueTestQueueVersion) {
    return invalid('act-queue-version');
  }
  if (queue.compatibilityTarget !== reactCompatibilityTarget) {
    return invalid('act-queue-react-target');
  }
  if (queue.schedulerCompatibilityTarget !== schedulerCompatibilityTarget) {
    return invalid('act-queue-scheduler-target');
  }
  if (
    queue.publicCompatibilityClaimed !== false ||
    queue.publicSchedulerTimingCompatibilityClaimed !== false ||
    queue.publicReactActCompatibilityClaimed !== false
  ) {
    return invalid('act-queue-public-claim');
  }
  if (
    queue.queueFlushingReady !== false ||
    queue.privateTestQueueFlushDiagnosticsReady !== true ||
    queue.drainsAcceptedInternalTestQueues !== true ||
    queue.executesBrandedInternalTestCallbacks !== true ||
    queue.recordsBrandedInternalTestContinuations !== true
  ) {
    return invalid('act-queue-drain-policy');
  }
  if (queue.executesQueuedWork !== false || queue.executesEffects !== false) {
    return invalid('act-queue-execution-claim');
  }
  if (!Array.isArray(queue.records)) {
    return invalid('act-queue-records-not-array');
  }
  if (queue.records.length === 0) {
    return invalid('stale-act-queue');
  }

  for (let index = 0; index < queue.records.length; index++) {
    const rejectionReason = getRejectedExpiredActRootWorkActTaskReason(
      queue.records[index],
      index
    );
    if (rejectionReason !== null) {
      return invalid(rejectionReason);
    }
  }

  return {
    rejectionReason: null,
    queue,
    pendingCount: queue.records.length
  };
}

function getRejectedExpiredActRootWorkActTaskReason(task, index) {
  if (!isObjectLike(task)) {
    return 'act-record-' + index + '-not-object';
  }
  if (task[privateActQueueTestTaskBrand] !== true) {
    return 'act-record-' + index + '-missing-internal-brand';
  }
  if (task.kind !== privateActQueueTestTaskKind) {
    return 'act-record-' + index + '-kind';
  }
  if (task.version !== privateActQueueTestQueueVersion) {
    return 'act-record-' + index + '-version';
  }
  if (task.compatibilityTarget !== reactCompatibilityTarget) {
    return 'act-record-' + index + '-react-target';
  }
  if (task.schedulerCompatibilityTarget !== schedulerCompatibilityTarget) {
    return 'act-record-' + index + '-scheduler-target';
  }
  if (
    !includesString(task.recordKind, [
      'SchedulerActQueueRequest',
      'SchedulerActScopeBoundaryRecord',
      'SyncFlushActContinuationRecord'
    ])
  ) {
    return 'act-record-' + index + '-record-kind';
  }
  if (!includesString(task.taskKind, ['RootSchedule', 'SchedulerCallback'])) {
    return 'act-record-' + index + '-task-kind';
  }
  if (
    !includesString(task.continuationStatus, [
      'NoContinuation',
      'PendingContinuation'
    ])
  ) {
    return 'act-record-' + index + '-continuation-status';
  }
  if (typeof task.label !== 'string') {
    return 'act-record-' + index + '-label';
  }
  if (
    task.callback !== undefined &&
    task.callback !== null
  ) {
    const callbackRejectionReason =
      getRejectedExpiredActRootWorkCallbackReason(
        task.callback,
        'act-record-' + index + '-callback'
      );
    if (callbackRejectionReason !== null) {
      return callbackRejectionReason;
    }
  }
  if (
    task.publicCompatibilityClaimed !== false ||
    task.publicSchedulerTimingCompatibilityClaimed !== false ||
    task.publicReactActCompatibilityClaimed !== false
  ) {
    return 'act-record-' + index + '-public-claim';
  }
  if (task.executesQueuedWork !== false || task.executesEffects !== false) {
    return 'act-record-' + index + '-execution-claim';
  }
  return null;
}

function getRejectedExpiredActRootWorkCallbackReason(callback, role) {
  if (typeof callback !== 'function') {
    return role + '-not-function';
  }
  if (callback[privateActQueueTestCallbackBrand] !== true) {
    return role + '-not-branded-internal-test-callback';
  }
  if (callback.kind !== privateActQueueTestCallbackKind) {
    return role + '-kind';
  }
  if (callback.version !== privateActQueueTestQueueVersion) {
    return role + '-version';
  }
  if (callback.compatibilityTarget !== reactCompatibilityTarget) {
    return role + '-react-target';
  }
  if (callback.schedulerCompatibilityTarget !== schedulerCompatibilityTarget) {
    return role + '-scheduler-target';
  }
  if (typeof callback.label !== 'string') {
    return role + '-label';
  }
  if (
    callback.publicCompatibilityClaimed !== false ||
    callback.publicSchedulerTimingCompatibilityClaimed !== false ||
    callback.publicReactActCompatibilityClaimed !== false
  ) {
    return role + '-public-claim';
  }
  if (
    callback.executesQueuedWork !== false ||
    callback.executesEffects !== false
  ) {
    return role + '-execution-claim';
  }
  return null;
}

function validateExpiredActRootWorkRecords(rootWorkRecords) {
  const invalid = (rejectionReason) => ({
    rejectionReason,
    records: []
  });

  if (!Array.isArray(rootWorkRecords)) {
    return invalid('root-work-records-not-array');
  }
  if (Object.isFrozen(rootWorkRecords)) {
    return invalid('root-work-records-not-consumable');
  }
  if (rootWorkRecords.length === 0) {
    return invalid('root-work-records-empty');
  }

  for (let index = 0; index < rootWorkRecords.length; index++) {
    const rejectionReason = getRejectedExpiredActRootWorkRecordReason(
      rootWorkRecords[index],
      index
    );
    if (rejectionReason !== null) {
      return invalid(rejectionReason);
    }
  }

  return {
    rejectionReason: null,
    records: rootWorkRecords
  };
}

function getRejectedExpiredActRootWorkRecordReason(record, index) {
  if (!isObjectLike(record)) {
    return 'root-work-record-' + index + '-not-object';
  }

  const recordKind = getExpiredActRootWorkRecordKind(record);
  if (!includesString(recordKind, acceptedExpiredActRootWorkRecordKinds)) {
    return 'root-work-record-' + index + '-kind';
  }
  if (record.accepted !== true) {
    return 'root-work-record-' + index + '-not-accepted';
  }
  if (
    record.publicCompatibilityClaimed !== false ||
    record.publicSchedulerTimingCompatibilityClaimed !== false ||
    record.publicReactActCompatibilityClaimed !== false ||
    record.publicRootSchedulerCompatibilityClaimed !== false ||
    record.publicRendererCompatibilityClaimed !== false
  ) {
    return 'root-work-record-' + index + '-public-claim';
  }
  if (
    record.drainsPublicSchedulerTaskQueue !== false ||
    record.drainsPublicReactActQueue !== false ||
    record.executesQueuedWork !== false ||
    record.executesEffects !== false ||
    record.executesRendererWork !== false ||
    record.executesRendererRoots !== false
  ) {
    return 'root-work-record-' + index + '-execution-claim';
  }
  if (
    record.rendererWorkExecutionBlocked !== true ||
    record.rootWorkMetadataOnly !== true
  ) {
    return 'root-work-record-' + index + '-renderer-work-policy';
  }

  return null;
}

function getExpiredActRootWorkRecordKind(record) {
  return record.recordKind ?? record.kind ?? record.rootWorkRecordKind;
}

function cloneExpiredActRootWorkSourceDrainReport(report) {
  return freezeSchedulerOwnedExpiredActRootWorkSource({
    ...report
  });
}

function cloneExpiredActRootWorkCallbackSummary(callback) {
  if (callback === null) {
    return null;
  }

  return freezeSchedulerOwnedExpiredActRootWorkSource({
    ...callback
  });
}

function cloneExpiredActRootWorkMetadataCallbackSummary(callback) {
  return freezeSchedulerOwnedExpiredActRootWorkSource({
    ...callback
  });
}

function cloneExpiredActRootWorkRecordedContinuation(continuation) {
  if (continuation === null) {
    return null;
  }

  return freezeSchedulerOwnedExpiredActRootWorkSource({
    status: continuation.status,
    continuation: cloneExpiredActRootWorkCallbackSummary(
      continuation.continuation
    ),
    executesQueuedWork: false,
    executesEffects: false
  });
}

function cloneExpiredActRootWorkExecutedContinuation(
  continuation,
  continuationMap
) {
  if (continuation === null) {
    return null;
  }
  if (continuationMap.has(continuation)) {
    return continuationMap.get(continuation);
  }

  const clonedContinuation = freezeSchedulerOwnedExpiredActRootWorkSource({
    sourceIndex: continuation.sourceIndex,
    sourceLabel: continuation.sourceLabel,
    status: continuation.status,
    continuation: cloneExpiredActRootWorkCallbackSummary(
      continuation.continuation
    ),
    returnedContinuation: cloneExpiredActRootWorkRecordedContinuation(
      continuation.returnedContinuation
    ),
    executesQueuedWork: false,
    executesEffects: false
  });
  continuationMap.set(continuation, clonedContinuation);
  return clonedContinuation;
}

function cloneExpiredActRootWorkActQueueDrainReport(report) {
  const continuationMap = new Map();
  const drainedRecords = freezeSchedulerOwnedExpiredActRootWorkSourceArray(
    report.drainedRecords.map((record) =>
      freezeSchedulerOwnedExpiredActRootWorkSource({
        index: record.index,
        label: record.label,
        recordKind: record.recordKind,
        taskKind: record.taskKind,
        continuationStatus: record.continuationStatus,
        callbackStatus: record.callbackStatus,
        callback: cloneExpiredActRootWorkCallbackSummary(record.callback),
        returnedContinuation:
          cloneExpiredActRootWorkExecutedContinuation(
            record.returnedContinuation,
            continuationMap
          ),
        executesQueuedWork: false,
        executesEffects: false
      })
    )
  );
  const recordedContinuations =
    freezeSchedulerOwnedExpiredActRootWorkSourceArray(
      report.recordedContinuations.map((continuation) =>
        cloneExpiredActRootWorkExecutedContinuation(
          continuation,
          continuationMap
        )
      )
    );
  const executedContinuations =
    freezeSchedulerOwnedExpiredActRootWorkSourceArray(
      report.executedContinuations.map((continuation) =>
        cloneExpiredActRootWorkExecutedContinuation(
          continuation,
          continuationMap
        )
      )
    );

  return freezeSchedulerOwnedExpiredActRootWorkSource({
    ...report,
    drainedRecords,
    recordedContinuations,
    executedContinuations
  });
}

function consumeAcceptedExpiredActRootWorkRecords(rootWorkRecords) {
  const pendingBefore = rootWorkRecords.length;
  const consumedRecords = [];

  while (rootWorkRecords.length > 0) {
    const record = rootWorkRecords.shift();
    const index = consumedRecords.length;
    const rejectionReason = getRejectedExpiredActRootWorkRecordReason(
      record,
      index
    );
    if (rejectionReason !== null) {
      throw createExpiredActRootWorkMetadataError(rejectionReason);
    }
    consumedRecords.push(summarizeExpiredActRootWorkRecord(record, index));
  }

  return freezeSchedulerOwnedExpiredActRootWorkSource({
    status: 'consumed-accepted-expired-act-root-work-records',
    accepted: true,
    pendingBefore,
    consumedCount: consumedRecords.length,
    remainingCount: rootWorkRecords.length,
    consumedRecords: freezeSchedulerOwnedExpiredActRootWorkSourceArray(
      consumedRecords
    ),
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    compatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false
  });
}

function createExpiredActRootWorkFlushRouteReportForDiagnostics(
  flushHelperName,
  expiredDrainReport,
  rootWorkRecordConsumptionReport,
  actQueueDrainReport
) {
  const selectedFlushHelper = isFlushAllOrExpiredHelper(flushHelperName)
    ? flushHelperName
    : 'unstable_flushExpired';

  return freezeSchedulerOwnedExpiredActRootWorkSource({
    status: 'executed-expired-act-root-work-flush-all-or-expired-route',
    routeKind: 'flush-all-or-expired-act-root-work-diagnostics',
    availableFlushHelpers: freezeSchedulerOwnedExpiredActRootWorkSourceArray([
      'unstable_flushAll',
      'unstable_flushExpired'
    ]),
    selectedFlushHelper,
    effectivePrivateDrainHelper: 'drainExpiredMockSchedulerWork',
    sourceDrainStatus: expiredDrainReport.status,
    sourceDrainFlushedExpiredWork:
      expiredDrainReport.flushedExpiredWork === true,
    rootWorkRecordConsumptionStatus:
      rootWorkRecordConsumptionReport.status,
    rootWorkRecordsPendingBefore:
      rootWorkRecordConsumptionReport.pendingBefore,
    rootWorkRecordsPendingAfter:
      rootWorkRecordConsumptionReport.remainingCount,
    rootWorkRecordsConsumedCount:
      rootWorkRecordConsumptionReport.consumedCount,
    actQueueDrainStatus: actQueueDrainReport.status,
    actQueuePendingBefore: actQueueDrainReport.pendingBefore,
    actQueuePendingAfter: actQueueDrainReport.remainingCount,
    routesExpiredActRootWorkThroughFlushAllOrFlushExpiredDiagnostics: true,
    consumesAcceptedExpiredActRootWorkRecords: true,
    drainsExpiredMockSchedulerWork: true,
    drainsAcceptedInternalTestQueues: true,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    compatibilityClaimed: false,
    executesAcceptedInternalTestCallbacks: true,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false,
    executesScheduledCallbacks: true
  });
}

function summarizeExpiredActRootWorkMetadataForDiagnostics(
  sourceScheduler,
  expiredActRootWorkMetadata,
  validation
) {
  const isMetadataObject = isObjectLike(expiredActRootWorkMetadata);
  const callbackHandle = isMetadataObject
    ? expiredActRootWorkMetadata.callbackHandle
    : null;
  const priorityLevel =
    validation.taskRecord === null
      ? isMetadataObject
        ? expiredActRootWorkMetadata.priorityLevel
        : undefined
      : validation.taskRecord.task.priorityLevel;
  const priorityLabel =
    validation.priorityLabel ||
    getSchedulerPriorityLevelLabel(sourceScheduler, priorityLevel);
  const schedulerPriority =
    validation.schedulerPriority ||
    (priorityLabel === null
      ? null
      : getSchedulerPriorityNameForPriorityLevelLabel(priorityLabel));
  const actQueue =
    validation.actQueue ||
    (isMetadataObject ? expiredActRootWorkMetadata.actQueue : null);
  const rootWorkRecords =
    validation.rootWorkRecords.length > 0
      ? validation.rootWorkRecords
      : isMetadataObject && Array.isArray(expiredActRootWorkMetadata.rootWorkRecords)
        ? expiredActRootWorkMetadata.rootWorkRecords
        : [];

  return freezeSchedulerOwnedExpiredActRootWorkSource({
    kind: isMetadataObject ? expiredActRootWorkMetadata.kind : null,
    version: isMetadataObject ? expiredActRootWorkMetadata.version : null,
    accepted: validation.rejectionReason === null,
    rejectionReason: validation.rejectionReason,
    compatibilityTarget: isMetadataObject
      ? expiredActRootWorkMetadata.compatibilityTarget
      : null,
    reactCompatibilityTarget: isMetadataObject
      ? expiredActRootWorkMetadata.reactCompatibilityTarget
      : null,
    rootId: isMetadataObject ? expiredActRootWorkMetadata.rootId : null,
    rootLabel: isMetadataObject ? expiredActRootWorkMetadata.rootLabel : null,
    lane: isMetadataObject ? expiredActRootWorkMetadata.lane : null,
    laneLabel: isMetadataObject ? expiredActRootWorkMetadata.laneLabel : null,
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
    actQueue: summarizeExpiredActRootWorkActQueue(actQueue),
    actQueuePendingCount: validation.actQueuePendingCount,
    rootWorkRecordCount: rootWorkRecords.length,
    rootWorkRecords: freezeSchedulerOwnedExpiredActRootWorkSourceArray(
      rootWorkRecords.map(summarizeExpiredActRootWorkRecord)
    ),
    rendererWorkExecutionBlocked: isMetadataObject
      ? expiredActRootWorkMetadata.rendererWorkExecutionBlocked === true
      : false,
    rootWorkMetadataOnly: isMetadataObject
      ? expiredActRootWorkMetadata.rootWorkMetadataOnly === true
      : false,
    actQueueHandoffOnly: isMetadataObject
      ? expiredActRootWorkMetadata.actQueueHandoffOnly === true
      : false,
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false
  });
}

function summarizeExpiredActRootWorkActQueue(queue) {
  if (!isObjectLike(queue)) {
    return freezeSchedulerOwnedExpiredActRootWorkSource({
      accepted: false,
      pendingCount: 0,
      records: freezeSchedulerOwnedExpiredActRootWorkSourceArray([])
    });
  }

  const records = Array.isArray(queue.records) ? queue.records : [];
  return freezeSchedulerOwnedExpiredActRootWorkSource({
    accepted: validateExpiredActRootWorkActQueue(queue).rejectionReason === null,
    kind: queue.kind ?? null,
    version: queue.version ?? null,
    pendingCount: records.length,
    records: freezeSchedulerOwnedExpiredActRootWorkSourceArray(
      records.map(summarizeExpiredActRootWorkActTask)
    ),
    drainsAcceptedInternalTestQueues:
      queue.drainsAcceptedInternalTestQueues === true,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    executesQueuedWork: false,
    executesEffects: false
  });
}

function summarizeExpiredActRootWorkActTask(task, index) {
  if (!isObjectLike(task)) {
    return freezeSchedulerOwnedExpiredActRootWorkSource({
      index,
      status: 'not-object'
    });
  }

  return freezeSchedulerOwnedExpiredActRootWorkSource({
    index,
    label: typeof task.label === 'string' ? task.label : null,
    recordKind: task.recordKind ?? null,
    taskKind: task.taskKind ?? null,
    continuationStatus: task.continuationStatus ?? null,
    callback: cloneExpiredActRootWorkMetadataCallbackSummary(
      summarizeMockSchedulerCallback(task.callback ?? null)
    ),
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false
  });
}

function summarizeExpiredActRootWorkRecord(record, index) {
  if (!isObjectLike(record)) {
    return freezeSchedulerOwnedExpiredActRootWorkSource({
      index,
      status: 'not-object'
    });
  }

  return freezeSchedulerOwnedExpiredActRootWorkSource({
    index,
    recordKind: getExpiredActRootWorkRecordKind(record) ?? null,
    rootId: record.rootId ?? null,
    rootLabel: record.rootLabel ?? null,
    lane: record.lane ?? null,
    laneLabel: record.laneLabel ?? null,
    accepted: record.accepted === true,
    rendererWorkExecutionBlocked:
      record.rendererWorkExecutionBlocked === true,
    rootWorkMetadataOnly: record.rootWorkMetadataOnly === true,
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false
  });
}

function createExpiredActRootWorkMetadataError(rejectionReason) {
  const error = new Error(
    '[fast-react] scheduler/unstable_mock private expired act/root work ' +
      'diagnostics rejected unsupported metadata: ' +
      rejectionReason +
      '. Only accepted private act/root records for the matching expired ' +
      'mock Scheduler callback handle may be drained.'
  );
  error.name = 'FastReactSchedulerMockExpiredActRootWorkError';
  error.code = 'FAST_REACT_SCHEDULER_MOCK_EXPIRED_ACT_ROOT_WORK_REJECTED';
  error.entrypoint = 'scheduler/unstable_mock';
  error.compatibilityTarget = schedulerCompatibilityTarget;
  error.publicSchedulerTimingCompatibilityClaimed = false;
  error.publicReactActCompatibilityClaimed = false;
  error.executesRendererWork = false;
  return error;
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
