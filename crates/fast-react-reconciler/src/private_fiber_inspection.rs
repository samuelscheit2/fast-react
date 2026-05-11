//! Read-only committed fiber inspection for Rust test-renderer canaries.
//!
//! This is a private diagnostic boundary: it describes the current committed
//! fiber topology and intentionally does not expose renderer host nodes.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    ElementTypeHandle, FiberFlags, FiberId, FiberNode, FiberTag, FiberTopologyError, Lanes,
    PropsHandle, StateHandle, StateNodeHandle, UpdateQueueHandle,
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
    state_node: StateNodeHandle,
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
    pub const fn state_node(self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub const fn state_node_present(self) -> bool {
        self.state_node_present
    }
}

const TEST_RENDERER_COMMITTED_FIBER_INSPECTION_COMPATIBILITY_BLOCKERS: &[&str] = &[
    "public serialization",
    "react-test-renderer public compatibility",
    "React DOM compatibility",
    "native execution",
    "broad renderer compatibility",
    "act compatibility",
    "Scheduler compatibility",
    "package compatibility",
];

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

    #[must_use]
    pub fn is_nested_host_component_shape(&self) -> bool {
        matches!(
            self.shape_name,
            "HostRoot->HostComponent->HostComponent->HostText"
                | "HostRoot->HostComponent->HostComponent->[HostText,HostText]"
        )
    }

    #[must_use]
    pub fn nested_host_component(&self) -> Option<TestRendererCommittedFiberNodeInspection> {
        if self.is_nested_host_component_shape() {
            self.host_components.get(1).copied()
        } else {
            None
        }
    }

    #[must_use]
    pub fn is_direct_multi_child_host_component_shape(&self) -> bool {
        self.shape_name == "HostRoot->HostComponent->[HostText,HostText]"
    }

    #[must_use]
    pub fn public_compatibility_blockers(&self) -> &[&'static str] {
        TEST_RENDERER_COMMITTED_FIBER_INSPECTION_COMPATIBILITY_BLOCKERS
    }

    #[must_use]
    pub const fn public_serialization_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub const fn test_renderer_public_compatibility_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub const fn react_dom_compatibility_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub const fn native_execution_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub const fn broad_renderer_compatibility_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub const fn act_compatibility_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub const fn scheduler_compatibility_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub const fn package_compatibility_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub const fn public_serialization_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn test_renderer_public_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn react_dom_compatibility_claimed(&self) -> bool {
        false
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
                    match inspect_host_component_shape(store, *single_child)? {
                        InspectedHostComponentShape::Text(component) => {
                            builder.finish_host_component_shape(component)
                        }
                        InspectedHostComponentShape::Nested(nested) => {
                            builder.finish_nested_host_component_shape(nested)
                        }
                    }
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
        component: InspectedHostComponentWithTextChildren,
    ) -> Result<TestRendererCommittedFiberTreeInspection, TestRendererCommittedFiberInspectionError>
    {
        let shape_name = if component.texts.len() == 1 {
            "HostRoot->HostComponent->HostText"
        } else {
            "HostRoot->HostComponent->[HostText,HostText]"
        };
        let mut nodes = Vec::with_capacity(1 + component.texts.len());
        nodes.push(component.component);
        nodes.extend(component.texts.iter().copied());

        Ok(self.finish(
            shape_name,
            nodes,
            vec![component.component],
            vec![component.component],
            None,
            vec![component.component],
            component.texts.clone(),
            component.component,
            component.texts[0],
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

    fn finish_nested_host_component_shape(
        self,
        nested: InspectedNestedHostComponent,
    ) -> Result<TestRendererCommittedFiberTreeInspection, TestRendererCommittedFiberInspectionError>
    {
        let shape_name = if nested.texts.len() == 1 {
            "HostRoot->HostComponent->HostComponent->HostText"
        } else {
            "HostRoot->HostComponent->HostComponent->[HostText,HostText]"
        };
        let mut nodes = Vec::with_capacity(2 + nested.texts.len());
        nodes.push(nested.outer);
        nodes.push(nested.inner);
        nodes.extend(nested.texts.iter().copied());

        Ok(self.finish(
            shape_name,
            nodes,
            vec![nested.outer],
            vec![nested.outer],
            None,
            vec![nested.outer, nested.inner],
            nested.texts.clone(),
            nested.outer,
            nested.texts[0],
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
struct InspectedNestedHostComponent {
    outer: TestRendererCommittedFiberNodeInspection,
    inner: TestRendererCommittedFiberNodeInspection,
    texts: Vec<TestRendererCommittedFiberNodeInspection>,
}

#[derive(Debug, Clone)]
enum InspectedHostComponentShape {
    Text(InspectedHostComponentWithTextChildren),
    Nested(InspectedNestedHostComponent),
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

fn inspect_host_component_shape<H: HostTypes>(
    store: &FiberRootStore<H>,
    component_id: FiberId,
) -> Result<InspectedHostComponentShape, TestRendererCommittedFiberInspectionError> {
    let component_node = store.fiber_arena().get(component_id)?;
    expect_fiber_tag(component_node, FiberTag::HostComponent)?;
    expect_state_node_present(component_node)?;

    let component_children = expect_child_count(store, component_id, 1)?;
    match component_children.as_slice() {
        [child_id] => {
            let child_node = store.fiber_arena().get(*child_id)?;
            match child_node.tag() {
                FiberTag::HostText => Ok(InspectedHostComponentShape::Text(
                    inspect_host_component_with_text_children(store, component_id, &[*child_id])?,
                )),
                FiberTag::HostComponent => Ok(InspectedHostComponentShape::Nested(
                    inspect_nested_host_component_with_texts(store, component_id, *child_id)?,
                )),
                actual => Err(
                    TestRendererCommittedFiberInspectionError::ExpectedFiberTag {
                        fiber: child_node.id(),
                        expected: FiberTag::HostText,
                        actual,
                    },
                ),
            }
        }
        _ => Err(
            TestRendererCommittedFiberInspectionError::UnsupportedShape {
                fiber: component_id,
                tag: FiberTag::HostComponent,
                reason: "HostComponent generic private inspection admits only one direct child",
            },
        ),
    }
}

#[derive(Debug, Clone)]
struct InspectedHostComponentWithTextChildren {
    component: TestRendererCommittedFiberNodeInspection,
    texts: Vec<TestRendererCommittedFiberNodeInspection>,
}

fn inspect_host_component_with_text_children<H: HostTypes>(
    store: &FiberRootStore<H>,
    component_id: FiberId,
    text_ids: &[FiberId],
) -> Result<InspectedHostComponentWithTextChildren, TestRendererCommittedFiberInspectionError> {
    let component_node = store.fiber_arena().get(component_id)?;
    expect_fiber_tag(component_node, FiberTag::HostComponent)?;
    expect_state_node_present(component_node)?;
    let host_component = inspect_node(component_node);

    let actual_text_ids = expect_child_count(store, component_id, text_ids.len())?;
    if actual_text_ids != text_ids {
        return Err(
            TestRendererCommittedFiberInspectionError::UnsupportedShape {
                fiber: component_id,
                tag: FiberTag::HostComponent,
                reason: "HostComponent text child source order does not match the current sibling chain",
            },
        );
    }

    let mut texts = Vec::with_capacity(text_ids.len());
    for text_id in text_ids {
        let text_node = store.fiber_arena().get(*text_id)?;
        expect_fiber_tag(text_node, FiberTag::HostText)?;
        expect_state_node_present(text_node)?;
        expect_child_count(store, *text_id, 0)?;
        texts.push(inspect_node(text_node));
    }

    Ok(InspectedHostComponentWithTextChildren {
        component: host_component,
        texts,
    })
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

fn inspect_nested_host_component_with_texts<H: HostTypes>(
    store: &FiberRootStore<H>,
    outer_id: FiberId,
    inner_id: FiberId,
) -> Result<InspectedNestedHostComponent, TestRendererCommittedFiberInspectionError> {
    let outer_node = store.fiber_arena().get(outer_id)?;
    expect_fiber_tag(outer_node, FiberTag::HostComponent)?;
    expect_state_node_present(outer_node)?;
    let outer = inspect_node(outer_node);

    let inner_node = store.fiber_arena().get(inner_id)?;
    expect_fiber_tag(inner_node, FiberTag::HostComponent)?;
    expect_state_node_present(inner_node)?;
    let inner = inspect_node(inner_node);

    let text_ids = expect_child_count_range(
        store,
        inner_id,
        1,
        2,
        "nested HostComponent private inspection admits only one or two HostText children",
    )?;
    let mut texts = Vec::with_capacity(text_ids.len());
    for text_id in text_ids {
        let text_node = store.fiber_arena().get(text_id)?;
        expect_fiber_tag(text_node, FiberTag::HostText)?;
        expect_state_node_present(text_node)?;
        expect_child_count(store, text_id, 0)?;
        texts.push(inspect_node(text_node));
    }

    Ok(InspectedNestedHostComponent {
        outer,
        inner,
        texts,
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
        state_node: node.state_node(),
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

    #[derive(Debug, Clone, Copy)]
    struct CommittedNestedShapeFibers {
        outer: FiberId,
        inner: FiberId,
        first_text: FiberId,
        second_text: Option<FiberId>,
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    struct DirectMultiChildSource {
        root: FiberRootId,
        root_token: StateNodeHandle,
        previous_current: FiberId,
        committed_current: FiberId,
        resulting_element: RootElementHandle,
        render_lanes: Lanes,
        finished_work_after_commit: Option<FiberId>,
        finished_lanes_after_commit: Lanes,
        component: FiberId,
        component_element_type: ElementTypeHandle,
        component_props: PropsHandle,
        component_state_node: StateNodeHandle,
        component_lanes: Lanes,
        component_child_lanes: Lanes,
        first_text: FiberId,
        first_text_props: PropsHandle,
        first_text_state_node: StateNodeHandle,
        first_text_lanes: Lanes,
        second_text: FiberId,
        second_text_props: PropsHandle,
        second_text_state_node: StateNodeHandle,
        second_text_lanes: Lanes,
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    struct DirectMultiChildRows {
        host_root: TestRendererCommittedFiberNodeInspection,
        component: TestRendererCommittedFiberNodeInspection,
        first_text: TestRendererCommittedFiberNodeInspection,
        second_text: TestRendererCommittedFiberNodeInspection,
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    struct ReconcilerDirectMultiChildFiberInspection {
        source: DirectMultiChildSource,
        inspection: TestRendererCommittedFiberTreeInspection,
        store_current: FiberId,
        finished_work_after_commit: Option<FiberId>,
        finished_lanes_after_commit: Lanes,
        rows: DirectMultiChildRows,
    }

    impl ReconcilerDirectMultiChildFiberInspection {
        fn shape_name(&self) -> &'static str {
            self.inspection.shape_name()
        }

        const fn source(&self) -> DirectMultiChildSource {
            self.source
        }

        const fn store_current(&self) -> FiberId {
            self.store_current
        }

        const fn previous_current(&self) -> FiberId {
            self.source.previous_current
        }

        const fn render_lanes(&self) -> Lanes {
            self.source.render_lanes
        }

        const fn finished_work_after_commit(&self) -> Option<FiberId> {
            self.finished_work_after_commit
        }

        const fn finished_lanes_after_commit(&self) -> Lanes {
            self.finished_lanes_after_commit
        }

        const fn host_root(&self) -> TestRendererCommittedFiberNodeInspection {
            self.rows.host_root
        }

        const fn host_component(&self) -> TestRendererCommittedFiberNodeInspection {
            self.rows.component
        }

        const fn first_text(&self) -> TestRendererCommittedFiberNodeInspection {
            self.rows.first_text
        }

        const fn second_text(&self) -> TestRendererCommittedFiberNodeInspection {
            self.rows.second_text
        }

        fn blockers(&self) -> &[&'static str] {
            self.inspection.public_compatibility_blockers()
        }

        const fn public_serialization_blocked(&self) -> bool {
            true
        }

        const fn test_renderer_public_compatibility_blocked(&self) -> bool {
            true
        }

        const fn react_dom_compatibility_blocked(&self) -> bool {
            true
        }

        const fn native_execution_blocked(&self) -> bool {
            true
        }

        const fn broad_renderer_compatibility_blocked(&self) -> bool {
            true
        }

        const fn act_compatibility_blocked(&self) -> bool {
            true
        }

        const fn scheduler_compatibility_blocked(&self) -> bool {
            true
        }

        const fn package_compatibility_blocked(&self) -> bool {
            true
        }

        const fn public_serialization_compatibility_claimed(&self) -> bool {
            false
        }

        const fn test_renderer_public_compatibility_claimed(&self) -> bool {
            false
        }

        const fn react_dom_compatibility_claimed(&self) -> bool {
            false
        }

        fn validate_against_store(
            &self,
            store: &FiberRootStore<Host>,
        ) -> Result<(), ReconcilerDirectMultiChildFiberInspectionError> {
            let root = store
                .root(self.source.root)
                .map_err(TestRendererCommittedFiberInspectionError::from)?;
            if root.current() != self.store_current {
                return Err(
                    ReconcilerDirectMultiChildFiberInspectionError::CurrentRootMismatch {
                        expected: self.store_current,
                        actual: root.current(),
                    },
                );
            }
            if root.finished_work() != self.finished_work_after_commit {
                return Err(
                    ReconcilerDirectMultiChildFiberInspectionError::SourceMismatch {
                        field: "finished_work_after_commit",
                    },
                );
            }
            if root.finished_lanes() != self.finished_lanes_after_commit {
                return Err(
                    ReconcilerDirectMultiChildFiberInspectionError::SourceMismatch {
                        field: "finished_lanes_after_commit",
                    },
                );
            }

            let inspection = inspect_reconciler_direct_multi_child_committed_fiber_tree_for_canary(
                store,
                self.source,
            )?;
            if inspection != self.inspection {
                return Err(
                    ReconcilerDirectMultiChildFiberInspectionError::StaleOrClonedInspectionRows,
                );
            }

            validate_direct_multi_child_inspection(store, self.source, &inspection)?;
            Ok(())
        }
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    enum ReconcilerDirectMultiChildFiberInspectionError {
        FiberInspection(TestRendererCommittedFiberInspectionError),
        ExpectedShape { actual: &'static str },
        CurrentRootMismatch { expected: FiberId, actual: FiberId },
        SourceMismatch { field: &'static str },
        StaleOrClonedInspectionRows,
    }

    impl From<TestRendererCommittedFiberInspectionError>
        for ReconcilerDirectMultiChildFiberInspectionError
    {
        fn from(error: TestRendererCommittedFiberInspectionError) -> Self {
            Self::FiberInspection(error)
        }
    }

    impl From<FiberTopologyError> for ReconcilerDirectMultiChildFiberInspectionError {
        fn from(error: FiberTopologyError) -> Self {
            Self::FiberInspection(TestRendererCommittedFiberInspectionError::from(error))
        }
    }

    impl From<HostRootStateStoreError> for ReconcilerDirectMultiChildFiberInspectionError {
        fn from(error: HostRootStateStoreError) -> Self {
            Self::FiberInspection(TestRendererCommittedFiberInspectionError::from(error))
        }
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

    fn commit_direct_multi_child_host_component_shape(
        store: &mut FiberRootStore<Host>,
        root_id: FiberRootId,
        render: HostRootRenderPhaseRecord,
    ) -> DirectMultiChildSource {
        commit_direct_multi_child_host_component_shape_with_order(store, root_id, render, false)
    }

    fn commit_direct_multi_child_host_component_shape_with_order(
        store: &mut FiberRootStore<Host>,
        root_id: FiberRootId,
        render: HostRootRenderPhaseRecord,
        reversed_text_order: bool,
    ) -> DirectMultiChildSource {
        let resulting_element = RootElementHandle::from_raw(90);
        let host_root = render.work_in_progress();
        let component_element_type = ElementTypeHandle::from_raw(91);
        let component_props = PropsHandle::from_raw(92);
        let first_text_props = PropsHandle::from_raw(93);
        let second_text_props = PropsHandle::from_raw(94);
        let component_state_node = StateNodeHandle::from_raw(191);
        let first_text_state_node = StateNodeHandle::from_raw(192);
        let second_text_state_node = StateNodeHandle::from_raw(193);
        let component_lanes = Lanes::SYNC;
        let component_child_lanes = Lanes::DEFAULT;
        let first_text_lanes = Lanes::DEFAULT;
        let second_text_lanes = Lanes::TRANSITION;

        let component = create_host_component_fiber(
            store,
            host_root,
            component_element_type.raw(),
            component_props.raw(),
            component_state_node.raw(),
        );
        let first_text = create_host_text_fiber(
            store,
            host_root,
            first_text_props.raw(),
            first_text_state_node.raw(),
        );
        let second_text = create_host_text_fiber(
            store,
            host_root,
            second_text_props.raw(),
            second_text_state_node.raw(),
        );
        {
            let node = store.fiber_arena_mut().get_mut(component).unwrap();
            node.set_lanes(component_lanes);
            node.set_child_lanes(component_child_lanes);
        }
        store
            .fiber_arena_mut()
            .get_mut(first_text)
            .unwrap()
            .set_lanes(first_text_lanes);
        store
            .fiber_arena_mut()
            .get_mut(second_text)
            .unwrap()
            .set_lanes(second_text_lanes);

        let component_children = if reversed_text_order {
            vec![second_text, first_text]
        } else {
            vec![first_text, second_text]
        };
        store
            .fiber_arena_mut()
            .set_children(component, &component_children)
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[component])
            .unwrap();
        let commit = commit_finished_host_root(store, render).unwrap();
        let root = store.root(root_id).unwrap();

        DirectMultiChildSource {
            root: root_id,
            root_token: root_id.state_node_handle(),
            previous_current: commit.previous_current(),
            committed_current: commit.current(),
            resulting_element,
            render_lanes: commit.finished_lanes(),
            finished_work_after_commit: root.finished_work(),
            finished_lanes_after_commit: root.finished_lanes(),
            component,
            component_element_type,
            component_props,
            component_state_node,
            component_lanes,
            component_child_lanes,
            first_text,
            first_text_props,
            first_text_state_node,
            first_text_lanes,
            second_text,
            second_text_props,
            second_text_state_node,
            second_text_lanes,
        }
    }

    fn commit_direct_multi_child_host_component_shape_with_missing_text_state(
        store: &mut FiberRootStore<Host>,
        root_id: FiberRootId,
        render: HostRootRenderPhaseRecord,
    ) -> DirectMultiChildSource {
        let source = commit_direct_multi_child_host_component_shape(store, root_id, render);
        store
            .fiber_arena_mut()
            .get_mut(source.second_text)
            .unwrap()
            .set_state_node(StateNodeHandle::NONE);
        source
    }

    fn commit_direct_multi_child_host_component_shape_with_extra_text(
        store: &mut FiberRootStore<Host>,
        root_id: FiberRootId,
        render: HostRootRenderPhaseRecord,
    ) -> DirectMultiChildSource {
        let host_root = render.work_in_progress();
        let component = create_host_component_fiber(store, host_root, 101, 102, 201);
        let first_text = create_host_text_fiber(store, host_root, 103, 202);
        let second_text = create_host_text_fiber(store, host_root, 104, 203);
        let extra_text = create_host_text_fiber(store, host_root, 105, 204);
        store
            .fiber_arena_mut()
            .set_children(component, &[first_text, second_text, extra_text])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[component])
            .unwrap();
        let commit = commit_finished_host_root(store, render).unwrap();
        let root = store.root(root_id).unwrap();

        DirectMultiChildSource {
            root: root_id,
            root_token: root_id.state_node_handle(),
            previous_current: commit.previous_current(),
            committed_current: commit.current(),
            resulting_element: RootElementHandle::from_raw(100),
            render_lanes: commit.finished_lanes(),
            finished_work_after_commit: root.finished_work(),
            finished_lanes_after_commit: root.finished_lanes(),
            component,
            component_element_type: ElementTypeHandle::from_raw(101),
            component_props: PropsHandle::from_raw(102),
            component_state_node: StateNodeHandle::from_raw(201),
            component_lanes: Lanes::NO,
            component_child_lanes: Lanes::NO,
            first_text,
            first_text_props: PropsHandle::from_raw(103),
            first_text_state_node: StateNodeHandle::from_raw(202),
            first_text_lanes: Lanes::NO,
            second_text,
            second_text_props: PropsHandle::from_raw(104),
            second_text_state_node: StateNodeHandle::from_raw(203),
            second_text_lanes: Lanes::NO,
        }
    }

    fn inspect_reconciler_direct_multi_child_fiber_shape_for_canary(
        store: &FiberRootStore<Host>,
        source: DirectMultiChildSource,
    ) -> Result<
        ReconcilerDirectMultiChildFiberInspection,
        ReconcilerDirectMultiChildFiberInspectionError,
    > {
        let inspection =
            inspect_reconciler_direct_multi_child_committed_fiber_tree_for_canary(store, source)?;
        let rows = validate_direct_multi_child_inspection(store, source, &inspection)?;
        let root = store
            .root(source.root)
            .map_err(TestRendererCommittedFiberInspectionError::from)?;

        Ok(ReconcilerDirectMultiChildFiberInspection {
            source,
            inspection,
            store_current: root.current(),
            finished_work_after_commit: root.finished_work(),
            finished_lanes_after_commit: root.finished_lanes(),
            rows,
        })
    }

    fn inspect_reconciler_direct_multi_child_committed_fiber_tree_for_canary(
        store: &FiberRootStore<Host>,
        source: DirectMultiChildSource,
    ) -> Result<
        TestRendererCommittedFiberTreeInspection,
        ReconcilerDirectMultiChildFiberInspectionError,
    > {
        let root = store
            .root(source.root)
            .map_err(TestRendererCommittedFiberInspectionError::from)?;
        let current = root.current();
        let host_root_node = store.fiber_arena().get(current)?;
        expect_fiber_tag(host_root_node, FiberTag::HostRoot)?;
        validate_host_root_state_node(source.root, host_root_node)?;
        let resulting_element = store
            .host_root_states()
            .get(host_root_node.memoized_state())?
            .element();
        let host_root = inspect_node(host_root_node);
        let root_children = expect_child_count(store, current, 1)?;
        let [component_id] = root_children.as_slice() else {
            return Err(
                ReconcilerDirectMultiChildFiberInspectionError::SourceMismatch {
                    field: "direct.root_child_count",
                },
            );
        };
        if *component_id != source.component {
            return Err(
                ReconcilerDirectMultiChildFiberInspectionError::SourceMismatch {
                    field: "direct.root_child_identity",
                },
            );
        }

        let component = inspect_host_component_with_text_children(
            store,
            source.component,
            &[source.first_text, source.second_text],
        )?;
        let builder = TestRendererCommittedFiberTreeInspectionBuilder::new(
            source.root,
            current,
            resulting_element,
            host_root,
        );
        Ok(builder.finish_host_component_shape(component)?)
    }

    fn validate_direct_multi_child_inspection(
        store: &FiberRootStore<Host>,
        source: DirectMultiChildSource,
        inspection: &TestRendererCommittedFiberTreeInspection,
    ) -> Result<DirectMultiChildRows, ReconcilerDirectMultiChildFiberInspectionError> {
        let root = store
            .root(source.root)
            .map_err(TestRendererCommittedFiberInspectionError::from)?;
        if root.current() != source.committed_current {
            return Err(
                ReconcilerDirectMultiChildFiberInspectionError::CurrentRootMismatch {
                    expected: source.committed_current,
                    actual: root.current(),
                },
            );
        }
        if root.finished_work() != source.finished_work_after_commit {
            return Err(
                ReconcilerDirectMultiChildFiberInspectionError::SourceMismatch {
                    field: "source.finished_work_after_commit",
                },
            );
        }
        if root.finished_lanes() != source.finished_lanes_after_commit {
            return Err(
                ReconcilerDirectMultiChildFiberInspectionError::SourceMismatch {
                    field: "source.finished_lanes_after_commit",
                },
            );
        }
        if !inspection.is_direct_multi_child_host_component_shape() {
            return Err(
                ReconcilerDirectMultiChildFiberInspectionError::ExpectedShape {
                    actual: inspection.shape_name(),
                },
            );
        }
        if inspection.root() != source.root {
            return Err(
                ReconcilerDirectMultiChildFiberInspectionError::SourceMismatch {
                    field: "inspection.root",
                },
            );
        }
        if inspection.current() != source.committed_current {
            return Err(
                ReconcilerDirectMultiChildFiberInspectionError::SourceMismatch {
                    field: "inspection.current",
                },
            );
        }
        if inspection.resulting_element() != source.resulting_element {
            return Err(
                ReconcilerDirectMultiChildFiberInspectionError::SourceMismatch {
                    field: "inspection.resulting_element",
                },
            );
        }
        if inspection.root_children().len() != 1
            || inspection.host_children().len() != 1
            || inspection.host_components().len() != 1
            || inspection.host_texts().len() != 2
            || inspection.has_function_component_wrapper()
            || inspection.nested_host_component().is_some()
        {
            return Err(
                ReconcilerDirectMultiChildFiberInspectionError::SourceMismatch {
                    field: "inspection.child_sets",
                },
            );
        }

        let host_root = inspection.host_root();
        let component = inspection.host_component();
        let first_text = inspection.host_texts()[0];
        let second_text = inspection.host_texts()[1];

        expect_current_row(store, host_root, "host_root.row")?;
        expect_current_row(store, component, "component.row")?;
        expect_current_row(store, first_text, "first_text.row")?;
        expect_current_row(store, second_text, "second_text.row")?;

        if host_root.fiber() != source.committed_current
            || host_root.tag() != FiberTag::HostRoot
            || host_root.parent().is_some()
            || host_root.child() != Some(source.component)
            || host_root.sibling().is_some()
            || host_root.alternate() != Some(source.previous_current)
            || host_root.state_node() != source.root_token
            || source.root_token != source.root.state_node_handle()
        {
            return Err(
                ReconcilerDirectMultiChildFiberInspectionError::SourceMismatch {
                    field: "host_root.identity",
                },
            );
        }

        let previous_current = store.fiber_arena().get(source.previous_current)?;
        if previous_current.alternate() != Some(source.committed_current) {
            return Err(
                ReconcilerDirectMultiChildFiberInspectionError::SourceMismatch {
                    field: "host_root.alternate_current",
                },
            );
        }

        if component.fiber() != source.component
            || component.tag() != FiberTag::HostComponent
            || component.parent() != Some(host_root.fiber())
            || component.child() != Some(source.first_text)
            || component.sibling().is_some()
            || component.index() != 0
            || component.element_type() != source.component_element_type
            || component.pending_props() != source.component_props
            || component.memoized_props() != source.component_props
            || component.state_node() != source.component_state_node
            || component.lanes() != source.component_lanes
            || component.child_lanes() != source.component_child_lanes
        {
            return Err(
                ReconcilerDirectMultiChildFiberInspectionError::SourceMismatch {
                    field: "component.identity",
                },
            );
        }

        if first_text.fiber() != source.first_text
            || first_text.tag() != FiberTag::HostText
            || first_text.parent() != Some(source.component)
            || first_text.child().is_some()
            || first_text.sibling() != Some(source.second_text)
            || first_text.index() != 0
            || first_text.pending_props() != source.first_text_props
            || first_text.memoized_props() != source.first_text_props
            || first_text.state_node() != source.first_text_state_node
            || first_text.lanes() != source.first_text_lanes
        {
            return Err(
                ReconcilerDirectMultiChildFiberInspectionError::SourceMismatch {
                    field: "first_text.identity",
                },
            );
        }

        if second_text.fiber() != source.second_text
            || second_text.tag() != FiberTag::HostText
            || second_text.parent() != Some(source.component)
            || second_text.child().is_some()
            || second_text.sibling().is_some()
            || second_text.index() != 1
            || second_text.pending_props() != source.second_text_props
            || second_text.memoized_props() != source.second_text_props
            || second_text.state_node() != source.second_text_state_node
            || second_text.lanes() != source.second_text_lanes
        {
            return Err(
                ReconcilerDirectMultiChildFiberInspectionError::SourceMismatch {
                    field: "second_text.identity",
                },
            );
        }

        let component_children = store.fiber_arena().child_ids(source.component)?;
        if component_children != [source.first_text, source.second_text] {
            return Err(
                ReconcilerDirectMultiChildFiberInspectionError::SourceMismatch {
                    field: "component.child_order",
                },
            );
        }

        Ok(DirectMultiChildRows {
            host_root,
            component,
            first_text,
            second_text,
        })
    }

    fn expect_current_row(
        store: &FiberRootStore<Host>,
        row: TestRendererCommittedFiberNodeInspection,
        field: &'static str,
    ) -> Result<(), ReconcilerDirectMultiChildFiberInspectionError> {
        let current = inspect_node(store.fiber_arena().get(row.fiber())?);
        if current == row {
            Ok(())
        } else {
            Err(ReconcilerDirectMultiChildFiberInspectionError::SourceMismatch { field })
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

    fn commit_nested_host_shape(
        store: &mut FiberRootStore<Host>,
        render: HostRootRenderPhaseRecord,
        two_text_children: bool,
    ) -> CommittedNestedShapeFibers {
        let host_root = render.work_in_progress();
        let outer = create_host_component_fiber(store, host_root, 81, 82, 181);
        let inner = create_host_component_fiber(store, host_root, 83, 84, 183);
        let first_text = create_host_text_fiber(store, host_root, 85, 185);
        let second_text = if two_text_children {
            Some(create_host_text_fiber(store, host_root, 86, 186))
        } else {
            None
        };
        let inner_children = if let Some(second_text) = second_text {
            vec![first_text, second_text]
        } else {
            vec![first_text]
        };
        store
            .fiber_arena_mut()
            .set_children(inner, &inner_children)
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(outer, &[inner])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root, &[outer])
            .unwrap();
        commit_finished_host_root(store, render).unwrap();

        CommittedNestedShapeFibers {
            outer,
            inner,
            first_text,
            second_text,
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
    fn reconciler_private_fiber_inspection_describes_direct_multi_child_host_component_shape() {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(90));
        let source = commit_direct_multi_child_host_component_shape(&mut store, root_id, render);

        let inspection =
            inspect_reconciler_direct_multi_child_committed_fiber_tree_for_canary(&store, source)
                .unwrap();
        let host_root = inspection.host_root();
        let component = inspection.host_component();
        let first_text = inspection.host_texts()[0];
        let second_text = inspection.host_texts()[1];

        assert_eq!(
            inspection.shape_name(),
            "HostRoot->HostComponent->[HostText,HostText]"
        );
        assert!(inspection.is_direct_multi_child_host_component_shape());
        assert_eq!(
            inspection.fiber_tag_order(),
            [
                FiberTag::HostRoot,
                FiberTag::HostComponent,
                FiberTag::HostText,
                FiberTag::HostText
            ]
        );
        assert_eq!(inspection.root_child_tags(), [FiberTag::HostComponent]);
        assert_eq!(inspection.host_child_tags(), [FiberTag::HostComponent]);
        assert_eq!(inspection.root_children().len(), 1);
        assert_eq!(inspection.host_children().len(), 1);
        assert_eq!(inspection.host_components().len(), 1);
        assert_eq!(inspection.host_texts().len(), 2);
        assert!(inspection.function_component().is_none());
        assert!(!inspection.has_function_component_wrapper());
        assert!(inspection.nested_host_component().is_none());
        assert_eq!(inspection.host_text(), first_text);
        assert_eq!(host_root.fiber(), source.committed_current);
        assert_eq!(host_root.alternate(), Some(source.previous_current));
        assert_eq!(host_root.state_node(), source.root_token);
        assert_eq!(component.fiber(), source.component);
        assert_eq!(component.parent(), Some(host_root.fiber()));
        assert_eq!(component.child(), Some(first_text.fiber()));
        assert_eq!(component.sibling(), None);
        assert_eq!(component.index(), 0);
        assert_eq!(component.element_type(), source.component_element_type);
        assert_eq!(component.pending_props(), source.component_props);
        assert_eq!(component.memoized_props(), source.component_props);
        assert_eq!(component.state_node(), source.component_state_node);
        assert_eq!(component.lanes(), source.component_lanes);
        assert_eq!(component.child_lanes(), source.component_child_lanes);
        assert_eq!(first_text.fiber(), source.first_text);
        assert_eq!(first_text.parent(), Some(component.fiber()));
        assert_eq!(first_text.sibling(), Some(second_text.fiber()));
        assert_eq!(first_text.index(), 0);
        assert_eq!(first_text.pending_props(), source.first_text_props);
        assert_eq!(first_text.memoized_props(), source.first_text_props);
        assert_eq!(first_text.state_node(), source.first_text_state_node);
        assert_eq!(first_text.lanes(), source.first_text_lanes);
        assert_eq!(second_text.fiber(), source.second_text);
        assert_eq!(second_text.parent(), Some(component.fiber()));
        assert_eq!(second_text.sibling(), None);
        assert_eq!(second_text.index(), 1);
        assert_eq!(second_text.pending_props(), source.second_text_props);
        assert_eq!(second_text.memoized_props(), source.second_text_props);
        assert_eq!(second_text.state_node(), source.second_text_state_node);
        assert_eq!(second_text.lanes(), source.second_text_lanes);
    }

    #[test]
    fn generic_committed_fiber_inspection_rejects_direct_multi_child_host_component_shape() {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(90));
        let source = commit_direct_multi_child_host_component_shape(&mut store, root_id, render);

        let error = inspect_test_renderer_committed_fiber_tree(&store, root_id).unwrap_err();

        assert!(matches!(
            error,
            TestRendererCommittedFiberInspectionError::UnexpectedChildCount {
                fiber,
                tag: FiberTag::HostComponent,
                expected: 1,
                actual: 2
            } if fiber == source.component
        ));
    }

    #[test]
    fn reconciler_direct_multi_child_fiber_inspection_records_source_currentness_and_blockers() {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(90));
        let source = commit_direct_multi_child_host_component_shape(&mut store, root_id, render);

        let proof =
            inspect_reconciler_direct_multi_child_fiber_shape_for_canary(&store, source).unwrap();

        assert_eq!(proof.source(), source);
        assert_eq!(
            proof.shape_name(),
            "HostRoot->HostComponent->[HostText,HostText]"
        );
        assert_eq!(proof.store_current(), source.committed_current);
        assert_eq!(proof.previous_current(), source.previous_current);
        assert_eq!(proof.render_lanes(), Lanes::DEFAULT);
        assert_eq!(proof.finished_work_after_commit(), None);
        assert_eq!(proof.finished_lanes_after_commit(), Lanes::NO);
        assert_eq!(proof.host_root().state_node(), source.root_token);
        assert_eq!(
            proof.host_component().state_node(),
            source.component_state_node
        );
        assert_eq!(
            proof.host_component().pending_props(),
            source.component_props
        );
        assert_eq!(proof.host_component().lanes(), source.component_lanes);
        assert_eq!(
            proof.first_text().state_node(),
            source.first_text_state_node
        );
        assert_eq!(proof.first_text().pending_props(), source.first_text_props);
        assert_eq!(proof.first_text().sibling(), Some(source.second_text));
        assert_eq!(proof.first_text().lanes(), source.first_text_lanes);
        assert_eq!(
            proof.second_text().state_node(),
            source.second_text_state_node
        );
        assert_eq!(
            proof.second_text().pending_props(),
            source.second_text_props
        );
        assert_eq!(proof.second_text().sibling(), None);
        assert_eq!(proof.second_text().lanes(), source.second_text_lanes);
        assert_eq!(
            proof.blockers(),
            TEST_RENDERER_COMMITTED_FIBER_INSPECTION_COMPATIBILITY_BLOCKERS
        );
        assert!(proof.public_serialization_blocked());
        assert!(proof.test_renderer_public_compatibility_blocked());
        assert!(proof.react_dom_compatibility_blocked());
        assert!(proof.native_execution_blocked());
        assert!(proof.broad_renderer_compatibility_blocked());
        assert!(proof.act_compatibility_blocked());
        assert!(proof.scheduler_compatibility_blocked());
        assert!(proof.package_compatibility_blocked());
        assert!(!proof.public_serialization_compatibility_claimed());
        assert!(!proof.test_renderer_public_compatibility_claimed());
        assert!(!proof.react_dom_compatibility_claimed());
        proof.validate_against_store(&store).unwrap();
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
    fn committed_fiber_inspection_describes_nested_host_component_shape() {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(80));
        let fibers = commit_nested_host_shape(&mut store, render, true);

        let inspection = inspect_test_renderer_committed_fiber_tree(&store, root_id).unwrap();
        let outer = inspection.host_component();
        let inner = inspection.nested_host_component().unwrap();
        let first_text = inspection.host_texts()[0];
        let second_text = inspection.host_texts()[1];

        assert_eq!(
            inspection.shape_name(),
            "HostRoot->HostComponent->HostComponent->[HostText,HostText]"
        );
        assert_eq!(
            inspection.fiber_tag_order(),
            [
                FiberTag::HostRoot,
                FiberTag::HostComponent,
                FiberTag::HostComponent,
                FiberTag::HostText,
                FiberTag::HostText
            ]
        );
        assert_eq!(inspection.root_child_tags(), [FiberTag::HostComponent]);
        assert_eq!(inspection.host_child_tags(), [FiberTag::HostComponent]);
        assert_eq!(inspection.root_children().len(), 1);
        assert_eq!(inspection.host_children().len(), 1);
        assert_eq!(inspection.host_components().len(), 2);
        assert_eq!(inspection.host_texts().len(), 2);
        assert!(inspection.is_nested_host_component_shape());
        assert!(inspection.function_component().is_none());
        assert_eq!(outer.fiber(), fibers.outer);
        assert_eq!(outer.parent(), Some(inspection.host_root().fiber()));
        assert_eq!(outer.child(), Some(inner.fiber()));
        assert_eq!(outer.index(), 0);
        assert_eq!(inner.fiber(), fibers.inner);
        assert_eq!(inner.parent(), Some(outer.fiber()));
        assert_eq!(inner.child(), Some(first_text.fiber()));
        assert_eq!(inner.index(), 0);
        assert_eq!(first_text.fiber(), fibers.first_text);
        assert_eq!(first_text.parent(), Some(inner.fiber()));
        assert_eq!(first_text.sibling(), Some(second_text.fiber()));
        assert_eq!(first_text.index(), 0);
        assert_eq!(second_text.fiber(), fibers.second_text.unwrap());
        assert_eq!(second_text.parent(), Some(inner.fiber()));
        assert_eq!(second_text.sibling(), None);
        assert_eq!(second_text.index(), 1);
        assert!(outer.state_node_present());
        assert!(inner.state_node_present());
        assert!(first_text.state_node_present());
        assert!(second_text.state_node_present());
    }

    #[test]
    fn reconciler_direct_multi_child_fiber_inspection_rejects_empty_root() {
        let (store, root_id) = root_store();

        let error = inspect_test_renderer_committed_fiber_tree(&store, root_id).unwrap_err();

        assert!(matches!(
            error,
            TestRendererCommittedFiberInspectionError::UnexpectedChildCount {
                tag: FiberTag::HostRoot,
                expected: 1,
                actual: 0,
                ..
            }
        ));
    }

    #[test]
    fn reconciler_direct_multi_child_fiber_inspection_rejects_wrong_root_current() {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(90));
        let source = commit_direct_multi_child_host_component_shape(&mut store, root_id, render);
        let proof =
            inspect_reconciler_direct_multi_child_fiber_shape_for_canary(&store, source).unwrap();
        let other_root = store.create_client_root((), RootOptions::new()).unwrap();
        let wrong_current = store.root(other_root).unwrap().current();

        store.root_mut(root_id).unwrap().set_current(wrong_current);
        let error = proof.validate_against_store(&store).unwrap_err();

        assert!(matches!(
            error,
            ReconcilerDirectMultiChildFiberInspectionError::CurrentRootMismatch {
                expected,
                actual
            } if expected == source.committed_current && actual == wrong_current
        ));
    }

    #[test]
    fn reconciler_direct_multi_child_fiber_inspection_rejects_reversed_text_siblings() {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(90));
        let source = commit_direct_multi_child_host_component_shape_with_order(
            &mut store, root_id, render, true,
        );

        let error = inspect_reconciler_direct_multi_child_fiber_shape_for_canary(&store, source)
            .unwrap_err();

        assert!(matches!(
            error,
            ReconcilerDirectMultiChildFiberInspectionError::FiberInspection(
                TestRendererCommittedFiberInspectionError::UnsupportedShape {
                    fiber,
                    tag: FiberTag::HostComponent,
                    ..
                }
            ) if fiber == source.component
        ));
    }

    #[test]
    fn reconciler_direct_multi_child_fiber_inspection_rejects_missing_state_node() {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(90));
        let source = commit_direct_multi_child_host_component_shape_with_missing_text_state(
            &mut store, root_id, render,
        );

        let error = inspect_reconciler_direct_multi_child_fiber_shape_for_canary(&store, source)
            .unwrap_err();

        assert!(matches!(
            error,
            ReconcilerDirectMultiChildFiberInspectionError::FiberInspection(
                TestRendererCommittedFiberInspectionError::MissingStateNode {
                    fiber,
                    tag: FiberTag::HostText
                }
            ) if fiber == source.second_text
        ));
    }

    #[test]
    fn reconciler_direct_multi_child_fiber_inspection_rejects_extra_child() {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(100));
        let source = commit_direct_multi_child_host_component_shape_with_extra_text(
            &mut store, root_id, render,
        );

        let error = inspect_reconciler_direct_multi_child_fiber_shape_for_canary(&store, source)
            .unwrap_err();

        assert!(matches!(
            error,
            ReconcilerDirectMultiChildFiberInspectionError::FiberInspection(
                TestRendererCommittedFiberInspectionError::UnexpectedChildCount {
                    fiber,
                    tag: FiberTag::HostComponent,
                    expected: 2,
                    actual: 3
                    ..
                }
            ) if fiber == source.component
        ));
    }

    #[test]
    fn reconciler_direct_multi_child_fiber_inspection_rejects_nested_component_shape() {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(80));
        let nested = commit_nested_host_shape(&mut store, render, true);
        let root = store.root(root_id).unwrap();
        let host_root = root.current();
        let source = DirectMultiChildSource {
            root: root_id,
            root_token: root_id.state_node_handle(),
            previous_current: store
                .fiber_arena()
                .get(host_root)
                .unwrap()
                .alternate()
                .unwrap(),
            committed_current: host_root,
            resulting_element: RootElementHandle::from_raw(80),
            render_lanes: Lanes::DEFAULT,
            finished_work_after_commit: root.finished_work(),
            finished_lanes_after_commit: root.finished_lanes(),
            component: nested.outer,
            component_element_type: ElementTypeHandle::from_raw(81),
            component_props: PropsHandle::from_raw(82),
            component_state_node: StateNodeHandle::from_raw(181),
            component_lanes: Lanes::NO,
            component_child_lanes: Lanes::NO,
            first_text: nested.first_text,
            first_text_props: PropsHandle::from_raw(85),
            first_text_state_node: StateNodeHandle::from_raw(185),
            first_text_lanes: Lanes::NO,
            second_text: nested.second_text.unwrap(),
            second_text_props: PropsHandle::from_raw(86),
            second_text_state_node: StateNodeHandle::from_raw(186),
            second_text_lanes: Lanes::NO,
        };

        let error = inspect_reconciler_direct_multi_child_fiber_shape_for_canary(&store, source)
            .unwrap_err();

        assert!(matches!(
            error,
            ReconcilerDirectMultiChildFiberInspectionError::FiberInspection(
                TestRendererCommittedFiberInspectionError::UnexpectedChildCount {
                    fiber,
                    tag: FiberTag::HostComponent,
                    expected: 2,
                    actual: 1
                }
            ) if fiber == nested.outer
        ));
    }

    #[test]
    fn reconciler_direct_multi_child_fiber_inspection_rejects_stale_cloned_rows() {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(90));
        let source = commit_direct_multi_child_host_component_shape(&mut store, root_id, render);
        let proof =
            inspect_reconciler_direct_multi_child_fiber_shape_for_canary(&store, source).unwrap();
        let cloned_rows = proof.clone();
        let second_render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(90));
        let _second_source =
            commit_direct_multi_child_host_component_shape(&mut store, root_id, second_render);

        let error = cloned_rows.validate_against_store(&store).unwrap_err();

        assert!(matches!(
            error,
            ReconcilerDirectMultiChildFiberInspectionError::CurrentRootMismatch {
                expected,
                actual
            } if expected == source.committed_current && actual != source.committed_current
        ));
    }

    #[test]
    fn committed_fiber_inspection_keeps_public_compatibility_flags_blocked() {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(90));
        let source = commit_direct_multi_child_host_component_shape(&mut store, root_id, render);

        let inspection =
            inspect_reconciler_direct_multi_child_committed_fiber_tree_for_canary(&store, source)
                .unwrap();

        assert_eq!(
            inspection.public_compatibility_blockers(),
            TEST_RENDERER_COMMITTED_FIBER_INSPECTION_COMPATIBILITY_BLOCKERS
        );
        assert!(inspection.public_serialization_blocked());
        assert!(inspection.test_renderer_public_compatibility_blocked());
        assert!(inspection.react_dom_compatibility_blocked());
        assert!(inspection.native_execution_blocked());
        assert!(inspection.broad_renderer_compatibility_blocked());
        assert!(inspection.act_compatibility_blocked());
        assert!(inspection.scheduler_compatibility_blocked());
        assert!(inspection.package_compatibility_blocked());
        assert!(!inspection.public_serialization_compatibility_claimed());
        assert!(!inspection.test_renderer_public_compatibility_claimed());
        assert!(!inspection.react_dom_compatibility_claimed());
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
