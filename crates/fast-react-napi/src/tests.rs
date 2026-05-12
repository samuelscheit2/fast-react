use super::*;
use crate::handle_table::{
    BridgeEnvironmentId, BridgeHandle, BridgeHandleKind, BridgeHandleTable, BridgeHandleTableError,
    PlaceholderRootRecord, PlaceholderValueRecord,
};
use crate::root_bridge_requests::{
    NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_CLEANUP_STATUS_MISMATCH_CODE,
    NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_KIND_TRANSITION_MISMATCH_CODE,
    NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_LINK_STATUS,
    NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE,
    NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_ROW_ID_MISMATCH_CODE,
    NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_ROW_ORDER_MISMATCH_CODE,
    NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_STALE_OR_FOREIGN_JSON_BATCH_ROW_CODE,
    NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_STATUS,
    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE,
    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_REPLAYED_EVIDENCE_CODE,
    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE,
    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STATUS,
    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CALLER_BUILT_METADATA_CODE,
    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CANARY_STATUS,
    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CROSS_WORKER_THREAD_CODE,
    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_DUPLICATE_CLEANUP_CODE,
    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_FORGED_CLEANUP_ROW_CODE,
    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_MISSING_CLEANUP_HOOK_IDENTITY_CODE,
    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE,
    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_AFTER_RETIRE_CODE,
    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_EVIDENCE_IDS,
    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_GUARD_CONSUMED_STATUS,
    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REPLAYED_OR_RETIRED_CODE,
    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_GENERATION_CODE,
    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE,
    NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_CALLER_BUILT_ROW_CODE,
    NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE,
    NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STALE_OR_FOREIGN_ROW_CODE,
    NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STATUS,
    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_CANONICAL_SET_MISMATCH_CODE,
    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_FORGED_EVIDENCE_CODE,
    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_IDENTITY_MISMATCH_CODE,
    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ORDER_MISMATCH_CODE,
    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PREFLIGHT_STATUS,
    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PUBLIC_NATIVE_PACKAGE_CLAIM_CODE,
    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_STALE_EVIDENCE_CODE,
    NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS,
    NativeRootBridgeBatchLifecycleConsumer,
    NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink,
    NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRow,
    NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowStatus,
    NativeRootBridgeBatchLifecycleConsumerRow, NativeRootBridgeBatchResponseErrorRowStatus,
    NativeRootBridgeBatchResponseTeardownState, NativeRootBridgeBatchedJsonTransportLifecycleState,
    NativeRootBridgeBatchedJsonTransportLifecycleStatus, NativeRootBridgeCleanupGenerationConsumer,
    NativeRootBridgeCleanupGenerationConsumerRow,
    NativeRootBridgeCleanupGenerationCurrentnessCanary,
    NativeRootBridgeCleanupGenerationCurrentnessCanaryRow, NativeRootBridgeCreateRequest,
    NativeRootBridgeHandleAdmissionAction, NativeRootBridgeJsonBatchLifecycleExecutor,
    NativeRootBridgeJsonBatchLifecycleExecutorRow, NativeRootBridgeJsonTransportHandle,
    NativeRootBridgeJsonTransportParseError, NativeRootBridgeJsonTransportRecord,
    NativeRootBridgeJsonTransportStreamAssemblyState, NativeRootBridgeJsonTransportStreamChunkKind,
    NativeRootBridgeJsonTransportStreamChunkStatus,
    NativeRootBridgeJsonTransportStreamTeardownBlocker, NativeRootBridgeJsonTransportValueKind,
    NativeRootBridgeLifecycleTransition, NativeRootBridgeRenderRequest,
    NativeRootBridgeRequestError, NativeRootBridgeRequestKind, NativeRootBridgeRequestRecord,
    NativeRootBridgeRequestRecorder, NativeRootBridgeRequestSequenceValidator,
    NativeRootBridgeRootHandleState, NativeRootBridgeUnmountRequest,
    NativeRootBridgeWorkerThreadCleanupHookEvidence,
    NativeRootBridgeWorkerThreadCleanupHookPreflight,
    NativeRootBridgeWorkerThreadCleanupHookPreflightRow,
    NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus,
    native_root_bridge_batch_lifecycle_consumer_for_gate,
    native_root_bridge_batch_lifecycle_consumer_for_json,
    native_root_bridge_batched_json_transport_error_rows,
    native_root_bridge_cleanup_generation_consumer_for_gate,
    native_root_bridge_cleanup_generation_consumer_for_json,
    native_root_bridge_cleanup_generation_consumer_for_sources,
    native_root_bridge_cleanup_generation_currentness_canary_for_private_sources,
    native_root_bridge_cross_environment_teardown_gate,
    native_root_bridge_json_batch_lifecycle_executor_for_json,
    native_root_bridge_json_batch_lifecycle_executor_for_records,
    native_root_bridge_json_transport_error_diagnostic_rows,
    native_root_bridge_transport_worker_thread_teardown_gate,
    native_root_bridge_worker_thread_cleanup_hook_preflight,
    native_root_bridge_worker_thread_teardown_executable_preflight,
    parse_native_root_bridge_json_transport_for_gate,
    smoke_admit_js_native_root_bridge_handoff_records,
    smoke_admit_js_native_root_bridge_json_transport_records,
    validate_native_root_bridge_batch_lifecycle_consumer_json_batch_roundtrip_link_rows,
    validate_native_root_bridge_json_batch_lifecycle_executor_source_rows,
    validate_native_root_bridge_worker_thread_cleanup_hook_evidence_for_preflight,
    validate_native_root_bridge_worker_thread_cleanup_hook_evidence_rows,
    validate_native_root_bridge_worker_thread_cleanup_hook_preflight_rows,
};
use crate::root_work_loop_metadata::{
    RootWorkLoopFinishedWorkDiagnosticEvidence, RootWorkLoopFinishedWorkMetadataError,
    root_work_loop_finished_work_metadata_for_canary,
    root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary,
    root_work_loop_finished_work_metadata_from_private_reconciler_diagnostic_for_canary,
};
use crate::test_renderer_root_execution_bridge::{
    TestRendererNativeRootExecutionBridge, TestRendererNativeRootExecutionBridgeError,
};
use fast_react_reconciler::RootElementHandle;
use fast_react_test_renderer::{
    TestRendererOptions, TestRendererRootLifecycle, TestRendererRootUpdateKind,
};
use std::path::Path;

fn native_root_bridge_cleanup_generation_consumer_json(environment_id: u64) -> String {
    format!(
        r#"{{"transport":"json","schemaVersion":1,"requestRecords":[{{"request_id":1,"kind":"create","environment_id":{environment_id},"root_handle":{{"environment_id":{environment_id},"slot":1,"generation":1,"kind":"root"}},"root_id":1,"value_handle":{{"environment_id":{environment_id},"slot":2,"generation":1,"kind":"value"}},"root_handle_state":"active"}},{{"request_id":2,"kind":"render","environment_id":{environment_id},"root_handle":{{"environment_id":{environment_id},"slot":1,"generation":1,"kind":"root"}},"root_id":1,"value_handle":{{"environment_id":{environment_id},"slot":3,"generation":1,"kind":"value"}},"root_handle_state":"active"}}]}}"#
    )
}

fn accepted_cleanup_generation_currentness_sources() -> (
    NativeRootBridgeBatchLifecycleConsumer,
    NativeRootBridgeCleanupGenerationConsumer,
    NativeRootBridgeWorkerThreadCleanupHookPreflight,
) {
    let json = native_root_bridge_cleanup_generation_consumer_json(764);
    let gate = parse_native_root_bridge_json_transport_for_gate(&json).unwrap();
    let cleanup_hook_preflight = native_root_bridge_worker_thread_cleanup_hook_preflight();
    let lifecycle_consumer = native_root_bridge_batch_lifecycle_consumer_for_gate(&gate);
    let cleanup_generation_consumer =
        native_root_bridge_cleanup_generation_consumer_for_gate(&gate, &cleanup_hook_preflight);

    assert!(lifecycle_consumer.json_batch_lifecycle_executor_source_rows_validated());
    assert!(lifecycle_consumer.json_batch_lifecycle_executor_replay_guard_consumed());
    assert!(cleanup_generation_consumer.cleanup_generation_consumed());

    (
        lifecycle_consumer,
        cleanup_generation_consumer,
        cleanup_hook_preflight,
    )
}

fn assert_cleanup_generation_currentness_canary_inert(
    canary: &NativeRootBridgeCleanupGenerationCurrentnessCanary,
) {
    assert!(!canary.node_worker_threads_execution());
    assert!(!canary.napi_cleanup_hook_execution());
    assert!(!canary.native_addon_loaded());
    assert!(!canary.native_execution());
    assert!(!canary.renderer_execution());
    assert!(!canary.reconciler_execution());
    assert!(!canary.public_native_compatibility());
    assert!(!canary.react_behavior_error());
}

fn assert_cleanup_generation_currentness_row_inert(
    row: &NativeRootBridgeCleanupGenerationCurrentnessCanaryRow,
) {
    assert!(!row.node_worker_threads_execution());
    assert!(!row.napi_cleanup_hook_execution());
    assert!(!row.native_addon_loaded());
    assert!(!row.native_execution());
    assert!(!row.renderer_execution());
    assert!(!row.reconciler_execution());
    assert!(!row.public_native_compatibility());
    assert!(!row.react_behavior_error());
}

fn assert_cleanup_generation_currentness_rejection(
    lifecycle_consumer: &NativeRootBridgeBatchLifecycleConsumer,
    cleanup_generation_consumer: &NativeRootBridgeCleanupGenerationConsumer,
    cleanup_hook_preflight: &NativeRootBridgeWorkerThreadCleanupHookPreflight,
    cleanup_handoff_rows: &[NativeRootBridgeCleanupGenerationConsumerRow],
    expected_code: &'static str,
) {
    let canary = native_root_bridge_cleanup_generation_currentness_canary_for_private_sources(
        lifecycle_consumer,
        cleanup_generation_consumer,
        cleanup_hook_preflight,
        cleanup_handoff_rows,
    );

    assert!(!canary.cleanup_handoff_current());
    assert_eq!(canary.cleanup_handoff_error_code(), Some(expected_code));
    assert!(!canary.cleanup_reentry_guard_consumed());
    assert_eq!(canary.accepted_cleanup_handoff_count(), 0);
    assert!(canary.rows().is_empty());
    assert_cleanup_generation_currentness_canary_inert(&canary);
}

fn private_root_work_loop_diagnostic_evidence() -> RootWorkLoopFinishedWorkDiagnosticEvidence {
    RootWorkLoopFinishedWorkDiagnosticEvidence::from_private_reconciler_diagnostic(
        &native_root_work_loop_minimal_placement_diagnostic_for_private_bridge(),
        "div",
    )
}

#[test]
fn native_boundary_is_a_placeholder() {
    let metadata = boundary_metadata();

    assert_eq!(binding_status(), "placeholder");
    assert_eq!(metadata.package_name(), "@fast-react/native");
    assert_eq!(metadata.native_addon_name(), "fast_react_napi");
    assert_eq!(metadata.node_api_version_floor(), 8);
    assert_eq!(metadata.supported_node_engine_range(), ">=22.0.0");
    assert!(
        metadata
            .platform_artifact_policy()
            .contains("per-platform optional npm packages")
    );
    assert_eq!(metadata.native_target_count(), 8);
}

#[test]
fn native_target_matrix_is_deterministic() {
    let targets = native_target_matrix();

    assert_eq!(targets.len(), 8);
    assert_eq!(targets[0].native_target(), "darwin-arm64");
    assert_eq!(targets[0].platform(), "darwin");
    assert_eq!(targets[0].architecture(), "arm64");
    assert_eq!(targets[0].libc(), None);
    assert_eq!(targets[0].toolchain(), None);
    assert_eq!(
        targets[0].optional_package_name(),
        "@fast-react/native-darwin-arm64"
    );
    assert_eq!(
        targets[0].native_file_name(),
        "fast_react_napi.darwin-arm64.node"
    );

    assert_eq!(targets[1].native_target(), "darwin-x64");
    assert_eq!(
        native_target_metadata("linux-arm64-gnu")
            .expect("linux-arm64-gnu target metadata")
            .optional_package_name(),
        "@fast-react/native-linux-arm64-gnu"
    );
    assert_eq!(
        native_target_metadata("linux-arm64-musl")
            .expect("linux-arm64-musl target metadata")
            .native_file_name(),
        "fast_react_napi.linux-arm64-musl.node"
    );
    assert_eq!(
        native_target_metadata("linux-x64-gnu")
            .expect("linux-x64-gnu target metadata")
            .libc(),
        Some("gnu")
    );
    assert_eq!(
        native_target_metadata("linux-x64-musl")
            .expect("linux-x64-musl target metadata")
            .libc(),
        Some("musl")
    );
    assert_eq!(
        native_target_metadata("win32-arm64-msvc")
            .expect("win32-arm64-msvc target metadata")
            .toolchain(),
        Some("msvc")
    );
    assert_eq!(
        native_target_metadata("win32-x64-msvc")
            .expect("win32-x64-msvc target metadata")
            .optional_package_name(),
        "@fast-react/native-win32-x64-msvc"
    );
    assert!(native_target_metadata("freebsd-x64").is_none());
}

#[test]
fn native_exports_fail_loudly() {
    let error = native_export_placeholder("native.createElement").unwrap_err();
    assert_eq!(error.export_name(), "native.createElement");
    assert_eq!(error.kind(), NativeBoundaryErrorKind::NativeExportsNotBuilt);
    assert_eq!(error.code(), "FAST_REACT_NAPI_EXPORTS_NOT_BUILT");
    assert_eq!(error.source_error_code(), None);
    assert!(error.reason().contains("N-API dependencies"));
    assert!(error.to_string().contains("@fast-react/native"));
    assert!(error.to_string().contains("fast_react_napi"));
}

#[test]
fn native_boundary_unsupported_native_execution_stays_distinct_from_root_validation() {
    let error = native_export_placeholder("native.root.render").unwrap_err();

    assert_eq!(error.kind(), NativeBoundaryErrorKind::NativeExportsNotBuilt);
    assert_eq!(error.code(), "FAST_REACT_NAPI_EXPORTS_NOT_BUILT");
    assert_eq!(error.source_error_code(), None);
    assert!(!error.to_string().contains("FAST_REACT_UNIMPLEMENTED"));
    assert!(!error.to_string().contains("React behavior"));
    assert_ne!(
        error.code(),
        NativeBoundaryErrorKind::RootBridgeWrongEnvironment.code()
    );
    assert_ne!(
        error.code(),
        NativeBoundaryErrorKind::RootBridgeStaleHandle.code()
    );
    assert_ne!(
        error.code(),
        NativeBoundaryErrorKind::RootBridgeWrongLifecycleOrder.code()
    );
}

#[test]
fn native_private_root_work_loop_finished_work_metadata_shape_matches_canary() {
    let metadata = root_work_loop_finished_work_metadata_for_canary(
        "native-root-work-loop-root:1",
        "ConcurrentRoot",
        "native-root-work-loop-update:1",
        "div",
        "text",
        "append-placement-to-container",
    )
    .unwrap();

    assert_eq!(
        metadata.source(),
        "fast-react-reconciler.root-work-loop.finished-work-handoff"
    );
    assert_eq!(
        metadata.status(),
        "accepted-private-root-work-loop-finished-work-handoff-metadata"
    );
    assert_eq!(
        metadata.metadata_revision(),
        "root-work-loop-finished-work-handoff-2026-05-10"
    );

    let facade = metadata.facade();
    assert_eq!(facade.root_id(), "native-root-work-loop-root:1");
    assert_eq!(facade.root_tag(), "ConcurrentRoot");
    assert_eq!(facade.render_update_id(), "native-root-work-loop-update:1");
    assert_eq!(facade.host_type(), "div");
    assert_eq!(facade.host_output_shape(), "host-component");
    assert_eq!(facade.host_component_count(), 1);
    assert_eq!(facade.host_text_count(), 1);
    assert_eq!(facade.text_content(), "text");

    let complete_work = metadata.complete_work();
    assert_eq!(complete_work.root_child_tag(), "HostComponent");
    assert_eq!(complete_work.completed_child_tag(), "HostComponent");
    assert_eq!(complete_work.host_text_child_tag(), "HostText");
    assert_eq!(complete_work.child_tags(), ["HostComponent", "HostText"]);

    let pending = metadata.pending();
    assert!(pending.records_finished_work());
    assert!(pending.pending_work_matches_finished_work());
    assert_eq!(pending.render_lanes(), "Default");
    assert_eq!(pending.finished_lanes(), "Default");
    assert_eq!(pending.remaining_lanes(), "NoLanes");

    let commit = metadata.commit();
    assert!(commit.commit_order_after_pending_record());
    assert!(commit.consumed_finished_work_record());
    assert_eq!(commit.finished_work_after_commit(), None);
    assert_eq!(commit.finished_lanes_after_commit(), "NoLanes");
    assert_eq!(commit.render_phase_work_after_commit(), None);
    assert!(commit.mutation_execution_blocked());
    assert!(commit.public_root_rendering_blocked());
    assert!(commit.effects_refs_and_hydration_blocked());

    let placement = metadata.placement();
    assert_eq!(placement.tag(), "HostComponent");
    assert_eq!(placement.apply_kind(), "append-placement-to-container");
    assert_eq!(placement.sibling_status(), "append");
}

#[test]
fn native_private_root_work_loop_finished_work_metadata_from_diagnostic_matches_canary() {
    let canary = root_work_loop_finished_work_metadata_for_canary(
        "native-root-work-loop-root:1",
        "ConcurrentRoot",
        "native-root-work-loop-update:1",
        "div",
        "text",
        "append-placement-to-container",
    )
    .unwrap();
    let diagnostic_backed =
        root_work_loop_finished_work_metadata_from_private_reconciler_diagnostic_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "text",
        )
        .unwrap();

    assert_eq!(diagnostic_backed, canary);
}

#[test]
fn native_private_root_work_loop_finished_work_metadata_preserves_caller_ids() {
    let metadata = root_work_loop_finished_work_metadata_for_canary(
        "private-root-work-loop-root:99",
        "LegacyRoot",
        "private-root-work-loop-update:42",
        "div",
        "text",
        "append-placement-to-container",
    )
    .unwrap();

    assert_eq!(
        metadata.facade().root_id(),
        "private-root-work-loop-root:99"
    );
    assert_eq!(metadata.facade().root_tag(), "LegacyRoot");
    assert_eq!(
        metadata.facade().render_update_id(),
        "private-root-work-loop-update:42"
    );
}

#[test]
fn native_private_root_work_loop_finished_work_metadata_from_diagnostic_preserves_caller_ids() {
    let metadata =
        root_work_loop_finished_work_metadata_from_private_reconciler_diagnostic_for_canary(
            "private-root-work-loop-root:99",
            "LegacyRoot",
            "private-root-work-loop-update:42",
            "div",
            "text",
        )
        .unwrap();

    assert_eq!(
        metadata.facade().root_id(),
        "private-root-work-loop-root:99"
    );
    assert_eq!(metadata.facade().root_tag(), "LegacyRoot");
    assert_eq!(
        metadata.facade().render_update_id(),
        "private-root-work-loop-update:42"
    );
}

#[test]
fn native_private_root_work_loop_finished_work_metadata_uses_diagnostic_evidence() {
    let diagnostic = native_root_work_loop_minimal_placement_diagnostic_for_private_bridge();
    let evidence = RootWorkLoopFinishedWorkDiagnosticEvidence::from_private_reconciler_diagnostic(
        &diagnostic,
        "div",
    );
    let metadata = root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary(
        "native-root-work-loop-root:diagnostic",
        "ConcurrentRoot",
        "native-root-work-loop-update:diagnostic",
        "div",
        "text",
        &evidence,
    )
    .unwrap();

    assert_eq!(
        metadata.placement().apply_kind(),
        diagnostic.placement_mutation_kind()
    );
    assert_eq!(metadata.facade().host_type(), "div");
    assert_eq!(metadata.facade().host_output_shape(), "host-component");
    assert_eq!(metadata.facade().text_content(), diagnostic.text_content());
    assert_eq!(
        metadata.complete_work().root_child_tag(),
        diagnostic.root_child_tag_name()
    );
    assert_eq!(
        metadata.complete_work().completed_child_tag(),
        diagnostic.completed_child_tag_name()
    );
    assert_eq!(
        metadata.complete_work().host_text_child_tag(),
        diagnostic.host_text_child_tag_name()
    );
    assert_eq!(
        metadata.complete_work().child_tags(),
        diagnostic.child_tag_names()
    );
    assert_eq!(metadata.placement().tag(), diagnostic.root_child_tag_name());
    assert_eq!(
        metadata.facade().host_component_count(),
        u32::try_from(diagnostic.root_child_count()).unwrap()
    );
    assert_eq!(
        metadata.facade().host_text_count(),
        u32::try_from(diagnostic.component_child_count()).unwrap()
    );
    assert_eq!(
        metadata.commit().mutation_execution_blocked(),
        diagnostic.host_mutation_execution_blocked()
    );
    assert_eq!(
        metadata.commit().public_root_rendering_blocked(),
        diagnostic.public_root_rendering_blocked()
    );
    assert_eq!(
        metadata.commit().effects_refs_and_hydration_blocked(),
        diagnostic.effects_refs_and_hydration_blocked()
    );
    assert!(diagnostic.minimal_host_root_component_text_path_proven());
    assert!(diagnostic.render_complete_handoff_proven());
    assert!(diagnostic.private_render_complete_placement_proven());
    assert!(diagnostic.host_mutation_gate_blockers_intact());
    assert!(diagnostic.host_mutation_execution_blocked());
    assert!(!diagnostic.production_host_mutation_apply_promoted());
    assert!(!diagnostic.public_dom_compatibility_claimed());
    assert!(!diagnostic.public_root_rendering_claimed());
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(diagnostic.public_compatibility_blocked());
    assert!(diagnostic.effects_execution_blocked());
    assert!(diagnostic.refs_execution_blocked());
    assert!(diagnostic.hydration_execution_blocked());
    assert!(diagnostic.effects_refs_and_hydration_execution_surfaces_blocked());
    assert!(diagnostic.effects_refs_and_hydration_blocked());
    assert!(!diagnostic.public_renderer_package_behavior_exposed());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
}

#[test]
fn native_private_root_work_loop_finished_work_metadata_rejects_unsupported_canary_inputs() {
    assert_eq!(
        root_work_loop_finished_work_metadata_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "text",
            "insert-placement-in-container-before",
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnsupportedPlacementApplyKind {
            actual: "insert-placement-in-container-before".to_string()
        }
    );
    assert_eq!(
        root_work_loop_finished_work_metadata_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "span",
            "text",
            "append-placement-to-container",
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnsupportedHostType {
            actual: "span".to_string()
        }
    );
    assert_eq!(
        root_work_loop_finished_work_metadata_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "copy",
            "append-placement-to-container",
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnsupportedTextContent {
            actual: "copy".to_string()
        }
    );
}

#[test]
fn native_private_root_work_loop_finished_work_metadata_from_diagnostic_rejects_unsupported_inputs()
{
    assert_eq!(
        root_work_loop_finished_work_metadata_from_private_reconciler_diagnostic_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "span",
            "text",
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnsupportedHostType {
            actual: "span".to_string()
        }
    );
    assert_eq!(
        root_work_loop_finished_work_metadata_from_private_reconciler_diagnostic_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "copy",
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnsupportedTextContent {
            actual: "copy".to_string()
        }
    );

    for (root_id, root_tag, render_update_id, field) in [
        (
            "",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "root_id",
        ),
        (
            "native-root-work-loop-root:1",
            "",
            "native-root-work-loop-update:1",
            "root_tag",
        ),
        (
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "",
            "render_update_id",
        ),
    ] {
        assert_eq!(
            root_work_loop_finished_work_metadata_from_private_reconciler_diagnostic_for_canary(
                root_id,
                root_tag,
                render_update_id,
                "div",
                "text",
            )
            .unwrap_err(),
            RootWorkLoopFinishedWorkMetadataError::EmptyCallerId { field }
        );
    }
}

#[test]
fn native_private_root_work_loop_finished_work_metadata_rejects_empty_caller_ids() {
    for (root_id, root_tag, render_update_id, field) in [
        (
            "",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "root_id",
        ),
        (
            "native-root-work-loop-root:1",
            "",
            "native-root-work-loop-update:1",
            "root_tag",
        ),
        (
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "",
            "render_update_id",
        ),
    ] {
        assert_eq!(
            root_work_loop_finished_work_metadata_for_canary(
                root_id,
                root_tag,
                render_update_id,
                "div",
                "text",
                "append-placement-to-container",
            )
            .unwrap_err(),
            RootWorkLoopFinishedWorkMetadataError::EmptyCallerId { field }
        );
    }
}

#[test]
fn native_private_root_work_loop_finished_work_metadata_rejects_hostile_diagnostic_evidence() {
    let evidence = private_root_work_loop_diagnostic_evidence()
        .with_placement_mutation_kind_for_test("insert-placement-in-container-before");
    assert_eq!(
        root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "text",
            &evidence,
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnsupportedPlacementApplyKind {
            actual: "insert-placement-in-container-before".to_string()
        }
    );

    let evidence = private_root_work_loop_diagnostic_evidence().with_text_content_for_test("copy");
    assert_eq!(
        root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "text",
            &evidence,
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnsupportedDiagnosticValue {
            field: "text_content",
            expected: "text",
            actual: "copy".to_string()
        }
    );

    let evidence =
        private_root_work_loop_diagnostic_evidence().with_host_output_shape_for_test("host-text");
    assert_eq!(
        root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "text",
            &evidence,
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnsupportedDiagnosticValue {
            field: "host_output_shape",
            expected: "host-component",
            actual: "host-text".to_string()
        }
    );

    let evidence =
        private_root_work_loop_diagnostic_evidence().with_root_child_tag_for_test("HostText");
    assert_eq!(
        root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "text",
            &evidence,
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnsupportedDiagnosticValue {
            field: "root_child_tag",
            expected: "HostComponent",
            actual: "HostText".to_string()
        }
    );

    let evidence = private_root_work_loop_diagnostic_evidence()
        .with_child_tags_for_test(["HostText", "HostComponent"]);
    assert_eq!(
        root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "text",
            &evidence,
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnsupportedDiagnosticValue {
            field: "child_tags",
            expected: "HostComponent,HostText",
            actual: "HostText,HostComponent".to_string()
        }
    );

    let evidence = private_root_work_loop_diagnostic_evidence()
        .with_minimal_host_root_component_text_path_proven_for_test(false);
    assert_eq!(
        root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "text",
            &evidence,
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnprovenDiagnostic {
            field: "minimal_host_root_component_text_path_proven"
        }
    );

    let evidence = private_root_work_loop_diagnostic_evidence().with_root_child_count_for_test(2);
    assert_eq!(
        root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "text",
            &evidence,
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnsupportedDiagnosticValue {
            field: "root_child_count",
            expected: "1",
            actual: "2".to_string()
        }
    );

    let evidence =
        private_root_work_loop_diagnostic_evidence().with_component_child_count_for_test(0);
    assert_eq!(
        root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "text",
            &evidence,
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnsupportedDiagnosticValue {
            field: "component_child_count",
            expected: "1",
            actual: "0".to_string()
        }
    );

    let evidence = private_root_work_loop_diagnostic_evidence()
        .with_host_mutation_execution_blocked_for_test(false);
    assert_eq!(
        root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "text",
            &evidence,
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnprovenDiagnostic {
            field: "host_mutation_execution_blocked"
        }
    );

    let evidence = private_root_work_loop_diagnostic_evidence()
        .with_effects_refs_and_hydration_blocked_for_test(false);
    assert_eq!(
        root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "text",
            &evidence,
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnprovenDiagnostic {
            field: "effects_refs_and_hydration_blocked"
        }
    );

    let evidence =
        private_root_work_loop_diagnostic_evidence().with_effects_execution_blocked_for_test(false);
    assert_eq!(
        root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "text",
            &evidence,
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnprovenDiagnostic {
            field: "effects_execution_blocked"
        }
    );

    let evidence =
        private_root_work_loop_diagnostic_evidence().with_refs_execution_blocked_for_test(false);
    assert_eq!(
        root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "text",
            &evidence,
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnprovenDiagnostic {
            field: "refs_execution_blocked"
        }
    );

    let evidence = private_root_work_loop_diagnostic_evidence()
        .with_hydration_execution_blocked_for_test(false);
    assert_eq!(
        root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "text",
            &evidence,
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnprovenDiagnostic {
            field: "hydration_execution_blocked"
        }
    );

    let evidence = private_root_work_loop_diagnostic_evidence()
        .with_effects_refs_and_hydration_execution_surfaces_blocked_for_test(false);
    assert_eq!(
        root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "text",
            &evidence,
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::UnprovenDiagnostic {
            field: "effects_refs_and_hydration_execution_surfaces_blocked"
        }
    );

    let evidence = private_root_work_loop_diagnostic_evidence()
        .with_public_dom_compatibility_claimed_for_test(true);
    assert_eq!(
        root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary(
            "native-root-work-loop-root:1",
            "ConcurrentRoot",
            "native-root-work-loop-update:1",
            "div",
            "text",
            &evidence,
        )
        .unwrap_err(),
        RootWorkLoopFinishedWorkMetadataError::DiagnosticPublicCompatibilityClaim {
            field: "public_dom_compatibility_claimed"
        }
    );
}

#[test]
fn native_boundary_errors_are_not_react_behavior_errors() {
    let error = native_export_placeholder("native.processWork").unwrap_err();

    assert!(!error.to_string().contains("React behavior"));
    assert_eq!(error.metadata(), boundary_metadata());
}

