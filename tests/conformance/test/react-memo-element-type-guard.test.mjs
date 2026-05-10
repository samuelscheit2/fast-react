import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
const reactPackageRoot = path.join(repoRoot, "packages", "react");
const reactEntryPath = path.join(reactPackageRoot, "index.js");
const elementTypePath = path.join(reactPackageRoot, "element-type.js");
const memoWarning =
  "memo: The first argument must be a component. Instead received: %s";

test("isValidElementType accepts package-modeled React element types", () => {
  const { React, isValidElementType } = loadReactWithElementType("development");
  function Component() {}

  const context = React.createContext("default");
  const forwardRefType = React.forwardRef(function Render() {});
  const lazyType = React.lazy(function loadComponent() {});
  const memoType = React.memo(Component);
  const clientReference = {
    $$typeof: Symbol.for("react.client.reference")
  };
  const moduleReference = {
    getModuleId() {
      return "module";
    }
  };

  for (const validType of [
    "div",
    Component,
    React.Fragment,
    React.Profiler,
    React.StrictMode,
    React.Suspense,
    React.Activity,
    Symbol.for("react.suspense_list"),
    context,
    context.Consumer,
    forwardRefType,
    lazyType,
    memoType,
    clientReference,
    moduleReference
  ]) {
    assert.equal(isValidElementType(validType), true);
  }

  for (const invalidType of [
    null,
    undefined,
    42,
    false,
    {},
    [],
    new String("div"),
    Symbol("component"),
    {
      $$typeof: Symbol.for("react.transitional.element"),
      type: "div",
      props: {}
    }
  ]) {
    assert.equal(isValidElementType(invalidType), false);
  }
});

test("memo development validation accepts valid element types without warning", () => {
  const React = loadReact("development");
  function Component() {}

  const context = React.createContext("default");
  const validTypes = [
    "div",
    Component,
    React.Fragment,
    React.Profiler,
    React.StrictMode,
    React.Suspense,
    React.Activity,
    Symbol.for("react.suspense_list"),
    context,
    context.Consumer,
    React.forwardRef(function Render() {}),
    React.lazy(function loadComponent() {}),
    React.memo(Component),
    {
      $$typeof: Symbol.for("react.client.reference")
    },
    {
      getModuleId() {
        return "module";
      }
    }
  ];

  const { calls } = captureConsoleErrors(() => {
    for (const validType of validTypes) {
      React.memo(validType);
    }
  });

  assert.deepEqual(calls, []);
});

test("memo development validation warns for invalid non-null element types", () => {
  const React = loadReact("development");
  const invalidTypes = [
    {},
    [],
    new String("div"),
    {
      $$typeof: Symbol.for("react.transitional.element"),
      type: "div",
      props: {}
    },
    42,
    Symbol("component")
  ];

  const { calls } = captureConsoleErrors(() => {
    for (const invalidType of invalidTypes) {
      React.memo(invalidType);
    }
  });

  assert.deepEqual(calls, [
    [memoWarning, "object"],
    [memoWarning, "object"],
    [memoWarning, "object"],
    [memoWarning, "object"],
    [memoWarning, "number"],
    [memoWarning, "symbol"]
  ]);
});

test("memo nullish diagnostics and production warning behavior are unchanged", () => {
  const ReactDevelopment = loadReact("development");
  const development = captureConsoleErrors(() => {
    ReactDevelopment.memo(null);
    ReactDevelopment.memo(undefined);
  });

  assert.deepEqual(development.calls, [
    [memoWarning, "null"],
    [memoWarning, "undefined"]
  ]);

  const ReactProduction = loadReact("production");
  const production = captureConsoleErrors(() => {
    ReactProduction.memo({});
    ReactProduction.memo(null);
  });

  assert.deepEqual(production.calls, []);
});

test("memo wrapper object shape is preserved across environments", () => {
  function Component() {}

  const ReactDevelopment = loadReact("development");
  const developmentMemo = ReactDevelopment.memo(Component, undefined);
  assertMemoShape(developmentMemo, {
    compare: null,
    ownKeys: ["$$typeof", "type", "compare", "displayName"]
  });
  const displayNameDescriptor = Object.getOwnPropertyDescriptor(
    developmentMemo,
    "displayName"
  );
  assert.equal(displayNameDescriptor.enumerable, false);
  assert.equal(displayNameDescriptor.configurable, true);
  assert.equal(typeof displayNameDescriptor.get, "function");
  assert.equal(typeof displayNameDescriptor.set, "function");

  const ReactProduction = loadReact("production");
  const compare = () => true;
  const productionMemo = ReactProduction.memo(Component, compare);
  assertMemoShape(productionMemo, {
    compare,
    ownKeys: ["$$typeof", "type", "compare"]
  });
  assert.equal(Object.hasOwn(productionMemo, "displayName"), false);
});

function assertMemoShape(memoType, expectation) {
  assert.deepEqual(Object.keys(memoType), ["$$typeof", "type", "compare"]);
  assert.deepEqual(Reflect.ownKeys(memoType), expectation.ownKeys);
  assert.equal(memoType.$$typeof, Symbol.for("react.memo"));
  assert.equal(memoType.compare, expectation.compare);
  assert.equal(Object.isFrozen(memoType), false);
  assert.equal(Object.isSealed(memoType), false);
  assert.equal(Object.isExtensible(memoType), true);
  assert.equal(Object.getPrototypeOf(memoType), Object.prototype);

  const descriptors = Object.getOwnPropertyDescriptors(memoType);
  for (const key of ["$$typeof", "type", "compare"]) {
    const descriptor = descriptors[key];
    assert.deepEqual(
      {
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,
        writable: descriptor.writable
      },
      {
        configurable: true,
        enumerable: true,
        writable: true
      }
    );
  }
}

function loadReactWithElementType(nodeEnv) {
  const React = loadReact(nodeEnv);
  return {
    React,
    isValidElementType: require(elementTypePath).isValidElementType
  };
}

function loadReact(nodeEnv) {
  const hadNodeEnv = Object.hasOwn(process.env, "NODE_ENV");
  const previousNodeEnv = process.env.NODE_ENV;
  clearReactModuleCache();
  process.env.NODE_ENV = nodeEnv;

  try {
    return require(reactEntryPath);
  } finally {
    if (hadNodeEnv) {
      process.env.NODE_ENV = previousNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  }
}

function clearReactModuleCache() {
  const packagePrefix = reactPackageRoot + path.sep;
  for (const cachePath of Object.keys(require.cache)) {
    if (cachePath === reactPackageRoot || cachePath.startsWith(packagePrefix)) {
      delete require.cache[cachePath];
    }
  }
}

function captureConsoleErrors(callback) {
  const originalError = console.error;
  const calls = [];
  console.error = (...args) => {
    calls.push(args);
  };

  try {
    return {
      calls,
      value: callback()
    };
  } finally {
    console.error = originalError;
  }
}
