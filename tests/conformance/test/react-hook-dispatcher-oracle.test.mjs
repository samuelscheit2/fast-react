import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
const reactPackageRoot = path.join(repoRoot, "packages", "react");
const React = require(path.join(reactPackageRoot, "index.js"));
const hookDispatcher = require(path.join(
  reactPackageRoot,
  "hook-dispatcher.js"
));

const expectedTransitionHookNames = ["useDeferredValue", "useTransition"];
const expectedPublicShapeBlockerFields = [
  "hookName",
  "expectedName",
  "expectedLength",
  "currentPublicExport",
  "blocker"
];
const expectedPublicShapeBlockers = [
  {
    hookName: "useDeferredValue",
    expectedName: "",
    expectedLength: 2,
    currentPublicExport: "react.useDeferredValue placeholder",
    blocker:
      "public export remains a createUnimplementedFunction placeholder until deferred value scheduling is admitted"
  },
  {
    hookName: "useTransition",
    expectedName: "",
    expectedLength: 0,
    currentPublicExport: "react.useTransition placeholder",
    blocker:
      "public export remains a createUnimplementedFunction placeholder until transition scheduling is admitted"
  }
];
const expectedMissingSchedulerPrerequisites = [
  "getCurrentUpdatePriority",
  "setCurrentUpdatePriority",
  "higherEventPriority",
  "requestUpdateLane",
  "requestDeferredLane",
  "dispatchOptimisticSetState",
  "dispatchSetStateInternal",
  "markSkippedUpdateLanes",
  "useThenable"
];
const expectedMissingRootLanePrerequisites = [
  "LaneClaimers.claim_next_transition_update_lane",
  "LaneClaimers.claim_next_transition_deferred_lane",
  "RootLaneState.mark_updated",
  "RootLaneState.mark_entangled",
  "UpdateQueueStore.entangle_transition_update"
];
const expectedCompatibilityFalseFlags = [
  "compatibilityClaimed",
  "exposesPublicHookImplementation",
  "rendererIntegration",
  "schedulerIntegration",
  "rootLaneIntegration",
  "schedulesTransitionUpdates",
  "schedulesDeferredValueUpdates",
  "executesTransitionCallbacks",
  "returnsPendingState",
  "readsThenables"
];

test.afterEach(() => {
  hookDispatcher.ReactCurrentDispatcher.current = null;
});

test("private transition-hook dispatcher blockers record public shape and lane prerequisites", () => {
  const metadata = hookDispatcher.privateTransitionHookDispatcherMetadata;

  assert.equal(
    metadata.capability,
    "fast-react.private.transition_hook_dispatcher_blockers"
  );
  assert.equal(metadata.compatibilityTarget, "react@19.2.6");
  assert.deepEqual(metadata.hookNames, expectedTransitionHookNames);
  assert.deepEqual(
    metadata.publicShapeBlockerFields,
    expectedPublicShapeBlockerFields
  );
  assert.deepEqual(metadata.publicShapeBlockers, expectedPublicShapeBlockers);
  assert.deepEqual(
    metadata.missingSchedulerPrerequisites,
    expectedMissingSchedulerPrerequisites
  );
  assert.deepEqual(
    metadata.missingRootLanePrerequisites,
    expectedMissingRootLanePrerequisites
  );
  assert.deepEqual(
    metadata.compatibilityFalseFlags,
    expectedCompatibilityFalseFlags
  );

  for (const flagName of expectedCompatibilityFalseFlags) {
    assert.equal(metadata[flagName], false, flagName);
  }

  assert.deepEqual(
    hookDispatcher.transitionHookNames,
    expectedTransitionHookNames
  );
  assert.equal(
    hookDispatcher.isPrivateTransitionHookDispatcherMetadata(metadata),
    true
  );
  assert.equal(Object.isFrozen(metadata), true);

  for (const value of Object.values(metadata)) {
    if (Array.isArray(value)) {
      assert.equal(Object.isFrozen(value), true);
      for (const item of value) {
        if (item !== null && typeof item === "object") {
          assert.equal(Object.isFrozen(item), true);
        }
      }
    }
  }

  assert.equal(React.privateTransitionHookDispatcherMetadata, undefined);
  assert.equal(React.markPrivateTransitionHookDispatcher, undefined);
});

