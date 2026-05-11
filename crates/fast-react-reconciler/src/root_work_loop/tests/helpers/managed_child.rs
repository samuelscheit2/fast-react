fn root_work_loop_hook_callback(raw: u64) -> HookEffectCallbackHandle {
    HookEffectCallbackHandle::from_raw(raw)
}

fn root_work_loop_hook_dependencies(raw: u64) -> HookEffectDependencies {
    HookEffectDependencies::array(DependenciesHandle::from_raw(raw))
}

fn attach_managed_child_sibling_order_host_root_child(
    store: &mut FiberRootStore<RecordingHost>,
    host_root: FiberId,
    state_node: StateNodeHandle,
    pending_props: PropsHandle,
    memoized_props: PropsHandle,
) -> FiberId {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let child =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, pending_props, mode);
    {
        let node = store.fiber_arena_mut().get_mut(child).unwrap();
        node.set_state_node(state_node);
        node.set_memoized_props(memoized_props);
    }
    store
        .fiber_arena_mut()
        .set_children(host_root, &[child])
        .unwrap();
    child
}

fn bubble_managed_child_sibling_order_root_work_loop_fiber(
    store: &mut FiberRootStore<RecordingHost>,
    fiber: FiberId,
) {
    let bubbled = bubble_properties(store.fiber_arena(), fiber).unwrap();
    let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());
}

fn prepare_root_work_loop_managed_child_pending_commit(
    store: &mut FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
    handoff_order: usize,
) -> HostRootFinishedWorkPendingCommitRecordForCanary {
    store
        .root_mut(render.root())
        .unwrap()
        .record_finished_work_for_canary(render.finished_work(), render.render_lanes());
    record_host_root_finished_work_pending_commit_for_canary(store, render, handoff_order).unwrap()
}

fn prepare_root_work_loop_deleted_subtree_teardown_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    root_id: FiberRootId,
    raw: u64,
) -> DeletedSubtreeRootWorkLoopTeardownFixture {
    let mut detached_hosts = DetachedHostRecords::new_for_canary();
    let mut hook_store = FunctionComponentHookRenderStore::new();

    update_container(store, root_id, RootElementHandle::from_raw(raw), None).unwrap();
    let create_render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let host_root = create_render.finished_work();
    let mode = store.fiber_arena().get(host_root).unwrap().mode();

    let text_props = PropsHandle::from_raw(raw + 1);
    let deleted_text =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostText, None, text_props, mode);
    let deleted_text_state_node = create_detached_test_host_text_for_existing_fiber_for_canary(
        store,
        host,
        &mut detached_hosts,
        root_id,
        deleted_text,
        "root work loop deleted passive text",
        text_props,
    )
    .unwrap();

    let function_props = PropsHandle::from_raw(raw + 2);
    let deleted_function = store.fiber_arena_mut().create_fiber(
        FiberTag::FunctionComponent,
        None,
        function_props,
        mode,
    );
    {
        let node = store.fiber_arena_mut().get_mut(deleted_function).unwrap();
        node.set_fiber_type(FiberTypeHandle::from_raw(raw + 3));
    }
    store
        .fiber_arena_mut()
        .set_children(deleted_function, &[deleted_text])
        .unwrap();
    let passive_create = root_work_loop_hook_callback(raw + 4);
    let passive_destroy = root_work_loop_hook_callback(raw + 5);
    let passive_dependencies = root_work_loop_hook_dependencies(raw + 6);
    hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            deleted_function,
            FunctionComponentEffectPhase::Passive,
            passive_create,
            passive_dependencies,
            Some(passive_destroy),
        )
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, deleted_function);

    let deleted_host_props = PropsHandle::from_raw(raw + 7);
    let deleted_host = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        deleted_host_props,
        mode,
    );
    let deleted_host_ref = RefHandle::from_raw(raw + 8);
    {
        let node = store.fiber_arena_mut().get_mut(deleted_host).unwrap();
        node.set_ref_handle(deleted_host_ref);
    }
    store
        .fiber_arena_mut()
        .set_children(deleted_host, &[deleted_function])
        .unwrap();
    let deleted_host_state_node =
        create_detached_test_host_component_for_existing_fiber_for_canary(
            store,
            host,
            &mut detached_hosts,
            root_id,
            deleted_host,
            "article",
            deleted_host_props,
            &[deleted_text],
        )
        .unwrap();

    let host_parent_props = PropsHandle::from_raw(raw + 9);
    let host_parent = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        host_parent_props,
        mode,
    );
    {
        let node = store.fiber_arena_mut().get_mut(host_parent).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
    }
    store
        .fiber_arena_mut()
        .set_children(host_parent, &[deleted_host])
        .unwrap();
    let host_parent_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
        store,
        host,
        &mut detached_hosts,
        root_id,
        host_parent,
        "section",
        host_parent_props,
        &[deleted_host],
    )
    .unwrap();

    store
        .fiber_arena_mut()
        .set_children(host_root, &[host_parent])
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, host_root);
    commit_finished_host_root(store, create_render).unwrap();

    update_container(store, root_id, RootElementHandle::from_raw(raw + 10), None).unwrap();
    let delete_render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let previous_current = delete_render.current();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(host_parent, host_parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_lanes(Lanes::NO);
        node.set_memoized_props(host_parent_props);
    }
    let deletion_list = store
        .fiber_arena_mut()
        .mark_child_for_deletion(work_parent, deleted_host)
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(delete_render.finished_work(), &[work_parent])
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, delete_render.finished_work());
    let deleted_passive_handoff = queue_function_component_deleted_subtree_pending_passive_effects(
        store,
        root_id,
        &hook_store,
        work_parent,
        deleted_host,
        Lanes::DEFAULT,
    )
    .unwrap();
    let pending = prepare_root_work_loop_managed_child_pending_commit(
        store,
        delete_render,
        ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_SOURCE_ORDER,
    );
    let operations_before_teardown = host.operations();

    DeletedSubtreeRootWorkLoopTeardownFixture {
        delete_render,
        pending,
        previous_current,
        work_parent,
        deletion_list,
        host_parent_state_node,
        deleted_host,
        deleted_host_state_node,
        deleted_host_ref,
        deleted_function,
        deleted_text,
        deleted_text_state_node,
        passive_create,
        passive_destroy,
        passive_dependencies,
        deleted_passive_handoff,
        detached_hosts,
        operations_before_teardown,
    }
}

