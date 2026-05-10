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
import {
  REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS
} from "../src/react-dom-root-render-e2e-conformance-gate.mjs";

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
const privateActDispatcherGateModule =
  "packages/react/private-act-dispatcher-gate.js";
const privateSchedulerMockExpiredActRootWorkMetadataKind =
  "fast-react.scheduler.mock-expired-act-root-work-metadata";
const privateSchedulerMockExpiredActRootWorkMetadataBrand = Symbol.for(
  privateSchedulerMockExpiredActRootWorkMetadataKind
);
const privateSchedulerMockExpiredActRootWorkDiagnosticsKind =
  "fast-react.scheduler.mock-expired-act-root-work-diagnostics";
const privateSchedulerMockExpiredActRootWorkDiagnosticsBrand = Symbol.for(
  privateSchedulerMockExpiredActRootWorkDiagnosticsKind
);
const mockSchedulerExpiredActRootWorkRoutingStatus =
  "react-test-renderer-routed-accepted-mock-scheduler-expired-act-root-work-metadata";
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
const privateTestInstanceQueryBridgePreflightDiagnosticName =
  "fast-react-test-renderer.testinstance.query-bridge-preflight";
const privateTestInstanceQueryBridgePreflightStatus =
  "private-test-instance-query-bridge-preflight-ready-public-test-instance-blocked";
const privateErrorBoundaryDiagnosticsSymbolDescription =
  "fast.react_test_renderer.private_error_boundary_diagnostics";
const privateErrorBoundaryDiagnosticsSymbol = Symbol.for(
  privateErrorBoundaryDiagnosticsSymbolDescription
);
const privateErrorBoundaryUpdateRefreshRows = [
  "react-test-renderer-update-error-root-option-private-diagnostic",
  "react-test-renderer-commit-error-root-option-private-diagnostic"
];
const privateErrorBoundaryUpdateRefreshDependencyIds = [
  "react-test-renderer-update-private-route",
  "react-test-renderer-serialization-private-json-diagnostic",
  "react-test-renderer-test-instance-private-fiber-diagnostic",
  "react-test-renderer-act-scheduler-private-diagnostic"
];
const privateErrorBoundaryRootOptionsRustApi =
  "TestRendererRoot::describe_private_error_boundary_diagnostics_for_canary";
const privateErrorBoundaryUpdateRustApi =
  "TestRendererRoot::describe_private_error_boundary_update_diagnostics_for_canary";
const privateErrorBoundaryAcceptedRustApis = [
  privateErrorBoundaryRootOptionsRustApi,
  privateErrorBoundaryUpdateRustApi
];
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
const privateRootCreatePreflightDiagnosticName =
  "fast-react-test-renderer.root-create.private-preflight";
const privateRootCreatePreflightStatus =
  "private-root-create-preflight-ready-public-root-blocked";
const privateRootCreateWorkLoopFinishedWorkPreflightRowId =
  "react-test-renderer-root-create-work-loop-finished-work-private-diagnostic";
const privateRootCreateWorkLoopFinishedWorkPreflightStatus =
  "private-root-create-work-loop-finished-work-preflight-public-root-blocked";
const privateRootWorkLoopFinishedWorkPreflightMetadataId =
  "fast-react-test-renderer-root-work-loop-finished-work-preflight-metadata";
const privateRootWorkLoopFinishedWorkPreflightMetadataStatus =
  "accepted-root-work-loop-finished-work-preflight-metadata";
const privateCreateRouteAdmissionDiagnosticName =
  "fast-react-test-renderer.create-route.private-admission";
const privateCreateRouteAdmissionStatus =
  "private-create-route-admission-rust-root-create-work-loop-evidence-public-create-blocked";
const privateCreateRouteAdmissionRecordId =
  "react-test-renderer-create-route-admission-private-diagnostic";
const privateCreateRouteAdmissionMetadataId =
  "fast-react-test-renderer-create-route-admission-metadata";
const privateCreateRouteAdmissionMetadataStatus =
  "accepted-create-route-rust-root-create-work-loop-admission-metadata";
const privateCreateNativeBridgeHostOutputHandoffDiagnosticId =
  "react-test-renderer-create-native-bridge-host-output-handoff-private-diagnostic";
const privateCreateNativeBridgeHostOutputHandoffStatus =
  "private-create-native-bridge-host-output-handoff-public-create-blocked";
const privateRootCreatePreflightSymbolDescription =
  "fast.react_test_renderer.private_root_create_preflight";
const privateRootCreatePreflightSymbol = Symbol.for(
  privateRootCreatePreflightSymbolDescription
);
const privateToJSONUpdateHostOutputRowId =
  "react-test-renderer-tojson-update-host-output-private-diagnostic";
const privateToJSONNestedUpdateHostOutputRowId =
  "react-test-renderer-tojson-nested-host-output-update-private-diagnostic";
const privateToJSONSiblingTextHostOutputRowId =
  "react-test-renderer-tojson-sibling-text-host-output-private-diagnostic";
const privateToJSONUnmountHostOutputRowId =
  "react-test-renderer-tojson-unmount-host-output-private-diagnostic";
const privateToJSONUpdateHostOutputRowIds = [
  privateToJSONUpdateHostOutputRowId,
  privateToJSONNestedUpdateHostOutputRowId,
  privateToJSONSiblingTextHostOutputRowId
];
const privateToJSONSerializationFacadeSymbol = Symbol.for(
  "fast.react_test_renderer.private_tojson_serialization_facade"
);
const privateToJSONNativeExecutionDiagnosticName =
  "fast-react-test-renderer.tojson.private-native-execution-evidence";
const privateToJSONNativeExecutionStatus =
  "private-tojson-native-execution-records-consumed-public-tojson-blocked";
const privateToJSONUpdateUnmountDependencyIds = [
  "react-test-renderer-update-route-private-diagnostic",
  "react-test-renderer-unmount-route-private-diagnostic",
  "react-test-renderer-serialization-private-json-diagnostic"
];
const privateUnmountDeletionCommitHandoffDiagnosticId =
  "react-test-renderer-unmount-deletion-commit-handoff-private-diagnostic";
const privateUnmountDeletionCommitHandoffStatus =
  "private-unmount-deletion-commit-handoff-public-unmount-blocked";
const privateUnmountNativeBridgeAdmissionDiagnosticId =
  "react-test-renderer-unmount-native-bridge-admission-private-diagnostic";
const privateUnmountNativeBridgeAdmissionStatus =
  "private-unmount-native-bridge-admission-public-unmount-blocked";
const privateUpdateNativeBridgeAdmissionDiagnosticId =
  "react-test-renderer-update-native-bridge-admission-private-diagnostic";
const privateUpdateNativeBridgeAdmissionStatus =
  "private-update-native-bridge-admission-host-output-handoff-public-update-blocked";
const privateUnmountNativeBridgeCleanupHandoffDiagnosticId =
  "react-test-renderer-unmount-native-bridge-cleanup-handoff-private-diagnostic";
const privateUnmountNativeBridgeCleanupHandoffStatus =
  "private-unmount-native-bridge-cleanup-handoff-public-unmount-blocked";
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
const actSchedulerWarningThenableMissingBeforeExecution = [
  "public-react-test-renderer-act-warning-emission",
  "public-react-test-renderer-act-thenable-awaiting",
  "public-react-test-renderer-async-act-scope-settlement"
];
const actSchedulerNestedScopeMissingBeforeExecution = [
  "public-react-test-renderer-act-scope-depth-tracking",
  "public-react-test-renderer-nested-act-queue-reuse",
  "public-react-test-renderer-overlapping-act-warning-emission"
];
const actPrivateRootPassiveSequenceRecordId =
  "react-test-renderer-act-private-root-passive-prerequisite-sequence";
const actNativeUpdatePassiveDrainRecordId =
  "react-test-renderer-act-native-update-passive-drain-private-diagnostic";
const actNativeUpdatePassiveDrainPrerequisiteId =
  "private-native-update-execution-passive-effect-drain-metadata";
const actPrivateRootPassiveRequiredPrerequisiteIds = [
  "test-renderer-private-root-request-records",
  "scheduler-mock-flush-helper-metadata",
  "passive-effect-scheduler-flush-metadata",
  "act-warning-thenable-public-compatibility-blockers",
  "act-nested-scope-public-compatibility-blockers"
];
const actPrivateRootPassiveSequencePhases = [
  "private-root-request",
  "scheduler-flush-helper",
  "passive-scheduler-request",
  "public-act-warning-thenable-blocker",
  "public-act-nested-scope-blocker"
];
const privateRouteStatus = "blocked-js-native-bridge-not-loaded";
const privateRootBridgeStatus =
  "blocked-private-test-renderer-root-bridge-execution";
const privateRootCompatibilityStatus =
  "blocked-private-test-renderer-root-bridge-compatibility";
const lifecycleDiagnosticGateStatus =
  "accepted-private-update-unmount-lifecycle-diagnostics-public-root-blocked";
const privateUpdateRouteRootWorkLoopDiagnosticName =
  "fast-react-test-renderer.update-route.private-root-work-loop";
const privateUpdateRouteRootWorkLoopStatus =
  "private-update-route-root-work-loop-metadata-ready-public-update-blocked";
const privateUpdateRouteRootWorkLoopAdmissionId =
  "react-test-renderer-update-route-root-work-loop-private-admission";
