use super::*;

use std::sync::{
    Arc,
    atomic::{AtomicUsize, Ordering},
};

use fast_react_reconciler::RootTaskScheduleOutcome;

#[test]
fn root_update_reuses_same_fiber_root_and_shared_scheduler_record() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    let root_id = root.root_id();
    let current = root.store().root(root_id).unwrap().current();
    let first_queue = root
        .last_scheduled_update()
        .unwrap()
        .container_update()
        .queue();

    let outcome = root.update(root_element(2)).unwrap();
    let update = outcome.scheduled().unwrap();
    let pending_updates = root
        .store()
        .update_queues()
        .pending_updates(update.container_update().queue())
        .unwrap();

    assert_eq!(root.root_id(), root_id);
    assert_eq!(root.store().root(root_id).unwrap().current(), current);
    assert_eq!(root.scheduled_updates().len(), 2);
    assert_eq!(update.kind(), TestRendererRootUpdateKind::Update);
    assert_eq!(update.element(), root_element(2));
    assert_eq!(update.container_update().queue(), first_queue);
    assert!(!update.root_schedule().inserted());
    assert_eq!(update.root_schedule().microtask(), None);
    assert_eq!(root.scheduled_roots_for_canary().unwrap(), vec![root_id]);
    assert_eq!(pending_updates.len(), 2);
    assert_eq!(
        root.store()
            .update_queues()
            .update(update.container_update().update())
            .unwrap()
            .payload()
            .unwrap()
            .element(),
        root_element(2)
    );
    assert!(
        root.diagnostic_container_snapshot()
            .unwrap()
            .children()
            .is_empty()
    );
}

#[test]
fn root_render_phase_canary_reaches_wip_state_without_committing() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    root.update(root_element(2)).unwrap();
    let current = root.store().root(root.root_id()).unwrap().current();

    let schedule = root.process_root_schedule_microtask_for_canary().unwrap();
    let render = root
        .render_latest_scheduled_host_root_for_commit_handoff()
        .unwrap()
        .unwrap();

    assert_eq!(schedule.records().len(), 1);
    assert_eq!(
        schedule.records()[0].outcome(),
        RootTaskScheduleOutcome::Scheduled
    );
    assert_eq!(render.root(), root.root_id());
    assert_eq!(render.resulting_element(), root_element(2));
    assert_eq!(render.applied_update_count(), 2);
    assert_eq!(render.skipped_update_count(), 0);
    assert_eq!(
        render.render_lanes(),
        root.last_scheduled_update()
            .unwrap()
            .container_update()
            .lane()
            .to_lanes()
    );
    assert_eq!(
        root.store().root(root.root_id()).unwrap().current(),
        current
    );
    assert_eq!(
        root.store().root(root.root_id()).unwrap().finished_work(),
        None
    );
    assert!(
        root.diagnostic_container_snapshot()
            .unwrap()
            .children()
            .is_empty()
    );
}

#[test]
fn root_create_commit_handoff_switches_current_and_state_without_host_mutation() {
    let element = root_element(42);
    let mut root = TestRendererRoot::create(element, TestRendererOptions::new()).unwrap();
    let previous_current = root.store().root(root.root_id()).unwrap().current();
    let snapshot_before = root.diagnostic_container_snapshot().unwrap();
    let storage_before = host_storage_counts(&root);

    let (render, commit) = render_and_commit_latest_host_root(&mut root);
    let new_current = root.store().root(root.root_id()).unwrap().current();

    assert_eq!(render.root(), root.root_id());
    assert_eq!(render.current(), previous_current);
    assert_eq!(render.resulting_element(), element);
    assert_eq!(render.applied_update_count(), 1);
    assert_eq!(render.skipped_update_count(), 0);
    assert!(render.remaining_lanes().is_empty());
    assert_eq!(commit.root(), root.root_id());
    assert_eq!(commit.previous_current(), previous_current);
    assert_eq!(commit.current(), render.finished_work());
    assert_eq!(commit.finished_lanes(), render.render_lanes());
    assert!(commit.remaining_lanes().is_empty());
    assert!(commit.pending_lanes().is_empty());
    assert_empty_root_update_callback_snapshot(&commit, &render);
    assert_eq!(new_current, render.finished_work());
    assert_ne!(new_current, previous_current);
    assert_eq!(current_host_root_element(&root), element);
    assert!(
        root.store()
            .root(root.root_id())
            .unwrap()
            .lanes()
            .pending_lanes()
            .is_empty()
    );
    assert_eq!(
        root.store()
            .root(root.root_id())
            .unwrap()
            .scheduling()
            .work_in_progress(),
        None
    );
    assert_eq!(
        root.diagnostic_container_snapshot().unwrap(),
        snapshot_before
    );
    assert_eq!(host_storage_counts(&root), storage_before);
}

