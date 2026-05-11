fn assert_client_root_fail_closed_without_side_effects(
    store: &FiberRootStore<RecordingHost>,
    host: &RecordingHost,
    root_id: FiberRootId,
    current: FiberId,
    render: HostRootRenderPhaseRecord,
    root_child: FiberId,
) {
    assert_eq!(host.operations(), Vec::<&'static str>::new());

    let root = store.root(root_id).unwrap();
    assert_eq!(root.kind(), RootKind::Client);
    assert_eq!(root.current(), current);
    assert_eq!(root.context(), RootContextHandle::NONE);
    assert_eq!(root.pending_context(), None);
    assert_eq!(root.pending_children(), PendingChildrenHandle::NONE);
    assert_eq!(root.finished_work(), None);
    assert_eq!(root.finished_lanes(), Lanes::NO);
    assert_eq!(root.pending_commit(), PendingCommitHandle::NONE);
    assert_eq!(
        root.transition_callbacks(),
        RootTransitionCallbacksHandle::NONE
    );
    assert_eq!(
        root.options().hydration_callbacks(),
        RootHydrationCallbacksHandle::NONE
    );
    assert_eq!(
        root.scheduling().work_in_progress(),
        Some(render.work_in_progress())
    );
    assert_eq!(
        root.scheduling().work_in_progress_root_render_lanes(),
        render.render_lanes()
    );
    assert_eq!(
        root.scheduling().render_exit_status(),
        RootRenderExitStatus::Completed
    );
    assert!(root.scheduling().pending_passive().is_empty());

    let current_node = store.fiber_arena().get(current).unwrap();
    let current_state = store
        .host_root_states()
        .get(current_node.memoized_state())
        .unwrap();
    assert_eq!(
        current_state.hydration(),
        HostRootHydrationState::NotHydrated
    );
    assert!(!current_state.is_dehydrated());
    assert_eq!(
        current_state.pending_suspense_boundaries(),
        RootSuspenseBoundarySetHandle::NONE
    );

    let work_node = store.fiber_arena().get(render.work_in_progress()).unwrap();
    assert_eq!(work_node.child(), Some(root_child));
    assert_eq!(work_node.child_lanes(), Lanes::NO);
    assert_eq!(work_node.subtree_flags(), FiberFlags::NO);
    let work_state = store
        .host_root_states()
        .get(work_node.memoized_state())
        .unwrap();
    assert_eq!(work_state.hydration(), HostRootHydrationState::NotHydrated);
    assert!(!work_state.is_dehydrated());
    assert_eq!(
        work_state.pending_suspense_boundaries(),
        RootSuspenseBoundarySetHandle::NONE
    );

    let child_node = store.fiber_arena().get(root_child).unwrap();
    assert_eq!(child_node.return_fiber(), Some(render.work_in_progress()));
    assert_eq!(child_node.lanes(), Lanes::NO);
    assert_eq!(child_node.child_lanes(), Lanes::NO);
    assert_eq!(child_node.subtree_flags(), FiberFlags::NO);
}

fn assert_one_level_child_set_handoff_failed_before_host_work(
    store: &FiberRootStore<RecordingHost>,
    host: &RecordingHost,
    root_id: FiberRootId,
    current: FiberId,
    render: HostRootRenderPhaseRecord,
) {
    assert_eq!(host.operations(), Vec::<&'static str>::new());

    let root = store.root(root_id).unwrap();
    assert_eq!(root.kind(), RootKind::Client);
    assert_eq!(root.current(), current);
    assert_eq!(root.finished_work(), None);
    assert_eq!(root.finished_lanes(), Lanes::NO);
    assert_eq!(
        root.scheduling().work_in_progress(),
        Some(render.work_in_progress())
    );
    assert_eq!(
        root.scheduling().work_in_progress_root_render_lanes(),
        render.render_lanes()
    );
    assert_eq!(
        root.scheduling().render_exit_status(),
        RootRenderExitStatus::Completed
    );

    let work_node = store.fiber_arena().get(render.work_in_progress()).unwrap();
    assert_eq!(work_node.child(), None);
    assert_eq!(work_node.child_lanes(), Lanes::NO);
    assert_eq!(work_node.subtree_flags(), FiberFlags::NO);
    assert_eq!(work_node.flags(), FiberFlags::NO);
}

fn handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set_retaining_host_work(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    child_set: &HostRootOneLevelChildSet,
    detached_hosts: DetachedHostRecords,
) -> Result<
    (
        HostRootOneLevelChildSetCompleteWorkHandoffRecord,
        HostWorkResult,
    ),
    HostRootOneLevelChildSetCompleteWorkHandoffError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    if render.resulting_element() != child_set.root_element() {
        return Err(
            HostRootOneLevelChildSetCompleteWorkHandoffError::RootElementMismatch {
                render_element: render.resulting_element(),
                child_set_element: child_set.root_element(),
            },
        );
    }
    validate_empty_host_root_child_list_for_complete_work_handoff(store, render)?;
    let begin_work = begin_work_host_root_one_level_child_set(child_set)?;
    for &element in begin_work.children() {
        if source.root(element).is_none() {
            return Err(
                HostRootOneLevelChildSetCompleteWorkHandoffError::MissingTestRootElement {
                    element,
                },
            );
        }
    }

    let host_work = mount_test_host_sibling_work_with_detached_hosts_for_canary(
        store,
        host,
        render,
        source,
        begin_work.children(),
        detached_hosts,
    )
    .map_err(HostRootCompleteWorkHandoffError::from)?;
    let child_set_completion = complete_host_root_one_level_child_set_for_test(
        store.fiber_arena_mut(),
        render.work_in_progress(),
        begin_work.child_count(),
    )?;
    let complete_work = host_root_complete_work_handoff_record_from_host_work(
        store,
        render,
        render.resulting_element(),
        &host_work,
    )?;

    Ok((
        HostRootOneLevelChildSetCompleteWorkHandoffRecord {
            begin_work,
            child_set_completion,
            complete_work,
        },
        host_work,
    ))
}

fn append_stable_root_text_work_after_one_level_child_set(
    store: &mut FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
    first_placed_child: FiberId,
    second_placed_child: FiberId,
    stable_current: FiberId,
    stable_state_node: StateNodeHandle,
    stable_props: PropsHandle,
) -> FiberId {
    let stable_work = store
        .fiber_arena_mut()
        .create_work_in_progress(stable_current, stable_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(stable_work).unwrap();
        node.set_state_node(stable_state_node);
        node.set_memoized_props(stable_props);
        node.set_lanes(Lanes::NO);
        node.set_flags(FiberFlags::NO);
    }
    store
        .fiber_arena_mut()
        .set_children(
            render.work_in_progress(),
            &[first_placed_child, second_placed_child, stable_work],
        )
        .unwrap();
    complete_host_root_one_level_child_set_for_test(
        store.fiber_arena_mut(),
        render.work_in_progress(),
        3,
    )
    .unwrap();
    stable_work
}

#[derive(Debug)]
struct RootWorkLoopRootUnmountMountedOutput {
    complete_work: HostRootOneLevelChildSetCompleteWorkHandoffRecord,
    host_work: HostWorkResult,
    first_child: FiberId,
    second_child: FiberId,
    first_state_node: StateNodeHandle,
    second_state_node: StateNodeHandle,
    operations_after_mount: Vec<&'static str>,
    token_count_after_mount: usize,
}

#[derive(Debug)]
struct RootWorkLoopRootUnmountExecution {
    render: HostRootRenderPhaseRecord,
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
    mutation_apply: TestHostRootMutationApplyResult,
    deletion_cleanup: TestHostRootDeletionCleanupApplyResult,
    deleted_children: Vec<FiberId>,
    operations_before_apply: Vec<&'static str>,
}

#[derive(Debug)]
struct RootWorkLoopMultiChildHostMutationMountedOutput {
    complete_work: HostRootOneLevelChildSetCompleteWorkHandoffRecord,
    host_work: HostWorkResult,
    root_element: RootElementHandle,
    stable_before: FiberId,
    target: FiberId,
    stable_after: FiberId,
    stable_before_state_node: StateNodeHandle,
    target_state_node: StateNodeHandle,
    stable_after_state_node: StateNodeHandle,
    operations_after_mount: Vec<&'static str>,
    token_count_after_mount: usize,
}

#[derive(Debug)]
struct RootWorkLoopMultiChildTextUpdateFixture {
    render: HostRootRenderPhaseRecord,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    previous_current: FiberId,
    stable_before_current: FiberId,
    updated_current: FiberId,
    stable_after_current: FiberId,
    stable_before_work: FiberId,
    updated_work: FiberId,
    stable_after_work: FiberId,
    stable_before_state_node: StateNodeHandle,
    updated_state_node: StateNodeHandle,
    stable_after_state_node: StateNodeHandle,
    operations_before_apply: Vec<&'static str>,
    token_count_before_apply: usize,
}

#[derive(Debug)]
struct RootWorkLoopMultiChildDeleteFixture {
    render: HostRootRenderPhaseRecord,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    previous_current: FiberId,
    stable_before_current: FiberId,
    deleted_current: FiberId,
    stable_after_current: FiberId,
    stable_before_work: FiberId,
    stable_after_work: FiberId,
    stable_before_state_node: StateNodeHandle,
    deleted_state_node: StateNodeHandle,
    stable_after_state_node: StateNodeHandle,
    operations_before_apply: Vec<&'static str>,
    token_count_before_apply: usize,
}

#[derive(Debug)]
struct RootWorkLoopMultiChildTextUpdateExecution {
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
    mutation_apply: TestHostRootMutationApplyResult,
    operations_before_apply: Vec<&'static str>,
}

#[derive(Debug)]
struct RootWorkLoopMultiChildDeleteExecution {
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
    mutation_apply: TestHostRootMutationApplyResult,
    deletion_cleanup: TestHostRootDeletionCleanupApplyResult,
    operations_before_apply: Vec<&'static str>,
}

#[derive(Debug, PartialEq, Eq)]
enum RootWorkLoopMultiChildHostMutationExecutionError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    HostWork(HostWorkError),
    FinishedWorkCommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
    MountRootMismatch {
        expected: FiberRootId,
        actual: FiberRootId,
    },
    StaleCurrent {
        root: FiberRootId,
        expected: FiberId,
        actual: FiberId,
    },
    CurrentElementMismatch {
        root: FiberRootId,
        expected: RootElementHandle,
        actual: RootElementHandle,
    },
    CurrentChildListMismatch {
        root: FiberRootId,
        expected: Vec<FiberId>,
        actual: Vec<FiberId>,
    },
    FinishedChildListMismatch {
        root: FiberRootId,
        expected: Vec<FiberId>,
        actual: Vec<FiberId>,
    },
    UnexpectedMutationCount {
        root: FiberRootId,
        expected: usize,
        actual: usize,
    },
    UnexpectedMutationRecord {
        root: FiberRootId,
        expected_fiber: FiberId,
        actual_fiber: FiberId,
        actual_kind: HostRootMutationApplyRecordKind,
    },
    UnexpectedMutationSource {
        root: FiberRootId,
        expected: HostRootMutationApplyRecordSource,
        actual: HostRootMutationApplyRecordSource,
    },
    UnexpectedLanes {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    UnexpectedTextUpdateCount {
        root: FiberRootId,
        fiber: FiberId,
        state_node: StateNodeHandle,
        actual: usize,
    },
    UnexpectedDeletionList {
        root: FiberRootId,
        expected_deleted: FiberId,
    },
}

impl From<FiberRootStoreError> for RootWorkLoopMultiChildHostMutationExecutionError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<FiberTopologyError> for RootWorkLoopMultiChildHostMutationExecutionError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<HostWorkError> for RootWorkLoopMultiChildHostMutationExecutionError {
    fn from(error: HostWorkError) -> Self {
        Self::HostWork(error)
    }
}

impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for RootWorkLoopMultiChildHostMutationExecutionError
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWorkCommitHandoff(Box::new(error))
    }
}

