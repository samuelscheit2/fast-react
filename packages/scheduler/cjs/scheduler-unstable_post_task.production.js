/**
 * @license React
 * scheduler-unstable_post_task.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";
var perf = window.performance,
  setTimeout = window.setTimeout,
  scheduler = global.scheduler,
  getCurrentTime = perf.now.bind(perf),
  deadline = 0,
  currentPriorityLevel_DEPRECATED = 3,
  schedulerCompatibilityTarget = "scheduler@0.27.0",
  privatePostTaskPriorityDiagnosticsExport =
    "__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__",
  privatePostTaskPriorityDiagnosticsSymbolDescription =
    "fast-react.scheduler.unstable_post_task.priority-diagnostics",
  privatePostTaskPriorityDiagnosticsSymbol = Symbol.for(
    privatePostTaskPriorityDiagnosticsSymbolDescription
  ),
  privatePostTaskPriorityDiagnosticsByNode = new WeakMap(),
  enablePrivatePostTaskPriorityDiagnostics =
    global.__FAST_REACT_ENABLE_POST_TASK_PRIORITY_DIAGNOSTICS__ === true;
function runTask(priorityLevel, postTaskPriority, node, callback) {
  deadline = getCurrentTime() + 5;
  try {
    currentPriorityLevel_DEPRECATED = priorityLevel;
    recordPrivatePostTaskCallbackRun(node, priorityLevel, postTaskPriority);
    var result = callback(!1);
    if ("function" === typeof result) {
      var continuationOptions = { signal: node._controller.signal },
        nextTask = runTask.bind(
          null,
          priorityLevel,
          postTaskPriority,
          node,
          result
        );
      recordPrivatePostTaskContinuationFallback(
        node,
        priorityLevel,
        postTaskPriority,
        continuationOptions,
        void 0 !== scheduler.yield ? "scheduler.yield" : "scheduler.postTask"
      );
      void 0 !== scheduler.yield
        ? scheduler
            .yield(continuationOptions)
            .then(nextTask)
            .catch(handleAbortError)
        : scheduler
            .postTask(nextTask, continuationOptions)
            .catch(handleAbortError);
    }
  } catch (error) {
    setTimeout(function () {
      throw error;
    });
  } finally {
    currentPriorityLevel_DEPRECATED = 3;
  }
}
function handleAbortError() {}
function createPrivatePostTaskPriorityRecord(
  priorityLevel,
  postTaskPriority,
  postTaskOptions,
  controller
) {
  return {
    status: "private-scheduler-post-task-priority-diagnostics",
    version: 1,
    exportName: privatePostTaskPriorityDiagnosticsExport,
    symbolDescription: privatePostTaskPriorityDiagnosticsSymbolDescription,
    entrypoint: "scheduler/unstable_post_task",
    compatibilityTarget: schedulerCompatibilityTarget,
    diagnosticKind: "shimmed-task-controller-priority",
    schedule: {
      status: "scheduled-shimmed-task-controller",
      priorityLevel: priorityLevel,
      postTaskPriority: postTaskPriority,
      delay: describePrivatePostTaskDelay(postTaskOptions),
      controller: describePrivatePostTaskController(controller),
      signal: describePrivatePostTaskSignal(controller.signal)
    },
    cancellation: null,
    callbackRuns: [],
    continuationFallbacks: [],
    shimmedTaskControllerScheduling: true,
    shimmedTaskControllerCancellation: false,
    continuationFallbackDiagnostics: false,
    browserPostTaskCompatibilityClaimed: false,
    browserTaskOrderingCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  };
}
function attachPrivatePostTaskPriorityDiagnostics(node, record) {
  privatePostTaskPriorityDiagnosticsByNode.set(node, record);
  Object.defineProperty(node, privatePostTaskPriorityDiagnosticsSymbol, {
    value: function () {
      return snapshotPrivatePostTaskPriorityRecord(record);
    }
  });
}
function getPrivatePostTaskPriorityRecord(node) {
  return privatePostTaskPriorityDiagnosticsByNode.get(node) || null;
}
function recordPrivatePostTaskCallbackRun(
  node,
  priorityLevel,
  postTaskPriority
) {
  var record = getPrivatePostTaskPriorityRecord(node);
  if (null === record) {
    return;
  }
  record.callbackRuns.push({
    status: "ran-shimmed-post-task-callback",
    runIndex: record.callbackRuns.length,
    priorityLevel: priorityLevel,
    postTaskPriority: postTaskPriority,
    currentPriorityLevel: currentPriorityLevel_DEPRECATED,
    didTimeout: false,
    shouldYieldAtStart: getCurrentTime() >= deadline,
    signal: describePrivatePostTaskSignal(node._controller.signal)
  });
}
function recordPrivatePostTaskContinuationFallback(
  node,
  priorityLevel,
  postTaskPriority,
  continuationOptions,
  fallback
) {
  var record = getPrivatePostTaskPriorityRecord(node);
  if (null === record) {
    return;
  }
  record.continuationFallbackDiagnostics = true;
  record.continuationFallbacks.push({
    status: "scheduled-shimmed-post-task-continuation",
    continuationIndex: record.continuationFallbacks.length,
    fallback: fallback,
    priorityLevel: priorityLevel,
    postTaskPriority: postTaskPriority,
    reusesOriginalSignal: continuationOptions.signal === node._controller.signal,
    signal: describePrivatePostTaskSignal(continuationOptions.signal),
    browserPostTaskCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
}
function recordPrivatePostTaskCancellation(node) {
  var record = getPrivatePostTaskPriorityRecord(node);
  if (null === record) {
    return;
  }
  record.shimmedTaskControllerCancellation = true;
  record.cancellation = {
    status: "cancelled-shimmed-task-controller",
    signal: describePrivatePostTaskSignal(node._controller.signal),
    abortObserved: node._controller.signal.aborted === true,
    browserPostTaskCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  };
}
function describePrivatePostTaskDelay(postTaskOptions) {
  var delay = postTaskOptions.delay;
  return {
    hasDelayProperty: Object.prototype.hasOwnProperty.call(
      postTaskOptions,
      "delay"
    ),
    type: typeof delay,
    value: void 0 === delay ? null : delay
  };
}
function describePrivatePostTaskController(controller) {
  return {
    type: typeof controller,
    constructorName:
      controller &&
      controller.constructor &&
      "string" === typeof controller.constructor.name
        ? controller.constructor.name
        : null,
    ownKeys:
      controller && "object" === typeof controller ? Object.keys(controller) : []
  };
}
function describePrivatePostTaskSignal(signal) {
  return {
    id: signal && void 0 !== signal.id ? signal.id : null,
    priority: signal && void 0 !== signal.priority ? signal.priority : null,
    aborted: !!(signal && signal.aborted === true),
    ownKeys: signal && "object" === typeof signal ? Object.keys(signal) : []
  };
}
function snapshotPrivatePostTaskPriorityRecord(record) {
  return freezePrivatePostTaskDiagnosticValue({
    status: record.status,
    version: record.version,
    exportName: record.exportName,
    symbolDescription: record.symbolDescription,
    entrypoint: record.entrypoint,
    compatibilityTarget: record.compatibilityTarget,
    diagnosticKind: record.diagnosticKind,
    schedule: record.schedule,
    cancellation: record.cancellation,
    callbackRuns: record.callbackRuns,
    continuationFallbacks: record.continuationFallbacks,
    shimmedTaskControllerScheduling: record.shimmedTaskControllerScheduling,
    shimmedTaskControllerCancellation: record.shimmedTaskControllerCancellation,
    continuationFallbackDiagnostics: record.continuationFallbackDiagnostics,
    browserPostTaskCompatibilityClaimed:
      record.browserPostTaskCompatibilityClaimed,
    browserTaskOrderingCompatibilityClaimed:
      record.browserTaskOrderingCompatibilityClaimed,
    publicSchedulerTimingCompatibilityClaimed:
      record.publicSchedulerTimingCompatibilityClaimed,
    compatibilityClaimed: record.compatibilityClaimed
  });
}
function freezePrivatePostTaskDiagnosticValue(value) {
  var key, clone, index;
  if (Array.isArray(value)) {
    clone = [];
    for (index = 0; index < value.length; index++)
      clone.push(freezePrivatePostTaskDiagnosticValue(value[index]));
    return Object.freeze(clone);
  }
  if (null === value || "object" !== typeof value) {
    return value;
  }
  clone = {};
  var keys = Object.keys(value);
  for (index = 0; index < keys.length; index++) {
    key = keys[index];
    clone[key] = freezePrivatePostTaskDiagnosticValue(value[key]);
  }
  return Object.freeze(clone);
}
exports.unstable_IdlePriority = 5;
exports.unstable_ImmediatePriority = 1;
exports.unstable_LowPriority = 4;
exports.unstable_NormalPriority = 3;
exports.unstable_Profiling = null;
exports.unstable_UserBlockingPriority = 2;
exports.unstable_cancelCallback = function (node) {
  node._controller.abort();
  recordPrivatePostTaskCancellation(node);
};
exports.unstable_forceFrameRate = function () {};
exports.unstable_getCurrentPriorityLevel = function () {
  return currentPriorityLevel_DEPRECATED;
};
exports.unstable_next = function (callback) {
  switch (currentPriorityLevel_DEPRECATED) {
    case 1:
    case 2:
    case 3:
      var priorityLevel = 3;
      break;
    default:
      priorityLevel = currentPriorityLevel_DEPRECATED;
  }
  var previousPriorityLevel = currentPriorityLevel_DEPRECATED;
  currentPriorityLevel_DEPRECATED = priorityLevel;
  try {
    return callback();
  } finally {
    currentPriorityLevel_DEPRECATED = previousPriorityLevel;
  }
};
exports.unstable_now = getCurrentTime;
exports.unstable_requestPaint = function () {};
exports.unstable_runWithPriority = function (priorityLevel, callback) {
  var previousPriorityLevel = currentPriorityLevel_DEPRECATED;
  currentPriorityLevel_DEPRECATED = priorityLevel;
  try {
    return callback();
  } finally {
    currentPriorityLevel_DEPRECATED = previousPriorityLevel;
  }
};
exports.unstable_scheduleCallback = function (
  priorityLevel,
  callback,
  options
) {
  switch (priorityLevel) {
    case 1:
    case 2:
      var postTaskPriority = "user-blocking";
      break;
    case 4:
    case 3:
      postTaskPriority = "user-visible";
      break;
    case 5:
      postTaskPriority = "background";
      break;
    default:
      postTaskPriority = "user-visible";
  }
  var controller = new TaskController({ priority: postTaskPriority });
  options = {
    delay: "object" === typeof options && null !== options ? options.delay : 0,
    signal: controller.signal
  };
  controller = { _controller: controller };
  enablePrivatePostTaskPriorityDiagnostics &&
    attachPrivatePostTaskPriorityDiagnostics(
      controller,
      createPrivatePostTaskPriorityRecord(
        priorityLevel,
        postTaskPriority,
        options,
        controller._controller
      )
    );
  scheduler
    .postTask(
      runTask.bind(null, priorityLevel, postTaskPriority, controller, callback),
      options
    )
    .catch(handleAbortError);
  return controller;
};
exports.unstable_shouldYield = function () {
  return getCurrentTime() >= deadline;
};
exports.unstable_wrapCallback = function (callback) {
  var parentPriorityLevel = currentPriorityLevel_DEPRECATED;
  return function () {
    var previousPriorityLevel = currentPriorityLevel_DEPRECATED;
    currentPriorityLevel_DEPRECATED = parentPriorityLevel;
    try {
      return callback();
    } finally {
      currentPriorityLevel_DEPRECATED = previousPriorityLevel;
    }
  };
};
