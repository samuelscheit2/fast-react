import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

const expectedStartTransitionRootlessCurrentnessFieldNames = [
  "apiName",
  "compatibilityTarget",
  "currentPublicExport",
  "rootlessFacade",
  "transitionScopeExecution",
  "errorChannel",
  "restoresPreviousDepth",
  "restoresPreviousDepthAfterThrow",
  "schedulerIntegration",
  "rootLaneIntegration",
  "rootScheduling",
  "rootExecution",
  "dispatcherRouting",
  "schedulerCallbackExecution",
  "compatibilityClaimed",
  "blocker"
];
const expectedStartTransitionRootlessCurrentness = {
  apiName: "startTransition",
  compatibilityTarget: "react@19.2.6",
  currentPublicExport: "react.startTransition facade",
  rootlessFacade: true,
  transitionScopeExecution: "synchronous",
  errorChannel: "global-report-error",
  restoresPreviousDepth: true,
  restoresPreviousDepthAfterThrow: true,
  schedulerIntegration: false,
  rootLaneIntegration: false,
  rootScheduling: false,
  rootExecution: false,
  dispatcherRouting: false,
  schedulerCallbackExecution: false,
  compatibilityClaimed: false,
  blocker:
    "startTransition remains a rootless facade until scheduler and root-lane integration are admitted"
};

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

test("startTransition rootless currentness metadata keeps scheduler and root work blocked", () => {
  const metadata = Transition.startTransitionRootlessCurrentness;

  assert.deepEqual(
    Transition.startTransitionRootlessCurrentnessFieldNames,
    expectedStartTransitionRootlessCurrentnessFieldNames
  );
  assert.deepEqual(metadata, expectedStartTransitionRootlessCurrentness);
  assert.equal(Object.isFrozen(metadata), true);
  assert.equal(
    Object.isFrozen(Transition.startTransitionRootlessCurrentnessFieldNames),
    true
  );
  assert.equal(metadata.rootlessFacade, true);
  assert.equal(metadata.schedulerIntegration, false);
  assert.equal(metadata.rootLaneIntegration, false);
  assert.equal(metadata.rootScheduling, false);
  assert.equal(metadata.rootExecution, false);
  assert.equal(metadata.dispatcherRouting, false);
  assert.equal(metadata.schedulerCallbackExecution, false);
  assert.equal(metadata.compatibilityClaimed, false);
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

test("startTransition callback error handling restores nested depth to the current outer scope", () => {
  const thrown = new Error("inner transition scope failed");
  const observations = [];

  const observation = withCapturedGlobalErrors(() =>
    React.startTransition(() => {
      observations.push([
        "outer-before-inner",
        Transition.isTransitionBatchActive()
      ]);
      React.startTransition(() => {
        observations.push([
          "inner-before-throw",
          Transition.isTransitionBatchActive()
        ]);
        throw thrown;
      });
      observations.push([
        "outer-after-inner",
        Transition.isTransitionBatchActive()
      ]);
    })
  );

  assert.equal(observation.value, undefined);
  assert.deepEqual(observation.errors, [thrown]);
  assert.deepEqual(observations, [
    ["outer-before-inner", true],
    ["inner-before-throw", true],
    ["outer-after-inner", true]
  ]);
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

test("startTransition facade source stays rootless and scheduler-free", () => {
  const source = readFileSync(
    path.join(reactPackageRoot, "transition.js"),
    "utf8"
  );

  assert.equal(source.includes("react-dom"), false);
  assert.equal(source.includes("root-bridge"), false);
  assert.equal(source.includes("root_scheduler"), false);
  assert.equal(source.includes("scheduleUpdate"), false);
  assert.equal(source.includes("requestUpdateLane"), false);
  assert.equal(source.includes("requestDeferredLane"), false);
  assert.equal(source.includes("markRootUpdated"), false);
});
