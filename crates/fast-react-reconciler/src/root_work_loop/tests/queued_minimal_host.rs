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
fn root_work_loop_queued_minimal_host_root_rejects_missing_source_element_before_enqueue() {
    let (mut store, root_id, mut host) = root_store();
    let source = TestHostTree::new();
    let missing_element = RootElementHandle::from_raw(1_269_001);
    let snapshot = queued_minimal_host_root_snapshot(&store, &host, root_id);
    assert_eq!(snapshot.current_child, None);
    assert_eq!(snapshot.finished_work, None);
    assert_eq!(snapshot.finished_lanes, Lanes::NO);
    assert_eq!(snapshot.pending_lanes, Lanes::NO);
    assert_eq!(snapshot.render_phase_work, None);
    assert!(snapshot.operations.is_empty());
    assert_eq!(snapshot.element, RootElementHandle::NONE);

    let error = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        missing_element,
        QueuedMinimalHostRootUpdatePriority::Default,
        Lanes::DEFAULT,
        &source,
        None,
        QUEUED_MINIMAL_SOURCE_ORDER + 32,
        QUEUED_MINIMAL_COMMIT_ORDER + 32,
    )
    .unwrap_err();

    assert_eq!(
        error,
        QueuedMinimalHostRootCommitError::MissingRootElement {
            root: root_id,
            element: missing_element,
        }
    );
    assert_queued_minimal_host_root_snapshot(&store, &host, root_id, snapshot);
}

#[test]
fn root_work_loop_queued_minimal_host_root_rejects_text_source_root_before_enqueue() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let text_root = source.insert_text("queued text root");
    let snapshot = queued_minimal_host_root_snapshot(&store, &host, root_id);
    assert_eq!(snapshot.current_child, None);
    assert_eq!(snapshot.finished_work, None);
    assert_eq!(snapshot.finished_lanes, Lanes::NO);
    assert_eq!(snapshot.pending_lanes, Lanes::NO);
    assert_eq!(snapshot.render_phase_work, None);
    assert!(snapshot.operations.is_empty());
    assert_eq!(snapshot.element, RootElementHandle::NONE);

    let error = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        text_root,
        QueuedMinimalHostRootUpdatePriority::Default,
        Lanes::DEFAULT,
        &source,
        None,
        QUEUED_MINIMAL_SOURCE_ORDER + 33,
        QUEUED_MINIMAL_COMMIT_ORDER + 33,
    )
    .unwrap_err();

    assert_eq!(
        error,
        QueuedMinimalHostRootCommitError::ExpectedHostComponentRoot {
            root: root_id,
            element: text_root,
        }
    );
    assert_queued_minimal_host_root_snapshot(&store, &host, root_id, snapshot);
}

#[test]
fn root_work_loop_queued_minimal_host_root_rejects_cleanup_when_live_current_child_is_missing() {
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
        QUEUED_MINIMAL_SOURCE_ORDER + 35,
        QUEUED_MINIMAL_COMMIT_ORDER + 35,
    )
    .unwrap();
    let cleaned = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        RootElementHandle::NONE,
        QueuedMinimalHostRootUpdatePriority::Sync,
        Lanes::SYNC,
        &source,
        Some(mounted.into_host_work()),
        QUEUED_MINIMAL_SOURCE_ORDER + 36,
        QUEUED_MINIMAL_COMMIT_ORDER + 36,
    )
    .unwrap();
    let current = store.root(root_id).unwrap().current();
    let snapshot = queued_minimal_host_root_snapshot(&store, &host, root_id);
    assert_eq!(snapshot.current_child, None);

    let error = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        RootElementHandle::NONE,
        QueuedMinimalHostRootUpdatePriority::Sync,
        Lanes::SYNC,
        &source,
        Some(cleaned.into_host_work()),
        QUEUED_MINIMAL_SOURCE_ORDER + 37,
        QUEUED_MINIMAL_COMMIT_ORDER + 37,
    )
    .unwrap_err();

    assert_eq!(
        error,
        QueuedMinimalHostRootCommitError::MissingCurrentHostRootChildForCleanup {
            root: root_id,
            current,
        }
    );
    assert_queued_minimal_host_root_snapshot(&store, &host, root_id, snapshot);
}

