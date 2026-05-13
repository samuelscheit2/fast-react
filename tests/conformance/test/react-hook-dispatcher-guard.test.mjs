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
const ReactServer = require(path.join(
  reactPackageRoot,
  "react.react-server.js"
));
const hookDispatcher = require(path.join(
  reactPackageRoot,
  "hook-dispatcher.js"
));

const selectedDefaultHooks = [
  ["use", 1, ["usable"]],
  ["useCallback", 2, ["callback", ["dep"]]],
  ["useContext", 1, [{ $$typeof: Symbol.for("react.context") }]],
  ["useEffect", 2, [() => undefined, []]],
  ["useImperativeHandle", 3, [{ current: null }, () => "handle", []]],
  ["useInsertionEffect", 2, [() => undefined, []]],
  ["useLayoutEffect", 2, [() => undefined, []]],
  ["useMemo", 2, [() => "memo", []]],
  ["useReducer", 3, [(state) => state, 0, undefined]],
  ["useRef", 1, ["ref"]],
  ["useState", 1, [0]]
];

const statefulDefaultHooks = [
  ["useReducer", 3, [(state) => state, 0, undefined]],
  ["useState", 1, [0]]
];

const callbackDefaultHooks = [
  ["useCallback", 2, ["callback", ["dep"]]]
];

const memoDefaultHooks = [
  ["useMemo", 2, [() => "memo", []]]
];

const refDefaultHooks = [
  ["useRef", 1, ["ref"]]
];

const contextDefaultHooks = [
  ["useContext", 1, [{ $$typeof: Symbol.for("react.context") }]]
];

const effectDefaultHooks = [
  ["useEffect", 2, [() => undefined, []]],
  ["useImperativeHandle", 3, [{ current: null }, () => "handle", []]],
  ["useInsertionEffect", 2, [() => undefined, []]],
  ["useLayoutEffect", 2, [() => undefined, []]]
];

const effectRegistrationFieldNames = [
  "hook",
  "effect",
  "instance",
  "phase",
  "tag",
  "create",
  "dependencies",
  "fiber_flags"
];
const effectUpdateQueueRecordFieldNames = [
  "update_index",
  "fiber",
  "hook_list",
  "hook",
  "previous_effect",
  "effect",
  "instance",
  "phase",
  "tag",
  "create",
  "destroy",
  "previous_dependencies",
  "dependencies",
  "dependency_status"
];
const effectDependencyStatusNames = ["Changed", "Unchanged"];
const hookRenderPhaseNames = ["Mount", "Update"];
const passiveEffectMetadataFieldNames = [
  "fiber",
  "render_phase",
  "hook_list",
  "effect_index",
  "effect",
  "instance",
  "tag",
  "create",
  "destroy",
  "dependencies",
  "lanes"
];
const pendingPassiveCommitHandoffFieldNames = [
  "root",
  "fiber",
  "phase",
  "lanes",
  "records"
];
const pendingPassiveEffectCommitFieldNames = [
  "fiber",
  "effect_index",
  "effect",
  "instance",
  "unmount_order",
  "mount_order"
];
const contextReadRecordFieldNames = [
  "read_index",
  "fiber",
  "context",
  "default_value",
  "value",
  "active_provider_count",
  "dependency"
];
const contextDependencyRecordFieldNames = [
  "handle",
  "fiber",
  "context",
  "memoized_value",
  "read_index",
  "render_read_index",
  "render_lanes",
  "dependency_lanes",
  "next",
  "renderer_visible_propagation",
  "propagation_flags"
];
const contextPropagationDependencyRecordFieldNames = [
  "dependency",
  "fiber",
  "context",
  "memoized_value",
  "previous_value",
  "next_value",
  "propagation_lanes",
  "previous_dependency_lanes",
  "dependency_lanes",
  "root"
];
const contextPropagationRecordFieldNames = [
  "render",
  "change",
  "propagation_lanes",
  "scanned_dependency_count",
  "marked_dependencies",
  "roots"
];
const acceptedEffectReconcilerRecords = [
  "FunctionComponentEffectRegistration",
  "FunctionComponentEffectUpdateQueueRecord",
  "FunctionComponentEffectDependencyStatus",
  "FunctionComponentHookRenderPhase",
  "FunctionComponentUseEffectHookRenderRecord",
  "FunctionComponentUseEffectRenderRecord",
  "FunctionComponentPassiveEffectMetadata",
  "FunctionComponentPendingPassiveCommitHandoff",
  "FunctionComponentPendingPassiveEffectCommitRecord"
];
const acceptedContextReconcilerRecords = [
  "FunctionComponentContextReadRecord",
  "FunctionComponentContextDependencyRecord",
  "FunctionComponentUseContextRenderRecord",
  "FunctionComponentContextChangePropagationDependencyRecord",
  "FunctionComponentContextChangePropagationRecord"
];

const expectedEffectHookMetadata = {
  useEffect: {
    effectPhaseName: "Passive",
    hookEffectFlagName: "PASSIVE",
    mountFiberFlagNames: ["PASSIVE", "PASSIVE_STATIC"],
    passiveEffectMetadataFieldNames,
    passiveEffectMetadataRecordName: "FunctionComponentPassiveEffectMetadata",
    pendingPassiveCommitHandoffFieldNames,
    pendingPassiveCommitHandoffRecordName:
      "FunctionComponentPendingPassiveCommitHandoff",
    pendingPassiveEffectCommitFieldNames,
    pendingPassiveEffectCommitRecordName:
      "FunctionComponentPendingPassiveEffectCommitRecord",
    pendingPassivePhaseNames: ["Unmount", "Mount"],
    updateFiberFlagNames: ["PASSIVE"]
  },
  useImperativeHandle: {
    effectPhaseName: "Layout",
    hookEffectFlagName: "LAYOUT",
    mountFiberFlagNames: ["UPDATE", "LAYOUT_STATIC"],
    passiveEffectMetadataFieldNames: [],
    passiveEffectMetadataRecordName: null,
    pendingPassiveCommitHandoffFieldNames: [],
    pendingPassiveCommitHandoffRecordName: null,
    pendingPassiveEffectCommitFieldNames: [],
    pendingPassiveEffectCommitRecordName: null,
    pendingPassivePhaseNames: [],
    updateFiberFlagNames: ["UPDATE"]
  },
  useInsertionEffect: {
    effectPhaseName: "Insertion",
    hookEffectFlagName: "INSERTION",
    mountFiberFlagNames: ["UPDATE"],
    passiveEffectMetadataFieldNames: [],
    passiveEffectMetadataRecordName: null,
    pendingPassiveCommitHandoffFieldNames: [],
    pendingPassiveCommitHandoffRecordName: null,
    pendingPassiveEffectCommitFieldNames: [],
    pendingPassiveEffectCommitRecordName: null,
    pendingPassivePhaseNames: [],
    updateFiberFlagNames: ["UPDATE"]
  },
  useLayoutEffect: {
    effectPhaseName: "Layout",
    hookEffectFlagName: "LAYOUT",
    mountFiberFlagNames: ["UPDATE", "LAYOUT_STATIC"],
    passiveEffectMetadataFieldNames: [],
    passiveEffectMetadataRecordName: null,
    pendingPassiveCommitHandoffFieldNames: [],
    pendingPassiveCommitHandoffRecordName: null,
    pendingPassiveEffectCommitFieldNames: [],
    pendingPassiveEffectCommitRecordName: null,
    pendingPassivePhaseNames: [],
    updateFiberFlagNames: ["UPDATE"]
  }
};

const invalidHookCallDefaultHooks = selectedDefaultHooks;

const dispatcherForwardedDefaultHooks = selectedDefaultHooks.filter(
  ([hookName]) =>
    !hasHookName(callbackDefaultHooks, hookName) &&
    !hasHookName(memoDefaultHooks, hookName) &&
    !hasHookName(refDefaultHooks, hookName) &&
    !hasHookName(statefulDefaultHooks, hookName) &&
    !hasHookName(contextDefaultHooks, hookName) &&
    !hasHookName(effectDefaultHooks, hookName)
);

const selectedServerHooks = [
  ["use", 1, ["usable"]],
  ["useCallback", 2, ["callback", ["dep"]]],
  ["useMemo", 2, [() => "memo", []]]
];

test.afterEach(() => {
  hookDispatcher.ReactCurrentDispatcher.current = null;
});

test("selected public React hooks preserve React 19.2.6 function names and lengths", () => {
  for (const [hookName, length] of selectedDefaultHooks) {
    assert.equal(typeof React[hookName], "function", hookName);
    assert.equal(React[hookName].name, "", hookName);
    assert.equal(React[hookName].length, length, hookName);
  }

  for (const [hookName, length] of selectedServerHooks) {
    assert.equal(typeof ReactServer[hookName], "function", hookName);
    assert.equal(ReactServer[hookName].name, "", hookName);
    assert.equal(ReactServer[hookName].length, length, hookName);
  }
});

