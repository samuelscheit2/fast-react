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
const expectedStartTransitionPublicRoutingBlockerFields = [
  "apiName",
  "currentPublicExport",
  "blocker"
];
const expectedStartTransitionPublicRoutingBlocker = {
  apiName: "startTransition",
  currentPublicExport: "react.startTransition facade",
  blocker:
    "public startTransition does not route through the hook dispatcher, request transition lanes, or schedule root work until transition execution is admitted"
};
const expectedTransitionActionIdentityFieldNames = [
  "action",
  "actionName",
  "actionLength"
];
const expectedTransitionLaneMetadataFieldNames = [
  "laneChoiceRecord",
  "laneChoiceSourcePriority",
  "transitionUpdateLaneClaim",
  "transitionDeferredLaneClaim",
  "scheduleUpdateRecord",
  "entanglementRecord",
  "pendingLanesBeforeEnqueueField",
  "pendingLanesAfterEnqueueField",
  "selectedNextLanesField"
];
const expectedTransitionLaneMetadata = {
  laneChoiceRecord: "RootUpdateLaneChoiceRecord",
  laneChoiceSourcePriority: "RootUpdateLaneSourcePriority::TransitionLane",
  transitionUpdateLaneClaim: "LaneClaimers.claim_next_transition_update_lane",
  transitionDeferredLaneClaim:
    "LaneClaimers.claim_next_transition_deferred_lane",
  scheduleUpdateRecord: "RootScheduleUpdateRecord",
  entanglementRecord: "RootTransitionEntanglementRecord",
  pendingLanesBeforeEnqueueField:
    "UpdateContainerResult.pending_lanes_before_enqueue",
  pendingLanesAfterEnqueueField:
    "UpdateContainerResult.pending_lanes_after_enqueue",
  selectedNextLanesField: "UpdateContainerResult.selected_next_lanes"
};
const expectedTransitionPendingStateTupleFieldNames = [
  "tupleKind",
  "tupleLength",
  "pendingStateSlot",
  "startTransitionSlot",
  "initialPendingState",
  "optimisticPendingState",
  "finishedPendingState"
];
const expectedTransitionPendingStateTupleShape = {
  tupleKind: "useTransition",
  tupleLength: 2,
  pendingStateSlot: "isPending",
  startTransitionSlot: "startTransition",
  initialPendingState: false,
  optimisticPendingState: true,
  finishedPendingState: false
};
const expectedStartTransitionRoutingRecordFieldNames = [
  "dispatcher",
  "action",
  "actionName",
  "actionLength",
  "metadata",
  "laneMetadata",
  "pendingStateTupleShape",
  "schedulerExecutionBlocked",
  "rootSchedulingBlocked",
  "rootExecutionBlocked",
  "callbackExecutionBlocked",
  "publicStartTransitionDispatcherRouting",
  "compatibilityClaimed"
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
  "publicStartTransitionDispatcherRouting",
  "publicUseTransitionImplementation",
  "rendererIntegration",
  "schedulerIntegration",
  "rootLaneIntegration",
  "schedulerExecution",
  "rootScheduling",
  "rootExecution",
  "schedulesTransitionUpdates",
  "schedulesDeferredValueUpdates",
  "executesTransitionCallbacks",
  "returnsPendingState",
  "readsThenables"
];
const expectedAcceptedTransitionReconcilerRecords = [
  "RootUpdateLaneChoiceRecord",
  "RootUpdateLaneSourcePriority",
  "RootScheduleUpdateRecord",
  "RootTransitionEntanglementRecord",
  "UpdateContainerResult"
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
    metadata.startTransitionPublicRoutingBlockerFields,
    expectedStartTransitionPublicRoutingBlockerFields
  );
  assert.deepEqual(
    metadata.startTransitionPublicRoutingBlocker,
    expectedStartTransitionPublicRoutingBlocker
  );
  assert.deepEqual(
    metadata.transitionActionIdentityFieldNames,
    expectedTransitionActionIdentityFieldNames
  );
  assert.deepEqual(
    metadata.transitionLaneMetadataFieldNames,
    expectedTransitionLaneMetadataFieldNames
  );
  assert.deepEqual(
    metadata.transitionLaneMetadata,
    expectedTransitionLaneMetadata
  );
  assert.deepEqual(
    metadata.transitionPendingStateTupleFieldNames,
    expectedTransitionPendingStateTupleFieldNames
  );
  assert.deepEqual(
    metadata.transitionPendingStateTupleShape,
    expectedTransitionPendingStateTupleShape
  );
  assert.deepEqual(
    metadata.startTransitionRoutingRecordFieldNames,
    expectedStartTransitionRoutingRecordFieldNames
  );
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
  assert.deepEqual(
    metadata.acceptedReconcilerRecords,
    expectedAcceptedTransitionReconcilerRecords
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
  assert.equal(Object.isFrozen(metadata.startTransitionPublicRoutingBlocker), true);
  assert.equal(Object.isFrozen(metadata.transitionLaneMetadata), true);
  assert.equal(Object.isFrozen(metadata.transitionPendingStateTupleShape), true);

  assert.equal(React.privateTransitionHookDispatcherMetadata, undefined);
  assert.equal(React.markPrivateTransitionHookDispatcher, undefined);
  assert.equal(
    React.recordPrivateStartTransitionDispatcherRouting,
    undefined
  );
});