#[test]
fn native_root_bridge_boundary_maps_wrong_environment_and_stale_handles() {
    let mut first = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(319));
    let second = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(320));
    let mut first_recorder = NativeRootBridgeRequestRecorder::new();
    let mut second_recorder = NativeRootBridgeRequestRecorder::new();
    let create = first_recorder
        .record_create_root(&mut first, NativeRootBridgeCreateRequest::new(7901))
        .unwrap();

    let wrong_environment = second_recorder
        .record_render(
            &second,
            NativeRootBridgeRenderRequest::new(create.root_handle()),
        )
        .unwrap_err();
    let wrong_environment_boundary =
        native_root_bridge_validation_placeholder("native.root.render", &wrong_environment);

    assert_eq!(
        wrong_environment_boundary.kind(),
        NativeBoundaryErrorKind::RootBridgeWrongEnvironment
    );
    assert_eq!(
        wrong_environment_boundary.code(),
        "FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_ENVIRONMENT"
    );
    assert_eq!(
        wrong_environment_boundary.source_error_code(),
        Some("FAST_REACT_NAPI_WRONG_ENVIRONMENT")
    );
    assert!(
        wrong_environment_boundary
            .reason()
            .contains("wrong bridge environment")
    );
    assert!(
        wrong_environment_boundary
            .to_string()
            .contains("source=FAST_REACT_NAPI_WRONG_ENVIRONMENT")
    );
    assert!(
        !wrong_environment_boundary
            .to_string()
            .contains("React behavior")
    );

    let unmount = first_recorder
        .record_unmount(
            &mut first,
            NativeRootBridgeUnmountRequest::new(create.root_handle()),
        )
        .unwrap();
    let stale = first_recorder
        .record_render(
            &first,
            NativeRootBridgeRenderRequest::new(unmount.root_handle()),
        )
        .unwrap_err();
    let stale_boundary = native_root_bridge_validation_placeholder("native.root.render", &stale);

    assert_eq!(
        stale_boundary.kind(),
        NativeBoundaryErrorKind::RootBridgeStaleHandle
    );
    assert_eq!(
        stale_boundary.code(),
        "FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"
    );
    assert_eq!(
        stale_boundary.source_error_code(),
        Some("FAST_REACT_NAPI_STALE_HANDLE")
    );
    assert!(stale_boundary.reason().contains("stale or retired"));
    assert!(!stale_boundary.to_string().contains("React behavior"));
}

#[test]
fn native_root_bridge_boundary_maps_wrong_lifecycle_order() {
    let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(319));
    let manual_root = table.insert_root(PlaceholderRootRecord::new(7902));
    let mut recorder = NativeRootBridgeRequestRecorder::new();
    let mut validator = NativeRootBridgeRequestSequenceValidator::new();
    let render_before_create = recorder
        .record_render(&table, NativeRootBridgeRenderRequest::new(manual_root))
        .unwrap();

    let missing_create = validator
        .validate_next(&table, render_before_create)
        .unwrap_err();
    let boundary = native_root_bridge_validation_placeholder("native.root.render", &missing_create);

    assert_eq!(
        boundary.kind(),
        NativeBoundaryErrorKind::RootBridgeWrongLifecycleOrder
    );
    assert_eq!(
        boundary.code(),
        "FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"
    );
    assert_eq!(
        boundary.source_error_code(),
        Some("FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE")
    );
    assert!(boundary.reason().contains("invalid root lifecycle order"));
    assert!(
        boundary
            .to_string()
            .contains("source=FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE")
    );
    assert!(!boundary.to_string().contains("FAST_REACT_UNIMPLEMENTED"));
    assert!(!boundary.to_string().contains("React behavior"));
}

#[test]
fn native_root_bridge_records_create_and_render_inert_handle_metadata() {
    let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(256));
    let container_handle = table.insert_value(PlaceholderValueRecord::new(9001));
    let element_handle = table.insert_value(PlaceholderValueRecord::new(9002));
    let mut recorder = NativeRootBridgeRequestRecorder::new();

    let create = recorder
        .record_create_root(
            &mut table,
            NativeRootBridgeCreateRequest::new(7001).with_container_handle(container_handle),
        )
        .unwrap();

    assert_eq!(create.request_id(), 1);
    assert_eq!(create.kind(), NativeRootBridgeRequestKind::Create);
    assert_eq!(create.kind().code(), "create");
    assert_eq!(create.environment_id(), table.environment_id());
    assert_eq!(create.root_id(), 7001);
    assert_eq!(create.value_handle(), Some(container_handle));
    assert_eq!(
        create.root_handle_state(),
        NativeRootBridgeRootHandleState::Active
    );
    assert_eq!(
        table.get_root(create.root_handle()).unwrap().root_id(),
        7001
    );
    assert_eq!(table.get_value(container_handle).unwrap().value_id(), 9001);

    let render = recorder
        .record_render(
            &table,
            NativeRootBridgeRenderRequest::new(create.root_handle())
                .with_element_handle(element_handle),
        )
        .unwrap();

    assert_eq!(render.request_id(), 2);
    assert_eq!(render.kind(), NativeRootBridgeRequestKind::Render);
    assert_eq!(render.kind().code(), "render");
    assert_eq!(render.environment_id(), table.environment_id());
    assert_eq!(render.root_handle(), create.root_handle());
    assert_eq!(render.root_id(), 7001);
    assert_eq!(render.value_handle(), Some(element_handle));
    assert_eq!(
        render.root_handle_state(),
        NativeRootBridgeRootHandleState::Active
    );
    assert_eq!(
        table.get_root(render.root_handle()).unwrap().root_id(),
        7001
    );
    assert_eq!(table.get_value(element_handle).unwrap().value_id(), 9002);
}

#[test]
fn native_root_bridge_unmount_record_retires_root_without_touching_values() {
    let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(256));
    let container_handle = table.insert_value(PlaceholderValueRecord::new(9101));
    let element_handle = table.insert_value(PlaceholderValueRecord::new(9102));
    let mut recorder = NativeRootBridgeRequestRecorder::new();
    let create = recorder
        .record_create_root(
            &mut table,
            NativeRootBridgeCreateRequest::new(7101).with_container_handle(container_handle),
        )
        .unwrap();

    recorder
        .record_render(
            &table,
            NativeRootBridgeRenderRequest::new(create.root_handle())
                .with_element_handle(element_handle),
        )
        .unwrap();
    let unmount = recorder
        .record_unmount(
            &mut table,
            NativeRootBridgeUnmountRequest::new(create.root_handle()),
        )
        .unwrap();

    assert_eq!(unmount.request_id(), 3);
    assert_eq!(unmount.kind(), NativeRootBridgeRequestKind::Unmount);
    assert_eq!(unmount.kind().code(), "unmount");
    assert_eq!(unmount.root_id(), 7101);
    assert_eq!(unmount.root_handle(), create.root_handle());
    assert_eq!(unmount.value_handle(), None);
    assert_eq!(
        unmount.root_handle_state(),
        NativeRootBridgeRootHandleState::Retired
    );
    assert_eq!(
        table.get_root(create.root_handle()).unwrap_err(),
        BridgeHandleTableError::StaleHandle {
            handle: create.root_handle(),
            current_generation: create.root_handle().generation() + 1,
        }
    );
    assert_eq!(table.get_value(container_handle).unwrap().value_id(), 9101);
    assert_eq!(table.get_value(element_handle).unwrap().value_id(), 9102);
}

#[test]
fn native_root_bridge_records_reject_wrong_environment_stale_and_wrong_kind_handles() {
    let mut first = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(256));
    let second = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(257));
    let wrong_kind_handle = first.insert_value(PlaceholderValueRecord::new(9201));
    let mut first_recorder = NativeRootBridgeRequestRecorder::new();
    let mut second_recorder = NativeRootBridgeRequestRecorder::new();
    let create = first_recorder
        .record_create_root(&mut first, NativeRootBridgeCreateRequest::new(7201))
        .unwrap();

    let wrong_environment = second_recorder
        .record_render(
            &second,
            NativeRootBridgeRenderRequest::new(create.root_handle()),
        )
        .unwrap_err();

    assert_eq!(
        wrong_environment,
        NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::WrongEnvironment {
            handle: create.root_handle(),
            expected: second.environment_id()
        })
    );
    assert_eq!(
        wrong_environment.code(),
        "FAST_REACT_NAPI_WRONG_ENVIRONMENT"
    );

    let wrong_kind = first_recorder
        .record_render(
            &first,
            NativeRootBridgeRenderRequest::new(wrong_kind_handle),
        )
        .unwrap_err();

    assert_eq!(
        wrong_kind,
        NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::WrongKind {
            handle: wrong_kind_handle,
            expected: BridgeHandleKind::Root,
            actual: BridgeHandleKind::Value
        })
    );
    assert_eq!(wrong_kind.code(), "FAST_REACT_NAPI_WRONG_HANDLE_KIND");

    let unmount = first_recorder
        .record_unmount(
            &mut first,
            NativeRootBridgeUnmountRequest::new(create.root_handle()),
        )
        .unwrap();
    let stale = first_recorder
        .record_render(
            &first,
            NativeRootBridgeRenderRequest::new(unmount.root_handle()),
        )
        .unwrap_err();

    assert_eq!(
        stale,
        NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::StaleHandle {
            handle: create.root_handle(),
            current_generation: create.root_handle().generation() + 1
        })
    );
    assert_eq!(stale.code(), "FAST_REACT_NAPI_STALE_HANDLE");
}

#[test]
fn native_root_bridge_records_preserve_environment_teardown_stale_guarantee() {
    let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(256));
    let element_handle = table.insert_value(PlaceholderValueRecord::new(9301));
    let mut recorder = NativeRootBridgeRequestRecorder::new();
    let create = recorder
        .record_create_root(&mut table, NativeRootBridgeCreateRequest::new(7301))
        .unwrap();
    let teardown = table.teardown_environment(table.environment_id());

    assert!(teardown.environment_matched());
    assert_eq!(teardown.root_handles_invalidated(), 1);
    assert_eq!(teardown.value_handles_invalidated(), 1);

    let stale_root = recorder
        .record_render(
            &table,
            NativeRootBridgeRenderRequest::new(create.root_handle())
                .with_element_handle(element_handle),
        )
        .unwrap_err();

    assert_eq!(
        stale_root,
        NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::StaleHandle {
            handle: create.root_handle(),
            current_generation: create.root_handle().generation() + 1
        })
    );
    assert_eq!(
        table.get_value(element_handle).unwrap_err(),
        BridgeHandleTableError::StaleHandle {
            handle: element_handle,
            current_generation: element_handle.generation() + 1
        }
    );
}

#[test]
fn native_root_bridge_sequence_validator_admits_create_render_unmount_against_handle_table() {
    let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(281));
    let container_handle = table.insert_value(PlaceholderValueRecord::new(9401));
    let element_handle = table.insert_value(PlaceholderValueRecord::new(9402));
    let mut recorder = NativeRootBridgeRequestRecorder::new();
    let mut validator = NativeRootBridgeRequestSequenceValidator::new();

    let create = recorder
        .record_create_root(
            &mut table,
            NativeRootBridgeCreateRequest::new(7401).with_container_handle(container_handle),
        )
        .unwrap();
    let create_validation = validator.validate_next(&table, create).unwrap();

    assert_eq!(create_validation.request_id(), create.request_id());
    assert_eq!(
        create_validation.kind(),
        NativeRootBridgeRequestKind::Create
    );
    assert_eq!(create_validation.environment_id(), table.environment_id());
    assert_eq!(create_validation.root_handle(), create.root_handle());
    assert_eq!(create_validation.root_id(), 7401);
    assert_eq!(create_validation.value_handle(), Some(container_handle));
    assert_eq!(
        create_validation.root_handle_state(),
        NativeRootBridgeRootHandleState::Active
    );
    assert_eq!(
        create_validation.lifecycle_transition(),
        NativeRootBridgeLifecycleTransition::NoneToActive
    );
    assert_eq!(
        create_validation.lifecycle_transition().code(),
        "none->active"
    );
    assert!(create_validation.root_handle_validated());
    assert!(create_validation.value_handle_validated());
    assert_eq!(validator.root_handle(), Some(create.root_handle()));
    assert_eq!(validator.root_id(), Some(7401));
    assert_eq!(validator.last_request_id(), Some(create.request_id()));
    assert!(!validator.root_retired());

    let render = recorder
        .record_render(
            &table,
            NativeRootBridgeRenderRequest::new(create.root_handle())
                .with_element_handle(element_handle),
        )
        .unwrap();
    let render_validation = validator.validate_next(&table, render).unwrap();

    assert_eq!(render_validation.request_id(), render.request_id());
    assert_eq!(
        render_validation.kind(),
        NativeRootBridgeRequestKind::Render
    );
    assert_eq!(render_validation.value_handle(), Some(element_handle));
    assert_eq!(
        render_validation.lifecycle_transition(),
        NativeRootBridgeLifecycleTransition::ActiveToActive
    );
    assert_eq!(
        render_validation.lifecycle_transition().code(),
        "active->active"
    );
    assert!(render_validation.root_handle_validated());
    assert!(render_validation.value_handle_validated());
    assert_eq!(validator.last_request_id(), Some(render.request_id()));
    assert!(!validator.root_retired());

    let unmount = recorder
        .record_unmount(
            &mut table,
            NativeRootBridgeUnmountRequest::new(create.root_handle()),
        )
        .unwrap();
    let unmount_validation = validator.validate_next(&table, unmount).unwrap();

    assert_eq!(
        unmount_validation.kind(),
        NativeRootBridgeRequestKind::Unmount
    );
    assert_eq!(unmount_validation.root_handle(), create.root_handle());
    assert_eq!(unmount_validation.value_handle(), None);
    assert_eq!(
        unmount_validation.root_handle_state(),
        NativeRootBridgeRootHandleState::Retired
    );
    assert_eq!(
        unmount_validation.lifecycle_transition(),
        NativeRootBridgeLifecycleTransition::ActiveToRetired
    );
    assert_eq!(
        unmount_validation.lifecycle_transition().code(),
        "active->retired"
    );
    assert!(unmount_validation.root_handle_validated());
    assert!(!unmount_validation.value_handle_validated());
    assert_eq!(validator.last_request_id(), Some(unmount.request_id()));
    assert!(validator.root_retired());
    assert_eq!(
        table.get_root(create.root_handle()).unwrap_err(),
        BridgeHandleTableError::StaleHandle {
            handle: create.root_handle(),
            current_generation: create.root_handle().generation() + 1
        }
    );
}

#[test]
fn native_root_bridge_js_handoff_records_smoke_admit_through_rust_handle_table() {
    let environment_id = BridgeEnvironmentId::from_raw(376);
    let root_handle = BridgeHandle::new(environment_id, 1, 1, BridgeHandleKind::Root);
    let container_handle = BridgeHandle::new(environment_id, 2, 1, BridgeHandleKind::Value);
    let element_handle = BridgeHandle::new(environment_id, 3, 1, BridgeHandleKind::Value);
    let requests = [
        NativeRootBridgeRequestRecord::from_js_native_handoff_record(
            1,
            NativeRootBridgeRequestKind::Create,
            environment_id,
            root_handle,
            1,
            Some(container_handle),
            NativeRootBridgeRootHandleState::Active,
        ),
        NativeRootBridgeRequestRecord::from_js_native_handoff_record(
            2,
            NativeRootBridgeRequestKind::Render,
            environment_id,
            root_handle,
            1,
            Some(element_handle),
            NativeRootBridgeRootHandleState::Active,
        ),
        NativeRootBridgeRequestRecord::from_js_native_handoff_record(
            3,
            NativeRootBridgeRequestKind::Unmount,
            environment_id,
            root_handle,
            1,
            None,
            NativeRootBridgeRootHandleState::Retired,
        ),
    ];

    let smoke = smoke_admit_js_native_root_bridge_handoff_records(&requests).unwrap();
    let admission_records = smoke.admission_records();
    let validation_records = smoke.validation_records();

    assert_eq!(smoke.environment_id(), environment_id);
    assert_eq!(smoke.root_handle(), Some(root_handle));
    assert_eq!(smoke.root_id(), Some(1));
    assert!(smoke.root_retired());
    assert_eq!(admission_records.len(), 3);
    assert_eq!(validation_records.len(), 3);
    assert_eq!(
        admission_records
            .iter()
            .map(|record| record.request_id())
            .collect::<Vec<_>>(),
        [1, 2, 3]
    );
    assert_eq!(
        admission_records
            .iter()
            .map(|record| record.kind().code())
            .collect::<Vec<_>>(),
        ["create", "render", "unmount"]
    );
    assert_eq!(
        admission_records
            .iter()
            .map(|record| record.lifecycle_transition().code())
            .collect::<Vec<_>>(),
        ["none->active", "active->active", "active->retired"]
    );
    assert_eq!(
        admission_records
            .iter()
            .map(|record| record.root_handle_state_before().map(|state| state.code()))
            .collect::<Vec<_>>(),
        [None, Some("active"), Some("active")]
    );
    assert_eq!(
        admission_records
            .iter()
            .map(|record| record.root_handle_state_after().code())
            .collect::<Vec<_>>(),
        ["active", "active", "retired"]
    );
    assert_eq!(
        admission_records
            .iter()
            .map(|record| record.root_handle_action().code())
            .collect::<Vec<_>>(),
        [
            NativeRootBridgeHandleAdmissionAction::AdmitRoot.code(),
            NativeRootBridgeHandleAdmissionAction::ValidateActiveRoot.code(),
            NativeRootBridgeHandleAdmissionAction::RetireRoot.code()
        ]
    );
    assert_eq!(
        admission_records
            .iter()
            .map(|record| record.root_handle_current_generation())
            .collect::<Vec<_>>(),
        [1, 1, 2]
    );
    assert_eq!(
        admission_records
            .iter()
            .map(|record| record.value_handle_action().map(|action| action.code()))
            .collect::<Vec<_>>(),
        [
            Some(NativeRootBridgeHandleAdmissionAction::AdmitValue.code()),
            Some(NativeRootBridgeHandleAdmissionAction::AdmitValue.code()),
            None
        ]
    );
    assert_eq!(
        admission_records
            .iter()
            .map(|record| record.value_handle_current_generation())
            .collect::<Vec<_>>(),
        [Some(1), Some(1), None]
    );
    assert_eq!(
        admission_records[2].retired_root_source_error_code(),
        Some("FAST_REACT_NAPI_STALE_HANDLE")
    );
    assert_eq!(
        validation_records
            .iter()
            .map(|record| record.lifecycle_transition().code())
            .collect::<Vec<_>>(),
        ["none->active", "active->active", "active->retired"]
    );
    assert_eq!(
        validation_records
            .iter()
            .map(|record| record.root_handle_state().code())
            .collect::<Vec<_>>(),
        ["active", "active", "retired"]
    );
    assert_eq!(validation_records[0].value_handle(), Some(container_handle));
    assert_eq!(validation_records[1].value_handle(), Some(element_handle));
    assert_eq!(validation_records[2].value_handle(), None);
    assert!(validation_records[0].value_handle_validated());
    assert!(validation_records[1].value_handle_validated());
    assert!(!validation_records[2].value_handle_validated());
}

#[test]
fn native_root_bridge_json_transport_records_smoke_admit_through_handle_table() {
    let records = [
        NativeRootBridgeJsonTransportRecord::new(
            1,
            "create",
            403,
            NativeRootBridgeJsonTransportHandle::new(403, 1, 1, "root"),
            1,
            Some(NativeRootBridgeJsonTransportHandle::new(403, 2, 1, "value")),
            "active",
        ),
        NativeRootBridgeJsonTransportRecord::new(
            2,
            "render",
            403,
            NativeRootBridgeJsonTransportHandle::new(403, 1, 1, "root"),
            1,
            Some(NativeRootBridgeJsonTransportHandle::new(403, 3, 1, "value")),
            "active",
        ),
        NativeRootBridgeJsonTransportRecord::new(
            3,
            "unmount",
            403,
            NativeRootBridgeJsonTransportHandle::new(403, 1, 1, "root"),
            1,
            None,
            "retired",
        ),
    ];

    let smoke = smoke_admit_js_native_root_bridge_json_transport_records(&records).unwrap();
    let admission_records = smoke.admission_records();
    let validation_records = smoke.validation_records();

    assert_eq!(smoke.environment_id(), BridgeEnvironmentId::from_raw(403));
    assert_eq!(smoke.root_id(), Some(1));
    assert!(smoke.root_retired());
    assert_eq!(admission_records.len(), 3);
    assert_eq!(
        admission_records
            .iter()
            .map(|record| record.lifecycle_transition().code())
            .collect::<Vec<_>>(),
        ["none->active", "active->active", "active->retired"]
    );
    assert_eq!(
        admission_records
            .iter()
            .map(|record| record.root_handle_action().code())
            .collect::<Vec<_>>(),
        [
            "admit-root-handle",
            "validate-active-root-handle",
            "retire-root-handle"
        ]
    );
    assert_eq!(
        admission_records
            .iter()
            .map(|record| record.root_handle_current_generation())
            .collect::<Vec<_>>(),
        [1, 1, 2]
    );
    assert_eq!(
        admission_records
            .iter()
            .map(|record| record.value_handle_action().map(|action| action.code()))
            .collect::<Vec<_>>(),
        [Some("admit-value-handle"), Some("admit-value-handle"), None]
    );
    assert_eq!(
        admission_records[2].retired_root_source_error_code(),
        Some("FAST_REACT_NAPI_STALE_HANDLE")
    );
    assert_eq!(
        validation_records
            .iter()
            .map(|record| record.kind().code())
            .collect::<Vec<_>>(),
        ["create", "render", "unmount"]
    );
    assert!(validation_records[0].value_handle_validated());
    assert!(validation_records[1].value_handle_validated());
    assert!(!validation_records[2].value_handle_validated());
}

#[test]
fn native_root_bridge_json_transport_records_reject_unknown_codes() {
    let records = [NativeRootBridgeJsonTransportRecord::new(
        1,
        "update",
        403,
        NativeRootBridgeJsonTransportHandle::new(403, 1, 1, "root"),
        1,
        None,
        "active",
    )];

    let error = smoke_admit_js_native_root_bridge_json_transport_records(&records).unwrap_err();

    assert_eq!(
        error,
        NativeRootBridgeRequestError::JsonTransportRecordInvalid {
            field: "kind",
            value: "update"
        }
    );
    assert_eq!(
        error.code(),
        "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_RECORD_INVALID"
    );
}

#[test]
fn native_root_bridge_json_transport_parser_gate_accepts_schema_and_admits_handles() {
    let json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":435,"root_handle":{"environment_id":435,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":435,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":435,"root_handle":{"environment_id":435,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":435,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":3,"kind":"unmount","environment_id":435,"root_handle":{"environment_id":435,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"}]}"#;

    let gate = parse_native_root_bridge_json_transport_for_gate(json).unwrap();
    let admission_records = gate.admission_smoke().admission_records();
    let validation_records = gate.admission_smoke().validation_records();

    assert_eq!(gate.transport(), "json");
    assert_eq!(gate.schema_version(), 1);
    assert_eq!(gate.request_records().len(), 3);
    assert!(!gate.native_execution());
    assert!(!gate.renderer_execution());
    assert!(!gate.reconciler_execution());
    assert_eq!(
        gate.admission_smoke().environment_id(),
        BridgeEnvironmentId::from_raw(435)
    );
    assert_eq!(gate.admission_smoke().root_id(), Some(1));
    assert!(gate.admission_smoke().root_retired());
    assert_eq!(
        admission_records
            .iter()
            .map(|record| record.root_handle_action().code())
            .collect::<Vec<_>>(),
        [
            "admit-root-handle",
            "validate-active-root-handle",
            "retire-root-handle"
        ]
    );
    assert_eq!(
        admission_records
            .iter()
            .map(|record| record.root_handle_current_generation())
            .collect::<Vec<_>>(),
        [1, 1, 2]
    );
    assert_eq!(
        validation_records
            .iter()
            .map(|record| record.kind().code())
            .collect::<Vec<_>>(),
        ["create", "render", "unmount"]
    );
    assert_eq!(
        admission_records[2].retired_root_source_error_code(),
        Some("FAST_REACT_NAPI_STALE_HANDLE")
    );
    assert_eq!(
        gate.batched_record_gate().status(),
        NATIVE_ROOT_BRIDGE_BATCHED_JSON_TRANSPORT_GATE_STATUS
    );
    assert_eq!(gate.batched_record_gate().request_count(), 3);
    assert_eq!(gate.batched_record_gate().lifecycle_rows().len(), 3);
    assert_eq!(gate.batched_record_gate().error_rows().len(), 5);
    assert!(!gate.batched_record_gate().native_addon_loaded());
    assert!(!gate.batched_record_gate().native_execution());
    assert!(!gate.batched_record_gate().renderer_execution());
    assert!(!gate.batched_record_gate().reconciler_execution());
    assert_eq!(gate.error_diagnostic_rows().len(), 4);
    assert!(gate.error_diagnostic_rows().iter().all(|row| {
        !row.native_addon_loaded()
            && !row.native_execution()
            && !row.renderer_execution()
            && !row.reconciler_execution()
            && !row.react_behavior_error()
    }));
}

