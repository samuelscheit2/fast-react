import { createRequire } from "node:module";
import { relative, sep } from "node:path";

const require = createRequire(import.meta.url);

const packageName = process.argv[2];
const scenarioId = process.argv[3];
const scenarioOptions = process.argv[4] ? JSON.parse(process.argv[4]) : {};

if (!packageName || !scenarioId) {
  throw new Error(
    "Usage: node scheduler-variant-probe-runner.mjs <packageName> <scenarioId> [jsonOptions]"
  );
}

const ROOT_EXPORT_KEYS = [
  "unstable_IdlePriority",
  "unstable_ImmediatePriority",
  "unstable_LowPriority",
  "unstable_NormalPriority",
  "unstable_Profiling",
  "unstable_UserBlockingPriority",
  "unstable_cancelCallback",
  "unstable_forceFrameRate",
  "unstable_getCurrentPriorityLevel",
  "unstable_next",
  "unstable_now",
  "unstable_requestPaint",
  "unstable_runWithPriority",
  "unstable_scheduleCallback",
  "unstable_shouldYield",
  "unstable_wrapCallback"
];

try {
  const result = runScenario(scenarioId);
  process.stdout.write(JSON.stringify(result));
} catch (error) {
  process.stdout.write(
    JSON.stringify({
      scenarioId,
      status: "throws",
      error: describeThrown(error)
    })
  );
  process.exit(0);
}

function runScenario(id) {
  switch (id) {
    case "package-metadata-and-resolution":
      return runPackageMetadataAndResolution();
    case "unstable-mock":
      return runUnstableMock();
    case "unstable-post-task-plain-node":
      return runUnstablePostTaskPlainNode();
    case "unstable-post-task-shimmed":
      return runUnstablePostTaskShimmed();
    case "unstable-post-task-without-yield":
      return runUnstablePostTaskWithoutYield();
    case "native-fallback":
      return runNativeFallback();
    case "native-runtime-delegation":
      return runNativeRuntimeDelegation();
    case "deep-cjs-require":
      return runDeepCjsRequire();
    default:
      throw new Error(`Unknown scheduler variant scenario: ${id}`);
  }
}

function runPackageMetadataAndResolution() {
  const packageJson = require(`${packageName}/package.json`);
  const resolutionSpecifiers = scenarioOptions.resolutionSpecifiers ?? [];

  return {
    scenarioId,
    status: "ok",
    packageJson: selectPackageJsonFields(packageJson),
    packageJsonRequire: probeRequire(`${packageName}/package.json`),
    resolution: resolutionSpecifiers.map((specifier) =>
      probeResolve(specifier)
    )
  };
}

function runDeepCjsRequire() {
  const specifiers = scenarioOptions.deepCjsSpecifiers ?? [];

  return {
    scenarioId,
    status: "ok",
    probes: specifiers.map((specifier) => probeRequire(specifier))
  };
}

