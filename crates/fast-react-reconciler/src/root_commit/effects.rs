//! Function-component commit effect metadata and handoff helpers.

use super::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct PendingPassiveCommitHandoff {
    pub(super) root: FiberRootId,
    pub(super) finished_work: FiberId,
    pub(super) lanes: Lanes,
    pub(super) pending_unmount_count: usize,
    pub(super) pending_mount_count: usize,
}

#[allow(
    dead_code,
    reason = "crate-private passive commit metadata for future passive-effect workers"
)]
impl PendingPassiveCommitHandoff {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn pending_unmount_count(self) -> usize {
        self.pending_unmount_count
    }

    #[must_use]
    pub(crate) const fn pending_mount_count(self) -> usize {
        self.pending_mount_count
    }

    #[must_use]
    pub(crate) const fn pending_record_count(self) -> usize {
        self.pending_unmount_count + self.pending_mount_count
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct FunctionComponentPendingPassiveEffectCommitRecord {
    pub(super) fiber: FiberId,
    pub(super) effect_index: usize,
    pub(super) effect: HookEffectId,
    pub(super) previous_effect: Option<HookEffectId>,
    pub(super) instance: HookEffectInstanceId,
    pub(super) create: HookEffectCallbackHandle,
    pub(super) destroy: Option<HookEffectCallbackHandle>,
    pub(super) lanes: Lanes,
    pub(super) unmount_order: Option<PendingPassiveEffectOrder>,
    pub(super) mount_order: PendingPassiveEffectOrder,
}

#[allow(
    dead_code,
    reason = "crate-private passive hook-effect handoff metadata for deterministic canaries"
)]
impl FunctionComponentPendingPassiveEffectCommitRecord {
    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn effect_index(self) -> usize {
        self.effect_index
    }

    #[must_use]
    pub(crate) const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub(crate) const fn previous_effect(self) -> Option<HookEffectId> {
        self.previous_effect
    }

