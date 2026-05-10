import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
const reactPackageRoot = path.join(repoRoot, "packages", "react");
const React = require(path.join(reactPackageRoot, "index.js"));
const ReactServer = require(path.join(reactPackageRoot, "react.react-server.js"));
const Transition = require(path.join(reactPackageRoot, "transition.js"));

function withCapturedGlobalErrors(callback) {
  const hadReportError = Object.hasOwn(globalThis, "reportError");
  const originalReportError = globalThis.reportError;
  const errors = [];

  Object.defineProperty(globalThis, "reportError", {
    configurable: true,
    value(error) {
      errors.push(error);
    },
    writable: true
  });

  try {
    return {
      errors,
      value: callback()
    };
  } finally {
    if (hadReportError) {
      Object.defineProperty(globalThis, "reportError", {
        configurable: true,
        value: originalReportError,
        writable: true
      });
    } else {
      delete globalThis.reportError;
    }
  }
}

test("React startTransition export has the React 19.2.6 CommonJS shape", () => {
  const descriptor = Object.getOwnPropertyDescriptor(React, "startTransition");

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
  assert.equal(typeof React.startTransition, "function");
  assert.equal(React.startTransition.name, "");
  assert.equal(React.startTransition.length, 1);
  assert.equal(React.startTransition, Transition.startTransition);
  assert.equal(Object.hasOwn(ReactServer, "startTransition"), false);
});

test("startTransition runs a valid scope synchronously and returns undefined", () => {
  const observations = [];

  const result = React.startTransition(() => {
    observations.push("scope-start");
    observations.push(Transition.isTransitionBatchActive());
    return "ignored";
  });

  observations.push("after-call");

  assert.equal(result, undefined);
  assert.deepEqual(observations, ["scope-start", true, "after-call"]);
  assert.equal(Transition.isTransitionBatchActive(), false);
});

test("nested startTransition calls keep the transition marker active until the outer scope exits", () => {
  const observations = [];

  React.startTransition(() => {
    observations.push(Transition.isTransitionBatchActive());
    React.startTransition(() => {
      observations.push(Transition.isTransitionBatchActive());
    });
    observations.push(Transition.isTransitionBatchActive());
  });
  observations.push(Transition.isTransitionBatchActive());

  assert.deepEqual(observations, [true, true, true, false]);
});

test("startTransition reports the original thrown scope error and restores the marker", () => {
  const thrown = new Error("transition scope failed");

  const observation = withCapturedGlobalErrors(() =>
    React.startTransition(() => {
      assert.equal(Transition.isTransitionBatchActive(), true);
      throw thrown;
    })
  );

  assert.equal(observation.value, undefined);
  assert.deepEqual(observation.errors, [thrown]);
  assert.equal(Transition.isTransitionBatchActive(), false);
});

test("startTransition reports non-function scope input with the observed React TypeError", () => {
  for (const scope of [undefined, null, 42, "not a function", {}]) {
    const observation = withCapturedGlobalErrors(() =>
      React.startTransition(scope)
    );

    assert.equal(observation.value, undefined);
    assert.equal(observation.errors.length, 1);
    assert.equal(observation.errors[0].name, "TypeError");
    assert.equal(observation.errors[0].message, "scope is not a function");
    assert.equal(Transition.isTransitionBatchActive(), false);
  }
});
