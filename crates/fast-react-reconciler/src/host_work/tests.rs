use super::*;
use crate::commit_finished_host_root;
use crate::function_component::{FunctionComponentEffectPhase, FunctionComponentHookRenderStore};
use crate::host_nodes::HostNodeViolation;
use crate::passive_effects::{
    PassiveEffectDestroyCallbackErrorHandle, PassiveEffectDestroyCallbackExecutionRequest,
    PassiveEffectDestroyCallbackExecutor, PassiveEffectsFlushStatus,
    flush_passive_effects_after_commit_with_deleted_subtree_destroy_executor_for_canary,
};
use crate::root_commit::{
    HostRootDeletionCleanupOrderPhase, HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary,
    HostRootMutationApplyRecordSource, HostRootPlacementSiblingStatus, HostRootRefDetachReason,
    commit_completed_host_root_render_with_finished_work_handoff_for_canary,
    commit_finished_host_root_with_finished_work_handoff_for_canary,
    host_root_text_update_commit_execution_request_for_canary,
    queue_function_component_deleted_subtree_pending_passive_effects,
    record_host_root_finished_work_pending_commit_for_canary,
};
use crate::root_config::{PendingPassiveEffectPhase, PendingPassiveUnmountOrigin};
use crate::test_support::{FakeContainer, FakeHostChild};
use fast_react_core::{
    DeletionListId, DependenciesHandle, FiberTypeHandle, HookEffectCallbackHandle,
    HookEffectDependencies, RefHandle,
};
use fast_react_host_config::HostFiberTokenViolation;

fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId) {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let root_id = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    (store, root_id)
}

fn render_test_root(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    element: RootElementHandle,
) -> HostRootRenderPhaseRecord {
    update_container(store, root_id, element, None).unwrap();
    render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap()
}

fn text_from_root(source: &TestHostTree, element: RootElementHandle) -> &TestHostText {
    match source.root(element).unwrap() {
        TestHostNode::Text(text) => text,
        TestHostNode::Element(_) => panic!("expected text root"),
    }
}

fn element_from_root(source: &TestHostTree, element: RootElementHandle) -> &TestHostElement {
    match source.root(element).unwrap() {
        TestHostNode::Element(element) => element,
        TestHostNode::Text(_) => panic!("expected host element root"),
    }
}

fn first_text_child(element: &TestHostElement) -> &TestHostText {
    match element.children().first().unwrap() {
        TestHostNode::Text(text) => text,
        TestHostNode::Element(_) => panic!("expected host text child"),
    }
}

fn callback(raw: u64) -> HookEffectCallbackHandle {
    HookEffectCallbackHandle::from_raw(raw)
}

fn deps(raw: u64) -> HookEffectDependencies {
    HookEffectDependencies::array(DependenciesHandle::from_raw(raw))
}

fn attach_detached_root_instance_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    element: &TestHostElement,
    flags: FiberFlags,
) -> FiberId {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let fiber =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, element.props(), mode);
    let scope =
        issue_creation_host_node_scope(store, root_id, fiber, HostFiberTokenTarget::Instance)
            .unwrap();
    let token = FakeHostFiberToken(scope.token_id().raw());
    let container = *store.root(root_id).unwrap().container_info();
    let mut instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &element.ty(),
            &(),
            &container,
            &(),
        )
        .unwrap();
    host.finalize_initial_children(&mut instance, &element.ty(), &(), &container, &())
        .unwrap();
    let state_node = detached_hosts.insert_instance(scope, instance);
    {
        let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
        node.set_element_type(element.element_type());
        node.set_flags(flags);
        node.set_state_node(state_node);
        node.set_memoized_props(element.props());
    }
    store
        .fiber_arena_mut()
        .set_children(host_root, &[fiber])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    fiber
}

fn create_detached_root_text_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    text: &str,
    flags: FiberFlags,
) -> FiberId {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let fiber = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9001),
        mode,
    );
    let scope =
        issue_creation_host_node_scope(store, root_id, fiber, HostFiberTokenTarget::TextInstance)
            .unwrap();
    let token = FakeHostFiberToken(scope.token_id().raw());
    let container = *store.root(root_id).unwrap().container_info();
    let text_instance = host
        .create_text_instance(
            HostFiberTokenRef::new(
                &token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            text,
            &container,
            &(),
        )
        .unwrap();
    let state_node = detached_hosts.insert_text(scope, text_instance);
    {
        let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
        node.set_flags(flags);
        node.set_state_node(state_node);
        node.set_memoized_props(PropsHandle::from_raw(9001));
    }
    fiber
}

fn attach_detached_root_text_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    text: &str,
    flags: FiberFlags,
) -> FiberId {
    let fiber = create_detached_root_text_for_commit(
        store,
        host,
        detached_hosts,
        root_id,
        host_root,
        text,
        flags,
    );
    store
        .fiber_arena_mut()
        .set_children(host_root, &[fiber])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    fiber
}

fn stable_root_text_work_in_progress_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    current_text: FiberId,
    next_props: PropsHandle,
) -> FiberId {
    let work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(current_text, next_props)
        .unwrap();
    let node = store.fiber_arena_mut().get_mut(work_in_progress).unwrap();
    node.set_flags(FiberFlags::NO);
    node.set_lanes(Lanes::NO);
    node.set_memoized_props(next_props);
    work_in_progress
}

fn update_root_component_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    host_root: FiberId,
    current_component: FiberId,
    next_element: &TestHostElement,
    detached_hosts: &mut DetachedHostRecords,
) -> HostComponentUpdatePayload {
    let payload = update_test_host_component_work(
        store,
        root_id,
        current_component,
        next_element,
        Lanes::NO,
        detached_hosts,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[payload.work_in_progress()])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    payload
}

fn assert_single_test_property_update(
    detached_hosts: &DetachedHostRecords,
    handle: StateNodeHandle,
    root_id: FiberRootId,
    current_component: FiberId,
    old_props: PropsHandle,
    new_props: PropsHandle,
) {
    assert_single_component_property_update(
        detached_hosts,
        handle,
        root_id,
        current_component,
        old_props,
        new_props,
        TestHostComponentPropertyPayloadKind::SafeTestProperty,
        TEST_HOST_SAFE_PROPERTY_PROP_NAME,
        TEST_HOST_SAFE_PROPERTY_NAME,
        HostNodePropertyUpdateExecution::CommitUpdate,
    );
}

#[allow(clippy::too_many_arguments)]
fn assert_single_component_property_update(
    detached_hosts: &DetachedHostRecords,
    handle: StateNodeHandle,
    root_id: FiberRootId,
    current_component: FiberId,
    old_props: PropsHandle,
    new_props: PropsHandle,
    payload_kind: TestHostComponentPropertyPayloadKind,
    prop_name: &'static str,
    property_name: &'static str,
    execution: HostNodePropertyUpdateExecution,
) {
    let metadata = detached_hosts.instance_metadata(handle).unwrap();
    let updates = detached_hosts.instance_property_updates(handle).unwrap();
    assert_eq!(updates.len(), 1);
    assert_eq!(updates[0].sequence(), 0);
    assert_eq!(updates[0].store_order(), 0);
    assert_eq!(updates[0].handle(), handle);
    assert_eq!(updates[0].root_id(), root_id);
    assert_eq!(updates[0].fiber_id(), current_component);
    assert_eq!(updates[0].token_id(), metadata.token_id());
    assert_eq!(updates[0].phase(), metadata.phase());
    assert_eq!(updates[0].target(), HostFiberTokenTarget::Instance);
    assert_eq!(updates[0].source_currentness().handle(), handle);
    assert_eq!(updates[0].source_currentness().root_id(), root_id);
    assert_eq!(
        updates[0].source_currentness().fiber_id(),
        current_component
    );
    assert_eq!(
        updates[0].source_currentness().token_id(),
        metadata.token_id()
    );
    assert_eq!(updates[0].source_currentness().phase(), metadata.phase());
    assert_eq!(
        updates[0].source_currentness().target(),
        HostFiberTokenTarget::Instance
    );
    assert!(
        !updates[0]
            .source_currentness()
            .public_dom_compatibility_claimed()
    );
    assert_eq!(updates[0].payload_kind(), payload_kind.as_str());
    assert_eq!(updates[0].prop_name(), prop_name);
    assert_eq!(updates[0].property_name(), property_name);
    assert_eq!(updates[0].old_props(), old_props);
    assert_eq!(updates[0].new_props(), new_props);
    assert_eq!(updates[0].execution(), execution);
}

#[allow(clippy::too_many_arguments)]
fn assert_single_latest_props_update_after_property_update(
    detached_hosts: &DetachedHostRecords,
    handle: StateNodeHandle,
    root_id: FiberRootId,
    current_component: FiberId,
    old_props: PropsHandle,
    new_props: PropsHandle,
    payload_kind: TestHostComponentPropertyPayloadKind,
    prop_name: &'static str,
) {
    let metadata = detached_hosts.instance_metadata(handle).unwrap();
    let property_updates = detached_hosts.instance_property_updates(handle).unwrap();
    let latest_props_updates = detached_hosts
        .instance_latest_props_updates(handle)
        .unwrap();
    assert_eq!(property_updates.len(), 1);
    assert_eq!(latest_props_updates.len(), 1);
    assert_eq!(latest_props_updates[0].sequence(), 0);
    assert_eq!(latest_props_updates[0].store_order(), 1);
    assert!(latest_props_updates[0].store_order() > property_updates[0].store_order());
    assert_eq!(latest_props_updates[0].handle(), handle);
    assert_eq!(latest_props_updates[0].root_id(), root_id);
    assert_eq!(latest_props_updates[0].fiber_id(), current_component);
    assert_eq!(latest_props_updates[0].token_id(), metadata.token_id());
    assert_eq!(latest_props_updates[0].phase(), metadata.phase());
    assert_eq!(
        latest_props_updates[0].target(),
        HostFiberTokenTarget::Instance
    );
    assert_eq!(
        latest_props_updates[0].source_currentness(),
        property_updates[0].source_currentness()
    );
    assert_eq!(
        latest_props_updates[0].source_currentness().handle(),
        handle
    );
    assert_eq!(
        latest_props_updates[0].source_currentness().root_id(),
        root_id
    );
    assert_eq!(
        latest_props_updates[0].source_currentness().fiber_id(),
        current_component
    );
    assert_eq!(
        latest_props_updates[0].source_currentness().token_id(),
        metadata.token_id()
    );
    assert_eq!(
        latest_props_updates[0].source_currentness().phase(),
        metadata.phase()
    );
    assert_eq!(
        latest_props_updates[0].source_currentness().target(),
        HostFiberTokenTarget::Instance
    );
    assert_eq!(
        latest_props_updates[0].payload_kind(),
        payload_kind.as_str()
    );
    assert_eq!(latest_props_updates[0].prop_name(), prop_name);
    assert_eq!(
        latest_props_updates[0].property_update_sequence(),
        property_updates[0].sequence()
    );
    assert_eq!(
        latest_props_updates[0].property_update_store_order(),
        property_updates[0].store_order()
    );
    assert_eq!(latest_props_updates[0].old_props(), old_props);
    assert_eq!(latest_props_updates[0].previous_latest_props(), None);
    assert_eq!(latest_props_updates[0].latest_props(), new_props);
    assert!(!latest_props_updates[0].public_dom_compatibility_claimed());
    assert_eq!(
        detached_hosts.instance_latest_props(handle).unwrap(),
        Some(new_props)
    );
}

struct RootComponentUpdateApplyFixture {
    store: FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    host: RecordingHost,
    detached_hosts: DetachedHostRecords,
    commit: HostRootCommitRecord,
    payload: HostComponentUpdatePayload,
    state_node: StateNodeHandle,
    operations_before_apply: Vec<&'static str>,
    token_count_before_apply: usize,
}

fn root_component_update_apply_fixture() -> RootComponentUpdateApplyFixture {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "ignored");
    let initial = element_from_root(&source, initial_element);
    let create_render = render_test_root(&mut store, root_id, initial_element);
    let current_component = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        initial,
        FiberFlags::PLACEMENT,
    );
    let state_node = store
        .fiber_arena()
        .get(current_component)
        .unwrap()
        .state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let next_element = source.insert_host_element_with_text("section", "updated");
    let next = element_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let payload = update_root_component_for_commit(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_component,
        next,
        &mut detached_hosts,
    );
    let commit = commit_finished_host_root(&mut store, update_render).unwrap();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    RootComponentUpdateApplyFixture {
        store,
        root_id,
        host,
        detached_hosts,
        commit,
        payload,
        state_node,
        operations_before_apply,
        token_count_before_apply,
    }
}

#[test]
fn host_work_rejects_sequence_only_component_payload_currentness_before_recording() {
    let mut fixture = root_component_update_apply_fixture();
    let scope = fixture
        .detached_hosts
        .scope(fixture.state_node, HostFiberTokenTarget::Instance)
        .unwrap();
    let row = fixture.payload.property_row();
    let update = HostNodePropertyUpdate::new(
        row.prop_name(),
        row.property_name(),
        fixture.payload.old_props(),
        fixture.payload.new_props(),
    )
    .with_payload_kind(row.kind().as_str())
    .with_execution(HostNodePropertyUpdateExecution::CommitUpdate);

    let error = fixture
        .detached_hosts
        .nodes
        .apply_instance_property_update(fixture.state_node, scope, update)
        .unwrap_err();

    assert_eq!(error.violation(), HostNodeViolation::MissingCurrentness);
    assert_eq!(
        fixture
            .detached_hosts
            .instance_property_updates(fixture.state_node)
            .unwrap(),
        &[]
    );
}

#[test]
fn host_work_rejects_sequence_only_text_payload_currentness_before_recording() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(79_200));
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
        FiberFlags::PLACEMENT,
    );
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();
    let scope = detached_hosts
        .scope(state_node, HostFiberTokenTarget::TextInstance)
        .unwrap();

    let error = detached_hosts
        .nodes
        .apply_text_update(
            state_node,
            scope,
            HostNodeTextUpdate::new("before", "after"),
        )
        .unwrap_err();

    assert_eq!(error.violation(), HostNodeViolation::MissingCurrentness);
    assert_eq!(
        detached_hosts
            .test_host_text_record_updates(state_node)
            .unwrap(),
        &[]
    );
}

struct DangerousHtmlTextResetHandoffFixture {
    store: FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    host: RecordingHost,
    detached_hosts: DetachedHostRecords,
    render: HostRootRenderPhaseRecord,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    complete_work: HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
    payload: HostComponentUpdatePayload,
    state_node: StateNodeHandle,
    previous_current: FiberId,
    operations_before_apply: Vec<&'static str>,
    token_count_before_apply: usize,
}

fn dangerous_html_text_reset_handoff_fixture(
    payload_kind: HostComponentDangerousHtmlTextResetPayloadKindForCanary,
    handoff_order: usize,
) -> DangerousHtmlTextResetHandoffFixture {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "ignored");
    let initial = element_from_root(&source, initial_element);
    let create_render = render_test_root(&mut store, root_id, initial_element);
    let current_component = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        initial,
        FiberFlags::PLACEMENT,
    );
    let state_node = store
        .fiber_arena()
        .get(current_component)
        .unwrap()
        .state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let next_element = source.insert_host_element_with_text("section", "updated");
    let next = element_from_root(&source, next_element);
    let render = render_test_root(&mut store, root_id, next_element);
    let payload = update_root_component_for_commit(
        &mut store,
        root_id,
        render.finished_work(),
        current_component,
        next,
        &mut detached_hosts,
    );
    let complete_work = host_component_dangerous_html_text_reset_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        payload.work_in_progress(),
        payload_kind,
    )
    .unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, handoff_order)
            .unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    DangerousHtmlTextResetHandoffFixture {
        store,
        root_id,
        host,
        detached_hosts,
        render,
        pending,
        complete_work,
        payload,
        state_node,
        previous_current,
        operations_before_apply,
        token_count_before_apply,
    }
}

fn assert_component_property_payload_error(
    error: HostWorkError,
    root_id: FiberRootId,
    fiber: FiberId,
    prop_name: &'static str,
    violation: TestHostComponentPropertyPayloadViolation,
) {
    match error {
        HostWorkError::InvalidHostComponentPropertyUpdatePayload {
            root,
            fiber: actual_fiber,
            prop_name: actual_prop_name,
            violation: actual_violation,
        } => {
            assert_eq!(root, root_id);
            assert_eq!(actual_fiber, fiber);
            assert_eq!(actual_prop_name, prop_name);
            assert_eq!(actual_violation, violation);
        }
        other => panic!("expected invalid component property payload, got {other:?}"),
    }
}

fn update_root_text_for_commit_with_payload(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    host_root: FiberId,
    current_text: FiberId,
    next_text: &TestHostText,
    detached_hosts: &mut DetachedHostRecords,
) -> HostTextUpdateDiff {
    let diff = update_test_host_text_work(
        store,
        root_id,
        current_text,
        next_text,
        Lanes::NO,
        detached_hosts,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[diff.work_in_progress()])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    diff
}

fn update_host_parent_text_for_commit_with_payload(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    host_root: FiberId,
    current_parent: FiberId,
    current_text: FiberId,
    next_text: &TestHostText,
    detached_hosts: &mut DetachedHostRecords,
) -> (FiberId, HostTextUpdateDiff) {
    let parent_node = store.fiber_arena().get(current_parent).unwrap();
    let parent_props = parent_node.memoized_props();
    let parent_state_node = parent_node.state_node();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    let diff = update_test_host_text_work(
        store,
        root_id,
        current_text,
        next_text,
        Lanes::NO,
        detached_hosts,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[diff.work_in_progress()])
        .unwrap();
    complete_fiber_common(
        store,
        work_parent,
        parent_props,
        parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    (work_parent, diff)
}

#[allow(clippy::too_many_arguments)]
fn update_host_parent_component_and_text_for_commit_with_payload(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    host_root: FiberId,
    current_parent: FiberId,
    current_component: FiberId,
    current_text: FiberId,
    next_component: &TestHostElement,
    next_text: &TestHostText,
    detached_hosts: &mut DetachedHostRecords,
) -> (FiberId, HostComponentUpdatePayload, HostTextUpdateDiff) {
    let parent_node = store.fiber_arena().get(current_parent).unwrap();
    let parent_props = parent_node.memoized_props();
    let parent_state_node = parent_node.state_node();
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

    let payload = update_test_host_component_work(
        store,
        root_id,
        current_component,
        next_component,
        Lanes::NO,
        detached_hosts,
    )
    .unwrap();
    let diff = update_test_host_text_work(
        store,
        root_id,
        current_text,
        next_text,
        Lanes::NO,
        detached_hosts,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(payload.work_in_progress(), &[diff.work_in_progress()])
        .unwrap();
    complete_fiber_common(
        store,
        payload.work_in_progress(),
        next_component.props(),
        payload.state_node(),
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[payload.work_in_progress()])
        .unwrap();
    complete_fiber_common(
        store,
        work_parent,
        parent_props,
        parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    (work_parent, payload, diff)
}

fn update_root_text_for_commit_without_payload(
    store: &mut FiberRootStore<RecordingHost>,
    host_root: FiberId,
    current_text: FiberId,
    next_props: PropsHandle,
) -> FiberId {
    let work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(current_text, next_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_in_progress).unwrap();
        node.set_flags(FiberFlags::UPDATE);
        node.set_memoized_props(next_props);
    }
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_in_progress])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    work_in_progress
}

fn update_root_component_for_commit_without_payload(
    store: &mut FiberRootStore<RecordingHost>,
    host_root: FiberId,
    current_component: FiberId,
    next_props: PropsHandle,
) -> FiberId {
    let state_node = store
        .fiber_arena()
        .get(current_component)
        .unwrap()
        .state_node();
    let work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(current_component, next_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_in_progress).unwrap();
        node.set_flags(FiberFlags::UPDATE);
        node.set_state_node(state_node);
        node.set_memoized_props(next_props);
    }
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_in_progress])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    work_in_progress
}

fn attach_detached_root_element_with_text_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    text: &str,
) -> (FiberId, FiberId) {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let component = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(9010),
        mode,
    );
    let text_fiber = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9011),
        mode,
    );

    let text_scope = issue_creation_host_node_scope(
        store,
        root_id,
        text_fiber,
        HostFiberTokenTarget::TextInstance,
    )
    .unwrap();
    let text_token = FakeHostFiberToken(text_scope.token_id().raw());
    let container = *store.root(root_id).unwrap().container_info();
    let text_instance = host
        .create_text_instance(
            HostFiberTokenRef::new(
                &text_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            text,
            &container,
            &(),
        )
        .unwrap();
    let text_state_node = detached_hosts.insert_text(text_scope, text_instance);
    complete_fiber_common(
        store,
        text_fiber,
        PropsHandle::from_raw(9011),
        text_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    let component_scope =
        issue_creation_host_node_scope(store, root_id, component, HostFiberTokenTarget::Instance)
            .unwrap();
    let component_token = FakeHostFiberToken(component_scope.token_id().raw());
    let mut instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &component_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &"div",
            &(),
            &container,
            &(),
        )
        .unwrap();
    detached_hosts
        .append_initial_child(
            store.host_tokens(),
            host,
            &mut instance,
            root_id,
            store.fiber_arena().get(text_fiber).unwrap(),
        )
        .unwrap();
    let component_state_node = detached_hosts.insert_instance(component_scope, instance);
    store
        .fiber_arena_mut()
        .set_children(component, &[text_fiber])
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(component).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
    }
    complete_fiber_common(
        store,
        component,
        PropsHandle::from_raw(9010),
        component_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    store
        .fiber_arena_mut()
        .set_children(host_root, &[component])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    (component, text_fiber)
}

