use super::*;

const QUEUED_MINIMAL_SOURCE_ORDER: usize = 1_250_001;
const QUEUED_MINIMAL_COMMIT_ORDER: usize = 1_250_002;

#[test]
fn root_work_loop_queued_minimal_host_root_mount_and_same_root_update_consume_root_updates() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let initial = source.insert_host_element_with_text("article", "queued mount");

    let mounted = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        initial,
        QueuedMinimalHostRootUpdatePriority::Default,
        Lanes::DEFAULT,
        &source,
        None,
        QUEUED_MINIMAL_SOURCE_ORDER,
        QUEUED_MINIMAL_COMMIT_ORDER,
    )
    .unwrap();
    let mounted_record = mounted.record();

    assert_eq!(
        mounted_record.phase(),
        QueuedMinimalHostRootCommitPhase::Mount
    );
    assert_eq!(mounted_record.root(), root_id);
    assert_eq!(
        mounted_record.priority(),
        QueuedMinimalHostRootUpdatePriority::Default
    );
    assert_eq!(mounted_record.queued_element(), initial);
    assert_eq!(mounted_record.resulting_element(), initial);
    assert_eq!(mounted_record.render_lanes(), Lanes::DEFAULT);
    assert_eq!(mounted_record.applied_update_count(), 1);
    assert!(mounted_record.proves_queued_update_render_complete_commit());
    assert_eq!(mounted_record.update().schedule().root(), root_id);
    assert_eq!(mounted_record.update().lane(), Lane::DEFAULT);
    assert_eq!(
        mounted_record.commit().root(),
        mounted_record.mutation_apply().root()
    );
    assert_eq!(
        mounted_record.mutation_apply().records()[0]
            .mutation()
            .kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
    );
    assert_eq!(mounted_record.mutation_apply().applied_host_call_count(), 1);
    assert_eq!(current_host_root_element(&store, root_id), initial);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        mounted_record.commit().current()
    );
    assert!(mounted.host_work().root_child().is_some());
    assert!(!mounted_record.react_dom_compatibility_claimed());
    assert!(!mounted_record.test_renderer_compatibility_claimed());

    let updated_element = source.insert_host_element_with_text("article", "queued update");
    let updated = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        updated_element,
        QueuedMinimalHostRootUpdatePriority::Default,
        Lanes::DEFAULT,
        &source,
        Some(mounted.into_host_work()),
        QUEUED_MINIMAL_SOURCE_ORDER + 10,
        QUEUED_MINIMAL_COMMIT_ORDER + 10,
    )
    .unwrap();
    let updated_record = updated.record();
    let update_kinds = updated_record
        .mutation_apply()
        .records()
        .iter()
        .map(|record| record.mutation().kind())
        .collect::<Vec<_>>();

    assert_eq!(
        updated_record.phase(),
        QueuedMinimalHostRootCommitPhase::Update
    );
    assert_eq!(updated_record.queued_element(), updated_element);
    assert_eq!(updated_record.resulting_element(), updated_element);
    assert_eq!(updated_record.applied_update_count(), 1);
    assert!(updated_record.proves_queued_update_render_complete_commit());
    assert!(
        update_kinds.contains(&HostRootMutationApplyRecordKind::CommitHostComponentUpdate)
            || update_kinds.contains(&HostRootMutationApplyRecordKind::CommitHostTextUpdate)
    );
    assert!(updated_record.mutation_apply().applied_host_call_count() >= 1);
    assert_eq!(current_host_root_element(&store, root_id), updated_element);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        updated_record.commit().current()
    );
}

