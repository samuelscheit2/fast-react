use super::*;

#[test]
fn sync_flush_act_root_execution_path_uses_scheduler_and_commit_evidence() {
    let (mut store, root_id, host) = root_store();
    let sync_element = RootElementHandle::from_raw(66_150);
    let default_element = RootElementHandle::from_raw(66_151);
    let previous_current = store.root(root_id).unwrap().current();
    store.scheduler_bridge_mut().enter_act_scope();
    schedule_sync_update(&mut store, root_id, sync_element);
    let default_update = update_container(&mut store, root_id, default_element, None).unwrap();
    ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();

    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    let render_phase = rendered_record.render_phase();

    let routed =
        SyncFlushRootRecord::commit_rendered_sync_flush_act_record_through_root_execution_evidence_for_canary(
            &mut store,
            rendered_record,
            RootSchedulerCallbackHandle::NONE,
        )
        .unwrap();

    assert!(routed.routed_private_sync_flush_act_path());
    assert!(routed.accepted_root_scheduler_execution_evidence());
    assert!(routed.accepted_root_commit_execution_evidence());
    assert!(!routed.public_act_compatibility_claimed());
    assert!(!routed.public_flush_sync_compatibility_claimed());
    let root_execution = routed.root_scheduler_execution();
    assert_eq!(
        root_execution.status(),
        RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted
    );
    assert_eq!(root_execution.root(), root_id);
    assert_eq!(root_execution.handoff(), rendered_record);
    assert_eq!(root_execution.handoff_lanes(), Lanes::SYNC);
    assert_eq!(root_execution.selected_lanes(), Lanes::SYNC);
    assert!(root_execution.routed_through_root_scheduler_and_commit_evidence_for_canary());
    let handoff = root_execution.root_commit_handoff_for_canary().unwrap();
    assert!(handoff.proves_private_root_finished_work_commit_metadata_handoff());
    assert_eq!(handoff.pending().previous_current(), previous_current);
    assert_eq!(
        handoff.pending().root_finished_work(),
        Some(render_phase.finished_work())
    );
    assert!(handoff.execution_request().records_root_finished_work());
    assert_eq!(
        handoff.pending().finished_work(),
        render_phase.finished_work()
    );

    let sync_flush = routed.sync_flush_record().unwrap();
    assert_eq!(sync_flush.root(), root_id);
    assert_eq!(sync_flush.order(), rendered_record.order());
    assert_eq!(sync_flush.render_lanes(), Lanes::SYNC);
    assert_eq!(sync_flush.commit().previous_current(), previous_current);
    assert_eq!(sync_flush.commit().current(), render_phase.finished_work());
    assert_eq!(
        sync_flush
            .act_continuation
            .as_ref()
            .unwrap()
            .continuation_lanes(),
        Lanes::DEFAULT
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render_phase.finished_work()
    );
    assert_eq!(current_host_root_element(&store, root_id), sync_element);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::DEFAULT
    );
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_act_private_execution_drains_pending_continuation_after_canary() {
    let (mut store, root_id, host) = root_store();
    let sync_element = RootElementHandle::from_raw(820);
    let default_element = RootElementHandle::from_raw(821);
    store.scheduler_bridge_mut().enter_act_scope();
    schedule_sync_update(&mut store, root_id, sync_element);
    let default_update = update_container(&mut store, root_id, default_element, None).unwrap();
    ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();

    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    let render_phase = rendered_record.render_phase();
    let prepared = prepare_test_renderer_host_output_canary_fibers(
        &mut store,
        render_phase,
        TestRendererHostOutputCanaryFixture::new(822, 823, 824),
    )
    .unwrap();
    let completed =
        finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 825, 826).unwrap();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

    let (mut committed, diagnostics) =
        SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
            &mut store,
            rendered_record,
        )
        .unwrap();

    let continuation = committed.act_continuation.unwrap();
    assert_eq!(
        continuation.status(),
        SchedulerActContinuationStatus::PendingContinuation
    );
    assert_eq!(continuation.continuation_lanes(), Lanes::DEFAULT);

    let private_execution =
        committed.drain_accepted_act_continuations_after_host_output_canary(diagnostics);

    assert_eq!(private_execution.root(), root_id);
    assert_eq!(private_execution.order(), committed.order());
    assert!(private_execution.host_output_canary_committed());
    assert!(!private_execution.blocked_by_pending_post_passive_gate());
    assert_eq!(private_execution.drained_count(), 1);
    assert!(private_execution.did_drain_accepted_internal_act_continuations());
    assert!(!private_execution.drains_public_react_act_queue());
    assert!(!private_execution.public_act_compatibility_claimed());
    assert!(!private_execution.public_flush_sync_compatibility_claimed());
    assert!(!private_execution.public_scheduler_timing_compatibility_claimed());
    assert!(!private_execution.executes_queued_work());
    assert!(!private_execution.executes_effects());
    let drained = private_execution.drained_act_continuations()[0];
    assert_eq!(drained.root(), root_id);
    assert_eq!(drained.sync_flush_order(), committed.order());
    assert_eq!(drained.flushed_lanes(), Lanes::SYNC);
    assert_eq!(drained.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(drained.continuation_lanes(), Lanes::DEFAULT);
    assert_eq!(drained.act_scope_depth(), 1);
    assert!(!drained.nested_act_scope());
    assert!(drained.host_output_canary_committed());
    assert_eq!(
        drained.source_status(),
        SchedulerActContinuationStatus::PendingContinuation
    );
    assert!(drained.is_accepted_internal_act_continuation());
    assert!(!drained.public_flush_sync_compatibility_claimed());
    assert_eq!(committed.act_continuation, None);
    assert_eq!(committed.act_post_passive_continuation_gate, None);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        completed.host_root()
    );
    assert_eq!(current_host_root_element(&store, root_id), sync_element);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::DEFAULT
    );
    assert_eq!(
        store.scheduler_bridge().act_queue_requests().len(),
        act_queue_request_count
    );
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_scheduler_bridge_executes_drained_act_continuation_after_canary() {
    let (mut store, root_id, host) = root_store();
    let sync_element = RootElementHandle::from_raw(827);
    let default_element = RootElementHandle::from_raw(828);
    store.scheduler_bridge_mut().enter_act_scope();
    schedule_sync_update(&mut store, root_id, sync_element);
    let default_update = update_container(&mut store, root_id, default_element, None).unwrap();
    ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();

    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    let render_phase = rendered_record.render_phase();
    let prepared = prepare_test_renderer_host_output_canary_fibers(
        &mut store,
        render_phase,
        TestRendererHostOutputCanaryFixture::new(829, 840, 841),
    )
    .unwrap();
    finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 842, 843).unwrap();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

    let (mut committed, diagnostics) =
        SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
            &mut store,
            rendered_record,
        )
        .unwrap();
    let private_execution =
        committed.drain_accepted_act_continuations_after_host_output_canary(diagnostics);

    assert_eq!(private_execution.drained_count(), 1);
    assert!(!private_execution.executes_queued_work());
    assert_eq!(current_host_root_element(&store, root_id), sync_element);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::DEFAULT
    );

    let continuation_execution = private_execution
        .execute_accepted_scheduler_bridge_act_continuations(&mut store)
        .unwrap();

    assert_eq!(continuation_execution.records().len(), 1);
    assert_eq!(continuation_execution.executed_count(), 1);
    assert_eq!(continuation_execution.rejected_count(), 0);
    assert_eq!(continuation_execution.blocked_count(), 0);
    assert!(continuation_execution.did_execute_accepted_internal_act_continuations());
    assert!(continuation_execution.records_preserve_sync_flush_order());
    assert!(!continuation_execution.drains_public_react_act_queue());
    assert!(!continuation_execution.public_act_compatibility_claimed());
    assert!(!continuation_execution.public_flush_sync_compatibility_claimed());
    assert!(!continuation_execution.public_scheduler_timing_compatibility_claimed());
    assert!(!continuation_execution.executes_effects());
    let record = &continuation_execution.records()[0];
    assert_eq!(record.execution_order(), 0);
    assert_eq!(
        record.status(),
        SchedulerBridgeActContinuationExecutionStatus::RenderedAndCommitted
    );
    assert_eq!(record.root(), root_id);
    assert_eq!(record.requested_lanes(), Lanes::DEFAULT);
    assert_eq!(record.selected_lanes(), Lanes::DEFAULT);
    assert_eq!(record.pending_lanes_before_execution(), Lanes::DEFAULT);
    assert_eq!(record.pending_lanes_after_execution(), Lanes::NO);
    assert!(record.consumed_continuation_lanes_and_preserved_remaining_lanes_for_canary());
    assert!(record.routed_through_root_scheduler_and_commit_evidence_for_canary());
    assert!(record.accepted_root_scheduler_execution_evidence_for_canary());
    assert!(record.accepted_root_commit_execution_evidence_for_canary());
    let handoff = record.root_commit_handoff_for_canary().unwrap();
    assert!(handoff.proves_private_root_finished_work_commit_metadata_handoff());
    assert_eq!(handoff.pending().root(), root_id);
    assert_eq!(
        handoff.pending().root_finished_work(),
        Some(handoff.pending().finished_work())
    );
    assert_eq!(handoff.pending().render_lanes(), Lanes::DEFAULT);
    assert!(handoff.execution_request().records_root_finished_work());
    assert_eq!(
        record.render_phase().unwrap().resulting_element(),
        default_element
    );
    assert_eq!(record.commit().unwrap().finished_lanes(), Lanes::DEFAULT);
    assert_eq!(record.commit().unwrap().remaining_lanes(), Lanes::NO);
    assert_eq!(current_host_root_element(&store, root_id), default_element);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert!(!store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(
        store.scheduler_bridge().act_queue_requests().len(),
        act_queue_request_count
    );
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_act_queue_helper_routes_drained_continuation_and_consumes_root_schedule() {
    let (mut store, root_id, host) = root_store();
    let sync_element = RootElementHandle::from_raw(844);
    let default_element = RootElementHandle::from_raw(845);
    store.scheduler_bridge_mut().enter_act_scope();
    schedule_sync_update(&mut store, root_id, sync_element);
    let default_update = update_container(&mut store, root_id, default_element, None).unwrap();
    ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();

    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    let render_phase = rendered_record.render_phase();
    let prepared = prepare_test_renderer_host_output_canary_fibers(
        &mut store,
        render_phase,
        TestRendererHostOutputCanaryFixture::new(846, 847, 848),
    )
    .unwrap();
    finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 849, 850).unwrap();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

    let (mut committed, diagnostics) =
        SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
            &mut store,
            rendered_record,
        )
        .unwrap();
    let private_execution =
        committed.drain_accepted_act_continuations_after_host_output_canary(diagnostics);

    assert_eq!(private_execution.drained_count(), 1);
    assert_eq!(current_host_root_element(&store, root_id), sync_element);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::DEFAULT
    );

    let queue_execution = private_execution
        .execute_accepted_scheduler_bridge_act_queue_for_canary(&mut store, 1_000_000)
        .unwrap();

    assert_eq!(queue_execution.request_records().len(), 1);
    assert_eq!(queue_execution.consumed_request_count(), 1);
    assert_eq!(queue_execution.rejected_request_count(), 0);
    assert_eq!(queue_execution.executed_render_callback_count(), 0);
    assert!(queue_execution.did_consume_queued_act_requests());
    assert!(queue_execution.did_execute_accepted_internal_act_continuations());
    assert!(queue_execution.records_preserve_act_queue_order());
    assert!(!queue_execution.did_execute_accepted_render_callbacks());
    assert!(!queue_execution.routed_private_act_queue_requests_and_continuations_for_canary());
    assert!(!queue_execution.drains_public_react_act_queue());
    assert!(!queue_execution.public_act_compatibility_claimed());
    assert!(!queue_execution.public_root_compatibility_claimed());
    assert!(!queue_execution.public_flush_sync_compatibility_claimed());
    assert!(!queue_execution.public_scheduler_timing_compatibility_claimed());
    assert!(!queue_execution.executes_effects());

    let root_schedule = &queue_execution.request_records()[0];
    assert_eq!(root_schedule.queue_order(), 0);
    assert_eq!(
        root_schedule.status(),
        SchedulerBridgeActQueueRequestExecutionStatus::RootScheduleProcessed
    );
    assert!(root_schedule.did_process_root_schedule());
    assert_eq!(root_schedule.root_schedule().unwrap().records().len(), 1);
    assert_eq!(
        root_schedule.root_schedule().unwrap().records()[0].outcome(),
        RootTaskScheduleOutcome::NoWork
    );
    assert!(root_schedule.render_callback().is_none());
    assert!(!root_schedule.drains_public_react_act_queue());
    assert!(!root_schedule.public_act_compatibility_claimed());
    assert!(!root_schedule.public_root_compatibility_claimed());
    assert!(!root_schedule.public_scheduler_timing_compatibility_claimed());
    assert!(!root_schedule.executes_effects());

    let continuation_execution = queue_execution.continuation_execution().unwrap();
    assert_eq!(continuation_execution.records().len(), 1);
    assert_eq!(continuation_execution.executed_count(), 1);
    assert_eq!(continuation_execution.rejected_count(), 0);
    assert_eq!(continuation_execution.blocked_count(), 0);
    assert!(continuation_execution.did_execute_accepted_internal_act_continuations());
    assert!(continuation_execution.records_preserve_sync_flush_order());
    let continuation = &continuation_execution.records()[0];
    assert_eq!(
        continuation.status(),
        SchedulerBridgeActContinuationExecutionStatus::RenderedAndCommitted
    );
    assert!(continuation.routed_through_root_scheduler_and_commit_evidence_for_canary());
    assert_eq!(
        continuation.render_phase().unwrap().resulting_element(),
        default_element
    );
    assert_eq!(current_host_root_element(&store, root_id), default_element);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert_eq!(
        store.scheduler_bridge().act_queue_consumed_request_count(),
        act_queue_request_count
    );
    assert_eq!(
        store.scheduler_bridge().pending_act_queue_request_count(),
        0
    );
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_nested_act_root_continuations_preserve_callback_order_and_lanes() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let host = RecordingHost::default();
    let first = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let second = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let first_sync_element = RootElementHandle::from_raw(850);
    let first_default_element = RootElementHandle::from_raw(851);
    let first_transition_element = RootElementHandle::from_raw(852);
    let second_sync_element = RootElementHandle::from_raw(853);
    let second_default_element = RootElementHandle::from_raw(854);
    let first_sync_callback = RootUpdateCallbackHandle::from_raw(855);
    let first_default_callback = RootUpdateCallbackHandle::from_raw(856);
    let second_sync_callback = RootUpdateCallbackHandle::from_raw(857);
    let second_default_callback = RootUpdateCallbackHandle::from_raw(858);

    let enter_outer = store.scheduler_bridge_mut().enter_act_scope();
    let enter_nested = store.scheduler_bridge_mut().enter_act_scope();
    let first_sync = update_container_sync(
        &mut store,
        first,
        first_sync_element,
        Some(first_sync_callback),
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, first_sync.schedule()).unwrap();
    let first_default = update_container(
        &mut store,
        first,
        first_default_element,
        Some(first_default_callback),
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, first_default.schedule()).unwrap();
    let first_transition = update_container_transition_for_canary(
        &mut store,
        first,
        Lane::TRANSITION_1,
        first_transition_element,
        None,
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, first_transition.schedule()).unwrap();
    let second_sync = update_container_sync(
        &mut store,
        second,
        second_sync_element,
        Some(second_sync_callback),
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, second_sync.schedule()).unwrap();
    let second_default = update_container(
        &mut store,
        second,
        second_default_element,
        Some(second_default_callback),
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, second_default.schedule()).unwrap();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

    assert_eq!(rendered.records().len(), 2);
    assert_eq!(rendered.records()[0].root(), first);
    assert_eq!(rendered.records()[1].root(), second);
    assert_eq!(rendered.records()[0].order(), 0);
    assert_eq!(rendered.records()[1].order(), 1);

    let first_render_phase = rendered.records()[0].render_phase();
    let second_render_phase = rendered.records()[1].render_phase();
    let first_prepared = prepare_test_renderer_host_output_canary_fibers(
        &mut store,
        first_render_phase,
        TestRendererHostOutputCanaryFixture::new(859, 860, 861),
    )
    .unwrap();
    let first_completed =
        finish_test_renderer_host_output_canary_fibers(&mut store, first_prepared, 862, 863)
            .unwrap();
    let second_prepared = prepare_test_renderer_host_output_canary_fibers(
        &mut store,
        second_render_phase,
        TestRendererHostOutputCanaryFixture::new(864, 865, 866),
    )
    .unwrap();
    let second_completed =
        finish_test_renderer_host_output_canary_fibers(&mut store, second_prepared, 867, 868)
            .unwrap();

    let (mut first_committed, first_diagnostics) =
        SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
            &mut store,
            rendered.records()[0],
        )
        .unwrap();
    let (mut second_committed, second_diagnostics) =
        SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
            &mut store,
            rendered.records()[1],
        )
        .unwrap();

    assert_eq!(first_committed.order(), 0);
    assert_eq!(second_committed.order(), 1);
    assert_eq!(
        callback_handles(first_committed.root_update_callbacks().visible()),
        vec![first_sync_callback]
    );
    assert_eq!(
        callback_handles(second_committed.root_update_callbacks().visible()),
        vec![second_sync_callback]
    );
    assert_eq!(
        first_committed
            .act_continuation
            .as_ref()
            .unwrap()
            .act_scope_depth(),
        2
    );
    assert!(
        first_committed
            .act_continuation
            .as_ref()
            .unwrap()
            .nested_act_scope()
    );
    assert!(
        second_committed
            .act_continuation
            .as_ref()
            .unwrap()
            .nested_act_scope()
    );

    let first_private = first_committed
        .drain_accepted_act_continuations_after_host_output_canary(first_diagnostics);
    let second_private = second_committed
        .drain_accepted_act_continuations_after_host_output_canary(second_diagnostics);

    assert!(first_private.did_drain_accepted_internal_act_continuations());
    assert!(second_private.did_drain_accepted_internal_act_continuations());
    assert!(!first_private.public_act_compatibility_claimed());
    assert!(!first_private.public_flush_sync_compatibility_claimed());
    assert!(!second_private.public_act_compatibility_claimed());
    assert!(!second_private.public_flush_sync_compatibility_claimed());
    let drained = [
        first_private.drained_act_continuations()[0],
        second_private.drained_act_continuations()[0],
    ];

    let continuation_execution =
        execute_scheduler_bridge_act_continuations(&mut store, &drained).unwrap();

    assert_eq!(continuation_execution.records().len(), 2);
    assert_eq!(continuation_execution.executed_count(), 2);
    assert_eq!(continuation_execution.rejected_count(), 0);
    assert_eq!(continuation_execution.blocked_count(), 0);
    assert!(continuation_execution.did_execute_accepted_internal_act_continuations());
    assert!(continuation_execution.records_preserve_sync_flush_order());
    assert!(
        continuation_execution.preserves_nested_act_root_continuation_order_and_lanes_for_canary()
    );
    assert!(!continuation_execution.drains_public_react_act_queue());
    assert!(!continuation_execution.public_act_compatibility_claimed());
    assert!(!continuation_execution.public_flush_sync_compatibility_claimed());
    assert!(!continuation_execution.public_scheduler_timing_compatibility_claimed());
    assert!(!continuation_execution.executes_effects());

    let first_record = &continuation_execution.records()[0];
    assert_eq!(first_record.execution_order(), 0);
    assert_eq!(first_record.root(), first);
    assert_eq!(first_record.continuation().sync_flush_order(), 0);
    assert!(first_record.continuation().nested_act_scope());
    assert_eq!(first_record.requested_lanes(), Lanes::DEFAULT);
    assert_eq!(first_record.selected_lanes(), Lanes::DEFAULT);
    assert_eq!(
        first_record.pending_lanes_before_execution(),
        Lanes::DEFAULT.merge_lane(Lane::TRANSITION_1)
    );
    assert_eq!(
        first_record.pending_lanes_after_execution(),
        Lanes::from(Lane::TRANSITION_1)
    );
    assert!(first_record.consumed_continuation_lanes_and_preserved_remaining_lanes_for_canary());
    assert_eq!(
        callback_handles(
            first_record
                .commit()
                .unwrap()
                .root_update_callbacks()
                .visible()
        ),
        vec![first_default_callback]
    );
    assert_eq!(
        current_host_root_element(&store, first),
        first_default_element
    );

    let second_record = &continuation_execution.records()[1];
    assert_eq!(second_record.execution_order(), 1);
    assert_eq!(second_record.root(), second);
    assert_eq!(second_record.continuation().sync_flush_order(), 1);
    assert!(second_record.continuation().nested_act_scope());
    assert_eq!(second_record.requested_lanes(), Lanes::DEFAULT);
    assert_eq!(second_record.selected_lanes(), Lanes::DEFAULT);
    assert_eq!(
        second_record.pending_lanes_before_execution(),
        Lanes::DEFAULT
    );
    assert_eq!(second_record.pending_lanes_after_execution(), Lanes::NO);
    assert!(second_record.consumed_continuation_lanes_and_preserved_remaining_lanes_for_canary());
    assert_eq!(
        callback_handles(
            second_record
                .commit()
                .unwrap()
                .root_update_callbacks()
                .visible()
        ),
        vec![second_default_callback]
    );
    assert_eq!(
        current_host_root_element(&store, second),
        second_default_element
    );

    assert_eq!(
        store.root(first).unwrap().lanes().pending_lanes(),
        Lanes::from(Lane::TRANSITION_1)
    );
    assert_eq!(
        store.root(second).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert_eq!(
        first_completed.host_root(),
        first_committed.commit().current()
    );
    assert_eq!(
        second_completed.host_root(),
        second_committed.commit().current()
    );
    assert_eq!(
        store.scheduler_bridge().act_scope_boundary_records(),
        &[enter_outer, enter_nested]
    );
    assert_eq!(
        store.scheduler_bridge().act_queue_requests().len(),
        act_queue_request_count
    );
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_act_private_execution_requires_canary_and_passive_clearance() {
    let (mut store, root_id, host) = root_store();
    store.scheduler_bridge_mut().enter_act_scope();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(830));
    let default_update =
        update_container(&mut store, root_id, RootElementHandle::from_raw(831), None).unwrap();
    ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

    let mut committed =
        SyncFlushRootRecord::commit_rendered_sync_flush_record(&mut store, rendered.records()[0])
            .unwrap();
    let continuation_before = committed.act_continuation;
    let diagnostics = committed
        .host_output_commit_diagnostics_for_canary(&store)
        .unwrap();

    let without_canary =
        committed.drain_accepted_act_continuations_after_host_output_canary(diagnostics);

    assert!(!without_canary.host_output_canary_committed());
    assert!(!without_canary.blocked_by_pending_post_passive_gate());
    assert_eq!(without_canary.drained_count(), 0);
    assert!(!without_canary.did_drain_accepted_internal_act_continuations());
    assert_eq!(committed.act_continuation, continuation_before);

    let mut store = FiberRootStore::<RecordingHost>::new();
    let host_with_passive = RecordingHost::default();
    let passive_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    store.scheduler_bridge_mut().enter_act_scope();
    schedule_sync_update(&mut store, passive_root, RootElementHandle::from_raw(832));
    let passive_default = update_container(
        &mut store,
        passive_root,
        RootElementHandle::from_raw(833),
        None,
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, passive_default.schedule()).unwrap();
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    let render_phase = rendered_record.render_phase();
    let finished_work = render_phase.finished_work();
    {
        let scheduling = store.root_mut(passive_root).unwrap().scheduling_mut();
        scheduling.prepare_pending_passive(passive_root, Lanes::NO);
        scheduling
            .pending_passive_mut()
            .queue_mount(finished_work, Lanes::SYNC)
            .unwrap();
    }
    let prepared = prepare_test_renderer_host_output_canary_fibers(
        &mut store,
        render_phase,
        TestRendererHostOutputCanaryFixture::new(834, 835, 836),
    )
    .unwrap();
    finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 837, 838).unwrap();

    let (mut committed_with_passive, diagnostics) =
        SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
            &mut store,
            rendered_record,
        )
        .unwrap();
    let continuation_before = committed_with_passive.act_continuation;

    let blocked = committed_with_passive
        .drain_accepted_act_continuations_after_host_output_canary(diagnostics);

    assert!(blocked.host_output_canary_committed());
    assert!(blocked.blocked_by_pending_post_passive_gate());
    assert_eq!(blocked.drained_count(), 0);
    assert_eq!(committed_with_passive.act_continuation, continuation_before);
    assert!(
        committed_with_passive
            .act_post_passive_continuation_gate
            .is_some()
    );
    assert!(
        store
            .root(passive_root)
            .unwrap()
            .scheduling()
            .pending_passive()
            .has_commit_handoff()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(host_with_passive.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_handoff_records_no_act_continuation_when_act_queue_inactive() {
    let (mut store, root_id, host) = root_store();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(68));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

    let committed =
        SyncFlushRootRecord::commit_rendered_sync_flush_record(&mut store, rendered.records()[0])
            .unwrap();

    assert_eq!(committed.remaining_lanes(), Lanes::NO);
    assert_eq!(committed.act_continuation, None);
    assert_eq!(committed.act_post_passive_continuation_gate, None);
    assert!(
        store
            .scheduler_bridge()
            .act_continuation_records()
            .is_empty()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_handoff_records_nested_act_continuation_after_commit() {
    let (mut store, root_id, host) = root_store();
    let sync_element = RootElementHandle::from_raw(69);
    let default_element = RootElementHandle::from_raw(70);
    let enter_outer = store.scheduler_bridge_mut().enter_act_scope();
    let enter_nested = store.scheduler_bridge_mut().enter_act_scope();
    schedule_sync_update(&mut store, root_id, sync_element);
    let default_update = update_container(&mut store, root_id, default_element, None).unwrap();
    ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();

    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let committed =
        SyncFlushRootRecord::commit_rendered_sync_flush_record(&mut store, rendered.records()[0])
            .unwrap();

    let continuation = committed.act_continuation.unwrap();
    assert_eq!(continuation.root(), root_id);
    assert_eq!(continuation.sync_flush_order(), committed.order());
    assert_eq!(continuation.flushed_lanes(), Lanes::SYNC);
    assert_eq!(continuation.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(continuation.continuation_lanes(), Lanes::DEFAULT);
    assert_eq!(continuation.act_scope_depth(), 2);
    assert!(continuation.nested_act_scope());
    assert_eq!(
        continuation.status(),
        SchedulerActContinuationStatus::PendingContinuation
    );
    assert_eq!(
        store.scheduler_bridge().act_continuation_records(),
        &[continuation]
    );
    assert_eq!(
        store.scheduler_bridge().act_scope_boundary_records(),
        &[enter_outer, enter_nested]
    );
    assert_eq!(current_host_root_element(&store, root_id), sync_element);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert!(store.scheduler_bridge().microtask_requests().is_empty());
}

#[test]
fn sync_flush_handoff_records_post_passive_act_gate_without_flushing_effects() {
    let (mut store, root_id, host) = root_store();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(700));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let render_phase = rendered.records()[0].render_phase();
    let finished_work = render_phase.finished_work();
    store.scheduler_bridge_mut().enter_act_scope();
    let mount_order = {
        let scheduling = store.root_mut(root_id).unwrap().scheduling_mut();
        scheduling.prepare_pending_passive(root_id, Lanes::NO);
        scheduling
            .pending_passive_mut()
            .queue_mount(finished_work, Lanes::SYNC)
            .unwrap()
    };

    let committed =
        SyncFlushRootRecord::commit_rendered_sync_flush_record(&mut store, rendered.records()[0])
            .unwrap();

    let continuation = committed.act_continuation.unwrap();
    assert_eq!(
        continuation.status(),
        SchedulerActContinuationStatus::NoContinuation
    );
    let gate = committed.act_post_passive_continuation_gate.unwrap();
    assert_eq!(gate.root(), root_id);
    assert_eq!(gate.sync_flush_order(), committed.order());
    assert_eq!(gate.flushed_lanes(), Lanes::SYNC);
    assert_eq!(gate.remaining_lanes(), Lanes::NO);
    assert_eq!(gate.continuation_lanes(), Lanes::NO);
    assert_eq!(gate.pending_passive_finished_work(), finished_work);
    assert_eq!(gate.pending_passive_lanes(), Lanes::SYNC);
    assert_eq!(gate.pending_passive_unmount_count(), 0);
    assert_eq!(gate.pending_passive_mount_count(), 1);
    assert_eq!(gate.pending_passive_record_count(), 1);
    assert_eq!(gate.act_scope_depth(), 1);
    assert!(!gate.nested_act_scope());

    let handoff = committed.commit().pending_passive_handoff().unwrap();
    assert_eq!(handoff.pending_mount_count(), 1);
    let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();
    assert_eq!(pending_passive.finished_work(), Some(finished_work));
    assert!(pending_passive.has_commit_handoff());
    assert_eq!(pending_passive.passive_mounts().len(), 1);
    assert_eq!(pending_passive.passive_mounts()[0].order(), mount_order);
    assert_eq!(
        store.scheduler_bridge().act_continuation_records(),
        &[continuation]
    );
    assert!(store.scheduler_bridge().act_queue_requests().is_empty());
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_handoff_observes_post_passive_reentry_gate_without_running_effects() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let host = RecordingHost::default();
    let passive_root = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let continuation_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let continuation_current = store.root(continuation_root).unwrap().current();
    schedule_sync_update(&mut store, passive_root, RootElementHandle::from_raw(701));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let render_phase = rendered.records()[0].render_phase();
    let finished_work = render_phase.finished_work();
    {
        let scheduling = store.root_mut(passive_root).unwrap().scheduling_mut();
        scheduling.prepare_pending_passive(passive_root, Lanes::NO);
        scheduling
            .pending_passive_mut()
            .queue_mount(finished_work, Lanes::SYNC)
            .unwrap();
    }
    let committed =
        SyncFlushRootRecord::commit_rendered_sync_flush_record(&mut store, rendered.records()[0])
            .unwrap();
    schedule_sync_update(
        &mut store,
        continuation_root,
        RootElementHandle::from_raw(702),
    );
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

    let gate = committed
        .post_passive_continuation_execution_gate(&mut store, &ExecutionContextState::new())
        .unwrap()
        .unwrap();

    assert_eq!(gate.exit_status(), RootSyncFlushExitStatus::Completed);
    assert_eq!(gate.pending_passive_root(), passive_root);
    assert_eq!(gate.pending_passive_finished_work(), finished_work);
    assert_eq!(gate.pending_passive_lanes(), Lanes::SYNC);
    assert_eq!(gate.pending_passive_mount_count(), 1);
    assert_eq!(gate.continuation_roots().len(), 1);
    assert_eq!(gate.continuation_roots()[0].root(), continuation_root);
    assert_eq!(gate.continuation_roots()[0].lanes(), Lanes::SYNC);
    assert_eq!(committed.act_continuation, None);
    assert_eq!(committed.act_post_passive_continuation_gate, None);
    assert_eq!(
        store.root(continuation_root).unwrap().current(),
        continuation_current
    );
    assert_eq!(store.root(continuation_root).unwrap().finished_work(), None);
    assert!(
        store
            .root(passive_root)
            .unwrap()
            .scheduling()
            .pending_passive()
            .has_commit_handoff()
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
fn sync_flush_post_passive_continuation_executes_private_follow_up_sync_flush() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let host = RecordingHost::default();
    let passive_root = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let continuation_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let continuation_element = RootElementHandle::from_raw(704);
    schedule_sync_update(&mut store, passive_root, RootElementHandle::from_raw(703));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let render_phase = rendered.records()[0].render_phase();
    let finished_work = render_phase.finished_work();
    {
        let scheduling = store.root_mut(passive_root).unwrap().scheduling_mut();
        scheduling.prepare_pending_passive(passive_root, Lanes::NO);
        scheduling
            .pending_passive_mut()
            .queue_mount(finished_work, Lanes::SYNC)
            .unwrap();
    }
    let committed =
        SyncFlushRootRecord::commit_rendered_sync_flush_record(&mut store, rendered.records()[0])
            .unwrap();
    let handoff = committed.commit().pending_passive_handoff();
    store
        .root_mut(passive_root)
        .unwrap()
        .scheduling_mut()
        .clear_pending_passive();
    schedule_sync_update(&mut store, continuation_root, continuation_element);
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

    let continuation = flush_sync_post_passive_continuation_after_passive_effects(
        &mut store,
        &ExecutionContextState::new(),
        handoff,
    )
    .unwrap()
    .unwrap();

    assert!(continuation.did_request_follow_up_sync_flush());
    assert!(continuation.did_execute_follow_up_sync_flush());
    assert!(continuation.did_flush_follow_up_sync_work());
    assert_eq!(
        continuation.gate().exit_status(),
        RootSyncFlushExitStatus::Completed
    );
    assert_eq!(continuation.gate().pending_passive_root(), passive_root);
    assert_eq!(
        continuation.gate().pending_passive_finished_work(),
        finished_work
    );
    assert_eq!(continuation.gate().pending_passive_lanes(), Lanes::SYNC);
    assert_eq!(continuation.gate().pending_passive_mount_count(), 1);
    assert_eq!(continuation.gate().continuation_roots().len(), 1);
    assert_eq!(
        continuation.gate().continuation_roots()[0].root(),
        continuation_root
    );
    let result = continuation.sync_flush_result().unwrap();
    assert!(result.did_flush_work());
    assert_eq!(result.records().len(), 1);
    assert_eq!(result.records()[0].root(), continuation_root);
    assert_eq!(result.records()[0].render_lanes(), Lanes::SYNC);
    assert_eq!(
        current_host_root_element(&store, continuation_root),
        continuation_element
    );
    assert!(
        store
            .root(passive_root)
            .unwrap()
            .scheduling()
            .pending_passive()
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
fn sync_flush_post_passive_continuation_requires_passive_handoff() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(705));

    let continuation = flush_sync_post_passive_continuation_after_passive_effects(
        &mut store,
        &ExecutionContextState::new(),
        None,
    )
    .unwrap();

    assert_eq!(continuation, None);
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert!(store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_handoff_records_active_act_boundary_without_pending_continuation() {
    let (mut store, root_id, host) = root_store();
    store.scheduler_bridge_mut().enter_act_scope();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(71));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

    let committed =
        SyncFlushRootRecord::commit_rendered_sync_flush_record(&mut store, rendered.records()[0])
            .unwrap();

    let continuation = committed.act_continuation.unwrap();
    assert_eq!(continuation.root(), root_id);
    assert_eq!(continuation.flushed_lanes(), Lanes::SYNC);
    assert_eq!(continuation.remaining_lanes(), Lanes::NO);
    assert_eq!(continuation.continuation_lanes(), Lanes::NO);
    assert_eq!(continuation.act_scope_depth(), 1);
    assert!(!continuation.nested_act_scope());
    assert_eq!(
        continuation.status(),
        SchedulerActContinuationStatus::NoContinuation
    );
    assert_eq!(
        store.scheduler_bridge().act_continuation_records(),
        &[continuation]
    );
    assert_eq!(committed.act_post_passive_continuation_gate, None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn sync_flush_handoff_surfaces_pending_passive_commit_metadata_without_effects() {
    let (mut store, root_id, host) = root_store();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(67));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    store
        .root_mut(root_id)
        .unwrap()
        .scheduling_mut()
        .prepare_pending_passive(root_id, Lanes::NO);

    let committed =
        SyncFlushRootRecord::commit_rendered_sync_flush_record(&mut store, rendered.records()[0])
            .unwrap();
    let handoff = committed.commit().pending_passive_handoff().unwrap();
    let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.finished_work(), committed.commit().finished_work());
    assert_eq!(handoff.lanes(), Lanes::SYNC);
    assert_eq!(
        pending_passive.finished_work(),
        Some(committed.commit().finished_work())
    );
    assert_eq!(pending_passive.lanes(), Lanes::SYNC);
    assert!(pending_passive.has_commit_handoff());
    assert!(!pending_passive.has_effects());
    assert!(pending_passive.passive_unmounts().is_empty());
    assert!(pending_passive.passive_mounts().is_empty());
    assert_eq!(committed.act_post_passive_continuation_gate, None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