function runUnstableMock() {
  const Scheduler = require(`${packageName}/unstable_mock`);
  const exportKeys = Object.keys(Scheduler);

  Scheduler.reset();
  const initialNow = Scheduler.unstable_now();
  Scheduler.unstable_advanceTime(7);
  const nowAfterAdvance = Scheduler.unstable_now();
  Scheduler.log("manual");
  const manualLog = Scheduler.unstable_clearLog();
  const emptyLog = Scheduler.unstable_clearLog();
  Scheduler.unstable_setDisableYieldValue(true);
  Scheduler.log("disabled");
  const disabledLog = Scheduler.unstable_clearLog();
  Scheduler.unstable_setDisableYieldValue(false);

  const priorityContext = {
    defaultPriority: Scheduler.unstable_getCurrentPriorityLevel(),
    runWithPriorityInvalid: Scheduler.unstable_runWithPriority(99, () =>
      Scheduler.unstable_getCurrentPriorityLevel()
    ),
    nextInsideUserBlocking: Scheduler.unstable_runWithPriority(
      Scheduler.unstable_UserBlockingPriority,
      () => Scheduler.unstable_next(() => Scheduler.unstable_getCurrentPriorityLevel())
    ),
    nextInsideLow: Scheduler.unstable_runWithPriority(
      Scheduler.unstable_LowPriority,
      () => Scheduler.unstable_next(() => Scheduler.unstable_getCurrentPriorityLevel())
    ),
    wrapCallbackCapturedPriority: Scheduler.unstable_runWithPriority(
      Scheduler.unstable_UserBlockingPriority,
      () => {
        const wrapped = Scheduler.unstable_wrapCallback(() =>
          Scheduler.unstable_getCurrentPriorityLevel()
        );
        return Scheduler.unstable_runWithPriority(
          Scheduler.unstable_LowPriority,
          () => wrapped()
        );
      }
    )
  };

  Scheduler.reset();
  const priorityOrder = [];
  for (const [label, priority] of [
    ["low", Scheduler.unstable_LowPriority],
    ["normal", Scheduler.unstable_NormalPriority],
    ["user-blocking", Scheduler.unstable_UserBlockingPriority],
    ["immediate", Scheduler.unstable_ImmediatePriority]
  ]) {
    Scheduler.unstable_scheduleCallback(priority, (didTimeout) => {
      priorityOrder.push([
        label,
        didTimeout,
        Scheduler.unstable_getCurrentPriorityLevel()
      ]);
      Scheduler.log(label);
    });
  }
  const pendingBeforePriorityFlush = Scheduler.unstable_hasPendingWork();
  const priorityFlushReturned = Scheduler.unstable_flushAllWithoutAsserting();
  const priorityLog = Scheduler.unstable_clearLog();
  const pendingAfterPriorityFlush = Scheduler.unstable_hasPendingWork();

  Scheduler.reset();
  const delayedEvents = [];
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
    delayedEvents.push(["ready", Scheduler.unstable_now()]);
  });
  Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_NormalPriority,
    () => {
      delayedEvents.push(["delay10", Scheduler.unstable_now()]);
    },
    { delay: 10 }
  );
  const delayFirstFlushReturned = Scheduler.unstable_flushAllWithoutAsserting();
  const delayAfterFirstFlush = {
    events: delayedEvents.slice(),
    hasPendingWork: Scheduler.unstable_hasPendingWork(),
    now: Scheduler.unstable_now()
  };
  Scheduler.unstable_advanceTime(9);
  const delayAfterNineMs = {
    events: delayedEvents.slice(),
    hasPendingWork: Scheduler.unstable_hasPendingWork(),
    now: Scheduler.unstable_now()
  };
  Scheduler.unstable_advanceTime(1);
  const delayAfterTenMs = {
    events: delayedEvents.slice(),
    hasPendingWork: Scheduler.unstable_hasPendingWork(),
    now: Scheduler.unstable_now()
  };
  const delaySecondFlushReturned = Scheduler.unstable_flushAllWithoutAsserting();
  const delayAfterSecondFlush = {
    events: delayedEvents.slice(),
    hasPendingWork: Scheduler.unstable_hasPendingWork(),
    now: Scheduler.unstable_now()
  };

  Scheduler.reset();
  const continuationEvents = [];
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
    continuationEvents.push("normal-start");
    Scheduler.log("normal-start");
    return () => {
      continuationEvents.push("normal-continuation");
      Scheduler.log("normal-continuation");
    };
  });
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_LowPriority, () => {
    continuationEvents.push("low");
    Scheduler.log("low");
  });
  Scheduler.unstable_flushNumberOfYields(1);
  const continuationAfterOneYield = {
    events: continuationEvents.slice(),
    log: Scheduler.unstable_clearLog(),
    hasPendingWork: Scheduler.unstable_hasPendingWork()
  };
  Scheduler.unstable_flushAllWithoutAsserting();
  const continuationAfterFlushAll = {
    events: continuationEvents.slice(),
    log: Scheduler.unstable_clearLog(),
    hasPendingWork: Scheduler.unstable_hasPendingWork()
  };

  Scheduler.reset();
  const paintEvents = [];
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
    paintEvents.push("paint-start");
    Scheduler.log("paint-start");
    Scheduler.unstable_requestPaint();
    return () => {
      paintEvents.push("paint-continuation");
      Scheduler.log("paint-continuation");
    };
  });
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
    paintEvents.push("after-paint");
    Scheduler.log("after-paint");
  });
  const flushUntilNextPaintReturned = Scheduler.unstable_flushUntilNextPaint();
  const paintAfterFlushUntilNextPaint = {
    events: paintEvents.slice(),
    log: Scheduler.unstable_clearLog(),
    hasPendingWork: Scheduler.unstable_hasPendingWork()
  };
  Scheduler.unstable_flushAllWithoutAsserting();
  const paintAfterFlushAll = {
    events: paintEvents.slice(),
    log: Scheduler.unstable_clearLog(),
    hasPendingWork: Scheduler.unstable_hasPendingWork()
  };

  Scheduler.reset();
  const expiredEvents = [];
  Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_UserBlockingPriority,
    (didTimeout) => {
      expiredEvents.push([
        "user-blocking",
        didTimeout,
        Scheduler.unstable_now()
      ]);
    }
  );
  Scheduler.unstable_advanceTime(251);
  Scheduler.unstable_flushExpired();

  Scheduler.reset();
  const cancelledEvents = [];
  const cancelledTask = Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_NormalPriority,
    () => {
      cancelledEvents.push("cancelled");
    }
  );
  Scheduler.unstable_cancelCallback(cancelledTask);
  const cancelledFlushReturned = Scheduler.unstable_flushAllWithoutAsserting();

  Scheduler.reset();
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
    Scheduler.log("unasserted");
  });
  const flushAllWithUnassertedLog = captureCall(() => Scheduler.unstable_flushAll());
  const flushAllUnassertedLog = Scheduler.unstable_clearLog();

  Scheduler.reset();
  const resetState = {
    now: Scheduler.unstable_now(),
    log: Scheduler.unstable_clearLog(),
    hasPendingWork: Scheduler.unstable_hasPendingWork()
  };

  return {
    scenarioId,
    status: "ok",
    exportKeys,
    expectedRootExportKeysSubset: ROOT_EXPORT_KEYS,
    priorityConstants: readPriorityConstants(Scheduler),
    timeAndLog: {
      initialNow,
      nowAfterAdvance,
      manualLog,
      emptyLog,
      disabledLog
    },
    priorityContext,
    priorityScheduling: {
      pendingBeforeFlush: pendingBeforePriorityFlush,
      flushReturned: priorityFlushReturned,
      order: priorityOrder,
      log: priorityLog,
      pendingAfterFlush: pendingAfterPriorityFlush
    },
    delayedScheduling: {
      firstFlushReturned: delayFirstFlushReturned,
      afterFirstFlush: delayAfterFirstFlush,
      afterNineMs: delayAfterNineMs,
      afterTenMs: delayAfterTenMs,
      secondFlushReturned: delaySecondFlushReturned,
      afterSecondFlush: delayAfterSecondFlush
    },
    continuationScheduling: {
      afterOneYield: continuationAfterOneYield,
      afterFlushAll: continuationAfterFlushAll
    },
    paintYielding: {
      flushUntilNextPaintReturned,
      afterFlushUntilNextPaint: paintAfterFlushUntilNextPaint,
      afterFlushAll: paintAfterFlushAll
    },
    expiredScheduling: expiredEvents,
    cancellation: {
      taskCallbackAfterCancel: describeValue(cancelledTask.callback),
      flushReturned: cancelledFlushReturned,
      events: cancelledEvents
    },
    flushAllWithUnassertedLog,
    flushAllUnassertedLog,
    resetState
  };
}

