use super::helpers::*;
use super::*;

#[test]
fn root_commit_recovery_snapshot_preserves_failed_root_lane_and_callback_metadata() {
    let (mut store, root_id, host) = root_store();
    let callback = RootUpdateCallbackHandle::from_raw(450);
    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(4500),
        Some(callback),
    )
    .unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let pending_lanes = store.root(root_id).unwrap().lanes().pending_lanes();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let fixture = attach_deletion_metadata_fixture(&mut store, render.finished_work());
    let parent_node = store
        .fiber_arena_mut()
        .get_mut(fixture.first_parent)
        .unwrap();
    parent_node.set_flags(parent_node.flags() - FiberFlags::CHILD_DELETION);
    let before = host_root_commit_recovery_snapshot_for_canary(&store, render).unwrap();

    let error = commit_finished_host_root(&mut store, render).unwrap_err();
    let after = host_root_commit_recovery_snapshot_for_canary(&store, render).unwrap();

    assert!(matches!(
        error,
        RootCommitError::FiberTopology(FiberTopologyError::DeletionListMissingFlag {
            parent,
            list,
        }) if parent == fixture.first_parent && list == fixture.first_list
    ));
    assert_eq!(before.root(), root_id);
    assert_eq!(before.current(), previous_current);
    assert_eq!(before.render_lanes(), Lanes::DEFAULT);
    assert_eq!(before.pending_lanes(), pending_lanes);
    assert_eq!(
        before.callback_queue(),
        render.work_in_progress_update_queue()
    );
    assert_eq!(before.visible_callback_count(), 1);
    assert_eq!(before.hidden_callback_count(), 0);
    assert_eq!(before.deferred_hidden_callback_count(), 0);
    assert_eq!(
        callback_handles(before.root_update_callbacks().visible()),
        vec![callback]
    );
    assert!(after.preserves_lane_and_callback_metadata_from(&before));
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        pending_lanes
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_clears_consumed_render_and_callback_bookkeeping() {
    let (mut store, root_id, host) = root_store();
    let callback_node = scheduled_callback_node(&mut store, root_id);

    let render_result =
        render_host_root_via_scheduler_callback(&mut store, root_id, callback_node, Lanes::DEFAULT)
            .unwrap();
    let render = render_result.render_phase().unwrap();
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(render.work_in_progress())
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        callback_node
    );

    commit_finished_host_root(&mut store, render).unwrap();
    let scheduling = store.root(root_id).unwrap().scheduling();

    assert_eq!(scheduling.work_in_progress(), None);
    assert_eq!(scheduling.work_in_progress_root_render_lanes(), Lanes::NO);
    assert_eq!(
        scheduling.render_exit_status(),
        RootRenderExitStatus::NoWork
    );
    assert!(scheduling.callback_node().is_none());
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_error_option_callback_record_preserves_handles_without_callbacks() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let root_id = store
        .create_client_root(
            FakeContainer::new(1),
            RootOptions::new()
                .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(61))
                .with_on_caught_error(RootErrorCallbackHandle::from_raw(62))
                .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(63)),
        )
        .unwrap();
    let wrong_root = FiberRootId::new(root_id.raw() + 1).unwrap();
    update_container(&mut store, root_id, RootElementHandle::from_raw(7), None).unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    store
        .root_mut(root_id)
        .unwrap()
        .scheduling_mut()
        .prepare_pending_passive(wrong_root, Lanes::DEFAULT);

    let error = commit_finished_host_root(&mut store, render).unwrap_err();
    let record = record_root_commit_error_option_callbacks(
        &store,
        root_id,
        Some(render.finished_work()),
        render.render_lanes(),
        error,
    )
    .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(record.finished_work(), Some(render.finished_work()));
    assert_eq!(record.finished_lanes(), Lanes::DEFAULT);
    assert!(matches!(
        record.error(),
        RootCommitError::PendingPassiveRootMismatch { root, pending_root }
            if *root == root_id && *pending_root == wrong_root
    ));
    assert_eq!(
        record.on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(61)
    );
    assert_eq!(
        record.on_caught_error(),
        RootErrorCallbackHandle::from_raw(62)
    );
    assert_eq!(
        record.on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(63)
    );
    let callbacks = record.error_option_callbacks();
    assert_eq!(callbacks.root(), root_id);
    assert_eq!(callbacks.phase(), RootErrorOptionCallbackPhase::Commit);
    assert!(record.has_configured_error_callback());
    assert!(!record.root_error_callbacks_invoked());
    assert!(!record.public_error_boundaries_enabled());
    assert!(!record.recoverable_error_compatibility_claimed());
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert!(host.operations().is_empty());
}
#[test]
fn root_commit_render_failure_evidence_preserves_error_handles_without_callbacks() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let root_id = store
        .create_client_root(
            FakeContainer::new(1),
            RootOptions::new()
                .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(71))
                .with_on_caught_error(RootErrorCallbackHandle::from_raw(72))
                .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(73)),
        )
        .unwrap();
    let callbacks = store
        .root(root_id)
        .unwrap()
        .options()
        .error_option_callback_record(root_id, RootErrorOptionCallbackPhase::Render);

    let evidence = host_root_render_failure_recovery_commit_evidence_for_canary(
        root_id,
        Lanes::SYNC,
        callbacks,
    );

    assert_eq!(evidence.root(), root_id);
    assert_eq!(evidence.render_lanes(), Lanes::SYNC);
    assert_eq!(evidence.error_option_callbacks(), callbacks);
    assert_eq!(
        evidence.on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(71)
    );
    assert_eq!(
        evidence.on_caught_error(),
        RootErrorCallbackHandle::from_raw(72)
    );
    assert_eq!(
        evidence.on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(73)
    );
    assert!(evidence.has_configured_error_callback());
    assert!(evidence.accepted_render_failure_metadata());
    assert!(!evidence.commit_attempted());
    assert!(!evidence.root_current_switched());
    assert!(!evidence.retried_public_work());
    assert!(!evidence.invoked_public_callbacks());
    assert!(!evidence.root_error_callbacks_invoked());
    assert!(!evidence.public_error_boundaries_enabled());
    assert!(!evidence.recoverable_error_compatibility_claimed());
    assert!(host.operations().is_empty());
}
#[test]
fn root_commit_hands_off_visible_root_update_callback_records() {
    let (mut store, root_id, host) = root_store();
    let callback = RootUpdateCallbackHandle::from_raw(77);
    let update = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(12),
        Some(callback),
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let callbacks = commit.root_update_callbacks();

    assert_eq!(callbacks.queue(), render.work_in_progress_update_queue());
    assert_eq!(callback_handles(callbacks.visible()), vec![callback]);
    assert_eq!(
        callbacks.visible()[0].queue(),
        render.work_in_progress_update_queue()
    );
    assert_eq!(callbacks.visible()[0].update(), update.update());
    assert_eq!(callbacks.visible()[0].sequence(), 0);
    assert_eq!(
        callbacks.visible()[0].visibility(),
        RootUpdateCallbackVisibility::Visible
    );
    assert!(callbacks.hidden().is_empty());
    assert!(callbacks.deferred_hidden().is_empty());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.work_in_progress()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_records_visible_callback_invocation_gate_without_invoking_callbacks() {
    let (mut store, root_id, host) = root_store();
    let first_callback = RootUpdateCallbackHandle::from_raw(177);
    let hidden_callback = RootUpdateCallbackHandle::from_raw(178);
    let second_callback = RootUpdateCallbackHandle::from_raw(179);
    let first = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(17),
        Some(first_callback),
    )
    .unwrap();
    let hidden = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(18),
        Some(hidden_callback),
    )
    .unwrap();
    let second = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(19),
        Some(second_callback),
    )
    .unwrap();
    store
        .update_queues_mut()
        .mark_update_hidden(hidden.update())
        .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let callbacks = commit.root_update_callbacks();
    let gate = commit.root_update_callback_invocation_gate();
    let records = gate.records();
    let current_queue = store
        .fiber_arena()
        .get(commit.current())
        .unwrap()
        .update_queue();
    let after_commit = store
        .update_queues()
        .peek_root_update_callback_records(current_queue)
        .unwrap();

    assert_eq!(
        callback_handles(callbacks.visible()),
        vec![first_callback, second_callback]
    );
    assert!(callbacks.hidden().is_empty());
    assert_eq!(
        callback_handles(callbacks.deferred_hidden()),
        vec![hidden_callback]
    );
    assert_eq!(gate.len(), 2);
    assert_eq!(gate.hidden_record_count(), 0);
    assert_eq!(gate.deferred_hidden_record_count(), 1);
    assert_root_update_callback_invocation_gate_is_inert(gate);
    assert_eq!(records[0].invocation_order(), 0);
    assert_eq!(records[0].accepted_sequence(), 0);
    assert_eq!(records[0].queue(), callbacks.queue());
    assert_eq!(records[0].update(), first.update());
    assert_eq!(records[0].callback(), first_callback);
    assert_eq!(
        records[0].visibility(),
        RootUpdateCallbackVisibility::Visible
    );
    assert_eq!(records[1].invocation_order(), 1);
    assert_eq!(records[1].accepted_sequence(), 2);
    assert_eq!(records[1].queue(), callbacks.queue());
    assert_eq!(records[1].update(), second.update());
    assert_eq!(records[1].callback(), second_callback);
    assert_eq!(
        records[1].visibility(),
        RootUpdateCallbackVisibility::Visible
    );
    assert!(after_commit.visible().is_empty());
    assert!(after_commit.hidden().is_empty());
    assert_eq!(
        callback_handles(after_commit.deferred_hidden()),
        vec![hidden_callback]
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_callback_drain_diagnostics_record_visible_and_hidden_lane_order() {
    let (mut store, root_id, host) = root_store();
    let first_callback = RootUpdateCallbackHandle::from_raw(5011);
    let hidden_callback = RootUpdateCallbackHandle::from_raw(5012);
    let second_callback = RootUpdateCallbackHandle::from_raw(5013);
    let first = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(5011),
        Some(first_callback),
    )
    .unwrap();
    let hidden = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(5012),
        Some(hidden_callback),
    )
    .unwrap();
    let second = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(5013),
        Some(second_callback),
    )
    .unwrap();
    store
        .update_queues_mut()
        .mark_update_hidden(hidden.update())
        .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let diagnostics = commit
        .root_update_callback_drain_snapshot_for_canary(&store, 7, render.render_lanes())
        .unwrap();

    assert_eq!(diagnostics.root(), root_id);
    assert_eq!(diagnostics.commit_order(), 7);
    assert_eq!(diagnostics.render_lanes(), Lanes::DEFAULT);
    assert_eq!(diagnostics.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(diagnostics.pending_lanes_after_commit(), Lanes::NO);
    assert_eq!(diagnostics.len(), 3);
    assert_eq!(diagnostics.visible_callback_count(), 2);
    assert_eq!(diagnostics.hidden_callback_count(), 1);
    assert!(diagnostics.has_visible_and_hidden_callbacks());
    assert!(diagnostics.records_in_callback_sequence_order());
    assert!(diagnostics.records_match_commit_lanes());
    assert!(diagnostics.hidden_callbacks_deferred_without_invocation());
    assert!(diagnostics.proves_deterministic_lane_order());
    assert!(!diagnostics.public_callbacks_invoked());
    assert!(!diagnostics.public_root_callback_behavior_exposed());

    let records = diagnostics.records();
    assert_eq!(records[0].callback_order(), 0);
    assert_eq!(records[0].accepted_sequence(), 0);
    assert_eq!(records[0].queue(), commit.root_update_callbacks().queue());
    assert_eq!(records[0].update(), first.update());
    assert_eq!(records[0].callback(), first_callback);
    assert_eq!(
        records[0].visibility(),
        RootUpdateCallbackVisibility::Visible
    );
    assert_eq!(records[0].update_lanes(), Lanes::DEFAULT);
    assert_eq!(records[0].callback_lanes(), Lanes::DEFAULT);
    assert!(records[0].callback_lanes_match_commit());
    assert!(!records[0].public_callback_invoked());

    assert_eq!(records[1].callback_order(), 1);
    assert_eq!(records[1].accepted_sequence(), 1);
    assert_eq!(records[1].update(), hidden.update());
    assert_eq!(records[1].callback(), hidden_callback);
    assert_eq!(
        records[1].visibility(),
        RootUpdateCallbackVisibility::DeferredHidden
    );
    assert_eq!(
        records[1].update_lanes(),
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
    );
    assert_eq!(records[1].callback_lanes(), Lanes::DEFAULT);
    assert!(records[1].update_lanes_include_offscreen());
    assert!(records[1].is_hidden_callback());
    assert!(records[1].is_deferred_hidden_callback());
    assert!(records[1].callback_lanes_match_commit());
    assert!(!records[1].public_callback_invoked());

    assert_eq!(records[2].callback_order(), 2);
    assert_eq!(records[2].accepted_sequence(), 2);
    assert_eq!(records[2].update(), second.update());
    assert_eq!(records[2].callback(), second_callback);
    assert_eq!(
        records[2].visibility(),
        RootUpdateCallbackVisibility::Visible
    );
    assert_eq!(records[2].update_lanes(), Lanes::DEFAULT);
    assert_eq!(records[2].callback_lanes(), Lanes::DEFAULT);
    assert!(records[2].callback_lanes_match_commit());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_invocation_execution_gate_drains_visible_callbacks_once_under_test_control() {
    let (mut store, root_id, host) = root_store();
    let first_callback = RootUpdateCallbackHandle::from_raw(277);
    let second_callback = RootUpdateCallbackHandle::from_raw(279);
    let first = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(27),
        Some(first_callback),
    )
    .unwrap();
    let second = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(29),
        Some(second_callback),
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut control = TestRootUpdateCallbackControl::default();

    let execution = commit.drain_root_update_callbacks_under_test_control(&mut control);

    assert_eq!(execution.source_visible_record_count(), 2);
    assert_eq!(execution.hidden_record_count(), 0);
    assert_eq!(execution.deferred_hidden_record_count(), 0);
    assert_eq!(execution.len(), 2);
    assert_eq!(execution.completed_count(), 2);
    assert_eq!(execution.error_count(), 0);
    assert!(!execution.has_errors());
    assert_eq!(execution.errors(), Vec::new());
    assert_eq!(
        execution.status(),
        RootUpdateCallbackInvocationExecutionGateStatus::TestControlOnly
    );
    assert_eq!(
        execution.blockers(),
        &ROOT_UPDATE_CALLBACK_INVOCATION_EXECUTION_GATE_BLOCKERS
    );
    assert!(execution.did_drain_accepted_visible_callbacks());
    assert!(execution.test_control_invoked_callback_handles());
    assert!(!execution.public_js_callbacks_invoked());
    assert!(!execution.public_root_callback_behavior_exposed());
    assert!(!execution.hidden_callbacks_invoked());
    assert!(!execution.root_error_callbacks_invoked());

    let records = execution.records();
    assert_eq!(records[0].invocation_order(), 0);
    assert_eq!(records[0].accepted_sequence(), 0);
    assert_eq!(records[0].update(), first.update());
    assert_eq!(records[0].callback(), first_callback);
    assert_eq!(
        records[0].status(),
        RootUpdateCallbackInvocationStatus::Completed
    );
    assert_eq!(records[1].invocation_order(), 1);
    assert_eq!(records[1].accepted_sequence(), 1);
    assert_eq!(records[1].update(), second.update());
    assert_eq!(records[1].callback(), second_callback);
    assert_eq!(
        records[1].status(),
        RootUpdateCallbackInvocationStatus::Completed
    );
    assert_eq!(control.calls().len(), 2);
    assert_eq!(control.calls()[0].callback(), first_callback);
    assert_eq!(control.calls()[1].callback(), second_callback);
    assert!(commit.root_update_callback_invocation_gate().is_empty());

    let repeated = commit.drain_root_update_callbacks_under_test_control(&mut control);

    assert_eq!(repeated.source_visible_record_count(), 0);
    assert!(repeated.is_empty());
    assert!(!repeated.did_drain_accepted_visible_callbacks());
    assert_eq!(control.calls().len(), 2);
    assert_eq!(
        store.scheduler_bridge().callback_requests().len(),
        callback_request_count
    );
    assert_eq!(
        store.scheduler_bridge().act_queue_requests().len(),
        act_queue_request_count
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_invocation_execution_gate_records_test_control_errors_without_public_callbacks() {
    let (mut store, root_id, host) = root_store();
    let first_callback = RootUpdateCallbackHandle::from_raw(377);
    let second_callback = RootUpdateCallbackHandle::from_raw(379);
    let first = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(37),
        Some(first_callback),
    )
    .unwrap();
    let second = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(39),
        Some(second_callback),
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mut commit = commit_finished_host_root(&mut store, render).unwrap();
    let second_error = root_callback_error(990);
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let mut control =
        TestRootUpdateCallbackControl::default().with_result(second_callback, Err(second_error));

    let execution = commit.drain_root_update_callbacks_under_test_control(&mut control);

    assert_eq!(execution.len(), 2);
    assert_eq!(execution.completed_count(), 1);
    assert_eq!(execution.error_count(), 1);
    assert!(execution.has_errors());
    assert_eq!(execution.errors(), vec![second_error]);
    assert!(!execution.public_js_callbacks_invoked());
    assert!(!execution.public_root_callback_behavior_exposed());
    assert!(!execution.root_error_callbacks_invoked());
    let records = execution.records();
    assert_eq!(records[0].update(), first.update());
    assert_eq!(records[0].callback(), first_callback);
    assert!(records[0].completed());
    assert_eq!(records[0].error(), None);
    assert_eq!(records[1].update(), second.update());
    assert_eq!(records[1].callback(), second_callback);
    assert!(records[1].errored());
    assert_eq!(records[1].error(), Some(second_error));
    assert_eq!(control.calls().len(), 2);
    assert!(commit.root_update_callback_invocation_gate().is_empty());
    assert_eq!(
        store.scheduler_bridge().callback_requests().len(),
        callback_request_count
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_drains_visible_callback_records_only_once() {
    let (mut store, root_id, _host) = root_store();
    let callback = RootUpdateCallbackHandle::from_raw(88);
    update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(13),
        Some(callback),
    )
    .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let current_queue = store
        .fiber_arena()
        .get(commit.current())
        .unwrap()
        .update_queue();
    let second_take = store
        .update_queues_mut()
        .take_root_update_callback_records(current_queue)
        .unwrap();
    let stale_commit_error = commit_finished_host_root(&mut store, render).unwrap_err();
    let after_stale_commit = store
        .update_queues_mut()
        .take_root_update_callback_records(current_queue)
        .unwrap();

    assert_eq!(
        callback_handles(commit.root_update_callbacks().visible()),
        vec![callback]
    );
    assert!(second_take.is_empty());
    assert!(matches!(
        stale_commit_error,
        RootCommitError::CurrentMismatch { root, .. } if root == root_id
    ));
    assert!(after_stale_commit.is_empty());
}
#[test]
fn root_commit_defers_hidden_callbacks_without_visible_invocation_records() {
    let (mut store, root_id, host) = root_store();
    let callback = RootUpdateCallbackHandle::from_raw(99);
    let update = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(14),
        Some(callback),
    )
    .unwrap();
    store
        .update_queues_mut()
        .mark_update_hidden(update.update())
        .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let callbacks = commit.root_update_callbacks();
    let current_queue = store
        .fiber_arena()
        .get(commit.current())
        .unwrap()
        .update_queue();
    let after_commit = store
        .update_queues()
        .peek_root_update_callback_records(current_queue)
        .unwrap();

    assert!(callbacks.visible().is_empty());
    assert!(callbacks.hidden().is_empty());
    assert_eq!(
        callback_handles(callbacks.deferred_hidden()),
        vec![callback]
    );
    assert_eq!(callbacks.deferred_hidden()[0].update(), update.update());
    assert_eq!(
        callbacks.deferred_hidden()[0].visibility(),
        RootUpdateCallbackVisibility::DeferredHidden
    );
    assert!(after_commit.visible().is_empty());
    assert!(after_commit.hidden().is_empty());
    assert_eq!(
        callback_handles(after_commit.deferred_hidden()),
        vec![callback]
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
