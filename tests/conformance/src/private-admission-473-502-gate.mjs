import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_473_502_GATE_ID =
  "private-admission-473-502-local-gate-1";
export const PRIVATE_ADMISSION_473_502_GATE_STATUS =
  "recognized-accepted-private-diagnostics-public-compatibility-blocked";
export const PRIVATE_ADMISSION_473_502_VIOLATION_STATUS =
  "blocked-accepted-private-diagnostics-with-violations";

export const PRIVATE_ADMISSION_473_502_WORKERS = Object.freeze([
  "worker-473-test-renderer-act-passive-effect-drain",
  "worker-474-passive-effect-mount-unmount-execution-gate",
  "worker-475-passive-effect-error-routing-gate",
  "worker-476-root-commit-effect-ordering-canary",
  "worker-477-function-component-use-memo-bailout-gate",
  "worker-478-function-component-use-effect-update-gate",
  "worker-479-context-multi-consumer-propagation-gate",
  "worker-480-suspense-offscreen-blocker-diagnostics",
  "worker-481-deletion-passive-ref-cleanup-order-gate",
  "worker-482-test-renderer-act-scheduler-flush-gate",
  "worker-483-test-renderer-flush-sync-act-routing-gate",
  "worker-484-test-instance-find-by-private-query-gate",
  "worker-485-test-renderer-totree-multichild-gate",
  "worker-486-react-dom-root-render-private-host-output",
  "worker-487-dom-event-prevent-default-gate",
  "worker-488-dom-event-error-routing-gate",
  "worker-489-hydration-event-replay-ownership-gate",
  "worker-490-controlled-checkbox-radio-restore-gate",
  "worker-491-resource-stylesheet-precedence-gate",
  "worker-492-form-submit-action-metadata-gate",
  "worker-493-scheduler-mock-yield-paint-gate",
  "worker-494-scheduler-post-task-abort-diagnostics",
  "worker-495-native-batched-json-transport-gate",
  "worker-496-native-cross-environment-teardown-gate",
  "worker-497-package-surface-private-facade-audit",
  "worker-498-benchmark-act-passive-timing-canaries",
  "worker-499-root-render-e2e-act-passive-admission",
  "worker-500-conformance-act-passive-local-gate-refresh",
  "worker-501-root-commit-callback-lane-order-gate",
  "worker-502-react-dom-test-utils-act-passive-gate"
]);

function evidence(path, tokens) {
  return freezeRecord({
    path,
    tokens: freezeArray(tokens)
  });
}

function claims(claimsById) {
  return freezeRecord(claimsById);
}

function row({
  workerId,
  area,
  acceptedDiagnosticIds,
  evidence: evidenceRows,
  publicCompatibilityClaims
}) {
  return freezeRecord({
    workerId,
    area,
    privateAdmission: "accepted-private-diagnostic",
    localGateCoverage: "private-admission-473-502-local-gate",
    acceptedDiagnosticIds: freezeArray(acceptedDiagnosticIds),
    evidence: freezeArray(evidenceRows),
    compatibilityClaimed: false,
    publicCompatibilityClaims: claims(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims))
  });
}