function runUnstablePostTaskPlainNode() {
  return {
    scenarioId,
    status: "ok",
    require: probeRequire(`${packageName}/unstable_post_task`)
  };
}

function runUnstablePostTaskShimmed() {
  const shim = installPostTaskShim({ withYield: true });
  const Scheduler = require(`${packageName}/unstable_post_task`);
  const exportKeys = Object.keys(Scheduler);

  const priorityContext = {
    defaultPriority: Scheduler.unstable_getCurrentPriorityLevel(),
    runWithPriorityInvalid: Scheduler.unstable_runWithPriority(99, () =>
      Scheduler.unstable_getCurrentPriorityLevel()
    ),
    afterInvalidPriority: Scheduler.unstable_getCurrentPriorityLevel(),
    nextInsideImmediate: Scheduler.unstable_runWithPriority(
      Scheduler.unstable_ImmediatePriority,
      () => Scheduler.unstable_next(() => Scheduler.unstable_getCurrentPriorityLevel())
    ),
    nextInsideLow: Scheduler.unstable_runWithPriority(
      Scheduler.unstable_LowPriority,
      () => Scheduler.unstable_next(() => Scheduler.unstable_getCurrentPriorityLevel())
    ),
    wrapCallbackCapturedPriority: Scheduler.unstable_runWithPriority(
      Scheduler.unstable_UserBlockingPriority,
      () => {
        const wrapped = Scheduler.unstable_wrapCallback(() =>
          Scheduler.unstable_getCurrentPriorityLevel()
        );
        return Scheduler.unstable_runWithPriority(
          Scheduler.unstable_LowPriority,
          () => wrapped()
        );
      }
    )
  };

  const priorityMapping = [
    ["immediate", Scheduler.unstable_ImmediatePriority, undefined],
    ["user-blocking", Scheduler.unstable_UserBlockingPriority, undefined],
    ["normal", Scheduler.unstable_NormalPriority, undefined],
    ["low", Scheduler.unstable_LowPriority, { delay: 7 }],
    ["idle", Scheduler.unstable_IdlePriority, undefined],
    ["invalid", 99, undefined]
  ].map(([label, priority, options]) => {
    const returnedNode = Scheduler.unstable_scheduleCallback(
      priority,
      () => {},
      options
    );
    const events = shim.takeEvents();
    return {
      label,
      priority,
      returnedNode: describePostTaskNode(returnedNode),
      events
    };
  });
  shim.clearPostTasks();

  let cancelledRan = false;
  const cancelledNode = Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_NormalPriority,
    () => {
      cancelledRan = true;
    }
  );
  const cancellationScheduleEvents = shim.takeEvents();
  Scheduler.unstable_cancelCallback(cancelledNode);
  const cancellationEventsAfterAbort = shim.takeEvents();
  const cancellationFlush = shim.flushPostTasks();
  const cancellation = {
    returnedNode: describePostTaskNode(cancelledNode),
    scheduleEvents: cancellationScheduleEvents,
    abortEvents: cancellationEventsAfterAbort,
    flush: cancellationFlush,
    callbackRan: cancelledRan
  };

  const callbackEvents = [];
  shim.setNow(100);
  Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_ImmediatePriority,
    (didTimeout) => {
      callbackEvents.push([
        "immediate",
        didTimeout,
        Scheduler.unstable_getCurrentPriorityLevel(),
        Scheduler.unstable_shouldYield()
      ]);
      shim.setNow(106);
      callbackEvents.push(["after-deadline", Scheduler.unstable_shouldYield()]);
    }
  );
  const callbackScheduleEvents = shim.takeEvents();
  const callbackFlush = shim.flushPostTasks();
  const callbackObservation = {
    scheduleEvents: callbackScheduleEvents,
    flush: callbackFlush,
    events: callbackEvents
  };

  const continuationEvents = [];
  shim.setNow(200);
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_IdlePriority, () => {
    continuationEvents.push([
      "idle-start",
      Scheduler.unstable_getCurrentPriorityLevel()
    ]);
    return () => {
      continuationEvents.push([
        "idle-continuation",
        Scheduler.unstable_getCurrentPriorityLevel()
      ]);
    };
  });
  const continuationScheduleEvents = shim.takeEvents();
  const continuationFlush = shim.flushPostTasks();
  const continuationWithYield = {
    scheduleEvents: continuationScheduleEvents,
    flush: continuationFlush,
    events: continuationEvents,
    shimEvents: shim.takeEvents()
  };

  const noops = {
    requestPaint: describeValue(Scheduler.unstable_requestPaint()),
    forceFrameRate: describeValue(Scheduler.unstable_forceFrameRate(60))
  };

  return {
    scenarioId,
    status: "ok",
    exportKeys,
    priorityConstants: readPriorityConstants(Scheduler),
    now: Scheduler.unstable_now(),
    priorityContext,
    priorityMapping,
    cancellation,
    callbackObservation,
    continuationWithYield,
    noops
  };
}