#[test]
fn root_update_commit_handoff_switches_current_again_and_updates_state_only() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    let (_create_render, create_commit) = render_and_commit_latest_host_root(&mut root);
    let previous_current = root.store().root(root.root_id()).unwrap().current();
    let snapshot_after_create = root.diagnostic_container_snapshot().unwrap();
    let storage_after_create = host_storage_counts(&root);

    assert_eq!(create_commit.current(), previous_current);
    assert_eq!(current_host_root_element(&root), root_element(1));

    let outcome = root.update(root_element(2)).unwrap();
    let update = outcome.scheduled().unwrap();
    let (render, commit) = render_and_commit_latest_host_root(&mut root);
    let new_current = root.store().root(root.root_id()).unwrap().current();

    assert_eq!(update.kind(), TestRendererRootUpdateKind::Update);
    assert_eq!(render.current(), previous_current);
    assert_eq!(render.resulting_element(), root_element(2));
    assert_eq!(render.applied_update_count(), 1);
    assert_eq!(render.skipped_update_count(), 0);
    assert_eq!(commit.previous_current(), previous_current);
    assert_eq!(commit.current(), render.finished_work());
    assert!(commit.pending_lanes().is_empty());
    assert_empty_root_update_callback_snapshot(&commit, &render);
    assert_eq!(new_current, render.finished_work());
    assert_ne!(new_current, previous_current);
    assert_eq!(current_host_root_element(&root), root_element(2));
    assert_eq!(
        root.diagnostic_container_snapshot().unwrap(),
        snapshot_after_create
    );
    assert_eq!(host_storage_counts(&root), storage_after_create);
}

#[test]
fn root_unmount_commit_handoff_commits_none_without_host_teardown_output() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    render_and_commit_latest_host_root(&mut root);
    let previous_current = root.store().root(root.root_id()).unwrap().current();
    let snapshot_after_create = root.diagnostic_container_snapshot().unwrap();
    let storage_after_create = host_storage_counts(&root);

    let outcome = root.unmount().unwrap();
    let unmount = outcome.scheduled().unwrap();
    let (render, commit) = render_and_commit_latest_host_root(&mut root);
    let new_current = root.store().root(root.root_id()).unwrap().current();

    assert_eq!(unmount.kind(), TestRendererRootUpdateKind::Unmount);
    assert_eq!(unmount.element(), RootElementHandle::NONE);
    assert_eq!(
        root.lifecycle(),
        TestRendererRootLifecycle::UnmountScheduled
    );
    assert_eq!(render.current(), previous_current);
    assert_eq!(render.resulting_element(), RootElementHandle::NONE);
    assert_eq!(render.applied_update_count(), 1);
    assert_eq!(render.skipped_update_count(), 0);
    assert!(render.render_lanes().includes_sync_lane());
    assert_eq!(commit.previous_current(), previous_current);
    assert_eq!(commit.current(), render.finished_work());
    assert!(commit.pending_lanes().is_empty());
    assert_empty_root_update_callback_snapshot(&commit, &render);
    assert_eq!(new_current, render.finished_work());
    assert_ne!(new_current, previous_current);
    assert_eq!(current_host_root_element(&root), RootElementHandle::NONE);
    assert_eq!(
        root.diagnostic_container_snapshot().unwrap(),
        snapshot_after_create
    );
    assert_eq!(host_storage_counts(&root), storage_after_create);
}

