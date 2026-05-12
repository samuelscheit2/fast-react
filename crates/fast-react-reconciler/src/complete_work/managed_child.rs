use super::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostComponentManagedChildMutationKindForCanary {
    Placement,
    DeleteDetach,
}

impl HostComponentManagedChildMutationKindForCanary {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::Placement => "managed-child-placement",
            Self::DeleteDetach => "managed-child-delete-detach",
        }
    }

    #[must_use]
    pub(crate) const fn effect_flag(self) -> FiberFlags {
        match self {
            Self::Placement => FiberFlags::PLACEMENT,
            Self::DeleteDetach => FiberFlags::CHILD_DELETION,
        }
    }
}

impl Display for HostComponentManagedChildMutationKindForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

const fn is_supported_managed_child_host_tag_for_canary(tag: FiberTag) -> bool {
    matches!(tag, FiberTag::HostComponent | FiberTag::HostText)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostComponentManagedChildCompleteWorkRecordForCanary {
    root: FiberRootId,
    kind: HostComponentManagedChildMutationKindForCanary,
    parent_current: FiberId,
    parent_work_in_progress: FiberId,
    parent_state_node: StateNodeHandle,
    parent_flags: FiberFlags,
    child: FiberId,
    child_tag: FiberTag,
    child_state_node: StateNodeHandle,
    child_pending_props: PropsHandle,
    child_memoized_props: PropsHandle,
    child_alternate: Option<FiberId>,
    child_flags: FiberFlags,
    deletion_list: Option<DeletionListId>,
}

impl HostComponentManagedChildCompleteWorkRecordForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn kind(self) -> HostComponentManagedChildMutationKindForCanary {
        self.kind
    }

    #[must_use]
    pub(crate) const fn kind_name(self) -> &'static str {
        self.kind.as_str()
    }

    #[must_use]
    pub(crate) const fn parent_current(self) -> FiberId {
        self.parent_current
    }

    #[must_use]
    pub(crate) const fn parent_work_in_progress(self) -> FiberId {
        self.parent_work_in_progress
    }

    #[must_use]
    pub(crate) const fn parent_state_node(self) -> StateNodeHandle {
        self.parent_state_node
    }

    #[must_use]
    pub(crate) const fn parent_flags(self) -> FiberFlags {
        self.parent_flags
    }

    #[must_use]
    pub(crate) const fn child(self) -> FiberId {
        self.child
    }

    #[must_use]
    pub(crate) const fn child_tag(self) -> FiberTag {
        self.child_tag
    }

    #[must_use]
    pub(crate) const fn child_state_node(self) -> StateNodeHandle {
        self.child_state_node
    }

    #[must_use]
    pub(crate) const fn child_pending_props(self) -> PropsHandle {
        self.child_pending_props
    }

    #[must_use]
    pub(crate) const fn child_memoized_props(self) -> PropsHandle {
        self.child_memoized_props
    }

    #[must_use]
    pub(crate) const fn child_alternate(self) -> Option<FiberId> {
        self.child_alternate
    }

    #[must_use]
    pub(crate) const fn child_flags(self) -> FiberFlags {
        self.child_flags
    }

    #[must_use]
    pub(crate) const fn deletion_list(self) -> Option<DeletionListId> {
        self.deletion_list
    }

    #[must_use]
    pub(crate) const fn expected_effect_flag(self) -> FiberFlags {
        self.kind.effect_flag()
    }

    #[must_use]
    pub(crate) const fn private_reconciler_handoff_only(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_dom_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn broad_reconciliation_traversal_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn with_root_for_canary(mut self, root: FiberRootId) -> Self {
        self.root = root;
        self
    }

    #[must_use]
    pub(crate) const fn with_parent_state_node_for_canary(
        mut self,
        parent_state_node: StateNodeHandle,
    ) -> Self {
        self.parent_state_node = parent_state_node;
        self
    }

    #[must_use]
    pub(crate) const fn with_child_state_node_for_canary(
        mut self,
        child_state_node: StateNodeHandle,
    ) -> Self {
        self.child_state_node = child_state_node;
        self
    }

    #[must_use]
    pub(crate) const fn with_child_memoized_props_for_canary(
        mut self,
        child_memoized_props: PropsHandle,
    ) -> Self {
        self.child_memoized_props = child_memoized_props;
        self
    }

    #[must_use]
    pub(crate) const fn with_deletion_list_for_canary(
        mut self,
        deletion_list: Option<DeletionListId>,
    ) -> Self {
        self.deletion_list = deletion_list;
        self
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary {
    root: FiberRootId,
    kind: HostComponentManagedChildMutationKindForCanary,
    parent_current: FiberId,
    parent_work_in_progress: FiberId,
    parent_state_node: StateNodeHandle,
    parent_flags: FiberFlags,
    child: FiberId,
    child_tag: FiberTag,
    child_state_node: StateNodeHandle,
    child_pending_props: PropsHandle,
    child_memoized_props: PropsHandle,
    child_alternate: Option<FiberId>,
    child_flags: FiberFlags,
    order_sibling: FiberId,
    order_sibling_tag: FiberTag,
    order_sibling_state_node: StateNodeHandle,
    order_sibling_pending_props: PropsHandle,
    order_sibling_memoized_props: PropsHandle,
    order_sibling_alternate: Option<FiberId>,
    order_sibling_flags: FiberFlags,
    deletion_list: Option<DeletionListId>,
}

impl HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn kind(self) -> HostComponentManagedChildMutationKindForCanary {
        self.kind
    }

    #[must_use]
    pub(crate) const fn kind_name(self) -> &'static str {
        self.kind.as_str()
    }

    #[must_use]
    pub(crate) const fn parent_current(self) -> FiberId {
        self.parent_current
    }

    #[must_use]
    pub(crate) const fn parent_work_in_progress(self) -> FiberId {
        self.parent_work_in_progress
    }

    #[must_use]
    pub(crate) const fn parent_state_node(self) -> StateNodeHandle {
        self.parent_state_node
    }

    #[must_use]
    pub(crate) const fn parent_flags(self) -> FiberFlags {
        self.parent_flags
    }

    #[must_use]
    pub(crate) const fn child(self) -> FiberId {
        self.child
    }

    #[must_use]
    pub(crate) const fn child_tag(self) -> FiberTag {
        self.child_tag
    }

    #[must_use]
    pub(crate) const fn child_state_node(self) -> StateNodeHandle {
        self.child_state_node
    }

    #[must_use]
    pub(crate) const fn child_pending_props(self) -> PropsHandle {
        self.child_pending_props
    }

    #[must_use]
    pub(crate) const fn child_memoized_props(self) -> PropsHandle {
        self.child_memoized_props
    }

    #[must_use]
    pub(crate) const fn child_alternate(self) -> Option<FiberId> {
        self.child_alternate
    }

    #[must_use]
    pub(crate) const fn child_flags(self) -> FiberFlags {
        self.child_flags
    }

    #[must_use]
    pub(crate) const fn order_sibling(self) -> FiberId {
        self.order_sibling
    }

    #[must_use]
    pub(crate) const fn order_sibling_tag(self) -> FiberTag {
        self.order_sibling_tag
    }

    #[must_use]
    pub(crate) const fn order_sibling_state_node(self) -> StateNodeHandle {
        self.order_sibling_state_node
    }

    #[must_use]
    pub(crate) const fn order_sibling_pending_props(self) -> PropsHandle {
        self.order_sibling_pending_props
    }

    #[must_use]
    pub(crate) const fn order_sibling_memoized_props(self) -> PropsHandle {
        self.order_sibling_memoized_props
    }

    #[must_use]
    pub(crate) const fn order_sibling_alternate(self) -> Option<FiberId> {
        self.order_sibling_alternate
    }

    #[must_use]
    pub(crate) const fn order_sibling_flags(self) -> FiberFlags {
        self.order_sibling_flags
    }

    #[must_use]
    pub(crate) const fn deletion_list(self) -> Option<DeletionListId> {
        self.deletion_list
    }

    #[must_use]
    pub(crate) const fn expected_effect_flag(self) -> FiberFlags {
        self.kind.effect_flag()
    }

    #[must_use]
    pub(crate) const fn order_evidence_name(self) -> &'static str {
        match self.kind {
            HostComponentManagedChildMutationKindForCanary::Placement => "next-sibling",
            HostComponentManagedChildMutationKindForCanary::DeleteDetach => "previous-sibling",
        }
    }

    #[must_use]
    pub(crate) const fn private_reconciler_handoff_only(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_dom_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn broad_reconciliation_traversal_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn with_root_for_canary(mut self, root: FiberRootId) -> Self {
        self.root = root;
        self
    }

    #[must_use]
    pub(crate) const fn with_parent_state_node_for_canary(
        mut self,
        parent_state_node: StateNodeHandle,
    ) -> Self {
        self.parent_state_node = parent_state_node;
        self
    }

    #[must_use]
    pub(crate) const fn with_child_state_node_for_canary(
        mut self,
        child_state_node: StateNodeHandle,
    ) -> Self {
        self.child_state_node = child_state_node;
        self
    }

    #[must_use]
    pub(crate) const fn with_child_memoized_props_for_canary(
        mut self,
        child_memoized_props: PropsHandle,
    ) -> Self {
        self.child_memoized_props = child_memoized_props;
        self
    }

    #[must_use]
    pub(crate) const fn with_order_sibling_for_canary(mut self, order_sibling: FiberId) -> Self {
        self.order_sibling = order_sibling;
        self
    }

    #[must_use]
    pub(crate) const fn with_order_sibling_state_node_for_canary(
        mut self,
        order_sibling_state_node: StateNodeHandle,
    ) -> Self {
        self.order_sibling_state_node = order_sibling_state_node;
        self
    }

    #[must_use]
    pub(crate) const fn with_deletion_list_for_canary(
        mut self,
        deletion_list: Option<DeletionListId>,
    ) -> Self {
        self.deletion_list = deletion_list;
        self
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostComponentManagedChildCompleteWorkErrorForCanary {
    FiberTopology(FiberTopologyError),
    ExpectedParentHostComponent {
        parent: FiberId,
        tag: FiberTag,
    },
    MissingParentCurrent {
        parent_work_in_progress: FiberId,
    },
    ParentCurrentTagMismatch {
        parent_current: FiberId,
        current_tag: FiberTag,
        parent_work_in_progress: FiberId,
        work_in_progress_tag: FiberTag,
    },
    MissingParentStateNode {
        parent: FiberId,
    },
    ParentStateNodeMismatch {
        parent_current: FiberId,
        parent_work_in_progress: FiberId,
        current_state_node: StateNodeHandle,
        work_in_progress_state_node: StateNodeHandle,
    },
    ParentStillBeingPlaced {
        parent_work_in_progress: FiberId,
        flags: FiberFlags,
    },
    ExpectedManagedHostChild {
        child: FiberId,
        tag: FiberTag,
    },
    ChildParentMismatch {
        parent_work_in_progress: FiberId,
        child: FiberId,
        actual_parent: Option<FiberId>,
    },
    MissingParentFinishedChild {
        parent_work_in_progress: FiberId,
        child: FiberId,
    },
    UnexpectedParentFirstChild {
        parent_work_in_progress: FiberId,
        child: FiberId,
        first_child: FiberId,
    },
    UnexpectedChildSibling {
        parent_work_in_progress: FiberId,
        child: FiberId,
        sibling: FiberId,
    },
    MissingChildStateNode {
        child: FiberId,
    },
    MissingPlacementFlag {
        child: FiberId,
        flags: FiberFlags,
    },
    UnexpectedPlacementAlternate {
        child: FiberId,
        alternate: FiberId,
    },
    MissingChildDeletionFlag {
        parent_work_in_progress: FiberId,
        flags: FiberFlags,
    },
    MissingDeletionList {
        parent_work_in_progress: FiberId,
    },
    DeletionListChildCountMismatch {
        parent_work_in_progress: FiberId,
        deletion_list: DeletionListId,
        count: usize,
    },
    DeletionListChildMismatch {
        parent_work_in_progress: FiberId,
        deletion_list: DeletionListId,
        expected_child: FiberId,
        actual_child: FiberId,
    },
    DeletedChildStillInFinishedChildren {
        parent_work_in_progress: FiberId,
        child: FiberId,
    },
    ExpectedManagedHostOrderSibling {
        order_sibling: FiberId,
        tag: FiberTag,
    },
    OrderSiblingParentMismatch {
        parent_work_in_progress: FiberId,
        order_sibling: FiberId,
        actual_parent: Option<FiberId>,
    },
    MissingOrderSiblingStateNode {
        order_sibling: FiberId,
    },
    MissingOrderSiblingCurrent {
        order_sibling: FiberId,
    },
    OrderSiblingCurrentTagMismatch {
        order_sibling: FiberId,
        order_sibling_current: FiberId,
        current_tag: FiberTag,
    },
    OrderSiblingStateNodeMismatch {
        order_sibling: FiberId,
        order_sibling_current: FiberId,
        current_state_node: StateNodeHandle,
        work_in_progress_state_node: StateNodeHandle,
    },
    OrderSiblingStillBeingPlaced {
        order_sibling: FiberId,
        flags: FiberFlags,
    },
    SiblingOrderShapeMismatch {
        parent_work_in_progress: FiberId,
        child: FiberId,
        order_sibling: FiberId,
        kind: HostComponentManagedChildMutationKindForCanary,
        reason: &'static str,
    },
}

impl Display for HostComponentManagedChildCompleteWorkErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::ExpectedParentHostComponent { parent, tag } => write!(
                formatter,
                "fiber {} must be HostComponent for private managed child complete-work metadata, found {:?}",
                parent.slot().get(),
                tag
            ),
            Self::MissingParentCurrent {
                parent_work_in_progress,
            } => write!(
                formatter,
                "HostComponent work-in-progress parent {} has no current alternate for private managed child complete-work metadata",
                parent_work_in_progress.slot().get()
            ),
            Self::ParentCurrentTagMismatch {
                parent_current,
                current_tag,
                parent_work_in_progress,
                work_in_progress_tag,
            } => write!(
                formatter,
                "private managed child metadata expected HostComponent parent alternate pair current {} {:?} and work-in-progress {} {:?}",
                parent_current.slot().get(),
                current_tag,
                parent_work_in_progress.slot().get(),
                work_in_progress_tag
            ),
            Self::MissingParentStateNode { parent } => write!(
                formatter,
                "HostComponent parent fiber {} has no state node for private managed child complete-work metadata",
                parent.slot().get()
            ),
            Self::ParentStateNodeMismatch {
                parent_current,
                parent_work_in_progress,
                current_state_node,
                work_in_progress_state_node,
            } => write!(
                formatter,
                "private managed child metadata expected parent current {} and work-in-progress {} to share state node {}; found {}",
                parent_current.slot().get(),
                parent_work_in_progress.slot().get(),
                current_state_node.raw(),
                work_in_progress_state_node.raw()
            ),
            Self::ParentStillBeingPlaced {
                parent_work_in_progress,
                flags,
            } => write!(
                formatter,
                "private managed child metadata requires stable HostComponent parent {}; found flags {:?}",
                parent_work_in_progress.slot().get(),
                flags
            ),
            Self::ExpectedManagedHostChild { child, tag } => write!(
                formatter,
                "fiber {} must be HostComponent or HostText child for private managed child metadata, found {:?}",
                child.slot().get(),
                tag
            ),
            Self::ChildParentMismatch {
                parent_work_in_progress,
                child,
                actual_parent,
            } => write!(
                formatter,
                "private managed child metadata expected child {} to belong to parent {}, found {:?}",
                child.slot().get(),
                parent_work_in_progress.slot().get(),
                actual_parent.map(|fiber| fiber.slot().get())
            ),
            Self::MissingParentFinishedChild {
                parent_work_in_progress,
                child,
            } => write!(
                formatter,
                "private managed child metadata expected parent {} to list candidate {} as its sole finished child, found no first child",
                parent_work_in_progress.slot().get(),
                child.slot().get()
            ),
            Self::UnexpectedParentFirstChild {
                parent_work_in_progress,
                child,
                first_child,
            } => write!(
                formatter,
                "private managed child metadata admits one child under parent {}; candidate {} is not first finished child {}",
                parent_work_in_progress.slot().get(),
                child.slot().get(),
                first_child.slot().get()
            ),
            Self::UnexpectedChildSibling {
                parent_work_in_progress,
                child,
                sibling,
            } => write!(
                formatter,
                "private managed child metadata admits one child under parent {}; child {} has sibling {}",
                parent_work_in_progress.slot().get(),
                child.slot().get(),
                sibling.slot().get()
            ),
            Self::MissingChildStateNode { child } => write!(
                formatter,
                "managed host child {} has no state node",
                child.slot().get()
            ),
            Self::MissingPlacementFlag { child, flags } => write!(
                formatter,
                "managed HostComponent child {} must carry Placement for private placement metadata, found {:?}",
                child.slot().get(),
                flags
            ),
            Self::UnexpectedPlacementAlternate { child, alternate } => write!(
                formatter,
                "managed HostComponent placement child {} must be newly placed, found alternate {}",
                child.slot().get(),
                alternate.slot().get()
            ),
            Self::MissingChildDeletionFlag {
                parent_work_in_progress,
                flags,
            } => write!(
                formatter,
                "managed HostComponent parent {} must carry ChildDeletion for private delete/detach metadata, found {:?}",
                parent_work_in_progress.slot().get(),
                flags
            ),
            Self::MissingDeletionList {
                parent_work_in_progress,
            } => write!(
                formatter,
                "managed HostComponent parent {} has no deletion list for private delete/detach metadata",
                parent_work_in_progress.slot().get()
            ),
            Self::DeletionListChildCountMismatch {
                parent_work_in_progress,
                deletion_list,
                count,
            } => write!(
                formatter,
                "managed HostComponent parent {} deletion list {} has {count} children; exactly one is admitted",
                parent_work_in_progress.slot().get(),
                deletion_list.index()
            ),
            Self::DeletionListChildMismatch {
                parent_work_in_progress,
                deletion_list,
                expected_child,
                actual_child,
            } => write!(
                formatter,
                "managed HostComponent parent {} deletion list {} expected child {}, found {}",
                parent_work_in_progress.slot().get(),
                deletion_list.index(),
                expected_child.slot().get(),
                actual_child.slot().get()
            ),
            Self::DeletedChildStillInFinishedChildren {
                parent_work_in_progress,
                child,
            } => write!(
                formatter,
                "managed deleted child {} is still in finished children for parent {}",
                child.slot().get(),
                parent_work_in_progress.slot().get()
            ),
            Self::ExpectedManagedHostOrderSibling { order_sibling, tag } => write!(
                formatter,
                "fiber {} must be HostComponent or HostText order sibling for private managed child sibling-order metadata, found {:?}",
                order_sibling.slot().get(),
                tag
            ),
            Self::OrderSiblingParentMismatch {
                parent_work_in_progress,
                order_sibling,
                actual_parent,
            } => write!(
                formatter,
                "private managed child sibling-order metadata expected sibling {} to belong to parent {}, found {:?}",
                order_sibling.slot().get(),
                parent_work_in_progress.slot().get(),
                actual_parent.map(|fiber| fiber.slot().get())
            ),
            Self::MissingOrderSiblingStateNode { order_sibling } => write!(
                formatter,
                "managed host order sibling {} has no state node",
                order_sibling.slot().get()
            ),
            Self::MissingOrderSiblingCurrent { order_sibling } => write!(
                formatter,
                "managed host order sibling {} has no current alternate",
                order_sibling.slot().get()
            ),
            Self::OrderSiblingCurrentTagMismatch {
                order_sibling,
                order_sibling_current,
                current_tag,
            } => write!(
                formatter,
                "managed host order sibling {} expected matching host current {}, found {:?}",
                order_sibling.slot().get(),
                order_sibling_current.slot().get(),
                current_tag
            ),
            Self::OrderSiblingStateNodeMismatch {
                order_sibling,
                order_sibling_current,
                current_state_node,
                work_in_progress_state_node,
            } => write!(
                formatter,
                "managed order sibling {} current {} expected shared state node {}, found {}",
                order_sibling.slot().get(),
                order_sibling_current.slot().get(),
                current_state_node.raw(),
                work_in_progress_state_node.raw()
            ),
            Self::OrderSiblingStillBeingPlaced {
                order_sibling,
                flags,
            } => write!(
                formatter,
                "managed order sibling {} must be stable for private sibling-order metadata, found {:?}",
                order_sibling.slot().get(),
                flags
            ),
            Self::SiblingOrderShapeMismatch {
                parent_work_in_progress,
                child,
                order_sibling,
                kind,
                reason,
            } => write!(
                formatter,
                "managed child {kind} sibling-order metadata for parent {} child {} sibling {} rejected shape: {reason}",
                parent_work_in_progress.slot().get(),
                child.slot().get(),
                order_sibling.slot().get()
            ),
        }
    }
}

