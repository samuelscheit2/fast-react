use super::helpers::*;
use super::*;

#[test]
fn root_commit_dangerous_html_text_reset_handoff_validates_complete_work_before_commit() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_dangerous_html_text_reset_commit_fixture(
        &mut store,
        root_id,
        HostComponentDangerousHtmlTextResetPayloadKindForCanary::DangerousHtml,
        9_880,
    );

    let handoff = commit_dangerous_html_text_reset_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        92,
        93,
    )
    .unwrap();
    let request = *handoff.execution_request();
    let mutation = handoff.mutation();

    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.finished_work(), fixture.render.finished_work());
    assert_eq!(handoff.source_handoff_order(), 91);
    assert_eq!(handoff.commit_order(), 92);
    assert_eq!(handoff.request_order(), 93);
    assert_eq!(
        handoff.payload_kind(),
        HostComponentDangerousHtmlTextResetPayloadKindForCanary::DangerousHtml
    );
    assert_eq!(handoff.payload_kind_name(), "dangerous-html");
    assert_eq!(request.root(), root_id);
    assert_eq!(request.root_token(), root_id.state_node_handle());
    assert_eq!(request.previous_current(), fixture.render.current());
    assert_eq!(request.finished_work(), fixture.render.finished_work());
    assert_eq!(request.committed_current(), fixture.render.finished_work());
    assert_eq!(request.mutation_index(), 0);
    assert_eq!(request.mutation(), mutation);
    assert_eq!(request.complete_work(), fixture.complete_work);
    assert_eq!(
        request.payload_kind(),
        HostComponentDangerousHtmlTextResetPayloadKindForCanary::DangerousHtml
    );
    assert_eq!(
        request.status(),
        HostRootDangerousHtmlTextResetCommitExecutionStatusForCanary::ValidatedForTestHostMutation
    );
    assert_eq!(
        request.blockers(),
        &HOST_ROOT_DANGEROUS_HTML_TEXT_RESET_COMMIT_EXECUTION_BLOCKERS
    );
    assert!(request.private_test_host_mutation_allowed());
    assert!(request.public_root_rendering_blocked());
    assert!(request.public_renderer_mutation_blocked());
    assert!(!request.public_dom_compatibility_claimed());
    assert!(!request.test_renderer_compatibility_claimed());
    assert!(handoff.complete_metadata_matches_mutation());
    assert!(handoff.private_test_host_mutation_allowed());
    assert!(handoff.public_root_rendering_blocked());
    assert!(handoff.public_renderer_mutation_blocked());
    assert!(!handoff.public_dom_compatibility_claimed());
    assert!(!handoff.test_renderer_compatibility_claimed());
    assert_eq!(mutation.root(), root_id);
    assert_eq!(mutation.host_root(), fixture.render.finished_work());
    assert_eq!(mutation.fiber(), fixture.work_in_progress_component);
    assert_eq!(mutation.alternate_fiber(), Some(fixture.current_component));
    assert_eq!(mutation.state_node(), fixture.state_node);
    assert_eq!(mutation.pending_props(), fixture.new_props);
    assert_eq!(mutation.memoized_props(), fixture.new_props);
    assert_eq!(mutation.alternate_memoized_props(), Some(fixture.old_props));
    assert_eq!(
        mutation.kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(handoff.commit().mutation_apply_log().len(), 1);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_dangerous_html_text_reset_handoff_rejects_stale_complete_work_before_switching_current()
 {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_dangerous_html_text_reset_commit_fixture(
        &mut store,
        root_id,
        HostComponentDangerousHtmlTextResetPayloadKindForCanary::TextContentReset,
        9_900,
    );
    let previous_current = store.root(root_id).unwrap().current();
    let stale_complete_work = fixture
        .complete_work
        .with_new_props_for_canary(PropsHandle::from_raw(99_903));

    let error = commit_dangerous_html_text_reset_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        stale_complete_work,
        0,
        94,
        95,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary::MetadataPropsMismatch {
            root,
            fiber,
            expected_old_props,
            expected_new_props,
            actual_pending_props,
            actual_memoized_props,
            ..
        } if root == root_id
            && fiber == fixture.work_in_progress_component
            && expected_old_props == fixture.old_props
            && expected_new_props == PropsHandle::from_raw(99_903)
            && actual_pending_props == fixture.new_props
            && actual_memoized_props == fixture.new_props
    ));
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_managed_child_placement_handoff_validates_before_commit() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_managed_child_placement_commit_fixture(&mut store, root_id, 29_100);

    let handoff = commit_managed_child_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        122,
        123,
    )
    .unwrap();
    let request = *handoff.execution_request();
    let mutation = handoff.mutation();

    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.finished_work(), fixture.render.finished_work());
    assert_eq!(handoff.source_handoff_order(), 121);
    assert_eq!(handoff.commit_order(), 122);
    assert_eq!(handoff.request_order(), 123);
    assert_eq!(
        handoff.kind(),
        HostComponentManagedChildMutationKindForCanary::Placement
    );
    assert_eq!(handoff.kind_name(), "managed-child-placement");
    assert_eq!(request.root(), root_id);
    assert_eq!(request.root_token(), root_id.state_node_handle());
    assert_eq!(request.previous_current(), fixture.previous_current);
    assert_eq!(request.finished_work(), fixture.render.finished_work());
    assert_eq!(request.committed_current(), fixture.render.finished_work());
    assert_eq!(request.mutation_index(), 0);
    assert_eq!(request.mutation(), mutation);
    assert_eq!(request.complete_work(), fixture.complete_work);
    assert_eq!(
        request.kind(),
        HostComponentManagedChildMutationKindForCanary::Placement
    );
    assert_eq!(
        request.status(),
        HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation
    );
    assert_eq!(
        request.blockers(),
        &HOST_ROOT_MANAGED_CHILD_COMMIT_EXECUTION_BLOCKERS
    );
    assert!(request.private_test_host_mutation_allowed());
    assert!(request.public_root_rendering_blocked());
    assert!(request.public_renderer_mutation_blocked());
    assert!(!request.public_dom_compatibility_claimed());
    assert!(!request.test_renderer_compatibility_claimed());
    assert!(!request.hydration_events_refs_resources_forms_claimed());
    assert_eq!(handoff.complete_work(), fixture.complete_work);
    assert!(handoff.complete_metadata_matches_mutation());
    assert!(handoff.private_test_host_mutation_allowed());
    assert!(handoff.public_root_rendering_blocked());
    assert!(handoff.public_renderer_mutation_blocked());
    assert!(!handoff.public_dom_compatibility_claimed());
    assert!(!handoff.test_renderer_compatibility_claimed());
    assert_eq!(mutation.root(), root_id);
    assert_eq!(mutation.host_root(), fixture.render.finished_work());
    assert_eq!(
        mutation.source(),
        HostRootMutationApplyRecordSource::MutationPhase(
            HostRootMutationPhaseRecordKind::Placement
        )
    );
    assert_eq!(
        mutation.kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToHostParent
    );
    assert_eq!(mutation.parent(), fixture.work_parent);
    assert_eq!(mutation.parent_tag(), FiberTag::HostComponent);
    assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
    assert_eq!(mutation.fiber(), fixture.child);
    assert_eq!(mutation.alternate_fiber(), None);
    assert_eq!(mutation.tag(), FiberTag::HostComponent);
    assert_eq!(mutation.state_node(), fixture.child_state_node);
    assert_eq!(mutation.pending_props(), fixture.child_props);
    assert_eq!(mutation.memoized_props(), fixture.child_props);
    assert_eq!(mutation.effect_flag(), FiberFlags::PLACEMENT);
    assert_eq!(
        mutation.placement_sibling().unwrap().status(),
        HostRootPlacementSiblingStatus::Append
    );
    assert_eq!(handoff.commit().mutation_apply_log().len(), 1);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_managed_child_delete_handoff_validates_before_commit() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_managed_child_delete_commit_fixture(&mut store, root_id, 29_200);

    let handoff = commit_managed_child_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        132,
        133,
    )
    .unwrap();
    let request = *handoff.execution_request();
    let mutation = handoff.mutation();

    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.finished_work(), fixture.render.finished_work());
    assert_eq!(handoff.source_handoff_order(), 131);
    assert_eq!(handoff.commit_order(), 132);
    assert_eq!(handoff.request_order(), 133);
    assert_eq!(
        handoff.kind(),
        HostComponentManagedChildMutationKindForCanary::DeleteDetach
    );
    assert_eq!(handoff.kind_name(), "managed-child-delete-detach");
    assert_eq!(request.root(), root_id);
    assert_eq!(request.root_token(), root_id.state_node_handle());
    assert_eq!(request.previous_current(), fixture.previous_current);
    assert_eq!(request.finished_work(), fixture.render.finished_work());
    assert_eq!(request.committed_current(), fixture.render.finished_work());
    assert_eq!(request.mutation_index(), 0);
    assert_eq!(request.mutation(), mutation);
    assert_eq!(request.complete_work(), fixture.complete_work);
    assert_eq!(
        request.kind(),
        HostComponentManagedChildMutationKindForCanary::DeleteDetach
    );
    assert_eq!(
        request.status(),
        HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation
    );
    assert_eq!(
        request.blockers(),
        &HOST_ROOT_MANAGED_CHILD_COMMIT_EXECUTION_BLOCKERS
    );
    assert!(request.private_test_host_mutation_allowed());
    assert!(request.public_root_rendering_blocked());
    assert!(request.public_renderer_mutation_blocked());
    assert!(!request.public_dom_compatibility_claimed());
    assert!(!request.test_renderer_compatibility_claimed());
    assert!(!request.hydration_events_refs_resources_forms_claimed());
    assert!(handoff.complete_metadata_matches_mutation());
    assert!(handoff.private_test_host_mutation_allowed());
    assert!(handoff.public_root_rendering_blocked());
    assert!(handoff.public_renderer_mutation_blocked());
    assert!(!handoff.public_dom_compatibility_claimed());
    assert!(!handoff.test_renderer_compatibility_claimed());
    assert_eq!(mutation.root(), root_id);
    assert_eq!(mutation.host_root(), fixture.render.finished_work());
    assert_eq!(
        mutation.source(),
        HostRootMutationApplyRecordSource::DeletionList(fixture.deletion_list.unwrap())
    );
    assert_eq!(
        mutation.kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(mutation.parent(), fixture.work_parent);
    assert_eq!(mutation.parent_tag(), FiberTag::HostComponent);
    assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
    assert_eq!(mutation.fiber(), fixture.child);
    assert_eq!(mutation.alternate_fiber(), None);
    assert_eq!(mutation.tag(), FiberTag::HostComponent);
    assert_eq!(mutation.state_node(), fixture.child_state_node);
    assert_eq!(mutation.pending_props(), fixture.child_props);
    assert_eq!(mutation.memoized_props(), fixture.child_props);
    assert_eq!(mutation.effect_flag(), FiberFlags::CHILD_DELETION);
    assert_eq!(mutation.placement_sibling(), None);
    assert_eq!(handoff.commit().mutation_apply_log().len(), 1);
    assert_eq!(handoff.commit().deletion_lists().len(), 1);
    assert_eq!(
        handoff.commit().deletion_lists()[0].list(),
        fixture.deletion_list.unwrap()
    );
    assert_eq!(
        handoff.commit().deletion_lists()[0].deleted(),
        &[fixture.child]
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_managed_child_handoff_rejects_foreign_root_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_managed_child_placement_commit_fixture(&mut store, root_id, 29_300);
    let foreign_root = FiberRootId::new(root_id.raw() + 1).unwrap();
    let foreign_complete_work = fixture.complete_work.with_root_for_canary(foreign_root);

    let error = commit_managed_child_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        foreign_complete_work,
        0,
        142,
        143,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataRootMismatch {
            expected_root,
            actual_root,
        } if expected_root == root_id && actual_root == foreign_root
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_managed_child_handoff_rejects_mismatched_child_state_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_managed_child_delete_commit_fixture(&mut store, root_id, 29_400);
    let stale_state_node = StateNodeHandle::from_raw(29_499);
    let stale_complete_work = fixture
        .complete_work
        .with_child_state_node_for_canary(stale_state_node);

    let error = commit_managed_child_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        stale_complete_work,
        0,
        152,
        153,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildStateNodeMismatch {
            root,
            child,
            expected_state_node,
            actual_state_node,
        } if root == root_id
            && child == fixture.child
            && expected_state_node == stale_state_node
            && actual_state_node == fixture.child_state_node
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_managed_child_handoff_rejects_stale_props_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_managed_child_placement_commit_fixture(&mut store, root_id, 29_500);
    let stale_props = PropsHandle::from_raw(29_599);
    let stale_complete_work = fixture
        .complete_work
        .with_child_memoized_props_for_canary(stale_props);

    let error = commit_managed_child_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        stale_complete_work,
        0,
        162,
        163,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildPropsMismatch {
            root,
            child,
            expected_pending_props,
            expected_memoized_props,
            actual_pending_props,
            actual_memoized_props,
        } if root == root_id
            && child == fixture.child
            && expected_pending_props == fixture.child_props
            && expected_memoized_props == stale_props
            && actual_pending_props == fixture.child_props
            && actual_memoized_props == fixture.child_props
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_managed_child_handoff_rejects_tampered_parent_state_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_managed_child_placement_commit_fixture(&mut store, root_id, 29_600);
    let tampered_parent_state_node = StateNodeHandle::from_raw(29_699);
    let tampered_complete_work = fixture
        .complete_work
        .with_parent_state_node_for_canary(tampered_parent_state_node);

    let error = commit_managed_child_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        tampered_complete_work,
        0,
        172,
        173,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataParentStateNodeMismatch {
            root,
            parent,
            expected_state_node,
            actual_state_node,
        } if root == root_id
            && parent == fixture.work_parent
            && expected_state_node == tampered_parent_state_node
            && actual_state_node == fixture.parent_state_node
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_managed_child_handoff_rejects_tampered_delete_list_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_managed_child_delete_commit_fixture(&mut store, root_id, 29_700);
    let actual_deletion_list = fixture.deletion_list.unwrap();
    let tampered_deletion_list = DeletionListId::new(
        actual_deletion_list.arena_id(),
        actual_deletion_list.index() + 1,
    );
    let tampered_complete_work = fixture
        .complete_work
        .with_deletion_list_for_canary(Some(tampered_deletion_list));

    let error = commit_managed_child_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        tampered_complete_work,
        0,
        182,
        183,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataDeletionListMismatch {
            root,
            fiber,
            expected,
            actual,
        } if root == root_id
            && fiber == fixture.child
            && expected == Some(tampered_deletion_list)
            && actual == HostRootMutationApplyRecordSource::DeletionList(actual_deletion_list)
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_managed_child_sibling_order_placement_handoff_validates_insert_before() {
    let (mut store, root_id, host) = root_store();
    let fixture =
        prepare_managed_child_placement_sibling_order_commit_fixture(&mut store, root_id, 29_800);

    let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        222,
        223,
    )
    .unwrap();
    let request = *handoff.execution_request();
    let mutation = handoff.mutation();
    let placement_sibling = mutation.placement_sibling().unwrap();

    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.finished_work(), fixture.render.finished_work());
    assert_eq!(handoff.source_handoff_order(), 221);
    assert_eq!(handoff.commit_order(), 222);
    assert_eq!(handoff.request_order(), 223);
    assert_eq!(
        handoff.kind(),
        HostComponentManagedChildMutationKindForCanary::Placement
    );
    assert_eq!(handoff.order_evidence_name(), "next-sibling");
    assert_eq!(handoff.order_sibling(), fixture.order_sibling);
    assert_eq!(
        handoff.order_sibling_state_node(),
        fixture.order_sibling_state_node
    );
    assert_eq!(request.root(), root_id);
    assert_eq!(request.root_token(), root_id.state_node_handle());
    assert_eq!(request.previous_current(), fixture.previous_current);
    assert_eq!(request.finished_work(), fixture.render.finished_work());
    assert_eq!(request.committed_current(), fixture.render.finished_work());
    assert_eq!(request.mutation_index(), 0);
    assert_eq!(request.mutation(), mutation);
    assert_eq!(request.complete_work(), fixture.complete_work);
    assert_eq!(request.order_sibling(), fixture.order_sibling);
    assert_eq!(
        request.order_sibling_state_node(),
        fixture.order_sibling_state_node
    );
    assert_eq!(request.order_evidence_name(), "next-sibling");
    assert_eq!(
        request.status(),
        HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation
    );
    assert_eq!(
        request.blockers(),
        &HOST_ROOT_MANAGED_CHILD_COMMIT_EXECUTION_BLOCKERS
    );
    assert!(request.private_test_host_mutation_allowed());
    assert!(request.public_root_rendering_blocked());
    assert!(request.public_renderer_mutation_blocked());
    assert!(!request.public_dom_compatibility_claimed());
    assert!(!request.test_renderer_compatibility_claimed());
    assert!(!request.hydration_events_refs_resources_forms_claimed());
    assert!(handoff.complete_metadata_matches_mutation());
    assert!(handoff.private_test_host_mutation_allowed());
    assert!(handoff.public_root_rendering_blocked());
    assert!(handoff.public_renderer_mutation_blocked());
    assert!(!handoff.public_dom_compatibility_claimed());
    assert!(!handoff.test_renderer_compatibility_claimed());
    assert_eq!(
        mutation.source(),
        HostRootMutationApplyRecordSource::MutationPhase(
            HostRootMutationPhaseRecordKind::Placement
        )
    );
    assert_eq!(
        mutation.kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
    );
    assert_eq!(mutation.parent(), fixture.work_parent);
    assert_eq!(mutation.parent_tag(), FiberTag::HostComponent);
    assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
    assert_eq!(mutation.fiber(), fixture.child);
    assert_eq!(mutation.alternate_fiber(), None);
    assert_eq!(mutation.tag(), FiberTag::HostComponent);
    assert_eq!(mutation.state_node(), fixture.child_state_node);
    assert_eq!(mutation.pending_props(), fixture.child_props);
    assert_eq!(mutation.memoized_props(), fixture.child_props);
    assert_eq!(mutation.effect_flag(), FiberFlags::PLACEMENT);
    assert_eq!(
        placement_sibling.status(),
        HostRootPlacementSiblingStatus::InsertBefore
    );
    assert_eq!(placement_sibling.sibling(), Some(fixture.order_sibling));
    assert_eq!(
        placement_sibling.sibling_tag(),
        Some(FiberTag::HostComponent)
    );
    assert_eq!(
        placement_sibling.sibling_state_node(),
        fixture.order_sibling_state_node
    );
    assert_eq!(placement_sibling.skipped_pending_sibling_count(), 0);
    assert!(placement_sibling.can_insert_before());
    assert_eq!(handoff.commit().mutation_apply_log().len(), 1);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_managed_child_sibling_order_delete_handoff_validates_previous_sibling() {
    let (mut store, root_id, host) = root_store();
    let fixture =
        prepare_managed_child_delete_sibling_order_commit_fixture(&mut store, root_id, 29_900);

    let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        232,
        233,
    )
    .unwrap();
    let request = *handoff.execution_request();
    let mutation = handoff.mutation();

    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.finished_work(), fixture.render.finished_work());
    assert_eq!(handoff.source_handoff_order(), 231);
    assert_eq!(handoff.commit_order(), 232);
    assert_eq!(handoff.request_order(), 233);
    assert_eq!(
        handoff.kind(),
        HostComponentManagedChildMutationKindForCanary::DeleteDetach
    );
    assert_eq!(handoff.order_evidence_name(), "previous-sibling");
    assert_eq!(handoff.order_sibling(), fixture.order_sibling);
    assert_eq!(request.order_evidence_name(), "previous-sibling");
    assert_eq!(request.order_sibling(), fixture.order_sibling);
    assert_eq!(
        request.status(),
        HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation
    );
    assert_eq!(
        request.blockers(),
        &HOST_ROOT_MANAGED_CHILD_COMMIT_EXECUTION_BLOCKERS
    );
    assert!(handoff.complete_metadata_matches_mutation());
    assert_eq!(
        mutation.source(),
        HostRootMutationApplyRecordSource::DeletionList(fixture.deletion_list.unwrap())
    );
    assert_eq!(
        mutation.kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(mutation.parent(), fixture.work_parent);
    assert_eq!(mutation.parent_tag(), FiberTag::HostComponent);
    assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
    assert_eq!(mutation.fiber(), fixture.child);
    assert_eq!(mutation.tag(), FiberTag::HostComponent);
    assert_eq!(mutation.state_node(), fixture.child_state_node);
    assert_eq!(mutation.pending_props(), fixture.child_props);
    assert_eq!(mutation.memoized_props(), fixture.child_props);
    assert_eq!(mutation.effect_flag(), FiberFlags::CHILD_DELETION);
    assert_eq!(mutation.placement_sibling(), None);
    assert_eq!(
        store
            .fiber_arena()
            .get(fixture.order_sibling_current)
            .unwrap()
            .sibling(),
        Some(fixture.child)
    );
    assert_eq!(handoff.commit().mutation_apply_log().len(), 1);
    assert_eq!(handoff.commit().deletion_lists().len(), 1);
    assert_eq!(
        handoff.commit().deletion_lists()[0].list(),
        fixture.deletion_list.unwrap()
    );
    assert_eq!(
        handoff.commit().deletion_lists()[0].deleted(),
        &[fixture.child]
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_managed_child_sibling_order_rejects_tampered_order_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let fixture =
        prepare_managed_child_placement_sibling_order_commit_fixture(&mut store, root_id, 30_000);
    store
        .fiber_arena_mut()
        .set_children(fixture.work_parent, &[fixture.order_sibling, fixture.child])
        .unwrap();

    let error = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        242,
        243,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingMismatch {
            root,
            fiber,
            expected_sibling,
            actual_sibling,
        } if root == root_id
            && fiber == fixture.child
            && expected_sibling == fixture.order_sibling
            && actual_sibling == None
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_managed_child_sibling_order_rejects_foreign_root_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let fixture =
        prepare_managed_child_placement_sibling_order_commit_fixture(&mut store, root_id, 30_050);
    let foreign_root = FiberRootId::new(root_id.raw() + 1).unwrap();
    let foreign_complete_work = fixture.complete_work.with_root_for_canary(foreign_root);

    let error = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        foreign_complete_work,
        0,
        247,
        248,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataRootMismatch {
            expected_root,
            actual_root,
        } if expected_root == root_id && actual_root == foreign_root
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_managed_child_sibling_order_rejects_tampered_parent_state_before_switching_current()
{
    let (mut store, root_id, host) = root_store();
    let fixture =
        prepare_managed_child_placement_sibling_order_commit_fixture(&mut store, root_id, 30_075);
    let stale_parent_state_node = StateNodeHandle::from_raw(30_079);
    let stale_parent = fixture
        .complete_work
        .with_parent_state_node_for_canary(stale_parent_state_node);

    let error = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        stale_parent,
        0,
        249,
        250,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataParentStateNodeMismatch {
            root,
            parent,
            expected_state_node,
            actual_state_node,
        } if root == root_id
            && parent == fixture.work_parent
            && expected_state_node == stale_parent_state_node
            && actual_state_node == fixture.parent_state_node
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_managed_child_sibling_order_rejects_tampered_child_state_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let fixture =
        prepare_managed_child_placement_sibling_order_commit_fixture(&mut store, root_id, 30_090);
    let stale_child_state_node = StateNodeHandle::from_raw(30_099);
    let stale_child = fixture
        .complete_work
        .with_child_state_node_for_canary(stale_child_state_node);

    let error = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        stale_child,
        0,
        250,
        251,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildStateNodeMismatch {
            root,
            child,
            expected_state_node,
            actual_state_node,
        } if root == root_id
            && child == fixture.child
            && expected_state_node == stale_child_state_node
            && actual_state_node == fixture.child_state_node
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_managed_child_sibling_order_rejects_tampered_sibling_state_before_switching_current()
{
    let (mut store, root_id, host) = root_store();
    let fixture =
        prepare_managed_child_placement_sibling_order_commit_fixture(&mut store, root_id, 30_100);
    let stale_state_node = StateNodeHandle::from_raw(30_199);
    let stale_sibling = fixture
        .complete_work
        .with_order_sibling_state_node_for_canary(stale_state_node);

    let error = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        stale_sibling,
        0,
        252,
        253,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingStateNodeMismatch {
            root,
            sibling,
            expected_state_node,
            actual_state_node,
        } if root == root_id
            && sibling == fixture.order_sibling
            && expected_state_node == stale_state_node
            && actual_state_node == fixture.order_sibling_state_node
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_managed_child_sibling_order_rejects_tampered_delete_list_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let fixture =
        prepare_managed_child_delete_sibling_order_commit_fixture(&mut store, root_id, 30_200);
    let actual_deletion_list = fixture.deletion_list.unwrap();
    let tampered_deletion_list = DeletionListId::new(
        actual_deletion_list.arena_id(),
        actual_deletion_list.index() + 1,
    );
    let stale_delete_list = fixture
        .complete_work
        .with_deletion_list_for_canary(Some(tampered_deletion_list));

    let error = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        stale_delete_list,
        0,
        262,
        263,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootManagedChildCommitHandoffErrorForCanary::MetadataDeletionListMismatch {
            root,
            fiber,
            expected,
            actual,
        } if root == root_id
            && fiber == fixture.child
            && expected == Some(tampered_deletion_list)
            && actual == HostRootMutationApplyRecordSource::DeletionList(actual_deletion_list)
    ));
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