#[test]
fn native_root_bridge_batch_lifecycle_executor_applies_source_owned_handle_transitions() {
    fn assert_executor_inert(executor: &NativeRootBridgeJsonBatchLifecycleExecutor) {
        assert!(executor.rust_state_machine_execution());
        assert!(!executor.native_addon_loaded());
        assert!(!executor.native_execution());
        assert!(!executor.renderer_execution());
        assert!(!executor.reconciler_execution());
        assert!(!executor.public_native_compatibility());
        assert!(!executor.react_behavior_error());
    }

    fn assert_executor_row_inert(row: &NativeRootBridgeJsonBatchLifecycleExecutorRow) {
        assert!(row.rust_state_machine_execution());
        assert!(!row.native_addon_loaded());
        assert!(!row.native_execution());
        assert!(!row.renderer_execution());
        assert!(!row.reconciler_execution());
        assert!(!row.public_native_compatibility());
        assert!(!row.react_behavior_error());
    }

    let environment_id = BridgeEnvironmentId::from_raw(870);
    let root_handle = BridgeHandle::new(environment_id, 1, 1, BridgeHandleKind::Root);
    let create_value_handle = BridgeHandle::new(environment_id, 2, 1, BridgeHandleKind::Value);
    let render_value_handle = BridgeHandle::new(environment_id, 3, 1, BridgeHandleKind::Value);
    let records = [
        NativeRootBridgeJsonTransportRecord::new(
            1,
            "create",
            870,
            NativeRootBridgeJsonTransportHandle::new(870, 1, 1, "root"),
            1,
            Some(NativeRootBridgeJsonTransportHandle::new(870, 2, 1, "value")),
            "active",
        ),
        NativeRootBridgeJsonTransportRecord::new(
            2,
            "render",
            870,
            NativeRootBridgeJsonTransportHandle::new(870, 1, 1, "root"),
            1,
            Some(NativeRootBridgeJsonTransportHandle::new(870, 3, 1, "value")),
            "active",
        ),
        NativeRootBridgeJsonTransportRecord::new(
            3,
            "unmount",
            870,
            NativeRootBridgeJsonTransportHandle::new(870, 1, 1, "root"),
            1,
            None,
            "retired",
        ),
    ];
    let json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":870,"root_handle":{"environment_id":870,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":870,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":870,"root_handle":{"environment_id":870,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":870,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":3,"kind":"unmount","environment_id":870,"root_handle":{"environment_id":870,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"}]}"#;

    let executor = native_root_bridge_json_batch_lifecycle_executor_for_json(json).unwrap();
    let record_executor =
        native_root_bridge_json_batch_lifecycle_executor_for_records(&records).unwrap();
    let gate = parse_native_root_bridge_json_transport_for_gate(json).unwrap();
    let rows = executor.rows();

    assert_ne!(
        executor.executor_generation(),
        record_executor.executor_generation()
    );
    assert_eq!(record_executor.request_count(), executor.request_count());
    assert_eq!(
        record_executor
            .rows()
            .iter()
            .map(|row| row.kind())
            .collect::<Vec<_>>(),
        rows.iter().map(|row| row.kind()).collect::<Vec<_>>()
    );
    assert_ne!(
        gate.json_batch_lifecycle_executor().executor_generation(),
        executor.executor_generation()
    );
    assert_eq!(
        gate.json_batch_lifecycle_executor()
            .rows()
            .iter()
            .map(|row| row.kind())
            .collect::<Vec<_>>(),
        rows.iter().map(|row| row.kind()).collect::<Vec<_>>()
    );
    assert_eq!(
        executor.status(),
        NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STATUS
    );
    assert_eq!(
        executor.model(),
        "fast-react-napi.NativeRootBridgeJsonBatchLifecycleExecutor"
    );
    assert_eq!(
        executor.validation_model(),
        NATIVE_ROOT_BRIDGE_REQUEST_VALIDATION_MODEL
    );
    assert_eq!(
        executor.handle_table_model(),
        NATIVE_ROOT_BRIDGE_HANDLE_TABLE_MODEL
    );
    assert_eq!(
        executor.transport(),
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_FORMAT
    );
    assert!(executor.executor_generation() > 0);
    assert_eq!(executor.request_count(), 3);
    assert_eq!(executor.executed_row_count(), 3);
    assert_eq!(executor.environment_id(), environment_id);
    assert_eq!(executor.root_handle(), Some(root_handle));
    assert_eq!(executor.root_id(), Some(1));
    assert!(executor.root_retired());
    assert_eq!(
        executor.final_lifecycle_state(),
        NativeRootBridgeBatchedJsonTransportLifecycleState::Retired
    );
    assert!(executor.source_owned_json_rows());
    assert_eq!(executor.admission_records().len(), 3);
    assert_eq!(executor.validation_records().len(), 3);
    assert_executor_inert(&executor);

    assert_eq!(
        rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
        [
            "json-batch-lifecycle-executor-0-create",
            "json-batch-lifecycle-executor-1-render",
            "json-batch-lifecycle-executor-2-unmount"
        ]
    );
    assert_eq!(
        rows.iter().map(|row| row.kind()).collect::<Vec<_>>(),
        ["create", "render", "unmount"]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.source_environment_id())
            .collect::<Vec<_>>(),
        [environment_id, environment_id, environment_id]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.source_root_handle())
            .collect::<Vec<_>>(),
        [root_handle, root_handle, root_handle]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.source_root_id())
            .collect::<Vec<_>>(),
        [1, 1, 1]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.source_value_handle())
            .collect::<Vec<_>>(),
        [Some(create_value_handle), Some(render_value_handle), None]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.lifecycle_before())
            .collect::<Vec<_>>(),
        [
            NativeRootBridgeBatchedJsonTransportLifecycleState::None,
            NativeRootBridgeBatchedJsonTransportLifecycleState::Active,
            NativeRootBridgeBatchedJsonTransportLifecycleState::Active
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.lifecycle_after())
            .collect::<Vec<_>>(),
        [
            NativeRootBridgeBatchedJsonTransportLifecycleState::Active,
            NativeRootBridgeBatchedJsonTransportLifecycleState::Active,
            NativeRootBridgeBatchedJsonTransportLifecycleState::Retired
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.lifecycle_transition())
            .collect::<Vec<_>>(),
        [
            NativeRootBridgeLifecycleTransition::NoneToActive,
            NativeRootBridgeLifecycleTransition::ActiveToActive,
            NativeRootBridgeLifecycleTransition::ActiveToRetired
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.root_handle_action())
            .collect::<Vec<_>>(),
        [
            NativeRootBridgeHandleAdmissionAction::AdmitRoot,
            NativeRootBridgeHandleAdmissionAction::ValidateActiveRoot,
            NativeRootBridgeHandleAdmissionAction::RetireRoot
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.root_handle_current_generation())
            .collect::<Vec<_>>(),
        [1, 1, 2]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.value_handle_action())
            .collect::<Vec<_>>(),
        [
            Some(NativeRootBridgeHandleAdmissionAction::AdmitValue),
            Some(NativeRootBridgeHandleAdmissionAction::AdmitValue),
            None
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.value_handle_current_generation())
            .collect::<Vec<_>>(),
        [Some(1), Some(1), None]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.retired_root_source_error_code())
            .collect::<Vec<_>>(),
        [None, None, Some("FAST_REACT_NAPI_STALE_HANDLE")]
    );
    assert!(rows.iter().all(|row| {
        row.source_guard().executor_generation() == executor.executor_generation()
            && row.source_guard().batch_index() == row.batch_index()
            && row.source_guard().request_id() == row.request_id()
            && row.source_guard().kind() == row.kind()
            && row.source_guard().table_environment_id() == row.source_environment_id()
            && row.source_guard().source_root_handle() == row.source_root_handle()
            && row.source_guard().source_root_id() == row.source_root_id()
            && row.source_guard().root_handle_current_generation()
                == row.root_handle_current_generation()
            && row.source_guard().source_value_handle() == row.source_value_handle()
            && row.source_guard().value_handle_current_generation()
                == row.value_handle_current_generation()
    }));
    assert_eq!(
        rows.iter()
            .map(|row| row.root_handle_validated())
            .collect::<Vec<_>>(),
        [true, true, true]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.value_handle_validated())
            .collect::<Vec<_>>(),
        [true, true, false]
    );
    assert!(rows.iter().all(|row| {
        row.status() == NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted
            && row.code().is_none()
            && row.source_error_code().is_none()
            && row.boundary_error_code().is_none()
            && row.source_owned_json_row()
    }));
    for row in rows {
        assert_executor_row_inert(row);
    }

    validate_native_root_bridge_json_batch_lifecycle_executor_source_rows(&executor, rows).unwrap();
    assert_eq!(
        validate_native_root_bridge_json_batch_lifecycle_executor_source_rows(
            &record_executor,
            rows
        )
        .unwrap_err(),
        NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STALE_OR_FOREIGN_ROW_CODE
    );

    let stale_root_json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":870,"root_handle":{"environment_id":870,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":870,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":870,"root_handle":{"environment_id":870,"slot":1,"generation":2,"kind":"root"},"root_id":1,"value_handle":{"environment_id":870,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"}]}"#;
    let stale_root_error =
        native_root_bridge_json_batch_lifecycle_executor_for_json(stale_root_json).unwrap_err();
    assert_eq!(stale_root_error.code(), "FAST_REACT_NAPI_STALE_HANDLE");

    let reused_value_json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":870,"root_handle":{"environment_id":870,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":870,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":870,"root_handle":{"environment_id":870,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":870,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"}]}"#;
    let reused_value_error =
        native_root_bridge_json_batch_lifecycle_executor_for_json(reused_value_json).unwrap_err();
    assert_eq!(
        reused_value_error.code(),
        "FAST_REACT_NAPI_ROOT_REQUEST_VALUE_HANDLE_REUSE"
    );

    let stale_value_json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":870,"root_handle":{"environment_id":870,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":870,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":870,"root_handle":{"environment_id":870,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":870,"slot":3,"generation":2,"kind":"value"},"root_handle_state":"active"}]}"#;
    let stale_value_error =
        native_root_bridge_json_batch_lifecycle_executor_for_json(stale_value_json).unwrap_err();
    assert_eq!(stale_value_error.code(), "FAST_REACT_NAPI_STALE_HANDLE");

    let foreign_root_json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":870,"root_handle":{"environment_id":1870,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}"#;
    let foreign_root_error =
        native_root_bridge_json_batch_lifecycle_executor_for_json(foreign_root_json).unwrap_err();
    assert_eq!(
        foreign_root_error.code(),
        "FAST_REACT_NAPI_WRONG_ENVIRONMENT"
    );

    let foreign_value_json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":870,"root_handle":{"environment_id":870,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":1870,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"}]}"#;
    let foreign_value_error =
        native_root_bridge_json_batch_lifecycle_executor_for_json(foreign_value_json).unwrap_err();
    assert_eq!(
        foreign_value_error.code(),
        "FAST_REACT_NAPI_WRONG_ENVIRONMENT"
    );

    let mut foreign_rows = rows.to_vec();
    foreign_rows[1] = foreign_rows[1]
        .clone()
        .with_source_environment_id_for_test(BridgeEnvironmentId::from_raw(1870));
    assert_eq!(
        validate_native_root_bridge_json_batch_lifecycle_executor_source_rows(
            &executor,
            &foreign_rows
        )
        .unwrap_err(),
        NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STALE_OR_FOREIGN_ROW_CODE
    );

    let mut cross_root_rows = rows.to_vec();
    cross_root_rows[1] = cross_root_rows[1].clone().with_source_root_id_for_test(2);
    assert_eq!(
        validate_native_root_bridge_json_batch_lifecycle_executor_source_rows(
            &executor,
            &cross_root_rows
        )
        .unwrap_err(),
        NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STALE_OR_FOREIGN_ROW_CODE
    );

    let mut stale_generation_rows = rows.to_vec();
    stale_generation_rows[2] = stale_generation_rows[2]
        .clone()
        .with_root_handle_current_generation_for_test(1);
    assert_eq!(
        validate_native_root_bridge_json_batch_lifecycle_executor_source_rows(
            &executor,
            &stale_generation_rows
        )
        .unwrap_err(),
        NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STALE_OR_FOREIGN_ROW_CODE
    );

    let mut stale_guard_rows = rows.to_vec();
    let stale_guard = stale_guard_rows[1]
        .source_guard()
        .with_executor_generation_for_test(record_executor.executor_generation());
    stale_guard_rows[1] = stale_guard_rows[1]
        .clone()
        .with_source_guard_for_test(stale_guard);
    assert_eq!(
        validate_native_root_bridge_json_batch_lifecycle_executor_source_rows(
            &executor,
            &stale_guard_rows
        )
        .unwrap_err(),
        NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STALE_OR_FOREIGN_ROW_CODE
    );

    let mut caller_built_rows = rows.to_vec();
    caller_built_rows[0] = caller_built_rows[0]
        .clone()
        .with_source_owned_json_row_for_test(false);
    assert_eq!(
        validate_native_root_bridge_json_batch_lifecycle_executor_source_rows(
            &executor,
            &caller_built_rows
        )
        .unwrap_err(),
        NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_CALLER_BUILT_ROW_CODE
    );

    let mut native_claim_rows = rows.to_vec();
    native_claim_rows[0] = native_claim_rows[0]
        .clone()
        .with_native_execution_claim_for_test();
    assert_eq!(
        validate_native_root_bridge_json_batch_lifecycle_executor_source_rows(
            &executor,
            &native_claim_rows
        )
        .unwrap_err(),
        NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE
    );
}

#[test]
fn native_root_bridge_batch_lifecycle_consumer_consumes_create_render_unmount_records() {
    fn assert_consumer_inert(consumer: &NativeRootBridgeBatchLifecycleConsumer) {
        assert!(!consumer.node_worker_threads_execution());
        assert!(!consumer.napi_cleanup_hook_execution());
        assert!(!consumer.native_addon_loaded());
        assert!(!consumer.native_execution());
        assert!(!consumer.renderer_execution());
        assert!(!consumer.reconciler_execution());
        assert!(!consumer.public_native_compatibility());
        assert!(!consumer.react_behavior_error());
    }

    fn assert_row_inert(row: &NativeRootBridgeBatchLifecycleConsumerRow) {
        assert!(!row.node_worker_threads_execution());
        assert!(!row.napi_cleanup_hook_execution());
        assert!(!row.native_addon_loaded());
        assert!(!row.native_execution());
        assert!(!row.renderer_execution());
        assert!(!row.reconciler_execution());
        assert!(!row.public_native_compatibility());
        assert!(!row.react_behavior_error());
    }

    fn assert_link_inert(link: &NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink) {
        assert!(!link.node_worker_threads_execution());
        assert!(!link.napi_cleanup_hook_execution());
        assert!(!link.native_addon_loaded());
        assert!(!link.native_execution());
        assert!(!link.renderer_execution());
        assert!(!link.reconciler_execution());
        assert!(!link.public_native_compatibility());
        assert!(!link.react_behavior_error());
    }

    fn assert_link_row_inert(
        row: &NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRow,
    ) {
        assert!(!row.node_worker_threads_execution());
        assert!(!row.napi_cleanup_hook_execution());
        assert!(!row.native_addon_loaded());
        assert!(!row.native_execution());
        assert!(!row.renderer_execution());
        assert!(!row.reconciler_execution());
        assert!(!row.public_native_compatibility());
        assert!(!row.react_behavior_error());
    }

    let json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":845,"root_handle":{"environment_id":845,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":845,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":845,"root_handle":{"environment_id":845,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":845,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":3,"kind":"unmount","environment_id":845,"root_handle":{"environment_id":845,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"}]}"#;

    let consumer = native_root_bridge_batch_lifecycle_consumer_for_json(json).unwrap();
    let rows = consumer.rows();

    assert_eq!(
        consumer.status(),
        NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_STATUS
    );
    assert_eq!(
        consumer.model(),
        "fast-react-napi.NativeRootBridgeBatchLifecycleConsumer"
    );
    assert_eq!(
        consumer.validation_model(),
        NATIVE_ROOT_BRIDGE_REQUEST_VALIDATION_MODEL
    );
    assert_eq!(
        consumer.handle_table_model(),
        NATIVE_ROOT_BRIDGE_HANDLE_TABLE_MODEL
    );
    assert_eq!(
        consumer.batch_gate_status(),
        NATIVE_ROOT_BRIDGE_BATCHED_JSON_TRANSPORT_GATE_STATUS
    );
    assert_eq!(
        consumer.cleanup_hook_preflight_status(),
        NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PREFLIGHT_STATUS
    );
    assert_eq!(consumer.request_count(), 3);
    assert_eq!(consumer.consumed_batch_record_count(), 3);
    assert_eq!(consumer.accepted_batch_record_count(), 3);
    assert!(consumer.cleanup_hook_callable_preflight_accepted());
    assert_eq!(consumer.accepted_cleanup_evidence_count(), 2);
    assert_eq!(consumer.rejected_cleanup_evidence_count(), 2);
    assert!(consumer.json_batch_lifecycle_executor_generation() > 0);
    assert!(consumer.json_batch_lifecycle_executor_source_rows_validated());
    assert_eq!(
        consumer.json_batch_lifecycle_executor_source_error_code(),
        None
    );
    assert!(consumer.json_batch_lifecycle_executor_replay_guard_consumed());
    assert_consumer_inert(&consumer);

    let link = consumer.json_batch_roundtrip_link();
    assert_eq!(
        link.link_status(),
        NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_LINK_STATUS
    );
    assert_eq!(
        link.model(),
        "fast-react-napi.NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink"
    );
    assert_eq!(
        link.validation_model(),
        NATIVE_ROOT_BRIDGE_REQUEST_VALIDATION_MODEL
    );
    assert_eq!(
        link.handle_table_model(),
        NATIVE_ROOT_BRIDGE_HANDLE_TABLE_MODEL
    );
    assert_eq!(
        link.consumer_status(),
        NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_STATUS
    );
    assert_eq!(
        link.batch_gate_status(),
        NATIVE_ROOT_BRIDGE_BATCHED_JSON_TRANSPORT_GATE_STATUS
    );
    assert_eq!(
        link.response_sequence_gate_status(),
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_GATE_STATUS
    );
    assert_eq!(
        link.stream_roundtrip_gate_status(),
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_GATE_STATUS
    );
    assert_eq!(
        link.batch_id(),
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID
    );
    assert_eq!(
        link.stream_id(),
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_STREAM_ID
    );
    assert_eq!(
        link.validate_json_batch_roundtrip_link_rows_name(),
        "validateNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRows"
    );
    assert_eq!(link.row_statuses(), ["linked", "rejected"]);
    assert_eq!(
        link.rejection_case_ids(),
        [
            "consumer-row-id-mismatch",
            "consumer-row-order-mismatch",
            "consumer-kind-transition-mismatch",
            "consumer-cleanup-status-mismatch",
            "stale-or-foreign-json-batch-row",
            "public-native-execution-claim"
        ]
    );
    assert_eq!(link.request_count(), 3);
    assert_eq!(link.linked_row_count(), 3);
    assert_eq!(link.rejected_row_count(), 0);
    assert!(link.source_owned_native_rows());
    assert!(link.rejected_rows().is_empty());
    assert_link_inert(link);

    let link_rows = link.rows();
    assert_eq!(link_rows.len(), 3);
    assert_eq!(
        link_rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
        [
            "batch-lifecycle-consumer-json-roundtrip-link-0-create",
            "batch-lifecycle-consumer-json-roundtrip-link-1-render",
            "batch-lifecycle-consumer-json-roundtrip-link-2-unmount"
        ]
    );
    assert_eq!(
        link_rows
            .iter()
            .map(|row| row.consumer_row_id())
            .collect::<Vec<_>>(),
        [
            Some("batch-lifecycle-consumer-0-create"),
            Some("batch-lifecycle-consumer-1-render"),
            Some("batch-lifecycle-consumer-2-unmount")
        ]
    );
    assert_eq!(
        link_rows
            .iter()
            .map(|row| row.lifecycle_row_id())
            .collect::<Vec<_>>(),
        [
            Some("batch-record-0-create"),
            Some("batch-record-1-render"),
            Some("batch-record-2-unmount")
        ]
    );
    assert_eq!(
        link_rows
            .iter()
            .map(|row| row.response_row_id())
            .collect::<Vec<_>>(),
        [
            Some("batch-response-0-create"),
            Some("batch-response-1-render"),
            Some("batch-response-2-unmount")
        ]
    );
    assert_eq!(
        link_rows
            .iter()
            .map(|row| row.stream_metadata_row_id())
            .collect::<Vec<_>>(),
        [
            Some("stream-batch-chunk-0-request-1-metadata"),
            Some("stream-batch-chunk-2-request-2-metadata"),
            Some("stream-batch-chunk-4-request-3-metadata")
        ]
    );
    assert_eq!(
        link_rows
            .iter()
            .map(|row| row.stream_payload_row_id())
            .collect::<Vec<_>>(),
        [
            Some("stream-batch-chunk-1-request-1-payload"),
            Some("stream-batch-chunk-3-request-2-payload"),
            Some("stream-batch-chunk-5-request-3-payload")
        ]
    );
    assert_eq!(
        link_rows.iter().map(|row| row.kind()).collect::<Vec<_>>(),
        ["create", "render", "unmount"]
    );
    assert_eq!(
        link_rows
            .iter()
            .map(|row| row.lifecycle_transition())
            .collect::<Vec<_>>(),
        [
            Some(NativeRootBridgeLifecycleTransition::NoneToActive),
            Some(NativeRootBridgeLifecycleTransition::ActiveToActive),
            Some(NativeRootBridgeLifecycleTransition::ActiveToRetired)
        ]
    );
    assert_eq!(
        link_rows
            .iter()
            .map(|row| row.root_handle_action())
            .collect::<Vec<_>>(),
        [
            Some(NativeRootBridgeHandleAdmissionAction::AdmitRoot),
            Some(NativeRootBridgeHandleAdmissionAction::ValidateActiveRoot),
            Some(NativeRootBridgeHandleAdmissionAction::RetireRoot)
        ]
    );
    assert_eq!(
        link_rows
            .iter()
            .map(|row| row.cleanup_hook_evidence_status())
            .collect::<Vec<_>>(),
        [Some("not-required"), Some("accepted"), Some("accepted")]
    );
    assert_eq!(
        link_rows
            .iter()
            .map(|row| row.request_order())
            .collect::<Vec<_>>(),
        [Some(0), Some(1), Some(2)]
    );
    assert_eq!(
        link_rows
            .iter()
            .map(|row| row.response_order())
            .collect::<Vec<_>>(),
        [Some(0), Some(1), Some(2)]
    );
    assert_eq!(
        link_rows
            .iter()
            .map(|row| row.metadata_batch_sequence())
            .collect::<Vec<_>>(),
        [Some(0), Some(2), Some(4)]
    );
    assert_eq!(
        link_rows
            .iter()
            .map(|row| row.payload_batch_sequence())
            .collect::<Vec<_>>(),
        [Some(1), Some(3), Some(5)]
    );
    assert_eq!(
        link_rows
            .iter()
            .map(|row| row.metadata_chunk_kind())
            .collect::<Vec<_>>(),
        [
            Some(NativeRootBridgeJsonTransportStreamChunkKind::Metadata),
            Some(NativeRootBridgeJsonTransportStreamChunkKind::Metadata),
            Some(NativeRootBridgeJsonTransportStreamChunkKind::Metadata)
        ]
    );
    assert_eq!(
        link_rows
            .iter()
            .map(|row| row.payload_chunk_kind())
            .collect::<Vec<_>>(),
        [
            Some(NativeRootBridgeJsonTransportStreamChunkKind::Payload),
            Some(NativeRootBridgeJsonTransportStreamChunkKind::Payload),
            Some(NativeRootBridgeJsonTransportStreamChunkKind::Payload)
        ]
    );
    assert_eq!(
        link_rows
            .iter()
            .map(|row| row.response_status())
            .collect::<Vec<_>>(),
        [
            Some(NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted),
            Some(NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted),
            Some(NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted)
        ]
    );
    assert_eq!(
        link_rows
            .iter()
            .map(|row| row.payload_assembly_state())
            .collect::<Vec<_>>(),
        [
            Some(NativeRootBridgeJsonTransportStreamAssemblyState::Assembled),
            Some(NativeRootBridgeJsonTransportStreamAssemblyState::Assembled),
            Some(NativeRootBridgeJsonTransportStreamAssemblyState::Assembled)
        ]
    );
    assert_eq!(
        link_rows
            .iter()
            .map(|row| row.teardown_state())
            .collect::<Vec<_>>(),
        [
            Some(NativeRootBridgeBatchResponseTeardownState::Active),
            Some(NativeRootBridgeBatchResponseTeardownState::Active),
            Some(NativeRootBridgeBatchResponseTeardownState::Retired)
        ]
    );
    assert_eq!(
        link_rows.iter().map(|row| row.status()).collect::<Vec<_>>(),
        [
            NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowStatus::Linked,
            NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowStatus::Linked,
            NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowStatus::Linked
        ]
    );
    assert!(link_rows.iter().all(|row| {
        row.code().is_none()
            && row.source_owned_native_row()
            && row.batch_id() == NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID
            && row.stream_id() == NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_STREAM_ID
    }));
    for row in link_rows {
        assert_link_row_inert(row);
    }

    assert_eq!(rows.len(), 3);
    assert_eq!(
        rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
        [
            "batch-lifecycle-consumer-0-create",
            "batch-lifecycle-consumer-1-render",
            "batch-lifecycle-consumer-2-unmount"
        ]
    );
    assert_eq!(
        rows.iter().map(|row| row.batch_index()).collect::<Vec<_>>(),
        [0, 1, 2]
    );
    assert_eq!(
        rows.iter().map(|row| row.request_id()).collect::<Vec<_>>(),
        [1, 2, 3]
    );
    assert_eq!(
        rows.iter().map(|row| row.kind()).collect::<Vec<_>>(),
        ["create", "render", "unmount"]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.lifecycle_transition())
            .collect::<Vec<_>>(),
        [
            Some(NativeRootBridgeLifecycleTransition::NoneToActive),
            Some(NativeRootBridgeLifecycleTransition::ActiveToActive),
            Some(NativeRootBridgeLifecycleTransition::ActiveToRetired)
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.root_handle_action())
            .collect::<Vec<_>>(),
        [
            NativeRootBridgeHandleAdmissionAction::AdmitRoot,
            NativeRootBridgeHandleAdmissionAction::ValidateActiveRoot,
            NativeRootBridgeHandleAdmissionAction::RetireRoot
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.root_handle_state_before())
            .collect::<Vec<_>>(),
        [
            None,
            Some(NativeRootBridgeRootHandleState::Active),
            Some(NativeRootBridgeRootHandleState::Active)
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.root_handle_state_after())
            .collect::<Vec<_>>(),
        [
            NativeRootBridgeRootHandleState::Active,
            NativeRootBridgeRootHandleState::Active,
            NativeRootBridgeRootHandleState::Retired
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.root_handle_current_generation())
            .collect::<Vec<_>>(),
        [1, 1, 2]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.value_handle_action())
            .collect::<Vec<_>>(),
        [
            Some(NativeRootBridgeHandleAdmissionAction::AdmitValue),
            Some(NativeRootBridgeHandleAdmissionAction::AdmitValue),
            None
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.value_handle_current_generation())
            .collect::<Vec<_>>(),
        [Some(1), Some(1), None]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.retired_root_source_error_code())
            .collect::<Vec<_>>(),
        [None, None, Some("FAST_REACT_NAPI_STALE_HANDLE")]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_evidence_required())
            .collect::<Vec<_>>(),
        [false, true, true]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_evidence_status())
            .collect::<Vec<_>>(),
        [
            "not-required",
            NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Accepted.code(),
            NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Accepted.code()
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_evidence_row_id())
            .collect::<Vec<_>>(),
        [
            None,
            Some("cleanup-hook-worker-value-after-root-release"),
            Some("cleanup-hook-worker-root-before-value-release")
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_source_row_id())
            .collect::<Vec<_>>(),
        [
            None,
            Some("worker-render-value-stale-executable-preflight"),
            Some("worker-render-root-stale-executable-preflight")
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_source_handle_kind())
            .collect::<Vec<_>>(),
        [
            None,
            Some(BridgeHandleKind::Value),
            Some(BridgeHandleKind::Root)
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_source_handle_environment_id())
            .collect::<Vec<_>>(),
        [
            None,
            Some(BridgeEnvironmentId::from_raw(764)),
            Some(BridgeEnvironmentId::from_raw(764))
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_source_handle_slot())
            .collect::<Vec<_>>(),
        [None, Some(3), Some(1)]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_source_handle_generation())
            .collect::<Vec<_>>(),
        [None, Some(1), Some(1)]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_source_current_generation())
            .collect::<Vec<_>>(),
        [None, Some(2), Some(2)]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_source_record_id())
            .collect::<Vec<_>>(),
        [None, None, None]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_source_root_id())
            .collect::<Vec<_>>(),
        [None, Some(1), Some(1)]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_canonical_executable_evidence())
            .collect::<Vec<_>>(),
        [None, Some(true), Some(true)]
    );
    assert_eq!(
        rows.iter().map(|row| row.status()).collect::<Vec<_>>(),
        [
            NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted,
            NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted,
            NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted
        ]
    );
    assert!(rows.iter().all(|row| {
        row.code().is_none()
            && row.source_error_code().is_none()
            && row.boundary_error_code().is_none()
    }));

    for row in rows {
        assert_row_inert(row);
    }

    let replay_gate = parse_native_root_bridge_json_transport_for_gate(json).unwrap();
    let first_consumer = native_root_bridge_batch_lifecycle_consumer_for_gate(&replay_gate);
    assert!(first_consumer.json_batch_lifecycle_executor_source_rows_validated());
    assert!(first_consumer.json_batch_lifecycle_executor_replay_guard_consumed());
    assert_eq!(first_consumer.consumed_batch_record_count(), 3);

    let replayed_consumer = native_root_bridge_batch_lifecycle_consumer_for_gate(&replay_gate);
    assert!(!replayed_consumer.json_batch_lifecycle_executor_source_rows_validated());
    assert_eq!(
        replayed_consumer.json_batch_lifecycle_executor_source_error_code(),
        Some(NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STALE_OR_FOREIGN_ROW_CODE)
    );
    assert!(!replayed_consumer.json_batch_lifecycle_executor_replay_guard_consumed());
    assert_eq!(
        replayed_consumer.json_batch_lifecycle_executor_generation(),
        first_consumer.json_batch_lifecycle_executor_generation()
    );
    assert_eq!(replayed_consumer.consumed_batch_record_count(), 0);
    assert_eq!(replayed_consumer.accepted_batch_record_count(), 0);
    assert!(replayed_consumer.rows().is_empty());
    assert!(
        !replayed_consumer
            .json_batch_roundtrip_link()
            .source_owned_native_rows()
    );
    assert!(replayed_consumer
            .json_batch_roundtrip_link()
            .rejected_rows()
            .iter()
            .any(|row| {
                row.code()
                    == Some(
                        NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_STALE_OR_FOREIGN_JSON_BATCH_ROW_CODE,
                    )
            }));
    assert_consumer_inert(&replayed_consumer);
}

#[test]
fn native_root_bridge_batch_lifecycle_cleanup_hook_generation_consumer_consumes_current_executor_evidence()
 {
    fn assert_consumer_inert(consumer: &NativeRootBridgeCleanupGenerationConsumer) {
        assert!(!consumer.node_worker_threads_execution());
        assert!(!consumer.napi_cleanup_hook_execution());
        assert!(!consumer.native_addon_loaded());
        assert!(!consumer.native_execution());
        assert!(!consumer.renderer_execution());
        assert!(!consumer.reconciler_execution());
        assert!(!consumer.public_native_compatibility());
        assert!(!consumer.react_behavior_error());
    }

    fn assert_row_inert(row: &NativeRootBridgeCleanupGenerationConsumerRow) {
        assert!(!row.node_worker_threads_execution());
        assert!(!row.napi_cleanup_hook_execution());
        assert!(!row.native_addon_loaded());
        assert!(!row.native_execution());
        assert!(!row.renderer_execution());
        assert!(!row.reconciler_execution());
        assert!(!row.public_native_compatibility());
        assert!(!row.react_behavior_error());
    }

    let json = native_root_bridge_cleanup_generation_consumer_json(764);
    let gate = parse_native_root_bridge_json_transport_for_gate(&json).unwrap();
    let cleanup_hook_preflight = native_root_bridge_worker_thread_cleanup_hook_preflight();
    let consumer =
        native_root_bridge_cleanup_generation_consumer_for_gate(&gate, &cleanup_hook_preflight);

    assert_eq!(
        consumer.status(),
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STATUS
    );
    assert_eq!(
        consumer.model(),
        "fast-react-napi.NativeRootBridgeCleanupGenerationConsumer"
    );
    assert_eq!(
        consumer.validation_model(),
        NATIVE_ROOT_BRIDGE_REQUEST_VALIDATION_MODEL
    );
    assert_eq!(
        consumer.handle_table_model(),
        NATIVE_ROOT_BRIDGE_HANDLE_TABLE_MODEL
    );
    assert_eq!(
        consumer.executor_status(),
        NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STATUS
    );
    assert_eq!(
        consumer.cleanup_hook_preflight_status(),
        NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PREFLIGHT_STATUS
    );
    assert_eq!(
        consumer.executor_generation(),
        gate.json_batch_lifecycle_executor().executor_generation()
    );
    assert!(consumer.executor_generation() > 0);
    assert!(consumer.source_rows_validated());
    assert!(consumer.cleanup_hook_preflight_accepted());
    assert!(consumer.cleanup_generation_consumed());
    assert_eq!(consumer.cleanup_generation_error_code(), None);
    assert_eq!(consumer.consumed_cleanup_generation_count(), 2);
    assert_consumer_inert(&consumer);

    let rows = consumer.rows();
    assert_eq!(rows.len(), 2);
    assert_eq!(
        rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
        [
            "cleanup-generation-consumer-1-root",
            "cleanup-generation-consumer-1-value"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.executor_generation())
            .collect::<Vec<_>>(),
        [
            consumer.executor_generation(),
            consumer.executor_generation()
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.executor_row_id())
            .collect::<Vec<_>>(),
        [
            "json-batch-lifecycle-executor-1-render",
            "json-batch-lifecycle-executor-1-render"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_evidence_row_id())
            .collect::<Vec<_>>(),
        [
            "cleanup-hook-worker-root-before-value-release",
            "cleanup-hook-worker-value-after-root-release"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_source_worker_thread_id())
            .collect::<Vec<_>>(),
        [764, 764]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_source_environment_id())
            .collect::<Vec<_>>(),
        [
            BridgeEnvironmentId::from_raw(764),
            BridgeEnvironmentId::from_raw(764)
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_source_row_id())
            .collect::<Vec<_>>(),
        [
            "worker-render-root-stale-executable-preflight",
            "worker-render-value-stale-executable-preflight"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_source_provenance_token())
            .collect::<Vec<_>>(),
        [
            Some(
                "cleanup-hook-source-provenance:worker-764:env-764:render-root:slot-1:g1-current-2"
            ),
            Some(
                "cleanup-hook-source-provenance:worker-764:env-764:render-value:slot-3:g1-current-2"
            )
        ]
    );
    assert_eq!(
        rows.iter().map(|row| row.batch_index()).collect::<Vec<_>>(),
        [1, 1]
    );
    assert_eq!(
        rows.iter().map(|row| row.request_id()).collect::<Vec<_>>(),
        [2, 2]
    );
    assert_eq!(
        rows.iter().map(|row| row.kind()).collect::<Vec<_>>(),
        ["render", "render"]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.source_environment_id())
            .collect::<Vec<_>>(),
        [
            BridgeEnvironmentId::from_raw(764),
            BridgeEnvironmentId::from_raw(764)
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.source_root_id())
            .collect::<Vec<_>>(),
        [1, 1]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.source_handle_kind())
            .collect::<Vec<_>>(),
        [BridgeHandleKind::Root, BridgeHandleKind::Value]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.source_handle().slot())
            .collect::<Vec<_>>(),
        [1, 3]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.source_handle().generation())
            .collect::<Vec<_>>(),
        [1, 1]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.executor_handle_current_generation())
            .collect::<Vec<_>>(),
        [1, 1]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_source_current_generation())
            .collect::<Vec<_>>(),
        [2, 2]
    );
    assert!(rows.iter().all(|row| {
        row.source_root_handle().slot() == 1
            && row.source_root_handle().generation() == 1
            && row.source_owned_executor_row()
            && row.cleanup_hook_order_private()
            && row.cleanup_hook_identity_private()
            && row.canonical_executable_evidence()
    }));
    for row in rows {
        assert_row_inert(row);
    }

    let replayed =
        native_root_bridge_cleanup_generation_consumer_for_gate(&gate, &cleanup_hook_preflight);
    assert!(!replayed.source_rows_validated());
    assert!(!replayed.cleanup_generation_consumed());
    assert_eq!(
        replayed.cleanup_generation_error_code(),
        Some(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_REPLAYED_EVIDENCE_CODE)
    );
    assert_eq!(replayed.consumed_cleanup_generation_count(), 0);
    assert!(replayed.rows().is_empty());
    assert_consumer_inert(&replayed);
}

