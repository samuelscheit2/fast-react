import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const require = createRequire(import.meta.url);
const Module = require("node:module");
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);

const compatibilityTarget = "react-test-renderer@19.2.6";
const routingGateStatus =
  "blocked-missing-react-test-renderer-create-routing-prerequisites";
const missingPrerequisites = [
  "rust-native-test-renderer-create-bridge",
  "react-test-renderer-host-output-serialization"
];
const moduleKeys = [
  "_Scheduler",
  "act",
  "create",
  "unstable_batchedUpdates",
  "version"
];
const rendererKeys = [
  "_Scheduler",
  "root",
  "toJSON",
  "toTree",
  "update",
  "unmount",
  "getInstance",
  "unstable_flushSync"
];
const testInstanceQuerySurfaceNames = [
  "find",
  "findAll",
  "findByType",
  "findAllByType",
  "findByProps",
  "findAllByProps"
];
const schedulerMockKeys = [
  "log",
  "reset",
  "unstable_IdlePriority",
  "unstable_ImmediatePriority",
  "unstable_LowPriority",
  "unstable_NormalPriority",
  "unstable_Profiling",
  "unstable_UserBlockingPriority",
  "unstable_advanceTime",
  "unstable_cancelCallback",
  "unstable_clearLog",
  "unstable_flushAll",
  "unstable_flushAllWithoutAsserting",
  "unstable_flushExpired",
  "unstable_flushNumberOfYields",
  "unstable_flushUntilNextPaint",
  "unstable_forceFrameRate",
  "unstable_getCurrentPriorityLevel",
  "unstable_hasPendingWork",
  "unstable_next",
  "unstable_now",
  "unstable_requestPaint",
  "unstable_runWithPriority",
  "unstable_scheduleCallback",
  "unstable_setDisableYieldValue",
  "unstable_shouldYield",
  "unstable_wrapCallback"
];
const entrypoints = [
  {
    entrypoint: "react-test-renderer",
    modulePath: "packages/react-test-renderer/index.js",
    production: false
  },
  {
    entrypoint: "react-test-renderer/cjs/react-test-renderer.development",
    modulePath:
      "packages/react-test-renderer/cjs/react-test-renderer.development.js",
    production: false
  },
  {
    entrypoint: "react-test-renderer/cjs/react-test-renderer.production",
    modulePath:
      "packages/react-test-renderer/cjs/react-test-renderer.production.js",
    production: true
  }
];

test("react-test-renderer create shell exposes routing gate metadata without changing public keys", () => {
  for (const entry of entrypoints) {
    const moduleExports = loadFresh(entry.modulePath);

    assert.deepEqual(Object.keys(moduleExports), moduleKeys, entry.entrypoint);
    assert.equal(moduleExports.__FAST_REACT_PLACEHOLDER__, true);
    assert.equal(moduleExports.__FAST_REACT_ENTRYPOINT__, entry.entrypoint);
    assert.equal(moduleExports.compatibilityTarget, compatibilityTarget);
    assert.equal(moduleExports.version, "0.0.0-fast-react-test-renderer-placeholder");
    assert.equal(moduleExports.create.length, 2);
    assert.equal(
      entry.production ? moduleExports.act : moduleExports.act.length,
      entry.production ? undefined : 1
    );

    const firstRenderer = moduleExports.create({ type: "placeholder" });
    const secondRenderer = moduleExports.create(null);
    assertRendererShape(firstRenderer, entry.entrypoint);
    assertRendererShape(secondRenderer, `${entry.entrypoint} second create`);

    const firstError = captureThrown(() => firstRenderer.toJSON());
    const secondError = captureThrown(() => secondRenderer.toJSON());
    assertReactTestRendererUnimplemented(
      firstError,
      entry.entrypoint,
      "create().toJSON"
    );
    assertReactTestRendererUnimplemented(
      secondError,
      entry.entrypoint,
      "create().toJSON"
    );
    assertCreateRoutingGate(firstError, entry.entrypoint);
    assertCreateRoutingGate(secondError, entry.entrypoint);
    assert.deepEqual(firstError.routingGate, secondError.routingGate);
  }
});

