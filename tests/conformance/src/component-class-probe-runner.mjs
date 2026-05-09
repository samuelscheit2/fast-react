import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const scenarioId = process.argv[3];

if (!targetPackage || !scenarioId) {
  throw new Error(
    "Usage: node component-class-probe-runner.mjs <package> <scenario>"
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

function main() {
  try {
    const scenario = scenarios[scenarioId];
    if (!scenario) {
      throw new Error(`Unknown component-class scenario: ${scenarioId}`);
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
  "component-class-export-shape": (target) => {
    const React = loadReact(target);

    return {
      component: describeExport(React, "Component"),
      pureComponent: describeExport(React, "PureComponent"),
      componentInReact: "Component" in React,
      pureComponentInReact: "PureComponent" in React,
      filteredExportKeys: Object.keys(React).filter((key) =>
        key.includes("Component")
      ),
      absentConstruction:
        typeof React.Component === "function"
          ? null
          : captureOperation("new React.Component()", () => new React.Component()),
      absentCall:
        typeof React.Component === "function"
          ? null
          : captureOperation("React.Component()", () => React.Component())
    };
  },

  "component-class-prototype-shape": (target) => {
    const React = loadReact(target);
    const unavailable = describeUnavailableClasses(React);
    if (unavailable) {
      return unavailable;
    }

    return {
      componentPrototype: describeObject(React.Component.prototype, React),
      pureComponentPrototype: describeObject(
        React.PureComponent.prototype,
        React
      ),
      relationships: {
        componentPrototypeConstructor:
          React.Component.prototype.constructor === React.Component,
        purePrototypeConstructor:
          React.PureComponent.prototype.constructor === React.PureComponent,
        purePrototypePrototypeIsComponentPrototype:
          Object.getPrototypeOf(React.PureComponent.prototype) ===
          React.Component.prototype,
        purePrototypeInstanceofComponent:
          React.PureComponent.prototype instanceof React.Component,
        componentPrototypeInstanceofComponent:
          React.Component.prototype instanceof React.Component,
        pureSetStateSame:
          React.PureComponent.prototype.setState ===
          React.Component.prototype.setState,
        pureForceUpdateSame:
          React.PureComponent.prototype.forceUpdate ===
          React.Component.prototype.forceUpdate,
        pureIsReactComponentSame:
          React.PureComponent.prototype.isReactComponent ===
          React.Component.prototype.isReactComponent,
        pureIsPureReactComponent:
          React.PureComponent.prototype.isPureReactComponent === true
      }
    };
  },

  "component-class-construction": (target) => {
    const React = loadReact(target);
    const unavailable = describeUnavailableClasses(React);
    if (unavailable) {
      return unavailable;
    }

    const props = { label: "props" };
    const context = { label: "context" };
    const customUpdater = createRecordingUpdater();
    const component = new React.Component(
      props,
      context,
      customUpdater,
      "ignored-extra"
    );
    const pureComponent = new React.PureComponent(
      props,
      context,
      customUpdater,
      "ignored-extra"
    );
    const defaultComponent = new React.Component("default-props", "default-ctx");
    const secondDefaultComponent = new React.Component(
      "second-props",
      "second-ctx"
    );
    const defaultPureComponent = new React.PureComponent(
      "pure-props",
      "pure-ctx"
    );

    return {
      component: describeConstructedInstance(component, React, {
        props,
        context,
        updater: customUpdater
      }),
      pureComponent: describeConstructedInstance(pureComponent, React, {
        props,
        context,
        updater: customUpdater
      }),
      defaultComponent: describeConstructedInstance(defaultComponent, React),
      defaultPureComponent: describeConstructedInstance(
        defaultPureComponent,
        React
      ),
      sharedIdentity: {
        customComponentAndPureRefsSame:
          component.refs === pureComponent.refs,
        defaultComponentAndPureRefsSame:
          defaultComponent.refs === defaultPureComponent.refs,
        allRefsSame:
          component.refs === pureComponent.refs &&
          component.refs === defaultComponent.refs &&
          component.refs === secondDefaultComponent.refs &&
          component.refs === defaultPureComponent.refs,
        defaultUpdaterSame:
          defaultComponent.updater === secondDefaultComponent.updater &&
          defaultComponent.updater === defaultPureComponent.updater,
        customUpdaterPreserved:
          component.updater === customUpdater &&
          pureComponent.updater === customUpdater
      },
      refsObject: describeObject(defaultComponent.refs, React),
      refsMutability: probeRefsMutability(defaultComponent.refs, React),
      defaultUpdater: describeObject(defaultComponent.updater, React),
      defaultUpdaterIsMounted: captureOperation("defaultUpdater.isMounted()", () =>
        defaultComponent.updater.isMounted(defaultComponent)
      ),
      customUpdaterCalls: customUpdater.calls
    };
  },

  "component-class-invocation": (target) => {
    const React = loadReact(target);
    const unavailable = describeUnavailableClasses(React);
    if (unavailable) {
      return unavailable;
    }

    return {
      variableComponentCall: captureOperation(
        "const Component = React.Component; Component()",
        () => {
          const Component = React.Component;
          return describeValue(Component("var-props", "var-context"));
        }
      ),
      componentCallNullThis: captureOperation(
        "React.Component.call(null)",
        () => React.Component.call(null, "null-props", "null-context")
      ),
      componentApplyNullThis: captureOperation(
        "React.Component.apply(null)",
        () => React.Component.apply(null, ["null-props", "null-context"])
      ),
      componentCallObject: captureOperation(
        "React.Component.call(target)",
        () => {
          const targetObject = { existing: true };
          const returnValue = React.Component.call(
            targetObject,
            "call-props",
            "call-context"
          );
          return describeMutatedReceiver(targetObject, returnValue, React);
        }
      ),
      pureApplyObject: captureOperation("React.PureComponent.apply(target)", () => {
        const targetObject = { existing: true };
        const returnValue = React.PureComponent.apply(targetObject, [
          "pure-props",
          "pure-context"
        ]);
        return describeMutatedReceiver(targetObject, returnValue, React);
      }),
      boundComponentCall: captureOperation("bound Component()", () => {
        const targetObject = { existing: true };
        const BoundComponent = React.Component.bind(targetObject);
        const returnValue = BoundComponent("bound-props", "bound-context");
        return {
          boundFunction: describeValue(BoundComponent),
          receiver: describeMutatedReceiver(targetObject, returnValue, React)
        };
      }),
      boundComponentConstructor: captureOperation("new bound Component()", () => {
        const targetObject = { existing: true };
        const BoundComponent = React.Component.bind(targetObject);
        const instance = new BoundComponent("new-props", "new-context");
        return {
          boundThisAfterNew: describeObject(targetObject, React),
          instance: describeConstructedInstance(instance, React),
          instanceOfBoundComponent: instance instanceof BoundComponent
        };
      }),
      pureConstructorExtraArgs: captureOperation(
        "new PureComponent(props, context, updater, extra)",
        () => {
          const instance = new React.PureComponent(
            "extra-props",
            "extra-context",
            undefined,
            "ignored-extra"
          );
          return describeConstructedInstance(instance, React);
        }
      ),
      memberComponentCall: captureOperation("React.Component()", () => {
        const returnValue = React.Component("member-props", "member-context");
        return {
          returnValue: describeValue(returnValue),
          props: describeValue(React.props),
          context: describeValue(React.context),
          refs: describeObject(React.refs, React),
          updater: describeObject(React.updater, React),
          hasOwnProps: Object.hasOwn(React, "props"),
          hasOwnContext: Object.hasOwn(React, "context"),
          hasOwnRefs: Object.hasOwn(React, "refs"),
          hasOwnUpdater: Object.hasOwn(React, "updater")
        };
      })
    };
  },

  "component-class-custom-updater": (target) => {
    const React = loadReact(target);
    const unavailable = describeUnavailableClasses(React);
    if (unavailable) {
      return unavailable;
    }

    const updater = createRecordingUpdater();
    const component = new React.Component("props", "context", updater);
    const pureComponent = new React.PureComponent(
      "pure-props",
      "pure-context",
      updater
    );
    const partialState = { next: true };
    let callbackCallCount = 0;
    function callback() {
      callbackCallCount += 1;
    }

    return {
      componentSetState: captureOperation("component.setState", () =>
        component.setState(partialState, callback)
      ),
      componentForceUpdate: captureOperation("component.forceUpdate", () =>
        component.forceUpdate(callback)
      ),
      pureSetStateFunction: captureOperation("pure.setState(function)", () =>
        pureComponent.setState(function updaterFunction() {
          return { pure: true };
        }, "string-callback")
      ),
      pureForceUpdate: captureOperation("pure.forceUpdate", () =>
        pureComponent.forceUpdate(null)
      ),
      callbackCallCount,
      updaterIdentityPreserved:
        component.updater === updater && pureComponent.updater === updater,
      updaterCalls: describeUpdaterCalls(updater.calls, {
        component,
        pureComponent,
        updater,
        partialState,
        callback
      })
    };
  },

  "component-class-noop-updater": (target) => {
    const React = loadReact(target);
    const unavailable = describeUnavailableClasses(React);
    if (unavailable) {
      return unavailable;
    }

    const component = new React.Component("props", "context");
    const pureComponent = new React.PureComponent("pure-props", "pure-context");
    let callbackCallCount = 0;
    function callback() {
      callbackCallCount += 1;
    }

    return {
      defaultUpdater: describeObject(component.updater, React),
      defaultUpdaterIsMounted: captureOperation("updater.isMounted", () =>
        component.updater.isMounted(component)
      ),
      setStateObject: captureConsoleOperation("setState object", () =>
        component.setState({ value: 1 }, callback)
      ),
      setStateFunction: captureConsoleOperation("setState function", () =>
        component.setState(function updaterFunction() {
          return { value: 2 };
        }, callback)
      ),
      setStateNull: captureConsoleOperation("setState null", () =>
        component.setState(null, callback)
      ),
      setStateUndefined: captureConsoleOperation("setState undefined", () =>
        component.setState(undefined, callback)
      ),
      forceUpdate: captureConsoleOperation("forceUpdate", () =>
        component.forceUpdate(callback)
      ),
      dedupeSameComponent: captureConsoleOperation(
        "dedupe same component name",
        () => {
          component.setState({ value: 3 }, callback);
          component.setState({ value: 4 }, callback);
          component.forceUpdate(callback);
          component.forceUpdate(callback);
          return "done";
        }
      ),
      pureComponentWarnings: captureConsoleOperation(
        "PureComponent warnings",
        () => {
          pureComponent.setState({ pure: true }, callback);
          pureComponent.setState({ pure: false }, callback);
          pureComponent.forceUpdate(callback);
          return "done";
        }
      ),
      invalidSetState: {
        string: captureConsoleOperation("setState string", () =>
          component.setState("bad")
        ),
        number: captureConsoleOperation("setState number", () =>
          component.setState(1)
        ),
        boolean: captureConsoleOperation("setState boolean", () =>
          component.setState(false)
        ),
        symbol: captureConsoleOperation("setState symbol", () =>
          component.setState(Symbol("bad"))
        ),
        bigint: captureConsoleOperation("setState bigint", () =>
          component.setState(1n)
        )
      },
      callbackCallCount
    };
  },

  "component-class-deprecated-accessors": (target) => {
    const React = loadReact(target);
    const unavailable = describeUnavailableClasses(React);
    if (unavailable) {
      return unavailable;
    }

    const component = new React.Component("props", "context");
    const pureComponent = new React.PureComponent("pure-props", "pure-context");

    return {
      componentDescriptors: {
        isMounted: describeSingleDescriptor(
          React.Component.prototype,
          "isMounted",
          React
        ),
        replaceState: describeSingleDescriptor(
          React.Component.prototype,
          "replaceState",
          React
        )
      },
      pureOwnDescriptors: {
        isMounted: describeSingleDescriptor(
          React.PureComponent.prototype,
          "isMounted",
          React
        ),
        replaceState: describeSingleDescriptor(
          React.PureComponent.prototype,
          "replaceState",
          React
        )
      },
      componentIsMountedAccess: captureConsoleOperation(
        "component.isMounted",
        () => component.isMounted
      ),
      componentReplaceStateAccess: captureConsoleOperation(
        "component.replaceState",
        () => component.replaceState
      ),
      pureIsMountedAccess: captureConsoleOperation(
        "pureComponent.isMounted",
        () => pureComponent.isMounted
      ),
      pureReplaceStateAccess: captureConsoleOperation(
        "pureComponent.replaceState",
        () => pureComponent.replaceState
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
    descriptor: descriptor
      ? describeDescriptor(exportName, descriptor, React)
      : null,
    functionObject:
      typeof value === "function"
        ? describeObject(value, React)
        : describeValue(value, React)
  };
}

function describeUnavailableClasses(React) {
  if (
    typeof React.Component === "function" &&
    typeof React.PureComponent === "function"
  ) {
    return null;
  }

  return {
    available: false,
    component: describeExport(React, "Component"),
    pureComponent: describeExport(React, "PureComponent")
  };
}

function createRecordingUpdater() {
  const updater = {
    calls: [],
    isMounted: function () {
      this.calls.push(["isMounted", this, ...arguments]);
      return "is-mounted-result";
    },
    enqueueSetState: function () {
      this.calls.push(["enqueueSetState", this, ...arguments]);
      return "enqueue-set-state-result";
    },
    enqueueForceUpdate: function () {
      this.calls.push(["enqueueForceUpdate", this, ...arguments]);
      return "enqueue-force-update-result";
    },
    enqueueReplaceState: function () {
      this.calls.push(["enqueueReplaceState", this, ...arguments]);
      return "enqueue-replace-state-result";
    }
  };
  return updater;
}

function describeUpdaterCalls(calls, identities) {
  return calls.map((call) => ({
    method: call[0],
    thisMatchesUpdater: call[1] === identities.updater,
    args: call.slice(2).map((arg) => describeUpdaterArg(arg, identities))
  }));
}

function describeUpdaterArg(arg, identities) {
  if (arg === identities.component) {
    return { type: "identity", value: "component" };
  }
  if (arg === identities.pureComponent) {
    return { type: "identity", value: "pureComponent" };
  }
  if (arg === identities.partialState) {
    return { type: "identity", value: "partialState" };
  }
  if (arg === identities.callback) {
    return { type: "identity", value: "callback" };
  }
  return describeValue(arg);
}

function captureOperation(label, fn) {
  try {
    return {
      label,
      status: "ok",
      value: describeReturnValue(fn())
    };
  } catch (error) {
    return {
      label,
      status: "throws",
      error: describeThrown(error)
    };
  }
}

function captureConsoleOperation(label, fn) {
  const calls = [];
  const previousConsoleError = console.error;
  const previousConsoleWarn = console.warn;
  console.error = (...args) => {
    calls.push({
      method: "error",
      args: args.map((arg) => describeValue(arg))
    });
  };
  console.warn = (...args) => {
    calls.push({
      method: "warn",
      args: args.map((arg) => describeValue(arg))
    });
  };

  try {
    const operation = captureOperation(label, fn);
    return {
      ...operation,
      consoleCalls: calls
    };
  } finally {
    console.error = previousConsoleError;
    console.warn = previousConsoleWarn;
  }
}

function describeReturnValue(value) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !Object.hasOwn(value, "$$typeof")
  ) {
    return value;
  }
  return describeValue(value);
}

function describeConstructedInstance(instance, React, expected = {}) {
  return {
    object: describeObject(instance, React),
    selectedValues: {
      props: describeValue(instance?.props, React),
      context: describeValue(instance?.context, React),
      refs: describeValue(instance?.refs, React),
      updater: describeValue(instance?.updater, React)
    },
    relationships: {
      propsMatchesExpected:
        Object.hasOwn(expected, "props") ? instance?.props === expected.props : null,
      contextMatchesExpected:
        Object.hasOwn(expected, "context")
          ? instance?.context === expected.context
          : null,
      updaterMatchesExpected:
        Object.hasOwn(expected, "updater")
          ? instance?.updater === expected.updater
          : null,
      instanceOfComponent: instance instanceof React.Component,
      instanceOfPureComponent: instance instanceof React.PureComponent,
      prototypeIsComponentPrototype:
        Object.getPrototypeOf(instance) === React.Component.prototype,
      prototypeIsPureComponentPrototype:
        Object.getPrototypeOf(instance) === React.PureComponent.prototype
    }
  };
}

function describeMutatedReceiver(targetObject, returnValue, React) {
  return {
    returnValue: describeValue(returnValue, React),
    receiver: describeObject(targetObject, React),
    selectedValues: {
      props: describeValue(targetObject.props, React),
      context: describeValue(targetObject.context, React),
      refs: describeValue(targetObject.refs, React),
      updater: describeValue(targetObject.updater, React)
    },
    relationships: {
      prototypeStillObject:
        Object.getPrototypeOf(targetObject) === Object.prototype,
      instanceOfComponent: targetObject instanceof React.Component,
      instanceOfPureComponent: targetObject instanceof React.PureComponent
    }
  };
}

function probeRefsMutability(refs, React) {
  return {
    initial: describeObject(refs, React),
    reflectSetExtra: captureOperation("Reflect.set refs.extra", () => {
      const setResult = Reflect.set(refs, "extra", 42);
      return {
        setResult,
        extra: describeValue(refs.extra, React),
        refs: describeObject(refs, React)
      };
    }),
    reflectDefineExtra: captureOperation(
      "Reflect.defineProperty refs.definedExtra",
      () => {
        const defineResult = Reflect.defineProperty(refs, "definedExtra", {
          configurable: true,
          enumerable: true,
          value: "defined-extra",
          writable: true
        });
        return {
          defineResult,
          definedExtra: describeValue(refs.definedExtra, React),
          refs: describeObject(refs, React)
        };
      }
    ),
    objectDefineExtra: captureOperation(
      "Object.defineProperty refs.objectDefinedExtra",
      () => {
        Object.defineProperty(refs, "objectDefinedExtra", {
          configurable: true,
          enumerable: true,
          value: "object-defined-extra",
          writable: true
        });
        return {
          objectDefinedExtra: describeValue(refs.objectDefinedExtra, React),
          refs: describeObject(refs, React)
        };
      }
    ),
    directAssignExtra: captureOperation("refs.directExtra assignment", () => {
      refs.directExtra = "direct-extra";
      return {
        directExtra: describeValue(refs.directExtra, React),
        refs: describeObject(refs, React)
      };
    }),
    deleteExtra: captureOperation("delete refs extras", () => ({
      extraDeleted: Reflect.deleteProperty(refs, "extra"),
      definedExtraDeleted: Reflect.deleteProperty(refs, "definedExtra"),
      directExtraDeleted: Reflect.deleteProperty(refs, "directExtra"),
      refs: describeObject(refs, React)
    }))
  };
}

function describeSingleDescriptor(value, key, React) {
  if (!value || (typeof value !== "object" && typeof value !== "function")) {
    return null;
  }

  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor ? describeDescriptor(key, descriptor, React) : null;
}

function describeObject(value, React) {
  const summary = describeValue(value, React);
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
    descriptors: describeDescriptors(value, React),
    state: {
      frozen: Object.isFrozen(value),
      sealed: Object.isSealed(value),
      extensible: Object.isExtensible(value),
      objectTag: Object.prototype.toString.call(value),
      prototype: describePrototype(value, React)
    }
  };
}

function describeOwnKeys(value) {
  return Reflect.ownKeys(value).map(describePropertyKey);
}

function describeDescriptors(value, React) {
  return Reflect.ownKeys(value).map((key) =>
    describeDescriptor(key, Object.getOwnPropertyDescriptor(value, key), React)
  );
}

function describeDescriptor(key, descriptor, React) {
  const described = {
    key: describePropertyKey(key),
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable
  };

  if ("value" in descriptor) {
    described.kind = "data";
    described.writable = descriptor.writable;
    described.value = describeValue(descriptor.value, React);
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

function describeValue(value, React) {
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
    prototype: describePrototype(value, React),
    keys: Object.keys(value)
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

function describePrototype(value, React) {
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

  if (React?.Component && prototype === React.Component.prototype) {
    return {
      type: "React.Component.prototype"
    };
  }

  if (React?.PureComponent && prototype === React.PureComponent.prototype) {
    return {
      type: "React.PureComponent.prototype"
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
