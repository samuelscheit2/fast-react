import { createRequire } from "node:module";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const scenarioId = process.argv[3];

if (!targetPackage || !scenarioId) {
  throw new Error(
    "Usage: node react-test-renderer-error-surface-probe-runner.mjs <package> <scenario>"
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
      throw new Error(
        `Unknown react-test-renderer error surface scenario: ${scenarioId}`
      );
    }

    const result = captureScenarioOperation(scenarioId, () =>
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
  "test-instance-query-errors": (target) => {
    const { React, TestRenderer } = loadReactTestRenderer(target);
    const renderer = createQueryRenderer({ React, TestRenderer });
    const root = renderer.root;

    return {
      rootSummary: describeTestInstance(root),
      noMatchPredicate: captureOperation(
        "root.find(matchesNothing)",
        () => root.find(matchesNothing)
      ),
      multiMatchPredicate: captureOperation(
        "root.find(matchesDuplicateRole)",
        () => root.find(matchesDuplicateRole)
      ),
      noMatchByType: captureOperation(
        'root.findByType("aside")',
        () => root.findByType("aside")
      ),
      multiMatchByType: captureOperation(
        'root.findByType("section")',
        () => root.findByType("section")
      ),
      noMatchByProps: captureOperation(
        'root.findByProps({ id: "missing" })',
        () => root.findByProps({ id: "missing" })
      ),
      multiMatchByProps: captureOperation(
        'root.findByProps({ role: "dup" })',
        () => root.findByProps({ role: "dup" })
      ),
      findAllNoMatchCount: root.findAll(matchesNothing).length,
      findAllDuplicateRoleCount: root.findAll(matchesDuplicateRole).length
    };
  },

  "unmounted-root-access-errors": (target) => {
    const { React, TestRenderer } = loadReactTestRenderer(target);
    const renderer = createQueryRenderer({ React, TestRenderer });
    const root = renderer.root;
    const firstSection = root.findByProps({ id: "first" });

    TestRenderer.act(() => {
      renderer.unmount();
    });

    return {
      rendererRoot: captureOperation("renderer.root after unmount", () =>
        renderer.root
      ),
      rendererToJSON: captureOperation("renderer.toJSON() after unmount", () =>
        renderer.toJSON()
      ),
      rendererToTree: captureOperation("renderer.toTree() after unmount", () =>
        renderer.toTree()
      ),
      rendererGetInstance: captureOperation(
        "renderer.getInstance() after unmount",
        () => renderer.getInstance()
      ),
      rendererUpdateAgain: captureOperation(
        "renderer.update(<main />) after unmount",
        () => {
          TestRenderer.act(() => {
            renderer.update(React.createElement("main"));
          });
          return renderer.toJSON();
        }
      ),
      rendererUnmountAgain: captureOperation("renderer.unmount() twice", () => {
        TestRenderer.act(() => {
          renderer.unmount();
        });
        return "done";
      }),
      retainedRootType: captureOperation("retainedRoot.type", () => root.type),
      retainedRootProps: captureOperation("retainedRoot.props", () => root.props),
      retainedRootChildren: captureOperation(
        "retainedRoot.children",
        () => root.children
      ),
      retainedRootFindAll: captureOperation(
        "retainedRoot.findAll(matchesEverything)",
        () => root.findAll(matchesEverything)
      ),
      retainedChildType: captureOperation(
        "retainedChild.type",
        () => firstSection.type
      ),
      retainedChildProps: captureOperation(
        "retainedChild.props",
        () => firstSection.props
      ),
      retainedChildParent: captureOperation(
        "retainedChild.parent",
        () => firstSection.parent
      )
    };
  },

  "invalid-create-update-inputs": (target) => {
    const { React, TestRenderer } = loadReactTestRenderer(target);

    return {
      createPlainObjectChild: captureOperation(
        "create({ foo: \"bar\" })",
        () => createRendererWithElement(TestRenderer, { foo: "bar" })
      ),
      createInvalidUndefinedType: captureOperation(
        "create(React.createElement(undefined))",
        () => createRendererWithElement(TestRenderer, React.createElement(undefined))
      ),
      createInvalidNullType: captureOperation(
        "create(React.createElement(null))",
        () => createRendererWithElement(TestRenderer, React.createElement(null))
      ),
      updatePlainObjectChild: captureOperation(
        "update({ foo: \"bar\" })",
        () =>
          updateFreshRenderer({
            React,
            TestRenderer,
            nextElement: { foo: "bar" }
          })
      ),
      updateInvalidUndefinedType: captureOperation(
        "update(React.createElement(undefined))",
        () =>
          updateFreshRenderer({
            React,
            TestRenderer,
            nextElement: React.createElement(undefined)
          })
      ),
      updateInvalidNullType: captureOperation(
        "update(React.createElement(null))",
        () =>
          updateFreshRenderer({
            React,
            TestRenderer,
            nextElement: React.createElement(null)
          })
      )
    };
  },

  "shallow-removal-error": (target) => {
    const ShallowRenderer = require(`${target}/shallow`);
    return {
      exportShape: describeFunction(ShallowRenderer),
      call: captureOperation("ReactShallowRenderer()", () => ShallowRenderer()),
      construct: captureOperation(
        "new ReactShallowRenderer()",
        () => new ShallowRenderer()
      )
    };
  },

  "unsupported-use-error": (target) => {
    const { React, TestRenderer } = loadReactTestRenderer(target);

    function UsesUnsupportedObject() {
      React.use({ foo: "bar" });
      return React.createElement("never-rendered");
    }

    return {
      createUnsupportedUse: captureOperation(
        "create(<UsesUnsupportedObject />)",
        () =>
          createRendererWithElement(
            TestRenderer,
            React.createElement(UsesUnsupportedObject)
          )
      )
    };
  }
};

function loadReactTestRenderer(target) {
  return {
    React: require("react"),
    TestRenderer: require(target)
  };
}

function createQueryRenderer({ React, TestRenderer }) {
  let renderer;
  TestRenderer.act(() => {
    renderer = TestRenderer.create(
      React.createElement(
        "main",
        {
          id: "root"
        },
        React.createElement("section", {
          id: "first",
          role: "dup",
          className: "matched"
        }),
        React.createElement("section", {
          id: "second",
          role: "dup",
          className: "matched"
        }),
        React.createElement("article", {
          id: "single",
          role: "solo"
        })
      )
    );
  });
  return renderer;
}

function createRendererWithElement(TestRenderer, element) {
  let renderer;
  TestRenderer.act(() => {
    renderer = TestRenderer.create(element);
  });
  return summarizeRenderer(renderer);
}

function updateFreshRenderer({ React, TestRenderer, nextElement }) {
  let renderer;
  TestRenderer.act(() => {
    renderer = TestRenderer.create(React.createElement("main"));
  });
  TestRenderer.act(() => {
    renderer.update(nextElement);
  });
  return summarizeRenderer(renderer);
}

function summarizeRenderer(renderer) {
  return {
    json: describeValue(renderer.toJSON()),
    tree: describeValue(renderer.toTree()),
    root: captureOperation("renderer.root", () =>
      describeTestInstance(renderer.root)
    )
  };
}

function matchesNothing(instance) { return instance.props.id === "missing"; }
function matchesDuplicateRole(instance) { return instance.props.role === "dup"; }
function matchesEverything() { return true; }

function captureOperation(label, fn) {
  try {
    return {
      label,
      status: "ok",
      value: describeValue(fn())
    };
  } catch (error) {
    return {
      label,
      status: "throws",
      ...describeThrown(error)
    };
  }
}

function captureScenarioOperation(label, fn) {
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
      ...describeThrown(error)
    };
  }
}

