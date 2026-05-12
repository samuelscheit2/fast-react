//! Minimal HostRoot current-switch commit foundation.
//!
//! This module consumes a completed HostRoot render-phase record and switches
//! `root.current` to that HostRoot work-in-progress fiber. It deliberately
//! stops before broad host mutation, public callback execution, public facade
//! behavior, DOM wiring, or test-renderer serialization. Narrow traversal and
//! test-control canaries in this module emit or consume private metadata for
//! renderer-owned handoffs without claiming public renderer compatibility.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    DeletionListId, ElementTypeHandle, FiberArena, FiberFlags, FiberId, FiberTag,
    FiberTopologyError, HookEffectCallbackHandle, HookEffectDependencies, HookEffectFlags,
    HookEffectId, HookEffectInstanceId, HookListId, Lane, Lanes, PropsHandle, RefHandle,
    RootFinishedLanes, StateHandle, StateNodeHandle, UpdateQueueHandle,
};
use fast_react_host_config::{HostFiberTokenPhase, HostFiberTokenTarget, HostTypes};

#[cfg(test)]
use crate::RootElementHandle;
#[cfg(test)]
use crate::complete_work::{
    HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
    HostComponentDangerousHtmlTextResetPayloadKindForCanary,
    HostComponentManagedChildCompleteWorkRecordForCanary,
    HostComponentManagedChildMutationKindForCanary,
    HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    OffscreenRevealCommitMetadataRecord, OffscreenRevealCommitMetadataStatus,
    OffscreenVisibilitySubtreeFlagBubblingIntent,
};
#[cfg(test)]
use crate::context::{
    ContextProviderUpdateConsumerLaneRecord, ContextProviderUpdateConsumerOrder,
    ContextProviderUpdateTwoConsumerLaneRecord,
};
use crate::function_component::{
    FunctionComponentCommittedEffectQueue, FunctionComponentEffectDependencyPhase,
    FunctionComponentEffectDependencyStatus, FunctionComponentHookRenderPhase,
    FunctionComponentHookRenderState, FunctionComponentHookRenderStore,
    FunctionComponentLayoutEffectMetadata, FunctionComponentPassiveEffectMetadata,
};
use crate::root_callbacks::{
    RootUpdateCallbackInvocationExecutionGateSnapshot, RootUpdateCallbackInvocationGateSnapshot,
    RootUpdateCallbackInvocationTestControl, invoke_root_update_callbacks_under_test_control,
    materialize_root_update_callback_invocation_gate,
};
use crate::root_config::{
    PendingPassiveEffectOrder, PendingPassiveEffectPhase, PendingPassiveState,
    PendingPassiveUnmountOrigin, RootErrorOptionCallbackPhase, RootErrorOptionCallbackRecord,
};
#[cfg(test)]
use crate::unsupported_features::OFFSCREEN_UNSUPPORTED_FEATURE;
use crate::unsupported_features::unsupported_reconciler_feature_for_fiber_tag;
use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError, HostFiberTokenId,
    HostFiberTokenValidationError, HostRootRenderPhaseRecord, HostRootStateStoreError,
    RootCallbackPriority, RootErrorCallbackHandle, RootRecoverableErrorCallbackHandle,
    RootRenderExitStatus, RootSchedulerCallbackHandle, RootSchedulingState,
    RootUpdateCallbackHandle, RootUpdateCallbackRecord, RootUpdateCallbackSnapshot,
    RootUpdateCallbackVisibility, TestRendererHostOutputCanaryError,
    TestRendererHostOutputCanaryPreparedFibers, TestRendererHostOutputCanaryUpdatedFibers,
    UpdateId, UpdateQueueError,
};

mod effects;
mod errors;

use self::effects::{committed_subtree_contains_fiber, record_pending_passive_commit_handoff};
pub(crate) use effects::*;

pub use errors::RootCommitError;

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootFinishedWorkPendingCommitRecordForCanary {
    root: FiberRootId,
    root_token: StateNodeHandle,
    previous_current: FiberId,
    pending_work: Option<FiberId>,
    root_finished_work: Option<FiberId>,
    finished_work: FiberId,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    root_finished_lanes: Lanes,
    remaining_lanes: Lanes,
    pending_lanes_before_commit: Lanes,
    render_exit_status: RootRenderExitStatus,
    handoff_order: usize,
}

#[cfg(test)]
impl HostRootFinishedWorkPendingCommitRecordForCanary {
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
    pub(crate) const fn pending_work(self) -> Option<FiberId> {
        self.pending_work
    }

