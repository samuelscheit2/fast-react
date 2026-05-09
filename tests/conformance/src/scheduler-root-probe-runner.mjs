import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const scenarioId = process.argv[3];

if (!targetPackage || !scenarioId) {
  throw new Error(
    "Usage: node scheduler-root-probe-runner.mjs <package> <scenario>"
  );
}

const consoleCalls = [];
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  consoleCalls.push({
    method: "error",
    args: args.map((arg) => describeValue(arg))
  });
};
console.warn = (...args) => {
  consoleCalls.push({
    method: "warn",
    args: args.map((arg) => describeValue(arg))
  });
};

async function main() {
  const scenario = scenarios[scenarioId];
  if (!scenario) {
    throw new Error(`Unknown scheduler-root scenario: ${scenarioId}`);
  }

  return captureOperation(scenarioId, () => scenario(targetPackage));
}

const scenarios = {
  "scheduler-root-export-shape": async (target) => {
    const Scheduler = loadScheduler(target);
    const packageJson = require(`${target}/package.json`);
    const exportKeys = Object.keys(Scheduler);

    return {
      packageJson: {
        name: packageJson.name,
        version: packageJson.version,
        main: packageJson.main ?? null,
        type: packageJson.type ?? null,
        exports: packageJson.exports ?? null
      },
      exportKeys,
      ownKeys: Reflect.ownKeys(Scheduler).map(describeKey),
      constants: {
        unstable_ImmediatePriority: Scheduler.unstable_ImmediatePriority,
        unstable_UserBlockingPriority: Scheduler.unstable_UserBlockingPriority,
        unstable_NormalPriority: Scheduler.unstable_NormalPriority,
        unstable_LowPriority: Scheduler.unstable_LowPriority,
        unstable_IdlePriority: Scheduler.unstable_IdlePriority,
        unstable_Profiling: Scheduler.unstable_Profiling
      },
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

  "scheduler-root-task-object-shape": async (target) => {
    const Scheduler = loadScheduler(target);
    const readyTasks = [
      ["immediate", Scheduler.unstable_ImmediatePriority],
      ["user-blocking", Scheduler.unstable_UserBlockingPriority],
      ["normal", Scheduler.unstable_NormalPriority],
      ["low", Scheduler.unstable_LowPriority],
      ["idle", Scheduler.unstable_IdlePriority]
    ].map(([label, priorityLevel]) => {
      const beforeNow = Scheduler.unstable_now();
      const task = Scheduler.unstable_scheduleCallback(priorityLevel, () => {});
      const beforeCancel = describeScheduledTask(task, {
        beforeNow,
        expectedDelay: 0
      });
      Scheduler.unstable_cancelCallback(task);
      const afterCancel = describeScheduledTask(task, {
        beforeNow,
        expectedDelay: 0
      });
      return {
        label,
        beforeCancel,
        afterCancel
      };
    });

    const delayedBeforeNow = Scheduler.unstable_now();
    const delayedTask = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      () => {},
      { delay: 40 }
    );
    const delayedBeforeCancel = describeScheduledTask(delayedTask, {
      beforeNow: delayedBeforeNow,
      expectedDelay: 40
    });
    Scheduler.unstable_cancelCallback(delayedTask);
    const delayedAfterCancel = describeScheduledTask(delayedTask, {
      beforeNow: delayedBeforeNow,
      expectedDelay: 40
    });

    return {
      readyTasks,
      delayedTask: {
        label: "normal-delayed-40ms",
        beforeCancel: delayedBeforeCancel,
        afterCancel: delayedAfterCancel
      }
    };
  },

  "scheduler-root-priority-ordering": async (target) => {
    const Scheduler = loadScheduler(target);
    const events = [];
    const scheduledOrder = [
      ["idle", Scheduler.unstable_IdlePriority],
      ["low", Scheduler.unstable_LowPriority],
      ["normal", Scheduler.unstable_NormalPriority],
      ["user-blocking", Scheduler.unstable_UserBlockingPriority],
      ["immediate", Scheduler.unstable_ImmediatePriority]
    ];

    for (const [label, priorityLevel] of scheduledOrder) {
      Scheduler.unstable_scheduleCallback(priorityLevel, () => {
        events.push({
          label,
          currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
        });
      });
    }

    await waitForEventCount(events, scheduledOrder.length);

    return {
      scheduledOrder: scheduledOrder.map(([label]) => label),
      runOrder: events.map((event) => event.label),
      events
    };
  },

  "scheduler-root-equal-priority-fifo": async (target) => {
    const Scheduler = loadScheduler(target);
    const events = [];

    for (const label of ["first", "second", "third", "fourth"]) {
      Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
        events.push({
          label,
          currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
        });
      });
    }

    await waitForEventCount(events, 4);

    return {
      runOrder: events.map((event) => event.label),
      events
    };
  },

  "scheduler-root-delayed-callbacks": async (target) => {
    const Scheduler = loadScheduler(target);
    const events = [];

    Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
      events.push({
        label: "ready-normal",
        didTimeout: "not-captured-for-order"
      });
    });
    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      (didTimeout) => {
        events.push({
          label: "delayed-normal",
          didTimeout
        });
      },
      { delay: 40 }
    );
    const cancelledDelayed = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      () => {
        events.push({
          label: "cancelled-delayed",
          didTimeout: "should-not-run"
        });
      },
      { delay: 20 }
    );
    Scheduler.unstable_cancelCallback(cancelledDelayed);

    await waitForEventCount(events, 2, 1500);

    return {
      runOrder: events.map((event) => event.label),
      events,
      cancelledDelayedCallbackAfterCancel: describeValue(
        cancelledDelayed.callback
      ),
      cancelledDelayedRan: events.some(
        (event) => event.label === "cancelled-delayed"
      )
    };
  },

  "scheduler-root-cancellation": async (target) => {
    const Scheduler = loadScheduler(target);
    const events = [];

    Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
      events.push("first");
    });
    const cancelledTask = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      () => {
        events.push("cancelled");
      }
    );
    Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
      events.push("third");
    });
    const beforeCancelCallback = describeValue(cancelledTask.callback);
    Scheduler.unstable_cancelCallback(cancelledTask);
    const afterCancelCallback = describeValue(cancelledTask.callback);

    await waitForEventCount(events, 2);
    await waitForQuietTurn();

    return {
      beforeCancelCallback,
      afterCancelCallback,
      runOrder: events,
      cancelledTask: describeScheduledTask(cancelledTask, {
        beforeNow: 0,
        expectedDelay: 0
      })
    };
  },

  "scheduler-root-continuations": async (target) => {
    const Scheduler = loadScheduler(target);
    const events = [];

    Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
      events.push({
        label: "first-callback",
        currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
      });
      return () => {
        events.push({
          label: "first-continuation",
          currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
        });
      };
    });
    Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
      events.push({
        label: "second-callback",
        currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
      });
    });

    await waitForEventCount(events, 3);

    return {
      runOrder: events.map((event) => event.label),
      events
    };
  },

  "scheduler-root-did-timeout": async (target) => {
    const Scheduler = loadScheduler(target);
    const events = [];

    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      (didTimeout) => {
        events.push({
          label: "normal-after-block",
          didTimeout
        });
      }
    );
    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      (didTimeout) => {
        events.push({
          label: "user-blocking-expired",
          didTimeout
        });
      }
    );
    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_ImmediatePriority,
      (didTimeout) => {
        events.push({
          label: "immediate",
          didTimeout
        });
      }
    );

    busyWaitWithSchedulerNow(Scheduler, 400);
    await waitForEventCount(events, 3, 2000);

    return {
      runOrder: events.map((event) => event.label),
      didTimeoutByLabel: Object.fromEntries(
        events.map((event) => [event.label, event.didTimeout])
      ),
      blockDurationCategory: ">=400ms-and-<normal-timeout"
    };
  },

  "scheduler-root-priority-context": async (target) => {
    const Scheduler = loadScheduler(target);
    const priorityEntries = [
      ["immediate", Scheduler.unstable_ImmediatePriority],
      ["user-blocking", Scheduler.unstable_UserBlockingPriority],
      ["normal", Scheduler.unstable_NormalPriority],
      ["low", Scheduler.unstable_LowPriority],
      ["idle", Scheduler.unstable_IdlePriority]
    ];

    const runWithPriority = priorityEntries.map(([label, priorityLevel]) => ({
      label,
      returnValue: Scheduler.unstable_runWithPriority(priorityLevel, () => ({
        currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
      })),
      afterReturnPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
    }));

    const invalidRunWithPriority = [0, 6, "user-blocking", null].map(
      (priorityLevel) => ({
        input: describeValue(priorityLevel),
        currentPriorityLevel: Scheduler.unstable_runWithPriority(
          priorityLevel,
          () => Scheduler.unstable_getCurrentPriorityLevel()
        ),
        afterReturnPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
      })
    );

    const restorationAfterThrow = await captureOperation(
      "runWithPriority throw",
      () => {
        try {
          Scheduler.unstable_runWithPriority(
            Scheduler.unstable_ImmediatePriority,
            () => {
              throw new Error("priority context probe");
            }
          );
        } catch (error) {
          return {
            error: describeError(error),
            currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
          };
        }
        throw new Error("runWithPriority did not throw");
      }
    );

    const nextByParent = priorityEntries.map(([label, priorityLevel]) => ({
      parent: label,
      currentPriorityLevel: Scheduler.unstable_runWithPriority(
        priorityLevel,
        () =>
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

  "scheduler-root-yield-paint-frame-rate": async (target) => {
    const Scheduler = loadScheduler(target);
    const events = [];

    Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
      const firstEvent = {
        label: "first",
        shouldYieldBeforePaint: Scheduler.unstable_shouldYield()
      };
      Scheduler.unstable_forceFrameRate(1);
      busyWaitWithSchedulerNow(Scheduler, 20);
      firstEvent.shouldYieldAfterTwentyMsAtOneFps =
        Scheduler.unstable_shouldYield();
      Scheduler.unstable_requestPaint();
      firstEvent.shouldYieldAfterRequestPaint = Scheduler.unstable_shouldYield();
      Scheduler.unstable_forceFrameRate(126);
      Scheduler.unstable_forceFrameRate(-1);
      Scheduler.unstable_forceFrameRate(0);
      events.push(firstEvent);
    });
    Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
      events.push({
        label: "second",
        shouldYieldAtSecondCallbackStart: Scheduler.unstable_shouldYield()
      });
    });

    await waitForEventCount(events, 2, 1500);

    return {
      runOrder: events.map((event) => event.label),
      events,
      forceFrameRateConsoleErrors: consoleCalls
        .filter((call) =>
          call.args.some(
            (arg) =>
              arg.type === "string" && arg.value.includes("forceFrameRate")
          )
        )
        .map((call) => ({
          method: call.method,
          args: call.args
        }))
    };
  },

  "scheduler-root-node-host-transport": async (target) => {
    const originalSetImmediate = globalThis.setImmediate;
    const transportCalls = [];

    globalThis.setImmediate = function instrumentedSetImmediate(
      callback,
      ...args
    ) {
      transportCalls.push({
        transport: "setImmediate",
        callbackType: typeof callback,
        argumentCount: args.length
      });
      return originalSetImmediate(callback, ...args);
    };

    try {
      const Scheduler = loadScheduler(target);
      const events = [];
      Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
        events.push({
          label: "normal-callback",
          currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
        });
      });
      await waitForEventCount(events, 1);

      return {
        setImmediateAvailable: typeof originalSetImmediate === "function",
        transportCalls,
        firstTransport: transportCalls[0]?.transport ?? null,
        runOrder: events.map((event) => event.label),
        events
      };
    } finally {
      globalThis.setImmediate = originalSetImmediate;
    }
  }
};