const privateUpdateRouteRootWorkLoopAdmissionStatus =
  "accepted-private-update-route-root-work-loop-admission-public-update-blocked";
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
      "TestRendererRoot::create",
      "TestRendererRoot::describe_private_root_create_preflight_for_canary",
      "TestRendererRoot::describe_private_create_route_admission_for_canary",
      "TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff",
      "TestRendererRoot::render_and_commit_host_output_for_canary",
      "TestRendererRoot::describe_private_create_native_bridge_host_output_handoff_for_canary"
    ],
    acceptedRustTests: [
      "root_private_create_route_admission_consumes_create_and_work_loop_evidence",
      "root_private_create_native_bridge_handoff_consumes_actual_host_output",
      "root_private_create_native_bridge_handoff_rejects_stale_admission",
      "root_private_create_route_admission_rejects_missing_rust_admission_record",
      "root_private_create_route_admission_rejects_stale_rust_admission_record",
      "root_private_create_route_admission_rejects_missing_root_create_preflight"
    ],
    acceptedWorkers: [
      "worker-153-test-renderer-root-canary",
      "worker-539-test-renderer-live-rust-root-create-preflight",
      "worker-573-test-renderer-private-root-work-loop-preflight",
      "worker-610-test-renderer-create-native-bridge-admission",
      "worker-636-test-renderer-create-native-execution"
    ],
    acceptedWorker: "worker-610-test-renderer-create-native-bridge-admission",
    rootWorkLoopUpdateRoute: false,
    acceptedOutcomes: [rootUpdateOutcomeScheduled],
    id: "react-test-renderer-create-private-route",
    publicSurface: "create()"
  },
  {
    acceptedRustApis: [
      "TestRendererRoot::describe_private_update_route_admission_for_canary",
      "TestRendererRoot::describe_private_update_route_via_root_work_loop_for_canary",
      "TestRendererRoot::update_host_component_with_text_for_canary",
      "TestRendererRoot::render_and_commit_host_output_update_for_canary"
    ],
    acceptedRustTests: [
      "root_private_update_route_admission_record_consumes_update_work_loop_diagnostics",
      "root_private_update_route_consumes_root_work_loop_update_queue_and_text_update_metadata",
      "root_private_update_route_rejects_stale_root_update_output",
      "root_private_update_route_rejects_missing_update_queue_evidence",
      "root_private_update_route_rejects_unmounted_root",
      "root_private_update_route_rejects_incompatible_finished_work_record",
      "root_host_output_canary_updates_committed_text_with_update_diagnostics",
      "root_host_output_update_canary_fails_closed_without_committed_output"
    ],
    acceptedWorkers: [
      "worker-234-test-renderer-host-output-update-unmount-canary",
      "worker-574-test-renderer-update-via-root-work-loop"
    ],
    rootWorkLoopUpdateRoute: true,
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
    acceptedWorkers: [
      "worker-234-test-renderer-host-output-update-unmount-canary"
    ],
    rootWorkLoopUpdateRoute: false,
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
  "react-test-renderer-act-warning-thenable-blockers",
  "react-test-renderer-act-nested-scope-blockers",
  actPrivateRootPassiveSequenceRecordId,
  "test-renderer-mock-scheduler-expired-work-act-route",
  "test-renderer-mock-scheduler-expired-act-root-work-route",
  actNativeUpdatePassiveDrainRecordId,
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
const acceptedPrivateActFlushCjsDevelopmentPrerequisiteIds = [
  ...acceptedPrivateActFlushCjsPrerequisiteIds.slice(0, 4),
  "act-warning-thenable-public-compatibility-blockers",
  "act-nested-scope-public-compatibility-blockers",
  ...acceptedPrivateActFlushCjsPrerequisiteIds.slice(4, 9),
  actNativeUpdatePassiveDrainPrerequisiteId,
  ...acceptedPrivateActFlushCjsPrerequisiteIds.slice(9),
  actPrivateRootPassiveSequenceRecordId
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

test("react-test-renderer private update route admission consumes Rust work-loop evidence", () => {
  for (const entry of cjsEntrypoints) {
    const moduleExports = loadFresh(entry.modulePath);
    const bridge = assertPrivateRootRequestBridge(
      moduleExports,
      entry.entrypoint
    );
    const renderer = moduleExports.create({ props: { children: "hello" }, type: "span" });
    const updateError = captureThrown(() =>
      renderer.update({ props: { children: "goodbye" }, type: "span" })
    );
    const unmountError = captureThrown(() => renderer.unmount());
    const lateUpdateError = captureThrown(() =>
      renderer.update({ props: { children: "late" }, type: "span" })
    );

    assertReactTestRendererUnimplemented(
      updateError,
      entry.entrypoint,
      "create().update"
    );
    assertPrivateUpdateRouteRootWorkLoopAdmission(
      updateError.privateUpdateRouteRootWorkLoopBridgeAdmission,
      updateError.rootRequest,
      {
        admitted: false,
        sourceDiagnostic: null
      }
    );
    assert.equal(
      bridge.getUpdateRouteRootWorkLoopAdmission(updateError.rootRequest),
      updateError.privateUpdateRouteRootWorkLoopBridgeAdmission
    );

    const rustDiagnostic =
      createRustUpdateRouteRootWorkLoopDiagnosticSource(updateError.rootRequest);
    assert.equal(
      bridge.canConsumeAcceptedRustUpdateRouteRootWorkLoop(
        updateError.rootRequest,
        rustDiagnostic
      ),
      true,
      entry.entrypoint
    );
    const consumed = bridge.consumeAcceptedRustUpdateRouteRootWorkLoop(
      updateError.rootRequest,
      rustDiagnostic
    );
    assertPrivateUpdateRouteRootWorkLoopAdmission(
      consumed,
      updateError.rootRequest,
      {
        admitted: true,
        sourceDiagnostic: consumed.sourceDiagnostic
      }
    );
    assert.equal(
      bridge.getUpdateRouteRootWorkLoopAdmission(updateError.rootRequest),
      consumed
    );
    assertPrivateUpdateRouteQueueEvidence(consumed.sourceDiagnostic.updateQueueMetadata);
    assertPrivateUpdateRouteRootWorkLoopEvidence(
      consumed.sourceDiagnostic.rootWorkLoopMetadata
    );
    assertPrivateUpdateRouteHostOutputEvidence(
      consumed.sourceDiagnostic.hostTextUpdateMetadata
    );

    assert.equal(
      bridge.canConsumeAcceptedRustUpdateRouteRootWorkLoop(
        lateUpdateError.rootRequest,
        rustDiagnostic
      ),
      false,
      entry.entrypoint
    );
    assert.equal(
      bridge.canConsumeAcceptedRustUpdateRouteRootWorkLoop(
        updateError.rootRequest,
        {
          ...rustDiagnostic,
          rootRequestSequence: updateError.rootRequest.requestSequence + 1
        }
      ),
      false,
      entry.entrypoint
    );
    assert.equal(
      bridge.canConsumeAcceptedRustUpdateRouteRootWorkLoop(
        updateError.rootRequest,
        {
          ...rustDiagnostic,
          updateQueueMetadata: undefined
        }
      ),
      false,
      entry.entrypoint
    );
    assert.equal(unmountError.rootRequest.operation, "unmount");
    assert.equal(
      bridge.canConsumeAcceptedRustUpdateRouteRootWorkLoop(
        unmountError.rootRequest,
        rustDiagnostic
      ),
      false,
      entry.entrypoint
    );
    assert.equal(updateError.compatibilityClaimed, false);
  }
});

test("react-test-renderer private update native bridge admission consumes Rust host-output handoff evidence", () => {
  for (const entry of cjsEntrypoints) {
    const moduleExports = loadFresh(entry.modulePath);
    const bridge = assertPrivateRootRequestBridge(
      moduleExports,
      entry.entrypoint
    );
    const renderer = moduleExports.create({
      props: { "data-state": "old", children: "hello" },
      type: "span"
    });
    const updateError = captureThrown(() =>
      renderer.update({
        props: { "data-state": "new", children: "goodbye" },
        type: "span"
      })
    );
    const unmountError = captureThrown(() => renderer.unmount());
    const lateUpdateError = captureThrown(() =>
      renderer.update({ props: { children: "late" }, type: "span" })
    );
    const evidence = createRustUpdateNativeBridgeAdmissionEvidence(
      updateError.rootRequest
    );

    assertPrivateUpdateNativeBridgeAdmissionGate(
      updateError.rootRequest.privateUpdateNativeBridgeAdmissionGate,
      entry.entrypoint
    );
    assert.equal(
      bridge.canConsumePrivateUpdateNativeBridgeAdmission(
        updateError.rootRequest,
        evidence
      ),
      true,
      entry.entrypoint
    );
    const admission = bridge.consumePrivateUpdateNativeBridgeAdmission(
      updateError.rootRequest,
      evidence
    );
    assertPrivateUpdateNativeBridgeAdmission(
      admission,
      updateError.rootRequest
    );

    assert.equal(
      bridge.canConsumePrivateUpdateNativeBridgeAdmission(
        updateError.rootRequest,
        createRustUpdateNativeBridgeAdmissionEvidence(updateError.rootRequest, {
          hostOutputProduced: false
        })
      ),
      false,
      entry.entrypoint
    );
    assert.equal(
      bridge.canConsumePrivateUpdateNativeBridgeAdmission(
        lateUpdateError.rootRequest,
        evidence
      ),
      false,
      entry.entrypoint
    );
    assert.equal(
      bridge.canConsumePrivateUpdateNativeBridgeAdmission(
        unmountError.rootRequest,
        evidence
      ),
      false,
      entry.entrypoint
    );
    assert.equal(
      bridge.canConsumePrivateUpdateNativeBridgeAdmission(
        updateError.rootRequest,
        createRustUpdateNativeBridgeAdmissionEvidence(updateError.rootRequest, {
          updateRouteRootWorkLoopDiagnostic: {
            rootRequestSequence:
              updateError.rootRequest.requestSequence + 1
          }
        })
      ),
      false,
      entry.entrypoint
    );

    const result = bridge.consumeRootExecutionResult(
      updateError.rootRequest,
      evidence
    );
    assertPrivateUpdateNativeBridgeAdmission(
      result.privateUpdateNativeBridgeAdmission,
      updateError.rootRequest
    );
    assert.equal(result.hostOutputProduced, true);
    assert.equal(result.publicCreateUpdateUnmountBehaviorAvailable, false);
    assert.equal(updateError.rootRequest.rustExecution, false);
  }
});

test("react-test-renderer CJS development private act diagnostics consume update execution with passive drain metadata", () => {
  const entry = entrypoints.find(
    (candidate) => candidate.entrypoint === cjsDevelopmentEntrypoint
  );
  assert.notEqual(entry, undefined);

  const moduleExports = loadFresh(entry.modulePath);
  const bridge = assertPrivateRootRequestBridge(
    moduleExports,
    entry.entrypoint
  );
  const diagnostics =
    moduleExports._Scheduler.unstable_flushAllWithoutAsserting[
      privateActQueueFlushDiagnosticsExport
    ].privateActPassiveEffectDrainDiagnostics;
  assert.equal(
    diagnostics.nativeUpdatePassiveEffectDrainDiagnosticId,
    actNativeUpdatePassiveDrainRecordId
  );
  assert.equal(diagnostics.consumesAcceptedNativeUpdateExecution, true);
  assert.equal(diagnostics.drainsAcceptedPendingPassiveFlushMetadata, true);

  const renderer = moduleExports.create({
    props: { "data-state": "old", children: "hello" },
    type: "span"
  });
  const updateError = captureThrown(() =>
    renderer.update({
      props: { "data-state": "new", children: "goodbye" },
      type: "span"
    })
  );
  const updateExecutionResult = bridge.consumeRootExecutionResult(
    updateError.rootRequest,
    createRustUpdateNativeBridgeAdmissionEvidence(updateError.rootRequest)
  );
  assertPrivateUpdateNativeBridgeAdmission(
    updateExecutionResult.privateUpdateNativeBridgeAdmission,
    updateError.rootRequest
  );

  const metadata = diagnostics.createAcceptedPendingPassiveFlushMetadata([
    diagnostics.createAcceptedPendingPassiveFlushRecord({
      label: "private-update-passive-execution",
      recordKind: "PassiveEffectSchedulerFlushExecutionRecord",
      root: updateError.rootRequest.rootId,
      finishedWork: "updated-finished-work",
      lanes: "Default",
      pendingUnmountCount: 0,
      pendingMountCount: 1,
      schedulerRequestOrder: 3
    })
  ]);
  const described =
    diagnostics.describeAcceptedNativeUpdateExecutionAndPendingPassiveFlushMetadata(
      updateExecutionResult,
      metadata
    );
  assert.equal(described.id, actNativeUpdatePassiveDrainRecordId);
  assert.equal(described.accepted, true);
  assert.equal(described.rejectionReason, null);
  assert.equal(described.updateExecutionAccepted, true);
  assert.equal(described.passiveMetadataAccepted, true);
  assert.equal(described.publicActCompatibilityClaimed, false);
  assert.equal(described.publicUpdateCompatibilityClaimed, false);

  const report =
    diagnostics.consumeAcceptedNativeUpdateExecutionAndPendingPassiveFlushMetadata(
      updateExecutionResult,
      metadata
    );
  assert.equal(report.id, actNativeUpdatePassiveDrainRecordId);
  assert.equal(
    report.status,
    "private-act-native-update-passive-effect-drain-public-act-blocked"
  );
  assert.equal(report.nativeUpdateExecutionConsumed, true);
  assert.equal(report.privateRootRequestExecutionConsumed, true);
  assert.equal(report.rustExecution, true);
  assert.equal(report.reconcilerExecution, true);
  assert.equal(report.hostOutputProduced, true);
  assert.equal(report.pendingBefore, 1);
  assert.equal(report.drainedCount, 1);
  assert.equal(report.remainingCount, 0);
  assert.equal(
    report.drainedRecords[0].recordKind,
    "PassiveEffectSchedulerFlushExecutionRecord"
  );
  assert.equal(report.consumesAcceptedNativeUpdateExecution, true);
  assert.equal(report.consumesPrivateUpdateNativeBridgeAdmission, true);
  assert.equal(report.consumesAcceptedNativeUpdateHostOutput, true);
  assert.equal(report.drainsAcceptedPendingPassiveFlushMetadata, true);
  assert.equal(report.publicActCompatibilityClaimed, false);
  assert.equal(report.publicUpdateCompatibilityClaimed, false);
  assert.equal(report.executesPassiveEffects, false);
  assert.equal(report.invokesEffectCallbacks, false);
  assert.equal(report.executesRendererRoots, false);
  assert.equal(report.mutatesHostOutput, false);
  assert.equal(metadata.records.length, 0);

  const rejected =
    diagnostics.describeAcceptedNativeUpdateExecutionAndPendingPassiveFlushMetadata(
      {
        ...updateExecutionResult,
        hostOutputProduced: false
      },
      diagnostics.createAcceptedPendingPassiveFlushMetadata([])
    );
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.rejectionReason, "native-update-result-not-frozen");
});

test("react-test-renderer CJS development private unmount route records deletion commit handoff blockers", () => {
  const entry = entrypoints.find(
    (candidate) => candidate.entrypoint === cjsDevelopmentEntrypoint
  );
  assert.notEqual(entry, undefined);

  const moduleExports = loadFresh(entry.modulePath);
  const bridge = assertPrivateRootRequestBridge(
    moduleExports,
    entry.entrypoint
  );
  const renderer = moduleExports.create({ type: "initial" });

  const unmountError = captureThrown(() => renderer.unmount());
  assertReactTestRendererUnimplemented(
    unmountError,
    entry.entrypoint,
    "create().unmount"
  );
  assertCreateRoutingGate(unmountError, entry.entrypoint);
  assertPrivateUnmountDeletionCommitHandoffGate(
    unmountError.unmountPrivateRoute.deletionCommitHandoff,
    entry.entrypoint
  );
  assertPrivateUnmountNativeBridgeAdmissionGate(
    unmountError.unmountPrivateRoute.nativeBridgeAdmission,
    entry.entrypoint
  );
  assertPrivateUnmountDeletionCommitHandoff(
    unmountError.rootRequest.privateUnmountDeletionCommitHandoff,
    {
      entrypoint: entry.entrypoint,
      lifecycleStatusAfter: "unmount-scheduled",
      lifecycleStatusBefore: "active",
      scheduled: true,
      scheduledElementIsNone: true,
      updateOutcome: rootUpdateOutcomeScheduled
    }
  );
  assertPrivateUnmountDeletionCommitHandoff(
    unmountError.privateRootRequest.privateUnmountDeletionCommitHandoff,
    {
      entrypoint: entry.entrypoint,
      lifecycleStatusAfter: rootLifecycleUnmountScheduled,
      lifecycleStatusBefore: rootLifecycleActive,
      scheduled: true,
      scheduledElementIsNone: true,
      updateOutcome: rootUpdateOutcomeScheduled
    }
  );

  const handoff = bridge.createRootExecutionHandoff(unmountError.rootRequest);
  assert.equal(
    handoff.privateUnmountDeletionCommitHandoff,
    unmountError.rootRequest.privateUnmountDeletionCommitHandoff
  );
  assert.equal(
    handoff.privateUnmountNativeBridgeAdmissionGate,
    unmountError.rootRequest.privateUnmountNativeBridgeAdmissionGate
  );
  const admissionEvidence =
    createRustUnmountNativeBridgeAdmissionEvidence(
      unmountError.rootRequest
    );
  const admission = bridge.consumePrivateUnmountNativeBridgeAdmission(
    unmountError.rootRequest,
    admissionEvidence
  );
  assertPrivateUnmountNativeBridgeAdmission(
    admission,
    unmountError.rootRequest
  );
  assert.equal(
    admission.cleanupHandoff.sourceDiagnostic,
    admissionEvidence.cleanupHandoff
  );
  assert.equal(
    admission.deletionCommitHandoff.sourceDiagnostic,
    admissionEvidence.cleanupHandoff.deletion_commit_handoff
  );
  assert.equal(
    bridge.canConsumePrivateUnmountNativeBridgeAdmission(
      unmountError.rootRequest,
      admissionEvidence
    ),
    true
  );
  assert.equal(
    bridge.canConsumePrivateUnmountNativeBridgeAdmission(
      unmountError.rootRequest,
      {
        rustLifecycleDiagnostic: admissionEvidence.rustLifecycleDiagnostic,
        deletionCommitHandoff:
          admissionEvidence.cleanupHandoff.deletion_commit_handoff
      }
    ),
    false
  );
  assert.equal(
    bridge.canConsumePrivateUnmountNativeBridgeAdmission(
      unmountError.rootRequest,
      createRustUnmountNativeBridgeAdmissionEvidence(
        unmountError.rootRequest,
        {
          deletionCommitHandoff: {
            commitCurrentIsStoreCurrent: false
          }
        }
      )
    ),
    false
  );
  assert.equal(
    bridge.canConsumePrivateUnmountNativeBridgeAdmission(
      unmountError.rootRequest,
      createRustUnmountNativeBridgeAdmissionEvidence(
        unmountError.rootRequest,
        {
          deletionCommitHandoff: {
            hostChildDetachmentBlockers: {
              hostNodeCleanupInvalidatedCount: 0
            }
          }
        }
      )
    ),
    false
  );
  const result = bridge.consumeRootExecutionResult(
    unmountError.rootRequest,
    admissionEvidence
  );
  assert.equal(
    result.privateUnmountDeletionCommitHandoff,
    unmountError.rootRequest.privateUnmountDeletionCommitHandoff
  );
  assertPrivateUnmountNativeBridgeAdmission(
    result.privateUnmountNativeBridgeAdmission,
    unmountError.rootRequest
  );
  assert.equal(result.hostOutputProduced, true);
  assert.equal(result.publicCreateUpdateUnmountBehaviorAvailable, false);

  const secondUnmountError = captureThrown(() => renderer.unmount());
  assertReactTestRendererUnimplemented(
    secondUnmountError,
    entry.entrypoint,
    "create().unmount"
  );
  assertPrivateUnmountDeletionCommitHandoff(
    secondUnmountError.rootRequest.privateUnmountDeletionCommitHandoff,
    {
      entrypoint: entry.entrypoint,
      lifecycleStatusAfter: "unmount-scheduled",
      lifecycleStatusBefore: "unmount-scheduled",
      scheduled: false,
      scheduledElementIsNone: true,
      updateOutcome: rootUpdateOutcomeAlreadyUnmountScheduled
    }
  );
  assert.equal(
    secondUnmountError.rootRequest.privateUnmountDeletionCommitHandoff
      .rejectionReason,
    "already-unmounted-root-record"
  );
  assert.equal(
    secondUnmountError.rootRequest.privateUnmountDeletionCommitHandoff
      .deletionCommitHandoffRejected,
    true
  );
  assert.equal(
    bridge.canConsumePrivateUnmountNativeBridgeAdmission(
      secondUnmountError.rootRequest,
      createRustUnmountNativeBridgeAdmissionEvidence(
        secondUnmountError.rootRequest
      )
    ),
    false
  );
  assert.equal(secondUnmountError.rootRequest.hostOutputProduced, false);
  assert.equal(secondUnmountError.rootRequest.compatibilityClaimed, false);
});

test("react-test-renderer CJS development private root-create preflight validates accepted Rust canary metadata", () => {
  const entry = entrypoints.find(
    (candidate) => candidate.entrypoint === cjsDevelopmentEntrypoint
  );
  assert.notEqual(entry, undefined);

  const moduleExports = loadFresh(entry.modulePath);
  const bridge = assertPrivateRootRequestBridge(
    moduleExports,
    entry.entrypoint
  );
  const element = { props: { children: "hello" }, type: "div" };
  const options = {
    onUncaughtError() {
      throw new Error("must not run onUncaughtError");
    },
    unstable_strictMode: true
  };
  const renderer = moduleExports.create(element, options);
  const [createRequest] = bridge.getRendererRootRequests(renderer);
  const preflight = bridge.getRootCreatePreflight(createRequest);
  const rendererPreflight = bridge.getRendererRootCreatePreflight(renderer);
  const workLoopPreflight =
    bridge.getRootCreateWorkLoopFinishedWorkPreflight(createRequest);
  const rendererWorkLoopPreflight =
    bridge.getRendererRootCreateWorkLoopFinishedWorkPreflight(renderer);

  assert.equal(rendererPreflight, preflight);
  assert.equal(workLoopPreflight, preflight.workLoopFinishedWorkPreflight);
  assert.equal(rendererWorkLoopPreflight, workLoopPreflight);
  assertPrivateRootCreatePreflight(preflight, createRequest, {
    entrypoint: entry.entrypoint,
    ready: true,
    failureReason: null,
    supportedChildren: true,
    rootOptionsMetadataAvailable: true
  });

  assert.equal(
    Object.getOwnPropertyDescriptor(
      renderer,
      privateRootCreatePreflightSymbol
    ),
    undefined
  );

  const rustDiagnostic = createRustRootCreatePreflightDiagnosticSource(
    preflight
  );
  assert.equal(
    bridge.canConsumeAcceptedRustRootCreatePreflight(
      createRequest,
      rustDiagnostic
    ),
    true
  );
  const consumed = bridge.consumeAcceptedRustRootCreatePreflight(
    createRequest,
    rustDiagnostic
  );
  assertPrivateRootCreatePreflightConsumption(
    consumed,
    preflight,
    createRequest,
    entry.entrypoint
  );
  const admission = bridge.getRootCreateRouteAdmission(createRequest);
  assert.equal(
    bridge.getRendererRootCreateRouteAdmission(renderer),
    admission
  );
  assertPrivateCreateRouteAdmission(
    admission,
    preflight,
    createRequest,
    entry.entrypoint
  );

  const rustAdmissionDiagnostic =
    createRustCreateRouteAdmissionDiagnosticSource(admission);
  assert.equal(
    bridge.canConsumeAcceptedRustRootCreateRouteAdmission(
      createRequest,
      rustAdmissionDiagnostic
    ),
    true
  );
  const consumedAdmission =
    bridge.consumeAcceptedRustRootCreateRouteAdmission(
      createRequest,
      rustAdmissionDiagnostic
    );
  assertPrivateCreateRouteAdmissionConsumption(
    consumedAdmission,
    admission,
    createRequest,
    entry.entrypoint
  );
  const createHostOutputHandoff =
    createRustCreateNativeBridgeHostOutputHandoffSource(
      createRequest,
      admission
    );
  assert.equal(
    bridge.canConsumePrivateCreateNativeBridgeHostOutputHandoff(
      createRequest,
      createHostOutputHandoff
    ),
    true
  );
  const consumedHostOutputHandoff =
    bridge.consumePrivateCreateNativeBridgeHostOutputHandoff(
      createRequest,
      createHostOutputHandoff
    );
  assertPrivateCreateNativeBridgeHostOutputHandoff(
    consumedHostOutputHandoff,
    createRequest
  );

  const missingAdmissionRecord = {
    id: rustAdmissionDiagnostic.id,
    diagnosticName: rustAdmissionDiagnostic.diagnosticName,
    status: rustAdmissionDiagnostic.status,
    operation: rustAdmissionDiagnostic.operation,
    publicSurface: rustAdmissionDiagnostic.publicSurface,
    jsFacadeMetadataSource: rustAdmissionDiagnostic.jsFacadeMetadataSource,
    rootCreatePreflight: rustAdmissionDiagnostic.rootCreatePreflight,
    workLoopFinishedWorkPreflight:
      rustAdmissionDiagnostic.workLoopFinishedWorkPreflight,
    rootCreateExecutionEvidence:
      rustAdmissionDiagnostic.rootCreateExecutionEvidence,
    consumesJsFacadeCreateMetadata: true,
    consumesAcceptedRustRootCreateExecutionEvidence: true,
    consumesAcceptedRustRootCreatePreflightDiagnostics: true,
    consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata: true
  };
  assert.equal(
    bridge.canConsumeAcceptedRustRootCreateRouteAdmission(
      createRequest,
      missingAdmissionRecord
    ),
    false
  );
  assert.throws(
    () =>
      bridge.consumeAcceptedRustRootCreateRouteAdmission(
        createRequest,
        missingAdmissionRecord
      ),
    {
      code: "FAST_REACT_TEST_RENDERER_INVALID_ROOT_REQUEST",
      name: "FastReactTestRendererPrivateRootRequestError"
    }
  );

  const staleAdmissionDiagnostic = {
    ...rustAdmissionDiagnostic,
    rustAdmissionMetadata: {
      ...rustAdmissionDiagnostic.rustAdmissionMetadata,
      metadataId: "fast-react-test-renderer-stale-create-route-admission"
    }
  };
  assert.equal(
    bridge.canConsumeAcceptedRustRootCreateRouteAdmission(
      createRequest,
      staleAdmissionDiagnostic
    ),
    false
  );
  assert.throws(
    () =>
      bridge.consumeAcceptedRustRootCreateRouteAdmission(
        createRequest,
        staleAdmissionDiagnostic
      ),
    {
      code: "FAST_REACT_TEST_RENDERER_INVALID_ROOT_REQUEST",
      name: "FastReactTestRendererPrivateRootRequestError"
    }
  );

  const staleDiagnostic = {
    ...rustDiagnostic,
    canaryApiIdentity: {
      ...rustDiagnostic.canaryApiIdentity,
      metadataId: "fast-react-test-renderer-stale-root-canary-metadata"
    }
  };
  assert.equal(
    bridge.canConsumeAcceptedRustRootCreatePreflight(
      createRequest,
      staleDiagnostic
    ),
    false
  );
  assert.throws(
    () =>
      bridge.consumeAcceptedRustRootCreatePreflight(
        createRequest,
        staleDiagnostic
      ),
    {
      code: "FAST_REACT_TEST_RENDERER_INVALID_ROOT_REQUEST",
      name: "FastReactTestRendererPrivateRootRequestError"
    }
  );

  const missingWorkLoopDiagnostic = {
    diagnosticName: rustDiagnostic.diagnosticName,
    status: rustDiagnostic.status,
    operation: rustDiagnostic.operation,
    createInputShape: rustDiagnostic.createInputShape,
    rootOptionsMetadata: rustDiagnostic.rootOptionsMetadata,
    canaryApiIdentity: rustDiagnostic.canaryApiIdentity
  };
  assert.equal(
    bridge.canConsumeAcceptedRustRootCreatePreflight(
      createRequest,
      missingWorkLoopDiagnostic
    ),
    false
  );
  assert.throws(
    () =>
      bridge.consumeAcceptedRustRootCreatePreflight(
        createRequest,
        missingWorkLoopDiagnostic
      ),
    {
      code: "FAST_REACT_TEST_RENDERER_INVALID_ROOT_REQUEST",
      name: "FastReactTestRendererPrivateRootRequestError"
    }
  );

  const staleWorkLoopMetadata =
    rustDiagnostic.workLoopFinishedWorkPreflight
      .workLoopFinishedWorkMetadata;
  const staleWorkLoopDiagnostic = {
    ...rustDiagnostic,
    workLoopFinishedWorkPreflight: {
      ...rustDiagnostic.workLoopFinishedWorkPreflight,
      workLoopFinishedWorkMetadata: {
        ...staleWorkLoopMetadata,
        metadataId: "fast-react-test-renderer-stale-work-loop-preflight"
      }
    }
  };
  assert.equal(
    bridge.canConsumeAcceptedRustRootCreatePreflight(
      createRequest,
      staleWorkLoopDiagnostic
    ),
    false
  );
  assert.throws(
    () =>
      bridge.consumeAcceptedRustRootCreatePreflight(
        createRequest,
        staleWorkLoopDiagnostic
      ),
    {
      code: "FAST_REACT_TEST_RENDERER_INVALID_ROOT_REQUEST",
      name: "FastReactTestRendererPrivateRootRequestError"
    }
  );
  assert.equal(
    bridge.canConsumePrivateCreateNativeBridgeHostOutputHandoff(
      createRequest,
      {
        ...createHostOutputHandoff,
        hostOutput: {
          ...createHostOutputHandoff.hostOutput,
          textCount: 0
        }
      }
    ),
    false
  );

  const rootError = captureThrown(() => renderer.root);
  assertReactTestRendererUnimplemented(
    rootError,
    entry.entrypoint,
    "create().root"
  );
  assert.equal(rootError.privateRootCreatePreflight, preflight);
  assert.equal(rootError.routingGate.privateRootCreatePreflightGate, preflight.gate);
  assert.equal(rootError.routingGate.createRouteAvailable, false);
});

test("react-test-renderer CJS development private root-create preflight fails closed for unsupported input", () => {
  const entry = entrypoints.find(
    (candidate) => candidate.entrypoint === cjsDevelopmentEntrypoint
  );
  assert.notEqual(entry, undefined);

  const moduleExports = loadFresh(entry.modulePath);
  const bridge = assertPrivateRootRequestBridge(
    moduleExports,
    entry.entrypoint
  );

  const unsupportedRenderer = moduleExports.create(
    { props: { children: ["a", "b"] }, type: "div" },
    {}
  );
  const [unsupportedRequest] =
    bridge.getRendererRootRequests(unsupportedRenderer);
  const unsupportedPreflight =
    bridge.getRootCreatePreflight(unsupportedRequest);
  assertPrivateRootCreatePreflight(unsupportedPreflight, unsupportedRequest, {
    entrypoint: entry.entrypoint,
    ready: false,
    failureReason: "unsupported-children",
    supportedChildren: false,
    rootOptionsMetadataAvailable: true
  });
  assert.equal(
    bridge.canConsumeAcceptedRustRootCreatePreflight(
      unsupportedRequest,
      createRustRootCreatePreflightDiagnosticSource(unsupportedPreflight)
    ),
    false
  );

  const missingOptionsRenderer = moduleExports.create({
    props: { children: "hello" },
    type: "div"
  });
  const [missingOptionsRequest] =
    bridge.getRendererRootRequests(missingOptionsRenderer);
  const missingOptionsPreflight =
    bridge.getRootCreatePreflight(missingOptionsRequest);
  assertPrivateRootCreatePreflight(
    missingOptionsPreflight,
    missingOptionsRequest,
    {
      entrypoint: entry.entrypoint,
      ready: false,
      failureReason: "missing-root-options",
      supportedChildren: true,
      rootOptionsMetadataAvailable: false
    }
  );
  assert.equal(
    bridge.canConsumeAcceptedRustRootCreatePreflight(
      missingOptionsRequest,
      createRustRootCreatePreflightDiagnosticSource(missingOptionsPreflight)
    ),
    false
  );

  assertRendererShape(
    unsupportedRenderer,
    entry.entrypoint,
    moduleExports._Scheduler
  );
  assertRendererShape(
    missingOptionsRenderer,
    entry.entrypoint,
    moduleExports._Scheduler
  );
  assertCreateRoutingGate(
    captureThrown(() => unsupportedRenderer.root),
    entry.entrypoint
  );
  assertCreateRoutingGate(
    captureThrown(() => missingOptionsRenderer.root),
    entry.entrypoint
  );
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
        const request =
          handoff.requestSequence === 1
            ? createRequest
            : handoff.requestSequence === 2
              ? updateError.rootRequest
              : unmountError.rootRequest;
        calls.push(handoff);
        if (request.operation === "unmount") {
          return {
            ...createRustUnmountNativeBridgeAdmissionEvidence(request),
            nativeAddonLoaded: false,
            nativeExecution: false,
            rustExecution: true
          };
        }
        if (request.operation === "update") {
          return createRustUpdateNativeBridgeAdmissionEvidence(request);
        }
        return {
          rustLifecycleDiagnostic: createRustLifecycleDiagnosticSource(request),
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
    if (entry.entrypoint.includes("/cjs/")) {
      assertPrivateUpdateNativeBridgeAdmission(
        updateResult.privateUpdateNativeBridgeAdmission,
        updateError.rootRequest
      );
      assert.equal(updateResult.hostOutputProduced, true);
    } else {
      assert.equal(updateResult.privateUpdateNativeBridgeAdmission, undefined);
      assert.equal(updateResult.hostOutputProduced, false);
    }
    assert.equal(
      bridge.canConsumeRootExecutionResult(
        updateError.rootRequest,
        createRustUpdateNativeBridgeAdmissionEvidence(updateError.rootRequest)
      ),
      true,
      entry.entrypoint
    );
    assert.equal(
      bridge.canConsumeRootExecutionResult(
        updateError.rootRequest,
        {
          ...createRustUpdateNativeBridgeAdmissionEvidence(updateError.rootRequest),
          rustLifecycleDiagnostic: {
            ...createRustLifecycleDiagnosticSource(updateError.rootRequest),
            updateOutcome: rootUpdateOutcomeAlreadyUnmountScheduled
          }
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

test("react-test-renderer development private create execution can consume Rust host-output handoff", () => {
  const entry = entrypoints.find(
    (candidate) => candidate.entrypoint === cjsDevelopmentEntrypoint
  );
  assert.notEqual(entry, undefined);

  const moduleExports = loadFresh(entry.modulePath);
  const bridge = assertPrivateRootRequestBridge(
    moduleExports,
    entry.entrypoint
  );
  const renderer = moduleExports.create(
    { props: { children: "hello" }, type: "span" },
    {}
  );
  const [createRequest] = bridge.getRendererRootRequests(renderer);
  const admission = bridge.getRootCreateRouteAdmission(createRequest);
  const createHostOutputHandoff =
    createRustCreateNativeBridgeHostOutputHandoffSource(
      createRequest,
      admission
    );
  const result = bridge.executeRootRequest(createRequest, (handoff) => {
    assertRootExecutionHandoff(handoff, createRequest);
    return {
      rustLifecycleDiagnostic:
        createRustLifecycleDiagnosticSource(createRequest),
      privateCreateNativeBridgeHostOutputHandoff:
        createHostOutputHandoff,
      nativeAddonLoaded: false,
      nativeExecution: false,
      rustExecution: true
    };
  });

  assertRootExecutionResult(result, createRequest);
  assertPrivateCreateNativeBridgeHostOutputHandoff(
    result.privateCreateNativeBridgeHostOutputHandoff,
    createRequest
  );
  assert.equal(result.hostOutputProduced, true);
  assert.equal(result.serializationAvailable, false);
  assert.equal(result.publicRouteAvailable, false);
  assert.equal(result.compatibilityClaimed, false);
  assert.throws(() => renderer.toJSON(), {
    code: "FAST_REACT_UNIMPLEMENTED",
    name: "FastReactTestRendererUnimplementedError"
  });
});

test("react-test-renderer CJS development private toJSON facade consumes accepted native execution records", () => {
  const entry = entrypoints.find(
    (candidate) => candidate.entrypoint === cjsDevelopmentEntrypoint
  );
  assert.notEqual(entry, undefined);

  const moduleExports = loadFresh(entry.modulePath);
  const bridge = assertPrivateRootRequestBridge(
    moduleExports,
    entry.entrypoint
  );
  const renderer = moduleExports.create(
    {
      props: { children: "hello" },
      type: "span"
    },
    {}
  );
  const [createRequest] = bridge.getRendererRootRequests(renderer);
  const createAdmission = bridge.getRootCreateRouteAdmission(createRequest);
  const updateError = captureThrown(() =>
    renderer.update({ props: { children: "goodbye" }, type: "span" })
  );
  const unmountError = captureThrown(() => renderer.unmount());
  const facade = renderer.toJSON[privateToJSONSerializationFacadeSymbol];
  const executor = (handoff) => {
    const request =
      handoff.requestSequence === 1
        ? createRequest
        : handoff.requestSequence === 2
          ? updateError.rootRequest
          : unmountError.rootRequest;
    if (request.operation === "unmount") {
      return {
        ...createRustUnmountNativeBridgeAdmissionEvidence(request),
        nativeAddonLoaded: false,
        nativeExecution: false,
        rustExecution: true
      };
    }
    if (request.operation === "update") {
      return createRustUpdateNativeBridgeAdmissionEvidence(request);
    }
    return {
      rustLifecycleDiagnostic: createRustLifecycleDiagnosticSource(request),
      privateCreateNativeBridgeHostOutputHandoff:
        createRustCreateNativeBridgeHostOutputHandoffSource(
          request,
          createAdmission
        ),
      nativeAddonLoaded: false,
      nativeExecution: false,
      rustExecution: true
    };
  };

  const createResult = bridge.executeRootRequest(createRequest, executor);
  const updateResult = bridge.executeRootRequest(updateError.rootRequest, executor);
  const unmountResult = bridge.executeRootRequest(
    unmountError.rootRequest,
    executor
  );

  assert.equal(facade.privateNativeExecutionEvidenceAvailable, true);
  assert.equal(
    facade.privateNativeExecutionDiagnosticName,
    privateToJSONNativeExecutionDiagnosticName
  );
  assert.equal(
    facade.privateNativeExecutionStatus,
    privateToJSONNativeExecutionStatus
  );
  assert.deepEqual(facade.acceptedNativeExecutionOperations, [
    "create",
    "update",
    "unmount"
  ]);
  assert.equal(
    typeof facade.createAcceptedNativeExecutionDiagnosticResult,
    "function"
  );
  assert.equal(
    typeof facade.canCreateAcceptedNativeExecutionDiagnosticResult,
    "function"
  );

  const createEvidence =
    facade.createAcceptedNativeExecutionDiagnosticResult(
      createResult,
      privateToJSONReport({
        hostOutputUpdateKind: "Create",
        rowId: null,
        rowShape: null,
        rootChildCount: 1,
        rootNodeKind: "HostComponent",
        nodes: [
          hostComponentNode(0, null, [1], "span"),
          textNode(1, 0, "hello")
        ]
      })
    );
  assert.equal(createEvidence.diagnosticName, privateToJSONNativeExecutionDiagnosticName);
  assert.equal(createEvidence.status, privateToJSONNativeExecutionStatus);
  assert.equal(createEvidence.operation, "create");
  assert.equal(createEvidence.hostOutputUpdateKind, "Create");
  assert.equal(createEvidence.hostOutputShape, "SingleHostText");
  assert.equal(createEvidence.hostOutputRowId, null);
  assert.equal(createEvidence.sourceNodeCount, 2);
  assert.equal(createEvidence.rootChildCount, 1);
  assert.deepEqual(createEvidence.result, {
    type: "span",
    props: {},
    children: ["hello"]
  });
  assert.equal(createEvidence.consumesAcceptedNativeExecutionRecord, true);
  assert.equal(createEvidence.consumesAcceptedNativeCreateExecutionRecord, true);
  assert.equal(createEvidence.consumesAcceptedNativeUpdateExecutionRecord, false);
  assert.equal(createEvidence.consumesAcceptedNativeUnmountExecutionRecord, false);
  assert.equal(createEvidence.consumesPrivateToJSONEvidence, true);
  assert.equal(createEvidence.consumesAcceptedHostOutputRow, false);
  assert.equal(createEvidence.minimalTreeShape, true);
  assert.equal(createEvidence.publicSerializationAvailable, false);
  assert.equal(createEvidence.publicRouteAvailable, false);
  assert.equal(createEvidence.nativeBridgeAvailable, false);
  assert.equal(createEvidence.nativeExecution, false);
  assert.equal(createEvidence.compatibilityClaimed, false);

  const updateEvidence =
    facade.createAcceptedNativeExecutionDiagnosticResult(
      updateResult,
      privateToJSONReport({
        hostOutputUpdateKind: "Update",
        rowId: privateToJSONUpdateHostOutputRowId,
        rowShape: "SingleHostText",
        rootChildCount: 1,
        rootNodeKind: "HostComponent",
        nodes: [
          hostComponentNode(0, null, [1], "span"),
          textNode(1, 0, "goodbye")
        ]
      })
    );
  assert.equal(updateEvidence.operation, "update");
  assert.equal(updateEvidence.hostOutputUpdateKind, "Update");
  assert.equal(updateEvidence.hostOutputRowId, privateToJSONUpdateHostOutputRowId);
  assert.equal(updateEvidence.consumesAcceptedNativeCreateExecutionRecord, false);
  assert.equal(updateEvidence.consumesAcceptedNativeUpdateExecutionRecord, true);
  assert.equal(updateEvidence.consumesAcceptedNativeUnmountExecutionRecord, false);
  assert.equal(updateEvidence.consumesAcceptedHostOutputRow, true);
  assert.deepEqual(updateEvidence.result, {
    type: "span",
    props: {},
    children: ["goodbye"]
  });

  const unmountEvidence =
    facade.createAcceptedNativeExecutionDiagnosticResult(
      unmountResult,
      privateToJSONReport({
        hostOutputUpdateKind: "Unmount",
        rowId: privateToJSONUnmountHostOutputRowId,
        rowShape: "EmptyRoot",
        rootChildCount: 0,
        rootNodeKind: "EmptyRoot",
        nodes: []
      })
    );
  assert.equal(unmountEvidence.operation, "unmount");
  assert.equal(unmountEvidence.hostOutputUpdateKind, "Unmount");
  assert.equal(unmountEvidence.hostOutputShape, "EmptyRoot");
  assert.equal(
    unmountEvidence.hostOutputRowId,
    privateToJSONUnmountHostOutputRowId
  );
  assert.equal(unmountEvidence.sourceNodeCount, 0);
  assert.equal(unmountEvidence.rootChildCount, 0);
  assert.equal(unmountEvidence.result, null);
  assert.equal(unmountEvidence.consumesAcceptedNativeCreateExecutionRecord, false);
  assert.equal(unmountEvidence.consumesAcceptedNativeUpdateExecutionRecord, false);
  assert.equal(unmountEvidence.consumesAcceptedNativeUnmountExecutionRecord, true);
  assert.equal(unmountEvidence.consumesAcceptedHostOutputRow, true);
  assert.equal(unmountEvidence.publicSerializationAvailable, false);
  assert.equal(unmountEvidence.nativeExecution, false);
  assert.equal(unmountEvidence.compatibilityClaimed, false);

  assert.equal(
    facade.canCreateAcceptedNativeExecutionDiagnosticResult(
      updateResult,
      privateToJSONReport({
        hostOutputUpdateKind: "Create",
        rowId: null,
        rowShape: null,
        rootChildCount: 1,
        rootNodeKind: "HostComponent",
        nodes: [
          hostComponentNode(0, null, [1], "span"),
          textNode(1, 0, "wrong")
        ]
      })
    ),
    false
  );
  const mismatchError = captureThrown(() =>
    facade.createAcceptedNativeExecutionDiagnosticResult(
      updateResult,
      privateToJSONReport({
        hostOutputUpdateKind: "Create",
        rowId: null,
        rowShape: null,
        rootChildCount: 1,
        rootNodeKind: "HostComponent",
        nodes: [
          hostComponentNode(0, null, [1], "span"),
          textNode(1, 0, "wrong")
        ]
      })
    )
  );
  assert.equal(
    mismatchError.name,
    "FastReactTestRendererPrivateToJSONSerializationError"
  );
  assert.equal(mismatchError.publicSerializationAvailable, false);
  assert.equal(mismatchError.nativeExecution, false);
  assert.match(mismatchError.message, /Update toJSON evidence/u);
});

test("react-test-renderer CJS development private act route flushes accepted scheduler mock create-root evidence", () => {
  const entry = entrypoints.find(
    (candidate) => candidate.entrypoint === cjsDevelopmentEntrypoint
  );
  assert.notEqual(entry, undefined);

  const moduleExports = loadFresh(entry.modulePath);
  const Scheduler = loadFresh("packages/scheduler/unstable_mock.js");
  const reactGate = loadFresh(privateActDispatcherGateModule);
  const bridge = assertPrivateRootRequestBridge(
    moduleExports,
    entry.entrypoint
  );
  const renderer = moduleExports.create(
    { props: { children: "hello" }, type: "div" },
    {}
  );
  const [createRequest] = bridge.getRendererRootRequests(renderer);
  const diagnostics =
    moduleExports._Scheduler.unstable_flushExpired[
      privateActQueueFlushDiagnosticsExport
    ];

  Scheduler.reset();
  const privateEvents = [];
  const expiredCallback = reactGate.createInternalActQueueTestCallback(
    (didTimeout) => {
      privateEvents.push([
        "expired-create-root-callback",
        didTimeout,
        Scheduler.unstable_getCurrentPriorityLevel(),
        Scheduler.unstable_now()
      ]);
      Scheduler.log("expired-create-root-callback");
    },
    { label: "expired-create-root-callback" }
  );
  const expiredHandle = Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_UserBlockingPriority,
    expiredCallback
  );
  let publicSchedulerCallbackRan = false;
  Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_NormalPriority,
    () => {
      publicSchedulerCallbackRan = true;
      Scheduler.log("public-renderer-work");
    }
  );
  const actQueue = reactGate.createInternalActQueueTestQueue([
    reactGate.createInternalActQueueTestTask({
      label: "create-root-schedule",
      recordKind: "SchedulerActQueueRequest",
      taskKind: "RootSchedule",
      continuationStatus: "NoContinuation",
      callback: reactGate.createInternalActQueueTestCallback(
        (didTimeout) => {
          privateEvents.push([
            "create-root-schedule",
            didTimeout,
            Scheduler.unstable_now()
          ]);
          Scheduler.log("create-root-schedule");
        },
        { label: "create-root-schedule" }
      )
    }),
    reactGate.createInternalActQueueTestTask({
      label: "create-root-callback",
      recordKind: "SyncFlushActContinuationRecord",
      taskKind: "SchedulerCallback",
      continuationStatus: "PendingContinuation",
      callback: reactGate.createInternalActQueueTestCallback(
        (didTimeout) => {
          privateEvents.push([
            "create-root-callback",
            didTimeout,
            Scheduler.unstable_now()
          ]);
          Scheduler.log("create-root-callback");
        },
        { label: "create-root-callback" }
      )
    })
  ]);

  Scheduler.unstable_advanceTime(251);
  const metadata =
    diagnostics.createExpiredActRootWorkMetadataFromPrivateRootRequest(
      createRequest,
      expiredHandle,
      actQueue,
      {
        priorityLevel: Scheduler.unstable_UserBlockingPriority,
        schedulerPriority: "UserBlocking"
      }
    );
  assert.equal(Object.isFrozen(metadata), true);
  assert.equal(
    metadata[privateSchedulerMockExpiredActRootWorkMetadataBrand],
    true
  );
  assert.equal(metadata.kind, privateSchedulerMockExpiredActRootWorkMetadataKind);
  assert.equal(metadata.rootRequestId, createRequest.requestId);
  assert.equal(metadata.rootOperation, "create");
  assert.deepEqual(
    metadata.rootWorkRecords.map((record) => record.recordKind),
    [
      "RootLaneSchedulingSnapshot",
      "UpdateContainerResult",
      "RootTaskScheduleRecord",
      "HostRootFinishedWorkPendingCommitRecordForCanary"
    ]
  );

  const described =
    diagnostics.describeAcceptedMockSchedulerExpiredActRootWorkMetadata(
      Scheduler.unstable_flushExpired,
      metadata
    );
  assert.equal(described.accepted, true);
  assert.equal(described.rejectionReason, null);
  assert.equal(described.rootWorkRecordCount, 4);
  assert.equal(described.drainsExpiredMockSchedulerWork, false);
  assert.equal(described.executesRendererWork, false);

  const report =
    diagnostics.routeAcceptedMockSchedulerExpiredActRootWorkMetadata(
      Scheduler.unstable_flushExpired,
      metadata
    );
  assert.equal(report.status, mockSchedulerExpiredActRootWorkRoutingStatus);
  assert.equal(report.accepted, true);
  assert.equal(report.metadataKind, privateSchedulerMockExpiredActRootWorkMetadataKind);
  assert.equal(report.diagnosticsKind, privateSchedulerMockExpiredActRootWorkDiagnosticsKind);
  assert.equal(
    report.schedulerDrainReport[
      privateSchedulerMockExpiredActRootWorkDiagnosticsBrand
    ],
    true
  );
  assert.equal(report.rootWorkRecordCount, 4);
  assert.equal(report.actQueuePendingBefore, 2);
  assert.equal(report.actQueuePendingAfter, 0);
  assert.equal(report.sourceDrainFlushedExpiredWork, true);
  assert.equal(report.drainsExpiredMockSchedulerWork, true);
  assert.equal(report.drainsAcceptedInternalTestQueues, true);
  assert.equal(report.drainsPublicSchedulerTaskQueue, false);
  assert.equal(report.drainsPublicReactActQueue, false);
  assert.equal(report.publicSchedulerTimingCompatibilityClaimed, false);
  assert.equal(report.publicReactActCompatibilityClaimed, false);
  assert.equal(report.publicActCompatibilityClaimed, false);
  assert.equal(report.compatibilityClaimed, false);
  assert.equal(report.executesAcceptedInternalTestCallbacks, true);
  assert.equal(report.executesQueuedWork, false);
  assert.equal(report.executesEffects, false);
  assert.equal(report.executesScheduledCallbacks, true);
  assert.equal(report.executesRendererWork, false);
  assert.equal(report.executesRendererRoots, false);
  assert.equal(report.publicActBehaviorAvailable, false);
  assert.deepEqual(privateEvents, [
    [
      "expired-create-root-callback",
      true,
      Scheduler.unstable_UserBlockingPriority,
      251
    ],
    ["create-root-schedule", false, 251],
    ["create-root-callback", false, 251]
  ]);
  assert.equal(publicSchedulerCallbackRan, false);
  assert.deepEqual(Scheduler.unstable_clearLog(), [
    "expired-create-root-callback",
    "create-root-schedule",
    "create-root-callback"
  ]);
  assert.equal(Scheduler.unstable_hasPendingWork(), true);

  const stale =
    diagnostics.describeAcceptedMockSchedulerExpiredActRootWorkMetadata(
      Scheduler.unstable_flushExpired,
      metadata
  );
  assert.equal(stale.accepted, false);
  assert.equal(stale.rejectionReason, "expired-act-root-work-metadata-stale-act-queue");
});

test("react-test-renderer development private error-boundary diagnostics follow update requests", () => {
  const entry = entrypoints.find(
    (candidate) => candidate.entrypoint === cjsDevelopmentEntrypoint
  );
  const moduleExports = loadFresh(entry.modulePath);
  const bridge = assertPrivateRootRequestBridge(
    moduleExports,
    entry.entrypoint
  );
  const calls = [];
  const renderer = moduleExports.create(
    { type: "initial" },
    {
      onUncaughtError(error) {
        calls.push(["uncaught", error.message]);
      },
      onCaughtError(error) {
        calls.push(["caught", error.message]);
      },
      onRecoverableError(error) {
        calls.push(["recoverable", error.message]);
      }
    }
  );
  const [createRequest] = bridge.getRendererRootRequests(renderer);
  const rendererDescriptor = Object.getOwnPropertyDescriptor(
    renderer,
    privateErrorBoundaryDiagnosticsSymbol
  );

  assert.notEqual(rendererDescriptor, undefined);
  assert.equal(rendererDescriptor.enumerable, false);
  assert.deepEqual(
    rendererDescriptor.value.rows.map((row) => row.id),
    privateErrorBoundaryUpdateRefreshRows
  );
  assert.deepEqual(
    rendererDescriptor.value.rows.map((row) => row.phase),
    ["Update", "Commit"]
  );
  assert.deepEqual(
    rendererDescriptor.value.acceptedPrivateDiagnosticDependencyIds,
    privateErrorBoundaryUpdateRefreshDependencyIds
  );
  assert.deepEqual(
    rendererDescriptor.value.gate.acceptedRustRecords,
    [
      "TestRendererPrivateErrorBoundaryDiagnostics",
      "TestRendererPrivateErrorDiagnosticRow",
      "TestRendererPrivateErrorBoundaryDependencyDiagnostics",
      "TestRendererRootErrorOptionDiagnostics"
    ]
  );
  assert.deepEqual(
    rendererDescriptor.value.gate.acceptedRustApis,
    privateErrorBoundaryAcceptedRustApis
  );
  assert.equal(
    rendererDescriptor.value.acceptedRustApi,
    privateErrorBoundaryRootOptionsRustApi
  );
  assert.deepEqual(
    rendererDescriptor.value.rows.map((row) => row.acceptedRustApi),
    [
      privateErrorBoundaryRootOptionsRustApi,
      privateErrorBoundaryRootOptionsRustApi
    ]
  );

  const updateError = captureThrown(() =>
    renderer.update({ type: "updated" })
  );
  const updateRequest = updateError.rootRequest;
  const updateDiagnostics = updateError.privateErrorBoundaryDiagnostics;

  assert.equal(updateRequest.operation, "update");
  assert.equal(updateRequest.privateErrorBoundaryDiagnosticsAvailable, true);
  assert.equal(updateDiagnostics.rootRequest, updateRequest);
  assert.equal(updateDiagnostics.rootOperation, "update");
  assert.equal(updateDiagnostics.acceptedRustApi, privateErrorBoundaryUpdateRustApi);
  assert.equal(updateDiagnostics.rootErrorOptions, createRequest.optionsInfo.rootErrorOptions);
  assert.equal(updateDiagnostics.rootErrorOptionsSourceRequestId, createRequest.requestId);
  assert.equal(updateDiagnostics.rootErrorOptionsInheritedFromCreateRequest, true);
  assert.deepEqual(
    updateDiagnostics.rows.map((row) => row.id),
    privateErrorBoundaryUpdateRefreshRows
  );
  assert.deepEqual(
    updateDiagnostics.rows.map((row) => row.hostOutputUpdateKind),
    ["Update", "Update"]
  );
  assert.deepEqual(
    updateDiagnostics.rows.map((row) => row.acceptedRustApi),
    [privateErrorBoundaryUpdateRustApi, privateErrorBoundaryUpdateRustApi]
  );
  assert.equal(updateDiagnostics.updateErrorRowAvailable, true);
  assert.equal(updateDiagnostics.renderErrorRowAvailable, false);
  assert.equal(updateDiagnostics.commitErrorRowAvailable, true);
  assert.equal(updateDiagnostics.dependencyDiagnostics.updateRouteDiagnosticsAvailable, true);
  assert.equal(updateDiagnostics.dependencyDiagnostics.serializationDiagnosticsAvailable, true);
  assert.equal(updateDiagnostics.dependencyDiagnostics.testInstanceQueryDiagnosticsAvailable, true);
  assert.equal(updateDiagnostics.dependencyDiagnostics.actSchedulerMetadataAvailable, true);
  assert.equal(updateDiagnostics.publicRendererRootsExecuted, false);
  assert.equal(updateDiagnostics.publicLifecycleMethodsExecuted, false);
  assert.equal(updateDiagnostics.errorBoundaryRecoveryExecuted, false);
  assert.equal(updateDiagnostics.compatibilityClaimed, false);
  assert.equal(
    bridge.getRootErrorBoundaryDiagnostics(updateRequest),
    updateDiagnostics
  );
  assert.deepEqual(calls, []);
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
  assert.equal(
    gate.localChecks.privateTestInstanceQueryBridgePreflightPresent,
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

test("react-test-renderer CJS development private TestInstance query bridge preflights accepted Rust diagnostics records", () => {
  const entry = cjsEntrypoints.find((candidate) =>
    candidate.entrypoint.endsWith("react-test-renderer.development")
  );
  assert.notEqual(entry, undefined);

  const moduleExports = loadFresh(entry.modulePath);
  const bridge = assertPrivateRootRequestBridge(
    moduleExports,
    entry.entrypoint
  );
  const renderer = moduleExports.create({ type: "private-query-preflight" });
  const [createRequest] = bridge.getRendererRootRequests(renderer);
  const record = Object.getOwnPropertyDescriptor(
    renderer,
    privateTestInstanceWrapperRecordSymbol
  ).value;
  const preflight = record.queryBridgePreflight;

  assertPrivateTestInstanceQueryBridgePreflight(
    preflight,
    record,
    createRequest,
    entry.entrypoint
  );
  assert.equal(
    bridge.getTestInstanceQueryBridgePreflight(createRequest),
    preflight,
    entry.entrypoint
  );
  assert.equal(
    bridge.getRootTestInstanceQueryBridgePreflight(createRequest.rootHandle),
    preflight,
    entry.entrypoint
  );
  assert.equal(
    bridge.getRendererTestInstanceQueryBridgePreflight(renderer),
    preflight,
    entry.entrypoint
  );
  assert.equal(
    bridge.canConsumeAcceptedRustTestInstanceQueryDiagnostics(createRequest, {
      findAll: record.findAllPredicateDiagnostics,
      findBy: record.findByQueryDiagnostics
    }),
    true,
    entry.entrypoint
  );

  const consumed = bridge.consumeAcceptedRustTestInstanceQueryDiagnostics(
    createRequest,
    {
      findAll: record.findAllPredicateDiagnostics,
      findBy: record.findByQueryDiagnostics
    }
  );
  assertPrivateTestInstanceQueryBridgePreflight(
    consumed,
    record,
    createRequest,
    `${entry.entrypoint} consumed`
  );
  assert.equal(
    consumed.acceptedRustFindAllDiagnostics,
    record.findAllPredicateDiagnostics,
    entry.entrypoint
  );
  assert.equal(
    consumed.acceptedRustFindByDiagnostics,
    record.findByQueryDiagnostics,
    entry.entrypoint
  );
  assert.equal(
    bridge.canConsumeAcceptedRustTestInstanceQueryDiagnostics(createRequest, {
      findAll: { diagnosticName: "not-accepted" },
      findBy: record.findByQueryDiagnostics
    }),
    false,
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

test("react-test-renderer cjs development private toJSON facade records nested update and sibling text rows", () => {
  const moduleExports = loadFresh(
    "packages/react-test-renderer/cjs/react-test-renderer.development.js"
  );
  const renderer = moduleExports.create(null);
  const facade = renderer.toJSON[privateToJSONSerializationFacadeSymbol];

  assert.equal(Object.isFrozen(facade), true);
  assert.equal(
    facade.privateNestedUpdateHostOutputRowId,
    privateToJSONNestedUpdateHostOutputRowId
  );
  assert.equal(
    facade.privateSiblingTextHostOutputRowId,
    privateToJSONSiblingTextHostOutputRowId
  );
  assert.deepEqual(
    facade.privateUpdateHostOutputRowIds,
    privateToJSONUpdateHostOutputRowIds
  );
  assert.deepEqual(
    facade.privateNestedUpdateSiblingTextHostOutputRows.map((row) => row.id),
    [
      privateToJSONNestedUpdateHostOutputRowId,
      privateToJSONSiblingTextHostOutputRowId
    ]
  );
  assert.equal(facade.mismatchedUpdateShapeRejection, true);
  assert.equal(facade.publicSerializationAvailable, false);
  assert.equal(facade.nativeExecution, false);

  const nestedReport = privateToJSONReport({
    rowId: privateToJSONNestedUpdateHostOutputRowId,
    rowShape: "NestedHostText",
    rootChildCount: 1,
    rootNodeKind: "HostComponent",
    nodes: [
      hostComponentNode(0, null, [1], "section"),
      hostComponentNode(1, 0, [2, 3], "span"),
      textNode(2, 1, "stable"),
      textNode(3, 1, "inserted")
    ]
  });
  assert.deepEqual(facade.serializeAcceptedHostOutputDiagnostic(nestedReport), {
    type: "section",
    props: {},
    children: [
      {
        type: "span",
        props: {},
        children: ["stable", "inserted"]
      }
    ]
  });
  const nestedDiagnostic =
    facade.createAcceptedHostOutputDiagnosticResult(nestedReport);
  assert.equal(nestedDiagnostic.hostOutputShape, "NestedHostText");
  assert.equal(
    nestedDiagnostic.hostOutputRowId,
    privateToJSONNestedUpdateHostOutputRowId
  );
  assert.equal(nestedDiagnostic.publicSerializationAvailable, false);
  assert.equal(nestedDiagnostic.nativeExecution, false);

  const siblingReport = privateToJSONReport({
    rowId: privateToJSONSiblingTextHostOutputRowId,
    rowShape: "SiblingText",
    rootChildCount: 2,
    rootNodeKind: "MultipleHostChildren",
    nodes: [
      textNode(0, null, "first sibling"),
      hostComponentNode(1, null, [2], "span"),
      textNode(2, 1, "second sibling")
    ]
  });
  assert.deepEqual(facade.serializeAcceptedHostOutputDiagnostic(siblingReport), [
    "first sibling",
    {
      type: "span",
      props: {},
      children: ["second sibling"]
    }
  ]);

  const mismatchReport = privateToJSONReport({
    rowId: privateToJSONNestedUpdateHostOutputRowId,
    rowShape: "NestedHostText",
    rootChildCount: 2,
    rootNodeKind: "MultipleHostChildren",
    nodes: [
      textNode(0, null, "first sibling"),
      hostComponentNode(1, null, [2], "span"),
      textNode(2, 1, "second sibling")
    ]
  });
  const mismatchError = captureThrown(() =>
    facade.serializeAcceptedHostOutputDiagnostic(mismatchReport)
  );
  assert.equal(
    mismatchError.name,
    "FastReactTestRendererPrivateToJSONSerializationError"
  );
  assert.equal(
    mismatchError.code,
    "FAST_REACT_TEST_RENDERER_PRIVATE_TOJSON_SERIALIZATION"
  );
  assert.equal(mismatchError.publicSerializationAvailable, false);
  assert.equal(mismatchError.nativeExecution, false);
  assert.match(mismatchError.message, /row shape/u);
});

function privateToJSONReport({
  hostOutputUpdateKind = "Update",
  rowId,
  rowShape,
  rootChildCount,
  rootNodeKind,
  nodes
}) {
  return {
    diagnosticName: "fast-react-test-renderer.serialization.private-json-canary",
    hostOutputUpdateKind,
    hostOutputSnapshotCurrent: true,
    ...(rowId === null
      ? {}
      : {
          hostOutputRow: {
            id: rowId,
            status:
              "private-tojson-update-unmount-host-output-rows-public-tojson-blocked",
            hostOutputUpdateKind,
            hostOutputShape: rowShape,
            currentRootChildCount: rootChildCount,
            dependencyMetadata: {
              acceptedPrivateDiagnosticDependencyIds:
                privateToJSONUpdateUnmountDependencyIds,
              serializationDiagnosticsAvailable: true,
              hostOutputSnapshotFreshnessRequired: true,
              staleSnapshotRejection: true,
              mismatchedUpdateUnmountRecordRejection: true,
              publicToJSONAvailable: false,
              publicTestInstanceAvailable: false,
              nativeExecutionAvailable: false,
              compatibilityClaimed: false
            }
          }
        }),
    rootChildCount,
    rootNodeKind,
    publicBlockers: {
      jsonMethodBlocked: true,
      treeMethodBlocked: true,
      instanceWrapperBlocked: true,
      jsFacadeRoutingBlocked: true,
      publicActBlocked: true,
      compatibilityClaimBlocked: true
    },
    nodes
  };
}

function hostComponentNode(ordinal, parentOrdinal, childOrdinals, elementType) {
  return {
    ordinal,
    nodeKind: "HostComponent",
    parentOrdinal,
    childOrdinals,
    elementType,
    props: {},
    hidden: false,
    detached: false
  };
}

function textNode(ordinal, parentOrdinal, text) {
  return {
    ordinal,
    nodeKind: "Text",
    parentOrdinal,
    childOrdinals: [],
    text,
    hidden: false,
    detached: false
  };
}

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
  if (entrypoint === cjsDevelopmentEntrypoint) {
    assert.equal(typeof bridge.getRootCreatePreflight, "function");
    assert.equal(typeof bridge.getRendererRootCreatePreflight, "function");
    assert.equal(
      typeof bridge.getRootCreateWorkLoopFinishedWorkPreflight,
      "function"
    );
    assert.equal(
      typeof bridge.getRendererRootCreateWorkLoopFinishedWorkPreflight,
      "function"
    );
    assert.equal(
      typeof bridge.canConsumeAcceptedRustRootCreatePreflight,
      "function"
    );
    assert.equal(
      typeof bridge.consumeAcceptedRustRootCreatePreflight,
      "function"
    );
    assert.equal(typeof bridge.getRootCreateRouteAdmission, "function");
    assert.equal(
      typeof bridge.getRendererRootCreateRouteAdmission,
      "function"
    );
    assert.equal(
      typeof bridge.canConsumeAcceptedRustRootCreateRouteAdmission,
      "function"
    );
    assert.equal(
      typeof bridge.consumeAcceptedRustRootCreateRouteAdmission,
      "function"
    );
    assert.equal(
      typeof bridge.canConsumePrivateCreateNativeBridgeHostOutputHandoff,
      "function"
    );
    assert.equal(
      typeof bridge.consumePrivateCreateNativeBridgeHostOutputHandoff,
      "function"
    );
  }
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
  if (entrypoint.includes("/cjs/")) {
    assert.equal(
      typeof bridge.getUpdateRouteRootWorkLoopAdmission,
      "function"
    );
    assert.equal(
      typeof bridge.canConsumeAcceptedRustUpdateRouteRootWorkLoop,
      "function"
    );
    assert.equal(
      typeof bridge.consumeAcceptedRustUpdateRouteRootWorkLoop,
      "function"
    );
    assert.equal(
      typeof bridge.canConsumePrivateUpdateNativeBridgeAdmission,
      "function"
    );
    assert.equal(
      typeof bridge.consumePrivateUpdateNativeBridgeAdmission,
      "function"
    );
    assert.equal(
      typeof bridge.canConsumePrivateUnmountNativeBridgeAdmission,
      "function"
    );
    assert.equal(
      typeof bridge.consumePrivateUnmountNativeBridgeAdmission,
      "function"
    );
  }
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
  if (
    request.privateCreateNativeBridgeHostOutputHandoffAvailable !==
    undefined
  ) {
    assert.equal(
      request.privateCreateNativeBridgeHostOutputHandoffAvailable,
      expected.operation === "create"
    );
    if (expected.operation === "create") {
      assertPrivateCreateRouteAdmissionGate(
        request.privateCreateNativeBridgeHostOutputHandoffGate,
        expected.entrypoint
      );
    } else {
      assert.equal(
        request.privateCreateNativeBridgeHostOutputHandoffGate,
        null
      );
    }
  }
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
  if (request.privateUnmountNativeBridgeCleanupHandoffGate != null) {
    assert.equal(
      handoff.privateUnmountNativeBridgeCleanupHandoffGate,
      request.privateUnmountNativeBridgeCleanupHandoffGate
    );
    assert.equal(
      handoff.privateUnmountNativeBridgeCleanupHandoffAvailable,
      true
    );
  }
  if (request.privateUnmountNativeBridgeAdmissionGate != null) {
    assert.equal(
      handoff.privateUnmountNativeBridgeAdmissionGate,
      request.privateUnmountNativeBridgeAdmissionGate
    );
    assert.equal(handoff.privateUnmountNativeBridgeAdmissionAvailable, true);
  }
  if (request.privateCreateNativeBridgeHostOutputHandoffGate != null) {
    assert.equal(
      handoff.privateCreateNativeBridgeHostOutputHandoffGate,
      request.privateCreateNativeBridgeHostOutputHandoffGate
    );
    assert.equal(
      handoff.privateCreateNativeBridgeHostOutputHandoffAvailable,
      true
    );
  }
  if (request.privateUpdateNativeBridgeAdmissionGate != null) {
    assert.equal(
      handoff.privateUpdateNativeBridgeAdmissionGate,
      request.privateUpdateNativeBridgeAdmissionGate
    );
    assert.equal(handoff.privateUpdateNativeBridgeAdmissionAvailable, true);
  }
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
  if (result.privateUnmountNativeBridgeAdmission != null) {
    assertPrivateUnmountNativeBridgeAdmission(
      result.privateUnmountNativeBridgeAdmission,
      request
    );
    assert.equal(
      result.privateUnmountNativeBridgeCleanupHandoff,
      result.privateUnmountNativeBridgeAdmission.cleanupHandoff
    );
    assert.equal(
      result.privateUnmountNativeBridgeCleanupHandoffAvailable,
      true
    );
  }
  if (result.privateCreateNativeBridgeHostOutputHandoff != null) {
    assertPrivateCreateNativeBridgeHostOutputHandoff(
      result.privateCreateNativeBridgeHostOutputHandoff,
      request
    );
  }
  if (result.privateUpdateNativeBridgeAdmission != null) {
    assertPrivateUpdateNativeBridgeAdmission(
      result.privateUpdateNativeBridgeAdmission,
      request
    );
  }
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
  assert.equal(
    result.hostOutputProduced,
    result.privateCreateNativeBridgeHostOutputHandoff != null ||
      result.privateUpdateNativeBridgeAdmission != null ||
      result.privateUnmountNativeBridgeAdmission?.hostOutputProduced === true
  );
  assert.equal(result.serializationAvailable, false);
  assert.equal(result.publicRouteAvailable, false);
  assert.equal(
    result.publicCreateUpdateUnmountBehaviorAvailable,
    false
  );
  assert.equal(result.compatibilityClaimed, false);
}

function assertPrivateRootCreatePreflight(preflight, request, expected) {
  assert.equal(Object.isFrozen(preflight), true, expected.entrypoint);
  assert.equal(
    preflight.kind,
    "FastReactTestRendererPrivateRootCreatePreflight"
  );
  assert.equal(
    preflight.diagnosticName,
    privateRootCreatePreflightDiagnosticName
  );
  assert.equal(
    preflight.status,
    expected.ready
      ? privateRootCreatePreflightStatus
      : `blocked-private-root-create-preflight-${expected.failureReason}`
  );
  assert.equal(preflight.ready, expected.ready);
  assert.equal(preflight.failureReason, expected.failureReason);
  assert.equal(preflight.entrypoint, expected.entrypoint);
  assert.equal(preflight.compatibilityTarget, compatibilityTarget);
  assertPrivateRootCreatePreflightGate(preflight.gate, expected.entrypoint);
  assert.equal(preflight.rootRequest, request);
  assert.equal(preflight.rootHandle, request.rootHandle);
  assert.equal(preflight.rootId, request.rootId);
  assert.equal(preflight.rootSequence, request.rootSequence);
  assert.equal(preflight.rootRequestId, request.requestId);
  assert.equal(preflight.rootRequestSequence, request.requestSequence);
  assert.equal(preflight.operation, "create");
  assert.equal(preflight.publicSurface, "create()");
  assert.equal(Object.isFrozen(preflight.createInputShape), true);
  assert.equal(
    preflight.createInputShape.kind,
    "FastReactTestRendererRootCreateInputShape"
  );
  assert.equal(
    preflight.createInputShape.rootElementHandle,
    request.rootElementHandle
  );
  assert.equal(
    preflight.createInputShape.acceptedShape,
    expected.supportedChildren ? "HostComponentWithTextChild" : "Unsupported"
  );
  assert.equal(preflight.createInputShape.rootNodeKind, "HostComponent");
  assert.equal(preflight.createInputShape.elementType, "div");
  assert.equal(
    preflight.createInputShape.childShape,
    expected.supportedChildren ? "Text" : "Array"
  );
  assert.equal(
    preflight.createInputShape.supportedChildren,
    expected.supportedChildren
  );
  assert.equal(
    preflight.createInputShape.failClosedForUnsupportedChildren,
    true
  );
  assert.equal(preflight.rootOptionsMetadata, request.optionsInfo);
  assert.equal(
    preflight.rootOptionsMetadataAvailable,
    expected.rootOptionsMetadataAvailable
  );
  assert.equal(preflight.rootOptionsRequired, true);
  assert.equal(Object.isFrozen(preflight.canaryApiIdentity), true);
  assert.equal(
    preflight.canaryApiIdentity.metadataId,
    request.rustCanaryMetadata.id
  );
  assert.equal(
    preflight.canaryApiIdentity.metadataStatus,
    request.rustCanaryMetadata.status
  );
  assert.equal(preflight.canaryApiIdentity.operation, "create");
  assert.equal(
    preflight.canaryApiIdentity.rootApi,
    "TestRendererRoot::create"
  );
  assert.equal(
    preflight.canaryApiIdentity.preflightApi,
    "TestRendererRoot::describe_private_root_create_preflight_for_canary"
  );
  assert.equal(preflight.canaryApiIdentity.rootOptionsType, "RootOptions");
  assert.equal(
    preflight.canaryApiIdentity.testRendererOptionsType,
    "TestRendererOptions"
  );
  assert.equal(
    preflight.canaryApiIdentity.containerUpdateApi,
    "update_container"
  );
  assert.equal(
    preflight.canaryApiIdentity.schedulerApi,
    "ensure_root_is_scheduled"
  );
  assert.equal(preflight.rustCanaryMetadata, request.rustCanaryMetadata);
  assert.equal(
    preflight.rustCanaryOperationMetadata,
    request.rustCanaryOperationMetadata
  );
  assertPrivateRootCreateWorkLoopFinishedWorkPreflight(
    preflight.workLoopFinishedWorkPreflight,
    preflight,
    expected
  );
  assert.equal(preflight.privateRustRootCreated, expected.ready);
  assert.equal(
    preflight.privateRootCanaryBoundaryValidated,
    expected.ready
  );
  assert.equal(
    preflight.consumesAcceptedRustRootCreatePreflightDiagnostics,
    expected.ready
  );
  assert.equal(
    preflight.consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata,
    expected.ready
  );
  assert.equal(Object.isFrozen(preflight.blockedPublicRoot), true);
  assert.equal(
    preflight.blockedPublicRoot.status,
    rootRequestCompatibilityStatus
  );
  assert.equal(preflight.blockedPublicRoot.publicRendererRootCreated, false);
  assert.equal(preflight.blockedPublicRoot.publicRootAvailable, false);
  assert.equal(
    preflight.blockedPublicRoot.publicCreateBehaviorAvailable,
    false
  );
  assert.equal(preflight.publicRendererRootCreated, false);
  assert.equal(preflight.publicRootAvailable, false);
  assert.equal(preflight.publicCreateBehaviorAvailable, false);
  assert.equal(preflight.nativeAddonLoaded, false);
  assert.equal(preflight.nativeBridgeAvailable, false);
  assert.equal(preflight.nativeExecution, false);
  assert.equal(preflight.rustExecutionFromJs, false);
  assert.equal(preflight.reconcilerExecutionFromJs, false);
  assert.equal(preflight.hostOutputProducedFromJs, false);
  assert.equal(preflight.compatibilityClaimed, false);
}

function assertPrivateRootCreateWorkLoopFinishedWorkPreflight(
  row,
  preflight,
  expected
) {
  assert.equal(Object.isFrozen(row), true, expected.entrypoint);
  assert.equal(row.id, privateRootCreateWorkLoopFinishedWorkPreflightRowId);
  assert.equal(row.rowKind, "private-diagnostic");
  assert.equal(row.area, "root-create work loop");
  assert.equal(row.diagnosticName, privateRootCreatePreflightDiagnosticName);
  assert.equal(
    row.status,
    expected.ready
      ? privateRootCreateWorkLoopFinishedWorkPreflightStatus
      : `blocked-private-root-create-work-loop-finished-work-preflight-${expected.failureReason}`
  );
  assert.equal(row.ready, expected.ready);
  assert.equal(row.failureReason, expected.failureReason);
  assert.equal(row.entrypoint, expected.entrypoint);
  assert.equal(row.compatibilityTarget, compatibilityTarget);
  assert.equal(row.publicSurface, "create()");
  assert.equal(row.rootRequest, preflight.rootRequest);
  assert.equal(row.rootRequestId, preflight.rootRequestId);
  assert.equal(row.operation, "create");
  assert.equal(row.createInputShape, preflight.createInputShape);
  assert.equal(row.acceptedInputShape, "HostComponentWithTextChild");
  assert.equal(row.supportedChildren, expected.supportedChildren);
  assert.equal(
    row.rootOptionsMetadataAvailable,
    expected.rootOptionsMetadataAvailable
  );
  assert.equal(row.canaryApiIdentity, preflight.canaryApiIdentity);
  assert.equal(Object.isFrozen(row.workLoopFinishedWorkMetadata), true);
  assert.equal(
    row.workLoopFinishedWorkMetadata.metadataId,
    privateRootWorkLoopFinishedWorkPreflightMetadataId
  );
  assert.equal(
    row.workLoopFinishedWorkMetadata.metadataStatus,
    privateRootWorkLoopFinishedWorkPreflightMetadataStatus
  );
  assert.equal(
    row.workLoopFinishedWorkMetadata.acceptedWorker,
    "worker-534-root-work-loop-finished-work-commit-handoff"
  );
  assert.equal(
    row.workLoopFinishedWorkMetadata.acceptedRustModule,
    "fast-react-reconciler::root_work_loop"
  );
  assert.equal(
    row.workLoopFinishedWorkMetadata.renderPhaseApi,
    "TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff"
  );
  assert.equal(
    row.workLoopFinishedWorkMetadata.renderPhaseRecord,
    "HostRootRenderPhaseRecord"
  );
  assert.equal(
    row.workLoopFinishedWorkMetadata.finishedWorkRecord,
    "HostRootRenderPhaseRecord::finished_work"
  );
  assert.equal(
    row.workLoopFinishedWorkMetadata.pendingFinishedWorkRecord,
    "HostRootFinishedWorkPendingCommitRecordForCanary"
  );
  assert.equal(
    row.workLoopFinishedWorkMetadata.commitHandoffRecord,
    "HostRootFinishedWorkCommitHandoffRecordForCanary"
  );
  assert.equal(
    row.workLoopFinishedWorkMetadata.acceptedInputShape,
    "HostComponentWithTextChild"
  );
  assert.equal(row.acceptedRustCrate, "fast-react-test-renderer");
  assert.equal(
    row.acceptedRustWorker,
    "worker-534-root-work-loop-finished-work-commit-handoff"
  );
  assert.equal(
    row.acceptedJsBridgeWorker,
    "worker-573-test-renderer-private-root-work-loop-preflight"
  );
  assert.deepEqual(row.acceptedRustApis, preflight.gate.acceptedRustApis);
  assert.deepEqual(row.acceptedRustTests, preflight.gate.acceptedRustTests);
  assert.deepEqual(
    row.acceptedRustFinishedWorkRecords,
    preflight.gate.acceptedRustFinishedWorkRecords
  );
  assert.equal(
    row.bridgeMetadataSource,
    "FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata.rootWorkLoopFinishedWorkPreflight"
  );
  assert.equal(row.recordsAcceptedFinishedWorkMetadata, expected.ready);
  assert.equal(
    row.consumesAcceptedRustWorkLoopFinishedWorkPreflightMetadata,
    expected.ready
  );
  assert.equal(row.missingRustPreflightMetadataRejection, true);
  assert.equal(row.staleRustPreflightMetadataRejection, true);
  assert.equal(row.unsupportedChildrenRejection, true);
  assert.equal(row.publicRendererRootCreated, false);
  assert.equal(row.publicRootAvailable, false);
  assert.equal(row.publicCreateBehaviorAvailable, false);
  assert.equal(row.publicToJSONAvailable, false);
  assert.equal(row.publicToTreeAvailable, false);
  assert.equal(row.publicActAvailable, false);
  assert.equal(row.nativeAddonLoaded, false);
  assert.equal(row.nativeBridgeAvailable, false);
  assert.equal(row.nativeExecution, false);
  assert.equal(row.rustExecutionFromJs, false);
  assert.equal(row.reconcilerExecutionFromJs, false);
  assert.equal(row.hostOutputProducedFromJs, false);
  assert.equal(row.compatibilityClaimed, false);
}

function assertPrivateRootCreatePreflightGate(gate, entrypoint) {
  assert.equal(Object.isFrozen(gate), true, entrypoint);
  assert.equal(
    gate.id,
    "react-test-renderer-private-root-create-preflight-gate"
  );
  assert.equal(gate.status, privateRootCreatePreflightStatus);
  assert.equal(gate.entrypoint, entrypoint);
  assert.equal(gate.publicSurface, "create()");
  assert.equal(gate.deterministic, true);
  assert.equal(gate.diagnosticName, privateRootCreatePreflightDiagnosticName);
  assert.equal(gate.symbol, privateRootCreatePreflightSymbolDescription);
  assert.deepEqual(gate.acceptedRustApis, [
    "TestRendererRoot::describe_private_root_create_preflight_for_canary",
    "TestRendererRoot::create",
    "TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff",
    "render_host_root_for_lanes",
    "HostRootRenderPhaseRecord::finished_work",
    "TestRendererOptions::reconciler_options",
    "update_container",
    "ensure_root_is_scheduled"
  ]);
  assert.deepEqual(gate.acceptedRustFinishedWorkRecords, [
    "HostRootRenderPhaseRecord",
    "HostRootFinishedWorkPendingCommitRecordForCanary",
    "HostRootFinishedWorkCommitHandoffRecordForCanary"
  ]);
  assert.deepEqual(gate.acceptedRustTests, [
    "root_private_create_preflight_validates_create_canary_without_public_root",
    "root_private_create_preflight_fails_closed_for_unsupported_children",
    "root_private_create_preflight_fails_closed_for_stale_canary_metadata",
    "root_private_create_preflight_fails_closed_without_root_options",
    "root_private_create_preflight_fails_closed_without_work_loop_metadata",
    "root_private_create_preflight_fails_closed_for_stale_work_loop_metadata",
    "root_work_loop_complete_work_handoff_commits_host_component_tree_with_diagnostics",
    "root_commit_finished_work_handoff_records_identity_lanes_root_token_and_order",
    "root_commit_finished_work_handoff_rejects_missing_record_before_switching_current",
    "root_commit_finished_work_handoff_rejects_stale_record_after_current_switch"
  ]);
  assert.deepEqual(gate.acceptedInputShapes, [
    "HostComponentWithTextChild"
  ]);
  assert.equal(
    gate.workLoopFinishedWorkPreflightRowId,
    privateRootCreateWorkLoopFinishedWorkPreflightRowId
  );
  assert.equal(gate.workLoopFinishedWorkMetadataRequired, true);
  assert.equal(gate.requiredRootOptions, true);
  assert.equal(gate.validatesAcceptedRustRootCreateCanary, true);
  assert.equal(
    gate.validatesAcceptedRustWorkLoopFinishedWorkPreflight,
    true
  );
  assert.equal(gate.privateRustRootCreated, true);
  assert.equal(gate.rootWorkLoopFinishedWorkPreflightReady, true);
  assert.equal(gate.publicRendererRootCreated, false);
  assert.equal(gate.publicRootAvailable, false);
  assert.equal(gate.publicCreateBehaviorAvailable, false);
  assert.equal(gate.nativeAddonLoaded, false);
  assert.equal(gate.nativeBridgeAvailable, false);
  assert.equal(gate.nativeExecution, false);
  assert.equal(gate.rustExecutionFromJs, false);
  assert.equal(gate.compatibilityClaimed, false);
}

function assertPrivateCreateRouteAdmissionGate(gate, label) {
  assert.equal(Object.isFrozen(gate), true, label);
  const supportsCreateHostOutputHandoff =
    gate.hostOutputHandoffDiagnosticId !== undefined;
  assert.equal(gate.id, privateCreateRouteAdmissionRecordId, label);
  assert.equal(gate.status, privateCreateRouteAdmissionStatus, label);
  assert.equal(gate.publicSurface, "create()", label);
  assert.equal(gate.deterministic, true, label);
  assert.equal(
    gate.diagnosticName,
    privateCreateRouteAdmissionDiagnosticName,
    label
  );
  assert.equal(gate.acceptedRustCrate, "fast-react-test-renderer", label);
  assert.equal(
    gate.acceptedWorker,
    "worker-610-test-renderer-create-native-bridge-admission",
    label
  );
  const expectedAcceptedRustRecords = [
    "TestRendererRootScheduledUpdate",
    "TestRendererRootCreatePreflightDiagnostics",
    "TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics",
    "TestRendererPrivateCreateRouteAdmissionDiagnostics"
  ];
  if (supportsCreateHostOutputHandoff) {
    expectedAcceptedRustRecords.push(
      "TestRendererPrivateCreateNativeBridgeHostOutputHandoff"
    );
  }
  assert.deepEqual(gate.acceptedRustRecords, expectedAcceptedRustRecords);
  const expectedAcceptedRustApis = [
    "TestRendererRoot::create",
    "TestRendererRoot::describe_private_root_create_preflight_for_canary",
    "TestRendererRoot::describe_private_create_route_admission_for_canary",
    "TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff"
  ];
  if (supportsCreateHostOutputHandoff) {
    expectedAcceptedRustApis.push(
      "TestRendererRoot::render_and_commit_host_output_for_canary",
      "TestRendererRoot::describe_private_create_native_bridge_host_output_handoff_for_canary"
    );
  }
  assert.deepEqual(gate.acceptedRustApis, expectedAcceptedRustApis);
  const expectedAcceptedRustTests = [
    "root_private_create_route_admission_consumes_create_and_work_loop_evidence"
  ];
  if (supportsCreateHostOutputHandoff) {
    expectedAcceptedRustTests.push(
      "root_private_create_native_bridge_handoff_consumes_actual_host_output",
      "root_private_create_native_bridge_handoff_rejects_stale_admission"
    );
  }
  expectedAcceptedRustTests.push(
    "root_private_create_route_admission_rejects_missing_rust_admission_record",
    "root_private_create_route_admission_rejects_stale_rust_admission_record",
    "root_private_create_route_admission_rejects_missing_root_create_preflight"
  );
  assert.deepEqual(gate.acceptedRustTests, expectedAcceptedRustTests);
  if (supportsCreateHostOutputHandoff) {
    assert.equal(
      gate.hostOutputHandoffDiagnosticId,
      privateCreateNativeBridgeHostOutputHandoffDiagnosticId,
      label
    );
    assert.equal(
      gate.hostOutputHandoffStatus,
      privateCreateNativeBridgeHostOutputHandoffStatus,
      label
    );
  }
  assert.equal(gate.consumesJsFacadeCreateMetadata, true, label);
  assert.equal(
    gate.consumesAcceptedRustRootCreateExecutionEvidence,
    true,
    label
  );
  assert.equal(
    gate.consumesAcceptedRustRootCreatePreflightDiagnostics,
    true,
    label
  );
  assert.equal(
    gate.consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata,
    true,
    label
  );
  if (supportsCreateHostOutputHandoff) {
    assert.equal(
      gate.consumesAcceptedRustCreateHostOutputHandoff,
      true,
      label
    );
    assert.equal(gate.acceptedHostOutputShape, "SingleHostText", label);
    assert.equal(gate.hostOutputProducedByRust, true, label);
  }
  assert.equal(gate.missingRustAdmissionRecordRejection, true, label);
  assert.equal(gate.staleRustAdmissionRecordRejection, true, label);
  assert.equal(gate.publicRouteAvailable, false, label);
  assert.equal(gate.publicRendererRootCreated, false, label);
  assert.equal(gate.publicRootAvailable, false, label);
  assert.equal(gate.publicCreateBehaviorAvailable, false, label);
  assert.equal(gate.publicSerializationAvailable, false, label);
  assert.equal(gate.nativeAddonLoaded, false, label);
  assert.equal(gate.nativeBridgeAvailable, false, label);
  assert.equal(gate.nativeExecution, false, label);
  assert.equal(gate.rustExecutionFromJs, false, label);
  assert.equal(gate.reconcilerExecutionFromJs, false, label);
  assert.equal(gate.hostOutputProducedFromJs, false, label);
  assert.equal(gate.compatibilityClaimed, false, label);
}

function assertPrivateRootCreatePreflightConsumption(
  consumed,
  preflight,
  request,
  entrypoint
) {
  assert.equal(Object.isFrozen(consumed), true, entrypoint);
  assert.equal(
    consumed.kind,
    "FastReactTestRendererPrivateRootCreatePreflightConsumption"
  );
  assert.equal(
    consumed.diagnosticName,
    privateRootCreatePreflightDiagnosticName
  );
  assert.equal(consumed.status, privateRootCreatePreflightStatus);
  assert.equal(consumed.entrypoint, entrypoint);
  assert.equal(consumed.compatibilityTarget, compatibilityTarget);
  assert.equal(consumed.rootRequest, request);
  assert.equal(consumed.preflight, preflight);
  assert.equal(Object.isFrozen(consumed.sourceDiagnostic), true);
  assert.equal(
    consumed.consumesAcceptedRustRootCreatePreflightDiagnostics,
    true
  );
  assert.equal(
    consumed.consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata,
    true
  );
  assert.equal(consumed.privateRootCanaryBoundaryValidated, true);
  assert.equal(consumed.publicRendererRootCreated, false);
  assert.equal(consumed.publicRootAvailable, false);
  assert.equal(consumed.nativeAddonLoaded, false);
  assert.equal(consumed.nativeBridgeAvailable, false);
  assert.equal(consumed.nativeExecution, false);
  assert.equal(consumed.rustExecutionFromJs, false);
  assert.equal(consumed.compatibilityClaimed, false);
}

function assertPrivateCreateRouteAdmission(
  admission,
  preflight,
  request,
  entrypoint
) {
  assert.equal(Object.isFrozen(admission), true, entrypoint);
  assert.equal(
    admission.kind,
    "FastReactTestRendererPrivateCreateRouteAdmission"
  );
  assert.equal(admission.id, privateCreateRouteAdmissionRecordId);
  assert.equal(
    admission.diagnosticName,
    privateCreateRouteAdmissionDiagnosticName
  );
  assert.equal(admission.status, privateCreateRouteAdmissionStatus);
  assert.equal(admission.ready, true);
  assert.equal(admission.failureReason, null);
  assert.equal(admission.entrypoint, entrypoint);
  assert.equal(admission.compatibilityTarget, compatibilityTarget);
  assertPrivateCreateRouteAdmissionGate(admission.gate, entrypoint);
  assert.equal(admission.rootRequest, request);
  assert.equal(admission.rootHandle, request.rootHandle);
  assert.equal(admission.rootId, request.rootId);
  assert.equal(admission.rootSequence, request.rootSequence);
  assert.equal(admission.rootRequestId, request.requestId);
  assert.equal(admission.rootRequestSequence, request.requestSequence);
  assert.equal(admission.operation, "create");
  assert.equal(admission.publicSurface, "create()");
  assert.equal(
    admission.jsFacadeMetadataSource,
    "FastReactTestRendererPrivateRootRequestRecord"
  );
  assert.equal(
    admission.bridgeMetadataSource,
    "FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata.rootCreateRouteAdmission"
  );
  assert.equal(Object.isFrozen(admission.rustAdmissionMetadata), true);
  assert.equal(
    admission.rustAdmissionMetadata.metadataId,
    privateCreateRouteAdmissionMetadataId
  );
  assert.equal(
    admission.rustAdmissionMetadata.metadataStatus,
    privateCreateRouteAdmissionMetadataStatus
  );
  assert.equal(
    admission.rustAdmissionMetadata.recordId,
    privateCreateRouteAdmissionRecordId
  );
  assert.equal(
    admission.rustAdmissionMetadata.diagnosticName,
    privateCreateRouteAdmissionDiagnosticName
  );
  assert.equal(
    admission.rustAdmissionMetadata.status,
    privateCreateRouteAdmissionStatus
  );
  assert.equal(
    admission.rustAdmissionMetadata.acceptedWorker,
    "worker-610-test-renderer-create-native-bridge-admission"
  );
  assert.equal(
    admission.rustAdmissionMetadata.rootApi,
    "TestRendererRoot::create"
  );
  assert.equal(
    admission.rustAdmissionMetadata.preflightApi,
    "TestRendererRoot::describe_private_root_create_preflight_for_canary"
  );
  assert.equal(
    admission.rustAdmissionMetadata.workLoopRenderPhaseApi,
    "TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff"
  );
  assert.equal(
    admission.rustAdmissionMetadata.lifecycleRecord,
    "TestRendererRootScheduledUpdate"
  );
  assert.equal(
    admission.rustAdmissionMetadata.executionResultRecord,
    "TestRendererPrivateCreateRouteAdmissionDiagnostics"
  );
  assert.equal(
    admission.rustAdmissionMetadata.acceptedInputShape,
    "HostComponentWithTextChild"
  );
  assert.equal(admission.rootCreatePreflight, preflight);
  assert.equal(
    admission.workLoopFinishedWorkPreflight,
    preflight.workLoopFinishedWorkPreflight
  );
  assert.equal(Object.isFrozen(admission.rootCreateExecutionEvidence), true);
  assert.equal(admission.rootCreateExecutionEvidence.operation, "create");
  assert.equal(
    admission.rootCreateExecutionEvidence.requestId,
    request.requestId
  );
  assert.equal(
    admission.rootCreateExecutionEvidence.rootApi,
    "TestRendererRoot::create"
  );
  assert.equal(admission.rootCreateExecutionEvidence.updateKind, "Create");
  assert.equal(
    admission.rootCreateExecutionEvidence.rustOutcome,
    "Scheduled"
  );
  assert.equal(admission.rootCreateExecutionEvidence.scheduled, true);
  assert.equal(
    admission.rootCreateExecutionEvidence.rootCreatePreflight,
    preflight
  );
  assert.equal(admission.consumesJsFacadeCreateMetadata, true);
  assert.equal(
    admission.consumesAcceptedRustRootCreateExecutionEvidence,
    true
  );
  assert.equal(
    admission.consumesAcceptedRustRootCreatePreflightDiagnostics,
    true
  );
  assert.equal(
    admission
      .consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata,
    true
  );
  assert.equal(admission.missingRustAdmissionRecordRejection, true);
  assert.equal(admission.staleRustAdmissionRecordRejection, true);
  assert.equal(admission.publicRendererRootCreated, false);
  assert.equal(admission.publicRootAvailable, false);
  assert.equal(admission.publicCreateBehaviorAvailable, false);
  assert.equal(admission.publicSerializationAvailable, false);
  assert.equal(admission.nativeAddonLoaded, false);
  assert.equal(admission.nativeBridgeAvailable, false);
  assert.equal(admission.nativeExecution, false);
  assert.equal(admission.rustExecutionFromJs, false);
  assert.equal(admission.reconcilerExecutionFromJs, false);
  assert.equal(admission.hostOutputProducedFromJs, false);
  assert.equal(admission.compatibilityClaimed, false);
}

function assertPrivateCreateRouteAdmissionConsumption(
  consumed,
  admission,
  request,
  entrypoint
) {
  assert.equal(Object.isFrozen(consumed), true, entrypoint);
  assert.equal(
    consumed.kind,
    "FastReactTestRendererPrivateCreateRouteAdmissionConsumption"
  );
  assert.equal(consumed.id, privateCreateRouteAdmissionRecordId);
  assert.equal(
    consumed.diagnosticName,
    privateCreateRouteAdmissionDiagnosticName
  );
  assert.equal(consumed.status, privateCreateRouteAdmissionStatus);
  assert.equal(consumed.entrypoint, entrypoint);
  assert.equal(consumed.compatibilityTarget, compatibilityTarget);
  assert.equal(consumed.rootRequest, request);
  assert.equal(consumed.admission, admission);
  assert.equal(consumed.rootCreatePreflight, admission.rootCreatePreflight);
  assert.equal(Object.isFrozen(consumed.sourceDiagnostic), true);
  assert.equal(consumed.consumesJsFacadeCreateMetadata, true);
  assert.equal(
    consumed.consumesAcceptedRustRootCreateExecutionEvidence,
    true
  );
  assert.equal(
    consumed.consumesAcceptedRustRootCreatePreflightDiagnostics,
    true
  );
  assert.equal(
    consumed.consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata,
    true
  );
  assert.equal(consumed.publicRendererRootCreated, false);
  assert.equal(consumed.publicRootAvailable, false);
  assert.equal(consumed.publicCreateBehaviorAvailable, false);
  assert.equal(consumed.publicSerializationAvailable, false);
  assert.equal(consumed.nativeAddonLoaded, false);
  assert.equal(consumed.nativeBridgeAvailable, false);
  assert.equal(consumed.nativeExecution, false);
  assert.equal(consumed.rustExecutionFromJs, false);
  assert.equal(consumed.reconcilerExecutionFromJs, false);
  assert.equal(consumed.hostOutputProducedFromJs, false);
  assert.equal(consumed.compatibilityClaimed, false);
}

function assertPrivateCreateNativeBridgeHostOutputHandoff(handoff, request) {
  assert.equal(Object.isFrozen(handoff), true, request.entrypoint);
  assert.equal(
    handoff.kind,
    "FastReactTestRendererPrivateCreateNativeBridgeHostOutputHandoff"
  );
  assert.equal(
    handoff.id,
    privateCreateNativeBridgeHostOutputHandoffDiagnosticId
  );
  assert.equal(
    handoff.status,
    privateCreateNativeBridgeHostOutputHandoffStatus
  );
  assert.equal(handoff.entrypoint, request.entrypoint);
  assert.equal(handoff.compatibilityTarget, compatibilityTarget);
  assert.equal(handoff.request, request);
  assert.equal(
    handoff.createRouteAdmission.kind,
    "FastReactTestRendererPrivateCreateRouteAdmissionConsumption"
  );
  assert.equal(handoff.operation, "create");
  assert.equal(handoff.publicSurface, "create()");
  assert.equal(handoff.hostOutputUpdateKind, "Create");
  assert.equal(handoff.hostOutputShape, "SingleHostText");
  assert.equal(Object.isFrozen(handoff.hostOutput), true);
  assert.equal(handoff.hostOutput.containerChildCount, 1);
  assert.equal(handoff.hostOutput.instanceCount, 1);
  assert.equal(handoff.hostOutput.textCount, 1);
  assert.equal(handoff.hostOutput.realHostOutputAvailable, true);
  assert.equal(handoff.createRouteAdmissionAccepted, true);
  assert.equal(handoff.hostOutputHandoffAccepted, true);
  assert.equal(handoff.actualRustCreateHostOutputHandoff, true);
  assert.equal(handoff.hostOutputProducedByRust, true);
  assert.equal(handoff.publicCreateBehaviorAvailable, false);
  assert.equal(handoff.publicSerializationAvailable, false);
  assert.equal(handoff.publicTestInstanceAvailable, false);
  assert.equal(handoff.nativeAddonLoaded, false);
  assert.equal(handoff.nativeBridgeAvailable, false);
  assert.equal(handoff.nativeExecution, false);
  assert.equal(handoff.rustExecutionFromJs, false);
  assert.equal(handoff.hostOutputProducedFromJs, false);
  assert.equal(handoff.compatibilityClaimed, false);
}

function createRustRootCreatePreflightDiagnosticSource(preflight) {
  return {
    diagnosticName: privateRootCreatePreflightDiagnosticName,
    status: privateRootCreatePreflightStatus,
    operation: "create",
    createInputShape: preflight.createInputShape,
    rootOptionsMetadata: preflight.rootOptionsMetadata,
    canaryApiIdentity: preflight.canaryApiIdentity,
    workLoopFinishedWorkPreflight: preflight.workLoopFinishedWorkPreflight
  };
}

function createRustCreateRouteAdmissionDiagnosticSource(admission) {
  return {
    id: privateCreateRouteAdmissionRecordId,
    diagnosticName: privateCreateRouteAdmissionDiagnosticName,
    status: privateCreateRouteAdmissionStatus,
    operation: "create",
    publicSurface: "create()",
    jsFacadeMetadataSource: "FastReactTestRendererPrivateRootRequestRecord",
    rustAdmissionMetadata: admission.rustAdmissionMetadata,
    rootCreatePreflight: admission.rootCreatePreflight,
    workLoopFinishedWorkPreflight:
      admission.workLoopFinishedWorkPreflight,
    rootCreateExecutionEvidence: admission.rootCreateExecutionEvidence,
    consumesJsFacadeCreateMetadata: true,
    consumesAcceptedRustRootCreateExecutionEvidence: true,
    consumesAcceptedRustRootCreatePreflightDiagnostics: true,
    consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata: true
  };
}

function createRustCreateNativeBridgeHostOutputHandoffSource(
  request,
  admission
) {
  return {
    id: privateCreateNativeBridgeHostOutputHandoffDiagnosticId,
    status: privateCreateNativeBridgeHostOutputHandoffStatus,
    operation: "create",
    publicSurface: "create()",
    rootRequestId: request.requestId,
    rootRequestSequence: request.requestSequence,
    rootApi: "TestRendererRoot::create",
    updateKind: "Create",
    rustOutcome: "Scheduled",
    scheduled: true,
    createRouteAdmission:
      createRustCreateRouteAdmissionDiagnosticSource(admission),
    createRouteAdmissionRecordId: privateCreateRouteAdmissionRecordId,
    createRouteAdmissionStatus: privateCreateRouteAdmissionStatus,
    hostOutputUpdateKind: "Create",
    hostOutputShape: "SingleHostText",
    hostOutputSnapshotCurrent: true,
    hostOutput: {
      containerChildCount: 1,
      instanceCount: 1,
      textCount: 1,
      realHostOutputAvailable: true
    },
    serializationGateStatus:
      "ReadyForPrivateSerializationDiagnostics",
    createRouteAdmissionAccepted: true,
    hostOutputHandoffAccepted: true,
    actualRustCreateHostOutputHandoff: true,
    hostOutputProducedByRust: true,
    publicCreateBehaviorAvailable: false,
    publicSerializationAvailable: false,
    publicTestInstanceAvailable: false,
    nativeAddonLoaded: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: false,
    hostOutputProducedFromJs: false,
    compatibilityClaimed: false
  };
}

function createRustUpdateRouteRootWorkLoopDiagnosticSource(request) {
  return {
    diagnosticName: privateUpdateRouteRootWorkLoopDiagnosticName,
    status: privateUpdateRouteRootWorkLoopStatus,
    rootRequestId: request.requestId,
    rootRequestSequence: request.requestSequence,
    rootOperation: "update",
    updateKind: "Update",
    updateOutcome: request.rustOutcome,
    lifecycleStatusBefore: normalizeExpectedRustLifecycle(
      request.lifecycleStatusBefore
    ),
    lifecycleStatusAfter: normalizeExpectedRustLifecycle(
      request.lifecycleStatusAfter
    ),
    hostOutputUpdateKind: "Update",
    updateQueueMetadata: {
      record: "UpdateContainerResult",
      scheduleRecord: "RootScheduleUpdateRecord",
      scheduledUpdateRecord: "TestRendererRootScheduledUpdate",
      scheduledUpdateKind: "Update",
      laneSource: "update_container",
      queueMatchesRenderCurrentQueue: true,
      selectedLanesMatchRenderLanes: true,
      pendingLanesAfterEnqueueMatchRenderLanes: true
    },
    rootWorkLoopMetadata: {
      renderPhaseRecord: "HostRootRenderPhaseRecord",
      commitRecord: "HostRootCommitRecord",
      appliedUpdateCount: 1,
      skippedUpdateCount: 0,
      remainingLanesEmpty: true,
      commitCurrentMatchesRenderFinishedWork: true,
      commitPreviousCurrentMatchesRenderCurrent: true,
      commitLanesMatchRenderLanes: true,
      rootCurrentMatchesCommitCurrent: true
    },
    hostTextUpdateMetadata: {
      hostOutputUpdateRecord: "TestRendererUpdatedHostOutput",
      hostTextUpdateApplyRequired: true,
      textUpdateApplyRecorded: true,
      hostTextUpdateApplyCount: 1,
      hostComponentUpdateApplyCount: 1
    },
    publicRootUpdateAvailable: false,
    publicSerializationAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: false,
    compatibilityClaimed: false
  };
}

function createRustUpdateNativeBridgeAdmissionEvidence(request, overrides = {}) {
  return {
    rustLifecycleDiagnostic:
      overrides.rustLifecycleDiagnostic ??
      createRustLifecycleDiagnosticSource(request),
    updateRouteRootWorkLoopDiagnostic: {
      ...createRustUpdateRouteRootWorkLoopDiagnosticSource(request),
      ...(overrides.updateRouteRootWorkLoopDiagnostic ?? {})
    },
    hostOutputProduced:
      overrides.hostOutputProduced === undefined
        ? true
        : overrides.hostOutputProduced,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rustExecution: true,
    reconcilerExecution: true
  };
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

function createRustUnmountDeletionCommitHandoffSource(request, overrides = {}) {
  return {
    diagnosticId: privateUnmountDeletionCommitHandoffDiagnosticId,
    status: privateUnmountDeletionCommitHandoffStatus,
    rootRequestId: request.requestId,
    rootId: request.rootId,
    lifecycle: normalizeExpectedRustLifecycle(request.lifecycleStatusAfter),
    scheduledUpdateKind: "Unmount",
    scheduledElementIsNone: true,
    commitCurrentIsStoreCurrent: true,
    renderCurrentMatchesCommitPreviousCurrent: true,
    renderFinishedWorkMatchesCommitCurrent: true,
    deletionListCount: 1,
    deletedRootCount: 1,
    hostNodeCleanupCount: 2,
    cleanupRecordsMatchDeletionCommit: true,
    cleanupOrderRecordCount: 2,
    publicUnmountCompatibilityClaimed: false,
    publicHostTeardownCompatibilityClaimed: false,
    actFlushingClaimed: false,
    hostChildDetachmentBlockers: {
      detachedInstance: true,
      detachedInstanceChildCount: 0,
      hostNodeCleanupInvalidatedCount: 2,
      hostNodeCleanupAlreadyInactiveCount: 0,
      hostNodeCleanupMissingHostNodeCount: 0,
      hostNodeCleanupMissingStateNodeCount: 0,
      broadHostChildDetachmentBlocked: true,
      publicHostTeardownCompatibilityClaimed: false,
      publicUnmountCompatibilityClaimed: false,
      actFlushingClaimed: false
    },
    ...overrides
  };
}

function createRustUnmountNativeBridgeCleanupHandoffSource(
  request,
  deletionCommitHandoff,
  overrides = {}
) {
  return {
    diagnostic_id: privateUnmountNativeBridgeCleanupHandoffDiagnosticId,
    status: privateUnmountNativeBridgeCleanupHandoffStatus,
    root_request_id: request.requestId,
    root: request.rootId,
    route_outcome: rootUpdateOutcomeScheduled,
    route_dependency_id: "react-test-renderer-unmount-route-private-diagnostic",
    deletion_commit_handoff_id:
      privateUnmountDeletionCommitHandoffDiagnosticId,
    admission_diagnostic_id:
      privateUnmountNativeBridgeAdmissionDiagnosticId,
    lifecycle: normalizeExpectedRustLifecycle(request.lifecycleStatusAfter),
    scheduled_update_kind: "Unmount",
    scheduled_element_is_none: true,
    previous_root_child_count: 1,
    current_root_child_count: 0,
    detached_instance: true,
    detached_instance_child_count: 0,
    host_node_cleanup_count:
      deletionCommitHandoff.hostNodeCleanupCount ??
      deletionCommitHandoff.host_node_cleanup_count,
    cleanup_order_record_count:
      deletionCommitHandoff.cleanupOrderRecordCount ??
      deletionCommitHandoff.cleanup_order_record_count,
    minimal_tree_cleanup_handoff: true,
    rust_unmount_cleanup_handoff_executed: true,
    host_output_produced: true,
    public_unmount_compatibility_claimed: false,
    public_host_teardown_compatibility_claimed: false,
    act_flushing_claimed: false,
    native_bridge_available: false,
    native_execution: false,
    deletion_commit_handoff: deletionCommitHandoff,
    ...overrides
  };
}

function createRustUnmountNativeBridgeAdmissionEvidence(
  request,
  overrides = {}
) {
  const handoffOverrides = overrides.deletionCommitHandoff ?? {};
  const blockerOverrides =
    handoffOverrides.hostChildDetachmentBlockers ?? {};
  const hostNodeCleanupCount =
    handoffOverrides.hostNodeCleanupCount ?? 2;
  const cleanupOrderRecordCount =
    handoffOverrides.cleanupOrderRecordCount ?? hostNodeCleanupCount;
  const blockers = {
    detachedInstance: true,
    detachedInstanceChildCount: 0,
    hostNodeCleanupInvalidatedCount: hostNodeCleanupCount,
    hostNodeCleanupAlreadyInactiveCount: 0,
    hostNodeCleanupMissingHostNodeCount: 0,
    hostNodeCleanupMissingStateNodeCount: 0,
    broadHostChildDetachmentBlocked: true,
    publicHostTeardownCompatibilityClaimed: false,
    publicUnmountCompatibilityClaimed: false,
    actFlushingClaimed: false,
    ...blockerOverrides
  };
  const deletionCommitHandoff = createRustUnmountDeletionCommitHandoffSource(
    request,
    {
      ...handoffOverrides,
      hostNodeCleanupCount,
      cleanupOrderRecordCount,
      hostChildDetachmentBlockers: blockers
    }
  );
  const cleanupHandoff =
    overrides.cleanupHandoff ??
    createRustUnmountNativeBridgeCleanupHandoffSource(
      request,
      deletionCommitHandoff,
      overrides.nativeBridgeCleanupHandoff ?? {}
    );

  return {
    rustLifecycleDiagnostic:
      overrides.rustLifecycleDiagnostic ??
      createRustLifecycleDiagnosticSource(request),
    cleanupHandoff
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
  const toJSONUpdateUnmountRowsAvailable =
    metadata.privateJson.acceptedHostOutputUpdateKinds.includes("Unmount");
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
  if (metadata.rootWorkLoopFinishedWorkPreflight !== undefined) {
    expectedAcceptedRustWorkers.push(
      "worker-534-root-work-loop-finished-work-commit-handoff"
    );
  }
  if (metadata.errorBoundaryDiagnostics !== undefined) {
    expectedAcceptedRustWorkers.push(
      "worker-465-test-renderer-error-boundary-diagnostics",
      "worker-530-test-renderer-error-boundary-update-refresh"
    );
  }
  if (metadata.rootCreatePreflight !== undefined) {
    expectedAcceptedRustWorkers.push(
      "worker-539-test-renderer-live-rust-root-create-preflight",
      "worker-573-test-renderer-private-root-work-loop-preflight"
    );
  }
  if (metadata.hostOutput.updateRouteRootWorkLoopGate !== undefined) {
    expectedAcceptedRustWorkers.push(
      "worker-574-test-renderer-update-via-root-work-loop"
    );
  }
  if (metadata.unmountDeletionCommitHandoff !== undefined) {
    expectedAcceptedRustWorkers.push(
      "worker-575-test-renderer-unmount-deletion-commit-link"
    );
  }
  if (metadata.rootCreateRouteAdmission !== undefined) {
    expectedAcceptedRustWorkers.push(
      "worker-610-test-renderer-create-native-bridge-admission"
    );
    if (
      metadata.acceptedRustWorkers.includes(
        "worker-636-test-renderer-create-native-execution"
      )
    ) {
      expectedAcceptedRustWorkers.push(
        "worker-636-test-renderer-create-native-execution"
      );
    }
  }
  if (metadata.unmountNativeBridgeAdmission !== undefined) {
    expectedAcceptedRustWorkers.push(
      "worker-612-test-renderer-unmount-native-bridge-admission",
      "worker-638-test-renderer-unmount-native-execution"
    );
  }
  if (metadata.hostOutput.updateNativeBridgeAdmissionGate !== undefined) {
    expectedAcceptedRustWorkers.push(
      "worker-637-test-renderer-update-native-execution"
    );
  }
  assert.deepEqual(metadata.acceptedRustWorkers, expectedAcceptedRustWorkers);
  const expectedAcceptedJsBridgeWorkers = [
    "worker-304-test-renderer-js-private-root-request-bridge",
    "worker-306-test-renderer-testinstance-private-wrapper-skeleton",
    "worker-307-test-renderer-update-unmount-private-js-bridge",
    "worker-423-test-renderer-native-root-execution-bridge",
    "worker-426-test-renderer-testinstance-bridge-query"
  ];
  if (metadata.rootCreatePreflight !== undefined) {
    expectedAcceptedJsBridgeWorkers.push(
      "worker-539-test-renderer-live-rust-root-create-preflight",
      "worker-573-test-renderer-private-root-work-loop-preflight"
    );
  }
  if (metadata.rootCreateRouteAdmission !== undefined) {
    expectedAcceptedJsBridgeWorkers.push(
      "worker-610-test-renderer-create-native-bridge-admission"
    );
    if (
      metadata.acceptedJsBridgeWorkers.includes(
        "worker-636-test-renderer-create-native-execution"
      )
    ) {
      expectedAcceptedJsBridgeWorkers.push(
        "worker-636-test-renderer-create-native-execution"
      );
    }
  }
  if (metadata.unmountNativeBridgeAdmission !== undefined) {
    expectedAcceptedJsBridgeWorkers.push(
      "worker-612-test-renderer-unmount-native-bridge-admission",
      "worker-638-test-renderer-unmount-native-execution"
    );
  }
  if (metadata.hostOutput.updateNativeBridgeAdmissionGate !== undefined) {
    expectedAcceptedJsBridgeWorkers.push(
      "worker-637-test-renderer-update-native-execution"
    );
  }
  assert.deepEqual(
    metadata.acceptedJsBridgeWorkers,
    expectedAcceptedJsBridgeWorkers
  );

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
  if (metadata.hostOutput.updateRouteRootWorkLoopGate !== undefined) {
    assert.equal(
      metadata.hostOutput.updateRouteDiagnosticApi,
      "TestRendererRoot::describe_private_update_route_via_root_work_loop_for_canary",
      label
    );
    assertPrivateUpdateRouteRootWorkLoopGate(
      metadata.hostOutput.updateRouteRootWorkLoopGate
    );
  }
  if (metadata.hostOutput.updateNativeBridgeAdmissionApi !== undefined) {
    assert.equal(
      metadata.hostOutput.updateNativeBridgeAdmissionApi,
      "TestRendererRoot::describe_private_update_native_bridge_admission_for_canary",
      label
    );
    assert.equal(
      metadata.hostOutput.updateNativeBridgeAdmissionDiagnosticId,
      privateUpdateNativeBridgeAdmissionDiagnosticId,
      label
    );
    assert.equal(
      metadata.hostOutput.updateNativeBridgeAdmissionStatus,
      privateUpdateNativeBridgeAdmissionStatus,
      label
    );
    assertPrivateUpdateNativeBridgeAdmissionGate(
      metadata.hostOutput.updateNativeBridgeAdmissionGate,
      label
    );
    assert.equal(
      metadata.hostOutput.updateNativeBridgeAdmission,
      "TestRendererUpdateNativeBridgeAdmission",
      label
    );
  }
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
  if (metadata.hostOutput.unmountDeletionCommitHandoffApi !== undefined) {
    assert.equal(
      metadata.hostOutput.unmountDeletionCommitHandoffApi,
      "TestRendererRoot::describe_private_unmount_deletion_commit_handoff_for_canary",
      label
    );
    assert.equal(
      metadata.hostOutput.unmountDeletionCommitHandoffDiagnosticId,
      privateUnmountDeletionCommitHandoffDiagnosticId,
      label
    );
    assert.equal(
      metadata.hostOutput.unmountDeletionCommitHandoffStatus,
      privateUnmountDeletionCommitHandoffStatus,
      label
    );
    assertPrivateUnmountDeletionCommitHandoffGate(
      metadata.hostOutput.unmountDeletionCommitHandoffGate,
      label
    );
    assertPrivateUnmountHostChildDetachmentBlockers(
      metadata.hostOutput.hostChildDetachmentBlockers,
      label
    );
    assert.equal(
      metadata.hostOutput.hostNodeCleanupReport,
      "TestRendererHostNodeCleanupReport",
      label
    );
    assert.equal(
      metadata.hostOutput.unmountDeletionCommitHandoffDiagnostics,
      "TestRendererUnmountDeletionCommitHandoffDiagnostics",
      label
    );
  }
  if (metadata.hostOutput.unmountNativeBridgeAdmissionApi !== undefined) {
    assert.equal(
      metadata.hostOutput.unmountNativeBridgeAdmissionApi,
      "TestRendererRoot::describe_private_unmount_native_bridge_admission_for_canary",
      label
    );
    assert.equal(
      metadata.hostOutput.unmountNativeBridgeAdmissionDiagnosticId,
      privateUnmountNativeBridgeAdmissionDiagnosticId,
      label
    );
    assert.equal(
      metadata.hostOutput.unmountNativeBridgeAdmissionStatus,
      privateUnmountNativeBridgeAdmissionStatus,
      label
    );
    assertPrivateUnmountNativeBridgeAdmissionGate(
      metadata.hostOutput.unmountNativeBridgeAdmissionGate,
      label
    );
    assert.equal(
      metadata.hostOutput.unmountNativeBridgeAdmission,
      "TestRendererUnmountNativeBridgeAdmission",
      label
    );
    assert.equal(
      metadata.hostOutput.unmountNativeBridgeCleanupHandoffApi,
      "TestRendererRoot::execute_private_unmount_native_bridge_cleanup_handoff_for_canary",
      label
    );
    assert.equal(
      metadata.hostOutput.unmountNativeBridgeCleanupHandoffDiagnosticId,
      privateUnmountNativeBridgeCleanupHandoffDiagnosticId,
      label
    );
    assert.equal(
      metadata.hostOutput.unmountNativeBridgeCleanupHandoffStatus,
      privateUnmountNativeBridgeCleanupHandoffStatus,
      label
    );
    assertPrivateUnmountNativeBridgeCleanupHandoffGate(
      metadata.hostOutput.unmountNativeBridgeCleanupHandoffGate,
      label
    );
    assert.equal(
      metadata.hostOutput.unmountNativeBridgeCleanupHandoff,
      "TestRendererUnmountNativeBridgeCleanupHandoff",
      label
    );
  }

  if (metadata.rootWorkLoopFinishedWorkPreflight !== undefined) {
    const rootWorkLoopFinishedWorkPreflight =
      metadata.rootWorkLoopFinishedWorkPreflight;
    assert.equal(
      Object.isFrozen(rootWorkLoopFinishedWorkPreflight),
      true,
      label
    );
    assert.equal(
      rootWorkLoopFinishedWorkPreflight.metadataId,
      privateRootWorkLoopFinishedWorkPreflightMetadataId,
      label
    );
    assert.equal(
      rootWorkLoopFinishedWorkPreflight.metadataStatus,
      privateRootWorkLoopFinishedWorkPreflightMetadataStatus,
      label
    );
    assert.equal(
      rootWorkLoopFinishedWorkPreflight.acceptedWorker,
      "worker-534-root-work-loop-finished-work-commit-handoff",
      label
    );
    assert.equal(
      rootWorkLoopFinishedWorkPreflight.acceptedRustModule,
      "fast-react-reconciler::root_work_loop",
      label
    );
    assert.equal(
      rootWorkLoopFinishedWorkPreflight.renderPhaseApi,
      "TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff",
      label
    );
    assert.equal(
      rootWorkLoopFinishedWorkPreflight.renderPhaseRecord,
      "HostRootRenderPhaseRecord",
      label
    );
    assert.equal(
      rootWorkLoopFinishedWorkPreflight.finishedWorkRecord,
      "HostRootRenderPhaseRecord::finished_work",
      label
    );
    assert.equal(
      rootWorkLoopFinishedWorkPreflight.pendingFinishedWorkRecord,
      "HostRootFinishedWorkPendingCommitRecordForCanary",
      label
    );
    assert.equal(
      rootWorkLoopFinishedWorkPreflight.commitHandoffRecord,
      "HostRootFinishedWorkCommitHandoffRecordForCanary",
      label
    );
    assert.deepEqual(rootWorkLoopFinishedWorkPreflight.acceptedFiberShape, [
      "HostRoot",
      "HostComponent",
      "HostText"
    ]);
    assert.equal(
      rootWorkLoopFinishedWorkPreflight.acceptedInputShape,
      "HostComponentWithTextChild",
      label
    );
    assert.equal(
      rootWorkLoopFinishedWorkPreflight.missingMetadataRejection,
      true,
      label
    );
    assert.equal(
      rootWorkLoopFinishedWorkPreflight.staleMetadataRejection,
      true,
      label
    );
    assert.equal(
      rootWorkLoopFinishedWorkPreflight.unsupportedChildrenRejection,
      true,
      label
    );
    assert.equal(
      rootWorkLoopFinishedWorkPreflight.publicCreateBehaviorAvailable,
      false,
      label
    );
    assert.equal(
      rootWorkLoopFinishedWorkPreflight.hostMutationExecutionBlocked,
      true,
      label
    );
    assert.equal(
      rootWorkLoopFinishedWorkPreflight.effectsRefsAndHydrationBlocked,
      true,
      label
    );
    assert.equal(
      rootWorkLoopFinishedWorkPreflight.compatibilityClaimed,
      false,
      label
    );
  }

  if (metadata.rootCreatePreflight !== undefined) {
    const rootCreatePreflight = metadata.rootCreatePreflight;
    assert.equal(Object.isFrozen(rootCreatePreflight), true, label);
    assert.equal(
      rootCreatePreflight.diagnosticName,
      privateRootCreatePreflightDiagnosticName,
      label
    );
    assert.equal(
      rootCreatePreflight.status,
      privateRootCreatePreflightStatus,
      label
    );
    assertPrivateRootCreatePreflightGate(
      rootCreatePreflight.gate,
      rootCreatePreflight.gate.entrypoint
    );
    assert.equal(
      rootCreatePreflight.bridgeMetadataSource,
      "FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata",
      label
    );
    assert.deepEqual(
      rootCreatePreflight.acceptedRustApis,
      rootCreatePreflight.gate.acceptedRustApis
    );
    assert.deepEqual(
      rootCreatePreflight.acceptedRustTests,
      rootCreatePreflight.gate.acceptedRustTests
    );
    assert.deepEqual(
      rootCreatePreflight.acceptedRustFinishedWorkRecords,
      rootCreatePreflight.gate.acceptedRustFinishedWorkRecords
    );
    assert.deepEqual(rootCreatePreflight.acceptedInputShapes, [
      "HostComponentWithTextChild"
    ]);
    assert.equal(
      rootCreatePreflight.workLoopFinishedWorkPreflightRowId,
      privateRootCreateWorkLoopFinishedWorkPreflightRowId,
      label
    );
    assert.equal(
      rootCreatePreflight.workLoopFinishedWorkPreflightStatus,
      privateRootCreateWorkLoopFinishedWorkPreflightStatus,
      label
    );
    assert.equal(
      rootCreatePreflight.workLoopFinishedWorkMetadataRequired,
      true,
      label
    );
    assert.equal(
      rootCreatePreflight.validatesAcceptedRustWorkLoopFinishedWorkPreflight,
      true,
      label
    );
    assert.equal(rootCreatePreflight.requiredRootOptions, true, label);
    assert.equal(
      rootCreatePreflight.rootOptionsMetadataAvailable,
      true,
      label
    );
    assert.equal(rootCreatePreflight.staleCanaryMetadataRejection, true);
    assert.equal(
      rootCreatePreflight.staleWorkLoopFinishedWorkMetadataRejection,
      true
    );
    assert.equal(
      rootCreatePreflight.missingWorkLoopFinishedWorkMetadataRejection,
      true
    );
    assert.equal(rootCreatePreflight.unsupportedChildrenRejection, true);
    assert.equal(rootCreatePreflight.missingRootOptionsRejection, true);
    assert.equal(rootCreatePreflight.publicRendererRootCreated, false);
    assert.equal(rootCreatePreflight.publicRootAvailable, false);
    assert.equal(rootCreatePreflight.nativeAddonLoaded, false);
    assert.equal(rootCreatePreflight.nativeBridgeAvailable, false);
    assert.equal(rootCreatePreflight.nativeExecution, false);
    assert.equal(rootCreatePreflight.rustExecutionFromJs, false);
    assert.equal(rootCreatePreflight.compatibilityClaimed, false);
  }

  if (metadata.rootCreateRouteAdmission !== undefined) {
    const admission = metadata.rootCreateRouteAdmission;
    assert.equal(Object.isFrozen(admission), true, label);
    assert.equal(admission.metadataId, privateCreateRouteAdmissionMetadataId);
    assert.equal(
      admission.metadataStatus,
      privateCreateRouteAdmissionMetadataStatus
    );
    assert.equal(
      admission.diagnosticName,
      privateCreateRouteAdmissionDiagnosticName
    );
    assert.equal(admission.status, privateCreateRouteAdmissionStatus);
    assert.equal(admission.recordId, privateCreateRouteAdmissionRecordId);
    assertPrivateCreateRouteAdmissionGate(admission.gate, label);
    assert.equal(
      admission.bridgeMetadataSource,
      "FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata.rootCreateRouteAdmission"
    );
    assert.equal(
      admission.acceptedWorker,
      "worker-610-test-renderer-create-native-bridge-admission"
    );
    assert.equal(admission.acceptedRustCrate, "fast-react-test-renderer");
    assert.deepEqual(
      admission.acceptedRustApis,
      admission.gate.acceptedRustApis
    );
    assert.deepEqual(
      admission.acceptedRustTests,
      admission.gate.acceptedRustTests
    );
    assert.equal(admission.rootApi, "TestRendererRoot::create");
    assert.equal(
      admission.preflightApi,
      "TestRendererRoot::describe_private_root_create_preflight_for_canary"
    );
    assert.equal(
      admission.workLoopRenderPhaseApi,
      "TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff"
    );
    assert.equal(
      admission.lifecycleRecord,
      "TestRendererRootScheduledUpdate"
    );
    assert.equal(
      admission.executionResultRecord,
      "TestRendererPrivateCreateRouteAdmissionDiagnostics"
    );
    if (admission.hostOutputHandoffRecord !== undefined) {
      assert.equal(
        admission.hostOutputHandoffRecord,
        "TestRendererPrivateCreateNativeBridgeHostOutputHandoff"
      );
      assert.equal(
        admission.hostOutputHandoffDiagnosticId,
        privateCreateNativeBridgeHostOutputHandoffDiagnosticId
      );
      assert.equal(
        admission.hostOutputHandoffStatus,
        privateCreateNativeBridgeHostOutputHandoffStatus
      );
    }
    assert.equal(admission.acceptedInputShape, "HostComponentWithTextChild");
    assert.equal(admission.consumesJsFacadeCreateMetadata, true);
    assert.equal(
      admission.consumesAcceptedRustRootCreateExecutionEvidence,
      true
    );
    assert.equal(
      admission.consumesAcceptedRustRootCreatePreflightDiagnostics,
      true
    );
    assert.equal(
      admission
        .consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata,
      true
    );
    if (admission.hostOutputHandoffRecord !== undefined) {
      assert.equal(
        admission.consumesAcceptedRustCreateHostOutputHandoff,
        true
      );
      assert.equal(admission.acceptedHostOutputShape, "SingleHostText");
      assert.equal(admission.hostOutputProducedByRust, true);
    }
    assert.equal(admission.missingRustAdmissionRecordRejection, true);
    assert.equal(admission.staleRustAdmissionRecordRejection, true);
    assert.equal(admission.publicRendererRootCreated, false);
    assert.equal(admission.publicRootAvailable, false);
    assert.equal(admission.publicCreateBehaviorAvailable, false);
    assert.equal(admission.publicSerializationAvailable, false);
    assert.equal(admission.nativeAddonLoaded, false);
    assert.equal(admission.nativeBridgeAvailable, false);
    assert.equal(admission.nativeExecution, false);
    assert.equal(admission.rustExecutionFromJs, false);
    assert.equal(admission.reconcilerExecutionFromJs, false);
    assert.equal(admission.hostOutputProducedFromJs, false);
    assert.equal(admission.compatibilityClaimed, false);
  }

  if (metadata.unmountDeletionCommitHandoff !== undefined) {
    assertPrivateUnmountDeletionCommitHandoffGate(
      metadata.unmountDeletionCommitHandoff,
      label
    );
  }
  if (metadata.unmountNativeBridgeAdmission !== undefined) {
    assertPrivateUnmountNativeBridgeAdmissionGate(
      metadata.unmountNativeBridgeAdmission,
      label
    );
    assertPrivateUnmountNativeBridgeCleanupHandoffGate(
      metadata.unmountNativeBridgeCleanupHandoff,
      label
    );
  }

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
  if (toJSONUpdateUnmountRowsAvailable) {
    assert.equal(
      metadata.privateJson.updateHostOutputRowApi,
      "TestRendererRoot::describe_private_to_json_host_output_update_row_for_canary",
      label
    );
    assert.equal(
      metadata.privateJson.unmountHostOutputRowApi,
      "TestRendererRoot::describe_private_to_json_host_output_unmount_row_for_canary",
      label
    );
    assert.equal(
      metadata.privateJson.updateHostOutputRowId,
      privateToJSONUpdateHostOutputRowId,
      label
    );
    if (label === cjsDevelopmentEntrypoint) {
      assert.equal(
        metadata.privateJson.nestedUpdateHostOutputRowId,
        privateToJSONNestedUpdateHostOutputRowId,
        label
      );
      assert.equal(
        metadata.privateJson.siblingTextHostOutputRowId,
        privateToJSONSiblingTextHostOutputRowId,
        label
      );
      assert.deepEqual(
        metadata.privateJson.updateHostOutputRowIds,
        privateToJSONUpdateHostOutputRowIds,
        label
      );
      assert.deepEqual(metadata.privateJson.acceptedHostOutputRowShapes, [
        "EmptyRoot",
        "SingleHostText",
        "NestedHostText",
        "SiblingText"
      ]);
      assert.equal(
        metadata.privateJson.mismatchedUpdateShapeRejection,
        true,
        label
      );
    }
    assert.equal(
      metadata.privateJson.unmountHostOutputRowId,
      privateToJSONUnmountHostOutputRowId,
      label
    );
    assert.deepEqual(
      metadata.privateJson.updateUnmountDependencyMetadata
        .acceptedPrivateDiagnosticDependencyIds,
      privateToJSONUpdateUnmountDependencyIds
    );
    assert.equal(
      metadata.privateJson.mismatchedUpdateUnmountRecordRejection,
      true,
      label
    );
  }
  assert.deepEqual(
    metadata.privateJson.acceptedHostOutputUpdateKinds,
    toJSONUpdateUnmountRowsAvailable
      ? ["Create", "Update", "Unmount"]
      : ["Create", "Update"]
  );
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
  if (metadata.rootCreatePreflightApi !== undefined) {
    assert.equal(expected.operation, "create");
    assert.equal(
      metadata.rootCreatePreflightApi,
      "TestRendererRoot::describe_private_root_create_preflight_for_canary"
    );
  }
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
  const actualUpdateOperationHasRootWorkLoopMetadata =
    expected.operation === "update" &&
    metadata.acceptedWorkers.includes(
      "worker-574-test-renderer-update-via-root-work-loop"
    );
  if (actualUpdateOperationHasRootWorkLoopMetadata) {
    expectedWorkersByOperation.update.push(
      "worker-574-test-renderer-update-via-root-work-loop"
    );
    expectedTestsByOperation.update.splice(
      3,
      0,
      "root_private_update_route_consumes_root_work_loop_update_queue_and_text_update_metadata",
      "root_private_update_route_rejects_stale_root_update_output",
      "root_private_update_route_rejects_unmounted_root",
      "root_private_update_route_rejects_incompatible_finished_work_record"
    );
  }
  if (
    expected.operation === "create" &&
    metadata.acceptedWorkers.includes(
      "worker-636-test-renderer-create-native-execution"
    )
  ) {
    expectedWorkersByOperation.create.push(
      "worker-636-test-renderer-create-native-execution"
    );
    expectedTestsByOperation.create.push(
      "root_private_create_native_bridge_handoff_consumes_actual_host_output"
    );
  }
  if (
    expected.operation === "update" &&
    metadata.nativeBridgeAdmissionApi !== undefined
  ) {
    assert.equal(
      metadata.hostOutputPropsCanaryApi,
      "TestRendererRoot::update_host_component_with_props_and_text_for_canary"
    );
    assert.equal(
      metadata.nativeBridgeAdmissionApi,
      "TestRendererRoot::describe_private_update_native_bridge_admission_for_canary"
    );
    assert.equal(
      metadata.nativeBridgeAdmissionDiagnosticId,
      privateUpdateNativeBridgeAdmissionDiagnosticId
    );
    assert.equal(
      metadata.nativeBridgeAdmissionStatus,
      privateUpdateNativeBridgeAdmissionStatus
    );
    assertPrivateUpdateNativeBridgeAdmissionGate(
      metadata.nativeBridgeAdmission,
      expected.entrypoint
    );
    expectedWorkersByOperation.update.push(
      "worker-637-test-renderer-update-native-execution"
    );
    expectedTestsByOperation.update.splice(
      expectedTestsByOperation.update.length - 1,
      0,
      "root_private_update_native_bridge_admission_consumes_actual_update_host_output_handoff",
      "root_private_update_native_bridge_admission_rejects_missing_handoff",
      "root_private_update_native_bridge_admission_rejects_stale_route_outcome"
    );
  }
  if (
    expected.operation === "unmount" &&
    metadata.deletionCommitHandoffApi !== undefined
  ) {
    expectedTestsByOperation.unmount = [
      "root_unmount_enqueues_sync_null_update_before_wrapper_invalidation",
      "root_unmount_commit_handoff_exposes_visible_callback_snapshot",
      "root_host_output_canary_unmounts_committed_output_with_deletion_cleanup_diagnostics",
      "root_unmount_is_idempotent"
    ];
    assert.equal(
      metadata.deletionCommitHandoffApi,
      "TestRendererRoot::describe_private_unmount_deletion_commit_handoff_for_canary"
    );
    assert.equal(
      metadata.deletionCommitHandoffDiagnosticId,
      privateUnmountDeletionCommitHandoffDiagnosticId
    );
    assert.equal(
      metadata.deletionCommitHandoffStatus,
      privateUnmountDeletionCommitHandoffStatus
    );
    assertPrivateUnmountHostChildDetachmentBlockers(
      metadata.hostChildDetachmentBlockers,
      expected.entrypoint
    );
    assert.equal(metadata.staleRootRecordRejection, true);
    assert.equal(metadata.alreadyUnmountedRootRecordRejection, true);
    assert.equal(metadata.publicHostTeardownCompatibilityClaimed, false);
    assert.equal(metadata.actFlushingClaimed, false);
    expectedWorkersByOperation.unmount.push(
      "worker-575-test-renderer-unmount-deletion-commit-link"
    );
    expectedTestsByOperation.unmount.push(
      "root_private_unmount_route_rejects_stale_deletion_commit_handoff",
      "root_host_output_unmount_canary_rejects_already_unmounted_root_record"
    );
  }
  if (
    expected.operation === "unmount" &&
    metadata.nativeBridgeAdmissionApi !== undefined
  ) {
    assert.equal(
      metadata.nativeBridgeAdmissionApi,
      "TestRendererRoot::describe_private_unmount_native_bridge_admission_for_canary"
    );
    assert.equal(
      metadata.nativeBridgeAdmissionDiagnosticId,
      privateUnmountNativeBridgeAdmissionDiagnosticId
    );
    assert.equal(
      metadata.nativeBridgeAdmissionStatus,
      privateUnmountNativeBridgeAdmissionStatus
    );
    assert.equal(
      metadata.nativeBridgeCleanupHandoffApi,
      "TestRendererRoot::execute_private_unmount_native_bridge_cleanup_handoff_for_canary"
    );
    assert.equal(
      metadata.nativeBridgeCleanupHandoffDiagnosticId,
      privateUnmountNativeBridgeCleanupHandoffDiagnosticId
    );
    assert.equal(
      metadata.nativeBridgeCleanupHandoffStatus,
      privateUnmountNativeBridgeCleanupHandoffStatus
    );
    expectedWorkersByOperation.unmount.push(
      "worker-612-test-renderer-unmount-native-bridge-admission",
      "worker-638-test-renderer-unmount-native-execution"
    );
    expectedTestsByOperation.unmount.push(
      "root_private_unmount_native_bridge_admission_rejects_stale_handoff",
      "root_private_unmount_native_bridge_admission_rejects_missing_cleanup_blockers",
      "root_private_unmount_native_bridge_admission_rejects_already_unmounted_root",
      "root_private_unmount_native_bridge_admission_executes_minimal_cleanup_handoff"
    );
  }
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
  assert.equal(error.createPrivateRoute, gate.createPrivateRoute);
  assert.equal(error.updatePrivateRoute, gate.updatePrivateRoute);
  assert.equal(error.unmountPrivateRoute, gate.unmountPrivateRoute);
  assert.equal(Object.isFrozen(gate.privateRoutes), true);
  const expectedRoutes =
    gate.createPrivateRoute === undefined
      ? expectedPrivateRoutes.slice(1)
      : expectedPrivateRoutes;
  assert.deepEqual(
    gate.privateRoutes.map((privateRoute) => privateRoute.id),
    expectedRoutes.map((privateRoute) => privateRoute.id)
  );
  if (gate.createPrivateRoute !== undefined) {
    assert.equal(gate.privateRoutes[0], gate.createPrivateRoute);
    assertPrivateRoute(gate.createPrivateRoute, expectedPrivateRoutes[0]);
    assertPrivateCreateRouteAdmissionGate(
      gate.privateCreateRouteAdmissionGate,
      entrypoint
    );
    assert.equal(gate.privateCreateRouteAdmissionAvailable, true);
  }
  const routeOffset = gate.createPrivateRoute === undefined ? 0 : 1;
  assert.equal(gate.privateRoutes[routeOffset], gate.updatePrivateRoute);
  assert.equal(gate.privateRoutes[routeOffset + 1], gate.unmountPrivateRoute);
  assertPrivateRoute(gate.updatePrivateRoute, expectedPrivateRoutes[1]);
  assertPrivateRoute(gate.unmountPrivateRoute, expectedPrivateRoutes[2]);
  if (gate.privateRootCreatePreflightGate !== undefined) {
    assertPrivateRootCreatePreflightGate(
      gate.privateRootCreatePreflightGate,
      entrypoint
    );
  }
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
    expected.acceptedWorker ?? expected.acceptedWorkers[0]
  );
  const expectedRouteWorkers =
    privateRoute.acceptedWorkers !== undefined &&
    !privateRoute.acceptedWorkers.includes(
      "worker-636-test-renderer-create-native-execution"
    )
      ? expected.acceptedWorkers.filter(
          (worker) =>
            worker !== "worker-636-test-renderer-create-native-execution"
        )
      : expected.acceptedWorkers;
  if (privateRoute.acceptedWorkers === undefined) {
    assert.equal(
      privateRoute.acceptedWorker,
      expected.acceptedWorker ?? expected.acceptedWorkers[0]
    );
  } else {
    assert.equal(Object.isFrozen(privateRoute.acceptedWorkers), true);
    const expectedAcceptedWorkers = expectedRouteWorkers.slice();
    if (
      privateRoute.nativeBridgeAdmission?.id ===
      privateUpdateNativeBridgeAdmissionDiagnosticId
    ) {
      expectedAcceptedWorkers.push(
        "worker-637-test-renderer-update-native-execution"
      );
    }
    assert.deepEqual(privateRoute.acceptedWorkers, expectedAcceptedWorkers);
  }
  assert.equal(privateRoute.acceptedRustCrate, "fast-react-test-renderer");
  const hasRootWorkLoopUpdateRoute =
    privateRoute.rootWorkLoopUpdateRouteGate !== undefined;
  if (hasRootWorkLoopUpdateRoute) {
    assert.equal(
      privateRoute.rootWorkLoopUpdateRouteGate.status,
      privateUpdateRouteRootWorkLoopStatus
    );
    assertPrivateUpdateRouteRootWorkLoopGate(
      privateRoute.rootWorkLoopUpdateRouteGate
    );
    assert.equal(
      privateRoute.privateUpdateAdmissionRecordId,
      privateUpdateRouteRootWorkLoopAdmissionId
    );
    assert.equal(
      privateRoute.privateUpdateAdmissionStatus,
      privateUpdateRouteRootWorkLoopAdmissionStatus
    );
    assert.equal(privateRoute.privateUpdateAdmissionRecordAvailable, true);
    assert.equal(
      privateRoute.consumesAcceptedHostRootUpdateQueueMetadata,
      true
    );
    assert.equal(privateRoute.consumesAcceptedRootWorkLoopMetadata, true);
    assert.equal(privateRoute.consumesAcceptedHostOutputMetadata, true);
    assert.equal(privateRoute.consumesAcceptedRootWorkLoopHandoff, true);
    assert.equal(privateRoute.consumesAcceptedHostOutputHandoff, true);
    assert.equal(privateRoute.hostTextUpdateMetadataAvailable, true);
    assert.equal(privateRoute.publicSerializationAvailable, false);
    assert.equal(privateRoute.compatibilityClaimed, false);
    assert.equal(
      privateRoute.updateNativeBridgeAdmissionApi,
      "TestRendererRoot::describe_private_update_native_bridge_admission_for_canary"
    );
    assert.equal(
      privateRoute.updateNativeBridgeAdmissionDiagnosticId,
      privateUpdateNativeBridgeAdmissionDiagnosticId
    );
    assert.equal(
      privateRoute.updateNativeBridgeAdmissionStatus,
      privateUpdateNativeBridgeAdmissionStatus
    );
  } else {
    assert.equal(privateRoute.rootWorkLoopUpdateRouteGate, undefined);
  }
  if (privateRoute.createRouteAdmissionGate !== undefined) {
    const hasCreateHostOutputHandoff =
      privateRoute.createRouteAdmissionGate
        .hostOutputHandoffDiagnosticId !== undefined;
    assertPrivateCreateRouteAdmissionGate(
      privateRoute.createRouteAdmissionGate,
      privateRoute.createRouteAdmissionGate.entrypoint ?? privateRoute.publicSurface
    );
    assert.equal(privateRoute.consumesJsFacadeCreateMetadata, true);
    assert.equal(
      privateRoute.consumesAcceptedRustRootCreateExecutionEvidence,
      true
    );
    assert.equal(
      privateRoute.consumesAcceptedRustRootCreatePreflightDiagnostics,
      true
    );
    assert.equal(
      privateRoute
        .consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata,
      true
    );
    if (
      privateRoute.consumesAcceptedRustCreateHostOutputHandoff !==
      undefined
    ) {
      assert.equal(
        privateRoute.consumesAcceptedRustCreateHostOutputHandoff,
        true
      );
      assert.equal(privateRoute.acceptedHostOutputShape, "SingleHostText");
      assert.equal(privateRoute.hostOutputProducedByRust, true);
    }
  }
  assert.equal(Object.isFrozen(privateRoute.acceptedRustApis), true);
  const supportsCreateHostOutputHandoff =
    privateRoute.createRouteAdmissionGate === undefined ||
    privateRoute.createRouteAdmissionGate.hostOutputHandoffDiagnosticId !==
      undefined;
  const expectedRustApis = supportsCreateHostOutputHandoff
    ? expected.acceptedRustApis
    : expected.acceptedRustApis.filter(
        (api) =>
          api !==
            "TestRendererRoot::render_and_commit_host_output_for_canary" &&
          api !==
            "TestRendererRoot::describe_private_create_native_bridge_host_output_handoff_for_canary"
      );
  let expectedAcceptedRustApis =
    expected.rootWorkLoopUpdateRoute && !hasRootWorkLoopUpdateRoute
      ? expectedRustApis.slice(2)
      : expectedRustApis;
  if (
    privateRoute.nativeBridgeAdmission?.id ===
    privateUpdateNativeBridgeAdmissionDiagnosticId
  ) {
    expectedAcceptedRustApis = [
      ...expectedAcceptedRustApis.slice(0, 3),
      "TestRendererRoot::update_host_component_with_props_and_text_for_canary",
      ...expectedAcceptedRustApis.slice(3),
      "TestRendererRoot::describe_private_update_native_bridge_admission_for_canary",
      "TestRendererRoot::render_and_admit_private_update_native_bridge_handoff_for_canary"
    ];
  }
  assert.deepEqual(privateRoute.acceptedRustApis, expectedAcceptedRustApis);
  assert.equal(Object.isFrozen(privateRoute.acceptedRustTests), true);
  let expectedAcceptedRustTests =
    expected.rootWorkLoopUpdateRoute && !hasRootWorkLoopUpdateRoute
      ? expected.acceptedRustTests.slice(6)
      : expected.acceptedRustTests;
  if (!supportsCreateHostOutputHandoff) {
    expectedAcceptedRustTests = expectedAcceptedRustTests.filter(
      (testName) =>
        testName !==
          "root_private_create_native_bridge_handoff_consumes_actual_host_output" &&
        testName !==
          "root_private_create_native_bridge_handoff_rejects_stale_admission"
    );
  }
  if (privateRoute.deletionCommitHandoff !== undefined) {
    expectedAcceptedRustTests = [
      "root_host_output_canary_unmounts_committed_output_with_deletion_cleanup_diagnostics"
    ];
  }
  if (
    privateRoute.nativeBridgeAdmission?.id ===
    privateUpdateNativeBridgeAdmissionDiagnosticId
  ) {
    expectedAcceptedRustTests = [
      ...expectedAcceptedRustTests.slice(0, -2),
      "root_private_update_native_bridge_admission_consumes_actual_update_host_output_handoff",
      "root_private_update_native_bridge_admission_rejects_missing_handoff",
      "root_private_update_native_bridge_admission_rejects_stale_route_outcome",
      ...expectedAcceptedRustTests.slice(-2)
    ];
  }
  assert.deepEqual(privateRoute.acceptedRustTests, expectedAcceptedRustTests);
  if (privateRoute.deletionCommitHandoff !== undefined) {
    assertPrivateUnmountDeletionCommitHandoffGate(
      privateRoute.deletionCommitHandoff,
      expected.publicSurface
    );
    assert.equal(privateRoute.deletionCommitHandoffDiagnosticsAvailable, true);
    assert.equal(privateRoute.lifecycleStatusMetadataAvailable, true);
    assert.equal(privateRoute.staleRootRecordRejection, true);
    assert.equal(privateRoute.alreadyUnmountedRootRecordRejection, true);
    assert.equal(privateRoute.publicUnmountCompatibilityClaimed, false);
    assert.equal(privateRoute.publicHostTeardownCompatibilityClaimed, false);
    assert.equal(privateRoute.actFlushingClaimed, false);
  }
  if (privateRoute.nativeBridgeAdmission !== undefined) {
    if (privateRoute.nativeBridgeAdmission.id === privateUpdateNativeBridgeAdmissionDiagnosticId) {
      assertPrivateUpdateNativeBridgeAdmissionGate(
        privateRoute.nativeBridgeAdmission,
        expected.publicSurface
      );
    } else {
      if (privateRoute.nativeBridgeCleanupHandoff !== undefined) {
        assertPrivateUnmountNativeBridgeCleanupHandoffGate(
          privateRoute.nativeBridgeCleanupHandoff,
          expected.publicSurface
        );
        assert.equal(privateRoute.nativeBridgeCleanupHandoffAvailable, true);
      }
      assertPrivateUnmountNativeBridgeAdmissionGate(
        privateRoute.nativeBridgeAdmission,
        expected.publicSurface
      );
    }
    assert.equal(privateRoute.nativeBridgeAdmissionAvailable, true);
  }
}

function assertPrivateUpdateRouteRootWorkLoopGate(gate) {
  assert.equal(Object.isFrozen(gate), true);
  assert.equal(
    gate.id,
    "react-test-renderer-update-route-root-work-loop-private-gate"
  );
  assert.equal(gate.status, privateUpdateRouteRootWorkLoopStatus);
  assert.equal(gate.publicSurface, "create().update");
  assert.equal(gate.diagnosticName, privateUpdateRouteRootWorkLoopDiagnosticName);
  assert.equal(gate.acceptedRustCrate, "fast-react-test-renderer");
  assert.equal(
    gate.acceptedWorker,
    "worker-574-test-renderer-update-via-root-work-loop"
  );
  assert.deepEqual(gate.acceptedRustRecords, [
    "TestRendererRootScheduledUpdate",
    "UpdateContainerResult",
    "RootScheduleUpdateRecord",
    "ScheduledRootUpdateResult",
    "HostRootRenderPhaseRecord",
    "HostRootCommitRecord",
    "TestRendererUpdatedHostOutput",
    "TestRendererPrivateUpdateRouteAdmissionRecord"
  ]);
  assert.deepEqual(gate.acceptedHostRootUpdateQueueRecords, [
    "UpdateContainerResult",
    "RootScheduleUpdateRecord",
    "UpdateId",
    "UpdateQueueHandle"
  ]);
  assert.deepEqual(gate.acceptedRootWorkLoopRecords, [
    "HostRootRenderPhaseRecord",
    "HostRootCommitRecord"
  ]);
  assert.deepEqual(gate.acceptedRustApis, [
    "TestRendererRoot::describe_private_update_route_admission_for_canary",
    "TestRendererRoot::describe_private_update_route_via_root_work_loop_for_canary",
    "TestRendererRoot::update_host_component_with_text_for_canary",
    "TestRendererRoot::render_and_commit_host_output_update_for_canary"
  ]);
  assert.deepEqual(gate.acceptedRustTests, [
    "root_private_update_route_admission_record_consumes_update_work_loop_diagnostics",
    "root_private_update_route_consumes_root_work_loop_update_queue_and_text_update_metadata",
    "root_private_update_route_rejects_stale_root_update_output",
    "root_private_update_route_rejects_missing_update_queue_evidence",
    "root_private_update_route_rejects_unmounted_root",
    "root_private_update_route_rejects_incompatible_finished_work_record"
  ]);
  assert.equal(gate.admissionRecordId, privateUpdateRouteRootWorkLoopAdmissionId);
  assert.equal(
    gate.admissionStatus,
    privateUpdateRouteRootWorkLoopAdmissionStatus
  );
  assert.equal(gate.privateUpdateAdmissionRecordAvailable, true);
  assert.equal(gate.consumesAcceptedHostRootUpdateQueueMetadata, true);
  assert.equal(gate.consumesAcceptedRootWorkLoopMetadata, true);
  assert.equal(gate.consumesAcceptedHostOutputMetadata, true);
  assert.equal(gate.consumesManualHostOutputCanary, true);
  assert.equal(gate.staleRootLifecycleRejection, true);
  assert.equal(gate.staleRootRejection, true);
  assert.equal(gate.staleHostOutputRejection, true);
  assert.equal(gate.missingUpdateQueueEvidenceRejection, true);
  assert.equal(gate.unmountedRootRejection, true);
  assert.equal(gate.incompatibleFinishedWorkRejection, true);
  assert.equal(gate.publicRootUpdateAvailable, false);
  assert.equal(gate.publicSerializationAvailable, false);
  assert.equal(gate.publicRendererRootCreated, false);
  assert.equal(gate.nativeBridgeAvailable, false);
  assert.equal(gate.nativeExecution, false);
  assert.equal(gate.rustExecutionFromJs, false);
  assert.equal(gate.compatibilityClaimed, false);
}

function assertPrivateUpdateNativeBridgeAdmissionGate(gate, label) {
  assert.equal(Object.isFrozen(gate), true, label);
  assert.equal(gate.id, privateUpdateNativeBridgeAdmissionDiagnosticId, label);
  assert.equal(gate.status, privateUpdateNativeBridgeAdmissionStatus, label);
  assert.equal(gate.publicSurface, "create().update", label);
  assert.equal(gate.deterministic, true, label);
  assert.equal(
    gate.acceptedWorker,
    "worker-637-test-renderer-update-native-execution",
    label
  );
  assert.equal(gate.acceptedRustCrate, "fast-react-test-renderer", label);
  assert.deepEqual(gate.acceptedRustRecords, [
    "TestRendererRootUpdateOutcome",
    "TestRendererRootScheduledUpdate",
    "TestRendererUpdatedHostOutput",
    "TestRendererPrivateUpdateRouteAdmissionRecord",
    "TestRendererUpdateNativeBridgeAdmission"
  ]);
  assert.deepEqual(gate.acceptedRustApis, [
    "TestRendererRoot::update_host_component_with_props_and_text_for_canary",
    "TestRendererRoot::render_and_commit_host_output_update_for_canary",
    "TestRendererRoot::describe_private_update_route_via_root_work_loop_for_canary",
    "TestRendererRoot::describe_private_update_native_bridge_admission_for_canary",
    "TestRendererRoot::render_and_admit_private_update_native_bridge_handoff_for_canary"
  ]);
  assert.deepEqual(gate.acceptedRustTests, [
    "root_private_update_native_bridge_admission_consumes_actual_update_host_output_handoff",
    "root_private_update_native_bridge_admission_rejects_missing_handoff",
    "root_private_update_native_bridge_admission_rejects_stale_route_outcome"
  ]);
  assert.equal(
    gate.privateRouteDependencyId,
    "react-test-renderer-update-route-private-diagnostic",
    label
  );
  assertPrivateUpdateRouteRootWorkLoopGate(gate.updateRouteRootWorkLoopGate);
  assert.equal(
    gate.updateRouteAdmissionRecordId,
    privateUpdateRouteRootWorkLoopAdmissionId,
    label
  );
  assertLifecycleDiagnosticGate(gate.lifecycleDiagnosticGate);
  assert.equal(gate.consumesPrivateUpdateRouteMetadata, true, label);
  assert.equal(gate.consumesAcceptedRustLifecycleDiagnostics, true, label);
  assert.equal(gate.consumesAcceptedRootWorkLoopHandoff, true, label);
  assert.equal(gate.consumesAcceptedHostOutputHandoff, true, label);
  assert.equal(gate.validatesLifecycleEvidence, true, label);
  assert.equal(gate.validatesTextAndPropertyUpdateEvidence, true, label);
  assert.equal(gate.rejectsStaleUpdateHandoffs, true, label);
  assert.equal(gate.rejectsUnmountedRoots, true, label);
  assert.equal(gate.rejectsMissingHostOutputHandoff, true, label);
  assert.equal(gate.publicRouteAvailable, false, label);
  assert.equal(gate.publicUpdateCompatibilityClaimed, false, label);
  assert.equal(gate.publicSerializationAvailable, false, label);
  assert.equal(gate.actFlushingClaimed, false, label);
  assert.equal(gate.nativeBridgeAvailable, false, label);
  assert.equal(gate.nativeExecution, false, label);
  assert.equal(gate.rustExecutionFromJs, true, label);
  assert.equal(gate.reconcilerExecutionFromJs, true, label);
  assert.equal(gate.hostOutputProducedFromJs, true, label);
  assert.equal(gate.compatibilityClaimed, false, label);
}

function assertPrivateUpdateNativeBridgeAdmission(record, request) {
  assert.equal(Object.isFrozen(record), true, request.entrypoint);
  assert.equal(record.id, privateUpdateNativeBridgeAdmissionDiagnosticId);
  assert.equal(
    record.kind,
    "FastReactTestRendererPrivateUpdateNativeBridgeAdmission"
  );
  assert.equal(record.status, privateUpdateNativeBridgeAdmissionStatus);
  assertPrivateUpdateNativeBridgeAdmissionGate(record.gate, request.entrypoint);
  assert.equal(record.operation, "update");
  assert.equal(record.publicSurface, "create().update");
  assert.equal(record.request, request);
  assert.equal(record.requestId, request.requestId);
  assert.equal(record.requestSequence, request.requestSequence);
  assert.equal(record.rootId, request.rootId);
  assert.equal(record.rootSequence, request.rootSequence);
  assert.equal(record.updateKind, "Update");
  assert.equal(record.updateOutcome, rootUpdateOutcomeScheduled);
  assert.equal(record.scheduled, true);
  assert.equal(record.lifecycleStatusBefore, request.lifecycleStatusBefore);
  assert.equal(record.lifecycleStatusAfter, request.lifecycleStatusAfter);
  assert.equal(
    record.routeDependencyId,
    "react-test-renderer-update-route-private-diagnostic"
  );
  assert.equal(
    record.updateRouteAdmissionId,
    privateUpdateRouteRootWorkLoopAdmissionId
  );
  assertRootRequestRustLifecycleDiagnostic(
    record.rustLifecycleDiagnostic,
    expectedRootRequestDiagnosticFromRecord(request)
  );
  assertPrivateUpdateRouteRootWorkLoopAdmission(
    record.updateRouteRootWorkLoopAdmission,
    request,
    {
      admitted: true,
      sourceDiagnostic:
        record.updateRouteRootWorkLoopAdmission.sourceDiagnostic
    }
  );
  assert.equal(
    record.updateRouteRootWorkLoopDiagnostic,
    record.updateRouteRootWorkLoopAdmission.sourceDiagnostic
  );
  assert.equal(record.updateRouteAdmissionAccepted, true);
  assert.equal(record.lifecycleEvidenceAccepted, true);
  assert.equal(record.rootWorkLoopHandoffAccepted, true);
  assert.equal(record.hostOutputHandoffAccepted, true);
  assert.equal(record.textUpdateApplyRecorded, true);
  assert.equal(record.hostTextUpdateApplyCount, 1);
  assert.equal(record.hostComponentUpdateApplyCount, 1);
  assert.equal(record.rejectsStaleUpdateHandoffs, true);
  assert.equal(record.rejectsUnmountedRoots, true);
  assert.equal(record.rejectsMissingHostOutputHandoff, true);
  assert.equal(record.publicUpdateCompatibilityClaimed, false);
  assert.equal(record.publicSerializationAvailable, false);
  assert.equal(record.actFlushingClaimed, false);
  assert.equal(record.nativeBridgeAvailable, false);
  assert.equal(record.nativeExecution, false);
  assert.equal(record.rustExecutionFromJs, true);
  assert.equal(record.reconcilerExecutionFromJs, true);
  assert.equal(record.hostOutputProduced, true);
  assert.equal(record.compatibilityClaimed, false);
}

function assertPrivateUnmountDeletionCommitHandoffGate(gate, label) {
  assert.equal(Object.isFrozen(gate), true, label);
  assert.equal(gate.id, privateUnmountDeletionCommitHandoffDiagnosticId, label);
  assert.equal(gate.status, privateUnmountDeletionCommitHandoffStatus, label);
  assert.equal(gate.publicSurface, "create().unmount", label);
  assert.equal(gate.deterministic, true, label);
  assert.equal(gate.acceptedRustCrate, "fast-react-test-renderer", label);
  assert.deepEqual(gate.acceptedRustRecords, [
    "HostRootCommitRecord",
    "HostRootDeletionCleanupLog",
    "TestRendererHostNodeCleanupReport",
    "TestRendererUnmountDeletionCommitHandoffDiagnostics",
    "TestRendererUnmountHostChildDetachmentBlockers"
  ]);
  assert.deepEqual(gate.acceptedRustApis, [
    "TestRendererRoot::unmount",
    "TestRendererRoot::render_and_commit_host_output_unmount_for_canary",
    "TestRendererRoot::describe_private_unmount_deletion_commit_handoff_for_canary"
  ]);
  assert.deepEqual(gate.acceptedRustTests, [
    "root_host_output_canary_unmounts_committed_output_with_deletion_cleanup_diagnostics",
    "root_private_unmount_route_rejects_stale_deletion_commit_handoff",
    "root_host_output_unmount_canary_rejects_already_unmounted_root_record"
  ]);
  assert.equal(
    gate.acceptedWorker,
    "worker-575-test-renderer-unmount-deletion-commit-link"
  );
  assertLifecycleDiagnosticGate(gate.lifecycleDiagnosticGate);
  assertPrivateUnmountHostChildDetachmentBlockers(
    gate.hostChildDetachmentBlockers,
    label
  );
  assert.equal(gate.deletionCommitHandoffAvailable, true, label);
  assert.equal(gate.hostNodeDeletionCleanupLogAvailable, true, label);
  assert.equal(gate.hostChildDetachmentBlockersAvailable, true, label);
  assert.equal(gate.lifecycleStatusMetadataAvailable, true, label);
  assert.equal(gate.staleRootRecordRejection, true, label);
  assert.equal(gate.alreadyUnmountedRootRecordRejection, true, label);
  assert.equal(gate.publicRouteAvailable, false, label);
  assert.equal(gate.publicUnmountCompatibilityClaimed, false, label);
  assert.equal(gate.publicHostTeardownCompatibilityClaimed, false, label);
  assert.equal(gate.actFlushingClaimed, false, label);
  assert.equal(gate.nativeBridgeAvailable, false, label);
  assert.equal(gate.nativeExecution, false, label);
  assert.equal(gate.rustExecutionFromJs, false, label);
  assert.equal(gate.compatibilityClaimed, false, label);
}

function assertPrivateUnmountHostChildDetachmentBlockers(blockers, label) {
  assert.equal(Object.isFrozen(blockers), true, label);
  assert.equal(
    blockers.id,
    "react-test-renderer-unmount-host-child-detachment-blockers",
    label
  );
  assert.equal(
    blockers.status,
    "blocked-public-host-child-detachment-private-cleanup-metadata-only",
    label
  );
  assert.equal(blockers.deterministic, true, label);
  assert.equal(blockers.knownFixtureDetachMetadataAvailable, true, label);
  assert.equal(
    blockers.hostNodeCleanupInvalidationMetadataAvailable,
    true,
    label
  );
  assert.equal(blockers.broadHostChildDetachmentBlocked, true, label);
  assert.equal(
    blockers.publicHostTeardownCompatibilityClaimed,
    false,
    label
  );
  assert.equal(blockers.publicUnmountCompatibilityClaimed, false, label);
  assert.equal(blockers.actFlushingClaimed, false, label);
  assert.equal(blockers.nativeBridgeAvailable, false, label);
  assert.equal(blockers.nativeExecution, false, label);
  assert.equal(blockers.compatibilityClaimed, false, label);
}

function assertPrivateUnmountDeletionCommitHandoff(record, expected) {
  assert.equal(Object.isFrozen(record), true, expected.entrypoint);
  assert.equal(
    record.id,
    privateUnmountDeletionCommitHandoffDiagnosticId,
    expected.entrypoint
  );
  assert.equal(
    record.kind,
    "FastReactTestRendererPrivateUnmountDeletionCommitHandoff",
    expected.entrypoint
  );
  assert.equal(
    record.status,
    privateUnmountDeletionCommitHandoffStatus,
    expected.entrypoint
  );
  assertPrivateUnmountDeletionCommitHandoffGate(
    record.gate,
    expected.entrypoint
  );
  assert.equal(record.operation, "unmount", expected.entrypoint);
  assert.equal(record.publicSurface, "create().unmount", expected.entrypoint);
  assert.equal(record.updateKind, "Unmount", expected.entrypoint);
  assert.equal(
    record.updateOutcome,
    expected.updateOutcome,
    expected.entrypoint
  );
  assert.equal(
    record.expectedOutcome,
    expected.updateOutcome,
    expected.entrypoint
  );
  assert.equal(
    record.lifecycleStatusBefore,
    expected.lifecycleStatusBefore,
    expected.entrypoint
  );
  assert.equal(
    record.lifecycleStatusAfter,
    expected.lifecycleStatusAfter,
    expected.entrypoint
  );
  assert.equal(
    record.lifecycleTransition,
    `${expected.lifecycleStatusBefore === null ? "none" : expected.lifecycleStatusBefore}->${expected.lifecycleStatusAfter}`,
    expected.entrypoint
  );
  assert.equal(record.scheduled, expected.scheduled, expected.entrypoint);
  assert.equal(
    record.scheduledElementIsNone,
    expected.scheduledElementIsNone,
    expected.entrypoint
  );
  assert.equal(
    record.sync,
    expected.scheduled ? true : null,
    expected.entrypoint
  );
  assert.equal(
    record.deletionCommitHandoffAvailable,
    expected.scheduled,
    expected.entrypoint
  );
  assert.equal(
    record.deletionCommitHandoffRejected,
    !expected.scheduled,
    expected.entrypoint
  );
  assert.equal(record.commitRecord, "HostRootCommitRecord", expected.entrypoint);
  assert.equal(
    record.hostNodeDeletionCleanupLog,
    "HostRootDeletionCleanupLog",
    expected.entrypoint
  );
  assert.equal(
    record.hostNodeCleanupReport,
    "TestRendererHostNodeCleanupReport",
    expected.entrypoint
  );
  assert.equal(
    record.rustDiagnostic,
    "TestRendererUnmountDeletionCommitHandoffDiagnostics",
    expected.entrypoint
  );
  assertPrivateUnmountHostChildDetachmentBlockers(
    record.hostChildDetachmentBlockers,
    expected.entrypoint
  );
  assert.equal(record.lifecycleStatusMetadataAvailable, true);
  assert.equal(record.staleRootRecordRejection, true);
  assert.equal(record.alreadyUnmountedRootRecordRejection, true);
  assert.equal(record.publicRouteAvailable, false);
  assert.equal(record.publicUnmountCompatibilityClaimed, false);
  assert.equal(record.publicHostTeardownCompatibilityClaimed, false);
  assert.equal(record.actFlushingClaimed, false);
  assert.equal(record.nativeBridgeAvailable, false);
  assert.equal(record.nativeExecution, false);
  assert.equal(record.rustExecutionFromJs, false);
  assert.equal(record.reconcilerExecutionFromJs, false);
  assert.equal(record.compatibilityClaimed, false);
}

function assertPrivateUnmountNativeBridgeCleanupHandoffGate(gate, label) {
  assert.equal(Object.isFrozen(gate), true, label);
  assert.equal(
    gate.id,
    privateUnmountNativeBridgeCleanupHandoffDiagnosticId,
    label
  );
  assert.equal(
    gate.status,
    privateUnmountNativeBridgeCleanupHandoffStatus,
    label
  );
  assert.equal(gate.publicSurface, "create().unmount", label);
  assert.equal(gate.deterministic, true, label);
  assert.equal(
    gate.acceptedWorker,
    "worker-638-test-renderer-unmount-native-execution",
    label
  );
  assert.equal(gate.acceptedRustCrate, "fast-react-test-renderer", label);
  assert.deepEqual(gate.acceptedRustRecords, [
    "TestRendererRootUpdateOutcome",
    "TestRendererUnmountedHostOutput",
    "TestRendererUnmountDeletionCommitHandoffDiagnostics",
    "TestRendererUnmountNativeBridgeAdmission",
    "TestRendererUnmountNativeBridgeCleanupHandoff"
  ]);
  assert.deepEqual(gate.acceptedRustApis, [
    "TestRendererRoot::unmount",
    "TestRendererRoot::render_and_commit_host_output_unmount_for_canary",
    "TestRendererRoot::describe_private_unmount_deletion_commit_handoff_for_canary",
    "TestRendererRoot::describe_private_unmount_native_bridge_admission_for_canary",
    "TestRendererRoot::execute_private_unmount_native_bridge_cleanup_handoff_for_canary"
  ]);
  assert.deepEqual(gate.acceptedRustTests, [
    "root_private_unmount_native_bridge_admission_executes_minimal_cleanup_handoff"
  ]);
  assertPrivateUnmountDeletionCommitHandoffGate(
    gate.deletionCommitHandoffGate,
    label
  );
  assert.equal(
    gate.admissionDiagnosticId,
    privateUnmountNativeBridgeAdmissionDiagnosticId,
    label
  );
  assert.equal(gate.minimalTreeOnly, true, label);
  assert.equal(gate.hostOutputProduced, true, label);
  assert.equal(gate.rustUnmountCleanupHandoffExecuted, true, label);
  assert.equal(gate.publicRouteAvailable, false, label);
  assert.equal(gate.publicUnmountCompatibilityClaimed, false, label);
  assert.equal(gate.publicHostTeardownCompatibilityClaimed, false, label);
  assert.equal(gate.actFlushingClaimed, false, label);
  assert.equal(gate.nativeBridgeAvailable, false, label);
  assert.equal(gate.nativeExecution, false, label);
  assert.equal(gate.rustExecutionFromJs, false, label);
  assert.equal(gate.compatibilityClaimed, false, label);
}

function assertPrivateUnmountNativeBridgeAdmissionGate(gate, label) {
  assert.equal(Object.isFrozen(gate), true, label);
  assert.equal(gate.id, privateUnmountNativeBridgeAdmissionDiagnosticId, label);
  assert.equal(gate.status, privateUnmountNativeBridgeAdmissionStatus, label);
  assert.equal(gate.publicSurface, "create().unmount", label);
  assert.equal(gate.deterministic, true, label);
  assert.equal(
    gate.acceptedWorker,
    "worker-638-test-renderer-unmount-native-execution",
    label
  );
  assert.deepEqual(gate.acceptedWorkers, [
    "worker-612-test-renderer-unmount-native-bridge-admission",
    "worker-638-test-renderer-unmount-native-execution"
  ]);
  assert.equal(gate.acceptedRustCrate, "fast-react-test-renderer", label);
  assert.deepEqual(gate.acceptedRustRecords, [
    "TestRendererRootUpdateOutcome",
    "TestRendererRootScheduledUpdate",
    "TestRendererUnmountDeletionCommitHandoffDiagnostics",
    "TestRendererUnmountHostChildDetachmentBlockers",
    "TestRendererUnmountNativeBridgeAdmission",
    "TestRendererUnmountNativeBridgeCleanupHandoff"
  ]);
  assert.deepEqual(gate.acceptedRustApis, [
    "TestRendererRoot::unmount",
    "TestRendererRoot::render_and_commit_host_output_unmount_for_canary",
    "TestRendererRoot::describe_private_unmount_deletion_commit_handoff_for_canary",
    "TestRendererRoot::describe_private_unmount_native_bridge_admission_for_canary",
    "TestRendererRoot::execute_private_unmount_native_bridge_cleanup_handoff_for_canary"
  ]);
  assert.deepEqual(gate.acceptedRustTests, [
    "root_host_output_canary_unmounts_committed_output_with_deletion_cleanup_diagnostics",
    "root_private_unmount_native_bridge_admission_rejects_stale_handoff",
    "root_private_unmount_native_bridge_admission_rejects_missing_cleanup_blockers",
    "root_private_unmount_native_bridge_admission_rejects_already_unmounted_root",
    "root_private_unmount_native_bridge_admission_executes_minimal_cleanup_handoff"
  ]);
  assert.equal(
    gate.privateRouteDependencyId,
    "react-test-renderer-unmount-route-private-diagnostic",
    label
  );
  assertPrivateUnmountDeletionCommitHandoffGate(
    gate.deletionCommitHandoffGate,
    label
  );
  assertPrivateUnmountNativeBridgeCleanupHandoffGate(
    gate.cleanupHandoffGate,
    label
  );
  assertLifecycleDiagnosticGate(gate.lifecycleDiagnosticGate);
  assert.equal(gate.consumesPrivateUnmountRouteMetadata, true, label);
  assert.equal(gate.consumesAcceptedRustLifecycleDiagnostics, true, label);
  assert.equal(gate.consumesAcceptedDeletionCommitHandoff, true, label);
  assert.equal(gate.consumesActualRustCleanupHandoff, true, label);
  assert.equal(gate.requiresActualRustCleanupHandoff, true, label);
  assert.equal(gate.validatesLifecycleEvidence, true, label);
  assert.equal(gate.validatesCleanupBlockers, true, label);
  assert.equal(gate.validatesMinimalTreeCleanupHandoff, true, label);
  assert.equal(gate.rustUnmountCleanupHandoffExecuted, true, label);
  assert.equal(gate.hostOutputProduced, true, label);
  assert.equal(gate.minimalTreeCleanupHandoff, true, label);
  assert.equal(gate.rejectsAlreadyUnmountedRoots, true, label);
  assert.equal(gate.rejectsStaleDeletionHandoffs, true, label);
  assert.equal(gate.rejectsMissingCleanupBlockers, true, label);
  assert.equal(gate.publicRouteAvailable, false, label);
  assert.equal(gate.publicUnmountCompatibilityClaimed, false, label);
  assert.equal(gate.publicHostTeardownCompatibilityClaimed, false, label);
  assert.equal(gate.actFlushingClaimed, false, label);
  assert.equal(gate.nativeBridgeAvailable, false, label);
  assert.equal(gate.nativeExecution, false, label);
  assert.equal(gate.rustExecutionFromJs, false, label);
  assert.equal(gate.compatibilityClaimed, false, label);
}

function assertPrivateUnmountNativeBridgeAdmission(record, request) {
  assert.equal(Object.isFrozen(record), true, request.entrypoint);
  assert.equal(record.id, privateUnmountNativeBridgeAdmissionDiagnosticId);
  assert.equal(
    record.kind,
    "FastReactTestRendererPrivateUnmountNativeBridgeAdmission"
  );
  assert.equal(record.status, privateUnmountNativeBridgeAdmissionStatus);
  assertPrivateUnmountNativeBridgeAdmissionGate(record.gate, request.entrypoint);
  assert.equal(record.operation, "unmount");
  assert.equal(record.publicSurface, "create().unmount");
  assert.equal(record.request, request);
  assert.equal(record.requestId, request.requestId);
  assert.equal(record.requestSequence, request.requestSequence);
  assert.equal(record.rootId, request.rootId);
  assert.equal(record.rootSequence, request.rootSequence);
  assert.equal(record.updateKind, "Unmount");
  assert.equal(record.updateOutcome, rootUpdateOutcomeScheduled);
  assert.equal(record.scheduled, true);
  assert.equal(record.lifecycleStatusBefore, request.lifecycleStatusBefore);
  assert.equal(record.lifecycleStatusAfter, request.lifecycleStatusAfter);
  assert.equal(
    record.privateUnmountRouteMetadata,
    request.privateUnmountDeletionCommitHandoff
  );
  assertRootRequestRustLifecycleDiagnostic(
    record.rustLifecycleDiagnostic,
    expectedRootRequestDiagnosticFromRecord(request)
  );
  assert.equal(Object.isFrozen(record.cleanupHandoff), true);
  assert.equal(
    record.cleanupHandoffDiagnosticId,
    privateUnmountNativeBridgeCleanupHandoffDiagnosticId
  );
  assert.equal(
    record.cleanupHandoff.diagnosticId,
    privateUnmountNativeBridgeCleanupHandoffDiagnosticId
  );
  assert.equal(
    record.cleanupHandoff.status,
    privateUnmountNativeBridgeCleanupHandoffStatus
  );
  assert.equal(record.cleanupHandoff.requestId, request.requestId);
  assert.equal(record.cleanupHandoff.rootId, request.rootId);
  assert.equal(record.cleanupHandoff.routeOutcome, rootUpdateOutcomeScheduled);
  assert.equal(
    record.cleanupHandoff.routeDependencyId,
    "react-test-renderer-unmount-route-private-diagnostic"
  );
  assert.equal(
    record.cleanupHandoff.deletionCommitHandoffId,
    privateUnmountDeletionCommitHandoffDiagnosticId
  );
  assert.equal(
    record.cleanupHandoff.admissionDiagnosticId,
    privateUnmountNativeBridgeAdmissionDiagnosticId
  );
  assert.equal(record.cleanupHandoff.lifecycle, rootLifecycleUnmountScheduled);
  assert.equal(record.cleanupHandoff.scheduledUpdateKind, "Unmount");
  assert.equal(record.cleanupHandoff.scheduledElementIsNone, true);
  assert.equal(record.cleanupHandoff.previousRootChildCount, 1);
  assert.equal(record.cleanupHandoff.currentRootChildCount, 0);
  assert.equal(record.cleanupHandoff.detachedInstance, true);
  assert.equal(record.cleanupHandoff.detachedInstanceChildCount, 0);
  assert.equal(record.cleanupHandoff.hostNodeCleanupCount, 2);
  assert.equal(record.cleanupHandoff.cleanupOrderRecordCount, 2);
  assert.equal(record.cleanupHandoff.minimalTreeCleanupHandoff, true);
  assert.equal(
    record.cleanupHandoff.rustUnmountCleanupHandoffExecuted,
    true
  );
  assert.equal(record.cleanupHandoff.hostOutputProduced, true);
  assert.equal(record.cleanupHandoff.publicUnmountCompatibilityClaimed, false);
  assert.equal(
    record.cleanupHandoff.publicHostTeardownCompatibilityClaimed,
    false
  );
  assert.equal(record.cleanupHandoff.actFlushingClaimed, false);
  assert.equal(record.cleanupHandoff.nativeBridgeAvailable, false);
  assert.equal(record.cleanupHandoff.nativeExecution, false);
  assert.equal(Object.isFrozen(record.deletionCommitHandoff), true);
  assert.equal(
    record.cleanupHandoff.deletionCommitHandoff,
    record.deletionCommitHandoff
  );
  assert.equal(
    record.deletionCommitHandoffDiagnosticId,
    privateUnmountDeletionCommitHandoffDiagnosticId
  );
  assert.equal(
    record.deletionCommitHandoff.diagnosticId,
    privateUnmountDeletionCommitHandoffDiagnosticId
  );
  assert.equal(
    record.deletionCommitHandoff.status,
    privateUnmountDeletionCommitHandoffStatus
  );
  assert.equal(record.deletionCommitHandoff.requestId, request.requestId);
  assert.equal(record.deletionCommitHandoff.rootId, request.rootId);
  assert.equal(record.deletionCommitHandoff.lifecycle, rootLifecycleUnmountScheduled);
  assert.equal(record.deletionCommitHandoff.scheduledUpdateKind, "Unmount");
  assert.equal(record.deletionCommitHandoff.scheduledElementIsNone, true);
  assert.equal(record.deletionCommitHandoff.commitCurrentIsStoreCurrent, true);
  assert.equal(
    record.deletionCommitHandoff.renderCurrentMatchesCommitPreviousCurrent,
    true
  );
  assert.equal(
    record.deletionCommitHandoff.renderFinishedWorkMatchesCommitCurrent,
    true
  );
  assert.equal(record.deletionCommitHandoff.deletionListCount, 1);
  assert.equal(record.deletionCommitHandoff.deletedRootCount, 1);
  assert.equal(record.deletionCommitHandoff.hostNodeCleanupCount, 2);
  assert.equal(
    record.deletionCommitHandoff.cleanupRecordsMatchDeletionCommit,
    true
  );
  assert.equal(record.deletionCommitHandoff.cleanupOrderRecordCount, 2);
  assert.equal(record.deletionCommitHandoff.publicUnmountCompatibilityClaimed, false);
  assert.equal(
    record.deletionCommitHandoff.publicHostTeardownCompatibilityClaimed,
    false
  );
  assert.equal(record.deletionCommitHandoff.actFlushingClaimed, false);
  const blockers = record.deletionCommitHandoff.hostChildDetachmentBlockers;
  assert.equal(Object.isFrozen(blockers), true);
  assert.equal(blockers.detachedInstance, true);
  assert.equal(blockers.detachedInstanceChildCount, 0);
  assert.equal(blockers.hostNodeCleanupInvalidatedCount, 2);
  assert.equal(blockers.hostNodeCleanupAlreadyInactiveCount, 0);
  assert.equal(blockers.hostNodeCleanupMissingHostNodeCount, 0);
  assert.equal(blockers.hostNodeCleanupMissingStateNodeCount, 0);
  assert.equal(blockers.broadHostChildDetachmentBlocked, true);
  assert.equal(blockers.publicHostTeardownCompatibilityClaimed, false);
  assert.equal(blockers.publicUnmountCompatibilityClaimed, false);
  assert.equal(blockers.actFlushingClaimed, false);
  assert.equal(record.consumesPrivateUnmountRouteMetadata, true);
  assert.equal(record.consumesAcceptedRustLifecycleDiagnostics, true);
  assert.equal(record.consumesAcceptedDeletionCommitHandoff, true);
  assert.equal(record.consumesActualRustCleanupHandoff, true);
  assert.equal(record.requiresActualRustCleanupHandoff, true);
  assert.equal(record.validatesLifecycleEvidence, true);
  assert.equal(record.validatesCleanupBlockers, true);
  assert.equal(record.validatesMinimalTreeCleanupHandoff, true);
  assert.equal(record.deletionCommitHandoffAccepted, true);
  assert.equal(record.cleanupHandoffAccepted, true);
  assert.equal(record.lifecycleEvidenceAccepted, true);
  assert.equal(record.cleanupBlockersAccepted, true);
  assert.equal(record.hostNodeCleanupCount, 2);
  assert.equal(record.cleanupOrderRecordCount, 2);
  assert.equal(record.rustUnmountCleanupHandoffExecuted, true);
  assert.equal(record.hostOutputProduced, true);
  assert.equal(record.minimalTreeCleanupHandoff, true);
  assert.equal(record.rejectsAlreadyUnmountedRoots, true);
  assert.equal(record.rejectsStaleDeletionHandoffs, true);
  assert.equal(record.rejectsMissingCleanupBlockers, true);
  assert.equal(record.publicRouteAvailable, false);
  assert.equal(record.publicUnmountCompatibilityClaimed, false);
  assert.equal(record.publicHostTeardownCompatibilityClaimed, false);
  assert.equal(record.actFlushingClaimed, false);
  assert.equal(record.nativeBridgeAvailable, false);
  assert.equal(record.nativeExecution, false);
  assert.equal(record.rustExecutionFromJs, false);
  assert.equal(record.reconcilerExecutionFromJs, false);
  assert.equal(record.compatibilityClaimed, false);
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
  const expectedAcceptedRustWorkers = [
    "worker-235-test-renderer-private-fiber-inspection",
    "worker-265-test-renderer-private-json-ready-diagnostics"
  ];
  const committedFiberShapeDiagnostics =
    gate.privateCommittedFiberInspectionShapeDiagnosticsAvailable === true;
  if (committedFiberShapeDiagnostics) {
    expectedAcceptedRustWorkers.push(
      "worker-516-test-renderer-committed-fiber-tree-inspection"
    );
  }
  assert.deepEqual(gate.acceptedRustWorkers, expectedAcceptedRustWorkers);
  assert.deepEqual(
    gate.acceptedRustApis,
    committedFiberShapeDiagnostics
      ? [
          "inspect_test_renderer_committed_fiber_tree",
          "TestRendererCommittedFiberTreeInspection::shape_name",
          "TestRendererCommittedFiberTreeInspection::nodes",
          "TestRendererCommittedFiberTreeInspection::root_children",
          "TestRendererCommittedFiberTreeInspection::host_children",
          "TestRendererCommittedFiberTreeInspection::function_component",
          "TestRendererCommittedFiberTreeInspection::host_components",
          "TestRendererCommittedFiberTreeInspection::host_texts",
          "TestRendererCommittedFiberTreeInspection::fiber_tag_order",
          "TestRendererCommittedFiberTreeInspection::host_root",
          "TestRendererCommittedFiberTreeInspection::host_component",
          "TestRendererCommittedFiberTreeInspection::host_text",
          "TestRendererRoot::describe_private_json_serialization_for_canary",
          "TestRendererRoot::describe_private_tree_metadata_for_canary",
          "TestRendererRoot::describe_private_tree_metadata_after_update_for_canary",
          "TestRendererRoot::describe_private_tree_committed_fiber_inspection_for_canary",
          "TestRendererPrivateJsonSerializationReport",
          "TestRendererPrivateTreeMetadataReport",
          "TestRendererPrivateTreeCommittedFiberInspectionReport",
          "TestRendererPrivateTreeFunctionComponentDiagnostic"
        ]
      : [
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
        ]
  );
  assert.deepEqual(
    gate.acceptedRustTests,
    committedFiberShapeDiagnostics
      ? [
          "committed_fiber_inspection_describes_host_root_component_and_text",
          "committed_fiber_inspection_describes_multi_child_host_root_shape",
          "committed_fiber_inspection_describes_function_component_above_host_shape",
          "committed_fiber_inspection_describes_function_component_above_multi_child_shape",
          "root_private_json_serialization_canary_describes_minimal_host_component_with_text",
          "root_private_tree_metadata_canary_describes_minimal_host_component_with_text",
          "root_private_tree_metadata_canary_describes_updated_host_component_text_after_commit",
          "root_private_tree_metadata_canary_describes_function_component_above_host_output",
          "root_private_tree_committed_fiber_inspection_records_minimal_shape_privately"
        ]
      : [
          "committed_fiber_inspection_describes_host_root_component_and_text",
          "root_private_json_serialization_canary_describes_minimal_host_component_with_text",
          "root_private_tree_metadata_canary_describes_minimal_host_component_with_text",
          "root_private_tree_metadata_canary_describes_updated_host_component_text_after_commit",
          "root_private_tree_metadata_canary_describes_function_component_above_host_output"
        ]
  );
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

function assertPrivateTestInstanceQueryBridgePreflight(
  preflight,
  owner,
  rootRequest,
  entrypoint
) {
  assert.equal(Object.isFrozen(preflight), true, entrypoint);
  assert.equal(
    preflight.id,
    "react-test-renderer-private-test-instance-query-bridge-preflight",
    entrypoint
  );
  assert.equal(
    preflight.kind,
    "FastReactTestRendererPrivateTestInstanceQueryBridgePreflight",
    entrypoint
  );
  assert.equal(
    preflight.diagnosticName,
    privateTestInstanceQueryBridgePreflightDiagnosticName,
    entrypoint
  );
  assert.equal(
    preflight.status,
    privateTestInstanceQueryBridgePreflightStatus,
    entrypoint
  );
  assert.equal(Object.isFrozen(preflight.gate), true, entrypoint);
  assert.equal(
    preflight.gate.id,
    "react-test-renderer-private-test-instance-query-bridge-preflight-gate",
    entrypoint
  );
  assert.equal(
    preflight.gate.diagnosticName,
    privateTestInstanceQueryBridgePreflightDiagnosticName,
    entrypoint
  );
  assert.equal(
    preflight.gate.status,
    privateTestInstanceQueryBridgePreflightStatus,
    entrypoint
  );
  assert.equal(
    preflight.gate.acceptedWorker,
    "worker-515-test-renderer-live-query-bridge-preflight",
    entrypoint
  );
  assert.deepEqual(preflight.gate.acceptedRustApis, [
    "TestRendererRoot::describe_private_test_instance_query_bridge_preflight_for_canary",
    "TestRendererRoot::describe_private_test_instance_query_bridge_preflight_after_update_for_canary",
    "TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics"
  ]);
  assert.deepEqual(preflight.gate.acceptedRustTests, [
    "root_private_test_instance_query_bridge_preflight_ties_find_all_and_find_by_records",
    "root_private_test_instance_query_bridge_preflight_follows_update_records"
  ]);
  assert.equal(preflight.rootRequest, rootRequest, entrypoint);
  assert.equal(preflight.rootHandle, rootRequest.rootHandle, entrypoint);
  assert.equal(preflight.rootId, rootRequest.rootId, entrypoint);
  assert.equal(
    preflight.bridgeSource,
    "FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata.testInstanceQuery",
    entrypoint
  );
  assert.equal(
    preflight.wrapperRecordSymbol,
    privateTestInstanceWrapperRecordSymbolDescription,
    entrypoint
  );
  assert.equal(
    preflight.sourceFindAllDiagnosticName,
    owner.findAllPredicateDiagnostics.diagnosticName,
    entrypoint
  );
  assert.equal(
    preflight.sourceFindByDiagnosticName,
    owner.findByQueryDiagnostics.diagnosticName,
    entrypoint
  );
  assert.equal(
    preflight.acceptedRustFindAllDiagnostics,
    owner.findAllPredicateDiagnostics,
    entrypoint
  );
  assert.equal(
    preflight.acceptedRustFindByDiagnostics,
    owner.findByQueryDiagnostics,
    entrypoint
  );
  assert.equal(
    preflight.normalizedAcceptedRustFindAllDiagnostics.diagnosticName,
    owner.findAllPredicateDiagnostics.diagnosticName,
    entrypoint
  );
  assert.equal(
    preflight.normalizedAcceptedRustFindByDiagnostics.diagnosticName,
    owner.findByQueryDiagnostics.diagnosticName,
    entrypoint
  );
  assert.deepEqual(preflight.findAllPredicateKinds, [
    "type",
    "props",
    "predicate-like"
  ]);
  assert.deepEqual(preflight.findByQueries, ["findByType", "findByProps"]);
  assert.equal(
    preflight.consumesAcceptedRustFindAllDiagnostics,
    true,
    entrypoint
  );
  assert.equal(
    preflight.consumesAcceptedRustFindByDiagnostics,
    true,
    entrypoint
  );
  assert.equal(preflight.recordOnlyDiagnosticConsumption, true, entrypoint);
  assert.equal(preflight.publicRootAvailable, false, entrypoint);
  assert.equal(preflight.publicQueryMethodsAvailable, false, entrypoint);
  assert.equal(
    preflight.publicTestInstanceObjectAvailable,
    false,
    entrypoint
  );
  assert.equal(preflight.nativeBridgeAvailable, false, entrypoint);
  assert.equal(preflight.nativeExecution, false, entrypoint);
  assert.equal(preflight.rustExecutionFromJs, false, entrypoint);
  assert.equal(preflight.compatibilityClaimed, false, entrypoint);
  assert.equal(
    owner.acceptedRustFindAllDiagnostics,
    owner.findAllPredicateDiagnostics,
    entrypoint
  );
  assert.equal(
    owner.acceptedRustFindByDiagnostics,
    owner.findByQueryDiagnostics,
    entrypoint
  );
  assert.equal(owner.consumesAcceptedRustQueryDiagnostics, true, entrypoint);
  assert.equal(owner.recordOnlyDiagnosticConsumption, true, entrypoint);

  const queryMetadata = owner.rootRequestTestInstanceQueryMetadata;
  assert.equal(
    queryMetadata.queryBridgePreflightDiagnosticName,
    privateTestInstanceQueryBridgePreflightDiagnosticName,
    entrypoint
  );
  assert.equal(
    queryMetadata.queryBridgePreflightStatus,
    privateTestInstanceQueryBridgePreflightStatus,
    entrypoint
  );
  assert.equal(queryMetadata.queryBridgePreflightAvailable, true, entrypoint);
  assert.deepEqual(
    queryMetadata.queryBridgePreflightAcceptedRustApis,
    preflight.gate.acceptedRustApis,
    entrypoint
  );
  assert.deepEqual(
    queryMetadata.queryBridgePreflightAcceptedRustTests,
    preflight.gate.acceptedRustTests,
    entrypoint
  );
  assert.equal(
    queryMetadata.consumesAcceptedRustFindAllDiagnostics,
    true,
    entrypoint
  );
  assert.equal(
    queryMetadata.consumesAcceptedRustFindByDiagnostics,
    true,
    entrypoint
  );
  assert.equal(
    queryMetadata.recordOnlyDiagnosticConsumption,
    true,
    entrypoint
  );
  assert.equal(queryMetadata.queryBridgeRustExecutionFromJs, false, entrypoint);
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
  if (
    expected.operation === "update" &&
    error.privateRootRequest.updateOutcome === rootUpdateOutcomeScheduled &&
    error.privateUpdateRouteRootWorkLoopDiagnostic != null
  ) {
    assertPrivateUpdateRouteRootWorkLoopDiagnostic(
      error.privateUpdateRouteRootWorkLoopDiagnostic,
      error.privateRootRequest
    );
    assert.equal(
      error.privateUpdateRouteRootWorkLoopAdmission,
      error.privateUpdateRouteRootWorkLoopDiagnostic.admissionRecord
    );
  } else {
    assert.equal(
      error.privateUpdateRouteRootWorkLoopDiagnostic == null,
      true
    );
    assert.equal(error.privateUpdateRouteRootWorkLoopAdmission == null, true);
  }
}

function assertPrivateUpdateRouteRootWorkLoopDiagnostic(diagnostic, request) {
  assert.equal(Object.isFrozen(diagnostic), true);
  assert.equal(
    diagnostic.id,
    "react-test-renderer-update-route-root-work-loop-private-diagnostic"
  );
  assert.equal(
    diagnostic.diagnosticName,
    privateUpdateRouteRootWorkLoopDiagnosticName
  );
  assert.equal(diagnostic.status, privateUpdateRouteRootWorkLoopStatus);
  assert.equal(diagnostic.publicSurface, "create().update");
  assertPrivateUpdateRouteRootWorkLoopGate(diagnostic.gate);
  assertPrivateUpdateRouteRootWorkLoopAdmission(
    diagnostic.admissionRecord,
    request,
    {
      admitted: false,
      sourceDiagnostic: null
    }
  );
  assert.equal(
    diagnostic.privateUpdateRouteRootWorkLoopAdmission,
    diagnostic.admissionRecord
  );
  assert.equal(diagnostic.rootRequest, request);
  assert.equal(diagnostic.rootRequestId, request.requestId);
  assert.equal(diagnostic.rootRequestSequence, request.requestSequence);
  assert.equal(diagnostic.rootOperation, "update");
  assert.equal(diagnostic.hostOutputUpdateKind, "Update");
  assert.equal(Object.isFrozen(diagnostic.updateQueueMetadata), true);
  assert.equal(diagnostic.updateQueueMetadata.record, "UpdateContainerResult");
  assert.equal(
    diagnostic.updateQueueMetadata.scheduleRecord,
    "RootScheduleUpdateRecord"
  );
  assert.equal(
    diagnostic.updateQueueMetadata.scheduledUpdateRecord,
    "TestRendererRootScheduledUpdate"
  );
  assert.equal(diagnostic.updateQueueMetadata.laneSource, "update_container");
  assert.equal(
    diagnostic.updateQueueMetadata.queueMatchesRenderCurrentQueue,
    true
  );
  assert.equal(
    diagnostic.updateQueueMetadata.selectedLanesMatchRenderLanes,
    true
  );
  assert.equal(
    diagnostic.updateQueueMetadata.pendingLanesAfterEnqueueMatchRenderLanes,
    true
  );
  assert.equal(Object.isFrozen(diagnostic.rootWorkLoopMetadata), true);
  assert.equal(
    diagnostic.rootWorkLoopMetadata.renderPhaseRecord,
    "HostRootRenderPhaseRecord"
  );
  assert.equal(
    diagnostic.rootWorkLoopMetadata.commitRecord,
    "HostRootCommitRecord"
  );
  assert.equal(diagnostic.rootWorkLoopMetadata.appliedUpdateCount, 1);
  assert.equal(diagnostic.rootWorkLoopMetadata.skippedUpdateCount, 0);
  assert.equal(
    diagnostic.rootWorkLoopMetadata.commitCurrentMatchesRenderFinishedWork,
    true
  );
  assert.equal(
    diagnostic.rootWorkLoopMetadata.commitPreviousCurrentMatchesRenderCurrent,
    true
  );
  assert.equal(diagnostic.rootWorkLoopMetadata.commitLanesMatchRenderLanes, true);
  assert.equal(diagnostic.rootWorkLoopMetadata.remainingLanesEmpty, true);
  assert.equal(
    diagnostic.rootWorkLoopMetadata.rootCurrentMatchesCommitCurrent,
    true
  );
  assert.equal(Object.isFrozen(diagnostic.hostTextUpdateMetadata), true);
  assert.equal(
    diagnostic.hostTextUpdateMetadata.hostOutputUpdateRecord,
    "TestRendererUpdatedHostOutput"
  );
  assert.equal(
    diagnostic.hostTextUpdateMetadata.hostTextUpdateApplyRequired,
    true
  );
  assert.equal(diagnostic.hostTextUpdateMetadata.textUpdateApplyRecorded, true);
  assert.equal(diagnostic.hostTextUpdateMetadata.hostTextUpdateApplyCount, 1);
  assert.equal(
    diagnostic.hostTextUpdateMetadata.hostComponentUpdateApplyCount,
    1
  );
  assert.equal(
    diagnostic.consumesAcceptedHostRootUpdateQueueMetadata,
    true
  );
  assert.equal(diagnostic.consumesAcceptedRootWorkLoopMetadata, true);
  assert.equal(diagnostic.consumesManualHostOutputCanary, true);
  assert.equal(diagnostic.staleRootRejection, true);
  assert.equal(diagnostic.unmountedRootRejection, true);
  assert.equal(diagnostic.incompatibleFinishedWorkRejection, true);
  assert.equal(diagnostic.publicRootUpdateAvailable, false);
  assert.equal(diagnostic.publicSerializationAvailable, false);
  assert.equal(diagnostic.nativeExecution, false);
  assert.equal(diagnostic.rustExecutionFromJs, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
}

function assertPrivateUpdateRouteRootWorkLoopAdmission(
  admission,
  request,
  expected
) {
  assert.equal(Object.isFrozen(admission), true);
  assert.equal(admission.id, privateUpdateRouteRootWorkLoopAdmissionId);
  assert.equal(
    admission.kind,
    "FastReactTestRendererPrivateUpdateRouteRootWorkLoopAdmission"
  );
  assert.equal(
    admission.diagnosticName,
    privateUpdateRouteRootWorkLoopDiagnosticName
  );
  assert.equal(admission.status, privateUpdateRouteRootWorkLoopAdmissionStatus);
  assert.equal(
    admission.sourceDiagnosticStatus,
    privateUpdateRouteRootWorkLoopStatus
  );
  assert.equal(admission.publicSurface, "create().update");
  assertPrivateUpdateRouteRootWorkLoopGate(admission.gate);
  assert.equal(admission.rootRequest, request);
  assert.equal(admission.rootRequestId, request.requestId);
  assert.equal(admission.rootRequestSequence, request.requestSequence);
  assert.equal(admission.rootOperation, "update");
  assert.equal(admission.requestType, request.requestType);
  assert.equal(admission.requestApi, "TestRendererRoot::update");
  assert.equal(
    admission.admissionApi,
    "TestRendererRoot::describe_private_update_route_admission_for_canary"
  );
  assert.equal(
    admission.sourceDiagnosticApi,
    "TestRendererRoot::describe_private_update_route_via_root_work_loop_for_canary"
  );
  assert.equal(admission.updateKind, "Update");
  assert.equal(admission.updateOutcome, readRequestUpdateOutcome(request));
  assert.equal(admission.lifecycleStatusBefore, request.lifecycleStatusBefore);
  assert.equal(admission.lifecycleStatusAfter, request.lifecycleStatusAfter);
  assert.equal(admission.scheduled, readRequestScheduled(request));
  assert.equal(admission.admitted, expected.admitted);
  assert.equal(
    admission.readyToConsumeAcceptedRustEvidence,
    readRequestScheduled(request) &&
      readRequestUpdateOutcome(request) === rootUpdateOutcomeScheduled
  );
  assert.equal(
    admission.acceptedRustEvidenceConsumed,
    expected.sourceDiagnostic !== null
  );
  assert.equal(admission.sourceDiagnostic, expected.sourceDiagnostic);
  assertPrivateUpdateRouteQueueEvidence(admission.updateQueueEvidence);
  assertPrivateUpdateRouteRootWorkLoopEvidence(admission.rootWorkLoopEvidence);
  assertPrivateUpdateRouteHostOutputEvidence(admission.hostOutputEvidence);
  assert.equal(
    admission.consumesAcceptedHostRootUpdateQueueMetadata,
    admission.readyToConsumeAcceptedRustEvidence
  );
  assert.equal(
    admission.consumesAcceptedRootWorkLoopMetadata,
    admission.readyToConsumeAcceptedRustEvidence
  );
  assert.equal(
    admission.consumesAcceptedHostOutputMetadata,
    admission.readyToConsumeAcceptedRustEvidence
  );
  assert.equal(admission.consumesManualHostOutputCanary, true);
  assert.equal(admission.staleRootLifecycleRejection, true);
  assert.equal(admission.staleHostOutputRejection, true);
  assert.equal(admission.missingUpdateQueueEvidenceRejection, true);
  assert.equal(admission.staleRootRejection, true);
  assert.equal(admission.unmountedRootRejection, true);
  assert.equal(admission.incompatibleFinishedWorkRejection, true);
  assert.equal(admission.publicRootUpdateAvailable, false);
  assert.equal(admission.publicSerializationAvailable, false);
  assert.equal(admission.publicRendererRootCreated, false);
  assert.equal(admission.nativeBridgeAvailable, false);
  assert.equal(admission.nativeExecution, false);
  assert.equal(admission.rustExecutionFromJs, false);
  assert.equal(admission.compatibilityClaimed, false);
}

function assertPrivateUpdateRouteQueueEvidence(evidence) {
  assert.equal(Object.isFrozen(evidence), true);
  assert.equal(evidence.record, "UpdateContainerResult");
  assert.equal(evidence.scheduleRecord, "RootScheduleUpdateRecord");
  assert.equal(evidence.scheduledUpdateRecord, "TestRendererRootScheduledUpdate");
  assert.equal(evidence.laneSource, "update_container");
  assert.equal(evidence.queueMatchesRenderCurrentQueue, true);
  assert.equal(evidence.selectedLanesMatchRenderLanes, true);
  assert.equal(evidence.pendingLanesAfterEnqueueMatchRenderLanes, true);
}

function assertPrivateUpdateRouteRootWorkLoopEvidence(evidence) {
  assert.equal(Object.isFrozen(evidence), true);
  assert.equal(evidence.renderPhaseRecord, "HostRootRenderPhaseRecord");
  assert.equal(evidence.commitRecord, "HostRootCommitRecord");
  assert.equal(evidence.appliedUpdateCount, 1);
  assert.equal(evidence.skippedUpdateCount, 0);
  assert.equal(evidence.remainingLanesEmpty, true);
  assert.equal(evidence.commitCurrentMatchesRenderFinishedWork, true);
  assert.equal(evidence.commitPreviousCurrentMatchesRenderCurrent, true);
  assert.equal(evidence.commitLanesMatchRenderLanes, true);
  assert.equal(evidence.rootCurrentMatchesCommitCurrent, true);
}

function assertPrivateUpdateRouteHostOutputEvidence(evidence) {
  assert.equal(Object.isFrozen(evidence), true);
  assert.equal(evidence.hostOutputUpdateRecord, "TestRendererUpdatedHostOutput");
  assert.equal(evidence.hostTextUpdateApplyRequired, true);
  assert.equal(evidence.textUpdateApplyRecorded, true);
  assert.equal(evidence.hostTextUpdateApplyCount, 1);
  assert.equal(evidence.hostComponentUpdateApplyCount, 1);
}

function readRequestScheduled(request) {
  return Object.hasOwn(request, "scheduled")
    ? request.scheduled
    : request.schedulesRootUpdate;
}

function readRequestUpdateOutcome(request) {
  return request.updateOutcome ?? request.rustOutcome;
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
  const expectedAcceptedPrerequisiteIds = cjsDevelopmentOnly
    ? acceptedPrivateActFlushCjsDevelopmentPrerequisiteIds
    : isCjs
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
      "worker-482-test-renderer-act-scheduler-flush-gate",
      "worker-517-test-renderer-act-warning-thenable-blockers",
      "worker-518-scheduler-mock-expired-act-route",
      "worker-541-test-renderer-act-nested-scope-blockers",
      "worker-576-test-renderer-act-private-root-passive-sequence",
      "worker-622-scheduler-mock-act-root-work-execution",
      "worker-640-test-renderer-act-scheduler-flush-execution",
      "worker-670-test-renderer-act-passive-native-flush"
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
    assert.equal(gate.privateMockSchedulerExpiredWorkMetadataRouted, true);
    assert.equal(
      gate.privateMockSchedulerExpiredActRootWorkMetadataRouted,
      true
    );
    assert.equal(
      gate.mockSchedulerExpiredWorkActRouteDiagnosticsReady,
      true
    );
    assert.equal(gate.mockSchedulerExpiredActRootWorkDiagnosticsReady, true);
    assert.equal(gate.recognizesExpiredMockSchedulerMetadata, true);
    assert.equal(gate.recognizesExpiredActRootWorkMetadata, true);
    assert.equal(
      gate.linksExpiredCallbacksToAcceptedActRootWorkRecords,
      true
    );
    assert.equal(gate.publicSchedulerFlushBehaviorExecuted, false);
    assert.equal(gate.privateNativeUpdateExecutionMetadataAccepted, true);
    assert.equal(
      gate.privateNativeUpdatePassiveEffectDrainMetadataConsumed,
      true
    );
    assert.equal(
      gate.privateNativeUpdatePassiveEffectDrainDiagnosticId,
      actNativeUpdatePassiveDrainRecordId
    );
    assert.equal(
      gate.privateNativeUpdatePassiveEffectDrainPrerequisiteId,
      actNativeUpdatePassiveDrainPrerequisiteId
    );
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
  assert.equal(
    gate.warningThenableBlockerDiagnosticsAccepted,
    cjsDevelopmentOnly ? true : undefined
  );
  assert.equal(
    gate.nestedScopeBlockerDiagnosticsAccepted,
    cjsDevelopmentOnly ? true : undefined
  );
  assert.equal(
    gate.privateRootPassivePrerequisiteSequenceAccepted,
    cjsDevelopmentOnly ? true : undefined
  );
  assert.equal(
    gate.publicActScopeDepthTrackingAvailable,
    cjsDevelopmentOnly ? false : undefined
  );
  assert.equal(
    gate.publicNestedActQueueReuseAvailable,
    cjsDevelopmentOnly ? false : undefined
  );
  assert.equal(
    gate.publicOverlappingActWarningEmissionAvailable,
    cjsDevelopmentOnly ? false : undefined
  );
  assert.equal(
    gate.publicActThenableSettlementAvailable,
    cjsDevelopmentOnly ? false : undefined
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
    cjsDevelopmentOnly
      ? [
          ...actSchedulerMissingBeforeExecution,
          ...actSchedulerWarningThenableMissingBeforeExecution,
          ...actSchedulerNestedScopeMissingBeforeExecution
        ]
      : actSchedulerMissingBeforeExecution
  );

  if (cjsDevelopmentOnly) {
    const nestedScopeRecord =
      gate.recognizedSchedulerReactActQueueDiagnostics.find(
        (record) =>
          record.id === "react-test-renderer-act-nested-scope-blockers"
      );
    assert.notEqual(nestedScopeRecord, undefined);
    assert.equal(
      nestedScopeRecord.status,
      "blocked-private-react-test-renderer-act-nested-scope-diagnostics-only"
    );
    assert.deepEqual(nestedScopeRecord.nestedScopeBlockerIds, [
      "react-test-renderer-act-nested-sync-scope-blocker",
      "react-test-renderer-act-overlapping-async-scope-blocker",
      "react-test-renderer-act-overlapping-sync-async-scope-blocker"
    ]);
    assert.deepEqual(
      nestedScopeRecord.blockedPublicPrerequisiteIds,
      actSchedulerNestedScopeMissingBeforeExecution
    );
    assert.equal(
      gate.recognizedActNestedScopeBlockers.id,
      "react-test-renderer-act-nested-scope-blockers"
    );
    assert.equal(
      gate.privateActQueueFlushDiagnostics.nestedScopeBlockerDiagnostics.id,
      "react-test-renderer-act-nested-scope-blockers"
    );
    assert.equal(nestedScopeRecord.invokesActCallback, false);
    assert.equal(nestedScopeRecord.drainsPublicReactActQueue, false);
    assert.equal(nestedScopeRecord.drainsPublicSchedulerTaskQueue, false);
    assert.equal(
      nestedScopeRecord.publicSchedulerFlushExecutionAvailable,
      false
    );
    assert.equal(nestedScopeRecord.executesQueuedWork, false);
    assert.equal(nestedScopeRecord.executesEffects, false);
    assert.equal(nestedScopeRecord.executesPassiveEffects, false);
    assert.equal(nestedScopeRecord.compatibilityClaimed, false);

    const sequenceRecord =
      gate.recognizedSchedulerReactActQueueDiagnostics.find(
        (record) => record.id === actPrivateRootPassiveSequenceRecordId
      );
    assert.notEqual(sequenceRecord, undefined);
    assert.equal(
      sequenceRecord.status,
      "blocked-private-react-test-renderer-act-root-passive-sequence-diagnostics-only"
    );
    assert.deepEqual(
      sequenceRecord.requiredPrerequisiteIds,
      actPrivateRootPassiveRequiredPrerequisiteIds
    );
    assert.deepEqual(
      sequenceRecord.prerequisiteSequence.map((row) => row.phase),
      actPrivateRootPassiveSequencePhases
    );
    assert.deepEqual(
      sequenceRecord.prerequisiteSequence.map((row) => row.order),
      [0, 1, 2, 3, 4]
    );
    assert.equal(
      sequenceRecord.privateRootRequestPrerequisiteMetadataAccepted,
      true
    );
    assert.equal(
      sequenceRecord.schedulerFlushHelperPrerequisiteMetadataAccepted,
      true
    );
    assert.equal(
      sequenceRecord.passiveSchedulerPrerequisiteMetadataAccepted,
      true
    );
    assert.equal(sequenceRecord.publicActBlockerPrerequisiteRowsAccepted, true);
    assert.equal(
      gate.recognizedPrivateRootPassivePrerequisiteSequence,
      sequenceRecord.diagnostics
    );
    assert.equal(
      gate.privateActQueueFlushDiagnostics
        .rootPassivePrerequisiteSequenceDiagnostics,
      sequenceRecord.diagnostics
    );
    const sequenceReport =
      sequenceRecord.diagnostics
        .assertAcceptedPrivateRootPassivePrerequisiteSequence(
          gate.acceptedPrivateFlushPrerequisites
        );
    assert.equal(sequenceReport.accepted, true);
    assert.equal(sequenceReport.rejectionReason, null);
    for (const [missingId, expectedReason] of [
      [
        "test-renderer-private-root-request-records",
        "missing-root-request-prerequisite-metadata"
      ],
      [
        "scheduler-mock-flush-helper-metadata",
        "missing-scheduler-flush-helper-prerequisite-metadata"
      ],
      [
        "passive-effect-scheduler-flush-metadata",
        "missing-passive-scheduler-prerequisite-metadata"
      ]
    ]) {
      const missingPrerequisites =
        gate.acceptedPrivateFlushPrerequisites.filter(
          (prerequisite) => prerequisite.id !== missingId
        );
      const rejected =
        sequenceRecord.diagnostics
          .describeAcceptedPrivateRootPassivePrerequisiteSequence(
            missingPrerequisites
          );
      assert.equal(rejected.accepted, false, missingId);
      assert.equal(rejected.rejectionReason, expectedReason, missingId);
    }
    assert.equal(sequenceRecord.invokesActCallback, false);
    assert.equal(sequenceRecord.awaitsThenables, false);
    assert.equal(sequenceRecord.emitsWarnings, false);
    assert.equal(sequenceRecord.executesQueuedWork, false);
    assert.equal(sequenceRecord.executesScheduledCallbacks, false);
    assert.equal(sequenceRecord.executesPassiveEffects, false);
    assert.equal(sequenceRecord.executesRootRequests, false);
    assert.equal(sequenceRecord.compatibilityClaimed, false);

    const expiredActRootWorkRecord =
      gate.recognizedSchedulerReactActQueueDiagnostics.find(
        (record) =>
          record.id ===
          "test-renderer-mock-scheduler-expired-act-root-work-route"
      );
    assert.notEqual(expiredActRootWorkRecord, undefined);
    assert.equal(
      expiredActRootWorkRecord.routeStatus,
      mockSchedulerExpiredActRootWorkRoutingStatus
    );
    assert.equal(
      expiredActRootWorkRecord.metadataKind,
      privateSchedulerMockExpiredActRootWorkMetadataKind
    );
    assert.deepEqual(expiredActRootWorkRecord.buildsOnWorkers, [
      "worker-610-test-renderer-create-native-bridge-admission",
      "worker-622-scheduler-mock-act-root-work-execution"
    ]);
    assert.equal(
      expiredActRootWorkRecord.createsExpiredActRootWorkMetadataFromPrivateRootRequest,
      true
    );
    assert.equal(
      expiredActRootWorkRecord.linksExpiredCallbacksToAcceptedActRootWorkRecords,
      true
    );
    assert.equal(
      expiredActRootWorkRecord.drainsPublicSchedulerTaskQueue,
      false
    );
    assert.equal(expiredActRootWorkRecord.executesRendererWork, false);

    const nativeUpdatePassiveRecord =
      gate.recognizedSchedulerReactActQueueDiagnostics.find(
        (record) => record.id === actNativeUpdatePassiveDrainRecordId
      );
    assert.notEqual(nativeUpdatePassiveRecord, undefined);
    assert.equal(
      nativeUpdatePassiveRecord.status,
      "private-act-native-update-passive-effect-drain-public-act-blocked"
    );
    assert.deepEqual(nativeUpdatePassiveRecord.buildsOnWorkers, [
      "worker-473-test-renderer-act-passive-effect-drain",
      "worker-637-test-renderer-update-native-execution"
    ]);
    assert.equal(
      nativeUpdatePassiveRecord.nativeUpdateExecutionResultKind,
      "FastReactTestRendererPrivateRootExecutionResult"
    );
    assert.equal(
      nativeUpdatePassiveRecord.consumesAcceptedNativeUpdateExecution,
      true
    );
    assert.equal(
      nativeUpdatePassiveRecord.consumesPrivateUpdateNativeBridgeAdmission,
      true
    );
    assert.equal(
      nativeUpdatePassiveRecord.drainsAcceptedPendingPassiveFlushMetadata,
      true
    );
    assert.equal(nativeUpdatePassiveRecord.publicActCompatibilityClaimed, false);
    assert.equal(
      nativeUpdatePassiveRecord.publicUpdateCompatibilityClaimed,
      false
    );
    assert.equal(nativeUpdatePassiveRecord.executesRendererRoots, false);
    assert.equal(nativeUpdatePassiveRecord.executesPassiveEffects, false);
  } else {
    const nestedScopeRecord =
      gate.recognizedSchedulerReactActQueueDiagnostics.find(
        (record) =>
          record.id === "react-test-renderer-act-nested-scope-blockers"
      );
    assert.equal(nestedScopeRecord, undefined);
    assert.equal(gate.recognizedActNestedScopeBlockers, undefined);
    assert.equal(
      gate.recognizedPrivateRootPassivePrerequisiteSequence,
      undefined
    );
    assert.equal(
      gate.privateActQueueFlushDiagnostics.nestedScopeBlockerDiagnostics,
      undefined
    );
    assert.equal(
      gate.privateActQueueFlushDiagnostics
        .rootPassivePrerequisiteSequenceDiagnostics,
      undefined
    );
    assert.equal(
      gate.recognizedSchedulerReactActQueueDiagnostics.find(
        (record) =>
          record.id ===
          "test-renderer-mock-scheduler-expired-act-root-work-route"
      ),
      undefined
    );
    assert.equal(
      gate.recognizedSchedulerReactActQueueDiagnostics.find(
        (record) => record.id === actNativeUpdatePassiveDrainRecordId
      ),
      undefined
    );
  }

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

test("public promotion rows reject 503-533 private test-renderer compatibility", () => {
  const testRendererRows =
    REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS.filter(
      (row) => row.primaryCompatibilityArea === "test-renderer"
    );

  assert.deepEqual(
    testRendererRows.map((row) => row.workerId),
    ["515", "516", "517", "518", "530"]
  );

  for (const row of testRendererRows) {
    assert.equal(row.promotion, "rejected", row.id);
    assert.equal(row.privateEvidenceOnly, true, row.id);
    assert.equal(row.compatibilityClaimed, false, row.id);
    assert.equal(row.publicTestRendererCompatibilityClaimed, false, row.id);
    assert.equal(
      row.publicCompatibilityClaims.publicTestRendererCompatibilityClaimed,
      false,
      row.id
    );
    assert.equal(row.comparedToReactTestRendererOracle, false, row.id);
    assert.ok(
      row.blockedPublicCompatibilitySurfaces.includes("test-renderer"),
      row.id
    );
  }
});

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
