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

#[cfg(test)]
use crate::sync_flush::SyncFlushMinimalHostPlacementCommitRecordForCanary;
use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError, HostRootCommitRecord,
    HostRootStateStoreError, RootElementHandle,
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

    #[must_use]
    pub const fn native_execution_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn broad_renderer_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn act_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn scheduler_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn package_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ReconcilerDirectMultiChildCommittedFiberSource {
    root: FiberRootId,
    root_token: StateNodeHandle,
    previous_current: FiberId,
    committed_current: FiberId,
    resulting_element: RootElementHandle,
    render_lanes: Lanes,
    commit_finished_lanes: Lanes,
    commit_remaining_lanes: Lanes,
    commit_pending_lanes: Lanes,
    finished_work_after_commit: Option<FiberId>,
    finished_lanes_after_commit: Lanes,
    host_root_source_row: TestRendererCommittedFiberNodeInspection,
    component_source_row: TestRendererCommittedFiberNodeInspection,
    first_text_source_row: TestRendererCommittedFiberNodeInspection,
    second_text_source_row: TestRendererCommittedFiberNodeInspection,
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
    source_current_topology_recorded: bool,
    host_node_store_state_nodes_present: bool,
    public_serialization_compatibility_claimed: bool,
    test_renderer_public_compatibility_claimed: bool,
    react_dom_compatibility_claimed: bool,
    native_execution_compatibility_claimed: bool,
    broad_renderer_compatibility_claimed: bool,
    act_compatibility_claimed: bool,
    scheduler_compatibility_claimed: bool,
    package_compatibility_claimed: bool,
}

impl ReconcilerDirectMultiChildCommittedFiberSource {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn root_token(self) -> StateNodeHandle {
        self.root_token
    }

    #[must_use]
    pub const fn previous_current(self) -> FiberId {
        self.previous_current
    }

    #[must_use]
    pub const fn committed_current(self) -> FiberId {
        self.committed_current
    }

    #[must_use]
    pub const fn resulting_element(self) -> RootElementHandle {
        self.resulting_element
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn commit_finished_lanes(self) -> Lanes {
        self.commit_finished_lanes
    }

    #[must_use]
    pub const fn commit_remaining_lanes(self) -> Lanes {
        self.commit_remaining_lanes
    }

    #[must_use]
    pub const fn commit_pending_lanes(self) -> Lanes {
        self.commit_pending_lanes
    }

    #[must_use]
    pub const fn finished_work_after_commit(self) -> Option<FiberId> {
        self.finished_work_after_commit
    }

    #[must_use]
    pub const fn finished_lanes_after_commit(self) -> Lanes {
        self.finished_lanes_after_commit
    }

    #[must_use]
    pub const fn host_root_source_row(self) -> TestRendererCommittedFiberNodeInspection {
        self.host_root_source_row
    }

    #[must_use]
    pub const fn component_source_row(self) -> TestRendererCommittedFiberNodeInspection {
        self.component_source_row
    }

    #[must_use]
    pub const fn first_text_source_row(self) -> TestRendererCommittedFiberNodeInspection {
        self.first_text_source_row
    }

    #[must_use]
    pub const fn second_text_source_row(self) -> TestRendererCommittedFiberNodeInspection {
        self.second_text_source_row
    }

    #[must_use]
    pub const fn component(self) -> FiberId {
        self.component
    }

    #[must_use]
    pub const fn first_text(self) -> FiberId {
        self.first_text
    }

    #[must_use]
    pub const fn second_text(self) -> FiberId {
        self.second_text
    }

    #[must_use]
    pub const fn source_current_topology_recorded(self) -> bool {
        self.source_current_topology_recorded
    }

    #[must_use]
    pub const fn host_node_store_state_nodes_present(self) -> bool {
        self.host_node_store_state_nodes_present
    }

    #[must_use]
    pub fn public_compatibility_blockers(&self) -> &[&'static str] {
        TEST_RENDERER_COMMITTED_FIBER_INSPECTION_COMPATIBILITY_BLOCKERS
    }

    #[must_use]
    pub const fn public_serialization_blocked(self) -> bool {
        !self.public_serialization_compatibility_claimed
    }

    #[must_use]
    pub const fn test_renderer_public_compatibility_blocked(self) -> bool {
        !self.test_renderer_public_compatibility_claimed
    }

    #[must_use]
    pub const fn react_dom_compatibility_blocked(self) -> bool {
        !self.react_dom_compatibility_claimed
    }

    #[must_use]
    pub const fn native_execution_blocked(self) -> bool {
        !self.native_execution_compatibility_claimed
    }

    #[must_use]
    pub const fn broad_renderer_compatibility_blocked(self) -> bool {
        !self.broad_renderer_compatibility_claimed
    }

    #[must_use]
    pub const fn act_compatibility_blocked(self) -> bool {
        !self.act_compatibility_claimed
    }

    #[must_use]
    pub const fn scheduler_compatibility_blocked(self) -> bool {
        !self.scheduler_compatibility_claimed
    }

    #[must_use]
    pub const fn package_compatibility_blocked(self) -> bool {
        !self.package_compatibility_claimed
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.public_serialization_compatibility_claimed
            || self.test_renderer_public_compatibility_claimed
            || self.react_dom_compatibility_claimed
            || self.native_execution_compatibility_claimed
            || self.broad_renderer_compatibility_claimed
            || self.act_compatibility_claimed
            || self.scheduler_compatibility_claimed
            || self.package_compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct ReconcilerDirectMultiChildCommittedFiberRows {
    host_root: TestRendererCommittedFiberNodeInspection,
    component: TestRendererCommittedFiberNodeInspection,
    first_text: TestRendererCommittedFiberNodeInspection,
    second_text: TestRendererCommittedFiberNodeInspection,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ReconcilerDirectMultiChildCommittedFiberInspection {
    source: ReconcilerDirectMultiChildCommittedFiberSource,
    inspection: TestRendererCommittedFiberTreeInspection,
    store_current: FiberId,
    finished_work_after_commit: Option<FiberId>,
    finished_lanes_after_commit: Lanes,
    rows: ReconcilerDirectMultiChildCommittedFiberRows,
}

impl ReconcilerDirectMultiChildCommittedFiberInspection {
    #[must_use]
    pub const fn source(&self) -> ReconcilerDirectMultiChildCommittedFiberSource {
        self.source
    }

    #[must_use]
    pub const fn store_current(&self) -> FiberId {
        self.store_current
    }

    #[must_use]
    pub const fn previous_current(&self) -> FiberId {
        self.source.previous_current
    }

    #[must_use]
    pub const fn render_lanes(&self) -> Lanes {
        self.source.render_lanes
    }

    #[must_use]
    pub const fn commit_finished_lanes(&self) -> Lanes {
        self.source.commit_finished_lanes
    }

    #[must_use]
    pub const fn finished_work_after_commit(&self) -> Option<FiberId> {
        self.finished_work_after_commit
    }

    #[must_use]
    pub const fn finished_lanes_after_commit(&self) -> Lanes {
        self.finished_lanes_after_commit
    }

    #[must_use]
    pub const fn tree(&self) -> &TestRendererCommittedFiberTreeInspection {
        &self.inspection
    }

    #[must_use]
    pub fn shape_name(&self) -> &'static str {
        self.inspection.shape_name()
    }

    #[must_use]
    pub const fn host_root(&self) -> TestRendererCommittedFiberNodeInspection {
        self.rows.host_root
    }

    #[must_use]
    pub const fn host_component(&self) -> TestRendererCommittedFiberNodeInspection {
        self.rows.component
    }

    #[must_use]
    pub const fn first_text(&self) -> TestRendererCommittedFiberNodeInspection {
        self.rows.first_text
    }

    #[must_use]
    pub const fn second_text(&self) -> TestRendererCommittedFiberNodeInspection {
        self.rows.second_text
    }

    #[must_use]
    pub fn blockers(&self) -> &[&'static str] {
        self.inspection.public_compatibility_blockers()
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

    #[must_use]
    pub const fn native_execution_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn package_compatibility_claimed(&self) -> bool {
        false
    }

    pub fn validate_against_store<H: HostTypes>(
        &self,
        store: &FiberRootStore<H>,
    ) -> Result<(), ReconcilerDirectMultiChildCommittedFiberInspectionError> {
        let root = store
            .root(self.source.root)
            .map_err(TestRendererCommittedFiberInspectionError::from)?;
        if root.current() != self.store_current {
            return Err(
                ReconcilerDirectMultiChildCommittedFiberInspectionError::CurrentRootMismatch {
                    expected: self.store_current,
                    actual: root.current(),
                },
            );
        }
        if root.finished_work() != self.finished_work_after_commit {
            return Err(
                ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                    field: "finished_work_after_commit",
                },
            );
        }
        if root.finished_lanes() != self.finished_lanes_after_commit {
            return Err(
                ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                    field: "finished_lanes_after_commit",
                },
            );
        }

        let inspection =
            inspect_reconciler_direct_multi_child_committed_fiber_tree(store, self.source)?;
        if inspection.inspection != self.inspection {
            return Err(
                ReconcilerDirectMultiChildCommittedFiberInspectionError::StaleOrClonedInspectionRows,
            );
        }

        validate_reconciler_direct_multi_child_inspection(store, self.source, &self.inspection)?;
        Ok(())
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ReconcilerDirectMultiChildCommittedFiberInspectionError {
    FiberInspection(TestRendererCommittedFiberInspectionError),
    ExpectedShape { actual: &'static str },
    CurrentRootMismatch { expected: FiberId, actual: FiberId },
    SourceMismatch { field: &'static str },
    MissingCommittedSource { field: &'static str },
    CompatibilityClaim { surface: &'static str },
    StaleOrClonedInspectionRows,
}

impl Display for ReconcilerDirectMultiChildCommittedFiberInspectionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberInspection(error) => Display::fmt(error, formatter),
            Self::ExpectedShape { actual } => {
                write!(
                    formatter,
                    "expected direct multi-child host component fiber shape, found {actual}"
                )
            }
            Self::CurrentRootMismatch { expected, actual } => write!(
                formatter,
                "source-bound direct multi-child inspection expected current root fiber {}, found {}",
                expected.slot().get(),
                actual.slot().get()
            ),
            Self::SourceMismatch { field } => write!(
                formatter,
                "source-bound direct multi-child inspection source mismatch at {field}"
            ),
            Self::MissingCommittedSource { field } => write!(
                formatter,
                "source-bound direct multi-child inspection missing committed source evidence at {field}"
            ),
            Self::CompatibilityClaim { surface } => write!(
                formatter,
                "source-bound direct multi-child inspection cannot claim {surface} compatibility"
            ),
            Self::StaleOrClonedInspectionRows => write!(
                formatter,
                "source-bound direct multi-child inspection rows are stale or caller-built"
            ),
        }
    }
}

impl Error for ReconcilerDirectMultiChildCommittedFiberInspectionError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberInspection(error) => Some(error),
            Self::ExpectedShape { .. }
            | Self::CurrentRootMismatch { .. }
            | Self::SourceMismatch { .. }
            | Self::MissingCommittedSource { .. }
            | Self::CompatibilityClaim { .. }
            | Self::StaleOrClonedInspectionRows => None,
        }
    }
}

impl From<TestRendererCommittedFiberInspectionError>
    for ReconcilerDirectMultiChildCommittedFiberInspectionError
{
    fn from(error: TestRendererCommittedFiberInspectionError) -> Self {
        Self::FiberInspection(error)
    }
}

impl From<FiberTopologyError> for ReconcilerDirectMultiChildCommittedFiberInspectionError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberInspection(TestRendererCommittedFiberInspectionError::from(error))
    }
}