impl Error for HostComponentManagedChildCompleteWorkErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::ExpectedParentHostComponent { .. }
            | Self::MissingParentCurrent { .. }
            | Self::ParentCurrentTagMismatch { .. }
            | Self::MissingParentStateNode { .. }
            | Self::ParentStateNodeMismatch { .. }
            | Self::ParentStillBeingPlaced { .. }
            | Self::ExpectedManagedHostChild { .. }
            | Self::ChildParentMismatch { .. }
            | Self::MissingParentFinishedChild { .. }
            | Self::UnexpectedParentFirstChild { .. }
            | Self::UnexpectedChildSibling { .. }
            | Self::MissingChildStateNode { .. }
            | Self::MissingPlacementFlag { .. }
            | Self::UnexpectedPlacementAlternate { .. }
            | Self::MissingChildDeletionFlag { .. }
            | Self::MissingDeletionList { .. }
            | Self::DeletionListChildCountMismatch { .. }
            | Self::DeletionListChildMismatch { .. }
            | Self::DeletedChildStillInFinishedChildren { .. }
            | Self::ExpectedManagedHostOrderSibling { .. }
            | Self::OrderSiblingParentMismatch { .. }
            | Self::MissingOrderSiblingStateNode { .. }
            | Self::MissingOrderSiblingCurrent { .. }
            | Self::OrderSiblingCurrentTagMismatch { .. }
            | Self::OrderSiblingStateNodeMismatch { .. }
            | Self::OrderSiblingStillBeingPlaced { .. }
            | Self::SiblingOrderShapeMismatch { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for HostComponentManagedChildCompleteWorkErrorForCanary {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

pub(crate) fn host_component_managed_child_complete_work_record_for_canary(
    arena: &FiberArena,
    root: FiberRootId,
    parent_work_in_progress: FiberId,
    child: FiberId,
    kind: HostComponentManagedChildMutationKindForCanary,
) -> Result<
    HostComponentManagedChildCompleteWorkRecordForCanary,
    HostComponentManagedChildCompleteWorkErrorForCanary,
> {
    let parent_node = arena.get(parent_work_in_progress)?;
    if parent_node.tag() != FiberTag::HostComponent {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::ExpectedParentHostComponent {
                parent: parent_work_in_progress,
                tag: parent_node.tag(),
            },
        );
    }

    let parent_current = parent_node.alternate().ok_or(
        HostComponentManagedChildCompleteWorkErrorForCanary::MissingParentCurrent {
            parent_work_in_progress,
        },
    )?;
    let parent_current_node = arena.get(parent_current)?;
    if parent_current_node.tag() != FiberTag::HostComponent {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::ParentCurrentTagMismatch {
                parent_current,
                current_tag: parent_current_node.tag(),
                parent_work_in_progress,
                work_in_progress_tag: parent_node.tag(),
            },
        );
    }

    let parent_state_node = parent_node.state_node();
    let parent_current_state_node = parent_current_node.state_node();
    if parent_state_node.is_none() {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::MissingParentStateNode {
                parent: parent_work_in_progress,
            },
        );
    }
    if parent_current_state_node.is_none() {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::MissingParentStateNode {
                parent: parent_current,
            },
        );
    }
    if parent_state_node != parent_current_state_node {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::ParentStateNodeMismatch {
                parent_current,
                parent_work_in_progress,
                current_state_node: parent_current_state_node,
                work_in_progress_state_node: parent_state_node,
            },
        );
    }
    let parent_flags = parent_node.flags();
    if parent_flags.contains_all(FiberFlags::PLACEMENT) {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::ParentStillBeingPlaced {
                parent_work_in_progress,
                flags: parent_flags,
            },
        );
    }

    let child_node = arena.get(child)?;
    if !is_supported_managed_child_host_tag_for_canary(child_node.tag()) {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::ExpectedManagedHostChild {
                child,
                tag: child_node.tag(),
            },
        );
    }
    if child_node.return_fiber() != Some(parent_work_in_progress) {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::ChildParentMismatch {
                parent_work_in_progress,
                child,
                actual_parent: child_node.return_fiber(),
            },
        );
    }
    if let Some(sibling) = child_node.sibling() {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::UnexpectedChildSibling {
                parent_work_in_progress,
                child,
                sibling,
            },
        );
    }
    let child_state_node = child_node.state_node();
    if child_state_node.is_none() {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::MissingChildStateNode { child },
        );
    }

    let deletion_list = match kind {
        HostComponentManagedChildMutationKindForCanary::Placement => {
            if parent_node.child() != Some(child) {
                let Some(first_child) = parent_node.child() else {
                    return Err(
                        HostComponentManagedChildCompleteWorkErrorForCanary::MissingParentFinishedChild {
                            parent_work_in_progress,
                            child,
                        },
                    );
                };
                return Err(
                    HostComponentManagedChildCompleteWorkErrorForCanary::UnexpectedParentFirstChild {
                        parent_work_in_progress,
                        child,
                        first_child,
                    },
                );
            }
            if !child_node.flags().contains_all(FiberFlags::PLACEMENT) {
                return Err(
                    HostComponentManagedChildCompleteWorkErrorForCanary::MissingPlacementFlag {
                        child,
                        flags: child_node.flags(),
                    },
                );
            }
            if let Some(alternate) = child_node.alternate() {
                return Err(
                    HostComponentManagedChildCompleteWorkErrorForCanary::UnexpectedPlacementAlternate {
                        child,
                        alternate,
                    },
                );
            }
            None
        }
        HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
            validate_managed_child_deletion_shape_for_canary(
                arena,
                parent_work_in_progress,
                child,
                parent_flags,
            )?
        }
    };

    Ok(HostComponentManagedChildCompleteWorkRecordForCanary {
        root,
        kind,
        parent_current,
        parent_work_in_progress,
        parent_state_node,
        parent_flags,
        child,
        child_tag: child_node.tag(),
        child_state_node,
        child_pending_props: child_node.pending_props(),
        child_memoized_props: child_node.memoized_props(),
        child_alternate: child_node.alternate(),
        child_flags: child_node.flags(),
        deletion_list,
    })
}