    #[must_use]
    pub(crate) const fn root_finished_work(self) -> Option<FiberId> {
        self.root_finished_work
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn finished_lanes(self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub(crate) const fn root_finished_lanes(self) -> Lanes {
        self.root_finished_lanes
    }

    #[must_use]
    pub(crate) const fn remaining_lanes(self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub(crate) const fn pending_lanes_before_commit(self) -> Lanes {
        self.pending_lanes_before_commit
    }

    #[must_use]
    pub(crate) const fn render_exit_status(self) -> RootRenderExitStatus {
        self.render_exit_status
    }

    #[must_use]
    pub(crate) const fn handoff_order(self) -> usize {
        self.handoff_order
    }

    #[must_use]
    pub(crate) fn records_finished_work(self) -> bool {
        matches!(self.pending_work, Some(pending_work) if pending_work == self.finished_work)
    }

    #[must_use]
    pub(crate) fn records_root_finished_work(self) -> bool {
        matches!(
            self.root_finished_work,
            Some(root_finished_work) if root_finished_work == self.finished_work
        ) && self.root_finished_lanes == self.finished_lanes
            && self.render_exit_status == RootRenderExitStatus::Completed
    }

    #[must_use]
    pub(crate) const fn with_previous_current_for_canary(
        mut self,
        previous_current: FiberId,
    ) -> Self {
        self.previous_current = previous_current;
        self
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootFinishedWorkCommitHandoffRecordForCanary {
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    execution_request: HostRootFinishedWorkCommitExecutionRequestForCanary,
    commit_order: usize,
    commit: HostRootCommitRecord,
    current_after_commit: FiberId,
    finished_work_after_commit: Option<FiberId>,
    finished_lanes_after_commit: Lanes,
    render_phase_work_after_commit: Option<FiberId>,
}

#[cfg(test)]
impl HostRootFinishedWorkCommitHandoffRecordForCanary {
    #[must_use]
    pub(crate) const fn pending(&self) -> HostRootFinishedWorkPendingCommitRecordForCanary {
        self.pending
    }

    #[must_use]
    pub(crate) const fn execution_request(
        &self,
    ) -> &HostRootFinishedWorkCommitExecutionRequestForCanary {
        &self.execution_request
    }

    #[must_use]
    pub(crate) const fn commit_order(&self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub(crate) fn record_function_component_deleted_subtree_passive_effects_for_canary(
        &mut self,
        handoffs: &[FunctionComponentDeletedSubtreePendingPassiveCommitHandoff],
    ) -> Result<&FunctionComponentDeletedSubtreePassiveEffectsSnapshot, RootCommitError> {
        self.commit
            .record_function_component_deleted_subtree_passive_effects_for_canary(handoffs)
    }

    #[must_use]
    pub(crate) const fn current_after_commit(&self) -> FiberId {
        self.current_after_commit
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
    pub(crate) const fn render_phase_work_after_commit(&self) -> Option<FiberId> {
        self.render_phase_work_after_commit
    }

    #[must_use]
    pub(crate) const fn commit_order_after_pending_record(&self) -> bool {
        self.commit_order > self.pending.handoff_order
    }

    #[must_use]
    pub(crate) const fn consumed_finished_work_record(&self) -> bool {
        self.finished_work_after_commit.is_none()
            && self.finished_lanes_after_commit.is_empty()
            && self.render_phase_work_after_commit.is_none()
    }

    #[must_use]
    pub(crate) const fn mutation_execution_blocked(&self) -> bool {
        self.execution_request.host_mutation_execution_blocked()
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(&self) -> bool {
        self.execution_request.public_root_rendering_blocked()
    }

    #[must_use]
    pub(crate) const fn effects_refs_and_hydration_blocked(&self) -> bool {
        self.execution_request.refs_effects_and_hydration_blocked()
    }

    #[must_use]
    pub(crate) fn proves_private_finished_work_commit_execution(&self) -> bool {
        self.pending.records_finished_work()
            && self.execution_request.execution_requested()
            && self
                .execution_request
                .accepted_current_finished_work_record_shape()
            && self.commit_order_after_pending_record()
            && self.consumed_finished_work_record()
            && self.current_after_commit == self.pending.finished_work()
            && self.commit.root() == self.pending.root()
            && self.commit.previous_current() == self.pending.previous_current()
            && self.commit.current() == self.pending.finished_work()
            && self.commit.finished_work() == self.pending.finished_work()
            && self.commit.finished_lanes() == self.pending.finished_lanes()
            && self.commit.remaining_lanes() == self.pending.remaining_lanes()
            && self.commit.pending_lanes() == self.pending.remaining_lanes()
            && self.mutation_execution_blocked()
            && self.public_root_rendering_blocked()
            && self.effects_refs_and_hydration_blocked()
            && self.execution_request.compatibility_claim_blocked()
    }

    #[must_use]
    pub(crate) fn proves_private_root_finished_work_commit_metadata_handoff(&self) -> bool {
        self.proves_private_finished_work_commit_execution()
            && self.pending.records_root_finished_work()
            && self.execution_request.records_root_finished_work()
            && self.finished_work_after_commit.is_none()
            && self.finished_lanes_after_commit.is_empty()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootFinishedWorkCommitExecutionRequestForCanary {
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    request_order: usize,
    status: HostRootFinishedWorkCommitExecutionStatusForCanary,
    blockers: [HostRootFinishedWorkCommitExecutionBlockerForCanary; 7],
}

#[cfg(test)]
impl HostRootFinishedWorkCommitExecutionRequestForCanary {
    #[must_use]
    const fn new(
        pending: HostRootFinishedWorkPendingCommitRecordForCanary,
        request_order: usize,
    ) -> Self {
        Self {
            pending,
            request_order,
            status: HostRootFinishedWorkCommitExecutionStatusForCanary::Requested,
            blockers: HOST_ROOT_FINISHED_WORK_COMMIT_EXECUTION_BLOCKERS,
        }
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.pending.root
    }

    #[must_use]
    pub(crate) const fn root_token(self) -> StateNodeHandle {
        self.pending.root_token
    }

    #[must_use]
    pub(crate) const fn previous_current(self) -> FiberId {
        self.pending.previous_current
    }

    #[must_use]
    pub(crate) const fn pending_work(self) -> Option<FiberId> {
        self.pending.pending_work
    }

    #[must_use]
    pub(crate) const fn root_finished_work(self) -> Option<FiberId> {
        self.pending.root_finished_work
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
        self.pending.finished_work
    }

    #[must_use]
    pub(crate) const fn render_lanes(self) -> Lanes {
        self.pending.render_lanes
    }

    #[must_use]
    pub(crate) const fn finished_lanes(self) -> Lanes {
        self.pending.finished_lanes
    }

    #[must_use]
    pub(crate) const fn root_finished_lanes(self) -> Lanes {
        self.pending.root_finished_lanes
    }

    #[must_use]
    pub(crate) const fn remaining_lanes(self) -> Lanes {
        self.pending.remaining_lanes
    }

    #[must_use]
    pub(crate) const fn pending_lanes_before_commit(self) -> Lanes {
        self.pending.pending_lanes_before_commit
    }

    #[must_use]
    pub(crate) const fn render_exit_status(self) -> RootRenderExitStatus {
        self.pending.render_exit_status
    }

    #[must_use]
    pub(crate) const fn source_handoff_order(self) -> usize {
        self.pending.handoff_order
    }

    #[must_use]
    pub(crate) const fn request_order(self) -> usize {
        self.request_order
    }

    #[must_use]
    pub(crate) const fn status(self) -> HostRootFinishedWorkCommitExecutionStatusForCanary {
        self.status
    }

    #[must_use]
    pub(crate) const fn execution_requested(self) -> bool {
        matches!(
            self.status,
            HostRootFinishedWorkCommitExecutionStatusForCanary::Requested
        )
    }

    #[must_use]
    pub(crate) fn accepted_current_finished_work_record_shape(self) -> bool {
        self.pending.records_finished_work()
    }

    #[must_use]
    pub(crate) fn records_root_finished_work(self) -> bool {
        self.pending.records_root_finished_work()
    }

    #[must_use]
    pub(crate) const fn blockers(
        &self,
    ) -> &[HostRootFinishedWorkCommitExecutionBlockerForCanary; 7] {
        &self.blockers
    }

    #[must_use]
    pub(crate) const fn host_mutation_execution_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn ref_attach_detach_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn layout_effect_execution_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn passive_effect_execution_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn hydration_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn compatibility_claim_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn refs_effects_and_hydration_blocked(self) -> bool {
        self.ref_attach_detach_blocked()
            && self.layout_effect_execution_blocked()
            && self.passive_effect_execution_blocked()
            && self.hydration_blocked()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootFinishedWorkCommitExecutionStatusForCanary {
    Requested,
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootFinishedWorkCommitExecutionBlockerForCanary {
    HostMutationExecution,
    PublicRootRendering,
    RefAttachDetach,
    LayoutEffectExecution,
    PassiveEffectExecution,
    Hydration,
    PublicCompatibilityClaim,
}

#[cfg(test)]
const HOST_ROOT_FINISHED_WORK_COMMIT_EXECUTION_BLOCKERS:
    [HostRootFinishedWorkCommitExecutionBlockerForCanary; 7] = [
    HostRootFinishedWorkCommitExecutionBlockerForCanary::HostMutationExecution,
    HostRootFinishedWorkCommitExecutionBlockerForCanary::PublicRootRendering,
    HostRootFinishedWorkCommitExecutionBlockerForCanary::RefAttachDetach,
    HostRootFinishedWorkCommitExecutionBlockerForCanary::LayoutEffectExecution,
    HostRootFinishedWorkCommitExecutionBlockerForCanary::PassiveEffectExecution,
    HostRootFinishedWorkCommitExecutionBlockerForCanary::Hydration,
    HostRootFinishedWorkCommitExecutionBlockerForCanary::PublicCompatibilityClaim,
];

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootSuspenseFallbackContentCommitHandoffRecordForCanary {
    root: FiberRootId,
    previous_current: FiberId,
    committed_current: FiberId,
    fallback_element: RootElementHandle,
    content_element: RootElementHandle,
    previous_current_element: RootElementHandle,
    committed_current_element: RootElementHandle,
    retry_lanes: Lanes,
    finished_lanes: Lanes,
    private_finished_work_commit_proof: bool,
}

#[cfg(test)]
impl HostRootSuspenseFallbackContentCommitHandoffRecordForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
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
    pub(crate) const fn fallback_element(self) -> RootElementHandle {
        self.fallback_element
    }

    #[must_use]
    pub(crate) const fn content_element(self) -> RootElementHandle {
        self.content_element
    }

    #[must_use]
    pub(crate) const fn previous_current_element(self) -> RootElementHandle {
        self.previous_current_element
    }

    #[must_use]
    pub(crate) const fn committed_current_element(self) -> RootElementHandle {
        self.committed_current_element
    }

    #[must_use]
    pub(crate) const fn retry_lanes(self) -> Lanes {
        self.retry_lanes
    }

    #[must_use]
    pub(crate) const fn finished_lanes(self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub(crate) const fn private_finished_work_commit_proof(self) -> bool {
        self.private_finished_work_commit_proof
    }

    #[must_use]
    pub(crate) fn fallback_to_content_element_handoff(self) -> bool {
        self.fallback_element.is_some()
            && self.content_element.is_some()
            && self.fallback_element != self.content_element
            && self.previous_current_element == self.fallback_element
            && self.committed_current_element == self.content_element
            && self.previous_current != self.committed_current
    }

    #[must_use]
    pub(crate) fn retry_lanes_committed(self) -> bool {
        self.retry_lanes.is_non_empty()
            && self.retry_lanes.includes_only_retries()
            && self.finished_lanes == self.retry_lanes
    }

    #[must_use]
    pub(crate) const fn suspense_boundary_rendering_executed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn fallback_traversal_executed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn wakeable_subscription_performed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_suspense_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_root_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) fn proves_private_suspense_retry_fallback_content_commit_handoff(self) -> bool {
        self.private_finished_work_commit_proof()
            && self.fallback_to_content_element_handoff()
            && self.retry_lanes_committed()
            && !self.suspense_boundary_rendering_executed()
            && !self.fallback_traversal_executed()
            && !self.wakeable_subscription_performed()
            && !self.public_suspense_compatibility_claimed()
            && !self.public_root_compatibility_claimed()
    }
}

#[cfg(test)]
fn host_root_element_for_finished_work_commit_handoff_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    fiber: FiberId,
) -> Result<RootElementHandle, RootCommitError> {
    let memoized_state = store.fiber_arena().get(fiber)?.memoized_state();
    Ok(store.host_root_states().get(memoized_state)?.element())
}

#[cfg(test)]
pub(crate) fn record_host_root_suspense_fallback_content_commit_handoff_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    finished_work_handoff: &HostRootFinishedWorkCommitHandoffRecordForCanary,
    fallback_element: RootElementHandle,
    content_element: RootElementHandle,
    retry_lanes: Lanes,
) -> Result<HostRootSuspenseFallbackContentCommitHandoffRecordForCanary, RootCommitError> {
    let commit = finished_work_handoff.commit();
    let previous_current = commit.previous_current();
    let committed_current = commit.current();
    let previous_current_element =
        host_root_element_for_finished_work_commit_handoff_for_canary(store, previous_current)?;
    let committed_current_element =
        host_root_element_for_finished_work_commit_handoff_for_canary(store, committed_current)?;

    Ok(
        HostRootSuspenseFallbackContentCommitHandoffRecordForCanary {
            root: commit.root(),
            previous_current,
            committed_current,
            fallback_element,
            content_element,
            previous_current_element,
            committed_current_element,
            retry_lanes,
            finished_lanes: commit.finished_lanes(),
            private_finished_work_commit_proof: finished_work_handoff
                .proves_private_finished_work_commit_execution(),
        },
    )
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootContextProviderUpdateCommitHandoffRecordForCanary {
    provider_update: ContextProviderUpdateTwoConsumerLaneRecord,
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
    request_order: usize,
    committed_consumers: [HostRootContextProviderUpdateCommitConsumerLaneRecordForCanary; 2],
    host_root_child_lanes_after_commit: Lanes,
    outer_provider_child_lanes_after_commit: Lanes,
    inner_provider_child_lanes_after_commit: Lanes,
    root_pending_lanes_after_commit: Lanes,
}

#[cfg(test)]
impl HostRootContextProviderUpdateCommitHandoffRecordForCanary {
    #[must_use]
    pub(crate) const fn provider_update(&self) -> ContextProviderUpdateTwoConsumerLaneRecord {
        self.provider_update
    }

    #[must_use]
    pub(crate) const fn finished_work_handoff(
        &self,
    ) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        &self.finished_work_handoff
    }

    #[must_use]
    pub(crate) const fn request_order(&self) -> usize {
        self.request_order
    }

    #[must_use]
    pub(crate) const fn committed_consumers(
        &self,
    ) -> &[HostRootContextProviderUpdateCommitConsumerLaneRecordForCanary; 2] {
        &self.committed_consumers
    }

    #[must_use]
    pub(crate) const fn host_root_child_lanes_after_commit(&self) -> Lanes {
        self.host_root_child_lanes_after_commit
    }

    #[must_use]
    pub(crate) const fn outer_provider_child_lanes_after_commit(&self) -> Lanes {
        self.outer_provider_child_lanes_after_commit
    }

    #[must_use]
    pub(crate) const fn inner_provider_child_lanes_after_commit(&self) -> Lanes {
        self.inner_provider_child_lanes_after_commit
    }

    #[must_use]
    pub(crate) const fn root_pending_lanes_after_commit(&self) -> Lanes {
        self.root_pending_lanes_after_commit
    }

    #[must_use]
    pub(crate) fn marked_consumer_lanes_survived_to_commit(&self) -> bool {
        self.committed_consumers
            .iter()
            .all(HostRootContextProviderUpdateCommitConsumerLaneRecordForCanary::lanes_survived)
    }

    #[must_use]
    pub(crate) fn ancestor_child_lanes_survived_to_commit(&self) -> bool {
        let lanes = self.provider_update.propagation_lanes();
        self.host_root_child_lanes_after_commit.contains_all(lanes)
            && self
                .outer_provider_child_lanes_after_commit
                .contains_all(lanes)
            && self
                .inner_provider_child_lanes_after_commit
                .contains_all(lanes)
    }

    #[must_use]
    pub(crate) fn root_pending_lanes_survived_to_commit(&self) -> bool {
        self.root_pending_lanes_after_commit
            .contains_all(self.provider_update.propagation_lanes())
    }

    #[must_use]
    pub(crate) fn proves_marked_consumer_lanes_survive_to_commit(&self) -> bool {
        self.finished_work_handoff
            .proves_private_finished_work_commit_execution()
            && self.provider_update.provider_changed()
            && self.provider_update.marked_dependency_count()
                == self.provider_update.dependent_consumer_count()
            && self
                .provider_update
                .all_marked_consumers_include_propagation_lanes()
            && self.marked_consumer_lanes_survived_to_commit()
            && self.ancestor_child_lanes_survived_to_commit()
            && self.root_pending_lanes_survived_to_commit()
            && self
                .finished_work_handoff
                .commit()
                .pending_lanes()
                .contains_all(self.provider_update.propagation_lanes())
            && self.provider_update.public_context_compatibility_blocked()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootContextProviderUpdateCommitConsumerLaneRecordForCanary {
    order: ContextProviderUpdateConsumerOrder,
    consumer: FiberId,
    dependency_lanes: Lanes,
    propagation_lanes: Lanes,
    fiber_lanes_after_render: Lanes,
    fiber_lanes_after_commit: Lanes,
}

#[cfg(test)]
impl HostRootContextProviderUpdateCommitConsumerLaneRecordForCanary {
    #[must_use]
    pub(crate) const fn order(self) -> ContextProviderUpdateConsumerOrder {
        self.order
    }

    #[must_use]
    pub(crate) const fn consumer(self) -> FiberId {
        self.consumer
    }

    #[must_use]
    pub(crate) const fn dependency_lanes(self) -> Lanes {
        self.dependency_lanes
    }

    #[must_use]
    pub(crate) const fn propagation_lanes(self) -> Lanes {
        self.propagation_lanes
    }

    #[must_use]
    pub(crate) const fn fiber_lanes_after_render(self) -> Lanes {
        self.fiber_lanes_after_render
    }

    #[must_use]
    pub(crate) const fn fiber_lanes_after_commit(self) -> Lanes {
        self.fiber_lanes_after_commit
    }

    #[must_use]
    pub(crate) fn lanes_survived(&self) -> bool {
        self.dependency_lanes.contains_all(self.propagation_lanes)
            && self
                .fiber_lanes_after_render
                .contains_all(self.propagation_lanes)
            && self
                .fiber_lanes_after_commit
                .contains_all(self.propagation_lanes)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootOffscreenRevealCommitHandoffRecordForCanary {
    reveal_metadata: OffscreenRevealCommitMetadataRecord,
    execution_request: HostRootOffscreenRevealCommitExecutionRequestForCanary,
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
}

#[cfg(test)]
impl HostRootOffscreenRevealCommitHandoffRecordForCanary {
    #[must_use]
    pub(crate) const fn reveal_metadata(&self) -> &OffscreenRevealCommitMetadataRecord {
        &self.reveal_metadata
    }

    #[must_use]
    pub(crate) const fn execution_request(
        &self,
    ) -> &HostRootOffscreenRevealCommitExecutionRequestForCanary {
        &self.execution_request
    }

    #[must_use]
    pub(crate) const fn finished_work_handoff(
        &self,
    ) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        &self.finished_work_handoff
    }

    #[must_use]
    pub(crate) const fn commit(&self) -> &HostRootCommitRecord {
        self.finished_work_handoff.commit()
    }

    #[must_use]
    pub(crate) const fn pending(&self) -> HostRootFinishedWorkPendingCommitRecordForCanary {
        self.finished_work_handoff.pending()
    }

    #[must_use]
    pub(crate) const fn commit_order(&self) -> usize {
        self.finished_work_handoff.commit_order()
    }

    #[must_use]
    pub(crate) const fn current_after_commit(&self) -> FiberId {
        self.finished_work_handoff.current_after_commit()
    }

    #[must_use]
    pub(crate) const fn consumed_finished_work_record(&self) -> bool {
        self.finished_work_handoff.consumed_finished_work_record()
    }

    #[must_use]
    pub(crate) fn complete_metadata_matches_commit(&self) -> bool {
        self.execution_request.reveal_metadata() == self.reveal_metadata()
            && self.commit().root() == self.execution_request.root()
            && self.commit().finished_work() == self.execution_request.finished_work()
            && self.commit().finished_lanes() == self.execution_request.render_lanes()
    }

    #[must_use]
    pub(crate) fn visibility_commit_work_blocked(&self) -> bool {
        self.execution_request.host_visibility_mutation_blocked()
            && self.execution_request.passive_visibility_effects_blocked()
            && self
                .execution_request
                .newly_visible_suspensey_commit_traversal_blocked()
    }

    #[must_use]
    pub(crate) const fn passive_visibility_effects_deferred(&self) -> bool {
        self.execution_request.passive_visibility_effects_deferred()
    }

    #[must_use]
    pub(crate) fn public_compatibility_blocked(&self) -> bool {
        self.execution_request
            .public_offscreen_compatibility_blocked()
            && self
                .execution_request
                .public_activity_compatibility_blocked()
            && self.execution_request.public_root_rendering_blocked()
            && self.execution_request.public_compatibility_claim_blocked()
    }

    #[must_use]
    pub(crate) const fn public_passive_compatibility_blocked(&self) -> bool {
        self.execution_request
            .public_passive_compatibility_blocked()
    }

    #[must_use]
    pub(crate) fn deferred_hidden_update_callbacks_match_reveal_metadata(&self) -> bool {
        let callbacks = self.commit().root_update_callbacks();
        callbacks.visible().is_empty()
            && callbacks.hidden().is_empty()
            && callbacks.deferred_hidden().len() == self.execution_request.hidden_update_count()
            && callbacks
                .deferred_hidden()
                .iter()
                .all(|record| record.visibility().is_deferred())
    }

    #[must_use]
    pub(crate) fn proves_hidden_update_deferred_and_revealed_through_commit_metadata(
        &self,
    ) -> bool {
        self.complete_metadata_matches_commit()
            && self.deferred_hidden_update_callbacks_match_reveal_metadata()
            && self.execution_request.committed_lanes_match_render()
            && self.execution_request.offscreen_lane_metadata_recorded()
            && self.execution_request.hidden_to_visible_reveal()
            && self
                .commit()
                .finished_lanes()
                .contains_lane(Lane::OFFSCREEN)
            && self
                .commit()
                .finished_lanes()
                .remove_lane(Lane::OFFSCREEN)
                .contains_lane(self.execution_request.hidden_update_lane())
            && self.public_compatibility_blocked()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootOffscreenRevealCommitExecutionRequestForCanary {
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    reveal_metadata: OffscreenRevealCommitMetadataRecord,
    request_order: usize,
    status: HostRootOffscreenRevealCommitExecutionStatusForCanary,
    blockers: [HostRootOffscreenRevealCommitExecutionBlockerForCanary; 7],
    hidden_update_lane: Lane,
    hidden_update_count: usize,
    actual_child_flags: FiberFlags,
    actual_child_subtree_flags: FiberFlags,
}

#[cfg(test)]
impl HostRootOffscreenRevealCommitExecutionRequestForCanary {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.pending.root
    }

    #[must_use]
    pub(crate) const fn root_token(&self) -> StateNodeHandle {
        self.pending.root_token
    }

    #[must_use]
    pub(crate) const fn previous_current(&self) -> FiberId {
        self.pending.previous_current
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.pending.finished_work
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.pending.render_lanes
    }

    #[must_use]
    pub(crate) const fn pending_lanes_before_commit(&self) -> Lanes {
        self.pending.pending_lanes_before_commit
    }

    #[must_use]
    pub(crate) const fn source_handoff_order(&self) -> usize {
        self.pending.handoff_order
    }

    #[must_use]
    pub(crate) const fn request_order(&self) -> usize {
        self.request_order
    }

    #[must_use]
    pub(crate) const fn hidden_update_lane(&self) -> Lane {
        self.hidden_update_lane
    }

    #[must_use]
    pub(crate) const fn hidden_update_count(&self) -> usize {
        self.hidden_update_count
    }

    #[must_use]
    pub(crate) const fn reveal_metadata(&self) -> &OffscreenRevealCommitMetadataRecord {
        &self.reveal_metadata
    }

    #[must_use]
    pub(crate) const fn offscreen(&self) -> FiberId {
        self.reveal_metadata.offscreen()
    }

    #[must_use]
    pub(crate) const fn child(&self) -> FiberId {
        self.reveal_metadata.child()
    }

    #[must_use]
    pub(crate) const fn child_tag(&self) -> FiberTag {
        self.reveal_metadata.child_tag()
    }

    #[must_use]
    pub(crate) const fn committed_lanes(&self) -> Lanes {
        self.reveal_metadata.committed_lanes()
    }

    #[must_use]
    pub(crate) const fn actual_child_flags(&self) -> FiberFlags {
        self.actual_child_flags
    }

    #[must_use]
    pub(crate) const fn actual_child_subtree_flags(&self) -> FiberFlags {
        self.actual_child_subtree_flags
    }

    #[must_use]
    pub(crate) const fn actual_candidate_subtree_flags(&self) -> FiberFlags {
        self.actual_child_flags
            .merge(self.actual_child_subtree_flags)
    }

    #[must_use]
    pub(crate) const fn status(&self) -> HostRootOffscreenRevealCommitExecutionStatusForCanary {
        self.status
    }

    #[must_use]
    pub(crate) const fn execution_requested(&self) -> bool {
        matches!(
            self.status,
            HostRootOffscreenRevealCommitExecutionStatusForCanary::ValidatedForCommitHandoff
        )
    }

    #[must_use]
    pub(crate) fn blockers(&self) -> &[HostRootOffscreenRevealCommitExecutionBlockerForCanary; 7] {
        &self.blockers
    }

    #[must_use]
    pub(crate) fn committed_lanes_match_render(&self) -> bool {
        self.committed_lanes() == self.render_lanes()
    }

    #[must_use]
    pub(crate) fn offscreen_lane_metadata_recorded(&self) -> bool {
        self.hidden_update_count > 0
            && self.render_lanes().contains_lane(Lane::OFFSCREEN)
            && self
                .reveal_metadata
                .transition()
                .records_offscreen_lane_participation()
    }

    #[must_use]
    pub(crate) fn hidden_to_visible_reveal(&self) -> bool {
        self.reveal_metadata
            .transition()
            .is_hidden_to_visible_reveal()
    }

    #[must_use]
    pub(crate) const fn host_visibility_mutation_blocked(&self) -> bool {
        self.reveal_metadata.host_visibility_mutation_blocked()
    }

    #[must_use]
    pub(crate) const fn passive_visibility_effects_blocked(&self) -> bool {
        self.reveal_metadata.passive_visibility_effects_blocked()
    }

    #[must_use]
    pub(crate) const fn passive_visibility_effects_deferred(&self) -> bool {
        self.reveal_metadata.passive_visibility_effects_blocked()
    }

    #[must_use]
    pub(crate) const fn newly_visible_suspensey_commit_traversal_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn would_accumulate_newly_visible_suspensey_commit(&self) -> bool {
        self.reveal_metadata
            .would_accumulate_newly_visible_suspensey_commit()
    }

    #[must_use]
    pub(crate) const fn public_offscreen_compatibility_blocked(&self) -> bool {
        self.reveal_metadata.public_compatibility_blocked()
    }

    #[must_use]
    pub(crate) const fn public_activity_compatibility_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_compatibility_claim_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_passive_compatibility_blocked(&self) -> bool {
        true
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootOffscreenRevealCommitExecutionStatusForCanary {
    ValidatedForCommitHandoff,
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootOffscreenRevealCommitExecutionBlockerForCanary {
    HostVisibilityMutation,
    PassiveVisibilityEffects,
    NewlyVisibleSuspenseyCommitTraversal,
    PublicOffscreenCompatibility,
    PublicActivityCompatibility,
    PublicRootRendering,
    PublicCompatibilityClaim,
}

#[cfg(test)]
const HOST_ROOT_OFFSCREEN_REVEAL_COMMIT_EXECUTION_BLOCKERS:
    [HostRootOffscreenRevealCommitExecutionBlockerForCanary; 7] = [
    HostRootOffscreenRevealCommitExecutionBlockerForCanary::HostVisibilityMutation,
    HostRootOffscreenRevealCommitExecutionBlockerForCanary::PassiveVisibilityEffects,
    HostRootOffscreenRevealCommitExecutionBlockerForCanary::NewlyVisibleSuspenseyCommitTraversal,
    HostRootOffscreenRevealCommitExecutionBlockerForCanary::PublicOffscreenCompatibility,
    HostRootOffscreenRevealCommitExecutionBlockerForCanary::PublicActivityCompatibility,
    HostRootOffscreenRevealCommitExecutionBlockerForCanary::PublicRootRendering,
    HostRootOffscreenRevealCommitExecutionBlockerForCanary::PublicCompatibilityClaim,
];

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootOffscreenRevealCommitHandoffErrorForCanary {
    FinishedWork(HostRootFinishedWorkCommitHandoffErrorForCanary),
    FiberTopology(FiberTopologyError),
    RevealCommitLanesMismatch {
        root: FiberRootId,
        expected_render_lanes: Lanes,
        expected_finished_lanes: Lanes,
        actual_committed_lanes: Lanes,
    },
    OffscreenLaneMetadataMissing {
        root: FiberRootId,
        pending_lanes_before_commit: Lanes,
        render_lanes: Lanes,
    },
    ExpectedHostRootOffscreenChild {
        root: FiberRootId,
        finished_work: FiberId,
        expected_offscreen: FiberId,
        actual_child: Option<FiberId>,
        actual_tag: Option<FiberTag>,
    },
    ExpectedOffscreenFiber {
        offscreen: FiberId,
        tag: FiberTag,
    },
    ExpectedRevealChild {
        offscreen: FiberId,
        expected_child: FiberId,
        actual_child: Option<FiberId>,
        actual_tag: Option<FiberTag>,
    },
    RevealChildTagMismatch {
        child: FiberId,
        expected_tag: FiberTag,
        actual_tag: FiberTag,
    },
    RevealChildParentMismatch {
        offscreen: FiberId,
        child: FiberId,
        actual_parent: Option<FiberId>,
    },
    UnexpectedRevealChildSibling {
        offscreen: FiberId,
        child: FiberId,
        sibling: FiberId,
        sibling_tag: FiberTag,
    },
    StaleRevealTransition {
        offscreen: FiberId,
        transition_offscreen: FiberId,
        expected_render_lanes: Lanes,
        actual_transition_lanes: Lanes,
    },
    StaleRevealChildFlags {
        offscreen: FiberId,
        child: FiberId,
        expected_candidate_subtree_flags: FiberFlags,
        actual_candidate_subtree_flags: FiberFlags,
    },
    UnsupportedRevealMetadata {
        root: FiberRootId,
        offscreen: FiberId,
        status: OffscreenRevealCommitMetadataStatus,
        intent: OffscreenVisibilitySubtreeFlagBubblingIntent,
        feature: &'static str,
        visibility_effect_required: bool,
        visibility_flag_set: bool,
    },
    RevealCommitBlockerMissing {
        root: FiberRootId,
        offscreen: FiberId,
        blocker: HostRootOffscreenRevealCommitExecutionBlockerForCanary,
    },
}

#[cfg(test)]
impl Display for HostRootOffscreenRevealCommitHandoffErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FinishedWork(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::RevealCommitLanesMismatch {
                root,
                expected_render_lanes,
                expected_finished_lanes,
                actual_committed_lanes,
            } => write!(
                formatter,
                "root {} Offscreen reveal commit metadata lanes {:?} do not match render {:?} and finished {:?}",
                root.raw(),
                actual_committed_lanes,
                expected_render_lanes,
                expected_finished_lanes
            ),
            Self::OffscreenLaneMetadataMissing {
                root,
                pending_lanes_before_commit,
                render_lanes,
            } => write!(
                formatter,
                "root {} Offscreen reveal commit handoff requires retained Offscreen lane metadata before commit; pending {:?}, render {:?}",
                root.raw(),
                pending_lanes_before_commit,
                render_lanes
            ),
            Self::ExpectedHostRootOffscreenChild {
                root,
                finished_work,
                expected_offscreen,
                actual_child,
                actual_tag,
            } => write!(
                formatter,
                "root {} finished work fiber slot {} expected Offscreen child slot {}, found {:?} ({:?})",
                root.raw(),
                finished_work.slot().get(),
                expected_offscreen.slot().get(),
                actual_child.map(|fiber| fiber.slot().get()),
                actual_tag
            ),
            Self::ExpectedOffscreenFiber { offscreen, tag } => write!(
                formatter,
                "Offscreen reveal commit metadata expected fiber slot {} to be Offscreen, found {:?}",
                offscreen.slot().get(),
                tag
            ),
            Self::ExpectedRevealChild {
                offscreen,
                expected_child,
                actual_child,
                actual_tag,
            } => write!(
                formatter,
                "Offscreen fiber slot {} expected reveal child slot {}, found {:?} ({:?})",
                offscreen.slot().get(),
                expected_child.slot().get(),
                actual_child.map(|fiber| fiber.slot().get()),
                actual_tag
            ),
            Self::RevealChildTagMismatch {
                child,
                expected_tag,
                actual_tag,
            } => write!(
                formatter,
                "Offscreen reveal child slot {} expected {:?}, found {:?}",
                child.slot().get(),
                expected_tag,
                actual_tag
            ),
            Self::RevealChildParentMismatch {
                offscreen,
                child,
                actual_parent,
            } => write!(
                formatter,
                "Offscreen reveal child slot {} expected parent slot {}, found {:?}",
                child.slot().get(),
                offscreen.slot().get(),
                actual_parent.map(|fiber| fiber.slot().get())
            ),
            Self::UnexpectedRevealChildSibling {
                offscreen,
                child,
                sibling,
                sibling_tag,
            } => write!(
                formatter,
                "Offscreen fiber slot {} reveal child slot {} must have no sibling for private commit handoff, found slot {} ({:?})",
                offscreen.slot().get(),
                child.slot().get(),
                sibling.slot().get(),
                sibling_tag
            ),
            Self::StaleRevealTransition {
                offscreen,
                transition_offscreen,
                expected_render_lanes,
                actual_transition_lanes,
            } => write!(
                formatter,
                "Offscreen reveal commit metadata for slot {} has stale transition for slot {} or lanes {:?}/{:?}",
                offscreen.slot().get(),
                transition_offscreen.slot().get(),
                actual_transition_lanes,
                expected_render_lanes
            ),
            Self::StaleRevealChildFlags {
                offscreen,
                child,
                expected_candidate_subtree_flags,
                actual_candidate_subtree_flags,
            } => write!(
                formatter,
                "Offscreen reveal commit metadata for slot {} child slot {} has stale candidate subtree flags {:?}/{:?}",
                offscreen.slot().get(),
                child.slot().get(),
                actual_candidate_subtree_flags,
                expected_candidate_subtree_flags
            ),
            Self::UnsupportedRevealMetadata {
                root,
                offscreen,
                status,
                intent,
                feature,
                visibility_effect_required,
                visibility_flag_set,
            } => write!(
                formatter,
                "root {} Offscreen reveal metadata for slot {} is not the private hidden-to-visible handoff shape: status {}, intent {}, feature {}, visibility_required {}, visibility_flag_set {}",
                root.raw(),
                offscreen.slot().get(),
                status.as_str(),
                intent.as_str(),
                feature,
                visibility_effect_required,
                visibility_flag_set
            ),
            Self::RevealCommitBlockerMissing {
                root,
                offscreen,
                blocker,
            } => write!(
                formatter,
                "root {} Offscreen reveal commit handoff for slot {} is missing {:?} blocker",
                root.raw(),
                offscreen.slot().get(),
                blocker
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootOffscreenRevealCommitHandoffErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FinishedWork(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::RevealCommitLanesMismatch { .. }
            | Self::OffscreenLaneMetadataMissing { .. }
            | Self::ExpectedHostRootOffscreenChild { .. }
            | Self::ExpectedOffscreenFiber { .. }
            | Self::ExpectedRevealChild { .. }
            | Self::RevealChildTagMismatch { .. }
            | Self::RevealChildParentMismatch { .. }
            | Self::UnexpectedRevealChildSibling { .. }
            | Self::StaleRevealTransition { .. }
            | Self::StaleRevealChildFlags { .. }
            | Self::UnsupportedRevealMetadata { .. }
            | Self::RevealCommitBlockerMissing { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for HostRootOffscreenRevealCommitHandoffErrorForCanary
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWork(error)
    }
}

#[cfg(test)]
impl From<FiberTopologyError> for HostRootOffscreenRevealCommitHandoffErrorForCanary {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootTextUpdateCommitExecutionRequestForCanary {
    root: FiberRootId,
    root_token: StateNodeHandle,
    previous_current: FiberId,
    finished_work: FiberId,
    committed_current: FiberId,
    source_handoff_order: usize,
    commit_order: usize,
    request_order: usize,
    mutation_index: usize,
    mutation: HostRootMutationApplyRecord,
    status: HostRootTextUpdateCommitExecutionStatusForCanary,
    blockers: [HostRootTextUpdateCommitExecutionBlockerForCanary; 5],
}

#[cfg(test)]
impl HostRootTextUpdateCommitExecutionRequestForCanary {
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
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn committed_current(self) -> FiberId {
        self.committed_current
    }

    #[must_use]
    pub(crate) const fn source_handoff_order(self) -> usize {
        self.source_handoff_order
    }

    #[must_use]
    pub(crate) const fn commit_order(self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn request_order(self) -> usize {
        self.request_order
    }

    #[must_use]
    pub(crate) const fn mutation_index(self) -> usize {
        self.mutation_index
    }

    #[must_use]
    pub(crate) const fn mutation(self) -> HostRootMutationApplyRecord {
        self.mutation
    }

    #[must_use]
    pub(crate) const fn status(self) -> HostRootTextUpdateCommitExecutionStatusForCanary {
        self.status
    }

    #[must_use]
    pub(crate) const fn blockers(&self) -> &[HostRootTextUpdateCommitExecutionBlockerForCanary; 5] {
        &self.blockers
    }

    #[must_use]
    pub(crate) const fn private_test_host_text_mutation_allowed(self) -> bool {
        matches!(
            self.status,
            HostRootTextUpdateCommitExecutionStatusForCanary::ValidatedForTestHostMutation
        )
    }

    #[must_use]
    pub(crate) fn committed_current_is_finished_work(self) -> bool {
        self.committed_current == self.finished_work
    }

    #[must_use]
    pub(crate) fn previous_current_was_replaced(self) -> bool {
        self.previous_current != self.committed_current
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_renderer_mutation_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_renderer_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) fn private_blockers_intact_for_canary(&self) -> bool {
        self.blockers == HOST_ROOT_TEXT_UPDATE_COMMIT_EXECUTION_BLOCKERS
    }

    #[must_use]
    pub(crate) const fn with_finished_work_for_canary(mut self, finished_work: FiberId) -> Self {
        self.finished_work = finished_work;
        self
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootTextUpdateCommitExecutionStatusForCanary {
    ValidatedForTestHostMutation,
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootTextUpdateCommitExecutionBlockerForCanary {
    PublicRootRendering,
    PublicRendererHostMutation,
    ReactDomTextCompatibilityClaim,
    ReactTestRendererCompatibilityClaim,
    PublicCompatibilityClaim,
}

#[cfg(test)]
const HOST_ROOT_TEXT_UPDATE_COMMIT_EXECUTION_BLOCKERS:
    [HostRootTextUpdateCommitExecutionBlockerForCanary; 5] = [
    HostRootTextUpdateCommitExecutionBlockerForCanary::PublicRootRendering,
    HostRootTextUpdateCommitExecutionBlockerForCanary::PublicRendererHostMutation,
    HostRootTextUpdateCommitExecutionBlockerForCanary::ReactDomTextCompatibilityClaim,
    HostRootTextUpdateCommitExecutionBlockerForCanary::ReactTestRendererCompatibilityClaim,
    HostRootTextUpdateCommitExecutionBlockerForCanary::PublicCompatibilityClaim,
];

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostRootTextUpdateCommitExecutionErrorForCanary {
    StaleCommitHandoff {
        root: FiberRootId,
        expected_current: FiberId,
        actual_current: FiberId,
        finished_work: FiberId,
        finished_work_after_commit: Option<FiberId>,
        render_phase_work_after_commit: Option<FiberId>,
    },
    MissingMutationApplyRecord {
        root: FiberRootId,
        finished_work: FiberId,
        mutation_index: usize,
    },
    UnexpectedMutationApplyKind {
        root: FiberRootId,
        fiber: FiberId,
        expected: HostRootMutationApplyRecordKind,
        actual: HostRootMutationApplyRecordKind,
    },
    ForeignMutationApplyRecord {
        expected_root: FiberRootId,
        actual_root: FiberRootId,
        expected_finished_work: FiberId,
        actual_host_root: FiberId,
    },
    ExpectedHostTextMutation {
        root: FiberRootId,
        fiber: FiberId,
        tag: FiberTag,
    },
    MissingHostTextCurrent {
        root: FiberRootId,
        fiber: FiberId,
    },
    MissingHostTextStateNode {
        root: FiberRootId,
        fiber: FiberId,
    },
    HostTextUpdateFlagMissing {
        root: FiberRootId,
        fiber: FiberId,
        effect_flag: FiberFlags,
    },
}

#[cfg(test)]
impl Display for HostRootTextUpdateCommitExecutionErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::StaleCommitHandoff {
                root,
                expected_current,
                actual_current,
                finished_work,
                finished_work_after_commit,
                render_phase_work_after_commit,
            } => write!(
                formatter,
                "root {} stale HostText update commit handoff expected committed current fiber slot {}, found current fiber slot {}; finished work slot {}, pending finished work {:?}, render phase work {:?}",
                root.raw(),
                expected_current.slot().get(),
                actual_current.slot().get(),
                finished_work.slot().get(),
                finished_work_after_commit.map(|fiber| fiber.slot().get()),
                render_phase_work_after_commit.map(|fiber| fiber.slot().get())
            ),
            Self::MissingMutationApplyRecord {
                root,
                finished_work,
                mutation_index,
            } => write!(
                formatter,
                "root {} finished work fiber slot {} has no HostText update mutation apply record at index {}",
                root.raw(),
                finished_work.slot().get(),
                mutation_index
            ),
            Self::UnexpectedMutationApplyKind {
                root,
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} fiber slot {} expected {:?} mutation apply record, found {:?}",
                root.raw(),
                fiber.slot().get(),
                expected,
                actual
            ),
            Self::ForeignMutationApplyRecord {
                expected_root,
                actual_root,
                expected_finished_work,
                actual_host_root,
            } => write!(
                formatter,
                "HostText update mutation record for root {} host root slot {} cannot execute for root {} finished work slot {}",
                actual_root.raw(),
                actual_host_root.slot().get(),
                expected_root.raw(),
                expected_finished_work.slot().get()
            ),
            Self::ExpectedHostTextMutation { root, fiber, tag } => write!(
                formatter,
                "root {} HostText update execution expected HostText fiber slot {}, found {:?}",
                root.raw(),
                fiber.slot().get(),
                tag
            ),
            Self::MissingHostTextCurrent { root, fiber } => write!(
                formatter,
                "root {} HostText update execution requires an alternate current fiber for updated fiber slot {}",
                root.raw(),
                fiber.slot().get()
            ),
            Self::MissingHostTextStateNode { root, fiber } => write!(
                formatter,
                "root {} HostText update execution requires a text state node for fiber slot {}",
                root.raw(),
                fiber.slot().get()
            ),
            Self::HostTextUpdateFlagMissing {
                root,
                fiber,
                effect_flag,
            } => write!(
                formatter,
                "root {} HostText update execution expected UPDATE effect for fiber slot {}, found {:?}",
                root.raw(),
                fiber.slot().get(),
                effect_flag
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootTextUpdateCommitExecutionErrorForCanary {}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootDangerousHtmlTextResetCommitHandoffRecordForCanary {
    complete_work: HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
    execution_request: HostRootDangerousHtmlTextResetCommitExecutionRequestForCanary,
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "crate-private dangerousHTML/text reset handoff diagnostics expose fields for focused canaries"
)]
impl HostRootDangerousHtmlTextResetCommitHandoffRecordForCanary {
    #[must_use]
    pub(crate) const fn complete_work(
        &self,
    ) -> HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary {
        self.complete_work
    }

    #[must_use]
    pub(crate) const fn execution_request(
        &self,
    ) -> &HostRootDangerousHtmlTextResetCommitExecutionRequestForCanary {
        &self.execution_request
    }

    #[must_use]
    pub(crate) const fn finished_work_handoff(
        &self,
    ) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        &self.finished_work_handoff
    }

    #[must_use]
    pub(crate) const fn commit(&self) -> &HostRootCommitRecord {
        self.finished_work_handoff.commit()
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.execution_request.root()
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.execution_request.finished_work()
    }

    #[must_use]
    pub(crate) const fn source_handoff_order(&self) -> usize {
        self.execution_request.source_handoff_order()
    }

    #[must_use]
    pub(crate) const fn commit_order(&self) -> usize {
        self.execution_request.commit_order()
    }

    #[must_use]
    pub(crate) const fn request_order(&self) -> usize {
        self.execution_request.request_order()
    }

    #[must_use]
    pub(crate) const fn mutation(&self) -> HostRootMutationApplyRecord {
        self.execution_request.mutation()
    }

    #[must_use]
    pub(crate) const fn payload_kind(
        &self,
    ) -> HostComponentDangerousHtmlTextResetPayloadKindForCanary {
        self.complete_work.payload_kind()
    }

    #[must_use]
    pub(crate) const fn payload_kind_name(&self) -> &'static str {
        self.complete_work.payload_kind_name()
    }

    #[must_use]
    pub(crate) fn complete_metadata_matches_mutation(&self) -> bool {
        dangerous_html_text_reset_metadata_matches_mutation(
            self.complete_work,
            self.execution_request.mutation,
        )
    }

    #[must_use]
    pub(crate) const fn private_test_host_mutation_allowed(&self) -> bool {
        self.execution_request.private_test_host_mutation_allowed()
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(&self) -> bool {
        self.execution_request.public_root_rendering_blocked()
    }

    #[must_use]
    pub(crate) const fn public_renderer_mutation_blocked(&self) -> bool {
        self.execution_request.public_renderer_mutation_blocked()
    }

    #[must_use]
    pub(crate) const fn public_dom_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(&self) -> bool {
        false
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootDangerousHtmlTextResetCommitExecutionRequestForCanary {
    root: FiberRootId,
    root_token: StateNodeHandle,
    previous_current: FiberId,
    finished_work: FiberId,
    committed_current: FiberId,
    source_handoff_order: usize,
    commit_order: usize,
    request_order: usize,
    mutation_index: usize,
    mutation: HostRootMutationApplyRecord,
    complete_work: HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
    status: HostRootDangerousHtmlTextResetCommitExecutionStatusForCanary,
    blockers: [HostRootDangerousHtmlTextResetCommitExecutionBlockerForCanary; 5],
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "crate-private dangerousHTML/text reset execution request diagnostics expose fields for focused canaries"
)]
impl HostRootDangerousHtmlTextResetCommitExecutionRequestForCanary {
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
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn committed_current(self) -> FiberId {
        self.committed_current
    }

    #[must_use]
    pub(crate) const fn source_handoff_order(self) -> usize {
        self.source_handoff_order
    }

    #[must_use]
    pub(crate) const fn commit_order(self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn request_order(self) -> usize {
        self.request_order
    }

    #[must_use]
    pub(crate) const fn mutation_index(self) -> usize {
        self.mutation_index
    }

    #[must_use]
    pub(crate) const fn mutation(self) -> HostRootMutationApplyRecord {
        self.mutation
    }

    #[must_use]
    pub(crate) const fn complete_work(
        self,
    ) -> HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary {
        self.complete_work
    }

    #[must_use]
    pub(crate) const fn payload_kind(
        self,
    ) -> HostComponentDangerousHtmlTextResetPayloadKindForCanary {
        self.complete_work.payload_kind()
    }

    #[must_use]
    pub(crate) const fn status(
        self,
    ) -> HostRootDangerousHtmlTextResetCommitExecutionStatusForCanary {
        self.status
    }

    #[must_use]
    pub(crate) const fn blockers(
        &self,
    ) -> &[HostRootDangerousHtmlTextResetCommitExecutionBlockerForCanary; 5] {
        &self.blockers
    }

    #[must_use]
    pub(crate) const fn private_test_host_mutation_allowed(self) -> bool {
        matches!(
            self.status,
            HostRootDangerousHtmlTextResetCommitExecutionStatusForCanary::ValidatedForTestHostMutation
        )
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_renderer_mutation_blocked(self) -> bool {
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
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootDangerousHtmlTextResetCommitExecutionStatusForCanary {
    ValidatedForTestHostMutation,
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootDangerousHtmlTextResetCommitExecutionBlockerForCanary {
    PublicRootRendering,
    PublicRendererHostMutation,
    ReactDomDangerousHtmlTextResetCompatibilityClaim,
    ReactTestRendererCompatibilityClaim,
    PublicCompatibilityClaim,
}

#[cfg(test)]
const HOST_ROOT_DANGEROUS_HTML_TEXT_RESET_COMMIT_EXECUTION_BLOCKERS:
    [HostRootDangerousHtmlTextResetCommitExecutionBlockerForCanary; 5] = [
    HostRootDangerousHtmlTextResetCommitExecutionBlockerForCanary::PublicRootRendering,
    HostRootDangerousHtmlTextResetCommitExecutionBlockerForCanary::PublicRendererHostMutation,
    HostRootDangerousHtmlTextResetCommitExecutionBlockerForCanary::ReactDomDangerousHtmlTextResetCompatibilityClaim,
    HostRootDangerousHtmlTextResetCommitExecutionBlockerForCanary::ReactTestRendererCompatibilityClaim,
    HostRootDangerousHtmlTextResetCommitExecutionBlockerForCanary::PublicCompatibilityClaim,
];

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary {
    FinishedWork(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
    RootCommit(RootCommitError),
    MissingMutationApplyRecord {
        root: FiberRootId,
        finished_work: FiberId,
        mutation_index: usize,
    },
    UnexpectedMutationApplyKind {
        root: FiberRootId,
        fiber: FiberId,
        expected: HostRootMutationApplyRecordKind,
        actual: HostRootMutationApplyRecordKind,
    },
    MetadataRootMismatch {
        expected_root: FiberRootId,
        actual_root: FiberRootId,
    },
    MetadataFiberMismatch {
        root: FiberRootId,
        expected_fiber: FiberId,
        actual_fiber: FiberId,
    },
    MetadataCurrentMismatch {
        root: FiberRootId,
        expected_current: FiberId,
        actual_current: Option<FiberId>,
    },
    MetadataStateNodeMismatch {
        root: FiberRootId,
        fiber: FiberId,
        expected_state_node: StateNodeHandle,
        actual_state_node: StateNodeHandle,
    },
    MetadataPropsMismatch {
        root: FiberRootId,
        fiber: FiberId,
        expected_old_props: PropsHandle,
        actual_alternate_memoized_props: Option<PropsHandle>,
        expected_new_props: PropsHandle,
        actual_pending_props: PropsHandle,
        actual_memoized_props: PropsHandle,
    },
    HostComponentUpdateFlagMissing {
        root: FiberRootId,
        fiber: FiberId,
        effect_flag: FiberFlags,
    },
    PublicCompatibilityClaimed {
        root: FiberRootId,
        fiber: FiberId,
        payload_kind: HostComponentDangerousHtmlTextResetPayloadKindForCanary,
    },
}

#[cfg(test)]
impl Display for HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FinishedWork(error) => Display::fmt(error, formatter),
            Self::RootCommit(error) => Display::fmt(error, formatter),
            Self::MissingMutationApplyRecord {
                root,
                finished_work,
                mutation_index,
            } => write!(
                formatter,
                "root {} finished work fiber slot {} has no dangerousHTML/text reset HostComponent mutation apply record at index {}",
                root.raw(),
                finished_work.slot().get(),
                mutation_index
            ),
            Self::UnexpectedMutationApplyKind {
                root,
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} dangerousHTML/text reset handoff expected {:?} for fiber slot {}, found {:?}",
                root.raw(),
                expected,
                fiber.slot().get(),
                actual
            ),
            Self::MetadataRootMismatch {
                expected_root,
                actual_root,
            } => write!(
                formatter,
                "dangerousHTML/text reset complete-work metadata for root {} cannot commit on root {}",
                actual_root.raw(),
                expected_root.raw()
            ),
            Self::MetadataFiberMismatch {
                root,
                expected_fiber,
                actual_fiber,
            } => write!(
                formatter,
                "root {} dangerousHTML/text reset complete-work metadata expected HostComponent fiber slot {}, found mutation fiber slot {}",
                root.raw(),
                expected_fiber.slot().get(),
                actual_fiber.slot().get()
            ),
            Self::MetadataCurrentMismatch {
                root,
                expected_current,
                actual_current,
            } => write!(
                formatter,
                "root {} dangerousHTML/text reset complete-work metadata expected current fiber slot {}, found {:?}",
                root.raw(),
                expected_current.slot().get(),
                actual_current.map(|fiber| fiber.slot().get())
            ),
            Self::MetadataStateNodeMismatch {
                root,
                fiber,
                expected_state_node,
                actual_state_node,
            } => write!(
                formatter,
                "root {} dangerousHTML/text reset HostComponent fiber slot {} expected state node {}, found {}",
                root.raw(),
                fiber.slot().get(),
                expected_state_node.raw(),
                actual_state_node.raw()
            ),
            Self::MetadataPropsMismatch {
                root,
                fiber,
                expected_old_props,
                actual_alternate_memoized_props,
                expected_new_props,
                actual_pending_props,
                actual_memoized_props,
            } => write!(
                formatter,
                "root {} dangerousHTML/text reset HostComponent fiber slot {} stale props: expected old {} new {}, found alternate {:?} pending {} memoized {}",
                root.raw(),
                fiber.slot().get(),
                expected_old_props.raw(),
                expected_new_props.raw(),
                actual_alternate_memoized_props.map(PropsHandle::raw),
                actual_pending_props.raw(),
                actual_memoized_props.raw()
            ),
            Self::HostComponentUpdateFlagMissing {
                root,
                fiber,
                effect_flag,
            } => write!(
                formatter,
                "root {} dangerousHTML/text reset handoff expected UPDATE effect for HostComponent fiber slot {}, found {:?}",
                root.raw(),
                fiber.slot().get(),
                effect_flag
            ),
            Self::PublicCompatibilityClaimed {
                root,
                fiber,
                payload_kind,
            } => write!(
                formatter,
                "root {} HostComponent fiber slot {} cannot claim public DOM compatibility for private {} handoff",
                root.raw(),
                fiber.slot().get(),
                payload_kind
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FinishedWork(error) => Some(error.as_ref()),
            Self::RootCommit(error) => Some(error),
            Self::MissingMutationApplyRecord { .. }
            | Self::UnexpectedMutationApplyKind { .. }
            | Self::MetadataRootMismatch { .. }
            | Self::MetadataFiberMismatch { .. }
            | Self::MetadataCurrentMismatch { .. }
            | Self::MetadataStateNodeMismatch { .. }
            | Self::MetadataPropsMismatch { .. }
            | Self::HostComponentUpdateFlagMissing { .. }
            | Self::PublicCompatibilityClaimed { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWork(Box::new(error))
    }
}

#[cfg(test)]
impl From<RootCommitError> for HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary {
    fn from(error: RootCommitError) -> Self {
        Self::RootCommit(error)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootManagedChildCommitHandoffRecordForCanary {
    complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    execution_request: HostRootManagedChildCommitExecutionRequestForCanary,
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "crate-private managed child placement/delete handoff diagnostics expose fields for focused canaries"
)]
impl HostRootManagedChildCommitHandoffRecordForCanary {
    #[must_use]
    pub(crate) const fn complete_work(
        &self,
    ) -> HostComponentManagedChildCompleteWorkRecordForCanary {
        self.complete_work
    }

    #[must_use]
    pub(crate) const fn execution_request(
        &self,
    ) -> &HostRootManagedChildCommitExecutionRequestForCanary {
        &self.execution_request
    }

    #[must_use]
    pub(crate) const fn finished_work_handoff(
        &self,
    ) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        &self.finished_work_handoff
    }

    #[must_use]
    pub(crate) const fn commit(&self) -> &HostRootCommitRecord {
        self.finished_work_handoff.commit()
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.execution_request.root()
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.execution_request.finished_work()
    }

    #[must_use]
    pub(crate) const fn source_handoff_order(&self) -> usize {
        self.execution_request.source_handoff_order()
    }

    #[must_use]
    pub(crate) const fn commit_order(&self) -> usize {
        self.execution_request.commit_order()
    }

    #[must_use]
    pub(crate) const fn request_order(&self) -> usize {
        self.execution_request.request_order()
    }

    #[must_use]
    pub(crate) const fn kind(&self) -> HostComponentManagedChildMutationKindForCanary {
        self.complete_work.kind()
    }

    #[must_use]
    pub(crate) const fn kind_name(&self) -> &'static str {
        self.complete_work.kind_name()
    }

    #[must_use]
    pub(crate) const fn mutation(&self) -> HostRootMutationApplyRecord {
        self.execution_request.mutation()
    }

    #[must_use]
    pub(crate) fn complete_metadata_matches_mutation(&self) -> bool {
        managed_child_complete_metadata_matches_mutation(
            self.complete_work,
            self.execution_request.mutation,
        )
    }

    #[must_use]
    pub(crate) const fn private_test_host_mutation_allowed(&self) -> bool {
        self.execution_request.private_test_host_mutation_allowed()
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(&self) -> bool {
        self.execution_request.public_root_rendering_blocked()
    }

    #[must_use]
    pub(crate) const fn public_renderer_mutation_blocked(&self) -> bool {
        self.execution_request.public_renderer_mutation_blocked()
    }

    #[must_use]
    pub(crate) const fn public_dom_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(&self) -> bool {
        false
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary {
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    execution_request: HostRootManagedChildSiblingOrderCommitExecutionRequestForCanary,
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "crate-private managed child sibling-order handoff diagnostics expose fields for focused canaries"
)]
impl HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary {
    #[must_use]
    pub(crate) const fn complete_work(
        &self,
    ) -> HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary {
        self.complete_work
    }

    #[must_use]
    pub(crate) const fn execution_request(
        &self,
    ) -> &HostRootManagedChildSiblingOrderCommitExecutionRequestForCanary {
        &self.execution_request
    }

    #[must_use]
    pub(crate) const fn finished_work_handoff(
        &self,
    ) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        &self.finished_work_handoff
    }

    #[must_use]
    pub(crate) const fn commit(&self) -> &HostRootCommitRecord {
        self.finished_work_handoff.commit()
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.execution_request.root()
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.execution_request.finished_work()
    }

    #[must_use]
    pub(crate) const fn source_handoff_order(&self) -> usize {
        self.execution_request.source_handoff_order()
    }

    #[must_use]
    pub(crate) const fn commit_order(&self) -> usize {
        self.execution_request.commit_order()
    }

    #[must_use]
    pub(crate) const fn request_order(&self) -> usize {
        self.execution_request.request_order()
    }

    #[must_use]
    pub(crate) const fn kind(&self) -> HostComponentManagedChildMutationKindForCanary {
        self.complete_work.kind()
    }

    #[must_use]
    pub(crate) const fn order_sibling(&self) -> FiberId {
        self.complete_work.order_sibling()
    }

    #[must_use]
    pub(crate) const fn order_sibling_state_node(&self) -> StateNodeHandle {
        self.complete_work.order_sibling_state_node()
    }

    #[must_use]
    pub(crate) const fn order_evidence_name(&self) -> &'static str {
        self.complete_work.order_evidence_name()
    }

    #[must_use]
    pub(crate) const fn mutation(&self) -> HostRootMutationApplyRecord {
        self.execution_request.mutation()
    }

    #[must_use]
    pub(crate) fn complete_metadata_matches_mutation(&self) -> bool {
        managed_child_sibling_order_complete_metadata_matches_mutation(
            self.complete_work,
            self.execution_request.mutation,
        )
    }

    #[must_use]
    pub(crate) const fn private_test_host_mutation_allowed(&self) -> bool {
        self.execution_request.private_test_host_mutation_allowed()
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(&self) -> bool {
        self.execution_request.public_root_rendering_blocked()
    }

    #[must_use]
    pub(crate) const fn public_renderer_mutation_blocked(&self) -> bool {
        self.execution_request.public_renderer_mutation_blocked()
    }

    #[must_use]
    pub(crate) const fn public_dom_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(&self) -> bool {
        false
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootManagedChildCommitExecutionRequestForCanary {
    root: FiberRootId,
    root_token: StateNodeHandle,
    previous_current: FiberId,
    finished_work: FiberId,
    committed_current: FiberId,
    source_handoff_order: usize,
    commit_order: usize,
    request_order: usize,
    mutation_index: usize,
    mutation: HostRootMutationApplyRecord,
    complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    status: HostRootManagedChildCommitExecutionStatusForCanary,
    blockers: [HostRootManagedChildCommitExecutionBlockerForCanary; 6],
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "crate-private managed child execution request diagnostics expose fields for focused canaries"
)]
impl HostRootManagedChildCommitExecutionRequestForCanary {
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
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn committed_current(self) -> FiberId {
        self.committed_current
    }

    #[must_use]
    pub(crate) const fn source_handoff_order(self) -> usize {
        self.source_handoff_order
    }

    #[must_use]
    pub(crate) const fn commit_order(self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn request_order(self) -> usize {
        self.request_order
    }

    #[must_use]
    pub(crate) const fn mutation_index(self) -> usize {
        self.mutation_index
    }

    #[must_use]
    pub(crate) const fn mutation(self) -> HostRootMutationApplyRecord {
        self.mutation
    }

    #[must_use]
    pub(crate) const fn complete_work(
        self,
    ) -> HostComponentManagedChildCompleteWorkRecordForCanary {
        self.complete_work
    }

    #[must_use]
    pub(crate) const fn kind(self) -> HostComponentManagedChildMutationKindForCanary {
        self.complete_work.kind()
    }

    #[must_use]
    pub(crate) const fn status(self) -> HostRootManagedChildCommitExecutionStatusForCanary {
        self.status
    }

    #[must_use]
    pub(crate) const fn blockers(
        &self,
    ) -> &[HostRootManagedChildCommitExecutionBlockerForCanary; 6] {
        &self.blockers
    }

    #[must_use]
    pub(crate) const fn private_test_host_mutation_allowed(self) -> bool {
        matches!(
            self.status,
            HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation
        )
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_renderer_mutation_blocked(self) -> bool {
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
    pub(crate) const fn hydration_events_refs_resources_forms_claimed(self) -> bool {
        false
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootManagedChildSiblingOrderCommitExecutionRequestForCanary {
    root: FiberRootId,
    root_token: StateNodeHandle,
    previous_current: FiberId,
    finished_work: FiberId,
    committed_current: FiberId,
    source_handoff_order: usize,
    commit_order: usize,
    request_order: usize,
    mutation_index: usize,
    mutation: HostRootMutationApplyRecord,
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    status: HostRootManagedChildCommitExecutionStatusForCanary,
    blockers: [HostRootManagedChildCommitExecutionBlockerForCanary; 6],
}

#[cfg(test)]
#[allow(
    dead_code,
    reason = "crate-private managed child sibling-order request diagnostics expose fields for focused canaries"
)]
impl HostRootManagedChildSiblingOrderCommitExecutionRequestForCanary {
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
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn committed_current(self) -> FiberId {
        self.committed_current
    }

    #[must_use]
    pub(crate) const fn source_handoff_order(self) -> usize {
        self.source_handoff_order
    }

    #[must_use]
    pub(crate) const fn commit_order(self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn request_order(self) -> usize {
        self.request_order
    }

    #[must_use]
    pub(crate) const fn mutation_index(self) -> usize {
        self.mutation_index
    }

    #[must_use]
    pub(crate) const fn mutation(self) -> HostRootMutationApplyRecord {
        self.mutation
    }

    #[must_use]
    pub(crate) const fn complete_work(
        self,
    ) -> HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary {
        self.complete_work
    }

    #[must_use]
    pub(crate) const fn kind(self) -> HostComponentManagedChildMutationKindForCanary {
        self.complete_work.kind()
    }

    #[must_use]
    pub(crate) const fn order_sibling(self) -> FiberId {
        self.complete_work.order_sibling()
    }

    #[must_use]
    pub(crate) const fn order_sibling_state_node(self) -> StateNodeHandle {
        self.complete_work.order_sibling_state_node()
    }

    #[must_use]
    pub(crate) const fn order_evidence_name(self) -> &'static str {
        self.complete_work.order_evidence_name()
    }

    #[must_use]
    pub(crate) const fn status(self) -> HostRootManagedChildCommitExecutionStatusForCanary {
        self.status
    }

    #[must_use]
    pub(crate) const fn blockers(
        &self,
    ) -> &[HostRootManagedChildCommitExecutionBlockerForCanary; 6] {
        &self.blockers
    }

    #[must_use]
    pub(crate) const fn private_test_host_mutation_allowed(self) -> bool {
        matches!(
            self.status,
            HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation
        )
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_renderer_mutation_blocked(self) -> bool {
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
    pub(crate) const fn hydration_events_refs_resources_forms_claimed(self) -> bool {
        false
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootManagedChildCommitExecutionStatusForCanary {
    ValidatedForTestHostMutation,
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootManagedChildCommitExecutionBlockerForCanary {
    PublicRootRendering,
    PublicRendererHostMutation,
    ReactDomManagedChildCompatibilityClaim,
    ReactTestRendererCompatibilityClaim,
    HydrationEventsRefsResourcesFormsControlledInputClaim,
    PublicCompatibilityClaim,
}

#[cfg(test)]
const HOST_ROOT_MANAGED_CHILD_COMMIT_EXECUTION_BLOCKERS:
    [HostRootManagedChildCommitExecutionBlockerForCanary; 6] = [
    HostRootManagedChildCommitExecutionBlockerForCanary::PublicRootRendering,
    HostRootManagedChildCommitExecutionBlockerForCanary::PublicRendererHostMutation,
    HostRootManagedChildCommitExecutionBlockerForCanary::ReactDomManagedChildCompatibilityClaim,
    HostRootManagedChildCommitExecutionBlockerForCanary::ReactTestRendererCompatibilityClaim,
    HostRootManagedChildCommitExecutionBlockerForCanary::HydrationEventsRefsResourcesFormsControlledInputClaim,
    HostRootManagedChildCommitExecutionBlockerForCanary::PublicCompatibilityClaim,
];

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootManagedChildCommitHandoffErrorForCanary {
    FinishedWork(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
    RootCommit(RootCommitError),
    MissingMutationApplyRecord {
        root: FiberRootId,
        finished_work: FiberId,
        mutation_index: usize,
    },
    UnexpectedMutationApplyKind {
        root: FiberRootId,
        fiber: FiberId,
        expected: HostRootMutationApplyRecordKind,
        actual: HostRootMutationApplyRecordKind,
    },
    UnexpectedMutationApplySource {
        root: FiberRootId,
        fiber: FiberId,
        kind: HostComponentManagedChildMutationKindForCanary,
        actual: HostRootMutationApplyRecordSource,
    },
    MetadataRootMismatch {
        expected_root: FiberRootId,
        actual_root: FiberRootId,
    },
    MetadataParentMismatch {
        root: FiberRootId,
        expected_parent: FiberId,
        actual_parent: FiberId,
        actual_parent_tag: FiberTag,
    },
    MetadataParentStateNodeMismatch {
        root: FiberRootId,
        parent: FiberId,
        expected_state_node: StateNodeHandle,
        actual_state_node: StateNodeHandle,
    },
    MetadataChildMismatch {
        root: FiberRootId,
        expected_child: FiberId,
        actual_child: FiberId,
    },
    MetadataChildTagMismatch {
        root: FiberRootId,
        child: FiberId,
        expected_tag: FiberTag,
        actual_tag: FiberTag,
    },
    MetadataChildStateNodeMismatch {
        root: FiberRootId,
        child: FiberId,
        expected_state_node: StateNodeHandle,
        actual_state_node: StateNodeHandle,
    },
    MetadataChildPropsMismatch {
        root: FiberRootId,
        child: FiberId,
        expected_pending_props: PropsHandle,
        expected_memoized_props: PropsHandle,
        actual_pending_props: PropsHandle,
        actual_memoized_props: PropsHandle,
    },
    MetadataChildAlternateMismatch {
        root: FiberRootId,
        child: FiberId,
        expected_alternate: Option<FiberId>,
        actual_alternate: Option<FiberId>,
    },
    MetadataEffectFlagMissing {
        root: FiberRootId,
        fiber: FiberId,
        expected: FiberFlags,
        actual: FiberFlags,
    },
    MetadataPlacementSiblingMismatch {
        root: FiberRootId,
        fiber: FiberId,
        placement_sibling: Option<HostRootPlacementSiblingRecord>,
    },
    MetadataOrderSiblingMismatch {
        root: FiberRootId,
        fiber: FiberId,
        expected_sibling: FiberId,
        actual_sibling: Option<FiberId>,
    },
    MetadataOrderSiblingTagMismatch {
        root: FiberRootId,
        sibling: FiberId,
        expected_tag: FiberTag,
        actual_tag: FiberTag,
    },
    MetadataOrderSiblingStateNodeMismatch {
        root: FiberRootId,
        sibling: FiberId,
        expected_state_node: StateNodeHandle,
        actual_state_node: StateNodeHandle,
    },
    MetadataOrderSiblingPropsMismatch {
        root: FiberRootId,
        sibling: FiberId,
        expected_pending_props: PropsHandle,
        expected_memoized_props: PropsHandle,
        actual_pending_props: PropsHandle,
        actual_memoized_props: PropsHandle,
    },
    MetadataOrderSiblingAlternateMismatch {
        root: FiberRootId,
        sibling: FiberId,
        expected_alternate: Option<FiberId>,
        actual_alternate: Option<FiberId>,
    },
    MetadataPreviousSiblingOrderMismatch {
        root: FiberRootId,
        parent: FiberId,
        deleted_child: FiberId,
        expected_previous_sibling: FiberId,
        actual_previous_sibling: Option<FiberId>,
    },
    MetadataDeletionListMismatch {
        root: FiberRootId,
        fiber: FiberId,
        expected: Option<DeletionListId>,
        actual: HostRootMutationApplyRecordSource,
    },
    PublicCompatibilityClaimed {
        root: FiberRootId,
        fiber: FiberId,
        kind: HostComponentManagedChildMutationKindForCanary,
    },
}

#[cfg(test)]
impl Display for HostRootManagedChildCommitHandoffErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FinishedWork(error) => Display::fmt(error, formatter),
            Self::RootCommit(error) => Display::fmt(error, formatter),
            Self::MissingMutationApplyRecord {
                root,
                finished_work,
                mutation_index,
            } => write!(
                formatter,
                "root {} finished work fiber slot {} has no managed child mutation apply record at index {}",
                root.raw(),
                finished_work.slot().get(),
                mutation_index
            ),
            Self::UnexpectedMutationApplyKind {
                root,
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} managed child handoff expected {:?} for fiber slot {}, found {:?}",
                root.raw(),
                expected,
                fiber.slot().get(),
                actual
            ),
            Self::UnexpectedMutationApplySource {
                root,
                fiber,
                kind,
                actual,
            } => write!(
                formatter,
                "root {} managed child {kind} handoff expected matching source for fiber slot {}, found {:?}",
                root.raw(),
                fiber.slot().get(),
                actual
            ),
            Self::MetadataRootMismatch {
                expected_root,
                actual_root,
            } => write!(
                formatter,
                "managed child complete-work metadata for root {} cannot commit on root {}",
                actual_root.raw(),
                expected_root.raw()
            ),
            Self::MetadataParentMismatch {
                root,
                expected_parent,
                actual_parent,
                actual_parent_tag,
            } => write!(
                formatter,
                "root {} managed child metadata expected HostComponent parent {}, found parent {} {:?}",
                root.raw(),
                expected_parent.slot().get(),
                actual_parent.slot().get(),
                actual_parent_tag
            ),
            Self::MetadataParentStateNodeMismatch {
                root,
                parent,
                expected_state_node,
                actual_state_node,
            } => write!(
                formatter,
                "root {} managed child parent {} expected state node {}, found {}",
                root.raw(),
                parent.slot().get(),
                expected_state_node.raw(),
                actual_state_node.raw()
            ),
            Self::MetadataChildMismatch {
                root,
                expected_child,
                actual_child,
            } => write!(
                formatter,
                "root {} managed child metadata expected child {}, found {}",
                root.raw(),
                expected_child.slot().get(),
                actual_child.slot().get()
            ),
            Self::MetadataChildTagMismatch {
                root,
                child,
                expected_tag,
                actual_tag,
            } => write!(
                formatter,
                "root {} managed child {} expected {:?}, found {:?}",
                root.raw(),
                child.slot().get(),
                expected_tag,
                actual_tag
            ),
            Self::MetadataChildStateNodeMismatch {
                root,
                child,
                expected_state_node,
                actual_state_node,
            } => write!(
                formatter,
                "root {} managed child {} expected state node {}, found {}",
                root.raw(),
                child.slot().get(),
                expected_state_node.raw(),
                actual_state_node.raw()
            ),
            Self::MetadataChildPropsMismatch {
                root,
                child,
                expected_pending_props,
                expected_memoized_props,
                actual_pending_props,
                actual_memoized_props,
            } => write!(
                formatter,
                "root {} managed child {} stale props: expected pending {} memoized {}, found pending {} memoized {}",
                root.raw(),
                child.slot().get(),
                expected_pending_props.raw(),
                expected_memoized_props.raw(),
                actual_pending_props.raw(),
                actual_memoized_props.raw()
            ),
            Self::MetadataChildAlternateMismatch {
                root,
                child,
                expected_alternate,
                actual_alternate,
            } => write!(
                formatter,
                "root {} managed child {} expected alternate {:?}, found {:?}",
                root.raw(),
                child.slot().get(),
                expected_alternate.map(|fiber| fiber.slot().get()),
                actual_alternate.map(|fiber| fiber.slot().get())
            ),
            Self::MetadataEffectFlagMissing {
                root,
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} managed child fiber {} expected effect {:?}, found {:?}",
                root.raw(),
                fiber.slot().get(),
                expected,
                actual
            ),
            Self::MetadataPlacementSiblingMismatch {
                root,
                fiber,
                placement_sibling,
            } => write!(
                formatter,
                "root {} managed child placement fiber {} expected matching sibling metadata, found {:?}",
                root.raw(),
                fiber.slot().get(),
                placement_sibling
            ),
            Self::MetadataOrderSiblingMismatch {
                root,
                fiber,
                expected_sibling,
                actual_sibling,
            } => write!(
                formatter,
                "root {} managed child fiber {} expected order sibling {}, found {:?}",
                root.raw(),
                fiber.slot().get(),
                expected_sibling.slot().get(),
                actual_sibling.map(|fiber| fiber.slot().get())
            ),
            Self::MetadataOrderSiblingTagMismatch {
                root,
                sibling,
                expected_tag,
                actual_tag,
            } => write!(
                formatter,
                "root {} managed child order sibling {} expected {:?}, found {:?}",
                root.raw(),
                sibling.slot().get(),
                expected_tag,
                actual_tag
            ),
            Self::MetadataOrderSiblingStateNodeMismatch {
                root,
                sibling,
                expected_state_node,
                actual_state_node,
            } => write!(
                formatter,
                "root {} managed child order sibling {} expected state node {}, found {}",
                root.raw(),
                sibling.slot().get(),
                expected_state_node.raw(),
                actual_state_node.raw()
            ),
            Self::MetadataOrderSiblingPropsMismatch {
                root,
                sibling,
                expected_pending_props,
                expected_memoized_props,
                actual_pending_props,
                actual_memoized_props,
            } => write!(
                formatter,
                "root {} managed child order sibling {} stale props: expected pending {} memoized {}, found pending {} memoized {}",
                root.raw(),
                sibling.slot().get(),
                expected_pending_props.raw(),
                expected_memoized_props.raw(),
                actual_pending_props.raw(),
                actual_memoized_props.raw()
            ),
            Self::MetadataOrderSiblingAlternateMismatch {
                root,
                sibling,
                expected_alternate,
                actual_alternate,
            } => write!(
                formatter,
                "root {} managed child order sibling {} expected alternate {:?}, found {:?}",
                root.raw(),
                sibling.slot().get(),
                expected_alternate.map(|fiber| fiber.slot().get()),
                actual_alternate.map(|fiber| fiber.slot().get())
            ),
            Self::MetadataPreviousSiblingOrderMismatch {
                root,
                parent,
                deleted_child,
                expected_previous_sibling,
                actual_previous_sibling,
            } => write!(
                formatter,
                "root {} managed child delete parent {} child {} expected previous sibling {}, found {:?}",
                root.raw(),
                parent.slot().get(),
                deleted_child.slot().get(),
                expected_previous_sibling.slot().get(),
                actual_previous_sibling.map(|fiber| fiber.slot().get())
            ),
            Self::MetadataDeletionListMismatch {
                root,
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} managed child delete fiber {} expected deletion list {:?}, found {:?}",
                root.raw(),
                fiber.slot().get(),
                expected.map(DeletionListId::index),
                actual
            ),
            Self::PublicCompatibilityClaimed { root, fiber, kind } => write!(
                formatter,
                "root {} managed child fiber {} cannot claim public compatibility for private {kind} handoff",
                root.raw(),
                fiber.slot().get()
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootManagedChildCommitHandoffErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FinishedWork(error) => Some(error.as_ref()),
            Self::RootCommit(error) => Some(error),
            Self::MissingMutationApplyRecord { .. }
            | Self::UnexpectedMutationApplyKind { .. }
            | Self::UnexpectedMutationApplySource { .. }
            | Self::MetadataRootMismatch { .. }
            | Self::MetadataParentMismatch { .. }
            | Self::MetadataParentStateNodeMismatch { .. }
            | Self::MetadataChildMismatch { .. }
            | Self::MetadataChildTagMismatch { .. }
            | Self::MetadataChildStateNodeMismatch { .. }
            | Self::MetadataChildPropsMismatch { .. }
            | Self::MetadataChildAlternateMismatch { .. }
            | Self::MetadataEffectFlagMissing { .. }
            | Self::MetadataPlacementSiblingMismatch { .. }
            | Self::MetadataOrderSiblingMismatch { .. }
            | Self::MetadataOrderSiblingTagMismatch { .. }
            | Self::MetadataOrderSiblingStateNodeMismatch { .. }
            | Self::MetadataOrderSiblingPropsMismatch { .. }
            | Self::MetadataOrderSiblingAlternateMismatch { .. }
            | Self::MetadataPreviousSiblingOrderMismatch { .. }
            | Self::MetadataDeletionListMismatch { .. }
            | Self::PublicCompatibilityClaimed { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for HostRootManagedChildCommitHandoffErrorForCanary
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWork(Box::new(error))
    }
}

#[cfg(test)]
impl From<RootCommitError> for HostRootManagedChildCommitHandoffErrorForCanary {
    fn from(error: RootCommitError) -> Self {
        Self::RootCommit(error)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootContextProviderUpdateCommitHandoffErrorForCanary {
    RootCommit(RootCommitError),
    IncompleteFinishedWorkHandoff {
        root: FiberRootId,
        finished_work: FiberId,
    },
    ContextUpdateRootMismatch {
        expected_root: FiberRootId,
        actual_root: FiberRootId,
    },
    ContextUpdateFinishedWorkMismatch {
        root: FiberRootId,
        expected_finished_work: FiberId,
        actual_host_root_work_in_progress: FiberId,
    },
    ContextUpdateDidNotMarkChangedConsumers {
        root: FiberRootId,
        expected_marked_count: usize,
        actual_marked_count: usize,
    },
    ContextUpdateConsumerLaneMismatch {
        root: FiberRootId,
        consumer: FiberId,
        expected_lanes: Lanes,
        actual_lanes: Lanes,
    },
    ContextUpdateConsumerNotCommitted {
        root: FiberRootId,
        finished_work: FiberId,
        consumer: FiberId,
    },
    ContextUpdateAncestorChildLanesMismatch {
        root: FiberRootId,
        fiber: FiberId,
        expected_lanes: Lanes,
        actual_child_lanes: Lanes,
    },
    ContextUpdateRootPendingLanesMismatch {
        root: FiberRootId,
        expected_lanes: Lanes,
        actual_pending_lanes: Lanes,
    },
}

#[cfg(test)]
impl Display for HostRootContextProviderUpdateCommitHandoffErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::RootCommit(error) => Display::fmt(error, formatter),
            Self::IncompleteFinishedWorkHandoff {
                root,
                finished_work,
            } => write!(
                formatter,
                "root {} context-provider update commit handoff requires a proven finished-work commit for fiber slot {}",
                root.raw(),
                finished_work.slot().get()
            ),
            Self::ContextUpdateRootMismatch {
                expected_root,
                actual_root,
            } => write!(
                formatter,
                "context-provider update commit handoff expected root {}, found root {}",
                expected_root.raw(),
                actual_root.raw()
            ),
            Self::ContextUpdateFinishedWorkMismatch {
                root,
                expected_finished_work,
                actual_host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} context-provider update commit handoff expected HostRoot work-in-progress fiber slot {}, found slot {}",
                root.raw(),
                expected_finished_work.slot().get(),
                actual_host_root_work_in_progress.slot().get()
            ),
            Self::ContextUpdateDidNotMarkChangedConsumers {
                root,
                expected_marked_count,
                actual_marked_count,
            } => write!(
                formatter,
                "root {} context-provider update commit handoff expected {} marked changed consumers, found {}",
                root.raw(),
                expected_marked_count,
                actual_marked_count
            ),
            Self::ContextUpdateConsumerLaneMismatch {
                root,
                consumer,
                expected_lanes,
                actual_lanes,
            } => write!(
                formatter,
                "root {} context-provider update consumer {} lanes {:?} do not contain {:?} at commit",
                root.raw(),
                consumer.slot().get(),
                actual_lanes,
                expected_lanes
            ),
            Self::ContextUpdateConsumerNotCommitted {
                root,
                finished_work,
                consumer,
            } => write!(
                formatter,
                "root {} context-provider update consumer {} is not in committed finished-work subtree rooted at {}",
                root.raw(),
                consumer.slot().get(),
                finished_work.slot().get()
            ),
            Self::ContextUpdateAncestorChildLanesMismatch {
                root,
                fiber,
                expected_lanes,
                actual_child_lanes,
            } => write!(
                formatter,
                "root {} context-provider update ancestor {} child lanes {:?} do not contain {:?} at commit",
                root.raw(),
                fiber.slot().get(),
                actual_child_lanes,
                expected_lanes
            ),
            Self::ContextUpdateRootPendingLanesMismatch {
                root,
                expected_lanes,
                actual_pending_lanes,
            } => write!(
                formatter,
                "root {} context-provider update pending lanes {:?} do not retain {:?} after commit",
                root.raw(),
                actual_pending_lanes,
                expected_lanes
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootContextProviderUpdateCommitHandoffErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::RootCommit(error) => Some(error),
            Self::IncompleteFinishedWorkHandoff { .. }
            | Self::ContextUpdateRootMismatch { .. }
            | Self::ContextUpdateFinishedWorkMismatch { .. }
            | Self::ContextUpdateDidNotMarkChangedConsumers { .. }
            | Self::ContextUpdateConsumerLaneMismatch { .. }
            | Self::ContextUpdateConsumerNotCommitted { .. }
            | Self::ContextUpdateAncestorChildLanesMismatch { .. }
            | Self::ContextUpdateRootPendingLanesMismatch { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<RootCommitError> for HostRootContextProviderUpdateCommitHandoffErrorForCanary {
    fn from(error: RootCommitError) -> Self {
        Self::RootCommit(error)
    }
}

#[cfg(test)]
impl From<FiberTopologyError> for HostRootContextProviderUpdateCommitHandoffErrorForCanary {
    fn from(error: FiberTopologyError) -> Self {
        Self::RootCommit(RootCommitError::from(error))
    }
}

#[cfg(test)]
impl From<FiberRootStoreError> for HostRootContextProviderUpdateCommitHandoffErrorForCanary {
    fn from(error: FiberRootStoreError) -> Self {
        Self::RootCommit(RootCommitError::from(error))
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootFinishedWorkCommitHandoffErrorForCanary {
    MissingFinishedWorkRecord {
        root: FiberRootId,
        finished_work: FiberId,
    },
    ForeignFinishedWorkRecord {
        expected_root: FiberRootId,
        actual_root: FiberRootId,
        expected_root_token: StateNodeHandle,
        actual_root_token: StateNodeHandle,
    },
    StaleFinishedWorkRecord {
        root: FiberRootId,
        expected_current: FiberId,
        actual_current: FiberId,
        expected_pending_work: Option<FiberId>,
        actual_pending_work: Option<FiberId>,
        finished_work: FiberId,
    },
    AlreadyCommittedFinishedWorkRecord {
        root: FiberRootId,
        current: FiberId,
        finished_work: FiberId,
        pending_work_after_commit: Option<FiberId>,
        handoff_order: usize,
    },
    FinishedWorkRecordLanesMismatch {
        root: FiberRootId,
        expected_render_lanes: Lanes,
        actual_render_lanes: Lanes,
        expected_remaining_lanes: Lanes,
        actual_remaining_lanes: Lanes,
        expected_pending_lanes: Lanes,
        actual_pending_lanes: Lanes,
    },
    FinishedWorkRootMetadataMismatch {
        root: FiberRootId,
        expected_finished_work: Option<FiberId>,
        actual_finished_work: Option<FiberId>,
        expected_finished_lanes: Lanes,
        actual_finished_lanes: Lanes,
    },
    Commit(RootCommitError),
}

#[cfg(test)]
impl Display for HostRootFinishedWorkCommitHandoffErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingFinishedWorkRecord {
                root,
                finished_work,
            } => write!(
                formatter,
                "root {} has no finished-work-to-commit record for finished work fiber slot {}",
                root.raw(),
                finished_work.slot().get()
            ),
            Self::ForeignFinishedWorkRecord {
                expected_root,
                actual_root,
                expected_root_token,
                actual_root_token,
            } => write!(
                formatter,
                "finished-work-to-commit record for root {} token {} cannot be used for root {} token {}",
                actual_root.raw(),
                actual_root_token.raw(),
                expected_root.raw(),
                expected_root_token.raw()
            ),
            Self::StaleFinishedWorkRecord {
                root,
                expected_current,
                actual_current,
                expected_pending_work,
                actual_pending_work,
                finished_work,
            } => write!(
                formatter,
                "root {} stale finished-work-to-commit record for fiber slot {} expected current fiber slot {} and pending work {:?}, found current fiber slot {} and pending work {:?}",
                root.raw(),
                finished_work.slot().get(),
                expected_current.slot().get(),
                expected_pending_work.map(|fiber| fiber.slot().get()),
                actual_current.slot().get(),
                actual_pending_work.map(|fiber| fiber.slot().get())
            ),
            Self::AlreadyCommittedFinishedWorkRecord {
                root,
                current,
                finished_work,
                pending_work_after_commit,
                handoff_order,
            } => write!(
                formatter,
                "root {} finished-work-to-commit record order {} for fiber slot {} was already committed as current fiber slot {}; pending work after commit is {:?}",
                root.raw(),
                handoff_order,
                finished_work.slot().get(),
                current.slot().get(),
                pending_work_after_commit.map(|fiber| fiber.slot().get())
            ),
            Self::FinishedWorkRecordLanesMismatch {
                root,
                expected_render_lanes,
                actual_render_lanes,
                expected_remaining_lanes,
                actual_remaining_lanes,
                expected_pending_lanes,
                actual_pending_lanes,
            } => write!(
                formatter,
                "root {} finished-work-to-commit record lanes render {:?}/{:?}, remaining {:?}/{:?}, pending {:?}/{:?} do not match",
                root.raw(),
                actual_render_lanes,
                expected_render_lanes,
                actual_remaining_lanes,
                expected_remaining_lanes,
                actual_pending_lanes,
                expected_pending_lanes
            ),
            Self::FinishedWorkRootMetadataMismatch {
                root,
                expected_finished_work,
                actual_finished_work,
                expected_finished_lanes,
                actual_finished_lanes,
            } => write!(
                formatter,
                "root {} finished-work metadata {:?}/{:?} does not match pending commit record {:?}/{:?}",
                root.raw(),
                actual_finished_work.map(|fiber| fiber.slot().get()),
                actual_finished_lanes,
                expected_finished_work.map(|fiber| fiber.slot().get()),
                expected_finished_lanes
            ),
            Self::Commit(error) => Display::fmt(error, formatter),
        }
    }
}

#[cfg(test)]
impl Error for HostRootFinishedWorkCommitHandoffErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Commit(error) => Some(error),
            Self::MissingFinishedWorkRecord { .. }
            | Self::ForeignFinishedWorkRecord { .. }
            | Self::StaleFinishedWorkRecord { .. }
            | Self::AlreadyCommittedFinishedWorkRecord { .. }
            | Self::FinishedWorkRecordLanesMismatch { .. }
            | Self::FinishedWorkRootMetadataMismatch { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<RootCommitError> for HostRootFinishedWorkCommitHandoffErrorForCanary {
    fn from(error: RootCommitError) -> Self {
        Self::Commit(error)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RootCommitErrorOptionCallbackRecord {
    root: FiberRootId,
    finished_work: Option<FiberId>,
    finished_lanes: Lanes,
    error: RootCommitError,
    error_option_callbacks: RootErrorOptionCallbackRecord,
}

#[allow(
    dead_code,
    reason = "crate-private commit error option metadata for future root error routing"
)]
impl RootCommitErrorOptionCallbackRecord {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> Option<FiberId> {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn finished_lanes(&self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub(crate) const fn error(&self) -> &RootCommitError {
        &self.error
    }

    #[must_use]
    pub(crate) const fn error_option_callbacks(&self) -> RootErrorOptionCallbackRecord {
        self.error_option_callbacks
    }

    #[must_use]
    pub(crate) const fn on_uncaught_error(&self) -> RootErrorCallbackHandle {
        self.error_option_callbacks.on_uncaught_error()
    }

    #[must_use]
    pub(crate) const fn on_caught_error(&self) -> RootErrorCallbackHandle {
        self.error_option_callbacks.on_caught_error()
    }

    #[must_use]
    pub(crate) const fn on_recoverable_error(&self) -> RootRecoverableErrorCallbackHandle {
        self.error_option_callbacks.on_recoverable_error()
    }

    #[must_use]
    pub(crate) const fn has_configured_error_callback(&self) -> bool {
        self.error_option_callbacks.has_configured_error_callback()
    }

    #[must_use]
    pub(crate) const fn root_error_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_error_boundaries_enabled(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn recoverable_error_compatibility_claimed(&self) -> bool {
        false
    }
}

#[allow(
    dead_code,
    reason = "crate-private commit error option metadata for future root error routing"
)]
pub(crate) fn record_root_commit_error_option_callbacks<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    finished_work: Option<FiberId>,
    finished_lanes: Lanes,
    error: RootCommitError,
) -> Result<RootCommitErrorOptionCallbackRecord, RootCommitError> {
    let root = store.root(root_id)?;
    Ok(RootCommitErrorOptionCallbackRecord {
        root: root_id,
        finished_work,
        finished_lanes,
        error,
        error_option_callbacks: root
            .options()
            .error_option_callback_record(root_id, RootErrorOptionCallbackPhase::Commit),
    })
}

#[allow(
    dead_code,
    reason = "crate-private root error recovery commit evidence is reserved for private render error workers"
)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootRenderFailureRecoveryCommitEvidenceForCanary {
    root: FiberRootId,
    render_lanes: Lanes,
    error_option_callbacks: RootErrorOptionCallbackRecord,
}

#[allow(
    dead_code,
    reason = "crate-private root error recovery commit evidence is reserved for private render error workers"
)]
impl HostRootRenderFailureRecoveryCommitEvidenceForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn error_option_callbacks(self) -> RootErrorOptionCallbackRecord {
        self.error_option_callbacks
    }

    #[must_use]
    pub(crate) const fn on_uncaught_error(self) -> RootErrorCallbackHandle {
        self.error_option_callbacks.on_uncaught_error()
    }

    #[must_use]
    pub(crate) const fn on_caught_error(self) -> RootErrorCallbackHandle {
        self.error_option_callbacks.on_caught_error()
    }

    #[must_use]
    pub(crate) const fn on_recoverable_error(self) -> RootRecoverableErrorCallbackHandle {
        self.error_option_callbacks.on_recoverable_error()
    }

    #[must_use]
    pub(crate) const fn has_configured_error_callback(self) -> bool {
        self.error_option_callbacks.has_configured_error_callback()
    }

    #[must_use]
    pub(crate) fn accepted_render_failure_metadata(self) -> bool {
        self.error_option_callbacks.root() == self.root
            && self.error_option_callbacks.phase() == RootErrorOptionCallbackPhase::Render
    }

    #[must_use]
    pub(crate) const fn commit_attempted(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn root_current_switched(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn retried_public_work(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn invoked_public_callbacks(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn root_error_callbacks_invoked(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_error_boundaries_enabled(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn recoverable_error_compatibility_claimed(self) -> bool {
        false
    }
}

#[allow(
    dead_code,
    reason = "crate-private root error recovery commit evidence is reserved for private render error workers"
)]
pub(crate) const fn host_root_render_failure_recovery_commit_evidence_for_canary(
    root: FiberRootId,
    render_lanes: Lanes,
    error_option_callbacks: RootErrorOptionCallbackRecord,
) -> HostRootRenderFailureRecoveryCommitEvidenceForCanary {
    HostRootRenderFailureRecoveryCommitEvidenceForCanary {
        root,
        render_lanes,
        error_option_callbacks,
    }
}

#[allow(
    dead_code,
    reason = "crate-private HostRoot commit recovery diagnostics are reserved for private sync-flush error workers"
)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootCommitRecoverySnapshotForCanary {
    root: FiberRootId,
    current: FiberId,
    render_lanes: Lanes,
    pending_lanes: Lanes,
    callback_node: RootSchedulerCallbackHandle,
    callback_priority: RootCallbackPriority,
    render_phase_work: Option<FiberId>,
    render_phase_lanes: Lanes,
    callback_queue: UpdateQueueHandle,
    root_update_callbacks: RootUpdateCallbackSnapshot,
}

#[allow(
    dead_code,
    reason = "crate-private HostRoot commit recovery diagnostics are reserved for private sync-flush error workers"
)]
impl HostRootCommitRecoverySnapshotForCanary {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn current(&self) -> FiberId {
        self.current
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn pending_lanes(&self) -> Lanes {
        self.pending_lanes
    }

    #[must_use]
    pub(crate) const fn callback_node(&self) -> RootSchedulerCallbackHandle {
        self.callback_node
    }

    #[must_use]
    pub(crate) const fn callback_priority(&self) -> RootCallbackPriority {
        self.callback_priority
    }

    #[must_use]
    pub(crate) const fn render_phase_work(&self) -> Option<FiberId> {
        self.render_phase_work
    }

    #[must_use]
    pub(crate) const fn render_phase_lanes(&self) -> Lanes {
        self.render_phase_lanes
    }

    #[must_use]
    pub(crate) const fn callback_queue(&self) -> UpdateQueueHandle {
        self.callback_queue
    }

    #[must_use]
    pub(crate) fn root_update_callbacks(&self) -> &RootUpdateCallbackSnapshot {
        &self.root_update_callbacks
    }

    #[must_use]
    pub(crate) fn visible_callback_count(&self) -> usize {
        self.root_update_callbacks.visible().len()
    }

    #[must_use]
    pub(crate) fn hidden_callback_count(&self) -> usize {
        self.root_update_callbacks.hidden().len()
    }

    #[must_use]
    pub(crate) fn deferred_hidden_callback_count(&self) -> usize {
        self.root_update_callbacks.deferred_hidden().len()
    }

    #[must_use]
    pub(crate) fn preserves_lane_and_callback_metadata_from(&self, before: &Self) -> bool {
        self.root == before.root
            && self.current == before.current
            && self.render_lanes == before.render_lanes
            && self.pending_lanes == before.pending_lanes
            && self.callback_node == before.callback_node
            && self.callback_priority == before.callback_priority
            && self.render_phase_work == before.render_phase_work
            && self.render_phase_lanes == before.render_phase_lanes
            && self.callback_queue == before.callback_queue
            && self.root_update_callbacks == before.root_update_callbacks
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootCallbackDrainRecordForCanary {
    root: FiberRootId,
    commit_order: usize,
    callback_order: usize,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    queue: UpdateQueueHandle,
    update: UpdateId,
    callback: RootUpdateCallbackHandle,
    accepted_sequence: usize,
    visibility: RootUpdateCallbackVisibility,
    update_lanes: Lanes,
    callback_lanes: Lanes,
}

#[allow(
    dead_code,
    reason = "crate-private root callback drain metadata is reserved for lane/order canaries"
)]
impl HostRootCallbackDrainRecordForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn commit_order(self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn callback_order(self) -> usize {
        self.callback_order
    }

    #[must_use]
    pub(crate) const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn finished_lanes(self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub(crate) const fn queue(self) -> UpdateQueueHandle {
        self.queue
    }

    #[must_use]
    pub(crate) const fn update(self) -> UpdateId {
        self.update
    }

    #[must_use]
    pub(crate) const fn callback(self) -> RootUpdateCallbackHandle {
        self.callback
    }

    #[must_use]
    pub(crate) const fn accepted_sequence(self) -> usize {
        self.accepted_sequence
    }

    #[must_use]
    pub(crate) const fn visibility(self) -> RootUpdateCallbackVisibility {
        self.visibility
    }

    #[must_use]
    pub(crate) const fn update_lanes(self) -> Lanes {
        self.update_lanes
    }

    #[must_use]
    pub(crate) const fn callback_lanes(self) -> Lanes {
        self.callback_lanes
    }

    #[must_use]
    pub(crate) const fn is_visible_callback(self) -> bool {
        self.visibility.is_visible()
    }

    #[must_use]
    pub(crate) const fn is_hidden_callback(self) -> bool {
        self.visibility.is_hidden()
    }

    #[must_use]
    pub(crate) const fn is_deferred_hidden_callback(self) -> bool {
        self.visibility.is_deferred()
    }

    #[must_use]
    pub(crate) const fn update_lanes_include_offscreen(self) -> bool {
        self.update_lanes.contains_lane(Lane::OFFSCREEN)
    }

    #[must_use]
    pub(crate) const fn callback_lanes_match_commit(self) -> bool {
        self.callback_lanes.is_non_empty()
            && self.render_lanes.contains_all(self.callback_lanes)
            && self.finished_lanes.contains_all(self.callback_lanes)
    }

    #[must_use]
    pub(crate) const fn public_callback_invoked(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_root_callback_behavior_exposed(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootCallbackDrainSnapshotForCanary {
    root: FiberRootId,
    commit_order: usize,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    pending_lanes_after_commit: Lanes,
    records: Vec<HostRootCallbackDrainRecordForCanary>,
}

#[allow(
    dead_code,
    reason = "crate-private root callback drain metadata is reserved for lane/order canaries"
)]
impl HostRootCallbackDrainSnapshotForCanary {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn commit_order(&self) -> usize {
        self.commit_order
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn finished_lanes(&self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub(crate) const fn pending_lanes_after_commit(&self) -> Lanes {
        self.pending_lanes_after_commit
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[HostRootCallbackDrainRecordForCanary] {
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
    pub(crate) fn visible_callback_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.is_visible_callback())
            .count()
    }

    #[must_use]
    pub(crate) fn hidden_callback_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| record.is_hidden_callback())
            .count()
    }

    #[must_use]
    pub(crate) fn has_visible_and_hidden_callbacks(&self) -> bool {
        self.visible_callback_count() > 0 && self.hidden_callback_count() > 0
    }

    #[must_use]
    pub(crate) fn records_in_callback_sequence_order(&self) -> bool {
        self.records.iter().enumerate().all(|(expected, record)| {
            record.callback_order() == expected && record.accepted_sequence() == expected
        })
    }

    #[must_use]
    pub(crate) fn records_match_commit_lanes(&self) -> bool {
        self.records
            .iter()
            .all(|record| record.callback_lanes_match_commit())
    }

    #[must_use]
    pub(crate) fn hidden_callbacks_deferred_without_invocation(&self) -> bool {
        self.records
            .iter()
            .filter(|record| record.is_hidden_callback())
            .all(|record| {
                record.is_deferred_hidden_callback()
                    && record.update_lanes_include_offscreen()
                    && !record.public_callback_invoked()
                    && !record.public_root_callback_behavior_exposed()
            })
    }

    #[must_use]
    pub(crate) fn proves_deterministic_lane_order(&self) -> bool {
        !self.is_empty()
            && self.records_in_callback_sequence_order()
            && self.records_match_commit_lanes()
            && self.records.iter().all(|record| {
                record.root() == self.root && record.commit_order() == self.commit_order
            })
            && self.hidden_callbacks_deferred_without_invocation()
    }

    #[must_use]
    pub(crate) const fn public_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_root_callback_behavior_exposed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootRefCommitAction {
    Detach,
    Attach,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootRefDetachReason {
    RefChanged,
    Deleted,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct HostRootRefCommitRecord {
    root: FiberRootId,
    fiber: FiberId,
    state_node: StateNodeHandle,
    ref_handle: RefHandle,
    token: HostFiberTokenId,
    token_phase: HostFiberTokenPhase,
    token_target: HostFiberTokenTarget,
    action: HostRootRefCommitAction,
    detach_reason: Option<HostRootRefDetachReason>,
}

#[allow(
    dead_code,
    reason = "crate-private ref commit metadata for future ref lifecycle workers"
)]
impl HostRootRefCommitRecord {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn fiber(&self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn state_node(&self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn ref_handle(&self) -> RefHandle {
        self.ref_handle
    }

    #[must_use]
    pub(crate) const fn token(&self) -> HostFiberTokenId {
        self.token
    }

    #[must_use]
    pub(crate) const fn token_phase(&self) -> HostFiberTokenPhase {
        self.token_phase
    }

    #[must_use]
    pub(crate) const fn token_target(&self) -> HostFiberTokenTarget {
        self.token_target
    }

    #[must_use]
    pub(crate) const fn action(&self) -> HostRootRefCommitAction {
        self.action
    }

    #[must_use]
    pub(crate) const fn detach_reason(&self) -> Option<HostRootRefDetachReason> {
        self.detach_reason
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct HostRootRefCommitSnapshot {
    detach: Vec<HostRootRefCommitRecord>,
    attach: Vec<HostRootRefCommitRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private ref commit metadata for future ref lifecycle workers"
)]
impl HostRootRefCommitSnapshot {
    #[must_use]
    pub(crate) fn detach(&self) -> &[HostRootRefCommitRecord] {
        &self.detach
    }

    #[must_use]
    pub(crate) fn attach(&self) -> &[HostRootRefCommitRecord] {
        &self.attach
    }

    #[must_use]
    pub(crate) fn is_empty(&self) -> bool {
        self.detach.is_empty() && self.attach.is_empty()
    }

    #[must_use]
    pub(crate) fn len(&self) -> usize {
        self.detach.len() + self.attach.len()
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct HostRootDomRefCallbackCommitGateSnapshot {
    records: Vec<HostRootDomRefCallbackCommitGateRecord>,
}

#[allow(
    dead_code,
    reason = "crate-private DOM ref callback gate records are reserved for future DOM commit workers"
)]
impl HostRootDomRefCallbackCommitGateSnapshot {
    #[must_use]
    pub(crate) fn records(&self) -> &[HostRootDomRefCallbackCommitGateRecord] {
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
    pub(crate) const fn callback_refs_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn object_refs_mutated(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn layout_effects_run(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_instances_exposed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn react_dom_ref_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct HostRootDomRefCallbackCommitGateRecord {
    sequence: usize,
    root: FiberRootId,
    fiber: FiberId,
    state_node: StateNodeHandle,
    ref_handle: RefHandle,
    token: HostFiberTokenId,
    token_phase: HostFiberTokenPhase,
    token_target: HostFiberTokenTarget,
    action: HostRootRefCommitAction,
    detach_reason: Option<HostRootRefDetachReason>,
    status: HostRootDomRefCallbackCommitGateStatus,
    blockers: [HostRootDomRefCallbackCommitGateBlocker; 5],
}

#[allow(
    dead_code,
    reason = "crate-private DOM ref callback gate records are reserved for future DOM commit workers"
)]
impl HostRootDomRefCallbackCommitGateRecord {
    #[must_use]
    pub(crate) const fn sequence(&self) -> usize {
        self.sequence
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn fiber(&self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn state_node(&self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn ref_handle(&self) -> RefHandle {
        self.ref_handle
    }

    #[must_use]
    pub(crate) const fn token(&self) -> HostFiberTokenId {
        self.token
    }

    #[must_use]
    pub(crate) const fn token_phase(&self) -> HostFiberTokenPhase {
        self.token_phase
    }

    #[must_use]
    pub(crate) const fn token_target(&self) -> HostFiberTokenTarget {
        self.token_target
    }

    #[must_use]
    pub(crate) const fn action(&self) -> HostRootRefCommitAction {
        self.action
    }

    #[must_use]
    pub(crate) const fn detach_reason(&self) -> Option<HostRootRefDetachReason> {
        self.detach_reason
    }

    #[must_use]
    pub(crate) const fn status(&self) -> HostRootDomRefCallbackCommitGateStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn blockers(&self) -> &[HostRootDomRefCallbackCommitGateBlocker; 5] {
        &self.blockers
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootDomRefCallbackCommitGateStatus {
    Blocked,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootDomRefCallbackCommitGateBlocker {
    CallbackRefInvocation,
    ObjectRefMutation,
    LayoutEffectExecution,
    PublicInstanceExposure,
    ReactDomRefCompatibilityClaim,
}

const DOM_REF_CALLBACK_GATE_BLOCKERS: [HostRootDomRefCallbackCommitGateBlocker; 5] = [
    HostRootDomRefCallbackCommitGateBlocker::CallbackRefInvocation,
    HostRootDomRefCallbackCommitGateBlocker::ObjectRefMutation,
    HostRootDomRefCallbackCommitGateBlocker::LayoutEffectExecution,
    HostRootDomRefCallbackCommitGateBlocker::PublicInstanceExposure,
    HostRootDomRefCallbackCommitGateBlocker::ReactDomRefCompatibilityClaim,
];

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct HostRootRefCallbackExecutionHandoffSnapshot {
    records: Vec<HostRootRefCallbackExecutionHandoffRecord>,
    detach_count: usize,
    attach_count: usize,
    changed_ref_detach_before_attach_count: usize,
}

#[allow(
    dead_code,
    reason = "crate-private ref callback execution handoff is reserved for future DOM commit workers"
)]
impl HostRootRefCallbackExecutionHandoffSnapshot {
    #[must_use]
    pub(crate) fn records(&self) -> &[HostRootRefCallbackExecutionHandoffRecord] {
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
    pub(crate) const fn detach_count(&self) -> usize {
        self.detach_count
    }

    #[must_use]
    pub(crate) const fn attach_count(&self) -> usize {
        self.attach_count
    }

    #[must_use]
    pub(crate) const fn changed_ref_detach_before_attach_count(&self) -> usize {
        self.changed_ref_detach_before_attach_count
    }

    #[must_use]
    pub(crate) const fn callback_refs_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn object_refs_mutated(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_roots_touched(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn root_errors_reported(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn react_dom_ref_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct HostRootRefCallbackExecutionHandoffRecord {
    sequence: usize,
    source_gate_sequence: usize,
    root: FiberRootId,
    fiber: FiberId,
    state_node: StateNodeHandle,
    ref_handle: RefHandle,
    token: HostFiberTokenId,
    token_phase: HostFiberTokenPhase,
    token_target: HostFiberTokenTarget,
    action: HostRootRefCommitAction,
    detach_reason: Option<HostRootRefDetachReason>,
    execution_phase: HostRootRefCallbackExecutionPhase,
    changed_ref_detach_before_attach: bool,
    status: HostRootRefCallbackExecutionHandoffStatus,
    blockers: [HostRootRefCallbackExecutionHandoffBlocker; 4],
}

#[allow(
    dead_code,
    reason = "crate-private ref callback execution handoff is reserved for future DOM commit workers"
)]
impl HostRootRefCallbackExecutionHandoffRecord {
    #[must_use]
    pub(crate) const fn sequence(&self) -> usize {
        self.sequence
    }

    #[must_use]
    pub(crate) const fn source_gate_sequence(&self) -> usize {
        self.source_gate_sequence
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn fiber(&self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn state_node(&self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn ref_handle(&self) -> RefHandle {
        self.ref_handle
    }

    #[must_use]
    pub(crate) const fn token(&self) -> HostFiberTokenId {
        self.token
    }

    #[must_use]
    pub(crate) const fn token_phase(&self) -> HostFiberTokenPhase {
        self.token_phase
    }

    #[must_use]
    pub(crate) const fn token_target(&self) -> HostFiberTokenTarget {
        self.token_target
    }

    #[must_use]
    pub(crate) const fn action(&self) -> HostRootRefCommitAction {
        self.action
    }

    #[must_use]
    pub(crate) const fn detach_reason(&self) -> Option<HostRootRefDetachReason> {
        self.detach_reason
    }

    #[must_use]
    pub(crate) const fn execution_phase(&self) -> HostRootRefCallbackExecutionPhase {
        self.execution_phase
    }

    #[must_use]
    pub(crate) const fn changed_ref_detach_before_attach(&self) -> bool {
        self.changed_ref_detach_before_attach
    }

    #[must_use]
    pub(crate) const fn status(&self) -> HostRootRefCallbackExecutionHandoffStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn blockers(&self) -> &[HostRootRefCallbackExecutionHandoffBlocker; 4] {
        &self.blockers
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootRefCallbackExecutionPhase {
    CallbackDetachCleanupOrNull,
    CallbackAttach,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootRefCallbackExecutionHandoffStatus {
    PrivateExecutionHandoff,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootRefCallbackExecutionHandoffBlocker {
    ObjectRefMutation,
    PublicRootExecution,
    PublicRootErrorRouting,
    ReactDomRefCompatibilityClaim,
}

const REF_CALLBACK_EXECUTION_HANDOFF_BLOCKERS: [HostRootRefCallbackExecutionHandoffBlocker; 4] = [
    HostRootRefCallbackExecutionHandoffBlocker::ObjectRefMutation,
    HostRootRefCallbackExecutionHandoffBlocker::PublicRootExecution,
    HostRootRefCallbackExecutionHandoffBlocker::PublicRootErrorRouting,
    HostRootRefCallbackExecutionHandoffBlocker::ReactDomRefCompatibilityClaim,
];

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct HostRootRefCleanupReturnExecutionGateSnapshot {
    records: Vec<HostRootRefCleanupReturnExecutionGateRecord>,
    cleanup_return_handle_record_gate_count: usize,
    cleanup_return_execution_gate_count: usize,
    changed_ref_cleanup_before_attach_count: usize,
}

#[allow(
    dead_code,
    reason = "crate-private cleanup-return execution gate metadata is reserved for future DOM commit workers"
)]
impl HostRootRefCleanupReturnExecutionGateSnapshot {
    #[must_use]
    pub(crate) fn records(&self) -> &[HostRootRefCleanupReturnExecutionGateRecord] {
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
    pub(crate) const fn cleanup_return_handle_record_gate_count(&self) -> usize {
        self.cleanup_return_handle_record_gate_count
    }

    #[must_use]
    pub(crate) const fn cleanup_return_execution_gate_count(&self) -> usize {
        self.cleanup_return_execution_gate_count
    }

    #[must_use]
    pub(crate) const fn changed_ref_cleanup_before_attach_count(&self) -> usize {
        self.changed_ref_cleanup_before_attach_count
    }

    #[must_use]
    pub(crate) const fn callback_refs_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn cleanup_return_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn object_refs_mutated(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_roots_touched(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn root_errors_reported(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn react_dom_ref_compatibility_claimed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct HostRootRefCleanupReturnExecutionGateRecord {
    sequence: usize,
    source_handoff_sequence: usize,
    source_gate_sequence: usize,
    root: FiberRootId,
    fiber: FiberId,
    state_node: StateNodeHandle,
    ref_handle: RefHandle,
    token: HostFiberTokenId,
    token_phase: HostFiberTokenPhase,
    token_target: HostFiberTokenTarget,
    action: HostRootRefCommitAction,
    detach_reason: Option<HostRootRefDetachReason>,
    cleanup_return_phase: HostRootRefCleanupReturnExecutionPhase,
    cleanup_return_handle_recording_gate: bool,
    cleanup_return_execution_gate: bool,
    changed_ref_cleanup_before_attach: bool,
    status: HostRootRefCleanupReturnExecutionGateStatus,
    blockers: [HostRootRefCleanupReturnExecutionGateBlocker; 4],
}

#[allow(
    dead_code,
    reason = "crate-private cleanup-return execution gate metadata is reserved for future DOM commit workers"
)]
impl HostRootRefCleanupReturnExecutionGateRecord {
    #[must_use]
    pub(crate) const fn sequence(&self) -> usize {
        self.sequence
    }

    #[must_use]
    pub(crate) const fn source_handoff_sequence(&self) -> usize {
        self.source_handoff_sequence
    }

    #[must_use]
    pub(crate) const fn source_gate_sequence(&self) -> usize {
        self.source_gate_sequence
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn fiber(&self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn state_node(&self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn ref_handle(&self) -> RefHandle {
        self.ref_handle
    }

    #[must_use]
    pub(crate) const fn token(&self) -> HostFiberTokenId {
        self.token
    }

    #[must_use]
    pub(crate) const fn token_phase(&self) -> HostFiberTokenPhase {
        self.token_phase
    }

    #[must_use]
    pub(crate) const fn token_target(&self) -> HostFiberTokenTarget {
        self.token_target
    }

    #[must_use]
    pub(crate) const fn action(&self) -> HostRootRefCommitAction {
        self.action
    }

    #[must_use]
    pub(crate) const fn detach_reason(&self) -> Option<HostRootRefDetachReason> {
        self.detach_reason
    }

    #[must_use]
    pub(crate) const fn cleanup_return_phase(&self) -> HostRootRefCleanupReturnExecutionPhase {
        self.cleanup_return_phase
    }

    #[must_use]
    pub(crate) const fn cleanup_return_handle_recording_gate(&self) -> bool {
        self.cleanup_return_handle_recording_gate
    }

    #[must_use]
    pub(crate) const fn cleanup_return_execution_gate(&self) -> bool {
        self.cleanup_return_execution_gate
    }

    #[must_use]
    pub(crate) const fn changed_ref_cleanup_before_attach(&self) -> bool {
        self.changed_ref_cleanup_before_attach
    }

    #[must_use]
    pub(crate) const fn status(&self) -> HostRootRefCleanupReturnExecutionGateStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn blockers(&self) -> &[HostRootRefCleanupReturnExecutionGateBlocker; 4] {
        &self.blockers
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootRefCleanupReturnExecutionPhase {
    RecordAttachCleanupReturnHandle,
    ExecuteDetachCleanupReturnHandleOrNull,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootRefCleanupReturnExecutionGateStatus {
    TestOnlyExecutionGate,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum HostRootRefCleanupReturnExecutionGateBlocker {
    ObjectRefMutation,
    PublicRootExecution,
    PublicRootErrorRouting,
    ReactDomRefCompatibilityClaim,
}

const REF_CLEANUP_RETURN_EXECUTION_GATE_BLOCKERS: [HostRootRefCleanupReturnExecutionGateBlocker;
    4] = [
    HostRootRefCleanupReturnExecutionGateBlocker::ObjectRefMutation,
    HostRootRefCleanupReturnExecutionGateBlocker::PublicRootExecution,
    HostRootRefCleanupReturnExecutionGateBlocker::PublicRootErrorRouting,
    HostRootRefCleanupReturnExecutionGateBlocker::ReactDomRefCompatibilityClaim,
];

#[derive(Debug, Default, Clone, PartialEq, Eq)]
struct PendingRefCommitSnapshot {
    detach: Vec<PendingRefCommitRecord>,
    attach: Vec<PendingRefCommitRecord>,
}

impl PendingRefCommitSnapshot {
    fn push_attach(
        &mut self,
        root: FiberRootId,
        fiber: FiberId,
        state_node: StateNodeHandle,
        ref_handle: RefHandle,
    ) {
        self.attach.push(PendingRefCommitRecord {
            root,
            fiber,
            state_node,
            ref_handle,
            action: HostRootRefCommitAction::Attach,
            detach_reason: None,
        });
    }

    fn push_detach(
        &mut self,
        root: FiberRootId,
        fiber: FiberId,
        state_node: StateNodeHandle,
        ref_handle: RefHandle,
        reason: HostRootRefDetachReason,
    ) {
        self.detach.push(PendingRefCommitRecord {
            root,
            fiber,
            state_node,
            ref_handle,
            action: HostRootRefCommitAction::Detach,
            detach_reason: Some(reason),
        });
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct PendingRefCommitRecord {
    root: FiberRootId,
    fiber: FiberId,
    state_node: StateNodeHandle,
    ref_handle: RefHandle,
    action: HostRootRefCommitAction,
    detach_reason: Option<HostRootRefDetachReason>,
}

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
struct PendingHostRootDeletionCleanupRecord {
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
struct HostRootDeletionHostParentRecord {
    fiber: FiberId,
    tag: FiberTag,
    state_node: StateNodeHandle,
    traversal_depth: usize,
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct HostRootCommitOrderDiagnosticsForCanary {
    records: Vec<HostRootCommitOrderRecordForCanary>,
}

impl HostRootCommitOrderDiagnosticsForCanary {
    #[must_use]
    pub fn records(&self) -> &[HostRootCommitOrderRecordForCanary] {
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
    pub const fn public_effects_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub const fn host_containers_mutated(&self) -> bool {
        false
    }

    fn push(&mut self, record: HostRootCommitOrderRecordInputForCanary) {
        self.records.push(HostRootCommitOrderRecordForCanary {
            sequence: self.records.len(),
            phase: record.phase,
            metadata_kind: record.metadata_kind,
            root: record.root,
            finished_work: record.finished_work,
            fiber: record.fiber,
            tag: record.tag,
            source_order: record.source_order,
        });
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootCommitOrderRecordInputForCanary {
    phase: HostRootCommitOrderPhaseForCanary,
    metadata_kind: HostRootCommitOrderMetadataKindForCanary,
    root: FiberRootId,
    finished_work: FiberId,
    fiber: FiberId,
    tag: FiberTag,
    source_order: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostRootCommitOrderRecordForCanary {
    sequence: usize,
    phase: HostRootCommitOrderPhaseForCanary,
    metadata_kind: HostRootCommitOrderMetadataKindForCanary,
    root: FiberRootId,
    finished_work: FiberId,
    fiber: FiberId,
    tag: FiberTag,
    source_order: u64,
}

impl HostRootCommitOrderRecordForCanary {
    #[must_use]
    pub const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub const fn phase(self) -> HostRootCommitOrderPhaseForCanary {
        self.phase
    }

    #[must_use]
    pub const fn phase_name(self) -> &'static str {
        host_root_commit_order_phase_name(self.phase)
    }

    #[must_use]
    pub const fn metadata_kind(self) -> HostRootCommitOrderMetadataKindForCanary {
        self.metadata_kind
    }

    #[must_use]
    pub const fn metadata_kind_name(self) -> &'static str {
        host_root_commit_order_metadata_kind_name(self.metadata_kind)
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
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub const fn tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.tag)
    }

    #[must_use]
    pub const fn source_order(self) -> u64 {
        self.source_order
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostRootCommitOrderPhaseForCanary {
    Mutation,
    Layout,
    Passive,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostRootCommitOrderMetadataKindForCanary {
    DeletionCleanup,
    RefDetach,
    RefAttach,
    LayoutEffectDestroy,
    LayoutEffectCreate,
    LayoutEffectCallback,
    RootUpdateCallback,
    PassiveUnmount,
    PassiveMount,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HostRootCommitRecord {
    root: FiberRootId,
    previous_current: FiberId,
    current: FiberId,
    finished_lanes: Lanes,
    remaining_lanes: Lanes,
    pending_lanes: Lanes,
    mutation_log: HostRootMutationPhaseLog,
    mutation_apply_log: HostRootMutationApplyLog,
    root_update_callbacks: RootUpdateCallbackSnapshot,
    root_update_callback_invocation_gate: RootUpdateCallbackInvocationGateSnapshot,
    pending_passive_handoff: Option<PendingPassiveCommitHandoff>,
    function_component_committed_passive_effects: FunctionComponentCommittedPassiveEffectsSnapshot,
    function_component_deleted_subtree_passive_effects:
        FunctionComponentDeletedSubtreePassiveEffectsSnapshot,
    function_component_layout_effects: FunctionComponentLayoutEffectsSnapshot,
    function_component_layout_effect_callback_invocation_gate:
        FunctionComponentLayoutEffectCallbackInvocationGateSnapshot,
    function_component_effect_list_commit_phase_order:
        FunctionComponentEffectListCommitPhaseOrderSnapshot,
    deletion_lists: Vec<HostRootDeletionListRecord>,
    deletion_subtree_traversal_gate: HostRootDeletionSubtreeTraversalGateSnapshot,
    host_node_deletion_cleanup_log: HostRootDeletionCleanupLog,
    ref_commit_metadata: HostRootRefCommitSnapshot,
    dom_ref_callback_commit_gate: HostRootDomRefCallbackCommitGateSnapshot,
    ref_callback_execution_handoff: HostRootRefCallbackExecutionHandoffSnapshot,
    ref_cleanup_return_execution_gate: HostRootRefCleanupReturnExecutionGateSnapshot,
}

impl HostRootCommitRecord {
    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn previous_current(&self) -> FiberId {
        self.previous_current
    }

    #[must_use]
    pub const fn current(&self) -> FiberId {
        self.current
    }

    #[must_use]
    pub const fn finished_work(&self) -> FiberId {
        self.current
    }

    #[must_use]
    pub const fn finished_lanes(&self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub const fn remaining_lanes(&self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub const fn pending_lanes(&self) -> Lanes {
        self.pending_lanes
    }

    #[must_use]
    pub const fn has_remaining_work(&self) -> bool {
        self.pending_lanes.is_non_empty()
    }

    #[must_use]
    pub fn root_update_callbacks(&self) -> &RootUpdateCallbackSnapshot {
        &self.root_update_callbacks
    }

    #[must_use]
    #[allow(
        dead_code,
        reason = "crate-private root callback invocation metadata is reserved for future commit workers"
    )]
    pub(crate) fn root_update_callback_invocation_gate(
        &self,
    ) -> &RootUpdateCallbackInvocationGateSnapshot {
        &self.root_update_callback_invocation_gate
    }

    #[allow(
        dead_code,
        reason = "crate-private root callback invocation execution gate is reserved for private commit tests"
    )]
    pub(crate) fn drain_root_update_callbacks_under_test_control(
        &mut self,
        control: &mut impl RootUpdateCallbackInvocationTestControl,
    ) -> RootUpdateCallbackInvocationExecutionGateSnapshot {
        invoke_root_update_callbacks_under_test_control(
            &mut self.root_update_callback_invocation_gate,
            control,
        )
    }

    #[allow(
        dead_code,
        reason = "crate-private root callback drain metadata is reserved for lane/order canaries"
    )]
    pub(crate) fn root_update_callback_drain_snapshot_for_canary<H: HostTypes>(
        &self,
        store: &FiberRootStore<H>,
        commit_order: usize,
        render_lanes: Lanes,
    ) -> Result<HostRootCallbackDrainSnapshotForCanary, RootCommitError> {
        let records = collect_host_root_callback_drain_records_for_canary(
            store,
            self.root,
            commit_order,
            render_lanes,
            self.finished_lanes,
            &self.root_update_callbacks,
        )?;

        Ok(HostRootCallbackDrainSnapshotForCanary {
            root: self.root,
            commit_order,
            render_lanes,
            finished_lanes: self.finished_lanes,
            pending_lanes_after_commit: self.pending_lanes,
            records,
        })
    }

    #[must_use]
    #[allow(
        dead_code,
        reason = "crate-private ref commit metadata for future ref lifecycle workers"
    )]
    pub(crate) fn ref_commit_metadata(&self) -> &HostRootRefCommitSnapshot {
        &self.ref_commit_metadata
    }

    #[must_use]
    #[allow(
        dead_code,
        reason = "crate-private DOM ref callback gate records are reserved for future DOM commit workers"
    )]
    pub(crate) fn dom_ref_callback_commit_gate(&self) -> &HostRootDomRefCallbackCommitGateSnapshot {
        &self.dom_ref_callback_commit_gate
    }

    #[must_use]
    #[allow(
        dead_code,
        reason = "crate-private ref callback execution handoff records are reserved for future DOM commit workers"
    )]
    pub(crate) fn ref_callback_execution_handoff(
        &self,
    ) -> &HostRootRefCallbackExecutionHandoffSnapshot {
        &self.ref_callback_execution_handoff
    }

    #[must_use]
    #[allow(
        dead_code,
        reason = "crate-private cleanup-return execution gate records are reserved for future DOM commit workers"
    )]
    pub(crate) fn ref_cleanup_return_execution_gate(
        &self,
    ) -> &HostRootRefCleanupReturnExecutionGateSnapshot {
        &self.ref_cleanup_return_execution_gate
    }

    #[allow(
        dead_code,
        reason = "reconciler-private mutation metadata is reserved for later commit workers"
    )]
    #[must_use]
    pub(crate) const fn mutation_log(&self) -> &HostRootMutationPhaseLog {
        &self.mutation_log
    }

    #[allow(
        dead_code,
        reason = "reconciler-private mutation apply metadata is reserved for later commit workers"
    )]
    #[must_use]
    pub(crate) const fn mutation_apply_log(&self) -> &HostRootMutationApplyLog {
        &self.mutation_apply_log
    }

    #[doc(hidden)]
    #[must_use]
    pub fn test_only_host_parent_placement_apply_count_for_canary(&self) -> usize {
        self.mutation_apply_log
            .records()
            .iter()
            .filter(|record| is_host_parent_placement_apply_kind_for_canary(record.kind()))
            .count()
    }

    #[doc(hidden)]
    #[must_use]
    pub fn has_test_only_host_parent_placement_apply_for_canary(
        &self,
        parent_state_node_raw: u64,
        child_state_node_raw: u64,
    ) -> bool {
        self.mutation_apply_log.records().iter().any(|record| {
            is_host_parent_placement_apply_kind_for_canary(record.kind())
                && record.parent_tag() == FiberTag::HostComponent
                && record.parent_state_node().raw() == parent_state_node_raw
                && record.state_node().raw() == child_state_node_raw
        })
    }

    #[doc(hidden)]
    #[must_use]
    pub fn test_only_host_text_update_apply_count_for_canary(&self) -> usize {
        self.mutation_apply_log
            .records()
            .iter()
            .filter(|record| record.kind() == HostRootMutationApplyRecordKind::CommitHostTextUpdate)
            .count()
    }

    #[doc(hidden)]
    #[must_use]
    pub fn test_only_host_component_update_apply_count_for_canary(&self) -> usize {
        self.mutation_apply_log
            .records()
            .iter()
            .filter(|record| {
                record.kind() == HostRootMutationApplyRecordKind::CommitHostComponentUpdate
            })
            .count()
    }

    #[doc(hidden)]
    #[must_use]
    pub fn has_test_only_host_component_update_apply_for_canary(
        &self,
        current_component: FiberId,
        updated_component: FiberId,
        component_state_node_raw: u64,
    ) -> bool {
        self.mutation_apply_log.records().iter().any(|record| {
            record.kind() == HostRootMutationApplyRecordKind::CommitHostComponentUpdate
                && record.tag() == FiberTag::HostComponent
                && record.alternate_fiber() == Some(current_component)
                && record.fiber() == updated_component
                && record.state_node().raw() == component_state_node_raw
        })
    }

    #[doc(hidden)]
    #[must_use]
    pub fn host_component_update_apply_diagnostics_for_canary(
        &self,
    ) -> Vec<HostComponentUpdateApplyDiagnosticForCanary> {
        self.mutation_apply_log
            .records()
            .iter()
            .filter(|record| {
                record.kind() == HostRootMutationApplyRecordKind::CommitHostComponentUpdate
            })
            .enumerate()
            .map(
                |(sequence, record)| HostComponentUpdateApplyDiagnosticForCanary {
                    sequence,
                    root: record.root(),
                    host_root: record.host_root(),
                    parent: record.parent(),
                    parent_tag: record.parent_tag(),
                    parent_state_node: record.parent_state_node(),
                    fiber: record.fiber(),
                    alternate_fiber: record.alternate_fiber(),
                    tag: record.tag(),
                    state_node: record.state_node(),
                    pending_props: record.pending_props(),
                    memoized_props: record.memoized_props(),
                    alternate_memoized_props: record.alternate_memoized_props(),
                    apply_kind: host_root_mutation_apply_record_kind_name(record.kind()),
                },
            )
            .collect()
    }

    #[doc(hidden)]
    #[allow(
        dead_code,
        reason = "crate-private HostComponent ref/update ordering diagnostics are reserved for future ref lifecycle workers"
    )]
    #[must_use]
    pub(crate) fn ref_host_component_update_order_for_canary(
        &self,
    ) -> HostRootRefHostComponentUpdateOrderSnapshotForCanary {
        collect_ref_host_component_update_order_for_canary(
            self.root,
            self.current,
            &self.mutation_apply_log,
            &self.ref_callback_execution_handoff,
        )
    }

    #[cfg(test)]
    pub(crate) fn single_host_update_apply_record_for_canary(
        &self,
    ) -> Result<
        HostRootSingleHostUpdateApplyRecordForCanary,
        HostRootSingleHostUpdateApplyRecordErrorForCanary,
    > {
        single_host_update_apply_record_for_canary_from_log(
            self.root,
            self.current,
            &self.mutation_apply_log,
        )
    }

    #[doc(hidden)]
    #[must_use]
    pub fn has_test_only_host_text_update_apply_for_canary(
        &self,
        current_text: FiberId,
        updated_text: FiberId,
        text_state_node_raw: u64,
    ) -> bool {
        self.mutation_apply_log.records().iter().any(|record| {
            record.kind() == HostRootMutationApplyRecordKind::CommitHostTextUpdate
                && record.tag() == FiberTag::HostText
                && record.alternate_fiber() == Some(current_text)
                && record.fiber() == updated_text
                && record.state_node().raw() == text_state_node_raw
        })
    }

    #[must_use]
    pub fn host_root_placement_apply_diagnostics_for_canary(
        &self,
    ) -> Vec<HostRootPlacementApplyDiagnosticForCanary> {
        self.mutation_apply_log
            .records()
            .iter()
            .filter(|record| {
                record.parent_tag() == FiberTag::HostRoot
                    && matches!(
                        record.source(),
                        HostRootMutationApplyRecordSource::MutationPhase(
                            HostRootMutationPhaseRecordKind::Placement
                        )
                    )
            })
            .map(|record| {
                let placement_sibling = record.placement_sibling();
                HostRootPlacementApplyDiagnosticForCanary {
                    root: record.root(),
                    host_root: record.host_root(),
                    fiber: record.fiber(),
                    tag: record.tag(),
                    state_node: record.state_node(),
                    apply_kind: host_root_mutation_apply_record_kind_name(record.kind()),
                    sibling_status: placement_sibling
                        .map(HostRootPlacementSiblingRecord::status)
                        .map(host_root_placement_sibling_status_name)
                        .unwrap_or("missing-placement-sibling-record"),
                    sibling: placement_sibling.and_then(HostRootPlacementSiblingRecord::sibling),
                    sibling_tag: placement_sibling
                        .and_then(HostRootPlacementSiblingRecord::sibling_tag),
                    sibling_state_node: placement_sibling
                        .map(HostRootPlacementSiblingRecord::sibling_state_node)
                        .unwrap_or(StateNodeHandle::NONE),
                    skipped_pending_sibling_count: placement_sibling
                        .map(HostRootPlacementSiblingRecord::skipped_pending_sibling_count)
                        .unwrap_or(0),
                    can_insert_before: placement_sibling
                        .is_some_and(HostRootPlacementSiblingRecord::can_insert_before),
                }
            })
            .collect()
    }

    #[must_use]
    pub fn host_parent_placement_apply_diagnostics_for_canary(
        &self,
    ) -> Vec<HostParentPlacementApplyDiagnosticForCanary> {
        self.mutation_apply_log
            .records()
            .iter()
            .filter(|record| {
                record.parent_tag() == FiberTag::HostComponent
                    && matches!(
                        record.source(),
                        HostRootMutationApplyRecordSource::MutationPhase(
                            HostRootMutationPhaseRecordKind::Placement
                        )
                    )
            })
            .map(|record| {
                let placement_sibling = record.placement_sibling();
                HostParentPlacementApplyDiagnosticForCanary {
                    root: record.root(),
                    host_root: record.host_root(),
                    parent: record.parent(),
                    parent_tag: record.parent_tag(),
                    parent_state_node: record.parent_state_node(),
                    fiber: record.fiber(),
                    tag: record.tag(),
                    state_node: record.state_node(),
                    apply_kind: host_root_mutation_apply_record_kind_name(record.kind()),
                    sibling_status: placement_sibling
                        .map(HostRootPlacementSiblingRecord::status)
                        .map(host_root_placement_sibling_status_name)
                        .unwrap_or("missing-placement-sibling-record"),
                    sibling: placement_sibling.and_then(HostRootPlacementSiblingRecord::sibling),
                    sibling_tag: placement_sibling
                        .and_then(HostRootPlacementSiblingRecord::sibling_tag),
                    sibling_state_node: placement_sibling
                        .map(HostRootPlacementSiblingRecord::sibling_state_node)
                        .unwrap_or(StateNodeHandle::NONE),
                    skipped_pending_sibling_count: placement_sibling
                        .map(HostRootPlacementSiblingRecord::skipped_pending_sibling_count)
                        .unwrap_or(0),
                    can_insert_before: placement_sibling
                        .is_some_and(HostRootPlacementSiblingRecord::can_insert_before),
                    applies_to_host_parent: is_host_parent_placement_apply_kind_for_canary(
                        record.kind(),
                    ),
                }
            })
            .collect()
    }

    #[doc(hidden)]
    #[must_use]
    pub fn deletion_cleanup_order_gate_for_canary(
        &self,
    ) -> HostRootDeletionCleanupOrderGateSnapshot {
        materialize_deletion_cleanup_order_gate(self)
    }

    #[allow(
        dead_code,
        reason = "crate-private deterministic test-host deletion detachment canary"
    )]
    pub(crate) fn deletion_subtree_host_detachment_plan_for_canary(
        &self,
    ) -> Result<
        HostRootDeletionSubtreeHostDetachmentPlanForCanary,
        HostRootDeletionSubtreeHostDetachmentPlanErrorForCanary,
    > {
        materialize_deletion_subtree_host_detachment_plan_for_canary(self)
    }

    #[allow(
        dead_code,
        reason = "crate-private deletion metadata for future mutation/passive deletion workers"
    )]
    #[must_use]
    pub(crate) fn deletion_lists(&self) -> &[HostRootDeletionListRecord] {
        &self.deletion_lists
    }

    #[allow(
        dead_code,
        reason = "crate-private Fragment/Portal deletion traversal diagnostics are reserved for future deletion workers"
    )]
    #[must_use]
    pub(crate) const fn deletion_subtree_traversal_gate_for_canary(
        &self,
    ) -> &HostRootDeletionSubtreeTraversalGateSnapshot {
        &self.deletion_subtree_traversal_gate
    }

    #[must_use]
    pub const fn host_node_deletion_cleanup_log(&self) -> &HostRootDeletionCleanupLog {
        &self.host_node_deletion_cleanup_log
    }

    #[doc(hidden)]
    #[must_use]
    pub fn commit_order_diagnostics_for_canary(&self) -> HostRootCommitOrderDiagnosticsForCanary {
        let mut diagnostics = HostRootCommitOrderDiagnosticsForCanary::default();

        for record in self.host_node_deletion_cleanup_log.records() {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Mutation,
                metadata_kind: HostRootCommitOrderMetadataKindForCanary::DeletionCleanup,
                root: record.root(),
                finished_work: self.current,
                fiber: record.fiber(),
                tag: record.tag(),
                source_order: record.sequence() as u64,
            });
        }

        for record in self
            .function_component_layout_effects
            .destroy_phase_records()
        {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Mutation,
                metadata_kind: HostRootCommitOrderMetadataKindForCanary::LayoutEffectDestroy,
                root: self.root,
                finished_work: self.current,
                fiber: record.fiber(),
                tag: FiberTag::FunctionComponent,
                source_order: record.order() as u64,
            });
        }

        for record in self
            .function_component_layout_effect_callback_invocation_gate
            .records()
            .iter()
            .filter(|record| {
                record.commit_phase() == FunctionComponentLayoutEffectCommitPhase::Mutation
            })
        {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Mutation,
                metadata_kind: HostRootCommitOrderMetadataKindForCanary::LayoutEffectCallback,
                root: record.root(),
                finished_work: record.finished_work(),
                fiber: record.fiber(),
                tag: FiberTag::FunctionComponent,
                source_order: record.invocation_order() as u64,
            });
        }

        for record in self.ref_callback_execution_handoff.records() {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Layout,
                metadata_kind: host_root_commit_order_ref_kind(record.action()),
                root: record.root(),
                finished_work: self.current,
                fiber: record.fiber(),
                tag: FiberTag::HostComponent,
                source_order: record.sequence() as u64,
            });
        }

        for record in self
            .function_component_layout_effects
            .create_phase_records()
        {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Layout,
                metadata_kind: HostRootCommitOrderMetadataKindForCanary::LayoutEffectCreate,
                root: self.root,
                finished_work: self.current,
                fiber: record.fiber(),
                tag: FiberTag::FunctionComponent,
                source_order: record.order() as u64,
            });
        }

        for record in self
            .function_component_layout_effect_callback_invocation_gate
            .records()
            .iter()
            .filter(|record| {
                record.commit_phase() == FunctionComponentLayoutEffectCommitPhase::Layout
            })
        {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Layout,
                metadata_kind: HostRootCommitOrderMetadataKindForCanary::LayoutEffectCallback,
                root: record.root(),
                finished_work: record.finished_work(),
                fiber: record.fiber(),
                tag: FiberTag::FunctionComponent,
                source_order: record.invocation_order() as u64,
            });
        }

        for record in self.root_update_callback_invocation_gate.records() {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Layout,
                metadata_kind: HostRootCommitOrderMetadataKindForCanary::RootUpdateCallback,
                root: self.root,
                finished_work: self.current,
                fiber: self.current,
                tag: FiberTag::HostRoot,
                source_order: record.invocation_order() as u64,
            });
        }

        for record in self
            .function_component_committed_passive_effects
            .phase_records()
        {
            diagnostics.push(HostRootCommitOrderRecordInputForCanary {
                phase: HostRootCommitOrderPhaseForCanary::Passive,
                metadata_kind: host_root_commit_order_passive_kind(record.phase()),
                root: self.root,
                finished_work: self.current,
                fiber: record.fiber(),
                tag: FiberTag::FunctionComponent,
                source_order: host_root_commit_order_passive_source_order(record.order()),
            });
        }

        diagnostics
    }
}

fn collect_host_root_callback_drain_records_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    commit_order: usize,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    callbacks: &RootUpdateCallbackSnapshot,
) -> Result<Vec<HostRootCallbackDrainRecordForCanary>, RootCommitError> {
    let mut callback_records = Vec::with_capacity(
        callbacks.visible().len() + callbacks.hidden().len() + callbacks.deferred_hidden().len(),
    );
    callback_records.extend_from_slice(callbacks.visible());
    callback_records.extend_from_slice(callbacks.hidden());
    callback_records.extend_from_slice(callbacks.deferred_hidden());
    callback_records.sort_by_key(|record| {
        (
            record.sequence(),
            root_update_callback_visibility_order(record.visibility()),
        )
    });

    callback_records
        .into_iter()
        .enumerate()
        .map(|(callback_order, record)| {
            host_root_callback_drain_record_for_canary(
                store,
                root,
                commit_order,
                callback_order,
                render_lanes,
                finished_lanes,
                record,
            )
        })
        .collect()
}

fn host_root_callback_drain_record_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    commit_order: usize,
    callback_order: usize,
    render_lanes: Lanes,
    finished_lanes: Lanes,
    record: RootUpdateCallbackRecord,
) -> Result<HostRootCallbackDrainRecordForCanary, RootCommitError> {
    let update_lanes = store.update_queues().update(record.update())?.lane();
    let callback_lanes = update_lanes.remove_lane(Lane::OFFSCREEN);

    Ok(HostRootCallbackDrainRecordForCanary {
        root,
        commit_order,
        callback_order,
        render_lanes,
        finished_lanes,
        queue: record.queue(),
        update: record.update(),
        callback: record.callback(),
        accepted_sequence: record.sequence(),
        visibility: record.visibility(),
        update_lanes,
        callback_lanes,
    })
}

const fn root_update_callback_visibility_order(visibility: RootUpdateCallbackVisibility) -> u8 {
    match visibility {
        RootUpdateCallbackVisibility::Visible => 0,
        RootUpdateCallbackVisibility::Hidden => 1,
        RootUpdateCallbackVisibility::DeferredHidden => 2,
    }
}

pub fn commit_finished_host_root<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
) -> Result<HostRootCommitRecord, RootCommitError> {
    validate_finished_host_root(store, render)?;

    let root_id = render.root();
    let previous_current = render.current();
    let finished_work = render.finished_work();
    let finished_lanes = render.render_lanes();
    let remaining_lanes = render.remaining_lanes();
    let work_in_progress_update_queue = render.work_in_progress_update_queue();
    let mutation_log =
        collect_host_root_mutation_phase_log(store, root_id, finished_work, finished_lanes)?;
    let deletion_lists = collect_deletion_list_metadata(store, finished_work)?;
    let mutation_apply_log = collect_host_root_mutation_apply_log(
        store,
        root_id,
        finished_work,
        finished_lanes,
        &mutation_log,
        &deletion_lists,
    )?;
    let deletion_subtree_traversal_gate = materialize_deletion_subtree_traversal_gate(
        store,
        root_id,
        finished_work,
        &deletion_lists,
    )?;
    let pending_host_node_deletion_cleanup =
        collect_pending_host_node_deletion_cleanup(store, root_id, finished_work, &deletion_lists)?;
    let pending_ref_commit_metadata =
        collect_pending_ref_commit_metadata(store.fiber_arena(), root_id, finished_work)?;

    let (pending_lanes, pending_passive_handoff) = {
        let root = store.root_mut(root_id)?;
        let pending_passive_handoff = record_pending_passive_commit_handoff(
            root.scheduling_mut(),
            root_id,
            finished_work,
            finished_lanes,
        )?;
        root.lanes_mut()
            .mark_finished(RootFinishedLanes::new(finished_lanes, remaining_lanes));
        root.set_current(finished_work);
        root.clear_finished_work();
        root.scheduling_mut().clear_render_phase_work();
        root.scheduling_mut().clear_callback();
        (root.lanes().pending_lanes(), pending_passive_handoff)
    };
    let root_update_callbacks = store
        .update_queues_mut()
        .take_root_update_callback_records(work_in_progress_update_queue)?;
    let root_update_callback_invocation_gate =
        materialize_root_update_callback_invocation_gate(&root_update_callbacks);
    let host_node_deletion_cleanup_log = materialize_host_node_deletion_cleanup_log(
        store,
        root_id,
        finished_work,
        pending_host_node_deletion_cleanup,
    )?;
    let ref_commit_metadata = materialize_ref_commit_metadata(store, pending_ref_commit_metadata)?;
    let dom_ref_callback_commit_gate =
        materialize_dom_ref_callback_commit_gate(store, &ref_commit_metadata)?;
    let ref_callback_execution_handoff =
        materialize_ref_callback_execution_handoff(store, &dom_ref_callback_commit_gate)?;
    let ref_cleanup_return_execution_gate =
        materialize_ref_cleanup_return_execution_gate(store, &ref_callback_execution_handoff)?;

    Ok(HostRootCommitRecord {
        root: root_id,
        previous_current,
        current: finished_work,
        finished_lanes,
        remaining_lanes,
        pending_lanes,
        mutation_log,
        mutation_apply_log,
        root_update_callbacks,
        root_update_callback_invocation_gate,
        pending_passive_handoff,
        function_component_committed_passive_effects:
            FunctionComponentCommittedPassiveEffectsSnapshot::default(),
        function_component_deleted_subtree_passive_effects:
            FunctionComponentDeletedSubtreePassiveEffectsSnapshot::default(),
        function_component_layout_effects: FunctionComponentLayoutEffectsSnapshot::default(),
        function_component_layout_effect_callback_invocation_gate:
            FunctionComponentLayoutEffectCallbackInvocationGateSnapshot::default(),
        function_component_effect_list_commit_phase_order:
            FunctionComponentEffectListCommitPhaseOrderSnapshot::default(),
        deletion_lists,
        deletion_subtree_traversal_gate,
        host_node_deletion_cleanup_log,
        ref_commit_metadata,
        dom_ref_callback_commit_gate,
        ref_callback_execution_handoff,
        ref_cleanup_return_execution_gate,
    })
}

#[cfg(test)]
#[allow(
    clippy::result_large_err,
    reason = "private canary handoff diagnostics intentionally retain full finished-work evidence"
)]
pub(crate) fn record_host_root_finished_work_pending_commit_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    handoff_order: usize,
) -> Result<
    HostRootFinishedWorkPendingCommitRecordForCanary,
    HostRootFinishedWorkCommitHandoffErrorForCanary,
> {
    validate_finished_host_root(store, render)?;
    let root = store.root(render.root()).map_err(RootCommitError::from)?;

    Ok(HostRootFinishedWorkPendingCommitRecordForCanary {
        root: render.root(),
        root_token: render.root().state_node_handle(),
        previous_current: render.current(),
        pending_work: root.scheduling().work_in_progress(),
        root_finished_work: root.finished_work(),
        finished_work: render.finished_work(),
        render_lanes: render.render_lanes(),
        finished_lanes: render.render_lanes(),
        root_finished_lanes: root.finished_lanes(),
        remaining_lanes: render.remaining_lanes(),
        pending_lanes_before_commit: root.lanes().pending_lanes(),
        render_exit_status: root.scheduling().render_exit_status(),
        handoff_order,
    })
}

#[cfg(test)]
#[allow(
    clippy::result_large_err,
    reason = "private canary handoff diagnostics intentionally retain full finished-work evidence"
)]
pub(crate) fn commit_finished_host_root_with_finished_work_handoff_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    pending: Option<HostRootFinishedWorkPendingCommitRecordForCanary>,
    commit_order: usize,
) -> Result<
    HostRootFinishedWorkCommitHandoffRecordForCanary,
    HostRootFinishedWorkCommitHandoffErrorForCanary,
> {
    let Some(pending) = pending else {
        return Err(
            HostRootFinishedWorkCommitHandoffErrorForCanary::MissingFinishedWorkRecord {
                root: render.root(),
                finished_work: render.finished_work(),
            },
        );
    };

    validate_host_root_finished_work_pending_commit_for_canary(store, render, pending)?;
    let execution_request =
        HostRootFinishedWorkCommitExecutionRequestForCanary::new(pending, commit_order);
    let commit = commit_finished_host_root(store, render)?;
    let root = store.root(render.root()).map_err(RootCommitError::from)?;

    Ok(HostRootFinishedWorkCommitHandoffRecordForCanary {
        pending,
        execution_request,
        commit_order,
        commit,
        current_after_commit: root.current(),
        finished_work_after_commit: root.finished_work(),
        finished_lanes_after_commit: root.finished_lanes(),
        render_phase_work_after_commit: root.scheduling().work_in_progress(),
    })
}

#[cfg(test)]
#[allow(
    clippy::result_large_err,
    reason = "private canary handoff diagnostics intentionally retain full finished-work evidence"
)]
pub(crate) fn commit_completed_host_root_render_with_finished_work_handoff_for_canary<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    handoff_order: usize,
    commit_order: usize,
) -> Result<
    HostRootFinishedWorkCommitHandoffRecordForCanary,
    HostRootFinishedWorkCommitHandoffErrorForCanary,
> {
    validate_finished_host_root(store, render)?;
    {
        let root = store
            .root_mut(render.root())
            .map_err(RootCommitError::from)?;
        root.record_finished_work_for_canary(render.finished_work(), render.render_lanes());
    }

    let pending =
        record_host_root_finished_work_pending_commit_for_canary(store, render, handoff_order)?;
    commit_finished_host_root_with_finished_work_handoff_for_canary(
        store,
        render,
        Some(pending),
        commit_order,
    )
}

#[cfg(test)]
pub(crate) fn record_context_provider_update_two_consumer_commit_handoff_for_canary<
    H: HostTypes,
>(
    store: &FiberRootStore<H>,
    finished_work_handoff: &HostRootFinishedWorkCommitHandoffRecordForCanary,
    provider_update: ContextProviderUpdateTwoConsumerLaneRecord,
    request_order: usize,
) -> Result<
    HostRootContextProviderUpdateCommitHandoffRecordForCanary,
    HostRootContextProviderUpdateCommitHandoffErrorForCanary,
> {
    let commit = finished_work_handoff.commit();
    let root = commit.root();
    let finished_work = commit.finished_work();
    let propagation_lanes = provider_update.propagation_lanes();

    if !finished_work_handoff.proves_private_finished_work_commit_execution() {
        return Err(
            HostRootContextProviderUpdateCommitHandoffErrorForCanary::IncompleteFinishedWorkHandoff {
                root,
                finished_work,
            },
        );
    }

    if provider_update.root() != root {
        return Err(
            HostRootContextProviderUpdateCommitHandoffErrorForCanary::ContextUpdateRootMismatch {
                expected_root: root,
                actual_root: provider_update.root(),
            },
        );
    }
    if provider_update.host_root_work_in_progress() != finished_work {
        return Err(
            HostRootContextProviderUpdateCommitHandoffErrorForCanary::ContextUpdateFinishedWorkMismatch {
                root,
                expected_finished_work: finished_work,
                actual_host_root_work_in_progress: provider_update.host_root_work_in_progress(),
            },
        );
    }
    if !provider_update.provider_changed()
        || provider_update.marked_dependency_count() != provider_update.dependent_consumer_count()
        || !provider_update.all_marked_consumers_include_propagation_lanes()
    {
        return Err(
            HostRootContextProviderUpdateCommitHandoffErrorForCanary::ContextUpdateDidNotMarkChangedConsumers {
                root,
                expected_marked_count: provider_update.dependent_consumer_count(),
                actual_marked_count: provider_update.marked_dependency_count(),
            },
        );
    }

    let committed_consumers = provider_update.dependent_consumers().map(|consumer| {
        context_provider_update_commit_consumer_record_for_canary(
            store,
            root,
            finished_work,
            consumer,
        )
    });
    let [first_committed_consumer, second_committed_consumer] = committed_consumers;
    let committed_consumers = [first_committed_consumer?, second_committed_consumer?];

    let arena = store.fiber_arena();
    let host_root_child_lanes_after_commit = arena.get(finished_work)?.child_lanes();
    validate_context_provider_update_ancestor_child_lanes_for_canary(
        root,
        finished_work,
        propagation_lanes,
        host_root_child_lanes_after_commit,
    )?;
    let outer_provider_child_lanes_after_commit =
        arena.get(provider_update.outer_provider())?.child_lanes();
    validate_context_provider_update_ancestor_child_lanes_for_canary(
        root,
        provider_update.outer_provider(),
        propagation_lanes,
        outer_provider_child_lanes_after_commit,
    )?;
    let inner_provider_child_lanes_after_commit =
        arena.get(provider_update.inner_provider())?.child_lanes();
    validate_context_provider_update_ancestor_child_lanes_for_canary(
        root,
        provider_update.inner_provider(),
        propagation_lanes,
        inner_provider_child_lanes_after_commit,
    )?;

    let root_pending_lanes_after_commit = store
        .root(root)
        .map_err(RootCommitError::from)?
        .lanes()
        .pending_lanes();
    if !root_pending_lanes_after_commit.contains_all(propagation_lanes) {
        return Err(
            HostRootContextProviderUpdateCommitHandoffErrorForCanary::ContextUpdateRootPendingLanesMismatch {
                root,
                expected_lanes: propagation_lanes,
                actual_pending_lanes: root_pending_lanes_after_commit,
            },
        );
    }

    Ok(HostRootContextProviderUpdateCommitHandoffRecordForCanary {
        provider_update,
        finished_work_handoff: finished_work_handoff.clone(),
        request_order,
        committed_consumers,
        host_root_child_lanes_after_commit,
        outer_provider_child_lanes_after_commit,
        inner_provider_child_lanes_after_commit,
        root_pending_lanes_after_commit,
    })
}

#[cfg(test)]
fn context_provider_update_commit_consumer_record_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    consumer: ContextProviderUpdateConsumerLaneRecord,
) -> Result<
    HostRootContextProviderUpdateCommitConsumerLaneRecordForCanary,
    HostRootContextProviderUpdateCommitHandoffErrorForCanary,
> {
    if !committed_subtree_contains_fiber(store.fiber_arena(), finished_work, consumer.consumer())? {
        return Err(
            HostRootContextProviderUpdateCommitHandoffErrorForCanary::ContextUpdateConsumerNotCommitted {
                root,
                finished_work,
                consumer: consumer.consumer(),
            },
        );
    }

    let fiber_lanes_after_commit = store.fiber_arena().get(consumer.consumer())?.lanes();
    if !fiber_lanes_after_commit.contains_all(consumer.propagation_lanes()) {
        return Err(
            HostRootContextProviderUpdateCommitHandoffErrorForCanary::ContextUpdateConsumerLaneMismatch {
                root,
                consumer: consumer.consumer(),
                expected_lanes: consumer.propagation_lanes(),
                actual_lanes: fiber_lanes_after_commit,
            },
        );
    }

    Ok(
        HostRootContextProviderUpdateCommitConsumerLaneRecordForCanary {
            order: consumer.order(),
            consumer: consumer.consumer(),
            dependency_lanes: consumer.dependency_lanes(),
            propagation_lanes: consumer.propagation_lanes(),
            fiber_lanes_after_render: consumer.fiber_lanes_after(),
            fiber_lanes_after_commit,
        },
    )
}

#[cfg(test)]
fn validate_context_provider_update_ancestor_child_lanes_for_canary(
    root: FiberRootId,
    fiber: FiberId,
    expected_lanes: Lanes,
    actual_child_lanes: Lanes,
) -> Result<(), HostRootContextProviderUpdateCommitHandoffErrorForCanary> {
    if actual_child_lanes.contains_all(expected_lanes) {
        return Ok(());
    }

    Err(
        HostRootContextProviderUpdateCommitHandoffErrorForCanary::ContextUpdateAncestorChildLanesMismatch {
            root,
            fiber,
            expected_lanes,
            actual_child_lanes,
        },
    )
}

#[cfg(test)]
#[allow(
    clippy::result_large_err,
    reason = "private Offscreen reveal canary diagnostics preserve finished-work and reveal evidence"
)]
pub(crate) fn commit_offscreen_reveal_complete_metadata_handoff_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    pending: Option<HostRootFinishedWorkPendingCommitRecordForCanary>,
    reveal_metadata: OffscreenRevealCommitMetadataRecord,
    commit_order: usize,
) -> Result<
    HostRootOffscreenRevealCommitHandoffRecordForCanary,
    HostRootOffscreenRevealCommitHandoffErrorForCanary,
> {
    let Some(pending) = pending else {
        return Err(
            HostRootFinishedWorkCommitHandoffErrorForCanary::MissingFinishedWorkRecord {
                root: render.root(),
                finished_work: render.finished_work(),
            }
            .into(),
        );
    };

    validate_host_root_finished_work_pending_commit_for_canary(store, render, pending)?;
    let execution_request = validate_offscreen_reveal_commit_metadata_for_canary(
        store,
        render,
        pending,
        &reveal_metadata,
        commit_order,
    )?;
    let finished_work_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        store,
        render,
        Some(pending),
        commit_order,
    )?;

    Ok(HostRootOffscreenRevealCommitHandoffRecordForCanary {
        reveal_metadata,
        execution_request,
        finished_work_handoff,
    })
}

#[cfg(test)]
#[allow(
    clippy::result_large_err,
    reason = "private Offscreen reveal canary diagnostics preserve finished-work and reveal evidence"
)]
fn validate_offscreen_reveal_commit_metadata_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    reveal_metadata: &OffscreenRevealCommitMetadataRecord,
    request_order: usize,
) -> Result<
    HostRootOffscreenRevealCommitExecutionRequestForCanary,
    HostRootOffscreenRevealCommitHandoffErrorForCanary,
> {
    let root = render.root();
    let expected_lanes = render.render_lanes();
    if reveal_metadata.committed_lanes() != expected_lanes
        || reveal_metadata.committed_lanes() != pending.finished_lanes()
    {
        return Err(
            HostRootOffscreenRevealCommitHandoffErrorForCanary::RevealCommitLanesMismatch {
                root,
                expected_render_lanes: expected_lanes,
                expected_finished_lanes: pending.finished_lanes(),
                actual_committed_lanes: reveal_metadata.committed_lanes(),
            },
        );
    }

    let hidden_update_lane = expected_lanes
        .remove_lane(Lane::OFFSCREEN)
        .highest_priority_lane();
    let hidden_update_count = store
        .root(root)
        .map_err(RootCommitError::from)
        .map_err(HostRootFinishedWorkCommitHandoffErrorForCanary::from)?
        .lanes()
        .hidden_update_count(hidden_update_lane)
        .unwrap_or_default();
    if hidden_update_lane.is_empty()
        || hidden_update_count == 0
        || !expected_lanes.contains_lane(Lane::OFFSCREEN)
        || !reveal_metadata
            .transition()
            .records_offscreen_lane_participation()
    {
        return Err(
            HostRootOffscreenRevealCommitHandoffErrorForCanary::OffscreenLaneMetadataMissing {
                root,
                pending_lanes_before_commit: pending.pending_lanes_before_commit(),
                render_lanes: expected_lanes,
            },
        );
    }

    let arena = store.fiber_arena();
    let finished_work = render.finished_work();
    let finished_node = arena.get(finished_work)?;
    let actual_root_child = finished_node.child();
    let actual_root_child_tag = actual_root_child
        .map(|child| arena.get(child).map(|node| node.tag()))
        .transpose()?;
    if actual_root_child != Some(reveal_metadata.offscreen()) {
        return Err(
            HostRootOffscreenRevealCommitHandoffErrorForCanary::ExpectedHostRootOffscreenChild {
                root,
                finished_work,
                expected_offscreen: reveal_metadata.offscreen(),
                actual_child: actual_root_child,
                actual_tag: actual_root_child_tag,
            },
        );
    }

    let offscreen_node = arena.get(reveal_metadata.offscreen())?;
    if offscreen_node.tag() != FiberTag::Offscreen {
        return Err(
            HostRootOffscreenRevealCommitHandoffErrorForCanary::ExpectedOffscreenFiber {
                offscreen: reveal_metadata.offscreen(),
                tag: offscreen_node.tag(),
            },
        );
    }

    let actual_reveal_child = offscreen_node.child();
    let actual_reveal_child_tag = actual_reveal_child
        .map(|child| arena.get(child).map(|node| node.tag()))
        .transpose()?;
    if actual_reveal_child != Some(reveal_metadata.child()) {
        return Err(
            HostRootOffscreenRevealCommitHandoffErrorForCanary::ExpectedRevealChild {
                offscreen: reveal_metadata.offscreen(),
                expected_child: reveal_metadata.child(),
                actual_child: actual_reveal_child,
                actual_tag: actual_reveal_child_tag,
            },
        );
    }

    let child_node = arena.get(reveal_metadata.child())?;
    if child_node.tag() != reveal_metadata.child_tag() {
        return Err(
            HostRootOffscreenRevealCommitHandoffErrorForCanary::RevealChildTagMismatch {
                child: reveal_metadata.child(),
                expected_tag: reveal_metadata.child_tag(),
                actual_tag: child_node.tag(),
            },
        );
    }
    if child_node.return_fiber() != Some(reveal_metadata.offscreen()) {
        return Err(
            HostRootOffscreenRevealCommitHandoffErrorForCanary::RevealChildParentMismatch {
                offscreen: reveal_metadata.offscreen(),
                child: reveal_metadata.child(),
                actual_parent: child_node.return_fiber(),
            },
        );
    }
    if let Some(sibling) = child_node.sibling() {
        return Err(
            HostRootOffscreenRevealCommitHandoffErrorForCanary::UnexpectedRevealChildSibling {
                offscreen: reveal_metadata.offscreen(),
                child: reveal_metadata.child(),
                sibling,
                sibling_tag: arena.get(sibling)?.tag(),
            },
        );
    }

    let transition = reveal_metadata.transition();
    if transition.work_in_progress() != reveal_metadata.offscreen()
        || transition.render_lanes() != expected_lanes
        || !transition.is_hidden_to_visible_reveal()
    {
        return Err(
            HostRootOffscreenRevealCommitHandoffErrorForCanary::StaleRevealTransition {
                offscreen: reveal_metadata.offscreen(),
                transition_offscreen: transition.work_in_progress(),
                expected_render_lanes: expected_lanes,
                actual_transition_lanes: transition.render_lanes(),
            },
        );
    }

    let actual_candidate_subtree_flags = child_node.flags() | child_node.subtree_flags();
    let actual_child_may_suspend_commit =
        actual_candidate_subtree_flags.contains_any(FiberFlags::MAY_SUSPEND_COMMIT);
    if actual_candidate_subtree_flags != reveal_metadata.candidate_subtree_flags()
        || actual_child_may_suspend_commit != reveal_metadata.child_may_suspend_commit()
        || reveal_metadata.would_accumulate_newly_visible_suspensey_commit()
            != reveal_metadata.child_may_suspend_commit()
    {
        return Err(
            HostRootOffscreenRevealCommitHandoffErrorForCanary::StaleRevealChildFlags {
                offscreen: reveal_metadata.offscreen(),
                child: reveal_metadata.child(),
                expected_candidate_subtree_flags: reveal_metadata.candidate_subtree_flags(),
                actual_candidate_subtree_flags,
            },
        );
    }

    if reveal_metadata.status()
        != OffscreenRevealCommitMetadataStatus::AcceptedHiddenToVisibleReveal
        || reveal_metadata.subtree_flag_bubbling_intent()
            != OffscreenVisibilitySubtreeFlagBubblingIntent::BubbleVisibleSubtree
        || reveal_metadata.feature() != OFFSCREEN_UNSUPPORTED_FEATURE
        || !reveal_metadata.visibility_effect_required()
        || reveal_metadata.visibility_flag_set()
    {
        return Err(
            HostRootOffscreenRevealCommitHandoffErrorForCanary::UnsupportedRevealMetadata {
                root,
                offscreen: reveal_metadata.offscreen(),
                status: reveal_metadata.status(),
                intent: reveal_metadata.subtree_flag_bubbling_intent(),
                feature: reveal_metadata.feature(),
                visibility_effect_required: reveal_metadata.visibility_effect_required(),
                visibility_flag_set: reveal_metadata.visibility_flag_set(),
            },
        );
    }

    if !reveal_metadata.host_visibility_mutation_blocked() {
        return Err(
            HostRootOffscreenRevealCommitHandoffErrorForCanary::RevealCommitBlockerMissing {
                root,
                offscreen: reveal_metadata.offscreen(),
                blocker:
                    HostRootOffscreenRevealCommitExecutionBlockerForCanary::HostVisibilityMutation,
            },
        );
    }
    if !reveal_metadata.passive_visibility_effects_blocked() {
        return Err(
            HostRootOffscreenRevealCommitHandoffErrorForCanary::RevealCommitBlockerMissing {
                root,
                offscreen: reveal_metadata.offscreen(),
                blocker:
                    HostRootOffscreenRevealCommitExecutionBlockerForCanary::PassiveVisibilityEffects,
            },
        );
    }
    if !reveal_metadata.public_compatibility_blocked() {
        return Err(
            HostRootOffscreenRevealCommitHandoffErrorForCanary::RevealCommitBlockerMissing {
                root,
                offscreen: reveal_metadata.offscreen(),
                blocker:
                    HostRootOffscreenRevealCommitExecutionBlockerForCanary::PublicOffscreenCompatibility,
            },
        );
    }

    Ok(HostRootOffscreenRevealCommitExecutionRequestForCanary {
        pending,
        reveal_metadata: reveal_metadata.clone(),
        request_order,
        status: HostRootOffscreenRevealCommitExecutionStatusForCanary::ValidatedForCommitHandoff,
        blockers: HOST_ROOT_OFFSCREEN_REVEAL_COMMIT_EXECUTION_BLOCKERS,
        hidden_update_lane,
        hidden_update_count,
        actual_child_flags: child_node.flags(),
        actual_child_subtree_flags: child_node.subtree_flags(),
    })
}

#[cfg(test)]
#[allow(
    clippy::result_large_err,
    reason = "private dangerousHTML/text reset canary diagnostics preserve finished-work and complete-work evidence"
)]
pub(crate) fn commit_dangerous_html_text_reset_complete_work_handoff_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    pending: Option<HostRootFinishedWorkPendingCommitRecordForCanary>,
    complete_work: HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
    mutation_index: usize,
    commit_order: usize,
    request_order: usize,
) -> Result<
    HostRootDangerousHtmlTextResetCommitHandoffRecordForCanary,
    HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary,
> {
    let Some(pending) = pending else {
        return Err(
            HostRootFinishedWorkCommitHandoffErrorForCanary::MissingFinishedWorkRecord {
                root: render.root(),
                finished_work: render.finished_work(),
            }
            .into(),
        );
    };

    validate_host_root_finished_work_pending_commit_for_canary(store, render, pending)?;
    let execution_request = validate_dangerous_html_text_reset_commit_metadata_for_canary(
        store,
        render,
        pending,
        complete_work,
        mutation_index,
        commit_order,
        request_order,
    )?;
    let finished_work_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        store,
        render,
        Some(pending),
        commit_order,
    )?;

    Ok(HostRootDangerousHtmlTextResetCommitHandoffRecordForCanary {
        complete_work,
        execution_request,
        finished_work_handoff,
    })
}

#[cfg(test)]
fn validate_dangerous_html_text_reset_commit_metadata_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    complete_work: HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
    mutation_index: usize,
    commit_order: usize,
    request_order: usize,
) -> Result<
    HostRootDangerousHtmlTextResetCommitExecutionRequestForCanary,
    HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary,
> {
    validate_finished_host_root(store, render)?;

    let root = render.root();
    let finished_work = render.finished_work();
    if complete_work.root() != root {
        return Err(
            HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary::MetadataRootMismatch {
                expected_root: root,
                actual_root: complete_work.root(),
            },
        );
    }
    if complete_work.public_dom_compatibility_claimed()
        || complete_work
            .payload_kind()
            .public_dom_property_compatibility_claimed()
    {
        return Err(
            HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary::PublicCompatibilityClaimed {
                root,
                fiber: complete_work.work_in_progress(),
                payload_kind: complete_work.payload_kind(),
            },
        );
    }

    let mutation_log =
        collect_host_root_mutation_phase_log(store, root, finished_work, render.render_lanes())?;
    let deletion_lists = collect_deletion_list_metadata(store, finished_work)?;
    let mutation_apply_log = collect_host_root_mutation_apply_log(
        store,
        root,
        finished_work,
        render.render_lanes(),
        &mutation_log,
        &deletion_lists,
    )?;
    let mutation = mutation_apply_log
        .records()
        .get(mutation_index)
        .copied()
        .ok_or(
            HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary::MissingMutationApplyRecord {
                root,
                finished_work,
                mutation_index,
            },
        )?;

    validate_dangerous_html_text_reset_mutation_record(
        root,
        finished_work,
        complete_work,
        mutation,
    )?;

    Ok(HostRootDangerousHtmlTextResetCommitExecutionRequestForCanary {
        root,
        root_token: pending.root_token(),
        previous_current: pending.previous_current(),
        finished_work,
        committed_current: finished_work,
        source_handoff_order: pending.handoff_order(),
        commit_order,
        request_order,
        mutation_index,
        mutation,
        complete_work,
        status:
            HostRootDangerousHtmlTextResetCommitExecutionStatusForCanary::ValidatedForTestHostMutation,
        blockers: HOST_ROOT_DANGEROUS_HTML_TEXT_RESET_COMMIT_EXECUTION_BLOCKERS,
    })
}

#[cfg(test)]
fn validate_dangerous_html_text_reset_mutation_record(
    root: FiberRootId,
    finished_work: FiberId,
    complete_work: HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> Result<(), HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary> {
    if mutation.root() != root || mutation.host_root() != finished_work {
        return Err(
            HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary::MetadataRootMismatch {
                expected_root: root,
                actual_root: mutation.root(),
            },
        );
    }
    if mutation.kind() != HostRootMutationApplyRecordKind::CommitHostComponentUpdate {
        return Err(
            HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary::UnexpectedMutationApplyKind {
                root,
                fiber: mutation.fiber(),
                expected: HostRootMutationApplyRecordKind::CommitHostComponentUpdate,
                actual: mutation.kind(),
            },
        );
    }
    if mutation.tag() != FiberTag::HostComponent {
        return Err(
            HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary::UnexpectedMutationApplyKind {
                root,
                fiber: mutation.fiber(),
                expected: HostRootMutationApplyRecordKind::CommitHostComponentUpdate,
                actual: mutation.kind(),
            },
        );
    }
    if mutation.fiber() != complete_work.work_in_progress() {
        return Err(
            HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary::MetadataFiberMismatch {
                root,
                expected_fiber: complete_work.work_in_progress(),
                actual_fiber: mutation.fiber(),
            },
        );
    }
    if mutation.alternate_fiber() != Some(complete_work.current()) {
        return Err(
            HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary::MetadataCurrentMismatch {
                root,
                expected_current: complete_work.current(),
                actual_current: mutation.alternate_fiber(),
            },
        );
    }
    if mutation.state_node() != complete_work.state_node() {
        return Err(
            HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary::MetadataStateNodeMismatch {
                root,
                fiber: mutation.fiber(),
                expected_state_node: complete_work.state_node(),
                actual_state_node: mutation.state_node(),
            },
        );
    }
    if mutation.pending_props() != complete_work.new_props()
        || mutation.memoized_props() != complete_work.new_props()
        || mutation.alternate_memoized_props() != Some(complete_work.old_props())
    {
        return Err(
            HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary::MetadataPropsMismatch {
                root,
                fiber: mutation.fiber(),
                expected_old_props: complete_work.old_props(),
                actual_alternate_memoized_props: mutation.alternate_memoized_props(),
                expected_new_props: complete_work.new_props(),
                actual_pending_props: mutation.pending_props(),
                actual_memoized_props: mutation.memoized_props(),
            },
        );
    }
    if !mutation.effect_flag().contains_all(FiberFlags::UPDATE) {
        return Err(
            HostRootDangerousHtmlTextResetCommitHandoffErrorForCanary::HostComponentUpdateFlagMissing {
                root,
                fiber: mutation.fiber(),
                effect_flag: mutation.effect_flag(),
            },
        );
    }

    Ok(())
}

#[cfg(test)]
fn dangerous_html_text_reset_metadata_matches_mutation(
    complete_work: HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> bool {
    mutation.kind() == HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        && mutation.tag() == FiberTag::HostComponent
        && mutation.fiber() == complete_work.work_in_progress()
        && mutation.alternate_fiber() == Some(complete_work.current())
        && mutation.state_node() == complete_work.state_node()
        && mutation.pending_props() == complete_work.new_props()
        && mutation.memoized_props() == complete_work.new_props()
        && mutation.alternate_memoized_props() == Some(complete_work.old_props())
        && mutation.effect_flag().contains_all(FiberFlags::UPDATE)
}

#[cfg(test)]
pub(crate) fn commit_managed_child_complete_work_handoff_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    pending: Option<HostRootFinishedWorkPendingCommitRecordForCanary>,
    complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    mutation_index: usize,
    commit_order: usize,
    request_order: usize,
) -> Result<
    HostRootManagedChildCommitHandoffRecordForCanary,
    HostRootManagedChildCommitHandoffErrorForCanary,
> {
    let Some(pending) = pending else {
        return Err(
            HostRootFinishedWorkCommitHandoffErrorForCanary::MissingFinishedWorkRecord {
                root: render.root(),
                finished_work: render.finished_work(),
            }
            .into(),
        );
    };

    validate_host_root_finished_work_pending_commit_for_canary(store, render, pending)?;
    let execution_request = validate_managed_child_commit_metadata_for_canary(
        store,
        render,
        pending,
        complete_work,
        mutation_index,
        commit_order,
        request_order,
    )?;
    let finished_work_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        store,
        render,
        Some(pending),
        commit_order,
    )?;

    Ok(HostRootManagedChildCommitHandoffRecordForCanary {
        complete_work,
        execution_request,
        finished_work_handoff,
    })
}

#[cfg(test)]
pub(crate) fn commit_managed_child_sibling_order_complete_work_handoff_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    pending: Option<HostRootFinishedWorkPendingCommitRecordForCanary>,
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    mutation_index: usize,
    commit_order: usize,
    request_order: usize,
) -> Result<
    HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary,
    HostRootManagedChildCommitHandoffErrorForCanary,
> {
    let Some(pending) = pending else {
        return Err(
            HostRootFinishedWorkCommitHandoffErrorForCanary::MissingFinishedWorkRecord {
                root: render.root(),
                finished_work: render.finished_work(),
            }
            .into(),
        );
    };

    validate_host_root_finished_work_pending_commit_for_canary(store, render, pending)?;
    let execution_request = validate_managed_child_sibling_order_commit_metadata_for_canary(
        store,
        render,
        pending,
        complete_work,
        mutation_index,
        commit_order,
        request_order,
    )?;
    let finished_work_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
        store,
        render,
        Some(pending),
        commit_order,
    )?;

    Ok(
        HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary {
            complete_work,
            execution_request,
            finished_work_handoff,
        },
    )
}

#[cfg(test)]
fn validate_managed_child_commit_metadata_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    mutation_index: usize,
    commit_order: usize,
    request_order: usize,
) -> Result<
    HostRootManagedChildCommitExecutionRequestForCanary,
    HostRootManagedChildCommitHandoffErrorForCanary,
> {
    validate_finished_host_root(store, render)?;

    let root = render.root();
    let finished_work = render.finished_work();
    if complete_work.root() != root {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataRootMismatch {
                expected_root: root,
                actual_root: complete_work.root(),
            },
        );
    }
    if complete_work.public_dom_compatibility_claimed()
        || complete_work.test_renderer_compatibility_claimed()
        || complete_work.broad_reconciliation_traversal_claimed()
    {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::PublicCompatibilityClaimed {
                root,
                fiber: complete_work.child(),
                kind: complete_work.kind(),
            },
        );
    }

    let mutation_log =
        collect_host_root_mutation_phase_log(store, root, finished_work, render.render_lanes())?;
    let deletion_lists = collect_deletion_list_metadata(store, finished_work)?;
    let mutation_apply_log = collect_host_root_mutation_apply_log(
        store,
        root,
        finished_work,
        render.render_lanes(),
        &mutation_log,
        &deletion_lists,
    )?;
    let mutation = mutation_apply_log
        .records()
        .get(mutation_index)
        .copied()
        .ok_or(
            HostRootManagedChildCommitHandoffErrorForCanary::MissingMutationApplyRecord {
                root,
                finished_work,
                mutation_index,
            },
        )?;

    validate_managed_child_mutation_record(root, finished_work, complete_work, mutation)?;

    Ok(HostRootManagedChildCommitExecutionRequestForCanary {
        root,
        root_token: pending.root_token(),
        previous_current: pending.previous_current(),
        finished_work,
        committed_current: finished_work,
        source_handoff_order: pending.handoff_order(),
        commit_order,
        request_order,
        mutation_index,
        mutation,
        complete_work,
        status: HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation,
        blockers: HOST_ROOT_MANAGED_CHILD_COMMIT_EXECUTION_BLOCKERS,
    })
}

#[cfg(test)]
fn validate_managed_child_sibling_order_commit_metadata_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    mutation_index: usize,
    commit_order: usize,
    request_order: usize,
) -> Result<
    HostRootManagedChildSiblingOrderCommitExecutionRequestForCanary,
    HostRootManagedChildCommitHandoffErrorForCanary,
> {
    validate_finished_host_root(store, render)?;

    let root = render.root();
    let finished_work = render.finished_work();
    if complete_work.root() != root {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataRootMismatch {
                expected_root: root,
                actual_root: complete_work.root(),
            },
        );
    }
    if complete_work.public_dom_compatibility_claimed()
        || complete_work.test_renderer_compatibility_claimed()
        || complete_work.broad_reconciliation_traversal_claimed()
    {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::PublicCompatibilityClaimed {
                root,
                fiber: complete_work.child(),
                kind: complete_work.kind(),
            },
        );
    }

    validate_managed_child_sibling_order_topology(store.fiber_arena(), root, complete_work)?;

    let mutation_log =
        collect_host_root_mutation_phase_log(store, root, finished_work, render.render_lanes())?;
    let deletion_lists = collect_deletion_list_metadata(store, finished_work)?;
    let mutation_apply_log = collect_host_root_mutation_apply_log(
        store,
        root,
        finished_work,
        render.render_lanes(),
        &mutation_log,
        &deletion_lists,
    )?;
    let mutation = mutation_apply_log
        .records()
        .get(mutation_index)
        .copied()
        .ok_or(
            HostRootManagedChildCommitHandoffErrorForCanary::MissingMutationApplyRecord {
                root,
                finished_work,
                mutation_index,
            },
        )?;

    validate_managed_child_sibling_order_mutation_record(
        root,
        finished_work,
        complete_work,
        mutation,
    )?;

    Ok(
        HostRootManagedChildSiblingOrderCommitExecutionRequestForCanary {
            root,
            root_token: pending.root_token(),
            previous_current: pending.previous_current(),
            finished_work,
            committed_current: finished_work,
            source_handoff_order: pending.handoff_order(),
            commit_order,
            request_order,
            mutation_index,
            mutation,
            complete_work,
            status:
                HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation,
            blockers: HOST_ROOT_MANAGED_CHILD_COMMIT_EXECUTION_BLOCKERS,
        },
    )
}

#[cfg(test)]
fn validate_managed_child_mutation_record(
    root: FiberRootId,
    finished_work: FiberId,
    complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> Result<(), HostRootManagedChildCommitHandoffErrorForCanary> {
    if mutation.root() != root || mutation.host_root() != finished_work {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataRootMismatch {
                expected_root: root,
                actual_root: mutation.root(),
            },
        );
    }

    let expected_kind = expected_managed_child_mutation_apply_kind(complete_work.kind());
    if mutation.kind() != expected_kind {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::UnexpectedMutationApplyKind {
                root,
                fiber: mutation.fiber(),
                expected: expected_kind,
                actual: mutation.kind(),
            },
        );
    }
    validate_managed_child_mutation_source(root, complete_work, mutation)?;

    if mutation.parent() != complete_work.parent_work_in_progress()
        || mutation.parent_tag() != FiberTag::HostComponent
    {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataParentMismatch {
                root,
                expected_parent: complete_work.parent_work_in_progress(),
                actual_parent: mutation.parent(),
                actual_parent_tag: mutation.parent_tag(),
            },
        );
    }
    if mutation.parent_state_node() != complete_work.parent_state_node() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataParentStateNodeMismatch {
                root,
                parent: mutation.parent(),
                expected_state_node: complete_work.parent_state_node(),
                actual_state_node: mutation.parent_state_node(),
            },
        );
    }
    if mutation.fiber() != complete_work.child() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildMismatch {
                root,
                expected_child: complete_work.child(),
                actual_child: mutation.fiber(),
            },
        );
    }
    if mutation.tag() != complete_work.child_tag() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildTagMismatch {
                root,
                child: mutation.fiber(),
                expected_tag: complete_work.child_tag(),
                actual_tag: mutation.tag(),
            },
        );
    }
    if mutation.state_node() != complete_work.child_state_node() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildStateNodeMismatch {
                root,
                child: mutation.fiber(),
                expected_state_node: complete_work.child_state_node(),
                actual_state_node: mutation.state_node(),
            },
        );
    }
    if mutation.pending_props() != complete_work.child_pending_props()
        || mutation.memoized_props() != complete_work.child_memoized_props()
    {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildPropsMismatch {
                root,
                child: mutation.fiber(),
                expected_pending_props: complete_work.child_pending_props(),
                expected_memoized_props: complete_work.child_memoized_props(),
                actual_pending_props: mutation.pending_props(),
                actual_memoized_props: mutation.memoized_props(),
            },
        );
    }
    if mutation.alternate_fiber() != complete_work.child_alternate() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildAlternateMismatch {
                root,
                child: mutation.fiber(),
                expected_alternate: complete_work.child_alternate(),
                actual_alternate: mutation.alternate_fiber(),
            },
        );
    }
    if !mutation
        .effect_flag()
        .contains_all(complete_work.expected_effect_flag())
    {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataEffectFlagMissing {
                root,
                fiber: mutation.fiber(),
                expected: complete_work.expected_effect_flag(),
                actual: mutation.effect_flag(),
            },
        );
    }
    validate_managed_child_placement_sibling(root, complete_work, mutation)?;

    Ok(())
}