fn prepare_root_work_loop_function_component_deleted_subtree_teardown_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    root_id: FiberRootId,
    raw: u64,
) -> FunctionComponentDeletedSubtreeTeardownFixture {
    let mut source = TestHostTree::new();
    let child_element =
        source.insert_host_element_with_text("article", format!("function delete {raw}"));
    let root_element = RootElementHandle::from_raw(raw);

    update_container(store, root_id, root_element, None).unwrap();
    let mount_render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let (_function_current, function_component, component) =
        attach_function_component_wip_child(store, mount_render.work_in_progress());
    let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));
    let resolver = TestHostTreeFunctionOutputResolver::new(&source);
    let begin_work = begin_work_reconcile_function_component_single_child(
        store.fiber_arena_mut(),
        BeginWorkRequest::new(function_component, mount_render.render_lanes()),
        &mut registry,
        &resolver,
    )
    .unwrap();
    let single_child = begin_work.single_child();
    assert_eq!(single_child.function_component(), function_component);
    assert_eq!(single_child.child_element(), child_element);
    assert_eq!(single_child.child_tag(), FiberTag::HostComponent);
    let mut host_work = mount_test_function_component_single_host_child_work(
        store,
        host,
        mount_render,
        function_component,
        single_child.child_element(),
        &source,
    )
    .unwrap();
    let complete_work = host_root_complete_work_handoff_record_from_host_work(
        store,
        mount_render,
        single_child.child_element(),
        &host_work,
    )
    .unwrap();
    let mount_handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        store,
        mount_render,
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_SOURCE_ORDER,
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_COMMIT_ORDER - 1,
    )
    .unwrap();
    let host_mutation_apply = execute_function_component_single_child_host_mutation_for_canary(
        store,
        host,
        mount_render,
        function_component,
        single_child,
        complete_work,
        mount_handoff.commit(),
        &mut host_work,
    )
    .unwrap();

    let function_host_child = complete_work.completed_child().unwrap();
    let function_host_text = store
        .fiber_arena()
        .get(function_host_child)
        .unwrap()
        .child()
        .unwrap();
    let function_host_child_state_node = store
        .fiber_arena()
        .get(function_host_child)
        .unwrap()
        .state_node();
    let function_host_text_state_node = store
        .fiber_arena()
        .get(function_host_text)
        .unwrap()
        .state_node();
    let function_host_child_ref = RefHandle::from_raw(raw + 1);
    {
        let node = store
            .fiber_arena_mut()
            .get_mut(function_host_child)
            .unwrap();
        node.set_ref_handle(function_host_child_ref);
    }

    let mut hook_store = FunctionComponentHookRenderStore::new();
    let passive_create = root_work_loop_hook_callback(raw + 2);
    let passive_destroy = root_work_loop_hook_callback(raw + 3);
    let passive_dependencies = root_work_loop_hook_dependencies(raw + 4);
    hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            function_component,
            FunctionComponentEffectPhase::Passive,
            passive_create,
            passive_dependencies,
            Some(passive_destroy),
        )
        .unwrap();

    update_container(store, root_id, RootElementHandle::from_raw(raw + 5), None).unwrap();
    let delete_render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let previous_current = delete_render.current();
    let deletion_list = store
        .fiber_arena_mut()
        .mark_child_for_deletion(delete_render.finished_work(), function_component)
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(delete_render.finished_work(), &[])
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, delete_render.finished_work());
    let deleted_passive_handoff = queue_function_component_deleted_subtree_pending_passive_effects(
        store,
        root_id,
        &hook_store,
        delete_render.finished_work(),
        function_component,
        Lanes::DEFAULT,
    )
    .unwrap();
    let pending = prepare_root_work_loop_managed_child_pending_commit(
        store,
        delete_render,
        ROOT_WORK_LOOP_FUNCTION_COMPONENT_DELETE_TEARDOWN_SOURCE_ORDER,
    );
    let operations_before_teardown = host.operations();
    let detached_hosts = host_work.into_detached_hosts_for_canary();

    FunctionComponentDeletedSubtreeTeardownFixture {
        mount_render,
        complete_work,
        host_mutation_apply,
        delete_render,
        pending,
        previous_current,
        deletion_list,
        function_component,
        single_child,
        function_host_child,
        function_host_child_state_node,
        function_host_child_ref,
        function_host_text,
        function_host_text_state_node,
        passive_create,
        passive_destroy,
        passive_dependencies,
        deleted_passive_handoff,
        detached_hosts,
        operations_before_teardown,
    }
}

fn execute_function_component_deleted_subtree_teardown_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    handoff: &HostRootFinishedWorkCommitHandoffRecordForCanary,
    source_request: crate::host_work::TestHostRootDeletionTeardownExecutionRequestForCanary,
    request: crate::host_work::TestHostRootDeletionTeardownExecutionRequestForCanary,
    fixture: &mut FunctionComponentDeletedSubtreeTeardownFixture,
    executor: &mut RecordingDeletedSubtreeTeardownExecutor,
) -> Result<
    TestHostRootDeletionTeardownExecutionDiagnosticForCanary,
    FunctionComponentDeletedSubtreeTeardownExecutionError,
> {
    validate_function_component_deleted_subtree_teardown_source(
        store,
        handoff,
        source_request,
        request,
        fixture,
    )?;

    execute_test_host_root_deletion_teardown_after_commit_for_canary(
        store,
        host,
        handoff,
        source_request,
        request,
        &mut fixture.detached_hosts,
        executor,
    )
    .map_err(FunctionComponentDeletedSubtreeTeardownExecutionError::from)
}