impl From<HostRootStateStoreError> for ReconcilerDirectMultiChildCommittedFiberInspectionError {
    fn from(error: HostRootStateStoreError) -> Self {
        Self::FiberInspection(TestRendererCommittedFiberInspectionError::from(error))
    }
}

pub fn record_reconciler_direct_multi_child_committed_fiber_source<H: HostTypes>(
    store: &FiberRootStore<H>,
    commit: &HostRootCommitRecord,
    component: FiberId,
    first_text: FiberId,
    second_text: FiberId,
) -> Result<
    ReconcilerDirectMultiChildCommittedFiberSource,
    ReconcilerDirectMultiChildCommittedFiberInspectionError,
> {
    let root = store
        .root(commit.root())
        .map_err(TestRendererCommittedFiberInspectionError::from)?;
    if root.current() != commit.current() {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::CurrentRootMismatch {
                expected: commit.current(),
                actual: root.current(),
            },
        );
    }
    if commit.finished_work() != commit.current() {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "commit.finished_work",
            },
        );
    }
    if commit.finished_lanes().is_empty()
        || commit.remaining_lanes().is_non_empty()
        || commit.pending_lanes().is_non_empty()
    {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "commit.lanes",
            },
        );
    }
    if root.finished_work().is_some() || root.finished_lanes().is_non_empty() {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "root.finished_work_after_commit",
            },
        );
    }

    let host_root_node = store.fiber_arena().get(commit.current())?;
    expect_fiber_tag(host_root_node, FiberTag::HostRoot)?;
    validate_host_root_state_node(commit.root(), host_root_node)?;
    if host_root_node.alternate() != Some(commit.previous_current()) {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "host_root.alternate",
            },
        );
    }
    let resulting_element = store
        .host_root_states()
        .get(host_root_node.memoized_state())?
        .element();
    let root_children = expect_child_count(store, commit.current(), 1)?;
    if root_children != [component] {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "source.root_child_identity",
            },
        );
    }

    let direct_children =
        inspect_host_component_with_text_children(store, component, &[first_text, second_text])?;
    let component_row = direct_children.component;
    let first_text_row = direct_children.texts[0];
    let second_text_row = direct_children.texts[1];
    let host_root_row = inspect_node(host_root_node);

    let source = ReconcilerDirectMultiChildCommittedFiberSource {
        root: commit.root(),
        root_token: commit.root().state_node_handle(),
        previous_current: commit.previous_current(),
        committed_current: commit.current(),
        resulting_element,
        render_lanes: commit.finished_lanes(),
        commit_finished_lanes: commit.finished_lanes(),
        commit_remaining_lanes: commit.remaining_lanes(),
        commit_pending_lanes: commit.pending_lanes(),
        finished_work_after_commit: root.finished_work(),
        finished_lanes_after_commit: root.finished_lanes(),
        host_root_source_row: host_root_row,
        component_source_row: component_row,
        first_text_source_row: first_text_row,
        second_text_source_row: second_text_row,
        component,
        component_element_type: component_row.element_type(),
        component_props: component_row.memoized_props(),
        component_state_node: component_row.state_node(),
        component_lanes: component_row.lanes(),
        component_child_lanes: component_row.child_lanes(),
        first_text,
        first_text_props: first_text_row.memoized_props(),
        first_text_state_node: first_text_row.state_node(),
        first_text_lanes: first_text_row.lanes(),
        second_text,
        second_text_props: second_text_row.memoized_props(),
        second_text_state_node: second_text_row.state_node(),
        second_text_lanes: second_text_row.lanes(),
        source_current_topology_recorded: true,
        host_node_store_state_nodes_present: host_root_row.state_node_present()
            && component_row.state_node_present()
            && first_text_row.state_node_present()
            && second_text_row.state_node_present(),
        public_serialization_compatibility_claimed: false,
        test_renderer_public_compatibility_claimed: false,
        react_dom_compatibility_claimed: false,
        native_execution_compatibility_claimed: false,
        broad_renderer_compatibility_claimed: false,
        act_compatibility_claimed: false,
        scheduler_compatibility_claimed: false,
        package_compatibility_claimed: false,
    };
    validate_reconciler_direct_multi_child_source(source)?;
    Ok(source)
}

pub fn inspect_reconciler_direct_multi_child_committed_fiber_tree<H: HostTypes>(
    store: &FiberRootStore<H>,
    source: ReconcilerDirectMultiChildCommittedFiberSource,
) -> Result<
    ReconcilerDirectMultiChildCommittedFiberInspection,
    ReconcilerDirectMultiChildCommittedFiberInspectionError,
> {
    validate_reconciler_direct_multi_child_source(source)?;
    let root = store
        .root(source.root)
        .map_err(TestRendererCommittedFiberInspectionError::from)?;
    let current = root.current();
    if current != source.committed_current {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::CurrentRootMismatch {
                expected: source.committed_current,
                actual: current,
            },
        );
    }
    if root.finished_work() != source.finished_work_after_commit {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "source.finished_work_after_commit",
            },
        );
    }
    if root.finished_lanes() != source.finished_lanes_after_commit {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "source.finished_lanes_after_commit",
            },
        );
    }

    let host_root_node = store.fiber_arena().get(current)?;
    expect_fiber_tag(host_root_node, FiberTag::HostRoot)?;
    validate_host_root_state_node(source.root, host_root_node)?;
    let resulting_element = store
        .host_root_states()
        .get(host_root_node.memoized_state())?
        .element();
    if resulting_element != source.resulting_element {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "source.resulting_element",
            },
        );
    }
    let root_children = expect_child_count(store, current, 1)?;
    if root_children != [source.component] {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "source.root_child_identity",
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
        inspect_node(host_root_node),
    );
    let inspection = builder.finish_host_component_shape(component)?;
    let rows = validate_reconciler_direct_multi_child_inspection(store, source, &inspection)?;

    Ok(ReconcilerDirectMultiChildCommittedFiberInspection {
        source,
        inspection,
        store_current: root.current(),
        finished_work_after_commit: root.finished_work(),
        finished_lanes_after_commit: root.finished_lanes(),
        rows,
    })
}