#[test]
fn root_create_commit_handoff_exposes_visible_callback_snapshot() {
    let callback = RootUpdateCallbackHandle::from_raw(77);
    let mut root = TestRendererRoot::create_with_root_update_callback_for_canary(
        root_element(10),
        TestRendererOptions::new(),
        callback,
    )
    .unwrap();
    let scheduled_update = root.last_scheduled_update().unwrap().clone();
    let snapshot_before = root.diagnostic_container_snapshot().unwrap();
    let storage_before = host_storage_counts(&root);

    let (render, commit) = render_and_commit_latest_host_root(&mut root);

    assert_eq!(scheduled_update.kind(), TestRendererRootUpdateKind::Create);
    assert_visible_root_update_callback_snapshot(&commit, &render, &scheduled_update, callback);
    assert_eq!(current_host_root_element(&root), root_element(10));
    assert_eq!(
        root.diagnostic_container_snapshot().unwrap(),
        snapshot_before
    );
    assert_eq!(host_storage_counts(&root), storage_before);
}

#[test]
fn root_update_commit_handoff_exposes_visible_callback_snapshot() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    render_and_commit_latest_host_root(&mut root);
    let callback = RootUpdateCallbackHandle::from_raw(88);

    let outcome = root
        .update_with_root_update_callback_for_canary(root_element(2), callback)
        .unwrap();
    let scheduled_update = outcome.scheduled().unwrap().clone();
    let snapshot_after_create = root.diagnostic_container_snapshot().unwrap();
    let storage_after_create = host_storage_counts(&root);
    let (render, commit) = render_and_commit_latest_host_root(&mut root);

    assert_eq!(scheduled_update.kind(), TestRendererRootUpdateKind::Update);
    assert_visible_root_update_callback_snapshot(&commit, &render, &scheduled_update, callback);
    assert_eq!(current_host_root_element(&root), root_element(2));
    assert_eq!(
        root.diagnostic_container_snapshot().unwrap(),
        snapshot_after_create
    );
    assert_eq!(host_storage_counts(&root), storage_after_create);
}

#[test]
fn root_unmount_commit_handoff_exposes_visible_callback_snapshot() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    render_and_commit_latest_host_root(&mut root);
    let callback = RootUpdateCallbackHandle::from_raw(99);

    let outcome = root
        .unmount_with_root_update_callback_for_canary(callback)
        .unwrap();
    let scheduled_update = outcome.scheduled().unwrap().clone();
    let snapshot_after_create = root.diagnostic_container_snapshot().unwrap();
    let storage_after_create = host_storage_counts(&root);
    let (render, commit) = render_and_commit_latest_host_root(&mut root);

    assert_eq!(scheduled_update.kind(), TestRendererRootUpdateKind::Unmount);
    assert_visible_root_update_callback_snapshot(&commit, &render, &scheduled_update, callback);
    assert_eq!(current_host_root_element(&root), RootElementHandle::NONE);
    assert_eq!(
        root.lifecycle(),
        TestRendererRootLifecycle::UnmountScheduled
    );
    assert_eq!(
        root.diagnostic_container_snapshot().unwrap(),
        snapshot_after_create
    );
    assert_eq!(host_storage_counts(&root), storage_after_create);
}

#[test]
fn root_commit_handoff_rejects_reused_render_record_after_current_switch() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    let render = root
        .render_latest_scheduled_host_root_for_commit_handoff()
        .unwrap()
        .unwrap();

    let commit = root.commit_host_root_render_for_canary(render).unwrap();
    let error = root.commit_host_root_render_for_canary(render).unwrap_err();

    assert_eq!(
        root.store().root(root.root_id()).unwrap().current(),
        commit.current()
    );
    assert!(matches!(
        error,
        TestRendererRootError::RootCommit(RootCommitError::CurrentMismatch {
            root: commit_root,
            ..
        }) if commit_root == root.root_id()
    ));
    assert!(
        root.diagnostic_container_snapshot()
            .unwrap()
            .children()
            .is_empty()
    );
}