test("public transition hooks remain placeholder-blocked and do not call an installed dispatcher", () => {
  const calls = [];
  const publicStartTransitionCalls = [];
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
  React.startTransition(() => {
    publicStartTransitionCalls.push("scope");
  });
  assert.deepEqual(publicStartTransitionCalls, ["scope"]);
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

test("private startTransition routing rejects missing or unmarked dispatcher context", () => {
  const calls = [];
  const metadata = hookDispatcher.privateTransitionHookDispatcherMetadata;
  const transitionAction = () => calls.push(["transitionAction"]);

  assertInvalidHookCall(
    () =>
      hookDispatcher.recordPrivateStartTransitionDispatcherRouting(
        transitionAction,
        metadata
      ),
    "useTransition"
  );

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

  hookDispatcher.ReactCurrentDispatcher.current = dispatcher;

  assertInvalidHookCall(
    () =>
      hookDispatcher.recordPrivateStartTransitionDispatcherRouting(
        transitionAction,
        metadata
      ),
    "useTransition"
  );
  assert.deepEqual(calls, []);
});

test("private startTransition routing rejects stale transition metadata and unsupported callbacks", () => {
  const calls = [];
  const metadata = hookDispatcher.privateTransitionHookDispatcherMetadata;
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

  hookDispatcher.markPrivateTransitionHookDispatcher(dispatcher, metadata);
  hookDispatcher.ReactCurrentDispatcher.current = dispatcher;

  const driftedMetadata = {
    ...metadata,
    transitionLaneMetadata: {
      ...metadata.transitionLaneMetadata,
      laneChoiceSourcePriority: "RootUpdateLaneSourcePriority::DefaultEventPriority"
    }
  };

  assert.equal(
    hookDispatcher.isPrivateTransitionHookDispatcherMetadata(driftedMetadata),
    false
  );
  assertInvalidHookCall(
    () =>
      hookDispatcher.recordPrivateStartTransitionDispatcherRouting(
        () => calls.push(["transitionAction"]),
        driftedMetadata
      ),
    "useTransition"
  );

  for (const callback of [undefined, null, 42, "scope", {}, { then() {} }]) {
    assertUnsupportedTransitionCallback(
      () =>
        hookDispatcher.recordPrivateStartTransitionDispatcherRouting(
          callback,
          metadata
        ),
      "startTransition"
    );
  }

  assert.deepEqual(calls, []);
});

test("private startTransition routing records action identity and blocked lane execution", () => {
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
  function transitionAction(first, second) {
    calls.push(["transitionAction", first, second]);
  }

  hookDispatcher.markPrivateTransitionHookDispatcher(dispatcher, metadata);
  hookDispatcher.ReactCurrentDispatcher.current = dispatcher;

  const record = hookDispatcher.recordPrivateStartTransitionDispatcherRouting(
    transitionAction,
    metadata
  );

  assert.equal(Object.isFrozen(record), true);
  assert.deepEqual(
    Object.keys(record),
    expectedStartTransitionRoutingRecordFieldNames
  );
  assert.equal(record.dispatcher, dispatcher);
  assert.equal(record.action, transitionAction);
  assert.equal(record.actionName, "transitionAction");
  assert.equal(record.actionLength, 2);
  assert.equal(record.metadata, metadata);
  assert.equal(record.laneMetadata, metadata.transitionLaneMetadata);
  assert.equal(
    record.pendingStateTupleShape,
    metadata.transitionPendingStateTupleShape
  );
  assert.equal(record.schedulerExecutionBlocked, true);
  assert.equal(record.rootSchedulingBlocked, true);
  assert.equal(record.rootExecutionBlocked, true);
  assert.equal(record.callbackExecutionBlocked, true);
  assert.equal(record.publicStartTransitionDispatcherRouting, false);
  assert.equal(record.compatibilityClaimed, false);
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

function assertUnsupportedTransitionCallback(callback, label) {
  assert.throws(
    callback,
    (error) => {
      assert.equal(error.name, "TypeError", label);
      assert.equal(
        error.code,
        "FAST_REACT_UNSUPPORTED_TRANSITION_CALLBACK",
        label
      );
      assert.equal(error.hookName, "useTransition", label);
      assert.equal(error.apiName, "startTransition", label);
      assert.match(
        error.message,
        /requires a callback function/u,
        label
      );
      return true;
    },
    label
  );
}
