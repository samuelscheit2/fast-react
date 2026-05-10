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
const privateRouteStatus = "blocked-js-native-bridge-not-loaded";
const privateRootBridgeStatus =
  "blocked-private-test-renderer-root-bridge-execution";
const privateRootCompatibilityStatus =
  "blocked-private-test-renderer-root-bridge-compatibility";
const rootLifecycleActive = "Active";
const rootLifecycleUnmountScheduled = "UnmountScheduled";
const rootUpdateOutcomeScheduled = "Scheduled";
const rootUpdateOutcomeIgnoredAfterUnmount = "IgnoredAfterUnmount";
const rootUpdateOutcomeAlreadyUnmountScheduled = "AlreadyUnmountScheduled";
const expectedPrivateRoutes = [
  {
    acceptedRustApis: [
      "TestRendererRoot::update_host_component_with_text_for_canary",
      "TestRendererRoot::render_and_commit_host_output_update_for_canary"
    ],
    acceptedRustTests: [
      "root_host_output_canary_updates_committed_text_with_update_diagnostics",
      "root_host_output_update_canary_fails_closed_without_committed_output"
    ],
    id: "react-test-renderer-update-private-route",
    publicSurface: "create().update"
  },
  {
    acceptedRustApis: [
      "TestRendererRoot::unmount",
      "TestRendererRoot::render_and_commit_host_output_unmount_for_canary"
    ],
    acceptedRustTests: [
      "root_host_output_canary_unmounts_committed_output_with_deletion_diagnostics"
    ],
    id: "react-test-renderer-unmount-private-route",
    publicSurface: "create().unmount"
  }
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
    assertRendererShape(
      firstRenderer,
      entry.entrypoint,
      moduleExports._Scheduler
    );
    assertRendererShape(
      secondRenderer,
      `${entry.entrypoint} second create`,
      moduleExports._Scheduler
    );

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
      let actCallbackInvoked = false;
      const actError = captureThrown(() =>
        moduleExports.act(() => {
          actCallbackInvoked = true;
          throw new Error("must not run act callback");
        })
      );
      assert.equal(actCallbackInvoked, false, entry.entrypoint);
      assertReactTestRendererUnimplemented(actError, entry.entrypoint, "act");
      assert.equal(Object.hasOwn(actError, "routingGate"), false);
    }

    let scheduledCallbackInvoked = false;
    const schedulerError = captureThrown(() =>
      moduleExports._Scheduler.unstable_scheduleCallback(
        moduleExports._Scheduler.unstable_NormalPriority,
        () => {
          scheduledCallbackInvoked = true;
        }
      )
    );
    assert.equal(scheduledCallbackInvoked, false, entry.entrypoint);
    assertReactTestRendererUnimplemented(
      schedulerError,
      entry.entrypoint,
      "_Scheduler.unstable_scheduleCallback"
    );
    assert.equal(Object.hasOwn(schedulerError, "routingGate"), false);
  }
});

test("react-test-renderer update and unmount routing metadata points at accepted Rust canaries", () => {
  for (const entry of entrypoints) {
    const moduleExports = loadFresh(entry.modulePath);
    const renderer = moduleExports.create("child");
    const updateError = captureThrown(() => renderer.update("next"));
    const unmountError = captureThrown(() => renderer.unmount());

    assertReactTestRendererUnimplemented(
      updateError,
      entry.entrypoint,
      "create().update"
    );
    assertReactTestRendererUnimplemented(
      unmountError,
      entry.entrypoint,
      "create().unmount"
    );
    assertCreateRoutingGate(updateError, entry.entrypoint);
    assertCreateRoutingGate(unmountError, entry.entrypoint);
    assert.equal(
      updateError.updatePrivateRoute.publicSurface,
      "create().update"
    );
    assert.equal(
      unmountError.unmountPrivateRoute.publicSurface,
      "create().unmount"
    );
    assert.equal(updateError.privateRoutes, updateError.routingGate.privateRoutes);
    assert.equal(
      unmountError.privateRoutes,
      unmountError.routingGate.privateRoutes
    );
    assert.deepEqual(updateError.privateRoutes, unmountError.privateRoutes);
  }
});

