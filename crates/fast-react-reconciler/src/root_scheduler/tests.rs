use super::*;
use crate::RootOptions;
use crate::begin_work::{
    BeginWorkRequest, UnsupportedSuspenseChildShapeRecord, UnsupportedThenableRetryQueueKind,
    unsupported_suspense_begin_work_record,
};
use crate::root_config::PendingPassiveUnmountOrigin;
use crate::root_updates::{
    HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary,
    HostRootUpdateQueueLaneHandoffErrorForCanary, HostRootUpdateQueueLaneHandoffRecordForCanary,
    HostRootUpdateQueueLaneHandoffUpdateRecordForCanary,
    host_root_update_queue_lane_handoff_for_canary, update_container_transition_for_canary,
};
use crate::test_support::{FakeContainer, RecordingHost};
use crate::{
    RootElementHandle, RootErrorCallbackHandle, RootRecoverableErrorCallbackHandle,
    RootUpdatePayload, SchedulerActQueueTaskKind, TestRendererHostOutputCanaryFixture,
    commit_finished_host_root, finish_test_renderer_host_output_canary_fibers,
    prepare_test_renderer_host_output_canary_fibers, update_container, update_container_sync,
};
use fast_react_core::{
    FiberMode, FiberTag, Lanes, PropsHandle, ReactKey, RootFinishedLanes, RootLaneState,
    UpdateQueueHandle,
};

fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let root_id = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    (store, root_id, host)
}

fn schedule_default_update(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
) -> ScheduledRootUpdateResult {
    let result = update_container(store, root_id, RootElementHandle::from_raw(1), None).unwrap();
    ensure_root_is_scheduled(store, result.schedule()).unwrap()
}

fn activate_act_queue(store: &mut FiberRootStore<RecordingHost>) {
    store.scheduler_bridge_mut().set_act_queue_active(true);
}

#[test]
fn root_scheduler_transition_private_event_lane_stays_out_of_public_state_observers() {
    let mut scheduler = RootSchedulerState::new();
    let baseline = scheduler.clone();
    scheduler.set_current_event_transition_lane(Lane::TRANSITION_1);

    assert_eq!(
        scheduler.current_event_transition_lane(),
        Lane::TRANSITION_1
    );
    assert_eq!(baseline.current_event_transition_lane(), Lane::NO);
    assert_eq!(scheduler, baseline);

    let debug = format!("{scheduler:?}");
    assert!(debug.contains("RootSchedulerState"));
    assert!(debug.contains("first_scheduled_root"));
    assert!(!debug.contains("current_event_transition_lane"));
    assert!(!debug.contains(&format!("{:?}", Lane::TRANSITION_1)));
}

#[test]
fn root_scheduler_transition_public_root_store_api_cannot_observe_current_event_lane() {
    use std::path::PathBuf;
    use std::process::Command;
    use std::time::{SystemTime, UNIX_EPOCH};

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let workspace_crates = manifest_dir
        .parent()
        .expect("reconciler crate should live under workspace crates directory");
    let host_config_dir = workspace_crates.join("fast-react-host-config");
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system time should be after unix epoch")
        .as_nanos();
    let temp_root = std::env::temp_dir().join(format!(
        "fast-react-root-scheduler-public-lane-probe-{}-{nonce}",
        std::process::id()
    ));
    let src_dir = temp_root.join("src");
    std::fs::create_dir_all(&src_dir).expect("public API probe src dir should be writable");

    let manifest = format!(
        r#"[package]
name = "fast-react-root-scheduler-public-lane-probe"
version = "0.0.0"
edition = "2024"

[dependencies]
fast-react-host-config = {{ path = "{}" }}
fast-react-reconciler = {{ path = "{}" }}
"#,
        host_config_dir.display(),
        manifest_dir.display()
    );
    std::fs::write(temp_root.join("Cargo.toml"), manifest)
        .expect("public API probe manifest should be writable");

    let public_prelude = r#"
use fast_react_host_config::HostTypes;
use fast_react_reconciler::{FiberRootStore, RootSchedulerState};

struct Host;

impl HostTypes for Host {
    type HostFiberToken = ();
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
"#;
    let debug_probe = format!(
        r#"{public_prelude}
fn main() {{
    let store = FiberRootStore::<Host>::new();
    let root_store_debug = format!("{{:?}}", store.root_scheduler());
    assert!(root_store_debug.contains("RootSchedulerState"));
    assert!(!root_store_debug.contains("current_event_transition_lane"));

    let scheduler_debug = format!("{{:?}}", RootSchedulerState::new());
    assert!(scheduler_debug.contains("RootSchedulerState"));
    assert!(!scheduler_debug.contains("current_event_transition_lane"));
}}
"#
    );
    std::fs::write(src_dir.join("main.rs"), debug_probe)
        .expect("public API debug probe should be writable");

    let cargo = std::env::var_os("CARGO").unwrap_or_else(|| "cargo".into());
    let target_dir = temp_root.join("target");
    let debug_output = Command::new(&cargo)
        .arg("run")
        .arg("--quiet")
        .arg("--target-dir")
        .arg(&target_dir)
        .current_dir(&temp_root)
        .output()
        .expect("public API debug probe should run cargo");
    assert!(
        debug_output.status.success(),
        "public API debug probe failed\nstdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&debug_output.stdout),
        String::from_utf8_lossy(&debug_output.stderr)
    );

    let getter_probe = format!(
        r#"{public_prelude}
fn read_direct_scheduler() {{
    let scheduler = RootSchedulerState::new();
    let _lane = scheduler.current_event_transition_lane();
}}

fn read_root_store_scheduler() {{
    let store = FiberRootStore::<Host>::new();
    let _lane = store.root_scheduler().current_event_transition_lane();
}}

fn main() {{}}
"#
    );
    std::fs::write(src_dir.join("main.rs"), getter_probe)
        .expect("public API getter probe should be writable");

    let check_output = Command::new(&cargo)
        .arg("check")
        .arg("--quiet")
        .arg("--target-dir")
        .arg(&target_dir)
        .current_dir(&temp_root)
        .output()
        .expect("public API getter probe should run cargo");
    assert!(
        !check_output.status.success(),
        "public API getter probe unexpectedly compiled\nstdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&check_output.stdout),
        String::from_utf8_lossy(&check_output.stderr)
    );

    let stderr = String::from_utf8_lossy(&check_output.stderr);
    assert!(
        stderr.matches("current_event_transition_lane").count() >= 2,
        "public API getter probe did not reject both exported scheduler paths\nstderr:\n{stderr}"
    );
    assert!(
        stderr.contains("private")
            || stderr.contains("E0624")
            || stderr.contains("no method named"),
        "public API getter probe failed for an unexpected reason\nstderr:\n{stderr}"
    );

    std::fs::remove_dir_all(&temp_root).expect("public API probe temp dir should be removable");
}

#[test]
fn root_scheduler_recovery_snapshot_preserves_reentry_guard_callback_metadata() {
    let (mut store, root_id, host) = root_store();
    schedule_default_update(&mut store, root_id);
    let processed = process_root_schedule_in_microtask(&mut store).unwrap();
    let scheduled = processed.records()[0];
    assert_eq!(scheduled.outcome(), RootTaskScheduleOutcome::Scheduled);
    let callback_node = store.root(root_id).unwrap().scheduling().callback_node();
    let callback_priority = store
        .root(root_id)
        .unwrap()
        .scheduling()
        .callback_priority();

    let before =
        sync_flush_root_recovery_snapshot_for_canary(&store, root_id, Lanes::DEFAULT).unwrap();
    store.root_scheduler_mut().set_is_flushing_work(true);
    let guarded =
        sync_flush_root_recovery_snapshot_for_canary(&store, root_id, Lanes::DEFAULT).unwrap();
    store.root_scheduler_mut().set_is_flushing_work(false);

    assert_eq!(before.root(), root_id);
    assert_eq!(before.selected_lanes(), Lanes::DEFAULT);
    assert_eq!(before.pending_lanes(), Lanes::DEFAULT);
    assert_eq!(before.callback_node(), callback_node);
    assert_eq!(before.callback_priority(), callback_priority);
    assert_eq!(before.render_phase_work(), None);
    assert_eq!(before.render_phase_lanes(), Lanes::NO);
    assert_eq!(before.render_exit_status(), RootRenderExitStatus::NoWork);
    assert!(!before.is_flushing_work());
    assert!(guarded.is_flushing_work());
    assert!(guarded.preserves_lane_and_callback_metadata_from(before));
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

fn scheduled_callback_request(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
) -> SchedulerCallbackRequest {
    schedule_default_update(store, root_id);
    let processed = process_root_schedule_in_microtask(store).unwrap();

    assert_eq!(
        processed.records()[0].outcome(),
        RootTaskScheduleOutcome::Scheduled
    );
    store.scheduler_bridge().callback_requests()[0]
}

fn mark_default_suspended_with_pending_transition(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
) {
    let lanes = store.root_mut(root_id).unwrap().lanes_mut();
    lanes.mark_updated(Lane::TRANSITION_1);
    lanes.mark_suspended(Lanes::DEFAULT, Lane::NO, true);
}

fn schedule_sync_update(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    element: RootElementHandle,
) -> ScheduledRootUpdateResult {
    let result = update_container_sync(store, root_id, element, None).unwrap();
    ensure_root_is_scheduled(store, result.schedule()).unwrap()
}

fn sync_queue_lane_scheduler_handoff(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    element: RootElementHandle,
) -> (
    UpdateContainerResult,
    RootSyncFlushRecord,
    HostRootUpdateQueueLaneHandoffRecordForCanary,
) {
    let accepted = update_container_sync(store, root_id, element, None).unwrap();
    ensure_root_is_scheduled(store, accepted.schedule()).unwrap();
    let rendered = flush_sync_work_on_all_roots(store, &ExecutionContextState::new()).unwrap();
    assert_eq!(rendered.records().len(), 1);
    let handoff = rendered.records()[0];
    let queue_handoff = host_root_update_queue_lane_handoff_for_canary(
        store,
        root_id,
        std::slice::from_ref(&accepted),
        handoff.render_phase(),
    )
    .unwrap();

    (accepted, handoff, queue_handoff)
}

fn transition_queue_lane_scheduler_handoff(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    lane: Lane,
    element: RootElementHandle,
) -> (
    UpdateContainerResult,
    RootTransitionLaneSchedulerRequestRecord,
    RootSchedulerCallbackExecutionRecord,
    HostRootUpdateQueueLaneHandoffRecordForCanary,
) {
    let accepted =
        update_container_transition_for_canary(store, root_id, lane, element, None).unwrap();
    let request = record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(
        store, &accepted,
    )
    .unwrap();
    let processed = process_root_schedule_in_microtask(store).unwrap();
    assert_eq!(processed.records().len(), 1);
    assert_eq!(
        processed.records()[0].outcome(),
        RootTaskScheduleOutcome::Scheduled
    );
    let callback = store
        .scheduler_bridge()
        .callback_requests()
        .iter()
        .rev()
        .copied()
        .find(|callback| callback.root() == root_id)
        .unwrap();
    let execution = execute_scheduled_root_callback(store, callback).unwrap();
    assert_eq!(
        execution.status(),
        RootSchedulerCallbackExecutionStatus::Rendered
    );
    assert_eq!(execution.selected_lanes(), request.selected_next_lanes());
    let render = execution.render_phase().unwrap();
    let queue_handoff = host_root_update_queue_lane_handoff_for_canary(
        store,
        root_id,
        std::slice::from_ref(&accepted),
        render,
    )
    .unwrap();

    (accepted, request, execution, queue_handoff)
}

fn same_transition_exact_two_update_queue_lane_scheduler_handoff(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    lane: Lane,
    first_element: RootElementHandle,
    second_element: RootElementHandle,
) -> (
    UpdateContainerResult,
    UpdateContainerResult,
    [RootTransitionLaneSchedulerRequestRecord; 2],
    RootSchedulerCallbackExecutionRecord,
    HostRootUpdateQueueLaneHandoffRecordForCanary,
) {
    let first =
        update_container_transition_for_canary(store, root_id, lane, first_element, None).unwrap();
    let second =
        update_container_transition_for_canary(store, root_id, lane, second_element, None).unwrap();
    let first_request =
        record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(store, &first)
            .unwrap();
    let second_request =
        record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(store, &second)
            .unwrap();
    let requests = [first_request, second_request];
    let processed = process_root_schedule_in_microtask(store).unwrap();
    let scheduled_records = processed
        .records()
        .iter()
        .filter(|record| record.root() == root_id)
        .collect::<Vec<_>>();
    assert_eq!(scheduled_records.len(), 1);
    assert_eq!(
        scheduled_records[0].outcome(),
        RootTaskScheduleOutcome::Scheduled
    );
    assert!(processed.records().iter().all(|record| {
        record.root() == root_id || record.outcome() == RootTaskScheduleOutcome::NoWork
    }));
    let callback = store
        .scheduler_bridge()
        .callback_requests()
        .iter()
        .rev()
        .copied()
        .find(|callback| callback.root() == root_id)
        .unwrap();
    let execution = execute_scheduled_root_callback(store, callback).unwrap();
    assert_eq!(
        execution.status(),
        RootSchedulerCallbackExecutionStatus::Rendered
    );
    assert_eq!(
        execution.selected_lanes(),
        second_request.selected_next_lanes()
    );
    let render = execution.render_phase().unwrap();
    assert_eq!(render.applied_update_count(), 2);
    assert_eq!(render.skipped_update_count(), 0);
    let queue_handoff = host_root_update_queue_lane_handoff_for_canary(
        store,
        root_id,
        &[first.clone(), second.clone()],
        render,
    )
    .unwrap();

    (first, second, requests, execution, queue_handoff)
}

fn same_transition_multi_update_queue_lane_scheduler_handoff(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    lane: Lane,
    first_element: RootElementHandle,
    second_element: RootElementHandle,
    third_element: RootElementHandle,
) -> (
    UpdateContainerResult,
    UpdateContainerResult,
    UpdateContainerResult,
    [RootTransitionLaneSchedulerRequestRecord; 3],
    RootSchedulerCallbackExecutionRecord,
    HostRootUpdateQueueLaneHandoffRecordForCanary,
) {
    let first =
        update_container_transition_for_canary(store, root_id, lane, first_element, None).unwrap();
    let second =
        update_container_transition_for_canary(store, root_id, lane, second_element, None).unwrap();
    let third =
        update_container_transition_for_canary(store, root_id, lane, third_element, None).unwrap();
    let first_request =
        record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(store, &first)
            .unwrap();
    let second_request =
        record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(store, &second)
            .unwrap();
    let third_request =
        record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(store, &third)
            .unwrap();
    let requests = [first_request, second_request, third_request];
    let processed = process_root_schedule_in_microtask(store).unwrap();
    let scheduled_records = processed
        .records()
        .iter()
        .filter(|record| record.root() == root_id)
        .collect::<Vec<_>>();
    assert_eq!(scheduled_records.len(), 1);
    assert_eq!(
        scheduled_records[0].outcome(),
        RootTaskScheduleOutcome::Scheduled
    );
    assert!(processed.records().iter().all(|record| {
        record.root() == root_id || record.outcome() == RootTaskScheduleOutcome::NoWork
    }));
    let callback = store
        .scheduler_bridge()
        .callback_requests()
        .iter()
        .rev()
        .copied()
        .find(|callback| callback.root() == root_id)
        .unwrap();
    let execution = execute_scheduled_root_callback(store, callback).unwrap();
    assert_eq!(
        execution.status(),
        RootSchedulerCallbackExecutionStatus::Rendered
    );
    assert_eq!(
        execution.selected_lanes(),
        third_request.selected_next_lanes()
    );
    let render = execution.render_phase().unwrap();
    assert_eq!(render.applied_update_count(), 3);
    assert_eq!(render.skipped_update_count(), 0);
    let queue_handoff = host_root_update_queue_lane_handoff_for_canary(
        store,
        root_id,
        &[first.clone(), second.clone(), third.clone()],
        render,
    )
    .unwrap();

    (first, second, third, requests, execution, queue_handoff)
}

fn entangled_transition_queue_lane_scheduler_handoff(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    first_lane: Lane,
    second_lane: Lane,
    first_element: RootElementHandle,
    second_element: RootElementHandle,
) -> (
    UpdateContainerResult,
    UpdateContainerResult,
    RootEntangledTransitionLaneSchedulerRequestRecordForCanary,
    RootSchedulerCallbackExecutionRecord,
    HostRootUpdateQueueLaneHandoffRecordForCanary,
) {
    let first =
        update_container_transition_for_canary(store, root_id, first_lane, first_element, None)
            .unwrap();
    let second =
        update_container_transition_for_canary(store, root_id, second_lane, second_element, None)
            .unwrap();
    let request =
        record_entangled_transition_lane_scheduler_request_from_update_diagnostics_for_canary(
            store, &first, &second,
        )
        .unwrap();
    let processed = process_root_schedule_in_microtask(store).unwrap();
    assert_eq!(processed.records().len(), 1);
    assert_eq!(
        processed.records()[0].outcome(),
        RootTaskScheduleOutcome::Scheduled
    );
    let callback = store
        .scheduler_bridge()
        .callback_requests()
        .iter()
        .rev()
        .copied()
        .find(|callback| callback.root() == root_id)
        .unwrap();
    let execution = execute_scheduled_root_callback(store, callback).unwrap();
    assert_eq!(
        execution.status(),
        RootSchedulerCallbackExecutionStatus::Rendered
    );
    assert_eq!(execution.selected_lanes(), request.selected_lanes());
    let render = execution.render_phase().unwrap();
    let queue_handoff = host_root_update_queue_lane_handoff_for_canary(
        store,
        root_id,
        &[first.clone(), second.clone()],
        render,
    )
    .unwrap();

    (first, second, request, execution, queue_handoff)
}

fn expired_default_sync_queue_lane_scheduler_handoff(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    default_element: RootElementHandle,
    sync_element: RootElementHandle,
) -> (
    UpdateContainerResult,
    UpdateContainerResult,
    RootSyncFlushRecord,
    HostRootUpdateQueueLaneHandoffRecordForCanary,
) {
    let default_update = update_container(store, root_id, default_element, None).unwrap();
    ensure_root_is_scheduled(store, default_update.schedule()).unwrap();
    assert!(
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .set_expiration_time(Lane::DEFAULT, 10)
    );
    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_starved_lanes_as_expired(10);

    let sync_update = update_container_sync(store, root_id, sync_element, None).unwrap();
    ensure_root_is_scheduled(store, sync_update.schedule()).unwrap();
    let lane_selection = select_lanes_for_scheduled_task(store, root_id).unwrap();
    let selected_lanes = lane_selection.render_lanes();

    assert_eq!(
        lane_selection.priority_lanes(),
        Lanes::SYNC.merge(Lanes::DEFAULT)
    );
    assert_eq!(selected_lanes, Lanes::SYNC.merge(Lanes::DEFAULT));

    let render = render_host_root_for_lanes(store, root_id, selected_lanes).unwrap();
    let handoff = RootSyncFlushRecord {
        order: 0,
        root: root_id,
        lanes: selected_lanes,
        status: RootSyncFlushRecordStatus::RenderedAwaitingCommit,
        render_phase: render,
    };
    let queue_handoff = host_root_update_queue_lane_handoff_for_canary(
        store,
        root_id,
        &[default_update.clone(), sync_update.clone()],
        render,
    )
    .unwrap();
    record_root_finished_work_for_scheduler_handoff_for_canary(store, render).unwrap();

    (default_update, sync_update, handoff, queue_handoff)
}

fn clone_queue_lane_continuation_preserving_currentness_source(
    record: &RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary,
) -> RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary {
    RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary {
        handoff: record.handoff,
        requested_callback_node: record.requested_callback_node,
        current_callback_node: record.current_callback_node,
        selected_lanes: record.selected_lanes,
        pending_passive_blocker: record.pending_passive_blocker,
        finished_work_handoff_identity: record.finished_work_handoff_identity,
        status: record.status,
        queue_handoff: record.queue_handoff.clone(),
        queue_handoff_error: record.queue_handoff_error.clone(),
        queue_commit_handoff: record.queue_commit_handoff.clone(),
        commit: record.commit.clone(),
        currentness_source_token: record.currentness_source_token,
    }
}

fn clone_transition_queue_lane_continuation_preserving_currentness_source(
    record: &RootTransitionSchedulerQueueLaneContinuationRecordForCanary,
) -> RootTransitionSchedulerQueueLaneContinuationRecordForCanary {
    RootTransitionSchedulerQueueLaneContinuationRecordForCanary {
        request: record.request,
        callback_execution: record.callback_execution,
        current_callback_node: record.current_callback_node,
        current_event_transition_lane: record.current_event_transition_lane,
        root_current_before_continuation: record.root_current_before_continuation,
        root_pending_lanes_before_continuation: record.root_pending_lanes_before_continuation,
        root_entangled_lanes_before_continuation: record.root_entangled_lanes_before_continuation,
        finished_work_handoff_identity: record.finished_work_handoff_identity,
        status: record.status,
        queue_handoff: record.queue_handoff.clone(),
        queue_handoff_error: record.queue_handoff_error.clone(),
        queue_commit_handoff: record.queue_commit_handoff.clone(),
        commit: record.commit.clone(),
        source_metadata: record.source_metadata.clone(),
        currentness_source_token: record.currentness_source_token,
    }
}

fn clone_same_transition_multi_update_continuation_preserving_currentness_source(
    record: &RootTransitionSameLaneMultiUpdateQueueLaneContinuationRecordForCanary,
) -> RootTransitionSameLaneMultiUpdateQueueLaneContinuationRecordForCanary {
    RootTransitionSameLaneMultiUpdateQueueLaneContinuationRecordForCanary {
        requests: record.requests,
        callback_execution: record.callback_execution,
        current_callback_node: record.current_callback_node,
        current_event_transition_lane: record.current_event_transition_lane,
        root_current_before_continuation: record.root_current_before_continuation,
        root_pending_lanes_before_continuation: record.root_pending_lanes_before_continuation,
        root_entangled_lanes_before_continuation: record.root_entangled_lanes_before_continuation,
        finished_work_handoff_identity: record.finished_work_handoff_identity,
        status: record.status,
        queue_handoff: record.queue_handoff.clone(),
        queue_handoff_error: record.queue_handoff_error.clone(),
        root_commit_handoff: record.root_commit_handoff.clone(),
        commit: record.commit.clone(),
        source_metadata: record.source_metadata.clone(),
        currentness_source_token: record.currentness_source_token,
    }
}

fn clone_entangled_transition_queue_lane_continuation_preserving_currentness_source(
    record: &RootEntangledTransitionSchedulerQueueLaneContinuationRecordForCanary,
) -> RootEntangledTransitionSchedulerQueueLaneContinuationRecordForCanary {
    RootEntangledTransitionSchedulerQueueLaneContinuationRecordForCanary {
        request: record.request,
        callback_execution: record.callback_execution,
        current_callback_node: record.current_callback_node,
        current_event_transition_lane: record.current_event_transition_lane,
        root_current_before_continuation: record.root_current_before_continuation,
        root_pending_lanes_before_continuation: record.root_pending_lanes_before_continuation,
        root_entangled_lanes_before_continuation: record.root_entangled_lanes_before_continuation,
        finished_work_handoff_identity: record.finished_work_handoff_identity,
        status: record.status,
        queue_handoff: record.queue_handoff.clone(),
        queue_handoff_error: record.queue_handoff_error.clone(),
        queue_commit_handoff: record.queue_commit_handoff.clone(),
        commit: record.commit.clone(),
        source_metadata: record.source_metadata.clone(),
        currentness_source_token: record.currentness_source_token,
    }
}

fn assert_same_lane_multi_update_currentness_rejects_metadata_mismatch_without_consuming_source(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    continuation: &RootTransitionSameLaneMultiUpdateQueueLaneContinuationRecordForCanary,
    field: &'static str,
    pending_source_count: usize,
    consumed_source_count: usize,
    host: &RecordingHost,
) {
    assert!(continuation.currentness_source_token().is_some());
    assert!(!continuation.public_root_compatibility_claimed());
    assert!(!continuation.public_scheduler_timing_compatibility_claimed());
    assert!(!continuation.public_transition_hooks_compatibility_claimed());
    assert!(!continuation.public_act_compatibility_claimed());
    assert!(!continuation.react_dom_compatibility_claimed());
    assert!(!continuation.test_renderer_compatibility_claimed());
    assert!(!continuation.native_execution_compatibility_claimed());
    assert!(!continuation.package_compatibility_claimed());
    assert!(!continuation.renderer_compatibility_claimed());
    assert!(!continuation.executes_public_effects());
    assert_eq!(
        consume_transition_same_lane_multi_update_queue_lane_commit_currentness_for_canary(
            store,
            continuation,
        )
        .unwrap_err(),
        RootTransitionSameLaneMultiUpdateQueueLaneCommitCurrentnessErrorForCanary::TransitionWrapperMetadataMismatch {
            root: root_id,
            field
        }
    );
    assert_eq!(
        store
            .root_scheduler()
            .pending_finished_work_queue_lane_commit_currentness_source_count(),
        pending_source_count
    );
    assert_eq!(
        store
            .root_scheduler()
            .consumed_finished_work_queue_lane_commit_currentness_source_count(),
        consumed_source_count
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

fn assert_entangled_currentness_rejects_metadata_mismatch_without_consuming_source(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    continuation: &RootEntangledTransitionSchedulerQueueLaneContinuationRecordForCanary,
    field: &'static str,
    pending_source_count: usize,
    consumed_source_count: usize,
    host: &RecordingHost,
) {
    assert!(continuation.currentness_source_token().is_some());
    assert!(!continuation.public_root_compatibility_claimed());
    assert!(!continuation.public_scheduler_timing_compatibility_claimed());
    assert!(!continuation.public_transition_hooks_compatibility_claimed());
    assert!(!continuation.public_act_compatibility_claimed());
    assert!(!continuation.react_dom_compatibility_claimed());
    assert!(!continuation.test_renderer_compatibility_claimed());
    assert!(!continuation.native_execution_compatibility_claimed());
    assert!(!continuation.package_compatibility_claimed());
    assert!(!continuation.renderer_compatibility_claimed());
    assert!(!continuation.executes_public_effects());
    assert_eq!(
        consume_entangled_transition_queue_lane_commit_currentness_for_canary(store, continuation,)
            .unwrap_err(),
        RootEntangledTransitionQueueLaneCommitCurrentnessErrorForCanary::TransitionWrapperMetadataMismatch {
            root: root_id,
            field
        }
    );
    assert_eq!(
        store
            .root_scheduler()
            .pending_finished_work_queue_lane_commit_currentness_source_count(),
        pending_source_count
    );
    assert_eq!(
        store
            .root_scheduler()
            .consumed_finished_work_queue_lane_commit_currentness_source_count(),
        consumed_source_count
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct SameLaneMultiUpdateRejectionRootSnapshotForCanary {
    current: FiberId,
    callback_node: RootSchedulerCallbackHandle,
    pending_lanes: Lanes,
    entangled_lanes: Lanes,
    finished_work: Option<FiberId>,
    finished_lanes: Lanes,
    current_event_transition_lane: Lane,
    pending_currentness_sources: usize,
    consumed_currentness_sources: usize,
}

fn same_lane_multi_update_rejection_root_snapshot_for_canary(
    store: &FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
) -> SameLaneMultiUpdateRejectionRootSnapshotForCanary {
    let root = store.root(root_id).unwrap();
    SameLaneMultiUpdateRejectionRootSnapshotForCanary {
        current: root.current(),
        callback_node: root.scheduling().callback_node(),
        pending_lanes: root.lanes().pending_lanes(),
        entangled_lanes: root.lanes().entangled_lanes(),
        finished_work: root.finished_work(),
        finished_lanes: root.finished_lanes(),
        current_event_transition_lane: store.root_scheduler().current_event_transition_lane(),
        pending_currentness_sources: store
            .root_scheduler()
            .pending_finished_work_queue_lane_commit_currentness_source_count(),
        consumed_currentness_sources: store
            .root_scheduler()
            .consumed_finished_work_queue_lane_commit_currentness_source_count(),
    }
}

fn assert_same_lane_multi_update_early_rejection_preserves_root_for_canary(
    store: &FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    before: SameLaneMultiUpdateRejectionRootSnapshotForCanary,
    rejection: &RootTransitionSameLaneMultiUpdateQueueLaneContinuationRecordForCanary,
    host: &RecordingHost,
) {
    assert_eq!(
        same_lane_multi_update_rejection_root_snapshot_for_canary(store, root_id),
        before
    );
    assert!(rejection.queue_handoff_error().is_none());
    assert!(rejection.root_commit_handoff_for_canary().is_none());
    assert!(rejection.commit().is_none());
    assert_eq!(rejection.currentness_source_token(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

fn attach_function_component_child(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    props: PropsHandle,
) -> FiberId {
    let host_root = store.root(root_id).unwrap().current();
    let function = store.fiber_arena_mut().create_fiber(
        FiberTag::FunctionComponent,
        None,
        props,
        FiberMode::NO,
    );
    store
        .fiber_arena_mut()
        .set_children(host_root, &[function])
        .unwrap();
    function
}

fn attach_suspense_retry_boundary(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    render_lanes: Lanes,
    boundary_retry_queue: UpdateQueueHandle,
    primary_offscreen_retry_queue: Option<UpdateQueueHandle>,
) -> UnsupportedSuspenseChildShapeRecord {
    let host_root = store.root(root_id).unwrap().current();
    let suspense = store.fiber_arena_mut().create_fiber(
        FiberTag::Suspense,
        Some(ReactKey::from_normalized("retry-boundary")),
        PropsHandle::from_raw(901),
        FiberMode::NO,
    );
    store
        .fiber_arena_mut()
        .get_mut(suspense)
        .unwrap()
        .set_update_queue(boundary_retry_queue);
    let primary = store.fiber_arena_mut().create_fiber(
        FiberTag::Offscreen,
        None,
        PropsHandle::from_raw(902),
        FiberMode::NO,
    );
    if let Some(queue) = primary_offscreen_retry_queue {
        store
            .fiber_arena_mut()
            .get_mut(primary)
            .unwrap()
            .set_update_queue(queue);
    }
    let primary_child = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(903),
        FiberMode::NO,
    );
    let fallback = store.fiber_arena_mut().create_fiber(
        FiberTag::Fragment,
        None,
        PropsHandle::from_raw(904),
        FiberMode::NO,
    );
    let fallback_child = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(905),
        FiberMode::NO,
    );

    store
        .fiber_arena_mut()
        .set_children(primary, &[primary_child])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(fallback, &[fallback_child])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(suspense, &[primary, fallback])
        .unwrap();
    store
        .fiber_arena_mut()
        .set_children(host_root, &[suspense])
        .unwrap();

    unsupported_suspense_begin_work_record(
        store.fiber_arena(),
        BeginWorkRequest::new(suspense, render_lanes),
    )
    .unwrap()
}

fn mark_suspended_lane(
    store: &mut FiberRootStore<RecordingHost>,
    root_id: FiberRootId,
    lane: Lane,
) {
    let lanes = store.root_mut(root_id).unwrap().lanes_mut();
    lanes.mark_updated(lane);
    lanes.mark_suspended(Lanes::from(lane), Lane::NO, true);
}

#[test]
fn root_scheduler_inserts_first_scheduled_root_and_requests_microtask() {
    let (mut store, root_id, _host) = root_store();

    let scheduled = schedule_default_update(&mut store, root_id);

    assert_eq!(scheduled.root(), root_id);
    assert!(scheduled.inserted());
    assert!(scheduled.microtask().is_some());
    assert_eq!(scheduled_roots(&store).unwrap(), vec![root_id]);
    assert_eq!(store.root_scheduler().first_scheduled_root(), Some(root_id));
    assert_eq!(store.root_scheduler().last_scheduled_root(), Some(root_id));
    assert!(store.root_scheduler().did_schedule_microtask());
    assert!(!store.root_scheduler().did_schedule_microtask_act());
    assert_eq!(store.scheduler_bridge().microtask_requests().len(), 1);
    assert!(store.scheduler_bridge().act_queue_requests().is_empty());
}

#[test]
fn root_scheduler_reschedules_function_component_source_after_lane_mark() {
    let (mut store, root_id, _host) = root_store();
    let function = attach_function_component_child(&mut store, root_id, PropsHandle::from_raw(201));
    let marked_root =
        crate::mark_update_lane_from_fiber_to_root(&mut store, function, Lane::DEFAULT).unwrap();
    let request = RootRescheduleRequestRecord::new(marked_root, function, Lane::DEFAULT);

    let scheduled = ensure_root_is_rescheduled(&mut store, request).unwrap();

    assert_eq!(request.root(), root_id);
    assert_eq!(request.fiber(), function);
    assert_eq!(request.lane(), Lane::DEFAULT);
    assert_eq!(scheduled.root(), root_id);
    assert!(scheduled.inserted());
    assert!(scheduled.microtask().is_some());
    assert_eq!(scheduled_roots(&store).unwrap(), vec![root_id]);
    assert!(
        store
            .root(root_id)
            .unwrap()
            .lanes()
            .pending_lanes()
            .contains_lane(Lane::DEFAULT)
    );
}

#[test]
fn root_scheduler_dedupes_same_root_schedule_entries() {
    let (mut store, root_id, _host) = root_store();

    let first = schedule_default_update(&mut store, root_id);
    let second = schedule_default_update(&mut store, root_id);

    assert!(first.inserted());
    assert!(!second.inserted());
    assert_eq!(second.microtask(), None);
    assert_eq!(scheduled_roots(&store).unwrap(), vec![root_id]);
    assert_eq!(store.scheduler_bridge().microtask_requests().len(), 1);
}

#[test]
fn root_scheduler_routes_root_schedule_tasks_to_act_queue() {
    let (mut store, root_id, _host) = root_store();
    activate_act_queue(&mut store);

    let first = schedule_default_update(&mut store, root_id);
    let second = schedule_default_update(&mut store, root_id);

    let act_task = first.act_queue_task().unwrap();
    assert_eq!(first.microtask(), None);
    assert_eq!(second.act_queue_task(), None);
    assert_eq!(act_task.kind(), SchedulerActQueueTaskKind::RootSchedule);
    assert_eq!(act_task.node(), RootSchedulerCallbackHandle::NONE);
    assert!(store.root_scheduler().did_schedule_microtask_act());
    assert!(!store.root_scheduler().did_schedule_microtask());
    assert!(store.scheduler_bridge().microtask_requests().is_empty());
    assert_eq!(store.scheduler_bridge().act_queue_requests(), &[act_task]);
}

#[test]
fn root_scheduler_records_transition_lane_request_without_callback_execution() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let result = update_container_transition_for_canary(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(5661),
        None,
    )
    .unwrap();

    let record = record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(
        &mut store, &result,
    )
    .unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(record.fiber(), current);
    assert_eq!(record.update(), result.update());
    assert_eq!(record.queue(), result.queue());
    assert_eq!(record.lane(), Lane::TRANSITION_1);
    assert_eq!(record.event_priority(), EventPriority::DEFAULT);
    assert_eq!(record.pending_lanes_before_enqueue(), Lanes::NO);
    assert_eq!(
        record.pending_lanes_after_enqueue(),
        Lanes::from(Lane::TRANSITION_1)
    );
    assert_eq!(
        record.selected_next_lanes(),
        Lanes::from(Lane::TRANSITION_1)
    );
    assert_eq!(record.entangled_lanes(), Lanes::from(Lane::TRANSITION_1));
    assert_eq!(record.current_event_transition_lane_before(), Lane::NO);
    assert_eq!(
        record.current_event_transition_lane_after(),
        Lane::TRANSITION_1
    );
    assert!(record.routed_to_private_root_scheduler());
    assert!(record.callback_execution_blocked());
    assert!(record.public_update_scheduling_blocked());
    assert!(!record.public_scheduler_compatibility_claimed());

    let scheduled = record.scheduled_root();
    assert_eq!(scheduled.root(), root_id);
    assert!(scheduled.inserted());
    assert!(scheduled.microtask().is_some());
    assert_eq!(scheduled.act_queue_task(), None);
    assert!(scheduled.might_have_pending_sync_work());
    assert_eq!(scheduled_roots(&store).unwrap(), vec![root_id]);
    assert_eq!(
        store.root_scheduler().current_event_transition_lane(),
        Lane::TRANSITION_1
    );
    assert!(store.root_scheduler().did_schedule_microtask());
    assert!(store.root_scheduler().might_have_pending_sync_work());
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert!(store.scheduler_bridge().act_queue_requests().is_empty());
    assert_eq!(store.scheduler_bridge().microtask_requests().len(), 1);
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_lane_request_rejects_unsupported_lane_sets() {
    let (mut store, root_id, _host) = root_store();
    let default =
        update_container(&mut store, root_id, RootElementHandle::from_raw(5662), None).unwrap();

    let default_error =
        record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(
            &mut store, &default,
        )
        .unwrap_err();
    assert_eq!(
        default_error,
        RootSchedulerError::TransitionSchedulerUnsupportedLane {
            root: root_id,
            lane: Lane::DEFAULT,
            source_priority: RootUpdateLaneSourcePriority::DefaultEventPriority,
            selected_lanes: Lanes::DEFAULT,
        }
    );

    let sync = update_container_sync(&mut store, root_id, RootElementHandle::from_raw(5663), None)
        .unwrap();
    let sync_error = record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(
        &mut store, &sync,
    )
    .unwrap_err();
    assert_eq!(
        sync_error,
        RootSchedulerError::TransitionSchedulerUnsupportedLane {
            root: root_id,
            lane: Lane::SYNC,
            source_priority: RootUpdateLaneSourcePriority::ExplicitSync,
            selected_lanes: Lanes::SYNC.merge(Lanes::DEFAULT),
        }
    );

    for (lane, selected_lanes) in [
        (Lane::DEFAULT, Lanes::DEFAULT),
        (Lane::SYNC, Lanes::SYNC),
        (Lane::OFFSCREEN, Lanes::OFFSCREEN),
        (
            Lane::TRANSITION_1,
            Lanes::from(Lane::TRANSITION_1).merge(Lanes::OFFSCREEN),
        ),
    ] {
        let error =
            validate_transition_lane_scheduler_lanes_for_canary(root_id, lane, selected_lanes)
                .unwrap_err();
        assert_eq!(
            error,
            RootSchedulerError::TransitionSchedulerUnsupportedLaneSet {
                root: root_id,
                lane,
                selected_lanes,
            }
        );
    }

    assert_eq!(store.root_scheduler().first_scheduled_root(), None);
    assert_eq!(store.root_scheduler().last_scheduled_root(), None);
    assert_eq!(
        store.root_scheduler().current_event_transition_lane(),
        Lane::NO
    );
    assert!(!store.root_scheduler().did_schedule_microtask());
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert!(store.scheduler_bridge().act_queue_requests().is_empty());
    assert!(store.scheduler_bridge().microtask_requests().is_empty());
}

#[test]
fn root_scheduler_transition_lane_request_rejects_stale_update_diagnostics() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let result = update_container_transition_for_canary(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(5664),
        None,
    )
    .unwrap();
    let render =
        render_host_root_for_lanes(&mut store, root_id, Lanes::from(Lane::TRANSITION_1)).unwrap();

    let error = record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(
        &mut store, &result,
    )
    .unwrap_err();

    assert_eq!(render.applied_update_count(), 1);
    assert_eq!(
        error,
        RootSchedulerError::RootUpdate(RootUpdateError::StaleQueueEvidence {
            root: root_id,
            queue: result.queue(),
            update: result.update(),
            expected_pending_lanes: Lanes::from(Lane::TRANSITION_1),
            actual_pending_lanes: Lanes::from(Lane::TRANSITION_1),
        })
    );
    assert_eq!(store.root_scheduler().first_scheduled_root(), None);
    assert_eq!(store.root_scheduler().last_scheduled_root(), None);
    assert_eq!(
        store.root_scheduler().current_event_transition_lane(),
        Lane::NO
    );
    assert!(store.scheduler_bridge().microtask_requests().is_empty());
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert!(store.scheduler_bridge().act_queue_requests().is_empty());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_lane_request_rejects_incompatible_event_lane() {
    let (mut store, root_id, _host) = root_store();
    let result = update_container_transition_for_canary(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(5665),
        None,
    )
    .unwrap();
    store
        .root_scheduler_mut()
        .set_current_event_transition_lane(Lane::TRANSITION_2);

    let error = record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(
        &mut store, &result,
    )
    .unwrap_err();

    assert_eq!(
        error,
        RootSchedulerError::TransitionSchedulerIncompatibleEventLane {
            root: root_id,
            requested_lane: Lane::TRANSITION_1,
            current_event_transition_lane: Lane::TRANSITION_2,
        }
    );
    assert_eq!(store.root_scheduler().first_scheduled_root(), None);
    assert_eq!(store.root_scheduler().last_scheduled_root(), None);
    assert_eq!(
        store.root_scheduler().current_event_transition_lane(),
        Lane::TRANSITION_2
    );
    assert!(!store.root_scheduler().did_schedule_microtask());
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert!(store.scheduler_bridge().act_queue_requests().is_empty());
    assert!(store.scheduler_bridge().microtask_requests().is_empty());
}

#[test]
fn root_scheduler_transition_queue_lane_continuation_accepts_entangled_handoff() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (accepted, request, execution, queue_handoff) = transition_queue_lane_scheduler_handoff(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(9091),
    );
    let render = execution.render_phase().unwrap();

    let continuation = execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        request,
        execution,
        Some(&queue_handoff),
    )
    .unwrap();

    assert_eq!(
        continuation.status(),
        RootTransitionSchedulerQueueLaneContinuationStatusForCanary::RenderedAndCommitted
    );
    assert_eq!(continuation.request(), request);
    assert_eq!(continuation.root(), root_id);
    assert_eq!(continuation.callback_execution(), execution);
    assert_eq!(continuation.callback_node(), execution.callback_node());
    assert_eq!(
        continuation.current_callback_node(),
        execution.callback_node()
    );
    assert_eq!(
        continuation.selected_lanes(),
        Lanes::from(Lane::TRANSITION_1)
    );
    assert_eq!(
        continuation.current_event_transition_lane(),
        Lane::TRANSITION_1
    );
    assert_eq!(continuation.root_current_before_continuation(), current);
    assert_eq!(
        continuation.root_pending_lanes_before_continuation(),
        Lanes::from(Lane::TRANSITION_1)
    );
    assert_eq!(
        continuation.root_entangled_lanes_before_continuation(),
        Lanes::from(Lane::TRANSITION_1)
    );
    assert!(continuation.did_execute_transition_queue_lane_scheduler_continuation());
    assert!(continuation.accepted_transition_scheduler_evidence_for_canary());
    assert!(continuation.accepted_root_scheduler_execution_evidence_for_canary());
    assert!(continuation.accepted_root_commit_execution_evidence_for_canary());
    assert!(continuation.accepted_queue_lane_handoff_evidence_for_canary());
    assert!(continuation.routed_through_transition_queue_lane_and_commit_evidence_for_canary());
    assert!(
        continuation
            .treats_transition_host_root_update_as_current_only_with_queue_lane_handoff_for_canary(
            )
    );
    assert!(continuation.async_callback_execution_blocked());
    assert!(continuation.public_update_scheduling_blocked());
    assert!(!continuation.public_root_compatibility_claimed());
    assert!(!continuation.public_scheduler_timing_compatibility_claimed());
    assert!(!continuation.public_transition_hooks_compatibility_claimed());
    assert!(!continuation.public_act_compatibility_claimed());
    assert!(!continuation.react_dom_compatibility_claimed());
    assert!(!continuation.test_renderer_compatibility_claimed());
    assert!(!continuation.package_compatibility_claimed());
    assert!(!continuation.renderer_compatibility_claimed());
    assert!(!continuation.executes_public_effects());

    let identity = continuation.finished_work_handoff_identity().unwrap();
    assert_eq!(identity.root(), root_id);
    assert_eq!(identity.render_phase_root(), root_id);
    assert_eq!(identity.previous_current(), current);
    assert_eq!(identity.current_before_commit(), current);
    assert_eq!(
        identity.pending_work_before_commit(),
        Some(render.finished_work())
    );
    assert_eq!(
        identity.root_finished_work_before_commit(),
        Some(render.finished_work())
    );
    assert_eq!(identity.finished_work(), render.finished_work());
    assert_eq!(identity.selected_lanes(), Lanes::from(Lane::TRANSITION_1));
    assert_eq!(identity.render_lanes(), Lanes::from(Lane::TRANSITION_1));
    assert_eq!(identity.finished_lanes(), Lanes::from(Lane::TRANSITION_1));
    assert_eq!(
        identity.root_finished_lanes_before_commit(),
        Lanes::from(Lane::TRANSITION_1)
    );
    assert_eq!(
        identity.pending_lanes_before_commit(),
        Lanes::from(Lane::TRANSITION_1)
    );
    assert!(identity.accepted_for_root_scheduler_commit_handoff());

    let queue_commit_handoff = continuation.queue_commit_handoff().unwrap();
    assert_eq!(queue_commit_handoff.queue_handoff(), &queue_handoff);
    assert_eq!(
        queue_commit_handoff.update_sequence_ids(),
        &[accepted.update()]
    );
    assert_eq!(
        queue_commit_handoff.selected_lanes(),
        Lanes::from(Lane::TRANSITION_1)
    );
    assert_eq!(
        queue_commit_handoff.finished_lanes(),
        Lanes::from(Lane::TRANSITION_1)
    );
    assert_eq!(queue_commit_handoff.remaining_lanes(), Lanes::NO);
    assert_eq!(queue_commit_handoff.applied_update_count(), 1);
    assert_eq!(queue_commit_handoff.skipped_update_count(), 0);
    assert_eq!(
        queue_commit_handoff.resulting_element(),
        RootElementHandle::from_raw(9091)
    );
    assert!(queue_commit_handoff.proves_queue_lane_handoff_gated_current_switch());

    let commit = continuation.commit().unwrap();
    assert_eq!(commit.root(), root_id);
    assert_eq!(commit.previous_current(), current);
    assert_eq!(commit.current(), render.finished_work());
    assert_eq!(commit.finished_work(), render.finished_work());
    assert_eq!(commit.finished_lanes(), Lanes::from(Lane::TRANSITION_1));
    assert_eq!(commit.remaining_lanes(), Lanes::NO);
    assert_eq!(commit.pending_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert!(!store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_same_lane_multi_update_queue_lane_continuation_accepts_source_owned_exact_two_handoff()
 {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let first_element = RootElementHandle::from_raw(12201);
    let second_element = RootElementHandle::from_raw(12202);
    let (first, second, requests, execution, queue_handoff) =
        same_transition_exact_two_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            first_element,
            second_element,
        );
    let render = execution.render_phase().unwrap();

    let continuation =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&queue_handoff),
        )
        .unwrap();

    assert_eq!(
        continuation.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::RenderedAndCommitted
    );
    assert_eq!(
        continuation.requests(),
        RootTransitionSameLaneMultiUpdateRequestsForCanary::from(requests)
    );
    assert_eq!(continuation.request_count(), 2);
    assert_eq!(continuation.request_records(), &requests);
    assert_eq!(continuation.first_request().update(), first.update());
    assert_eq!(continuation.second_request().update(), second.update());
    assert_eq!(continuation.third_request(), None);
    assert_eq!(continuation.root(), root_id);
    assert_eq!(
        continuation.selected_lanes(),
        Lanes::from(Lane::TRANSITION_1)
    );
    assert_eq!(
        continuation.update_sequence_ids(),
        vec![first.update(), second.update()]
    );
    assert!(continuation.did_execute_same_lane_multi_update_queue_lane_scheduler_continuation());
    assert!(continuation.accepted_transition_scheduler_evidence_for_canary());
    assert!(continuation.accepted_root_scheduler_execution_evidence_for_canary());
    assert!(continuation.accepted_queue_lane_handoff_evidence_for_canary());
    assert!(
        continuation.routed_through_same_lane_multi_update_transition_queue_lane_and_commit_evidence_for_canary()
    );
    assert!(continuation.currentness_source_token().is_some());
    assert!(!continuation.public_root_compatibility_claimed());
    assert!(!continuation.public_scheduler_timing_compatibility_claimed());
    assert!(!continuation.public_transition_hooks_compatibility_claimed());
    assert!(!continuation.public_act_compatibility_claimed());
    assert!(!continuation.react_dom_compatibility_claimed());
    assert!(!continuation.test_renderer_compatibility_claimed());
    assert!(!continuation.native_execution_compatibility_claimed());
    assert!(!continuation.package_compatibility_claimed());
    assert!(!continuation.renderer_compatibility_claimed());
    assert!(!continuation.executes_public_effects());

    assert_eq!(continuation.queue_handoff(), Some(&queue_handoff));
    let root_commit_handoff = continuation.root_commit_handoff_for_canary().unwrap();
    assert!(root_commit_handoff.proves_private_root_finished_work_commit_metadata_handoff());
    let commit = continuation.commit().unwrap();
    assert_eq!(commit, root_commit_handoff.commit());
    assert_eq!(commit.root(), root_id);
    assert_eq!(commit.previous_current(), current);
    assert_eq!(commit.current(), render.finished_work());
    assert_eq!(commit.finished_work(), render.finished_work());
    assert_eq!(commit.finished_lanes(), Lanes::from(Lane::TRANSITION_1));
    assert_eq!(commit.remaining_lanes(), Lanes::NO);
    assert_eq!(commit.pending_lanes(), Lanes::NO);
    assert_eq!(render.resulting_element(), second_element);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert!(!store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_same_lane_multi_update_queue_lane_continuation_accepts_source_owned_exact_three_handoff()
 {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let first_element = RootElementHandle::from_raw(12203);
    let second_element = RootElementHandle::from_raw(12204);
    let third_element = RootElementHandle::from_raw(12205);
    let (first, second, third, requests, execution, queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            first_element,
            second_element,
            third_element,
        );
    let render = execution.render_phase().unwrap();

    let continuation =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&queue_handoff),
        )
        .unwrap();

    assert_eq!(
        continuation.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::RenderedAndCommitted
    );
    assert_eq!(
        continuation.requests(),
        RootTransitionSameLaneMultiUpdateRequestsForCanary::from(requests)
    );
    assert_eq!(continuation.request_count(), 3);
    assert_eq!(continuation.request_records(), &requests);
    assert_eq!(continuation.first_request().update(), first.update());
    assert_eq!(continuation.second_request().update(), second.update());
    assert_eq!(
        continuation.third_request().unwrap().update(),
        third.update()
    );
    assert_eq!(continuation.root(), root_id);
    assert_eq!(continuation.callback_node(), execution.callback_node());
    assert_eq!(
        continuation.current_callback_node(),
        execution.callback_node()
    );
    assert_eq!(
        continuation.selected_lanes(),
        Lanes::from(Lane::TRANSITION_1)
    );
    assert_eq!(
        continuation.update_sequence_ids(),
        vec![first.update(), second.update(), third.update()]
    );
    assert!(continuation.did_execute_same_lane_multi_update_queue_lane_scheduler_continuation());
    assert!(continuation.accepted_transition_scheduler_evidence_for_canary());
    assert!(continuation.accepted_root_scheduler_execution_evidence_for_canary());
    assert!(continuation.accepted_queue_lane_handoff_evidence_for_canary());
    assert!(
        continuation.routed_through_same_lane_multi_update_transition_queue_lane_and_commit_evidence_for_canary()
    );
    assert!(
        continuation
            .treats_same_lane_multi_update_transition_host_root_updates_as_current_only_with_queue_lane_handoff_for_canary()
    );
    assert!(continuation.currentness_source_token().is_some());
    assert!(!continuation.public_root_compatibility_claimed());
    assert!(!continuation.public_scheduler_timing_compatibility_claimed());
    assert!(!continuation.public_transition_hooks_compatibility_claimed());
    assert!(!continuation.public_act_compatibility_claimed());
    assert!(!continuation.react_dom_compatibility_claimed());
    assert!(!continuation.test_renderer_compatibility_claimed());
    assert!(!continuation.native_execution_compatibility_claimed());
    assert!(!continuation.package_compatibility_claimed());
    assert!(!continuation.renderer_compatibility_claimed());
    assert!(!continuation.executes_public_effects());

    assert_eq!(continuation.queue_handoff(), Some(&queue_handoff));
    let root_commit_handoff = continuation.root_commit_handoff_for_canary().unwrap();
    assert!(root_commit_handoff.proves_private_root_finished_work_commit_metadata_handoff());
    let commit = continuation.commit().unwrap();
    assert_eq!(commit, root_commit_handoff.commit());
    assert_eq!(commit.root(), root_id);
    assert_eq!(commit.previous_current(), current);
    assert_eq!(commit.current(), render.finished_work());
    assert_eq!(commit.finished_work(), render.finished_work());
    assert_eq!(commit.finished_lanes(), Lanes::from(Lane::TRANSITION_1));
    assert_eq!(commit.remaining_lanes(), Lanes::NO);
    assert_eq!(commit.pending_lanes(), Lanes::NO);
    assert_eq!(render.resulting_element(), third_element);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert!(!store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_same_lane_multi_update_queue_lane_continuation_rejects_live_same_lane_queue_staleness()
 {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_first, _second, _third, requests, execution, queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(12220),
            RootElementHandle::from_raw(12221),
            RootElementHandle::from_raw(12222),
        );
    let render = execution.render_phase().unwrap();
    let transition_lanes = Lanes::from(Lane::TRANSITION_1);

    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        transition_lanes
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().entangled_lanes(),
        transition_lanes
    );
    assert_eq!(queue_handoff.pending_lanes_after_render(), transition_lanes);
    assert_eq!(requests[1].selected_next_lanes(), transition_lanes);
    assert_eq!(requests[1].entangled_lanes(), transition_lanes);

    let stale_same_lane_update = store.update_queues_mut().create_update(Lane::TRANSITION_1);
    store
        .update_queues_mut()
        .update_mut(stale_same_lane_update)
        .unwrap()
        .set_payload(RootUpdatePayload::new(RootElementHandle::from_raw(12223)));
    store
        .update_queues_mut()
        .append_pending_update(queue_handoff.current_update_queue(), stale_same_lane_update)
        .unwrap();
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        queue_handoff.pending_lanes_after_render()
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().entangled_lanes(),
        requests[1].entangled_lanes()
    );
    assert_eq!(
        store.root_scheduler().current_event_transition_lane(),
        Lane::TRANSITION_1
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        execution.callback_node()
    );

    let rejection =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&queue_handoff),
        )
        .unwrap();

    assert_eq!(
        rejection.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
    );
    assert!(rejection.blocked_by_queue_lane_handoff());
    assert_eq!(
        rejection.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueLane(
                HostRootUpdateQueueLaneHandoffErrorForCanary::QueueOrderMismatch {
                    root: root_id,
                    queue: queue_handoff.current_update_queue(),
                    expected_updates: queue_handoff.current_queue_base_updates().to_vec(),
                    actual_updates: {
                        let mut updates = queue_handoff.current_queue_base_updates().to_vec();
                        updates.push(stale_same_lane_update);
                        updates
                    }
                }
            )
        )
    );
    assert!(rejection.root_commit_handoff_for_canary().is_none());
    assert!(rejection.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(
        store.root(root_id).unwrap().finished_work(),
        Some(render.finished_work())
    );
    assert_eq!(
        store
            .update_queues()
            .pending_updates(queue_handoff.current_update_queue())
            .unwrap(),
        vec![stale_same_lane_update]
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_same_lane_multi_update_queue_lane_continuation_rejects_cleared_pending_transition()
 {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_first, _second, _third, requests, execution, queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(122501),
            RootElementHandle::from_raw(122502),
            RootElementHandle::from_raw(122503),
        );
    let transition_lanes = Lanes::from(Lane::TRANSITION_1);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        transition_lanes
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().entangled_lanes(),
        transition_lanes
    );
    assert_eq!(
        store.root_scheduler().current_event_transition_lane(),
        Lane::TRANSITION_1
    );

    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_finished(RootFinishedLanes::new(transition_lanes, Lanes::NO));
    let before = same_lane_multi_update_rejection_root_snapshot_for_canary(&store, root_id);

    assert_eq!(before.current, current);
    assert_eq!(before.callback_node, execution.callback_node());
    assert_eq!(before.pending_lanes, Lanes::NO);
    assert_eq!(before.entangled_lanes, Lanes::NO);
    assert_eq!(before.finished_work, None);
    assert_eq!(before.finished_lanes, Lanes::NO);
    assert_eq!(before.current_event_transition_lane, Lane::TRANSITION_1);

    let rejection =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&queue_handoff),
        )
        .unwrap();

    assert_eq!(
        rejection.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::NoTransitionWork
    );
    assert!(rejection.no_transition_work());
    assert_eq!(rejection.root_current_before_continuation(), current);
    assert_eq!(
        rejection.root_pending_lanes_before_continuation(),
        Lanes::NO
    );
    assert_eq!(
        rejection.root_entangled_lanes_before_continuation(),
        Lanes::NO
    );
    assert_eq!(
        rejection.current_event_transition_lane(),
        Lane::TRANSITION_1
    );
    assert_eq!(rejection.queue_handoff(), Some(&queue_handoff));
    assert_same_lane_multi_update_early_rejection_preserves_root_for_canary(
        &store, root_id, before, &rejection, &host,
    );
}

