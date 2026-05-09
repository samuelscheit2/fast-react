import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const modeId = process.argv[3];
const scenarioId = process.argv[4];

if (!targetPackage || !modeId || !scenarioId) {
  throw new Error(
    "Usage: node react-test-renderer-serialization-probe-runner.mjs <package> <mode-id> <scenario>"
  );
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

const React = require("react");
const TestRenderer = require("react-test-renderer");

const scenarios = {
  "host-tree-json-and-tree": async () => {
    const element = React.createElement(
      "div",
      {
        id: "host-root",
        foo: "bar"
      },
      "hello",
      React.createElement(
        "span",
        {
          className: "nested"
        },
        "world"
      )
    );
    const mounted = await mountRenderer(element);
    const json = mounted.renderer.toJSON();

    return {
      mountStrategy: mounted.mountStrategy,
      serialization: captureSerialization(mounted.renderer),
      jsonOwnKeys: Reflect.ownKeys(json).map(describePropertyKey),
      jsonBrand: describeValue(json.$$typeof),
      jsonPropsOwnKeys: Object.keys(json.props),
      jsonPropsHasChildren: Object.hasOwn(json.props, "children"),
      rootSummary: captureOperation("root", () =>
        describeTestInstance(mounted.renderer.root)
      )
    };
  },

  "text-root-json-and-tree": async () => {
    const mounted = await mountRenderer("hello text root");

    return {
      mountStrategy: mounted.mountStrategy,
      serialization: captureSerialization(mounted.renderer),
      rootValue: captureOperation("root", () =>
        describeValue(mounted.renderer.root)
      )
    };
  },

  "empty-root-nullish-output": async () => {
    const nullMounted = await mountRenderer(null);
    const falseMounted = await mountRenderer(false);

    return {
      mountStrategy: nullMounted.mountStrategy,
      nullRoot: {
        serialization: captureSerialization(nullMounted.renderer),
        rootAccess: captureOperation("root", () =>
          describeValue(nullMounted.renderer.root)
        )
      },
      falseRoot: {
        serialization: captureSerialization(falseMounted.renderer),
        rootAccess: captureOperation("root", () =>
          describeValue(falseMounted.renderer.root)
        )
      }
    };
  },

  "array-root-json-and-tree": async () => {
    const mounted = await mountRenderer([
      React.createElement("a", { key: "a", href: "#a" }, "A"),
      "plain text",
      React.createElement("b", { key: "b" }, "B")
    ]);

    return {
      mountStrategy: mounted.mountStrategy,
      serialization: captureSerialization(mounted.renderer),
      rootSummary: captureOperation("root", () =>
        describeTestInstance(mounted.renderer.root)
      )
    };
  },

  "activity-hidden-json-and-tree": async () => {
    const mounted = await mountRenderer(
      React.createElement(
        "main",
        null,
        React.createElement(
          React.Activity,
          { mode: "hidden" },
          React.createElement("span", { id: "hidden-child" }, "hidden")
        ),
        React.createElement(
          React.Activity,
          { mode: "visible" },
          React.createElement("span", { id: "visible-child" }, "visible")
        )
      )
    );

    return {
      mountStrategy: mounted.mountStrategy,
      serialization: captureSerialization(mounted.renderer),
      hiddenMatches: mounted.renderer.root
        .findAllByProps({ id: "hidden-child" })
        .map(describeTestInstance),
      visibleMatches: mounted.renderer.root
        .findAllByProps({ id: "visible-child" })
        .map(describeTestInstance),
      rootChildren: mounted.renderer.root.children.map(describeChild)
    };
  },

  "composite-to-tree": async () => {
    function FunctionComposite(props) {
      return React.createElement(
        "section",
        { id: "composite-output" },
        props.children
      );
    }

    const mounted = await mountRenderer(
      React.createElement(
        FunctionComposite,
        { label: "composite-label" },
        React.createElement("strong", null, "child")
      )
    );

    return {
      mountStrategy: mounted.mountStrategy,
      serialization: captureSerialization(mounted.renderer),
      rootSummary: captureOperation("root", () =>
        describeTestInstance(mounted.renderer.root)
      ),
      sectionMatches: mounted.renderer.root
        .findAllByType("section")
        .map(describeTestInstance)
    };
  },

  "test-instance-find-basics": async () => {
    function Item(props) {
      return React.createElement("li", props, props.children);
    }

    const mounted = await mountRenderer(
      React.createElement(
        "ul",
        { id: "list-root" },
        React.createElement(Item, { kind: "target" }, "A"),
        React.createElement("li", { kind: "other" }, "B"),
        React.createElement("li", { kind: "other" }, "C")
      )
    );
    const root = mounted.renderer.root;

    return {
      mountStrategy: mounted.mountStrategy,
      rootSummary: describeTestInstance(root),
      findTarget: captureOperation("find target", () =>
        describeTestInstance(root.find((node) => node.props.kind === "target"))
      ),
      findZero: captureOperation("find zero", () =>
        describeTestInstance(root.find((node) => node.props.kind === "missing"))
      ),
      findMultiple: captureOperation("find multiple", () =>
        describeTestInstance(root.find((node) => node.type === "li"))
      ),
      findAllLiKinds: root
        .findAll((node) => node.type === "li")
        .map((node) => node.props.kind ?? null),
      findAllLiDeepFalseKinds: root
        .findAll((node) => node.type === "li", { deep: false })
        .map((node) => node.props.kind ?? null),
      findByTypeItem: captureOperation("findByType Item", () =>
        describeTestInstance(root.findByType(Item))
      ),
      findAllByTypeLiCount: root.findAllByType("li").length,
      findByPropsRoot: captureOperation("findByProps root", () =>
        describeTestInstance(root.findByProps({ id: "list-root" }))
      ),
      findAllByPropsOtherCount: root.findAllByProps({ kind: "other" }).length,
      findByPropsOtherMultiple: captureOperation(
        "findByProps multiple",
        () => describeTestInstance(root.findByProps({ kind: "other" }))
      )
    };
  }
};

async function mountRenderer(element) {
  if (typeof TestRenderer.act === "function") {
    let renderer;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(element);
    });
    return {
      mountStrategy: "act-create",
      renderer
    };
  }

  const renderer = TestRenderer.create(null);
  renderer.unstable_flushSync(() => {
    renderer.update(element);
  });

  return {
    mountStrategy: "create-null-then-unstable-flush-sync-update",
    renderer
  };
}

