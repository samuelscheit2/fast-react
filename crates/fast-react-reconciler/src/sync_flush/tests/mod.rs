use super::*;
use crate::function_component::{FunctionComponentEffectPhase, FunctionComponentHookRenderStore};
use crate::host_work::{
    DetachedHostRecords, HostWorkError, HostWorkResult,
    SyncFlushDeletedSubtreeTeardownExecutionDiagnosticForCanary,
    SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary,
    SyncFlushHostMutationExecutionErrorForCanary,
    TestHostRootDeletionRefPassiveCleanupExecutionPhase,
    TestHostRootDeletionTeardownExecutionErrorForCanary, TestHostRootMutationApplyStatus,
    TestHostRootMutationHostCall,
    create_detached_test_host_component_for_existing_fiber_for_canary,
    create_detached_test_host_text_for_existing_fiber_for_canary,
    delete_test_host_work_root_child_for_canary,
    execute_sync_flush_deleted_subtree_teardown_for_canary,
    execute_sync_flush_host_mutations_for_canary, mount_test_host_work,
    sync_flush_host_mutation_execution_request_for_canary,
    test_host_root_deletion_teardown_execution_request_for_canary,
    update_test_host_work_root_component_for_canary, update_test_host_work_root_text_for_canary,
};
use crate::passive_effects::{
    DeletedSubtreeRefCleanupReturnExecutionRequest, DeletedSubtreeRefCleanupReturnExecutor,
    PassiveEffectDestroyCallbackErrorHandle, PassiveEffectDestroyCallbackExecutionRequest,
    PassiveEffectDestroyCallbackExecutor,
};
use crate::root_callbacks::{
    ROOT_UPDATE_CALLBACK_INVOCATION_EXECUTION_GATE_BLOCKERS,
    RootUpdateCallbackInvocationErrorHandle, RootUpdateCallbackInvocationExecutionGateStatus,
    RootUpdateCallbackInvocationRequest, RootUpdateCallbackInvocationStatus,
    RootUpdateCallbackInvocationTestControl,
};
use crate::root_commit::{
    FunctionComponentDeletedSubtreePendingPassiveCommitHandoff,
    HostRootFinishedWorkCommitHandoffRecordForCanary, HostRootMutationApplyRecordKind,
    HostRootMutationApplyRecordSource,
    queue_function_component_deleted_subtree_pending_passive_effects,
};
use crate::root_config::RootErrorOptionCallbackPhase;
use crate::root_scheduler::{
    RootSyncSchedulerContinuationExecutionStatus, SchedulerBridgeActContinuationExecutionStatus,
    SchedulerBridgeActQueueRequestExecutionStatus, root_sync_flush_record_for_canary,
    root_sync_flush_record_with_status_for_canary,
};
use crate::root_updates::{
    host_root_queued_callback_order_snapshot_for_canary, update_container_transition_for_canary,
};
use crate::scheduler_bridge::SchedulerActContinuationStatus;
use crate::test_support::{
    FakeContainer, RecordingHost, TestHostElement, TestHostNode, TestHostText, TestHostTree,
};
use crate::{
    ExecutionContextState, RootElementHandle, RootErrorCallbackHandle, RootOptions,
    RootRecoverableErrorCallbackHandle, RootSyncFlushExitStatus, RootSyncFlushRecordStatus,
    RootTaskScheduleOutcome, TestRendererHostOutputCanaryFixture,
    TestRendererHostOutputCanaryMutationKind, commit_finished_host_root, ensure_root_is_scheduled,
    finish_test_renderer_host_output_canary_fibers, flush_sync_work_on_all_roots,
    inspect_test_renderer_host_output_canary_commit,
    prepare_test_renderer_host_output_canary_fibers, scheduled_roots, update_container,
    update_container_sync,
};
use crate::{RootUpdateCallbackHandle, RootUpdateCallbackRecord, RootUpdateCallbackVisibility};
use fast_react_core::{
    DependenciesHandle, FiberFlags, FiberId, FiberTag, FiberTypeHandle, HookEffectCallbackHandle,
    HookEffectDependencies, Lane, Lanes, PropsHandle, RefHandle, StateNodeHandle,
    UpdateQueueHandle, bubble_properties,
};