#[test]
fn native_root_bridge_batch_lifecycle_cleanup_hook_generation_consumer_rejects_executor_row_forgery()
 {
    fn assert_cleanup_generation_rejection(
        executor: &NativeRootBridgeJsonBatchLifecycleExecutor,
        candidate_rows: &[NativeRootBridgeJsonBatchLifecycleExecutorRow],
        cleanup_hook_preflight: &crate::root_bridge_requests::NativeRootBridgeWorkerThreadCleanupHookPreflight,
        expected_code: &'static str,
    ) {
        let consumer = native_root_bridge_cleanup_generation_consumer_for_sources(
            executor,
            candidate_rows,
            cleanup_hook_preflight,
        );

        assert!(!consumer.cleanup_generation_consumed());
        assert_eq!(
            consumer.cleanup_generation_error_code(),
            Some(expected_code)
        );
        assert_eq!(consumer.consumed_cleanup_generation_count(), 0);
        assert!(consumer.rows().is_empty());
        assert!(!consumer.node_worker_threads_execution());
        assert!(!consumer.napi_cleanup_hook_execution());
        assert!(!consumer.native_addon_loaded());
        assert!(!consumer.native_execution());
        assert!(!consumer.renderer_execution());
        assert!(!consumer.reconciler_execution());
        assert!(!consumer.public_native_compatibility());
        assert!(!consumer.react_behavior_error());
    }

    let json = native_root_bridge_cleanup_generation_consumer_json(764);
    let gate = parse_native_root_bridge_json_transport_for_gate(&json).unwrap();
    let executor = gate.json_batch_lifecycle_executor();
    let cleanup_hook_preflight = native_root_bridge_worker_thread_cleanup_hook_preflight();
    let source_rows = executor.rows().to_vec();

    let mut stale_generation_rows = source_rows.clone();
    let stale_guard = stale_generation_rows[1]
        .source_guard()
        .with_executor_generation_for_test(executor.executor_generation().saturating_add(1));
    stale_generation_rows[1] = stale_generation_rows[1]
        .clone()
        .with_source_guard_for_test(stale_guard);
    assert_cleanup_generation_rejection(
        executor,
        &stale_generation_rows,
        &cleanup_hook_preflight,
        NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STALE_OR_FOREIGN_ROW_CODE,
    );

    let mut caller_built_rows = source_rows.clone();
    caller_built_rows[0] = caller_built_rows[0]
        .clone()
        .with_source_owned_json_row_for_test(false);
    assert_cleanup_generation_rejection(
        executor,
        &caller_built_rows,
        &cleanup_hook_preflight,
        NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_CALLER_BUILT_ROW_CODE,
    );

    let mut native_claim_rows = source_rows.clone();
    native_claim_rows[0] = native_claim_rows[0]
        .clone()
        .with_native_execution_claim_for_test();
    assert_cleanup_generation_rejection(
        executor,
        &native_claim_rows,
        &cleanup_hook_preflight,
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE,
    );

    let mut cloned_rows = source_rows.clone();
    cloned_rows[0] = cloned_rows[1].clone();
    assert_cleanup_generation_rejection(
        executor,
        &cloned_rows,
        &cleanup_hook_preflight,
        NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STALE_OR_FOREIGN_ROW_CODE,
    );

    let foreign_json = native_root_bridge_cleanup_generation_consumer_json(1764);
    let foreign_gate = parse_native_root_bridge_json_transport_for_gate(&foreign_json).unwrap();
    assert_cleanup_generation_rejection(
        executor,
        foreign_gate.json_batch_lifecycle_executor().rows(),
        &cleanup_hook_preflight,
        NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STALE_OR_FOREIGN_ROW_CODE,
    );
}

#[test]
fn native_root_bridge_batch_lifecycle_cleanup_hook_generation_consumer_rejects_cleanup_identity_forgery()
 {
    fn assert_cleanup_preflight_rejection(
        cleanup_hook_preflight: &crate::root_bridge_requests::NativeRootBridgeWorkerThreadCleanupHookPreflight,
        expected_code: &'static str,
    ) {
        let json = native_root_bridge_cleanup_generation_consumer_json(764);
        let gate = parse_native_root_bridge_json_transport_for_gate(&json).unwrap();
        let consumer =
            native_root_bridge_cleanup_generation_consumer_for_gate(&gate, cleanup_hook_preflight);

        assert!(!consumer.cleanup_generation_consumed());
        assert_eq!(
            consumer.cleanup_generation_error_code(),
            Some(expected_code)
        );
        assert!(consumer.rows().is_empty());
        assert!(!consumer.native_addon_loaded());
        assert!(!consumer.native_execution());
        assert!(!consumer.renderer_execution());
        assert!(!consumer.reconciler_execution());
        assert!(!consumer.node_worker_threads_execution());
        assert!(!consumer.napi_cleanup_hook_execution());
        assert!(!consumer.public_native_compatibility());
        assert!(!consumer.react_behavior_error());
    }

    let cleanup_hook_preflight = native_root_bridge_worker_thread_cleanup_hook_preflight();
    let foreign_json = native_root_bridge_cleanup_generation_consumer_json(1764);
    let foreign_gate = parse_native_root_bridge_json_transport_for_gate(&foreign_json).unwrap();
    let foreign_consumer = native_root_bridge_cleanup_generation_consumer_for_gate(
        &foreign_gate,
        &cleanup_hook_preflight,
    );
    assert!(!foreign_consumer.cleanup_generation_consumed());
    assert_eq!(
        foreign_consumer.cleanup_generation_error_code(),
        Some(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE)
    );

    let missing_value_canonical =
        validate_native_root_bridge_worker_thread_cleanup_hook_preflight_rows([
            cleanup_hook_preflight.rows()[0],
        ]);
    assert_cleanup_preflight_rejection(
        &missing_value_canonical,
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE,
    );

    let public_package_claim = NativeRootBridgeWorkerThreadCleanupHookEvidence::from_preflight_row(
        cleanup_hook_preflight.rows()[0],
    )
    .with_public_native_package_claim();
    let public_package_preflight =
        validate_native_root_bridge_worker_thread_cleanup_hook_evidence_rows([
            public_package_claim,
            NativeRootBridgeWorkerThreadCleanupHookEvidence::from_preflight_row(
                cleanup_hook_preflight.rows()[1],
            ),
        ]);
    assert_cleanup_preflight_rejection(
        &public_package_preflight,
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE,
    );
}

#[test]
fn native_root_bridge_batch_lifecycle_cleanup_hook_generation_consumer_rejects_forged_cleanup_evidence_ids_before_replay_key()
 {
    fn forged_cleanup_preflight(
        root_evidence_id: &'static str,
        value_evidence_id: &'static str,
    ) -> NativeRootBridgeWorkerThreadCleanupHookPreflight {
        let canonical = native_root_bridge_worker_thread_cleanup_hook_preflight();
        validate_native_root_bridge_worker_thread_cleanup_hook_evidence_rows([
            NativeRootBridgeWorkerThreadCleanupHookEvidence::from_preflight_row(
                canonical.rows()[0],
            )
            .with_id_for_test(root_evidence_id),
            NativeRootBridgeWorkerThreadCleanupHookEvidence::from_preflight_row(
                canonical.rows()[1],
            )
            .with_id_for_test(value_evidence_id),
        ])
    }

    for (case, forged_preflight) in [
        (
            "forged-root-cleanup-evidence-id",
            forged_cleanup_preflight(
                "caller-shaped-root-cleanup-hook-evidence",
                "cleanup-hook-worker-value-after-root-release",
            ),
        ),
        (
            "forged-value-cleanup-evidence-id",
            forged_cleanup_preflight(
                "cleanup-hook-worker-root-before-value-release",
                "caller-shaped-value-cleanup-hook-evidence",
            ),
        ),
    ] {
        let json = native_root_bridge_cleanup_generation_consumer_json(764);
        let gate = parse_native_root_bridge_json_transport_for_gate(&json).unwrap();

        assert_eq!(
            forged_preflight.accepted_cleanup_evidence_count(),
            0,
            "{case}"
        );
        assert!(
            !forged_preflight.canonical_executable_evidence_accepted(),
            "{case}"
        );
        assert!(forged_preflight.rows().iter().all(|row| {
                row.status() == NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Rejected
                    && row.code()
                        == Some(NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_CANONICAL_SET_MISMATCH_CODE)
            }), "{case}");

        let rejected =
            native_root_bridge_cleanup_generation_consumer_for_gate(&gate, &forged_preflight);
        assert!(!rejected.source_rows_validated(), "{case}");
        assert!(!rejected.cleanup_hook_preflight_accepted(), "{case}");
        assert!(!rejected.cleanup_generation_consumed(), "{case}");
        assert_eq!(
            rejected.cleanup_generation_error_code(),
            Some(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE),
            "{case}"
        );
        assert_eq!(rejected.consumed_cleanup_generation_count(), 0, "{case}");
        assert!(rejected.rows().is_empty(), "{case}");
        assert!(!rejected.node_worker_threads_execution(), "{case}");
        assert!(!rejected.napi_cleanup_hook_execution(), "{case}");
        assert!(!rejected.native_addon_loaded(), "{case}");
        assert!(!rejected.native_execution(), "{case}");
        assert!(!rejected.renderer_execution(), "{case}");
        assert!(!rejected.reconciler_execution(), "{case}");
        assert!(!rejected.public_native_compatibility(), "{case}");

        let canonical_preflight = native_root_bridge_worker_thread_cleanup_hook_preflight();
        let accepted =
            native_root_bridge_cleanup_generation_consumer_for_gate(&gate, &canonical_preflight);
        assert!(accepted.source_rows_validated(), "{case}");
        assert!(accepted.cleanup_hook_preflight_accepted(), "{case}");
        assert!(accepted.cleanup_generation_consumed(), "{case}");
        assert_eq!(accepted.consumed_cleanup_generation_count(), 2, "{case}");

        let replayed =
            native_root_bridge_cleanup_generation_consumer_for_gate(&gate, &canonical_preflight);
        assert!(!replayed.cleanup_generation_consumed(), "{case}");
        assert_eq!(
            replayed.cleanup_generation_error_code(),
            Some(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_REPLAYED_EVIDENCE_CODE),
            "{case}"
        );
    }
}

#[test]
fn native_root_bridge_batch_lifecycle_cleanup_hook_generation_consumer_rejects_forged_cleanup_source_provenance_before_replay_key()
 {
    fn forged_cleanup_preflight(
        forge_root_provenance: bool,
    ) -> NativeRootBridgeWorkerThreadCleanupHookPreflight {
        let canonical = native_root_bridge_worker_thread_cleanup_hook_preflight();
        let root_evidence = NativeRootBridgeWorkerThreadCleanupHookEvidence::from_preflight_row(
            canonical.rows()[0],
        );
        let value_evidence = NativeRootBridgeWorkerThreadCleanupHookEvidence::from_preflight_row(
            canonical.rows()[1],
        );

        if forge_root_provenance {
            validate_native_root_bridge_worker_thread_cleanup_hook_evidence_rows([
                root_evidence.with_source_provenance_token_for_test(Some(
                    "caller-shaped-root-cleanup-source-provenance",
                )),
                value_evidence,
            ])
        } else {
            validate_native_root_bridge_worker_thread_cleanup_hook_evidence_rows([
                root_evidence,
                value_evidence.with_source_provenance_token_for_test(Some(
                    "caller-shaped-value-cleanup-source-provenance",
                )),
            ])
        }
    }

    for (case, forged_preflight) in [
        (
            "forged-root-cleanup-source-provenance",
            forged_cleanup_preflight(true),
        ),
        (
            "forged-value-cleanup-source-provenance",
            forged_cleanup_preflight(false),
        ),
    ] {
        let json = native_root_bridge_cleanup_generation_consumer_json(764);
        let gate = parse_native_root_bridge_json_transport_for_gate(&json).unwrap();

        assert_eq!(
            forged_preflight.accepted_cleanup_evidence_count(),
            0,
            "{case}"
        );
        assert!(
            !forged_preflight.canonical_executable_evidence_accepted(),
            "{case}"
        );
        assert!(
            forged_preflight.rows().iter().all(|row| {
                row.status() == NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Rejected
            }),
            "{case}"
        );
        assert!(
            forged_preflight.rows().iter().any(|row| {
                row.code()
                    == Some(NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_FORGED_EVIDENCE_CODE)
            }),
            "{case}"
        );

        let rejected =
            native_root_bridge_cleanup_generation_consumer_for_gate(&gate, &forged_preflight);
        assert!(!rejected.source_rows_validated(), "{case}");
        assert!(!rejected.cleanup_hook_preflight_accepted(), "{case}");
        assert!(!rejected.cleanup_generation_consumed(), "{case}");
        assert_eq!(
            rejected.cleanup_generation_error_code(),
            Some(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE),
            "{case}"
        );
        assert_eq!(rejected.consumed_cleanup_generation_count(), 0, "{case}");
        assert!(rejected.rows().is_empty(), "{case}");

        let canonical_preflight = native_root_bridge_worker_thread_cleanup_hook_preflight();
        let accepted =
            native_root_bridge_cleanup_generation_consumer_for_gate(&gate, &canonical_preflight);
        assert!(accepted.source_rows_validated(), "{case}");
        assert!(accepted.cleanup_hook_preflight_accepted(), "{case}");
        assert!(accepted.cleanup_generation_consumed(), "{case}");
        assert_eq!(accepted.consumed_cleanup_generation_count(), 2, "{case}");

        let replayed =
            native_root_bridge_cleanup_generation_consumer_for_gate(&gate, &canonical_preflight);
        assert!(!replayed.cleanup_generation_consumed(), "{case}");
        assert_eq!(
            replayed.cleanup_generation_error_code(),
            Some(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_REPLAYED_EVIDENCE_CODE),
            "{case}"
        );
    }
}

#[test]
fn native_root_bridge_batch_lifecycle_cleanup_hook_generation_consumer_rejects_stale_json_handles()
{
    let cleanup_hook_preflight = native_root_bridge_worker_thread_cleanup_hook_preflight();
    let stale_root_json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":764,"root_handle":{"environment_id":764,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":764,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":764,"root_handle":{"environment_id":764,"slot":1,"generation":2,"kind":"root"},"root_id":1,"value_handle":{"environment_id":764,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"}]}"#;
    let stale_root_error = native_root_bridge_cleanup_generation_consumer_for_json(
        stale_root_json,
        &cleanup_hook_preflight,
    )
    .unwrap_err();
    assert_eq!(stale_root_error.code(), "FAST_REACT_NAPI_STALE_HANDLE");

    let stale_value_json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":764,"root_handle":{"environment_id":764,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":764,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":764,"root_handle":{"environment_id":764,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":764,"slot":3,"generation":2,"kind":"value"},"root_handle_state":"active"}]}"#;
    let stale_value_error = native_root_bridge_cleanup_generation_consumer_for_json(
        stale_value_json,
        &cleanup_hook_preflight,
    )
    .unwrap_err();
    assert_eq!(stale_value_error.code(), "FAST_REACT_NAPI_STALE_HANDLE");

    let reused_value_json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":764,"root_handle":{"environment_id":764,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":764,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":764,"root_handle":{"environment_id":764,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":764,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"}]}"#;
    let reused_value_error = native_root_bridge_cleanup_generation_consumer_for_json(
        reused_value_json,
        &cleanup_hook_preflight,
    )
    .unwrap_err();
    assert_eq!(
        reused_value_error.code(),
        "FAST_REACT_NAPI_ROOT_REQUEST_VALUE_HANDLE_REUSE"
    );
}

#[test]
fn native_root_bridge_cleanup_generation_currentness_canary_accepts_current_private_handoff() {
    let (lifecycle_consumer, cleanup_generation_consumer, cleanup_hook_preflight) =
        accepted_cleanup_generation_currentness_sources();
    let canary = native_root_bridge_cleanup_generation_currentness_canary_for_private_sources(
        &lifecycle_consumer,
        &cleanup_generation_consumer,
        &cleanup_hook_preflight,
        cleanup_generation_consumer.rows(),
    );

    assert_eq!(
        canary.status(),
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CANARY_STATUS
    );
    assert_eq!(
        canary.model(),
        "fast-react-napi.NativeRootBridgeCleanupGenerationCurrentnessCanary"
    );
    assert_eq!(
        canary.lifecycle_consumer_status(),
        NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_STATUS
    );
    assert_eq!(
        canary.cleanup_generation_consumer_status(),
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STATUS
    );
    assert_eq!(
        canary.cleanup_hook_preflight_status(),
        NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PREFLIGHT_STATUS
    );
    assert_eq!(
        canary.current_executor_generation(),
        lifecycle_consumer.json_batch_lifecycle_executor_generation()
    );
    assert_eq!(
        canary.cleanup_executor_generation(),
        cleanup_generation_consumer.executor_generation()
    );
    assert_eq!(
        canary.current_executor_generation(),
        canary.cleanup_executor_generation()
    );
    assert!(canary.cleanup_handoff_current());
    assert_eq!(canary.cleanup_handoff_error_code(), None);
    assert!(canary.cleanup_reentry_guard_consumed());
    assert_eq!(canary.accepted_cleanup_handoff_count(), 2);
    assert_cleanup_generation_currentness_canary_inert(&canary);

    let rows = canary.rows();
    assert_eq!(rows.len(), 2);
    assert_eq!(
        rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
        [
            "cleanup-generation-currentness-canary-1-root",
            "cleanup-generation-currentness-canary-1-value"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.lifecycle_consumer_row_id())
            .collect::<Vec<_>>(),
        [
            "batch-lifecycle-consumer-1-render",
            "batch-lifecycle-consumer-1-render"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_handoff_row_id())
            .collect::<Vec<_>>(),
        [
            "cleanup-generation-consumer-1-root",
            "cleanup-generation-consumer-1-value"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.current_executor_generation())
            .collect::<Vec<_>>(),
        [
            canary.current_executor_generation(),
            canary.current_executor_generation()
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_executor_generation())
            .collect::<Vec<_>>(),
        [
            canary.cleanup_executor_generation(),
            canary.cleanup_executor_generation()
        ]
    );
    assert_eq!(
        rows.iter().map(|row| row.batch_index()).collect::<Vec<_>>(),
        [1, 1]
    );
    assert_eq!(
        rows.iter().map(|row| row.request_id()).collect::<Vec<_>>(),
        [2, 2]
    );
    assert_eq!(
        rows.iter().map(|row| row.kind()).collect::<Vec<_>>(),
        ["render", "render"]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.lifecycle_transition())
            .collect::<Vec<_>>(),
        [
            NativeRootBridgeLifecycleTransition::ActiveToActive,
            NativeRootBridgeLifecycleTransition::ActiveToActive
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.root_handle_state_before())
            .collect::<Vec<_>>(),
        [
            NativeRootBridgeRootHandleState::Active,
            NativeRootBridgeRootHandleState::Active
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.root_handle_state_after())
            .collect::<Vec<_>>(),
        [
            NativeRootBridgeRootHandleState::Active,
            NativeRootBridgeRootHandleState::Active
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.source_environment_id())
            .collect::<Vec<_>>(),
        [
            BridgeEnvironmentId::from_raw(764),
            BridgeEnvironmentId::from_raw(764)
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.source_root_handle().slot())
            .collect::<Vec<_>>(),
        [1, 1]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.source_root_id())
            .collect::<Vec<_>>(),
        [1, 1]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.source_handle_kind())
            .collect::<Vec<_>>(),
        [BridgeHandleKind::Root, BridgeHandleKind::Value]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.source_handle().slot())
            .collect::<Vec<_>>(),
        [1, 3]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.source_handle().generation())
            .collect::<Vec<_>>(),
        [1, 1]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.handle_table_current_generation())
            .collect::<Vec<_>>(),
        [1, 1]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_current_generation())
            .collect::<Vec<_>>(),
        [2, 2]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_evidence_row_id())
            .collect::<Vec<_>>(),
        [
            "cleanup-hook-worker-root-before-value-release",
            "cleanup-hook-worker-value-after-root-release"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_source_worker_thread_id())
            .collect::<Vec<_>>(),
        [764, 764]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_source_environment_id())
            .collect::<Vec<_>>(),
        [
            BridgeEnvironmentId::from_raw(764),
            BridgeEnvironmentId::from_raw(764)
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_source_row_id())
            .collect::<Vec<_>>(),
        [
            "worker-render-root-stale-executable-preflight",
            "worker-render-value-stale-executable-preflight"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_source_provenance_token())
            .collect::<Vec<_>>(),
        [
            Some(
                "cleanup-hook-source-provenance:worker-764:env-764:render-root:slot-1:g1-current-2"
            ),
            Some(
                "cleanup-hook-source-provenance:worker-764:env-764:render-value:slot-3:g1-current-2"
            )
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_id())
            .collect::<Vec<_>>(),
        [
            "worker-root-handle-cleanup-hook",
            "worker-value-handle-cleanup-hook"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_function_identity_token())
            .collect::<Vec<_>>(),
        [
            "private-cleanup-hook-fn:worker-root-handle-teardown",
            "private-cleanup-hook-fn:worker-value-handle-teardown"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_hook_argument_identity_token())
            .collect::<Vec<_>>(),
        [
            "private-cleanup-hook-arg:worker-764-root-slot-1",
            "private-cleanup-hook-arg:worker-764-value-slot-3"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.cleanup_reentry_guard_status())
            .collect::<Vec<_>>(),
        [
            NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_GUARD_CONSUMED_STATUS,
            NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_GUARD_CONSUMED_STATUS
        ]
    );
    assert!(rows.iter().all(|row| {
        row.source_owned_cleanup_handoff()
            && row.source_currentness_monotonic()
            && row.cleanup_hook_order_private()
            && row.cleanup_hook_identity_private()
            && row.canonical_executable_evidence()
    }));
    for row in rows {
        assert_cleanup_generation_currentness_row_inert(row);
    }
}

#[test]
fn native_root_bridge_cleanup_generation_currentness_canary_rejects_duplicate_cleanup_reentry() {
    let (lifecycle_consumer, cleanup_generation_consumer, cleanup_hook_preflight) =
        accepted_cleanup_generation_currentness_sources();
    let accepted = native_root_bridge_cleanup_generation_currentness_canary_for_private_sources(
        &lifecycle_consumer,
        &cleanup_generation_consumer,
        &cleanup_hook_preflight,
        cleanup_generation_consumer.rows(),
    );

    assert!(accepted.cleanup_handoff_current());
    assert!(accepted.cleanup_reentry_guard_consumed());
    assert!(
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_EVIDENCE_IDS
            .contains(&"cleanup-generation-currentness-reentry-guard-consumed")
    );
    assert!(
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_EVIDENCE_IDS
            .contains(&"cleanup-generation-currentness-duplicate-cleanup-rejected")
    );
    assert!(
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_EVIDENCE_IDS
            .contains(&"cleanup-generation-currentness-source-record-id-smuggling-rejected")
    );
    assert!(accepted.rows().iter().all(|row| {
        row.source_currentness_monotonic()
            && row.lifecycle_transition() == NativeRootBridgeLifecycleTransition::ActiveToActive
            && row.root_handle_state_before() == NativeRootBridgeRootHandleState::Active
            && row.root_handle_state_after() == NativeRootBridgeRootHandleState::Active
    }));
    assert_cleanup_generation_currentness_rejection(
        &lifecycle_consumer,
        &cleanup_generation_consumer,
        &cleanup_hook_preflight,
        cleanup_generation_consumer.rows(),
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_DUPLICATE_CLEANUP_CODE,
    );
}

#[test]
fn native_root_bridge_cleanup_generation_currentness_canary_rejects_stale_generation_after_new_native_step()
 {
    let (_old_lifecycle, old_cleanup_generation, old_cleanup_hook_preflight) =
        accepted_cleanup_generation_currentness_sources();
    let (current_lifecycle, _current_cleanup_generation, _current_cleanup_hook_preflight) =
        accepted_cleanup_generation_currentness_sources();

    assert_ne!(
        current_lifecycle.json_batch_lifecycle_executor_generation(),
        old_cleanup_generation.executor_generation()
    );
    assert!(
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_EVIDENCE_IDS
            .contains(&"cleanup-generation-currentness-stale-generation-reentry-rejected")
    );
    assert_cleanup_generation_currentness_rejection(
        &current_lifecycle,
        &old_cleanup_generation,
        &old_cleanup_hook_preflight,
        old_cleanup_generation.rows(),
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_GENERATION_CODE,
    );
}

#[test]
fn native_root_bridge_cleanup_generation_currentness_canary_rejects_forged_or_cloned_cleanup_rows()
{
    let (lifecycle_consumer, cleanup_generation_consumer, cleanup_hook_preflight) =
        accepted_cleanup_generation_currentness_sources();
    let cloned_root_rows = vec![
        cleanup_generation_consumer.rows()[0].clone(),
        cleanup_generation_consumer.rows()[0].clone(),
    ];
    assert_cleanup_generation_currentness_rejection(
        &lifecycle_consumer,
        &cleanup_generation_consumer,
        &cleanup_hook_preflight,
        &cloned_root_rows,
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_FORGED_CLEANUP_ROW_CODE,
    );

    let mut forged_rows = cleanup_generation_consumer.rows().to_vec();
    forged_rows[1] = forged_rows[1]
        .clone()
        .with_canonical_executable_evidence_for_test(false);
    assert_cleanup_generation_currentness_rejection(
        &lifecycle_consumer,
        &cleanup_generation_consumer,
        &cleanup_hook_preflight,
        &forged_rows,
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_FORGED_CLEANUP_ROW_CODE,
    );
}

#[test]
fn native_root_bridge_cleanup_generation_currentness_canary_rejects_source_record_identity_smuggling()
 {
    let (lifecycle_consumer, cleanup_generation_consumer, cleanup_hook_preflight) =
        accepted_cleanup_generation_currentness_sources();

    assert!(
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_EVIDENCE_IDS
            .contains(&"cleanup-generation-currentness-source-record-id-smuggling-rejected")
    );

    let mut forged_handoff_id_rows = cleanup_generation_consumer.rows().to_vec();
    forged_handoff_id_rows[0] = forged_handoff_id_rows[0]
        .clone()
        .with_id_for_test("caller-built-cleanup-generation-consumer-1-root");
    assert_cleanup_generation_currentness_rejection(
        &lifecycle_consumer,
        &cleanup_generation_consumer,
        &cleanup_hook_preflight,
        &forged_handoff_id_rows,
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CALLER_BUILT_METADATA_CODE,
    );

    let mut forged_executor_row_id_rows = cleanup_generation_consumer.rows().to_vec();
    forged_executor_row_id_rows[1] = forged_executor_row_id_rows[1]
        .clone()
        .with_executor_row_id_for_test("json-batch-lifecycle-executor-1-unmount");
    assert_cleanup_generation_currentness_rejection(
        &lifecycle_consumer,
        &cleanup_generation_consumer,
        &cleanup_hook_preflight,
        &forged_executor_row_id_rows,
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CALLER_BUILT_METADATA_CODE,
    );

    let mut forged_lifecycle_rows = lifecycle_consumer.rows().to_vec();
    forged_lifecycle_rows[1] = forged_lifecycle_rows[1]
        .clone()
        .with_id_for_test("batch-lifecycle-consumer-1-unmount");
    let forged_lifecycle_consumer = lifecycle_consumer.with_rows_for_test(forged_lifecycle_rows);
    assert_cleanup_generation_currentness_rejection(
        &forged_lifecycle_consumer,
        &cleanup_generation_consumer,
        &cleanup_hook_preflight,
        cleanup_generation_consumer.rows(),
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CALLER_BUILT_METADATA_CODE,
    );
}

#[test]
fn native_root_bridge_cleanup_generation_currentness_canary_rejects_cleanup_hook_source_provenance_smuggling()
 {
    let (lifecycle_consumer, cleanup_generation_consumer, cleanup_hook_preflight) =
        accepted_cleanup_generation_currentness_sources();

    assert!(
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_EVIDENCE_IDS
            .contains(&"cleanup-generation-currentness-source-provenance-smuggling-rejected")
    );

    let mut forged_source_provenance_rows = cleanup_generation_consumer.rows().to_vec();
    forged_source_provenance_rows[0] = forged_source_provenance_rows[0]
        .clone()
        .with_cleanup_hook_source_provenance_token_for_test(Some(
            "caller-shaped-root-cleanup-source-provenance",
        ));
    assert_cleanup_generation_currentness_rejection(
        &lifecycle_consumer,
        &cleanup_generation_consumer,
        &cleanup_hook_preflight,
        &forged_source_provenance_rows,
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_FORGED_CLEANUP_ROW_CODE,
    );

    let accepted = native_root_bridge_cleanup_generation_currentness_canary_for_private_sources(
        &lifecycle_consumer,
        &cleanup_generation_consumer,
        &cleanup_hook_preflight,
        cleanup_generation_consumer.rows(),
    );
    assert!(accepted.cleanup_handoff_current());
    assert!(accepted.cleanup_reentry_guard_consumed());
    assert_eq!(accepted.accepted_cleanup_handoff_count(), 2);
}

#[test]
fn native_root_bridge_cleanup_generation_currentness_canary_rejects_cross_worker_thread_handoff_reuse()
 {
    let (lifecycle_consumer, cleanup_generation_consumer, cleanup_hook_preflight) =
        accepted_cleanup_generation_currentness_sources();

    let mut foreign_worker_thread_rows = cleanup_generation_consumer.rows().to_vec();
    foreign_worker_thread_rows[0] = foreign_worker_thread_rows[0]
        .clone()
        .with_cleanup_hook_source_worker_thread_id_for_test(524);
    assert_cleanup_generation_currentness_rejection(
        &lifecycle_consumer,
        &cleanup_generation_consumer,
        &cleanup_hook_preflight,
        &foreign_worker_thread_rows,
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CROSS_WORKER_THREAD_CODE,
    );

    let mut foreign_worker_environment_rows = cleanup_generation_consumer.rows().to_vec();
    foreign_worker_environment_rows[1] = foreign_worker_environment_rows[1]
        .clone()
        .with_cleanup_hook_source_environment_id_for_test(BridgeEnvironmentId::from_raw(1764));
    assert_cleanup_generation_currentness_rejection(
        &lifecycle_consumer,
        &cleanup_generation_consumer,
        &cleanup_hook_preflight,
        &foreign_worker_environment_rows,
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CROSS_WORKER_THREAD_CODE,
    );
}