fn validate_function_component_deleted_subtree_teardown_source(
    store: &FiberRootStore<RecordingHost>,
    handoff: &HostRootFinishedWorkCommitHandoffRecordForCanary,
    source_request: crate::host_work::TestHostRootDeletionTeardownExecutionRequestForCanary,
    request: crate::host_work::TestHostRootDeletionTeardownExecutionRequestForCanary,
    fixture: &FunctionComponentDeletedSubtreeTeardownFixture,
) -> Result<(), FunctionComponentDeletedSubtreeTeardownExecutionError> {
    let commit = handoff.commit();
    if commit.root() != source_request.root() {
        return Err(
            TestHostRootDeletionTeardownExecutionErrorForCanary::MismatchedRootOwnership {
                expected_root: source_request.root(),
                actual_root: commit.root(),
            }
            .into(),
        );
    }
    if commit.finished_work() != source_request.finished_work() {
        return Err(
            TestHostRootDeletionTeardownExecutionErrorForCanary::MismatchedFinishedWork {
                root: source_request.root(),
                expected_finished_work: source_request.finished_work(),
                actual_finished_work: commit.finished_work(),
            }
            .into(),
        );
    }
    if source_request != request {
        return Err(
            TestHostRootDeletionTeardownExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root: request.root(),
                commit_order: request.commit_order(),
                request_order: request.request_order(),
            }
            .into(),
        );
    }

    let root = store.root(request.root())?;
    if root.current() != request.committed_current() {
        return Err(
            FunctionComponentDeletedSubtreeTeardownExecutionError::StaleCommittedCurrent {
                root: request.root(),
                expected_current: request.committed_current(),
                actual_current: root.current(),
            },
        );
    }

    let finished_root = store.fiber_arena().get(request.committed_current())?;
    if finished_root.child().is_some() {
        return Err(
            FunctionComponentDeletedSubtreeTeardownExecutionError::RootFinishedChildMismatch {
                root: request.root(),
                expected_child: None,
                actual_child: finished_root.child(),
            },
        );
    }

    let [deletion_list] = commit.deletion_lists() else {
        return Err(
            FunctionComponentDeletedSubtreeTeardownExecutionError::DeletionListMismatch {
                root: request.root(),
                expected_parent: fixture.delete_render.finished_work(),
                actual_parent: commit.deletion_lists().first().map(|list| list.parent()),
                expected_deleted: fixture.function_component,
                actual_deleted: commit
                    .deletion_lists()
                    .first()
                    .map(|list| list.deleted().to_vec())
                    .unwrap_or_default(),
            },
        );
    };
    if deletion_list.parent() != fixture.delete_render.finished_work()
        || deletion_list.deleted() != [fixture.function_component]
    {
        return Err(
            FunctionComponentDeletedSubtreeTeardownExecutionError::DeletionListMismatch {
                root: request.root(),
                expected_parent: fixture.delete_render.finished_work(),
                actual_parent: Some(deletion_list.parent()),
                expected_deleted: fixture.function_component,
                actual_deleted: deletion_list.deleted().to_vec(),
            },
        );
    }

    let function_node = store.fiber_arena().get(fixture.function_component)?;
    if function_node.return_fiber() != Some(fixture.delete_render.finished_work())
        || function_node.child() != Some(fixture.function_host_child)
        || function_node.sibling().is_some()
    {
        return Err(
            FunctionComponentDeletedSubtreeTeardownExecutionError::FunctionComponentTopologyMismatch {
                root: request.root(),
                function_component: fixture.function_component,
                expected_parent: fixture.delete_render.finished_work(),
                actual_parent: function_node.return_fiber(),
                expected_child: fixture.function_host_child,
                actual_child: function_node.child(),
                actual_sibling: function_node.sibling(),
            },
        );
    }

    let host_child = store.fiber_arena().get(fixture.function_host_child)?;
    if host_child.return_fiber() != Some(fixture.function_component)
        || host_child.sibling().is_some()
        || host_child.tag() != fixture.single_child.child_tag()
    {
        return Err(
            FunctionComponentDeletedSubtreeTeardownExecutionError::FunctionComponentHostChildMismatch {
                root: request.root(),
                function_component: fixture.function_component,
                expected_child: fixture.function_host_child,
                actual_child: fixture.function_host_child,
                expected_tag: fixture.single_child.child_tag(),
                actual_tag: host_child.tag(),
                actual_parent: host_child.return_fiber(),
                actual_sibling: host_child.sibling(),
            },
        );
    }

    Ok(())
}

fn prepare_root_work_loop_managed_child_append_execution_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    root_id: FiberRootId,
    raw: u64,
) -> ManagedChildRootWorkLoopHostExecutionFixture {
    let mut detached_hosts = DetachedHostRecords::new_for_canary();
    let current_root = store.root(root_id).unwrap().current();
    let parent_props = PropsHandle::from_raw(raw + 1);
    let child_props = PropsHandle::from_raw(raw + 2);
    let mode = store.fiber_arena().get(current_root).unwrap().mode();

    let current_parent =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, parent_props, mode);
    let parent_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
        store,
        host,
        &mut detached_hosts,
        root_id,
        current_parent,
        "section",
        parent_props,
        &[],
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(current_root, &[current_parent])
        .unwrap();

    update_container(store, root_id, RootElementHandle::from_raw(raw + 3), None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
        node.set_lanes(Lanes::NO);
    }
    let child =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, child_props, mode);
    store
        .fiber_arena_mut()
        .get_mut(child)
        .unwrap()
        .set_flags(FiberFlags::PLACEMENT);
    let child_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
        store,
        host,
        &mut detached_hosts,
        root_id,
        child,
        "span",
        child_props,
        &[],
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[child])
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, child);
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, work_parent);
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, render.finished_work());

    let complete_work = host_component_managed_child_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_parent,
        child,
        HostComponentManagedChildMutationKindForCanary::Placement,
    )
    .unwrap();
    let pending = prepare_root_work_loop_managed_child_pending_commit(
        store,
        render,
        ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_SOURCE_ORDER,
    );
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    ManagedChildRootWorkLoopHostExecutionFixture {
        render,
        pending,
        complete_work,
        current_parent,
        work_parent,
        child,
        parent_state_node,
        child_state_node,
        previous_current,
        detached_hosts,
        operations_before_apply,
        token_count_before_apply,
    }
}

