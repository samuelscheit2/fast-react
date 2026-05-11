use super::*;

#[test]
fn root_work_loop_context_provider_handoff_pushes_child_read_and_unwinds() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, RootElementHandle::from_raw(118), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (provider, function_component, component) =
        attach_context_provider_wip_child(&mut store, render.work_in_progress());
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(900);
    let provided_value = context_value(901);
    let context = context_store.create_context(default_value);
    let output = FunctionComponentOutputHandle::from_raw(902);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));

    let record = handoff_host_root_context_provider_child_begin_work(
        &mut store,
        HostRootContextProviderBeginWorkHandoffRequest::new(
            root_id,
            render.work_in_progress(),
            Lanes::DEFAULT,
            context,
            provided_value,
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(record.provider(), provider);
    assert_eq!(record.function_component(), function_component);
    assert_eq!(record.begin_work().provider(), provider);
    assert_eq!(record.begin_work().child(), function_component);
    assert_eq!(record.begin_work().context(), context);
    assert_eq!(record.begin_work().value(), provided_value);
    assert_eq!(record.begin_work().child_output(), output);
    assert_eq!(record.begin_work().child_context_read_count(), 1);
    assert_eq!(record.begin_work().pushed_stack_depth(), 1);
    assert_eq!(record.begin_work().restored_stack_depth(), 0);
    assert_eq!(registry.calls().len(), 1);
    let context_state = registry.calls()[0].context_state().unwrap();
    assert_eq!(context_state.render_fiber(), function_component);
    assert_eq!(context_state.stack_depth(), 1);

    let reads = context_store.context_reads_for_record(record.begin_work().child_render());
    assert_eq!(reads.len(), 1);
    assert_eq!(reads[0].fiber(), function_component);
    assert_eq!(reads[0].context(), context);
    assert_eq!(reads[0].default_value(), default_value);
    assert_eq!(reads[0].value(), provided_value);
    assert_eq!(reads[0].active_provider_count(), 1);
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);

    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store.fiber_arena().get(provider).unwrap().return_fiber(),
        Some(render.work_in_progress())
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(function_component)
            .unwrap()
            .return_fiber(),
        Some(provider)
    );
}

#[test]
fn root_work_loop_context_provider_change_propagation_marks_consumer_and_root_lanes() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, RootElementHandle::from_raw(132), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let host_root_work_in_progress = render.work_in_progress();
    let (provider, function_component, component) =
        attach_context_provider_wip_child(&mut store, host_root_work_in_progress);
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(1_100);
    let previous_value = context_value(1_101);
    let next_value = context_value(1_102);
    let context = context_store.create_context(default_value);
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::ReadOnce { context });
    let propagation_lanes = Lanes::SYNC.merge_lane(Lane::TRANSITION_1);

    let record = propagate_host_root_context_provider_use_context_change_for_test(
        &mut store,
        render,
        HostRootContextProviderUseContextPropagationGateRequest::new(
            context,
            previous_value,
            next_value,
            propagation_lanes,
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        host_root_work_in_progress
    );
    assert_eq!(record.provider(), provider);
    assert_eq!(record.function_component(), function_component);
    assert_eq!(record.begin_work().provider(), provider);
    assert_eq!(record.begin_work().child(), function_component);
    assert_eq!(record.begin_work().context(), context);
    assert_eq!(record.begin_work().value(), previous_value);
    assert_eq!(record.begin_work().child_context_read_count(), 1);
    assert_eq!(record.begin_work().restored_stack_depth(), 0);

    let read = record.begin_work().child_context_read();
    assert_eq!(read.fiber(), function_component);
    assert_eq!(read.context(), context);
    assert_eq!(read.default_value(), default_value);
    assert_eq!(read.value(), previous_value);
    assert_eq!(registry.reads(), &[read]);
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);

    let propagation = record.propagation();
    assert_eq!(propagation.context(), context);
    assert_eq!(propagation.previous_value(), previous_value);
    assert_eq!(propagation.next_value(), next_value);
    assert_eq!(propagation.propagation_lanes(), propagation_lanes);
    assert_eq!(propagation.scanned_dependency_count(), 1);
    assert_eq!(propagation.marked_dependency_count(), 1);
    assert_eq!(propagation.roots(), &[root_id]);
    let marked = propagation.marked_dependencies()[0];
    assert_eq!(marked.dependency(), read.dependency());
    assert_eq!(marked.fiber(), function_component);
    assert_eq!(marked.memoized_value(), previous_value);
    assert_eq!(marked.previous_dependency_lanes(), Lanes::NO);
    assert_eq!(marked.dependency_lanes(), propagation_lanes);
    assert_eq!(
        context_store
            .context_dependency(read.dependency())
            .unwrap()
            .dependency_lanes(),
        propagation_lanes
    );

    assert!(
        store
            .fiber_arena()
            .get(function_component)
            .unwrap()
            .lanes()
            .contains_all(propagation_lanes)
    );
    assert!(
        store
            .fiber_arena()
            .get(provider)
            .unwrap()
            .child_lanes()
            .contains_all(propagation_lanes)
    );
    assert!(
        store
            .fiber_arena()
            .get(host_root_work_in_progress)
            .unwrap()
            .child_lanes()
            .contains_all(propagation_lanes)
    );
    assert!(
        store
            .root(root_id)
            .unwrap()
            .lanes()
            .pending_lanes()
            .contains_all(propagation_lanes)
    );
    let function_node = store.fiber_arena().get(function_component).unwrap();
    assert_eq!(function_node.dependencies(), DependenciesHandle::NONE);
    assert!(
        !function_node
            .flags()
            .contains_any(FiberFlags::NEEDS_PROPAGATION)
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
}

