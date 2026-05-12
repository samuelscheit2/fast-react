use super::*;

#[test]
fn sync_flush_commit_recovery_diagnostics_preserve_callbacks_without_public_retry() {
    let (mut store, root_id, host) = root_store();
    let callback = RootUpdateCallbackHandle::from_raw(4502);
    let previous_current = store.root(root_id).unwrap().current();
    let update = update_container_sync(
        &mut store,
        root_id,
        RootElementHandle::from_raw(4502),
        Some(callback),
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();
    let pending_lanes = store.root(root_id).unwrap().lanes().pending_lanes();
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    let render_phase = rendered_record.render_phase();
    store
        .root_mut(root_id)
        .unwrap()
        .scheduling_mut()
        .clear_render_phase_work();

    let diagnostic =
        SyncFlushRootRecord::commit_rendered_sync_flush_record_with_error_recovery_diagnostics_for_canary(
            &mut store,
            rendered_record,
        )
        .unwrap();

    assert_eq!(diagnostic.order(), 0);
    assert_eq!(diagnostic.root(), root_id);
    assert_eq!(diagnostic.lanes(), Lanes::SYNC);
    assert_eq!(
        diagnostic.status(),
        SyncFlushErrorRecoveryRootStatusForCanary::CommitFailed
    );
    assert!(diagnostic.render_error().is_none());
    assert!(diagnostic.committed().is_none());
    assert!(matches!(
        diagnostic.commit_error(),
        Some(RootCommitError::RenderPhaseWorkMismatch {
            root,
            expected,
            actual,
        }) if *root == root_id
            && expected.is_none()
            && *actual == render_phase.finished_work()
    ));
    let before = diagnostic.commit_before().unwrap();
    let after = diagnostic.commit_after().unwrap();
    assert_eq!(
        before.callback_queue(),
        render_phase.work_in_progress_update_queue()
    );
    assert_eq!(before.visible_callback_count(), 1);
    assert_eq!(before.hidden_callback_count(), 0);
    assert_eq!(before.deferred_hidden_callback_count(), 0);
    assert_eq!(
        callback_handles(before.root_update_callbacks().visible()),
        vec![callback]
    );
    assert!(after.preserves_lane_and_callback_metadata_from(before));
    assert!(diagnostic.preserved_lane_and_callback_metadata());
    assert!(!diagnostic.retried_public_work());
    assert!(!diagnostic.invoked_public_callbacks());
    assert!(!diagnostic.public_flush_sync_compatibility_claimed());
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        pending_lanes
    );
    assert!(store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_callback_drain_diagnostics_prove_cross_root_lane_commit_order() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let host = RecordingHost::default();
    let scheduled_second = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let scheduled_first = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let first_visible_callback = RootUpdateCallbackHandle::from_raw(50101);
    let first_hidden_callback = RootUpdateCallbackHandle::from_raw(50102);
    let second_hidden_callback = RootUpdateCallbackHandle::from_raw(50103);
    let second_visible_callback = RootUpdateCallbackHandle::from_raw(50104);

    let first_visible = update_container_sync(
        &mut store,
        scheduled_first,
        RootElementHandle::from_raw(50101),
        Some(first_visible_callback),
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, first_visible.schedule()).unwrap();
    let first_hidden = update_container_sync(
        &mut store,
        scheduled_first,
        RootElementHandle::from_raw(50102),
        Some(first_hidden_callback),
    )
    .unwrap();
    store
        .update_queues_mut()
        .mark_update_hidden(first_hidden.update())
        .unwrap();
    ensure_root_is_scheduled(&mut store, first_hidden.schedule()).unwrap();

    let second_hidden = update_container_sync(
        &mut store,
        scheduled_second,
        RootElementHandle::from_raw(50103),
        Some(second_hidden_callback),
    )
    .unwrap();
    store
        .update_queues_mut()
        .mark_update_hidden(second_hidden.update())
        .unwrap();
    ensure_root_is_scheduled(&mut store, second_hidden.schedule()).unwrap();
    let second_visible = update_container_sync(
        &mut store,
        scheduled_second,
        RootElementHandle::from_raw(50104),
        Some(second_visible_callback),
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, second_visible.schedule()).unwrap();

    let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();
    let diagnostics = result
        .root_callback_drain_diagnostics_for_canary(&store)
        .unwrap();

    assert_eq!(result.records().len(), 2);
    assert_eq!(
        diagnostics.committed_root_order(),
        &[scheduled_first, scheduled_second]
    );
    assert_eq!(diagnostics.root_snapshots().len(), 2);
    assert_eq!(diagnostics.records().len(), 4);
    assert_eq!(diagnostics.visible_callback_count(), 2);
    assert_eq!(diagnostics.hidden_callback_count(), 2);
    assert!(diagnostics.has_visible_and_hidden_callbacks());
    assert!(diagnostics.root_snapshots_in_commit_order());
    assert!(diagnostics.records_in_deterministic_commit_order());
    assert!(diagnostics.callback_records_match_commit_lanes());
    assert!(diagnostics.hidden_callbacks_deferred_without_invocation());
    assert!(diagnostics.root_snapshots_prove_deterministic_lane_order());
    assert!(diagnostics.proves_cross_root_callback_lane_commit_order());
    assert!(!diagnostics.skipped_reentrant_flush());
    assert!(!diagnostics.skipped_no_sync_work());
    assert!(!diagnostics.public_callbacks_invoked());
    assert!(!diagnostics.public_root_callback_behavior_exposed());

    let first_snapshot = &diagnostics.root_snapshots()[0];
    assert_eq!(first_snapshot.root(), scheduled_first);
    assert_eq!(first_snapshot.commit_order(), 0);
    assert_eq!(first_snapshot.render_lanes(), Lanes::SYNC);
    assert_eq!(first_snapshot.finished_lanes(), Lanes::SYNC);
    assert_eq!(first_snapshot.visible_callback_count(), 1);
    assert_eq!(first_snapshot.hidden_callback_count(), 1);
    assert!(first_snapshot.has_visible_and_hidden_callbacks());
    assert!(first_snapshot.proves_deterministic_lane_order());

    let second_snapshot = &diagnostics.root_snapshots()[1];
    assert_eq!(second_snapshot.root(), scheduled_second);
    assert_eq!(second_snapshot.commit_order(), 1);
    assert_eq!(second_snapshot.render_lanes(), Lanes::SYNC);
    assert_eq!(second_snapshot.finished_lanes(), Lanes::SYNC);
    assert_eq!(second_snapshot.visible_callback_count(), 1);
    assert_eq!(second_snapshot.hidden_callback_count(), 1);
    assert!(second_snapshot.has_visible_and_hidden_callbacks());
    assert!(second_snapshot.proves_deterministic_lane_order());

    let records = diagnostics.records();
    assert_eq!(records[0].root(), scheduled_first);
    assert_eq!(records[0].commit_order(), 0);
    assert_eq!(records[0].callback_order(), 0);
    assert_eq!(records[0].accepted_sequence(), 0);
    assert_eq!(records[0].update(), first_visible.update());
    assert_eq!(records[0].callback(), first_visible_callback);
    assert_eq!(
        records[0].visibility(),
        RootUpdateCallbackVisibility::Visible
    );
    assert_eq!(records[0].update_lanes(), Lanes::SYNC);
    assert_eq!(records[0].callback_lanes(), Lanes::SYNC);
    assert_eq!(records[0].render_lanes(), Lanes::SYNC);
    assert_eq!(records[0].finished_lanes(), Lanes::SYNC);
    assert!(records[0].callback_lanes_match_commit());

    assert_eq!(records[1].root(), scheduled_first);
    assert_eq!(records[1].commit_order(), 0);
    assert_eq!(records[1].callback_order(), 1);
    assert_eq!(records[1].accepted_sequence(), 1);
    assert_eq!(records[1].update(), first_hidden.update());
    assert_eq!(records[1].callback(), first_hidden_callback);
    assert_eq!(
        records[1].visibility(),
        RootUpdateCallbackVisibility::DeferredHidden
    );
    assert_eq!(
        records[1].update_lanes(),
        Lanes::SYNC.merge_lane(Lane::OFFSCREEN)
    );
    assert_eq!(records[1].callback_lanes(), Lanes::SYNC);
    assert!(records[1].update_lanes_include_offscreen());
    assert!(records[1].callback_lanes_match_commit());
    assert!(!records[1].public_callback_invoked());

    assert_eq!(records[2].root(), scheduled_second);
    assert_eq!(records[2].commit_order(), 1);
    assert_eq!(records[2].callback_order(), 0);
    assert_eq!(records[2].accepted_sequence(), 0);
    assert_eq!(records[2].update(), second_hidden.update());
    assert_eq!(records[2].callback(), second_hidden_callback);
    assert_eq!(
        records[2].visibility(),
        RootUpdateCallbackVisibility::DeferredHidden
    );
    assert_eq!(
        records[2].update_lanes(),
        Lanes::SYNC.merge_lane(Lane::OFFSCREEN)
    );
    assert_eq!(records[2].callback_lanes(), Lanes::SYNC);
    assert!(records[2].update_lanes_include_offscreen());
    assert!(records[2].callback_lanes_match_commit());
    assert!(!records[2].public_callback_invoked());

    assert_eq!(records[3].root(), scheduled_second);
    assert_eq!(records[3].commit_order(), 1);
    assert_eq!(records[3].callback_order(), 1);
    assert_eq!(records[3].accepted_sequence(), 1);
    assert_eq!(records[3].update(), second_visible.update());
    assert_eq!(records[3].callback(), second_visible_callback);
    assert_eq!(
        records[3].visibility(),
        RootUpdateCallbackVisibility::Visible
    );
    assert_eq!(records[3].update_lanes(), Lanes::SYNC);
    assert_eq!(records[3].callback_lanes(), Lanes::SYNC);
    assert!(records[3].callback_lanes_match_commit());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_private_callback_execution_drains_matching_two_root_commits() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let host = RecordingHost::default();
    let first_root = store
        .create_client_root(FakeContainer::new(701), RootOptions::new())
        .unwrap();
    let second_root = store
        .create_client_root(FakeContainer::new(702), RootOptions::new())
        .unwrap();
    let first_callback = RootUpdateCallbackHandle::from_raw(70101);
    let second_callback = RootUpdateCallbackHandle::from_raw(70201);

    let first_update = update_container_sync(
        &mut store,
        first_root,
        RootElementHandle::from_raw(70101),
        Some(first_callback),
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, first_update.schedule()).unwrap();
    let first_accepted = host_root_queued_callback_order_snapshot_for_canary(
        &store,
        first_root,
        std::slice::from_ref(&first_update),
    )
    .unwrap();

    let second_update = update_container_sync(
        &mut store,
        second_root,
        RootElementHandle::from_raw(70201),
        Some(second_callback),
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, second_update.schedule()).unwrap();
    let second_accepted = host_root_queued_callback_order_snapshot_for_canary(
        &store,
        second_root,
        std::slice::from_ref(&second_update),
    )
    .unwrap();

    let mut result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let mut control = TestRootUpdateCallbackControl::default();
    let accepted_orders = vec![first_accepted, second_accepted];

    let diagnostics = result
        .execute_accepted_visible_root_update_callbacks_after_matching_commits_under_test_control_for_canary(
            &accepted_orders,
            &mut control,
        )
        .unwrap();

    assert_eq!(result.records().len(), 2);
    assert_eq!(
        diagnostics.committed_root_order(),
        &[first_root, second_root]
    );
    assert_eq!(
        diagnostics.accepted_root_order(),
        &[first_root, second_root]
    );
    assert_eq!(diagnostics.invocations().len(), 2);
    assert_eq!(diagnostics.records().len(), 2);
    assert!(diagnostics.matched_committed_roots());
    assert!(diagnostics.invoked_accepted_visible_callbacks_for_all_roots());
    assert!(diagnostics.records_are_visible());
    assert!(diagnostics.records_in_cross_root_commit_order());
    assert!(diagnostics.records_match_accepted_visible_count());
    assert_eq!(diagnostics.accepted_visible_callback_count(), 2);
    assert_eq!(diagnostics.completed_count(), 2);
    assert_eq!(diagnostics.error_count(), 0);
    assert!(diagnostics.proves_cross_root_accepted_visible_callback_execution());
    assert!(!diagnostics.skipped_reentrant_flush());
    assert!(!diagnostics.skipped_no_sync_work());
    assert!(!diagnostics.public_callbacks_invoked());
    assert!(!diagnostics.public_root_callback_behavior_exposed());
    assert!(!diagnostics.hidden_callbacks_invoked());
    assert!(!diagnostics.root_error_callbacks_invoked());

    let records = diagnostics.records();
    assert_eq!(records[0].root(), first_root);
    assert_eq!(records[0].commit_order(), 0);
    assert_eq!(records[0].cross_root_invocation_order(), 0);
    assert_eq!(records[0].root_invocation_order(), 0);
    assert_eq!(records[0].accepted_sequence(), 0);
    assert_eq!(records[0].update(), first_update.update());
    assert_eq!(records[0].callback(), first_callback);
    assert_eq!(
        records[0].visibility(),
        RootUpdateCallbackVisibility::Visible
    );
    assert_eq!(
        records[0].status(),
        RootUpdateCallbackInvocationStatus::Completed
    );

    assert_eq!(records[1].root(), second_root);
    assert_eq!(records[1].commit_order(), 1);
    assert_eq!(records[1].cross_root_invocation_order(), 1);
    assert_eq!(records[1].root_invocation_order(), 0);
    assert_eq!(records[1].accepted_sequence(), 0);
    assert_eq!(records[1].update(), second_update.update());
    assert_eq!(records[1].callback(), second_callback);
    assert_eq!(
        records[1].visibility(),
        RootUpdateCallbackVisibility::Visible
    );
    assert_eq!(
        records[1].status(),
        RootUpdateCallbackInvocationStatus::Completed
    );

    assert_eq!(control.calls().len(), 2);
    assert_eq!(control.calls()[0].callback(), first_callback);
    assert_eq!(control.calls()[1].callback(), second_callback);
    assert!(
        result.records()[0]
            .commit()
            .root_update_callback_invocation_gate()
            .is_empty()
    );
    assert!(
        result.records()[1]
            .commit()
            .root_update_callback_invocation_gate()
            .is_empty()
    );
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
fn sync_flush_private_callback_execution_blocks_mismatched_cross_root_order() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let host = RecordingHost::default();
    let first_root = store
        .create_client_root(FakeContainer::new(711), RootOptions::new())
        .unwrap();
    let second_root = store
        .create_client_root(FakeContainer::new(712), RootOptions::new())
        .unwrap();

    let first_update = update_container_sync(
        &mut store,
        first_root,
        RootElementHandle::from_raw(71101),
        Some(RootUpdateCallbackHandle::from_raw(71101)),
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, first_update.schedule()).unwrap();
    let first_accepted = host_root_queued_callback_order_snapshot_for_canary(
        &store,
        first_root,
        std::slice::from_ref(&first_update),
    )
    .unwrap();

    let second_update = update_container_sync(
        &mut store,
        second_root,
        RootElementHandle::from_raw(71201),
        Some(RootUpdateCallbackHandle::from_raw(71201)),
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, second_update.schedule()).unwrap();
    let second_accepted = host_root_queued_callback_order_snapshot_for_canary(
        &store,
        second_root,
        std::slice::from_ref(&second_update),
    )
    .unwrap();

    let mut result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();
    let mut control = TestRootUpdateCallbackControl::default();
    let accepted_orders = vec![second_accepted, first_accepted];

    let diagnostics = result
        .execute_accepted_visible_root_update_callbacks_after_matching_commits_under_test_control_for_canary(
            &accepted_orders,
            &mut control,
        )
        .unwrap();

    assert_eq!(result.records().len(), 2);
    assert_eq!(
        diagnostics.committed_root_order(),
        &[first_root, second_root]
    );
    assert_eq!(
        diagnostics.accepted_root_order(),
        &[second_root, first_root]
    );
    assert!(!diagnostics.matched_committed_roots());
    assert!(diagnostics.invocations().is_empty());
    assert!(diagnostics.records().is_empty());
    assert!(!diagnostics.proves_cross_root_accepted_visible_callback_execution());
    assert!(control.calls().is_empty());
    assert_eq!(
        result.records()[0]
            .commit()
            .root_update_callback_invocation_gate()
            .len(),
        1
    );
    assert_eq!(
        result.records()[1]
            .commit()
            .root_update_callback_invocation_gate()
            .len(),
        1
    );
    assert!(!diagnostics.public_root_callback_behavior_exposed());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_surfaces_visible_root_update_callback_snapshot() {
    let (mut store, root_id, host) = root_store();
    let callback = RootUpdateCallbackHandle::from_raw(177);
    let update = update_container_sync(
        &mut store,
        root_id,
        RootElementHandle::from_raw(1770),
        Some(callback),
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();

    let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

    assert_eq!(result.records().len(), 1);
    let record = &result.records()[0];
    let callbacks = record.root_update_callbacks();
    assert_eq!(
        callbacks.queue(),
        record.render_phase().work_in_progress_update_queue()
    );
    assert_eq!(callback_handles(callbacks.visible()), vec![callback]);
    assert_eq!(callbacks.visible()[0].update(), update.update());
    assert_eq!(callbacks.visible()[0].sequence(), 0);
    assert_eq!(
        callbacks.visible()[0].visibility(),
        RootUpdateCallbackVisibility::Visible
    );
    assert!(callbacks.hidden().is_empty());
    assert!(callbacks.deferred_hidden().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_root_callback_invocation_execution_gate_drains_visible_callbacks_in_commit_order() {
    let (mut store, root_id, host) = root_store();
    let first_callback = RootUpdateCallbackHandle::from_raw(277);
    let hidden_callback = RootUpdateCallbackHandle::from_raw(278);
    let second_callback = RootUpdateCallbackHandle::from_raw(279);
    let first = update_container_sync(
        &mut store,
        root_id,
        RootElementHandle::from_raw(2770),
        Some(first_callback),
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, first.schedule()).unwrap();
    let hidden = update_container_sync(
        &mut store,
        root_id,
        RootElementHandle::from_raw(2780),
        Some(hidden_callback),
    )
    .unwrap();
    store
        .update_queues_mut()
        .mark_update_hidden(hidden.update())
        .unwrap();
    ensure_root_is_scheduled(&mut store, hidden.schedule()).unwrap();
    let second = update_container_sync(
        &mut store,
        root_id,
        RootElementHandle::from_raw(2790),
        Some(second_callback),
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, second.schedule()).unwrap();

    let mut result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let second_error = root_callback_error(991);
    let mut control =
        TestRootUpdateCallbackControl::default().with_result(second_callback, Err(second_error));

    assert_eq!(result.records().len(), 1);
    let execution = result.records[0].drain_root_update_callbacks_under_test_control(&mut control);

    assert_eq!(execution.source_visible_record_count(), 2);
    assert_eq!(execution.hidden_record_count(), 0);
    assert_eq!(execution.deferred_hidden_record_count(), 1);
    assert_eq!(execution.len(), 2);
    assert_eq!(execution.completed_count(), 1);
    assert_eq!(execution.error_count(), 1);
    assert!(execution.has_errors());
    assert_eq!(execution.errors(), vec![second_error]);
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
    assert_eq!(records[1].accepted_sequence(), 2);
    assert_eq!(records[1].update(), second.update());
    assert_eq!(records[1].callback(), second_callback);
    assert_eq!(
        records[1].status(),
        RootUpdateCallbackInvocationStatus::Errored
    );
    assert_eq!(records[1].error(), Some(second_error));
    assert_eq!(control.calls().len(), 2);
    assert_eq!(control.calls()[0].callback(), first_callback);
    assert_eq!(control.calls()[1].callback(), second_callback);
    assert!(
        result.records[0]
            .commit()
            .root_update_callback_invocation_gate()
            .is_empty()
    );

    let repeated = result.records[0].drain_root_update_callbacks_under_test_control(&mut control);
    assert_eq!(repeated.source_visible_record_count(), 0);
    assert!(repeated.is_empty());
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
fn sync_flush_surfaces_deferred_hidden_root_update_callback_snapshot() {
    let (mut store, root_id, host) = root_store();
    let callback = RootUpdateCallbackHandle::from_raw(188);
    let update = update_container_sync(
        &mut store,
        root_id,
        RootElementHandle::from_raw(1880),
        Some(callback),
    )
    .unwrap();
    store
        .update_queues_mut()
        .mark_update_hidden(update.update())
        .unwrap();
    ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();

    let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

    assert_eq!(result.records().len(), 1);
    let record = &result.records()[0];
    let callbacks = record.root_update_callbacks();
    assert_eq!(
        callbacks.queue(),
        record.render_phase().work_in_progress_update_queue()
    );
    assert!(callbacks.visible().is_empty());
    assert!(callbacks.hidden().is_empty());
    assert_eq!(
        callback_handles(callbacks.deferred_hidden()),
        vec![callback]
    );
    assert_eq!(callbacks.deferred_hidden()[0].update(), update.update());
    assert_eq!(callbacks.deferred_hidden()[0].sequence(), 0);
    assert_eq!(
        callbacks.deferred_hidden()[0].visibility(),
        RootUpdateCallbackVisibility::DeferredHidden
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