fn prepare_root_work_loop_managed_child_placement_sibling_order_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    raw: u64,
) -> ManagedChildSiblingOrderRootWorkLoopFixture {
    let current_root = store.root(root_id).unwrap().current();
    let parent_state_node = StateNodeHandle::from_raw(raw + 1);
    let child_state_node = StateNodeHandle::from_raw(raw + 2);
    let order_sibling_state_node = StateNodeHandle::from_raw(raw + 3);
    let parent_props = PropsHandle::from_raw(raw + 4);
    let child_props = PropsHandle::from_raw(raw + 5);
    let order_sibling_props = PropsHandle::from_raw(raw + 6);
    let current_parent = attach_managed_child_sibling_order_host_root_child(
        store,
        current_root,
        parent_state_node,
        parent_props,
        parent_props,
    );
    let mode = store.fiber_arena().get(current_parent).unwrap().mode();
    let order_sibling_current = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        order_sibling_props,
        mode,
    );
    {
        let node = store
            .fiber_arena_mut()
            .get_mut(order_sibling_current)
            .unwrap();
        node.set_state_node(order_sibling_state_node);
        node.set_memoized_props(order_sibling_props);
    }
    store
        .fiber_arena_mut()
        .set_children(current_parent, &[order_sibling_current])
        .unwrap();

    update_container(store, root_id, RootElementHandle::from_raw(raw + 7), None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
        node.set_lanes(Lanes::NO);
    }
    let child =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, child_props, mode);
    {
        let node = store.fiber_arena_mut().get_mut(child).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
        node.set_state_node(child_state_node);
        node.set_memoized_props(child_props);
    }
    let order_sibling = store
        .fiber_arena_mut()
        .create_work_in_progress(order_sibling_current, order_sibling_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
        node.set_state_node(order_sibling_state_node);
        node.set_memoized_props(order_sibling_props);
        node.set_lanes(Lanes::NO);
    }
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[child, order_sibling])
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, child);
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, order_sibling);
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, work_parent);
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, render.finished_work());

    let complete_work = host_component_managed_child_sibling_order_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_parent,
        child,
        order_sibling,
        HostComponentManagedChildMutationKindForCanary::Placement,
    )
    .unwrap();
    let pending = prepare_root_work_loop_managed_child_pending_commit(
        store,
        render,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_SOURCE_ORDER,
    );
    let previous_current = store.root(root_id).unwrap().current();

    ManagedChildSiblingOrderRootWorkLoopFixture {
        render,
        pending,
        complete_work,
        current_parent,
        work_parent,
        child,
        order_sibling,
        order_sibling_current,
        parent_state_node,
        child_state_node,
        order_sibling_state_node,
        parent_props,
        child_props,
        order_sibling_props,
        previous_current,
        deletion_list: None,
    }
}

fn prepare_root_work_loop_managed_child_delete_sibling_order_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    raw: u64,
) -> ManagedChildSiblingOrderRootWorkLoopFixture {
    let current_root = store.root(root_id).unwrap().current();
    let parent_state_node = StateNodeHandle::from_raw(raw + 1);
    let child_state_node = StateNodeHandle::from_raw(raw + 2);
    let order_sibling_state_node = StateNodeHandle::from_raw(raw + 3);
    let parent_props = PropsHandle::from_raw(raw + 4);
    let child_props = PropsHandle::from_raw(raw + 5);
    let order_sibling_props = PropsHandle::from_raw(raw + 6);
    let current_parent = attach_managed_child_sibling_order_host_root_child(
        store,
        current_root,
        parent_state_node,
        parent_props,
        parent_props,
    );
    let mode = store.fiber_arena().get(current_parent).unwrap().mode();
    let order_sibling_current = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        order_sibling_props,
        mode,
    );
    let child =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, child_props, mode);
    {
        let node = store
            .fiber_arena_mut()
            .get_mut(order_sibling_current)
            .unwrap();
        node.set_state_node(order_sibling_state_node);
        node.set_memoized_props(order_sibling_props);
    }
    {
        let node = store.fiber_arena_mut().get_mut(child).unwrap();
        node.set_state_node(child_state_node);
        node.set_memoized_props(child_props);
    }
    store
        .fiber_arena_mut()
        .set_children(current_parent, &[order_sibling_current, child])
        .unwrap();

    update_container(store, root_id, RootElementHandle::from_raw(raw + 7), None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
        node.set_lanes(Lanes::NO);
    }
    let order_sibling = store
        .fiber_arena_mut()
        .create_work_in_progress(order_sibling_current, order_sibling_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
        node.set_state_node(order_sibling_state_node);
        node.set_memoized_props(order_sibling_props);
        node.set_lanes(Lanes::NO);
    }
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[order_sibling])
        .unwrap();
    let deletion_list = store
        .fiber_arena_mut()
        .mark_child_for_deletion(work_parent, child)
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, order_sibling);
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, work_parent);
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, render.finished_work());

    let complete_work = host_component_managed_child_sibling_order_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_parent,
        child,
        order_sibling,
        HostComponentManagedChildMutationKindForCanary::DeleteDetach,
    )
    .unwrap();
    let pending = prepare_root_work_loop_managed_child_pending_commit(
        store,
        render,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_SOURCE_ORDER,
    );
    let previous_current = store.root(root_id).unwrap().current();

    ManagedChildSiblingOrderRootWorkLoopFixture {
        render,
        pending,
        complete_work,
        current_parent,
        work_parent,
        child,
        order_sibling,
        order_sibling_current,
        parent_state_node,
        child_state_node,
        order_sibling_state_node,
        parent_props,
        child_props,
        order_sibling_props,
        previous_current,
        deletion_list: Some(deletion_list),
    }
}