#[test]
fn root_work_loop_nested_context_provider_change_propagation_marks_two_consumers_and_unwinds() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, RootElementHandle::from_raw(137), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let host_root_work_in_progress = render.work_in_progress();
    let (
        outer_provider,
        inner_provider,
        first_function_component,
        first_component,
        second_function_component,
        second_component,
    ) = attach_nested_context_provider_two_consumer_wip_children(
        &mut store,
        host_root_work_in_progress,
    );
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(1_120);
    let outer_value = context_value(1_121);
    let previous_inner_value = context_value(1_122);
    let next_inner_value = context_value(1_123);
    let context = context_store.create_context(default_value);
    let mut registry = TestUseContextComponentRegistry::new(
        first_component,
        UseContextBehavior::ReadOnce { context },
    );
    registry.register(second_component, UseContextBehavior::ReadOnce { context });
    let propagation_lanes = Lanes::SYNC
        .merge_lane(Lane::TRANSITION_1)
        .merge_lane(Lane::RETRY_1);

    let record =
        propagate_host_root_nested_context_provider_two_consumer_use_context_change_for_test(
            &mut store,
            render,
            HostRootNestedContextProviderTwoConsumerPropagationGateRequest::new(
                root_id,
                host_root_work_in_progress,
                Lanes::DEFAULT,
                context,
                outer_value,
                context,
                previous_inner_value,
                next_inner_value,
                propagation_lanes,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        host_root_work_in_progress
    );
    assert_eq!(record.outer_provider(), outer_provider);
    assert_eq!(record.inner_provider(), inner_provider);
    assert_eq!(record.first_function_component(), first_function_component);
    assert_eq!(
        record.second_function_component(),
        second_function_component
    );

    let begin_work = record.begin_work();
    assert_eq!(begin_work.outer_provider(), outer_provider);
    assert_eq!(begin_work.inner_provider(), inner_provider);
    assert_eq!(begin_work.first_child(), first_function_component);
    assert_eq!(begin_work.second_child(), second_function_component);
    assert_eq!(begin_work.outer_context(), context);
    assert_eq!(begin_work.inner_context(), context);
    assert_eq!(begin_work.outer_value(), outer_value);
    assert_eq!(begin_work.inner_value(), previous_inner_value);
    assert_eq!(begin_work.outer_pushed_stack_depth(), 1);
    assert_eq!(begin_work.inner_pushed_stack_depth(), 2);
    assert_eq!(begin_work.inner_restored_stack_depth(), 1);
    assert_eq!(begin_work.outer_restored_stack_depth(), 0);
    assert_eq!(begin_work.first_child_context_read_count(), 1);
    assert_eq!(begin_work.second_child_context_read_count(), 1);

    assert_eq!(registry.calls().len(), 2);
    assert_eq!(registry.calls()[0].fiber(), first_function_component);
    assert_eq!(registry.calls()[1].fiber(), second_function_component);
    assert_eq!(
        registry.calls()[0].context_state().unwrap().stack_depth(),
        2
    );
    assert_eq!(
        registry.calls()[1].context_state().unwrap().stack_depth(),
        2
    );

    let first_read = begin_work.first_child_context_read();
    let second_read = begin_work.second_child_context_read();
    assert_eq!(registry.reads(), &[first_read, second_read]);
    for (read, consumer) in [
        (first_read, first_function_component),
        (second_read, second_function_component),
    ] {
        assert_eq!(read.fiber(), consumer);
        assert_eq!(read.context(), context);
        assert_eq!(read.default_value(), default_value);
        assert_eq!(read.value(), previous_inner_value);
        assert_eq!(read.active_provider_count(), 2);
    }
    assert_eq!(
        context_store.context_reads_for_record(begin_work.first_child_render()),
        &[first_read]
    );
    assert_eq!(
        context_store.context_reads_for_record(begin_work.second_child_render()),
        &[second_read]
    );
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);

    let first_propagation = record.first_propagation();
    assert_eq!(first_propagation.context(), context);
    assert_eq!(first_propagation.previous_value(), previous_inner_value);
    assert_eq!(first_propagation.next_value(), next_inner_value);
    assert_eq!(first_propagation.propagation_lanes(), propagation_lanes);
    assert_eq!(first_propagation.scanned_dependency_count(), 1);
    assert_eq!(first_propagation.marked_dependency_count(), 1);
    assert_eq!(first_propagation.roots(), &[root_id]);
    let first_marked = first_propagation.marked_dependencies()[0];
    assert_eq!(first_marked.dependency(), first_read.dependency());
    assert_eq!(first_marked.fiber(), first_function_component);
    assert_eq!(first_marked.memoized_value(), previous_inner_value);
    assert_eq!(first_marked.previous_dependency_lanes(), Lanes::NO);
    assert_eq!(first_marked.dependency_lanes(), propagation_lanes);

    let second_propagation = record.second_propagation();
    assert_eq!(second_propagation.context(), context);
    assert_eq!(second_propagation.previous_value(), previous_inner_value);
    assert_eq!(second_propagation.next_value(), next_inner_value);
    assert_eq!(second_propagation.propagation_lanes(), propagation_lanes);
    assert_eq!(second_propagation.scanned_dependency_count(), 1);
    assert_eq!(second_propagation.marked_dependency_count(), 1);
    assert_eq!(second_propagation.roots(), &[root_id]);
    let second_marked = second_propagation.marked_dependencies()[0];
    assert_eq!(second_marked.dependency(), second_read.dependency());
    assert_eq!(second_marked.fiber(), second_function_component);
    assert_eq!(second_marked.memoized_value(), previous_inner_value);
    assert_eq!(second_marked.previous_dependency_lanes(), Lanes::NO);
    assert_eq!(second_marked.dependency_lanes(), propagation_lanes);

    for read in [first_read, second_read] {
        assert_eq!(
            context_store
                .context_dependency(read.dependency())
                .unwrap()
                .dependency_lanes(),
            propagation_lanes
        );
    }

    for consumer in [first_function_component, second_function_component] {
        let consumer_node = store.fiber_arena().get(consumer).unwrap();
        assert!(consumer_node.lanes().contains_all(propagation_lanes));
        assert_eq!(consumer_node.dependencies(), DependenciesHandle::NONE);
        assert!(
            !consumer_node
                .flags()
                .contains_any(FiberFlags::NEEDS_PROPAGATION)
        );
    }
    assert!(
        store
            .fiber_arena()
            .get(inner_provider)
            .unwrap()
            .child_lanes()
            .contains_all(propagation_lanes)
    );
    assert!(
        store
            .fiber_arena()
            .get(outer_provider)
            .unwrap()
            .child_lanes()
            .contains_all(propagation_lanes)
    );
    assert!(
        store
            .fiber_arena()
            .get(host_root_work_in_progress)
            .unwrap()
            .child_lanes()
            .contains_all(propagation_lanes)
    );
    assert!(
        store
            .root(root_id)
            .unwrap()
            .lanes()
            .pending_lanes()
            .contains_all(propagation_lanes)
    );

    assert_eq!(
        store
            .fiber_arena()
            .get(host_root_work_in_progress)
            .unwrap()
            .child(),
        Some(outer_provider)
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(outer_provider)
            .unwrap()
            .return_fiber(),
        Some(host_root_work_in_progress)
    );
    assert_eq!(
        store.fiber_arena().get(outer_provider).unwrap().child(),
        Some(inner_provider)
    );
    assert_eq!(
        store.fiber_arena().get(inner_provider).unwrap().child(),
        Some(first_function_component)
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(first_function_component)
            .unwrap()
            .sibling(),
        Some(second_function_component)
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(second_function_component)
            .unwrap()
            .sibling(),
        None
    );
    store.fiber_arena().validate_topology().unwrap();
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
}