fn attach_detached_root_element_with_two_texts_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    first_text: &str,
    second_text: &str,
) -> (FiberId, FiberId, FiberId) {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let component = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(9_060),
        mode,
    );
    let first_text_fiber = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9_061),
        mode,
    );
    let second_text_fiber = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9_062),
        mode,
    );
    let container = *store.root(root_id).unwrap().container_info();

    let first_scope = issue_creation_host_node_scope(
        store,
        root_id,
        first_text_fiber,
        HostFiberTokenTarget::TextInstance,
    )
    .unwrap();
    let first_token = FakeHostFiberToken(first_scope.token_id().raw());
    let first_instance = host
        .create_text_instance(
            HostFiberTokenRef::new(
                &first_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            first_text,
            &container,
            &(),
        )
        .unwrap();
    let first_state_node = detached_hosts.insert_text(first_scope, first_instance);
    complete_fiber_common(
        store,
        first_text_fiber,
        PropsHandle::from_raw(9_061),
        first_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    let second_scope = issue_creation_host_node_scope(
        store,
        root_id,
        second_text_fiber,
        HostFiberTokenTarget::TextInstance,
    )
    .unwrap();
    let second_token = FakeHostFiberToken(second_scope.token_id().raw());
    let second_instance = host
        .create_text_instance(
            HostFiberTokenRef::new(
                &second_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            second_text,
            &container,
            &(),
        )
        .unwrap();
    let second_state_node = detached_hosts.insert_text(second_scope, second_instance);
    complete_fiber_common(
        store,
        second_text_fiber,
        PropsHandle::from_raw(9_062),
        second_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    let component_scope =
        issue_creation_host_node_scope(store, root_id, component, HostFiberTokenTarget::Instance)
            .unwrap();
    let component_token = FakeHostFiberToken(component_scope.token_id().raw());
    let mut instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &component_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &"section",
            &(),
            &container,
            &(),
        )
        .unwrap();
    detached_hosts
        .append_initial_child(
            store.host_tokens(),
            host,
            &mut instance,
            root_id,
            store.fiber_arena().get(first_text_fiber).unwrap(),
        )
        .unwrap();
    detached_hosts
        .append_initial_child(
            store.host_tokens(),
            host,
            &mut instance,
            root_id,
            store.fiber_arena().get(second_text_fiber).unwrap(),
        )
        .unwrap();
    let component_state_node = detached_hosts.insert_instance(component_scope, instance);
    store
        .fiber_arena_mut()
        .set_children(component, &[first_text_fiber, second_text_fiber])
        .unwrap();
    store
        .fiber_arena_mut()
        .get_mut(component)
        .unwrap()
        .set_flags(FiberFlags::PLACEMENT);
    complete_fiber_common(
        store,
        component,
        PropsHandle::from_raw(9_060),
        component_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[component])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    (component, first_text_fiber, second_text_fiber)
}

fn reorder_existing_text_before_stable_host_sibling_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host_root: FiberId,
    current_parent: FiberId,
    current_moving_text: FiberId,
    current_stable_text: FiberId,
    stable_state_node_override: Option<StateNodeHandle>,
) -> (FiberId, FiberId, FiberId) {
    let parent_node = store.fiber_arena().get(current_parent).unwrap();
    let parent_props = parent_node.memoized_props();
    let parent_state_node = parent_node.state_node();
    let moving_node = store.fiber_arena().get(current_moving_text).unwrap();
    let moving_props = moving_node.memoized_props();
    let moving_state_node = moving_node.state_node();
    let stable_node = store.fiber_arena().get(current_stable_text).unwrap();
    let stable_props = stable_node.memoized_props();
    let stable_state_node = stable_state_node_override.unwrap_or(stable_node.state_node());

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
    let moving_work = store
        .fiber_arena_mut()
        .create_work_in_progress(current_moving_text, moving_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(moving_work).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
        node.set_state_node(moving_state_node);
        node.set_memoized_props(moving_props);
        node.set_lanes(Lanes::NO);
    }
    let stable_work = store
        .fiber_arena_mut()
        .create_work_in_progress(current_stable_text, stable_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(stable_work).unwrap();
        node.set_state_node(stable_state_node);
        node.set_memoized_props(stable_props);
        node.set_lanes(Lanes::NO);
    }
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[moving_work, stable_work])
        .unwrap();
    complete_fiber_common(
        store,
        moving_work,
        moving_props,
        moving_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    complete_fiber_common(
        store,
        stable_work,
        stable_props,
        stable_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    complete_fiber_common(
        store,
        work_parent,
        parent_props,
        parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    (work_parent, moving_work, stable_work)
}

struct DeletedHostSubtreePassiveCleanupFixture {
    host_parent: FiberId,
    host_parent_state_node: StateNodeHandle,
    deleted_host: FiberId,
    deleted_host_state_node: StateNodeHandle,
    deleted_host_ref: RefHandle,
    deleted_function: FiberId,
    deleted_text: FiberId,
    deleted_text_state_node: StateNodeHandle,
    passive_create: HookEffectCallbackHandle,
    passive_destroy: HookEffectCallbackHandle,
    passive_dependencies: HookEffectDependencies,
}

fn attach_detached_host_subtree_with_passive_cleanup_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    hook_store: &mut FunctionComponentHookRenderStore,
    text: &str,
) -> DeletedHostSubtreePassiveCleanupFixture {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let container = *store.root(root_id).unwrap().container_info();

    let deleted_text = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9_621),
        mode,
    );
    let deleted_text_scope = issue_creation_host_node_scope(
        store,
        root_id,
        deleted_text,
        HostFiberTokenTarget::TextInstance,
    )
    .unwrap();
    let deleted_text_token = FakeHostFiberToken(deleted_text_scope.token_id().raw());
    let deleted_text_instance = host
        .create_text_instance(
            HostFiberTokenRef::new(
                &deleted_text_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            text,
            &container,
            &(),
        )
        .unwrap();
    let deleted_text_state_node =
        detached_hosts.insert_text(deleted_text_scope, deleted_text_instance);
    complete_fiber_common(
        store,
        deleted_text,
        PropsHandle::from_raw(9_621),
        deleted_text_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    let deleted_function = store.fiber_arena_mut().create_fiber(
        FiberTag::FunctionComponent,
        None,
        PropsHandle::from_raw(9_622),
        mode,
    );
    store
        .fiber_arena_mut()
        .get_mut(deleted_function)
        .unwrap()
        .set_fiber_type(FiberTypeHandle::from_raw(9_623));
    store
        .fiber_arena_mut()
        .set_children(deleted_function, &[deleted_text])
        .unwrap();
    let passive_create = callback(9_624);
    let passive_destroy = callback(9_625);
    let passive_dependencies = deps(9_626);
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
    complete_function_component_parent(store, deleted_function).unwrap();

    let deleted_host = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(9_627),
        mode,
    );
    let deleted_host_scope = issue_creation_host_node_scope(
        store,
        root_id,
        deleted_host,
        HostFiberTokenTarget::Instance,
    )
    .unwrap();
    let deleted_host_token = FakeHostFiberToken(deleted_host_scope.token_id().raw());
    let mut deleted_host_instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &deleted_host_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &"article",
            &(),
            &container,
            &(),
        )
        .unwrap();
    detached_hosts
        .append_initial_child(
            store.host_tokens(),
            host,
            &mut deleted_host_instance,
            root_id,
            store.fiber_arena().get(deleted_text).unwrap(),
        )
        .unwrap();
    let deleted_host_state_node =
        detached_hosts.insert_instance(deleted_host_scope, deleted_host_instance);
    let deleted_host_ref = RefHandle::from_raw(9_628);
    store
        .fiber_arena_mut()
        .set_children(deleted_host, &[deleted_function])
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(deleted_host).unwrap();
        node.set_ref_handle(deleted_host_ref);
    }
    complete_fiber_common(
        store,
        deleted_host,
        PropsHandle::from_raw(9_627),
        deleted_host_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    let host_parent = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(9_629),
        mode,
    );
    let host_parent_scope =
        issue_creation_host_node_scope(store, root_id, host_parent, HostFiberTokenTarget::Instance)
            .unwrap();
    let host_parent_token = FakeHostFiberToken(host_parent_scope.token_id().raw());
    let mut host_parent_instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &host_parent_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &"section",
            &(),
            &container,
            &(),
        )
        .unwrap();
    detached_hosts
        .append_initial_child(
            store.host_tokens(),
            host,
            &mut host_parent_instance,
            root_id,
            store.fiber_arena().get(deleted_host).unwrap(),
        )
        .unwrap();
    let host_parent_state_node =
        detached_hosts.insert_instance(host_parent_scope, host_parent_instance);
    store
        .fiber_arena_mut()
        .set_children(host_parent, &[deleted_host])
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(host_parent).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
    }
    complete_fiber_common(
        store,
        host_parent,
        PropsHandle::from_raw(9_629),
        host_parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    store
        .fiber_arena_mut()
        .set_children(host_root, &[host_parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();

    DeletedHostSubtreePassiveCleanupFixture {
        host_parent,
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
    }
}

#[derive(Default)]
struct RecordingDeletedSubtreeDestroyExecutor {
    calls: Vec<PassiveEffectDestroyCallbackExecutionRequest>,
}

impl RecordingDeletedSubtreeDestroyExecutor {
    fn calls(&self) -> &[PassiveEffectDestroyCallbackExecutionRequest] {
        &self.calls
    }
}

impl PassiveEffectDestroyCallbackExecutor for RecordingDeletedSubtreeDestroyExecutor {
    fn execute_destroy_callback(
        &mut self,
        request: PassiveEffectDestroyCallbackExecutionRequest,
    ) -> Result<(), PassiveEffectDestroyCallbackErrorHandle> {
        self.calls.push(request);
        Ok(())
    }
}

fn delete_host_text_under_host_parent_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host_root: FiberId,
    current_parent: FiberId,
    current_text: FiberId,
) -> FiberId {
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, PropsHandle::from_raw(9020))
        .unwrap();
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(work_parent, current_text)
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    work_parent
}

fn delete_host_component_under_host_parent_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host_root: FiberId,
    current_parent: FiberId,
    current_component: FiberId,
) -> FiberId {
    let parent_props = store
        .fiber_arena()
        .get(current_parent)
        .unwrap()
        .memoized_props();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_lanes(Lanes::NO);
        node.set_memoized_props(parent_props);
    }
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(work_parent, current_component)
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    work_parent
}

fn wrap_current_host_child_in_deleted_root(
    store: &mut FiberRootStore<RecordingHost>,
    current_parent: FiberId,
    current_child: FiberId,
    wrapper_tag: FiberTag,
    wrapper_state_node: StateNodeHandle,
) -> FiberId {
    let mode = store.fiber_arena().get(current_parent).unwrap().mode();
    let wrapper =
        store
            .fiber_arena_mut()
            .create_fiber(wrapper_tag, None, PropsHandle::from_raw(9_080), mode);
    {
        let node = store.fiber_arena_mut().get_mut(wrapper).unwrap();
        node.set_state_node(wrapper_state_node);
        node.set_memoized_props(PropsHandle::from_raw(9_080));
    }
    store
        .fiber_arena_mut()
        .set_children(current_parent, &[])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(wrapper, &[current_child])
        .unwrap();
    complete_host_root(store, wrapper).unwrap();
    store
        .fiber_arena_mut()
        .set_children(current_parent, &[wrapper])
        .unwrap();
    complete_host_root(store, current_parent).unwrap();
    wrapper
}

fn delete_non_host_root_under_host_parent_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host_root: FiberId,
    current_parent: FiberId,
    deleted_root: FiberId,
    parent_state_node_override: Option<StateNodeHandle>,
) -> FiberId {
    let parent_node = store.fiber_arena().get(current_parent).unwrap();
    let parent_props = parent_node.memoized_props();
    let parent_state_node = parent_state_node_override.unwrap_or(parent_node.state_node());
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_lanes(Lanes::NO);
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
    }
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(work_parent, deleted_root)
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    work_parent
}

fn place_detached_text_under_existing_host_parent_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    current_parent: FiberId,
    text: &str,
) -> (FiberId, FiberId) {
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, PropsHandle::from_raw(9040))
        .unwrap();
    let mode = store.fiber_arena().get(work_parent).unwrap().mode();
    let text_fiber = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9041),
        mode,
    );
    {
        let node = store.fiber_arena_mut().get_mut(text_fiber).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
    }

    let text_scope = issue_creation_host_node_scope(
        store,
        root_id,
        text_fiber,
        HostFiberTokenTarget::TextInstance,
    )
    .unwrap();
    let text_token = FakeHostFiberToken(text_scope.token_id().raw());
    let container = *store.root(root_id).unwrap().container_info();
    let text_instance = host
        .create_text_instance(
            HostFiberTokenRef::new(
                &text_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            text,
            &container,
            &(),
        )
        .unwrap();
    let text_state_node = detached_hosts.insert_text(text_scope, text_instance);
    complete_fiber_common(
        store,
        text_fiber,
        PropsHandle::from_raw(9041),
        text_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    let parent_state_node = store.fiber_arena().get(work_parent).unwrap().state_node();
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[text_fiber])
        .unwrap();
    complete_fiber_common(
        store,
        work_parent,
        PropsHandle::from_raw(9040),
        parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();

    (work_parent, text_fiber)
}

fn attach_detached_nested_root_element_with_text_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    text: &str,
) -> (FiberId, FiberId, FiberId) {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let outer = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(9050),
        mode,
    );
    let inner = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(9051),
        mode,
    );
    let text_fiber = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9052),
        mode,
    );

    let container = *store.root(root_id).unwrap().container_info();
    let text_scope = issue_creation_host_node_scope(
        store,
        root_id,
        text_fiber,
        HostFiberTokenTarget::TextInstance,
    )
    .unwrap();
    let text_token = FakeHostFiberToken(text_scope.token_id().raw());
    let text_instance = host
        .create_text_instance(
            HostFiberTokenRef::new(
                &text_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            text,
            &container,
            &(),
        )
        .unwrap();
    let text_state_node = detached_hosts.insert_text(text_scope, text_instance);
    complete_fiber_common(
        store,
        text_fiber,
        PropsHandle::from_raw(9052),
        text_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    let inner_scope =
        issue_creation_host_node_scope(store, root_id, inner, HostFiberTokenTarget::Instance)
            .unwrap();
    let inner_token = FakeHostFiberToken(inner_scope.token_id().raw());
    let mut inner_instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &inner_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &"label",
            &(),
            &container,
            &(),
        )
        .unwrap();
    detached_hosts
        .append_initial_child(
            store.host_tokens(),
            host,
            &mut inner_instance,
            root_id,
            store.fiber_arena().get(text_fiber).unwrap(),
        )
        .unwrap();
    let inner_state_node = detached_hosts.insert_instance(inner_scope, inner_instance);
    store
        .fiber_arena_mut()
        .set_children(inner, &[text_fiber])
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(inner).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
    }
    complete_fiber_common(
        store,
        inner,
        PropsHandle::from_raw(9051),
        inner_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    let outer_scope =
        issue_creation_host_node_scope(store, root_id, outer, HostFiberTokenTarget::Instance)
            .unwrap();
    let outer_token = FakeHostFiberToken(outer_scope.token_id().raw());
    let mut outer_instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &outer_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &"section",
            &(),
            &container,
            &(),
        )
        .unwrap();
    detached_hosts
        .append_initial_child(
            store.host_tokens(),
            host,
            &mut outer_instance,
            root_id,
            store.fiber_arena().get(inner).unwrap(),
        )
        .unwrap();
    let outer_state_node = detached_hosts.insert_instance(outer_scope, outer_instance);
    store
        .fiber_arena_mut()
        .set_children(outer, &[inner])
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(outer).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
    }
    complete_fiber_common(
        store,
        outer,
        PropsHandle::from_raw(9050),
        outer_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    store
        .fiber_arena_mut()
        .set_children(host_root, &[outer])
        .unwrap();
    complete_host_root(store, host_root).unwrap();
    (outer, inner, text_fiber)
}

fn place_detached_text_under_existing_nested_host_parent_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    current_fibers: (FiberId, FiberId, FiberId),
    text: &str,
) -> (FiberId, FiberId, FiberId, FiberId) {
    let (current_outer, current_inner, current_text) = current_fibers;
    let outer_props = store
        .fiber_arena()
        .get(current_outer)
        .unwrap()
        .memoized_props();
    let inner_props = store
        .fiber_arena()
        .get(current_inner)
        .unwrap()
        .memoized_props();
    let text_props = store
        .fiber_arena()
        .get(current_text)
        .unwrap()
        .memoized_props();
    let outer_state_node = store.fiber_arena().get(current_outer).unwrap().state_node();
    let inner_state_node = store.fiber_arena().get(current_inner).unwrap().state_node();
    let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();

    let work_outer = store
        .fiber_arena_mut()
        .create_work_in_progress(current_outer, outer_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_outer).unwrap();
        node.set_state_node(outer_state_node);
        node.set_memoized_props(outer_props);
        node.set_lanes(Lanes::NO);
    }
    let work_inner = store
        .fiber_arena_mut()
        .create_work_in_progress(current_inner, inner_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_inner).unwrap();
        node.set_state_node(inner_state_node);
        node.set_memoized_props(inner_props);
        node.set_lanes(Lanes::NO);
    }
    let stable_text = store
        .fiber_arena_mut()
        .create_work_in_progress(current_text, text_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(stable_text).unwrap();
        node.set_state_node(text_state_node);
        node.set_memoized_props(text_props);
        node.set_lanes(Lanes::NO);
    }

    let mode = store.fiber_arena().get(work_inner).unwrap().mode();
    let placed_text = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9053),
        mode,
    );
    {
        let node = store.fiber_arena_mut().get_mut(placed_text).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
    }
    let text_scope = issue_creation_host_node_scope(
        store,
        root_id,
        placed_text,
        HostFiberTokenTarget::TextInstance,
    )
    .unwrap();
    let text_token = FakeHostFiberToken(text_scope.token_id().raw());
    let container = *store.root(root_id).unwrap().container_info();
    let text_instance = host
        .create_text_instance(
            HostFiberTokenRef::new(
                &text_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            text,
            &container,
            &(),
        )
        .unwrap();
    let placed_text_state_node = detached_hosts.insert_text(text_scope, text_instance);
    complete_fiber_common(
        store,
        placed_text,
        PropsHandle::from_raw(9053),
        placed_text_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();

    store
        .fiber_arena_mut()
        .set_children(work_inner, &[stable_text, placed_text])
        .unwrap();
    complete_fiber_common(
        store,
        stable_text,
        text_props,
        text_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    complete_fiber_common(
        store,
        work_inner,
        inner_props,
        inner_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(work_outer, &[work_inner])
        .unwrap();
    complete_fiber_common(
        store,
        work_outer,
        outer_props,
        outer_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_outer])
        .unwrap();
    complete_host_root(store, host_root).unwrap();

    (work_outer, work_inner, stable_text, placed_text)
}

fn attach_detached_root_element_with_placed_text_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    text: &str,
) -> (FiberId, FiberId) {
    let (component, text_fiber) = attach_detached_root_element_with_text_for_commit(
        store,
        host,
        detached_hosts,
        root_id,
        host_root,
        text,
    );
    store
        .fiber_arena_mut()
        .get_mut(text_fiber)
        .unwrap()
        .merge_flags(FiberFlags::PLACEMENT);
    let component_state_node = store.fiber_arena().get(component).unwrap().state_node();
    complete_fiber_common(
        store,
        component,
        PropsHandle::from_raw(9010),
        component_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    complete_host_root(store, host_root).unwrap();
    (component, text_fiber)
}

fn create_detached_host_component_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    mode_source: FiberId,
    ty: &'static str,
    props: PropsHandle,
    flags: FiberFlags,
) -> FiberId {
    let mode = store.fiber_arena().get(mode_source).unwrap().mode();
    let fiber = store
        .fiber_arena_mut()
        .create_fiber(FiberTag::HostComponent, None, props, mode);
    store
        .fiber_arena_mut()
        .get_mut(fiber)
        .unwrap()
        .set_flags(flags);

    let scope =
        issue_creation_host_node_scope(store, root_id, fiber, HostFiberTokenTarget::Instance)
            .unwrap();
    let token = FakeHostFiberToken(scope.token_id().raw());
    let container = *store.root(root_id).unwrap().container_info();
    let mut instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &ty,
            &(),
            &container,
            &(),
        )
        .unwrap();
    host.finalize_initial_children(&mut instance, &ty, &(), &container, &())
        .unwrap();
    let state_node = detached_hosts.insert_instance(scope, instance);
    complete_fiber_common(
        store,
        fiber,
        props,
        state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    fiber
}

fn place_detached_host_component_under_existing_host_parent_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
    current_parent: FiberId,
    props: PropsHandle,
) -> (FiberId, FiberId) {
    let parent_node = store.fiber_arena().get(current_parent).unwrap();
    let parent_props = parent_node.memoized_props();
    let parent_state_node = parent_node.state_node();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_lanes(Lanes::NO);
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
    }

    let child = create_detached_host_component_for_commit(
        store,
        host,
        detached_hosts,
        root_id,
        work_parent,
        "span",
        props,
        FiberFlags::PLACEMENT,
    );
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[child])
        .unwrap();
    complete_fiber_common(
        store,
        work_parent,
        parent_props,
        parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[work_parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();

    (work_parent, child)
}

fn attach_detached_root_host_component_with_child_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
) -> (FiberId, FiberId) {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let child_props = PropsHandle::from_raw(9_083);
    let child = create_detached_host_component_for_commit(
        store,
        host,
        detached_hosts,
        root_id,
        host_root,
        "span",
        child_props,
        FiberFlags::NO,
    );

    let parent_props = PropsHandle::from_raw(9_082);
    let parent =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, parent_props, mode);
    let scope =
        issue_creation_host_node_scope(store, root_id, parent, HostFiberTokenTarget::Instance)
            .unwrap();
    let token = FakeHostFiberToken(scope.token_id().raw());
    let container = *store.root(root_id).unwrap().container_info();
    let mut instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &"section",
            &(),
            &container,
            &(),
        )
        .unwrap();
    detached_hosts
        .append_initial_child(
            store.host_tokens(),
            host,
            &mut instance,
            root_id,
            store.fiber_arena().get(child).unwrap(),
        )
        .unwrap();
    host.finalize_initial_children(&mut instance, &"section", &(), &container, &())
        .unwrap();
    let parent_state_node = detached_hosts.insert_instance(scope, instance);
    store
        .fiber_arena_mut()
        .set_children(parent, &[child])
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(parent).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
    }
    complete_fiber_common(
        store,
        parent,
        parent_props,
        parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();

    (parent, child)
}

fn attach_detached_root_host_component_with_two_children_for_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    detached_hosts: &mut DetachedHostRecords,
    root_id: FiberRootId,
    host_root: FiberId,
) -> (FiberId, FiberId, FiberId) {
    let mode = store.fiber_arena().get(host_root).unwrap().mode();
    let order_sibling_props = PropsHandle::from_raw(9_085);
    let order_sibling = create_detached_host_component_for_commit(
        store,
        host,
        detached_hosts,
        root_id,
        host_root,
        "strong",
        order_sibling_props,
        FiberFlags::NO,
    );
    let child_props = PropsHandle::from_raw(9_086);
    let child = create_detached_host_component_for_commit(
        store,
        host,
        detached_hosts,
        root_id,
        host_root,
        "span",
        child_props,
        FiberFlags::NO,
    );

    let parent_props = PropsHandle::from_raw(9_087);
    let parent =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, parent_props, mode);
    let scope =
        issue_creation_host_node_scope(store, root_id, parent, HostFiberTokenTarget::Instance)
            .unwrap();
    let token = FakeHostFiberToken(scope.token_id().raw());
    let container = *store.root(root_id).unwrap().container_info();
    let mut instance = host
        .create_instance(
            HostFiberTokenRef::new(
                &token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            &"section",
            &(),
            &container,
            &(),
        )
        .unwrap();
    for child_fiber in [order_sibling, child] {
        detached_hosts
            .append_initial_child(
                store.host_tokens(),
                host,
                &mut instance,
                root_id,
                store.fiber_arena().get(child_fiber).unwrap(),
            )
            .unwrap();
    }
    host.finalize_initial_children(&mut instance, &"section", &(), &container, &())
        .unwrap();
    let parent_state_node = detached_hosts.insert_instance(scope, instance);
    store
        .fiber_arena_mut()
        .set_children(parent, &[order_sibling, child])
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(parent).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
    }
    complete_fiber_common(
        store,
        parent,
        parent_props,
        parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[parent])
        .unwrap();
    complete_host_root(store, host_root).unwrap();

    (parent, order_sibling, child)
}

struct ManagedChildHostWorkHandoffFixture {
    store: FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    host: RecordingHost,
    detached_hosts: DetachedHostRecords,
    render: HostRootRenderPhaseRecord,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    current_parent: FiberId,
    work_parent: FiberId,
    child: FiberId,
    parent_state_node: StateNodeHandle,
    child_state_node: StateNodeHandle,
    previous_current: FiberId,
    operations_before_apply: Vec<&'static str>,
    token_count_before_apply: usize,
}

struct ManagedChildSiblingOrderHostWorkHandoffFixture {
    store: FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    host: RecordingHost,
    detached_hosts: DetachedHostRecords,
    render: HostRootRenderPhaseRecord,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    current_parent: FiberId,
    work_parent: FiberId,
    child: FiberId,
    order_sibling: FiberId,
    order_sibling_current: FiberId,
    parent_state_node: StateNodeHandle,
    child_state_node: StateNodeHandle,
    order_sibling_state_node: StateNodeHandle,
    previous_current: FiberId,
    deletion_list: Option<DeletionListId>,
    operations_before_apply: Vec<&'static str>,
    token_count_before_apply: usize,
}

fn managed_child_placement_host_work_handoff_fixture(
    handoff_order: usize,
) -> ManagedChildHostWorkHandoffFixture {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let parent_element = source.insert_host_element_with_text("section", "ignored");
    let parent = element_from_root(&source, parent_element);
    let create_render = render_test_root(&mut store, root_id, parent_element);
    let current_parent = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        parent,
        FiberFlags::PLACEMENT,
    );
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let next_element = source.insert_host_element_with_text("section", "next");
    let render = render_test_root(&mut store, root_id, next_element);
    let (work_parent, child) = place_detached_host_component_under_existing_host_parent_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        render.finished_work(),
        current_parent,
        PropsHandle::from_raw(9_081),
    );
    let complete_work = host_component_managed_child_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_parent,
        child,
        HostComponentManagedChildMutationKindForCanary::Placement,
    )
    .unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, handoff_order)
            .unwrap();
    let parent_state_node = store.fiber_arena().get(work_parent).unwrap().state_node();
    let child_state_node = store.fiber_arena().get(child).unwrap().state_node();
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    ManagedChildHostWorkHandoffFixture {
        store,
        root_id,
        host,
        detached_hosts,
        render,
        pending,
        complete_work,
        current_parent,
        work_parent,
        child,
        parent_state_node,
        child_state_node,
        previous_current,
        operations_before_apply,
        token_count_before_apply,
    }
}

fn managed_child_placement_sibling_order_host_work_handoff_fixture(
    handoff_order: usize,
) -> ManagedChildSiblingOrderHostWorkHandoffFixture {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(288));
    let (current_parent, order_sibling_current) =
        attach_detached_root_host_component_with_child_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
        );
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(289));
    let parent_node = store.fiber_arena().get(current_parent).unwrap();
    let parent_props = parent_node.memoized_props();
    let parent_state_node = parent_node.state_node();
    let sibling_node = store.fiber_arena().get(order_sibling_current).unwrap();
    let order_sibling_props = sibling_node.memoized_props();
    let order_sibling_state_node = sibling_node.state_node();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_lanes(Lanes::NO);
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
    }
    let child = create_detached_host_component_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        work_parent,
        "strong",
        PropsHandle::from_raw(9_084),
        FiberFlags::PLACEMENT,
    );
    let child_state_node = store.fiber_arena().get(child).unwrap().state_node();
    let order_sibling = store
        .fiber_arena_mut()
        .create_work_in_progress(order_sibling_current, order_sibling_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
        node.set_lanes(Lanes::NO);
        node.set_state_node(order_sibling_state_node);
        node.set_memoized_props(order_sibling_props);
    }
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[child, order_sibling])
        .unwrap();
    complete_fiber_common(
        &mut store,
        order_sibling,
        order_sibling_props,
        order_sibling_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    complete_fiber_common(
        &mut store,
        work_parent,
        parent_props,
        parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    complete_host_root(&mut store, render.finished_work()).unwrap();

    let complete_work = host_component_managed_child_sibling_order_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_parent,
        child,
        order_sibling,
        HostComponentManagedChildMutationKindForCanary::Placement,
    )
    .unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, handoff_order)
            .unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    ManagedChildSiblingOrderHostWorkHandoffFixture {
        store,
        root_id,
        host,
        detached_hosts,
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
        operations_before_apply,
        token_count_before_apply,
    }
}