#[test]
fn root_scheduler_transition_same_lane_multi_update_queue_lane_continuation_rejects_stale_event_transition_lane()
 {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_first, _second, _third, requests, execution, queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(122504),
            RootElementHandle::from_raw(122505),
            RootElementHandle::from_raw(122506),
        );
    let transition_lanes = Lanes::from(Lane::TRANSITION_1);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        transition_lanes
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().entangled_lanes(),
        transition_lanes
    );

    store
        .root_scheduler_mut()
        .set_current_event_transition_lane(Lane::NO);
    let before = same_lane_multi_update_rejection_root_snapshot_for_canary(&store, root_id);

    assert_eq!(before.current, current);
    assert_eq!(before.callback_node, execution.callback_node());
    assert_eq!(before.pending_lanes, transition_lanes);
    assert_eq!(before.entangled_lanes, transition_lanes);
    assert_eq!(before.finished_work, None);
    assert_eq!(before.finished_lanes, Lanes::NO);
    assert_eq!(before.current_event_transition_lane, Lane::NO);

    let rejection =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&queue_handoff),
        )
        .unwrap();

    assert_eq!(
        rejection.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::StaleTransitionDiagnostics
    );
    assert!(rejection.stale_transition_diagnostics());
    assert_eq!(rejection.root_current_before_continuation(), current);
    assert_eq!(
        rejection.root_pending_lanes_before_continuation(),
        transition_lanes
    );
    assert_eq!(
        rejection.root_entangled_lanes_before_continuation(),
        transition_lanes
    );
    assert_eq!(rejection.current_event_transition_lane(), Lane::NO);
    assert_eq!(rejection.queue_handoff(), Some(&queue_handoff));
    assert_same_lane_multi_update_early_rejection_preserves_root_for_canary(
        &store, root_id, before, &rejection, &host,
    );
}

#[test]
fn root_scheduler_transition_same_lane_multi_update_queue_lane_continuation_rejects_repending_without_entanglement()
 {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_first, _second, _third, requests, execution, queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(122507),
            RootElementHandle::from_raw(122508),
            RootElementHandle::from_raw(122509),
        );
    let transition_lanes = Lanes::from(Lane::TRANSITION_1);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        transition_lanes
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().entangled_lanes(),
        transition_lanes
    );

    {
        let lanes = store.root_mut(root_id).unwrap().lanes_mut();
        lanes.mark_finished(RootFinishedLanes::new(transition_lanes, Lanes::NO));
        lanes.mark_updated(Lane::TRANSITION_1);
    }
    let before = same_lane_multi_update_rejection_root_snapshot_for_canary(&store, root_id);

    assert_eq!(before.current, current);
    assert_eq!(before.callback_node, execution.callback_node());
    assert_eq!(before.pending_lanes, transition_lanes);
    assert_eq!(before.entangled_lanes, Lanes::NO);
    assert_eq!(before.finished_work, None);
    assert_eq!(before.finished_lanes, Lanes::NO);
    assert_eq!(before.current_event_transition_lane, Lane::TRANSITION_1);

    let rejection =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&queue_handoff),
        )
        .unwrap();

    assert_eq!(
        rejection.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::BlockedByTransitionEntanglementMismatch
    );
    assert!(rejection.blocked_by_transition_entanglement());
    assert_eq!(rejection.root_current_before_continuation(), current);
    assert_eq!(
        rejection.root_pending_lanes_before_continuation(),
        transition_lanes
    );
    assert_eq!(
        rejection.root_entangled_lanes_before_continuation(),
        Lanes::NO
    );
    assert_eq!(
        rejection.current_event_transition_lane(),
        Lane::TRANSITION_1
    );
    assert_eq!(rejection.queue_handoff(), Some(&queue_handoff));
    assert_same_lane_multi_update_early_rejection_preserves_root_for_canary(
        &store, root_id, before, &rejection, &host,
    );
}