test("public transition hooks remain placeholder-blocked and do not call an installed dispatcher", () => {
  const calls = [];
  const dispatcher = {
    useDeferredValue(value, initialValue) {
      calls.push(["useDeferredValue", value, initialValue]);
      return value;
    },
    useTransition() {
      calls.push(["useTransition"]);
      return [false, () => calls.push(["startTransition"])];
    }
  };

  hookDispatcher.ReactCurrentDispatcher.current = dispatcher;

  assert.equal(React.useDeferredValue.name, "useDeferredValue");
  assert.equal(React.useDeferredValue.length, 0);
  assert.equal(React.useTransition.name, "useTransition");
  assert.equal(React.useTransition.length, 0);
  assertUnimplemented(() => React.useDeferredValue("next", "initial"), {
    exportName: "useDeferredValue"
  });
  assertUnimplemented(() => React.useTransition(), {
    exportName: "useTransition"
  });
  assert.deepEqual(calls, []);
});

test("private transition-hook dispatcher marker rejects blocker metadata drift", () => {
  const calls = [];
  const dispatcher = {
    useDeferredValue(value) {
      calls.push(["useDeferredValue", value]);
      return value;
    },
    useTransition() {
      calls.push(["useTransition"]);
      return [false, () => calls.push(["startTransition"])];
    }
  };
  const driftedMetadata = {
    ...hookDispatcher.privateTransitionHookDispatcherMetadata,
    missingSchedulerPrerequisites: ["requestUpdateLane"]
  };

  assert.equal(
    hookDispatcher.isPrivateTransitionHookDispatcherMetadata(driftedMetadata),
    false
  );
  assertInvalidHookCall(
    () =>
      hookDispatcher.markPrivateTransitionHookDispatcher(
        dispatcher,
        driftedMetadata
      ),
    "useTransition"
  );
  assert.equal(
    hookDispatcher.isPrivateTransitionHookDispatcher(dispatcher),
    false
  );
  assert.deepEqual(calls, []);
});

test("private transition-hook dispatcher marker records diagnostics without executing hooks", () => {
  const calls = [];
  const metadata = hookDispatcher.privateTransitionHookDispatcherMetadata;
  const dispatcher = {
    useDeferredValue(value, initialValue, receivedMetadata) {
      calls.push(["useDeferredValue", value, initialValue, receivedMetadata]);
      return value;
    },
    useTransition(receivedMetadata) {
      calls.push(["useTransition", receivedMetadata]);
      return [false, () => calls.push(["startTransition"])];
    }
  };

  assert.equal(
    hookDispatcher.markPrivateTransitionHookDispatcher(dispatcher, metadata),
    dispatcher
  );
  assert.equal(
    hookDispatcher.isPrivateTransitionHookDispatcher(dispatcher),
    true
  );
  assert.equal(
    hookDispatcher.getPrivateTransitionHookDispatcherMetadata(dispatcher),
    metadata
  );
  assert.deepEqual(calls, []);
});

function assertUnimplemented(callback, { exportName }) {
  assert.throws(
    callback,
    (error) => {
      assert.equal(error.name, "FastReactUnimplementedError", exportName);
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", exportName);
      assert.equal(error.entrypoint, "react", exportName);
      assert.equal(error.exportName, exportName, exportName);
      assert.equal(error.compatibilityTarget, "react@19.2.6", exportName);
      assert.match(
        error.message,
        /no React behavior implementation yet/u,
        exportName
      );
      return true;
    },
    exportName
  );
}

function assertInvalidHookCall(callback, label) {
  assert.throws(
    callback,
    (error) => {
      assert.equal(error.name, "Error", label);
      assert.equal(error.code, "FAST_REACT_INVALID_HOOK_CALL", label);
      assert.match(error.message, /Invalid hook call/u, label);
      assert.match(
        error.message,
        /Hooks can only be called inside of the body of a function component/u,
        label
      );
      return true;
    },
    label
  );
}
