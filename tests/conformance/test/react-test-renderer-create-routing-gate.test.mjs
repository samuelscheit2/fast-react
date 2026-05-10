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
const privateTestInstanceWrapperRecordSymbolDescription =
  "fast.react_test_renderer.private_test_instance_wrapper_record";
const privateTestInstanceWrapperRecordSymbol = Symbol.for(
  privateTestInstanceWrapperRecordSymbolDescription
);
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

test("react-test-renderer private TestInstance wrapper skeleton exposes record-only metadata", () => {
  for (const entry of entrypoints) {
    const moduleExports = loadFresh(entry.modulePath);
    const renderer = moduleExports.create({ type: "private-query-record" });
    const descriptor = Object.getOwnPropertyDescriptor(
      renderer,
      privateTestInstanceWrapperRecordSymbol
    );

    assert.equal(descriptor.enumerable, false, entry.entrypoint);
    assert.equal(descriptor.configurable, false, entry.entrypoint);
    assert.equal(descriptor.writable, false, entry.entrypoint);
    assertPrivateTestInstanceWrapperSkeleton(
      descriptor.value,
      entry.entrypoint
    );

    const rootError = captureThrown(() => renderer.root);
    assertReactTestRendererUnimplemented(
      rootError,
      entry.entrypoint,
      "create().root"
    );
    assert.equal(
      rootError.routingGate.privateTestInstanceWrapperSkeleton,
      descriptor.value,
      entry.entrypoint
    );
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
  assert.deepEqual(
    Reflect.ownKeys(renderer).filter((key) => typeof key === "string"),
    rendererKeys,
    label
  );
  assert.deepEqual(
    Object.getOwnPropertySymbols(renderer),
    [privateTestInstanceWrapperRecordSymbol],
    label
  );
  assert.equal(Object.hasOwn(renderer, "routingGate"), false, label);
  assert.equal(Object.hasOwn(renderer, "missingPrerequisites"), false, label);
  assert.equal(
    Object.keys(renderer).includes(
      privateTestInstanceWrapperRecordSymbolDescription
    ),
    false,
    label
  );
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
  assertPrivateTestInstanceWrapperSkeleton(
    gate.privateTestInstanceWrapperSkeleton,
    entrypoint
  );
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

function assertPrivateTestInstanceWrapperSkeleton(record, entrypoint) {
  assert.equal(Object.isFrozen(record), true, entrypoint);
  assert.equal(
    record.id,
    "react-test-renderer-private-test-instance-wrapper-skeleton",
    entrypoint
  );
  assert.equal(
    record.status,
    "private-record-ready-public-test-instance-blocked",
    entrypoint
  );
  assert.equal(record.entrypoint, entrypoint);
  assert.equal(record.deterministic, true, entrypoint);
  assert.equal(
    record.symbol,
    privateTestInstanceWrapperRecordSymbolDescription,
    entrypoint
  );
  assert.equal(record.publicRootAvailable, false, entrypoint);
  assert.equal(record.publicQueryMethodsAvailable, false, entrypoint);
  assert.equal(record.publicTestInstanceObjectAvailable, false, entrypoint);
  assert.equal(record.nativeBridgeAvailable, false, entrypoint);
  assert.equal(record.nativeExecution, false, entrypoint);
  assert.equal(record.compatibilityClaimed, false, entrypoint);

  const fiberInspection = record.fiberInspection;
  assert.equal(Object.isFrozen(fiberInspection), true, entrypoint);
  assert.equal(
    fiberInspection.acceptedWorker,
    "worker-235-test-renderer-private-fiber-inspection",
    entrypoint
  );
  assert.equal(
    fiberInspection.acceptedRustCrate,
    "fast-react-reconciler",
    entrypoint
  );
  assert.equal(
    fiberInspection.acceptedRustModule,
    "private_fiber_inspection",
    entrypoint
  );
  assert.deepEqual(fiberInspection.acceptedRustApis, [
    "inspect_test_renderer_committed_fiber_tree",
    "TestRendererCommittedFiberTreeInspection::host_component",
    "TestRendererCommittedFiberTreeInspection::host_text",
    "TestRendererCommittedFiberNodeInspection::element_type",
    "TestRendererCommittedFiberNodeInspection::memoized_props"
  ]);
  assert.deepEqual(fiberInspection.acceptedRustTests, [
    "committed_fiber_inspection_describes_host_root_component_and_text",
    "committed_fiber_inspection_rejects_empty_current_host_root"
  ]);
  assert.deepEqual(fiberInspection.committedShape, [
    "HostRoot",
    "HostComponent",
    "HostText"
  ]);
  assert.equal(fiberInspection.exposesHostNodes, false, entrypoint);
  assert.equal(fiberInspection.mutatesFibers, false, entrypoint);

  assert.equal(Object.isFrozen(record.queryRecords), true, entrypoint);
  assert.deepEqual(Object.keys(record.queryRecords), [
    "root",
    "type",
    "props",
    "children"
  ]);
  assert.equal(record.rootQueryRecord, record.queryRecords.root, entrypoint);
  assertPrivateQueryRecord(
    record.queryRecords.root,
    "root",
    "react-test-renderer-private-test-instance-root-query",
    entrypoint
  );
  assertPrivateQueryRecord(
    record.queryRecords.type,
    "type",
    "react-test-renderer-private-test-instance-type-query",
    entrypoint
  );
  assertPrivateQueryRecord(
    record.queryRecords.props,
    "props",
    "react-test-renderer-private-test-instance-props-query",
    entrypoint
  );
  assertPrivateQueryRecord(
    record.queryRecords.children,
    "children",
    "react-test-renderer-private-test-instance-children-query",
    entrypoint
  );

  const rootRecord = record.rootQueryRecord.result;
  assert.equal(Object.isFrozen(rootRecord), true, entrypoint);
  assert.equal(
    rootRecord.id,
    "react-test-renderer-private-test-instance-root-record",
    entrypoint
  );
  assert.equal(rootRecord.kind, "ReactTestInstancePrivateRecord", entrypoint);
  assert.equal(rootRecord.publicObject, false, entrypoint);
  assert.equal(rootRecord.fiberTag, "HostComponent", entrypoint);
  assert.equal(rootRecord.type, "span", entrypoint);
  assert.equal(Object.isFrozen(rootRecord.props), true, entrypoint);
  assert.deepEqual(rootRecord.props, {});
  assert.equal(Object.isFrozen(rootRecord.children), true, entrypoint);
  assert.equal(rootRecord.children.length, 1, entrypoint);
  assert.equal(rootRecord.queryRecords.type, record.queryRecords.type);
  assert.equal(rootRecord.queryRecords.props, record.queryRecords.props);
  assert.equal(rootRecord.queryRecords.children, record.queryRecords.children);

  const textChild = rootRecord.children[0];
  assert.equal(Object.isFrozen(textChild), true, entrypoint);
  assert.deepEqual(textChild, {
    id: "react-test-renderer-private-test-instance-host-text-child",
    kind: "ReactTestInstancePrivateTextChildRecord",
    fiberTag: "HostText",
    source: "TestRendererCommittedFiberTreeInspection::host_text",
    text: "hello",
    publicObject: false
  });

  for (const queryName of testInstanceQuerySurfaceNames) {
    assert.equal(
      Object.hasOwn(rootRecord, queryName),
      false,
      `${entrypoint} ${queryName}`
    );
  }
}

function assertPrivateQueryRecord(record, query, id, label) {
  assert.equal(Object.isFrozen(record), true, `${label} ${query}`);
  assert.equal(record.id, id, label);
  assert.equal(record.query, query, label);
  assert.equal(record.deterministic, true, label);

  if (query === "root") {
    assert.equal(
      record.status,
      "private-record-ready-public-root-blocked",
      label
    );
    assert.equal(record.publicSurface, "create().root", label);
    assert.equal(record.publicAccessAvailable, false, label);
    assert.equal(
      record.source,
      "TestRendererCommittedFiberTreeInspection::host_component",
      label
    );
    return;
  }

  assert.equal(record.fiberTag, "HostComponent", label);
  assert.equal(record.publicQueryMethodAvailable, false, label);
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
