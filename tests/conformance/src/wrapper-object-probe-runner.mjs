import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const scenarioId = process.argv[3];

if (!targetPackage || !scenarioId) {
  throw new Error(
    "Usage: node wrapper-object-probe-runner.mjs <package> <scenario>"
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
      throw new Error(`Unknown wrapper-object scenario: ${scenarioId}`);
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

function loadReact(target) {
  return require(target);
}

const scenarios = {
  "wrapper-export-shape": (target) => {
    const React = loadReact(target);

    return {
      memo: describeExport(React, "memo"),
      lazy: describeExport(React, "lazy")
    };
  },

  "memo-wrapper-object": (target) => {
    const React = loadReact(target);
    function FunctionType() {}
    class ClassType {}
    const objectType = {
      $$typeof: Symbol.for("react.forward_ref"),
      render: function render() {}
    };
    const symbolType = Symbol("memo-symbol-type");

    return {
      functionType: captureWithConsole("memo(function)", () =>
        describeMemoWrapper(React.memo(FunctionType))
      ),
      classType: captureWithConsole("memo(class)", () =>
        describeMemoWrapper(React.memo(ClassType))
      ),
      stringType: captureWithConsole("memo(string)", () =>
        describeMemoWrapper(React.memo("div", null))
      ),
      objectType: captureWithConsole("memo(object)", () =>
        describeMemoWrapper(React.memo(objectType, undefined))
      ),
      nullType: captureWithConsole("memo(null)", () =>
        describeMemoWrapper(React.memo(null))
      ),
      undefinedType: captureWithConsole("memo(undefined)", () =>
        describeMemoWrapper(React.memo(undefined))
      ),
      numberType: captureWithConsole("memo(number)", () =>
        describeMemoWrapper(React.memo(42))
      ),
      symbolType: captureWithConsole("memo(symbol)", () =>
        describeMemoWrapper(React.memo(symbolType))
      )
    };
  },

  "memo-arguments-and-display-name": (target) => {
    const React = loadReact(target);
    function FunctionType() {}
    function compareFn() {
      return true;
    }
    const thisArg = { untouched: true };
    const boundMemo = React.memo.bind({ boundThis: true });

    return {
      omittedCompare: captureWithConsole("memo(type)", () =>
        describeMemoWrapper(React.memo(FunctionType))
      ),
      undefinedCompare: captureWithConsole("memo(type, undefined)", () =>
        describeMemoWrapper(React.memo(FunctionType, undefined))
      ),
      nullCompare: captureWithConsole("memo(type, null)", () =>
        describeMemoWrapper(React.memo(FunctionType, null))
      ),
      functionCompare: captureWithConsole("memo(type, compareFn)", () =>
        describeMemoWrapper(React.memo(FunctionType, compareFn, "extra"))
      ),
      falseCompare: captureWithConsole("memo(type, false)", () =>
        describeMemoWrapper(React.memo(FunctionType, false))
      ),
      callWithThis: captureWithConsole("memo.call(thisArg)", () =>
        describeMemoWrapper(React.memo.call(thisArg, FunctionType, compareFn))
      ),
      applyWithThis: captureWithConsole("memo.apply(thisArg)", () =>
        describeMemoWrapper(
          React.memo.apply(thisArg, [FunctionType, undefined, "extra"])
        )
      ),
      boundCall: captureWithConsole("bound memo()", () =>
        describeMemoWrapper(boundMemo(FunctionType, false))
      ),
      constructorCall: captureWithConsole("new memo()", () => {
        const wrapper = new React.memo(FunctionType, compareFn);
        return {
          wrapper: describeMemoWrapper(wrapper),
          instanceOfMemo: wrapper instanceof React.memo,
          instanceOfBoundMemo: wrapper instanceof boundMemo
        };
      }),
      thisArgAfterCalls: describeObject(thisArg),
      displayNameAssignment: exerciseMemoDisplayName(React)
    };
  },

  "lazy-wrapper-object": (target) => {
    const React = loadReact(target);
    const loaderCalls = [];
    function Component() {}
    function validLoader() {
      loaderCalls.push("validLoader");
      return {
        then(resolve) {
          resolve({ default: Component });
        }
      };
    }
    const thisArg = { untouched: true };
    const boundLazy = React.lazy.bind({ boundThis: true });

    return {
      functionLoader: captureWithConsole("lazy(function)", () =>
        describeLazyWrapper(React.lazy(validLoader))
      ),
      nullLoader: captureWithConsole("lazy(null)", () =>
        describeLazyWrapper(React.lazy(null))
      ),
      undefinedLoader: captureWithConsole("lazy(undefined)", () =>
        describeLazyWrapper(React.lazy(undefined))
      ),
      numberLoader: captureWithConsole("lazy(number)", () =>
        describeLazyWrapper(React.lazy(42))
      ),
      objectLoader: captureWithConsole("lazy(object)", () =>
        describeLazyWrapper(React.lazy({ load: true }))
      ),
      extraArguments: captureWithConsole("lazy(function, extra)", () =>
        describeLazyWrapper(React.lazy(validLoader, "extra"))
      ),
      callWithThis: captureWithConsole("lazy.call(thisArg)", () =>
        describeLazyWrapper(React.lazy.call(thisArg, validLoader))
      ),
      applyWithThis: captureWithConsole("lazy.apply(thisArg)", () =>
        describeLazyWrapper(React.lazy.apply(thisArg, [validLoader, "extra"]))
      ),
      boundCall: captureWithConsole("bound lazy()", () =>
        describeLazyWrapper(boundLazy(validLoader, "extra"))
      ),
      constructorCall: captureWithConsole("new lazy()", () => {
        const wrapper = new React.lazy(validLoader);
        return {
          wrapper: describeLazyWrapper(wrapper),
          instanceOfLazy: wrapper instanceof React.lazy,
          instanceOfBoundLazy: wrapper instanceof boundLazy
        };
      }),
      boundConstructorCall: captureWithConsole("new bound lazy()", () => {
        const wrapper = new boundLazy(validLoader);
        return {
          wrapper: describeLazyWrapper(wrapper),
          instanceOfLazy: wrapper instanceof React.lazy,
          instanceOfBoundLazy: wrapper instanceof boundLazy
        };
      }),
      thisArgAfterCalls: describeObject(thisArg),
      loaderCallsAfterCreation: loaderCalls.slice()
    };
  },

  "lazy-init-behavior": (target) => {
    const React = loadReact(target);
    function Component() {}
    const moduleObject = { default: Component };
    const rejectReason = new Error("lazy reject reason");
    const thrownReason = new Error("lazy loader thrown");

    return {
      fulfilled: exerciseLazyInit(React, "fulfilled", function loader() {
        return {
          then(resolve) {
            resolve(moduleObject);
          }
        };
      }),
      rejected: exerciseLazyInit(React, "rejected", function loader() {
        return {
          then(_resolve, reject) {
            reject(rejectReason);
          }
        };
      }),
      pending: exerciseLazyInit(React, "pending", function loader() {
        return {
          then() {}
        };
      }),
      throwingLoader: exerciseLazyInit(React, "throwing loader", function loader() {
        throw thrownReason;
      }),
      nonThenable: exerciseLazyInit(React, "non-thenable", function loader() {
        return { default: Component };
      }),
      missingDefault: exerciseLazyInit(React, "missing default", function loader() {
        return {
          then(resolve) {
            resolve({ named: Component });
          }
        };
      }),
      undefinedModule: exerciseLazyInit(React, "undefined module", function loader() {
        return {
          then(resolve) {
            resolve(undefined);
          }
        };
      }),
      thenableDisplayName: exerciseLazyInit(
        React,
        "thenable displayName",
        function loader() {
          const thenable = {
            displayName: "ThenableDisplay",
            then(resolve) {
              resolve(moduleObject);
            }
          };
          return thenable;
        }
      )
    };
  }
};

function describeExport(React, exportName) {
  const descriptor = Object.getOwnPropertyDescriptor(React, exportName);
  const value = React[exportName];
  return {
    hasOwn: Object.hasOwn(React, exportName),
    exportKeysInclude: Object.keys(React).includes(exportName),
    descriptor: descriptor ? describeDescriptor(exportName, descriptor) : null,
    functionObject:
      typeof value === "function" ? describeObject(value) : describeValue(value)
  };
}

function exerciseMemoDisplayName(React) {
  const anonymousType = function () {};
  Object.defineProperty(anonymousType, "name", {
    configurable: true,
    value: ""
  });
  const wrapper = React.memo(anonymousType);
  const before = {
    wrapper: describeMemoWrapper(wrapper),
    type: describeObject(anonymousType),
    typeDisplayName: describeValue(anonymousType.displayName)
  };
  const assignment = captureWithConsole("assign memo displayName", () => {
    wrapper.displayName = "Shown";
    return {
      wrapper: describeMemoWrapper(wrapper),
      type: describeObject(anonymousType),
      typeDisplayName: describeValue(anonymousType.displayName)
    };
  });

  return {
    before,
    assignment
  };
}

function exerciseLazyInit(React, label, loader) {
  const loaderThisValues = [];
  const wrappedLoader = function () {
    loaderThisValues.push(describeValue(this));
    return loader();
  };
  const lazyType = React.lazy(wrappedLoader);
  const before = describeLazyWrapper(lazyType);
  const init = captureWithConsole(`${label} _init`, () =>
    describeValue(lazyType._init(lazyType._payload))
  );
  const after = describeLazyWrapper(lazyType);

  return {
    before,
    init,
    after,
    loaderThisValues
  };
}

function captureWithConsole(label, fn) {
  const startIndex = consoleCalls.length;
  const operation = captureOperation(label, fn);
  const calls = consoleCalls.splice(startIndex);
  return {
    ...operation,
    consoleCalls: calls
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

function describeMemoWrapper(wrapper) {
  return {
    object: describeObject(wrapper),
    tag: wrapper && typeof wrapper === "object" ? describeValue(wrapper.$$typeof) : null,
    type: wrapper && typeof wrapper === "object" ? describeValue(wrapper.type) : null,
    compare:
      wrapper && typeof wrapper === "object" ? describeValue(wrapper.compare) : null,
    displayName:
      wrapper && typeof wrapper === "object"
        ? describeValue(wrapper.displayName)
        : null
  };
}

function describeLazyWrapper(lazyType) {
  const payload =
    lazyType && typeof lazyType === "object" ? lazyType._payload : undefined;
  const ioInfo = payload && typeof payload === "object" ? payload._ioInfo : undefined;

  return {
    object: describeObject(lazyType),
    tag:
      lazyType && typeof lazyType === "object"
        ? describeValue(lazyType.$$typeof)
        : null,
    payload: describeObject(payload),
    payloadStatus:
      payload && typeof payload === "object"
        ? describeValue(payload._status)
        : null,
    payloadResult:
      payload && typeof payload === "object"
        ? describeValue(payload._result)
        : null,
    init:
      lazyType && typeof lazyType === "object"
        ? describeObject(lazyType._init)
        : null,
    debugInfo:
      lazyType && typeof lazyType === "object" && Object.hasOwn(lazyType, "_debugInfo")
        ? describeObject(lazyType._debugInfo)
        : describeValue(undefined),
    ioInfo:
      ioInfo && typeof ioInfo === "object"
        ? describeIoInfo(ioInfo)
        : describeValue(undefined),
    debugAwaitedSame:
      lazyType &&
      typeof lazyType === "object" &&
      lazyType._debugInfo &&
      lazyType._debugInfo[0] &&
      lazyType._debugInfo[0].awaited === ioInfo
  };
}

function describeIoInfo(ioInfo) {
  return {
    object: describeIoInfoObject(ioInfo),
    name: describeValue(ioInfo.name),
    start: describeTimingValue(ioInfo.start),
    end: describeTimingValue(ioInfo.end),
    value: describeValue(ioInfo.value),
    owner: describeValue(ioInfo.owner),
    debugStack: describeValue(ioInfo.debugStack),
    debugTask: describeValue(ioInfo.debugTask)
  };
}

function describeIoInfoObject(ioInfo) {
  const object = describeObject(ioInfo);
  object.descriptors = object.descriptors.map((descriptor) => {
    if (
      descriptor.key.type === "string" &&
      (descriptor.key.value === "start" || descriptor.key.value === "end") &&
      descriptor.kind === "data"
    ) {
      return {
        ...descriptor,
        value: describeTimingValue(ioInfo[descriptor.key.value])
      };
    }
    return descriptor;
  });
  return object;
}

function describeTimingValue(value) {
  if (value === -1) {
    return {
      type: "number",
      value: -1
    };
  }
  return {
    type: typeof value,
    value: typeof value === "number" ? "number" : value
  };
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
      displayName: value.displayName,
      isReactWarning: value.isReactWarning === true
    };
  }

  const summary = {
    type: "object",
    objectTag: Object.prototype.toString.call(value),
    prototype: describePrototype(value),
    objectKeys: Object.keys(value)
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

  if (Object.hasOwn(value, "$$typeof")) {
    summary.reactTag = describeValue(value.$$typeof);
  }

  if (Object.hasOwn(value, "status")) {
    summary.status = describeValue(value.status);
  }

  if (Object.hasOwn(value, "default")) {
    summary.default = describeValue(value.default);
  }

  if (Object.hasOwn(value, "value")) {
    summary.value = describeValue(value.value);
  }

  if (Object.hasOwn(value, "reason")) {
    summary.reason = describeValue(value.reason);
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

main();