function runUnstablePostTaskWithoutYield() {
  const shim = installPostTaskShim({ withYield: false });
  const Scheduler = require(`${packageName}/unstable_post_task`);
  const continuationEvents = [];

  Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
    continuationEvents.push([
      "normal-start",
      Scheduler.unstable_getCurrentPriorityLevel()
    ]);
    return () => {
      continuationEvents.push([
        "normal-continuation",
        Scheduler.unstable_getCurrentPriorityLevel()
      ]);
    };
  });
  const scheduleEvents = shim.takeEvents();
  const flush = shim.flushPostTasks();

  return {
    scenarioId,
    status: "ok",
    exportKeys: Object.keys(Scheduler),
    scheduleEvents,
    flush,
    events: continuationEvents,
    postContinuationEvents: shim.takeEvents()
  };
}

function runNativeFallback() {
  const nativeGlobals = installNativeFallbackGlobals();
  const Scheduler = require(`${packageName}/index.native.js`);
  const beforePaintShouldYield = Scheduler.unstable_shouldYield();
  Scheduler.unstable_requestPaint();
  const afterPaintShouldYield = Scheduler.unstable_shouldYield();
  const task = Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_NormalPriority,
    () => {}
  );
  Scheduler.unstable_cancelCallback(task);

  return {
    scenarioId,
    status: "ok",
    exportKeys: Object.keys(Scheduler),
    priorityConstants: readPriorityConstants(Scheduler),
    nowInitial: Scheduler.unstable_now(),
    currentPriority: Scheduler.unstable_getCurrentPriorityLevel(),
    shouldYield: {
      beforePaint: beforePaintShouldYield,
      afterPaint: afterPaintShouldYield
    },
    scheduledTask: describeNativeTask(task),
    taskCallbackAfterCancel: describeValue(task.callback),
    throwers: readNativeThrowers(Scheduler),
    hostEvents: nativeGlobals.events
  };
}