#[test]
fn root_work_loop_queued_minimal_host_root_update_then_null_cleanup_consumes_transferred_work() {
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
        QUEUED_MINIMAL_SOURCE_ORDER + 40,
        QUEUED_MINIMAL_COMMIT_ORDER + 40,
    )
    .unwrap();
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
        QUEUED_MINIMAL_SOURCE_ORDER + 50,
        QUEUED_MINIMAL_COMMIT_ORDER + 50,
    )
    .unwrap();
    let updated_root_child = updated.host_work().root_child().unwrap();
    assert!(
        store
            .fiber_arena()
            .get(updated_root_child)
            .unwrap()
            .alternate()
            .is_some()
    );
    let source_root_child = store
        .fiber_arena()
        .get(updated_root_child)
        .unwrap()
        .alternate()
        .unwrap();
    let updated_text = store
        .fiber_arena()
        .get(updated_root_child)
        .unwrap()
        .child()
        .unwrap();
    let source_text = store
        .fiber_arena()
        .get(updated_text)
        .unwrap()
        .alternate()
        .unwrap();
    let updated_component_state_node = store
        .fiber_arena()
        .get(updated_root_child)
        .unwrap()
        .state_node();
    let updated_text_state_node = store.fiber_arena().get(updated_text).unwrap().state_node();

    assert_eq!(current_host_root_element(&store, root_id), updated_element);
    assert_eq!(
        store
            .fiber_arena()
            .get(store.root(root_id).unwrap().current())
            .unwrap()
            .child(),
        Some(updated_root_child)
    );

    let cleaned = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        RootElementHandle::NONE,
        QueuedMinimalHostRootUpdatePriority::Sync,
        Lanes::SYNC,
        &source,
        Some(updated.into_host_work()),
        QUEUED_MINIMAL_SOURCE_ORDER + 60,
        QUEUED_MINIMAL_COMMIT_ORDER + 60,
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
    assert!(cleaned_record.proves_queued_update_render_complete_commit());
    assert_eq!(
        cleaned_record.mutation_apply().records()[0]
            .mutation()
            .kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
    );
    let cleanup_records = cleaned_record
        .commit()
        .host_node_deletion_cleanup_log()
        .records();
    let component_cleanup = cleanup_records
        .iter()
        .find(|record| record.fiber() == updated_root_child)
        .unwrap();
    let text_cleanup = cleanup_records
        .iter()
        .find(|record| record.fiber() == updated_text)
        .unwrap();
    store
        .host_tokens()
        .validate(
            component_cleanup.token(),
            root_id,
            source_root_child,
            component_cleanup.token_phase(),
            component_cleanup.token_target(),
        )
        .unwrap();
    assert!(
        store
            .host_tokens()
            .validate(
                component_cleanup.token(),
                root_id,
                updated_root_child,
                component_cleanup.token_phase(),
                component_cleanup.token_target(),
            )
            .is_err()
    );
    store
        .host_tokens()
        .validate(
            text_cleanup.token(),
            root_id,
            source_text,
            text_cleanup.token_phase(),
            text_cleanup.token_target(),
        )
        .unwrap();
    assert!(
        store
            .host_tokens()
            .validate(
                text_cleanup.token(),
                root_id,
                updated_text,
                text_cleanup.token_phase(),
                text_cleanup.token_target(),
            )
            .is_err()
    );
    assert_eq!(cleanup.detached_instance_count(), 1);
    assert_eq!(cleanup.invalidated_text_count(), 1);
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
    assert!(
        !cleaned
            .host_work()
            .detached_instance_metadata_for_canary(updated_component_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        !cleaned
            .host_work()
            .detached_text_metadata_for_canary(updated_text_state_node)
            .unwrap()
            .is_active()
    );
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
fn root_work_loop_queued_minimal_host_root_rejects_stale_previous_host_work_current_before_enqueue()
{
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("section", "currentness");
    let stale_work_in_progress = store.root(root_id).unwrap().current();
    let mounted = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        element,
        QueuedMinimalHostRootUpdatePriority::Default,
        Lanes::DEFAULT,
        &source,
        None,
        QUEUED_MINIMAL_SOURCE_ORDER + 120,
        QUEUED_MINIMAL_COMMIT_ORDER + 120,
    )
    .unwrap();
    let current = store.root(root_id).unwrap().current();
    let current_child = mounted.host_work().root_child().unwrap();
    let previous = HostWorkResult::from_detached_hosts_for_canary(
        root_id,
        stale_work_in_progress,
        vec![current_child],
        vec![current_child],
        DetachedHostRecords::new_for_canary(),
    );
    let snapshot = queued_minimal_host_root_snapshot(&store, &host, root_id);

    let error = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        RootElementHandle::NONE,
        QueuedMinimalHostRootUpdatePriority::Sync,
        Lanes::SYNC,
        &source,
        Some(previous),
        QUEUED_MINIMAL_SOURCE_ORDER + 121,
        QUEUED_MINIMAL_COMMIT_ORDER + 121,
    )
    .unwrap_err();

    assert_eq!(
        error,
        QueuedMinimalHostRootCommitError::PreviousHostWorkCurrentMismatch {
            root: root_id,
            expected_current: current,
            actual_work_in_progress: stale_work_in_progress,
        }
    );
    assert_queued_minimal_host_root_snapshot(&store, &host, root_id, snapshot);
}

