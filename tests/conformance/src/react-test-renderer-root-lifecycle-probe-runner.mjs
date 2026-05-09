import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const scenarioId = process.argv[3];

if (!targetPackage || !scenarioId) {
  throw new Error(
    "Usage: node react-test-renderer-root-lifecycle-probe-runner.mjs <package> <scenario>"
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
  try {
    const scenario = scenarios[scenarioId];
    if (!scenario) {
      throw new Error(
        `Unknown react-test-renderer root lifecycle scenario: ${scenarioId}`
      );
    }

    const result = await captureOperation(scenarioId, () =>
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

const scenarios = {
  "renderer-object-shape": async (target) => {
    const { React, TestRenderer } = loadModules(target);
    let renderer;
    const create = await actOperation(React, "create(<leaf />)", () => {
      renderer = TestRenderer.create(hostElement(React, "shape"));
    });

    return {
      moduleShape: describeModuleShape(TestRenderer),
      actAvailability: describeActAvailability(React, TestRenderer),
      create,
      renderer: describeRenderer(renderer)
    };
  },

  "raw-create-act-boundary": async (target) => {
    const { React, TestRenderer } = loadModules(target);
    const renderer = TestRenderer.create(hostElement(React, "raw"));

    const beforeAct = describeRendererState(renderer);
    const emptyActFlush = await actOperation(React, "empty act flush", () => {});
    const afterEmptyAct = describeRendererState(renderer);

    return {
      actAvailability: describeActAvailability(React, TestRenderer),
      beforeAct,
      emptyActFlush,
      afterEmptyAct
    };
  },

  "create-update-unmount-flow": async (target) => {
    const { React, TestRenderer } = loadModules(target);
    let renderer;

    const create = await actOperation(React, "create(created)", () => {
      renderer = TestRenderer.create(hostElement(React, "created"));
    });
    const afterCreate = describeRendererState(renderer);

    const update = await actOperation(React, "update(updated)", () => {
      renderer.update(hostElement(React, "updated"));
    });
    const afterUpdate = describeRendererState(renderer);

    const unmount = await actOperation(React, "unmount()", () => {
      renderer.unmount();
    });
    const afterUnmount = {
      toJSON: captureSync("toJSON after unmount", () =>
        describeTestJson(renderer.toJSON())
      ),
      root: captureSync(".root after unmount", () =>
        describeTestInstance(renderer.root)
      ),
      getInstance: captureSync("getInstance after unmount", () =>
        describePublicInstance(renderer.getInstance())
      ),
      update: captureSync("update after unmount", () => {
        renderer.update(hostElement(React, "post-unmount"));
        return "returned";
      }),
      unmountAgain: captureSync("unmount again", () => {
        renderer.unmount();
        return "returned";
      }),
      finalState: describeRendererState(renderer)
    };

    return {
      actAvailability: describeActAvailability(React, TestRenderer),
      create,
      afterCreate,
      update,
      afterUpdate,
      unmount,
      afterUnmount
    };
  },

  "root-access-boundaries": async (target) => {
    const { React, TestRenderer } = loadModules(target);
    const outputs = {};

    await actOperation(React, "create(null)", () => {
      outputs.nullRoot = TestRenderer.create(null);
    });
    await actOperation(React, "create(array root)", () => {
      outputs.arrayRoot = TestRenderer.create([
        React.createElement("first-root", { key: "first" }, "first"),
        React.createElement("second-root", { key: "second" }, "second")
      ]);
    });
    await actOperation(React, "create(fragment root)", () => {
      outputs.fragmentRoot = TestRenderer.create(
        React.createElement(
          React.Fragment,
          null,
          React.createElement("first-fragment-root", null, "first"),
          React.createElement("second-fragment-root", null, "second")
        )
      );
    });

    return {
      nullRoot: describeRendererState(outputs.nullRoot),
      arrayRoot: describeRendererState(outputs.arrayRoot),
      fragmentRoot: describeRendererState(outputs.fragmentRoot)
    };
  },

  "get-instance-boundaries": async (target) => {
    const { React, TestRenderer } = loadModules(target);

    function FunctionRoot() {
      return hostElement(React, "function-child");
    }

    class RootClass extends React.Component {
      constructor(props) {
        super(props);
        this.state = {
          marker: "initial-state"
        };
      }

      render() {
        return React.createElement("class-leaf", { marker: "class" }, "class");
      }
    }

    let hostRenderer;
    let functionRenderer;
    let classRenderer;

    await actOperation(React, "create(host)", () => {
      hostRenderer = TestRenderer.create(hostElement(React, "host"));
    });
    await actOperation(React, "create(function component)", () => {
      functionRenderer = TestRenderer.create(React.createElement(FunctionRoot));
    });
    await actOperation(React, "create(class component)", () => {
      classRenderer = TestRenderer.create(
        React.createElement(RootClass, { label: "class-root" })
      );
    });

    return {
      hostRoot: {
        state: describeRendererState(hostRenderer),
        getInstance: captureSync("host getInstance", () =>
          describePublicInstance(hostRenderer.getInstance())
        )
      },
      functionRoot: {
        state: describeRendererState(functionRenderer),
        getInstance: captureSync("function getInstance", () =>
          describePublicInstance(functionRenderer.getInstance())
        )
      },
      classRoot: {
        state: describeRendererState(classRenderer),
        getInstance: captureSync("class getInstance", () =>
          describePublicInstance(classRenderer.getInstance())
        )
      }
    };
  },

  "create-node-mock-ref-lifecycle": async (target) => {
    const { React, TestRenderer } = loadModules(target);
    const ref = React.createRef();
    const createNodeMockCalls = [];

    function createNodeMock(element) {
      const publicInstance = {
        mockId: createNodeMockCalls.length + 1,
        type: element.type,
        label: element.props.label
      };
      createNodeMockCalls.push({
        type: describeType(element.type),
        label: describeValue(element.props.label),
        propsKeys: Object.keys(element.props).sort(),
        returnedMockId: publicInstance.mockId
      });
      return publicInstance;
    }

    function refHost(type, label) {
      return React.createElement(type, { ref, label }, label);
    }

    let renderer;
    await actOperation(React, "create mocked host", () => {
      renderer = TestRenderer.create(refHost("mock-host", "one"), {
        createNodeMock
      });
    });
    const afterCreate = describeMockLifecycleStep({
      createNodeMockCalls,
      ref,
      renderer
    });

    await actOperation(React, "same type update", () => {
      renderer.update(refHost("mock-host", "two"));
    });
    const afterSameTypeUpdate = describeMockLifecycleStep({
      createNodeMockCalls,
      ref,
      renderer
    });

    await actOperation(React, "type change update", () => {
      renderer.update(refHost("mock-host-next", "three"));
    });
    const afterTypeChange = describeMockLifecycleStep({
      createNodeMockCalls,
      ref,
      renderer
    });

    await actOperation(React, "mocked unmount", () => {
      renderer.unmount();
    });
    const afterUnmount = describeMockLifecycleStep({
      createNodeMockCalls,
      ref,
      renderer
    });

    return {
      afterCreate,
      afterSameTypeUpdate,
      afterTypeChange,
      afterUnmount
    };
  },

  "strict-and-concurrent-options": async (target) => {
    globalThis.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;
    const { React, TestRenderer } = loadModules(target);
    const strictRenderLog = [];

    function StrictProbe({ label }) {
      strictRenderLog.push(label);
      return React.createElement("strict-leaf", { label }, label);
    }

    async function createStrict(label, options) {
      strictRenderLog.length = 0;
      let renderer;
      const operation = await actOperation(React, `strict ${label}`, () => {
        renderer = TestRenderer.create(
          React.createElement(StrictProbe, { label }),
          options
        );
      });
      return {
        operation,
        renderLog: strictRenderLog.slice(),
        state: describeRendererState(renderer)
      };
    }

    async function createConcurrent(label, options) {
      let renderer;
      const operation = await actOperation(React, `concurrent ${label}`, () => {
        renderer = TestRenderer.create(hostElement(React, label), options);
      });
      return {
        operation,
        state: describeRendererState(renderer)
      };
    }

    return {
      reactNativeTestEnvironment: describeValue(
        globalThis.IS_REACT_NATIVE_TEST_ENVIRONMENT
      ),
      actAvailability: describeActAvailability(React, TestRenderer),
      strictFalse: await createStrict("strict-false", {
        unstable_strictMode: false
      }),
      strictTrue: await createStrict("strict-true", {
        unstable_strictMode: true
      }),
      concurrentOptions: {
        omitted: await createConcurrent("concurrent-omitted", undefined),
        falseValue: await createConcurrent("concurrent-false", {
          unstable_isConcurrent: false
        }),
        trueValue: await createConcurrent("concurrent-true", {
          unstable_isConcurrent: true
        })
      }
    };
  }
};

function loadModules(target) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const React = require("react");
  const TestRenderer = require(target);
  return {
    React,
    TestRenderer
  };
}

function hostElement(React, id) {
  return React.createElement("root-leaf", { id }, id);
}

async function captureOperation(label, operation) {
  try {
    const value = await operation();
    return {
      label,
      status: "ok",
      value
    };
  } catch (error) {
    return {
      label,
      ...describeThrown(error)
    };
  }
}

function captureSync(label, operation) {
  try {
    return {
      label,
      status: "ok",
      value: operation()
    };
  } catch (error) {
    return {
      label,
      ...describeThrown(error)
    };
  }
}

async function actOperation(React, label, operation) {
  if (typeof React.act !== "function") {
    return captureSync(label, () => ({
      usedAct: false,
      returnValue: describeValue(operation())
    }));
  }

  try {
    let returnValue;
    await React.act(async () => {
      returnValue = operation();
    });
    return {
      label,
      status: "ok",
      value: {
        usedAct: true,
        returnValue: describeValue(returnValue)
      }
    };
  } catch (error) {
    return {
      label,
      ...describeThrown(error)
    };
  }
}

function describeRenderer(renderer) {
  if (!renderer) {
    return describeValue(renderer);
  }

  return {
    object: describeObjectShape(renderer),
    state: describeRendererState(renderer)
  };
}

function describeRendererState(renderer) {
  if (!renderer) {
    return describeValue(renderer);
  }

  return {
    toJSON: captureSync("toJSON", () => describeTestJson(renderer.toJSON())),
    root: captureSync(".root", () => describeTestInstance(renderer.root)),
    getInstance: captureSync("getInstance", () =>
      describePublicInstance(renderer.getInstance())
    )
  };
}

function describeMockLifecycleStep({ createNodeMockCalls, ref, renderer }) {
  return {
    refCurrent: describePublicInstance(ref.current),
    getInstance: captureSync("getInstance", () =>
      describePublicInstance(renderer.getInstance())
    ),
    state: describeRendererState(renderer),
    createNodeMockCalls: createNodeMockCalls.slice()
  };
}

function describeModuleShape(moduleValue) {
  return {
    object: describeObjectShape(moduleValue),
    exports: {
      create: describeDescriptor(
        Object.getOwnPropertyDescriptor(moduleValue, "create")
      ),
      act: describeDescriptor(Object.getOwnPropertyDescriptor(moduleValue, "act")),
      version: describeDescriptor(
        Object.getOwnPropertyDescriptor(moduleValue, "version")
      )
    }
  };
}

function describeActAvailability(React, TestRenderer) {
  return {
    reactAct: describeValue(React.act),
    testRendererAct: describeValue(TestRenderer.act)
  };
}

function describeTestJson(value) {
  if (value === null || typeof value === "string") {
    return describeValue(value);
  }

  if (Array.isArray(value)) {
    return value.map(describeTestJson);
  }

  return {
    object: describeObjectShape(value, { includeDescriptors: false }),
    brand: describeValue(value.$$typeof),
    type: describeType(value.type),
    props: describeProps(value.props),
    children: Array.isArray(value.children)
      ? value.children.map(describeTestJson)
      : describeValue(value.children)
  };
}

function describeTestInstance(instance) {
  if (instance === null || typeof instance === "undefined") {
    return describeValue(instance);
  }

  return {
    object: describeObjectShape(instance, { includeDescriptors: false }),
    constructorName: instance.constructor?.name ?? null,
    type: describeType(instance.type),
    props: describeProps(instance.props),
    children: Array.isArray(instance.children)
      ? instance.children.map(describeTestInstanceChild)
      : describeValue(instance.children)
  };
}

function describeTestInstanceChild(child) {
  if (typeof child === "string") {
    return describeValue(child);
  }

  return {
    constructorName: child?.constructor?.name ?? null,
    type: describeType(child?.type),
    props: describeProps(child?.props),
    children: Array.isArray(child?.children)
      ? child.children.map((grandchild) =>
          typeof grandchild === "string"
            ? describeValue(grandchild)
            : {
                constructorName: grandchild?.constructor?.name ?? null,
                type: describeType(grandchild?.type),
                props: describeProps(grandchild?.props)
              }
        )
      : describeValue(child?.children)
  };
}

function describePublicInstance(value) {
  if (value === null || typeof value === "undefined") {
    return describeValue(value);
  }

  if (typeof value !== "object") {
    return describeValue(value);
  }

  const summary = {
    object: describeObjectShape(value, { includeDescriptors: false }),
    constructorName: value.constructor?.name ?? null
  };

  if (value.props && typeof value.props === "object") {
    summary.props = describeProps(value.props);
  }
  if (value.state && typeof value.state === "object") {
    summary.state = describePlainObject(value.state);
  }
  for (const key of Object.keys(value)) {
    if (!Object.hasOwn(summary, "fields")) {
      summary.fields = {};
    }
    summary.fields[key] = describeValue(value[key], 1);
  }

  return summary;
}

function describeProps(props) {
  if (props === null || typeof props === "undefined") {
    return describeValue(props);
  }

  const output = {};
  for (const key of Object.keys(props).sort()) {
    if (key === "children") {
      output[key] = Array.isArray(props[key])
        ? props[key].map(describeValue)
        : describeValue(props[key], 1);
    } else if (key === "ref") {
      output[key] = describeValue(props[key], 1);
    } else {
      output[key] = describeValue(props[key], 1);
    }
  }
  return output;
}

function describePlainObject(value) {
  const output = {};
  for (const key of Object.keys(value).sort()) {
    output[key] = describeValue(value[key], 1);
  }
  return output;
}

function describeObjectShape(value, { includeDescriptors = true } = {}) {
  const objectValue = Object(value);
  const ownKeys = Reflect.ownKeys(objectValue);
  const output = {
    type: typeof value,
    objectTag: Object.prototype.toString.call(value),
    isArray: Array.isArray(value),
    state: {
      extensible: Object.isExtensible(objectValue),
      sealed: Object.isSealed(objectValue),
      frozen: Object.isFrozen(objectValue)
    },
    objectKeys: Object.keys(objectValue),
    ownPropertyNames: Object.getOwnPropertyNames(objectValue),
    ownSymbolKeys: Object.getOwnPropertySymbols(objectValue).map(
      describePropertyKey
    ),
    ownKeys: ownKeys.map(describePropertyKey)
  };

  if (includeDescriptors) {
    const descriptors = Object.getOwnPropertyDescriptors(objectValue);
    output.descriptors = ownKeys.map((key) => ({
      key: describePropertyKey(key),
      descriptor: describeDescriptor(descriptors[key])
    }));
  }

  return output;
}

function describeDescriptor(descriptor) {
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
      value: describeValue(descriptor.value, 1)
    };
  }

  return {
    ...base,
    get: describeValue(descriptor.get, 1),
    set: describeValue(descriptor.set, 1)
  };
}

function describeType(type) {
  if (typeof type === "function") {
    return {
      type: "function",
      name: type.name,
      length: type.length
    };
  }
  return describeValue(type, 1);
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
    valueType === "boolean"
  ) {
    return {
      type: valueType,
      value
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
      isAsync: value.constructor?.name === "AsyncFunction",
      ownPropertyNames: Object.getOwnPropertyNames(value),
      hasOwnPrototype: Object.hasOwn(value, "prototype")
    };
  }

  if (valueType === "object") {
    if (depth >= 1) {
      return {
        type: "object",
        objectTag: Object.prototype.toString.call(value),
        isArray: Array.isArray(value),
        ownPropertyNames: Object.getOwnPropertyNames(value),
        ownSymbolKeys: Object.getOwnPropertySymbols(value).map(
          describePropertyKey
        ),
        ownKeys: Reflect.ownKeys(value).map(describePropertyKey)
      };
    }
    return {
      object: describeObjectShape(value, { includeDescriptors: false }),
      fields: describePlainObject(value)
    };
  }

  return {
    type: valueType
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

function describeThrown(error) {
  return {
    status: "throws",
    name: error?.name ?? null,
    code: error?.code ?? null,
    message: error?.message ?? String(error)
  };
}

await main();