fn managed_child_delete_sibling_order_host_work_handoff_fixture(
    handoff_order: usize,
) -> ManagedChildSiblingOrderHostWorkHandoffFixture {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(290));
    let (current_parent, order_sibling_current, child) =
        attach_detached_root_host_component_with_two_children_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
        );
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(291));
    let parent_node = store.fiber_arena().get(current_parent).unwrap();
    let parent_props = parent_node.memoized_props();
    let parent_state_node = parent_node.state_node();
    let order_sibling_node = store.fiber_arena().get(order_sibling_current).unwrap();
    let order_sibling_props = order_sibling_node.memoized_props();
    let order_sibling_state_node = order_sibling_node.state_node();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(current_parent, parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_lanes(Lanes::NO);
        node.set_state_node(parent_state_node);
        node.set_memoized_props(parent_props);
    }
    let order_sibling = store
        .fiber_arena_mut()
        .create_work_in_progress(order_sibling_current, order_sibling_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
        node.set_lanes(Lanes::NO);
        node.set_state_node(order_sibling_state_node);
        node.set_memoized_props(order_sibling_props);
    }
    store
        .fiber_arena_mut()
        .set_children(work_parent, &[order_sibling])
        .unwrap();
    let deletion_list = store
        .fiber_arena_mut()
        .mark_child_for_deletion(work_parent, child)
        .unwrap();
    complete_fiber_common(
        &mut store,
        order_sibling,
        order_sibling_props,
        order_sibling_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    complete_fiber_common(
        &mut store,
        work_parent,
        parent_props,
        parent_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
    .unwrap();
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[work_parent])
        .unwrap();
    complete_host_root(&mut store, render.finished_work()).unwrap();

    let complete_work = host_component_managed_child_sibling_order_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_parent,
        child,
        order_sibling,
        HostComponentManagedChildMutationKindForCanary::DeleteDetach,
    )
    .unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, handoff_order)
            .unwrap();
    let child_state_node = store.fiber_arena().get(child).unwrap().state_node();
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    ManagedChildSiblingOrderHostWorkHandoffFixture {
        store,
        root_id,
        host,
        detached_hosts,
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
        operations_before_apply,
        token_count_before_apply,
    }
}

fn managed_child_delete_host_work_handoff_fixture(
    handoff_order: usize,
) -> ManagedChildHostWorkHandoffFixture {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(188));
    let (current_parent, child) = attach_detached_root_host_component_with_child_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
    );
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(189));
    let work_parent = delete_host_component_under_host_parent_for_commit(
        &mut store,
        render.finished_work(),
        current_parent,
        child,
    );
    let complete_work = host_component_managed_child_complete_work_record_for_canary(
        store.fiber_arena(),
        root_id,
        work_parent,
        child,
        HostComponentManagedChildMutationKindForCanary::DeleteDetach,
    )
    .unwrap();
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, render, handoff_order)
            .unwrap();
    let parent_state_node = store.fiber_arena().get(work_parent).unwrap().state_node();
    let child_state_node = store.fiber_arena().get(child).unwrap().state_node();
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    ManagedChildHostWorkHandoffFixture {
        store,
        root_id,
        host,
        detached_hosts,
        render,
        pending,
        complete_work,
        current_parent,
        work_parent,
        child,
        parent_state_node,
        child_state_node,
        previous_current,
        operations_before_apply,
        token_count_before_apply,
    }
}

#[test]
fn host_work_mounts_one_host_element_with_text_under_host_root_wip() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("span", "hello");
    let current = store.root(root_id).unwrap().current();
    let render = render_test_root(&mut store, root_id, element);
    let work_in_progress = render.work_in_progress();

    let result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();

    assert_eq!(result.root, root_id);
    assert_eq!(result.work_in_progress, work_in_progress);
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.fiber_arena().get(current).unwrap().child(), None);

    let root = store.fiber_arena().get(work_in_progress).unwrap();
    let component = root.child().unwrap();
    assert_eq!(result.root_child, Some(component));
    assert_eq!(root.child_lanes(), Lanes::NO);
    assert!(root.subtree_flags().contains_all(FiberFlags::PLACEMENT));

    let component_node = store.fiber_arena().get(component).unwrap();
    let text = component_node.child().unwrap();
    assert_eq!(component_node.tag(), FiberTag::HostComponent);
    assert!(component_node.flags().contains_all(FiberFlags::PLACEMENT));
    assert_eq!(component_node.child_lanes(), Lanes::NO);
    assert_eq!(component_node.sibling(), None);
    assert!(component_node.state_node().is_some());

    let text_node = store.fiber_arena().get(text).unwrap();
    assert_eq!(text_node.tag(), FiberTag::HostText);
    assert_eq!(text_node.return_fiber(), Some(component));
    assert_eq!(text_node.sibling(), None);
    assert!(text_node.state_node().is_some());

    let instance = result
        .detached_hosts()
        .instance(component_node.state_node())
        .unwrap();
    let text_instance = result
        .detached_hosts()
        .text(text_node.state_node())
        .unwrap();
    assert_eq!(instance.ty(), "span");
    assert_eq!(text_instance.text(), "hello");
    assert_eq!(text_instance.token(), FakeHostFiberToken(1));
    assert_eq!(instance.token(), FakeHostFiberToken(2));
    assert_eq!(
        instance.children(),
        &[FakeHostChild::Text(text_instance.id())]
    );
    assert_eq!(result.detached_hosts().instance_count(), 1);
    assert_eq!(result.detached_hosts().text_count(), 1);
    assert_eq!(store.host_tokens().len(), 2);
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
fn host_work_detached_records_validate_through_host_node_store_scopes() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("article", "stored");
    let render = render_test_root(&mut store, root_id, element);

    let result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();

    let component = result.root_child.unwrap();
    let component_node = store.fiber_arena().get(component).unwrap();
    let text = component_node.child().unwrap();
    let text_node = store.fiber_arena().get(text).unwrap();
    let instance_handle = component_node.state_node();
    let text_handle = text_node.state_node();
    assert_ne!(instance_handle, text_handle);

    let instance_metadata = result
        .detached_hosts()
        .instance_metadata(instance_handle)
        .unwrap();
    assert_eq!(instance_metadata.handle(), instance_handle);
    assert_eq!(instance_metadata.root_id(), root_id);
    assert_eq!(instance_metadata.fiber_id(), component);
    assert_eq!(instance_metadata.phase(), HostFiberTokenPhase::Creation);
    assert_eq!(instance_metadata.target(), HostFiberTokenTarget::Instance);
    assert!(instance_metadata.is_active());
    store
        .host_tokens()
        .validate(
            instance_metadata.token_id(),
            root_id,
            component,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::Instance,
        )
        .unwrap();

    let text_metadata = result.detached_hosts().text_metadata(text_handle).unwrap();
    assert_eq!(text_metadata.handle(), text_handle);
    assert_eq!(text_metadata.root_id(), root_id);
    assert_eq!(text_metadata.fiber_id(), text);
    assert_eq!(text_metadata.phase(), HostFiberTokenPhase::Creation);
    assert_eq!(text_metadata.target(), HostFiberTokenTarget::TextInstance);
    assert!(text_metadata.is_active());
    store
        .host_tokens()
        .validate(
            text_metadata.token_id(),
            root_id,
            text,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        )
        .unwrap();

    let wrong_fiber_scope = HostNodeScope::new(
        root_id,
        text,
        instance_metadata.token_id(),
        HostFiberTokenPhase::Creation,
    );
    assert_eq!(
        result
            .detached_hosts()
            .nodes
            .instance(instance_handle, wrong_fiber_scope)
            .unwrap_err()
            .violation(),
        HostNodeViolation::WrongFiber
    );

    let instance_scope = HostNodeScope::new(
        root_id,
        component,
        instance_metadata.token_id(),
        HostFiberTokenPhase::Creation,
    );
    assert_eq!(
        result
            .detached_hosts()
            .nodes
            .text(instance_handle, instance_scope)
            .unwrap_err()
            .violation(),
        HostNodeViolation::WrongTarget
    );
}

#[test]
fn host_work_mounts_multiple_host_root_siblings_under_host_root_wip() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let first_element = source.insert_text("first sibling");
    let second_element = source.insert_host_element_with_text("span", "second sibling");
    let current = store.root(root_id).unwrap().current();
    let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_700));
    let work_in_progress = render.work_in_progress();

    let result = mount_test_host_sibling_work(
        &mut store,
        &mut host,
        render,
        &source,
        &[first_element, second_element],
    )
    .unwrap();

    assert_eq!(result.root, root_id);
    assert_eq!(result.work_in_progress, work_in_progress);
    assert_eq!(result.root_child_count(), 2);
    assert_eq!(result.completed_child_count(), 2);
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.fiber_arena().get(current).unwrap().child(), None);

    let root = store.fiber_arena().get(work_in_progress).unwrap();
    let first = root.child().unwrap();
    let first_node = store.fiber_arena().get(first).unwrap();
    let second = first_node.sibling().unwrap();
    let second_node = store.fiber_arena().get(second).unwrap();
    let nested_text = second_node.child().unwrap();
    assert_eq!(result.root_child, Some(first));
    assert_eq!(result.completed_child, Some(first));
    assert_eq!(result.root_children(), &[first, second]);
    assert_eq!(result.completed_children(), &[first, second]);
    assert_eq!(root.child_lanes(), Lanes::NO);
    assert!(root.subtree_flags().contains_all(FiberFlags::PLACEMENT));

    assert_eq!(first_node.tag(), FiberTag::HostText);
    assert_eq!(first_node.return_fiber(), Some(work_in_progress));
    assert_eq!(first_node.sibling(), Some(second));
    assert!(first_node.flags().contains_all(FiberFlags::PLACEMENT));
    assert!(first_node.state_node().is_some());

    assert_eq!(second_node.tag(), FiberTag::HostComponent);
    assert_eq!(second_node.return_fiber(), Some(work_in_progress));
    assert_eq!(second_node.sibling(), None);
    assert!(second_node.flags().contains_all(FiberFlags::PLACEMENT));
    assert!(second_node.state_node().is_some());

    let nested_text_node = store.fiber_arena().get(nested_text).unwrap();
    assert_eq!(nested_text_node.tag(), FiberTag::HostText);
    assert_eq!(nested_text_node.return_fiber(), Some(second));
    assert_eq!(nested_text_node.sibling(), None);
    assert!(nested_text_node.state_node().is_some());

    let first_text_instance = result
        .detached_hosts()
        .text(first_node.state_node())
        .unwrap();
    let second_instance = result
        .detached_hosts()
        .instance(second_node.state_node())
        .unwrap();
    let nested_text_instance = result
        .detached_hosts()
        .text(nested_text_node.state_node())
        .unwrap();
    assert_eq!(first_text_instance.text(), "first sibling");
    assert_eq!(second_instance.ty(), "span");
    assert_eq!(nested_text_instance.text(), "second sibling");
    assert_eq!(
        second_instance.children(),
        &[FakeHostChild::Text(nested_text_instance.id())]
    );
    assert_eq!(result.detached_hosts().instance_count(), 1);
    assert_eq!(result.detached_hosts().text_count(), 2);
    assert_eq!(store.host_tokens().len(), 3);
    store.fiber_arena().validate_topology().unwrap();

    assert_eq!(
        host.operations(),
        vec![
            "root_host_context",
            "create_text_instance",
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
fn host_work_multiple_sibling_handoff_rejects_non_multiple_or_existing_children() {
    let (mut single_store, single_root_id) = root_store();
    let mut single_host = RecordingHost::default();
    let mut single_source = TestHostTree::new();
    let only_child = single_source.insert_text("only");
    let single_render = render_test_root(
        &mut single_store,
        single_root_id,
        RootElementHandle::from_raw(7_710),
    );

    let single_error = mount_test_host_sibling_work(
        &mut single_store,
        &mut single_host,
        single_render,
        &single_source,
        &[only_child],
    )
    .unwrap_err();

    assert_eq!(
        single_error,
        HostWorkError::ExpectedMultipleRootChildren { count: 1 }
    );
    assert_eq!(single_host.operations(), Vec::<&'static str>::new());
    assert_eq!(
        single_store
            .fiber_arena()
            .get(single_render.work_in_progress())
            .unwrap()
            .child(),
        None
    );

    let (mut existing_store, existing_root_id) = root_store();
    let mut existing_host = RecordingHost::default();
    let mut existing_source = TestHostTree::new();
    let first = existing_source.insert_text("first");
    let second = existing_source.insert_text("second");
    let existing_render = render_test_root(
        &mut existing_store,
        existing_root_id,
        RootElementHandle::from_raw(7_720),
    );
    let existing_mode = existing_store
        .fiber_arena()
        .get(existing_render.work_in_progress())
        .unwrap()
        .mode();
    let existing_child = existing_store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(7_721),
        existing_mode,
    );
    existing_store
        .fiber_arena_mut()
        .set_children(existing_render.work_in_progress(), &[existing_child])
        .unwrap();

    let existing_error = mount_test_host_sibling_work(
        &mut existing_store,
        &mut existing_host,
        existing_render,
        &existing_source,
        &[first, second],
    )
    .unwrap_err();

    assert_eq!(
        existing_error,
        HostWorkError::UnexpectedExistingChild {
            parent: existing_render.work_in_progress(),
            child: existing_child,
        }
    );
    assert_eq!(existing_host.operations(), Vec::<&'static str>::new());
    assert_eq!(
        existing_store
            .fiber_arena()
            .get(existing_render.work_in_progress())
            .unwrap()
            .child(),
        Some(existing_child)
    );
}

#[test]
fn host_work_host_text_update_records_changed_diff_through_host_node_store() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("span", "before");
    let render = render_test_root(&mut store, root_id, element);
    let mut result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();
    let component = result.root_child.unwrap();
    let current_text = store.fiber_arena().get(component).unwrap().child().unwrap();
    let current_text_node = store.fiber_arena().get(current_text).unwrap();
    let state_node = current_text_node.state_node();
    let update_element = source.insert_text("after");
    let update_text = text_from_root(&source, update_element);
    let operations_before_update = host.operations();

    let diff = update_test_host_text_work(
        &mut store,
        root_id,
        current_text,
        update_text,
        Lanes::DEFAULT,
        result.detached_hosts_mut(),
    )
    .unwrap();

    assert_eq!(diff.current(), current_text);
    assert_ne!(diff.work_in_progress(), current_text);
    assert_eq!(diff.state_node(), state_node);
    assert_eq!(diff.old_text(), "before");
    assert_eq!(diff.new_text(), "after");
    assert!(diff.changed());
    assert_eq!(diff.metadata().handle(), state_node);
    assert_eq!(diff.metadata().root_id(), root_id);
    assert_eq!(diff.metadata().fiber_id(), current_text);
    assert_eq!(diff.metadata().phase(), HostFiberTokenPhase::Creation);
    assert_eq!(diff.metadata().target(), HostFiberTokenTarget::TextInstance);

    let work_text = store.fiber_arena().get(diff.work_in_progress()).unwrap();
    assert_eq!(work_text.alternate(), Some(current_text));
    assert_eq!(work_text.state_node(), state_node);
    assert_eq!(work_text.memoized_props(), update_text.props());
    assert!(work_text.flags().contains_all(FiberFlags::UPDATE));
    assert!(!work_text.flags().contains_all(FiberFlags::PLACEMENT));
    assert_eq!(
        result.detached_hosts().text(state_node).unwrap().text(),
        "before"
    );
    assert_eq!(result.detached_hosts().text_count(), 1);
    assert_eq!(store.host_tokens().len(), 2);
    assert_eq!(host.operations(), operations_before_update);

    let wip_scope = HostNodeScope::new(
        root_id,
        diff.work_in_progress(),
        diff.metadata().token_id(),
        HostFiberTokenPhase::Creation,
    );
    assert_eq!(
        result
            .detached_hosts()
            .nodes
            .text(state_node, wip_scope)
            .unwrap_err()
            .violation(),
        HostNodeViolation::WrongFiber
    );
    store.fiber_arena().validate_topology().unwrap();
}

#[test]
fn host_work_host_text_update_records_unchanged_diff_without_update_flag() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("span", "stable");
    let render = render_test_root(&mut store, root_id, element);
    let mut result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();
    let component = result.root_child.unwrap();
    let current_text = store.fiber_arena().get(component).unwrap().child().unwrap();
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let update_element = source.insert_text("stable");
    let update_text = text_from_root(&source, update_element);
    let operations_before_update = host.operations();

    let diff = update_test_host_text_work(
        &mut store,
        root_id,
        current_text,
        update_text,
        Lanes::DEFAULT,
        result.detached_hosts_mut(),
    )
    .unwrap();

    assert_eq!(diff.current(), current_text);
    assert_eq!(diff.state_node(), state_node);
    assert_eq!(diff.old_text(), "stable");
    assert_eq!(diff.new_text(), "stable");
    assert!(!diff.changed());
    assert_eq!(diff.metadata().fiber_id(), current_text);

    let work_text = store.fiber_arena().get(diff.work_in_progress()).unwrap();
    assert_eq!(work_text.state_node(), state_node);
    assert_eq!(work_text.memoized_props(), update_text.props());
    assert_eq!(work_text.flags(), FiberFlags::NO);
    assert_eq!(
        result.detached_hosts().text(state_node).unwrap().text(),
        "stable"
    );
    assert_eq!(result.detached_hosts().text_count(), 1);
    assert_eq!(store.host_tokens().len(), 2);
    assert_eq!(host.operations(), operations_before_update);
    store.fiber_arena().validate_topology().unwrap();
}

#[test]
fn host_work_mounts_text_only_child_under_host_root_wip() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let element = source.insert_text("root text");
    let render = render_test_root(&mut store, root_id, element);

    let result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();

    let root = store.fiber_arena().get(render.work_in_progress()).unwrap();
    let text = root.child().unwrap();
    let text_node = store.fiber_arena().get(text).unwrap();
    assert_eq!(text_node.tag(), FiberTag::HostText);
    assert_eq!(text_node.return_fiber(), Some(render.work_in_progress()));
    assert!(text_node.flags().contains_all(FiberFlags::PLACEMENT));
    assert_eq!(root.child_lanes(), Lanes::NO);
    assert!(root.subtree_flags().contains_all(FiberFlags::PLACEMENT));

    let text_instance = result
        .detached_hosts()
        .text(text_node.state_node())
        .unwrap();
    assert_eq!(text_instance.text(), "root text");
    assert_eq!(text_instance.token(), FakeHostFiberToken(1));
    assert_eq!(result.detached_hosts().instance_count(), 0);
    assert_eq!(result.detached_hosts().text_count(), 1);
    assert_eq!(store.host_tokens().len(), 1);
    assert_eq!(
        host.operations(),
        vec!["root_host_context", "create_text_instance"]
    );
}

#[test]
fn host_work_applies_root_text_placement_record_to_test_container_only_after_commit() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(71));
    let child = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        render.finished_work(),
        "placed",
        FiberFlags::PLACEMENT,
    );
    let operations_before_commit = host.operations();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let operations_before_apply = host.operations();
    let apply =
        apply_test_host_root_commit_mutations(&mut store, &mut host, &commit, &mut detached_hosts)
            .unwrap();

    assert_eq!(operations_before_apply, operations_before_commit);
    assert_eq!(apply.root(), root_id);
    assert_eq!(apply.finished_work(), commit.finished_work());
    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().fiber(), child);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::AppendChildToContainer
        )
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert!(host.operations().ends_with(&["append_child_to_container"]));
}

