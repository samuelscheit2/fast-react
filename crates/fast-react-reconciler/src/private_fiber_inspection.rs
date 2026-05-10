//! Read-only committed fiber inspection for Rust test-renderer canaries.
//!
//! This is a private diagnostic boundary: it describes the current committed
//! fiber topology and intentionally does not expose renderer host nodes.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    ElementTypeHandle, FiberFlags, FiberId, FiberNode, FiberTag, FiberTopologyError, Lanes,
    PropsHandle, StateHandle, UpdateQueueHandle,
};
use fast_react_host_config::HostTypes;

use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError, HostRootStateStoreError, RootElementHandle,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererCommittedFiberInspectionError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    HostRootStateStore(HostRootStateStoreError),
    ExpectedFiberTag {
        fiber: FiberId,
        expected: FiberTag,
        actual: FiberTag,
    },
    UnexpectedChildCount {
        fiber: FiberId,
        tag: FiberTag,
        expected: usize,
        actual: usize,
    },
    MissingStateNode {
        fiber: FiberId,
        tag: FiberTag,
    },
    HostRootStateNodeMismatch {
        root: FiberRootId,
        fiber: FiberId,
    },
}

impl Display for TestRendererCommittedFiberInspectionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::HostRootStateStore(error) => Display::fmt(error, formatter),
            Self::ExpectedFiberTag {
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "committed test-renderer fiber {} must be {:?}, found {:?}",
                fiber.slot().get(),
                expected,
                actual
            ),
            Self::UnexpectedChildCount {
                fiber,
                tag,
                expected,
                actual,
            } => write!(
                formatter,
                "committed test-renderer {:?} fiber {} must have {expected} child fiber(s), found {actual}",
                tag,
                fiber.slot().get()
            ),
            Self::MissingStateNode { fiber, tag } => write!(
                formatter,
                "committed test-renderer {:?} fiber {} has no state node",
                tag,
                fiber.slot().get()
            ),
            Self::HostRootStateNodeMismatch { root, fiber } => write!(
                formatter,
                "committed test-renderer HostRoot fiber {} does not point at root {}",
                fiber.slot().get(),
                root.raw()
            ),
        }
    }
}