#[test]
fn root_options_store_strict_mode_and_create_node_mock_without_invocation() {
    let invocation_count = Arc::new(AtomicUsize::new(0));
    let invocation_count_for_mock = Arc::clone(&invocation_count);
    let create_node_mock = TestCreateNodeMock::new(move || {
        invocation_count_for_mock.fetch_add(1, Ordering::SeqCst);
    });
    let options = TestRendererOptions::new()
        .with_strict_mode(true)
        .with_create_node_mock(create_node_mock);

    let mut root = TestRendererRoot::create(root_element(1), options).unwrap();
    root.update(root_element(2)).unwrap();
    root.unmount().unwrap();

    assert!(root.options().strict_mode());
    assert!(root.options().has_create_node_mock());
    assert!(root.options().create_node_mock().is_some());
    assert!(
        root.store()
            .root(root.root_id())
            .unwrap()
            .options()
            .is_strict_mode()
    );
    assert_eq!(invocation_count.load(Ordering::SeqCst), 0);
}

#[test]
fn root_options_store_error_callback_handles_without_invocation() {
    let options = TestRendererOptions::new()
        .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(501))
        .with_on_caught_error(RootErrorCallbackHandle::from_raw(502))
        .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(503));

    let mut root = TestRendererRoot::create(root_element(1), options).unwrap();
    root.update(root_element(2)).unwrap();
    root.unmount().unwrap();

    assert_eq!(
        root.options().on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(501)
    );
    assert_eq!(
        root.options().on_caught_error(),
        RootErrorCallbackHandle::from_raw(502)
    );
    assert_eq!(
        root.options().on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(503)
    );

    let root_options = root.store().root(root.root_id()).unwrap().options();
    assert_eq!(
        root_options.on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(501)
    );
    assert_eq!(
        root_options.on_caught_error(),
        RootErrorCallbackHandle::from_raw(502)
    );
    assert_eq!(
        root_options.on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(503)
    );
}

#[test]
fn root_private_error_boundary_diagnostics_record_update_and_commit_rows_from_options() {
    let options = TestRendererOptions::new()
        .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(601))
        .with_on_caught_error(RootErrorCallbackHandle::from_raw(602))
        .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(603));
    let mut root =
        TestRendererRoot::create_host_component_with_text_for_canary("span", "hello", options)
            .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    root.update_host_component_with_text_for_canary("span", "goodbye")
        .unwrap();
    let updated = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();

    let diagnostics = root
        .describe_private_error_boundary_update_diagnostics_for_canary(&updated)
        .unwrap();
    let root_error_options = diagnostics.root_error_options();
    let dependencies = diagnostics.dependency_diagnostics();

    assert_eq!(
        diagnostics.diagnostic_name(),
        TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME
    );
    assert_eq!(
        diagnostics.status(),
        TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS
    );
    assert_eq!(diagnostics.root(), root.root_id());
    assert_eq!(
        diagnostics.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert!(root_error_options.root_error_option_metadata_available());
    assert!(root_error_options.has_configured_error_callback());
    assert_eq!(
        root_error_options.on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(601)
    );
    assert_eq!(
        root_error_options.on_caught_error(),
        RootErrorCallbackHandle::from_raw(602)
    );
    assert_eq!(
        root_error_options.on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(603)
    );
    assert!(!diagnostics.public_error_boundary_behavior_available());
    assert!(!diagnostics.public_root_error_callbacks_invoked());
    assert!(!diagnostics.compatibility_claimed());
    assert!(dependencies.update_commit_rows_ready());
    assert!(dependencies.update_route_diagnostics_available());
    assert!(dependencies.serialization_diagnostics_available());
    assert!(dependencies.test_instance_query_diagnostics_available());
    assert!(dependencies.act_scheduler_metadata_available());
    assert!(!dependencies.public_renderer_roots_executed());
    assert!(!dependencies.public_lifecycle_methods_executed());
    assert!(!dependencies.error_boundary_recovery_executed());
    assert!(!dependencies.compatibility_claimed());

    let rows = diagnostics.rows();
    assert_eq!(rows.len(), 2);
    assert_eq!(
        rows[0].id(),
        "react-test-renderer-update-error-root-option-private-diagnostic"
    );
    assert_eq!(
        rows[0].phase(),
        TestRendererPrivateErrorDiagnosticPhase::Update
    );
    assert_eq!(
        rows[1].id(),
        "react-test-renderer-commit-error-root-option-private-diagnostic"
    );
    assert_eq!(
        rows[1].phase(),
        TestRendererPrivateErrorDiagnosticPhase::Commit
    );
    for row in rows {
        assert_eq!(
            row.diagnostic_name(),
            TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME
        );
        assert_eq!(
            row.status(),
            TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS
        );
        assert_eq!(
            row.host_output_update_kind(),
            TestRendererRootUpdateKind::Update
        );
        assert_eq!(row.root(), root.root_id());
        assert_eq!(row.root_error_channel(), "onUncaughtError");
        assert_eq!(row.root_error_options(), root_error_options);
        assert_eq!(row.dependency_diagnostics(), dependencies);
        assert!(row.dependency_diagnostics().update_commit_rows_ready());
        assert!(row.root_error_options().has_configured_error_callback());
        assert!(!row.root_error_update_scheduled());
        assert!(!row.public_root_error_callbacks_invoked());
        assert!(!row.public_error_boundary_behavior_available());
        assert!(!row.compatibility_claimed());
    }
}