#[test]
fn host_work_applies_root_text_placement_before_recorded_stable_sibling() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(72));
    let current_sibling = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "stable sibling",
        FiberFlags::PLACEMENT,
    );
    let sibling_state_node = store
        .fiber_arena()
        .get(current_sibling)
        .unwrap()
        .state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(73), None).unwrap();
    let insert_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let placed = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        insert_render.finished_work(),
        "inserted before",
        FiberFlags::PLACEMENT,
    );
    let stable_sibling = stable_root_text_work_in_progress_for_commit(
        &mut store,
        current_sibling,
        PropsHandle::from_raw(9003),
    );
    store
        .fiber_arena_mut()
        .set_children(insert_render.finished_work(), &[placed, stable_sibling])
        .unwrap();
    complete_host_root(&mut store, insert_render.finished_work()).unwrap();

    let insert_commit = commit_finished_host_root(&mut store, insert_render).unwrap();
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &insert_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().fiber(), placed);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
    );
    let sibling = apply.records()[0].mutation().placement_sibling().unwrap();
    assert_eq!(
        sibling.status(),
        HostRootPlacementSiblingStatus::InsertBefore
    );
    assert_eq!(sibling.sibling(), Some(stable_sibling));
    assert_eq!(sibling.sibling_tag(), Some(FiberTag::HostText));
    assert_eq!(sibling.sibling_state_node(), sibling_state_node);
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::InsertInContainerBefore
        )
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    let mut expected_operations = operations_before_apply;
    expected_operations.push("insert_in_container_before");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn host_work_applies_two_root_host_sibling_placements_in_commit_order() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let component_element = source.insert_host_element_with_text("article", "ignored");
    let component_source = element_from_root(&source, component_element);
    let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(75));
    let component = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        render.finished_work(),
        component_source,
        FiberFlags::PLACEMENT,
    );
    let component_state_node = store.fiber_arena().get(component).unwrap().state_node();
    let text = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        render.finished_work(),
        "second root child",
        FiberFlags::PLACEMENT,
    );
    let text_state_node = store.fiber_arena().get(text).unwrap().state_node();
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[component, text])
        .unwrap();
    complete_host_root(&mut store, render.finished_work()).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let diagnostics = commit.host_root_placement_apply_diagnostics_for_canary();
    let operations_before_apply = host.operations();
    let apply =
        apply_test_host_root_commit_mutations(&mut store, &mut host, &commit, &mut detached_hosts)
            .unwrap();

    assert_eq!(diagnostics.len(), 2);
    assert_eq!(diagnostics[0].fiber(), component);
    assert_eq!(diagnostics[0].tag_name(), "HostComponent");
    assert_eq!(diagnostics[0].state_node(), component_state_node);
    assert_eq!(diagnostics[0].apply_kind(), "append-placement-to-container");
    assert_eq!(diagnostics[0].sibling_status(), "append");
    assert_eq!(diagnostics[0].sibling(), None);
    assert_eq!(diagnostics[0].skipped_pending_sibling_count(), 1);
    assert!(!diagnostics[0].can_insert_before());
    assert_eq!(diagnostics[1].fiber(), text);
    assert_eq!(diagnostics[1].tag_name(), "HostText");
    assert_eq!(diagnostics[1].state_node(), text_state_node);
    assert_eq!(diagnostics[1].apply_kind(), "append-placement-to-container");
    assert_eq!(diagnostics[1].sibling_status(), "append");
    assert_eq!(diagnostics[1].sibling(), None);
    assert_eq!(diagnostics[1].skipped_pending_sibling_count(), 0);
    assert!(!diagnostics[1].can_insert_before());

    assert_eq!(apply.records().len(), 2);
    assert_eq!(apply.records()[0].mutation().fiber(), component);
    assert_eq!(
        apply.records()[0].mutation().state_node(),
        component_state_node
    );
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
    );
    assert_eq!(
        apply.records()[0]
            .mutation()
            .placement_sibling()
            .unwrap()
            .skipped_pending_sibling_count(),
        1
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::AppendChildToContainer
        )
    );
    assert_eq!(apply.records()[1].mutation().fiber(), text);
    assert_eq!(apply.records()[1].mutation().state_node(), text_state_node);
    assert_eq!(
        apply.records()[1].mutation().kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
    );
    assert_eq!(
        apply.records()[1].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::AppendChildToContainer
        )
    );
    assert_eq!(apply.applied_host_call_count(), 2);
    let mut expected_operations = operations_before_apply;
    expected_operations.push("append_child_to_container");
    expected_operations.push("append_child_to_container");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn host_work_inserts_two_root_host_sibling_placements_before_stable_sibling() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let component_element = source.insert_host_element_with_text("article", "ignored");
    let component_source = element_from_root(&source, component_element);
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(76));
    let current_stable = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "stable sibling",
        FiberFlags::PLACEMENT,
    );
    let stable_state_node = store
        .fiber_arena()
        .get(current_stable)
        .unwrap()
        .state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(77), None).unwrap();
    let insert_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let component = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        insert_render.finished_work(),
        component_source,
        FiberFlags::PLACEMENT,
    );
    let component_state_node = store.fiber_arena().get(component).unwrap().state_node();
    let text = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        insert_render.finished_work(),
        "inserted text",
        FiberFlags::PLACEMENT,
    );
    let text_state_node = store.fiber_arena().get(text).unwrap().state_node();
    let stable_work = stable_root_text_work_in_progress_for_commit(
        &mut store,
        current_stable,
        PropsHandle::from_raw(9013),
    );
    store
        .fiber_arena_mut()
        .set_children(
            insert_render.finished_work(),
            &[component, text, stable_work],
        )
        .unwrap();
    complete_host_root(&mut store, insert_render.finished_work()).unwrap();

    let insert_commit = commit_finished_host_root(&mut store, insert_render).unwrap();
    let diagnostics = insert_commit.host_root_placement_apply_diagnostics_for_canary();
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &insert_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(diagnostics.len(), 2);
    assert_eq!(diagnostics[0].fiber(), component);
    assert_eq!(diagnostics[0].tag_name(), "HostComponent");
    assert_eq!(
        diagnostics[0].apply_kind(),
        "insert-placement-in-container-before"
    );
    assert_eq!(diagnostics[0].sibling_status(), "insert-before");
    assert_eq!(diagnostics[0].sibling(), Some(stable_work));
    assert_eq!(diagnostics[0].sibling_tag_name(), Some("HostText"));
    assert_eq!(diagnostics[0].sibling_state_node(), stable_state_node);
    assert_eq!(diagnostics[0].skipped_pending_sibling_count(), 1);
    assert!(diagnostics[0].can_insert_before());
    assert_eq!(diagnostics[1].fiber(), text);
    assert_eq!(diagnostics[1].tag_name(), "HostText");
    assert_eq!(
        diagnostics[1].apply_kind(),
        "insert-placement-in-container-before"
    );
    assert_eq!(diagnostics[1].sibling_status(), "insert-before");
    assert_eq!(diagnostics[1].sibling(), Some(stable_work));
    assert_eq!(diagnostics[1].sibling_state_node(), stable_state_node);
    assert_eq!(diagnostics[1].skipped_pending_sibling_count(), 0);
    assert!(diagnostics[1].can_insert_before());

    assert_eq!(apply.records().len(), 2);
    assert_eq!(apply.records()[0].mutation().fiber(), component);
    assert_eq!(
        apply.records()[0].mutation().state_node(),
        component_state_node
    );
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
    );
    assert_eq!(
        apply.records()[0]
            .mutation()
            .placement_sibling()
            .unwrap()
            .skipped_pending_sibling_count(),
        1
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::InsertInContainerBefore
        )
    );
    assert_eq!(apply.records()[1].mutation().fiber(), text);
    assert_eq!(apply.records()[1].mutation().state_node(), text_state_node);
    assert_eq!(
        apply.records()[1].mutation().kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
    );
    assert_eq!(
        apply.records()[1].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::InsertInContainerBefore
        )
    );
    assert_eq!(apply.applied_host_call_count(), 2);
    let mut expected_operations = operations_before_apply;
    expected_operations.push("insert_in_container_before");
    expected_operations.push("insert_in_container_before");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn host_work_leaves_unproven_root_text_insertion_recorded_only() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(74));
    let placed = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        render.finished_work(),
        "blocked insertion",
        FiberFlags::PLACEMENT,
    );
    let mode = store
        .fiber_arena()
        .get(render.finished_work())
        .unwrap()
        .mode();
    let unproven_sibling = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9004),
        mode,
    );
    store
        .fiber_arena_mut()
        .get_mut(unproven_sibling)
        .unwrap()
        .set_memoized_props(PropsHandle::from_raw(9004));
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[placed, unproven_sibling])
        .unwrap();
    complete_host_root(&mut store, render.finished_work()).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let operations_before_apply = host.operations();
    let apply =
        apply_test_host_root_commit_mutations(&mut store, &mut host, &commit, &mut detached_hosts)
            .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().fiber(), placed);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::RecordPlacementInsertionBlocked
    );
    let sibling = apply.records()[0].mutation().placement_sibling().unwrap();
    assert_eq!(
        sibling.status(),
        HostRootPlacementSiblingStatus::BlockedMissingStateNode
    );
    assert_eq!(sibling.sibling(), Some(unproven_sibling));
    assert_eq!(sibling.sibling_tag(), Some(FiberTag::HostText));
    assert_eq!(sibling.sibling_state_node(), StateNodeHandle::NONE);
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::RecordedOnly
    );
    assert_eq!(apply.applied_host_call_count(), 0);
    assert_eq!(host.operations(), operations_before_apply);
}

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

struct RootReplacementExecutionFixture {
    store: FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    host: RecordingHost,
    update_render: HostRootRenderPhaseRecord,
    handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
    request: TestHostRootChildReplacementExecutionRequestForCanary,
    host_work: HostWorkResult,
    operations_before_execute: Vec<&'static str>,
}

fn root_replacement_text_to_component_execution_fixture() -> RootReplacementExecutionFixture {
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

    let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
    let next_element = source.insert_host_element_with_text("section", "replacement child");
    let update_render = render_test_root(&mut store, root_id, next_element);
    let host_work = replace_test_host_root_child_work_with_detached_hosts_for_canary(
        &mut store,
        &mut host,
        update_render,
        &source,
        detached_hosts,
    )
    .unwrap();
    let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        954_101,
        954_102,
    )
    .unwrap();
    let request =
        test_host_root_child_replacement_execution_request_for_canary(&store, &handoff, 954_103)
            .unwrap();
    let operations_before_execute = host.operations();

    RootReplacementExecutionFixture {
        store,
        root_id,
        host,
        update_render,
        handoff,
        request,
        host_work,
        operations_before_execute,
    }
}

fn root_replacement_component_to_text_execution_fixture()
-> (RootReplacementExecutionFixture, StateNodeHandle) {
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
    let deleted_text = store
        .fiber_arena()
        .get(current_component)
        .unwrap()
        .child()
        .unwrap();
    let deleted_text_state_node = store.fiber_arena().get(deleted_text).unwrap().state_node();
    let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
    let next_element = source.insert_text("new root text");
    let update_render = render_test_root(&mut store, root_id, next_element);
    let host_work = replace_test_host_root_child_work_with_detached_hosts_for_canary(
        &mut store,
        &mut host,
        update_render,
        &source,
        detached_hosts,
    )
    .unwrap();
    let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        954_201,
        954_202,
    )
    .unwrap();
    let request =
        test_host_root_child_replacement_execution_request_for_canary(&store, &handoff, 954_203)
            .unwrap();
    let operations_before_execute = host.operations();

    (
        RootReplacementExecutionFixture {
            store,
            root_id,
            host,
            update_render,
            handoff,
            request,
            host_work,
            operations_before_execute,
        },
        deleted_text_state_node,
    )
}

struct RootReplacementSiblingOrderExecutionFixture {
    store: FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    host: RecordingHost,
    update_render: HostRootRenderPhaseRecord,
    handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
    request: TestHostRootChildReplacementExecutionRequestForCanary,
    host_work: HostWorkResult,
    operations_before_execute: Vec<&'static str>,
    deleted_current: FiberId,
    deleted_state_node: StateNodeHandle,
    stable_work: FiberId,
    stable_current_state_node: StateNodeHandle,
    placement_sibling_state_node: StateNodeHandle,
    replacement_component: FiberId,
    replacement_component_state_node: StateNodeHandle,
}

struct RootReplacementBetweenStableSiblingsExecutionFixture {
    store: FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    host: RecordingHost,
    update_render: HostRootRenderPhaseRecord,
    handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
    request: TestHostRootChildReplacementExecutionRequestForCanary,
    host_work: HostWorkResult,
    operations_before_execute: Vec<&'static str>,
    stable_previous_work: FiberId,
    stable_previous_current: FiberId,
    stable_previous_state_node: StateNodeHandle,
    deleted_current: FiberId,
    deleted_state_node: StateNodeHandle,
    stable_trailing_work: FiberId,
    stable_trailing_state_node: StateNodeHandle,
    replacement_component: FiberId,
    replacement_component_state_node: StateNodeHandle,
}

fn root_replacement_text_to_component_before_stable_sibling_execution_fixture(
    cross_root_sibling_state_node: bool,
) -> RootReplacementSiblingOrderExecutionFixture {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let mut detached_hosts = DetachedHostRecords::default();
    let initial_render =
        render_test_root(&mut store, root_id, RootElementHandle::from_raw(973_001));
    let deleted_current = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        initial_render.finished_work(),
        "replace before stable sibling",
        FiberFlags::PLACEMENT,
    );
    let deleted_state_node = store
        .fiber_arena()
        .get(deleted_current)
        .unwrap()
        .state_node();
    let stable_current = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        initial_render.finished_work(),
        "stable sibling",
        FiberFlags::PLACEMENT,
    );
    let stable_current_state_node = store
        .fiber_arena()
        .get(stable_current)
        .unwrap()
        .state_node();
    store
        .fiber_arena_mut()
        .set_children(
            initial_render.finished_work(),
            &[deleted_current, stable_current],
        )
        .unwrap();
    complete_host_root(&mut store, initial_render.finished_work()).unwrap();
    let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &initial_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let next_element = source.insert_host_element_with_text("section", "replacement child");
    let update_render = render_test_root(&mut store, root_id, next_element);
    let mut host_work =
        replace_test_host_root_child_before_stable_sibling_work_with_detached_hosts_for_canary(
            &mut store,
            &mut host,
            update_render,
            &source,
            deleted_current,
            stable_current,
            detached_hosts,
        )
        .unwrap();
    let replacement_component = host_work.root_child().unwrap();
    let replacement_component_state_node = store
        .fiber_arena()
        .get(replacement_component)
        .unwrap()
        .state_node();
    let stable_work = store
        .fiber_arena()
        .get(replacement_component)
        .unwrap()
        .sibling()
        .unwrap();
    let mut placement_sibling_state_node = stable_current_state_node;

    if cross_root_sibling_state_node {
        let other_root = store
            .create_client_root(FakeContainer::new(973), RootOptions::new())
            .unwrap();
        let other_render =
            render_test_root(&mut store, other_root, RootElementHandle::from_raw(973_901));
        let other_text = create_detached_root_text_for_commit(
            &mut store,
            &mut host,
            host_work.detached_hosts_mut_for_canary(),
            other_root,
            other_render.finished_work(),
            "wrong-root stable sibling state",
            FiberFlags::PLACEMENT,
        );
        placement_sibling_state_node = store.fiber_arena().get(other_text).unwrap().state_node();
        store
            .fiber_arena_mut()
            .get_mut(stable_work)
            .unwrap()
            .set_state_node(placement_sibling_state_node);
        complete_host_root(&mut store, update_render.finished_work()).unwrap();
    }

    let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        973_101,
        973_102,
    )
    .unwrap();
    let request =
        test_host_root_child_replacement_execution_request_for_canary(&store, &handoff, 973_103)
            .unwrap();
    let operations_before_execute = host.operations();

    RootReplacementSiblingOrderExecutionFixture {
        store,
        root_id,
        host,
        update_render,
        handoff,
        request,
        host_work,
        operations_before_execute,
        deleted_current,
        deleted_state_node,
        stable_work,
        stable_current_state_node,
        placement_sibling_state_node,
        replacement_component,
        replacement_component_state_node,
    }
}

fn root_replacement_text_to_component_between_stable_siblings_execution_fixture(
    cross_root_previous_sibling_state_node: bool,
) -> RootReplacementBetweenStableSiblingsExecutionFixture {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let mut detached_hosts = DetachedHostRecords::default();
    let initial_render =
        render_test_root(&mut store, root_id, RootElementHandle::from_raw(991_001));
    let stable_previous_current = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        initial_render.finished_work(),
        "stable previous sibling",
        FiberFlags::PLACEMENT,
    );
    let stable_previous_state_node = store
        .fiber_arena()
        .get(stable_previous_current)
        .unwrap()
        .state_node();
    let deleted_current = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        initial_render.finished_work(),
        "replace middle sibling",
        FiberFlags::PLACEMENT,
    );
    let deleted_state_node = store
        .fiber_arena()
        .get(deleted_current)
        .unwrap()
        .state_node();
    let stable_trailing_current = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        initial_render.finished_work(),
        "stable trailing sibling",
        FiberFlags::PLACEMENT,
    );
    let stable_trailing_state_node = store
        .fiber_arena()
        .get(stable_trailing_current)
        .unwrap()
        .state_node();
    store
        .fiber_arena_mut()
        .set_children(
            initial_render.finished_work(),
            &[
                stable_previous_current,
                deleted_current,
                stable_trailing_current,
            ],
        )
        .unwrap();
    complete_host_root(&mut store, initial_render.finished_work()).unwrap();
    let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &initial_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let next_element = source.insert_host_element_with_text("section", "replacement child");
    let update_render = render_test_root(&mut store, root_id, next_element);
    let mut host_work =
        replace_test_host_root_child_between_stable_siblings_work_with_detached_hosts_for_canary(
            &mut store,
            &mut host,
            update_render,
            &source,
            stable_previous_current,
            deleted_current,
            stable_trailing_current,
            detached_hosts,
        )
        .unwrap();
    let stable_previous_work = host_work.root_children()[0];
    let replacement_component = host_work.root_children()[1];
    let stable_trailing_work = host_work.root_children()[2];
    let replacement_component_state_node = store
        .fiber_arena()
        .get(replacement_component)
        .unwrap()
        .state_node();

    if cross_root_previous_sibling_state_node {
        let other_root = store
            .create_client_root(FakeContainer::new(991), RootOptions::new())
            .unwrap();
        let other_render =
            render_test_root(&mut store, other_root, RootElementHandle::from_raw(991_901));
        let other_text = create_detached_root_text_for_commit(
            &mut store,
            &mut host,
            host_work.detached_hosts_mut_for_canary(),
            other_root,
            other_render.finished_work(),
            "wrong-root previous sibling state",
            FiberFlags::PLACEMENT,
        );
        let wrong_state_node = store.fiber_arena().get(other_text).unwrap().state_node();
        store
            .fiber_arena_mut()
            .get_mut(stable_previous_work)
            .unwrap()
            .set_state_node(wrong_state_node);
        complete_host_root(&mut store, update_render.finished_work()).unwrap();
    }

    let handoff = commit_completed_host_root_render_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        991_101,
        991_102,
    )
    .unwrap();
    let request =
        test_host_root_child_replacement_execution_request_for_canary(&store, &handoff, 991_103)
            .unwrap();
    let operations_before_execute = host.operations();

    RootReplacementBetweenStableSiblingsExecutionFixture {
        store,
        root_id,
        host,
        update_render,
        handoff,
        request,
        host_work,
        operations_before_execute,
        stable_previous_work,
        stable_previous_current,
        stable_previous_state_node,
        deleted_current,
        deleted_state_node,
        stable_trailing_work,
        stable_trailing_state_node,
        replacement_component,
        replacement_component_state_node,
    }
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

#[test]
fn host_work_applies_root_text_deletion_record_to_test_container_without_cleanup() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(72));
    let child = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "deleted",
        FiberFlags::PLACEMENT,
    );
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
    let delete_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(delete_render.finished_work(), child)
        .unwrap();
    let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &delete_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().fiber(), child);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::RemoveChildFromContainer
        )
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert_eq!(
        detached_hosts
            .text(store.fiber_arena().get(child).unwrap().state_node())
            .unwrap()
            .text(),
        "deleted"
    );
    assert!(
        host.operations()
            .ends_with(&["append_child_to_container", "remove_child_from_container"])
    );
}

#[test]
fn host_work_applies_host_parent_text_placement_record_to_fake_host_config() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "ignored");
    let initial = element_from_root(&source, initial_element);
    let create_render = render_test_root(&mut store, root_id, initial_element);
    let current_parent = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        initial,
        FiberFlags::PLACEMENT,
    );
    let parent_state_node = store
        .fiber_arena()
        .get(current_parent)
        .unwrap()
        .state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(78), None).unwrap();
    let placement_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (work_parent, placed_text) = place_detached_text_under_existing_host_parent_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        placement_render.finished_work(),
        current_parent,
        "placed child",
    );
    let text_state_node = store.fiber_arena().get(placed_text).unwrap().state_node();
    let placement_commit = commit_finished_host_root(&mut store, placement_render).unwrap();
    assert_eq!(
        placement_commit.test_only_host_parent_placement_apply_count_for_canary(),
        1
    );
    assert!(
        placement_commit.has_test_only_host_parent_placement_apply_for_canary(
            parent_state_node.raw(),
            text_state_node.raw()
        )
    );
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &placement_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().parent(), work_parent);
    assert_eq!(
        apply.records()[0].mutation().parent_state_node(),
        parent_state_node
    );
    assert_eq!(apply.records()[0].mutation().fiber(), placed_text);
    assert_eq!(apply.records()[0].mutation().state_node(), text_state_node);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToHostParent
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::AppendChild)
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert_eq!(
        detached_hosts.text(text_state_node).unwrap().text(),
        "placed child"
    );
    let mut expected_operations = operations_before_apply;
    expected_operations.push("append_child");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn host_work_applies_nested_host_parent_text_placement_record_to_fake_host_config() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(82));
    let (current_outer, current_inner, current_text) =
        attach_detached_nested_root_element_with_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "stable",
        );
    let inner_state_node = store.fiber_arena().get(current_inner).unwrap().state_node();
    let outer_state_node = store.fiber_arena().get(current_outer).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(83), None).unwrap();
    let placement_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (_work_outer, work_inner, stable_text, placed_text) =
        place_detached_text_under_existing_nested_host_parent_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            placement_render.finished_work(),
            (current_outer, current_inner, current_text),
            "nested placed",
        );
    let text_state_node = store.fiber_arena().get(placed_text).unwrap().state_node();
    let placement_commit = commit_finished_host_root(&mut store, placement_render).unwrap();
    let diagnostics = placement_commit.host_parent_placement_apply_diagnostics_for_canary();

    assert_eq!(
        placement_commit.test_only_host_parent_placement_apply_count_for_canary(),
        1
    );
    assert!(
        placement_commit.has_test_only_host_parent_placement_apply_for_canary(
            inner_state_node.raw(),
            text_state_node.raw()
        )
    );
    assert!(
        !placement_commit.has_test_only_host_parent_placement_apply_for_canary(
            outer_state_node.raw(),
            text_state_node.raw()
        )
    );
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].parent(), work_inner);
    assert_eq!(diagnostics[0].parent_state_node(), inner_state_node);
    assert_eq!(diagnostics[0].fiber(), placed_text);
    assert_eq!(diagnostics[0].state_node(), text_state_node);
    assert!(diagnostics[0].applies_to_host_parent());
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &placement_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().parent(), work_inner);
    assert_eq!(
        apply.records()[0].mutation().parent_state_node(),
        inner_state_node
    );
    assert_eq!(apply.records()[0].mutation().fiber(), placed_text);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToHostParent
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::AppendChild)
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert_eq!(
        detached_hosts.text(text_state_node).unwrap().text(),
        "nested placed"
    );
    assert_eq!(
        store.fiber_arena().get(work_inner).unwrap().child(),
        Some(stable_text)
    );
    assert_eq!(
        store.fiber_arena().get(stable_text).unwrap().sibling(),
        Some(placed_text)
    );
    let mut expected_operations = operations_before_apply;
    expected_operations.push("append_child");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn host_work_reorders_host_parent_text_before_stable_sibling_with_insert_before() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(96));
    let (current_parent, current_stable_text, current_moving_text) =
        attach_detached_root_element_with_two_texts_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "stable",
            "moving",
        );
    let parent_state_node = store
        .fiber_arena()
        .get(current_parent)
        .unwrap()
        .state_node();
    let stable_state_node = store
        .fiber_arena()
        .get(current_stable_text)
        .unwrap()
        .state_node();
    let moving_state_node = store
        .fiber_arena()
        .get(current_moving_text)
        .unwrap()
        .state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(97), None).unwrap();
    let reorder_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (work_parent, moving_work, stable_work) =
        reorder_existing_text_before_stable_host_sibling_for_commit(
            &mut store,
            reorder_render.finished_work(),
            current_parent,
            current_moving_text,
            current_stable_text,
            None,
        );
    let reorder_commit = commit_finished_host_root(&mut store, reorder_render).unwrap();
    let diagnostics = reorder_commit.host_parent_placement_apply_diagnostics_for_canary();
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &reorder_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(reorder_commit.mutation_apply_log().records().len(), 1);
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].parent(), work_parent);
    assert_eq!(diagnostics[0].parent_state_node(), parent_state_node);
    assert_eq!(diagnostics[0].fiber(), moving_work);
    assert_eq!(diagnostics[0].state_node(), moving_state_node);
    assert_eq!(
        diagnostics[0].apply_kind(),
        "insert-placement-in-host-parent-before"
    );
    assert_eq!(diagnostics[0].sibling_status(), "insert-before");
    assert_eq!(diagnostics[0].sibling(), Some(stable_work));
    assert_eq!(diagnostics[0].sibling_tag_name(), Some("HostText"));
    assert_eq!(diagnostics[0].sibling_state_node(), stable_state_node);
    assert!(diagnostics[0].can_insert_before());
    assert!(diagnostics[0].applies_to_host_parent());

    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().parent(), work_parent);
    assert_eq!(apply.records()[0].mutation().fiber(), moving_work);
    assert_eq!(
        apply.records()[0].mutation().alternate_fiber(),
        Some(current_moving_text)
    );
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
    );
    let sibling = apply.records()[0].mutation().placement_sibling().unwrap();
    assert_eq!(
        sibling.status(),
        HostRootPlacementSiblingStatus::InsertBefore
    );
    assert_eq!(sibling.sibling(), Some(stable_work));
    assert_eq!(sibling.sibling_state_node(), stable_state_node);
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::InsertBefore)
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert_eq!(
        detached_hosts.text(moving_state_node).unwrap().text(),
        "moving"
    );
    assert_eq!(
        detached_hosts.text(stable_state_node).unwrap().text(),
        "stable"
    );
    assert_eq!(
        detached_hosts
            .text_metadata(moving_state_node)
            .unwrap()
            .fiber_id(),
        current_moving_text
    );
    assert_eq!(
        detached_hosts
            .text_metadata(stable_state_node)
            .unwrap()
            .fiber_id(),
        current_stable_text
    );
    let mut expected_operations = operations_before_apply;
    expected_operations.push("insert_before");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn host_work_rejects_host_parent_reorder_with_wrong_sibling_handle_before_mutation() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(98));
    let (current_parent, current_stable_text, current_moving_text) =
        attach_detached_root_element_with_two_texts_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "stable",
            "moving",
        );
    let parent_state_node = store
        .fiber_arena()
        .get(current_parent)
        .unwrap()
        .state_node();
    let moving_state_node = store
        .fiber_arena()
        .get(current_moving_text)
        .unwrap()
        .state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(99), None).unwrap();
    let reorder_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let (work_parent, moving_work, stable_work) =
        reorder_existing_text_before_stable_host_sibling_for_commit(
            &mut store,
            reorder_render.finished_work(),
            current_parent,
            current_moving_text,
            current_stable_text,
            Some(parent_state_node),
        );
    let reorder_commit = commit_finished_host_root(&mut store, reorder_render).unwrap();
    let operations_before_apply = host.operations();

    let error = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &reorder_commit,
        &mut detached_hosts,
    )
    .unwrap_err();

    let mutation = reorder_commit.mutation_apply_log().records()[0];
    assert_eq!(mutation.parent(), work_parent);
    assert_eq!(mutation.fiber(), moving_work);
    assert_eq!(mutation.state_node(), moving_state_node);
    assert_eq!(
        mutation.kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
    );
    let sibling = mutation.placement_sibling().unwrap();
    assert_eq!(
        sibling.status(),
        HostRootPlacementSiblingStatus::InsertBefore
    );
    assert_eq!(sibling.sibling(), Some(stable_work));
    assert_eq!(sibling.sibling_state_node(), parent_state_node);
    assert_eq!(host.operations(), operations_before_apply);
    match error {
        HostWorkError::HostNode(error) => {
            assert_eq!(error.violation(), HostNodeViolation::WrongTarget);
        }
        other => panic!("expected wrong-target host node validation, got {other:?}"),
    }
}

