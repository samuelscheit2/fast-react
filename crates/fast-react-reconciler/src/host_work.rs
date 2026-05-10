//! Private test-only HostRoot/HostComponent/HostText work skeleton.
//!
//! This module intentionally uses the tiny `test_support` element source. It
//! exercises reconciler-owned topology, detached host creation, state-node
//! handles owned by the private host-node store, and bubbling without exposing
//! a public renderer or committing to a root container.

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

use crate::host_nodes::{HostNodeMetadata, HostNodeScope, HostNodeStore, HostNodeValidationError};
use crate::test_support::{
    FakeHostFiberToken, FakeInstance, FakeTextInstance, RecordingHost, TestHostElement,
    TestHostNode, TestHostText, TestHostTree,
};
use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError, HostFiberTokenStore,
    HostFiberTokenValidationError, HostRootRenderPhaseRecord, RootElementHandle, RootOptions,
    render_host_root_for_lanes, update_container,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostWorkError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    Host(HostError),
    HostFiberToken(HostFiberTokenValidationError),
    HostNode(HostNodeValidationError),
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
            Self::HostFiberToken(error) => Display::fmt(error, formatter),
            Self::HostNode(error) => Display::fmt(error, formatter),
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
            Self::HostFiberToken(error) => Some(error),
            Self::HostNode(error) => Some(error),
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

impl From<HostFiberTokenValidationError> for HostWorkError {
    fn from(error: HostFiberTokenValidationError) -> Self {
        Self::HostFiberToken(error)
    }
}

impl From<HostNodeValidationError> for HostWorkError {
    fn from(error: HostNodeValidationError) -> Self {
        Self::HostNode(error)
    }
}

#[derive(Default)]
struct DetachedHostRecords {
    nodes: HostNodeStore<RecordingHost>,
    scopes: Vec<Option<HostNodeScope>>,
}

impl fmt::Debug for DetachedHostRecords {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter
            .debug_struct("DetachedHostRecords")
            .field("instance_count", &self.instance_count())
            .field("text_count", &self.text_count())
            .finish()
    }
}

impl DetachedHostRecords {
    fn insert_instance(&mut self, scope: HostNodeScope, instance: FakeInstance) -> StateNodeHandle {
        let handle = self.nodes.insert_instance(scope, instance);
        self.remember_scope(handle, scope);
        handle
    }

    fn insert_text(&mut self, scope: HostNodeScope, text: FakeTextInstance) -> StateNodeHandle {
        let handle = self.nodes.insert_text(scope, text);
        self.remember_scope(handle, scope);
        handle
    }

    fn instance(&self, handle: StateNodeHandle) -> Result<&FakeInstance, HostWorkError> {
        let scope = self.scope(handle, HostFiberTokenTarget::Instance)?;
        Ok(self.nodes.instance(handle, scope)?)
    }

    fn text(&self, handle: StateNodeHandle) -> Result<&FakeTextInstance, HostWorkError> {
        let scope = self.scope(handle, HostFiberTokenTarget::TextInstance)?;
        Ok(self.nodes.text(handle, scope)?)
    }

    fn instance_metadata(
        &self,
        handle: StateNodeHandle,
    ) -> Result<HostNodeMetadata, HostWorkError> {
        let scope = self.scope(handle, HostFiberTokenTarget::Instance)?;
        Ok(self.nodes.instance_metadata(handle, scope)?)
    }

    fn text_metadata(&self, handle: StateNodeHandle) -> Result<HostNodeMetadata, HostWorkError> {
        let scope = self.scope(handle, HostFiberTokenTarget::TextInstance)?;
        Ok(self.nodes.text_metadata(handle, scope)?)
    }

    fn instance_count(&self) -> usize {
        self.nodes.instance_count()
    }

    fn text_count(&self) -> usize {
        self.nodes.text_count()
    }

