import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const scenarioId = process.argv[3];

if (!targetPackage || !scenarioId) {
  throw new Error("Usage: node element-object-probe-runner.mjs <package> <scenario>");
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
    throw new Error(`Unknown element-object scenario: ${scenarioId}`);
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

function loadJsxRuntime(target) {
  return require(`${target}/jsx-runtime`);
}

function loadJsxDevRuntime(target) {
  return require(`${target}/jsx-dev-runtime`);
}

const scenarios = {
  "entrypoint-export-shape": (target) => ({
    react: describeModule(loadReact(target)),
    jsxRuntime: describeModule(loadJsxRuntime(target)),
    jsxDevRuntime: describeModule(loadJsxDevRuntime(target))
  }),

  "is-valid-element-brand": (target) => {
    const React = loadReact(target);
    const plainTransitional = {
      $$typeof: Symbol.for("react.transitional.element")
    };
    const plainLegacy = {
      $$typeof: Symbol.for("react.element")
    };

    return {
      realElement: captureOperation("create real element", () =>
        describeElement(React.createElement("div", null))
      ),
      realElementCheck: captureOperation("isValidElement(real element)", () =>
        describeValue(React.isValidElement(React.createElement("div", null)))
      ),
      plainTransitionalCheck: captureOperation(
        "isValidElement(plain transitional brand)",
        () => describeValue(React.isValidElement(plainTransitional))
      ),
      plainLegacyCheck: captureOperation("isValidElement(plain legacy brand)", () =>
        describeValue(React.isValidElement(plainLegacy))
      ),
      nullCheck: captureOperation("isValidElement(null)", () =>
        describeValue(React.isValidElement(null))
      ),
      stringCheck: captureOperation("isValidElement(string)", () =>
        describeValue(React.isValidElement("not an element"))
      )
    };
  },

  "create-basic-no-config": (target) => {
    const React = loadReact(target);
    return captureOperation("createElement(div, null)", () =>
      describeElement(React.createElement("div", null))
    );
  },

  "create-key-ref-default-props-children": (target) => {
    const React = loadReact(target);
    function WithDefaults() {}
    WithDefaults.defaultProps = {
      a: "default-a",
      b: "default-b"
    };
    const refFn = function refFn() {};
    return captureOperation("createElement(defaultProps, key, ref, children)", () => {
      const element = React.createElement(
        WithDefaults,
        {
          key: 12,
          ref: refFn,
          a: undefined,
          b: "override",
          c: null
        },
        "first",
        "second"
      );
      const children = element.props.children;
      return {
        element: describeElement(element),
        propsRefIsInput: element.props.ref === refFn,
        childArray: describeObject(children)
      };
    });
  },

  "create-key-warning-access": (target) => {
    const React = loadReact(target);
    return captureOperation("createElement key warning getter", () => {
      const element = React.createElement("div", { key: "warn-key" });
      const before = describeElement(element);
      const keyAccess = captureOperation("read props.key", () =>
        describeValue(element.props.key)
      );
      return {
        before,
        keyAccess,
        after: describeElement(element)
      };
    });
  },

  "create-ref-warning-access": (target) => {
    const React = loadReact(target);
    const refFn = function refFn() {};
    return captureOperation("createElement ref warning getter", () => {
      const element = React.createElement("div", { ref: refFn });
      const before = describeElement(element);
      const refAccess = captureOperation("read element.ref", () =>
        describeValue(element.ref)
      );
      return {
        before,
        refAccess,
        after: describeElement(element)
      };
    });
  },

  "create-symbol-key-throws": (target) => {
    const React = loadReact(target);
    return captureOperation("createElement Symbol key", () =>
      describeElement(React.createElement("div", { key: Symbol("sym") }))
    );
  },

  "create-config-property-copying": (target) => {
    const React = loadReact(target);
    const symbolKey = Symbol.for("fast-react.probe.create.symbol");
    let accessCount = 0;
    const config = Object.create({ inherited: "inherited-value" });
    config.own = "own-value";
    config[symbolKey] = "symbol-value";
    Object.defineProperty(config, "hidden", {
      enumerable: false,
      value: "hidden-value"
    });
    Object.defineProperty(config, "accessed", {
      enumerable: true,
      get() {
        accessCount += 1;
        return "accessor-value";
      }
    });

    return captureOperation("createElement property copying", () => {
      const element = React.createElement("div", config);
      return {
        element: describeElement(element),
        config: describeObject(config),
        accessCount
      };
    });
  },

  "create-child-element-validation": (target) => {
    const React = loadReact(target);
    return captureOperation("createElement child validation", () => {
      const child = React.createElement("span", {});
      const childBefore = describeElement(child);
      const parent = React.createElement("div", null, child);
      return {
        childBefore,
        parent: describeElement(parent),
        childAfter: describeElement(child)
      };
    });
  },

  "clone-preserve-key-ref": (target) => {
    const React = loadReact(target);
    return captureOperation("cloneElement preserve undefined key/ref", () => {
      const element = React.createElement("div", {
        key: "old-key",
        ref: "old-ref",
        a: "old"
      });
      const clone = React.cloneElement(element, {
        key: undefined,
        ref: undefined,
        a: "new"
      });
      return {
        original: describeElement(element),
        clone: describeElement(clone)
      };
    });
  },

  "clone-null-overrides-key-ref": (target) => {
    const React = loadReact(target);
    return captureOperation("cloneElement null overrides key/ref", () => {
      const element = React.createElement("div", {
        key: "old-key",
        ref: "old-ref",
        a: "old"
      });
      const clone = React.cloneElement(element, {
        key: null,
        ref: null
      });
      return {
        original: describeElement(element),
        clone: describeElement(clone)
      };
    });
  },

  "clone-invalid-inputs": (target) => {
    const React = loadReact(target);
    return {
      nullInput: captureOperation("cloneElement(null)", () =>
        describeElement(React.cloneElement(null, {}))
      ),
      undefinedInput: captureOperation("cloneElement(undefined)", () =>
        describeElement(React.cloneElement(undefined, {}))
      ),
      plainObjectInput: captureOperation("cloneElement(plain object)", () =>
        describeElement(
          React.cloneElement(
            {
              props: { old: "old" },
              type: "plain-type",
              key: "plain-key",
              ref: null
            },
            { next: "next" }
          )
        )
      ),
      stringInput: captureOperation("cloneElement(string)", () =>
        describeElement(React.cloneElement("plain string", { next: "next" }))
      )
    };
  },

  "clone-prop-and-symbol-copying": (target) => {
    const React = loadReact(target);
    const oldSymbol = Symbol.for("fast-react.probe.clone.old-symbol");
    const configSymbol = Symbol.for("fast-react.probe.clone.config-symbol");
    const fakeElement = {
      $$typeof: Symbol.for("react.transitional.element"),
      type: "div",
      key: "old-key",
      ref: null,
      props: {
        a: "old",
        undef: "old-undef",
        [oldSymbol]: "old-symbol-value"
      },
      _owner: null
    };
    const config = {
      a: undefined,
      b: "new"
    };
    config[configSymbol] = "config-symbol-value";

    return captureOperation("cloneElement prop and symbol copying", () => {
      const clone = React.cloneElement(fakeElement, config);
      return {
        fakeElement: describeObject(fakeElement),
        config: describeObject(config),
        clone: describeElement(clone)
      };
    });
  },

  "clone-multiple-children": (target) => {
    const React = loadReact(target);
    return captureOperation("cloneElement multiple children", () => {
      const element = React.createElement("div", { a: "old" });
      const clone = React.cloneElement(element, null, "first", "second");
      return {
        original: describeElement(element),
        clone: describeElement(clone),
        childArray: describeObject(clone.props.children)
      };
    });
  },

  "clone-key-ref-warning-access": (target) => {
    const React = loadReact(target);
    const sourceRef = function sourceRef() {};
    const cloneRef = function cloneRef() {};
    return captureOperation("cloneElement key/ref warning access", () => {
      const element = React.createElement("div", {
        key: "source-key",
        ref: sourceRef
      });
      const clone = React.cloneElement(element, {
        key: "clone-key",
        ref: cloneRef
      });
      const before = describeElement(clone);
      const keyAccess = captureOperation("read cloned props.key", () =>
        describeValue(clone.props.key)
      );
      const refAccess = captureOperation("read cloned element.ref", () =>
        describeValue(clone.ref)
      );
      return {
        original: describeElement(element),
        before,
        keyAccess,
        refAccess,
        after: describeElement(clone)
      };
    });
  },

  "jsx-no-key-reuses-config": (target) => {
    const { jsx } = loadJsxRuntime(target);
    const symbolKey = Symbol.for("fast-react.probe.jsx.identity-symbol");
    let accessCount = 0;
    const config = {
      id: "jsx-id",
      children: "child"
    };
    config[symbolKey] = "symbol-value";
    Object.defineProperty(config, "hidden", {
      enumerable: false,
      value: "hidden-value"
    });
    Object.defineProperty(config, "accessed", {
      enumerable: true,
      get() {
        accessCount += 1;
        return "accessor-value";
      }
    });

    return captureOperation("jsx no key reuses config", () => {
      const element = jsx("div", config);
      return {
        element: describeElement(element),
        config: describeObject(config),
        propsIsConfig: element.props === config,
        accessCount
      };
    });
  },

  "jsx-key-copy-path": (target) => {
    const { jsx } = loadJsxRuntime(target);
    const symbolKey = Symbol.for("fast-react.probe.jsx.copy-symbol");
    let accessCount = 0;
    const config = Object.create({ inherited: "inherited-value" });
    config.key = "copy-key";
    config.own = "own-value";
    config.children = "child";
    config[symbolKey] = "symbol-value";
    Object.defineProperty(config, "hidden", {
      enumerable: false,
      value: "hidden-value"
    });
    Object.defineProperty(config, "accessed", {
      enumerable: true,
      get() {
        accessCount += 1;
        return "accessor-value";
      }
    });

    return captureOperation("jsx key copy path", () => {
      const element = jsx("div", config);
      return {
        element: describeElement(element),
        config: describeObject(config),
        propsIsConfig: element.props === config,
        accessCount
      };
    });
  },

  "jsx-maybe-key-and-config-key": (target) => {
    const { jsx } = loadJsxRuntime(target);
    const inheritedKeyConfig = Object.create({ key: "inherited-key" });
    inheritedKeyConfig.children = "child";
    const shadowUndefinedConfig = Object.create({ key: "inherited-key" });
    shadowUndefinedConfig.key = undefined;
    shadowUndefinedConfig.children = "child";

    return {
      maybeKey: captureOperation("jsx maybeKey", () =>
        describeElement(jsx("div", { children: "child" }, "maybe-key"))
      ),
      configKeyOverridesMaybeKey: captureOperation("jsx config key override", () =>
        describeElement(jsx("div", { key: "config-key" }, "maybe-key"))
      ),
      inheritedKey: captureOperation("jsx inherited key", () =>
        describeElement(jsx("div", inheritedKeyConfig))
      ),
      ownUndefinedKeyShadowsInherited: captureOperation(
        "jsx own undefined key shadows inherited",
        () => describeElement(jsx("div", shadowUndefinedConfig))
      )
    };
  },

  "jsx-key-spread-warning": (target) => {
    const { jsx } = loadJsxRuntime(target);
    return captureOperation("jsx key spread warning", () =>
      describeElement(jsx("div", { key: "spread-key", a: 1 }))
    );
  },

  "jsx-key-ref-warning-access": (target) => {
    const { jsx } = loadJsxRuntime(target);
    const refFn = function jsxRef() {};
    return captureOperation("jsx key/ref warning access", () => {
      const config = { ref: refFn, children: "child" };
      const element = jsx("div", config, "jsx-key");
      const before = describeElement(element);
      const keyAccess = captureOperation("read jsx props.key", () =>
        describeValue(element.props.key)
      );
      const refAccess = captureOperation("read jsx element.ref", () =>
        describeValue(element.ref)
      );
      return {
        before,
        keyAccess,
        refAccess,
        after: describeElement(element),
        propsIsConfig: element.props === config
      };
    });
  },

  "jsxs-static-children-array": (target) => {
    const { jsxs } = loadJsxRuntime(target);
    const children = ["first", "second"];
    const config = { children };
    return captureOperation("jsxs static children array", () => {
      const element = jsxs("div", config);
      return {
        element: describeElement(element),
        config: describeObject(config),
        childrenInput: describeObject(children),
        propsIsConfig: element.props === config,
        childrenIsInput: element.props.children === children
      };
    });
  },

  "jsxs-static-non-array-warning": (target) => {
    const { jsxs } = loadJsxRuntime(target);
    return captureOperation("jsxs static non-array warning", () =>
      describeElement(jsxs("div", { children: "single" }))
    );
  },

  "jsxs-key-ref-warning-access": (target) => {
    const { jsxs } = loadJsxRuntime(target);
    const refFn = function jsxsRef() {};
    return captureOperation("jsxs key/ref warning access", () => {
      const children = ["first", "second"];
      const config = { ref: refFn, children };
      const element = jsxs("div", config, "jsxs-key");
      const before = describeElement(element);
      const keyAccess = captureOperation("read jsxs props.key", () =>
        describeValue(element.props.key)
      );
      const refAccess = captureOperation("read jsxs element.ref", () =>
        describeValue(element.ref)
      );
      return {
        before,
        keyAccess,
        refAccess,
        after: describeElement(element),
        propsIsConfig: element.props === config,
        childrenInput: describeObject(children),
        childrenIsInput: element.props.children === children
      };
    });
  },

  "jsxdev-basic": (target) => {
    const { jsxDEV } = loadJsxDevRuntime(target);
    return captureOperation("jsxDEV basic", () => {
      if (typeof jsxDEV !== "function") {
        return {
          jsxDEV: describeValue(jsxDEV),
          callSkippedBecauseNotFunction: true
        };
      }

      const element = jsxDEV(
        "div",
        { id: "dev-id" },
        "dev-key",
        false,
        { fileName: "source-file.js", lineNumber: 10, columnNumber: 2 },
        undefined
      );
      return {
        jsxDEV: describeValue(jsxDEV),
        element: describeElement(element)
      };
    });
  },

  "jsxdev-static-non-array-warning": (target) => {
    const { jsxDEV } = loadJsxDevRuntime(target);
    return captureOperation("jsxDEV static non-array warning", () => {
      if (typeof jsxDEV !== "function") {
        return {
          jsxDEV: describeValue(jsxDEV),
          callSkippedBecauseNotFunction: true
        };
      }

      return describeElement(
        jsxDEV(
          "div",
          { children: "single" },
          undefined,
          true,
          { fileName: "source-file.js", lineNumber: 20, columnNumber: 4 },
          undefined
        )
      );
    });
  },

  "jsxdev-key-ref-warning-access": (target) => {
    const { jsxDEV } = loadJsxDevRuntime(target);
    return captureOperation("jsxDEV key/ref warning access", () => {
      if (typeof jsxDEV !== "function") {
        return {
          jsxDEV: describeValue(jsxDEV),
          callSkippedBecauseNotFunction: true
        };
      }

      const refFn = function jsxDEVRef() {};
      const config = { ref: refFn, children: "child" };
      const element = jsxDEV(
        "div",
        config,
        "jsxdev-key",
        false,
        { fileName: "source-file.js", lineNumber: 30, columnNumber: 6 },
        undefined
      );
      const before = describeElement(element);
      const keyAccess = captureOperation("read jsxDEV props.key", () =>
        describeValue(element.props.key)
      );
      const refAccess = captureOperation("read jsxDEV element.ref", () =>
        describeValue(element.ref)
      );
      return {
        jsxDEV: describeValue(jsxDEV),
        before,
        keyAccess,
        refAccess,
        after: describeElement(element),
        propsIsConfig: element.props === config
      };
    });
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

function describeModule(moduleValue) {
  return {
    exportKeys: Object.keys(moduleValue),
    ownKeys: describeOwnKeys(moduleValue),
    descriptors: describeDescriptors(moduleValue)
  };
}

function describeElement(element) {
  const elementDescription = describeObject(element);
  const elementDescriptors = getDescriptorMap(element);
  const props = getDataDescriptorValue(elementDescriptors, "props");
  const store = getDataDescriptorValue(elementDescriptors, "_store");
  const brand = getDataDescriptorValue(elementDescriptors, "$$typeof");

  return {
    brand: describeSymbolBrand(brand),
    element: elementDescription,
    props: describeObject(props),
    store: describeObject(store),
    children: describeChildren(props),
    refDescriptor: describeSingleDescriptor(element, "ref"),
    keyDescriptor: describeSingleDescriptor(element, "key")
  };
}

function describeChildren(props) {
  if (!props || (typeof props !== "object" && typeof props !== "function")) {
    return {
      present: false,
      value: describeValue(undefined)
    };
  }

  const descriptor = Object.getOwnPropertyDescriptor(props, "children");
  if (!descriptor || !("value" in descriptor)) {
    return {
      present: Boolean(descriptor),
      descriptor: descriptor ? describeDescriptor("children", descriptor) : null,
      value: describeValue(undefined)
    };
  }

  return {
    present: true,
    descriptor: describeDescriptor("children", descriptor),
    value: describeValue(descriptor.value),
    object: describeObject(descriptor.value)
  };
}

function getDescriptorMap(value) {
  if (!value || (typeof value !== "object" && typeof value !== "function")) {
    return {};
  }

  return Object.getOwnPropertyDescriptors(value);
}

function getDataDescriptorValue(descriptors, key) {
  const descriptor = descriptors[key];
  if (!descriptor || !("value" in descriptor)) {
    return undefined;
  }

  return descriptor.value;
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
    described.value =
      key === "_debugTask"
        ? describeDebugTaskValue(descriptor.value)
        : describeValue(descriptor.value);
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

function describeSymbolBrand(value) {
  if (typeof value !== "symbol") {
    return describeValue(value);
  }

  return {
    type: "symbol",
    keyFor: Symbol.keyFor(value) ?? null,
    description: value.description ?? null,
    stringValue: String(value)
  };
}

function describeDebugTaskValue(value) {
  if (value === null || value === undefined) {
    return describeValue(value);
  }

  if (typeof value === "object" || typeof value === "function") {
    return {
      type: typeof value,
      objectTag: Object.prototype.toString.call(value),
      intentionallyOpaque: true
    };
  }

  return describeValue(value);
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