#[test]
fn host_work_leaves_child_placement_under_new_host_parent_recorded_only() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(79));
    let (parent, text) = attach_detached_root_element_with_placed_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "nested",
    );
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 2);
    assert_eq!(apply.records()[0].mutation().fiber(), parent);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::AppendPlacementToContainer
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(
            TestHostRootMutationHostCall::AppendChildToContainer
        )
    );
    assert_eq!(apply.records()[1].mutation().parent(), parent);
    assert_eq!(apply.records()[1].mutation().fiber(), text);
    assert_eq!(
        apply.records()[1].mutation().kind(),
        HostRootMutationApplyRecordKind::SkipUnsupportedNestedPlacement
    );
    assert_eq!(
        apply.records()[1].status(),
        TestHostRootMutationApplyStatus::RecordedOnly
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    let mut expected_operations = operations_before_apply;
    expected_operations.push("append_child_to_container");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn host_work_applies_root_host_component_update_payload_to_fake_host_config() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "ignored");
    let initial = element_from_root(&source, initial_element);
    let initial_props = initial.props();
    let create_render = render_test_root(&mut store, root_id, initial_element);
    let current_component = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        initial,
        FiberFlags::PLACEMENT,
    );
    let state_node = store
        .fiber_arena()
        .get(current_component)
        .unwrap()
        .state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let next_element = source.insert_host_element_with_text("section", "updated");
    let next = element_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let payload = update_root_component_for_commit(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_component,
        next,
        &mut detached_hosts,
    );
    let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(payload.root(), root_id);
    assert_eq!(payload.current(), current_component);
    assert_eq!(payload.state_node(), state_node);
    assert_eq!(payload.old_props(), initial_props);
    assert_eq!(payload.new_props(), next.props());
    assert_eq!(payload.ty(), "section");
    assert_eq!(
        payload.property_row().kind(),
        TestHostComponentPropertyPayloadKind::SafeTestProperty
    );
    assert_eq!(
        payload.property_row().prop_name(),
        TEST_HOST_SAFE_PROPERTY_PROP_NAME
    );
    assert!(
        !payload
            .property_row()
            .public_dom_property_compatibility_claimed()
    );
    assert_eq!(apply.records().len(), 1);
    assert_eq!(
        apply.records()[0].mutation().fiber(),
        payload.work_in_progress()
    );
    assert_eq!(
        apply.records()[0].mutation().alternate_fiber(),
        Some(current_component)
    );
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert_eq!(store.host_tokens().len(), token_count_before_apply + 1);
    assert_eq!(detached_hosts.instance(state_node).unwrap().ty(), "section");
    assert_single_test_property_update(
        &detached_hosts,
        state_node,
        root_id,
        current_component,
        initial_props,
        next.props(),
    );
    let mut expected_operations = operations_before_apply;
    expected_operations.push("commit_update");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn host_work_host_component_update_rejects_replayed_commit_record_before_second_host_call() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "ignored");
    let initial = element_from_root(&source, initial_element);
    let create_render = render_test_root(&mut store, root_id, initial_element);
    let current_component = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        initial,
        FiberFlags::PLACEMENT,
    );
    let state_node = store
        .fiber_arena()
        .get(current_component)
        .unwrap()
        .state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let next_element = source.insert_host_element_with_text("section", "updated");
    let next = element_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let payload = update_root_component_for_commit(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_component,
        next,
        &mut detached_hosts,
    );
    let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
    let first_apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap();
    assert_eq!(first_apply.applied_host_call_count(), 1);
    assert_eq!(
        first_apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
    );
    let operations_after_first_apply = host.operations();
    let token_count_after_first_apply = store.host_tokens().len();

    let error = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::ConsumedHostUpdatePayload {
            root,
            fiber,
            state_node: consumed_state_node,
            kind,
        } if root == root_id
            && fiber == payload.work_in_progress()
            && consumed_state_node == state_node
            && kind == HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    ));
    assert_eq!(host.operations(), operations_after_first_apply);
    assert_eq!(store.host_tokens().len(), token_count_after_first_apply);
}

#[test]
fn host_work_finished_work_handoff_applies_one_host_component_update_to_test_host_commit_path() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "ignored");
    let initial = element_from_root(&source, initial_element);
    let initial_props = initial.props();
    let create_render = render_test_root(&mut store, root_id, initial_element);
    let current_component = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        initial,
        FiberFlags::PLACEMENT,
    );
    let state_node = store
        .fiber_arena()
        .get(current_component)
        .unwrap()
        .state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let next_element = source.insert_host_element_with_text("section", "updated");
    let next = element_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let payload = update_root_component_for_commit(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_component,
        next,
        &mut detached_hosts,
    );
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 7).unwrap();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    let diagnostic = apply_one_test_host_update_with_finished_work_handoff_for_canary(
        &mut store,
        &mut host,
        update_render,
        Some(pending),
        8,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(diagnostic.root(), root_id);
    assert_eq!(diagnostic.finished_work(), update_render.finished_work());
    assert_eq!(diagnostic.source_handoff_order(), 7);
    assert_eq!(diagnostic.commit_order(), 8);
    assert_eq!(diagnostic.mutation().fiber(), payload.work_in_progress());
    assert_eq!(
        diagnostic.mutation().alternate_fiber(),
        Some(current_component)
    );
    assert_eq!(
        diagnostic.mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(
        diagnostic.status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
    );
    assert!(diagnostic.test_host_commit_executed());
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert_eq!(
        diagnostic.blockers(),
        &TEST_HOST_ROOT_HOST_UPDATE_EXECUTION_BLOCKERS
    );
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(!diagnostic.public_renderer_package_behavior_exposed());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert!(diagnostic.payload().is_host_component_props_update());
    assert_eq!(diagnostic.payload().current(), current_component);
    assert_eq!(
        diagnostic.payload().host_component_property_payload_kind(),
        Some(TestHostComponentPropertyPayloadKind::SafeTestProperty)
    );
    assert_eq!(
        diagnostic.payload().host_component_prop_name(),
        Some(TEST_HOST_SAFE_PROPERTY_PROP_NAME)
    );
    assert_eq!(
        diagnostic.payload().host_component_property_name(),
        Some(TEST_HOST_SAFE_PROPERTY_NAME)
    );
    assert_eq!(
        diagnostic.payload().work_in_progress(),
        payload.work_in_progress()
    );
    assert_eq!(diagnostic.payload().state_node(), state_node);
    assert_eq!(
        diagnostic.payload(),
        &TestHostRootHostUpdatePayloadForCanary::HostComponent {
            current: current_component,
            work_in_progress: payload.work_in_progress(),
            state_node,
            old_props: initial_props,
            new_props: next.props(),
            ty: "section",
            property_payload_kind: TestHostComponentPropertyPayloadKind::SafeTestProperty,
            prop_name: TEST_HOST_SAFE_PROPERTY_PROP_NAME,
            property_name: TEST_HOST_SAFE_PROPERTY_NAME,
        }
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        update_render.finished_work()
    );
    assert_eq!(store.host_tokens().len(), token_count_before_apply + 1);
    let mut expected_operations = operations_before_apply;
    expected_operations.push("commit_update");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn host_work_root_commit_pipeline_replaces_one_host_text_and_updates_private_record() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_text("before");
    let create_render = render_test_root(&mut store, root_id, initial_element);
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
        FiberFlags::PLACEMENT,
    );
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();
    let current_root_before_update = store.root(root_id).unwrap().current();
    assert_eq!(
        store
            .fiber_arena()
            .get(current_root_before_update)
            .unwrap()
            .child(),
        Some(current_text)
    );

    let next_element = source.insert_text("after");
    let next_text = text_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let diff = update_root_text_for_commit_with_payload(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_text,
        next_text,
        &mut detached_hosts,
    );
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 17)
            .unwrap();
    let operations_before_apply = host.operations();

    let diagnostic = apply_one_test_host_update_with_finished_work_handoff_for_canary(
        &mut store,
        &mut host,
        update_render,
        Some(pending),
        18,
        &mut detached_hosts,
    )
    .unwrap();

    let final_root = store.root(root_id).unwrap().current();
    assert_eq!(final_root, update_render.finished_work());
    assert_eq!(
        store.fiber_arena().get(final_root).unwrap().child(),
        Some(diff.work_in_progress())
    );
    assert_eq!(
        store
            .fiber_arena()
            .get(diff.work_in_progress())
            .unwrap()
            .alternate(),
        Some(current_text)
    );
    assert_eq!(
        store.fiber_arena().get(current_text).unwrap().alternate(),
        Some(diff.work_in_progress())
    );

    assert_eq!(diagnostic.root(), root_id);
    assert_eq!(diagnostic.finished_work(), update_render.finished_work());
    assert_eq!(diagnostic.source_handoff_order(), 17);
    assert_eq!(diagnostic.commit_order(), 18);
    assert_eq!(diagnostic.mutation().fiber(), diff.work_in_progress());
    assert_eq!(diagnostic.mutation().alternate_fiber(), Some(current_text));
    assert_eq!(
        diagnostic.mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostTextUpdate
    );
    assert_eq!(
        diagnostic.status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitTextUpdate)
    );
    assert!(diagnostic.test_host_commit_executed());
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert!(diagnostic.payload().is_host_text_content_update());
    assert_eq!(diagnostic.payload().current(), current_text);
    assert_eq!(
        diagnostic.payload().work_in_progress(),
        diff.work_in_progress()
    );
    assert_eq!(diagnostic.payload().state_node(), state_node);
    assert_eq!(diagnostic.payload().host_text_old_text(), Some("before"));
    assert_eq!(diagnostic.payload().host_text_new_text(), Some("after"));
    assert_eq!(
        diagnostic.payload(),
        &TestHostRootHostUpdatePayloadForCanary::HostText {
            current: current_text,
            work_in_progress: diff.work_in_progress(),
            state_node,
            old_text: "before".to_owned(),
            new_text: "after".to_owned(),
        }
    );
    assert_eq!(
        diagnostic.blockers(),
        &TEST_HOST_ROOT_HOST_UPDATE_EXECUTION_BLOCKERS
    );
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(!diagnostic.public_renderer_package_behavior_exposed());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert_eq!(
        detached_hosts
            .test_host_text_record_text(state_node)
            .unwrap(),
        "after"
    );
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(state_node)
            .unwrap(),
        1
    );
    let text_updates = detached_hosts
        .test_host_text_record_updates(state_node)
        .unwrap();
    let text_metadata = detached_hosts.text_metadata(state_node).unwrap();
    assert_eq!(text_updates.len(), 1);
    assert_eq!(text_updates[0].sequence(), 0);
    assert_eq!(text_updates[0].handle(), state_node);
    assert_eq!(text_updates[0].root_id(), root_id);
    assert_eq!(text_updates[0].fiber_id(), current_text);
    assert_eq!(text_updates[0].token_id(), text_metadata.token_id());
    assert_eq!(text_updates[0].phase(), text_metadata.phase());
    assert_eq!(text_updates[0].target(), HostFiberTokenTarget::TextInstance);
    assert_eq!(text_updates[0].source_currentness().handle(), state_node);
    assert_eq!(text_updates[0].source_currentness().root_id(), root_id);
    assert_eq!(
        text_updates[0].source_currentness().fiber_id(),
        current_text
    );
    assert_eq!(
        text_updates[0].source_currentness().token_id(),
        text_metadata.token_id()
    );
    assert_eq!(
        text_updates[0].source_currentness().phase(),
        text_metadata.phase()
    );
    assert_eq!(
        text_updates[0].source_currentness().target(),
        HostFiberTokenTarget::TextInstance
    );
    assert!(
        !text_updates[0]
            .source_currentness()
            .public_dom_compatibility_claimed()
    );
    assert_eq!(text_updates[0].old_text(), "before");
    assert_eq!(text_updates[0].new_text(), "after");
    assert_eq!(detached_hosts.text(state_node).unwrap().text(), "before");

    let mut expected_operations = operations_before_apply;
    expected_operations.push("commit_text_update");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn host_work_finished_work_handoff_commits_one_style_update_to_private_host_store_only() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "ignored");
    let initial = element_from_root(&source, initial_element);
    let initial_props = initial.props();
    let create_render = render_test_root(&mut store, root_id, initial_element);
    let current_component = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        initial,
        FiberFlags::PLACEMENT,
    );
    let state_node = store
        .fiber_arena()
        .get(current_component)
        .unwrap()
        .state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let next_element = source.insert_host_element_with_text("section", "updated");
    let next = element_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let payload = update_root_component_for_commit(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_component,
        next,
        &mut detached_hosts,
    );
    let row = TestHostComponentPropertyPayloadRow::style(payload.old_props(), payload.new_props());
    detached_hosts.component_updates[0].property_row = row;
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 17)
            .unwrap();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    let diagnostic = apply_one_test_host_update_with_finished_work_handoff_for_canary(
        &mut store,
        &mut host,
        update_render,
        Some(pending),
        18,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(diagnostic.root(), root_id);
    assert_eq!(diagnostic.source_handoff_order(), 17);
    assert_eq!(diagnostic.commit_order(), 18);
    assert_eq!(diagnostic.mutation().fiber(), payload.work_in_progress());
    assert_eq!(
        diagnostic.status(),
        TestHostRootMutationApplyStatus::PrivateHostStoreOnly(
            TestHostRootPrivateStoreMutation::HostComponentPropertyAndLatestProps
        )
    );
    assert!(!diagnostic.test_host_commit_executed());
    assert!(diagnostic.private_host_store_only_commit_executed());
    assert_eq!(diagnostic.applied_host_call_count(), 0);
    assert_eq!(diagnostic.private_host_store_update_count(), 1);
    assert_eq!(
        diagnostic.payload().host_component_property_payload_kind(),
        Some(TestHostComponentPropertyPayloadKind::Style)
    );
    assert_eq!(
        diagnostic.payload().host_component_prop_name(),
        Some(TEST_HOST_STYLE_PROP_NAME)
    );
    assert_eq!(
        diagnostic.payload(),
        &TestHostRootHostUpdatePayloadForCanary::HostComponent {
            current: current_component,
            work_in_progress: payload.work_in_progress(),
            state_node,
            old_props: initial_props,
            new_props: next.props(),
            ty: "section",
            property_payload_kind: TestHostComponentPropertyPayloadKind::Style,
            prop_name: TEST_HOST_STYLE_PROP_NAME,
            property_name: TEST_HOST_STYLE_PROP_NAME,
        }
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        update_render.finished_work()
    );
    assert_eq!(store.host_tokens().len(), token_count_before_apply);
    assert_single_component_property_update(
        &detached_hosts,
        state_node,
        root_id,
        current_component,
        payload.old_props(),
        payload.new_props(),
        row.kind(),
        row.prop_name(),
        row.property_name(),
        HostNodePropertyUpdateExecution::CommitUpdate,
    );
    assert_single_latest_props_update_after_property_update(
        &detached_hosts,
        state_node,
        root_id,
        current_component,
        payload.old_props(),
        payload.new_props(),
        row.kind(),
        row.prop_name(),
    );
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!row.public_dom_property_compatibility_claimed());
    assert_eq!(host.operations(), operations_before_apply);
}

#[test]
fn host_work_host_component_update_handoff_rejects_stale_finished_work_before_mutation() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "ignored");
    let initial = element_from_root(&source, initial_element);
    let create_render = render_test_root(&mut store, root_id, initial_element);
    let current_component = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        initial,
        FiberFlags::PLACEMENT,
    );
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let next_element = source.insert_host_element_with_text("section", "updated");
    let next = element_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, next_element);
    update_root_component_for_commit(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_component,
        next,
        &mut detached_hosts,
    );
    let stale_pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 9)
            .unwrap()
            .with_previous_current_for_canary(update_render.finished_work());
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();

    let error = apply_one_test_host_update_with_finished_work_handoff_for_canary(
        &mut store,
        &mut host,
        update_render,
        Some(stale_pending),
        10,
        &mut detached_hosts,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootHostUpdateExecutionErrorForCanary::FinishedWorkHandoff(error)
            if matches!(
                error.as_ref(),
                HostRootFinishedWorkCommitHandoffErrorForCanary::StaleFinishedWorkRecord {
                    root,
                    finished_work,
                    ..
                } if *root == root_id && *finished_work == update_render.finished_work()
            )
    ));
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(update_render.finished_work())
    );
    assert_eq!(host.operations(), operations_before_apply);
}

#[test]
fn host_work_host_component_update_handoff_rejects_unsupported_payload_before_mutation() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "ignored");
    let initial = element_from_root(&source, initial_element);
    let create_render = render_test_root(&mut store, root_id, initial_element);
    let current_component = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        initial,
        FiberFlags::PLACEMENT,
    );
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(86));
    let updated_component = update_root_component_for_commit_without_payload(
        &mut store,
        update_render.finished_work(),
        current_component,
        PropsHandle::from_raw(9_603),
    );
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 11)
            .unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let operations_before_apply = host.operations();

    let error = apply_one_test_host_update_with_finished_work_handoff_for_canary(
        &mut store,
        &mut host,
        update_render,
        Some(pending),
        12,
        &mut detached_hosts,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootHostUpdateExecutionErrorForCanary::UnsupportedPayload {
            root,
            finished_work,
            fiber,
            kind,
        } if root == root_id
            && finished_work == update_render.finished_work()
            && fiber == updated_component
            && kind == HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    ));
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(update_render.finished_work())
    );
    assert_eq!(host.operations(), operations_before_apply);
}

#[test]
fn host_work_host_component_update_handoff_rejects_wrong_root_record_before_mutation() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first_root = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let second_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut source = TestHostTree::new();
    let initial_element = source.insert_host_element_with_text("section", "ignored");
    let initial = element_from_root(&source, initial_element);
    let create_render = render_test_root(&mut store, first_root, initial_element);
    let current_component = attach_detached_root_instance_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        first_root,
        create_render.finished_work(),
        initial,
        FiberFlags::PLACEMENT,
    );
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let next_element = source.insert_host_element_with_text("section", "updated");
    let next = element_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, first_root, next_element);
    update_root_component_for_commit(
        &mut store,
        first_root,
        update_render.finished_work(),
        current_component,
        next,
        &mut detached_hosts,
    );
    update_container(
        &mut store,
        second_root,
        RootElementHandle::from_raw(9_604),
        None,
    )
    .unwrap();
    let second_render =
        render_host_root_for_lanes(&mut store, second_root, Lanes::DEFAULT).unwrap();
    let wrong_root_pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, second_render, 13)
            .unwrap();
    let previous_current = store.root(first_root).unwrap().current();
    let operations_before_apply = host.operations();

    let error = apply_one_test_host_update_with_finished_work_handoff_for_canary(
        &mut store,
        &mut host,
        update_render,
        Some(wrong_root_pending),
        14,
        &mut detached_hosts,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootHostUpdateExecutionErrorForCanary::FinishedWorkHandoff(error)
            if matches!(
                error.as_ref(),
                HostRootFinishedWorkCommitHandoffErrorForCanary::ForeignFinishedWorkRecord {
                    expected_root,
                    actual_root,
                    ..
                } if *expected_root == first_root && *actual_root == second_root
            )
    ));
    assert_eq!(store.root(first_root).unwrap().current(), previous_current);
    assert_eq!(
        store
            .root(first_root)
            .unwrap()
            .scheduling()
            .work_in_progress(),
        Some(update_render.finished_work())
    );
    assert_eq!(host.operations(), operations_before_apply);
}

#[test]
fn host_work_commits_style_row_to_private_host_store_then_latest_props_without_host_call() {
    let mut fixture = root_component_update_apply_fixture();
    let row = TestHostComponentPropertyPayloadRow::style(
        fixture.payload.old_props(),
        fixture.payload.new_props(),
    );
    fixture.detached_hosts.component_updates[0].property_row = row;

    let apply = apply_test_host_root_commit_mutations(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.commit,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::PrivateHostStoreOnly(
            TestHostRootPrivateStoreMutation::HostComponentPropertyAndLatestProps
        )
    );
    assert_eq!(apply.applied_host_call_count(), 0);
    assert_eq!(apply.private_host_store_update_count(), 1);
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply
    );
    assert_single_component_property_update(
        &fixture.detached_hosts,
        fixture.state_node,
        fixture.root_id,
        fixture.payload.current(),
        fixture.payload.old_props(),
        fixture.payload.new_props(),
        row.kind(),
        row.prop_name(),
        row.property_name(),
        HostNodePropertyUpdateExecution::CommitUpdate,
    );
    assert_single_latest_props_update_after_property_update(
        &fixture.detached_hosts,
        fixture.state_node,
        fixture.root_id,
        fixture.payload.current(),
        fixture.payload.old_props(),
        fixture.payload.new_props(),
        row.kind(),
        row.prop_name(),
    );
    assert!(!row.public_dom_property_compatibility_claimed());
    assert_eq!(fixture.host.operations(), fixture.operations_before_apply);
}

#[test]
fn host_work_records_dangerous_html_row_as_private_payload_execution_evidence() {
    let mut fixture = root_component_update_apply_fixture();
    let row = TestHostComponentPropertyPayloadRow::dangerous_html(
        fixture.payload.old_props(),
        fixture.payload.new_props(),
    );
    fixture.detached_hosts.component_updates[0].property_row = row;

    let apply = apply_test_host_root_commit_mutations(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.commit,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
    );
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply + 1
    );
    assert_single_component_property_update(
        &fixture.detached_hosts,
        fixture.state_node,
        fixture.root_id,
        fixture.payload.current(),
        fixture.payload.old_props(),
        fixture.payload.new_props(),
        row.kind(),
        row.prop_name(),
        row.property_name(),
        HostNodePropertyUpdateExecution::CommitUpdate,
    );
    let mut expected_operations = fixture.operations_before_apply;
    expected_operations.push("commit_update");
    assert_eq!(fixture.host.operations(), expected_operations);
}

#[test]
fn host_work_records_text_content_reset_row_as_private_host_payload_execution() {
    let mut fixture = root_component_update_apply_fixture();
    let row = TestHostComponentPropertyPayloadRow::text_content_reset(
        fixture.payload.old_props(),
        fixture.payload.new_props(),
    );
    fixture.detached_hosts.component_updates[0].property_row = row;

    let apply = apply_test_host_root_commit_mutations(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.commit,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::ResetTextContent)
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply
    );
    assert_single_component_property_update(
        &fixture.detached_hosts,
        fixture.state_node,
        fixture.root_id,
        fixture.payload.current(),
        fixture.payload.old_props(),
        fixture.payload.new_props(),
        TestHostComponentPropertyPayloadKind::TextContent,
        TEST_HOST_TEXT_CONTENT_PROP_NAME,
        TEST_HOST_TEXT_CONTENT_PROPERTY_NAME,
        HostNodePropertyUpdateExecution::ResetTextContent,
    );
    let mut expected_operations = fixture.operations_before_apply;
    expected_operations.push("reset_text_content");
    assert_eq!(fixture.host.operations(), expected_operations);
}

#[test]
fn host_work_dangerous_html_complete_work_handoff_executes_canonical_private_row() {
    let mut fixture = dangerous_html_text_reset_handoff_fixture(
        HostComponentDangerousHtmlTextResetPayloadKindForCanary::DangerousHtml,
        61,
    );
    let finished_work = fixture.render.finished_work();

    let handoff = commit_dangerous_html_text_reset_complete_work_handoff_for_canary(
        &mut fixture.store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        62,
        63,
    )
    .unwrap();

    assert_eq!(handoff.root(), fixture.root_id);
    assert_eq!(handoff.finished_work(), finished_work);
    assert_eq!(handoff.source_handoff_order(), 61);
    assert_eq!(handoff.commit_order(), 62);
    assert_eq!(handoff.request_order(), 63);
    assert_eq!(handoff.payload_kind_name(), "dangerous-html");
    assert!(handoff.complete_metadata_matches_mutation());
    assert!(handoff.private_test_host_mutation_allowed());
    assert!(handoff.public_root_rendering_blocked());
    assert!(handoff.public_renderer_mutation_blocked());
    assert!(!handoff.public_dom_compatibility_claimed());
    assert!(!handoff.test_renderer_compatibility_claimed());
    assert_eq!(
        fixture.store.root(fixture.root_id).unwrap().current(),
        finished_work
    );

    let diagnostic = apply_dangerous_html_text_reset_handoff_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(diagnostic.root(), fixture.root_id);
    assert_eq!(diagnostic.finished_work(), finished_work);
    assert_eq!(diagnostic.source_handoff_order(), 61);
    assert_eq!(diagnostic.commit_order(), 62);
    assert_eq!(diagnostic.mutation(), handoff.mutation());
    assert_eq!(
        diagnostic.status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
    );
    assert!(diagnostic.test_host_commit_executed());
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert_eq!(diagnostic.private_host_store_update_count(), 0);
    assert_eq!(
        diagnostic.payload().host_component_property_payload_kind(),
        Some(TestHostComponentPropertyPayloadKind::DangerousHtml)
    );
    assert_eq!(
        diagnostic.payload().host_component_prop_name(),
        Some(TEST_HOST_DANGEROUS_HTML_PROP_NAME)
    );
    assert_eq!(
        diagnostic.payload().host_component_property_name(),
        Some(TEST_HOST_DANGEROUS_HTML_PROPERTY_NAME)
    );
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(!diagnostic.public_renderer_package_behavior_exposed());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply + 1
    );
    assert_single_component_property_update(
        &fixture.detached_hosts,
        fixture.state_node,
        fixture.root_id,
        fixture.payload.current(),
        fixture.payload.old_props(),
        fixture.payload.new_props(),
        TestHostComponentPropertyPayloadKind::DangerousHtml,
        TEST_HOST_DANGEROUS_HTML_PROP_NAME,
        TEST_HOST_DANGEROUS_HTML_PROPERTY_NAME,
        HostNodePropertyUpdateExecution::CommitUpdate,
    );
    let mut expected_operations = fixture.operations_before_apply;
    expected_operations.push("commit_update");
    assert_eq!(fixture.host.operations(), expected_operations);
}