test("react-test-renderer create shell keeps every behaviorful renderer surface fail-closed", () => {
  for (const entry of entrypoints) {
    const moduleExports = loadFresh(entry.modulePath);
    const renderer = moduleExports.create("child");
    const operations = [
      {
        exportName: "create().root",
        run: () => renderer.root
      },
      {
        exportName: "create().toJSON",
        run: () => renderer.toJSON()
      },
      {
        exportName: "create().toTree",
        run: () => renderer.toTree()
      },
      {
        exportName: "create().update",
        run: () => renderer.update("next")
      },
      {
        exportName: "create().unmount",
        run: () => renderer.unmount()
      },
      {
        exportName: "create().getInstance",
        run: () => renderer.getInstance()
      },
      {
        exportName: "create().unstable_flushSync",
        run: () => renderer.unstable_flushSync(() => {
          throw new Error("must not run flushSync callback");
        })
      }
    ];

    for (const operation of operations) {
      const error = captureThrown(operation.run);
      assertReactTestRendererUnimplemented(
        error,
        entry.entrypoint,
        operation.exportName
      );
      assertCreateRoutingGate(error, entry.entrypoint);
    }

    if (entry.production) {
      assert.equal(moduleExports.act, undefined, entry.entrypoint);
    } else {
      const actError = captureThrown(() =>
        moduleExports.act(() => {
          throw new Error("must not run act callback");
        })
      );
      assertReactTestRendererUnimplemented(actError, entry.entrypoint, "act");
      assert.equal(Object.hasOwn(actError, "routingGate"), false);
    }

    const schedulerError = captureThrown(() =>
      moduleExports._Scheduler.unstable_scheduleCallback()
    );
    assertReactTestRendererUnimplemented(
      schedulerError,
      entry.entrypoint,
      "_Scheduler.unstable_scheduleCallback"
    );
    assert.equal(Object.hasOwn(schedulerError, "routingGate"), false);
  }
});

test("react-test-renderer TestInstance query and serialization surfaces stay public fail-closed", () => {
  for (const entry of entrypoints) {
    const moduleExports = loadFresh(entry.modulePath);
    const renderer = moduleExports.create({ type: "blocked-query" });
    assertRendererShape(renderer, entry.entrypoint);
    assertNoPublicTestInstanceQueryMethods(renderer, entry.entrypoint);

    const rootError = captureThrown(() => renderer.root);
    assertReactTestRendererUnimplemented(
      rootError,
      entry.entrypoint,
      "create().root"
    );
    assertCreateRoutingGate(rootError, entry.entrypoint);
    assert.match(
      rootError.message,
      /TestInstance root access is intentionally blocked/u
    );

    for (const queryName of testInstanceQuerySurfaceNames) {
      let predicateCalled = false;
      const queryError = captureThrown(() => {
        const root = renderer.root;
        return root[queryName](() => {
          predicateCalled = true;
          return true;
        });
      });

      assert.equal(predicateCalled, false, `${entry.entrypoint} ${queryName}`);
      assertReactTestRendererUnimplemented(
        queryError,
        entry.entrypoint,
        "create().root"
      );
      assertCreateRoutingGate(queryError, entry.entrypoint);
    }

    for (const operation of [
      {
        exportName: "create().toJSON",
        detail: /Serialization is intentionally blocked/u,
        run: () => renderer.toJSON()
      },
      {
        exportName: "create().toTree",
        detail: /Fiber tree inspection is intentionally blocked/u,
        run: () => renderer.toTree()
      }
    ]) {
      const error = captureThrown(operation.run);
      assertReactTestRendererUnimplemented(
        error,
        entry.entrypoint,
        operation.exportName
      );
      assertCreateRoutingGate(error, entry.entrypoint);
      assert.match(error.message, operation.detail);
      assert.equal(error.routingGate.serializationAvailable, false);
      assert.equal(error.routingGate.compatibilityClaimed, false);
    }
  }
});

