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
const privateSchedulerMockExpiredActRootWorkSourceValidatorModuleRecordKind =
  'fast-react.scheduler.mock-expired-act-root-work-source-validator-module-record';
const privateSchedulerMockExpiredActRootWorkSourceValidatorModuleRecordKey =
  Symbol.for(
    privateSchedulerMockExpiredActRootWorkSourceValidatorModuleRecordKind
  );
const privateSchedulerMockDelayedActRootWorkMetadataKind =
  'fast-react.scheduler.mock-delayed-act-root-work-metadata';
const privateSchedulerMockDelayedActRootWorkMetadataBrand = Symbol.for(
  privateSchedulerMockDelayedActRootWorkMetadataKind
);
const privateSchedulerMockDelayedActRootWorkMetadataVersion = 1;
const privateSchedulerMockDelayedActRootWorkDiagnosticsKind =
  'fast-react.scheduler.mock-delayed-act-root-work-diagnostics';
const privateSchedulerMockDelayedActRootWorkDiagnosticsBrand = Symbol.for(
  privateSchedulerMockDelayedActRootWorkDiagnosticsKind
);
const privateSchedulerMockDelayedActRootWorkDiagnosticsVersion = 1;
const privateSchedulerMockDelayedRendererRootWorkMetadataKind =
  'fast-react.scheduler.mock-delayed-renderer-root-work-metadata';
const privateSchedulerMockDelayedRendererRootWorkMetadataBrand = Symbol.for(
  privateSchedulerMockDelayedRendererRootWorkMetadataKind
);
const privateSchedulerMockDelayedRendererRootWorkMetadataVersion = 1;
const delayedActRootWorkMetadataSources = new WeakMap();
const delayedRendererRootWorkMetadataSources = new WeakMap();
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

const wrappedScheduler = createPrivateSchedulerMockDiagnosticsWrapper(scheduler);
installSchedulerMockExpiredActRootWorkSourceValidatorModuleRecord(
  wrappedScheduler
);

module.exports = wrappedScheduler;

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