mod act;
mod callbacks;
mod host_mutations;
mod root_commit_continuation;

fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let root_id = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    (store, root_id, host)
}

fn current_host_root_element(
    store: &FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
) -> RootElementHandle {
    let current = store.root(root_id).unwrap().current();
    host_root_element(store, current)
}

fn host_root_element(
    store: &FiberRootStore<RecordingHost>,
    fiber: fast_react_core::FiberId,
) -> RootElementHandle {
    let state = store.fiber_arena().get(fiber).unwrap().memoized_state();
    store.host_root_states().get(state).unwrap().element()
}

fn schedule_sync_update(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    element: RootElementHandle,
) {
    let result = update_container_sync(store, root_id, element, None).unwrap();
    ensure_root_is_scheduled(store, result.schedule()).unwrap();
}

fn callback_handles(records: &[RootUpdateCallbackRecord]) -> Vec<RootUpdateCallbackHandle> {
    records.iter().map(|record| record.callback()).collect()
}

fn assert_sync_flush_finished_work_handoff_diagnostics(
    store: &FiberRootStore<RecordingHost>,
    record: &SyncFlushRootRecord,
    previous_current: fast_react_core::FiberId,
) {
    let diagnostics = record
        .host_output_commit_diagnostics_for_canary(store)
        .unwrap();

    assert!(record.accepted_finished_work_handoff_for_canary());
    assert!(diagnostics.finished_work_handoff_identity_recorded());
    assert!(diagnostics.commit_result_identity_recorded());
    assert!(diagnostics.accepted_finished_work_handoff_identity());
    assert!(diagnostics.commit_result_matches_finished_work_handoff());
    assert!(diagnostics.finished_work_root_commit_handoff_verified());
    assert!(diagnostics.accepted_finished_work_handoff());
    assert!(diagnostics.commit_handoff_state_consumed());
    assert_eq!(
        diagnostics.root_finished_work_before_commit(),
        Some(record.render_phase().finished_work())
    );
    assert_eq!(
        diagnostics.pending_work_before_commit(),
        Some(record.render_phase().finished_work())
    );
    assert_eq!(
        diagnostics.finished_work_before_commit(),
        Some(record.render_phase().finished_work())
    );
    assert_eq!(
        diagnostics.finished_lanes_before_commit(),
        Some(record.render_lanes())
    );
    assert_eq!(
        diagnostics.root_finished_lanes_before_commit(),
        Some(record.render_lanes())
    );
    assert_eq!(diagnostics.current_before_commit(), Some(previous_current));
}

fn assert_sync_flush_finished_work_handoff_identity_mismatch(error: SyncFlushError) {
    assert!(matches!(
        error,
        SyncFlushError::FinishedWorkCommitHandoff(message)
            if message == SYNC_FLUSH_FINISHED_WORK_HANDOFF_IDENTITY_MISMATCH_FOR_CANARY
    ));
}

struct SyncFlushHostMutationFixture {
    store: FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    source: TestHostTree,
    host: RecordingHost,
    host_work: HostWorkResult,
    committed: SyncFlushRootRecord,
    diagnostics: SyncFlushRootHostOutputCommitDiagnosticsForCanary,
    operations_before_opt_in: Vec<&'static str>,
}

fn sync_flush_host_mutation_fixture(label: &str) -> SyncFlushHostMutationFixture {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_host_element_with_text("section", label);
    schedule_sync_update(&mut store, root_id, element);
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    let render_phase = rendered_record.render_phase();
    let host_work = mount_test_host_work(&mut store, &mut host, render_phase, &source).unwrap();
    let operations_before_opt_in = host.operations();

    let (committed, diagnostics) =
        SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
            &mut store,
            rendered_record,
        )
        .unwrap();

    assert_eq!(host.operations(), operations_before_opt_in);

    SyncFlushHostMutationFixture {
        store,
        root_id,
        source,
        host,
        host_work,
        committed,
        diagnostics,
        operations_before_opt_in,
    }
}