#[test]
fn host_work_text_reset_complete_work_handoff_executes_without_public_dom_claim() {
    let mut fixture = dangerous_html_text_reset_handoff_fixture(
        HostComponentDangerousHtmlTextResetPayloadKindForCanary::TextContentReset,
        71,
    );
    let finished_work = fixture.render.finished_work();

    let handoff = commit_dangerous_html_text_reset_complete_work_handoff_for_canary(
        &mut fixture.store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        72,
        73,
    )
    .unwrap();
    let diagnostic = apply_dangerous_html_text_reset_handoff_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(handoff.root(), fixture.root_id);
    assert_eq!(handoff.finished_work(), finished_work);
    assert_eq!(handoff.payload_kind_name(), "text-content");
    assert_eq!(
        handoff.complete_work().expected_private_host_execution(),
        "reset-text-content"
    );
    assert!(handoff.complete_work().host_component_update_required());
    assert!(handoff.complete_work().private_reconciler_handoff_only());
    assert!(!handoff.complete_work().public_dom_compatibility_claimed());
    assert!(!handoff.complete_work().public_root_compatibility_claimed());
    assert!(handoff.complete_metadata_matches_mutation());
    assert_eq!(
        diagnostic.status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::ResetTextContent)
    );
    assert!(diagnostic.test_host_commit_executed());
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert_eq!(diagnostic.private_host_store_update_count(), 0);
    assert_eq!(
        diagnostic.payload().host_component_property_payload_kind(),
        Some(TestHostComponentPropertyPayloadKind::TextContent)
    );
    assert_eq!(
        diagnostic.payload().host_component_prop_name(),
        Some(TEST_HOST_TEXT_CONTENT_PROP_NAME)
    );
    assert_eq!(
        diagnostic.payload().host_component_property_name(),
        Some(TEST_HOST_TEXT_CONTENT_PROPERTY_NAME)
    );
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply
    );
    assert_single_component_property_update(
        &fixture.detached_hosts,
        fixture.state_node,
        fixture.root_id,
        fixture.payload.current(),
        fixture.payload.old_props(),
        fixture.payload.new_props(),
        TestHostComponentPropertyPayloadKind::TextContent,
        TEST_HOST_TEXT_CONTENT_PROP_NAME,
        TEST_HOST_TEXT_CONTENT_PROPERTY_NAME,
        HostNodePropertyUpdateExecution::ResetTextContent,
    );
    let mut expected_operations = fixture.operations_before_apply;
    expected_operations.push("reset_text_content");
    assert_eq!(fixture.host.operations(), expected_operations);
}

#[test]
fn host_work_dangerous_html_text_reset_handoff_rejects_stale_metadata_before_mutation() {
    let mut fixture = dangerous_html_text_reset_handoff_fixture(
        HostComponentDangerousHtmlTextResetPayloadKindForCanary::DangerousHtml,
        81,
    );
    let finished_work = fixture.render.finished_work();
    let stale_complete_work = fixture
        .complete_work
        .with_new_props_for_canary(PropsHandle::from_raw(98_881));

    let error = commit_dangerous_html_text_reset_complete_work_handoff_for_canary(
        &mut fixture.store,
        fixture.render,
        Some(fixture.pending),
        stale_complete_work,
        0,
        82,
        83,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        crate::root_commit::HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary::MetadataPropsMismatch {
            root,
            fiber,
            expected_old_props,
            expected_new_props,
            actual_pending_props,
            actual_memoized_props,
            ..
        } if root == fixture.root_id
            && fiber == fixture.payload.work_in_progress()
            && expected_old_props == fixture.payload.old_props()
            && expected_new_props == PropsHandle::from_raw(98_881)
            && actual_pending_props == fixture.payload.new_props()
            && actual_memoized_props == fixture.payload.new_props()
    ));
    assert_eq!(
        fixture.store.root(fixture.root_id).unwrap().current(),
        fixture.previous_current
    );
    assert_eq!(
        fixture
            .store
            .root(fixture.root_id)
            .unwrap()
            .scheduling()
            .work_in_progress(),
        Some(finished_work)
    );
    assert_eq!(fixture.host.operations(), fixture.operations_before_apply);
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply
    );
    assert!(
        fixture
            .detached_hosts
            .instance_property_updates(fixture.state_node)
            .unwrap()
            .is_empty()
    );
}

#[test]
fn host_work_managed_child_placement_handoff_executes_private_append_child() {
    let mut fixture = managed_child_placement_host_work_handoff_fixture(91);
    let finished_work = fixture.render.finished_work();

    let handoff = commit_managed_child_complete_work_handoff_for_canary(
        &mut fixture.store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        92,
        93,
    )
    .unwrap();
    let diagnostic = apply_managed_child_complete_work_handoff_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(handoff.root(), fixture.root_id);
    assert_eq!(handoff.finished_work(), finished_work);
    assert_eq!(
        handoff.execution_request().previous_current(),
        fixture.previous_current
    );
    assert_eq!(
        fixture.store.root(fixture.root_id).unwrap().current(),
        finished_work
    );
    assert_eq!(diagnostic.root(), fixture.root_id);
    assert_eq!(diagnostic.finished_work(), finished_work);
    assert_eq!(diagnostic.source_handoff_order(), 91);
    assert_eq!(diagnostic.commit_order(), 92);
    assert_eq!(diagnostic.request_order(), 93);
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
    assert_eq!(
        diagnostic.blockers(),
        &TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS
    );
    assert!(diagnostic.private_test_host_mutation_executed());
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(diagnostic.public_renderer_mutation_blocked());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert!(!diagnostic.hydration_events_refs_resources_forms_claimed());

    let mutation = diagnostic.mutation();
    assert_eq!(mutation.parent(), fixture.work_parent);
    assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
    assert_eq!(mutation.fiber(), fixture.child);
    assert_eq!(mutation.state_node(), fixture.child_state_node);
    assert_eq!(
        fixture
            .store
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
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply
    );
    let mut expected_operations = fixture.operations_before_apply;
    expected_operations.push("append_child");
    assert_eq!(fixture.host.operations(), expected_operations);
}

#[test]
fn host_work_managed_child_sibling_order_placement_handoff_executes_private_insert_before() {
    let mut fixture = managed_child_placement_sibling_order_host_work_handoff_fixture(111);
    let finished_work = fixture.render.finished_work();

    let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut fixture.store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        112,
        113,
    )
    .unwrap();
    let diagnostic = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(handoff.root(), fixture.root_id);
    assert_eq!(handoff.finished_work(), finished_work);
    assert_eq!(
        handoff.execution_request().previous_current(),
        fixture.previous_current
    );
    assert_eq!(
        fixture.store.root(fixture.root_id).unwrap().current(),
        finished_work
    );
    assert_eq!(diagnostic.root(), fixture.root_id);
    assert_eq!(diagnostic.finished_work(), finished_work);
    assert_eq!(diagnostic.source_handoff_order(), 111);
    assert_eq!(diagnostic.commit_order(), 112);
    assert_eq!(diagnostic.request_order(), 113);
    assert_eq!(
        diagnostic.kind(),
        HostComponentManagedChildMutationKindForCanary::Placement
    );
    assert_eq!(diagnostic.order_evidence_name(), "next-sibling");
    assert_eq!(diagnostic.order_sibling(), fixture.order_sibling);
    assert_eq!(
        diagnostic.order_sibling_state_node(),
        fixture.order_sibling_state_node
    );
    assert_eq!(diagnostic.mutation(), handoff.mutation());
    assert_eq!(
        diagnostic.mutation_status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::InsertBefore)
    );
    assert_eq!(diagnostic.cleanup_status(), None);
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert_eq!(diagnostic.deletion_cleanup_apply_count(), 0);
    assert_eq!(
        diagnostic.blockers(),
        &TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS
    );
    assert!(diagnostic.private_test_host_mutation_executed());
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(diagnostic.public_renderer_mutation_blocked());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert!(!diagnostic.hydration_events_refs_resources_forms_claimed());

    let mutation = diagnostic.mutation();
    assert_eq!(
        mutation.kind(),
        HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
    );
    assert_eq!(mutation.parent(), fixture.work_parent);
    assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
    assert_eq!(mutation.fiber(), fixture.child);
    assert_eq!(mutation.state_node(), fixture.child_state_node);
    let sibling = mutation.placement_sibling().unwrap();
    assert_eq!(sibling.sibling(), Some(fixture.order_sibling));
    assert_eq!(
        sibling.sibling_state_node(),
        fixture.order_sibling_state_node
    );
    assert!(sibling.can_insert_before());
    assert_eq!(
        fixture
            .store
            .fiber_arena()
            .get(fixture.work_parent)
            .unwrap()
            .alternate(),
        Some(fixture.current_parent)
    );
    assert_eq!(
        fixture
            .store
            .fiber_arena()
            .get(fixture.order_sibling)
            .unwrap()
            .alternate(),
        Some(fixture.order_sibling_current)
    );
    assert!(
        fixture
            .detached_hosts
            .instance_metadata(fixture.child_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        fixture
            .detached_hosts
            .instance_metadata(fixture.order_sibling_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply
    );
    let mut expected_operations = fixture.operations_before_apply;
    expected_operations.push("insert_before");
    assert_eq!(fixture.host.operations(), expected_operations);
}

#[test]
fn host_work_managed_child_sibling_order_delete_handoff_executes_private_remove_and_cleanup() {
    let mut fixture = managed_child_delete_sibling_order_host_work_handoff_fixture(121);
    let finished_work = fixture.render.finished_work();
    let order_sibling_host_child = FakeHostChild::Instance(
        fixture
            .detached_hosts
            .instance(fixture.order_sibling_state_node)
            .unwrap()
            .id(),
    );
    let deleted_host_child = FakeHostChild::Instance(
        fixture
            .detached_hosts
            .instance(fixture.child_state_node)
            .unwrap()
            .id(),
    );
    assert_eq!(
        fixture
            .detached_hosts
            .instance(fixture.parent_state_node)
            .unwrap()
            .children(),
        &[order_sibling_host_child, deleted_host_child]
    );

    let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut fixture.store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        122,
        123,
    )
    .unwrap();
    let diagnostic = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(handoff.root(), fixture.root_id);
    assert_eq!(handoff.finished_work(), finished_work);
    assert_eq!(
        handoff.execution_request().previous_current(),
        fixture.previous_current
    );
    assert_eq!(
        fixture.store.root(fixture.root_id).unwrap().current(),
        finished_work
    );
    assert_eq!(diagnostic.root(), fixture.root_id);
    assert_eq!(diagnostic.finished_work(), finished_work);
    assert_eq!(diagnostic.source_handoff_order(), 121);
    assert_eq!(diagnostic.commit_order(), 122);
    assert_eq!(diagnostic.request_order(), 123);
    assert_eq!(
        diagnostic.kind(),
        HostComponentManagedChildMutationKindForCanary::DeleteDetach
    );
    assert_eq!(diagnostic.order_evidence_name(), "previous-sibling");
    assert_eq!(diagnostic.order_sibling(), fixture.order_sibling);
    assert_eq!(
        diagnostic.order_sibling_state_node(),
        fixture.order_sibling_state_node
    );
    assert_eq!(diagnostic.mutation(), handoff.mutation());
    assert_eq!(
        diagnostic.mutation_status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
    );
    assert_eq!(
        diagnostic.cleanup_status(),
        Some(TestHostRootDeletionCleanupStatus::Applied(
            TestHostRootDeletionCleanupAction::DetachDeletedInstance
        ))
    );
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert_eq!(diagnostic.deletion_cleanup_apply_count(), 1);
    assert_eq!(
        diagnostic.blockers(),
        &TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS
    );
    assert!(diagnostic.private_test_host_mutation_executed());
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(diagnostic.public_renderer_mutation_blocked());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert!(!diagnostic.hydration_events_refs_resources_forms_claimed());

    let mutation = diagnostic.mutation();
    assert_eq!(
        mutation.source(),
        HostRootMutationApplyRecordSource::DeletionList(fixture.deletion_list.unwrap())
    );
    assert_eq!(
        mutation.kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(mutation.parent(), fixture.work_parent);
    assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
    assert_eq!(mutation.fiber(), fixture.child);
    assert_eq!(mutation.state_node(), fixture.child_state_node);
    assert_eq!(mutation.placement_sibling(), None);
    assert_eq!(
        fixture
            .store
            .fiber_arena()
            .get(fixture.work_parent)
            .unwrap()
            .alternate(),
        Some(fixture.current_parent)
    );
    assert_eq!(
        fixture
            .store
            .fiber_arena()
            .get(fixture.order_sibling)
            .unwrap()
            .alternate(),
        Some(fixture.order_sibling_current)
    );
    assert_eq!(
        fixture
            .store
            .fiber_arena()
            .get(fixture.work_parent)
            .unwrap()
            .child(),
        Some(fixture.order_sibling)
    );
    assert_eq!(
        fixture
            .store
            .fiber_arena()
            .get(fixture.order_sibling)
            .unwrap()
            .sibling(),
        None
    );
    assert_eq!(
        fixture
            .store
            .fiber_arena()
            .get(fixture.order_sibling_current)
            .unwrap()
            .sibling(),
        Some(fixture.child)
    );
    assert!(
        !fixture
            .detached_hosts
            .instance_metadata(fixture.child_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        fixture
            .detached_hosts
            .instance_metadata(fixture.order_sibling_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        fixture
            .detached_hosts
            .instance_metadata(fixture.parent_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply + 1
    );
    let mut expected_operations = fixture.operations_before_apply;
    expected_operations.push("remove_child");
    expected_operations.push("detach_deleted_instance");
    assert_eq!(fixture.host.operations(), expected_operations);
}

#[test]
fn host_work_managed_child_sibling_order_delete_rejects_stale_previous_sibling_before_remove() {
    let mut fixture = managed_child_delete_sibling_order_host_work_handoff_fixture(131);

    let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut fixture.store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        132,
        133,
    )
    .unwrap();
    let order_sibling_scope = fixture
        .detached_hosts
        .scope(
            fixture.order_sibling_state_node,
            HostFiberTokenTarget::Instance,
        )
        .unwrap();
    fixture
        .detached_hosts
        .nodes
        .invalidate_instance(fixture.order_sibling_state_node, order_sibling_scope)
        .unwrap();

    let error = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        TestHostRootManagedChildExecutionErrorForCanary::HostWork(
            HostWorkError::HostNode(ref error)
        ) if error.violation() == HostNodeViolation::Stale
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_apply);
    assert!(
        fixture
            .detached_hosts
            .instance_metadata(fixture.child_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply + 1
    );
}

#[test]
fn host_work_managed_child_delete_handoff_executes_private_remove_and_cleanup() {
    let mut fixture = managed_child_delete_host_work_handoff_fixture(101);
    let finished_work = fixture.render.finished_work();

    let handoff = commit_managed_child_complete_work_handoff_for_canary(
        &mut fixture.store,
        fixture.render,
        Some(fixture.pending),
        fixture.complete_work,
        0,
        102,
        103,
    )
    .unwrap();
    let diagnostic = apply_managed_child_complete_work_handoff_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &handoff,
        &mut fixture.detached_hosts,
    )
    .unwrap();

    assert_eq!(handoff.root(), fixture.root_id);
    assert_eq!(handoff.finished_work(), finished_work);
    assert_eq!(
        handoff.execution_request().previous_current(),
        fixture.previous_current
    );
    assert_eq!(
        fixture.store.root(fixture.root_id).unwrap().current(),
        finished_work
    );
    assert_eq!(diagnostic.root(), fixture.root_id);
    assert_eq!(diagnostic.finished_work(), finished_work);
    assert_eq!(diagnostic.source_handoff_order(), 101);
    assert_eq!(diagnostic.commit_order(), 102);
    assert_eq!(diagnostic.request_order(), 103);
    assert_eq!(
        diagnostic.kind(),
        HostComponentManagedChildMutationKindForCanary::DeleteDetach
    );
    assert_eq!(diagnostic.mutation(), handoff.mutation());
    assert_eq!(
        diagnostic.mutation_status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
    );
    assert_eq!(
        diagnostic.cleanup_status(),
        Some(TestHostRootDeletionCleanupStatus::Applied(
            TestHostRootDeletionCleanupAction::DetachDeletedInstance
        ))
    );
    assert_eq!(diagnostic.applied_host_call_count(), 1);
    assert_eq!(diagnostic.deletion_cleanup_apply_count(), 1);
    assert_eq!(
        diagnostic.blockers(),
        &TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS
    );
    assert!(diagnostic.private_test_host_mutation_executed());
    assert!(diagnostic.public_root_rendering_blocked());
    assert!(diagnostic.public_renderer_mutation_blocked());
    assert!(!diagnostic.react_dom_compatibility_claimed());
    assert!(!diagnostic.test_renderer_compatibility_claimed());
    assert!(!diagnostic.hydration_events_refs_resources_forms_claimed());

    let mutation = diagnostic.mutation();
    assert_eq!(mutation.parent(), fixture.work_parent);
    assert_eq!(mutation.parent_state_node(), fixture.parent_state_node);
    assert_eq!(mutation.fiber(), fixture.child);
    assert_eq!(mutation.state_node(), fixture.child_state_node);
    assert_eq!(
        fixture
            .store
            .fiber_arena()
            .get(fixture.work_parent)
            .unwrap()
            .alternate(),
        Some(fixture.current_parent)
    );
    assert!(
        !fixture
            .detached_hosts
            .instance_metadata(fixture.child_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        fixture
            .detached_hosts
            .instance_metadata(fixture.parent_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply + 1
    );
    let mut expected_operations = fixture.operations_before_apply;
    expected_operations.push("remove_child");
    expected_operations.push("detach_deleted_instance");
    assert_eq!(fixture.host.operations(), expected_operations);
}

#[test]
fn host_work_host_component_rejects_property_payload_metadata_mismatch_before_commit() {
    let mut fixture = root_component_update_apply_fixture();
    fixture.detached_hosts.component_updates[0].new_props = PropsHandle::from_raw(98_608);

    let error = apply_test_host_root_commit_mutations(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.commit,
        &mut fixture.detached_hosts,
    )
    .unwrap_err();

    assert_component_property_payload_error(
        error,
        fixture.root_id,
        fixture.payload.work_in_progress(),
        TEST_HOST_SAFE_PROPERTY_PROP_NAME,
        TestHostComponentPropertyPayloadViolation::WrongPendingProps,
    );
    assert_eq!(fixture.host.operations(), fixture.operations_before_apply);
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply
    );
    assert!(
        fixture
            .detached_hosts
            .instance_property_updates(fixture.state_node)
            .unwrap()
            .is_empty()
    );
}

#[test]
fn host_work_host_component_rejects_stale_property_update_handles_before_commit_token_issue() {
    let mut fixture = root_component_update_apply_fixture();
    let scope = fixture
        .detached_hosts
        .scope(fixture.state_node, HostFiberTokenTarget::Instance)
        .unwrap();
    fixture
        .detached_hosts
        .nodes
        .invalidate_instance(fixture.state_node, scope)
        .unwrap();

    let error = apply_test_host_root_commit_mutations(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.commit,
        &mut fixture.detached_hosts,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::HostNode(ref error)
            if error.violation() == HostNodeViolation::Stale
    ));
    assert_eq!(fixture.host.operations(), fixture.operations_before_apply);
    assert_eq!(
        fixture.store.host_tokens().len(),
        fixture.token_count_before_apply
    );
}

#[test]
fn host_work_applies_root_text_update_payload_to_fake_host_config() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(75));
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
        FiberFlags::PLACEMENT,
    );
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let mut source = TestHostTree::new();
    let next_element = source.insert_text("after");
    let next_text = text_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let diff = update_root_text_for_commit_with_payload(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_text,
        next_text,
        &mut detached_hosts,
    );
    let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(diff.current(), current_text);
    assert_eq!(diff.state_node(), state_node);
    assert_eq!(diff.old_text(), "before");
    assert_eq!(diff.new_text(), "after");
    assert_eq!(apply.records().len(), 1);
    assert_eq!(
        apply.records()[0].mutation().fiber(),
        diff.work_in_progress()
    );
    assert_eq!(
        apply.records()[0].mutation().alternate_fiber(),
        Some(current_text)
    );
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostTextUpdate
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitTextUpdate)
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert_eq!(detached_hosts.text(state_node).unwrap().text(), "before");
    let mut expected_operations = operations_before_apply;
    expected_operations.push("commit_text_update");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn host_work_host_text_update_rejects_replayed_commit_record_before_second_host_call() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(75_100));
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
        FiberFlags::PLACEMENT,
    );
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let mut source = TestHostTree::new();
    let next_element = source.insert_text("after");
    let next_text = text_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let diff = update_root_text_for_commit_with_payload(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_text,
        next_text,
        &mut detached_hosts,
    );
    let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
    let first_apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap();
    assert_eq!(first_apply.applied_host_call_count(), 1);
    assert_eq!(
        first_apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitTextUpdate)
    );
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(state_node)
            .unwrap(),
        1
    );
    let operations_after_first_apply = host.operations();

    let error = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::ConsumedHostUpdatePayload {
            root,
            fiber,
            state_node: consumed_state_node,
            kind,
        } if root == root_id
            && fiber == diff.work_in_progress()
            && consumed_state_node == state_node
            && kind == HostRootMutationApplyRecordKind::CommitHostTextUpdate
    ));
    assert_eq!(host.operations(), operations_after_first_apply);
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(state_node)
            .unwrap(),
        1
    );
}

#[test]
fn host_work_applies_host_parent_text_update_payload_to_fake_host_config() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(79));
    let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
    );
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let mut source = TestHostTree::new();
    let next_element = source.insert_text("after");
    let next_text = text_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let (work_parent, diff) = update_host_parent_text_for_commit_with_payload(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_parent,
        current_text,
        next_text,
        &mut detached_hosts,
    );
    let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(diff.current(), current_text);
    assert_eq!(diff.state_node(), state_node);
    assert_eq!(diff.old_text(), "before");
    assert_eq!(diff.new_text(), "after");
    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().parent(), work_parent);
    assert_eq!(
        apply.records()[0].mutation().parent_tag(),
        FiberTag::HostComponent
    );
    assert_eq!(
        apply.records()[0].mutation().fiber(),
        diff.work_in_progress()
    );
    assert_eq!(
        apply.records()[0].mutation().alternate_fiber(),
        Some(current_text)
    );
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostTextUpdate
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitTextUpdate)
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert_eq!(detached_hosts.text(state_node).unwrap().text(), "before");
    let mut expected_operations = operations_before_apply;
    expected_operations.push("commit_text_update");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn host_text_update_commit_execution_mutates_test_host_record_after_payload_and_handoff_validation()
{
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_900));
    let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
    );
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let mut source = TestHostTree::new();
    let next_element = source.insert_text("after");
    let next_text = text_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_901));
    let (_work_parent, diff) = update_host_parent_text_for_commit_with_payload(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_parent,
        current_text,
        next_text,
        &mut detached_hosts,
    );
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 21)
            .unwrap();
    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        Some(pending),
        22,
    )
    .unwrap();
    let request =
        host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 23).unwrap();
    let operations_before_execute = host.operations();

    let execution =
        execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
            .unwrap();

    assert_eq!(execution.root(), root_id);
    assert_eq!(execution.finished_work(), update_render.finished_work());
    assert_eq!(execution.current(), current_text);
    assert_eq!(execution.work_in_progress(), diff.work_in_progress());
    assert_eq!(execution.state_node(), state_node);
    assert_eq!(execution.old_text(), "before");
    assert_eq!(execution.new_text(), "after");
    assert_eq!(execution.update_count(), 1);
    assert!(execution.payload_accepted());
    assert!(execution.commit_handoff_validated());
    assert!(!execution.public_renderer_compatibility_claimed());
    assert_eq!(
        execution.mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostTextUpdate
    );
    assert_eq!(
        detached_hosts
            .test_host_text_record_text(state_node)
            .unwrap(),
        "after"
    );
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(state_node)
            .unwrap(),
        1
    );
    let text_updates = detached_hosts
        .test_host_text_record_updates(state_node)
        .unwrap();
    let text_metadata = detached_hosts.text_metadata(state_node).unwrap();
    assert_eq!(text_updates.len(), 1);
    assert_eq!(text_updates[0].source_currentness().handle(), state_node);
    assert_eq!(text_updates[0].source_currentness().root_id(), root_id);
    assert_eq!(
        text_updates[0].source_currentness().fiber_id(),
        current_text
    );
    assert_eq!(
        text_updates[0].source_currentness().token_id(),
        text_metadata.token_id()
    );
    assert_eq!(
        text_updates[0].source_currentness().phase(),
        text_metadata.phase()
    );
    assert_eq!(
        text_updates[0].source_currentness().target(),
        HostFiberTokenTarget::TextInstance
    );
    assert_eq!(detached_hosts.text(state_node).unwrap().text(), "before");
    assert!(request.public_renderer_mutation_blocked());
    assert!(!request.public_renderer_compatibility_claimed());

    let mut expected_operations = operations_before_execute;
    expected_operations.push("commit_text_update");
    assert_eq!(host.operations(), expected_operations);

    let operations_after_first_execute = host.operations();
    let replay_error =
        execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
            .unwrap_err();
    assert!(matches!(
        replay_error,
        HostWorkError::ConsumedHostUpdatePayload {
            root,
            fiber,
            state_node: consumed_state_node,
            kind,
        } if root == root_id
            && fiber == diff.work_in_progress()
            && consumed_state_node == state_node
            && kind == HostRootMutationApplyRecordKind::CommitHostTextUpdate
    ));
    assert_eq!(host.operations(), operations_after_first_execute);
}

