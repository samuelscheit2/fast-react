use super::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererSerializationGateStatus {
    ClosedMissingHostOutput,
    ClosedMissingFiberInspection,
    ReadyForPrivateSerializationDiagnostics,
}

impl TestRendererSerializationGateStatus {
    #[must_use]
    pub const fn is_ready(self) -> bool {
        matches!(self, Self::ReadyForPrivateSerializationDiagnostics)
    }

    #[must_use]
    pub const fn is_closed(self) -> bool {
        !self.is_ready()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererSerializationGateRequirements {
    pub(crate) root_commit_diagnostics_available: bool,
    pub(crate) real_host_output_available: bool,
    pub(crate) committed_fiber_inspection_available: bool,
}

impl TestRendererSerializationGateRequirements {
    #[must_use]
    pub const fn root_commit_diagnostics_available(self) -> bool {
        self.root_commit_diagnostics_available
    }

    #[must_use]
    pub const fn real_host_output_available(self) -> bool {
        self.real_host_output_available
    }

    #[must_use]
    pub const fn committed_fiber_inspection_available(self) -> bool {
        self.committed_fiber_inspection_available
    }

    #[must_use]
    pub const fn private_serialization_ready(self) -> bool {
        self.root_commit_diagnostics_available
            && self.real_host_output_available
            && self.committed_fiber_inspection_available
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererSerializationOracleDiagnostics {
    pub(crate) oracle_kind: &'static str,
    pub(crate) probe_mode_count: usize,
    pub(crate) scenario_count: usize,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererSerializationOracleDiagnostics {
    #[must_use]
    pub const fn current() -> Self {
        Self {
            oracle_kind: TEST_RENDERER_SERIALIZATION_ORACLE_KIND,
            probe_mode_count: TEST_RENDERER_SERIALIZATION_ORACLE_PROBE_MODE_COUNT,
            scenario_count: TEST_RENDERER_SERIALIZATION_ORACLE_SCENARIO_COUNT,
            compatibility_claimed: false,
        }
    }

    #[must_use]
    pub const fn oracle_kind(self) -> &'static str {
        self.oracle_kind
    }

    #[must_use]
    pub const fn probe_mode_count(self) -> usize {
        self.probe_mode_count
    }

    #[must_use]
    pub const fn scenario_count(self) -> usize {
        self.scenario_count
    }

    #[must_use]
    pub const fn compatibility_claimed(self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererFiberHandleDiagnostics {
    pub(crate) arena_id: u64,
    pub(crate) slot: usize,
    pub(crate) generation: u64,
}

impl TestRendererFiberHandleDiagnostics {
    #[must_use]
    pub const fn from_raw_parts_for_canary(arena_id: u64, slot: usize, generation: u64) -> Self {
        Self {
            arena_id,
            slot,
            generation,
        }
    }

    #[must_use]
    pub const fn arena_id(self) -> u64 {
        self.arena_id
    }

    #[must_use]
    pub const fn slot(self) -> usize {
        self.slot
    }

    #[must_use]
    pub const fn generation(self) -> u64 {
        self.generation
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererPrivateActPendingPassiveFlushMetadata {
    pub(crate) root: FiberRootId,
    pub(crate) finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) pending_unmount_count: usize,
    pub(crate) pending_mount_count: usize,
    pub(crate) scheduler_request_order: usize,
    pub(crate) scheduler_priority: &'static str,
}

impl TestRendererPrivateActPendingPassiveFlushMetadata {
    #[must_use]
    pub const fn new_for_canary(
        root: FiberRootId,
        finished_work: TestRendererFiberHandleDiagnostics,
        pending_unmount_count: usize,
        pending_mount_count: usize,
    ) -> Self {
        Self {
            root,
            finished_work,
            pending_unmount_count,
            pending_mount_count,
            scheduler_request_order: 0,
            scheduler_priority: "Normal",
        }
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.finished_work
    }

    #[must_use]
    pub const fn pending_unmount_count(self) -> usize {
        self.pending_unmount_count
    }

    #[must_use]
    pub const fn pending_mount_count(self) -> usize {
        self.pending_mount_count
    }

    #[must_use]
    pub const fn pending_record_count(self) -> usize {
        self.pending_unmount_count + self.pending_mount_count
    }

    #[must_use]
    pub const fn scheduler_request_order(self) -> usize {
        self.scheduler_request_order
    }

    #[must_use]
    pub const fn scheduler_priority(self) -> &'static str {
        self.scheduler_priority
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateActPassiveEffectDrainDiagnostics {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) accepted_reconciler_records: [&'static str; 5],
    pub(crate) metadata: TestRendererPrivateActPendingPassiveFlushMetadata,
    pub(crate) metadata_root_matches_renderer_root: bool,
    pub(crate) consumes_pending_passive_flush_metadata: bool,
    pub(crate) consumes_accepted_scheduler_flush_metadata: bool,
    pub(crate) private_scheduler_flush_request_metadata_consumed: bool,
    pub(crate) consumes_accepted_native_update_execution: bool,
    pub(crate) private_update_native_bridge_admission:
        Option<TestRendererUpdateNativeBridgeAdmission>,
    pub(crate) host_output_produced_from_native_update: bool,
    pub(crate) executes_passive_effects: bool,
    pub(crate) invokes_effect_callbacks: bool,
    pub(crate) invokes_act_callback: bool,
    pub(crate) public_update_compatibility_claimed: bool,
    pub(crate) public_act_compatibility_claimed: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateActPassiveEffectDrainDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn accepted_reconciler_records(&self) -> &[&'static str; 5] {
        &self.accepted_reconciler_records
    }

    #[must_use]
    pub const fn metadata(&self) -> TestRendererPrivateActPendingPassiveFlushMetadata {
        self.metadata
    }

    #[must_use]
    pub const fn metadata_root_matches_renderer_root(&self) -> bool {
        self.metadata_root_matches_renderer_root
    }

    #[must_use]
    pub const fn consumes_pending_passive_flush_metadata(&self) -> bool {
        self.consumes_pending_passive_flush_metadata
    }

    #[must_use]
    pub const fn consumes_accepted_scheduler_flush_metadata(&self) -> bool {
        self.consumes_accepted_scheduler_flush_metadata
    }

    #[must_use]
    pub const fn private_scheduler_flush_request_metadata_consumed(&self) -> bool {
        self.private_scheduler_flush_request_metadata_consumed
    }

    #[must_use]
    pub const fn consumes_accepted_native_update_execution(&self) -> bool {
        self.consumes_accepted_native_update_execution
    }

    #[must_use]
    pub const fn private_update_native_bridge_admission(
        &self,
    ) -> Option<TestRendererUpdateNativeBridgeAdmission> {
        self.private_update_native_bridge_admission
    }

    #[must_use]
    pub const fn host_output_produced_from_native_update(&self) -> bool {
        self.host_output_produced_from_native_update
    }

    #[must_use]
    pub const fn executes_passive_effects(&self) -> bool {
        self.executes_passive_effects
    }

    #[must_use]
    pub const fn invokes_effect_callbacks(&self) -> bool {
        self.invokes_effect_callbacks
    }

    #[must_use]
    pub const fn invokes_act_callback(&self) -> bool {
        self.invokes_act_callback
    }

    #[must_use]
    pub const fn public_update_compatibility_claimed(&self) -> bool {
        self.public_update_compatibility_claimed
    }

    #[must_use]
    pub const fn public_act_compatibility_claimed(&self) -> bool {
        self.public_act_compatibility_claimed
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererPrivateActNestedScopePassiveFlushDiagnostics {
    pub(crate) diagnostic_name: &'static str,
    pub(crate) status: &'static str,
    pub(crate) passive_drain: TestRendererPrivateActPassiveEffectDrainDiagnostics,
    pub(crate) flush_order: [&'static str; 5],
    pub(crate) outer_scope_depth: usize,
    pub(crate) inner_scope_depth: usize,
    pub(crate) passive_flush_order_index: usize,
    pub(crate) pending_unmount_count: usize,
    pub(crate) pending_mount_count: usize,
    pub(crate) pending_passive_record_count: usize,
    pub(crate) nested_scope_metadata_accepted: bool,
    pub(crate) private_passive_flush_metadata_accepted: bool,
    pub(crate) drains_accepted_pending_passive_flush_metadata: bool,
    pub(crate) deterministic_flush_order: bool,
    pub(crate) public_act_scope_depth_tracking_available: bool,
    pub(crate) public_nested_act_queue_reuse_available: bool,
    pub(crate) public_overlapping_act_warning_emission_available: bool,
    pub(crate) invokes_act_callback: bool,
    pub(crate) executes_passive_effects: bool,
    pub(crate) invokes_effect_callbacks: bool,
    pub(crate) public_act_compatibility_claimed: bool,
    pub(crate) compatibility_claimed: bool,
}

impl TestRendererPrivateActNestedScopePassiveFlushDiagnostics {
    #[must_use]
    pub const fn diagnostic_name(&self) -> &'static str {
        self.diagnostic_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn passive_drain(&self) -> &TestRendererPrivateActPassiveEffectDrainDiagnostics {
        &self.passive_drain
    }

    #[must_use]
    pub const fn flush_order(&self) -> &[&'static str; 5] {
        &self.flush_order
    }

    #[must_use]
    pub const fn outer_scope_depth(&self) -> usize {
        self.outer_scope_depth
    }

    #[must_use]
    pub const fn inner_scope_depth(&self) -> usize {
        self.inner_scope_depth
    }

    #[must_use]
    pub const fn passive_flush_order_index(&self) -> usize {
        self.passive_flush_order_index
    }

    #[must_use]
    pub const fn pending_unmount_count(&self) -> usize {
        self.pending_unmount_count
    }

    #[must_use]
    pub const fn pending_mount_count(&self) -> usize {
        self.pending_mount_count
    }

    #[must_use]
    pub const fn pending_passive_record_count(&self) -> usize {
        self.pending_passive_record_count
    }

    #[must_use]
    pub const fn nested_scope_metadata_accepted(&self) -> bool {
        self.nested_scope_metadata_accepted
    }

    #[must_use]
    pub const fn private_passive_flush_metadata_accepted(&self) -> bool {
        self.private_passive_flush_metadata_accepted
    }

    #[must_use]
    pub const fn drains_accepted_pending_passive_flush_metadata(&self) -> bool {
        self.drains_accepted_pending_passive_flush_metadata
    }

    #[must_use]
    pub const fn deterministic_flush_order(&self) -> bool {
        self.deterministic_flush_order
    }

    #[must_use]
    pub const fn public_act_scope_depth_tracking_available(&self) -> bool {
        self.public_act_scope_depth_tracking_available
    }

    #[must_use]
    pub const fn public_nested_act_queue_reuse_available(&self) -> bool {
        self.public_nested_act_queue_reuse_available
    }

    #[must_use]
    pub const fn public_overlapping_act_warning_emission_available(&self) -> bool {
        self.public_overlapping_act_warning_emission_available
    }

    #[must_use]
    pub const fn invokes_act_callback(&self) -> bool {
        self.invokes_act_callback
    }

    #[must_use]
    pub const fn executes_passive_effects(&self) -> bool {
        self.executes_passive_effects
    }

    #[must_use]
    pub const fn invokes_effect_callbacks(&self) -> bool {
        self.invokes_effect_callbacks
    }

    #[must_use]
    pub const fn public_act_compatibility_claimed(&self) -> bool {
        self.public_act_compatibility_claimed
    }

    #[must_use]
    pub const fn compatibility_claimed(&self) -> bool {
        self.compatibility_claimed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererRootUpdateCallbackDiagnostics {
    pub(crate) empty: bool,
    pub(crate) visible_count: usize,
    pub(crate) hidden_count: usize,
    pub(crate) deferred_hidden_count: usize,
}

impl TestRendererRootUpdateCallbackDiagnostics {
    #[must_use]
    pub const fn is_empty(self) -> bool {
        self.empty
    }

    #[must_use]
    pub const fn visible_count(self) -> usize {
        self.visible_count
    }

    #[must_use]
    pub const fn hidden_count(self) -> usize {
        self.hidden_count
    }

    #[must_use]
    pub const fn deferred_hidden_count(self) -> usize {
        self.deferred_hidden_count
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererCommitDiagnostics {
    pub(crate) root: FiberRootId,
    pub(crate) lifecycle: TestRendererRootLifecycle,
    pub(crate) last_update_kind: Option<TestRendererRootUpdateKind>,
    pub(crate) last_scheduled_element: Option<RootElementHandle>,
    pub(crate) previous_current: TestRendererFiberHandleDiagnostics,
    pub(crate) current: TestRendererFiberHandleDiagnostics,
    pub(crate) finished_work: TestRendererFiberHandleDiagnostics,
    pub(crate) finished_lanes_bits: u32,
    pub(crate) remaining_lanes_bits: u32,
    pub(crate) pending_lanes_bits: u32,
    pub(crate) finished_lanes_empty: bool,
    pub(crate) finished_lanes_include_sync: bool,
    pub(crate) remaining_lanes_empty: bool,
    pub(crate) pending_lanes_empty: bool,
    pub(crate) has_remaining_work: bool,
    pub(crate) root_update_callbacks: TestRendererRootUpdateCallbackDiagnostics,
}

impl TestRendererCommitDiagnostics {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn lifecycle(self) -> TestRendererRootLifecycle {
        self.lifecycle
    }

    #[must_use]
    pub const fn last_update_kind(self) -> Option<TestRendererRootUpdateKind> {
        self.last_update_kind
    }

    #[must_use]
    pub const fn last_scheduled_element(self) -> Option<RootElementHandle> {
        self.last_scheduled_element
    }

    #[must_use]
    pub const fn previous_current(self) -> TestRendererFiberHandleDiagnostics {
        self.previous_current
    }

    #[must_use]
    pub const fn current(self) -> TestRendererFiberHandleDiagnostics {
        self.current
    }

    #[must_use]
    pub const fn finished_work(self) -> TestRendererFiberHandleDiagnostics {
        self.finished_work
    }

    #[must_use]
    pub const fn finished_lanes_bits(self) -> u32 {
        self.finished_lanes_bits
    }

    #[must_use]
    pub const fn remaining_lanes_bits(self) -> u32 {
        self.remaining_lanes_bits
    }

    #[must_use]
    pub const fn pending_lanes_bits(self) -> u32 {
        self.pending_lanes_bits
    }

    #[must_use]
    pub const fn finished_lanes_empty(self) -> bool {
        self.finished_lanes_empty
    }

    #[must_use]
    pub const fn finished_lanes_include_sync(self) -> bool {
        self.finished_lanes_include_sync
    }

    #[must_use]
    pub const fn remaining_lanes_empty(self) -> bool {
        self.remaining_lanes_empty
    }

    #[must_use]
    pub const fn pending_lanes_empty(self) -> bool {
        self.pending_lanes_empty
    }

    #[must_use]
    pub const fn has_remaining_work(self) -> bool {
        self.has_remaining_work
    }

    #[must_use]
    pub const fn root_update_callbacks(self) -> TestRendererRootUpdateCallbackDiagnostics {
        self.root_update_callbacks
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererHostOutputDiagnostics {
    pub(crate) container_child_count: usize,
    pub(crate) instance_count: usize,
    pub(crate) text_count: usize,
    pub(crate) real_host_output_available: bool,
}

impl TestRendererHostOutputDiagnostics {
    #[must_use]
    pub const fn container_child_count(self) -> usize {
        self.container_child_count
    }

    #[must_use]
    pub const fn instance_count(self) -> usize {
        self.instance_count
    }

    #[must_use]
    pub const fn text_count(self) -> usize {
        self.text_count
    }

    #[must_use]
    pub const fn real_host_output_available(self) -> bool {
        self.real_host_output_available
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererSerializationGateReport {
    pub(crate) gate_name: &'static str,
    pub(crate) status: TestRendererSerializationGateStatus,
    pub(crate) requirements: TestRendererSerializationGateRequirements,
    pub(crate) oracle: TestRendererSerializationOracleDiagnostics,
    pub(crate) commit: TestRendererCommitDiagnostics,
    pub(crate) host_output: TestRendererHostOutputDiagnostics,
    pub(crate) fiber_inspection: Option<Box<TestRendererCommittedFiberTreeInspection>>,
}

impl TestRendererSerializationGateReport {
    #[must_use]
    pub const fn gate_name(&self) -> &'static str {
        self.gate_name
    }

    #[must_use]
    pub const fn status(&self) -> TestRendererSerializationGateStatus {
        self.status
    }

    #[must_use]
    pub const fn is_ready(&self) -> bool {
        self.status.is_ready()
    }

    #[must_use]
    pub const fn is_closed(&self) -> bool {
        self.status.is_closed()
    }

    #[must_use]
    pub const fn requirements(&self) -> TestRendererSerializationGateRequirements {
        self.requirements
    }

    #[must_use]
    pub const fn oracle(&self) -> TestRendererSerializationOracleDiagnostics {
        self.oracle
    }

    #[must_use]
    pub const fn commit(&self) -> TestRendererCommitDiagnostics {
        self.commit
    }

    #[must_use]
    pub const fn host_output(&self) -> TestRendererHostOutputDiagnostics {
        self.host_output
    }

    #[must_use]
    pub fn fiber_inspection(&self) -> Option<&TestRendererCommittedFiberTreeInspection> {
        self.fiber_inspection.as_deref()
    }
}
