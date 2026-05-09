import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const scenarioId = process.argv[3];

if (!targetPackage || !scenarioId) {
  throw new Error("Usage: node ref-object-probe-runner.mjs <package> <scenario>");
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
      throw new Error(`Unknown ref-object scenario: ${scenarioId}`);
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
  "create-ref-export-shape": (target) => {
    const React = loadReact(target);
    const descriptor = Object.getOwnPropertyDescriptor(React, "createRef");

    return {
      hasOwn: Object.hasOwn(React, "createRef"),
      exportKeysInclude: Object.keys(React).includes("createRef"),
      descriptor: descriptor
        ? describeDescriptor("createRef", descriptor)
        : null,
      functionObject:
        typeof React.createRef === "function"
          ? describeObject(React.createRef)
          : describeValue(React.createRef)
    };
  },

  "create-ref-object-shape": (target) => {
    const React = loadReact(target);
    const marker = { ignored: true };

    return {
      noArgs: captureOperation("createRef()", () =>
        describeRefObject(React.createRef())
      ),
      withArgs: captureOperation("createRef(argument, second)", () =>
        describeRefObject(React.createRef(marker, "second"))
      ),
      markerAfterCall: describeObject(marker)
    };
  },

  "create-ref-identity-and-invocation": (target) => {
    const React = loadReact(target);
    const first = React.createRef();
    const second = React.createRef();
    const thisArg = { untouched: true };
    const boundCreateRef = React.createRef.bind({ bound: true });

    return {
      first: describeRefObject(first),
      second: describeRefObject(second),
      firstEqualsSecond: first === second,
      firstEqualsThirdCall: first === React.createRef(),
      callWithNullThis: captureOperation("createRef.call(null)", () =>
        describeRefObject(React.createRef.call(null))
      ),
      callWithThis: captureOperation("createRef.call(thisArg)", () =>
        describeRefObject(React.createRef.call(thisArg))
      ),
      applyWithUndefinedThis: captureOperation(
        "createRef.apply(undefined, args)",
        () => describeRefObject(React.createRef.apply(undefined, ["ignored"]))
      ),
      applyWithThis: captureOperation("createRef.apply(thisArg, args)", () =>
        describeRefObject(React.createRef.apply(thisArg, ["ignored"]))
      ),
      boundCall: captureOperation("bound createRef()", () =>
        describeRefObject(boundCreateRef("ignored"))
      ),
      constructorCall: captureOperation("new createRef()", () =>
        describeConstructedRef(
          new React.createRef("ignored"),
          React.createRef,
          boundCreateRef
        )
      ),
      boundConstructorCall: captureOperation("new bound createRef()", () =>
        describeConstructedRef(
          new boundCreateRef("ignored"),
          React.createRef,
          boundCreateRef
        )
      ),
      thisArgAfterCalls: describeObject(thisArg)
    };
  },

  "create-ref-mutability": (target) => {
    const React = loadReact(target);
    const ref = React.createRef();

    return {
      initial: describeRefObject(ref),
      assignCurrent: captureOperation("assign current", () => {
        ref.current = "assigned-current";
        return {
          current: describeValue(ref.current),
          ref: describeRefObject(ref)
        };
      }),
      reflectSetExtra: captureOperation("Reflect.set extra", () => {
        const setResult = Reflect.set(ref, "extra", 42);
        return {
          setResult,
          extra: describeValue(ref.extra),
          ref: describeRefObject(ref)
        };
      }),
      defineExtra: captureOperation("Reflect.defineProperty extra", () => {
        const defineResult = Reflect.defineProperty(ref, "definedExtra", {
          configurable: true,
          enumerable: true,
          value: "defined-extra",
          writable: true
        });
        return {
          defineResult,
          definedExtra: describeValue(ref.definedExtra),
          ref: describeRefObject(ref)
        };
      }),
      objectDefineExtra: captureOperation("Object.defineProperty extra", () => {
        Object.defineProperty(ref, "objectDefinedExtra", {
          configurable: true,
          enumerable: true,
          value: "object-defined-extra",
          writable: true
        });
        return {
          objectDefinedExtra: describeValue(ref.objectDefinedExtra),
          ref: describeRefObject(ref)
        };
      }),
      directAssignExtra: captureOperation("direct assign extra", () => {
        ref.directExtra = "direct-extra";
        return {
          directExtra: describeValue(ref.directExtra),
          ref: describeRefObject(ref)
        };
      }),
      deleteExtra: captureOperation("delete extra properties", () => ({
        extraDeleted: Reflect.deleteProperty(ref, "extra"),
        definedExtraDeleted: Reflect.deleteProperty(ref, "definedExtra"),
        directExtraDeleted: Reflect.deleteProperty(ref, "directExtra"),
        ref: describeRefObject(ref)
      })),
      deleteCurrent: captureOperation("delete current", () => ({
        currentDeleted: Reflect.deleteProperty(ref, "current"),
        current: describeValue(ref.current),
        ref: describeRefObject(ref)
      })),
      strictDeleteCurrent: captureOperation("strict delete current", () =>
        strictDeleteCurrent(ref)
      ),
      final: describeRefObject(ref)
    };
  }
};

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

function describeRefObject(ref) {
  const object = describeObject(ref);
  const currentDescriptor = describeSingleDescriptor(ref, "current");

  return {
    object,
    current: ref && typeof ref === "object" ? describeValue(ref.current) : null,
    currentDescriptor
  };
}

function describeConstructedRef(ref, createRef, boundCreateRef) {
  return {
    ref: describeRefObject(ref),
    instanceOfCreateRef: ref instanceof createRef,
    instanceOfBoundCreateRef: ref instanceof boundCreateRef
  };
}

function strictDeleteCurrent(ref) {
  return Function(
    "ref",
    '"use strict"; return delete ref.current;'
  )(ref);
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
