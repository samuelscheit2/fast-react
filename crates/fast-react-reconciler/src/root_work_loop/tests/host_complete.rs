use super::*;

#[test]
fn root_work_loop_preflight_fails_closed_through_begin_work_for_unhandled_child_tags() {
    let (mut store, root_id, _host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(20), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let child =
        attach_wip_child_with_tag(&mut store, render.work_in_progress(), FiberTag::HostText);
    let mut registry = TestFunctionComponentRegistry::default();

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
        HostRootChildBeginWorkPreflightError::BeginWork(BeginWorkError::UnsupportedFiberTag {
            fiber: child,
            tag: FiberTag::HostText,
        },)
    );
    assert!(registry.calls().is_empty());
}

#[test]
fn root_work_loop_hands_host_component_child_to_test_complete_work() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("section", "complete");
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, element, None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let record = handoff_completed_host_root_render_to_test_complete_work(
        &mut store, &mut host, render, &source,
    )
    .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(record.root_child_tag(), Some(FiberTag::HostComponent));
    assert_eq!(record.render_lanes(), Lanes::DEFAULT);
    assert_eq!(record.resulting_element(), element);
    assert_eq!(record.detached_instance_count(), 1);
    assert_eq!(record.detached_text_count(), 1);

    let child = record.root_child().unwrap();
    let root_node = store.fiber_arena().get(render.work_in_progress()).unwrap();
    assert_eq!(root_node.child(), Some(child));
    assert!(
        root_node
            .subtree_flags()
            .contains_all(FiberFlags::PLACEMENT)
    );
    assert_eq!(root_node.child_lanes(), Lanes::NO);
    let child_node = store.fiber_arena().get(child).unwrap();
    assert_eq!(child_node.tag(), FiberTag::HostComponent);
    assert!(child_node.state_node().is_some());
    assert!(child_node.flags().contains_all(FiberFlags::PLACEMENT));

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
fn root_work_loop_hands_host_text_child_to_test_complete_work() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_text("root text");
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, element, None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let record = handoff_completed_host_root_render_to_test_complete_work(
        &mut store, &mut host, render, &source,
    )
    .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(record.root_child_tag(), Some(FiberTag::HostText));
    assert_eq!(record.resulting_element(), element);
    assert_eq!(record.detached_instance_count(), 0);
    assert_eq!(record.detached_text_count(), 1);

    let child = record.root_child().unwrap();
    let child_node = store.fiber_arena().get(child).unwrap();
    assert_eq!(child_node.tag(), FiberTag::HostText);
    assert_eq!(child_node.return_fiber(), Some(render.work_in_progress()));
    assert!(child_node.state_node().is_some());
    assert!(child_node.flags().contains_all(FiberFlags::PLACEMENT));

    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        host.operations(),
        vec!["root_host_context", "create_text_instance"]
    );
}