fn validate_managed_child_deletion_shape_for_canary(
    arena: &FiberArena,
    parent_work_in_progress: FiberId,
    child: FiberId,
    parent_flags: FiberFlags,
) -> Result<Option<DeletionListId>, HostComponentManagedChildCompleteWorkErrorForCanary> {
    if !parent_flags.contains_all(FiberFlags::CHILD_DELETION) {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::MissingChildDeletionFlag {
                parent_work_in_progress,
                flags: parent_flags,
            },
        );
    }
    let deletion_list = arena.get(parent_work_in_progress)?.deletions().ok_or(
        HostComponentManagedChildCompleteWorkErrorForCanary::MissingDeletionList {
            parent_work_in_progress,
        },
    )?;
    let list = arena
        .deletion_list(deletion_list)
        .ok_or(FiberTopologyError::InvalidDeletionList { id: deletion_list })?;
    if list.len() != 1 {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::DeletionListChildCountMismatch {
                parent_work_in_progress,
                deletion_list,
                count: list.len(),
            },
        );
    }
    let actual_child = *list
        .iter()
        .next()
        .expect("validated non-empty deletion list has one child");
    if actual_child != child {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::DeletionListChildMismatch {
                parent_work_in_progress,
                deletion_list,
                expected_child: child,
                actual_child,
            },
        );
    }
    if arena.contains_in_child_chain(parent_work_in_progress, child)? {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::DeletedChildStillInFinishedChildren {
                parent_work_in_progress,
                child,
            },
        );
    }
    Ok(Some(deletion_list))
}

