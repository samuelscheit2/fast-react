'use strict';

var ImmediatePriority = 1;
var UserBlockingPriority = 2;
var NormalPriority = 3;
var LowPriority = 4;
var IdlePriority = 5;

var maxSigned31BitInt = 1073741823;
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
var NORMAL_PRIORITY_TIMEOUT = 5000;
var LOW_PRIORITY_TIMEOUT = 10000;
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;

var taskQueue = [];
var timerQueue = [];
var taskIdCounter = 1;
var currentTask = null;
var currentPriorityLevel = NormalPriority;
var isPerformingWork = false;
var isHostCallbackScheduled = false;
var isHostTimeoutScheduled = false;
var currentMockTime = 0;
var scheduledCallback = null;
var scheduledTimeout = null;
var timeoutTime = -1;
var yieldedValues = null;
var expectedNumberOfYields = -1;
var didStop = false;
var isFlushing = false;
var needsPaint = false;
var shouldYieldForPaint = false;
var disableYieldValue = false;
var isPrivateActQueueDraining = false;
var privateActQueueFlushDiagnosticsExport =
  '__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__';
var privateActQueueTestQueueKind =
  'fast-react.react.private-act-queue-test-queue';
var privateActQueueTestTaskKind =
  'fast-react.react.private-act-queue-test-task';
var privateActQueueTestCallbackKind =
  'fast-react.react.private-act-queue-test-callback';
var privateActQueueTestQueueVersion = 1;
var privateActQueueTestQueueBrand = Symbol.for(
  'fast-react.react.private-act-queue-test-queue'
);
var privateActQueueTestTaskBrand = Symbol.for(
  'fast-react.react.private-act-queue-test-task'
);
var privateActQueueTestCallbackBrand = Symbol.for(
  'fast-react.react.private-act-queue-test-callback'
);
var reactCompatibilityTarget = 'react@19.2.6';
var schedulerCompatibilityTarget = 'scheduler@0.27.0';
var acceptedActQueueRecordKinds = Object.freeze([
  'SchedulerActQueueRequest',
  'SchedulerActScopeBoundaryRecord',
  'SyncFlushActContinuationRecord'
]);
var acceptedActQueueTaskKinds = Object.freeze([
  'RootSchedule',
  'SchedulerCallback'
]);
var acceptedActQueueContinuationStatuses = Object.freeze([
  'NoContinuation',
  'PendingContinuation'
]);

function push(heap, node) {
  var index = heap.length;
  heap.push(node);
  while (index > 0) {
    var parentIndex = (index - 1) >>> 1;
    var parent = heap[parentIndex];
    if (compare(parent, node) > 0) {
      heap[parentIndex] = node;
      heap[index] = parent;
      index = parentIndex;
    } else {
      return;
    }
  }
}

function peek(heap) {
  return heap.length === 0 ? null : heap[0];
}

function pop(heap) {
  if (heap.length === 0) {
    return null;
  }
  var first = heap[0];
  var last = heap.pop();
  if (last !== first) {
    heap[0] = last;
    var index = 0;
    var length = heap.length;
    var halfLength = length >>> 1;
    while (index < halfLength) {
      var leftIndex = (index + 1) * 2 - 1;
      var left = heap[leftIndex];
      var rightIndex = leftIndex + 1;
      var right = heap[rightIndex];
      if (compare(left, last) < 0) {
        if (rightIndex < length && compare(right, left) < 0) {
          heap[index] = right;
          heap[rightIndex] = last;
          index = rightIndex;
        } else {
          heap[index] = left;
          heap[leftIndex] = last;
          index = leftIndex;
        }
      } else if (rightIndex < length && compare(right, last) < 0) {
        heap[index] = right;
        heap[rightIndex] = last;
        index = rightIndex;
      } else {
        break;
      }
    }
  }
  return first;
}

function compare(a, b) {
  var diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}

function advanceTimers(currentTime) {
  var timer = peek(timerQueue);
  while (timer !== null) {
    if (timer.callback === null) {
      pop(timerQueue);
    } else if (timer.startTime <= currentTime) {
      pop(timerQueue);
      timer.sortIndex = timer.expirationTime;
      push(taskQueue, timer);
    } else {
      return;
    }
    timer = peek(timerQueue);
  }
}