#[derive(Debug, PartialEq, Eq)]
enum RootWorkLoopRootUnmountExecutionError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    HostRootStateStore(HostRootStateStoreError),
    HostWork(HostWorkError),
    FinishedWorkCommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
    MountRootMismatch {
        expected: FiberRootId,
        actual: FiberRootId,
    },
    MountHostWorkMismatch {
        root: FiberRootId,
        expected: FiberId,
        actual: FiberId,
    },
    EmptyMountedChildren {
        root: FiberRootId,
    },
    UnmountElementNotNone {
        root: FiberRootId,
        element: RootElementHandle,
    },
    AlreadyUnmounted {
        root: FiberRootId,
        current: FiberId,
    },
    CurrentElementMismatch {
        root: FiberRootId,
        expected: RootElementHandle,
        actual: RootElementHandle,
    },
    CurrentChildListMismatch {
        root: FiberRootId,
        expected: Vec<FiberId>,
        actual: Vec<FiberId>,
    },
    UnexpectedUnmountMutationCount {
        root: FiberRootId,
        expected: usize,
        actual: usize,
    },
    UnexpectedUnmountMutationKind {
        root: FiberRootId,
        finished_work: FiberId,
        kind: HostRootMutationApplyRecordKind,
    },
}

impl From<FiberRootStoreError> for RootWorkLoopRootUnmountExecutionError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<FiberTopologyError> for RootWorkLoopRootUnmountExecutionError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<HostRootStateStoreError> for RootWorkLoopRootUnmountExecutionError {
    fn from(error: HostRootStateStoreError) -> Self {
        Self::HostRootStateStore(error)
    }
}

