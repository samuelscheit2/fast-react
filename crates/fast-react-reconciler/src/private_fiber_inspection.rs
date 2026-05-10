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
    UnsupportedShape {
        fiber: FiberId,
        tag: FiberTag,
        reason: &'static str,
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
            Self::UnsupportedShape { fiber, tag, reason } => write!(
                formatter,
                "committed test-renderer {:?} fiber {} has unsupported private inspection shape: {reason}",
                tag,
                fiber.slot().get()
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
            | Self::HostRootStateNodeMismatch { .. }
            | Self::UnsupportedShape { .. } => None,
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
    shape_name: &'static str,
    nodes: Vec<TestRendererCommittedFiberNodeInspection>,
    root_children: Vec<TestRendererCommittedFiberNodeInspection>,
    host_children: Vec<TestRendererCommittedFiberNodeInspection>,
    function_component: Option<TestRendererCommittedFiberNodeInspection>,
    host_components: Vec<TestRendererCommittedFiberNodeInspection>,
    host_texts: Vec<TestRendererCommittedFiberNodeInspection>,
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
    pub const fn shape_name(&self) -> &'static str {
        self.shape_name
    }

    #[must_use]
    pub fn nodes(&self) -> &[TestRendererCommittedFiberNodeInspection] {
        &self.nodes
    }

    #[must_use]
    pub fn root_children(&self) -> &[TestRendererCommittedFiberNodeInspection] {
        &self.root_children
    }

    #[must_use]
    pub fn host_children(&self) -> &[TestRendererCommittedFiberNodeInspection] {
        &self.host_children
    }

    #[must_use]
    pub const fn function_component(&self) -> Option<TestRendererCommittedFiberNodeInspection> {
        self.function_component
    }

    #[must_use]
    pub fn host_components(&self) -> &[TestRendererCommittedFiberNodeInspection] {
        &self.host_components
    }

    #[must_use]
    pub fn host_texts(&self) -> &[TestRendererCommittedFiberNodeInspection] {
        &self.host_texts
    }

    #[must_use]
    pub fn fiber_tag_order(&self) -> Vec<FiberTag> {
        self.nodes.iter().map(|node| node.tag()).collect()
    }

    #[must_use]
    pub fn root_child_tags(&self) -> Vec<FiberTag> {
        self.root_children.iter().map(|node| node.tag()).collect()
    }

    #[must_use]
    pub fn host_child_tags(&self) -> Vec<FiberTag> {
        self.host_children.iter().map(|node| node.tag()).collect()
    }

    #[must_use]
    pub const fn has_function_component_wrapper(&self) -> bool {
        self.function_component.is_some()
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

    let root_child_ids = expect_child_count_range(
        store,
        current,
        1,
        2,
        "HostRoot admits only one child or the accepted HostText/HostComponent sibling pair",
    )?;
    let builder = TestRendererCommittedFiberTreeInspectionBuilder::new(
        root_id,
        current,
        resulting_element,
        host_root,
    );

    match root_child_ids.as_slice() {
        [single_child] => {
            let child_node = store.fiber_arena().get(*single_child)?;
            match child_node.tag() {
                FiberTag::HostComponent => {
                    let component = inspect_host_component_with_text(store, *single_child)?;
                    builder.finish_host_component_shape(component)
                }
                FiberTag::FunctionComponent => {
                    let function_component = inspect_node(child_node);
                    let function_child_ids = expect_child_count_range(
                        store,
                        *single_child,
                        1,
                        2,
                        "FunctionComponent admits only one host child or the accepted HostText/HostComponent sibling pair",
                    )?;
                    let host_children = inspect_host_children(store, &function_child_ids)?;
                    builder.finish_function_component_shape(function_component, host_children)
                }
                actual => Err(
                    TestRendererCommittedFiberInspectionError::ExpectedFiberTag {
                        fiber: child_node.id(),
                        expected: FiberTag::HostComponent,
                        actual,
                    },
                ),
            }
        }
        [first_child, second_child] => {
            let host_children = inspect_host_children(store, &[*first_child, *second_child])?;
            builder.finish_multi_child_shape(host_children)
        }
        _ => Err(
            TestRendererCommittedFiberInspectionError::UnsupportedShape {
                fiber: host_root.fiber(),
                tag: host_root.tag(),
                reason: "HostRoot private inspection only admits one or two children",
            },
        ),
    }
}

struct TestRendererCommittedFiberTreeInspectionBuilder {
    root: FiberRootId,
    current: FiberId,
    resulting_element: RootElementHandle,
    host_root: TestRendererCommittedFiberNodeInspection,
}

impl TestRendererCommittedFiberTreeInspectionBuilder {
    const fn new(
        root: FiberRootId,
        current: FiberId,
        resulting_element: RootElementHandle,
        host_root: TestRendererCommittedFiberNodeInspection,
    ) -> Self {
        Self {
            root,
            current,
            resulting_element,
            host_root,
        }
    }

    fn finish_host_component_shape(
        self,
        component: InspectedHostComponentWithText,
    ) -> Result<TestRendererCommittedFiberTreeInspection, TestRendererCommittedFiberInspectionError>
    {
        Ok(self.finish(
            "HostRoot->HostComponent->HostText",
            vec![component.component, component.text],
            vec![component.component],
            vec![component.component],
            None,
            vec![component.component],
            vec![component.text],
            component.component,
            component.text,
        ))
    }

    fn finish_multi_child_shape(
        self,
        host_children: InspectedHostChildren,
    ) -> Result<TestRendererCommittedFiberTreeInspection, TestRendererCommittedFiberInspectionError>
    {
        Ok(self.finish(
            "HostRoot->[HostText,HostComponent->HostText]",
            host_children.nodes,
            host_children.direct.clone(),
            host_children.direct,
            None,
            vec![host_children.component],
            vec![host_children.text_sibling, host_children.component_text],
            host_children.component,
            host_children.component_text,
        ))
    }

    fn finish_function_component_shape(
        self,
        function_component: TestRendererCommittedFiberNodeInspection,
        host_children: InspectedHostChildren,
    ) -> Result<TestRendererCommittedFiberTreeInspection, TestRendererCommittedFiberInspectionError>
    {
        let shape_name = if host_children.direct.len() == 1 {
            "HostRoot->FunctionComponent->HostComponent->HostText"
        } else {
            "HostRoot->FunctionComponent->[HostText,HostComponent->HostText]"
        };
        let mut nodes = Vec::with_capacity(1 + host_children.nodes.len());
        nodes.push(function_component);
        nodes.extend(host_children.nodes.iter().copied());

        Ok(self.finish(
            shape_name,
            nodes,
            vec![function_component],
            host_children.direct,
            Some(function_component),
            vec![host_children.component],
            if host_children.has_text_sibling {
                vec![host_children.text_sibling, host_children.component_text]
            } else {
                vec![host_children.component_text]
            },
            host_children.component,
            host_children.component_text,
        ))
    }

    #[allow(clippy::too_many_arguments)]
    fn finish(
        self,
        shape_name: &'static str,
        nodes_after_root: Vec<TestRendererCommittedFiberNodeInspection>,
        root_children: Vec<TestRendererCommittedFiberNodeInspection>,
        host_children: Vec<TestRendererCommittedFiberNodeInspection>,
        function_component: Option<TestRendererCommittedFiberNodeInspection>,
        host_components: Vec<TestRendererCommittedFiberNodeInspection>,
        host_texts: Vec<TestRendererCommittedFiberNodeInspection>,
        host_component: TestRendererCommittedFiberNodeInspection,
        host_text: TestRendererCommittedFiberNodeInspection,
    ) -> TestRendererCommittedFiberTreeInspection {
        let mut nodes = Vec::with_capacity(1 + nodes_after_root.len());
        nodes.push(self.host_root);
        nodes.extend(nodes_after_root);

        TestRendererCommittedFiberTreeInspection {
            root: self.root,
            current: self.current,
            resulting_element: self.resulting_element,
            shape_name,
            nodes,
            root_children,
            host_children,
            function_component,
            host_components,
            host_texts,
            host_root: self.host_root,
            host_component,
            host_text,
        }
    }
}

#[derive(Debug, Clone)]
struct InspectedHostComponentWithText {
    component: TestRendererCommittedFiberNodeInspection,
    text: TestRendererCommittedFiberNodeInspection,
}

#[derive(Debug, Clone)]
struct InspectedHostChildren {
    direct: Vec<TestRendererCommittedFiberNodeInspection>,
    nodes: Vec<TestRendererCommittedFiberNodeInspection>,
    component: TestRendererCommittedFiberNodeInspection,
    component_text: TestRendererCommittedFiberNodeInspection,
    text_sibling: TestRendererCommittedFiberNodeInspection,
    has_text_sibling: bool,
}

fn inspect_host_children<H: HostTypes>(
    store: &FiberRootStore<H>,
    child_ids: &[FiberId],
) -> Result<InspectedHostChildren, TestRendererCommittedFiberInspectionError> {
    match child_ids {
        [component_id] => {
            let component = inspect_host_component_with_text(store, *component_id)?;
            Ok(InspectedHostChildren {
                direct: vec![component.component],
                nodes: vec![component.component, component.text],
                component: component.component,
                component_text: component.text,
                text_sibling: component.text,
                has_text_sibling: false,
            })
        }
        [text_id, component_id] => {
            let text_node = store.fiber_arena().get(*text_id)?;
            expect_fiber_tag(text_node, FiberTag::HostText)?;
            expect_state_node_present(text_node)?;
            expect_child_count(store, *text_id, 0)?;
            let text_sibling = inspect_node(text_node);
            let component = inspect_host_component_with_text(store, *component_id)?;

            Ok(InspectedHostChildren {
                direct: vec![text_sibling, component.component],
                nodes: vec![text_sibling, component.component, component.text],
                component: component.component,
                component_text: component.text,
                text_sibling,
                has_text_sibling: true,
            })
        }
        _ => Err(
            TestRendererCommittedFiberInspectionError::UnsupportedShape {
                fiber: child_ids[0],
                tag: FiberTag::HostRoot,
                reason: "private host children must be HostComponent or HostText plus HostComponent",
            },
        ),
    }
}

fn inspect_host_component_with_text<H: HostTypes>(
    store: &FiberRootStore<H>,
    component_id: FiberId,
) -> Result<InspectedHostComponentWithText, TestRendererCommittedFiberInspectionError> {
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

    Ok(InspectedHostComponentWithText {
        component: host_component,
        text: host_text,
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

fn expect_child_count_range<H: HostTypes>(
    store: &FiberRootStore<H>,
    fiber: FiberId,
    min: usize,
    max: usize,
    reason: &'static str,
) -> Result<Vec<FiberId>, TestRendererCommittedFiberInspectionError> {
    let children = store.fiber_arena().child_ids(fiber)?;
    if (min..=max).contains(&children.len()) {
        return Ok(children);
    }

    let node = store.fiber_arena().get(fiber)?;
    if children.len() < min {
        return Err(
            TestRendererCommittedFiberInspectionError::UnexpectedChildCount {
                fiber,
                tag: node.tag(),
                expected: min,
                actual: children.len(),
            },
        );
    }

    Err(
        TestRendererCommittedFiberInspectionError::UnsupportedShape {
            fiber,
            tag: node.tag(),
            reason,
        },
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        HostRootRenderPhaseRecord, RootOptions, TestRendererHostOutputCanaryFixture,
        commit_finished_host_root, finish_test_renderer_host_output_canary_fibers,
        prepare_test_renderer_host_output_canary_fibers, render_host_root_for_lanes,
        update_container,
    };
    use fast_react_core::{ElementTypeHandle, Lanes, PropsHandle, StateNodeHandle};

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

    #[derive(Debug, Clone, Copy)]
    struct CommittedShapeFibers {
        function_component: Option<FiberId>,
        first_text: Option<FiberId>,
        component: FiberId,
        component_text: FiberId,
    }

    fn prepare_render(
        store: &mut FiberRootStore<Host>,
        root_id: FiberRootId,
        element: RootElementHandle,
    ) -> HostRootRenderPhaseRecord {
        update_container(store, root_id, element, None).unwrap();
        render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap()
    }

    fn create_host_component_fiber(
        store: &mut FiberRootStore<Host>,
        host_root: FiberId,
        element_type_raw: u64,
        props_raw: u64,
        state_node_raw: u64,
    ) -> FiberId {
        let mode = store.fiber_arena().get(host_root).unwrap().mode();
        let component = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(props_raw),
            mode,
        );
        let node = store.fiber_arena_mut().get_mut(component).unwrap();
        node.set_element_type(ElementTypeHandle::from_raw(element_type_raw));
        node.set_memoized_props(PropsHandle::from_raw(props_raw));
        node.set_state_node(StateNodeHandle::from_raw(state_node_raw));
        component
    }

    fn create_host_text_fiber(
        store: &mut FiberRootStore<Host>,
        host_root: FiberId,
        props_raw: u64,
        state_node_raw: u64,
    ) -> FiberId {
        let mode = store.fiber_arena().get(host_root).unwrap().mode();
        let text = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(props_raw),
            mode,
        );
        let node = store.fiber_arena_mut().get_mut(text).unwrap();
        node.set_memoized_props(PropsHandle::from_raw(props_raw));
        node.set_state_node(StateNodeHandle::from_raw(state_node_raw));
        text
    }

    fn create_function_component_fiber(
        store: &mut FiberRootStore<Host>,
        host_root: FiberId,
        element_type_raw: u64,
        props_raw: u64,
    ) -> FiberId {
        let mode = store.fiber_arena().get(host_root).unwrap().mode();
        let function_component = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(props_raw),
            mode,
        );
        let node = store.fiber_arena_mut().get_mut(function_component).unwrap();
        node.set_element_type(ElementTypeHandle::from_raw(element_type_raw));
        node.set_memoized_props(PropsHandle::from_raw(props_raw));
        function_component
    }

    fn commit_multi_child_host_shape(
        store: &mut FiberRootStore<Host>,
        render: HostRootRenderPhaseRecord,
    ) -> CommittedShapeFibers {
        let host_root = render.work_in_progress();
        let first_text = create_host_text_fiber(store, host_root, 51, 151);
        let component = create_host_component_fiber(store, host_root, 52, 53, 152);
        let component_text = create_host_text_fiber(store, host_root, 54, 153);
        store
            .fiber_arena_mut()
            .set_children(component, &[component_text])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[first_text, component])
            .unwrap();
        commit_finished_host_root(store, render).unwrap();
        CommittedShapeFibers {
            function_component: None,
            first_text: Some(first_text),
            component,
            component_text,
        }
    }

    fn commit_function_component_shape(
        store: &mut FiberRootStore<Host>,
        render: HostRootRenderPhaseRecord,
        multi_child: bool,
    ) -> CommittedShapeFibers {
        let host_root = render.work_in_progress();
        let function_component = create_function_component_fiber(store, host_root, 61, 62);
        let component = create_host_component_fiber(store, host_root, 63, 64, 163);
        let component_text = create_host_text_fiber(store, host_root, 65, 164);
        store
            .fiber_arena_mut()
            .set_children(component, &[component_text])
            .unwrap();
        let first_text = if multi_child {
            let text = create_host_text_fiber(store, host_root, 66, 165);
            store
                .fiber_arena_mut()
                .set_children(function_component, &[text, component])
                .unwrap();
            Some(text)
        } else {
            store
                .fiber_arena_mut()
                .set_children(function_component, &[component])
                .unwrap();
            None
        };
        store
            .fiber_arena_mut()
            .set_children(host_root, &[function_component])
            .unwrap();
        commit_finished_host_root(store, render).unwrap();
        CommittedShapeFibers {
            function_component: Some(function_component),
            first_text,
            component,
            component_text,
        }
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
        assert_eq!(inspection.shape_name(), "HostRoot->HostComponent->HostText");
        assert_eq!(
            inspection.fiber_tag_order(),
            [
                FiberTag::HostRoot,
                FiberTag::HostComponent,
                FiberTag::HostText
            ]
        );
        assert_eq!(inspection.root_child_tags(), [FiberTag::HostComponent]);
        assert_eq!(inspection.host_child_tags(), [FiberTag::HostComponent]);
        assert_eq!(inspection.root_children().len(), 1);
        assert_eq!(inspection.host_children().len(), 1);
        assert_eq!(inspection.host_components().len(), 1);
        assert_eq!(inspection.host_texts().len(), 1);
        assert!(inspection.function_component().is_none());
        assert!(!inspection.has_function_component_wrapper());
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
    fn committed_fiber_inspection_describes_multi_child_host_root_shape() {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(50));
        let fibers = commit_multi_child_host_shape(&mut store, render);

        let inspection = inspect_test_renderer_committed_fiber_tree(&store, root_id).unwrap();
        let first_text = inspection.host_texts()[0];
        let component = inspection.host_component();
        let component_text = inspection.host_text();

        assert_eq!(
            inspection.shape_name(),
            "HostRoot->[HostText,HostComponent->HostText]"
        );
        assert_eq!(
            inspection.fiber_tag_order(),
            [
                FiberTag::HostRoot,
                FiberTag::HostText,
                FiberTag::HostComponent,
                FiberTag::HostText
            ]
        );
        assert_eq!(
            inspection.root_child_tags(),
            [FiberTag::HostText, FiberTag::HostComponent]
        );
        assert_eq!(
            inspection.host_child_tags(),
            [FiberTag::HostText, FiberTag::HostComponent]
        );
        assert_eq!(inspection.root_children().len(), 2);
        assert_eq!(inspection.host_children().len(), 2);
        assert_eq!(inspection.host_components().len(), 1);
        assert_eq!(inspection.host_texts().len(), 2);
        assert!(inspection.function_component().is_none());
        assert!(!inspection.has_function_component_wrapper());
        assert_eq!(first_text.fiber(), fibers.first_text.unwrap());
        assert_eq!(first_text.sibling(), Some(component.fiber()));
        assert_eq!(first_text.index(), 0);
        assert_eq!(component.fiber(), fibers.component);
        assert_eq!(component.parent(), Some(inspection.host_root().fiber()));
        assert_eq!(component.child(), Some(component_text.fiber()));
        assert_eq!(component.index(), 1);
        assert_eq!(component_text.fiber(), fibers.component_text);
        assert_eq!(component_text.parent(), Some(component.fiber()));
        assert_eq!(component_text.index(), 0);
        assert!(first_text.state_node_present());
        assert!(component.state_node_present());
        assert!(component_text.state_node_present());
    }

    #[test]
    fn committed_fiber_inspection_describes_function_component_above_host_shape() {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(60));
        let fibers = commit_function_component_shape(&mut store, render, false);

        let inspection = inspect_test_renderer_committed_fiber_tree(&store, root_id).unwrap();
        let function_component = inspection.function_component().unwrap();

        assert_eq!(
            inspection.shape_name(),
            "HostRoot->FunctionComponent->HostComponent->HostText"
        );
        assert_eq!(
            inspection.fiber_tag_order(),
            [
                FiberTag::HostRoot,
                FiberTag::FunctionComponent,
                FiberTag::HostComponent,
                FiberTag::HostText
            ]
        );
        assert_eq!(inspection.root_child_tags(), [FiberTag::FunctionComponent]);
        assert_eq!(inspection.host_child_tags(), [FiberTag::HostComponent]);
        assert_eq!(inspection.root_children().len(), 1);
        assert_eq!(inspection.host_children().len(), 1);
        assert_eq!(inspection.host_components().len(), 1);
        assert_eq!(inspection.host_texts().len(), 1);
        assert!(inspection.has_function_component_wrapper());
        assert_eq!(
            function_component.fiber(),
            fibers.function_component.unwrap()
        );
        assert_eq!(
            function_component.parent(),
            Some(inspection.host_root().fiber())
        );
        assert_eq!(
            function_component.child(),
            Some(inspection.host_component().fiber())
        );
        assert_eq!(function_component.sibling(), None);
        assert!(!function_component.state_node_present());
        assert_eq!(inspection.host_component().fiber(), fibers.component);
        assert_eq!(
            inspection.host_component().parent(),
            Some(function_component.fiber())
        );
        assert_eq!(inspection.host_text().fiber(), fibers.component_text);
    }

    #[test]
    fn committed_fiber_inspection_describes_function_component_above_multi_child_shape() {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(70));
        let fibers = commit_function_component_shape(&mut store, render, true);

        let inspection = inspect_test_renderer_committed_fiber_tree(&store, root_id).unwrap();
        let function_component = inspection.function_component().unwrap();
        let first_text = inspection.host_texts()[0];

        assert_eq!(
            inspection.shape_name(),
            "HostRoot->FunctionComponent->[HostText,HostComponent->HostText]"
        );
        assert_eq!(
            inspection.fiber_tag_order(),
            [
                FiberTag::HostRoot,
                FiberTag::FunctionComponent,
                FiberTag::HostText,
                FiberTag::HostComponent,
                FiberTag::HostText
            ]
        );
        assert_eq!(inspection.root_child_tags(), [FiberTag::FunctionComponent]);
        assert_eq!(
            inspection.host_child_tags(),
            [FiberTag::HostText, FiberTag::HostComponent]
        );
        assert_eq!(inspection.root_children().len(), 1);
        assert_eq!(inspection.host_children().len(), 2);
        assert_eq!(inspection.host_components().len(), 1);
        assert_eq!(inspection.host_texts().len(), 2);
        assert!(inspection.has_function_component_wrapper());
        assert_eq!(
            function_component.fiber(),
            fibers.function_component.unwrap()
        );
        assert_eq!(function_component.child(), Some(first_text.fiber()));
        assert_eq!(first_text.fiber(), fibers.first_text.unwrap());
        assert_eq!(first_text.parent(), Some(function_component.fiber()));
        assert_eq!(
            first_text.sibling(),
            Some(inspection.host_component().fiber())
        );
        assert_eq!(inspection.host_component().fiber(), fibers.component);
        assert_eq!(
            inspection.host_component().parent(),
            Some(function_component.fiber())
        );
        assert_eq!(inspection.host_text().fiber(), fibers.component_text);
        assert_eq!(
            inspection.host_text().parent(),
            Some(inspection.host_component().fiber())
        );
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
