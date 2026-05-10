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

const effectDefaultHooks = [
  ["useEffect", 2, [() => undefined, []]],
  ["useImperativeHandle", 3, [{ current: null }, () => "handle", []]],
  ["useInsertionEffect", 2, [() => undefined, []]],
  ["useLayoutEffect", 2, [() => undefined, []]]
];

const invalidHookCallDefaultHooks = selectedDefaultHooks.filter(
  ([hookName]) => !hasHookName(statefulDefaultHooks, hookName)
);

const dispatcherForwardedDefaultHooks = selectedDefaultHooks.filter(
  ([hookName]) =>
    !hasHookName(statefulDefaultHooks, hookName) &&
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
    useEffect(create, deps) {
      calls.push({
        args: [create, deps],
        hookName: "useEffect",
        thisMatchesDispatcher: this === dispatcher
      });
      return "return:useEffect";
    },
    useImperativeHandle(ref, create, deps) {
      calls.push({
        args: [ref, create, deps],
        hookName: "useImperativeHandle",
        thisMatchesDispatcher: this === dispatcher
      });
      return "return:useImperativeHandle";
    },
    useInsertionEffect(create, deps) {
      calls.push({
        args: [create, deps],
        hookName: "useInsertionEffect",
        thisMatchesDispatcher: this === dispatcher
      });
      return "return:useInsertionEffect";
    },
    useLayoutEffect(create, deps) {
      calls.push({
        args: [create, deps],
        hookName: "useLayoutEffect",
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
      thisMatchesDispatcher: true
    },
    {
      args: [imperativeRef, imperativeCreate, ["imperative-dep"]],
      hookName: "useImperativeHandle",
      thisMatchesDispatcher: true
    },
    {
      args: [insertionCreate, ["insertion-dep"]],
      hookName: "useInsertionEffect",
      thisMatchesDispatcher: true
    },
    {
      args: [layoutCreate, ["layout-dep"]],
      hookName: "useLayoutEffect",
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