impl From<HostWorkError> for RootWorkLoopRootUnmountExecutionError {
    fn from(error: HostWorkError) -> Self {
        Self::HostWork(error)
    }
}

impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for RootWorkLoopRootUnmountExecutionError
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWorkCommitHandoff(Box::new(error))
    }
}

fn mount_one_level_root_host_output_for_unmount(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    root_id: FiberRootId,
    raw: u64,
) -> RootWorkLoopRootUnmountMountedOutput {
    let mut source = TestHostTree::new();
    let first_element = source.insert_host_element_with_text("article", format!("root {raw}"));
    let second_element = source.insert_text(format!("tail {raw}"));
    let root_element = RootElementHandle::from_raw(raw);
    update_container(store, root_id, root_element, None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let child_set = HostRootOneLevelChildSet::array(
        root_element,
        vec![
            HostRootOneLevelChildSetEntry::host(first_element),
            HostRootOneLevelChildSetEntry::host(second_element),
        ],
    );
    let (complete_work, mut host_work) =
        handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set_retaining_host_work(
            store,
            host,
            render,
            &source,
            &child_set,
            DetachedHostRecords::default(),
        )
        .unwrap();
    let finished_work_handoff =
        commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            store,
            render,
            ROOT_WORK_LOOP_ROOT_UNMOUNT_SOURCE_ORDER,
            ROOT_WORK_LOOP_ROOT_UNMOUNT_COMMIT_ORDER,
        )
        .unwrap();
    let mount_apply = apply_test_host_root_commit_mutations_for_canary(
        store,
        host,
        finished_work_handoff.commit(),
        &mut host_work,
    )
    .unwrap();

    assert_eq!(mount_apply.applied_host_call_count(), 2);
    assert_eq!(
        mount_apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::AppendChildToContainer
        )
    );
    assert_eq!(
        mount_apply.records()[1].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::AppendChildToContainer
        )
    );

    let first_child = complete_work.complete_work().root_child().unwrap();
    let second_child = complete_work.complete_work().last_root_child().unwrap();
    let first_state_node = store.fiber_arena().get(first_child).unwrap().state_node();
    let second_state_node = store.fiber_arena().get(second_child).unwrap().state_node();

    RootWorkLoopRootUnmountMountedOutput {
        complete_work,
        host_work,
        first_child,
        second_child,
        first_state_node,
        second_state_node,
        operations_after_mount: host.operations(),
        token_count_after_mount: store.host_tokens().len(),
    }
}