fn sync_flush_text_host_mutation_fixture(label: &str) -> SyncFlushHostMutationFixture {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_text(label);
    schedule_sync_update(&mut store, root_id, element);
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    let render_phase = rendered_record.render_phase();
    let host_work = mount_test_host_work(&mut store, &mut host, render_phase, &source).unwrap();
    let operations_before_opt_in = host.operations();

    let (committed, diagnostics) =
        SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
            &mut store,
            rendered_record,
        )
        .unwrap();

    assert_eq!(host.operations(), operations_before_opt_in);

    SyncFlushHostMutationFixture {
        store,
        root_id,
        source,
        host,
        host_work,
        committed,
        diagnostics,
        operations_before_opt_in,
    }
}

fn text_from_root(source: &TestHostTree, element: RootElementHandle) -> &TestHostText {
    match source.root(element).unwrap() {
        TestHostNode::Text(text) => text,
        TestHostNode::Element(_) => panic!("expected text root"),
    }
}

fn element_from_root(source: &TestHostTree, element: RootElementHandle) -> &TestHostElement {
    match source.root(element).unwrap() {
        TestHostNode::Element(element) => element,
        TestHostNode::Text(_) => panic!("expected host element root"),
    }
}

fn execute_fixture_sync_flush_host_mutations(
    fixture: &mut SyncFlushHostMutationFixture,
) -> crate::host_work::SyncFlushHostMutationExecutionDiagnosticForCanary {
    let request = sync_flush_host_mutation_execution_request_for_canary(
        &fixture.committed,
        fixture.diagnostics,
    )
    .unwrap();
    execute_sync_flush_host_mutations_for_canary(
        &mut fixture.store,
        &mut fixture.host,
        &fixture.committed,
        fixture.diagnostics,
        request,
        &mut fixture.host_work,
    )
    .unwrap()
}

const SYNC_FLUSH_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER: usize = 889_003;

struct SyncFlushDeletedSubtreeTeardownFixture {
    previous_current: FiberId,
    work_parent: FiberId,
    deletion_list: fast_react_core::DeletionListId,
    host_parent_state_node: StateNodeHandle,
    deleted_host: FiberId,
    deleted_host_state_node: StateNodeHandle,
    deleted_host_ref: RefHandle,
    deleted_function: FiberId,
    deleted_text: FiberId,
    deleted_text_state_node: StateNodeHandle,
    passive_create: HookEffectCallbackHandle,
    passive_destroy: HookEffectCallbackHandle,
    passive_dependencies: HookEffectDependencies,
    deleted_passive_handoff: FunctionComponentDeletedSubtreePendingPassiveCommitHandoff,
    committed: SyncFlushRootRecord,
    diagnostics: SyncFlushRootHostOutputCommitDiagnosticsForCanary,
    sync_request: crate::host_work::SyncFlushHostMutationExecutionRequestForCanary,
    deletion_request: crate::host_work::TestHostRootDeletionTeardownExecutionRequestForCanary,
    host_work: HostWorkResult,
    operations_before_teardown: Vec<&'static str>,
}

#[derive(Default)]
struct RecordingSyncFlushDeletedSubtreeTeardownExecutor {
    ref_cleanup_calls: Vec<DeletedSubtreeRefCleanupReturnExecutionRequest>,
    destroy_calls: Vec<PassiveEffectDestroyCallbackExecutionRequest>,
}

impl RecordingSyncFlushDeletedSubtreeTeardownExecutor {
    fn ref_cleanup_calls(&self) -> &[DeletedSubtreeRefCleanupReturnExecutionRequest] {
        &self.ref_cleanup_calls
    }

    fn destroy_calls(&self) -> &[PassiveEffectDestroyCallbackExecutionRequest] {
        &self.destroy_calls
    }
}

impl DeletedSubtreeRefCleanupReturnExecutor for RecordingSyncFlushDeletedSubtreeTeardownExecutor {
    fn execute_deleted_ref_cleanup_return(
        &mut self,
        request: DeletedSubtreeRefCleanupReturnExecutionRequest,
    ) {
        self.ref_cleanup_calls.push(request);
    }
}

impl PassiveEffectDestroyCallbackExecutor for RecordingSyncFlushDeletedSubtreeTeardownExecutor {
    fn execute_destroy_callback(
        &mut self,
        request: PassiveEffectDestroyCallbackExecutionRequest,
    ) -> Result<(), PassiveEffectDestroyCallbackErrorHandle> {
        self.destroy_calls.push(request);
        Ok(())
    }
}

