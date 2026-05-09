import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const scenarioId = process.argv[3];

if (!targetPackage || !scenarioId) {
  throw new Error(
    "Usage: node react-test-renderer-act-probe-runner.mjs <package> <scenario>"
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
    throw new Error(`Unknown react-test-renderer act scenario: ${scenarioId}`);
  }

  const result = await scenario();
  process.stdout.write(
    JSON.stringify({
      targetPackage,
      scenarioId,
      result,
      consoleCalls
    })
  );
}

const scenarios = {
  "react-test-renderer-act-export-shape": async () => {
    const loaded = loadReactTestRenderer();
    if (loaded.status === "throws") {
      return {
        moduleLoad: loaded.error,
        packageJson: readPackageJson(targetPackage),
        exports: null
      };
    }

    const { React, TestRenderer } = loaded;
    const scheduler = TestRenderer._Scheduler;

    return {
      moduleLoad: {
        status: "ok"
      },
      packageJson: readPackageJson(targetPackage),
      reactPackageJson: readPackageJson("react"),
      exportKeys: Object.keys(TestRenderer),
      ownKeys: Reflect.ownKeys(TestRenderer).map(describePropertyKey),
      act: describeExport(TestRenderer, "act"),
      actEqualReactAct: TestRenderer.act === React.act,
      create: describeExport(TestRenderer, "create"),
      unstableBatchedUpdates: describeExport(
        TestRenderer,
        "unstable_batchedUpdates"
      ),
      version: describeExport(TestRenderer, "version"),
      scheduler: describeExport(TestRenderer, "_Scheduler"),
      schedulerExportKeys:
        scheduler && typeof scheduler === "object" ? Object.keys(scheduler) : null,
      selectedFiles: loadedFilesFor([
        "react/index.js",
        "react-test-renderer/index.js",
        "react-test-renderer/cjs/",
        "scheduler/",
        "react-is/"
      ])
    };
  },

  "react-test-renderer-act-sync-update-flushing": async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const loaded = loadReactTestRenderer();
    const availability = requireAct(loaded);
    if (!availability.available) {
      return availability.observation;
    }

    const { React, TestRenderer } = availability;
    const events = [];
    let root = null;

    function Counter() {
      const [count, setCount] = React.useState(0);
      events.push(`render:${count}`);
      React.useEffect(() => {
        events.push(`effect:${count}`);
        if (count === 0) {
          setCount(1);
          events.push("effect-scheduled:set-1");
        }
      }, [count]);
      return React.createElement("text", null, String(count));
    }

    const actReturn = TestRenderer.act(() => {
      root = TestRenderer.create(React.createElement(Counter));
      events.push(`inside-after-create:${JSON.stringify(root.toJSON())}`);
      return "sync-act-return";
    });
    const actReturnShape = describeValue(actReturn);
    const actThenResolution = await resolveThenable(actReturn);

    return {
      availability: {
        status: "available"
      },
      actReturnShape,
      actThenResolution: describeValue(actThenResolution),
      events,
      finalJSON: root.toJSON(),
      rootSchedulerIsPackageScheduler: root._Scheduler === TestRenderer._Scheduler
    };
  },

  "react-test-renderer-act-async-contracts": async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const loaded = loadReactTestRenderer();
    const availability = requireAct(loaded);
    if (!availability.available) {
      return availability.observation;
    }

    const { React, TestRenderer } = availability;
    const events = [];
    let root = null;

    function Leaf() {
      events.push("render:Leaf");
      React.useEffect(() => {
        events.push("effect:Leaf");
      }, []);
      return React.createElement("text", null, "async-leaf");
    }

    const resolvedValue = await TestRenderer.act(async () => {
      root = TestRenderer.create(React.createElement(Leaf));
      events.push(`inside-after-create:${JSON.stringify(root.toJSON())}`);
      await Promise.resolve("microtask");
      events.push(`inside-after-await:${JSON.stringify(root.toJSON())}`);
      return "async-act-return";
    });

    return {
      availability: {
        status: "available"
      },
      resolvedValue: describeValue(resolvedValue),
      events,
      finalJSON: root.toJSON()
    };
  },

  "react-test-renderer-act-warning-surfaces": async () => {
    const loadedWithoutFlag = loadReactTestRenderer();
    const availabilityWithoutFlag = requireAct(loadedWithoutFlag);
    if (!availabilityWithoutFlag.available) {
      return availabilityWithoutFlag.observation;
    }

    const { React, TestRenderer } = availabilityWithoutFlag;
    const missingEnvironmentStart = consoleCalls.length;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
    const missingEnvironment = captureOperation("missing act environment", () =>
      TestRenderer.act(() => {
        TestRenderer.create(React.createElement("text", null, "missing-env"));
      })
    );
    await flushMicrotasks(4);
    const missingEnvironmentConsoleCalls = consoleCalls.slice(
      missingEnvironmentStart
    );

    const unawaitedStart = consoleCalls.length;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const unawaitedThenable = TestRenderer.act(async () => "unawaited-return");
    const unawaitedThenableShape = describeValue(unawaitedThenable);
    await flushMicrotasks(6);
    const unawaitedConsoleCalls = consoleCalls.slice(unawaitedStart);

    return {
      availability: {
        status: "available"
      },
      missingEnvironment,
      missingEnvironmentConsoleCalls,
      unawaitedThenableShape,
      unawaitedConsoleCalls
    };
  },

  "react-test-renderer-act-scheduler-exposure": async () => {
    const loaded = loadReactTestRenderer();
    if (loaded.status === "throws") {
      return {
        availability: {
          status: "module-load-throws",
          moduleLoad: loaded.error
        }
      };
    }

    const Scheduler = loaded.TestRenderer._Scheduler;
    if (!Scheduler || typeof Scheduler !== "object") {
      return {
        availability: {
          status: "missing-scheduler",
          scheduler: describeValue(Scheduler)
        }
      };
    }

    Scheduler.reset();

    return {
      availability: {
        status: "available"
      },
      exportKeys: Object.keys(Scheduler),
      priorityConstants: {
        Immediate: Scheduler.unstable_ImmediatePriority,
        UserBlocking: Scheduler.unstable_UserBlockingPriority,
        Normal: Scheduler.unstable_NormalPriority,
        Low: Scheduler.unstable_LowPriority,
        Idle: Scheduler.unstable_IdlePriority
      },
      currentPriority: describeSchedulerPriority(Scheduler),
      now: Scheduler.unstable_now(),
      logAndClear: captureOperation("scheduler log and clear", () => {
        Scheduler.log("first-yield");
        return Scheduler.unstable_clearLog();
      }),
      scheduleAndFlush: captureOperation("scheduler schedule and flush", () => {
        const task = Scheduler.unstable_scheduleCallback(
          Scheduler.unstable_NormalPriority,
          () => {
            Scheduler.log("scheduled-callback");
            return null;
          }
        );
        const pendingBeforeFlush = Scheduler.unstable_hasPendingWork();
        const flushReturn = Scheduler.unstable_flushAllWithoutAsserting();
        const yielded = Scheduler.unstable_clearLog();
        const pendingAfterFlush = Scheduler.unstable_hasPendingWork();

        return {
          task: {
            id: task.id,
            priorityLevel: task.priorityLevel,
            sortIndex: task.sortIndex,
            callbackType: typeof task.callback
          },
          pendingBeforeFlush,
          flushReturn,
          yielded,
          pendingAfterFlush
        };
      }),
      runWithPriority: captureOperation("scheduler runWithPriority", () =>
        describeSchedulerPriorityValue(
          Scheduler,
          Scheduler.unstable_runWithPriority(
            Scheduler.unstable_LowPriority,
            () => Scheduler.unstable_getCurrentPriorityLevel()
          )
        )
      )
    };
  },

  "react-test-renderer-act-unstable-flush-sync": async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const loaded = loadReactTestRenderer();
    if (loaded.status === "throws") {
      return {
        availability: {
          status: "module-load-throws",
          moduleLoad: loaded.error
        }
      };
    }

    const { React, TestRenderer } = loaded;
    let root = null;
    const actIsCallable = typeof TestRenderer.act === "function";

    if (actIsCallable) {
      await TestRenderer.act(() => {
        root = TestRenderer.create(React.createElement("text", null, "A"));
      });
    } else {
      root = TestRenderer.create(React.createElement("text", null, "A"));
    }

    const flushSync = root.unstable_flushSync;
    if (typeof flushSync !== "function") {
      return {
        availability: {
          status: "missing-root-unstable-flush-sync",
          rootKeys: Object.keys(root),
          unstableFlushSync: describeValue(flushSync)
        }
      };
    }

    const rootShape = {
      keys: Object.keys(root),
      ownKeys: Reflect.ownKeys(root).map(describePropertyKey),
      unstableFlushSync: describeExport(root, "unstable_flushSync"),
      schedulerIsPackageScheduler: root._Scheduler === TestRenderer._Scheduler
    };

    return {
      availability: {
        status: "available",
        actIsCallable
      },
      rootShape,
      beforeFlushJSON: root.toJSON(),
      flushUpdate: captureOperation("unstable_flushSync(update)", () => {
        const before = root.toJSON();
        const callbackReturn = flushSync(() => {
          const duringBeforeUpdate = root.toJSON();
          root.update(React.createElement("text", null, "B"));
          const duringAfterUpdate = root.toJSON();
          return {
            duringBeforeUpdate,
            duringAfterUpdate
          };
        });

        return {
          before,
          callbackReturn,
          after: root.toJSON()
        };
      }),
      noCallback: captureOperation("unstable_flushSync()", () =>
        describeValue(flushSync())
      ),
      nullCallback: captureOperation("unstable_flushSync(null)", () =>
        describeValue(flushSync(null))
      ),
      falseCallback: captureOperation("unstable_flushSync(false)", () =>
        describeValue(flushSync(false))
      ),
      truthyNonFunction: captureOperation("unstable_flushSync({})", () =>
        describeValue(flushSync({}))
      ),
      callbackThrows: captureOperation("unstable_flushSync(callback throws)", () => {
        const error = new Error("test renderer unstable_flushSync sentinel");
        error.code = "TEST_RENDERER_FLUSH_SYNC_SENTINEL";
        return describeValue(
          flushSync(() => {
            throw error;
          })
        );
      }),
      afterThrow: captureOperation("unstable_flushSync(after throw)", () =>
        flushSync(() => {
          root.update(React.createElement("text", null, "C"));
          return "after-throw-return";
        })
      ),
      finalJSON: root.toJSON()
    };
  },

  "react-test-renderer-act-error-aggregation": async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const loaded = loadReactTestRenderer();
    const availability = requireAct(loaded);
    if (!availability.available) {
      return availability.observation;
    }

    const { React, TestRenderer } = availability;

    function Thrower({ label }) {
      const error = new Error(`render ${label}`);
      error.code = label;
      throw error;
    }

    const asyncCallbackRejects = await new Promise((resolve) => {
      TestRenderer.act(async () => {
        const error = new TypeError("async act sentinel");
        error.code = "ASYNC_ACT_SENTINEL";
        throw error;
      }).then(
        (value) =>
          resolve({
            status: "resolved",
            value: describeValue(value)
          }),
        (error) =>
          resolve({
            status: "rejected",
            error: describeThrown(error)
          })
      );
    });

    return {
      availability: {
        status: "available"
      },
      syncCallbackThrows: captureOperation("act sync callback throws", () => {
        const error = new Error("sync act sentinel");
        error.code = "SYNC_ACT_SENTINEL";
        return describeValue(
          TestRenderer.act(() => {
            throw error;
          })
        );
      }),
      asyncCallbackRejects,
      multiRootRenderThrows: captureOperation("act aggregates render errors", () =>
        describeValue(
          TestRenderer.act(() => {
            TestRenderer.create(React.createElement(Thrower, { label: "ONE" }));
            TestRenderer.create(React.createElement(Thrower, { label: "TWO" }));
          })
        )
      )
    };
  }
};