function handleTimeout(currentTime) {
  isHostTimeoutScheduled = false;
  advanceTimers(currentTime);
  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    } else {
      var firstTimer = peek(timerQueue);
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}

function flushWork(hasTimeRemaining, initialTime) {
  isHostCallbackScheduled = false;
  if (isHostTimeoutScheduled) {
    isHostTimeoutScheduled = false;
    cancelHostTimeout();
  }
  isPerformingWork = true;
  var previousPriorityLevel = currentPriorityLevel;
  try {
    return workLoop(hasTimeRemaining, initialTime);
  } finally {
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
  }
}

function workLoop(hasTimeRemaining, initialTime) {
  var currentTime = initialTime;
  advanceTimers(currentTime);
  currentTask = peek(taskQueue);
  while (currentTask !== null) {
    if (
      currentTask.expirationTime > currentTime &&
      (!hasTimeRemaining || shouldYieldToHost())
    ) {
      break;
    }
    var callback = currentTask.callback;
    if (typeof callback === 'function') {
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
      var didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      var continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime();
      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback;
        advanceTimers(currentTime);
        if (shouldYieldForPaint) {
          needsPaint = true;
          return true;
        }
      } else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
        advanceTimers(currentTime);
      }
    } else {
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }
  if (currentTask !== null) {
    return true;
  }
  var firstTimer = peek(timerQueue);
  if (firstTimer !== null) {
    requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
  }
  return false;
}

function requestHostCallback(callback) {
  scheduledCallback = callback;
}

function requestHostTimeout(callback, ms) {
  scheduledTimeout = callback;
  timeoutTime = currentMockTime + ms;
}

function cancelHostTimeout() {
  scheduledTimeout = null;
  timeoutTime = -1;
}

function shouldYieldToHost() {
  if (
    (expectedNumberOfYields === 0 && yieldedValues === null) ||
    (expectedNumberOfYields !== -1 &&
      yieldedValues !== null &&
      yieldedValues.length >= expectedNumberOfYields) ||
    (shouldYieldForPaint && needsPaint)
  ) {
    didStop = true;
    return true;
  }
  return false;
}

function setFunctionName(fn, name) {
  Object.defineProperty(fn, 'name', {
    configurable: true,
    value: name
  });
  return fn;
}

function isObjectLike(value) {
  return (
    (typeof value === 'object' && value !== null) ||
    typeof value === 'function'
  );
}

function includesString(value, expectedValues) {
  return typeof value === 'string' && expectedValues.indexOf(value) !== -1;
}

function getRejectedPrivateActQueueCallbackReason(callback, index, role) {
  if (callback === undefined || callback === null) {
    return null;
  }
  if (typeof callback !== 'function') {
    return 'record-' + index + '-' + role + '-not-function';
  }
  if (callback[privateActQueueTestCallbackBrand] !== true) {
    return 'record-' + index + '-' + role + '-missing-internal-brand';
  }
  if (callback.kind !== privateActQueueTestCallbackKind) {
    return 'record-' + index + '-' + role + '-kind';
  }
  if (callback.version !== privateActQueueTestQueueVersion) {
    return 'record-' + index + '-' + role + '-version';
  }
  if (callback.compatibilityTarget !== reactCompatibilityTarget) {
    return 'record-' + index + '-' + role + '-react-target';
  }
  if (callback.schedulerCompatibilityTarget !== schedulerCompatibilityTarget) {
    return 'record-' + index + '-' + role + '-scheduler-target';
  }
  if (typeof callback.label !== 'string') {
    return 'record-' + index + '-' + role + '-label';
  }
  if (
    callback.publicCompatibilityClaimed !== false ||
    callback.publicSchedulerTimingCompatibilityClaimed !== false ||
    callback.publicReactActCompatibilityClaimed !== false
  ) {
    return 'record-' + index + '-' + role + '-public-claim';
  }
  if (
    callback.executesQueuedWork !== false ||
    callback.executesEffects !== false
  ) {
    return 'record-' + index + '-' + role + '-execution-claim';
  }
  return null;
}