    fn append_initial_child(
        &self,
        tokens: &HostFiberTokenStore,
        host: &mut RecordingHost,
        parent: &mut FakeInstance,
        root_id: FiberRootId,
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
                let scope = self.validated_scope(
                    tokens,
                    state_node,
                    root_id,
                    child_fiber.id(),
                    HostFiberTokenTarget::Instance,
                )?;
                let child = self.nodes.instance(state_node, scope)?;
                host.append_initial_child(parent, HostChild::Instance(child))?;
            }
            FiberTag::HostText => {
                let scope = self.validated_scope(
                    tokens,
                    state_node,
                    root_id,
                    child_fiber.id(),
                    HostFiberTokenTarget::TextInstance,
                )?;
                let child = self.nodes.text(state_node, scope)?;
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

    fn remember_scope(&mut self, handle: StateNodeHandle, scope: HostNodeScope) {
        let index = (handle.raw() - 1) as usize;
        if self.scopes.len() <= index {
            self.scopes.resize(index + 1, None);
        }
        self.scopes[index] = Some(scope);
    }

    fn validated_scope(
        &self,
        tokens: &HostFiberTokenStore,
        handle: StateNodeHandle,
        root_id: FiberRootId,
        fiber_id: FiberId,
        target: HostFiberTokenTarget,
    ) -> Result<HostNodeScope, HostWorkError> {
        let stored_scope = self.scope(handle, target)?;
        let lookup_scope = HostNodeScope::new(
            root_id,
            fiber_id,
            stored_scope.token_id(),
            stored_scope.phase(),
        );
        tokens.validate(
            lookup_scope.token_id(),
            lookup_scope.root_id(),
            lookup_scope.fiber_id(),
            lookup_scope.phase(),
            target,
        )?;
        Ok(lookup_scope)
    }

    fn scope(
        &self,
        handle: StateNodeHandle,
        target: HostFiberTokenTarget,
    ) -> Result<HostNodeScope, HostWorkError> {
        if handle.is_none() {
            return Err(Self::invalid_handle(handle, target));
        }

        self.scopes
            .get((handle.raw() - 1) as usize)
            .copied()
            .flatten()
            .ok_or_else(|| Self::invalid_handle(handle, target))
    }

    fn invalid_handle(handle: StateNodeHandle, target: HostFiberTokenTarget) -> HostWorkError {
        match target {
            HostFiberTokenTarget::Instance => HostWorkError::InvalidDetachedInstance { handle },
            HostFiberTokenTarget::TextInstance => HostWorkError::InvalidDetachedText { handle },
            _ => HostWorkError::InvalidDetachedInstance { handle },
        }
    }
}

#[derive(Debug)]
pub(crate) struct HostWorkResult {
    root: FiberRootId,
    work_in_progress: FiberId,
    root_child: Option<FiberId>,
    detached_hosts: DetachedHostRecords,
}

impl HostWorkResult {
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    pub(crate) const fn work_in_progress(&self) -> FiberId {
        self.work_in_progress
    }

    pub(crate) const fn root_child(&self) -> Option<FiberId> {
        self.root_child
    }

    pub(crate) fn detached_instance_count(&self) -> usize {
        self.detached_hosts.instance_count()
    }

    pub(crate) fn detached_text_count(&self) -> usize {
        self.detached_hosts.text_count()
    }