#[test]
fn root_work_loop_queued_minimal_host_root_rejects_stale_previous_root_child_before_enqueue() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("section", "root child");
    let mounted = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        element,
        QueuedMinimalHostRootUpdatePriority::Default,
        Lanes::DEFAULT,
        &source,
        None,
        QUEUED_MINIMAL_SOURCE_ORDER + 130,
        QUEUED_MINIMAL_COMMIT_ORDER + 130,
    )
    .unwrap();
    let current = store.root(root_id).unwrap().current();
    let current_child = mounted.host_work().root_child().unwrap();
    let stale_child = create_unattached_host_component_fiber(&mut store, 130);
    let previous = HostWorkResult::from_detached_hosts_for_canary(
        root_id,
        current,
        vec![stale_child],
        vec![stale_child],
        DetachedHostRecords::new_for_canary(),
    );
    let snapshot = queued_minimal_host_root_snapshot(&store, &host, root_id);

    let error = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        RootElementHandle::NONE,
        QueuedMinimalHostRootUpdatePriority::Sync,
        Lanes::SYNC,
        &source,
        Some(previous),
        QUEUED_MINIMAL_SOURCE_ORDER + 131,
        QUEUED_MINIMAL_COMMIT_ORDER + 131,
    )
    .unwrap_err();

    assert_eq!(
        error,
        QueuedMinimalHostRootCommitError::PreviousHostWorkRootChildMismatch {
            root: root_id,
            expected_root_child: Some(current_child),
            actual_root_child: Some(stale_child),
            expected_root_children: vec![current_child],
            actual_root_children: vec![stale_child],
        }
    );
    assert_queued_minimal_host_root_snapshot(&store, &host, root_id, snapshot);
}

#[test]
fn root_work_loop_queued_minimal_host_root_rejects_missing_previous_root_child_before_enqueue() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("section", "missing child");
    let mounted = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        element,
        QueuedMinimalHostRootUpdatePriority::Default,
        Lanes::DEFAULT,
        &source,
        None,
        QUEUED_MINIMAL_SOURCE_ORDER + 140,
        QUEUED_MINIMAL_COMMIT_ORDER + 140,
    )
    .unwrap();
    let current = store.root(root_id).unwrap().current();
    let current_child = mounted.host_work().root_child().unwrap();
    let previous = HostWorkResult::from_detached_hosts_for_canary(
        root_id,
        current,
        Vec::new(),
        Vec::new(),
        DetachedHostRecords::new_for_canary(),
    );
    let snapshot = queued_minimal_host_root_snapshot(&store, &host, root_id);

    let error = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        RootElementHandle::NONE,
        QueuedMinimalHostRootUpdatePriority::Sync,
        Lanes::SYNC,
        &source,
        Some(previous),
        QUEUED_MINIMAL_SOURCE_ORDER + 141,
        QUEUED_MINIMAL_COMMIT_ORDER + 141,
    )
    .unwrap_err();

    assert_eq!(
        error,
        QueuedMinimalHostRootCommitError::PreviousHostWorkRootChildMismatch {
            root: root_id,
            expected_root_child: Some(current_child),
            actual_root_child: None,
            expected_root_children: vec![current_child],
            actual_root_children: Vec::new(),
        }
    );
    assert_queued_minimal_host_root_snapshot(&store, &host, root_id, snapshot);
}

