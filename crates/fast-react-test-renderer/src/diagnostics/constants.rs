pub const TEST_RENDERER_SERIALIZATION_CANARY_GATE_NAME: &str =
    "fast-react-test-renderer.serialization.private-canary";
pub const TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.serialization.private-json-canary";
pub const TEST_RENDERER_PRIVATE_TO_JSON_FACADE_RESULT_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.private-facade-result";
pub const TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.private-native-execution-evidence";
pub const TEST_RENDERER_PRIVATE_TO_JSON_NATIVE_EXECUTION_STATUS: &str =
    "private-tojson-native-execution-records-consumed-public-tojson-blocked";
pub const TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.totree.private-native-execution-evidence";
pub const TEST_RENDERER_PRIVATE_TO_TREE_NATIVE_EXECUTION_STATUS: &str =
    "private-totree-native-execution-records-consumed-public-totree-blocked";
pub const TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.root.private-lifecycle-execution-evidence";
pub const TEST_RENDERER_PRIVATE_ROOT_LIFECYCLE_EXECUTION_STATUS: &str = "private-root-lifecycle-host-execution-records-consumed-public-root-native-js-act-scheduler-blocked";
pub const TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.serialization.private-finished-work-identity";
pub const TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_STATUS: &str =
    "private-serialization-finished-work-identity-validated-public-serialization-blocked";
pub const TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.sibling-snapshot.finished-work-identity-blocker";
pub const TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_STATUS: &str =
    "private-tojson-sibling-snapshot-finished-work-identity-blocked";
pub const TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_REASON: &str =
    "missing-committed-sibling-text-fiber-inspection-and-handoff";
pub const TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_IDENTITY_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.sibling-text.finished-work-identity";
pub const TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_IDENTITY_STATUS: &str =
    "private-tojson-sibling-text-finished-work-identity-validated-public-tojson-blocked";
pub const TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_IDENTITY_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.multi-child-host-text.finished-work-identity";
pub const TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_IDENTITY_STATUS: &str =
    "private-tojson-multi-child-host-text-lifecycle-native-finished-work-validated-public-blocked";
pub const TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_FIBER_INSPECTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.direct-multi-child-host-text.committed-fiber-inspection";
pub const TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_FIBER_INSPECTION_STATUS: &str = "private-tojson-direct-multi-child-host-text-current-fiber-inspection-validated-public-native-package-blocked";
pub const TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_ROW_IDENTITY_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.direct-multi-child-host-text.row-identity";
pub const TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_ROW_IDENTITY_STATUS: &str =
    "private-tojson-direct-multi-child-host-text-row-bound-to-current-fiber-commit";
pub const TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_RECONCILER_INSPECTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.tojson.direct-multi-child-host-text.reconciler-source-inspection";
pub const TEST_RENDERER_PRIVATE_TO_JSON_DIRECT_MULTI_CHILD_HOST_TEXT_RECONCILER_INSPECTION_STATUS: &str =
    "private-tojson-direct-multi-child-host-text-reconciler-source-current-inspection-consumed-public-native-package-blocked";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.serialization.private-unmount-nested-source-report-gate";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_STATUS: &str =
    "private-unmount-nested-source-report-admission-validated-public-native-package-blocked";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_NATIVE_EXECUTION_GATE_MISSING_REASON: &str =
    "unmount-nested-source-report-admission-gate-missing";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_NATIVE_EXECUTION_GATE_MISMATCH_REASON: &str =
    "unmount-nested-source-report-admission-gate-mismatch";
pub const TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID: &str =
    "react-test-renderer-tojson-update-host-output-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID: &str =
    "react-test-renderer-tojson-nested-host-output-update-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID: &str =
    "react-test-renderer-tojson-sibling-text-host-output-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_TO_JSON_MULTI_CHILD_HOST_TEXT_HOST_OUTPUT_ROW_ID: &str =
    "react-test-renderer-tojson-multi-child-host-text-output-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_HOST_OUTPUT_ROW_ID: &str =
    "react-test-renderer-tojson-unmount-host-output-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_UNMOUNT_ROW_STATUS: &str =
    "private-tojson-update-unmount-host-output-rows-public-tojson-blocked";
pub const TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_ROUTE_DEPENDENCY_ID: &str =
    "react-test-renderer-update-route-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID: &str =
    "react-test-renderer-unmount-route-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.update-route.private-root-work-loop";
