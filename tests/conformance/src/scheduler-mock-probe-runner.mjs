import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const scenarioId = process.argv[3];

if (!targetPackage || !scenarioId) {
  throw new Error(
    "Usage: node scheduler-mock-probe-runner.mjs <package> <scenario>"
  );
}

const consoleCalls = [];
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  consoleCalls.push({
    method: "error",
    args: args.map(describeValue)
  });
};
console.warn = (...args) => {
  consoleCalls.push({
    method: "warn",
    args: args.map(describeValue)
  });
};

function main() {
  try {
    const scenario = scenarios[scenarioId];
    if (!scenario) {
      throw new Error(`Unknown scheduler mock scenario: ${scenarioId}`);
    }

    const result = captureOperation(scenarioId, () => scenario(targetPackage));
    process.stdout.write(
      JSON.stringify({
        targetPackage,
        scenarioId,
        result,
        consoleCalls
      })
    );
  } finally {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  }
}

const scenarios = {
  "scheduler-mock-export-shape": (target) => {
    const Scheduler = loadSchedulerMock(target);
    const packageJson = require(`${target}/package.json`);
    const exportKeys = Object.keys(Scheduler);

    return {
      packageJson: selectPackageJsonFields(packageJson),
      exportKeys,
      ownKeys: Reflect.ownKeys(Scheduler).map(describeKey),
      constants: readPriorityConstants(Scheduler),
      unstableNoPriority: {
        hasIn: "unstable_NoPriority" in Scheduler,
        hasOwn: Object.hasOwn(Scheduler, "unstable_NoPriority")
      },
      descriptors: exportKeys.map((key) => ({
        key,
        descriptor: describeDescriptor(
          Object.getOwnPropertyDescriptor(Scheduler, key)
        )
      })),
      functionExports: exportKeys
        .filter((key) => typeof Scheduler[key] === "function")
        .map((key) => ({
          key,
          value: describeValue(Scheduler[key]),
          ownKeys: Reflect.ownKeys(Scheduler[key]).map(describeKey)
        }))
    };
  },

  "scheduler-mock-virtual-time-and-logs": (target) => {
    const Scheduler = loadSchedulerMock(target);
    Scheduler.reset();

    const initialNow = Scheduler.unstable_now();
    const advanceSeven = captureCall(() => Scheduler.unstable_advanceTime(7));
    const nowAfterAdvance = Scheduler.unstable_now();
    const logManual = captureCall(() => Scheduler.log("manual"));
    const manualLog = Scheduler.unstable_clearLog();
    const emptyLog = Scheduler.unstable_clearLog();

    const disableTrue = captureCall(() =>
      Scheduler.unstable_setDisableYieldValue(true)
    );
    const disabledLogCall = captureCall(() => Scheduler.log("disabled"));
    const disabledAdvance = captureCall(() => Scheduler.unstable_advanceTime(5));
    const disabledState = {
      now: Scheduler.unstable_now(),
      log: Scheduler.unstable_clearLog()
    };
    const disableFalse = captureCall(() =>
      Scheduler.unstable_setDisableYieldValue(false)
    );
    const enabledAdvance = captureCall(() => Scheduler.unstable_advanceTime(3));
    const enabledLogCall = captureCall(() => Scheduler.log("enabled"));
    const enabledState = {
      now: Scheduler.unstable_now(),
      log: Scheduler.unstable_clearLog()
    };

    return {
      initialNow,
      advanceSeven,
      nowAfterAdvance,
      logManual,
      manualLog,
      emptyLog,
      disableTrue,
      disabledLogCall,
      disabledAdvance,
      disabledState,
      disableFalse,
      enabledAdvance,
      enabledLogCall,
      enabledState
    };
  },

  "scheduler-mock-task-object-shape": (target) => {
    const Scheduler = loadSchedulerMock(target);
    Scheduler.reset();

    const readyTasks = priorityEntries(Scheduler).map(([label, priority]) => {
      const task = Scheduler.unstable_scheduleCallback(priority, () => {});
      const beforeCancel = describeScheduledTask(task);
      Scheduler.unstable_cancelCallback(task);
      const afterCancel = describeScheduledTask(task);
      return {
        label,
        beforeCancel,
        afterCancel
      };
    });

    const delayedTask = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      () => {},
      { delay: 12 }
    );
    const delayedBeforeCancel = describeScheduledTask(delayedTask);
    Scheduler.unstable_cancelCallback(delayedTask);
    const delayedAfterCancel = describeScheduledTask(delayedTask);

    return {
      readyTasks,
      delayedTask: {
        label: "normal-delayed-12ms",
        beforeCancel: delayedBeforeCancel,
        afterCancel: delayedAfterCancel
      }
    };
  },

  "scheduler-mock-priority-context": (target) => {
    const Scheduler = loadSchedulerMock(target);
    Scheduler.reset();

    const priorities = priorityEntries(Scheduler);
    const runWithPriority = priorities.map(([label, priority]) => ({
      label,
      returnValue: Scheduler.unstable_runWithPriority(priority, () => ({
        currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
      })),
      afterReturnPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
    }));

    const invalidRunWithPriority = [0, 6, "user-blocking", null].map(
      (priority) => ({
        input: describeValue(priority),
        currentPriorityLevel: Scheduler.unstable_runWithPriority(priority, () =>
          Scheduler.unstable_getCurrentPriorityLevel()
        ),
        afterReturnPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
      })
    );

    const restorationAfterThrow = captureCallRaw(() => {
      try {
        Scheduler.unstable_runWithPriority(
          Scheduler.unstable_ImmediatePriority,
          () => {
            throw new Error("mock priority context probe");
          }
        );
      } catch (error) {
        return {
          error: describeThrown(error),
          currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
        };
      }
      throw new Error("runWithPriority did not throw");
    });

    const nextByParent = priorities.map(([label, priority]) => ({
      parent: label,
      currentPriorityLevel: Scheduler.unstable_runWithPriority(priority, () =>
        Scheduler.unstable_next(() =>
          Scheduler.unstable_getCurrentPriorityLevel()
        )
      ),
      afterReturnPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
    }));

    const wrapCallback = Scheduler.unstable_runWithPriority(
      Scheduler.unstable_UserBlockingPriority,
      () => {
        const wrapped = Scheduler.unstable_wrapCallback(function wrappedProbe(
          first,
          second
        ) {
          return {
            thisLabel: this.label,
            args: [first, second],
            currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
          };
        });
        return Scheduler.unstable_runWithPriority(
          Scheduler.unstable_LowPriority,
          () => ({
            beforeCallPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel(),
            callResult: wrapped.call({ label: "receiver" }, "alpha", "beta"),
            afterCallPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel(),
            wrappedFunction: describeValue(wrapped)
          })
        );
      }
    );

    return {
      defaultCurrentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel(),
      runWithPriority,
      invalidRunWithPriority,
      restorationAfterThrow,
      nextByParent,
      wrapCallback
    };
  },

  "scheduler-mock-priority-flush-order": (target) => {
    const Scheduler = loadSchedulerMock(target);
    Scheduler.reset();

    const events = [];
    const scheduledOrder = [
      ["idle", Scheduler.unstable_IdlePriority],
      ["low", Scheduler.unstable_LowPriority],
      ["normal", Scheduler.unstable_NormalPriority],
      ["user-blocking", Scheduler.unstable_UserBlockingPriority],
      ["immediate", Scheduler.unstable_ImmediatePriority]
    ];

    for (const [label, priority] of scheduledOrder) {
      Scheduler.unstable_scheduleCallback(priority, (didTimeout) => {
        events.push({
          label,
          didTimeout,
          currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
        });
        Scheduler.log(label);
      });
    }

    const pendingBeforeFlush = Scheduler.unstable_hasPendingWork();
    const flushReturned = Scheduler.unstable_flushAllWithoutAsserting();
    const log = Scheduler.unstable_clearLog();
    const pendingAfterFlush = Scheduler.unstable_hasPendingWork();

    Scheduler.reset();
    const fifoEvents = [];
    for (const label of ["first", "second", "third", "fourth"]) {
      Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
        fifoEvents.push({
          label,
          currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
        });
        Scheduler.log(label);
      });
    }
    const fifoFlushReturned = Scheduler.unstable_flushAllWithoutAsserting();
    const fifoLog = Scheduler.unstable_clearLog();

    return {
      scheduledOrder: scheduledOrder.map(([label]) => label),
      pendingBeforeFlush,
      flushReturned,
      runOrder: events.map((event) => event.label),
      events,
      log,
      pendingAfterFlush,
      equalPriorityFifo: {
        flushReturned: fifoFlushReturned,
        runOrder: fifoEvents.map((event) => event.label),
        events: fifoEvents,
        log: fifoLog,
        pendingAfterFlush: Scheduler.unstable_hasPendingWork()
      }
    };
  },

  "scheduler-mock-flush-helpers": (target) => {
    const Scheduler = loadSchedulerMock(target);
    Scheduler.reset();

    const empty = {
      flushAll: captureCall(() => Scheduler.unstable_flushAll()),
      flushAllWithoutAsserting: captureCall(() =>
        Scheduler.unstable_flushAllWithoutAsserting()
      ),
      flushExpired: captureCall(() => Scheduler.unstable_flushExpired()),
      flushNumberOfYields: captureCall(() =>
        Scheduler.unstable_flushNumberOfYields(1)
      ),
      flushUntilNextPaint: captureCall(() =>
        Scheduler.unstable_flushUntilNextPaint()
      )
    };

    Scheduler.reset();
    Scheduler.log("pre-existing");
    const flushAllWithPreExistingLog = captureCall(() =>
      Scheduler.unstable_flushAll()
    );
    const preExistingLogAfterThrow = Scheduler.unstable_clearLog();

    Scheduler.reset();
    Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
      Scheduler.log("yielded");
    });
    const flushAllWithYieldedValue = captureCall(() =>
      Scheduler.unstable_flushAll()
    );
    const yieldedLogAfterThrow = Scheduler.unstable_clearLog();

    Scheduler.reset();
    const yieldEvents = [];
    Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
      yieldEvents.push("first");
      Scheduler.log("first");
      return () => {
        yieldEvents.push("first-continuation");
        Scheduler.log("first-continuation");
      };
    });
    Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
      yieldEvents.push("second");
      Scheduler.log("second");
    });

    const flushNumberZero = captureCall(() =>
      Scheduler.unstable_flushNumberOfYields(0)
    );
    const afterZero = {
      events: yieldEvents.slice(),
      log: Scheduler.unstable_clearLog(),
      hasPendingWork: Scheduler.unstable_hasPendingWork()
    };
    const flushNumberOne = captureCall(() =>
      Scheduler.unstable_flushNumberOfYields(1)
    );
    const afterOne = {
      events: yieldEvents.slice(),
      log: Scheduler.unstable_clearLog(),
      hasPendingWork: Scheduler.unstable_hasPendingWork()
    };
    const flushNumberOneAgain = captureCall(() =>
      Scheduler.unstable_flushNumberOfYields(1)
    );
    const afterOneAgain = {
      events: yieldEvents.slice(),
      log: Scheduler.unstable_clearLog(),
      hasPendingWork: Scheduler.unstable_hasPendingWork()
    };
    const finishFlush = captureCall(() =>
      Scheduler.unstable_flushAllWithoutAsserting()
    );
    const afterFinish = {
      events: yieldEvents.slice(),
      log: Scheduler.unstable_clearLog(),
      hasPendingWork: Scheduler.unstable_hasPendingWork()
    };

    return {
      empty,
      flushAllWithPreExistingLog,
      preExistingLogAfterThrow,
      flushAllWithYieldedValue,
      yieldedLogAfterThrow,
      flushNumberOfYields: {
        flushNumberZero,
        afterZero,
        flushNumberOne,
        afterOne,
        flushNumberOneAgain,
        afterOneAgain,
        finishFlush,
        afterFinish
      }
    };
  },

  "scheduler-mock-pending-delayed-expired": (target) => {
    const Scheduler = loadSchedulerMock(target);
    Scheduler.reset();

    const delayedEvents = [];
    Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
      delayedEvents.push(["ready", Scheduler.unstable_now()]);
    });
    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      (didTimeout) => {
        delayedEvents.push(["delay10", Scheduler.unstable_now(), didTimeout]);
      },
      { delay: 10 }
    );
    const cancelledDelayedTask = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      () => {
        delayedEvents.push(["cancelled-delay", Scheduler.unstable_now()]);
      },
      { delay: 5 }
    );
    Scheduler.unstable_cancelCallback(cancelledDelayedTask);

    const pendingBeforeFirstFlush = Scheduler.unstable_hasPendingWork();
    const firstFlush = captureCall(() =>
      Scheduler.unstable_flushAllWithoutAsserting()
    );
    const afterFirstFlush = {
      events: delayedEvents.slice(),
      now: Scheduler.unstable_now(),
      hasPendingWork: Scheduler.unstable_hasPendingWork()
    };
    const advanceNine = captureCall(() => Scheduler.unstable_advanceTime(9));
    const afterNine = {
      events: delayedEvents.slice(),
      now: Scheduler.unstable_now(),
      hasPendingWork: Scheduler.unstable_hasPendingWork()
    };
    const advanceOne = captureCall(() => Scheduler.unstable_advanceTime(1));
    const afterTen = {
      events: delayedEvents.slice(),
      now: Scheduler.unstable_now(),
      hasPendingWork: Scheduler.unstable_hasPendingWork()
    };
    const secondFlush = captureCall(() =>
      Scheduler.unstable_flushAllWithoutAsserting()
    );
    const afterSecondFlush = {
      events: delayedEvents.slice(),
      now: Scheduler.unstable_now(),
      hasPendingWork: Scheduler.unstable_hasPendingWork()
    };

    Scheduler.reset();
    const expiredEvents = [];
    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      (didTimeout) => {
        expiredEvents.push(["normal", didTimeout, Scheduler.unstable_now()]);
      }
    );
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
    const flushExpired = captureCall(() => Scheduler.unstable_flushExpired());
    const afterFlushExpired = {
      events: expiredEvents.slice(),
      hasPendingWork: Scheduler.unstable_hasPendingWork(),
      now: Scheduler.unstable_now()
    };
    const finishExpiredFlush = captureCall(() =>
      Scheduler.unstable_flushAllWithoutAsserting()
    );
    const afterFinishExpired = {
      events: expiredEvents.slice(),
      hasPendingWork: Scheduler.unstable_hasPendingWork(),
      now: Scheduler.unstable_now()
    };

    return {
      delayed: {
        pendingBeforeFirstFlush,
        firstFlush,
        afterFirstFlush,
        advanceNine,
        afterNine,
        advanceOne,
        afterTen,
        secondFlush,
        afterSecondFlush,
        cancelledDelayedTask: describeScheduledTask(cancelledDelayedTask)
      },
      expired: {
        flushExpired,
        afterFlushExpired,
        finishExpiredFlush,
        afterFinishExpired
      }
    };
  },

  "scheduler-mock-continuations-and-paint": (target) => {
    const Scheduler = loadSchedulerMock(target);
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

    const flushOneYield = captureCall(() =>
      Scheduler.unstable_flushNumberOfYields(1)
    );
    const afterOneYield = {
      events: continuationEvents.slice(),
      log: Scheduler.unstable_clearLog(),
      hasPendingWork: Scheduler.unstable_hasPendingWork()
    };
    const continuationFinishFlush = captureCall(() =>
      Scheduler.unstable_flushAllWithoutAsserting()
    );
    const afterContinuationFinish = {
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

    const flushUntilNextPaint = captureCall(() =>
      Scheduler.unstable_flushUntilNextPaint()
    );
    const afterFlushUntilNextPaint = {
      events: paintEvents.slice(),
      log: Scheduler.unstable_clearLog(),
      hasPendingWork: Scheduler.unstable_hasPendingWork()
    };
    const paintFinishFlush = captureCall(() =>
      Scheduler.unstable_flushAllWithoutAsserting()
    );
    const afterPaintFinish = {
      events: paintEvents.slice(),
      log: Scheduler.unstable_clearLog(),
      hasPendingWork: Scheduler.unstable_hasPendingWork()
    };

    return {
      continuation: {
        flushOneYield,
        afterOneYield,
        finishFlush: continuationFinishFlush,
        afterFinish: afterContinuationFinish
      },
      paint: {
        flushUntilNextPaint,
        afterFlushUntilNextPaint,
        finishFlush: paintFinishFlush,
        afterFinish: afterPaintFinish
      }
    };
  },

  "scheduler-mock-reset-behavior": (target) => {
    const Scheduler = loadSchedulerMock(target);
    Scheduler.reset();

    Scheduler.unstable_advanceTime(13);
    Scheduler.log("before-reset");
    const resetAfterTimeAndLog = captureCall(() => Scheduler.reset());
    const afterReset = {
      now: Scheduler.unstable_now(),
      log: Scheduler.unstable_clearLog(),
      hasPendingWork: Scheduler.unstable_hasPendingWork()
    };

    Scheduler.reset();
    const resetDuringFlushEvents = [];
    Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
      const resetInsideCallback = captureCall(() => Scheduler.reset());
      resetDuringFlushEvents.push(resetInsideCallback);
    });
    const flushResetDuringFlush = captureCall(() =>
      Scheduler.unstable_flushAllWithoutAsserting()
    );

    Scheduler.reset();
    const resetPendingEvents = [];
    Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
      resetPendingEvents.push("old");
    });
    const pendingBeforeReset = Scheduler.unstable_hasPendingWork();
    const resetWithPending = captureCall(() => Scheduler.reset());
    const pendingAfterReset = Scheduler.unstable_hasPendingWork();
    Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
      resetPendingEvents.push("new");
    });
    const pendingAfterNewSchedule = Scheduler.unstable_hasPendingWork();
    const flushAfterNewSchedule = captureCall(() =>
      Scheduler.unstable_flushAllWithoutAsserting()
    );

    return {
      resetAfterTimeAndLog,
      afterReset,
      resetDuringFlush: {
        flush: flushResetDuringFlush,
        events: resetDuringFlushEvents,
        hasPendingWork: Scheduler.unstable_hasPendingWork()
      },
      resetWithPendingWork: {
        pendingBeforeReset,
        resetWithPending,
        pendingAfterReset,
        pendingAfterNewSchedule,
        flushAfterNewSchedule,
        events: resetPendingEvents,
        now: Scheduler.unstable_now()
      }
    };
  }
};