    fn detached_hosts(&self) -> &DetachedHostRecords {
        &self.detached_hosts
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct HostTextUpdateDiff {
    current: FiberId,
    work_in_progress: FiberId,
    state_node: StateNodeHandle,
    metadata: HostNodeMetadata,
    old_text: String,
    new_text: String,
    changed: bool,
}

impl HostTextUpdateDiff {
    #[must_use]
    const fn current(&self) -> FiberId {
        self.current
    }

    #[must_use]
    const fn work_in_progress(&self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    const fn state_node(&self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    const fn metadata(&self) -> HostNodeMetadata {
        self.metadata
    }

    #[must_use]
    fn old_text(&self) -> &str {
        &self.old_text
    }

    #[must_use]
    fn new_text(&self) -> &str {
        &self.new_text
    }

    #[must_use]
    const fn changed(&self) -> bool {
        self.changed
    }
}

pub(crate) fn mount_test_host_work(
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

fn update_test_host_text_work(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    current: FiberId,
    text: &TestHostText,
    render_lanes: Lanes,
    detached_hosts: &DetachedHostRecords,
) -> Result<HostTextUpdateDiff, HostWorkError> {
    expect_tag(store, current, FiberTag::HostText)?;
    let work_in_progress = store
        .fiber_arena_mut()
        .create_work_in_progress(current, text.props())?;
    {
        let node = store.fiber_arena_mut().get_mut(work_in_progress)?;
        node.set_lanes(render_lanes);
    }

    complete_host_text_update(
        store,
        root_id,
        current,
        work_in_progress,
        text,
        detached_hosts,
    )
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
    let scope =
        issue_creation_host_node_scope(store, root_id, fiber, HostFiberTokenTarget::Instance)?;
    let token = FakeHostFiberToken(scope.token_id().raw());
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
        detached_hosts.append_initial_child(
            store.host_tokens(),
            host,
            &mut instance,
            root_id,
            child_fiber,
        )?;
    }

    let finalization = host.finalize_initial_children(
        &mut instance,
        &element.ty(),
        &(),
        container,
        parent_context,
    )?;
    let state_node = detached_hosts.insert_instance(scope, instance);
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
    let scope =
        issue_creation_host_node_scope(store, root_id, fiber, HostFiberTokenTarget::TextInstance)?;
    let token = FakeHostFiberToken(scope.token_id().raw());
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
    let state_node = detached_hosts.insert_text(scope, text_instance);
    complete_fiber_common(
        store,
        fiber,
        text.props(),
        state_node,
        InitialChildrenFinalization::NoCommitMount,
    )
}

fn complete_host_text_update(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    current: FiberId,
    work_in_progress: FiberId,
    text: &TestHostText,
    detached_hosts: &DetachedHostRecords,
) -> Result<HostTextUpdateDiff, HostWorkError> {
    expect_tag(store, current, FiberTag::HostText)?;
    expect_tag(store, work_in_progress, FiberTag::HostText)?;
    store
        .fiber_arena()
        .validate_alternate_pair(current, work_in_progress)?;

    let state_node = store.fiber_arena().get(work_in_progress)?.state_node();
    if state_node.is_none() {
        return Err(HostWorkError::MissingStateNode {
            fiber: work_in_progress,
            tag: FiberTag::HostText,
        });
    }

    let scope = detached_hosts.validated_scope(
        store.host_tokens(),
        state_node,
        root_id,
        current,
        HostFiberTokenTarget::TextInstance,
    )?;
    let metadata = detached_hosts.nodes.text_metadata(state_node, scope)?;
    let old_text = detached_hosts
        .nodes
        .text(state_node, scope)?
        .text()
        .to_owned();
    let new_text = text.text().to_owned();
    let changed = old_text != new_text;

    if changed {
        store
            .fiber_arena_mut()
            .get_mut(work_in_progress)?
            .merge_flags(FiberFlags::UPDATE);
    }
    complete_fiber_common(
        store,
        work_in_progress,
        text.props(),
        state_node,
        InitialChildrenFinalization::NoCommitMount,
    )?;

    Ok(HostTextUpdateDiff {
        current,
        work_in_progress,
        state_node,
        metadata,
        old_text,
        new_text,
        changed,
    })
}

fn issue_creation_host_node_scope(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    fiber: FiberId,
    target: HostFiberTokenTarget,
) -> Result<HostNodeScope, HostWorkError> {
    let token_id =
        store
            .host_tokens_mut()
            .issue(root_id, fiber, HostFiberTokenPhase::Creation, target);
    store.host_tokens().validate(
        token_id,
        root_id,
        fiber,
        HostFiberTokenPhase::Creation,
        target,
    )?;
    Ok(HostNodeScope::new(
        root_id,
        fiber,
        token_id,
        HostFiberTokenPhase::Creation,
    ))
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
    use crate::host_nodes::HostNodeViolation;
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

    fn text_from_root(source: &TestHostTree, element: RootElementHandle) -> &TestHostText {
        match source.root(element).unwrap() {
            TestHostNode::Text(text) => text,
            TestHostNode::Element(_) => panic!("expected text root"),
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
    fn host_work_host_text_update_records_changed_diff_through_host_node_store() {
        let (mut store, root_id) = root_store();
        let mut host = RecordingHost::default();
        let mut source = TestHostTree::new();
        let element = source.insert_host_element_with_text("span", "before");
        let render = render_test_root(&mut store, root_id, element);
        let result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();
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
            result.detached_hosts(),
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
        let result = mount_test_host_work(&mut store, &mut host, render, &source).unwrap();
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
            result.detached_hosts(),
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