test("react-test-renderer private root bridge records update and unmount lifecycle requests", () => {
  for (const entry of entrypoints) {
    const moduleExports = loadFresh(entry.modulePath);
    const initialElement = { type: "initial" };
    const nextElement = { type: "next" };
    const lateElement = { type: "late" };
    const renderer = moduleExports.create(initialElement, {
      unstable_strictMode: true
    });

    const updateError = captureThrown(() => renderer.update(nextElement));
    assertReactTestRendererUnimplemented(
      updateError,
      entry.entrypoint,
      "create().update"
    );
    assertCreateRoutingGate(updateError, entry.entrypoint);
    assertPrivateRootCreateRequest(updateError.privateRootCreateRequest);
    assertPrivateRootRequestDiagnostics(updateError, {
      historyLength: 2,
      lifecycle: rootLifecycleActive,
      operation: "update",
      requestSequence: 2,
      scheduledUpdateCount: 2
    });
    assertPrivateRootRequest(updateError.privateRootRequest, {
      containerUpdateApi: "update_container",
      expectedElementInfo: { type: "object" },
      lifecycleStatusAfter: rootLifecycleActive,
      lifecycleStatusBefore: rootLifecycleActive,
      operation: "update",
      requestSequence: 2,
      requestType: "TestRendererRoot::update",
      scheduledUpdateCountAfter: 2,
      scheduledUpdateCountBefore: 1,
      scheduledUpdateSequence: 2,
      schedulesRootUpdate: true,
      sync: false,
      updateKind: "Update",
      updateOutcome: rootUpdateOutcomeScheduled
    });

    const unmountError = captureThrown(() => renderer.unmount());
    assertReactTestRendererUnimplemented(
      unmountError,
      entry.entrypoint,
      "create().unmount"
    );
    assertCreateRoutingGate(unmountError, entry.entrypoint);
    assertPrivateRootRequestDiagnostics(unmountError, {
      historyLength: 3,
      lifecycle: rootLifecycleUnmountScheduled,
      operation: "unmount",
      requestSequence: 3,
      scheduledUpdateCount: 3
    });
    assertPrivateRootRequest(unmountError.privateRootRequest, {
      containerUpdateApi: "update_container_sync",
      expectedElementInfo: { type: "null" },
      lifecycleStatusAfter: rootLifecycleUnmountScheduled,
      lifecycleStatusBefore: rootLifecycleActive,
      operation: "unmount",
      requestSequence: 3,
      requestType: "TestRendererRoot::unmount",
      scheduledElement: {
        isNone: true,
        kind: "RootElementHandle::NONE"
      },
      scheduledUpdateCountAfter: 3,
      scheduledUpdateCountBefore: 2,
      scheduledUpdateSequence: 3,
      schedulesRootUpdate: true,
      sync: true,
      updateKind: "Unmount",
      updateOutcome: rootUpdateOutcomeScheduled
    });

    const secondUnmountError = captureThrown(() => renderer.unmount());
    assertReactTestRendererUnimplemented(
      secondUnmountError,
      entry.entrypoint,
      "create().unmount"
    );
    assertCreateRoutingGate(secondUnmountError, entry.entrypoint);
    assertPrivateRootRequestDiagnostics(secondUnmountError, {
      historyLength: 4,
      lifecycle: rootLifecycleUnmountScheduled,
      operation: "unmount",
      requestSequence: 4,
      scheduledUpdateCount: 3
    });
    assertPrivateRootRequest(secondUnmountError.privateRootRequest, {
      containerUpdateApi: null,
      expectedElementInfo: { type: "null" },
      lifecycleStatusAfter: rootLifecycleUnmountScheduled,
      lifecycleStatusBefore: rootLifecycleUnmountScheduled,
      operation: "unmount",
      requestSequence: 4,
      requestType: "TestRendererRoot::unmount",
      scheduledElement: {
        isNone: true,
        kind: "RootElementHandle::NONE"
      },
      scheduledUpdateCountAfter: 3,
      scheduledUpdateCountBefore: 3,
      scheduledUpdateSequence: null,
      schedulesRootUpdate: false,
      sync: null,
      updateKind: "Unmount",
      updateOutcome: rootUpdateOutcomeAlreadyUnmountScheduled
    });

    const lateUpdateError = captureThrown(() => renderer.update(lateElement));
    assertReactTestRendererUnimplemented(
      lateUpdateError,
      entry.entrypoint,
      "create().update"
    );
    assertCreateRoutingGate(lateUpdateError, entry.entrypoint);
    assertPrivateRootRequestDiagnostics(lateUpdateError, {
      historyLength: 5,
      lifecycle: rootLifecycleUnmountScheduled,
      operation: "update",
      requestSequence: 5,
      scheduledUpdateCount: 3
    });
    assertPrivateRootRequest(lateUpdateError.privateRootRequest, {
      containerUpdateApi: null,
      expectedElementInfo: { type: "object" },
      lifecycleStatusAfter: rootLifecycleUnmountScheduled,
      lifecycleStatusBefore: rootLifecycleUnmountScheduled,
      operation: "update",
      requestSequence: 5,
      requestType: "TestRendererRoot::update",
      scheduledElement: null,
      scheduledUpdateCountAfter: 3,
      scheduledUpdateCountBefore: 3,
      scheduledUpdateSequence: null,
      schedulesRootUpdate: false,
      sync: null,
      updateKind: "Update",
      updateOutcome: rootUpdateOutcomeIgnoredAfterUnmount
    });

    assert.equal(
      lateUpdateError.privateRootRequestHistory[0],
      lateUpdateError.privateRootCreateRequest
    );
    assert.deepEqual(
      lateUpdateError.privateRootRequestHistory.map(
        (record) => record.updateOutcome
      ),
      [
        rootUpdateOutcomeScheduled,
        rootUpdateOutcomeScheduled,
        rootUpdateOutcomeScheduled,
        rootUpdateOutcomeAlreadyUnmountScheduled,
        rootUpdateOutcomeIgnoredAfterUnmount
      ]
    );
  }
});