#[test]
fn native_root_bridge_cleanup_generation_currentness_canary_rejects_cross_environment_and_cross_table_rows()
 {
    let (lifecycle_consumer, cleanup_generation_consumer, cleanup_hook_preflight) =
        accepted_cleanup_generation_currentness_sources();

    assert!(
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_EVIDENCE_IDS
            .contains(&"cleanup-generation-currentness-cross-environment-reentry-rejected")
    );

    let mut foreign_environment_rows = cleanup_generation_consumer.rows().to_vec();
    foreign_environment_rows[0] = foreign_environment_rows[0]
        .clone()
        .with_source_environment_id_for_test(BridgeEnvironmentId::from_raw(1764));
    assert_cleanup_generation_currentness_rejection(
        &lifecycle_consumer,
        &cleanup_generation_consumer,
        &cleanup_hook_preflight,
        &foreign_environment_rows,
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE,
    );

    let mut foreign_table_rows = cleanup_generation_consumer.rows().to_vec();
    foreign_table_rows[1] =
        foreign_table_rows[1]
            .clone()
            .with_source_handle_for_test(BridgeHandle::new(
                BridgeEnvironmentId::from_raw(764),
                99,
                1,
                BridgeHandleKind::Value,
            ));
    assert_cleanup_generation_currentness_rejection(
        &lifecycle_consumer,
        &cleanup_generation_consumer,
        &cleanup_hook_preflight,
        &foreign_table_rows,
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE,
    );
}

#[test]
fn native_root_bridge_cleanup_generation_currentness_canary_rejects_replay_and_retired_lifecycle() {
    let json = native_root_bridge_cleanup_generation_consumer_json(764);
    let gate = parse_native_root_bridge_json_transport_for_gate(&json).unwrap();
    let cleanup_hook_preflight = native_root_bridge_worker_thread_cleanup_hook_preflight();
    let lifecycle_consumer = native_root_bridge_batch_lifecycle_consumer_for_gate(&gate);
    let first_cleanup_generation =
        native_root_bridge_cleanup_generation_consumer_for_gate(&gate, &cleanup_hook_preflight);
    assert!(first_cleanup_generation.cleanup_generation_consumed());
    let replayed_cleanup_generation =
        native_root_bridge_cleanup_generation_consumer_for_gate(&gate, &cleanup_hook_preflight);
    assert!(!replayed_cleanup_generation.cleanup_generation_consumed());
    assert_cleanup_generation_currentness_rejection(
        &lifecycle_consumer,
        &replayed_cleanup_generation,
        &cleanup_hook_preflight,
        replayed_cleanup_generation.rows(),
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REPLAYED_OR_RETIRED_CODE,
    );

    let retired_json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":764,"root_handle":{"environment_id":764,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":764,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":764,"root_handle":{"environment_id":764,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":764,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":3,"kind":"unmount","environment_id":764,"root_handle":{"environment_id":764,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"}]}"#;
    let retired_gate = parse_native_root_bridge_json_transport_for_gate(retired_json).unwrap();
    let retired_lifecycle_consumer =
        native_root_bridge_batch_lifecycle_consumer_for_gate(&retired_gate);
    let retired_cleanup_generation = native_root_bridge_cleanup_generation_consumer_for_gate(
        &retired_gate,
        &cleanup_hook_preflight,
    );
    assert!(
        retired_lifecycle_consumer
            .rows()
            .iter()
            .any(|row| row.root_handle_state_after() == NativeRootBridgeRootHandleState::Retired)
    );
    assert!(
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_EVIDENCE_IDS
            .contains(&"cleanup-generation-currentness-reentry-after-retire-rejected")
    );
    assert!(retired_cleanup_generation.cleanup_generation_consumed());
    assert_cleanup_generation_currentness_rejection(
        &retired_lifecycle_consumer,
        &retired_cleanup_generation,
        &cleanup_hook_preflight,
        retired_cleanup_generation.rows(),
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_AFTER_RETIRE_CODE,
    );
}

#[test]
fn native_root_bridge_cleanup_generation_currentness_canary_rejects_missing_identity_caller_metadata_and_public_claims()
 {
    let (lifecycle_consumer, cleanup_generation_consumer, cleanup_hook_preflight) =
        accepted_cleanup_generation_currentness_sources();

    assert!(
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_EVIDENCE_IDS
            .contains(&"cleanup-generation-currentness-missing-source-identity-rejected")
    );
    assert!(
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_EVIDENCE_IDS
            .contains(&"cleanup-generation-currentness-caller-built-reentry-rejected")
    );
    assert!(
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_EVIDENCE_IDS
            .contains(&"cleanup-generation-currentness-public-native-package-claim-rejected")
    );

    let mut missing_identity_rows = cleanup_generation_consumer.rows().to_vec();
    missing_identity_rows[0] = missing_identity_rows[0]
        .clone()
        .with_cleanup_hook_identity_private_for_test(false);
    assert_cleanup_generation_currentness_rejection(
        &lifecycle_consumer,
        &cleanup_generation_consumer,
        &cleanup_hook_preflight,
        &missing_identity_rows,
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_MISSING_CLEANUP_HOOK_IDENTITY_CODE,
    );

    let mut missing_source_identity_rows = cleanup_generation_consumer.rows().to_vec();
    missing_source_identity_rows[0] = missing_source_identity_rows[0]
        .clone()
        .with_cleanup_hook_source_worker_thread_id_for_test(0);
    assert_cleanup_generation_currentness_rejection(
        &lifecycle_consumer,
        &cleanup_generation_consumer,
        &cleanup_hook_preflight,
        &missing_source_identity_rows,
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_MISSING_CLEANUP_HOOK_IDENTITY_CODE,
    );

    let mut caller_built_rows = cleanup_generation_consumer.rows().to_vec();
    caller_built_rows[1] = caller_built_rows[1]
        .clone()
        .with_source_owned_executor_row_for_test(false);
    assert_cleanup_generation_currentness_rejection(
        &lifecycle_consumer,
        &cleanup_generation_consumer,
        &cleanup_hook_preflight,
        &caller_built_rows,
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CALLER_BUILT_METADATA_CODE,
    );

    let mut public_claim_rows = cleanup_generation_consumer.rows().to_vec();
    public_claim_rows[0] = public_claim_rows[0]
        .clone()
        .with_native_execution_claim_for_test();
    assert_cleanup_generation_currentness_rejection(
        &lifecycle_consumer,
        &cleanup_generation_consumer,
        &cleanup_hook_preflight,
        &public_claim_rows,
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE,
    );

    let public_package_claim = NativeRootBridgeWorkerThreadCleanupHookEvidence::from_preflight_row(
        cleanup_hook_preflight.rows()[0],
    )
    .with_public_native_package_claim();
    let public_package_preflight =
        validate_native_root_bridge_worker_thread_cleanup_hook_evidence_rows([
            public_package_claim,
            NativeRootBridgeWorkerThreadCleanupHookEvidence::from_preflight_row(
                cleanup_hook_preflight.rows()[1],
            ),
        ]);
    assert_cleanup_generation_currentness_rejection(
        &lifecycle_consumer,
        &cleanup_generation_consumer,
        &public_package_preflight,
        cleanup_generation_consumer.rows(),
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE,
    );
}

#[test]
fn native_root_bridge_batch_lifecycle_json_roundtrip_link_rejects_forged_rows() {
    fn assert_link_rejection_code(
        consumer_rows: &[NativeRootBridgeBatchLifecycleConsumerRow],
        lifecycle_rows: &[crate::root_bridge_requests::NativeRootBridgeBatchedJsonTransportLifecycleRow],
        response_rows: &[crate::root_bridge_requests::NativeRootBridgeBatchResponseSequenceRow],
        stream_rows: &[crate::root_bridge_requests::NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow],
        smoke_records: &[crate::root_bridge_requests::NativeRootBridgeHandleTableAdmissionSmokeRecord],
        expected_code: &'static str,
    ) {
        let link =
            validate_native_root_bridge_batch_lifecycle_consumer_json_batch_roundtrip_link_rows(
                consumer_rows,
                lifecycle_rows,
                response_rows,
                stream_rows,
                smoke_records,
            );
        assert!(!link.source_owned_native_rows());
        assert!(link.rejected_row_count() > 0);
        assert_eq!(
            link.linked_row_count() + link.rejected_row_count(),
            link.rows().len()
        );
        assert!(
            link.rejected_rows()
                .iter()
                .any(|row| row.code() == Some(expected_code)),
            "expected rejection code {expected_code}"
        );
        for row in link.rejected_rows() {
            assert_eq!(
                row.status(),
                NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowStatus::Rejected
            );
            assert!(!row.source_owned_native_row());
            assert!(!row.native_addon_loaded());
            assert!(!row.native_execution());
            assert!(!row.renderer_execution());
            assert!(!row.reconciler_execution());
            assert!(!row.node_worker_threads_execution());
            assert!(!row.napi_cleanup_hook_execution());
            assert!(!row.public_native_compatibility());
            assert!(!row.react_behavior_error());
            assert!(row.code().is_some());
        }
    }

    let json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":858,"root_handle":{"environment_id":858,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":858,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":858,"root_handle":{"environment_id":858,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":858,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":3,"kind":"unmount","environment_id":858,"root_handle":{"environment_id":858,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"}]}"#;
    let gate = parse_native_root_bridge_json_transport_for_gate(json).unwrap();
    let consumer = native_root_bridge_batch_lifecycle_consumer_for_json(json).unwrap();
    let consumer_rows = consumer.rows().to_vec();
    let lifecycle_rows = gate.batched_record_gate().lifecycle_rows().to_vec();
    let response_rows = gate
        .batched_record_gate()
        .response_sequence_gate()
        .rows()
        .to_vec();
    let stream_rows = gate
        .batched_record_gate()
        .response_sequence_gate()
        .stream_roundtrip_gate()
        .rows()
        .to_vec();
    let smoke_records = gate.admission_smoke().admission_records().to_vec();
    let foreign_json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":1858,"root_handle":{"environment_id":1858,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":1858,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":1858,"root_handle":{"environment_id":1858,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":1858,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":3,"kind":"unmount","environment_id":1858,"root_handle":{"environment_id":1858,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"}]}"#;
    let foreign_gate = parse_native_root_bridge_json_transport_for_gate(foreign_json).unwrap();
    let foreign_response_rows = foreign_gate
        .batched_record_gate()
        .response_sequence_gate()
        .rows()
        .to_vec();
    let foreign_stream_rows = foreign_gate
        .batched_record_gate()
        .response_sequence_gate()
        .stream_roundtrip_gate()
        .rows()
        .to_vec();
    let foreign_smoke_records = foreign_gate.admission_smoke().admission_records().to_vec();

    let mut bad_consumer_rows = consumer_rows.clone();
    bad_consumer_rows[0] = bad_consumer_rows[0]
        .clone()
        .with_id_for_test("batch-lifecycle-consumer-0-render");
    assert_link_rejection_code(
        &bad_consumer_rows,
        &lifecycle_rows,
        &response_rows,
        &stream_rows,
        &smoke_records,
        NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_ROW_ID_MISMATCH_CODE,
    );

    let mut reordered_consumer_rows = consumer_rows.clone();
    reordered_consumer_rows.swap(0, 1);
    assert_link_rejection_code(
        &reordered_consumer_rows,
        &lifecycle_rows,
        &response_rows,
        &stream_rows,
        &smoke_records,
        NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_ROW_ORDER_MISMATCH_CODE,
    );

    let mut bad_consumer_rows = consumer_rows.clone();
    bad_consumer_rows[1] = bad_consumer_rows[1]
        .clone()
        .with_lifecycle_transition_for_test(Some(
            NativeRootBridgeLifecycleTransition::ActiveToRetired,
        ))
        .with_root_handle_action_for_test(NativeRootBridgeHandleAdmissionAction::RetireRoot);
    assert_link_rejection_code(
            &bad_consumer_rows,
            &lifecycle_rows,
            &response_rows,
            &stream_rows,
            &smoke_records,
            NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_KIND_TRANSITION_MISMATCH_CODE,
        );

    let mut bad_consumer_rows = consumer_rows.clone();
    bad_consumer_rows[1] = bad_consumer_rows[1]
        .clone()
        .with_cleanup_hook_evidence_status_for_test("rejected");
    assert_link_rejection_code(
            &bad_consumer_rows,
            &lifecycle_rows,
            &response_rows,
            &stream_rows,
            &smoke_records,
            NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_CLEANUP_STATUS_MISMATCH_CODE,
        );

    let mut bad_consumer_rows = consumer_rows.clone();
    bad_consumer_rows[1] = bad_consumer_rows[1]
        .clone()
        .with_cleanup_hook_evidence_row_id_for_test(None);
    assert_link_rejection_code(
            &bad_consumer_rows,
            &lifecycle_rows,
            &response_rows,
            &stream_rows,
            &smoke_records,
            NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_CLEANUP_STATUS_MISMATCH_CODE,
        );

    let mut bad_consumer_rows = consumer_rows.clone();
    bad_consumer_rows[1] = bad_consumer_rows[1]
        .clone()
        .with_cleanup_hook_source_row_id_for_test(None);
    assert_link_rejection_code(
            &bad_consumer_rows,
            &lifecycle_rows,
            &response_rows,
            &stream_rows,
            &smoke_records,
            NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_CLEANUP_STATUS_MISMATCH_CODE,
        );

    let mut bad_consumer_rows = consumer_rows.clone();
    bad_consumer_rows[1] = bad_consumer_rows[1]
        .clone()
        .with_cleanup_hook_source_handle_kind_for_test(None);
    assert_link_rejection_code(
            &bad_consumer_rows,
            &lifecycle_rows,
            &response_rows,
            &stream_rows,
            &smoke_records,
            NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_CLEANUP_STATUS_MISMATCH_CODE,
        );

    let mut bad_consumer_rows = consumer_rows.clone();
    bad_consumer_rows[1] = bad_consumer_rows[1]
        .clone()
        .with_cleanup_hook_source_handle_slot_for_test(None);
    assert_link_rejection_code(
            &bad_consumer_rows,
            &lifecycle_rows,
            &response_rows,
            &stream_rows,
            &smoke_records,
            NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_CLEANUP_STATUS_MISMATCH_CODE,
        );

    let mut bad_response_rows = response_rows.clone();
    bad_response_rows[0] = bad_response_rows[0]
        .clone()
        .with_batch_id_for_test("foreign-native-root-bridge-json-batch");
    assert_link_rejection_code(
            &consumer_rows,
            &lifecycle_rows,
            &bad_response_rows,
            &stream_rows,
            &smoke_records,
            NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_STALE_OR_FOREIGN_JSON_BATCH_ROW_CODE,
        );

    assert_link_rejection_code(
            &consumer_rows,
            &lifecycle_rows,
            &foreign_response_rows,
            &stream_rows,
            &smoke_records,
            NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_STALE_OR_FOREIGN_JSON_BATCH_ROW_CODE,
        );

    let mut bad_stream_rows = stream_rows.clone();
    bad_stream_rows[0] = bad_stream_rows[0]
        .clone()
        .with_stream_id_for_test("foreign-native-root-bridge-json-stream");
    assert_link_rejection_code(
            &consumer_rows,
            &lifecycle_rows,
            &response_rows,
            &bad_stream_rows,
            &smoke_records,
            NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_STALE_OR_FOREIGN_JSON_BATCH_ROW_CODE,
        );

    assert_link_rejection_code(
            &consumer_rows,
            &lifecycle_rows,
            &response_rows,
            &foreign_stream_rows,
            &smoke_records,
            NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_STALE_OR_FOREIGN_JSON_BATCH_ROW_CODE,
        );

    let mut bad_stream_rows = stream_rows.clone();
    bad_stream_rows[0] = bad_stream_rows[0]
        .clone()
        .with_chunk_kind_for_test(NativeRootBridgeJsonTransportStreamChunkKind::Payload);
    assert_link_rejection_code(
            &consumer_rows,
            &lifecycle_rows,
            &response_rows,
            &bad_stream_rows,
            &smoke_records,
            NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_STALE_OR_FOREIGN_JSON_BATCH_ROW_CODE,
        );

    let mut bad_consumer_rows = consumer_rows.clone();
    bad_consumer_rows[0] = bad_consumer_rows[0]
        .clone()
        .with_native_execution_claim_for_test();
    assert_link_rejection_code(
            &bad_consumer_rows,
            &lifecycle_rows,
            &response_rows,
            &stream_rows,
            &smoke_records,
            NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE,
        );

    assert_link_rejection_code(
            &consumer_rows,
            &lifecycle_rows,
            &response_rows,
            &stream_rows,
            &foreign_smoke_records,
            NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_STALE_OR_FOREIGN_JSON_BATCH_ROW_CODE,
        );

    let mut cross_root_lifecycle_rows = lifecycle_rows.clone();
    cross_root_lifecycle_rows[1] = cross_root_lifecycle_rows[1]
        .clone()
        .with_source_root_id_for_test(Some(2));
    assert_link_rejection_code(
            &consumer_rows,
            &cross_root_lifecycle_rows,
            &response_rows,
            &stream_rows,
            &smoke_records,
            NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_STALE_OR_FOREIGN_JSON_BATCH_ROW_CODE,
        );

    let stale_root_json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":858,"root_handle":{"environment_id":858,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":858,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":858,"root_handle":{"environment_id":858,"slot":1,"generation":1,"kind":"root"},"root_id":2,"value_handle":{"environment_id":858,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"}]}"#;
    let stale_root_error =
        native_root_bridge_batch_lifecycle_consumer_for_json(stale_root_json).unwrap_err();
    assert_eq!(
        stale_root_error.code(),
        "FAST_REACT_NAPI_ROOT_REQUEST_RECORD_ROOT_ID_MISMATCH"
    );

    let stale_handle_json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":858,"root_handle":{"environment_id":858,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":858,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":858,"root_handle":{"environment_id":858,"slot":1,"generation":2,"kind":"root"},"root_id":1,"value_handle":{"environment_id":858,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"}]}"#;
    let stale_handle_error =
        native_root_bridge_batch_lifecycle_consumer_for_json(stale_handle_json).unwrap_err();
    assert_eq!(stale_handle_error.code(), "FAST_REACT_NAPI_STALE_HANDLE");
}

#[test]
fn native_root_bridge_json_transport_parser_gate_reports_deterministic_parse_errors() {
    let invalid_json = parse_native_root_bridge_json_transport_for_gate("{").unwrap_err();
    assert_eq!(
        invalid_json.code(),
        "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_JSON"
    );
    assert!(matches!(
        invalid_json,
        NativeRootBridgeJsonTransportParseError::InvalidJson { .. }
    ));
    assert_eq!(invalid_json.source_error_code(), None);

    let expected_object = parse_native_root_bridge_json_transport_for_gate("[]").unwrap_err();
    assert_eq!(
        expected_object,
        NativeRootBridgeJsonTransportParseError::ExpectedObject {
            path: "$".to_owned(),
            actual: NativeRootBridgeJsonTransportValueKind::Array
        }
    );
    assert_eq!(
        expected_object.code(),
        "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_EXPECTED_OBJECT"
    );

    let missing_field = parse_native_root_bridge_json_transport_for_gate(
        r#"{"transport":"json","schemaVersion":1}"#,
    )
    .unwrap_err();
    assert_eq!(
        missing_field,
        NativeRootBridgeJsonTransportParseError::MissingField {
            path: "$".to_owned(),
            field: "requestRecords"
        }
    );
    assert_eq!(
        missing_field.code(),
        "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_MISSING_FIELD"
    );

    let unexpected_field = parse_native_root_bridge_json_transport_for_gate(
        r#"{"transport":"json","schemaVersion":1,"requestRecords":[],"extra":true}"#,
    )
    .unwrap_err();
    assert_eq!(
        unexpected_field,
        NativeRootBridgeJsonTransportParseError::UnexpectedField {
            path: "$".to_owned(),
            field: "extra".to_owned()
        }
    );
    assert_eq!(
        unexpected_field.code(),
        "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNEXPECTED_FIELD"
    );

    let wrong_records_type = parse_native_root_bridge_json_transport_for_gate(
        r#"{"transport":"json","schemaVersion":1,"requestRecords":{}}"#,
    )
    .unwrap_err();
    assert_eq!(
        wrong_records_type,
        NativeRootBridgeJsonTransportParseError::InvalidFieldType {
            path: "$.requestRecords".to_owned(),
            expected: "array",
            actual: NativeRootBridgeJsonTransportValueKind::Object
        }
    );
    assert_eq!(
        wrong_records_type.code(),
        "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_FIELD_TYPE"
    );

    let wrong_transport = parse_native_root_bridge_json_transport_for_gate(
        r#"{"transport":"binary","schemaVersion":1,"requestRecords":[]}"#,
    )
    .unwrap_err();
    assert_eq!(
        wrong_transport,
        NativeRootBridgeJsonTransportParseError::UnsupportedFieldValue {
            path: "$.transport".to_owned(),
            expected: "json",
            actual: "binary".to_owned()
        }
    );
    assert_eq!(
        wrong_transport.code(),
        "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNSUPPORTED_FIELD_VALUE"
    );

    let unknown_kind =
            parse_native_root_bridge_json_transport_for_gate(
                r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"hydrate","environment_id":435,"root_handle":{"environment_id":435,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}"#,
            )
            .unwrap_err();
    assert_eq!(
        unknown_kind,
        NativeRootBridgeJsonTransportParseError::UnsupportedFieldValue {
            path: "$.requestRecords[0].kind".to_owned(),
            expected: "known code",
            actual: "hydrate".to_owned()
        }
    );
    assert_eq!(
        unknown_kind.code(),
        "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNSUPPORTED_FIELD_VALUE"
    );
    assert!(!unknown_kind.to_string().contains("React behavior"));
}

#[test]
fn native_root_bridge_batched_json_transport_reports_per_record_lifecycle_rows() {
    let json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":495,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":495,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":3,"kind":"unmount","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"}]}"#;

    let gate = parse_native_root_bridge_json_transport_for_gate(json).unwrap();
    let batch_gate = gate.batched_record_gate();
    let rows = batch_gate.lifecycle_rows();

    assert_eq!(
        rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
        [
            "batch-record-0-create",
            "batch-record-1-render",
            "batch-record-2-unmount"
        ]
    );
    assert_eq!(
        rows.iter().map(|row| row.batch_index()).collect::<Vec<_>>(),
        [0, 1, 2]
    );
    assert_eq!(
        rows.iter().map(|row| row.request_id()).collect::<Vec<_>>(),
        [1, 2, 3]
    );
    assert_eq!(
        rows.iter().map(|row| row.kind()).collect::<Vec<_>>(),
        ["create", "render", "unmount"]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.lifecycle_before().code())
            .collect::<Vec<_>>(),
        ["none", "active", "active"]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.lifecycle_after().code())
            .collect::<Vec<_>>(),
        ["active", "active", "retired"]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row
                .lifecycle_transition()
                .map(|transition| transition.code()))
            .collect::<Vec<_>>(),
        [
            Some("none->active"),
            Some("active->active"),
            Some("active->retired")
        ]
    );
    assert!(rows.iter().all(|row| {
        row.status() == NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted
            && row.code().is_none()
            && row.source_error_code().is_none()
            && row.boundary_error_code().is_none()
            && !row.native_addon_loaded()
            && !row.native_execution()
            && !row.renderer_execution()
            && !row.reconciler_execution()
            && !row.react_behavior_error()
    }));

    let response_gate = batch_gate.response_sequence_gate();
    let response_rows = response_gate.rows();
    assert_eq!(
        response_gate.status(),
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_GATE_STATUS
    );
    assert_eq!(
        response_gate.batch_id(),
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID
    );
    assert_eq!(response_gate.request_count(), 3);
    assert_eq!(response_gate.response_count(), 3);
    assert_eq!(response_gate.error_row_count(), 5);
    assert!(!response_gate.native_addon_loaded());
    assert!(!response_gate.native_execution());
    assert!(!response_gate.renderer_execution());
    assert!(!response_gate.reconciler_execution());
    assert!(!response_gate.react_behavior_error());
    assert_eq!(
        response_rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
        [
            "batch-response-0-create",
            "batch-response-1-render",
            "batch-response-2-unmount"
        ]
    );
    assert_eq!(
        response_rows
            .iter()
            .map(|row| row.batch_id())
            .collect::<Vec<_>>(),
        [
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID,
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID,
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID
        ]
    );
    assert_eq!(
        response_rows
            .iter()
            .map(|row| row.request_order())
            .collect::<Vec<_>>(),
        [0, 1, 2]
    );
    assert_eq!(
        response_rows
            .iter()
            .map(|row| row.response_order())
            .collect::<Vec<_>>(),
        [0, 1, 2]
    );
    assert_eq!(
        response_rows
            .iter()
            .map(|row| row.request_id())
            .collect::<Vec<_>>(),
        [1, 2, 3]
    );
    assert_eq!(
        response_rows
            .iter()
            .map(|row| row.response_status().code())
            .collect::<Vec<_>>(),
        ["accepted", "accepted", "accepted"]
    );
    assert_eq!(
        response_rows
            .iter()
            .map(|row| row.error_row_status().code())
            .collect::<Vec<_>>(),
        ["not-error-row", "not-error-row", "not-error-row"]
    );
    assert_eq!(
        response_rows
            .iter()
            .map(|row| row.teardown_state().code())
            .collect::<Vec<_>>(),
        ["root-active", "root-active", "root-retired"]
    );
    assert!(response_rows.iter().all(|row| {
        row.code().is_none()
            && row.source_error_code().is_none()
            && row.boundary_error_code().is_none()
            && !row.native_addon_loaded()
            && !row.native_execution()
            && !row.renderer_execution()
            && !row.reconciler_execution()
            && !row.react_behavior_error()
    }));
}

#[test]
fn native_root_bridge_batched_json_transport_reports_deterministic_lifecycle_error_rows() {
    let rows = native_root_bridge_batched_json_transport_error_rows();

    assert_eq!(rows.len(), 5);
    assert_eq!(
        rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
        [
            "batch-render-before-create-lifecycle-order",
            "batch-root-handle-state-mismatch",
            "batch-create-after-create-lifecycle-order",
            "batch-request-after-unmount-lifecycle-order",
            "batch-request-id-out-of-order"
        ]
    );
    assert_eq!(
        rows.iter().map(|row| row.batch_index()).collect::<Vec<_>>(),
        [0, 0, 1, 2, 1]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.lifecycle_before().code())
            .collect::<Vec<_>>(),
        ["none", "none", "active", "retired", "active"]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.lifecycle_after().code())
            .collect::<Vec<_>>(),
        ["none", "none", "active", "retired", "active"]
    );
    assert_eq!(
        rows.iter().map(|row| row.code()).collect::<Vec<_>>(),
        [
            Some("FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE"),
            Some("FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_STATE_MISMATCH"),
            Some("FAST_REACT_NAPI_ROOT_REQUEST_CREATE_AFTER_ROOT_CREATED"),
            Some("FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT"),
            Some("FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_OUT_OF_ORDER")
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.source_error_code())
            .collect::<Vec<_>>(),
        [
            Some("FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE"),
            Some("FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_STATE_MISMATCH"),
            Some("FAST_REACT_NAPI_ROOT_REQUEST_CREATE_AFTER_ROOT_CREATED"),
            Some("FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT"),
            Some("FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_OUT_OF_ORDER")
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.boundary_error_code())
            .collect::<Vec<_>>(),
        [
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"),
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"),
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"),
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"),
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER")
        ]
    );
    assert!(rows.iter().all(|row| {
        row.status() == NativeRootBridgeBatchedJsonTransportLifecycleStatus::Error
            && row.lifecycle_transition().is_none()
            && !row.native_addon_loaded()
            && !row.native_execution()
            && !row.renderer_execution()
            && !row.reconciler_execution()
            && !row.react_behavior_error()
    }));
    assert_eq!(
        NativeRootBridgeBatchedJsonTransportLifecycleState::None.code(),
        "none"
    );
    assert_eq!(
        NativeRootBridgeBatchedJsonTransportLifecycleStatus::Error.code(),
        "error"
    );
}

#[test]
fn native_root_bridge_batch_response_sequence_reports_deterministic_error_rows() {
    let json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":552,"root_handle":{"environment_id":552,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":552,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":552,"root_handle":{"environment_id":552,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":552,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":3,"kind":"unmount","environment_id":552,"root_handle":{"environment_id":552,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"}]}"#;
    let gate = parse_native_root_bridge_json_transport_for_gate(json).unwrap();
    let response_gate = gate.batched_record_gate().response_sequence_gate();
    let rows = response_gate.error_rows();

    assert_eq!(rows.len(), 5);
    assert_eq!(
        rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
        [
            "batch-render-before-create-lifecycle-order",
            "batch-root-handle-state-mismatch",
            "batch-create-after-create-lifecycle-order",
            "batch-request-after-unmount-lifecycle-order",
            "batch-request-id-out-of-order"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.request_order())
            .collect::<Vec<_>>(),
        [0, 0, 1, 2, 1]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.response_order())
            .collect::<Vec<_>>(),
        [0, 1, 2, 3, 4]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.response_status().code())
            .collect::<Vec<_>>(),
        ["error", "error", "error", "error", "error"]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.error_row_status().code())
            .collect::<Vec<_>>(),
        [
            "deterministic-error-row",
            "deterministic-error-row",
            "deterministic-error-row",
            "deterministic-error-row",
            "deterministic-error-row"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.teardown_state().code())
            .collect::<Vec<_>>(),
        [
            "root-uninitialized",
            "root-uninitialized",
            "root-active",
            "root-retired",
            "root-active"
        ]
    );
    assert_eq!(
        rows.iter().map(|row| row.code()).collect::<Vec<_>>(),
        [
            Some("FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE"),
            Some("FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_STATE_MISMATCH"),
            Some("FAST_REACT_NAPI_ROOT_REQUEST_CREATE_AFTER_ROOT_CREATED"),
            Some("FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT"),
            Some("FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_OUT_OF_ORDER")
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.boundary_error_code())
            .collect::<Vec<_>>(),
        [
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"),
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"),
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"),
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"),
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER")
        ]
    );
    assert!(rows.iter().all(|row| {
        row.batch_id() == NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID
            && row.source_error_code() == row.code()
            && !row.native_addon_loaded()
            && !row.native_execution()
            && !row.renderer_execution()
            && !row.reconciler_execution()
            && !row.react_behavior_error()
    }));
}