fn prepare_root_work_loop_managed_child_placement_sibling_order_execution_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    root_id: FiberRootId,
    raw: u64,
) -> ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture {
    let mut detached_hosts = DetachedHostRecords::new_for_canary();
    let current_root = store.root(root_id).unwrap().current();
    let parent_props = PropsHandle::from_raw(raw + 1);
    let child_props = PropsHandle::from_raw(raw + 2);
    let order_sibling_props = PropsHandle::from_raw(raw + 3);
    let mode = store.fiber_arena().get(current_root).unwrap().mode();

    let current_parent =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, parent_props, mode);
    let order_sibling_current = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        order_sibling_props,
        mode,
    );
    let order_sibling_state_node =
        create_detached_test_host_component_for_existing_fiber_for_canary(
            store,
            host,
            &mut detached_hosts,
            root_id,
            order_sibling_current,
            "strong",
            order_sibling_props,
            &[],
        )
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(current_parent, &[order_sibling_current])
        .unwrap();
    let parent_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
        store,
        host,
        &mut detached_hosts,
        root_id,
        current_parent,
        "section",
        parent_props,
        &[order_sibling_current],
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(current_root, &[current_parent])
        .unwrap();

    update_container(store, root_id, RootElementHandle::from_raw(raw + 4), None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
        node.set_lanes(Lanes::NO);
    }
    let child =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, child_props, mode);
    store
        .fiber_arena_mut()
        .get_mut(child)
        .unwrap()
        .set_flags(FiberFlags::PLACEMENT);
    let child_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
        store,
        host,
        &mut detached_hosts,
        root_id,
        child,
        "span",
        child_props,
        &[],
    )
    .unwrap();
    let order_sibling = store
        .fiber_arena_mut()
        .create_work_in_progress(order_sibling_current, order_sibling_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
        node.set_state_node(order_sibling_state_node);
        node.set_memoized_props(order_sibling_props);
        node.set_lanes(Lanes::NO);
    }
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[child, order_sibling])
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, child);
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, order_sibling);
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, work_parent);
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, render.finished_work());

    let complete_work = host_component_managed_child_sibling_order_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_parent,
        child,
        order_sibling,
        HostComponentManagedChildMutationKindForCanary::Placement,
    )
    .unwrap();
    let pending = prepare_root_work_loop_managed_child_pending_commit(
        store,
        render,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_SOURCE_ORDER,
    );
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture {
        render,
        pending,
        complete_work,
        current_parent,
        work_parent,
        child,
        order_sibling,
        order_sibling_current,
        parent_state_node,
        child_state_node,
        order_sibling_state_node,
        previous_current,
        deletion_list: None,
        detached_hosts,
        operations_before_apply,
        token_count_before_apply,
    }
}

fn prepare_root_work_loop_managed_child_delete_sibling_order_execution_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    root_id: FiberRootId,
    raw: u64,
) -> ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture {
    let mut detached_hosts = DetachedHostRecords::new_for_canary();
    let current_root = store.root(root_id).unwrap().current();
    let parent_props = PropsHandle::from_raw(raw + 1);
    let child_props = PropsHandle::from_raw(raw + 2);
    let order_sibling_props = PropsHandle::from_raw(raw + 3);
    let mode = store.fiber_arena().get(current_root).unwrap().mode();

    let current_parent =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, parent_props, mode);
    let order_sibling_current = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        order_sibling_props,
        mode,
    );
    let child =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, child_props, mode);
    let order_sibling_state_node =
        create_detached_test_host_component_for_existing_fiber_for_canary(
            store,
            host,
            &mut detached_hosts,
            root_id,
            order_sibling_current,
            "strong",
            order_sibling_props,
            &[],
        )
        .unwrap();
    let child_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
        store,
        host,
        &mut detached_hosts,
        root_id,
        child,
        "span",
        child_props,
        &[],
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(current_parent, &[order_sibling_current, child])
        .unwrap();
    let parent_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
        store,
        host,
        &mut detached_hosts,
        root_id,
        current_parent,
        "section",
        parent_props,
        &[order_sibling_current, child],
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(current_root, &[current_parent])
        .unwrap();

    update_container(store, root_id, RootElementHandle::from_raw(raw + 4), None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
        node.set_lanes(Lanes::NO);
    }
    let order_sibling = store
        .fiber_arena_mut()
        .create_work_in_progress(order_sibling_current, order_sibling_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
        node.set_state_node(order_sibling_state_node);
        node.set_memoized_props(order_sibling_props);
        node.set_lanes(Lanes::NO);
    }
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[order_sibling])
        .unwrap();
    let deletion_list = store
        .fiber_arena_mut()
        .mark_child_for_deletion(work_parent, child)
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, order_sibling);
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, work_parent);
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, render.finished_work());

    let complete_work = host_component_managed_child_sibling_order_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_parent,
        child,
        order_sibling,
        HostComponentManagedChildMutationKindForCanary::DeleteDetach,
    )
    .unwrap();
    let pending = prepare_root_work_loop_managed_child_pending_commit(
        store,
        render,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_SOURCE_ORDER,
    );
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture {
        render,
        pending,
        complete_work,
        current_parent,
        work_parent,
        child,
        order_sibling,
        order_sibling_current,
        parent_state_node,
        child_state_node,
        order_sibling_state_node,
        previous_current,
        deletion_list: Some(deletion_list),
        detached_hosts,
        operations_before_apply,
        token_count_before_apply,
    }
}

fn prepare_root_work_loop_managed_child_text_append_execution_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    root_id: FiberRootId,
    raw: u64,
) -> ManagedChildRootWorkLoopHostExecutionFixture {
    let mut detached_hosts = DetachedHostRecords::new_for_canary();
    let current_root = store.root(root_id).unwrap().current();
    let parent_props = PropsHandle::from_raw(raw + 1);
    let child_props = PropsHandle::from_raw(raw + 2);
    let mode = store.fiber_arena().get(current_root).unwrap().mode();

    let current_parent =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, parent_props, mode);
    let parent_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
        store,
        host,
        &mut detached_hosts,
        root_id,
        current_parent,
        "section",
        parent_props,
        &[],
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(current_root, &[current_parent])
        .unwrap();

    update_container(store, root_id, RootElementHandle::from_raw(raw + 3), None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
        node.set_lanes(Lanes::NO);
    }
    let child = store
        .fiber_arena_mut()
        .create_fiber(FiberTag::HostText, None, child_props, mode);
    store
        .fiber_arena_mut()
        .get_mut(child)
        .unwrap()
        .set_flags(FiberFlags::PLACEMENT);
    let child_state_node = create_detached_test_host_text_for_existing_fiber_for_canary(
        store,
        host,
        &mut detached_hosts,
        root_id,
        child,
        "managed text append",
        child_props,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[child])
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, child);
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, work_parent);
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, render.finished_work());

    let complete_work = host_component_managed_child_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_parent,
        child,
        HostComponentManagedChildMutationKindForCanary::Placement,
    )
    .unwrap();
    let pending = prepare_root_work_loop_managed_child_pending_commit(
        store,
        render,
        ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_SOURCE_ORDER,
    );
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    ManagedChildRootWorkLoopHostExecutionFixture {
        render,
        pending,
        complete_work,
        current_parent,
        work_parent,
        child,
        parent_state_node,
        child_state_node,
        previous_current,
        detached_hosts,
        operations_before_apply,
        token_count_before_apply,
    }
}