#[cfg(test)]
fn validate_managed_child_sibling_order_topology(
    arena: &FiberArena,
    root: FiberRootId,
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
) -> Result<(), HostRootManagedChildCommitHandoffErrorForCanary> {
    let order_sibling_node = arena
        .get(complete_work.order_sibling())
        .map_err(RootCommitError::from)?;
    if order_sibling_node.tag() != complete_work.order_sibling_tag() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingTagMismatch {
                root,
                sibling: complete_work.order_sibling(),
                expected_tag: complete_work.order_sibling_tag(),
                actual_tag: order_sibling_node.tag(),
            },
        );
    }
    if order_sibling_node.state_node() != complete_work.order_sibling_state_node() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingStateNodeMismatch {
                root,
                sibling: complete_work.order_sibling(),
                expected_state_node: complete_work.order_sibling_state_node(),
                actual_state_node: order_sibling_node.state_node(),
            },
        );
    }
    if order_sibling_node.pending_props() != complete_work.order_sibling_pending_props()
        || order_sibling_node.memoized_props() != complete_work.order_sibling_memoized_props()
    {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingPropsMismatch {
                root,
                sibling: complete_work.order_sibling(),
                expected_pending_props: complete_work.order_sibling_pending_props(),
                expected_memoized_props: complete_work.order_sibling_memoized_props(),
                actual_pending_props: order_sibling_node.pending_props(),
                actual_memoized_props: order_sibling_node.memoized_props(),
            },
        );
    }
    if order_sibling_node.alternate() != complete_work.order_sibling_alternate() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingAlternateMismatch {
                root,
                sibling: complete_work.order_sibling(),
                expected_alternate: complete_work.order_sibling_alternate(),
                actual_alternate: order_sibling_node.alternate(),
            },
        );
    }

    match complete_work.kind() {
        HostComponentManagedChildMutationKindForCanary::Placement => {
            let child_node = arena
                .get(complete_work.child())
                .map_err(RootCommitError::from)?;
            if child_node.sibling() != Some(complete_work.order_sibling()) {
                return Err(
                    HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingMismatch {
                        root,
                        fiber: complete_work.child(),
                        expected_sibling: complete_work.order_sibling(),
                        actual_sibling: child_node.sibling(),
                    },
                );
            }
        }
        HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
            let Some(previous_current) = complete_work.order_sibling_alternate() else {
                return Err(
                    HostRootManagedChildCommitHandoffErrorForCanary::MetadataPreviousSiblingOrderMismatch {
                        root,
                        parent: complete_work.parent_work_in_progress(),
                        deleted_child: complete_work.child(),
                        expected_previous_sibling: complete_work.order_sibling(),
                        actual_previous_sibling: None,
                    },
                );
            };
            let previous_current_node =
                arena.get(previous_current).map_err(RootCommitError::from)?;
            if previous_current_node.sibling() != Some(complete_work.child()) {
                return Err(
                    HostRootManagedChildCommitHandoffErrorForCanary::MetadataPreviousSiblingOrderMismatch {
                        root,
                        parent: complete_work.parent_work_in_progress(),
                        deleted_child: complete_work.child(),
                        expected_previous_sibling: complete_work.order_sibling(),
                        actual_previous_sibling: previous_current_node.sibling(),
                    },
                );
            }
        }
    }

    Ok(())
}