fn validate_reconciler_direct_multi_child_source(
    source: ReconcilerDirectMultiChildCommittedFiberSource,
) -> Result<(), ReconcilerDirectMultiChildCommittedFiberInspectionError> {
    if !source.source_current_topology_recorded {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::MissingCommittedSource {
                field: "source_current_topology_recorded",
            },
        );
    }
    if !source.host_node_store_state_nodes_present {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::MissingCommittedSource {
                field: "host_node_store_state_nodes_present",
            },
        );
    }
    if source.compatibility_claimed() {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::CompatibilityClaim {
                surface: claimed_direct_multi_child_source_surface(source),
            },
        );
    }
    if source.root_token != source.root.state_node_handle() {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "source.root_token",
            },
        );
    }
    if source.render_lanes.is_empty()
        || source.render_lanes != source.commit_finished_lanes
        || source.commit_remaining_lanes.is_non_empty()
        || source.commit_pending_lanes.is_non_empty()
    {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "source.commit_lanes",
            },
        );
    }
    if source.finished_work_after_commit.is_some()
        || source.finished_lanes_after_commit.is_non_empty()
    {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "source.finished_work_after_commit",
            },
        );
    }

    validate_reconciler_direct_multi_child_source_rows(source)
}

fn claimed_direct_multi_child_source_surface(
    source: ReconcilerDirectMultiChildCommittedFiberSource,
) -> &'static str {
    if source.public_serialization_compatibility_claimed {
        "public serialization"
    } else if source.test_renderer_public_compatibility_claimed {
        "react-test-renderer public compatibility"
    } else if source.react_dom_compatibility_claimed {
        "React DOM compatibility"
    } else if source.native_execution_compatibility_claimed {
        "native execution"
    } else if source.broad_renderer_compatibility_claimed {
        "broad renderer compatibility"
    } else if source.act_compatibility_claimed {
        "act compatibility"
    } else if source.scheduler_compatibility_claimed {
        "Scheduler compatibility"
    } else {
        "package compatibility"
    }
}

fn validate_reconciler_direct_multi_child_source_rows(
    source: ReconcilerDirectMultiChildCommittedFiberSource,
) -> Result<(), ReconcilerDirectMultiChildCommittedFiberInspectionError> {
    let host_root = source.host_root_source_row;
    if host_root.fiber() != source.committed_current
        || host_root.tag() != FiberTag::HostRoot
        || host_root.parent().is_some()
        || host_root.child() != Some(source.component)
        || host_root.sibling().is_some()
        || host_root.alternate() != Some(source.previous_current)
        || host_root.state_node() != source.root_token
        || !host_root.state_node_present()
    {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "source.host_root_row",
            },
        );
    }

    let component = source.component_source_row;
    if component.fiber() != source.component
        || component.tag() != FiberTag::HostComponent
        || component.parent() != Some(source.committed_current)
        || component.child() != Some(source.first_text)
        || component.sibling().is_some()
        || component.index() != 0
        || component.element_type() != source.component_element_type
        || component.pending_props() != source.component_props
        || component.memoized_props() != source.component_props
        || component.state_node() != source.component_state_node
        || component.lanes() != source.component_lanes
        || component.child_lanes() != source.component_child_lanes
        || !component.state_node_present()
    {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "source.component_row",
            },
        );
    }

    let first_text = source.first_text_source_row;
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
        || !first_text.state_node_present()
    {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "source.first_text_row",
            },
        );
    }

    let second_text = source.second_text_source_row;
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
        || !second_text.state_node_present()
    {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "source.second_text_row",
            },
        );
    }

    Ok(())
}

fn validate_reconciler_direct_multi_child_inspection<H: HostTypes>(
    store: &FiberRootStore<H>,
    source: ReconcilerDirectMultiChildCommittedFiberSource,
    inspection: &TestRendererCommittedFiberTreeInspection,
) -> Result<
    ReconcilerDirectMultiChildCommittedFiberRows,
    ReconcilerDirectMultiChildCommittedFiberInspectionError,
> {
    let root = store
        .root(source.root)
        .map_err(TestRendererCommittedFiberInspectionError::from)?;
    if root.current() != source.committed_current {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::CurrentRootMismatch {
                expected: source.committed_current,
                actual: root.current(),
            },
        );
    }
    if !inspection.is_direct_multi_child_host_component_shape() {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::ExpectedShape {
                actual: inspection.shape_name(),
            },
        );
    }
    if inspection.root() != source.root {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "inspection.root",
            },
        );
    }
    if inspection.current() != source.committed_current {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "inspection.current",
            },
        );
    }
    if inspection.resulting_element() != source.resulting_element {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
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
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "inspection.child_sets",
            },
        );
    }
    if inspection.public_serialization_compatibility_claimed()
        || inspection.test_renderer_public_compatibility_claimed()
        || inspection.react_dom_compatibility_claimed()
        || inspection.native_execution_compatibility_claimed()
        || inspection.broad_renderer_compatibility_claimed()
        || inspection.act_compatibility_claimed()
        || inspection.scheduler_compatibility_claimed()
        || inspection.package_compatibility_claimed()
    {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::CompatibilityClaim {
                surface: "inspection compatibility",
            },
        );
    }

    let host_root = inspection.host_root();
    let component = inspection.host_component();
    let first_text = inspection.host_texts()[0];
    let second_text = inspection.host_texts()[1];

    expect_reconciler_direct_current_row(store, host_root, "host_root.row")?;
    expect_reconciler_direct_current_row(store, component, "component.row")?;
    expect_reconciler_direct_current_row(store, first_text, "first_text.row")?;
    expect_reconciler_direct_current_row(store, second_text, "second_text.row")?;

    if host_root != source.host_root_source_row
        || component != source.component_source_row
        || first_text != source.first_text_source_row
        || second_text != source.second_text_source_row
    {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::StaleOrClonedInspectionRows,
        );
    }

    let previous_current = store.fiber_arena().get(source.previous_current)?;
    if previous_current.alternate() != Some(source.committed_current) {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "host_root.alternate_current",
            },
        );
    }
    let component_children = store.fiber_arena().child_ids(source.component)?;
    if component_children != [source.first_text, source.second_text] {
        return Err(
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "component.child_order",
            },
        );
    }

    Ok(ReconcilerDirectMultiChildCommittedFiberRows {
        host_root,
        component,
        first_text,
        second_text,
    })
}

fn expect_reconciler_direct_current_row<H: HostTypes>(
    store: &FiberRootStore<H>,
    row: TestRendererCommittedFiberNodeInspection,
    field: &'static str,
) -> Result<(), ReconcilerDirectMultiChildCommittedFiberInspectionError> {
    let current = inspect_node(store.fiber_arena().get(row.fiber())?);
    if current == row {
        Ok(())
    } else {
        Err(ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch { field })
    }
}

#[cfg(test)]
const SYNC_FLUSH_MINIMAL_HOST_PLACEMENT_FIBER_INSPECTION_COMPATIBILITY_BLOCKERS: &[&str] = &[
    "public root rendering",
    "public flushSync compatibility",
    "React DOM compatibility",
    "react-test-renderer public compatibility",
    "native execution",
    "broad renderer compatibility",
    "act compatibility",
    "Scheduler compatibility",
    "refs/effects/hydration execution",
    "package compatibility",
];

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SyncFlushMinimalHostPlacementCommittedFiberSource {
    root: FiberRootId,
    root_token: StateNodeHandle,
    previous_current: FiberId,
    committed_current: FiberId,
    rendered_finished_work: FiberId,
    root_element: RootElementHandle,
    render_lanes: Lanes,
    commit_finished_lanes: Lanes,
    commit_remaining_lanes: Lanes,
    commit_pending_lanes: Lanes,
    finished_work_after_commit: Option<FiberId>,
    finished_lanes_after_commit: Lanes,
    host_root_source_row: TestRendererCommittedFiberNodeInspection,
    component_source_row: TestRendererCommittedFiberNodeInspection,
    text_source_row: TestRendererCommittedFiberNodeInspection,
    component: FiberId,
    component_element_type: ElementTypeHandle,
    component_props: PropsHandle,
    component_state_node: StateNodeHandle,
    component_lanes: Lanes,
    component_child_lanes: Lanes,
    text: FiberId,
    text_props: PropsHandle,
    text_state_node: StateNodeHandle,
    text_lanes: Lanes,
    source_current_topology_recorded: bool,
    host_node_store_state_nodes_present: bool,
    public_root_rendering_claimed: bool,
    public_flush_sync_compatibility_claimed: bool,
    react_dom_compatibility_claimed: bool,
    test_renderer_public_compatibility_claimed: bool,
    native_execution_compatibility_claimed: bool,
    broad_renderer_compatibility_claimed: bool,
    act_compatibility_claimed: bool,
    scheduler_compatibility_claimed: bool,
    refs_effects_hydration_execution_claimed: bool,
    package_compatibility_claimed: bool,
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum SyncFlushMinimalHostPlacementCompatibilityClaimForCanary {
    PublicRootRendering,
    PublicFlushSync,
    ReactDom,
    TestRendererPublic,
    NativeExecution,
    BroadRenderer,
    Act,
    Scheduler,
    RefsEffectsHydration,
    Package,
}

#[cfg(test)]
impl SyncFlushMinimalHostPlacementCompatibilityClaimForCanary {
    #[must_use]
    pub(crate) const fn surface(self) -> &'static str {
        match self {
            Self::PublicRootRendering => "public root rendering",
            Self::PublicFlushSync => "public flushSync",
            Self::ReactDom => "React DOM",
            Self::TestRendererPublic => "react-test-renderer public",
            Self::NativeExecution => "native execution",
            Self::BroadRenderer => "broad renderer",
            Self::Act => "act",
            Self::Scheduler => "Scheduler",
            Self::RefsEffectsHydration => "refs/effects/hydration execution",
            Self::Package => "package",
        }
    }
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "test-only sync-flush minimal placement fiber source exposes focused hostile tamper hooks"
)]
impl SyncFlushMinimalHostPlacementCommittedFiberSource {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn root_token(self) -> StateNodeHandle {
        self.root_token
    }