fn execute_root_unmount_from_mounted_one_level_output(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    unmount_render: HostRootRenderPhaseRecord,
    mounted: &HostRootOneLevelChildSetCompleteWorkHandoffRecord,
    host_work: &mut HostWorkResult,
    source_order: usize,
    commit_order: usize,
) -> Result<RootWorkLoopRootUnmountExecution, RootWorkLoopRootUnmountExecutionError> {
    let mounted_complete = mounted.complete_work();
    if mounted_complete.root() != unmount_render.root() {
        return Err(RootWorkLoopRootUnmountExecutionError::MountRootMismatch {
            expected: mounted_complete.root(),
            actual: unmount_render.root(),
        });
    }
    if host_work.root() != mounted_complete.root()
        || host_work.work_in_progress() != mounted_complete.host_root_work_in_progress()
    {
        return Err(
            RootWorkLoopRootUnmountExecutionError::MountHostWorkMismatch {
                root: mounted_complete.root(),
                expected: mounted_complete.host_root_work_in_progress(),
                actual: host_work.work_in_progress(),
            },
        );
    }
    if unmount_render.resulting_element() != RootElementHandle::NONE {
        return Err(
            RootWorkLoopRootUnmountExecutionError::UnmountElementNotNone {
                root: unmount_render.root(),
                element: unmount_render.resulting_element(),
            },
        );
    }

    let deleted_children = host_work.root_children().to_vec();
    if deleted_children.is_empty() {
        return Err(
            RootWorkLoopRootUnmountExecutionError::EmptyMountedChildren {
                root: unmount_render.root(),
            },
        );
    }

    let current_state = store
        .fiber_arena()
        .get(unmount_render.current())?
        .memoized_state();
    let current_element = store.host_root_states().get(current_state)?.element();
    if current_element == RootElementHandle::NONE {
        return Err(RootWorkLoopRootUnmountExecutionError::AlreadyUnmounted {
            root: unmount_render.root(),
            current: unmount_render.current(),
        });
    }
    if current_element != mounted.root_element() {
        return Err(
            RootWorkLoopRootUnmountExecutionError::CurrentElementMismatch {
                root: unmount_render.root(),
                expected: mounted.root_element(),
                actual: current_element,
            },
        );
    }

    let current_children = store.fiber_arena().child_ids(unmount_render.current())?;
    if current_children.is_empty() {
        return Err(RootWorkLoopRootUnmountExecutionError::AlreadyUnmounted {
            root: unmount_render.root(),
            current: unmount_render.current(),
        });
    }
    if current_children != deleted_children {
        return Err(
            RootWorkLoopRootUnmountExecutionError::CurrentChildListMismatch {
                root: unmount_render.root(),
                expected: deleted_children,
                actual: current_children,
            },
        );
    }

    for &child in &deleted_children {
        store
            .fiber_arena_mut()
            .mark_child_for_deletion(unmount_render.finished_work(), child)?;
    }

    let finished_work_handoff =
        commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            store,
            unmount_render,
            source_order,
            commit_order,
        )?;
    let commit = finished_work_handoff.commit();
    let mutation_records = commit.mutation_apply_log().records();
    if mutation_records.len() != deleted_children.len() {
        return Err(
            RootWorkLoopRootUnmountExecutionError::UnexpectedUnmountMutationCount {
                root: commit.root(),
                expected: deleted_children.len(),
                actual: mutation_records.len(),
            },
        );
    }
    for mutation in mutation_records {
        if mutation.kind() != HostRootMutationApplyRecordKind::RemoveDeletedFromContainer {
            return Err(
                RootWorkLoopRootUnmountExecutionError::UnexpectedUnmountMutationKind {
                    root: commit.root(),
                    finished_work: commit.finished_work(),
                    kind: mutation.kind(),
                },
            );
        }
    }

    preflight_test_host_root_deletion_apply_and_cleanup_for_canary(store, commit, host_work)?;
    let operations_before_apply = host.operations();
    let mutation_apply =
        apply_test_host_root_commit_mutations_for_canary(store, host, commit, host_work)?;
    let deletion_cleanup =
        apply_test_host_root_deletion_cleanup_for_canary(store, host, commit, host_work)?;

    Ok(RootWorkLoopRootUnmountExecution {
        render: unmount_render,
        finished_work_handoff,
        mutation_apply,
        deletion_cleanup,
        deleted_children,
        operations_before_apply,
    })
}

fn mount_three_text_root_output_for_multichild_host_mutation(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    root_id: FiberRootId,
    raw: u64,
) -> RootWorkLoopMultiChildHostMutationMountedOutput {
    let mut source = TestHostTree::new();
    let stable_before_element = source.insert_text(format!("stable before {raw}"));
    let target_element = source.insert_text(format!("target before {raw}"));
    let stable_after_element = source.insert_text(format!("stable after {raw}"));
    let root_element = RootElementHandle::from_raw(raw);
    update_container(store, root_id, root_element, None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let child_set = HostRootOneLevelChildSet::array(
        root_element,
        vec![
            HostRootOneLevelChildSetEntry::host(stable_before_element),
            HostRootOneLevelChildSetEntry::host(target_element),
            HostRootOneLevelChildSetEntry::host(stable_after_element),
        ],
    );
    let (complete_work, mut host_work) =
        handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set_retaining_host_work(
            store,
            host,
            render,
            &source,
            &child_set,
            DetachedHostRecords::default(),
        )
        .unwrap();
    let finished_work_handoff =
        commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            store,
            render,
            raw as usize,
            raw as usize + 1,
        )
        .unwrap();
    let mount_apply = apply_test_host_root_commit_mutations_for_canary(
        store,
        host,
        finished_work_handoff.commit(),
        &mut host_work,
    )
    .unwrap();

    assert_eq!(mount_apply.records().len(), 3);
    assert_eq!(mount_apply.applied_host_call_count(), 3);
    assert!(mount_apply.records().iter().all(|record| {
        record.status()
            == TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::AppendChildToContainer,
            )
    }));

    let children = host_work.root_children().to_vec();
    assert_eq!(children.len(), 3);
    let stable_before = children[0];
    let target = children[1];
    let stable_after = children[2];
    let stable_before_state_node = store.fiber_arena().get(stable_before).unwrap().state_node();
    let target_state_node = store.fiber_arena().get(target).unwrap().state_node();
    let stable_after_state_node = store.fiber_arena().get(stable_after).unwrap().state_node();

    RootWorkLoopMultiChildHostMutationMountedOutput {
        complete_work,
        host_work,
        root_element,
        stable_before,
        target,
        stable_after,
        stable_before_state_node,
        target_state_node,
        stable_after_state_node,
        operations_after_mount: host.operations(),
        token_count_after_mount: store.host_tokens().len(),
    }
}