#[test]
fn root_scheduler_transition_same_lane_multi_update_queue_lane_continuation_rejects_forged_update_sequences()
 {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (single_update, single_request, single_execution, single_queue_handoff) =
        transition_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(12205),
        );
    let single_exact_two_claim =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            [single_request, single_request],
            single_execution,
            Some(&single_queue_handoff),
        )
        .unwrap();
    assert_eq!(
        single_exact_two_claim.first_request().update(),
        single_update.update()
    );
    assert_eq!(
        single_exact_two_claim.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::BlockedByTransitionRequestMismatch
    );
    assert!(single_exact_two_claim.blocked_by_transition_request_mismatch());
    assert!(single_exact_two_claim.commit().is_none());

    let single_exact_three_claim =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            [single_request, single_request, single_request],
            single_execution,
            Some(&single_queue_handoff),
        )
        .unwrap();
    assert_eq!(
        single_exact_three_claim.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::BlockedByTransitionRequestMismatch
    );
    assert!(single_exact_three_claim.blocked_by_transition_request_mismatch());
    assert!(single_exact_three_claim.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());

    let (mut store, root_id, duplicate_host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (first, second, third, requests, execution, queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(12206),
            RootElementHandle::from_raw(12207),
            RootElementHandle::from_raw(12208),
        );
    let mut duplicate = queue_handoff.clone();
    duplicate.update_records[1].update = first.update();
    let duplicate_rejection =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&duplicate),
        )
        .unwrap();
    assert_eq!(
        duplicate_rejection.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
    );
    assert_eq!(
        duplicate_rejection.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueHandoffNotSourceOwned {
                root: root_id,
                queue: queue_handoff.current_update_queue(),
                expected_updates: vec![first.update(), second.update(), third.update()],
                actual_updates: vec![first.update(), first.update(), third.update()],
                records_in_sequence_order: true
            }
        )
    );
    assert!(duplicate_rejection.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(duplicate_host.operations(), Vec::<&'static str>::new());

    let (mut store, root_id, missing_host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (first, second, third, requests, execution, queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(12209),
            RootElementHandle::from_raw(12210),
            RootElementHandle::from_raw(12211),
        );
    let mut missing = queue_handoff.clone();
    missing.update_records.pop();
    let missing_rejection =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&missing),
        )
        .unwrap();
    assert_eq!(
        missing_rejection.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
    );
    assert_eq!(
        missing_rejection.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueHandoffNotSourceOwned {
                root: root_id,
                queue: queue_handoff.current_update_queue(),
                expected_updates: vec![first.update(), second.update(), third.update()],
                actual_updates: vec![first.update(), second.update()],
                records_in_sequence_order: true
            }
        )
    );
    assert!(missing_rejection.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(missing_host.operations(), Vec::<&'static str>::new());

    let (mut store, root_id, order_host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (first, second, third, requests, execution, queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(12212),
            RootElementHandle::from_raw(12213),
            RootElementHandle::from_raw(12214),
        );
    let mut reordered = queue_handoff.clone();
    reordered.update_records.swap(0, 1);
    let order_rejection =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&reordered),
        )
        .unwrap();
    assert_eq!(
        order_rejection.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
    );
    assert_eq!(
        order_rejection.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueHandoffNotSourceOwned {
                root: root_id,
                queue: queue_handoff.current_update_queue(),
                expected_updates: vec![first.update(), second.update(), third.update()],
                actual_updates: vec![second.update(), first.update(), third.update()],
                records_in_sequence_order: false
            }
        )
    );
    assert!(order_rejection.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(order_host.operations(), Vec::<&'static str>::new());

    let (mut store, root_id, fourth_host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (first, second, third, requests, execution, queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(12215),
            RootElementHandle::from_raw(12216),
            RootElementHandle::from_raw(12217),
        );
    let fourth = store.update_queues_mut().create_update(Lane::TRANSITION_1);
    store
        .update_queues_mut()
        .update_mut(fourth)
        .unwrap()
        .set_payload(RootUpdatePayload::new(RootElementHandle::from_raw(12218)));
    let mut forged_fourth = queue_handoff.clone();
    forged_fourth
        .update_records
        .push(HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
            sequence: 3,
            update: fourth,
            lane: Lane::TRANSITION_1,
            source_lanes: Lanes::from(Lane::TRANSITION_1),
            pending_lanes_after_enqueue: queue_handoff.pending_lanes_after_render(),
            selected_next_lanes_after_enqueue: queue_handoff.selected_next_lanes_before_render(),
        });
    let fourth_rejection =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&forged_fourth),
        )
        .unwrap();
    assert_eq!(
        fourth_rejection.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
    );
    assert_eq!(
        fourth_rejection.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueHandoffNotSourceOwned {
                root: root_id,
                queue: queue_handoff.current_update_queue(),
                expected_updates: vec![first.update(), second.update(), third.update()],
                actual_updates: vec![first.update(), second.update(), third.update(), fourth],
                records_in_sequence_order: true
            }
        )
    );
    assert!(fourth_rejection.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(fourth_host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_same_lane_multi_update_queue_lane_continuation_rejects_lane_counts_and_replay()
 {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_first, _second, _third, requests, execution, queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(12212),
            RootElementHandle::from_raw(12213),
            RootElementHandle::from_raw(12214),
        );
    let mut wrong_selected = queue_handoff.clone();
    wrong_selected.selected_next_lanes_before_render = Lanes::from(Lane::TRANSITION_2);
    let wrong_selected_rejection =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&wrong_selected),
        )
        .unwrap();
    assert_eq!(
        wrong_selected_rejection.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
    );
    assert_eq!(
        wrong_selected_rejection.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::SelectedLanesMismatch {
                root: root_id,
                expected: Lanes::from(Lane::TRANSITION_1),
                actual: Lanes::from(Lane::TRANSITION_2)
            }
        )
    );
    assert!(wrong_selected_rejection.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());

    let (mut store, root_id, finished_host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_first, _second, _third, requests, execution, queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(12215),
            RootElementHandle::from_raw(12216),
            RootElementHandle::from_raw(12217),
        );
    let mut wrong_finished = queue_handoff.clone();
    wrong_finished.finished_lanes = Lanes::from(Lane::TRANSITION_2);
    let wrong_finished_rejection =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&wrong_finished),
        )
        .unwrap();
    assert_eq!(
        wrong_finished_rejection.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
    );
    assert_eq!(
        wrong_finished_rejection.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::FinishedLanesMismatch {
                root: root_id,
                expected: Lanes::from(Lane::TRANSITION_1),
                actual: Lanes::from(Lane::TRANSITION_2)
            }
        )
    );
    assert!(wrong_finished_rejection.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(finished_host.operations(), Vec::<&'static str>::new());

    let (mut store, root_id, count_host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_first, _second, _third, requests, execution, queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(12218),
            RootElementHandle::from_raw(12219),
            RootElementHandle::from_raw(12220),
        );
    let mut wrong_count = queue_handoff.clone();
    wrong_count.applied_update_count = 1;
    let wrong_count_rejection =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&wrong_count),
        )
        .unwrap();
    assert_eq!(
        wrong_count_rejection.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
    );
    assert_eq!(
        wrong_count_rejection.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::AppliedSkippedCountMismatch {
                root: root_id,
                expected_applied: 3,
                actual_applied: 1,
                expected_skipped: 0,
                actual_skipped: 0
            }
        )
    );
    assert!(wrong_count_rejection.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(count_host.operations(), Vec::<&'static str>::new());

    let (mut store, root_id, skipped_count_host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_first, _second, _third, requests, execution, queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(122201),
            RootElementHandle::from_raw(122202),
            RootElementHandle::from_raw(122203),
        );
    let mut wrong_skipped = queue_handoff.clone();
    wrong_skipped.skipped_update_count = 1;
    let wrong_skipped_rejection =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&wrong_skipped),
        )
        .unwrap();
    assert_eq!(
        wrong_skipped_rejection.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
    );
    assert_eq!(
        wrong_skipped_rejection.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::AppliedSkippedCountMismatch {
                root: root_id,
                expected_applied: 3,
                actual_applied: 3,
                expected_skipped: 0,
                actual_skipped: 1
            }
        )
    );
    assert!(wrong_skipped_rejection.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(skipped_count_host.operations(), Vec::<&'static str>::new());

    let (mut store, root_id, replay_host) = root_store();
    let (_first, _second, _third, requests, execution, queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(12221),
            RootElementHandle::from_raw(12222),
            RootElementHandle::from_raw(12223),
        );
    let first = execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        requests,
        execution,
        Some(&queue_handoff),
    )
    .unwrap();
    let committed_current = first.commit().unwrap().current();
    let replay = execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        requests,
        execution,
        Some(&queue_handoff),
    )
    .unwrap();
    assert!(first.did_execute_same_lane_multi_update_queue_lane_scheduler_continuation());
    assert_eq!(
        replay.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::StaleCallbackNode
    );
    assert!(replay.rejected_stale_callback_node());
    assert!(replay.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), committed_current);
    assert_eq!(replay_host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_same_lane_multi_update_queue_lane_continuation_rejects_wrong_lane_and_cross_root()
 {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_first, _second, _third, requests, execution, queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(122301),
            RootElementHandle::from_raw(122302),
            RootElementHandle::from_raw(122303),
        );
    let forged_update = queue_handoff.update_records()[1].update();
    store
        .update_queues_mut()
        .update_mut(forged_update)
        .unwrap()
        .set_lane(Lanes::from(Lane::TRANSITION_2));

    let wrong_lane =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&queue_handoff),
        )
        .unwrap();

    assert_eq!(
        wrong_lane.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
    );
    assert_eq!(
        wrong_lane.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueLane(
                HostRootUpdateQueueLaneHandoffErrorForCanary::WrongLaneMetadata {
                    root: root_id,
                    queue: queue_handoff.current_update_queue(),
                    update: forged_update,
                    expected_lane: Lane::TRANSITION_1,
                    actual_lanes: Lanes::from(Lane::TRANSITION_2)
                }
            )
        )
    );
    assert!(wrong_lane.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());

    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first_root = store
        .create_client_root(FakeContainer::new(122304), RootOptions::new())
        .unwrap();
    let second_root = store
        .create_client_root(FakeContainer::new(122305), RootOptions::new())
        .unwrap();
    let (_first, _second, _third, first_requests, first_execution, first_queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            first_root,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(122306),
            RootElementHandle::from_raw(122307),
            RootElementHandle::from_raw(122308),
        );
    let first_commit =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            first_requests,
            first_execution,
            Some(&first_queue_handoff),
    )
    .unwrap();
    assert!(first_commit.did_execute_same_lane_multi_update_queue_lane_scheduler_continuation());
    let drained = process_root_schedule_in_microtask(&mut store).unwrap();
    assert!(drained.records().iter().all(|record| {
        record.root() == first_root && record.outcome() == RootTaskScheduleOutcome::NoWork
    }));

    let second_current = store.root(second_root).unwrap().current();
    let (_first, _second, _third, second_requests, second_execution, _second_queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            second_root,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(122309),
            RootElementHandle::from_raw(122310),
            RootElementHandle::from_raw(122311),
        );
    let cross_root =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            second_requests,
            second_execution,
            Some(&first_queue_handoff),
        )
        .unwrap();

    assert_eq!(
        cross_root.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
    );
    assert_eq!(
        cross_root.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueRootMismatch {
                expected: second_root,
                actual: first_root
            }
        )
    );
    assert!(cross_root.commit().is_none());
    assert_eq!(store.root(second_root).unwrap().current(), second_current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_same_lane_multi_update_queue_lane_continuation_rejects_stale_finished_work_and_skipped_lane_smuggling()
 {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_first, _second, _third, requests, execution, queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(122401),
            RootElementHandle::from_raw(122402),
            RootElementHandle::from_raw(122403),
        );
    let stale_render =
        render_host_root_for_lanes(&mut store, root_id, Lanes::from(Lane::TRANSITION_1)).unwrap();
    record_root_finished_work_for_scheduler_handoff_for_canary(&mut store, stale_render).unwrap();

    let stale_finished_work =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&queue_handoff),
        )
        .unwrap();

    assert_eq!(
        stale_finished_work.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::BlockedByFinishedWorkHandoffMismatch
    );
    assert!(stale_finished_work.blocked_by_finished_work_handoff_mismatch());
    assert!(stale_finished_work.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(
        store.root(root_id).unwrap().finished_work(),
        Some(stale_render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());

    let (mut store, root_id, skipped_host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let first = update_container_transition_for_canary(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(122404),
        None,
    )
    .unwrap();
    let second = update_container_transition_for_canary(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(122405),
        None,
    )
    .unwrap();
    let third = update_container_transition_for_canary(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(122406),
        None,
    )
    .unwrap();
    let requests = [
        record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(
            &mut store, &first,
        )
        .unwrap(),
        record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(
            &mut store, &second,
        )
        .unwrap(),
        record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(
            &mut store, &third,
        )
        .unwrap(),
    ];
    let processed = process_root_schedule_in_microtask(&mut store).unwrap();
    assert_eq!(processed.records().len(), 1);
    let callback = store.scheduler_bridge().callback_requests()[0];
    let validation =
        validate_scheduled_host_root_callback(&store, root_id, callback.node()).unwrap();
    let default_update = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(122407),
        None,
    )
    .unwrap();
    let render =
        render_host_root_for_lanes(&mut store, root_id, Lanes::from(Lane::TRANSITION_1)).unwrap();
    let execution = RootSchedulerCallbackExecutionRecord {
        callback,
        validation,
        selected_lanes: Lanes::from(Lane::TRANSITION_1),
        status: RootSchedulerCallbackExecutionStatus::Rendered,
        render_phase: Some(render),
    };
    let current_queue_base_updates = store
        .update_queues()
        .base_updates(render.current_update_queue())
        .unwrap();
    let forged = HostRootUpdateQueueLaneHandoffRecordForCanary {
        root: root_id,
        current: render.current(),
        finished_work: render.finished_work(),
        current_update_queue: render.current_update_queue(),
        work_in_progress_update_queue: render.work_in_progress_update_queue(),
        pending_lanes_before_render: render.render_lanes().merge(render.remaining_lanes()),
        selected_next_lanes_before_render: render.render_lanes(),
        finished_lanes: render.render_lanes(),
        remaining_lanes: render.remaining_lanes(),
        pending_lanes_after_render: store.root(root_id).unwrap().lanes().pending_lanes(),
        update_records: vec![
            HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
                sequence: 0,
                update: first.update(),
                lane: first.lane(),
                source_lanes: Lanes::from(Lane::TRANSITION_1),
                pending_lanes_after_enqueue: first.pending_lanes_after_enqueue(),
                selected_next_lanes_after_enqueue: first.selected_next_lanes(),
            },
            HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
                sequence: 1,
                update: second.update(),
                lane: second.lane(),
                source_lanes: Lanes::from(Lane::TRANSITION_1),
                pending_lanes_after_enqueue: second.pending_lanes_after_enqueue(),
                selected_next_lanes_after_enqueue: second.selected_next_lanes(),
            },
            HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
                sequence: 2,
                update: third.update(),
                lane: third.lane(),
                source_lanes: Lanes::from(Lane::TRANSITION_1),
                pending_lanes_after_enqueue: third.pending_lanes_after_enqueue(),
                selected_next_lanes_after_enqueue: third.selected_next_lanes(),
            },
            HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
                sequence: 3,
                update: default_update.update(),
                lane: default_update.lane(),
                source_lanes: Lanes::DEFAULT,
                pending_lanes_after_enqueue: default_update.pending_lanes_after_enqueue(),
                selected_next_lanes_after_enqueue: default_update.selected_next_lanes(),
            },
        ],
        current_queue_base_updates,
        applied_update_count: render.applied_update_count(),
        skipped_update_count: render.skipped_update_count(),
        resulting_element: render.resulting_element(),
    };
    let skipped =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&forged),
        )
        .unwrap();

    assert_eq!(
        skipped.status(),
        RootTransitionSameLaneMultiUpdateQueueLaneContinuationStatusForCanary::BlockedByLaneMismatch
    );
    assert!(skipped.blocked_by_lane_mismatch());
    assert!(skipped.commit().is_none());
    assert_eq!(render.applied_update_count(), 3);
    assert_eq!(render.skipped_update_count(), 1);
    assert_eq!(render.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(skipped_host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_entangled_queue_lane_continuation_accepts_two_transition_lanes() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let entangled_lanes = Lanes::from(Lane::TRANSITION_1).merge_lane(Lane::TRANSITION_2);
    let second_element = RootElementHandle::from_raw(122102);
    let (first, second, request, execution, queue_handoff) =
        entangled_transition_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            Lane::TRANSITION_2,
            RootElementHandle::from_raw(122101),
            second_element,
        );
    let render = execution.render_phase().unwrap();

    let continuation =
        execute_entangled_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            request,
            execution,
            Some(&queue_handoff),
        )
        .unwrap();

    assert_eq!(
        continuation.status(),
        RootEntangledTransitionSchedulerQueueLaneContinuationStatusForCanary::RenderedAndCommitted
    );
    assert_eq!(continuation.root(), root_id);
    assert_eq!(continuation.request(), request);
    assert_eq!(request.root(), root_id);
    assert_eq!(request.fiber(), current);
    assert_eq!(request.queue(), first.queue());
    assert_eq!(request.first().sequence(), 0);
    assert_eq!(request.first().update(), first.update());
    assert_eq!(request.first().lane(), Lane::TRANSITION_1);
    assert_eq!(request.second().sequence(), 1);
    assert_eq!(request.second().update(), second.update());
    assert_eq!(request.second().lane(), Lane::TRANSITION_2);
    assert_eq!(
        request.update_sequence_ids(),
        [first.update(), second.update()]
    );
    assert_eq!(request.selected_lanes(), entangled_lanes);
    assert_eq!(request.entangled_lanes(), entangled_lanes);
    assert_eq!(request.root_pending_lanes_after_enqueue(), entangled_lanes);
    assert_eq!(
        request.root_entangled_lanes_after_enqueue(),
        entangled_lanes
    );
    assert_eq!(request.current_event_transition_lane_before(), Lane::NO);
    assert_eq!(request.current_event_transition_lane_after(), Lane::NO);
    assert!(request.routed_to_private_root_scheduler());
    assert!(!request.public_scheduler_compatibility_claimed());
    assert_eq!(continuation.callback_execution(), execution);
    assert_eq!(continuation.callback_node(), execution.callback_node());
    assert_eq!(
        continuation.current_callback_node(),
        execution.callback_node()
    );
    assert_eq!(continuation.selected_lanes(), entangled_lanes);
    assert_eq!(continuation.current_event_transition_lane(), Lane::NO);
    assert_eq!(continuation.root_current_before_continuation(), current);
    assert_eq!(
        continuation.root_pending_lanes_before_continuation(),
        entangled_lanes
    );
    assert_eq!(
        continuation.root_entangled_lanes_before_continuation(),
        entangled_lanes
    );
    assert!(continuation.did_execute_entangled_transition_queue_lane_scheduler_continuation());
    assert!(continuation.accepted_entangled_transition_scheduler_evidence_for_canary());
    assert!(continuation.accepted_root_scheduler_execution_evidence_for_canary());
    assert!(continuation.accepted_root_commit_execution_evidence_for_canary());
    assert!(continuation.accepted_queue_lane_handoff_evidence_for_canary());
    assert!(continuation.currentness_source_token().is_some());
    assert!(
        continuation
            .routed_through_entangled_transition_queue_lane_and_commit_evidence_for_canary()
    );
    assert!(
        continuation
            .treats_entangled_transition_host_root_updates_as_current_only_with_queue_lane_handoff_for_canary()
    );
    assert!(!continuation.public_root_compatibility_claimed());
    assert!(!continuation.public_scheduler_timing_compatibility_claimed());
    assert!(!continuation.public_transition_hooks_compatibility_claimed());
    assert!(!continuation.public_act_compatibility_claimed());
    assert!(!continuation.react_dom_compatibility_claimed());
    assert!(!continuation.test_renderer_compatibility_claimed());
    assert!(!continuation.native_execution_compatibility_claimed());
    assert!(!continuation.package_compatibility_claimed());
    assert!(!continuation.renderer_compatibility_claimed());
    assert!(!continuation.executes_public_effects());

    let identity = continuation.finished_work_handoff_identity().unwrap();
    assert_eq!(identity.root(), root_id);
    assert_eq!(identity.previous_current(), current);
    assert_eq!(
        identity.pending_work_before_commit(),
        Some(render.finished_work())
    );
    assert_eq!(identity.finished_work(), render.finished_work());
    assert_eq!(identity.selected_lanes(), entangled_lanes);
    assert_eq!(identity.render_lanes(), entangled_lanes);
    assert_eq!(identity.finished_lanes(), entangled_lanes);
    assert!(identity.accepted_for_root_scheduler_commit_handoff());

    let queue_commit_handoff = continuation.queue_commit_handoff().unwrap();
    assert_eq!(queue_commit_handoff.queue_handoff(), &queue_handoff);
    assert_eq!(
        queue_commit_handoff.update_sequence_ids(),
        &[first.update(), second.update()]
    );
    assert_eq!(queue_commit_handoff.selected_lanes(), entangled_lanes);
    assert_eq!(queue_commit_handoff.finished_lanes(), entangled_lanes);
    assert_eq!(queue_commit_handoff.remaining_lanes(), Lanes::NO);
    assert_eq!(queue_commit_handoff.applied_update_count(), 2);
    assert_eq!(queue_commit_handoff.skipped_update_count(), 0);
    assert_eq!(queue_commit_handoff.resulting_element(), second_element);
    assert!(queue_commit_handoff.proves_queue_lane_handoff_gated_current_switch());

    let commit = continuation.commit().unwrap();
    assert_eq!(commit.root(), root_id);
    assert_eq!(commit.previous_current(), current);
    assert_eq!(commit.current(), render.finished_work());
    assert_eq!(commit.finished_work(), render.finished_work());
    assert_eq!(commit.finished_lanes(), entangled_lanes);
    assert_eq!(commit.remaining_lanes(), Lanes::NO);
    assert_eq!(commit.pending_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_entangled_queue_lane_continuation_rejects_missing_entanglement_and_one_selected_lane()
 {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_first, _second, request, execution, queue_handoff) =
        entangled_transition_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            Lane::TRANSITION_2,
            RootElementHandle::from_raw(122103),
            RootElementHandle::from_raw(122104),
        );
    let mut missing_entanglement = request;
    missing_entanglement.second.entangled_lanes_after_enqueue = Lanes::from(Lane::TRANSITION_1);

    let rejected =
        execute_entangled_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            missing_entanglement,
            execution,
            Some(&queue_handoff),
        )
        .unwrap();

    assert_eq!(
        rejected.status(),
        RootEntangledTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByTransitionEntanglementMismatch
    );
    assert!(rejected.blocked_by_transition_entanglement());
    assert!(rejected.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);

    let mut one_selected_lane = execution;
    one_selected_lane.selected_lanes = Lanes::from(Lane::TRANSITION_1);
    let rejected =
        execute_entangled_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            request,
            one_selected_lane,
            Some(&queue_handoff),
        )
        .unwrap();

    assert_eq!(
        rejected.status(),
        RootEntangledTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByLaneMismatch
    );
    assert!(rejected.blocked_by_lane_mismatch());
    assert!(rejected.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_entangled_queue_lane_continuation_rejects_duplicate_update_rows() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (first, second, request, execution, queue_handoff) =
        entangled_transition_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            Lane::TRANSITION_2,
            RootElementHandle::from_raw(122105),
            RootElementHandle::from_raw(122106),
        );
    let mut duplicate = queue_handoff.clone();
    duplicate.update_records[1] = duplicate.update_records[0];

    let rejected =
        execute_entangled_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            request,
            execution,
            Some(&duplicate),
        )
        .unwrap();

    assert_eq!(
        rejected.status(),
        RootEntangledTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
    );
    assert_eq!(
        rejected.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueHandoffNotSourceOwned {
                root: root_id,
                queue: queue_handoff.current_update_queue(),
                expected_updates: vec![first.update(), second.update()],
                actual_updates: vec![first.update(), first.update()],
                records_in_sequence_order: false
            }
        )
    );
    assert!(rejected.commit().is_none());
    assert!(!rejected.accepted_queue_lane_handoff_evidence_for_canary());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_entangled_queue_lane_currentness_consumes_source_owned_two_transition_commit()
 {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let entangled_lanes = Lanes::from(Lane::TRANSITION_1).merge_lane(Lane::TRANSITION_2);
    let first_element = RootElementHandle::from_raw(122107);
    let second_element = RootElementHandle::from_raw(122108);
    let (first, second, request, execution, queue_handoff) =
        entangled_transition_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            Lane::TRANSITION_2,
            first_element,
            second_element,
        );
    let render = execution.render_phase().unwrap();
    let prepared = prepare_test_renderer_host_output_canary_fibers(
        &mut store,
        render,
        TestRendererHostOutputCanaryFixture::new(1221070, 1221071, 1221072),
    )
    .unwrap();
    let completed =
        finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 1221073, 1221074)
            .unwrap();

    let continuation =
        execute_entangled_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            request,
            execution,
            Some(&queue_handoff),
        )
        .unwrap();
    assert!(continuation.currentness_source_token().is_some());
    assert!(
        continuation
            .routed_through_entangled_transition_queue_lane_and_commit_evidence_for_canary()
    );

    let currentness = consume_entangled_transition_queue_lane_commit_currentness_for_canary(
        &mut store,
        &continuation,
    )
    .unwrap();
    let finished = currentness.currentness();

    assert!(currentness.source_owned_currentness_consumed());
    assert!(
        currentness.ties_entangled_transition_queue_lane_commit_to_live_tree_state_for_canary()
    );
    assert_eq!(currentness.root(), root_id);
    assert_eq!(currentness.selected_lanes(), entangled_lanes);
    assert_eq!(currentness.entangled_lanes(), entangled_lanes);
    assert_eq!(
        currentness
            .transition_continuation()
            .currentness_source_token(),
        None
    );
    assert_eq!(finished.root(), root_id);
    assert_eq!(finished.root_token(), root_id.state_node_handle());
    assert_eq!(finished.previous_current(), current);
    assert_eq!(finished.finished_work(), render.finished_work());
    assert_eq!(finished.selected_lanes(), entangled_lanes);
    assert_eq!(finished.finished_lanes(), entangled_lanes);
    assert_eq!(finished.remaining_lanes(), Lanes::NO);
    assert_eq!(
        finished.update_sequence_ids(),
        &[first.update(), second.update()]
    );
    assert_eq!(finished.resulting_element(), second_element);
    assert_eq!(finished.committed_element_after_consume(), second_element);
    assert_eq!(finished.committed_root_children(), &[completed.component()]);
    assert!(finished.commit_mutation_record_count() > 0);
    assert_eq!(finished.commit_deletion_list_count(), 0);
    assert!(!currentness.public_root_compatibility_claimed());
    assert!(!currentness.public_scheduler_timing_compatibility_claimed());
    assert!(!currentness.public_transition_hooks_compatibility_claimed());
    assert!(!currentness.public_act_compatibility_claimed());
    assert!(!currentness.react_dom_compatibility_claimed());
    assert!(!currentness.test_renderer_compatibility_claimed());
    assert!(!currentness.native_execution_compatibility_claimed());
    assert!(!currentness.package_compatibility_claimed());
    assert!(!currentness.renderer_compatibility_claimed());
    assert!(!currentness.executes_public_effects());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_entangled_queue_lane_currentness_rejects_clone_replay_and_caller_metadata()
 {
    let (mut store, root_id, host) = root_store();
    let (_first, _second, request, execution, queue_handoff) =
        entangled_transition_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            Lane::TRANSITION_2,
            RootElementHandle::from_raw(122109),
            RootElementHandle::from_raw(122110),
        );
    let continuation =
        execute_entangled_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            request,
            execution,
            Some(&queue_handoff),
        )
        .unwrap();
    let cloned = continuation.clone();
    let finished_work = continuation.commit().unwrap().finished_work();
    let commit_order = continuation
        .queue_commit_handoff()
        .unwrap()
        .finished_work_handoff()
        .commit_order();
    let source_token = continuation.currentness_source_token();

    assert!(source_token.is_some());
    assert_eq!(cloned.currentness_source_token(), None);
    assert_eq!(
        store
            .root_scheduler()
            .pending_finished_work_queue_lane_commit_currentness_source_count(),
        1
    );
    assert_eq!(
        store
            .root_scheduler()
            .consumed_finished_work_queue_lane_commit_currentness_source_count(),
        0
    );
    assert_eq!(
        consume_entangled_transition_queue_lane_commit_currentness_for_canary(&mut store, &cloned)
            .unwrap_err(),
        RootEntangledTransitionQueueLaneCommitCurrentnessErrorForCanary::FinishedWorkQueueLaneCurrentness(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::SourceNotPending {
                root: root_id,
                finished_work,
                commit_order
            }
        )
    );
    assert_eq!(
        store
            .root_scheduler()
            .pending_finished_work_queue_lane_commit_currentness_source_count(),
        1
    );
    assert_eq!(
        store
            .root_scheduler()
            .consumed_finished_work_queue_lane_commit_currentness_source_count(),
        0
    );

    let mut event_lane_drift =
        clone_entangled_transition_queue_lane_continuation_preserving_currentness_source(
            &continuation,
        );
    event_lane_drift.current_event_transition_lane = Lane::TRANSITION_3;
    assert_eq!(event_lane_drift.currentness_source_token(), source_token);
    assert_entangled_currentness_rejects_metadata_mismatch_without_consuming_source(
        &mut store,
        root_id,
        &event_lane_drift,
        "current_event_transition_lane",
        1,
        0,
        &host,
    );

    let mut queue_handoff_drift =
        clone_entangled_transition_queue_lane_continuation_preserving_currentness_source(
            &continuation,
        );
    queue_handoff_drift
        .queue_handoff
        .as_mut()
        .unwrap()
        .remaining_lanes = Lanes::SYNC;
    assert_eq!(queue_handoff_drift.currentness_source_token(), source_token);
    assert_entangled_currentness_rejects_metadata_mismatch_without_consuming_source(
        &mut store,
        root_id,
        &queue_handoff_drift,
        "queue_handoff",
        1,
        0,
        &host,
    );

    let mut queue_commit_handoff_drift =
        clone_entangled_transition_queue_lane_continuation_preserving_currentness_source(
            &continuation,
        );
    queue_commit_handoff_drift.queue_commit_handoff = None;
    assert_eq!(
        queue_commit_handoff_drift.currentness_source_token(),
        source_token
    );
    assert_entangled_currentness_rejects_metadata_mismatch_without_consuming_source(
        &mut store,
        root_id,
        &queue_commit_handoff_drift,
        "queue_commit_handoff",
        1,
        0,
        &host,
    );

    let mut commit_drift =
        clone_entangled_transition_queue_lane_continuation_preserving_currentness_source(
            &continuation,
        );
    commit_drift.commit = None;
    assert_eq!(commit_drift.currentness_source_token(), source_token);
    assert_entangled_currentness_rejects_metadata_mismatch_without_consuming_source(
        &mut store,
        root_id,
        &commit_drift,
        "commit",
        1,
        0,
        &host,
    );

    let consumed = consume_entangled_transition_queue_lane_commit_currentness_for_canary(
        &mut store,
        &continuation,
    )
    .unwrap();
    assert!(consumed.ties_entangled_transition_queue_lane_commit_to_live_tree_state_for_canary());
    assert_eq!(
        store
            .root_scheduler()
            .pending_finished_work_queue_lane_commit_currentness_source_count(),
        0
    );
    assert_eq!(
        store
            .root_scheduler()
            .consumed_finished_work_queue_lane_commit_currentness_source_count(),
        1
    );
    assert_eq!(
        consume_entangled_transition_queue_lane_commit_currentness_for_canary(
            &mut store,
            &continuation,
        )
        .unwrap_err(),
        RootEntangledTransitionQueueLaneCommitCurrentnessErrorForCanary::FinishedWorkQueueLaneCurrentness(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::SourceAlreadyConsumed {
                root: root_id,
                finished_work,
                commit_order
            }
        )
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_entangled_queue_lane_currentness_rejects_cross_root_and_stale_live_root()
 {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first_root = store
        .create_client_root(FakeContainer::new(122111), RootOptions::new())
        .unwrap();
    let second_root = store
        .create_client_root(FakeContainer::new(122112), RootOptions::new())
        .unwrap();
    let (_second_first, _second_second, second_request, second_execution, _second_queue_handoff) =
        entangled_transition_queue_lane_scheduler_handoff(
            &mut store,
            second_root,
            Lane::TRANSITION_1,
            Lane::TRANSITION_2,
            RootElementHandle::from_raw(122113),
            RootElementHandle::from_raw(122114),
        );
    let first_update = update_container_transition_for_canary(
        &mut store,
        first_root,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(122115),
        None,
    )
    .unwrap();
    let second_update = update_container_transition_for_canary(
        &mut store,
        first_root,
        Lane::TRANSITION_2,
        RootElementHandle::from_raw(122116),
        None,
    )
    .unwrap();
    let first_entangled_lanes = Lanes::from(Lane::TRANSITION_1).merge_lane(Lane::TRANSITION_2);
    let first_render =
        render_host_root_for_lanes(&mut store, first_root, first_entangled_lanes).unwrap();
    let first_queue_handoff = host_root_update_queue_lane_handoff_for_canary(
        &store,
        first_root,
        &[first_update.clone(), second_update.clone()],
        first_render,
    )
    .unwrap();
    let second_current = store.root(second_root).unwrap().current();

    let cross_root =
        execute_entangled_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            second_request,
            second_execution,
            Some(&first_queue_handoff),
        )
        .unwrap();

    assert_eq!(
        cross_root.status(),
        RootEntangledTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
    );
    assert_eq!(cross_root.currentness_source_token(), None);
    assert_eq!(
        consume_entangled_transition_queue_lane_commit_currentness_for_canary(
            &mut store,
            &cross_root,
        )
        .unwrap_err(),
        RootEntangledTransitionQueueLaneCommitCurrentnessErrorForCanary::UnacceptedTransitionContinuation {
            root: second_root,
            status: RootEntangledTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
        }
    );
    assert_eq!(store.root(second_root).unwrap().current(), second_current);
    assert_eq!(
        store
            .root_scheduler()
            .pending_finished_work_queue_lane_commit_currentness_source_count(),
        0
    );
    assert_eq!(
        store
            .root_scheduler()
            .consumed_finished_work_queue_lane_commit_currentness_source_count(),
        0
    );

    let (mut store, stale_root_id, stale_host) = root_store();
    let (_first, _second, stale_request, stale_execution, stale_queue_handoff) =
        entangled_transition_queue_lane_scheduler_handoff(
            &mut store,
            stale_root_id,
            Lane::TRANSITION_1,
            Lane::TRANSITION_2,
            RootElementHandle::from_raw(122117),
            RootElementHandle::from_raw(122118),
        );
    let stale_continuation =
        execute_entangled_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            stale_request,
            stale_execution,
            Some(&stale_queue_handoff),
        )
        .unwrap();
    let stale_finished_work = stale_continuation.commit().unwrap().finished_work();

    update_container_sync(
        &mut store,
        stale_root_id,
        RootElementHandle::from_raw(122119),
        None,
    )
    .unwrap();
    let next_render = render_host_root_for_lanes(&mut store, stale_root_id, Lanes::SYNC).unwrap();
    let next_commit = commit_finished_host_root(&mut store, next_render).unwrap();

    assert_eq!(
        consume_entangled_transition_queue_lane_commit_currentness_for_canary(
            &mut store,
            &stale_continuation,
        )
        .unwrap_err(),
        RootEntangledTransitionQueueLaneCommitCurrentnessErrorForCanary::FinishedWorkQueueLaneCurrentness(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::LiveRootStateMismatch {
                root: stale_root_id,
                expected_current: stale_finished_work,
                actual_current: next_commit.current(),
                expected_finished_work: None,
                actual_finished_work: None,
                expected_finished_lanes: Lanes::NO,
                actual_finished_lanes: Lanes::NO,
                expected_pending_lanes: Lanes::NO,
                actual_pending_lanes: Lanes::NO
            }
        )
    );
    assert_eq!(
        store
            .root_scheduler()
            .pending_finished_work_queue_lane_commit_currentness_source_count(),
        1
    );
    assert_eq!(
        store
            .root_scheduler()
            .consumed_finished_work_queue_lane_commit_currentness_source_count(),
        0
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(stale_host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_queue_lane_continuation_rejects_stale_transition_diagnostics() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_accepted, request, execution, queue_handoff) = transition_queue_lane_scheduler_handoff(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(9092),
    );
    store
        .root_scheduler_mut()
        .set_current_event_transition_lane(Lane::NO);

    let continuation = execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        request,
        execution,
        Some(&queue_handoff),
    )
    .unwrap();

    assert_eq!(
        continuation.status(),
        RootTransitionSchedulerQueueLaneContinuationStatusForCanary::StaleTransitionDiagnostics
    );
    assert!(continuation.stale_transition_diagnostics());
    assert_eq!(continuation.current_event_transition_lane(), Lane::NO);
    assert_eq!(
        continuation.root_pending_lanes_before_continuation(),
        request.selected_next_lanes()
    );
    assert!(continuation.queue_handoff_error().is_none());
    assert!(continuation.queue_commit_handoff().is_none());
    assert!(continuation.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_queue_lane_continuation_rejects_wrong_entanglement() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_accepted, mut request, execution, queue_handoff) =
        transition_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(9093),
        );
    request.entangled_lanes = Lanes::from(Lane::TRANSITION_2);

    let continuation = execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        request,
        execution,
        Some(&queue_handoff),
    )
    .unwrap();

    assert_eq!(
            continuation.status(),
            RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByTransitionEntanglementMismatch
        );
    assert!(continuation.blocked_by_transition_entanglement());
    assert_eq!(
        continuation.root_entangled_lanes_before_continuation(),
        Lanes::from(Lane::TRANSITION_1)
    );
    assert!(continuation.queue_handoff_error().is_none());
    assert!(continuation.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_queue_lane_continuation_rejects_wrong_selected_lanes() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_accepted, request, mut execution, queue_handoff) =
        transition_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(9094),
        );
    execution.selected_lanes = Lanes::from(Lane::TRANSITION_2);

    let continuation = execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        request,
        execution,
        Some(&queue_handoff),
    )
    .unwrap();

    assert_eq!(
        continuation.status(),
        RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByLaneMismatch
    );
    assert!(continuation.blocked_by_lane_mismatch());
    assert_eq!(
        continuation.selected_lanes(),
        Lanes::from(Lane::TRANSITION_2)
    );
    assert!(continuation.queue_handoff_error().is_none());
    assert!(continuation.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_queue_lane_continuation_rejects_wrong_finished_lanes() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_accepted, request, execution, queue_handoff) = transition_queue_lane_scheduler_handoff(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(9095),
    );
    let mut forged = queue_handoff.clone();
    forged.finished_lanes = Lanes::from(Lane::TRANSITION_2);

    let continuation = execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        request,
        execution,
        Some(&forged),
    )
    .unwrap();

    assert_eq!(
            continuation.status(),
            RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert!(continuation.blocked_by_queue_lane_handoff());
    assert_eq!(
        continuation.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::FinishedLanesMismatch {
                root: root_id,
                expected: Lanes::from(Lane::TRANSITION_1),
                actual: Lanes::from(Lane::TRANSITION_2)
            }
        )
    );
    assert!(continuation.queue_commit_handoff().is_none());
    assert!(continuation.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_queue_lane_continuation_rejects_replay_after_commit() {
    let (mut store, root_id, host) = root_store();
    let (_accepted, request, execution, queue_handoff) = transition_queue_lane_scheduler_handoff(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(9096),
    );
    let first = execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        request,
        execution,
        Some(&queue_handoff),
    )
    .unwrap();
    let committed_current = first.commit().unwrap().current();

    let replay = execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        request,
        execution,
        Some(&queue_handoff),
    )
    .unwrap();

    assert!(first.did_execute_transition_queue_lane_scheduler_continuation());
    assert_eq!(
        replay.status(),
        RootTransitionSchedulerQueueLaneContinuationStatusForCanary::StaleCallbackNode
    );
    assert!(replay.rejected_stale_callback_node());
    assert_eq!(replay.root_current_before_continuation(), committed_current);
    assert_eq!(replay.root_pending_lanes_before_continuation(), Lanes::NO);
    assert!(replay.queue_handoff_error().is_none());
    assert!(replay.queue_commit_handoff().is_none());
    assert!(replay.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), committed_current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_queue_lane_continuation_rejects_cross_root_evidence() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first = store
        .create_client_root(FakeContainer::new(9097), RootOptions::new())
        .unwrap();
    let second = store
        .create_client_root(FakeContainer::new(9098), RootOptions::new())
        .unwrap();
    let first_update = update_container_transition_for_canary(
        &mut store,
        first,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(9099),
        None,
    )
    .unwrap();
    let first_render =
        render_host_root_for_lanes(&mut store, first, Lanes::from(Lane::TRANSITION_1)).unwrap();
    let first_queue_handoff = host_root_update_queue_lane_handoff_for_canary(
        &store,
        first,
        std::slice::from_ref(&first_update),
        first_render,
    )
    .unwrap();
    let second_current = store.root(second).unwrap().current();
    let (_second_update, second_request, second_execution, _second_queue_handoff) =
        transition_queue_lane_scheduler_handoff(
            &mut store,
            second,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(9100),
        );

    let continuation = execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        second_request,
        second_execution,
        Some(&first_queue_handoff),
    )
    .unwrap();

    assert_eq!(
            continuation.status(),
            RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert_eq!(
        continuation.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueRootMismatch {
                expected: second,
                actual: first
            }
        )
    );
    assert!(continuation.commit().is_none());
    assert_eq!(store.root(second).unwrap().current(), second_current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_queue_lane_continuation_rejects_caller_built_rows() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (accepted, request, execution, queue_handoff) = transition_queue_lane_scheduler_handoff(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(9101),
    );
    let mut forged = queue_handoff.clone();
    forged.update_records[0].sequence = 1;

    let continuation = execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        request,
        execution,
        Some(&forged),
    )
    .unwrap();

    assert_eq!(
            continuation.status(),
            RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert_eq!(
            continuation.queue_handoff_error(),
            Some(
                &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueHandoffNotSourceOwned {
                    root: root_id,
                    queue: queue_handoff.current_update_queue(),
                    expected_updates: vec![accepted.update()],
                    actual_updates: vec![accepted.update()],
                    records_in_sequence_order: false
                }
            )
        );
    assert!(continuation.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_queue_lane_continuation_rejects_skipped_lane_commit_attempt() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let transition = update_container_transition_for_canary(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(9102),
        None,
    )
    .unwrap();
    let request = record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(
        &mut store,
        &transition,
    )
    .unwrap();
    process_root_schedule_in_microtask(&mut store).unwrap();
    let callback = store.scheduler_bridge().callback_requests()[0];
    let validation =
        validate_scheduled_host_root_callback(&store, root_id, callback.node()).unwrap();
    let default_update =
        update_container(&mut store, root_id, RootElementHandle::from_raw(9103), None).unwrap();
    let render =
        render_host_root_for_lanes(&mut store, root_id, Lanes::from(Lane::TRANSITION_1)).unwrap();
    assert_eq!(render.render_lanes(), Lanes::from(Lane::TRANSITION_1));
    assert_eq!(render.remaining_lanes(), Lanes::DEFAULT);
    let current_queue_base_updates = store
        .update_queues()
        .base_updates(render.current_update_queue())
        .unwrap();
    let execution = RootSchedulerCallbackExecutionRecord {
        callback,
        validation,
        selected_lanes: Lanes::from(Lane::TRANSITION_1),
        status: RootSchedulerCallbackExecutionStatus::Rendered,
        render_phase: Some(render),
    };
    let forged = HostRootUpdateQueueLaneHandoffRecordForCanary {
        root: root_id,
        current: render.current(),
        finished_work: render.finished_work(),
        current_update_queue: render.current_update_queue(),
        work_in_progress_update_queue: render.work_in_progress_update_queue(),
        pending_lanes_before_render: render.render_lanes().merge(render.remaining_lanes()),
        selected_next_lanes_before_render: render.render_lanes(),
        finished_lanes: render.render_lanes(),
        remaining_lanes: render.remaining_lanes(),
        pending_lanes_after_render: store.root(root_id).unwrap().lanes().pending_lanes(),
        update_records: vec![
            HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
                sequence: 0,
                update: transition.update(),
                lane: transition.lane(),
                source_lanes: Lanes::from(Lane::TRANSITION_1),
                pending_lanes_after_enqueue: transition.pending_lanes_after_enqueue(),
                selected_next_lanes_after_enqueue: transition.selected_next_lanes(),
            },
            HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
                sequence: 1,
                update: default_update.update(),
                lane: default_update.lane(),
                source_lanes: Lanes::DEFAULT,
                pending_lanes_after_enqueue: default_update.pending_lanes_after_enqueue(),
                selected_next_lanes_after_enqueue: default_update.selected_next_lanes(),
            },
        ],
        current_queue_base_updates,
        applied_update_count: render.applied_update_count(),
        skipped_update_count: render.skipped_update_count(),
        resulting_element: render.resulting_element(),
    };

    let continuation = execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        request,
        execution,
        Some(&forged),
    )
    .unwrap();

    assert_eq!(
            continuation.status(),
            RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert_eq!(
        continuation.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueLane(
                HostRootUpdateQueueLaneHandoffErrorForCanary::SkippedLaneCommitted {
                    root: root_id,
                    update: default_update.update(),
                    skipped_lanes: Lanes::DEFAULT,
                    finished_lanes: Lanes::from(Lane::TRANSITION_1),
                    remaining_lanes: Lanes::DEFAULT
                }
            )
        )
    );
    assert_eq!(render.applied_update_count(), 1);
    assert_eq!(render.skipped_update_count(), 1);
    assert!(continuation.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_queue_lane_currentness_consumes_finished_work_source() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (accepted, request, execution, queue_handoff) = transition_queue_lane_scheduler_handoff(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(12151),
    );
    let render = execution.render_phase().unwrap();
    let prepared = prepare_test_renderer_host_output_canary_fibers(
        &mut store,
        render,
        TestRendererHostOutputCanaryFixture::new(121510, 121511, 121512),
    )
    .unwrap();
    let completed =
        finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 121513, 121514)
            .unwrap();

    let continuation = execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        request,
        execution,
        Some(&queue_handoff),
    )
    .unwrap();
    assert!(continuation.currentness_source_token().is_some());

    let currentness =
        consume_transition_queue_lane_commit_currentness_for_canary(&mut store, &continuation)
            .unwrap();
    let finished = currentness.currentness();

    assert!(currentness.source_owned_currentness_consumed());
    assert!(currentness.ties_transition_queue_lane_commit_to_live_tree_state_for_canary());
    assert_eq!(currentness.root(), root_id);
    assert_eq!(currentness.transition_lane(), Lane::TRANSITION_1);
    assert_eq!(
        currentness.selected_lanes(),
        Lanes::from(Lane::TRANSITION_1)
    );
    assert_eq!(
        currentness
            .transition_continuation()
            .currentness_source_token(),
        None
    );
    assert_eq!(finished.root(), root_id);
    assert_eq!(finished.root_token(), root_id.state_node_handle());
    assert_eq!(finished.previous_current(), current);
    assert_eq!(finished.finished_work(), render.finished_work());
    assert_eq!(finished.selected_lanes(), Lanes::from(Lane::TRANSITION_1));
    assert_eq!(finished.finished_lanes(), Lanes::from(Lane::TRANSITION_1));
    assert_eq!(finished.remaining_lanes(), Lanes::NO);
    assert_eq!(finished.update_sequence_ids(), &[accepted.update()]);
    assert_eq!(
        finished.resulting_element(),
        RootElementHandle::from_raw(12151)
    );
    assert_eq!(
        finished.committed_element_after_consume(),
        RootElementHandle::from_raw(12151)
    );
    assert_eq!(finished.committed_root_children(), &[completed.component()]);
    assert!(finished.commit_mutation_record_count() > 0);
    assert_eq!(finished.commit_deletion_list_count(), 0);
    assert!(!currentness.public_root_compatibility_claimed());
    assert!(!currentness.public_scheduler_timing_compatibility_claimed());
    assert!(!currentness.public_transition_hooks_compatibility_claimed());
    assert!(!currentness.public_act_compatibility_claimed());
    assert!(!currentness.react_dom_compatibility_claimed());
    assert!(!currentness.test_renderer_compatibility_claimed());
    assert!(!currentness.native_execution_compatibility_claimed());
    assert!(!currentness.package_compatibility_claimed());
    assert!(!currentness.renderer_compatibility_claimed());
    assert!(!currentness.executes_public_effects());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_same_lane_multi_update_currentness_consumes_source_owned_exact_two_commit()
 {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let first_element = RootElementHandle::from_raw(12223);
    let second_element = RootElementHandle::from_raw(12224);
    let (first, second, requests, execution, queue_handoff) =
        same_transition_exact_two_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            first_element,
            second_element,
        );
    let render = execution.render_phase().unwrap();
    let prepared = prepare_test_renderer_host_output_canary_fibers(
        &mut store,
        render,
        TestRendererHostOutputCanaryFixture::new(122230, 122231, 122232),
    )
    .unwrap();
    let completed =
        finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 122233, 122234)
            .unwrap();

    let continuation =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&queue_handoff),
        )
        .unwrap();
    assert!(continuation.currentness_source_token().is_some());
    assert!(
        continuation.routed_through_same_lane_multi_update_transition_queue_lane_and_commit_evidence_for_canary()
    );

    let currentness =
        consume_transition_same_lane_multi_update_queue_lane_commit_currentness_for_canary(
            &mut store,
            &continuation,
        )
        .unwrap();
    let finished = currentness.currentness();

    assert!(currentness.source_owned_currentness_consumed());
    assert!(
        currentness
            .ties_same_lane_multi_update_transition_queue_lane_commit_to_live_tree_state_for_canary(
            )
    );
    assert_eq!(currentness.root(), root_id);
    assert_eq!(currentness.transition_lane(), Lane::TRANSITION_1);
    assert_eq!(finished.previous_current(), current);
    assert_eq!(finished.finished_work(), render.finished_work());
    assert_eq!(
        finished.update_sequence_ids(),
        &[first.update(), second.update()]
    );
    assert_eq!(finished.resulting_element(), second_element);
    assert_eq!(finished.committed_element_after_consume(), second_element);
    assert_eq!(finished.committed_root_children(), &[completed.component()]);
    assert!(!currentness.public_root_compatibility_claimed());
    assert!(!currentness.public_scheduler_timing_compatibility_claimed());
    assert!(!currentness.public_transition_hooks_compatibility_claimed());
    assert!(!currentness.public_act_compatibility_claimed());
    assert!(!currentness.react_dom_compatibility_claimed());
    assert!(!currentness.test_renderer_compatibility_claimed());
    assert!(!currentness.native_execution_compatibility_claimed());
    assert!(!currentness.package_compatibility_claimed());
    assert!(!currentness.renderer_compatibility_claimed());
    assert!(!currentness.executes_public_effects());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_same_lane_multi_update_currentness_consumes_source_owned_exact_three_commit()
 {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let first_element = RootElementHandle::from_raw(12225);
    let second_element = RootElementHandle::from_raw(12226);
    let third_element = RootElementHandle::from_raw(12227);
    let (first, second, third, requests, execution, queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            first_element,
            second_element,
            third_element,
        );
    let render = execution.render_phase().unwrap();
    let prepared = prepare_test_renderer_host_output_canary_fibers(
        &mut store,
        render,
        TestRendererHostOutputCanaryFixture::new(122230, 122231, 122232),
    )
    .unwrap();
    let completed =
        finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 122233, 122234)
            .unwrap();

    let continuation =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&queue_handoff),
        )
        .unwrap();
    assert!(continuation.currentness_source_token().is_some());
    assert!(
        continuation.routed_through_same_lane_multi_update_transition_queue_lane_and_commit_evidence_for_canary()
    );

    let currentness =
        consume_transition_same_lane_multi_update_queue_lane_commit_currentness_for_canary(
            &mut store,
            &continuation,
        )
        .unwrap();
    let finished = currentness.currentness();

    assert!(currentness.source_owned_currentness_consumed());
    assert!(
        currentness
            .ties_same_lane_multi_update_transition_queue_lane_commit_to_live_tree_state_for_canary(
            )
    );
    assert_eq!(currentness.root(), root_id);
    assert_eq!(currentness.transition_lane(), Lane::TRANSITION_1);
    assert_eq!(
        currentness.selected_lanes(),
        Lanes::from(Lane::TRANSITION_1)
    );
    assert_eq!(
        currentness
            .transition_continuation()
            .currentness_source_token(),
        None
    );
    assert_eq!(finished.root(), root_id);
    assert_eq!(finished.root_token(), root_id.state_node_handle());
    assert_eq!(finished.previous_current(), current);
    assert_eq!(finished.finished_work(), render.finished_work());
    assert_eq!(finished.selected_lanes(), Lanes::from(Lane::TRANSITION_1));
    assert_eq!(finished.finished_lanes(), Lanes::from(Lane::TRANSITION_1));
    assert_eq!(finished.remaining_lanes(), Lanes::NO);
    assert_eq!(
        finished.update_sequence_ids(),
        &[first.update(), second.update(), third.update()]
    );
    assert_eq!(finished.resulting_element(), third_element);
    assert_eq!(finished.committed_element_after_consume(), third_element);
    assert_eq!(finished.committed_root_children(), &[completed.component()]);
    assert!(finished.commit_mutation_record_count() > 0);
    assert_eq!(finished.commit_deletion_list_count(), 0);
    assert!(!currentness.public_root_compatibility_claimed());
    assert!(!currentness.public_scheduler_timing_compatibility_claimed());
    assert!(!currentness.public_transition_hooks_compatibility_claimed());
    assert!(!currentness.public_act_compatibility_claimed());
    assert!(!currentness.react_dom_compatibility_claimed());
    assert!(!currentness.test_renderer_compatibility_claimed());
    assert!(!currentness.native_execution_compatibility_claimed());
    assert!(!currentness.package_compatibility_claimed());
    assert!(!currentness.renderer_compatibility_claimed());
    assert!(!currentness.executes_public_effects());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        render.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_same_lane_multi_update_currentness_rejects_clone_replay_metadata_and_stale_root()
 {
    let (mut store, root_id, host) = root_store();
    let (_first, _second, _third, requests, execution, queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(12225),
            RootElementHandle::from_raw(12226),
            RootElementHandle::from_raw(12227),
        );
    let continuation =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            requests,
            execution,
            Some(&queue_handoff),
        )
        .unwrap();
    let cloned = continuation.clone();
    let finished_work = continuation.commit().unwrap().finished_work();
    let commit_order = continuation
        .root_commit_handoff_for_canary()
        .unwrap()
        .commit_order();
    let source_token = continuation.currentness_source_token();

    assert!(source_token.is_some());
    assert_eq!(cloned.currentness_source_token(), None);
    assert_eq!(
        store
            .root_scheduler()
            .pending_finished_work_queue_lane_commit_currentness_source_count(),
        1
    );
    assert_eq!(
        store
            .root_scheduler()
            .consumed_finished_work_queue_lane_commit_currentness_source_count(),
        0
    );
    assert_eq!(
        consume_transition_same_lane_multi_update_queue_lane_commit_currentness_for_canary(
            &mut store,
            &cloned,
        )
        .unwrap_err(),
        RootTransitionSameLaneMultiUpdateQueueLaneCommitCurrentnessErrorForCanary::FinishedWorkQueueLaneCurrentness(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::SourceNotPending {
                root: root_id,
                finished_work,
                commit_order
            }
        )
    );
    assert_eq!(
        store
            .root_scheduler()
            .pending_finished_work_queue_lane_commit_currentness_source_count(),
        1
    );
    assert_eq!(
        store
            .root_scheduler()
            .consumed_finished_work_queue_lane_commit_currentness_source_count(),
        0
    );

    let mut caller_shaped =
        clone_same_transition_multi_update_continuation_preserving_currentness_source(
            &continuation,
        );
    caller_shaped.current_event_transition_lane = Lane::TRANSITION_2;
    assert_eq!(caller_shaped.currentness_source_token(), source_token);
    assert_same_lane_multi_update_currentness_rejects_metadata_mismatch_without_consuming_source(
        &mut store,
        root_id,
        &caller_shaped,
        "current_event_transition_lane",
        1,
        0,
        &host,
    );

    let mut queue_handoff_drift =
        clone_same_transition_multi_update_continuation_preserving_currentness_source(
            &continuation,
        );
    queue_handoff_drift
        .queue_handoff
        .as_mut()
        .unwrap()
        .remaining_lanes = Lanes::SYNC;
    assert_eq!(queue_handoff_drift.currentness_source_token(), source_token);
    assert_same_lane_multi_update_currentness_rejects_metadata_mismatch_without_consuming_source(
        &mut store,
        root_id,
        &queue_handoff_drift,
        "queue_handoff",
        1,
        0,
        &host,
    );

    let mut root_commit_handoff_drift =
        clone_same_transition_multi_update_continuation_preserving_currentness_source(
            &continuation,
        );
    root_commit_handoff_drift.root_commit_handoff = None;
    assert_eq!(
        root_commit_handoff_drift.currentness_source_token(),
        source_token
    );
    assert_same_lane_multi_update_currentness_rejects_metadata_mismatch_without_consuming_source(
        &mut store,
        root_id,
        &root_commit_handoff_drift,
        "root_commit_handoff",
        1,
        0,
        &host,
    );

    let mut commit_drift =
        clone_same_transition_multi_update_continuation_preserving_currentness_source(
            &continuation,
        );
    commit_drift.commit = None;
    assert_eq!(commit_drift.currentness_source_token(), source_token);
    assert_same_lane_multi_update_currentness_rejects_metadata_mismatch_without_consuming_source(
        &mut store,
        root_id,
        &commit_drift,
        "commit",
        1,
        0,
        &host,
    );

    let consumed =
        consume_transition_same_lane_multi_update_queue_lane_commit_currentness_for_canary(
            &mut store,
            &continuation,
        )
        .unwrap();
    assert!(
        consumed
            .ties_same_lane_multi_update_transition_queue_lane_commit_to_live_tree_state_for_canary(
            )
    );
    assert_eq!(
        store
            .root_scheduler()
            .pending_finished_work_queue_lane_commit_currentness_source_count(),
        0
    );
    assert_eq!(
        store
            .root_scheduler()
            .consumed_finished_work_queue_lane_commit_currentness_source_count(),
        1
    );
    assert_eq!(
        consume_transition_same_lane_multi_update_queue_lane_commit_currentness_for_canary(
            &mut store,
            &continuation,
        )
        .unwrap_err(),
        RootTransitionSameLaneMultiUpdateQueueLaneCommitCurrentnessErrorForCanary::FinishedWorkQueueLaneCurrentness(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::SourceAlreadyConsumed {
                root: root_id,
                finished_work,
                commit_order
            }
        )
    );

    let (mut store, stale_root_id, stale_host) = root_store();
    let (_first, _second, _third, stale_requests, stale_execution, stale_queue_handoff) =
        same_transition_multi_update_queue_lane_scheduler_handoff(
            &mut store,
            stale_root_id,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(12227),
            RootElementHandle::from_raw(12228),
            RootElementHandle::from_raw(12229),
        );
    let stale_continuation =
        execute_transition_same_lane_multi_update_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            stale_requests,
            stale_execution,
            Some(&stale_queue_handoff),
        )
        .unwrap();
    let stale_finished_work = stale_continuation.commit().unwrap().finished_work();

    update_container_sync(
        &mut store,
        stale_root_id,
        RootElementHandle::from_raw(12230),
        None,
    )
    .unwrap();
    let next_render = render_host_root_for_lanes(&mut store, stale_root_id, Lanes::SYNC).unwrap();
    let next_commit = commit_finished_host_root(&mut store, next_render).unwrap();

    assert_eq!(
        consume_transition_same_lane_multi_update_queue_lane_commit_currentness_for_canary(
            &mut store,
            &stale_continuation,
        )
        .unwrap_err(),
        RootTransitionSameLaneMultiUpdateQueueLaneCommitCurrentnessErrorForCanary::FinishedWorkQueueLaneCurrentness(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::LiveRootStateMismatch {
                root: stale_root_id,
                expected_current: stale_finished_work,
                actual_current: next_commit.current(),
                expected_finished_work: None,
                actual_finished_work: None,
                expected_finished_lanes: Lanes::NO,
                actual_finished_lanes: Lanes::NO,
                expected_pending_lanes: Lanes::NO,
                actual_pending_lanes: Lanes::NO
            }
        )
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(stale_host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_queue_lane_currentness_rejects_clone_replay_and_caller_metadata() {
    let (mut store, root_id, host) = root_store();
    let (_accepted, request, execution, queue_handoff) = transition_queue_lane_scheduler_handoff(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(12152),
    );
    let continuation = execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        request,
        execution,
        Some(&queue_handoff),
    )
    .unwrap();
    let cloned = continuation.clone();
    let finished_work = continuation.commit().unwrap().finished_work();
    let commit_order = continuation
        .queue_commit_handoff()
        .unwrap()
        .finished_work_handoff()
        .commit_order();
    let source_token = continuation.currentness_source_token();

    assert!(source_token.is_some());
    assert_eq!(cloned.currentness_source_token(), None);
    assert_eq!(
        consume_transition_queue_lane_commit_currentness_for_canary(&mut store, &cloned)
            .unwrap_err(),
        RootTransitionQueueLaneCommitCurrentnessErrorForCanary::FinishedWorkQueueLaneCurrentness(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::SourceNotPending {
                root: root_id,
                finished_work,
                commit_order
            }
        )
    );

    let mut caller_shaped =
        clone_transition_queue_lane_continuation_preserving_currentness_source(&continuation);
    caller_shaped.current_event_transition_lane = Lane::TRANSITION_2;
    assert_eq!(caller_shaped.currentness_source_token(), source_token);
    assert_eq!(
        consume_transition_queue_lane_commit_currentness_for_canary(&mut store, &caller_shaped,)
            .unwrap_err(),
        RootTransitionQueueLaneCommitCurrentnessErrorForCanary::TransitionWrapperMetadataMismatch {
            root: root_id,
            field: "current_event_transition_lane"
        }
    );

    let consumed =
        consume_transition_queue_lane_commit_currentness_for_canary(&mut store, &continuation)
            .unwrap();
    assert!(consumed.ties_transition_queue_lane_commit_to_live_tree_state_for_canary());
    assert_eq!(
        consume_transition_queue_lane_commit_currentness_for_canary(&mut store, &continuation)
            .unwrap_err(),
        RootTransitionQueueLaneCommitCurrentnessErrorForCanary::FinishedWorkQueueLaneCurrentness(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::SourceAlreadyConsumed {
                root: root_id,
                finished_work,
                commit_order
            }
        )
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_queue_lane_currentness_rejects_cross_root_and_stale_live_root() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first = store
        .create_client_root(FakeContainer::new(12153), RootOptions::new())
        .unwrap();
    let second = store
        .create_client_root(FakeContainer::new(12154), RootOptions::new())
        .unwrap();
    let first_update = update_container_transition_for_canary(
        &mut store,
        first,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(12155),
        None,
    )
    .unwrap();
    let first_render =
        render_host_root_for_lanes(&mut store, first, Lanes::from(Lane::TRANSITION_1)).unwrap();
    let first_queue_handoff = host_root_update_queue_lane_handoff_for_canary(
        &store,
        first,
        std::slice::from_ref(&first_update),
        first_render,
    )
    .unwrap();
    let second_current = store.root(second).unwrap().current();
    let (_second_update, second_request, second_execution, _second_queue_handoff) =
        transition_queue_lane_scheduler_handoff(
            &mut store,
            second,
            Lane::TRANSITION_1,
            RootElementHandle::from_raw(12156),
        );

    let cross_root = execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        second_request,
        second_execution,
        Some(&first_queue_handoff),
    )
    .unwrap();

    assert_eq!(
            consume_transition_queue_lane_commit_currentness_for_canary(&mut store, &cross_root)
                .unwrap_err(),
            RootTransitionQueueLaneCommitCurrentnessErrorForCanary::UnacceptedTransitionContinuation {
                root: second,
                status: RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
            }
        );
    assert_eq!(store.root(second).unwrap().current(), second_current);

    let (mut store, root_id, stale_host) = root_store();
    let (_accepted, request, execution, queue_handoff) = transition_queue_lane_scheduler_handoff(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(12157),
    );
    let continuation = execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        request,
        execution,
        Some(&queue_handoff),
    )
    .unwrap();
    let stale_finished_work = continuation.commit().unwrap().finished_work();

    update_container_sync(
        &mut store,
        root_id,
        RootElementHandle::from_raw(12158),
        None,
    )
    .unwrap();
    let next_render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
    let next_commit = commit_finished_host_root(&mut store, next_render).unwrap();

    assert_eq!(
        consume_transition_queue_lane_commit_currentness_for_canary(&mut store, &continuation)
            .unwrap_err(),
        RootTransitionQueueLaneCommitCurrentnessErrorForCanary::FinishedWorkQueueLaneCurrentness(
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::LiveRootStateMismatch {
                root: root_id,
                expected_current: stale_finished_work,
                actual_current: next_commit.current(),
                expected_finished_work: None,
                actual_finished_work: None,
                expected_finished_lanes: Lanes::NO,
                actual_finished_lanes: Lanes::NO,
                expected_pending_lanes: Lanes::NO,
                actual_pending_lanes: Lanes::NO
            }
        )
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        next_commit.current()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(stale_host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_transition_queue_lane_currentness_rejects_unaccepted_queue_lane_evidence() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_accepted, request, execution, _queue_handoff) = transition_queue_lane_scheduler_handoff(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(12159),
    );

    let scheduler_only =
        execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store, request, execution, None,
        )
        .unwrap();

    assert_eq!(
            consume_transition_queue_lane_commit_currentness_for_canary(&mut store, &scheduler_only)
                .unwrap_err(),
            RootTransitionQueueLaneCommitCurrentnessErrorForCanary::UnacceptedTransitionContinuation {
                root: root_id,
                status: RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
            }
        );
    assert_eq!(store.root(root_id).unwrap().current(), current);

    let (mut store, root_id, host_stale_callback) = root_store();
    let (_accepted, request, execution, queue_handoff) = transition_queue_lane_scheduler_handoff(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(12163),
    );
    let first = execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        request,
        execution,
        Some(&queue_handoff),
    )
    .unwrap();
    let committed_current = first.commit().unwrap().current();
    let stale_callback =
        execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            request,
            execution,
            Some(&queue_handoff),
        )
        .unwrap();

    assert_eq!(
        stale_callback.status(),
        RootTransitionSchedulerQueueLaneContinuationStatusForCanary::StaleCallbackNode
    );
    assert_eq!(
        consume_transition_queue_lane_commit_currentness_for_canary(&mut store, &stale_callback)
            .unwrap_err(),
        RootTransitionQueueLaneCommitCurrentnessErrorForCanary::UnacceptedTransitionContinuation {
            root: root_id,
            status: RootTransitionSchedulerQueueLaneContinuationStatusForCanary::StaleCallbackNode
        }
    );
    assert_eq!(store.root(root_id).unwrap().current(), committed_current);

    let (mut store, root_id, host_wrong_finished_lanes) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_accepted, request, execution, queue_handoff) = transition_queue_lane_scheduler_handoff(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(12160),
    );
    let mut wrong_finished_lanes = queue_handoff.clone();
    wrong_finished_lanes.finished_lanes = Lanes::from(Lane::TRANSITION_2);
    let wrong_finished_lanes_continuation =
        execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            request,
            execution,
            Some(&wrong_finished_lanes),
        )
        .unwrap();

    assert_eq!(
            consume_transition_queue_lane_commit_currentness_for_canary(
                &mut store,
                &wrong_finished_lanes_continuation,
            )
            .unwrap_err(),
            RootTransitionQueueLaneCommitCurrentnessErrorForCanary::UnacceptedTransitionContinuation {
                root: root_id,
                status: RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
            }
        );
    assert_eq!(store.root(root_id).unwrap().current(), current);

    let (mut store, root_id, host_skipped) = root_store();
    let current = store.root(root_id).unwrap().current();
    let transition = update_container_transition_for_canary(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(12161),
        None,
    )
    .unwrap();
    let request = record_transition_lane_scheduler_request_from_update_diagnostics_for_canary(
        &mut store,
        &transition,
    )
    .unwrap();
    process_root_schedule_in_microtask(&mut store).unwrap();
    let callback = store.scheduler_bridge().callback_requests()[0];
    let validation =
        validate_scheduled_host_root_callback(&store, root_id, callback.node()).unwrap();
    let default_update = update_container(
        &mut store,
        root_id,
        RootElementHandle::from_raw(12162),
        None,
    )
    .unwrap();
    let render =
        render_host_root_for_lanes(&mut store, root_id, Lanes::from(Lane::TRANSITION_1)).unwrap();
    let current_queue_base_updates = store
        .update_queues()
        .base_updates(render.current_update_queue())
        .unwrap();
    let execution = RootSchedulerCallbackExecutionRecord {
        callback,
        validation,
        selected_lanes: Lanes::from(Lane::TRANSITION_1),
        status: RootSchedulerCallbackExecutionStatus::Rendered,
        render_phase: Some(render),
    };
    let skipped_handoff = HostRootUpdateQueueLaneHandoffRecordForCanary {
        root: root_id,
        current: render.current(),
        finished_work: render.finished_work(),
        current_update_queue: render.current_update_queue(),
        work_in_progress_update_queue: render.work_in_progress_update_queue(),
        pending_lanes_before_render: render.render_lanes().merge(render.remaining_lanes()),
        selected_next_lanes_before_render: render.render_lanes(),
        finished_lanes: render.render_lanes(),
        remaining_lanes: render.remaining_lanes(),
        pending_lanes_after_render: store.root(root_id).unwrap().lanes().pending_lanes(),
        update_records: vec![
            HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
                sequence: 0,
                update: transition.update(),
                lane: transition.lane(),
                source_lanes: Lanes::from(Lane::TRANSITION_1),
                pending_lanes_after_enqueue: transition.pending_lanes_after_enqueue(),
                selected_next_lanes_after_enqueue: transition.selected_next_lanes(),
            },
            HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
                sequence: 1,
                update: default_update.update(),
                lane: default_update.lane(),
                source_lanes: Lanes::DEFAULT,
                pending_lanes_after_enqueue: default_update.pending_lanes_after_enqueue(),
                selected_next_lanes_after_enqueue: default_update.selected_next_lanes(),
            },
        ],
        current_queue_base_updates,
        applied_update_count: render.applied_update_count(),
        skipped_update_count: render.skipped_update_count(),
        resulting_element: render.resulting_element(),
    };
    let skipped = execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        request,
        execution,
        Some(&skipped_handoff),
    )
    .unwrap();

    assert_eq!(
            consume_transition_queue_lane_commit_currentness_for_canary(&mut store, &skipped)
                .unwrap_err(),
            RootTransitionQueueLaneCommitCurrentnessErrorForCanary::UnacceptedTransitionContinuation {
                root: root_id,
                status: RootTransitionSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
            }
        );
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(host_stale_callback.operations(), Vec::<&'static str>::new());
    assert_eq!(
        host_wrong_finished_lanes.operations(),
        Vec::<&'static str>::new()
    );
    assert_eq!(host_skipped.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_passive_effect_scheduler_flush_gate_ignores_commits_without_handoff() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(401), None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let commit = commit_finished_host_root(&mut store, render).unwrap();

    let gate = schedule_passive_effects_flush_after_commit_for_canary(&mut store, &commit).unwrap();

    assert_eq!(gate.root(), root_id);
    assert_eq!(gate.finished_work(), None);
    assert_eq!(gate.lanes(), Lanes::NO);
    assert_eq!(gate.pending_record_count(), 0);
    assert_eq!(
        gate.status(),
        PassiveEffectSchedulerFlushGateStatus::NoPendingPassive
    );
    assert!(!gate.did_schedule_scheduler_flush_request());
    assert_eq!(gate.scheduler_request(), None);
    assert!(!gate.executes_public_effects());
    assert!(!gate.public_act_compatibility_claimed());
    assert!(!gate.public_scheduler_package_behavior_changed());
    assert!(
        store
            .scheduler_bridge()
            .passive_effects_flush_requests()
            .is_empty()
    );
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert!(store.scheduler_bridge().act_queue_requests().is_empty());
    assert!(store.scheduler_bridge().microtask_requests().is_empty());
    assert!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .pending_passive()
            .is_empty()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_passive_effect_scheduler_flush_gate_records_request_without_consuming() {
    let (mut store, root_id, host) = root_store();
    update_container(&mut store, root_id, RootElementHandle::from_raw(402), None).unwrap();
    let previous_current = store.root(root_id).unwrap().current();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let finished_work = render.finished_work();
    {
        let scheduling = store.root_mut(root_id).unwrap().scheduling_mut();
        scheduling.prepare_pending_passive(root_id, Lanes::NO);
        scheduling
            .pending_passive_mut()
            .queue_unmount(
                previous_current,
                PendingPassiveUnmountOrigin::UpdatedFiber,
                Lanes::SYNC,
            )
            .unwrap();
        scheduling
            .pending_passive_mut()
            .queue_mount(finished_work, Lanes::DEFAULT)
            .unwrap();
    }
    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let microtask_request_count = store.scheduler_bridge().microtask_requests().len();

    let gate = schedule_passive_effects_flush_after_commit_for_canary(&mut store, &commit).unwrap();

    assert_eq!(gate.root(), root_id);
    assert_eq!(gate.finished_work(), Some(finished_work));
    assert_eq!(gate.lanes(), Lanes::DEFAULT);
    assert_eq!(gate.pending_unmount_count(), 1);
    assert_eq!(gate.pending_mount_count(), 1);
    assert_eq!(gate.pending_record_count(), 2);
    assert_eq!(
        gate.status(),
        PassiveEffectSchedulerFlushGateStatus::Scheduled
    );
    assert!(gate.did_schedule_scheduler_flush_request());
    assert!(!gate.executes_public_effects());
    assert!(!gate.public_act_compatibility_claimed());
    assert!(!gate.public_scheduler_package_behavior_changed());

    let request = gate.scheduler_request().unwrap();
    assert_eq!(request.order(), 0);
    assert_eq!(request.node(), RootSchedulerCallbackHandle::from_raw(1));
    assert_eq!(request.root(), root_id);
    assert_eq!(request.finished_work(), finished_work);
    assert_eq!(request.lanes(), Lanes::DEFAULT);
    assert_eq!(request.pending_unmount_count(), 1);
    assert_eq!(request.pending_mount_count(), 1);
    assert_eq!(request.pending_record_count(), 2);
    assert_eq!(request.scheduler_priority(), SchedulerPriority::Normal);
    assert!(!request.executes_public_effects());
    assert!(!request.public_act_compatibility_claimed());
    assert!(!request.public_scheduler_package_behavior_changed());
    assert_eq!(
        store.scheduler_bridge().passive_effects_flush_requests(),
        &[request]
    );
    assert_eq!(
        store.scheduler_bridge().callback_requests().len(),
        callback_request_count
    );
    assert_eq!(
        store.scheduler_bridge().act_queue_requests().len(),
        act_queue_request_count
    );
    assert_eq!(
        store.scheduler_bridge().microtask_requests().len(),
        microtask_request_count
    );
    let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();
    assert_eq!(pending_passive.root(), Some(root_id));
    assert_eq!(pending_passive.finished_work(), Some(finished_work));
    assert_eq!(pending_passive.lanes(), Lanes::DEFAULT);
    assert!(pending_passive.has_commit_handoff());
    assert_eq!(pending_passive.passive_unmounts().len(), 1);
    assert_eq!(pending_passive.passive_mounts().len(), 1);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_preserves_multiple_root_insertion_order() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let second = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let third = store
        .create_client_root(FakeContainer::new(3), RootOptions::new())
        .unwrap();

    schedule_default_update(&mut store, first);
    schedule_default_update(&mut store, second);
    schedule_default_update(&mut store, third);

    assert_eq!(scheduled_roots(&store).unwrap(), vec![first, second, third]);
    assert_eq!(
        store
            .root(first)
            .unwrap()
            .scheduling()
            .next_scheduled_root(),
        Some(second)
    );
    assert_eq!(
        store
            .root(second)
            .unwrap()
            .scheduling()
            .next_scheduled_root(),
        Some(third)
    );
    assert_eq!(store.root_scheduler().last_scheduled_root(), Some(third));
}

#[test]
fn root_scheduler_sync_lane_marks_possible_sync_work_and_bypasses_async_callback() {
    let (mut store, root_id, _host) = root_store();
    let result = update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
    let scheduled = ensure_root_is_scheduled(&mut store, result.schedule()).unwrap();

    let processed = process_root_schedule_in_microtask(&mut store).unwrap();

    assert!(scheduled.might_have_pending_sync_work());
    assert!(store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(processed.records().len(), 1);
    assert_eq!(
        processed.records()[0].outcome(),
        RootTaskScheduleOutcome::Sync
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        RootSchedulerCallbackHandle::NONE
    );
    assert_eq!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .callback_priority(),
        RootCallbackPriority::new(Lane::SYNC)
    );
    assert!(store.scheduler_bridge().callback_requests().is_empty());
}

#[test]
fn root_scheduler_non_sync_lane_requests_bridge_callback() {
    let (mut store, root_id, _host) = root_store();
    schedule_default_update(&mut store, root_id);

    let processed = process_root_schedule_in_microtask(&mut store).unwrap();

    assert_eq!(
        processed.records()[0].outcome(),
        RootTaskScheduleOutcome::Scheduled
    );
    assert_eq!(
        processed.records()[0].scheduler_priority(),
        Some(SchedulerPriority::Normal)
    );
    assert_eq!(store.scheduler_bridge().callback_requests().len(), 1);
    assert_eq!(
        store.scheduler_bridge().callback_requests()[0].root(),
        root_id
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        store.scheduler_bridge().callback_requests()[0].node()
    );
    assert!(processed.records()[0].scheduled_act_queue_task().is_none());
    assert!(store.scheduler_bridge().act_queue_requests().is_empty());
}

#[test]
fn root_scheduler_non_sync_lane_routes_callback_to_act_queue() {
    let (mut store, root_id, _host) = root_store();
    activate_act_queue(&mut store);
    schedule_default_update(&mut store, root_id);

    let processed = process_root_schedule_in_microtask(&mut store).unwrap();

    let act_callback = processed.records()[0].scheduled_act_queue_task().unwrap();
    assert_eq!(
        processed.records()[0].outcome(),
        RootTaskScheduleOutcome::Scheduled
    );
    assert_eq!(
        processed.records()[0].callback_node(),
        SchedulerBridge::fake_act_callback_node()
    );
    assert_eq!(
        act_callback.kind(),
        SchedulerActQueueTaskKind::RenderCallback
    );
    assert_eq!(act_callback.root(), Some(root_id));
    assert_eq!(
        act_callback.scheduler_priority(),
        Some(SchedulerPriority::Normal)
    );
    assert_eq!(
        act_callback.node(),
        SchedulerBridge::fake_act_callback_node()
    );
    assert!(processed.records()[0].scheduled_callback().is_none());
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert_eq!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        SchedulerBridge::fake_act_callback_node()
    );
    assert_eq!(store.scheduler_bridge().act_queue_requests().len(), 2);
    assert_eq!(
        store.scheduler_bridge().act_queue_requests()[0].kind(),
        SchedulerActQueueTaskKind::RootSchedule
    );
    assert_eq!(
        store.scheduler_bridge().act_queue_requests()[1],
        act_callback
    );
}

#[test]
fn root_scheduler_act_queue_execution_consumes_root_schedule_and_render_callback() {
    let (mut store, root_id, host) = root_store();
    activate_act_queue(&mut store);
    let current = store.root(root_id).unwrap().current();
    schedule_default_update(&mut store, root_id);
    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_expired(Lanes::DEFAULT);

    let execution =
        execute_scheduler_bridge_act_queue_for_canary(&mut store, 1_000_000, &[]).unwrap();

    assert_eq!(execution.request_records().len(), 2);
    assert_eq!(execution.consumed_request_count(), 2);
    assert_eq!(execution.rejected_request_count(), 0);
    assert_eq!(execution.executed_render_callback_count(), 1);
    assert!(execution.did_consume_queued_act_requests());
    assert!(execution.did_execute_accepted_render_callbacks());
    assert!(execution.records_preserve_act_queue_order());
    assert!(execution.routed_private_act_queue_requests_and_continuations_for_canary());
    assert!(!execution.drains_public_react_act_queue());
    assert!(!execution.public_act_compatibility_claimed());
    assert!(!execution.public_root_compatibility_claimed());
    assert!(!execution.public_flush_sync_compatibility_claimed());
    assert!(!execution.public_scheduler_timing_compatibility_claimed());
    assert!(!execution.executes_effects());
    assert!(execution.continuation_execution().is_none());

    let root_schedule = &execution.request_records()[0];
    assert_eq!(root_schedule.execution_order(), 0);
    assert_eq!(root_schedule.queue_order(), 0);
    assert_eq!(
        root_schedule.request().kind(),
        SchedulerActQueueTaskKind::RootSchedule
    );
    assert!(root_schedule.did_process_root_schedule());
    let processed = root_schedule.root_schedule().unwrap();
    assert_eq!(processed.records().len(), 1);
    assert_eq!(
        processed.records()[0].outcome(),
        RootTaskScheduleOutcome::Scheduled
    );
    assert!(processed.records()[0].scheduled_act_queue_task().is_some());
    assert!(!root_schedule.drains_public_react_act_queue());
    assert!(!root_schedule.public_act_compatibility_claimed());
    assert!(!root_schedule.public_root_compatibility_claimed());
    assert!(!root_schedule.public_scheduler_timing_compatibility_claimed());
    assert!(!root_schedule.executes_effects());

    let render_callback = &execution.request_records()[1];
    assert_eq!(render_callback.execution_order(), 1);
    assert_eq!(render_callback.queue_order(), 1);
    assert_eq!(
        render_callback.request().kind(),
        SchedulerActQueueTaskKind::RenderCallback
    );
    assert_eq!(
        render_callback.status(),
        SchedulerBridgeActQueueRequestExecutionStatus::RenderCallbackRenderedAndCommitted
    );
    assert!(render_callback.did_execute_accepted_render_callback());
    assert!(render_callback.accepted_root_scheduler_execution_evidence_for_canary());
    assert!(!render_callback.drains_public_react_act_queue());
    assert!(!render_callback.public_act_compatibility_claimed());
    assert!(!render_callback.public_root_compatibility_claimed());
    assert!(!render_callback.public_scheduler_timing_compatibility_claimed());
    assert!(!render_callback.executes_effects());

    let expired = render_callback.render_callback().unwrap();
    assert_eq!(expired.root(), root_id);
    assert!(expired.did_execute_expired_lane_sync_continuation());
    assert!(expired.consumed_accepted_scheduler_continuation_record());
    assert_eq!(expired.selected_expired_lanes(), Lanes::DEFAULT);
    let continuation = expired.continuation().unwrap();
    assert!(continuation.routed_through_root_scheduler_and_commit_evidence_for_canary());
    assert_eq!(
        continuation.status(),
        RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted
    );
    assert_eq!(continuation.selected_lanes(), Lanes::DEFAULT);
    assert_eq!(
        continuation.commit().unwrap().finished_lanes(),
        Lanes::DEFAULT
    );
    assert_ne!(store.root(root_id).unwrap().current(), current);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert_eq!(
        store.scheduler_bridge().act_queue_consumed_request_count(),
        2
    );
    assert_eq!(
        store.scheduler_bridge().pending_act_queue_request_count(),
        0
    );
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_act_queue_execution_rejects_stale_render_callback() {
    let (mut store, root_id, host) = root_store();
    activate_act_queue(&mut store);
    let current = store.root(root_id).unwrap().current();
    schedule_default_update(&mut store, root_id);
    process_root_schedule_in_microtask(&mut store).unwrap();
    let render_request = store.scheduler_bridge().act_queue_requests()[1];
    store
        .root_mut(root_id)
        .unwrap()
        .scheduling_mut()
        .clear_callback();

    let record = execute_scheduler_bridge_act_queue_request_for_canary(
        &mut store,
        0,
        1_000_000,
        render_request,
    )
    .unwrap();

    assert_eq!(
        record.status(),
        SchedulerBridgeActQueueRequestExecutionStatus::RenderCallbackStaleCallbackNode
    );
    assert!(record.stale_render_callback());
    assert!(!record.did_execute_accepted_render_callback());
    assert!(!record.accepted_root_scheduler_execution_evidence_for_canary());
    assert!(!record.drains_public_react_act_queue());
    assert!(!record.public_act_compatibility_claimed());
    assert!(!record.public_root_compatibility_claimed());
    assert!(!record.public_scheduler_timing_compatibility_claimed());
    assert!(!record.executes_effects());
    let expired = record.render_callback().unwrap();
    assert!(expired.rejected_stale_callback_node());
    assert_eq!(expired.requested_callback_node(), render_request.node());
    assert_eq!(
        expired.current_callback_node(),
        RootSchedulerCallbackHandle::NONE
    );
    assert!(expired.continuation().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::DEFAULT
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_act_queue_execution_rejects_foreign_unqueued_request() {
    let (mut foreign_store, foreign_root, _foreign_host) = root_store();
    activate_act_queue(&mut foreign_store);
    schedule_default_update(&mut foreign_store, foreign_root);
    let foreign_request = foreign_store.scheduler_bridge().act_queue_requests()[0];

    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let record = execute_scheduler_bridge_act_queue_request_for_canary(
        &mut store,
        0,
        1_000_000,
        foreign_request,
    )
    .unwrap();

    assert_eq!(
        record.status(),
        SchedulerBridgeActQueueRequestExecutionStatus::RejectedUnqueuedRequest
    );
    assert!(record.rejected_unqueued_request());
    assert!(!record.did_process_root_schedule());
    assert!(!record.did_execute_accepted_render_callback());
    assert!(record.root_schedule().is_none());
    assert!(record.render_callback().is_none());
    assert!(!record.drains_public_react_act_queue());
    assert!(!record.public_act_compatibility_claimed());
    assert!(!record.public_root_compatibility_claimed());
    assert!(!record.public_scheduler_timing_compatibility_claimed());
    assert!(!record.executes_effects());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert!(store.scheduler_bridge().act_queue_requests().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_act_queue_helper_routes_fabricated_continuation_to_existing_rejection() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    schedule_default_update(&mut store, root_id);
    let fabricated = SyncFlushActContinuationDrainRecord {
        root: root_id,
        sync_flush_order: 88,
        flushed_lanes: Lanes::SYNC,
        remaining_lanes: Lanes::DEFAULT,
        continuation_lanes: Lanes::DEFAULT,
        act_scope_depth: 1,
        nested_act_scope: false,
        source_status: SchedulerActContinuationStatus::PendingContinuation,
        host_output_canary_committed: true,
    };

    let execution =
        execute_scheduler_bridge_act_queue_for_canary(&mut store, 1_000_000, &[fabricated])
            .unwrap();

    assert!(execution.request_records().is_empty());
    assert_eq!(execution.consumed_request_count(), 0);
    assert_eq!(execution.rejected_request_count(), 0);
    assert!(!execution.did_consume_queued_act_requests());
    assert!(!execution.did_execute_accepted_render_callbacks());
    assert!(!execution.routed_private_act_queue_requests_and_continuations_for_canary());
    assert!(!execution.drains_public_react_act_queue());
    assert!(!execution.public_act_compatibility_claimed());
    assert!(!execution.public_root_compatibility_claimed());
    assert!(!execution.public_flush_sync_compatibility_claimed());
    assert!(!execution.public_scheduler_timing_compatibility_claimed());
    assert!(!execution.executes_effects());

    let continuation_execution = execution.continuation_execution().unwrap();
    assert_eq!(continuation_execution.records().len(), 1);
    assert_eq!(continuation_execution.executed_count(), 0);
    assert_eq!(continuation_execution.rejected_count(), 1);
    assert_eq!(continuation_execution.blocked_count(), 0);
    assert!(!continuation_execution.did_execute_accepted_internal_act_continuations());
    let rejected = &continuation_execution.records()[0];
    assert_eq!(
        rejected.status(),
        SchedulerBridgeActContinuationExecutionStatus::RejectedContinuation
    );
    assert!(rejected.rejected_unaccepted_continuation());
    assert_eq!(rejected.continuation(), fabricated);
    assert!(!rejected.drains_public_react_act_queue());
    assert!(!rejected.public_act_compatibility_claimed());
    assert!(!rejected.public_flush_sync_compatibility_claimed());
    assert!(!rejected.public_scheduler_timing_compatibility_claimed());
    assert!(!rejected.executes_effects());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::DEFAULT
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_suspended_unpinged_warm_lanes_do_not_schedule_async_callback() {
    let (mut store, root_id, _host) = root_store();
    schedule_default_update(&mut store, root_id);
    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_suspended(Lanes::DEFAULT, Lane::NO, true);

    let processed = process_root_schedule_in_microtask(&mut store).unwrap();

    assert_eq!(processed.records().len(), 1);
    assert_eq!(
        processed.records()[0].outcome(),
        RootTaskScheduleOutcome::NoWork
    );
    assert_eq!(processed.records()[0].next_lanes(), Lanes::NO);
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert_eq!(scheduled_roots(&store).unwrap(), Vec::<FiberRootId>::new());
}

#[test]
fn root_scheduler_pinged_suspended_lanes_schedule_async_callback() {
    let (mut store, root_id, _host) = root_store();
    schedule_default_update(&mut store, root_id);
    {
        let lanes = store.root_mut(root_id).unwrap().lanes_mut();
        lanes.mark_suspended(Lanes::DEFAULT, Lane::NO, true);
        lanes.mark_pinged(Lanes::DEFAULT);
    }

    let processed = process_root_schedule_in_microtask(&mut store).unwrap();

    assert_eq!(
        processed.records()[0].outcome(),
        RootTaskScheduleOutcome::Scheduled
    );
    assert_eq!(processed.records()[0].next_lanes(), Lanes::DEFAULT);
    assert_eq!(
        processed.records()[0].scheduler_priority(),
        Some(SchedulerPriority::Normal)
    );
    assert_eq!(store.scheduler_bridge().callback_requests().len(), 1);
    assert_eq!(
        store.scheduler_bridge().callback_requests()[0].root(),
        root_id
    );
}

#[test]
fn root_scheduler_pinged_retry_lane_schedules_deterministic_callback_metadata() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    schedule_default_update(&mut store, root_id);
    let retry_lanes = Lanes::from(Lane::RETRY_1).merge_lane(Lane::RETRY_2);
    let retry_and_offscreen = retry_lanes.merge(Lanes::OFFSCREEN);
    {
        let lanes = store.root_mut(root_id).unwrap().lanes_mut();
        lanes.mark_updated(Lane::RETRY_1);
        lanes.mark_updated(Lane::RETRY_2);
        lanes.mark_updated(Lane::OFFSCREEN);
        lanes.mark_finished(RootFinishedLanes::new(Lanes::DEFAULT, retry_and_offscreen));
        lanes.mark_suspended(retry_and_offscreen, Lane::NO, true);
        lanes.mark_pinged(Lanes::from(Lane::RETRY_2));
    }

    let processed = process_root_schedule_in_microtask(&mut store).unwrap();
    let record = processed.records()[0];
    let scheduled_callback = record.scheduled_callback().unwrap();

    assert_eq!(record.outcome(), RootTaskScheduleOutcome::Scheduled);
    assert_eq!(record.next_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(
        record.callback_priority(),
        RootCallbackPriority::new(Lane::RETRY_2)
    );
    assert_eq!(record.callback_node(), scheduled_callback.node());
    assert_eq!(record.scheduler_priority(), Some(SchedulerPriority::Normal));
    assert_eq!(record.scheduled_act_queue_task(), None);
    assert_eq!(record.canceled_callback(), None);
    assert_eq!(scheduled_callback.root(), root_id);
    assert_eq!(
        scheduled_callback.callback_priority(),
        RootCallbackPriority::new(Lane::RETRY_2)
    );
    assert_eq!(
        scheduled_callback.scheduler_priority(),
        SchedulerPriority::Normal
    );
    assert_eq!(
        store.scheduler_bridge().callback_requests(),
        &[scheduled_callback]
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        scheduled_callback.node()
    );
    assert_eq!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .callback_priority(),
        RootCallbackPriority::new(Lane::RETRY_2)
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        retry_and_offscreen
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().suspended_lanes(),
        retry_and_offscreen
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().pinged_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().warm_lanes(),
        Lanes::from(Lane::RETRY_1).merge(Lanes::OFFSCREEN)
    );
    assert_eq!(scheduled_roots(&store).unwrap(), vec![root_id]);
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_suspense_thenable_retry_request_marks_pinged_lanes_and_schedules_root() {
    let (mut store, root_id, host) = root_store();
    let suspense = attach_suspense_retry_boundary(
        &mut store,
        root_id,
        Lanes::from(Lane::RETRY_2),
        UpdateQueueHandle::from_raw(941),
        Some(UpdateQueueHandle::from_raw(942)),
    );
    mark_suspended_lane(&mut store, root_id, Lane::RETRY_2);

    let request =
        request_suspense_thenable_retry_root_scheduler(&mut store, root_id, &suspense).unwrap();

    assert_eq!(
        suspense.thenable_ping_blocker().retry_queue_kind(),
        UnsupportedThenableRetryQueueKind::SuspenseBoundaryAndPrimaryOffscreen
    );
    assert!(
        suspense
            .thenable_ping_blocker()
            .is_accepted_suspense_retry_ping_blocker()
    );
    assert_eq!(
        request.status(),
        SuspenseThenableRetryRootSchedulerStatus::Accepted
    );
    assert!(request.accepted());
    assert!(request.thenable_ping_scheduled_expected_retry_lane());
    assert_eq!(request.root(), root_id);
    assert_eq!(request.boundary(), suspense.fiber());
    assert_eq!(request.retry_queue(), UpdateQueueHandle::from_raw(941));
    assert_eq!(
        request.primary_offscreen_retry_queue(),
        Some(UpdateQueueHandle::from_raw(942))
    );
    assert_eq!(request.retry_lane(), Lane::RETRY_2);
    assert_eq!(request.pinged_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(request.root_pinged_lanes_before(), Lanes::NO);
    assert_eq!(
        request.root_pinged_lanes_after(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(
        request.scheduler_callback_blockers(),
        &SUSPENSE_THENABLE_RETRY_SCHEDULER_CALLBACK_BLOCKERS
    );
    assert_eq!(
        request.scheduler_callback_blockers(),
        &[
            SuspenseThenableRetrySchedulerCallbackBlocker::SuspenseBoundaryRendering,
            SuspenseThenableRetrySchedulerCallbackBlocker::FallbackTraversal,
            SuspenseThenableRetrySchedulerCallbackBlocker::WakeableSubscription,
            SuspenseThenableRetrySchedulerCallbackBlocker::PublicSuspenseCompatibility,
        ]
    );
    assert!(!request.suspense_boundary_rendering_executed());
    assert!(!request.fallback_traversal_executed());
    assert!(!request.wakeable_subscription_performed());
    assert!(!request.public_suspense_compatibility_claimed());

    let scheduled_root = request.scheduled_root().unwrap();
    assert_eq!(scheduled_root.root(), root_id);
    assert!(scheduled_root.inserted());
    assert!(scheduled_root.microtask().is_some());
    assert_eq!(scheduled_root.act_queue_task(), None);
    assert_eq!(scheduled_roots(&store).unwrap(), vec![root_id]);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().suspended_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().pinged_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert!(store.scheduler_bridge().callback_requests().is_empty());

    let processed = process_root_schedule_in_microtask(&mut store).unwrap();
    let scheduled_callback = processed.records()[0].scheduled_callback().unwrap();
    assert_eq!(
        processed.records()[0].outcome(),
        RootTaskScheduleOutcome::Scheduled
    );
    assert_eq!(
        processed.records()[0].next_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(
        scheduled_callback.callback_priority(),
        RootCallbackPriority::new(Lane::RETRY_2)
    );
    assert_eq!(
        store.scheduler_bridge().callback_requests(),
        &[scheduled_callback]
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_suspense_thenable_retry_request_rejects_blocked_records() {
    let (mut offscreen_store, offscreen_root, _host) = root_store();
    let offscreen_only = attach_suspense_retry_boundary(
        &mut offscreen_store,
        offscreen_root,
        Lanes::from(Lane::RETRY_1),
        UpdateQueueHandle::NONE,
        Some(UpdateQueueHandle::from_raw(952)),
    );
    mark_suspended_lane(&mut offscreen_store, offscreen_root, Lane::RETRY_1);

    let offscreen_request = request_suspense_thenable_retry_root_scheduler(
        &mut offscreen_store,
        offscreen_root,
        &offscreen_only,
    )
    .unwrap();

    assert_eq!(
        offscreen_only.thenable_ping_blocker().retry_queue_kind(),
        UnsupportedThenableRetryQueueKind::PrimaryOffscreen
    );
    assert!(
        offscreen_only
            .thenable_ping_blocker()
            .is_offscreen_only_retry_queue()
    );
    assert_eq!(
        offscreen_request.status(),
        SuspenseThenableRetryRootSchedulerStatus::RejectedOffscreenOnlyRecord
    );
    assert_eq!(offscreen_request.scheduled_root(), None);
    assert_eq!(
        offscreen_store
            .root(offscreen_root)
            .unwrap()
            .lanes()
            .pinged_lanes(),
        Lanes::NO
    );
    assert!(
        offscreen_store
            .scheduler_bridge()
            .microtask_requests()
            .is_empty()
    );

    let (mut stale_store, stale_root, _host) = root_store();
    let stale = attach_suspense_retry_boundary(
        &mut stale_store,
        stale_root,
        Lanes::from(Lane::RETRY_2),
        UpdateQueueHandle::from_raw(961),
        Some(UpdateQueueHandle::from_raw(962)),
    );
    mark_suspended_lane(&mut stale_store, stale_root, Lane::RETRY_2);
    let stale_host_root = stale_store.root(stale_root).unwrap().current();
    stale_store
        .fiber_arena_mut()
        .set_children(stale_host_root, &[])
        .unwrap();

    let stale_request =
        request_suspense_thenable_retry_root_scheduler(&mut stale_store, stale_root, &stale)
            .unwrap();

    assert_eq!(
        stale_request.status(),
        SuspenseThenableRetryRootSchedulerStatus::RejectedStaleBoundary
    );
    assert_eq!(stale_request.scheduled_root(), None);
    assert_eq!(
        stale_store.root(stale_root).unwrap().lanes().pinged_lanes(),
        Lanes::NO
    );
    assert!(
        stale_store
            .scheduler_bridge()
            .microtask_requests()
            .is_empty()
    );

    let (mut lane_store, lane_root, _host) = root_store();
    let incompatible_lanes = attach_suspense_retry_boundary(
        &mut lane_store,
        lane_root,
        Lanes::DEFAULT,
        UpdateQueueHandle::from_raw(971),
        Some(UpdateQueueHandle::from_raw(972)),
    );
    mark_suspended_lane(&mut lane_store, lane_root, Lane::DEFAULT);

    let lane_request = request_suspense_thenable_retry_root_scheduler(
        &mut lane_store,
        lane_root,
        &incompatible_lanes,
    )
    .unwrap();

    assert!(
        incompatible_lanes
            .thenable_ping_blocker()
            .has_suspense_boundary_retry_queue()
    );
    assert!(
        !incompatible_lanes
            .thenable_ping_blocker()
            .has_compatible_retry_ping_lanes()
    );
    assert_eq!(
        lane_request.status(),
        SuspenseThenableRetryRootSchedulerStatus::RejectedIncompatibleLaneSet
    );
    assert_eq!(lane_request.scheduled_root(), None);
    assert!(
        lane_store
            .scheduler_bridge()
            .microtask_requests()
            .is_empty()
    );

    let (mut root_lane_store, root_lane_root, _host) = root_store();
    let root_lane_mismatch = attach_suspense_retry_boundary(
        &mut root_lane_store,
        root_lane_root,
        Lanes::from(Lane::RETRY_3),
        UpdateQueueHandle::from_raw(981),
        Some(UpdateQueueHandle::from_raw(982)),
    );
    mark_suspended_lane(&mut root_lane_store, root_lane_root, Lane::RETRY_2);

    let root_lane_request = request_suspense_thenable_retry_root_scheduler(
        &mut root_lane_store,
        root_lane_root,
        &root_lane_mismatch,
    )
    .unwrap();

    assert!(
        root_lane_mismatch
            .thenable_ping_blocker()
            .has_compatible_retry_ping_lanes()
    );
    assert_eq!(
        root_lane_request.status(),
        SuspenseThenableRetryRootSchedulerStatus::RejectedIncompatibleLaneSet
    );
    assert_eq!(root_lane_request.scheduled_root(), None);
    assert_eq!(
        root_lane_store
            .root(root_lane_root)
            .unwrap()
            .lanes()
            .pinged_lanes(),
        Lanes::NO
    );
    assert!(
        root_lane_store
            .scheduler_bridge()
            .microtask_requests()
            .is_empty()
    );
}

#[test]
fn root_scheduler_pinged_retry_execution_path_reselects_and_renders_host_root_handoff() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    schedule_default_update(&mut store, root_id);
    let retry_lanes = Lanes::from(Lane::RETRY_1).merge_lane(Lane::RETRY_2);
    let retry_and_offscreen = retry_lanes.merge(Lanes::OFFSCREEN);
    {
        let lanes = store.root_mut(root_id).unwrap().lanes_mut();
        lanes.mark_updated(Lane::RETRY_1);
        lanes.mark_updated(Lane::RETRY_2);
        lanes.mark_updated(Lane::OFFSCREEN);
        lanes.mark_finished(RootFinishedLanes::new(Lanes::DEFAULT, retry_and_offscreen));
        lanes.mark_suspended(retry_and_offscreen, Lane::NO, true);
        lanes.mark_pinged(Lanes::from(Lane::RETRY_2));
    }
    let processed = process_root_schedule_in_microtask(&mut store).unwrap();
    let callback = processed.records()[0].scheduled_callback().unwrap();

    let execution = execute_pinged_retry_root_callback(&mut store, callback).unwrap();
    let render = execution.render_phase().unwrap();

    assert_eq!(execution.callback(), callback);
    assert_eq!(execution.root(), root_id);
    assert_eq!(execution.callback_node(), callback.node());
    assert!(!execution.validation().is_stale());
    assert_eq!(execution.status(), RootPingedRetryExecutionStatus::Rendered);
    assert_eq!(execution.pinged_retry_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(
        execution.selected_priority_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(
        execution.selected_render_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(render.root(), root_id);
    assert_eq!(render.current(), current);
    assert_eq!(render.render_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(render.applied_update_count(), 0);
    assert_eq!(render.skipped_update_count(), 1);
    assert_eq!(render.resulting_element(), RootElementHandle::NONE);
    assert_eq!(render.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(render.work_in_progress())
    );
    assert_eq!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .work_in_progress_root_render_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        retry_and_offscreen
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().suspended_lanes(),
        retry_and_offscreen
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().pinged_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().warm_lanes(),
        Lanes::from(Lane::RETRY_1).merge(Lanes::OFFSCREEN)
    );
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_suspense_thenable_retry_render_handoff_records_root_work_loop_evidence() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let suspense = attach_suspense_retry_boundary(
        &mut store,
        root_id,
        Lanes::from(Lane::RETRY_2),
        UpdateQueueHandle::from_raw(996),
        Some(UpdateQueueHandle::from_raw(997)),
    );
    mark_suspended_lane(&mut store, root_id, Lane::RETRY_2);

    let request =
        request_suspense_thenable_retry_root_scheduler(&mut store, root_id, &suspense).unwrap();
    let processed = process_root_schedule_in_microtask(&mut store).unwrap();
    let schedule = processed.records()[0];
    let callback = schedule.scheduled_callback().unwrap();
    let handoff =
        execute_suspense_thenable_retry_root_render_handoff(&mut store, request, callback).unwrap();
    let execution = handoff.execution();
    let render = handoff.render_phase().unwrap();

    assert_eq!(handoff.request(), request);
    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.boundary(), suspense.fiber());
    assert_eq!(handoff.retry_lane(), Lane::RETRY_2);
    assert_eq!(handoff.pinged_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(handoff.callback(), callback);
    assert_eq!(handoff.scheduled_root(), request.scheduled_root());
    assert!(handoff.thenable_ping_scheduled_expected_retry_lane());
    assert!(handoff.thenable_ping_reached_expected_retry_handoff());
    assert!(handoff.root_work_loop_reached());
    assert!(handoff.proves_private_thenable_ping_render_handoff());
    assert!(!handoff.suspense_boundary_rendering_executed());
    assert!(!handoff.fallback_traversal_executed());
    assert!(!handoff.wakeable_subscription_performed());
    assert!(!handoff.public_suspense_compatibility_claimed());
    assert!(!handoff.public_root_compatibility_claimed());

    assert_eq!(schedule.root(), root_id);
    assert_eq!(schedule.outcome(), RootTaskScheduleOutcome::Scheduled);
    assert_eq!(schedule.next_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(handoff.status(), RootPingedRetryExecutionStatus::Rendered);
    assert_eq!(execution.pinged_retry_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(
        execution.selected_priority_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(
        execution.selected_render_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(render.root(), root_id);
    assert_eq!(render.current(), current);
    assert_eq!(render.render_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(render.resulting_element(), RootElementHandle::NONE);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(render.work_in_progress())
    );
    assert_eq!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .render_exit_status(),
        RootRenderExitStatus::Completed
    );
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pinged_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_pinged_retry_execution_path_rejects_non_retry_selection() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let callback = scheduled_callback_request(&mut store, root_id);

    let execution = execute_pinged_retry_root_callback(&mut store, callback).unwrap();

    assert_eq!(
        execution.status(),
        RootPingedRetryExecutionStatus::NoPingedRetryWork
    );
    assert!(!execution.validation().is_stale());
    assert_eq!(execution.pinged_retry_lanes(), Lanes::NO);
    assert_eq!(execution.selected_priority_lanes(), Lanes::DEFAULT);
    assert_eq!(execution.selected_render_lanes(), Lanes::DEFAULT);
    assert_eq!(execution.render_phase(), None);
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.fiber_arena().get(current).unwrap().alternate(), None);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        callback.node()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_pinged_retry_execution_path_rejects_non_retry_reselection() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let suspense = attach_suspense_retry_boundary(
        &mut store,
        root_id,
        Lanes::from(Lane::RETRY_2),
        UpdateQueueHandle::from_raw(991),
        Some(UpdateQueueHandle::from_raw(992)),
    );
    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_updated(Lane::DEFAULT);
    mark_suspended_lane(&mut store, root_id, Lane::RETRY_2);
    let request =
        request_suspense_thenable_retry_root_scheduler(&mut store, root_id, &suspense).unwrap();
    let processed = process_root_schedule_in_microtask(&mut store).unwrap();
    let callback = processed.records()[0].scheduled_callback().unwrap();

    let execution =
        execute_suspense_thenable_retry_root_callback(&mut store, request, callback).unwrap();

    assert_eq!(
        execution.status(),
        RootPingedRetryExecutionStatus::NoPingedRetryWork
    );
    assert!(!execution.validation().is_stale());
    assert_eq!(execution.pinged_retry_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(execution.selected_priority_lanes(), Lanes::DEFAULT);
    assert_eq!(execution.selected_render_lanes(), Lanes::DEFAULT);
    assert_eq!(execution.render_phase(), None);
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        None
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        callback.node()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_pinged_retry_execution_path_rejects_stale_thenable_blocker() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let suspense = attach_suspense_retry_boundary(
        &mut store,
        root_id,
        Lanes::from(Lane::RETRY_2),
        UpdateQueueHandle::from_raw(993),
        Some(UpdateQueueHandle::from_raw(994)),
    );
    mark_suspended_lane(&mut store, root_id, Lane::RETRY_2);
    let request =
        request_suspense_thenable_retry_root_scheduler(&mut store, root_id, &suspense).unwrap();
    let processed = process_root_schedule_in_microtask(&mut store).unwrap();
    let callback = processed.records()[0].scheduled_callback().unwrap();
    store
        .fiber_arena_mut()
        .get_mut(suspense.fiber())
        .unwrap()
        .set_update_queue(UpdateQueueHandle::from_raw(995));

    let execution =
        execute_suspense_thenable_retry_root_callback(&mut store, request, callback).unwrap();

    assert_eq!(
        execution.status(),
        RootPingedRetryExecutionStatus::StaleThenableBlocker
    );
    assert!(!execution.validation().is_stale());
    assert_eq!(execution.pinged_retry_lanes(), Lanes::from(Lane::RETRY_2));
    assert_eq!(execution.selected_priority_lanes(), Lanes::NO);
    assert_eq!(execution.selected_render_lanes(), Lanes::NO);
    assert_eq!(execution.render_phase(), None);
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        None
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        callback.node()
    );
    assert_eq!(
        store.root(root_id).unwrap().lanes().pinged_lanes(),
        Lanes::from(Lane::RETRY_2)
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_prewarm_lane_selection_fails_closed_with_pending_commit() {
    let mut root_lanes = RootLaneState::new();
    root_lanes.mark_updated(Lane::DEFAULT);
    root_lanes.mark_suspended(Lanes::DEFAULT, Lane::NO, false);

    let without_pending_commit = select_lanes_from_root_state(&root_lanes, Lanes::NO, false);
    let with_pending_commit = select_lanes_from_root_state(&root_lanes, Lanes::NO, true);

    assert_eq!(without_pending_commit.priority_lanes(), Lanes::DEFAULT);
    assert_eq!(without_pending_commit.render_lanes(), Lanes::DEFAULT);
    assert_eq!(with_pending_commit.priority_lanes(), Lanes::NO);
    assert_eq!(with_pending_commit.render_lanes(), Lanes::NO);
}

#[test]
fn root_scheduler_idle_work_waits_behind_suspended_non_idle_work() {
    let (mut store, root_id, _host) = root_store();
    schedule_default_update(&mut store, root_id);
    {
        let lanes = store.root_mut(root_id).unwrap().lanes_mut();
        lanes.mark_suspended(Lanes::DEFAULT, Lane::NO, true);
        lanes.mark_updated(Lane::IDLE);
    }

    let processed = process_root_schedule_in_microtask(&mut store).unwrap();

    assert_eq!(
        processed.records()[0].outcome(),
        RootTaskScheduleOutcome::NoWork
    );
    assert_eq!(processed.records()[0].next_lanes(), Lanes::NO);
    assert!(store.scheduler_bridge().callback_requests().is_empty());
}

#[test]
fn root_scheduler_entangled_lanes_expand_after_priority_selection() {
    let (mut store, root_id, _host) = root_store();
    schedule_default_update(&mut store, root_id);
    {
        let lanes = store.root_mut(root_id).unwrap().lanes_mut();
        lanes.mark_updated(Lane::TRANSITION_1);
        lanes.mark_entangled(Lanes::DEFAULT.merge_lane(Lane::TRANSITION_1));
    }

    let processed = process_root_schedule_in_microtask(&mut store).unwrap();
    let record = processed.records()[0];

    assert_eq!(record.outcome(), RootTaskScheduleOutcome::Scheduled);
    assert_eq!(
        record.next_lanes(),
        Lanes::DEFAULT.merge_lane(Lane::TRANSITION_1)
    );
    assert_eq!(
        record.callback_priority(),
        RootCallbackPriority::new(Lane::DEFAULT)
    );
    assert_eq!(record.scheduler_priority(), Some(SchedulerPriority::Normal));
}

#[test]
fn root_scheduler_execute_callback_renders_matching_host_root_callback() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let callback = scheduled_callback_request(&mut store, root_id);

    let execution = execute_scheduled_root_callback(&mut store, callback).unwrap();
    let render = execution.render_phase().unwrap();

    assert_eq!(
        execution.status(),
        RootSchedulerCallbackExecutionStatus::Rendered
    );
    assert_eq!(execution.callback(), callback);
    assert_eq!(execution.root(), root_id);
    assert_eq!(execution.callback_node(), callback.node());
    assert!(!execution.validation().is_stale());
    assert_eq!(execution.selected_lanes(), Lanes::DEFAULT);
    assert_eq!(render.root(), root_id);
    assert_eq!(render.current(), current);
    assert_eq!(render.applied_update_count(), 1);
    assert_eq!(render.resulting_element(), RootElementHandle::from_raw(1));
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_execute_callback_reports_stale_callback_without_rendering() {
    let (mut store, root_id, _host) = root_store();
    let callback = scheduled_callback_request(&mut store, root_id);
    let sync_result =
        update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
    ensure_root_is_scheduled(&mut store, sync_result.schedule()).unwrap();
    process_root_schedule_in_microtask(&mut store).unwrap();
    let current = store.root(root_id).unwrap().current();

    let execution = execute_scheduled_root_callback(&mut store, callback).unwrap();

    assert_eq!(
        execution.status(),
        RootSchedulerCallbackExecutionStatus::StaleCallback
    );
    assert!(execution.validation().is_stale());
    assert_eq!(
        execution.validation().requested_callback_node(),
        callback.node()
    );
    assert_eq!(execution.selected_lanes(), Lanes::NO);
    assert_eq!(execution.render_phase(), None);
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.fiber_arena().get(current).unwrap().alternate(), None);
}

#[test]
fn root_scheduler_execute_callback_reports_no_work_without_rendering() {
    let (mut store, root_id, _host) = root_store();
    let callback = scheduled_callback_request(&mut store, root_id);
    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_finished(RootFinishedLanes::new(Lanes::DEFAULT, Lanes::NO));
    let current = store.root(root_id).unwrap().current();

    let execution = execute_scheduled_root_callback(&mut store, callback).unwrap();

    assert_eq!(
        execution.status(),
        RootSchedulerCallbackExecutionStatus::NoWork
    );
    assert!(!execution.validation().is_stale());
    assert_eq!(execution.selected_lanes(), Lanes::NO);
    assert_eq!(execution.render_phase(), None);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        RootSchedulerCallbackHandle::NONE
    );
    assert_eq!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .callback_priority(),
        RootCallbackPriority::NO
    );
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.fiber_arena().get(current).unwrap().alternate(), None);
}

#[test]
fn root_scheduler_execute_callback_rechecks_suspended_lane_selection() {
    let (mut store, root_id, _host) = root_store();
    let callback = scheduled_callback_request(&mut store, root_id);
    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_suspended(Lanes::DEFAULT, Lane::NO, true);
    let current = store.root(root_id).unwrap().current();

    let execution = execute_scheduled_root_callback(&mut store, callback).unwrap();

    assert_eq!(
        execution.status(),
        RootSchedulerCallbackExecutionStatus::NoWork
    );
    assert_eq!(execution.selected_lanes(), Lanes::NO);
    assert_eq!(execution.render_phase(), None);
    assert_eq!(store.root(root_id).unwrap().current(), current);
}

#[test]
fn root_scheduler_microtask_cancels_existing_callback_when_reselection_finds_no_work() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    schedule_default_update(&mut store, root_id);
    process_root_schedule_in_microtask(&mut store).unwrap();
    let original_node = store.root(root_id).unwrap().scheduling().callback_node();

    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_suspended(Lanes::DEFAULT, Lane::NO, true);
    let processed = process_root_schedule_in_microtask(&mut store).unwrap();
    let record = processed.records()[0];

    assert_eq!(record.outcome(), RootTaskScheduleOutcome::NoWork);
    assert_eq!(record.next_lanes(), Lanes::NO);
    assert_eq!(record.canceled_callback().unwrap().node(), original_node);
    assert_eq!(store.scheduler_bridge().cancellation_records().len(), 1);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        RootSchedulerCallbackHandle::NONE
    );
    assert_eq!(scheduled_roots(&store).unwrap(), Vec::<FiberRootId>::new());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_microtask_cancels_callback_when_reselection_changes_callback_lane() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    schedule_default_update(&mut store, root_id);
    process_root_schedule_in_microtask(&mut store).unwrap();
    let original_node = store.root(root_id).unwrap().scheduling().callback_node();

    mark_default_suspended_with_pending_transition(&mut store, root_id);
    let processed = process_root_schedule_in_microtask(&mut store).unwrap();
    let record = processed.records()[0];

    assert_eq!(record.outcome(), RootTaskScheduleOutcome::Scheduled);
    assert_eq!(record.next_lanes(), Lanes::from(Lane::TRANSITION_1));
    assert_eq!(
        record.callback_priority(),
        RootCallbackPriority::new(Lane::TRANSITION_1)
    );
    assert_eq!(record.scheduler_priority(), Some(SchedulerPriority::Normal));
    assert_eq!(record.canceled_callback().unwrap().node(), original_node);
    assert_eq!(store.scheduler_bridge().cancellation_records().len(), 1);
    assert_eq!(store.scheduler_bridge().callback_requests().len(), 2);
    assert_ne!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        original_node
    );
    assert_eq!(scheduled_roots(&store).unwrap(), vec![root_id]);
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_execute_callback_reselects_lanes_before_render_handoff() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let callback = scheduled_callback_request(&mut store, root_id);

    mark_default_suspended_with_pending_transition(&mut store, root_id);
    let execution = execute_scheduled_root_callback(&mut store, callback).unwrap();
    let render = execution.render_phase().unwrap();

    assert_eq!(
        execution.status(),
        RootSchedulerCallbackExecutionStatus::Rendered
    );
    assert!(!execution.validation().is_stale());
    assert_eq!(execution.selected_lanes(), Lanes::from(Lane::TRANSITION_1));
    assert_eq!(render.render_lanes(), Lanes::from(Lane::TRANSITION_1));
    assert_eq!(render.applied_update_count(), 0);
    assert_eq!(render.skipped_update_count(), 1);
    assert_eq!(render.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_reuses_equal_priority_callback() {
    let (mut store, root_id, _host) = root_store();
    schedule_default_update(&mut store, root_id);
    process_root_schedule_in_microtask(&mut store).unwrap();
    let original_node = store.root(root_id).unwrap().scheduling().callback_node();

    schedule_default_update(&mut store, root_id);
    let processed = process_root_schedule_in_microtask(&mut store).unwrap();

    assert_eq!(
        processed.records()[0].outcome(),
        RootTaskScheduleOutcome::Reused
    );
    assert_eq!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        original_node
    );
    assert_eq!(store.scheduler_bridge().callback_requests().len(), 1);
    assert!(store.scheduler_bridge().cancellation_records().is_empty());
}

#[test]
fn root_scheduler_act_queue_cancels_real_callback_before_rerouting() {
    let (mut store, root_id, _host) = root_store();
    schedule_default_update(&mut store, root_id);
    process_root_schedule_in_microtask(&mut store).unwrap();
    let original_node = store.root(root_id).unwrap().scheduling().callback_node();

    activate_act_queue(&mut store);
    schedule_default_update(&mut store, root_id);
    let processed = process_root_schedule_in_microtask(&mut store).unwrap();

    let record = processed.records()[0];
    assert_eq!(record.outcome(), RootTaskScheduleOutcome::Scheduled);
    assert_eq!(record.canceled_callback().unwrap().node(), original_node);
    assert!(record.scheduled_callback().is_none());
    assert!(record.scheduled_act_queue_task().is_some());
    assert_eq!(store.scheduler_bridge().callback_requests().len(), 1);
    assert_eq!(store.scheduler_bridge().cancellation_records().len(), 1);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        SchedulerBridge::fake_act_callback_node()
    );
}

#[test]
fn root_scheduler_canceling_fake_act_callback_is_noop() {
    let (mut store, root_id, _host) = root_store();
    activate_act_queue(&mut store);
    schedule_default_update(&mut store, root_id);
    process_root_schedule_in_microtask(&mut store).unwrap();

    let sync_result =
        update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
    ensure_root_is_scheduled(&mut store, sync_result.schedule()).unwrap();
    let processed = process_root_schedule_in_microtask(&mut store).unwrap();

    assert_eq!(
        processed.records()[0].outcome(),
        RootTaskScheduleOutcome::Sync
    );
    assert_eq!(processed.records()[0].canceled_callback(), None);
    assert!(store.scheduler_bridge().cancellation_records().is_empty());
    assert_eq!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        RootSchedulerCallbackHandle::NONE
    );
}

#[test]
fn root_scheduler_priority_change_cancels_stale_callback_and_replaces_after_sync_clears() {
    let (mut store, root_id, _host) = root_store();
    schedule_default_update(&mut store, root_id);
    process_root_schedule_in_microtask(&mut store).unwrap();
    let original_node = store.root(root_id).unwrap().scheduling().callback_node();

    let sync_result =
        update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
    ensure_root_is_scheduled(&mut store, sync_result.schedule()).unwrap();
    let sync_processed = process_root_schedule_in_microtask(&mut store).unwrap();

    assert_eq!(
        sync_processed.records()[0].outcome(),
        RootTaskScheduleOutcome::Sync
    );
    assert_eq!(
        sync_processed.records()[0]
            .canceled_callback()
            .unwrap()
            .node(),
        original_node
    );
    assert_eq!(store.scheduler_bridge().cancellation_records().len(), 1);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        RootSchedulerCallbackHandle::NONE
    );

    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_finished(RootFinishedLanes::new(Lanes::SYNC, Lanes::NO));
    let replacement = schedule_default_update(&mut store, root_id);
    let replacement_processed = process_root_schedule_in_microtask(&mut store).unwrap();

    assert!(!replacement.inserted());
    assert_eq!(
        replacement_processed.records()[0].outcome(),
        RootTaskScheduleOutcome::Scheduled
    );
    assert_eq!(store.scheduler_bridge().callback_requests().len(), 2);
    assert_ne!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        original_node
    );
}

#[test]
fn root_scheduler_no_render_commit_or_host_mutation_side_effects() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();

    schedule_default_update(&mut store, root_id);
    process_root_schedule_in_microtask(&mut store).unwrap();

    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_passive_root_error_capture_schedules_sync_metadata_without_callbacks() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let host = RecordingHost::default();
    let root_id = store
        .create_client_root(
            FakeContainer::new(1),
            RootOptions::new()
                .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(701))
                .with_on_caught_error(RootErrorCallbackHandle::from_raw(702))
                .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(703)),
        )
        .unwrap();
    let current = store.root(root_id).unwrap().current();
    let microtask_count = store.scheduler_bridge().microtask_requests().len();

    let first = capture_passive_effect_root_error(
        &mut store,
        root_id,
        current,
        RootErrorCaptureSource::PassiveEffectDestroy,
    )
    .unwrap();

    assert_eq!(first.source(), RootErrorCaptureSource::PassiveEffectDestroy);
    assert_eq!(first.root(), root_id);
    assert_eq!(first.root_fiber(), current);
    assert_eq!(first.source_fiber(), current);
    assert_eq!(first.lane(), Lane::SYNC);
    assert_eq!(first.pending_lanes_before(), Lanes::NO);
    assert_eq!(first.pending_lanes_after(), Lanes::SYNC);
    assert_eq!(
        first.on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(701)
    );
    assert_eq!(
        first.on_caught_error(),
        RootErrorCallbackHandle::from_raw(702)
    );
    assert_eq!(
        first.on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(703)
    );
    let first_callbacks = first.error_option_callbacks();
    assert_eq!(first_callbacks.root(), root_id);
    assert_eq!(
        first_callbacks.phase(),
        RootErrorOptionCallbackPhase::Commit
    );
    assert_eq!(
        first_callbacks.on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(701)
    );
    assert_eq!(
        first_callbacks.on_caught_error(),
        RootErrorCallbackHandle::from_raw(702)
    );
    assert_eq!(
        first_callbacks.on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(703)
    );
    assert!(!first_callbacks.root_error_callbacks_invoked());
    assert!(!first_callbacks.public_error_boundaries_enabled());
    assert!(!first_callbacks.recoverable_error_compatibility_claimed());
    assert!(first.root_error_update_scheduled());
    assert!(first.has_configured_error_callback());
    assert!(!first.root_error_callbacks_invoked());
    assert!(!first.public_act_error_aggregation_enabled());
    assert!(first.scheduled_root().inserted());
    assert_eq!(first.scheduled_root().root(), root_id);
    assert_eq!(
        store.scheduler_bridge().microtask_requests().len(),
        microtask_count + 1
    );
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert!(store.scheduler_bridge().act_queue_requests().is_empty());

    let second = capture_passive_effect_root_error(
        &mut store,
        root_id,
        current,
        RootErrorCaptureSource::PassiveEffectMountCreate,
    )
    .unwrap();

    assert_eq!(
        second.source(),
        RootErrorCaptureSource::PassiveEffectMountCreate
    );
    assert_eq!(second.pending_lanes_before(), Lanes::SYNC);
    assert_eq!(second.pending_lanes_after(), Lanes::SYNC);
    assert!(!second.scheduled_root().inserted());
    assert!(second.root_error_update_scheduled());
    assert!(!second.root_error_callbacks_invoked());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::SYNC
    );
    assert_eq!(
        store.scheduler_bridge().microtask_requests().len(),
        microtask_count + 1
    );
    assert!(host.operations().is_empty());
}

#[test]
fn root_scheduler_render_error_option_callback_record_preserves_handles_without_callbacks() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let host = RecordingHost::default();
    let root_id = store
        .create_client_root(
            FakeContainer::new(1),
            RootOptions::new()
                .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(711))
                .with_on_caught_error(RootErrorCallbackHandle::from_raw(712))
                .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(713)),
        )
        .unwrap();
    let current = store.root(root_id).unwrap().current();
    let error = RootWorkLoopError::MissingHostRootUpdateQueue {
        root: root_id,
        fiber: current,
    };

    let record =
        record_root_render_error_option_callbacks(&store, root_id, Lanes::DEFAULT, error).unwrap();

    assert_eq!(record.root(), root_id);
    assert_eq!(record.render_lanes(), Lanes::DEFAULT);
    assert!(matches!(
        record.error(),
        RootWorkLoopError::MissingHostRootUpdateQueue { root, fiber }
            if *root == root_id && *fiber == current
    ));
    assert_eq!(
        record.on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(711)
    );
    assert_eq!(
        record.on_caught_error(),
        RootErrorCallbackHandle::from_raw(712)
    );
    assert_eq!(
        record.on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(713)
    );
    let callbacks = record.error_option_callbacks();
    assert_eq!(callbacks.root(), root_id);
    assert_eq!(callbacks.phase(), RootErrorOptionCallbackPhase::Render);
    assert!(record.has_configured_error_callback());
    assert!(!record.root_error_callbacks_invoked());
    assert!(!record.public_error_boundaries_enabled());
    assert!(!record.recoverable_error_compatibility_claimed());
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert!(store.scheduler_bridge().act_queue_requests().is_empty());
    assert!(host.operations().is_empty());
}

#[test]
fn root_scheduler_act_routing_has_no_render_commit_or_host_mutation_side_effects() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    activate_act_queue(&mut store);

    schedule_default_update(&mut store, root_id);
    process_root_schedule_in_microtask(&mut store).unwrap();

    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert!(store.scheduler_bridge().callback_requests().is_empty());
}