    #[must_use]
    pub(crate) const fn previous_current(self) -> FiberId {
        self.previous_current
    }

    #[must_use]
    pub(crate) const fn committed_current(self) -> FiberId {
        self.committed_current
    }

    #[must_use]
    pub(crate) const fn rendered_finished_work(self) -> FiberId {
        self.rendered_finished_work
    }

    #[must_use]
    pub(crate) const fn root_element(self) -> RootElementHandle {
        self.root_element
    }

    #[must_use]
    pub(crate) const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn commit_finished_lanes(self) -> Lanes {
        self.commit_finished_lanes
    }

    #[must_use]
    pub(crate) const fn commit_remaining_lanes(self) -> Lanes {
        self.commit_remaining_lanes
    }

    #[must_use]
    pub(crate) const fn commit_pending_lanes(self) -> Lanes {
        self.commit_pending_lanes
    }

    #[must_use]
    pub(crate) const fn finished_work_after_commit(self) -> Option<FiberId> {
        self.finished_work_after_commit
    }

    #[must_use]
    pub(crate) const fn finished_lanes_after_commit(self) -> Lanes {
        self.finished_lanes_after_commit
    }

    #[must_use]
    pub(crate) const fn host_root_source_row(self) -> TestRendererCommittedFiberNodeInspection {
        self.host_root_source_row
    }

    #[must_use]
    pub(crate) const fn component_source_row(self) -> TestRendererCommittedFiberNodeInspection {
        self.component_source_row
    }

    #[must_use]
    pub(crate) const fn text_source_row(self) -> TestRendererCommittedFiberNodeInspection {
        self.text_source_row
    }

    #[must_use]
    pub(crate) const fn component(self) -> FiberId {
        self.component
    }

    #[must_use]
    pub(crate) const fn component_element_type(self) -> ElementTypeHandle {
        self.component_element_type
    }

    #[must_use]
    pub(crate) const fn component_props(self) -> PropsHandle {
        self.component_props
    }

    #[must_use]
    pub(crate) const fn component_state_node(self) -> StateNodeHandle {
        self.component_state_node
    }

    #[must_use]
    pub(crate) const fn component_lanes(self) -> Lanes {
        self.component_lanes
    }

    #[must_use]
    pub(crate) const fn component_child_lanes(self) -> Lanes {
        self.component_child_lanes
    }

    #[must_use]
    pub(crate) const fn text(self) -> FiberId {
        self.text
    }

    #[must_use]
    pub(crate) const fn text_props(self) -> PropsHandle {
        self.text_props
    }

    #[must_use]
    pub(crate) const fn text_state_node(self) -> StateNodeHandle {
        self.text_state_node
    }

    #[must_use]
    pub(crate) const fn text_lanes(self) -> Lanes {
        self.text_lanes
    }

    #[must_use]
    pub(crate) const fn source_current_topology_recorded(self) -> bool {
        self.source_current_topology_recorded
    }

    #[must_use]
    pub(crate) const fn host_node_store_state_nodes_present(self) -> bool {
        self.host_node_store_state_nodes_present
    }

