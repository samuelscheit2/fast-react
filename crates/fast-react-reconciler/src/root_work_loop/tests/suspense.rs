use super::*;

#[test]
fn root_work_loop_preflight_fails_closed_for_explicit_unsupported_child_tags() {
    let cases = [
        (
            FiberTag::Suspense,
            SUSPENSE_UNSUPPORTED_FEATURE,
            Lanes::from(Lane::RETRY_1),
        ),
        (
            FiberTag::Offscreen,
            OFFSCREEN_UNSUPPORTED_FEATURE,
            Lanes::OFFSCREEN,
        ),
        (
            FiberTag::Activity,
            ACTIVITY_UNSUPPORTED_FEATURE,
            Lanes::from(Lane::RETRY_2),
        ),
        (
            FiberTag::ViewTransition,
            VIEW_TRANSITION_UNSUPPORTED_FEATURE,
            Lanes::DEFAULT,
        ),
        (
            FiberTag::SuspenseList,
            SUSPENSE_LIST_UNSUPPORTED_FEATURE,
            Lanes::from(Lane::RETRY_3),
        ),
    ];

    for (tag, feature, render_lanes) in cases {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, RootElementHandle::from_raw(19), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let child = attach_wip_child_with_tag(&mut store, render.work_in_progress(), tag);
        let mut registry = TestFunctionComponentRegistry::default();

        let error = preflight_host_root_child_begin_work(
            &mut store,
            root_id,
            render.work_in_progress(),
            render_lanes,
            &mut registry,
        )
        .unwrap_err();

        assert_root_child_preflight_blocks_unsupported_tag(
            error,
            root_id,
            render.work_in_progress(),
            child,
            tag,
            feature,
            render_lanes,
        );
        assert!(registry.calls().is_empty());
        assert_client_root_fail_closed_without_side_effects(
            &store, &host, root_id, current, render, child,
        );
        let child_node = store.fiber_arena().get(child).unwrap();
        assert_eq!(child_node.memoized_props(), PropsHandle::NONE);
        assert_eq!(child_node.memoized_state(), StateHandle::NONE);
        assert_eq!(child_node.update_queue(), UpdateQueueHandle::NONE);
        assert_eq!(child_node.flags(), FiberFlags::NO);
    }
}