export const PRIVATE_ADMISSION_473_502_ROWS = freezeArray([
  row({
    workerId: "worker-473-test-renderer-act-passive-effect-drain",
    area: "react-test-renderer private act passive drain",
    acceptedDiagnosticIds: [
      "passive-effect-flush-metadata",
      "sync-flush-post-passive-private-execution-metadata"
    ],
    evidence: [
      evidence("tests/conformance/src/act-passive-local-gate.mjs", [
        "worker-473-test-renderer-act-passive-effect-drain",
        "passive-effect-flush-metadata",
        "publicActCompatibilityClaimed: false"
      ]),
      evidence("packages/react-test-renderer/cjs/react-test-renderer.development.js", [
        "createAcceptedPendingPassiveFlushMetadata",
        "consumeAcceptedPendingPassiveFlushMetadata",
        "drained-accepted-pending-passive-flush-metadata"
      ])
    ],
    publicCompatibilityClaims: {
      publicActCompatibilityClaimed: false,
      publicPassiveEffectExecution: false
    }
  }),
  row({
    workerId: "worker-474-passive-effect-mount-unmount-execution-gate",
    area: "private passive create/destroy callback test gate",
    acceptedDiagnosticIds: [
      "PassiveEffectCallbackInvocationTestControl",
      "invoke_passive_effect_callbacks_under_test_control"
    ],
    evidence: [
      evidence("tests/conformance/src/act-passive-local-gate.mjs", [
        "worker-474-passive-effect-mount-unmount-execution-gate",
        "invoke_passive_effect_callbacks_under_test_control",
        "publicEffectExecutionEnabled: false"
      ]),
      evidence("crates/fast-react-reconciler/src/passive_effects.rs", [
        "PassiveEffectCallbackInvocationTestControl",
        "invoke_passive_effect_callbacks_under_test_control",
        "public_effect_execution_enabled",
        "public_act_compatibility_claimed"
      ])
    ],
    publicCompatibilityClaims: {
      publicEffectExecutionEnabled: false,
      schedulerDrivenPassiveExecutionEnabled: false,
      publicActCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-475-passive-effect-error-routing-gate",
    area: "private passive effect error diagnostics",
    acceptedDiagnosticIds: [
      "PassiveEffectRootErrorRoutingRecord",
      "PassiveEffectDestroyCallbackErrorRecord"
    ],
    evidence: [
      evidence("tests/conformance/src/act-passive-local-gate.mjs", [
        "worker-475-passive-effect-error-routing-gate",
        "PassiveEffectDestroyCallbackErrorRecord",
        "publicRootErrorCallbackCompatibilityClaimed: false"
      ]),
      evidence("crates/fast-react-reconciler/src/passive_effects.rs", [
        "PassiveEffectRootErrorRoutingRecord",
        "PassiveEffectDestroyCallbackErrorRecord",
        "public_act_compatibility_claimed"
      ])
    ],
    publicCompatibilityClaims: {
      publicRootErrorCallbackCompatibilityClaimed: false,
      publicErrorBoundaryCompatibilityClaimed: false,
      publicActErrorAggregationClaimed: false
    }
  }),
  row({
    workerId: "worker-476-root-commit-effect-ordering-canary",
    area: "root commit private effect ordering metadata",
    acceptedDiagnosticIds: ["HostRootCommitOrderDiagnosticsForCanary"],
    evidence: [
      evidence("crates/fast-react-reconciler/src/root_commit.rs", [
        "HostRootCommitOrderDiagnosticsForCanary",
        "commit_order_diagnostics_for_canary",
        "root_commit_records_private_effect_metadata_in_deterministic_commit_order_without_execution",
        "public_effect_execution_enabled",
        "public_act_compatibility_claimed"
      ])
    ],
    publicCompatibilityClaims: {
      publicEffectExecutionEnabled: false,
      publicActCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-477-function-component-use-memo-bailout-gate",
    area: "function component private useMemo update diagnostics",
    acceptedDiagnosticIds: [
      "FunctionComponentMemoUpdateRecord",
      "FunctionComponentMemoUpdateDiagnostics"
    ],
    evidence: [
      evidence("crates/fast-react-reconciler/src/function_component.rs", [
        "FunctionComponentMemoUpdateRecord",
        "FunctionComponentMemoUpdateDiagnostics",
        "private_use_memo_update_diagnostics_count_reuse_and_recompute"
      ]),
      evidence("packages/react/hook-dispatcher.js", [
        "fast-react.private.memo_hook_dispatcher",
        "FunctionComponentMemoUpdateDiagnosticRecord",
        "compatibilityClaimed: false"
      ])
    ],
    publicCompatibilityClaims: {
      publicUseMemoCompatibilityClaimed: false,
      publicHookDispatcherCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-478-function-component-use-effect-update-gate",
    area: "function component private useEffect update metadata",
    acceptedDiagnosticIds: [
      "private-use-effect-update-render-metadata",
      "passive-effect-metadata"
    ],
    evidence: [
      evidence("crates/fast-react-reconciler/src/function_component.rs", [
        "render_function_component_with_use_effect",
        "private_use_effect_render_path_update_changed_deps_records_passive_phase_metadata",
        "passive_effect_metadata"
      ]),
      evidence("packages/react/hook-dispatcher.js", [
        "useEffect",
        "compatibilityClaimed: false"
      ])
    ],
    publicCompatibilityClaims: {
      publicUseEffectCompatibilityClaimed: false,
      publicPassiveEffectExecution: false
    }
  }),
  row({
    workerId: "worker-479-context-multi-consumer-propagation-gate",
    area: "nested provider two-consumer context propagation diagnostics",
    acceptedDiagnosticIds: [
      "NestedContextProviderTwoConsumerUseContextBeginWorkRecord",
      "HostRootNestedContextProviderTwoConsumerPropagationGateRecord"
    ],
    evidence: [
      evidence("crates/fast-react-reconciler/src/begin_work.rs", [
        "NestedContextProviderTwoConsumerUseContextBeginWorkRecord",
        "begin_work_nested_context_provider_two_consumer_use_context_children"
      ]),
      evidence("crates/fast-react-reconciler/src/root_work_loop.rs", [
        "HostRootNestedContextProviderTwoConsumerPropagationGateRecord",
        "root_work_loop_nested_context_provider_change_propagation_marks_two_consumers_and_unwinds"
      ])
    ],
    publicCompatibilityClaims: {
      publicContextPropagationCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-480-suspense-offscreen-blocker-diagnostics",
    area: "Suspense and Offscreen fail-closed child shape diagnostics",
    acceptedDiagnosticIds: [
      "UnsupportedSuspenseChildShapeRecord",
      "UnsupportedOffscreenChildShapeRecord"
    ],
    evidence: [
      evidence("crates/fast-react-reconciler/src/begin_work.rs", [
        "UnsupportedSuspenseChildShapeRecord",
        "UnsupportedOffscreenChildShapeRecord"
      ]),
      evidence("crates/fast-react-reconciler/src/root_work_loop.rs", [
        "HostRootChildBeginWorkPreflightError::UnsupportedSuspenseChildShape",
        "root_work_loop_pinged_retry_scheduler_handoff_keeps_blocker_tags_fail_closed"
      ])
    ],
    publicCompatibilityClaims: {
      publicSuspenseCompatibilityClaimed: false,
      publicOffscreenCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-481-deletion-passive-ref-cleanup-order-gate",
    area: "deletion cleanup order for ref cleanup and passive destroy metadata",
    acceptedDiagnosticIds: ["HostRootDeletionCleanupOrderGateSnapshot"],
    evidence: [
      evidence("crates/fast-react-reconciler/src/root_commit.rs", [
        "HostRootDeletionCleanupOrderGateSnapshot",
        "deletion_cleanup_order_gate_for_canary",
        "HostRootDeletionCleanupOrderPhase::RefCleanupReturn",
        "HostRootDeletionCleanupOrderPhase::PassiveDestroy"
      ]),
      evidence("crates/fast-react-test-renderer/src/lib.rs", [
        "deletion_cleanup_order_gate_for_canary",
        "public_ref_or_effect_compatibility_claimed"
      ])
    ],
    publicCompatibilityClaims: {
      publicRefCompatibilityClaimed: false,
      publicEffectCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-482-test-renderer-act-scheduler-flush-gate",
    area: "react-test-renderer private Scheduler flush metadata",
    acceptedDiagnosticIds: [
      "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__"
    ],
    evidence: [
      evidence("tests/conformance/src/act-passive-local-gate.mjs", [
        "worker-482-test-renderer-act-scheduler-flush-gate",
        "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__",
        "publicSchedulerTimingCompatibilityClaimed: false"
      ]),
      evidence("packages/react-test-renderer/cjs/react-test-renderer.development.js", [
        "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__",
        "schedulerMockFlushHelperMetadataAccepted",
        "compatibilityClaimed: false"
      ])
    ],
    publicCompatibilityClaims: {
      publicSchedulerFlushExecutionAvailable: false,
      publicSchedulerTimingCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-483-test-renderer-flush-sync-act-routing-gate",
    area: "react-test-renderer private flushSync act metadata routing",
    acceptedDiagnosticIds: ["create().unstable_flushSync"],
    evidence: [
      evidence("tests/conformance/src/act-passive-local-gate.mjs", [
        "worker-483-test-renderer-flush-sync-act-routing-gate",
        "create().unstable_flushSync",
        "publicRootSyncFlushRouteAvailable: false"
      ]),
      evidence("packages/react-test-renderer/cjs/react-test-renderer.development.js", [
        "privateFlushSyncActRoutingDiagnosticsSymbol",
        "syncFlushActRecordsAccepted",
        "compatibilityClaimed: false"
      ])
    ],
    publicCompatibilityClaims: {
      publicRootSyncFlushRouteAvailable: false,
      publicActCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-484-test-instance-find-by-private-query-gate",
    area: "react-test-renderer private TestInstance findBy query diagnostics",
    acceptedDiagnosticIds: ["private-findby-query-diagnostics-ready"],
    evidence: [
      evidence("crates/fast-react-test-renderer/src/lib.rs", [
        "describe_private_test_instance_find_by_query_for_canary",
        "findByType",
        "findByProps",
        "public_query_method_available"
      ]),
      evidence("packages/react-test-renderer/cjs/react-test-renderer.development.js", [
        "worker-484-test-instance-find-by-private-query-gate",
        "private-findby-query-diagnostics-ready-public-method-blocked"
      ])
    ],
    publicCompatibilityClaims: {
      publicFindByTypeAvailable: false,
      publicFindByPropsAvailable: false
    }
  }),
  row({
    workerId: "worker-485-test-renderer-totree-multichild-gate",
    area: "react-test-renderer private toTree multi-child metadata",
    acceptedDiagnosticIds: ["private-totree-multi-child-host-output-metadata"],
    evidence: [
      evidence("crates/fast-react-test-renderer/src/lib.rs", [
        "describe_private_to_tree_composite_above_host_shape_from_snapshot_for_diagnostics",
        "root_private_to_tree_shape_diagnostics_wrap_composite_above_multi_child_host_output"
      ]),
      evidence("packages/react-test-renderer/cjs/react-test-renderer.development.js", [
        "worker-485-test-renderer-totree-multichild-gate",
        "react-test-renderer-private-totree-multi-child-host-output-metadata",
        "publicTreeAvailable: false"
      ])
    ],
    publicCompatibilityClaims: {
      publicTreeAvailable: false,
      publicToTreeCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-486-react-dom-root-render-private-host-output",
    area: "React DOM root facade private host-output render diagnostics",
    acceptedDiagnosticIds: [
      "ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_APPLIED"
    ],
    evidence: [
      evidence("packages/react-dom/src/client/root-bridge.js", [
        "privateRootPublicFacadeHostOutputRenderRecordType",
        "renderHostOutput(root, element, options)",
        "ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_APPLIED",
        "publicRootCompatibilitySurface: false",
        "compatibilityClaimed: false"
      ])
    ],
    publicCompatibilityClaims: {
      publicRootCompatibilitySurface: false,
      publicDomMutationCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-487-dom-event-prevent-default-gate",
    area: "React DOM private event preventDefault diagnostics",
    acceptedDiagnosticIds: ["defaultPreventedDiagnosticEnabled"],
    evidence: [
      evidence("packages/react-dom/src/events/plugin-event-system.js", [
        "defaultPreventedDiagnosticEnabled",
        "preventDefaultCallCount",
        "publicDispatchEnabled: false",
        "compatibilityClaimed: false"
      ]),
      evidence("tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs", [
        "defaultPreventedDiagnosticEnabled",
        "preventDefaultCallCount",
        "publicDispatchEnabled"
      ])
    ],
    publicCompatibilityClaims: {
      publicDispatchEnabled: false,
      publicEventCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-488-dom-event-error-routing-gate",
    area: "React DOM private event listener error routing diagnostics",
    acceptedDiagnosticIds: ["FastReactDomDispatchListenerErrorRouteRecord"],
    evidence: [
      evidence("packages/react-dom/src/events/plugin-event-system.js", [
        "FastReactDomDispatchListenerErrorRouteRecord",
        "createDispatchListenerErrorRouteRecord",
        "isDispatchListenerErrorRouteRecord",
        "publicDispatchEnabled: false",
        "compatibilityClaimed: false"
      ]),
      evidence("packages/react-dom/src/client/root-bridge.js", [
        "publicRootErrorCallbacksInvoked: false",
        "isDispatchListenerErrorRouteRecord"
      ])
    ],
    publicCompatibilityClaims: {
      publicDispatchEnabled: false,
      publicRootErrorCallbacksInvoked: false
    }
  }),
  row({
    workerId: "worker-489-hydration-event-replay-ownership-gate",
    area: "hydration replay boundary ownership diagnostics",
    acceptedDiagnosticIds: ["private-hydration-replay-ownership-gate"],
    evidence: [
      evidence("packages/react-dom/src/client/hydration-boundary-gate.js", [
        "private-hydration-replay-ownership-gate",
        "blocked-replay-ownership-retained-through-drain-order",
        "dehydratedBoundaryOwnershipRetainedCount",
        "compatibilityClaimed: false"
      ])
    ],
    publicCompatibilityClaims: {
      publicHydrationCompatibilityClaimed: false,
      publicReplayCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-490-controlled-checkbox-radio-restore-gate",
    area: "controlled checkbox/radio private restore metadata",
    acceptedDiagnosticIds: [
      "private-controlled-checkable-input-restore-metadata",
      "recorded-private-controlled-radio-group-restore-intent"
    ],
    evidence: [
      evidence("packages/react-dom/src/client/controlled-restore-queue.js", [
        "private-controlled-checkable-input-restore-metadata",
        "recorded-private-controlled-radio-group-restore-intent",
        "publicControlledBehaviorEnabled: false",
        "compatibilityClaimed: false"
      ]),
      evidence("packages/react-dom/src/dom-host/property-payload.js", [
        "private-controlled-checkable-input-restore-metadata",
        "recorded-private-controlled-radio-group-restore-intent",
        "publicControlledBehaviorEnabled: false"
      ])
    ],
    publicCompatibilityClaims: {
      publicControlledBehaviorEnabled: false,
      publicInputCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-491-resource-stylesheet-precedence-gate",
    area: "resource stylesheet precedence private diagnostics",
    acceptedDiagnosticIds: [
      "admitted-private-resource-hint-stylesheet-precedence-record"
    ],
    evidence: [
      evidence("packages/react-dom/src/resource-form-internals-gate.js", [
        "privateResourceHintStylesheetPrecedenceGateId",
        "admitted-private-resource-hint-stylesheet-precedence-record",
        "diagnosed-private-resource-hint-fake-dom-stylesheet-precedence-order",
        "publicStylesheetPrecedenceBehavior: false",
        "compatibilityClaimed: false"
      ]),
      evidence("packages/react-dom/src/resource-form-gates.js", [
        "publicStylesheetPrecedenceBehavior: false"
      ])
    ],
    publicCompatibilityClaims: {
      publicStylesheetPrecedenceBehavior: false,
      publicResourceCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-492-form-submit-action-metadata-gate",
    area: "private form action submit/reset metadata",
    acceptedDiagnosticIds: [
      "private-form-action-reset-dispatcher-metadata-only",
      "recorded-private-form-action-submission-intent"
    ],
    evidence: [
      evidence("packages/react-dom/src/resource-form-internals-gate.js", [
        "private-form-action-reset-dispatcher-metadata-only",
        "recorded-private-form-action-submission-intent",
        "recorded-private-form-action-reset-intent",
        "compatibilityClaimed: false"
      ])
    ],
    publicCompatibilityClaims: {
      publicFormActionBehaviorEnabled: false,
      publicFormCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-493-scheduler-mock-yield-paint-gate",
    area: "Scheduler mock private yield/paint diagnostics",
    acceptedDiagnosticIds: ["mockSchedulerYieldPaintDiagnosticsReady"],
    evidence: [
      evidence("packages/scheduler/cjs/scheduler-unstable_mock.development.js", [
        "getMockSchedulerYieldPaintSnapshot",
        "describeMockSchedulerYieldPaintState",
        "requestPaintForDiagnostics",
        "mockSchedulerYieldPaintDiagnosticsReady",
        "publicSchedulerTimingCompatibilityClaimed: false",
        "publicReactActCompatibilityClaimed: false"
      ])
    ],
    publicCompatibilityClaims: {
      publicSchedulerTimingCompatibilityClaimed: false,
      publicReactActCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-494-scheduler-post-task-abort-diagnostics",
    area: "Scheduler postTask private TaskController abort diagnostics",
    acceptedDiagnosticIds: ["shimmedTaskControllerCancellation"],
    evidence: [
      evidence("packages/scheduler/cjs/scheduler-unstable_post_task.development.js", [
        "TaskController",
        "shimmedTaskControllerCancellation",
        "describePrivatePostTaskController",
        "signalMatchesTaskController",
        "browserPostTaskCompatibilityClaimed: false",
        "publicSchedulerTimingCompatibilityClaimed: false",
        "compatibilityClaimed: false"
      ])
    ],
    publicCompatibilityClaims: {
      browserPostTaskCompatibilityClaimed: false,
      publicSchedulerTimingCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-495-native-batched-json-transport-gate",
    area: "native root bridge batched JSON transport diagnostics",
    acceptedDiagnosticIds: [
      "validated-native-root-bridge-batched-json-transport-records"
    ],
    evidence: [
      evidence("bindings/node/index.cjs", [
        "validated-native-root-bridge-batched-json-transport-records",
        "createNativeRootBridgeBatchedJsonTransportGate",
        "createNativeRootBridgeBatchedJsonTransportLifecycleRows"
      ]),
      evidence("crates/fast-react-napi/src/lib.rs", [
        "NativeRootBridgeBatchedJsonTransportGate",
        "NativeRootBridgeBatchedJsonTransportLifecycleRow"
      ])
    ],
    publicCompatibilityClaims: {
      publicNativeTransportCompatibilityClaimed: false,
      nativeAddonPublicBehaviorEnabled: false
    }
  }),
  row({
    workerId: "worker-496-native-cross-environment-teardown-gate",
    area: "native bridge handle-table cross-environment teardown diagnostics",
    acceptedDiagnosticIds: [
      "BridgeHandleTableTeardownIsolationDiagnostics",
      "first-root-stale-after-own-teardown"
    ],
    evidence: [
      evidence("crates/fast-react-napi/src/handle_table.rs", [
        "BridgeHandleTableTeardownIsolationDiagnostics",
        "bridge_handle_table_cross_environment_teardown_diagnostics",
        "first-root-stale-after-own-teardown"
      ])
    ],
    publicCompatibilityClaims: {
      publicNativeHandleCompatibilityClaimed: false,
      nativeCrossEnvironmentTeardownCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-497-package-surface-private-facade-audit",
    area: "package surface private facade guard audit",
    acceptedDiagnosticIds: [
      "exactPrivatePublicFileGuards",
      "reactPrivateDirectFiles"
    ],
    evidence: [
      evidence("tests/smoke/package-surface-guard.mjs", [
        "exactPrivatePublicFileGuards",
        "privateDiagnosticPublicFileGuards",
        "privateImplementationFiles"
      ]),
      evidence("tests/smoke/import-entrypoints.mjs", [
        "reactPrivateDirectFiles",
        "packageFileSubpaths('@fast-react/react', reactPrivateDirectFiles)"
      ])
    ],
    publicCompatibilityClaims: {
      publicPrivateFileImportCompatibilityClaimed: false,
      publicPackageSurfaceExpanded: false
    }
  }),
  row({
    workerId: "worker-498-benchmark-act-passive-timing-canaries",
    area: "diagnostic-only private act/passive timing canary",
    acceptedDiagnosticIds: [
      "private-passive-flush-gate-timing-canary",
      "react-dom-test-utils-private-passive-flush-diagnostic-gate-1"
    ],
    evidence: [
      evidence("tests/conformance/src/act-passive-local-gate.mjs", [
        "worker-498-benchmark-act-passive-timing-canaries",
        "diagnostic-only",
        "comparablePublicTimingClaimed: false"
      ]),
      evidence(
        "tests/benchmarks/manifests/private-root-update-text-event-passive-timing-canaries.json",
        [
          "react-dom-test-utils-private-passive-flush-diagnostic-gate-1",
          "diagnostic-only",
          "\"compatibilityClaimed\": false"
        ]
      )
    ],
    publicCompatibilityClaims: {
      comparablePublicTimingClaimed: false,
      publicActTimingPromotionAdmitted: false
    }
  }),
  row({
    workerId: "worker-499-root-render-e2e-act-passive-admission",
    area: "root render E2E private act/passive admission",
    acceptedDiagnosticIds: ["root-render-private-act-passive-diagnostic-gate-1"],
    evidence: [
      evidence("tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs", [
        "root-render-private-act-passive-diagnostic-gate-1",
        "private-root-render-act-passive-diagnostic",
        "public-act-passive-root-render-compatibility",
        "publicReactActCompatibilityClaimed: false",
        "publicRootRenderCompatibilityClaimed: false",
        "publicPassiveEffectCompatibilityClaimed: false"
      ])
    ],
    publicCompatibilityClaims: {
      publicReactActCompatibilityClaimed: false,
      publicReactDomTestUtilsActCompatibilityClaimed: false,
      publicRootRenderCompatibilityClaimed: false,
      publicPassiveEffectCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-500-conformance-act-passive-local-gate-refresh",
    area: "act/passive local conformance gate refresh",
    acceptedDiagnosticIds: ["act-passive-private-diagnostics-local-gate-1"],
    evidence: [
      evidence("tests/conformance/src/act-passive-local-gate.mjs", [
        "ACT_PASSIVE_LOCAL_GATE_QUEUE_WORKERS",
        "recognized-private-act-passive-diagnostics-without-public-compatibility",
        "publicCompatibilityClaimed"
      ]),
      evidence("tests/conformance/test/act-passive-local-gate.test.mjs", [
        "assert.equal(gate.publicCompatibilityClaimed, false)",
        "ACT_PASSIVE_LOCAL_GATE_QUEUE_WORKERS"
      ])
    ],
    publicCompatibilityClaims: {
      publicCompatibilityClaimed: false,
      actPassivePublicCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-501-root-commit-callback-lane-order-gate",
    area: "root update callback drain lane-order diagnostics",
    acceptedDiagnosticIds: ["HostRootCallbackDrainSnapshotForCanary"],
    evidence: [
      evidence("crates/fast-react-reconciler/src/root_commit.rs", [
        "root_update_callback_drain_snapshot_for_canary",
        "HostRootCallbackDrainSnapshotForCanary",
        "public_root_callback_behavior_exposed"
      ]),
      evidence("crates/fast-react-reconciler/src/sync_flush.rs", [
        "SyncFlushRootCallbackDrainDiagnosticsForCanary",
        "root_callback_drain_diagnostics_for_canary",
        "public_root_callback_behavior_exposed"
      ])
    ],
    publicCompatibilityClaims: {
      publicRootCallbackBehaviorExposed: false,
      publicRootCallbackCompatibilityClaimed: false
    }
  }),
  row({
    workerId: "worker-502-react-dom-test-utils-act-passive-gate",
    area: "React DOM test-utils act private passive routing gate",
    acceptedDiagnosticIds: [
      "react-dom-test-utils-act-private-routing-gate-5",
      "passive-effect-mount-unmount-execution-diagnostics",
      "passive-effect-root-error-routing-diagnostics"
    ],
    evidence: [
      evidence("packages/react-dom/src/test-utils-act-gate.js", [
        "react-dom-test-utils-act-private-routing-gate-5",
        "passive-effect-mount-unmount-execution-diagnostics",
        "passive-effect-root-error-routing-diagnostics",
        "publicCompatibilityClaimed: false",
        "publicReactActReady: false",
        "privateRoutingReady: false"
      ]),
      evidence("tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs", [
        "react-dom-test-utils-act-private-routing-gate-5",
        "publicCompatibilityClaimed: false"
      ])
    ],
    publicCompatibilityClaims: {
      publicCompatibilityClaimed: false,
      publicReactActReady: false,
      privateRoutingReady: false
    }
  })
]);

export function evaluatePrivateAdmission473502Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_473_502_ROWS.map((baseRow) => {
    const override = rowOverrides[baseRow.workerId] ?? {};
    return freezeRecord({
      ...baseRow,
      ...override,
      publicCompatibilityClaims: freezeRecord({
        ...baseRow.publicCompatibilityClaims,
        ...(override.publicCompatibilityClaims ?? {})
      })
    });
  });
  const evaluatedRows = rows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const manifestWorkerIds = rows.map((baseRow) => baseRow.workerId);
  const missingWorkerIds = PRIVATE_ADMISSION_473_502_WORKERS.filter(
    (workerId) => !manifestWorkerIds.includes(workerId)
  );
  const unexpectedWorkerIds = manifestWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_473_502_WORKERS.includes(workerId)
  );
  const duplicateWorkerIds = manifestWorkerIds.filter(
    (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
  );
  const unrecognizedWorkerIds = evaluatedRows
    .filter((evaluatedRow) => evaluatedRow.recognized !== true)
    .map((evaluatedRow) => evaluatedRow.workerId);
  const compatibilityClaimWorkerIds = evaluatedRows
    .filter((evaluatedRow) => evaluatedRow.compatibilityClaimed !== false)
    .map((evaluatedRow) => evaluatedRow.workerId);
  const publicCompatibilityViolations = evaluatedRows.flatMap((evaluatedRow) =>
    evaluatedRow.publicCompatibilityViolations.map((claimId) =>
      `${evaluatedRow.workerId}.${claimId}`
    )
  );
  const violations = [];

  if (
    missingWorkerIds.length > 0 ||
    unexpectedWorkerIds.length > 0 ||
    duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("accepted-private-worker-manifest-mismatch", {
        missingWorkerIds,
        unexpectedWorkerIds,
        duplicateWorkerIds
      })
    );
  }

  if (unrecognizedWorkerIds.length > 0) {
    violations.push(
      createViolation("required-private-diagnostic-not-recognized", {
        workerIds: unrecognizedWorkerIds
      })
    );
  }

  if (compatibilityClaimWorkerIds.length > 0) {
    violations.push(
      createViolation("private-diagnostic-claimed-compatibility", {
        workerIds: compatibilityClaimWorkerIds
      })
    );
  }

  if (publicCompatibilityViolations.length > 0) {
    violations.push(
      createViolation("public-compatibility-claim-detected", {
        claimIds: publicCompatibilityViolations
      })
    );
  }

  return freezeRecord({
    id: PRIVATE_ADMISSION_473_502_GATE_ID,
    status:
      violations.length === 0
        ? PRIVATE_ADMISSION_473_502_GATE_STATUS
        : PRIVATE_ADMISSION_473_502_VIOLATION_STATUS,
    queueWorkers: PRIVATE_ADMISSION_473_502_WORKERS,
    rows: evaluatedRows,
    rowsByWorker: freezeRecord(
      Object.fromEntries(
        evaluatedRows.map((evaluatedRow) => [
          evaluatedRow.workerId,
          evaluatedRow
        ])
      )
    ),
    recognizedWorkerIds: evaluatedRows
      .filter((evaluatedRow) => evaluatedRow.recognized === true)
      .map((evaluatedRow) => evaluatedRow.workerId),
    privateDiagnosticsRecognized:
      unrecognizedWorkerIds.length === 0 &&
      missingWorkerIds.length === 0 &&
      unexpectedWorkerIds.length === 0 &&
      duplicateWorkerIds.length === 0,
    compatibilityClaimed:
      compatibilityClaimWorkerIds.length > 0 ||
      publicCompatibilityViolations.length > 0,
    publicCompatibilityClaimed: publicCompatibilityViolations.length > 0,
    publicCompatibilityViolationIds: freezeArray(publicCompatibilityViolations),
    manifest: freezeRecord({
      expectedWorkerIds: PRIVATE_ADMISSION_473_502_WORKERS,
      actualWorkerIds: freezeArray(manifestWorkerIds),
      missingWorkerIds: freezeArray(missingWorkerIds),
      unexpectedWorkerIds: freezeArray(unexpectedWorkerIds),
      duplicateWorkerIds: freezeArray(duplicateWorkerIds)
    }),
    violations: freezeArray(violations)
  });
}

function evaluatePrivateAdmissionRow({ fileCache, row, workspaceRoot }) {
  const evaluatedEvidence = (row.evidence ?? []).map((evidenceRow) =>
    evaluateEvidenceRow({
      evidenceRow,
      fileCache,
      workspaceRoot
    })
  );
  const evidenceRecognized = evaluatedEvidence.every(
    (evidenceRow) => evidenceRow.recognized === true
  );
  const publicCompatibilityViolations = Object.entries(
    row.publicCompatibilityClaims ?? {}
  )
    .filter(([, value]) => value !== false)
    .map(([claimId]) => claimId);

  return freezeRecord({
    ...row,
    evidence: freezeArray(evaluatedEvidence),
    evidenceRecognized,
    recognized:
      typeof row.recognized === "boolean" ? row.recognized : evidenceRecognized,
    publicCompatibilityViolations: freezeArray(publicCompatibilityViolations)
  });
}

function evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot }) {
  const source = readWorkspaceFile({ fileCache, workspaceRoot, path: evidenceRow.path });
  const tokenResults = evidenceRow.tokens.map((token) =>
    freezeRecord({
      token,
      present: source.text.includes(token)
    })
  );
  const missingTokens = tokenResults
    .filter((tokenResult) => tokenResult.present !== true)
    .map((tokenResult) => tokenResult.token);

  return freezeRecord({
    path: evidenceRow.path,
    tokens: evidenceRow.tokens,
    tokenResults: freezeArray(tokenResults),
    missingTokens: freezeArray(missingTokens),
    recognized: source.ok === true && missingTokens.length === 0,
    readError: source.error
  });
}

function readWorkspaceFile({ fileCache, workspaceRoot, path }) {
  if (fileCache.has(path)) {
    return fileCache.get(path);
  }

  let source;
  try {
    source = freezeRecord({
      ok: true,
      text: readFileSync(join(workspaceRoot, path), "utf8"),
      error: null
    });
  } catch (error) {
    source = freezeRecord({
      ok: false,
      text: "",
      error: `${error.name}: ${error.message}`
    });
  }
  fileCache.set(path, source);
  return source;
}

function createViolation(id, fields) {
  return freezeRecord({
    id,
    ...fields
  });
}

function freezeArray(value) {
  return Object.freeze([...value]);
}

function freezeRecord(value) {
  return Object.freeze(value);
}