    #[must_use]
    pub(crate) fn public_compatibility_blockers(&self) -> &[&'static str] {
        SYNC_FLUSH_MINIMAL_HOST_PLACEMENT_FIBER_INSPECTION_COMPATIBILITY_BLOCKERS
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(self) -> bool {
        !self.public_root_rendering_claimed
    }

    #[must_use]
    pub(crate) const fn public_flush_sync_compatibility_blocked(self) -> bool {
        !self.public_flush_sync_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn react_dom_compatibility_blocked(self) -> bool {
        !self.react_dom_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn test_renderer_public_compatibility_blocked(self) -> bool {
        !self.test_renderer_public_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn native_execution_blocked(self) -> bool {
        !self.native_execution_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn broad_renderer_compatibility_blocked(self) -> bool {
        !self.broad_renderer_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn act_compatibility_blocked(self) -> bool {
        !self.act_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn scheduler_compatibility_blocked(self) -> bool {
        !self.scheduler_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn refs_effects_hydration_execution_blocked(self) -> bool {
        !self.refs_effects_hydration_execution_claimed
    }

    #[must_use]
    pub(crate) const fn package_compatibility_blocked(self) -> bool {
        !self.package_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_claimed(self) -> bool {
        self.public_root_rendering_claimed
    }

    #[must_use]
    pub(crate) const fn public_flush_sync_compatibility_claimed(self) -> bool {
        self.public_flush_sync_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn react_dom_compatibility_claimed(self) -> bool {
        self.react_dom_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn test_renderer_public_compatibility_claimed(self) -> bool {
        self.test_renderer_public_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn native_execution_compatibility_claimed(self) -> bool {
        self.native_execution_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn broad_renderer_compatibility_claimed(self) -> bool {
        self.broad_renderer_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn act_compatibility_claimed(self) -> bool {
        self.act_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn scheduler_compatibility_claimed(self) -> bool {
        self.scheduler_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn refs_effects_hydration_execution_claimed(self) -> bool {
        self.refs_effects_hydration_execution_claimed
    }

    #[must_use]
    pub(crate) const fn package_compatibility_claimed(self) -> bool {
        self.package_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn compatibility_claimed(self) -> bool {
        self.public_root_rendering_claimed
            || self.public_flush_sync_compatibility_claimed
            || self.react_dom_compatibility_claimed
            || self.test_renderer_public_compatibility_claimed
            || self.native_execution_compatibility_claimed
            || self.broad_renderer_compatibility_claimed
            || self.act_compatibility_claimed
            || self.scheduler_compatibility_claimed
            || self.refs_effects_hydration_execution_claimed
            || self.package_compatibility_claimed
    }

    #[must_use]
    pub(crate) fn with_root_and_token_for_canary(mut self, root: FiberRootId) -> Self {
        self.root = root;
        self.root_token = root.state_node_handle();
        self
    }

    #[must_use]
    pub(crate) const fn with_component_for_canary(mut self, component: FiberId) -> Self {
        self.component = component;
        self
    }

    #[must_use]
    pub(crate) const fn with_text_for_canary(mut self, text: FiberId) -> Self {
        self.text = text;
        self
    }

    #[must_use]
    pub(crate) const fn with_component_state_node_for_canary(
        mut self,
        state_node: StateNodeHandle,
    ) -> Self {
        self.component_state_node = state_node;
        self
    }

    #[must_use]
    pub(crate) const fn with_text_state_node_for_canary(
        mut self,
        state_node: StateNodeHandle,
    ) -> Self {
        self.text_state_node = state_node;
        self
    }

    #[must_use]
    pub(crate) const fn with_finished_work_after_commit_for_canary(
        mut self,
        finished_work: Option<FiberId>,
    ) -> Self {
        self.finished_work_after_commit = finished_work;
        self
    }

    #[must_use]
    pub(crate) const fn with_finished_lanes_after_commit_for_canary(
        mut self,
        finished_lanes: Lanes,
    ) -> Self {
        self.finished_lanes_after_commit = finished_lanes;
        self
    }

    #[must_use]
    pub(crate) const fn with_component_source_row_for_canary(
        mut self,
        row: TestRendererCommittedFiberNodeInspection,
    ) -> Self {
        self.component_source_row = row;
        self
    }

    #[must_use]
    pub(crate) const fn with_compatibility_claim_for_canary(
        mut self,
        claim: SyncFlushMinimalHostPlacementCompatibilityClaimForCanary,
    ) -> Self {
        match claim {
            SyncFlushMinimalHostPlacementCompatibilityClaimForCanary::PublicRootRendering => {
                self.public_root_rendering_claimed = true;
            }
            SyncFlushMinimalHostPlacementCompatibilityClaimForCanary::PublicFlushSync => {
                self.public_flush_sync_compatibility_claimed = true;
            }
            SyncFlushMinimalHostPlacementCompatibilityClaimForCanary::ReactDom => {
                self.react_dom_compatibility_claimed = true;
            }
            SyncFlushMinimalHostPlacementCompatibilityClaimForCanary::TestRendererPublic => {
                self.test_renderer_public_compatibility_claimed = true;
            }
            SyncFlushMinimalHostPlacementCompatibilityClaimForCanary::NativeExecution => {
                self.native_execution_compatibility_claimed = true;
            }
            SyncFlushMinimalHostPlacementCompatibilityClaimForCanary::BroadRenderer => {
                self.broad_renderer_compatibility_claimed = true;
            }
            SyncFlushMinimalHostPlacementCompatibilityClaimForCanary::Act => {
                self.act_compatibility_claimed = true;
            }
            SyncFlushMinimalHostPlacementCompatibilityClaimForCanary::Scheduler => {
                self.scheduler_compatibility_claimed = true;
            }
            SyncFlushMinimalHostPlacementCompatibilityClaimForCanary::RefsEffectsHydration => {
                self.refs_effects_hydration_execution_claimed = true;
            }
            SyncFlushMinimalHostPlacementCompatibilityClaimForCanary::Package => {
                self.package_compatibility_claimed = true;
            }
        }
        self
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct SyncFlushMinimalHostPlacementCommittedFiberRows {
    host_root: TestRendererCommittedFiberNodeInspection,
    component: TestRendererCommittedFiberNodeInspection,
    text: TestRendererCommittedFiberNodeInspection,
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SyncFlushMinimalHostPlacementCommittedFiberInspection {
    source: SyncFlushMinimalHostPlacementCommittedFiberSource,
    inspection: TestRendererCommittedFiberTreeInspection,
    store_current: FiberId,
    finished_work_after_commit: Option<FiberId>,
    finished_lanes_after_commit: Lanes,
    rows: SyncFlushMinimalHostPlacementCommittedFiberRows,
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "test-only sync-flush minimal placement fiber proof is consumed by focused canaries"
)]
impl SyncFlushMinimalHostPlacementCommittedFiberInspection {
    #[must_use]
    pub(crate) const fn source(&self) -> SyncFlushMinimalHostPlacementCommittedFiberSource {
        self.source
    }

    #[must_use]
    pub(crate) const fn store_current(&self) -> FiberId {
        self.store_current
    }

    #[must_use]
    pub(crate) const fn finished_work_after_commit(&self) -> Option<FiberId> {
        self.finished_work_after_commit
    }

    #[must_use]
    pub(crate) const fn finished_lanes_after_commit(&self) -> Lanes {
        self.finished_lanes_after_commit
    }

    #[must_use]
    pub(crate) fn tree(&self) -> &TestRendererCommittedFiberTreeInspection {
        &self.inspection
    }

    #[must_use]
    pub(crate) fn shape_name(&self) -> &'static str {
        self.inspection.shape_name()
    }

    #[must_use]
    pub(crate) const fn host_root(&self) -> TestRendererCommittedFiberNodeInspection {
        self.rows.host_root
    }

    #[must_use]
    pub(crate) const fn host_component(&self) -> TestRendererCommittedFiberNodeInspection {
        self.rows.component
    }

    #[must_use]
    pub(crate) const fn host_text(&self) -> TestRendererCommittedFiberNodeInspection {
        self.rows.text
    }

    #[must_use]
    pub(crate) fn blockers(&self) -> &[&'static str] {
        self.source.public_compatibility_blockers()
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_flush_sync_compatibility_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn react_dom_compatibility_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn test_renderer_public_compatibility_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn native_execution_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn broad_renderer_compatibility_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn act_compatibility_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn scheduler_compatibility_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn refs_effects_hydration_execution_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn package_compatibility_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_flush_sync_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn react_dom_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn test_renderer_public_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn native_execution_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn broad_renderer_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn act_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn scheduler_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn refs_effects_hydration_execution_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn package_compatibility_claimed(&self) -> bool {
        false
    }

    pub(crate) fn validate_against_store<H: HostTypes>(
        &self,
        store: &FiberRootStore<H>,
    ) -> Result<(), SyncFlushMinimalHostPlacementCommittedFiberInspectionError> {
        let root = store
            .root(self.source.root)
            .map_err(TestRendererCommittedFiberInspectionError::from)?;
        if root.current() != self.store_current {
            return Err(
                SyncFlushMinimalHostPlacementCommittedFiberInspectionError::CurrentRootMismatch {
                    expected: self.store_current,
                    actual: root.current(),
                },
            );
        }
        if root.finished_work() != self.finished_work_after_commit {
            return Err(
                SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                    field: "finished_work_after_commit",
                },
            );
        }
        if root.finished_lanes() != self.finished_lanes_after_commit {
            return Err(
                SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                    field: "finished_lanes_after_commit",
                },
            );
        }

        let inspection =
            inspect_sync_flush_minimal_host_placement_committed_fiber_tree(store, self.source)?;
        if inspection.inspection != self.inspection {
            return Err(
                SyncFlushMinimalHostPlacementCommittedFiberInspectionError::StaleOrClonedInspectionRows,
            );
        }

        validate_sync_flush_minimal_host_placement_committed_fiber_inspection(
            store,
            self.source,
            &self.inspection,
        )?;
        Ok(())
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum SyncFlushMinimalHostPlacementCommittedFiberInspectionError {
    FiberInspection(TestRendererCommittedFiberInspectionError),
    ExpectedShape { actual: &'static str },
    CurrentRootMismatch { expected: FiberId, actual: FiberId },
    SourceMismatch { field: &'static str },
    MissingCommittedSource { field: &'static str },
    CompatibilityClaim { surface: &'static str },
    StaleOrClonedInspectionRows,
}

#[cfg(test)]
impl Display for SyncFlushMinimalHostPlacementCommittedFiberInspectionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberInspection(error) => Display::fmt(error, formatter),
            Self::ExpectedShape { actual } => write!(
                formatter,
                "expected sync-flush minimal HostRoot->HostComponent->HostText fiber shape, found {actual}"
            ),
            Self::CurrentRootMismatch { expected, actual } => write!(
                formatter,
                "source-bound sync-flush minimal placement inspection expected current root fiber {}, found {}",
                expected.slot().get(),
                actual.slot().get()
            ),
            Self::SourceMismatch { field } => write!(
                formatter,
                "source-bound sync-flush minimal placement inspection source mismatch at {field}"
            ),
            Self::MissingCommittedSource { field } => write!(
                formatter,
                "source-bound sync-flush minimal placement inspection missing committed source evidence at {field}"
            ),
            Self::CompatibilityClaim { surface } => write!(
                formatter,
                "source-bound sync-flush minimal placement inspection cannot claim {surface} compatibility"
            ),
            Self::StaleOrClonedInspectionRows => write!(
                formatter,
                "source-bound sync-flush minimal placement inspection rows are stale or caller-built"
            ),
        }
    }
}

#[cfg(test)]
impl Error for SyncFlushMinimalHostPlacementCommittedFiberInspectionError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberInspection(error) => Some(error),
            Self::ExpectedShape { .. }
            | Self::CurrentRootMismatch { .. }
            | Self::SourceMismatch { .. }
            | Self::MissingCommittedSource { .. }
            | Self::CompatibilityClaim { .. }
            | Self::StaleOrClonedInspectionRows => None,
        }
    }
}

#[cfg(test)]
impl From<TestRendererCommittedFiberInspectionError>
    for SyncFlushMinimalHostPlacementCommittedFiberInspectionError
{
    fn from(error: TestRendererCommittedFiberInspectionError) -> Self {
        Self::FiberInspection(error)
    }
}

#[cfg(test)]
impl From<FiberTopologyError> for SyncFlushMinimalHostPlacementCommittedFiberInspectionError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberInspection(TestRendererCommittedFiberInspectionError::from(error))
    }
}

#[cfg(test)]
impl From<HostRootStateStoreError> for SyncFlushMinimalHostPlacementCommittedFiberInspectionError {
    fn from(error: HostRootStateStoreError) -> Self {
        Self::FiberInspection(TestRendererCommittedFiberInspectionError::from(error))
    }
}

#[cfg(test)]
pub(crate) fn record_sync_flush_minimal_host_placement_committed_fiber_source<H: HostTypes>(
    store: &FiberRootStore<H>,
    record: &SyncFlushMinimalHostPlacementCommitRecordForCanary,
) -> Result<
    SyncFlushMinimalHostPlacementCommittedFiberSource,
    SyncFlushMinimalHostPlacementCommittedFiberInspectionError,
> {
    let root_id = record.root();
    let root = store
        .root(root_id)
        .map_err(TestRendererCommittedFiberInspectionError::from)?;
    let sync_flush_record = record.sync_flush_record();
    let render = sync_flush_record.render_phase();
    let placement = record.placement();
    let commit = placement.commit();
    let placement_commit = placement.placement_commit();
    let complete_handoff = placement.complete_handoff();
    let complete_work = placement.complete_work();

    if !record.accepted_sync_flush_minimal_host_placement_handoff() {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "sync_flush_minimal_host_placement_handoff",
            },
        );
    }
    if root.current() != commit.current() {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::CurrentRootMismatch {
                expected: commit.current(),
                actual: root.current(),
            },
        );
    }
    if commit.current() != render.finished_work()
        || commit.current() != record.finished_work()
        || placement_commit.finished_work() != commit.current()
        || complete_work.host_root_work_in_progress() != commit.current()
    {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "placement.finished_work",
            },
        );
    }
    if root.finished_work().is_some() || root.finished_lanes().is_non_empty() {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "root.finished_work_after_commit",
            },
        );
    }
    if placement_commit.root() != commit.root()
        || placement_commit.previous_current() != commit.previous_current()
        || placement_commit.component() != complete_work.component()
        || placement_commit.text() != complete_work.text()
        || placement_commit.component_state_node() != complete_work.component_state_node()
        || placement_commit.text_state_node() != complete_work.text_state_node()
    {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "placement_commit",
            },
        );
    }

    let host_root_node = store.fiber_arena().get(commit.current())?;
    expect_fiber_tag(host_root_node, FiberTag::HostRoot)?;
    validate_host_root_state_node(root_id, host_root_node)?;
    let resulting_element = store
        .host_root_states()
        .get(host_root_node.memoized_state())?
        .element();
    if resulting_element != complete_handoff.root_element() {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "root_element",
            },
        );
    }
    let root_children = expect_child_count(store, commit.current(), 1)?;
    if root_children != [placement_commit.component()] {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "root_child_identity",
            },
        );
    }

    let component_with_text = inspect_host_component_with_text_children(
        store,
        placement_commit.component(),
        &[placement_commit.text()],
    )?;
    let host_root_row = inspect_node(host_root_node);
    let component_row = component_with_text.component;
    let text_row = component_with_text.texts[0];

    if component_row.element_type() != complete_handoff.render().root_child_element_type()
        || component_row.pending_props() != complete_handoff.render().root_child_props()
        || component_row.memoized_props() != complete_handoff.render().root_child_props()
        || text_row.pending_props() != complete_handoff.render().text_child_props()
        || text_row.memoized_props() != complete_handoff.render().text_child_props()
    {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "render_props",
            },
        );
    }