fn prepare_root_work_loop_multichild_text_update_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    mounted: &mut RootWorkLoopMultiChildHostMutationMountedOutput,
    raw: u64,
) -> RootWorkLoopMultiChildTextUpdateFixture {
    let previous_current = store.root(root_id).unwrap().current();
    let mut source = TestHostTree::new();
    let next_text = source.insert_text(format!("target after {raw}"));
    update_container(store, root_id, RootElementHandle::from_raw(raw + 10), None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let updated_work = update_test_host_root_sibling_text_child_work_for_canary(
        store,
        &mut mounted.host_work,
        render,
        &source,
        mounted.target,
        next_text,
    )
    .unwrap();
    let children = mounted.host_work.root_children().to_vec();
    assert_eq!(children.len(), 3);
    let pending = prepare_root_work_loop_managed_child_pending_commit(
        store,
        render,
        ROOT_WORK_LOOP_MULTICHILD_UPDATE_SOURCE_ORDER,
    );

    RootWorkLoopMultiChildTextUpdateFixture {
        render,
        pending,
        previous_current,
        stable_before_current: mounted.stable_before,
        updated_current: mounted.target,
        stable_after_current: mounted.stable_after,
        stable_before_work: children[0],
        updated_work,
        stable_after_work: children[2],
        stable_before_state_node: mounted.stable_before_state_node,
        updated_state_node: mounted.target_state_node,
        stable_after_state_node: mounted.stable_after_state_node,
        operations_before_apply: Vec::new(),
        token_count_before_apply: 0,
    }
}

fn prepare_root_work_loop_multichild_text_delete_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    mounted: &mut RootWorkLoopMultiChildHostMutationMountedOutput,
    raw: u64,
) -> RootWorkLoopMultiChildDeleteFixture {
    let previous_current = store.root(root_id).unwrap().current();
    update_container(store, root_id, RootElementHandle::from_raw(raw + 20), None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let remaining = delete_test_host_root_sibling_child_for_canary(
        store,
        &mut mounted.host_work,
        render,
        mounted.target,
    )
    .unwrap();
    assert_eq!(remaining.len(), 2);
    let pending = prepare_root_work_loop_managed_child_pending_commit(
        store,
        render,
        ROOT_WORK_LOOP_MULTICHILD_DELETE_SOURCE_ORDER,
    );

    RootWorkLoopMultiChildDeleteFixture {
        render,
        pending,
        previous_current,
        stable_before_current: mounted.stable_before,
        deleted_current: mounted.target,
        stable_after_current: mounted.stable_after,
        stable_before_work: remaining[0],
        stable_after_work: remaining[1],
        stable_before_state_node: mounted.stable_before_state_node,
        deleted_state_node: mounted.target_state_node,
        stable_after_state_node: mounted.stable_after_state_node,
        operations_before_apply: Vec::new(),
        token_count_before_apply: 0,
    }
}

fn execute_root_work_loop_multichild_text_update(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    root_id: FiberRootId,
    mounted_root: FiberRootId,
    mounted_root_element: RootElementHandle,
    host_work: &mut HostWorkResult,
    mut fixture: RootWorkLoopMultiChildTextUpdateFixture,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    commit_order: usize,
) -> Result<
    RootWorkLoopMultiChildTextUpdateExecution,
    RootWorkLoopMultiChildHostMutationExecutionError,
> {
    fixture.operations_before_apply = host.operations();
    fixture.token_count_before_apply = store.host_tokens().len();
    validate_root_work_loop_multichild_text_update_topology(
        store,
        root_id,
        mounted_root,
        mounted_root_element,
        &fixture,
        host_work,
    )?;

    let finished_work_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        store,
        fixture.render,
        Some(pending),
        commit_order,
    )?;
    validate_root_work_loop_multichild_text_update_commit(
        root_id,
        &fixture,
        finished_work_handoff.commit(),
    )?;
    let update_count =
        host_work.test_host_text_record_update_count_for_canary(fixture.updated_state_node)?;
    if update_count != 0 {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedTextUpdateCount {
                root: root_id,
                fiber: fixture.updated_current,
                state_node: fixture.updated_state_node,
                actual: update_count,
            },
        );
    }

    let mutation_apply = apply_test_host_root_commit_mutations_for_canary(
        store,
        host,
        finished_work_handoff.commit(),
        host_work,
    )?;

    Ok(RootWorkLoopMultiChildTextUpdateExecution {
        finished_work_handoff,
        mutation_apply,
        operations_before_apply: fixture.operations_before_apply,
    })
}

fn execute_root_work_loop_multichild_text_delete(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    root_id: FiberRootId,
    mounted_root: FiberRootId,
    mounted_root_element: RootElementHandle,
    host_work: &mut HostWorkResult,
    mut fixture: RootWorkLoopMultiChildDeleteFixture,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    commit_order: usize,
) -> Result<RootWorkLoopMultiChildDeleteExecution, RootWorkLoopMultiChildHostMutationExecutionError>
{
    fixture.operations_before_apply = host.operations();
    fixture.token_count_before_apply = store.host_tokens().len();
    validate_root_work_loop_multichild_text_delete_topology(
        store,
        root_id,
        mounted_root,
        mounted_root_element,
        &fixture,
        host_work,
    )?;

    let finished_work_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        store,
        fixture.render,
        Some(pending),
        commit_order,
    )?;
    validate_root_work_loop_multichild_text_delete_commit(
        root_id,
        &fixture,
        finished_work_handoff.commit(),
    )?;
    preflight_test_host_root_deletion_apply_and_cleanup_for_canary(
        store,
        finished_work_handoff.commit(),
        host_work,
    )?;
    let mutation_apply = apply_test_host_root_commit_mutations_for_canary(
        store,
        host,
        finished_work_handoff.commit(),
        host_work,
    )?;
    let deletion_cleanup = apply_test_host_root_deletion_cleanup_for_canary(
        store,
        host,
        finished_work_handoff.commit(),
        host_work,
    )?;

    Ok(RootWorkLoopMultiChildDeleteExecution {
        finished_work_handoff,
        mutation_apply,
        deletion_cleanup,
        operations_before_apply: fixture.operations_before_apply,
    })
}

