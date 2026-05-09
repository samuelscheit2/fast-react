import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const entrypointId = process.argv[3];
const entrypointSubpath = process.argv[4];
const specifier = process.argv[5];
const scenarioId = process.argv[6];

if (
  !targetPackage ||
  !entrypointId ||
  !entrypointSubpath ||
  !specifier ||
  !scenarioId
) {
  throw new Error(
    "Usage: node react-dom-flush-sync-batching-probe-runner.mjs <package> <entrypoint-id> <subpath> <specifier> <scenario>"
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
    throw new Error(
      `Unknown react-dom-flush-sync-batching scenario: ${scenarioId}`
    );
  }

  const result = await scenario();
  process.stdout.write(
    JSON.stringify({
      targetPackage,
      entrypointId,
      entrypointSubpath,
      specifier,
      scenarioId,
      result,
      consoleCalls
    })
  );
}

const scenarios = {
  "react-dom-flush-sync-batching-export-shape": async () => {
    const loaded = loadReactDom();

    if (loaded.status === "throws") {
      return {
        moduleLoad: loaded.error,
        packageJson: readPackageJson(),
        exports: null
      };
    }

    const ReactDOM = loaded.module;
    return {
      moduleLoad: {
        status: "ok"
      },
      packageJson: readPackageJson(),
      exportKeys: Object.keys(ReactDOM),
      ownKeys: Reflect.ownKeys(ReactDOM).map(describePropertyKey),
      flushSync: describeExport(ReactDOM, "flushSync"),
      unstable_batchedUpdates: describeExport(
        ReactDOM,
        "unstable_batchedUpdates"
      )
    };
  },

  "react-dom-flush-sync-batching-callback-contracts": async () => {
    const loaded = loadReactDom();
    const availability = requireFlushSyncAndBatchedUpdates(loaded);
    if (!availability.available) {
      return availability.observation;
    }

    const { flushSync, unstable_batchedUpdates } = availability;

    return {
      availability: {
        status: "available"
      },
      flushSync: captureOperation("flushSync(callback, extra)", () => {
        const returnObject = {
          marker: "flush-return-object"
        };
        const ignoredArgument = {
          marker: "ignored-extra-argument"
        };
        let callbackArgs = null;
        let callbackThis = null;

        const returned = flushSync(function flushSyncCallback(...args) {
          callbackThis = describeThis(this);
          callbackArgs = args.map((arg) => describeValue(arg));
          return returnObject;
        }, ignoredArgument);

        return {
          callbackThis,
          callbackArgs,
          callbackArgCount: callbackArgs.length,
          returned: describeValue(returned),
          returnedSameObject: returned === returnObject
        };
      }),
      unstable_batchedUpdates: captureOperation(
        "unstable_batchedUpdates(callback, firstArg, ignoredExtra)",
        () => {
          const firstArgument = {
            marker: "first-batched-argument"
          };
          const ignoredArgument = {
            marker: "ignored-extra-batched-argument"
          };
          const returnObject = {
            marker: "batched-return-object"
          };
          let callbackArgs = null;
          let callbackRawArgs = null;
          let callbackThis = null;

          const returned = unstable_batchedUpdates(
            function batchedUpdatesCallback(...args) {
              callbackThis = describeThis(this);
              callbackRawArgs = args;
              callbackArgs = args.map((arg) => describeValue(arg));
              return returnObject;
            },
            firstArgument,
            ignoredArgument
          );

          return {
            callbackThis,
            callbackArgs,
            callbackArgCount: callbackArgs.length,
            firstArgumentSameObject: callbackRawArgs[0] === firstArgument,
            ignoredExtraArgumentReceived: callbackRawArgs.includes(ignoredArgument),
            returned: describeValue(returned),
            returnedSameObject: returned === returnObject
          };
        }
      )
    };
  },

  "react-dom-flush-sync-batching-rootless-inputs": async () => {
    const loaded = loadReactDom();
    const availability = requireFlushSyncAndBatchedUpdates(loaded);
    if (!availability.available) {
      return availability.observation;
    }

    const { flushSync, unstable_batchedUpdates } = availability;
    const beforeGlobals = describeDomGlobals();

    const result = {
      availability: {
        status: "available"
      },
      beforeGlobals,
      flushSyncNoCallback: captureOperation("flushSync()", () =>
        describeValue(flushSync())
      ),
      flushSyncUndefinedCallback: captureOperation("flushSync(undefined)", () =>
        describeValue(flushSync(undefined))
      ),
      flushSyncNullCallback: captureOperation("flushSync(null)", () =>
        describeValue(flushSync(null))
      ),
      flushSyncFalseCallback: captureOperation("flushSync(false)", () =>
        describeValue(flushSync(false))
      ),
      flushSyncTruthyNonFunction: captureOperation("flushSync({})", () =>
        describeValue(flushSync({}))
      ),
      batchedUpdatesNoCallback: captureOperation("unstable_batchedUpdates()", () =>
        describeValue(unstable_batchedUpdates())
      ),
      batchedUpdatesNullCallback: captureOperation(
        "unstable_batchedUpdates(null)",
        () => describeValue(unstable_batchedUpdates(null))
      ),
      batchedUpdatesTruthyNonFunction: captureOperation(
        "unstable_batchedUpdates({})",
        () => describeValue(unstable_batchedUpdates({}))
      ),
      batchedUpdatesUndefinedArg: captureOperation(
        "unstable_batchedUpdates(callback, undefined)",
        () => {
          let callbackArgs = null;
          const returned = unstable_batchedUpdates((...args) => {
            callbackArgs = args.map((arg) => describeValue(arg));
            return "batched-undefined-arg-return";
          }, undefined);

          return {
            callbackArgs,
            returned: describeValue(returned)
          };
        }
      )
    };

    result.afterGlobals = describeDomGlobals();
    result.domGlobalsUnchanged =
      JSON.stringify(result.beforeGlobals) === JSON.stringify(result.afterGlobals);
    return result;
  },

  "react-dom-flush-sync-batching-error-propagation": async () => {
    const loaded = loadReactDom();
    const availability = requireFlushSyncAndBatchedUpdates(loaded);
    if (!availability.available) {
      return availability.observation;
    }

    const { flushSync, unstable_batchedUpdates } = availability;
    const Scheduler = require("scheduler");

    return {
      availability: {
        status: "available"
      },
      schedulerPriorityBefore: describeSchedulerPriority(Scheduler),
      flushSyncThrowsCallbackError: captureOperation(
        "flushSync(callback throws)",
        () => {
          const error = new Error("flushSync sentinel error");
          error.code = "FLUSH_SYNC_SENTINEL";
          error.detail = "callback-error";
          return describeValue(
            flushSync(() => {
              throw error;
            })
          );
        }
      ),
      flushSyncAfterThrow: captureOperation("flushSync(after throw)", () =>
        describeValue(flushSync(() => "flush-after-throw"))
      ),
      batchedUpdatesThrowsCallbackError: captureOperation(
        "unstable_batchedUpdates(callback throws)",
        () => {
          const error = new TypeError("batchedUpdates sentinel error");
          error.code = "BATCHED_UPDATES_SENTINEL";
          error.detail = "callback-error";
          return describeValue(
            unstable_batchedUpdates(() => {
              throw error;
            }, "ignored")
          );
        }
      ),
      batchedUpdatesAfterThrow: captureOperation(
        "unstable_batchedUpdates(after throw)",
        () =>
          describeValue(
            unstable_batchedUpdates((arg) => `batched-after-throw:${arg}`, "ok")
          )
      ),
      schedulerPriorityAfter: describeSchedulerPriority(Scheduler)
    };
  },

  "react-dom-flush-sync-batching-nested-calls": async () => {
    const loaded = loadReactDom();
    const availability = requireFlushSyncAndBatchedUpdates(loaded);
    if (!availability.available) {
      return availability.observation;
    }

    const { flushSync, unstable_batchedUpdates } = availability;

    return {
      availability: {
        status: "available"
      },
      nestedFlushSync: captureOperation("nested flushSync", () => {
        const events = [];
        const outerReturn = flushSync(() => {
          events.push("flush-outer-start");
          const innerReturn = flushSync(() => {
            events.push("flush-inner");
            return "flush-inner-return";
          });
          events.push(`flush-inner-return:${innerReturn}`);
          events.push("flush-outer-end");
          return "flush-outer-return";
        });

        return {
          events,
          outerReturn: describeValue(outerReturn)
        };
      }),
      nestedBatchedUpdates: captureOperation(
        "nested unstable_batchedUpdates",
        () => {
          const events = [];
          const outerReturn = unstable_batchedUpdates((outerArg) => {
            events.push(`batch-outer-start:${outerArg}`);
            const innerReturn = unstable_batchedUpdates((innerArg) => {
              events.push(`batch-inner:${innerArg}`);
              return "batch-inner-return";
            }, "inner-arg");
            events.push(`batch-inner-return:${innerReturn}`);
            events.push("batch-outer-end");
            return "batch-outer-return";
          }, "outer-arg");

          return {
            events,
            outerReturn: describeValue(outerReturn)
          };
        }
      ),
      flushInsideBatchedUpdates: captureOperation(
        "flushSync inside unstable_batchedUpdates",
        () => {
          const events = [];
          const outerReturn = unstable_batchedUpdates((arg) => {
            events.push(`batch-before-flush:${arg}`);
            const innerReturn = flushSync(() => {
              events.push("flush-inside-batch");
              return "flush-inside-batch-return";
            });
            events.push(`flush-return:${innerReturn}`);
            return "batch-containing-flush-return";
          }, "batch-arg");

          return {
            events,
            outerReturn: describeValue(outerReturn)
          };
        }
      ),
      batchedUpdatesInsideFlushSync: captureOperation(
        "unstable_batchedUpdates inside flushSync",
        () => {
          const events = [];
          const outerReturn = flushSync(() => {
            events.push("flush-before-batch");
            const innerReturn = unstable_batchedUpdates((arg) => {
              events.push(`batch-inside-flush:${arg}`);
              return "batch-inside-flush-return";
            }, "batch-arg");
            events.push(`batch-return:${innerReturn}`);
            return "flush-containing-batch-return";
          });

          return {
            events,
            outerReturn: describeValue(outerReturn)
          };
        }
      )
    };
  },

  "react-dom-flush-sync-batching-public-scheduler-priority": async () => {
    const loaded = loadReactDom();
    const availability = requireFlushSyncAndBatchedUpdates(loaded);
    if (!availability.available) {
      return availability.observation;
    }

    const { flushSync, unstable_batchedUpdates } = availability;
    const Scheduler = require("scheduler");

    return {
      availability: {
        status: "available"
      },
      defaultPriorityBefore: describeSchedulerPriority(Scheduler),
      flushSyncDefaultPriority: captureOperation(
        "flushSync observes public scheduler priority",
        () => {
          const events = [];
          const returnedPriority = flushSync(() => {
            events.push({
              label: "inside-flushSync",
              priority: describeSchedulerPriority(Scheduler)
            });
            return Scheduler.unstable_getCurrentPriorityLevel();
          });
          events.push({
            label: "after-flushSync",
            priority: describeSchedulerPriority(Scheduler)
          });

          return {
            returnedPriority: describeSchedulerPriorityValue(
              Scheduler,
              returnedPriority
            ),
            events
          };
        }
      ),
      flushSyncInsideUserBlockingPriority: captureOperation(
        "Scheduler.runWithPriority(UserBlocking, flushSync)",
        () =>
          Scheduler.unstable_runWithPriority(
            Scheduler.unstable_UserBlockingPriority,
            () => {
              const before = describeSchedulerPriority(Scheduler);
              const returnedPriority = flushSync(() =>
                Scheduler.unstable_getCurrentPriorityLevel()
              );
              const afterFlush = describeSchedulerPriority(Scheduler);

              return {
                before,
                returnedPriority: describeSchedulerPriorityValue(
                  Scheduler,
                  returnedPriority
                ),
                afterFlush
              };
            }
          )
      ),
      priorityAfterUserBlockingFlushSync: describeSchedulerPriority(Scheduler),
      batchedUpdatesDefaultPriority: captureOperation(
        "unstable_batchedUpdates observes public scheduler priority",
        () => {
          const events = [];
          const returnedPriority = unstable_batchedUpdates(() => {
            events.push({
              label: "inside-batchedUpdates",
              priority: describeSchedulerPriority(Scheduler)
            });
            return Scheduler.unstable_getCurrentPriorityLevel();
          }, "unused");
          events.push({
            label: "after-batchedUpdates",
            priority: describeSchedulerPriority(Scheduler)
          });

          return {
            returnedPriority: describeSchedulerPriorityValue(
              Scheduler,
              returnedPriority
            ),
            events
          };
        }
      ),
      batchedUpdatesInsideLowPriority: captureOperation(
        "Scheduler.runWithPriority(Low, unstable_batchedUpdates)",
        () =>
          Scheduler.unstable_runWithPriority(Scheduler.unstable_LowPriority, () => {
            const before = describeSchedulerPriority(Scheduler);
            const returnedPriority = unstable_batchedUpdates(() =>
              Scheduler.unstable_getCurrentPriorityLevel()
            );
            const afterBatchedUpdates = describeSchedulerPriority(Scheduler);

            return {
              before,
              returnedPriority: describeSchedulerPriorityValue(
                Scheduler,
                returnedPriority
              ),
              afterBatchedUpdates
            };
          })
      ),
      priorityAfterLowPriorityBatchedUpdates: describeSchedulerPriority(Scheduler)
    };
  }
};