#[test]
fn root_work_loop_queued_minimal_host_root_null_cleanup_consumes_sync_root_update() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let initial = source.insert_host_element_with_text("article", "queued cleanup");
    let mounted = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        initial,
        QueuedMinimalHostRootUpdatePriority::Default,
        Lanes::DEFAULT,
        &source,
        None,
        QUEUED_MINIMAL_SOURCE_ORDER + 20,
        QUEUED_MINIMAL_COMMIT_ORDER + 20,
    )
    .unwrap();
    assert!(
        mounted
            .record()
            .proves_queued_update_render_complete_commit()
    );

    let cleaned = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        RootElementHandle::NONE,
        QueuedMinimalHostRootUpdatePriority::Sync,
        Lanes::SYNC,
        &source,
        Some(mounted.into_host_work()),
        QUEUED_MINIMAL_SOURCE_ORDER + 30,
        QUEUED_MINIMAL_COMMIT_ORDER + 30,
    )
    .unwrap();
    let cleaned_record = cleaned.record();
    let cleanup = cleaned_record.deletion_cleanup().unwrap();

    assert_eq!(
        cleaned_record.phase(),
        QueuedMinimalHostRootCommitPhase::Cleanup
    );
    assert_eq!(
        cleaned_record.priority(),
        QueuedMinimalHostRootUpdatePriority::Sync
    );
    assert_eq!(cleaned_record.queued_element(), RootElementHandle::NONE);
    assert_eq!(cleaned_record.resulting_element(), RootElementHandle::NONE);
    assert_eq!(cleaned_record.render_lanes(), Lanes::SYNC);
    assert_eq!(cleaned_record.applied_update_count(), 1);
    assert!(cleaned_record.proves_queued_update_render_complete_commit());
    assert_eq!(cleaned_record.update().schedule().lane(), Lane::SYNC);
    assert_eq!(
        cleaned_record.mutation_apply().records()[0]
            .mutation()
            .kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
    );
    assert!(cleanup.applied_record_count() >= 2);
    assert_eq!(
        current_host_root_element(&store, root_id),
        RootElementHandle::NONE
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(cleaned_record.commit().current())
            .unwrap()
            .child(),
        None
    );
    assert!(!cleaned_record.public_renderer_package_behavior_exposed());
    assert!(!cleaned_record.react_dom_compatibility_claimed());
    assert!(!cleaned_record.test_renderer_compatibility_claimed());
}

#[test]
fn root_work_loop_queued_minimal_host_root_rejects_wrong_root_previous_host_work_before_enqueue() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first_root = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let second_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let first_element = source.insert_host_element_with_text("section", "first");
    let second_element = source.insert_host_element_with_text("section", "second");
    let mounted = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        first_root,
        first_element,
        QueuedMinimalHostRootUpdatePriority::Default,
        Lanes::DEFAULT,
        &source,
        None,
        QUEUED_MINIMAL_SOURCE_ORDER + 100,
        QUEUED_MINIMAL_COMMIT_ORDER + 100,
    )
    .unwrap();
    let second_current_before = store.root(second_root).unwrap().current();
    let operations_before = host.operations();

    let error = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        second_root,
        second_element,
        QueuedMinimalHostRootUpdatePriority::Default,
        Lanes::DEFAULT,
        &source,
        Some(mounted.into_host_work()),
        QUEUED_MINIMAL_SOURCE_ORDER + 101,
        QUEUED_MINIMAL_COMMIT_ORDER + 101,
    )
    .unwrap_err();

    assert_eq!(
        error,
        QueuedMinimalHostRootCommitError::PreviousHostWorkRootMismatch {
            expected: second_root,
            actual: first_root,
        }
    );
    assert_eq!(host.operations(), operations_before);
    assert_eq!(
        store.root(second_root).unwrap().current(),
        second_current_before
    );
    assert_eq!(
        store.root(second_root).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
}

#[test]
fn root_work_loop_queued_minimal_host_root_rejects_stale_render_lane_before_complete_or_commit() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("main", "stale lane");
    let current_before = store.root(root_id).unwrap().current();

    let error = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        element,
        QueuedMinimalHostRootUpdatePriority::Default,
        Lanes::SYNC,
        &source,
        None,
        QUEUED_MINIMAL_SOURCE_ORDER + 200,
        QUEUED_MINIMAL_COMMIT_ORDER + 200,
    )
    .unwrap_err();

    assert_eq!(
        error,
        QueuedMinimalHostRootCommitError::StaleRenderedUpdate {
            root: root_id,
            queued_element: element,
            rendered_element: RootElementHandle::NONE,
            render_lanes: Lanes::SYNC,
            update_lanes: Lanes::DEFAULT,
            applied_update_count: 0,
        }
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(store.root(root_id).unwrap().current(), current_before);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::DEFAULT
    );
}

#[test]
fn root_work_loop_queued_minimal_host_root_rejects_replayed_finished_work_handoff() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("aside", "replay");
    let mounted = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        element,
        QueuedMinimalHostRootUpdatePriority::Default,
        Lanes::DEFAULT,
        &source,
        None,
        QUEUED_MINIMAL_SOURCE_ORDER + 300,
        QUEUED_MINIMAL_COMMIT_ORDER + 300,
    )
    .unwrap();
    let render = mounted.record().render();
    let pending = mounted.record().finished_work_handoff().pending();

    let error = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        render,
        Some(pending),
        QUEUED_MINIMAL_COMMIT_ORDER + 301,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostRootFinishedWorkCommitHandoffErrorForCanary::AlreadyCommittedFinishedWorkRecord {
            root,
            finished_work,
            ..
        } if root == root_id && finished_work == render.finished_work()
    ));
    assert_eq!(current_host_root_element(&store, root_id), element);
}