function runNativeRuntimeDelegation() {
  const events = [];
  installNativeFallbackGlobals();
  globalThis.nativeRuntimeScheduler = {
    unstable_ImmediatePriority: 11,
    unstable_UserBlockingPriority: 12,
    unstable_NormalPriority: 13,
    unstable_LowPriority: 14,
    unstable_IdlePriority: 15,
    unstable_scheduleCallback(priority, callback, options) {
      events.push(["schedule", priority, options?.delay ?? null]);
      return {
        nativeTask: true,
        priority
      };
    },
    unstable_cancelCallback(task) {
      events.push(["cancel", task.nativeTask === true, task.priority]);
    },
    unstable_getCurrentPriorityLevel() {
      events.push(["getCurrentPriorityLevel"]);
      return 13;
    },
    unstable_shouldYield() {
      events.push(["shouldYield"]);
      return "native-should-yield";
    },
    unstable_requestPaint() {
      events.push(["requestPaint"]);
    },
    unstable_now() {
      events.push(["now"]);
      return 123;
    }
  };

  const Scheduler = require(`${packageName}/index.native.js`);
  const task = Scheduler.unstable_scheduleCallback(12, () => {}, {
    delay: 4
  });
  Scheduler.unstable_cancelCallback(task);

  return {
    scenarioId,
    status: "ok",
    exportKeys: Object.keys(Scheduler),
    priorityConstants: readPriorityConstants(Scheduler),
    currentPriority: Scheduler.unstable_getCurrentPriorityLevel(),
    shouldYield: Scheduler.unstable_shouldYield(),
    now: Scheduler.unstable_now(),
    requestPaint: describeValue(Scheduler.unstable_requestPaint()),
    throwers: readNativeThrowers(Scheduler),
    events
  };
}