pub(crate) fn host_component_managed_child_sibling_order_complete_work_record_for_canary(
    arena: &FiberArena,
    root: FiberRootId,
    parent_work_in_progress: FiberId,
    child: FiberId,
    order_sibling: FiberId,
    kind: HostComponentManagedChildMutationKindForCanary,
) -> Result<
    HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    HostComponentManagedChildCompleteWorkErrorForCanary,
> {
    let parent_node = arena.get(parent_work_in_progress)?;
    if parent_node.tag() != FiberTag::HostComponent {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::ExpectedParentHostComponent {
                parent: parent_work_in_progress,
                tag: parent_node.tag(),
            },
        );
    }

    let parent_current = parent_node.alternate().ok_or(
        HostComponentManagedChildCompleteWorkErrorForCanary::MissingParentCurrent {
            parent_work_in_progress,
        },
    )?;
    let parent_current_node = arena.get(parent_current)?;
    if parent_current_node.tag() != FiberTag::HostComponent {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::ParentCurrentTagMismatch {
                parent_current,
                current_tag: parent_current_node.tag(),
                parent_work_in_progress,
                work_in_progress_tag: parent_node.tag(),
            },
        );
    }

    let parent_state_node = parent_node.state_node();
    let parent_current_state_node = parent_current_node.state_node();
    if parent_state_node.is_none() {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::MissingParentStateNode {
                parent: parent_work_in_progress,
            },
        );
    }
    if parent_current_state_node.is_none() {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::MissingParentStateNode {
                parent: parent_current,
            },
        );
    }
    if parent_state_node != parent_current_state_node {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::ParentStateNodeMismatch {
                parent_current,
                parent_work_in_progress,
                current_state_node: parent_current_state_node,
                work_in_progress_state_node: parent_state_node,
            },
        );
    }
    let parent_flags = parent_node.flags();
    if parent_flags.contains_all(FiberFlags::PLACEMENT) {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::ParentStillBeingPlaced {
                parent_work_in_progress,
                flags: parent_flags,
            },
        );
    }

    let child_node = arena.get(child)?;
    if !is_supported_managed_child_host_tag_for_canary(child_node.tag()) {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::ExpectedManagedHostChild {
                child,
                tag: child_node.tag(),
            },
        );
    }
    if child_node.return_fiber() != Some(parent_work_in_progress) {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::ChildParentMismatch {
                parent_work_in_progress,
                child,
                actual_parent: child_node.return_fiber(),
            },
        );
    }
    let child_state_node = child_node.state_node();
    if child_state_node.is_none() {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::MissingChildStateNode { child },
        );
    }

    let order_sibling_node = arena.get(order_sibling)?;
    if !is_supported_managed_child_host_tag_for_canary(order_sibling_node.tag()) {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::ExpectedManagedHostOrderSibling {
                order_sibling,
                tag: order_sibling_node.tag(),
            },
        );
    }
    if order_sibling_node.return_fiber() != Some(parent_work_in_progress) {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::OrderSiblingParentMismatch {
                parent_work_in_progress,
                order_sibling,
                actual_parent: order_sibling_node.return_fiber(),
            },
        );
    }
    let order_sibling_state_node = order_sibling_node.state_node();
    if order_sibling_state_node.is_none() {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::MissingOrderSiblingStateNode {
                order_sibling,
            },
        );
    }
    if order_sibling_node
        .flags()
        .contains_all(FiberFlags::PLACEMENT)
    {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::OrderSiblingStillBeingPlaced {
                order_sibling,
                flags: order_sibling_node.flags(),
            },
        );
    }
    let order_sibling_current = order_sibling_node.alternate().ok_or(
        HostComponentManagedChildCompleteWorkErrorForCanary::MissingOrderSiblingCurrent {
            order_sibling,
        },
    )?;
    let order_sibling_current_node = arena.get(order_sibling_current)?;
    if order_sibling_current_node.tag() != order_sibling_node.tag() {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::OrderSiblingCurrentTagMismatch {
                order_sibling,
                order_sibling_current,
                current_tag: order_sibling_current_node.tag(),
            },
        );
    }
    if order_sibling_current_node.state_node() != order_sibling_state_node {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::OrderSiblingStateNodeMismatch {
                order_sibling,
                order_sibling_current,
                current_state_node: order_sibling_current_node.state_node(),
                work_in_progress_state_node: order_sibling_state_node,
            },
        );
    }

    let deletion_list = match kind {
        HostComponentManagedChildMutationKindForCanary::Placement => {
            validate_managed_child_placement_sibling_order_shape_for_canary(
                arena,
                parent_current,
                parent_work_in_progress,
                child,
                child_node,
                order_sibling,
                order_sibling_current,
            )?;
            None
        }
        HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
            validate_managed_child_deletion_sibling_order_shape_for_canary(
                arena,
                parent_current,
                parent_work_in_progress,
                child,
                child_node,
                order_sibling,
                order_sibling_current,
                parent_flags,
            )?
        }
    };

    Ok(
        HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary {
            root,
            kind,
            parent_current,
            parent_work_in_progress,
            parent_state_node,
            parent_flags,
            child,
            child_tag: child_node.tag(),
            child_state_node,
            child_pending_props: child_node.pending_props(),
            child_memoized_props: child_node.memoized_props(),
            child_alternate: child_node.alternate(),
            child_flags: child_node.flags(),
            order_sibling,
            order_sibling_tag: order_sibling_node.tag(),
            order_sibling_state_node,
            order_sibling_pending_props: order_sibling_node.pending_props(),
            order_sibling_memoized_props: order_sibling_node.memoized_props(),
            order_sibling_alternate: Some(order_sibling_current),
            order_sibling_flags: order_sibling_node.flags(),
            deletion_list,
        },
    )
}