test("effect hook private metadata names stay aligned to accepted effect records", () => {
  assert.deepEqual(
    hookDispatcher.effectHookNames,
    Object.keys(expectedEffectHookMetadata)
  );

  for (const [hookName, expected] of Object.entries(expectedEffectHookMetadata)) {
    const metadata = hookDispatcher.getEffectHookMetadata(hookName);

    assert.equal(metadata, hookDispatcher.effectHookMetadataByHookName[hookName]);
    assert.equal(Object.isFrozen(metadata), true, hookName);
    assert.equal(metadata.hookName, hookName);
    assert.equal(metadata.compatibilityStatus, "blocked", hookName);
    assert.equal(
      metadata.effectDependencyStatusEnumName,
      "FunctionComponentEffectDependencyStatus"
    );
    assert.deepEqual(
      metadata.effectDependencyStatusNames,
      effectDependencyStatusNames
    );
    assert.equal(metadata.effectPhaseEnumName, "FunctionComponentEffectPhase");
    assert.equal(metadata.effectPhaseName, expected.effectPhaseName, hookName);
    assert.equal(metadata.effectRegistrationRecordName, "FunctionComponentEffectRegistration");
    assert.deepEqual(metadata.effectRegistrationFieldNames, effectRegistrationFieldNames);
    assert.equal(
      metadata.effectUpdateQueueRecordName,
      "FunctionComponentEffectUpdateQueueRecord"
    );
    assert.deepEqual(
      metadata.effectUpdateQueueRecordFieldNames,
      effectUpdateQueueRecordFieldNames
    );
    assert.equal(metadata.executesEffectCallback, false, hookName);
    assert.equal(metadata.fiberFlagsRecordName, "FiberFlags");
    assert.equal(metadata.hookEffectFlagsRecordName, "HookEffectFlags");
    assert.equal(metadata.hookEffectFlagName, expected.hookEffectFlagName, hookName);
    assert.equal(
      metadata.hookRenderPhaseEnumName,
      "FunctionComponentHookRenderPhase"
    );
    assert.deepEqual(metadata.hookRenderPhaseNames, hookRenderPhaseNames);
    assert.deepEqual(metadata.mountFiberFlagNames, expected.mountFiberFlagNames);
    assert.equal(
      metadata.passiveEffectMetadataRecordName,
      expected.passiveEffectMetadataRecordName,
      hookName
    );
    assert.deepEqual(
      metadata.passiveEffectMetadataFieldNames,
      expected.passiveEffectMetadataFieldNames,
      hookName
    );
    assert.equal(
      metadata.pendingPassiveCommitHandoffRecordName,
      expected.pendingPassiveCommitHandoffRecordName,
      hookName
    );
    assert.deepEqual(
      metadata.pendingPassiveCommitHandoffFieldNames,
      expected.pendingPassiveCommitHandoffFieldNames,
      hookName
    );
    assert.equal(
      metadata.pendingPassiveEffectCommitRecordName,
      expected.pendingPassiveEffectCommitRecordName,
      hookName
    );
    assert.deepEqual(
      metadata.pendingPassiveEffectCommitFieldNames,
      expected.pendingPassiveEffectCommitFieldNames,
      hookName
    );
    assert.deepEqual(
      metadata.pendingPassivePhaseNames,
      expected.pendingPassivePhaseNames,
      hookName
    );
    assert.equal(metadata.schedulesPublicAct, false, hookName);
    assert.deepEqual(metadata.updateFiberFlagNames, expected.updateFiberFlagNames);
  }

  assert.equal(hookDispatcher.getEffectHookMetadata("useEffectEvent"), null);
});

test("private effect-hook dispatcher metadata names match accepted effect diagnostics", () => {
  const metadata = hookDispatcher.privateEffectHookDispatcherMetadata;

  assert.equal(metadata.capability, "fast-react.private.effect_hook_dispatcher");
  assert.equal(metadata.compatibilityTarget, "react@19.2.6");
  assert.equal(metadata.compatibilityClaimed, false);
  assert.equal(metadata.exposesPublicHookImplementation, false);
  assert.equal(metadata.rendererIntegration, false);
  assert.equal(metadata.schedulesPublicAct, false);
  assert.equal(metadata.executesEffectCallbacks, false);
  assert.deepEqual(metadata.hookNames, [
    "useEffect",
    "useImperativeHandle",
    "useInsertionEffect",
    "useLayoutEffect"
  ]);
  assert.deepEqual(
    metadata.effectRegistrationFieldNames,
    effectRegistrationFieldNames
  );
  assert.deepEqual(
    metadata.effectUpdateQueueRecordFieldNames,
    effectUpdateQueueRecordFieldNames
  );
  assert.deepEqual(
    metadata.effectDependencyStatusNames,
    effectDependencyStatusNames
  );
  assert.deepEqual(metadata.hookRenderPhaseNames, hookRenderPhaseNames);
  assert.deepEqual(
    metadata.passiveEffectMetadataFieldNames,
    passiveEffectMetadataFieldNames
  );
  assert.deepEqual(
    metadata.pendingPassiveCommitHandoffFieldNames,
    pendingPassiveCommitHandoffFieldNames
  );
  assert.deepEqual(
    metadata.pendingPassiveEffectCommitFieldNames,
    pendingPassiveEffectCommitFieldNames
  );
  assert.deepEqual(metadata.pendingPassivePhaseNames, ["Unmount", "Mount"]);
  assert.deepEqual(
    metadata.acceptedReconcilerRecords,
    acceptedEffectReconcilerRecords
  );
  assert.equal(
    hookDispatcher.isPrivateEffectHookDispatcherMetadata(metadata),
    true
  );
  assert.equal(Object.isFrozen(metadata), true);

  for (const value of Object.values(metadata)) {
    if (Array.isArray(value)) {
      assert.equal(Object.isFrozen(value), true);
    }
  }

  assert.equal(React.privateEffectHookDispatcherMetadata, undefined);
  assert.equal(React.markPrivateEffectHookDispatcher, undefined);
});

test("selected public React hooks throw the invalid-hook-call boundary without a dispatcher", () => {
  for (const [hookName, , args] of invalidHookCallDefaultHooks) {
    assertInvalidHookCall(() => React[hookName](...args), hookName);
  }

  for (const [hookName, , args] of selectedServerHooks) {
    assertInvalidHookCall(() => ReactServer[hookName](...args), hookName);
  }
});

test("useState and useReducer fail closed without a marked private state-hook dispatcher", () => {
  const calls = [];
  const genericDispatcher = {
    useReducer(...args) {
      calls.push(["useReducer", args]);
      return ["reducer"];
    },
    useState(...args) {
      calls.push(["useState", args]);
      return ["state"];
    }
  };

  hookDispatcher.ReactCurrentDispatcher.current = genericDispatcher;

  for (const [hookName, , args] of statefulDefaultHooks) {
    assertStateHookDispatcherUnavailable(() => React[hookName](...args), hookName);
  }

  assertStateHookDispatcherUnavailable(
    () => hookDispatcher.markPrivateStateHookDispatcher(genericDispatcher),
    "useState"
  );

  assert.deepEqual(calls, []);
  assert.equal(
    hookDispatcher.isPrivateStateHookDispatcher(genericDispatcher),
    false
  );
});

test("useCallback fails closed without a marked private callback-hook dispatcher", () => {
  const calls = [];
  const genericDispatcher = {
    useCallback(callback, deps) {
      calls.push([callback, deps]);
      return callback;
    }
  };
  const callback = () => "callback";

  hookDispatcher.ReactCurrentDispatcher.current = genericDispatcher;

  assertInvalidHookCall(
    () => React.useCallback(callback, ["dep"]),
    "useCallback"
  );
  assertInvalidHookCall(
    () => ReactServer.useCallback(callback, ["dep"]),
    "useCallback"
  );
  assertInvalidHookCall(
    () => hookDispatcher.markPrivateCallbackHookDispatcher(genericDispatcher),
    "useCallback"
  );

  assert.deepEqual(calls, []);
  assert.equal(
    hookDispatcher.isPrivateCallbackHookDispatcher(genericDispatcher),
    false
  );
});

test("useMemo fails closed without a marked private memo-hook dispatcher", () => {
  const calls = [];
  const genericDispatcher = {
    useMemo(create, deps) {
      calls.push([create, deps]);
      return create();
    }
  };
  const create = () => "memo";

  hookDispatcher.ReactCurrentDispatcher.current = genericDispatcher;

  assertInvalidHookCall(() => React.useMemo(create, ["dep"]), "useMemo");
  assertInvalidHookCall(() => ReactServer.useMemo(create, ["dep"]), "useMemo");
  assertInvalidHookCall(
    () => hookDispatcher.markPrivateMemoHookDispatcher(genericDispatcher),
    "useMemo"
  );

  assert.deepEqual(calls, []);
  assert.equal(
    hookDispatcher.isPrivateMemoHookDispatcher(genericDispatcher),
    false
  );
});

test("useRef fails closed without a marked private ref-hook dispatcher", () => {
  const calls = [];
  const genericDispatcher = {
    useRef(initialValue) {
      calls.push(initialValue);
      return { current: initialValue };
    }
  };

  hookDispatcher.ReactCurrentDispatcher.current = genericDispatcher;

  assertInvalidHookCall(() => React.useRef("ref"), "useRef");
  assertInvalidHookCall(
    () => hookDispatcher.markPrivateRefHookDispatcher(genericDispatcher),
    "useRef"
  );

  assert.deepEqual(calls, []);
  assert.equal(
    hookDispatcher.isPrivateRefHookDispatcher(genericDispatcher),
    false
  );
});

