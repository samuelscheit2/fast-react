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

const invalidHookCallDefaultHooks = selectedDefaultHooks.filter(
  ([hookName]) => !hasHookName(statefulDefaultHooks, hookName)
);

const dispatcherForwardedDefaultHooks = selectedDefaultHooks.filter(
  ([hookName]) =>
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

test("useState and useReducer fail closed without a private state-hook dispatcher", () => {
  for (const [hookName, , args] of statefulDefaultHooks) {
    assertStateHookDispatcherUnavailable(() => React[hookName](...args), hookName);
  }

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

  assert.deepEqual(calls, []);
  assert.equal(
    hookDispatcher.isPrivateStateHookDispatcher(genericDispatcher),
    false
  );
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

test("useState and useReducer forward only to a marked private state-hook dispatcher", () => {
  const calls = [];
  const dispatcher = hookDispatcher.markPrivateStateHookDispatcher({
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
  });

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

test("react-server hooks share the dispatcher guard with the default React entrypoint", () => {
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
  assert.equal(ReactServer.useCallback(callback, ["dep"]), callback);
  assert.equal(ReactServer.useMemo(create, ["dep"]), "memo");
  assert.deepEqual(calls, [
    ["use", "usable"],
    ["useCallback", callback, ["dep"]],
    ["useMemo", create, ["dep"]]
  ]);
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