#[cfg(test)]
fn validate_managed_child_sibling_order_mutation_record(
    root: FiberRootId,
    finished_work: FiberId,
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> Result<(), HostRootManagedChildCommitHandoffErrorForCanary> {
    if mutation.root() != root || mutation.host_root() != finished_work {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataRootMismatch {
                expected_root: root,
                actual_root: mutation.root(),
            },
        );
    }

    let expected_kind = expected_managed_child_sibling_order_mutation_apply_kind(complete_work);
    if mutation.kind() != expected_kind {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::UnexpectedMutationApplyKind {
                root,
                fiber: mutation.fiber(),
                expected: expected_kind,
                actual: mutation.kind(),
            },
        );
    }
    validate_managed_child_sibling_order_mutation_source(root, complete_work, mutation)?;

    if mutation.parent() != complete_work.parent_work_in_progress()
        || mutation.parent_tag() != FiberTag::HostComponent
    {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataParentMismatch {
                root,
                expected_parent: complete_work.parent_work_in_progress(),
                actual_parent: mutation.parent(),
                actual_parent_tag: mutation.parent_tag(),
            },
        );
    }
    if mutation.parent_state_node() != complete_work.parent_state_node() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataParentStateNodeMismatch {
                root,
                parent: mutation.parent(),
                expected_state_node: complete_work.parent_state_node(),
                actual_state_node: mutation.parent_state_node(),
            },
        );
    }
    if mutation.fiber() != complete_work.child() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildMismatch {
                root,
                expected_child: complete_work.child(),
                actual_child: mutation.fiber(),
            },
        );
    }
    if mutation.tag() != complete_work.child_tag() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildTagMismatch {
                root,
                child: mutation.fiber(),
                expected_tag: complete_work.child_tag(),
                actual_tag: mutation.tag(),
            },
        );
    }
    if mutation.state_node() != complete_work.child_state_node() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildStateNodeMismatch {
                root,
                child: mutation.fiber(),
                expected_state_node: complete_work.child_state_node(),
                actual_state_node: mutation.state_node(),
            },
        );
    }
    if mutation.pending_props() != complete_work.child_pending_props()
        || mutation.memoized_props() != complete_work.child_memoized_props()
    {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildPropsMismatch {
                root,
                child: mutation.fiber(),
                expected_pending_props: complete_work.child_pending_props(),
                expected_memoized_props: complete_work.child_memoized_props(),
                actual_pending_props: mutation.pending_props(),
                actual_memoized_props: mutation.memoized_props(),
            },
        );
    }
    if mutation.alternate_fiber() != complete_work.child_alternate() {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataChildAlternateMismatch {
                root,
                child: mutation.fiber(),
                expected_alternate: complete_work.child_alternate(),
                actual_alternate: mutation.alternate_fiber(),
            },
        );
    }
    if !mutation
        .effect_flag()
        .contains_all(complete_work.expected_effect_flag())
    {
        return Err(
            HostRootManagedChildCommitHandoffErrorForCanary::MetadataEffectFlagMissing {
                root,
                fiber: mutation.fiber(),
                expected: complete_work.expected_effect_flag(),
                actual: mutation.effect_flag(),
            },
        );
    }

    validate_managed_child_sibling_order_apply_evidence(root, complete_work, mutation)
}