#[test]
fn root_scheduler_sync_flush_plan_uses_fast_path_and_reentry_guard() {
    let (mut store, root_id, _host) = root_store();

    let empty_plan = collect_sync_flush_plan(&mut store).unwrap();

    assert!(empty_plan.skipped_no_sync_work());
    assert!(!empty_plan.skipped_reentrant_flush());
    assert!(empty_plan.sync_roots().is_empty());

    let result = update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
    ensure_root_is_scheduled(&mut store, result.schedule()).unwrap();

    let sync_plan = collect_sync_flush_plan(&mut store).unwrap();

    assert_eq!(sync_plan.sync_roots(), &[root_id]);
    assert!(!store.root_scheduler().is_flushing_work());

    store.root_scheduler_mut().set_is_flushing_work(true);
    let reentrant_plan = collect_sync_flush_plan(&mut store).unwrap();
    store.root_scheduler_mut().set_is_flushing_work(false);

    assert!(reentrant_plan.skipped_reentrant_flush());
    assert!(reentrant_plan.sync_roots().is_empty());
}

#[test]
fn root_scheduler_sync_flush_lanes_filter_non_sync_lanes_and_recompute_flag() {
    let (mut store, root_id, _host) = root_store();
    let sync_result =
        update_container_sync(&mut store, root_id, RootElementHandle::from_raw(1), None).unwrap();
    ensure_root_is_scheduled(&mut store, sync_result.schedule()).unwrap();
    schedule_default_update(&mut store, root_id);

    let sync_lanes = sync_flush_lanes_for_root(&store, root_id).unwrap();

    assert_eq!(sync_lanes, Lanes::SYNC);
    assert!(
        !sync_lanes.contains_lane(Lane::DEFAULT),
        "default work must stay out of the sync flush lane set"
    );

    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_finished(RootFinishedLanes::new(Lanes::SYNC, Lanes::DEFAULT));
    let still_has_sync = recompute_might_have_pending_sync_work(&mut store).unwrap();

    assert!(!still_has_sync);
    assert!(!store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::DEFAULT
    );
}