function getRejectedPrivateActQueueTaskReason(task, index) {
  if (!isObjectLike(task)) {
    return 'record-' + index + '-not-object';
  }
  if (task[privateActQueueTestTaskBrand] !== true) {
    return 'record-' + index + '-missing-internal-brand';
  }
  if (task.kind !== privateActQueueTestTaskKind) {
    return 'record-' + index + '-kind';
  }
  if (task.version !== privateActQueueTestQueueVersion) {
    return 'record-' + index + '-version';
  }
  if (task.compatibilityTarget !== reactCompatibilityTarget) {
    return 'record-' + index + '-react-target';
  }
  if (task.schedulerCompatibilityTarget !== schedulerCompatibilityTarget) {
    return 'record-' + index + '-scheduler-target';
  }
  if (!includesString(task.recordKind, acceptedActQueueRecordKinds)) {
    return 'record-' + index + '-record-kind';
  }
  if (!includesString(task.taskKind, acceptedActQueueTaskKinds)) {
    return 'record-' + index + '-task-kind';
  }
  if (
    !includesString(
      task.continuationStatus,
      acceptedActQueueContinuationStatuses
    )
  ) {
    return 'record-' + index + '-continuation-status';
  }
  if (typeof task.label !== 'string') {
    return 'record-' + index + '-label';
  }
  var rejectedCallbackReason = getRejectedPrivateActQueueCallbackReason(
    task.callback,
    index,
    'callback'
  );
  if (rejectedCallbackReason !== null) {
    return rejectedCallbackReason;
  }
  if (
    task.publicCompatibilityClaimed !== false ||
    task.publicSchedulerTimingCompatibilityClaimed !== false ||
    task.publicReactActCompatibilityClaimed !== false
  ) {
    return 'record-' + index + '-public-claim';
  }
  if (task.executesQueuedWork !== false || task.executesEffects !== false) {
    return 'record-' + index + '-execution-claim';
  }
  return null;
}

function getRejectedPrivateActQueueReason(queue) {
  if (!isObjectLike(queue)) {
    return 'queue-not-object';
  }
  if (queue[privateActQueueTestQueueBrand] !== true) {
    return 'queue-missing-internal-brand';
  }
  if (queue.kind !== privateActQueueTestQueueKind) {
    return 'queue-kind';
  }
  if (queue.version !== privateActQueueTestQueueVersion) {
    return 'queue-version';
  }
  if (queue.compatibilityTarget !== reactCompatibilityTarget) {
    return 'queue-react-target';
  }
  if (queue.schedulerCompatibilityTarget !== schedulerCompatibilityTarget) {
    return 'queue-scheduler-target';
  }
  if (
    queue.publicCompatibilityClaimed !== false ||
    queue.publicSchedulerTimingCompatibilityClaimed !== false ||
    queue.publicReactActCompatibilityClaimed !== false
  ) {
    return 'queue-public-claim';
  }
  if (
    queue.queueFlushingReady !== false ||
    queue.privateTestQueueFlushDiagnosticsReady !== true ||
    queue.drainsAcceptedInternalTestQueues !== true ||
    queue.executesBrandedInternalTestCallbacks !== true ||
    queue.recordsBrandedInternalTestContinuations !== true
  ) {
    return 'queue-drain-policy';
  }
  if (queue.executesQueuedWork !== false || queue.executesEffects !== false) {
    return 'queue-execution-claim';
  }
  if (!Array.isArray(queue.records)) {
    return 'queue-records-not-array';
  }

  for (var i = 0; i < queue.records.length; i++) {
    var rejectedTaskReason = getRejectedPrivateActQueueTaskReason(
      queue.records[i],
      i
    );
    if (rejectedTaskReason !== null) {
      return rejectedTaskReason;
    }
  }
  return null;
}

function createPrivateActQueueFlushError(reason) {
  var error = new Error(
    '[fast-react] scheduler/unstable_mock private act queue flush ' +
      'diagnostics rejected an unsupported queue: ' +
      reason +
      '. Only branded internal test queues from the React private act ' +
      'dispatcher gate may be drained.'
  );
  error.name = 'FastReactSchedulerPrivateActQueueFlushError';
  error.code = 'FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_REJECTED';
  error.entrypoint = 'scheduler/unstable_mock';
  error.compatibilityTarget = schedulerCompatibilityTarget;
  error.publicSchedulerTimingCompatibilityClaimed = false;
  error.publicReactActCompatibilityClaimed = false;
  return error;
}