    #[must_use]
    pub(crate) const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub(crate) const fn create(self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub(crate) const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn unmount_order(self) -> Option<PendingPassiveEffectOrder> {
        self.unmount_order
    }

    #[must_use]
    pub(crate) const fn mount_order(self) -> PendingPassiveEffectOrder {
        self.mount_order
    }

    #[must_use]
    const fn unmount_phase_record(
        self,
    ) -> Option<FunctionComponentPendingPassiveEffectPhaseCommitRecord> {
        match self.unmount_order {
            Some(order) => Some(FunctionComponentPendingPassiveEffectPhaseCommitRecord {
                fiber: self.fiber,
                effect_index: self.effect_index,
                effect: self.effect,
                previous_effect: self.previous_effect,
                instance: self.instance,
                create: None,
                destroy: self.destroy,
                lanes: self.lanes,
                phase: PendingPassiveEffectPhase::Unmount,
                order,
            }),
            None => None,
        }
    }

    #[must_use]
    const fn mount_phase_record(self) -> FunctionComponentPendingPassiveEffectPhaseCommitRecord {
        FunctionComponentPendingPassiveEffectPhaseCommitRecord {
            fiber: self.fiber,
            effect_index: self.effect_index,
            effect: self.effect,
            previous_effect: self.previous_effect,
            instance: self.instance,
            create: Some(self.create),
            destroy: None,
            lanes: self.lanes,
            phase: PendingPassiveEffectPhase::Mount,
            order: self.mount_order,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct FunctionComponentPendingPassiveEffectPhaseCommitRecord {
    pub(super) fiber: FiberId,
    pub(super) effect_index: usize,
    pub(super) effect: HookEffectId,
    pub(super) previous_effect: Option<HookEffectId>,
    pub(super) instance: HookEffectInstanceId,
    pub(super) create: Option<HookEffectCallbackHandle>,
    pub(super) destroy: Option<HookEffectCallbackHandle>,
    pub(super) lanes: Lanes,
    pub(super) phase: PendingPassiveEffectPhase,
    pub(super) order: PendingPassiveEffectOrder,
}

#[allow(
    dead_code,
    reason = "crate-private passive hook-effect phase handoff metadata for deterministic flush canaries"
)]
impl FunctionComponentPendingPassiveEffectPhaseCommitRecord {
    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn effect_index(self) -> usize {
        self.effect_index
    }

    #[must_use]
    pub(crate) const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub(crate) const fn previous_effect(self) -> Option<HookEffectId> {
        self.previous_effect
    }

    #[must_use]
    pub(crate) const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub(crate) const fn create(self) -> Option<HookEffectCallbackHandle> {
        self.create
    }

    #[must_use]
    pub(crate) const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn phase(self) -> PendingPassiveEffectPhase {
        self.phase
    }

    #[must_use]
    pub(crate) const fn order(self) -> PendingPassiveEffectOrder {
        self.order
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentPendingPassiveCommitHandoff {
    pub(super) root: FiberRootId,
    pub(super) fiber: FiberId,
    pub(super) phase: FunctionComponentHookRenderPhase,
    pub(super) lanes: Lanes,
    pub(super) records: Vec<FunctionComponentPendingPassiveEffectCommitRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private passive hook-effect handoff metadata for deterministic canaries"
)]
impl FunctionComponentPendingPassiveCommitHandoff {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn fiber(&self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn phase(&self) -> FunctionComponentHookRenderPhase {
        self.phase
    }

    #[must_use]
    pub(crate) const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[FunctionComponentPendingPassiveEffectCommitRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub(crate) fn queued_unmount_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.unmount_order().is_some())
            .count()
    }

    #[must_use]
    pub(crate) fn queued_mount_count(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub(crate) fn effect_phase_records(
        &self,
    ) -> Vec<FunctionComponentPendingPassiveEffectPhaseCommitRecord> {
        let mut phase_records =
            Vec::with_capacity(self.queued_unmount_count() + self.queued_mount_count());

        for record in &self.records {
            if let Some(phase_record) = record.unmount_phase_record() {
                phase_records.push(phase_record);
            }
        }
        for record in &self.records {
            phase_records.push(record.mount_phase_record());
        }

        phase_records
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentCommittedPassiveEffectFiberRecord {
    pub(super) fiber: FiberId,
    pub(super) phase: FunctionComponentHookRenderPhase,
    pub(super) lanes: Lanes,
    pub(super) records: Vec<FunctionComponentPendingPassiveEffectPhaseCommitRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private committed function-component passive effect records for traversal canaries"
)]
impl FunctionComponentCommittedPassiveEffectFiberRecord {
    #[must_use]
    pub(crate) const fn fiber(&self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn phase(&self) -> FunctionComponentHookRenderPhase {
        self.phase
    }

    #[must_use]
    pub(crate) const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[FunctionComponentPendingPassiveEffectPhaseCommitRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn queued_unmount_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.phase() == PendingPassiveEffectPhase::Unmount)
            .count()
    }

    #[must_use]
    pub(crate) fn queued_mount_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.phase() == PendingPassiveEffectPhase::Mount)
            .count()
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentCommittedPassiveEffectsSnapshot {
    pub(super) fibers: Vec<FunctionComponentCommittedPassiveEffectFiberRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private committed function-component passive effect records for traversal canaries"
)]
impl FunctionComponentCommittedPassiveEffectsSnapshot {
    #[must_use]
    pub(crate) fn fibers(&self) -> &[FunctionComponentCommittedPassiveEffectFiberRecord] {
        &self.fibers
    }

    #[must_use]
    pub(crate) fn is_empty(&self) -> bool {
        self.fibers.is_empty()
    }

    #[must_use]
    pub(crate) fn fiber_count(&self) -> usize {
        self.fibers.len()
    }

    #[must_use]
    pub(crate) fn queued_unmount_count(&self) -> usize {
        self.fibers
            .iter()
            .map(FunctionComponentCommittedPassiveEffectFiberRecord::queued_unmount_count)
            .sum()
    }

    #[must_use]
    pub(crate) fn queued_mount_count(&self) -> usize {
        self.fibers
            .iter()
            .map(FunctionComponentCommittedPassiveEffectFiberRecord::queued_mount_count)
            .sum()
    }

    #[must_use]
    pub(crate) fn phase_records(
        &self,
    ) -> Vec<FunctionComponentPendingPassiveEffectPhaseCommitRecord> {
        self.fibers
            .iter()
            .flat_map(|fiber| fiber.records().iter().copied())
            .collect()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct FunctionComponentDeletedSubtreePendingPassiveEffectCommitRecord {
    pub(super) root: FiberRootId,
    pub(super) nearest_mounted_ancestor: FiberId,
    pub(super) deleted_root: FiberId,
    pub(super) traversal_index: usize,
    pub(super) fiber: FiberId,
    pub(super) hook_list: HookListId,
    pub(super) effect_index: usize,
    pub(super) effect: HookEffectId,
    pub(super) instance: HookEffectInstanceId,
    pub(super) tag: HookEffectFlags,
    pub(super) create: HookEffectCallbackHandle,
    pub(super) destroy: Option<HookEffectCallbackHandle>,
    pub(super) dependencies: HookEffectDependencies,
    pub(super) lanes: Lanes,
    pub(super) unmount_order: PendingPassiveEffectOrder,
}

#[allow(
    dead_code,
    reason = "crate-private deleted-subtree passive destroy metadata for deterministic deletion canaries"
)]
impl FunctionComponentDeletedSubtreePendingPassiveEffectCommitRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn nearest_mounted_ancestor(self) -> FiberId {
        self.nearest_mounted_ancestor
    }

    #[must_use]
    pub(crate) const fn deleted_root(self) -> FiberId {
        self.deleted_root
    }

    #[must_use]
    pub(crate) const fn traversal_index(self) -> usize {
        self.traversal_index
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub(crate) const fn effect_index(self) -> usize {
        self.effect_index
    }

    #[must_use]
    pub(crate) const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub(crate) const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub(crate) const fn tag(self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub(crate) const fn create(self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub(crate) const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub(crate) const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn unmount_order(self) -> PendingPassiveEffectOrder {
        self.unmount_order
    }

    #[must_use]
    pub(crate) const fn unmount_phase_record(
        self,
    ) -> FunctionComponentPendingPassiveEffectPhaseCommitRecord {
        FunctionComponentPendingPassiveEffectPhaseCommitRecord {
            fiber: self.fiber,
            effect_index: self.effect_index,
            effect: self.effect,
            previous_effect: None,
            instance: self.instance,
            create: None,
            destroy: self.destroy,
            lanes: self.lanes,
            phase: PendingPassiveEffectPhase::Unmount,
            order: self.unmount_order,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentDeletedSubtreePendingPassiveCommitHandoff {
    pub(super) root: FiberRootId,
    pub(super) nearest_mounted_ancestor: FiberId,
    pub(super) deleted_root: FiberId,
    pub(super) lanes: Lanes,
    pub(super) records: Vec<FunctionComponentDeletedSubtreePendingPassiveEffectCommitRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private deleted-subtree passive destroy metadata for deterministic deletion canaries"
)]
impl FunctionComponentDeletedSubtreePendingPassiveCommitHandoff {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn nearest_mounted_ancestor(&self) -> FiberId {
        self.nearest_mounted_ancestor
    }

    #[must_use]
    pub(crate) const fn deleted_root(&self) -> FiberId {
        self.deleted_root
    }

    #[must_use]
    pub(crate) const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) fn records(
        &self,
    ) -> &[FunctionComponentDeletedSubtreePendingPassiveEffectCommitRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub(crate) fn queued_unmount_count(&self) -> usize {
        self.records.len()
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentDeletedSubtreePassiveEffectsSnapshot {
    pub(super) records: Vec<FunctionComponentDeletedSubtreePendingPassiveEffectCommitRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private deleted-subtree passive destroy metadata for deterministic deletion canaries"
)]
impl FunctionComponentDeletedSubtreePassiveEffectsSnapshot {
    #[must_use]
    pub(crate) fn records(
        &self,
    ) -> &[FunctionComponentDeletedSubtreePendingPassiveEffectCommitRecord] {
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
    pub(crate) fn destroy_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.destroy().is_some())
            .count()
    }

    #[must_use]
    pub(crate) fn effect_phase_records(
        &self,
    ) -> Vec<FunctionComponentPendingPassiveEffectPhaseCommitRecord> {
        self.records
            .iter()
            .map(|record| record.unmount_phase_record())
            .collect()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentLayoutEffectCommitRecord {
    pub(super) commit_order: usize,
    pub(super) destroy_order: Option<usize>,
    pub(super) create_order: usize,
    pub(super) fiber: FiberId,
    pub(super) render_phase: FunctionComponentHookRenderPhase,
    pub(super) dependency_phase: FunctionComponentEffectDependencyPhase,
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

#[allow(
    dead_code,
    reason = "crate-private layout hook-effect handoff metadata for deterministic canaries"
)]
impl FunctionComponentLayoutEffectCommitRecord {
    #[must_use]
    pub(crate) const fn commit_order(self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn destroy_order(self) -> Option<usize> {
        self.destroy_order
    }

    #[must_use]
    pub(crate) const fn create_order(self) -> usize {
        self.create_order
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn render_phase(self) -> FunctionComponentHookRenderPhase {
        self.render_phase
    }

    #[must_use]
    pub(crate) const fn dependency_phase(self) -> FunctionComponentEffectDependencyPhase {
        self.dependency_phase
    }

    #[must_use]
    pub(crate) const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub(crate) const fn effect_index(self) -> usize {
        self.effect_index
    }

    #[must_use]
    pub(crate) const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub(crate) const fn previous_effect(self) -> Option<HookEffectId> {
        self.previous_effect
    }

    #[must_use]
    pub(crate) const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub(crate) const fn tag(self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub(crate) const fn create(self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub(crate) const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub(crate) const fn previous_dependencies(self) -> Option<HookEffectDependencies> {
        self.previous_dependencies
    }

    #[must_use]
    pub(crate) const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub(crate) const fn dependency_status(self) -> Option<FunctionComponentEffectDependencyStatus> {
        self.dependency_status
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    const fn destroy_phase_record(self) -> Option<FunctionComponentLayoutEffectPhaseCommitRecord> {
        match self.destroy_order {
            Some(order) => Some(FunctionComponentLayoutEffectPhaseCommitRecord {
                order,
                source_commit_order: self.commit_order,
                fiber: self.fiber,
                render_phase: self.render_phase,
                dependency_phase: self.dependency_phase,
                hook_list: self.hook_list,
                effect_index: self.effect_index,
                effect: match self.previous_effect {
                    Some(effect) => effect,
                    None => self.effect,
                },
                previous_effect: self.previous_effect,
                instance: self.instance,
                tag: self.tag,
                create: None,
                destroy: self.destroy,
                previous_dependencies: self.previous_dependencies,
                dependencies: self.dependencies,
                dependency_status: self.dependency_status,
                lanes: self.lanes,
                handoff: FunctionComponentLayoutEffectHandoff::Destroy,
                commit_phase: FunctionComponentLayoutEffectCommitPhase::Mutation,
            }),
            None => None,
        }
    }

    #[must_use]
    const fn create_phase_record(self) -> FunctionComponentLayoutEffectPhaseCommitRecord {
        FunctionComponentLayoutEffectPhaseCommitRecord {
            order: self.create_order,
            source_commit_order: self.commit_order,
            fiber: self.fiber,
            render_phase: self.render_phase,
            dependency_phase: self.dependency_phase,
            hook_list: self.hook_list,
            effect_index: self.effect_index,
            effect: self.effect,
            previous_effect: self.previous_effect,
            instance: self.instance,
            tag: self.tag,
            create: Some(self.create),
            destroy: None,
            previous_dependencies: self.previous_dependencies,
            dependencies: self.dependencies,
            dependency_status: self.dependency_status,
            lanes: self.lanes,
            handoff: FunctionComponentLayoutEffectHandoff::Create,
            commit_phase: FunctionComponentLayoutEffectCommitPhase::Layout,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum FunctionComponentLayoutEffectHandoff {
    Destroy,
    Create,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum FunctionComponentLayoutEffectCommitPhase {
    Mutation,
    Layout,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentLayoutEffectPhaseCommitRecord {
    pub(super) order: usize,
    pub(super) source_commit_order: usize,
    pub(super) fiber: FiberId,
    pub(super) render_phase: FunctionComponentHookRenderPhase,
    pub(super) dependency_phase: FunctionComponentEffectDependencyPhase,
    pub(super) hook_list: HookListId,
    pub(super) effect_index: usize,
    pub(super) effect: HookEffectId,
    pub(super) previous_effect: Option<HookEffectId>,
    pub(super) instance: HookEffectInstanceId,
    pub(super) tag: HookEffectFlags,
    pub(super) create: Option<HookEffectCallbackHandle>,
    pub(super) destroy: Option<HookEffectCallbackHandle>,
    pub(super) previous_dependencies: Option<HookEffectDependencies>,
    pub(super) dependencies: HookEffectDependencies,
    pub(super) dependency_status: Option<FunctionComponentEffectDependencyStatus>,
    pub(super) lanes: Lanes,
    pub(super) handoff: FunctionComponentLayoutEffectHandoff,
    pub(super) commit_phase: FunctionComponentLayoutEffectCommitPhase,
}

#[allow(
    dead_code,
    reason = "crate-private layout hook-effect phase handoff metadata for deterministic canaries"
)]
impl FunctionComponentLayoutEffectPhaseCommitRecord {
    #[must_use]
    pub(crate) const fn order(self) -> usize {
        self.order
    }

    #[must_use]
    pub(crate) const fn source_commit_order(self) -> usize {
        self.source_commit_order
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn render_phase(self) -> FunctionComponentHookRenderPhase {
        self.render_phase
    }

    #[must_use]
    pub(crate) const fn dependency_phase(self) -> FunctionComponentEffectDependencyPhase {
        self.dependency_phase
    }

    #[must_use]
    pub(crate) const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub(crate) const fn effect_index(self) -> usize {
        self.effect_index
    }

    #[must_use]
    pub(crate) const fn effect(self) -> HookEffectId {
        self.effect
    }

    #[must_use]
    pub(crate) const fn previous_effect(self) -> Option<HookEffectId> {
        self.previous_effect
    }

    #[must_use]
    pub(crate) const fn instance(self) -> HookEffectInstanceId {
        self.instance
    }

    #[must_use]
    pub(crate) const fn tag(self) -> HookEffectFlags {
        self.tag
    }

    #[must_use]
    pub(crate) const fn create(self) -> Option<HookEffectCallbackHandle> {
        self.create
    }

    #[must_use]
    pub(crate) const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub(crate) const fn previous_dependencies(self) -> Option<HookEffectDependencies> {
        self.previous_dependencies
    }

    #[must_use]
    pub(crate) const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub(crate) const fn dependency_status(self) -> Option<FunctionComponentEffectDependencyStatus> {
        self.dependency_status
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn handoff(self) -> FunctionComponentLayoutEffectHandoff {
        self.handoff
    }

    #[must_use]
    pub(crate) const fn commit_phase(self) -> FunctionComponentLayoutEffectCommitPhase {
        self.commit_phase
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentLayoutEffectsSnapshot {
    pub(super) records: Vec<FunctionComponentLayoutEffectCommitRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private layout hook-effect handoff metadata for deterministic canaries"
)]
impl FunctionComponentLayoutEffectsSnapshot {
    #[must_use]
    pub(crate) fn records(&self) -> &[FunctionComponentLayoutEffectCommitRecord] {
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
    pub(crate) fn destroy_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.destroy_order().is_some())
            .count()
    }

    #[must_use]
    pub(crate) fn create_count(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub(crate) fn destroy_phase_records(
        &self,
    ) -> Vec<FunctionComponentLayoutEffectPhaseCommitRecord> {
        self.records
            .iter()
            .filter_map(|record| record.destroy_phase_record())
            .collect()
    }

    #[must_use]
    pub(crate) fn create_phase_records(
        &self,
    ) -> Vec<FunctionComponentLayoutEffectPhaseCommitRecord> {
        self.records
            .iter()
            .map(|record| record.create_phase_record())
            .collect()
    }

    #[must_use]
    pub(crate) fn phase_records(&self) -> Vec<FunctionComponentLayoutEffectPhaseCommitRecord> {
        let mut records = self.destroy_phase_records();
        records.extend(self.create_phase_records());
        records
    }

    #[must_use]
    pub(crate) const fn layout_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn dom_mutation_side_effects_performed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn refs_attached_or_detached(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_effect_compatibility_claimed(&self) -> bool {
        false
    }
}

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub(crate) struct FunctionComponentLayoutEffectCallbackInvocationErrorHandle(u64);

#[allow(
    dead_code,
    reason = "crate-private layout effect callback test-control errors are reserved for private commit canaries"
)]
impl FunctionComponentLayoutEffectCallbackInvocationErrorHandle {
    pub(crate) const NONE: Self = Self(0);

    #[must_use]
    pub(crate) const fn from_raw(raw: u64) -> Self {
        Self(raw)
    }

    #[must_use]
    pub(crate) const fn raw(self) -> u64 {
        self.0
    }

    #[must_use]
    pub(crate) const fn is_none(self) -> bool {
        self.0 == 0
    }

    #[must_use]
    pub(crate) const fn is_some(self) -> bool {
        self.0 != 0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentLayoutEffectCallbackInvocationRequest {
    pub(super) invocation_order: usize,
    pub(super) root: FiberRootId,
    pub(super) finished_work: FiberId,
    pub(super) lanes: Lanes,
    pub(super) source: FunctionComponentLayoutEffectPhaseCommitRecord,
    pub(super) effect_list_sequence: usize,
    pub(super) matched_mutation_sequence: usize,
    pub(super) first_passive_sequence: Option<usize>,
    pub(super) callback: HookEffectCallbackHandle,
}

#[allow(
    dead_code,
    reason = "crate-private layout effect callback requests are reserved for private test-control execution"
)]
impl FunctionComponentLayoutEffectCallbackInvocationRequest {
    #[must_use]
    pub(crate) const fn invocation_order(self) -> usize {
        self.invocation_order
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn source(self) -> FunctionComponentLayoutEffectPhaseCommitRecord {
        self.source
    }

    #[must_use]
    pub(crate) const fn handoff(self) -> FunctionComponentLayoutEffectHandoff {
        self.source.handoff()
    }

    #[must_use]
    pub(crate) const fn commit_phase(self) -> FunctionComponentLayoutEffectCommitPhase {
        self.source.commit_phase()
    }

    #[must_use]
    pub(crate) const fn is_destroy_callback(self) -> bool {
        matches!(
            self.handoff(),
            FunctionComponentLayoutEffectHandoff::Destroy
        )
    }

    #[must_use]
    pub(crate) const fn is_create_callback(self) -> bool {
        matches!(self.handoff(), FunctionComponentLayoutEffectHandoff::Create)
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.source.fiber()
    }

    #[must_use]
    pub(crate) const fn hook_list(self) -> HookListId {
        self.source.hook_list()
    }

    #[must_use]
    pub(crate) const fn effect_index(self) -> usize {
        self.source.effect_index()
    }

    #[must_use]
    pub(crate) const fn effect(self) -> HookEffectId {
        self.source.effect()
    }

    #[must_use]
    pub(crate) const fn previous_effect(self) -> Option<HookEffectId> {
        self.source.previous_effect()
    }

    #[must_use]
    pub(crate) const fn instance(self) -> HookEffectInstanceId {
        self.source.instance()
    }

    #[must_use]
    pub(crate) const fn callback(self) -> HookEffectCallbackHandle {
        self.callback
    }

    #[must_use]
    pub(crate) const fn effect_list_sequence(self) -> usize {
        self.effect_list_sequence
    }

    #[must_use]
    pub(crate) const fn matched_mutation_sequence(self) -> usize {
        self.matched_mutation_sequence
    }

    #[must_use]
    pub(crate) const fn first_passive_sequence(self) -> Option<usize> {
        self.first_passive_sequence
    }

    #[must_use]
    pub(crate) const fn after_matching_mutation_metadata(self) -> bool {
        self.effect_list_sequence > self.matched_mutation_sequence
    }

    #[must_use]
    pub(crate) const fn before_passive_metadata(self) -> bool {
        match self.first_passive_sequence {
            Some(first_passive_sequence) => self.effect_list_sequence < first_passive_sequence,
            None => true,
        }
    }
}

pub(crate) trait FunctionComponentLayoutEffectCallbackInvocationTestControl {
    fn invoke_layout_effect_destroy(
        &mut self,
        _request: FunctionComponentLayoutEffectCallbackInvocationRequest,
    ) -> Result<(), FunctionComponentLayoutEffectCallbackInvocationErrorHandle> {
        Ok(())
    }

    fn invoke_layout_effect_create(
        &mut self,
        request: FunctionComponentLayoutEffectCallbackInvocationRequest,
    ) -> Result<(), FunctionComponentLayoutEffectCallbackInvocationErrorHandle>;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentLayoutEffectCallbackInvocationStatus {
    Completed,
    Errored,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentLayoutEffectCallbackInvocationGateStatus {
    TestControlOnly,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentLayoutEffectCallbackInvocationGateBlocker {
    PublicUseLayoutEffectCompatibility,
    PublicActCompatibility,
    PassivePhaseCallbackExecution,
}

pub(crate) const FUNCTION_COMPONENT_LAYOUT_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS:
    [FunctionComponentLayoutEffectCallbackInvocationGateBlocker; 3] = [
    FunctionComponentLayoutEffectCallbackInvocationGateBlocker::PublicUseLayoutEffectCompatibility,
    FunctionComponentLayoutEffectCallbackInvocationGateBlocker::PublicActCompatibility,
    FunctionComponentLayoutEffectCallbackInvocationGateBlocker::PassivePhaseCallbackExecution,
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentLayoutEffectCallbackInvocationRecord {
    pub(super) request: FunctionComponentLayoutEffectCallbackInvocationRequest,
    pub(super) status: FunctionComponentLayoutEffectCallbackInvocationStatus,
    pub(super) error: Option<FunctionComponentLayoutEffectCallbackInvocationErrorHandle>,
}

#[allow(
    dead_code,
    reason = "crate-private layout effect callback records are reserved for private test-control execution"
)]
impl FunctionComponentLayoutEffectCallbackInvocationRecord {
    #[must_use]
    pub(crate) const fn request(self) -> FunctionComponentLayoutEffectCallbackInvocationRequest {
        self.request
    }

    #[must_use]
    pub(crate) const fn handoff(self) -> FunctionComponentLayoutEffectHandoff {
        self.request.handoff()
    }

    #[must_use]
    pub(crate) const fn commit_phase(self) -> FunctionComponentLayoutEffectCommitPhase {
        self.request.commit_phase()
    }

    #[must_use]
    pub(crate) const fn is_destroy_callback(self) -> bool {
        self.request.is_destroy_callback()
    }

    #[must_use]
    pub(crate) const fn is_create_callback(self) -> bool {
        self.request.is_create_callback()
    }

    #[must_use]
    pub(crate) const fn invocation_order(self) -> usize {
        self.request.invocation_order()
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.request.root()
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
        self.request.finished_work()
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.request.fiber()
    }

    #[must_use]
    pub(crate) const fn effect(self) -> HookEffectId {
        self.request.effect()
    }

    #[must_use]
    pub(crate) const fn callback(self) -> HookEffectCallbackHandle {
        self.request.callback()
    }

    #[must_use]
    pub(crate) const fn status(self) -> FunctionComponentLayoutEffectCallbackInvocationStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn error(
        self,
    ) -> Option<FunctionComponentLayoutEffectCallbackInvocationErrorHandle> {
        self.error
    }

    #[must_use]
    pub(crate) const fn completed(self) -> bool {
        matches!(
            self.status,
            FunctionComponentLayoutEffectCallbackInvocationStatus::Completed
        )
    }

    #[must_use]
    pub(crate) const fn errored(self) -> bool {
        matches!(
            self.status,
            FunctionComponentLayoutEffectCallbackInvocationStatus::Errored
        )
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentLayoutEffectCallbackErrorCaptureRecord {
    pub(super) capture_order: usize,
    pub(super) request: FunctionComponentLayoutEffectCallbackInvocationRequest,
    pub(super) error: FunctionComponentLayoutEffectCallbackInvocationErrorHandle,
    pub(super) error_option_callbacks: RootErrorOptionCallbackRecord,
}

#[allow(
    dead_code,
    reason = "crate-private layout effect callback error capture metadata is reserved for private commit canaries"
)]
impl FunctionComponentLayoutEffectCallbackErrorCaptureRecord {
    #[must_use]
    pub(crate) const fn capture_order(self) -> usize {
        self.capture_order
    }

    #[must_use]
    pub(crate) const fn request(self) -> FunctionComponentLayoutEffectCallbackInvocationRequest {
        self.request
    }

    #[must_use]
    pub(crate) const fn handoff(self) -> FunctionComponentLayoutEffectHandoff {
        self.request.handoff()
    }

    #[must_use]
    pub(crate) const fn commit_phase(self) -> FunctionComponentLayoutEffectCommitPhase {
        self.request.commit_phase()
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.request.root()
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
        self.request.finished_work()
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.request.lanes()
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.request.fiber()
    }

    #[must_use]
    pub(crate) const fn hook_list(self) -> HookListId {
        self.request.hook_list()
    }

    #[must_use]
    pub(crate) const fn effect_index(self) -> usize {
        self.request.effect_index()
    }

    #[must_use]
    pub(crate) const fn effect(self) -> HookEffectId {
        self.request.effect()
    }

    #[must_use]
    pub(crate) const fn previous_effect(self) -> Option<HookEffectId> {
        self.request.previous_effect()
    }

    #[must_use]
    pub(crate) const fn instance(self) -> HookEffectInstanceId {
        self.request.instance()
    }

    #[must_use]
    pub(crate) const fn callback(self) -> HookEffectCallbackHandle {
        self.request.callback()
    }

    #[must_use]
    pub(crate) const fn error(self) -> FunctionComponentLayoutEffectCallbackInvocationErrorHandle {
        self.error
    }

    #[must_use]
    pub(crate) const fn error_option_callbacks(self) -> RootErrorOptionCallbackRecord {
        self.error_option_callbacks
    }

    #[must_use]
    pub(crate) const fn root_error_update_scheduled(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn scheduler_queue_touched(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn root_error_callbacks_invoked(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_act_error_aggregation_enabled(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_use_layout_effect_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_effect_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn error_metadata_fail_closed(self) -> bool {
        !self.root_error_update_scheduled()
            && !self.scheduler_queue_touched()
            && !self.root_error_callbacks_invoked()
            && !self.public_act_error_aggregation_enabled()
            && !self.public_effect_compatibility_claimed()
            && !self.public_use_layout_effect_compatibility_claimed()
    }

    #[must_use]
    pub(crate) const fn has_configured_error_callback(self) -> bool {
        self.error_option_callbacks.has_configured_error_callback()
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentLayoutEffectCallbackInvocationGateSnapshot {
    pub(super) root: Option<FiberRootId>,
    pub(super) finished_work: Option<FiberId>,
    pub(super) lanes: Lanes,
    pub(super) records: Vec<FunctionComponentLayoutEffectCallbackInvocationRecord>,
    pub(super) error_captures: Vec<FunctionComponentLayoutEffectCallbackErrorCaptureRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private layout effect callback execution gate snapshot is reserved for deterministic canaries"
)]
impl FunctionComponentLayoutEffectCallbackInvocationGateSnapshot {
    #[must_use]
    pub(crate) const fn root(&self) -> Option<FiberRootId> {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> Option<FiberId> {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[FunctionComponentLayoutEffectCallbackInvocationRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn error_captures(
        &self,
    ) -> &[FunctionComponentLayoutEffectCallbackErrorCaptureRecord] {
        &self.error_captures
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
    pub(crate) fn completed_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.completed())
            .count()
    }

    #[must_use]
    pub(crate) fn destroy_callback_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.is_destroy_callback())
            .count()
    }

    #[must_use]
    pub(crate) fn create_callback_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.is_create_callback())
            .count()
    }

    #[must_use]
    pub(crate) fn error_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.errored())
            .count()
    }

    #[must_use]
    pub(crate) fn errors(&self) -> Vec<FunctionComponentLayoutEffectCallbackInvocationErrorHandle> {
        self.records
            .iter()
            .filter_map(|record| record.error())
            .collect()
    }

    #[must_use]
    pub(crate) fn error_capture_count(&self) -> usize {
        self.error_captures.len()
    }

    #[must_use]
    pub(crate) fn did_record_error_capture_metadata(&self) -> bool {
        !self.error_captures.is_empty()
    }

    #[must_use]
    pub(crate) fn did_record_fail_closed_error_metadata(&self) -> bool {
        !self.error_captures.is_empty()
            && self
                .error_captures
                .iter()
                .all(|capture| capture.error_metadata_fail_closed())
            && !self.public_effect_compatibility_claimed()
            && !self.public_use_layout_effect_compatibility_claimed()
            && !self.public_act_compatibility_claimed()
            && !self.passive_phase_callbacks_invoked()
            && !self.root_error_callbacks_invoked()
            && !self.scheduler_queues_touched()
    }

    #[must_use]
    pub(crate) fn destroy_before_create_order_proven(&self) -> bool {
        let destroy = self
            .records
            .iter()
            .find(|record| record.is_destroy_callback());
        let create = self
            .records
            .iter()
            .find(|record| record.is_create_callback());
        match (destroy, create) {
            (Some(destroy), Some(create)) => {
                destroy.invocation_order() < create.invocation_order()
                    && destroy.request().source().source_commit_order()
                        == create.request().source().source_commit_order()
                    && destroy.commit_phase() == FunctionComponentLayoutEffectCommitPhase::Mutation
                    && create.commit_phase() == FunctionComponentLayoutEffectCommitPhase::Layout
                    && destroy.request().source().destroy() == Some(destroy.request().callback())
                    && create.request().source().create() == Some(create.request().callback())
            }
            _ => false,
        }
    }

    #[must_use]
    pub(crate) fn has_errors(&self) -> bool {
        self.error_count() > 0
    }

    #[must_use]
    pub(crate) const fn status(&self) -> FunctionComponentLayoutEffectCallbackInvocationGateStatus {
        FunctionComponentLayoutEffectCallbackInvocationGateStatus::TestControlOnly
    }

    #[must_use]
    pub(crate) const fn blockers(
        &self,
    ) -> &[FunctionComponentLayoutEffectCallbackInvocationGateBlocker; 3] {
        &FUNCTION_COMPONENT_LAYOUT_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS
    }

    #[must_use]
    pub(crate) fn did_invoke_test_layout_callback(&self) -> bool {
        !self.records.is_empty()
    }

    #[must_use]
    pub(crate) const fn public_use_layout_effect_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_effect_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_act_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn passive_phase_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn root_error_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn scheduler_queues_touched(&self) -> bool {
        false
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct FunctionComponentEffectListCommitPhaseOrderSnapshot {
    pub(super) root: Option<FiberRootId>,
    pub(super) finished_work: Option<FiberId>,
    pub(super) lanes: Lanes,
    pub(super) records: Vec<FunctionComponentEffectListCommitPhaseOrderRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private function-component effect-list commit phase order diagnostics"
)]
impl FunctionComponentEffectListCommitPhaseOrderSnapshot {
    #[must_use]
    pub(crate) const fn root(&self) -> Option<FiberRootId> {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> Option<FiberId> {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[FunctionComponentEffectListCommitPhaseOrderRecord] {
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
    pub(crate) fn before_mutation_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                record.phase() == FunctionComponentEffectListCommitPhase::BeforeMutation
            })
            .count()
    }

    #[must_use]
    pub(crate) fn layout_destroy_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                record.kind() == FunctionComponentEffectListCommitPhaseOrderKind::LayoutDestroy
            })
            .count()
    }

    #[must_use]
    pub(crate) fn layout_create_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                record.kind() == FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate
            })
            .count()
    }

    #[must_use]
    pub(crate) fn passive_unmount_schedule_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                record.kind()
                    == FunctionComponentEffectListCommitPhaseOrderKind::PassiveUnmountScheduled
            })
            .count()
    }

    #[must_use]
    pub(crate) fn passive_mount_schedule_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                record.kind()
                    == FunctionComponentEffectListCommitPhaseOrderKind::PassiveMountScheduled
            })
            .count()
    }

    #[must_use]
    pub(crate) fn records_in_commit_phase_order(&self) -> bool {
        self.records
            .iter()
            .enumerate()
            .all(|(sequence, record)| record.sequence() == sequence)
            && self.records.windows(2).all(|pair| {
                function_component_effect_list_commit_phase_order(pair[0].phase())
                    <= function_component_effect_list_commit_phase_order(pair[1].phase())
            })
    }

    #[must_use]
    pub(crate) const fn layout_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn passive_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_act_execution_enabled(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_effect_compatibility_claimed(&self) -> bool {
        false
    }

    fn push(&mut self, input: FunctionComponentEffectListCommitPhaseOrderRecordInput) {
        self.records
            .push(FunctionComponentEffectListCommitPhaseOrderRecord {
                sequence: self.records.len(),
                phase: input.phase,
                kind: input.kind,
                root: input.root,
                finished_work: input.finished_work,
                fiber: input.fiber,
                hook_list: input.hook_list,
                render_phase: input.render_phase,
                lanes: input.lanes,
                effect_index: input.effect_index,
                effect: input.effect,
                previous_effect: input.previous_effect,
                create: input.create,
                destroy: input.destroy,
                source_order: input.source_order,
            });
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct FunctionComponentEffectListCommitPhaseOrderRecordInput {
    phase: FunctionComponentEffectListCommitPhase,
    kind: FunctionComponentEffectListCommitPhaseOrderKind,
    root: FiberRootId,
    finished_work: FiberId,
    fiber: FiberId,
    hook_list: HookListId,
    render_phase: FunctionComponentHookRenderPhase,
    lanes: Lanes,
    effect_index: Option<usize>,
    effect: Option<HookEffectId>,
    previous_effect: Option<HookEffectId>,
    create: Option<HookEffectCallbackHandle>,
    destroy: Option<HookEffectCallbackHandle>,
    source_order: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentEffectListCommitPhaseOrderRecord {
    pub(super) sequence: usize,
    pub(super) phase: FunctionComponentEffectListCommitPhase,
    pub(super) kind: FunctionComponentEffectListCommitPhaseOrderKind,
    pub(super) root: FiberRootId,
    pub(super) finished_work: FiberId,
    pub(super) fiber: FiberId,
    pub(super) hook_list: HookListId,
    pub(super) render_phase: FunctionComponentHookRenderPhase,
    pub(super) lanes: Lanes,
    pub(super) effect_index: Option<usize>,
    pub(super) effect: Option<HookEffectId>,
    pub(super) previous_effect: Option<HookEffectId>,
    pub(super) create: Option<HookEffectCallbackHandle>,
    pub(super) destroy: Option<HookEffectCallbackHandle>,
    pub(super) source_order: u64,
}

#[allow(
    dead_code,
    reason = "crate-private function-component effect-list commit phase order diagnostics"
)]
impl FunctionComponentEffectListCommitPhaseOrderRecord {
    #[must_use]
    pub(crate) const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub(crate) const fn phase(self) -> FunctionComponentEffectListCommitPhase {
        self.phase
    }

    #[must_use]
    pub(crate) const fn phase_name(self) -> &'static str {
        function_component_effect_list_commit_phase_name(self.phase)
    }

    #[must_use]
    pub(crate) const fn kind(self) -> FunctionComponentEffectListCommitPhaseOrderKind {
        self.kind
    }

    #[must_use]
    pub(crate) const fn kind_name(self) -> &'static str {
        function_component_effect_list_commit_phase_order_kind_name(self.kind)
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub(crate) const fn render_phase(self) -> FunctionComponentHookRenderPhase {
        self.render_phase
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn effect_index(self) -> Option<usize> {
        self.effect_index
    }

    #[must_use]
    pub(crate) const fn effect(self) -> Option<HookEffectId> {
        self.effect
    }

    #[must_use]
    pub(crate) const fn previous_effect(self) -> Option<HookEffectId> {
        self.previous_effect
    }

    #[must_use]
    pub(crate) const fn create(self) -> Option<HookEffectCallbackHandle> {
        self.create
    }

    #[must_use]
    pub(crate) const fn destroy(self) -> Option<HookEffectCallbackHandle> {
        self.destroy
    }

    #[must_use]
    pub(crate) const fn source_order(self) -> u64 {
        self.source_order
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentEffectListCommitPhase {
    BeforeMutation,
    Mutation,
    Layout,
    PassiveScheduling,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentEffectListCommitPhaseOrderKind {
    EffectListBeforeMutation,
    LayoutDestroy,
    LayoutCreate,
    PassiveUnmountScheduled,
    PassiveMountScheduled,
}

impl HostRootCommitRecord {
    #[allow(
        dead_code,
        reason = "crate-private passive commit metadata for future passive-effect workers"
    )]
    #[must_use]
    pub(crate) const fn pending_passive_handoff(&self) -> Option<PendingPassiveCommitHandoff> {
        self.pending_passive_handoff
    }

    #[allow(
        dead_code,
        reason = "crate-private committed passive effect records for traversal canaries"
    )]
    #[must_use]
    pub(crate) const fn function_component_committed_passive_effects(
        &self,
    ) -> &FunctionComponentCommittedPassiveEffectsSnapshot {
        &self.function_component_committed_passive_effects
    }

    #[allow(
        dead_code,
        reason = "crate-private committed passive effect records for traversal canaries"
    )]
    pub(crate) fn record_function_component_committed_passive_effects_for_canary(
        &mut self,
        handoffs: &[FunctionComponentPendingPassiveCommitHandoff],
    ) -> Result<&FunctionComponentCommittedPassiveEffectsSnapshot, RootCommitError> {
        let Some(pending_passive_handoff) = self.pending_passive_handoff else {
            if handoffs.is_empty() {
                self.function_component_committed_passive_effects =
                    FunctionComponentCommittedPassiveEffectsSnapshot::default();
                return Ok(&self.function_component_committed_passive_effects);
            }

            return Err(
                RootCommitError::CommittedPassiveEffectsWithoutPendingPassiveHandoff {
                    root: self.root,
                },
            );
        };

        let mut fibers = Vec::with_capacity(handoffs.len());
        for handoff in handoffs {
            if handoff.root() != self.root {
                return Err(RootCommitError::CommittedPassiveEffectHandoffRootMismatch {
                    commit_root: self.root,
                    handoff_root: handoff.root(),
                });
            }
            if handoff.lanes() != pending_passive_handoff.lanes() {
                return Err(
                    RootCommitError::CommittedPassiveEffectHandoffLanesMismatch {
                        root: self.root,
                        expected: pending_passive_handoff.lanes(),
                        actual: handoff.lanes(),
                    },
                );
            }

            fibers.push(FunctionComponentCommittedPassiveEffectFiberRecord {
                fiber: handoff.fiber(),
                phase: handoff.phase(),
                lanes: handoff.lanes(),
                records: handoff.effect_phase_records(),
            });
        }

        self.function_component_committed_passive_effects =
            FunctionComponentCommittedPassiveEffectsSnapshot { fibers };

        Ok(&self.function_component_committed_passive_effects)
    }

    #[allow(
        dead_code,
        reason = "crate-private committed passive effect queue validation for traversal canaries"
    )]
    pub(crate) fn record_function_component_committed_passive_effects_from_committed_effect_queues_for_canary<
        H: HostTypes,
    >(
        &mut self,
        store: &FiberRootStore<H>,
        hook_store: &FunctionComponentHookRenderStore,
        handoffs: &[FunctionComponentPendingPassiveCommitHandoff],
    ) -> Result<&FunctionComponentCommittedPassiveEffectsSnapshot, RootCommitError> {
        validate_function_component_effect_list_passive_handoffs(
            store,
            self.root,
            self.current,
            self.finished_lanes,
            self.pending_passive_handoff,
            hook_store,
            handoffs,
        )?;

        self.record_function_component_committed_passive_effects_for_canary(handoffs)
    }

    #[allow(
        dead_code,
        reason = "crate-private deleted-subtree passive destroy metadata for deterministic deletion canaries"
    )]
    #[must_use]
    pub(crate) const fn function_component_deleted_subtree_passive_effects(
        &self,
    ) -> &FunctionComponentDeletedSubtreePassiveEffectsSnapshot {
        &self.function_component_deleted_subtree_passive_effects
    }

    #[allow(
        dead_code,
        reason = "crate-private deleted-subtree passive destroy metadata for deterministic deletion canaries"
    )]
    pub(crate) fn record_function_component_deleted_subtree_passive_effects_for_canary(
        &mut self,
        handoffs: &[FunctionComponentDeletedSubtreePendingPassiveCommitHandoff],
    ) -> Result<&FunctionComponentDeletedSubtreePassiveEffectsSnapshot, RootCommitError> {
        let Some(pending_passive_handoff) = self.pending_passive_handoff else {
            if handoffs.is_empty() {
                self.function_component_deleted_subtree_passive_effects =
                    FunctionComponentDeletedSubtreePassiveEffectsSnapshot::default();
                return Ok(&self.function_component_deleted_subtree_passive_effects);
            }

            return Err(
                RootCommitError::CommittedPassiveEffectsWithoutPendingPassiveHandoff {
                    root: self.root,
                },
            );
        };

        let mut records = Vec::new();
        for handoff in handoffs {
            if handoff.root() != self.root {
                return Err(RootCommitError::CommittedPassiveEffectHandoffRootMismatch {
                    commit_root: self.root,
                    handoff_root: handoff.root(),
                });
            }
            if handoff.lanes() != pending_passive_handoff.lanes() {
                return Err(
                    RootCommitError::CommittedPassiveEffectHandoffLanesMismatch {
                        root: self.root,
                        expected: pending_passive_handoff.lanes(),
                        actual: handoff.lanes(),
                    },
                );
            }

            records.extend_from_slice(handoff.records());
        }
        records.sort_by_key(|record| record.unmount_order());

        self.function_component_deleted_subtree_passive_effects =
            FunctionComponentDeletedSubtreePassiveEffectsSnapshot { records };

        Ok(&self.function_component_deleted_subtree_passive_effects)
    }
}

impl HostRootCommitRecord {
    #[allow(
        dead_code,
        reason = "crate-private layout hook-effect handoff metadata for deterministic canaries"
    )]
    #[must_use]
    pub(crate) const fn function_component_layout_effects(
        &self,
    ) -> &FunctionComponentLayoutEffectsSnapshot {
        &self.function_component_layout_effects
    }

    #[allow(
        dead_code,
        reason = "crate-private layout hook-effect handoff metadata for deterministic canaries"
    )]
    pub(crate) fn record_function_component_layout_effects_for_canary<H: HostTypes>(
        &mut self,
        store: &FiberRootStore<H>,
        hook_store: &mut FunctionComponentHookRenderStore,
    ) -> Result<&FunctionComponentLayoutEffectsSnapshot, RootCommitError> {
        let store_current = store.root(self.root)?.current();
        if store_current != self.current {
            return Err(RootCommitError::LayoutEffectHandoffCurrentMismatch {
                root: self.root,
                commit_current: self.current,
                store_current,
            });
        }

        self.function_component_layout_effects =
            record_function_component_layout_effects_for_committed_root(
                store,
                self.root,
                hook_store,
                self.finished_lanes,
            )?;

        Ok(&self.function_component_layout_effects)
    }

    #[allow(
        dead_code,
        reason = "crate-private layout effect callback execution gate is reserved for deterministic canaries"
    )]
    #[must_use]
    pub(crate) const fn function_component_layout_effect_callback_invocation_gate(
        &self,
    ) -> &FunctionComponentLayoutEffectCallbackInvocationGateSnapshot {
        &self.function_component_layout_effect_callback_invocation_gate
    }

    #[allow(
        dead_code,
        reason = "crate-private layout effect callback execution gate is reserved for deterministic canaries"
    )]
    pub(crate) fn execute_function_component_layout_effect_record_under_test_control_for_canary<
        H: HostTypes,
    >(
        &mut self,
        store: &FiberRootStore<H>,
        hook_store: &FunctionComponentHookRenderStore,
        record: FunctionComponentEffectListCommitPhaseOrderRecord,
        control: &mut impl FunctionComponentLayoutEffectCallbackInvocationTestControl,
    ) -> Result<&FunctionComponentLayoutEffectCallbackInvocationGateSnapshot, RootCommitError> {
        let store_current = store.root(self.root)?.current();
        if store_current != self.current {
            return Err(RootCommitError::LayoutEffectHandoffCurrentMismatch {
                root: self.root,
                commit_current: self.current,
                store_current,
            });
        }

        self.function_component_layout_effect_callback_invocation_gate =
            execute_function_component_layout_effect_callback_record_under_test_control(
                store,
                self.root,
                self.current,
                self.finished_lanes,
                hook_store,
                &self.function_component_layout_effects,
                &self.function_component_effect_list_commit_phase_order,
                record,
                control,
            )?;

        Ok(&self.function_component_layout_effect_callback_invocation_gate)
    }

    #[allow(
        dead_code,
        reason = "crate-private layout effect destroy/create execution gate is reserved for deterministic canaries"
    )]
    pub(crate) fn execute_function_component_layout_effect_update_destroy_create_under_test_control_for_canary<
        H: HostTypes,
    >(
        &mut self,
        store: &FiberRootStore<H>,
        hook_store: &FunctionComponentHookRenderStore,
        record: FunctionComponentEffectListCommitPhaseOrderRecord,
        control: &mut impl FunctionComponentLayoutEffectCallbackInvocationTestControl,
    ) -> Result<&FunctionComponentLayoutEffectCallbackInvocationGateSnapshot, RootCommitError> {
        let store_current = store.root(self.root)?.current();
        if store_current != self.current {
            return Err(RootCommitError::LayoutEffectHandoffCurrentMismatch {
                root: self.root,
                commit_current: self.current,
                store_current,
            });
        }

        self.function_component_layout_effect_callback_invocation_gate =
            execute_function_component_layout_effect_update_destroy_create_record_under_test_control(
                store,
                self.root,
                self.current,
                self.finished_lanes,
                hook_store,
                &self.function_component_layout_effects,
                &self.function_component_effect_list_commit_phase_order,
                record,
                control,
            )?;

        Ok(&self.function_component_layout_effect_callback_invocation_gate)
    }

    #[allow(
        dead_code,
        reason = "crate-private function-component effect-list commit phase order diagnostics"
    )]
    #[must_use]
    pub(crate) const fn function_component_effect_list_commit_phase_order(
        &self,
    ) -> &FunctionComponentEffectListCommitPhaseOrderSnapshot {
        &self.function_component_effect_list_commit_phase_order
    }

    #[allow(
        dead_code,
        reason = "crate-private function-component effect-list commit phase order diagnostics"
    )]
    pub(crate) fn record_function_component_effect_list_commit_phase_order_for_canary<
        H: HostTypes,
    >(
        &mut self,
        store: &FiberRootStore<H>,
        hook_store: &mut FunctionComponentHookRenderStore,
        passive_handoffs: &[FunctionComponentPendingPassiveCommitHandoff],
    ) -> Result<&FunctionComponentEffectListCommitPhaseOrderSnapshot, RootCommitError> {
        let store_current = store.root(self.root)?.current();
        if store_current != self.current {
            return Err(RootCommitError::LayoutEffectHandoffCurrentMismatch {
                root: self.root,
                commit_current: self.current,
                store_current,
            });
        }

        let layout_snapshot = self
            .record_function_component_layout_effects_for_canary(store, hook_store)?
            .clone();
        let passive_phase_records = validate_function_component_effect_list_passive_handoffs(
            store,
            self.root,
            self.current,
            self.finished_lanes,
            self.pending_passive_handoff,
            hook_store,
            passive_handoffs,
        )?;
        let passive_snapshot = self
            .record_function_component_committed_passive_effects_for_canary(passive_handoffs)?
            .clone();

        self.function_component_effect_list_commit_phase_order =
            build_function_component_effect_list_commit_phase_order_snapshot(
                store,
                self.root,
                self.current,
                self.finished_lanes,
                hook_store,
                &layout_snapshot,
                &passive_snapshot,
                &passive_phase_records,
            )?;

        Ok(&self.function_component_effect_list_commit_phase_order)
    }
}

