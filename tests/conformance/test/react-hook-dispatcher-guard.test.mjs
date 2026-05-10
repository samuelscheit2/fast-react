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
  "dependencies",
  "fiber_flags"
];
const passiveEffectMetadataFieldNames = [
  "fiber",
  "hook_list",
  "effect_index",
  "effect",
  "instance",
  "tag",
  "create",
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
    assert.equal(metadata.effectPhaseEnumName, "FunctionComponentEffectPhase");
    assert.equal(metadata.effectPhaseName, expected.effectPhaseName, hookName);
    assert.equal(metadata.effectRegistrationRecordName, "FunctionComponentEffectRegistration");
    assert.deepEqual(metadata.effectRegistrationFieldNames, effectRegistrationFieldNames);
    assert.equal(metadata.executesEffectCallback, false, hookName);
    assert.equal(metadata.fiberFlagsRecordName, "FiberFlags");
    assert.equal(metadata.hookEffectFlagsRecordName, "HookEffectFlags");
    assert.equal(metadata.hookEffectFlagName, expected.hookEffectFlagName, hookName);
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

test("private callback-hook dispatcher metadata names match accepted memo records", () => {
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
    "previousCallback",
    "previousDependencies",
    "requestedCallback",
    "callback",
    "dependencies",
    "dependencyStatus"
  ]);
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

test("private callback-hook dispatcher marker rejects dependency metadata drift", () => {
  const dispatcher = {
    useCallback() {
      throw new Error("unreachable callback dispatch");
    }
  };
  const driftedMetadata = {
    ...hookDispatcher.privateCallbackHookDispatcherMetadata,
    dependencyStatusNames: ["Changed"]
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

  assert.deepEqual(calls, []);
  assert.equal(
    hookDispatcher.isPrivateEffectHookDispatcher(genericDispatcher),
    false
  );
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
  const dispatcher = hookDispatcher.markPrivateContextHookDispatcher({
    useContext(context) {
      calls.push({
        context,
        thisMatchesDispatcher: this === dispatcher
      });
      return context._currentValue;
    }
  });
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
});

test("effect hooks forward only to a marked private effect-hook dispatcher", () => {
  const calls = [];
  const createdEffects = [];
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
  const dispatcher = hookDispatcher.markPrivateEffectHookDispatcher({
    useEffect(create, deps, metadata) {
      calls.push({
        args: [create, deps],
        hookName: "useEffect",
        metadata,
        thisMatchesDispatcher: this === dispatcher
      });
      return "return:useEffect";
    },
    useImperativeHandle(ref, create, deps, metadata) {
      calls.push({
        args: [ref, create, deps],
        hookName: "useImperativeHandle",
        metadata,
        thisMatchesDispatcher: this === dispatcher
      });
      return "return:useImperativeHandle";
    },
    useInsertionEffect(create, deps, metadata) {
      calls.push({
        args: [create, deps],
        hookName: "useInsertionEffect",
        metadata,
        thisMatchesDispatcher: this === dispatcher
      });
      return "return:useInsertionEffect";
    },
    useLayoutEffect(create, deps, metadata) {
      calls.push({
        args: [create, deps],
        hookName: "useLayoutEffect",
        metadata,
        thisMatchesDispatcher: this === dispatcher
      });
      return "return:useLayoutEffect";
    }
  });

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
