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

const scheduler =
  process.env.NODE_ENV === 'production'
    ? require('./cjs/scheduler-unstable_mock.production.js')
    : require('./cjs/scheduler-unstable_mock.development.js');

module.exports = createPrivateSchedulerMockDiagnosticsWrapper(scheduler);

function createPrivateSchedulerMockDiagnosticsWrapper(sourceScheduler) {
  const shadowState = {
    nextScheduleOrder: 1,
    taskRecords: []
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
    describeExpiredMockSchedulerWorkForDiagnostics() {
      return describeExpiredMockSchedulerWorkForDiagnostics(
        sourceScheduler,
        shadowState
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