#[allow(
    dead_code,
    reason = "crate-private committed hook-effect ownership helper for future passive traversal"
)]
pub(crate) fn commit_function_component_effect_queues_for_committed_root<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    hook_store: &mut FunctionComponentHookRenderStore,
    lanes: Lanes,
) -> Result<Vec<FunctionComponentCommittedEffectQueue>, RootCommitError> {
    let current = store.root(root)?.current();
    let mut queues = Vec::new();
    commit_function_component_effect_queues_for_committed_subtree(
        store.fiber_arena(),
        current,
        hook_store,
        lanes,
        &mut queues,
    )?;
    Ok(queues)
}

fn commit_function_component_effect_queues_for_committed_subtree(
    arena: &FiberArena,
    fiber: FiberId,
    hook_store: &mut FunctionComponentHookRenderStore,
    lanes: Lanes,
    queues: &mut Vec<FunctionComponentCommittedEffectQueue>,
) -> Result<(), RootCommitError> {
    let node = arena.get(fiber)?;
    if node.tag() == FiberTag::FunctionComponent
        && let Some(queue) = hook_store
            .commit_pending_effect_queue_for_fiber(fiber, lanes)
            .map_err(
                |error| RootCommitError::FunctionComponentCommittedEffectQueue {
                    fiber,
                    message: error.to_string(),
                },
            )?
    {
        queues.push(queue);
    }

    if let Some(child) = node.child() {
        commit_function_component_effect_queues_for_committed_subtree(
            arena, child, hook_store, lanes, queues,
        )?;
    }
    if let Some(sibling) = node.sibling() {
        commit_function_component_effect_queues_for_committed_subtree(
            arena, sibling, hook_store, lanes, queues,
        )?;
    }

    Ok(())
}