function describeAcceptedInternalActQueue(queue) {
  var rejectionReason = getRejectedPrivateActQueueReason(queue);
  var pendingCount =
    isObjectLike(queue) && Array.isArray(queue.records)
      ? queue.records.length
      : 0;
  return Object.freeze({
    status:
      rejectionReason === null
        ? 'accepted-internal-test-queue'
        : 'rejected-internal-test-queue',
    accepted: rejectionReason === null,
    rejectionReason: rejectionReason,
    queueKind: isObjectLike(queue) ? queue.kind : null,
    pendingCount: pendingCount,
    drainsAcceptedInternalTestQueues: rejectionReason === null,
    executesBrandedInternalTestCallbacks: rejectionReason === null,
    recordsBrandedInternalTestContinuations: rejectionReason === null,
    executesBrandedInternalTestContinuations: rejectionReason === null,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false
  });
}

function summarizePrivateActQueueCallback(callback) {
  return Object.freeze({
    kind: callback.kind,
    label: callback.label,
    executesQueuedWork: false,
    executesEffects: false
  });
}

function summarizePrivateActQueueRecordedContinuation(continuation) {
  return Object.freeze({
    status: 'recorded-branded-internal-test-continuation',
    continuation: summarizePrivateActQueueCallback(continuation),
    executesQueuedWork: false,
    executesEffects: false
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

function summarizeMockSchedulerTask(task, snapshotTime) {
  var callback = task.callback;
  var callbackStatus =
    callback === null
      ? 'cancelled-tombstone'
      : typeof callback === 'function'
        ? 'pending-callback'
        : 'unknown-callback';
  return Object.freeze({
    id: task.id,
    priorityLevel: task.priorityLevel,
    startTime: task.startTime,
    expirationTime: task.expirationTime,
    sortIndex: task.sortIndex,
    expired: task.expirationTime <= snapshotTime,
    callbackStatus: callbackStatus,
    callback: summarizeMockSchedulerCallback(callback)
  });
}

function getMockSchedulerTaskQueueSnapshot(snapshotTime) {
  return Object.freeze(
    taskQueue
      .slice()
      .sort(compare)
      .map(function (task) {
        return summarizeMockSchedulerTask(task, snapshotTime);
      })
  );
}

function countMockSchedulerTasksByCallbackStatus(tasks, callbackStatus) {
  return tasks.filter(function (task) {
    return task.callbackStatus === callbackStatus;
  }).length;
}

function countExpiredMockSchedulerCallbacks(tasks) {
  return tasks.filter(function (task) {
    return task.expired && task.callbackStatus === 'pending-callback';
  }).length;
}

function drainExpiredMockSchedulerWork() {
  if (isFlushing) {
    throw new Error('Already flushing work.');
  }

  var pendingBefore = scheduledCallback !== null;
  var nowBefore = currentMockTime;
  var priorityLevelBefore = currentPriorityLevel;
  var taskQueueBefore = getMockSchedulerTaskQueueSnapshot(nowBefore);
  var hasMoreWorkAfterDrain = false;
  var flushedExpiredWork = false;

  if (scheduledCallback !== null) {
    isFlushing = true;
    try {
      hasMoreWorkAfterDrain = scheduledCallback(false, currentMockTime);
      flushedExpiredWork = true;
      if (!hasMoreWorkAfterDrain) {
        scheduledCallback = null;
      }
    } finally {
      isFlushing = false;
    }
  }

  var nowAfter = currentMockTime;
  var taskQueueAfter = getMockSchedulerTaskQueueSnapshot(nowAfter);
  return Object.freeze({
    status: 'drained-expired-mock-scheduler-work-for-diagnostics',
    pendingBefore: pendingBefore,
    pendingAfter: scheduledCallback !== null,
    flushedExpiredWork: flushedExpiredWork,
    hasMoreWorkAfterDrain: hasMoreWorkAfterDrain,
    nowBefore: nowBefore,
    nowAfter: nowAfter,
    priorityLevelBefore: priorityLevelBefore,
    priorityLevelAfter: currentPriorityLevel,
    expiredCallbackCountBefore:
      countExpiredMockSchedulerCallbacks(taskQueueBefore),
    expiredCallbackCountAfter:
      countExpiredMockSchedulerCallbacks(taskQueueAfter),
    cancelledTombstoneCountBefore:
      countMockSchedulerTasksByCallbackStatus(
        taskQueueBefore,
        'cancelled-tombstone'
      ),
    cancelledTombstoneCountAfter:
      countMockSchedulerTasksByCallbackStatus(
        taskQueueAfter,
        'cancelled-tombstone'
      ),
    taskQueueBefore: taskQueueBefore,
    taskQueueAfter: taskQueueAfter,
    drainsExpiredMockSchedulerWork: true,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false
  });
}

function executePrivateActQueueContinuation(task, index, continuation) {
  var returnedContinuation = continuation(false);
  var returnedContinuationSummary = null;
  if (returnedContinuation !== undefined && returnedContinuation !== null) {
    var rejectedReturnedContinuationReason =
      getRejectedPrivateActQueueCallbackReason(
        returnedContinuation,
        index,
        'continuation'
      );
    if (rejectedReturnedContinuationReason !== null) {
      throw createPrivateActQueueFlushError(
        rejectedReturnedContinuationReason
      );
    }
    returnedContinuationSummary =
      summarizePrivateActQueueRecordedContinuation(returnedContinuation);
  }

  return Object.freeze({
    sourceIndex: index,
    sourceLabel: task.label,
    status: 'executed-branded-internal-test-continuation',
    continuation: summarizePrivateActQueueCallback(continuation),
    returnedContinuation: returnedContinuationSummary,
    executesQueuedWork: false,
    executesEffects: false
  });
}

function summarizePrivateActQueueTask(
  task,
  index,
  recordedContinuations,
  executedContinuations
) {
  var callback = task.callback;
  var hasCallback = callback !== undefined && callback !== null;
  var callbackSummary = null;
  var callbackStatus = hasCallback
    ? 'executed-branded-internal-test-callback'
    : 'no-callback';
  var continuationSummary = null;

  if (hasCallback) {
    callbackSummary = summarizePrivateActQueueCallback(callback);
    var continuation = callback(false);
    if (continuation !== undefined && continuation !== null) {
      var rejectedContinuationReason =
        getRejectedPrivateActQueueCallbackReason(
          continuation,
          index,
          'continuation'
        );
      if (rejectedContinuationReason !== null) {
        throw createPrivateActQueueFlushError(rejectedContinuationReason);
      }
      continuationSummary = executePrivateActQueueContinuation(
        task,
        index,
        continuation
      );
      recordedContinuations.push(continuationSummary);
      executedContinuations.push(continuationSummary);
    }
  }

  return Object.freeze({
    index: index,
    label: task.label,
    recordKind: task.recordKind,
    taskKind: task.taskKind,
    continuationStatus: task.continuationStatus,
    callbackStatus: callbackStatus,
    callback: callbackSummary,
    returnedContinuation: continuationSummary,
    executesQueuedWork: false,
    executesEffects: false
  });
}

function drainAcceptedInternalActQueue(queue) {
  var rejectionReason = getRejectedPrivateActQueueReason(queue);
  if (rejectionReason !== null) {
    throw createPrivateActQueueFlushError(rejectionReason);
  }
  if (isPrivateActQueueDraining) {
    throw createPrivateActQueueFlushError('already-draining');
  }

  var pendingBefore = queue.records.length;
  var mockSchedulerPendingBefore = scheduledCallback !== null;
  var mockSchedulerNowBefore = currentMockTime;
  var drainedRecords = [];
  var recordedContinuations = [];
  var executedContinuations = [];

  isPrivateActQueueDraining = true;
  try {
    while (queue.records.length > 0) {
      var task = queue.records.shift();
      var rejectedTaskReason = getRejectedPrivateActQueueTaskReason(
        task,
        drainedRecords.length
      );
      if (rejectedTaskReason !== null) {
        throw createPrivateActQueueFlushError(rejectedTaskReason);
      }
      drainedRecords.push(
        summarizePrivateActQueueTask(
          task,
          drainedRecords.length,
          recordedContinuations,
          executedContinuations
        )
      );
    }

    return Object.freeze({
      status: 'drained-accepted-internal-test-queue',
      accepted: true,
      queueKind: queue.kind,
      pendingBefore: pendingBefore,
      drainedCount: drainedRecords.length,
      executedCallbackCount: drainedRecords.filter(function (record) {
        return (
          record.callbackStatus ===
          'executed-branded-internal-test-callback'
        );
      }).length,
      recordedContinuationCount: recordedContinuations.length,
      executedContinuationCount: executedContinuations.length,
      remainingCount: queue.records.length,
      drainedRecords: Object.freeze(drainedRecords),
      recordedContinuations: Object.freeze(recordedContinuations),
      executedContinuations: Object.freeze(executedContinuations),
      mockSchedulerPendingWorkBefore: mockSchedulerPendingBefore,
      mockSchedulerPendingWorkAfter: scheduledCallback !== null,
      mockSchedulerNowBefore: mockSchedulerNowBefore,
      mockSchedulerNowAfter: currentMockTime,
      drainsPublicSchedulerTaskQueue: false,
      drainsPublicReactActQueue: false,
      executesBrandedInternalTestCallbacks: true,
      recordsBrandedInternalTestContinuations: true,
      executesBrandedInternalTestContinuations: true,
      publicSchedulerTimingCompatibilityClaimed: false,
      publicReactActCompatibilityClaimed: false,
      executesQueuedWork: false,
      executesEffects: false
    });
  } finally {
    isPrivateActQueueDraining = false;
  }
}

var privateActQueueFlushDiagnostics = Object.freeze({
  status: 'private-scheduler-act-queue-flush-diagnostics',
  exportName: privateActQueueFlushDiagnosticsExport,
  queueKind: privateActQueueTestQueueKind,
  taskKind: privateActQueueTestTaskKind,
  callbackKind: privateActQueueTestCallbackKind,
  queueVersion: privateActQueueTestQueueVersion,
  compatibilityTarget: schedulerCompatibilityTarget,
  reactCompatibilityTarget: reactCompatibilityTarget,
  acceptedRecordKinds: acceptedActQueueRecordKinds,
  acceptedTaskKinds: acceptedActQueueTaskKinds,
  acceptedContinuationStatuses: acceptedActQueueContinuationStatuses,
  drainsAcceptedInternalTestQueues: true,
  executesBrandedInternalTestCallbacks: true,
  recordsBrandedInternalTestContinuations: true,
  executesBrandedInternalTestContinuations: true,
  mockSchedulerExpiredWorkDiagnosticsReady: true,
  drainsExpiredMockSchedulerWork: true,
  drainsPublicSchedulerTaskQueue: false,
  drainsPublicReactActQueue: false,
  publicSchedulerTimingCompatibilityClaimed: false,
  publicReactActCompatibilityClaimed: false,
  executesQueuedWork: false,
  executesEffects: false,
  describeAcceptedInternalActQueue: describeAcceptedInternalActQueue,
  drainAcceptedInternalActQueue: drainAcceptedInternalActQueue,
  drainExpiredMockSchedulerWork: drainExpiredMockSchedulerWork
});

function attachPrivateActQueueFlushDiagnostics(fn) {
  Object.defineProperty(fn, privateActQueueFlushDiagnosticsExport, {
    value: privateActQueueFlushDiagnostics
  });
}

var getCurrentTime = setFunctionName(function () {
  return currentMockTime;
}, '');

var log = setFunctionName(function (value) {
  if (console.log.name === 'disabledLog' || disableYieldValue) {
    return;
  }
  if (yieldedValues === null) {
    yieldedValues = [value];
  } else {
    yieldedValues.push(value);
  }
}, '');

var reset = setFunctionName(function () {
  if (isFlushing) {
    throw new Error('Cannot reset while already flushing work.');
  }
  currentMockTime = 0;
  scheduledCallback = null;
  scheduledTimeout = null;
  timeoutTime = -1;
  yieldedValues = null;
  expectedNumberOfYields = -1;
  didStop = false;
  isFlushing = false;
  needsPaint = false;
}, '');

var unstable_advanceTime = setFunctionName(function (ms) {
  if (console.log.name === 'disabledLog' || disableYieldValue) {
    return;
  }
  currentMockTime += ms;
  if (scheduledTimeout !== null && timeoutTime <= currentMockTime) {
    scheduledTimeout(currentMockTime);
    timeoutTime = -1;
    scheduledTimeout = null;
  }
}, '');

var unstable_cancelCallback = setFunctionName(function (task) {
  task.callback = null;
}, '');

var unstable_clearLog = setFunctionName(function () {
  if (yieldedValues === null) {
    return [];
  }
  var values = yieldedValues;
  yieldedValues = null;
  return values;
}, '');

var unstable_flushAll = setFunctionName(function () {
  if (yieldedValues !== null) {
    throw new Error(
      'Log is not empty. Assert on the log of yielded values before ' +
        'flushing additional work.'
    );
  }
  unstable_flushAllWithoutAsserting();
  if (yieldedValues !== null) {
    throw new Error(
      'While flushing work, something yielded a value. Use an ' +
        'assertion helper to assert on the log of yielded values, e.g. ' +
        'expect(Scheduler).toFlushAndYield([...])'
    );
  }
}, '');

function unstable_flushAllWithoutAsserting() {
  if (isFlushing) {
    throw new Error('Already flushing work.');
  }
  if (scheduledCallback !== null) {
    var cb = scheduledCallback;
    isFlushing = true;
    try {
      var hasMoreWork = true;
      do {
        hasMoreWork = cb(true, currentMockTime);
      } while (hasMoreWork);
      if (!hasMoreWork) {
        scheduledCallback = null;
      }
      return true;
    } finally {
      isFlushing = false;
    }
  }
  return false;
}

var unstable_flushExpired = setFunctionName(function () {
  if (isFlushing) {
    throw new Error('Already flushing work.');
  }
  if (scheduledCallback !== null) {
    isFlushing = true;
    try {
      var hasMoreWork = scheduledCallback(false, currentMockTime);
      if (!hasMoreWork) {
        scheduledCallback = null;
      }
    } finally {
      isFlushing = false;
    }
  }
}, '');

var unstable_flushNumberOfYields = setFunctionName(function (count) {
  if (isFlushing) {
    throw new Error('Already flushing work.');
  }
  if (scheduledCallback !== null) {
    var cb = scheduledCallback;
    expectedNumberOfYields = count;
    isFlushing = true;
    try {
      var hasMoreWork = true;
      do {
        hasMoreWork = cb(true, currentMockTime);
      } while (hasMoreWork && !didStop);
      if (!hasMoreWork) {
        scheduledCallback = null;
      }
    } finally {
      expectedNumberOfYields = -1;
      didStop = false;
      isFlushing = false;
    }
  }
}, '');

var unstable_flushUntilNextPaint = setFunctionName(function () {
  if (isFlushing) {
    throw new Error('Already flushing work.');
  }
  if (scheduledCallback !== null) {
    var cb = scheduledCallback;
    shouldYieldForPaint = true;
    needsPaint = false;
    isFlushing = true;
    try {
      var hasMoreWork = true;
      do {
        hasMoreWork = cb(true, currentMockTime);
      } while (hasMoreWork && !didStop);
      if (!hasMoreWork) {
        scheduledCallback = null;
      }
    } finally {
      shouldYieldForPaint = false;
      didStop = false;
      isFlushing = false;
    }
  }
  return false;
}, '');

var unstable_forceFrameRate = setFunctionName(function () {}, '');

var unstable_getCurrentPriorityLevel = setFunctionName(function () {
  return currentPriorityLevel;
}, '');

var unstable_hasPendingWork = setFunctionName(function () {
  return scheduledCallback !== null;
}, '');

var unstable_next = setFunctionName(function (eventHandler) {
  var priorityLevel;
  switch (currentPriorityLevel) {
    case ImmediatePriority:
    case UserBlockingPriority:
    case NormalPriority:
      priorityLevel = NormalPriority;
      break;
    default:
      priorityLevel = currentPriorityLevel;
      break;
  }
  var previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;
  try {
    return eventHandler();
  } finally {
    currentPriorityLevel = previousPriorityLevel;
  }
}, '');

var unstable_requestPaint = setFunctionName(function () {
  needsPaint = true;
}, '');

var unstable_runWithPriority = setFunctionName(function (
  priorityLevel,
  eventHandler
) {
  switch (priorityLevel) {
    case ImmediatePriority:
    case UserBlockingPriority:
    case NormalPriority:
    case LowPriority:
    case IdlePriority:
      break;
    default:
      priorityLevel = NormalPriority;
      break;
  }
  var previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;
  try {
    return eventHandler();
  } finally {
    currentPriorityLevel = previousPriorityLevel;
  }
}, '');

var unstable_scheduleCallback = setFunctionName(function (
  priorityLevel,
  callback,
  options
) {
  var currentTime = getCurrentTime();
  var startTime;
  if (typeof options === 'object' && options !== null) {
    var delay = options.delay;
    if (typeof delay === 'number' && delay > 0) {
      startTime = currentTime + delay;
    } else {
      startTime = currentTime;
    }
  } else {
    startTime = currentTime;
  }

  var timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT;
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
      break;
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT;
      break;
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT;
      break;
    case NormalPriority:
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT;
      break;
  }

  var expirationTime = startTime + timeout;
  var newTask = {
    id: taskIdCounter++,
    callback: callback,
    priorityLevel: priorityLevel,
    startTime: startTime,
    expirationTime: expirationTime,
    sortIndex: -1
  };

  if (startTime > currentTime) {
    newTask.sortIndex = startTime;
    push(timerQueue, newTask);
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      if (isHostTimeoutScheduled) {
        cancelHostTimeout();
      } else {
        isHostTimeoutScheduled = true;
      }
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    }
  }

  return newTask;
}, '');

var unstable_setDisableYieldValue = setFunctionName(function (newValue) {
  disableYieldValue = newValue;
}, '');

var unstable_wrapCallback = setFunctionName(function (callback) {
  var parentPriorityLevel = currentPriorityLevel;
  return function () {
    var previousPriorityLevel = currentPriorityLevel;
    currentPriorityLevel = parentPriorityLevel;
    try {
      return callback.apply(this, arguments);
    } finally {
      currentPriorityLevel = previousPriorityLevel;
    }
  };
}, '');

attachPrivateActQueueFlushDiagnostics(unstable_flushAll);
attachPrivateActQueueFlushDiagnostics(unstable_flushAllWithoutAsserting);
attachPrivateActQueueFlushDiagnostics(unstable_flushExpired);
attachPrivateActQueueFlushDiagnostics(unstable_flushNumberOfYields);
attachPrivateActQueueFlushDiagnostics(unstable_flushUntilNextPaint);

exports.log = log;
exports.reset = reset;
exports.unstable_IdlePriority = IdlePriority;
exports.unstable_ImmediatePriority = ImmediatePriority;
exports.unstable_LowPriority = LowPriority;
exports.unstable_NormalPriority = NormalPriority;
exports.unstable_Profiling = null;
exports.unstable_UserBlockingPriority = UserBlockingPriority;
exports.unstable_advanceTime = unstable_advanceTime;
exports.unstable_cancelCallback = unstable_cancelCallback;
exports.unstable_clearLog = unstable_clearLog;
exports.unstable_flushAll = unstable_flushAll;
exports.unstable_flushAllWithoutAsserting =
  unstable_flushAllWithoutAsserting;
exports.unstable_flushExpired = unstable_flushExpired;
exports.unstable_flushNumberOfYields = unstable_flushNumberOfYields;
exports.unstable_flushUntilNextPaint = unstable_flushUntilNextPaint;
exports.unstable_forceFrameRate = unstable_forceFrameRate;
exports.unstable_getCurrentPriorityLevel =
  unstable_getCurrentPriorityLevel;
exports.unstable_hasPendingWork = unstable_hasPendingWork;
exports.unstable_next = unstable_next;
exports.unstable_now = getCurrentTime;
exports.unstable_requestPaint = unstable_requestPaint;
exports.unstable_runWithPriority = unstable_runWithPriority;
exports.unstable_scheduleCallback = unstable_scheduleCallback;
exports.unstable_setDisableYieldValue = unstable_setDisableYieldValue;
exports.unstable_shouldYield = shouldYieldToHost;
exports.unstable_wrapCallback = unstable_wrapCallback;
