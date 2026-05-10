import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  readCheckedReactTestRendererErrorSurfaceOracle
} from "../src/react-test-renderer-error-surface-oracle.mjs";
import {
  evaluateReactTestRendererErrorSurfaceLocalGate
} from "../src/react-test-renderer-serialization-local-gate.mjs";

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
const actSchedulerGateStatus =
  "blocked-private-react-test-renderer-act-scheduler-metadata-only";
const rootRequestBridgeSymbol = Symbol.for(
  "fast.react_test_renderer.root_request_bridge"
);
const rootRequestStatus =
  "admitted-private-test-renderer-root-request-record";
const rootRequestExecutionStatus =
  "blocked-private-test-renderer-root-request-execution";
const rootRequestCompatibilityStatus =
  "blocked-private-test-renderer-root-compatibility";
const privateTestInstanceWrapperRecordSymbolDescription =
  "fast.react_test_renderer.private_test_instance_wrapper_record";
const privateTestInstanceWrapperRecordSymbol = Symbol.for(
  privateTestInstanceWrapperRecordSymbolDescription
);
const missingPrerequisites = [
  "rust-native-test-renderer-create-bridge",
  "react-test-renderer-host-output-serialization"
];
const actSchedulerMissingBeforeExecution = [
  "public-react-test-renderer-act-queue-drain",
  "public-react-test-renderer-scheduler-flush-execution",
  "public-react-test-renderer-root-sync-flush-route",
  "react-test-renderer-renderer-roots-compatibility-admission",
  "react-test-renderer-passive-effect-callback-execution",
  "react-test-renderer-private-root-request-execution"
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
const errorSurfacePrivateRoutingRowIds = [
  "react-test-renderer-create-routing-private-diagnostic",
  "react-test-renderer-update-route-private-diagnostic",
  "react-test-renderer-unmount-route-private-diagnostic"
];
const errorSurfacePrivateDiagnosticRowIds = [
  ...errorSurfacePrivateRoutingRowIds,
  "react-test-renderer-serialization-private-json-diagnostic",
  "react-test-renderer-test-instance-private-fiber-diagnostic",
  "react-test-renderer-act-scheduler-private-diagnostic"
];
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
const actSchedulerFlushHelperMetadata = [
  ["unstable_flushAll", { type: "function", name: "", length: 0 }],
  [
    "unstable_flushAllWithoutAsserting",
    {
      type: "function",
      name: "unstable_flushAllWithoutAsserting",
      length: 0
    }
  ],
  ["unstable_flushExpired", { type: "function", name: "", length: 0 }],
  ["unstable_flushNumberOfYields", { type: "function", name: "", length: 1 }],
  ["unstable_flushUntilNextPaint", { type: "function", name: "", length: 0 }]
];
const actSchedulerRootRecordIds = [
  "act-root-schedule-request",
  "act-render-callback-request"
];
const actSchedulerReactDispatcherRecordIds = [
  "react-act-private-dispatcher-gate"
];
const actSchedulerSyncFlushRecordIds = [
  "sync-flush-act-continuation-record",
  "sync-flush-act-post-passive-continuation-gate",
  "sync-flush-post-passive-continuation-execution-gate"
];
const actSchedulerPassiveRecordIds = [
  "pending-passive-commit-handoff",
  "passive-effects-flush-record",
  "function-component-pending-passive-effect-phase-record"
];
const actSchedulerRootFlushRecordIds = [
  "test-renderer-private-root-request-bridge",
  "test-renderer-private-root-update-unmount-lifecycle"
];
const acceptedPrivateActFlushPrerequisiteIds = [
  "react-act-private-dispatcher-gate",
  "scheduler-act-queue-routing-records",
  "scheduler-mock-flush-helper-metadata",
  "sync-flush-act-continuation-records",
  "sync-flush-post-passive-continuation-execution-gate",
  "passive-effect-flush-metadata",
  "test-renderer-private-root-request-records"
];
const blockedPrivateActFlushPrerequisiteIds = [
  "private-act-queue-drain-execution",
  "private-scheduler-flush-helper-execution",
  "private-passive-effect-callback-execution",
  "private-test-renderer-root-request-execution",
  "private-test-renderer-host-output-commit"
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
      assertActSchedulerGate(actError.actSchedulerGate, entry.entrypoint);
      assert.equal(actError.queuedWorkExecution, false);
      assert.equal(actError.rendererRootsCompatibilityClaimed, false);
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
    assertActSchedulerGate(schedulerError.actSchedulerGate, entry.entrypoint);
    assert.equal(schedulerError.queuedWorkExecution, false);
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

test("react-test-renderer private root request bridge records Rust canary-shaped requests", () => {
  for (const entry of entrypoints) {
    const moduleExports = loadFresh(entry.modulePath);
    const bridge = assertPrivateRootRequestBridge(
      moduleExports,
      entry.entrypoint
    );
    const element = { props: { children: "hello" }, type: "div" };
    const options = {
      createNodeMock() {
        throw new Error("must not run createNodeMock");
      },
      unstable_isConcurrent: true,
      unstable_strictMode: true
    };
    const renderer = moduleExports.create(element, options);
    const rootHandle = bridge.getRendererRootHandle(renderer);

    assert.deepEqual(Object.keys(moduleExports), moduleKeys, entry.entrypoint);
    assertRendererShape(renderer, entry.entrypoint, moduleExports._Scheduler);
    assert.equal(Object.isFrozen(rootHandle), true, entry.entrypoint);
    assert.equal(rootHandle.lifecycleStatus, "active", entry.entrypoint);

    const [createRequest] = bridge.getRendererRootRequests(renderer);
    assertRootRequest(createRequest, {
      entrypoint: entry.entrypoint,
      lifecycleStatusAfter: "active",
      lifecycleStatusBefore: null,
      operation: "create",
      requestSequence: 1,
      requestType: "TestRendererRoot.create",
      rootElementHandleRaw: 1,
      rootHandle,
      rustOutcome: "Scheduled",
      scheduled: true,
      sync: false,
      updateKind: "Create"
    });
    assert.equal(
      bridge.getRustCanaryMetadata(createRequest),
      createRequest.rustCanaryMetadata
    );
    assert.equal(
      bridge.getRustCanaryOperationMetadata(createRequest),
      createRequest.rustCanaryOperationMetadata
    );
    assert.equal(createRequest.optionsInfo.strictMode, true);
    assert.equal(createRequest.optionsInfo.hasCreateNodeMock, true);
    assert.equal(createRequest.optionsInfo.concurrentModeRequested, true);
    assert.equal(bridge.getRequestPayload(createRequest).element, element);
    assert.equal(bridge.getRequestPayload(createRequest).rootOptions, options);

    const nextElement = { props: { children: "goodbye" }, type: "span" };
    const updateError = captureThrown(() => renderer.update(nextElement));
    assertReactTestRendererUnimplemented(
      updateError,
      entry.entrypoint,
      "create().update"
    );
    assertRootRequest(updateError.rootRequest, {
      entrypoint: entry.entrypoint,
      lifecycleStatusAfter: "active",
      lifecycleStatusBefore: "active",
      operation: "update",
      requestSequence: 2,
      requestType: "TestRendererRoot.update",
      rootElementHandleRaw: 2,
      rootHandle,
      rustOutcome: "Scheduled",
      scheduled: true,
      sync: false,
      updateKind: "Update"
    });
    assert.equal(
      bridge.getRustCanaryOperationMetadata(updateError.rootRequest),
      updateError.rootRequest.rustCanaryMetadata.operations.update
    );
    assert.equal(
      bridge.getRequestPayload(updateError.rootRequest).element,
      nextElement
    );

    const unmountError = captureThrown(() => renderer.unmount());
    assertReactTestRendererUnimplemented(
      unmountError,
      entry.entrypoint,
      "create().unmount"
    );
    assertRootRequest(unmountError.rootRequest, {
      entrypoint: entry.entrypoint,
      lifecycleStatusAfter: "unmount-scheduled",
      lifecycleStatusBefore: "active",
      operation: "unmount",
      requestSequence: 3,
      requestType: "TestRendererRoot.unmount",
      rootElementHandleRaw: 0,
      rootHandle,
      rustOutcome: "Scheduled",
      scheduled: true,
      sync: true,
      updateKind: "Unmount"
    });
    assert.equal(
      bridge.getRustCanaryOperationMetadata(unmountError.rootRequest),
      unmountError.rootRequest.rustCanaryMetadata.operations.unmount
    );

    const ignoredUpdateError = captureThrown(() =>
      renderer.update("ignored after unmount")
    );
    assertRootRequest(ignoredUpdateError.rootRequest, {
      entrypoint: entry.entrypoint,
      lifecycleStatusAfter: "unmount-scheduled",
      lifecycleStatusBefore: "unmount-scheduled",
      operation: "update",
      requestSequence: 4,
      requestType: "TestRendererRoot.update",
      rootElementHandleRaw: 0,
      rootHandle,
      rustOutcome: "IgnoredAfterUnmount",
      scheduled: false,
      sync: false,
      updateKind: "Update"
    });

    const secondUnmountError = captureThrown(() => renderer.unmount());
    assertRootRequest(secondUnmountError.rootRequest, {
      entrypoint: entry.entrypoint,
      lifecycleStatusAfter: "unmount-scheduled",
      lifecycleStatusBefore: "unmount-scheduled",
      operation: "unmount",
      requestSequence: 5,
      requestType: "TestRendererRoot.unmount",
      rootElementHandleRaw: 0,
      rootHandle,
      rustOutcome: "AlreadyUnmountScheduled",
      scheduled: false,
      sync: false,
      updateKind: "Unmount"
    });

    const requests = bridge.getRendererRootRequests(renderer);
    assert.equal(Object.isFrozen(requests), true, entry.entrypoint);
    assert.deepEqual(
      requests.map((request) => request.operation),
      ["create", "update", "unmount", "update", "unmount"],
      entry.entrypoint
    );
    assert.deepEqual(
      requests.map((request) => request.rustUpdateKind),
      [
        "TestRendererRootUpdateKind::Create",
        "TestRendererRootUpdateKind::Update",
        "TestRendererRootUpdateKind::Unmount",
        "TestRendererRootUpdateKind::Update",
        "TestRendererRootUpdateKind::Unmount"
      ],
      entry.entrypoint
    );
  }
});

test("react-test-renderer create routing gate feeds only private error diagnostic rows", () => {
  const gate = evaluateReactTestRendererErrorSurfaceLocalGate({
    oracle: readCheckedReactTestRendererErrorSurfaceOracle()
  });

  assert.deepEqual(
    gate.privateDiagnosticRows.map((row) => row.id),
    errorSurfacePrivateDiagnosticRowIds
  );
  assert.deepEqual(
    gate.privateDiagnosticRows
      .filter(
        (row) =>
          row.area === "create routing" ||
          row.area === "root update" ||
          row.area === "root unmount"
      )
      .map((row) => row.id),
    errorSurfacePrivateRoutingRowIds
  );
  assert.deepEqual(gate.admittedPublicScenarios, []);
  assert.equal(gate.localChecks.createRoutingGatePresent, true);
  assert.equal(gate.localChecks.updatePrivateRoutePresent, true);
  assert.equal(gate.localChecks.unmountPrivateRoutePresent, true);
  assert.equal(
    gate.localChecks.privateToJSONSerializationFacadeGatePresent,
    true
  );
  assert.equal(
    gate.localChecks.privateToJSONSerializationFacadePubliclyBlocked,
    true
  );
  assert.equal(
    gate.localChecks.privateRecordOnlyTestInstanceWrapperPresent,
    true
  );
  assert.equal(gate.localChecks.privateActQueueMetadataPresent, true);
  assert.equal(gate.localChecks.passiveEffectMetadataOnly, true);
  assert.equal(gate.localChecks.publicCreateUpdateUnmountErrorSurfaceBlocked, true);
  assert.equal(gate.localChecks.publicCreateUpdateUnmountErrorSurfaceReady, false);
  assert.equal(gate.localChecks.publicSerializationErrorSurfaceReady, false);
  assert.equal(gate.localChecks.publicTestInstanceErrorSurfaceReady, false);
  assert.equal(gate.localChecks.publicActSchedulerErrorSurfaceReady, false);
  assert.equal(gate.publicCompatibilityReady, false);
  assert.equal(gate.publicCompatibilityClaimed, false);

  const invalidCreateUpdateScenario = gate.publicScenarioAdmissions.find(
    (scenario) => scenario.scenarioId === "invalid-create-update-inputs"
  );
  assert.notEqual(invalidCreateUpdateScenario, undefined);
  assert.equal(
    invalidCreateUpdateScenario.status,
    "blocked-public-react-test-renderer-error-surface-compatibility"
  );
  assert.equal(invalidCreateUpdateScenario.publicComparisonBlocked, true);
  assert.equal(
    invalidCreateUpdateScenario.admittedForFastReactComparison,
    false
  );
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

function assertPrivateRootRequestBridge(moduleExports, entrypoint) {
  assert.equal(Object.hasOwn(moduleExports, "rootRequestBridge"), false);
  assert.equal(
    Object.hasOwn(
      moduleExports,
      "__FAST_REACT_PRIVATE_ROOT_REQUEST_BRIDGE__"
    ),
    false
  );
  assert.equal(Object.keys(moduleExports.create).length, 0, entrypoint);

  const descriptor = Object.getOwnPropertyDescriptor(
    moduleExports.create,
    rootRequestBridgeSymbol
  );
  assert.notEqual(descriptor, undefined, entrypoint);
  assert.equal(descriptor.enumerable, false, entrypoint);
  assert.equal(descriptor.configurable, false, entrypoint);
  assert.equal(descriptor.writable, false, entrypoint);

  const bridge = descriptor.value;
  assert.equal(Object.isFrozen(bridge), true, entrypoint);
  assert.equal(
    bridge.bridgeKind,
    "FastReactTestRendererPrivateRootRequestBridge",
    entrypoint
  );
  assert.equal(bridge.entrypoint, entrypoint);
  assert.equal(bridge.status, rootRequestStatus);
  assert.equal(bridge.executionStatus, rootRequestExecutionStatus);
  assert.equal(bridge.compatibilityStatus, rootRequestCompatibilityStatus);
  assert.equal(bridge.nativeBridgeAvailable, false);
  assert.equal(bridge.nativeExecution, false);
  assert.equal(bridge.rustExecution, false);
  assert.equal(bridge.recordOnlyBridge, true);
  assertRustCanaryMetadata(bridge.rustCanaryMetadata, entrypoint);
  assert.equal(typeof bridge.createRootRequest, "function");
  assert.equal(typeof bridge.updateRootRequest, "function");
  assert.equal(typeof bridge.unmountRootRequest, "function");
  assert.equal(typeof bridge.getRendererRootRequests, "function");
  assert.equal(typeof bridge.getRequestPayload, "function");
  assert.equal(typeof bridge.getRustCanaryMetadata, "function");
  assert.equal(typeof bridge.getRustCanaryOperationMetadata, "function");
  assert.equal(bridge.getRustCanaryMetadata(), bridge.rustCanaryMetadata);

  return bridge;
}

function assertRootRequest(request, expected) {
  assert.equal(Object.isFrozen(request), true, expected.entrypoint);
  assert.equal(
    request.kind,
    "FastReactTestRendererPrivateRootRequestRecord",
    expected.entrypoint
  );
  assert.equal(request.entrypoint, expected.entrypoint);
  assert.equal(request.compatibilityTarget, compatibilityTarget);
  assert.equal(request.operation, expected.operation);
  assert.equal(request.requestSequence, expected.requestSequence);
  assert.equal(request.requestType, expected.requestType);
  assert.equal(request.status, rootRequestStatus);
  assert.equal(request.executionStatus, rootRequestExecutionStatus);
  assert.equal(request.compatibilityStatus, rootRequestCompatibilityStatus);
  assert.equal(request.lifecycleStatusBefore, expected.lifecycleStatusBefore);
  assert.equal(request.lifecycleStatusAfter, expected.lifecycleStatusAfter);
  assert.equal(request.scheduled, expected.scheduled);
  assert.equal(request.rustOutcome, expected.rustOutcome);
  assert.equal(request.rootHandle, expected.rootHandle);
  assert.equal(request.rootElementHandle.raw, expected.rootElementHandleRaw);
  assert.equal(
    request.rootElementHandle.isNone,
    expected.rootElementHandleRaw === 0
  );
  assert.equal(request.updateKind, expected.updateKind);
  assert.equal(
    request.rustUpdateKind,
    `TestRendererRootUpdateKind::${expected.updateKind}`
  );
  assert.equal(request.rootApi, `TestRendererRoot::${expected.operation}`);
  assert.equal(
    request.containerUpdateApi,
    expected.operation === "unmount"
      ? "update_container_sync"
      : "update_container"
  );
  assert.equal(request.schedulerApi, "ensure_root_is_scheduled");
  assert.equal(request.nativeBridgeAvailable, false);
  assert.equal(request.nativeExecution, false);
  assert.equal(request.rustExecution, false);
  assert.equal(request.reconcilerExecution, false);
  assert.equal(request.hostOutputProduced, false);
  assert.equal(request.serializationAvailable, false);
  assert.equal(request.compatibilityClaimed, false);
  assert.equal(request.sync, expected.sync);
  assertRustCanaryMetadata(request.rustCanaryMetadata, expected.entrypoint);
  assert.equal(
    request.rustCanaryOperationMetadata,
    request.rustCanaryMetadata.operations[expected.operation]
  );
  assertRustCanaryOperationMetadata(
    request.rustCanaryOperationMetadata,
    expected
  );
  assert.equal(Object.isFrozen(request.canaryShape), true);
  assert.equal(request.canaryShape.rootType, "TestRendererRoot");
  assert.equal(request.canaryShape.rootElementHandleType, "RootElementHandle");
  assert.equal(
    request.canaryShape.updateKindEnum,
    "TestRendererRootUpdateKind"
  );
  assert.equal(request.canaryShape.updateKind, expected.updateKind);
  assert.equal(request.canaryShape.rootApi, request.rootApi);
  assert.equal(
    request.canaryShape.containerUpdateApi,
    request.containerUpdateApi
  );
  assert.equal(request.canaryShape.schedulerApi, "ensure_root_is_scheduled");
  assert.equal(request.canaryShape.expectedOutcome, expected.rustOutcome);
  assert.equal(
    request.canaryShape.currentRustCanaryMetadataId,
    request.rustCanaryMetadata.id
  );
  assert.equal(request.canaryShape.recordOnlyPrivateBridge, true);
  assert.equal(request.canaryShape.nativeBridgeAvailable, false);
  assert.equal(Object.isFrozen(request.blockedCapabilities), true);
  assert.deepEqual(
    request.blockedCapabilities.map((capability) => capability.id),
    [
      "native-execution",
      "reconciler-execution",
      "host-output",
      "public-compatibility"
    ]
  );
}

function assertRustCanaryMetadata(metadata, label) {
  assert.equal(Object.isFrozen(metadata), true, label);
  assert.equal(
    metadata.id,
    "fast-react-test-renderer-current-root-canary-metadata",
    label
  );
  assert.equal(
    metadata.status,
    "record-only-current-rust-canary-metadata",
    label
  );
  assert.equal(metadata.compatibilityTarget, compatibilityTarget, label);
  assert.equal(metadata.acceptedRustCrate, "fast-react-test-renderer", label);
  assert.deepEqual(metadata.acceptedRustWorkers, [
    "worker-153-test-renderer-root-canary",
    "worker-188-test-renderer-commit-handoff-canary",
    "worker-195-test-renderer-root-callback-snapshot",
    "worker-208-test-renderer-host-output-canary",
    "worker-234-test-renderer-host-output-update-unmount-canary",
    "worker-265-test-renderer-private-json-ready-diagnostics"
  ]);
  assert.deepEqual(metadata.acceptedJsBridgeWorkers, [
    "worker-304-test-renderer-js-private-root-request-bridge",
    "worker-306-test-renderer-testinstance-private-wrapper-skeleton",
    "worker-307-test-renderer-update-unmount-private-js-bridge"
  ]);

  assert.equal(Object.isFrozen(metadata.root), true, label);
  assert.equal(metadata.root.rustType, "TestRendererRoot", label);
  assert.equal(metadata.root.rendererType, "TestRenderer", label);
  assert.equal(
    metadata.root.rootStoreType,
    "FiberRootStore<TestRenderer>",
    label
  );
  assert.equal(metadata.root.lifecycleEnum, "TestRendererRootLifecycle", label);
  assert.deepEqual(metadata.root.lifecycleValues, [
    "Active",
    "UnmountScheduled"
  ]);

  assert.equal(Object.isFrozen(metadata.requests), true, label);
  assert.equal(
    metadata.requests.updateKindEnum,
    "TestRendererRootUpdateKind",
    label
  );
  assert.deepEqual(metadata.requests.updateKindValues, [
    "Create",
    "Update",
    "Unmount"
  ]);
  assert.equal(
    metadata.requests.updateOutcomeEnum,
    "TestRendererRootUpdateOutcome",
    label
  );
  assert.deepEqual(metadata.requests.updateOutcomeValues, [
    "Scheduled",
    "IgnoredAfterUnmount",
    "AlreadyUnmountScheduled"
  ]);
  assert.equal(
    metadata.requests.scheduledUpdateRecord,
    "TestRendererRootScheduledUpdate",
    label
  );
  assert.equal(metadata.requests.noneElement, "RootElementHandle::NONE", label);

  assert.equal(Object.isFrozen(metadata.commit), true, label);
  assert.equal(
    metadata.commit.renderPhaseApi,
    "TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff",
    label
  );
  assert.equal(
    metadata.commit.commitApi,
    "TestRendererRoot::commit_host_root_render_for_canary",
    label
  );
  assert.equal(metadata.commit.commitRecord, "HostRootCommitRecord", label);
  assert.equal(metadata.commit.rootUpdateCallbacksAvailable, true, label);
  assert.equal(metadata.commit.hostMutationGeneralized, false, label);

  assert.equal(Object.isFrozen(metadata.hostOutput), true, label);
  assert.equal(
    metadata.hostOutput.createApi,
    "TestRendererRoot::render_and_commit_host_output_for_canary",
    label
  );
  assert.equal(
    metadata.hostOutput.updateApi,
    "TestRendererRoot::render_and_commit_host_output_update_for_canary",
    label
  );
  assert.equal(
    metadata.hostOutput.unmountApi,
    "TestRendererRoot::render_and_commit_host_output_unmount_for_canary",
    label
  );
  assert.deepEqual(metadata.hostOutput.fixtureShape, [
    "HostRoot",
    "HostComponent",
    "HostText"
  ]);
  assert.equal(metadata.hostOutput.fixtureType, "span", label);
  assert.equal(metadata.hostOutput.fixtureText, "hello", label);
  assert.equal(metadata.hostOutput.realHostOutputCanaryAvailable, true, label);
  assert.equal(metadata.hostOutput.generalMutationTraversalAvailable, false);

  assert.equal(Object.isFrozen(metadata.privateJson), true, label);
  assert.equal(
    metadata.privateJson.diagnosticName,
    "fast-react-test-renderer.serialization.private-json-canary",
    label
  );
  assert.equal(
    metadata.privateJson.report,
    "TestRendererPrivateJsonSerializationReport",
    label
  );
  assert.equal(
    metadata.privateJson.api,
    "TestRendererRoot::describe_private_json_serialization_for_canary",
    label
  );
  assert.equal(
    metadata.privateJson.createApi,
    "TestRendererRoot::describe_private_json_serialization_for_canary",
    label
  );
  assert.equal(
    metadata.privateJson.updateApi,
    "TestRendererRoot::describe_private_json_serialization_after_update_for_canary",
    label
  );
  assert.deepEqual(metadata.privateJson.acceptedHostOutputUpdateKinds, [
    "Create",
    "Update"
  ]);
  assert.equal(metadata.privateJson.hostOutputSnapshotFreshnessRequired, true);
  assert.equal(metadata.privateJson.staleSnapshotRejection, true);
  assert.equal(metadata.privateJson.publicSerializationAvailable, false);

  assert.deepEqual(Object.keys(metadata.operations), [
    "create",
    "update",
    "unmount"
  ]);
  assert.equal(metadata.recordOnlyPrivateBridge, true, label);
  assert.equal(metadata.nativeAddonLoaded, false, label);
  assert.equal(metadata.nativeBridgeAvailable, false, label);
  assert.equal(metadata.nativeExecution, false, label);
  assert.equal(metadata.rustExecution, false, label);
  assert.equal(metadata.reconcilerExecutionFromJs, false, label);
  assert.equal(metadata.hostOutputMutationFromJs, false, label);
  assert.equal(
    metadata.publicCreateUpdateUnmountBehaviorAvailable,
    false,
    label
  );
  assert.equal(metadata.compatibilityClaimed, false, label);
}

function assertRustCanaryOperationMetadata(metadata, expected) {
  assert.equal(Object.isFrozen(metadata), true, expected.entrypoint);
  assert.equal(metadata.operation, expected.operation);
  assert.equal(metadata.rootApi, `TestRendererRoot::${expected.operation}`);
  assert.equal(metadata.updateKind, expected.updateKind);
  assert.equal(
    metadata.rustUpdateKind,
    `TestRendererRootUpdateKind::${expected.updateKind}`
  );
  assert.equal(
    metadata.scheduledUpdateRecord,
    "TestRendererRootScheduledUpdate"
  );
  assert.equal(
    metadata.scheduledElement,
    expected.operation === "unmount"
      ? "RootElementHandle::NONE"
      : "RootElementHandle"
  );
  assert.equal(
    metadata.containerUpdateApi,
    expected.operation === "unmount"
      ? "update_container_sync"
      : "update_container"
  );
  assert.equal(metadata.schedulerApi, "ensure_root_is_scheduled");
  assert.equal(metadata.sync, expected.operation === "unmount");
  assert.equal(
    metadata.lifecycleAfterScheduled,
    expected.operation === "unmount" ? "UnmountScheduled" : "Active"
  );
  assert.equal(Object.isFrozen(metadata.outcomeVariants), true);
  assert.equal(metadata.outcomeVariants.includes(expected.rustOutcome), true);
  assert.equal(Object.isFrozen(metadata.acceptedWorkers), true);
  assert.equal(Object.isFrozen(metadata.acceptedRustTests), true);
  const expectedWorkersByOperation = {
    create: [
      "worker-153-test-renderer-root-canary",
      "worker-195-test-renderer-root-callback-snapshot",
      "worker-208-test-renderer-host-output-canary"
    ],
    update: [
      "worker-153-test-renderer-root-canary",
      "worker-195-test-renderer-root-callback-snapshot",
      "worker-234-test-renderer-host-output-update-unmount-canary"
    ],
    unmount: [
      "worker-153-test-renderer-root-canary",
      "worker-195-test-renderer-root-callback-snapshot",
      "worker-234-test-renderer-host-output-update-unmount-canary"
    ]
  };
  const expectedTestsByOperation = {
    create: [
      "root_create_enqueues_host_root_update_without_host_mutation",
      "root_options_store_strict_mode_and_create_node_mock_without_invocation",
      "root_create_commit_handoff_exposes_visible_callback_snapshot",
      "root_host_output_canary_commits_minimal_host_component_with_text"
    ],
    update: [
      "root_update_reuses_same_fiber_root_and_shared_scheduler_record",
      "root_update_commit_handoff_exposes_visible_callback_snapshot",
      "root_host_output_canary_updates_committed_text_with_update_diagnostics",
      "root_update_after_unmount_does_not_mutate_or_reschedule"
    ],
    unmount: [
      "root_unmount_enqueues_sync_null_update_before_wrapper_invalidation",
      "root_unmount_commit_handoff_exposes_visible_callback_snapshot",
      "root_host_output_canary_unmounts_committed_output_with_deletion_diagnostics",
      "root_unmount_is_idempotent"
    ]
  };
  assert.deepEqual(
    metadata.acceptedWorkers,
    expectedWorkersByOperation[expected.operation]
  );
  assert.deepEqual(
    metadata.acceptedRustTests,
    expectedTestsByOperation[expected.operation]
  );
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
  assert.equal(gate.privateRootRequestBridgeAvailable, true);
  assert.equal(gate.privateRootRequestBridgeStatus, rootRequestStatus);
  assert.equal(
    gate.privateRootRequestBridgeExecutionStatus,
    rootRequestExecutionStatus
  );
  assert.equal(gate.rootRequestRecordOnly, true);
  assert.equal(gate.createRouteAvailable, false);
  assert.equal(gate.updateRouteAvailable, false);
  assert.equal(gate.unmountRouteAvailable, false);
  assert.equal(gate.serializationAvailable, false);
  assert.equal(gate.actIntegrationAvailable, false);
  assert.equal(gate.schedulerIntegrationAvailable, false);
  assert.equal(gate.actSchedulerGateStatus, actSchedulerGateStatus);
  assert.equal(error.actSchedulerGate, gate.actSchedulerGate);
  assert.equal(error.actSchedulerGateStatus, gate.actSchedulerGate.status);
  assert.equal(error.schedulerMockFlushHelperMetadataAccepted, true);
  assert.equal(error.rootActRecordsAccepted, true);
  assert.equal(error.syncFlushActRecordsAccepted, true);
  assert.equal(error.queuedWorkExecution, false);
  assert.equal(error.rendererRootsCompatibilityClaimed, false);
  assertActSchedulerGate(gate.actSchedulerGate, entrypoint);
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
    "TestRendererCommittedFiberTreeInspection::host_root",
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

  assertAcceptedInspectionRecords(record, entrypoint);
  assertPrivateQueryTraversal(record, entrypoint);

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
  assert.equal(rootRecord.inspectionRecord, record.queryPath[0], entrypoint);
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

function assertAcceptedInspectionRecords(record, entrypoint) {
  assert.equal(
    Object.isFrozen(record.acceptedInspectionRecords),
    true,
    entrypoint
  );
  assert.deepEqual(
    record.acceptedInspectionRecords.map((inspection) => inspection.id),
    [
      "react-test-renderer-private-test-instance-inspection-host-root",
      "react-test-renderer-private-test-instance-inspection-host-component",
      "react-test-renderer-private-test-instance-inspection-host-text"
    ],
    entrypoint
  );

  const [hostRoot, hostComponent, hostText] = record.acceptedInspectionRecords;
  assertPrivateInspectionRecord(hostRoot, {
    childRecord:
      "react-test-renderer-private-test-instance-inspection-host-component",
    fiberTag: "HostRoot",
    parentRecord: null,
    path: ["HostRoot"],
    queryCandidate: false,
    source: "TestRendererCommittedFiberTreeInspection::host_root",
    wrapperEligible: false
  }, entrypoint);
  assertPrivateInspectionRecord(hostComponent, {
    childRecord: "react-test-renderer-private-test-instance-inspection-host-text",
    fiberTag: "HostComponent",
    parentRecord:
      "react-test-renderer-private-test-instance-inspection-host-root",
    path: ["HostRoot", "HostComponent"],
    queryCandidate: true,
    source: "TestRendererCommittedFiberTreeInspection::host_component",
    wrapperEligible: true
  }, entrypoint);
  assert.equal(
    hostComponent.elementTypeSource,
    "TestRendererCommittedFiberNodeInspection::element_type",
    entrypoint
  );
  assert.equal(
    hostComponent.propsSource,
    "TestRendererCommittedFiberNodeInspection::memoized_props",
    entrypoint
  );
  assert.equal(hostComponent.type, "span", entrypoint);
  assert.equal(hostComponent.props, record.queryRecords.props.value, entrypoint);

  assertPrivateInspectionRecord(hostText, {
    childRecord: null,
    fiberTag: "HostText",
    parentRecord:
      "react-test-renderer-private-test-instance-inspection-host-component",
    path: ["HostRoot", "HostComponent", "HostText"],
    queryCandidate: false,
    source: "TestRendererCommittedFiberTreeInspection::host_text",
    wrapperEligible: false
  }, entrypoint);
  assert.equal(hostText.text, "hello", entrypoint);
  assert.equal(hostText.skippedByQueryTraversal, true, entrypoint);
}

function assertPrivateInspectionRecord(record, expected, entrypoint) {
  assert.equal(Object.isFrozen(record), true, entrypoint);
  assert.equal(record.kind, "TestRendererCommittedFiberNodeInspection", entrypoint);
  assert.equal(record.source, expected.source, entrypoint);
  assert.equal(record.fiberTag, expected.fiberTag, entrypoint);
  assert.equal(record.index, 0, entrypoint);
  assert.equal(record.parentRecord, expected.parentRecord, entrypoint);
  assert.equal(record.childRecord, expected.childRecord, entrypoint);
  assert.equal(record.siblingRecord, null, entrypoint);
  assert.equal(Object.isFrozen(record.path), true, entrypoint);
  assert.deepEqual(record.path, expected.path, entrypoint);
  assert.equal(record.wrapperEligible, expected.wrapperEligible, entrypoint);
  assert.equal(record.queryCandidate, expected.queryCandidate, entrypoint);
  assert.equal(record.publicObject, false, entrypoint);
}

function assertPrivateQueryTraversal(record, entrypoint) {
  const traversal = record.queryTraversal;
  assert.equal(Object.isFrozen(traversal), true, entrypoint);
  assert.equal(
    traversal.id,
    "react-test-renderer-private-test-instance-query-traversal-metadata",
    entrypoint
  );
  assert.equal(
    traversal.source,
    "ReactTestRenderer.js ReactTestInstance.findAll",
    entrypoint
  );
  assert.equal(traversal.traversalOrder, "self-then-descendants", entrypoint);
  assert.equal(traversal.rootCandidateCount, 1, entrypoint);
  assert.equal(traversal.acceptedCandidateCount, 1, entrypoint);
  assert.equal(traversal.skippedTextChildCount, 1, entrypoint);
  assert.equal(traversal.textChildrenSkipped, true, entrypoint);
  assert.equal(traversal.publicQueryMethodsAvailable, false, entrypoint);
  assert.equal(traversal.predicateExecution, false, entrypoint);
  assert.equal(traversal.nativeBridgeAvailable, false, entrypoint);
  assert.equal(traversal.nativeExecution, false, entrypoint);

  assert.equal(Object.isFrozen(record.queryPath), true, entrypoint);
  assert.deepEqual(
    record.queryPath.map((inspection) => inspection.id),
    ["react-test-renderer-private-test-instance-inspection-host-component"],
    entrypoint
  );
  assert.equal(record.queryPath[0], record.acceptedInspectionRecords[1], entrypoint);

  assert.equal(Object.isFrozen(record.queryMethodRecords), true, entrypoint);
  assert.deepEqual(Object.keys(record.queryMethodRecords), testInstanceQuerySurfaceNames);
  assertPrivateQueryMethodRecord(record.queryMethodRecords.find, {
    basedOn: record.queryMethodRecords.findAll.id,
    effectiveDeep: false,
    expectOne: true,
    id: "react-test-renderer-private-test-instance-find-query",
    publicSurface: "ReactTestInstance.find",
    query: "find",
    resultKind: "single"
  }, record, entrypoint);
  assertPrivateQueryMethodRecord(record.queryMethodRecords.findAll, {
    defaultDeep: true,
    effectiveDeep: true,
    id: "react-test-renderer-private-test-instance-find-all-query",
    publicSurface: "ReactTestInstance.findAll",
    query: "findAll",
    resultKind: "array"
  }, record, entrypoint);
  assertPrivateQueryMethodRecord(record.queryMethodRecords.findByType, {
    basedOn: record.queryMethodRecords.findAllByType.id,
    criteria: { kind: "type", value: "span" },
    effectiveDeep: false,
    expectOne: true,
    id: "react-test-renderer-private-test-instance-find-by-type-query",
    publicSurface: "ReactTestInstance.findByType",
    query: "findByType",
    resultKind: "single"
  }, record, entrypoint);
  assertPrivateQueryMethodRecord(record.queryMethodRecords.findAllByType, {
    criteria: { kind: "type", value: "span" },
    defaultDeep: true,
    effectiveDeep: true,
    id: "react-test-renderer-private-test-instance-find-all-by-type-query",
    publicSurface: "ReactTestInstance.findAllByType",
    query: "findAllByType",
    resultKind: "array"
  }, record, entrypoint);
  assertPrivateQueryMethodRecord(record.queryMethodRecords.findByProps, {
    basedOn: record.queryMethodRecords.findAllByProps.id,
    criteria: { kind: "props", value: record.queryRecords.props.value },
    effectiveDeep: false,
    expectOne: true,
    id: "react-test-renderer-private-test-instance-find-by-props-query",
    publicSurface: "ReactTestInstance.findByProps",
    query: "findByProps",
    resultKind: "single"
  }, record, entrypoint);
  assertPrivateQueryMethodRecord(record.queryMethodRecords.findAllByProps, {
    criteria: { kind: "props", value: record.queryRecords.props.value },
    defaultDeep: true,
    effectiveDeep: true,
    id: "react-test-renderer-private-test-instance-find-all-by-props-query",
    publicSurface: "ReactTestInstance.findAllByProps",
    query: "findAllByProps",
    resultKind: "array"
  }, record, entrypoint);
}

function assertPrivateQueryMethodRecord(queryRecord, expected, owner, entrypoint) {
  assert.equal(Object.isFrozen(queryRecord), true, entrypoint);
  assert.equal(queryRecord.id, expected.id, entrypoint);
  assert.equal(queryRecord.query, expected.query, entrypoint);
  assert.equal(queryRecord.publicSurface, expected.publicSurface, entrypoint);
  assert.equal(
    queryRecord.status,
    "private-query-metadata-ready-public-method-blocked",
    entrypoint
  );
  assert.equal(queryRecord.deterministic, true, entrypoint);
  assert.equal(queryRecord.resultKind, expected.resultKind, entrypoint);
  assert.equal(queryRecord.effectiveDeep, expected.effectiveDeep, entrypoint);
  assert.equal(queryRecord.expectedCanaryMatchCount, 1, entrypoint);
  assert.equal(queryRecord.candidateRecords, owner.queryPath, entrypoint);
  assert.equal(Object.isFrozen(queryRecord.skippedRecords), true, entrypoint);
  assert.deepEqual(
    queryRecord.skippedRecords.map((inspection) => inspection.id),
    ["react-test-renderer-private-test-instance-inspection-host-text"],
    entrypoint
  );
  assert.equal(
    queryRecord.skippedRecords[0],
    owner.acceptedInspectionRecords[2],
    entrypoint
  );
  assert.equal(queryRecord.publicQueryMethodAvailable, false, entrypoint);
  assert.equal(queryRecord.nativeBridgeAvailable, false, entrypoint);
  assert.equal(queryRecord.nativeExecution, false, entrypoint);
  assert.equal(queryRecord.compatibilityClaimed, false, entrypoint);

  if (expected.defaultDeep !== undefined) {
    assert.equal(queryRecord.defaultDeep, expected.defaultDeep, entrypoint);
  }
  if (expected.expectOne !== undefined) {
    assert.equal(queryRecord.expectOne, expected.expectOne, entrypoint);
  }
  if (expected.basedOn !== undefined) {
    assert.equal(queryRecord.basedOn, expected.basedOn, entrypoint);
  }
  if (expected.criteria !== undefined) {
    assert.equal(Object.isFrozen(queryRecord.criteria), true, entrypoint);
    assert.equal(queryRecord.criteria.kind, expected.criteria.kind, entrypoint);
    assert.equal(queryRecord.criteria.value, expected.criteria.value, entrypoint);
  } else {
    assert.equal(Object.hasOwn(queryRecord, "criteria"), false, entrypoint);
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
  assert.equal(error.privateRootBridgeState.recordOnlyPrivateBridge, true);
  assertRustCanaryMetadata(
    error.privateRootBridgeState.rustCanaryMetadata,
    "private root bridge state"
  );
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
  assertRustCanaryMetadata(record.rustCanaryMetadata, "private root request");
  assert.equal(
    record.rustCanaryOperationMetadata,
    record.rustCanaryMetadata.operations[expected.operation]
  );
  assertRustCanaryOperationMetadata(record.rustCanaryOperationMetadata, {
    entrypoint: "private root request",
    operation: expected.operation,
    rustOutcome: expected.updateOutcome,
    updateKind: expected.updateKind
  });
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

function assertActSchedulerGate(gate, entrypoint) {
  assert.equal(Object.isFrozen(gate), true, entrypoint);
  assert.equal(gate.id, "react-test-renderer-act-scheduler-private-gate");
  assert.equal(gate.status, actSchedulerGateStatus);
  assert.equal(gate.entrypoint, entrypoint);
  assert.equal(gate.deterministic, true);
  assert.deepEqual(gate.acceptedWorkers, [
    "worker-176-act-queue-routing-skeleton",
    "worker-252-sync-flush-act-continuation-skeleton",
    "worker-277-react-act-queue-private-dispatcher-gate",
    "worker-280-scheduler-mock-flush-helper-gate",
    "worker-285-sync-flush-act-continuation-post-passive-gate",
    "worker-296-passive-effect-callback-handle-flush-gate",
    "worker-301-hook-effect-destroy-handoff-metadata",
    "worker-303-sync-flush-passive-continuation-execution-gate",
    "worker-304-test-renderer-js-private-root-request-bridge",
    "worker-307-test-renderer-update-unmount-private-js-bridge"
  ]);
  assert.equal(gate.publicActBehaviorAvailable, false);
  assert.equal(gate.publicSchedulerFlushExecutionAvailable, false);
  assert.equal(gate.publicRootSyncFlushRouteAvailable, false);
  assert.equal(gate.publicPassiveEffectFlushExecutionAvailable, false);
  assert.equal(gate.privateRootRequestExecutionAvailable, false);
  assert.equal(gate.schedulerFlushCompatibilityClaimed, false);
  assert.equal(gate.schedulerMockFlushExecution, false);
  assert.equal(gate.queuedWorkExecution, false);
  assert.equal(gate.passiveEffectExecution, false);
  assert.equal(gate.effectCallbackExecution, false);
  assert.equal(gate.rootRequestExecution, false);
  assert.equal(gate.hostOutputMutation, false);
  assert.equal(gate.rendererRootsCompatibilityClaimed, false);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.reactActPrivateDispatcherGateAccepted, true);
  assert.equal(gate.schedulerMockFlushHelperMetadataAccepted, true);
  assert.equal(gate.rootActRecordsAccepted, true);
  assert.equal(gate.syncFlushActRecordsAccepted, true);
  assert.equal(gate.postPassiveContinuationExecutionGateAccepted, true);
  assert.equal(gate.passiveActFlushMetadataAccepted, true);
  assert.equal(gate.rootRequestRecordsAccepted, true);
  assert.equal(gate.privateFlushPrerequisitesPresent, true);
  assert.equal(gate.privateFlushExecutionReady, false);
  assert.deepEqual(
    gate.recognizedReactActPrivateDispatcherRecords.map((record) => record.id),
    actSchedulerReactDispatcherRecordIds
  );
  assert.deepEqual(
    gate.recognizedSchedulerMockFlushHelpers.map((record) => [
      record.key,
      record.descriptor.value
    ]),
    actSchedulerFlushHelperMetadata
  );
  assert.deepEqual(
    gate.recognizedRootActRecords.map((record) => record.id),
    actSchedulerRootRecordIds
  );
  assert.deepEqual(
    gate.recognizedSyncFlushActRecords.map((record) => record.id),
    actSchedulerSyncFlushRecordIds
  );
  assert.deepEqual(
    gate.recognizedPassiveActFlushRecords.map((record) => record.id),
    actSchedulerPassiveRecordIds
  );
  assert.deepEqual(
    gate.recognizedRootActFlushRecords.map((record) => record.id),
    actSchedulerRootFlushRecordIds
  );
  assert.deepEqual(
    gate.acceptedPrivateFlushPrerequisiteIds,
    acceptedPrivateActFlushPrerequisiteIds
  );
  assert.deepEqual(
    gate.blockedPrivateFlushPrerequisiteIds,
    blockedPrivateActFlushPrerequisiteIds
  );
  assert.deepEqual(
    gate.missingBeforeExecution,
    actSchedulerMissingBeforeExecution
  );

  for (const record of [
    ...gate.recognizedReactActPrivateDispatcherRecords,
    ...gate.recognizedRootActRecords,
    ...gate.recognizedSyncFlushActRecords,
    ...gate.recognizedPassiveActFlushRecords,
    ...gate.recognizedRootActFlushRecords
  ]) {
    assert.equal(Object.isFrozen(record), true, record.id);
    if (Object.hasOwn(record, "acceptedFields")) {
      assert.equal(Object.isFrozen(record.acceptedFields), true, record.id);
    }
    if (Object.hasOwn(record, "queuedWorkExecution")) {
      assert.equal(record.queuedWorkExecution, false, record.id);
    }
  }

  assert.equal(
    gate.recognizedSyncFlushActRecords[1].passiveEffectExecution,
    false
  );
  assert.equal(
    gate.recognizedSyncFlushActRecords[2].syncFlushExecution,
    false
  );
  assert.equal(
    gate.recognizedPassiveActFlushRecords[1].createCallbackInvoked,
    false
  );
  assert.equal(
    gate.recognizedPassiveActFlushRecords[1].destroyCallbackInvoked,
    false
  );
  assert.equal(
    gate.recognizedRootActFlushRecords[0].privateRootRequestExecution,
    false
  );
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