#[allow(
    dead_code,
    reason = "crate-private layout hook-effect handoff helper exercised by deterministic canaries"
)]
pub(crate) fn record_function_component_layout_effects_for_committed_root<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    hook_store: &mut FunctionComponentHookRenderStore,
    lanes: Lanes,
) -> Result<FunctionComponentLayoutEffectsSnapshot, RootCommitError> {
    let current = store.root(root)?.current();
    let mut records = Vec::new();
    record_function_component_layout_effects_for_committed_subtree(
        store.fiber_arena(),
        root,
        current,
        hook_store,
        lanes,
        &mut records,
    )?;
    Ok(FunctionComponentLayoutEffectsSnapshot { records })
}

fn record_function_component_layout_effects_for_committed_subtree(
    arena: &FiberArena,
    root: FiberRootId,
    fiber: FiberId,
    hook_store: &mut FunctionComponentHookRenderStore,
    lanes: Lanes,
    records: &mut Vec<FunctionComponentLayoutEffectCommitRecord>,
) -> Result<(), RootCommitError> {
    let node = arena.get(fiber)?;
    let tag = node.tag();
    let flags = node.flags();
    let child = node.child();
    let sibling = node.sibling();

    if let Some(child) = child {
        record_function_component_layout_effects_for_committed_subtree(
            arena, root, child, hook_store, lanes, records,
        )?;
    }

    if tag == FiberTag::FunctionComponent && flags.contains_any(FiberFlags::UPDATE) {
        hook_store
            .commit_pending_effect_queue_for_fiber(fiber, lanes)
            .map_err(
                |error| RootCommitError::FunctionComponentLayoutEffectQueue {
                    fiber,
                    message: error.to_string(),
                },
            )?;

        if let Some(queue) = hook_store.committed_effect_queue(fiber) {
            validate_layout_effect_queue_lanes(root, queue, fiber, lanes)?;

            for metadata in queue.layout_effect_metadata(HookEffectFlags::LAYOUT_EFFECT) {
                validate_layout_effect_metadata_for_committed_queue(root, queue, metadata)?;
                let destroy_order = match metadata.dependency_phase() {
                    FunctionComponentEffectDependencyPhase::UpdateChanged => {
                        Some(layout_destroy_handoff_count(records))
                    }
                    FunctionComponentEffectDependencyPhase::Mount => None,
                    FunctionComponentEffectDependencyPhase::UpdateUnchanged => {
                        return Err(RootCommitError::LayoutEffectHandoffRecordMismatch {
                            root,
                            fiber,
                            effect: metadata.effect(),
                            message:
                                "unchanged layout effect was selected for create/destroy handoff"
                                    .to_owned(),
                        });
                    }
                };
                records.push(function_component_layout_effect_commit_record(
                    records.len(),
                    destroy_order,
                    metadata,
                ));
            }
        }
    }

    if let Some(sibling) = sibling {
        record_function_component_layout_effects_for_committed_subtree(
            arena, root, sibling, hook_store, lanes, records,
        )?;
    }

    Ok(())
}