    let source = SyncFlushMinimalHostPlacementCommittedFiberSource {
        root: root_id,
        root_token: root_id.state_node_handle(),
        previous_current: commit.previous_current(),
        committed_current: commit.current(),
        rendered_finished_work: render.finished_work(),
        root_element: complete_handoff.root_element(),
        render_lanes: record.render_lanes(),
        commit_finished_lanes: commit.finished_lanes(),
        commit_remaining_lanes: commit.remaining_lanes(),
        commit_pending_lanes: commit.pending_lanes(),
        finished_work_after_commit: root.finished_work(),
        finished_lanes_after_commit: root.finished_lanes(),
        host_root_source_row: host_root_row,
        component_source_row: component_row,
        text_source_row: text_row,
        component: placement_commit.component(),
        component_element_type: complete_handoff.render().root_child_element_type(),
        component_props: complete_handoff.render().root_child_props(),
        component_state_node: placement_commit.component_state_node(),
        component_lanes: component_row.lanes(),
        component_child_lanes: component_row.child_lanes(),
        text: placement_commit.text(),
        text_props: complete_handoff.render().text_child_props(),
        text_state_node: placement_commit.text_state_node(),
        text_lanes: text_row.lanes(),
        source_current_topology_recorded: true,
        host_node_store_state_nodes_present: host_root_row.state_node_present()
            && component_row.state_node_present()
            && text_row.state_node_present(),
        public_root_rendering_claimed: false,
        public_flush_sync_compatibility_claimed: false,
        react_dom_compatibility_claimed: false,
        test_renderer_public_compatibility_claimed: false,
        native_execution_compatibility_claimed: false,
        broad_renderer_compatibility_claimed: false,
        act_compatibility_claimed: false,
        scheduler_compatibility_claimed: false,
        refs_effects_hydration_execution_claimed: false,
        package_compatibility_claimed: false,
    };
    validate_sync_flush_minimal_host_placement_committed_fiber_source(source)?;
    Ok(source)
}

#[cfg(test)]
pub(crate) fn inspect_sync_flush_minimal_host_placement_committed_fiber_tree<H: HostTypes>(
    store: &FiberRootStore<H>,
    source: SyncFlushMinimalHostPlacementCommittedFiberSource,
) -> Result<
    SyncFlushMinimalHostPlacementCommittedFiberInspection,
    SyncFlushMinimalHostPlacementCommittedFiberInspectionError,
> {
    validate_sync_flush_minimal_host_placement_committed_fiber_source(source)?;
    let root = store
        .root(source.root)
        .map_err(TestRendererCommittedFiberInspectionError::from)?;
    let current = root.current();
    if current != source.committed_current {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::CurrentRootMismatch {
                expected: source.committed_current,
                actual: current,
            },
        );
    }
    if root.finished_work() != source.finished_work_after_commit {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "source.finished_work_after_commit",
            },
        );
    }
    if root.finished_lanes() != source.finished_lanes_after_commit {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "source.finished_lanes_after_commit",
            },
        );
    }

    let inspection = inspect_test_renderer_committed_fiber_tree(store, source.root)?;
    let rows = validate_sync_flush_minimal_host_placement_committed_fiber_inspection(
        store,
        source,
        &inspection,
    )?;

    Ok(SyncFlushMinimalHostPlacementCommittedFiberInspection {
        source,
        inspection,
        store_current: root.current(),
        finished_work_after_commit: root.finished_work(),
        finished_lanes_after_commit: root.finished_lanes(),
        rows,
    })
}

#[cfg(test)]
fn validate_sync_flush_minimal_host_placement_committed_fiber_source(
    source: SyncFlushMinimalHostPlacementCommittedFiberSource,
) -> Result<(), SyncFlushMinimalHostPlacementCommittedFiberInspectionError> {
    if !source.source_current_topology_recorded {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::MissingCommittedSource {
                field: "source_current_topology_recorded",
            },
        );
    }
    if !source.host_node_store_state_nodes_present {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::MissingCommittedSource {
                field: "host_node_store_state_nodes_present",
            },
        );
    }
    if source.compatibility_claimed() {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::CompatibilityClaim {
                surface: claimed_sync_flush_minimal_host_placement_source_surface(source),
            },
        );
    }
    if source.root_token != source.root.state_node_handle() {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "source.root_token",
            },
        );
    }
    if source.committed_current != source.rendered_finished_work {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "source.rendered_finished_work",
            },
        );
    }
    if source.render_lanes.is_empty()
        || source.render_lanes != source.commit_finished_lanes
        || source.commit_remaining_lanes.is_non_empty()
        || source.commit_pending_lanes.is_non_empty()
        || source.finished_work_after_commit.is_some()
        || source.finished_lanes_after_commit.is_non_empty()
    {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "source.commit_lanes",
            },
        );
    }

    validate_sync_flush_minimal_host_placement_committed_fiber_source_rows(source)
}

#[cfg(test)]
fn claimed_sync_flush_minimal_host_placement_source_surface(
    source: SyncFlushMinimalHostPlacementCommittedFiberSource,
) -> &'static str {
    if source.public_root_rendering_claimed {
        "public root rendering"
    } else if source.public_flush_sync_compatibility_claimed {
        "public flushSync"
    } else if source.react_dom_compatibility_claimed {
        "React DOM"
    } else if source.test_renderer_public_compatibility_claimed {
        "react-test-renderer public"
    } else if source.native_execution_compatibility_claimed {
        "native execution"
    } else if source.broad_renderer_compatibility_claimed {
        "broad renderer"
    } else if source.act_compatibility_claimed {
        "act"
    } else if source.scheduler_compatibility_claimed {
        "Scheduler"
    } else if source.refs_effects_hydration_execution_claimed {
        "refs/effects/hydration execution"
    } else {
        "package"
    }
}

#[cfg(test)]
fn validate_sync_flush_minimal_host_placement_committed_fiber_source_rows(
    source: SyncFlushMinimalHostPlacementCommittedFiberSource,
) -> Result<(), SyncFlushMinimalHostPlacementCommittedFiberInspectionError> {
    let host_root = source.host_root_source_row;
    if host_root.fiber() != source.committed_current
        || host_root.tag() != FiberTag::HostRoot
        || host_root.parent().is_some()
        || host_root.child() != Some(source.component)
        || host_root.sibling().is_some()
        || host_root.alternate() != Some(source.previous_current)
        || host_root.state_node() != source.root_token
        || !host_root.state_node_present()
    {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "source.host_root_row",
            },
        );
    }

    let component = source.component_source_row;
    if component.fiber() != source.component
        || component.tag() != FiberTag::HostComponent
        || component.parent() != Some(source.committed_current)
        || component.child() != Some(source.text)
        || component.sibling().is_some()
        || component.index() != 0
        || component.alternate().is_some()
        || component.element_type() != source.component_element_type
        || component.pending_props() != source.component_props
        || component.memoized_props() != source.component_props
        || component.state_node() != source.component_state_node
        || component.lanes() != source.component_lanes
        || component.child_lanes() != source.component_child_lanes
        || !component.state_node_present()
    {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "source.component_row",
            },
        );
    }

    let text = source.text_source_row;
    if text.fiber() != source.text
        || text.tag() != FiberTag::HostText
        || text.parent() != Some(source.component)
        || text.child().is_some()
        || text.sibling().is_some()
        || text.index() != 0
        || text.alternate().is_some()
        || text.pending_props() != source.text_props
        || text.memoized_props() != source.text_props
        || text.state_node() != source.text_state_node
        || text.lanes() != source.text_lanes
        || !text.state_node_present()
    {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "source.text_row",
            },
        );
    }

    Ok(())
}

#[cfg(test)]
fn validate_sync_flush_minimal_host_placement_committed_fiber_inspection<H: HostTypes>(
    store: &FiberRootStore<H>,
    source: SyncFlushMinimalHostPlacementCommittedFiberSource,
    inspection: &TestRendererCommittedFiberTreeInspection,
) -> Result<
    SyncFlushMinimalHostPlacementCommittedFiberRows,
    SyncFlushMinimalHostPlacementCommittedFiberInspectionError,