#[test]
fn host_text_update_commit_execution_rejects_tampered_finished_work_before_payload_consumption() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_905));
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
        FiberFlags::PLACEMENT,
    );
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let mut source = TestHostTree::new();
    let next_element = source.insert_text("after");
    let next_text = text_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_906));
    update_root_text_for_commit_with_payload(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_text,
        next_text,
        &mut detached_hosts,
    );
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 24)
            .unwrap();
    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        Some(pending),
        25,
    )
    .unwrap();
    let request = host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 26)
        .unwrap()
        .with_finished_work_for_canary(create_render.finished_work());
    let operations_before_execute = host.operations();

    let error =
        execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
            .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::InvalidHostTextCommitExecutionRequest {
            root,
            finished_work,
            fiber,
            violation: HostTextCommitExecutionRequestViolation::WrongFinishedWork,
        } if root == root_id
            && finished_work == create_render.finished_work()
            && fiber != current_text
    ));
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(state_node)
            .unwrap(),
        0
    );
    assert_eq!(host.operations(), operations_before_execute);
}

#[test]
fn host_text_update_commit_execution_rejects_payload_without_source_currentness_before_host_call() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_907));
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
        FiberFlags::PLACEMENT,
    );
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_908));
    let work_text = update_root_text_for_commit_without_payload(
        &mut store,
        update_render.finished_work(),
        current_text,
        PropsHandle::from_raw(7_909),
    );
    detached_hosts.record_text_update(HostTextUpdatePayload {
        root: root_id,
        current: current_text,
        work_in_progress: work_text,
        state_node,
        old_text: "before".to_owned(),
        new_text: "after".to_owned(),
        source_currentness: None,
    });
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 27)
            .unwrap();
    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        Some(pending),
        28,
    )
    .unwrap();
    let request =
        host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 29).unwrap();
    let operations_before_execute = host.operations();

    let error =
        execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
            .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::HostNode(error)
            if error.violation() == HostNodeViolation::MissingCurrentness
    ));
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(state_node)
            .unwrap(),
        0
    );
    assert_eq!(host.operations(), operations_before_execute);
}

#[test]
fn host_text_update_commit_execution_rejects_cross_sibling_payload_currentness_before_host_call() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_914));
    let current_text = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
        FiberFlags::PLACEMENT,
    );
    let sibling_text = create_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "sibling",
        FiberFlags::PLACEMENT,
    );
    store
        .fiber_arena_mut()
        .set_children(create_render.finished_work(), &[current_text, sibling_text])
        .unwrap();
    complete_host_root(&mut store, create_render.finished_work()).unwrap();
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let sibling_state_node = store.fiber_arena().get(sibling_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_915));
    let work_text = update_root_text_for_commit_without_payload(
        &mut store,
        update_render.finished_work(),
        current_text,
        PropsHandle::from_raw(7_916),
    );
    let sibling_metadata = detached_hosts.text_metadata(sibling_state_node).unwrap();
    detached_hosts.record_text_update(HostTextUpdatePayload {
        root: root_id,
        current: current_text,
        work_in_progress: work_text,
        state_node,
        old_text: "before".to_owned(),
        new_text: "after".to_owned(),
        source_currentness: Some(
            HostNodeUpdateCurrentness::new()
                .with_handle(state_node)
                .with_root_id(root_id)
                .with_fiber_id(sibling_text)
                .with_token_id(sibling_metadata.token_id())
                .with_phase(sibling_metadata.phase())
                .with_target(HostFiberTokenTarget::TextInstance),
        ),
    });
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 34)
            .unwrap();
    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        Some(pending),
        35,
    )
    .unwrap();
    let request =
        host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 36).unwrap();
    let operations_before_execute = host.operations();

    let error =
        execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
            .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::HostNode(error)
            if error.violation() == HostNodeViolation::WrongFiber
    ));
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(state_node)
            .unwrap(),
        0
    );
    assert_eq!(host.operations(), operations_before_execute);
}

#[test]
fn host_text_update_commit_execution_rejects_unchanged_payload_without_mutating_record() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_910));
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "stable",
        FiberFlags::PLACEMENT,
    );
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_911));
    let work_text = update_root_text_for_commit_without_payload(
        &mut store,
        update_render.finished_work(),
        current_text,
        PropsHandle::from_raw(7_912),
    );
    detached_hosts.record_text_update(HostTextUpdatePayload {
        root: root_id,
        current: current_text,
        work_in_progress: work_text,
        state_node,
        old_text: "stable".to_owned(),
        new_text: "stable".to_owned(),
        source_currentness: None,
    });
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 31)
            .unwrap();
    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        Some(pending),
        32,
    )
    .unwrap();
    let request =
        host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 33).unwrap();
    let operations_before_execute = host.operations();

    let error =
        execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
            .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::UnchangedHostTextUpdatePayload {
            root,
            current,
            work_in_progress,
            state_node: rejected_state_node
        } if root == root_id
            && current == current_text
            && work_in_progress == work_text
            && rejected_state_node == state_node
    ));
    assert_eq!(
        detached_hosts
            .test_host_text_record_text(state_node)
            .unwrap(),
        "stable"
    );
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(state_node)
            .unwrap(),
        0
    );
    assert_eq!(host.operations(), operations_before_execute);
}

#[test]
fn host_text_update_commit_execution_rejects_stale_host_token_before_mutating_record() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_920));
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
        FiberFlags::PLACEMENT,
    );
    let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let mut source = TestHostTree::new();
    let next_element = source.insert_text("after");
    let next_text = text_from_root(&source, next_element);
    let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_921));
    let diff = update_root_text_for_commit_with_payload(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_text,
        next_text,
        &mut detached_hosts,
    );
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 41)
            .unwrap();
    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        Some(pending),
        42,
    )
    .unwrap();
    let request =
        host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 43).unwrap();
    let metadata = detached_hosts.text_metadata(state_node).unwrap();
    store
        .host_tokens_mut()
        .invalidate(metadata.token_id(), metadata.phase(), metadata.target())
        .unwrap();
    let operations_before_execute = host.operations();

    let error =
        execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
            .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::HostFiberToken(error)
            if error.violation() == HostFiberTokenViolation::Stale
    ));
    assert_eq!(diff.old_text(), "before");
    assert_eq!(diff.new_text(), "after");
    assert_eq!(
        detached_hosts
            .test_host_text_record_text(state_node)
            .unwrap(),
        "before"
    );
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(state_node)
            .unwrap(),
        0
    );
    assert_eq!(host.operations(), operations_before_execute);
}

#[test]
fn host_text_update_commit_execution_rejects_wrong_root_text_handle_before_mutating_record() {
    let (mut store, root_id) = root_store();
    let second_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let second_render =
        render_test_root(&mut store, second_root, RootElementHandle::from_raw(7_930));
    let second_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        second_root,
        second_render.finished_work(),
        "foreign",
        FiberFlags::PLACEMENT,
    );
    let foreign_state_node = store.fiber_arena().get(second_text).unwrap().state_node();

    let current_root = store.root(root_id).unwrap().current();
    let mode = store.fiber_arena().get(current_root).unwrap().mode();
    let current_text = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(7_931),
        mode,
    );
    {
        let node = store.fiber_arena_mut().get_mut(current_text).unwrap();
        node.set_state_node(foreign_state_node);
        node.set_memoized_props(PropsHandle::from_raw(7_931));
    }
    store
        .fiber_arena_mut()
        .set_children(current_root, &[current_text])
        .unwrap();
    complete_host_root(&mut store, current_root).unwrap();

    let update_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(7_932));
    let work_text = update_root_text_for_commit_without_payload(
        &mut store,
        update_render.finished_work(),
        current_text,
        PropsHandle::from_raw(7_933),
    );
    detached_hosts.record_text_update(HostTextUpdatePayload {
        root: root_id,
        current: current_text,
        work_in_progress: work_text,
        state_node: foreign_state_node,
        old_text: "foreign".to_owned(),
        new_text: "after".to_owned(),
        source_currentness: None,
    });
    let pending =
        record_host_root_finished_work_pending_commit_for_canary(&store, update_render, 51)
            .unwrap();
    let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        &mut store,
        update_render,
        Some(pending),
        52,
    )
    .unwrap();
    let request =
        host_root_text_update_commit_execution_request_for_canary(&handoff, 0, 53).unwrap();
    let operations_before_execute = host.operations();

    let error =
        execute_test_host_text_update_commit(&store, &mut host, request, &mut detached_hosts)
            .unwrap_err();

    assert!(matches!(
        error,
        HostWorkError::HostNode(error)
            if error.violation() == HostNodeViolation::WrongRoot
    ));
    assert_eq!(
        detached_hosts
            .test_host_text_record_text(foreign_state_node)
            .unwrap(),
        "foreign"
    );
    assert_eq!(
        detached_hosts
            .test_host_text_record_update_count(foreign_state_node)
            .unwrap(),
        0
    );
    assert_eq!(host.operations(), operations_before_execute);
}

#[test]
fn host_work_applies_host_component_property_and_text_update_payloads_to_fake_host_config() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(80));
    let (current_outer, current_inner, current_text) =
        attach_detached_nested_root_element_with_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "before",
        );
    let component_state_node = store.fiber_arena().get(current_inner).unwrap().state_node();
    let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let old_component_props = store
        .fiber_arena()
        .get(current_inner)
        .unwrap()
        .memoized_props();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let mut source = TestHostTree::new();
    let next_element = source.insert_host_element_with_text("label", "after");
    let next_component = element_from_root(&source, next_element);
    let next_text = first_text_child(next_component);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let (work_outer, payload, diff) = update_host_parent_component_and_text_for_commit_with_payload(
        &mut store,
        root_id,
        update_render.finished_work(),
        current_outer,
        current_inner,
        current_text,
        next_component,
        next_text,
        &mut detached_hosts,
    );
    let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(payload.root(), root_id);
    assert_eq!(payload.current(), current_inner);
    assert_eq!(payload.state_node(), component_state_node);
    assert_eq!(payload.old_props(), old_component_props);
    assert_eq!(payload.new_props(), next_component.props());
    assert_eq!(payload.ty(), "label");
    assert_eq!(
        payload.property_row().kind(),
        TestHostComponentPropertyPayloadKind::SafeTestProperty
    );
    assert!(
        !payload
            .property_row()
            .public_dom_property_compatibility_claimed()
    );
    assert_eq!(diff.current(), current_text);
    assert_eq!(diff.state_node(), text_state_node);
    assert_eq!(diff.old_text(), "before");
    assert_eq!(diff.new_text(), "after");
    assert_eq!(apply.records().len(), 2);
    assert_eq!(
        apply.records()[0].mutation().parent(),
        payload.work_in_progress()
    );
    assert_eq!(
        apply.records()[0].mutation().fiber(),
        diff.work_in_progress()
    );
    assert_eq!(
        apply.records()[0].mutation().alternate_fiber(),
        Some(current_text)
    );
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostTextUpdate
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitTextUpdate)
    );
    assert_eq!(apply.records()[1].mutation().parent(), work_outer);
    assert_eq!(
        apply.records()[1].mutation().fiber(),
        payload.work_in_progress()
    );
    assert_eq!(
        apply.records()[1].mutation().alternate_fiber(),
        Some(current_inner)
    );
    assert_eq!(
        apply.records()[1].mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
    );
    assert_eq!(
        apply.records()[1].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
    );
    assert_eq!(apply.applied_host_call_count(), 2);
    assert_eq!(store.host_tokens().len(), token_count_before_apply + 1);
    assert_eq!(
        detached_hosts.instance(component_state_node).unwrap().ty(),
        "label"
    );
    assert_single_test_property_update(
        &detached_hosts,
        component_state_node,
        root_id,
        current_inner,
        old_component_props,
        next_component.props(),
    );
    assert_eq!(
        detached_hosts.text(text_state_node).unwrap().text(),
        "before"
    );
    let mut expected_operations = operations_before_apply;
    expected_operations.push("commit_text_update");
    expected_operations.push("commit_update");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn host_work_host_component_rejects_text_content_property_row_when_host_text_update_is_pending() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(81));
    let (current_outer, current_inner, current_text) =
        attach_detached_nested_root_element_with_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "before",
        );
    let component_state_node = store.fiber_arena().get(current_inner).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let mut source = TestHostTree::new();
    let next_element = source.insert_host_element_with_text("label", "after");
    let next_component = element_from_root(&source, next_element);
    let next_text = first_text_child(next_component);
    let update_render = render_test_root(&mut store, root_id, next_element);
    let (_work_outer, payload, diff) =
        update_host_parent_component_and_text_for_commit_with_payload(
            &mut store,
            root_id,
            update_render.finished_work(),
            current_outer,
            current_inner,
            current_text,
            next_component,
            next_text,
            &mut detached_hosts,
        );
    detached_hosts.component_updates[0].property_row =
        TestHostComponentPropertyPayloadRow::text_content_reset(
            payload.old_props(),
            payload.new_props(),
        );
    let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
    let operations_before_apply = host.operations();
    let token_count_before_apply = store.host_tokens().len();

    let error = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap_err();

    assert_eq!(diff.current(), current_text);
    assert_component_property_payload_error(
        error,
        root_id,
        payload.work_in_progress(),
        TEST_HOST_TEXT_CONTENT_PROP_NAME,
        TestHostComponentPropertyPayloadViolation::ConflictingTextUpdate,
    );
    assert_eq!(host.operations(), operations_before_apply);
    assert_eq!(store.host_tokens().len(), token_count_before_apply);
    assert!(
        detached_hosts
            .instance_property_updates(component_state_node)
            .unwrap()
            .is_empty()
    );
}

#[test]
fn host_work_applies_host_parent_text_deletion_record_without_cleanup() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(73));
    let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "nested",
    );
    let parent_state_node = store
        .fiber_arena()
        .get(current_parent)
        .unwrap()
        .state_node();
    let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(74), None).unwrap();
    let delete_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let work_parent = delete_host_text_under_host_parent_for_commit(
        &mut store,
        delete_render.finished_work(),
        current_parent,
        current_text,
    );
    let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &delete_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().parent(), work_parent);
    assert_eq!(
        apply.records()[0].mutation().parent_state_node(),
        parent_state_node
    );
    assert_eq!(apply.records()[0].mutation().fiber(), current_text);
    assert_eq!(apply.records()[0].mutation().state_node(), text_state_node);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
    );
    assert_eq!(apply.applied_host_call_count(), 1);
    assert_eq!(
        detached_hosts.text(text_state_node).unwrap().text(),
        "nested"
    );
    assert!(
        detached_hosts
            .instance(parent_state_node)
            .unwrap()
            .children()
            .contains(&FakeHostChild::Text(
                detached_hosts.text(text_state_node).unwrap().id()
            ))
    );
    assert!(
        host.operations()
            .ends_with(&["append_child_to_container", "remove_child"])
    );
}