#[test]
fn root_scheduler_sync_flush_act_continuation_lanes_use_post_commit_selection() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let sync_result =
        update_container_sync(&mut store, root_id, RootElementHandle::from_raw(1), None).unwrap();
    ensure_root_is_scheduled(&mut store, sync_result.schedule()).unwrap();
    schedule_default_update(&mut store, root_id);

    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_finished(RootFinishedLanes::new(Lanes::SYNC, Lanes::DEFAULT));

    let continuation_lanes = sync_flush_act_continuation_lanes_for_root(&store, root_id).unwrap();

    assert_eq!(continuation_lanes, Lanes::DEFAULT);
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_sync_flush_act_continuation_lanes_respect_suspended_selection() {
    let (mut store, root_id, host) = root_store();
    schedule_default_update(&mut store, root_id);
    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_suspended(Lanes::DEFAULT, Lane::NO, true);

    let continuation_lanes = sync_flush_act_continuation_lanes_for_root(&store, root_id).unwrap();

    assert_eq!(continuation_lanes, Lanes::NO);
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_sync_flush_act_post_passive_gate_records_pending_passive_metadata() {
    let (mut store, root_id, host) = root_store();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(91));
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
    let finished_work = render.finished_work();
    store
        .root_mut(root_id)
        .unwrap()
        .scheduling_mut()
        .prepare_pending_passive(root_id, Lanes::NO);
    let commit = commit_finished_host_root(&mut store, render).unwrap();

    store.scheduler_bridge_mut().enter_act_scope();
    store.scheduler_bridge_mut().enter_act_scope();
    let act_continuation = store
        .scheduler_bridge_mut()
        .record_sync_flush_act_continuation(root_id, 7, Lanes::SYNC, Lanes::NO, Lanes::NO);

    let gate = sync_flush_act_post_passive_continuation_gate(
        act_continuation,
        commit.pending_passive_handoff(),
    )
    .unwrap();

    assert_eq!(gate.root(), root_id);
    assert_eq!(gate.sync_flush_order(), 7);
    assert_eq!(gate.flushed_lanes(), Lanes::SYNC);
    assert_eq!(gate.remaining_lanes(), Lanes::NO);
    assert_eq!(gate.continuation_lanes(), Lanes::NO);
    assert_eq!(gate.pending_passive_finished_work(), finished_work);
    assert_eq!(gate.pending_passive_lanes(), Lanes::SYNC);
    assert_eq!(gate.pending_passive_unmount_count(), 0);
    assert_eq!(gate.pending_passive_mount_count(), 0);
    assert_eq!(gate.pending_passive_record_count(), 0);
    assert_eq!(gate.act_scope_depth(), 2);
    assert!(gate.nested_act_scope());
    assert!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .pending_passive()
            .has_commit_handoff()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_sync_flush_act_post_passive_gate_requires_act_and_passive_handoff() {
    let (mut store, root_id, host) = root_store();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(92));
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
    store.scheduler_bridge_mut().enter_act_scope();
    let act_continuation = store
        .scheduler_bridge_mut()
        .record_sync_flush_act_continuation(root_id, 8, Lanes::SYNC, Lanes::NO, Lanes::NO);
    let commit_without_passive = commit_finished_host_root(&mut store, render).unwrap();

    assert_eq!(
        sync_flush_act_post_passive_continuation_gate(act_continuation, None),
        None
    );
    assert_eq!(
        sync_flush_act_post_passive_continuation_gate(
            act_continuation,
            commit_without_passive.pending_passive_handoff()
        ),
        None
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_act_continuation_drain_accepts_only_pending_after_canary() {
    let (mut store, root_id, host) = root_store();
    store.scheduler_bridge_mut().enter_act_scope();
    let pending = store
        .scheduler_bridge_mut()
        .record_sync_flush_act_continuation(root_id, 9, Lanes::SYNC, Lanes::DEFAULT, Lanes::DEFAULT)
        .unwrap();
    let no_continuation = store
        .scheduler_bridge_mut()
        .record_sync_flush_act_continuation(root_id, 10, Lanes::SYNC, Lanes::NO, Lanes::NO)
        .unwrap();

    let drained =
        sync_flush_act_continuation_drain_record_after_host_output_canary(pending, true).unwrap();

    assert_eq!(drained.root(), root_id);
    assert_eq!(drained.sync_flush_order(), 9);
    assert_eq!(drained.flushed_lanes(), Lanes::SYNC);
    assert_eq!(drained.remaining_lanes(), Lanes::DEFAULT);
    assert_eq!(drained.continuation_lanes(), Lanes::DEFAULT);
    assert_eq!(drained.act_scope_depth(), 1);
    assert!(!drained.nested_act_scope());
    assert_eq!(
        drained.source_status(),
        SchedulerActContinuationStatus::PendingContinuation
    );
    assert!(drained.host_output_canary_committed());
    assert!(drained.is_accepted_internal_act_continuation());
    assert!(!drained.drains_public_react_act_queue());
    assert!(!drained.public_act_compatibility_claimed());
    assert!(!drained.public_flush_sync_compatibility_claimed());
    assert!(!drained.executes_queued_work());
    assert!(!drained.executes_effects());
    assert_eq!(
        sync_flush_act_continuation_drain_record_after_host_output_canary(pending, false),
        None
    );
    assert_eq!(
        sync_flush_act_continuation_drain_record_after_host_output_canary(no_continuation, true,),
        None
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_scheduler_bridge_act_continuation_execution_commits_accepted_work() {
    let (mut store, root_id, host) = root_store();
    store.scheduler_bridge_mut().enter_act_scope();
    schedule_default_update(&mut store, root_id);
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();
    let pending = store
        .scheduler_bridge_mut()
        .record_sync_flush_act_continuation(
            root_id,
            11,
            Lanes::SYNC,
            Lanes::DEFAULT,
            Lanes::DEFAULT,
        )
        .unwrap();
    let accepted =
        sync_flush_act_continuation_drain_record_after_host_output_canary(pending, true).unwrap();

    let result = execute_scheduler_bridge_act_continuations(&mut store, &[accepted]).unwrap();

    assert_eq!(result.records().len(), 1);
    assert_eq!(result.executed_count(), 1);
    assert_eq!(result.rejected_count(), 0);
    assert_eq!(result.blocked_count(), 0);
    assert!(result.did_execute_accepted_internal_act_continuations());
    assert!(result.records_preserve_sync_flush_order());
    assert!(!result.drains_public_react_act_queue());
    assert!(!result.public_act_compatibility_claimed());
    assert!(!result.public_flush_sync_compatibility_claimed());
    assert!(!result.public_scheduler_timing_compatibility_claimed());
    assert!(!result.executes_effects());

    let record = &result.records()[0];
    assert_eq!(record.execution_order(), 0);
    assert_eq!(
        record.status(),
        SchedulerBridgeActContinuationExecutionStatus::RenderedAndCommitted
    );
    assert_eq!(record.root(), root_id);
    assert_eq!(record.requested_lanes(), Lanes::DEFAULT);
    assert_eq!(record.selected_lanes(), Lanes::DEFAULT);
    assert_eq!(record.pending_lanes_before_execution(), Lanes::DEFAULT);
    assert_eq!(record.pending_lanes_after_execution(), Lanes::NO);
    assert!(record.did_execute_accepted_internal_act_continuation());
    assert!(record.accepted_root_scheduler_execution_evidence_for_canary());
    assert!(record.accepted_root_commit_execution_evidence_for_canary());
    assert!(record.routed_through_root_scheduler_and_commit_evidence_for_canary());
    assert!(record.consumed_continuation_lanes_and_preserved_remaining_lanes_for_canary());
    assert!(!record.drains_public_react_act_queue());
    assert!(!record.public_act_compatibility_claimed());
    assert!(!record.public_flush_sync_compatibility_claimed());
    assert!(!record.public_scheduler_timing_compatibility_claimed());
    assert!(!record.executes_effects());
    let handoff = record.root_commit_handoff_for_canary().unwrap();
    assert!(handoff.proves_private_root_finished_work_commit_metadata_handoff());
    assert_eq!(handoff.pending().root(), root_id);
    assert_eq!(
        handoff.pending().root_finished_work(),
        Some(handoff.pending().finished_work())
    );
    assert_eq!(handoff.pending().render_lanes(), Lanes::DEFAULT);
    assert_eq!(handoff.execution_request().render_lanes(), Lanes::DEFAULT);
    assert!(handoff.execution_request().records_root_finished_work());
    assert!(handoff.execution_request().compatibility_claim_blocked());
    let render_phase = record.render_phase().unwrap();
    assert_eq!(render_phase.root(), root_id);
    assert_eq!(render_phase.render_lanes(), Lanes::DEFAULT);
    assert_eq!(
        render_phase.resulting_element(),
        RootElementHandle::from_raw(1)
    );
    let commit = record.commit().unwrap();
    assert_eq!(commit.root(), root_id);
    assert_eq!(commit.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(commit.remaining_lanes(), Lanes::NO);
    assert_eq!(store.root(root_id).unwrap().current(), commit.current());
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert!(!store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(
        store.scheduler_bridge().act_queue_requests().len(),
        act_queue_request_count
    );
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_nested_act_continuations_preserve_order_and_remaining_lanes() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let second = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    store.scheduler_bridge_mut().enter_act_scope();
    store.scheduler_bridge_mut().enter_act_scope();

    let first_default =
        update_container(&mut store, first, RootElementHandle::from_raw(21), None).unwrap();
    ensure_root_is_scheduled(&mut store, first_default.schedule()).unwrap();
    let first_transition = update_container_transition_for_canary(
        &mut store,
        first,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(22),
        None,
    )
    .unwrap();
    ensure_root_is_scheduled(&mut store, first_transition.schedule()).unwrap();
    let second_default =
        update_container(&mut store, second, RootElementHandle::from_raw(23), None).unwrap();
    ensure_root_is_scheduled(&mut store, second_default.schedule()).unwrap();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

    let first_continuation = store
        .scheduler_bridge_mut()
        .record_sync_flush_act_continuation(
            first,
            0,
            Lanes::SYNC,
            Lanes::DEFAULT.merge_lane(Lane::TRANSITION_1),
            Lanes::DEFAULT,
        )
        .unwrap();
    let second_continuation = store
        .scheduler_bridge_mut()
        .record_sync_flush_act_continuation(second, 1, Lanes::SYNC, Lanes::DEFAULT, Lanes::DEFAULT)
        .unwrap();
    let first_accepted =
        sync_flush_act_continuation_drain_record_after_host_output_canary(first_continuation, true)
            .unwrap();
    let second_accepted = sync_flush_act_continuation_drain_record_after_host_output_canary(
        second_continuation,
        true,
    )
    .unwrap();

    let result =
        execute_scheduler_bridge_act_continuations(&mut store, &[first_accepted, second_accepted])
            .unwrap();

    assert_eq!(result.records().len(), 2);
    assert_eq!(result.executed_count(), 2);
    assert_eq!(result.rejected_count(), 0);
    assert_eq!(result.blocked_count(), 0);
    assert!(result.did_execute_accepted_internal_act_continuations());
    assert!(result.records_preserve_sync_flush_order());
    assert!(result.preserves_nested_act_root_continuation_order_and_lanes_for_canary());
    assert!(!result.drains_public_react_act_queue());
    assert!(!result.public_act_compatibility_claimed());
    assert!(!result.public_flush_sync_compatibility_claimed());
    assert!(!result.public_scheduler_timing_compatibility_claimed());
    assert!(!result.executes_effects());

    let first_record = &result.records()[0];
    assert_eq!(first_record.execution_order(), 0);
    assert_eq!(first_record.root(), first);
    assert_eq!(first_record.continuation().sync_flush_order(), 0);
    assert!(first_record.continuation().nested_act_scope());
    assert_eq!(first_record.requested_lanes(), Lanes::DEFAULT);
    assert_eq!(first_record.selected_lanes(), Lanes::DEFAULT);
    assert_eq!(
        first_record.pending_lanes_before_execution(),
        Lanes::DEFAULT.merge_lane(Lane::TRANSITION_1)
    );
    assert_eq!(
        first_record.pending_lanes_after_execution(),
        Lanes::from(Lane::TRANSITION_1)
    );
    assert!(first_record.consumed_continuation_lanes_and_preserved_remaining_lanes_for_canary());
    assert_eq!(
        first_record.render_phase().unwrap().resulting_element(),
        RootElementHandle::from_raw(21)
    );
    assert_eq!(
        first_record.commit().unwrap().pending_lanes(),
        Lanes::from(Lane::TRANSITION_1)
    );

    let second_record = &result.records()[1];
    assert_eq!(second_record.execution_order(), 1);
    assert_eq!(second_record.root(), second);
    assert_eq!(second_record.continuation().sync_flush_order(), 1);
    assert!(second_record.continuation().nested_act_scope());
    assert_eq!(second_record.requested_lanes(), Lanes::DEFAULT);
    assert_eq!(second_record.selected_lanes(), Lanes::DEFAULT);
    assert_eq!(
        second_record.pending_lanes_before_execution(),
        Lanes::DEFAULT
    );
    assert_eq!(second_record.pending_lanes_after_execution(), Lanes::NO);
    assert!(second_record.consumed_continuation_lanes_and_preserved_remaining_lanes_for_canary());
    assert_eq!(
        second_record.render_phase().unwrap().resulting_element(),
        RootElementHandle::from_raw(23)
    );

    assert_eq!(
        store.root(first).unwrap().lanes().pending_lanes(),
        Lanes::from(Lane::TRANSITION_1)
    );
    assert_eq!(
        store.root(second).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert_eq!(
        store.scheduler_bridge().act_queue_requests().len(),
        act_queue_request_count
    );
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_scheduler_bridge_act_continuation_execution_rejects_unaccepted_records() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    schedule_default_update(&mut store, root_id);
    let unaccepted = SyncFlushActContinuationDrainRecord {
        root: root_id,
        sync_flush_order: 12,
        flushed_lanes: Lanes::SYNC,
        remaining_lanes: Lanes::DEFAULT,
        continuation_lanes: Lanes::DEFAULT,
        act_scope_depth: 1,
        nested_act_scope: false,
        source_status: SchedulerActContinuationStatus::NoContinuation,
        host_output_canary_committed: true,
    };

    let result = execute_scheduler_bridge_act_continuations(&mut store, &[unaccepted]).unwrap();

    assert_eq!(result.records().len(), 1);
    assert_eq!(result.executed_count(), 0);
    assert_eq!(result.rejected_count(), 1);
    assert_eq!(result.blocked_count(), 0);
    assert!(!result.did_execute_accepted_internal_act_continuations());
    let record = &result.records()[0];
    assert_eq!(
        record.status(),
        SchedulerBridgeActContinuationExecutionStatus::RejectedContinuation
    );
    assert!(record.rejected_unaccepted_continuation());
    assert_eq!(record.selected_lanes(), Lanes::NO);
    assert_eq!(record.render_phase(), None);
    assert!(record.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert!(
        store
            .root(root_id)
            .unwrap()
            .lanes()
            .pending_lanes()
            .contains_lane(Lane::DEFAULT)
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_scheduler_bridge_act_continuation_execution_rejects_fabricated_sequence() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    store.scheduler_bridge_mut().enter_act_scope();
    schedule_default_update(&mut store, root_id);
    let fabricated = SyncFlushActContinuationDrainRecord {
        root: root_id,
        sync_flush_order: 99,
        flushed_lanes: Lanes::SYNC,
        remaining_lanes: Lanes::DEFAULT,
        continuation_lanes: Lanes::DEFAULT,
        act_scope_depth: 1,
        nested_act_scope: false,
        source_status: SchedulerActContinuationStatus::PendingContinuation,
        host_output_canary_committed: true,
    };

    let result = execute_scheduler_bridge_act_continuations(&mut store, &[fabricated]).unwrap();

    assert_eq!(result.records().len(), 1);
    assert_eq!(result.executed_count(), 0);
    assert_eq!(result.rejected_count(), 1);
    assert_eq!(result.blocked_count(), 0);
    assert!(!result.did_execute_accepted_internal_act_continuations());
    assert!(!result.drains_public_react_act_queue());
    assert!(!result.public_act_compatibility_claimed());
    assert!(!result.public_flush_sync_compatibility_claimed());
    assert!(!result.public_scheduler_timing_compatibility_claimed());
    assert!(!result.executes_effects());
    let record = &result.records()[0];
    assert_eq!(
        record.status(),
        SchedulerBridgeActContinuationExecutionStatus::RejectedContinuation
    );
    assert!(record.rejected_unaccepted_continuation());
    assert_eq!(record.continuation(), fabricated);
    assert_eq!(record.selected_lanes(), Lanes::NO);
    assert_eq!(record.render_phase(), None);
    assert!(record.commit().is_none());
    assert!(!record.drains_public_react_act_queue());
    assert!(!record.public_act_compatibility_claimed());
    assert!(!record.public_flush_sync_compatibility_claimed());
    assert!(!record.public_scheduler_timing_compatibility_claimed());
    assert!(!record.executes_effects());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::DEFAULT
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_scheduler_bridge_act_continuation_execution_blocks_stale_lane_order() {
    let (mut store, root_id, host) = root_store();
    store.scheduler_bridge_mut().enter_act_scope();
    let current = store.root(root_id).unwrap().current();
    schedule_default_update(&mut store, root_id);
    let pending = store
        .scheduler_bridge_mut()
        .record_sync_flush_act_continuation(
            root_id,
            13,
            Lanes::SYNC,
            Lanes::DEFAULT,
            Lanes::DEFAULT,
        )
        .unwrap();
    let accepted =
        sync_flush_act_continuation_drain_record_after_host_output_canary(pending, true).unwrap();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(2));

    let result = execute_scheduler_bridge_act_continuations(&mut store, &[accepted]).unwrap();

    assert_eq!(result.records().len(), 1);
    assert_eq!(result.executed_count(), 0);
    assert_eq!(result.rejected_count(), 0);
    assert_eq!(result.blocked_count(), 1);
    let record = &result.records()[0];
    assert_eq!(
        record.status(),
        SchedulerBridgeActContinuationExecutionStatus::BlockedByLaneMismatch
    );
    assert!(record.blocked_by_lane_mismatch());
    assert_eq!(record.requested_lanes(), Lanes::DEFAULT);
    assert!(record.selected_lanes().contains_lane(Lane::SYNC));
    assert!(record.selected_lanes().contains_lane(Lane::DEFAULT));
    assert_eq!(record.render_phase(), None);
    assert!(record.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    let pending_lanes = store.root(root_id).unwrap().lanes().pending_lanes();
    assert!(pending_lanes.contains_lane(Lane::SYNC));
    assert!(pending_lanes.contains_lane(Lane::DEFAULT));
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_sync_continuation_execution_commits_accepted_render_handoff() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(5961));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let handoff = rendered.records()[0];

    let execution = execute_sync_scheduler_continuation_for_render_handoff(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
    )
    .unwrap();

    assert_eq!(
        execution.status(),
        RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted
    );
    assert_eq!(execution.handoff(), handoff);
    assert_eq!(execution.root(), root_id);
    assert_eq!(
        execution.requested_callback_node(),
        RootSchedulerCallbackHandle::NONE
    );
    assert_eq!(
        execution.current_callback_node(),
        RootSchedulerCallbackHandle::NONE
    );
    assert_eq!(execution.handoff_lanes(), Lanes::SYNC);
    assert_eq!(execution.selected_lanes(), Lanes::SYNC);
    let identity = execution.finished_work_handoff_identity().unwrap();
    assert_eq!(identity.root(), root_id);
    assert_eq!(identity.render_phase_root(), root_id);
    assert_eq!(identity.previous_current(), current);
    assert_eq!(identity.current_before_commit(), current);
    assert_eq!(
        identity.pending_work_before_commit(),
        Some(handoff.render_phase().finished_work())
    );
    assert_eq!(
        identity.root_finished_work_before_commit(),
        Some(handoff.render_phase().finished_work())
    );
    assert_eq!(
        identity.finished_work(),
        handoff.render_phase().finished_work()
    );
    assert_eq!(identity.selected_lanes(), Lanes::SYNC);
    assert_eq!(identity.render_lanes(), Lanes::SYNC);
    assert_eq!(identity.finished_lanes(), Lanes::SYNC);
    assert_eq!(identity.root_finished_lanes_before_commit(), Lanes::SYNC);
    assert_eq!(identity.pending_lanes_before_commit(), Lanes::SYNC);
    assert_eq!(identity.render_phase_lanes_before_commit(), Lanes::SYNC);
    assert!(identity.accepted_for_root_scheduler_commit_handoff());
    assert!(execution.did_execute_private_sync_scheduler_continuation());
    assert!(execution.consumed_accepted_render_handoff());
    assert!(execution.accepted_root_scheduler_execution_evidence_for_canary());
    assert!(execution.accepted_root_commit_execution_evidence_for_canary());
    assert!(execution.routed_through_root_scheduler_and_commit_evidence_for_canary());
    assert!(execution.async_callback_execution_blocked());
    assert!(execution.public_update_scheduling_blocked());
    assert!(!execution.public_root_compatibility_claimed());
    assert!(!execution.executes_public_effects());
    let handoff_record = execution.root_commit_handoff_for_canary().unwrap();
    assert!(handoff_record.proves_private_root_finished_work_commit_metadata_handoff());
    assert_eq!(handoff_record.pending().root(), root_id);
    assert_eq!(
        handoff_record.pending().root_finished_work(),
        Some(handoff_record.pending().finished_work())
    );
    assert_eq!(handoff_record.pending().render_lanes(), Lanes::SYNC);
    assert_eq!(
        handoff_record.execution_request().render_lanes(),
        Lanes::SYNC
    );
    assert!(
        handoff_record
            .execution_request()
            .records_root_finished_work()
    );
    assert!(
        handoff_record
            .execution_request()
            .compatibility_claim_blocked()
    );
    let commit = execution.commit().unwrap();
    assert_eq!(commit.root(), root_id);
    assert_eq!(commit.previous_current(), current);
    assert_eq!(commit.current(), handoff.render_phase().finished_work());
    assert_eq!(commit.finished_lanes(), Lanes::SYNC);
    assert_eq!(commit.pending_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        handoff.render_phase().finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert!(!store.root_scheduler().might_have_pending_sync_work());
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_queue_lane_continuation_accepts_source_owned_handoff() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (accepted, handoff, queue_handoff) =
        sync_queue_lane_scheduler_handoff(&mut store, root_id, RootElementHandle::from_raw(9041));

    let execution = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
        Some(&queue_handoff),
    )
    .unwrap();

    assert_eq!(
        execution.status(),
        RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::RenderedAndCommitted
    );
    assert_eq!(execution.handoff(), handoff);
    assert_eq!(execution.root(), root_id);
    assert_eq!(
        execution.requested_callback_node(),
        RootSchedulerCallbackHandle::NONE
    );
    assert_eq!(
        execution.current_callback_node(),
        RootSchedulerCallbackHandle::NONE
    );
    assert_eq!(execution.handoff_lanes(), Lanes::SYNC);
    assert_eq!(execution.selected_lanes(), Lanes::SYNC);
    assert!(execution.did_execute_queue_lane_scheduler_continuation());
    assert!(execution.accepted_root_scheduler_execution_evidence_for_canary());
    assert!(execution.accepted_root_commit_execution_evidence_for_canary());
    assert!(execution.accepted_queue_lane_handoff_evidence_for_canary());
    assert!(execution.routed_through_root_scheduler_queue_lane_and_commit_evidence_for_canary());
    assert!(execution.treats_host_root_update_as_current_only_with_queue_lane_handoff_for_canary());
    assert!(!execution.public_root_compatibility_claimed());
    assert!(!execution.executes_public_effects());

    let queue_commit_handoff = execution.queue_commit_handoff().unwrap();
    assert_eq!(queue_commit_handoff.queue_handoff(), &queue_handoff);
    assert_eq!(
        queue_commit_handoff.update_sequence_ids(),
        &[accepted.update()]
    );
    assert_eq!(queue_commit_handoff.selected_lanes(), Lanes::SYNC);
    assert_eq!(queue_commit_handoff.finished_lanes(), Lanes::SYNC);
    assert_eq!(queue_commit_handoff.remaining_lanes(), Lanes::NO);
    assert_eq!(queue_commit_handoff.applied_update_count(), 1);
    assert_eq!(queue_commit_handoff.skipped_update_count(), 0);
    assert_eq!(
        queue_commit_handoff.resulting_element(),
        RootElementHandle::from_raw(9041)
    );
    assert!(queue_commit_handoff.proves_queue_lane_handoff_gated_current_switch());
    assert!(
        execution
            .root_commit_handoff_for_canary()
            .unwrap()
            .proves_private_root_finished_work_commit_metadata_handoff()
    );

    let commit = execution.commit().unwrap();
    assert_eq!(commit.root(), root_id);
    assert_eq!(commit.previous_current(), current);
    assert_eq!(commit.current(), handoff.render_phase().finished_work());
    assert_eq!(commit.finished_lanes(), Lanes::SYNC);
    assert_eq!(commit.pending_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        handoff.render_phase().finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert!(!store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_finished_work_queue_lane_commit_currentness_consumes_live_tree_state() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (accepted, handoff, queue_handoff) =
        sync_queue_lane_scheduler_handoff(&mut store, root_id, RootElementHandle::from_raw(9481));
    let prepared = prepare_test_renderer_host_output_canary_fibers(
        &mut store,
        handoff.render_phase(),
        TestRendererHostOutputCanaryFixture::new(94810, 94811, 94812),
    )
    .unwrap();
    let completed =
        finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 94813, 94814).unwrap();

    let execution = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
        Some(&queue_handoff),
    )
    .unwrap();
    let currentness =
        consume_finished_work_queue_lane_commit_currentness_for_canary(&mut store, &execution)
            .unwrap();

    assert!(execution.did_execute_queue_lane_scheduler_continuation());
    assert!(execution.routed_through_root_scheduler_queue_lane_and_commit_evidence_for_canary());
    assert!(currentness.source_pending_before_consume());
    assert!(currentness.source_consumed_after());
    assert!(currentness.source_owned_currentness_consumed());
    assert!(currentness.ties_finished_work_queue_lane_commit_to_live_tree_state_for_canary());
    assert_eq!(currentness.root(), root_id);
    assert_eq!(currentness.root_token(), root_id.state_node_handle());
    assert_eq!(currentness.previous_current(), current);
    assert_eq!(
        currentness.finished_work(),
        handoff.render_phase().finished_work()
    );
    assert_eq!(currentness.selected_lanes(), Lanes::SYNC);
    assert_eq!(currentness.finished_lanes(), Lanes::SYNC);
    assert_eq!(currentness.remaining_lanes(), Lanes::NO);
    assert_eq!(currentness.update_sequence_ids(), &[accepted.update()]);
    assert_eq!(
        currentness.resulting_element(),
        RootElementHandle::from_raw(9481)
    );
    assert_eq!(
        currentness.committed_element_after_consume(),
        RootElementHandle::from_raw(9481)
    );
    assert_eq!(
        currentness.root_current_after_consume(),
        currentness.finished_work()
    );
    assert_eq!(currentness.root_finished_work_after_consume(), None);
    assert_eq!(currentness.root_finished_lanes_after_consume(), Lanes::NO);
    assert_eq!(currentness.root_pending_lanes_after_consume(), Lanes::NO);
    assert_eq!(currentness.committed_root_child_count(), 1);
    assert_eq!(
        currentness.committed_root_children(),
        &[completed.component()]
    );
    assert_eq!(
        currentness.commit_mutation_record_count(),
        execution.commit().unwrap().mutation_log().len()
    );
    assert!(currentness.commit_mutation_record_count() > 0);
    assert_eq!(currentness.commit_deletion_list_count(), 0);
    assert!(!currentness.public_root_compatibility_claimed());
    assert!(!currentness.public_scheduler_timing_compatibility_claimed());
    assert!(!currentness.public_act_compatibility_claimed());
    assert!(!currentness.react_dom_compatibility_claimed());
    assert!(!currentness.test_renderer_compatibility_claimed());
    assert!(!currentness.executes_public_effects());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        currentness.finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_finished_work_queue_lane_commit_currentness_rejects_preconsume_clone() {
    let (mut store, root_id, host) = root_store();
    let (_accepted, handoff, queue_handoff) =
        sync_queue_lane_scheduler_handoff(&mut store, root_id, RootElementHandle::from_raw(94821));
    let execution = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
        Some(&queue_handoff),
    )
    .unwrap();
    let cloned_execution = execution.clone();
    let commit = execution.commit().unwrap();
    let commit_order = execution
        .queue_commit_handoff()
        .unwrap()
        .finished_work_handoff()
        .commit_order();

    assert!(execution.currentness_source_token().is_some());
    assert_eq!(cloned_execution.currentness_source_token(), None);
    assert_eq!(
        consume_finished_work_queue_lane_commit_currentness_for_canary(
            &mut store,
            &cloned_execution,
        )
        .unwrap_err(),
        RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::SourceNotPending {
            root: root_id,
            finished_work: commit.finished_work(),
            commit_order
        }
    );

    let currentness =
        consume_finished_work_queue_lane_commit_currentness_for_canary(&mut store, &execution)
            .unwrap();
    assert!(currentness.source_pending_before_consume());
    assert!(currentness.source_consumed_after());
    assert!(currentness.source_owned_currentness_consumed());
    assert!(currentness.ties_finished_work_queue_lane_commit_to_live_tree_state_for_canary());
    assert_eq!(currentness.root(), root_id);
    assert_eq!(currentness.finished_work(), commit.finished_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_finished_work_queue_lane_commit_currentness_rejects_replay_and_caller_built_callback()
 {
    let (mut store, root_id, host) = root_store();
    let (_accepted, handoff, queue_handoff) =
        sync_queue_lane_scheduler_handoff(&mut store, root_id, RootElementHandle::from_raw(9482));
    let execution = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
        Some(&queue_handoff),
    )
    .unwrap();
    let consumed =
        consume_finished_work_queue_lane_commit_currentness_for_canary(&mut store, &execution)
            .unwrap();

    let replay =
        consume_finished_work_queue_lane_commit_currentness_for_canary(&mut store, &execution)
            .unwrap_err();
    assert_eq!(
        replay,
        RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::SourceAlreadyConsumed {
            root: root_id,
            finished_work: consumed.finished_work(),
            commit_order: consumed.commit_order()
        }
    );

    let mut caller_built = execution.clone();
    caller_built.requested_callback_node = RootSchedulerCallbackHandle::from_raw(94820);
    caller_built.current_callback_node = RootSchedulerCallbackHandle::from_raw(94820);
    let caller_built_error =
        consume_finished_work_queue_lane_commit_currentness_for_canary(&mut store, &caller_built)
            .unwrap_err();
    assert_eq!(
        caller_built_error,
        RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::SourceNotPending {
            root: root_id,
            finished_work: consumed.finished_work(),
            commit_order: consumed.commit_order()
        }
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        consumed.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_finished_work_queue_lane_commit_currentness_rejects_stale_live_root_state() {
    let (mut store, root_id, host) = root_store();
    let (_accepted, handoff, queue_handoff) =
        sync_queue_lane_scheduler_handoff(&mut store, root_id, RootElementHandle::from_raw(9483));
    let execution = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
        Some(&queue_handoff),
    )
    .unwrap();
    let stale_finished_work = execution.commit().unwrap().finished_work();

    update_container_sync(&mut store, root_id, RootElementHandle::from_raw(9484), None).unwrap();
    let next_render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
    let next_commit = commit_finished_host_root(&mut store, next_render).unwrap();

    let error =
        consume_finished_work_queue_lane_commit_currentness_for_canary(&mut store, &execution)
            .unwrap_err();

    assert_eq!(
        error,
        RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::LiveRootStateMismatch {
            root: root_id,
            expected_current: stale_finished_work,
            actual_current: next_commit.current(),
            expected_finished_work: None,
            actual_finished_work: None,
            expected_finished_lanes: Lanes::NO,
            actual_finished_lanes: Lanes::NO,
            expected_pending_lanes: Lanes::NO,
            actual_pending_lanes: Lanes::NO
        }
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        next_commit.current()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_finished_work_queue_lane_commit_currentness_rejects_scheduler_only_and_skipped_lane_smuggling()
 {
    let (mut store, root_id, _host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_accepted, handoff, _queue_handoff) =
        sync_queue_lane_scheduler_handoff(&mut store, root_id, RootElementHandle::from_raw(9485));
    let scheduler_only = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
        None,
    )
    .unwrap();
    assert_eq!(
            consume_finished_work_queue_lane_commit_currentness_for_canary(
                &mut store,
                &scheduler_only,
            )
            .unwrap_err(),
            RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::UnacceptedSchedulerContinuation
        );
    assert_eq!(store.root(root_id).unwrap().current(), current);

    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let skipped_default =
        update_container(&mut store, root_id, RootElementHandle::from_raw(9486), None).unwrap();
    let committed_sync =
        update_container_sync(&mut store, root_id, RootElementHandle::from_raw(9487), None)
            .unwrap();
    ensure_root_is_scheduled(&mut store, committed_sync.schedule()).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
    record_root_finished_work_for_scheduler_handoff_for_canary(&mut store, render).unwrap();
    let handoff = root_sync_flush_record_for_canary(0, root_id, Lanes::SYNC, render);
    let forged_handoff = HostRootUpdateQueueLaneHandoffRecordForCanary {
        root: root_id,
        current: render.current(),
        finished_work: render.finished_work(),
        current_update_queue: render.current_update_queue(),
        work_in_progress_update_queue: render.work_in_progress_update_queue(),
        pending_lanes_before_render: Lanes::SYNC.merge(Lanes::DEFAULT),
        selected_next_lanes_before_render: Lanes::SYNC,
        finished_lanes: Lanes::SYNC,
        remaining_lanes: Lanes::DEFAULT,
        pending_lanes_after_render: Lanes::SYNC.merge(Lanes::DEFAULT),
        update_records: vec![
            HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
                sequence: 0,
                update: skipped_default.update(),
                lane: skipped_default.lane(),
                source_lanes: Lanes::DEFAULT,
                pending_lanes_after_enqueue: skipped_default.pending_lanes_after_enqueue(),
                selected_next_lanes_after_enqueue: skipped_default.selected_next_lanes(),
            },
            HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
                sequence: 1,
                update: committed_sync.update(),
                lane: committed_sync.lane(),
                source_lanes: Lanes::SYNC,
                pending_lanes_after_enqueue: committed_sync.pending_lanes_after_enqueue(),
                selected_next_lanes_after_enqueue: committed_sync.selected_next_lanes(),
            },
        ],
        current_queue_base_updates: vec![skipped_default.update(), committed_sync.update()],
        applied_update_count: render.applied_update_count(),
        skipped_update_count: render.skipped_update_count(),
        resulting_element: render.resulting_element(),
    };
    let skipped = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
        Some(&forged_handoff),
    )
    .unwrap();

    assert_eq!(
        consume_finished_work_queue_lane_commit_currentness_for_canary(&mut store, &skipped)
            .unwrap_err(),
        RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::UnacceptedSchedulerContinuation
    );
    assert!(skipped.blocked_by_queue_lane_handoff());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_queue_lane_continuation_rejects_scheduler_only_evidence() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_accepted, handoff, _queue_handoff) =
        sync_queue_lane_scheduler_handoff(&mut store, root_id, RootElementHandle::from_raw(9042));

    let execution = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
        None,
    )
    .unwrap();

    assert_eq!(
            execution.status(),
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert!(execution.blocked_by_queue_lane_handoff());
    assert!(
        execution
            .finished_work_handoff_identity()
            .unwrap()
            .accepted_for_root_scheduler_commit_handoff()
    );
    assert_eq!(
        execution.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::MissingQueueHandoff {
                root: root_id,
                finished_work: handoff.render_phase().finished_work()
            }
        )
    );
    assert!(execution.queue_handoff().is_none());
    assert!(execution.queue_commit_handoff().is_none());
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(
        store.root(root_id).unwrap().finished_work(),
        Some(handoff.render_phase().finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_queue_lane_continuation_rejects_stale_callback_identity() {
    let (mut store, root_id, host) = root_store();
    let stale_callback = scheduled_callback_request(&mut store, root_id);
    assert!(stale_callback.node().is_some());

    let stale_render = execute_scheduled_root_callback(&mut store, stale_callback)
        .unwrap()
        .render_phase()
        .unwrap();
    let stale_commit = commit_finished_host_root(&mut store, stale_render).unwrap();
    assert_eq!(stale_commit.current(), stale_render.finished_work());
    assert_eq!(
        store.root(root_id).unwrap().scheduling().callback_node(),
        RootSchedulerCallbackHandle::NONE
    );

    let (_accepted, handoff, queue_handoff) =
        sync_queue_lane_scheduler_handoff(&mut store, root_id, RootElementHandle::from_raw(9056));

    let execution = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        handoff,
        stale_callback.node(),
        Some(&queue_handoff),
    )
    .unwrap();

    assert_eq!(
        execution.status(),
        RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::StaleCallbackNode
    );
    assert!(execution.rejected_stale_callback_node());
    assert_eq!(execution.requested_callback_node(), stale_callback.node());
    assert_eq!(
        execution.current_callback_node(),
        RootSchedulerCallbackHandle::NONE
    );
    assert_eq!(execution.selected_lanes(), Lanes::NO);
    assert!(execution.finished_work_handoff_identity().is_none());
    assert!(execution.queue_handoff_error().is_none());
    assert!(execution.queue_commit_handoff().is_none());
    assert!(!execution.accepted_root_scheduler_execution_evidence_for_canary());
    assert!(!execution.accepted_root_commit_execution_evidence_for_canary());
    assert!(!execution.accepted_queue_lane_handoff_evidence_for_canary());
    assert!(execution.commit().is_none());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        stale_commit.current()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_queue_lane_continuation_rejects_stale_handoff_after_update() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_accepted, handoff, queue_handoff) =
        sync_queue_lane_scheduler_handoff(&mut store, root_id, RootElementHandle::from_raw(9043));
    update_container(&mut store, root_id, RootElementHandle::from_raw(9044), None).unwrap();

    let execution = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
        Some(&queue_handoff),
    )
    .unwrap();

    assert_eq!(
            execution.status(),
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert!(execution.blocked_by_queue_lane_handoff());
    assert_eq!(
        execution.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueLane(
                HostRootUpdateQueueLaneHandoffErrorForCanary::StalePendingLanes {
                    root: root_id,
                    expected: Lanes::SYNC,
                    actual: Lanes::SYNC.merge(Lanes::DEFAULT)
                }
            )
        )
    );
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_queue_lane_continuation_rejects_forged_row_lane_metadata() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (accepted, handoff, queue_handoff) =
        sync_queue_lane_scheduler_handoff(&mut store, root_id, RootElementHandle::from_raw(9045));
    let mut forged = queue_handoff.clone();
    forged.update_records[0].lane = Lane::DEFAULT;

    let execution = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
        Some(&forged),
    )
    .unwrap();

    assert_eq!(
            execution.status(),
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert_eq!(
        execution.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueLane(
                HostRootUpdateQueueLaneHandoffErrorForCanary::WrongLaneMetadata {
                    root: root_id,
                    queue: queue_handoff.current_update_queue(),
                    update: accepted.update(),
                    expected_lane: Lane::DEFAULT,
                    actual_lanes: Lanes::SYNC
                }
            )
        )
    );
    assert!(forged.proves_source_owned_lane_handoff());
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_queue_lane_continuation_rejects_wrong_selected_lanes() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_accepted, handoff, queue_handoff) =
        sync_queue_lane_scheduler_handoff(&mut store, root_id, RootElementHandle::from_raw(9057));
    let mut forged = queue_handoff.clone();
    forged.selected_next_lanes_before_render = Lanes::DEFAULT;

    let execution = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
        Some(&forged),
    )
    .unwrap();

    assert_eq!(
            execution.status(),
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert!(
        execution
            .finished_work_handoff_identity()
            .unwrap()
            .accepted_for_root_scheduler_commit_handoff()
    );
    assert_eq!(
        execution.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::SelectedLanesMismatch {
                root: root_id,
                expected: Lanes::SYNC,
                actual: Lanes::DEFAULT
            }
        )
    );
    assert!(!forged.proves_source_owned_lane_handoff());
    assert!(execution.queue_commit_handoff().is_none());
    assert!(!execution.accepted_queue_lane_handoff_evidence_for_canary());
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_queue_lane_continuation_rejects_wrong_finished_lanes() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_accepted, handoff, queue_handoff) =
        sync_queue_lane_scheduler_handoff(&mut store, root_id, RootElementHandle::from_raw(9046));
    let mut forged = queue_handoff.clone();
    forged.finished_lanes = Lanes::DEFAULT;

    let execution = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
        Some(&forged),
    )
    .unwrap();

    assert_eq!(
            execution.status(),
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert_eq!(
        execution.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::FinishedLanesMismatch {
                root: root_id,
                expected: Lanes::SYNC,
                actual: Lanes::DEFAULT
            }
        )
    );
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_queue_lane_continuation_rejects_replayed_queue_rows_after_current_switch() {
    let (mut store, root_id, host) = root_store();
    let (_accepted, first_handoff, stale_queue_handoff) =
        sync_queue_lane_scheduler_handoff(&mut store, root_id, RootElementHandle::from_raw(9058));
    let first_execution = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        first_handoff,
        RootSchedulerCallbackHandle::NONE,
        Some(&stale_queue_handoff),
    )
    .unwrap();
    let committed_current = first_execution.commit().unwrap().current();

    let (_accepted, second_handoff, _second_queue_handoff) =
        sync_queue_lane_scheduler_handoff(&mut store, root_id, RootElementHandle::from_raw(9059));
    let second_render = second_handoff.render_phase();
    let execution = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        second_handoff,
        RootSchedulerCallbackHandle::NONE,
        Some(&stale_queue_handoff),
    )
    .unwrap();

    assert!(first_execution.did_execute_queue_lane_scheduler_continuation());
    assert_eq!(second_render.current(), committed_current);
    assert_eq!(
            execution.status(),
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert!(
        execution
            .finished_work_handoff_identity()
            .unwrap()
            .accepted_for_root_scheduler_commit_handoff()
    );
    assert_eq!(
            execution.queue_handoff_error(),
            Some(
                &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueFiberIdentityMismatch {
                    root: root_id,
                    expected_current: second_render.current(),
                    actual_current: stale_queue_handoff.current(),
                    expected_finished_work: second_render.finished_work(),
                    actual_finished_work: stale_queue_handoff.finished_work()
                }
            )
        );
    assert!(execution.queue_commit_handoff().is_none());
    assert!(!execution.accepted_queue_lane_handoff_evidence_for_canary());
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), committed_current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_queue_lane_continuation_rejects_cross_root_handoff() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first = store
        .create_client_root(FakeContainer::new(9047), RootOptions::new())
        .unwrap();
    let second = store
        .create_client_root(FakeContainer::new(9048), RootOptions::new())
        .unwrap();
    let first_update =
        update_container_sync(&mut store, first, RootElementHandle::from_raw(9049), None).unwrap();
    let first_render = render_host_root_for_lanes(&mut store, first, Lanes::SYNC).unwrap();
    let first_queue_handoff = host_root_update_queue_lane_handoff_for_canary(
        &store,
        first,
        std::slice::from_ref(&first_update),
        first_render,
    )
    .unwrap();
    update_container_sync(&mut store, second, RootElementHandle::from_raw(9050), None).unwrap();
    let second_current = store.root(second).unwrap().current();
    let second_render = render_host_root_for_lanes(&mut store, second, Lanes::SYNC).unwrap();
    record_root_finished_work_for_scheduler_handoff_for_canary(&mut store, second_render).unwrap();
    let second_handoff = root_sync_flush_record_for_canary(0, second, Lanes::SYNC, second_render);

    let execution = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        second_handoff,
        RootSchedulerCallbackHandle::NONE,
        Some(&first_queue_handoff),
    )
    .unwrap();

    assert_eq!(
            execution.status(),
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert_eq!(
        execution.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueRootMismatch {
                expected: second,
                actual: first
            }
        )
    );
    assert!(execution.commit().is_none());
    assert_eq!(store.root(second).unwrap().current(), second_current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_queue_lane_continuation_rejects_caller_built_rows() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (accepted, handoff, queue_handoff) =
        sync_queue_lane_scheduler_handoff(&mut store, root_id, RootElementHandle::from_raw(9051));
    let mut caller_built = queue_handoff.clone();
    caller_built.update_records[0].sequence = 1;

    let execution = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
        Some(&caller_built),
    )
    .unwrap();

    assert_eq!(
            execution.status(),
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert_eq!(
            execution.queue_handoff_error(),
            Some(
                &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueHandoffNotSourceOwned {
                    root: root_id,
                    queue: queue_handoff.current_update_queue(),
                    expected_updates: vec![accepted.update()],
                    actual_updates: vec![accepted.update()],
                    records_in_sequence_order: false
                }
            )
        );
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_queue_lane_continuation_rejects_stale_scheduler_pass() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_accepted, handoff, queue_handoff) =
        sync_queue_lane_scheduler_handoff(&mut store, root_id, RootElementHandle::from_raw(9052));
    let second_render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
    record_root_finished_work_for_scheduler_handoff_for_canary(&mut store, second_render).unwrap();

    let execution = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
        Some(&queue_handoff),
    )
    .unwrap();

    assert_eq!(
            execution.status(),
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByFinishedWorkHandoffMismatch
        );
    assert!(execution.blocked_by_finished_work_handoff_mismatch());
    assert_eq!(
        execution
            .finished_work_handoff_identity()
            .unwrap()
            .root_finished_work_before_commit(),
        Some(second_render.finished_work())
    );
    assert!(execution.queue_handoff_error().is_none());
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_queue_lane_continuation_rejects_replay_after_commit() {
    let (mut store, root_id, host) = root_store();
    let (_accepted, handoff, queue_handoff) =
        sync_queue_lane_scheduler_handoff(&mut store, root_id, RootElementHandle::from_raw(9053));
    let first = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
        Some(&queue_handoff),
    )
    .unwrap();
    let committed_current = first.commit().unwrap().current();

    let replay = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
        Some(&queue_handoff),
    )
    .unwrap();

    assert!(first.did_execute_queue_lane_scheduler_continuation());
    assert_eq!(
        replay.status(),
        RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::NoSyncWork
    );
    assert!(replay.no_sync_work());
    assert!(replay.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), committed_current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_queue_lane_continuation_rejects_skipped_lane_as_committed() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let skipped_default =
        update_container(&mut store, root_id, RootElementHandle::from_raw(9054), None).unwrap();
    let committed_sync =
        update_container_sync(&mut store, root_id, RootElementHandle::from_raw(9055), None)
            .unwrap();
    ensure_root_is_scheduled(&mut store, committed_sync.schedule()).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
    record_root_finished_work_for_scheduler_handoff_for_canary(&mut store, render).unwrap();
    let handoff = root_sync_flush_record_for_canary(0, root_id, Lanes::SYNC, render);
    let forged_handoff = HostRootUpdateQueueLaneHandoffRecordForCanary {
        root: root_id,
        current: render.current(),
        finished_work: render.finished_work(),
        current_update_queue: render.current_update_queue(),
        work_in_progress_update_queue: render.work_in_progress_update_queue(),
        pending_lanes_before_render: Lanes::SYNC.merge(Lanes::DEFAULT),
        selected_next_lanes_before_render: Lanes::SYNC,
        finished_lanes: Lanes::SYNC,
        remaining_lanes: Lanes::DEFAULT,
        pending_lanes_after_render: Lanes::SYNC.merge(Lanes::DEFAULT),
        update_records: vec![
            HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
                sequence: 0,
                update: skipped_default.update(),
                lane: skipped_default.lane(),
                source_lanes: Lanes::DEFAULT,
                pending_lanes_after_enqueue: skipped_default.pending_lanes_after_enqueue(),
                selected_next_lanes_after_enqueue: skipped_default.selected_next_lanes(),
            },
            HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
                sequence: 1,
                update: committed_sync.update(),
                lane: committed_sync.lane(),
                source_lanes: Lanes::SYNC,
                pending_lanes_after_enqueue: committed_sync.pending_lanes_after_enqueue(),
                selected_next_lanes_after_enqueue: committed_sync.selected_next_lanes(),
            },
        ],
        current_queue_base_updates: vec![skipped_default.update(), committed_sync.update()],
        applied_update_count: render.applied_update_count(),
        skipped_update_count: render.skipped_update_count(),
        resulting_element: render.resulting_element(),
    };

    let execution = execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
        Some(&forged_handoff),
    )
    .unwrap();

    assert_eq!(
            execution.status(),
            RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert_eq!(
        execution.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueLane(
                HostRootUpdateQueueLaneHandoffErrorForCanary::SkippedLaneCommitted {
                    root: root_id,
                    update: skipped_default.update(),
                    skipped_lanes: Lanes::DEFAULT,
                    finished_lanes: Lanes::SYNC,
                    remaining_lanes: Lanes::DEFAULT
                }
            )
        )
    );
    assert_eq!(render.applied_update_count(), 1);
    assert_eq!(render.skipped_update_count(), 1);
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_sync_continuation_rejects_stale_callback_node() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let stale_callback = scheduled_callback_request(&mut store, root_id);
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(5962));
    process_root_schedule_in_microtask(&mut store).unwrap();
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

    let execution = execute_sync_scheduler_continuation_for_render_handoff(
        &mut store,
        rendered.records()[0],
        stale_callback.node(),
    )
    .unwrap();

    assert_eq!(
        execution.status(),
        RootSyncSchedulerContinuationExecutionStatus::StaleCallbackNode
    );
    assert!(execution.rejected_stale_callback_node());
    assert_eq!(execution.requested_callback_node(), stale_callback.node());
    assert_eq!(
        execution.current_callback_node(),
        RootSchedulerCallbackHandle::NONE
    );
    assert_eq!(execution.selected_lanes(), Lanes::NO);
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert!(
        store
            .root(root_id)
            .unwrap()
            .lanes()
            .pending_lanes()
            .contains_lane(Lane::SYNC)
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_sync_continuation_rejects_pending_passive_blocker() {
    let (mut store, root_id, host) = root_store();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(5963));
    let passive_render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
    let passive_finished_work = passive_render.finished_work();
    {
        let scheduling = store.root_mut(root_id).unwrap().scheduling_mut();
        scheduling.prepare_pending_passive(root_id, Lanes::NO);
        scheduling
            .pending_passive_mut()
            .queue_mount(passive_finished_work, Lanes::SYNC)
            .unwrap();
    }
    let passive_commit = commit_finished_host_root(&mut store, passive_render).unwrap();
    assert!(passive_commit.pending_passive_handoff().is_some());

    let current = store.root(root_id).unwrap().current();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(5964));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

    let execution = execute_sync_scheduler_continuation_for_render_handoff(
        &mut store,
        rendered.records()[0],
        RootSchedulerCallbackHandle::NONE,
    )
    .unwrap();

    assert_eq!(
        execution.status(),
        RootSyncSchedulerContinuationExecutionStatus::BlockedByPendingPassive
    );
    assert!(execution.blocked_by_pending_passive());
    assert_eq!(execution.selected_lanes(), Lanes::SYNC);
    let blocker = execution.pending_passive_blocker().unwrap();
    assert_eq!(blocker.root(), root_id);
    assert_eq!(blocker.finished_work(), Some(passive_finished_work));
    assert_eq!(blocker.lanes(), Lanes::SYNC);
    assert_eq!(blocker.pending_unmount_count(), 0);
    assert_eq!(blocker.pending_mount_count(), 1);
    assert_eq!(blocker.pending_record_count(), 1);
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .pending_passive()
            .has_commit_handoff()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_sync_continuation_rejects_mismatched_lanes() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(5965));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_finished(RootFinishedLanes::new(
            Lanes::SYNC,
            Lanes::from(Lane::SYNC_HYDRATION),
        ));

    let execution = execute_sync_scheduler_continuation_for_render_handoff(
        &mut store,
        rendered.records()[0],
        RootSchedulerCallbackHandle::NONE,
    )
    .unwrap();

    assert_eq!(
        execution.status(),
        RootSyncSchedulerContinuationExecutionStatus::BlockedByLaneMismatch
    );
    assert!(execution.blocked_by_lane_mismatch());
    assert_eq!(execution.handoff_lanes(), Lanes::SYNC);
    assert_eq!(
        execution.selected_lanes(),
        Lanes::from(Lane::SYNC_HYDRATION)
    );
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_sync_continuation_rejects_missing_finished_work_handoff() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(5966));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let handoff = rendered.records()[0];
    store.root_mut(root_id).unwrap().clear_finished_work();

    let execution = execute_sync_scheduler_continuation_for_render_handoff(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
    )
    .unwrap();

    assert_eq!(
        execution.status(),
        RootSyncSchedulerContinuationExecutionStatus::BlockedByFinishedWorkHandoffMismatch
    );
    assert!(execution.blocked_by_finished_work_handoff_mismatch());
    assert_eq!(execution.selected_lanes(), Lanes::SYNC);
    assert!(execution.commit().is_none());
    assert!(execution.root_commit_handoff_for_canary().is_none());
    let identity = execution.finished_work_handoff_identity().unwrap();
    assert_eq!(identity.root(), root_id);
    assert_eq!(identity.render_phase_root(), root_id);
    assert_eq!(
        identity.pending_work_before_commit(),
        Some(handoff.render_phase().finished_work())
    );
    assert_eq!(identity.root_finished_work_before_commit(), None);
    assert_eq!(identity.root_finished_lanes_before_commit(), Lanes::NO);
    assert!(!identity.accepted_for_root_scheduler_commit_handoff());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(handoff.render_phase().finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_sync_continuation_rejects_stale_finished_work_handoff() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(5967));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let handoff = rendered.records()[0];
    store
        .root_mut(root_id)
        .unwrap()
        .record_finished_work_for_canary(current, Lanes::SYNC);

    let execution = execute_sync_scheduler_continuation_for_render_handoff(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
    )
    .unwrap();

    assert_eq!(
        execution.status(),
        RootSyncSchedulerContinuationExecutionStatus::BlockedByFinishedWorkHandoffMismatch
    );
    assert!(execution.blocked_by_finished_work_handoff_mismatch());
    assert!(execution.commit().is_none());
    let identity = execution.finished_work_handoff_identity().unwrap();
    assert_eq!(identity.root_finished_work_before_commit(), Some(current));
    assert_eq!(
        identity.finished_work(),
        handoff.render_phase().finished_work()
    );
    assert_eq!(identity.root_finished_lanes_before_commit(), Lanes::SYNC);
    assert!(!identity.accepted_for_root_scheduler_commit_handoff());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_sync_continuation_rejects_finished_lanes_mismatch() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(59671));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let handoff = rendered.records()[0];
    store
        .root_mut(root_id)
        .unwrap()
        .record_finished_work_for_canary(
            handoff.render_phase().finished_work(),
            Lanes::from(Lane::SYNC_HYDRATION),
        );

    let execution = execute_sync_scheduler_continuation_for_render_handoff(
        &mut store,
        handoff,
        RootSchedulerCallbackHandle::NONE,
    )
    .unwrap();

    assert_eq!(
        execution.status(),
        RootSyncSchedulerContinuationExecutionStatus::BlockedByFinishedWorkHandoffMismatch
    );
    assert!(execution.blocked_by_finished_work_handoff_mismatch());
    assert!(execution.commit().is_none());
    assert!(execution.root_commit_handoff_for_canary().is_none());
    assert!(!execution.did_execute_private_sync_scheduler_continuation());
    assert!(!execution.public_root_compatibility_claimed());
    assert!(!execution.executes_public_effects());
    let identity = execution.finished_work_handoff_identity().unwrap();
    assert_eq!(
        identity.root_finished_work_before_commit(),
        Some(handoff.render_phase().finished_work())
    );
    assert_eq!(
        identity.root_finished_lanes_before_commit(),
        Lanes::from(Lane::SYNC_HYDRATION)
    );
    assert_eq!(identity.finished_lanes(), Lanes::SYNC);
    assert!(!identity.accepted_for_root_scheduler_commit_handoff());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_sync_continuation_rejects_foreign_finished_work_handoff() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let second = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let first_current = store.root(first).unwrap().current();
    let second_current = store.root(second).unwrap().current();
    schedule_sync_update(&mut store, first, RootElementHandle::from_raw(5968));
    schedule_sync_update(&mut store, second, RootElementHandle::from_raw(5969));
    let rendered = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
    let first_handoff = rendered
        .records()
        .iter()
        .copied()
        .find(|record| record.root() == first)
        .unwrap();
    let foreign_handoff =
        root_sync_flush_record_for_canary(0, second, Lanes::SYNC, first_handoff.render_phase());

    let execution = execute_sync_scheduler_continuation_for_render_handoff(
        &mut store,
        foreign_handoff,
        RootSchedulerCallbackHandle::NONE,
    )
    .unwrap();

    assert_eq!(
        execution.status(),
        RootSyncSchedulerContinuationExecutionStatus::BlockedByFinishedWorkHandoffMismatch
    );
    assert!(execution.blocked_by_finished_work_handoff_mismatch());
    assert!(execution.commit().is_none());
    let identity = execution.finished_work_handoff_identity().unwrap();
    assert_eq!(identity.root(), second);
    assert_eq!(identity.render_phase_root(), first);
    assert_ne!(
        identity.root_finished_work_before_commit(),
        Some(identity.finished_work())
    );
    assert!(!identity.accepted_for_root_scheduler_commit_handoff());
    assert_eq!(store.root(first).unwrap().current(), first_current);
    assert_eq!(store.root(second).unwrap().current(), second_current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_lane_continuation_marks_starved_default_and_commits_private_handoff() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    schedule_default_update(&mut store, root_id);
    assert!(
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .set_expiration_time(Lane::DEFAULT, 10)
    );

    let execution = execute_expired_lane_sync_scheduler_continuation_for_root_for_canary(
        &mut store,
        root_id,
        10,
        RootSchedulerCallbackHandle::NONE,
    )
    .unwrap();

    assert_eq!(
        execution.status(),
        RootExpiredLaneSyncSchedulerContinuationStatus::RenderedAndCommitted
    );
    assert_eq!(execution.root(), root_id);
    assert_eq!(execution.current_time(), 10);
    assert_eq!(
        execution.requested_callback_node(),
        RootSchedulerCallbackHandle::NONE
    );
    assert_eq!(
        execution.current_callback_node(),
        RootSchedulerCallbackHandle::NONE
    );
    assert_eq!(execution.expired_lanes_before(), Lanes::NO);
    assert_eq!(execution.expired_lanes_after(), Lanes::DEFAULT);
    assert_eq!(execution.selected_priority_lanes(), Lanes::DEFAULT);
    assert_eq!(execution.selected_render_lanes(), Lanes::DEFAULT);
    assert_eq!(execution.selected_expired_lanes(), Lanes::DEFAULT);
    assert!(execution.did_execute_expired_lane_sync_continuation());
    assert!(execution.consumed_accepted_scheduler_continuation_record());
    assert!(execution.async_callback_execution_blocked());
    assert!(execution.public_update_scheduling_blocked());
    assert!(!execution.public_root_compatibility_claimed());
    assert!(!execution.executes_public_effects());

    let handoff = execution.handoff().unwrap();
    assert_eq!(handoff.root(), root_id);
    assert_eq!(handoff.lanes(), Lanes::DEFAULT);
    assert_eq!(
        handoff.status(),
        RootSyncFlushRecordStatus::RenderedAwaitingCommit
    );
    let continuation = execution.continuation().unwrap();
    assert_eq!(
        continuation.status(),
        RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted
    );
    assert_eq!(continuation.handoff(), handoff);
    assert_eq!(continuation.selected_lanes(), Lanes::DEFAULT);
    assert!(continuation.did_execute_private_sync_scheduler_continuation());
    let commit = execution.commit().unwrap();
    assert_eq!(commit.root(), root_id);
    assert_eq!(commit.previous_current(), current);
    assert_eq!(commit.current(), handoff.render_phase().finished_work());
    assert_eq!(commit.finished_lanes(), Lanes::DEFAULT);
    assert_eq!(commit.pending_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        handoff.render_phase().finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert!(!store.root_scheduler().might_have_pending_sync_work());
    assert!(store.scheduler_bridge().callback_requests().is_empty());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_lane_continuation_uses_priority_selection_for_sync_batch() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    schedule_default_update(&mut store, root_id);
    assert!(
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .set_expiration_time(Lane::DEFAULT, 10)
    );
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(6252));

    let execution = execute_expired_lane_sync_scheduler_continuation_for_root_for_canary(
        &mut store,
        root_id,
        10,
        RootSchedulerCallbackHandle::NONE,
    )
    .unwrap();

    assert_eq!(
        execution.status(),
        RootExpiredLaneSyncSchedulerContinuationStatus::RenderedAndCommitted
    );
    assert_eq!(execution.expired_lanes_after(), Lanes::DEFAULT);
    assert_eq!(
        execution.selected_priority_lanes(),
        Lanes::SYNC.merge(Lanes::DEFAULT)
    );
    assert_eq!(
        execution.selected_render_lanes(),
        Lanes::SYNC.merge(Lanes::DEFAULT)
    );
    assert_eq!(execution.selected_expired_lanes(), Lanes::DEFAULT);
    assert!(execution.did_execute_expired_lane_sync_continuation());
    let handoff = execution.handoff().unwrap();
    assert_eq!(handoff.lanes(), Lanes::SYNC.merge(Lanes::DEFAULT));
    let continuation = execution.continuation().unwrap();
    assert_eq!(
        continuation.status(),
        RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted
    );
    assert_eq!(
        continuation.selected_lanes(),
        Lanes::SYNC.merge(Lanes::DEFAULT)
    );
    let commit = execution.commit().unwrap();
    assert_eq!(commit.previous_current(), current);
    assert_eq!(commit.current(), handoff.render_phase().finished_work());
    assert_eq!(commit.finished_lanes(), Lanes::SYNC.merge(Lanes::DEFAULT));
    assert_eq!(commit.pending_lanes(), Lanes::NO);
    assert_eq!(store.root(root_id).unwrap().current(), commit.current());
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_default_sync_queue_lane_continuation_accepts_source_owned_handoff() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let default_element = RootElementHandle::from_raw(9061);
    let sync_element = RootElementHandle::from_raw(9062);
    let (default_update, sync_update, handoff, queue_handoff) =
        expired_default_sync_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            default_element,
            sync_element,
        );

    let execution =
        execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
            handoff,
            Some(&queue_handoff),
        )
        .unwrap();

    assert_eq!(
        execution.status(),
        RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::RenderedAndCommitted
    );
    assert_eq!(execution.root(), root_id);
    assert_eq!(execution.current_time(), 10);
    assert_eq!(
        execution.requested_callback_node(),
        RootSchedulerCallbackHandle::NONE
    );
    assert_eq!(
        execution.current_callback_node(),
        RootSchedulerCallbackHandle::NONE
    );
    assert_eq!(execution.expired_lanes_before(), Lanes::DEFAULT);
    assert_eq!(execution.expired_lanes_after(), Lanes::DEFAULT);
    assert_eq!(
        execution.selected_priority_lanes(),
        Lanes::SYNC.merge(Lanes::DEFAULT)
    );
    assert_eq!(
        execution.selected_render_lanes(),
        Lanes::SYNC.merge(Lanes::DEFAULT)
    );
    assert_eq!(execution.selected_expired_lanes(), Lanes::DEFAULT);
    assert!(execution.did_execute_expired_queue_lane_scheduler_continuation());
    assert!(execution.proves_expired_default_plus_sync_lane_selection_for_canary());
    assert!(execution.consumed_accepted_queue_lane_scheduler_continuation_record());
    assert!(execution.routed_through_expired_queue_lane_scheduler_and_commit_evidence_for_canary());
    assert!(execution.treats_host_root_update_as_current_only_with_queue_lane_handoff_for_canary());
    assert!(execution.async_callback_execution_blocked());
    assert!(execution.public_update_scheduling_blocked());
    assert!(!execution.public_root_compatibility_claimed());
    assert!(!execution.executes_public_effects());

    let continuation = execution.continuation().unwrap();
    assert_eq!(
        continuation.status(),
        RootSyncSchedulerQueueLaneContinuationExecutionStatusForCanary::RenderedAndCommitted
    );
    assert_eq!(continuation.handoff(), handoff);
    assert_eq!(
        continuation.selected_lanes(),
        Lanes::SYNC.merge(Lanes::DEFAULT)
    );
    assert!(continuation.accepted_root_scheduler_execution_evidence_for_canary());
    assert!(continuation.accepted_root_commit_execution_evidence_for_canary());
    assert!(continuation.accepted_queue_lane_handoff_evidence_for_canary());
    assert!(continuation.routed_through_root_scheduler_queue_lane_and_commit_evidence_for_canary());

    let queue_commit_handoff = execution.queue_commit_handoff().unwrap();
    assert_eq!(queue_commit_handoff.queue_handoff(), &queue_handoff);
    assert_eq!(
        queue_commit_handoff.update_sequence_ids(),
        &[default_update.update(), sync_update.update()]
    );
    assert_eq!(
        queue_commit_handoff.selected_lanes(),
        Lanes::SYNC.merge(Lanes::DEFAULT)
    );
    assert_eq!(
        queue_commit_handoff.finished_lanes(),
        Lanes::SYNC.merge(Lanes::DEFAULT)
    );
    assert_eq!(queue_commit_handoff.remaining_lanes(), Lanes::NO);
    assert_eq!(queue_commit_handoff.applied_update_count(), 2);
    assert_eq!(queue_commit_handoff.skipped_update_count(), 0);
    assert_eq!(queue_commit_handoff.resulting_element(), sync_element);
    assert!(queue_commit_handoff.proves_queue_lane_handoff_gated_current_switch());

    let rows = queue_commit_handoff.queue_handoff().update_records();
    assert_eq!(rows.len(), 2);
    assert_eq!(rows[0].sequence(), 0);
    assert_eq!(rows[0].update(), default_update.update());
    assert_eq!(rows[0].lane(), Lane::DEFAULT);
    assert_eq!(rows[0].source_lanes(), Lanes::DEFAULT);
    assert_eq!(rows[1].sequence(), 1);
    assert_eq!(rows[1].update(), sync_update.update());
    assert_eq!(rows[1].lane(), Lane::SYNC);
    assert_eq!(rows[1].source_lanes(), Lanes::SYNC);
    for row in rows {
        assert_eq!(
            store
                .update_queues()
                .update(row.update())
                .unwrap()
                .lane()
                .remove_lane(Lane::OFFSCREEN),
            row.source_lanes()
        );
    }

    let commit = execution.commit().unwrap();
    assert_eq!(commit.root(), root_id);
    assert_eq!(commit.previous_current(), current);
    assert_eq!(commit.current(), handoff.render_phase().finished_work());
    assert_eq!(
        commit.finished_work(),
        handoff.render_phase().finished_work()
    );
    assert_eq!(commit.finished_lanes(), Lanes::SYNC.merge(Lanes::DEFAULT));
    assert_eq!(commit.remaining_lanes(), Lanes::NO);
    assert_eq!(commit.pending_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().current(),
        handoff.render_phase().finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().lanes().pending_lanes(),
        Lanes::NO
    );
    assert!(!store.root_scheduler().might_have_pending_sync_work());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_default_sync_queue_lane_currentness_consumes_finished_work_source() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let default_element = RootElementHandle::from_raw(9801);
    let sync_element = RootElementHandle::from_raw(9802);
    let (default_update, sync_update, handoff, queue_handoff) =
        expired_default_sync_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            default_element,
            sync_element,
        );
    let prepared = prepare_test_renderer_host_output_canary_fibers(
        &mut store,
        handoff.render_phase(),
        TestRendererHostOutputCanaryFixture::new(98010, 98011, 98012),
    )
    .unwrap();
    let completed =
        finish_test_renderer_host_output_canary_fibers(&mut store, prepared, 98013, 98014).unwrap();

    let execution =
        execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
            handoff,
            Some(&queue_handoff),
        )
        .unwrap();
    let continuation = execution.continuation().unwrap();
    assert!(continuation.currentness_source_token().is_some());

    let currentness = consume_expired_default_sync_queue_lane_commit_currentness_for_canary(
        &mut store, &execution,
    )
    .unwrap();
    let finished = currentness.currentness();

    assert!(currentness.source_owned_currentness_consumed());
    assert!(
        currentness.ties_expired_default_sync_queue_lane_commit_to_live_tree_state_for_canary()
    );
    assert_eq!(currentness.root(), root_id);
    assert_eq!(currentness.current_time(), 10);
    assert_eq!(currentness.expired_lanes_after(), Lanes::DEFAULT);
    assert_eq!(
        currentness.selected_priority_lanes(),
        Lanes::SYNC.merge(Lanes::DEFAULT)
    );
    assert_eq!(
        currentness.selected_render_lanes(),
        Lanes::SYNC.merge(Lanes::DEFAULT)
    );
    assert_eq!(finished.previous_current(), current);
    assert_eq!(
        finished.finished_work(),
        handoff.render_phase().finished_work()
    );
    assert_eq!(finished.selected_lanes(), Lanes::SYNC.merge(Lanes::DEFAULT));
    assert_eq!(finished.finished_lanes(), Lanes::SYNC.merge(Lanes::DEFAULT));
    assert_eq!(finished.remaining_lanes(), Lanes::NO);
    assert_eq!(
        finished.update_sequence_ids(),
        &[default_update.update(), sync_update.update()]
    );
    assert_eq!(finished.resulting_element(), sync_element);
    assert_eq!(finished.committed_element_after_consume(), sync_element);
    assert_eq!(finished.committed_root_children(), &[completed.component()]);
    assert!(finished.commit_mutation_record_count() > 0);
    assert_eq!(finished.commit_deletion_list_count(), 0);
    assert!(execution.routed_through_expired_queue_lane_scheduler_and_commit_evidence_for_canary());
    assert!(!currentness.public_root_compatibility_claimed());
    assert!(!currentness.public_scheduler_timing_compatibility_claimed());
    assert!(!currentness.public_act_compatibility_claimed());
    assert!(!currentness.react_dom_compatibility_claimed());
    assert!(!currentness.test_renderer_compatibility_claimed());
    assert!(!currentness.native_execution_compatibility_claimed());
    assert!(!currentness.package_compatibility_claimed());
    assert!(!currentness.executes_public_effects());
    assert_eq!(
        store.root(root_id).unwrap().current(),
        handoff.render_phase().finished_work()
    );
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_default_sync_queue_lane_currentness_rejects_preconsume_clone_and_replay()
{
    let (mut store, root_id, host) = root_store();
    let (_default_update, _sync_update, handoff, queue_handoff) =
        expired_default_sync_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            RootElementHandle::from_raw(9803),
            RootElementHandle::from_raw(9804),
        );
    let execution =
        execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
            handoff,
            Some(&queue_handoff),
        )
        .unwrap();
    let cloned_execution = execution.clone();
    let continuation = execution.continuation().unwrap();
    let cloned_continuation = cloned_execution.continuation().unwrap();
    let finished_work = continuation.commit().unwrap().finished_work();
    let commit_order = continuation
        .queue_commit_handoff()
        .unwrap()
        .finished_work_handoff()
        .commit_order();

    assert!(continuation.currentness_source_token().is_some());
    assert_eq!(cloned_continuation.currentness_source_token(), None);
    assert_eq!(
            consume_expired_default_sync_queue_lane_commit_currentness_for_canary(
                &mut store,
                &cloned_execution,
            )
            .unwrap_err(),
            RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary::FinishedWorkQueueLaneCurrentness(
                RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::SourceNotPending {
                    root: root_id,
                    finished_work,
                    commit_order
                }
            )
        );

    let consumed = consume_expired_default_sync_queue_lane_commit_currentness_for_canary(
        &mut store, &execution,
    )
    .unwrap();
    assert!(consumed.ties_expired_default_sync_queue_lane_commit_to_live_tree_state_for_canary());
    assert_eq!(
            consume_expired_default_sync_queue_lane_commit_currentness_for_canary(
                &mut store, &execution,
            )
            .unwrap_err(),
            RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary::FinishedWorkQueueLaneCurrentness(
                RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::SourceAlreadyConsumed {
                    root: root_id,
                    finished_work,
                    commit_order
                }
            )
        );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_default_sync_queue_lane_currentness_rejects_wrong_lanes_and_missing_underlying()
 {
    let (mut store, root_id, host) = root_store();
    let (_default_update, _sync_update, handoff, queue_handoff) =
        expired_default_sync_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            RootElementHandle::from_raw(9805),
            RootElementHandle::from_raw(9806),
        );
    let execution =
        execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
            handoff,
            Some(&queue_handoff),
        )
        .unwrap();

    let mut wrong_expired = execution.clone();
    wrong_expired.expired_lanes_after = Lanes::SYNC;
    assert_eq!(
            consume_expired_default_sync_queue_lane_commit_currentness_for_canary(
                &mut store,
                &wrong_expired,
            )
            .unwrap_err(),
            RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary::WrongExpiredDefaultSyncLaneSelection {
                root: root_id,
                expired_lanes_after: Lanes::SYNC,
                selected_priority_lanes: Lanes::SYNC.merge(Lanes::DEFAULT),
                selected_render_lanes: Lanes::SYNC.merge(Lanes::DEFAULT)
            }
        );

    let mut wrong_selected = execution.clone();
    wrong_selected.selected_priority_lanes = Lanes::DEFAULT;
    assert_eq!(
            consume_expired_default_sync_queue_lane_commit_currentness_for_canary(
                &mut store,
                &wrong_selected,
            )
            .unwrap_err(),
            RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary::WrongExpiredDefaultSyncLaneSelection {
                root: root_id,
                expired_lanes_after: Lanes::DEFAULT,
                selected_priority_lanes: Lanes::DEFAULT,
                selected_render_lanes: Lanes::SYNC.merge(Lanes::DEFAULT)
            }
        );

    let mut missing_underlying = execution.clone();
    missing_underlying.continuation = None;
    assert_eq!(
            consume_expired_default_sync_queue_lane_commit_currentness_for_canary(
                &mut store,
                &missing_underlying,
            )
            .unwrap_err(),
            RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary::MissingUnderlyingQueueLaneContinuation {
                root: root_id
            }
        );

    let accepted = consume_expired_default_sync_queue_lane_commit_currentness_for_canary(
        &mut store, &execution,
    )
    .unwrap();
    assert!(accepted.ties_expired_default_sync_queue_lane_commit_to_live_tree_state_for_canary());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_default_sync_queue_lane_currentness_rejects_caller_shaped_wrapper_before_consuming_source()
 {
    let (mut store, root_id, host) = root_store();
    let (_default_update, _sync_update, handoff, queue_handoff) =
        expired_default_sync_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            RootElementHandle::from_raw(9812),
            RootElementHandle::from_raw(9813),
        );
    let execution =
        execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
            handoff,
            Some(&queue_handoff),
        )
        .unwrap();
    let continuation = execution.continuation().unwrap();
    let source_token = continuation.currentness_source_token();
    assert!(source_token.is_some());

    let mut forged_wrapper = execution.clone();
    forged_wrapper.requested_callback_node = RootSchedulerCallbackHandle::from_raw(98120);
    forged_wrapper.current_callback_node = RootSchedulerCallbackHandle::from_raw(98120);
    forged_wrapper.continuation = Some(
        clone_queue_lane_continuation_preserving_currentness_source(continuation),
    );

    assert!(forged_wrapper.proves_expired_default_plus_sync_lane_selection_for_canary());
    assert!(forged_wrapper.consumed_accepted_queue_lane_scheduler_continuation_record());
    assert!(
        !forged_wrapper
            .routed_through_expired_queue_lane_scheduler_and_commit_evidence_for_canary()
    );
    assert_eq!(
        forged_wrapper
            .continuation()
            .unwrap()
            .currentness_source_token(),
        source_token
    );
    assert_eq!(
            consume_expired_default_sync_queue_lane_commit_currentness_for_canary(
                &mut store,
                &forged_wrapper,
            )
            .unwrap_err(),
            RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary::ExpiredWrapperMetadataMismatch {
                root: root_id,
                field: "requested_callback_node"
            }
        );

    let accepted = consume_expired_default_sync_queue_lane_commit_currentness_for_canary(
        &mut store, &execution,
    )
    .unwrap();
    assert!(accepted.ties_expired_default_sync_queue_lane_commit_to_live_tree_state_for_canary());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_default_sync_queue_lane_currentness_rejects_time_and_expired_before_drift_before_consuming_source()
 {
    let (mut store, root_id, host) = root_store();
    let (_default_update, _sync_update, handoff, queue_handoff) =
        expired_default_sync_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            RootElementHandle::from_raw(9814),
            RootElementHandle::from_raw(9815),
        );
    let execution =
        execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            EXPIRED_DEFAULT_SYNC_QUEUE_LANE_CURRENTNESS_TIME_FOR_CANARY,
            RootSchedulerCallbackHandle::NONE,
            handoff,
            Some(&queue_handoff),
        )
        .unwrap();
    let continuation = execution.continuation().unwrap();
    let source_token = continuation.currentness_source_token();
    assert!(source_token.is_some());

    let mut wrong_time = execution.clone();
    wrong_time.current_time =
        EXPIRED_DEFAULT_SYNC_QUEUE_LANE_CURRENTNESS_TIME_FOR_CANARY.saturating_add(1);
    wrong_time.continuation = Some(clone_queue_lane_continuation_preserving_currentness_source(
        continuation,
    ));
    assert!(wrong_time.proves_expired_default_plus_sync_lane_selection_for_canary());
    assert!(wrong_time.consumed_accepted_queue_lane_scheduler_continuation_record());
    assert!(
        !wrong_time.routed_through_expired_queue_lane_scheduler_and_commit_evidence_for_canary()
    );
    assert_eq!(
        wrong_time
            .continuation()
            .unwrap()
            .currentness_source_token(),
        source_token
    );
    assert_eq!(
            consume_expired_default_sync_queue_lane_commit_currentness_for_canary(
                &mut store,
                &wrong_time,
            )
            .unwrap_err(),
            RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary::ExpiredWrapperMetadataMismatch {
                root: root_id,
                field: "current_time"
            }
        );

    let mut wrong_expired_before = execution.clone();
    wrong_expired_before.expired_lanes_before = Lanes::NO;
    wrong_expired_before.continuation = Some(
        clone_queue_lane_continuation_preserving_currentness_source(continuation),
    );
    assert!(wrong_expired_before.proves_expired_default_plus_sync_lane_selection_for_canary());
    assert!(wrong_expired_before.consumed_accepted_queue_lane_scheduler_continuation_record());
    assert!(
        !wrong_expired_before
            .routed_through_expired_queue_lane_scheduler_and_commit_evidence_for_canary()
    );
    assert_eq!(
        wrong_expired_before
            .continuation()
            .unwrap()
            .currentness_source_token(),
        source_token
    );
    assert_eq!(
            consume_expired_default_sync_queue_lane_commit_currentness_for_canary(
                &mut store,
                &wrong_expired_before,
            )
            .unwrap_err(),
            RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary::ExpiredWrapperMetadataMismatch {
                root: root_id,
                field: "expired_lanes_before"
            }
        );

    let accepted = consume_expired_default_sync_queue_lane_commit_currentness_for_canary(
        &mut store, &execution,
    )
    .unwrap();
    assert!(accepted.ties_expired_default_sync_queue_lane_commit_to_live_tree_state_for_canary());
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_default_sync_queue_lane_currentness_rejects_stale_live_root_state() {
    let (mut store, root_id, host) = root_store();
    let (_default_update, _sync_update, handoff, queue_handoff) =
        expired_default_sync_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            RootElementHandle::from_raw(9807),
            RootElementHandle::from_raw(9808),
        );
    let execution =
        execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
            handoff,
            Some(&queue_handoff),
        )
        .unwrap();
    let stale_finished_work = execution.commit().unwrap().finished_work();

    update_container_sync(&mut store, root_id, RootElementHandle::from_raw(9809), None).unwrap();
    let next_render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
    let next_commit = commit_finished_host_root(&mut store, next_render).unwrap();

    assert_eq!(
            consume_expired_default_sync_queue_lane_commit_currentness_for_canary(
                &mut store,
                &execution,
            )
            .unwrap_err(),
            RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary::FinishedWorkQueueLaneCurrentness(
                RootFinishedWorkQueueLaneCommitCurrentnessErrorForCanary::LiveRootStateMismatch {
                    root: root_id,
                    expected_current: stale_finished_work,
                    actual_current: next_commit.current(),
                    expected_finished_work: None,
                    actual_finished_work: None,
                    expected_finished_lanes: Lanes::NO,
                    actual_finished_lanes: Lanes::NO,
                    expected_pending_lanes: Lanes::NO,
                    actual_pending_lanes: Lanes::NO
                }
            )
        );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        next_commit.current()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_default_sync_queue_lane_currentness_rejects_scheduler_only_evidence() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_default_update, _sync_update, handoff, _queue_handoff) =
        expired_default_sync_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            RootElementHandle::from_raw(9810),
            RootElementHandle::from_raw(9811),
        );

    let scheduler_only =
        execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
            handoff,
            None,
        )
        .unwrap();

    assert_eq!(
            scheduler_only.status(),
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert_eq!(
            consume_expired_default_sync_queue_lane_commit_currentness_for_canary(
                &mut store,
                &scheduler_only,
            )
            .unwrap_err(),
            RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary::UnacceptedUnderlyingQueueLaneContinuation {
                root: root_id,
                status: RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
            }
        );
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_default_sync_queue_lane_continuation_rejects_missing_queue_proof() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_default_update, _sync_update, handoff, _queue_handoff) =
        expired_default_sync_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            RootElementHandle::from_raw(9063),
            RootElementHandle::from_raw(9064),
        );

    let execution =
        execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
            handoff,
            None,
        )
        .unwrap();

    assert_eq!(
            execution.status(),
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert!(execution.blocked_by_queue_lane_handoff());
    assert!(execution.proves_expired_default_plus_sync_lane_selection_for_canary());
    assert_eq!(
        execution.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::MissingQueueHandoff {
                root: root_id,
                finished_work: handoff.render_phase().finished_work()
            }
        )
    );
    assert!(execution.queue_commit_handoff().is_none());
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(
        store.root(root_id).unwrap().finished_work(),
        Some(handoff.render_phase().finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_default_sync_queue_lane_continuation_rejects_stale_queue_after_update() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (default_update, sync_update, handoff, queue_handoff) =
        expired_default_sync_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            RootElementHandle::from_raw(9065),
            RootElementHandle::from_raw(9066),
        );
    let stale_extra =
        update_container(&mut store, root_id, RootElementHandle::from_raw(9067), None).unwrap();

    let execution =
        execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
            handoff,
            Some(&queue_handoff),
        )
        .unwrap();

    assert_eq!(
            execution.status(),
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert!(execution.blocked_by_queue_lane_handoff());
    assert_eq!(
        execution.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueLane(
                HostRootUpdateQueueLaneHandoffErrorForCanary::QueueOrderMismatch {
                    root: root_id,
                    queue: queue_handoff.current_update_queue(),
                    expected_updates: vec![default_update.update(), sync_update.update()],
                    actual_updates: vec![
                        default_update.update(),
                        sync_update.update(),
                        stale_extra.update()
                    ]
                }
            )
        )
    );
    assert_eq!(
            consume_expired_default_sync_queue_lane_commit_currentness_for_canary(
                &mut store, &execution,
            )
            .unwrap_err(),
            RootExpiredDefaultSyncQueueLaneCommitCurrentnessErrorForCanary::UnacceptedUnderlyingQueueLaneContinuation {
                root: root_id,
                status: RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
            }
        );
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_default_sync_queue_lane_continuation_rejects_stale_scheduler_pass() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_default_update, _sync_update, handoff, queue_handoff) =
        expired_default_sync_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            RootElementHandle::from_raw(9068),
            RootElementHandle::from_raw(9069),
        );
    let second_render =
        render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC.merge(Lanes::DEFAULT)).unwrap();
    record_root_finished_work_for_scheduler_handoff_for_canary(&mut store, second_render).unwrap();

    let execution =
        execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
            handoff,
            Some(&queue_handoff),
        )
        .unwrap();

    assert_eq!(
            execution.status(),
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByFinishedWorkHandoffMismatch
        );
    assert_eq!(execution.handoff(), Some(handoff));
    assert!(!execution.consumed_accepted_queue_lane_scheduler_continuation_record());
    assert!(
        !execution.routed_through_expired_queue_lane_scheduler_and_commit_evidence_for_canary()
    );
    let continuation = execution.continuation().unwrap();
    assert!(continuation.blocked_by_finished_work_handoff_mismatch());
    assert_eq!(
        continuation
            .finished_work_handoff_identity()
            .unwrap()
            .root_finished_work_before_commit(),
        Some(second_render.finished_work())
    );
    assert!(execution.queue_handoff_error().is_none());
    assert!(execution.queue_commit_handoff().is_none());
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_default_sync_queue_lane_continuation_rejects_forged_row_metadata() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (default_update, _sync_update, handoff, queue_handoff) =
        expired_default_sync_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            RootElementHandle::from_raw(9070),
            RootElementHandle::from_raw(9071),
        );
    let mut forged = queue_handoff.clone();
    forged.update_records[0].lane = Lane::TRANSITION_1;

    let execution =
        execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
            handoff,
            Some(&forged),
        )
        .unwrap();

    assert_eq!(
            execution.status(),
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert_eq!(
        execution.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueLane(
                HostRootUpdateQueueLaneHandoffErrorForCanary::WrongLaneMetadata {
                    root: root_id,
                    queue: queue_handoff.current_update_queue(),
                    update: default_update.update(),
                    expected_lane: Lane::TRANSITION_1,
                    actual_lanes: Lanes::DEFAULT
                }
            )
        )
    );
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_default_sync_queue_lane_continuation_rejects_wrong_selected_lanes() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_default_update, _sync_update, handoff, queue_handoff) =
        expired_default_sync_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            RootElementHandle::from_raw(9072),
            RootElementHandle::from_raw(9073),
        );
    let mut forged = queue_handoff.clone();
    forged.selected_next_lanes_before_render = Lanes::DEFAULT;

    let execution =
        execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
            handoff,
            Some(&forged),
        )
        .unwrap();

    assert_eq!(
            execution.status(),
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert_eq!(
        execution.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::SelectedLanesMismatch {
                root: root_id,
                expected: Lanes::SYNC.merge(Lanes::DEFAULT),
                actual: Lanes::DEFAULT
            }
        )
    );
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_default_sync_queue_lane_continuation_rejects_wrong_finished_lanes() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (_default_update, _sync_update, handoff, queue_handoff) =
        expired_default_sync_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            RootElementHandle::from_raw(9074),
            RootElementHandle::from_raw(9075),
        );
    let mut forged = queue_handoff.clone();
    forged.finished_lanes = Lanes::DEFAULT;

    let execution =
        execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
            handoff,
            Some(&forged),
        )
        .unwrap();

    assert_eq!(
            execution.status(),
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert_eq!(
        execution.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::FinishedLanesMismatch {
                root: root_id,
                expected: Lanes::SYNC.merge(Lanes::DEFAULT),
                actual: Lanes::DEFAULT
            }
        )
    );
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_default_sync_queue_lane_continuation_rejects_cross_root_evidence() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first = store
        .create_client_root(FakeContainer::new(9076), RootOptions::new())
        .unwrap();
    let second = store
        .create_client_root(FakeContainer::new(9077), RootOptions::new())
        .unwrap();
    let (_first_default, _first_sync, _first_handoff, first_queue_handoff) =
        expired_default_sync_queue_lane_scheduler_handoff(
            &mut store,
            first,
            RootElementHandle::from_raw(9078),
            RootElementHandle::from_raw(9079),
        );
    let second_current = store.root(second).unwrap().current();
    let (_second_default, _second_sync, second_handoff, _second_queue_handoff) =
        expired_default_sync_queue_lane_scheduler_handoff(
            &mut store,
            second,
            RootElementHandle::from_raw(9080),
            RootElementHandle::from_raw(9081),
        );

    let execution =
        execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            second,
            10,
            RootSchedulerCallbackHandle::NONE,
            second_handoff,
            Some(&first_queue_handoff),
        )
        .unwrap();

    assert_eq!(
            execution.status(),
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert_eq!(
        execution.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueRootMismatch {
                expected: second,
                actual: first
            }
        )
    );
    assert!(execution.commit().is_none());
    assert_eq!(store.root(second).unwrap().current(), second_current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_default_sync_queue_lane_continuation_rejects_caller_built_rows() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let (default_update, sync_update, handoff, queue_handoff) =
        expired_default_sync_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            RootElementHandle::from_raw(9082),
            RootElementHandle::from_raw(9083),
        );
    let mut forged = queue_handoff.clone();
    forged.update_records.swap(0, 1);

    let execution =
        execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
            handoff,
            Some(&forged),
        )
        .unwrap();

    assert_eq!(
            execution.status(),
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert_eq!(
            execution.queue_handoff_error(),
            Some(
                &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueHandoffNotSourceOwned {
                    root: root_id,
                    queue: queue_handoff.current_update_queue(),
                    expected_updates: vec![default_update.update(), sync_update.update()],
                    actual_updates: vec![sync_update.update(), default_update.update()],
                    records_in_sequence_order: false
                }
            )
        );
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_default_sync_queue_lane_continuation_rejects_skipped_lane_as_committed() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    let default_update =
        update_container(&mut store, root_id, RootElementHandle::from_raw(9082), None).unwrap();
    ensure_root_is_scheduled(&mut store, default_update.schedule()).unwrap();
    assert!(
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .set_expiration_time(Lane::DEFAULT, 10)
    );
    store
        .root_mut(root_id)
        .unwrap()
        .lanes_mut()
        .mark_starved_lanes_as_expired(10);
    let skipped_transition = update_container_transition_for_canary(
        &mut store,
        root_id,
        Lane::TRANSITION_1,
        RootElementHandle::from_raw(9083),
        None,
    )
    .unwrap();
    let sync_update =
        update_container_sync(&mut store, root_id, RootElementHandle::from_raw(9084), None)
            .unwrap();
    ensure_root_is_scheduled(&mut store, sync_update.schedule()).unwrap();

    let lane_selection = select_lanes_for_scheduled_task(&store, root_id).unwrap();
    assert_eq!(
        lane_selection.render_lanes(),
        Lanes::SYNC.merge(Lanes::DEFAULT)
    );
    let render =
        render_host_root_for_lanes(&mut store, root_id, lane_selection.render_lanes()).unwrap();
    assert_eq!(render.render_lanes(), Lanes::SYNC.merge(Lanes::DEFAULT));
    assert_eq!(render.remaining_lanes(), Lanes::from(Lane::TRANSITION_1));
    let current_queue_base_updates = store
        .update_queues()
        .base_updates(render.current_update_queue())
        .unwrap();
    assert_eq!(
        current_queue_base_updates,
        vec![
            default_update.update(),
            skipped_transition.update(),
            sync_update.update()
        ]
    );
    let handoff = RootSyncFlushRecord {
        order: 0,
        root: root_id,
        lanes: render.render_lanes(),
        status: RootSyncFlushRecordStatus::RenderedAwaitingCommit,
        render_phase: render,
    };
    let forged = HostRootUpdateQueueLaneHandoffRecordForCanary {
        root: root_id,
        current: render.current(),
        finished_work: render.finished_work(),
        current_update_queue: render.current_update_queue(),
        work_in_progress_update_queue: render.work_in_progress_update_queue(),
        pending_lanes_before_render: render.render_lanes().merge(render.remaining_lanes()),
        selected_next_lanes_before_render: render.render_lanes(),
        finished_lanes: render.render_lanes(),
        remaining_lanes: render.remaining_lanes(),
        pending_lanes_after_render: store.root(root_id).unwrap().lanes().pending_lanes(),
        update_records: vec![
            HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
                sequence: 0,
                update: default_update.update(),
                lane: Lane::DEFAULT,
                source_lanes: Lanes::DEFAULT,
                pending_lanes_after_enqueue: default_update.pending_lanes_after_enqueue(),
                selected_next_lanes_after_enqueue: default_update.selected_next_lanes(),
            },
            HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
                sequence: 1,
                update: skipped_transition.update(),
                lane: Lane::TRANSITION_1,
                source_lanes: Lanes::from(Lane::TRANSITION_1),
                pending_lanes_after_enqueue: skipped_transition.pending_lanes_after_enqueue(),
                selected_next_lanes_after_enqueue: skipped_transition.selected_next_lanes(),
            },
            HostRootUpdateQueueLaneHandoffUpdateRecordForCanary {
                sequence: 2,
                update: sync_update.update(),
                lane: Lane::SYNC,
                source_lanes: Lanes::SYNC,
                pending_lanes_after_enqueue: sync_update.pending_lanes_after_enqueue(),
                selected_next_lanes_after_enqueue: sync_update.selected_next_lanes(),
            },
        ],
        current_queue_base_updates,
        applied_update_count: render.applied_update_count(),
        skipped_update_count: render.skipped_update_count(),
        resulting_element: render.resulting_element(),
    };
    record_root_finished_work_for_scheduler_handoff_for_canary(&mut store, render).unwrap();

    let execution =
        execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
            handoff,
            Some(&forged),
        )
        .unwrap();

    assert_eq!(
            execution.status(),
            RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::BlockedByQueueLaneHandoffMismatch
        );
    assert_eq!(
        execution.queue_handoff_error(),
        Some(
            &HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary::QueueLane(
                HostRootUpdateQueueLaneHandoffErrorForCanary::SkippedLaneCommitted {
                    root: root_id,
                    update: skipped_transition.update(),
                    skipped_lanes: Lanes::from(Lane::TRANSITION_1),
                    finished_lanes: Lanes::SYNC.merge(Lanes::DEFAULT),
                    remaining_lanes: Lanes::from(Lane::TRANSITION_1)
                }
            )
        )
    );
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_default_sync_queue_lane_continuation_rejects_replay_after_commit() {
    let (mut store, root_id, host) = root_store();
    let (_default_update, _sync_update, handoff, queue_handoff) =
        expired_default_sync_queue_lane_scheduler_handoff(
            &mut store,
            root_id,
            RootElementHandle::from_raw(9085),
            RootElementHandle::from_raw(9086),
        );
    let first = execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
        &mut store,
        root_id,
        10,
        RootSchedulerCallbackHandle::NONE,
        handoff,
        Some(&queue_handoff),
    )
    .unwrap();
    let committed_current = first.commit().unwrap().current();

    let replay =
        execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary(
            &mut store,
            root_id,
            10,
            RootSchedulerCallbackHandle::NONE,
            handoff,
            Some(&queue_handoff),
        )
        .unwrap();

    assert!(first.did_execute_expired_queue_lane_scheduler_continuation());
    assert_eq!(
        replay.status(),
        RootExpiredLaneSyncSchedulerQueueLaneContinuationStatusForCanary::NoExpiredLanes
    );
    assert!(replay.skipped_without_expired_lanes());
    assert!(replay.handoff().is_none());
    assert!(replay.continuation().is_none());
    assert!(replay.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), committed_current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_lane_continuation_rejects_stale_callback_before_expiration() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    schedule_default_update(&mut store, root_id);
    process_root_schedule_in_microtask(&mut store).unwrap();
    let current_callback = store.root(root_id).unwrap().scheduling().callback_node();
    assert!(current_callback.is_some());
    assert!(
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .set_expiration_time(Lane::DEFAULT, 10)
    );

    let execution = execute_expired_lane_sync_scheduler_continuation_for_root_for_canary(
        &mut store,
        root_id,
        10,
        RootSchedulerCallbackHandle::NONE,
    )
    .unwrap();

    assert_eq!(
        execution.status(),
        RootExpiredLaneSyncSchedulerContinuationStatus::StaleCallbackNode
    );
    assert!(execution.rejected_stale_callback_node());
    assert_eq!(
        execution.requested_callback_node(),
        RootSchedulerCallbackHandle::NONE
    );
    assert_eq!(execution.current_callback_node(), current_callback);
    assert_eq!(execution.expired_lanes_before(), Lanes::NO);
    assert_eq!(execution.expired_lanes_after(), Lanes::NO);
    assert_eq!(execution.selected_priority_lanes(), Lanes::NO);
    assert_eq!(execution.selected_render_lanes(), Lanes::NO);
    assert!(execution.handoff().is_none());
    assert!(execution.continuation().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(
        store.root(root_id).unwrap().lanes().expired_lanes(),
        Lanes::NO
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_lane_continuation_rejects_foreign_callback_node() {
    let host = RecordingHost::default();
    let mut store = FiberRootStore::<RecordingHost>::new();
    let first = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let second = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    schedule_default_update(&mut store, first);
    process_root_schedule_in_microtask(&mut store).unwrap();
    let first_callback = *store.scheduler_bridge().callback_requests().last().unwrap();
    schedule_default_update(&mut store, second);
    process_root_schedule_in_microtask(&mut store).unwrap();
    let second_callback = *store.scheduler_bridge().callback_requests().last().unwrap();
    assert_eq!(first_callback.root(), first);
    assert_eq!(second_callback.root(), second);
    assert_ne!(first_callback.node(), second_callback.node());
    assert_eq!(
        store.root(second).unwrap().scheduling().callback_node(),
        second_callback.node()
    );
    let second_current = store.root(second).unwrap().current();
    assert!(
        store
            .root_mut(second)
            .unwrap()
            .lanes_mut()
            .set_expiration_time(Lane::DEFAULT, 625)
    );

    let execution = execute_expired_lane_sync_scheduler_continuation_for_root_for_canary(
        &mut store,
        second,
        625,
        first_callback.node(),
    )
    .unwrap();

    assert_eq!(
        execution.status(),
        RootExpiredLaneSyncSchedulerContinuationStatus::StaleCallbackNode
    );
    assert!(execution.rejected_stale_callback_node());
    assert_eq!(execution.root(), second);
    assert_eq!(execution.requested_callback_node(), first_callback.node());
    assert_eq!(execution.current_callback_node(), second_callback.node());
    assert!(execution.handoff().is_none());
    assert!(execution.continuation().is_none());
    assert!(!execution.did_execute_expired_lane_sync_continuation());
    assert!(execution.async_callback_execution_blocked());
    assert!(execution.public_update_scheduling_blocked());
    assert_eq!(store.root(second).unwrap().current(), second_current);
    assert_eq!(
        store.root(second).unwrap().lanes().pending_lanes(),
        Lanes::DEFAULT
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_expired_lane_continuation_uses_pending_passive_blocker_from_sync_record() {
    let (mut store, root_id, host) = root_store();
    schedule_default_update(&mut store, root_id);
    let passive_render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    let passive_finished_work = passive_render.finished_work();
    {
        let scheduling = store.root_mut(root_id).unwrap().scheduling_mut();
        scheduling.prepare_pending_passive(root_id, Lanes::NO);
        scheduling
            .pending_passive_mut()
            .queue_mount(passive_finished_work, Lanes::DEFAULT)
            .unwrap();
    }
    let passive_commit = commit_finished_host_root(&mut store, passive_render).unwrap();
    assert!(passive_commit.pending_passive_handoff().is_some());
    let current = store.root(root_id).unwrap().current();

    schedule_default_update(&mut store, root_id);
    assert!(
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .set_expiration_time(Lane::DEFAULT, 20)
    );

    let execution = execute_expired_lane_sync_scheduler_continuation_for_root_for_canary(
        &mut store,
        root_id,
        20,
        RootSchedulerCallbackHandle::NONE,
    )
    .unwrap();

    assert_eq!(
        execution.status(),
        RootExpiredLaneSyncSchedulerContinuationStatus::BlockedByPendingPassive
    );
    assert!(execution.blocked_by_pending_passive());
    assert_eq!(execution.selected_render_lanes(), Lanes::DEFAULT);
    let handoff = execution.handoff().unwrap();
    assert_eq!(handoff.lanes(), Lanes::DEFAULT);
    let continuation = execution.continuation().unwrap();
    assert_eq!(
        continuation.status(),
        RootSyncSchedulerContinuationExecutionStatus::BlockedByPendingPassive
    );
    let blocker = continuation.pending_passive_blocker().unwrap();
    assert_eq!(blocker.root(), root_id);
    assert_eq!(blocker.finished_work(), Some(passive_finished_work));
    assert_eq!(blocker.lanes(), Lanes::DEFAULT);
    assert_eq!(blocker.pending_unmount_count(), 0);
    assert_eq!(blocker.pending_mount_count(), 1);
    assert_eq!(blocker.pending_record_count(), 1);
    assert!(execution.commit().is_none());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .pending_passive()
            .has_commit_handoff()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_sync_flush_post_passive_gate_records_reentry_roots_data_only() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let host = RecordingHost::default();
    let passive_root = store
        .create_client_root(
            FakeContainer::new(1),
            RootOptions::new()
                .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(951))
                .with_on_caught_error(RootErrorCallbackHandle::from_raw(952))
                .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(953)),
        )
        .unwrap();
    let continuation_root = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let continuation_current = store.root(continuation_root).unwrap().current();

    schedule_sync_update(&mut store, passive_root, RootElementHandle::from_raw(93));
    let render = render_host_root_for_lanes(&mut store, passive_root, Lanes::SYNC).unwrap();
    let finished_work = render.finished_work();
    store
        .root_mut(passive_root)
        .unwrap()
        .scheduling_mut()
        .prepare_pending_passive(passive_root, Lanes::NO);
    store
        .root_mut(passive_root)
        .unwrap()
        .scheduling_mut()
        .pending_passive_mut()
        .queue_mount(finished_work, Lanes::SYNC)
        .unwrap();
    let commit = commit_finished_host_root(&mut store, render).unwrap();

    schedule_default_update(&mut store, continuation_root);
    schedule_sync_update(
        &mut store,
        continuation_root,
        RootElementHandle::from_raw(94),
    );
    let callback_request_count = store.scheduler_bridge().callback_requests().len();
    let act_queue_request_count = store.scheduler_bridge().act_queue_requests().len();

    let gate = sync_flush_post_passive_continuation_execution_gate(
        &mut store,
        &ExecutionContextState::new(),
        commit.pending_passive_handoff(),
    )
    .unwrap()
    .unwrap();

    assert_eq!(gate.exit_status(), RootSyncFlushExitStatus::Completed);
    assert!(gate.execution_context().can_enter_sync_flush());
    assert_eq!(gate.pending_passive_root(), passive_root);
    assert_eq!(gate.pending_passive_finished_work(), finished_work);
    assert_eq!(gate.pending_passive_lanes(), Lanes::SYNC);
    assert_eq!(gate.pending_passive_unmount_count(), 0);
    assert_eq!(gate.pending_passive_mount_count(), 1);
    assert_eq!(gate.pending_passive_record_count(), 1);
    let root_error = gate.root_error_propagation();
    assert_eq!(root_error.root(), passive_root);
    assert_eq!(
        root_error.on_uncaught_error(),
        RootErrorCallbackHandle::from_raw(951)
    );
    assert_eq!(
        root_error.on_caught_error(),
        RootErrorCallbackHandle::from_raw(952)
    );
    assert_eq!(
        root_error.on_recoverable_error(),
        RootRecoverableErrorCallbackHandle::from_raw(953)
    );
    assert_eq!(
        root_error.status(),
        SyncFlushPostPassiveRootErrorPropagationStatus::Blocked
    );
    assert_eq!(
        root_error.blockers(),
        &SYNC_FLUSH_POST_PASSIVE_ROOT_ERROR_PROPAGATION_BLOCKERS
    );
    assert!(root_error.has_configured_error_callback());
    assert!(!root_error.root_error_update_scheduled());
    assert!(!root_error.root_error_callbacks_invoked());
    assert!(!root_error.public_act_error_aggregation_enabled());
    assert!(gate.should_execute_follow_up_sync_flush());
    assert!(gate.did_find_continuation_roots());
    assert_eq!(gate.continuation_roots().len(), 1);
    let continuation = gate.continuation_roots()[0];
    assert_eq!(continuation.order(), 0);
    assert_eq!(continuation.root(), continuation_root);
    assert_eq!(continuation.lanes(), Lanes::SYNC);
    assert!(
        !continuation.lanes().contains_lane(Lane::DEFAULT),
        "default work must not enter the post-passive sync-flush continuation gate"
    );
    assert_eq!(
        store.root(continuation_root).unwrap().current(),
        continuation_current
    );
    assert_eq!(store.root(continuation_root).unwrap().finished_work(), None);
    assert!(
        store
            .root(passive_root)
            .unwrap()
            .scheduling()
            .pending_passive()
            .has_commit_handoff()
    );
    assert_eq!(
        store.scheduler_bridge().callback_requests().len(),
        callback_request_count
    );
    assert_eq!(
        store.scheduler_bridge().act_queue_requests().len(),
        act_queue_request_count
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert!(!store.root_scheduler().is_flushing_work());
}

#[test]
fn root_scheduler_sync_flush_post_passive_gate_preserves_guards() {
    let (mut store, root_id, host) = root_store();
    schedule_sync_update(&mut store, root_id, RootElementHandle::from_raw(95));
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
    store
        .root_mut(root_id)
        .unwrap()
        .scheduling_mut()
        .prepare_pending_passive(root_id, Lanes::NO);
    let commit = commit_finished_host_root(&mut store, render).unwrap();
    let handoff = commit.pending_passive_handoff();
    let mut execution_context = ExecutionContextState::new();

    let blocked = execution_context
        .with_render_context(|execution_context| {
            sync_flush_post_passive_continuation_execution_gate(
                &mut store,
                execution_context,
                handoff,
            )
        })
        .unwrap()
        .unwrap();

    assert_eq!(
        blocked.exit_status(),
        RootSyncFlushExitStatus::BlockedByExecutionContext
    );
    assert!(!blocked.should_execute_follow_up_sync_flush());
    assert!(blocked.execution_context().blocked_by_render_or_commit());
    assert!(blocked.continuation_roots().is_empty());
    assert!(!store.root_scheduler().is_flushing_work());

    store.root_scheduler_mut().set_is_flushing_work(true);
    let reentrant = sync_flush_post_passive_continuation_execution_gate(
        &mut store,
        &ExecutionContextState::new(),
        handoff,
    )
    .unwrap()
    .unwrap();
    assert_eq!(
        reentrant.exit_status(),
        RootSyncFlushExitStatus::SkippedReentrantFlush
    );
    assert!(!reentrant.should_execute_follow_up_sync_flush());
    assert!(reentrant.continuation_roots().is_empty());
    assert!(store.root_scheduler().is_flushing_work());
    store.root_scheduler_mut().set_is_flushing_work(false);

    recompute_might_have_pending_sync_work(&mut store).unwrap();
    let no_work = sync_flush_post_passive_continuation_execution_gate(
        &mut store,
        &ExecutionContextState::new(),
        handoff,
    )
    .unwrap()
    .unwrap();
    assert_eq!(
        no_work.exit_status(),
        RootSyncFlushExitStatus::SkippedNoPendingSyncWork
    );
    assert!(!no_work.should_execute_follow_up_sync_flush());
    assert!(no_work.continuation_roots().is_empty());
    assert!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .pending_passive()
            .has_commit_handoff()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}

#[test]
fn root_scheduler_sync_flush_records_fast_path_when_no_pending_sync_work() {
    let (mut store, _root_id, _host) = root_store();
    let execution_context = ExecutionContextState::new();

    let result = flush_sync_work_on_all_roots(&mut store, &execution_context).unwrap();

    assert_eq!(
        result.exit_status(),
        RootSyncFlushExitStatus::SkippedNoPendingSyncWork
    );
    assert!(result.execution_context().can_enter_sync_flush());
    assert!(result.records().is_empty());
    assert!(!store.root_scheduler().is_flushing_work());
}

#[test]
fn root_scheduler_sync_flush_records_reject_render_or_commit_context() {
    let (mut store, root_id, _host) = root_store();
    schedule_sync_update(&mut store, root_id, RootElementHandle::NONE);
    let mut execution_context = ExecutionContextState::new();

    let render_result = execution_context
        .with_render_context(|execution_context| {
            flush_sync_work_on_all_roots(&mut store, execution_context)
        })
        .unwrap();

    assert_eq!(
        render_result.exit_status(),
        RootSyncFlushExitStatus::BlockedByExecutionContext
    );
    assert!(
        render_result
            .execution_context()
            .blocked_by_render_or_commit()
    );
    assert!(render_result.records().is_empty());
    assert!(!store.root_scheduler().is_flushing_work());
    assert!(store.root_scheduler().might_have_pending_sync_work());

    let commit_result = execution_context
        .with_commit_context(|execution_context| {
            flush_sync_work_on_all_roots(&mut store, execution_context)
        })
        .unwrap();

    assert_eq!(
        commit_result.exit_status(),
        RootSyncFlushExitStatus::BlockedByExecutionContext
    );
    assert!(
        commit_result
            .execution_context()
            .blocked_by_render_or_commit()
    );
    assert!(commit_result.records().is_empty());
    assert!(!store.root_scheduler().is_flushing_work());
}

#[test]
fn root_scheduler_sync_flush_records_reentrant_guard_without_clearing_state() {
    let (mut store, root_id, _host) = root_store();
    schedule_sync_update(&mut store, root_id, RootElementHandle::NONE);
    store.root_scheduler_mut().set_is_flushing_work(true);

    let result = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

    assert_eq!(
        result.exit_status(),
        RootSyncFlushExitStatus::SkippedReentrantFlush
    );
    assert!(result.records().is_empty());
    assert!(store.root_scheduler().is_flushing_work());
    assert!(store.root_scheduler().might_have_pending_sync_work());

    store.root_scheduler_mut().set_is_flushing_work(false);
}

#[test]
fn root_scheduler_sync_flush_records_roots_in_scheduled_order_and_renders_for_commit_handoff() {
    let mut store = FiberRootStore::<RecordingHost>::new();
    let second_scheduled = store
        .create_client_root(FakeContainer::new(2), RootOptions::new())
        .unwrap();
    let first_scheduled = store
        .create_client_root(FakeContainer::new(1), RootOptions::new())
        .unwrap();
    let second_current = store.root(second_scheduled).unwrap().current();
    let first_current = store.root(first_scheduled).unwrap().current();

    schedule_sync_update(
        &mut store,
        second_scheduled,
        RootElementHandle::from_raw(20),
    );
    schedule_sync_update(&mut store, first_scheduled, RootElementHandle::from_raw(10));

    let result = flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();

    assert_eq!(result.exit_status(), RootSyncFlushExitStatus::Completed);
    assert_eq!(result.records().len(), 2);
    assert_eq!(result.records()[0].order(), 0);
    assert_eq!(result.records()[0].root(), second_scheduled);
    assert_eq!(result.records()[0].lanes(), Lanes::SYNC);
    assert_eq!(
        result.records()[0].status(),
        RootSyncFlushRecordStatus::RenderedAwaitingCommit
    );
    assert_eq!(
        result.records()[0].render_phase().resulting_element(),
        RootElementHandle::from_raw(20)
    );
    assert_eq!(result.records()[1].order(), 1);
    assert_eq!(result.records()[1].root(), first_scheduled);
    assert_eq!(result.records()[1].lanes(), Lanes::SYNC);
    assert_eq!(
        result.records()[1].render_phase().resulting_element(),
        RootElementHandle::from_raw(10)
    );
    assert_eq!(
        store.root(second_scheduled).unwrap().current(),
        second_current
    );
    assert_eq!(
        store.root(first_scheduled).unwrap().current(),
        first_current
    );
    assert_eq!(
        store.root(second_scheduled).unwrap().finished_work(),
        Some(result.records()[0].render_phase().finished_work())
    );
    assert_eq!(
        store.root(second_scheduled).unwrap().finished_lanes(),
        Lanes::SYNC
    );
    assert_eq!(
        store.root(first_scheduled).unwrap().finished_work(),
        Some(result.records()[1].render_phase().finished_work())
    );
    assert_eq!(
        store.root(first_scheduled).unwrap().finished_lanes(),
        Lanes::SYNC
    );
    assert!(!store.root_scheduler().is_flushing_work());
}