fn prepare_root_work_loop_managed_child_text_placement_sibling_order_execution_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    root_id: FiberRootId,
    raw: u64,
) -> ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture {
    let mut detached_hosts = DetachedHostRecords::new_for_canary();
    let current_root = store.root(root_id).unwrap().current();
    let parent_props = PropsHandle::from_raw(raw + 1);
    let child_props = PropsHandle::from_raw(raw + 2);
    let order_sibling_props = PropsHandle::from_raw(raw + 3);
    let mode = store.fiber_arena().get(current_root).unwrap().mode();

    let current_parent =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, parent_props, mode);
    let order_sibling_current =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostText, None, order_sibling_props, mode);
    let order_sibling_state_node = create_detached_test_host_text_for_existing_fiber_for_canary(
        store,
        host,
        &mut detached_hosts,
        root_id,
        order_sibling_current,
        "managed stable text",
        order_sibling_props,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(current_parent, &[order_sibling_current])
        .unwrap();
    let parent_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
        store,
        host,
        &mut detached_hosts,
        root_id,
        current_parent,
        "section",
        parent_props,
        &[order_sibling_current],
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(current_root, &[current_parent])
        .unwrap();

    update_container(store, root_id, RootElementHandle::from_raw(raw + 4), None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
        node.set_lanes(Lanes::NO);
    }
    let child = store
        .fiber_arena_mut()
        .create_fiber(FiberTag::HostText, None, child_props, mode);
    store
        .fiber_arena_mut()
        .get_mut(child)
        .unwrap()
        .set_flags(FiberFlags::PLACEMENT);
    let child_state_node = create_detached_test_host_text_for_existing_fiber_for_canary(
        store,
        host,
        &mut detached_hosts,
        root_id,
        child,
        "managed inserted text",
        child_props,
    )
    .unwrap();
    let order_sibling = store
        .fiber_arena_mut()
        .create_work_in_progress(order_sibling_current, order_sibling_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
        node.set_state_node(order_sibling_state_node);
        node.set_memoized_props(order_sibling_props);
        node.set_lanes(Lanes::NO);
    }
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[child, order_sibling])
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, child);
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, order_sibling);
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, work_parent);
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, render.finished_work());

    let complete_work = host_component_managed_child_sibling_order_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_parent,
        child,
        order_sibling,
        HostComponentManagedChildMutationKindForCanary::Placement,
    )
    .unwrap();
    let pending = prepare_root_work_loop_managed_child_pending_commit(
        store,
        render,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_SOURCE_ORDER,
    );
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture {
        render,
        pending,
        complete_work,
        current_parent,
        work_parent,
        child,
        order_sibling,
        order_sibling_current,
        parent_state_node,
        child_state_node,
        order_sibling_state_node,
        previous_current,
        deletion_list: None,
        detached_hosts,
        operations_before_apply,
        token_count_before_apply,
    }
}

fn prepare_root_work_loop_managed_child_text_delete_sibling_order_execution_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    root_id: FiberRootId,
    raw: u64,
) -> ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture {
    let mut detached_hosts = DetachedHostRecords::new_for_canary();
    let current_root = store.root(root_id).unwrap().current();
    let parent_props = PropsHandle::from_raw(raw + 1);
    let child_props = PropsHandle::from_raw(raw + 2);
    let order_sibling_props = PropsHandle::from_raw(raw + 3);
    let mode = store.fiber_arena().get(current_root).unwrap().mode();

    let current_parent =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, parent_props, mode);
    let order_sibling_current =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostText, None, order_sibling_props, mode);
    let child = store
        .fiber_arena_mut()
        .create_fiber(FiberTag::HostText, None, child_props, mode);
    let order_sibling_state_node = create_detached_test_host_text_for_existing_fiber_for_canary(
        store,
        host,
        &mut detached_hosts,
        root_id,
        order_sibling_current,
        "managed kept text",
        order_sibling_props,
    )
    .unwrap();
    let child_state_node = create_detached_test_host_text_for_existing_fiber_for_canary(
        store,
        host,
        &mut detached_hosts,
        root_id,
        child,
        "managed deleted text",
        child_props,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(current_parent, &[order_sibling_current, child])
        .unwrap();
    let parent_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
        store,
        host,
        &mut detached_hosts,
        root_id,
        current_parent,
        "section",
        parent_props,
        &[order_sibling_current, child],
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(current_root, &[current_parent])
        .unwrap();

    update_container(store, root_id, RootElementHandle::from_raw(raw + 4), None).unwrap();
    let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
        node.set_lanes(Lanes::NO);
    }
    let order_sibling = store
        .fiber_arena_mut()
        .create_work_in_progress(order_sibling_current, order_sibling_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
        node.set_state_node(order_sibling_state_node);
        node.set_memoized_props(order_sibling_props);
        node.set_lanes(Lanes::NO);
    }
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[order_sibling])
        .unwrap();
    let deletion_list = store
        .fiber_arena_mut()
        .mark_child_for_deletion(work_parent, child)
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, order_sibling);
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, work_parent);
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    bubble_managed_child_sibling_order_root_work_loop_fiber(store, render.finished_work());

    let complete_work = host_component_managed_child_sibling_order_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_parent,
        child,
        order_sibling,
        HostComponentManagedChildMutationKindForCanary::DeleteDetach,
    )
    .unwrap();
    let pending = prepare_root_work_loop_managed_child_pending_commit(
        store,
        render,
        ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_SOURCE_ORDER,
    );
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture {
        render,
        pending,
        complete_work,
        current_parent,
        work_parent,
        child,
        order_sibling,
        order_sibling_current,
        parent_state_node,
        child_state_node,
        order_sibling_state_node,
        previous_current,
        deletion_list: Some(deletion_list),
        detached_hosts,
        operations_before_apply,
        token_count_before_apply,
    }
}

