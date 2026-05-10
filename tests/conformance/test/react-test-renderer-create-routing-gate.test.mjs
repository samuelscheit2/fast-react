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
const privateActQueueFlushDiagnosticsExport =
  "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__";
const rootRequestBridgeSymbol = Symbol.for(
  "fast.react_test_renderer.root_request_bridge"
);
const rootRequestStatus =
  "admitted-private-test-renderer-root-request-record";
const rootRequestExecutionStatus =
  "admitted-private-test-renderer-root-execution-bridge";
const rootRequestCompatibilityStatus =
  "blocked-private-test-renderer-root-compatibility";
const privateTestInstanceWrapperRecordSymbolDescription =
  "fast.react_test_renderer.private_test_instance_wrapper_record";
const privateTestInstanceWrapperRecordSymbol = Symbol.for(
  privateTestInstanceWrapperRecordSymbolDescription
);
const privateErrorBoundaryDiagnosticsSymbolDescription =
  "fast.react_test_renderer.private_error_boundary_diagnostics";
const privateErrorBoundaryDiagnosticsSymbol = Symbol.for(
  privateErrorBoundaryDiagnosticsSymbolDescription
);
const privateToTreeHostOutputMetadataSymbolDescription =
  "fast.react_test_renderer.private_totree_host_output_metadata";
const privateToTreeHostOutputMetadataSymbol = Symbol.for(
  privateToTreeHostOutputMetadataSymbolDescription
);
const privateToTreeFacadeSymbolDescription =
  "fast.react_test_renderer.private_totree_facade";