function captureSerialization(renderer) {
  return {
    rendererOwnKeys: Object.keys(renderer),
    toJSON: captureOperation("toJSON", () => describeValue(renderer.toJSON())),
    toTree: captureOperation("toTree", () => describeValue(renderer.toTree())),
    getInstance: captureOperation("getInstance", () =>
      describeValue(renderer.getInstance())
    )
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
      error: describeError(error)
    };
  }
}

function describeTestInstance(instance) {
  if (!isTestInstance(instance)) {
    return describeValue(instance);
  }

  return {
    kind: "ReactTestInstance",
    type: describeType(instance.type),
    props: describeValue(instance.props),
    parent: instance.parent ? describeInstanceRef(instance.parent) : null,
    children: instance.children.map(describeChild)
  };
}

function describeInstanceRef(instance) {
  if (!isTestInstance(instance)) {
    return describeValue(instance);
  }

  return {
    kind: "ReactTestInstance",
    type: describeType(instance.type),
    props: describeValue(instance.props)
  };
}

function describeChild(child) {
  if (isTestInstance(child)) {
    return describeInstanceRef(child);
  }

  return describeValue(child);
}

function isTestInstance(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.find === "function" &&
    typeof value.findAll === "function" &&
    "type" in value &&
    "props" in value &&
    "children" in value
  );
}

function describeType(type) {
  if (typeof type === "string" || type === null) {
    return type;
  }

  return describeValue(type);
}

function describeValue(value, seen = new WeakSet()) {
  if (value === null) {
    return null;
  }

  if (value === undefined) {
    return {
      kind: "undefined"
    };
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "bigint") {
    return {
      kind: "bigint",
      value: value.toString()
    };
  }

  if (typeof value === "symbol") {
    return {
      kind: "symbol",
      key: Symbol.keyFor(value),
      description: value.description ?? null,
      string: String(value)
    };
  }

  if (typeof value === "function") {
    return {
      kind: "function",
      name: value.name,
      displayName: value.displayName ?? null,
      length: value.length
    };
  }

  if (value instanceof Error) {
    return describeError(value);
  }

  if (Array.isArray(value)) {
    seen.add(value);
    try {
      return value.map((child) => describeValue(child, seen));
    } finally {
      seen.delete(value);
    }
  }

  if (seen.has(value)) {
    return {
      kind: "circular"
    };
  }
  seen.add(value);
  try {
    const normalized = {};
    for (const key of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor?.enumerable) {
        continue;
      }
      normalized[describeObjectKey(key)] = describeValue(value[key], seen);
    }
    return normalized;
  } finally {
    seen.delete(value);
  }
}

function describePropertyKey(key) {
  if (typeof key === "symbol") {
    return {
      kind: "symbol",
      key: Symbol.keyFor(key),
      description: key.description ?? null,
      string: String(key)
    };
  }

  return {
    kind: "string",
    value: key
  };
}

function describeObjectKey(key) {
  if (typeof key === "symbol") {
    return `[symbol:${Symbol.keyFor(key) ?? key.description ?? String(key)}]`;
  }

  return key;
}

function describeError(error) {
  return {
    name: error?.name ?? null,
    message: normalizeFunctionSourceInErrorMessage(error?.message ?? ""),
    code: error?.code ?? null
  };
}

function normalizeFunctionSourceInErrorMessage(message) {
  return message.replace(/\s+/gu, " ").trim();
}

try {
  const scenario = scenarios[scenarioId];
  if (!scenario) {
    throw new Error(
      `Unknown react-test-renderer serialization scenario: ${scenarioId}`
    );
  }

  const result = await scenario();
  process.stdout.write(
    JSON.stringify({
      targetPackage,
      modeId,
      scenarioId,
      mountStrategy: result.mountStrategy,
      result,
      consoleCalls
    })
  );
} finally {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
}