> {
    let root = store
        .root(source.root)
        .map_err(TestRendererCommittedFiberInspectionError::from)?;
    if root.current() != source.committed_current {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::CurrentRootMismatch {
                expected: source.committed_current,
                actual: root.current(),
            },
        );
    }
    if root.finished_work() != source.finished_work_after_commit {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "source.finished_work_after_commit",
            },
        );
    }
    if root.finished_lanes() != source.finished_lanes_after_commit {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "source.finished_lanes_after_commit",
            },
        );
    }
    if inspection.shape_name() != "HostRoot->HostComponent->HostText" {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::ExpectedShape {
                actual: inspection.shape_name(),
            },
        );
    }
    if inspection.root() != source.root
        || inspection.current() != source.committed_current
        || inspection.resulting_element() != source.root_element
    {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "inspection.root_current_element",
            },
        );
    }
    if inspection.nodes().len() != 3
        || inspection.root_children().len() != 1
        || inspection.host_children().len() != 1
        || inspection.host_components().len() != 1
        || inspection.host_texts().len() != 1
        || inspection.has_function_component_wrapper()
        || inspection.nested_host_component().is_some()
        || inspection.is_direct_multi_child_host_component_shape()
    {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "inspection.child_sets",
            },
        );
    }
    if inspection.public_serialization_compatibility_claimed()
        || inspection.test_renderer_public_compatibility_claimed()
        || inspection.react_dom_compatibility_claimed()
        || inspection.native_execution_compatibility_claimed()
        || inspection.broad_renderer_compatibility_claimed()
        || inspection.act_compatibility_claimed()
        || inspection.scheduler_compatibility_claimed()
        || inspection.package_compatibility_claimed()
    {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::CompatibilityClaim {
                surface: "inspection compatibility",
            },
        );
    }

    let host_root = inspection.host_root();
    let component = inspection.host_component();
    let text = inspection.host_text();

    expect_sync_flush_minimal_host_placement_current_row(store, host_root, "host_root.row")?;
    expect_sync_flush_minimal_host_placement_current_row(store, component, "component.row")?;
    expect_sync_flush_minimal_host_placement_current_row(store, text, "text.row")?;

    if host_root != source.host_root_source_row
        || component != source.component_source_row
        || text != source.text_source_row
    {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::StaleOrClonedInspectionRows,
        );
    }

    let previous_current = store.fiber_arena().get(source.previous_current)?;
    if previous_current.alternate() != Some(source.committed_current) {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "host_root.alternate_current",
            },
        );
    }
    let component_children = store.fiber_arena().child_ids(source.component)?;
    if component_children != [source.text] {
        return Err(
            SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch {
                field: "component.child_order",
            },
        );
    }

    Ok(SyncFlushMinimalHostPlacementCommittedFiberRows {
        host_root,
        component,
        text,
    })
}