function installPostTaskShim({ withYield }) {
  const events = [];
  const postTaskQueue = [];
  let now = 100;
  let nextSignalId = 1;

  class TaskController {
    constructor(options) {
      this.priority = options.priority;
      this.signal = {
        id: nextSignalId++,
        aborted: false,
        priority: options.priority
      };
      events.push({
        type: "TaskController",
        priority: options.priority,
        signalId: this.signal.id
      });
    }

    abort() {
      this.signal.aborted = true;
      events.push({
        type: "abort",
        priority: this.priority,
        signalId: this.signal.id
      });
    }
  }

  globalThis.window = {
    performance: {
      now: () => now
    },
    setTimeout(callback) {
      events.push({ type: "window.setTimeout" });
      callback();
      return 1;
    }
  };
  globalThis.TaskController = TaskController;
  globalThis.scheduler = {
    postTask(task, options = {}) {
      events.push({
        type: "postTask",
        delay: options.delay ?? null,
        signalId: options.signal?.id ?? null,
        signalAborted: options.signal?.aborted ?? null
      });
      postTaskQueue.push({ task, options });
      return catchableThenable();
    }
  };

  if (withYield) {
    globalThis.scheduler.yield = (options = {}) => {
      events.push({
        type: "yield",
        signalId: options.signal?.id ?? null,
        signalAborted: options.signal?.aborted ?? null
      });
      return {
        then(onFulfilled) {
          events.push({
            type: "yield.then",
            signalId: options.signal?.id ?? null,
            signalAborted: options.signal?.aborted ?? null
          });
          onFulfilled();
          return catchableThenable();
        },
        catch() {
          return this;
        }
      };
    };
  }

  return {
    events,
    setNow(value) {
      now = value;
    },
    takeEvents() {
      const taken = events.slice();
      events.length = 0;
      return taken;
    },
    clearPostTasks() {
      postTaskQueue.length = 0;
    },
    flushPostTasks() {
      const flushEvents = [];
      let guard = 0;
      while (postTaskQueue.length > 0) {
        if (guard++ > 20) {
          throw new Error("postTask shim exceeded flush guard");
        }
        const next = postTaskQueue.shift();
        if (next.options.signal?.aborted) {
          flushEvents.push({
            type: "skip-aborted",
            signalId: next.options.signal.id
          });
          continue;
        }
        flushEvents.push({
          type: "run-post-task",
          signalId: next.options.signal?.id ?? null
        });
        next.task();
      }
      return flushEvents;
    }
  };
}

function installNativeFallbackGlobals() {
  const events = [];
  let now = 0;
  globalThis.performance = {
    now: () => now
  };
  globalThis.setImmediate = (callback) => {
    events.push(["setImmediate"]);
    return callback;
  };
  globalThis.setTimeout = (callback, ms) => {
    events.push(["setTimeout", ms]);
    return callback;
  };
  globalThis.clearTimeout = (handle) => {
    events.push(["clearTimeout", typeof handle]);
  };

  return {
    events,
    setNow(value) {
      now = value;
    }
  };
}

function catchableThenable() {
  return {
    catch() {
      return this;
    }
  };
}

function readNativeThrowers(Scheduler) {
  return Object.fromEntries(
    [
      ["unstable_runWithPriority", () => Scheduler.unstable_runWithPriority(3, () => {})],
      ["unstable_next", () => Scheduler.unstable_next(() => {})],
      ["unstable_wrapCallback", () => Scheduler.unstable_wrapCallback(() => {})],
      ["unstable_forceFrameRate", () => Scheduler.unstable_forceFrameRate(60)]
    ].map(([key, callback]) => [key, captureCall(callback)])
  );
}