#[test]
fn native_root_bridge_json_transport_stream_batch_roundtrip_reports_chunk_assembly() {
    let json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":587,"root_handle":{"environment_id":587,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":587,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":587,"root_handle":{"environment_id":587,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":587,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":3,"kind":"unmount","environment_id":587,"root_handle":{"environment_id":587,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"}]}"#;
    let gate = parse_native_root_bridge_json_transport_for_gate(json).unwrap();
    let stream_gate = gate
        .batched_record_gate()
        .response_sequence_gate()
        .stream_roundtrip_gate();
    let rows = stream_gate.rows();

    assert_eq!(
        stream_gate.status(),
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_GATE_STATUS
    );
    assert_eq!(
        stream_gate.batch_id(),
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID
    );
    assert_eq!(
        stream_gate.stream_id(),
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_STREAM_ID
    );
    assert_eq!(stream_gate.request_count(), 3);
    assert_eq!(stream_gate.chunk_count(), 6);
    assert_eq!(stream_gate.assembled_response_count(), 3);
    assert_eq!(stream_gate.error_row_count(), 4);
    assert!(!stream_gate.native_addon_loaded());
    assert!(!stream_gate.native_execution());
    assert!(!stream_gate.renderer_execution());
    assert!(!stream_gate.reconciler_execution());
    assert!(stream_gate.cross_environment_handle_reuse_blocked());
    assert!(!stream_gate.public_native_compatibility());
    assert!(!stream_gate.react_behavior_error());
    assert_eq!(
        rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
        [
            "stream-batch-chunk-0-request-1-metadata",
            "stream-batch-chunk-1-request-1-payload",
            "stream-batch-chunk-2-request-2-metadata",
            "stream-batch-chunk-3-request-2-payload",
            "stream-batch-chunk-4-request-3-metadata",
            "stream-batch-chunk-5-request-3-payload"
        ]
    );
    assert_eq!(
        rows.iter().map(|row| row.request_id()).collect::<Vec<_>>(),
        [1, 1, 2, 2, 3, 3]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.request_order())
            .collect::<Vec<_>>(),
        [0, 0, 1, 1, 2, 2]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.response_order())
            .collect::<Vec<_>>(),
        [0, 0, 1, 1, 2, 2]
    );
    assert_eq!(
        rows.iter().map(|row| row.chunk_order()).collect::<Vec<_>>(),
        [0, 1, 0, 1, 0, 1]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.batch_sequence())
            .collect::<Vec<_>>(),
        [0, 1, 2, 3, 4, 5]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.chunk_kind().code())
            .collect::<Vec<_>>(),
        [
            "metadata", "payload", "metadata", "payload", "metadata", "payload"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.chunk_status().code())
            .collect::<Vec<_>>(),
        [
            "accepted", "accepted", "accepted", "accepted", "accepted", "accepted"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.response_status().code())
            .collect::<Vec<_>>(),
        [
            "accepted", "accepted", "accepted", "accepted", "accepted", "accepted"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.assembly_state().code())
            .collect::<Vec<_>>(),
        [
            "partial",
            "assembled",
            "partial",
            "assembled",
            "partial",
            "assembled"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.assembled_response())
            .collect::<Vec<_>>(),
        [false, true, false, true, false, true]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.teardown_state().code())
            .collect::<Vec<_>>(),
        [
            "root-active",
            "root-active",
            "root-active",
            "root-active",
            "root-active",
            "root-retired"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.teardown_blocker().code())
            .collect::<Vec<_>>(),
        [
            "none",
            "none",
            "none",
            "none",
            "none",
            "root-retired-after-assembly"
        ]
    );
    assert!(rows.iter().all(|row| {
        row.batch_id() == NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID
            && row.stream_id() == NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_STREAM_ID
            && row.code().is_none()
            && row.source_error_code().is_none()
            && row.boundary_error_code().is_none()
            && !row.native_addon_loaded()
            && !row.native_execution()
            && !row.renderer_execution()
            && !row.reconciler_execution()
            && row.cross_environment_handle_reuse_blocked()
            && !row.public_native_compatibility()
            && !row.react_behavior_error()
    }));
}

#[test]
fn native_root_bridge_json_transport_stream_batch_roundtrip_rejects_bad_chunks() {
    let json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":587,"root_handle":{"environment_id":587,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":587,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":587,"root_handle":{"environment_id":587,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":587,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":3,"kind":"unmount","environment_id":587,"root_handle":{"environment_id":587,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"}]}"#;
    let gate = parse_native_root_bridge_json_transport_for_gate(json).unwrap();
    let rows = gate
        .batched_record_gate()
        .response_sequence_gate()
        .stream_roundtrip_gate()
        .error_rows();

    assert_eq!(
        rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
        [
            "stream-chunk-out-of-order",
            "stream-chunk-duplicate",
            "stream-chunk-missing",
            "stream-chunk-after-teardown"
        ]
    );
    assert_eq!(
        rows.iter().map(|row| row.request_id()).collect::<Vec<_>>(),
        [1, 1, 1, 4]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.response_order())
            .collect::<Vec<_>>(),
        [0, 0, 0, 3]
    );
    assert_eq!(
        rows.iter().map(|row| row.chunk_order()).collect::<Vec<_>>(),
        [1, 0, 1, 0]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.batch_sequence())
            .collect::<Vec<_>>(),
        [0, 1, 1, 6]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.chunk_kind().code())
            .collect::<Vec<_>>(),
        ["payload", "metadata", "payload", "metadata"]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.chunk_status().code())
            .collect::<Vec<_>>(),
        ["error", "error", "error", "error"]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.assembly_state().code())
            .collect::<Vec<_>>(),
        ["rejected", "rejected", "rejected", "rejected"]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.assembled_response())
            .collect::<Vec<_>>(),
        [false, false, false, false]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.teardown_blocker().code())
            .collect::<Vec<_>>(),
        ["none", "none", "none", "post-teardown-chunk-blocked"]
    );
    assert_eq!(
        rows.iter().map(|row| row.code()).collect::<Vec<_>>(),
        [
            Some(NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_OUT_OF_ORDER_CHUNK_CODE),
            Some(NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_DUPLICATE_CHUNK_CODE),
            Some(NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_MISSING_CHUNK_CODE),
            Some(NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_POST_TEARDOWN_CHUNK_CODE)
        ]
    );
    assert!(rows.iter().all(|row| {
        row.source_error_code() == row.code()
            && row.boundary_error_code()
                == Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER")
            && !row.native_addon_loaded()
            && !row.native_execution()
            && !row.renderer_execution()
            && !row.reconciler_execution()
            && row.cross_environment_handle_reuse_blocked()
            && !row.public_native_compatibility()
            && !row.react_behavior_error()
    }));
}

#[test]
fn native_root_bridge_json_transport_parser_gate_reports_error_diagnostic_rows() {
    let rows = native_root_bridge_json_transport_error_diagnostic_rows();

    assert_eq!(rows.len(), 4);
    assert_eq!(
        rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
        [
            "malformed-payload",
            "wrong-environment-root-handle",
            "stale-value-handle-generation",
            "render-before-create-lifecycle-order"
        ]
    );
    assert_eq!(
        rows.iter().map(|row| row.category()).collect::<Vec<_>>(),
        [
            "malformed-payload",
            "wrong-environment",
            "stale-handle",
            "lifecycle-order"
        ]
    );
    assert_eq!(
        rows.iter().map(|row| row.phase()).collect::<Vec<_>>(),
        ["parse", "validation", "validation", "validation"]
    );
    assert_eq!(
        rows.iter().map(|row| row.code()).collect::<Vec<_>>(),
        [
            "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_JSON",
            "FAST_REACT_NAPI_WRONG_ENVIRONMENT",
            "FAST_REACT_NAPI_STALE_HANDLE",
            "FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE"
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.source_error_code())
            .collect::<Vec<_>>(),
        [
            None,
            Some("FAST_REACT_NAPI_WRONG_ENVIRONMENT"),
            Some("FAST_REACT_NAPI_STALE_HANDLE"),
            Some("FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE")
        ]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.boundary_error_code())
            .collect::<Vec<_>>(),
        [
            None,
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_ENVIRONMENT"),
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER")
        ]
    );
    for row in rows {
        assert!(!row.native_addon_loaded());
        assert!(!row.native_execution());
        assert!(!row.renderer_execution());
        assert!(!row.reconciler_execution());
        assert!(!row.react_behavior_error());
    }
}

#[test]
fn native_root_bridge_cross_environment_teardown_gate_reports_inert_rows() {
    fn row<'a>(
        rows: &'a [crate::handle_table::BridgeHandleTableTeardownIsolationDiagnosticRow],
        id: &str,
    ) -> &'a crate::handle_table::BridgeHandleTableTeardownIsolationDiagnosticRow {
        rows.iter()
            .find(|row| row.id() == id)
            .expect("diagnostic row exists")
    }

    let gate = native_root_bridge_cross_environment_teardown_gate();
    let diagnostics = gate.handle_table_diagnostics();
    let rows = diagnostics.rows();

    assert_eq!(
        gate.status(),
        NATIVE_ROOT_BRIDGE_CROSS_ENVIRONMENT_TEARDOWN_GATE_STATUS
    );
    assert_eq!(
        gate.handle_table_model(),
        NATIVE_ROOT_BRIDGE_HANDLE_TABLE_MODEL
    );
    assert!(!gate.native_addon_loaded());
    assert!(!gate.native_execution());
    assert!(!gate.renderer_execution());
    assert!(!gate.reconciler_execution());
    assert!(!gate.react_behavior_error());
    assert!(!diagnostics.mismatched_teardown().environment_matched());
    assert_eq!(
        diagnostics
            .mismatched_teardown()
            .total_handles_invalidated(),
        0
    );
    assert!(diagnostics.matched_teardown().environment_matched());
    assert_eq!(diagnostics.matched_teardown().root_handles_invalidated(), 1);
    assert_eq!(
        diagnostics.matched_teardown().value_handles_invalidated(),
        1
    );
    assert_eq!(rows.len(), 12);
    assert_eq!(
        rows.iter()
            .filter(|row| row.error_code() == Some("FAST_REACT_NAPI_STALE_HANDLE"))
            .count(),
        4
    );
    assert_eq!(
        rows.iter()
            .filter(|row| row.error_code() == Some("FAST_REACT_NAPI_WRONG_ENVIRONMENT"))
            .count(),
        2
    );
    assert_eq!(
        rows.iter()
            .filter(|row| !row.rejected_by_handle_table())
            .count(),
        6
    );

    let first_root = row(rows, "first-root-stale-after-own-teardown");
    let first_value = row(rows, "first-value-stale-after-own-teardown");
    assert_eq!(first_root.handle_kind(), BridgeHandleKind::Root);
    assert_eq!(first_root.current_generation(), Some(2));
    assert_eq!(first_value.handle_kind(), BridgeHandleKind::Value);
    assert_eq!(first_value.current_generation(), Some(2));
    assert_eq!(
        first_root.table_environment_id(),
        BridgeEnvironmentId::from_raw(496)
    );
    assert_eq!(
        first_value.table_environment_id(),
        BridgeEnvironmentId::from_raw(496)
    );

    let peer_root = row(rows, "peer-root-active-after-first-teardown");
    let replacement_root = row(rows, "replacement-root-active-after-slot-reuse");
    assert_eq!(peer_root.record_id(), Some(149601));
    assert_eq!(peer_root.current_generation(), Some(1));
    assert_eq!(
        peer_root.handle_environment_id(),
        BridgeEnvironmentId::from_raw(1496)
    );
    assert_eq!(replacement_root.record_id(), Some(49603));
    assert_eq!(replacement_root.current_generation(), Some(2));
    assert_eq!(
        replacement_root.handle_environment_id(),
        BridgeEnvironmentId::from_raw(496)
    );
}

#[test]
fn native_root_bridge_transport_worker_thread_teardown_reports_inert_rows() {
    fn row<'a>(
        rows: &'a [crate::root_bridge_requests::NativeRootBridgeTransportWorkerThreadTeardownRow],
        id: &str,
    ) -> &'a crate::root_bridge_requests::NativeRootBridgeTransportWorkerThreadTeardownRow {
        rows.iter()
            .find(|row| row.id() == id)
            .expect("worker-thread teardown row exists")
    }

    let gate = native_root_bridge_transport_worker_thread_teardown_gate();
    let rows = gate.rows();
    let batch_gate = gate.batched_record_gate();
    let cross_environment_gate = gate.cross_environment_teardown_gate();

    assert_eq!(
        gate.status(),
        NATIVE_ROOT_BRIDGE_TRANSPORT_WORKER_THREAD_TEARDOWN_GATE_STATUS
    );
    assert_eq!(gate.transport(), NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_FORMAT);
    assert_eq!(gate.worker_thread_id(), 524);
    assert_eq!(
        gate.worker_environment_id(),
        BridgeEnvironmentId::from_raw(524)
    );
    assert_eq!(
        gate.peer_environment_id(),
        BridgeEnvironmentId::from_raw(1524)
    );
    assert!(!gate.native_addon_loaded());
    assert!(!gate.native_execution());
    assert!(!gate.renderer_execution());
    assert!(!gate.reconciler_execution());
    assert!(!gate.react_behavior_error());

    assert_eq!(
        batch_gate.status(),
        NATIVE_ROOT_BRIDGE_BATCHED_JSON_TRANSPORT_GATE_STATUS
    );
    assert_eq!(batch_gate.request_count(), 2);
    assert_eq!(
        batch_gate
            .lifecycle_rows()
            .iter()
            .map(|row| row.id())
            .collect::<Vec<_>>(),
        ["batch-record-0-create", "batch-record-1-render"]
    );
    assert!(batch_gate.lifecycle_rows().iter().all(|row| {
        row.status() == NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted
            && !row.native_addon_loaded()
            && !row.native_execution()
            && !row.renderer_execution()
            && !row.reconciler_execution()
            && !row.react_behavior_error()
    }));

    assert!(
        !gate.mismatched_teardown().environment_matched(),
        "worker teardown must not affect the peer table"
    );
    assert_eq!(gate.mismatched_teardown().total_handles_invalidated(), 0);
    assert!(gate.matched_teardown().environment_matched());
    assert_eq!(gate.matched_teardown().root_handles_invalidated(), 1);
    assert_eq!(gate.matched_teardown().value_handles_invalidated(), 2);
    assert_eq!(
        cross_environment_gate.status(),
        NATIVE_ROOT_BRIDGE_CROSS_ENVIRONMENT_TEARDOWN_GATE_STATUS
    );
    assert_eq!(
        cross_environment_gate
            .handle_table_diagnostics()
            .rows()
            .len(),
        12
    );
    assert_eq!(
        cross_environment_gate
            .handle_table_diagnostics()
            .matched_teardown()
            .root_handles_invalidated(),
        1
    );
    assert_eq!(
        cross_environment_gate
            .handle_table_diagnostics()
            .matched_teardown()
            .value_handles_invalidated(),
        1
    );

    assert_eq!(rows.len(), 4);
    assert_eq!(
        rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
        [
            "worker-root-stale-after-thread-teardown",
            "worker-create-value-stale-after-thread-teardown",
            "worker-render-value-stale-after-thread-teardown",
            "peer-root-active-after-worker-thread-teardown"
        ]
    );
    assert_eq!(
        rows.iter().map(|row| row.transport()).collect::<Vec<_>>(),
        ["json", "json", "json", "json"]
    );
    assert_eq!(
        rows.iter()
            .map(|row| row.worker_thread_id())
            .collect::<Vec<_>>(),
        [524, 524, 524, 524]
    );

    let worker_root = row(rows, "worker-root-stale-after-thread-teardown");
    let create_value = row(rows, "worker-create-value-stale-after-thread-teardown");
    let render_value = row(rows, "worker-render-value-stale-after-thread-teardown");
    let peer_root = row(rows, "peer-root-active-after-worker-thread-teardown");

    assert_eq!(worker_root.operation(), "worker-thread-teardown");
    assert_eq!(worker_root.source_batch_index(), Some(0));
    assert_eq!(worker_root.request_id(), Some(1));
    assert_eq!(worker_root.handle_kind(), BridgeHandleKind::Root);
    assert_eq!(
        worker_root.table_environment_id(),
        BridgeEnvironmentId::from_raw(524)
    );
    assert_eq!(
        worker_root.handle_environment_id(),
        BridgeEnvironmentId::from_raw(524)
    );
    assert_eq!(worker_root.slot(), 1);
    assert_eq!(worker_root.handle_generation(), 1);
    assert_eq!(worker_root.current_generation(), Some(2));
    assert_eq!(worker_root.record_id(), None);
    assert_eq!(
        worker_root.error_code(),
        Some("FAST_REACT_NAPI_STALE_HANDLE")
    );
    assert_eq!(
        worker_root.boundary_error_code(),
        Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE")
    );

    assert_eq!(create_value.source_batch_index(), Some(0));
    assert_eq!(create_value.request_id(), Some(1));
    assert_eq!(create_value.handle_kind(), BridgeHandleKind::Value);
    assert_eq!(create_value.slot(), 2);
    assert_eq!(create_value.current_generation(), Some(2));
    assert_eq!(
        create_value.error_code(),
        Some("FAST_REACT_NAPI_STALE_HANDLE")
    );
    assert_eq!(render_value.source_batch_index(), Some(1));
    assert_eq!(render_value.request_id(), Some(2));
    assert_eq!(render_value.handle_kind(), BridgeHandleKind::Value);
    assert_eq!(render_value.slot(), 3);
    assert_eq!(render_value.current_generation(), Some(2));
    assert_eq!(
        render_value.boundary_error_code(),
        Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE")
    );

    assert_eq!(peer_root.operation(), "peer-environment-isolation");
    assert_eq!(peer_root.source_batch_index(), None);
    assert_eq!(peer_root.request_id(), None);
    assert_eq!(peer_root.handle_kind(), BridgeHandleKind::Root);
    assert_eq!(
        peer_root.table_environment_id(),
        BridgeEnvironmentId::from_raw(1524)
    );
    assert_eq!(
        peer_root.handle_environment_id(),
        BridgeEnvironmentId::from_raw(1524)
    );
    assert_eq!(peer_root.current_generation(), Some(1));
    assert_eq!(peer_root.record_id(), Some(152401));
    assert_eq!(peer_root.error_code(), None);
    assert_eq!(peer_root.boundary_error_code(), None);

    for row in rows {
        assert!(!row.native_addon_loaded());
        assert!(!row.native_execution());
        assert!(!row.renderer_execution());
        assert!(!row.reconciler_execution());
        assert!(!row.react_behavior_error());
    }
}

#[test]
fn native_root_bridge_worker_thread_teardown_executable_preflight_rejects_stale_handles() {
    fn row<'a>(
        rows: &'a [crate::root_bridge_requests::NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow],
        id: &str,
    ) -> &'a crate::root_bridge_requests::NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow
    {
        rows.iter()
            .find(|row| row.id() == id)
            .expect("worker-thread teardown preflight row exists")
    }

    let preflight = native_root_bridge_worker_thread_teardown_executable_preflight();
    let rows = preflight.rows();

    assert_eq!(
        preflight.status(),
        NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS
    );
    assert_eq!(
        preflight.model(),
        "fast-react-napi.WorkerThreadTeardownPreflight"
    );
    assert_eq!(
        preflight.execution_scope(),
        "rust-only-handle-table-preflight-no-node-worker-thread-no-napi-cleanup-hook"
    );
    assert_eq!(
        preflight.transport(),
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_FORMAT
    );
    assert_eq!(preflight.worker_thread_id(), 764);
    assert_eq!(
        preflight.worker_environment_id(),
        BridgeEnvironmentId::from_raw(764)
    );
    assert_eq!(
        preflight.peer_environment_id(),
        BridgeEnvironmentId::from_raw(1764)
    );
    assert_eq!(
        preflight.transport_worker_thread_teardown_gate_status(),
        NATIVE_ROOT_BRIDGE_TRANSPORT_WORKER_THREAD_TEARDOWN_GATE_STATUS
    );
    assert_eq!(
        preflight.batched_record_gate_status(),
        NATIVE_ROOT_BRIDGE_BATCHED_JSON_TRANSPORT_GATE_STATUS
    );
    assert_eq!(
        preflight.cross_environment_teardown_gate_status(),
        NATIVE_ROOT_BRIDGE_CROSS_ENVIRONMENT_TEARDOWN_GATE_STATUS
    );
    assert_eq!(preflight.accepted_batch_record_count(), 2);
    assert_eq!(preflight.cross_environment_teardown_row_count(), 12);
    assert!(preflight.preflight_evaluated());
    assert!(preflight.root_validator_state_preserved());
    assert!(!preflight.node_worker_threads_execution());
    assert!(!preflight.napi_cleanup_hook_execution());
    assert!(!preflight.native_addon_loaded());
    assert!(!preflight.native_execution());
    assert!(!preflight.renderer_execution());
    assert!(!preflight.reconciler_execution());
    assert!(!preflight.public_native_compatibility());
    assert!(!preflight.react_behavior_error());

    assert!(
        !preflight.mismatched_teardown().environment_matched(),
        "worker teardown must not invalidate peer handles"
    );
    assert_eq!(
        preflight.mismatched_teardown().requested_environment_id(),
        BridgeEnvironmentId::from_raw(764)
    );
    assert_eq!(
        preflight.mismatched_teardown().table_environment_id(),
        BridgeEnvironmentId::from_raw(1764)
    );
    assert_eq!(
        preflight.mismatched_teardown().total_handles_invalidated(),
        0
    );
    assert!(preflight.matched_teardown().environment_matched());
    assert_eq!(
        preflight.matched_teardown().requested_environment_id(),
        BridgeEnvironmentId::from_raw(764)
    );
    assert_eq!(
        preflight.matched_teardown().table_environment_id(),
        BridgeEnvironmentId::from_raw(764)
    );
    assert_eq!(preflight.matched_teardown().root_handles_invalidated(), 1);
    assert_eq!(preflight.matched_teardown().value_handles_invalidated(), 2);
    assert_eq!(preflight.stale_worker_handle_rejection_count(), 3);
    assert_eq!(preflight.active_peer_handle_count(), 2);

    assert_eq!(rows.len(), 5);
    assert_eq!(
        rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
        [
            "worker-render-root-stale-executable-preflight",
            "worker-create-value-stale-executable-preflight",
            "worker-render-value-stale-executable-preflight",
            "peer-root-active-executable-preflight",
            "peer-value-active-executable-preflight"
        ]
    );
    assert!(rows.iter().all(|row| row.preflight_passed()));
    assert_eq!(
        rows.iter()
            .filter(|row| row.rejected_by_boundary())
            .map(|row| row.source_error_code())
            .collect::<Vec<_>>(),
        [
            Some("FAST_REACT_NAPI_STALE_HANDLE"),
            Some("FAST_REACT_NAPI_STALE_HANDLE"),
            Some("FAST_REACT_NAPI_STALE_HANDLE")
        ]
    );
    assert_eq!(
        rows.iter()
            .filter(|row| row.rejected_by_boundary())
            .map(|row| row.boundary_error_code())
            .collect::<Vec<_>>(),
        [
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE")
        ]
    );
    assert_eq!(
        rows.iter()
            .filter(|row| row.peer_invariant_preserved())
            .map(|row| row.record_id())
            .collect::<Vec<_>>(),
        [Some(176401), Some(176402)]
    );

    let stale_root = row(rows, "worker-render-root-stale-executable-preflight");
    assert_eq!(
        stale_root.operation(),
        "post-teardown-render-boundary-validation"
    );
    assert_eq!(
        stale_root.assertion(),
        "stale-worker-root-rejected-without-mutating-validator"
    );
    assert_eq!(stale_root.worker_thread_id(), 764);
    assert_eq!(stale_root.handle_kind(), BridgeHandleKind::Root);
    assert_eq!(
        stale_root.table_environment_id(),
        BridgeEnvironmentId::from_raw(764)
    );
    assert_eq!(
        stale_root.handle_environment_id(),
        BridgeEnvironmentId::from_raw(764)
    );
    assert_eq!(stale_root.slot(), 1);
    assert_eq!(stale_root.handle_generation(), 1);
    assert_eq!(stale_root.current_generation(), Some(2));
    assert_eq!(stale_root.record_id(), None);
    assert!(stale_root.rejected_by_boundary());
    assert!(!stale_root.peer_invariant_preserved());

    let create_value = row(rows, "worker-create-value-stale-executable-preflight");
    let render_value = row(rows, "worker-render-value-stale-executable-preflight");
    assert_eq!(create_value.handle_kind(), BridgeHandleKind::Value);
    assert_eq!(create_value.slot(), 2);
    assert_eq!(create_value.current_generation(), Some(2));
    assert_eq!(render_value.handle_kind(), BridgeHandleKind::Value);
    assert_eq!(render_value.slot(), 3);
    assert_eq!(render_value.current_generation(), Some(2));

    let peer_root = row(rows, "peer-root-active-executable-preflight");
    let peer_value = row(rows, "peer-value-active-executable-preflight");
    assert_eq!(peer_root.operation(), "post-teardown-peer-root-validation");
    assert_eq!(peer_root.handle_kind(), BridgeHandleKind::Root);
    assert_eq!(
        peer_root.table_environment_id(),
        BridgeEnvironmentId::from_raw(1764)
    );
    assert_eq!(peer_root.current_generation(), Some(1));
    assert_eq!(peer_root.record_id(), Some(176401));
    assert_eq!(peer_root.source_error_code(), None);
    assert_eq!(peer_root.boundary_error_code(), None);
    assert!(!peer_root.rejected_by_boundary());
    assert!(peer_root.peer_invariant_preserved());

    assert_eq!(
        peer_value.operation(),
        "post-teardown-peer-value-validation"
    );
    assert_eq!(peer_value.handle_kind(), BridgeHandleKind::Value);
    assert_eq!(
        peer_value.table_environment_id(),
        BridgeEnvironmentId::from_raw(1764)
    );
    assert_eq!(peer_value.current_generation(), Some(1));
    assert_eq!(peer_value.record_id(), Some(176402));
    assert_eq!(peer_value.source_error_code(), None);
    assert_eq!(peer_value.boundary_error_code(), None);
    assert!(!peer_value.rejected_by_boundary());
    assert!(peer_value.peer_invariant_preserved());

    for row in rows {
        assert!(!row.node_worker_threads_execution());
        assert!(!row.napi_cleanup_hook_execution());
        assert!(!row.native_addon_loaded());
        assert!(!row.native_execution());
        assert!(!row.renderer_execution());
        assert!(!row.reconciler_execution());
        assert!(!row.public_native_compatibility());
        assert!(!row.react_behavior_error());
    }
}

#[test]
fn native_root_bridge_worker_thread_cleanup_hook_preflight_records_private_order_identity() {
    fn row<'a>(
        rows: &'a [crate::root_bridge_requests::NativeRootBridgeWorkerThreadCleanupHookPreflightRow],
        id: &str,
    ) -> &'a crate::root_bridge_requests::NativeRootBridgeWorkerThreadCleanupHookPreflightRow {
        rows.iter()
            .find(|row| row.id() == id)
            .expect("cleanup-hook preflight row exists")
    }

    let preflight = native_root_bridge_worker_thread_cleanup_hook_preflight();
    let rows = preflight.rows();

    assert_eq!(
        preflight.status(),
        NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PREFLIGHT_STATUS
    );
    assert_eq!(
        preflight.model(),
        "fast-react-napi.WorkerThreadCleanupHookOrderPreflight"
    );
    assert_eq!(
        preflight.execution_scope(),
        "rust-only-cleanup-hook-order-preflight-no-node-worker-thread-no-napi-cleanup-hook-execution"
    );
    assert_eq!(
        preflight.source_executable_preflight_status(),
        NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS
    );
    assert_eq!(preflight.worker_thread_id(), 764);
    assert_eq!(
        preflight.worker_environment_id(),
        BridgeEnvironmentId::from_raw(764)
    );
    assert_eq!(
        preflight.peer_environment_id(),
        BridgeEnvironmentId::from_raw(1764)
    );
    assert!(preflight.canonical_executable_evidence_required());
    assert!(preflight.canonical_executable_evidence_accepted());
    assert_eq!(preflight.cleanup_hook_registration_count(), 2);
    assert_eq!(
        preflight.cleanup_hook_execution_order(),
        "reverse-registration-order"
    );
    assert_eq!(preflight.accepted_cleanup_evidence_count(), 2);
    assert_eq!(preflight.rejected_cleanup_evidence_count(), 2);
    assert_eq!(
        preflight.stale_or_forged_cleanup_evidence_rejection_count(),
        2
    );
    assert!(preflight.cleanup_hook_order_private());
    assert!(preflight.cleanup_hook_identity_private());

    assert_eq!(rows.len(), 4);
    assert_eq!(
        rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
        [
            "cleanup-hook-worker-root-before-value-release",
            "cleanup-hook-worker-value-after-root-release",
            "cleanup-hook-stale-worker-transport-evidence-rejected",
            "cleanup-hook-forged-peer-active-evidence-rejected"
        ]
    );

    let root_cleanup = row(rows, "cleanup-hook-worker-root-before-value-release");
    let value_cleanup = row(rows, "cleanup-hook-worker-value-after-root-release");

    assert_eq!(
        root_cleanup.status(),
        NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Accepted
    );
    assert_eq!(
        root_cleanup.status().code(),
        NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Accepted.code()
    );
    assert_eq!(root_cleanup.operation(), "cleanup-hook-order-preflight");
    assert_eq!(
        root_cleanup.cleanup_hook_id(),
        "worker-root-handle-cleanup-hook"
    );
    assert_eq!(
        root_cleanup.cleanup_hook_function_identity_token(),
        "private-cleanup-hook-fn:worker-root-handle-teardown"
    );
    assert_eq!(
        root_cleanup.cleanup_hook_argument_identity_token(),
        "private-cleanup-hook-arg:worker-764-root-slot-1"
    );
    assert_eq!(root_cleanup.registration_order(), 2);
    assert_eq!(root_cleanup.expected_execution_order(), 1);
    assert_eq!(root_cleanup.observed_execution_order(), Some(1));
    assert_eq!(
        root_cleanup.source_preflight_status(),
        NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS
    );
    assert_eq!(root_cleanup.source_worker_thread_id(), 764);
    assert_eq!(
        root_cleanup.source_environment_id(),
        BridgeEnvironmentId::from_raw(764)
    );
    assert_eq!(
        root_cleanup.source_row_id(),
        "worker-render-root-stale-executable-preflight"
    );
    assert_eq!(
        root_cleanup.source_provenance_token(),
        Some("cleanup-hook-source-provenance:worker-764:env-764:render-root:slot-1:g1-current-2")
    );
    assert_eq!(root_cleanup.source_handle_kind(), BridgeHandleKind::Root);
    assert_eq!(
        root_cleanup.source_error_code(),
        Some("FAST_REACT_NAPI_STALE_HANDLE")
    );
    assert_eq!(
        root_cleanup.source_boundary_error_code(),
        Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE")
    );
    assert!(root_cleanup.canonical_executable_evidence());
    assert!(root_cleanup.cleanup_hook_order_private());
    assert!(root_cleanup.cleanup_hook_identity_private());
    assert!(!root_cleanup.stale_or_forged_cleanup_evidence_rejected());

    assert_eq!(
        value_cleanup.status(),
        NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Accepted
    );
    assert_eq!(
        value_cleanup.cleanup_hook_id(),
        "worker-value-handle-cleanup-hook"
    );
    assert_eq!(
        value_cleanup.cleanup_hook_function_identity_token(),
        "private-cleanup-hook-fn:worker-value-handle-teardown"
    );
    assert_eq!(
        value_cleanup.cleanup_hook_argument_identity_token(),
        "private-cleanup-hook-arg:worker-764-value-slot-3"
    );
    assert_eq!(value_cleanup.registration_order(), 1);
    assert_eq!(value_cleanup.expected_execution_order(), 2);
    assert_eq!(value_cleanup.observed_execution_order(), Some(2));
    assert_eq!(
        value_cleanup.source_row_id(),
        "worker-render-value-stale-executable-preflight"
    );
    assert_eq!(
        value_cleanup.source_provenance_token(),
        Some("cleanup-hook-source-provenance:worker-764:env-764:render-value:slot-3:g1-current-2")
    );
    assert_eq!(value_cleanup.source_handle_kind(), BridgeHandleKind::Value);
    assert!(value_cleanup.canonical_executable_evidence());
    assert!(value_cleanup.cleanup_hook_order_private());
    assert!(value_cleanup.cleanup_hook_identity_private());

    assert_eq!(
        root_cleanup.source_handle_environment_id(),
        Some(BridgeEnvironmentId::from_raw(764))
    );
    assert_eq!(root_cleanup.source_handle_slot(), Some(1));
    assert_eq!(root_cleanup.source_handle_generation(), Some(1));
    assert_eq!(root_cleanup.source_current_generation(), Some(2));
    assert_eq!(root_cleanup.source_record_id(), None);
    assert_eq!(root_cleanup.source_root_id(), Some(1));
    assert_eq!(
        value_cleanup.source_handle_environment_id(),
        Some(BridgeEnvironmentId::from_raw(764))
    );
    assert_eq!(value_cleanup.source_handle_slot(), Some(3));
    assert_eq!(value_cleanup.source_handle_generation(), Some(1));
    assert_eq!(value_cleanup.source_current_generation(), Some(2));
    assert_eq!(value_cleanup.source_record_id(), None);
    assert_eq!(value_cleanup.source_root_id(), Some(1));
}