fn validate_managed_child_placement_sibling_order_shape_for_canary(
    arena: &FiberArena,
    parent_current: FiberId,
    parent_work_in_progress: FiberId,
    child: FiberId,
    child_node: &fast_react_core::FiberNode,
    order_sibling: FiberId,
    order_sibling_current: FiberId,
) -> Result<(), HostComponentManagedChildCompleteWorkErrorForCanary> {
    if arena.get(parent_work_in_progress)?.child() != Some(child) {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::SiblingOrderShapeMismatch {
                parent_work_in_progress,
                child,
                order_sibling,
                kind: HostComponentManagedChildMutationKindForCanary::Placement,
                reason: "placed child must be first finished child",
            },
        );
    }
    if child_node.sibling() != Some(order_sibling) {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::SiblingOrderShapeMismatch {
                parent_work_in_progress,
                child,
                order_sibling,
                kind: HostComponentManagedChildMutationKindForCanary::Placement,
                reason: "placed child must point at explicit next sibling",
            },
        );
    }
    if arena.get(order_sibling)?.sibling().is_some() {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::SiblingOrderShapeMismatch {
                parent_work_in_progress,
                child,
                order_sibling,
                kind: HostComponentManagedChildMutationKindForCanary::Placement,
                reason: "sibling-order placement admits exactly two finished children",
            },
        );
    }
    if !child_node.flags().contains_all(FiberFlags::PLACEMENT) {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::MissingPlacementFlag {
                child,
                flags: child_node.flags(),
            },
        );
    }
    if let Some(alternate) = child_node.alternate() {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::UnexpectedPlacementAlternate {
                child,
                alternate,
            },
        );
    }
    if arena.get(parent_current)?.child() != Some(order_sibling_current)
        || arena.get(order_sibling_current)?.sibling().is_some()
    {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::SiblingOrderShapeMismatch {
                parent_work_in_progress,
                child,
                order_sibling,
                kind: HostComponentManagedChildMutationKindForCanary::Placement,
                reason: "stable next sibling must be the only current child",
            },
        );
    }

    Ok(())
}