fn validate_layout_effect_queue_lanes(
    root: FiberRootId,
    queue: &FunctionComponentCommittedEffectQueue,
    fiber: FiberId,
    lanes: Lanes,
) -> Result<(), RootCommitError> {
    if queue.fiber() != fiber {
        return Err(RootCommitError::LayoutEffectHandoffFiberMismatch {
            root,
            expected: fiber,
            actual: queue.fiber(),
        });
    }
    if queue.lanes() != lanes {
        return Err(RootCommitError::LayoutEffectHandoffLanesMismatch {
            root,
            fiber,
            expected: lanes,
            actual: queue.lanes(),
        });
    }
    Ok(())
}

fn validate_layout_effect_metadata_for_committed_queue(
    root: FiberRootId,
    queue: &FunctionComponentCommittedEffectQueue,
    metadata: FunctionComponentLayoutEffectMetadata,
) -> Result<(), RootCommitError> {
    if metadata.fiber() != queue.fiber() {
        return Err(layout_effect_record_mismatch(
            root,
            queue.fiber(),
            metadata.effect(),
            "metadata fiber does not match committed queue owner",
        ));
    }
    if metadata.render_phase() != queue.phase() {
        return Err(layout_effect_record_mismatch(
            root,
            queue.fiber(),
            metadata.effect(),
            "metadata render phase does not match committed queue phase",
        ));
    }
    if metadata.lanes() != queue.lanes() {
        return Err(RootCommitError::LayoutEffectHandoffLanesMismatch {
            root,
            fiber: queue.fiber(),
            expected: queue.lanes(),
            actual: metadata.lanes(),
        });
    }
    if !metadata.tag().fires_in_layout() {
        return Err(layout_effect_record_mismatch(
            root,
            queue.fiber(),
            metadata.effect(),
            "metadata tag is not eligible for layout create handoff",
        ));
    }

    let Some(record) = queue
        .records()
        .iter()
        .find(|record| record.effect() == metadata.effect())
    else {
        return Err(layout_effect_record_mismatch(
            root,
            queue.fiber(),
            metadata.effect(),
            "metadata effect is missing from committed queue",
        ));
    };

    if record.instance() != metadata.instance()
        || record.tag() != metadata.tag()
        || record.create() != metadata.create()
        || record.destroy() != metadata.destroy()
        || record.previous_effect() != metadata.previous_effect()
        || record.previous_dependencies() != metadata.previous_dependencies()
        || record.dependencies() != metadata.dependencies()
        || record.dependency_status() != metadata.dependency_status()
    {
        return Err(layout_effect_record_mismatch(
            root,
            queue.fiber(),
            metadata.effect(),
            "metadata fields do not match committed queue record",
        ));
    }

    Ok(())
}

fn layout_effect_record_mismatch(
    root: FiberRootId,
    fiber: FiberId,
    effect: HookEffectId,
    message: &'static str,
) -> RootCommitError {
    RootCommitError::LayoutEffectHandoffRecordMismatch {
        root,
        fiber,
        effect,
        message: message.to_owned(),
    }
}

fn layout_destroy_handoff_count(records: &[FunctionComponentLayoutEffectCommitRecord]) -> usize {
    records
        .iter()
        .filter(|record| record.destroy_order().is_some())
        .count()
}

const fn function_component_layout_effect_commit_record(
    commit_order: usize,
    destroy_order: Option<usize>,
    metadata: FunctionComponentLayoutEffectMetadata,
) -> FunctionComponentLayoutEffectCommitRecord {
    FunctionComponentLayoutEffectCommitRecord {
        commit_order,
        destroy_order,
        create_order: commit_order,
        fiber: metadata.fiber(),
        render_phase: metadata.render_phase(),
        dependency_phase: metadata.dependency_phase(),
        hook_list: metadata.hook_list(),
        effect_index: metadata.effect_index(),
        effect: metadata.effect(),
        previous_effect: metadata.previous_effect(),
        instance: metadata.instance(),
        tag: metadata.tag(),
        create: metadata.create(),
        destroy: metadata.destroy(),
        previous_dependencies: metadata.previous_dependencies(),
        dependencies: metadata.dependencies(),
        dependency_status: metadata.dependency_status(),
        lanes: metadata.lanes(),
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct FunctionComponentLayoutEffectCallbackExecutionPlan {
    destroy_record: FunctionComponentLayoutEffectPhaseCommitRecord,
    create_record: FunctionComponentLayoutEffectPhaseCommitRecord,
    destroy_effect_list_record: FunctionComponentEffectListCommitPhaseOrderRecord,
    create_effect_list_record: FunctionComponentEffectListCommitPhaseOrderRecord,
    first_passive_sequence: Option<usize>,
}

#[allow(
    clippy::too_many_arguments,
    reason = "private layout-effect canary control helper mirrors the evidence record shape"
)]
fn execute_function_component_layout_effect_callback_record_under_test_control<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
    hook_store: &FunctionComponentHookRenderStore,
    layout_snapshot: &FunctionComponentLayoutEffectsSnapshot,
    effect_list_snapshot: &FunctionComponentEffectListCommitPhaseOrderSnapshot,
    record: FunctionComponentEffectListCommitPhaseOrderRecord,
    control: &mut impl FunctionComponentLayoutEffectCallbackInvocationTestControl,
) -> Result<FunctionComponentLayoutEffectCallbackInvocationGateSnapshot, RootCommitError> {
    let plan = validate_layout_effect_callback_execution_record(
        store,
        root,
        finished_work,
        lanes,
        hook_store,
        layout_snapshot,
        effect_list_snapshot,
        record,
    )?;
    let error_option_callbacks = store
        .root(root)?
        .options()
        .error_option_callback_record(root, RootErrorOptionCallbackPhase::Commit);
    let create_callback = plan.create_record.create().ok_or_else(|| {
        RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
            root,
            fiber: plan.create_record.fiber(),
            effect: Some(plan.create_record.effect()),
            message: "layout create phase record does not carry a create callback".to_owned(),
        }
    })?;
    let request = FunctionComponentLayoutEffectCallbackInvocationRequest {
        invocation_order: 0,
        root,
        finished_work,
        lanes,
        source: plan.create_record,
        effect_list_sequence: plan.create_effect_list_record.sequence(),
        matched_mutation_sequence: plan.destroy_effect_list_record.sequence(),
        first_passive_sequence: plan.first_passive_sequence,
        callback: create_callback,
    };
    let (status, error) = match control.invoke_layout_effect_create(request) {
        Ok(()) => (
            FunctionComponentLayoutEffectCallbackInvocationStatus::Completed,
            None,
        ),
        Err(error) => (
            FunctionComponentLayoutEffectCallbackInvocationStatus::Errored,
            Some(error),
        ),
    };
    let records = vec![FunctionComponentLayoutEffectCallbackInvocationRecord {
        request,
        status,
        error,
    }];
    let error_captures = layout_effect_callback_error_captures(&records, error_option_callbacks);

    Ok(
        FunctionComponentLayoutEffectCallbackInvocationGateSnapshot {
            root: Some(root),
            finished_work: Some(finished_work),
            lanes,
            records,
            error_captures,
        },
    )
}

#[allow(
    clippy::too_many_arguments,
    reason = "private layout-effect update canary control helper mirrors the evidence record shape"
)]
fn execute_function_component_layout_effect_update_destroy_create_record_under_test_control<
    H: HostTypes,
>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
    hook_store: &FunctionComponentHookRenderStore,
    layout_snapshot: &FunctionComponentLayoutEffectsSnapshot,
    effect_list_snapshot: &FunctionComponentEffectListCommitPhaseOrderSnapshot,
    record: FunctionComponentEffectListCommitPhaseOrderRecord,
    control: &mut impl FunctionComponentLayoutEffectCallbackInvocationTestControl,
) -> Result<FunctionComponentLayoutEffectCallbackInvocationGateSnapshot, RootCommitError> {
    let plan = validate_layout_effect_callback_execution_record(
        store,
        root,
        finished_work,
        lanes,
        hook_store,
        layout_snapshot,
        effect_list_snapshot,
        record,
    )?;
    let error_option_callbacks = store
        .root(root)?
        .options()
        .error_option_callback_record(root, RootErrorOptionCallbackPhase::Commit);
    let destroy_callback = plan.destroy_record.destroy().ok_or_else(|| {
        RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
            root,
            fiber: plan.destroy_record.fiber(),
            effect: Some(plan.destroy_record.effect()),
            message: "layout destroy phase record does not carry a destroy callback".to_owned(),
        }
    })?;
    let create_callback = plan.create_record.create().ok_or_else(|| {
        RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
            root,
            fiber: plan.create_record.fiber(),
            effect: Some(plan.create_record.effect()),
            message: "layout create phase record does not carry a create callback".to_owned(),
        }
    })?;
    let destroy_request = FunctionComponentLayoutEffectCallbackInvocationRequest {
        invocation_order: 0,
        root,
        finished_work,
        lanes,
        source: plan.destroy_record,
        effect_list_sequence: plan.destroy_effect_list_record.sequence(),
        matched_mutation_sequence: plan.destroy_effect_list_record.sequence(),
        first_passive_sequence: plan.first_passive_sequence,
        callback: destroy_callback,
    };
    let create_request = FunctionComponentLayoutEffectCallbackInvocationRequest {
        invocation_order: 1,
        root,
        finished_work,
        lanes,
        source: plan.create_record,
        effect_list_sequence: plan.create_effect_list_record.sequence(),
        matched_mutation_sequence: plan.destroy_effect_list_record.sequence(),
        first_passive_sequence: plan.first_passive_sequence,
        callback: create_callback,
    };

    let destroy_invocation = match control.invoke_layout_effect_destroy(destroy_request) {
        Ok(()) => FunctionComponentLayoutEffectCallbackInvocationRecord {
            request: destroy_request,
            status: FunctionComponentLayoutEffectCallbackInvocationStatus::Completed,
            error: None,
        },
        Err(error) => FunctionComponentLayoutEffectCallbackInvocationRecord {
            request: destroy_request,
            status: FunctionComponentLayoutEffectCallbackInvocationStatus::Errored,
            error: Some(error),
        },
    };
    let create_invocation = match control.invoke_layout_effect_create(create_request) {
        Ok(()) => (
            FunctionComponentLayoutEffectCallbackInvocationStatus::Completed,
            None,
        ),
        Err(error) => (
            FunctionComponentLayoutEffectCallbackInvocationStatus::Errored,
            Some(error),
        ),
    };
    let create_invocation = FunctionComponentLayoutEffectCallbackInvocationRecord {
        request: create_request,
        status: create_invocation.0,
        error: create_invocation.1,
    };
    let records = vec![destroy_invocation, create_invocation];
    let error_captures = layout_effect_callback_error_captures(&records, error_option_callbacks);

    Ok(
        FunctionComponentLayoutEffectCallbackInvocationGateSnapshot {
            root: Some(root),
            finished_work: Some(finished_work),
            lanes,
            records,
            error_captures,
        },
    )
}