fn validate_root_work_loop_multichild_text_update_topology(
    store: &FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    mounted_root: FiberRootId,
    mounted_root_element: RootElementHandle,
    fixture: &RootWorkLoopMultiChildTextUpdateFixture,
    host_work: &HostWorkResult,
) -> Result<(), RootWorkLoopMultiChildHostMutationExecutionError> {
    validate_root_work_loop_multichild_mounted_identity(
        store,
        root_id,
        mounted_root,
        mounted_root_element,
        fixture.render,
        fixture.previous_current,
    )?;
    if host_work.root() != root_id || host_work.work_in_progress() != fixture.render.finished_work()
    {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::MountRootMismatch {
                expected: root_id,
                actual: host_work.root(),
            },
        );
    }
    let expected_current = vec![
        fixture.stable_before_current,
        fixture.updated_current,
        fixture.stable_after_current,
    ];
    let actual_current = store.fiber_arena().child_ids(fixture.previous_current)?;
    if actual_current != expected_current {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::CurrentChildListMismatch {
                root: root_id,
                expected: expected_current,
                actual: actual_current,
            },
        );
    }

    let expected_finished = vec![
        fixture.stable_before_work,
        fixture.updated_work,
        fixture.stable_after_work,
    ];
    let actual_finished = store
        .fiber_arena()
        .child_ids(fixture.render.finished_work())?;
    if actual_finished != expected_finished {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::FinishedChildListMismatch {
                root: root_id,
                expected: expected_finished,
                actual: actual_finished,
            },
        );
    }

    validate_root_work_loop_text_alternate(
        store,
        root_id,
        fixture.stable_before_current,
        fixture.stable_before_work,
        fixture.stable_before_state_node,
    )?;
    validate_root_work_loop_text_alternate(
        store,
        root_id,
        fixture.updated_current,
        fixture.updated_work,
        fixture.updated_state_node,
    )?;
    validate_root_work_loop_text_alternate(
        store,
        root_id,
        fixture.stable_after_current,
        fixture.stable_after_work,
        fixture.stable_after_state_node,
    )?;
    if !store
        .fiber_arena()
        .get(fixture.updated_work)?
        .flags()
        .contains_all(FiberFlags::UPDATE)
    {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedMutationRecord {
                root: root_id,
                expected_fiber: fixture.updated_work,
                actual_fiber: fixture.updated_work,
                actual_kind: HostRootMutationApplyRecordKind::CommitHostTextUpdate,
            },
        );
    }

    Ok(())
}

fn validate_root_work_loop_multichild_text_delete_topology(
    store: &FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    mounted_root: FiberRootId,
    mounted_root_element: RootElementHandle,
    fixture: &RootWorkLoopMultiChildDeleteFixture,
    host_work: &HostWorkResult,
) -> Result<(), RootWorkLoopMultiChildHostMutationExecutionError> {
    validate_root_work_loop_multichild_mounted_identity(
        store,
        root_id,
        mounted_root,
        mounted_root_element,
        fixture.render,
        fixture.previous_current,
    )?;
    if host_work.root() != root_id || host_work.work_in_progress() != fixture.render.finished_work()
    {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::MountRootMismatch {
                expected: root_id,
                actual: host_work.root(),
            },
        );
    }
    let expected_current = vec![fixture.stable_before_current, fixture.deleted_current];
    let actual_current = store.fiber_arena().child_ids(fixture.previous_current)?;
    let before_node = store.fiber_arena().get(fixture.stable_before_current)?;
    if actual_current.first().copied() != Some(fixture.stable_before_current)
        || before_node.sibling() != Some(fixture.deleted_current)
    {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::CurrentChildListMismatch {
                root: root_id,
                expected: expected_current,
                actual: actual_current,
            },
        );
    }

    let expected_finished = vec![fixture.stable_before_work, fixture.stable_after_work];
    let actual_finished = store
        .fiber_arena()
        .child_ids(fixture.render.finished_work())?;
    if actual_finished != expected_finished {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::FinishedChildListMismatch {
                root: root_id,
                expected: expected_finished,
                actual: actual_finished,
            },
        );
    }

    validate_root_work_loop_text_alternate(
        store,
        root_id,
        fixture.stable_before_current,
        fixture.stable_before_work,
        fixture.stable_before_state_node,
    )?;
    validate_root_work_loop_text_alternate(
        store,
        root_id,
        fixture.stable_after_current,
        fixture.stable_after_work,
        fixture.stable_after_state_node,
    )?;
    let deleted_node = store.fiber_arena().get(fixture.deleted_current)?;
    if deleted_node.tag() != FiberTag::HostText
        || deleted_node.state_node() != fixture.deleted_state_node
    {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedMutationRecord {
                root: root_id,
                expected_fiber: fixture.deleted_current,
                actual_fiber: fixture.deleted_current,
                actual_kind: HostRootMutationApplyRecordKind::RemoveDeletedFromContainer,
            },
        );
    }

    Ok(())
}