#[cfg(test)]
fn expect_sync_flush_minimal_host_placement_current_row<H: HostTypes>(
    store: &FiberRootStore<H>,
    row: TestRendererCommittedFiberNodeInspection,
    field: &'static str,
) -> Result<(), SyncFlushMinimalHostPlacementCommittedFiberInspectionError> {
    let current = inspect_node(store.fiber_arena().get(row.fiber())?);
    if current == row {
        Ok(())
    } else {
        Err(SyncFlushMinimalHostPlacementCommittedFiberInspectionError::SourceMismatch { field })
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
        HostRootCommitRecord, HostRootRenderPhaseRecord, RootOptions,
        TestRendererHostOutputCanaryFixture, commit_finished_host_root,
        finish_test_renderer_host_output_canary_fibers,
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

    #[derive(Debug, Clone)]
    struct SourceBoundDirectMultiChildFixture {
        commit: HostRootCommitRecord,
        component: FiberId,
        first_text: FiberId,
        second_text: FiberId,
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

    fn commit_source_bound_direct_multi_child_host_component_shape(
        store: &mut FiberRootStore<Host>,
        render: HostRootRenderPhaseRecord,
    ) -> SourceBoundDirectMultiChildFixture {
        commit_source_bound_direct_multi_child_host_component_shape_with_order(store, render, false)
    }

    fn commit_source_bound_direct_multi_child_host_component_shape_with_order(
        store: &mut FiberRootStore<Host>,
        render: HostRootRenderPhaseRecord,
        reversed_text_order: bool,
    ) -> SourceBoundDirectMultiChildFixture {
        let host_root = render.work_in_progress();
        let component = create_host_component_fiber(store, host_root, 291, 292, 391);
        let first_text = create_host_text_fiber(store, host_root, 293, 392);
        let second_text = create_host_text_fiber(store, host_root, 294, 393);
        {
            let node = store.fiber_arena_mut().get_mut(component).unwrap();
            node.set_lanes(Lanes::SYNC);
            node.set_child_lanes(Lanes::DEFAULT);
        }
        store
            .fiber_arena_mut()
            .get_mut(first_text)
            .unwrap()
            .set_lanes(Lanes::DEFAULT);
        store
            .fiber_arena_mut()
            .get_mut(second_text)
            .unwrap()
            .set_lanes(Lanes::TRANSITION);

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

        SourceBoundDirectMultiChildFixture {
            commit,
            component,
            first_text,
            second_text,
        }
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
    fn source_bound_reconciler_private_fiber_inspection_describes_direct_multi_child_host_component_shape()
     {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(290));
        let fixture =
            commit_source_bound_direct_multi_child_host_component_shape(&mut store, render);

        let source = record_reconciler_direct_multi_child_committed_fiber_source(
            &store,
            &fixture.commit,
            fixture.component,
            fixture.first_text,
            fixture.second_text,
        )
        .unwrap();
        let proof =
            inspect_reconciler_direct_multi_child_committed_fiber_tree(&store, source).unwrap();

        assert_eq!(source.root(), root_id);
        assert_eq!(source.root_token(), root_id.state_node_handle());
        assert_eq!(source.previous_current(), fixture.commit.previous_current());
        assert_eq!(source.committed_current(), fixture.commit.current());
        assert_eq!(source.resulting_element(), RootElementHandle::from_raw(290));
        assert_eq!(source.render_lanes(), fixture.commit.finished_lanes());
        assert_eq!(
            source.commit_finished_lanes(),
            fixture.commit.finished_lanes()
        );
        assert_eq!(source.commit_remaining_lanes(), Lanes::NO);
        assert_eq!(source.commit_pending_lanes(), Lanes::NO);
        assert_eq!(source.finished_work_after_commit(), None);
        assert_eq!(source.finished_lanes_after_commit(), Lanes::NO);
        assert_eq!(source.component(), fixture.component);
        assert_eq!(source.first_text(), fixture.first_text);
        assert_eq!(source.second_text(), fixture.second_text);
        assert!(source.source_current_topology_recorded());
        assert!(source.host_node_store_state_nodes_present());
        assert!(source.public_serialization_blocked());
        assert!(source.test_renderer_public_compatibility_blocked());
        assert!(source.react_dom_compatibility_blocked());
        assert!(source.native_execution_blocked());
        assert!(source.package_compatibility_blocked());
        assert!(!source.compatibility_claimed());

        assert_eq!(
            proof.shape_name(),
            "HostRoot->HostComponent->[HostText,HostText]"
        );
        assert_eq!(
            proof.tree().fiber_tag_order(),
            [
                FiberTag::HostRoot,
                FiberTag::HostComponent,
                FiberTag::HostText,
                FiberTag::HostText
            ]
        );
        assert!(proof.tree().is_direct_multi_child_host_component_shape());
        assert_eq!(proof.store_current(), fixture.commit.current());
        assert_eq!(proof.previous_current(), fixture.commit.previous_current());
        assert_eq!(proof.render_lanes(), Lanes::DEFAULT);
        assert_eq!(proof.commit_finished_lanes(), Lanes::DEFAULT);
        assert_eq!(proof.finished_work_after_commit(), None);
        assert_eq!(proof.finished_lanes_after_commit(), Lanes::NO);
        assert_eq!(proof.host_root(), source.host_root_source_row());
        assert_eq!(proof.host_component(), source.component_source_row());
        assert_eq!(proof.first_text(), source.first_text_source_row());
        assert_eq!(proof.second_text(), source.second_text_source_row());
        assert_eq!(proof.host_component().child(), Some(fixture.first_text));
        assert_eq!(proof.first_text().sibling(), Some(fixture.second_text));
        assert_eq!(proof.second_text().sibling(), None);
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
        assert!(!proof.native_execution_compatibility_claimed());
        assert!(!proof.package_compatibility_claimed());
        proof.validate_against_store(&store).unwrap();

        assert!(matches!(
            inspect_test_renderer_committed_fiber_tree(&store, root_id).unwrap_err(),
            TestRendererCommittedFiberInspectionError::UnexpectedChildCount {
                fiber,
                tag: FiberTag::HostComponent,
                expected: 1,
                actual: 2
            } if fiber == fixture.component
        ));
    }

    #[test]
    fn source_bound_reconciler_private_fiber_inspection_rejects_missing_stale_and_caller_built_source_rows()
     {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(290));
        let fixture =
            commit_source_bound_direct_multi_child_host_component_shape(&mut store, render);
        let source = record_reconciler_direct_multi_child_committed_fiber_source(
            &store,
            &fixture.commit,
            fixture.component,
            fixture.first_text,
            fixture.second_text,
        )
        .unwrap();

        let mut missing_source = source;
        missing_source.source_current_topology_recorded = false;
        assert!(matches!(
            inspect_reconciler_direct_multi_child_committed_fiber_tree(&store, missing_source)
                .unwrap_err(),
            ReconcilerDirectMultiChildCommittedFiberInspectionError::MissingCommittedSource {
                field: "source_current_topology_recorded"
            }
        ));

        let mut missing_host_node_presence = source;
        missing_host_node_presence.host_node_store_state_nodes_present = false;
        assert!(matches!(
            inspect_reconciler_direct_multi_child_committed_fiber_tree(
                &store,
                missing_host_node_presence
            )
            .unwrap_err(),
            ReconcilerDirectMultiChildCommittedFiberInspectionError::MissingCommittedSource {
                field: "host_node_store_state_nodes_present"
            }
        ));

        let mut caller_built_rows = source;
        caller_built_rows.component_source_row.child = Some(source.second_text());
        assert!(matches!(
            inspect_reconciler_direct_multi_child_committed_fiber_tree(&store, caller_built_rows)
                .unwrap_err(),
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "source.component_row"
            }
        ));

        let proof =
            inspect_reconciler_direct_multi_child_committed_fiber_tree(&store, source).unwrap();
        let cloned_proof = proof.clone();
        let second_render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(290));
        let _second_fixture =
            commit_source_bound_direct_multi_child_host_component_shape(&mut store, second_render);

        assert!(matches!(
            inspect_reconciler_direct_multi_child_committed_fiber_tree(&store, source).unwrap_err(),
            ReconcilerDirectMultiChildCommittedFiberInspectionError::CurrentRootMismatch {
                expected,
                actual
            } if expected == fixture.commit.current() && actual != fixture.commit.current()
        ));
        assert!(matches!(
            cloned_proof.validate_against_store(&store).unwrap_err(),
            ReconcilerDirectMultiChildCommittedFiberInspectionError::CurrentRootMismatch {
                expected,
                actual
            } if expected == fixture.commit.current() && actual != fixture.commit.current()
        ));
    }

    #[test]
    fn source_bound_reconciler_private_fiber_inspection_rejects_cross_root_source_mismatch() {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(290));
        let fixture =
            commit_source_bound_direct_multi_child_host_component_shape(&mut store, render);
        let mut source = record_reconciler_direct_multi_child_committed_fiber_source(
            &store,
            &fixture.commit,
            fixture.component,
            fixture.first_text,
            fixture.second_text,
        )
        .unwrap();
        let other_root = store.create_client_root((), RootOptions::new()).unwrap();

        source.root = other_root;
        assert!(matches!(
            inspect_reconciler_direct_multi_child_committed_fiber_tree(&store, source).unwrap_err(),
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "source.root_token"
            }
        ));
    }

    #[test]
    fn source_bound_reconciler_private_fiber_inspection_rejects_reversed_or_missing_text_siblings()
    {
        let (mut reversed_store, root_id) = root_store();
        let render = prepare_render(
            &mut reversed_store,
            root_id,
            RootElementHandle::from_raw(290),
        );
        let reversed = commit_source_bound_direct_multi_child_host_component_shape_with_order(
            &mut reversed_store,
            render,
            true,
        );

        assert!(matches!(
            record_reconciler_direct_multi_child_committed_fiber_source(
                &reversed_store,
                &reversed.commit,
                reversed.component,
                reversed.first_text,
                reversed.second_text,
            )
            .unwrap_err(),
            ReconcilerDirectMultiChildCommittedFiberInspectionError::FiberInspection(
                TestRendererCommittedFiberInspectionError::UnsupportedShape {
                    fiber,
                    tag: FiberTag::HostComponent,
                    ..
                }
            ) if fiber == reversed.component
        ));

        let (mut missing_store, root_id) = root_store();
        let render = prepare_render(
            &mut missing_store,
            root_id,
            RootElementHandle::from_raw(290),
        );
        let missing =
            commit_source_bound_direct_multi_child_host_component_shape(&mut missing_store, render);
        let source = record_reconciler_direct_multi_child_committed_fiber_source(
            &missing_store,
            &missing.commit,
            missing.component,
            missing.first_text,
            missing.second_text,
        )
        .unwrap();
        missing_store
            .fiber_arena_mut()
            .set_children(missing.component, &[missing.first_text])
            .unwrap();

        assert!(matches!(
            inspect_reconciler_direct_multi_child_committed_fiber_tree(&missing_store, source)
                .unwrap_err(),
            ReconcilerDirectMultiChildCommittedFiberInspectionError::FiberInspection(
                TestRendererCommittedFiberInspectionError::UnexpectedChildCount {
                    fiber,
                    tag: FiberTag::HostComponent,
                    expected: 2,
                    actual: 1
                }
            ) if fiber == missing.component
        ));
    }

    #[test]
    fn source_bound_reconciler_private_fiber_inspection_rejects_missing_state_node_and_lane_drift()
    {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(290));
        let fixture =
            commit_source_bound_direct_multi_child_host_component_shape(&mut store, render);
        let source = record_reconciler_direct_multi_child_committed_fiber_source(
            &store,
            &fixture.commit,
            fixture.component,
            fixture.first_text,
            fixture.second_text,
        )
        .unwrap();

        let mut lane_drift = source;
        lane_drift.commit_finished_lanes = Lanes::SYNC;
        assert!(matches!(
            inspect_reconciler_direct_multi_child_committed_fiber_tree(&store, lane_drift)
                .unwrap_err(),
            ReconcilerDirectMultiChildCommittedFiberInspectionError::SourceMismatch {
                field: "source.commit_lanes"
            }
        ));

        store
            .fiber_arena_mut()
            .get_mut(fixture.component)
            .unwrap()
            .set_lanes(Lanes::TRANSITION);
        assert!(matches!(
            inspect_reconciler_direct_multi_child_committed_fiber_tree(&store, source).unwrap_err(),
            ReconcilerDirectMultiChildCommittedFiberInspectionError::StaleOrClonedInspectionRows
        ));

        let (mut missing_state_store, root_id) = root_store();
        let render = prepare_render(
            &mut missing_state_store,
            root_id,
            RootElementHandle::from_raw(290),
        );
        let missing_state = commit_source_bound_direct_multi_child_host_component_shape(
            &mut missing_state_store,
            render,
        );
        let source = record_reconciler_direct_multi_child_committed_fiber_source(
            &missing_state_store,
            &missing_state.commit,
            missing_state.component,
            missing_state.first_text,
            missing_state.second_text,
        )
        .unwrap();
        missing_state_store
            .fiber_arena_mut()
            .get_mut(missing_state.second_text)
            .unwrap()
            .set_state_node(StateNodeHandle::NONE);

        assert!(matches!(
            inspect_reconciler_direct_multi_child_committed_fiber_tree(
                &missing_state_store,
                source
            )
            .unwrap_err(),
            ReconcilerDirectMultiChildCommittedFiberInspectionError::FiberInspection(
                TestRendererCommittedFiberInspectionError::MissingStateNode {
                    fiber,
                    tag: FiberTag::HostText
                }
            ) if fiber == missing_state.second_text
        ));
    }

    #[test]
    fn source_bound_reconciler_private_fiber_inspection_rejects_public_native_and_package_claims() {
        let (mut store, root_id) = root_store();
        let render = prepare_render(&mut store, root_id, RootElementHandle::from_raw(290));
        let fixture =
            commit_source_bound_direct_multi_child_host_component_shape(&mut store, render);
        let source = record_reconciler_direct_multi_child_committed_fiber_source(
            &store,
            &fixture.commit,
            fixture.component,
            fixture.first_text,
            fixture.second_text,
        )
        .unwrap();

        let mut public_claim = source;
        public_claim.public_serialization_compatibility_claimed = true;
        assert!(matches!(
            inspect_reconciler_direct_multi_child_committed_fiber_tree(&store, public_claim)
                .unwrap_err(),
            ReconcilerDirectMultiChildCommittedFiberInspectionError::CompatibilityClaim {
                surface: "public serialization"
            }
        ));

        let mut native_claim = source;
        native_claim.native_execution_compatibility_claimed = true;
        assert!(matches!(
            inspect_reconciler_direct_multi_child_committed_fiber_tree(&store, native_claim)
                .unwrap_err(),
            ReconcilerDirectMultiChildCommittedFiberInspectionError::CompatibilityClaim {
                surface: "native execution"
            }
        ));

        let mut package_claim = source;
        package_claim.package_compatibility_claimed = true;
        assert!(matches!(
            inspect_reconciler_direct_multi_child_committed_fiber_tree(&store, package_claim)
                .unwrap_err(),
            ReconcilerDirectMultiChildCommittedFiberInspectionError::CompatibilityClaim {
                surface: "package compatibility"
            }
        ));
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