function loadScheduler(target) {
  return require(target);
}

async function captureOperation(label, operation) {
  try {
    return {
      status: "returned",
      value: await operation()
    };
  } catch (error) {
    return {
      status: "throws",
      label,
      error: describeError(error)
    };
  }
}

function describeScheduledTask(task, { beforeNow, expectedDelay }) {
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
      isInteger: Number.isInteger(task.id),
      isPositive: task.id > 0
    },
    callback: describeValue(task.callback),
    priorityLevel: task.priorityLevel,
    startTime: classifyStartTime(task.startTime, beforeNow, expectedDelay),
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
  if (key === "startTime") {
    return {
      type: "number",
      finite: Number.isFinite(value)
    };
  }
  if (key === "expirationTime") {
    return {
      type: "number",
      finite: Number.isFinite(value)
    };
  }
  if (key === "sortIndex") {
    return {
      type: "number",
      finite: Number.isFinite(value)
    };
  }
  return describeValue(value);
}

function classifyStartTime(startTime, beforeNow, expectedDelay) {
  if (expectedDelay > 0) {
    return startTime > beforeNow ? "delayed-future-start" : "unexpected-ready";
  }
  return startTime >= beforeNow ? "ready-current-or-future" : "ready-before-probe";
}

function classifyTimeoutDelta(delta) {
  if (approximatelyEqual(delta, -1, 0.001)) {
    return "-1ms";
  }
  if (approximatelyEqual(delta, 250, 0.001)) {
    return "250ms";
  }
  if (approximatelyEqual(delta, 5000, 0.001)) {
    return "5000ms";
  }
  if (approximatelyEqual(delta, 10000, 0.001)) {
    return "10000ms";
  }
  if (approximatelyEqual(delta, 1073741823, 0.001)) {
    return "1073741823ms";
  }
  return "unknown";
}

function approximatelyEqual(actual, expected, tolerance) {
  return Math.abs(actual - expected) <= tolerance;
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

function describeError(error) {
  return {
    name: error?.name ?? null,
    message:
      typeof error?.message === "string"
        ? normalizePathFragments(error.message)
        : null,
    code: error?.code ?? null
  };
}

function normalizePathFragments(message) {
  return message
    .replace(/file:\/\/[^\s)]+/gu, "file://<path>")
    .replace(/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)]+/gu, "<path>");
}

async function waitForEventCount(events, expectedCount, timeoutMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  while (events.length < expectedCount) {
    if (Date.now() > deadline) {
      throw new Error(
        `Timed out waiting for ${expectedCount} scheduler events; observed ${events.length}`
      );
    }
    await delay(5);
  }
}

async function waitForQuietTurn() {
  await delay(20);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function busyWaitWithSchedulerNow(Scheduler, durationMs) {
  const start = Scheduler.unstable_now();
  while (Scheduler.unstable_now() - start < durationMs) {
    // Intentional event-loop block to probe timeout buckets without storing
    // wall-clock values in the checked oracle.
  }
}

try {
  const result = await main();
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
