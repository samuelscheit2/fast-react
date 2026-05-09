import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const scenarioId = process.argv[3];

if (!targetPackage || !scenarioId) {
  throw new Error(
    "Usage: node context-object-probe-runner.mjs <package> <scenario>"
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
      throw new Error(`Unknown context-object scenario: ${scenarioId}`);
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
  "context-export-shape": (target) => {
    const React = loadReact(target);
    const descriptor = Object.getOwnPropertyDescriptor(React, "createContext");

    return {
      hasOwn: Object.hasOwn(React, "createContext"),
      exportKeysInclude: Object.keys(React).includes("createContext"),
      descriptor: descriptor
        ? describeDescriptor("createContext", descriptor)
        : null,
      functionObject:
        typeof React.createContext === "function"
          ? describeObject(React.createContext)
          : describeValue(React.createContext)
    };
  },

  "context-default-values": (target) => {
    const React = loadReact(target);
    const unavailable = describeUnavailableCreateContext(React);
    if (unavailable) {
      return unavailable;
    }

    const objectDefault = { label: "object-default" };
    const arrayDefault = ["array-default"];
    const symbolDefault = Symbol("context-default");
    const globalSymbolDefault = Symbol.for("fast-react.context-default");
    const functionDefault = function DefaultValue() {};

    return {
      cases: [
        ["undefined", undefined],
        ["null", null],
        ["string", "default-string"],
        ["number", 42],
        ["boolean", false],
        ["bigint", 10n],
        ["object", objectDefault],
        ["array", arrayDefault],
        ["symbol", symbolDefault],
        ["globalSymbol", globalSymbolDefault],
        ["function", functionDefault]
      ].map(([label, defaultValue]) => ({
        label,
        defaultValue: describeValue(defaultValue),
        result: captureOperation(`createContext ${label}`, () =>
          describeCreatedContext(
            React.createContext(defaultValue, "ignored-extra"),
            defaultValue
          )
        )
      }))
    };
  },

  "context-object-shape": (target) => {
    const React = loadReact(target);
    const unavailable = describeUnavailableCreateContext(React);
    if (unavailable) {
      return unavailable;
    }

    const defaultValue = { label: "shape-default" };
    return describeCreatedContext(React.createContext(defaultValue), defaultValue);
  },

  "context-invocation": (target) => {
    const React = loadReact(target);
    const unavailable = describeUnavailableCreateContext(React);
    if (unavailable) {
      return unavailable;
    }

    const firstDefault = { label: "first-default" };
    const secondDefault = { label: "second-default" };
    const first = React.createContext(firstDefault);
    const second = React.createContext(secondDefault);
    const thisArg = { untouched: true };
    const boundCreateContext = React.createContext.bind({ bound: true });

    return {
      first: describeCreatedContext(first, firstDefault),
      second: describeCreatedContext(second, secondDefault),
      firstEqualsSecond: first === second,
      firstEqualsThirdCall: first === React.createContext(firstDefault),
      withExtraArgs: captureOperation("createContext(first, second)", () =>
        describeCreatedContext(
          React.createContext(firstDefault, secondDefault),
          firstDefault
        )
      ),
      callWithNullThis: captureOperation("createContext.call(null)", () =>
        describeCreatedContext(React.createContext.call(null, null), null)
      ),
      callWithThis: captureOperation("createContext.call(thisArg)", () =>
        describeCreatedContext(
          React.createContext.call(thisArg, firstDefault),
          firstDefault
        )
      ),
      applyWithUndefinedThis: captureOperation(
        "createContext.apply(undefined, args)",
        () =>
          describeCreatedContext(
            React.createContext.apply(undefined, [secondDefault, "ignored"]),
            secondDefault
          )
      ),
      applyWithThis: captureOperation("createContext.apply(thisArg, args)", () =>
        describeCreatedContext(
          React.createContext.apply(thisArg, [firstDefault, "ignored"]),
          firstDefault
        )
      ),
      boundCall: captureOperation("bound createContext()", () =>
        describeCreatedContext(boundCreateContext(secondDefault), secondDefault)
      ),
      constructorCall: captureOperation("new createContext()", () =>
        describeConstructedContext(
          new React.createContext(firstDefault, "ignored"),
          React.createContext,
          boundCreateContext,
          firstDefault
        )
      ),
      boundConstructorCall: captureOperation("new bound createContext()", () =>
        describeConstructedContext(
          new boundCreateContext(secondDefault, "ignored"),
          React.createContext,
          boundCreateContext,
          secondDefault
        )
      ),
      thisArgAfterCalls: describeObject(thisArg)
    };
  },

  "context-provider-consumer-identity": (target) => {
    const React = loadReact(target);
    const unavailable = describeUnavailableCreateContext(React);
    if (unavailable) {
      return unavailable;
    }

    const defaultValue = { label: "identity-default" };
    const context = React.createContext(defaultValue);

    return {
      context: describeCreatedContext(context, defaultValue),
      provider: describeObject(context.Provider),
      consumer: describeConsumerObject(context.Consumer, context),
      relationships: describeContextRelationships(context, defaultValue)
    };
  },

  "context-display-name": (target) => {
    const React = loadReact(target);
    const unavailable = describeUnavailableCreateContext(React);
    if (unavailable) {
      return unavailable;
    }

    const context = React.createContext("display-default");

    return {
      initial: describeDisplayNameState(context),
      assignContextDisplayName: captureOperation("context.displayName = Ctx", () => {
        context.displayName = "Ctx";
        return describeDisplayNameState(context);
      }),
      assignProviderDisplayName: captureOperation(
        "context.Provider.displayName = ProviderName",
        () => {
          context.Provider.displayName = "ProviderName";
          return describeDisplayNameState(context);
        }
      ),
      assignConsumerDisplayName: captureOperation(
        "context.Consumer.displayName = ConsumerName",
        () => {
          context.Consumer.displayName = "ConsumerName";
          return describeDisplayNameState(context);
        }
      ),
      deleteContextDisplayName: captureOperation("delete context.displayName", () => {
        const deleted = Reflect.deleteProperty(context, "displayName");
        return {
          deleted,
          state: describeDisplayNameState(context)
        };
      }),
      deleteConsumerDisplayName: captureOperation(
        "delete context.Consumer.displayName",
        () => {
          const deleted = Reflect.deleteProperty(
            context.Consumer,
            "displayName"
          );
          return {
            deleted,
            state: describeDisplayNameState(context)
          };
        }
      ),
      finalContext: describeCreatedContext(context, "display-default")
    };
  },

  "context-mutability-and-slots": (target) => {
    const React = loadReact(target);
    const unavailable = describeUnavailableCreateContext(React);
    if (unavailable) {
      return unavailable;
    }

    const defaultValue = { label: "mutable-default" };
    const context = React.createContext(defaultValue);

    return {
      initial: describeCreatedContext(context, defaultValue),
      assignCurrentValue: captureOperation("assign _currentValue", () => {
        context._currentValue = "current-one";
        return describeCreatedContext(context, defaultValue);
      }),
      assignCurrentValue2: captureOperation("assign _currentValue2", () => {
        context._currentValue2 = "current-two";
        return describeCreatedContext(context, defaultValue);
      }),
      assignThreadCount: captureOperation("assign _threadCount", () => {
        context._threadCount = 7;
        return describeCreatedContext(context, defaultValue);
      }),
      assignRendererSlots: captureOperation("assign renderer slots", () => {
        context._currentRenderer = "renderer-one";
        context._currentRenderer2 = "renderer-two";
        return describeCreatedContext(context, defaultValue);
      }),
      defineExtra: captureOperation("Reflect.defineProperty extra", () => {
        const defineResult = Reflect.defineProperty(context, "definedExtra", {
          configurable: true,
          enumerable: true,
          value: "defined-extra",
          writable: true
        });
        return {
          defineResult,
          definedExtra: describeValue(context.definedExtra),
          context: describeCreatedContext(context, defaultValue)
        };
      }),
      directAssignExtra: captureOperation("direct assign extra", () => {
        context.directExtra = "direct-extra";
        context.Consumer.consumerExtra = "consumer-extra";
        return {
          directExtra: describeValue(context.directExtra),
          consumerExtra: describeValue(context.Consumer.consumerExtra),
          context: describeCreatedContext(context, defaultValue)
        };
      }),
      deleteSlots: captureOperation("delete configurable slots", () => ({
        deleteCurrentValue: Reflect.deleteProperty(context, "_currentValue"),
        deleteDefinedExtra: Reflect.deleteProperty(context, "definedExtra"),
        deleteDirectExtra: Reflect.deleteProperty(context, "directExtra"),
        deleteConsumerExtra: Reflect.deleteProperty(
          context.Consumer,
          "consumerExtra"
        ),
        context: describeCreatedContext(context, defaultValue)
      })),
      final: describeCreatedContext(context, defaultValue)
    };
  }
};

function describeUnavailableCreateContext(React) {
  if (Object.hasOwn(React, "createContext")) {
    return null;
  }

  return {
    available: false,
    exportKeysInclude: Object.keys(React).includes("createContext"),
    value: describeValue(React.createContext)
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

function describeCreatedContext(context, defaultValue) {
  return {
    available: true,
    context: describeObject(context),
    consumer: describeConsumerObject(context?.Consumer, context),
    relationships: describeContextRelationships(context, defaultValue),
    selectedValues: {
      currentValue: describeValue(context?._currentValue),
      currentValue2: describeValue(context?._currentValue2),
      threadCount: describeValue(context?._threadCount),
      currentRenderer: Object.hasOwn(context, "_currentRenderer")
        ? describeValue(context._currentRenderer)
        : { type: "missing" },
      currentRenderer2: Object.hasOwn(context, "_currentRenderer2")
        ? describeValue(context._currentRenderer2)
        : { type: "missing" }
    }
  };
}

function describeConsumerObject(consumer, context) {
  return {
    object: describeObject(consumer),
    contextMatches: consumer?._context === context,
    contextSummary: describeValue(consumer?._context)
  };
}

function describeContextRelationships(context, defaultValue) {
  return {
    providerEqualsContext: context?.Provider === context,
    consumerEqualsContext: context?.Consumer === context,
    consumerContextEqualsContext: context?.Consumer?._context === context,
    providerConsumerEqualsConsumer: context?.Provider?.Consumer === context?.Consumer,
    providerProviderEqualsContext: context?.Provider?.Provider === context,
    currentValueEqualsDefault: context?._currentValue === defaultValue,
    currentValue2EqualsDefault: context?._currentValue2 === defaultValue,
    providerCurrentValueEqualsCurrentValue:
      context?.Provider?._currentValue === context?._currentValue,
    providerCurrentValue2EqualsCurrentValue2:
      context?.Provider?._currentValue2 === context?._currentValue2
  };
}

function describeConstructedContext(
  context,
  createContext,
  boundCreateContext,
  defaultValue
) {
  return {
    context: describeCreatedContext(context, defaultValue),
    instanceOfCreateContext: context instanceof createContext,
    instanceOfBoundCreateContext: context instanceof boundCreateContext
  };
}

function describeDisplayNameState(context) {
  return {
    contextDisplayName: describeValue(context.displayName),
    providerDisplayName: describeValue(context.Provider.displayName),
    consumerDisplayName: describeValue(context.Consumer.displayName),
    contextKeys: Object.keys(context),
    consumerKeys: Object.keys(context.Consumer),
    contextDisplayNameDescriptor: describeSingleDescriptor(
      context,
      "displayName"
    ),
    consumerDisplayNameDescriptor: describeSingleDescriptor(
      context.Consumer,
      "displayName"
    ),
    providerEqualsContext: context.Provider === context,
    consumerEqualsContext: context.Consumer === context
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
    return {
      type: "null"
    };
  }

  if (prototype === Object.prototype) {
    return {
      type: "Object.prototype"
    };
  }

  if (prototype === Function.prototype) {
    return {
      type: "Function.prototype"
    };
  }

  return {
    type: "other",
    constructorName: prototype?.constructor?.name ?? null
  };
}

function describeThrown(error) {
  return {
    name: error?.name ?? null,
    code: error?.code ?? null,
    message: error?.message ?? String(error)
  };
}

main();