fn layout_effect_callback_error_captures(
    records: &[FunctionComponentLayoutEffectCallbackInvocationRecord],
    error_option_callbacks: RootErrorOptionCallbackRecord,
) -> Vec<FunctionComponentLayoutEffectCallbackErrorCaptureRecord> {
    let mut captures = Vec::new();
    for record in records {
        let Some(error) = record.error() else {
            continue;
        };
        captures.push(FunctionComponentLayoutEffectCallbackErrorCaptureRecord {
            capture_order: captures.len(),
            request: record.request(),
            error,
            error_option_callbacks,
        });
    }
    captures
}

#[allow(
    clippy::too_many_arguments,
    reason = "private layout-effect validator checks each evidence source explicitly"
)]
fn validate_layout_effect_callback_execution_record<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
    hook_store: &FunctionComponentHookRenderStore,
    layout_snapshot: &FunctionComponentLayoutEffectsSnapshot,
    effect_list_snapshot: &FunctionComponentEffectListCommitPhaseOrderSnapshot,
    record: FunctionComponentEffectListCommitPhaseOrderRecord,
) -> Result<FunctionComponentLayoutEffectCallbackExecutionPlan, RootCommitError> {
    validate_layout_effect_callback_record_phase(root, record)?;
    let tag = store.fiber_arena().get(record.fiber())?.tag();
    if tag != FiberTag::FunctionComponent {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionUnsupportedFiberTag {
                root,
                fiber: record.fiber(),
                tag,
                unsupported_feature: unsupported_reconciler_feature_for_fiber_tag(tag)
                    .map(|feature| feature.feature()),
            },
        );
    }
    validate_layout_effect_callback_effect_list_snapshot(
        root,
        finished_work,
        lanes,
        effect_list_snapshot,
        record,
    )?;

    let first_passive_sequence = effect_list_snapshot
        .records()
        .iter()
        .find(|accepted| {
            accepted.phase() == FunctionComponentEffectListCommitPhase::PassiveScheduling
        })
        .map(|accepted| accepted.sequence());
    if matches!(first_passive_sequence, Some(sequence) if sequence <= record.sequence()) {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionPassiveRecordRejected {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
            },
        );
    }

    let destroy_effect_list_record =
        matching_layout_effect_mutation_record(effect_list_snapshot, record).ok_or_else(|| {
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
                message: "layout create callback record has no accepted mutation destroy metadata"
                    .to_owned(),
            }
        })?;
    if destroy_effect_list_record.sequence() >= record.sequence() {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
                message: "layout create callback is not after matching mutation metadata"
                    .to_owned(),
            },
        );
    }

    let create_record = matching_layout_effect_create_phase_record(layout_snapshot, record)
        .ok_or_else(
            || RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
                message: "layout callback record is missing from accepted layout metadata"
                    .to_owned(),
            },
        )?;
    let destroy_record =
        matching_layout_effect_destroy_phase_record(layout_snapshot, destroy_effect_list_record)
            .ok_or_else(
                || RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                    root,
                    fiber: destroy_effect_list_record.fiber(),
                    effect: destroy_effect_list_record.effect(),
                    message:
                        "layout destroy callback record is missing from accepted layout metadata"
                            .to_owned(),
                },
            )?;
    validate_layout_effect_destroy_create_pair(root, destroy_record, create_record)?;
    validate_layout_effect_callback_committed_effect_ring(
        root,
        hook_store,
        record,
        create_record,
        destroy_record,
    )?;

    Ok(FunctionComponentLayoutEffectCallbackExecutionPlan {
        destroy_record,
        create_record,
        destroy_effect_list_record,
        create_effect_list_record: record,
        first_passive_sequence,
    })
}

fn validate_layout_effect_callback_record_phase(
    root: FiberRootId,
    record: FunctionComponentEffectListCommitPhaseOrderRecord,
) -> Result<(), RootCommitError> {
    if record.phase() == FunctionComponentEffectListCommitPhase::PassiveScheduling {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionPassiveRecordRejected {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
            },
        );
    }
    if record.phase() != FunctionComponentEffectListCommitPhase::Layout
        || record.kind() != FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate
        || record.create().is_none()
    {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
                message: "layout callback execution requires a layout-create effect-list record"
                    .to_owned(),
            },
        );
    }

    Ok(())
}

fn validate_layout_effect_callback_effect_list_snapshot(
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
    snapshot: &FunctionComponentEffectListCommitPhaseOrderSnapshot,
    record: FunctionComponentEffectListCommitPhaseOrderRecord,
) -> Result<(), RootCommitError> {
    if snapshot.root() != Some(root) {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
                message: "effect-list snapshot root does not match commit root".to_owned(),
            },
        );
    }
    if snapshot.finished_work() != Some(finished_work) {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
                message: "effect-list snapshot finished work does not match commit current"
                    .to_owned(),
            },
        );
    }
    if snapshot.lanes() != lanes {
        return Err(RootCommitError::LayoutEffectHandoffLanesMismatch {
            root,
            fiber: record.fiber(),
            expected: lanes,
            actual: snapshot.lanes(),
        });
    }

    let Some(accepted) = snapshot
        .records()
        .iter()
        .find(|accepted| accepted.sequence() == record.sequence())
    else {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
                message: "layout callback record is missing from effect-list snapshot".to_owned(),
            },
        );
    };
    if *accepted != record {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: record.effect(),
                message: "layout callback record does not match effect-list snapshot sequence"
                    .to_owned(),
            },
        );
    }

    Ok(())
}

fn matching_layout_effect_mutation_record(
    snapshot: &FunctionComponentEffectListCommitPhaseOrderSnapshot,
    record: FunctionComponentEffectListCommitPhaseOrderRecord,
) -> Option<FunctionComponentEffectListCommitPhaseOrderRecord> {
    snapshot.records().iter().copied().find(|accepted| {
        accepted.phase() == FunctionComponentEffectListCommitPhase::Mutation
            && accepted.kind() == FunctionComponentEffectListCommitPhaseOrderKind::LayoutDestroy
            && accepted.fiber() == record.fiber()
            && accepted.hook_list() == record.hook_list()
            && accepted.lanes() == record.lanes()
            && accepted.effect() == record.previous_effect()
            && accepted.previous_effect() == record.previous_effect()
            && accepted.destroy().is_some()
            && accepted.sequence() < record.sequence()
    })
}

fn matching_layout_effect_create_phase_record(
    snapshot: &FunctionComponentLayoutEffectsSnapshot,
    record: FunctionComponentEffectListCommitPhaseOrderRecord,
) -> Option<FunctionComponentLayoutEffectPhaseCommitRecord> {
    snapshot
        .create_phase_records()
        .into_iter()
        .find(|accepted| {
            accepted.fiber() == record.fiber()
                && accepted.hook_list() == record.hook_list()
                && accepted.render_phase() == record.render_phase()
                && accepted.lanes() == record.lanes()
                && Some(accepted.effect_index()) == record.effect_index()
                && Some(accepted.effect()) == record.effect()
                && accepted.previous_effect() == record.previous_effect()
                && accepted.create() == record.create()
                && accepted.destroy() == record.destroy()
        })
}

fn matching_layout_effect_destroy_phase_record(
    snapshot: &FunctionComponentLayoutEffectsSnapshot,
    record: FunctionComponentEffectListCommitPhaseOrderRecord,
) -> Option<FunctionComponentLayoutEffectPhaseCommitRecord> {
    snapshot
        .destroy_phase_records()
        .into_iter()
        .find(|accepted| {
            accepted.fiber() == record.fiber()
                && accepted.hook_list() == record.hook_list()
                && accepted.render_phase() == record.render_phase()
                && accepted.lanes() == record.lanes()
                && Some(accepted.effect_index()) == record.effect_index()
                && Some(accepted.effect()) == record.effect()
                && accepted.previous_effect() == record.previous_effect()
                && accepted.create() == record.create()
                && accepted.destroy() == record.destroy()
        })
}

fn validate_layout_effect_destroy_create_pair(
    root: FiberRootId,
    destroy_record: FunctionComponentLayoutEffectPhaseCommitRecord,
    create_record: FunctionComponentLayoutEffectPhaseCommitRecord,
) -> Result<(), RootCommitError> {
    if destroy_record.handoff() != FunctionComponentLayoutEffectHandoff::Destroy
        || destroy_record.commit_phase() != FunctionComponentLayoutEffectCommitPhase::Mutation
        || destroy_record.destroy().is_none()
        || destroy_record.create().is_some()
    {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: destroy_record.fiber(),
                effect: Some(destroy_record.effect()),
                message: "layout destroy callback execution requires mutation destroy metadata"
                    .to_owned(),
            },
        );
    }

    if create_record.handoff() != FunctionComponentLayoutEffectHandoff::Create
        || create_record.commit_phase() != FunctionComponentLayoutEffectCommitPhase::Layout
        || create_record.create().is_none()
        || create_record.destroy().is_some()
    {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: create_record.fiber(),
                effect: Some(create_record.effect()),
                message: "layout create callback execution requires layout create metadata"
                    .to_owned(),
            },
        );
    }

    let Some(previous_effect) = create_record.previous_effect() else {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: create_record.fiber(),
                effect: Some(create_record.effect()),
                message: "layout destroy/create execution gate only accepts update effects"
                    .to_owned(),
            },
        );
    };

    if destroy_record.source_commit_order() != create_record.source_commit_order()
        || destroy_record.fiber() != create_record.fiber()
        || destroy_record.hook_list() != create_record.hook_list()
        || destroy_record.render_phase() != create_record.render_phase()
        || destroy_record.effect_index() != create_record.effect_index()
        || destroy_record.effect() != previous_effect
        || destroy_record.previous_effect() != create_record.previous_effect()
        || destroy_record.instance() != create_record.instance()
        || destroy_record.tag() != create_record.tag()
        || destroy_record.previous_dependencies() != create_record.previous_dependencies()
        || destroy_record.dependencies() != create_record.dependencies()
        || destroy_record.dependency_status() != create_record.dependency_status()
        || destroy_record.lanes() != create_record.lanes()
    {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: create_record.fiber(),
                effect: Some(create_record.effect()),
                message:
                    "layout destroy/create phase records do not describe the same update effect"
                        .to_owned(),
            },
        );
    }

    Ok(())
}

fn validate_layout_effect_callback_committed_effect_ring(
    root: FiberRootId,
    hook_store: &FunctionComponentHookRenderStore,
    record: FunctionComponentEffectListCommitPhaseOrderRecord,
    create_record: FunctionComponentLayoutEffectPhaseCommitRecord,
    destroy_record: FunctionComponentLayoutEffectPhaseCommitRecord,
) -> Result<(), RootCommitError> {
    let current_list = hook_store.current_list(record.fiber());
    if current_list != Some(record.hook_list()) {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionStaleEffectRing {
                root,
                fiber: record.fiber(),
                hook_list: record.hook_list(),
                current_list,
            },
        );
    }

    let Some(queue) = hook_store.committed_effect_queue(record.fiber()) else {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionStaleEffectRing {
                root,
                fiber: record.fiber(),
                hook_list: record.hook_list(),
                current_list,
            },
        );
    };
    if queue.hook_list() != record.hook_list()
        || queue.phase() != record.render_phase()
        || queue.lanes() != record.lanes()
    {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionStaleEffectRing {
                root,
                fiber: record.fiber(),
                hook_list: record.hook_list(),
                current_list,
            },
        );
    }

    let Some(effect) = record.effect() else {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: None,
                message: "layout callback record does not carry an effect id".to_owned(),
            },
        );
    };
    let Some(committed_record) = queue
        .records()
        .iter()
        .find(|committed| committed.effect() == effect)
    else {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionStaleEffectRing {
                root,
                fiber: record.fiber(),
                hook_list: record.hook_list(),
                current_list,
            },
        );
    };

    if !committed_record.accepted_for_layout_commit()
        || committed_record.previous_effect() != create_record.previous_effect()
        || committed_record.previous_effect() != Some(destroy_record.effect())
        || committed_record.instance() != create_record.instance()
        || committed_record.create() != create_record.create().expect("layout create checked")
        || committed_record.destroy() != destroy_record.destroy()
        || committed_record.previous_dependencies() != create_record.previous_dependencies()
        || committed_record.dependencies() != create_record.dependencies()
        || committed_record.dependency_status() != create_record.dependency_status()
    {
        return Err(
            RootCommitError::LayoutEffectCallbackExecutionRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: Some(effect),
                message: "layout callback record fields do not match committed effect ring"
                    .to_owned(),
            },
        );
    }

    Ok(())
}