test("private state-hook dispatcher metadata names match accepted hook queue records", () => {
  const metadata = hookDispatcher.privateStateHookDispatcherMetadata;

  assert.equal(metadata.capability, "fast-react.private.state_hook_dispatcher");
  assert.equal(metadata.compatibilityTarget, "react@19.2.6");
  assert.equal(metadata.compatibilityClaimed, false);
  assert.equal(metadata.exposesPublicHookImplementation, false);
  assert.equal(metadata.rendererIntegration, false);
  assert.equal(metadata.schedulesPublicJsUpdates, false);
  assert.deepEqual(metadata.hookNames, ["useReducer", "useState"]);
  assert.deepEqual(metadata.hookStateRecordFields, [
    "memoizedState",
    "baseState",
    "baseQueue",
    "queue",
    "dispatch"
  ]);
  assert.deepEqual(metadata.reducerHookRecordFields, [
    "memoizedState",
    "baseState",
    "baseQueue",
    "queue",
    "dispatch",
    "reducer"
  ]);
  assert.deepEqual(metadata.hookQueueRecordFields, [
    "pending",
    "lanes",
    "dispatch",
    "lastRenderedReducer",
    "lastRenderedState"
  ]);
  assert.deepEqual(metadata.hookUpdateRecordFields, [
    "lane",
    "revertLane",
    "action",
    "hasEagerState",
    "eagerState",
    "next"
  ]);
  assert.deepEqual(metadata.stateUpdateRenderRecordFields, [
    "fiber",
    "hook",
    "queue",
    "dispatch",
    "lanes",
    "previousMemoizedState",
    "previousBaseState",
    "previousBaseQueue",
    "memoizedState",
    "baseState",
    "baseQueue",
    "remainingLanes",
    "appliedUpdateCount",
    "skippedUpdateCount",
    "revertedUpdateCount",
    "eagerUpdateCount"
  ]);
  assert.deepEqual(metadata.reducerUpdateRenderRecordFields, [
    "fiber",
    "hook",
    "queue",
    "dispatch",
    "reducer",
    "lanes",
    "previousMemoizedState",
    "previousBaseState",
    "previousBaseQueue",
    "memoizedState",
    "baseState",
    "baseQueue",
    "remainingLanes",
    "appliedUpdateCount",
    "skippedUpdateCount",
    "revertedUpdateCount",
    "eagerUpdateCount"
  ]);
  assert.deepEqual(metadata.stateDispatchEagerStateFields, [
    "lastRenderedState",
    "eagerState"
  ]);
  assert.deepEqual(metadata.stateDispatchRequestFields, [
    "dispatch",
    "action",
    "lane",
    "revertLane",
    "eagerState"
  ]);
  assert.deepEqual(metadata.stateDispatchRecordFields, [
    "fiber",
    "queue",
    "dispatch",
    "update",
    "lane",
    "revertLane",
    "action",
    "hasEagerState",
    "eagerState"
  ]);
  assert.deepEqual(metadata.reducerDispatchRequestFields, [
    "dispatch",
    "action",
    "lane"
  ]);
  assert.deepEqual(metadata.reducerDispatchRecordFields, [
    "fiber",
    "queue",
    "dispatch",
    "reducer",
    "update",
    "lane",
    "action"
  ]);
  assert.deepEqual(metadata.acceptedReconcilerRecords, [
    "HookStateSlot",
    "HookQueue",
    "HookUpdate",
    "FunctionComponentReducerHandle",
    "FunctionComponentStateReducerId",
    "FunctionComponentReducerHookRecord",
    "FunctionComponentStateUpdateRenderLanes",
    "FunctionComponentStateUpdateRenderRecord",
    "FunctionComponentReducerUpdateRenderRecord",
    "FunctionComponentStateDispatchEagerState",
    "FunctionComponentStateDispatchRequest",
    "FunctionComponentStateDispatchRecord",
    "FunctionComponentReducerDispatchRequest",
    "FunctionComponentReducerDispatchRecord"
  ]);
  assert.equal(
    hookDispatcher.isPrivateStateHookDispatcherMetadata(metadata),
    true
  );
  assert.equal(Object.isFrozen(metadata), true);

  for (const value of Object.values(metadata)) {
    if (Array.isArray(value)) {
      assert.equal(Object.isFrozen(value), true);
    }
  }

  assert.equal(React.privateStateHookDispatcherMetadata, undefined);
  assert.equal(React.markPrivateStateHookDispatcher, undefined);
});

test("private callback-hook dispatcher metadata names match accepted callback diagnostics", () => {
  const metadata = hookDispatcher.privateCallbackHookDispatcherMetadata;

  assert.equal(metadata.capability, "fast-react.private.callback_hook_dispatcher");
  assert.equal(metadata.compatibilityTarget, "react@19.2.6");
  assert.equal(metadata.compatibilityClaimed, false);
  assert.equal(metadata.exposesPublicHookImplementation, false);
  assert.equal(metadata.rendererIntegration, false);
  assert.equal(metadata.schedulesPublicJsUpdates, false);
  assert.equal(metadata.executesCallback, false);
  assert.deepEqual(metadata.hookNames, ["useCallback"]);
  assert.deepEqual(metadata.renderRequestFields, ["callback", "dependencies"]);
  assert.deepEqual(metadata.hookRecordFields, [
    "hook",
    "callback",
    "dependencies"
  ]);
  assert.deepEqual(metadata.updateRecordFields, [
    "hook",
    "previousHook",
    "previousCallback",
    "previousDependencies",
    "requestedCallback",
    "callback",
    "dependencies",
    "dependencyStatus"
  ]);
  assert.deepEqual(metadata.updateDiagnosticRecordFields, [
    "diagnosticIndex",
    "fiber",
    "current",
    "currentHookList",
    "hookList",
    "previousHook",
    "hook",
    "renderLanes",
    "previousCallback",
    "previousDependencies",
    "requestedCallback",
    "callback",
    "dependencies",
    "dependencyStatus"
  ]);
  assert.deepEqual(metadata.updateDiagnosticsFields, ["hookList", "records"]);
  assert.deepEqual(metadata.memoRecordFields, [
    "hook",
    "value",
    "dependencies"
  ]);
  assert.deepEqual(metadata.memoUpdateRecordFields, [
    "hook",
    "previousHook",
    "previousValue",
    "previousDependencies",
    "requestedValue",
    "value",
    "dependencies",
    "dependencyStatus"
  ]);
  assert.deepEqual(metadata.dependencyStatusNames, ["Changed", "Unchanged"]);
  assert.deepEqual(metadata.acceptedReconcilerRecords, [
    "FunctionComponentCallbackHandle",
    "FunctionComponentUseCallbackRenderRequest",
    "FunctionComponentCallbackHookRecord",
    "FunctionComponentCallbackUpdateRecord",
    "FunctionComponentCallbackUpdateDiagnosticRecord",
    "FunctionComponentCallbackUpdateDiagnostics",
    "FunctionComponentUseCallbackHookRenderRecord",
    "FunctionComponentUseCallbackRenderRecord",
    "FunctionComponentMemoDependencyStatus",
    "FunctionComponentMemoHookRecord",
    "FunctionComponentMemoUpdateRecord"
  ]);
  assert.equal(
    hookDispatcher.isPrivateCallbackHookDispatcherMetadata(metadata),
    true
  );
  assert.equal(Object.isFrozen(metadata), true);

  for (const value of Object.values(metadata)) {
    if (Array.isArray(value)) {
      assert.equal(Object.isFrozen(value), true);
    }
  }

  assert.equal(React.privateCallbackHookDispatcherMetadata, undefined);
  assert.equal(React.markPrivateCallbackHookDispatcher, undefined);
});

test("private memo-hook dispatcher metadata names match accepted useMemo diagnostics", () => {
  const metadata = hookDispatcher.privateMemoHookDispatcherMetadata;

  assert.equal(metadata.capability, "fast-react.private.memo_hook_dispatcher");
  assert.equal(metadata.compatibilityTarget, "react@19.2.6");
  assert.equal(metadata.compatibilityClaimed, false);
  assert.equal(metadata.exposesPublicHookImplementation, false);
  assert.equal(metadata.rendererIntegration, false);
  assert.equal(metadata.schedulesPublicJsUpdates, false);
  assert.equal(metadata.executesCreate, false);
  assert.deepEqual(metadata.hookNames, ["useMemo"]);
  assert.deepEqual(metadata.hookCallFields, ["create", "dependencies"]);
  assert.deepEqual(metadata.renderRequestFields, ["value", "dependencies"]);
  assert.deepEqual(metadata.hookRecordFields, [
    "hook",
    "value",
    "dependencies"
  ]);
  assert.deepEqual(metadata.updateRecordFields, [
    "hook",
    "previousHook",
    "previousValue",
    "previousDependencies",
    "requestedValue",
    "value",
    "dependencies",
    "dependencyStatus"
  ]);
  assert.deepEqual(metadata.updateDiagnosticRecordFields, [
    "diagnosticIndex",
    "fiber",
    "current",
    "currentHookList",
    "hookList",
    "previousHook",
    "hook",
    "renderLanes",
    "previousValue",
    "previousDependencies",
    "requestedValue",
    "value",
    "dependencies",
    "dependencyStatus"
  ]);
  assert.deepEqual(metadata.updateDiagnosticsFields, ["hookList", "records"]);
  assert.deepEqual(metadata.dependencyStatusNames, ["Changed", "Unchanged"]);
  assert.deepEqual(metadata.acceptedReconcilerRecords, [
    "FunctionComponentUseMemoRenderRequest",
    "FunctionComponentMemoDependencyStatus",
    "FunctionComponentMemoHookRecord",
    "FunctionComponentMemoUpdateRecord",
    "FunctionComponentMemoUpdateDiagnosticRecord",
    "FunctionComponentMemoUpdateDiagnostics",
    "FunctionComponentUseMemoHookRenderRecord",
    "FunctionComponentUseMemoRenderRecord",
    "FunctionComponentUseMemoUseRefRenderRecord"
  ]);
  assert.equal(hookDispatcher.isPrivateMemoHookDispatcherMetadata(metadata), true);
  assert.equal(Object.isFrozen(metadata), true);

  for (const value of Object.values(metadata)) {
    if (Array.isArray(value)) {
      assert.equal(Object.isFrozen(value), true);
    }
  }

  assert.equal(React.privateMemoHookDispatcherMetadata, undefined);
  assert.equal(React.markPrivateMemoHookDispatcher, undefined);
});