#[cfg(test)]
fn validate_managed_child_sibling_order_mutation_source(
    root: FiberRootId,
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> Result<(), HostRootManagedChildCommitHandoffErrorForCanary> {
    match complete_work.kind() {
        HostComponentManagedChildMutationKindForCanary::Placement
            if mutation.source()
                == HostRootMutationApplyRecordSource::MutationPhase(
                    HostRootMutationPhaseRecordKind::Placement,
                ) =>
        {
            Ok(())
        }
        HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
            if let (Some(expected), HostRootMutationApplyRecordSource::DeletionList(actual)) =
                (complete_work.deletion_list(), mutation.source())
                && expected == actual
            {
                return Ok(());
            }
            Err(
                HostRootManagedChildCommitHandoffErrorForCanary::MetadataDeletionListMismatch {
                    root,
                    fiber: mutation.fiber(),
                    expected: complete_work.deletion_list(),
                    actual: mutation.source(),
                },
            )
        }
        kind => Err(
            HostRootManagedChildCommitHandoffErrorForCanary::UnexpectedMutationApplySource {
                root,
                fiber: mutation.fiber(),
                kind,
                actual: mutation.source(),
            },
        ),
    }
}

#[cfg(test)]
fn validate_managed_child_sibling_order_apply_evidence(
    root: FiberRootId,
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> Result<(), HostRootManagedChildCommitHandoffErrorForCanary> {
    match complete_work.kind() {
        HostComponentManagedChildMutationKindForCanary::Placement => {
            let Some(sibling) = mutation.placement_sibling() else {
                return Err(
                    HostRootManagedChildCommitHandoffErrorForCanary::MetadataPlacementSiblingMismatch {
                        root,
                        fiber: mutation.fiber(),
                        placement_sibling: None,
                    },
                );
            };
            if sibling.status() != HostRootPlacementSiblingStatus::InsertBefore
                || sibling.sibling() != Some(complete_work.order_sibling())
                || sibling.sibling_tag() != Some(complete_work.order_sibling_tag())
                || sibling.sibling_state_node() != complete_work.order_sibling_state_node()
                || sibling.skipped_pending_sibling_count() != 0
                || !sibling.can_insert_before()
            {
                return Err(
                    HostRootManagedChildCommitHandoffErrorForCanary::MetadataPlacementSiblingMismatch {
                        root,
                        fiber: mutation.fiber(),
                        placement_sibling: Some(sibling),
                    },
                );
            }
            Ok(())
        }
        HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
            if mutation.placement_sibling().is_some() {
                return Err(
                    HostRootManagedChildCommitHandoffErrorForCanary::MetadataPlacementSiblingMismatch {
                        root,
                        fiber: mutation.fiber(),
                        placement_sibling: mutation.placement_sibling(),
                    },
                );
            }
            Ok(())
        }
    }
}