fn validate_function_component_effect_list_passive_handoffs<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
    pending_handoff: Option<PendingPassiveCommitHandoff>,
    hook_store: &FunctionComponentHookRenderStore,
    passive_handoffs: &[FunctionComponentPendingPassiveCommitHandoff],
) -> Result<Vec<FunctionComponentPendingPassiveEffectPhaseCommitRecord>, RootCommitError> {
    let Some(pending_handoff) = pending_handoff else {
        if passive_handoffs.is_empty() {
            return Ok(Vec::new());
        }

        return Err(RootCommitError::CommittedPassiveEffectsWithoutPendingPassiveHandoff { root });
    };

    if pending_handoff.root() != root {
        return Err(RootCommitError::CommittedPassiveEffectHandoffRootMismatch {
            commit_root: root,
            handoff_root: pending_handoff.root(),
        });
    }
    if pending_handoff.finished_work() != finished_work {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffFinishedWorkMismatch {
                root,
                expected: finished_work,
                actual: Some(pending_handoff.finished_work()),
            },
        );
    }
    if pending_handoff.lanes() != lanes {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffLanesMismatch {
                root,
                expected: lanes,
                actual: pending_handoff.lanes(),
            },
        );
    }

    let pending_passive = store.root(root)?.scheduling().pending_passive();
    validate_function_component_effect_list_pending_passive_handoff(
        pending_handoff,
        pending_passive,
    )?;

    let mut phase_records = Vec::new();
    let mut actual_unmounts = 0;
    let mut actual_mounts = 0;

    for passive_handoff in passive_handoffs {
        if passive_handoff.root() != root {
            return Err(RootCommitError::CommittedPassiveEffectHandoffRootMismatch {
                commit_root: root,
                handoff_root: passive_handoff.root(),
            });
        }
        if passive_handoff.lanes() != lanes {
            return Err(
                RootCommitError::CommittedPassiveEffectHandoffLanesMismatch {
                    root,
                    expected: lanes,
                    actual: passive_handoff.lanes(),
                },
            );
        }
        if !committed_subtree_contains_fiber(
            store.fiber_arena(),
            finished_work,
            passive_handoff.fiber(),
        )? {
            return Err(RootCommitError::CommittedPassiveEffectHandoffFiberStale {
                root,
                finished_work,
                fiber: passive_handoff.fiber(),
            });
        }

        let Some(queue) = hook_store.committed_effect_queue(passive_handoff.fiber()) else {
            return Err(
                RootCommitError::CommittedPassiveEffectHandoffCommittedQueueMissing {
                    root,
                    fiber: passive_handoff.fiber(),
                },
            );
        };
        validate_function_component_effect_list_committed_queue(
            root,
            queue,
            passive_handoff.phase(),
            lanes,
            passive_handoff
                .records()
                .first()
                .map(|record| record.effect()),
        )?;
        if queue.accepted_passive_count() != passive_handoff.records().len() {
            return Err(
                RootCommitError::CommittedPassiveEffectHandoffRecordMismatch {
                    root,
                    fiber: passive_handoff.fiber(),
                    effect: passive_handoff
                        .records()
                        .first()
                        .map(|record| record.effect()),
                    message:
                        "committed queue accepted passive count does not match passive handoff"
                            .to_owned(),
                },
            );
        }
        for record in passive_handoff.records() {
            validate_function_component_effect_list_passive_record(root, queue, *record)?;
        }

        actual_unmounts += passive_handoff.queued_unmount_count();
        actual_mounts += passive_handoff.queued_mount_count();
        phase_records.extend(passive_handoff.effect_phase_records());
    }

    if actual_unmounts != pending_handoff.pending_unmount_count()
        || actual_mounts != pending_handoff.pending_mount_count()
    {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffRecordCountMismatch {
                root,
                expected_unmounts: pending_handoff.pending_unmount_count(),
                actual_unmounts,
                expected_mounts: pending_handoff.pending_mount_count(),
                actual_mounts,
            },
        );
    }

    phase_records.sort_by_key(|record| record.order());
    for pair in phase_records.windows(2) {
        if pair[0].order() == pair[1].order() {
            return Err(
                RootCommitError::CommittedPassiveEffectHandoffDuplicateOrder {
                    root,
                    order: pair[0].order(),
                },
            );
        }
    }

    for pending in pending_passive.flush_ordered_records() {
        let Some(effect_record) = phase_records
            .iter()
            .find(|record| record.order() == pending.order())
        else {
            return Err(
                RootCommitError::CommittedPassiveEffectHandoffRecordMismatch {
                    root,
                    fiber: pending.fiber(),
                    effect: None,
                    message: "pending passive order is missing from effect-list handoff".to_owned(),
                },
            );
        };

        if effect_record.fiber() != pending.fiber()
            || effect_record.phase() != pending.order().phase()
            || effect_record.lanes() != pending.lanes()
        {
            return Err(
                RootCommitError::CommittedPassiveEffectHandoffRecordMismatch {
                    root,
                    fiber: pending.fiber(),
                    effect: Some(effect_record.effect()),
                    message: "pending passive record does not match effect-list handoff".to_owned(),
                },
            );
        }
    }

    Ok(phase_records)
}

fn validate_function_component_effect_list_pending_passive_handoff(
    handoff: PendingPassiveCommitHandoff,
    pending_passive: &PendingPassiveState,
) -> Result<(), RootCommitError> {
    if pending_passive.root() != Some(handoff.root()) {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffPendingRootMismatch {
                commit_root: handoff.root(),
                pending_root: pending_passive.root(),
            },
        );
    }
    if pending_passive.finished_work() != Some(handoff.finished_work()) {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffFinishedWorkMismatch {
                root: handoff.root(),
                expected: handoff.finished_work(),
                actual: pending_passive.finished_work(),
            },
        );
    }
    if pending_passive.lanes() != handoff.lanes() {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffLanesMismatch {
                root: handoff.root(),
                expected: handoff.lanes(),
                actual: pending_passive.lanes(),
            },
        );
    }

    let actual_unmounts = pending_passive.passive_unmounts().len();
    let actual_mounts = pending_passive.passive_mounts().len();
    if actual_unmounts != handoff.pending_unmount_count()
        || actual_mounts != handoff.pending_mount_count()
    {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffRecordCountMismatch {
                root: handoff.root(),
                expected_unmounts: handoff.pending_unmount_count(),
                actual_unmounts,
                expected_mounts: handoff.pending_mount_count(),
                actual_mounts,
            },
        );
    }

    Ok(())
}

fn validate_function_component_effect_list_committed_queue(
    root: FiberRootId,
    queue: &FunctionComponentCommittedEffectQueue,
    phase: FunctionComponentHookRenderPhase,
    lanes: Lanes,
    effect: Option<HookEffectId>,
) -> Result<(), RootCommitError> {
    if queue.phase() != phase {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffRecordMismatch {
                root,
                fiber: queue.fiber(),
                effect,
                message: "committed effect queue phase does not match passive handoff".to_owned(),
            },
        );
    }
    if queue.lanes() != lanes {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffLanesMismatch {
                root,
                expected: lanes,
                actual: queue.lanes(),
            },
        );
    }
    Ok(())
}

fn validate_function_component_effect_list_passive_record(
    root: FiberRootId,
    queue: &FunctionComponentCommittedEffectQueue,
    record: FunctionComponentPendingPassiveEffectCommitRecord,
) -> Result<(), RootCommitError> {
    if record.fiber() != queue.fiber() {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: Some(record.effect()),
                message: "passive effect record fiber does not match committed queue owner"
                    .to_owned(),
            },
        );
    }
    if record.lanes() != queue.lanes() {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffLanesMismatch {
                root,
                expected: queue.lanes(),
                actual: record.lanes(),
            },
        );
    }

    let Some(committed_record) = queue
        .records()
        .iter()
        .find(|committed| committed.effect() == record.effect())
    else {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: Some(record.effect()),
                message: "passive effect record is missing from committed queue".to_owned(),
            },
        );
    };

    if !committed_record.accepted_for_pending_passive()
        || committed_record.previous_effect() != record.previous_effect()
        || committed_record.instance() != record.instance()
        || committed_record.create() != record.create()
        || committed_record.destroy() != record.destroy()
    {
        return Err(
            RootCommitError::CommittedPassiveEffectHandoffRecordMismatch {
                root,
                fiber: record.fiber(),
                effect: Some(record.effect()),
                message: "passive effect record fields do not match committed queue".to_owned(),
            },
        );
    }

    Ok(())
}

pub(super) fn committed_subtree_contains_fiber(
    arena: &FiberArena,
    fiber: FiberId,
    target: FiberId,
) -> Result<bool, RootCommitError> {
    if fiber == target {
        return Ok(true);
    }

    for child in arena.child_ids(fiber)? {
        if committed_subtree_contains_fiber(arena, child, target)? {
            return Ok(true);
        }
    }

    Ok(false)
}

#[allow(
    clippy::too_many_arguments,
    reason = "private effect-list evidence builder mirrors commit phase dimensions"
)]
fn build_function_component_effect_list_commit_phase_order_snapshot<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
    hook_store: &FunctionComponentHookRenderStore,
    layout_snapshot: &FunctionComponentLayoutEffectsSnapshot,
    passive_snapshot: &FunctionComponentCommittedPassiveEffectsSnapshot,
    passive_phase_records: &[FunctionComponentPendingPassiveEffectPhaseCommitRecord],
) -> Result<FunctionComponentEffectListCommitPhaseOrderSnapshot, RootCommitError> {
    let mut snapshot = FunctionComponentEffectListCommitPhaseOrderSnapshot {
        root: Some(root),
        finished_work: Some(finished_work),
        lanes,
        records: Vec::new(),
    };
    let mut effect_list_fibers = Vec::new();
    collect_committed_function_component_effect_list_fibers(
        store.fiber_arena(),
        finished_work,
        hook_store,
        &mut effect_list_fibers,
    )?;

    for (source_order, fiber) in effect_list_fibers.iter().copied().enumerate() {
        let Some(queue) = hook_store.committed_effect_queue(fiber) else {
            continue;
        };
        snapshot.push(FunctionComponentEffectListCommitPhaseOrderRecordInput {
            phase: FunctionComponentEffectListCommitPhase::BeforeMutation,
            kind: FunctionComponentEffectListCommitPhaseOrderKind::EffectListBeforeMutation,
            root,
            finished_work,
            fiber,
            hook_list: queue.hook_list(),
            render_phase: queue.phase(),
            lanes: queue.lanes(),
            effect_index: None,
            effect: None,
            previous_effect: None,
            create: None,
            destroy: None,
            source_order: source_order as u64,
        });
    }

    for record in layout_snapshot.destroy_phase_records() {
        snapshot.push(FunctionComponentEffectListCommitPhaseOrderRecordInput {
            phase: FunctionComponentEffectListCommitPhase::Mutation,
            kind: FunctionComponentEffectListCommitPhaseOrderKind::LayoutDestroy,
            root,
            finished_work,
            fiber: record.fiber(),
            hook_list: record.hook_list(),
            render_phase: record.render_phase(),
            lanes: record.lanes(),
            effect_index: Some(record.effect_index()),
            effect: Some(record.effect()),
            previous_effect: record.previous_effect(),
            create: record.create(),
            destroy: record.destroy(),
            source_order: record.order() as u64,
        });
    }

    for record in layout_snapshot.create_phase_records() {
        snapshot.push(FunctionComponentEffectListCommitPhaseOrderRecordInput {
            phase: FunctionComponentEffectListCommitPhase::Layout,
            kind: FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate,
            root,
            finished_work,
            fiber: record.fiber(),
            hook_list: record.hook_list(),
            render_phase: record.render_phase(),
            lanes: record.lanes(),
            effect_index: Some(record.effect_index()),
            effect: Some(record.effect()),
            previous_effect: record.previous_effect(),
            create: record.create(),
            destroy: record.destroy(),
            source_order: record.order() as u64,
        });
    }

    for record in passive_phase_records {
        let queue = hook_store.committed_effect_queue(record.fiber()).ok_or(
            RootCommitError::CommittedPassiveEffectHandoffCommittedQueueMissing {
                root,
                fiber: record.fiber(),
            },
        )?;
        snapshot.push(FunctionComponentEffectListCommitPhaseOrderRecordInput {
            phase: FunctionComponentEffectListCommitPhase::PassiveScheduling,
            kind: function_component_effect_list_passive_schedule_kind(record.phase()),
            root,
            finished_work,
            fiber: record.fiber(),
            hook_list: queue.hook_list(),
            render_phase: queue.phase(),
            lanes: record.lanes(),
            effect_index: Some(record.effect_index()),
            effect: Some(record.effect()),
            previous_effect: record.previous_effect(),
            create: record.create(),
            destroy: record.destroy(),
            source_order: host_root_commit_order_passive_source_order(record.order()),
        });
    }

    debug_assert_eq!(
        snapshot.passive_unmount_schedule_count(),
        passive_snapshot.queued_unmount_count()
    );
    debug_assert_eq!(
        snapshot.passive_mount_schedule_count(),
        passive_snapshot.queued_mount_count()
    );

    Ok(snapshot)
}