fn validate_root_work_loop_multichild_mounted_identity(
    store: &FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    mounted_root: FiberRootId,
    mounted_root_element: RootElementHandle,
    render: HostRootRenderPhaseRecord,
    previous_current: FiberId,
) -> Result<(), RootWorkLoopMultiChildHostMutationExecutionError> {
    if mounted_root != root_id {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::MountRootMismatch {
                expected: root_id,
                actual: mounted_root,
            },
        );
    }
    let actual_current = store.root(root_id)?.current();
    if render.current() != previous_current || actual_current != previous_current {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::StaleCurrent {
                root: root_id,
                expected: previous_current,
                actual: actual_current,
            },
        );
    }
    let current_element = current_host_root_element(store, root_id);
    if current_element != mounted_root_element {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::CurrentElementMismatch {
                root: root_id,
                expected: mounted_root_element,
                actual: current_element,
            },
        );
    }

    Ok(())
}

fn validate_root_work_loop_text_alternate(
    store: &FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    current: FiberId,
    work: FiberId,
    state_node: StateNodeHandle,
) -> Result<(), RootWorkLoopMultiChildHostMutationExecutionError> {
    store.fiber_arena().validate_alternate_pair(current, work)?;
    let current_node = store.fiber_arena().get(current)?;
    let work_node = store.fiber_arena().get(work)?;
    if current_node.tag() != FiberTag::HostText
        || work_node.tag() != FiberTag::HostText
        || current_node.state_node() != state_node
        || work_node.state_node() != state_node
    {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedMutationRecord {
                root: root_id,
                expected_fiber: work,
                actual_fiber: work,
                actual_kind: HostRootMutationApplyRecordKind::CommitHostTextUpdate,
            },
        );
    }
    Ok(())
}

fn validate_root_work_loop_multichild_text_update_commit(
    root_id: FiberRootId,
    fixture: &RootWorkLoopMultiChildTextUpdateFixture,
    commit: &HostRootCommitRecord,
) -> Result<(), RootWorkLoopMultiChildHostMutationExecutionError> {
    if commit.finished_lanes() != fixture.render.render_lanes() {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedLanes {
                root: root_id,
                expected: fixture.render.render_lanes(),
                actual: commit.finished_lanes(),
            },
        );
    }
    let records = commit.mutation_apply_log().records();
    if records.len() != 1 {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedMutationCount {
                root: root_id,
                expected: 1,
                actual: records.len(),
            },
        );
    }
    let mutation = records[0];
    if mutation.source()
        != HostRootMutationApplyRecordSource::MutationPhase(HostRootMutationPhaseRecordKind::Update)
    {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedMutationSource {
                root: root_id,
                expected: HostRootMutationApplyRecordSource::MutationPhase(
                    HostRootMutationPhaseRecordKind::Update,
                ),
                actual: mutation.source(),
            },
        );
    }
    if mutation.root() != root_id
        || mutation.host_root() != fixture.render.finished_work()
        || mutation.parent() != fixture.render.finished_work()
        || mutation.parent_tag() != FiberTag::HostRoot
        || mutation.kind() != HostRootMutationApplyRecordKind::CommitHostTextUpdate
        || mutation.fiber() != fixture.updated_work
        || mutation.alternate_fiber() != Some(fixture.updated_current)
        || mutation.state_node() != fixture.updated_state_node
        || !mutation.effect_flag().contains_all(FiberFlags::UPDATE)
    {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedMutationRecord {
                root: root_id,
                expected_fiber: fixture.updated_work,
                actual_fiber: mutation.fiber(),
                actual_kind: mutation.kind(),
            },
        );
    }
    if mutation.lanes() != fixture.render.render_lanes() {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedLanes {
                root: root_id,
                expected: fixture.render.render_lanes(),
                actual: mutation.lanes(),
            },
        );
    }
    Ok(())
}

fn validate_root_work_loop_multichild_text_delete_commit(
    root_id: FiberRootId,
    fixture: &RootWorkLoopMultiChildDeleteFixture,
    commit: &HostRootCommitRecord,
) -> Result<(), RootWorkLoopMultiChildHostMutationExecutionError> {
    if commit.finished_lanes() != fixture.render.render_lanes() {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedLanes {
                root: root_id,
                expected: fixture.render.render_lanes(),
                actual: commit.finished_lanes(),
            },
        );
    }
    if commit.deletion_lists().len() != 1
        || commit.deletion_lists()[0].parent() != fixture.render.finished_work()
        || commit.deletion_lists()[0].deleted() != &[fixture.deleted_current]
    {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedDeletionList {
                root: root_id,
                expected_deleted: fixture.deleted_current,
            },
        );
    }
    let deletion_list = commit.deletion_lists()[0].list();
    let records = commit.mutation_apply_log().records();
    if records.len() != 1 {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedMutationCount {
                root: root_id,
                expected: 1,
                actual: records.len(),
            },
        );
    }
    let mutation = records[0];
    let expected_source = HostRootMutationApplyRecordSource::DeletionList(deletion_list);
    if mutation.source() != expected_source {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedMutationSource {
                root: root_id,
                expected: expected_source,
                actual: mutation.source(),
            },
        );
    }
    if mutation.root() != root_id
        || mutation.host_root() != fixture.render.finished_work()
        || mutation.parent() != fixture.render.finished_work()
        || mutation.parent_tag() != FiberTag::HostRoot
        || mutation.kind() != HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
        || mutation.fiber() != fixture.deleted_current
        || mutation.state_node() != fixture.deleted_state_node
        || !mutation
            .effect_flag()
            .contains_all(FiberFlags::CHILD_DELETION)
    {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedMutationRecord {
                root: root_id,
                expected_fiber: fixture.deleted_current,
                actual_fiber: mutation.fiber(),
                actual_kind: mutation.kind(),
            },
        );
    }
    if mutation.lanes() != fixture.render.render_lanes() {
        return Err(
            RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedLanes {
                root: root_id,
                expected: fixture.render.render_lanes(),
                actual: mutation.lanes(),
            },
        );
    }
    Ok(())
}