#[test]
fn root_work_loop_queued_minimal_host_root_rejects_live_extra_root_child_before_enqueue() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("section", "extra live child");
    let mounted = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        element,
        QueuedMinimalHostRootUpdatePriority::Default,
        Lanes::DEFAULT,
        &source,
        None,
        QUEUED_MINIMAL_SOURCE_ORDER + 145,
        QUEUED_MINIMAL_COMMIT_ORDER + 145,
    )
    .unwrap();
    let current = store.root(root_id).unwrap().current();
    let current_child = mounted.host_work().root_child().unwrap();
    let previous = mounted.into_host_work();
    let extra_child = create_unattached_host_component_fiber(&mut store, 145);
    store
        .fiber_arena_mut()
        .set_children(current, &[current_child, extra_child])
        .unwrap();
    let snapshot = queued_minimal_host_root_snapshot(&store, &host, root_id);
    assert_eq!(snapshot.current_child, Some(current_child));
    assert_eq!(snapshot.current_children, vec![current_child, extra_child]);
    assert_eq!(snapshot.finished_work, None);
    assert_eq!(snapshot.finished_lanes, Lanes::NO);
    assert_eq!(snapshot.pending_lanes, Lanes::NO);
    assert_eq!(snapshot.render_phase_work, None);
    assert_eq!(snapshot.element, element);

    let error = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        RootElementHandle::NONE,
        QueuedMinimalHostRootUpdatePriority::Sync,
        Lanes::SYNC,
        &source,
        Some(previous),
        QUEUED_MINIMAL_SOURCE_ORDER + 146,
        QUEUED_MINIMAL_COMMIT_ORDER + 146,
    )
    .unwrap_err();

    assert_eq!(
        error,
        QueuedMinimalHostRootCommitError::PreviousHostWorkRootChildMismatch {
            root: root_id,
            expected_root_child: Some(current_child),
            actual_root_child: Some(current_child),
            expected_root_children: vec![current_child, extra_child],
            actual_root_children: vec![current_child],
        }
    );
    assert_queued_minimal_host_root_snapshot(&store, &host, root_id, snapshot);
}

#[test]
fn root_work_loop_queued_minimal_host_root_rejects_extra_completed_child_before_enqueue() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("section", "extra completed");
    let mounted = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        element,
        QueuedMinimalHostRootUpdatePriority::Default,
        Lanes::DEFAULT,
        &source,
        None,
        QUEUED_MINIMAL_SOURCE_ORDER + 150,
        QUEUED_MINIMAL_COMMIT_ORDER + 150,
    )
    .unwrap();
    let current = store.root(root_id).unwrap().current();
    let current_child = mounted.host_work().root_child().unwrap();
    let extra_child = create_unattached_host_component_fiber(&mut store, 150);
    let previous = HostWorkResult::from_detached_hosts_for_canary(
        root_id,
        current,
        vec![current_child],
        vec![current_child, extra_child],
        DetachedHostRecords::new_for_canary(),
    );
    let snapshot = queued_minimal_host_root_snapshot(&store, &host, root_id);

    let error = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        RootElementHandle::NONE,
        QueuedMinimalHostRootUpdatePriority::Sync,
        Lanes::SYNC,
        &source,
        Some(previous),
        QUEUED_MINIMAL_SOURCE_ORDER + 151,
        QUEUED_MINIMAL_COMMIT_ORDER + 151,
    )
    .unwrap_err();

    assert_eq!(
        error,
        QueuedMinimalHostRootCommitError::PreviousHostWorkCompletedChildMismatch {
            root: root_id,
            expected_completed_child: Some(current_child),
            actual_completed_child: Some(current_child),
            expected_completed_children: vec![current_child],
            actual_completed_children: vec![current_child, extra_child],
        }
    );
    assert_queued_minimal_host_root_snapshot(&store, &host, root_id, snapshot);
}