#[test]
fn root_private_error_boundary_native_execution_evidence_consumes_update_failure_path() {
    let options = TestRendererOptions::new()
        .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(701))
        .with_on_caught_error(RootErrorCallbackHandle::from_raw(702))
        .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(703));
    let mut root =
        TestRendererRoot::create_host_component_with_text_for_canary("span", "hello", options)
            .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let (_outcome, updated, admission) = root
        .render_and_admit_private_update_native_bridge_handoff_for_canary(
            "span",
            props().with_attribute("data-error-path", "update"),
            "goodbye",
        )
        .unwrap();

    let evidence = root
        .describe_private_error_boundary_commit_recovery_for_canary(&updated, admission)
        .unwrap();
    let diagnostics = evidence.error_diagnostics();
    let commit_recovery = evidence.commit_recovery_metadata();

    assert_eq!(
        evidence.diagnostic_name(),
        TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_NATIVE_EXECUTION_DIAGNOSTIC_NAME
    );
    assert_eq!(
        evidence.status(),
        TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_NATIVE_EXECUTION_STATUS
    );
    assert_eq!(evidence.root(), root.root_id());
    assert_eq!(evidence.operation(), "update");
    assert_eq!(evidence.public_surface(), "create().update error boundary");
    assert_eq!(evidence.update_failure_path(), "update");
    assert_eq!(
        commit_recovery.diagnostic_name(),
        TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_DIAGNOSTIC_NAME
    );
    assert_eq!(
        commit_recovery.status(),
        TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_STATUS
    );
    assert_eq!(
        commit_recovery.accepted_rust_api(),
        TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_COMMIT_RECOVERY_API
    );
    assert_eq!(commit_recovery.root(), root.root_id());
    assert_eq!(commit_recovery.operation(), "update");
    assert_eq!(commit_recovery.update_failure_path(), "commit");
    assert_eq!(
        commit_recovery.commit_phase_recovery_path(),
        "ReactFiberWorkLoop.captureCommitPhaseError"
    );
    assert_eq!(
        commit_recovery.commit_phase_recovery_action(),
        "createRootErrorUpdate(SyncLane)"
    );
    assert_eq!(
        commit_recovery.react_reference(),
        "ReactFiberWorkLoop.captureCommitPhaseError -> createRootErrorUpdate(SyncLane)"
    );
    assert_eq!(
        commit_recovery.source_update_record(),
        "TestRendererUpdateNativeBridgeAdmission"
    );
    assert_eq!(
        commit_recovery.source_update_record_id(),
        TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
    );
    assert_eq!(
        commit_recovery.source_update_record_status(),
        TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS
    );
    assert_eq!(
        commit_recovery.source_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        commit_recovery.source_failure_record(),
        "HostRootRenderFailureRecoveryCommitEvidenceForCanary"
    );
    assert_eq!(
        commit_recovery.source_commit_recovery_snapshot_record(),
        "HostRootCommitRecoverySnapshotForCanary"
    );
    assert_eq!(
        commit_recovery.root_error_options(),
        diagnostics.root_error_options()
    );
    assert!(commit_recovery.consumes_accepted_rust_update_metadata());
    assert!(commit_recovery.consumes_accepted_rust_failure_metadata());
    assert!(commit_recovery.consumes_accepted_commit_recovery_snapshot());
    assert!(commit_recovery.preserves_root_error_option_handles());
    assert!(commit_recovery.commit_phase_recovery_path_consumed());
    assert!(commit_recovery.accepted_private_commit_phase_recovery_metadata());
    assert!(!commit_recovery.root_error_update_scheduled());
    assert!(!commit_recovery.public_root_error_callbacks_invoked());
    assert!(!commit_recovery.public_error_boundary_behavior_available());
    assert!(!commit_recovery.public_error_recovery_available());
    assert!(!commit_recovery.compatibility_claimed());
    assert_eq!(
        evidence.source_execution_record_id(),
        TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
    );
    assert_eq!(
        evidence.source_execution_status(),
        TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS
    );
    assert_eq!(
        evidence.source_execution_scheduled_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        evidence.host_output_update_kind(),
        TestRendererRootUpdateKind::Update
    );
    assert_eq!(
        diagnostics.diagnostic_name(),
        TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME
    );
    assert_eq!(diagnostics.root(), root.root_id());
    assert_eq!(evidence.row_count(), 2);
    assert_eq!(evidence.rows(), diagnostics.rows());
    assert!(evidence.consumes_accepted_root_execution_diagnostics());
    assert!(evidence.consumes_accepted_native_update_execution_record());
    assert!(evidence.consumes_private_error_boundary_diagnostics());
    assert!(evidence.consumes_private_commit_recovery_metadata());
    assert!(evidence.consumes_accepted_rust_failure_metadata());
    assert!(evidence.preserves_root_error_option_handles());
    assert!(evidence.consumes_update_error_row());
    assert!(evidence.consumes_commit_error_row());
    assert!(!evidence.root_error_update_scheduled());
    assert!(!evidence.public_root_error_callbacks_invoked());
    assert!(!evidence.public_error_boundary_behavior_available());
    assert!(!evidence.error_boundary_recovery_executed());
    assert!(!evidence.public_error_recovery_available());
    assert!(!evidence.public_commit_phase_recovery_available());
    assert!(!evidence.native_bridge_available());
    assert!(!evidence.native_execution_available());
    assert!(evidence.rust_execution_from_js());
    assert!(evidence.reconciler_execution_from_js());
    assert!(!evidence.compatibility_claimed());
    assert!(!diagnostics.public_error_boundary_behavior_available());
    assert!(!diagnostics.public_root_error_callbacks_invoked());
    assert!(!diagnostics.compatibility_claimed());
    assert_eq!(
        root.describe_private_error_boundary_update_native_execution_for_canary(
            &updated, admission
        )
        .unwrap()
        .commit_recovery_metadata(),
        commit_recovery
    );

    let mut stale_admission = admission;
    stale_admission.host_output_update_kind = TestRendererRootUpdateKind::Create;
    let error = root
        .describe_private_error_boundary_commit_recovery_for_canary(&updated, stale_admission)
        .unwrap_err();
    let TestRendererRootError::PrivateErrorBoundaryNativeExecution(error) = error else {
        panic!("expected private error boundary native execution rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
            reason: "host-output-update-kind"
        }
    ));

    let mut missing_update_metadata = admission;
    missing_update_metadata.text_update_apply_recorded = false;
    let error = root
        .describe_private_error_boundary_commit_recovery_for_canary(
            &updated,
            missing_update_metadata,
        )
        .unwrap_err();
    let TestRendererRootError::PrivateErrorBoundaryNativeExecution(error) = error else {
        panic!("expected private error boundary native execution update metadata rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateErrorBoundaryNativeExecutionError::RecordMismatch {
            reason: "update-execution-admission-not-accepted"
        }
    ));
}