impl Error for TestRendererCommittedFiberInspectionError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::HostRootStateStore(error) => Some(error),
            Self::ExpectedFiberTag { .. }
            | Self::UnexpectedChildCount { .. }
            | Self::MissingStateNode { .. }
            | Self::HostRootStateNodeMismatch { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for TestRendererCommittedFiberInspectionError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<FiberTopologyError> for TestRendererCommittedFiberInspectionError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<HostRootStateStoreError> for TestRendererCommittedFiberInspectionError {
    fn from(error: HostRootStateStoreError) -> Self {
        Self::HostRootStateStore(error)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererCommittedFiberNodeInspection {
    fiber: FiberId,
    tag: FiberTag,
    parent: Option<FiberId>,
    child: Option<FiberId>,
    sibling: Option<FiberId>,
    index: usize,
    alternate: Option<FiberId>,
    element_type: ElementTypeHandle,
    pending_props: PropsHandle,
    memoized_props: PropsHandle,
    memoized_state: StateHandle,
    update_queue: UpdateQueueHandle,
    lanes: Lanes,
    child_lanes: Lanes,
    flags: FiberFlags,
    subtree_flags: FiberFlags,
    state_node_present: bool,
}

impl TestRendererCommittedFiberNodeInspection {
    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub const fn parent(self) -> Option<FiberId> {
        self.parent
    }

    #[must_use]
    pub const fn child(self) -> Option<FiberId> {
        self.child
    }

    #[must_use]
    pub const fn sibling(self) -> Option<FiberId> {
        self.sibling
    }

    #[must_use]
    pub const fn index(self) -> usize {
        self.index
    }

    #[must_use]
    pub const fn alternate(self) -> Option<FiberId> {
        self.alternate
    }

    #[must_use]
    pub const fn element_type(self) -> ElementTypeHandle {
        self.element_type
    }

    #[must_use]
    pub const fn pending_props(self) -> PropsHandle {
        self.pending_props
    }

    #[must_use]
    pub const fn memoized_props(self) -> PropsHandle {
        self.memoized_props
    }

    #[must_use]
    pub const fn memoized_state(self) -> StateHandle {
        self.memoized_state
    }

    #[must_use]
    pub const fn update_queue(self) -> UpdateQueueHandle {
        self.update_queue
    }

    #[must_use]
    pub const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub const fn child_lanes(self) -> Lanes {
        self.child_lanes
    }

    #[must_use]
    pub const fn flags(self) -> FiberFlags {
        self.flags
    }

    #[must_use]
    pub const fn subtree_flags(self) -> FiberFlags {
        self.subtree_flags
    }

    #[must_use]
    pub const fn state_node_present(self) -> bool {
        self.state_node_present
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererCommittedFiberTreeInspection {
    root: FiberRootId,
    current: FiberId,
    resulting_element: RootElementHandle,
    host_root: TestRendererCommittedFiberNodeInspection,
    host_component: TestRendererCommittedFiberNodeInspection,
    host_text: TestRendererCommittedFiberNodeInspection,
}

impl TestRendererCommittedFiberTreeInspection {
    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn current(&self) -> FiberId {
        self.current
    }

    #[must_use]
    pub const fn resulting_element(&self) -> RootElementHandle {
        self.resulting_element
    }

    #[must_use]
    pub const fn host_root(&self) -> TestRendererCommittedFiberNodeInspection {
        self.host_root
    }

    #[must_use]
    pub const fn host_component(&self) -> TestRendererCommittedFiberNodeInspection {
        self.host_component
    }

    #[must_use]
    pub const fn host_text(&self) -> TestRendererCommittedFiberNodeInspection {
        self.host_text
    }
}

pub fn inspect_test_renderer_committed_fiber_tree<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
) -> Result<TestRendererCommittedFiberTreeInspection, TestRendererCommittedFiberInspectionError> {
    let root = store.root(root_id)?;
    let current = root.current();
    let host_root_node = store.fiber_arena().get(current)?;
    expect_fiber_tag(host_root_node, FiberTag::HostRoot)?;
    validate_host_root_state_node(root_id, host_root_node)?;
    let resulting_element = store
        .host_root_states()
        .get(host_root_node.memoized_state())?
        .element();
    let host_root = inspect_node(host_root_node);

    let root_children = expect_child_count(store, current, 1)?;
    let component_id = root_children[0];
    let component_node = store.fiber_arena().get(component_id)?;
    expect_fiber_tag(component_node, FiberTag::HostComponent)?;
    expect_state_node_present(component_node)?;
    let host_component = inspect_node(component_node);

    let component_children = expect_child_count(store, component_id, 1)?;
    let text_id = component_children[0];
    let text_node = store.fiber_arena().get(text_id)?;
    expect_fiber_tag(text_node, FiberTag::HostText)?;
    expect_state_node_present(text_node)?;
    expect_child_count(store, text_id, 0)?;
    let host_text = inspect_node(text_node);

    Ok(TestRendererCommittedFiberTreeInspection {
        root: root_id,
        current,
        resulting_element,
        host_root,
        host_component,
        host_text,
    })
}

fn inspect_node(node: &FiberNode) -> TestRendererCommittedFiberNodeInspection {
    TestRendererCommittedFiberNodeInspection {
        fiber: node.id(),
        tag: node.tag(),
        parent: node.return_fiber(),
        child: node.child(),
        sibling: node.sibling(),
        index: node.index(),
        alternate: node.alternate(),
        element_type: node.element_type(),
        pending_props: node.pending_props(),
        memoized_props: node.memoized_props(),
        memoized_state: node.memoized_state(),
        update_queue: node.update_queue(),
        lanes: node.lanes(),
        child_lanes: node.child_lanes(),
        flags: node.flags(),
        subtree_flags: node.subtree_flags(),
        state_node_present: !node.state_node().is_none(),
    }
}

fn expect_fiber_tag(
    node: &FiberNode,
    expected: FiberTag,
) -> Result<(), TestRendererCommittedFiberInspectionError> {
    let actual = node.tag();
    if actual == expected {
        Ok(())
    } else {
        Err(
            TestRendererCommittedFiberInspectionError::ExpectedFiberTag {
                fiber: node.id(),
                expected,
                actual,
            },
        )
    }
}

fn validate_host_root_state_node(
    root: FiberRootId,
    node: &FiberNode,
) -> Result<(), TestRendererCommittedFiberInspectionError> {
    if node.state_node().is_none() {
        return Err(
            TestRendererCommittedFiberInspectionError::MissingStateNode {
                fiber: node.id(),
                tag: node.tag(),
            },
        );
    }

    if node.state_node() != root.state_node_handle() {
        return Err(
            TestRendererCommittedFiberInspectionError::HostRootStateNodeMismatch {
                root,
                fiber: node.id(),
            },
        );
    }

    Ok(())
}

fn expect_state_node_present(
    node: &FiberNode,
) -> Result<(), TestRendererCommittedFiberInspectionError> {
    if node.state_node().is_none() {
        Err(
            TestRendererCommittedFiberInspectionError::MissingStateNode {
                fiber: node.id(),
                tag: node.tag(),
            },
        )
    } else {
        Ok(())
    }
}

fn expect_child_count<H: HostTypes>(
    store: &FiberRootStore<H>,
    fiber: FiberId,
    expected: usize,
) -> Result<Vec<FiberId>, TestRendererCommittedFiberInspectionError> {
    let children = store.fiber_arena().child_ids(fiber)?;
    if children.len() == expected {
        return Ok(children);
    }

    let tag = store.fiber_arena().get(fiber)?.tag();
    Err(
        TestRendererCommittedFiberInspectionError::UnexpectedChildCount {
            fiber,
            tag,
            expected,
            actual: children.len(),
        },
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        RootOptions, TestRendererHostOutputCanaryFixture, commit_finished_host_root,
        finish_test_renderer_host_output_canary_fibers,
        prepare_test_renderer_host_output_canary_fibers, render_host_root_for_lanes,
        update_container,
    };
    use fast_react_core::{ElementTypeHandle, Lanes, PropsHandle};

    struct Host;

    impl HostTypes for Host {
        type HostFiberToken = u64;
        type Type = ();
        type Props = ();
        type Container = ();
        type Instance = ();
        type TextInstance = ();
        type PublicInstance = ();
        type HostContext = ();
        type UpdatePayload = ();
        type TimeoutHandle = ();
        type NoTimeout = ();
        type CommitState = ();
        type EventPriority = ();
        type EventType = ();
        type EventTimestamp = ();
        type ActivityInstance = ();
        type SuspenseInstance = ();
        type HydratableInstance = ();
        type FormInstance = ();
        type ChildSet = ();
        type Resource = ();
        type HoistableRoot = ();
        type TransitionStatus = ();
        type SuspendedState = ();
        type RunningViewTransition = ();
        type ViewTransitionInstance = ();
        type InstanceMeasurement = ();
        type EventResponder = ();
        type GestureTimeline = ();
        type FragmentInstance = ();
        type RendererInspectionConfig = ();
    }

    fn root_store() -> (FiberRootStore<Host>, FiberRootId) {
        let mut store = FiberRootStore::<Host>::new();
        let root_id = store.create_client_root((), RootOptions::new()).unwrap();
        (store, root_id)
    }

    #[test]
    fn committed_fiber_inspection_describes_host_root_component_and_text() {
        let (mut store, root_id) = root_store();
        let element = RootElementHandle::from_raw(7);
        let fixture = TestRendererHostOutputCanaryFixture::new(7, 41, 42);

        update_container(&mut store, root_id, element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let prepared =
            prepare_test_renderer_host_output_canary_fibers(&mut store, render, fixture).unwrap();
        finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 101, 102).unwrap();
        let commit = commit_finished_host_root(&mut store, render).unwrap();

        let inspection = inspect_test_renderer_committed_fiber_tree(&store, root_id).unwrap();
        let host_root = inspection.host_root();
        let component = inspection.host_component();
        let text = inspection.host_text();

        assert_eq!(inspection.root(), root_id);
        assert_eq!(inspection.current(), commit.current());
        assert_eq!(inspection.resulting_element(), element);
        assert_eq!(host_root.fiber(), commit.current());
        assert_eq!(host_root.tag(), FiberTag::HostRoot);
        assert_eq!(host_root.parent(), None);
        assert_eq!(host_root.child(), Some(component.fiber()));
        assert_eq!(host_root.sibling(), None);
        assert!(host_root.state_node_present());
        assert_eq!(component.tag(), FiberTag::HostComponent);
        assert_eq!(component.parent(), Some(host_root.fiber()));
        assert_eq!(component.child(), Some(text.fiber()));
        assert_eq!(component.sibling(), None);
        assert_eq!(component.index(), 0);
        assert_eq!(component.element_type(), ElementTypeHandle::from_raw(7));
        assert_eq!(component.pending_props(), PropsHandle::from_raw(41));
        assert_eq!(component.memoized_props(), PropsHandle::from_raw(41));
        assert!(component.state_node_present());
        assert_eq!(text.tag(), FiberTag::HostText);
        assert_eq!(text.parent(), Some(component.fiber()));
        assert_eq!(text.child(), None);
        assert_eq!(text.sibling(), None);
        assert_eq!(text.index(), 0);
        assert_eq!(text.pending_props(), PropsHandle::from_raw(42));
        assert_eq!(text.memoized_props(), PropsHandle::from_raw(42));
        assert!(text.state_node_present());
    }

    #[test]
    fn committed_fiber_inspection_rejects_empty_current_host_root() {
        let (store, root_id) = root_store();

        let error = inspect_test_renderer_committed_fiber_tree(&store, root_id).unwrap_err();

        assert!(matches!(
            error,
            TestRendererCommittedFiberInspectionError::UnexpectedChildCount {
                fiber: _,
                tag: FiberTag::HostRoot,
                expected: 1,
                actual: 0
            }
        ));
    }
}