#[test]
fn root_work_loop_queued_minimal_host_rejects_empty_detached_hosts_before_enqueue() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("section", "empty detached");
    let mounted = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        element,
        QueuedMinimalHostRootUpdatePriority::Default,
        Lanes::DEFAULT,
        &source,
        None,
        QUEUED_MINIMAL_SOURCE_ORDER + 160,
        QUEUED_MINIMAL_COMMIT_ORDER + 160,
    )
    .unwrap();
    let current = store.root(root_id).unwrap().current();
    let current_child = mounted.host_work().root_child().unwrap();
    let state_node = store.fiber_arena().get(current_child).unwrap().state_node();
    let previous = HostWorkResult::from_detached_hosts_for_canary(
        root_id,
        current,
        vec![current_child],
        vec![current_child],
        DetachedHostRecords::new_for_canary(),
    );
    let snapshot = queued_minimal_host_root_snapshot(&store, &host, root_id);

    let error = enqueue_render_complete_commit_minimal_host_root_for_canary(
        &mut store,
        &mut host,
        root_id,
        RootElementHandle::NONE,
        QueuedMinimalHostRootUpdatePriority::Sync,
        Lanes::SYNC,
        &source,
        Some(previous),
        QUEUED_MINIMAL_SOURCE_ORDER + 161,
        QUEUED_MINIMAL_COMMIT_ORDER + 161,
    )
    .unwrap_err();

    assert_eq!(
        error,
        QueuedMinimalHostRootCommitError::HostWork(HostWorkError::InvalidDetachedInstance {
            handle: state_node,
        })
    );
    assert_queued_minimal_host_root_snapshot(&store, &host, root_id, snapshot);
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

#[derive(Debug, PartialEq, Eq)]
struct QueuedMinimalHostRootSnapshot {
    current: FiberId,
    current_child: Option<FiberId>,
    current_children: Vec<FiberId>,
    fiber_count: usize,
    finished_work: Option<FiberId>,
    finished_lanes: Lanes,
    pending_lanes: Lanes,
    render_phase_work: Option<FiberId>,
    operations: Vec<&'static str>,
    element: RootElementHandle,
}

fn queued_minimal_host_root_snapshot(
    store: &FiberRootStore<RecordingHost>,
    host: &RecordingHost,
    root_id: FiberRootId,
) -> QueuedMinimalHostRootSnapshot {
    let root = store.root(root_id).unwrap();
    let current = root.current();
    QueuedMinimalHostRootSnapshot {
        current,
        current_child: store.fiber_arena().get(current).unwrap().child(),
        current_children: store.fiber_arena().child_ids(current).unwrap(),
        fiber_count: store.fiber_arena().len(),
        finished_work: root.finished_work(),
        finished_lanes: root.finished_lanes(),
        pending_lanes: root.lanes().pending_lanes(),
        render_phase_work: root.scheduling().work_in_progress(),
        operations: host.operations(),
        element: current_host_root_element(store, root_id),
    }
}

fn assert_queued_minimal_host_root_snapshot(
    store: &FiberRootStore<RecordingHost>,
    host: &RecordingHost,
    root_id: FiberRootId,
    expected: QueuedMinimalHostRootSnapshot,
) {
    assert_eq!(
        queued_minimal_host_root_snapshot(store, host, root_id),
        expected
    );
}

fn create_unattached_host_component_fiber(
    store: &mut FiberRootStore<RecordingHost>,
    raw_props: u64,
) -> FiberId {
    store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(raw_props),
        FiberMode::NO,
    )
}