#[test]
fn root_private_act_passive_effect_drain_consumes_metadata_without_public_act() {
    let root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    let finished_work = TestRendererFiberHandleDiagnostics::from_raw_parts_for_canary(7, 8, 9);
    let metadata = TestRendererPrivateActPendingPassiveFlushMetadata::new_for_canary(
        root.root_id(),
        finished_work,
        1,
        2,
    );

    let diagnostics = root.consume_private_act_pending_passive_flush_metadata_for_canary(metadata);

    assert_eq!(
        diagnostics.diagnostic_name(),
        TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_NAME
    );
    assert_eq!(
        diagnostics.status(),
        TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_STATUS
    );
    assert_eq!(
        diagnostics.accepted_reconciler_records(),
        &TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_ACCEPTED_RECORDS
    );
    assert_eq!(diagnostics.metadata(), metadata);
    assert!(diagnostics.metadata_root_matches_renderer_root());
    assert!(diagnostics.consumes_pending_passive_flush_metadata());
    assert!(diagnostics.consumes_accepted_scheduler_flush_metadata());
    assert!(diagnostics.private_scheduler_flush_request_metadata_consumed());
    assert!(!diagnostics.consumes_accepted_native_update_execution());
    assert_eq!(diagnostics.private_update_native_bridge_admission(), None);
    assert!(!diagnostics.host_output_produced_from_native_update());
    assert_eq!(metadata.finished_work(), finished_work);
    assert_eq!(metadata.pending_unmount_count(), 1);
    assert_eq!(metadata.pending_mount_count(), 2);
    assert_eq!(metadata.pending_record_count(), 3);
    assert_eq!(metadata.scheduler_request_order(), 0);
    assert_eq!(metadata.scheduler_priority(), "Normal");
    assert!(!diagnostics.executes_passive_effects());
    assert!(!diagnostics.invokes_effect_callbacks());
    assert!(!diagnostics.invokes_act_callback());
    assert!(!diagnostics.public_update_compatibility_claimed());
    assert!(!diagnostics.public_act_compatibility_claimed());
    assert!(!diagnostics.compatibility_claimed());
}

