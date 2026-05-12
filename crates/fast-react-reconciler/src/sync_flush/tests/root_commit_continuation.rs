use super::*;

#[test]
fn sync_flush_no_op_fast_path_returns_empty_result() {
    let (mut store, _root_id, host) = root_store();

    let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

    assert!(result.skipped_no_sync_work());
    assert!(!result.skipped_reentrant_flush());
    assert!(!result.did_flush_work());
    assert!(result.records().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_commits_one_root_sync_work() {
    let (mut store, root_id, host) = root_store();
    let element = RootElementHandle::from_raw(42);
    let previous_current = store.root(root_id).unwrap().current();
    schedule_sync_update(&mut store, root_id, element);

    let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

    assert!(result.did_flush_work());
    assert_eq!(result.records().len(), 1);
    let record = &result.records()[0];
    assert_eq!(record.order(), 0);
    assert_eq!(record.root(), root_id);
    assert_eq!(record.render_lanes(), Lanes::SYNC);
    assert_eq!(record.applied_update_count(), 1);
    assert_eq!(record.skipped_update_count(), 0);
    assert_eq!(record.remaining_lanes(), Lanes::NO);
    assert_eq!(record.pending_lanes(), Lanes::NO);
    assert!(!record.has_remaining_work());
    assert_eq!(record.commit().previous_current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        record.commit().current()
    );
    assert_eq!(current_host_root_element(&store, root_id), element);
    assert!(!store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_all_roots_commit_diagnostics_verify_finished_work_handoff_identity() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let host = RecordingHost::default();
    let first = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let second = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let first_previous_current = store.root(first).unwrap().current();
    let second_previous_current = store.root(second).unwrap().current();

    schedule_sync_update(&mut store, first, RootElementHandle::from_raw(42_100));
    schedule_sync_update(&mut store, second, RootElementHandle::from_raw(42_200));

    let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

    assert!(result.did_flush_work());
    assert_eq!(result.records().len(), 2);
    assert_eq!(result.records()[0].root(), first);
    assert_eq!(result.records()[1].root(), second);

    let first_record = &result.records()[0];
    assert_sync_flush_finished_work_handoff_diagnostics(
        &store,
        first_record,
        first_previous_current,
    );

    let second_record = &result.records()[1];
    assert_sync_flush_finished_work_handoff_diagnostics(
        &store,
        second_record,
        second_previous_current,
    );

    assert_eq!(store.root(first).unwrap().finished_work(), None);
    assert_eq!(store.root(first).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(store.root(second).unwrap().finished_work(), None);
    assert_eq!(store.root(second).unwrap().finished_lanes(), Lanes::NO);
    assert!(!store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_handoff_commits_completed_render_record_as_inert_commit_record() {
    let (mut store, root_id, host) = root_store();
    let element = RootElementHandle::from_raw(66);
    let callback = RootUpdateCallbackHandle::from_raw(660);
    let previous_current = store.root(root_id).unwrap().current();
    let update = update_container_sync(&mut store, root_id, element, Some(callback)).unwrap();
    ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();

    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

    assert_eq!(rendered.records().len(), 1);
    assert_eq!(
        rendered.records()[0].status(),
        RootSyncFlushRecordStatus::RenderedAwaitingCommit
    );
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert!(store.root_scheduler().might_have_pending_sync_work());

    let committed =
        SyncFlushRootRecord::commit_rendered_sync_flush_record(&mut store, rendered.records()[0])
            .unwrap();

    assert_eq!(committed.order(), 0);
    assert_eq!(committed.root(), root_id);
    assert_eq!(committed.render_lanes(), Lanes::SYNC);
    assert_eq!(committed.applied_update_count(), 1);
    assert_eq!(committed.skipped_update_count(), 0);
    assert_eq!(committed.remaining_lanes(), Lanes::NO);
    assert_eq!(committed.pending_lanes(), Lanes::NO);
    assert_eq!(committed.commit().previous_current(), previous_current);
    assert_eq!(committed.commit().finished_lanes(), Lanes::SYNC);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        committed.commit().current()
    );
    assert_eq!(current_host_root_element(&store, root_id), element);

    let callbacks = committed.root_update_callbacks();
    assert_eq!(
        callbacks.queue(),
        committed.render_phase().work_in_progress_update_queue()
    );
    assert_eq!(callback_handles(callbacks.visible()), vec![callback]);
    assert_eq!(callbacks.visible()[0].update(), update.update());
    assert!(callbacks.hidden().is_empty());
    assert!(callbacks.deferred_hidden().is_empty());
    assert!(!store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_direct_commit_rejects_stale_root_finished_work_metadata() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(66_080));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    let render_phase = rendered_record.render_phase();
    store
        .root_mut(root_id)
        .unwrap()
        .record_finished_work_for_canary(previous_current, Lanes::SYNC);

    let error = SyncFlushRootRecord::commit_rendered_sync_flush_record(&mut store, rendered_record)
        .unwrap_err();

    assert_sync_flush_finished_work_handoff_identity_mismatch(error);
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(render_phase.finished_work())
    );
    assert_eq!(
        store.root(root_id).unwrap().finished_work(),
        Some(previous_current)
    );
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::SYNC);
    assert!(store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_direct_commit_rejects_root_finished_lanes_metadata_mismatch() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(66_081));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    let render_phase = rendered_record.render_phase();
    let mismatched_lanes = Lanes::from(Lane::SYNC_HYDRATION);
    store
        .root_mut(root_id)
        .unwrap()
        .record_finished_work_for_canary(render_phase.finished_work(), mismatched_lanes);

    let error = SyncFlushRootRecord::commit_rendered_sync_flush_record(&mut store, rendered_record)
        .unwrap_err();

    assert_sync_flush_finished_work_handoff_identity_mismatch(error);
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(render_phase.finished_work())
    );
    assert_eq!(
        store.root(root_id).unwrap().finished_work(),
        Some(render_phase.finished_work())
    );
    assert_eq!(
        store.root(root_id).unwrap().finished_lanes(),
        mismatched_lanes
    );
    assert!(store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_root_commit_continuation_consumes_finished_work_handoff_metadata() {
    let (mut store, root_id, host) = root_store();
    let element = RootElementHandle::from_raw(66_100);
    let callback = RootUpdateCallbackHandle::from_raw(66_101);
    let previous_current = store.root(root_id).unwrap().current();
    let update = update_container_sync(&mut store, root_id, element, Some(callback)).unwrap();
    ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();

    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    let render_phase = rendered_record.render_phase();

    let continuation = commit_sync_flush_root_finished_work_continuation_for_canary(
        &mut store,
        &ExecutionContextState::new(),
        rendered_record,
    )
    .unwrap();

    assert_eq!(
        continuation.status(),
        SyncFlushRootCommitContinuationStatusForCanary::Committed
    );
    assert!(continuation.execution_context().can_enter_sync_flush());
    assert_eq!(continuation.root(), root_id);
    assert_eq!(continuation.order(), 0);
    assert_eq!(continuation.selected_lanes(), Lanes::SYNC);
    assert!(continuation.accepted_finished_work_handoff());
    assert!(continuation.produced_one_inert_commit_record());
    assert!(!continuation.executes_passive_effects());
    assert!(!continuation.public_flush_sync_compatibility_claimed());

    let handoff = continuation.handoff_identity().unwrap();
    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.render_phase_root(), root_id);
    assert_eq!(handoff.order(), 0);
    assert_eq!(handoff.selected_lanes(), Lanes::SYNC);
    assert_eq!(handoff.root_token(), root_id.state_node_handle());
    assert_eq!(handoff.previous_current(), previous_current);
    assert_eq!(handoff.current_before_commit(), previous_current);
    assert_eq!(
        handoff.pending_work_before_commit(),
        Some(render_phase.finished_work())
    );
    assert_eq!(
        handoff.root_finished_work_before_commit(),
        Some(render_phase.finished_work())
    );
    assert_eq!(handoff.finished_work(), render_phase.finished_work());
    assert_eq!(handoff.render_lanes(), Lanes::SYNC);
    assert_eq!(handoff.finished_lanes(), Lanes::SYNC);
    assert_eq!(handoff.root_finished_lanes_before_commit(), Lanes::SYNC);
    assert_eq!(handoff.remaining_lanes(), Lanes::NO);
    assert_eq!(handoff.pending_lanes_before_commit(), Lanes::SYNC);
    assert_eq!(handoff.render_phase_lanes_before_commit(), Lanes::SYNC);
    assert!(handoff.accepted_current_finished_work_record_shape());

    let commit_identity = continuation.commit_result_identity().unwrap();
    assert_eq!(commit_identity.root(), root_id);
    assert_eq!(commit_identity.order(), 0);
    assert_eq!(commit_identity.selected_lanes(), Lanes::SYNC);
    assert_eq!(commit_identity.previous_current(), previous_current);
    assert_eq!(
        commit_identity.committed_current(),
        render_phase.finished_work()
    );
    assert_eq!(
        commit_identity.finished_work(),
        render_phase.finished_work()
    );
    assert_eq!(commit_identity.finished_lanes(), Lanes::SYNC);
    assert_eq!(commit_identity.remaining_lanes(), Lanes::NO);
    assert_eq!(commit_identity.pending_lanes(), Lanes::NO);
    assert_eq!(
        commit_identity.root_current_after_commit(),
        render_phase.finished_work()
    );
    assert_eq!(commit_identity.root_finished_work_after_commit(), None);
    assert_eq!(
        commit_identity.root_finished_lanes_after_commit(),
        Lanes::NO
    );
    assert!(commit_identity.matches_finished_work_handoff(handoff));

    let commit = continuation.commit().unwrap();
    assert_eq!(commit.order(), 0);
    assert_eq!(commit.root(), root_id);
    assert_eq!(commit.render_lanes(), Lanes::SYNC);
    assert_eq!(commit.commit().previous_current(), previous_current);
    assert_eq!(commit.commit().current(), render_phase.finished_work());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render_phase.finished_work()
    );
    assert_eq!(current_host_root_element(&store, root_id), element);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert!(!store.root_scheduler().is_flushing_work());
    assert!(!store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_root_commit_continuation_rejects_render_commit_and_reentry() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(66_200));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    let render_phase = rendered_record.render_phase();
    let mut execution_context = ExecutionContextState::new();

    let render_reentry = execution_context
        .with_render_context(|execution_context| {
            commit_sync_flush_root_finished_work_continuation_for_canary(
                &mut store,
                execution_context,
                rendered_record,
            )
        })
        .unwrap();

    assert_eq!(
        render_reentry.status(),
        SyncFlushRootCommitContinuationStatusForCanary::BlockedByExecutionContext
    );
    assert!(
        render_reentry
            .execution_context()
            .blocked_by_render_or_commit()
    );
    assert_eq!(render_reentry.commit(), None);
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(render_phase.finished_work())
    );

    let commit_reentry = execution_context
        .with_commit_context(|execution_context| {
            commit_sync_flush_root_finished_work_continuation_for_canary(
                &mut store,
                execution_context,
                rendered_record,
            )
        })
        .unwrap();

    assert_eq!(
        commit_reentry.status(),
        SyncFlushRootCommitContinuationStatusForCanary::BlockedByExecutionContext
    );
    assert!(
        commit_reentry
            .execution_context()
            .blocked_by_render_or_commit()
    );
    assert_eq!(commit_reentry.commit(), None);
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);

    store.root_scheduler_mut().set_is_flushing_work(true);
    let scheduler_reentry = commit_sync_flush_root_finished_work_continuation_for_canary(
        &mut store,
        &ExecutionContextState::new(),
        rendered_record,
    )
    .unwrap();
    store.root_scheduler_mut().set_is_flushing_work(false);

    assert_eq!(
        scheduler_reentry.status(),
        SyncFlushRootCommitContinuationStatusForCanary::SkippedReentrantFlush
    );
    assert!(scheduler_reentry.execution_context().can_enter_sync_flush());
    assert_eq!(scheduler_reentry.commit(), None);
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(render_phase.finished_work())
    );
    assert!(store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_root_commit_continuation_rejects_stale_finished_work_handoff() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(66_300));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    let render_phase = rendered_record.render_phase();
    store
        .root_mut(root_id)
        .unwrap()
        .scheduling_mut()
        .clear_render_phase_work();

    let continuation = commit_sync_flush_root_finished_work_continuation_for_canary(
        &mut store,
        &ExecutionContextState::new(),
        rendered_record,
    )
    .unwrap();

    assert_eq!(
        continuation.status(),
        SyncFlushRootCommitContinuationStatusForCanary::RejectedStaleFinishedWorkHandoff
    );
    assert_eq!(continuation.root(), root_id);
    assert_eq!(continuation.order(), 0);
    assert_eq!(continuation.selected_lanes(), Lanes::SYNC);
    assert!(!continuation.accepted_finished_work_handoff());
    assert!(!continuation.produced_one_inert_commit_record());
    assert_eq!(continuation.commit(), None);
    let handoff = continuation.handoff_identity().unwrap();
    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.finished_work(), render_phase.finished_work());
    assert_eq!(handoff.current_before_commit(), previous_current);
    assert_eq!(handoff.pending_work_before_commit(), None);
    assert_eq!(
        handoff.root_finished_work_before_commit(),
        Some(render_phase.finished_work())
    );
    assert!(!handoff.accepted_current_finished_work_record_shape());
    assert_eq!(continuation.commit_result_identity(), None);
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().finished_work(),
        Some(render_phase.finished_work())
    );
    assert!(store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_root_commit_continuation_rejects_missing_root_finished_work_handoff() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(66_310));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    let render_phase = rendered_record.render_phase();
    store.root_mut(root_id).unwrap().clear_finished_work();

    let continuation = commit_sync_flush_root_finished_work_continuation_for_canary(
        &mut store,
        &ExecutionContextState::new(),
        rendered_record,
    )
    .unwrap();

    assert_eq!(
        continuation.status(),
        SyncFlushRootCommitContinuationStatusForCanary::RejectedStaleFinishedWorkHandoff
    );
    assert!(!continuation.accepted_finished_work_handoff());
    assert_eq!(continuation.commit(), None);
    let handoff = continuation.handoff_identity().unwrap();
    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.render_phase_root(), root_id);
    assert_eq!(
        handoff.pending_work_before_commit(),
        Some(render_phase.finished_work())
    );
    assert_eq!(handoff.root_finished_work_before_commit(), None);
    assert_eq!(handoff.root_finished_lanes_before_commit(), Lanes::NO);
    assert!(!handoff.accepted_current_finished_work_record_shape());
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_root_commit_continuation_rejects_stale_root_finished_work_handoff() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(66_320));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    store
        .root_mut(root_id)
        .unwrap()
        .record_finished_work_for_canary(previous_current, Lanes::SYNC);

    let continuation = commit_sync_flush_root_finished_work_continuation_for_canary(
        &mut store,
        &ExecutionContextState::new(),
        rendered_record,
    )
    .unwrap();

    assert_eq!(
        continuation.status(),
        SyncFlushRootCommitContinuationStatusForCanary::RejectedStaleFinishedWorkHandoff
    );
    assert_eq!(continuation.commit(), None);
    let handoff = continuation.handoff_identity().unwrap();
    assert_eq!(
        handoff.root_finished_work_before_commit(),
        Some(previous_current)
    );
    assert_eq!(
        handoff.finished_work(),
        rendered_record.render_phase().finished_work()
    );
    assert_eq!(handoff.root_finished_lanes_before_commit(), Lanes::SYNC);
    assert!(!handoff.accepted_current_finished_work_record_shape());
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_root_commit_continuation_rejects_finished_lanes_mismatch() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(66_321));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    let render_phase = rendered_record.render_phase();
    store
        .root_mut(root_id)
        .unwrap()
        .record_finished_work_for_canary(
            render_phase.finished_work(),
            Lanes::from(Lane::SYNC_HYDRATION),
        );

    let continuation = commit_sync_flush_root_finished_work_continuation_for_canary(
        &mut store,
        &ExecutionContextState::new(),
        rendered_record,
    )
    .unwrap();

    assert_eq!(
        continuation.status(),
        SyncFlushRootCommitContinuationStatusForCanary::RejectedStaleFinishedWorkHandoff
    );
    assert_eq!(continuation.root(), root_id);
    assert_eq!(continuation.selected_lanes(), Lanes::SYNC);
    assert!(!continuation.accepted_finished_work_handoff());
    assert!(!continuation.produced_one_inert_commit_record());
    assert!(!continuation.public_flush_sync_compatibility_claimed());
    assert!(!continuation.executes_passive_effects());
    assert_eq!(continuation.commit(), None);
    assert_eq!(continuation.commit_result_identity(), None);
    let handoff = continuation.handoff_identity().unwrap();
    assert_eq!(
        handoff.root_finished_work_before_commit(),
        Some(render_phase.finished_work())
    );
    assert_eq!(
        handoff.root_finished_lanes_before_commit(),
        Lanes::from(Lane::SYNC_HYDRATION)
    );
    assert_eq!(handoff.finished_lanes(), Lanes::SYNC);
    assert!(!handoff.accepted_current_finished_work_record_shape());
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_root_commit_continuation_rejects_foreign_finished_work_handoff() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let second = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let first_current = store.root(first).unwrap().current();
    let second_current = store.root(second).unwrap().current();
    schedule_sync_update(&mut store, first, RootElementHandle::from_raw(66_330));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let first_record = rendered.records()[0];
    let foreign_record =
        root_sync_flush_record_for_canary(0, second, Lanes::SYNC, first_record.render_phase());

    let continuation = commit_sync_flush_root_finished_work_continuation_for_canary(
        &mut store,
        &ExecutionContextState::new(),
        foreign_record,
    )
    .unwrap();

    assert_eq!(
        continuation.status(),
        SyncFlushRootCommitContinuationStatusForCanary::RejectedStaleFinishedWorkHandoff
    );
    assert_eq!(continuation.commit(), None);
    let handoff = continuation.handoff_identity().unwrap();
    assert_eq!(handoff.root(), second);
    assert_eq!(handoff.render_phase_root(), first);
    assert_eq!(handoff.current_before_commit(), second_current);
    assert_ne!(
        handoff.root_finished_work_before_commit(),
        Some(handoff.finished_work())
    );
    assert!(!handoff.accepted_current_finished_work_record_shape());
    assert_eq!(store.root(first).unwrap().current(), first_current);
    assert_eq!(store.root(second).unwrap().current(), second_current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_root_commit_continuation_rejects_non_sync_lanes() {
    let (mut store, root_id, host) = root_store();
    let previous_current = store.root(root_id).unwrap().current();
    let update = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(66_400),
        None,
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();
    let render_phase = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let non_sync_record =
        root_sync_flush_record_for_canary(0, root_id, Lanes::DEFAULT, render_phase);

    let continuation = commit_sync_flush_root_finished_work_continuation_for_canary(
        &mut store,
        &ExecutionContextState::new(),
        non_sync_record,
    )
    .unwrap();

    assert_eq!(
        continuation.status(),
        SyncFlushRootCommitContinuationStatusForCanary::RejectedNonSyncLanes
    );
    assert_eq!(continuation.root(), root_id);
    assert_eq!(continuation.order(), 0);
    assert_eq!(continuation.selected_lanes(), Lanes::DEFAULT);
    assert_eq!(continuation.handoff_identity(), None);
    assert_eq!(continuation.commit_result_identity(), None);
    assert_eq!(continuation.commit(), None);
    assert!(!continuation.produced_one_inert_commit_record());
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(render_phase.finished_work())
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::DEFAULT
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_error_recovery_diagnostics_preserve_render_failure_metadata() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let root_id = store
        .create_client_root(
            FakeContainer::new(1),
            RootOptions::new()
                .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(4511))
                .with_on_caught_error(RootErrorCallbackHandle::from_raw(4512))
                .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(4513)),
        )
        .unwrap();
    let callback = RootUpdateCallbackHandle::from_raw(4501);
    let update = update_container_sync(
        &mut store,
        root_id,
        RootElementHandle::from_raw(4501),
        Some(callback),
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let pending_lanes = store.root(root_id).unwrap().lanes().pending_lanes();
    let invalid_queue = UpdateQueueHandle::from_raw(999_450);
    store
        .fiber_arena_mut()
        .get_mut(previous_current)
        .unwrap()
        .set_update_queue(invalid_queue);

    let diagnostics =
        flush_sync_commit_work_on_all_roots_with_error_recovery_diagnostics_for_canary(&mut store)
            .unwrap();

    assert!(!diagnostics.skipped_reentrant_flush());
    assert!(!diagnostics.skipped_no_sync_work());
    assert!(diagnostics.did_capture_failure());
    assert!(diagnostics.preserved_failed_root_metadata());
    assert!(diagnostics.accepted_private_root_error_recovery_commit_evidence());
    assert!(!diagnostics.retried_public_work());
    assert!(!diagnostics.invoked_public_callbacks());
    assert!(!diagnostics.root_error_callbacks_invoked());
    assert!(!diagnostics.public_flush_sync_compatibility_claimed());
    assert_eq!(diagnostics.records().len(), 1);
    let record = &diagnostics.records()[0];
    assert_eq!(record.order(), 0);
    assert_eq!(record.root(), root_id);
    assert_eq!(record.lanes(), Lanes::SYNC);
    assert_eq!(
        record.status(),
        SyncFlushErrorRecoveryRootStatusForCanary::RenderFailed
    );
    assert!(record.commit_error().is_none());
    assert!(record.committed().is_none());
    assert!(matches!(
        record.render_error(),
        Some(RootWorkLoopError::UpdateQueue(
            crate::UpdateQueueError::InvalidQueueHandle { handle }
        )) if *handle == invalid_queue
    ));
    let render_callbacks = record.render_error_option_callbacks().unwrap();
    assert_eq!(render_callbacks.root(), root_id);
    assert_eq!(render_callbacks.render_lanes(), Lanes::SYNC);
    assert!(matches!(
        render_callbacks.error(),
        RootWorkLoopError::UpdateQueue(crate::UpdateQueueError::InvalidQueueHandle {
            handle
        }) if *handle == invalid_queue
    ));
    assert_eq!(
        render_callbacks.on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(4511)
    );
    assert_eq!(
        render_callbacks.on_caught_error(),
        RootErrorCallbackHandle::from_raw(4512)
    );
    assert_eq!(
        render_callbacks.on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(4513)
    );
    let root_error_callbacks = render_callbacks.error_option_callbacks();
    assert_eq!(root_error_callbacks.root(), root_id);
    assert_eq!(
        root_error_callbacks.phase(),
        RootErrorOptionCallbackPhase::Render
    );
    assert!(render_callbacks.has_configured_error_callback());
    assert!(!render_callbacks.root_error_callbacks_invoked());
    assert!(!render_callbacks.public_error_boundaries_enabled());
    assert!(!render_callbacks.recoverable_error_compatibility_claimed());
    let commit_evidence = record.render_failure_commit_evidence().unwrap();
    assert_eq!(commit_evidence.root(), root_id);
    assert_eq!(commit_evidence.render_lanes(), Lanes::SYNC);
    assert_eq!(
        commit_evidence.error_option_callbacks(),
        root_error_callbacks
    );
    assert_eq!(
        commit_evidence.on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(4511)
    );
    assert_eq!(
        commit_evidence.on_caught_error(),
        RootErrorCallbackHandle::from_raw(4512)
    );
    assert_eq!(
        commit_evidence.on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(4513)
    );
    assert!(commit_evidence.has_configured_error_callback());
    assert!(commit_evidence.accepted_render_failure_metadata());
    assert!(!commit_evidence.commit_attempted());
    assert!(!commit_evidence.root_current_switched());
    assert!(!commit_evidence.retried_public_work());
    assert!(!commit_evidence.invoked_public_callbacks());
    assert!(!commit_evidence.root_error_callbacks_invoked());
    assert!(!commit_evidence.public_error_boundaries_enabled());
    assert!(!commit_evidence.recoverable_error_compatibility_claimed());
    assert_eq!(record.scheduler_before().pending_lanes(), pending_lanes);
    assert_eq!(record.scheduler_after().pending_lanes(), pending_lanes);
    assert!(record.preserved_lane_and_callback_metadata());
    assert!(record.preserved_error_callback_handles());
    assert!(record.accepted_private_root_error_recovery_commit_evidence());
    assert!(!record.retried_public_work());
    assert!(!record.invoked_public_callbacks());
    assert!(!record.root_error_callbacks_invoked());
    assert!(!record.public_flush_sync_compatibility_claimed());
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        pending_lanes
    );
    assert!(store.root_scheduler().might_have_pending_sync_work());
    assert!(!store.root_scheduler().is_flushing_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_error_recovery_diagnostics_respect_reentry_guard_without_public_retry() {
    let (mut store, root_id, host) = root_store();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(4503));
    let previous_current = store.root(root_id).unwrap().current();
    let pending_lanes = store.root(root_id).unwrap().lanes().pending_lanes();
    store.root_scheduler_mut().set_is_flushing_work(true);

    let diagnostics =
        flush_sync_commit_work_on_all_roots_with_error_recovery_diagnostics_for_canary(&mut store)
            .unwrap();
    store.root_scheduler_mut().set_is_flushing_work(false);

    assert!(diagnostics.skipped_reentrant_flush());
    assert!(!diagnostics.skipped_no_sync_work());
    assert!(!diagnostics.did_capture_failure());
    assert!(diagnostics.records().is_empty());
    assert!(!diagnostics.retried_public_work());
    assert!(!diagnostics.invoked_public_callbacks());
    assert!(!diagnostics.public_flush_sync_compatibility_claimed());
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        pending_lanes
    );
    assert!(store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_commits_multiple_roots_in_scheduled_order() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let host = RecordingHost::default();
    let first = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let second = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let third = store
        .create_client_root(FakeContainer::new(3), RootOptions::new())
        .unwrap();

    schedule_sync_update(&mut store, second, RootElementHandle::from_raw(20));
    schedule_sync_update(&mut store, first, RootElementHandle::from_raw(10));
    schedule_sync_update(&mut store, third, RootElementHandle::from_raw(30));

    let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();
    let committed_roots = result
        .records()
        .iter()
        .map(|record| record.root())
        .collect::<Vec<_>>();

    assert_eq!(committed_roots, vec![second, first, third]);
    assert_eq!(scheduled_roots(&store).unwrap(), vec![second, first, third]);
    assert_eq!(
        current_host_root_element(&store, first),
        RootElementHandle::from_raw(10)
    );
    assert_eq!(
        current_host_root_element(&store, second),
        RootElementHandle::from_raw(20)
    );
    assert_eq!(
        current_host_root_element(&store, third),
        RootElementHandle::from_raw(30)
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_cross_root_render_diagnostics_prove_scheduled_private_flush() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let host = RecordingHost::default();
    let first = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let second = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let first_element = RootElementHandle::from_raw(901);
    let second_element = RootElementHandle::from_raw(902);

    schedule_sync_update(&mut store, first, first_element);
    schedule_sync_update(&mut store, second, second_element);

    let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();
    let diagnostics = result
        .cross_root_render_diagnostics_for_canary(&store)
        .unwrap();

    assert!(result.did_flush_work());
    assert_eq!(result.records().len(), 2);
    assert_eq!(diagnostics.committed_root_order(), &[first, second]);
    assert_eq!(
        diagnostics.render_lanes_by_root(),
        &[Lanes::SYNC, Lanes::SYNC]
    );
    assert_eq!(
        diagnostics.remaining_lanes_by_root(),
        &[Lanes::NO, Lanes::NO]
    );
    assert_eq!(
        diagnostics.pending_lanes_by_root_after_commit(),
        &[Lanes::NO, Lanes::NO]
    );
    assert_eq!(diagnostics.applied_update_counts_by_root(), &[1, 1]);
    assert_eq!(diagnostics.skipped_update_counts_by_root(), &[0, 0]);
    assert!(!diagnostics.skipped_reentrant_flush());
    assert!(!diagnostics.skipped_no_sync_work());
    assert!(!diagnostics.might_have_pending_sync_work_after_flush());
    assert!(diagnostics.root_current_matches_commits());
    assert!(diagnostics.sync_lanes_consumed_from_roots());
    assert!(diagnostics.proves_cross_root_sync_flush_scheduling());
    assert_eq!(current_host_root_element(&store, first), first_element);
    assert_eq!(current_host_root_element(&store, second), second_element);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_retains_skipped_non_sync_lanes_in_result_and_root() {
    let (mut store, root_id, _host) = root_store();
    let sync_element = RootElementHandle::from_raw(1);
    let default_element = RootElementHandle::from_raw(2);
    schedule_sync_update(&mut store, root_id, sync_element);
    let default_result = update_container(&mut store, root_id, default_element, None).unwrap();
    ensure_root_is_scheduled(&mut store, default_result.schedule()).unwrap();

    let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

    assert_eq!(result.records().len(), 1);
    let record = &result.records()[0];
    assert_eq!(record.render_lanes(), Lanes::SYNC);
    assert_eq!(record.applied_update_count(), 1);
    assert_eq!(record.skipped_update_count(), 1);
    assert_eq!(record.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(record.pending_lanes(), Lanes::DEFAULT);
    assert!(record.has_remaining_work());
    assert_eq!(current_host_root_element(&store, root_id), sync_element);
    assert!(
        store
            .root(root_id)
            .unwrap()
            .lanes()
            .pending_lanes()
            .contains_lane(Lane::DEFAULT)
    );
    assert!(
        !store
            .root(root_id)
            .unwrap()
            .lanes()
            .pending_lanes()
            .contains_lane(Lane::SYNC)
    );

    let current = store.root(root_id).unwrap().current();
    let current_queue = store.fiber_arena().get(current).unwrap().update_queue();
    let rebased = store.update_queues().base_updates(current_queue).unwrap();
    assert_eq!(rebased.len(), 1);
    assert_eq!(
        store.update_queues().update(rebased[0]).unwrap().lane(),
        Lanes::DEFAULT
    );
}

#[test]
fn sync_flush_does_not_call_host_operations() {
    let (mut store, root_id, host) = root_store();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(99));

    let result = flush_sync_commit_work_on_all_roots(&mut store).unwrap();

    assert_eq!(result.records().len(), 1);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