function describeThrown(error) {
  return {
    name: error?.name ?? null,
    constructorName: error?.constructor?.name ?? null,
    message: String(error?.message ?? ""),
    code:
      error && Object.hasOwn(error, "code")
        ? describeValue(error.code)
        : null,
    errors: Array.isArray(error?.errors)
      ? error.errors.map((child) => describeThrown(child))
      : null
  };
}

function describeTestInstance(instance) {
  return {
    kind: "ReactTestInstance",
    type: describeElementType(instance.type),
    props: describeProps(instance.props),
    childCount: instance.children.length
  };
}

function describeElementType(type) {
  if (typeof type === "string") {
    return {
      kind: "host",
      value: type
    };
  }
  return describeValue(type);
}

function describeProps(props) {
  const result = {};
  for (const key of Object.keys(props).sort()) {
    if (key === "children") {
      result[key] = describeChildrenProp(props[key]);
    } else {
      result[key] = describeValue(props[key]);
    }
  }
  return result;
}

function describeChildrenProp(children) {
  if (Array.isArray(children)) {
    return {
      kind: "array",
      length: children.length,
      elementTypes: children.map((child) =>
        child && typeof child === "object"
          ? describeElementType(child.type)
          : describeValue(child)
      )
    };
  }
  return describeValue(children);
}