main().catch((error) => {
  originalConsoleError(error);
  process.exitCode = 1;
});

function loadReactTestRenderer() {
  try {
    return {
      status: "ok",
      React: require("react"),
      TestRenderer: require(targetPackage)
    };
  } catch (error) {
    return {
      status: "throws",
      error: describeThrown(error)
    };
  }
}

function requireAct(loaded) {
  if (loaded.status === "throws") {
    return {
      available: false,
      observation: {
        availability: {
          status: "module-load-throws",
          moduleLoad: loaded.error
        }
      }
    };
  }

  const { React, TestRenderer } = loaded;
  if (typeof TestRenderer.act !== "function") {
    return {
      available: false,
      observation: {
        availability: {
          status: "missing-act-function",
          moduleLoad: {
            status: "ok"
          },
          act: describeExport(TestRenderer, "act")
        }
      }
    };
  }

  return {
    available: true,
    React,
    TestRenderer
  };
}

function readPackageJson(packageName) {
  return captureOperation(`${packageName}/package.json`, () => {
    const packageJson = require(`${packageName}/package.json`);
    return {
      name: packageJson.name ?? null,
      version: packageJson.version ?? null,
      main: packageJson.main ?? null,
      exports: packageJson.exports ?? null,
      dependencies: packageJson.dependencies ?? null,
      peerDependencies: packageJson.peerDependencies ?? null
    };
  });
}

