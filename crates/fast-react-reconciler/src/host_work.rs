//! Private test-only HostRoot/HostComponent/HostText work skeleton.
//!
//! This module intentionally uses the tiny `test_support` element source. It
//! exercises reconciler-owned topology, detached host creation, state-node
//! handles, and bubbling without exposing a public renderer or committing to a
//! root container.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    FiberFlags, FiberId, FiberTag, FiberTopologyError, Lanes, PropsHandle, StateNodeHandle,
    bubble_properties,
};
use fast_react_host_config::{
    HostChild, HostCreation, HostError, HostFiberTokenPhase, HostFiberTokenRef,
    HostFiberTokenTarget, HostIdentityAndContext, InitialChildrenFinalization,
};

use crate::test_support::{
    FakeHostFiberToken, FakeInstance, FakeTextInstance, RecordingHost, TestHostElement,
    TestHostNode, TestHostText, TestHostTree,
};
use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError, HostRootRenderPhaseRecord, RootElementHandle,
    RootOptions, render_host_root_for_lanes, update_container,
};

#[derive(Debug, Clone, PartialEq, Eq)]
enum HostWorkError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    Host(HostError),
    MissingTestRootElement {
        handle: RootElementHandle,
    },
    ExpectedFiberTag {
        fiber: FiberId,
        expected: FiberTag,
        actual: FiberTag,
    },
    MissingStateNode {
        fiber: FiberId,
        tag: FiberTag,
    },
    InvalidDetachedInstance {
        handle: StateNodeHandle,
    },
    InvalidDetachedText {
        handle: StateNodeHandle,
    },
}

impl Display for HostWorkError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::Host(error) => Display::fmt(error, formatter),
            Self::MissingTestRootElement { handle } => write!(
                formatter,
                "test host element handle {} is not registered",
                handle.raw()
            ),
            Self::ExpectedFiberTag {
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "fiber {} must be {:?}, found {:?}",
                fiber.slot().get(),
                expected,
                actual
            ),
            Self::MissingStateNode { fiber, tag } => write!(
                formatter,
                "{:?} fiber {} has no detached host state node",
                tag,
                fiber.slot().get()
            ),
            Self::InvalidDetachedInstance { handle } => write!(
                formatter,
                "detached host instance handle {} is invalid",
                handle.raw()
            ),
            Self::InvalidDetachedText { handle } => write!(
                formatter,
                "detached host text handle {} is invalid",
                handle.raw()
            ),
        }
    }
}