fn sync_flush_deleted_subtree_hook_callback(raw: u64) -> HookEffectCallbackHandle {
    HookEffectCallbackHandle::from_raw(raw)
}

fn sync_flush_deleted_subtree_hook_dependencies(raw: u64) -> HookEffectDependencies {
    HookEffectDependencies::array(DependenciesHandle::from_raw(raw))
}

fn bubble_sync_flush_deleted_subtree_fiber(
    store: &mut FiberRootStore<RecordingHost>,
    fiber: FiberId,
) {
    let bubbled = bubble_properties(store.fiber_arena(), fiber).unwrap();
    let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());
}

fn prepare_sync_flush_deleted_subtree_teardown_fixture(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    root_id: FiberRootId,
    raw: u64,
) -> SyncFlushDeletedSubtreeTeardownFixture {
    let mut detached_hosts = DetachedHostRecords::new_for_canary();
    let mut hook_store = FunctionComponentHookRenderStore::new();

    schedule_sync_update(store, root_id, RootElementHandle::from_raw(raw));
    let create_rendered =
        flush_sync_work_on_all_roots(store, &ExecutionContextState::new()).unwrap();
    let create_render = create_rendered.records()[0].render_phase();
    let host_root = create_render.finished_work();
    let mode = store.fiber_arena().get(host_root).unwrap().mode();

    let text_props = PropsHandle::from_raw(raw + 1);
    let deleted_text =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostText, None, text_props, mode);
    let deleted_text_state_node = create_detached_test_host_text_for_existing_fiber_for_canary(
        store,
        host,
        &mut detached_hosts,
        root_id,
        deleted_text,
        "sync flush deleted passive text",
        text_props,
    )
    .unwrap();

    let function_props = PropsHandle::from_raw(raw + 2);
    let deleted_function = store.fiber_arena_mut().create_fiber(
        FiberTag::FunctionComponent,
        None,
        function_props,
        mode,
    );
    {
        let node = store.fiber_arena_mut().get_mut(deleted_function).unwrap();
        node.set_fiber_type(FiberTypeHandle::from_raw(raw + 3));
    }
    store
        .fiber_arena_mut()
        .set_children(deleted_function, &[deleted_text])
        .unwrap();
    let passive_create = sync_flush_deleted_subtree_hook_callback(raw + 4);
    let passive_destroy = sync_flush_deleted_subtree_hook_callback(raw + 5);
    let passive_dependencies = sync_flush_deleted_subtree_hook_dependencies(raw + 6);
    hook_store
        .create_current_effect_metadata(
            store.fiber_arena_mut(),
            deleted_function,
            FunctionComponentEffectPhase::Passive,
            passive_create,
            passive_dependencies,
            Some(passive_destroy),
        )
        .unwrap();
    bubble_sync_flush_deleted_subtree_fiber(store, deleted_function);

    let deleted_host_props = PropsHandle::from_raw(raw + 7);
    let deleted_host = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        deleted_host_props,
        mode,
    );
    let deleted_host_ref = RefHandle::from_raw(raw + 8);
    {
        let node = store.fiber_arena_mut().get_mut(deleted_host).unwrap();
        node.set_ref_handle(deleted_host_ref);
    }
    store
        .fiber_arena_mut()
        .set_children(deleted_host, &[deleted_function])
        .unwrap();
    let deleted_host_state_node =
        create_detached_test_host_component_for_existing_fiber_for_canary(
            store,
            host,
            &mut detached_hosts,
            root_id,
            deleted_host,
            "article",
            deleted_host_props,
            &[deleted_text],
        )
        .unwrap();

    let host_parent_props = PropsHandle::from_raw(raw + 9);
    let host_parent = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        host_parent_props,
        mode,
    );
    {
        let node = store.fiber_arena_mut().get_mut(host_parent).unwrap();
        node.set_flags(FiberFlags::PLACEMENT);
    }
    store
        .fiber_arena_mut()
        .set_children(host_parent, &[deleted_host])
        .unwrap();
    let host_parent_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
        store,
        host,
        &mut detached_hosts,
        root_id,
        host_parent,
        "section",
        host_parent_props,
        &[deleted_host],
    )
    .unwrap();

    store
        .fiber_arena_mut()
        .set_children(host_root, &[host_parent])
        .unwrap();
    bubble_sync_flush_deleted_subtree_fiber(store, host_root);
    commit_finished_host_root(store, create_render).unwrap();

    schedule_sync_update(store, root_id, RootElementHandle::from_raw(raw + 10));
    let rendered = flush_sync_work_on_all_roots(store, &ExecutionContextState::new()).unwrap();
    let rendered_record = rendered.records()[0];
    let delete_render = rendered_record.render_phase();
    let previous_current = delete_render.current();
    let work_parent = store
        .fiber_arena_mut()
        .create_work_in_progress(host_parent, host_parent_props)
        .unwrap();
    {
        let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
        node.set_lanes(Lanes::NO);
        node.set_memoized_props(host_parent_props);
    }
    let deletion_list = store
        .fiber_arena_mut()
        .mark_child_for_deletion(work_parent, deleted_host)
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(delete_render.finished_work(), &[work_parent])
        .unwrap();
    bubble_sync_flush_deleted_subtree_fiber(store, delete_render.finished_work());
    let deleted_passive_handoff = queue_function_component_deleted_subtree_pending_passive_effects(
        store,
        root_id,
        &hook_store,
        work_parent,
        deleted_host,
        Lanes::SYNC,
    )
    .unwrap();
    let operations_before_teardown = host.operations();

    let (mut committed, diagnostics) =
        SyncFlushRootRecord::commit_rendered_sync_flush_record_with_diagnostics_for_canary(
            store,
            rendered_record,
        )
        .unwrap();
    committed
        .record_function_component_deleted_subtree_passive_effects_for_canary(&[
            deleted_passive_handoff.clone(),
        ])
        .unwrap();
    let sync_request =
        sync_flush_host_mutation_execution_request_for_canary(&committed, diagnostics).unwrap();
    let deletion_request = test_host_root_deletion_teardown_execution_request_for_canary(
        committed
            .root_finished_work_commit_handoff_for_canary()
            .unwrap(),
        SYNC_FLUSH_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER,
    )
    .unwrap();
    let host_work = HostWorkResult::from_detached_hosts_for_canary(
        root_id,
        delete_render.finished_work(),
        vec![work_parent],
        vec![deleted_host, deleted_text],
        detached_hosts,
    );

    SyncFlushDeletedSubtreeTeardownFixture {
        previous_current,
        work_parent,
        deletion_list,
        host_parent_state_node,
        deleted_host,
        deleted_host_state_node,
        deleted_host_ref,
        deleted_function,
        deleted_text,
        deleted_text_state_node,
        passive_create,
        passive_destroy,
        passive_dependencies,
        deleted_passive_handoff,
        committed,
        diagnostics,
        sync_request,
        deletion_request,
        host_work,
        operations_before_teardown,
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct SyncFlushDeletedSubtreePostPassiveContinuationDiagnosticForCanary {
    deleted_subtree_teardown: SyncFlushDeletedSubtreeTeardownExecutionDiagnosticForCanary,
    post_passive_continuation: SyncFlushPostPassiveContinuationExecutionRecord,
}

impl SyncFlushDeletedSubtreePostPassiveContinuationDiagnosticForCanary {
    fn deleted_subtree_teardown(
        &self,
    ) -> &SyncFlushDeletedSubtreeTeardownExecutionDiagnosticForCanary {
        &self.deleted_subtree_teardown
    }

    fn post_passive_continuation(&self) -> &SyncFlushPostPassiveContinuationExecutionRecord {
        &self.post_passive_continuation
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary {
    MissingPendingPassiveHandoff {
        root: FiberRootId,
        finished_work: FiberId,
    },
    StalePostPassiveContinuationEvidence {
        expected_root: FiberRootId,
        actual_root: FiberRootId,
        expected_finished_work: FiberId,
        actual_finished_work: FiberId,
        expected_lanes: Lanes,
        actual_lanes: Lanes,
    },
    DeletedSubtreeTeardown(SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary),
    SyncFlushContinuation(SyncFlushError),
    MissingPostPassiveContinuation {
        root: FiberRootId,
        finished_work: FiberId,
    },
    MissingFollowUpSyncFlush {
        root: FiberRootId,
        finished_work: FiberId,
    },
    UnexpectedContinuationRootCount {
        root: FiberRootId,
        expected: usize,
        actual: usize,
    },
    UnexpectedContinuationRoot {
        expected_root: FiberRootId,
        actual_root: FiberRootId,
    },
    UnexpectedContinuationLanes {
        root: FiberRootId,
        expected_lanes: Lanes,
        actual_lanes: Lanes,
    },
    UnexpectedFollowUpSyncFlushRecordCount {
        expected: usize,
        actual: usize,
    },
}

impl From<SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary>
    for SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary
{
    fn from(error: SyncFlushDeletedSubtreeTeardownExecutionErrorForCanary) -> Self {
        Self::DeletedSubtreeTeardown(error)
    }
}

impl From<SyncFlushError> for SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary {
    fn from(error: SyncFlushError) -> Self {
        Self::SyncFlushContinuation(error)
    }
}

#[allow(
    clippy::too_many_arguments,
    reason = "private canary composes sync-flush deletion teardown with post-passive continuation evidence"
)]
fn execute_sync_flush_deleted_subtree_teardown_and_post_passive_continuation_for_canary<E>(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    sync_flush_record: &SyncFlushRootRecord,
    sync_flush_diagnostics: SyncFlushRootHostOutputCommitDiagnosticsForCanary,
    sync_flush_request: crate::host_work::SyncFlushHostMutationExecutionRequestForCanary,
    deletion_handoff: &HostRootFinishedWorkCommitHandoffRecordForCanary,
    source_deletion_request: crate::host_work::TestHostRootDeletionTeardownExecutionRequestForCanary,
    deletion_request: crate::host_work::TestHostRootDeletionTeardownExecutionRequestForCanary,
    post_passive_handoff: PendingPassiveCommitHandoff,
    expected_continuation_root: FiberRootId,
    expected_continuation_lanes: Lanes,
    host_work: &mut HostWorkResult,
    executor: &mut E,
) -> Result<
    SyncFlushDeletedSubtreePostPassiveContinuationDiagnosticForCanary,
    SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary,
>
where
    E: DeletedSubtreeRefCleanupReturnExecutor + PassiveEffectDestroyCallbackExecutor,
{
    let source_post_passive_handoff = sync_flush_record
        .commit()
        .pending_passive_handoff()
        .ok_or(
            SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary::MissingPendingPassiveHandoff {
                root: sync_flush_record.root(),
                finished_work: sync_flush_record.commit().finished_work(),
            },
        )?;
    if source_post_passive_handoff != post_passive_handoff {
        return Err(
            SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary::StalePostPassiveContinuationEvidence {
                expected_root: source_post_passive_handoff.root(),
                actual_root: post_passive_handoff.root(),
                expected_finished_work: source_post_passive_handoff.finished_work(),
                actual_finished_work: post_passive_handoff.finished_work(),
                expected_lanes: source_post_passive_handoff.lanes(),
                actual_lanes: post_passive_handoff.lanes(),
            },
        );
    }

    let deleted_subtree_teardown = execute_sync_flush_deleted_subtree_teardown_for_canary(
        store,
        host,
        sync_flush_record,
        sync_flush_diagnostics,
        sync_flush_request,
        deletion_handoff,
        source_deletion_request,
        deletion_request,
        host_work,
        executor,
    )?;

    let post_passive_continuation = flush_sync_post_passive_continuation_after_passive_effects(
        store,
        &ExecutionContextState::new(),
        Some(post_passive_handoff),
    )?
    .ok_or(
        SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary::MissingPostPassiveContinuation {
            root: sync_flush_request.root(),
            finished_work: sync_flush_request.finished_work(),
        },
    )?;

    if !post_passive_continuation.did_request_follow_up_sync_flush()
        || !post_passive_continuation.did_execute_follow_up_sync_flush()
    {
        return Err(
            SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary::MissingFollowUpSyncFlush {
                root: sync_flush_request.root(),
                finished_work: sync_flush_request.finished_work(),
            },
        );
    }

    let gate = post_passive_continuation.gate();
    if gate.pending_passive_root() != sync_flush_request.root()
        || gate.pending_passive_finished_work() != sync_flush_request.finished_work()
        || gate.pending_passive_lanes() != sync_flush_request.finished_lanes()
    {
        return Err(
            SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary::StalePostPassiveContinuationEvidence {
                expected_root: sync_flush_request.root(),
                actual_root: gate.pending_passive_root(),
                expected_finished_work: sync_flush_request.finished_work(),
                actual_finished_work: gate.pending_passive_finished_work(),
                expected_lanes: sync_flush_request.finished_lanes(),
                actual_lanes: gate.pending_passive_lanes(),
            },
        );
    }

    if gate.continuation_roots().len() != 1 {
        return Err(
            SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary::UnexpectedContinuationRootCount {
                root: sync_flush_request.root(),
                expected: 1,
                actual: gate.continuation_roots().len(),
            },
        );
    }

    let continuation_root = gate.continuation_roots()[0];
    if continuation_root.root() != expected_continuation_root {
        return Err(
            SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary::UnexpectedContinuationRoot {
                expected_root: expected_continuation_root,
                actual_root: continuation_root.root(),
            },
        );
    }

    if continuation_root.lanes() != expected_continuation_lanes {
        return Err(
            SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary::UnexpectedContinuationLanes {
                root: expected_continuation_root,
                expected_lanes: expected_continuation_lanes,
                actual_lanes: continuation_root.lanes(),
            },
        );
    }

    let sync_flush_result = post_passive_continuation.sync_flush_result().ok_or(
        SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary::MissingFollowUpSyncFlush {
            root: sync_flush_request.root(),
            finished_work: sync_flush_request.finished_work(),
        },
    )?;
    if sync_flush_result.records().len() != 1 {
        return Err(
            SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary::UnexpectedFollowUpSyncFlushRecordCount {
                expected: 1,
                actual: sync_flush_result.records().len(),
            },
        );
    }

    let sync_flush_record = &sync_flush_result.records()[0];
    if sync_flush_record.root() != expected_continuation_root {
        return Err(
            SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary::UnexpectedContinuationRoot {
                expected_root: expected_continuation_root,
                actual_root: sync_flush_record.root(),
            },
        );
    }

    if sync_flush_record.render_lanes() != expected_continuation_lanes {
        return Err(
            SyncFlushDeletedSubtreePostPassiveContinuationErrorForCanary::UnexpectedContinuationLanes {
                root: expected_continuation_root,
                expected_lanes: expected_continuation_lanes,
                actual_lanes: sync_flush_record.render_lanes(),
            },
        );
    }

    Ok(
        SyncFlushDeletedSubtreePostPassiveContinuationDiagnosticForCanary {
            deleted_subtree_teardown,
            post_passive_continuation,
        },
    )
}

fn root_callback_error(raw: u64) -> RootUpdateCallbackInvocationErrorHandle {
    RootUpdateCallbackInvocationErrorHandle::from_raw(raw)
}

#[derive(Default)]
struct TestRootUpdateCallbackControl {
    calls: Vec<RootUpdateCallbackInvocationRequest>,
    results: Vec<(
        RootUpdateCallbackHandle,
        Result<(), RootUpdateCallbackInvocationErrorHandle>,
    )>,
}

impl TestRootUpdateCallbackControl {
    fn with_result(
        mut self,
        callback: RootUpdateCallbackHandle,
        result: Result<(), RootUpdateCallbackInvocationErrorHandle>,
    ) -> Self {
        self.results.push((callback, result));
        self
    }

    fn calls(&self) -> &[RootUpdateCallbackInvocationRequest] {
        &self.calls
    }

    fn result(
        &self,
        callback: RootUpdateCallbackHandle,
    ) -> Result<(), RootUpdateCallbackInvocationErrorHandle> {
        self.results
            .iter()
            .find(|(accepted, _)| *accepted == callback)
            .map_or(Ok(()), |(_, result)| *result)
    }
}

impl RootUpdateCallbackInvocationTestControl for TestRootUpdateCallbackControl {
    fn invoke_root_update_callback(
        &mut self,
        request: RootUpdateCallbackInvocationRequest,
    ) -> Result<(), RootUpdateCallbackInvocationErrorHandle> {
        self.calls.push(request);
        self.result(request.callback())
    }
}