#[cfg(test)]
fn validate_managed_child_mutation_source(
    root: FiberRootId,
    complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> Result<(), HostRootManagedChildCommitHandoffErrorForCanary> {
    match complete_work.kind() {
        HostComponentManagedChildMutationKindForCanary::Placement
            if mutation.source()
                == HostRootMutationApplyRecordSource::MutationPhase(
                    HostRootMutationPhaseRecordKind::Placement,
                ) =>
        {
            Ok(())
        }
        HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
            if let (Some(expected), HostRootMutationApplyRecordSource::DeletionList(actual)) =
                (complete_work.deletion_list(), mutation.source())
                && expected == actual
            {
                return Ok(());
            }
            Err(
                HostRootManagedChildCommitHandoffErrorForCanary::MetadataDeletionListMismatch {
                    root,
                    fiber: mutation.fiber(),
                    expected: complete_work.deletion_list(),
                    actual: mutation.source(),
                },
            )
        }
        kind => Err(
            HostRootManagedChildCommitHandoffErrorForCanary::UnexpectedMutationApplySource {
                root,
                fiber: mutation.fiber(),
                kind,
                actual: mutation.source(),
            },
        ),
    }
}

#[cfg(test)]
fn validate_managed_child_placement_sibling(
    root: FiberRootId,
    complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> Result<(), HostRootManagedChildCommitHandoffErrorForCanary> {
    match complete_work.kind() {
        HostComponentManagedChildMutationKindForCanary::Placement => {
            let Some(sibling) = mutation.placement_sibling() else {
                return Err(
                    HostRootManagedChildCommitHandoffErrorForCanary::MetadataPlacementSiblingMismatch {
                        root,
                        fiber: mutation.fiber(),
                        placement_sibling: None,
                    },
                );
            };
            if sibling.status() != HostRootPlacementSiblingStatus::Append
                || sibling.sibling().is_some()
                || sibling.sibling_tag().is_some()
                || !sibling.sibling_state_node().is_none()
            {
                return Err(
                    HostRootManagedChildCommitHandoffErrorForCanary::MetadataPlacementSiblingMismatch {
                        root,
                        fiber: mutation.fiber(),
                        placement_sibling: Some(sibling),
                    },
                );
            }
            Ok(())
        }
        HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
            if mutation.placement_sibling().is_some() {
                return Err(
                    HostRootManagedChildCommitHandoffErrorForCanary::MetadataPlacementSiblingMismatch {
                        root,
                        fiber: mutation.fiber(),
                        placement_sibling: mutation.placement_sibling(),
                    },
                );
            }
            Ok(())
        }
    }
}

#[cfg(test)]
const fn expected_managed_child_mutation_apply_kind(
    kind: HostComponentManagedChildMutationKindForCanary,
) -> HostRootMutationApplyRecordKind {
    match kind {
        HostComponentManagedChildMutationKindForCanary::Placement => {
            HostRootMutationApplyRecordKind::AppendPlacementToHostParent
        }
        HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
            HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
        }
    }
}

#[cfg(test)]
const fn expected_managed_child_sibling_order_mutation_apply_kind(
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
) -> HostRootMutationApplyRecordKind {
    match complete_work.kind() {
        HostComponentManagedChildMutationKindForCanary::Placement => {
            HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
        }
        HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
            HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
        }
    }
}

#[cfg(test)]
fn managed_child_complete_metadata_matches_mutation(
    complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> bool {
    mutation.kind() == expected_managed_child_mutation_apply_kind(complete_work.kind())
        && mutation.parent() == complete_work.parent_work_in_progress()
        && mutation.parent_tag() == FiberTag::HostComponent
        && mutation.parent_state_node() == complete_work.parent_state_node()
        && mutation.fiber() == complete_work.child()
        && mutation.tag() == complete_work.child_tag()
        && mutation.state_node() == complete_work.child_state_node()
        && mutation.pending_props() == complete_work.child_pending_props()
        && mutation.memoized_props() == complete_work.child_memoized_props()
        && mutation.alternate_fiber() == complete_work.child_alternate()
        && mutation
            .effect_flag()
            .contains_all(complete_work.expected_effect_flag())
}

#[cfg(test)]
fn managed_child_sibling_order_complete_metadata_matches_mutation(
    complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    mutation: HostRootMutationApplyRecord,
) -> bool {
    mutation.kind() == expected_managed_child_sibling_order_mutation_apply_kind(complete_work)
        && mutation.parent() == complete_work.parent_work_in_progress()
        && mutation.parent_tag() == FiberTag::HostComponent
        && mutation.parent_state_node() == complete_work.parent_state_node()
        && mutation.fiber() == complete_work.child()
        && mutation.tag() == complete_work.child_tag()
        && mutation.state_node() == complete_work.child_state_node()
        && mutation.pending_props() == complete_work.child_pending_props()
        && mutation.memoized_props() == complete_work.child_memoized_props()
        && mutation.alternate_fiber() == complete_work.child_alternate()
        && mutation
            .effect_flag()
            .contains_all(complete_work.expected_effect_flag())
        && match complete_work.kind() {
            HostComponentManagedChildMutationKindForCanary::Placement => {
                mutation.placement_sibling().is_some_and(|sibling| {
                    sibling.status() == HostRootPlacementSiblingStatus::InsertBefore
                        && sibling.sibling() == Some(complete_work.order_sibling())
                        && sibling.sibling_tag() == Some(complete_work.order_sibling_tag())
                        && sibling.sibling_state_node() == complete_work.order_sibling_state_node()
                        && sibling.skipped_pending_sibling_count() == 0
                })
            }
            HostComponentManagedChildMutationKindForCanary::DeleteDetach => {
                mutation.placement_sibling().is_none()
            }
        }
}

#[cfg(test)]
pub(crate) fn record_host_root_single_host_update_apply_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
) -> Result<
    HostRootSingleHostUpdateApplyRecordForCanary,
    HostRootSingleHostUpdateApplyRecordErrorForCanary,
> {
    validate_finished_host_root(store, render)?;

    let root = render.root();
    let finished_work = render.finished_work();
    let lanes = render.render_lanes();
    let mutation_log = collect_host_root_mutation_phase_log(store, root, finished_work, lanes)?;
    let deletion_lists = collect_deletion_list_metadata(store, finished_work)?;
    let mutation_apply_log = collect_host_root_mutation_apply_log(
        store,
        root,
        finished_work,
        lanes,
        &mutation_log,
        &deletion_lists,
    )?;

    single_host_update_apply_record_for_canary_from_log(root, finished_work, &mutation_apply_log)
}

#[cfg(test)]
#[allow(
    clippy::result_large_err,
    reason = "private HostText canary diagnostics preserve the full stale commit handoff evidence"
)]
pub(crate) fn host_root_text_update_commit_execution_request_for_canary(
    handoff: &HostRootFinishedWorkCommitHandoffRecordForCanary,
    mutation_index: usize,
    request_order: usize,
) -> Result<
    HostRootTextUpdateCommitExecutionRequestForCanary,
    HostRootTextUpdateCommitExecutionErrorForCanary,
> {
    let commit = handoff.commit();
    let root = commit.root();
    let finished_work = commit.finished_work();
    if handoff.current_after_commit() != finished_work
        || handoff.finished_work_after_commit().is_some()
        || handoff.render_phase_work_after_commit().is_some()
    {
        return Err(
            HostRootTextUpdateCommitExecutionErrorForCanary::StaleCommitHandoff {
                root,
                expected_current: finished_work,
                actual_current: handoff.current_after_commit(),
                finished_work,
                finished_work_after_commit: handoff.finished_work_after_commit(),
                render_phase_work_after_commit: handoff.render_phase_work_after_commit(),
            },
        );
    }

    let mutation = commit
        .mutation_apply_log()
        .records()
        .get(mutation_index)
        .copied()
        .ok_or(
            HostRootTextUpdateCommitExecutionErrorForCanary::MissingMutationApplyRecord {
                root,
                finished_work,
                mutation_index,
            },
        )?;

    if mutation.root() != root || mutation.host_root() != finished_work {
        return Err(
            HostRootTextUpdateCommitExecutionErrorForCanary::ForeignMutationApplyRecord {
                expected_root: root,
                actual_root: mutation.root(),
                expected_finished_work: finished_work,
                actual_host_root: mutation.host_root(),
            },
        );
    }
    if mutation.kind() != HostRootMutationApplyRecordKind::CommitHostTextUpdate {
        return Err(
            HostRootTextUpdateCommitExecutionErrorForCanary::UnexpectedMutationApplyKind {
                root,
                fiber: mutation.fiber(),
                expected: HostRootMutationApplyRecordKind::CommitHostTextUpdate,
                actual: mutation.kind(),
            },
        );
    }
    if mutation.tag() != FiberTag::HostText {
        return Err(
            HostRootTextUpdateCommitExecutionErrorForCanary::ExpectedHostTextMutation {
                root,
                fiber: mutation.fiber(),
                tag: mutation.tag(),
            },
        );
    }
    if mutation.alternate_fiber().is_none() {
        return Err(
            HostRootTextUpdateCommitExecutionErrorForCanary::MissingHostTextCurrent {
                root,
                fiber: mutation.fiber(),
            },
        );
    }
    if mutation.state_node().is_none() {
        return Err(
            HostRootTextUpdateCommitExecutionErrorForCanary::MissingHostTextStateNode {
                root,
                fiber: mutation.fiber(),
            },
        );
    }
    if !mutation.effect_flag().contains_all(FiberFlags::UPDATE) {
        return Err(
            HostRootTextUpdateCommitExecutionErrorForCanary::HostTextUpdateFlagMissing {
                root,
                fiber: mutation.fiber(),
                effect_flag: mutation.effect_flag(),
            },
        );
    }

    Ok(HostRootTextUpdateCommitExecutionRequestForCanary {
        root,
        root_token: handoff.pending().root_token(),
        previous_current: handoff.pending().previous_current(),
        finished_work,
        committed_current: handoff.current_after_commit(),
        source_handoff_order: handoff.pending().handoff_order(),
        commit_order: handoff.commit_order(),
        request_order,
        mutation_index,
        mutation,
        status: HostRootTextUpdateCommitExecutionStatusForCanary::ValidatedForTestHostMutation,
        blockers: HOST_ROOT_TEXT_UPDATE_COMMIT_EXECUTION_BLOCKERS,
    })
}

#[cfg(test)]
#[allow(
    clippy::result_large_err,
    reason = "private canary validator returns detailed finished-work handoff mismatches"
)]
fn validate_host_root_finished_work_pending_commit_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    pending: HostRootFinishedWorkPendingCommitRecordForCanary,
) -> Result<(), HostRootFinishedWorkCommitHandoffErrorForCanary> {
    let expected_root = render.root();
    let expected_root_token = expected_root.state_node_handle();
    if pending.root != expected_root || pending.root_token != expected_root_token {
        return Err(
            HostRootFinishedWorkCommitHandoffErrorForCanary::ForeignFinishedWorkRecord {
                expected_root,
                actual_root: pending.root,
                expected_root_token,
                actual_root_token: pending.root_token,
            },
        );
    }

    let root = store.root(expected_root).map_err(RootCommitError::from)?;
    let actual_current = root.current();
    let actual_pending_work = root.scheduling().work_in_progress();
    let expected_pending_work = Some(render.finished_work());

    if actual_current == pending.finished_work && actual_pending_work.is_none() {
        return Err(
            HostRootFinishedWorkCommitHandoffErrorForCanary::AlreadyCommittedFinishedWorkRecord {
                root: expected_root,
                current: actual_current,
                finished_work: pending.finished_work,
                pending_work_after_commit: actual_pending_work,
                handoff_order: pending.handoff_order,
            },
        );
    }

    if pending.previous_current != render.current()
        || pending.finished_work != render.finished_work()
        || pending.pending_work != expected_pending_work
        || actual_current != pending.previous_current
        || actual_pending_work != expected_pending_work
    {
        return Err(
            HostRootFinishedWorkCommitHandoffErrorForCanary::StaleFinishedWorkRecord {
                root: expected_root,
                expected_current: pending.previous_current,
                actual_current,
                expected_pending_work,
                actual_pending_work,
                finished_work: pending.finished_work,
            },
        );
    }

    let actual_pending_lanes = root.lanes().pending_lanes();
    if pending.render_lanes != render.render_lanes()
        || pending.finished_lanes != render.render_lanes()
        || pending.remaining_lanes != render.remaining_lanes()
        || pending.pending_lanes_before_commit != actual_pending_lanes
    {
        return Err(
            HostRootFinishedWorkCommitHandoffErrorForCanary::FinishedWorkRecordLanesMismatch {
                root: expected_root,
                expected_render_lanes: render.render_lanes(),
                actual_render_lanes: pending.render_lanes,
                expected_remaining_lanes: render.remaining_lanes(),
                actual_remaining_lanes: pending.remaining_lanes,
                expected_pending_lanes: actual_pending_lanes,
                actual_pending_lanes: pending.pending_lanes_before_commit,
            },
        );
    }

    if pending.root_finished_work.is_some() || pending.root_finished_lanes.is_non_empty() {
        let expected_root_finished_work = Some(render.finished_work());
        let expected_root_finished_lanes = render.render_lanes();
        if pending.root_finished_work != expected_root_finished_work
            || pending.root_finished_lanes != expected_root_finished_lanes
            || root.finished_work() != pending.root_finished_work
            || root.finished_lanes() != pending.root_finished_lanes
        {
            return Err(
                HostRootFinishedWorkCommitHandoffErrorForCanary::FinishedWorkRootMetadataMismatch {
                    root: expected_root,
                    expected_finished_work: pending.root_finished_work,
                    actual_finished_work: root.finished_work(),
                    expected_finished_lanes: pending.root_finished_lanes,
                    actual_finished_lanes: root.finished_lanes(),
                },
            );
        }
    }

    Ok(())
}

#[allow(
    dead_code,
    reason = "crate-private HostRoot commit recovery diagnostics are reserved for private sync-flush error workers"
)]
pub(crate) fn host_root_commit_recovery_snapshot_for_canary<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
) -> Result<HostRootCommitRecoverySnapshotForCanary, RootCommitError> {
    let root = store.root(render.root())?;
    let scheduling = root.scheduling();
    let root_update_callbacks = store
        .update_queues()
        .peek_root_update_callback_records(render.work_in_progress_update_queue())?;

    Ok(HostRootCommitRecoverySnapshotForCanary {
        root: render.root(),
        current: root.current(),
        render_lanes: render.render_lanes(),
        pending_lanes: root.lanes().pending_lanes(),
        callback_node: scheduling.callback_node(),
        callback_priority: scheduling.callback_priority(),
        render_phase_work: scheduling.work_in_progress(),
        render_phase_lanes: scheduling.work_in_progress_root_render_lanes(),
        callback_queue: render.work_in_progress_update_queue(),
        root_update_callbacks,
    })
}

impl<H: HostTypes> FiberRootStore<H> {
    pub fn prepare_test_renderer_host_output_stable_sibling_insertion_children_for_canary(
        &mut self,
        render: HostRootRenderPhaseRecord,
        inserted: TestRendererHostOutputCanaryPreparedFibers,
        stable: TestRendererHostOutputCanaryUpdatedFibers,
        clear_stable_sibling_state_node: bool,
    ) -> Result<(), TestRendererHostOutputCanaryError> {
        if inserted.root() != render.root() {
            return Err(TestRendererHostOutputCanaryError::RootMismatch {
                expected: render.root(),
                actual: inserted.root(),
            });
        }
        if stable.root() != render.root() {
            return Err(TestRendererHostOutputCanaryError::RootMismatch {
                expected: render.root(),
                actual: stable.root(),
            });
        }
        if inserted.host_root() != render.work_in_progress() {
            return Err(TestRendererHostOutputCanaryError::ExpectedCurrentHostRoot {
                expected: render.work_in_progress(),
                actual: inserted.host_root(),
            });
        }
        if stable.host_root() != render.work_in_progress() {
            return Err(TestRendererHostOutputCanaryError::ExpectedCurrentHostRoot {
                expected: render.work_in_progress(),
                actual: stable.host_root(),
            });
        }

        self.fiber_arena_mut().set_children(
            render.work_in_progress(),
            &[inserted.component(), stable.component()],
        )?;
        if clear_stable_sibling_state_node {
            self.fiber_arena_mut()
                .get_mut(stable.component())?
                .set_state_node(StateNodeHandle::NONE);
        }

        Ok(())
    }

    pub fn prepare_test_renderer_sibling_text_host_output_update_canary_fibers(
        &mut self,
        render: HostRootRenderPhaseRecord,
        stable: crate::TestRendererHostOutputCanaryCurrentFibers,
        root_text_props_raw: u64,
        component_state_node_raw: u64,
        component_text_state_node_raw: u64,
    ) -> Result<
        (
            crate::TestRendererHostOutputCanaryUpdatedFibers,
            FiberId,
            HostFiberTokenId,
        ),
        TestRendererHostOutputCanaryError,
    > {
        let stable = crate::prepare_test_renderer_host_output_update_canary_fibers(
            self,
            render,
            stable,
            stable.fixture(),
            component_state_node_raw,
            component_text_state_node_raw,
        )?;

        let mode = self.fiber_arena().get(render.work_in_progress())?.mode();
        let root_text = self.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(root_text_props_raw),
            mode,
        );
        {
            let node = self.fiber_arena_mut().get_mut(root_text)?;
            node.set_lanes(Lanes::NO);
            node.merge_flags(FiberFlags::PLACEMENT);
        }

        self.fiber_arena_mut()
            .set_children(render.work_in_progress(), &[root_text, stable.component()])?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(self, root_text)?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(self, stable.text())?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(self, stable.component())?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(
            self,
            render.work_in_progress(),
        )?;

        let root_text_token = self.host_tokens_mut().issue(
            render.root(),
            root_text,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        );
        self.host_tokens().validate(
            root_text_token,
            render.root(),
            root_text,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        )?;

        Ok((stable, root_text, root_text_token))
    }

    pub fn finish_test_renderer_sibling_text_host_output_update_canary_fibers(
        &mut self,
        stable: crate::TestRendererHostOutputCanaryUpdatedFibers,
        root_text: FiberId,
        root_text_state_node_raw: u64,
        root_text_props_raw: u64,
    ) -> Result<(), TestRendererHostOutputCanaryError> {
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            stable.host_root(),
            FiberTag::HostRoot,
        )?;
        expect_test_renderer_host_parent_placement_canary_tag(self, root_text, FiberTag::HostText)?;
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            stable.component(),
            FiberTag::HostComponent,
        )?;
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            stable.text(),
            FiberTag::HostText,
        )?;

        let root_child_ids = self.fiber_arena().child_ids(stable.host_root())?;
        if root_child_ids.as_slice() != [root_text, stable.component()] {
            return Err(FiberTopologyError::MixedParentSiblingChain {
                parent: stable.host_root(),
                child: root_text,
                actual_parent: self.fiber_arena().get(root_text)?.return_fiber(),
            }
            .into());
        }

        complete_test_renderer_nested_host_output_canary_fiber(
            self,
            root_text,
            FiberTag::HostText,
            root_text_props_raw,
            root_text_state_node_raw,
        )?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(self, stable.text())?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(self, stable.component())?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(self, stable.host_root())?;

        Ok(())
    }
}

fn collect_pending_ref_commit_metadata(
    arena: &FiberArena,
    root: FiberRootId,
    finished_work: FiberId,
) -> Result<PendingRefCommitSnapshot, RootCommitError> {
    let mut metadata = PendingRefCommitSnapshot::default();
    collect_ref_detach_metadata(arena, root, finished_work, &mut metadata)?;
    collect_ref_attach_metadata(arena, root, finished_work, &mut metadata)?;
    Ok(metadata)
}

fn collect_ref_detach_metadata(
    arena: &FiberArena,
    root: FiberRootId,
    finished_work: FiberId,
    metadata: &mut PendingRefCommitSnapshot,
) -> Result<(), RootCommitError> {
    let node = arena.get(finished_work)?;

    if let Some(deletions) = node.deletions() {
        let deletion_list = arena
            .deletion_list(deletions)
            .ok_or(FiberTopologyError::InvalidDeletionList { id: deletions })?;
        if deletion_list.parent() != finished_work {
            return Err(FiberTopologyError::InvalidDeletionList { id: deletions }.into());
        }
        for &deleted in deletion_list {
            collect_deleted_ref_detach_metadata(arena, root, deleted, metadata)?;
        }
    }

    if node
        .subtree_flags()
        .contains_any(FiberFlags::MUTATION_MASK | FiberFlags::CLONED)
    {
        for child in arena.child_ids(finished_work)? {
            collect_ref_detach_metadata(arena, root, child, metadata)?;
        }
    }

    if node.tag() == FiberTag::HostComponent
        && node.flags().contains_all(FiberFlags::REF)
        && let Some(current) = node.alternate()
    {
        let current_node = arena.get(current)?;
        if current_node.ref_handle().is_some() {
            let state_node =
                ref_host_state_node(root, current, current_node, HostRootRefCommitAction::Detach)?;
            metadata.push_detach(
                root,
                current,
                state_node,
                current_node.ref_handle(),
                HostRootRefDetachReason::RefChanged,
            );
        }
    }

    Ok(())
}

fn collect_deleted_ref_detach_metadata(
    arena: &FiberArena,
    root: FiberRootId,
    deleted: FiberId,
    metadata: &mut PendingRefCommitSnapshot,
) -> Result<(), RootCommitError> {
    let node = arena.get(deleted)?;
    if node.tag() == FiberTag::HostComponent && node.ref_handle().is_some() {
        let state_node = ref_host_state_node(root, deleted, node, HostRootRefCommitAction::Detach)?;
        metadata.push_detach(
            root,
            deleted,
            state_node,
            node.ref_handle(),
            HostRootRefDetachReason::Deleted,
        );
    }

    for child in arena.child_ids(deleted)? {
        collect_deleted_ref_detach_metadata(arena, root, child, metadata)?;
    }

    Ok(())
}

fn collect_ref_attach_metadata(
    arena: &FiberArena,
    root: FiberRootId,
    finished_work: FiberId,
    metadata: &mut PendingRefCommitSnapshot,
) -> Result<(), RootCommitError> {
    let node = arena.get(finished_work)?;
    if node.subtree_flags().contains_any(FiberFlags::LAYOUT_MASK) {
        for child in arena.child_ids(finished_work)? {
            collect_ref_attach_metadata(arena, root, child, metadata)?;
        }
    }

    if node.tag() == FiberTag::HostComponent
        && node.flags().contains_all(FiberFlags::REF)
        && node.ref_handle().is_some()
    {
        let state_node =
            ref_host_state_node(root, finished_work, node, HostRootRefCommitAction::Attach)?;
        metadata.push_attach(root, finished_work, state_node, node.ref_handle());
    }

    Ok(())
}

fn ref_host_state_node(
    root: FiberRootId,
    fiber: FiberId,
    node: &fast_react_core::FiberNode,
    _action: HostRootRefCommitAction,
) -> Result<StateNodeHandle, RootCommitError> {
    let state_node = node.state_node();
    if state_node.is_none() {
        return Err(RootCommitError::RefHostInstanceMissing { root, fiber });
    }
    Ok(state_node)
}

fn materialize_ref_commit_metadata<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    pending: PendingRefCommitSnapshot,
) -> Result<HostRootRefCommitSnapshot, RootCommitError> {
    let mut metadata = HostRootRefCommitSnapshot::default();
    for pending_detach in pending.detach {
        metadata
            .detach
            .push(issue_ref_commit_record(store, pending_detach)?);
    }
    for pending_attach in pending.attach {
        metadata
            .attach
            .push(issue_ref_commit_record(store, pending_attach)?);
    }
    Ok(metadata)
}

fn issue_ref_commit_record<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    pending: PendingRefCommitRecord,
) -> Result<HostRootRefCommitRecord, RootCommitError> {
    let token_phase = match pending.action {
        HostRootRefCommitAction::Detach => HostFiberTokenPhase::Deletion,
        HostRootRefCommitAction::Attach => HostFiberTokenPhase::Commit,
    };
    let token_target = HostFiberTokenTarget::Instance;
    let token =
        store
            .host_tokens_mut()
            .issue(pending.root, pending.fiber, token_phase, token_target);
    store.host_tokens().validate(
        token,
        pending.root,
        pending.fiber,
        token_phase,
        token_target,
    )?;

    Ok(HostRootRefCommitRecord {
        root: pending.root,
        fiber: pending.fiber,
        state_node: pending.state_node,
        ref_handle: pending.ref_handle,
        token,
        token_phase,
        token_target,
        action: pending.action,
        detach_reason: pending.detach_reason,
    })
}

fn materialize_dom_ref_callback_commit_gate<H: HostTypes>(
    store: &FiberRootStore<H>,
    metadata: &HostRootRefCommitSnapshot,
) -> Result<HostRootDomRefCallbackCommitGateSnapshot, RootCommitError> {
    let mut gate = HostRootDomRefCallbackCommitGateSnapshot::default();
    let mut sequence = 0;

    for record in metadata.detach() {
        gate.records.push(dom_ref_callback_commit_gate_record(
            store,
            sequence,
            record,
            HostRootRefCommitAction::Detach,
        )?);
        sequence += 1;
    }
    for record in metadata.attach() {
        gate.records.push(dom_ref_callback_commit_gate_record(
            store,
            sequence,
            record,
            HostRootRefCommitAction::Attach,
        )?);
        sequence += 1;
    }

    Ok(gate)
}

fn dom_ref_callback_commit_gate_record<H: HostTypes>(
    store: &FiberRootStore<H>,
    sequence: usize,
    record: &HostRootRefCommitRecord,
    expected_action: HostRootRefCommitAction,
) -> Result<HostRootDomRefCallbackCommitGateRecord, RootCommitError> {
    if record.action() != expected_action {
        return Err(RootCommitError::DomRefCallbackGateActionMismatch {
            root: record.root(),
            fiber: record.fiber(),
            expected: ref_commit_action_label(expected_action),
            actual: ref_commit_action_label(record.action()),
        });
    }

    let expected_phase = dom_ref_callback_gate_token_phase(record.action());
    let expected_target = HostFiberTokenTarget::Instance;
    if record.token_phase() != expected_phase || record.token_target() != expected_target {
        return Err(RootCommitError::DomRefCallbackGateTokenScopeMismatch {
            root: record.root(),
            fiber: record.fiber(),
            action: ref_commit_action_label(record.action()),
            expected_phase,
            actual_phase: record.token_phase(),
            expected_target,
            actual_target: record.token_target(),
        });
    }

    let detach_reason_is_valid = match record.action() {
        HostRootRefCommitAction::Detach => record.detach_reason().is_some(),
        HostRootRefCommitAction::Attach => record.detach_reason().is_none(),
    };
    if !detach_reason_is_valid {
        return Err(RootCommitError::DomRefCallbackGateDetachReasonMismatch {
            root: record.root(),
            fiber: record.fiber(),
            action: ref_commit_action_label(record.action()),
            detach_reason: record.detach_reason().map(ref_detach_reason_label),
        });
    }

    store.host_tokens().validate(
        record.token(),
        record.root(),
        record.fiber(),
        expected_phase,
        expected_target,
    )?;

    Ok(HostRootDomRefCallbackCommitGateRecord {
        sequence,
        root: record.root(),
        fiber: record.fiber(),
        state_node: record.state_node(),
        ref_handle: record.ref_handle(),
        token: record.token(),
        token_phase: record.token_phase(),
        token_target: record.token_target(),
        action: record.action(),
        detach_reason: record.detach_reason(),
        status: HostRootDomRefCallbackCommitGateStatus::Blocked,
        blockers: DOM_REF_CALLBACK_GATE_BLOCKERS,
    })
}

fn materialize_ref_callback_execution_handoff<H: HostTypes>(
    store: &FiberRootStore<H>,
    gate: &HostRootDomRefCallbackCommitGateSnapshot,
) -> Result<HostRootRefCallbackExecutionHandoffSnapshot, RootCommitError> {
    let mut handoff = HostRootRefCallbackExecutionHandoffSnapshot::default();
    let mut saw_changed_ref_detach = false;

    for gate_record in gate.records() {
        let mut changed_ref_detach_before_attach = false;
        match gate_record.action() {
            HostRootRefCommitAction::Detach => {
                handoff.detach_count += 1;
                if gate_record.detach_reason() == Some(HostRootRefDetachReason::RefChanged) {
                    saw_changed_ref_detach = true;
                }
            }
            HostRootRefCommitAction::Attach => {
                handoff.attach_count += 1;
                if saw_changed_ref_detach {
                    changed_ref_detach_before_attach = true;
                    handoff.changed_ref_detach_before_attach_count += 1;
                    saw_changed_ref_detach = false;
                }
            }
        }

        handoff.records.push(ref_callback_execution_handoff_record(
            store,
            handoff.records.len(),
            gate_record,
            changed_ref_detach_before_attach,
        )?);
    }

    Ok(handoff)
}

fn ref_callback_execution_handoff_record<H: HostTypes>(
    store: &FiberRootStore<H>,
    sequence: usize,
    gate_record: &HostRootDomRefCallbackCommitGateRecord,
    changed_ref_detach_before_attach: bool,
) -> Result<HostRootRefCallbackExecutionHandoffRecord, RootCommitError> {
    store.host_tokens().validate(
        gate_record.token(),
        gate_record.root(),
        gate_record.fiber(),
        gate_record.token_phase(),
        gate_record.token_target(),
    )?;

    Ok(HostRootRefCallbackExecutionHandoffRecord {
        sequence,
        source_gate_sequence: gate_record.sequence(),
        root: gate_record.root(),
        fiber: gate_record.fiber(),
        state_node: gate_record.state_node(),
        ref_handle: gate_record.ref_handle(),
        token: gate_record.token(),
        token_phase: gate_record.token_phase(),
        token_target: gate_record.token_target(),
        action: gate_record.action(),
        detach_reason: gate_record.detach_reason(),
        execution_phase: ref_callback_execution_phase(gate_record.action()),
        changed_ref_detach_before_attach,
        status: HostRootRefCallbackExecutionHandoffStatus::PrivateExecutionHandoff,
        blockers: REF_CALLBACK_EXECUTION_HANDOFF_BLOCKERS,
    })
}

fn materialize_ref_cleanup_return_execution_gate<H: HostTypes>(
    store: &FiberRootStore<H>,
    handoff: &HostRootRefCallbackExecutionHandoffSnapshot,
) -> Result<HostRootRefCleanupReturnExecutionGateSnapshot, RootCommitError> {
    let mut gate = HostRootRefCleanupReturnExecutionGateSnapshot::default();

    for handoff_record in handoff.records() {
        match handoff_record.action() {
            HostRootRefCommitAction::Detach => {
                gate.cleanup_return_execution_gate_count += 1;
            }
            HostRootRefCommitAction::Attach => {
                gate.cleanup_return_handle_record_gate_count += 1;
                if handoff_record.changed_ref_detach_before_attach() {
                    gate.changed_ref_cleanup_before_attach_count += 1;
                }
            }
        }

        gate.records.push(ref_cleanup_return_execution_gate_record(
            store,
            gate.records.len(),
            handoff_record,
        )?);
    }

    Ok(gate)
}

fn ref_cleanup_return_execution_gate_record<H: HostTypes>(
    store: &FiberRootStore<H>,
    sequence: usize,
    handoff_record: &HostRootRefCallbackExecutionHandoffRecord,
) -> Result<HostRootRefCleanupReturnExecutionGateRecord, RootCommitError> {
    store.host_tokens().validate(
        handoff_record.token(),
        handoff_record.root(),
        handoff_record.fiber(),
        handoff_record.token_phase(),
        handoff_record.token_target(),
    )?;

    Ok(HostRootRefCleanupReturnExecutionGateRecord {
        sequence,
        source_handoff_sequence: handoff_record.sequence(),
        source_gate_sequence: handoff_record.source_gate_sequence(),
        root: handoff_record.root(),
        fiber: handoff_record.fiber(),
        state_node: handoff_record.state_node(),
        ref_handle: handoff_record.ref_handle(),
        token: handoff_record.token(),
        token_phase: handoff_record.token_phase(),
        token_target: handoff_record.token_target(),
        action: handoff_record.action(),
        detach_reason: handoff_record.detach_reason(),
        cleanup_return_phase: ref_cleanup_return_execution_phase(handoff_record.action()),
        cleanup_return_handle_recording_gate: handoff_record.action()
            == HostRootRefCommitAction::Attach,
        cleanup_return_execution_gate: handoff_record.action() == HostRootRefCommitAction::Detach,
        changed_ref_cleanup_before_attach: handoff_record.changed_ref_detach_before_attach(),
        status: HostRootRefCleanupReturnExecutionGateStatus::TestOnlyExecutionGate,
        blockers: REF_CLEANUP_RETURN_EXECUTION_GATE_BLOCKERS,
    })
}

const fn ref_cleanup_return_execution_phase(
    action: HostRootRefCommitAction,
) -> HostRootRefCleanupReturnExecutionPhase {
    match action {
        HostRootRefCommitAction::Detach => {
            HostRootRefCleanupReturnExecutionPhase::ExecuteDetachCleanupReturnHandleOrNull
        }
        HostRootRefCommitAction::Attach => {
            HostRootRefCleanupReturnExecutionPhase::RecordAttachCleanupReturnHandle
        }
    }
}

const fn ref_callback_execution_phase(
    action: HostRootRefCommitAction,
) -> HostRootRefCallbackExecutionPhase {
    match action {
        HostRootRefCommitAction::Detach => {
            HostRootRefCallbackExecutionPhase::CallbackDetachCleanupOrNull
        }
        HostRootRefCommitAction::Attach => HostRootRefCallbackExecutionPhase::CallbackAttach,
    }
}

const fn dom_ref_callback_gate_token_phase(action: HostRootRefCommitAction) -> HostFiberTokenPhase {
    match action {
        HostRootRefCommitAction::Detach => HostFiberTokenPhase::Deletion,
        HostRootRefCommitAction::Attach => HostFiberTokenPhase::Commit,
    }
}

const fn ref_commit_action_label(action: HostRootRefCommitAction) -> &'static str {
    match action {
        HostRootRefCommitAction::Detach => "detach",
        HostRootRefCommitAction::Attach => "attach",
    }
}

