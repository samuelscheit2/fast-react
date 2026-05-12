use super::*;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererCommittedHostOutput {
    pub(crate) render: HostRootRenderPhaseRecord,
    pub(crate) prepared_fibers: TestRendererHostOutputCanaryPreparedFibers,
    pub(crate) completed_fibers: TestRendererHostOutputCanaryCompletedFibers,
    pub(crate) commit: HostRootCommitRecord,
    pub(crate) fiber_inspection: TestRendererCommittedFiberTreeInspection,
    pub(crate) snapshot: TestContainerSnapshot,
}

impl TestRendererCommittedHostOutput {
    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn prepared_fibers(&self) -> TestRendererHostOutputCanaryPreparedFibers {
        self.prepared_fibers
    }

    #[must_use]
    pub const fn completed_fibers(&self) -> TestRendererHostOutputCanaryCompletedFibers {
        self.completed_fibers
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn fiber_inspection(&self) -> &TestRendererCommittedFiberTreeInspection {
        &self.fiber_inspection
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererUpdatedHostOutput {
    pub(crate) scheduled_update_sequence: usize,
    pub(crate) render: HostRootRenderPhaseRecord,
    pub(crate) updated_fibers: TestRendererHostOutputCanaryUpdatedFibers,
    pub(crate) commit: HostRootCommitRecord,
    pub(crate) fiber_inspection: TestRendererCommittedFiberTreeInspection,
    pub(crate) commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    pub(crate) previous_snapshot: TestContainerSnapshot,
    pub(crate) snapshot: TestContainerSnapshot,
}

impl TestRendererUpdatedHostOutput {
    #[must_use]
    pub const fn scheduled_update_sequence(&self) -> usize {
        self.scheduled_update_sequence
    }

    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn updated_fibers(&self) -> TestRendererHostOutputCanaryUpdatedFibers {
        self.updated_fibers
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn fiber_inspection(&self) -> &TestRendererCommittedFiberTreeInspection {
        &self.fiber_inspection
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn previous_snapshot(&self) -> &TestContainerSnapshot {
        &self.previous_snapshot
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererSiblingTextHostOutput {
    pub(crate) scheduled_update_sequence: usize,
    pub(crate) render: HostRootRenderPhaseRecord,
    pub(crate) stable_fibers: TestRendererHostOutputCanaryUpdatedFibers,
    pub(crate) root_text_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) root_text_props_raw: u64,
    pub(crate) root_text_state_node_raw: u64,
    pub(crate) component_state_node_raw: u64,
    pub(crate) component_text_state_node_raw: u64,
    pub(crate) commit: HostRootCommitRecord,
    pub(crate) fiber_inspection: TestRendererCommittedFiberTreeInspection,
    pub(crate) commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    pub(crate) previous_snapshot: TestContainerSnapshot,
    pub(crate) snapshot: TestContainerSnapshot,
    pub(crate) root_text_snapshot: TestTextSnapshot,
}

impl TestRendererSiblingTextHostOutput {
    #[must_use]
    pub const fn scheduled_update_sequence(&self) -> usize {
        self.scheduled_update_sequence
    }

    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn stable_fibers(&self) -> TestRendererHostOutputCanaryUpdatedFibers {
        self.stable_fibers
    }

    #[must_use]
    pub const fn root_text_fiber(&self) -> TestRendererFiberHandleDiagnostics {
        self.root_text_fiber
    }

    #[must_use]
    pub const fn root_text_props_raw(&self) -> u64 {
        self.root_text_props_raw
    }

    #[must_use]
    pub const fn root_text_state_node_raw(&self) -> u64 {
        self.root_text_state_node_raw
    }

    #[must_use]
    pub const fn component_state_node_raw(&self) -> u64 {
        self.component_state_node_raw
    }

    #[must_use]
    pub const fn component_text_state_node_raw(&self) -> u64 {
        self.component_text_state_node_raw
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn fiber_inspection(&self) -> &TestRendererCommittedFiberTreeInspection {
        &self.fiber_inspection
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn previous_snapshot(&self) -> &TestContainerSnapshot {
        &self.previous_snapshot
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }

    #[must_use]
    pub const fn root_text_snapshot(&self) -> &TestTextSnapshot {
        &self.root_text_snapshot
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererHostParentPlacedHostOutput {
    pub(crate) scheduled_update_sequence: usize,
    pub(crate) render: HostRootRenderPhaseRecord,
    pub(crate) updated_fibers: TestRendererHostOutputCanaryCurrentFibers,
    pub(crate) placed_text_fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) placed_text_props_raw: u64,
    pub(crate) parent_state_node_raw: u64,
    pub(crate) placed_text_state_node_raw: u64,
    pub(crate) commit: HostRootCommitRecord,
    pub(crate) commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    pub(crate) previous_snapshot: TestContainerSnapshot,
    pub(crate) snapshot: TestContainerSnapshot,
    pub(crate) placed_text_snapshot: TestTextSnapshot,
    pub(crate) host_parent_placement_apply_count: usize,
}

impl TestRendererHostParentPlacedHostOutput {
    #[must_use]
    pub const fn scheduled_update_sequence(&self) -> usize {
        self.scheduled_update_sequence
    }

    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn updated_fibers(&self) -> TestRendererHostOutputCanaryCurrentFibers {
        self.updated_fibers
    }

    #[must_use]
    pub const fn placed_text_fiber(&self) -> TestRendererFiberHandleDiagnostics {
        self.placed_text_fiber
    }

    #[must_use]
    pub const fn placed_text_props_raw(&self) -> u64 {
        self.placed_text_props_raw
    }

    #[must_use]
    pub const fn parent_state_node_raw(&self) -> u64 {
        self.parent_state_node_raw
    }

    #[must_use]
    pub const fn placed_text_state_node_raw(&self) -> u64 {
        self.placed_text_state_node_raw
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn previous_snapshot(&self) -> &TestContainerSnapshot {
        &self.previous_snapshot
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }

    #[must_use]
    pub const fn placed_text_snapshot(&self) -> &TestTextSnapshot {
        &self.placed_text_snapshot
    }

    #[must_use]
    pub const fn host_parent_placement_apply_count(&self) -> usize {
        self.host_parent_placement_apply_count
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererNestedCommittedHostOutput {
    pub(crate) render: HostRootRenderPhaseRecord,
    pub(crate) outer_fibers: TestRendererHostOutputCanaryCurrentFibers,
    pub(crate) inner_fibers: TestRendererHostOutputCanaryCurrentFibers,
    pub(crate) commit: HostRootCommitRecord,
    pub(crate) fiber_inspection: TestRendererCommittedFiberTreeInspection,
    pub(crate) commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    pub(crate) snapshot: TestContainerSnapshot,
}

impl TestRendererNestedCommittedHostOutput {
    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn outer_fibers(&self) -> TestRendererHostOutputCanaryCurrentFibers {
        self.outer_fibers
    }

    #[must_use]
    pub const fn inner_fibers(&self) -> TestRendererHostOutputCanaryCurrentFibers {
        self.inner_fibers
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn fiber_inspection(&self) -> &TestRendererCommittedFiberTreeInspection {
        &self.fiber_inspection
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererNestedHostParentPlacedHostOutput {
    pub(crate) scheduled_update_sequence: usize,
    pub(crate) render: HostRootRenderPhaseRecord,
    pub(crate) outer_fibers: TestRendererHostOutputCanaryCurrentFibers,
    pub(crate) inner_fibers: TestRendererHostOutputCanaryCurrentFibers,
    pub(crate) commit: HostRootCommitRecord,
    pub(crate) fiber_inspection: TestRendererCommittedFiberTreeInspection,
    pub(crate) commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    pub(crate) previous_snapshot: TestContainerSnapshot,
    pub(crate) snapshot: TestContainerSnapshot,
    pub(crate) placed_text_snapshot: TestTextSnapshot,
    pub(crate) nested_parent_state_node_raw: u64,
    pub(crate) placed_text_state_node_raw: u64,
    pub(crate) host_parent_placement_apply_count: usize,
}

impl TestRendererNestedHostParentPlacedHostOutput {
    #[must_use]
    pub const fn scheduled_update_sequence(&self) -> usize {
        self.scheduled_update_sequence
    }

    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn outer_fibers(&self) -> TestRendererHostOutputCanaryCurrentFibers {
        self.outer_fibers
    }

    #[must_use]
    pub const fn inner_fibers(&self) -> TestRendererHostOutputCanaryCurrentFibers {
        self.inner_fibers
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn fiber_inspection(&self) -> &TestRendererCommittedFiberTreeInspection {
        &self.fiber_inspection
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn previous_snapshot(&self) -> &TestContainerSnapshot {
        &self.previous_snapshot
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }

    #[must_use]
    pub const fn placed_text_snapshot(&self) -> &TestTextSnapshot {
        &self.placed_text_snapshot
    }

    #[must_use]
    pub const fn nested_parent_state_node_raw(&self) -> u64 {
        self.nested_parent_state_node_raw
    }

    #[must_use]
    pub const fn placed_text_state_node_raw(&self) -> u64 {
        self.placed_text_state_node_raw
    }

    #[must_use]
    pub const fn host_parent_placement_apply_count(&self) -> usize {
        self.host_parent_placement_apply_count
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererUnmountedHostOutput {
    pub(crate) render: HostRootRenderPhaseRecord,
    pub(crate) deleted_fibers: TestRendererHostOutputCanaryDeletedFibers,
    pub(crate) commit: HostRootCommitRecord,
    pub(crate) commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    pub(crate) host_node_cleanup: TestRendererHostNodeCleanupReport,
    pub(crate) previous_snapshot: TestContainerSnapshot,
    pub(crate) snapshot: TestContainerSnapshot,
    pub(crate) detached_instance_snapshot: TestElementSnapshot,
}

impl TestRendererUnmountedHostOutput {
    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn deleted_fibers(&self) -> TestRendererHostOutputCanaryDeletedFibers {
        self.deleted_fibers
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn host_node_cleanup(&self) -> &TestRendererHostNodeCleanupReport {
        &self.host_node_cleanup
    }

    #[must_use]
    pub const fn previous_snapshot(&self) -> &TestContainerSnapshot {
        &self.previous_snapshot
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }

    #[must_use]
    pub const fn detached_instance_snapshot(&self) -> &TestElementSnapshot {
        &self.detached_instance_snapshot
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererStableSiblingInsertionApplyKind {
    InsertInContainerBefore,
    InsertionBlocked,
    AppendToContainer,
    Other,
}

impl TestRendererStableSiblingInsertionApplyKind {
    pub(crate) fn from_reconciler_apply_kind(kind: &str) -> Self {
        match kind {
            "insert-placement-in-container-before" => Self::InsertInContainerBefore,
            "record-placement-insertion-blocked" => Self::InsertionBlocked,
            "append-placement-to-container" => Self::AppendToContainer,
            _ => Self::Other,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererStableSiblingInsertionSiblingStatus {
    Append,
    InsertBefore,
    BlockedPendingPlacement,
    BlockedUnsupportedTag,
    BlockedMissingStateNode,
    MissingPlacementSiblingRecord,
    Other,
}

impl TestRendererStableSiblingInsertionSiblingStatus {
    pub(crate) fn from_reconciler_sibling_status(status: &str) -> Self {
        match status {
            "append" => Self::Append,
            "insert-before" => Self::InsertBefore,
            "blocked-pending-placement" => Self::BlockedPendingPlacement,
            "blocked-unsupported-tag" => Self::BlockedUnsupportedTag,
            "blocked-missing-state-node" => Self::BlockedMissingStateNode,
            "missing-placement-sibling-record" => Self::MissingPlacementSiblingRecord,
            _ => Self::Other,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererStableSiblingInsertionMutationStatus {
    AppliedInsertInContainerBefore,
    RecordedOnly,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererStableSiblingInsertionDiagnostics {
    pub(crate) apply_kind: TestRendererStableSiblingInsertionApplyKind,
    pub(crate) sibling_status: TestRendererStableSiblingInsertionSiblingStatus,
    pub(crate) mutation_status: TestRendererStableSiblingInsertionMutationStatus,
    pub(crate) fiber: TestRendererFiberHandleDiagnostics,
    pub(crate) sibling: Option<TestRendererFiberHandleDiagnostics>,
    pub(crate) state_node_raw: u64,
    pub(crate) sibling_state_node_raw: u64,
    pub(crate) can_insert_before: bool,
}

impl TestRendererStableSiblingInsertionDiagnostics {
    #[must_use]
    pub const fn apply_kind(self) -> TestRendererStableSiblingInsertionApplyKind {
        self.apply_kind
    }

    #[must_use]
    pub const fn sibling_status(self) -> TestRendererStableSiblingInsertionSiblingStatus {
        self.sibling_status
    }

    #[must_use]
    pub const fn mutation_status(self) -> TestRendererStableSiblingInsertionMutationStatus {
        self.mutation_status
    }

    #[must_use]
    pub const fn fiber(self) -> TestRendererFiberHandleDiagnostics {
        self.fiber
    }

    #[must_use]
    pub const fn sibling(self) -> Option<TestRendererFiberHandleDiagnostics> {
        self.sibling
    }

    #[must_use]
    pub const fn state_node_raw(self) -> u64 {
        self.state_node_raw
    }

    #[must_use]
    pub const fn sibling_state_node_raw(self) -> u64 {
        self.sibling_state_node_raw
    }

    #[must_use]
    pub const fn can_insert_before(self) -> bool {
        self.can_insert_before
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererStableSiblingInsertedHostOutput {
    pub(crate) render: HostRootRenderPhaseRecord,
    pub(crate) stable_fibers: TestRendererHostOutputCanaryUpdatedFibers,
    pub(crate) inserted_fibers: TestRendererHostOutputCanaryCompletedFibers,
    pub(crate) commit: HostRootCommitRecord,
    pub(crate) commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics,
    pub(crate) insertion_diagnostics: TestRendererStableSiblingInsertionDiagnostics,
    pub(crate) previous_snapshot: TestContainerSnapshot,
    pub(crate) snapshot: TestContainerSnapshot,
}

impl TestRendererStableSiblingInsertedHostOutput {
    #[must_use]
    pub const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub const fn stable_fibers(&self) -> TestRendererHostOutputCanaryUpdatedFibers {
        self.stable_fibers
    }

    #[must_use]
    pub const fn inserted_fibers(&self) -> TestRendererHostOutputCanaryCompletedFibers {
        self.inserted_fibers
    }

    #[must_use]
    pub const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub const fn commit_diagnostics(&self) -> &TestRendererHostOutputCanaryCommitDiagnostics {
        &self.commit_diagnostics
    }

    #[must_use]
    pub const fn insertion_diagnostics(&self) -> TestRendererStableSiblingInsertionDiagnostics {
        self.insertion_diagnostics
    }

    #[must_use]
    pub const fn previous_snapshot(&self) -> &TestContainerSnapshot {
        &self.previous_snapshot
    }

    #[must_use]
    pub const fn snapshot(&self) -> &TestContainerSnapshot {
        &self.snapshot
    }
}