test("react-test-renderer create routing gate does not load native bridge artifacts", () => {
  const originalLoad = Module._load;
  const originalNodeExtension = Module._extensions[".node"];
  const forbiddenLoads = [];

  function recordForbiddenLoad(kind, request) {
    forbiddenLoads.push({ kind, request: String(request) });
    const error = new Error(`Forbidden native load attempted: ${request}`);
    error.forbiddenLoad = forbiddenLoads[forbiddenLoads.length - 1];
    throw error;
  }

  Module._extensions[".node"] = function blockedNodeExtension(_module, filename) {
    recordForbiddenLoad("node-extension", filename);
  };
  Module._load = function guardedModuleLoad(request, parent, isMain) {
    if (isForbiddenNativeLoad(request)) {
      recordForbiddenLoad("module-load", request);
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    for (const entry of entrypoints) {
      const moduleExports = loadFresh(entry.modulePath);
      const renderer = moduleExports.create(null);

      assertCreateRoutingGate(captureThrown(() => renderer.root), entry.entrypoint);
      assertCreateRoutingGate(
        captureThrown(() => renderer.toJSON()),
        entry.entrypoint
      );
      assertCreateRoutingGate(
        captureThrown(() => renderer.update(null)),
        entry.entrypoint
      );
      assertCreateRoutingGate(
        captureThrown(() => renderer.unmount()),
        entry.entrypoint
      );
    }
  } finally {
    Module._load = originalLoad;
    Module._extensions[".node"] = originalNodeExtension;
  }

  assert.deepEqual(forbiddenLoads, []);
});

function loadFresh(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  const resolved = require.resolve(absolutePath);
  delete require.cache[resolved];
  return require(resolved);
}

function assertRendererShape(renderer, label) {
  assert.deepEqual(Object.keys(renderer), rendererKeys, label);
  assert.deepEqual(Object.getOwnPropertyNames(renderer), rendererKeys, label);
  assert.deepEqual(Reflect.ownKeys(renderer), rendererKeys, label);
  assert.equal(Object.hasOwn(renderer, "routingGate"), false, label);
  assert.equal(Object.hasOwn(renderer, "missingPrerequisites"), false, label);

  const rootDescriptor = Object.getOwnPropertyDescriptor(renderer, "root");
  assert.equal(rootDescriptor.configurable, true, label);
  assert.equal(rootDescriptor.enumerable, true, label);
  assert.equal(rootDescriptor.set, undefined, label);
  assert.equal(rootDescriptor.get.length, 0, label);
  assert.equal(renderer.toJSON.length, 0, label);
  assert.equal(renderer.toTree.length, 0, label);
  assert.equal(renderer.update.length, 1, label);
  assert.equal(renderer.unmount.length, 0, label);
  assert.equal(renderer.getInstance.length, 0, label);
  assert.equal(renderer.unstable_flushSync.length, 1, label);
  assert.deepEqual(Object.keys(renderer._Scheduler), schedulerMockKeys, label);
}

function assertNoPublicTestInstanceQueryMethods(renderer, label) {
  for (const queryName of testInstanceQuerySurfaceNames) {
    assert.equal(Object.hasOwn(renderer, queryName), false, label);
    assert.equal(queryName in renderer, false, label);
  }
}

function assertReactTestRendererUnimplemented(error, entrypoint, exportName) {
  assert.equal(error.name, "FastReactTestRendererUnimplementedError");
  assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
  assert.equal(error.entrypoint, entrypoint);
  assert.equal(error.exportName, exportName);
  assert.equal(error.compatibilityTarget, compatibilityTarget);
  assert.match(
    error.message,
    /no React Test Renderer behavior implementation yet/
  );
}

function assertCreateRoutingGate(error, entrypoint) {
  assert.equal(error.routingGateStatus, routingGateStatus);
  assert.deepEqual(error.missingPrerequisites, missingPrerequisites);
  assert.equal(error.nativeBridgeAvailable, false);
  assert.equal(error.serializationAvailable, false);
  assert.equal(error.compatibilityClaimed, false);

  const gate = error.routingGate;
  assert.equal(Object.isFrozen(gate), true);
  assert.equal(gate.id, "react-test-renderer-create-routing-prerequisite-gate");
  assert.equal(gate.status, routingGateStatus);
  assert.equal(gate.entrypoint, entrypoint);
  assert.equal(gate.deterministic, true);
  assert.equal(gate.nativeBridgeAvailable, false);
  assert.equal(gate.nativeExecution, false);
  assert.equal(gate.createRouteAvailable, false);
  assert.equal(gate.updateRouteAvailable, false);
  assert.equal(gate.unmountRouteAvailable, false);
  assert.equal(gate.serializationAvailable, false);
  assert.equal(gate.actIntegrationAvailable, false);
  assert.equal(gate.schedulerIntegrationAvailable, false);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(Object.isFrozen(gate.missingPrerequisites), true);
  assert.deepEqual(gate.missingPrerequisites, missingPrerequisites);
  assert.equal(Object.isFrozen(gate.prerequisites), true);
  assert.deepEqual(
    gate.prerequisites.map((prerequisite) => prerequisite.id),
    missingPrerequisites
  );

  for (const prerequisite of gate.prerequisites) {
    assert.equal(Object.isFrozen(prerequisite), true);
    assert.equal(prerequisite.present, false);
    assert.equal(prerequisite.requiredBeforeCreateRouting, true);
    assert.match(prerequisite.reason, /JS package/u);
  }
}

function captureThrown(callback) {
  try {
    callback();
  } catch (error) {
    return error;
  }

  assert.fail("Expected callback to throw");
}

function isForbiddenNativeLoad(request) {
  const specifier = String(request);
  return (
    specifier.endsWith(".node") ||
    specifier.startsWith("@fast-react/native") ||
    specifier.includes("fast_react_napi")
  );
}
