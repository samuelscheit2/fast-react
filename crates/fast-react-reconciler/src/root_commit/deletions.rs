use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    DeletionListId, FiberArena, FiberFlags, FiberId, FiberTag, FiberTopologyError,
    HookEffectCallbackHandle, StateNodeHandle,
};
use fast_react_host_config::{HostFiberTokenPhase, HostFiberTokenTarget, HostTypes};

use crate::root_config::PendingPassiveEffectOrder;
use crate::unsupported_features::unsupported_reconciler_feature_for_fiber_tag;
use crate::{FiberRootId, FiberRootStore, HostFiberTokenId};

use super::{
    HostRootCommitRecord, HostRootRefCommitAction, HostRootRefDetachReason, RootCommitError,
    host_root_fiber_tag_name,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootDeletionListRecord {
    parent: FiberId,
    list: DeletionListId,
    deleted: Vec<FiberId>,
}

#[allow(
    dead_code,
    reason = "crate-private deletion metadata for future mutation/passive deletion workers"
)]
impl HostRootDeletionListRecord {
    #[must_use]
    pub(crate) const fn parent(&self) -> FiberId {
        self.parent
    }

    #[must_use]
    pub(crate) const fn list(&self) -> DeletionListId {
        self.list
    }

    #[must_use]
    pub(crate) fn deleted(&self) -> &[FiberId] {
        &self.deleted
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HostRootDeletionCleanupLog {
    root: FiberRootId,
    finished_work: FiberId,
    records: Vec<HostRootDeletionCleanupRecord>,
}

impl HostRootDeletionCleanupLog {
    #[must_use]
    const fn new(root: FiberRootId, finished_work: FiberId) -> Self {
        Self {
            root,
            finished_work,
            records: Vec::new(),
        }
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub fn records(&self) -> &[HostRootDeletionCleanupRecord] {
        &self.records
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub const fn ref_detach_executed(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn passive_effects_flushed(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn public_unmount_compatibility_claimed(&self) -> bool {
        false
    }

    fn push(&mut self, record: HostRootDeletionCleanupRecord) {
        self.records.push(record);
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostRootDeletionCleanupRecord {
    sequence: usize,
    root: FiberRootId,
    host_root: FiberId,
    deletion_list: DeletionListId,
    deletion_list_index: usize,
    deleted_index: usize,
    subtree_index: usize,
    parent: FiberId,
    parent_tag: FiberTag,
    host_parent: Option<FiberId>,
    host_parent_tag: Option<FiberTag>,
    host_parent_state_node: StateNodeHandle,
    host_parent_traversal_depth: Option<usize>,
    deleted_root: FiberId,
    fiber: FiberId,
    tag: FiberTag,
    state_node: StateNodeHandle,
    token: HostFiberTokenId,
    token_phase: HostFiberTokenPhase,
    token_target: HostFiberTokenTarget,
}

impl HostRootDeletionCleanupRecord {
    #[must_use]
    pub const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn host_root(self) -> FiberId {
        self.host_root
    }

    #[must_use]
    pub const fn deletion_list(self) -> DeletionListId {
        self.deletion_list
    }

    #[must_use]
    pub const fn deletion_list_index(self) -> usize {
        self.deletion_list_index
    }

    #[must_use]
    pub const fn deleted_index(self) -> usize {
        self.deleted_index
    }

    #[must_use]
    pub const fn subtree_index(self) -> usize {
        self.subtree_index
    }

    #[must_use]
    pub const fn parent(self) -> FiberId {
        self.parent
    }

    #[must_use]
    pub const fn parent_tag(self) -> FiberTag {
        self.parent_tag
    }

    #[must_use]
    pub const fn host_parent(self) -> Option<FiberId> {
        self.host_parent
    }

    #[must_use]
    pub const fn host_parent_tag(self) -> Option<FiberTag> {
        self.host_parent_tag
    }

    #[must_use]
    pub const fn host_parent_state_node(self) -> StateNodeHandle {
        self.host_parent_state_node
    }

    #[must_use]
    pub const fn host_parent_traversal_depth(self) -> Option<usize> {
        self.host_parent_traversal_depth
    }

    #[must_use]
    pub const fn deleted_root(self) -> FiberId {
        self.deleted_root
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub const fn state_node(self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub const fn token(self) -> HostFiberTokenId {
        self.token
    }

    #[must_use]
    pub const fn token_phase(self) -> HostFiberTokenPhase {
        self.token_phase
    }

    #[must_use]
    pub const fn token_target(self) -> HostFiberTokenTarget {
        self.token_target
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootDeletionSubtreeTraversalGateSnapshot {
    records: Vec<HostRootDeletionSubtreeTraversalGateRecord>,
    fragment_deleted_subtree_count: usize,
    portal_deleted_subtree_count: usize,
    host_node_cleanup_metadata_count: usize,
    unsupported_suspense_traversal_count: usize,
    unsupported_offscreen_traversal_count: usize,
    broad_traversal_blocked_count: usize,
}

#[allow(
    dead_code,
    reason = "crate-private Fragment/Portal deletion traversal diagnostics are reserved for future deletion workers"
)]
impl HostRootDeletionSubtreeTraversalGateSnapshot {
    #[must_use]
    fn from_records(records: Vec<HostRootDeletionSubtreeTraversalGateRecord>) -> Self {
        let mut fragment_deleted_subtree_count = 0;
        let mut portal_deleted_subtree_count = 0;
        let mut host_node_cleanup_metadata_count = 0;
        let mut unsupported_suspense_traversal_count = 0;
        let mut unsupported_offscreen_traversal_count = 0;
        let mut broad_traversal_blocked_count = 0;

        for record in &records {
            match record.status() {
                HostRootDeletionSubtreeTraversalGateStatus::FragmentDeletedSubtreeDiagnostic => {
                    fragment_deleted_subtree_count += 1;
                }
                HostRootDeletionSubtreeTraversalGateStatus::PortalDeletedSubtreeDiagnostic => {
                    portal_deleted_subtree_count += 1;
                }
                HostRootDeletionSubtreeTraversalGateStatus::HostNodeCleanupMetadata => {
                    host_node_cleanup_metadata_count += 1;
                }
                HostRootDeletionSubtreeTraversalGateStatus::UnsupportedSuspenseTraversalBlocked => {
                    unsupported_suspense_traversal_count += 1;
                }
                HostRootDeletionSubtreeTraversalGateStatus::UnsupportedOffscreenTraversalBlocked => {
                    unsupported_offscreen_traversal_count += 1;
                }
                HostRootDeletionSubtreeTraversalGateStatus::BroadDeletionTraversalBlocked => {
                    broad_traversal_blocked_count += 1;
                }
            }
        }

        Self {
            records,
            fragment_deleted_subtree_count,
            portal_deleted_subtree_count,
            host_node_cleanup_metadata_count,
            unsupported_suspense_traversal_count,
            unsupported_offscreen_traversal_count,
            broad_traversal_blocked_count,
        }
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[HostRootDeletionSubtreeTraversalGateRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub(crate) fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub(crate) const fn fragment_deleted_subtree_count(&self) -> usize {
        self.fragment_deleted_subtree_count
    }

    #[must_use]
    pub(crate) const fn portal_deleted_subtree_count(&self) -> usize {
        self.portal_deleted_subtree_count
    }

    #[must_use]
    pub(crate) const fn host_node_cleanup_metadata_count(&self) -> usize {
        self.host_node_cleanup_metadata_count
    }

    #[must_use]
    pub(crate) const fn unsupported_suspense_traversal_count(&self) -> usize {
        self.unsupported_suspense_traversal_count
    }

    #[must_use]
    pub(crate) const fn unsupported_offscreen_traversal_count(&self) -> usize {
        self.unsupported_offscreen_traversal_count
    }

    #[must_use]
    pub(crate) const fn broad_traversal_blocked_count(&self) -> usize {
        self.broad_traversal_blocked_count
    }

    #[must_use]
    pub(crate) const fn unsupported_traversal_count(&self) -> usize {
        self.unsupported_suspense_traversal_count
            + self.unsupported_offscreen_traversal_count
            + self.broad_traversal_blocked_count
    }

    #[must_use]
    pub(crate) const fn real_fragment_dom_mutation_executed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn real_portal_dom_mutation_executed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn broad_deletion_traversal_enabled(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_unmount_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootDeletionSubtreeTraversalGateRecord {
    sequence: usize,
    root: FiberRootId,
    host_root: FiberId,
    deletion_list: DeletionListId,
    deletion_list_index: usize,
    deleted_index: usize,
    parent: FiberId,
    parent_tag: FiberTag,
    host_parent: Option<FiberId>,
    host_parent_tag: Option<FiberTag>,
    host_parent_state_node: StateNodeHandle,
    host_parent_traversal_depth: Option<usize>,
    deleted_root: FiberId,
    deleted_root_tag: FiberTag,
    fiber: FiberId,
    tag: FiberTag,
    traversal_depth: usize,
    state_node: StateNodeHandle,
    portal_container_state_node: StateNodeHandle,
    unsupported_feature: Option<&'static str>,
    status: HostRootDeletionSubtreeTraversalGateStatus,
}

#[allow(
    dead_code,
    reason = "crate-private Fragment/Portal deletion traversal diagnostics are reserved for future deletion workers"
)]
impl HostRootDeletionSubtreeTraversalGateRecord {
    #[must_use]
    pub(crate) const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn host_root(self) -> FiberId {
        self.host_root
    }

    #[must_use]
    pub(crate) const fn deletion_list(self) -> DeletionListId {
        self.deletion_list
    }

    #[must_use]
    pub(crate) const fn deletion_list_index(self) -> usize {
        self.deletion_list_index
    }

    #[must_use]
    pub(crate) const fn deleted_index(self) -> usize {
        self.deleted_index
    }

    #[must_use]
    pub(crate) const fn parent(self) -> FiberId {
        self.parent
    }

    #[must_use]
    pub(crate) const fn parent_tag(self) -> FiberTag {
        self.parent_tag
    }

    #[must_use]
    pub(crate) const fn parent_tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.parent_tag)
    }

    #[must_use]
    pub(crate) const fn host_parent(self) -> Option<FiberId> {
        self.host_parent
    }

    #[must_use]
    pub(crate) const fn host_parent_tag(self) -> Option<FiberTag> {
        self.host_parent_tag
    }

    #[must_use]
    pub(crate) const fn host_parent_state_node(self) -> StateNodeHandle {
        self.host_parent_state_node
    }

    #[must_use]
    pub(crate) const fn host_parent_traversal_depth(self) -> Option<usize> {
        self.host_parent_traversal_depth
    }

    #[must_use]
    pub(crate) const fn deleted_root(self) -> FiberId {
        self.deleted_root
    }

    #[must_use]
    pub(crate) const fn deleted_root_tag(self) -> FiberTag {
        self.deleted_root_tag
    }

    #[must_use]
    pub(crate) const fn deleted_root_tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.deleted_root_tag)
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub(crate) const fn tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.tag)
    }

    #[must_use]
    pub(crate) const fn traversal_depth(self) -> usize {
        self.traversal_depth
    }

    #[must_use]
    pub(crate) const fn state_node(self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn portal_container_state_node(self) -> StateNodeHandle {
        self.portal_container_state_node
    }

    #[must_use]
    pub(crate) const fn unsupported_feature(self) -> Option<&'static str> {
        self.unsupported_feature
    }

    #[must_use]
    pub(crate) const fn status(self) -> HostRootDeletionSubtreeTraversalGateStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn status_name(self) -> &'static str {
        host_root_deletion_subtree_traversal_gate_status_name(self.status)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostRootDeletionSubtreeTraversalGateStatus {
    FragmentDeletedSubtreeDiagnostic,
    PortalDeletedSubtreeDiagnostic,
    HostNodeCleanupMetadata,
    UnsupportedSuspenseTraversalBlocked,
    UnsupportedOffscreenTraversalBlocked,
    BroadDeletionTraversalBlocked,
}

const fn host_root_deletion_subtree_traversal_gate_status_name(
    status: HostRootDeletionSubtreeTraversalGateStatus,
) -> &'static str {
    match status {
        HostRootDeletionSubtreeTraversalGateStatus::FragmentDeletedSubtreeDiagnostic => {
            "fragment-deleted-subtree-diagnostic"
        }
        HostRootDeletionSubtreeTraversalGateStatus::PortalDeletedSubtreeDiagnostic => {
            "portal-deleted-subtree-diagnostic"
        }
        HostRootDeletionSubtreeTraversalGateStatus::HostNodeCleanupMetadata => {
            "host-node-cleanup-metadata"
        }
        HostRootDeletionSubtreeTraversalGateStatus::UnsupportedSuspenseTraversalBlocked => {
            "unsupported-suspense-deletion-traversal"
        }
        HostRootDeletionSubtreeTraversalGateStatus::UnsupportedOffscreenTraversalBlocked => {
            "unsupported-offscreen-deletion-traversal"
        }
        HostRootDeletionSubtreeTraversalGateStatus::BroadDeletionTraversalBlocked => {
            "broad-deletion-traversal-blocked"
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HostRootDeletionCleanupOrderGateSnapshot {
    records: Vec<HostRootDeletionCleanupOrderGateRecord>,
    ref_cleanup_return_count: usize,
    passive_destroy_count: usize,
    host_node_cleanup_count: usize,
}

impl HostRootDeletionCleanupOrderGateSnapshot {
    #[must_use]
    pub fn records(&self) -> &[HostRootDeletionCleanupOrderGateRecord] {
        &self.records
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub const fn ref_cleanup_return_count(&self) -> usize {
        self.ref_cleanup_return_count
    }

    #[must_use]
    pub const fn passive_destroy_count(&self) -> usize {
        self.passive_destroy_count
    }

    #[must_use]
    pub const fn host_node_cleanup_count(&self) -> usize {
        self.host_node_cleanup_count
    }

    #[must_use]
    pub const fn ref_cleanup_return_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn passive_destroy_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn public_effects_flushed(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn public_ref_or_effect_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostRootDeletionCleanupOrderGateRecord {
    sequence: usize,
    phase: HostRootDeletionCleanupOrderPhase,
    root: FiberRootId,
    finished_work: FiberId,
    deletion_list: Option<DeletionListId>,
    deletion_list_index: Option<usize>,
    deleted_index: Option<usize>,
    subtree_index: Option<usize>,
    deleted_root: FiberId,
    fiber: FiberId,
    tag: FiberTag,
    ref_cleanup_return_sequence: Option<usize>,
    passive_unmount_order: Option<PendingPassiveEffectOrder>,
    passive_destroy: Option<HookEffectCallbackHandle>,
    host_cleanup_sequence: Option<usize>,
}

impl HostRootDeletionCleanupOrderGateRecord {
    #[must_use]
    pub const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub const fn phase(self) -> HostRootDeletionCleanupOrderPhase {
        self.phase
    }

    #[must_use]
    pub const fn phase_name(self) -> &'static str {
        host_root_deletion_cleanup_order_phase_name(self.phase)
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub const fn deletion_list(self) -> Option<DeletionListId> {
        self.deletion_list
    }

    #[must_use]
    pub const fn deletion_list_index(self) -> Option<usize> {
        self.deletion_list_index
    }

    #[must_use]
    pub const fn deleted_index(self) -> Option<usize> {
        self.deleted_index
    }

    #[must_use]
    pub const fn subtree_index(self) -> Option<usize> {
        self.subtree_index
    }

    #[must_use]
    pub const fn deleted_root(self) -> FiberId {
        self.deleted_root
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub const fn ref_cleanup_return_sequence(self) -> Option<usize> {
        self.ref_cleanup_return_sequence
    }

    #[must_use]
    pub const fn passive_unmount_order(self) -> Option<PendingPassiveEffectOrder> {
        self.passive_unmount_order
    }

    #[must_use]
    pub const fn passive_destroy(self) -> Option<HookEffectCallbackHandle> {
        self.passive_destroy
    }

    #[must_use]
    pub const fn host_cleanup_sequence(self) -> Option<usize> {
        self.host_cleanup_sequence
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum HostRootDeletionCleanupOrderPhase {
    RefCleanupReturn,
    PassiveDestroy,
    HostNodeCleanup,
}

const fn host_root_deletion_cleanup_order_phase_name(
    phase: HostRootDeletionCleanupOrderPhase,
) -> &'static str {
    match phase {
        HostRootDeletionCleanupOrderPhase::RefCleanupReturn => "ref-cleanup-return",
        HostRootDeletionCleanupOrderPhase::PassiveDestroy => "passive-destroy",
        HostRootDeletionCleanupOrderPhase::HostNodeCleanup => "host-node-cleanup",
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary {
    MultipleDeletionListsBlocked {
        root: FiberRootId,
        finished_work: FiberId,
        count: usize,
    },
    MultipleDeletedRootsBlocked {
        root: FiberRootId,
        deletion_list: DeletionListId,
        count: usize,
    },
    MissingDeletedRootTraversalRecord {
        root: FiberRootId,
        deletion_list: DeletionListId,
        deleted_root: FiberId,
    },
    PortalDeletedRootBlocked {
        root: FiberRootId,
        deleted_root: FiberId,
    },
    PortalDeletedSubtreeBlocked {
        root: FiberRootId,
        deleted_root: FiberId,
        portal: FiberId,
    },
    SuspenseDeletedRootBlocked {
        root: FiberRootId,
        deleted_root: FiberId,
        tag: FiberTag,
    },
    SuspenseDeletedSubtreeBlocked {
        root: FiberRootId,
        deleted_root: FiberId,
        fiber: FiberId,
        tag: FiberTag,
    },
    BroadDeletedRootBlocked {
        root: FiberRootId,
        deleted_root: FiberId,
        tag: FiberTag,
    },
    BroadDeletedSubtreeBlocked {
        root: FiberRootId,
        deleted_root: FiberId,
        fiber: FiberId,
        tag: FiberTag,
    },
    MissingHostCleanupRecord {
        root: FiberRootId,
        deleted_root: FiberId,
    },
    MultipleHostChildrenBlocked {
        root: FiberRootId,
        deleted_root: FiberId,
        count: usize,
    },
    MissingHostCleanupOrderRecord {
        root: FiberRootId,
        cleanup_sequence: usize,
    },
    HostCleanupOrderRecordMismatch {
        root: FiberRootId,
        cleanup_sequence: usize,
        order_fiber: FiberId,
        cleanup_fiber: FiberId,
    },
    MissingHostParent {
        root: FiberRootId,
        deleted_root: FiberId,
        host_child: FiberId,
    },
    UnsupportedHostParent {
        root: FiberRootId,
        deleted_root: FiberId,
        host_child: FiberId,
        host_parent: FiberId,
        host_parent_tag: FiberTag,
    },
    MissingHostParentStateNode {
        root: FiberRootId,
        deleted_root: FiberId,
        host_child: FiberId,
        host_parent: FiberId,
    },
}

impl Display for HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::MultipleDeletionListsBlocked {
                root,
                finished_work,
                count,
            } => write!(
                formatter,
                "root {} finished work fiber {} has {count} deletion lists; private host child detachment canary admits exactly one",
                root.raw(),
                finished_work.slot().get()
            ),
            Self::MultipleDeletedRootsBlocked {
                root,
                deletion_list,
                count,
            } => write!(
                formatter,
                "root {} deletion list {} has {count} deleted roots; private host child detachment canary admits exactly one",
                root.raw(),
                deletion_list.index()
            ),
            Self::MissingDeletedRootTraversalRecord {
                root,
                deletion_list,
                deleted_root,
            } => write!(
                formatter,
                "root {} deletion list {} deleted root fiber {} has no traversal gate record",
                root.raw(),
                deletion_list.index(),
                deleted_root.slot().get()
            ),
            Self::PortalDeletedRootBlocked { root, deleted_root } => write!(
                formatter,
                "root {} deleted root fiber {} is a Portal; private host child detachment canary keeps portal teardown blocked",
                root.raw(),
                deleted_root.slot().get()
            ),
            Self::PortalDeletedSubtreeBlocked {
                root,
                deleted_root,
                portal,
            } => write!(
                formatter,
                "root {} deleted root fiber {} contains Portal fiber {}; private host child detachment canary keeps portal teardown blocked",
                root.raw(),
                deleted_root.slot().get(),
                portal.slot().get()
            ),
            Self::SuspenseDeletedRootBlocked {
                root,
                deleted_root,
                tag,
            } => write!(
                formatter,
                "root {} deleted root fiber {} is {:?}; private host child detachment canary keeps Suspense/Offscreen teardown blocked",
                root.raw(),
                deleted_root.slot().get(),
                tag
            ),
            Self::SuspenseDeletedSubtreeBlocked {
                root,
                deleted_root,
                fiber,
                tag,
            } => write!(
                formatter,
                "root {} deleted root fiber {} contains {:?} fiber {}; private host child detachment canary keeps Suspense/Offscreen teardown blocked",
                root.raw(),
                deleted_root.slot().get(),
                tag,
                fiber.slot().get()
            ),
            Self::BroadDeletedRootBlocked {
                root,
                deleted_root,
                tag,
            } => write!(
                formatter,
                "root {} deleted root fiber {} is {:?}; private host child detachment canary keeps broad host teardown blocked",
                root.raw(),
                deleted_root.slot().get(),
                tag
            ),
            Self::BroadDeletedSubtreeBlocked {
                root,
                deleted_root,
                fiber,
                tag,
            } => write!(
                formatter,
                "root {} deleted root fiber {} contains {:?} fiber {}; private host child detachment canary keeps broad host teardown blocked",
                root.raw(),
                deleted_root.slot().get(),
                tag,
                fiber.slot().get()
            ),
            Self::MissingHostCleanupRecord { root, deleted_root } => write!(
                formatter,
                "root {} deleted root fiber {} has no host cleanup record to detach",
                root.raw(),
                deleted_root.slot().get()
            ),
            Self::MultipleHostChildrenBlocked {
                root,
                deleted_root,
                count,
            } => write!(
                formatter,
                "root {} deleted root fiber {} exposes {count} direct host children; private host child detachment canary admits one",
                root.raw(),
                deleted_root.slot().get()
            ),
            Self::MissingHostCleanupOrderRecord {
                root,
                cleanup_sequence,
            } => write!(
                formatter,
                "root {} host cleanup sequence {cleanup_sequence} has no cleanup-order gate record",
                root.raw()
            ),
            Self::HostCleanupOrderRecordMismatch {
                root,
                cleanup_sequence,
                order_fiber,
                cleanup_fiber,
            } => write!(
                formatter,
                "root {} host cleanup sequence {cleanup_sequence} cleanup-order gate fiber {} does not match cleanup fiber {}",
                root.raw(),
                order_fiber.slot().get(),
                cleanup_fiber.slot().get()
            ),
            Self::MissingHostParent {
                root,
                deleted_root,
                host_child,
            } => write!(
                formatter,
                "root {} deleted root fiber {} host child fiber {} has no host parent",
                root.raw(),
                deleted_root.slot().get(),
                host_child.slot().get()
            ),
            Self::UnsupportedHostParent {
                root,
                deleted_root,
                host_child,
                host_parent,
                host_parent_tag,
            } => write!(
                formatter,
                "root {} deleted root fiber {} host child fiber {} parent fiber {} is {:?}; private host child detachment canary only admits HostComponent parents",
                root.raw(),
                deleted_root.slot().get(),
                host_child.slot().get(),
                host_parent.slot().get(),
                host_parent_tag
            ),
            Self::MissingHostParentStateNode {
                root,
                deleted_root,
                host_child,
                host_parent,
            } => write!(
                formatter,
                "root {} deleted root fiber {} host child fiber {} parent fiber {} has no host state node",
                root.raw(),
                deleted_root.slot().get(),
                host_child.slot().get(),
                host_parent.slot().get()
            ),
        }
    }
}

impl Error for HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary {}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootDeletionSubtreeHostDetachmentPlanForCanary {
    root: FiberRootId,
    finished_work: FiberId,
    deletion_list: DeletionListId,
    deletion_list_index: usize,
    deleted_index: usize,
    deleted_root: FiberId,
    deleted_root_tag: FiberTag,
    parent: FiberId,
    parent_tag: FiberTag,
    host_parent: FiberId,
    host_parent_state_node: StateNodeHandle,
    host_parent_traversal_depth: usize,
    host_child: FiberId,
    host_child_tag: FiberTag,
    host_child_state_node: StateNodeHandle,
    host_child_traversal_depth: usize,
    cleanup_sequence: usize,
    cleanup_order_sequence: usize,
}

#[allow(
    dead_code,
    reason = "crate-private deterministic deletion detachment canary exposes full source coordinates"
)]
impl HostRootDeletionSubtreeHostDetachmentPlanForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn deletion_list(self) -> DeletionListId {
        self.deletion_list
    }

    #[must_use]
    pub(crate) const fn deletion_list_index(self) -> usize {
        self.deletion_list_index
    }

    #[must_use]
    pub(crate) const fn deleted_index(self) -> usize {
        self.deleted_index
    }

    #[must_use]
    pub(crate) const fn deleted_root(self) -> FiberId {
        self.deleted_root
    }

    #[must_use]
    pub(crate) const fn deleted_root_tag(self) -> FiberTag {
        self.deleted_root_tag
    }

    #[must_use]
    pub(crate) const fn parent(self) -> FiberId {
        self.parent
    }

    #[must_use]
    pub(crate) const fn parent_tag(self) -> FiberTag {
        self.parent_tag
    }

    #[must_use]
    pub(crate) const fn host_parent(self) -> FiberId {
        self.host_parent
    }

    #[must_use]
    pub(crate) const fn host_parent_state_node(self) -> StateNodeHandle {
        self.host_parent_state_node
    }

    #[must_use]
    pub(crate) const fn host_parent_traversal_depth(self) -> usize {
        self.host_parent_traversal_depth
    }

    #[must_use]
    pub(crate) const fn host_child(self) -> FiberId {
        self.host_child
    }

    #[must_use]
    pub(crate) const fn host_child_tag(self) -> FiberTag {
        self.host_child_tag
    }

    #[must_use]
    pub(crate) const fn host_child_state_node(self) -> StateNodeHandle {
        self.host_child_state_node
    }

    #[must_use]
    pub(crate) const fn host_child_traversal_depth(self) -> usize {
        self.host_child_traversal_depth
    }

    #[must_use]
    pub(crate) const fn cleanup_sequence(self) -> usize {
        self.cleanup_sequence
    }

    #[must_use]
    pub(crate) const fn cleanup_order_sequence(self) -> usize {
        self.cleanup_order_sequence
    }

    #[must_use]
    pub(crate) const fn public_unmount_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn broad_host_teardown_enabled(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct PendingHostRootDeletionCleanupRecord {
    root: FiberRootId,
    host_root: FiberId,
    deletion_list: DeletionListId,
    deletion_list_index: usize,
    deleted_index: usize,
    subtree_index: usize,
    parent: FiberId,
    parent_tag: FiberTag,
    host_parent: Option<HostRootDeletionHostParentRecord>,
    deleted_root: FiberId,
    fiber: FiberId,
    tag: FiberTag,
    state_node: StateNodeHandle,
    token_target: HostFiberTokenTarget,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct HostRootDeletionHostParentRecord {
    pub(super) fiber: FiberId,
    pub(super) tag: FiberTag,
    pub(super) state_node: StateNodeHandle,
    pub(super) traversal_depth: usize,
}

pub(super) fn find_nearest_host_parent_for_deletion(
    arena: &FiberArena,
    deletion_parent: FiberId,
) -> Result<Option<HostRootDeletionHostParentRecord>, RootCommitError> {
    let mut candidate = deletion_parent;
    let mut traversal_depth = 0;

    loop {
        let node = arena.get(candidate)?;
        match node.tag() {
            FiberTag::HostRoot | FiberTag::HostComponent => {
                return Ok(Some(HostRootDeletionHostParentRecord {
                    fiber: candidate,
                    tag: node.tag(),
                    state_node: node.state_node(),
                    traversal_depth,
                }));
            }
            FiberTag::FunctionComponent => {
                let Some(parent) = node.return_fiber() else {
                    return Ok(None);
                };
                candidate = parent;
                traversal_depth += 1;
            }
            _ => return Ok(None),
        }
    }
}

pub(super) fn collect_deletion_list_metadata<H: HostTypes>(
    store: &FiberRootStore<H>,
    finished_work: FiberId,
) -> Result<Vec<HostRootDeletionListRecord>, RootCommitError> {
    let arena = store.fiber_arena();
    let mut records = Vec::new();
    let mut stack = vec![finished_work];

    while let Some(parent) = stack.pop() {
        let node = arena.get(parent)?;
        let deletion_list = node.deletions();
        let flags = node.flags();
        let child_ids = arena.child_ids(parent)?;

        if let Some(list_id) = deletion_list {
            let list = arena
                .deletion_list(list_id)
                .ok_or(FiberTopologyError::InvalidDeletionList { id: list_id })?;
            if list.parent() != parent {
                return Err(FiberTopologyError::InvalidDeletionList { id: list_id }.into());
            }
            if !list.is_empty() && !flags.contains_all(FiberFlags::CHILD_DELETION) {
                return Err(FiberTopologyError::DeletionListMissingFlag {
                    parent,
                    list: list_id,
                }
                .into());
            }

            let mut deleted = Vec::with_capacity(list.len());
            for &deleted_fiber in list {
                arena.get(deleted_fiber)?;
                if child_ids.contains(&deleted_fiber) {
                    return Err(FiberTopologyError::DeletedChildStillInFinishedChain {
                        parent,
                        deleted: deleted_fiber,
                    }
                    .into());
                }
                deleted.push(deleted_fiber);
            }

            if !deleted.is_empty() {
                records.push(HostRootDeletionListRecord {
                    parent,
                    list: list_id,
                    deleted,
                });
            }
        }

        stack.extend(child_ids.into_iter().rev());
    }

    Ok(records)
}

pub(super) fn materialize_deletion_subtree_traversal_gate<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    deletion_lists: &[HostRootDeletionListRecord],
) -> Result<HostRootDeletionSubtreeTraversalGateSnapshot, RootCommitError> {
    let arena = store.fiber_arena();
    let mut records = Vec::new();

    for (deletion_list_index, deletion_list) in deletion_lists.iter().enumerate() {
        let parent = arena.get(deletion_list.parent())?;
        let host_parent = find_nearest_host_parent_for_deletion(arena, deletion_list.parent())?;
        for (deleted_index, &deleted_root) in deletion_list.deleted().iter().enumerate() {
            let deleted_root_tag = arena.get(deleted_root)?.tag();
            collect_deletion_subtree_traversal_gate_records(
                arena,
                DeletionSubtreeTraversalGateRequest {
                    root,
                    host_root: finished_work,
                    deletion_list: deletion_list.list(),
                    deletion_list_index,
                    deleted_index,
                    parent: deletion_list.parent(),
                    parent_tag: parent.tag(),
                    host_parent,
                    deleted_root,
                    deleted_root_tag,
                },
                deleted_root,
                0,
                StateNodeHandle::NONE,
                &mut records,
            )?;
        }
    }

    Ok(HostRootDeletionSubtreeTraversalGateSnapshot::from_records(
        records,
    ))
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct DeletionSubtreeTraversalGateRequest {
    root: FiberRootId,
    host_root: FiberId,
    deletion_list: DeletionListId,
    deletion_list_index: usize,
    deleted_index: usize,
    parent: FiberId,
    parent_tag: FiberTag,
    host_parent: Option<HostRootDeletionHostParentRecord>,
    deleted_root: FiberId,
    deleted_root_tag: FiberTag,
}

fn collect_deletion_subtree_traversal_gate_records(
    arena: &FiberArena,
    request: DeletionSubtreeTraversalGateRequest,
    fiber: FiberId,
    traversal_depth: usize,
    portal_container_state_node: StateNodeHandle,
    records: &mut Vec<HostRootDeletionSubtreeTraversalGateRecord>,
) -> Result<(), RootCommitError> {
    let node = arena.get(fiber)?;
    let tag = node.tag();
    let portal_container_state_node = if tag == FiberTag::Portal {
        node.state_node()
    } else {
        portal_container_state_node
    };

    match deletion_subtree_boundary_status(tag) {
        Some(status @ HostRootDeletionSubtreeTraversalGateStatus::FragmentDeletedSubtreeDiagnostic)
        | Some(status @ HostRootDeletionSubtreeTraversalGateStatus::PortalDeletedSubtreeDiagnostic) =>
        {
            push_deletion_subtree_traversal_gate_record(
                records,
                request,
                fiber,
                tag,
                traversal_depth,
                node.state_node(),
                portal_container_state_node,
                None,
                status,
            );
        }
        Some(
            status @ HostRootDeletionSubtreeTraversalGateStatus::UnsupportedSuspenseTraversalBlocked,
        )
        | Some(
            status @ HostRootDeletionSubtreeTraversalGateStatus::UnsupportedOffscreenTraversalBlocked,
        )
        | Some(status @ HostRootDeletionSubtreeTraversalGateStatus::BroadDeletionTraversalBlocked) => {
            let unsupported_feature =
                unsupported_reconciler_feature_for_fiber_tag(tag).map(|feature| feature.feature());
            push_deletion_subtree_traversal_gate_record(
                records,
                request,
                fiber,
                tag,
                traversal_depth,
                node.state_node(),
                portal_container_state_node,
                unsupported_feature,
                status,
            );
            return Ok(());
        }
        Some(HostRootDeletionSubtreeTraversalGateStatus::HostNodeCleanupMetadata) | None => {}
    }

    if deletion_subtree_should_traverse_children(tag) {
        for child in arena.child_ids(fiber)? {
            collect_deletion_subtree_traversal_gate_records(
                arena,
                request,
                child,
                traversal_depth + 1,
                portal_container_state_node,
                records,
            )?;
        }
    }

    if host_node_cleanup_token_target(tag).is_some() {
        push_deletion_subtree_traversal_gate_record(
            records,
            request,
            fiber,
            tag,
            traversal_depth,
            node.state_node(),
            portal_container_state_node,
            None,
            HostRootDeletionSubtreeTraversalGateStatus::HostNodeCleanupMetadata,
        );
    }

    Ok(())
}

#[allow(
    clippy::too_many_arguments,
    reason = "private deletion traversal evidence records each observed deletion dimension"
)]
fn push_deletion_subtree_traversal_gate_record(
    records: &mut Vec<HostRootDeletionSubtreeTraversalGateRecord>,
    request: DeletionSubtreeTraversalGateRequest,
    fiber: FiberId,
    tag: FiberTag,
    traversal_depth: usize,
    state_node: StateNodeHandle,
    portal_container_state_node: StateNodeHandle,
    unsupported_feature: Option<&'static str>,
    status: HostRootDeletionSubtreeTraversalGateStatus,
) {
    records.push(HostRootDeletionSubtreeTraversalGateRecord {
        sequence: records.len(),
        root: request.root,
        host_root: request.host_root,
        deletion_list: request.deletion_list,
        deletion_list_index: request.deletion_list_index,
        deleted_index: request.deleted_index,
        parent: request.parent,
        parent_tag: request.parent_tag,
        host_parent: request.host_parent.map(|parent| parent.fiber),
        host_parent_tag: request.host_parent.map(|parent| parent.tag),
        host_parent_state_node: request
            .host_parent
            .map(|parent| parent.state_node)
            .unwrap_or(StateNodeHandle::NONE),
        host_parent_traversal_depth: request.host_parent.map(|parent| parent.traversal_depth),
        deleted_root: request.deleted_root,
        deleted_root_tag: request.deleted_root_tag,
        fiber,
        tag,
        traversal_depth,
        state_node,
        portal_container_state_node,
        unsupported_feature,
        status,
    });
}

const fn deletion_subtree_boundary_status(
    tag: FiberTag,
) -> Option<HostRootDeletionSubtreeTraversalGateStatus> {
    match tag {
        FiberTag::Fragment => {
            Some(HostRootDeletionSubtreeTraversalGateStatus::FragmentDeletedSubtreeDiagnostic)
        }
        FiberTag::Portal => {
            Some(HostRootDeletionSubtreeTraversalGateStatus::PortalDeletedSubtreeDiagnostic)
        }
        FiberTag::Suspense => {
            Some(HostRootDeletionSubtreeTraversalGateStatus::UnsupportedSuspenseTraversalBlocked)
        }
        FiberTag::Offscreen => {
            Some(HostRootDeletionSubtreeTraversalGateStatus::UnsupportedOffscreenTraversalBlocked)
        }
        FiberTag::HostComponent | FiberTag::HostText | FiberTag::FunctionComponent => None,
        _ => Some(HostRootDeletionSubtreeTraversalGateStatus::BroadDeletionTraversalBlocked),
    }
}

const fn deletion_subtree_should_traverse_children(tag: FiberTag) -> bool {
    matches!(
        tag,
        FiberTag::HostComponent
            | FiberTag::FunctionComponent
            | FiberTag::Fragment
            | FiberTag::Portal
    )
}

pub(super) fn collect_pending_host_node_deletion_cleanup<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    deletion_lists: &[HostRootDeletionListRecord],
) -> Result<Vec<PendingHostRootDeletionCleanupRecord>, RootCommitError> {
    let arena = store.fiber_arena();
    let mut records = Vec::new();

    for (deletion_list_index, deletion_list) in deletion_lists.iter().enumerate() {
        let parent = arena.get(deletion_list.parent())?;
        let host_parent = find_nearest_host_parent_for_deletion(arena, deletion_list.parent())?;
        for (deleted_index, &deleted_root) in deletion_list.deleted().iter().enumerate() {
            let mut subtree_index = 0;
            collect_pending_deleted_subtree_host_node_cleanup(
                arena,
                PendingDeletedSubtreeHostNodeCleanupRequest {
                    root,
                    host_root: finished_work,
                    deletion_list: deletion_list.list(),
                    deletion_list_index,
                    deleted_index,
                    parent: deletion_list.parent(),
                    parent_tag: parent.tag(),
                    host_parent,
                    deleted_root,
                },
                deleted_root,
                &mut subtree_index,
                &mut records,
            )?;
        }
    }

    Ok(records)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct PendingDeletedSubtreeHostNodeCleanupRequest {
    root: FiberRootId,
    host_root: FiberId,
    deletion_list: DeletionListId,
    deletion_list_index: usize,
    deleted_index: usize,
    parent: FiberId,
    parent_tag: FiberTag,
    host_parent: Option<HostRootDeletionHostParentRecord>,
    deleted_root: FiberId,
}

fn collect_pending_deleted_subtree_host_node_cleanup(
    arena: &FiberArena,
    request: PendingDeletedSubtreeHostNodeCleanupRequest,
    fiber: FiberId,
    subtree_index: &mut usize,
    records: &mut Vec<PendingHostRootDeletionCleanupRecord>,
) -> Result<(), RootCommitError> {
    let node = arena.get(fiber)?;

    if deletion_subtree_traversal_blocks_children(node.tag()) {
        return Ok(());
    }

    if deletion_subtree_should_traverse_children(node.tag()) {
        for child in arena.child_ids(fiber)? {
            collect_pending_deleted_subtree_host_node_cleanup(
                arena,
                request,
                child,
                subtree_index,
                records,
            )?;
        }
    }

    if let Some(token_target) = host_node_cleanup_token_target(node.tag()) {
        records.push(PendingHostRootDeletionCleanupRecord {
            root: request.root,
            host_root: request.host_root,
            deletion_list: request.deletion_list,
            deletion_list_index: request.deletion_list_index,
            deleted_index: request.deleted_index,
            subtree_index: *subtree_index,
            parent: request.parent,
            parent_tag: request.parent_tag,
            host_parent: request.host_parent,
            deleted_root: request.deleted_root,
            fiber,
            tag: node.tag(),
            state_node: node.state_node(),
            token_target,
        });
        *subtree_index += 1;
    }

    Ok(())
}

const fn deletion_subtree_traversal_blocks_children(tag: FiberTag) -> bool {
    matches!(
        deletion_subtree_boundary_status(tag),
        Some(HostRootDeletionSubtreeTraversalGateStatus::UnsupportedSuspenseTraversalBlocked)
            | Some(
                HostRootDeletionSubtreeTraversalGateStatus::UnsupportedOffscreenTraversalBlocked
            )
            | Some(HostRootDeletionSubtreeTraversalGateStatus::BroadDeletionTraversalBlocked)
    )
}

const fn host_node_cleanup_token_target(tag: FiberTag) -> Option<HostFiberTokenTarget> {
    match tag {
        FiberTag::HostComponent => Some(HostFiberTokenTarget::Instance),
        FiberTag::HostText => Some(HostFiberTokenTarget::TextInstance),
        _ => None,
    }
}

pub(super) fn materialize_host_node_deletion_cleanup_log<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    pending_records: Vec<PendingHostRootDeletionCleanupRecord>,
) -> Result<HostRootDeletionCleanupLog, RootCommitError> {
    let mut log = HostRootDeletionCleanupLog::new(root, finished_work);
    for pending in pending_records {
        let token_phase = HostFiberTokenPhase::Deletion;
        let token_owner = deletion_cleanup_token_owner(store.fiber_arena(), &pending)?;
        let token = store.host_tokens_mut().issue(
            pending.root,
            token_owner,
            token_phase,
            pending.token_target,
        );
        store.host_tokens().validate(
            token,
            pending.root,
            token_owner,
            token_phase,
            pending.token_target,
        )?;
        log.push(HostRootDeletionCleanupRecord {
            sequence: log.records.len(),
            root: pending.root,
            host_root: pending.host_root,
            deletion_list: pending.deletion_list,
            deletion_list_index: pending.deletion_list_index,
            deleted_index: pending.deleted_index,
            subtree_index: pending.subtree_index,
            parent: pending.parent,
            parent_tag: pending.parent_tag,
            host_parent: pending.host_parent.map(|parent| parent.fiber),
            host_parent_tag: pending.host_parent.map(|parent| parent.tag),
            host_parent_state_node: pending
                .host_parent
                .map(|parent| parent.state_node)
                .unwrap_or(StateNodeHandle::NONE),
            host_parent_traversal_depth: pending.host_parent.map(|parent| parent.traversal_depth),
            deleted_root: pending.deleted_root,
            fiber: pending.fiber,
            tag: pending.tag,
            state_node: pending.state_node,
            token,
            token_phase,
            token_target: pending.token_target,
        });
    }

    Ok(log)
}

fn deletion_cleanup_token_owner(
    arena: &FiberArena,
    pending: &PendingHostRootDeletionCleanupRecord,
) -> Result<FiberId, RootCommitError> {
    if pending.state_node.is_none() {
        return Ok(pending.fiber);
    }

    let node = arena.get(pending.fiber)?;
    let Some(owner) = node.alternate() else {
        return Ok(pending.fiber);
    };
    arena.validate_alternate_pair(owner, pending.fiber)?;
    Ok(owner)
}

pub(super) fn materialize_deletion_cleanup_order_gate(
    commit: &HostRootCommitRecord,
) -> HostRootDeletionCleanupOrderGateSnapshot {
    let mut records = Vec::new();
    let mut ref_cleanup_return_count = 0;
    let mut passive_destroy_count = 0;
    let mut host_node_cleanup_count = 0;

    for cleanup_return in commit
        .ref_cleanup_return_execution_gate
        .records()
        .iter()
        .filter(|record| {
            record.action() == HostRootRefCommitAction::Detach
                && record.detach_reason() == Some(HostRootRefDetachReason::Deleted)
        })
    {
        ref_cleanup_return_count += 1;
        let coordinate = deletion_cleanup_coordinate_for_fiber(commit, cleanup_return.fiber());
        records.push(HostRootDeletionCleanupOrderGateRecord {
            sequence: records.len(),
            phase: HostRootDeletionCleanupOrderPhase::RefCleanupReturn,
            root: cleanup_return.root(),
            finished_work: commit.finished_work(),
            deletion_list: coordinate.map(|coordinate| coordinate.deletion_list),
            deletion_list_index: coordinate.map(|coordinate| coordinate.deletion_list_index),
            deleted_index: coordinate.map(|coordinate| coordinate.deleted_index),
            subtree_index: coordinate.map(|coordinate| coordinate.subtree_index),
            deleted_root: coordinate
                .map(|coordinate| coordinate.deleted_root)
                .unwrap_or_else(|| cleanup_return.fiber()),
            fiber: cleanup_return.fiber(),
            tag: coordinate
                .map(|coordinate| coordinate.tag)
                .unwrap_or(FiberTag::HostComponent),
            ref_cleanup_return_sequence: Some(cleanup_return.sequence()),
            passive_unmount_order: None,
            passive_destroy: None,
            host_cleanup_sequence: None,
        });
    }

    for passive in commit
        .function_component_deleted_subtree_passive_effects
        .records()
    {
        passive_destroy_count += 1;
        let coordinate = deletion_list_coordinate_for_deleted_root(commit, passive.deleted_root());
        records.push(HostRootDeletionCleanupOrderGateRecord {
            sequence: records.len(),
            phase: HostRootDeletionCleanupOrderPhase::PassiveDestroy,
            root: passive.root(),
            finished_work: commit.finished_work(),
            deletion_list: coordinate.map(|coordinate| coordinate.deletion_list),
            deletion_list_index: coordinate.map(|coordinate| coordinate.deletion_list_index),
            deleted_index: coordinate.map(|coordinate| coordinate.deleted_index),
            subtree_index: Some(passive.traversal_index()),
            deleted_root: passive.deleted_root(),
            fiber: passive.fiber(),
            tag: FiberTag::FunctionComponent,
            ref_cleanup_return_sequence: None,
            passive_unmount_order: Some(passive.unmount_order()),
            passive_destroy: passive.destroy(),
            host_cleanup_sequence: None,
        });
    }

    for cleanup in commit.host_node_deletion_cleanup_log.records() {
        host_node_cleanup_count += 1;
        records.push(HostRootDeletionCleanupOrderGateRecord {
            sequence: records.len(),
            phase: HostRootDeletionCleanupOrderPhase::HostNodeCleanup,
            root: cleanup.root(),
            finished_work: cleanup.host_root(),
            deletion_list: Some(cleanup.deletion_list()),
            deletion_list_index: Some(cleanup.deletion_list_index()),
            deleted_index: Some(cleanup.deleted_index()),
            subtree_index: Some(cleanup.subtree_index()),
            deleted_root: cleanup.deleted_root(),
            fiber: cleanup.fiber(),
            tag: cleanup.tag(),
            ref_cleanup_return_sequence: None,
            passive_unmount_order: None,
            passive_destroy: None,
            host_cleanup_sequence: Some(cleanup.sequence()),
        });
    }

    HostRootDeletionCleanupOrderGateSnapshot {
        records,
        ref_cleanup_return_count,
        passive_destroy_count,
        host_node_cleanup_count,
    }
}

pub(super) fn materialize_deletion_subtree_host_detachment_plan_for_canary(
    commit: &HostRootCommitRecord,
) -> Result<
    HostRootDeletionSubtreeHostDetachmentPlanForCanary,
    HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary,
> {
    if commit.deletion_lists.len() != 1 {
        return Err(
            HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::MultipleDeletionListsBlocked {
                root: commit.root,
                finished_work: commit.finished_work(),
                count: commit.deletion_lists.len(),
            },
        );
    }

    let deletion_list = &commit.deletion_lists[0];
    if deletion_list.deleted().len() != 1 {
        return Err(
            HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::MultipleDeletedRootsBlocked {
                root: commit.root,
                deletion_list: deletion_list.list(),
                count: deletion_list.deleted().len(),
            },
        );
    }

    let deleted_root = deletion_list.deleted()[0];
    let deleted_root_record = commit
        .deletion_subtree_traversal_gate
        .records()
        .iter()
        .find(|record| record.deleted_root() == deleted_root && record.traversal_depth() == 0)
        .or_else(|| {
            commit
                .deletion_subtree_traversal_gate
                .records()
                .iter()
                .find(|record| record.deleted_root() == deleted_root)
        })
        .ok_or(HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::MissingDeletedRootTraversalRecord {
            root: commit.root,
            deletion_list: deletion_list.list(),
            deleted_root,
        })?;
    let deleted_root_tag = deleted_root_record.deleted_root_tag();

    match deleted_root_tag {
        FiberTag::Portal => {
            return Err(
                HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::PortalDeletedRootBlocked {
                    root: commit.root,
                    deleted_root,
                },
            );
        }
        FiberTag::Suspense | FiberTag::Offscreen => {
            return Err(HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::SuspenseDeletedRootBlocked {
                root: commit.root,
                deleted_root,
                tag: deleted_root_tag,
            });
        }
        FiberTag::HostComponent
        | FiberTag::HostText
        | FiberTag::FunctionComponent
        | FiberTag::Fragment => {}
        tag => {
            return Err(
                HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::BroadDeletedRootBlocked {
                    root: commit.root,
                    deleted_root,
                    tag,
                },
            );
        }
    }

    validate_no_blocked_deletion_subtree_boundaries_for_canary(commit, deleted_root)?;
    validate_host_cleanup_order_records_for_canary(commit)?;

    let host_child_record =
        host_detachment_child_traversal_record_for_canary(commit, deleted_root)?;
    let cleanup_record = commit
        .host_node_deletion_cleanup_log
        .records()
        .iter()
        .find(|cleanup| {
            cleanup.deleted_root() == deleted_root && cleanup.fiber() == host_child_record.fiber()
        })
        .ok_or(
            HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::MissingHostCleanupRecord {
                root: commit.root,
                deleted_root,
            },
        )?;
    let order_record = host_cleanup_order_record_for_canary(commit, cleanup_record)?;

    let host_parent = cleanup_record.host_parent().ok_or(
        HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::MissingHostParent {
            root: commit.root,
            deleted_root,
            host_child: cleanup_record.fiber(),
        },
    )?;
    let host_parent_tag = cleanup_record.host_parent_tag().ok_or(
        HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::MissingHostParent {
            root: commit.root,
            deleted_root,
            host_child: cleanup_record.fiber(),
        },
    )?;
    if !matches!(
        host_parent_tag,
        FiberTag::HostComponent | FiberTag::HostRoot
    ) {
        return Err(
            HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::UnsupportedHostParent {
                root: commit.root,
                deleted_root,
                host_child: cleanup_record.fiber(),
                host_parent,
                host_parent_tag,
            },
        );
    }
    if host_parent_tag == FiberTag::HostComponent
        && cleanup_record.host_parent_state_node().is_none()
    {
        return Err(
            HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::MissingHostParentStateNode {
                root: commit.root,
                deleted_root,
                host_child: cleanup_record.fiber(),
                host_parent,
            },
        );
    }

    Ok(HostRootDeletionSubtreeHostDetachmentPlanForCanary {
        root: commit.root,
        finished_work: commit.finished_work(),
        deletion_list: deletion_list.list(),
        deletion_list_index: 0,
        deleted_index: 0,
        deleted_root,
        deleted_root_tag,
        parent: cleanup_record.parent(),
        parent_tag: cleanup_record.parent_tag(),
        host_parent,
        host_parent_state_node: cleanup_record.host_parent_state_node(),
        host_parent_traversal_depth: cleanup_record.host_parent_traversal_depth().unwrap_or(0),
        host_child: cleanup_record.fiber(),
        host_child_tag: cleanup_record.tag(),
        host_child_state_node: cleanup_record.state_node(),
        host_child_traversal_depth: host_child_record.traversal_depth(),
        cleanup_sequence: cleanup_record.sequence(),
        cleanup_order_sequence: order_record.sequence(),
    })
}

fn validate_no_blocked_deletion_subtree_boundaries_for_canary(
    commit: &HostRootCommitRecord,
    deleted_root: FiberId,
) -> Result<(), HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary> {
    for record in commit
        .deletion_subtree_traversal_gate
        .records()
        .iter()
        .filter(|record| record.deleted_root() == deleted_root && record.fiber() != deleted_root)
    {
        match record.status() {
            HostRootDeletionSubtreeTraversalGateStatus::PortalDeletedSubtreeDiagnostic => {
                return Err(HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::PortalDeletedSubtreeBlocked {
                    root: commit.root,
                    deleted_root,
                    portal: record.fiber(),
                });
            }
            HostRootDeletionSubtreeTraversalGateStatus::UnsupportedSuspenseTraversalBlocked
            | HostRootDeletionSubtreeTraversalGateStatus::UnsupportedOffscreenTraversalBlocked => {
                return Err(HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::SuspenseDeletedSubtreeBlocked {
                    root: commit.root,
                    deleted_root,
                    fiber: record.fiber(),
                    tag: record.tag(),
                });
            }
            HostRootDeletionSubtreeTraversalGateStatus::BroadDeletionTraversalBlocked => {
                return Err(HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::BroadDeletedSubtreeBlocked {
                    root: commit.root,
                    deleted_root,
                    fiber: record.fiber(),
                    tag: record.tag(),
                });
            }
            HostRootDeletionSubtreeTraversalGateStatus::FragmentDeletedSubtreeDiagnostic
            | HostRootDeletionSubtreeTraversalGateStatus::HostNodeCleanupMetadata => {}
        }
    }

    Ok(())
}

fn validate_host_cleanup_order_records_for_canary(
    commit: &HostRootCommitRecord,
) -> Result<(), HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary> {
    for cleanup_record in commit.host_node_deletion_cleanup_log.records() {
        host_cleanup_order_record_for_canary(commit, cleanup_record)?;
    }

    Ok(())
}

fn host_detachment_child_traversal_record_for_canary(
    commit: &HostRootCommitRecord,
    deleted_root: FiberId,
) -> Result<
    HostRootDeletionSubtreeTraversalGateRecord,
    HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary,
> {
    let mut host_records = commit
        .deletion_subtree_traversal_gate
        .records()
        .iter()
        .filter(|record| {
            record.deleted_root() == deleted_root
                && record.status()
                    == HostRootDeletionSubtreeTraversalGateStatus::HostNodeCleanupMetadata
        });
    let first = host_records.next().copied().ok_or(
        HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::MissingHostCleanupRecord {
            root: commit.root,
            deleted_root,
        },
    )?;
    let min_depth = host_records
        .clone()
        .fold(first.traversal_depth(), |depth, record| {
            depth.min(record.traversal_depth())
        });
    let mut direct_host_records = commit
        .deletion_subtree_traversal_gate
        .records()
        .iter()
        .filter(|record| {
            record.deleted_root() == deleted_root
                && record.status()
                    == HostRootDeletionSubtreeTraversalGateStatus::HostNodeCleanupMetadata
                && record.traversal_depth() == min_depth
        });
    let direct = direct_host_records
        .next()
        .copied()
        .expect("first host cleanup record establishes minimum depth");
    let extra_count = direct_host_records.count();
    if extra_count != 0 {
        return Err(
            HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::MultipleHostChildrenBlocked {
                root: commit.root,
                deleted_root,
                count: extra_count + 1,
            },
        );
    }

    Ok(direct)
}

fn host_cleanup_order_record_for_canary(
    commit: &HostRootCommitRecord,
    cleanup_record: &HostRootDeletionCleanupRecord,
) -> Result<
    HostRootDeletionCleanupOrderGateRecord,
    HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary,
> {
    let order_gate = materialize_deletion_cleanup_order_gate(commit);
    let order_record = order_gate
        .records()
        .iter()
        .find(|record| {
            record.phase() == HostRootDeletionCleanupOrderPhase::HostNodeCleanup
                && record.host_cleanup_sequence() == Some(cleanup_record.sequence())
        })
        .ok_or(HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::MissingHostCleanupOrderRecord {
            root: commit.root,
            cleanup_sequence: cleanup_record.sequence(),
        })?;
    if order_record.fiber() != cleanup_record.fiber() {
        return Err(HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary::HostCleanupOrderRecordMismatch {
            root: commit.root,
            cleanup_sequence: cleanup_record.sequence(),
            order_fiber: order_record.fiber(),
            cleanup_fiber: cleanup_record.fiber(),
        });
    }

    Ok(*order_record)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct DeletionCleanupOrderCoordinate {
    deletion_list: DeletionListId,
    deletion_list_index: usize,
    deleted_index: usize,
    subtree_index: usize,
    deleted_root: FiberId,
    tag: FiberTag,
}

fn deletion_cleanup_coordinate_for_fiber(
    commit: &HostRootCommitRecord,
    fiber: FiberId,
) -> Option<DeletionCleanupOrderCoordinate> {
    commit
        .host_node_deletion_cleanup_log
        .records()
        .iter()
        .find(|cleanup| cleanup.fiber() == fiber)
        .map(|cleanup| DeletionCleanupOrderCoordinate {
            deletion_list: cleanup.deletion_list(),
            deletion_list_index: cleanup.deletion_list_index(),
            deleted_index: cleanup.deleted_index(),
            subtree_index: cleanup.subtree_index(),
            deleted_root: cleanup.deleted_root(),
            tag: cleanup.tag(),
        })
}

fn deletion_list_coordinate_for_deleted_root(
    commit: &HostRootCommitRecord,
    deleted_root: FiberId,
) -> Option<DeletionCleanupOrderCoordinate> {
    commit
        .deletion_lists()
        .iter()
        .enumerate()
        .find_map(|(deletion_list_index, deletion_list)| {
            deletion_list
                .deleted()
                .iter()
                .position(|deleted| *deleted == deleted_root)
                .map(|deleted_index| DeletionCleanupOrderCoordinate {
                    deletion_list: deletion_list.list(),
                    deletion_list_index,
                    deleted_index,
                    subtree_index: 0,
                    deleted_root,
                    tag: FiberTag::FunctionComponent,
                })
        })
}