pub const TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS: &str =
    "private-update-route-root-work-loop-metadata-ready-public-update-blocked";
pub const TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID: &str =
    "react-test-renderer-update-route-root-work-loop-private-admission";
pub const TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS: &str =
    "accepted-private-update-route-root-work-loop-admission-public-update-blocked";
pub const TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID: &str =
    "react-test-renderer-update-native-bridge-admission-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS: &str =
    "private-update-native-bridge-admission-host-output-handoff-public-update-blocked";
pub const TEST_RENDERER_PRIVATE_TO_JSON_SERIALIZATION_DEPENDENCY_ID: &str =
    "react-test-renderer-serialization-private-json-diagnostic";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID: &str =
    "react-test-renderer-unmount-deletion-commit-handoff-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_STATUS: &str =
    "private-unmount-deletion-commit-handoff-public-unmount-blocked";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID: &str =
    "react-test-renderer-unmount-native-bridge-admission-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS: &str =
    "private-unmount-native-bridge-admission-public-unmount-blocked";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID: &str =
    "react-test-renderer-unmount-native-bridge-cleanup-handoff-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_STATUS: &str =
    "private-unmount-native-bridge-cleanup-handoff-public-unmount-blocked";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_DIAGNOSTIC_ID: &str =
    "react-test-renderer-unmount-passive-ref-cleanup-order-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_UNMOUNT_PASSIVE_REF_CLEANUP_ORDER_STATUS: &str =
    "private-unmount-passive-ref-cleanup-order-public-unmount-blocked";
pub const TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.serialization.private-tree-canary";
pub const TEST_RENDERER_PRIVATE_TREE_COMMITTED_FIBER_INSPECTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.serialization.private-tree-committed-fiber-inspection-canary";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_FIND_ALL_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.testinstance.find-all-private-query";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_FIND_BY_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.testinstance.find-by-private-query";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_QUERY_BRIDGE_PREFLIGHT_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.testinstance.query-bridge-preflight";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_NATIVE_QUERY_EXECUTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.testinstance.private-native-query-execution-evidence";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_NATIVE_QUERY_EXECUTION_STATUS: &str = "private-test-instance-native-create-update-execution-records-consumed-public-test-instance-blocked";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_CLASS_QUERY_EXECUTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.testinstance.private-class-root-query-execution-evidence";
pub const TEST_RENDERER_PRIVATE_TEST_INSTANCE_CLASS_QUERY_EXECUTION_STATUS: &str =
    "private-test-instance-class-root-update-query-execution-public-test-instance-blocked";
pub const TEST_RENDERER_CURRENT_ROOT_CANARY_METADATA_ID: &str =
    "fast-react-test-renderer-current-root-canary-metadata";
pub const TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.root-create.private-preflight";
pub const TEST_RENDERER_PRIVATE_ROOT_CREATE_PREFLIGHT_STATUS: &str =
    "private-root-create-preflight-ready-public-root-blocked";
pub const TEST_RENDERER_PRIVATE_ROOT_CREATE_WORK_LOOP_PREFLIGHT_ROW_ID: &str =
    "react-test-renderer-root-create-work-loop-finished-work-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_ROOT_CREATE_WORK_LOOP_PREFLIGHT_STATUS: &str =
    "private-root-create-work-loop-finished-work-preflight-public-root-blocked";
pub const TEST_RENDERER_PRIVATE_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_ID: &str =
    "fast-react-test-renderer-root-work-loop-finished-work-preflight-metadata";
pub const TEST_RENDERER_PRIVATE_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_STATUS: &str =
    "accepted-root-work-loop-finished-work-preflight-metadata";
pub const TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.create-route.private-admission";
pub const TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_STATUS: &str =
    "private-create-route-admission-rust-root-create-work-loop-evidence-public-create-blocked";
pub const TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_RECORD_ID: &str =
    "react-test-renderer-create-route-admission-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_METADATA_ID: &str =
    "fast-react-test-renderer-create-route-admission-metadata";
pub const TEST_RENDERER_PRIVATE_CREATE_ROUTE_ADMISSION_METADATA_STATUS: &str =
    "accepted-create-route-rust-root-create-work-loop-admission-metadata";
pub const TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_DIAGNOSTIC_ID: &str =
    "react-test-renderer-create-native-bridge-host-output-handoff-private-diagnostic";
