import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const scenarioId = process.argv[3];

if (!targetPackage || !scenarioId) {
  throw new Error(
    "Usage: node forward-ref-probe-runner.mjs <package> <scenario>"
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
      throw new Error(`Unknown forward-ref scenario: ${scenarioId}`);
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
  "forward-ref-export-shape": (target) => {
    const React = loadReact(target);

    return describeExport(React, "forwardRef");
  },

  "forward-ref-wrapper-object": (target) => {
    const React = loadReact(target);
    function RenderZero() {}
    function RenderOne(_props) {}
    function RenderTwo(_props, _ref) {}
    function RenderThree(_props, _ref, _extra) {}
    function RenderWithDefaultProps() {}
    RenderWithDefaultProps.defaultProps = { label: "default" };
    const objectRender = { render: true };
    const memoRender = React.memo(function MemoComponent() {});
    const lazyRender = React.lazy(function lazyLoader() {
      return {
        then() {}
      };
    });

    return {
      arityZero: captureWithConsole("forwardRef(render length 0)", () =>
        describeForwardRefWrapper(React.forwardRef(RenderZero), RenderZero)
      ),
      arityOne: captureWithConsole("forwardRef(render length 1)", () =>
        describeForwardRefWrapper(React.forwardRef(RenderOne), RenderOne)
      ),
      arityTwo: captureWithConsole("forwardRef(render length 2)", () =>
        describeForwardRefWrapper(React.forwardRef(RenderTwo), RenderTwo)
      ),
      arityThree: captureWithConsole("forwardRef(render length 3)", () =>
        describeForwardRefWrapper(React.forwardRef(RenderThree), RenderThree)
      ),
      defaultProps: captureWithConsole("forwardRef(render defaultProps)", () =>
        describeForwardRefWrapper(
          React.forwardRef(RenderWithDefaultProps),
          RenderWithDefaultProps
        )
      ),
      nullRender: captureWithConsole("forwardRef(null)", () =>
        describeForwardRefWrapper(React.forwardRef(null), null)
      ),
      undefinedRender: captureWithConsole("forwardRef(undefined)", () =>
        describeForwardRefWrapper(React.forwardRef(undefined), undefined)
      ),
      objectRender: captureWithConsole("forwardRef(object)", () =>
        describeForwardRefWrapper(React.forwardRef(objectRender), objectRender)
      ),
      stringRender: captureWithConsole("forwardRef(string)", () =>
        describeForwardRefWrapper(React.forwardRef("div"), "div")
      ),
      memoRender: captureWithConsole("forwardRef(memo)", () =>
        describeForwardRefWrapper(React.forwardRef(memoRender), memoRender)
      ),
      lazyRender: captureWithConsole("forwardRef(lazy)", () =>
        describeForwardRefWrapper(React.forwardRef(lazyRender), lazyRender)
      )
    };
  },

  "forward-ref-invocation": (target) => {
    const React = loadReact(target);
    function Render(_props, _ref) {}
    const thisArg = { untouched: true };
    const boundForwardRef = React.forwardRef.bind({ boundThis: true });

    return {
      normalCall: captureWithConsole("forwardRef(render)", () =>
        describeForwardRefWrapper(React.forwardRef(Render), Render)
      ),
      extraArguments: captureWithConsole("forwardRef(render, extra)", () =>
        describeForwardRefWrapper(React.forwardRef(Render, "extra"), Render)
      ),
      callWithThis: captureWithConsole("forwardRef.call(thisArg)", () =>
        describeForwardRefWrapper(React.forwardRef.call(thisArg, Render), Render)
      ),
      applyWithThis: captureWithConsole("forwardRef.apply(thisArg)", () =>
        describeForwardRefWrapper(
          React.forwardRef.apply(thisArg, [Render, "extra"]),
          Render
        )
      ),
      boundCall: captureWithConsole("bound forwardRef()", () =>
        describeForwardRefWrapper(boundForwardRef(Render, "extra"), Render)
      ),
      constructorCall: captureWithConsole("new forwardRef()", () => {
        const wrapper = new React.forwardRef(Render, "extra");
        return {
          wrapper: describeForwardRefWrapper(wrapper, Render),
          instanceOfForwardRef: wrapper instanceof React.forwardRef,
          instanceOfBoundForwardRef: wrapper instanceof boundForwardRef
        };
      }),
      boundConstructorCall: captureWithConsole("new bound forwardRef()", () => {
        const wrapper = new boundForwardRef(Render, "extra");
        return {
          wrapper: describeForwardRefWrapper(wrapper, Render),
          instanceOfForwardRef: wrapper instanceof React.forwardRef,
          instanceOfBoundForwardRef: wrapper instanceof boundForwardRef
        };
      }),
      thisArgAfterCalls: describeObject(thisArg)
    };
  },

  "forward-ref-display-name": (target) => {
    const React = loadReact(target);

    return {
      anonymousRender: exerciseForwardRefDisplayName(React, function () {}),
      namedRender: exerciseForwardRefDisplayName(React, function NamedRender() {}),
      presetDisplayNameRender: exercisePresetDisplayName(React),
      nullRender: exerciseInvalidDisplayName(React, null),
      stringRender: exerciseInvalidDisplayName(React, "div")
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

function exerciseForwardRefDisplayName(React, render) {
  const wrapper = React.forwardRef(render);
  const before = {
    wrapper: describeForwardRefWrapper(wrapper, render),
    render: describeObject(render),
    renderDisplayName: describeValue(render.displayName)
  };
  const assignment = captureWithConsole("assign forwardRef displayName", () => {
    wrapper.displayName = "Shown";
    return {
      wrapper: describeForwardRefWrapper(wrapper, render),
      render: describeObject(render),
      renderDisplayName: describeValue(render.displayName)
    };
  });

  return {
    before,
    assignment
  };
}

function exercisePresetDisplayName(React) {
  function RenderWithDisplayName() {}
  RenderWithDisplayName.displayName = "Preset";
  return exerciseForwardRefDisplayName(React, RenderWithDisplayName);
}

function exerciseInvalidDisplayName(React, render) {
  const creation = captureWithConsole("forwardRef invalid displayName target", () =>
    React.forwardRef(render)
  );
  const wrapper = creation.status === "ok" ? creation.value : null;
  const before =
    wrapper && typeof wrapper === "object"
      ? describeForwardRefWrapper(wrapper, render)
      : null;
  const assignment = captureWithConsole(
    "assign invalid forwardRef displayName",
    () => {
      wrapper.displayName = "Shown";
      return describeForwardRefWrapper(wrapper, render);
    }
  );

  return {
    creation: {
      ...creation,
      value:
        wrapper && typeof wrapper === "object"
          ? describeForwardRefWrapper(wrapper, render)
          : describeValue(wrapper)
    },
    before,
    assignment,
    after:
      wrapper && typeof wrapper === "object"
        ? describeForwardRefWrapper(wrapper, render)
        : describeValue(wrapper)
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

function describeForwardRefWrapper(wrapper, expectedRender) {
  return {
    object: describeObject(wrapper),
    tag:
      wrapper && typeof wrapper === "object"
        ? describeValue(wrapper.$$typeof)
        : null,
    render:
      wrapper && typeof wrapper === "object"
        ? describeValue(wrapper.render)
        : null,
    renderIdentity:
      wrapper && typeof wrapper === "object"
        ? wrapper.render === expectedRender
        : null,
    displayName:
      wrapper && typeof wrapper === "object"
        ? describeValue(wrapper.displayName)
        : null
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

  if (Object.hasOwn(value, "render")) {
    summary.render = describeValue(value.render);
  }

  if (Object.hasOwn(value, "type")) {
    summary.type = describeValue(value.type);
  }

  if (Object.hasOwn(value, "compare")) {
    summary.compare = describeValue(value.compare);
  }

  if (Object.hasOwn(value, "_payload")) {
    summary.payloadKeys = Object.keys(value._payload);
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