fn assert_root_work_loop_managed_child_sibling_order_handoff_common(
    store: &FiberRootStore<RecordingHost>,
    host: &RecordingHost,
    root_id: FiberRootId,
    fixture: ManagedChildSiblingOrderRootWorkLoopFixture,
    handoff: &HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary,
    commit_order: usize,
    request_order: usize,
) {
    let request = *handoff.execution_request();
    let finished_work_handoff = handoff.finished_work_handoff();

    assert_eq!(fixture.previous_current, fixture.render.current());
    assert_eq!(fixture.complete_work.root(), root_id);
    assert_eq!(
        fixture.complete_work.parent_current(),
        fixture.current_parent
    );
    assert_eq!(
        fixture.complete_work.parent_work_in_progress(),
        fixture.work_parent
    );
    assert_eq!(
        fixture.complete_work.parent_state_node(),
        fixture.parent_state_node
    );
    assert_eq!(fixture.complete_work.child(), fixture.child);
    assert_eq!(
        fixture.complete_work.child_state_node(),
        fixture.child_state_node
    );
    assert_eq!(
        fixture.complete_work.child_pending_props(),
        fixture.child_props
    );
    assert_eq!(
        fixture.complete_work.child_memoized_props(),
        fixture.child_props
    );
    assert_eq!(fixture.complete_work.order_sibling(), fixture.order_sibling);
    assert_eq!(
        fixture.complete_work.order_sibling_state_node(),
        fixture.order_sibling_state_node
    );
    assert_eq!(
        fixture.complete_work.order_sibling_pending_props(),
        fixture.order_sibling_props
    );
    assert_eq!(
        fixture.complete_work.order_sibling_memoized_props(),
        fixture.order_sibling_props
    );
    assert_eq!(
        fixture.complete_work.order_sibling_alternate(),
        Some(fixture.order_sibling_current)
    );
    assert!(fixture.complete_work.private_reconciler_handoff_only());
    assert!(!fixture.complete_work.public_dom_compatibility_claimed());
    assert!(!fixture.complete_work.test_renderer_compatibility_claimed());
    assert!(
        !fixture
            .complete_work
            .broad_reconciliation_traversal_claimed()
    );

    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.finished_work(), fixture.render.finished_work());
    assert_eq!(handoff.complete_work(), fixture.complete_work);
    assert_eq!(
        handoff.source_handoff_order(),
        fixture.pending.handoff_order()
    );
    assert_eq!(handoff.commit_order(), commit_order);
    assert_eq!(handoff.request_order(), request_order);
    assert_eq!(handoff.kind(), fixture.complete_work.kind());
    assert_eq!(handoff.order_sibling(), fixture.order_sibling);
    assert_eq!(
        handoff.order_sibling_state_node(),
        fixture.order_sibling_state_node
    );
    assert_eq!(
        handoff.order_evidence_name(),
        fixture.complete_work.order_evidence_name()
    );
    assert!(handoff.complete_metadata_matches_mutation());
    assert!(handoff.private_test_host_mutation_allowed());
    assert!(handoff.public_root_rendering_blocked());
    assert!(handoff.public_renderer_mutation_blocked());
    assert!(!handoff.public_dom_compatibility_claimed());
    assert!(!handoff.test_renderer_compatibility_claimed());

    assert_eq!(request.root(), root_id);
    assert_eq!(request.root_token(), root_id.state_node_handle());
    assert_eq!(request.previous_current(), fixture.previous_current);
    assert_eq!(request.finished_work(), fixture.render.finished_work());
    assert_eq!(request.committed_current(), fixture.render.finished_work());
    assert_eq!(
        request.source_handoff_order(),
        fixture.pending.handoff_order()
    );
    assert_eq!(request.commit_order(), commit_order);
    assert_eq!(request.request_order(), request_order);
    assert_eq!(request.mutation_index(), 0);
    assert_eq!(request.complete_work(), fixture.complete_work);
    assert_eq!(
        request.status(),
        HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation
    );
    assert!(request.private_test_host_mutation_allowed());
    assert!(request.public_root_rendering_blocked());
    assert!(request.public_renderer_mutation_blocked());
    assert!(!request.public_dom_compatibility_claimed());
    assert!(!request.test_renderer_compatibility_claimed());
    assert!(!request.hydration_events_refs_resources_forms_claimed());
    assert!(
        request
            .blockers()
            .contains(&HostRootManagedChildCommitExecutionBlockerForCanary::PublicRootRendering)
    );
    assert!(request.blockers().contains(
        &HostRootManagedChildCommitExecutionBlockerForCanary::PublicRendererHostMutation
    ));
    assert!(request.blockers().contains(
        &HostRootManagedChildCommitExecutionBlockerForCanary::ReactDomManagedChildCompatibilityClaim
    ));
    assert!(request.blockers().contains(
        &HostRootManagedChildCommitExecutionBlockerForCanary::ReactTestRendererCompatibilityClaim
    ));
    assert!(request.blockers().contains(
        &HostRootManagedChildCommitExecutionBlockerForCanary::HydrationEventsRefsResourcesFormsControlledInputClaim
    ));
    assert!(
        request.blockers().contains(
            &HostRootManagedChildCommitExecutionBlockerForCanary::PublicCompatibilityClaim
        )
    );

    assert_eq!(finished_work_handoff.pending(), fixture.pending);
    assert_eq!(
        finished_work_handoff.pending().root_finished_work(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(
        finished_work_handoff.pending().root_finished_lanes(),
        fixture.render.render_lanes()
    );
    assert!(finished_work_handoff.pending().records_finished_work());
    assert!(finished_work_handoff.pending().records_root_finished_work());
    assert_eq!(finished_work_handoff.commit_order(), commit_order);
    assert!(finished_work_handoff.commit_order_after_pending_record());
    assert_eq!(
        finished_work_handoff.current_after_commit(),
        fixture.render.finished_work()
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

    let commit = handoff.commit();
    assert_eq!(commit.root(), root_id);
    assert_eq!(commit.previous_current(), fixture.previous_current);
    assert_eq!(commit.current(), fixture.render.finished_work());
    assert_eq!(commit.finished_work(), fixture.render.finished_work());
    assert_eq!(commit.finished_lanes(), fixture.render.render_lanes());
    assert_eq!(commit.pending_lanes(), fixture.render.remaining_lanes());
    assert_eq!(commit.mutation_apply_log().len(), 1);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.render.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        None
    );
    assert_eq!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .render_exit_status(),
        RootRenderExitStatus::NoWork
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

fn assert_root_work_loop_managed_child_append_host_execution(
    store: &FiberRootStore<RecordingHost>,
    host: &RecordingHost,
    root_id: FiberRootId,
    fixture: &ManagedChildRootWorkLoopHostExecutionFixture,
    handoff: &HostRootManagedChildCommitHandoffRecordForCanary,
    diagnostic: &TestHostRootManagedChildExecutionDiagnosticForCanary,
) {
    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.finished_work(), fixture.render.finished_work());
    assert_eq!(handoff.complete_work(), fixture.complete_work);
    assert_eq!(fixture.previous_current, fixture.render.current());
    assert_eq!(
        handoff.execution_request().previous_current(),
        fixture.previous_current
    );
    assert_eq!(
        handoff.source_handoff_order(),
        fixture.pending.handoff_order()
    );
    assert_eq!(
        handoff.commit_order(),
        ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_COMMIT_ORDER
    );
    assert_eq!(
        handoff.request_order(),
        ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_REQUEST_ORDER
    );
    assert_eq!(
        handoff.kind(),
        HostComponentManagedChildMutationKindForCanary::Placement
    );
    assert!(handoff.private_test_host_mutation_allowed());
    assert!(handoff.public_root_rendering_blocked());
    assert!(handoff.public_renderer_mutation_blocked());
    assert!(!handoff.public_dom_compatibility_claimed());
    assert!(!handoff.test_renderer_compatibility_claimed());

    assert_eq!(diagnostic.root(), root_id);
    assert_eq!(diagnostic.finished_work(), fixture.render.finished_work());
    assert_eq!(
        diagnostic.source_handoff_order(),
        ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_SOURCE_ORDER
    );
    assert_eq!(
        diagnostic.commit_order(),
        ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_COMMIT_ORDER
    );
    assert_eq!(
        diagnostic.request_order(),
        ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_REQUEST_ORDER
    );
    assert_eq!(
        diagnostic.kind(),
        HostComponentManagedChildMutationKindForCanary::Placement
    );
    assert_eq!(diagnostic.mutation(), handoff.mutation());
    assert_eq!(
        diagnostic.mutation_status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::AppendChild)
    );
    assert_eq!(diagnostic.cleanup_status(), None);
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert_eq!(diagnostic.deletion_cleanup_apply_count(), 0);
    assert!(diagnostic.private_test_host_mutation_executed());
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(diagnostic.public_renderer_mutation_blocked());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert!(!diagnostic.hydration_events_refs_resources_forms_claimed());

    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.render.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        None
    );
    assert_eq!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .render_exit_status(),
        RootRenderExitStatus::NoWork
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(fixture.work_parent)
            .unwrap()
            .alternate(),
        Some(fixture.current_parent)
    );
    assert!(
        fixture
            .detached_hosts
            .instance_metadata(fixture.child_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(store.host_tokens().len(), fixture.token_count_before_apply);
    let mut expected_operations = fixture.operations_before_apply.clone();
    expected_operations.push("append_child");
    assert_eq!(host.operations(), expected_operations);
}

fn assert_root_work_loop_managed_child_sibling_order_host_execution(
    store: &FiberRootStore<RecordingHost>,
    host: &RecordingHost,
    root_id: FiberRootId,
    fixture: &ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture,
    handoff: &HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary,
    diagnostic: &TestHostRootManagedChildSiblingOrderExecutionDiagnosticForCanary,
    expected_status: TestHostRootMutationApplyStatus,
    expected_operation: &'static str,
    expected_cleanup_count: usize,
    expected_token_count_after_apply: usize,
) {
    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.finished_work(), fixture.render.finished_work());
    assert_eq!(handoff.complete_work(), fixture.complete_work);
    assert_eq!(fixture.previous_current, fixture.render.current());
    assert_eq!(
        handoff.execution_request().previous_current(),
        fixture.previous_current
    );
    assert_eq!(
        handoff.source_handoff_order(),
        fixture.pending.handoff_order()
    );
    assert_eq!(diagnostic.root(), root_id);
    assert_eq!(diagnostic.finished_work(), fixture.render.finished_work());
    assert_eq!(
        diagnostic.source_handoff_order(),
        fixture.pending.handoff_order()
    );
    assert_eq!(diagnostic.commit_order(), handoff.commit_order());
    assert_eq!(diagnostic.request_order(), handoff.request_order());
    assert_eq!(diagnostic.kind(), handoff.kind());
    assert_eq!(
        diagnostic.order_evidence_name(),
        handoff.order_evidence_name()
    );
    assert_eq!(diagnostic.order_sibling(), fixture.order_sibling);
    assert_eq!(
        diagnostic.order_sibling_state_node(),
        fixture.order_sibling_state_node
    );
    assert_eq!(diagnostic.mutation(), handoff.mutation());
    assert_eq!(
        diagnostic.mutation().parent_state_node(),
        fixture.parent_state_node
    );
    assert_eq!(diagnostic.mutation_status(), expected_status);
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert_eq!(
        diagnostic.deletion_cleanup_apply_count(),
        expected_cleanup_count
    );
    assert!(diagnostic.private_test_host_mutation_executed());
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(diagnostic.public_renderer_mutation_blocked());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert!(!diagnostic.hydration_events_refs_resources_forms_claimed());

    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.render.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        None
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(fixture.work_parent)
            .unwrap()
            .alternate(),
        Some(fixture.current_parent)
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(fixture.order_sibling)
            .unwrap()
            .alternate(),
        Some(fixture.order_sibling_current)
    );
    assert_eq!(store.host_tokens().len(), expected_token_count_after_apply);
    let mut expected_operations = fixture.operations_before_apply.clone();
    expected_operations.push(expected_operation);
    if expected_cleanup_count > 0 {
        expected_operations.push("detach_deleted_instance");
    }
    assert_eq!(host.operations(), expected_operations);
}