main();

function loadSchedulerMock(target) {
  return require(`${target}/unstable_mock`);
}

function priorityEntries(Scheduler) {
  return [
    ["immediate", Scheduler.unstable_ImmediatePriority],
    ["user-blocking", Scheduler.unstable_UserBlockingPriority],
    ["normal", Scheduler.unstable_NormalPriority],
    ["low", Scheduler.unstable_LowPriority],
    ["idle", Scheduler.unstable_IdlePriority]
  ];
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

function describeScheduledTask(task) {
  const ownKeys = Reflect.ownKeys(task).map(describeKey);
  const objectKeys = Object.keys(task);
  const descriptors = objectKeys.map((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(task, key);
    return {
      key,
      descriptor: {
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,
        writable: descriptor.writable,
        valueType: describeTaskFieldValue(key, descriptor.value)
      }
    };
  });

  return {
    ownKeys,
    objectKeys,
    descriptors,
    id: {
      value: task.id,
      isInteger: Number.isInteger(task.id),
      isPositive: task.id > 0
    },
    callback: describeValue(task.callback),
    priorityLevel: task.priorityLevel,
    startTime: task.startTime,
    expirationTime: task.expirationTime,
    sortIndex: task.sortIndex,
    expirationDelta: classifyTimeoutDelta(task.expirationTime - task.startTime),
    sortIndexRole:
      task.sortIndex === task.startTime
        ? "startTime"
        : task.sortIndex === task.expirationTime
          ? "expirationTime"
          : "other",
    expirationTimeAfterStartTime: task.expirationTime >= task.startTime
  };
}

function describeTaskFieldValue(key, value) {
  if (key === "callback") {
    return describeValue(value);
  }
  if (key === "id") {
    return {
      type: "number",
      integer: Number.isInteger(value),
      positive: value > 0
    };
  }
  if (key === "priorityLevel") {
    return {
      type: "number",
      value
    };
  }
  if (
    key === "startTime" ||
    key === "expirationTime" ||
    key === "sortIndex"
  ) {
    return {
      type: "number",
      finite: Number.isFinite(value)
    };
  }
  return describeValue(value);
}

function classifyTimeoutDelta(delta) {
  if (Object.is(delta, -1)) {
    return "-1ms";
  }
  if (Object.is(delta, 250)) {
    return "250ms";
  }
  if (Object.is(delta, 5000)) {
    return "5000ms";
  }
  if (Object.is(delta, 10000)) {
    return "10000ms";
  }
  if (Object.is(delta, 1073741823)) {
    return "1073741823ms";
  }
  return "unknown";
}

function describeDescriptor(descriptor) {
  if (!descriptor) {
    return null;
  }

  if ("value" in descriptor) {
    return {
      kind: "data",
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      writable: descriptor.writable,
      value: describeValue(descriptor.value)
    };
  }

  return {
    kind: "accessor",
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    get: describeValue(descriptor.get),
    set: describeValue(descriptor.set)
  };
}

function describeValue(value) {
  if (value === null) {
    return {
      type: "null"
    };
  }
  if (value === undefined) {
    return {
      type: "undefined"
    };
  }
  if (typeof value === "number") {
    return {
      type: "number",
      value: Number.isNaN(value) ? "NaN" : value
    };
  }
  if (typeof value === "string") {
    return {
      type: "string",
      value
    };
  }
  if (typeof value === "boolean") {
    return {
      type: "boolean",
      value
    };
  }
  if (typeof value === "symbol") {
    return {
      type: "symbol",
      key: Symbol.keyFor(value) ?? null,
      description: value.description ?? null
    };
  }
  if (typeof value === "function") {
    return {
      type: "function",
      name: value.name,
      length: value.length
    };
  }
  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length,
      items: value.map(describeValue)
    };
  }
  if (typeof value === "object") {
    return {
      type: "object",
      tag: Object.prototype.toString.call(value),
      ownKeys: Reflect.ownKeys(value).map(describeKey)
    };
  }

  return {
    type: typeof value
  };
}

