'use strict';

if (process.env.NODE_ENV !== 'production') {
  (function () {
    function push(heap, node) {
      var index = heap.length;
      heap.push(node);
      while (0 < index) {
        var parentIndex = (index - 1) >>> 1;
        var parent = heap[parentIndex];
        if (0 < compare(parent, node)) {
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
          var leftIndex = 2 * (index + 1) - 1;
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
            return first;
          }
        }
      }
      return first;
    }

    function compare(a, b) {
      var diff = a.sortIndex - b.sortIndex;
      return diff !== 0 ? diff : a.id - b.id;
    }

    var getCurrentTime;
    if (
      typeof performance === 'object' &&
      typeof performance.now === 'function'
    ) {
      var localPerformance = performance;
      getCurrentTime = function () {
        return localPerformance.now();
      };
    } else {
      var localDate = Date;
      var initialTime = localDate.now();
      getCurrentTime = function () {
        return localDate.now() - initialTime;
      };
    }

    var taskQueue = [];
    var timerQueue = [];
    var taskIdCounter = 1;
    var currentTask = null;
    var currentPriorityLevel = 3;
    var isPerformingWork = false;
    var isHostCallbackScheduled = false;
    var isHostTimeoutScheduled = false;
    var needsPaint = false;
    var localSetTimeout = typeof setTimeout === 'function' ? setTimeout : null;
    var localClearTimeout =
      typeof clearTimeout === 'function' ? clearTimeout : null;
    var localSetImmediate =
      typeof setImmediate !== 'undefined' ? setImmediate : null;
    var isMessageLoopRunning = false;
    var taskTimeoutID = -1;
    var frameInterval = 5;
    var startTime = -1;

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
          if (!isMessageLoopRunning) {
            isMessageLoopRunning = true;
            schedulePerformWorkUntilDeadline();
          }
        } else {
          var firstTimer = peek(timerQueue);
          if (firstTimer !== null) {
            requestHostTimeout(
              handleTimeout,
              firstTimer.startTime - currentTime
            );
          }
        }
      }
    }

    function unstable_scheduleCallback$1(priorityLevel, callback, options) {
      var currentTime = getCurrentTime();
      var startTime;
      if (typeof options === 'object' && options !== null) {
        var delay = options.delay;
        startTime =
          typeof delay === 'number' && 0 < delay
            ? currentTime + delay
            : currentTime;
      } else {
        startTime = currentTime;
      }

      var timeout;
      switch (priorityLevel) {
        case 1:
          timeout = -1;
          break;
        case 2:
          timeout = 250;
          break;
        case 5:
          timeout = 1073741823;
          break;
        case 4:
          timeout = 10000;
          break;
        default:
          timeout = 5000;
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
            localClearTimeout(taskTimeoutID);
            taskTimeoutID = -1;
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
          if (!isMessageLoopRunning) {
            isMessageLoopRunning = true;
            schedulePerformWorkUntilDeadline();
          }
        }
      }

      return newTask;
    }

    function unstable_cancelCallback$1(task) {
      task.callback = null;
    }

    function unstable_getCurrentPriorityLevel$1() {
      return currentPriorityLevel;
    }

    function shouldYieldToHost() {
      return needsPaint
        ? true
        : getCurrentTime() - startTime < frameInterval
          ? false
          : true;
    }

    function requestPaint() {
      needsPaint = true;
    }

    function requestHostTimeout(callback, ms) {
      taskTimeoutID = localSetTimeout(function () {
        callback(getCurrentTime());
      }, ms);
    }

    function performWorkUntilDeadline() {
      needsPaint = false;
      if (isMessageLoopRunning) {
        var currentTime = getCurrentTime();
        startTime = currentTime;
        var hasMoreWork = true;
        try {
          isHostCallbackScheduled = false;
          if (isHostTimeoutScheduled) {
            isHostTimeoutScheduled = false;
            localClearTimeout(taskTimeoutID);
            taskTimeoutID = -1;
          }
          isPerformingWork = true;
          var previousPriorityLevel = currentPriorityLevel;
          try {
            advanceTimers(currentTime);
            currentTask = peek(taskQueue);
            while (
              currentTask !== null &&
              !(
                currentTask.expirationTime > currentTime &&
                shouldYieldToHost()
              )
            ) {
              var callback = currentTask.callback;
              if (typeof callback === 'function') {
                currentTask.callback = null;
                currentPriorityLevel = currentTask.priorityLevel;
                var continuationCallback = callback(
                  currentTask.expirationTime <= currentTime
                );
                currentTime = getCurrentTime();
                if (typeof continuationCallback === 'function') {
                  currentTask.callback = continuationCallback;
                  advanceTimers(currentTime);
                  return;
                }
                if (currentTask === peek(taskQueue)) {
                  pop(taskQueue);
                }
                advanceTimers(currentTime);
              } else {
                pop(taskQueue);
              }
              currentTask = peek(taskQueue);
            }

            if (currentTask !== null) {
              hasMoreWork = true;
            } else {
              var firstTimer = peek(timerQueue);
              if (firstTimer !== null) {
                requestHostTimeout(
                  handleTimeout,
                  firstTimer.startTime - currentTime
                );
              }
              hasMoreWork = false;
            }
          } finally {
            currentTask = null;
            currentPriorityLevel = previousPriorityLevel;
            isPerformingWork = false;
          }
        } finally {
          if (hasMoreWork) {
            schedulePerformWorkUntilDeadline();
          } else {
            isMessageLoopRunning = false;
          }
        }
      }
    }

    var schedulePerformWorkUntilDeadline;
    if (typeof localSetImmediate === 'function') {
      schedulePerformWorkUntilDeadline = function () {
        localSetImmediate(performWorkUntilDeadline);
      };
    } else if (typeof MessageChannel !== 'undefined') {
      var channel = new MessageChannel();
      var port = channel.port2;
      channel.port1.onmessage = performWorkUntilDeadline;
      schedulePerformWorkUntilDeadline = function () {
        port.postMessage(null);
      };
    } else {
      schedulePerformWorkUntilDeadline = function () {
        localSetTimeout(performWorkUntilDeadline, 0);
      };
    }

    var nativeScheduler =
      typeof nativeRuntimeScheduler !== 'undefined'
        ? nativeRuntimeScheduler
        : null;

    var unstable_UserBlockingPriority =
      nativeScheduler !== null
        ? nativeScheduler.unstable_UserBlockingPriority
        : 2;
    var unstable_NormalPriority =
      nativeScheduler !== null ? nativeScheduler.unstable_NormalPriority : 3;
    var unstable_LowPriority =
      nativeScheduler !== null ? nativeScheduler.unstable_LowPriority : 4;
    var unstable_ImmediatePriority =
      nativeScheduler !== null
        ? nativeScheduler.unstable_ImmediatePriority
        : 1;
    var unstable_scheduleCallback =
      nativeScheduler !== null
        ? nativeScheduler.unstable_scheduleCallback
        : unstable_scheduleCallback$1;
    var unstable_cancelCallback =
      nativeScheduler !== null
        ? nativeScheduler.unstable_cancelCallback
        : unstable_cancelCallback$1;
    var unstable_getCurrentPriorityLevel =
      nativeScheduler !== null
        ? nativeScheduler.unstable_getCurrentPriorityLevel
        : unstable_getCurrentPriorityLevel$1;
    var unstable_shouldYield =
      nativeScheduler !== null
        ? nativeScheduler.unstable_shouldYield
        : shouldYieldToHost;
    var unstable_requestPaint =
      nativeScheduler !== null
        ? nativeScheduler.unstable_requestPaint
        : requestPaint;
    var unstable_now =
      nativeScheduler !== null ? nativeScheduler.unstable_now : getCurrentTime;

    function throwNotImplemented() {
      throw Error('Not implemented.');
    }

    exports.unstable_IdlePriority =
      nativeScheduler !== null ? nativeScheduler.unstable_IdlePriority : 5;
    exports.unstable_ImmediatePriority = unstable_ImmediatePriority;
    exports.unstable_LowPriority = unstable_LowPriority;
    exports.unstable_NormalPriority = unstable_NormalPriority;
    exports.unstable_Profiling = null;
    exports.unstable_UserBlockingPriority = unstable_UserBlockingPriority;
    exports.unstable_cancelCallback = unstable_cancelCallback;
    exports.unstable_forceFrameRate = throwNotImplemented;
    exports.unstable_getCurrentPriorityLevel = unstable_getCurrentPriorityLevel;
    exports.unstable_next = throwNotImplemented;
    exports.unstable_now = unstable_now;
    exports.unstable_requestPaint = unstable_requestPaint;
    exports.unstable_runWithPriority = throwNotImplemented;
    exports.unstable_scheduleCallback = unstable_scheduleCallback;
    exports.unstable_shouldYield = unstable_shouldYield;
    exports.unstable_wrapCallback = throwNotImplemented;
  })();
}