#[test]
fn native_root_bridge_worker_thread_cleanup_hook_preflight_keeps_public_native_blockers_false() {
    let preflight = native_root_bridge_worker_thread_cleanup_hook_preflight();

    assert!(!preflight.node_worker_threads_execution());
    assert!(!preflight.napi_cleanup_hook_execution());
    assert!(!preflight.native_addon_loaded());
    assert!(!preflight.native_execution());
    assert!(!preflight.renderer_execution());
    assert!(!preflight.reconciler_execution());
    assert!(!preflight.public_native_compatibility());
    assert!(!preflight.react_behavior_error());

    for row in preflight.rows() {
        assert!(!row.node_worker_threads_execution());
        assert!(!row.napi_cleanup_hook_execution());
        assert!(!row.native_addon_loaded());
        assert!(!row.native_execution());
        assert!(!row.renderer_execution());
        assert!(!row.reconciler_execution());
        assert!(!row.public_native_compatibility());
        assert!(!row.react_behavior_error());
    }
}

#[test]
fn cleanup_hook_preflight_callable_rows_recompute_supplied_rows() {
    let preflight = native_root_bridge_worker_thread_cleanup_hook_preflight();
    let mirrored = validate_native_root_bridge_worker_thread_cleanup_hook_preflight_rows(
        preflight.rows().iter().copied(),
    );

    assert_eq!(mirrored.rows(), preflight.rows());
    assert_eq!(
        mirrored.accepted_cleanup_evidence_count(),
        preflight.accepted_cleanup_evidence_count()
    );
    assert_eq!(
        mirrored.rejected_cleanup_evidence_count(),
        preflight.rejected_cleanup_evidence_count()
    );
    assert_eq!(
        mirrored.stale_or_forged_cleanup_evidence_rejection_count(),
        preflight.stale_or_forged_cleanup_evidence_rejection_count()
    );
    assert_eq!(
        mirrored.canonical_executable_evidence_accepted(),
        preflight.canonical_executable_evidence_accepted()
    );
    assert!(!mirrored.node_worker_threads_execution());
    assert!(!mirrored.napi_cleanup_hook_execution());
    assert!(!mirrored.native_addon_loaded());
    assert!(!mirrored.native_execution());
    assert!(!mirrored.renderer_execution());
    assert!(!mirrored.reconciler_execution());
    assert!(!mirrored.public_native_compatibility());
    assert!(!mirrored.react_behavior_error());
}

#[test]
fn cleanup_hook_preflight_callable_evidence_rejects_invalid_claim_rows() {
    #[derive(Clone, Copy)]
    struct CallableCleanupHookRejectCase {
        id: &'static str,
        evidence: NativeRootBridgeWorkerThreadCleanupHookEvidence,
        expected_code: &'static str,
        stale_or_forged_rejected: bool,
    }

    let preflight = native_root_bridge_worker_thread_cleanup_hook_preflight();
    let canonical_root =
        NativeRootBridgeWorkerThreadCleanupHookEvidence::from_preflight_row(preflight.rows()[0]);
    let cases = [
        CallableCleanupHookRejectCase {
            id: "cleanup-hook-callable-stale-source-rejected",
            evidence: NativeRootBridgeWorkerThreadCleanupHookEvidence::new(
                "cleanup-hook-callable-stale-source-rejected",
                canonical_root.operation(),
                canonical_root.cleanup_hook_id(),
                canonical_root.cleanup_hook_function_identity_token(),
                canonical_root.cleanup_hook_argument_identity_token(),
                canonical_root.registration_order(),
                canonical_root.expected_execution_order(),
                NATIVE_ROOT_BRIDGE_TRANSPORT_WORKER_THREAD_TEARDOWN_GATE_STATUS,
                524,
                BridgeEnvironmentId::from_raw(524),
                "worker-root-stale-after-thread-teardown",
                BridgeHandleKind::Root,
                Some("FAST_REACT_NAPI_STALE_HANDLE"),
                Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
            ),
            expected_code: NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_STALE_EVIDENCE_CODE,
            stale_or_forged_rejected: true,
        },
        CallableCleanupHookRejectCase {
            id: "cleanup-hook-callable-forged-source-rejected",
            evidence: NativeRootBridgeWorkerThreadCleanupHookEvidence::new(
                "cleanup-hook-callable-forged-source-rejected",
                canonical_root.operation(),
                canonical_root.cleanup_hook_id(),
                canonical_root.cleanup_hook_function_identity_token(),
                canonical_root.cleanup_hook_argument_identity_token(),
                canonical_root.registration_order(),
                canonical_root.expected_execution_order(),
                canonical_root.source_preflight_status(),
                canonical_root.source_worker_thread_id(),
                canonical_root.source_environment_id(),
                "peer-root-active-executable-preflight",
                BridgeHandleKind::Root,
                None,
                None,
            ),
            expected_code: NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_FORGED_EVIDENCE_CODE,
            stale_or_forged_rejected: true,
        },
        CallableCleanupHookRejectCase {
            id: "cleanup-hook-callable-wrong-order-rejected",
            evidence: NativeRootBridgeWorkerThreadCleanupHookEvidence::new(
                "cleanup-hook-callable-wrong-order-rejected",
                canonical_root.operation(),
                canonical_root.cleanup_hook_id(),
                canonical_root.cleanup_hook_function_identity_token(),
                canonical_root.cleanup_hook_argument_identity_token(),
                1,
                2,
                canonical_root.source_preflight_status(),
                canonical_root.source_worker_thread_id(),
                canonical_root.source_environment_id(),
                canonical_root.source_row_id(),
                canonical_root.source_handle_kind(),
                canonical_root.source_error_code(),
                canonical_root.source_boundary_error_code(),
            )
            .with_source_identity_from_preflight_row_for_test(preflight.rows()[0]),
            expected_code: NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ORDER_MISMATCH_CODE,
            stale_or_forged_rejected: false,
        },
        CallableCleanupHookRejectCase {
            id: "cleanup-hook-callable-identity-tamper-rejected",
            evidence: NativeRootBridgeWorkerThreadCleanupHookEvidence::new(
                "cleanup-hook-callable-identity-tamper-rejected",
                canonical_root.operation(),
                canonical_root.cleanup_hook_id(),
                "private-cleanup-hook-fn:worker-root-handle-tampered",
                canonical_root.cleanup_hook_argument_identity_token(),
                canonical_root.registration_order(),
                canonical_root.expected_execution_order(),
                canonical_root.source_preflight_status(),
                canonical_root.source_worker_thread_id(),
                canonical_root.source_environment_id(),
                canonical_root.source_row_id(),
                canonical_root.source_handle_kind(),
                canonical_root.source_error_code(),
                canonical_root.source_boundary_error_code(),
            )
            .with_source_identity_from_preflight_row_for_test(preflight.rows()[0]),
            expected_code: NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_IDENTITY_MISMATCH_CODE,
            stale_or_forged_rejected: false,
        },
        CallableCleanupHookRejectCase {
            id: "cleanup-hook-callable-public-native-package-claim-rejected",
            evidence: NativeRootBridgeWorkerThreadCleanupHookEvidence::new(
                "cleanup-hook-callable-public-native-package-claim-rejected",
                canonical_root.operation(),
                canonical_root.cleanup_hook_id(),
                canonical_root.cleanup_hook_function_identity_token(),
                canonical_root.cleanup_hook_argument_identity_token(),
                canonical_root.registration_order(),
                canonical_root.expected_execution_order(),
                canonical_root.source_preflight_status(),
                canonical_root.source_worker_thread_id(),
                canonical_root.source_environment_id(),
                canonical_root.source_row_id(),
                canonical_root.source_handle_kind(),
                canonical_root.source_error_code(),
                canonical_root.source_boundary_error_code(),
            )
            .with_source_identity_from_preflight_row_for_test(preflight.rows()[0])
            .with_public_native_package_claim(),
            expected_code:
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PUBLIC_NATIVE_PACKAGE_CLAIM_CODE,
            stale_or_forged_rejected: false,
        },
    ];

    let callable = validate_native_root_bridge_worker_thread_cleanup_hook_evidence_rows(
        cases.iter().map(|case| case.evidence),
    );

    assert_eq!(callable.accepted_cleanup_evidence_count(), 0);
    assert_eq!(callable.rejected_cleanup_evidence_count(), cases.len());
    assert_eq!(
        callable.stale_or_forged_cleanup_evidence_rejection_count(),
        2
    );
    assert!(!callable.canonical_executable_evidence_accepted());
    assert!(!callable.node_worker_threads_execution());
    assert!(!callable.napi_cleanup_hook_execution());
    assert!(!callable.native_addon_loaded());
    assert!(!callable.native_execution());
    assert!(!callable.renderer_execution());
    assert!(!callable.reconciler_execution());
    assert!(!callable.public_native_compatibility());

    for (row, case) in callable.rows().iter().zip(cases) {
        assert_rejected_cleanup_hook_evidence(*row, case.expected_code, case.id);
        assert_eq!(
            row.stale_or_forged_cleanup_evidence_rejected(),
            case.stale_or_forged_rejected,
            "{}",
            case.id
        );
    }

    let public_claim = callable
        .rows()
        .iter()
        .find(|row| {
            row.code()
                == Some(
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PUBLIC_NATIVE_PACKAGE_CLAIM_CODE,
                )
        })
        .expect("public native package claim rejection row exists");
    let revalidated_public_claim =
        validate_native_root_bridge_worker_thread_cleanup_hook_preflight_rows([*public_claim]);
    assert_eq!(
        revalidated_public_claim.accepted_cleanup_evidence_count(),
        0
    );
    assert_eq!(
        revalidated_public_claim.rejected_cleanup_evidence_count(),
        1
    );
    assert!(!revalidated_public_claim.canonical_executable_evidence_accepted());
    assert_rejected_cleanup_hook_evidence(
        revalidated_public_claim.rows()[0],
        NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PUBLIC_NATIVE_PACKAGE_CLAIM_CODE,
        "cleanup-hook-callable-public-native-package-claim-revalidated",
    );
}

#[test]
fn cleanup_hook_preflight_callable_rejects_duplicate_or_missing_canonical_roles() {
    let preflight = native_root_bridge_worker_thread_cleanup_hook_preflight();
    let root_row = preflight.rows()[0];
    let value_row = preflight.rows()[1];

    for (id, rows, expected_rejected_count) in [
        (
            "cleanup-hook-callable-duplicate-root-rejected",
            vec![root_row, root_row],
            2,
        ),
        (
            "cleanup-hook-callable-duplicate-value-rejected",
            vec![value_row, value_row],
            2,
        ),
        (
            "cleanup-hook-callable-missing-value-rejected",
            vec![root_row],
            1,
        ),
        (
            "cleanup-hook-callable-missing-root-rejected",
            vec![value_row],
            1,
        ),
    ] {
        let callable = validate_native_root_bridge_worker_thread_cleanup_hook_preflight_rows(rows);

        assert_eq!(callable.accepted_cleanup_evidence_count(), 0, "{id}");
        assert_eq!(
            callable.rejected_cleanup_evidence_count(),
            expected_rejected_count,
            "{id}"
        );
        assert_eq!(
            callable.stale_or_forged_cleanup_evidence_rejection_count(),
            0,
            "{id}"
        );
        assert!(!callable.canonical_executable_evidence_accepted(), "{id}");
        assert!(!callable.node_worker_threads_execution(), "{id}");
        assert!(!callable.napi_cleanup_hook_execution(), "{id}");
        assert!(!callable.native_addon_loaded(), "{id}");
        assert!(!callable.native_execution(), "{id}");
        assert!(!callable.renderer_execution(), "{id}");
        assert!(!callable.reconciler_execution(), "{id}");
        assert!(!callable.public_native_compatibility(), "{id}");

        for row in callable.rows() {
            assert_rejected_cleanup_hook_evidence(
                *row,
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_CANONICAL_SET_MISMATCH_CODE,
                id,
            );
        }
    }
}

#[test]
fn native_root_bridge_worker_thread_cleanup_hook_preflight_rejects_stale_and_forged_evidence() {
    fn row<'a>(
        rows: &'a [crate::root_bridge_requests::NativeRootBridgeWorkerThreadCleanupHookPreflightRow],
        id: &str,
    ) -> &'a crate::root_bridge_requests::NativeRootBridgeWorkerThreadCleanupHookPreflightRow {
        rows.iter()
            .find(|row| row.id() == id)
            .expect("cleanup-hook rejection row exists")
    }

    let executable_preflight = native_root_bridge_worker_thread_teardown_executable_preflight();
    let cleanup_preflight = native_root_bridge_worker_thread_cleanup_hook_preflight();
    let rows = cleanup_preflight.rows();
    let root_source_row = *executable_preflight
        .rows()
        .iter()
        .find(|row| row.id() == "worker-render-root-stale-executable-preflight")
        .expect("root executable preflight source row exists");

    let stale = row(
        rows,
        "cleanup-hook-stale-worker-transport-evidence-rejected",
    );
    assert_eq!(
        stale.status(),
        NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Rejected
    );
    assert_eq!(
        stale.status().code(),
        NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Rejected.code()
    );
    assert_eq!(
        stale.code(),
        Some("FAST_REACT_NAPI_CLEANUP_HOOK_STALE_EXECUTABLE_PREFLIGHT")
    );
    assert_eq!(
        stale.source_preflight_status(),
        NATIVE_ROOT_BRIDGE_TRANSPORT_WORKER_THREAD_TEARDOWN_GATE_STATUS
    );
    assert_eq!(stale.source_worker_thread_id(), 524);
    assert_eq!(
        stale.source_environment_id(),
        BridgeEnvironmentId::from_raw(524)
    );
    assert_eq!(
        stale.source_row_id(),
        "worker-root-stale-after-thread-teardown"
    );
    assert!(!stale.canonical_executable_evidence());
    assert!(stale.stale_or_forged_cleanup_evidence_rejected());
    assert_eq!(stale.observed_execution_order(), None);

    let forged = row(rows, "cleanup-hook-forged-peer-active-evidence-rejected");
    assert_eq!(
        forged.status(),
        NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Rejected
    );
    assert_eq!(
        forged.code(),
        Some("FAST_REACT_NAPI_CLEANUP_HOOK_FORGED_EVIDENCE")
    );
    assert_eq!(
        forged.source_preflight_status(),
        NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS
    );
    assert_eq!(forged.source_worker_thread_id(), 764);
    assert_eq!(
        forged.source_environment_id(),
        BridgeEnvironmentId::from_raw(764)
    );
    assert_eq!(
        forged.source_row_id(),
        "peer-root-active-executable-preflight"
    );
    assert_eq!(forged.source_error_code(), None);
    assert_eq!(forged.source_boundary_error_code(), None);
    assert!(!forged.canonical_executable_evidence());
    assert!(forged.stale_or_forged_cleanup_evidence_rejected());

    let wrong_order = validate_native_root_bridge_worker_thread_cleanup_hook_evidence_for_preflight(
        &executable_preflight,
        NativeRootBridgeWorkerThreadCleanupHookEvidence::new(
            "cleanup-hook-wrong-order-rejected",
            "cleanup-hook-evidence-preflight-rejection",
            "worker-root-handle-cleanup-hook",
            "private-cleanup-hook-fn:worker-root-handle-teardown",
            "private-cleanup-hook-arg:worker-764-root-slot-1",
            2,
            2,
            executable_preflight.status(),
            executable_preflight.worker_thread_id(),
            executable_preflight.worker_environment_id(),
            "worker-render-root-stale-executable-preflight",
            BridgeHandleKind::Root,
            Some("FAST_REACT_NAPI_STALE_HANDLE"),
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
        )
        .with_source_identity_from_executable_preflight_row_for_test(root_source_row),
    );
    assert_eq!(
        wrong_order.status(),
        NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Rejected
    );
    assert_eq!(
        wrong_order.code(),
        Some("FAST_REACT_NAPI_CLEANUP_HOOK_ORDER_MISMATCH")
    );
    assert!(!wrong_order.canonical_executable_evidence());
    assert!(!wrong_order.stale_or_forged_cleanup_evidence_rejected());
    assert_eq!(wrong_order.observed_execution_order(), None);

    let caller_built_canonical_strings =
        validate_native_root_bridge_worker_thread_cleanup_hook_evidence_for_preflight(
            &executable_preflight,
            NativeRootBridgeWorkerThreadCleanupHookEvidence::new(
                "cleanup-hook-caller-built-canonical-strings-rejected",
                "cleanup-hook-evidence-preflight-rejection",
                "worker-root-handle-cleanup-hook",
                "private-cleanup-hook-fn:worker-root-handle-teardown",
                "private-cleanup-hook-arg:worker-764-root-slot-1",
                2,
                1,
                executable_preflight.status(),
                executable_preflight.worker_thread_id(),
                executable_preflight.worker_environment_id(),
                "worker-render-root-stale-executable-preflight",
                BridgeHandleKind::Root,
                Some("FAST_REACT_NAPI_STALE_HANDLE"),
                Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
            ),
        );
    assert_rejected_cleanup_hook_evidence(
        caller_built_canonical_strings,
        NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_FORGED_EVIDENCE_CODE,
        "cleanup-hook-caller-built-canonical-strings-rejected",
    );
    assert!(caller_built_canonical_strings.stale_or_forged_cleanup_evidence_rejected());
}

fn assert_rejected_cleanup_hook_evidence(
    row: NativeRootBridgeWorkerThreadCleanupHookPreflightRow,
    expected_code: &'static str,
    id: &'static str,
) {
    assert_eq!(
        row.status(),
        NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Rejected,
        "{id}"
    );
    assert_eq!(row.code(), Some(expected_code), "{id}");
    assert_eq!(row.observed_execution_order(), None, "{id}");
    assert!(!row.canonical_executable_evidence(), "{id}");
    assert!(row.cleanup_hook_order_private(), "{id}");
    assert!(row.cleanup_hook_identity_private(), "{id}");
    assert!(!row.node_worker_threads_execution(), "{id}");
    assert!(!row.napi_cleanup_hook_execution(), "{id}");
    assert!(!row.native_addon_loaded(), "{id}");
    assert!(!row.native_execution(), "{id}");
    assert!(!row.renderer_execution(), "{id}");
    assert!(!row.reconciler_execution(), "{id}");
    assert!(!row.public_native_compatibility(), "{id}");
    assert!(!row.react_behavior_error(), "{id}");
}

#[test]
fn native_root_bridge_worker_thread_cleanup_hook_preflight_rejects_stale_source_mismatches() {
    #[derive(Clone, Copy)]
    struct CleanupHookSourceMismatchCase {
        id: &'static str,
        source_preflight_status: &'static str,
        source_worker_thread_id: u64,
        source_environment_id: BridgeEnvironmentId,
        source_row_id: &'static str,
        source_handle_kind: BridgeHandleKind,
        source_error_code: Option<&'static str>,
        source_boundary_error_code: Option<&'static str>,
        expected_code: &'static str,
        stale_or_forged_rejected: bool,
    }

    let executable_preflight = native_root_bridge_worker_thread_teardown_executable_preflight();
    let cases = [
        CleanupHookSourceMismatchCase {
            id: "cleanup-hook-canonical-root-wrong-worker-rejected",
            source_preflight_status: executable_preflight.status(),
            source_worker_thread_id: 524,
            source_environment_id: executable_preflight.worker_environment_id(),
            source_row_id: "worker-render-root-stale-executable-preflight",
            source_handle_kind: BridgeHandleKind::Root,
            source_error_code: Some("FAST_REACT_NAPI_STALE_HANDLE"),
            source_boundary_error_code: Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
            expected_code: "FAST_REACT_NAPI_CLEANUP_HOOK_STALE_EXECUTABLE_PREFLIGHT",
            stale_or_forged_rejected: true,
        },
        CleanupHookSourceMismatchCase {
            id: "cleanup-hook-canonical-root-wrong-environment-rejected",
            source_preflight_status: executable_preflight.status(),
            source_worker_thread_id: executable_preflight.worker_thread_id(),
            source_environment_id: executable_preflight.peer_environment_id(),
            source_row_id: "worker-render-root-stale-executable-preflight",
            source_handle_kind: BridgeHandleKind::Root,
            source_error_code: Some("FAST_REACT_NAPI_STALE_HANDLE"),
            source_boundary_error_code: Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
            expected_code: "FAST_REACT_NAPI_CLEANUP_HOOK_STALE_EXECUTABLE_PREFLIGHT",
            stale_or_forged_rejected: true,
        },
        CleanupHookSourceMismatchCase {
            id: "cleanup-hook-canonical-root-as-value-rejected",
            source_preflight_status: executable_preflight.status(),
            source_worker_thread_id: executable_preflight.worker_thread_id(),
            source_environment_id: executable_preflight.worker_environment_id(),
            source_row_id: "worker-render-root-stale-executable-preflight",
            source_handle_kind: BridgeHandleKind::Value,
            source_error_code: Some("FAST_REACT_NAPI_STALE_HANDLE"),
            source_boundary_error_code: Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
            expected_code: "FAST_REACT_NAPI_CLEANUP_HOOK_FORGED_EVIDENCE",
            stale_or_forged_rejected: true,
        },
        CleanupHookSourceMismatchCase {
            id: "cleanup-hook-canonical-value-as-root-rejected",
            source_preflight_status: executable_preflight.status(),
            source_worker_thread_id: executable_preflight.worker_thread_id(),
            source_environment_id: executable_preflight.worker_environment_id(),
            source_row_id: "worker-render-value-stale-executable-preflight",
            source_handle_kind: BridgeHandleKind::Root,
            source_error_code: Some("FAST_REACT_NAPI_STALE_HANDLE"),
            source_boundary_error_code: Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
            expected_code: "FAST_REACT_NAPI_CLEANUP_HOOK_FORGED_EVIDENCE",
            stale_or_forged_rejected: true,
        },
        CleanupHookSourceMismatchCase {
            id: "cleanup-hook-canonical-value-wrong-source-code-rejected",
            source_preflight_status: executable_preflight.status(),
            source_worker_thread_id: executable_preflight.worker_thread_id(),
            source_environment_id: executable_preflight.worker_environment_id(),
            source_row_id: "worker-render-value-stale-executable-preflight",
            source_handle_kind: BridgeHandleKind::Value,
            source_error_code: Some("FAST_REACT_NAPI_WRONG_ENVIRONMENT"),
            source_boundary_error_code: Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
            expected_code: "FAST_REACT_NAPI_CLEANUP_HOOK_FORGED_EVIDENCE",
            stale_or_forged_rejected: true,
        },
        CleanupHookSourceMismatchCase {
            id: "cleanup-hook-canonical-root-wrong-boundary-code-rejected",
            source_preflight_status: executable_preflight.status(),
            source_worker_thread_id: executable_preflight.worker_thread_id(),
            source_environment_id: executable_preflight.worker_environment_id(),
            source_row_id: "worker-render-root-stale-executable-preflight",
            source_handle_kind: BridgeHandleKind::Root,
            source_error_code: Some("FAST_REACT_NAPI_STALE_HANDLE"),
            source_boundary_error_code: Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_ENVIRONMENT"),
            expected_code: "FAST_REACT_NAPI_CLEANUP_HOOK_FORGED_EVIDENCE",
            stale_or_forged_rejected: true,
        },
    ];

    for case in cases {
        let rejected =
            validate_native_root_bridge_worker_thread_cleanup_hook_evidence_for_preflight(
                &executable_preflight,
                NativeRootBridgeWorkerThreadCleanupHookEvidence::new(
                    case.id,
                    "cleanup-hook-evidence-preflight-rejection",
                    "worker-root-handle-cleanup-hook",
                    "private-cleanup-hook-fn:worker-root-handle-teardown",
                    "private-cleanup-hook-arg:worker-764-root-slot-1",
                    2,
                    1,
                    case.source_preflight_status,
                    case.source_worker_thread_id,
                    case.source_environment_id,
                    case.source_row_id,
                    case.source_handle_kind,
                    case.source_error_code,
                    case.source_boundary_error_code,
                ),
            );

        assert_rejected_cleanup_hook_evidence(rejected, case.expected_code, case.id);
        assert_eq!(
            rejected.stale_or_forged_cleanup_evidence_rejected(),
            case.stale_or_forged_rejected,
            "{}",
            case.id
        );
    }
}

#[test]
fn cleanup_hook_preflight_rejects_stale_value_and_order_identity_forgery() {
    #[derive(Clone, Copy)]
    struct CleanupHookOrderIdentityForgeryCase {
        id: &'static str,
        cleanup_hook_id: &'static str,
        cleanup_hook_function_identity_token: &'static str,
        cleanup_hook_argument_identity_token: &'static str,
        registration_order: u8,
        expected_execution_order: u8,
        source_row_id: &'static str,
        source_handle_kind: BridgeHandleKind,
    }

    let executable_preflight = native_root_bridge_worker_thread_teardown_executable_preflight();
    let cases = [
        CleanupHookOrderIdentityForgeryCase {
            id: "cleanup-hook-create-value-stale-after-teardown-rejected",
            cleanup_hook_id: "worker-value-handle-cleanup-hook",
            cleanup_hook_function_identity_token: "private-cleanup-hook-fn:worker-value-handle-teardown",
            cleanup_hook_argument_identity_token: "private-cleanup-hook-arg:worker-764-value-slot-3",
            registration_order: 1,
            expected_execution_order: 2,
            source_row_id: "worker-create-value-stale-executable-preflight",
            source_handle_kind: BridgeHandleKind::Value,
        },
        CleanupHookOrderIdentityForgeryCase {
            id: "cleanup-hook-root-source-with-value-order-identity-rejected",
            cleanup_hook_id: "worker-value-handle-cleanup-hook",
            cleanup_hook_function_identity_token: "private-cleanup-hook-fn:worker-value-handle-teardown",
            cleanup_hook_argument_identity_token: "private-cleanup-hook-arg:worker-764-value-slot-3",
            registration_order: 1,
            expected_execution_order: 2,
            source_row_id: "worker-render-root-stale-executable-preflight",
            source_handle_kind: BridgeHandleKind::Root,
        },
        CleanupHookOrderIdentityForgeryCase {
            id: "cleanup-hook-value-source-with-root-order-identity-rejected",
            cleanup_hook_id: "worker-root-handle-cleanup-hook",
            cleanup_hook_function_identity_token: "private-cleanup-hook-fn:worker-root-handle-teardown",
            cleanup_hook_argument_identity_token: "private-cleanup-hook-arg:worker-764-root-slot-1",
            registration_order: 2,
            expected_execution_order: 1,
            source_row_id: "worker-render-value-stale-executable-preflight",
            source_handle_kind: BridgeHandleKind::Value,
        },
    ];

    for case in cases {
        let source_row = *executable_preflight
            .rows()
            .iter()
            .find(|row| row.id() == case.source_row_id)
            .expect("cleanup hook executable source row exists");
        let rejected =
            validate_native_root_bridge_worker_thread_cleanup_hook_evidence_for_preflight(
                &executable_preflight,
                NativeRootBridgeWorkerThreadCleanupHookEvidence::new(
                    case.id,
                    "cleanup-hook-evidence-preflight-rejection",
                    case.cleanup_hook_id,
                    case.cleanup_hook_function_identity_token,
                    case.cleanup_hook_argument_identity_token,
                    case.registration_order,
                    case.expected_execution_order,
                    executable_preflight.status(),
                    executable_preflight.worker_thread_id(),
                    executable_preflight.worker_environment_id(),
                    case.source_row_id,
                    case.source_handle_kind,
                    Some("FAST_REACT_NAPI_STALE_HANDLE"),
                    Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
                )
                .with_source_identity_from_executable_preflight_row_for_test(source_row),
            );

        assert_rejected_cleanup_hook_evidence(
            rejected,
            "FAST_REACT_NAPI_CLEANUP_HOOK_IDENTITY_MISMATCH",
            case.id,
        );
        assert!(!rejected.stale_or_forged_cleanup_evidence_rejected());
    }
}