function installSchedulerMockExpiredActRootWorkSourceValidatorModuleRecord(
  targetScheduler
) {
  const diagnostics =
    targetScheduler.unstable_flushExpired[
      privateActQueueFlushDiagnosticsExport
    ];
  const moduleRecord = Object.freeze({
    status: privateSchedulerMockExpiredActRootWorkSourceValidatorModuleRecordKind,
    diagnostics,
    schedulerMockExpiredActRootWorkSourceValidator
  });

  Object.defineProperty(
    module,
    privateSchedulerMockExpiredActRootWorkSourceValidatorModuleRecordKey,
    {
      configurable: false,
      enumerable: false,
      value: moduleRecord,
      writable: false
    }
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
      configurable: true,
      enumerable: true,
      value: wrappedValue,
      writable: true
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
    providesExpiredActRootWorkSourceValidatorThroughPrivateDiagnostics: true,
    schedulerMockExpiredActRootWorkSourceValidator,
    linksExpiredCallbacksToAcceptedActRootWorkRecords: true,
    routesExpiredActRootWorkThroughFlushAllOrFlushExpiredDiagnostics: true,
    consumesAcceptedExpiredActRootWorkRecords: true,
    rejectsStaleExpiredActQueues: true,
    rejectsExpiredActRootWorkPublicCompatibilityClaims: true,
    mockSchedulerDelayedActRootWorkDiagnosticsReady: true,
    recognizesDelayedActRootWorkMetadata: true,
    validatesDelayedCallbackDelayStartAndExpirationMetadata: true,
    recordsDelayedCallbackVirtualTimePromotionEvidence: true,
    advancesMockVirtualTimeToDelayedCallbackExpiration: true,
    consumesDelayedActRootWorkThroughExpiredActRootRoute: true,
    rejectsAmbiguousDelayedOrExpiredCallbackHandles: true,
    rejectsDelayedActRootWorkPublicCompatibilityClaims: true,
    producesDelayedActRootWorkMetadataFromAcceptedRootMetadata: true,
    producesDelayedActRootWorkMetadataFromAcceptedRendererRootMetadata: true,
    createsDelayedRendererRootWorkMetadataForDiagnostics: true,
    recognizesDelayedRendererRootWorkMetadata: true,
    bindsDelayedRendererRootProducerEvidence: true,
    rejectsStaleDelayedRendererRootProducerEvidence: true,
    rejectsClonedDelayedRendererRootSourceEvidence: true,
    handsOffDelayedRendererRootWorkThroughPrivateActRootRoute: true,
    rejectsUnownedDelayedActRootWorkMetadata: true,
    rejectsClonedDelayedActRootWorkEvidence: true,
    bindsProducedDelayedActRootWorkNestedEvidence: true,
    rejectsMutatedDelayedActRootWorkNestedEvidence: true,
    drainExpiredMockSchedulerWork(lanePriorityRootSchedulerMetadata) {
      if (arguments.length === 0) {
        return sourceDiagnostics.drainExpiredMockSchedulerWork();
      }
      if (
        isDelayedActRootWorkMetadataCandidate(lanePriorityRootSchedulerMetadata)
      ) {
        return drainDelayedMockSchedulerWorkWithActRootMetadataForDiagnostics(
          sourceScheduler,
          shadowState,
          sourceDiagnostics,
          lanePriorityRootSchedulerMetadata
        );
      }
      if (
        isExpiredActRootWorkMetadataCandidate(lanePriorityRootSchedulerMetadata)
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
    describeDelayedActRootWorkMetadataForDiagnostics(
      delayedActRootWorkMetadata
    ) {
      return describeDelayedActRootWorkMetadataForDiagnostics(
        sourceScheduler,
        shadowState,
        delayedActRootWorkMetadata
      );
    },
    drainDelayedMockSchedulerWorkWithActRootMetadataForDiagnostics(
      delayedActRootWorkMetadata
    ) {
      return drainDelayedMockSchedulerWorkWithActRootMetadataForDiagnostics(
        sourceScheduler,
        shadowState,
        sourceDiagnostics,
        delayedActRootWorkMetadata
      );
    },
    createDelayedActRootWorkMetadataFromAcceptedRootMetadataForDiagnostics(
      expiredActRootWorkMetadata,
      options
    ) {
      return createDelayedActRootWorkMetadataFromAcceptedRootMetadataForDiagnostics(
        sourceScheduler,
        shadowState,
        expiredActRootWorkMetadata,
        options
      );
    },
    createDelayedActRootWorkMetadataFromAcceptedRendererRootMetadataForDiagnostics(
      rendererRootMetadata,
      options
    ) {
      return createDelayedActRootWorkMetadataFromAcceptedRendererRootMetadataForDiagnostics(
        sourceScheduler,
        shadowState,
        rendererRootMetadata,
        options
      );
    },
    createDelayedRendererRootWorkMetadataForDiagnostics(options) {
      return createDelayedRendererRootWorkMetadataForDiagnostics(
        sourceScheduler,
        shadowState,
        options
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
        isDelayedActRootWorkMetadataCandidate(privateMetadata)
      ) {
        return drainDelayedMockSchedulerWorkWithActRootMetadataForDiagnostics(
          sourceScheduler,
          shadowState,
          sourceScheduler.unstable_flushAllWithoutAsserting[
            privateActQueueFlushDiagnosticsExport
          ],
          privateMetadata,
          key
        );
      }
      if (
        arguments.length > 0 &&
        isExpiredActRootWorkMetadataCandidate(privateMetadata)
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

function hasPublicPackageOrFlushHelperCompatibilityClaim(value) {
  return (
    isObjectLike(value) &&
    (value.packageCompatibilityClaimed === true ||
      value.publicPackageCompatibilityClaimed === true ||
      value.publicSchedulerFlushHelperCompatibilityClaimed === true ||
      value.schedulerTimingAdmissionClaimed === true ||
      value.schedulerDelayedActRootAdmissionClaimed === true ||
      value.schedulerDelayedRendererRootAdmissionClaimed === true)
  );
}

function hasPublicSchedulerFlushExecutionClaim(value) {
  return (
    isObjectLike(value) &&
    (value.invokesPublicSchedulerFlushHelper === true ||
      value.publicSchedulerFlushBehaviorExecuted === true ||
      value.publicSchedulerFlushExecutionAvailable === true ||
      value.routesAcceptedMockSchedulerFlushHelperMetadata === true)
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
    !hasOwnLockedDataProperty(
      lanePriorityRootSchedulerMetadata,
      privateSchedulerMockExpiredLaneFlushMetadataBrand,
      true
    )
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
      false ||
    hasPublicPackageOrFlushHelperCompatibilityClaim(
      lanePriorityRootSchedulerMetadata
    )
  ) {
    return invalid('metadata-public-claim');
  }
  if (
    lanePriorityRootSchedulerMetadata.drainsPublicSchedulerTaskQueue !== false ||
    lanePriorityRootSchedulerMetadata.drainsPublicReactActQueue !== false ||
    lanePriorityRootSchedulerMetadata.executesQueuedWork !== false ||
    lanePriorityRootSchedulerMetadata.executesEffects !== false ||
    lanePriorityRootSchedulerMetadata.executesRendererWork !== false ||
    hasPublicSchedulerFlushExecutionClaim(lanePriorityRootSchedulerMetadata)
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
  flushHelperName = 'unstable_flushExpired',
  createContinuationRejectionError = createExpiredActRootWorkMetadataError,
  validateNestedEvidenceBeforeConsumption = null
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

  installGuardedExpiredActRootWorkCallback(
    validation.taskRecord,
    createContinuationRejectionError
  );
  const expiredDrainReport = cloneExpiredActRootWorkSourceDrainReport(
    sourceDiagnostics.drainExpiredMockSchedulerWork()
  );
  if (typeof validateNestedEvidenceBeforeConsumption === 'function') {
    const nestedEvidenceRejectionReason =
      validateNestedEvidenceBeforeConsumption();
    if (nestedEvidenceRejectionReason !== null) {
      throw createContinuationRejectionError(nestedEvidenceRejectionReason);
    }
  }
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

function describeDelayedActRootWorkMetadataForDiagnostics(
  sourceScheduler,
  shadowState,
  delayedActRootWorkMetadata
) {
  const now = sourceScheduler.unstable_now();
  const validation = validateDelayedActRootWorkMetadata(
    sourceScheduler,
    shadowState,
    delayedActRootWorkMetadata,
    now
  );
  const metadataSummary = summarizeDelayedActRootWorkMetadataForDiagnostics(
    sourceScheduler,
    delayedActRootWorkMetadata,
    validation,
    now
  );

  return Object.freeze({
    status:
      validation.rejectionReason === null
        ? 'accepted-delayed-act-root-work-metadata'
        : 'rejected-delayed-act-root-work-metadata',
    accepted: validation.rejectionReason === null,
    rejectionReason: validation.rejectionReason,
    compatibilityTarget: schedulerCompatibilityTarget,
    reactCompatibilityTarget,
    currentVirtualTime: now,
    promotionTargetVirtualTime: validation.expirationTime,
    advanceTimeBy:
      validation.expirationTime === null
        ? null
        : validation.expirationTime - now,
    metadata: metadataSummary,
    recognizesDelayedActRootWorkMetadata: true,
    validatesDelayedCallbackDelayStartAndExpirationMetadata: true,
    recordsDelayedCallbackVirtualTimePromotionEvidence: true,
    advancesMockVirtualTimeToDelayedCallbackExpiration: false,
    consumesDelayedActRootWorkThroughExpiredActRootRoute: true,
    rejectsAmbiguousDelayedOrExpiredCallbackHandles: true,
    rejectsDelayedActRootWorkPublicCompatibilityClaims: true,
    producesDelayedActRootWorkMetadataFromAcceptedRootMetadata: true,
    producesDelayedActRootWorkMetadataFromAcceptedRendererRootMetadata: true,
    createsDelayedRendererRootWorkMetadataForDiagnostics: true,
    recognizesDelayedRendererRootWorkMetadata: true,
    bindsDelayedRendererRootProducerEvidence: true,
    rejectsStaleDelayedRendererRootProducerEvidence: true,
    rejectsClonedDelayedRendererRootSourceEvidence: true,
    handsOffDelayedRendererRootWorkThroughPrivateActRootRoute: true,
    rejectsUnownedDelayedActRootWorkMetadata: true,
    rejectsClonedDelayedActRootWorkEvidence: true,
    bindsProducedDelayedActRootWorkNestedEvidence: true,
    rejectsMutatedDelayedActRootWorkNestedEvidence: true,
    drainsExpiredMockSchedulerWork: false,
    drainsAcceptedInternalTestQueues: false,
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

function drainDelayedMockSchedulerWorkWithActRootMetadataForDiagnostics(
  sourceScheduler,
  shadowState,
  sourceDiagnostics,
  delayedActRootWorkMetadata,
  flushHelperName = 'unstable_flushExpired'
) {
  const before = getMockSchedulerYieldPaintSnapshot(
    sourceScheduler,
    sourceDiagnostics
  );
  const validation = validateDelayedActRootWorkMetadata(
    sourceScheduler,
    shadowState,
    delayedActRootWorkMetadata,
    before.now
  );
  if (validation.rejectionReason !== null) {
    throw createDelayedActRootWorkMetadataError(validation.rejectionReason);
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
  const metadataSummary = summarizeDelayedActRootWorkMetadataForDiagnostics(
    sourceScheduler,
    delayedActRootWorkMetadata,
    validation,
    before.now
  );
  const advanceTimeBy = validation.expirationTime - before.now;
  const advanceTimeReturnValue = sourceScheduler.unstable_advanceTime(
    advanceTimeBy
  );
  const afterPromotion = getMockSchedulerYieldPaintSnapshot(
    sourceScheduler,
    sourceDiagnostics
  );
  const yieldLogAfterPromotion = getMockSchedulerYieldLogSnapshot(
    shadowState,
    afterPromotion
  );
  const taskQueueAfterPromotion = getMockSchedulerTaskQueueSnapshot(
    shadowState,
    afterPromotion.now
  );
  const matchedTaskAfterPromotion = summarizeMockSchedulerTask(
    validation.taskRecord,
    afterPromotion.now
  );
  const promotionEvidence =
    createDelayedActRootWorkPromotionEvidenceForDiagnostics(
      validation,
      before,
      afterPromotion,
      matchedTaskBefore,
      matchedTaskAfterPromotion,
      advanceTimeBy,
      advanceTimeReturnValue
    );

  if (promotionEvidence.promotedDelayedCallbackToExpiredWork !== true) {
    throw createDelayedActRootWorkMetadataError(
      'virtual-time-promotion-failed'
    );
  }

  const promotedValidation = validateExpiredActRootWorkMetadata(
    sourceScheduler,
    shadowState,
    validation.expiredActRootWorkMetadata,
    afterPromotion.now
  );
  if (promotedValidation.rejectionReason !== null) {
    throw createDelayedActRootWorkMetadataError(
      'expired-act-root-work-' + promotedValidation.rejectionReason
    );
  }

  const expiredActRootWorkDrainReport =
    drainExpiredMockSchedulerWorkWithActRootMetadataForDiagnostics(
      sourceScheduler,
      shadowState,
      sourceDiagnostics,
      validation.expiredActRootWorkMetadata,
      flushHelperName,
      createDelayedActRootWorkMetadataError,
      () => {
        const source = delayedActRootWorkMetadataSources.get(
          delayedActRootWorkMetadata
        );
        return getRejectedDelayedActRootWorkMetadataProducerSourceReason(
          sourceScheduler,
          shadowState,
          delayedActRootWorkMetadata,
          validation.taskRecord,
          validation.expiredActRootWorkMetadata,
          validation.scheduledVirtualTime,
          validation.delayMs,
          validation.startTime,
          validation.expirationTime,
          validation.priorityTimeoutMs,
          false
        );
      }
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
    kind: privateSchedulerMockDelayedActRootWorkDiagnosticsKind,
    version: privateSchedulerMockDelayedActRootWorkDiagnosticsVersion,
    status:
      'drained-delayed-mock-scheduler-work-with-act-root-metadata-for-diagnostics',
    accepted: true,
    compatibilityTarget: schedulerCompatibilityTarget,
    reactCompatibilityTarget,
    schedulerDiagnosticStatus: 'private-scheduler-act-queue-flush-diagnostics',
    delayedActRootWorkMetadata: metadataSummary,
    delayedRendererRootMetadata: metadataSummary.rendererRootMetadata,
    producedByPrivateDelayedRendererRootProducer:
      metadataSummary.producedByPrivateDelayedRendererRootProducer,
    expiredActRootWorkDrainReport,
    expiredActRootWorkDrainStatus: expiredActRootWorkDrainReport.status,
    expiredActRootWorkRouteSelectedFlushHelper:
      expiredActRootWorkDrainReport.flushAllOrFlushExpiredRoute
        .selectedFlushHelper,
    delayedCallbackPriorityLevel: metadataSummary.priorityLevel,
    delayedCallbackPriorityLabel: metadataSummary.priorityLabel,
    delayedCallbackSchedulerPriority: metadataSummary.schedulerPriority,
    delayedCallbackScheduledVirtualTime:
      metadataSummary.scheduledVirtualTime,
    delayedCallbackDelayMs: metadataSummary.delayMs,
    delayedCallbackStartTime: metadataSummary.startTime,
    delayedCallbackExpirationTime: metadataSummary.expirationTime,
    delayedCallbackPriorityTimeoutMs: metadataSummary.priorityTimeoutMs,
    delayedCallbackVirtualTimeBefore: before.now,
    delayedCallbackVirtualTimeAfterPromotion: afterPromotion.now,
    delayedCallbackAdvanceTimeBy: advanceTimeBy,
    delayedCallbackPromotionEvidence: promotionEvidence,
    actQueuePendingBefore:
      expiredActRootWorkDrainReport.actQueuePendingBefore,
    actQueuePendingAfter: expiredActRootWorkDrainReport.actQueuePendingAfter,
    rootWorkRecordsPendingBefore:
      expiredActRootWorkDrainReport.rootWorkRecordsPendingBefore,
    rootWorkRecordsPendingAfter:
      expiredActRootWorkDrainReport.rootWorkRecordsPendingAfter,
    rootWorkRecordsConsumedCount:
      expiredActRootWorkDrainReport.rootWorkRecordsConsumedCount,
    yieldLogBefore,
    yieldLogAfterPromotion,
    yieldLogAfter,
    nowBefore: before.now,
    nowAfterPromotion: afterPromotion.now,
    nowAfter: after.now,
    pendingBefore: before.pendingWork,
    pendingAfterPromotion: afterPromotion.pendingWork,
    pendingAfter: after.pendingWork,
    matchedTaskBefore,
    matchedTaskAfterPromotion,
    matchedTaskAfter,
    taskQueueBefore,
    taskQueueAfterPromotion,
    taskQueueAfter,
    taskQueueCountBefore: taskQueueBefore.length,
    taskQueueCountAfterPromotion: taskQueueAfterPromotion.length,
    taskQueueCountAfter: taskQueueAfter.length,
    sourceDrainReport: expiredActRootWorkDrainReport.sourceDrainReport,
    sourceDrainStatus: expiredActRootWorkDrainReport.sourceDrainStatus,
    sourceDrainFlushedExpiredWork:
      expiredActRootWorkDrainReport.sourceDrainFlushedExpiredWork === true,
    sourceDrainHasMoreWorkAfterDrain:
      expiredActRootWorkDrainReport.sourceDrainHasMoreWorkAfterDrain,
    recognizesDelayedActRootWorkMetadata: true,
    validatesDelayedCallbackDelayStartAndExpirationMetadata: true,
    recordsDelayedCallbackVirtualTimePromotionEvidence: true,
    advancesMockVirtualTimeToDelayedCallbackExpiration: true,
    consumesDelayedActRootWorkThroughExpiredActRootRoute: true,
    rejectsAmbiguousDelayedOrExpiredCallbackHandles: true,
    rejectsDelayedActRootWorkPublicCompatibilityClaims: true,
    producesDelayedActRootWorkMetadataFromAcceptedRootMetadata: true,
    producesDelayedActRootWorkMetadataFromAcceptedRendererRootMetadata: true,
    createsDelayedRendererRootWorkMetadataForDiagnostics: true,
    recognizesDelayedRendererRootWorkMetadata: true,
    bindsDelayedRendererRootProducerEvidence: true,
    rejectsStaleDelayedRendererRootProducerEvidence: true,
    rejectsClonedDelayedRendererRootSourceEvidence: true,
    handsOffDelayedRendererRootWorkThroughPrivateActRootRoute: true,
    rejectsUnownedDelayedActRootWorkMetadata: true,
    rejectsClonedDelayedActRootWorkEvidence: true,
    bindsProducedDelayedActRootWorkNestedEvidence: true,
    rejectsMutatedDelayedActRootWorkNestedEvidence: true,
    recognizesExpiredActRootWorkMetadata: true,
    linksExpiredCallbacksToAcceptedActRootWorkRecords: true,
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
  };

  Object.defineProperty(
    metadata,
    privateSchedulerMockDelayedActRootWorkDiagnosticsBrand,
    {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false
    }
  );

  return freezeSchedulerOwnedExpiredActRootWorkSource(metadata);
}

function createDelayedActRootWorkMetadataFromAcceptedRootMetadataForDiagnostics(
  sourceScheduler,
  shadowState,
  expiredActRootWorkMetadata,
  options = {}
) {
  return createDelayedActRootWorkMetadataFromAcceptedRootMetadataWithProducerForDiagnostics(
    sourceScheduler,
    shadowState,
    expiredActRootWorkMetadata,
    options,
    {
      producerKind: 'accepted-root-metadata',
      producerStatus:
        'produced-private-delayed-act-root-work-metadata-from-accepted-root-metadata'
    }
  );
}

function createDelayedActRootWorkMetadataFromAcceptedRendererRootMetadataForDiagnostics(
  sourceScheduler,
  shadowState,
  rendererRootMetadata,
  options = {}
) {
  const snapshotTime = sourceScheduler.unstable_now();
  const rendererRootValidation = validateDelayedRendererRootWorkMetadata(
    sourceScheduler,
    shadowState,
    rendererRootMetadata,
    snapshotTime
  );
  if (rendererRootValidation.rejectionReason !== null) {
    throw createDelayedActRootWorkMetadataError(
      rendererRootValidation.rejectionReason
    );
  }
  const optionsRejectionReason =
    getRejectedDelayedRendererRootProducerOptionsReason(
      options,
      rendererRootValidation
    );
  if (optionsRejectionReason !== null) {
    throw createDelayedActRootWorkMetadataError(optionsRejectionReason);
  }
  const rendererRootSource = delayedRendererRootWorkMetadataSources.get(
    rendererRootMetadata
  );

  const expiredActRootWorkMetadata =
    createExpiredActRootWorkMetadataFromDelayedRendererRootMetadata(
      rendererRootMetadata,
      rendererRootValidation
    );
  const delayedProducerOptions = {
    scheduledVirtualTime: rendererRootValidation.scheduledVirtualTime,
    delayMs: rendererRootValidation.delayMs,
    startTime: rendererRootValidation.startTime,
    expirationTime: rendererRootValidation.expirationTime,
    priorityTimeoutMs: rendererRootValidation.priorityTimeoutMs,
    ...(isObjectLike(options) ? options : {})
  };
  const delayedActRootWorkMetadata =
    createDelayedActRootWorkMetadataFromAcceptedRootMetadataWithProducerForDiagnostics(
      sourceScheduler,
      shadowState,
      expiredActRootWorkMetadata,
      delayedProducerOptions,
      {
        producerKind: 'accepted-renderer-root-metadata',
        producerStatus:
          'produced-private-delayed-act-root-work-metadata-from-accepted-renderer-root-metadata',
        extraMetadata: {
          rendererRootMetadataKind: rendererRootMetadata.kind,
          rendererRootMetadataVersion: rendererRootMetadata.version,
          rendererRootMetadataStatus: rendererRootMetadata.status,
          rendererRootProducerStatus: rendererRootMetadata.producerStatus,
          rendererRootRequestId: rendererRootMetadata.rootRequestId ?? null,
          rendererRootRequestSequence:
            rendererRootMetadata.rootRequestSequence ?? null,
          rendererRootOperation: rendererRootMetadata.rootOperation ?? null
        },
        rendererRootSource: {
          rendererRootMetadata,
          rendererRootEvidence: rendererRootSource.rendererRootEvidence
        }
      }
    );

  return delayedActRootWorkMetadata;
}

function createDelayedActRootWorkMetadataFromAcceptedRootMetadataWithProducerForDiagnostics(
  sourceScheduler,
  shadowState,
  expiredActRootWorkMetadata,
  options,
  producerConfig
) {
  const snapshotTime = sourceScheduler.unstable_now();
  const validation = validateDelayedActRootWorkProducerMetadata(
    sourceScheduler,
    shadowState,
    expiredActRootWorkMetadata,
    options,
    snapshotTime
  );
  if (validation.rejectionReason !== null) {
    throw createDelayedActRootWorkMetadataError(validation.rejectionReason);
  }

  const metadata = {
    kind: privateSchedulerMockDelayedActRootWorkMetadataKind,
    version: privateSchedulerMockDelayedActRootWorkMetadataVersion,
    compatibilityTarget: schedulerCompatibilityTarget,
    reactCompatibilityTarget,
    rootId: expiredActRootWorkMetadata.rootId,
    rootLabel: expiredActRootWorkMetadata.rootLabel,
    lane: expiredActRootWorkMetadata.lane,
    laneLabel: expiredActRootWorkMetadata.laneLabel,
    priorityLevel: validation.taskRecord.task.priorityLevel,
    schedulerPriority: validation.schedulerPriority,
    callbackHandle: expiredActRootWorkMetadata.callbackHandle,
    scheduledVirtualTime: validation.scheduledVirtualTime,
    delayMs: validation.delayMs,
    startTime: validation.startTime,
    expirationTime: validation.expirationTime,
    priorityTimeoutMs: validation.priorityTimeoutMs,
    expiredActRootWorkMetadata,
    producerKind: producerConfig.producerKind,
    producerStatus: producerConfig.producerStatus,
    producerSnapshotVirtualTime: snapshotTime,
    producerActQueueRecordCount:
      validation.expiredActRootWorkValidation.actQueuePendingCount,
    producerRootWorkRecordCount:
      validation.expiredActRootWorkValidation.rootWorkRecords.length,
    ...(producerConfig.extraMetadata ?? {}),
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
    executesRendererRoots: false,
    rendererWorkExecutionBlocked: true,
    rootWorkMetadataOnly: true,
    actQueueHandoffOnly: true,
    delayedCallbackPromotionOnly: true
  };

  Object.defineProperty(
    metadata,
    privateSchedulerMockDelayedActRootWorkMetadataBrand,
    {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false
    }
  );

  delayedActRootWorkMetadataSources.set(metadata, {
    sourceScheduler,
    shadowState,
    taskRecord: validation.taskRecord,
    callbackHandle: expiredActRootWorkMetadata.callbackHandle,
    expiredActRootWorkMetadata,
    actQueue: expiredActRootWorkMetadata.actQueue,
    rootWorkRecords: expiredActRootWorkMetadata.rootWorkRecords,
    scheduleOrder: validation.taskRecord.scheduleOrder,
    producedAtVirtualTime: snapshotTime,
    scheduledVirtualTime: validation.scheduledVirtualTime,
    delayMs: validation.delayMs,
    startTime: validation.startTime,
    expirationTime: validation.expirationTime,
    priorityTimeoutMs: validation.priorityTimeoutMs,
    producerKind: producerConfig.producerKind,
    nestedEvidence: createDelayedActRootWorkNestedSourceEvidence(
      validation.expiredActRootWorkValidation
    ),
    ...(producerConfig.rendererRootSource ?? {})
  });

  return Object.freeze(metadata);
}

function createDelayedRendererRootWorkMetadataForDiagnostics(
  sourceScheduler,
  shadowState,
  options = {}
) {
  const normalizedOptions = isObjectLike(options) ? options : {};
  const callbackHandle = normalizedOptions.callbackHandle;
  const scheduledVirtualTime =
    normalizedOptions.scheduledVirtualTime ?? sourceScheduler.unstable_now();
  const startTime = isObjectLike(callbackHandle)
    ? callbackHandle.startTime
    : normalizedOptions.startTime;
  const expirationTime = isObjectLike(callbackHandle)
    ? callbackHandle.expirationTime
    : normalizedOptions.expirationTime;
  const metadata = {
    kind: privateSchedulerMockDelayedRendererRootWorkMetadataKind,
    version: privateSchedulerMockDelayedRendererRootWorkMetadataVersion,
    status:
      'accepted-private-delayed-renderer-root-work-metadata-for-diagnostics',
    compatibilityTarget: schedulerCompatibilityTarget,
    reactCompatibilityTarget,
    rootId: normalizedOptions.rootId ?? 'mock-renderer-root',
    rootLabel:
      normalizedOptions.rootLabel ?? 'mock-delayed-renderer-root',
    lane: normalizedOptions.lane ?? 'SyncLane',
    laneLabel: normalizedOptions.laneLabel ?? 'SyncLane',
    priorityLevel: isObjectLike(callbackHandle)
      ? callbackHandle.priorityLevel
      : normalizedOptions.priorityLevel,
    schedulerPriority: normalizedOptions.schedulerPriority,
    callbackHandle,
    scheduledVirtualTime,
    delayMs:
      normalizedOptions.delayMs ??
      (typeof startTime === 'number'
        ? startTime - scheduledVirtualTime
        : undefined),
    startTime,
    expirationTime,
    priorityTimeoutMs:
      normalizedOptions.priorityTimeoutMs ??
      (typeof startTime === 'number' && typeof expirationTime === 'number'
        ? expirationTime - startTime
        : undefined),
    actQueue: normalizedOptions.actQueue,
    expectedActQueuePendingCount:
      normalizedOptions.expectedActQueuePendingCount ??
      (Array.isArray(normalizedOptions.actQueue?.records)
        ? normalizedOptions.actQueue.records.length
        : undefined),
    rootWorkRecords: normalizedOptions.rootWorkRecords,
    rootRequestId: normalizedOptions.rootRequestId ?? null,
    rootRequestSequence: normalizedOptions.rootRequestSequence ?? null,
    rootOperation: normalizedOptions.rootOperation ?? null,
    producerStatus:
      'produced-private-delayed-renderer-root-work-metadata-for-private-act-root-handoff',
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
    executesRendererRoots: false,
    rendererWorkExecutionBlocked: true,
    rootWorkMetadataOnly: true,
    actQueueHandoffOnly: true,
    delayedCallbackPromotionOnly: true,
    privateActRootHandoffOnly: true,
    ...normalizedOptions
  };

  Object.defineProperty(
    metadata,
    privateSchedulerMockDelayedRendererRootWorkMetadataBrand,
    {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false
    }
  );

  const validation = validateDelayedRendererRootWorkMetadata(
    sourceScheduler,
    shadowState,
    metadata,
    sourceScheduler.unstable_now(),
    false
  );
  if (validation.rejectionReason !== null) {
    throw createDelayedActRootWorkMetadataError(validation.rejectionReason);
  }

  delayedRendererRootWorkMetadataSources.set(metadata, {
    sourceScheduler,
    shadowState,
    taskRecord: validation.taskRecord,
    scheduleOrder: validation.taskRecord.scheduleOrder,
    rendererRootMetadata: metadata,
    rendererRootEvidence: createDelayedRendererRootWorkSourceEvidence(
      metadata,
      validation
    )
  });

  return Object.freeze(metadata);
}

function getRejectedDelayedRendererRootProducerOptionsReason(
  options,
  rendererRootValidation
) {
  if (!isObjectLike(options)) {
    return null;
  }
  if (
    options.scheduledVirtualTime !== undefined &&
    options.scheduledVirtualTime !== rendererRootValidation.scheduledVirtualTime
  ) {
    return 'renderer-root-producer-scheduled-virtual-time-mismatch';
  }
  if (
    options.delayMs !== undefined &&
    options.delayMs !== rendererRootValidation.delayMs
  ) {
    return 'renderer-root-producer-delay-metadata-mismatch';
  }
  if (
    options.startTime !== undefined &&
    options.startTime !== rendererRootValidation.startTime
  ) {
    return 'renderer-root-producer-start-time-mismatch';
  }
  if (
    options.expirationTime !== undefined &&
    options.expirationTime !== rendererRootValidation.expirationTime
  ) {
    return 'renderer-root-producer-expiration-time-mismatch';
  }
  if (
    options.priorityTimeoutMs !== undefined &&
    options.priorityTimeoutMs !== rendererRootValidation.priorityTimeoutMs
  ) {
    return 'renderer-root-producer-priority-timeout-mismatch';
  }
  return null;
}

function validateDelayedRendererRootWorkMetadata(
  sourceScheduler,
  shadowState,
  rendererRootMetadata,
  snapshotTime,
  requireSourceProof = true
) {
  const invalid = (rejectionReason) => ({
    rejectionReason,
    taskRecord: null,
    priorityLabel: null,
    schedulerPriority: null,
    scheduledVirtualTime: null,
    delayMs: null,
    startTime: null,
    expirationTime: null,
    priorityTimeoutMs: null,
    actQueueValidation: null,
    rootWorkValidation: null
  });

  if (!isObjectLike(rendererRootMetadata)) {
    return invalid('renderer-root-metadata-not-object');
  }
  if (
    !hasOwnLockedDataProperty(
      rendererRootMetadata,
      privateSchedulerMockDelayedRendererRootWorkMetadataBrand,
      true
    )
  ) {
    return invalid('renderer-root-metadata-missing-internal-brand');
  }
  if (
    rendererRootMetadata.kind !==
    privateSchedulerMockDelayedRendererRootWorkMetadataKind
  ) {
    return invalid('renderer-root-metadata-kind');
  }
  if (
    rendererRootMetadata.version !==
    privateSchedulerMockDelayedRendererRootWorkMetadataVersion
  ) {
    return invalid('renderer-root-metadata-version');
  }
  if (rendererRootMetadata.compatibilityTarget !== schedulerCompatibilityTarget) {
    return invalid('renderer-root-metadata-scheduler-target');
  }
  if (rendererRootMetadata.reactCompatibilityTarget !== reactCompatibilityTarget) {
    return invalid('renderer-root-metadata-react-target');
  }
  if (
    rendererRootMetadata.status !==
    'accepted-private-delayed-renderer-root-work-metadata-for-diagnostics'
  ) {
    return invalid('renderer-root-metadata-status');
  }
  if (
    rendererRootMetadata.producerStatus !==
    'produced-private-delayed-renderer-root-work-metadata-for-private-act-root-handoff'
  ) {
    return invalid('renderer-root-metadata-producer-status');
  }
  if (hasDelayedActRootWorkProducerPublicClaim(rendererRootMetadata)) {
    return invalid('renderer-root-metadata-public-claim');
  }
  if (hasDelayedActRootWorkProducerExecutionClaim(rendererRootMetadata)) {
    return invalid('renderer-root-metadata-execution-claim');
  }
  if (
    rendererRootMetadata.rendererWorkExecutionBlocked !== true ||
    rendererRootMetadata.rootWorkMetadataOnly !== true ||
    rendererRootMetadata.actQueueHandoffOnly !== true ||
    rendererRootMetadata.delayedCallbackPromotionOnly !== true ||
    rendererRootMetadata.privateActRootHandoffOnly !== true
  ) {
    return invalid('renderer-root-metadata-policy');
  }

  const callbackHandle = rendererRootMetadata.callbackHandle;
  const taskRecord = findShadowTaskRecord(shadowState, callbackHandle);
  if (taskRecord === null) {
    return invalid('renderer-root-producer-stale-callback-handle');
  }
  if (taskRecord.cancelled === true || taskRecord.task.callback === null) {
    return invalid('renderer-root-producer-stale-callback-handle');
  }
  if (typeof taskRecord.task.callback !== 'function') {
    return invalid('renderer-root-producer-callback-handle-not-function');
  }
  const callbackRejectionReason =
    getRejectedExpiredActRootWorkCallbackReason(
      taskRecord.task.callback,
      'renderer-root-producer-callback-handle'
    );
  if (callbackRejectionReason !== null) {
    return invalid(callbackRejectionReason);
  }

  const priorityLabel = getSchedulerPriorityLevelLabel(
    sourceScheduler,
    taskRecord.task.priorityLevel
  );
  if (priorityLabel === null) {
    return invalid('renderer-root-producer-unsupported-callback-priority-level');
  }
  const schedulerPriority =
    getSchedulerPriorityNameForPriorityLevelLabel(priorityLabel);
  if (
    rendererRootMetadata.priorityLevel !== undefined &&
    rendererRootMetadata.priorityLevel !== taskRecord.task.priorityLevel
  ) {
    return invalid('renderer-root-producer-callback-priority-mismatch');
  }
  if (
    rendererRootMetadata.schedulerPriority !== undefined &&
    rendererRootMetadata.schedulerPriority !== schedulerPriority
  ) {
    return invalid('renderer-root-producer-scheduler-priority-mismatch');
  }

  const scheduledVirtualTime = rendererRootMetadata.scheduledVirtualTime;
  const delayMs = rendererRootMetadata.delayMs;
  const startTime = taskRecord.task.startTime;
  const expirationTime = taskRecord.task.expirationTime;
  const priorityTimeoutMs = expirationTime - startTime;
  if (
    typeof scheduledVirtualTime !== 'number' ||
    !Number.isFinite(scheduledVirtualTime) ||
    scheduledVirtualTime < 0
  ) {
    return invalid('renderer-root-producer-scheduled-virtual-time-metadata');
  }
  if (typeof delayMs !== 'number' || !Number.isFinite(delayMs) || delayMs <= 0) {
    return invalid('renderer-root-producer-delay-metadata');
  }
  if (startTime - scheduledVirtualTime !== delayMs) {
    return invalid('renderer-root-producer-delay-metadata-mismatch');
  }
  if (rendererRootMetadata.startTime !== startTime) {
    return invalid('renderer-root-producer-start-time-mismatch');
  }
  if (rendererRootMetadata.expirationTime !== expirationTime) {
    return invalid('renderer-root-producer-expiration-time-mismatch');
  }
  if (
    rendererRootMetadata.priorityTimeoutMs !== undefined &&
    rendererRootMetadata.priorityTimeoutMs !== priorityTimeoutMs
  ) {
    return invalid('renderer-root-producer-priority-timeout-mismatch');
  }
  if (
    startTime <= snapshotTime ||
    expirationTime <= snapshotTime ||
    taskRecord.task.sortIndex !== startTime
  ) {
    return invalid('renderer-root-producer-callback-handle-not-delayed-pending');
  }

  const actQueueValidation = validateExpiredActRootWorkActQueue(
    rendererRootMetadata.actQueue
  );
  if (actQueueValidation.rejectionReason !== null) {
    return invalid(
      'renderer-root-producer-' + actQueueValidation.rejectionReason
    );
  }
  if (
    rendererRootMetadata.expectedActQueuePendingCount !==
    actQueueValidation.pendingCount
  ) {
    return invalid(
      'renderer-root-producer-expected-act-queue-pending-count-mismatch'
    );
  }

  const rootWorkValidation = validateExpiredActRootWorkRecords(
    rendererRootMetadata.rootWorkRecords
  );
  if (rootWorkValidation.rejectionReason !== null) {
    return invalid(
      'renderer-root-producer-' + rootWorkValidation.rejectionReason
    );
  }

  if (requireSourceProof === true) {
    const source = delayedRendererRootWorkMetadataSources.get(
      rendererRootMetadata
    );
    if (!isObjectLike(source)) {
      return invalid('renderer-root-metadata-source-proof');
    }
    if (source.sourceScheduler !== sourceScheduler) {
      return invalid('renderer-root-metadata-source-scheduler-mismatch');
    }
    if (source.shadowState !== shadowState) {
      return invalid('renderer-root-metadata-source-shadow-state-mismatch');
    }
    const sourceEvidenceRejectionReason =
      getRejectedDelayedRendererRootMetadataSourceReason(
        rendererRootMetadata,
        source,
        taskRecord
      );
    if (sourceEvidenceRejectionReason !== null) {
      return invalid(sourceEvidenceRejectionReason);
    }
  }

  return {
    rejectionReason: null,
    taskRecord,
    priorityLabel,
    schedulerPriority,
    scheduledVirtualTime,
    delayMs,
    startTime,
    expirationTime,
    priorityTimeoutMs,
    actQueueValidation,
    rootWorkValidation
  };
}

function createExpiredActRootWorkMetadataFromDelayedRendererRootMetadata(
  rendererRootMetadata,
  validation
) {
  const metadata = {
    kind: privateSchedulerMockExpiredActRootWorkMetadataKind,
    version: privateSchedulerMockExpiredActRootWorkMetadataVersion,
    compatibilityTarget: schedulerCompatibilityTarget,
    reactCompatibilityTarget,
    rootId: rendererRootMetadata.rootId,
    rootLabel: rendererRootMetadata.rootLabel,
    lane: rendererRootMetadata.lane,
    laneLabel: rendererRootMetadata.laneLabel,
    priorityLevel: validation.taskRecord.task.priorityLevel,
    schedulerPriority: validation.schedulerPriority,
    callbackHandle: rendererRootMetadata.callbackHandle,
    actQueue: rendererRootMetadata.actQueue,
    expectedActQueuePendingCount:
      rendererRootMetadata.expectedActQueuePendingCount,
    rootWorkRecords: rendererRootMetadata.rootWorkRecords,
    rendererRootMetadataKind: rendererRootMetadata.kind,
    rendererRootProducerStatus: rendererRootMetadata.producerStatus,
    rendererRootRequestId: rendererRootMetadata.rootRequestId ?? null,
    rendererRootRequestSequence:
      rendererRootMetadata.rootRequestSequence ?? null,
    rendererRootOperation: rendererRootMetadata.rootOperation ?? null,
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
    executesRendererRoots: false,
    rendererWorkExecutionBlocked: true,
    rootWorkMetadataOnly: true,
    actQueueHandoffOnly: true
  };

  Object.defineProperty(
    metadata,
    privateSchedulerMockExpiredActRootWorkMetadataBrand,
    {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false
    }
  );

  return Object.freeze(metadata);
}

function createDelayedRendererRootWorkSourceEvidence(
  rendererRootMetadata,
  validation
) {
  const actQueueRecords = rendererRootMetadata.actQueue.records.slice();
  const rootWorkRecordEntries = validation.rootWorkValidation.records.slice();

  return Object.freeze({
    rendererRootMetadata,
    topLevelSignature:
      createDelayedRendererRootWorkMetadataSignature(rendererRootMetadata),
    callbackHandle: rendererRootMetadata.callbackHandle,
    scheduleOrder: validation.taskRecord.scheduleOrder,
    scheduledCallback: validation.taskRecord.task.callback,
    scheduledCallbackSignature:
      createDelayedActRootWorkCallbackSignatureString(
        validation.taskRecord.task.callback
      ),
    actQueue: rendererRootMetadata.actQueue,
    actQueueRecordsArray: rendererRootMetadata.actQueue.records,
    actQueueRecords: Object.freeze(actQueueRecords),
    actQueueRecordCallbacks: Object.freeze(
      actQueueRecords.map(getDelayedActRootWorkActTaskCallbackIdentity)
    ),
    actQueueRecordSignatures: Object.freeze(
      actQueueRecords.map(createDelayedActRootWorkActTaskSignature)
    ),
    rootWorkRecords: rendererRootMetadata.rootWorkRecords,
    rootWorkRecordEntries: Object.freeze(rootWorkRecordEntries),
    rootWorkRecordSignatures: Object.freeze(
      rootWorkRecordEntries.map(createDelayedActRootWorkRecordSignature)
    ),
    expectedActQueuePendingCount:
      rendererRootMetadata.expectedActQueuePendingCount,
    actQueueRecordCount: validation.actQueueValidation.pendingCount,
    rootWorkRecordCount: validation.rootWorkValidation.records.length,
    scheduledVirtualTime: validation.scheduledVirtualTime,
    delayMs: validation.delayMs,
    startTime: validation.startTime,
    expirationTime: validation.expirationTime,
    priorityTimeoutMs: validation.priorityTimeoutMs
  });
}

function getRejectedDelayedRendererRootMetadataSourceReason(
  rendererRootMetadata,
  source,
  taskRecord
) {
  const evidence = source.rendererRootEvidence;
  if (!isObjectLike(evidence)) {
    return 'renderer-root-metadata-source-evidence-missing';
  }
  if (source.rendererRootMetadata !== rendererRootMetadata) {
    return 'renderer-root-metadata-source-identity-mismatch';
  }
  if (evidence.rendererRootMetadata !== rendererRootMetadata) {
    return 'renderer-root-metadata-source-evidence-mismatch';
  }
  if (source.taskRecord !== taskRecord) {
    return 'renderer-root-metadata-source-task-record-mismatch';
  }
  if (source.scheduleOrder !== taskRecord.scheduleOrder) {
    return 'renderer-root-metadata-source-schedule-order-mismatch';
  }
  if (evidence.callbackHandle !== rendererRootMetadata.callbackHandle) {
    return 'renderer-root-metadata-source-callback-handle-mismatch';
  }
  if (evidence.scheduleOrder !== taskRecord.scheduleOrder) {
    return 'renderer-root-metadata-source-callback-schedule-order-mismatch';
  }
  if (evidence.scheduledCallback !== taskRecord.task.callback) {
    return 'renderer-root-metadata-source-callback-identity-mismatch';
  }
  if (
    evidence.scheduledCallbackSignature !==
    createDelayedActRootWorkCallbackSignatureString(taskRecord.task.callback)
  ) {
    return 'renderer-root-metadata-source-callback-signature-mismatch';
  }
  if (evidence.actQueue !== rendererRootMetadata.actQueue) {
    return 'renderer-root-metadata-source-act-queue-mismatch';
  }
  if (evidence.rootWorkRecords !== rendererRootMetadata.rootWorkRecords) {
    return 'renderer-root-metadata-source-root-work-records-mismatch';
  }
  if (
    rendererRootMetadata.expectedActQueuePendingCount !==
    evidence.expectedActQueuePendingCount
  ) {
    return 'renderer-root-metadata-source-act-queue-count-mismatch';
  }
  const actQueueRecords = rendererRootMetadata.actQueue.records;
  if (!Array.isArray(actQueueRecords)) {
    return 'renderer-root-metadata-source-act-queue-records-not-array';
  }
  if (actQueueRecords !== evidence.actQueueRecordsArray) {
    return 'renderer-root-metadata-source-act-queue-records-array-mismatch';
  }
  if (
    !Array.isArray(evidence.actQueueRecords) ||
    !Array.isArray(evidence.actQueueRecordCallbacks) ||
    !Array.isArray(evidence.actQueueRecordSignatures)
  ) {
    return 'renderer-root-metadata-source-act-queue-entry-evidence-missing';
  }
  if (actQueueRecords.length !== evidence.actQueueRecordCount) {
    return 'renderer-root-metadata-source-act-queue-record-count-mismatch';
  }
  for (let index = 0; index < evidence.actQueueRecordCount; index++) {
    const record = actQueueRecords[index];
    if (record !== evidence.actQueueRecords[index]) {
      return (
        'renderer-root-metadata-source-act-queue-record-' +
        index +
        '-identity-mismatch'
      );
    }
    if (
      getDelayedActRootWorkActTaskCallbackIdentity(record) !==
      evidence.actQueueRecordCallbacks[index]
    ) {
      return (
        'renderer-root-metadata-source-act-queue-record-' +
        index +
        '-callback-mismatch'
      );
    }
    if (
      createDelayedActRootWorkActTaskSignature(record) !==
      evidence.actQueueRecordSignatures[index]
    ) {
      return (
        'renderer-root-metadata-source-act-queue-record-' +
        index +
        '-signature-mismatch'
      );
    }
  }
  if (
    !Array.isArray(rendererRootMetadata.rootWorkRecords) ||
    rendererRootMetadata.rootWorkRecords.length !==
      evidence.rootWorkRecordCount
  ) {
    return 'renderer-root-metadata-source-root-work-record-count-mismatch';
  }
  if (
    !Array.isArray(evidence.rootWorkRecordEntries) ||
    !Array.isArray(evidence.rootWorkRecordSignatures)
  ) {
    return 'renderer-root-metadata-source-root-work-entry-evidence-missing';
  }
  for (let index = 0; index < evidence.rootWorkRecordCount; index++) {
    const record = rendererRootMetadata.rootWorkRecords[index];
    if (record !== evidence.rootWorkRecordEntries[index]) {
      return (
        'renderer-root-metadata-source-root-work-record-' +
        index +
        '-identity-mismatch'
      );
    }
    if (
      createDelayedActRootWorkRecordSignature(record) !==
      evidence.rootWorkRecordSignatures[index]
    ) {
      return (
        'renderer-root-metadata-source-root-work-record-' +
        index +
        '-signature-mismatch'
      );
    }
  }
  if (
    rendererRootMetadata.scheduledVirtualTime !==
      evidence.scheduledVirtualTime ||
    rendererRootMetadata.delayMs !== evidence.delayMs ||
    rendererRootMetadata.startTime !== evidence.startTime ||
    rendererRootMetadata.expirationTime !== evidence.expirationTime ||
    rendererRootMetadata.priorityTimeoutMs !== evidence.priorityTimeoutMs
  ) {
    return 'renderer-root-metadata-source-timing-mismatch';
  }
  if (
    createDelayedRendererRootWorkMetadataSignature(rendererRootMetadata) !==
    evidence.topLevelSignature
  ) {
    return 'renderer-root-metadata-source-signature-mismatch';
  }
  return null;
}

function createDelayedRendererRootWorkMetadataSignature(
  rendererRootMetadata
) {
  if (!isObjectLike(rendererRootMetadata)) {
    return 'not-object';
  }

  return JSON.stringify({
    kind: rendererRootMetadata.kind ?? null,
    version: rendererRootMetadata.version ?? null,
    status: rendererRootMetadata.status ?? null,
    compatibilityTarget: rendererRootMetadata.compatibilityTarget ?? null,
    reactCompatibilityTarget:
      rendererRootMetadata.reactCompatibilityTarget ?? null,
    rootId: rendererRootMetadata.rootId ?? null,
    rootLabel: rendererRootMetadata.rootLabel ?? null,
    lane: rendererRootMetadata.lane ?? null,
    laneLabel: rendererRootMetadata.laneLabel ?? null,
    priorityLevel: rendererRootMetadata.priorityLevel ?? null,
    schedulerPriority: rendererRootMetadata.schedulerPriority ?? null,
    callbackHandleId: isObjectLike(rendererRootMetadata.callbackHandle)
      ? rendererRootMetadata.callbackHandle.id ?? null
      : null,
    scheduledVirtualTime: rendererRootMetadata.scheduledVirtualTime ?? null,
    delayMs: rendererRootMetadata.delayMs ?? null,
    startTime: rendererRootMetadata.startTime ?? null,
    expirationTime: rendererRootMetadata.expirationTime ?? null,
    priorityTimeoutMs: rendererRootMetadata.priorityTimeoutMs ?? null,
    expectedActQueuePendingCount:
      rendererRootMetadata.expectedActQueuePendingCount ?? null,
    rootRequestId: rendererRootMetadata.rootRequestId ?? null,
    rootRequestSequence: rendererRootMetadata.rootRequestSequence ?? null,
    rootOperation: rendererRootMetadata.rootOperation ?? null,
    producerStatus: rendererRootMetadata.producerStatus ?? null,
    publicCompatibilityClaimed:
      rendererRootMetadata.publicCompatibilityClaimed,
    publicSchedulerTimingCompatibilityClaimed:
      rendererRootMetadata.publicSchedulerTimingCompatibilityClaimed,
    publicReactActCompatibilityClaimed:
      rendererRootMetadata.publicReactActCompatibilityClaimed,
    publicRootSchedulerCompatibilityClaimed:
      rendererRootMetadata.publicRootSchedulerCompatibilityClaimed,
    publicRendererCompatibilityClaimed:
      rendererRootMetadata.publicRendererCompatibilityClaimed,
    drainsPublicSchedulerTaskQueue:
      rendererRootMetadata.drainsPublicSchedulerTaskQueue,
    drainsPublicReactActQueue:
      rendererRootMetadata.drainsPublicReactActQueue,
    executesQueuedWork: rendererRootMetadata.executesQueuedWork,
    executesEffects: rendererRootMetadata.executesEffects,
    executesRendererWork: rendererRootMetadata.executesRendererWork,
    executesRendererRoots: rendererRootMetadata.executesRendererRoots,
    rendererWorkExecutionBlocked:
      rendererRootMetadata.rendererWorkExecutionBlocked,
    rootWorkMetadataOnly: rendererRootMetadata.rootWorkMetadataOnly,
    actQueueHandoffOnly: rendererRootMetadata.actQueueHandoffOnly,
    delayedCallbackPromotionOnly:
      rendererRootMetadata.delayedCallbackPromotionOnly,
    privateActRootHandoffOnly:
      rendererRootMetadata.privateActRootHandoffOnly
  });
}

function validateDelayedActRootWorkProducerMetadata(
  sourceScheduler,
  shadowState,
  expiredActRootWorkMetadata,
  options,
  snapshotTime
) {
  const invalid = (rejectionReason) => ({
    rejectionReason,
    taskRecord: null,
    priorityLabel: null,
    schedulerPriority: null,
    scheduledVirtualTime: null,
    delayMs: null,
    startTime: null,
    expirationTime: null,
    priorityTimeoutMs: null,
    expiredActRootWorkValidation: null
  });
  const normalizedOptions =
    options && typeof options === 'object' ? options : {};

  if (hasDelayedActRootWorkProducerPublicClaim(normalizedOptions)) {
    return invalid('producer-public-claim');
  }
  if (hasDelayedActRootWorkProducerExecutionClaim(normalizedOptions)) {
    return invalid('producer-execution-claim');
  }
  if (!isObjectLike(expiredActRootWorkMetadata)) {
    return invalid('producer-expired-act-root-work-metadata-not-object');
  }
  if (!isExpiredActRootWorkMetadataObject(expiredActRootWorkMetadata)) {
    return invalid(
      'producer-expired-act-root-work-metadata-missing-internal-brand'
    );
  }

  const callbackHandle = expiredActRootWorkMetadata.callbackHandle;
  const taskRecord = findShadowTaskRecord(shadowState, callbackHandle);
  if (taskRecord === null) {
    return invalid('producer-stale-callback-handle');
  }
  if (taskRecord.cancelled === true || taskRecord.task.callback === null) {
    return invalid('producer-stale-callback-handle');
  }
  if (typeof taskRecord.task.callback !== 'function') {
    return invalid('producer-callback-handle-not-function');
  }

  const callbackRejectionReason =
    getRejectedExpiredActRootWorkCallbackReason(
      taskRecord.task.callback,
      'producer-callback-handle'
    );
  if (callbackRejectionReason !== null) {
    return invalid(callbackRejectionReason);
  }

  const priorityLabel = getSchedulerPriorityLevelLabel(
    sourceScheduler,
    taskRecord.task.priorityLevel
  );
  if (priorityLabel === null) {
    return invalid('producer-unsupported-callback-priority-level');
  }
  const schedulerPriority =
    getSchedulerPriorityNameForPriorityLevelLabel(priorityLabel);
  if (
    normalizedOptions.priorityLevel !== undefined &&
    normalizedOptions.priorityLevel !== taskRecord.task.priorityLevel
  ) {
    return invalid('producer-callback-priority-mismatch');
  }
  if (
    normalizedOptions.schedulerPriority !== undefined &&
    normalizedOptions.schedulerPriority !== schedulerPriority
  ) {
    return invalid('producer-scheduler-priority-mismatch');
  }

  const scheduledVirtualTime =
    normalizedOptions.scheduledVirtualTime ?? snapshotTime;
  const delayMs =
    normalizedOptions.delayMs ??
    taskRecord.task.startTime - scheduledVirtualTime;
  const startTime = taskRecord.task.startTime;
  const expirationTime = taskRecord.task.expirationTime;
  const priorityTimeoutMs = expirationTime - startTime;
  if (
    typeof scheduledVirtualTime !== 'number' ||
    !Number.isFinite(scheduledVirtualTime) ||
    scheduledVirtualTime < 0
  ) {
    return invalid('producer-scheduled-virtual-time-metadata');
  }
  if (typeof delayMs !== 'number' || !Number.isFinite(delayMs) || delayMs <= 0) {
    return invalid('producer-delay-metadata');
  }
  if (startTime - scheduledVirtualTime !== delayMs) {
    return invalid('producer-delay-metadata-mismatch');
  }
  if (
    normalizedOptions.startTime !== undefined &&
    normalizedOptions.startTime !== startTime
  ) {
    return invalid('producer-start-time-metadata-mismatch');
  }
  if (
    normalizedOptions.expirationTime !== undefined &&
    normalizedOptions.expirationTime !== expirationTime
  ) {
    return invalid('producer-expiration-time-metadata-mismatch');
  }
  if (
    normalizedOptions.priorityTimeoutMs !== undefined &&
    normalizedOptions.priorityTimeoutMs !== priorityTimeoutMs
  ) {
    return invalid('producer-priority-timeout-metadata-mismatch');
  }
  if (
    startTime <= snapshotTime ||
    expirationTime <= snapshotTime ||
    taskRecord.task.sortIndex !== startTime
  ) {
    return invalid('producer-callback-handle-not-delayed-pending');
  }

  const expiredActRootWorkValidation = validateExpiredActRootWorkMetadata(
    sourceScheduler,
    shadowState,
    expiredActRootWorkMetadata,
    expirationTime
  );
  if (expiredActRootWorkValidation.rejectionReason !== null) {
    return invalid(
      'producer-expired-act-root-work-' +
        expiredActRootWorkValidation.rejectionReason
    );
  }
  if (
    expiredActRootWorkMetadata.expectedActQueuePendingCount !==
    expiredActRootWorkValidation.actQueuePendingCount
  ) {
    return invalid('producer-expected-act-queue-pending-count-mismatch');
  }

  return {
    rejectionReason: null,
    taskRecord,
    priorityLabel,
    schedulerPriority,
    scheduledVirtualTime,
    delayMs,
    startTime,
    expirationTime,
    priorityTimeoutMs,
    expiredActRootWorkValidation
  };
}

function hasDelayedActRootWorkProducerPublicClaim(options) {
  return (
    options.publicCompatibilityClaimed === true ||
    options.publicSchedulerTimingCompatibilityClaimed === true ||
    options.publicReactActCompatibilityClaimed === true ||
    options.publicRootSchedulerCompatibilityClaimed === true ||
    options.publicRendererCompatibilityClaimed === true ||
    options.compatibilityClaimed === true ||
    hasPublicPackageOrFlushHelperCompatibilityClaim(options)
  );
}

function hasDelayedActRootWorkProducerExecutionClaim(options) {
  return (
    options.drainsPublicSchedulerTaskQueue === true ||
    options.drainsPublicReactActQueue === true ||
    options.executesQueuedWork === true ||
    options.executesEffects === true ||
    options.executesRendererWork === true ||
    options.executesRendererRoots === true ||
    hasPublicSchedulerFlushExecutionClaim(options)
  );
}

function createDelayedActRootWorkNestedSourceEvidence(
  expiredActRootWorkValidation
) {
  const actQueue = expiredActRootWorkValidation.actQueue;
  const actQueueRecords = actQueue.records.slice();
  const rootWorkRecords = expiredActRootWorkValidation.rootWorkRecords;
  const rootWorkRecordEntries = rootWorkRecords.slice();

  return Object.freeze({
    actQueue,
    actQueueRecordCount: actQueueRecords.length,
    actQueueRecordsArray: actQueue.records,
    actQueueRecords: Object.freeze(actQueueRecords),
    actQueueRecordCallbacks: Object.freeze(
      actQueueRecords.map(getDelayedActRootWorkActTaskCallbackIdentity)
    ),
    actQueueRecordSignatures: Object.freeze(
      actQueueRecords.map(createDelayedActRootWorkActTaskSignature)
    ),
    rootWorkRecords,
    rootWorkRecordCount: rootWorkRecordEntries.length,
    rootWorkRecordEntries: Object.freeze(rootWorkRecordEntries),
    rootWorkRecordSignatures: Object.freeze(
      rootWorkRecordEntries.map(createDelayedActRootWorkRecordSignature)
    )
  });
}

function getRejectedDelayedActRootWorkNestedSourceReason(source) {
  if (!isObjectLike(source)) {
    return 'metadata-source-missing';
  }

  const evidence = source.nestedEvidence;
  if (!isObjectLike(evidence)) {
    return 'metadata-source-nested-evidence-missing';
  }
  if (source.actQueue !== evidence.actQueue) {
    return 'metadata-source-act-queue-evidence-mismatch';
  }
  if (source.rootWorkRecords !== evidence.rootWorkRecords) {
    return 'metadata-source-root-work-records-evidence-mismatch';
  }

  const actQueueRecords = evidence.actQueue.records;
  if (!Array.isArray(actQueueRecords)) {
    return 'metadata-source-act-queue-records-not-array';
  }
  if (actQueueRecords !== evidence.actQueueRecordsArray) {
    return 'metadata-source-act-queue-records-array-mismatch';
  }
  if (actQueueRecords.length !== evidence.actQueueRecordCount) {
    return 'metadata-source-act-queue-record-count-mismatch';
  }
  for (let index = 0; index < evidence.actQueueRecordCount; index++) {
    const record = actQueueRecords[index];
    if (record !== evidence.actQueueRecords[index]) {
      return 'metadata-source-act-queue-record-' + index + '-identity-mismatch';
    }
    if (
      getDelayedActRootWorkActTaskCallbackIdentity(record) !==
      evidence.actQueueRecordCallbacks[index]
    ) {
      return 'metadata-source-act-queue-record-' + index + '-callback-mismatch';
    }
    if (
      createDelayedActRootWorkActTaskSignature(record) !==
      evidence.actQueueRecordSignatures[index]
    ) {
      return 'metadata-source-act-queue-record-' + index + '-signature-mismatch';
    }
  }

  const rootWorkRecords = evidence.rootWorkRecords;
  if (!Array.isArray(rootWorkRecords)) {
    return 'metadata-source-root-work-records-not-array';
  }
  if (rootWorkRecords.length !== evidence.rootWorkRecordCount) {
    return 'metadata-source-root-work-record-count-mismatch';
  }
  for (let index = 0; index < evidence.rootWorkRecordCount; index++) {
    const record = rootWorkRecords[index];
    if (record !== evidence.rootWorkRecordEntries[index]) {
      return (
        'metadata-source-root-work-record-' + index + '-identity-mismatch'
      );
    }
    if (
      createDelayedActRootWorkRecordSignature(record) !==
      evidence.rootWorkRecordSignatures[index]
    ) {
      return (
        'metadata-source-root-work-record-' + index + '-signature-mismatch'
      );
    }
  }

  return null;
}

function getDelayedActRootWorkActTaskCallbackIdentity(task) {
  if (!isObjectLike(task)) {
    return null;
  }
  return task.callback ?? null;
}

function createDelayedActRootWorkActTaskSignature(task) {
  if (!isObjectLike(task)) {
    return 'not-object';
  }

  return JSON.stringify({
    kind: task.kind ?? null,
    version: task.version ?? null,
    compatibilityTarget: task.compatibilityTarget ?? null,
    schedulerCompatibilityTarget: task.schedulerCompatibilityTarget ?? null,
    recordKind: task.recordKind ?? null,
    taskKind: task.taskKind ?? null,
    continuationStatus: task.continuationStatus ?? null,
    label: task.label ?? null,
    callback: createDelayedActRootWorkCallbackSignature(task.callback),
    publicCompatibilityClaimed: task.publicCompatibilityClaimed,
    publicSchedulerTimingCompatibilityClaimed:
      task.publicSchedulerTimingCompatibilityClaimed,
    publicReactActCompatibilityClaimed: task.publicReactActCompatibilityClaimed,
    executesQueuedWork: task.executesQueuedWork,
    executesEffects: task.executesEffects
  });
}

function createDelayedActRootWorkCallbackSignature(callback) {
  if (callback === undefined) {
    return Object.freeze({ status: 'undefined' });
  }
  if (callback === null) {
    return Object.freeze({ status: 'null' });
  }
  if (typeof callback !== 'function') {
    return Object.freeze({
      status: 'not-function',
      type: typeof callback
    });
  }

  return Object.freeze({
    status: 'function',
    kind: callback.kind ?? null,
    version: callback.version ?? null,
    compatibilityTarget: callback.compatibilityTarget ?? null,
    schedulerCompatibilityTarget: callback.schedulerCompatibilityTarget ?? null,
    label: callback.label ?? null,
    publicCompatibilityClaimed: callback.publicCompatibilityClaimed,
    publicSchedulerTimingCompatibilityClaimed:
      callback.publicSchedulerTimingCompatibilityClaimed,
    publicReactActCompatibilityClaimed:
      callback.publicReactActCompatibilityClaimed,
    executesQueuedWork: callback.executesQueuedWork,
    executesEffects: callback.executesEffects
  });
}

function createDelayedActRootWorkCallbackSignatureString(callback) {
  return JSON.stringify(createDelayedActRootWorkCallbackSignature(callback));
}

function createDelayedActRootWorkRecordSignature(record) {
  if (!isObjectLike(record)) {
    return 'not-object';
  }

  return JSON.stringify({
    recordKind: getExpiredActRootWorkRecordKind(record) ?? null,
    accepted: record.accepted,
    rootId: record.rootId ?? null,
    rootLabel: record.rootLabel ?? null,
    lane: record.lane ?? null,
    laneLabel: record.laneLabel ?? null,
    publicCompatibilityClaimed: record.publicCompatibilityClaimed,
    publicSchedulerTimingCompatibilityClaimed:
      record.publicSchedulerTimingCompatibilityClaimed,
    publicReactActCompatibilityClaimed: record.publicReactActCompatibilityClaimed,
    publicRootSchedulerCompatibilityClaimed:
      record.publicRootSchedulerCompatibilityClaimed,
    publicRendererCompatibilityClaimed: record.publicRendererCompatibilityClaimed,
    drainsPublicSchedulerTaskQueue: record.drainsPublicSchedulerTaskQueue,
    drainsPublicReactActQueue: record.drainsPublicReactActQueue,
    executesQueuedWork: record.executesQueuedWork,
    executesEffects: record.executesEffects,
    executesRendererWork: record.executesRendererWork,
    executesRendererRoots: record.executesRendererRoots,
    rendererWorkExecutionBlocked: record.rendererWorkExecutionBlocked,
    rootWorkMetadataOnly: record.rootWorkMetadataOnly
  });
}

function validateDelayedActRootWorkMetadata(
  sourceScheduler,
  shadowState,
  delayedActRootWorkMetadata,
  snapshotTime
) {
  const invalid = (rejectionReason, extras = {}) => ({
    rejectionReason,
    taskRecord: null,
    priorityLabel: null,
    schedulerPriority: null,
    scheduledVirtualTime: null,
    delayMs: null,
    startTime: null,
    expirationTime: null,
    priorityTimeoutMs: null,
    expiredActRootWorkMetadata: null,
    expiredActRootWorkValidation: null,
    ...extras
  });

  if (!isObjectLike(delayedActRootWorkMetadata)) {
    return invalid('metadata-not-object');
  }
  if (!isDelayedActRootWorkMetadataObject(delayedActRootWorkMetadata)) {
    return invalid('metadata-missing-internal-brand');
  }
  if (
    delayedActRootWorkMetadata.kind !==
    privateSchedulerMockDelayedActRootWorkMetadataKind
  ) {
    return invalid('metadata-kind');
  }
  if (
    delayedActRootWorkMetadata.version !==
    privateSchedulerMockDelayedActRootWorkMetadataVersion
  ) {
    return invalid('metadata-version');
  }
  if (
    delayedActRootWorkMetadata.compatibilityTarget !==
    schedulerCompatibilityTarget
  ) {
    return invalid('metadata-scheduler-target');
  }
  if (
    delayedActRootWorkMetadata.reactCompatibilityTarget !==
    reactCompatibilityTarget
  ) {
    return invalid('metadata-react-target');
  }
  if (
    delayedActRootWorkMetadata.publicCompatibilityClaimed !== false ||
    delayedActRootWorkMetadata.publicSchedulerTimingCompatibilityClaimed !==
      false ||
    delayedActRootWorkMetadata.publicReactActCompatibilityClaimed !== false ||
    delayedActRootWorkMetadata.publicRootSchedulerCompatibilityClaimed !==
      false ||
    delayedActRootWorkMetadata.publicRendererCompatibilityClaimed !== false ||
    hasPublicPackageOrFlushHelperCompatibilityClaim(
      delayedActRootWorkMetadata
    )
  ) {
    return invalid('metadata-public-claim');
  }
  if (
    delayedActRootWorkMetadata.drainsPublicSchedulerTaskQueue !== false ||
    delayedActRootWorkMetadata.drainsPublicReactActQueue !== false ||
    delayedActRootWorkMetadata.executesQueuedWork !== false ||
    delayedActRootWorkMetadata.executesEffects !== false ||
    delayedActRootWorkMetadata.executesRendererWork !== false ||
    delayedActRootWorkMetadata.executesRendererRoots !== false ||
    hasPublicSchedulerFlushExecutionClaim(delayedActRootWorkMetadata)
  ) {
    return invalid('metadata-execution-claim');
  }
  if (
    delayedActRootWorkMetadata.rendererWorkExecutionBlocked !== true ||
    delayedActRootWorkMetadata.rootWorkMetadataOnly !== true ||
    delayedActRootWorkMetadata.actQueueHandoffOnly !== true ||
    delayedActRootWorkMetadata.delayedCallbackPromotionOnly !== true
  ) {
    return invalid('metadata-renderer-work-policy');
  }

  const taskRecord = findShadowTaskRecord(
    shadowState,
    delayedActRootWorkMetadata.callbackHandle
  );
  if (taskRecord === null) {
    return invalid('stale-callback-handle');
  }
  if (taskRecord.cancelled === true || taskRecord.task.callback === null) {
    return invalid('stale-callback-handle', { taskRecord });
  }
  if (typeof taskRecord.task.callback !== 'function') {
    return invalid('callback-handle-not-function', { taskRecord });
  }
  const callbackRejectionReason =
    getRejectedExpiredActRootWorkCallbackReason(
      taskRecord.task.callback,
      'callback-handle'
    );
  if (callbackRejectionReason !== null) {
    return invalid(callbackRejectionReason, { taskRecord });
  }

  const priorityLabel = getSchedulerPriorityLevelLabel(
    sourceScheduler,
    taskRecord.task.priorityLevel
  );
  if (priorityLabel === null) {
    return invalid('unsupported-callback-priority-level', { taskRecord });
  }
  const schedulerPriority =
    getSchedulerPriorityNameForPriorityLevelLabel(priorityLabel);
  if (
    delayedActRootWorkMetadata.priorityLevel !== undefined &&
    delayedActRootWorkMetadata.priorityLevel !== taskRecord.task.priorityLevel
  ) {
    return invalid('callback-priority-mismatch', {
      taskRecord,
      priorityLabel,
      schedulerPriority
    });
  }
  if (
    delayedActRootWorkMetadata.schedulerPriority !== undefined &&
    delayedActRootWorkMetadata.schedulerPriority !== schedulerPriority
  ) {
    return invalid('scheduler-priority-mismatch', {
      taskRecord,
      priorityLabel,
      schedulerPriority
    });
  }

  const scheduledVirtualTime =
    delayedActRootWorkMetadata.scheduledVirtualTime;
  const delayMs = delayedActRootWorkMetadata.delayMs;
  const priorityTimeoutMs =
    taskRecord.task.expirationTime - taskRecord.task.startTime;
  if (
    typeof scheduledVirtualTime !== 'number' ||
    !Number.isFinite(scheduledVirtualTime) ||
    scheduledVirtualTime < 0
  ) {
    return invalid('scheduled-virtual-time-metadata', {
      taskRecord,
      priorityLabel,
      schedulerPriority
    });
  }
  if (typeof delayMs !== 'number' || !Number.isFinite(delayMs) || delayMs <= 0) {
    return invalid('delay-metadata', {
      taskRecord,
      priorityLabel,
      schedulerPriority,
      scheduledVirtualTime
    });
  }
  if (taskRecord.task.startTime - scheduledVirtualTime !== delayMs) {
    return invalid('delay-metadata-mismatch', {
      taskRecord,
      priorityLabel,
      schedulerPriority,
      scheduledVirtualTime,
      delayMs
    });
  }
  if (delayedActRootWorkMetadata.startTime !== taskRecord.task.startTime) {
    return invalid('start-time-metadata-mismatch', {
      taskRecord,
      priorityLabel,
      schedulerPriority,
      scheduledVirtualTime,
      delayMs
    });
  }
  if (
    delayedActRootWorkMetadata.expirationTime !==
    taskRecord.task.expirationTime
  ) {
    return invalid('expiration-time-metadata-mismatch', {
      taskRecord,
      priorityLabel,
      schedulerPriority,
      scheduledVirtualTime,
      delayMs,
      startTime: taskRecord.task.startTime
    });
  }
  if (
    delayedActRootWorkMetadata.priorityTimeoutMs !== undefined &&
    delayedActRootWorkMetadata.priorityTimeoutMs !== priorityTimeoutMs
  ) {
    return invalid('priority-timeout-metadata-mismatch', {
      taskRecord,
      priorityLabel,
      schedulerPriority,
      scheduledVirtualTime,
      delayMs,
      startTime: taskRecord.task.startTime,
      expirationTime: taskRecord.task.expirationTime,
      priorityTimeoutMs
    });
  }
  if (
    taskRecord.task.startTime <= snapshotTime ||
    taskRecord.task.expirationTime <= snapshotTime ||
    taskRecord.task.sortIndex !== taskRecord.task.startTime
  ) {
    return invalid('callback-handle-not-delayed-pending', {
      taskRecord,
      priorityLabel,
      schedulerPriority,
      scheduledVirtualTime,
      delayMs,
      startTime: taskRecord.task.startTime,
      expirationTime: taskRecord.task.expirationTime,
      priorityTimeoutMs
    });
  }

  const delayedOrExpiredPendingTaskRecords =
    getPotentialDelayedOrExpiredShadowTaskRecords(
      shadowState,
      snapshotTime,
      taskRecord.task.expirationTime
    );
  if (delayedOrExpiredPendingTaskRecords.length === 0) {
    return invalid('no-delayed-or-expired-callback-handles', {
      taskRecord,
      priorityLabel,
      schedulerPriority,
      scheduledVirtualTime,
      delayMs,
      startTime: taskRecord.task.startTime,
      expirationTime: taskRecord.task.expirationTime,
      priorityTimeoutMs
    });
  }
  if (delayedOrExpiredPendingTaskRecords.indexOf(taskRecord) === -1) {
    return invalid('callback-handle-not-delayed-or-expired-pending', {
      taskRecord,
      priorityLabel,
      schedulerPriority,
      scheduledVirtualTime,
      delayMs,
      startTime: taskRecord.task.startTime,
      expirationTime: taskRecord.task.expirationTime,
      priorityTimeoutMs
    });
  }
  if (delayedOrExpiredPendingTaskRecords.length > 1) {
    return invalid('ambiguous-delayed-or-expired-callback-handles', {
      taskRecord,
      priorityLabel,
      schedulerPriority,
      scheduledVirtualTime,
      delayMs,
      startTime: taskRecord.task.startTime,
      expirationTime: taskRecord.task.expirationTime,
      priorityTimeoutMs
    });
  }

  const expiredActRootWorkMetadata =
    delayedActRootWorkMetadata.expiredActRootWorkMetadata;
  if (!isObjectLike(expiredActRootWorkMetadata)) {
    return invalid('expired-act-root-work-metadata-not-object', {
      taskRecord,
      priorityLabel,
      schedulerPriority,
      scheduledVirtualTime,
      delayMs,
      startTime: taskRecord.task.startTime,
      expirationTime: taskRecord.task.expirationTime,
      priorityTimeoutMs
    });
  }
  if (!isExpiredActRootWorkMetadataObject(expiredActRootWorkMetadata)) {
    return invalid('expired-act-root-work-metadata-missing-internal-brand', {
      taskRecord,
      priorityLabel,
      schedulerPriority,
      scheduledVirtualTime,
      delayMs,
      startTime: taskRecord.task.startTime,
      expirationTime: taskRecord.task.expirationTime,
      priorityTimeoutMs,
      expiredActRootWorkMetadata
    });
  }
  if (
    expiredActRootWorkMetadata.callbackHandle !==
    delayedActRootWorkMetadata.callbackHandle
  ) {
    return invalid('expired-act-root-work-callback-handle-mismatch', {
      taskRecord,
      priorityLabel,
      schedulerPriority,
      scheduledVirtualTime,
      delayMs,
      startTime: taskRecord.task.startTime,
      expirationTime: taskRecord.task.expirationTime,
      priorityTimeoutMs,
      expiredActRootWorkMetadata
    });
  }

  const expiredActRootWorkValidation = validateExpiredActRootWorkMetadata(
    sourceScheduler,
    shadowState,
    expiredActRootWorkMetadata,
    taskRecord.task.expirationTime
  );
  if (expiredActRootWorkValidation.rejectionReason !== null) {
    return invalid(expiredActRootWorkValidation.rejectionReason, {
      taskRecord,
      priorityLabel,
      schedulerPriority,
      scheduledVirtualTime,
      delayMs,
      startTime: taskRecord.task.startTime,
      expirationTime: taskRecord.task.expirationTime,
      priorityTimeoutMs,
      expiredActRootWorkMetadata,
      expiredActRootWorkValidation
    });
  }

  const producerSourceRejectionReason =
    getRejectedDelayedActRootWorkMetadataProducerSourceReason(
      sourceScheduler,
      shadowState,
      delayedActRootWorkMetadata,
      taskRecord,
      expiredActRootWorkMetadata,
      scheduledVirtualTime,
      delayMs,
      taskRecord.task.startTime,
      taskRecord.task.expirationTime,
      priorityTimeoutMs
    );
  if (producerSourceRejectionReason !== null) {
    return invalid(producerSourceRejectionReason, {
      taskRecord,
      priorityLabel,
      schedulerPriority,
      scheduledVirtualTime,
      delayMs,
      startTime: taskRecord.task.startTime,
      expirationTime: taskRecord.task.expirationTime,
      priorityTimeoutMs,
      expiredActRootWorkMetadata,
      expiredActRootWorkValidation
    });
  }

  return {
    rejectionReason: null,
    taskRecord,
    priorityLabel,
    schedulerPriority,
    scheduledVirtualTime,
    delayMs,
    startTime: taskRecord.task.startTime,
    expirationTime: taskRecord.task.expirationTime,
    priorityTimeoutMs,
    expiredActRootWorkMetadata,
    expiredActRootWorkValidation
  };
}

function getRejectedDelayedActRootWorkMetadataProducerSourceReason(
  sourceScheduler,
  shadowState,
  delayedActRootWorkMetadata,
  taskRecord,
  expiredActRootWorkMetadata,
  scheduledVirtualTime,
  delayMs,
  startTime,
  expirationTime,
  priorityTimeoutMs,
  validateScheduledCallbackIdentity = true
) {
  const source = delayedActRootWorkMetadataSources.get(
    delayedActRootWorkMetadata
  );
  if (source === undefined) {
    return 'metadata-not-produced-by-private-delayed-root-producer';
  }
  if (source.sourceScheduler !== sourceScheduler) {
    return 'metadata-source-scheduler-mismatch';
  }
  if (source.shadowState !== shadowState) {
    return 'metadata-source-shadow-state-mismatch';
  }
  if (source.taskRecord !== taskRecord) {
    return 'metadata-source-task-record-mismatch';
  }
  if (source.callbackHandle !== delayedActRootWorkMetadata.callbackHandle) {
    return 'metadata-source-callback-handle-mismatch';
  }
  if (source.expiredActRootWorkMetadata !== expiredActRootWorkMetadata) {
    return 'metadata-source-expired-act-root-work-mismatch';
  }
  if (source.actQueue !== expiredActRootWorkMetadata.actQueue) {
    return 'metadata-source-act-queue-mismatch';
  }
  if (source.rootWorkRecords !== expiredActRootWorkMetadata.rootWorkRecords) {
    return 'metadata-source-root-work-records-mismatch';
  }
  if (source.scheduleOrder !== taskRecord.scheduleOrder) {
    return 'metadata-source-schedule-order-mismatch';
  }
  if (
    source.scheduledVirtualTime !== scheduledVirtualTime ||
    source.delayMs !== delayMs ||
    source.startTime !== startTime ||
    source.expirationTime !== expirationTime ||
    source.priorityTimeoutMs !== priorityTimeoutMs
  ) {
    return 'metadata-source-timing-mismatch';
  }
  const rendererRootSourceRejectionReason =
    getRejectedDelayedRendererRootProducerSourceReason(
      source,
      delayedActRootWorkMetadata,
      expiredActRootWorkMetadata,
      validateScheduledCallbackIdentity
    );
  if (rendererRootSourceRejectionReason !== null) {
    return rendererRootSourceRejectionReason;
  }
  return getRejectedDelayedActRootWorkNestedSourceReason(source);
}

function getRejectedDelayedRendererRootProducerSourceReason(
  source,
  delayedActRootWorkMetadata,
  expiredActRootWorkMetadata,
  validateScheduledCallbackIdentity
) {
  if (source.rendererRootMetadata === undefined) {
    return null;
  }
  if (source.producerKind !== 'accepted-renderer-root-metadata') {
    return 'metadata-source-renderer-root-producer-kind';
  }
  if (
    delayedActRootWorkMetadata.producerKind !==
    'accepted-renderer-root-metadata'
  ) {
    return 'metadata-source-renderer-root-delayed-producer-kind';
  }

  const evidence = source.rendererRootEvidence;
  const rendererRootMetadata = source.rendererRootMetadata;
  if (!isObjectLike(evidence) || !isObjectLike(rendererRootMetadata)) {
    return 'metadata-source-renderer-root-evidence-missing';
  }
  if (evidence.rendererRootMetadata !== rendererRootMetadata) {
    return 'metadata-source-renderer-root-evidence-mismatch';
  }
  if (
    delayedActRootWorkMetadata.rendererRootMetadataKind !==
      rendererRootMetadata.kind ||
    delayedActRootWorkMetadata.rendererRootMetadataVersion !==
      rendererRootMetadata.version ||
    delayedActRootWorkMetadata.rendererRootMetadataStatus !==
      rendererRootMetadata.status ||
    delayedActRootWorkMetadata.rendererRootProducerStatus !==
      rendererRootMetadata.producerStatus
  ) {
    return 'metadata-source-renderer-root-delayed-metadata-mismatch';
  }
  if (rendererRootMetadata.callbackHandle !== source.callbackHandle) {
    return 'metadata-source-renderer-root-callback-handle-mismatch';
  }
  if (
    rendererRootMetadata.callbackHandle !==
    expiredActRootWorkMetadata.callbackHandle
  ) {
    return 'metadata-source-renderer-root-expired-callback-handle-mismatch';
  }
  if (evidence.scheduleOrder !== source.scheduleOrder) {
    return 'metadata-source-renderer-root-callback-schedule-order-mismatch';
  }
  if (
    validateScheduledCallbackIdentity === true &&
    evidence.scheduledCallback !== source.taskRecord.task.callback
  ) {
    return 'metadata-source-renderer-root-callback-identity-mismatch';
  }
  if (validateScheduledCallbackIdentity === true) {
    if (
      evidence.scheduledCallbackSignature !==
      createDelayedActRootWorkCallbackSignatureString(
        source.taskRecord.task.callback
      )
    ) {
      return 'metadata-source-renderer-root-callback-signature-mismatch';
    }
  }
  if (rendererRootMetadata.actQueue !== source.actQueue) {
    return 'metadata-source-renderer-root-act-queue-mismatch';
  }
  if (rendererRootMetadata.actQueue !== expiredActRootWorkMetadata.actQueue) {
    return 'metadata-source-renderer-root-expired-act-queue-mismatch';
  }
  if (rendererRootMetadata.rootWorkRecords !== source.rootWorkRecords) {
    return 'metadata-source-renderer-root-work-records-mismatch';
  }
  if (
    rendererRootMetadata.rootWorkRecords !==
    expiredActRootWorkMetadata.rootWorkRecords
  ) {
    return 'metadata-source-renderer-root-expired-work-records-mismatch';
  }
  if (
    rendererRootMetadata.expectedActQueuePendingCount !==
    evidence.expectedActQueuePendingCount
  ) {
    return 'metadata-source-renderer-root-act-queue-count-mismatch';
  }
  const actQueueRecords = rendererRootMetadata.actQueue.records;
  if (!Array.isArray(actQueueRecords)) {
    return 'metadata-source-renderer-root-act-queue-records-not-array';
  }
  if (actQueueRecords !== evidence.actQueueRecordsArray) {
    return 'metadata-source-renderer-root-act-queue-records-array-mismatch';
  }
  if (
    !Array.isArray(evidence.actQueueRecords) ||
    !Array.isArray(evidence.actQueueRecordCallbacks) ||
    !Array.isArray(evidence.actQueueRecordSignatures)
  ) {
    return 'metadata-source-renderer-root-act-queue-entry-evidence-missing';
  }
  if (actQueueRecords.length !== evidence.actQueueRecordCount) {
    return 'metadata-source-renderer-root-act-queue-record-count-mismatch';
  }
  for (let index = 0; index < evidence.actQueueRecordCount; index++) {
    const record = actQueueRecords[index];
    if (record !== evidence.actQueueRecords[index]) {
      return (
        'metadata-source-renderer-root-act-queue-record-' +
        index +
        '-identity-mismatch'
      );
    }
    if (
      getDelayedActRootWorkActTaskCallbackIdentity(record) !==
      evidence.actQueueRecordCallbacks[index]
    ) {
      return (
        'metadata-source-renderer-root-act-queue-record-' +
        index +
        '-callback-mismatch'
      );
    }
    if (
      createDelayedActRootWorkActTaskSignature(record) !==
      evidence.actQueueRecordSignatures[index]
    ) {
      return (
        'metadata-source-renderer-root-act-queue-record-' +
        index +
        '-signature-mismatch'
      );
    }
  }
  if (
    !Array.isArray(rendererRootMetadata.rootWorkRecords) ||
    rendererRootMetadata.rootWorkRecords.length !==
      evidence.rootWorkRecordCount
  ) {
    return 'metadata-source-renderer-root-work-record-count-mismatch';
  }
  if (
    !Array.isArray(evidence.rootWorkRecordEntries) ||
    !Array.isArray(evidence.rootWorkRecordSignatures)
  ) {
    return 'metadata-source-renderer-root-work-entry-evidence-missing';
  }
  for (let index = 0; index < evidence.rootWorkRecordCount; index++) {
    const record = rendererRootMetadata.rootWorkRecords[index];
    if (record !== evidence.rootWorkRecordEntries[index]) {
      return (
        'metadata-source-renderer-root-work-record-' +
        index +
        '-identity-mismatch'
      );
    }
    if (
      createDelayedActRootWorkRecordSignature(record) !==
      evidence.rootWorkRecordSignatures[index]
    ) {
      return (
        'metadata-source-renderer-root-work-record-' +
        index +
        '-signature-mismatch'
      );
    }
  }
  if (
    rendererRootMetadata.scheduledVirtualTime !==
      evidence.scheduledVirtualTime ||
    rendererRootMetadata.delayMs !== evidence.delayMs ||
    rendererRootMetadata.startTime !== evidence.startTime ||
    rendererRootMetadata.expirationTime !== evidence.expirationTime ||
    rendererRootMetadata.priorityTimeoutMs !== evidence.priorityTimeoutMs
  ) {
    return 'metadata-source-renderer-root-timing-mismatch';
  }
  if (
    createDelayedRendererRootWorkMetadataSignature(rendererRootMetadata) !==
    evidence.topLevelSignature
  ) {
    return 'metadata-source-renderer-root-signature-mismatch';
  }
  return null;
}

function isDelayedActRootWorkMetadataObject(value) {
  return (
    isObjectLike(value) &&
    hasOwnLockedDataProperty(
      value,
      privateSchedulerMockDelayedActRootWorkMetadataBrand,
      true
    )
  );
}

function isDelayedActRootWorkMetadataCandidate(value) {
  return (
    isDelayedActRootWorkMetadataObject(value) ||
    (isObjectLike(value) &&
      value.kind === privateSchedulerMockDelayedActRootWorkMetadataKind)
  );
}

function summarizeDelayedActRootWorkMetadataForDiagnostics(
  sourceScheduler,
  delayedActRootWorkMetadata,
  validation,
  snapshotTime
) {
  const isMetadataObject = isObjectLike(delayedActRootWorkMetadata);
  const callbackHandle = isMetadataObject
    ? delayedActRootWorkMetadata.callbackHandle
    : null;
  const taskRecord = validation.taskRecord;
  const priorityLevel =
    taskRecord === null
      ? isMetadataObject
        ? delayedActRootWorkMetadata.priorityLevel
        : undefined
      : taskRecord.task.priorityLevel;
  const priorityLabel =
    validation.priorityLabel ||
    getSchedulerPriorityLevelLabel(sourceScheduler, priorityLevel);
  const schedulerPriority =
    validation.schedulerPriority ||
    (priorityLabel === null
      ? null
      : getSchedulerPriorityNameForPriorityLevelLabel(priorityLabel));
  const scheduledVirtualTime =
    validation.scheduledVirtualTime ??
    (isMetadataObject
      ? delayedActRootWorkMetadata.scheduledVirtualTime
      : null);
  const delayMs =
    validation.delayMs ??
    (isMetadataObject ? delayedActRootWorkMetadata.delayMs : null);
  const startTime =
    validation.startTime ??
    (isMetadataObject ? delayedActRootWorkMetadata.startTime : null);
  const expirationTime =
    validation.expirationTime ??
    (isMetadataObject ? delayedActRootWorkMetadata.expirationTime : null);
  const priorityTimeoutMs =
    validation.priorityTimeoutMs ??
    (typeof startTime === 'number' && typeof expirationTime === 'number'
      ? expirationTime - startTime
      : null);
  const expiredActRootWorkMetadata =
    validation.expiredActRootWorkMetadata ||
    (isMetadataObject
      ? delayedActRootWorkMetadata.expiredActRootWorkMetadata
      : null);
  const expiredActRootWorkValidation =
    validation.expiredActRootWorkValidation ||
    createRejectedExpiredActRootWorkValidation(
      validation.rejectionReason || 'not-validated'
    );
  const delayedSource = isMetadataObject
    ? delayedActRootWorkMetadataSources.get(delayedActRootWorkMetadata)
    : undefined;
  const rendererRootMetadata =
    isObjectLike(delayedSource) &&
    isObjectLike(delayedSource.rendererRootMetadata)
      ? delayedSource.rendererRootMetadata
      : null;

  return Object.freeze({
    kind: isMetadataObject ? delayedActRootWorkMetadata.kind : null,
    version: isMetadataObject ? delayedActRootWorkMetadata.version : null,
    accepted: validation.rejectionReason === null,
    rejectionReason: validation.rejectionReason,
    compatibilityTarget: isMetadataObject
      ? delayedActRootWorkMetadata.compatibilityTarget
      : null,
    reactCompatibilityTarget: isMetadataObject
      ? delayedActRootWorkMetadata.reactCompatibilityTarget
      : null,
    rootId: isMetadataObject ? delayedActRootWorkMetadata.rootId : null,
    rootLabel: isMetadataObject ? delayedActRootWorkMetadata.rootLabel : null,
    lane: isMetadataObject ? delayedActRootWorkMetadata.lane : null,
    laneLabel: isMetadataObject ? delayedActRootWorkMetadata.laneLabel : null,
    priorityLevel: priorityLevel ?? null,
    priorityLabel,
    schedulerPriority,
    callbackHandleMatched: taskRecord !== null,
    callbackHandleId: isObjectLike(callbackHandle)
      ? callbackHandle.id ?? null
      : null,
    callbackHandleScheduleOrder:
      taskRecord === null ? null : taskRecord.scheduleOrder,
    callbackHandleDelayedPending:
      taskRecord !== null &&
      taskRecord.task.startTime > snapshotTime &&
      taskRecord.task.expirationTime > snapshotTime &&
      taskRecord.task.sortIndex === taskRecord.task.startTime,
    producedByPrivateDelayedActRootWorkMetadataProducer:
      delayedActRootWorkMetadataSources.has(delayedActRootWorkMetadata),
    producerStatus: isMetadataObject
      ? delayedActRootWorkMetadata.producerStatus ?? null
      : null,
    producerKind: isMetadataObject
      ? delayedActRootWorkMetadata.producerKind ?? null
      : null,
    producedByPrivateDelayedRendererRootProducer:
      isObjectLike(delayedSource) &&
      delayedSource.producerKind === 'accepted-renderer-root-metadata',
    rendererRootMetadata:
      summarizeDelayedRendererRootWorkMetadataForDiagnostics(
        rendererRootMetadata,
        isObjectLike(delayedSource)
          ? delayedSource.rendererRootEvidence
          : null
      ),
    scheduledVirtualTime,
    delayMs,
    startTime,
    expirationTime,
    priorityTimeoutMs,
    currentVirtualTime: snapshotTime,
    promotionTargetVirtualTime: expirationTime,
    advanceTimeBy:
      typeof expirationTime === 'number' ? expirationTime - snapshotTime : null,
    delayMatchesCallbackHandle:
      typeof scheduledVirtualTime === 'number' &&
      typeof delayMs === 'number' &&
      taskRecord !== null &&
      taskRecord.task.startTime - scheduledVirtualTime === delayMs,
    startTimeMatchesCallbackHandle:
      taskRecord !== null && taskRecord.task.startTime === startTime,
    expirationTimeMatchesCallbackHandle:
      taskRecord !== null && taskRecord.task.expirationTime === expirationTime,
    priorityTimeoutMatchesCallbackHandle:
      taskRecord !== null &&
      typeof priorityTimeoutMs === 'number' &&
      taskRecord.task.expirationTime - taskRecord.task.startTime ===
        priorityTimeoutMs,
    expiredActRootWorkMetadata: isObjectLike(expiredActRootWorkMetadata)
      ? summarizeExpiredActRootWorkMetadataForDiagnostics(
          sourceScheduler,
          expiredActRootWorkMetadata,
          expiredActRootWorkValidation
        )
      : null,
    rendererWorkExecutionBlocked: isMetadataObject
      ? delayedActRootWorkMetadata.rendererWorkExecutionBlocked === true
      : false,
    rootWorkMetadataOnly: isMetadataObject
      ? delayedActRootWorkMetadata.rootWorkMetadataOnly === true
      : false,
    actQueueHandoffOnly: isMetadataObject
      ? delayedActRootWorkMetadata.actQueueHandoffOnly === true
      : false,
    delayedCallbackPromotionOnly: isMetadataObject
      ? delayedActRootWorkMetadata.delayedCallbackPromotionOnly === true
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

function summarizeDelayedRendererRootWorkMetadataForDiagnostics(
  rendererRootMetadata,
  evidence
) {
  if (!isObjectLike(rendererRootMetadata)) {
    return null;
  }

  const actQueueRecords = Array.isArray(rendererRootMetadata.actQueue?.records)
    ? rendererRootMetadata.actQueue.records
    : [];
  const rootWorkRecords = Array.isArray(rendererRootMetadata.rootWorkRecords)
    ? rendererRootMetadata.rootWorkRecords
    : [];
  const actQueueEntryEvidenceMatches =
    isObjectLike(evidence) &&
    actQueueRecords === evidence.actQueueRecordsArray &&
    Array.isArray(evidence.actQueueRecords) &&
    Array.isArray(evidence.actQueueRecordCallbacks) &&
    Array.isArray(evidence.actQueueRecordSignatures) &&
    actQueueRecords.every(
      (record, index) =>
        record === evidence.actQueueRecords[index] &&
        getDelayedActRootWorkActTaskCallbackIdentity(record) ===
          evidence.actQueueRecordCallbacks[index] &&
        createDelayedActRootWorkActTaskSignature(record) ===
          evidence.actQueueRecordSignatures[index]
    );
  const rootWorkEntryEvidenceMatches =
    isObjectLike(evidence) &&
    Array.isArray(evidence.rootWorkRecordEntries) &&
    Array.isArray(evidence.rootWorkRecordSignatures) &&
    rootWorkRecords.every(
      (record, index) =>
        record === evidence.rootWorkRecordEntries[index] &&
        createDelayedActRootWorkRecordSignature(record) ===
          evidence.rootWorkRecordSignatures[index]
    );
  const sourceEvidenceMatches =
    isObjectLike(evidence) &&
    evidence.rendererRootMetadata === rendererRootMetadata &&
    evidence.topLevelSignature ===
      createDelayedRendererRootWorkMetadataSignature(rendererRootMetadata) &&
    evidence.actQueue === rendererRootMetadata.actQueue &&
    evidence.rootWorkRecords === rendererRootMetadata.rootWorkRecords &&
    evidence.callbackHandle === rendererRootMetadata.callbackHandle &&
    isObjectLike(rendererRootMetadata.callbackHandle) &&
    evidence.scheduledCallback === rendererRootMetadata.callbackHandle.callback &&
    evidence.scheduledCallbackSignature ===
      createDelayedActRootWorkCallbackSignatureString(
        rendererRootMetadata.callbackHandle.callback
      ) &&
    evidence.actQueueRecordCount === actQueueRecords.length &&
    evidence.rootWorkRecordCount === rootWorkRecords.length &&
    actQueueEntryEvidenceMatches &&
    rootWorkEntryEvidenceMatches;

  return Object.freeze({
    kind: rendererRootMetadata.kind ?? null,
    version: rendererRootMetadata.version ?? null,
    status: rendererRootMetadata.status ?? null,
    accepted: sourceEvidenceMatches,
    sourceEvidenceMatches,
    compatibilityTarget: rendererRootMetadata.compatibilityTarget ?? null,
    reactCompatibilityTarget:
      rendererRootMetadata.reactCompatibilityTarget ?? null,
    rootId: rendererRootMetadata.rootId ?? null,
    rootLabel: rendererRootMetadata.rootLabel ?? null,
    lane: rendererRootMetadata.lane ?? null,
    laneLabel: rendererRootMetadata.laneLabel ?? null,
    rootRequestId: rendererRootMetadata.rootRequestId ?? null,
    rootRequestSequence: rendererRootMetadata.rootRequestSequence ?? null,
    rootOperation: rendererRootMetadata.rootOperation ?? null,
    producerStatus: rendererRootMetadata.producerStatus ?? null,
    actQueueRecordCount: actQueueRecords.length,
    rootWorkRecordCount: rootWorkRecords.length,
    scheduledVirtualTime: rendererRootMetadata.scheduledVirtualTime ?? null,
    delayMs: rendererRootMetadata.delayMs ?? null,
    startTime: rendererRootMetadata.startTime ?? null,
    expirationTime: rendererRootMetadata.expirationTime ?? null,
    priorityTimeoutMs: rendererRootMetadata.priorityTimeoutMs ?? null,
    rendererWorkExecutionBlocked:
      rendererRootMetadata.rendererWorkExecutionBlocked === true,
    rootWorkMetadataOnly:
      rendererRootMetadata.rootWorkMetadataOnly === true,
    actQueueHandoffOnly:
      rendererRootMetadata.actQueueHandoffOnly === true,
    delayedCallbackPromotionOnly:
      rendererRootMetadata.delayedCallbackPromotionOnly === true,
    privateActRootHandoffOnly:
      rendererRootMetadata.privateActRootHandoffOnly === true,
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

function createDelayedActRootWorkPromotionEvidenceForDiagnostics(
  validation,
  before,
  afterPromotion,
  matchedTaskBefore,
  matchedTaskAfterPromotion,
  advanceTimeBy,
  advanceTimeReturnValue
) {
  const promotedDelayedCallbackToExpiredWork =
    afterPromotion.now === validation.expirationTime &&
    matchedTaskBefore.sortIndex === validation.startTime &&
    matchedTaskAfterPromotion.sortIndex === validation.expirationTime &&
    matchedTaskAfterPromotion.expired === true &&
    matchedTaskAfterPromotion.callbackStatus === 'pending-callback' &&
    afterPromotion.pendingWork === true;

  return Object.freeze({
    status:
      promotedDelayedCallbackToExpiredWork === true
        ? 'promoted-delayed-callback-to-expired-mock-scheduler-work-for-diagnostics'
        : 'failed-delayed-callback-promotion-for-diagnostics',
    accepted: promotedDelayedCallbackToExpiredWork === true,
    scheduledVirtualTime: validation.scheduledVirtualTime,
    delayMs: validation.delayMs,
    startTime: validation.startTime,
    expirationTime: validation.expirationTime,
    priorityTimeoutMs: validation.priorityTimeoutMs,
    virtualTimeBefore: before.now,
    virtualTimeAfterPromotion: afterPromotion.now,
    advanceTimeBy,
    advanceTimeReturnedUndefined: advanceTimeReturnValue === undefined,
    pendingBefore: before.pendingWork,
    pendingAfterPromotion: afterPromotion.pendingWork,
    sortIndexBefore: matchedTaskBefore.sortIndex,
    sortIndexAfterPromotion: matchedTaskAfterPromotion.sortIndex,
    delayedPendingBefore:
      matchedTaskBefore.sortIndex === validation.startTime &&
      matchedTaskBefore.expired === false,
    expiredAfterPromotion: matchedTaskAfterPromotion.expired === true,
    promotedDelayedCallbackToExpiredWork,
    usesWallClockTime: false,
    usesPublicSchedulerFrameInterval: false,
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
    expiredActRootWorkMetadata.publicRendererCompatibilityClaimed !== false ||
    hasPublicPackageOrFlushHelperCompatibilityClaim(
      expiredActRootWorkMetadata
    )
  ) {
    return invalid('metadata-public-claim');
  }
  if (
    expiredActRootWorkMetadata.drainsPublicSchedulerTaskQueue !== false ||
    expiredActRootWorkMetadata.drainsPublicReactActQueue !== false ||
    expiredActRootWorkMetadata.executesQueuedWork !== false ||
    expiredActRootWorkMetadata.executesEffects !== false ||
    expiredActRootWorkMetadata.executesRendererWork !== false ||
    expiredActRootWorkMetadata.executesRendererRoots !== false ||
    hasPublicSchedulerFlushExecutionClaim(expiredActRootWorkMetadata)
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
  if (
    !hasOwnLockedDataProperty(
      taskRecord.task.callback,
      privateActQueueTestCallbackBrand,
      true
    )
  ) {
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
    hasOwnLockedDataProperty(
      value,
      privateSchedulerMockExpiredActRootWorkMetadataBrand,
      true
    )
  );
}

function isExpiredActRootWorkMetadataCandidate(value) {
  return (
    isExpiredActRootWorkMetadataObject(value) ||
    (isObjectLike(value) &&
      value.kind === privateSchedulerMockExpiredActRootWorkMetadataKind)
  );
}

function installGuardedExpiredActRootWorkCallback(
  taskRecord,
  createContinuationRejectionError
) {
  taskRecord.task.callback = createGuardedExpiredActRootWorkCallback(
    taskRecord.task.callback,
    'callback-continuation',
    createContinuationRejectionError
  );
}

function createGuardedExpiredActRootWorkCallback(
  callback,
  continuationRole,
  createContinuationRejectionError
) {
  const guardedCallback = function () {
    const continuation = callback.apply(this, arguments);
    if (typeof continuation !== 'function') {
      return continuation;
    }

    const rejectionReason = getRejectedExpiredActRootWorkCallbackReason(
      continuation,
      continuationRole
    );
    if (rejectionReason !== null) {
      throw createContinuationRejectionError(rejectionReason);
    }

    return createGuardedExpiredActRootWorkCallback(
      continuation,
      continuationRole,
      createContinuationRejectionError
    );
  };

  defineFunctionShape(guardedCallback, callback.name, callback.length);
  definePrivateActQueueTestCallbackShape(guardedCallback, callback);
  return Object.freeze(guardedCallback);
}

function definePrivateActQueueTestCallbackShape(target, source) {
  Object.defineProperties(target, {
    [privateActQueueTestCallbackBrand]: {
      value: true
    },
    kind: {
      value: source.kind
    },
    version: {
      value: source.version
    },
    compatibilityTarget: {
      value: source.compatibilityTarget
    },
    schedulerCompatibilityTarget: {
      value: source.schedulerCompatibilityTarget
    },
    label: {
      value: source.label
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
  if (!hasOwnLockedDataProperty(queue, privateActQueueTestQueueBrand, true)) {
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
    queue.publicReactActCompatibilityClaimed !== false ||
    hasPublicPackageOrFlushHelperCompatibilityClaim(queue)
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
  if (
    queue.executesQueuedWork !== false ||
    queue.executesEffects !== false ||
    hasPublicSchedulerFlushExecutionClaim(queue)
  ) {
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
  if (!hasOwnLockedDataProperty(task, privateActQueueTestTaskBrand, true)) {
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
    task.publicReactActCompatibilityClaimed !== false ||
    hasPublicPackageOrFlushHelperCompatibilityClaim(task)
  ) {
    return 'act-record-' + index + '-public-claim';
  }
  if (
    task.executesQueuedWork !== false ||
    task.executesEffects !== false ||
    hasPublicSchedulerFlushExecutionClaim(task)
  ) {
    return 'act-record-' + index + '-execution-claim';
  }
  return null;
}

function getRejectedExpiredActRootWorkCallbackReason(callback, role) {
  if (typeof callback !== 'function') {
    return role + '-not-function';
  }
  if (
    !hasOwnLockedDataProperty(
      callback,
      privateActQueueTestCallbackBrand,
      true
    )
  ) {
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
    callback.publicReactActCompatibilityClaimed !== false ||
    hasPublicPackageOrFlushHelperCompatibilityClaim(callback)
  ) {
    return role + '-public-claim';
  }
  if (
    callback.executesQueuedWork !== false ||
    callback.executesEffects !== false ||
    hasPublicSchedulerFlushExecutionClaim(callback)
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
    record.publicRendererCompatibilityClaimed !== false ||
    hasPublicPackageOrFlushHelperCompatibilityClaim(record)
  ) {
    return 'root-work-record-' + index + '-public-claim';
  }
  if (
    record.drainsPublicSchedulerTaskQueue !== false ||
    record.drainsPublicReactActQueue !== false ||
    record.executesQueuedWork !== false ||
    record.executesEffects !== false ||
    record.executesRendererWork !== false ||
    record.executesRendererRoots !== false ||
    hasPublicSchedulerFlushExecutionClaim(record)
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

function createDelayedActRootWorkMetadataError(rejectionReason) {
  const error = new Error(
    '[fast-react] scheduler/unstable_mock private delayed act/root work ' +
      'diagnostics rejected unsupported metadata: ' +
      rejectionReason +
      '. Only accepted private act/root records for the matching delayed ' +
      'mock Scheduler callback handle may be promoted and drained.'
  );
  error.name = 'FastReactSchedulerMockDelayedActRootWorkError';
  error.code = 'FAST_REACT_SCHEDULER_MOCK_DELAYED_ACT_ROOT_WORK_REJECTED';
  error.entrypoint = 'scheduler/unstable_mock';
  error.compatibilityTarget = schedulerCompatibilityTarget;
  error.publicSchedulerTimingCompatibilityClaimed = false;
  error.publicReactActCompatibilityClaimed = false;
  error.publicRootSchedulerCompatibilityClaimed = false;
  error.publicRendererCompatibilityClaimed = false;
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

function getPotentialDelayedOrExpiredShadowTaskRecords(
  shadowState,
  snapshotTime,
  promotionTargetTime
) {
  return shadowState.taskRecords.filter(function (record) {
    return (
      record.cancelled !== true &&
      isObjectLike(record.task) &&
      typeof record.task.callback === 'function' &&
      (record.task.startTime > snapshotTime ||
        record.task.expirationTime <= snapshotTime ||
        record.task.expirationTime <= promotionTargetTime)
    );
  });
}

function createRejectedExpiredActRootWorkValidation(rejectionReason) {
  return {
    rejectionReason,
    taskRecord: null,
    priorityLabel: null,
    schedulerPriority: null,
    actQueue: null,
    actQueuePendingCount: 0,
    rootWorkRecords: []
  };
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
    if (
      hasOwnLockedDataProperty(
        callback,
        privateActQueueTestCallbackBrand,
        true
      )
    ) {
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

function hasOwnLockedDataProperty(value, key, expectedValue) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return (
    descriptor !== undefined &&
    descriptor.configurable === false &&
    descriptor.enumerable === false &&
    descriptor.writable === false &&
    descriptor.value === expectedValue
  );
}

function includesString(value, expectedValues) {
  return typeof value === 'string' && expectedValues.includes(value);
}
