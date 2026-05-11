use super::*;
use crate::begin_work::{
    BeginWorkError, FragmentSingleHostChildBeginWorkError, PORTAL_RECONCILER_UNSUPPORTED_FEATURE,
};
use crate::complete_work::{
    HostComponentManagedChildCompleteWorkRecordForCanary,
    HostComponentManagedChildMutationKindForCanary,
    HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
    host_component_managed_child_complete_work_record_for_canary,
    host_component_managed_child_sibling_order_complete_work_record_for_canary,
};
use crate::concurrent_updates::{
    enqueue_concurrent_host_root_update, finish_queueing_concurrent_updates,
};
use crate::context::{
    ContextProviderUpdateDependencyPath, ContextProviderUpdateTwoConsumerLaneRequest,
    record_context_provider_update_two_consumer_lane_gate,
};
use crate::function_component::FunctionComponentRenderPhaseUpdateGate;
use crate::function_component::{
    FunctionComponentContextReadRecord, FunctionComponentContextRenderReader,
    FunctionComponentContextRenderStore, FunctionComponentEffectPhase,
    FunctionComponentHookRenderStore, FunctionComponentInvocationError,
    FunctionComponentInvocationRequest, FunctionComponentOutputHandle,
    FunctionComponentRenderError, FunctionComponentSingleChildOutput,
    FunctionComponentSingleChildOutputResolver, FunctionComponentSingleChildReconciliationError,
    FunctionComponentStateDispatchRequest,
};
use crate::host_nodes::HostNodeViolation;
use crate::host_work::{
    DetachedHostRecords, TestHostComponentPropertyPayloadKind, TestHostRootDeletionCleanupAction,
    TestHostRootDeletionCleanupApplyResult, TestHostRootDeletionCleanupStatus,
    TestHostRootDeletionRefPassiveCleanupExecutionPhase,
    TestHostRootDeletionTeardownExecutionDiagnosticForCanary,
    TestHostRootDeletionTeardownExecutionErrorForCanary,
    TestHostRootHostUpdateExecutionErrorForCanary,
    TestHostRootManagedChildExecutionDiagnosticForCanary,
    TestHostRootManagedChildSiblingOrderExecutionDiagnosticForCanary,
    TestHostRootMutationApplyResult, TestHostRootMutationApplyStatus, TestHostRootMutationHostCall,
    TestHostRootPrivateStoreMutation, apply_managed_child_complete_work_handoff_for_canary,
    apply_managed_child_sibling_order_complete_work_handoff_for_canary,
    apply_one_test_host_update_with_finished_work_handoff_for_canary,
    apply_test_host_root_commit_mutations_for_canary,
    apply_test_host_root_deletion_cleanup_for_canary,
    create_detached_test_host_component_for_existing_fiber_for_canary,
    create_detached_test_host_text_for_existing_fiber_for_canary,
    delete_test_host_root_sibling_child_for_canary,
    execute_test_host_root_deletion_teardown_after_commit_for_canary,
    mount_test_host_sibling_work_with_detached_hosts_for_canary,
    preflight_test_host_root_deletion_apply_and_cleanup_for_canary,
    test_host_root_deletion_teardown_execution_request_for_canary,
    update_test_host_root_component_with_text_child_work_with_detached_hosts_for_canary,
    update_test_host_root_sibling_text_child_work_for_canary,
    update_test_host_root_work_with_detached_hosts_for_canary,
};
use crate::passive_effects::{
    DeletedSubtreeRefCleanupReturnExecutionRequest, DeletedSubtreeRefCleanupReturnExecutor,
    PassiveEffectDestroyCallbackErrorHandle, PassiveEffectDestroyCallbackExecutionRequest,
    PassiveEffectDestroyCallbackExecutor,
};
use crate::root_commit::{
    FunctionComponentDeletedSubtreePendingPassiveCommitHandoff, HostRootDeletionCleanupOrderPhase,
    HostRootManagedChildCommitExecutionBlockerForCanary,
    HostRootManagedChildCommitExecutionStatusForCanary,
    HostRootManagedChildCommitHandoffRecordForCanary,
    HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary, HostRootMutationApplyRecordKind,
    HostRootMutationApplyRecordSource, HostRootMutationPhaseRecordKind,
    HostRootPlacementSiblingStatus, commit_managed_child_complete_work_handoff_for_canary,
    commit_managed_child_sibling_order_complete_work_handoff_for_canary,
    queue_function_component_deleted_subtree_pending_passive_effects,
};
use crate::root_updates::validate_update_container_lane_diagnostics_for_canary;
use crate::test_support::{FakeContainer, RecordingHost, TestHostNode, TestHostTree};
use crate::unsupported_features::{
    ACTIVITY_UNSUPPORTED_FEATURE, OFFSCREEN_UNSUPPORTED_FEATURE, SUSPENSE_LIST_UNSUPPORTED_FEATURE,
    SUSPENSE_UNSUPPORTED_FEATURE, VIEW_TRANSITION_UNSUPPORTED_FEATURE,
};
use crate::{
    ExecutionContextState, HostRootHydrationState, MUTATION_RENDER_PLACEHOLDER_FEATURE,
    PendingChildrenHandle, PendingCommitHandle, ReconcilerError, RootContextHandle,
    RootElementHandle, RootHydrationCallbacksHandle, RootKind, RootOptions,
    RootSchedulerCallbackExecutionStatus, RootSuspenseBoundarySetHandle, RootTaskScheduleOutcome,
    RootTransitionCallbacksHandle, RootUpdateCallbackHandle, RootUpdateError,
    RootUpdateLaneSourcePriority, RootUpdatePayload, SchedulerCallbackRequest,
    commit_finished_host_root, ensure_root_is_scheduled, execute_scheduled_root_callback,
    flush_sync_work_on_all_roots, process_root_schedule_in_microtask, update_container,
    update_container_sync,
};
use fast_react_core::{
    ContextHandle, ContextValueHandle, DeletionListId, DependenciesHandle, ElementTypeHandle,
    EventPriority, FiberFlags, FiberMode, FiberTag, FiberTypeHandle, HookEffectCallbackHandle,
    HookEffectDependencies, HookUpdateLane, Lane, Lanes, PropsHandle, ReactKey, RefHandle,
    RootFinishedLanes, StateHandle, StateNodeHandle, UpdateQueueHandle,
};

include!("tests/helpers/fixtures.rs");
include!("tests/helpers/managed_child.rs");
include!("tests/helpers/fiber_builders.rs");
include!("tests/helpers/handoff.rs");

mod basic;
mod child_set;
mod commit_handoff;
mod context;
mod final_handoff;
mod function_component;
mod function_component_tail;
mod host_complete;
mod host_update;
mod managed_child;
mod suspense;
mod unmount;