function loadReactDom() {
  try {
    return {
      status: "ok",
      module: require(specifier)
    };
  } catch (error) {
    return {
      status: "throws",
      error: describeThrown(error)
    };
  }
}

function readPackageJson() {
  return captureOperation(`${targetPackage}/package.json`, () => {
    const packageJson = require(`${targetPackage}/package.json`);
    return {
      name: packageJson.name ?? null,
      version: packageJson.version ?? null,
      main: packageJson.main ?? null,
      exports: packageJson.exports ?? null
    };
  });
}

function requireFlushSyncAndBatchedUpdates(loaded) {
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

  const ReactDOM = loaded.module;
  const flushSync = ReactDOM.flushSync;
  const unstable_batchedUpdates = ReactDOM.unstable_batchedUpdates;

  if (
    typeof flushSync !== "function" ||
    typeof unstable_batchedUpdates !== "function"
  ) {
    return {
      available: false,
      observation: {
        availability: {
          status: "missing-required-functions",
          moduleLoad: {
            status: "ok"
          },
          flushSync: describeExport(ReactDOM, "flushSync"),
          unstable_batchedUpdates: describeExport(
            ReactDOM,
            "unstable_batchedUpdates"
          )
        }
      }
    };
  }

  return {
    available: true,
    flushSync,
    unstable_batchedUpdates
  };
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

function describeDomGlobals() {
  return {
    hasWindow: typeof globalThis.window !== "undefined",
    hasDocument: typeof globalThis.document !== "undefined",
    hasHTMLElement: typeof globalThis.HTMLElement !== "undefined",
    hasNode: typeof globalThis.Node !== "undefined"
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

function describeThis(value) {
  if (value === globalThis) {
    return {
      type: "globalThis"
    };
  }

  return describeValue(value);
}

function describeThrown(error) {
  return {
    status: "throws",
    name: error?.name ?? null,
    message: error?.message ?? String(error),
    code: error?.code ?? null,
    constructorName: error?.constructor?.name ?? null,
    ownKeys: Reflect.ownKeys(Object(error))
      .filter((key) => key !== "stack")
      .map(describePropertyKey),
    ownProperties: Reflect.ownKeys(Object(error))
      .filter((key) => key !== "stack")
      .map((key) => ({
        key: describePropertyKey(key),
        value: describeValue(error[key])
      }))
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

  if (depth >= 1) {
    return summary;
  }

  const descriptors = Object.getOwnPropertyDescriptors(value);
  return {
    ...summary,
    descriptors: ownKeys.map((key) => ({
      key: describePropertyKey(key),
      descriptor: describeDescriptor(descriptors[key], depth + 1)
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

try {
  await main();
} finally {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
}
