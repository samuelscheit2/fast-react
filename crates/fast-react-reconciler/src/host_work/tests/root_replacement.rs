use super::helpers::*;
use super::*;

#[test]
fn host_work_root_replacement_executes_text_to_component_as_delete_then_place() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_text("replace me");
    let initial_render = render_test_root(&mut store, root_id, initial_element);
    let mut initial_host_work =
        mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
    let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
    apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        &initial_commit,
        &mut initial_host_work,
    )
    .unwrap();

    let current_text = initial_host_work.root_child().unwrap();
    let current_text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
    let next_element = source.insert_host_element_with_text("section", "replacement child");
    let update_render = render_test_root(&mut store, root_id, next_element);
    let mut replacement_work = replace_test_host_root_child_work_with_detached_hosts_for_canary(
        &mut store,
        &mut host,
        update_render,
        &source,
        detached_hosts,
    )
    .unwrap();
    let replacement_component = replacement_work.root_child().unwrap();
    let replacement_component_node = store.fiber_arena().get(replacement_component).unwrap();
    let replacement_component_state_node = replacement_component_node.state_node();
    let replacement_text = replacement_component_node.child().unwrap();
    let replacement_text_state_node = store
        .fiber_arena()
        .get(replacement_text)
        .unwrap()
        .state_node();
    let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        954_001,
        954_002,
    )
    .unwrap();
    let source_request =
        test_host_root_child_replacement_execution_request_for_canary(&store, &handoff, 954_003)
            .unwrap();
    let operations_before_execute = host.operations();

    let diagnostic = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut store,
        &mut host,
        &handoff,
        source_request,
        source_request,
        &mut replacement_work,
    )
    .unwrap();

    assert_eq!(diagnostic.root(), root_id);
    assert_eq!(diagnostic.finished_work(), update_render.finished_work());
    assert_eq!(diagnostic.deleted_current(), current_text);
    assert_eq!(diagnostic.replacement_child(), replacement_component);
    assert_eq!(diagnostic.request().source_handoff_order(), 954_001);
    assert_eq!(diagnostic.request().commit_order(), 954_002);
    assert_eq!(diagnostic.request().request_order(), 954_003);
    assert_eq!(
        diagnostic.request().previous_current(),
        initial_render.finished_work()
    );
    assert_eq!(
        diagnostic.request().committed_current(),
        update_render.finished_work()
    );
    assert_eq!(diagnostic.request().remaining_lanes(), Lanes::NO);
    assert_eq!(diagnostic.request().pending_lanes(), Lanes::NO);
    assert_eq!(diagnostic.request().deleted_tag(), FiberTag::HostText);
    assert_eq!(
        diagnostic.request().replacement_tag(),
        FiberTag::HostComponent
    );
    assert_eq!(diagnostic.request().deletion_record_index(), 0);
    assert_eq!(diagnostic.request().placement_record_index(), 1);
    assert_eq!(diagnostic.request().mutation_apply_record_count(), 2);
    assert_eq!(diagnostic.request().deletion_cleanup_record_count(), 1);
    assert!(diagnostic.deletion_precedes_placement());
    assert!(diagnostic.private_test_host_replacement_executed());
    assert_eq!(
        diagnostic.deletion_mutation().source(),
        HostRootMutationApplyRecordSource::DeletionList(
            handoff.commit().deletion_lists()[0].list()
        )
    );
    assert_eq!(
        diagnostic.deletion_mutation().kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
    );
    assert_eq!(
        diagnostic.deletion_mutation().parent(),
        update_render.finished_work()
    );
    assert_eq!(diagnostic.deletion_mutation().fiber(), current_text);
    assert_eq!(
        diagnostic.deletion_mutation().state_node(),
        current_text_state_node
    );
    assert_eq!(
        diagnostic.placement_mutation().source(),
        HostRootMutationApplyRecordSource::MutationPhase(
            HostRootMutationPhaseRecordKind::Placement
        )
    );
    assert_eq!(
        diagnostic.placement_mutation().kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
    );
    assert_eq!(
        diagnostic.placement_mutation().parent(),
        update_render.finished_work()
    );
    assert_eq!(
        diagnostic.placement_mutation().fiber(),
        replacement_component
    );
    assert_eq!(
        diagnostic.placement_mutation().state_node(),
        replacement_component_state_node
    );
    assert_eq!(
        diagnostic.deletion_status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::RemoveChildFromContainer
        )
    );
    assert_eq!(
        diagnostic.placement_status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::AppendChildToContainer
        )
    );
    assert_eq!(diagnostic.applied_host_call_count(), 2);
    assert_eq!(diagnostic.recorded_only_count(), 0);
    assert_eq!(diagnostic.deletion_cleanup_apply_count(), 1);
    assert_eq!(
        diagnostic.blockers(),
        &TEST_HOST_ROOT_CHILD_REPLACEMENT_EXECUTION_BLOCKERS
    );
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert!(!diagnostic.native_renderer_compatibility_claimed());
    assert!(!diagnostic.multi_level_replacement_compatibility_claimed());
    assert!(!source_request.public_root_compatibility_claimed());
    assert!(!source_request.public_renderer_compatibility_claimed());
    assert!(
        !replacement_work
            .detached_hosts()
            .text_metadata(current_text_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        replacement_work
            .detached_hosts()
            .instance_metadata(replacement_component_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        replacement_work
            .detached_hosts()
            .text_metadata(replacement_text_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        update_render.finished_work()
    );
    let mut expected_operations = operations_before_execute;
    expected_operations.push("remove_child_from_container");
    expected_operations.push("append_child_to_container");
    assert_eq!(host.operations(), expected_operations);
}
#[test]
fn host_work_root_replacement_executes_component_to_text_with_child_before_parent_cleanup() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("article", "old child");
    let initial_render = render_test_root(&mut store, root_id, initial_element);
    let mut initial_host_work =
        mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
    let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
    apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        &initial_commit,
        &mut initial_host_work,
    )
    .unwrap();

    let current_component = initial_host_work.root_child().unwrap();
    let current_component_node = store.fiber_arena().get(current_component).unwrap();
    let current_component_state_node = current_component_node.state_node();
    let current_text = current_component_node.child().unwrap();
    let current_text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
    let next_element = source.insert_text("new root text");
    let update_render = render_test_root(&mut store, root_id, next_element);
    let mut replacement_work = replace_test_host_root_child_work_with_detached_hosts_for_canary(
        &mut store,
        &mut host,
        update_render,
        &source,
        detached_hosts,
    )
    .unwrap();
    let replacement_text = replacement_work.root_child().unwrap();
    let replacement_text_state_node = store
        .fiber_arena()
        .get(replacement_text)
        .unwrap()
        .state_node();
    let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        954_011,
        954_012,
    )
    .unwrap();
    let source_request =
        test_host_root_child_replacement_execution_request_for_canary(&store, &handoff, 954_013)
            .unwrap();
    let operations_before_execute = host.operations();

    let diagnostic = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut store,
        &mut host,
        &handoff,
        source_request,
        source_request,
        &mut replacement_work,
    )
    .unwrap();

    assert_eq!(diagnostic.deleted_current(), current_component);
    assert_eq!(diagnostic.replacement_child(), replacement_text);
    assert_eq!(diagnostic.request().deleted_tag(), FiberTag::HostComponent);
    assert_eq!(diagnostic.request().replacement_tag(), FiberTag::HostText);
    assert_eq!(diagnostic.request().deletion_cleanup_record_count(), 2);
    assert_eq!(diagnostic.deletion_cleanup_apply_count(), 2);
    assert_eq!(diagnostic.applied_host_call_count(), 2);
    assert_eq!(
        handoff.commit().host_node_deletion_cleanup_log().records()[0].fiber(),
        current_text
    );
    assert_eq!(
        handoff.commit().host_node_deletion_cleanup_log().records()[1].fiber(),
        current_component
    );
    assert!(
        !replacement_work
            .detached_hosts()
            .text_metadata(current_text_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        !replacement_work
            .detached_hosts()
            .instance_metadata(current_component_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        replacement_work
            .detached_hosts()
            .text_metadata(replacement_text_state_node)
            .unwrap()
            .is_active()
    );
    let mut expected_operations = operations_before_execute;
    expected_operations.push("remove_child_from_container");
    expected_operations.push("append_child_to_container");
    expected_operations.push("detach_deleted_instance");
    assert_eq!(host.operations(), expected_operations);
}
#[test]
fn host_work_root_replacement_inserts_component_before_stable_sibling() {
    let mut fixture =
        root_replacement_text_to_component_before_stable_sibling_execution_fixture(false);
    let operations_before_execute = fixture.operations_before_execute.clone();

    let diagnostic = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        fixture.request,
        &mut fixture.host_work,
    )
    .unwrap();

    assert_eq!(diagnostic.root(), fixture.root_id);
    assert_eq!(
        diagnostic.finished_work(),
        fixture.update_render.finished_work()
    );
    assert_eq!(diagnostic.deleted_current(), fixture.deleted_current);
    assert_eq!(
        diagnostic.replacement_child(),
        fixture.replacement_component
    );
    assert_eq!(
        diagnostic.request().placement_sibling_status(),
        Some(HostRootPlacementSiblingStatus::InsertBefore)
    );
    assert_eq!(
        diagnostic.request().placement_sibling(),
        Some(fixture.stable_work)
    );
    assert_eq!(
        diagnostic.request().placement_sibling_tag(),
        Some(FiberTag::HostText)
    );
    assert_eq!(
        diagnostic.request().placement_sibling_state_node(),
        fixture.placement_sibling_state_node
    );
    assert_eq!(
        diagnostic
            .request()
            .placement_skipped_pending_sibling_count(),
        0
    );
    assert!(
        diagnostic
            .request()
            .stable_sibling_insert_before_order_required()
    );
    assert_eq!(
        diagnostic.placement_mutation().kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
    );
    let sibling = diagnostic.placement_mutation().placement_sibling().unwrap();
    assert_eq!(
        sibling.status(),
        HostRootPlacementSiblingStatus::InsertBefore
    );
    assert_eq!(sibling.sibling(), Some(fixture.stable_work));
    assert_eq!(
        sibling.sibling_state_node(),
        fixture.placement_sibling_state_node
    );
    assert!(sibling.can_insert_before());
    assert_eq!(
        diagnostic.deletion_status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::RemoveChildFromContainer
        )
    );
    assert_eq!(
        diagnostic.placement_status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::InsertInContainerBefore
        )
    );
    assert!(diagnostic.private_test_host_replacement_executed());
    assert_eq!(diagnostic.applied_host_call_count(), 2);
    assert_eq!(diagnostic.recorded_only_count(), 0);
    assert_eq!(diagnostic.deletion_cleanup_apply_count(), 1);
    assert!(
        !fixture
            .host_work
            .detached_hosts()
            .text_metadata(fixture.deleted_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        fixture
            .host_work
            .detached_hosts()
            .text_metadata(fixture.stable_current_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        fixture
            .host_work
            .detached_hosts()
            .instance_metadata(fixture.replacement_component_state_node)
            .unwrap()
            .is_active()
    );
    let mut expected_operations = operations_before_execute;
    expected_operations.push("remove_child_from_container");
    expected_operations.push("insert_in_container_before");
    assert_eq!(fixture.host.operations(), expected_operations);
}
#[test]
fn host_work_root_replacement_rejects_tampered_sibling_order_evidence_before_host_call() {
    let mut fixture =
        root_replacement_text_to_component_before_stable_sibling_execution_fixture(false);
    let mut tampered_request = fixture.request;
    tampered_request.placement_sibling_state_node = StateNodeHandle::NONE;

    let error = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        tampered_request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootChildReplacementExecutionErrorForCanary::StaleFinishedWorkEvidence {
            root,
            commit_order: 973_102,
            request_order: 973_103,
        } if root == fixture.root_id
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_execute);
}
#[test]
fn host_work_root_replacement_rejects_stale_stable_sibling_before_host_call() {
    let mut fixture =
        root_replacement_text_to_component_before_stable_sibling_execution_fixture(false);
    fixture
        .host_work
        .detached_hosts_mut_for_canary()
        .invalidate_text_for_canary(fixture.placement_sibling_state_node)
        .unwrap();

    let error = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        fixture.request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootChildReplacementExecutionErrorForCanary::HostWork(
            HostWorkError::HostNode(ref error)
        ) if error.violation() == HostNodeViolation::Stale
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_execute);

    let retry_error = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        fixture.request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        retry_error,
        TestHostRootChildReplacementExecutionErrorForCanary::HostWork(
            HostWorkError::HostNode(ref error)
        ) if error.violation() == HostNodeViolation::Stale
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_execute);
}
#[test]
fn host_work_root_replacement_rejects_cross_root_stable_sibling_before_host_call() {
    let mut fixture =
        root_replacement_text_to_component_before_stable_sibling_execution_fixture(true);

    let error = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        fixture.request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootChildReplacementExecutionErrorForCanary::HostWork(
            HostWorkError::HostNode(ref error)
        ) if error.violation() == HostNodeViolation::WrongRoot
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_execute);
}
#[test]
fn host_work_root_replacement_rejects_sibling_order_replay_before_second_host_call() {
    let mut fixture =
        root_replacement_text_to_component_before_stable_sibling_execution_fixture(false);

    execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        fixture.request,
        &mut fixture.host_work,
    )
    .unwrap();
    let operations_after_first_execute = fixture.host.operations();

    let error = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        fixture.request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootChildReplacementExecutionErrorForCanary::DuplicateExecution {
            root,
            finished_work,
            request_order: 973_103,
        } if root == fixture.root_id && finished_work == fixture.update_render.finished_work()
    ));
    assert_eq!(fixture.host.operations(), operations_after_first_execute);
}
#[test]
fn host_work_root_replacement_replaces_middle_child_between_stable_siblings() {
    let mut fixture =
        root_replacement_text_to_component_between_stable_siblings_execution_fixture(false);
    let operations_before_execute = fixture.operations_before_execute.clone();

    let diagnostic = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        fixture.request,
        &mut fixture.host_work,
    )
    .unwrap();

    assert_eq!(diagnostic.root(), fixture.root_id);
    assert_eq!(
        diagnostic.finished_work(),
        fixture.update_render.finished_work()
    );
    assert_eq!(diagnostic.deleted_current(), fixture.deleted_current);
    assert_eq!(
        diagnostic.replacement_child(),
        fixture.replacement_component
    );
    assert_eq!(
        diagnostic.request().stable_previous_sibling(),
        Some(fixture.stable_previous_work)
    );
    assert_eq!(
        diagnostic.request().stable_previous_sibling_current(),
        Some(fixture.stable_previous_current)
    );
    assert_eq!(
        diagnostic.request().stable_previous_sibling_tag(),
        Some(FiberTag::HostText)
    );
    assert_eq!(
        diagnostic.request().stable_previous_sibling_state_node(),
        fixture.stable_previous_state_node
    );
    assert_eq!(
        diagnostic.request().placement_sibling_status(),
        Some(HostRootPlacementSiblingStatus::InsertBefore)
    );
    assert_eq!(
        diagnostic.request().placement_sibling(),
        Some(fixture.stable_trailing_work)
    );
    assert_eq!(
        diagnostic.request().placement_sibling_state_node(),
        fixture.stable_trailing_state_node
    );
    assert_eq!(
        diagnostic.placement_mutation().kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
    );
    assert_eq!(
        diagnostic.deletion_status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::RemoveChildFromContainer
        )
    );
    assert_eq!(
        diagnostic.placement_status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::InsertInContainerBefore
        )
    );
    assert!(diagnostic.private_test_host_replacement_executed());
    assert_eq!(diagnostic.applied_host_call_count(), 2);
    assert_eq!(diagnostic.recorded_only_count(), 0);
    assert_eq!(diagnostic.deletion_cleanup_apply_count(), 1);
    assert!(!diagnostic.request().public_root_compatibility_claimed());
    assert!(!diagnostic.request().public_renderer_compatibility_claimed());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert!(!diagnostic.native_renderer_compatibility_claimed());
    assert!(
        fixture
            .host_work
            .detached_hosts()
            .text_metadata(fixture.stable_previous_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        !fixture
            .host_work
            .detached_hosts()
            .text_metadata(fixture.deleted_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        fixture
            .host_work
            .detached_hosts()
            .text_metadata(fixture.stable_trailing_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        fixture
            .host_work
            .detached_hosts()
            .instance_metadata(fixture.replacement_component_state_node)
            .unwrap()
            .is_active()
    );
    let mut expected_operations = operations_before_execute;
    expected_operations.push("remove_child_from_container");
    expected_operations.push("insert_in_container_before");
    assert_eq!(fixture.host.operations(), expected_operations);
}
#[test]
fn host_work_root_replacement_rejects_tampered_previous_sibling_evidence_before_host_call() {
    let mut fixture =
        root_replacement_text_to_component_between_stable_siblings_execution_fixture(false);
    let mut tampered_request = fixture.request;
    tampered_request.stable_previous_sibling_state_node = StateNodeHandle::NONE;

    let error = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        tampered_request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootChildReplacementExecutionErrorForCanary::StaleFinishedWorkEvidence {
            root,
            commit_order: 991_102,
            request_order: 991_103,
        } if root == fixture.root_id
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_execute);
}
#[test]
fn host_work_root_replacement_rejects_middle_child_replay_before_second_host_call() {
    let mut fixture =
        root_replacement_text_to_component_between_stable_siblings_execution_fixture(false);

    execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        fixture.request,
        &mut fixture.host_work,
    )
    .unwrap();
    let operations_after_first_execute = fixture.host.operations();

    let error = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        fixture.request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootChildReplacementExecutionErrorForCanary::DuplicateExecution {
            root,
            finished_work,
            request_order: 991_103,
        } if root == fixture.root_id && finished_work == fixture.update_render.finished_work()
    ));
    assert_eq!(fixture.host.operations(), operations_after_first_execute);
}
#[test]
fn host_work_root_replacement_rejects_stale_previous_sibling_before_host_call() {
    let mut fixture =
        root_replacement_text_to_component_between_stable_siblings_execution_fixture(false);
    fixture
        .host_work
        .detached_hosts_mut_for_canary()
        .invalidate_text_for_canary(fixture.stable_previous_state_node)
        .unwrap();

    let error = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        fixture.request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootChildReplacementExecutionErrorForCanary::HostWork(
            HostWorkError::HostNode(ref error)
        ) if error.violation() == HostNodeViolation::Stale
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_execute);

    let retry_error = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        fixture.request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        retry_error,
        TestHostRootChildReplacementExecutionErrorForCanary::HostWork(
            HostWorkError::HostNode(ref error)
        ) if error.violation() == HostNodeViolation::Stale
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_execute);
}
#[test]
fn host_work_root_replacement_rejects_cross_root_previous_sibling_before_host_call() {
    let mut fixture =
        root_replacement_text_to_component_between_stable_siblings_execution_fixture(true);

    let error = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        fixture.request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootChildReplacementExecutionErrorForCanary::HostWork(
            HostWorkError::HostNode(ref error)
        ) if error.violation() == HostNodeViolation::WrongRoot
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_execute);
}
#[test]
fn host_work_root_replacement_rejects_stale_deleted_middle_child_before_host_call() {
    let mut fixture =
        root_replacement_text_to_component_between_stable_siblings_execution_fixture(false);
    fixture
        .host_work
        .detached_hosts_mut_for_canary()
        .invalidate_text_for_canary(fixture.deleted_state_node)
        .unwrap();

    let error = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        fixture.request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootChildReplacementExecutionErrorForCanary::HostWork(
            HostWorkError::HostNode(ref error)
        ) if error.violation() == HostNodeViolation::Stale
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_execute);
}
#[test]
fn host_work_root_replacement_rejects_caller_records_or_missing_cleanup() {
    let mut caller_record_fixture =
        root_replacement_text_to_component_between_stable_siblings_execution_fixture(false);
    let mut caller_shaped_request = caller_record_fixture.request;
    caller_shaped_request.deletion_mutation = caller_shaped_request.placement_mutation;

    let caller_record_error = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut caller_record_fixture.store,
        &mut caller_record_fixture.host,
        &caller_record_fixture.handoff,
        caller_shaped_request,
        caller_shaped_request,
        &mut caller_record_fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        caller_record_error,
        TestHostRootChildReplacementExecutionErrorForCanary::StaleFinishedWorkEvidence {
            root,
            commit_order: 991_102,
            request_order: 991_103,
        } if root == caller_record_fixture.root_id
    ));
    assert_eq!(
        caller_record_fixture.host.operations(),
        caller_record_fixture.operations_before_execute
    );

    let mut cleanup_fixture =
        root_replacement_text_to_component_between_stable_siblings_execution_fixture(false);
    let mut missing_cleanup_request = cleanup_fixture.request;
    missing_cleanup_request.deletion_cleanup_record_count = 0;

    let missing_cleanup_error = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut cleanup_fixture.store,
        &mut cleanup_fixture.host,
        &cleanup_fixture.handoff,
        missing_cleanup_request,
        missing_cleanup_request,
        &mut cleanup_fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        missing_cleanup_error,
        TestHostRootChildReplacementExecutionErrorForCanary::StaleFinishedWorkEvidence {
            root,
            commit_order: 991_102,
            request_order: 991_103,
        } if root == cleanup_fixture.root_id
    ));
    assert_eq!(
        cleanup_fixture.host.operations(),
        cleanup_fixture.operations_before_execute
    );
}
#[test]
fn host_work_root_replacement_rejects_duplicate_execution_before_second_host_call() {
    let mut fixture = root_replacement_text_to_component_execution_fixture();

    execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        fixture.request,
        &mut fixture.host_work,
    )
    .unwrap();
    let operations_after_first_execute = fixture.host.operations();

    let error = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        fixture.request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootChildReplacementExecutionErrorForCanary::DuplicateExecution {
            root,
            finished_work,
            request_order: 954_103,
        } if root == fixture.root_id && finished_work == fixture.update_render.finished_work()
    ));
    assert_eq!(fixture.host.operations(), operations_after_first_execute);
}
#[test]
fn host_work_root_replacement_preflights_stale_deleted_descendant_cleanup_before_host_call() {
    let (mut fixture, deleted_text_state_node) =
        root_replacement_component_to_text_execution_fixture();
    fixture
        .host_work
        .detached_hosts_mut_for_canary()
        .invalidate_text_for_canary(deleted_text_state_node)
        .unwrap();

    let error = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        fixture.request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootChildReplacementExecutionErrorForCanary::HostWork(
            HostWorkError::HostNode(ref error)
        ) if error.violation() == HostNodeViolation::Stale
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_execute);

    let retry_error = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        fixture.request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        retry_error,
        TestHostRootChildReplacementExecutionErrorForCanary::HostWork(
            HostWorkError::HostNode(ref error)
        ) if error.violation() == HostNodeViolation::Stale
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_execute);
}
#[test]
fn host_work_root_replacement_request_rejects_same_tag_root_delete_and_place() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let initial_render =
        render_test_root(&mut store, root_id, RootElementHandle::from_raw(954_301));
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        initial_render.finished_work(),
        "same-tag old text",
        FiberFlags::PLACEMENT,
    );
    let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &initial_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(954_302));
    let replacement_text = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        update_render.finished_work(),
        "same-tag replacement text",
        FiberFlags::PLACEMENT,
    );
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(update_render.finished_work(), current_text)
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(update_render.finished_work(), &[replacement_text])
        .unwrap();
    complete_host_root(&mut store, update_render.finished_work()).unwrap();

    let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        954_303,
        954_304,
    )
    .unwrap();
    let records = handoff.commit().mutation_apply_log().records();
    assert_eq!(records.len(), 2);
    assert_eq!(
        records[0].kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
    );
    assert_eq!(
        records[1].kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
    );
    assert_eq!(records[0].tag(), FiberTag::HostText);
    assert_eq!(records[1].tag(), FiberTag::HostText);

    let error =
        test_host_root_child_replacement_execution_request_for_canary(&store, &handoff, 954_305)
            .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootChildReplacementExecutionErrorForCanary::SameTagReplacement {
            root,
            finished_work,
            tag: FiberTag::HostText,
        } if root == root_id && finished_work == update_render.finished_work()
    ));
}
#[test]
fn host_work_root_replacement_request_rejects_unsupported_multi_level_host_placement() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let initial_render =
        render_test_root(&mut store, root_id, RootElementHandle::from_raw(954_311));
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        initial_render.finished_work(),
        "deleted root text",
        FiberFlags::PLACEMENT,
    );
    let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &initial_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(954_312));
    let mode = store
        .fiber_arena()
        .get(update_render.finished_work())
        .unwrap()
        .mode();
    let function_component = store.fiber_arena_mut().create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(954_313),
        mode,
    );
    store
        .fiber_arena_mut()
        .get_mut(function_component)
        .unwrap()
        .set_fiber_type(FiberTypeHandle::from_raw(954_314));
    let nested_text = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        update_render.finished_work(),
        "nested replacement",
        FiberFlags::PLACEMENT,
    );
    store
        .fiber_arena_mut()
        .set_children(function_component, &[nested_text])
        .unwrap();
    complete_function_component_parent(&mut store, function_component).unwrap();
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(update_render.finished_work(), current_text)
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(update_render.finished_work(), &[function_component])
        .unwrap();
    complete_host_root(&mut store, update_render.finished_work()).unwrap();

    let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        954_315,
        954_316,
    )
    .unwrap();
    let records = handoff.commit().mutation_apply_log().records();
    assert_eq!(records.len(), 2);
    assert_eq!(
        records[0].kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
    );
    assert_eq!(
        records[1].kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
    );
    assert_eq!(records[1].fiber(), nested_text);
    assert_eq!(records[1].parent(), update_render.finished_work());
    assert_eq!(records[1].parent_tag(), FiberTag::HostRoot);
    assert_eq!(
        store
            .fiber_arena()
            .get(update_render.finished_work())
            .unwrap()
            .child(),
        Some(function_component)
    );

    let error =
        test_host_root_child_replacement_execution_request_for_canary(&store, &handoff, 954_317)
            .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootChildReplacementExecutionErrorForCanary::UnsupportedReplacementEvidence {
            root,
            finished_work,
        } if root == root_id && finished_work == update_render.finished_work()
    ));
}
#[test]
fn host_work_root_replacement_rejects_cloned_or_tampered_request_before_host_call() {
    let mut fixture = root_replacement_text_to_component_execution_fixture();
    let mut cloned_request = fixture.request;
    cloned_request.source_handoff_order += 1;

    let error = execute_test_host_root_child_replacement_after_commit_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.handoff,
        fixture.request,
        cloned_request,
        &mut fixture.host_work,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootChildReplacementExecutionErrorForCanary::StaleFinishedWorkEvidence {
            root,
            commit_order: 954_102,
            request_order: 954_103,
        } if root == fixture.root_id
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_execute);
}
#[test]
fn host_work_root_replacement_rejects_stale_current_child_before_creating_replacement() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_text("stale root text");
    let initial_render = render_test_root(&mut store, root_id, initial_element);
    let mut initial_host_work =
        mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
    let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
    apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        &initial_commit,
        &mut initial_host_work,
    )
    .unwrap();
    let current_text = initial_host_work.root_child().unwrap();
    let current_text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    initial_host_work
        .detached_hosts_mut_for_canary()
        .invalidate_text_for_canary(current_text_state_node)
        .unwrap();
    let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
    let next_element = source.insert_host_element_with_text("section", "replacement");
    let update_render = render_test_root(&mut store, root_id, next_element);
    let operations_before_replace = host.operations();

    let error = replace_test_host_root_child_work_with_detached_hosts_for_canary(
        &mut store,
        &mut host,
        update_render,
        &source,
        detached_hosts,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::HostNode(ref error) if error.violation() == HostNodeViolation::Stale
    ));
    assert_eq!(host.operations(), operations_before_replace);
}
#[test]
fn host_work_root_replacement_rejects_cross_root_detached_hosts_before_host_call() {
    let (mut store, first_root) = root_store();
    let second_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();

    let first_element = source.insert_text("first root text");
    let first_render = render_test_root(&mut store, first_root, first_element);
    let mut first_host_work =
        mount_test_host_work(&mut store, &mut host, first_render, &source).unwrap();
    let first_commit = commit_finished_host_root(&mut store, first_render).unwrap();
    apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        &first_commit,
        &mut first_host_work,
    )
    .unwrap();

    let second_element = source.insert_text("second root text");
    let second_render = render_test_root(&mut store, second_root, second_element);
    let mut second_host_work =
        mount_test_host_work(&mut store, &mut host, second_render, &source).unwrap();
    let second_commit = commit_finished_host_root(&mut store, second_render).unwrap();
    apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        &second_commit,
        &mut second_host_work,
    )
    .unwrap();

    let wrong_detached_hosts = first_host_work.into_detached_hosts_for_canary();
    let next_element = source.insert_host_element_with_text("section", "wrong root");
    let update_render = render_test_root(&mut store, second_root, next_element);
    let operations_before_replace = host.operations();

    let error = replace_test_host_root_child_work_with_detached_hosts_for_canary(
        &mut store,
        &mut host,
        update_render,
        &source,
        wrong_detached_hosts,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::HostNode(ref error) if error.violation() == HostNodeViolation::WrongRoot
    ));
    assert_eq!(host.operations(), operations_before_replace);
}
#[test]
fn host_work_root_replacement_rejects_same_tag_multi_level_replacement_claim() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("article", "old nested text");
    let initial_render = render_test_root(&mut store, root_id, initial_element);
    let mut initial_host_work =
        mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
    let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
    apply_test_host_root_commit_mutations_for_canary(
        &mut store,
        &mut host,
        &initial_commit,
        &mut initial_host_work,
    )
    .unwrap();

    let current_component = initial_host_work.root_child().unwrap();
    let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
    let next_element = source.insert_host_element_with_text("article", "new nested text");
    let update_render = render_test_root(&mut store, root_id, next_element);
    let operations_before_replace = host.operations();

    let error = replace_test_host_root_child_work_with_detached_hosts_for_canary(
        &mut store,
        &mut host,
        update_render,
        &source,
        detached_hosts,
    )
    .unwrap_err();

    assert_eq!(
        error,
        HostWorkError::ExpectedRootChildReplacement {
            root: root_id,
            current: initial_render.finished_work(),
            current_child: current_component,
            current_tag: FiberTag::HostComponent,
            next_tag: FiberTag::HostComponent,
        }
    );
    assert_eq!(host.operations(), operations_before_replace);
}