fn collect_committed_function_component_effect_list_fibers(
    arena: &FiberArena,
    fiber: FiberId,
    hook_store: &FunctionComponentHookRenderStore,
    effect_list_fibers: &mut Vec<FiberId>,
) -> Result<(), RootCommitError> {
    let node = arena.get(fiber)?;
    if node.tag() == FiberTag::FunctionComponent
        && let Some(queue) = hook_store.committed_effect_queue(fiber)
        && (queue.accepted_layout_count() > 0 || queue.accepted_passive_count() > 0)
    {
        effect_list_fibers.push(fiber);
    }

    for child in arena.child_ids(fiber)? {
        collect_committed_function_component_effect_list_fibers(
            arena,
            child,
            hook_store,
            effect_list_fibers,
        )?;
    }

    Ok(())
}

const fn function_component_effect_list_passive_schedule_kind(
    phase: PendingPassiveEffectPhase,
) -> FunctionComponentEffectListCommitPhaseOrderKind {
    match phase {
        PendingPassiveEffectPhase::Unmount => {
            FunctionComponentEffectListCommitPhaseOrderKind::PassiveUnmountScheduled
        }
        PendingPassiveEffectPhase::Mount => {
            FunctionComponentEffectListCommitPhaseOrderKind::PassiveMountScheduled
        }
    }
}

#[allow(
    dead_code,
    reason = "crate-private passive hook-effect handoff helper exercised by deterministic canaries"
)]
pub(crate) fn queue_function_component_pending_passive_effects<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root: FiberRootId,
    hook_store: &FunctionComponentHookRenderStore,
    state: FunctionComponentHookRenderState,
    lanes: Lanes,
) -> Result<FunctionComponentPendingPassiveCommitHandoff, RootCommitError> {
    store.root(root)?;
    let fiber = state.render_fiber();
    let tag = store.fiber_arena().get(fiber)?.tag();
    if tag != FiberTag::FunctionComponent {
        return Err(
            RootCommitError::ExpectedFunctionComponentPassiveEffectFiber { root, fiber, tag },
        );
    }

    let passive_effects = hook_store
        .passive_effect_metadata(state, lanes)
        .map_err(|error| RootCommitError::FunctionComponentRender {
            fiber,
            message: error.to_string(),
        })?;
    if passive_effects.is_empty() {
        return Ok(FunctionComponentPendingPassiveCommitHandoff {
            root,
            fiber,
            phase: state.phase(),
            lanes,
            records: Vec::new(),
        });
    }

    let scheduling = store.root_mut(root)?.scheduling_mut();
    match scheduling.pending_passive().root() {
        Some(pending_root) if pending_root != root => {
            return Err(RootCommitError::PendingPassiveRootMismatch { root, pending_root });
        }
        Some(_) if scheduling.pending_passive().finished_work().is_some() => {
            return Err(RootCommitError::PendingPassiveAlreadyCommitted {
                root,
                finished_work: scheduling
                    .pending_passive()
                    .finished_work()
                    .expect("pending passive finished work was checked above"),
            });
        }
        Some(_) => {}
        None => scheduling.prepare_pending_passive(root, Lanes::NO),
    }

    let mut records = Vec::with_capacity(passive_effects.len());
    for passive_effect in passive_effects {
        records.push(queue_function_component_passive_effect_record(
            scheduling,
            root,
            state.phase(),
            passive_effect,
        )?);
    }

    Ok(FunctionComponentPendingPassiveCommitHandoff {
        root,
        fiber,
        phase: state.phase(),
        lanes,
        records,
    })
}

#[allow(
    dead_code,
    reason = "crate-private passive hook-effect handoff helper exercised by deterministic canaries"
)]
fn queue_function_component_passive_effect_record<H: HostTypes>(
    scheduling: &mut RootSchedulingState<H>,
    root: FiberRootId,
    render_phase: FunctionComponentHookRenderPhase,
    passive_effect: FunctionComponentPassiveEffectMetadata,
) -> Result<FunctionComponentPendingPassiveEffectCommitRecord, RootCommitError> {
    let unmount_order = match render_phase {
        FunctionComponentHookRenderPhase::Mount => None,
        FunctionComponentHookRenderPhase::Update => Some(queue_pending_passive_record(
            scheduling,
            root,
            passive_effect,
            PendingPassiveEffectPhase::Unmount,
        )?),
    };
    let mount_order = queue_pending_passive_record(
        scheduling,
        root,
        passive_effect,
        PendingPassiveEffectPhase::Mount,
    )?;

    Ok(FunctionComponentPendingPassiveEffectCommitRecord {
        fiber: passive_effect.fiber(),
        effect_index: passive_effect.effect_index(),
        effect: passive_effect.effect(),
        previous_effect: passive_effect.previous_effect(),
        instance: passive_effect.instance(),
        create: passive_effect.create(),
        destroy: passive_effect.destroy(),
        lanes: passive_effect.lanes(),
        unmount_order,
        mount_order,
    })
}

#[allow(
    dead_code,
    reason = "crate-private passive hook-effect handoff helper exercised by deterministic canaries"
)]
fn queue_pending_passive_record<H: HostTypes>(
    scheduling: &mut RootSchedulingState<H>,
    root: FiberRootId,
    passive_effect: FunctionComponentPassiveEffectMetadata,
    phase: PendingPassiveEffectPhase,
) -> Result<PendingPassiveEffectOrder, RootCommitError> {
    let pending_passive = scheduling.pending_passive_mut();
    let order = match phase {
        PendingPassiveEffectPhase::Unmount => pending_passive.queue_unmount(
            passive_effect.fiber(),
            PendingPassiveUnmountOrigin::UpdatedFiber,
            passive_effect.lanes(),
        ),
        PendingPassiveEffectPhase::Mount => {
            pending_passive.queue_mount(passive_effect.fiber(), passive_effect.lanes())
        }
    };

    order.ok_or(RootCommitError::PendingPassiveQueueRejected {
        root,
        fiber: passive_effect.fiber(),
        effect: passive_effect.effect(),
        phase,
        lanes: passive_effect.lanes(),
    })
}

#[allow(
    dead_code,
    reason = "crate-private deleted-subtree passive destroy handoff helper exercised by deterministic canaries"
)]
pub(crate) fn queue_function_component_deleted_subtree_pending_passive_effects<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root: FiberRootId,
    hook_store: &FunctionComponentHookRenderStore,
    nearest_mounted_ancestor: FiberId,
    deleted_root: FiberId,
    lanes: Lanes,
) -> Result<FunctionComponentDeletedSubtreePendingPassiveCommitHandoff, RootCommitError> {
    store.root(root)?;
    store.fiber_arena().get(nearest_mounted_ancestor)?;
    store.fiber_arena().get(deleted_root)?;

    if lanes.is_empty() {
        return Ok(FunctionComponentDeletedSubtreePendingPassiveCommitHandoff {
            root,
            nearest_mounted_ancestor,
            deleted_root,
            lanes,
            records: Vec::new(),
        });
    }

    let mut pending_effects = Vec::new();
    collect_deleted_subtree_passive_effect_metadata(
        store.fiber_arena(),
        hook_store,
        deleted_root,
        lanes,
        &mut pending_effects,
    )?;
    if pending_effects.is_empty() {
        return Ok(FunctionComponentDeletedSubtreePendingPassiveCommitHandoff {
            root,
            nearest_mounted_ancestor,
            deleted_root,
            lanes,
            records: Vec::new(),
        });
    }

    let scheduling = store.root_mut(root)?.scheduling_mut();
    match scheduling.pending_passive().root() {
        Some(pending_root) if pending_root != root => {
            return Err(RootCommitError::PendingPassiveRootMismatch { root, pending_root });
        }
        Some(_) if scheduling.pending_passive().finished_work().is_some() => {
            return Err(RootCommitError::PendingPassiveAlreadyCommitted {
                root,
                finished_work: scheduling
                    .pending_passive()
                    .finished_work()
                    .expect("pending passive finished work was checked above"),
            });
        }
        Some(_) => {}
        None => scheduling.prepare_pending_passive(root, Lanes::NO),
    }

    let mut records = Vec::with_capacity(pending_effects.len());
    for pending in pending_effects {
        let unmount_order = scheduling
            .pending_passive_mut()
            .queue_unmount(
                pending.fiber,
                PendingPassiveUnmountOrigin::DeletedSubtree {
                    nearest_mounted_ancestor,
                },
                pending.lanes,
            )
            .ok_or(RootCommitError::PendingPassiveQueueRejected {
                root,
                fiber: pending.fiber,
                effect: pending.effect,
                phase: PendingPassiveEffectPhase::Unmount,
                lanes: pending.lanes,
            })?;

        records.push(
            FunctionComponentDeletedSubtreePendingPassiveEffectCommitRecord {
                root,
                nearest_mounted_ancestor,
                deleted_root,
                traversal_index: pending.traversal_index,
                fiber: pending.fiber,
                hook_list: pending.hook_list,
                effect_index: pending.effect_index,
                effect: pending.effect,
                instance: pending.instance,
                tag: pending.tag,
                create: pending.create,
                destroy: pending.destroy,
                dependencies: pending.dependencies,
                lanes: pending.lanes,
                unmount_order,
            },
        );
    }

    Ok(FunctionComponentDeletedSubtreePendingPassiveCommitHandoff {
        root,
        nearest_mounted_ancestor,
        deleted_root,
        lanes,
        records,
    })
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct DeletedSubtreePassiveEffectMetadata {
    traversal_index: usize,
    fiber: FiberId,
    hook_list: HookListId,
    effect_index: usize,
    effect: HookEffectId,
    instance: HookEffectInstanceId,
    tag: HookEffectFlags,
    create: HookEffectCallbackHandle,
    destroy: Option<HookEffectCallbackHandle>,
    dependencies: HookEffectDependencies,
    lanes: Lanes,
}

fn collect_deleted_subtree_passive_effect_metadata(
    arena: &FiberArena,
    hook_store: &FunctionComponentHookRenderStore,
    fiber: FiberId,
    lanes: Lanes,
    records: &mut Vec<DeletedSubtreePassiveEffectMetadata>,
) -> Result<(), RootCommitError> {
    let node = arena.get(fiber)?;
    if node.tag() == FiberTag::FunctionComponent {
        collect_deleted_function_component_passive_effect_metadata(
            hook_store, fiber, lanes, records,
        )?;
    }

    for child in arena.child_ids(fiber)? {
        collect_deleted_subtree_passive_effect_metadata(arena, hook_store, child, lanes, records)?;
    }

    Ok(())
}

fn collect_deleted_function_component_passive_effect_metadata(
    hook_store: &FunctionComponentHookRenderStore,
    fiber: FiberId,
    lanes: Lanes,
    records: &mut Vec<DeletedSubtreePassiveEffectMetadata>,
) -> Result<(), RootCommitError> {
    let Some(hook_list) = hook_store.current_list(fiber) else {
        return Ok(());
    };
    let Some(ring) = hook_store.effect_ring(hook_list) else {
        return Ok(());
    };

    let effects = ring
        .iter_matching(hook_store.hook_effects(), HookEffectFlags::PASSIVE)
        .map_err(
            |error| RootCommitError::FunctionComponentCommittedEffectQueue {
                fiber,
                message: error.to_string(),
            },
        )?;
    for (effect_index, effect) in effects.enumerate() {
        let effect =
            effect.map_err(
                |error| RootCommitError::FunctionComponentCommittedEffectQueue {
                    fiber,
                    message: error.to_string(),
                },
            )?;
        let destroy = hook_store
            .hook_effects()
            .effect_destroy(effect.id())
            .map_err(
                |error| RootCommitError::FunctionComponentCommittedEffectQueue {
                    fiber,
                    message: error.to_string(),
                },
            )?;
        records.push(DeletedSubtreePassiveEffectMetadata {
            traversal_index: records.len(),
            fiber,
            hook_list,
            effect_index,
            effect: effect.id(),
            instance: effect.instance(),
            tag: effect.tag(),
            create: effect.create(),
            destroy,
            dependencies: effect.dependencies(),
            lanes,
        });
    }

    Ok(())
}

pub(super) fn record_pending_passive_commit_handoff<H: HostTypes>(
    scheduling: &mut RootSchedulingState<H>,
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
) -> Result<Option<PendingPassiveCommitHandoff>, RootCommitError> {
    let Some(pending_root) = scheduling.pending_passive().root() else {
        return Ok(None);
    };

    if pending_root != root {
        return Err(RootCommitError::PendingPassiveRootMismatch { root, pending_root });
    }

    if !scheduling
        .pending_passive_mut()
        .record_commit_handoff(root, finished_work, lanes)
    {
        return Err(RootCommitError::EmptyFinishedLanes { root });
    }
    let pending_passive = scheduling.pending_passive();

    Ok(Some(PendingPassiveCommitHandoff {
        root,
        finished_work,
        lanes,
        pending_unmount_count: pending_passive.passive_unmounts().len(),
        pending_mount_count: pending_passive.passive_mounts().len(),
    }))
}