const privateToTreeFacadeSymbol = Symbol.for(
  privateToTreeFacadeSymbolDescription
);
const missingPrerequisites = [
  "public-react-test-renderer-root-lifecycle-routing",
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
const lifecycleDiagnosticGateStatus =
  "accepted-private-update-unmount-lifecycle-diagnostics-public-root-blocked";
const rootLifecycleActive = "Active";
const rootLifecycleUnmountScheduled = "UnmountScheduled";
const rootUpdateOutcomeScheduled = "Scheduled";
const rootUpdateOutcomeIgnoredAfterUnmount = "IgnoredAfterUnmount";
const rootUpdateOutcomeAlreadyUnmountScheduled = "AlreadyUnmountScheduled";
const acceptedRustLifecycleDiagnosticRecords = [
  "TestRendererRootLifecycle",
  "TestRendererRootUpdateKind",
  "TestRendererRootUpdateOutcome",
  "TestRendererRootScheduledUpdate"
];
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
    acceptedOutcomes: [
      rootUpdateOutcomeScheduled,
      rootUpdateOutcomeIgnoredAfterUnmount
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
    acceptedOutcomes: [
      rootUpdateOutcomeScheduled,
      rootUpdateOutcomeAlreadyUnmountScheduled
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
const actSchedulerReactQueueDiagnosticRecordIds = [
  "scheduler-private-act-queue-flush-diagnostics",
  "react-private-act-internal-test-queue-factories"
];
const actSchedulerCjsDevelopmentReactQueueDiagnosticRecordIds = [
  "scheduler-private-act-queue-flush-diagnostics",
  "test-renderer-mock-scheduler-flush-helper-routing",
  "react-private-act-internal-test-queue-factories"
];
const actSchedulerSyncFlushRecordIds = [
  "sync-flush-act-continuation-record",
  "sync-flush-act-post-passive-continuation-gate",
  "sync-flush-post-passive-continuation-execution-gate",
  "sync-flush-post-passive-continuation-execution-record",
  "passive-effects-flush-with-sync-flush-continuation-result"
];
const actSchedulerPassiveRecordIds = [
  "pending-passive-commit-handoff",
  "passive-effects-flush-record",
  "function-component-pending-passive-effect-phase-record",
  "passive-effect-callback-invocation-gate-snapshot",
  "passive-effect-destroy-callback-execution-records"
];
const actSchedulerCjsPassiveRecordIds = [
  ...actSchedulerPassiveRecordIds,
  "passive-effect-scheduler-flush-gate-record",
  "scheduler-passive-effects-flush-request",
  "passive-effect-scheduler-flush-execution-record"
];
const actSchedulerRootFlushRecordIds = [
  "test-renderer-private-root-request-bridge",
  "test-renderer-private-root-update-unmount-lifecycle",
  "test-renderer-private-root-native-canary-metadata",
  "test-renderer-private-tojson-host-output-diagnostic",
  "test-renderer-private-testinstance-query-path"
];
const acceptedPrivateActFlushPrerequisiteIds = [
  "react-act-private-dispatcher-gate",
  "scheduler-react-act-queue-diagnostic-consumption",
  "scheduler-act-queue-routing-records",
  "scheduler-mock-flush-helper-metadata",
  "sync-flush-act-continuation-records",
  "sync-flush-post-passive-continuation-execution-gate",
  "sync-flush-post-passive-private-execution-metadata",
  "passive-effect-flush-metadata",
  "passive-effect-private-callback-execution-metadata",
  "test-renderer-private-root-output-diagnostics",
  "test-renderer-private-root-request-records"
];
const acceptedPrivateActFlushCjsPrerequisiteIds = [
  ...acceptedPrivateActFlushPrerequisiteIds.slice(0, 8),
  "passive-effect-scheduler-flush-metadata",
  ...acceptedPrivateActFlushPrerequisiteIds.slice(8)
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
const cjsDevelopmentEntrypoint =
  "react-test-renderer/cjs/react-test-renderer.development";
const cjsEntrypoints = entrypoints.filter((entry) =>
  entry.entrypoint.includes("/cjs/")
);

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

test("react-test-renderer private root request bridge can call a private Rust execution boundary shape", () => {
  for (const entry of entrypoints) {
    const moduleExports = loadFresh(entry.modulePath);
    const bridge = assertPrivateRootRequestBridge(
      moduleExports,
      entry.entrypoint
    );
    const renderer = moduleExports.create({ type: "initial" });
    const [createRequest] = bridge.getRendererRootRequests(renderer);
    const updateError = captureThrown(() =>
      renderer.update({ type: "updated" })
    );
    const unmountError = captureThrown(() => renderer.unmount());
    const calls = [];
    const executor = {
      executeTestRendererRootRequest(handoff) {
        calls.push(handoff);
        return {
          rustLifecycleDiagnostic: createRustLifecycleDiagnosticSource(
            handoff.requestSequence === 1
              ? createRequest
              : handoff.requestSequence === 2
                ? updateError.rootRequest
                : unmountError.rootRequest
          ),
          nativeAddonLoaded: false,
          nativeExecution: false,
          rustExecution: true
        };
      }
    };

    assert.equal(
      bridge.canConsumeAcceptedRustLifecycleDiagnostic(
        createRequest,
        createRustLifecycleDiagnosticSource(createRequest)
      ),
      true,
      entry.entrypoint
    );

    const createHandoff = bridge.createRootExecutionHandoff(createRequest);
    assertRootExecutionHandoff(createHandoff, createRequest);
    const createResult = bridge.executeRootRequest(createRequest, executor);
    const updateResult = bridge.executeRootRequest(
      updateError.rootRequest,
      executor
    );
    const unmountResult = bridge.executeRootRequest(
      unmountError.rootRequest,
      executor
    );

    assert.deepEqual(
      calls.map((handoff) => handoff.operation),
      ["create", "update", "unmount"],
      entry.entrypoint
    );
    assertRootExecutionResult(createResult, createRequest);
    assertRootExecutionResult(updateResult, updateError.rootRequest);
    assertRootExecutionResult(unmountResult, unmountError.rootRequest);
    assert.equal(
      bridge.canConsumeRootExecutionResult(
        updateError.rootRequest,
        createRustLifecycleDiagnosticSource(updateError.rootRequest)
      ),
      true,
      entry.entrypoint
    );
    assert.equal(
      bridge.canConsumeRootExecutionResult(
        updateError.rootRequest,
        {
          ...createRustLifecycleDiagnosticSource(updateError.rootRequest),
          updateOutcome: rootUpdateOutcomeAlreadyUnmountScheduled
        }
      ),
      false,
      entry.entrypoint
    );

    const publicUpdateError = captureThrown(() =>
      renderer.update({ type: "still-publicly-blocked" })
    );
    assertReactTestRendererUnimplemented(
      publicUpdateError,
      entry.entrypoint,
      "create().update"
    );
    assertCreateRoutingGate(publicUpdateError, entry.entrypoint);
    assert.equal(publicUpdateError.rootRequest.rustExecution, false);
  }
});

test("react-test-renderer private root request bridge consumes accepted Rust lifecycle diagnostics", () => {
  for (const entry of entrypoints) {
    const moduleExports = loadFresh(entry.modulePath);
    const bridge = assertPrivateRootRequestBridge(
      moduleExports,
      entry.entrypoint
    );
    const renderer = moduleExports.create({ type: "lifecycle" });

    const updateError = captureThrown(() =>
      renderer.update({ type: "updated" })
    );
    const unmountError = captureThrown(() => renderer.unmount());
    const ignoredUpdateError = captureThrown(() =>
      renderer.update({ type: "ignored" })
    );
    const secondUnmountError = captureThrown(() => renderer.unmount());

    for (const request of [
      updateError.rootRequest,
      unmountError.rootRequest,
      ignoredUpdateError.rootRequest,
      secondUnmountError.rootRequest
    ]) {
      const sourceDiagnostic = createRustLifecycleDiagnosticSource(request);
      assert.equal(
        bridge.canConsumeAcceptedRustLifecycleDiagnostic(
          request,
          sourceDiagnostic
        ),
        true,
        `${entry.entrypoint} ${request.operation} ${request.rustOutcome}`
      );
      const consumed = bridge.consumeAcceptedRustLifecycleDiagnostic(
        request,
        sourceDiagnostic
      );

      assertRootRequestRustLifecycleDiagnostic(
        consumed,
        expectedRootRequestDiagnosticFromRecord(request)
      );
      assert.equal(consumed.consumedFromExternalDiagnostic, true);
      assert.equal(Object.isFrozen(consumed.sourceDiagnostic), true);
      assert.equal(consumed.sourceDiagnostic.operation, request.operation);
      assert.equal(consumed.sourceDiagnostic.updateKind, request.updateKind);
      assert.equal(
        consumed.sourceDiagnostic.updateOutcome,
        request.rustOutcome
      );
      assert.equal(
        consumed.sourceDiagnostic.hasScheduledUpdate,
        request.scheduled
      );
    }

    const mismatchedDiagnostic = {
      ...createRustLifecycleDiagnosticSource(updateError.rootRequest),
      updateOutcome: rootUpdateOutcomeAlreadyUnmountScheduled
    };
    assert.equal(
      bridge.canConsumeAcceptedRustLifecycleDiagnostic(
        updateError.rootRequest,
        mismatchedDiagnostic
      ),
      false,
      entry.entrypoint
    );
    const mismatchError = captureThrown(() =>
      bridge.consumeAcceptedRustLifecycleDiagnostic(
        updateError.rootRequest,
        mismatchedDiagnostic
      )
    );
    assert.equal(
      mismatchError.name,
      "FastReactTestRendererPrivateRootRequestError"
    );
    assert.equal(
      mismatchError.code,
      "FAST_REACT_TEST_RENDERER_INVALID_ROOT_REQUEST"
    );

    assert.equal(
      bridge.canConsumeAcceptedRustLifecycleDiagnostic(
        bridge.getRendererRootRequests(renderer)[0],
        createRustLifecycleDiagnosticSource(updateError.rootRequest)
      ),
      false,
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
  assert.equal(
    gate.localChecks.updatePrivateRouteConsumesLifecycleDiagnostics,
    true
  );
  assert.equal(gate.localChecks.unmountPrivateRoutePresent, true);
  assert.equal(
    gate.localChecks.unmountPrivateRouteConsumesLifecycleDiagnostics,
    true
  );
  assert.equal(
    gate.localChecks.privateToJSONSerializationFacadeGatePresent,
    true
  );
  assert.equal(
    gate.localChecks.privateToJSONSerializationFacadePubliclyBlocked,
    true
  );
  assert.equal(
    gate.localChecks.privateToTreeHostOutputMetadataGatePresent,
    true
  );
  assert.equal(gate.localChecks.privateToTreePrivateFacadeGatePresent, true);
  assert.equal(
    gate.localChecks.privateToTreePrivateFacadeConsumesRustTreeMetadata,
    true
  );
  assert.equal(
    gate.localChecks.privateToTreeHostOutputMetadataPubliclyBlocked,
    true
  );
  assert.equal(
    gate.localChecks.privateRecordOnlyTestInstanceWrapperPresent,
    true
  );
  assert.equal(
    gate.localChecks.privateTestInstanceBridgeQueryDiagnosticsPresent,
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
    const bridge = assertPrivateRootRequestBridge(
      moduleExports,
      entry.entrypoint
    );
    const renderer = moduleExports.create({ type: "private-query-record" });
    const [createRequest] = bridge.getRendererRootRequests(renderer);
    const descriptor = Object.getOwnPropertyDescriptor(
      renderer,
      privateTestInstanceWrapperRecordSymbol
    );

    assert.equal(descriptor.enumerable, false, entry.entrypoint);
    assert.equal(descriptor.configurable, false, entry.entrypoint);
    assert.equal(descriptor.writable, false, entry.entrypoint);
    assertPrivateTestInstanceWrapperSkeleton(
      descriptor.value,
      entry.entrypoint,
      {
        bridge,
        rootRequest: createRequest
      }
    );
    assert.equal(
      bridge.getTestInstanceQueryDiagnostics(createRequest),
      descriptor.value,
      entry.entrypoint
    );
    assert.equal(
      bridge.getRendererTestInstanceQueryDiagnostics(renderer),
      descriptor.value,
      entry.entrypoint
    );
    assert.equal(
      bridge.getRootTestInstanceQueryDiagnostics(createRequest.rootHandle),
      descriptor.value,
      entry.entrypoint
    );
    const rootError = captureThrown(() => renderer.root);
    assertReactTestRendererUnimplemented(
      rootError,
      entry.entrypoint,
      "create().root"
    );
    assert.notEqual(
      descriptor.value,
      rootError.routingGate.privateTestInstanceWrapperSkeleton,
      entry.entrypoint
    );
    assert.equal(
      rootError.privateTestInstanceWrapperRecord,
      descriptor.value,
      entry.entrypoint
    );
  }
});

test("react-test-renderer CJS private TestInstance bridge records deterministic findAll predicate diagnostics", () => {
  for (const entry of cjsEntrypoints) {
    const moduleExports = loadFresh(entry.modulePath);
    const bridge = assertPrivateRootRequestBridge(
      moduleExports,
      entry.entrypoint
    );
    const renderer = moduleExports.create({ type: "private-find-all" });
    const [createRequest] = bridge.getRendererRootRequests(renderer);
    const record = Object.getOwnPropertyDescriptor(
      renderer,
      privateTestInstanceWrapperRecordSymbol
    ).value;
    const diagnostics = record.findAllPredicateDiagnostics;

    assertPrivateFindAllPredicateDiagnostics(
      diagnostics,
      record,
      entry.entrypoint
    );
    assert.equal(
      record.queryMethodRecords.findAll.predicateDiagnostics,
      diagnostics,
      entry.entrypoint
    );
    assert.equal(
      record.rootRequestTestInstanceQueryMetadata.findAllPredicateDiagnosticsAvailable,
      true,
      entry.entrypoint
    );
    assert.deepEqual(
      record.rootRequestTestInstanceQueryMetadata.findAllPredicateKinds,
      ["type", "props", "predicate-like"],
      entry.entrypoint
    );
    assert.equal(
      record.rootRequestTestInstanceQueryMetadata.findAllPredicateExecution,
      false,
      entry.entrypoint
    );
    assert.deepEqual(
      record.rootRequestTestInstanceQueryMetadata.findAllAcceptedRustApis,
      diagnostics.acceptedRustApis,
      entry.entrypoint
    );
    assert.equal(
      bridge.getTestInstanceQueryDiagnostics(createRequest),
      record,
      entry.entrypoint
    );
    assertNoPublicTestInstanceQueryMethods(renderer, entry.entrypoint);
  }
});

test("react-test-renderer CJS development private TestInstance bridge records deterministic findBy diagnostics", () => {
  const entry = cjsEntrypoints.find((candidate) =>
    candidate.entrypoint.endsWith("react-test-renderer.development")
  );
  assert.notEqual(entry, undefined);

  const moduleExports = loadFresh(entry.modulePath);
  const bridge = assertPrivateRootRequestBridge(
    moduleExports,
    entry.entrypoint
  );
  const renderer = moduleExports.create({ type: "private-find-by" });
  const [createRequest] = bridge.getRendererRootRequests(renderer);
  const record = Object.getOwnPropertyDescriptor(
    renderer,
    privateTestInstanceWrapperRecordSymbol
  ).value;
  const diagnostics = record.findByQueryDiagnostics;

  assertPrivateFindByQueryDiagnostics(diagnostics, record, entry.entrypoint);
  assert.equal(
    diagnostics.basedOnFindAllPredicateDiagnostics,
    record.findAllPredicateDiagnostics,
    entry.entrypoint
  );
  assert.equal(
    record.rootRequestTestInstanceQueryMetadata.findByDiagnosticsAvailable,
    true,
    entry.entrypoint
  );
  assert.deepEqual(
    record.rootRequestTestInstanceQueryMetadata.findByQueries,
    ["findByType", "findByProps"],
    entry.entrypoint
  );
  assert.equal(
    record.rootRequestTestInstanceQueryMetadata.findByEffectiveDeep,
    false,
    entry.entrypoint
  );
  assert.equal(
    record.rootRequestTestInstanceQueryMetadata.findByExpectOne,
    true,
    entry.entrypoint
  );
  assert.equal(
    record.rootRequestTestInstanceQueryMetadata.findByPredicateExecution,
    false,
    entry.entrypoint
  );
  assert.deepEqual(
    record.rootRequestTestInstanceQueryMetadata.findByAcceptedRustApis,
    diagnostics.acceptedRustApis,
    entry.entrypoint
  );
  assert.equal(
    bridge.getTestInstanceQueryDiagnostics(createRequest),
    record,
    entry.entrypoint
  );
  assertNoPublicTestInstanceQueryMethods(renderer, entry.entrypoint);
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
  assert.equal(bridge.recordOnlyBridge, false);
  assert.equal(bridge.privateRootExecutionBridgeAvailable, true);
  assert.equal(bridge.rustRootExecutionBoundaryCallable, true);
  assert.equal(
    bridge.rustRootExecutionBoundary,
    "fast-react-test-renderer.TestRendererRoot"
  );
  assert.equal(
    bridge.rustRootExecutionBridgeStatus,
    "admitted-private-test-renderer-native-root-execution-bridge"
  );
  assertRustCanaryMetadata(bridge.rustCanaryMetadata, entrypoint);
  assert.equal(typeof bridge.createRootRequest, "function");
  assert.equal(typeof bridge.updateRootRequest, "function");
  assert.equal(typeof bridge.unmountRootRequest, "function");
  assert.equal(typeof bridge.getRendererRootRequests, "function");
  assert.equal(typeof bridge.getRequestPayload, "function");
  assert.equal(typeof bridge.getRustCanaryMetadata, "function");
  assert.equal(typeof bridge.getRustCanaryOperationMetadata, "function");
  assert.equal(typeof bridge.getTestInstanceQueryDiagnostics, "function");
  assert.equal(typeof bridge.getRootTestInstanceQueryDiagnostics, "function");
  assert.equal(typeof bridge.getRendererTestInstanceQueryDiagnostics, "function");
  assert.equal(
    typeof bridge.canConsumeAcceptedRustLifecycleDiagnostic,
    "function"
  );
  assert.equal(
    typeof bridge.consumeAcceptedRustLifecycleDiagnostic,
    "function"
  );
  assert.equal(typeof bridge.createRootExecutionHandoff, "function");
  assert.equal(typeof bridge.canConsumeRootExecutionResult, "function");
  assert.equal(typeof bridge.consumeRootExecutionResult, "function");
  assert.equal(typeof bridge.executeRootRequest, "function");
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
  assert.equal(
    request.acceptedRustLifecycleDiagnostic,
    request.rustLifecycleDiagnostic
  );
  assertRootRequestRustLifecycleDiagnostic(
    request.rustLifecycleDiagnostic,
    expected
  );
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
  assert.equal(request.canaryShape.recordOnlyPrivateBridge, false);
  assert.equal(request.canaryShape.privateRootExecutionBridgeAvailable, true);
  assert.equal(request.canaryShape.rustRootExecutionBoundaryCallable, true);
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

function assertRootExecutionHandoff(handoff, request) {
  assert.equal(Object.isFrozen(handoff), true, request.entrypoint);
  assert.equal(
    handoff.kind,
    "FastReactTestRendererPrivateRootExecutionHandoff"
  );
  assert.equal(handoff.status, rootRequestExecutionStatus);
  assert.equal(handoff.compatibilityStatus, rootRequestCompatibilityStatus);
  assert.equal(handoff.entrypoint, request.entrypoint);
  assert.equal(handoff.compatibilityTarget, compatibilityTarget);
  assert.equal(handoff.operation, request.operation);
  assert.equal(handoff.requestId, request.requestId);
  assert.equal(handoff.requestSequence, request.requestSequence);
  assert.equal(handoff.rootId, request.rootId);
  assert.equal(handoff.rootHandle, request.rootHandle);
  assert.equal(handoff.rootElementHandle, request.rootElementHandle);
  assert.equal(handoff.updateKind, request.updateKind);
  assert.equal(handoff.rustUpdateKind, request.rustUpdateKind);
  assert.equal(handoff.rootApi, request.rootApi);
  assert.equal(
    handoff.containerUpdateApi,
    request.scheduled ? request.containerUpdateApi : null
  );
  assert.equal(
    handoff.schedulerApi,
    request.scheduled ? "ensure_root_is_scheduled" : null
  );
  assert.equal(handoff.sync, request.scheduled ? request.sync : null);
  assert.equal(handoff.scheduled, request.scheduled);
  assert.equal(handoff.expectedOutcome, request.rustOutcome);
  assert.equal(handoff.payloadAvailable, true);
  assert.deepEqual(handoff.elementInfo, request.elementInfo);
  assert.equal(
    handoff.rustRootExecutionBoundary,
    "fast-react-test-renderer.TestRendererRoot"
  );
  assert.equal(
    handoff.rustRootExecutionBridgeStatus,
    "admitted-private-test-renderer-native-root-execution-bridge"
  );
  assert.equal(handoff.rustRootExecutionBoundaryCallable, true);
  assert.equal(handoff.nativeAddonLoaded, false);
  assert.equal(handoff.nativeBridgeAvailable, false);
  assert.equal(handoff.nativeExecution, false);
  assert.equal(handoff.publicRouteAvailable, false);
  assert.equal(
    handoff.publicCreateUpdateUnmountBehaviorAvailable,
    false
  );
  assert.equal(handoff.compatibilityClaimed, false);
}

function assertRootExecutionResult(result, request) {
  assert.equal(Object.isFrozen(result), true, request.entrypoint);
  assert.equal(
    result.kind,
    "FastReactTestRendererPrivateRootExecutionResult"
  );
  assert.equal(
    result.status,
    "accepted-private-test-renderer-root-execution-result"
  );
  assert.equal(result.executionStatus, rootRequestExecutionStatus);
  assert.equal(result.compatibilityStatus, rootRequestCompatibilityStatus);
  assert.equal(result.entrypoint, request.entrypoint);
  assert.equal(result.compatibilityTarget, compatibilityTarget);
  assert.equal(result.request, request);
  assertRootExecutionHandoff(result.handoff, request);
  assert.equal(result.operation, request.operation);
  assert.equal(result.requestId, request.requestId);
  assert.equal(result.requestSequence, request.requestSequence);
  assert.equal(result.updateKind, request.updateKind);
  assert.equal(result.rustOutcome, request.rustOutcome);
  assert.equal(result.scheduled, request.scheduled);
  assertRootRequestRustLifecycleDiagnostic(
    result.rustLifecycleDiagnostic,
    expectedRootRequestDiagnosticFromRecord(request)
  );
  assert.equal(result.privateExecutorInvoked, true);
  assert.equal(result.privateRootRequestExecution, true);
  assert.equal(
    result.rustRootExecutionBoundary,
    "fast-react-test-renderer.TestRendererRoot"
  );
  assert.equal(
    result.rustRootExecutionBridgeStatus,
    "admitted-private-test-renderer-native-root-execution-bridge"
  );
  assert.equal(result.rustRootExecutionBoundaryCalled, true);
  assert.equal(result.nativeAddonLoaded, false);
  assert.equal(result.nativeBridgeAvailable, false);
  assert.equal(result.nativeExecution, false);
  assert.equal(result.rustExecution, true);
  assert.equal(result.reconcilerExecution, request.scheduled);
  assert.equal(result.hostOutputProduced, false);
  assert.equal(result.serializationAvailable, false);
  assert.equal(result.publicRouteAvailable, false);
  assert.equal(
    result.publicCreateUpdateUnmountBehaviorAvailable,
    false
  );
  assert.equal(result.compatibilityClaimed, false);
}

function createRustLifecycleDiagnosticSource(request) {
  return {
    operation: request.operation,
    updateKind: request.updateKind,
    updateOutcome: request.rustOutcome,
    lifecycleStatusBefore: normalizeExpectedRustLifecycle(
      request.lifecycleStatusBefore
    ),
    lifecycleStatusAfter: normalizeExpectedRustLifecycle(
      request.lifecycleStatusAfter
    ),
    scheduledUpdate: request.scheduled
      ? {
          kind: request.updateKind,
          element: request.rootElementHandle.isNone
            ? {
                kind: "RootElementHandle::NONE",
                isNone: true
              }
            : {
                kind: "RootElementHandle",
                isNone: false
              },
          containerUpdate: {
            api: request.containerUpdateApi
          },
          rootSchedule: {
            api: "ensure_root_is_scheduled"
          }
        }
      : null
  };
}

function expectedRootRequestDiagnosticFromRecord(request) {
  return {
    entrypoint: request.entrypoint,
    operation: request.operation,
    requestType: request.requestType,
    lifecycleStatusBefore: request.lifecycleStatusBefore,
    lifecycleStatusAfter: request.lifecycleStatusAfter,
    updateKind: request.updateKind,
    rustOutcome: request.rustOutcome,
    rootElementHandleRaw: request.rootElementHandle.raw,
    scheduled: request.scheduled,
    sync: request.sync
  };
}

function assertRootRequestRustLifecycleDiagnostic(diagnostic, expected) {
  assert.equal(Object.isFrozen(diagnostic), true, expected.entrypoint);
  assert.equal(
    diagnostic.kind,
    "FastReactTestRendererAcceptedRustLifecycleDiagnostic",
    expected.entrypoint
  );
  assert.equal(
    diagnostic.status,
    lifecycleDiagnosticGateStatus,
    expected.entrypoint
  );
  assert.equal(Object.isFrozen(diagnostic.gate), true, expected.entrypoint);
  assert.equal(
    diagnostic.gate.id,
    "react-test-renderer-update-unmount-rust-lifecycle-diagnostic-gate",
    expected.entrypoint
  );
  assert.deepEqual(
    diagnostic.rustRecords,
    acceptedRustLifecycleDiagnosticRecords
  );
  assert.equal(diagnostic.operation, expected.operation);
  assert.equal(diagnostic.requestType, expected.requestType);
  assert.equal(
    diagnostic.lifecycleStatusBefore,
    normalizeExpectedRustLifecycle(expected.lifecycleStatusBefore)
  );
  assert.equal(
    diagnostic.lifecycleStatusAfter,
    normalizeExpectedRustLifecycle(expected.lifecycleStatusAfter)
  );
  assert.equal(diagnostic.jsLifecycleStatusBefore, expected.lifecycleStatusBefore);
  assert.equal(diagnostic.jsLifecycleStatusAfter, expected.lifecycleStatusAfter);
  assert.equal(diagnostic.updateKind, expected.updateKind);
  assert.equal(diagnostic.updateOutcome, expected.rustOutcome);
  assert.equal(
    diagnostic.outcomeRecord,
    `TestRendererRootUpdateOutcome::${expected.rustOutcome}`
  );
  assert.equal(
    diagnostic.scheduledUpdateRecord,
    expected.scheduled ? "TestRendererRootScheduledUpdate" : null
  );
  assert.equal(
    diagnostic.rootElementHandleKind,
    expected.rootElementHandleRaw === 0
      ? "RootElementHandle::NONE"
      : "RootElementHandle"
  );
  assert.equal(
    diagnostic.rootElementHandleIsNone,
    expected.rootElementHandleRaw === 0
  );
  assert.equal(
    diagnostic.containerUpdateApi,
    expected.scheduled
      ? expected.operation === "unmount"
        ? "update_container_sync"
        : "update_container"
      : null
  );
  assert.equal(
    diagnostic.schedulerApi,
    expected.scheduled ? "ensure_root_is_scheduled" : null
  );
  assert.equal(diagnostic.sync, expected.scheduled ? expected.sync : null);
  assert.equal(diagnostic.schedulesRootUpdate, expected.scheduled);
  assert.equal(diagnostic.consumesAcceptedRustLifecycleDiagnostics, true);
  assert.equal(diagnostic.privateDiagnosticConsumed, true);
  assert.equal(diagnostic.publicRouteAvailable, false);
  assert.equal(
    diagnostic.publicCreateUpdateUnmountBehaviorAvailable,
    false
  );
  assert.equal(diagnostic.nativeBridgeAvailable, false);
  assert.equal(diagnostic.nativeExecution, false);
  assert.equal(diagnostic.rustExecutionFromJs, false);
  assert.equal(diagnostic.reconcilerExecutionFromJs, false);
  assert.equal(diagnostic.hostOutputProducedFromJs, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
}

function normalizeExpectedRustLifecycle(value) {
  if (value === null) {
    return undefined;
  }
  if (value === "active") {
    return rootLifecycleActive;
  }
  if (value === "unmount-scheduled") {
    return rootLifecycleUnmountScheduled;
  }
  return value;
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
    "private-root-execution-bridge-current-rust-canary-metadata",
    label
  );
  assert.equal(metadata.compatibilityTarget, compatibilityTarget, label);
  assert.equal(metadata.acceptedRustCrate, "fast-react-test-renderer", label);
  const expectedAcceptedRustWorkers = [
    "worker-153-test-renderer-root-canary",
    "worker-188-test-renderer-commit-handoff-canary",
    "worker-195-test-renderer-root-callback-snapshot",
    "worker-208-test-renderer-host-output-canary",
    "worker-234-test-renderer-host-output-update-unmount-canary",
    "worker-265-test-renderer-private-json-ready-diagnostics"
  ];
  if (metadata.errorBoundaryDiagnostics !== undefined) {
    expectedAcceptedRustWorkers.push(
      "worker-465-test-renderer-error-boundary-diagnostics"
    );
  }
  assert.deepEqual(metadata.acceptedRustWorkers, expectedAcceptedRustWorkers);
  assert.deepEqual(metadata.acceptedJsBridgeWorkers, [
    "worker-304-test-renderer-js-private-root-request-bridge",
    "worker-306-test-renderer-testinstance-private-wrapper-skeleton",
    "worker-307-test-renderer-update-unmount-private-js-bridge",
    "worker-423-test-renderer-native-root-execution-bridge",
    "worker-426-test-renderer-testinstance-bridge-query"
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

  const testInstanceQuery = metadata.testInstanceQuery;
  assert.equal(Object.isFrozen(testInstanceQuery), true, label);
  assert.equal(
    testInstanceQuery.diagnosticKind,
    "ReactTestInstancePrivateQueryMetadata",
    label
  );
  assert.equal(
    testInstanceQuery.status,
    "private-test-instance-query-diagnostics-routed-through-root-bridge",
    label
  );
  assert.equal(
    testInstanceQuery.bridgeMetadataSource,
    "FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata",
    label
  );
  assert.equal(
    testInstanceQuery.wrapperRecordSymbol,
    privateTestInstanceWrapperRecordSymbolDescription,
    label
  );
  assert.deepEqual(testInstanceQuery.acceptedWorkers, [
    "worker-235-test-renderer-private-fiber-inspection",
    "worker-334-test-renderer-testinstance-private-query-path",
    "worker-365-test-renderer-testinstance-multi-child-query-path"
  ]);
  assert.deepEqual(testInstanceQuery.acceptedRustRecords, [
    "TestRendererCommittedFiberTreeInspection",
    "TestRendererCommittedFiberNodeInspection"
  ]);
  assert.deepEqual(testInstanceQuery.acceptedQuerySurfaces, [
    "root",
    "find",
    "findAll",
    "findByType",
    "findAllByType",
    "findByProps",
    "findAllByProps"
  ]);
  assert.deepEqual(testInstanceQuery.fixtureShape, [
    "HostRoot",
    "HostText",
    "HostComponent",
    "HostText"
  ]);
  assert.equal(
    testInstanceQuery.rootWrapperMaterializedForPrivateMetadata,
    true,
    label
  );
  assert.equal(testInstanceQuery.queryCandidateCount, 2, label);
  assert.equal(testInstanceQuery.skippedTextRecordCount, 2, label);
  assert.equal(testInstanceQuery.publicRootAvailable, false, label);
  assert.equal(testInstanceQuery.publicQueryMethodsAvailable, false, label);
  assert.equal(
    testInstanceQuery.publicTestInstanceObjectAvailable,
    false,
    label
  );
  assert.equal(testInstanceQuery.compatibilityClaimed, false, label);

  assert.deepEqual(Object.keys(metadata.operations), [
    "create",
    "update",
    "unmount"
  ]);
  assert.equal(metadata.recordOnlyPrivateBridge, false, label);
  assert.equal(metadata.privateRootExecutionBridgeAvailable, true, label);
  assert.equal(metadata.rustRootExecutionBoundaryCallable, true, label);
  assert.equal(
    metadata.rustRootExecutionBoundary,
    "fast-react-test-renderer.TestRendererRoot",
    label
  );
  assert.equal(
    metadata.rustRootExecutionBridgeStatus,
    "admitted-private-test-renderer-native-root-execution-bridge",
    label
  );
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
  const expectedPrivateSymbols = label.includes("development")
    ? [
        privateTestInstanceWrapperRecordSymbol,
        privateErrorBoundaryDiagnosticsSymbol
      ]
    : [privateTestInstanceWrapperRecordSymbol];

  assert.deepEqual(Object.keys(renderer), rendererKeys, label);
  assert.deepEqual(Object.getOwnPropertyNames(renderer), rendererKeys, label);
  assert.deepEqual(
    Reflect.ownKeys(renderer).filter((key) => typeof key === "string"),
    rendererKeys,
    label
  );
  assert.deepEqual(
    Object.getOwnPropertySymbols(renderer),
    expectedPrivateSymbols,
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
  assert.deepEqual(
    Object.getOwnPropertySymbols(renderer.toTree),
    [privateToTreeHostOutputMetadataSymbol, privateToTreeFacadeSymbol],
    label
  );
  const toTreeMetadataDescriptor = Object.getOwnPropertyDescriptor(
    renderer.toTree,
    privateToTreeHostOutputMetadataSymbol
  );
  assert.equal(toTreeMetadataDescriptor.enumerable, false, label);
  assert.equal(toTreeMetadataDescriptor.configurable, false, label);
  assert.equal(toTreeMetadataDescriptor.writable, false, label);
  assertPrivateToTreeHostOutputMetadata(
    toTreeMetadataDescriptor.value,
    label
  );
  const toTreeFacadeDescriptor = Object.getOwnPropertyDescriptor(
    renderer.toTree,
    privateToTreeFacadeSymbol
  );
  assert.equal(toTreeFacadeDescriptor.enumerable, false, label);
  assert.equal(toTreeFacadeDescriptor.configurable, false, label);
  assert.equal(toTreeFacadeDescriptor.writable, false, label);
  assertPrivateToTreeFacade(toTreeFacadeDescriptor.value, label);
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
  assert.equal(gate.rootRequestRecordOnly, false);
  assert.equal(gate.privateRootExecutionBridgeAvailable, true);
  assert.equal(gate.rustRootExecutionBoundaryCallable, true);
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
    [
      "private-rust-native-test-renderer-root-execution-bridge",
      ...missingPrerequisites
    ]
  );
  assert.equal(Object.isFrozen(gate.prerequisites[0]), true);
  assert.equal(gate.prerequisites[0].present, true);
  assert.equal(gate.prerequisites[0].requiredBeforeCreateRouting, false);
  assert.match(gate.prerequisites[0].reason, /private bridge shape/u);

  for (const prerequisite of gate.prerequisites.slice(1)) {
    assert.equal(Object.isFrozen(prerequisite), true);
    assert.equal(prerequisite.present, false);
    assert.equal(prerequisite.requiredBeforeCreateRouting, true);
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
  assertLifecycleDiagnosticGate(gate.updateUnmountRustLifecycleDiagnosticGate);
  assert.equal(gate.privateUpdateUnmountLifecycleDiagnosticsAccepted, true);
  assert.equal(
    gate.privateUpdateUnmountLifecycleDiagnosticConsumptionAvailable,
    true
  );
  assert.equal(
    error.toTreeHostOutputMetadataGate,
    gate.toTreeHostOutputMetadataGate
  );
  assertPrivateToTreeHostOutputMetadataGate(
    gate.toTreeHostOutputMetadataGate,
    entrypoint
  );
  assert.equal(error.toTreePrivateFacadeGate, gate.toTreePrivateFacadeGate);
  assertPrivateToTreeFacadeGate(gate.toTreePrivateFacadeGate, entrypoint);
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
  assert.equal(privateRoute.acceptedRustLifecycleDiagnostics, true);
  assert.equal(privateRoute.consumesAcceptedRustLifecycleDiagnostics, true);
  assertLifecycleDiagnosticGate(privateRoute.lifecycleDiagnosticGate);
  assert.deepEqual(
    privateRoute.acceptedRustRecords,
    acceptedRustLifecycleDiagnosticRecords
  );
  assert.deepEqual(privateRoute.acceptedLifecycleStates, [
    rootLifecycleActive,
    rootLifecycleUnmountScheduled
  ]);
  assert.deepEqual(privateRoute.acceptedOutcomes, expected.acceptedOutcomes);
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

function assertLifecycleDiagnosticGate(gate) {
  assert.equal(Object.isFrozen(gate), true);
  assert.equal(
    gate.id,
    "react-test-renderer-update-unmount-rust-lifecycle-diagnostic-gate"
  );
  assert.equal(gate.status, lifecycleDiagnosticGateStatus);
  assert.equal(gate.deterministic, true);
  assert.equal(gate.acceptedRustCrate, "fast-react-test-renderer");
  assert.deepEqual(gate.acceptedRustRecords, acceptedRustLifecycleDiagnosticRecords);
  assert.deepEqual(gate.acceptedOperations, ["create", "update", "unmount"]);
  assert.deepEqual(gate.acceptedLifecycleStates, [
    rootLifecycleActive,
    rootLifecycleUnmountScheduled
  ]);
  assert.deepEqual(gate.acceptedOutcomes, [
    rootUpdateOutcomeScheduled,
    rootUpdateOutcomeIgnoredAfterUnmount,
    rootUpdateOutcomeAlreadyUnmountScheduled
  ]);
  assert.deepEqual(gate.acceptedScheduledElementKinds, [
    "RootElementHandle",
    "RootElementHandle::NONE"
  ]);
  assert.deepEqual(gate.acceptedContainerUpdateApis, [
    "update_container",
    "update_container_sync"
  ]);
  assert.deepEqual(gate.acceptedWorkers, [
    "worker-153-test-renderer-root-canary",
    "worker-234-test-renderer-host-output-update-unmount-canary",
    "worker-307-test-renderer-update-unmount-private-js-bridge"
  ]);
  assert.deepEqual(gate.acceptedRustTests, [
    "root_update_reuses_same_fiber_root_and_shared_scheduler_record",
    "root_update_after_unmount_does_not_mutate_or_reschedule",
    "root_unmount_enqueues_sync_null_update_before_wrapper_invalidation",
    "root_unmount_is_idempotent"
  ]);
  assert.equal(gate.privateDiagnosticConsumptionAvailable, true);
  assert.equal(gate.publicCreateUpdateUnmountBehaviorAvailable, false);
  assert.equal(gate.publicRouteAvailable, false);
  assert.equal(gate.nativeBridgeAvailable, false);
  assert.equal(gate.nativeExecution, false);
  assert.equal(gate.rustExecutionFromJs, false);
  assert.equal(gate.reconcilerExecutionFromJs, false);
  assert.equal(gate.hostOutputProducedFromJs, false);
  assert.equal(gate.compatibilityClaimed, false);
}

function assertPrivateToTreeHostOutputMetadataGate(gate, entrypoint) {
  assert.equal(Object.isFrozen(gate), true, entrypoint);
  assert.equal(
    gate.id,
    "react-test-renderer-totree-private-host-output-metadata-gate",
    entrypoint
  );
  assert.equal(gate.publicSurface, "create().toTree", entrypoint);
  assert.equal(
    gate.status,
    "ready-for-private-diagnostics-public-totree-blocked",
    entrypoint
  );
  assert.equal(gate.deterministic, true, entrypoint);
  assert.equal(gate.privateHostOutputTreeMetadataAvailable, true, entrypoint);
  assert.equal(
    gate.privateMetadataSymbol,
    privateToTreeHostOutputMetadataSymbolDescription,
    entrypoint
  );
  assert.equal(
    gate.privateMetadataStatus,
    "private-host-output-totree-metadata-ready-public-totree-blocked",
    entrypoint
  );
  assert.equal(
    gate.privateFacadeSymbol,
    privateToTreeFacadeSymbolDescription,
    entrypoint
  );
  assert.equal(
    gate.privateFacadeStatus,
    "private-tree-diagnostics-serializable-public-totree-blocked",
    entrypoint
  );
  assert.deepEqual(gate.acceptedMinimalFiberShape, [
    "HostRoot",
    "HostComponent",
    "HostText"
  ]);
  assert.deepEqual(gate.acceptedCompositeFiberShape, [
    "HostRoot",
    "FunctionComponent",
    "HostComponent",
    "HostText"
  ]);
  assert.equal(gate.acceptedReactSourceAlgorithm, "ReactTestRenderer.js toTree");
  assert.equal(gate.hostRootBehavior, "childrenToTree(node.child)", entrypoint);
  assert.match(gate.functionComponentBehavior, /nodeType 'component'/u, entrypoint);
  assert.match(gate.hostComponentBehavior, /nodeType 'host'/u, entrypoint);
  assert.match(gate.hostTextBehavior, /text string/u, entrypoint);
  assert.equal(gate.acceptedRustPrivateJsonDiagnostics, true, entrypoint);
  assert.equal(gate.acceptedRustPrivateTreeMetadata, true, entrypoint);
  assert.equal(gate.acceptedRustPrivateCompositeTreeMetadata, true, entrypoint);
  assert.equal(gate.acceptedCommittedFiberInspection, true, entrypoint);
  assert.equal(gate.privateCompositeFunctionMetadataAvailable, true, entrypoint);
  assert.equal(gate.publicTreeAvailable, false, entrypoint);
  assert.equal(gate.publicRouteAvailable, false, entrypoint);
  assert.equal(gate.nativeBridgeAvailable, false, entrypoint);
  assert.equal(gate.nativeExecution, false, entrypoint);
  assert.equal(gate.compatibilityClaimed, false, entrypoint);
  assert.equal(
    gate.acceptedWorker,
    "worker-364-test-renderer-totree-private-host-output",
    entrypoint
  );
  assert.deepEqual(gate.acceptedRustWorkers, [
    "worker-235-test-renderer-private-fiber-inspection",
    "worker-265-test-renderer-private-json-ready-diagnostics"
  ]);
  assert.deepEqual(gate.acceptedRustApis, [
    "inspect_test_renderer_committed_fiber_tree",
    "TestRendererCommittedFiberTreeInspection::host_root",
    "TestRendererCommittedFiberTreeInspection::host_component",
    "TestRendererCommittedFiberTreeInspection::host_text",
    "TestRendererRoot::describe_private_json_serialization_for_canary",
    "TestRendererRoot::describe_private_tree_metadata_for_canary",
    "TestRendererRoot::describe_private_tree_metadata_after_update_for_canary",
    "TestRendererPrivateJsonSerializationReport",
    "TestRendererPrivateTreeMetadataReport",
    "TestRendererPrivateTreeFunctionComponentDiagnostic"
  ]);
  assert.deepEqual(gate.acceptedRustTests, [
    "committed_fiber_inspection_describes_host_root_component_and_text",
    "root_private_json_serialization_canary_describes_minimal_host_component_with_text",
    "root_private_tree_metadata_canary_describes_minimal_host_component_with_text",
    "root_private_tree_metadata_canary_describes_updated_host_component_text_after_commit",
    "root_private_tree_metadata_canary_describes_function_component_above_host_output"
  ]);
  assert.deepEqual(gate.blockedPublicSurfaces, [
    "create().toTree",
    "create().toJSON",
    "create().root",
    "ReactTestInstance",
    "public-js-react-test-renderer-routing",
    "compatibility-claim"
  ]);
  assert.deepEqual(gate.missingPrerequisites, [
    "rust-native-test-renderer-create-bridge",
    "public-react-test-renderer-totree-bridge",
    "public-test-instance-and-totree-serialization-contract"
  ]);
}

function assertPrivateToTreeHostOutputMetadata(record, entrypoint) {
  assert.equal(Object.isFrozen(record), true, entrypoint);
  assert.equal(
    record.id,
    "react-test-renderer-totree-private-host-output-metadata",
    entrypoint
  );
  assert.equal(
    record.status,
    "private-host-output-totree-metadata-ready-public-totree-blocked",
    entrypoint
  );
  assert.equal(
    entrypoint.startsWith(record.entrypoint),
    true,
    `${entrypoint} entrypoint`
  );
  assert.equal(record.publicSurface, "create().toTree", entrypoint);
  assert.equal(
    record.symbol,
    privateToTreeHostOutputMetadataSymbolDescription,
    entrypoint
  );
  assertPrivateToTreeHostOutputMetadataGate(record.gate, entrypoint);
  assert.equal(record.privateHostOutputTreeMetadataAvailable, true, entrypoint);
  assert.equal(record.publicTreeAvailable, false, entrypoint);
  assert.equal(record.publicRouteAvailable, false, entrypoint);
  assert.equal(record.nativeBridgeAvailable, false, entrypoint);
  assert.equal(record.nativeExecution, false, entrypoint);
  assert.equal(record.compatibilityClaimed, false, entrypoint);
  assert.equal(
    typeof record.canDescribeAcceptedHostOutputDiagnostic,
    "function",
    entrypoint
  );
  assert.equal(
    typeof record.describeAcceptedHostOutputDiagnostic,
    "function",
    entrypoint
  );
}

function assertPrivateToTreeFacadeGate(gate, entrypoint) {
  assert.equal(Object.isFrozen(gate), true, entrypoint);
  assert.equal(
    gate.id,
    "react-test-renderer-totree-private-facade-gate",
    entrypoint
  );
  assert.equal(gate.publicSurface, "create().toTree", entrypoint);
  assert.equal(
    gate.status,
    "ready-for-private-diagnostics-public-totree-blocked",
    entrypoint
  );
  assert.equal(gate.privateFacadeGateAvailable, true, entrypoint);
  assert.equal(gate.privateTreeMetadataSerializable, true, entrypoint);
  assert.equal(
    gate.privateFacadeSymbol,
    privateToTreeFacadeSymbolDescription,
    entrypoint
  );
  assert.equal(
    gate.privateFacadeStatus,
    "private-tree-diagnostics-serializable-public-totree-blocked",
    entrypoint
  );
  assert.equal(gate.acceptedRustPrivateTreeMetadata, true, entrypoint);
  assert.equal(gate.acceptedRustPrivateCompositeTreeMetadata, true, entrypoint);
  assert.equal(
    gate.acceptedRustDiagnosticName,
    "fast-react-test-renderer.serialization.private-tree-canary",
    entrypoint
  );
  assert.deepEqual(gate.acceptedMinimalFiberShape, [
    "HostRoot",
    "HostComponent",
    "HostText"
  ]);
  assert.deepEqual(gate.acceptedCompositeFiberShape, [
    "HostRoot",
    "FunctionComponent",
    "HostComponent",
    "HostText"
  ]);
  assert.equal(gate.privateCompositeFunctionMetadataSerializable, true, entrypoint);
  assert.deepEqual(gate.acceptedHostOutputUpdateKinds, [
    "Create",
    "Update"
  ]);
  assert.equal(gate.hostOutputSnapshotFreshnessRequired, true, entrypoint);
  assert.equal(gate.staleSnapshotRejection, true, entrypoint);
  assert.equal(gate.publicTreeAvailable, false, entrypoint);
  assert.equal(gate.publicRouteAvailable, false, entrypoint);
  assert.equal(gate.nativeBridgeAvailable, false, entrypoint);
  assert.equal(gate.nativeExecution, false, entrypoint);
  assert.equal(gate.compatibilityClaimed, false, entrypoint);
  assert.equal(
    gate.acceptedWorker,
    "worker-392-test-renderer-public-totree-private-facade",
    entrypoint
  );
  assert.deepEqual(gate.acceptedRustApis, [
    "TestRendererRoot::describe_private_tree_metadata_for_canary",
    "TestRendererRoot::describe_private_tree_metadata_after_update_for_canary",
    "TestRendererPrivateTreeMetadataReport",
    "TestRendererPrivateTreeFunctionComponentDiagnostic",
    "TestRendererPrivateTreeHostComponentDiagnostic",
    "TestRendererPrivateTreeHostTextDiagnostic"
  ]);
  assert.deepEqual(gate.acceptedRustTests, [
    "root_private_tree_metadata_canary_describes_minimal_host_component_with_text",
    "root_private_tree_metadata_canary_describes_updated_host_component_text_after_commit",
    "root_private_tree_metadata_canary_describes_function_component_above_host_output",
    "root_private_tree_metadata_canary_rejects_stale_host_output_snapshot"
  ]);
  assert.deepEqual(gate.blockedPublicSurfaces, [
    "create().toTree",
    "create().toJSON",
    "create().root",
    "ReactTestInstance",
    "public-js-react-test-renderer-routing",
    "compatibility-claim"
  ]);
}

function assertPrivateToTreeFacade(record, entrypoint) {
  assert.equal(Object.isFrozen(record), true, entrypoint);
  assert.equal(
    record.id,
    "react-test-renderer-totree-private-facade",
    entrypoint
  );
  assert.equal(
    record.status,
    "private-tree-diagnostics-serializable-public-totree-blocked",
    entrypoint
  );
  assert.equal(
    entrypoint.startsWith(record.entrypoint),
    true,
    `${entrypoint} entrypoint`
  );
  assert.equal(record.publicSurface, "create().toTree", entrypoint);
  assert.equal(record.symbol, privateToTreeFacadeSymbolDescription, entrypoint);
  assertPrivateToTreeFacadeGate(record.gate, entrypoint);
  assertPrivateToTreeHostOutputMetadataGate(record.metadataGate, entrypoint);
  assert.equal(record.privateTreeMetadataSerializable, true, entrypoint);
  assert.equal(record.publicTreeAvailable, false, entrypoint);
  assert.equal(record.publicRouteAvailable, false, entrypoint);
  assert.equal(record.nativeBridgeAvailable, false, entrypoint);
  assert.equal(record.nativeExecution, false, entrypoint);
  assert.equal(record.compatibilityClaimed, false, entrypoint);
  assert.equal(
    typeof record.canSerializeAcceptedTreeMetadata,
    "function",
    entrypoint
  );
  assert.equal(
    typeof record.serializeAcceptedTreeMetadata,
    "function",
    entrypoint
  );
}

function assertPrivateTestInstanceWrapperSkeleton(
  record,
  entrypoint,
  options = {}
) {
  assert.equal(Object.isFrozen(record), true, entrypoint);
  assert.equal(
    record.id,
    "react-test-renderer-private-test-instance-wrapper-skeleton",
    entrypoint
  );
  const bridgeRouted = options.rootRequest !== undefined;
  assert.equal(
    record.status,
    bridgeRouted
      ? "private-bridge-query-metadata-ready-public-test-instance-blocked"
      : "private-record-ready-public-test-instance-blocked",
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

  if (bridgeRouted) {
    assert.equal(record.bridgeRouted, true, entrypoint);
    assert.equal(record.consumesRootBridgeMetadata, true, entrypoint);
    assert.equal(record.standaloneWrapperMetadata, false, entrypoint);
    assert.equal(
      record.bridgeMetadataSource,
      "FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata",
      entrypoint
    );
    assert.equal(record.rootRequest, options.rootRequest, entrypoint);
    assert.equal(
      record.rootHandle,
      options.rootRequest.rootHandle,
      entrypoint
    );
    assert.equal(record.rootId, options.rootRequest.rootId, entrypoint);
    assert.equal(
      record.rootRequestId,
      options.rootRequest.requestId,
      entrypoint
    );
    assert.equal(
      record.rootRequestSequence,
      options.rootRequest.requestSequence,
      entrypoint
    );
    assert.equal(
      record.rootRequestStatus,
      rootRequestStatus,
      entrypoint
    );
    assert.equal(
      record.rootRequestExecutionStatus,
      rootRequestExecutionStatus,
      entrypoint
    );
    assert.equal(
      record.rootRequestCompatibilityStatus,
      rootRequestCompatibilityStatus,
      entrypoint
    );
    assert.equal(record.rootRequestOperation, "create", entrypoint);
    assert.equal(
      record.rootRequestRustCanaryMetadata,
      options.rootRequest.rustCanaryMetadata,
      entrypoint
    );
    assert.equal(
      record.rootRequestTestInstanceQueryMetadata,
      options.rootRequest.rustCanaryMetadata.testInstanceQuery,
      entrypoint
    );
    assert.equal(record.rustExecution, false, entrypoint);
    assert.equal(record.reconcilerExecution, false, entrypoint);
    assert.equal(record.hostOutputProducedFromJs, false, entrypoint);
    assertPrivateTestInstanceRootBridgeMetadata(
      record.rootBridgeMetadata,
      options.rootRequest,
      entrypoint
    );
    if (options.bridge !== undefined) {
      assert.equal(
        options.bridge.getTestInstanceQueryDiagnostics(options.rootRequest),
        record,
        entrypoint
      );
    }
  } else {
    assert.equal(Object.hasOwn(record, "rootRequest"), false, entrypoint);
    assert.equal(Object.hasOwn(record, "rootBridgeMetadata"), false, entrypoint);
  }

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
  assert.deepEqual(fiberInspection.privateQueryShape, [
    "HostRoot",
    "HostText",
    "HostComponent",
    "HostText"
  ]);
  assertMultiChildHostTree(fiberInspection.multiChildHostTree, entrypoint);
  assert.equal(fiberInspection.multiChildHostTree, record.multiChildHostTree);
  assert.equal(fiberInspection.exposesHostNodes, false, entrypoint);
  assert.equal(fiberInspection.mutatesFibers, false, entrypoint);

  assertMultiChildHostTree(record.multiChildHostTree, entrypoint);
  assertAcceptedInspectionRecords(record, entrypoint);
  assertPrivateQueryTraversal(record, entrypoint);

  assert.equal(Object.isFrozen(record.queryRecords), true, entrypoint);
  assert.deepEqual(Object.keys(record.queryRecords), [
    "root",
    "type",
    "props",
    "children",
    "hostComponentType",
    "hostComponentProps",
    "hostComponentChildren"
  ]);
  assert.equal(record.rootQueryRecord, record.queryRecords.root, entrypoint);
  assertPrivateQueryRecord(
    record.queryRecords.root,
    {
      fiberTag: "HostRoot",
      id: "react-test-renderer-private-test-instance-root-query",
      query: "root",
      source: "ReactTestRenderer.js create().root multi-child HostRoot branch"
    },
    entrypoint
  );
  assertPrivateQueryRecord(
    record.queryRecords.type,
    {
      fiberTag: "HostRoot",
      id: "react-test-renderer-private-test-instance-host-root-type-query",
      query: "type"
    },
    entrypoint
  );
  assertPrivateQueryRecord(
    record.queryRecords.props,
    {
      fiberTag: "HostRoot",
      id: "react-test-renderer-private-test-instance-host-root-props-query",
      query: "props"
    },
    entrypoint
  );
  assertPrivateQueryRecord(
    record.queryRecords.children,
    {
      fiberTag: "HostRoot",
      id: "react-test-renderer-private-test-instance-host-root-children-query",
      query: "children"
    },
    entrypoint
  );
  assertPrivateQueryRecord(
    record.queryRecords.hostComponentType,
    {
      fiberTag: "HostComponent",
      id: "react-test-renderer-private-test-instance-type-query",
      query: "type"
    },
    entrypoint
  );
  assertPrivateQueryRecord(
    record.queryRecords.hostComponentProps,
    {
      fiberTag: "HostComponent",
      id: "react-test-renderer-private-test-instance-props-query",
      query: "props"
    },
    entrypoint
  );
  assertPrivateQueryRecord(
    record.queryRecords.hostComponentChildren,
    {
      fiberTag: "HostComponent",
      id: "react-test-renderer-private-test-instance-children-query",
      query: "children"
    },
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
  assert.equal(rootRecord.fiberTag, "HostRoot", entrypoint);
  assert.equal(rootRecord.inspectionRecord, record.queryPath[0], entrypoint);
  assert.equal(rootRecord.type, null, entrypoint);
  assert.equal(rootRecord.props, null, entrypoint);
  assert.equal(Object.isFrozen(rootRecord.children), true, entrypoint);
  assert.equal(rootRecord.children.length, 2, entrypoint);
  assert.equal(rootRecord.queryRecords.type, record.queryRecords.type);
  assert.equal(rootRecord.queryRecords.props, record.queryRecords.props);
  assert.equal(rootRecord.queryRecords.children, record.queryRecords.children);

  const rootTextChild = rootRecord.children[0];
  assert.equal(Object.isFrozen(rootTextChild), true, entrypoint);
  assert.deepEqual(rootTextChild, {
    id: "react-test-renderer-private-test-instance-root-host-text-child",
    kind: "ReactTestInstancePrivateTextChildRecord",
    fiberTag: "HostText",
    source: "TestRendererCommittedFiberTreeInspection::host_text",
    text: "first sibling",
    publicObject: false
  });

  const hostComponent = rootRecord.children[1];
  assert.equal(Object.isFrozen(hostComponent), true, entrypoint);
  assert.equal(
    hostComponent.id,
    "react-test-renderer-private-test-instance-host-component-record",
    entrypoint
  );
  assert.equal(hostComponent.kind, "ReactTestInstancePrivateRecord", entrypoint);
  assert.equal(hostComponent.publicObject, false, entrypoint);
  assert.equal(hostComponent.fiberTag, "HostComponent", entrypoint);
  assert.equal(
    hostComponent.inspectionRecord,
    record.hostComponentQueryPath[0],
    entrypoint
  );
  assert.equal(hostComponent.type, "span", entrypoint);
  assert.equal(Object.isFrozen(hostComponent.props), true, entrypoint);
  assert.deepEqual(hostComponent.props, {});
  assert.equal(Object.isFrozen(hostComponent.children), true, entrypoint);
  assert.equal(hostComponent.children.length, 1, entrypoint);
  assert.equal(
    hostComponent.queryRecords.type,
    record.queryRecords.hostComponentType
  );
  assert.equal(
    hostComponent.queryRecords.props,
    record.queryRecords.hostComponentProps
  );
  assert.equal(
    hostComponent.queryRecords.children,
    record.queryRecords.hostComponentChildren
  );
  assert.deepEqual(hostComponent.children[0], {
    id: "react-test-renderer-private-test-instance-nested-host-text-child",
    kind: "ReactTestInstancePrivateTextChildRecord",
    fiberTag: "HostText",
    source: "TestRendererCommittedFiberTreeInspection::host_text",
    text: "second sibling",
    publicObject: false
  });

  for (const queryName of testInstanceQuerySurfaceNames) {
    assert.equal(
      Object.hasOwn(rootRecord, queryName),
      false,
      `${entrypoint} ${queryName}`
    );
    assert.equal(
      Object.hasOwn(hostComponent, queryName),
      false,
      `${entrypoint} component ${queryName}`
    );
  }
}

function assertPrivateTestInstanceRootBridgeMetadata(
  metadata,
  rootRequest,
  entrypoint
) {
  assert.equal(Object.isFrozen(metadata), true, entrypoint);
  assert.equal(
    metadata.id,
    "react-test-renderer-private-test-instance-root-bridge-metadata",
    entrypoint
  );
  assert.equal(
    metadata.bridgeKind,
    "FastReactTestRendererPrivateRootRequestBridge",
    entrypoint
  );
  assert.equal(metadata.bridgeSymbol, rootRequestBridgeSymbol.description);
  assert.equal(
    metadata.source,
    "FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata",
    entrypoint
  );
  assert.equal(
    metadata.status,
    "private-test-instance-query-diagnostics-routed-through-root-bridge",
    entrypoint
  );
  assert.equal(metadata.rootRequest, rootRequest, entrypoint);
  assert.equal(metadata.rootHandle, rootRequest.rootHandle, entrypoint);
  assert.equal(metadata.rootId, rootRequest.rootId, entrypoint);
  assert.equal(metadata.rootSequence, rootRequest.rootSequence, entrypoint);
  assert.equal(metadata.createRequestId, rootRequest.requestId, entrypoint);
  assert.equal(
    metadata.createRequestSequence,
    rootRequest.requestSequence,
    entrypoint
  );
  assert.equal(metadata.createRequestStatus, rootRequestStatus, entrypoint);
  assert.equal(
    metadata.createRequestExecutionStatus,
    rootRequestExecutionStatus,
    entrypoint
  );
  assert.equal(
    metadata.createRequestCompatibilityStatus,
    rootRequestCompatibilityStatus,
    entrypoint
  );
  assert.equal(
    metadata.rustCanaryMetadata,
    rootRequest.rustCanaryMetadata,
    entrypoint
  );
  assert.equal(
    metadata.testInstanceQueryMetadata,
    rootRequest.rustCanaryMetadata.testInstanceQuery,
    entrypoint
  );
  assert.equal(metadata.recordOnlyPrivateBridge, false, entrypoint);
  assert.equal(metadata.nativeBridgeAvailable, false, entrypoint);
  assert.equal(metadata.nativeExecution, false, entrypoint);
  assert.equal(metadata.rustExecution, false, entrypoint);
  assert.equal(metadata.reconcilerExecution, false, entrypoint);
  assert.equal(metadata.hostOutputProduced, false, entrypoint);
  assert.equal(metadata.compatibilityClaimed, false, entrypoint);

  const queryMetadata = metadata.testInstanceQueryMetadata;
  assert.equal(Object.isFrozen(queryMetadata), true, entrypoint);
  assert.equal(
    queryMetadata.diagnosticKind,
    "ReactTestInstancePrivateQueryMetadata",
    entrypoint
  );
  assert.equal(
    queryMetadata.status,
    "private-test-instance-query-diagnostics-routed-through-root-bridge",
    entrypoint
  );
  assert.equal(
    queryMetadata.bridgeMetadataSource,
    "FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata",
    entrypoint
  );
  assert.deepEqual(queryMetadata.acceptedQuerySurfaces, [
    "root",
    "find",
    "findAll",
    "findByType",
    "findAllByType",
    "findByProps",
    "findAllByProps"
  ]);
  assert.deepEqual(queryMetadata.fixtureShape, [
    "HostRoot",
    "HostText",
    "HostComponent",
    "HostText"
  ]);
  assert.equal(queryMetadata.queryCandidateCount, 2, entrypoint);
  assert.equal(queryMetadata.skippedTextRecordCount, 2, entrypoint);
  assert.equal(queryMetadata.publicRootAvailable, false, entrypoint);
  assert.equal(queryMetadata.publicQueryMethodsAvailable, false, entrypoint);
  assert.equal(
    queryMetadata.publicTestInstanceObjectAvailable,
    false,
    entrypoint
  );
  assert.equal(queryMetadata.compatibilityClaimed, false, entrypoint);
}

function assertMultiChildHostTree(tree, entrypoint) {
  assert.equal(Object.isFrozen(tree), true, entrypoint);
  assert.equal(
    tree.id,
    "react-test-renderer-private-test-instance-multi-child-host-tree",
    entrypoint
  );
  assert.equal(
    tree.status,
    "private-multi-child-query-metadata-ready-public-root-blocked",
    entrypoint
  );
  assert.equal(
    tree.acceptedWorker,
    "worker-350-root-work-loop-complete-work-multiple-child-handoff",
    entrypoint
  );
  assert.equal(tree.acceptedRustModule, "host_work/root_work_loop", entrypoint);
  assert.deepEqual(tree.acceptedRustApis, [
    "mount_test_host_sibling_work",
    "handoff_completed_host_root_render_to_test_complete_work_for_siblings"
  ]);
  assert.deepEqual(tree.acceptedRustTests, [
    "host_work_mounts_multiple_host_root_siblings_under_host_root_wip",
    "root_work_loop_hands_multiple_host_siblings_to_test_complete_work",
    "root_work_loop_multiple_sibling_handoff_preserves_fragment_portal_suspense_blockers"
  ]);
  assert.equal(tree.rootChildCount, 2, entrypoint);
  assert.equal(tree.completedChildCount, 2, entrypoint);
  assert.equal(tree.queryCandidateCount, 2, entrypoint);
  assert.equal(tree.skippedTextRecordCount, 2, entrypoint);
  assert.equal(tree.rootWrapperMaterializedForPrivateMetadata, true, entrypoint);
  assert.equal(tree.publicRootAccessAvailable, false, entrypoint);
  assert.equal(tree.publicTestInstanceObjectAvailable, false, entrypoint);
  assert.equal(tree.nativeBridgeAvailable, false, entrypoint);
  assert.equal(tree.nativeExecution, false, entrypoint);
  assert.equal(tree.compatibilityClaimed, false, entrypoint);
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
      "react-test-renderer-private-test-instance-inspection-root-host-text",
      "react-test-renderer-private-test-instance-inspection-host-component",
      "react-test-renderer-private-test-instance-inspection-host-text"
    ],
    entrypoint
  );

  const [hostRoot, rootText, hostComponent, hostText] =
    record.acceptedInspectionRecords;
  assertPrivateInspectionRecord(hostRoot, {
    childRecord:
      "react-test-renderer-private-test-instance-inspection-root-host-text",
    index: 0,
    fiberTag: "HostRoot",
    parentRecord: null,
    path: ["HostRoot"],
    queryCandidate: true,
    siblingRecord: null,
    source: "TestRendererCommittedFiberTreeInspection::host_root",
    wrapperEligible: true
  }, entrypoint);
  assert.deepEqual(hostRoot.childRecords, [
    "react-test-renderer-private-test-instance-inspection-root-host-text",
    "react-test-renderer-private-test-instance-inspection-host-component"
  ]);
  assert.equal(hostRoot.rootChildCount, 2, entrypoint);
  assert.equal(
    hostRoot.wrapperEligibilityReason,
    "ReactTestRenderer.js materializes HostRoot when root has multiple children",
    entrypoint
  );

  assertPrivateInspectionRecord(rootText, {
    childRecord: null,
    index: 0,
    fiberTag: "HostText",
    parentRecord:
      "react-test-renderer-private-test-instance-inspection-host-root",
    path: ["HostRoot", "HostText[0]"],
    queryCandidate: false,
    siblingRecord:
      "react-test-renderer-private-test-instance-inspection-host-component",
    source: "TestRendererCommittedFiberTreeInspection::host_text",
    wrapperEligible: false
  }, entrypoint);
  assert.equal(rootText.text, "first sibling", entrypoint);
  assert.equal(rootText.skippedByQueryTraversal, true, entrypoint);

  assertPrivateInspectionRecord(hostComponent, {
    childRecord: "react-test-renderer-private-test-instance-inspection-host-text",
    index: 1,
    fiberTag: "HostComponent",
    parentRecord:
      "react-test-renderer-private-test-instance-inspection-host-root",
    path: ["HostRoot", "HostComponent[1]"],
    queryCandidate: true,
    siblingRecord: null,
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
  assert.equal(
    hostComponent.props,
    record.queryRecords.hostComponentProps.value,
    entrypoint
  );

  assertPrivateInspectionRecord(hostText, {
    childRecord: null,
    index: 0,
    fiberTag: "HostText",
    parentRecord:
      "react-test-renderer-private-test-instance-inspection-host-component",
    path: ["HostRoot", "HostComponent[1]", "HostText"],
    queryCandidate: false,
    siblingRecord: null,
    source: "TestRendererCommittedFiberTreeInspection::host_text",
    wrapperEligible: false
  }, entrypoint);
  assert.equal(hostText.text, "second sibling", entrypoint);
  assert.equal(hostText.skippedByQueryTraversal, true, entrypoint);
}

function assertPrivateInspectionRecord(record, expected, entrypoint) {
  assert.equal(Object.isFrozen(record), true, entrypoint);
  assert.equal(record.kind, "TestRendererCommittedFiberNodeInspection", entrypoint);
  assert.equal(record.source, expected.source, entrypoint);
  assert.equal(record.fiberTag, expected.fiberTag, entrypoint);
  assert.equal(record.index, expected.index, entrypoint);
  assert.equal(record.parentRecord, expected.parentRecord, entrypoint);
  assert.equal(record.childRecord, expected.childRecord, entrypoint);
  assert.equal(record.siblingRecord, expected.siblingRecord, entrypoint);
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
  assert.equal(traversal.rootChildCount, 2, entrypoint);
  assert.equal(traversal.rootCandidateCount, 2, entrypoint);
  assert.equal(traversal.acceptedCandidateCount, 2, entrypoint);
  assert.equal(traversal.skippedTextChildCount, 2, entrypoint);
  assert.equal(traversal.textChildrenSkipped, true, entrypoint);
  assert.equal(
    traversal.rootWrapperMaterializedForPrivateMetadata,
    true,
    entrypoint
  );
  assert.equal(traversal.multiChildHostTree, record.multiChildHostTree);
  assert.equal(traversal.publicQueryMethodsAvailable, false, entrypoint);
  assert.equal(traversal.predicateExecution, false, entrypoint);
  assert.equal(traversal.nativeBridgeAvailable, false, entrypoint);
  assert.equal(traversal.nativeExecution, false, entrypoint);

  assert.equal(Object.isFrozen(record.queryPath), true, entrypoint);
  assert.deepEqual(
    record.queryPath.map((inspection) => inspection.id),
    [
      "react-test-renderer-private-test-instance-inspection-host-root",
      "react-test-renderer-private-test-instance-inspection-host-component"
    ],
    entrypoint
  );
  assert.equal(record.queryPath[0], record.acceptedInspectionRecords[0], entrypoint);
  assert.equal(record.queryPath[1], record.acceptedInspectionRecords[2], entrypoint);
  assert.equal(Object.isFrozen(record.hostComponentQueryPath), true, entrypoint);
  assert.deepEqual(
    record.hostComponentQueryPath.map((inspection) => inspection.id),
    ["react-test-renderer-private-test-instance-inspection-host-component"],
    entrypoint
  );
  assert.equal(
    record.hostComponentQueryPath[0],
    record.acceptedInspectionRecords[2],
    entrypoint
  );

  assert.equal(Object.isFrozen(record.queryMethodRecords), true, entrypoint);
  assert.deepEqual(Object.keys(record.queryMethodRecords), testInstanceQuerySurfaceNames);
  assertPrivateQueryMethodRecord(record.queryMethodRecords.find, {
    basedOn: record.queryMethodRecords.findAll.id,
    candidateRecords: record.queryPath,
    effectiveDeep: false,
    expectOne: true,
    expectedCanaryMatchCount: 2,
    id: "react-test-renderer-private-test-instance-find-query",
    publicSurface: "ReactTestInstance.find",
    query: "find",
    resultKind: "single"
  }, record, entrypoint);
  assertPrivateQueryMethodRecord(record.queryMethodRecords.findAll, {
    candidateRecords: record.queryPath,
    defaultDeep: true,
    effectiveDeep: true,
    expectedCanaryMatchCount: 2,
    id: "react-test-renderer-private-test-instance-find-all-query",
    publicSurface: "ReactTestInstance.findAll",
    query: "findAll",
    resultKind: "array"
  }, record, entrypoint);
  assertPrivateQueryMethodRecord(record.queryMethodRecords.findByType, {
    basedOn: record.queryMethodRecords.findAllByType.id,
    candidateRecords: record.hostComponentQueryPath,
    criteria: { kind: "type", value: "span" },
    effectiveDeep: false,
    expectOne: true,
    expectedCanaryMatchCount: 1,
    id: "react-test-renderer-private-test-instance-find-by-type-query",
    publicSurface: "ReactTestInstance.findByType",
    query: "findByType",
    resultKind: "single",
    traversedCandidateRecords: record.queryPath
  }, record, entrypoint);
  assertPrivateQueryMethodRecord(record.queryMethodRecords.findAllByType, {
    candidateRecords: record.hostComponentQueryPath,
    criteria: { kind: "type", value: "span" },
    defaultDeep: true,
    effectiveDeep: true,
    expectedCanaryMatchCount: 1,
    id: "react-test-renderer-private-test-instance-find-all-by-type-query",
    publicSurface: "ReactTestInstance.findAllByType",
    query: "findAllByType",
    resultKind: "array",
    traversedCandidateRecords: record.queryPath
  }, record, entrypoint);
  assertPrivateQueryMethodRecord(record.queryMethodRecords.findByProps, {
    basedOn: record.queryMethodRecords.findAllByProps.id,
    candidateRecords: record.hostComponentQueryPath,
    criteria: {
      kind: "props",
      value: record.queryRecords.hostComponentProps.value
    },
    effectiveDeep: false,
    expectOne: true,
    expectedCanaryMatchCount: 1,
    id: "react-test-renderer-private-test-instance-find-by-props-query",
    publicSurface: "ReactTestInstance.findByProps",
    query: "findByProps",
    resultKind: "single",
    traversedCandidateRecords: record.queryPath
  }, record, entrypoint);
  assertPrivateQueryMethodRecord(record.queryMethodRecords.findAllByProps, {
    candidateRecords: record.hostComponentQueryPath,
    criteria: {
      kind: "props",
      value: record.queryRecords.hostComponentProps.value
    },
    defaultDeep: true,
    effectiveDeep: true,
    expectedCanaryMatchCount: 1,
    id: "react-test-renderer-private-test-instance-find-all-by-props-query",
    publicSurface: "ReactTestInstance.findAllByProps",
    query: "findAllByProps",
    resultKind: "array",
    traversedCandidateRecords: record.queryPath
  }, record, entrypoint);
}

function assertPrivateFindAllPredicateDiagnostics(diagnostics, owner, entrypoint) {
  assert.equal(Object.isFrozen(diagnostics), true, entrypoint);
  assert.equal(
    diagnostics.id,
    "react-test-renderer-private-test-instance-find-all-query-diagnostics",
    entrypoint
  );
  assert.equal(
    diagnostics.diagnosticName,
    "fast-react-test-renderer.testinstance.find-all-private-query",
    entrypoint
  );
  assert.equal(
    diagnostics.status,
    "private-findall-query-diagnostics-ready-public-method-blocked",
    entrypoint
  );
  assert.equal(
    diagnostics.acceptedWorker,
    "worker-463-test-renderer-find-all-private-query",
    entrypoint
  );
  assert.equal(
    diagnostics.acceptedRustDiagnosticName,
    "fast-react-test-renderer.testinstance.find-all-private-query",
    entrypoint
  );
  assert.deepEqual(diagnostics.acceptedRustApis, [
    "TestRendererRoot::describe_private_test_instance_find_all_query_for_canary",
    "TestRendererRoot::describe_private_test_instance_find_all_query_after_update_for_canary",
    "TestRendererPrivateTestInstanceFindAllQueryDiagnostics",
    "TestRendererPrivateTestInstanceFindAllPredicateDiagnostic"
  ]);
  assert.deepEqual(diagnostics.acceptedRustTests, [
    "root_private_test_instance_find_all_query_diagnostics_describe_type_props_and_predicate_metadata",
    "root_private_test_instance_find_all_query_diagnostics_follow_update_host_output"
  ]);
  assert.equal(
    diagnostics.source,
    "ReactTestRenderer.js findAll(root, predicate, options)",
    entrypoint
  );
  assert.equal(
    diagnostics.acceptedReactSourceAlgorithm,
    "ReactTestRenderer.js findAll",
    entrypoint
  );
  assert.equal(diagnostics.traversalOrder, "self-then-descendants", entrypoint);
  assert.equal(diagnostics.defaultDeep, true, entrypoint);
  assert.equal(diagnostics.effectiveDeep, true, entrypoint);
  assert.deepEqual(diagnostics.predicateKinds, [
    "type",
    "props",
    "predicate-like"
  ]);
  assert.equal(diagnostics.predicateExecution, false, entrypoint);
  assert.equal(diagnostics.candidateRecords, owner.queryPath, entrypoint);
  assert.equal(diagnostics.skippedRecords, owner.queryMethodRecords.findAll.skippedRecords, entrypoint);
  assert.equal(diagnostics.publicQueryMethodAvailable, false, entrypoint);
  assert.equal(diagnostics.publicTestInstanceObjectAvailable, false, entrypoint);
  assert.equal(diagnostics.nativeBridgeAvailable, false, entrypoint);
  assert.equal(diagnostics.nativeExecution, false, entrypoint);
  assert.equal(diagnostics.compatibilityClaimed, false, entrypoint);

  assertPrivateFindAllPredicateRecord(diagnostics.typePredicate, {
    criteria: { kind: "type", value: "span" },
    id: "react-test-renderer-private-test-instance-find-all-type-predicate",
    predicateKind: "type",
    predicateSource: "node => node.type === type",
    source: "ReactTestRenderer.js ReactTestInstance.findAllByType"
  }, owner, entrypoint);
  assertPrivateFindAllPredicateRecord(diagnostics.propsPredicate, {
    criteria: {
      kind: "props",
      value: owner.queryRecords.hostComponentProps.value
    },
    id: "react-test-renderer-private-test-instance-find-all-props-predicate",
    predicateKind: "props",
    predicateSource: "node => node.props && propsMatch(node.props, props)",
    source: "ReactTestRenderer.js ReactTestInstance.findAllByProps"
  }, owner, entrypoint);
  assertPrivateFindAllPredicateRecord(diagnostics.predicateLike, {
    criteria: {
      kind: "predicate-like",
      props: owner.queryRecords.hostComponentProps.value,
      type: "span"
    },
    id: "react-test-renderer-private-test-instance-find-all-predicate-like",
    predicateKind: "predicate-like",
    predicateSource:
      "metadata-only predicate matching accepted type and props diagnostics",
    source: "ReactTestRenderer.js ReactTestInstance.findAll"
  }, owner, entrypoint);
}

function assertPrivateFindAllPredicateRecord(
  predicateRecord,
  expected,
  owner,
  entrypoint
) {
  assert.equal(Object.isFrozen(predicateRecord), true, entrypoint);
  assert.equal(predicateRecord.id, expected.id, entrypoint);
  assert.equal(
    predicateRecord.kind,
    "ReactTestInstancePrivateFindAllPredicateMetadata",
    entrypoint
  );
  assert.equal(predicateRecord.predicateKind, expected.predicateKind, entrypoint);
  assert.equal(predicateRecord.source, expected.source, entrypoint);
  assert.equal(
    predicateRecord.predicateSource,
    expected.predicateSource,
    entrypoint
  );
  assert.deepEqual(predicateRecord.criteria, expected.criteria, entrypoint);
  assert.equal(
    predicateRecord.evaluatedCandidateRecords,
    owner.queryPath,
    entrypoint
  );
  assert.equal(
    predicateRecord.matchedCandidateRecords,
    owner.hostComponentQueryPath,
    entrypoint
  );
  assert.deepEqual(
    predicateRecord.rejectedCandidateRecords.map((inspection) => inspection.id),
    ["react-test-renderer-private-test-instance-inspection-host-root"],
    entrypoint
  );
  assert.equal(
    predicateRecord.rejectedCandidateRecords[0],
    owner.acceptedInspectionRecords[0],
    entrypoint
  );
  assert.equal(
    predicateRecord.skippedRecords,
    owner.queryMethodRecords.findAll.skippedRecords,
    entrypoint
  );
  assert.equal(predicateRecord.expectedCanaryMatchCount, 1, entrypoint);
  assert.equal(predicateRecord.predicateExecution, false, entrypoint);
  assert.equal(predicateRecord.deterministic, true, entrypoint);
  assert.equal(predicateRecord.publicQueryMethodAvailable, false, entrypoint);
  assert.equal(
    predicateRecord.publicPredicateExecutionAvailable,
    false,
    entrypoint
  );
}

function assertPrivateFindByQueryDiagnostics(diagnostics, owner, entrypoint) {
  assert.equal(Object.isFrozen(diagnostics), true, entrypoint);
  assert.equal(
    diagnostics.id,
    "react-test-renderer-private-test-instance-find-by-query-diagnostics",
    entrypoint
  );
  assert.equal(
    diagnostics.diagnosticName,
    "fast-react-test-renderer.testinstance.find-by-private-query",
    entrypoint
  );
  assert.equal(
    diagnostics.status,
    "private-findby-query-diagnostics-ready-public-method-blocked",
    entrypoint
  );
  assert.equal(
    diagnostics.acceptedWorker,
    "worker-484-test-instance-find-by-private-query-gate",
    entrypoint
  );
  assert.equal(
    diagnostics.acceptedRustDiagnosticName,
    "fast-react-test-renderer.testinstance.find-by-private-query",
    entrypoint
  );
  assert.deepEqual(diagnostics.acceptedRustApis, [
    "TestRendererRoot::describe_private_test_instance_find_by_query_for_canary",
    "TestRendererRoot::describe_private_test_instance_find_by_query_after_update_for_canary",
    "TestRendererPrivateTestInstanceFindByQueryDiagnostics",
    "TestRendererPrivateTestInstanceFindByResultDiagnostic"
  ]);
  assert.deepEqual(diagnostics.acceptedRustTests, [
    "root_private_test_instance_find_by_query_diagnostics_build_on_find_all_metadata",
    "root_private_test_instance_find_by_query_diagnostics_follow_update_host_output"
  ]);
  assert.equal(
    diagnostics.source,
    "ReactTestRenderer.js ReactTestInstance.findByType/findByProps",
    entrypoint
  );
  assert.equal(
    diagnostics.acceptedReactSourceAlgorithm,
    "ReactTestRenderer.js expectOne(findAllBy*, {deep: false})",
    entrypoint
  );
  assert.equal(
    diagnostics.findAllDiagnosticName,
    owner.findAllPredicateDiagnostics.diagnosticName,
    entrypoint
  );
  assert.deepEqual(diagnostics.queries, ["findByType", "findByProps"]);
  assert.equal(diagnostics.effectiveDeep, false, entrypoint);
  assert.equal(diagnostics.expectOne, true, entrypoint);
  assert.equal(diagnostics.predicateExecution, false, entrypoint);
  assert.equal(diagnostics.publicQueryMethodAvailable, false, entrypoint);
  assert.equal(diagnostics.publicTestInstanceObjectAvailable, false, entrypoint);
  assert.equal(diagnostics.nativeBridgeAvailable, false, entrypoint);
  assert.equal(diagnostics.nativeExecution, false, entrypoint);
  assert.equal(diagnostics.compatibilityClaimed, false, entrypoint);

  assertPrivateFindByResultDiagnostics(diagnostics.typeQuery, {
    basedOnFindAllPredicate: owner.findAllPredicateDiagnostics.typePredicate,
    basedOnFindAllRecord: owner.queryMethodRecords.findAllByType,
    criteria: { kind: "type", value: "span" },
    expectOneMessage: "with node type: \"span\"",
    id: "react-test-renderer-private-test-instance-find-by-type-query-diagnostics",
    publicSurface: "ReactTestInstance.findByType",
    query: "findByType",
    source: "ReactTestRenderer.js ReactTestInstance.findByType"
  }, owner, entrypoint);
  assertPrivateFindByResultDiagnostics(diagnostics.propsQuery, {
    basedOnFindAllPredicate: owner.findAllPredicateDiagnostics.propsPredicate,
    basedOnFindAllRecord: owner.queryMethodRecords.findAllByProps,
    criteria: {
      kind: "props",
      value: owner.queryRecords.hostComponentProps.value
    },
    expectOneMessage: "with props: {}",
    id: "react-test-renderer-private-test-instance-find-by-props-query-diagnostics",
    publicSurface: "ReactTestInstance.findByProps",
    query: "findByProps",
    source: "ReactTestRenderer.js ReactTestInstance.findByProps"
  }, owner, entrypoint);
}

function assertPrivateFindByResultDiagnostics(
  resultDiagnostics,
  expected,
  owner,
  entrypoint
) {
  assert.equal(Object.isFrozen(resultDiagnostics), true, entrypoint);
  assert.equal(resultDiagnostics.id, expected.id, entrypoint);
  assert.equal(
    resultDiagnostics.kind,
    "ReactTestInstancePrivateFindByQueryMetadata",
    entrypoint
  );
  assert.equal(resultDiagnostics.query, expected.query, entrypoint);
  assert.equal(
    resultDiagnostics.publicSurface,
    expected.publicSurface,
    entrypoint
  );
  assert.equal(
    resultDiagnostics.status,
    "private-findby-query-diagnostics-ready-public-method-blocked",
    entrypoint
  );
  assert.equal(resultDiagnostics.source, expected.source, entrypoint);
  assert.equal(
    resultDiagnostics.basedOnFindAllRecord,
    expected.basedOnFindAllRecord,
    entrypoint
  );
  assert.equal(
    resultDiagnostics.basedOnFindAllPredicate,
    expected.basedOnFindAllPredicate,
    entrypoint
  );
  assert.equal(
    resultDiagnostics.expectOneSource,
    "ReactTestRenderer.js expectOne",
    entrypoint
  );
  assert.equal(
    resultDiagnostics.expectOneMessage,
    expected.expectOneMessage,
    entrypoint
  );
  assert.equal(
    resultDiagnostics.zeroMatchErrorPrefix,
    "No instances found ",
    entrypoint
  );
  assert.equal(
    resultDiagnostics.duplicateMatchErrorPrefix,
    "Expected 1 but found N instances ",
    entrypoint
  );
  assert.deepEqual(resultDiagnostics.criteria, expected.criteria, entrypoint);
  assert.equal(resultDiagnostics.resultKind, "single", entrypoint);
  assert.equal(resultDiagnostics.effectiveDeep, false, entrypoint);
  assert.equal(resultDiagnostics.expectOne, true, entrypoint);
  assert.equal(resultDiagnostics.expectedCanaryMatchCount, 1, entrypoint);
  assert.equal(
    resultDiagnostics.candidateRecords,
    owner.hostComponentQueryPath,
    entrypoint
  );
  assert.equal(
    resultDiagnostics.traversedCandidateRecords,
    owner.queryPath,
    entrypoint
  );
  assert.equal(
    resultDiagnostics.skippedRecords,
    owner.queryMethodRecords.findAll.skippedRecords,
    entrypoint
  );
  assert.equal(resultDiagnostics.predicateExecution, false, entrypoint);
  assert.equal(resultDiagnostics.deterministic, true, entrypoint);
  assert.equal(resultDiagnostics.publicQueryMethodAvailable, false, entrypoint);
  assert.equal(
    resultDiagnostics.publicTestInstanceObjectAvailable,
    false,
    entrypoint
  );
  assert.equal(resultDiagnostics.nativeBridgeAvailable, false, entrypoint);
  assert.equal(resultDiagnostics.nativeExecution, false, entrypoint);
  assert.equal(resultDiagnostics.compatibilityClaimed, false, entrypoint);
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
  assert.equal(
    queryRecord.expectedCanaryMatchCount,
    expected.expectedCanaryMatchCount,
    entrypoint
  );
  assert.equal(queryRecord.candidateRecords, expected.candidateRecords, entrypoint);
  if (expected.traversedCandidateRecords !== undefined) {
    assert.equal(
      queryRecord.traversedCandidateRecords,
      expected.traversedCandidateRecords,
      entrypoint
    );
  } else {
    assert.equal(
      Object.hasOwn(queryRecord, "traversedCandidateRecords"),
      false,
      entrypoint
    );
  }
  assert.equal(Object.isFrozen(queryRecord.skippedRecords), true, entrypoint);
  assert.deepEqual(
    queryRecord.skippedRecords.map((inspection) => inspection.id),
    [
      "react-test-renderer-private-test-instance-inspection-root-host-text",
      "react-test-renderer-private-test-instance-inspection-host-text"
    ],
    entrypoint
  );
  assert.equal(
    queryRecord.skippedRecords[0],
    owner.acceptedInspectionRecords[1],
    entrypoint
  );
  assert.equal(
    queryRecord.skippedRecords[1],
    owner.acceptedInspectionRecords[3],
    entrypoint
  );
  assert.equal(queryRecord.multiChildHostTree, owner.multiChildHostTree);
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

function assertPrivateQueryRecord(record, expected, label) {
  assert.equal(Object.isFrozen(record), true, `${label} ${expected.query}`);
  assert.equal(record.id, expected.id, label);
  assert.equal(record.query, expected.query, label);
  assert.equal(record.deterministic, true, label);

  if (expected.query === "root") {
    assert.equal(
      record.status,
      "private-record-ready-public-root-blocked",
      label
    );
    assert.equal(record.publicSurface, "create().root", label);
    assert.equal(record.publicAccessAvailable, false, label);
    assert.equal(record.source, expected.source, label);
    return;
  }

  assert.equal(record.fiberTag, expected.fiberTag, label);
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
  assert.equal(error.privateRootBridgeState.recordOnlyPrivateBridge, false);
  assert.equal(
    error.privateRootBridgeState.privateRootExecutionBridgeAvailable,
    true
  );
  assert.equal(
    error.privateRootBridgeState.rustRootExecutionBoundaryCallable,
    true
  );
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
    record.acceptedRustLifecycleDiagnostic,
    record.rustLifecycleDiagnostic
  );
  assertPrivateRootRustLifecycleDiagnostic(
    record.rustLifecycleDiagnostic,
    expected
  );
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
  assert.equal(record.recordOnlyPrivateBridge, false);
  assert.equal(record.privateRootExecutionBridgeAvailable, true);
  assert.equal(record.rustRootExecutionBoundaryCallable, true);
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

function assertPrivateRootRustLifecycleDiagnostic(diagnostic, expected) {
  assert.equal(Object.isFrozen(diagnostic), true);
  assert.equal(
    diagnostic.kind,
    "FastReactTestRendererAcceptedRustLifecycleDiagnostic"
  );
  assert.equal(diagnostic.status, lifecycleDiagnosticGateStatus);
  assert.equal(
    diagnostic.gate.id,
    "react-test-renderer-update-unmount-rust-lifecycle-diagnostic-gate"
  );
  assert.deepEqual(
    diagnostic.rustRecords,
    acceptedRustLifecycleDiagnosticRecords
  );
  assert.equal(diagnostic.operation, expected.operation);
  assert.equal(diagnostic.requestType, expected.requestType);
  assert.equal(diagnostic.lifecycleStatusBefore, expected.lifecycleStatusBefore);
  assert.equal(diagnostic.lifecycleStatusAfter, expected.lifecycleStatusAfter);
  assert.equal(
    diagnostic.lifecycleTransition,
    `${expected.lifecycleStatusBefore === null ? "none" : expected.lifecycleStatusBefore}->${expected.lifecycleStatusAfter}`
  );
  assert.equal(diagnostic.updateKind, expected.updateKind);
  assert.equal(diagnostic.updateOutcome, expected.updateOutcome);
  assert.equal(
    diagnostic.outcomeRecord,
    `TestRendererRootUpdateOutcome::${expected.updateOutcome}`
  );
  assert.equal(
    diagnostic.scheduledUpdateRecord,
    expected.schedulesRootUpdate ? "TestRendererRootScheduledUpdate" : null
  );
  assert.equal(
    diagnostic.scheduledUpdateSequence,
    expected.scheduledUpdateSequence
  );
  assert.equal(
    diagnostic.scheduledElementKind,
    expected.scheduledElement === null
      ? null
      : expected.scheduledElement?.kind ?? "OpaqueJsRootElement"
  );
  assert.equal(
    diagnostic.scheduledElementIsNone,
    expected.scheduledElement?.isNone === true
  );
  assert.equal(
    diagnostic.containerUpdateApi,
    expected.schedulesRootUpdate ? expected.containerUpdateApi : null
  );
  assert.equal(
    diagnostic.schedulerApi,
    expected.schedulesRootUpdate ? "ensure_root_is_scheduled" : null
  );
  assert.equal(diagnostic.sync, expected.schedulesRootUpdate ? expected.sync : null);
  assert.equal(diagnostic.schedulesRootUpdate, expected.schedulesRootUpdate);
  assert.equal(diagnostic.consumesAcceptedRustLifecycleDiagnostics, true);
  assert.equal(diagnostic.privateDiagnosticConsumed, true);
  assert.equal(diagnostic.publicRouteAvailable, false);
  assert.equal(
    diagnostic.publicCreateUpdateUnmountBehaviorAvailable,
    false
  );
  assert.equal(diagnostic.nativeBridgeAvailable, false);
  assert.equal(diagnostic.nativeExecution, false);
  assert.equal(diagnostic.rustExecutionFromJs, false);
  assert.equal(diagnostic.reconcilerExecutionFromJs, false);
  assert.equal(diagnostic.hostOutputProducedFromJs, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
}

function assertActSchedulerGate(gate, entrypoint) {
  const isCjs = entrypoint.includes("/cjs/");
  const cjsDevelopmentOnly = entrypoint === cjsDevelopmentEntrypoint;
  const expectedRootFlushRecordIds = isCjs
    ? [
        ...actSchedulerRootFlushRecordIds,
        "test-renderer-private-getinstance-class-root-diagnostic"
      ]
    : actSchedulerRootFlushRecordIds;
  const expectedPassiveRecordIds = isCjs
    ? actSchedulerCjsPassiveRecordIds
    : actSchedulerPassiveRecordIds;
  const expectedAcceptedPrerequisiteIds = isCjs
    ? acceptedPrivateActFlushCjsPrerequisiteIds
    : acceptedPrivateActFlushPrerequisiteIds;
  const expectedReactQueueDiagnosticRecordIds = cjsDevelopmentOnly
    ? actSchedulerCjsDevelopmentReactQueueDiagnosticRecordIds
    : actSchedulerReactQueueDiagnosticRecordIds;
  const expectedAcceptedWorkers = [
    "worker-176-act-queue-routing-skeleton",
    "worker-252-sync-flush-act-continuation-skeleton",
    "worker-277-react-act-queue-private-dispatcher-gate",
    "worker-280-scheduler-mock-flush-helper-gate",
    "worker-285-sync-flush-act-continuation-post-passive-gate",
    "worker-296-passive-effect-callback-handle-flush-gate",
    "worker-301-hook-effect-destroy-handoff-metadata",
    "worker-303-sync-flush-passive-continuation-execution-gate",
    "worker-304-test-renderer-js-private-root-request-bridge",
    "worker-307-test-renderer-update-unmount-private-js-bridge",
    "worker-326-passive-effect-create-destroy-callback-invocation-gate",
    "worker-331-sync-flush-passive-continuation-execution",
    "worker-332-test-renderer-js-private-root-native-bridge",
    "worker-333-test-renderer-tojson-host-output-private-path",
    "worker-334-test-renderer-testinstance-private-query-path",
    "worker-426-test-renderer-testinstance-bridge-query",
    "worker-349-hook-effect-destroy-callback-execution-private",
    "worker-377-scheduler-act-queue-flush-helper-private"
  ];
  if (isCjs) {
    expectedAcceptedWorkers.push(
      "worker-449-passive-effect-scheduler-flush-gate",
      "worker-473-test-renderer-act-passive-effect-drain"
    );
  }
  if (cjsDevelopmentOnly) {
    expectedAcceptedWorkers.push(
      "worker-404-scheduler-mock-private-callback-execution",
      "worker-436-scheduler-mock-continuation-execution",
      "worker-469-scheduler-mock-expired-continuation-gate",
      "worker-482-test-renderer-act-scheduler-flush-gate"
    );
  }

  assert.equal(Object.isFrozen(gate), true, entrypoint);
  assert.equal(gate.id, "react-test-renderer-act-scheduler-private-gate");
  assert.equal(gate.status, actSchedulerGateStatus);
  assert.equal(gate.entrypoint, entrypoint);
  assert.equal(gate.deterministic, true);
  assert.deepEqual(gate.acceptedWorkers, expectedAcceptedWorkers);
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
  assert.equal(gate.schedulerReactActQueueDiagnosticsAccepted, true);
  assert.equal(gate.privateSchedulerActQueueDiagnosticsConsumed, true);
  assert.equal(gate.privateActQueueDiagnosticConsumptionReady, true);
  if (cjsDevelopmentOnly) {
    assert.equal(gate.mockSchedulerFlushHelperRoutingAccepted, true);
    assert.equal(gate.privateMockSchedulerFlushHelperMetadataRouted, true);
    assert.equal(gate.publicSchedulerFlushBehaviorExecuted, false);
  }
  assert.equal(gate.schedulerMockFlushHelperMetadataAccepted, true);
  assert.equal(gate.rootActRecordsAccepted, true);
  assert.equal(gate.syncFlushActRecordsAccepted, true);
  assert.equal(gate.postPassiveContinuationExecutionGateAccepted, true);
  assert.equal(gate.passiveActFlushMetadataAccepted, true);
  assert.equal(gate.rootRequestRecordsAccepted, true);
  assert.equal(gate.privateFlushExecutionMetadataAccepted, true);
  assert.equal(gate.privateSyncFlushExecutionMetadataAccepted, true);
  assert.equal(gate.privatePassiveCallbackExecutionMetadataAccepted, true);
  assert.equal(
    gate.privatePassiveSchedulerFlushMetadataAccepted,
    isCjs ? true : undefined
  );
  assert.equal(
    gate.privatePassiveEffectDrainDiagnosticsConsumed,
    isCjs ? true : undefined
  );
  assert.equal(gate.privateRootOutputDiagnosticsAccepted, true);
  assert.equal(gate.privateFlushPrerequisitesPresent, true);
  assert.equal(gate.privateFlushExecutionReady, false);
  assert.deepEqual(
    gate.recognizedReactActPrivateDispatcherRecords.map((record) => record.id),
    actSchedulerReactDispatcherRecordIds
  );
  assert.deepEqual(
    gate.recognizedSchedulerReactActQueueDiagnostics.map(
      (record) => record.id
    ),
    expectedReactQueueDiagnosticRecordIds
  );
  assert.equal(
    gate.privateActQueueFlushDiagnostics.exportName,
    privateActQueueFlushDiagnosticsExport
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
    expectedPassiveRecordIds
  );
  assert.deepEqual(
    gate.recognizedRootActFlushRecords.map((record) => record.id),
    expectedRootFlushRecordIds
  );
  assert.deepEqual(
    gate.acceptedPrivateFlushPrerequisiteIds,
    expectedAcceptedPrerequisiteIds
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
    ...gate.recognizedSchedulerReactActQueueDiagnostics,
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
    gate.recognizedSyncFlushActRecords[3].privateFlushExecutionMetadata,
    true
  );
  assert.equal(
    gate.recognizedSyncFlushActRecords[4].publicSchedulerTaskExecution,
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
    gate.recognizedPassiveActFlushRecords[3].testControlOnly,
    true
  );
  assert.equal(
    gate.recognizedPassiveActFlushRecords[4].privateDestroyExecutionMetadata,
    true
  );
  if (isCjs) {
    assert.equal(
      gate.recognizedPassiveActFlushRecords[5].consumesPendingPassiveMetadata,
      true
    );
    assert.equal(
      gate.recognizedPassiveActFlushRecords[6].schedulerPriority,
      "Normal"
    );
    assert.equal(
      gate.recognizedPassiveActFlushRecords[7].metadataOnlyFlush,
      true
    );
  }
  assert.equal(
    gate.recognizedRootActFlushRecords[0].privateRootRequestExecution,
    false
  );
  assert.equal(
    gate.recognizedRootActFlushRecords[2].privateHostOutputDiagnosticsAccepted,
    true
  );
  assert.equal(
    gate.recognizedRootActFlushRecords[3].privateHostOutputDiagnosticsSerializable,
    true
  );
  assert.equal(
    gate.recognizedRootActFlushRecords[4].publicTestInstanceObjectAvailable,
    false
  );
  assert.equal(
    gate.recognizedRootActFlushRecords[4].acceptedBridgeWorker,
    "worker-426-test-renderer-testinstance-bridge-query"
  );
  assert.equal(
    gate.recognizedRootActFlushRecords[4].consumesRootBridgeMetadata,
    true
  );
  assert.equal(
    gate.recognizedRootActFlushRecords[4].standaloneWrapperMetadata,
    false
  );
  const getInstanceRecord = gate.recognizedRootActFlushRecords.find(
    (record) =>
      record.id === "test-renderer-private-getinstance-class-root-diagnostic"
  );
  if (entrypoint.includes("/cjs/")) {
    assert.equal(
      getInstanceRecord.privateClassRootDiagnosticsAvailable,
      true
    );
    assert.equal(
      getInstanceRecord.acceptedWorker,
      "worker-464-test-renderer-get-instance-class-gate"
    );
    assert.equal(getInstanceRecord.publicGetInstanceAvailable, false);
  } else {
    assert.equal(getInstanceRecord, undefined);
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