fn assert_root_work_loop_multichild_finished_work_blockers(
    handoff: &HostRootFinishedWorkCommitHandoffRecordForCanary,
) {
    assert!(handoff.mutation_execution_blocked());
    assert!(handoff.public_root_rendering_blocked());
    assert!(handoff.effects_refs_and_hydration_blocked());
    assert!(handoff.execution_request().compatibility_claim_blocked());
    assert!(
        handoff.execution_request().blockers().contains(
            &HostRootFinishedWorkCommitExecutionBlockerForCanary::PublicCompatibilityClaim
        )
    );
    assert!(handoff.proves_private_root_finished_work_commit_metadata_handoff());
}

fn assert_root_child_preflight_blocks_unsupported_tag(
    error: HostRootChildBeginWorkPreflightError,
    root_id: FiberRootId,
    host_root_work_in_progress: FiberId,
    child: FiberId,
    tag: FiberTag,
    feature: &'static str,
    render_lanes: Lanes,
) {
    match tag {
        FiberTag::Suspense => match error {
            HostRootChildBeginWorkPreflightError::UnsupportedSuspenseChildShape {
                root,
                host_root_work_in_progress: actual_work_in_progress,
                suspense,
            } => {
                assert_eq!(root, root_id);
                assert_eq!(actual_work_in_progress, host_root_work_in_progress);
                assert_eq!(suspense.fiber(), child);
                assert_eq!(suspense.shape(), UnsupportedSuspenseChildShapeKind::Empty);
                assert_eq!(suspense.child(), None);
                assert_eq!(suspense.render_lanes(), render_lanes);
                let thenable = suspense.thenable_ping_blocker();
                assert_eq!(
                    thenable.thenable_identity_class(),
                    UnsupportedThenableIdentityClass::NoThenable
                );
                assert_eq!(thenable.ping_lane(), render_lanes.highest_priority_lane());
                assert_eq!(
                    thenable.retry_queue_kind(),
                    UnsupportedThenableRetryQueueKind::None
                );
                assert!(!thenable.primary_child_rendering_blocked());
                assert!(!thenable.fallback_child_rendering_blocked());
                assert_eq!(suspense.feature(), feature);
            }
            other => panic!("expected Suspense child-shape preflight, got {other:?}"),
        },
        FiberTag::Offscreen => match error {
            HostRootChildBeginWorkPreflightError::UnsupportedOffscreenChildShape {
                root,
                host_root_work_in_progress: actual_work_in_progress,
                offscreen,
            } => {
                assert_eq!(root, root_id);
                assert_eq!(actual_work_in_progress, host_root_work_in_progress);
                assert_eq!(offscreen.fiber(), child);
                assert_eq!(offscreen.shape(), UnsupportedOffscreenChildShapeKind::Empty);
                assert_eq!(offscreen.child(), None);
                assert_eq!(offscreen.render_lanes(), render_lanes);
                let thenable = offscreen.thenable_ping_blocker();
                assert_eq!(
                    thenable.thenable_identity_class(),
                    UnsupportedThenableIdentityClass::NoThenable
                );
                assert_eq!(thenable.ping_lane(), render_lanes.highest_priority_lane());
                assert_eq!(
                    thenable.retry_queue_kind(),
                    UnsupportedThenableRetryQueueKind::None
                );
                assert!(!thenable.primary_child_rendering_blocked());
                assert!(!thenable.fallback_child_rendering_blocked());
                assert_eq!(offscreen.feature(), feature);
            }
            other => panic!("expected Offscreen child-shape preflight, got {other:?}"),
        },
        FiberTag::SuspenseList => match error {
            HostRootChildBeginWorkPreflightError::UnsupportedSuspenseListChildShape {
                root,
                host_root_work_in_progress: actual_work_in_progress,
                suspense_list,
            } => {
                assert_eq!(root, root_id);
                assert_eq!(actual_work_in_progress, host_root_work_in_progress);
                assert_eq!(suspense_list.fiber(), child);
                assert_eq!(
                    suspense_list.shape(),
                    UnsupportedSuspenseListChildShapeKind::Empty
                );
                assert_eq!(suspense_list.child(), None);
                assert_eq!(suspense_list.render_lanes(), render_lanes);
                assert_eq!(suspense_list.feature(), feature);
            }
            other => panic!("expected SuspenseList child-shape preflight, got {other:?}"),
        },
        FiberTag::Activity => match error {
            HostRootChildBeginWorkPreflightError::UnsupportedActivityChildShape {
                root,
                host_root_work_in_progress: actual_work_in_progress,
                activity,
            } => {
                assert_eq!(root, root_id);
                assert_eq!(actual_work_in_progress, host_root_work_in_progress);
                assert_eq!(activity.fiber(), child);
                assert_eq!(activity.shape(), UnsupportedActivityChildShapeKind::Empty);
                assert_eq!(activity.child(), None);
                assert_eq!(activity.render_lanes(), render_lanes);
                assert_eq!(activity.feature(), feature);
            }
            other => panic!("expected Activity child-shape preflight, got {other:?}"),
        },
        _ => assert_eq!(
            error,
            HostRootChildBeginWorkPreflightError::UnsupportedReconcilerFiberFeature {
                fiber: child,
                tag,
                feature,
            }
        ),
    }
}

