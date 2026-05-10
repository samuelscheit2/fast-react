import { createRequire } from "node:module";
import { relative, sep } from "node:path";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const scenarioId = process.argv[3];

if (!targetPackage || !scenarioId) {
  throw new Error(
    "Usage: node scheduler-post-task-probe-runner.mjs <package> <scenario>"
  );
}

const POST_TASK_EXPORT_KEYS = [
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

async function main() {
  const scenario = scenarios[scenarioId];
  if (!scenario) {
    throw new Error(`Unknown scheduler-post-task scenario: ${scenarioId}`);
  }

  return captureOperation(scenarioId, () => scenario(targetPackage));
}

const scenarios = {
  "scheduler-post-task-export-shape": async (target) => {
    resetPostTaskGlobals();
    const shim = installPostTaskShim({ withYield: true });
    const Scheduler = loadPostTaskScheduler(target);
    const packageJson = require(`${target}/package.json`);
    const exportKeys = Object.keys(Scheduler);

    return {
      packageJson: selectPackageJsonFields(packageJson),
      requireResolution: probeResolve(`${target}/unstable_post_task`),
      shimEnvironment: shim.describeEnvironment(),
      exportKeys,
      ownKeys: Reflect.ownKeys(Scheduler).map(describeKey),
      expectedRootExportKeysSubset: POST_TASK_EXPORT_KEYS,
      constants: readPriorityConstants(Scheduler),
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
        })),
      initialNow: Scheduler.unstable_now(),
      initialShouldYield: Scheduler.unstable_shouldYield(),
      noops: {
        requestPaint: describeValue(Scheduler.unstable_requestPaint()),
        forceFrameRate: describeValue(Scheduler.unstable_forceFrameRate(60))
      }
    };
  },

  "scheduler-post-task-environment-require": async (target) => ({
    cases: [
      probeEnvironmentCase({
        label: "plain-node-missing-window",
        target
      }),
      probeEnvironmentCase({
        label: "window-without-performance",
        target,
        setup() {
          globalThis.window = {
            setTimeout() {
              return 1;
            }
          };
        }
      }),
      probeEnvironmentCase({
        label: "minimal-window-without-task-controller",
        target,
        setup() {
          installMinimalWindow();
        },
        operation(Scheduler) {
          return {
            now: Scheduler.unstable_now(),
            initialShouldYield: Scheduler.unstable_shouldYield(),
            scheduleCallback: captureCall(() =>
              Scheduler.unstable_scheduleCallback(
                Scheduler.unstable_NormalPriority,
                () => {}
              )
            )
          };
        }
      }),
      probeEnvironmentCase({
        label: "task-controller-without-global-scheduler",
        target,
        setup() {
          installMinimalWindow();
          installBasicTaskController();
        },
        operation(Scheduler) {
          return {
            scheduleCallback: captureCall(() =>
              Scheduler.unstable_scheduleCallback(
                Scheduler.unstable_NormalPriority,
                () => {}
              )
            )
          };
        }
      }),
      probeEnvironmentCase({
        label: "scheduler-without-post-task",
        target,
        setup() {
          installMinimalWindow();
          installBasicTaskController();
          globalThis.scheduler = {};
        },
        operation(Scheduler) {
          return {
            scheduleCallback: captureCall(() =>
              Scheduler.unstable_scheduleCallback(
                Scheduler.unstable_NormalPriority,
                () => {}
              )
            )
          };
        }
      })
    ]
  }),

  "scheduler-post-task-priority-context": async (target) => {
    resetPostTaskGlobals();
    installPostTaskShim({ withYield: true });
    const Scheduler = loadPostTaskScheduler(target);
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

    const invalidRunWithPriority = [0, 6, 99].map((priorityLevel) => ({
      input: describeValue(priorityLevel),
      currentPriorityLevel: Scheduler.unstable_runWithPriority(
        priorityLevel,
        () => Scheduler.unstable_getCurrentPriorityLevel()
      ),
      afterReturnPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
    }));

    const restorationAfterThrow = captureCallRaw(() => {
      try {
        Scheduler.unstable_runWithPriority(
          Scheduler.unstable_ImmediatePriority,
          () => {
            throw new Error("post-task priority context probe");
          }
        );
      } catch (error) {
        return {
          error: describeError(error),
          currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
        };
      }
      throw new Error("runWithPriority did not throw");
    });

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
            thisType: typeof this,
            thisIsUndefined: this === undefined,
            thisLabel: this?.label ?? null,
            args: [first, second],
            currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
          };
        });
        return Scheduler.unstable_runWithPriority(
          Scheduler.unstable_LowPriority,
          () => ({
            beforeCallPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel(),
            callResult: captureCallRaw(() =>
              wrapped.call({ label: "receiver" }, "alpha", "beta")
            ),
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

  "scheduler-post-task-scheduling": async (target) => {
    resetPostTaskGlobals();
    const shim = installPostTaskShim({ withYield: true });
    const Scheduler = loadPostTaskScheduler(target);
    const callbackEvents = [];
    const schedulingCases = [
      ["immediate", Scheduler.unstable_ImmediatePriority, undefined],
      ["user-blocking-null-options", Scheduler.unstable_UserBlockingPriority, null],
      ["normal-empty-options", Scheduler.unstable_NormalPriority, {}],
      ["low-delay", Scheduler.unstable_LowPriority, { delay: 7 }],
      ["idle-zero-delay", Scheduler.unstable_IdlePriority, { delay: 0 }],
      ["invalid-delay", 99, { delay: 2 }]
    ];

    const scheduled = schedulingCases.map(([label, priorityLevel, options]) => {
      const node = Scheduler.unstable_scheduleCallback(
        priorityLevel,
        (didTimeout) => {
          callbackEvents.push({
            label,
            didTimeout,
            currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel(),
            shouldYieldAtCallbackStart: Scheduler.unstable_shouldYield()
          });
          if (label === "immediate") {
            shim.setNow(105);
            callbackEvents.push({
              label: "immediate-at-deadline",
              shouldYieldAtDeadline: Scheduler.unstable_shouldYield()
            });
            shim.setNow(100);
          }
        },
        options
      );
      const scheduleEvents = shim.takeEvents();
      return {
        label,
        priorityLevel,
        inputOptions: describeValue(options),
        returnedNode: describePostTaskNode(node),
        scheduleEvents
      };
    });

    const flush = shim.flushPostTasks();

    return {
      scheduled,
      flush,
      callbackEvents,
      pendingPostTaskCount: shim.pendingPostTaskCount(),
      shimEventsAfterFlush: shim.takeEvents()
    };
  },

  "scheduler-post-task-cancellation": async (target) => {
    resetPostTaskGlobals();
    const shim = installPostTaskShim({ withYield: true });
    const Scheduler = loadPostTaskScheduler(target);
    let callbackRan = false;
    const node = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      () => {
        callbackRan = true;
      }
    );
    const scheduleEvents = shim.takeEvents();
    const beforeCancel = describePostTaskNode(node);
    const cancelReturn = describeValue(Scheduler.unstable_cancelCallback(node));
    const afterCancel = describePostTaskNode(node);
    const abortEvents = shim.takeEvents();
    const flush = shim.flushPostTasks();

    return {
      scheduleEvents,
      beforeCancel,
      cancelReturn,
      afterCancel,
      abortEvents,
      flush,
      callbackRan,
      pendingPostTaskCount: shim.pendingPostTaskCount()
    };
  },

  "scheduler-post-task-continuations": async (target) => ({
    withSchedulerYield: runContinuationCase(target, { withYield: true }),
    withoutSchedulerYield: runContinuationCase(target, { withYield: false })
  })
};

main()
  .then((result) => {
    process.stdout.write(JSON.stringify(result));
  })
  .catch((error) => {
    process.stdout.write(
      JSON.stringify({
        status: "throws",
        error: describeError(error)
      })
    );
    process.exitCode = 1;
  });

function loadPostTaskScheduler(target) {
  return require(`${target}/unstable_post_task`);
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

function runContinuationCase(target, { withYield }) {
  clearSchedulerModuleCache();
  resetPostTaskGlobals();
  const shim = installPostTaskShim({ withYield });
  const Scheduler = loadPostTaskScheduler(target);
  const events = [];
  const node = Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_NormalPriority,
    () => {
      events.push({
        label: "normal-start",
        currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
      });
      return () => {
        events.push({
          label: "normal-continuation",
          currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
        });
      };
    }
  );
  const scheduleEvents = shim.takeEvents();
  const flush = shim.flushPostTasks();
  const postFlushShimEvents = shim.takeEvents();

  return {
    withYield,
    returnedNode: describePostTaskNode(node),
    scheduleEvents,
    flush,
    events,
    postFlushShimEvents,
    pendingPostTaskCount: shim.pendingPostTaskCount()
  };
}

function probeEnvironmentCase({ label, target, setup, operation }) {
  clearSchedulerModuleCache();
  resetPostTaskGlobals();
  setup?.();

  const requireResult = probeRequire(`${target}/unstable_post_task`);
  let operationResult = null;
  if (requireResult.require.status === "ok" && operation) {
    operationResult = captureCallRaw(() => operation(requireResult.moduleValue));
  }

  return {
    label,
    require: omitModuleValue(requireResult),
    operation: operationResult
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
      events.push({
        type: "window.setTimeout",
        callbackType: typeof callback
      });
      return 1;
    }
  };
  globalThis.TaskController = TaskController;
  globalThis.scheduler = {
    postTask(task, options = {}) {
      events.push(describePostTaskCall(options));
      postTaskQueue.push({ task, options });
      return catchableThenable();
    }
  };

  if (withYield) {
    globalThis.scheduler.yield = (options = {}) => {
      events.push({
        type: "yield",
        signalId: options.signal?.id ?? null,
        signalPriority: options.signal?.priority ?? null,
        signalAborted: options.signal?.aborted ?? null
      });
      return {
        then(onFulfilled) {
          events.push({
            type: "yield.then",
            signalId: options.signal?.id ?? null,
            signalPriority: options.signal?.priority ?? null,
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
    describeEnvironment() {
      return {
        hasWindow: typeof window === "object",
        hasWindowPerformanceNow: typeof window.performance?.now === "function",
        hasWindowSetTimeout: typeof window.setTimeout === "function",
        hasTaskController: typeof TaskController === "function",
        hasSchedulerPostTask: typeof scheduler.postTask === "function",
        hasSchedulerYield: typeof scheduler.yield === "function"
      };
    },
    setNow(value) {
      now = value;
    },
    takeEvents() {
      const taken = events.slice();
      events.length = 0;
      return taken;
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
            signalId: next.options.signal.id,
            signalPriority: next.options.signal.priority
          });
          continue;
        }
        flushEvents.push({
          type: "run-post-task",
          signalId: next.options.signal?.id ?? null,
          signalPriority: next.options.signal?.priority ?? null
        });
        next.task();
      }
      return flushEvents;
    },
    pendingPostTaskCount() {
      return postTaskQueue.length;
    }
  };
}

function installMinimalWindow() {
  globalThis.window = {
    performance: {
      now: () => 123
    },
    setTimeout() {
      return 1;
    }
  };
}

function installBasicTaskController() {
  globalThis.TaskController = class TaskController {
    constructor(options) {
      this.priority = options.priority;
      this.signal = {
        aborted: false,
        priority: options.priority
      };
    }

    abort() {
      this.signal.aborted = true;
    }
  };
}

function describePostTaskCall(options) {
  return {
    type: "postTask",
    hasDelayProperty: Object.hasOwn(options, "delay"),
    delay: describeValue(options.delay),
    signalId: options.signal?.id ?? null,
    signalPriority: options.signal?.priority ?? null,
    signalAborted: options.signal?.aborted ?? null
  };
}

function catchableThenable() {
  return {
    catch() {
      return this;
    }
  };
}

function resetPostTaskGlobals() {
  delete globalThis.window;
  delete globalThis.scheduler;
  delete globalThis.TaskController;
}

function clearSchedulerModuleCache() {
  for (const id of Object.keys(require.cache)) {
    if (
      id.includes(`${sep}node_modules${sep}scheduler${sep}`) ||
      id.includes(`${sep}node_modules${sep}fast-react-scheduler${sep}`)
    ) {
      delete require.cache[id];
    }
  }
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
      ...describeError(error)
    };
  }
}

