use super::*;

#[test]
fn root_work_loop_default_host_root_update_writes_element_to_wip_state() {
    let (mut store, root_id, _host) = root_store();
    let element = RootElementHandle::from_raw(42);
    update_container(&mut store, root_id, element, None).unwrap();

    let record = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let work_state = store
        .host_root_states()
        .get(
            store
                .fiber_arena()
                .get(record.work_in_progress())
                .unwrap()
                .memoized_state(),
        )
        .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(record.render_lanes(), Lanes::DEFAULT);
    assert_eq!(record.resulting_element(), element);
    assert_eq!(record.applied_update_count(), 1);
    assert_eq!(record.skipped_update_count(), 0);
    assert_eq!(record.remaining_lanes(), Lanes::NO);
    assert_eq!(work_state.element(), element);
    assert_eq!(
        record.work_in_progress_update_queue(),
        store
            .fiber_arena()
            .get(record.work_in_progress())
            .unwrap()
            .update_queue()
    );
}

#[test]
fn root_work_loop_hands_completed_host_root_render_to_finished_work_commit_metadata() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, RootElementHandle::from_raw(43), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let metadata = handoff_completed_host_root_render_to_finished_work_commit_metadata_for_canary(
        &mut store, render, 1,
    )
    .unwrap();

    assert_eq!(metadata.root(), root_id);
    assert_eq!(metadata.previous_current(), current);
    assert_eq!(metadata.finished_work(), render.finished_work());
    assert_eq!(metadata.render_lanes(), Lanes::DEFAULT);
    assert_eq!(metadata.root_finished_work_before_handoff(), None);
    assert_eq!(metadata.root_finished_lanes_before_handoff(), Lanes::NO);
    assert_eq!(
        metadata.root_finished_work_after_handoff(),
        Some(render.finished_work())
    );
    assert_eq!(metadata.root_finished_lanes_after_handoff(), Lanes::DEFAULT);
    assert!(metadata.records_completed_render_as_root_finished_work());
    assert!(metadata.host_mutation_blocked());
    assert!(metadata.public_root_rendering_blocked());

    let pending = metadata.pending_commit();
    assert_eq!(pending.pending_work(), Some(render.finished_work()));
    assert_eq!(pending.root_finished_work(), Some(render.finished_work()));
    assert_eq!(pending.finished_work(), render.finished_work());
    assert_eq!(pending.root_finished_lanes(), Lanes::DEFAULT);
    assert_eq!(pending.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(
        pending.render_exit_status(),
        RootRenderExitStatus::Completed
    );
    assert_eq!(pending.handoff_order(), 1);
    assert!(pending.records_finished_work());
    assert!(pending.records_root_finished_work());

    let root_after_handoff = store.root(root_id).unwrap();
    assert_eq!(root_after_handoff.current(), current);
    assert_eq!(
        root_after_handoff.finished_work(),
        Some(render.finished_work())
    );
    assert_eq!(root_after_handoff.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(
        root_after_handoff.scheduling().work_in_progress(),
        Some(render.work_in_progress())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());

    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        render,
        Some(pending),
        2,
    )
    .unwrap();

    assert!(handoff.proves_private_finished_work_commit_execution());
    assert!(handoff.proves_private_root_finished_work_commit_metadata_handoff());
    assert_eq!(handoff.current_after_commit(), render.finished_work());
    assert_eq!(handoff.finished_work_after_commit(), None);
    assert_eq!(handoff.finished_lanes_after_commit(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_work_loop_finished_work_metadata_handoff_rejects_stale_render_records() {
    let (mut missing_store, missing_root, missing_host) = root_store();
    let missing_current = missing_store.root(missing_root).unwrap().current();
    update_container(
        &mut missing_store,
        missing_root,
        RootElementHandle::from_raw(43_100),
        None,
    )
    .unwrap();
    let missing_render =
        render_host_root_for_lanes(&mut missing_store, missing_root, Lanes::DEFAULT).unwrap();
    missing_store
        .root_mut(missing_root)
        .unwrap()
        .scheduling_mut()
        .clear_render_phase_work();

    let missing_error =
        handoff_completed_host_root_render_to_finished_work_commit_metadata_for_canary(
            &mut missing_store,
            missing_render,
            10,
        )
        .unwrap_err();

    assert_eq!(
        missing_error,
        HostRootRenderFinishedWorkCommitMetadataHandoffError::RenderPhaseWorkMismatch {
            root: missing_root,
            expected: None,
            actual: missing_render.work_in_progress(),
        }
    );
    assert_eq!(
        missing_store.root(missing_root).unwrap().current(),
        missing_current
    );
    assert_eq!(
        missing_store.root(missing_root).unwrap().finished_work(),
        None
    );
    assert_eq!(
        missing_store.root(missing_root).unwrap().finished_lanes(),
        Lanes::NO
    );
    assert_eq!(missing_host.operations(), Vec::<&'static str>::new());

    let (mut lane_store, lane_root, lane_host) = root_store();
    let lane_current = lane_store.root(lane_root).unwrap().current();
    update_container(
        &mut lane_store,
        lane_root,
        RootElementHandle::from_raw(43_101),
        None,
    )
    .unwrap();
    let lane_render =
        render_host_root_for_lanes(&mut lane_store, lane_root, Lanes::DEFAULT).unwrap();
    let stale_lane_render = HostRootRenderPhaseRecord {
        render_lanes: Lanes::SYNC,
        ..lane_render
    };

    let lane_error =
        handoff_completed_host_root_render_to_finished_work_commit_metadata_for_canary(
            &mut lane_store,
            stale_lane_render,
            11,
        )
        .unwrap_err();

    assert_eq!(
        lane_error,
        HostRootRenderFinishedWorkCommitMetadataHandoffError::RenderPhaseLanesMismatch {
            root: lane_root,
            expected: Lanes::DEFAULT,
            actual: Lanes::SYNC,
        }
    );
    assert_eq!(lane_store.root(lane_root).unwrap().current(), lane_current);
    assert_eq!(lane_store.root(lane_root).unwrap().finished_work(), None);
    assert_eq!(
        lane_store.root(lane_root).unwrap().finished_lanes(),
        Lanes::NO
    );
    assert_eq!(lane_host.operations(), Vec::<&'static str>::new());

    let (mut incomplete_store, incomplete_root, incomplete_host) = root_store();
    let incomplete_current = incomplete_store.root(incomplete_root).unwrap().current();
    update_container(
        &mut incomplete_store,
        incomplete_root,
        RootElementHandle::from_raw(43_102),
        None,
    )
    .unwrap();
    let incomplete_render =
        render_host_root_for_lanes(&mut incomplete_store, incomplete_root, Lanes::DEFAULT).unwrap();
    incomplete_store
        .root_mut(incomplete_root)
        .unwrap()
        .scheduling_mut()
        .record_render_phase_work(
            incomplete_render.work_in_progress(),
            Lanes::DEFAULT,
            RootRenderExitStatus::Incomplete,
        );

    let incomplete_error =
        handoff_completed_host_root_render_to_finished_work_commit_metadata_for_canary(
            &mut incomplete_store,
            incomplete_render,
            12,
        )
        .unwrap_err();

    assert_eq!(
        incomplete_error,
        HostRootRenderFinishedWorkCommitMetadataHandoffError::RenderPhaseNotCompleted {
            root: incomplete_root,
            status: RootRenderExitStatus::Incomplete,
        }
    );
    assert_eq!(
        incomplete_store.root(incomplete_root).unwrap().current(),
        incomplete_current
    );
    assert_eq!(
        incomplete_store
            .root(incomplete_root)
            .unwrap()
            .finished_work(),
        None
    );
    assert_eq!(
        incomplete_store
            .root(incomplete_root)
            .unwrap()
            .finished_lanes(),
        Lanes::NO
    );
    assert_eq!(incomplete_host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_work_loop_lane_priority_canary_records_sync_and_default_without_callbacks() {
    let (mut store, root_id, host) = root_store();
    let default =
        update_container(&mut store, root_id, RootElementHandle::from_raw(5351), None).unwrap();
    validate_update_container_lane_diagnostics_for_canary(&store, &default).unwrap();

    let sync = update_container_sync(&mut store, root_id, RootElementHandle::from_raw(5352), None)
        .unwrap();
    validate_update_container_lane_diagnostics_for_canary(&store, &sync).unwrap();

    let sync_and_default = Lanes::SYNC.merge(Lanes::DEFAULT);
    assert_eq!(default.lane(), Lane::DEFAULT);
    assert_eq!(default.event_priority(), EventPriority::DEFAULT);
    assert_eq!(
        default.source_priority(),
        RootUpdateLaneSourcePriority::DefaultEventPriority
    );
    assert_eq!(default.pending_lanes_before_enqueue(), Lanes::NO);
    assert_eq!(default.pending_lanes_after_enqueue(), Lanes::DEFAULT);
    assert_eq!(default.selected_next_lanes(), Lanes::DEFAULT);

    assert_eq!(sync.lane(), Lane::SYNC);
    assert_eq!(sync.event_priority(), EventPriority::DISCRETE);
    assert_eq!(
        sync.source_priority(),
        RootUpdateLaneSourcePriority::ExplicitSync
    );
    assert_eq!(sync.pending_lanes_before_enqueue(), Lanes::DEFAULT);
    assert_eq!(sync.pending_lanes_after_enqueue(), sync_and_default);
    assert_eq!(sync.selected_next_lanes(), sync_and_default);

    assert_ne!(default.lane(), sync.lane());
    assert_ne!(default.event_priority(), sync.event_priority());
    assert_ne!(default.source_priority(), sync.source_priority());
    assert_ne!(default.selected_next_lanes(), sync.selected_next_lanes());
    assert!(default.callback_scheduling_blocked());
    assert!(default.callback_execution_blocked());
    assert!(!default.public_batching_compatibility_claimed());
    assert!(sync.callback_scheduling_blocked());
    assert!(sync.callback_execution_blocked());
    assert!(!sync.public_batching_compatibility_claimed());
    assert_eq!(store.root_scheduler().first_scheduled_root(), None);
    assert_eq!(store.root_scheduler().last_scheduled_root(), None);
    assert!(!store.root_scheduler().did_schedule_microtask());
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert!(store.scheduler_bridge().act_queue_requests().is_empty());
    assert!(store.scheduler_bridge().microtask_requests().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_work_loop_lane_priority_diagnostics_fail_closed_for_stale_queue_evidence() {
    let (mut store, root_id, _host) = root_store();
    let result =
        update_container(&mut store, root_id, RootElementHandle::from_raw(5353), None).unwrap();
    validate_update_container_lane_diagnostics_for_canary(&store, &result).unwrap();

    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let error = validate_update_container_lane_diagnostics_for_canary(&store, &result).unwrap_err();
    assert_eq!(render.applied_update_count(), 1);
    assert_eq!(
        error,
        RootUpdateError::StaleQueueEvidence {
            root: root_id,
            queue: result.queue(),
            update: result.update(),
            expected_pending_lanes: Lanes::DEFAULT,
            actual_pending_lanes: Lanes::DEFAULT
        }
    );
}

#[test]
fn root_work_loop_refreshes_wip_queue_from_current_on_later_render() {
    let (mut store, root_id, _host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(1), None).unwrap();
    let first = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let current = store.root(root_id).unwrap().current();
    let first_wip = first.work_in_progress();
    let first_wip_queue = first.work_in_progress_update_queue();

    update_container(&mut store, root_id, RootElementHandle::from_raw(2), None).unwrap();
    let second = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let second_state = store
        .host_root_states()
        .get(second.memoized_state())
        .unwrap();

    assert_eq!(second.work_in_progress(), first_wip);
    assert_ne!(second.work_in_progress_update_queue(), first_wip_queue);
    assert_eq!(second.resulting_element(), RootElementHandle::from_raw(2));
    assert_eq!(second_state.element(), RootElementHandle::from_raw(2));
    assert_eq!(second.applied_update_count(), 2);
    assert_eq!(second.skipped_update_count(), 0);
    assert_eq!(second.remaining_lanes(), Lanes::NO);
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(
        current_host_root_element(&store, root_id),
        RootElementHandle::NONE
    );
}

#[test]
fn root_work_loop_leaves_current_state_and_root_current_unchanged() {
    let (mut store, root_id, _host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let current_state = store.fiber_arena().get(current).unwrap().memoized_state();
    update_container(&mut store, root_id, RootElementHandle::from_raw(10), None).unwrap();

    let record = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_ne!(record.work_in_progress(), current);
    assert_eq!(
        store.fiber_arena().get(current).unwrap().memoized_state(),
        current_state
    );
    assert_eq!(
        store
            .host_root_states()
            .get(current_state)
            .unwrap()
            .element(),
        RootElementHandle::NONE
    );
}

#[test]
fn root_work_loop_skipped_lanes_remain_in_queue_and_render_result() {
    let (mut store, root_id, _host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(11), None).unwrap();

    let record = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
    let rebased = store
        .update_queues()
        .base_updates(record.work_in_progress_update_queue())
        .unwrap();

    assert_eq!(record.applied_update_count(), 0);
    assert_eq!(record.skipped_update_count(), 1);
    assert_eq!(record.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(
        current_host_root_element(&store, root_id),
        RootElementHandle::NONE
    );
    assert_eq!(rebased.len(), 1);
    assert_eq!(
        store.update_queues().update(rebased[0]).unwrap().lane(),
        Lanes::DEFAULT
    );
    assert!(
        store
            .root(root_id)
            .unwrap()
            .lanes()
            .pending_lanes()
            .contains_lane(Lane::DEFAULT)
    );
}

#[test]
fn root_work_loop_stale_scheduler_callback_is_reported_without_rendering() {
    let (mut store, root_id, _host) = root_store();
    let stale_node = scheduled_callback_node(&mut store, root_id);
    let sync_result =
        update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
    ensure_root_is_scheduled(&mut store, sync_result.schedule()).unwrap();
    process_root_schedule_in_microtask(&mut store).unwrap();
    let current = store.root(root_id).unwrap().current();

    let result =
        render_host_root_via_scheduler_callback(&mut store, root_id, stale_node, Lanes::DEFAULT)
            .unwrap();

    assert_eq!(
        result.status(),
        SchedulerCallbackRenderStatus::StaleCallback
    );
    assert!(result.validation().is_stale());
    assert_eq!(result.validation().requested_callback_node(), stale_node);
    assert_eq!(result.render_phase(), None);
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.fiber_arena().get(current).unwrap().alternate(), None);
}

#[test]
fn root_work_loop_matching_scheduler_callback_reaches_host_root_processing() {
    let (mut store, root_id, _host) = root_store();
    let callback_node = scheduled_callback_node(&mut store, root_id);

    let result =
        render_host_root_via_scheduler_callback(&mut store, root_id, callback_node, Lanes::DEFAULT)
            .unwrap();
    let render = result.render_phase().unwrap();

    assert_eq!(result.status(), SchedulerCallbackRenderStatus::Rendered);
    assert!(!result.validation().is_stale());
    assert_eq!(render.applied_update_count(), 1);
    assert_eq!(render.resulting_element(), RootElementHandle::from_raw(1));
}

#[test]
fn root_work_loop_preflight_reports_host_root_wip_without_child() {
    let (mut store, root_id, _host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(17), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let mut registry = TestFunctionComponentRegistry::default();

    let record = preflight_host_root_child_begin_work(
        &mut store,
        root_id,
        render.work_in_progress(),
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(record.child(), None);
    assert_eq!(record.child_tag(), None);
    assert_eq!(record.render_lanes(), Lanes::DEFAULT);
    assert!(!record.requires_begin_work());
    assert_eq!(record.begin_work(), None);
    assert!(registry.calls().is_empty());
}

#[test]
fn root_work_loop_preflight_delegates_function_component_child_to_begin_work() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, RootElementHandle::from_raw(18), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (current_child, child_work_in_progress, component) =
        attach_function_component_wip_child(&mut store, render.work_in_progress());
    let output = FunctionComponentOutputHandle::from_raw(701);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));

    let record = preflight_host_root_child_begin_work(
        &mut store,
        root_id,
        render.work_in_progress(),
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let begin_work_record = record.begin_work().unwrap().function_component();

    assert_eq!(record.root(), root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(record.child(), Some(child_work_in_progress));
    assert_eq!(record.child_tag(), Some(FiberTag::FunctionComponent));
    assert_eq!(record.render_lanes(), Lanes::DEFAULT);
    assert!(record.requires_begin_work());
    assert_eq!(begin_work_record.current(), Some(current_child));
    assert_eq!(begin_work_record.work_in_progress(), child_work_in_progress);
    assert_eq!(begin_work_record.render_lanes(), Lanes::DEFAULT);
    assert_eq!(begin_work_record.output(), output);
    assert_eq!(begin_work_record.render().component(), component);
    assert_eq!(
        begin_work_record.render().props(),
        PropsHandle::from_raw(502)
    );
    assert_eq!(registry.calls().len(), 1);
    let call = registry.calls()[0];
    assert_eq!(call.fiber(), child_work_in_progress);
    assert_eq!(call.component(), component);
    assert_eq!(call.props(), PropsHandle::from_raw(502));
    assert_eq!(call.render_lanes(), Lanes::DEFAULT);

    let child_node = store.fiber_arena().get(child_work_in_progress).unwrap();
    assert_eq!(child_node.memoized_props(), PropsHandle::from_raw(502));
    assert_eq!(child_node.memoized_state(), StateHandle::NONE);
    assert_eq!(child_node.update_queue(), UpdateQueueHandle::NONE);
    assert_eq!(child_node.lanes(), Lanes::NO);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
}