#[test]
fn root_work_loop_nested_context_update_commit_handoff_proves_lanes_survive() {
    let (mut store, root_id, host) = root_store();
    let original_root_element = RootElementHandle::from_raw(1_127);
    let skipped_sync_element = RootElementHandle::from_raw(1_128);
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, original_root_element, None).unwrap();
    update_container_sync(&mut store, root_id, skipped_sync_element, None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    assert_eq!(render.resulting_element(), original_root_element);
    assert_eq!(render.remaining_lanes(), Lanes::SYNC);
    let host_root_work_in_progress = render.work_in_progress();
    let (
        outer_provider,
        inner_provider,
        first_function_component,
        first_component,
        second_function_component,
        second_component,
    ) = attach_nested_context_provider_two_consumer_wip_children(
        &mut store,
        host_root_work_in_progress,
    );
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(1_129);
    let outer_value = context_value(1_130);
    let previous_inner_value = context_value(1_131);
    let next_inner_value = context_value(1_132);
    let context = context_store.create_context(default_value);
    let mut registry = TestUseContextComponentRegistry::new(
        first_component,
        UseContextBehavior::ReadOnce { context },
    );
    registry.register(second_component, UseContextBehavior::ReadOnce { context });

    let record = handoff_nested_context_provider_two_consumer_update_to_test_render_commit(
        &mut store,
        render,
        HostRootNestedContextProviderTwoConsumerPropagationGateRequest::new(
            root_id,
            host_root_work_in_progress,
            Lanes::DEFAULT,
            context,
            outer_value,
            context,
            previous_inner_value,
            next_inner_value,
            Lanes::SYNC,
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        host_root_work_in_progress
    );
    assert_eq!(record.original_root_element(), original_root_element);
    assert_eq!(record.outer_provider(), outer_provider);
    assert_eq!(record.inner_provider(), inner_provider);
    assert_eq!(record.first_function_component(), first_function_component);
    assert_eq!(
        record.second_function_component(),
        second_function_component
    );

    let begin_work = record.begin_work();
    assert_eq!(begin_work.outer_provider(), outer_provider);
    assert_eq!(begin_work.inner_provider(), inner_provider);
    assert_eq!(begin_work.outer_value(), outer_value);
    assert_eq!(begin_work.inner_value(), previous_inner_value);
    assert_eq!(begin_work.render_lanes(), Lanes::DEFAULT);
    assert_eq!(begin_work.first_child(), first_function_component);
    assert_eq!(begin_work.second_child(), second_function_component);
    assert_eq!(begin_work.first_child_context_read_count(), 1);
    assert_eq!(begin_work.second_child_context_read_count(), 1);
    assert_eq!(registry.reads().len(), 2);
    assert_eq!(registry.reads()[0], begin_work.first_child_context_read());
    assert_eq!(registry.reads()[1], begin_work.second_child_context_read());

    let provider_update = record.provider_update();
    assert_eq!(provider_update.root(), root_id);
    assert_eq!(
        provider_update.host_root_work_in_progress(),
        host_root_work_in_progress
    );
    assert_eq!(provider_update.outer_provider(), outer_provider);
    assert_eq!(provider_update.inner_provider(), inner_provider);
    assert_eq!(provider_update.context(), context);
    assert_eq!(provider_update.previous_value(), previous_inner_value);
    assert_eq!(provider_update.next_value(), next_inner_value);
    assert_eq!(provider_update.render_lanes(), Lanes::DEFAULT);
    assert_eq!(provider_update.propagation_lanes(), Lanes::SYNC);
    assert!(provider_update.provider_changed());
    assert_eq!(provider_update.marked_dependency_count(), 2);
    assert_eq!(provider_update.dependent_consumer_count(), 2);
    assert!(provider_update.all_marked_consumers_include_propagation_lanes());
    assert!(provider_update.public_context_compatibility_blocked());

    let consumers = provider_update.dependent_consumers();
    for (consumer_record, consumer, read) in [
        (
            consumers[0],
            first_function_component,
            begin_work.first_child_context_read(),
        ),
        (
            consumers[1],
            second_function_component,
            begin_work.second_child_context_read(),
        ),
    ] {
        assert_eq!(consumer_record.consumer(), consumer);
        assert_eq!(consumer_record.dependency(), read.dependency());
        assert_eq!(consumer_record.context(), context);
        assert_eq!(consumer_record.memoized_value(), previous_inner_value);
        assert_eq!(consumer_record.previous_value(), previous_inner_value);
        assert_eq!(consumer_record.next_value(), next_inner_value);
        assert_eq!(consumer_record.render_lanes(), Lanes::DEFAULT);
        assert_eq!(consumer_record.propagation_lanes(), Lanes::SYNC);
        assert_eq!(consumer_record.dependency_lanes(), Lanes::SYNC);
        assert!(consumer_record.marked_changed_provider_lanes());
    }

    let finished_work_handoff = record.finished_work_handoff();
    assert_eq!(finished_work_handoff.commit_order(), 2);
    assert!(finished_work_handoff.proves_private_finished_work_commit_execution());
    assert_eq!(
        finished_work_handoff
            .pending()
            .pending_lanes_before_commit(),
        Lanes::DEFAULT.merge_lane(Lane::SYNC)
    );
    assert_eq!(
        finished_work_handoff.pending().finished_lanes(),
        Lanes::DEFAULT
    );
    assert_eq!(
        finished_work_handoff.pending().remaining_lanes(),
        Lanes::SYNC
    );

    let context_commit = record.context_update_commit_handoff();
    assert_eq!(context_commit.request_order(), 3);
    assert_eq!(context_commit.provider_update(), provider_update);
    assert_eq!(
        context_commit.finished_work_handoff().pending(),
        finished_work_handoff.pending()
    );
    assert!(context_commit.marked_consumer_lanes_survived_to_commit());
    assert!(context_commit.ancestor_child_lanes_survived_to_commit());
    assert!(context_commit.root_pending_lanes_survived_to_commit());
    assert!(context_commit.proves_marked_consumer_lanes_survive_to_commit());
    assert!(
        context_commit
            .host_root_child_lanes_after_commit()
            .contains_all(Lanes::SYNC)
    );
    assert!(
        context_commit
            .outer_provider_child_lanes_after_commit()
            .contains_all(Lanes::SYNC)
    );
    assert!(
        context_commit
            .inner_provider_child_lanes_after_commit()
            .contains_all(Lanes::SYNC)
    );
    assert!(
        context_commit
            .root_pending_lanes_after_commit()
            .contains_all(Lanes::SYNC)
    );

    for (committed, consumer) in context_commit.committed_consumers().iter().zip([
        (
            ContextProviderUpdateConsumerOrder::First,
            first_function_component,
        ),
        (
            ContextProviderUpdateConsumerOrder::Second,
            second_function_component,
        ),
    ]) {
        let (order, consumer) = consumer;
        assert_eq!(committed.order(), order);
        assert_eq!(committed.consumer(), consumer);
        assert_eq!(committed.dependency_lanes(), Lanes::SYNC);
        assert_eq!(committed.propagation_lanes(), Lanes::SYNC);
        assert!(
            committed
                .fiber_lanes_after_render()
                .contains_all(Lanes::SYNC)
        );
        assert!(
            committed
                .fiber_lanes_after_commit()
                .contains_all(Lanes::SYNC)
        );
        assert!(committed.lanes_survived());
    }

    let commit = record.commit();
    assert_eq!(commit.root(), root_id);
    assert_eq!(commit.previous_current(), current);
    assert_eq!(commit.current(), host_root_work_in_progress);
    assert_eq!(commit.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(commit.remaining_lanes(), Lanes::SYNC);
    assert_eq!(commit.pending_lanes(), Lanes::SYNC);
    assert!(commit.has_remaining_work());
    assert!(commit.mutation_log().is_empty());
    assert!(commit.mutation_apply_log().is_empty());

    let committed_root = store.root(root_id).unwrap();
    assert_eq!(committed_root.current(), host_root_work_in_progress);
    assert_eq!(committed_root.finished_work(), None);
    assert_eq!(committed_root.finished_lanes(), Lanes::NO);
    assert_eq!(committed_root.lanes().pending_lanes(), Lanes::SYNC);
    for consumer in [first_function_component, second_function_component] {
        let node = store.fiber_arena().get(consumer).unwrap();
        assert!(node.lanes().contains_all(Lanes::SYNC));
        assert_eq!(node.dependencies(), DependenciesHandle::NONE);
        assert!(!node.flags().contains_any(FiberFlags::NEEDS_PROPAGATION));
    }
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
    store.fiber_arena().validate_topology().unwrap();
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_work_loop_context_changed_bailout_gate_skips_unchanged_provider_propagation() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, RootElementHandle::from_raw(138), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let host_root_work_in_progress = render.work_in_progress();
    let (
        outer_provider,
        inner_provider,
        first_function_component,
        first_component,
        second_function_component,
        second_component,
    ) = attach_nested_context_provider_two_consumer_wip_children(
        &mut store,
        host_root_work_in_progress,
    );
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(1_124);
    let outer_value = context_value(1_125);
    let previous_inner_value = context_value(1_126);
    let context = context_store.create_context(default_value);
    let mut registry = TestUseContextComponentRegistry::new(
        first_component,
        UseContextBehavior::ReadOnce { context },
    );
    registry.register(second_component, UseContextBehavior::ReadOnce { context });
    let begin_work = begin_work_nested_context_provider_two_consumer_use_context_children(
        store.fiber_arena_mut(),
        NestedContextProviderBeginWorkRequest::new(
            outer_provider,
            Lanes::DEFAULT,
            context,
            outer_value,
            context,
            previous_inner_value,
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap();
    let propagation_lanes = Lanes::SYNC
        .merge_lane(Lane::TRANSITION_2)
        .merge_lane(Lane::RETRY_2);

    let record = record_context_provider_update_two_consumer_lane_gate(
        &mut store,
        &mut context_store,
        begin_work,
        ContextProviderUpdateTwoConsumerLaneRequest::new(
            root_id,
            host_root_work_in_progress,
            begin_work.outer_provider_token(),
            begin_work.inner_provider_token(),
            context,
            previous_inner_value,
            previous_inner_value,
            propagation_lanes,
            ContextProviderUpdateDependencyPath::from_begin_work(begin_work),
        ),
    )
    .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        host_root_work_in_progress
    );
    assert_eq!(record.outer_provider(), outer_provider);
    assert_eq!(record.inner_provider(), inner_provider);
    assert!(record.unchanged_provider_bailout());
    assert_eq!(record.marked_dependency_count(), 0);
    assert!(record.public_context_compatibility_blocked());

    let consumers = record.dependent_consumers();
    for (consumer, dependency) in [
        (consumers[0], begin_work.first_child_context_dependency()),
        (consumers[1], begin_work.second_child_context_dependency()),
    ] {
        assert_eq!(consumer.dependency(), dependency);
        assert_eq!(consumer.context(), context);
        assert_eq!(consumer.memoized_value(), previous_inner_value);
        assert_eq!(consumer.previous_value(), previous_inner_value);
        assert_eq!(consumer.next_value(), previous_inner_value);
        assert_eq!(consumer.propagation_lanes(), propagation_lanes);
        assert_eq!(consumer.previous_dependency_lanes(), Lanes::NO);
        assert_eq!(consumer.dependency_lanes(), Lanes::NO);
        assert_eq!(consumer.marked_dependency_count(), 0);
        assert!(consumer.unchanged_provider_bailout());
        assert_eq!(consumer.scanned_dependency_count(), 1);
        assert_eq!(
            context_store
                .context_dependency(dependency)
                .unwrap()
                .dependency_lanes(),
            Lanes::NO
        );
    }

    for consumer in [first_function_component, second_function_component] {
        let node = store.fiber_arena().get(consumer).unwrap();
        assert_eq!(node.lanes(), Lanes::NO);
        assert_eq!(node.dependencies(), DependenciesHandle::NONE);
        assert!(!node.flags().contains_any(FiberFlags::NEEDS_PROPAGATION));
    }
    for fiber in [inner_provider, outer_provider, host_root_work_in_progress] {
        assert_eq!(
            store.fiber_arena().get(fiber).unwrap().child_lanes(),
            Lanes::NO
        );
    }
    assert!(
        !store
            .root(root_id)
            .unwrap()
            .lanes()
            .pending_lanes()
            .contains_any(propagation_lanes)
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
}

#[test]
fn root_work_loop_context_provider_use_context_hands_consumer_output_to_complete_work() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let child_element = source.insert_host_element_with_text("article", "provided child");
    let original_root_element = RootElementHandle::from_raw(133);
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, original_root_element, None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (provider, function_component, component) =
        attach_context_provider_wip_child(&mut store, render.work_in_progress());
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(1_000);
    let provided_value = context_value(child_element.raw());
    let context = context_store.create_context(default_value);
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::ReadOnce { context });

    let record = handoff_completed_context_provider_use_context_child_to_test_complete_work(
        &mut store,
        &mut host,
        render,
        &source,
        HostRootContextProviderUseContextCompleteWorkHandoffRequest::new(context, provided_value),
        &mut context_store,
        &mut registry,
    )
    .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(record.original_root_element(), original_root_element);
    assert_eq!(record.provider(), provider);
    assert_eq!(record.function_component(), function_component);
    assert_eq!(record.child_element(), child_element);
    assert_eq!(record.child_tag(), FiberTag::HostComponent);

    let begin_work = record.begin_work();
    assert_eq!(begin_work.provider(), provider);
    assert_eq!(begin_work.child(), function_component);
    assert_eq!(begin_work.context(), context);
    assert_eq!(begin_work.value(), provided_value);
    assert_eq!(
        begin_work.child_output(),
        FunctionComponentOutputHandle::from_raw(child_element.raw())
    );
    assert_eq!(begin_work.child_context_read_count(), 1);
    assert_eq!(
        begin_work.single_child().function_component(),
        function_component
    );
    assert_eq!(begin_work.single_child().child_element(), child_element);
    assert_eq!(
        begin_work.single_child().child_tag(),
        FiberTag::HostComponent
    );
    assert_eq!(begin_work.pushed_stack_depth(), 1);
    assert_eq!(begin_work.restored_stack_depth(), 0);

    let read = begin_work.child_context_read();
    assert_eq!(read.fiber(), function_component);
    assert_eq!(read.context(), context);
    assert_eq!(read.default_value(), default_value);
    assert_eq!(read.value(), provided_value);
    assert_eq!(read.active_provider_count(), 1);
    assert_eq!(registry.reads(), &[read]);
    assert_eq!(
        context_store.context_reads_for_record(begin_work.child_render()),
        &[read]
    );
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);

    let complete_work = record.complete_work();
    assert_eq!(complete_work.root(), root_id);
    assert_eq!(
        complete_work.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(complete_work.root_child(), Some(provider));
    assert_eq!(
        complete_work.root_child_tag(),
        Some(FiberTag::ContextProvider)
    );
    assert_eq!(complete_work.root_child_count(), 1);
    assert_eq!(
        complete_work.completed_child_tag(),
        Some(FiberTag::HostComponent)
    );
    assert_eq!(complete_work.completed_child_count(), 1);
    assert_eq!(complete_work.resulting_element(), child_element);
    assert_eq!(complete_work.detached_instance_count(), 1);
    assert_eq!(complete_work.detached_text_count(), 1);

    let host_child = complete_work.completed_child().unwrap();
    assert_eq!(
        store
            .fiber_arena()
            .get(render.work_in_progress())
            .unwrap()
            .child(),
        Some(provider)
    );
    assert_eq!(
        store.fiber_arena().get(provider).unwrap().return_fiber(),
        Some(render.work_in_progress())
    );
    assert_eq!(
        store.fiber_arena().get(provider).unwrap().child(),
        Some(function_component)
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(function_component)
            .unwrap()
            .return_fiber(),
        Some(provider)
    );
    assert_eq!(
        store.fiber_arena().get(function_component).unwrap().child(),
        Some(host_child)
    );
    assert_eq!(
        store.fiber_arena().get(host_child).unwrap().return_fiber(),
        Some(function_component)
    );
    assert!(
        store
            .fiber_arena()
            .get(function_component)
            .unwrap()
            .flags()
            .contains_all(FiberFlags::PERFORMED_WORK)
    );
    assert!(
        store
            .fiber_arena()
            .get(provider)
            .unwrap()
            .subtree_flags()
            .contains_all(FiberFlags::PLACEMENT)
    );
    store.fiber_arena().validate_topology().unwrap();
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
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
fn root_work_loop_context_provider_complete_unwind_restores_after_descendant_complete() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let child_element = source.insert_host_element_with_text("main", "provider traversal");
    let original_root_element = RootElementHandle::from_raw(135);
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, original_root_element, None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (provider, function_component, component) =
        attach_context_provider_wip_child(&mut store, render.work_in_progress());
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(1_020);
    let provided_value = context_value(child_element.raw());
    let context = context_store.create_context(default_value);
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::ReadOnce { context });

    let record =
        handoff_completed_context_provider_use_context_child_to_test_complete_work_with_provider_unwind(
            &mut store,
            &mut host,
            render,
            &source,
            HostRootContextProviderUseContextCompleteWorkHandoffRequest::new(
                context,
                provided_value,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(record.original_root_element(), original_root_element);
    assert_eq!(record.provider(), provider);
    assert_eq!(record.function_component(), function_component);
    assert_eq!(record.child_element(), child_element);
    assert_eq!(record.child_tag(), FiberTag::HostComponent);
    assert_eq!(record.stack_depth_after_begin(), 1);
    assert_eq!(record.stack_depth_after_host_child_complete(), 1);

    let begin_work = record.begin_work();
    assert_eq!(begin_work.provider(), provider);
    assert_eq!(begin_work.child(), function_component);
    assert_eq!(begin_work.context(), context);
    assert_eq!(begin_work.value(), provided_value);
    assert_eq!(begin_work.pushed_stack_depth(), 1);
    assert_eq!(begin_work.child_context_read_count(), 1);
    assert_eq!(
        begin_work.child_output(),
        FunctionComponentOutputHandle::from_raw(child_element.raw())
    );

    let read = begin_work.child_context_read();
    assert_eq!(read.fiber(), function_component);
    assert_eq!(read.context(), context);
    assert_eq!(read.default_value(), default_value);
    assert_eq!(read.value(), provided_value);
    assert_eq!(read.active_provider_count(), 1);
    assert_eq!(registry.reads(), &[read]);

    let provider_complete = record.provider_complete();
    assert_eq!(provider_complete.provider(), provider);
    assert_eq!(provider_complete.context(), context);
    assert_eq!(provider_complete.value(), provided_value);
    assert_eq!(
        provider_complete.provider_snapshot(),
        begin_work.provider_snapshot()
    );
    assert_eq!(
        provider_complete.phase(),
        ContextProviderStackRestorationPhase::Complete
    );
    assert_eq!(provider_complete.stack_depth_before_restore(), 1);
    assert_eq!(provider_complete.restored_stack_depth(), 0);
    assert!(
        provider_complete
            .subtree_flags()
            .contains_all(FiberFlags::PLACEMENT)
    );

    let complete_work = record.complete_work();
    assert_eq!(complete_work.root_child(), Some(provider));
    assert_eq!(
        complete_work.root_child_tag(),
        Some(FiberTag::ContextProvider)
    );
    assert_eq!(complete_work.completed_child_count(), 1);
    assert_eq!(
        complete_work.completed_child_tag(),
        Some(FiberTag::HostComponent)
    );
    assert_eq!(complete_work.resulting_element(), child_element);
    assert_eq!(complete_work.detached_instance_count(), 1);
    assert_eq!(complete_work.detached_text_count(), 1);

    let host_child = complete_work.completed_child().unwrap();
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
    assert_eq!(
        store
            .fiber_arena()
            .get(render.work_in_progress())
            .unwrap()
            .child(),
        Some(provider)
    );
    assert_eq!(
        store.fiber_arena().get(provider).unwrap().return_fiber(),
        Some(render.work_in_progress())
    );
    assert_eq!(
        store.fiber_arena().get(provider).unwrap().child(),
        Some(function_component)
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(function_component)
            .unwrap()
            .return_fiber(),
        Some(provider)
    );
    assert_eq!(
        store.fiber_arena().get(function_component).unwrap().child(),
        Some(host_child)
    );
    store.fiber_arena().validate_topology().unwrap();
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
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
fn root_work_loop_context_provider_update_lanes_survive_private_render_commit_traversal() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let child_element = source.insert_host_element_with_text("main", "updated provider");
    let original_root_element = RootElementHandle::from_raw(1_039);
    let skipped_sync_element = RootElementHandle::from_raw(1_040);
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, original_root_element, None).unwrap();
    update_container_sync(&mut store, root_id, skipped_sync_element, None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    assert_eq!(render.resulting_element(), original_root_element);
    assert_eq!(render.applied_update_count(), 1);
    assert_eq!(render.skipped_update_count(), 1);
    assert_eq!(render.remaining_lanes(), Lanes::SYNC);

    let (provider, function_component, component) =
        attach_context_provider_wip_child(&mut store, render.work_in_progress());
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(1_041);
    let previous_value = context_value(child_element.raw());
    let next_value = context_value(child_element.raw() + 1);
    let context = context_store.create_context(default_value);
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::ReadOnce { context });

    let record = handoff_context_provider_update_to_test_render_commit_traversal(
        &mut store,
        &mut host,
        render,
        &source,
        HostRootContextProviderUseContextPropagationGateRequest::new(
            context,
            previous_value,
            next_value,
            Lanes::SYNC,
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(
        record.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(record.original_root_element(), original_root_element);
    assert_eq!(record.provider(), provider);
    assert_eq!(record.function_component(), function_component);
    assert_eq!(record.child_element(), child_element);
    assert_eq!(record.child_tag(), FiberTag::HostComponent);
    assert!(record.public_context_compatibility_blocked());
    assert_eq!(record.stack_depth_after_begin(), 1);
    assert_eq!(record.stack_depth_after_provider_update(), 1);
    assert_eq!(record.stack_depth_after_host_child_complete(), 1);

    let begin_work = record.begin_work();
    assert_eq!(begin_work.provider(), provider);
    assert_eq!(begin_work.child(), function_component);
    assert_eq!(begin_work.context(), context);
    assert_eq!(begin_work.value(), previous_value);
    assert!(begin_work.provider_token().is_some());
    assert_eq!(begin_work.pushed_stack_depth(), 1);
    assert_eq!(begin_work.child_context_read_count(), 1);
    assert_eq!(
        begin_work.child_output(),
        FunctionComponentOutputHandle::from_raw(child_element.raw())
    );
    let read = begin_work.child_context_read();
    assert_eq!(read.fiber(), function_component);
    assert_eq!(read.context(), context);
    assert_eq!(read.default_value(), default_value);
    assert_eq!(read.value(), previous_value);
    assert_eq!(read.active_provider_count(), 1);
    assert_eq!(registry.reads(), &[read]);

    let provider_update = record.provider_update();
    assert_eq!(provider_update.root(), root_id);
    assert_eq!(
        provider_update.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(provider_update.provider(), provider);
    assert_eq!(provider_update.consumer(), function_component);
    assert_eq!(provider_update.context(), context);
    assert_eq!(provider_update.previous_value(), previous_value);
    assert_eq!(provider_update.next_value(), next_value);
    assert_eq!(provider_update.propagation_lanes(), Lanes::SYNC);
    assert!(provider_update.provider_changed());
    assert_eq!(provider_update.marked_dependency_count(), 1);
    assert!(provider_update.public_context_compatibility_blocked());
    let provider_stack = provider_update.provider_stack_push();
    assert_eq!(provider_stack.provider(), provider);
    assert_eq!(
        provider_stack.provider_snapshot(),
        begin_work.provider_snapshot()
    );
    assert_eq!(provider_stack.provider_token(), begin_work.provider_token());
    assert_eq!(provider_stack.pushed_stack_depth(), 1);

    let consumer = provider_update.dependent_consumer();
    assert_eq!(consumer.consumer(), function_component);
    assert_eq!(consumer.dependency(), read.dependency());
    assert_eq!(consumer.context(), context);
    assert_eq!(consumer.memoized_value(), previous_value);
    assert_eq!(consumer.previous_value(), previous_value);
    assert_eq!(consumer.next_value(), next_value);
    assert_eq!(consumer.render_lanes(), Lanes::DEFAULT);
    assert_eq!(consumer.propagation_lanes(), Lanes::SYNC);
    assert_eq!(consumer.previous_dependency_lanes(), Lanes::NO);
    assert_eq!(consumer.dependency_lanes(), Lanes::SYNC);
    assert_eq!(consumer.marked_dependency_count(), 1);
    assert!(consumer.marked_changed_provider_lanes());
    assert_eq!(consumer.scanned_dependency_count(), 1);
    assert_eq!(consumer.root(), root_id);
    assert_eq!(
        context_store
            .context_dependency(read.dependency())
            .unwrap()
            .dependency_lanes(),
        Lanes::SYNC
    );

    let provider_complete = record.provider_complete();
    assert_eq!(provider_complete.provider(), provider);
    assert_eq!(provider_complete.context(), context);
    assert_eq!(provider_complete.value(), previous_value);
    assert_eq!(
        provider_complete.phase(),
        ContextProviderStackRestorationPhase::Complete
    );
    assert_eq!(provider_complete.stack_depth_before_restore(), 1);
    assert_eq!(provider_complete.restored_stack_depth(), 0);
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);

    let complete_work = record.complete_work();
    assert_eq!(complete_work.root_child(), Some(provider));
    assert_eq!(
        complete_work.root_child_tag(),
        Some(FiberTag::ContextProvider)
    );
    assert_eq!(complete_work.completed_child_count(), 1);
    assert_eq!(
        complete_work.completed_child_tag(),
        Some(FiberTag::HostComponent)
    );
    assert_eq!(complete_work.resulting_element(), child_element);

    let finished_work_handoff = record.finished_work_handoff();
    let pending_finished_work = finished_work_handoff.pending();
    let expected_pending_before_commit = Lanes::DEFAULT.merge_lane(Lane::SYNC);
    assert_eq!(
        pending_finished_work.pending_lanes_before_commit(),
        expected_pending_before_commit
    );
    assert_eq!(pending_finished_work.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(pending_finished_work.remaining_lanes(), Lanes::SYNC);
    assert!(finished_work_handoff.consumed_finished_work_record());
    assert!(finished_work_handoff.mutation_execution_blocked());
    assert!(finished_work_handoff.public_root_rendering_blocked());
    assert!(finished_work_handoff.effects_refs_and_hydration_blocked());

    let commit = record.commit();
    assert_eq!(commit.root(), root_id);
    assert_eq!(commit.previous_current(), current);
    assert_eq!(commit.current(), render.work_in_progress());
    assert_eq!(commit.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(commit.remaining_lanes(), Lanes::SYNC);
    assert_eq!(commit.pending_lanes(), Lanes::SYNC);
    assert!(commit.has_remaining_work());
    assert!(commit.mutation_log().is_empty());
    assert!(commit.mutation_apply_log().is_empty());
    assert!(record.placement_apply_diagnostics().is_empty());
    assert!(record.host_operations_unchanged_by_commit());

    let committed_root = store.root(root_id).unwrap();
    assert_eq!(committed_root.current(), render.work_in_progress());
    assert_eq!(committed_root.finished_work(), None);
    assert_eq!(committed_root.finished_lanes(), Lanes::NO);
    assert_eq!(committed_root.lanes().pending_lanes(), Lanes::SYNC);
    assert!(
        store
            .fiber_arena()
            .get(function_component)
            .unwrap()
            .lanes()
            .contains_all(Lanes::SYNC)
    );
    assert!(
        store
            .fiber_arena()
            .get(provider)
            .unwrap()
            .child_lanes()
            .contains_all(Lanes::SYNC)
    );
    assert!(
        store
            .fiber_arena()
            .get(render.work_in_progress())
            .unwrap()
            .child_lanes()
            .contains_all(Lanes::SYNC)
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(function_component)
            .unwrap()
            .dependencies(),
        DependenciesHandle::NONE
    );
    assert!(
        !store
            .fiber_arena()
            .get(function_component)
            .unwrap()
            .flags()
            .contains_any(FiberFlags::NEEDS_PROPAGATION)
    );
    store.fiber_arena().validate_topology().unwrap();
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
fn root_work_loop_context_provider_complete_unwind_restores_after_descendant_complete_error() {
    let (mut store, root_id, mut host) = root_store();
    let source = TestHostTree::new();
    let missing_child_element = RootElementHandle::from_raw(1_036);
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, RootElementHandle::from_raw(136), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (provider, function_component, component) =
        attach_context_provider_wip_child(&mut store, render.work_in_progress());
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(1_030);
    let provided_value = context_value(1_031);
    let context = context_store.create_context(default_value);
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::ReadOnce { context });
    let output = FunctionComponentOutputHandle::from_raw(provided_value.raw());
    let resolver =
        StaticSingleChildOutputResolver::new(FunctionComponentSingleChildOutput::host_component(
            output,
            missing_child_element,
            ElementTypeHandle::from_raw(1_037),
            PropsHandle::from_raw(1_038),
        ));

    let begin_work = begin_work_context_provider_use_context_single_child_for_complete_traversal(
        store.fiber_arena_mut(),
        ContextProviderBeginWorkRequest::new(provider, Lanes::DEFAULT, context, provided_value),
        &mut context_store,
        &mut registry,
        &resolver,
    )
    .unwrap();
    assert_eq!(
        context_store.current_value(context).unwrap(),
        provided_value
    );
    assert_eq!(context_store.stack_depth(), 1);

    let complete_error =
        mount_test_context_provider_function_component_single_host_child_work_until_provider_complete(
            &mut store,
            &mut host,
            render,
            provider,
            function_component,
            missing_child_element,
            &source,
        )
        .unwrap_err();
    assert_eq!(
        complete_error,
        HostRootCompleteWorkHandoffError::HostWork(HostWorkError::MissingTestRootElement {
            handle: missing_child_element,
        },)
    );

    let unwind = unwind_context_provider_for_test(
        store.fiber_arena_mut(),
        &mut context_store,
        begin_work.begin_work(),
    )
    .unwrap();

    assert_eq!(unwind.provider(), provider);
    assert_eq!(unwind.context(), context);
    assert_eq!(unwind.value(), provided_value);
    assert_eq!(unwind.phase(), ContextProviderStackRestorationPhase::Unwind);
    assert_eq!(unwind.stack_depth_before_restore(), 1);
    assert_eq!(unwind.restored_stack_depth(), 0);
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(
        store
            .fiber_arena()
            .get(render.work_in_progress())
            .unwrap()
            .child(),
        Some(provider)
    );
    assert_eq!(
        store.fiber_arena().get(provider).unwrap().child(),
        Some(function_component)
    );
    assert_eq!(
        store.fiber_arena().get(function_component).unwrap().child(),
        None
    );
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
}

#[test]
fn root_work_loop_context_provider_use_context_complete_work_unwinds_before_output_error() {
    let (mut store, root_id, mut host) = root_store();
    let source = TestHostTree::new();
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, RootElementHandle::from_raw(134), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (provider, function_component, component) =
        attach_context_provider_wip_child(&mut store, render.work_in_progress());
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(1_010);
    let missing_value = context_value(1_011);
    let context = context_store.create_context(default_value);
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::ReadOnce { context });

    let error = handoff_completed_context_provider_use_context_child_to_test_complete_work(
        &mut store,
        &mut host,
        render,
        &source,
        HostRootContextProviderUseContextCompleteWorkHandoffRequest::new(context, missing_value),
        &mut context_store,
        &mut registry,
    )
    .unwrap_err();

    assert_eq!(
        error,
        HostRootContextProviderUseContextCompleteWorkHandoffError::ContextProvider(
            ContextProviderBeginWorkError::ChildBeginWork {
                provider,
                child: function_component,
                error: Box::new(BeginWorkError::FunctionComponentSingleChild(
                    FunctionComponentSingleChildReconciliationError::UnknownOutput {
                        fiber: function_component,
                        output: FunctionComponentOutputHandle::from_raw(missing_value.raw()),
                    },
                )),
            },
        )
    );
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(registry.reads().len(), 1);
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(
        store
            .fiber_arena()
            .get(render.work_in_progress())
            .unwrap()
            .child(),
        Some(provider)
    );
    assert_eq!(
        store.fiber_arena().get(provider).unwrap().child(),
        Some(function_component)
    );
    assert_eq!(
        store.fiber_arena().get(function_component).unwrap().child(),
        None
    );
    assert_eq!(
        store.fiber_arena().get(function_component).unwrap().flags(),
        FiberFlags::NO
    );
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
}

#[test]
fn root_work_loop_context_provider_use_context_complete_work_rejects_non_provider_before_push() {
    let (mut store, root_id, mut host) = root_store();
    let source = TestHostTree::new();
    update_container(&mut store, root_id, RootElementHandle::from_raw(135), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (_current_child, function_component, component) =
        attach_function_component_wip_child(&mut store, render.work_in_progress());
    let mut context_store = FunctionComponentContextRenderStore::new();
    let context = context_store.create_context(context_value(1_020));
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::ReadOnce { context });

    let error = handoff_completed_context_provider_use_context_child_to_test_complete_work(
        &mut store,
        &mut host,
        render,
        &source,
        HostRootContextProviderUseContextCompleteWorkHandoffRequest::new(
            context,
            context_value(1_021),
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap_err();

    assert_eq!(
        error,
        HostRootContextProviderUseContextCompleteWorkHandoffError::ExpectedContextProviderChild {
            root: root_id,
            host_root_work_in_progress: render.work_in_progress(),
            child: function_component,
            tag: FiberTag::FunctionComponent,
        }
    );
    assert!(registry.calls().is_empty());
    assert!(registry.reads().is_empty());
    assert_eq!(
        context_store.current_value(context).unwrap(),
        context_value(1_020)
    );
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_work_loop_nested_context_provider_handoff_pushes_child_reads_and_unwinds() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, RootElementHandle::from_raw(128), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (outer_provider, inner_provider, function_component, component) =
        attach_nested_context_provider_wip_child(&mut store, render.work_in_progress());
    let mut context_store = FunctionComponentContextRenderStore::new();
    let outer_default = context_value(930);
    let inner_default = context_value(940);
    let outer_value = context_value(931);
    let inner_value = context_value(941);
    let outer_context = context_store.create_context(outer_default);
    let inner_context = context_store.create_context(inner_default);
    let output = FunctionComponentOutputHandle::from_raw(942);
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Ok(output));

    let root_record = handoff_host_root_nested_context_provider_child_begin_work(
        &mut store,
        HostRootNestedContextProviderBeginWorkHandoffRequest::new(
            root_id,
            render.work_in_progress(),
            Lanes::DEFAULT,
            outer_context,
            outer_value,
            inner_context,
            inner_value,
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap();
    let record = root_record.begin_work();

    assert_eq!(root_record.root(), root_id);
    assert_eq!(
        root_record.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(root_record.outer_provider(), outer_provider);
    assert_eq!(root_record.inner_provider(), inner_provider);
    assert_eq!(root_record.function_component(), function_component);
    assert_eq!(record.outer_provider(), outer_provider);
    assert_eq!(record.inner_provider(), inner_provider);
    assert_eq!(record.child(), function_component);
    assert_eq!(record.outer_context(), outer_context);
    assert_eq!(record.outer_value(), outer_value);
    assert_eq!(record.inner_context(), inner_context);
    assert_eq!(record.inner_value(), inner_value);
    assert_eq!(record.child_output(), output);
    assert_eq!(record.child_context_read_count(), 2);
    assert_eq!(record.outer_pushed_stack_depth(), 1);
    assert_eq!(record.inner_pushed_stack_depth(), 2);
    assert_eq!(record.inner_restored_stack_depth(), 1);
    assert_eq!(record.outer_restored_stack_depth(), 0);
    assert_eq!(registry.calls().len(), 1);
    let context_state = registry.calls()[0].context_state().unwrap();
    assert_eq!(context_state.render_fiber(), function_component);
    assert_eq!(context_state.stack_depth(), 2);

    let reads = context_store.context_reads_for_record(record.child_render());
    assert_eq!(reads.len(), 2);
    assert_eq!(reads[0].fiber(), function_component);
    assert_eq!(reads[0].context(), outer_context);
    assert_eq!(reads[0].default_value(), outer_default);
    assert_eq!(reads[0].value(), outer_value);
    assert_eq!(reads[1].fiber(), function_component);
    assert_eq!(reads[1].context(), inner_context);
    assert_eq!(reads[1].default_value(), inner_default);
    assert_eq!(reads[1].value(), inner_value);
    assert_eq!(
        context_store.current_value(outer_context).unwrap(),
        outer_default
    );
    assert_eq!(
        context_store.current_value(inner_context).unwrap(),
        inner_default
    );
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store
            .fiber_arena()
            .get(outer_provider)
            .unwrap()
            .return_fiber(),
        Some(render.work_in_progress())
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(inner_provider)
            .unwrap()
            .return_fiber(),
        Some(outer_provider)
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(function_component)
            .unwrap()
            .return_fiber(),
        Some(inner_provider)
    );
}

#[test]
fn root_work_loop_nested_context_provider_use_context_reads_nearest_provider_value() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, RootElementHandle::from_raw(131), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (outer_provider, inner_provider, function_component, component) =
        attach_nested_context_provider_wip_child(&mut store, render.work_in_progress());
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(990);
    let outer_value = context_value(991);
    let inner_value = context_value(992);
    let context = context_store.create_context(default_value);
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::ReadOnce { context });

    let root_record = handoff_host_root_nested_context_provider_use_context_child_begin_work(
        &mut store,
        HostRootNestedContextProviderBeginWorkHandoffRequest::new(
            root_id,
            render.work_in_progress(),
            Lanes::DEFAULT,
            context,
            outer_value,
            context,
            inner_value,
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap();
    let record = root_record.begin_work();

    assert_eq!(root_record.root(), root_id);
    assert_eq!(
        root_record.host_root_work_in_progress(),
        render.work_in_progress()
    );
    assert_eq!(root_record.outer_provider(), outer_provider);
    assert_eq!(root_record.inner_provider(), inner_provider);
    assert_eq!(root_record.function_component(), function_component);
    assert_eq!(record.outer_provider(), outer_provider);
    assert_eq!(record.inner_provider(), inner_provider);
    assert_eq!(record.child(), function_component);
    assert_eq!(record.outer_context(), context);
    assert_eq!(record.inner_context(), context);
    assert_eq!(record.outer_value(), outer_value);
    assert_eq!(record.inner_value(), inner_value);
    assert_eq!(record.child_context_read_count(), 1);
    assert_eq!(
        record.child_output(),
        FunctionComponentOutputHandle::from_raw(inner_value.raw())
    );
    assert_eq!(record.outer_pushed_stack_depth(), 1);
    assert_eq!(record.inner_pushed_stack_depth(), 2);
    assert_eq!(record.inner_restored_stack_depth(), 1);
    assert_eq!(record.outer_restored_stack_depth(), 0);
    assert_eq!(registry.calls().len(), 1);
    let context_state = registry.calls()[0].context_state().unwrap();
    assert_eq!(context_state.render_fiber(), function_component);
    assert_eq!(context_state.stack_depth(), 2);

    let read = record.child_context_read();
    assert_eq!(read.fiber(), function_component);
    assert_eq!(read.context(), context);
    assert_eq!(read.default_value(), default_value);
    assert_eq!(read.value(), inner_value);
    assert_eq!(read.active_provider_count(), 2);
    assert_eq!(registry.reads(), &[read]);
    assert_eq!(
        context_store.context_reads_for_record(record.child_render()),
        &[read]
    );
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
}

#[test]
fn root_work_loop_nested_context_provider_use_context_unwinds_after_unsupported_consumer_shape() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, RootElementHandle::from_raw(132), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (outer_provider, inner_provider, function_component, component) =
        attach_nested_context_provider_wip_child(&mut store, render.work_in_progress());
    let mut context_store = FunctionComponentContextRenderStore::new();
    let default_value = context_value(993);
    let context = context_store.create_context(default_value);
    let mut registry =
        TestUseContextComponentRegistry::new(component, UseContextBehavior::ReadTwice { context });

    let error = handoff_host_root_nested_context_provider_use_context_child_begin_work(
        &mut store,
        HostRootNestedContextProviderBeginWorkHandoffRequest::new(
            root_id,
            render.work_in_progress(),
            Lanes::DEFAULT,
            context,
            context_value(994),
            context,
            context_value(995),
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap_err();

    assert_eq!(
        error,
        HostRootNestedContextProviderBeginWorkHandoffError::NestedContextProvider(Box::new(
            NestedContextProviderBeginWorkError::ChildBeginWork {
                outer_provider,
                inner_provider,
                child: function_component,
                error: Box::new(BeginWorkError::FunctionComponent(
                    FunctionComponentRenderError::UnsupportedUseContextReadCount {
                        fiber: function_component,
                        read_count: 2,
                    },
                )),
            },
        ))
    );
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(registry.reads().len(), 2);
    assert_eq!(context_store.current_value(context).unwrap(), default_value);
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store
            .fiber_arena()
            .get(function_component)
            .unwrap()
            .memoized_props(),
        PropsHandle::NONE
    );
}

#[test]
fn root_work_loop_nested_context_provider_handoff_unwinds_after_child_error() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, RootElementHandle::from_raw(129), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (outer_provider, inner_provider, function_component, component) =
        attach_nested_context_provider_wip_child(&mut store, render.work_in_progress());
    let mut context_store = FunctionComponentContextRenderStore::new();
    let outer_default = context_value(950);
    let inner_default = context_value(960);
    let outer_context = context_store.create_context(outer_default);
    let inner_context = context_store.create_context(inner_default);
    let invocation_error = FunctionComponentInvocationError::component_error("root nested boom");
    let mut registry = TestFunctionComponentRegistry::default();
    registry.register(component, Err(invocation_error.clone()));

    let error = handoff_host_root_nested_context_provider_child_begin_work(
        &mut store,
        HostRootNestedContextProviderBeginWorkHandoffRequest::new(
            root_id,
            render.work_in_progress(),
            Lanes::DEFAULT,
            outer_context,
            context_value(951),
            inner_context,
            context_value(961),
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap_err();

    assert_eq!(
        error,
        HostRootNestedContextProviderBeginWorkHandoffError::NestedContextProvider(Box::new(
            NestedContextProviderBeginWorkError::ChildBeginWork {
                outer_provider,
                inner_provider,
                child: function_component,
                error: Box::new(BeginWorkError::FunctionComponent(
                    FunctionComponentRenderError::Invocation {
                        fiber: function_component,
                        component,
                        error: invocation_error,
                    },
                )),
            },
        ))
    );
    assert_eq!(registry.calls().len(), 1);
    assert_eq!(
        registry.calls()[0].context_state().unwrap().stack_depth(),
        2
    );
    assert_eq!(
        context_store.current_value(outer_context).unwrap(),
        outer_default
    );
    assert_eq!(
        context_store.current_value(inner_context).unwrap(),
        inner_default
    );
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(
        context_store.active_provider_count(outer_context).unwrap(),
        0
    );
    assert_eq!(
        context_store.active_provider_count(inner_context).unwrap(),
        0
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store
            .fiber_arena()
            .get(function_component)
            .unwrap()
            .memoized_props(),
        PropsHandle::NONE
    );
}

#[test]
fn root_work_loop_nested_context_provider_handoff_rejects_non_provider_root_child_before_push() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(130), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (_current_child, function_component, _component) =
        attach_function_component_wip_child(&mut store, render.work_in_progress());
    let mut context_store = FunctionComponentContextRenderStore::new();
    let outer_context = context_store.create_context(context_value(970));
    let inner_context = context_store.create_context(context_value(980));
    let mut registry = TestFunctionComponentRegistry::default();

    let error = handoff_host_root_nested_context_provider_child_begin_work(
        &mut store,
        HostRootNestedContextProviderBeginWorkHandoffRequest::new(
            root_id,
            render.work_in_progress(),
            Lanes::DEFAULT,
            outer_context,
            context_value(971),
            inner_context,
            context_value(981),
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap_err();

    assert_eq!(
        error,
        HostRootNestedContextProviderBeginWorkHandoffError::ExpectedContextProviderChild {
            root: root_id,
            host_root_work_in_progress: render.work_in_progress(),
            child: function_component,
            tag: FiberTag::FunctionComponent,
        }
    );
    assert!(registry.calls().is_empty());
    assert_eq!(
        context_store.current_value(outer_context).unwrap(),
        context_value(970)
    );
    assert_eq!(
        context_store.current_value(inner_context).unwrap(),
        context_value(980)
    );
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_work_loop_context_provider_handoff_fails_closed_for_non_provider_root_child() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(119), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (_current_child, function_component, _component) =
        attach_function_component_wip_child(&mut store, render.work_in_progress());
    let mut context_store = FunctionComponentContextRenderStore::new();
    let context = context_store.create_context(context_value(910));
    let mut registry = TestFunctionComponentRegistry::default();

    let error = handoff_host_root_context_provider_child_begin_work(
        &mut store,
        HostRootContextProviderBeginWorkHandoffRequest::new(
            root_id,
            render.work_in_progress(),
            Lanes::DEFAULT,
            context,
            context_value(911),
        ),
        &mut context_store,
        &mut registry,
    )
    .unwrap_err();

    assert_eq!(
        error,
        HostRootContextProviderBeginWorkHandoffError::ExpectedContextProviderChild {
            root: root_id,
            host_root_work_in_progress: render.work_in_progress(),
            child: function_component,
            tag: FiberTag::FunctionComponent,
        }
    );
    assert!(registry.calls().is_empty());
    assert_eq!(
        context_store.current_value(context).unwrap(),
        context_value(910)
    );
    assert_eq!(context_store.stack_depth(), 0);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