test("react-test-renderer TestInstance query and serialization surfaces stay public fail-closed", () => {
  for (const entry of entrypoints) {
    const moduleExports = loadFresh(entry.modulePath);
    const renderer = moduleExports.create({ type: "blocked-query" });
    assertRendererShape(renderer, entry.entrypoint, moduleExports._Scheduler);
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

function assertRendererShape(renderer, label, moduleScheduler) {
  assert.deepEqual(Object.keys(renderer), rendererKeys, label);
  assert.deepEqual(Object.getOwnPropertyNames(renderer), rendererKeys, label);
  assert.deepEqual(Reflect.ownKeys(renderer), rendererKeys, label);
  assert.equal(Object.hasOwn(renderer, "routingGate"), false, label);
  assert.equal(Object.hasOwn(renderer, "missingPrerequisites"), false, label);
  assert.equal(renderer._Scheduler, moduleScheduler, label);

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

  assert.equal(error.privateRoutes, gate.privateRoutes);
  assert.equal(error.updatePrivateRoute, gate.updatePrivateRoute);
  assert.equal(error.unmountPrivateRoute, gate.unmountPrivateRoute);
  assert.equal(Object.isFrozen(gate.privateRoutes), true);
  assert.deepEqual(
    gate.privateRoutes.map((privateRoute) => privateRoute.id),
    expectedPrivateRoutes.map((privateRoute) => privateRoute.id)
  );
  assert.equal(gate.privateRoutes[0], gate.updatePrivateRoute);
  assert.equal(gate.privateRoutes[1], gate.unmountPrivateRoute);
  assertPrivateRoute(gate.updatePrivateRoute, expectedPrivateRoutes[0]);
  assertPrivateRoute(gate.unmountPrivateRoute, expectedPrivateRoutes[1]);
}

function assertPrivateRoute(privateRoute, expected) {
  assert.equal(Object.isFrozen(privateRoute), true);
  assert.equal(privateRoute.id, expected.id);
  assert.equal(privateRoute.publicSurface, expected.publicSurface);
  assert.equal(privateRoute.status, privateRouteStatus);
  assert.equal(privateRoute.deterministic, true);
  assert.equal(privateRoute.publicRouteAvailable, false);
  assert.equal(privateRoute.privateRustCanaryAccepted, true);
  assert.equal(privateRoute.nativeBridgeAvailable, false);
  assert.equal(privateRoute.nativeExecution, false);
  assert.equal(
    privateRoute.acceptedWorker,
    "worker-234-test-renderer-host-output-update-unmount-canary"
  );
  assert.equal(privateRoute.acceptedRustCrate, "fast-react-test-renderer");
  assert.equal(Object.isFrozen(privateRoute.acceptedRustApis), true);
  assert.deepEqual(privateRoute.acceptedRustApis, expected.acceptedRustApis);
  assert.equal(Object.isFrozen(privateRoute.acceptedRustTests), true);
  assert.deepEqual(privateRoute.acceptedRustTests, expected.acceptedRustTests);
}

function assertPrivateRootCreateRequest(createRequest) {
  assertPrivateRootRequest(createRequest, {
    containerUpdateApi: "update_container",
    expectedElementInfo: { type: "object" },
    lifecycleStatusAfter: rootLifecycleActive,
    lifecycleStatusBefore: null,
    operation: "create",
    requestSequence: 1,
    requestType: "TestRendererRoot::create",
    scheduledUpdateCountAfter: 1,
    scheduledUpdateCountBefore: 0,
    scheduledUpdateSequence: 1,
    schedulesRootUpdate: true,
    sync: false,
    updateKind: "Create",
    updateOutcome: rootUpdateOutcomeScheduled
  });
  assert.deepEqual(createRequest.optionsInfo, { type: "object" });
}

function assertPrivateRootRequestDiagnostics(error, expected) {
  assert.equal(error.privateRootBridgeStatus, privateRootBridgeStatus);
  assert.equal(
    error.privateRootCompatibilityStatus,
    privateRootCompatibilityStatus
  );
  assert.equal(Object.isFrozen(error.privateRootBridgeState), true);
  assert.equal(error.privateRootBridgeState.rootId, "test-renderer-root:1");
  assert.equal(error.privateRootBridgeState.rootKind, "test-renderer");
  assert.equal(error.privateRootBridgeState.rootTag, "ConcurrentRoot");
  assert.equal(error.privateRootBridgeState.lifecycle, expected.lifecycle);
  assert.equal(
    error.privateRootBridgeState.scheduledUpdateCount,
    expected.scheduledUpdateCount
  );
  assert.equal(error.privateRootBridgeState.nativeBridgeAvailable, false);
  assert.equal(error.privateRootBridgeState.nativeExecution, false);
  assert.equal(error.privateRootBridgeState.reconcilerExecution, false);
  assert.equal(error.privateRootBridgeState.compatibilityClaimed, false);
  assert.equal(Object.isFrozen(error.privateRootRequestHistory), true);
  assert.equal(error.privateRootRequestHistory.length, expected.historyLength);
  assert.equal(
    error.privateRootRequest,
    error.privateRootRequestHistory[error.privateRootRequestHistory.length - 1]
  );
  assert.equal(error.privateRootRequest.operation, expected.operation);
  assert.equal(error.privateRootRequest.requestSequence, expected.requestSequence);
  assert.equal(error.routingGate.updateRouteAvailable, false);
  assert.equal(error.routingGate.unmountRouteAvailable, false);
  assert.equal(error.updatePrivateRoute.publicRouteAvailable, false);
  assert.equal(error.unmountPrivateRoute.publicRouteAvailable, false);
}

function assertPrivateRootRequest(record, expected) {
  assert.equal(Object.isFrozen(record), true);
  assert.equal(
    record.$$typeof,
    "fast.react_test_renderer.private_root_request_record"
  );
  assert.equal(record.kind, "FastReactTestRendererPrivateRootRequestRecord");
  assert.equal(record.operation, expected.operation);
  assert.equal(
    record.requestId,
    `test-renderer-request:${expected.requestSequence}`
  );
  assert.equal(record.requestSequence, expected.requestSequence);
  assert.equal(record.requestType, expected.requestType);
  assert.equal(record.rootId, "test-renderer-root:1");
  assert.equal(record.rootKind, "test-renderer");
  assert.equal(record.rootTag, "ConcurrentRoot");
  assert.equal(record.lifecycleStatusBefore, expected.lifecycleStatusBefore);
  assert.equal(record.lifecycleStatusAfter, expected.lifecycleStatusAfter);
  assert.equal(
    record.lifecycleTransition,
    `${expected.lifecycleStatusBefore === null ? "none" : expected.lifecycleStatusBefore}->${expected.lifecycleStatusAfter}`
  );
  assert.equal(record.updateKind, expected.updateKind);
  assert.equal(record.updateOutcome, expected.updateOutcome);
  assert.equal(
    record.scheduledUpdateCountBefore,
    expected.scheduledUpdateCountBefore
  );
  assert.equal(
    record.scheduledUpdateCountAfter,
    expected.scheduledUpdateCountAfter
  );
  assert.equal(record.schedulesRootUpdate, expected.schedulesRootUpdate);
  assert.equal(record.scheduledUpdateSequence, expected.scheduledUpdateSequence);
  assert.equal(
    record.scheduledUpdateId,
    expected.scheduledUpdateSequence === null
      ? null
      : `root-update:${expected.scheduledUpdateSequence}`
  );
  assert.deepEqual(record.elementInfo, expected.expectedElementInfo);
  assert.equal(Object.isFrozen(record.rootUpdateCallbacks), true);
  assert.deepEqual(record.rootUpdateCallbacks, {
    deferredHiddenCount: 0,
    empty: true,
    hiddenCount: 0,
    visibleCount: 0
  });
  assert.equal(Object.isFrozen(record.owner), true);
  assert.equal(Object.isFrozen(record.handle), true);
  assert.equal(record.owner.$$typeof, "fast.react_test_renderer.private_root_owner");
  assert.equal(record.handle.$$typeof, "fast.react_test_renderer.private_root_handle");
  assert.equal(record.handle.owner, record.owner);
  assert.equal(record.nativeBridgeAvailable, false);
  assert.equal(record.nativeExecution, false);
  assert.equal(record.reconcilerExecution, false);
  assert.equal(record.hostOutputMutation, false);
  assert.equal(record.serialization, false);
  assert.equal(record.actIntegration, false);
  assert.equal(record.compatibilityClaimed, false);
  assert.equal(Object.isFrozen(record.blockedCapabilities), true);
  assert.deepEqual(
    record.blockedCapabilities.map((capability) => capability.id),
    [
      "native-execution",
      "reconciler-execution",
      "host-output-mutation",
      "serialization",
      "act-integration",
      "compatibility-claims"
    ]
  );

  if (expected.scheduledElement === undefined) {
    assert.equal(Object.isFrozen(record.scheduledElement), true);
    assert.equal(record.scheduledElement.kind, "OpaqueJsRootElement");
    assert.equal(record.scheduledElement.isNone, false);
    assert.deepEqual(
      record.scheduledElement.valueInfo,
      expected.expectedElementInfo
    );
  } else {
    assert.deepEqual(record.scheduledElement, expected.scheduledElement);
  }

  if (expected.containerUpdateApi === null) {
    assert.equal(record.containerUpdate, null);
    assert.equal(record.rootSchedule, null);
  } else {
    assert.equal(Object.isFrozen(record.containerUpdate), true);
    assert.equal(record.containerUpdate.api, expected.containerUpdateApi);
    assert.equal(record.containerUpdate.includesSyncLane, expected.sync);
    assert.equal(
      record.containerUpdate.lane,
      expected.sync ? "SyncLane" : "update_container-selected-lane"
    );
    assert.deepEqual(record.containerUpdate.callbackInfo, {
      type: "undefined"
    });
    assert.equal(record.containerUpdate.nativeExecution, false);
    assert.equal(record.containerUpdate.reconcilerExecution, false);
    assert.equal(Object.isFrozen(record.rootSchedule), true);
    assert.equal(record.rootSchedule.api, "ensure_root_is_scheduled");
    assert.equal(record.rootSchedule.requested, true);
    assert.equal(record.rootSchedule.mightHavePendingSyncWork, expected.sync);
    assert.equal(record.rootSchedule.nativeExecution, false);
    assert.equal(record.rootSchedule.reconcilerExecution, false);
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