test("private ref-hook dispatcher metadata records source-owned blockers", () => {
  const metadata = hookDispatcher.privateRefHookDispatcherMetadata;

  assert.equal(metadata.capability, "fast-react.private.ref_hook_dispatcher");
  assert.equal(metadata.compatibilityTarget, "react@19.2.6");
  assert.equal(metadata.compatibilityClaimed, false);
  assert.equal(metadata.publicCompatibilityClaimed, false);
  assert.equal(metadata.publicHookCompatibility, false);
  assert.equal(metadata.exposesPublicHookImplementation, false);
  assert.equal(metadata.hookExecutionCompatibility, false);
  assert.equal(metadata.refIdentityCompatibility, false);
  assert.equal(metadata.refObjectCompatibility, false);
  assert.equal(metadata.rendererIntegration, false);
  assert.equal(metadata.rendererCompatibility, false);
  assert.equal(metadata.publicActIntegration, false);
  assert.equal(metadata.schedulerIntegration, false);
  assert.equal(metadata.schedulerPrerequisitesReady, false);
  assert.equal(metadata.rootLaneIntegration, false);
  assert.equal(metadata.rootScheduling, false);
  assert.equal(metadata.rootExecution, false);
  assert.equal(metadata.callbackExecutionClaimed, false);
  assert.equal(metadata.externalStoreSubscriptionClaimed, false);
  assert.equal(metadata.externalStoreSnapshotReadClaimed, false);
  assert.equal(metadata.idGenerationClaimed, false);
  assert.equal(metadata.packageCompatibility, false);
  assert.deepEqual(metadata.hookNames, ["useRef"]);
  assert.deepEqual(metadata.publicShapeBlockerFields, [
    "hookName",
    "reactSourceFunction",
    "reactDispatcherMethod",
    "reactSourceLength",
    "currentPublicExport",
    "currentName",
    "currentLength",
    "blocker"
  ]);
  assert.deepEqual(metadata.publicShapeBlockers, [
    {
      hookName: "useRef",
      reactSourceFunction: "ReactHooks.useRef",
      reactDispatcherMethod: "dispatcher.useRef",
      reactSourceLength: 1,
      currentPublicExport: "react.useRef private-dispatcher guarded facade",
      currentName: "",
      currentLength: 1,
      blocker:
        "public export rejects generic dispatcher forwarding until a source-owned private useRef hook dispatcher is admitted"
    }
  ]);
  assert.deepEqual(metadata.sourceReportFieldNames, [
    "kind",
    "version",
    "status",
    "reactSourceTag",
    "reactSourceCommit",
    "reactHooksSource",
    "reactClientSource",
    "reactServerSource",
    "reactReconcilerSource",
    "fastReactSource",
    "reactMountFunction",
    "reactUpdateFunction",
    "dispatcherMethodCurrentInReactSource",
    "publicRootExportCurrent",
    "reactServerExportAbsentCurrent",
    "compatibilityClaimed"
  ]);
  assert.deepEqual(metadata.sourceReport, {
    kind: "fast-react.private.use_ref_hook_source_report",
    version: 1,
    status: "source-current-for-react-19.2.6-useRef-private-dispatcher",
    reactSourceTag: "v19.2.6",
    reactSourceCommit: "eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401",
    reactHooksSource: "packages/react/src/ReactHooks.js",
    reactClientSource: "packages/react/src/ReactClient.js",
    reactServerSource: "packages/react/src/ReactServer.js",
    reactReconcilerSource: "packages/react-reconciler/src/ReactFiberHooks.js",
    fastReactSource: "packages/react/hook-dispatcher.js",
    reactMountFunction: "mountRef",
    reactUpdateFunction: "updateRef",
    dispatcherMethodCurrentInReactSource: true,
    publicRootExportCurrent: true,
    reactServerExportAbsentCurrent: true,
    compatibilityClaimed: false
  });
  assert.deepEqual(metadata.blockerCurrentnessFieldNames, [
    "status",
    "compatibilityTarget",
    "sourceReportCurrent",
    "publicRootlessInvalidHookBlocked",
    "genericDispatcherForwardingBlocked",
    "privateDispatcherMarkerRequired",
    "cjsSurfaceCurrentnessBlocked",
    "reactServerSurfaceCurrentnessBlocked",
    "schedulerPrerequisitesBlocked",
    "rootLanePrerequisitesBlocked",
    "rootSchedulingBlocked",
    "rendererCompatibilityBlocked",
    "callbackInvocationBlocked",
    "externalStoreInvocationBlocked",
    "idGenerationBlocked",
    "refIdentityCompatibilityClaimed",
    "publicCompatibilityClaimed",
    "compatibilityClaimed"
  ]);
  assert.deepEqual(metadata.blockerCurrentness, {
    status:
      "blocked-until-private-useRef-dispatcher-root-and-renderer-currentness-admitted",
    compatibilityTarget: "react@19.2.6",
    sourceReportCurrent: true,
    publicRootlessInvalidHookBlocked: true,
    genericDispatcherForwardingBlocked: true,
    privateDispatcherMarkerRequired: true,
    cjsSurfaceCurrentnessBlocked: true,
    reactServerSurfaceCurrentnessBlocked: true,
    schedulerPrerequisitesBlocked: true,
    rootLanePrerequisitesBlocked: true,
    rootSchedulingBlocked: true,
    rendererCompatibilityBlocked: true,
    callbackInvocationBlocked: true,
    externalStoreInvocationBlocked: true,
    idGenerationBlocked: true,
    refIdentityCompatibilityClaimed: false,
    publicCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
  assert.deepEqual(metadata.surfaceCurrentnessFieldNames, [
    "surfaceId",
    "source",
    "entrypoint",
    "moduleShape",
    "sameAsRootExport",
    "hookName",
    "useRefExportPolicy",
    "sourceFunctionCurrent",
    "hasUseRefExport",
    "currentName",
    "currentLength",
    "expectedName",
    "expectedLength",
    "useRefPolicyCurrent",
    "rootlessInvalidHookBlocked",
    "genericDispatcherForwardingBlocked",
    "privateDispatcherRequired",
    "publicCompatibilityClaimed",
    "compatibilityClaimed"
  ]);
  assert.deepEqual(metadata.surfaceCurrentnessRows, [
    {
      surfaceId: "react-root",
      source: "packages/react/index.js",
      entrypoint: "react",
      moduleShape: "default-root",
      sameAsRootExport: true,
      hookName: "useRef",
      useRefExportPolicy: "available-root-hook",
      sourceFunctionCurrent: true,
      hasUseRefExport: true,
      currentName: "",
      currentLength: 1,
      expectedName: "",
      expectedLength: 1,
      useRefPolicyCurrent: true,
      rootlessInvalidHookBlocked: true,
      genericDispatcherForwardingBlocked: true,
      privateDispatcherRequired: true,
      publicCompatibilityClaimed: false,
      compatibilityClaimed: false
    },
    {
      surfaceId: "react-cjs-development",
      source: "packages/react/cjs/react.development.js",
      entrypoint: "react",
      moduleShape: "cjs-root-alias",
      sameAsRootExport: true,
      hookName: "useRef",
      useRefExportPolicy: "available-root-hook",
      sourceFunctionCurrent: true,
      hasUseRefExport: true,
      currentName: "",
      currentLength: 1,
      expectedName: "",
      expectedLength: 1,
      useRefPolicyCurrent: true,
      rootlessInvalidHookBlocked: true,
      genericDispatcherForwardingBlocked: true,
      privateDispatcherRequired: true,
      publicCompatibilityClaimed: false,
      compatibilityClaimed: false
    },
    {
      surfaceId: "react-cjs-production",
      source: "packages/react/cjs/react.production.js",
      entrypoint: "react",
      moduleShape: "cjs-root-alias",
      sameAsRootExport: true,
      hookName: "useRef",
      useRefExportPolicy: "available-root-hook",
      sourceFunctionCurrent: true,
      hasUseRefExport: true,
      currentName: "",
      currentLength: 1,
      expectedName: "",
      expectedLength: 1,
      useRefPolicyCurrent: true,
      rootlessInvalidHookBlocked: true,
      genericDispatcherForwardingBlocked: true,
      privateDispatcherRequired: true,
      publicCompatibilityClaimed: false,
      compatibilityClaimed: false
    },
    {
      surfaceId: "react-server",
      source: "packages/react/react.react-server.js",
      entrypoint: "react react-server",
      moduleShape: "react-server-root",
      sameAsRootExport: false,
      hookName: "useRef",
      useRefExportPolicy: "absent-react-server-hook",
      sourceFunctionCurrent: true,
      hasUseRefExport: false,
      currentName: null,
      currentLength: null,
      expectedName: null,
      expectedLength: null,
      useRefPolicyCurrent: true,
      rootlessInvalidHookBlocked: true,
      genericDispatcherForwardingBlocked: true,
      privateDispatcherRequired: true,
      publicCompatibilityClaimed: false,
      compatibilityClaimed: false
    }
  ]);
  assert.equal(metadata.cjsSurfaceCurrentnessBlocked, true);
  assert.equal(metadata.reactServerSurfaceCurrentnessBlocked, true);
  assert.deepEqual(metadata.hookCallFields, ["initialValue"]);
  assert.deepEqual(metadata.renderRequestFields, ["initialValue"]);
  assert.deepEqual(metadata.hookRecordFields, [
    "hook",
    "refObject",
    "initialValue"
  ]);
  assert.deepEqual(metadata.updateRecordFields, [
    "hook",
    "refObject",
    "initialValue",
    "ignoredInitialValue"
  ]);
  assert.deepEqual(metadata.hookRenderRecordFields, [
    "phase",
    "hook",
    "refObject",
    "initialValue"
  ]);
  assert.deepEqual(metadata.missingDispatcherPrerequisites, [
    "dispatcher.useRef",
    "private useRef hook dispatcher admission marker",
    "FunctionComponentUseRefHookRenderRecord currentness handoff"
  ]);
  assert.deepEqual(metadata.missingSchedulerPrerequisites, [
    "root scheduler render entry currentness",
    "act/Scheduler timing integration remains blocked"
  ]);
  assert.deepEqual(metadata.missingRootLanePrerequisites, [
    "public root renderWithHooks dispatcher installation",
    "FunctionComponent current hook-list rebinding through commit",
    "HostRoot render/update execution admission",
    "renderer-owned hook dispatcher lifecycle"
  ]);
  assert.deepEqual(metadata.compatibilityFalseFlags, [
    "compatibilityClaimed",
    "publicCompatibilityClaimed",
    "publicHookCompatibility",
    "exposesPublicHookImplementation",
    "hookExecutionCompatibility",
    "refIdentityCompatibility",
    "refObjectCompatibility",
    "rendererIntegration",
    "rendererCompatibility",
    "publicActIntegration",
    "schedulerIntegration",
    "schedulerPrerequisitesReady",
    "rootLaneIntegration",
    "rootScheduling",
    "rootExecution",
    "callbackExecutionClaimed",
    "externalStoreSubscriptionClaimed",
    "externalStoreSnapshotReadClaimed",
    "idGenerationClaimed",
    "packageCompatibility"
  ]);
  assert.deepEqual(metadata.acceptedReconcilerRecords, [
    "FunctionComponentRefObjectHandle",
    "FunctionComponentRefHookRecord",
    "FunctionComponentRefUpdateRecord",
    "FunctionComponentUseRefHookRenderRecord",
    "FunctionComponentUseMemoUseRefRenderRecord"
  ]);
  assert.deepEqual(
    metadata.rendererLifecycleBlockerRowFieldNames,
    hookDispatcher.useRefHookRendererLifecycleBlockerRowFieldNames
  );
  assert.deepEqual(
    metadata.rendererLifecycleBlockerRows,
    hookDispatcher.useRefHookRendererLifecycleBlockerRows
  );
  assert.deepEqual(
    metadata.rendererLifecycleBlockerReportFieldNames,
    hookDispatcher.useRefHookRendererLifecycleBlockerReportFieldNames
  );
  assert.equal(
    metadata.rendererLifecycleBlockerStatus,
    hookDispatcher.useRefHookRendererLifecycleBlockerStatus
  );
  assert.deepEqual(
    metadata.rendererLifecycleCompatibilityFalseFlags,
    hookDispatcher.useRefHookRendererLifecycleCompatibilityFalseFlags
  );

  for (const flagName of metadata.compatibilityFalseFlags) {
    assert.equal(metadata[flagName], false, flagName);
  }

  assert.deepEqual(hookDispatcher.useRefHookNames, ["useRef"]);
  assert.equal(hookDispatcher.isPrivateRefHookDispatcherMetadata(metadata), true);
  assert.equal(Object.isFrozen(metadata), true);

  for (const value of Object.values(metadata)) {
    if (Array.isArray(value)) {
      assert.equal(Object.isFrozen(value), true);
      for (const item of value) {
        if (item !== null && typeof item === "object") {
          assert.equal(Object.isFrozen(item), true);
        }
      }
    } else if (value !== null && typeof value === "object") {
      assert.equal(Object.isFrozen(value), true);
    }
  }

  assert.equal(React.privateRefHookDispatcherMetadata, undefined);
  assert.equal(React.markPrivateRefHookDispatcher, undefined);
  assert.equal(React.createUseRefHookCurrentnessReport, undefined);
  assert.equal(React.consumeUseRefHookCurrentnessReport, undefined);
  assert.equal(React.createUseRefHookRendererLifecycleBlockerReport, undefined);
  assert.equal(React.consumeUseRefHookRendererLifecycleBlockerReport, undefined);
  assert.equal(ReactServer.privateRefHookDispatcherMetadata, undefined);
  assert.equal(ReactServer.markPrivateRefHookDispatcher, undefined);
});

test("private context-hook dispatcher metadata names match accepted context diagnostics", () => {
  const metadata = hookDispatcher.privateContextHookDispatcherMetadata;

  assert.equal(metadata.capability, "fast-react.private.context_hook_dispatcher");
  assert.equal(metadata.compatibilityTarget, "react@19.2.6");
  assert.equal(metadata.compatibilityClaimed, false);
  assert.equal(metadata.exposesPublicHookImplementation, false);
  assert.equal(metadata.rendererIntegration, false);
  assert.equal(metadata.runtimeProviderPropagation, false);
  assert.equal(metadata.rendererVisiblePropagation, false);
  assert.deepEqual(metadata.hookNames, ["useContext"]);
  assert.deepEqual(metadata.contextReadRecordFields, contextReadRecordFieldNames);
  assert.deepEqual(
    metadata.contextDependencyRecordFields,
    contextDependencyRecordFieldNames
  );
  assert.deepEqual(
    metadata.contextPropagationDependencyRecordFields,
    contextPropagationDependencyRecordFieldNames
  );
  assert.deepEqual(
    metadata.contextPropagationRecordFields,
    contextPropagationRecordFieldNames
  );
  assert.deepEqual(
    metadata.rendererReadinessSourceReportFieldNames,
    hookDispatcher.contextHookRendererReadinessSourceReportFieldNames
  );
  assert.deepEqual(
    metadata.rendererReadinessSourceReport,
    hookDispatcher.contextHookRendererReadinessSourceReport
  );
  assert.deepEqual(
    metadata.rendererReadinessRowFieldNames,
    hookDispatcher.contextHookRendererReadinessRowFieldNames
  );
  assert.deepEqual(
    metadata.rendererReadinessRows,
    hookDispatcher.contextHookRendererReadinessRows
  );
  assert.deepEqual(
    metadata.rendererReadinessReportFieldNames,
    hookDispatcher.contextHookRendererReadinessReportFieldNames
  );
  assert.equal(
    metadata.rendererReadinessStatus,
    hookDispatcher.contextHookRendererReadinessStatus
  );
  assert.deepEqual(
    metadata.rendererReadinessCompatibilityFalseFlags,
    hookDispatcher.contextHookRendererReadinessCompatibilityFalseFlags
  );
  assert.equal(metadata.sourceOwnedContextObjectRequired, true);
  assert.equal(metadata.callerSuppliedContextObjectsAccepted, false);
  assert.equal(metadata.callerSuppliedDispatchersAccepted, false);
  assert.equal(metadata.providerRowOverridesAccepted, false);
  assert.deepEqual(
    metadata.acceptedReconcilerRecords,
    acceptedContextReconcilerRecords
  );
  assert.equal(
    hookDispatcher.isPrivateContextHookDispatcherMetadata(metadata),
    true
  );
  assert.equal(Object.isFrozen(metadata), true);

  for (const value of Object.values(metadata)) {
    if (Array.isArray(value)) {
      assert.equal(Object.isFrozen(value), true);
    }
  }

  assert.equal(React.privateContextHookDispatcherMetadata, undefined);
  assert.equal(React.markPrivateContextHookDispatcher, undefined);
  assert.equal(React.createContextHookRendererReadinessReport, undefined);
  assert.equal(React.consumeContextHookRendererReadinessReport, undefined);
  assert.equal(ReactServer.createContextHookRendererReadinessReport, undefined);
  assert.equal(ReactServer.consumeContextHookRendererReadinessReport, undefined);
});

test("private callback-hook dispatcher marker rejects diagnostic metadata drift", () => {
  const dispatcher = {
    useCallback() {
      throw new Error("unreachable callback dispatch");
    }
  };
  const driftedMetadata = {
    ...hookDispatcher.privateCallbackHookDispatcherMetadata,
    updateDiagnosticRecordFields: ["hook", "dependencyStatus"]
  };

  assert.equal(
    hookDispatcher.isPrivateCallbackHookDispatcherMetadata(driftedMetadata),
    false
  );
  assertInvalidHookCall(
    () =>
      hookDispatcher.markPrivateCallbackHookDispatcher(
        dispatcher,
        driftedMetadata
      ),
    "useCallback"
  );
  assert.equal(hookDispatcher.isPrivateCallbackHookDispatcher(dispatcher), false);
});

test("private memo-hook dispatcher marker rejects diagnostic metadata drift", () => {
  const dispatcher = {
    useMemo() {
      throw new Error("unreachable memo dispatch");
    }
  };
  const driftedMetadata = {
    ...hookDispatcher.privateMemoHookDispatcherMetadata,
    updateDiagnosticRecordFields: ["hook", "dependencyStatus"]
  };

  assert.equal(
    hookDispatcher.isPrivateMemoHookDispatcherMetadata(driftedMetadata),
    false
  );
  assertInvalidHookCall(
    () =>
      hookDispatcher.markPrivateMemoHookDispatcher(dispatcher, driftedMetadata),
    "useMemo"
  );
  assert.equal(hookDispatcher.isPrivateMemoHookDispatcher(dispatcher), false);
});

test("private ref-hook dispatcher marker rejects source and surface drift", () => {
  const dispatcher = {
    useRef() {
      throw new Error("unreachable ref dispatch");
    }
  };
  const driftedMetadata = {
    ...hookDispatcher.privateRefHookDispatcherMetadata,
    surfaceCurrentnessRows:
      hookDispatcher.privateRefHookDispatcherMetadata.surfaceCurrentnessRows.map(
        (row) =>
          row.surfaceId === "react-server"
            ? { ...row, hasUseRefExport: true }
            : row
      )
  };

  assert.equal(
    hookDispatcher.isPrivateRefHookDispatcherMetadata(driftedMetadata),
    false
  );
  assertInvalidHookCall(
    () => hookDispatcher.markPrivateRefHookDispatcher(dispatcher, driftedMetadata),
    "useRef"
  );
  assert.equal(hookDispatcher.isPrivateRefHookDispatcher(dispatcher), false);
});

test("private ref-hook dispatcher marker rejects shallow-cloned metadata", () => {
  const dispatcher = {
    useRef() {
      throw new Error("unreachable ref dispatch");
    }
  };
  const clonedMetadata = {
    ...hookDispatcher.privateRefHookDispatcherMetadata
  };

  assert.equal(
    hookDispatcher.isPrivateRefHookDispatcherMetadata(clonedMetadata),
    false
  );
  assertInvalidHookCall(
    () => hookDispatcher.markPrivateRefHookDispatcher(dispatcher, clonedMetadata),
    "useRef"
  );
  assert.equal(hookDispatcher.isPrivateRefHookDispatcher(dispatcher), false);
});

test("private context-hook dispatcher marker rejects diagnostic metadata drift", () => {
  const dispatcher = {
    useContext() {
      throw new Error("unreachable context dispatch");
    }
  };
  const driftedMetadata = {
    ...hookDispatcher.privateContextHookDispatcherMetadata,
    contextDependencyRecordFields: ["context", "memoized_value"]
  };

  assert.equal(
    hookDispatcher.isPrivateContextHookDispatcherMetadata(driftedMetadata),
    false
  );
  assertInvalidHookCall(
    () =>
      hookDispatcher.markPrivateContextHookDispatcher(
        dispatcher,
        driftedMetadata
      ),
    "useContext"
  );
  assert.equal(hookDispatcher.isPrivateContextHookDispatcher(dispatcher), false);
});

test("private context-hook dispatcher marker rejects shallow-cloned metadata", () => {
  const dispatcher = {
    useContext() {
      throw new Error("unreachable context dispatch");
    }
  };
  const clonedMetadata = {
    ...hookDispatcher.privateContextHookDispatcherMetadata
  };

  assert.equal(
    hookDispatcher.isPrivateContextHookDispatcherMetadata(clonedMetadata),
    false
  );
  assertInvalidHookCall(
    () =>
      hookDispatcher.markPrivateContextHookDispatcher(
        dispatcher,
        clonedMetadata
      ),
    "useContext"
  );
  assert.equal(hookDispatcher.isPrivateContextHookDispatcher(dispatcher), false);
});

test("private effect-hook dispatcher marker rejects passive metadata drift", () => {
  const dispatcher = Object.fromEntries(
    effectDefaultHooks.map(([hookName]) => [
      hookName,
      function () {
        throw new Error(`unreachable ${hookName} dispatch`);
      }
    ])
  );
  const driftedMetadata = {
    ...hookDispatcher.privateEffectHookDispatcherMetadata,
    passiveEffectMetadataFieldNames: ["fiber", "effect", "create"]
  };

  assert.equal(
    hookDispatcher.isPrivateEffectHookDispatcherMetadata(driftedMetadata),
    false
  );
  assertInvalidHookCall(
    () =>
      hookDispatcher.markPrivateEffectHookDispatcher(
        dispatcher,
        driftedMetadata
      ),
    "useEffect"
  );
  assert.equal(hookDispatcher.isPrivateEffectHookDispatcher(dispatcher), false);
});

test("private state-hook dispatcher marker rejects lane and update metadata drift", () => {
  const dispatcher = {
    useReducer() {
      throw new Error("unreachable reducer dispatch");
    },
    useState() {
      throw new Error("unreachable state dispatch");
    }
  };
  const driftedMetadata = {
    ...hookDispatcher.privateStateHookDispatcherMetadata,
    hookUpdateRecordFields: ["lane", "action", "next"]
  };

  assert.equal(
    hookDispatcher.isPrivateStateHookDispatcherMetadata(driftedMetadata),
    false
  );
  assertStateHookDispatcherUnavailable(
    () =>
      hookDispatcher.markPrivateStateHookDispatcher(dispatcher, driftedMetadata),
    "useState"
  );
  assert.equal(hookDispatcher.isPrivateStateHookDispatcher(dispatcher), false);
});

test("private state-hook dispatcher marker rejects eager dispatch metadata drift", () => {
  const dispatcher = {
    useReducer() {
      throw new Error("unreachable reducer dispatch");
    },
    useState() {
      throw new Error("unreachable state dispatch");
    }
  };
  const driftedMetadata = {
    ...hookDispatcher.privateStateHookDispatcherMetadata,
    stateDispatchEagerStateFields: ["eagerState"],
    stateDispatchRequestFields: ["dispatch", "action", "lane"]
  };

  assert.equal(
    hookDispatcher.isPrivateStateHookDispatcherMetadata(driftedMetadata),
    false
  );
  assertStateHookDispatcherUnavailable(
    () =>
      hookDispatcher.markPrivateStateHookDispatcher(dispatcher, driftedMetadata),
    "useState"
  );
  assert.equal(hookDispatcher.isPrivateStateHookDispatcher(dispatcher), false);
});

test("private state/callback/memo/effect dispatcher metadata requires source-owned singleton identity", () => {
  const cases = [
    {
      label: "state",
      hookName: "useState",
      metadata: hookDispatcher.privateStateHookDispatcherMetadata,
      isMetadata: hookDispatcher.isPrivateStateHookDispatcherMetadata,
      mark: hookDispatcher.markPrivateStateHookDispatcher,
      isDispatcher: hookDispatcher.isPrivateStateHookDispatcher,
      assertReject: assertStateHookDispatcherUnavailable,
      createDispatcher() {
        return {
          useReducer() {
            throw new Error("unreachable reducer dispatch");
          },
          useState() {
            throw new Error("unreachable state dispatch");
          }
        };
      }
    },
    {
      label: "callback",
      hookName: "useCallback",
      metadata: hookDispatcher.privateCallbackHookDispatcherMetadata,
      isMetadata: hookDispatcher.isPrivateCallbackHookDispatcherMetadata,
      mark: hookDispatcher.markPrivateCallbackHookDispatcher,
      isDispatcher: hookDispatcher.isPrivateCallbackHookDispatcher,
      assertReject: assertInvalidHookCall,
      createDispatcher() {
        return {
          useCallback() {
            throw new Error("unreachable callback dispatch");
          }
        };
      }
    },
    {
      label: "memo",
      hookName: "useMemo",
      metadata: hookDispatcher.privateMemoHookDispatcherMetadata,
      isMetadata: hookDispatcher.isPrivateMemoHookDispatcherMetadata,
      mark: hookDispatcher.markPrivateMemoHookDispatcher,
      isDispatcher: hookDispatcher.isPrivateMemoHookDispatcher,
      assertReject: assertInvalidHookCall,
      createDispatcher() {
        return {
          useMemo() {
            throw new Error("unreachable memo dispatch");
          }
        };
      }
    },
    {
      label: "effect",
      hookName: "useEffect",
      metadata: hookDispatcher.privateEffectHookDispatcherMetadata,
      isMetadata: hookDispatcher.isPrivateEffectHookDispatcherMetadata,
      mark: hookDispatcher.markPrivateEffectHookDispatcher,
      isDispatcher: hookDispatcher.isPrivateEffectHookDispatcher,
      assertReject: assertInvalidHookCall,
      createDispatcher() {
        return Object.fromEntries(
          effectDefaultHooks.map(([hookName]) => [
            hookName,
            function () {
              throw new Error(`unreachable ${hookName} dispatch`);
            }
          ])
        );
      }
    }
  ];

  for (const {
    label,
    hookName,
    metadata,
    isMetadata,
    mark,
    isDispatcher,
    assertReject,
    createDispatcher
  } of cases) {
    const clonedMetadata = { ...metadata };
    const extraClaimMetadata = {
      ...metadata,
      packageCompatibilityClaimed: true,
      publicCompatibilityClaimed: true,
      rootCompatibilityClaimed: true
    };
    const prototypeBackedMetadata = Object.create(metadata);
    let accessorReads = 0;
    const accessorBackedMetadata = Object.defineProperties(
      {},
      Object.fromEntries(
        Object.keys(metadata).map((key) => [
          key,
          {
            enumerable: true,
            get() {
              accessorReads += 1;
              throw new Error(`${label} metadata accessor inspected`);
            }
          }
        ])
      )
    );
    let proxyTrapCalls = 0;
    const trap = () => {
      proxyTrapCalls += 1;
      throw new Error(`${label} metadata proxy inspected`);
    };
    const proxyMetadata = new Proxy(metadata, {
      get: trap,
      getOwnPropertyDescriptor: trap,
      getPrototypeOf: trap,
      ownKeys: trap
    });

    assert.equal(isMetadata(clonedMetadata), false, `${label}: shallow clone`);
    assert.equal(
      isMetadata(extraClaimMetadata),
      false,
      `${label}: extra compatibility claims`
    );
    assert.equal(
      isMetadata(prototypeBackedMetadata),
      false,
      `${label}: prototype-backed metadata`
    );
    assert.equal(
      isMetadata(accessorBackedMetadata),
      false,
      `${label}: accessor-backed metadata`
    );
    assert.equal(accessorReads, 0, `${label}: accessor metadata inspected`);
    assert.equal(isMetadata(proxyMetadata), false, `${label}: proxy metadata`);
    assert.equal(proxyTrapCalls, 0, `${label}: proxy metadata inspected`);

    const dispatcher = createDispatcher();
    assertReject(() => mark(dispatcher, clonedMetadata), hookName);
    assert.equal(isDispatcher(dispatcher), false, `${label}: dispatcher marked`);
  }
});

test("useContext fails closed without a marked private context dispatcher", () => {
  const context = { $$typeof: Symbol.for("react.context") };

  assertInvalidHookCall(() => React.useContext(context), "useContext");

  const calls = [];
  const genericDispatcher = {
    useContext(value) {
      calls.push(value);
      return "context";
    }
  };

  hookDispatcher.ReactCurrentDispatcher.current = genericDispatcher;

  assertInvalidHookCall(() => React.useContext(context), "useContext");
  assertInvalidHookCall(
    () => hookDispatcher.markPrivateContextHookDispatcher(genericDispatcher),
    "useContext"
  );
  assert.deepEqual(calls, []);
  assert.equal(
    hookDispatcher.isPrivateContextHookDispatcher(genericDispatcher),
    false
  );
});

test("effect hooks fail closed without a marked private effect-hook dispatcher", () => {
  const calls = [];
  const genericDispatcher = Object.fromEntries(
    effectDefaultHooks.map(([hookName]) => [
      hookName,
      function (...args) {
        calls.push([hookName, args]);
        return `return:${hookName}`;
      }
    ])
  );

  hookDispatcher.ReactCurrentDispatcher.current = genericDispatcher;

  for (const [hookName, , args] of effectDefaultHooks) {
    assertInvalidHookCall(() => React[hookName](...args), hookName);
  }

  assertInvalidHookCall(
    () => hookDispatcher.markPrivateEffectHookDispatcher(genericDispatcher),
    "useEffect"
  );
  assert.deepEqual(calls, []);
  assert.equal(
    hookDispatcher.isPrivateEffectHookDispatcher(genericDispatcher),
    false
  );
});

test("accepted private hook methods stay public-blocked on an unmarked dispatcher", () => {
  const calls = [];
  const context = { $$typeof: Symbol.for("react.context") };
  const create = () => {
    calls.push("create");
  };
  const callback = () => {
    calls.push("callback");
    return "callback";
  };
  const dispatcher = {
    useCallback(...args) {
      calls.push(["useCallback", args]);
      return callback;
    },
    useContext(...args) {
      calls.push(["useContext", args]);
      return "context";
    },
    useEffect(...args) {
      calls.push(["useEffect", args]);
    },
    useImperativeHandle(...args) {
      calls.push(["useImperativeHandle", args]);
    },
    useInsertionEffect(...args) {
      calls.push(["useInsertionEffect", args]);
    },
    useLayoutEffect(...args) {
      calls.push(["useLayoutEffect", args]);
    },
    useMemo(...args) {
      calls.push(["useMemo", args]);
      return "memo";
    },
    useRef(...args) {
      calls.push(["useRef", args]);
      return { current: args[0] };
    },
    useReducer(...args) {
      calls.push(["useReducer", args]);
      return ["reducer"];
    },
    useState(...args) {
      calls.push(["useState", args]);
      return ["state"];
    }
  };

  hookDispatcher.ReactCurrentDispatcher.current = dispatcher;

  assertStateHookDispatcherUnavailable(() => React.useState(0), "useState");
  assertStateHookDispatcherUnavailable(
    () => React.useReducer((state) => state, 0),
    "useReducer"
  );
  assertInvalidHookCall(() => React.useCallback(callback, []), "useCallback");
  assertInvalidHookCall(() => React.useMemo(create, []), "useMemo");
  assertInvalidHookCall(() => React.useRef("ref"), "useRef");
  assertInvalidHookCall(() => React.useContext(context), "useContext");
  assertInvalidHookCall(() => React.useEffect(create, []), "useEffect");

  assert.deepEqual(calls, []);
});

test("selected public React hooks forward to the installed dispatcher", () => {
  const calls = [];
  const dispatcher = Object.fromEntries(
    dispatcherForwardedDefaultHooks.map(([hookName]) => [
      hookName,
      function (...args) {
        calls.push({
          args,
          hookName,
          thisMatchesDispatcher: this === dispatcher
        });
        return `return:${hookName}`;
      }
    ])
  );

  hookDispatcher.ReactCurrentDispatcher.current = dispatcher;

  for (const [hookName, , args] of dispatcherForwardedDefaultHooks) {
    assert.equal(React[hookName](...args), `return:${hookName}`, hookName);
  }

  assert.deepEqual(
    calls.map(({ hookName, args, thisMatchesDispatcher }) => ({
      args,
      hookName,
      thisMatchesDispatcher
    })),
    dispatcherForwardedDefaultHooks.map(([hookName, , args]) => ({
      args,
      hookName,
      thisMatchesDispatcher: true
    }))
  );
});

test("useCallback forwards only to a marked private callback-hook dispatcher", () => {
  const calls = [];
  const invokedCallbacks = [];
  const metadata = hookDispatcher.privateCallbackHookDispatcherMetadata;
  const dispatcher = hookDispatcher.markPrivateCallbackHookDispatcher(
    {
      useCallback(callback, deps, receivedMetadata) {
        calls.push({
          args: [callback, deps],
          hookName: "useCallback",
          metadata: receivedMetadata,
          thisMatchesDispatcher: this === dispatcher
        });
        return callback;
      }
    },
    metadata
  );
  const callback = () => {
    invokedCallbacks.push("called");
    return "callback-result";
  };

  hookDispatcher.ReactCurrentDispatcher.current = dispatcher;

  assert.equal(React.useCallback(callback, ["dep"]), callback);
  assert.equal(ReactServer.useCallback(callback, ["server-dep"]), callback);
  assert.deepEqual(invokedCallbacks, []);
  assert.deepEqual(calls, [
    {
      args: [callback, ["dep"]],
      hookName: "useCallback",
      metadata,
      thisMatchesDispatcher: true
    },
    {
      args: [callback, ["server-dep"]],
      hookName: "useCallback",
      metadata,
      thisMatchesDispatcher: true
    }
  ]);
  assert.equal(hookDispatcher.isPrivateCallbackHookDispatcher(dispatcher), true);
  assert.equal(
    hookDispatcher.getPrivateCallbackHookDispatcherMetadata(dispatcher),
    metadata
  );
});

test("useMemo forwards only to a marked private memo-hook dispatcher", () => {
  const calls = [];
  const invokedCreates = [];
  const metadata = hookDispatcher.privateMemoHookDispatcherMetadata;
  const dispatcher = hookDispatcher.markPrivateMemoHookDispatcher(
    {
      useMemo(create, deps, receivedMetadata) {
        calls.push({
          args: [create, deps],
          hookName: "useMemo",
          metadata: receivedMetadata,
          thisMatchesDispatcher: this === dispatcher
        });
        return "memoized-value";
      }
    },
    metadata
  );
  const create = () => {
    invokedCreates.push("called");
    return "memo";
  };

  hookDispatcher.ReactCurrentDispatcher.current = dispatcher;

  assert.equal(React.useMemo(create, ["dep"]), "memoized-value");
  assert.equal(ReactServer.useMemo(create, ["server-dep"]), "memoized-value");
  assert.deepEqual(invokedCreates, []);
  assert.deepEqual(calls, [
    {
      args: [create, ["dep"]],
      hookName: "useMemo",
      metadata,
      thisMatchesDispatcher: true
    },
    {
      args: [create, ["server-dep"]],
      hookName: "useMemo",
      metadata,
      thisMatchesDispatcher: true
    }
  ]);
  assert.equal(hookDispatcher.isPrivateMemoHookDispatcher(dispatcher), true);
  assert.equal(
    hookDispatcher.getPrivateMemoHookDispatcherMetadata(dispatcher),
    metadata
  );
});

test("useRef forwards only to a marked private ref-hook dispatcher", () => {
  const calls = [];
  const metadata = hookDispatcher.privateRefHookDispatcherMetadata;
  const refObject = { current: "private-ref" };
  const dispatcher = hookDispatcher.markPrivateRefHookDispatcher(
    {
      useRef(initialValue, receivedMetadata) {
        calls.push({
          args: [initialValue],
          hookName: "useRef",
          metadata: receivedMetadata,
          thisMatchesDispatcher: this === dispatcher
        });
        return refObject;
      }
    },
    metadata
  );

  hookDispatcher.ReactCurrentDispatcher.current = dispatcher;

  assert.equal(React.useRef("initial"), refObject);
  assert.equal(ReactServer.useRef, undefined);
  assert.deepEqual(calls, [
    {
      args: ["initial"],
      hookName: "useRef",
      metadata,
      thisMatchesDispatcher: true
    }
  ]);
  assert.equal(hookDispatcher.isPrivateRefHookDispatcher(dispatcher), true);
  assert.equal(
    hookDispatcher.getPrivateRefHookDispatcherMetadata(dispatcher),
    metadata
  );
});

test("useState and useReducer forward only to a marked private state-hook dispatcher", () => {
  const calls = [];
  const metadata = hookDispatcher.privateStateHookDispatcherMetadata;
  const dispatcher = hookDispatcher.markPrivateStateHookDispatcher(
    {
      useReducer(reducer, initialArg, init) {
        calls.push({
          args: [reducer, initialArg, init],
          hookName: "useReducer",
          thisMatchesDispatcher: this === dispatcher
        });
        return ["reducer", reducer(initialArg), init];
      },
      useState(initialState) {
        calls.push({
          args: [initialState],
          hookName: "useState",
          thisMatchesDispatcher: this === dispatcher
        });
        return [initialState, "dispatch"];
      }
    },
    metadata
  );

  hookDispatcher.ReactCurrentDispatcher.current = dispatcher;

  const reducer = (state) => state + 1;
  assert.deepEqual(React.useReducer(reducer, 0, "init"), [
    "reducer",
    1,
    "init"
  ]);
  assert.deepEqual(React.useState(5), [5, "dispatch"]);
  assert.deepEqual(calls, [
    {
      args: [reducer, 0, "init"],
      hookName: "useReducer",
      thisMatchesDispatcher: true
    },
    {
      args: [5],
      hookName: "useState",
      thisMatchesDispatcher: true
    }
  ]);
  assert.equal(hookDispatcher.isPrivateStateHookDispatcher(dispatcher), true);
  assert.equal(
    hookDispatcher.getPrivateStateHookDispatcherMetadata(dispatcher),
    metadata
  );
});

test("useContext forwards only to a marked private context dispatcher", () => {
  const calls = [];
  const metadata = hookDispatcher.privateContextHookDispatcherMetadata;
  const dispatcher = hookDispatcher.markPrivateContextHookDispatcher(
    {
      useContext(context) {
        calls.push({
          context,
          thisMatchesDispatcher: this === dispatcher
        });
        return context._currentValue;
      }
    },
    metadata
  );
  const context = {
    $$typeof: Symbol.for("react.context"),
    _currentValue: "private-context-value"
  };

  hookDispatcher.ReactCurrentDispatcher.current = dispatcher;

  assert.equal(React.useContext(context), "private-context-value");
  assert.deepEqual(calls, [
    {
      context,
      thisMatchesDispatcher: true
    }
  ]);
  assert.equal(hookDispatcher.isPrivateContextHookDispatcher(dispatcher), true);
  assert.equal(
    hookDispatcher.getPrivateContextHookDispatcherMetadata(dispatcher),
    metadata
  );
});

test("effect hooks forward only to a marked private effect-hook dispatcher", () => {
  const calls = [];
  const createdEffects = [];
  const metadata = hookDispatcher.privateEffectHookDispatcherMetadata;
  const passiveCreate = () => {
    createdEffects.push("passive");
  };
  const imperativeRef = { current: null };
  const imperativeCreate = () => {
    createdEffects.push("imperative");
    return "handle";
  };
  const insertionCreate = () => {
    createdEffects.push("insertion");
  };
  const layoutCreate = () => {
    createdEffects.push("layout");
  };
  const dispatcher = hookDispatcher.markPrivateEffectHookDispatcher(
    {
      useEffect(create, deps, receivedMetadata) {
        calls.push({
          args: [create, deps],
          hookName: "useEffect",
          metadata: receivedMetadata,
          thisMatchesDispatcher: this === dispatcher
        });
        return "return:useEffect";
      },
      useImperativeHandle(ref, create, deps, receivedMetadata) {
        calls.push({
          args: [ref, create, deps],
          hookName: "useImperativeHandle",
          metadata: receivedMetadata,
          thisMatchesDispatcher: this === dispatcher
        });
        return "return:useImperativeHandle";
      },
      useInsertionEffect(create, deps, receivedMetadata) {
        calls.push({
          args: [create, deps],
          hookName: "useInsertionEffect",
          metadata: receivedMetadata,
          thisMatchesDispatcher: this === dispatcher
        });
        return "return:useInsertionEffect";
      },
      useLayoutEffect(create, deps, receivedMetadata) {
        calls.push({
          args: [create, deps],
          hookName: "useLayoutEffect",
          metadata: receivedMetadata,
          thisMatchesDispatcher: this === dispatcher
        });
        return "return:useLayoutEffect";
      }
    },
    metadata
  );

  hookDispatcher.ReactCurrentDispatcher.current = dispatcher;

  assert.equal(
    React.useEffect(passiveCreate, ["passive-dep"]),
    "return:useEffect"
  );
  assert.equal(
    React.useImperativeHandle(
      imperativeRef,
      imperativeCreate,
      ["imperative-dep"]
    ),
    "return:useImperativeHandle"
  );
  assert.equal(
    React.useInsertionEffect(insertionCreate, ["insertion-dep"]),
    "return:useInsertionEffect"
  );
  assert.equal(
    React.useLayoutEffect(layoutCreate, ["layout-dep"]),
    "return:useLayoutEffect"
  );
  assert.deepEqual(createdEffects, []);
  assert.deepEqual(imperativeRef, { current: null });
  assert.deepEqual(calls, [
    {
      args: [passiveCreate, ["passive-dep"]],
      hookName: "useEffect",
      metadata: hookDispatcher.getEffectHookMetadata("useEffect"),
      thisMatchesDispatcher: true
    },
    {
      args: [imperativeRef, imperativeCreate, ["imperative-dep"]],
      hookName: "useImperativeHandle",
      metadata: hookDispatcher.getEffectHookMetadata("useImperativeHandle"),
      thisMatchesDispatcher: true
    },
    {
      args: [insertionCreate, ["insertion-dep"]],
      hookName: "useInsertionEffect",
      metadata: hookDispatcher.getEffectHookMetadata("useInsertionEffect"),
      thisMatchesDispatcher: true
    },
    {
      args: [layoutCreate, ["layout-dep"]],
      hookName: "useLayoutEffect",
      metadata: hookDispatcher.getEffectHookMetadata("useLayoutEffect"),
      thisMatchesDispatcher: true
    }
  ]);
  assert.equal(hookDispatcher.isPrivateEffectHookDispatcher(dispatcher), true);
  assert.equal(
    hookDispatcher.getPrivateEffectHookDispatcherMetadata(dispatcher),
    metadata
  );
});

test("react-server hooks share the generic guard while memo and callback stay private", () => {
  const calls = [];
  const dispatcher = {
    use(usable) {
      calls.push(["use", usable]);
      return "server-use";
    },
    useCallback(callback, deps) {
      calls.push(["useCallback", callback, deps]);
      return callback;
    },
    useMemo(create, deps) {
      calls.push(["useMemo", create, deps]);
      return create();
    }
  };

  hookDispatcher.ReactSharedInternals.H = dispatcher;

  const callback = () => "callback";
  const create = () => "memo";

  assert.equal(ReactServer.use("usable"), "server-use");
  assertInvalidHookCall(
    () => ReactServer.useCallback(callback, ["dep"]),
    "useCallback"
  );
  assertInvalidHookCall(() => ReactServer.useMemo(create, ["dep"]), "useMemo");
  assert.equal(ReactServer.useRef, undefined);
  assert.deepEqual(calls, [["use", "usable"]]);
});

function hasHookName(hooks, hookName) {
  return hooks.some(([candidateHookName]) => candidateHookName === hookName);
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
      assert.match(error.message, /https:\/\/react\.dev\/link\/invalid-hook-call/u, label);
      return true;
    },
    label
  );
}

function assertStateHookDispatcherUnavailable(callback, label) {
  assert.throws(
    callback,
    (error) => {
      assert.equal(error.name, "FastReactUnimplementedError", label);
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", label);
      assert.equal(error.entrypoint, "react", label);
      assert.equal(error.exportName, label, label);
      assert.equal(error.compatibilityTarget, "react@19.2.6", label);
      assert.match(error.message, /no React behavior implementation yet/u, label);
      assert.match(error.message, /private\/native hook dispatcher/u, label);
      return true;
    },
    label
  );
}