function loadedFilesFor(fragments) {
  return Object.keys(require.cache)
    .filter((file) => fragments.some((fragment) => file.includes(fragment)))
    .map((file) => file.replace(/^.*\/node_modules\//u, "node_modules/"))
    .sort();
}

function captureOperation(label, operation) {
  try {
    return {
      label,
      status: "ok",
      value: operation()
    };
  } catch (error) {
    return {
      label,
      status: "throws",
      error: describeThrown(error)
    };
  }
}

function resolveThenable(thenable) {
  return new Promise((resolve, reject) => {
    thenable.then(resolve, reject);
  });
}

async function flushMicrotasks(count) {
  for (let index = 0; index < count; index++) {
    await Promise.resolve();
  }
}

function describeExport(moduleObject, key) {
  const hasOwn = Object.hasOwn(moduleObject, key);
  const descriptor = hasOwn
    ? Object.getOwnPropertyDescriptor(moduleObject, key)
    : null;
  const value = moduleObject[key];

  return {
    key,
    hasOwn,
    hasIn: key in moduleObject,
    descriptor: describeDescriptor(descriptor, 0),
    value: describeValue(value)
  };
}

function describeSchedulerPriority(Scheduler) {
  return describeSchedulerPriorityValue(
    Scheduler,
    Scheduler.unstable_getCurrentPriorityLevel()
  );
}

function describeSchedulerPriorityValue(Scheduler, level) {
  const labels = new Map([
    [Scheduler.unstable_ImmediatePriority, "Immediate"],
    [Scheduler.unstable_UserBlockingPriority, "UserBlocking"],
    [Scheduler.unstable_NormalPriority, "Normal"],
    [Scheduler.unstable_LowPriority, "Low"],
    [Scheduler.unstable_IdlePriority, "Idle"]
  ]);

  return {
    level,
    label: labels.get(level) ?? null
  };
}

function describeThrown(error) {
  const objectError = Object(error);
  return {
    status: "throws",
    name: error?.name ?? null,
    message: error?.message ?? String(error),
    code: error?.code ?? null,
    constructorName: error?.constructor?.name ?? null,
    ownKeys: Reflect.ownKeys(objectError)
      .filter((key) => key !== "stack")
      .map(describePropertyKey),
    ownProperties: Reflect.ownKeys(objectError)
      .filter((key) => key !== "stack")
      .map((key) => ({
        key: describePropertyKey(key),
        value: describeValue(objectError[key])
      })),
    errors: Array.isArray(error?.errors)
      ? error.errors.map((child) => describeThrown(child))
      : null
  };
}

function describeDescriptor(descriptor, depth) {
  if (!descriptor) {
    return null;
  }

  const base = {
    kind: "value" in descriptor ? "data" : "accessor",
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable
  };

  if ("value" in descriptor) {
    return {
      ...base,
      writable: descriptor.writable,
      value: describeValue(descriptor.value, depth)
    };
  }

  return {
    ...base,
    get: describeAccessorFunction(descriptor.get),
    set: describeAccessorFunction(descriptor.set)
  };
}

function describeAccessorFunction(value) {
  return typeof value === "function"
    ? {
        type: "function",
        name: value.name,
        length: value.length
      }
    : {
        type: typeof value
      };
}

function describeValue(value, depth = 0) {
  const valueType = typeof value;

  if (value === null) {
    return {
      type: "null"
    };
  }

  if (valueType === "undefined") {
    return {
      type: "undefined"
    };
  }

  if (
    valueType === "string" ||
    valueType === "number" ||
    valueType === "boolean" ||
    valueType === "bigint"
  ) {
    return {
      type: valueType,
      value: valueType === "bigint" ? value.toString() : value
    };
  }

  if (valueType === "symbol") {
    return {
      type: "symbol",
      description: value.description ?? null,
      stringValue: String(value)
    };
  }

  if (valueType === "function") {
    return {
      type: "function",
      name: value.name,
      length: value.length,
      isAsync: value.constructor?.name === "AsyncFunction",
      ownKeys: Reflect.ownKeys(value).map(describePropertyKey)
    };
  }

  if (valueType === "object") {
    return describeObjectValue(value, depth);
  }

  return {
    type: valueType
  };
}

function describeObjectValue(value, depth) {
  const ownKeys = Reflect.ownKeys(value);
  const summary = {
    type: "object",
    objectTag: Object.prototype.toString.call(value),
    isArray: Array.isArray(value),
    isExtensible: Object.isExtensible(value),
    objectKeys: Object.keys(value),
    ownPropertyNames: Object.getOwnPropertyNames(value),
    ownSymbolKeys: Object.getOwnPropertySymbols(value).map(describePropertyKey),
    ownKeys: ownKeys.map(describePropertyKey)
  };

  if (depth >= 2) {
    return summary;
  }

  return {
    ...summary,
    ownProperties: ownKeys
      .filter((key) => key !== "stack")
      .map((key) => ({
        key: describePropertyKey(key),
        descriptor: describeDescriptor(
          Object.getOwnPropertyDescriptor(value, key),
          depth + 1
        )
      }))
  };
}

function describePropertyKey(key) {
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