const fn ref_detach_reason_label(reason: HostRootRefDetachReason) -> &'static str {
    match reason {
        HostRootRefDetachReason::RefChanged => "ref-changed",
        HostRootRefDetachReason::Deleted => "deleted",
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootMutationPhaseLog {
    root: FiberRootId,
    finished_work: FiberId,
    records: Vec<HostRootMutationPhaseRecord>,
}

#[allow(
    dead_code,
    reason = "reconciler-private mutation metadata is reserved for later commit workers"
)]
impl HostRootMutationPhaseLog {
    #[must_use]
    const fn new(root: FiberRootId, finished_work: FiberId) -> Self {
        Self {
            root,
            finished_work,
            records: Vec::new(),
        }
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[HostRootMutationPhaseRecord] {
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

    fn push(&mut self, record: HostRootMutationPhaseRecord) {
        self.records.push(record);
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootMutationPhaseRecord {
    root: FiberRootId,
    host_root: FiberId,
    parent: FiberId,
    parent_tag: FiberTag,
    parent_state_node: StateNodeHandle,
    parent_flags: FiberFlags,
    fiber: FiberId,
    alternate_fiber: Option<FiberId>,
    tag: FiberTag,
    kind: HostRootMutationPhaseRecordKind,
    placement_sibling: Option<HostRootPlacementSiblingRecord>,
    lanes: Lanes,
    effect_flag: FiberFlags,
    state_node: StateNodeHandle,
    pending_props: PropsHandle,
    memoized_props: PropsHandle,
    alternate_memoized_props: Option<PropsHandle>,
}

#[allow(
    dead_code,
    reason = "reconciler-private mutation metadata is reserved for later commit workers"
)]
impl HostRootMutationPhaseRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn host_root(self) -> FiberId {
        self.host_root
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
    pub(crate) const fn parent_state_node(self) -> StateNodeHandle {
        self.parent_state_node
    }

    #[must_use]
    pub(crate) const fn parent_flags(self) -> FiberFlags {
        self.parent_flags
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn alternate_fiber(self) -> Option<FiberId> {
        self.alternate_fiber
    }

    #[must_use]
    pub(crate) const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub(crate) const fn kind(self) -> HostRootMutationPhaseRecordKind {
        self.kind
    }

    #[must_use]
    pub(crate) const fn placement_sibling(self) -> Option<HostRootPlacementSiblingRecord> {
        self.placement_sibling
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn effect_flag(self) -> FiberFlags {
        self.effect_flag
    }

    #[must_use]
    pub(crate) const fn state_node(self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn pending_props(self) -> PropsHandle {
        self.pending_props
    }

    #[must_use]
    pub(crate) const fn memoized_props(self) -> PropsHandle {
        self.memoized_props
    }

    #[must_use]
    pub(crate) const fn alternate_memoized_props(self) -> Option<PropsHandle> {
        self.alternate_memoized_props
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostRootMutationPhaseRecordKind {
    Placement,
    Update,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootPlacementSiblingRecord {
    status: HostRootPlacementSiblingStatus,
    sibling: Option<FiberId>,
    sibling_tag: Option<FiberTag>,
    sibling_state_node: StateNodeHandle,
    skipped_pending_sibling_count: usize,
}

#[allow(
    dead_code,
    reason = "reconciler-private placement sibling metadata is reserved for later commit workers"
)]
impl HostRootPlacementSiblingRecord {
    #[must_use]
    pub(crate) const fn append() -> Self {
        Self::append_after_skipping_pending_siblings(0)
    }

    #[must_use]
    const fn append_after_skipping_pending_siblings(skipped_pending_sibling_count: usize) -> Self {
        Self {
            status: HostRootPlacementSiblingStatus::Append,
            sibling: None,
            sibling_tag: None,
            sibling_state_node: StateNodeHandle::NONE,
            skipped_pending_sibling_count,
        }
    }

    #[must_use]
    pub(crate) const fn status(self) -> HostRootPlacementSiblingStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn sibling(self) -> Option<FiberId> {
        self.sibling
    }

    #[must_use]
    pub(crate) const fn sibling_tag(self) -> Option<FiberTag> {
        self.sibling_tag
    }

    #[must_use]
    pub(crate) const fn sibling_state_node(self) -> StateNodeHandle {
        self.sibling_state_node
    }

    #[must_use]
    pub(crate) const fn skipped_pending_sibling_count(self) -> usize {
        self.skipped_pending_sibling_count
    }

    #[must_use]
    pub(crate) const fn can_insert_before(self) -> bool {
        matches!(self.status, HostRootPlacementSiblingStatus::InsertBefore)
            && self.sibling.is_some()
            && self.sibling_tag.is_some()
            && !self.sibling_state_node.is_none()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostRootPlacementSiblingStatus {
    Append,
    InsertBefore,
    BlockedUnsupportedTag,
    BlockedMissingStateNode,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootMutationApplyLog {
    root: FiberRootId,
    finished_work: FiberId,
    records: Vec<HostRootMutationApplyRecord>,
}

#[allow(
    dead_code,
    reason = "reconciler-private mutation apply metadata is reserved for later commit workers"
)]
impl HostRootMutationApplyLog {
    #[must_use]
    const fn new(root: FiberRootId, finished_work: FiberId) -> Self {
        Self {
            root,
            finished_work,
            records: Vec::new(),
        }
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[HostRootMutationApplyRecord] {
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

    fn push(&mut self, record: HostRootMutationApplyRecord) {
        self.records.push(record);
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootMutationApplyRecord {
    root: FiberRootId,
    host_root: FiberId,
    source: HostRootMutationApplyRecordSource,
    parent: FiberId,
    parent_tag: FiberTag,
    parent_state_node: StateNodeHandle,
    fiber: FiberId,
    alternate_fiber: Option<FiberId>,
    tag: FiberTag,
    kind: HostRootMutationApplyRecordKind,
    placement_sibling: Option<HostRootPlacementSiblingRecord>,
    lanes: Lanes,
    effect_flag: FiberFlags,
    state_node: StateNodeHandle,
    pending_props: PropsHandle,
    memoized_props: PropsHandle,
    alternate_memoized_props: Option<PropsHandle>,
}

#[allow(
    dead_code,
    reason = "reconciler-private mutation apply metadata is reserved for later commit workers"
)]
impl HostRootMutationApplyRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn host_root(self) -> FiberId {
        self.host_root
    }

    #[must_use]
    pub(crate) const fn source(self) -> HostRootMutationApplyRecordSource {
        self.source
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
    pub(crate) const fn parent_state_node(self) -> StateNodeHandle {
        self.parent_state_node
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn alternate_fiber(self) -> Option<FiberId> {
        self.alternate_fiber
    }

    #[must_use]
    pub(crate) const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub(crate) const fn kind(self) -> HostRootMutationApplyRecordKind {
        self.kind
    }

    #[must_use]
    pub(crate) const fn placement_sibling(self) -> Option<HostRootPlacementSiblingRecord> {
        self.placement_sibling
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub(crate) const fn effect_flag(self) -> FiberFlags {
        self.effect_flag
    }

    #[must_use]
    pub(crate) const fn state_node(self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn pending_props(self) -> PropsHandle {
        self.pending_props
    }

    #[must_use]
    pub(crate) const fn memoized_props(self) -> PropsHandle {
        self.memoized_props
    }

    #[must_use]
    pub(crate) const fn alternate_memoized_props(self) -> Option<PropsHandle> {
        self.alternate_memoized_props
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostRootMutationApplyRecordSource {
    MutationPhase(HostRootMutationPhaseRecordKind),
    DeletionList(DeletionListId),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostRootMutationApplyRecordKind {
    AppendPlacementToContainer,
    AppendPlacementToHostParent,
    InsertPlacementInContainerBefore,
    InsertPlacementInHostParentBefore,
    RecordPlacementInsertionBlocked,
    CommitHostComponentUpdate,
    CommitHostTextUpdate,
    RemoveDeletedFromContainer,
    RemoveDeletedFromHostParent,
    SkipUnsupportedNestedPlacement,
    SkipDeletedNonHostFiber,
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct HostRootRefHostComponentUpdateOrderSnapshotForCanary {
    records: Vec<HostRootRefHostComponentUpdateOrderRecordForCanary>,
    changed_ref_update_count: usize,
}

#[allow(
    dead_code,
    reason = "crate-private HostComponent ref/update ordering diagnostics are reserved for future ref lifecycle workers"
)]
impl HostRootRefHostComponentUpdateOrderSnapshotForCanary {
    #[must_use]
    pub(crate) fn records(&self) -> &[HostRootRefHostComponentUpdateOrderRecordForCanary] {
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
    pub(crate) const fn changed_ref_update_count(&self) -> usize {
        self.changed_ref_update_count
    }

    #[must_use]
    pub(crate) fn records_in_ref_detach_update_attach_order(&self) -> bool {
        self.records.len() == self.changed_ref_update_count * 3
            && self.records.chunks_exact(3).all(|chunk| {
                let detach = chunk[0];
                let update = chunk[1];
                let attach = chunk[2];
                detach.kind() == HostRootRefHostComponentUpdateOrderKindForCanary::RefDetach
                    && update.kind()
                        == HostRootRefHostComponentUpdateOrderKindForCanary::HostComponentUpdate
                    && attach.kind() == HostRootRefHostComponentUpdateOrderKindForCanary::RefAttach
                    && detach.order_group() == update.order_group()
                    && update.order_group() == attach.order_group()
                    && detach.root() == update.root()
                    && update.root() == attach.root()
                    && detach.finished_work() == update.finished_work()
                    && update.finished_work() == attach.finished_work()
                    && detach.current_fiber() == update.current_fiber()
                    && update.current_fiber() == attach.current_fiber()
                    && detach.updated_fiber() == update.updated_fiber()
                    && update.updated_fiber() == attach.updated_fiber()
                    && detach.state_node() == update.state_node()
                    && update.state_node() == attach.state_node()
            })
    }

    #[must_use]
    pub(crate) const fn callback_refs_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn object_refs_mutated(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn host_mutations_executed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_roots_touched(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn react_dom_ref_compatibility_claimed(&self) -> bool {
        false
    }

    fn push_ref_record(
        &mut self,
        root: FiberRootId,
        finished_work: FiberId,
        order_group: usize,
        kind: HostRootRefHostComponentUpdateOrderKindForCanary,
        ref_record: HostRootRefCallbackExecutionHandoffRecord,
        mutation: HostRootMutationApplyRecord,
    ) {
        self.records
            .push(HostRootRefHostComponentUpdateOrderRecordForCanary {
                sequence: self.records.len(),
                order_group,
                kind,
                source_sequence: ref_record.sequence(),
                root,
                finished_work,
                current_fiber: mutation.alternate_fiber(),
                updated_fiber: mutation.fiber(),
                fiber: ref_record.fiber(),
                state_node: ref_record.state_node(),
                ref_handle: ref_record.ref_handle(),
                detach_reason: ref_record.detach_reason(),
                mutation_kind: None,
            });
    }

    fn push_mutation_record(
        &mut self,
        root: FiberRootId,
        finished_work: FiberId,
        order_group: usize,
        source_sequence: usize,
        mutation: HostRootMutationApplyRecord,
    ) {
        self.records
            .push(HostRootRefHostComponentUpdateOrderRecordForCanary {
                sequence: self.records.len(),
                order_group,
                kind: HostRootRefHostComponentUpdateOrderKindForCanary::HostComponentUpdate,
                source_sequence,
                root,
                finished_work,
                current_fiber: mutation.alternate_fiber(),
                updated_fiber: mutation.fiber(),
                fiber: mutation.fiber(),
                state_node: mutation.state_node(),
                ref_handle: RefHandle::NONE,
                detach_reason: None,
                mutation_kind: Some(mutation.kind()),
            });
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootRefHostComponentUpdateOrderRecordForCanary {
    sequence: usize,
    order_group: usize,
    kind: HostRootRefHostComponentUpdateOrderKindForCanary,
    source_sequence: usize,
    root: FiberRootId,
    finished_work: FiberId,
    current_fiber: Option<FiberId>,
    updated_fiber: FiberId,
    fiber: FiberId,
    state_node: StateNodeHandle,
    ref_handle: RefHandle,
    detach_reason: Option<HostRootRefDetachReason>,
    mutation_kind: Option<HostRootMutationApplyRecordKind>,
}

#[allow(
    dead_code,
    reason = "crate-private HostComponent ref/update ordering diagnostics are reserved for future ref lifecycle workers"
)]
impl HostRootRefHostComponentUpdateOrderRecordForCanary {
    #[must_use]
    pub(crate) const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub(crate) const fn order_group(self) -> usize {
        self.order_group
    }

    #[must_use]
    pub(crate) const fn kind(self) -> HostRootRefHostComponentUpdateOrderKindForCanary {
        self.kind
    }

    #[must_use]
    pub(crate) const fn kind_name(self) -> &'static str {
        host_root_ref_host_component_update_order_kind_name(self.kind)
    }

    #[must_use]
    pub(crate) const fn source_sequence(self) -> usize {
        self.source_sequence
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
    pub(crate) const fn current_fiber(self) -> Option<FiberId> {
        self.current_fiber
    }

    #[must_use]
    pub(crate) const fn updated_fiber(self) -> FiberId {
        self.updated_fiber
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) const fn state_node(self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn ref_handle(self) -> RefHandle {
        self.ref_handle
    }

    #[must_use]
    pub(crate) const fn detach_reason(self) -> Option<HostRootRefDetachReason> {
        self.detach_reason
    }

    #[must_use]
    pub(crate) const fn mutation_kind(self) -> Option<HostRootMutationApplyRecordKind> {
        self.mutation_kind
    }

    #[must_use]
    pub(crate) const fn mutation_kind_name(self) -> Option<&'static str> {
        match self.mutation_kind {
            Some(kind) => Some(host_root_mutation_apply_record_kind_name(kind)),
            None => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostRootRefHostComponentUpdateOrderKindForCanary {
    RefDetach,
    HostComponentUpdate,
    RefAttach,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostRootPlacementApplyDiagnosticForCanary {
    root: FiberRootId,
    host_root: FiberId,
    fiber: FiberId,
    tag: FiberTag,
    state_node: StateNodeHandle,
    apply_kind: &'static str,
    sibling_status: &'static str,
    sibling: Option<FiberId>,
    sibling_tag: Option<FiberTag>,
    sibling_state_node: StateNodeHandle,
    skipped_pending_sibling_count: usize,
    can_insert_before: bool,
}

impl HostRootPlacementApplyDiagnosticForCanary {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn host_root(self) -> FiberId {
        self.host_root
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
    pub const fn tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.tag)
    }

    #[must_use]
    pub const fn state_node(self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub const fn state_node_raw(self) -> u64 {
        self.state_node.raw()
    }

    #[must_use]
    pub const fn apply_kind(self) -> &'static str {
        self.apply_kind
    }

    #[must_use]
    pub const fn sibling_status(self) -> &'static str {
        self.sibling_status
    }

    #[must_use]
    pub const fn sibling(self) -> Option<FiberId> {
        self.sibling
    }

    #[must_use]
    pub const fn sibling_tag(self) -> Option<FiberTag> {
        self.sibling_tag
    }

    #[must_use]
    pub const fn sibling_tag_name(self) -> Option<&'static str> {
        match self.sibling_tag {
            Some(tag) => Some(host_root_fiber_tag_name(tag)),
            None => None,
        }
    }

    #[must_use]
    pub const fn sibling_state_node(self) -> StateNodeHandle {
        self.sibling_state_node
    }

    #[must_use]
    pub const fn sibling_state_node_raw(self) -> u64 {
        self.sibling_state_node.raw()
    }

    #[must_use]
    pub const fn skipped_pending_sibling_count(self) -> usize {
        self.skipped_pending_sibling_count
    }

    #[must_use]
    pub const fn can_insert_before(self) -> bool {
        self.can_insert_before
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostParentPlacementApplyDiagnosticForCanary {
    root: FiberRootId,
    host_root: FiberId,
    parent: FiberId,
    parent_tag: FiberTag,
    parent_state_node: StateNodeHandle,
    fiber: FiberId,
    tag: FiberTag,
    state_node: StateNodeHandle,
    apply_kind: &'static str,
    sibling_status: &'static str,
    sibling: Option<FiberId>,
    sibling_tag: Option<FiberTag>,
    sibling_state_node: StateNodeHandle,
    skipped_pending_sibling_count: usize,
    can_insert_before: bool,
    applies_to_host_parent: bool,
}

impl HostParentPlacementApplyDiagnosticForCanary {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn host_root(self) -> FiberId {
        self.host_root
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
    pub const fn parent_tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.parent_tag)
    }

    #[must_use]
    pub const fn parent_state_node(self) -> StateNodeHandle {
        self.parent_state_node
    }

    #[must_use]
    pub const fn parent_state_node_raw(self) -> u64 {
        self.parent_state_node.raw()
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
    pub const fn tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.tag)
    }

    #[must_use]
    pub const fn state_node(self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub const fn state_node_raw(self) -> u64 {
        self.state_node.raw()
    }

    #[must_use]
    pub const fn apply_kind(self) -> &'static str {
        self.apply_kind
    }

    #[must_use]
    pub const fn sibling_status(self) -> &'static str {
        self.sibling_status
    }

    #[must_use]
    pub const fn sibling(self) -> Option<FiberId> {
        self.sibling
    }

    #[must_use]
    pub const fn sibling_tag(self) -> Option<FiberTag> {
        self.sibling_tag
    }

    #[must_use]
    pub const fn sibling_tag_name(self) -> Option<&'static str> {
        match self.sibling_tag {
            Some(tag) => Some(host_root_fiber_tag_name(tag)),
            None => None,
        }
    }

    #[must_use]
    pub const fn sibling_state_node(self) -> StateNodeHandle {
        self.sibling_state_node
    }

    #[must_use]
    pub const fn sibling_state_node_raw(self) -> u64 {
        self.sibling_state_node.raw()
    }

    #[must_use]
    pub const fn skipped_pending_sibling_count(self) -> usize {
        self.skipped_pending_sibling_count
    }

    #[must_use]
    pub const fn can_insert_before(self) -> bool {
        self.can_insert_before
    }

    #[must_use]
    pub const fn applies_to_host_parent(self) -> bool {
        self.applies_to_host_parent
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostComponentUpdateApplyDiagnosticForCanary {
    sequence: usize,
    root: FiberRootId,
    host_root: FiberId,
    parent: FiberId,
    parent_tag: FiberTag,
    parent_state_node: StateNodeHandle,
    fiber: FiberId,
    alternate_fiber: Option<FiberId>,
    tag: FiberTag,
    state_node: StateNodeHandle,
    pending_props: PropsHandle,
    memoized_props: PropsHandle,
    alternate_memoized_props: Option<PropsHandle>,
    apply_kind: &'static str,
}

impl HostComponentUpdateApplyDiagnosticForCanary {
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
    pub const fn parent(self) -> FiberId {
        self.parent
    }

    #[must_use]
    pub const fn parent_tag(self) -> FiberTag {
        self.parent_tag
    }

    #[must_use]
    pub const fn parent_tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.parent_tag)
    }

    #[must_use]
    pub const fn parent_state_node(self) -> StateNodeHandle {
        self.parent_state_node
    }

    #[must_use]
    pub const fn parent_state_node_raw(self) -> u64 {
        self.parent_state_node.raw()
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn alternate_fiber(self) -> Option<FiberId> {
        self.alternate_fiber
    }

    #[must_use]
    pub const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub const fn tag_name(self) -> &'static str {
        host_root_fiber_tag_name(self.tag)
    }

    #[must_use]
    pub const fn state_node(self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub const fn state_node_raw(self) -> u64 {
        self.state_node.raw()
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
    pub const fn alternate_memoized_props(self) -> Option<PropsHandle> {
        self.alternate_memoized_props
    }

    #[must_use]
    pub const fn apply_kind(self) -> &'static str {
        self.apply_kind
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootSingleHostUpdateApplyRecordForCanary {
    root: FiberRootId,
    finished_work: FiberId,
    mutation_record_count: usize,
    host_update_record_count: usize,
    mutation: HostRootMutationApplyRecord,
}

#[cfg(test)]
impl HostRootSingleHostUpdateApplyRecordForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn mutation_record_count(self) -> usize {
        self.mutation_record_count
    }

    #[must_use]
    pub(crate) const fn host_update_record_count(self) -> usize {
        self.host_update_record_count
    }

    #[must_use]
    pub(crate) const fn mutation(self) -> HostRootMutationApplyRecord {
        self.mutation
    }

    #[must_use]
    pub(crate) const fn fiber(self) -> FiberId {
        self.mutation.fiber()
    }

    #[must_use]
    pub(crate) const fn alternate_fiber(self) -> Option<FiberId> {
        self.mutation.alternate_fiber()
    }

    #[must_use]
    pub(crate) const fn state_node(self) -> StateNodeHandle {
        self.mutation.state_node()
    }

    #[must_use]
    pub(crate) const fn kind(self) -> HostRootMutationApplyRecordKind {
        self.mutation.kind()
    }

    #[must_use]
    pub(crate) const fn kind_name(self) -> &'static str {
        host_root_mutation_apply_record_kind_name(self.mutation.kind())
    }

    #[must_use]
    pub(crate) const fn is_host_component_props_update(self) -> bool {
        matches!(
            self.mutation.kind(),
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        )
    }

    #[must_use]
    pub(crate) const fn is_host_text_content_update(self) -> bool {
        matches!(
            self.mutation.kind(),
            HostRootMutationApplyRecordKind::CommitHostTextUpdate
        )
    }

    #[must_use]
    pub(crate) const fn test_host_commit_path_only(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn private_host_store_commit_evidence_supported(self) -> bool {
        matches!(
            self.mutation.kind(),
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        )
    }

    #[must_use]
    pub(crate) const fn latest_props_publication_after_payload_required(self) -> bool {
        self.private_host_store_commit_evidence_supported()
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_renderer_package_behavior_exposed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn react_dom_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(self) -> bool {
        false
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootSingleHostUpdateApplyRecordErrorForCanary {
    Commit(RootCommitError),
    ExpectedSingleHostUpdateRecord {
        root: FiberRootId,
        finished_work: FiberId,
        mutation_record_count: usize,
        host_update_record_count: usize,
    },
}

#[cfg(test)]
impl Display for HostRootSingleHostUpdateApplyRecordErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::Commit(error) => Display::fmt(error, formatter),
            Self::ExpectedSingleHostUpdateRecord {
                root,
                finished_work,
                mutation_record_count,
                host_update_record_count,
            } => write!(
                formatter,
                "root {} finished work fiber slot {} expected exactly one private HostComponent/HostText update apply record and no other mutation records, found {} mutation records and {} host update records",
                root.raw(),
                finished_work.slot().get(),
                mutation_record_count,
                host_update_record_count
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootSingleHostUpdateApplyRecordErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Commit(error) => Some(error),
            Self::ExpectedSingleHostUpdateRecord { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<RootCommitError> for HostRootSingleHostUpdateApplyRecordErrorForCanary {
    fn from(error: RootCommitError) -> Self {
        Self::Commit(error)
    }
}

#[cfg(test)]
fn single_host_update_apply_record_for_canary_from_log(
    root: FiberRootId,
    finished_work: FiberId,
    mutation_apply_log: &HostRootMutationApplyLog,
) -> Result<
    HostRootSingleHostUpdateApplyRecordForCanary,
    HostRootSingleHostUpdateApplyRecordErrorForCanary,
> {
    let mutation_record_count = mutation_apply_log.len();
    let update_records = mutation_apply_log
        .records()
        .iter()
        .copied()
        .filter(|record| is_host_update_apply_record_kind_for_canary(record.kind()))
        .collect::<Vec<_>>();
    let host_update_record_count = update_records.len();

    if mutation_record_count != 1 || host_update_record_count != 1 {
        return Err(
            HostRootSingleHostUpdateApplyRecordErrorForCanary::ExpectedSingleHostUpdateRecord {
                root,
                finished_work,
                mutation_record_count,
                host_update_record_count,
            },
        );
    }

    Ok(HostRootSingleHostUpdateApplyRecordForCanary {
        root,
        finished_work,
        mutation_record_count,
        host_update_record_count,
        mutation: update_records[0],
    })
}

fn collect_ref_host_component_update_order_for_canary(
    root: FiberRootId,
    finished_work: FiberId,
    mutation_apply_log: &HostRootMutationApplyLog,
    handoff: &HostRootRefCallbackExecutionHandoffSnapshot,
) -> HostRootRefHostComponentUpdateOrderSnapshotForCanary {
    let mut snapshot = HostRootRefHostComponentUpdateOrderSnapshotForCanary::default();

    for (mutation_sequence, mutation) in mutation_apply_log
        .records()
        .iter()
        .copied()
        .enumerate()
        .filter(|(_, record)| {
            record.kind() == HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        })
    {
        let Some(current_fiber) = mutation.alternate_fiber() else {
            continue;
        };
        let Some(detach) = handoff.records().iter().copied().find(|record| {
            record.action() == HostRootRefCommitAction::Detach
                && record.detach_reason() == Some(HostRootRefDetachReason::RefChanged)
                && record.root() == root
                && record.fiber() == current_fiber
                && record.state_node() == mutation.state_node()
        }) else {
            continue;
        };
        let Some(attach) = handoff.records().iter().copied().find(|record| {
            record.action() == HostRootRefCommitAction::Attach
                && record.root() == root
                && record.fiber() == mutation.fiber()
                && record.state_node() == mutation.state_node()
                && record.sequence() > detach.sequence()
        }) else {
            continue;
        };

        let order_group = snapshot.changed_ref_update_count();
        snapshot.changed_ref_update_count += 1;
        snapshot.push_ref_record(
            root,
            finished_work,
            order_group,
            HostRootRefHostComponentUpdateOrderKindForCanary::RefDetach,
            detach,
            mutation,
        );
        snapshot.push_mutation_record(
            root,
            finished_work,
            order_group,
            mutation_sequence,
            mutation,
        );
        snapshot.push_ref_record(
            root,
            finished_work,
            order_group,
            HostRootRefHostComponentUpdateOrderKindForCanary::RefAttach,
            attach,
            mutation,
        );
    }

    snapshot
}

#[cfg(test)]
const fn is_host_update_apply_record_kind_for_canary(
    kind: HostRootMutationApplyRecordKind,
) -> bool {
    matches!(
        kind,
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate
            | HostRootMutationApplyRecordKind::CommitHostTextUpdate
    )
}

const fn is_host_parent_placement_apply_kind_for_canary(
    kind: HostRootMutationApplyRecordKind,
) -> bool {
    matches!(
        kind,
        HostRootMutationApplyRecordKind::AppendPlacementToHostParent
            | HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
    )
}

const fn host_root_mutation_apply_record_kind_name(
    kind: HostRootMutationApplyRecordKind,
) -> &'static str {
    match kind {
        HostRootMutationApplyRecordKind::AppendPlacementToContainer => {
            "append-placement-to-container"
        }
        HostRootMutationApplyRecordKind::AppendPlacementToHostParent => {
            "append-placement-to-host-parent"
        }
        HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore => {
            "insert-placement-in-container-before"
        }
        HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore => {
            "insert-placement-in-host-parent-before"
        }
        HostRootMutationApplyRecordKind::RecordPlacementInsertionBlocked => {
            "record-placement-insertion-blocked"
        }
        HostRootMutationApplyRecordKind::CommitHostComponentUpdate => {
            "commit-host-component-update"
        }
        HostRootMutationApplyRecordKind::CommitHostTextUpdate => "commit-host-text-update",
        HostRootMutationApplyRecordKind::RemoveDeletedFromContainer => {
            "remove-deleted-from-container"
        }
        HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent => {
            "remove-deleted-from-host-parent"
        }
        HostRootMutationApplyRecordKind::SkipUnsupportedNestedPlacement => {
            "skip-unsupported-nested-placement"
        }
        HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber => "skip-deleted-non-host-fiber",
    }
}

const fn host_root_ref_host_component_update_order_kind_name(
    kind: HostRootRefHostComponentUpdateOrderKindForCanary,
) -> &'static str {
    match kind {
        HostRootRefHostComponentUpdateOrderKindForCanary::RefDetach => "ref-detach",
        HostRootRefHostComponentUpdateOrderKindForCanary::HostComponentUpdate => {
            "host-component-update"
        }
        HostRootRefHostComponentUpdateOrderKindForCanary::RefAttach => "ref-attach",
    }
}

const fn host_root_placement_sibling_status_name(
    status: HostRootPlacementSiblingStatus,
) -> &'static str {
    match status {
        HostRootPlacementSiblingStatus::Append => "append",
        HostRootPlacementSiblingStatus::InsertBefore => "insert-before",
        HostRootPlacementSiblingStatus::BlockedUnsupportedTag => "blocked-unsupported-tag",
        HostRootPlacementSiblingStatus::BlockedMissingStateNode => "blocked-missing-state-node",
    }
}

const fn host_root_fiber_tag_name(tag: FiberTag) -> &'static str {
    match tag {
        FiberTag::HostRoot => "HostRoot",
        FiberTag::HostComponent => "HostComponent",
        FiberTag::HostText => "HostText",
        FiberTag::FunctionComponent => "FunctionComponent",
        FiberTag::ContextProvider => "ContextProvider",
        FiberTag::Fragment => "Fragment",
        FiberTag::Suspense => "Suspense",
        FiberTag::Offscreen => "Offscreen",
        FiberTag::Activity => "Activity",
        FiberTag::ViewTransition => "ViewTransition",
        FiberTag::ClassComponent => "ClassComponent",
        FiberTag::Portal => "Portal",
        _ => "Other",
    }
}

const fn host_root_commit_order_phase_name(
    phase: HostRootCommitOrderPhaseForCanary,
) -> &'static str {
    match phase {
        HostRootCommitOrderPhaseForCanary::Mutation => "mutation",
        HostRootCommitOrderPhaseForCanary::Layout => "layout",
        HostRootCommitOrderPhaseForCanary::Passive => "passive",
    }
}

const fn host_root_commit_order_metadata_kind_name(
    kind: HostRootCommitOrderMetadataKindForCanary,
) -> &'static str {
    match kind {
        HostRootCommitOrderMetadataKindForCanary::DeletionCleanup => "deletion-cleanup",
        HostRootCommitOrderMetadataKindForCanary::RefDetach => "ref-detach",
        HostRootCommitOrderMetadataKindForCanary::RefAttach => "ref-attach",
        HostRootCommitOrderMetadataKindForCanary::LayoutEffectDestroy => "layout-effect-destroy",
        HostRootCommitOrderMetadataKindForCanary::LayoutEffectCreate => "layout-effect-create",
        HostRootCommitOrderMetadataKindForCanary::LayoutEffectCallback => "layout-effect-callback",
        HostRootCommitOrderMetadataKindForCanary::RootUpdateCallback => "root-update-callback",
        HostRootCommitOrderMetadataKindForCanary::PassiveUnmount => "passive-unmount",
        HostRootCommitOrderMetadataKindForCanary::PassiveMount => "passive-mount",
    }
}

const fn function_component_effect_list_commit_phase_name(
    phase: FunctionComponentEffectListCommitPhase,
) -> &'static str {
    match phase {
        FunctionComponentEffectListCommitPhase::BeforeMutation => "before-mutation",
        FunctionComponentEffectListCommitPhase::Mutation => "mutation",
        FunctionComponentEffectListCommitPhase::Layout => "layout",
        FunctionComponentEffectListCommitPhase::PassiveScheduling => "passive-scheduling",
    }
}

const fn function_component_effect_list_commit_phase_order(
    phase: FunctionComponentEffectListCommitPhase,
) -> u8 {
    match phase {
        FunctionComponentEffectListCommitPhase::BeforeMutation => 0,
        FunctionComponentEffectListCommitPhase::Mutation => 1,
        FunctionComponentEffectListCommitPhase::Layout => 2,
        FunctionComponentEffectListCommitPhase::PassiveScheduling => 3,
    }
}

const fn function_component_effect_list_commit_phase_order_kind_name(
    kind: FunctionComponentEffectListCommitPhaseOrderKind,
) -> &'static str {
    match kind {
        FunctionComponentEffectListCommitPhaseOrderKind::EffectListBeforeMutation => {
            "effect-list-before-mutation"
        }
        FunctionComponentEffectListCommitPhaseOrderKind::LayoutDestroy => "layout-destroy",
        FunctionComponentEffectListCommitPhaseOrderKind::LayoutCreate => "layout-create",
        FunctionComponentEffectListCommitPhaseOrderKind::PassiveUnmountScheduled => {
            "passive-unmount-scheduled"
        }
        FunctionComponentEffectListCommitPhaseOrderKind::PassiveMountScheduled => {
            "passive-mount-scheduled"
        }
    }
}

const fn host_root_commit_order_ref_kind(
    action: HostRootRefCommitAction,
) -> HostRootCommitOrderMetadataKindForCanary {
    match action {
        HostRootRefCommitAction::Detach => HostRootCommitOrderMetadataKindForCanary::RefDetach,
        HostRootRefCommitAction::Attach => HostRootCommitOrderMetadataKindForCanary::RefAttach,
    }
}

const fn host_root_commit_order_passive_kind(
    phase: PendingPassiveEffectPhase,
) -> HostRootCommitOrderMetadataKindForCanary {
    match phase {
        PendingPassiveEffectPhase::Unmount => {
            HostRootCommitOrderMetadataKindForCanary::PassiveUnmount
        }
        PendingPassiveEffectPhase::Mount => HostRootCommitOrderMetadataKindForCanary::PassiveMount,
    }
}

const fn host_root_commit_order_passive_source_order(order: PendingPassiveEffectOrder) -> u64 {
    ((order.flush_rank() as u64) << 32) | order.sequence()
}

fn collect_host_root_mutation_phase_log<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
) -> Result<HostRootMutationPhaseLog, RootCommitError> {
    let arena = store.fiber_arena();
    let mut log = HostRootMutationPhaseLog::new(root, finished_work);
    let finished_root = arena.get(finished_work)?;
    if !finished_root.subtree_flags().has_mutation_effects() {
        return Ok(log);
    }

    let mut next_child = finished_root.child();

    while let Some(child) = next_child {
        let node = arena.get(child)?;
        next_child = node.sibling();

        let flags = node.flags();
        if is_supported_host_root_mutation_child(node.tag())
            && flags.contains_all(FiberFlags::PLACEMENT)
        {
            log.push(host_root_mutation_phase_record(
                arena,
                root,
                finished_work,
                finished_work,
                child,
                HostRootMutationPhaseRecordKind::Placement,
                lanes,
            )?);
        }
        collect_function_component_single_host_child_placement_phase_record(
            arena,
            &mut log,
            root,
            finished_work,
            child,
            lanes,
        )?;
        collect_host_component_child_placement_phase_records(
            arena,
            &mut log,
            root,
            finished_work,
            child,
            1,
            lanes,
        )?;
        collect_host_component_update_traversal_phase_records(
            arena,
            &mut log,
            HostComponentUpdateTraversalRequest {
                root,
                host_root: finished_work,
                parent: finished_work,
                fiber: child,
                fiber_depth: 1,
                host_component_depth: 0,
                lanes,
            },
        )?;
    }

    Ok(log)
}

fn collect_function_component_single_host_child_placement_phase_record(
    arena: &fast_react_core::FiberArena,
    log: &mut HostRootMutationPhaseLog,
    root: FiberRootId,
    host_root: FiberId,
    function_component: FiberId,
    lanes: Lanes,
) -> Result<(), RootCommitError> {
    let function_node = arena.get(function_component)?;
    if function_node.tag() != FiberTag::FunctionComponent
        || !function_node
            .subtree_flags()
            .contains_all(FiberFlags::PLACEMENT)
    {
        return Ok(());
    }

    let Some(child) = function_node.child() else {
        return Ok(());
    };
    let child_node = arena.get(child)?;
    if child_node.sibling().is_some()
        || !is_supported_host_root_mutation_child(child_node.tag())
        || !child_node.flags().contains_all(FiberFlags::PLACEMENT)
    {
        return Ok(());
    }

    log.push(host_root_mutation_phase_record(
        arena,
        root,
        host_root,
        host_root,
        child,
        HostRootMutationPhaseRecordKind::Placement,
        lanes,
    )?);

    Ok(())
}

fn collect_host_component_child_placement_phase_records(
    arena: &fast_react_core::FiberArena,
    log: &mut HostRootMutationPhaseLog,
    root: FiberRootId,
    host_root: FiberId,
    parent: FiberId,
    host_component_depth: usize,
    lanes: Lanes,
) -> Result<(), RootCommitError> {
    let parent_node = arena.get(parent)?;
    if parent_node.tag() != FiberTag::HostComponent {
        return Ok(());
    }

    let parent_is_stable = !parent_node.flags().contains_all(FiberFlags::PLACEMENT);
    let mut next_child = parent_node.child();
    while let Some(child) = next_child {
        let node = arena.get(child)?;
        next_child = node.sibling();

        if node.flags().contains_all(FiberFlags::PLACEMENT)
            && is_supported_host_root_mutation_child(node.tag())
        {
            log.push(host_root_mutation_phase_record(
                arena,
                root,
                host_root,
                parent,
                child,
                HostRootMutationPhaseRecordKind::Placement,
                lanes,
            )?);
        }

        if parent_is_stable
            && host_component_depth < HOST_PARENT_PLACEMENT_CANARY_MAX_HOST_COMPONENT_DEPTH
            && node.tag() == FiberTag::HostComponent
            && !node.flags().contains_all(FiberFlags::PLACEMENT)
        {
            collect_host_component_child_placement_phase_records(
                arena,
                log,
                root,
                host_root,
                child,
                host_component_depth + 1,
                lanes,
            )?;
        }
    }

    Ok(())
}

fn collect_host_component_update_traversal_phase_records(
    arena: &fast_react_core::FiberArena,
    log: &mut HostRootMutationPhaseLog,
    request: HostComponentUpdateTraversalRequest,
) -> Result<(), RootCommitError> {
    let node = arena.get(request.fiber)?;
    let tag = node.tag();
    let flags = node.flags();
    let next_host_component_depth =
        request.host_component_depth + usize::from(tag == FiberTag::HostComponent);

    if should_descend_host_component_update_traversal_for_canary(
        tag,
        flags,
        request.fiber_depth,
        next_host_component_depth,
        node.subtree_flags(),
    ) {
        let mut next_child = node.child();
        while let Some(child) = next_child {
            let child_node = arena.get(child)?;
            next_child = child_node.sibling();

            collect_host_component_update_traversal_phase_records(
                arena,
                log,
                HostComponentUpdateTraversalRequest {
                    parent: request.fiber,
                    fiber: child,
                    fiber_depth: request.fiber_depth + 1,
                    host_component_depth: next_host_component_depth,
                    ..request
                },
            )?;
        }
    }

    if is_supported_host_root_mutation_child(tag) && flags.contains_all(FiberFlags::UPDATE) {
        log.push(host_root_mutation_phase_record(
            arena,
            request.root,
            request.host_root,
            request.parent,
            request.fiber,
            HostRootMutationPhaseRecordKind::Update,
            request.lanes,
        )?);
    }

    Ok(())
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostComponentUpdateTraversalRequest {
    root: FiberRootId,
    host_root: FiberId,
    parent: FiberId,
    fiber: FiberId,
    fiber_depth: usize,
    host_component_depth: usize,
    lanes: Lanes,
}

const HOST_PARENT_PLACEMENT_CANARY_MAX_HOST_COMPONENT_DEPTH: usize = 2;
const HOST_COMPONENT_UPDATE_CANARY_MAX_FIBER_DEPTH: usize = 6;
const HOST_COMPONENT_UPDATE_CANARY_MAX_HOST_COMPONENT_DEPTH: usize = 4;

const fn should_descend_host_component_update_traversal_for_canary(
    tag: FiberTag,
    flags: FiberFlags,
    fiber_depth: usize,
    host_component_depth: usize,
    subtree_flags: FiberFlags,
) -> bool {
    if fiber_depth >= HOST_COMPONENT_UPDATE_CANARY_MAX_FIBER_DEPTH
        || host_component_depth >= HOST_COMPONENT_UPDATE_CANARY_MAX_HOST_COMPONENT_DEPTH
        || !subtree_flags.contains_any(FiberFlags::MUTATION_MASK.merge(FiberFlags::CLONED))
        || flags.contains_all(FiberFlags::PLACEMENT)
    {
        return false;
    }

    matches!(
        tag,
        FiberTag::HostComponent | FiberTag::FunctionComponent | FiberTag::Fragment
    )
}

fn host_root_mutation_phase_record(
    arena: &fast_react_core::FiberArena,
    root: FiberRootId,
    host_root: FiberId,
    parent: FiberId,
    fiber: FiberId,
    kind: HostRootMutationPhaseRecordKind,
    lanes: Lanes,
) -> Result<HostRootMutationPhaseRecord, RootCommitError> {
    let node = arena.get(fiber)?;
    let parent_node = arena.get(parent)?;
    let alternate_memoized_props = match node.alternate() {
        Some(alternate) => Some(arena.get(alternate)?.memoized_props()),
        None => None,
    };
    let parent_state_node = if parent_node.tag() == FiberTag::HostRoot {
        StateNodeHandle::NONE
    } else {
        parent_node.state_node()
    };
    let placement_sibling = match kind {
        HostRootMutationPhaseRecordKind::Placement
            if matches!(
                parent_node.tag(),
                FiberTag::HostRoot | FiberTag::HostComponent
            ) =>
        {
            Some(host_parent_placement_sibling_record(
                arena,
                parent,
                node.sibling(),
            )?)
        }
        HostRootMutationPhaseRecordKind::Placement => {
            Some(HostRootPlacementSiblingRecord::append())
        }
        HostRootMutationPhaseRecordKind::Update => None,
    };

    Ok(HostRootMutationPhaseRecord {
        root,
        host_root,
        parent,
        parent_tag: parent_node.tag(),
        parent_state_node,
        parent_flags: parent_node.flags(),
        fiber,
        alternate_fiber: node.alternate(),
        tag: node.tag(),
        kind,
        placement_sibling,
        lanes,
        effect_flag: host_root_mutation_phase_record_flag(kind),
        state_node: node.state_node(),
        pending_props: node.pending_props(),
        memoized_props: node.memoized_props(),
        alternate_memoized_props,
    })
}

fn host_parent_placement_sibling_record(
    arena: &fast_react_core::FiberArena,
    host_parent: FiberId,
    sibling: Option<FiberId>,
) -> Result<HostRootPlacementSiblingRecord, RootCommitError> {
    let mut candidate = sibling;
    let mut skipped_pending_sibling_count = 0;

    while let Some(sibling) = candidate {
        let sibling_node = arena.get(sibling)?;
        if sibling_node.return_fiber() != Some(host_parent) {
            return Err(FiberTopologyError::MixedParentSiblingChain {
                parent: host_parent,
                child: sibling,
                actual_parent: sibling_node.return_fiber(),
            }
            .into());
        }

        let sibling_tag = sibling_node.tag();
        let sibling_state_node = sibling_node.state_node();
        if is_supported_host_root_mutation_child(sibling_tag)
            && sibling_node.flags().contains_all(FiberFlags::PLACEMENT)
        {
            skipped_pending_sibling_count += 1;
            candidate = sibling_node.sibling();
            continue;
        }

        let status = if !is_supported_host_root_mutation_child(sibling_tag) {
            HostRootPlacementSiblingStatus::BlockedUnsupportedTag
        } else if sibling_state_node.is_none() {
            HostRootPlacementSiblingStatus::BlockedMissingStateNode
        } else {
            HostRootPlacementSiblingStatus::InsertBefore
        };

        return Ok(HostRootPlacementSiblingRecord {
            status,
            sibling: Some(sibling),
            sibling_tag: Some(sibling_tag),
            sibling_state_node,
            skipped_pending_sibling_count,
        });
    }

    Ok(
        HostRootPlacementSiblingRecord::append_after_skipping_pending_siblings(
            skipped_pending_sibling_count,
        ),
    )
}

const fn is_supported_host_root_mutation_child(tag: FiberTag) -> bool {
    matches!(tag, FiberTag::HostComponent | FiberTag::HostText)
}

const fn host_root_mutation_phase_record_flag(kind: HostRootMutationPhaseRecordKind) -> FiberFlags {
    match kind {
        HostRootMutationPhaseRecordKind::Placement => FiberFlags::PLACEMENT,
        HostRootMutationPhaseRecordKind::Update => FiberFlags::UPDATE,
    }
}

fn collect_host_root_mutation_apply_log<H: HostTypes>(
    store: &FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
    mutation_log: &HostRootMutationPhaseLog,
    deletion_lists: &[HostRootDeletionListRecord],
) -> Result<HostRootMutationApplyLog, RootCommitError> {
    let arena = store.fiber_arena();
    let mut log = HostRootMutationApplyLog::new(root, finished_work);

    for deletion_list in deletion_lists {
        let deletion_parent = arena.get(deletion_list.parent())?;
        let host_parent = find_nearest_host_parent_for_deletion(arena, deletion_list.parent())?;
        for &deleted in deletion_list.deleted() {
            let (parent, parent_tag, parent_state_node) = host_parent
                .map(|record| (record.fiber, record.tag, record.state_node))
                .unwrap_or((
                    deletion_list.parent(),
                    deletion_parent.tag(),
                    deletion_parent.state_node(),
                ));
            log.push(host_root_deletion_apply_record(
                arena,
                HostRootDeletionApplyRecordRequest {
                    root,
                    host_root: finished_work,
                    lanes,
                    list: deletion_list.list(),
                    parent,
                    parent_tag,
                    parent_state_node,
                    deleted,
                },
            )?);
        }
    }

    for record in mutation_log.records() {
        log.push(host_root_mutation_phase_apply_record(*record)?);
    }

    Ok(log)
}

fn find_nearest_host_parent_for_deletion(
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

fn host_root_mutation_phase_apply_record(
    record: HostRootMutationPhaseRecord,
) -> Result<HostRootMutationApplyRecord, RootCommitError> {
    let kind = match (record.kind(), record.tag()) {
        (HostRootMutationPhaseRecordKind::Placement, _)
            if record.parent_tag() == FiberTag::HostRoot =>
        {
            match record
                .placement_sibling()
                .unwrap_or(HostRootPlacementSiblingRecord::append())
                .status()
            {
                HostRootPlacementSiblingStatus::Append => {
                    HostRootMutationApplyRecordKind::AppendPlacementToContainer
                }
                HostRootPlacementSiblingStatus::InsertBefore => {
                    HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
                }
                HostRootPlacementSiblingStatus::BlockedUnsupportedTag
                | HostRootPlacementSiblingStatus::BlockedMissingStateNode => {
                    HostRootMutationApplyRecordKind::RecordPlacementInsertionBlocked
                }
            }
        }
        (HostRootMutationPhaseRecordKind::Placement, _)
            if record.parent_tag() == FiberTag::HostComponent
                && !record.parent_flags().contains_all(FiberFlags::PLACEMENT) =>
        {
            match record
                .placement_sibling()
                .unwrap_or(HostRootPlacementSiblingRecord::append())
                .status()
            {
                HostRootPlacementSiblingStatus::Append => {
                    HostRootMutationApplyRecordKind::AppendPlacementToHostParent
                }
                HostRootPlacementSiblingStatus::InsertBefore => {
                    HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
                }
                HostRootPlacementSiblingStatus::BlockedUnsupportedTag
                | HostRootPlacementSiblingStatus::BlockedMissingStateNode => {
                    HostRootMutationApplyRecordKind::RecordPlacementInsertionBlocked
                }
            }
        }
        (HostRootMutationPhaseRecordKind::Placement, _) => {
            HostRootMutationApplyRecordKind::SkipUnsupportedNestedPlacement
        }
        (HostRootMutationPhaseRecordKind::Update, FiberTag::HostComponent) => {
            HostRootMutationApplyRecordKind::CommitHostComponentUpdate
        }
        (HostRootMutationPhaseRecordKind::Update, FiberTag::HostText) => {
            HostRootMutationApplyRecordKind::CommitHostTextUpdate
        }
        (HostRootMutationPhaseRecordKind::Update, tag) => {
            return Err(RootCommitError::ExpectedHostRoot {
                root: record.root(),
                fiber: record.fiber(),
                tag,
            });
        }
    };

    Ok(HostRootMutationApplyRecord {
        root: record.root(),
        host_root: record.host_root(),
        source: HostRootMutationApplyRecordSource::MutationPhase(record.kind()),
        parent: record.parent(),
        parent_tag: record.parent_tag(),
        parent_state_node: record.parent_state_node(),
        fiber: record.fiber(),
        alternate_fiber: record.alternate_fiber(),
        tag: record.tag(),
        kind,
        placement_sibling: record.placement_sibling(),
        lanes: record.lanes(),
        effect_flag: record.effect_flag(),
        state_node: record.state_node(),
        pending_props: record.pending_props(),
        memoized_props: record.memoized_props(),
        alternate_memoized_props: record.alternate_memoized_props(),
    })
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootDeletionApplyRecordRequest {
    root: FiberRootId,
    host_root: FiberId,
    lanes: Lanes,
    list: DeletionListId,
    parent: FiberId,
    parent_tag: FiberTag,
    parent_state_node: StateNodeHandle,
    deleted: FiberId,
}

fn host_root_deletion_apply_record(
    arena: &fast_react_core::FiberArena,
    request: HostRootDeletionApplyRecordRequest,
) -> Result<HostRootMutationApplyRecord, RootCommitError> {
    let node = arena.get(request.deleted)?;
    let tag = node.tag();
    let kind = if !is_supported_host_root_mutation_child(tag) {
        HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber
    } else {
        match request.parent_tag {
            FiberTag::HostRoot => HostRootMutationApplyRecordKind::RemoveDeletedFromContainer,
            FiberTag::HostComponent => HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent,
            _ => HostRootMutationApplyRecordKind::SkipDeletedNonHostFiber,
        }
    };

    Ok(HostRootMutationApplyRecord {
        root: request.root,
        host_root: request.host_root,
        source: HostRootMutationApplyRecordSource::DeletionList(request.list),
        parent: request.parent,
        parent_tag: request.parent_tag,
        parent_state_node: request.parent_state_node,
        fiber: request.deleted,
        alternate_fiber: None,
        tag,
        kind,
        placement_sibling: None,
        lanes: request.lanes,
        effect_flag: FiberFlags::CHILD_DELETION,
        state_node: node.state_node(),
        pending_props: node.pending_props(),
        memoized_props: node.memoized_props(),
        alternate_memoized_props: None,
    })
}

#[doc(hidden)]
impl<H: HostTypes> FiberRootStore<H> {
    pub fn prepare_test_renderer_nested_host_output_canary_fibers(
        &mut self,
        render: HostRootRenderPhaseRecord,
        outer_fixture: crate::TestRendererHostOutputCanaryFixture,
        inner_fixture: crate::TestRendererHostOutputCanaryFixture,
    ) -> Result<
        (
            crate::TestRendererHostOutputCanaryPreparedFibers,
            crate::TestRendererHostOutputCanaryPreparedFibers,
        ),
        crate::TestRendererHostOutputCanaryError,
    > {
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            render.work_in_progress(),
            FiberTag::HostRoot,
        )?;

        let mode = self.fiber_arena().get(render.work_in_progress())?.mode();
        let outer = self.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(outer_fixture.component_props_raw()),
            mode,
        );
        {
            let node = self.fiber_arena_mut().get_mut(outer)?;
            node.set_element_type(ElementTypeHandle::from_raw(
                outer_fixture.element_type_raw(),
            ));
            node.merge_flags(FiberFlags::PLACEMENT);
        }

        let inner = self.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(inner_fixture.component_props_raw()),
            mode,
        );
        {
            let node = self.fiber_arena_mut().get_mut(inner)?;
            node.set_element_type(ElementTypeHandle::from_raw(
                inner_fixture.element_type_raw(),
            ));
            node.merge_flags(FiberFlags::PLACEMENT);
        }

        let text = self.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(inner_fixture.text_props_raw()),
            mode,
        );
        self.fiber_arena_mut().set_children(inner, &[text])?;
        self.fiber_arena_mut().set_children(outer, &[inner])?;
        self.fiber_arena_mut()
            .set_children(render.work_in_progress(), &[outer])?;

        let text_token = self.host_tokens_mut().issue(
            render.root(),
            text,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        );
        self.host_tokens().validate(
            text_token,
            render.root(),
            text,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        )?;
        let inner_token = self.host_tokens_mut().issue(
            render.root(),
            inner,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::Instance,
        );
        self.host_tokens().validate(
            inner_token,
            render.root(),
            inner,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::Instance,
        )?;
        let outer_token = self.host_tokens_mut().issue(
            render.root(),
            outer,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::Instance,
        );
        self.host_tokens().validate(
            outer_token,
            render.root(),
            outer,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::Instance,
        )?;

        let outer_prepared = crate::TestRendererHostOutputCanaryPreparedFibers {
            root: render.root(),
            host_root: render.work_in_progress(),
            component: outer,
            text,
            render_lanes: render.render_lanes(),
            component_token: outer_token,
            text_token,
            fixture: outer_fixture,
        };
        let inner_prepared = crate::TestRendererHostOutputCanaryPreparedFibers {
            root: render.root(),
            host_root: render.work_in_progress(),
            component: inner,
            text,
            render_lanes: render.render_lanes(),
            component_token: inner_token,
            text_token,
            fixture: inner_fixture,
        };

        Ok((outer_prepared, inner_prepared))
    }

    pub fn finish_test_renderer_nested_host_output_canary_fibers(
        &mut self,
        outer_prepared: crate::TestRendererHostOutputCanaryPreparedFibers,
        inner_prepared: crate::TestRendererHostOutputCanaryPreparedFibers,
        outer_state_node_raw: u64,
        inner_state_node_raw: u64,
        text_state_node_raw: u64,
    ) -> Result<
        (
            crate::TestRendererHostOutputCanaryCurrentFibers,
            crate::TestRendererHostOutputCanaryCurrentFibers,
        ),
        crate::TestRendererHostOutputCanaryError,
    > {
        expect_test_renderer_nested_host_output_canary_topology(
            self,
            outer_prepared,
            inner_prepared,
        )?;

        complete_test_renderer_nested_host_output_canary_fiber(
            self,
            inner_prepared.text(),
            FiberTag::HostText,
            inner_prepared.fixture().text_props_raw(),
            text_state_node_raw,
        )?;
        complete_test_renderer_nested_host_output_canary_fiber(
            self,
            inner_prepared.component(),
            FiberTag::HostComponent,
            inner_prepared.fixture().component_props_raw(),
            inner_state_node_raw,
        )?;
        complete_test_renderer_nested_host_output_canary_fiber(
            self,
            outer_prepared.component(),
            FiberTag::HostComponent,
            outer_prepared.fixture().component_props_raw(),
            outer_state_node_raw,
        )?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(
            self,
            outer_prepared.host_root(),
        )?;

        Ok((
            crate::TestRendererHostOutputCanaryCurrentFibers {
                root: outer_prepared.root(),
                host_root: outer_prepared.host_root(),
                component: outer_prepared.component(),
                text: inner_prepared.text(),
                fixture: outer_prepared.fixture(),
            },
            crate::TestRendererHostOutputCanaryCurrentFibers {
                root: inner_prepared.root(),
                host_root: inner_prepared.host_root(),
                component: inner_prepared.component(),
                text: inner_prepared.text(),
                fixture: inner_prepared.fixture(),
            },
        ))
    }

    pub fn prepare_test_renderer_nested_host_parent_text_placement_canary_fibers(
        &mut self,
        render: HostRootRenderPhaseRecord,
        outer_current: crate::TestRendererHostOutputCanaryCurrentFibers,
        inner_current: crate::TestRendererHostOutputCanaryCurrentFibers,
        placed_text_props_raw: u64,
    ) -> Result<
        (
            crate::TestRendererHostOutputCanaryCurrentFibers,
            crate::TestRendererHostOutputCanaryCurrentFibers,
            FiberId,
            HostFiberTokenId,
        ),
        crate::TestRendererHostOutputCanaryError,
    > {
        validate_test_renderer_nested_host_output_canary_current(
            self,
            render,
            outer_current,
            inner_current,
        )?;

        let outer_node = self.fiber_arena().get(outer_current.component())?;
        let outer_state_node = outer_node.state_node();
        if outer_state_node.is_none() {
            return Err(crate::TestRendererHostOutputCanaryError::EmptyStateNode {
                fiber: outer_current.component(),
                tag: FiberTag::HostComponent,
            });
        }
        let outer_props = outer_node.memoized_props();

        let inner_node = self.fiber_arena().get(inner_current.component())?;
        let inner_state_node = inner_node.state_node();
        if inner_state_node.is_none() {
            return Err(crate::TestRendererHostOutputCanaryError::EmptyStateNode {
                fiber: inner_current.component(),
                tag: FiberTag::HostComponent,
            });
        }
        let inner_props = inner_node.memoized_props();

        let text_node = self.fiber_arena().get(inner_current.text())?;
        let text_state_node = text_node.state_node();
        if text_state_node.is_none() {
            return Err(crate::TestRendererHostOutputCanaryError::EmptyStateNode {
                fiber: inner_current.text(),
                tag: FiberTag::HostText,
            });
        }
        let text_props = text_node.memoized_props();

        let work_outer = self
            .fiber_arena_mut()
            .create_work_in_progress(outer_current.component(), outer_props)?;
        {
            let node = self.fiber_arena_mut().get_mut(work_outer)?;
            node.set_state_node(outer_state_node);
            node.set_memoized_props(outer_props);
            node.set_lanes(Lanes::NO);
        }

        let work_inner = self
            .fiber_arena_mut()
            .create_work_in_progress(inner_current.component(), inner_props)?;
        {
            let node = self.fiber_arena_mut().get_mut(work_inner)?;
            node.set_state_node(inner_state_node);
            node.set_memoized_props(inner_props);
            node.set_lanes(Lanes::NO);
        }

        let stable_text = self
            .fiber_arena_mut()
            .create_work_in_progress(inner_current.text(), text_props)?;
        {
            let node = self.fiber_arena_mut().get_mut(stable_text)?;
            node.set_state_node(text_state_node);
            node.set_memoized_props(text_props);
            node.set_lanes(Lanes::NO);
        }

        let mode = self.fiber_arena().get(work_inner)?.mode();
        let placed_text = self.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(placed_text_props_raw),
            mode,
        );
        {
            let node = self.fiber_arena_mut().get_mut(placed_text)?;
            node.set_lanes(Lanes::NO);
            node.merge_flags(FiberFlags::PLACEMENT);
        }

        self.fiber_arena_mut()
            .set_children(work_inner, &[stable_text, placed_text])?;
        self.fiber_arena_mut()
            .set_children(work_outer, &[work_inner])?;
        self.fiber_arena_mut()
            .set_children(render.work_in_progress(), &[work_outer])?;

        let text_token = self.host_tokens_mut().issue(
            render.root(),
            placed_text,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        );
        self.host_tokens().validate(
            text_token,
            render.root(),
            placed_text,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        )?;

        Ok((
            crate::TestRendererHostOutputCanaryCurrentFibers {
                root: render.root(),
                host_root: render.work_in_progress(),
                component: work_outer,
                text: stable_text,
                fixture: outer_current.fixture(),
            },
            crate::TestRendererHostOutputCanaryCurrentFibers {
                root: render.root(),
                host_root: render.work_in_progress(),
                component: work_inner,
                text: stable_text,
                fixture: inner_current.fixture(),
            },
            placed_text,
            text_token,
        ))
    }

    pub fn finish_test_renderer_nested_host_parent_text_placement_canary_fibers(
        &mut self,
        outer_current: crate::TestRendererHostOutputCanaryCurrentFibers,
        inner_current: crate::TestRendererHostOutputCanaryCurrentFibers,
        placed_text: FiberId,
        placed_text_state_node_raw: u64,
        placed_text_props_raw: u64,
    ) -> Result<(), crate::TestRendererHostOutputCanaryError> {
        expect_test_renderer_nested_host_output_canary_current_topology(
            self,
            outer_current,
            inner_current,
        )?;
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            placed_text,
            FiberTag::HostText,
        )?;

        complete_test_renderer_nested_host_output_canary_fiber(
            self,
            placed_text,
            FiberTag::HostText,
            placed_text_props_raw,
            placed_text_state_node_raw,
        )?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(
            self,
            inner_current.text(),
        )?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(self, placed_text)?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(
            self,
            inner_current.component(),
        )?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(
            self,
            outer_current.component(),
        )?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(
            self,
            outer_current.host_root(),
        )?;
        Ok(())
    }

    pub fn prepare_test_renderer_host_parent_text_placement_canary_fibers(
        &mut self,
        render: HostRootRenderPhaseRecord,
        current: crate::TestRendererHostOutputCanaryCurrentFibers,
        placed_text_props_raw: u64,
    ) -> Result<
        (
            crate::TestRendererHostOutputCanaryCurrentFibers,
            FiberId,
            HostFiberTokenId,
        ),
        crate::TestRendererHostOutputCanaryError,
    > {
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            render.work_in_progress(),
            FiberTag::HostRoot,
        )?;
        if current.root() != render.root() {
            return Err(crate::TestRendererHostOutputCanaryError::RootMismatch {
                expected: current.root(),
                actual: render.root(),
            });
        }
        if current.host_root() != render.current() {
            return Err(
                crate::TestRendererHostOutputCanaryError::ExpectedCurrentHostRoot {
                    expected: render.current(),
                    actual: current.host_root(),
                },
            );
        }
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            current.host_root(),
            FiberTag::HostRoot,
        )?;
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            current.component(),
            FiberTag::HostComponent,
        )?;
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            current.text(),
            FiberTag::HostText,
        )?;

        let parent_node = self.fiber_arena().get(current.component())?;
        if parent_node.return_fiber() != Some(current.host_root()) {
            return Err(FiberTopologyError::MixedParentSiblingChain {
                parent: current.host_root(),
                child: current.component(),
                actual_parent: parent_node.return_fiber(),
            }
            .into());
        }
        let parent_state_node = parent_node.state_node();
        if parent_state_node.is_none() {
            return Err(crate::TestRendererHostOutputCanaryError::EmptyStateNode {
                fiber: current.component(),
                tag: FiberTag::HostComponent,
            });
        }
        let parent_props = parent_node.memoized_props();

        let text_node = self.fiber_arena().get(current.text())?;
        if text_node.return_fiber() != Some(current.component()) {
            return Err(FiberTopologyError::MixedParentSiblingChain {
                parent: current.component(),
                child: current.text(),
                actual_parent: text_node.return_fiber(),
            }
            .into());
        }
        let text_state_node = text_node.state_node();
        if text_state_node.is_none() {
            return Err(crate::TestRendererHostOutputCanaryError::EmptyStateNode {
                fiber: current.text(),
                tag: FiberTag::HostText,
            });
        }
        let text_props = text_node.memoized_props();

        let work_parent = self
            .fiber_arena_mut()
            .create_work_in_progress(current.component(), parent_props)?;
        {
            let node = self.fiber_arena_mut().get_mut(work_parent)?;
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
            node.set_lanes(Lanes::NO);
        }

        let stable_text = self
            .fiber_arena_mut()
            .create_work_in_progress(current.text(), text_props)?;
        {
            let node = self.fiber_arena_mut().get_mut(stable_text)?;
            node.set_state_node(text_state_node);
            node.set_memoized_props(text_props);
            node.set_lanes(Lanes::NO);
        }

        let mode = self.fiber_arena().get(work_parent)?.mode();
        let placed_text = self.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(placed_text_props_raw),
            mode,
        );
        {
            let node = self.fiber_arena_mut().get_mut(placed_text)?;
            node.set_lanes(Lanes::NO);
            node.merge_flags(FiberFlags::PLACEMENT);
        }

        self.fiber_arena_mut()
            .set_children(work_parent, &[stable_text, placed_text])?;
        self.fiber_arena_mut()
            .set_children(render.work_in_progress(), &[work_parent])?;

        let text_token = self.host_tokens_mut().issue(
            render.root(),
            placed_text,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        );
        self.host_tokens().validate(
            text_token,
            render.root(),
            placed_text,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::TextInstance,
        )?;

        Ok((
            crate::TestRendererHostOutputCanaryCurrentFibers {
                root: render.root(),
                host_root: render.work_in_progress(),
                component: work_parent,
                text: stable_text,
                fixture: current.fixture(),
            },
            placed_text,
            text_token,
        ))
    }

    pub fn finish_test_renderer_host_parent_text_placement_canary_fibers(
        &mut self,
        current: crate::TestRendererHostOutputCanaryCurrentFibers,
        placed_text: FiberId,
        placed_text_state_node_raw: u64,
        placed_text_props_raw: u64,
    ) -> Result<(), crate::TestRendererHostOutputCanaryError> {
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            current.host_root(),
            FiberTag::HostRoot,
        )?;
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            current.component(),
            FiberTag::HostComponent,
        )?;
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            current.text(),
            FiberTag::HostText,
        )?;
        expect_test_renderer_host_parent_placement_canary_tag(
            self,
            placed_text,
            FiberTag::HostText,
        )?;
        if placed_text_state_node_raw == StateNodeHandle::NONE.raw() {
            return Err(crate::TestRendererHostOutputCanaryError::EmptyStateNode {
                fiber: placed_text,
                tag: FiberTag::HostText,
            });
        }

        {
            let node = self.fiber_arena_mut().get_mut(placed_text)?;
            node.set_state_node(StateNodeHandle::from_raw(placed_text_state_node_raw));
            node.set_memoized_props(PropsHandle::from_raw(placed_text_props_raw));
        }

        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(self, current.text())?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(self, placed_text)?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(
            self,
            current.component(),
        )?;
        refresh_test_renderer_host_parent_placement_canary_bubbled_flags(
            self,
            current.host_root(),
        )?;
        Ok(())
    }
}

fn expect_test_renderer_nested_host_output_canary_topology<H: HostTypes>(
    store: &FiberRootStore<H>,
    outer_prepared: crate::TestRendererHostOutputCanaryPreparedFibers,
    inner_prepared: crate::TestRendererHostOutputCanaryPreparedFibers,
) -> Result<(), crate::TestRendererHostOutputCanaryError> {
    expect_test_renderer_host_parent_placement_canary_tag(
        store,
        outer_prepared.host_root(),
        FiberTag::HostRoot,
    )?;
    expect_test_renderer_host_parent_placement_canary_tag(
        store,
        outer_prepared.component(),
        FiberTag::HostComponent,
    )?;
    expect_test_renderer_host_parent_placement_canary_tag(
        store,
        inner_prepared.component(),
        FiberTag::HostComponent,
    )?;
    expect_test_renderer_host_parent_placement_canary_tag(
        store,
        inner_prepared.text(),
        FiberTag::HostText,
    )?;

    if outer_prepared.root() != inner_prepared.root() {
        return Err(crate::TestRendererHostOutputCanaryError::RootMismatch {
            expected: outer_prepared.root(),
            actual: inner_prepared.root(),
        });
    }
    if outer_prepared.host_root() != inner_prepared.host_root() {
        return Err(
            crate::TestRendererHostOutputCanaryError::ExpectedCurrentHostRoot {
                expected: outer_prepared.host_root(),
                actual: inner_prepared.host_root(),
            },
        );
    }
    if outer_prepared.text() != inner_prepared.text() {
        return Err(FiberTopologyError::MixedParentSiblingChain {
            parent: inner_prepared.component(),
            child: inner_prepared.text(),
            actual_parent: store
                .fiber_arena()
                .get(outer_prepared.text())?
                .return_fiber(),
        }
        .into());
    }

    expect_test_renderer_nested_host_output_canary_prepared_topology(
        store,
        outer_prepared.host_root(),
        outer_prepared.component(),
        inner_prepared.component(),
        inner_prepared.text(),
    )
}

fn expect_test_renderer_nested_host_output_canary_prepared_topology<H: HostTypes>(
    store: &FiberRootStore<H>,
    host_root: FiberId,
    outer_component: FiberId,
    inner_component: FiberId,
    text: FiberId,
) -> Result<(), crate::TestRendererHostOutputCanaryError> {
    if store.fiber_arena().get(host_root)?.child() != Some(outer_component) {
        return Err(FiberTopologyError::MixedParentSiblingChain {
            parent: host_root,
            child: outer_component,
            actual_parent: store.fiber_arena().get(outer_component)?.return_fiber(),
        }
        .into());
    }
    if store.fiber_arena().get(outer_component)?.return_fiber() != Some(host_root) {
        return Err(FiberTopologyError::MixedParentSiblingChain {
            parent: host_root,
            child: outer_component,
            actual_parent: store.fiber_arena().get(outer_component)?.return_fiber(),
        }
        .into());
    }
    if store.fiber_arena().get(outer_component)?.child() != Some(inner_component) {
        return Err(FiberTopologyError::MixedParentSiblingChain {
            parent: outer_component,
            child: inner_component,
            actual_parent: store.fiber_arena().get(inner_component)?.return_fiber(),
        }
        .into());
    }
    if store.fiber_arena().get(inner_component)?.return_fiber() != Some(outer_component) {
        return Err(FiberTopologyError::MixedParentSiblingChain {
            parent: outer_component,
            child: inner_component,
            actual_parent: store.fiber_arena().get(inner_component)?.return_fiber(),
        }
        .into());
    }
    if store.fiber_arena().get(inner_component)?.child() != Some(text) {
        return Err(FiberTopologyError::MixedParentSiblingChain {
            parent: inner_component,
            child: text,
            actual_parent: store.fiber_arena().get(text)?.return_fiber(),
        }
        .into());
    }
    if store.fiber_arena().get(text)?.return_fiber() != Some(inner_component) {
        return Err(FiberTopologyError::MixedParentSiblingChain {
            parent: inner_component,
            child: text,
            actual_parent: store.fiber_arena().get(text)?.return_fiber(),
        }
        .into());
    }

    Ok(())
}

fn validate_test_renderer_nested_host_output_canary_current<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    outer_current: crate::TestRendererHostOutputCanaryCurrentFibers,
    inner_current: crate::TestRendererHostOutputCanaryCurrentFibers,
) -> Result<(), crate::TestRendererHostOutputCanaryError> {
    expect_test_renderer_host_parent_placement_canary_tag(
        store,
        render.work_in_progress(),
        FiberTag::HostRoot,
    )?;
    if outer_current.root() != render.root() {
        return Err(crate::TestRendererHostOutputCanaryError::RootMismatch {
            expected: outer_current.root(),
            actual: render.root(),
        });
    }
    if inner_current.root() != render.root() {
        return Err(crate::TestRendererHostOutputCanaryError::RootMismatch {
            expected: inner_current.root(),
            actual: render.root(),
        });
    }
    if outer_current.host_root() != render.current() {
        return Err(
            crate::TestRendererHostOutputCanaryError::ExpectedCurrentHostRoot {
                expected: render.current(),
                actual: outer_current.host_root(),
            },
        );
    }
    if inner_current.host_root() != render.current() {
        return Err(
            crate::TestRendererHostOutputCanaryError::ExpectedCurrentHostRoot {
                expected: render.current(),
                actual: inner_current.host_root(),
            },
        );
    }

    expect_test_renderer_nested_host_output_canary_current_topology(
        store,
        outer_current,
        inner_current,
    )
}

fn expect_test_renderer_nested_host_output_canary_current_topology<H: HostTypes>(
    store: &FiberRootStore<H>,
    outer_current: crate::TestRendererHostOutputCanaryCurrentFibers,
    inner_current: crate::TestRendererHostOutputCanaryCurrentFibers,
) -> Result<(), crate::TestRendererHostOutputCanaryError> {
    expect_test_renderer_host_parent_placement_canary_tag(
        store,
        outer_current.host_root(),
        FiberTag::HostRoot,
    )?;
    expect_test_renderer_host_parent_placement_canary_tag(
        store,
        outer_current.component(),
        FiberTag::HostComponent,
    )?;
    expect_test_renderer_host_parent_placement_canary_tag(
        store,
        inner_current.component(),
        FiberTag::HostComponent,
    )?;
    expect_test_renderer_host_parent_placement_canary_tag(
        store,
        inner_current.text(),
        FiberTag::HostText,
    )?;

    if outer_current.text() != inner_current.text() {
        return Err(FiberTopologyError::MixedParentSiblingChain {
            parent: inner_current.component(),
            child: inner_current.text(),
            actual_parent: store
                .fiber_arena()
                .get(outer_current.text())?
                .return_fiber(),
        }
        .into());
    }

    expect_test_renderer_nested_host_output_canary_prepared_topology(
        store,
        outer_current.host_root(),
        outer_current.component(),
        inner_current.component(),
        inner_current.text(),
    )
}

fn complete_test_renderer_nested_host_output_canary_fiber<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    fiber: FiberId,
    tag: FiberTag,
    props_raw: u64,
    state_node_raw: u64,
) -> Result<(), crate::TestRendererHostOutputCanaryError> {
    if state_node_raw == StateNodeHandle::NONE.raw() {
        return Err(crate::TestRendererHostOutputCanaryError::EmptyStateNode { fiber, tag });
    }
    expect_test_renderer_host_parent_placement_canary_tag(store, fiber, tag)?;

    let bubbled = fast_react_core::bubble_properties(store.fiber_arena(), fiber)?;
    let node = store.fiber_arena_mut().get_mut(fiber)?;
    node.set_state_node(StateNodeHandle::from_raw(state_node_raw));
    node.set_memoized_props(PropsHandle::from_raw(props_raw));
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());
    Ok(())
}