function describeFunction(value) {
  return {
    type: "function",
    name: value.name,
    length: value.length,
    ownPropertyNames: Object.getOwnPropertyNames(value).sort(),
    hasOwnPrototype: Object.hasOwn(value, "prototype")
  };
}

function describeValue(value) {
  if (value === null) {
    return {
      type: "null"
    };
  }

  if (value === undefined) {
    return {
      type: "undefined"
    };
  }

  if (typeof value === "string") {
    return {
      type: "string",
      value
    };
  }

  if (typeof value === "number") {
    return {
      type: "number",
      value: Number.isNaN(value) ? "NaN" : value
    };
  }

  if (typeof value === "boolean") {
    return {
      type: "boolean",
      value
    };
  }

  if (typeof value === "bigint") {
    return {
      type: "bigint",
      value: value.toString()
    };
  }

  if (typeof value === "symbol") {
    return {
      type: "symbol",
      keyFor: Symbol.keyFor(value) ?? null,
      description: value.description ?? null,
      stringValue: String(value)
    };
  }

  if (typeof value === "function") {
    return describeFunction(value);
  }

  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length,
      items: value.map((item) => describeValue(item))
    };
  }

  if (isReactTestJson(value)) {
    return {
      type: "react-test-json",
      nodeType: value.type,
      props: describePlainObject(value.props),
      children: describeValue(value.children)
    };
  }

  if (isReactTestTree(value)) {
    return {
      type: "react-test-tree",
      nodeType: describeElementType(value.type),
      props: describePlainObject(value.props),
      rendered: describeValue(value.rendered)
    };
  }

  if (isReactTestInstance(value)) {
    return describeTestInstance(value);
  }

  return describePlainObject(value);
}

function describePlainObject(value) {
  const result = {
    type: "object",
    constructorName: value?.constructor?.name ?? null,
    entries: {}
  };

  for (const key of Object.keys(value).sort()) {
    result.entries[key] = describeValue(value[key]);
  }

  return result;
}

function isReactTestJson(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.type === "string" &&
    Object.hasOwn(value, "props") &&
    Object.hasOwn(value, "children") &&
    !Object.hasOwn(value, "nodeType")
  );
}

function isReactTestTree(value) {
  return (
    value &&
    typeof value === "object" &&
    Object.hasOwn(value, "nodeType") &&
    Object.hasOwn(value, "rendered")
  );
}

function isReactTestInstance(value) {
  return (
    value &&
    typeof value === "object" &&
    value.constructor?.name === "ReactTestInstance" &&
    Object.hasOwn(value, "_fiber")
  );
}

main();
