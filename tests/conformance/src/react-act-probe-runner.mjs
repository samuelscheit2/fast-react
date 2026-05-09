import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const scenarioId = process.argv[3];

if (!targetPackage || !scenarioId) {
  throw new Error("Usage: node react-act-probe-runner.mjs <package> <scenario>");
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

async function main() {
  try {
    const scenario = scenarios[scenarioId];
    if (!scenario) {
      throw new Error(`Unknown React.act scenario: ${scenarioId}`);
    }

    const result = await captureAsyncOperation(scenarioId, () =>
      scenario(targetPackage)
    );
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

function loadReact(target) {
  return require(target);
}

const scenarios = {
  "react-act-export-shape": async (target) => {
    const React = loadReact(target);
    const descriptor = Object.getOwnPropertyDescriptor(React, "act");

    return {
      availability: describeActAvailability(React),
      exportKeysInclude: Object.keys(React).includes("act"),
      descriptor: descriptor ? describeDescriptor("act", descriptor) : null,
      functionObject:
        typeof React.act === "function"
          ? describeObject(React.act)
          : describeValue(React.act)
    };
  },

  "react-act-sync-callback-behavior": async (target) => {
    const React = loadReact(target);
    if (!hasCallableAct(React)) {
      return describeUnavailableActCall(React, "sync callback");
    }

    const events = [];
    const returnThenable = React.act(function syncActCallback(...args) {
      events.push({
        phase: "callback",
        thisValue: describeValue(this),
        argCount: args.length
      });
      return "sync-return";
    });
    events.push({ phase: "after-act-call" });

    const returnShape = describeActThenable(returnThenable);
    const awaitedValue = await returnThenable;
    events.push({ phase: "after-await" });

    const consoleStart = consoleCalls.length;
    const unawaitedReturn = React.act(() => "unawaited-sync-return");
    await flushMicrotasks(4);

    return {
      availability: describeActAvailability(React),
      events,
      returnShape,
      awaitedValue: describeValue(awaitedValue),
      unawaitedSyncReturnShape: describeActThenable(unawaitedReturn),
      unawaitedSyncConsoleCalls: consoleCalls.slice(consoleStart)
    };
  },

  "react-act-async-callback-behavior": async (target) => {
    const React = loadReact(target);
    if (!hasCallableAct(React)) {
      return describeUnavailableActCall(React, "async callback");
    }

    const events = [];
    const consoleStart = consoleCalls.length;
    const returnThenable = React.act(async function asyncActCallback(...args) {
      events.push({
        phase: "callback-start",
        thisValue: describeValue(this),
        argCount: args.length
      });
      await Promise.resolve();
      events.push({ phase: "callback-after-microtask" });
      return "async-return";
    });
    events.push({ phase: "after-act-call" });

    const returnShape = describeActThenable(returnThenable);
    const awaitedValue = await returnThenable;
    events.push({ phase: "after-await" });
    await flushMicrotasks(4);

    return {
      availability: describeActAvailability(React),
      events,
      returnShape,
      awaitedValue: describeValue(awaitedValue),
      consoleCallsDuringScenario: consoleCalls.slice(consoleStart)
    };
  },

  "react-act-unawaited-async-warning": async (target) => {
    const React = loadReact(target);
    if (!hasCallableAct(React)) {
      return describeUnavailableActCall(React, "unawaited async callback");
    }

    const consoleStart = consoleCalls.length;
    const firstReturn = React.act(async () => "first-unawaited-return");
    await flushMicrotasks(4);
    const afterFirst = consoleCalls.slice(consoleStart);

    const secondReturn = React.act(async () => "second-unawaited-return");
    await flushMicrotasks(4);
    const afterSecond = consoleCalls.slice(consoleStart);

    return {
      availability: describeActAvailability(React),
      firstReturnShape: describeActThenable(firstReturn),
      secondReturnShape: describeActThenable(secondReturn),
      consoleCallsAfterFirst: afterFirst,
      consoleCallsAfterSecond: afterSecond
    };
  },

  "react-act-error-propagation": async (target) => {
    const React = loadReact(target);
    if (!hasCallableAct(React)) {
      return describeUnavailableActCall(React, "error propagation");
    }

    const syncThrow = captureOperation("sync callback throws", () =>
      React.act(() => {
        throw new Error("sync act failure");
      })
    );

    const afterSyncThrow = await captureAsyncOperation(
      "subsequent sync act after throw",
      async () => describeValue(await React.act(() => "after-sync-throw"))
    );

    const asyncReject = await captureAsyncOperation(
      "async callback rejects",
      async () => {
        await React.act(async () => {
          throw new TypeError("async act rejection");
        });
        return describeValue("unreachable");
      }
    );

    const customThenableReject = await captureAsyncOperation(
      "custom thenable rejects",
      async () => {
        await React.act(() => ({
          then(_resolve, reject) {
            reject(new RangeError("custom act thenable rejection"));
          }
        }));
        return describeValue("unreachable");
      }
    );

    return {
      availability: describeActAvailability(React),
      syncThrow,
      afterSyncThrow,
      asyncReject,
      customThenableReject
    };
  },

  "react-act-thenable-handling": async (target) => {
    const React = loadReact(target);
    if (!hasCallableAct(React)) {
      return describeUnavailableActCall(React, "thenable handling");
    }

    const customThenableCalls = [];
    const customThenable = {
      label: "custom-thenable",
      then(resolve, reject) {
        customThenableCalls.push({
          thisMatchesThenable: this === customThenable,
          resolveType: typeof resolve,
          rejectType: typeof reject
        });
        resolve("custom-thenable-resolution");
      }
    };
    const customActReturn = React.act(() => customThenable);
    const customResolution = await observeThenableResolution(
      customActReturn,
      describeValue
    );

    const nonCallableThenObject = {
      label: "non-callable-then",
      then: "not-a-function"
    };
    const nonCallableActReturn = React.act(() => nonCallableThenObject);
    const nonCallableResolution = await observeThenableResolution(
      nonCallableActReturn,
      (value) => ({
        value: describePlainObject(value),
        sameObject: value === nonCallableThenObject
      })
    );

    function functionWithThenProperty() {
      return "function-return";
    }
    functionWithThenProperty.then = function thenProperty() {};
    const functionActReturn = React.act(() => functionWithThenProperty);
    const functionResolution = await observeThenableResolution(
      functionActReturn,
      (value) => ({
        value: describeValue(value),
        sameFunction: value === functionWithThenProperty
      })
    );

    return {
      availability: describeActAvailability(React),
      customThenable: {
        actReturnShape: describeActThenable(customActReturn),
        resolution: customResolution,
        thenCalls: customThenableCalls
      },
      nonCallableThenObject: {
        actReturnShape: describeActThenable(nonCallableActReturn),
        resolution: nonCallableResolution
      },
      functionWithThenProperty: {
        actReturnShape: describeActThenable(functionActReturn),
        resolution: functionResolution,
        functionObject: describeObject(functionWithThenProperty)
      }
    };
  }
};

function hasCallableAct(React) {
  return typeof React.act === "function";
}

function describeActAvailability(React) {
  return {
    status: hasCallableAct(React) ? "available" : "unavailable",
    hasOwn: Object.hasOwn(React, "act"),
    exportKeysInclude: Object.keys(React).includes("act"),
    value: describeValue(React.act)
  };
}

function describeUnavailableActCall(React, label) {
  return {
    availability: describeActAvailability(React),
    callAttempt: captureOperation(`React.act unavailable: ${label}`, () =>
      describeValue(React.act(() => "unreachable"))
    )
  };
}

function describeActThenable(value) {
  return {
    summary: describeValue(value),
    thenDescriptor: describeSingleDescriptor(value, "then"),
    object: describeObject(value)
  };
}

function captureOperation(label, fn) {
  try {
    return {
      label,
      status: "ok",
      value: fn()
    };
  } catch (error) {
    return {
      label,
      status: "throws",
      error: describeThrown(error)
    };
  }
}

async function captureAsyncOperation(label, fn) {
  try {
    return {
      label,
      status: "ok",
      value: await fn()
    };
  } catch (error) {
    return {
      label,
      status: "throws",
      error: describeThrown(error)
    };
  }
}

async function flushMicrotasks(count) {
  for (let index = 0; index < count; index += 1) {
    await Promise.resolve();
  }
}

async function flushTaskTurns(count) {
  for (let index = 0; index < count; index += 1) {
    await new Promise((resolve) => {
      if (typeof setImmediate === "function") {
        setImmediate(resolve);
      } else {
        setTimeout(resolve, 0);
      }
    });
    await flushMicrotasks(2);
  }
}

async function observeThenableResolution(thenable, describeFulfilledValue) {
  let settlement = {
    status: "pending"
  };
  const thenCall = captureOperation("direct then invocation", () =>
    thenable.then(
      (value) => {
        settlement = {
          status: "fulfilled",
          value: describeFulfilledValue(value)
        };
      },
      (error) => {
        settlement = {
          status: "rejected",
          error: describeThrown(error)
        };
      }
    )
  );

  await flushTaskTurns(4);

  return {
    thenCall,
    settlement
  };
}

function describePlainObject(value) {
  if (!value || typeof value !== "object") {
    return describeValue(value);
  }

  return {
    object: describeObject(value),
    properties: Object.fromEntries(
      Reflect.ownKeys(value).map((key) => [String(key), describeValue(value[key])])
    )
  };
}

function describeSingleDescriptor(value, key) {
  if (!value || (typeof value !== "object" && typeof value !== "function")) {
    return null;
  }

  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor ? describeDescriptor(key, descriptor) : null;
}

function describeObject(value) {
  const summary = describeValue(value);
  if (!value || (typeof value !== "object" && typeof value !== "function")) {
    return {
      summary,
      objectKeys: null,
      ownKeys: null,
      descriptors: null,
      state: null
    };
  }

  return {
    summary,
    objectKeys: Object.keys(value),
    ownKeys: describeOwnKeys(value),
    descriptors: describeDescriptors(value),
    state: {
      frozen: Object.isFrozen(value),
      sealed: Object.isSealed(value),
      extensible: Object.isExtensible(value),
      objectTag: Object.prototype.toString.call(value),
      prototype: describePrototype(value)
    }
  };
}

function describeOwnKeys(value) {
  return Reflect.ownKeys(value).map(describePropertyKey);
}

function describeDescriptors(value) {
  return Reflect.ownKeys(value).map((key) =>
    describeDescriptor(key, Object.getOwnPropertyDescriptor(value, key))
  );
}

function describeDescriptor(key, descriptor) {
  const described = {
    key: describePropertyKey(key),
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable
  };

  if ("value" in descriptor) {
    described.kind = "data";
    described.writable = descriptor.writable;
    described.value = describeValue(descriptor.value);
  } else {
    described.kind = "accessor";
    described.get = describeAccessor(descriptor.get);
    described.set = describeAccessor(descriptor.set);
  }

  return described;
}

function describeAccessor(accessor) {
  if (typeof accessor !== "function") {
    return {
      present: false
    };
  }

  return {
    present: true,
    name: accessor.name,
    length: accessor.length,
    isReactWarning: accessor.isReactWarning === true
  };
}

function describePropertyKey(key) {
  if (typeof key === "symbol") {
    return {
      type: "symbol",
      keyFor: Symbol.keyFor(key) ?? null,
      description: key.description ?? null,
      stringValue: String(key)
    };
  }

  return {
    type: "string",
    value: key
  };
}

function describeValue(value) {
  const valueType = typeof value;

  if (value === undefined) {
    return {
      type: "undefined"
    };
  }

  if (value === null) {
    return {
      type: "null"
    };
  }

  if (valueType === "string" || valueType === "boolean") {
    return {
      type: valueType,
      value
    };
  }

  if (valueType === "number") {
    return {
      type: "number",
      value: Number.isFinite(value) ? value : String(value)
    };
  }

  if (valueType === "bigint") {
    return {
      type: "bigint",
      value: value.toString()
    };
  }

  if (valueType === "symbol") {
    return {
      type: "symbol",
      keyFor: Symbol.keyFor(value) ?? null,
      description: value.description ?? null,
      stringValue: String(value)
    };
  }

  if (valueType === "function") {
    return {
      type: "function",
      name: value.name,
      length: value.length,
      isReactWarning: value.isReactWarning === true
    };
  }

  const summary = {
    type: "object",
    objectTag: Object.prototype.toString.call(value),
    prototype: describePrototype(value)
  };

  if (value instanceof Error) {
    summary.error = {
      name: value.name,
      message: value.message
    };
  }

  if (Array.isArray(value)) {
    summary.arrayLength = value.length;
  }

  return summary;
}

function describePrototype(value) {
  const prototype = Object.getPrototypeOf(value);
  if (prototype === null) {
    return "null";
  }
  if (prototype === Object.prototype) {
    return "Object.prototype";
  }
  if (prototype === Array.prototype) {
    return "Array.prototype";
  }
  if (prototype === Function.prototype) {
    return "Function.prototype";
  }
  if (prototype === Error.prototype) {
    return "Error.prototype";
  }
  if (prototype === TypeError.prototype) {
    return "TypeError.prototype";
  }
  if (prototype === RangeError.prototype) {
    return "RangeError.prototype";
  }
  if (prototype?.constructor?.name) {
    return `${prototype.constructor.name}.prototype`;
  }
  return Object.prototype.toString.call(prototype);
}

function describeThrown(error) {
  return {
    name: error?.name ?? null,
    code: error?.code ?? null,
    message: error?.message ?? String(error),
    entrypoint: error?.entrypoint ?? null,
    exportName: error?.exportName ?? null
  };
}

main().catch((error) => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.error(error);
  process.exitCode = 1;
});