#[test]
fn root_private_act_passive_effect_drain_consumes_native_update_execution_metadata() {
    let initial_props = props().with_attribute("data-state", "old");
    let updated_props = props().with_attribute("data-state", "new");
    let mut root = TestRendererRoot::create_host_component_with_props_and_text_for_canary(
        "span",
        initial_props,
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();

    let (_outcome, updated, admission) = root
        .render_and_admit_private_update_native_bridge_handoff_for_canary(
            "span",
            updated_props,
            "goodbye",
        )
        .unwrap();
    let finished_work = updated.commit().current();
    let metadata = TestRendererPrivateActPendingPassiveFlushMetadata::new_for_canary(
        root.root_id(),
        TestRendererFiberHandleDiagnostics {
            arena_id: finished_work.arena_id().get(),
            slot: finished_work.slot().get(),
            generation: finished_work.generation().get(),
        },
        0,
        1,
    );

    let diagnostics = root
        .consume_private_act_update_native_execution_and_pending_passive_flush_metadata_for_canary(
            admission, metadata,
        );

    assert_eq!(
        diagnostics.diagnostic_name(),
        TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_NAME
    );
    assert_eq!(diagnostics.metadata(), metadata);
    assert!(diagnostics.metadata_root_matches_renderer_root());
    assert!(diagnostics.consumes_pending_passive_flush_metadata());
    assert!(diagnostics.consumes_accepted_scheduler_flush_metadata());
    assert!(diagnostics.private_scheduler_flush_request_metadata_consumed());
    assert!(diagnostics.consumes_accepted_native_update_execution());
    assert_eq!(
        diagnostics.private_update_native_bridge_admission(),
        Some(admission)
    );
    assert!(diagnostics.host_output_produced_from_native_update());
    assert!(!diagnostics.executes_passive_effects());
    assert!(!diagnostics.invokes_effect_callbacks());
    assert!(!diagnostics.invokes_act_callback());
    assert!(!diagnostics.public_update_compatibility_claimed());
    assert!(!diagnostics.public_act_compatibility_claimed());
    assert!(!diagnostics.compatibility_claimed());
}

#[test]
fn root_private_act_nested_scope_passive_flush_keeps_deterministic_private_order() {
    let root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    let finished_work = TestRendererFiberHandleDiagnostics::from_raw_parts_for_canary(11, 12, 13);
    let metadata = TestRendererPrivateActPendingPassiveFlushMetadata::new_for_canary(
        root.root_id(),
        finished_work,
        1,
        1,
    );

    let diagnostics = root
        .describe_private_act_nested_scope_passive_flush_for_canary(metadata)
        .unwrap();

    assert_eq!(
        diagnostics.diagnostic_name(),
        TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_DIAGNOSTIC_NAME
    );
    assert_eq!(
        diagnostics.status(),
        TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_STATUS
    );
    assert_eq!(
        diagnostics.flush_order(),
        &TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_ORDER
    );
    assert_eq!(diagnostics.outer_scope_depth(), 1);
    assert_eq!(diagnostics.inner_scope_depth(), 2);
    assert_eq!(diagnostics.passive_flush_order_index(), 2);
    assert_eq!(diagnostics.pending_unmount_count(), 1);
    assert_eq!(diagnostics.pending_mount_count(), 1);
    assert_eq!(diagnostics.pending_passive_record_count(), 2);
    assert!(diagnostics.nested_scope_metadata_accepted());
    assert!(diagnostics.private_passive_flush_metadata_accepted());
    assert!(diagnostics.drains_accepted_pending_passive_flush_metadata());
    assert!(diagnostics.deterministic_flush_order());

    let passive_drain = diagnostics.passive_drain();
    assert_eq!(passive_drain.metadata(), metadata);
    assert!(passive_drain.metadata_root_matches_renderer_root());
    assert!(passive_drain.consumes_pending_passive_flush_metadata());
    assert!(passive_drain.consumes_accepted_scheduler_flush_metadata());
    assert!(passive_drain.private_scheduler_flush_request_metadata_consumed());
    assert!(!passive_drain.executes_passive_effects());
    assert!(!passive_drain.invokes_effect_callbacks());
    assert!(!passive_drain.invokes_act_callback());
    assert!(!passive_drain.public_act_compatibility_claimed());
    assert!(!passive_drain.compatibility_claimed());

    assert!(!diagnostics.public_act_scope_depth_tracking_available());
    assert!(!diagnostics.public_nested_act_queue_reuse_available());
    assert!(!diagnostics.public_overlapping_act_warning_emission_available());
    assert!(!diagnostics.invokes_act_callback());
    assert!(!diagnostics.executes_passive_effects());
    assert!(!diagnostics.invokes_effect_callbacks());
    assert!(!diagnostics.public_act_compatibility_claimed());
    assert!(!diagnostics.compatibility_claimed());
}

#[test]
fn root_private_act_nested_scope_passive_flush_rejects_stale_or_empty_metadata() {
    let root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    let finished_work = TestRendererFiberHandleDiagnostics::from_raw_parts_for_canary(21, 22, 23);
    let stale_root = FiberRootId::new(root.root_id().raw() + 1).unwrap();
    let stale_metadata = TestRendererPrivateActPendingPassiveFlushMetadata::new_for_canary(
        stale_root,
        finished_work,
        1,
        0,
    );

    let error = root
        .describe_private_act_nested_scope_passive_flush_for_canary(stale_metadata)
        .unwrap_err();
    let TestRendererRootError::PrivateActNestedScopePassiveFlush(error) = error else {
        panic!("expected private nested act passive flush rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateActNestedScopePassiveFlushError::RootMismatch { .. }
    ));

    let empty_metadata = TestRendererPrivateActPendingPassiveFlushMetadata::new_for_canary(
        root.root_id(),
        finished_work,
        0,
        0,
    );
    let error = root
        .describe_private_act_nested_scope_passive_flush_for_canary(empty_metadata)
        .unwrap_err();
    let TestRendererRootError::PrivateActNestedScopePassiveFlush(error) = error else {
        panic!("expected private nested act passive flush rejection");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateActNestedScopePassiveFlushError::RecordMismatch {
            reason: "missing-pending-passive-work"
        }
    ));
}