#[test]
fn host_work_applies_host_component_subtree_deletion_cleanup_with_ref_evidence() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(84));
    let (current_outer, current_inner, current_text) =
        attach_detached_nested_root_element_with_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "deleted subtree",
        );
    let outer_state_node = store.fiber_arena().get(current_outer).unwrap().state_node();
    let inner_state_node = store.fiber_arena().get(current_inner).unwrap().state_node();
    let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let inner_host_child =
        FakeHostChild::Instance(detached_hosts.instance(inner_state_node).unwrap().id());
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let deleted_ref = RefHandle::from_raw(9_500);
    store
        .fiber_arena_mut()
        .get_mut(current_inner)
        .unwrap()
        .set_ref_handle(deleted_ref);

    update_container(&mut store, root_id, RootElementHandle::from_raw(85), None).unwrap();
    let delete_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let work_outer = delete_host_component_under_host_parent_for_commit(
        &mut store,
        delete_render.finished_work(),
        current_outer,
        current_inner,
    );
    let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
    let operations_before_apply = host.operations();
    let mutation_apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &delete_commit,
        &mut detached_hosts,
    )
    .unwrap();
    let cleanup_apply = apply_test_host_root_deletion_cleanup(
        &store,
        &mut host,
        &delete_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(mutation_apply.records().len(), 1);
    assert_eq!(mutation_apply.records()[0].mutation().parent(), work_outer);
    assert_eq!(
        mutation_apply.records()[0].mutation().parent_state_node(),
        outer_state_node
    );
    assert_eq!(
        mutation_apply.records()[0].mutation().fiber(),
        current_inner
    );
    assert_eq!(
        mutation_apply.records()[0].mutation().state_node(),
        inner_state_node
    );
    assert_eq!(
        mutation_apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(
        mutation_apply.records()[0].status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
    );

    assert_eq!(cleanup_apply.root(), root_id);
    assert_eq!(cleanup_apply.finished_work(), delete_commit.finished_work());
    assert_eq!(cleanup_apply.records().len(), 2);
    assert_eq!(cleanup_apply.applied_record_count(), 2);
    assert_eq!(cleanup_apply.detached_instance_count(), 1);
    assert_eq!(cleanup_apply.records()[0].cleanup().fiber(), current_text);
    assert_eq!(
        cleanup_apply.records()[0].cleanup().token_target(),
        HostFiberTokenTarget::TextInstance
    );
    assert_eq!(
        cleanup_apply.records()[0].status(),
        TestHostRootDeletionCleanupStatus::Applied(
            TestHostRootDeletionCleanupAction::InvalidateDeletedText
        )
    );
    assert_eq!(
        cleanup_apply.records()[0]
            .previous_metadata()
            .unwrap()
            .fiber_id(),
        current_text
    );
    assert_eq!(
        cleanup_apply.records()[0]
            .previous_metadata()
            .unwrap()
            .target(),
        HostFiberTokenTarget::TextInstance
    );
    assert_eq!(cleanup_apply.records()[1].cleanup().fiber(), current_inner);
    assert_eq!(
        cleanup_apply.records()[1].cleanup().token_target(),
        HostFiberTokenTarget::Instance
    );
    assert_eq!(
        cleanup_apply.records()[1].status(),
        TestHostRootDeletionCleanupStatus::Applied(
            TestHostRootDeletionCleanupAction::DetachDeletedInstance
        )
    );
    assert_eq!(
        cleanup_apply.records()[1]
            .previous_metadata()
            .unwrap()
            .fiber_id(),
        current_inner
    );
    assert_eq!(
        cleanup_apply.records()[1]
            .previous_metadata()
            .unwrap()
            .target(),
        HostFiberTokenTarget::Instance
    );

    assert!(
        !detached_hosts
            .text_metadata(text_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        !detached_hosts
            .instance_metadata(inner_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(
        detached_hosts
            .nodes
            .text(
                text_state_node,
                detached_hosts
                    .scope(text_state_node, HostFiberTokenTarget::TextInstance)
                    .unwrap()
            )
            .unwrap_err()
            .violation(),
        HostNodeViolation::Stale
    );
    assert_eq!(
        detached_hosts
            .nodes
            .instance(
                inner_state_node,
                detached_hosts
                    .scope(inner_state_node, HostFiberTokenTarget::Instance)
                    .unwrap()
            )
            .unwrap_err()
            .violation(),
        HostNodeViolation::Stale
    );
    assert!(
        detached_hosts
            .instance(outer_state_node)
            .unwrap()
            .children()
            .contains(&inner_host_child)
    );

    let refs = delete_commit.ref_commit_metadata();
    assert_eq!(refs.attach().len(), 0);
    assert_eq!(refs.detach().len(), 1);
    assert_eq!(refs.detach()[0].fiber(), current_inner);
    assert_eq!(refs.detach()[0].ref_handle(), deleted_ref);
    assert_eq!(
        refs.detach()[0].detach_reason(),
        Some(HostRootRefDetachReason::Deleted)
    );
    assert_eq!(
        refs.detach()[0].token_phase(),
        HostFiberTokenPhase::Deletion
    );
    assert_eq!(
        refs.detach()[0].token_target(),
        HostFiberTokenTarget::Instance
    );
    store
        .host_tokens()
        .validate(
            refs.detach()[0].token(),
            refs.detach()[0].root(),
            refs.detach()[0].fiber(),
            refs.detach()[0].token_phase(),
            refs.detach()[0].token_target(),
        )
        .unwrap();

    let gate = delete_commit.dom_ref_callback_commit_gate();
    assert_eq!(gate.len(), 1);
    assert_eq!(gate.records()[0].fiber(), current_inner);
    assert_eq!(gate.records()[0].token(), refs.detach()[0].token());
    assert!(!gate.callback_refs_invoked());
    assert!(!gate.object_refs_mutated());
    assert!(!gate.react_dom_ref_compatibility_claimed());

    let mut expected_operations = operations_before_apply;
    expected_operations.push("remove_child");
    expected_operations.push("detach_deleted_instance");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn host_work_deletion_executes_passive_destroy_before_host_cleanup_with_ref_order_evidence() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let mut hook_store = FunctionComponentHookRenderStore::new();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(186));
    let fixture = attach_detached_host_subtree_with_passive_cleanup_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        &mut hook_store,
        "deleted passive subtree",
    );
    let deleted_host_child = FakeHostChild::Instance(
        detached_hosts
            .instance(fixture.deleted_host_state_node)
            .unwrap()
            .id(),
    );
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(187), None).unwrap();
    let delete_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let work_parent = delete_host_component_under_host_parent_for_commit(
        &mut store,
        delete_render.finished_work(),
        fixture.host_parent,
        fixture.deleted_host,
    );
    let deleted_passive_handoff = queue_function_component_deleted_subtree_pending_passive_effects(
        &mut store,
        root_id,
        &hook_store,
        work_parent,
        fixture.deleted_host,
        Lanes::DEFAULT,
    )
    .unwrap();
    let queued_passive = deleted_passive_handoff.records()[0];
    let mut delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
    delete_commit
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[
            deleted_passive_handoff,
        ])
        .unwrap();
    let operations_before_apply = host.operations();
    let mut destroy_executor = RecordingDeletedSubtreeDestroyExecutor::default();
    let passive_flush =
        flush_passive_effects_after_commit_with_deleted_subtree_destroy_executor_for_canary(
            &mut store,
            &delete_commit,
            &mut destroy_executor,
        )
        .unwrap();
    let detach_apply = apply_test_host_root_deletion_subtree_host_detachment_for_canary(
        &store,
        &mut host,
        &delete_commit,
        &mut detached_hosts,
    )
    .unwrap();
    let cleanup_apply = apply_test_host_root_deletion_cleanup(
        &store,
        &mut host,
        &delete_commit,
        &mut detached_hosts,
    )
    .unwrap();
    let execution_snapshot =
        materialize_test_host_root_deletion_ref_passive_cleanup_execution_for_canary(
            &delete_commit,
            &passive_flush,
            &detach_apply,
            &cleanup_apply,
        );

    assert_eq!(delete_commit.mutation_apply_log().records().len(), 1);
    assert_eq!(
        delete_commit.mutation_apply_log().records()[0].kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(
        delete_commit.mutation_apply_log().records()[0].parent(),
        work_parent
    );
    assert_eq!(
        delete_commit.mutation_apply_log().records()[0].parent_state_node(),
        fixture.host_parent_state_node
    );
    assert_eq!(
        delete_commit.mutation_apply_log().records()[0].fiber(),
        fixture.deleted_host
    );
    assert_eq!(detach_apply.root(), root_id);
    assert_eq!(detach_apply.finished_work(), delete_commit.finished_work());
    assert_eq!(
        detach_apply.status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
    );
    assert!(!detach_apply.public_unmount_compatibility_claimed());
    assert!(!detach_apply.broad_host_teardown_enabled());
    assert_eq!(detach_apply.plan().deleted_root(), fixture.deleted_host);
    assert_eq!(detach_apply.plan().host_parent(), work_parent);
    assert_eq!(
        detach_apply.plan().host_parent_state_node(),
        fixture.host_parent_state_node
    );
    assert_eq!(detach_apply.plan().host_child(), fixture.deleted_host);
    assert_eq!(
        detach_apply.plan().host_child_tag(),
        FiberTag::HostComponent
    );
    assert_eq!(
        detach_apply.plan().host_child_state_node(),
        fixture.deleted_host_state_node
    );
    assert_eq!(detach_apply.plan().cleanup_sequence(), 1);
    assert_eq!(detach_apply.plan().cleanup_order_sequence(), 3);

    let refs = delete_commit.ref_commit_metadata();
    assert_eq!(refs.attach().len(), 0);
    assert_eq!(refs.detach().len(), 1);
    assert_eq!(refs.detach()[0].fiber(), fixture.deleted_host);
    assert_eq!(
        refs.detach()[0].state_node(),
        fixture.deleted_host_state_node
    );
    assert_eq!(refs.detach()[0].ref_handle(), fixture.deleted_host_ref);
    assert_eq!(
        refs.detach()[0].detach_reason(),
        Some(HostRootRefDetachReason::Deleted)
    );
    assert_eq!(
        refs.detach()[0].token_phase(),
        HostFiberTokenPhase::Deletion
    );
    assert_eq!(
        refs.detach()[0].token_target(),
        HostFiberTokenTarget::Instance
    );

    let cleanup_gate = delete_commit.ref_cleanup_return_execution_gate();
    assert_eq!(cleanup_gate.len(), 1);
    assert_eq!(cleanup_gate.cleanup_return_execution_gate_count(), 1);
    assert_eq!(cleanup_gate.records()[0].fiber(), fixture.deleted_host);
    assert_eq!(cleanup_gate.records()[0].token(), refs.detach()[0].token());
    assert!(cleanup_gate.records()[0].cleanup_return_execution_gate());
    assert!(!cleanup_gate.cleanup_return_callbacks_invoked());

    assert_eq!(passive_flush.status(), PassiveEffectsFlushStatus::Flushed);
    assert!(passive_flush.consumed_pending_passive());
    assert_eq!(passive_flush.records().len(), 1);
    assert_eq!(passive_flush.records()[0].fiber(), fixture.deleted_function);
    assert_eq!(
        passive_flush.records()[0].phase(),
        PendingPassiveEffectPhase::Unmount
    );
    assert_eq!(
        passive_flush.records()[0].unmount_origin(),
        Some(PendingPassiveUnmountOrigin::DeletedSubtree {
            nearest_mounted_ancestor: work_parent
        })
    );
    assert_eq!(
        passive_flush.records()[0].destroy_callback(),
        Some(fixture.passive_destroy)
    );
    assert!(passive_flush.records()[0].destroy_callback_invoked());
    assert!(passive_flush.did_execute_destroy_callbacks());
    assert_eq!(passive_flush.destroy_callback_executions().len(), 1);
    assert_eq!(destroy_executor.calls().len(), 1);
    let destroy_execution = passive_flush.destroy_callback_executions()[0];
    assert_eq!(destroy_execution.fiber(), fixture.deleted_function);
    assert_eq!(
        destroy_execution.pending_order(),
        queued_passive.unmount_order()
    );
    assert_eq!(
        destroy_execution.destroy_callback(),
        fixture.passive_destroy
    );
    assert_eq!(destroy_executor.calls()[0], destroy_execution.request());
    assert!(!passive_flush.public_effect_execution_enabled());
    assert!(!passive_flush.public_act_compatibility_claimed());
    assert!(!passive_flush.scheduler_driven_passive_execution_enabled());

    assert_eq!(cleanup_apply.records().len(), 2);
    assert_eq!(cleanup_apply.applied_record_count(), 2);
    assert_eq!(
        cleanup_apply.records()[0].cleanup().fiber(),
        fixture.deleted_text
    );
    assert_eq!(
        cleanup_apply.records()[0].status(),
        TestHostRootDeletionCleanupStatus::Applied(
            TestHostRootDeletionCleanupAction::InvalidateDeletedText
        )
    );
    assert_eq!(
        cleanup_apply.records()[1].cleanup().fiber(),
        fixture.deleted_host
    );
    assert_eq!(
        cleanup_apply.records()[1].status(),
        TestHostRootDeletionCleanupStatus::Applied(
            TestHostRootDeletionCleanupAction::DetachDeletedInstance
        )
    );
    assert!(
        !detached_hosts
            .text_metadata(fixture.deleted_text_state_node)
            .unwrap()
            .is_active()
    );
    assert!(
        !detached_hosts
            .instance_metadata(fixture.deleted_host_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(
        detached_hosts
            .nodes
            .text(
                fixture.deleted_text_state_node,
                detached_hosts
                    .scope(
                        fixture.deleted_text_state_node,
                        HostFiberTokenTarget::TextInstance
                    )
                    .unwrap()
            )
            .unwrap_err()
            .violation(),
        HostNodeViolation::Stale
    );
    assert_eq!(
        detached_hosts
            .nodes
            .instance(
                fixture.deleted_host_state_node,
                detached_hosts
                    .scope(
                        fixture.deleted_host_state_node,
                        HostFiberTokenTarget::Instance
                    )
                    .unwrap()
            )
            .unwrap_err()
            .violation(),
        HostNodeViolation::Stale
    );
    assert!(
        detached_hosts
            .instance(fixture.host_parent_state_node)
            .unwrap()
            .children()
            .contains(&deleted_host_child)
    );

    let order_gate = delete_commit.deletion_cleanup_order_gate_for_canary();
    assert_eq!(order_gate.len(), 4);
    assert_eq!(order_gate.ref_cleanup_return_count(), 1);
    assert_eq!(order_gate.passive_destroy_count(), 1);
    assert_eq!(order_gate.host_node_cleanup_count(), 2);
    assert_eq!(
        order_gate
            .records()
            .iter()
            .map(|record| record.phase())
            .collect::<Vec<_>>(),
        vec![
            HostRootDeletionCleanupOrderPhase::RefCleanupReturn,
            HostRootDeletionCleanupOrderPhase::PassiveDestroy,
            HostRootDeletionCleanupOrderPhase::HostNodeCleanup,
            HostRootDeletionCleanupOrderPhase::HostNodeCleanup,
        ]
    );
    assert_eq!(order_gate.records()[0].fiber(), fixture.deleted_host);
    assert_eq!(
        order_gate.records()[0].ref_cleanup_return_sequence(),
        Some(0)
    );
    assert_eq!(order_gate.records()[1].fiber(), fixture.deleted_function);
    assert_eq!(
        order_gate.records()[1].passive_unmount_order(),
        Some(queued_passive.unmount_order())
    );
    assert_eq!(
        order_gate.records()[1].passive_destroy(),
        Some(fixture.passive_destroy)
    );
    assert_eq!(order_gate.records()[2].fiber(), fixture.deleted_text);
    assert_eq!(order_gate.records()[2].host_cleanup_sequence(), Some(0));
    assert_eq!(order_gate.records()[3].fiber(), fixture.deleted_host);
    assert_eq!(order_gate.records()[3].host_cleanup_sequence(), Some(1));
    assert!(!order_gate.ref_cleanup_return_callbacks_invoked());
    assert!(!order_gate.passive_destroy_callbacks_invoked());
    assert!(!order_gate.public_effects_flushed());
    assert!(!order_gate.public_ref_or_effect_compatibility_claimed());
    assert!(
        !delete_commit
            .host_node_deletion_cleanup_log()
            .public_unmount_compatibility_claimed()
    );

    assert_eq!(execution_snapshot.len(), 5);
    assert_eq!(execution_snapshot.ref_cleanup_return_gate_count(), 1);
    assert_eq!(execution_snapshot.passive_destroy_execution_count(), 1);
    assert_eq!(execution_snapshot.host_subtree_detachment_count(), 1);
    assert_eq!(execution_snapshot.host_cleanup_apply_count(), 2);
    assert!(execution_snapshot.private_passive_destroy_callbacks_invoked());
    assert!(execution_snapshot.private_host_subtree_detachment_applied());
    assert!(!execution_snapshot.public_unmount_compatibility_claimed());
    assert!(!execution_snapshot.public_ref_or_effect_compatibility_claimed());
    assert_eq!(
        execution_snapshot
            .records()
            .iter()
            .map(|record| record.sequence())
            .collect::<Vec<_>>(),
        vec![0, 1, 2, 3, 4]
    );
    assert_eq!(
        execution_snapshot
            .records()
            .iter()
            .map(|record| record.phase())
            .collect::<Vec<_>>(),
        vec![
            TestHostRootDeletionRefPassiveCleanupExecutionPhase::RefCleanupReturnGate,
            TestHostRootDeletionRefPassiveCleanupExecutionPhase::PassiveDestroyCallback,
            TestHostRootDeletionRefPassiveCleanupExecutionPhase::HostSubtreeDetach,
            TestHostRootDeletionRefPassiveCleanupExecutionPhase::HostNodeCleanup,
            TestHostRootDeletionRefPassiveCleanupExecutionPhase::HostNodeCleanup,
        ]
    );
    assert_eq!(
        execution_snapshot.records()[0].fiber(),
        fixture.deleted_host
    );
    assert_eq!(
        execution_snapshot.records()[0].deleted_root(),
        fixture.deleted_host
    );
    assert_eq!(
        execution_snapshot.records()[0].ref_cleanup_return_sequence(),
        Some(0)
    );
    assert_eq!(
        execution_snapshot.records()[0].passive_destroy_execution_order(),
        None
    );
    assert_eq!(
        execution_snapshot.records()[1].fiber(),
        fixture.deleted_function
    );
    assert_eq!(
        execution_snapshot.records()[1].deleted_root(),
        fixture.deleted_host
    );
    assert_eq!(
        execution_snapshot.records()[1].ref_cleanup_return_sequence(),
        None
    );
    assert_eq!(
        execution_snapshot.records()[1].passive_destroy_execution_order(),
        Some(0)
    );
    assert_eq!(
        execution_snapshot.records()[2].fiber(),
        fixture.deleted_host
    );
    assert_eq!(
        execution_snapshot.records()[2].host_detachment_cleanup_order_sequence(),
        Some(3)
    );
    assert_eq!(
        execution_snapshot.records()[2].host_cleanup_sequence(),
        None
    );
    assert_eq!(
        execution_snapshot.records()[3].fiber(),
        fixture.deleted_text
    );
    assert_eq!(
        execution_snapshot.records()[3].host_cleanup_sequence(),
        Some(0)
    );
    assert_eq!(
        execution_snapshot.records()[4].fiber(),
        fixture.deleted_host
    );
    assert_eq!(
        execution_snapshot.records()[4].host_cleanup_sequence(),
        Some(1)
    );

    let mut expected_operations = operations_before_apply;
    expected_operations.push("remove_child");
    expected_operations.push("detach_deleted_instance");
    assert_eq!(host.operations(), expected_operations);
    assert!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .pending_passive()
            .is_empty()
    );
    assert_eq!(queued_passive.create(), fixture.passive_create);
    assert_eq!(queued_passive.destroy(), Some(fixture.passive_destroy));
    assert_eq!(queued_passive.dependencies(), fixture.passive_dependencies);
}

#[test]
fn host_work_deletion_detaches_fragment_host_child_after_cleanup_order_validation() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(86));
    let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "fragment deleted",
    );
    let parent_state_node = store
        .fiber_arena()
        .get(current_parent)
        .unwrap()
        .state_node();
    let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    let fragment = wrap_current_host_child_in_deleted_root(
        &mut store,
        current_parent,
        current_text,
        FiberTag::Fragment,
        StateNodeHandle::NONE,
    );
    update_container(&mut store, root_id, RootElementHandle::from_raw(87), None).unwrap();
    let delete_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let work_parent = delete_non_host_root_under_host_parent_for_commit(
        &mut store,
        delete_render.finished_work(),
        current_parent,
        fragment,
        None,
    );
    let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
    let operations_before_detach = host.operations();
    let detach_apply = apply_test_host_root_deletion_subtree_host_detachment_for_canary(
        &store,
        &mut host,
        &delete_commit,
        &mut detached_hosts,
    )
    .unwrap();
    let cleanup_apply = apply_test_host_root_deletion_cleanup(
        &store,
        &mut host,
        &delete_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(delete_commit.deletion_lists().len(), 1);
    assert_eq!(delete_commit.deletion_lists()[0].deleted(), &[fragment]);
    assert_eq!(delete_commit.mutation_apply_log().records().len(), 1);
    assert_eq!(
        delete_commit.mutation_apply_log().records()[0].kind(),
        HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber
    );
    assert_eq!(
        delete_commit
            .deletion_cleanup_order_gate_for_canary()
            .host_node_cleanup_count(),
        1
    );

    assert_eq!(detach_apply.root(), root_id);
    assert_eq!(detach_apply.finished_work(), delete_commit.finished_work());
    assert_eq!(
        detach_apply.status(),
        TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
    );
    assert!(!detach_apply.public_unmount_compatibility_claimed());
    assert!(!detach_apply.broad_host_teardown_enabled());
    let plan = detach_apply.plan();
    assert_eq!(plan.deleted_root(), fragment);
    assert_eq!(plan.deleted_root_tag(), FiberTag::Fragment);
    assert_eq!(plan.parent(), work_parent);
    assert_eq!(plan.host_parent(), work_parent);
    assert_eq!(plan.host_parent_state_node(), parent_state_node);
    assert_eq!(plan.host_child(), current_text);
    assert_eq!(plan.host_child_tag(), FiberTag::HostText);
    assert_eq!(plan.host_child_state_node(), text_state_node);
    assert_eq!(plan.host_child_traversal_depth(), 1);
    assert_eq!(plan.cleanup_sequence(), 0);
    assert_eq!(plan.cleanup_order_sequence(), 0);

    assert_eq!(cleanup_apply.records().len(), 1);
    assert_eq!(cleanup_apply.records()[0].cleanup().fiber(), current_text);
    assert_eq!(
        cleanup_apply.records()[0].status(),
        TestHostRootDeletionCleanupStatus::Applied(
            TestHostRootDeletionCleanupAction::InvalidateDeletedText
        )
    );
    assert!(
        !detached_hosts
            .text_metadata(text_state_node)
            .unwrap()
            .is_active()
    );

    let mut expected_operations = operations_before_detach;
    expected_operations.push("remove_child");
    assert_eq!(host.operations(), expected_operations);
}

#[test]
fn host_work_deletion_rejects_portal_and_suspense_roots_for_subtree_host_detachment() {
    for blocked_tag in [FiberTag::Portal, FiberTag::Suspense] {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(88));
        let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "blocked deleted root",
        );
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let deleted_root = wrap_current_host_child_in_deleted_root(
            &mut store,
            current_parent,
            current_text,
            blocked_tag,
            if blocked_tag == FiberTag::Portal {
                StateNodeHandle::from_raw(9_090)
            } else {
                StateNodeHandle::NONE
            },
        );
        update_container(&mut store, root_id, RootElementHandle::from_raw(89), None).unwrap();
        let delete_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        delete_non_host_root_under_host_parent_for_commit(
            &mut store,
            delete_render.finished_work(),
            current_parent,
            deleted_root,
            None,
        );
        let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
        let operations_before_detach = host.operations();

        let error = apply_test_host_root_deletion_subtree_host_detachment_for_canary(
            &store,
            &mut host,
            &delete_commit,
            &mut detached_hosts,
        )
        .unwrap_err();

        match (blocked_tag, error) {
            (
                FiberTag::Portal,
                HostWorkError::DeletionSubtreeHostDetachmentPlan(
                    HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::PortalDeletedRootBlocked {
                        deleted_root: actual,
                        ..
                    },
                ),
            ) => assert_eq!(actual, deleted_root),
            (
                FiberTag::Suspense,
                HostWorkError::DeletionSubtreeHostDetachmentPlan(
                    HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::SuspenseDeletedRootBlocked {
                        deleted_root: actual,
                        tag,
                        ..
                    },
                ),
            ) => {
                assert_eq!(actual, deleted_root);
                assert_eq!(tag, FiberTag::Suspense);
            }
            (_, other) => panic!("unexpected detachment error: {other:?}"),
        }
        assert_eq!(host.operations(), operations_before_detach);
    }
}

#[test]
fn host_work_deletion_rejects_nested_portal_and_suspense_boundaries_before_detachment() {
    for blocked_tag in [FiberTag::Portal, FiberTag::Suspense] {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut detached_hosts = DetachedHostRecords::default();
        let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(94));
        let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            create_render.finished_work(),
            "nested blocked boundary",
        );
        let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
        apply_test_host_root_commit_mutations(
            &mut store,
            &mut host,
            &create_commit,
            &mut detached_hosts,
        )
        .unwrap();

        let blocked = wrap_current_host_child_in_deleted_root(
            &mut store,
            current_parent,
            current_text,
            blocked_tag,
            if blocked_tag == FiberTag::Portal {
                StateNodeHandle::from_raw(9_091)
            } else {
                StateNodeHandle::NONE
            },
        );
        let fragment = wrap_current_host_child_in_deleted_root(
            &mut store,
            current_parent,
            blocked,
            FiberTag::Fragment,
            StateNodeHandle::NONE,
        );
        update_container(&mut store, root_id, RootElementHandle::from_raw(95), None).unwrap();
        let delete_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        delete_non_host_root_under_host_parent_for_commit(
            &mut store,
            delete_render.finished_work(),
            current_parent,
            fragment,
            None,
        );
        let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
        let operations_before_detach = host.operations();

        let error = apply_test_host_root_deletion_subtree_host_detachment_for_canary(
            &store,
            &mut host,
            &delete_commit,
            &mut detached_hosts,
        )
        .unwrap_err();

        match (blocked_tag, error) {
            (
                FiberTag::Portal,
                HostWorkError::DeletionSubtreeHostDetachmentPlan(
                    HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::PortalDeletedSubtreeBlocked {
                        deleted_root,
                        portal,
                        ..
                    },
                ),
            ) => {
                assert_eq!(deleted_root, fragment);
                assert_eq!(portal, blocked);
            }
            (
                FiberTag::Suspense,
                HostWorkError::DeletionSubtreeHostDetachmentPlan(
                    HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::SuspenseDeletedSubtreeBlocked {
                        deleted_root,
                        fiber,
                        tag,
                        ..
                    },
                ),
            ) => {
                assert_eq!(deleted_root, fragment);
                assert_eq!(fiber, blocked);
                assert_eq!(tag, FiberTag::Suspense);
            }
            (_, other) => panic!("unexpected nested boundary error: {other:?}"),
        }
        assert_eq!(host.operations(), operations_before_detach);
    }
}

#[test]
fn host_work_deletion_rejects_stale_deleted_host_child_before_detachment() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(90));
    let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "stale deleted root",
    );
    let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();
    let fragment = wrap_current_host_child_in_deleted_root(
        &mut store,
        current_parent,
        current_text,
        FiberTag::Fragment,
        StateNodeHandle::NONE,
    );
    update_container(&mut store, root_id, RootElementHandle::from_raw(91), None).unwrap();
    let delete_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    delete_non_host_root_under_host_parent_for_commit(
        &mut store,
        delete_render.finished_work(),
        current_parent,
        fragment,
        None,
    );
    let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
    apply_test_host_root_deletion_cleanup(&store, &mut host, &delete_commit, &mut detached_hosts)
        .unwrap();
    let operations_before_detach = host.operations();

    let error = apply_test_host_root_deletion_subtree_host_detachment_for_canary(
        &store,
        &mut host,
        &delete_commit,
        &mut detached_hosts,
    )
    .unwrap_err();

    assert!(
        !detached_hosts
            .text_metadata(text_state_node)
            .unwrap()
            .is_active()
    );
    assert_eq!(host.operations(), operations_before_detach);
    match error {
        HostWorkError::HostNode(error) => {
            assert_eq!(error.violation(), HostNodeViolation::Stale);
        }
        other => panic!("unexpected stale detachment error: {other:?}"),
    }
}

#[test]
fn host_work_deletion_rejects_wrong_parent_handle_for_subtree_host_detachment() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(92));
    let (current_parent, current_text) = attach_detached_root_element_with_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "wrong parent",
    );
    let text_state_node = store.fiber_arena().get(current_text).unwrap().state_node();
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();
    let fragment = wrap_current_host_child_in_deleted_root(
        &mut store,
        current_parent,
        current_text,
        FiberTag::Fragment,
        StateNodeHandle::NONE,
    );
    update_container(&mut store, root_id, RootElementHandle::from_raw(93), None).unwrap();
    let delete_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    delete_non_host_root_under_host_parent_for_commit(
        &mut store,
        delete_render.finished_work(),
        current_parent,
        fragment,
        Some(text_state_node),
    );
    let delete_commit = commit_finished_host_root(&mut store, delete_render).unwrap();
    let operations_before_detach = host.operations();

    let error = apply_test_host_root_deletion_subtree_host_detachment_for_canary(
        &store,
        &mut host,
        &delete_commit,
        &mut detached_hosts,
    )
    .unwrap_err();

    assert_eq!(host.operations(), operations_before_detach);
    match error {
        HostWorkError::HostNode(error) => {
            assert_eq!(error.violation(), HostNodeViolation::WrongTarget);
        }
        other => panic!("unexpected wrong-parent detachment error: {other:?}"),
    }
}

#[test]
fn host_work_leaves_host_parent_deletion_recorded_only_without_host_handles() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(75));
    let mode = store
        .fiber_arena()
        .get(render.finished_work())
        .unwrap()
        .mode();
    let parent = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(9030),
        mode,
    );
    let deleted = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(9031),
        mode,
    );
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(parent, deleted)
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(render.finished_work(), &[parent])
        .unwrap();
    complete_host_root(&mut store, render.finished_work()).unwrap();

    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let operations_before_apply = host.operations();
    let apply =
        apply_test_host_root_commit_mutations(&mut store, &mut host, &commit, &mut detached_hosts)
            .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::RecordedOnly
    );
    assert_eq!(apply.applied_host_call_count(), 0);
    assert_eq!(host.operations(), operations_before_apply);
}

#[test]
fn host_work_leaves_root_text_update_apply_record_recorded_only() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut detached_hosts = DetachedHostRecords::default();
    let create_render = render_test_root(&mut store, root_id, RootElementHandle::from_raw(76));
    let current_text = attach_detached_root_text_for_commit(
        &mut store,
        &mut host,
        &mut detached_hosts,
        root_id,
        create_render.finished_work(),
        "before",
        FiberFlags::PLACEMENT,
    );
    let create_commit = commit_finished_host_root(&mut store, create_render).unwrap();
    apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &create_commit,
        &mut detached_hosts,
    )
    .unwrap();

    update_container(&mut store, root_id, RootElementHandle::from_raw(77), None).unwrap();
    let update_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let updated_text = update_root_text_for_commit_without_payload(
        &mut store,
        update_render.finished_work(),
        current_text,
        PropsHandle::from_raw(9002),
    );
    let update_commit = commit_finished_host_root(&mut store, update_render).unwrap();
    let operations_before_apply = host.operations();
    let apply = apply_test_host_root_commit_mutations(
        &mut store,
        &mut host,
        &update_commit,
        &mut detached_hosts,
    )
    .unwrap();

    assert_eq!(apply.records().len(), 1);
    assert_eq!(apply.records()[0].mutation().fiber(), updated_text);
    assert_eq!(
        apply.records()[0].mutation().kind(),
        HostRootMutationApplyRecordKind::CommitHostTextUpdate
    );
    assert_eq!(
        apply.records()[0].status(),
        TestHostRootMutationApplyStatus::RecordedOnly
    );
    assert_eq!(apply.applied_host_call_count(), 0);
    assert_eq!(host.operations(), operations_before_apply);
}

#[test]
fn host_work_does_not_mutate_container_switch_current_or_finish_work() {
    let (mut store, root_id) = root_store();
    let mut host = RecordingHost::default();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("div", "detached");
    let current = store.root(root_id).unwrap().current();
    let render = render_test_root(&mut store, root_id, element);

    let result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();

    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(result.work_in_progress)
    );

    let operations = host.operations();
    for forbidden in [
        "prepare_for_commit",
        "reset_after_commit",
        "append_child",
        "append_child_to_container",
        "insert_before",
        "insert_in_container_before",
        "remove_child",
        "remove_child_from_container",
        "clear_container",
    ] {
        assert!(
            !operations.contains(&forbidden),
            "host work unexpectedly called {forbidden}"
        );
    }
    assert!(operations.contains(&"append_initial_child"));
}