#[test]
fn root_work_loop_pinged_retry_scheduler_handoff_keeps_blocker_tags_fail_closed() {
    for (tag, feature) in [
        (FiberTag::Suspense, SUSPENSE_UNSUPPORTED_FEATURE),
        (FiberTag::Offscreen, OFFSCREEN_UNSUPPORTED_FEATURE),
        (FiberTag::Activity, ACTIVITY_UNSUPPORTED_FEATURE),
        (FiberTag::SuspenseList, SUSPENSE_LIST_UNSUPPORTED_FEATURE),
    ] {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        let callback = scheduled_pinged_retry_callback(&mut store, root_id);

        let execution = execute_scheduled_root_callback(&mut store, callback).unwrap();
        let render = execution.render_phase().unwrap();
        let child = attach_wip_child_with_tag(&mut store, render.work_in_progress(), tag);
        let mut registry = TestFunctionComponentRegistry::default();

        let error = preflight_host_root_child_begin_work(
            &mut store,
            root_id,
            render.work_in_progress(),
            render.render_lanes(),
            &mut registry,
        )
        .unwrap_err();

        assert_eq!(
            execution.status(),
            RootSchedulerCallbackExecutionStatus::Rendered
        );
        assert_eq!(execution.selected_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(render.render_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(render.applied_update_count(), 0);
        assert_eq!(render.skipped_update_count(), 1);
        assert_eq!(render.remaining_lanes(), Lanes::DEFAULT);
        assert_root_child_preflight_blocks_unsupported_tag(
            error,
            root_id,
            render.work_in_progress(),
            child,
            tag,
            feature,
            render.render_lanes(),
        );
        assert!(registry.calls().is_empty());
        assert_eq!(
            current_host_root_element(&store, root_id),
            RootElementHandle::NONE
        );
        assert_client_root_fail_closed_without_side_effects(
            &store, &host, root_id, current, render, child,
        );

        let child_node = store.fiber_arena().get(child).unwrap();
        assert_eq!(child_node.memoized_props(), PropsHandle::NONE);
        assert_eq!(child_node.memoized_state(), StateHandle::NONE);
        assert_eq!(child_node.update_queue(), UpdateQueueHandle::NONE);
        assert_eq!(child_node.flags(), FiberFlags::NO);
        assert_eq!(child_node.child(), None);
    }
}

#[test]
fn root_work_loop_pinged_retry_path_records_suspense_thenable_blocker_metadata() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let callback = scheduled_pinged_retry_callback(&mut store, root_id);

    let execution = execute_pinged_retry_root_callback(&mut store, callback).unwrap();
    let render = execution.render_phase().unwrap();
    let (suspense, primary, primary_child, fallback, fallback_child) =
        attach_suspense_wip_child_with_primary_and_fallback(&mut store, render.work_in_progress());
    let mut registry = TestFunctionComponentRegistry::default();

    let error = preflight_host_root_child_begin_work(
        &mut store,
        root_id,
        render.work_in_progress(),
        render.render_lanes(),
        &mut registry,
    )
    .unwrap_err();

    assert_eq!(execution.status(), RootPingedRetryExecutionStatus::Rendered);
    assert_eq!(execution.pinged_retry_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(
        execution.selected_priority_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(
        execution.selected_render_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(render.render_lanes(), Lanes::from(Lane::RETRY_2));

    match error {
        HostRootChildBeginWorkPreflightError::UnsupportedSuspenseChildShape {
            root,
            host_root_work_in_progress,
            suspense: record,
        } => {
            assert_eq!(root, root_id);
            assert_eq!(host_root_work_in_progress, render.work_in_progress());
            assert_eq!(record.fiber(), suspense);
            assert_eq!(record.child(), Some(primary));
            assert_eq!(record.fallback_child(), Some(fallback));
            assert_eq!(
                record.shape(),
                UnsupportedSuspenseChildShapeKind::PrimaryOffscreenWithFallback
            );
            assert_eq!(record.render_lanes(), Lanes::from(Lane::RETRY_2));

            let thenable = record.thenable_ping_blocker();
            assert_eq!(
                thenable.thenable_identity_class(),
                UnsupportedThenableIdentityClass::OpaqueWakeable
            );
            assert_eq!(thenable.ping_lane(), Lane::RETRY_2);
            assert_eq!(thenable.ping_lanes(), Lanes::from(Lane::RETRY_2));
            assert_eq!(
                thenable.retry_queue_kind(),
                UnsupportedThenableRetryQueueKind::SuspenseBoundaryAndPrimaryOffscreen
            );
            assert_eq!(thenable.retry_queue(), UpdateQueueHandle::from_raw(747));
            assert_eq!(
                thenable.primary_offscreen_retry_queue(),
                Some(UpdateQueueHandle::from_raw(748))
            );
            assert!(!thenable.schedule_retry_flag());
            assert!(thenable.primary_child_rendering_blocked());
            assert!(thenable.fallback_child_rendering_blocked());
        }
        other => panic!("expected Suspense child-shape preflight, got {other:?}"),
    }

    assert!(registry.calls().is_empty());
    assert_client_root_fail_closed_without_side_effects(
        &store, &host, root_id, current, render, suspense,
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(primary_child)
            .unwrap()
            .return_fiber(),
        Some(primary)
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(fallback_child)
            .unwrap()
            .return_fiber(),
        Some(fallback)
    );
}

#[test]
fn root_work_loop_suspense_pinged_retry_handoff_reaches_complete_work_record() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("section", "retry handoff");
    update_container(&mut store, root_id, element, None).unwrap();
    let initial_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
    assert_eq!(initial_commit.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(host.operations(), Vec::<&'static str>::new());

    let current = store.root(root_id).unwrap().current();
    let (suspense, primary, primary_child, fallback, fallback_child) =
        attach_suspense_wip_child_with_primary_and_fallback(&mut store, current);
    let suspense_record = unsupported_suspense_begin_work_record(
        store.fiber_arena(),
        BeginWorkRequest::new(suspense, Lanes::from(Lane::RETRY_2)),
    )
    .unwrap();
    {
        let lanes = store.root_mut(root_id).unwrap().lanes_mut();
        lanes.mark_updated(Lane::RETRY_2);
        lanes.mark_suspended(Lanes::from(Lane::RETRY_2), Lane::NO, true);
    }

    let request =
        request_suspense_thenable_retry_root_scheduler(&mut store, root_id, &suspense_record)
            .unwrap();
    let processed = process_root_schedule_in_microtask(&mut store).unwrap();
    let callback = processed.records()[0].scheduled_callback().unwrap();
    let render_handoff =
        execute_suspense_thenable_retry_root_render_handoff(&mut store, request, callback).unwrap();
    let execution = render_handoff.execution();
    let render = render_handoff.render_phase().unwrap();
    let handoff = handoff_completed_host_root_render_to_test_complete_work(
        &mut store, &mut host, render, &source,
    )
    .unwrap();

    assert_eq!(
        request.status(),
        SuspenseThenableRetryRootSchedulerStatus::Accepted
    );
    assert!(request.accepted());
    assert!(request.thenable_ping_scheduled_expected_retry_lane());
    assert_eq!(request.boundary(), suspense);
    assert_eq!(request.retry_queue(), UpdateQueueHandle::from_raw(747));
    assert_eq!(
        request.primary_offscreen_retry_queue(),
        Some(UpdateQueueHandle::from_raw(748))
    );
    assert_eq!(request.retry_lane(), Lane::RETRY_2);
    assert_eq!(request.pinged_lanes(), Lanes::from(Lane::RETRY_2));
    assert!(!request.public_suspense_compatibility_claimed());
    assert_eq!(
        processed.records()[0].next_lanes(),
        Lanes::from(Lane::RETRY_2)
    );

    assert_eq!(render_handoff.request(), request);
    assert_eq!(render_handoff.root(), root_id);
    assert_eq!(render_handoff.boundary(), suspense);
    assert_eq!(render_handoff.retry_lane(), Lane::RETRY_2);
    assert_eq!(render_handoff.pinged_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(render_handoff.callback(), callback);
    assert!(render_handoff.thenable_ping_scheduled_expected_retry_lane());
    assert!(render_handoff.thenable_ping_reached_expected_retry_handoff());
    assert!(render_handoff.root_work_loop_reached());
    assert!(render_handoff.proves_private_thenable_ping_render_handoff());
    assert!(!render_handoff.suspense_boundary_rendering_executed());
    assert!(!render_handoff.fallback_traversal_executed());
    assert!(!render_handoff.wakeable_subscription_performed());
    assert!(!render_handoff.public_suspense_compatibility_claimed());
    assert!(!render_handoff.public_root_compatibility_claimed());

    assert_eq!(execution.status(), RootPingedRetryExecutionStatus::Rendered);
    assert_eq!(execution.pinged_retry_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(
        execution.selected_priority_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(
        execution.selected_render_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(render.root(), root_id);
    assert_eq!(render.current(), current);
    assert_eq!(render.render_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(render.resulting_element(), element);
    assert_eq!(render.applied_update_count(), 0);
    assert_eq!(render.skipped_update_count(), 0);

    assert_eq!(handoff.root(), root_id);
    assert_eq!(
        handoff.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(handoff.root_child_tag(), Some(FiberTag::HostComponent));
    assert_eq!(handoff.render_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(handoff.resulting_element(), element);
    assert_eq!(handoff.detached_instance_count(), 1);
    assert_eq!(handoff.detached_text_count(), 1);
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(render.work_in_progress())
    );
    assert_eq!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .render_exit_status(),
        RootRenderExitStatus::Completed
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(primary_child)
            .unwrap()
            .return_fiber(),
        Some(primary)
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(fallback_child)
            .unwrap()
            .return_fiber(),
        Some(fallback)
    );
    assert_eq!(
        host.operations(),
        vec![
            "root_host_context",
            "child_host_context",
            "should_set_text_content",
            "create_text_instance",
            "create_instance",
            "append_initial_child",
            "finalize_initial_children",
        ]
    );
}

#[test]
fn root_work_loop_suspense_retry_thenable_ping_commits_private_fallback_content_handoff() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let fallback_element = source.insert_host_element_with_text("span", "loading fallback");
    let content_element = source.insert_host_element_with_text("section", "resolved content");
    update_container(&mut store, root_id, fallback_element, None).unwrap();
    let fallback_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let fallback_commit = handoff_completed_host_root_render_to_test_complete_work_and_commit(
        &mut store,
        &mut host,
        fallback_render,
        &source,
    )
    .unwrap();
    let fallback_current = store.root(root_id).unwrap().current();
    assert_eq!(fallback_commit.commit().finished_lanes(), Lanes::DEFAULT);
    assert_eq!(fallback_commit.commit().finished_work(), fallback_current);
    assert_eq!(current_host_root_element(&store, root_id), fallback_element);
    assert!(
        fallback_commit
            .finished_work_handoff()
            .proves_private_finished_work_commit_execution()
    );

    let (suspense, primary, primary_child, fallback, fallback_child) =
        attach_suspense_wip_child_with_primary_and_fallback(&mut store, fallback_current);
    let suspense_record = unsupported_suspense_begin_work_record(
        store.fiber_arena(),
        BeginWorkRequest::new(suspense, Lanes::from(Lane::RETRY_2)),
    )
    .unwrap();
    let retry_update = schedule_retry_update(&mut store, root_id, Lane::RETRY_2, content_element);
    store.root_mut(root_id).unwrap().lanes_mut().mark_suspended(
        Lanes::from(Lane::RETRY_2),
        Lane::NO,
        true,
    );

    let request =
        request_suspense_thenable_retry_root_scheduler(&mut store, root_id, &suspense_record)
            .unwrap();
    let processed = process_root_schedule_in_microtask(&mut store).unwrap();
    let schedule = processed.records()[0];
    let callback = schedule.scheduled_callback().unwrap();
    let render_handoff =
        execute_suspense_thenable_retry_root_render_handoff(&mut store, request, callback).unwrap();
    let execution = render_handoff.execution();
    let retry_render = render_handoff.render_phase().unwrap();
    let retry_commit = handoff_completed_host_root_render_to_test_complete_work_and_commit(
        &mut store,
        &mut host,
        retry_render,
        &source,
    )
    .unwrap();
    let fallback_content_commit =
        record_host_root_suspense_fallback_content_commit_handoff_for_canary(
            &store,
            retry_commit.finished_work_handoff(),
            fallback_element,
            content_element,
            Lanes::from(Lane::RETRY_2),
        )
        .unwrap();

    assert_eq!(
        suspense_record.shape(),
        UnsupportedSuspenseChildShapeKind::PrimaryOffscreenWithFallback
    );
    assert_eq!(suspense_record.child(), Some(primary));
    assert_eq!(suspense_record.fallback_child(), Some(fallback));
    assert_eq!(
        suspense_record.thenable_ping_blocker().retry_queue_kind(),
        UnsupportedThenableRetryQueueKind::SuspenseBoundaryAndPrimaryOffscreen
    );
    assert!(
        suspense_record
            .thenable_ping_blocker()
            .primary_child_rendering_blocked()
    );
    assert!(
        suspense_record
            .thenable_ping_blocker()
            .fallback_child_rendering_blocked()
    );

    assert_eq!(
        request.status(),
        SuspenseThenableRetryRootSchedulerStatus::Accepted
    );
    assert!(request.accepted());
    assert!(request.thenable_ping_scheduled_expected_retry_lane());
    assert_eq!(request.boundary(), suspense);
    assert_eq!(request.retry_queue(), UpdateQueueHandle::from_raw(747));
    assert_eq!(
        request.primary_offscreen_retry_queue(),
        Some(UpdateQueueHandle::from_raw(748))
    );
    assert_eq!(request.retry_lane(), Lane::RETRY_2);
    assert_eq!(request.pinged_lanes(), Lanes::from(Lane::RETRY_2));
    assert!(!request.suspense_boundary_rendering_executed());
    assert!(!request.fallback_traversal_executed());
    assert!(!request.wakeable_subscription_performed());
    assert!(!request.public_suspense_compatibility_claimed());
    assert_eq!(schedule.root(), root_id);
    assert_eq!(schedule.outcome(), RootTaskScheduleOutcome::Scheduled);
    assert_eq!(schedule.next_lanes(), Lanes::from(Lane::RETRY_2));

    assert_eq!(render_handoff.request(), request);
    assert_eq!(render_handoff.root(), root_id);
    assert_eq!(render_handoff.boundary(), suspense);
    assert_eq!(render_handoff.retry_lane(), Lane::RETRY_2);
    assert_eq!(render_handoff.pinged_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(render_handoff.callback(), callback);
    assert!(render_handoff.thenable_ping_scheduled_expected_retry_lane());
    assert!(render_handoff.thenable_ping_reached_expected_retry_handoff());
    assert!(render_handoff.root_work_loop_reached());
    assert!(render_handoff.proves_private_thenable_ping_render_handoff());
    assert!(!render_handoff.public_suspense_compatibility_claimed());
    assert!(!render_handoff.public_root_compatibility_claimed());

    assert_eq!(execution.status(), RootPingedRetryExecutionStatus::Rendered);
    assert_eq!(execution.pinged_retry_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(
        execution.selected_priority_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(
        execution.selected_render_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(retry_render.root(), root_id);
    assert_eq!(retry_render.current(), fallback_current);
    assert_eq!(retry_render.render_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(retry_render.resulting_element(), content_element);
    assert_eq!(retry_render.applied_update_count(), 1);
    assert_eq!(retry_render.skipped_update_count(), 0);
    assert_eq!(retry_render.remaining_lanes(), Lanes::NO);

    assert_eq!(retry_commit.complete_work().root(), root_id);
    assert_eq!(
        retry_commit.complete_work().host_root_work_in_progress(),
        retry_render.work_in_progress()
    );
    assert_eq!(
        retry_commit.complete_work().root_child_tag(),
        Some(FiberTag::HostComponent)
    );
    assert_eq!(
        retry_commit.complete_work().render_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(
        retry_commit.complete_work().resulting_element(),
        content_element
    );
    assert!(retry_commit.host_operations_unchanged_by_commit());
    assert!(retry_commit.public_render_blocked());

    let commit_handoff = retry_commit.finished_work_handoff();
    assert!(commit_handoff.proves_private_finished_work_commit_execution());
    assert_eq!(commit_handoff.pending().root(), root_id);
    assert_eq!(
        commit_handoff.pending().previous_current(),
        fallback_current
    );
    assert_eq!(
        commit_handoff.pending().finished_work(),
        retry_render.finished_work()
    );
    assert_eq!(
        commit_handoff.pending().render_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(
        commit_handoff.execution_request().render_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert!(
        commit_handoff
            .execution_request()
            .compatibility_claim_blocked()
    );

    assert_eq!(retry_commit.commit().root(), root_id);
    assert_eq!(retry_commit.commit().previous_current(), fallback_current);
    assert_eq!(
        retry_commit.commit().current(),
        retry_render.finished_work()
    );
    assert_eq!(
        retry_commit.commit().finished_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(retry_commit.commit().remaining_lanes(), Lanes::NO);
    assert_eq!(retry_commit.commit().pending_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        retry_render.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(current_host_root_element(&store, root_id), content_element);

    assert_eq!(fallback_content_commit.root(), root_id);
    assert_eq!(fallback_content_commit.previous_current(), fallback_current);
    assert_eq!(
        fallback_content_commit.committed_current(),
        retry_render.finished_work()
    );
    assert_eq!(fallback_content_commit.fallback_element(), fallback_element);
    assert_eq!(fallback_content_commit.content_element(), content_element);
    assert_eq!(
        fallback_content_commit.previous_current_element(),
        fallback_element
    );
    assert_eq!(
        fallback_content_commit.committed_current_element(),
        content_element
    );
    assert_eq!(
        fallback_content_commit.retry_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(
        fallback_content_commit.finished_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert!(fallback_content_commit.private_finished_work_commit_proof());
    assert!(fallback_content_commit.fallback_to_content_element_handoff());
    assert!(fallback_content_commit.retry_lanes_committed());
    assert!(
        fallback_content_commit.proves_private_suspense_retry_fallback_content_commit_handoff()
    );
    assert!(!fallback_content_commit.suspense_boundary_rendering_executed());
    assert!(!fallback_content_commit.fallback_traversal_executed());
    assert!(!fallback_content_commit.wakeable_subscription_performed());
    assert!(!fallback_content_commit.public_suspense_compatibility_claimed());
    assert!(!fallback_content_commit.public_root_compatibility_claimed());

    assert_eq!(
        store.update_queues().update(retry_update).unwrap().lane(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().suspended_lanes(),
        Lanes::NO
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().pinged_lanes(),
        Lanes::NO
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(primary_child)
            .unwrap()
            .return_fiber(),
        Some(primary)
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(fallback_child)
            .unwrap()
            .return_fiber(),
        Some(fallback)
    );
}

#[test]
fn root_work_loop_preflight_and_complete_handoff_report_suspense_offscreen_child_shapes() {
    let (mut suspense_store, suspense_root, mut suspense_host) = root_store();
    let mut suspense_source = TestHostTree::new();
    let suspense_element = suspense_source.insert_host_element_with_text("section", "blocked");
    let suspense_current = suspense_store.root(suspense_root).unwrap().current();
    update_container(&mut suspense_store, suspense_root, suspense_element, None).unwrap();
    let suspense_render =
        render_host_root_for_lanes(&mut suspense_store, suspense_root, Lanes::DEFAULT).unwrap();
    let (suspense, primary, primary_child, fallback, fallback_child) =
        attach_suspense_wip_child_with_primary_and_fallback(
            &mut suspense_store,
            suspense_render.work_in_progress(),
        );
    let mut suspense_registry = TestFunctionComponentRegistry::default();

    let suspense_preflight = preflight_host_root_child_begin_work(
        &mut suspense_store,
        suspense_root,
        suspense_render.work_in_progress(),
        Lanes::from(Lane::RETRY_1),
        &mut suspense_registry,
    )
    .unwrap_err();

    match suspense_preflight {
        HostRootChildBeginWorkPreflightError::UnsupportedSuspenseChildShape {
            root,
            host_root_work_in_progress,
            suspense: record,
        } => {
            assert_eq!(root, suspense_root);
            assert_eq!(
                host_root_work_in_progress,
                suspense_render.work_in_progress()
            );
            assert_eq!(record.fiber(), suspense);
            assert_eq!(record.key().map(ReactKey::as_str), Some("boundary"));
            assert_eq!(record.pending_props(), PropsHandle::from_raw(741));
            assert_eq!(record.memoized_state(), StateHandle::from_raw(742));
            assert_eq!(record.child(), Some(primary));
            assert_eq!(record.child_tag(), Some(FiberTag::Offscreen));
            assert_eq!(record.fallback_child(), Some(fallback));
            assert_eq!(record.fallback_child_tag(), Some(FiberTag::Fragment));
            assert_eq!(
                record.shape(),
                UnsupportedSuspenseChildShapeKind::PrimaryOffscreenWithFallback
            );
            assert_eq!(record.render_lanes(), Lanes::from(Lane::RETRY_1));
            let thenable = record.thenable_ping_blocker();
            assert_eq!(
                thenable.thenable_identity_class(),
                UnsupportedThenableIdentityClass::OpaqueWakeable
            );
            assert_eq!(thenable.ping_lane(), Lane::RETRY_1);
            assert_eq!(thenable.ping_lanes(), Lanes::from(Lane::RETRY_1));
            assert_eq!(
                thenable.retry_queue_kind(),
                UnsupportedThenableRetryQueueKind::SuspenseBoundaryAndPrimaryOffscreen
            );
            assert_eq!(thenable.retry_queue(), UpdateQueueHandle::from_raw(747));
            assert_eq!(
                thenable.primary_offscreen_retry_queue(),
                Some(UpdateQueueHandle::from_raw(748))
            );
            assert!(!thenable.schedule_retry_flag());
            assert!(thenable.primary_child_rendering_blocked());
            assert!(thenable.fallback_child_rendering_blocked());
            assert_eq!(record.feature(), SUSPENSE_UNSUPPORTED_FEATURE);
        }
        other => panic!("expected Suspense child-shape preflight, got {other:?}"),
    }

    let suspense_complete_error = handoff_completed_host_root_render_to_test_complete_work(
        &mut suspense_store,
        &mut suspense_host,
        suspense_render,
        &suspense_source,
    )
    .unwrap_err();

    match suspense_complete_error {
        HostRootCompleteWorkHandoffError::ChildPreflight(error) => match *error {
            HostRootChildBeginWorkPreflightError::UnsupportedSuspenseChildShape {
                root,
                host_root_work_in_progress,
                suspense: record,
            } => {
                assert_eq!(root, suspense_root);
                assert_eq!(
                    host_root_work_in_progress,
                    suspense_render.work_in_progress()
                );
                assert_eq!(record.fiber(), suspense);
                assert_eq!(
                    record.shape(),
                    UnsupportedSuspenseChildShapeKind::PrimaryOffscreenWithFallback
                );
                assert_eq!(record.child(), Some(primary));
                assert_eq!(record.fallback_child(), Some(fallback));
                assert_eq!(record.render_lanes(), suspense_render.render_lanes());
                assert_eq!(
                    record.thenable_ping_blocker().ping_lane(),
                    suspense_render.render_lanes().highest_priority_lane()
                );
                assert_eq!(
                    record.thenable_ping_blocker().retry_queue_kind(),
                    UnsupportedThenableRetryQueueKind::SuspenseBoundaryAndPrimaryOffscreen
                );
            }
            other => panic!("expected Suspense child-shape preflight, got {other:?}"),
        },
        other => panic!("expected complete-work child preflight, got {other:?}"),
    }
    assert!(suspense_registry.calls().is_empty());
    assert_client_root_fail_closed_without_side_effects(
        &suspense_store,
        &suspense_host,
        suspense_root,
        suspense_current,
        suspense_render,
        suspense,
    );
    assert_eq!(
        suspense_store
            .fiber_arena()
            .get(primary_child)
            .unwrap()
            .return_fiber(),
        Some(primary)
    );
    assert_eq!(
        suspense_store
            .fiber_arena()
            .get(fallback_child)
            .unwrap()
            .return_fiber(),
        Some(fallback)
    );

    let (mut offscreen_store, offscreen_root, mut offscreen_host) = root_store();
    let mut offscreen_source = TestHostTree::new();
    let offscreen_element = offscreen_source.insert_host_element_with_text("aside", "blocked");
    let offscreen_current = offscreen_store.root(offscreen_root).unwrap().current();
    update_container(
        &mut offscreen_store,
        offscreen_root,
        offscreen_element,
        None,
    )
    .unwrap();
    let offscreen_render =
        render_host_root_for_lanes(&mut offscreen_store, offscreen_root, Lanes::DEFAULT).unwrap();
    let (offscreen, first_child, second_child) = attach_offscreen_wip_child_with_descendants(
        &mut offscreen_store,
        offscreen_render.work_in_progress(),
    );
    let mut offscreen_registry = TestFunctionComponentRegistry::default();

    let offscreen_preflight = preflight_host_root_child_begin_work(
        &mut offscreen_store,
        offscreen_root,
        offscreen_render.work_in_progress(),
        Lanes::OFFSCREEN,
        &mut offscreen_registry,
    )
    .unwrap_err();

    match offscreen_preflight {
        HostRootChildBeginWorkPreflightError::UnsupportedOffscreenChildShape {
            root,
            host_root_work_in_progress,
            offscreen: record,
        } => {
            assert_eq!(root, offscreen_root);
            assert_eq!(
                host_root_work_in_progress,
                offscreen_render.work_in_progress()
            );
            assert_eq!(record.fiber(), offscreen);
            assert_eq!(record.key().map(ReactKey::as_str), Some("hidden"));
            assert_eq!(record.pending_props(), PropsHandle::from_raw(751));
            assert_eq!(record.memoized_props(), PropsHandle::from_raw(752));
            assert_eq!(record.memoized_state(), StateHandle::from_raw(753));
            assert_eq!(record.state_node(), StateNodeHandle::from_raw(754));
            assert_eq!(record.child(), Some(first_child));
            assert_eq!(record.child_tag(), Some(FiberTag::HostText));
            assert_eq!(record.child_sibling(), Some(second_child));
            assert_eq!(record.child_sibling_tag(), Some(FiberTag::HostComponent));
            assert_eq!(
                record.shape(),
                UnsupportedOffscreenChildShapeKind::MultipleChildren
            );
            assert_eq!(record.render_lanes(), Lanes::OFFSCREEN);
            let thenable = record.thenable_ping_blocker();
            assert_eq!(
                thenable.thenable_identity_class(),
                UnsupportedThenableIdentityClass::OpaqueWakeableAndSuspenseyCommitResource
            );
            assert_eq!(thenable.ping_lane(), Lane::OFFSCREEN);
            assert_eq!(thenable.ping_lanes(), Lanes::OFFSCREEN);
            assert_eq!(
                thenable.retry_queue_kind(),
                UnsupportedThenableRetryQueueKind::Offscreen
            );
            assert_eq!(thenable.retry_queue(), UpdateQueueHandle::from_raw(757));
            assert_eq!(thenable.primary_offscreen_retry_queue(), None);
            assert!(thenable.schedule_retry_flag());
            assert!(thenable.primary_child_rendering_blocked());
            assert!(!thenable.fallback_child_rendering_blocked());
            assert_eq!(record.feature(), OFFSCREEN_UNSUPPORTED_FEATURE);
        }
        other => panic!("expected Offscreen child-shape preflight, got {other:?}"),
    }

    let offscreen_complete_error = handoff_completed_host_root_render_to_test_complete_work(
        &mut offscreen_store,
        &mut offscreen_host,
        offscreen_render,
        &offscreen_source,
    )
    .unwrap_err();

    match offscreen_complete_error {
        HostRootCompleteWorkHandoffError::ChildPreflight(error) => match *error {
            HostRootChildBeginWorkPreflightError::UnsupportedOffscreenChildShape {
                root,
                host_root_work_in_progress,
                offscreen: record,
            } => {
                assert_eq!(root, offscreen_root);
                assert_eq!(
                    host_root_work_in_progress,
                    offscreen_render.work_in_progress()
                );
                assert_eq!(record.fiber(), offscreen);
                assert_eq!(
                    record.shape(),
                    UnsupportedOffscreenChildShapeKind::MultipleChildren
                );
                assert_eq!(record.child(), Some(first_child));
                assert_eq!(record.child_sibling(), Some(second_child));
                assert_eq!(record.render_lanes(), offscreen_render.render_lanes());
                assert_eq!(
                    record.thenable_ping_blocker().retry_queue_kind(),
                    UnsupportedThenableRetryQueueKind::Offscreen
                );
                assert!(record.thenable_ping_blocker().schedule_retry_flag());
            }
            other => panic!("expected Offscreen child-shape preflight, got {other:?}"),
        },
        other => panic!("expected complete-work child preflight, got {other:?}"),
    }
    assert!(offscreen_registry.calls().is_empty());
    assert_client_root_fail_closed_without_side_effects(
        &offscreen_store,
        &offscreen_host,
        offscreen_root,
        offscreen_current,
        offscreen_render,
        offscreen,
    );
    assert_eq!(
        offscreen_store
            .fiber_arena()
            .get(first_child)
            .unwrap()
            .return_fiber(),
        Some(offscreen)
    );
    assert_eq!(
        offscreen_store
            .fiber_arena()
            .get(second_child)
            .unwrap()
            .return_fiber(),
        Some(offscreen)
    );
}

#[test]
fn root_work_loop_offscreen_hidden_lane_reveal_commit_gate_records_private_metadata() {
    let (mut store, root_id, mut host) = root_store();
    let hidden_callback = RootUpdateCallbackHandle::from_raw(7601);
    let hidden_update = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(7601),
        Some(hidden_callback),
    )
    .unwrap();
    store
        .update_queues_mut()
        .mark_update_hidden(hidden_update.update())
        .unwrap();
    let retained_hidden_lanes = store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_hidden_update(hidden_update.lane())
        .unwrap();
    assert_eq!(
        retained_hidden_lanes,
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
    );

    let render_lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);
    let render = render_host_root_for_lanes(&mut store, root_id, render_lanes).unwrap();
    let (previous, offscreen, child, host_root_work_in_progress) =
        attach_offscreen_reveal_wip_child(
            &mut store,
            render.work_in_progress(),
            FiberTag::HostComponent,
        );
    let begin_work = offscreen_begin_work_record_from_host_root_preflight(
        &mut store,
        root_id,
        render.work_in_progress(),
        render_lanes,
    );
    let complete_work = complete_offscreen_visibility_transition_blocker_for_test(
        store.fiber_arena(),
        offscreen,
        &begin_work,
        render_lanes,
    )
    .unwrap();

    let record = offscreen_hidden_lane_reveal_commit_gate_for_test(
        &store,
        root_id,
        render.work_in_progress(),
        offscreen,
        hidden_update.update(),
        hidden_update.lane(),
        &begin_work,
        &complete_work,
        render_lanes,
    )
    .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        host_root_work_in_progress
    );
    assert_eq!(record.offscreen(), offscreen);
    assert_eq!(record.hidden_update(), hidden_update.update());
    assert_eq!(record.hidden_update_lane(), Lane::DEFAULT);
    assert_eq!(
        record.retained_hidden_update_lanes(),
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
    );
    assert_eq!(record.hidden_update_count(), 1);
    assert_eq!(record.begin_work().fiber(), offscreen);
    assert_eq!(
        record.begin_work().shape(),
        UnsupportedOffscreenChildShapeKind::SingleChild
    );
    let begin_transition = record
        .begin_work()
        .visibility_transition()
        .expect("reveal begin-work transition");
    assert_eq!(begin_transition.previous(), previous);
    assert!(begin_transition.is_hidden_to_visible_reveal());
    assert!(begin_transition.records_offscreen_lane_participation());
    assert_eq!(record.complete_work().offscreen(), offscreen);
    assert_eq!(record.complete_work().child(), Some(child));
    assert_eq!(
        record
            .complete_work()
            .subtree_flag_bubbling_intent()
            .as_str(),
        "bubble-visible-subtree"
    );
    assert!(record.complete_work().would_schedule_visibility_effect());
    assert!(
        !record
            .complete_work()
            .flags()
            .contains_any(FiberFlags::VISIBILITY)
    );

    let reveal = record.reveal_commit();
    assert_eq!(reveal.offscreen(), offscreen);
    assert_eq!(reveal.child(), child);
    assert_eq!(reveal.child_tag(), FiberTag::HostComponent);
    assert_eq!(reveal.committed_lanes(), render_lanes);
    assert_eq!(
        reveal.status().as_str(),
        "accepted-hidden-to-visible-reveal"
    );
    assert_eq!(
        reveal.suspensey_commit_flag(),
        FiberFlags::MAY_SUSPEND_COMMIT
    );
    assert!(reveal.child_may_suspend_commit());
    assert!(reveal.would_accumulate_newly_visible_suspensey_commit());
    assert!(reveal.would_unhide_host_children());
    assert!(reveal.visibility_effect_required());
    assert!(!reveal.visibility_flag_set());
    assert!(reveal.host_visibility_mutation_blocked());
    assert!(reveal.passive_visibility_effects_blocked());
    assert!(reveal.public_compatibility_blocked());
    assert!(record.child_traversal_blocked());
    assert!(record.host_visibility_mutation_blocked());
    assert!(record.passive_visibility_effects_deferred());
    assert!(record.public_offscreen_compatibility_blocked());
    assert!(record.public_passive_compatibility_blocked());
    assert!(record.public_activity_compatibility_blocked());

    let source = TestHostTree::new();
    let public_complete_error = handoff_completed_host_root_render_to_test_complete_work(
        &mut store, &mut host, render, &source,
    )
    .unwrap_err();
    match public_complete_error {
        HostRootCompleteWorkHandoffError::ChildPreflight(error) => match *error {
            HostRootChildBeginWorkPreflightError::UnsupportedOffscreenChildShape {
                offscreen: record,
                ..
            } => {
                assert_eq!(record.fiber(), offscreen);
                assert_eq!(record.feature(), OFFSCREEN_UNSUPPORTED_FEATURE);
            }
            other => panic!("expected Offscreen public blocker, got {other:?}"),
        },
        other => panic!("expected child preflight blocker, got {other:?}"),
    }
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_work_loop_offscreen_hidden_lane_reveal_commit_gate_rejects_stale_records_and_children() {
    let render_lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);

    let (mut store, root_id, _host) = root_store();
    let hidden_update = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(7611),
        Some(RootUpdateCallbackHandle::from_raw(7611)),
    )
    .unwrap();
    store
        .update_queues_mut()
        .mark_update_hidden(hidden_update.update())
        .unwrap();
    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_hidden_update(hidden_update.lane())
        .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, render_lanes).unwrap();
    let (_, offscreen, _, _) = attach_offscreen_reveal_wip_child(
        &mut store,
        render.work_in_progress(),
        FiberTag::HostText,
    );
    let begin_work = offscreen_begin_work_record_from_host_root_preflight(
        &mut store,
        root_id,
        render.work_in_progress(),
        render_lanes,
    );
    let complete_work = complete_offscreen_visibility_transition_blocker_for_test(
        store.fiber_arena(),
        offscreen,
        &begin_work,
        render_lanes,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .get_mut(offscreen)
        .unwrap()
        .set_memoized_props(PropsHandle::from_raw(7612));
    assert_eq!(
        offscreen_hidden_lane_reveal_commit_gate_for_test(
            &store,
            root_id,
            render.work_in_progress(),
            offscreen,
            hidden_update.update(),
            hidden_update.lane(),
            &begin_work,
            &complete_work,
            render_lanes,
        ),
        Err(OffscreenHiddenLaneRevealCommitGateError::StaleBeginWorkRecord { offscreen })
    );

    let (mut store, root_id, _host) = root_store();
    let hidden_update = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(7621),
        Some(RootUpdateCallbackHandle::from_raw(7621)),
    )
    .unwrap();
    store
        .update_queues_mut()
        .mark_update_hidden(hidden_update.update())
        .unwrap();
    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_hidden_update(hidden_update.lane())
        .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, render_lanes).unwrap();
    let (_, offscreen, child, _) = attach_offscreen_reveal_wip_child(
        &mut store,
        render.work_in_progress(),
        FiberTag::HostText,
    );
    let begin_work = offscreen_begin_work_record_from_host_root_preflight(
        &mut store,
        root_id,
        render.work_in_progress(),
        render_lanes,
    );
    let complete_work = complete_offscreen_visibility_transition_blocker_for_test(
        store.fiber_arena(),
        offscreen,
        &begin_work,
        render_lanes,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .get_mut(child)
        .unwrap()
        .merge_flags(FiberFlags::UPDATE);
    assert_eq!(
        offscreen_hidden_lane_reveal_commit_gate_for_test(
            &store,
            root_id,
            render.work_in_progress(),
            offscreen,
            hidden_update.update(),
            hidden_update.lane(),
            &begin_work,
            &complete_work,
            render_lanes,
        ),
        Err(OffscreenHiddenLaneRevealCommitGateError::StaleCompleteWorkRecord { offscreen })
    );

    let (mut store, root_id, _host) = root_store();
    let hidden_update = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(7631),
        Some(RootUpdateCallbackHandle::from_raw(7631)),
    )
    .unwrap();
    store
        .update_queues_mut()
        .mark_update_hidden(hidden_update.update())
        .unwrap();
    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_hidden_update(hidden_update.lane())
        .unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, render_lanes).unwrap();
    let (_, offscreen, child, _) = attach_offscreen_reveal_wip_child(
        &mut store,
        render.work_in_progress(),
        FiberTag::Fragment,
    );
    let begin_work = offscreen_begin_work_record_from_host_root_preflight(
        &mut store,
        root_id,
        render.work_in_progress(),
        render_lanes,
    );
    let complete_work = complete_offscreen_visibility_transition_blocker_for_test(
        store.fiber_arena(),
        offscreen,
        &begin_work,
        render_lanes,
    )
    .unwrap();
    match offscreen_hidden_lane_reveal_commit_gate_for_test(
        &store,
        root_id,
        render.work_in_progress(),
        offscreen,
        hidden_update.update(),
        hidden_update.lane(),
        &begin_work,
        &complete_work,
        render_lanes,
    ) {
        Err(OffscreenHiddenLaneRevealCommitGateError::RevealCommit(
            OffscreenRevealCommitMetadataError::UnsupportedOffscreenChild {
                offscreen: rejected_offscreen,
                child: rejected_child,
                child_tag,
                child_sibling,
                child_sibling_tag,
            },
        )) => {
            assert_eq!(rejected_offscreen, offscreen);
            assert_eq!(rejected_child, child);
            assert_eq!(child_tag, FiberTag::Fragment);
            assert_eq!(child_sibling, None);
            assert_eq!(child_sibling_tag, None);
        }
        other => panic!("expected unsupported Offscreen child rejection, got {other:?}"),
    }
}

#[test]
fn root_work_loop_preflight_and_complete_handoff_report_suspense_list_activity_child_shapes() {
    let (mut list_store, list_root, mut list_host) = root_store();
    let mut list_source = TestHostTree::new();
    let list_element = list_source.insert_host_element_with_text("section", "blocked");
    let list_current = list_store.root(list_root).unwrap().current();
    update_container(&mut list_store, list_root, list_element, None).unwrap();
    let list_render =
        render_host_root_for_lanes(&mut list_store, list_root, Lanes::DEFAULT).unwrap();
    let (suspense_list, first_row, second_row) =
        attach_suspense_list_wip_child_with_rows(&mut list_store, list_render.work_in_progress());
    let mut list_registry = TestFunctionComponentRegistry::default();

    let list_preflight = preflight_host_root_child_begin_work(
        &mut list_store,
        list_root,
        list_render.work_in_progress(),
        Lanes::from(Lane::RETRY_3),
        &mut list_registry,
    )
    .unwrap_err();

    match list_preflight {
        HostRootChildBeginWorkPreflightError::UnsupportedSuspenseListChildShape {
            root,
            host_root_work_in_progress,
            suspense_list: record,
        } => {
            assert_eq!(root, list_root);
            assert_eq!(host_root_work_in_progress, list_render.work_in_progress());
            assert_eq!(record.fiber(), suspense_list);
            assert_eq!(record.key().map(ReactKey::as_str), Some("rows"));
            assert_eq!(record.pending_props(), PropsHandle::from_raw(761));
            assert_eq!(record.memoized_props(), PropsHandle::from_raw(762));
            assert_eq!(record.memoized_state(), StateHandle::from_raw(763));
            assert_eq!(record.child(), Some(first_row));
            assert_eq!(record.child_tag(), Some(FiberTag::Suspense));
            assert_eq!(record.child_sibling(), Some(second_row));
            assert_eq!(record.child_sibling_tag(), Some(FiberTag::Suspense));
            assert_eq!(
                record.shape(),
                UnsupportedSuspenseListChildShapeKind::MultipleChildren
            );
            assert_eq!(record.render_lanes(), Lanes::from(Lane::RETRY_3));
            assert_eq!(record.feature(), SUSPENSE_LIST_UNSUPPORTED_FEATURE);
        }
        other => panic!("expected SuspenseList child-shape preflight, got {other:?}"),
    }

    let list_complete_error = handoff_completed_host_root_render_to_test_complete_work(
        &mut list_store,
        &mut list_host,
        list_render,
        &list_source,
    )
    .unwrap_err();

    match list_complete_error {
        HostRootCompleteWorkHandoffError::ChildPreflight(error) => match *error {
            HostRootChildBeginWorkPreflightError::UnsupportedSuspenseListChildShape {
                root,
                host_root_work_in_progress,
                suspense_list: record,
            } => {
                assert_eq!(root, list_root);
                assert_eq!(host_root_work_in_progress, list_render.work_in_progress());
                assert_eq!(record.fiber(), suspense_list);
                assert_eq!(
                    record.shape(),
                    UnsupportedSuspenseListChildShapeKind::MultipleChildren
                );
                assert_eq!(record.child(), Some(first_row));
                assert_eq!(record.child_sibling(), Some(second_row));
                assert_eq!(record.render_lanes(), list_render.render_lanes());
            }
            other => panic!("expected SuspenseList child-shape preflight, got {other:?}"),
        },
        other => panic!("expected complete-work child preflight, got {other:?}"),
    }
    assert!(list_registry.calls().is_empty());
    assert_client_root_fail_closed_without_side_effects(
        &list_store,
        &list_host,
        list_root,
        list_current,
        list_render,
        suspense_list,
    );
    assert_eq!(
        list_store
            .fiber_arena()
            .get(first_row)
            .unwrap()
            .return_fiber(),
        Some(suspense_list)
    );
    assert_eq!(
        list_store
            .fiber_arena()
            .get(second_row)
            .unwrap()
            .return_fiber(),
        Some(suspense_list)
    );

    let (mut activity_store, activity_root, mut activity_host) = root_store();
    let mut activity_source = TestHostTree::new();
    let activity_element = activity_source.insert_host_element_with_text("aside", "blocked");
    let activity_current = activity_store.root(activity_root).unwrap().current();
    update_container(&mut activity_store, activity_root, activity_element, None).unwrap();
    let activity_render =
        render_host_root_for_lanes(&mut activity_store, activity_root, Lanes::DEFAULT).unwrap();
    let (activity, primary, primary_child) = attach_activity_wip_child_with_primary(
        &mut activity_store,
        activity_render.work_in_progress(),
    );
    let mut activity_registry = TestFunctionComponentRegistry::default();

    let activity_preflight = preflight_host_root_child_begin_work(
        &mut activity_store,
        activity_root,
        activity_render.work_in_progress(),
        Lanes::from(Lane::RETRY_2),
        &mut activity_registry,
    )
    .unwrap_err();

    match activity_preflight {
        HostRootChildBeginWorkPreflightError::UnsupportedActivityChildShape {
            root,
            host_root_work_in_progress,
            activity: record,
        } => {
            assert_eq!(root, activity_root);
            assert_eq!(
                host_root_work_in_progress,
                activity_render.work_in_progress()
            );
            assert_eq!(record.fiber(), activity);
            assert_eq!(record.key().map(ReactKey::as_str), Some("activity"));
            assert_eq!(record.pending_props(), PropsHandle::from_raw(771));
            assert_eq!(record.memoized_props(), PropsHandle::from_raw(772));
            assert_eq!(record.memoized_state(), StateHandle::NONE);
            assert_eq!(record.state_node(), StateNodeHandle::from_raw(773));
            assert_eq!(record.child(), Some(primary));
            assert_eq!(record.child_tag(), Some(FiberTag::Offscreen));
            assert_eq!(record.child_sibling(), None);
            assert_eq!(record.child_sibling_tag(), None);
            assert_eq!(
                record.shape(),
                UnsupportedActivityChildShapeKind::PrimaryOffscreen
            );
            assert_eq!(record.render_lanes(), Lanes::from(Lane::RETRY_2));
            assert_eq!(record.feature(), ACTIVITY_UNSUPPORTED_FEATURE);
        }
        other => panic!("expected Activity child-shape preflight, got {other:?}"),
    }

    let activity_complete_error = handoff_completed_host_root_render_to_test_complete_work(
        &mut activity_store,
        &mut activity_host,
        activity_render,
        &activity_source,
    )
    .unwrap_err();

    match activity_complete_error {
        HostRootCompleteWorkHandoffError::ChildPreflight(error) => match *error {
            HostRootChildBeginWorkPreflightError::UnsupportedActivityChildShape {
                root,
                host_root_work_in_progress,
                activity: record,
            } => {
                assert_eq!(root, activity_root);
                assert_eq!(
                    host_root_work_in_progress,
                    activity_render.work_in_progress()
                );
                assert_eq!(record.fiber(), activity);
                assert_eq!(
                    record.shape(),
                    UnsupportedActivityChildShapeKind::PrimaryOffscreen
                );
                assert_eq!(record.child(), Some(primary));
                assert_eq!(record.child_sibling(), None);
                assert_eq!(record.render_lanes(), activity_render.render_lanes());
            }
            other => panic!("expected Activity child-shape preflight, got {other:?}"),
        },
        other => panic!("expected complete-work child preflight, got {other:?}"),
    }
    assert!(activity_registry.calls().is_empty());
    assert_client_root_fail_closed_without_side_effects(
        &activity_store,
        &activity_host,
        activity_root,
        activity_current,
        activity_render,
        activity,
    );
    assert_eq!(
        activity_store
            .fiber_arena()
            .get(primary)
            .unwrap()
            .return_fiber(),
        Some(activity)
    );
    assert_eq!(
        activity_store
            .fiber_arena()
            .get(primary_child)
            .unwrap()
            .return_fiber(),
        Some(primary)
    );
}

#[test]
fn root_work_loop_preflight_fails_closed_for_portal_child_without_delegating_or_mounting() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, RootElementHandle::from_raw(21), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (portal, portal_child) = attach_portal_wip_child(&mut store, render.work_in_progress());
    let mut registry = TestFunctionComponentRegistry::default();

    let error = preflight_host_root_child_begin_work(
        &mut store,
        root_id,
        render.work_in_progress(),
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap_err();

    let portal_record = match error {
        HostRootChildBeginWorkPreflightError::UnsupportedPortal {
            root,
            host_root_work_in_progress,
            portal,
        } => {
            assert_eq!(root, root_id);
            assert_eq!(host_root_work_in_progress, render.work_in_progress());
            portal
        }
        other => panic!("expected portal admission diagnostic, got {other:?}"),
    };

    assert_eq!(portal_record.fiber(), portal);
    assert_eq!(
        portal_record.key().map(ReactKey::as_str),
        Some("portal-root")
    );
    assert_eq!(portal_record.pending_props(), PropsHandle::from_raw(701));
    assert_eq!(portal_record.state_node(), StateNodeHandle::from_raw(702));
    assert_eq!(portal_record.child(), Some(portal_child));
    assert_eq!(portal_record.render_lanes(), Lanes::DEFAULT);
    assert_eq!(
        portal_record.feature(),
        PORTAL_RECONCILER_UNSUPPORTED_FEATURE
    );
    assert!(registry.calls().is_empty());
    assert_client_root_fail_closed_without_side_effects(
        &store, &host, root_id, current, render, portal,
    );

    let portal_node = store.fiber_arena().get(portal).unwrap();
    assert_eq!(portal_node.return_fiber(), Some(render.work_in_progress()));
    assert_eq!(portal_node.child(), Some(portal_child));
    assert_eq!(portal_node.memoized_props(), PropsHandle::NONE);
    assert_eq!(portal_node.lanes(), Lanes::NO);
    let portal_child_node = store.fiber_arena().get(portal_child).unwrap();
    assert_eq!(portal_child_node.return_fiber(), Some(portal));
    assert_eq!(portal_child_node.memoized_props(), PropsHandle::NONE);
    assert_eq!(portal_child_node.lanes(), Lanes::NO);
}

#[test]
fn root_work_loop_preflight_delegates_single_host_child_fragment_without_mounting() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, RootElementHandle::from_raw(22), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (fragment, fragment_child) =
        attach_fragment_wip_child_with_descendant(&mut store, render.work_in_progress());
    let mut registry = TestFunctionComponentRegistry::default();

    let record = preflight_host_root_child_begin_work(
        &mut store,
        root_id,
        render.work_in_progress(),
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap();
    let fragment_begin_work = record.begin_work().unwrap().fragment();

    assert_eq!(record.root(), root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(record.child(), Some(fragment));
    assert_eq!(record.child_tag(), Some(FiberTag::Fragment));
    assert_eq!(record.render_lanes(), Lanes::DEFAULT);
    assert!(record.requires_begin_work());
    assert_eq!(fragment_begin_work.fragment(), fragment);
    assert_eq!(fragment_begin_work.current(), None);
    assert_eq!(fragment_begin_work.child(), fragment_child);
    assert_eq!(fragment_begin_work.child_tag(), FiberTag::HostText);
    assert_eq!(
        fragment_begin_work.pending_props(),
        PropsHandle::from_raw(801)
    );
    assert_eq!(
        fragment_begin_work.child_pending_props(),
        PropsHandle::from_raw(802)
    );
    assert_eq!(fragment_begin_work.render_lanes(), Lanes::DEFAULT);
    assert!(registry.calls().is_empty());
    assert_client_root_fail_closed_without_side_effects(
        &store, &host, root_id, current, render, fragment,
    );

    let fragment_node = store.fiber_arena().get(fragment).unwrap();
    assert_eq!(fragment_node.child(), Some(fragment_child));
    assert_eq!(fragment_node.memoized_props(), PropsHandle::from_raw(801));
    assert_eq!(fragment_node.memoized_state(), StateHandle::NONE);
    assert_eq!(fragment_node.update_queue(), UpdateQueueHandle::NONE);
    assert_eq!(fragment_node.flags(), FiberFlags::NO);
    let fragment_child_node = store.fiber_arena().get(fragment_child).unwrap();
    assert_eq!(fragment_child_node.return_fiber(), Some(fragment));
    assert_eq!(fragment_child_node.lanes(), Lanes::NO);
    assert_eq!(fragment_child_node.flags(), FiberFlags::NO);
}

#[test]
fn root_work_loop_preflight_fails_closed_for_keyed_multi_or_unsupported_fragment_children() {
    let (mut keyed_store, keyed_root_id, keyed_host) = root_store();
    let keyed_current = keyed_store.root(keyed_root_id).unwrap().current();
    update_container(
        &mut keyed_store,
        keyed_root_id,
        RootElementHandle::from_raw(23),
        None,
    )
    .unwrap();
    let keyed_render =
        render_host_root_for_lanes(&mut keyed_store, keyed_root_id, Lanes::DEFAULT).unwrap();
    let (keyed_fragment, keyed_child) = attach_keyed_fragment_wip_child_with_descendant(
        &mut keyed_store,
        keyed_render.work_in_progress(),
    );
    let mut registry = TestFunctionComponentRegistry::default();

    let keyed_error = preflight_host_root_child_begin_work(
        &mut keyed_store,
        keyed_root_id,
        keyed_render.work_in_progress(),
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap_err();

    assert_eq!(
        keyed_error,
        HostRootChildBeginWorkPreflightError::BeginWork(BeginWorkError::FragmentSingleHostChild(
            FragmentSingleHostChildBeginWorkError::KeyedFragmentUnsupported {
                fragment: keyed_fragment,
                key: ReactKey::from_normalized("fragment-key"),
            },
        ),)
    );
    assert!(registry.calls().is_empty());
    assert_client_root_fail_closed_without_side_effects(
        &keyed_store,
        &keyed_host,
        keyed_root_id,
        keyed_current,
        keyed_render,
        keyed_fragment,
    );
    assert_eq!(
        keyed_store
            .fiber_arena()
            .get(keyed_fragment)
            .unwrap()
            .memoized_props(),
        PropsHandle::NONE
    );
    assert_eq!(
        keyed_store
            .fiber_arena()
            .get(keyed_child)
            .unwrap()
            .return_fiber(),
        Some(keyed_fragment)
    );

    let (mut multi_store, multi_root_id, multi_host) = root_store();
    let multi_current = multi_store.root(multi_root_id).unwrap().current();
    update_container(
        &mut multi_store,
        multi_root_id,
        RootElementHandle::from_raw(24),
        None,
    )
    .unwrap();
    let multi_render =
        render_host_root_for_lanes(&mut multi_store, multi_root_id, Lanes::DEFAULT).unwrap();
    let (multi_fragment, first_child, sibling) =
        attach_fragment_wip_child_with_two_host_descendants(
            &mut multi_store,
            multi_render.work_in_progress(),
        );

    let multi_error = preflight_host_root_child_begin_work(
        &mut multi_store,
        multi_root_id,
        multi_render.work_in_progress(),
        Lanes::DEFAULT,
        &mut registry,
    )
    .unwrap_err();

    assert_eq!(
        multi_error,
        HostRootChildBeginWorkPreflightError::BeginWork(BeginWorkError::FragmentSingleHostChild(
            FragmentSingleHostChildBeginWorkError::MultipleChildren {
                fragment: multi_fragment,
                first_child,
                sibling,
            },
        ),)
    );
    assert_client_root_fail_closed_without_side_effects(
        &multi_store,
        &multi_host,
        multi_root_id,
        multi_current,
        multi_render,
        multi_fragment,
    );
    assert_eq!(
        multi_store
            .fiber_arena()
            .get(multi_fragment)
            .unwrap()
            .memoized_props(),
        PropsHandle::NONE
    );

    for tag in [
        FiberTag::Portal,
        FiberTag::Suspense,
        FiberTag::Offscreen,
        FiberTag::Activity,
        FiberTag::ViewTransition,
        FiberTag::SuspenseList,
    ] {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, RootElementHandle::from_raw(25), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (fragment, unsupported_child) = attach_fragment_wip_child_with_tagged_descendant(
            &mut store,
            render.work_in_progress(),
            tag,
        );

        let error = preflight_host_root_child_begin_work(
            &mut store,
            root_id,
            render.work_in_progress(),
            Lanes::DEFAULT,
            &mut registry,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootChildBeginWorkPreflightError::BeginWork(
                BeginWorkError::FragmentSingleHostChild(
                    FragmentSingleHostChildBeginWorkError::UnsupportedChildTag {
                        fragment,
                        child: unsupported_child,
                        tag,
                    },
                ),
            )
        );
        assert_client_root_fail_closed_without_side_effects(
            &store, &host, root_id, current, render, fragment,
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(unsupported_child)
                .unwrap()
                .return_fiber(),
            Some(fragment)
        );
        assert_eq!(
            store.fiber_arena().get(fragment).unwrap().memoized_props(),
            PropsHandle::NONE
        );
    }

    assert!(registry.calls().is_empty());
}

#[test]
fn root_work_loop_complete_work_handoff_preserves_unsupported_root_child_preflight() {
    for (tag, feature) in [
        (FiberTag::Suspense, SUSPENSE_UNSUPPORTED_FEATURE),
        (FiberTag::Offscreen, OFFSCREEN_UNSUPPORTED_FEATURE),
        (FiberTag::Activity, ACTIVITY_UNSUPPORTED_FEATURE),
        (
            FiberTag::ViewTransition,
            VIEW_TRANSITION_UNSUPPORTED_FEATURE,
        ),
        (FiberTag::SuspenseList, SUSPENSE_LIST_UNSUPPORTED_FEATURE),
    ] {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let element = source.insert_host_element_with_text("section", "blocked");
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let child = attach_wip_child_with_tag(&mut store, render.work_in_progress(), tag);

        let error = handoff_completed_host_root_render_to_test_complete_work(
            &mut store, &mut host, render, &source,
        )
        .unwrap_err();

        match error {
            HostRootCompleteWorkHandoffError::ChildPreflight(error) => {
                assert_root_child_preflight_blocks_unsupported_tag(
                    *error,
                    root_id,
                    render.work_in_progress(),
                    child,
                    tag,
                    feature,
                    render.render_lanes(),
                );
            }
            other => panic!("expected child preflight error, got {other:?}"),
        }
        assert_client_root_fail_closed_without_side_effects(
            &store, &host, root_id, current, render, child,
        );
        let child_node = store.fiber_arena().get(child).unwrap();
        assert_eq!(child_node.child(), None);
        assert_eq!(child_node.memoized_props(), PropsHandle::NONE);
        assert_eq!(child_node.flags(), FiberFlags::NO);
    }

    let (mut portal_store, portal_root_id, mut portal_host) = root_store();
    let mut portal_source = TestHostTree::new();
    let portal_element = portal_source.insert_host_element_with_text("section", "blocked");
    let portal_current = portal_store.root(portal_root_id).unwrap().current();
    update_container(&mut portal_store, portal_root_id, portal_element, None).unwrap();
    let portal_render =
        render_host_root_for_lanes(&mut portal_store, portal_root_id, Lanes::DEFAULT).unwrap();
    let (portal, portal_child) =
        attach_portal_wip_child(&mut portal_store, portal_render.work_in_progress());

    let portal_error = handoff_completed_host_root_render_to_test_complete_work(
        &mut portal_store,
        &mut portal_host,
        portal_render,
        &portal_source,
    )
    .unwrap_err();

    match portal_error {
        HostRootCompleteWorkHandoffError::ChildPreflight(error) => match *error {
            HostRootChildBeginWorkPreflightError::UnsupportedPortal {
                root,
                host_root_work_in_progress,
                portal: record,
            } => {
                assert_eq!(root, portal_root_id);
                assert_eq!(host_root_work_in_progress, portal_render.work_in_progress());
                assert_eq!(record.fiber(), portal);
                assert_eq!(record.child(), Some(portal_child));
                assert_eq!(record.feature(), PORTAL_RECONCILER_UNSUPPORTED_FEATURE);
            }
            other => panic!("expected portal preflight diagnostic, got {other:?}"),
        },
        other => panic!("expected child preflight error, got {other:?}"),
    }
    assert_client_root_fail_closed_without_side_effects(
        &portal_store,
        &portal_host,
        portal_root_id,
        portal_current,
        portal_render,
        portal,
    );
    assert_eq!(
        portal_store
            .fiber_arena()
            .get(portal_child)
            .unwrap()
            .return_fiber(),
        Some(portal)
    );

    let (mut fragment_store, fragment_root_id, mut fragment_host) = root_store();
    let mut fragment_source = TestHostTree::new();
    let fragment_element = fragment_source.insert_host_element_with_text("section", "blocked");
    let fragment_current = fragment_store.root(fragment_root_id).unwrap().current();
    update_container(
        &mut fragment_store,
        fragment_root_id,
        fragment_element,
        None,
    )
    .unwrap();
    let fragment_render =
        render_host_root_for_lanes(&mut fragment_store, fragment_root_id, Lanes::DEFAULT).unwrap();
    let (fragment, fragment_child) = attach_fragment_wip_child_with_descendant(
        &mut fragment_store,
        fragment_render.work_in_progress(),
    );

    let fragment_error = handoff_completed_host_root_render_to_test_complete_work(
        &mut fragment_store,
        &mut fragment_host,
        fragment_render,
        &fragment_source,
    )
    .unwrap_err();

    assert_eq!(
        fragment_error,
        HostRootCompleteWorkHandoffError::UnexpectedExistingRootChild {
            root: fragment_root_id,
            host_root_work_in_progress: fragment_render.work_in_progress(),
            child: fragment,
            tag: FiberTag::Fragment,
        }
    );
    assert_client_root_fail_closed_without_side_effects(
        &fragment_store,
        &fragment_host,
        fragment_root_id,
        fragment_current,
        fragment_render,
        fragment,
    );
    let fragment_node = fragment_store.fiber_arena().get(fragment).unwrap();
    assert_eq!(fragment_node.memoized_props(), PropsHandle::NONE);
    assert_eq!(fragment_node.child(), Some(fragment_child));
    assert_eq!(
        fragment_store
            .fiber_arena()
            .get(fragment_child)
            .unwrap()
            .return_fiber(),
        Some(fragment)
    );
}