fn validate_managed_child_deletion_sibling_order_shape_for_canary(
    arena: &FiberArena,
    parent_current: FiberId,
    parent_work_in_progress: FiberId,
    child: FiberId,
    child_node: &fast_react_core::FiberNode,
    order_sibling: FiberId,
    order_sibling_current: FiberId,
    parent_flags: FiberFlags,
) -> Result<Option<DeletionListId>, HostComponentManagedChildCompleteWorkErrorForCanary> {
    if arena.get(parent_work_in_progress)?.child() != Some(order_sibling)
        || arena.get(order_sibling)?.sibling().is_some()
    {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::SiblingOrderShapeMismatch {
                parent_work_in_progress,
                child,
                order_sibling,
                kind: HostComponentManagedChildMutationKindForCanary::DeleteDetach,
                reason: "deletion sibling-order admits exactly one remaining finished child",
            },
        );
    }
    if arena.get(parent_current)?.child() != Some(order_sibling_current)
        || arena.get(order_sibling_current)?.sibling() != Some(child)
    {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::SiblingOrderShapeMismatch {
                parent_work_in_progress,
                child,
                order_sibling,
                kind: HostComponentManagedChildMutationKindForCanary::DeleteDetach,
                reason: "deleted child must follow the explicit previous sibling in current children",
            },
        );
    }
    if child_node.sibling().is_some() || arena.get(child)?.alternate().is_some() {
        return Err(
            HostComponentManagedChildCompleteWorkErrorForCanary::SiblingOrderShapeMismatch {
                parent_work_in_progress,
                child,
                order_sibling,
                kind: HostComponentManagedChildMutationKindForCanary::DeleteDetach,
                reason: "deleted child must be the final managed child",
            },
        );
    }

    validate_managed_child_deletion_shape_for_canary(
        arena,
        parent_work_in_progress,
        child,
        parent_flags,
    )
}