pub const TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_STATUS: &str =
    "private-create-native-bridge-host-output-handoff-public-create-blocked";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.error-boundary.private-root-options-canary";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS: &str =
    "private-error-boundary-diagnostics-root-options-metadata-public-boundary-blocked";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_NATIVE_EXECUTION_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.error-boundary.private-native-execution-evidence";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_NATIVE_EXECUTION_STATUS: &str =
    "private-error-boundary-native-execution-update-failure-evidence-public-recovery-blocked";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.error-boundary.private-commit-recovery-evidence";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_STATUS: &str =
    "private-error-boundary-commit-recovery-metadata-public-recovery-blocked";
pub const TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_API: &str =
    "TestRendererRoot::describe_private_error_boundary_commit_recovery_for_canary";
pub const TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.act.private-passive-effect-drain-canary";
pub const TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_STATUS: &str =
    "accepted-private-act-pending-passive-flush-metadata-public-act-blocked";
pub const TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_ACCEPTED_RECORDS: [&str; 5] = [
    "PendingPassiveCommitHandoff",
    "PassiveEffectSchedulerFlushGateRecord",
    "SchedulerPassiveEffectsFlushRequest",
    "PassiveEffectSchedulerFlushExecutionRecord",
    "PassiveEffectsFlushResult",
];
pub const TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.act.private-nested-scope-passive-flush-canary";
pub const TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_STATUS: &str =
    "private-act-nested-scope-passive-flush-public-act-blocked";
pub const TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_ORDER: [&str; 5] = [
    "outer-act-scope-enter",
    "inner-act-scope-enter",
    "accepted-passive-work-flush",
    "inner-act-scope-exit",
    "outer-act-scope-exit",
];
pub const TEST_RENDERER_PRIVATE_TREE_ACCEPTED_FIBER_SHAPE: [&str; 3] =
    ["HostRoot", "HostComponent", "HostText"];
pub const TEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE: [&str; 4] =
    ["HostRoot", "FunctionComponent", "HostComponent", "HostText"];
pub const TEST_RENDERER_PRIVATE_TREE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE: [&str; 4] =
    ["HostRoot", "HostText", "HostComponent", "HostText"];
pub const TEST_RENDERER_PRIVATE_TREE_COMPOSITE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE: [&str; 5] = [
    "HostRoot",
    "FunctionComponent",
    "HostText",
    "HostComponent",
    "HostText",
];
pub const TEST_RENDERER_PRIVATE_TREE_HOST_TEXT_MULTI_CHILD_ACCEPTED_FIBER_SHAPE: [&str; 4] =
    ["HostRoot", "HostComponent", "HostText", "HostText"];
pub const TEST_RENDERER_PRIVATE_TREE_COMPOSITE_HOST_TEXT_MULTI_CHILD_ACCEPTED_FIBER_SHAPE: [&str;
    5] = [
    "HostRoot",
    "FunctionComponent",
    "HostComponent",
    "HostText",
    "HostText",
];
pub const TEST_RENDERER_PRIVATE_TREE_FUNCTION_COMPONENT_TYPE: &str = "CanaryFunctionComponent";
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_DIAGNOSTIC_NAME: &str =
    "fast-react-test-renderer.get-instance.private-class-root-canary";
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_ACCEPTED_CLASS_FIBER_SHAPE: [&str; 4] =
    ["HostRoot", "ClassComponent", "HostComponent", "HostText"];
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_HOST_ROOT_FIBER_SHAPE: [&str; 2] =
    ["HostRoot", "HostComponent"];
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_FUNCTION_ROOT_FIBER_SHAPE: [&str; 2] =
    ["HostRoot", "FunctionComponent"];
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_COMPONENT_TYPE: &str = "CanaryClassComponent";
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_CONSTRUCTOR_NAME: &str = "CanaryClassInstance";
pub const TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_STATE_MARKER: &str = "initial-state";
pub const TEST_RENDERER_SERIALIZATION_ORACLE_KIND: &str =
    "react-19.2.6-react-test-renderer-serialization-oracle";
pub const TEST_RENDERER_SERIALIZATION_ORACLE_PROBE_MODE_COUNT: usize = 2;
pub const TEST_RENDERER_SERIALIZATION_ORACLE_SCENARIO_COUNT: usize = 7;