#[test]
fn root_work_loop_complete_work_handoff_commits_host_component_tree_with_diagnostics() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("section", "commit handoff");
    let public_error = crate::render_mutation_placeholder(&mut host).unwrap_err();
    assert_eq!(
        public_error,
        ReconcilerError::unimplemented(MUTATION_RENDER_PLACEHOLDER_FEATURE)
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());

    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, element, None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let record = handoff_completed_host_root_render_to_test_complete_work_and_commit(
        &mut store, &mut host, render, &source,
    )
    .unwrap();

    let complete_work = record.complete_work();
    assert_eq!(complete_work.root(), root_id);
    assert_eq!(
        complete_work.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(
        complete_work.root_child_tag(),
        Some(FiberTag::HostComponent)
    );
    assert_eq!(
        complete_work.completed_child_tag(),
        Some(FiberTag::HostComponent)
    );
    assert_eq!(complete_work.root_child_count(), 1);
    assert_eq!(complete_work.completed_child_count(), 1);
    assert_eq!(complete_work.detached_instance_count(), 1);
    assert_eq!(complete_work.detached_text_count(), 1);
    let component = complete_work.root_child().unwrap();
    let text = store.fiber_arena().get(component).unwrap().child().unwrap();
    assert_eq!(
        store.fiber_arena().get(text).unwrap().tag(),
        FiberTag::HostText
    );

    let finished_work_handoff = record.finished_work_handoff();
    let pending_finished_work = finished_work_handoff.pending();
    assert_eq!(pending_finished_work.root(), root_id);
    assert_eq!(
        pending_finished_work.root_token(),
        root_id.state_node_handle()
    );
    assert_eq!(pending_finished_work.previous_current(), current);
    assert_eq!(
        pending_finished_work.pending_work(),
        Some(render.finished_work())
    );
    assert_eq!(
        pending_finished_work.finished_work(),
        render.finished_work()
    );
    assert_eq!(pending_finished_work.render_lanes(), Lanes::DEFAULT);
    assert_eq!(pending_finished_work.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(pending_finished_work.remaining_lanes(), Lanes::NO);
    assert_eq!(
        pending_finished_work.pending_lanes_before_commit(),
        Lanes::DEFAULT
    );
    assert_eq!(pending_finished_work.handoff_order(), 1);
    assert!(pending_finished_work.records_finished_work());
    assert_eq!(
        pending_finished_work.root_finished_work(),
        Some(render.finished_work())
    );
    assert_eq!(pending_finished_work.root_finished_lanes(), Lanes::DEFAULT);
    assert!(pending_finished_work.records_root_finished_work());
    let execution_request = *finished_work_handoff.execution_request();
    assert_eq!(
        execution_request.status(),
        HostRootFinishedWorkCommitExecutionStatusForCanary::Requested
    );
    assert!(execution_request.execution_requested());
    assert!(execution_request.accepted_current_finished_work_record_shape());
    assert_eq!(execution_request.root(), root_id);
    assert_eq!(execution_request.root_token(), root_id.state_node_handle());
    assert_eq!(execution_request.previous_current(), current);
    assert_eq!(
        execution_request.pending_work(),
        Some(render.finished_work())
    );
    assert_eq!(execution_request.finished_work(), render.finished_work());
    assert_eq!(execution_request.render_lanes(), Lanes::DEFAULT);
    assert_eq!(execution_request.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(
        execution_request.root_finished_work(),
        Some(render.finished_work())
    );
    assert_eq!(execution_request.root_finished_lanes(), Lanes::DEFAULT);
    assert_eq!(execution_request.remaining_lanes(), Lanes::NO);
    assert_eq!(
        execution_request.pending_lanes_before_commit(),
        Lanes::DEFAULT
    );
    assert_eq!(execution_request.source_handoff_order(), 1);
    assert_eq!(execution_request.request_order(), 2);
    assert_eq!(
        execution_request.blockers(),
        &[
            HostRootFinishedWorkCommitExecutionBlockerForCanary::HostMutationExecution,
            HostRootFinishedWorkCommitExecutionBlockerForCanary::PublicRootRendering,
            HostRootFinishedWorkCommitExecutionBlockerForCanary::RefAttachDetach,
            HostRootFinishedWorkCommitExecutionBlockerForCanary::LayoutEffectExecution,
            HostRootFinishedWorkCommitExecutionBlockerForCanary::PassiveEffectExecution,
            HostRootFinishedWorkCommitExecutionBlockerForCanary::Hydration,
            HostRootFinishedWorkCommitExecutionBlockerForCanary::PublicCompatibilityClaim,
        ]
    );
    assert!(execution_request.host_mutation_execution_blocked());
    assert!(execution_request.public_root_rendering_blocked());
    assert!(execution_request.ref_attach_detach_blocked());
    assert!(execution_request.layout_effect_execution_blocked());
    assert!(execution_request.passive_effect_execution_blocked());
    assert!(execution_request.hydration_blocked());
    assert!(execution_request.compatibility_claim_blocked());
    assert!(execution_request.refs_effects_and_hydration_blocked());
    assert_eq!(finished_work_handoff.commit_order(), 2);
    assert!(finished_work_handoff.commit_order_after_pending_record());
    assert_eq!(
        finished_work_handoff.current_after_commit(),
        render.work_in_progress()
    );
    assert_eq!(finished_work_handoff.finished_work_after_commit(), None);
    assert_eq!(
        finished_work_handoff.finished_lanes_after_commit(),
        Lanes::NO
    );
    assert_eq!(finished_work_handoff.render_phase_work_after_commit(), None);
    assert!(finished_work_handoff.consumed_finished_work_record());
    assert!(finished_work_handoff.mutation_execution_blocked());
    assert!(finished_work_handoff.public_root_rendering_blocked());
    assert!(finished_work_handoff.effects_refs_and_hydration_blocked());
    assert!(finished_work_handoff.proves_private_root_finished_work_commit_metadata_handoff());

    let commit = record.commit();
    assert_eq!(commit.root(), root_id);
    assert_eq!(commit.previous_current(), current);
    assert_eq!(commit.current(), render.work_in_progress());
    assert_eq!(commit.finished_work(), render.finished_work());
    assert_eq!(commit.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(commit.pending_lanes(), Lanes::NO);
    assert_eq!(commit.mutation_log().len(), 1);
    assert_eq!(commit.mutation_apply_log().len(), 1);
    assert!(commit.root_update_callbacks().is_empty());
    assert!(commit.host_node_deletion_cleanup_log().is_empty());
    assert!(record.host_operations_unchanged_by_commit());
    assert_eq!(
        record.host_operation_count_after_complete_work(),
        record.host_operation_count_after_commit()
    );
    assert!(record.public_render_blocked());

    let diagnostics = record.placement_apply_diagnostics();
    assert_eq!(diagnostics.len(), 1);
    let diagnostic = diagnostics[0];
    let component_state_node = store.fiber_arena().get(component).unwrap().state_node();
    assert_eq!(diagnostic.root(), root_id);
    assert_eq!(diagnostic.host_root(), render.work_in_progress());
    assert_eq!(diagnostic.fiber(), component);
    assert_eq!(diagnostic.tag(), FiberTag::HostComponent);
    assert_eq!(diagnostic.tag_name(), "HostComponent");
    assert_eq!(diagnostic.state_node(), component_state_node);
    assert_eq!(diagnostic.apply_kind(), "append-placement-to-container");
    assert_eq!(diagnostic.sibling_status(), "append");
    assert_eq!(diagnostic.sibling(), None);
    assert!(!diagnostic.can_insert_before());

    let committed_root = store.root(root_id).unwrap();
    assert_eq!(committed_root.current(), render.work_in_progress());
    assert_eq!(committed_root.finished_work(), None);
    assert_eq!(committed_root.finished_lanes(), Lanes::NO);
    assert_eq!(committed_root.scheduling().work_in_progress(), None);
    assert_eq!(
        committed_root.scheduling().render_exit_status(),
        RootRenderExitStatus::NoWork
    );
    assert_eq!(store.fiber_arena().get(current).unwrap().child(), None);
    assert_eq!(
        store
            .fiber_arena()
            .get(render.work_in_progress())
            .unwrap()
            .child(),
        Some(component)
    );

    let public_error_after_private_commit =
        crate::render_mutation_placeholder(&mut host).unwrap_err();
    assert_eq!(
        public_error_after_private_commit,
        ReconcilerError::unimplemented(MUTATION_RENDER_PLACEHOLDER_FEATURE)
    );
    assert_eq!(
        host.operations().len(),
        record.host_operation_count_after_commit()
    );
}
