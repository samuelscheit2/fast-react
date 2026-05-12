use super::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct FunctionComponentEffectRingBinding {
    pub(super) list: HookListId,
    pub(super) ring: HookEffectRing,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct FunctionComponentPendingEffectQueueBinding {
    pub(super) fiber: FiberId,
    pub(super) state: FunctionComponentHookRenderState,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentEffectPhase {
    Insertion,
    Layout,
    Passive,
}

impl FunctionComponentEffectPhase {
    #[must_use]
    pub const fn hook_flags(self) -> HookEffectFlags {
        match self {
            Self::Insertion => HookEffectFlags::INSERTION,
            Self::Layout => HookEffectFlags::LAYOUT,
            Self::Passive => HookEffectFlags::PASSIVE,
        }
    }

    #[must_use]
    pub const fn mount_fiber_flags(self) -> FiberFlags {
        match self {
            Self::Insertion => FiberFlags::UPDATE,
            Self::Layout => FiberFlags::UPDATE.merge(FiberFlags::LAYOUT_STATIC),
            Self::Passive => FiberFlags::PASSIVE.merge(FiberFlags::PASSIVE_STATIC),
        }
    }

    #[must_use]
    pub const fn update_fiber_flags(self) -> FiberFlags {
        match self {
            Self::Insertion | Self::Layout => FiberFlags::UPDATE,
            Self::Passive => FiberFlags::PASSIVE,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentEffectDependencyStatus {
    Changed,
    Unchanged,
}

impl FunctionComponentEffectDependencyStatus {
    #[must_use]
    pub const fn should_register_has_effect(self) -> bool {
        matches!(self, Self::Changed)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentEffectDependencyPhase {
    Mount,
    UpdateChanged,
    UpdateUnchanged,
}

impl FunctionComponentEffectDependencyPhase {
    #[must_use]
    pub const fn from_render_metadata(
        render_phase: FunctionComponentHookRenderPhase,
        dependency_status: Option<FunctionComponentEffectDependencyStatus>,
    ) -> Self {
        match (render_phase, dependency_status) {
            (FunctionComponentHookRenderPhase::Mount, _) => Self::Mount,
            (
                FunctionComponentHookRenderPhase::Update,
                Some(FunctionComponentEffectDependencyStatus::Unchanged),
            ) => Self::UpdateUnchanged,
            (FunctionComponentHookRenderPhase::Update, _) => Self::UpdateChanged,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentEffectRegistration {
    pub(super) hook: HookSlotId,
    pub(super) effect: HookEffectId,
    pub(super) instance: HookEffectInstanceId,
    pub(super) phase: FunctionComponentEffectPhase,
    pub(super) tag: HookEffectFlags,
    pub(super) create: HookEffectCallbackHandle,
    pub(super) dependencies: HookEffectDependencies,
    pub(super) fiber_flags: FiberFlags,
}

impl FunctionComponentEffectRegistration {
    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub const fn phase(self) -> FunctionComponentEffectPhase {
        self.phase
    }

    #[must_use]
    pub const fn tag(self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub const fn create(self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn fiber_flags(self) -> FiberFlags {
        self.fiber_flags
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentPassiveEffectMetadata {
    pub(super) fiber: FiberId,
    pub(super) render_phase: FunctionComponentHookRenderPhase,
    pub(super) hook_list: HookListId,
    pub(super) effect_index: usize,
    pub(super) effect: HookEffectId,
    pub(super) previous_effect: Option<HookEffectId>,
    pub(super) instance: HookEffectInstanceId,
    pub(super) tag: HookEffectFlags,
    pub(super) create: HookEffectCallbackHandle,
    pub(super) destroy: Option<HookEffectCallbackHandle>,
    pub(super) dependencies: HookEffectDependencies,
    pub(super) lanes: Lanes,
}

impl FunctionComponentPassiveEffectMetadata {
    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn render_phase(self) -> FunctionComponentHookRenderPhase {
        self.render_phase
    }

    #[must_use]
    pub const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub const fn effect_index(self) -> usize {
        self.effect_index
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub const fn previous_effect(self) -> Option<HookEffectId> {
        self.previous_effect
    }

    #[must_use]
    pub const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub const fn tag(self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub const fn create(self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn lanes(self) -> Lanes {
        self.lanes
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentLayoutEffectMetadata {
    pub(super) fiber: FiberId,
    pub(super) render_phase: FunctionComponentHookRenderPhase,
    pub(super) hook_list: HookListId,
    pub(super) effect_index: usize,
    pub(super) effect: HookEffectId,
    pub(super) previous_effect: Option<HookEffectId>,
    pub(super) instance: HookEffectInstanceId,
    pub(super) tag: HookEffectFlags,
    pub(super) create: HookEffectCallbackHandle,
    pub(super) destroy: Option<HookEffectCallbackHandle>,
    pub(super) previous_dependencies: Option<HookEffectDependencies>,
    pub(super) dependencies: HookEffectDependencies,
    pub(super) dependency_status: Option<FunctionComponentEffectDependencyStatus>,
    pub(super) lanes: Lanes,
}

impl FunctionComponentLayoutEffectMetadata {
    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn render_phase(self) -> FunctionComponentHookRenderPhase {
        self.render_phase
    }

    #[must_use]
    pub const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub const fn effect_index(self) -> usize {
        self.effect_index
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub const fn previous_effect(self) -> Option<HookEffectId> {
        self.previous_effect
    }

    #[must_use]
    pub const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub const fn tag(self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub const fn create(self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub const fn previous_dependencies(self) -> Option<HookEffectDependencies> {
        self.previous_dependencies
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn dependency_status(self) -> Option<FunctionComponentEffectDependencyStatus> {
        self.dependency_status
    }

    #[must_use]
    pub const fn dependency_phase(self) -> FunctionComponentEffectDependencyPhase {
        FunctionComponentEffectDependencyPhase::from_render_metadata(
            self.render_phase,
            self.dependency_status,
        )
    }

    #[must_use]
    pub const fn lanes(self) -> Lanes {
        self.lanes
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentEffectUpdateQueue {
    pub(super) hook_list: HookListId,
    pub(super) records: Vec<FunctionComponentEffectUpdateQueueRecord>,
}

#[allow(
    dead_code,
    reason = "private function-component effect update queue canary for future committed effect ownership"
)]
impl FunctionComponentEffectUpdateQueue {
    #[must_use]
    pub const fn hook_list(&self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub fn records(&self) -> &[FunctionComponentEffectUpdateQueueRecord] {
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
    pub fn changed_dependency_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.dependencies_changed())
            .count()
    }

    #[must_use]
    pub fn unchanged_dependency_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.dependencies_unchanged())
            .count()
    }

    #[must_use]
    pub fn accepted_passive_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.accepted_for_pending_passive())
            .count()
    }

    #[must_use]
    pub fn accepted_layout_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.accepted_for_layout_commit())
            .count()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentEffectUpdateQueueRecord {
    pub(super) update_index: usize,
    pub(super) fiber: FiberId,
    pub(super) hook_list: HookListId,
    pub(super) hook: HookSlotId,
    pub(super) previous_effect: HookEffectId,
    pub(super) effect: HookEffectId,
    pub(super) instance: HookEffectInstanceId,
    pub(super) phase: FunctionComponentEffectPhase,
    pub(super) tag: HookEffectFlags,
    pub(super) create: HookEffectCallbackHandle,
    pub(super) destroy: Option<HookEffectCallbackHandle>,
    pub(super) previous_dependencies: HookEffectDependencies,
    pub(super) dependencies: HookEffectDependencies,
    pub(super) dependency_status: FunctionComponentEffectDependencyStatus,
}

#[allow(
    dead_code,
    reason = "private function-component effect update queue canary for future committed effect ownership"
)]
impl FunctionComponentEffectUpdateQueueRecord {
    #[must_use]
    pub const fn update_index(self) -> usize {
        self.update_index
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn previous_effect(self) -> HookEffectId {
        self.previous_effect
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub const fn phase(self) -> FunctionComponentEffectPhase {
        self.phase
    }

    #[must_use]
    pub const fn tag(self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub const fn create(self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub const fn previous_dependencies(self) -> HookEffectDependencies {
        self.previous_dependencies
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn dependency_status(self) -> FunctionComponentEffectDependencyStatus {
        self.dependency_status
    }

    #[must_use]
    pub const fn dependencies_changed(self) -> bool {
        matches!(
            self.dependency_status,
            FunctionComponentEffectDependencyStatus::Changed
        )
    }

    #[must_use]
    pub const fn dependencies_unchanged(self) -> bool {
        matches!(
            self.dependency_status,
            FunctionComponentEffectDependencyStatus::Unchanged
        )
    }

    #[must_use]
    pub const fn accepted_for_pending_passive(self) -> bool {
        matches!(self.phase, FunctionComponentEffectPhase::Passive) && self.tag.fires_in_passive()
    }

    #[must_use]
    pub const fn accepted_for_layout_commit(self) -> bool {
        matches!(self.phase, FunctionComponentEffectPhase::Layout) && self.tag.fires_in_layout()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentEffectDestroyHandlePersistenceRecord {
    pub(super) update_index: usize,
    pub(super) fiber: FiberId,
    pub(super) hook_list: HookListId,
    pub(super) hook: HookSlotId,
    pub(super) previous_effect: HookEffectId,
    pub(super) effect: HookEffectId,
    pub(super) previous_instance: HookEffectInstanceId,
    pub(super) retained_instance: HookEffectInstanceId,
    pub(super) phase: FunctionComponentEffectPhase,
    pub(super) tag: HookEffectFlags,
    pub(super) recorded_destroy: Option<HookEffectCallbackHandle>,
    pub(super) previous_destroy: Option<HookEffectCallbackHandle>,
    pub(super) retained_destroy: Option<HookEffectCallbackHandle>,
    pub(super) dependency_status: FunctionComponentEffectDependencyStatus,
    pub(super) accepted_for_pending_passive: bool,
    pub(super) accepted_for_layout_commit: bool,
}

#[allow(
    dead_code,
    reason = "private effect destroy-handle provenance canary for update lifecycle ordering"
)]
impl FunctionComponentEffectDestroyHandlePersistenceRecord {
    #[must_use]
    pub const fn update_index(self) -> usize {
        self.update_index
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn previous_effect(self) -> HookEffectId {
        self.previous_effect
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub const fn previous_instance(self) -> HookEffectInstanceId {
        self.previous_instance
    }

    #[must_use]
    pub const fn retained_instance(self) -> HookEffectInstanceId {
        self.retained_instance
    }

    #[must_use]
    pub const fn phase(self) -> FunctionComponentEffectPhase {
        self.phase
    }

    #[must_use]
    pub const fn tag(self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub const fn recorded_destroy(self) -> Option<HookEffectCallbackHandle> {
        self.recorded_destroy
    }

    #[must_use]
    pub const fn previous_destroy(self) -> Option<HookEffectCallbackHandle> {
        self.previous_destroy
    }

    #[must_use]
    pub const fn retained_destroy(self) -> Option<HookEffectCallbackHandle> {
        self.retained_destroy
    }

    #[must_use]
    pub const fn dependency_status(self) -> FunctionComponentEffectDependencyStatus {
        self.dependency_status
    }

    #[must_use]
    pub const fn accepted_for_pending_passive(self) -> bool {
        self.accepted_for_pending_passive
    }

    #[must_use]
    pub const fn accepted_for_layout_commit(self) -> bool {
        self.accepted_for_layout_commit
    }

    #[must_use]
    pub fn instance_reused(self) -> bool {
        self.previous_instance == self.retained_instance
    }

    #[must_use]
    pub fn destroy_handle_matches_recorded_update_metadata(self) -> bool {
        self.recorded_destroy == self.previous_destroy
            && self.recorded_destroy == self.retained_destroy
    }

    #[must_use]
    pub fn proves_destroy_handle_persisted(self) -> bool {
        self.instance_reused() && self.destroy_handle_matches_recorded_update_metadata()
    }

    #[must_use]
    pub fn proves_update_unmount_metadata_consumes_previous_destroy(self) -> bool {
        self.proves_destroy_handle_persisted()
            && self.recorded_destroy.is_some()
            && (self.accepted_for_pending_passive || self.accepted_for_layout_commit)
    }

    #[must_use]
    pub fn proves_removed_effect_retains_previous_destroy(self) -> bool {
        self.proves_destroy_handle_persisted()
            && self.recorded_destroy.is_some()
            && matches!(
                self.dependency_status,
                FunctionComponentEffectDependencyStatus::Unchanged
            )
            && !self.accepted_for_pending_passive
            && !self.accepted_for_layout_commit
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentCommittedEffectRecord {
    pub(super) effect_index: usize,
    pub(super) hook_list: HookListId,
    pub(super) effect: HookEffectId,
    pub(super) previous_effect: Option<HookEffectId>,
    pub(super) instance: HookEffectInstanceId,
    pub(super) phase: FunctionComponentEffectPhase,
    pub(super) tag: HookEffectFlags,
    pub(super) create: HookEffectCallbackHandle,
    pub(super) destroy: Option<HookEffectCallbackHandle>,
    pub(super) previous_dependencies: Option<HookEffectDependencies>,
    pub(super) dependencies: HookEffectDependencies,
    pub(super) dependency_status: Option<FunctionComponentEffectDependencyStatus>,
    pub(super) lanes: Lanes,
}

#[allow(
    dead_code,
    reason = "private committed function-component effect queue records for future passive traversal"
)]
impl FunctionComponentCommittedEffectRecord {
    #[must_use]
    pub const fn effect_index(self) -> usize {
        self.effect_index
    }

    #[must_use]
    pub const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub const fn previous_effect(self) -> Option<HookEffectId> {
        self.previous_effect
    }

    #[must_use]
    pub const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub const fn phase(self) -> FunctionComponentEffectPhase {
        self.phase
    }

    #[must_use]
    pub const fn tag(self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub const fn create(self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub const fn previous_dependencies(self) -> Option<HookEffectDependencies> {
        self.previous_dependencies
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn dependency_status(self) -> Option<FunctionComponentEffectDependencyStatus> {
        self.dependency_status
    }

    #[must_use]
    pub const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub const fn matches_flags(self, flags: HookEffectFlags) -> bool {
        self.tag.contains_all(flags)
    }

    #[must_use]
    pub const fn accepted_for_pending_passive(self) -> bool {
        matches!(self.phase, FunctionComponentEffectPhase::Passive) && self.tag.fires_in_passive()
    }

    #[must_use]
    pub const fn accepted_for_layout_commit(self) -> bool {
        matches!(self.phase, FunctionComponentEffectPhase::Layout) && self.tag.fires_in_layout()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentCommittedEffectQueue {
    pub(super) fiber: FiberId,
    pub(super) phase: FunctionComponentHookRenderPhase,
    pub(super) hook_list: HookListId,
    pub(super) lanes: Lanes,
    pub(super) records: Vec<FunctionComponentCommittedEffectRecord>,
}

#[allow(
    dead_code,
    reason = "private committed function-component effect queue records for future passive traversal"
)]
impl FunctionComponentCommittedEffectQueue {
    #[must_use]
    pub const fn fiber(&self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn phase(&self) -> FunctionComponentHookRenderPhase {
        self.phase
    }

    #[must_use]
    pub const fn hook_list(&self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub fn records(&self) -> &[FunctionComponentCommittedEffectRecord] {
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
    pub fn accepted_passive_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.accepted_for_pending_passive())
            .count()
    }

    #[must_use]
    pub fn accepted_layout_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.accepted_for_layout_commit())
            .count()
    }

    #[must_use]
    pub fn passive_effect_metadata(
        &self,
        flags: HookEffectFlags,
    ) -> Vec<FunctionComponentPassiveEffectMetadata> {
        if self.lanes.is_empty() {
            return Vec::new();
        }

        let mut accepted = Vec::new();
        for record in &self.records {
            if record.phase() != FunctionComponentEffectPhase::Passive {
                continue;
            }

            if !record.matches_flags(flags) {
                continue;
            }

            accepted.push(FunctionComponentPassiveEffectMetadata {
                fiber: self.fiber,
                render_phase: self.phase,
                hook_list: record.hook_list(),
                effect_index: accepted.len(),
                effect: record.effect(),
                previous_effect: record.previous_effect(),
                instance: record.instance(),
                tag: record.tag(),
                create: record.create(),
                destroy: record.destroy(),
                dependencies: record.dependencies(),
                lanes: self.lanes,
            });
        }
        accepted
    }

    #[must_use]
    pub fn layout_effect_metadata(
        &self,
        flags: HookEffectFlags,
    ) -> Vec<FunctionComponentLayoutEffectMetadata> {
        if self.lanes.is_empty() {
            return Vec::new();
        }

        let mut accepted = Vec::new();
        for record in &self.records {
            if record.phase() != FunctionComponentEffectPhase::Layout
                || !record.matches_flags(flags)
            {
                continue;
            }

            accepted.push(FunctionComponentLayoutEffectMetadata {
                fiber: self.fiber,
                render_phase: self.phase,
                hook_list: record.hook_list(),
                effect_index: record.effect_index(),
                effect: record.effect(),
                previous_effect: record.previous_effect(),
                instance: record.instance(),
                tag: record.tag(),
                create: record.create(),
                destroy: record.destroy(),
                previous_dependencies: record.previous_dependencies(),
                dependencies: record.dependencies(),
                dependency_status: record.dependency_status(),
                lanes: self.lanes,
            });
        }
        accepted
    }
}

pub(super) fn effect_dependency_status(
    previous: HookEffectDependencies,
    next: HookEffectDependencies,
) -> FunctionComponentEffectDependencyStatus {
    if next.is_always_run() || previous != next {
        FunctionComponentEffectDependencyStatus::Changed
    } else {
        FunctionComponentEffectDependencyStatus::Unchanged
    }
}

pub(super) fn function_component_effect_phase_from_flags(
    tag: HookEffectFlags,
) -> FunctionComponentEffectPhase {
    if tag.contains_any(HookEffectFlags::INSERTION) {
        FunctionComponentEffectPhase::Insertion
    } else if tag.contains_any(HookEffectFlags::LAYOUT) {
        FunctionComponentEffectPhase::Layout
    } else {
        FunctionComponentEffectPhase::Passive
    }
}