fn refresh_test_renderer_host_parent_placement_canary_bubbled_flags<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    fiber: FiberId,
) -> Result<(), crate::TestRendererHostOutputCanaryError> {
    let bubbled = fast_react_core::bubble_properties(store.fiber_arena(), fiber)?;
    let node = store.fiber_arena_mut().get_mut(fiber)?;
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());
    Ok(())
}

fn expect_test_renderer_host_parent_placement_canary_tag<H: HostTypes>(
    store: &FiberRootStore<H>,
    fiber: FiberId,
    expected: FiberTag,
) -> Result<(), crate::TestRendererHostOutputCanaryError> {
    let actual = store.fiber_arena().get(fiber)?.tag();
    if actual == expected {
        Ok(())
    } else {
        Err(crate::TestRendererHostOutputCanaryError::ExpectedFiberTag {
            fiber,
            expected,
            actual,
        })
    }
}

fn collect_deletion_list_metadata<H: HostTypes>(
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

fn materialize_deletion_subtree_traversal_gate<H: HostTypes>(
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

fn collect_pending_host_node_deletion_cleanup<H: HostTypes>(
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

fn materialize_host_node_deletion_cleanup_log<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root: FiberRootId,
    finished_work: FiberId,
    pending_records: Vec<PendingHostRootDeletionCleanupRecord>,
) -> Result<HostRootDeletionCleanupLog, RootCommitError> {
    let mut log = HostRootDeletionCleanupLog::new(root, finished_work);
    for pending in pending_records {
        let token_phase = HostFiberTokenPhase::Deletion;
        let token = store.host_tokens_mut().issue(
            pending.root,
            pending.fiber,
            token_phase,
            pending.token_target,
        );
        store.host_tokens().validate(
            token,
            pending.root,
            pending.fiber,
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

fn materialize_deletion_cleanup_order_gate(
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

fn materialize_deletion_subtree_host_detachment_plan_for_canary(
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

fn validate_finished_host_root<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
) -> Result<(), RootCommitError> {
    let root_id = render.root();
    let root = store.root(root_id)?;
    let current = root.current();
    let finished_work = render.finished_work();
    let finished_lanes = render.render_lanes();

    if finished_lanes.is_empty() {
        return Err(RootCommitError::EmptyFinishedLanes { root: root_id });
    }

    if current != render.current() {
        return Err(RootCommitError::CurrentMismatch {
            root: root_id,
            expected: render.current(),
            actual: current,
        });
    }

    if finished_work == current {
        return Err(RootCommitError::FinishedWorkIsCurrent {
            root: root_id,
            current,
        });
    }

    let scheduling = root.scheduling();
    if scheduling.work_in_progress() != Some(finished_work) {
        return Err(RootCommitError::RenderPhaseWorkMismatch {
            root: root_id,
            expected: scheduling.work_in_progress(),
            actual: finished_work,
        });
    }
    if scheduling.work_in_progress_root_render_lanes() != finished_lanes {
        return Err(RootCommitError::RenderPhaseLanesMismatch {
            root: root_id,
            expected: scheduling.work_in_progress_root_render_lanes(),
            actual: finished_lanes,
        });
    }
    if scheduling.render_exit_status() != RootRenderExitStatus::Completed {
        return Err(RootCommitError::RenderPhaseNotCompleted {
            root: root_id,
            status: scheduling.render_exit_status(),
        });
    }

    let arena = store.fiber_arena();
    let current_node = arena.get(current)?;
    let finished_node = arena.get(finished_work)?;

    if current_node.tag() != FiberTag::HostRoot {
        return Err(RootCommitError::ExpectedHostRoot {
            root: root_id,
            fiber: current,
            tag: current_node.tag(),
        });
    }
    if finished_node.tag() != FiberTag::HostRoot {
        return Err(RootCommitError::ExpectedHostRoot {
            root: root_id,
            fiber: finished_work,
            tag: finished_node.tag(),
        });
    }

    let expected_state_node = root_id.state_node_handle();
    if current_node.state_node() != expected_state_node {
        return Err(RootCommitError::HostRootStateNodeMismatch {
            root: root_id,
            fiber: current,
            expected: expected_state_node,
            actual: current_node.state_node(),
        });
    }
    if finished_node.state_node() != expected_state_node {
        return Err(RootCommitError::HostRootStateNodeMismatch {
            root: root_id,
            fiber: finished_work,
            expected: expected_state_node,
            actual: finished_node.state_node(),
        });
    }

    let is_alternate_pair = current_node.alternate() == Some(finished_work)
        && finished_node.alternate() == Some(current);
    if !is_alternate_pair {
        return Err(RootCommitError::FinishedWorkNotAlternate {
            root: root_id,
            current,
            finished_work,
        });
    }
    arena.validate_alternate_pair(current, finished_work)?;

    if finished_node.memoized_state() != render.memoized_state() {
        return Err(RootCommitError::MemoizedStateMismatch {
            root: root_id,
            expected: render.memoized_state(),
            actual: finished_node.memoized_state(),
        });
    }
    store
        .host_root_states()
        .get(finished_node.memoized_state())?;

    if current_node.update_queue() != render.current_update_queue() {
        return Err(RootCommitError::UpdateQueueMismatch {
            root: root_id,
            expected: render.current_update_queue(),
            actual: current_node.update_queue(),
        });
    }
    if finished_node.update_queue() != render.work_in_progress_update_queue() {
        return Err(RootCommitError::UpdateQueueMismatch {
            root: root_id,
            expected: render.work_in_progress_update_queue(),
            actual: finished_node.update_queue(),
        });
    }
    store.update_queues().queue(render.current_update_queue())?;
    store
        .update_queues()
        .queue(render.work_in_progress_update_queue())?;

    let actual_remaining_lanes = finished_node.lanes().merge(finished_node.child_lanes());
    if actual_remaining_lanes != render.remaining_lanes() {
        return Err(RootCommitError::RemainingLanesMismatch {
            root: root_id,
            expected: render.remaining_lanes(),
            actual: actual_remaining_lanes,
        });
    }

    Ok(())
}

#[cfg(test)]
mod tests;