function describeKey(key) {
  if (typeof key === "symbol") {
    return {
      type: "symbol",
      key: Symbol.keyFor(key) ?? null,
      description: key.description ?? null
    };
  }
  return {
    type: "string",
    value: key
  };
}

function describeThrown(error) {
  return {
    status: "throws",
    name: error?.name ?? null,
    message:
      typeof error?.message === "string"
        ? normalizePathFragments(error.message)
        : null,
    code: error?.code ?? null,
    entrypoint: error?.entrypoint ?? null,
    exportName: error?.exportName ?? null,
    compatibilityTarget: error?.compatibilityTarget ?? null
  };
}

function captureOperation(label, operation) {
  try {
    return {
      status: "returned",
      value: operation()
    };
  } catch (error) {
    return {
      status: "throws",
      label,
      error: describeThrown(error)
    };
  }
}

function captureCall(callback) {
  try {
    return {
      status: "returned",
      value: describeValue(callback())
    };
  } catch (error) {
    return describeThrown(error);
  }
}

function captureCallRaw(callback) {
  try {
    return {
      status: "returned",
      value: callback()
    };
  } catch (error) {
    return describeThrown(error);
  }
}

function selectPackageJsonFields(packageJson) {
  return {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description ?? null,
    main: packageJson.main ?? null,
    type: packageJson.type ?? null,
    exports: packageJson.exports ?? null,
    private: packageJson.private ?? null,
    engines: packageJson.engines ?? null
  };
}

function normalizePathFragments(message) {
  return message
    .replace(/file:\/\/[^\s)]+/gu, "file://<path>")
    .replace(/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)]+/gu, "<path>");
}