function probeRequire(specifier) {
  const requireResolve = probeResolve(specifier);

  try {
    const moduleValue = require(specifier);
    return {
      specifier,
      requireResolve,
      require: describeModule(moduleValue),
      moduleValue
    };
  } catch (error) {
    return {
      specifier,
      requireResolve,
      require: describeError(error),
      moduleValue: null
    };
  }
}

function omitModuleValue(result) {
  return {
    specifier: result.specifier,
    requireResolve: result.requireResolve,
    require: result.require
  };
}

function describeModule(moduleValue) {
  const exportKeys = Object.keys(moduleValue);
  return {
    status: "ok",
    exportKeys,
    priorityConstants: POST_TASK_EXPORT_KEYS.some((key) => key in moduleValue)
      ? readPriorityConstants(moduleValue)
      : null
  };
}

function describePostTaskNode(node) {
  const descriptor = Object.getOwnPropertyDescriptor(node, "_controller");
  const controller = node?._controller;
  const signal = controller?.signal;

  return {
    ownKeys: Object.keys(node),
    descriptors: [
      {
        key: "_controller",
        descriptor: describeDescriptor(descriptor)
      }
    ],
    controllerOwnKeys:
      controller && typeof controller === "object"
        ? Object.keys(controller)
        : [],
    signal: signal
      ? {
          ownKeys: Object.keys(signal),
          id: signal.id ?? null,
          aborted: signal.aborted,
          priority: signal.priority
        }
      : null
  };
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

function captureCall(callback) {
  try {
    return {
      status: "ok",
      value: describeValue(callback())
    };
  } catch (error) {
    return describeError(error);
  }
}

function captureCallRaw(callback) {
  try {
    return {
      status: "ok",
      value: callback()
    };
  } catch (error) {
    return describeError(error);
  }
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

  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length
    };
  }

  if (typeof value === "object") {
    return {
      type: "object",
      objectTag: Object.prototype.toString.call(value),
      ownKeys: Object.keys(value)
    };
  }

  return {
    type: typeof value,
    value
  };
}

function describeKey(key) {
  if (typeof key === "symbol") {
    return {
      type: "symbol",
      description: key.description ?? null,
      stringValue: String(key)
    };
  }
  return {
    type: "string",
    value: key
  };
}

function describeError(error) {
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
