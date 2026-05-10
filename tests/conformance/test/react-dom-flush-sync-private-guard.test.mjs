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
const reactDomRootPath = path.join(repoRoot, "packages", "react-dom", "index.js");
const reactDomProfilingPath = path.join(
  repoRoot,
  "packages",
  "react-dom",
  "profiling.js"
);
const flushSyncGuardPath = path.join(
  repoRoot,
  "packages",
  "react-dom",
  "src",
  "shared",
  "flush-sync-guard.js"
);

const {
  finishFlushSyncGuard,
  flushSyncGuardErrorCode,
  flushSyncReentrantWarning,
  getDispatcherFlushSyncWork,
  isDevelopmentMode
} = require(flushSyncGuardPath);

test("private flushSync guard invokes the dispatcher flush hook without warning when work can flush", () => {
  const events = [];
  const warnings = [];
  const dispatcher = {
    f() {
      events.push("flushSyncWork");
      return false;
    }
  };

  const wasInRender = finishFlushSyncGuard(dispatcher, {
    console: {
      error(message) {
        warnings.push(message);
      }
    },
    development: true
  });

  assert.equal(wasInRender, false);
  assert.deepEqual(events, ["flushSyncWork"]);
  assert.deepEqual(warnings, []);
});

test("private flushSync guard reports React-compatible development reentry warnings", () => {
  const warnings = [];
  const dispatcher = {
    f() {
      return true;
    }
  };

  const wasInRender = finishFlushSyncGuard(dispatcher, {
    console: {
      error(message) {
        warnings.push(message);
      }
    },
    development: true
  });

  assert.equal(wasInRender, true);
  assert.deepEqual(warnings, [flushSyncReentrantWarning]);
});

test("private flushSync guard suppresses reentry warnings in production mode", () => {
  const warnings = [];
  const dispatcher = {
    f() {
      return true;
    }
  };

  const wasInRender = finishFlushSyncGuard(dispatcher, {
    console: {
      error(message) {
        warnings.push(message);
      }
    },
    development: false
  });

  assert.equal(wasInRender, true);
  assert.deepEqual(warnings, []);
});

test("private flushSync guard rejects missing dispatcher hooks as internal wiring errors", () => {
  assert.throws(
    () => getDispatcherFlushSyncWork({}),
    (error) => {
      assert.equal(error.name, "FastReactDomFlushSyncGuardError");
      assert.equal(error.code, flushSyncGuardErrorCode);
      assert.match(error.message, /requires a private dispatcher/u);
      return true;
    }
  );
});

test("private flushSync guard uses NODE_ENV only when no explicit development option is provided", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    assert.equal(isDevelopmentMode(), false);
    assert.equal(isDevelopmentMode({ development: true }), true);
    assert.equal(isDevelopmentMode({ development: false }), false);

    process.env.NODE_ENV = "development";
    assert.equal(isDevelopmentMode(), true);
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
});

test("public React DOM flushSync remains an unsupported placeholder", () => {
  assertPublicFlushSyncPlaceholder(require(reactDomRootPath), "react-dom");
});

test("public React DOM profiling flushSync remains an unsupported placeholder", () => {
  assertPublicFlushSyncPlaceholder(
    require(reactDomProfilingPath),
    "react-dom/profiling"
  );
});

function assertPublicFlushSyncPlaceholder(ReactDOM, entrypoint) {
  const descriptor = Object.getOwnPropertyDescriptor(ReactDOM, "flushSync");
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
  assert.equal(typeof descriptor.value, "function");
  assert.equal(descriptor.value.name, "");
  assert.equal(descriptor.value.length, 1);

  let callbackCalled = false;
  assert.throws(
    () =>
      descriptor.value(() => {
        callbackCalled = true;
      }),
    (error) => {
      assert.equal(error.name, "FastReactDomUnimplementedError");
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
      assert.equal(error.entrypoint, entrypoint);
      assert.equal(error.exportName, "flushSync");
      assert.equal(error.compatibilityTarget, "react-dom@19.2.6");
      assert.match(
        error.message,
        /placeholder has no React DOM behavior implementation yet/u
      );
      return true;
    }
  );
  assert.equal(callbackCalled, false);
}