impl Error for HostWorkError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::Host(error) => Some(error),
            Self::MissingTestRootElement { .. }
            | Self::ExpectedFiberTag { .. }
            | Self::MissingStateNode { .. }
            | Self::InvalidDetachedInstance { .. }
            | Self::InvalidDetachedText { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for HostWorkError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<FiberTopologyError> for HostWorkError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<HostError> for HostWorkError {
    fn from(error: HostError) -> Self {
        Self::Host(error)
    }
}

#[derive(Debug, Default)]
struct DetachedHostRecords {
    instances: Vec<FakeInstance>,
    texts: Vec<FakeTextInstance>,
}

impl DetachedHostRecords {
    fn insert_instance(&mut self, instance: FakeInstance) -> StateNodeHandle {
        let handle = StateNodeHandle::from_raw(self.instances.len() as u64 + 1);
        self.instances.push(instance);
        handle
    }

    fn insert_text(&mut self, text: FakeTextInstance) -> StateNodeHandle {
        let handle = StateNodeHandle::from_raw(self.texts.len() as u64 + 1);
        self.texts.push(text);
        handle
    }

    fn instance(&self, handle: StateNodeHandle) -> Result<&FakeInstance, HostWorkError> {
        if handle.is_none() {
            return Err(HostWorkError::InvalidDetachedInstance { handle });
        }

        self.instances
            .get((handle.raw() - 1) as usize)
            .ok_or(HostWorkError::InvalidDetachedInstance { handle })
    }

    fn text(&self, handle: StateNodeHandle) -> Result<&FakeTextInstance, HostWorkError> {
        if handle.is_none() {
            return Err(HostWorkError::InvalidDetachedText { handle });
        }

        self.texts
            .get((handle.raw() - 1) as usize)
            .ok_or(HostWorkError::InvalidDetachedText { handle })
    }

    fn instance_count(&self) -> usize {
        self.instances.len()
    }

    fn text_count(&self) -> usize {
        self.texts.len()
    }

    fn append_initial_child(
        &self,
        host: &mut RecordingHost,
        parent: &mut FakeInstance,
        child_fiber: &fast_react_core::FiberNode,
    ) -> Result<(), HostWorkError> {
        let state_node = child_fiber.state_node();
        if state_node.is_none() {
            return Err(HostWorkError::MissingStateNode {
                fiber: child_fiber.id(),
                tag: child_fiber.tag(),
            });
        }

        match child_fiber.tag() {
            FiberTag::HostComponent => {
                let child = self.instance(state_node)?;
                host.append_initial_child(parent, HostChild::Instance(child))?;
            }
            FiberTag::HostText => {
                let child = self.text(state_node)?;
                host.append_initial_child(parent, HostChild::Text(child))?;
            }
            actual => {
                return Err(HostWorkError::ExpectedFiberTag {
                    fiber: child_fiber.id(),
                    expected: FiberTag::HostComponent,
                    actual,
                });
            }
        }

        Ok(())
    }
}

#[derive(Debug)]
struct HostWorkResult {
    root: FiberRootId,
    work_in_progress: FiberId,
    root_child: Option<FiberId>,
    detached_hosts: DetachedHostRecords,
}

impl HostWorkResult {
    fn detached_hosts(&self) -> &DetachedHostRecords {
        &self.detached_hosts
    }
}

fn mount_test_host_work(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
) -> Result<HostWorkResult, HostWorkError> {
    expect_tag(store, render.work_in_progress(), FiberTag::HostRoot)?;
    let container = *store.root(render.root())?.container_info();
    let mut detached_hosts = DetachedHostRecords::default();
    let root_child = match source.root(render.resulting_element()) {
        Some(node) => {
            host.root_host_context(&container)?;
            let child = begin_test_host_node(
                store,
                host,
                &container,
                render.root(),
                render.work_in_progress(),
                node,
                &(),
                true,
                render.render_lanes(),
                &mut detached_hosts,
            )?;
            store
                .fiber_arena_mut()
                .set_children(render.work_in_progress(), &[child])?;
            Some(child)
        }
        None if render.resulting_element().is_none() => {
            store
                .fiber_arena_mut()
                .set_children(render.work_in_progress(), &[])?;
            None
        }
        None => {
            return Err(HostWorkError::MissingTestRootElement {
                handle: render.resulting_element(),
            });
        }
    };

    complete_host_root(store, render.work_in_progress())?;

    Ok(HostWorkResult {
        root: render.root(),
        work_in_progress: render.work_in_progress(),
        root_child,
        detached_hosts,
    })
}

#[allow(clippy::too_many_arguments)]
fn begin_test_host_node(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    container: &crate::test_support::FakeContainer,
    root_id: FiberRootId,
    parent: FiberId,
    node: &TestHostNode,
    parent_context: &(),
    is_root_child: bool,
    render_lanes: Lanes,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<FiberId, HostWorkError> {
    match node {
        TestHostNode::Element(element) => begin_host_component(
            store,
            host,
            container,
            root_id,
            parent,
            element,
            parent_context,
            is_root_child,
            render_lanes,
            detached_hosts,
        ),
        TestHostNode::Text(text) => begin_host_text(
            store,
            host,
            container,
            root_id,
            parent,
            text,
            parent_context,
            is_root_child,
            render_lanes,
            detached_hosts,
        ),
    }
}

#[allow(clippy::too_many_arguments)]
fn begin_host_component(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    container: &crate::test_support::FakeContainer,
    root_id: FiberRootId,
    parent: FiberId,
    element: &TestHostElement,
    parent_context: &(),
    is_root_child: bool,
    render_lanes: Lanes,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<FiberId, HostWorkError> {
    let mode = store.fiber_arena().get(parent)?.mode();
    let fiber =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostComponent, None, element.props(), mode);
    {
        let node = store.fiber_arena_mut().get_mut(fiber)?;
        node.set_element_type(element.element_type());
        node.set_lanes(render_lanes);
        if is_root_child {
            node.merge_flags(FiberFlags::PLACEMENT);
        }
    }

    host.child_host_context(parent_context, &element.ty(), &())?;
    let should_set_text_content = host.should_set_text_content(&element.ty(), &(), parent_context);
    if should_set_text_content {
        store.fiber_arena_mut().set_children(fiber, &[])?;
    } else {
        let mut children = Vec::new();
        for child in element.children() {
            children.push(begin_test_host_node(
                store,
                host,
                container,
                root_id,
                fiber,
                child,
                &(),
                false,
                render_lanes,
                detached_hosts,
            )?);
        }
        store.fiber_arena_mut().set_children(fiber, &children)?;
    }

    complete_host_component(
        store,
        host,
        container,
        root_id,
        fiber,
        element,
        parent_context,
        detached_hosts,
    )?;
    Ok(fiber)
}

#[allow(clippy::too_many_arguments)]
fn begin_host_text(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    container: &crate::test_support::FakeContainer,
    root_id: FiberRootId,
    parent: FiberId,
    text: &TestHostText,
    parent_context: &(),
    is_root_child: bool,
    render_lanes: Lanes,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<FiberId, HostWorkError> {
    let mode = store.fiber_arena().get(parent)?.mode();
    let fiber = store
        .fiber_arena_mut()
        .create_fiber(FiberTag::HostText, None, text.props(), mode);
    {
        let node = store.fiber_arena_mut().get_mut(fiber)?;
        node.set_lanes(render_lanes);
        if is_root_child {
            node.merge_flags(FiberFlags::PLACEMENT);
        }
    }

    complete_host_text(
        store,
        host,
        container,
        root_id,
        fiber,
        text,
        parent_context,
        detached_hosts,
    )?;
    Ok(fiber)
}

#[allow(clippy::too_many_arguments)]
fn complete_host_component(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    container: &crate::test_support::FakeContainer,
    root_id: FiberRootId,
    fiber: FiberId,
    element: &TestHostElement,
    parent_context: &(),
    detached_hosts: &mut DetachedHostRecords,
) -> Result<(), HostWorkError> {
    let token_id = store.host_tokens_mut().issue(
        root_id,
        fiber,
        HostFiberTokenPhase::Creation,
        HostFiberTokenTarget::Instance,
    );
    let token = FakeHostFiberToken(token_id.raw());
    let mut instance = host.create_instance(
        HostFiberTokenRef::new(
            &token,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::Instance,
        ),
        &element.ty(),
        &(),
        container,
        parent_context,
    )?;

    for child in store.fiber_arena().child_ids(fiber)? {
        let child_fiber = store.fiber_arena().get(child)?;
        detached_hosts.append_initial_child(host, &mut instance, child_fiber)?;
    }

    let finalization = host.finalize_initial_children(
        &mut instance,
        &element.ty(),
        &(),
        container,
        parent_context,
    )?;
    let state_node = detached_hosts.insert_instance(instance);
    complete_fiber_common(store, fiber, element.props(), state_node, finalization)
}

#[allow(clippy::too_many_arguments)]
fn complete_host_text(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    container: &crate::test_support::FakeContainer,
    root_id: FiberRootId,
    fiber: FiberId,
    text: &TestHostText,
    parent_context: &(),
    detached_hosts: &mut DetachedHostRecords,
) -> Result<(), HostWorkError> {
    let token_id = store.host_tokens_mut().issue(
        root_id,
        fiber,
        HostFiberTokenPhase::Creation,
        HostFiberTokenTarget::TextInstance,
    );
    let token = FakeHostFiberToken(token_id.raw());
    let text_instance = host.create_text_instance(
        HostFiberTokenRef::new(
            &token,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        ),
        text.text(),
        container,
        parent_context,
    )?;
    let state_node = detached_hosts.insert_text(text_instance);
    complete_fiber_common(
        store,
        fiber,
        text.props(),
        state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
}

fn complete_fiber_common(
    store: &mut FiberRootStore<RecordingHost>,
    fiber: FiberId,
    memoized_props: PropsHandle,
    state_node: StateNodeHandle,
    finalization: InitialChildrenFinalization,
) -> Result<(), HostWorkError> {
    let bubbled = bubble_properties(store.fiber_arena(), fiber)?;
    let node = store.fiber_arena_mut().get_mut(fiber)?;
    node.set_state_node(state_node);
    node.set_memoized_props(memoized_props);
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());
    if matches!(finalization, InitialChildrenFinalization::CommitMount) {
        node.merge_flags(FiberFlags::UPDATE);
    }
    Ok(())
}

fn complete_host_root(
    store: &mut FiberRootStore<RecordingHost>,
    fiber: FiberId,
) -> Result<(), HostWorkError> {
    let bubbled = bubble_properties(store.fiber_arena(), fiber)?;
    let node = store.fiber_arena_mut().get_mut(fiber)?;
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());
    Ok(())
}

fn expect_tag(
    store: &FiberRootStore<RecordingHost>,
    fiber: FiberId,
    expected: FiberTag,
) -> Result<(), HostWorkError> {
    let actual = store.fiber_arena().get(fiber)?.tag();
    if actual == expected {
        Ok(())
    } else {
        Err(HostWorkError::ExpectedFiberTag {
            fiber,
            expected,
            actual,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::{FakeContainer, FakeHostChild};

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
        assert_eq!(root.child_lanes(), Lanes::DEFAULT);
        assert!(root.subtree_flags().contains_all(FiberFlags::PLACEMENT));

        let component_node = store.fiber_arena().get(component).unwrap();
        let text = component_node.child().unwrap();
        assert_eq!(component_node.tag(), FiberTag::HostComponent);
        assert!(component_node.flags().contains_all(FiberFlags::PLACEMENT));
        assert_eq!(component_node.child_lanes(), Lanes::DEFAULT);
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
        assert_eq!(root.child_lanes(), Lanes::DEFAULT);
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
}