#[test]
fn native_root_bridge_worker_thread_cleanup_hook_preflight_rejects_identity_tampering() {
    #[derive(Clone, Copy)]
    struct CleanupHookIdentityTamperCase {
        id: &'static str,
        cleanup_hook_id: &'static str,
        cleanup_hook_function_identity_token: &'static str,
        cleanup_hook_argument_identity_token: &'static str,
        registration_order: u8,
        expected_execution_order: u8,
        source_row_id: &'static str,
        source_handle_kind: BridgeHandleKind,
    }

    let executable_preflight = native_root_bridge_worker_thread_teardown_executable_preflight();
    let cases = [
        CleanupHookIdentityTamperCase {
            id: "cleanup-hook-root-id-tamper-rejected",
            cleanup_hook_id: "arbitrary-root-cleanup-hook",
            cleanup_hook_function_identity_token: "private-cleanup-hook-fn:worker-root-handle-teardown",
            cleanup_hook_argument_identity_token: "private-cleanup-hook-arg:worker-764-root-slot-1",
            registration_order: 2,
            expected_execution_order: 1,
            source_row_id: "worker-render-root-stale-executable-preflight",
            source_handle_kind: BridgeHandleKind::Root,
        },
        CleanupHookIdentityTamperCase {
            id: "cleanup-hook-root-function-token-tamper-rejected",
            cleanup_hook_id: "worker-root-handle-cleanup-hook",
            cleanup_hook_function_identity_token: "private-cleanup-hook-fn:arbitrary-root-handle-teardown",
            cleanup_hook_argument_identity_token: "private-cleanup-hook-arg:worker-764-root-slot-1",
            registration_order: 2,
            expected_execution_order: 1,
            source_row_id: "worker-render-root-stale-executable-preflight",
            source_handle_kind: BridgeHandleKind::Root,
        },
        CleanupHookIdentityTamperCase {
            id: "cleanup-hook-root-argument-token-tamper-rejected",
            cleanup_hook_id: "worker-root-handle-cleanup-hook",
            cleanup_hook_function_identity_token: "private-cleanup-hook-fn:worker-root-handle-teardown",
            cleanup_hook_argument_identity_token: "private-cleanup-hook-arg:worker-764-root-slot-99",
            registration_order: 2,
            expected_execution_order: 1,
            source_row_id: "worker-render-root-stale-executable-preflight",
            source_handle_kind: BridgeHandleKind::Root,
        },
        CleanupHookIdentityTamperCase {
            id: "cleanup-hook-value-id-tamper-rejected",
            cleanup_hook_id: "arbitrary-value-cleanup-hook",
            cleanup_hook_function_identity_token: "private-cleanup-hook-fn:worker-value-handle-teardown",
            cleanup_hook_argument_identity_token: "private-cleanup-hook-arg:worker-764-value-slot-3",
            registration_order: 1,
            expected_execution_order: 2,
            source_row_id: "worker-render-value-stale-executable-preflight",
            source_handle_kind: BridgeHandleKind::Value,
        },
        CleanupHookIdentityTamperCase {
            id: "cleanup-hook-value-function-token-tamper-rejected",
            cleanup_hook_id: "worker-value-handle-cleanup-hook",
            cleanup_hook_function_identity_token: "private-cleanup-hook-fn:arbitrary-value-handle-teardown",
            cleanup_hook_argument_identity_token: "private-cleanup-hook-arg:worker-764-value-slot-3",
            registration_order: 1,
            expected_execution_order: 2,
            source_row_id: "worker-render-value-stale-executable-preflight",
            source_handle_kind: BridgeHandleKind::Value,
        },
        CleanupHookIdentityTamperCase {
            id: "cleanup-hook-value-argument-token-tamper-rejected",
            cleanup_hook_id: "worker-value-handle-cleanup-hook",
            cleanup_hook_function_identity_token: "private-cleanup-hook-fn:worker-value-handle-teardown",
            cleanup_hook_argument_identity_token: "private-cleanup-hook-arg:worker-764-value-slot-99",
            registration_order: 1,
            expected_execution_order: 2,
            source_row_id: "worker-render-value-stale-executable-preflight",
            source_handle_kind: BridgeHandleKind::Value,
        },
    ];

    for case in cases {
        let source_row = *executable_preflight
            .rows()
            .iter()
            .find(|row| row.id() == case.source_row_id)
            .expect("cleanup hook executable source row exists");
        let tampered =
            validate_native_root_bridge_worker_thread_cleanup_hook_evidence_for_preflight(
                &executable_preflight,
                NativeRootBridgeWorkerThreadCleanupHookEvidence::new(
                    case.id,
                    "cleanup-hook-evidence-preflight-rejection",
                    case.cleanup_hook_id,
                    case.cleanup_hook_function_identity_token,
                    case.cleanup_hook_argument_identity_token,
                    case.registration_order,
                    case.expected_execution_order,
                    executable_preflight.status(),
                    executable_preflight.worker_thread_id(),
                    executable_preflight.worker_environment_id(),
                    case.source_row_id,
                    case.source_handle_kind,
                    Some("FAST_REACT_NAPI_STALE_HANDLE"),
                    Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
                )
                .with_source_identity_from_executable_preflight_row_for_test(source_row),
            );

        assert_eq!(
            tampered.status(),
            NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Rejected,
            "{}",
            case.id
        );
        assert_eq!(
            tampered.code(),
            Some("FAST_REACT_NAPI_CLEANUP_HOOK_IDENTITY_MISMATCH"),
            "{}",
            case.id
        );
        assert_eq!(
            tampered.source_preflight_status(),
            executable_preflight.status()
        );
        assert_eq!(
            tampered.source_worker_thread_id(),
            executable_preflight.worker_thread_id()
        );
        assert_eq!(
            tampered.source_environment_id(),
            executable_preflight.worker_environment_id()
        );
        assert_eq!(tampered.source_row_id(), case.source_row_id);
        assert_eq!(tampered.source_handle_kind(), case.source_handle_kind);
        assert_eq!(tampered.registration_order(), case.registration_order);
        assert_eq!(
            tampered.expected_execution_order(),
            case.expected_execution_order
        );
        assert_eq!(tampered.observed_execution_order(), None);
        assert!(!tampered.canonical_executable_evidence());
        assert!(tampered.cleanup_hook_order_private());
        assert!(tampered.cleanup_hook_identity_private());
        assert!(!tampered.stale_or_forged_cleanup_evidence_rejected());
        assert!(!tampered.node_worker_threads_execution());
        assert!(!tampered.napi_cleanup_hook_execution());
        assert!(!tampered.native_addon_loaded());
        assert!(!tampered.native_execution());
        assert!(!tampered.renderer_execution());
        assert!(!tampered.reconciler_execution());
        assert!(!tampered.public_native_compatibility());
        assert!(!tampered.react_behavior_error());
    }
}

#[test]
fn native_root_bridge_js_request_shape_metadata_matches_handle_validation_model() {
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JS_REQUEST_SHAPE_GATE_STATUS,
        "admitted-native-root-bridge-js-request-shape"
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_HANDLE_ADMISSION_PREFLIGHT_STATUS,
        "preflighted-native-root-bridge-real-handle-admission"
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_RUST_HANDLE_TABLE_ADMISSION_SMOKE_STATUS,
        "mirrored-native-root-bridge-rust-handle-table-admission-smoke"
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_SMOKE_STATUS,
        "smoked-native-root-bridge-js-to-rust-json-transport"
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_PARSER_GATE_STATUS,
        "parsed-native-root-bridge-json-transport-schema"
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_CROSS_ENVIRONMENT_TEARDOWN_GATE_STATUS,
        "diagnosed-native-root-bridge-cross-environment-teardown-isolation"
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_BATCHED_JSON_TRANSPORT_GATE_STATUS,
        "validated-native-root-bridge-batched-json-transport-records"
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_GATE_STATUS,
        "diagnosed-native-root-bridge-json-batch-response-sequence"
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID,
        "native-root-bridge-json-batch-552"
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_GATE_STATUS,
        "diagnosed-native-root-bridge-json-stream-batch-roundtrip"
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_STREAM_ID,
        "native-root-bridge-json-stream-batch-roundtrip-587"
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_OUT_OF_ORDER_CHUNK_CODE,
        "FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_CHUNK_OUT_OF_ORDER"
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_DUPLICATE_CHUNK_CODE,
        "FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_DUPLICATE_CHUNK"
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_MISSING_CHUNK_CODE,
        "FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_MISSING_CHUNK"
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_POST_TEARDOWN_CHUNK_CODE,
        "FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_CHUNK_AFTER_TEARDOWN"
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_TRANSPORT_WORKER_THREAD_TEARDOWN_GATE_STATUS,
        "diagnosed-native-root-bridge-transport-worker-thread-teardown"
    );
    assert_eq!(NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_FORMAT, "json");
    assert_eq!(NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_SCHEMA_VERSION, 1);
    assert_eq!(
        NATIVE_ROOT_BRIDGE_REQUEST_VALIDATION_MODEL,
        "fast-react-napi.NativeRootBridgeRequestSequenceValidator"
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_HANDLE_TABLE_MODEL,
        "fast-react-napi.BridgeHandleTable"
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JS_REQUEST_RECORD_FIELDS,
        &[
            "requestId",
            "kind",
            "environmentId",
            "rootHandle",
            "rootId",
            "valueHandle",
            "rootHandleState"
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_RUST_REQUEST_RECORD_FIELDS,
        &[
            "request_id",
            "kind",
            "environment_id",
            "root_handle",
            "root_id",
            "value_handle",
            "root_handle_state"
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_RUST_VALIDATION_RECORD_FIELDS,
        &[
            "request_id",
            "kind",
            "environment_id",
            "root_handle",
            "root_id",
            "value_handle",
            "root_handle_state",
            "lifecycle_transition",
            "root_handle_validated",
            "value_handle_validated"
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JS_HANDLE_FIELDS,
        &["environmentId", "slot", "generation", "kind"]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_RUST_HANDLE_FIELDS,
        &["environment_id", "slot", "generation", "kind"]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_REQUEST_KIND_CODES,
        &[
            NativeRootBridgeRequestKind::Create.code(),
            NativeRootBridgeRequestKind::Render.code(),
            NativeRootBridgeRequestKind::Unmount.code()
        ]
    );
    assert_eq!(NATIVE_ROOT_BRIDGE_HANDLE_KIND_CODES, &["root", "value"]);
    assert_eq!(BridgeHandleKind::Root.to_string(), "root");
    assert_eq!(BridgeHandleKind::Value.to_string(), "value");
    assert_eq!(
        NATIVE_ROOT_BRIDGE_ROOT_HANDLE_STATE_CODES,
        &[
            NativeRootBridgeRootHandleState::Active.code(),
            NativeRootBridgeRootHandleState::Retired.code()
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_LIFECYCLE_TRANSITION_CODES,
        &[
            NativeRootBridgeLifecycleTransition::NoneToActive.code(),
            NativeRootBridgeLifecycleTransition::ActiveToActive.code(),
            NativeRootBridgeLifecycleTransition::ActiveToRetired.code()
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_HANDLE_ADMISSION_ACTION_CODES,
        &[
            NativeRootBridgeHandleAdmissionAction::AdmitRoot.code(),
            NativeRootBridgeHandleAdmissionAction::AdmitValue.code(),
            NativeRootBridgeHandleAdmissionAction::ValidateActiveRoot.code(),
            NativeRootBridgeHandleAdmissionAction::ValidateValue.code(),
            NativeRootBridgeHandleAdmissionAction::RetireRoot.code(),
            NativeRootBridgeHandleAdmissionAction::ValidateRetiredRoot.code()
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_RUST_HANDLE_TABLE_ADMISSION_SMOKE_RECORD_FIELDS,
        &[
            "request_id",
            "kind",
            "lifecycle_transition",
            "root_handle_state_before",
            "root_handle_state_after",
            "root_handle_action",
            "root_handle_current_generation",
            "value_handle_action",
            "value_handle_current_generation",
            "retired_root_source_error_code"
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_ENVELOPE_FIELDS,
        &["transport", "schemaVersion", "requestRecords"]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_CROSS_ENVIRONMENT_TEARDOWN_DIAGNOSTIC_FIELDS,
        &[
            "id",
            "operation",
            "handle_kind",
            "table_environment_id",
            "handle_environment_id",
            "slot",
            "handle_generation",
            "current_generation",
            "record_id",
            "error_code",
            "native_addon_loaded",
            "native_execution",
            "renderer_execution",
            "reconciler_execution",
            "react_behavior_error"
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_BATCHED_JSON_TRANSPORT_LIFECYCLE_ROW_FIELDS,
        &[
            "id",
            "batch_index",
            "request_id",
            "kind",
            "lifecycle_before",
            "lifecycle_after",
            "lifecycle_transition",
            "status",
            "code",
            "source_error_code",
            "boundary_error_code",
            "native_addon_loaded",
            "native_execution",
            "renderer_execution",
            "reconciler_execution",
            "react_behavior_error"
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_ROW_FIELDS,
        &[
            "id",
            "batch_id",
            "request_order",
            "response_order",
            "request_id",
            "kind",
            "response_status",
            "error_row_status",
            "teardown_state",
            "code",
            "source_error_code",
            "boundary_error_code",
            "native_addon_loaded",
            "native_execution",
            "renderer_execution",
            "reconciler_execution",
            "react_behavior_error"
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_ERROR_ROW_STATUSES,
        &[
            NativeRootBridgeBatchResponseErrorRowStatus::NotError.code(),
            NativeRootBridgeBatchResponseErrorRowStatus::Lifecycle.code(),
            NativeRootBridgeBatchResponseErrorRowStatus::Deterministic.code()
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_TEARDOWN_STATES,
        &[
            NativeRootBridgeBatchResponseTeardownState::Uninitialized.code(),
            NativeRootBridgeBatchResponseTeardownState::Active.code(),
            NativeRootBridgeBatchResponseTeardownState::Retired.code()
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_CHUNK_ROW_FIELDS,
        &[
            "id",
            "batch_id",
            "stream_id",
            "request_id",
            "request_order",
            "response_order",
            "chunk_order",
            "batch_sequence",
            "chunk_kind",
            "chunk_status",
            "response_status",
            "assembly_state",
            "assembled_response",
            "teardown_state",
            "teardown_blocker",
            "code",
            "source_error_code",
            "boundary_error_code",
            "native_addon_loaded",
            "native_execution",
            "renderer_execution",
            "reconciler_execution",
            "cross_environment_handle_reuse_blocked",
            "public_native_compatibility",
            "react_behavior_error"
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_ERROR_CASE_IDS,
        &[
            "stream-chunk-out-of-order",
            "stream-chunk-duplicate",
            "stream-chunk-missing",
            "stream-chunk-after-teardown"
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_CHUNK_KINDS,
        &[
            NativeRootBridgeJsonTransportStreamChunkKind::Metadata.code(),
            NativeRootBridgeJsonTransportStreamChunkKind::Payload.code()
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_CHUNK_STATUSES,
        &[
            NativeRootBridgeJsonTransportStreamChunkStatus::Accepted.code(),
            NativeRootBridgeJsonTransportStreamChunkStatus::Error.code()
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_ASSEMBLY_STATES,
        &[
            NativeRootBridgeJsonTransportStreamAssemblyState::Partial.code(),
            NativeRootBridgeJsonTransportStreamAssemblyState::Assembled.code(),
            NativeRootBridgeJsonTransportStreamAssemblyState::Rejected.code()
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_TEARDOWN_BLOCKERS,
        &[
            NativeRootBridgeJsonTransportStreamTeardownBlocker::None.code(),
            NativeRootBridgeJsonTransportStreamTeardownBlocker::RootRetiredAfterAssembly.code(),
            NativeRootBridgeJsonTransportStreamTeardownBlocker::PostTeardownChunkBlocked.code()
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_TRANSPORT_WORKER_THREAD_TEARDOWN_ROW_FIELDS,
        &[
            "id",
            "operation",
            "worker_thread_id",
            "transport",
            "source_batch_index",
            "request_id",
            "handle_kind",
            "table_environment_id",
            "handle_environment_id",
            "slot",
            "handle_generation",
            "current_generation",
            "record_id",
            "error_code",
            "boundary_error_code",
            "native_addon_loaded",
            "native_execution",
            "renderer_execution",
            "reconciler_execution",
            "react_behavior_error"
        ]
    );
    assert_eq!(
        NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_PARSE_ERROR_CODES,
        &[
            "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_JSON",
            "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_EXPECTED_OBJECT",
            "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_MISSING_FIELD",
            "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNEXPECTED_FIELD",
            "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_FIELD_TYPE",
            "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNSUPPORTED_FIELD_VALUE"
        ]
    );
    assert_eq!(
        TEST_RENDERER_NATIVE_ROOT_EXECUTION_BRIDGE_STATUS,
        "admitted-private-test-renderer-native-root-execution-bridge"
    );
    assert_eq!(
        TEST_RENDERER_NATIVE_ROOT_EXECUTION_BOUNDARY,
        "fast-react-test-renderer.TestRendererRoot"
    );
    assert_eq!(
        TEST_RENDERER_NATIVE_ROOT_EXECUTION_PUBLIC_STATUS,
        "blocked-public-react-test-renderer-create-update-unmount"
    );
    assert_eq!(
        TEST_RENDERER_NATIVE_ROOT_EXECUTION_RECORD_FIELDS,
        &[
            "request_id",
            "operation",
            "root_id",
            "lifecycle_before",
            "lifecycle_after",
            "update_outcome",
            "scheduled_update",
            "private_root_request_execution",
            "rust_root_execution_boundary_called",
            "native_addon_loaded",
            "native_execution",
            "reconciler_execution",
            "host_output_produced",
            "public_create_update_unmount_available",
            "compatibility_claimed"
        ]
    );
}

#[test]
fn test_renderer_native_root_execution_bridge_calls_create_update_unmount_boundary() {
    let mut bridge = TestRendererNativeRootExecutionBridge::new();
    let create = bridge
        .execute_create(RootElementHandle::from_raw(11), TestRendererOptions::new())
        .unwrap();
    let create_scheduled = create
        .scheduled_update()
        .expect("create schedules a TestRendererRoot update");

    assert_eq!(create.request_id(), 1);
    assert_eq!(create.operation(), TestRendererRootUpdateKind::Create);
    assert_eq!(create.lifecycle_before(), None);
    assert_eq!(create.lifecycle_after(), TestRendererRootLifecycle::Active);
    assert_eq!(create.update_outcome(), "Scheduled");
    assert_eq!(create_scheduled.kind(), TestRendererRootUpdateKind::Create);
    assert_eq!(create_scheduled.element(), RootElementHandle::from_raw(11));
    assert_eq!(create_scheduled.container_update_api(), "update_container");
    assert_eq!(
        create_scheduled.root_schedule_api(),
        "ensure_root_is_scheduled"
    );
    assert!(!create_scheduled.sync());
    assert!(create.private_root_request_execution());
    assert!(create.rust_root_execution_boundary_called());
    assert!(!create.native_addon_loaded());
    assert!(!create.native_execution());
    assert!(create.reconciler_execution());
    assert!(!create.host_output_produced());
    assert!(!create.public_create_update_unmount_available());
    assert!(!create.compatibility_claimed());

    let update = bridge
        .execute_update(RootElementHandle::from_raw(12))
        .unwrap();
    let update_scheduled = update
        .scheduled_update()
        .expect("update schedules a TestRendererRoot update");

    assert_eq!(update.request_id(), 2);
    assert_eq!(update.root_id(), create.root_id());
    assert_eq!(update.operation(), TestRendererRootUpdateKind::Update);
    assert_eq!(
        update.lifecycle_before(),
        Some(TestRendererRootLifecycle::Active)
    );
    assert_eq!(update.lifecycle_after(), TestRendererRootLifecycle::Active);
    assert_eq!(update.update_outcome(), "Scheduled");
    assert_eq!(update_scheduled.kind(), TestRendererRootUpdateKind::Update);
    assert_eq!(update_scheduled.element(), RootElementHandle::from_raw(12));
    assert_eq!(update_scheduled.container_update_api(), "update_container");
    assert!(!update_scheduled.sync());
    assert!(update.private_root_request_execution());
    assert!(update.rust_root_execution_boundary_called());
    assert!(!update.native_execution());
    assert!(update.reconciler_execution());
    assert!(!update.public_create_update_unmount_available());

    let unmount = bridge.execute_unmount().unwrap();
    let unmount_scheduled = unmount
        .scheduled_update()
        .expect("unmount schedules a sync TestRendererRoot update");

    assert_eq!(unmount.request_id(), 3);
    assert_eq!(unmount.root_id(), create.root_id());
    assert_eq!(unmount.operation(), TestRendererRootUpdateKind::Unmount);
    assert_eq!(
        unmount.lifecycle_before(),
        Some(TestRendererRootLifecycle::Active)
    );
    assert_eq!(
        unmount.lifecycle_after(),
        TestRendererRootLifecycle::UnmountScheduled
    );
    assert_eq!(unmount.update_outcome(), "Scheduled");
    assert_eq!(
        unmount_scheduled.kind(),
        TestRendererRootUpdateKind::Unmount
    );
    assert_eq!(unmount_scheduled.element(), RootElementHandle::NONE);
    assert_eq!(
        unmount_scheduled.container_update_api(),
        "update_container_sync"
    );
    assert!(unmount_scheduled.sync());
    assert!(unmount.rust_root_execution_boundary_called());
    assert!(!unmount.native_execution());
    assert!(unmount.reconciler_execution());
    assert!(!unmount.host_output_produced());
    assert!(!unmount.compatibility_claimed());
}

#[test]
fn test_renderer_native_root_execution_bridge_preserves_fail_closed_lifecycle_outcomes() {
    let mut bridge = TestRendererNativeRootExecutionBridge::new();
    let missing_root = bridge
        .execute_update(RootElementHandle::from_raw(21))
        .unwrap_err();

    assert_eq!(
        missing_root,
        TestRendererNativeRootExecutionBridgeError::MissingRoot
    );

    let create = bridge
        .execute_create(RootElementHandle::from_raw(21), TestRendererOptions::new())
        .unwrap();
    let create_again = bridge
        .execute_create(RootElementHandle::from_raw(22), TestRendererOptions::new())
        .unwrap_err();

    assert_eq!(
        create_again,
        TestRendererNativeRootExecutionBridgeError::RootAlreadyCreated
    );

    let first_unmount = bridge.execute_unmount().unwrap();
    let second_unmount = bridge.execute_unmount().unwrap();
    let late_update = bridge
        .execute_update(RootElementHandle::from_raw(23))
        .unwrap();

    assert_eq!(first_unmount.root_id(), create.root_id());
    assert_eq!(first_unmount.update_outcome(), "Scheduled");
    assert!(first_unmount.scheduled_update().is_some());
    assert_eq!(second_unmount.request_id(), 3);
    assert_eq!(
        second_unmount.lifecycle_before(),
        Some(TestRendererRootLifecycle::UnmountScheduled)
    );
    assert_eq!(
        second_unmount.lifecycle_after(),
        TestRendererRootLifecycle::UnmountScheduled
    );
    assert_eq!(second_unmount.update_outcome(), "AlreadyUnmountScheduled");
    assert!(second_unmount.rust_root_execution_boundary_called());
    assert!(!second_unmount.reconciler_execution());
    assert_eq!(second_unmount.scheduled_update(), None);
    assert_eq!(late_update.request_id(), 4);
    assert_eq!(
        late_update.lifecycle_before(),
        Some(TestRendererRootLifecycle::UnmountScheduled)
    );
    assert_eq!(
        late_update.lifecycle_after(),
        TestRendererRootLifecycle::UnmountScheduled
    );
    assert_eq!(late_update.update_outcome(), "IgnoredAfterUnmount");
    assert!(late_update.rust_root_execution_boundary_called());
    assert!(!late_update.native_execution());
    assert!(!late_update.reconciler_execution());
    assert_eq!(late_update.scheduled_update(), None);
}

#[test]
fn native_root_work_loop_minimal_placement_diagnostic_consumes_private_reconciler_bridge() {
    let diagnostic = native_root_work_loop_minimal_placement_diagnostic_for_private_bridge();

    assert_eq!(diagnostic.text_content(), "text");
    assert_eq!(
        diagnostic.placement_mutation_kind(),
        "append-placement-to-container"
    );
    assert!(diagnostic.host_mutation_gate_blockers_intact());
    assert!(diagnostic.host_mutation_execution_blocked());
    assert!(!diagnostic.production_host_mutation_apply_promoted());
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(diagnostic.public_compatibility_blocked());
    assert!(!diagnostic.public_dom_compatibility_claimed());
    assert!(!diagnostic.public_root_rendering_claimed());
    assert!(!diagnostic.public_renderer_package_behavior_exposed());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());

    let native_boundary = native_export_placeholder("native.root.render").unwrap_err();
    assert_eq!(
        native_boundary.kind(),
        NativeBoundaryErrorKind::NativeExportsNotBuilt
    );
}

#[test]
fn native_root_bridge_sequence_validator_rejects_value_handles_invalidated_after_recording() {
    let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(281));
    let element_handle = table.insert_value(PlaceholderValueRecord::new(9501));
    let mut recorder = NativeRootBridgeRequestRecorder::new();
    let mut validator = NativeRootBridgeRequestSequenceValidator::new();
    let create = recorder
        .record_create_root(&mut table, NativeRootBridgeCreateRequest::new(7501))
        .unwrap();

    validator.validate_next(&table, create).unwrap();
    let render = recorder
        .record_render(
            &table,
            NativeRootBridgeRenderRequest::new(create.root_handle())
                .with_element_handle(element_handle),
        )
        .unwrap();
    table.remove_value(element_handle).unwrap();

    let stale_value = validator.validate_next(&table, render).unwrap_err();

    assert_eq!(
        stale_value,
        NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::StaleHandle {
            handle: element_handle,
            current_generation: element_handle.generation() + 1
        })
    );
    assert_eq!(stale_value.code(), "FAST_REACT_NAPI_STALE_HANDLE");
    assert_eq!(validator.last_request_id(), Some(create.request_id()));
    assert!(!validator.root_retired());
}

#[test]
fn native_root_bridge_sequence_validator_rejects_wrong_environment_records() {
    let mut first = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(281));
    let second = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(282));
    let mut recorder = NativeRootBridgeRequestRecorder::new();
    let mut validator = NativeRootBridgeRequestSequenceValidator::new();
    let create = recorder
        .record_create_root(&mut first, NativeRootBridgeCreateRequest::new(7601))
        .unwrap();

    let wrong_environment = validator.validate_next(&second, create).unwrap_err();

    assert_eq!(
        wrong_environment,
        NativeRootBridgeRequestError::RecordEnvironmentMismatch {
            record_environment_id: first.environment_id(),
            table_environment_id: second.environment_id()
        }
    );
    assert_eq!(
        wrong_environment.code(),
        "FAST_REACT_NAPI_ROOT_REQUEST_RECORD_ENVIRONMENT_MISMATCH"
    );
    assert_eq!(validator.last_request_id(), None);
    assert_eq!(
        first.get_root(create.root_handle()).unwrap().root_id(),
        7601
    );
}

#[test]
fn native_root_bridge_sequence_validator_rejects_invalid_lifecycle_order() {
    let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(281));
    let manual_root = table.insert_root(PlaceholderRootRecord::new(7701));
    let mut recorder = NativeRootBridgeRequestRecorder::new();
    let mut validator = NativeRootBridgeRequestSequenceValidator::new();
    let render_before_create = recorder
        .record_render(&table, NativeRootBridgeRenderRequest::new(manual_root))
        .unwrap();

    let missing_create = validator
        .validate_next(&table, render_before_create)
        .unwrap_err();

    assert_eq!(
        missing_create,
        NativeRootBridgeRequestError::SequenceMustStartWithCreate {
            actual: NativeRootBridgeRequestKind::Render
        }
    );
    assert_eq!(
        missing_create.code(),
        "FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE"
    );

    let create = recorder
        .record_create_root(&mut table, NativeRootBridgeCreateRequest::new(7702))
        .unwrap();
    validator.validate_next(&table, create).unwrap();

    let out_of_order = validator
        .validate_next(&table, render_before_create)
        .unwrap_err();

    assert_eq!(
        out_of_order,
        NativeRootBridgeRequestError::RequestSequenceOutOfOrder {
            previous_request_id: create.request_id(),
            request_id: render_before_create.request_id()
        }
    );

    let foreign_root = table.insert_root(PlaceholderRootRecord::new(7703));
    let foreign_render = recorder
        .record_render(&table, NativeRootBridgeRenderRequest::new(foreign_root))
        .unwrap();
    let handle_mismatch = validator.validate_next(&table, foreign_render).unwrap_err();

    assert_eq!(
        handle_mismatch,
        NativeRootBridgeRequestError::RecordRootHandleMismatch {
            expected: create.root_handle(),
            actual: foreign_root
        }
    );
    assert_eq!(
        handle_mismatch.code(),
        "FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_MISMATCH"
    );

    let unmount = recorder
        .record_unmount(
            &mut table,
            NativeRootBridgeUnmountRequest::new(create.root_handle()),
        )
        .unwrap();
    validator.validate_next(&table, unmount).unwrap();
    let create_after_unmount = recorder
        .record_create_root(&mut table, NativeRootBridgeCreateRequest::new(7704))
        .unwrap();
    let after_unmount = validator
        .validate_next(&table, create_after_unmount)
        .unwrap_err();

    assert_eq!(
        after_unmount,
        NativeRootBridgeRequestError::RequestAfterUnmount {
            request_id: create_after_unmount.request_id()
        }
    );
    assert_eq!(
        after_unmount.code(),
        "FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT"
    );
}

#[test]
fn crate_manifest_has_no_real_native_binding_or_build_dependency() {
    let manifest = include_str!("../Cargo.toml");
    let dependency_names = dependency_names_from_manifest(manifest);
    let forbidden_dependencies = [
        "napi",
        "napi-derive",
        "napi-build",
        "neon",
        "node-sys",
        "v8",
        "rusty_v8",
        "libuv",
        "uv-sys",
    ];

    for dependency_name in dependency_names {
        assert!(
            !forbidden_dependencies.contains(&dependency_name),
            "{dependency_name} would make the placeholder depend on native Node/V8/libuv binding APIs"
        );
    }

    assert!(
        !manifest
            .lines()
            .any(|line| line.trim_start().starts_with("build =")),
        "the placeholder crate must not run a Cargo build script"
    );
    assert!(
        !Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("build.rs")
            .exists(),
        "the placeholder crate must not add build.rs while no N-API binding exists"
    );
}

fn dependency_names_from_manifest(manifest: &str) -> Vec<&str> {
    let mut names = Vec::new();
    let mut in_dependency_section = false;

    for line in manifest.lines() {
        let trimmed = line.trim();

        if trimmed.starts_with('[') {
            in_dependency_section = trimmed == "[dependencies]"
                || trimmed == "[dev-dependencies]"
                || trimmed == "[build-dependencies]"
                || trimmed.starts_with("[target.")
                    && (trimmed.ends_with(".dependencies]")
                        || trimmed.ends_with(".dev-dependencies]")
                        || trimmed.ends_with(".build-dependencies]"));

            if let Some(rest) = trimmed.strip_prefix("[dependencies.") {
                names.push(rest.trim_end_matches(']'));
            }
            if let Some(rest) = trimmed.strip_prefix("[dev-dependencies.") {
                names.push(rest.trim_end_matches(']'));
            }
            if let Some(rest) = trimmed.strip_prefix("[build-dependencies.") {
                names.push(rest.trim_end_matches(']'));
            }

            continue;
        }

        if !in_dependency_section || trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }

        if let Some((name, _value)) = trimmed.split_once('=') {
            names.push(name.trim().trim_matches('"'));
        }
    }

    names
}