function readPriorityConstants(Scheduler) {
  return {
    unstable_ImmediatePriority: Scheduler.unstable_ImmediatePriority,
    unstable_UserBlockingPriority: Scheduler.unstable_UserBlockingPriority,
    unstable_NormalPriority: Scheduler.unstable_NormalPriority,
    unstable_LowPriority: Scheduler.unstable_LowPriority,
    unstable_IdlePriority: Scheduler.unstable_IdlePriority,
    unstable_Profiling: Scheduler.unstable_Profiling
  };
}

function describePostTaskNode(node) {
  return {
    ownKeys: Object.keys(node),
    hasController: typeof node?._controller === "object",
    signal: node?._controller?.signal
      ? {
          id: node._controller.signal.id,
          aborted: node._controller.signal.aborted,
          priority: node._controller.signal.priority
        }
      : null
  };
}

function describeNativeTask(task) {
  return {
    ownKeys: Object.keys(task),
    id: task.id,
    priorityLevel: task.priorityLevel,
    startTime: task.startTime,
    expirationTime: task.expirationTime,
    sortIndex: task.sortIndex
  };
}

function probeResolve(specifier) {
  try {
    return {
      specifier,
      status: "ok",
      path: normalizePath(require.resolve(specifier))
    };
  } catch (error) {
    return {
      specifier,
      ...describeThrown(error)
    };
  }
}

function probeRequire(specifier) {
  const resolution = probeResolve(specifier);

  try {
    return {
      specifier,
      requireResolve: resolution,
      require: describeModule(require(specifier))
    };
  } catch (error) {
    return {
      specifier,
      requireResolve: resolution,
      require: describeThrown(error)
    };
  }
}

function describeModule(moduleValue) {
  const exportKeys = Object.keys(moduleValue);
  const priorityConstants = ROOT_EXPORT_KEYS.some((key) => key in moduleValue)
    ? readPriorityConstants(moduleValue)
    : null;

  return {
    status: "ok",
    exportKeys,
    priorityConstants,
    exportDetails: exportKeys.map((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(moduleValue, key);
      return {
        key,
        enumerable: descriptor?.enumerable ?? null,
        configurable: descriptor?.configurable ?? null,
        writable:
          descriptor && "writable" in descriptor ? descriptor.writable : null,
        value:
          descriptor && "value" in descriptor
            ? describeValue(descriptor.value)
            : null
      };
    })
  };
}

function describeValue(value) {
  if (value === null) {
    return { type: "null" };
  }

  if (value === undefined) {
    return { type: "undefined" };
  }

  if (typeof value === "function") {
    return {
      type: "function",
      name: value.name,
      length: value.length
    };
  }

  if (typeof value === "symbol") {
    return {
      type: "symbol",
      description: value.description ?? null,
      stringValue: String(value)
    };
  }

  if (typeof value === "object") {
    return {
      type: "object",
      objectTag: Object.prototype.toString.call(value)
    };
  }

  return {
    type: typeof value,
    value
  };
}

function captureCall(callback) {
  try {
    return {
      status: "ok",
      value: describeValue(callback())
    };
  } catch (error) {
    return describeThrown(error);
  }
}

function describeThrown(error) {
  return {
    status: "throws",
    name: error?.name ?? null,
    code: error?.code ?? null,
    message: error?.message ?? String(error)
  };
}

function normalizePath(path) {
  const relativePath = relative(process.cwd(), path).split(sep).join("/");
  if (relativePath.startsWith("node_modules/")) {
    return relativePath;
  }

  return "<outside-project>";
}

function selectPackageJsonFields(packageJson) {
  return {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description ?? null,
    main: packageJson.main ?? null,
    type: packageJson.type ?? null,
    exports: packageJson.exports ?? null,
    files: packageJson.files ?? null,
    dependencies: packageJson.dependencies ?? null,
    peerDependencies: packageJson.peerDependencies ?? null,
    engines: packageJson.engines ?? null,
    license: packageJson.license ?? null,
    repository: packageJson.repository ?? null,
    bugs: packageJson.bugs ?? null,
    homepage: packageJson.homepage ?? null
  };
}
