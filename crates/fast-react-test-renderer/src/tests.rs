use super::*;
use fast_react_host_config::{HostOperationErrorKind, MutationRenderer};
use fast_react_reconciler::{RootUpdateCallbackRecord, RootUpdateCallbackVisibility};

mod create_route;
mod host_config;
mod host_output;
mod json_serialization;
mod root_facade_scheduler;
mod root_lifecycle;
mod serialization_identity;
mod test_instance;
mod tree_serialization;
mod unmount;
mod update_route;

static TEST_HOST_FIBER_TOKEN: TestHostFiberToken = 1;

fn element_type(name: &str) -> TestElementType {
    TestElementType::new(name)
}

fn props() -> TestProps {
    TestProps::new()
}

fn host_fiber_token(
    phase: HostFiberTokenPhase,
    target: HostFiberTokenTarget,
) -> HostFiberTokenRef<'static, TestRenderer> {
    HostFiberTokenRef::new(&TEST_HOST_FIBER_TOKEN, phase, target)
}

fn creation_instance_token() -> HostFiberTokenRef<'static, TestRenderer> {
    host_fiber_token(
        HostFiberTokenPhase::Creation,
        HostFiberTokenTarget::Instance,
    )
}

fn creation_text_token() -> HostFiberTokenRef<'static, TestRenderer> {
    host_fiber_token(
        HostFiberTokenPhase::Creation,
        HostFiberTokenTarget::TextInstance,
    )
}

fn commit_instance_token() -> HostFiberTokenRef<'static, TestRenderer> {
    host_fiber_token(HostFiberTokenPhase::Commit, HostFiberTokenTarget::Instance)
}

fn deletion_instance_token() -> HostFiberTokenRef<'static, TestRenderer> {
    host_fiber_token(
        HostFiberTokenPhase::Deletion,
        HostFiberTokenTarget::Instance,
    )
}

fn create_instance(
    renderer: &mut TestRenderer,
    container: &TestContainer,
    name: &str,
) -> TestInstance {
    let context = renderer.root_host_context(container).unwrap();
    renderer
        .create_instance(
            creation_instance_token(),
            &element_type(name),
            &props(),
            container,
            &context,
        )
        .unwrap()
}

fn create_text(
    renderer: &mut TestRenderer,
    container: &TestContainer,
    text: &str,
) -> TestTextInstance {
    let context = renderer.root_host_context(container).unwrap();
    renderer
        .create_text_instance(creation_text_token(), text, container, &context)
        .unwrap()
}

fn child_texts(snapshot: &TestElementSnapshot) -> Vec<&str> {
    snapshot
        .children()
        .iter()
        .map(|child| match child {
            TestNodeSnapshot::Text(text) => text.text(),
            TestNodeSnapshot::Element(_) => panic!("expected text child"),
        })
        .collect()
}

fn container_element_names(snapshot: &TestContainerSnapshot) -> Vec<&str> {
    snapshot
        .children()
        .iter()
        .map(|child| match child {
            TestNodeSnapshot::Element(element) => element.element_type().as_str(),
            TestNodeSnapshot::Text(_) => panic!("expected element child"),
        })
        .collect()
}

fn container_element_texts(snapshot: &TestContainerSnapshot) -> Vec<&str> {
    snapshot
        .children()
        .iter()
        .map(|child| match child {
            TestNodeSnapshot::Element(element) => match &element.children()[0] {
                TestNodeSnapshot::Text(text) => text.text(),
                TestNodeSnapshot::Element(_) => panic!("expected text child"),
            },
            TestNodeSnapshot::Text(_) => panic!("expected element child"),
        })
        .collect()
}

fn nested_container_inner_names(snapshot: &TestContainerSnapshot) -> Vec<&str> {
    snapshot
        .children()
        .iter()
        .map(|child| match child {
            TestNodeSnapshot::Element(outer) => match &outer.children()[0] {
                TestNodeSnapshot::Element(inner) => inner.element_type().as_str(),
                TestNodeSnapshot::Text(_) => panic!("expected nested element child"),
            },
            TestNodeSnapshot::Text(_) => panic!("expected outer element child"),
        })
        .collect()
}

fn nested_container_inner_texts(snapshot: &TestContainerSnapshot) -> Vec<&str> {
    let TestNodeSnapshot::Element(outer) = &snapshot.children()[0] else {
        panic!("expected outer element child");
    };
    let TestNodeSnapshot::Element(inner) = &outer.children()[0] else {
        panic!("expected inner element child");
    };
    child_texts(inner)
}

fn assert_mutation_renderer<T: MutationRenderer>(_renderer: &T) {}

fn assert_operation_error(error: HostError, expected: HostOperationErrorKind) {
    let operation = error.as_operation_error().unwrap();

    assert!(error.as_unsupported_capability().is_none());
    assert_eq!(operation.renderer_name(), TEST_RENDERER_NAME);
    assert_eq!(operation.kind(), &expected);
}

fn root_element(raw: u64) -> RootElementHandle {
    RootElementHandle::from_raw(raw)
}

fn create_lifecycle_handoff_for_root() -> (
    TestRendererRoot,
    TestRendererCommittedHostOutput,
    TestRendererPrivateCreateNativeBridgeHostOutputHandoff,
) {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    let output = root
        .render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let input = TestRendererRootCreatePreflightInputShape::host_component_with_text_child(
        output.render().resulting_element(),
        "span",
    );
    let preflight = root
        .describe_private_root_create_preflight_from_render_for_canary(
            input,
            TestRendererRootCreatePreflightCanaryApiIdentity::current(),
            Some(TestRendererRootWorkLoopFinishedWorkPreflightMetadata::current()),
            output.render(),
        )
        .unwrap();
    let admission = TestRendererRoot::describe_private_create_route_admission_for_canary(
        Some(preflight),
        Some(TestRendererPrivateCreateRouteAdmissionMetadata::current()),
    )
    .unwrap();
    let handoff = root
        .describe_private_create_native_bridge_host_output_handoff_for_canary(&admission, &output)
        .unwrap();

    (root, output, handoff)
}

fn assert_root_lifecycle_execution_error_reason(
    error: TestRendererRootError,
    operation: &'static str,
    reason: &'static str,
) {
    let TestRendererRootError::PrivateRootLifecycleExecution(error) = error else {
        panic!("expected private root lifecycle execution error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateRootLifecycleExecutionError::LifecycleExecutionRecordMismatch {
            operation: actual_operation,
            reason: actual_reason,
        } if *actual_operation == operation && *actual_reason == reason
    ));
}

fn assert_private_root_lifecycle_execution_blocks_public_surfaces(
    evidence: &TestRendererPrivateRootLifecycleExecutionEvidence,
) {
    assert!(evidence.source_renderer_owner_accepted());
    assert!(evidence.source_lifecycle_row_accepted());
    assert!(evidence.source_reconciler_host_execution_consumed());
    assert!(evidence.snapshot_produced_from_executed_state());
    assert!(evidence.host_output_snapshot_current());
    assert!(evidence.source_owned_execution_accepted());
    assert!(!evidence.public_root_available());
    assert!(!evidence.public_serialization_available());
    assert!(!evidence.public_test_instance_available());
    assert!(!evidence.public_act_available());
    assert!(!evidence.public_scheduler_available());
    assert!(!evidence.native_bridge_available());
    assert!(!evidence.native_execution_available());
    assert!(!evidence.js_package_available());
    assert!(!evidence.compatibility_claimed());
    assert!(evidence.public_blockers().all_blocked());
    assert!(evidence.public_surfaces_blocked());
}

fn sibling_text_snapshots_for_diagnostics() -> (TestContainerSnapshot, TestContainerSnapshot) {
    let previous_snapshot = TestContainerSnapshot {
        children: vec![TestNodeSnapshot::Element(TestElementSnapshot {
            element_type: element_type("span"),
            props: TestProps::new(),
            hidden: false,
            detached: false,
            children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                text: "second sibling".to_owned(),
                hidden: false,
            })],
        })],
    };
    let current_snapshot = TestContainerSnapshot {
        children: vec![
            TestNodeSnapshot::Text(TestTextSnapshot {
                text: "first sibling".to_owned(),
                hidden: false,
            }),
            TestNodeSnapshot::Element(TestElementSnapshot {
                element_type: element_type("span"),
                props: TestProps::new(),
                hidden: false,
                detached: false,
                children: vec![TestNodeSnapshot::Text(TestTextSnapshot {
                    text: "second sibling".to_owned(),
                    hidden: false,
                })],
            }),
        ],
    };

    (previous_snapshot, current_snapshot)
}

fn sibling_text_identity_inputs_for_canary() -> (
    TestRendererRoot,
    TestRendererSiblingTextHostOutput,
    TestRendererPrivateUpdateRouteAdmissionRecord,
    TestRendererPrivateJsonSerializationReport,
) {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "second sibling",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let output = root
        .render_and_commit_sibling_text_host_output_update_for_canary("first sibling")
        .unwrap()
        .unwrap();
    let route = root
        .describe_private_sibling_text_update_route_admission_for_canary(&output)
        .unwrap();
    let report = root
        .describe_private_json_serialization_after_sibling_text_update_for_canary(&output)
        .unwrap();

    (root, output, route, report)
}

fn nested_source_report_identity_inputs_for_canary() -> (
    TestRendererRoot,
    TestRendererNestedHostParentPlacedHostOutput,
    TestRendererPrivateUpdateRouteAdmissionRecord,
    TestRendererPrivateJsonSerializationReport,
    TestRendererPrivateSerializationFinishedWorkIdentityGate,
) {
    let mut root = TestRendererRoot::create_nested_host_components_with_text_for_canary(
        "section",
        "span",
        "stable",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_nested_host_output_for_canary()
        .unwrap()
        .unwrap();
    let output = root
        .render_and_commit_nested_host_parent_text_placement_for_canary("inserted")
        .unwrap();
    let route = accepted_nested_update_route_admission_for_root(&root, &output);
    let report = root
        .describe_private_json_serialization_after_nested_update_for_canary(&output)
        .unwrap();
    let identity = root
        .describe_private_to_json_nested_finished_work_identity_gate_for_canary(
            &output,
            Some(&report),
        )
        .unwrap();

    (root, output, route, report, identity)
}

fn multi_child_host_text_identity_inputs_for_canary() -> (
    TestRendererRoot,
    TestRendererHostParentPlacedHostOutput,
    TestRendererPrivateUpdateRouteAdmissionRecord,
    TestRendererPrivateRootLifecycleExecutionEvidence,
    TestRendererPrivateMultiChildHostTextFinishedWorkIdentityGate,
) {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let output = root
        .render_and_commit_host_parent_text_placement_for_canary("inserted")
        .unwrap();
    let route = root
        .describe_private_multi_child_host_text_update_route_admission_for_canary(&output)
        .unwrap();
    let lifecycle = root
        .describe_private_root_multi_child_host_text_update_lifecycle_execution_for_canary(
            &output, route,
        )
        .unwrap();
    let identity = root
        .describe_private_to_json_multi_child_host_text_finished_work_identity_gate_for_canary(
            &output, route, &lifecycle,
        )
        .unwrap();

    (root, output, route, lifecycle, identity)
}

fn direct_multi_child_host_text_fiber_inspection_inputs_for_canary() -> (
    TestRendererRoot,
    TestRendererHostParentPlacedHostOutput,
    TestRendererPrivateUpdateRouteAdmissionRecord,
    TestRendererPrivateRootLifecycleExecutionEvidence,
    TestRendererPrivateMultiChildHostTextFinishedWorkIdentityGate,
    TestRendererPrivateToJsonHostOutputRow,
    TestRendererPrivateDirectMultiChildHostTextRowIdentity,
    TestRendererPrivateDirectMultiChildHostTextReconcilerInspectionEvidence,
    TestRendererPrivateDirectMultiChildHostTextCommittedFiberInspection,
) {
    let (root, output, route, lifecycle, identity) =
        multi_child_host_text_identity_inputs_for_canary();
    let row = root
        .describe_private_to_json_multi_child_host_text_output_row_for_canary(&output)
        .unwrap();
    let row_identity = root
        .describe_private_direct_multi_child_host_text_row_identity_for_canary(&output)
        .unwrap();
    let reconciler_inspection = root
        .describe_private_direct_multi_child_host_text_reconciler_inspection_for_canary(&output)
        .unwrap();
    let inspection = root
        .describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary(
            &output,
            Some(route),
            Some(&lifecycle),
            Some(identity),
            Some(row_identity),
            Some(reconciler_inspection),
        )
        .unwrap();

    (
        root,
        output,
        route,
        lifecycle,
        identity,
        row,
        row_identity,
        reconciler_inspection,
        inspection,
    )
}

fn assert_sibling_text_identity_error_reason(
    error: TestRendererRootError,
    expected_reason: &'static str,
) {
    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected sibling-text private finished-work identity error");
    };
    match error.as_ref() {
        TestRendererPrivateSerializationFinishedWorkIdentityError::ForeignFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::NonCommittedFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::PublicCompatibilityOpened {
            reason,
        } => assert_eq!(*reason, expected_reason),
        other => panic!("unexpected sibling-text identity error: {other:?}"),
    }
}

fn assert_multi_child_host_text_identity_error_reason(
    error: TestRendererRootError,
    expected_reason: &'static str,
) {
    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected multi-child HostText private finished-work identity error");
    };
    match error.as_ref() {
        TestRendererPrivateSerializationFinishedWorkIdentityError::ForeignFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::NonCommittedFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::PublicCompatibilityOpened {
            reason,
        } => assert_eq!(*reason, expected_reason),
        other => panic!("unexpected multi-child HostText identity error: {other:?}"),
    }
}

fn assert_direct_multi_child_host_text_inspection_error_reason(
    error: TestRendererRootError,
    expected_reason: &'static str,
) {
    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected direct multi-child HostText private fiber inspection error");
    };
    match error.as_ref() {
        TestRendererPrivateSerializationFinishedWorkIdentityError::ForeignFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::NonCommittedFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::PublicCompatibilityOpened {
            reason,
        } => assert_eq!(*reason, expected_reason),
        TestRendererPrivateSerializationFinishedWorkIdentityError::LaneMismatch {
            ..
        } => assert_eq!(expected_reason, "lane-mismatch"),
        other => {
            panic!("unexpected direct multi-child HostText fiber inspection error: {other:?}")
        }
    }
}

fn assert_unmount_nested_source_report_gate_error_reason(
    error: TestRendererRootError,
    expected_reason: &'static str,
) {
    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected private unmount/nested source-report gate error");
    };
    match error.as_ref() {
        TestRendererPrivateSerializationFinishedWorkIdentityError::ForeignFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::NonCommittedFinishedWorkIdentity {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch {
            reason,
        }
        | TestRendererPrivateSerializationFinishedWorkIdentityError::PublicCompatibilityOpened {
            reason,
        } => assert_eq!(*reason, expected_reason),
        other => panic!("unexpected private unmount/nested gate error: {other:?}"),
    }
}

fn assert_to_json_native_execution_error_reason(
    error: TestRendererRootError,
    expected_operation: &'static str,
    expected_reason: &'static str,
) {
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private JSON native execution error");
    };
    match error.as_ref() {
        TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch {
            operation,
            reason,
        } => {
            assert_eq!(*operation, expected_operation);
            assert_eq!(*reason, expected_reason);
        }
        other => panic!("unexpected private JSON native execution error: {other:?}"),
    }
}

fn assert_to_tree_native_execution_error_reason(
    error: TestRendererRootError,
    expected_operation: &'static str,
    expected_reason: &'static str,
) {
    let TestRendererRootError::PrivateJsonSerialization(error) = error else {
        panic!("expected private toTree native execution error");
    };
    match error.as_ref() {
        TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch {
            operation,
            reason,
        } => {
            assert_eq!(*operation, expected_operation);
            assert_eq!(*reason, expected_reason);
        }
        other => panic!("unexpected private toTree native execution error: {other:?}"),
    }
}

fn accepted_nested_update_route_admission_for_root(
    root: &TestRendererRoot,
    output: &TestRendererNestedHostParentPlacedHostOutput,
) -> TestRendererPrivateUpdateRouteAdmissionRecord {
    macro_rules! fiber_handle {
        ($fiber:expr) => {{
            let fiber = $fiber;
            TestRendererFiberHandleDiagnostics {
                arena_id: fiber.arena_id().get(),
                slot: fiber.slot().get(),
                generation: fiber.generation().get(),
            }
        }};
    }

    let render = output.render();
    let commit = output.commit();
    TestRendererPrivateUpdateRouteAdmissionRecord {
        record_id: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID,
        status: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS,
        public_surface: "create().update",
        root: root.root_id(),
        renderer_id: root.renderer.renderer_id,
        scheduled_update_sequence: output.scheduled_update_sequence(),
        request_api: "TestRendererRoot::update",
        source_diagnostic_name: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME,
        source_diagnostic_status: TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS,
        lifecycle: TestRendererRootLifecycle::Active,
        scheduled_update_kind: TestRendererRootUpdateKind::Update,
        host_output_update_kind: TestRendererRootUpdateKind::Update,
        render_current: fiber_handle!(render.current()),
        render_finished_work: fiber_handle!(render.finished_work()),
        commit_previous_current: fiber_handle!(commit.previous_current()),
        commit_current: fiber_handle!(commit.current()),
        render_lanes_bits: render.render_lanes().bits(),
        commit_finished_lanes_bits: commit.finished_lanes().bits(),
        consumes_accepted_host_root_update_queue_metadata: true,
        consumes_accepted_root_work_loop_metadata: true,
        consumes_accepted_host_output_metadata: true,
        rejects_stale_root_lifecycle: true,
        rejects_stale_host_output: true,
        rejects_missing_update_queue_evidence: true,
        public_root_update_available: false,
        public_serialization_available: false,
        native_execution_available: false,
        compatibility_claimed: false,
    }
}

fn accepted_unmount_identity_for_root(
    to_tree: bool,
    include_ref_passive_cleanup: bool,
) -> (
    TestRendererRoot,
    TestRendererUnmountedHostOutput,
    TestRendererUnmountDeletionCommitHandoffDiagnostics,
    TestRendererUnmountNativeBridgeAdmission,
    TestRendererPrivateSerializationFinishedWorkIdentityGate,
) {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let unmount_outcome = root.unmount().unwrap();
    let unmounted = if include_ref_passive_cleanup {
        root.render_and_commit_host_output_unmount_with_ref_passive_cleanup_for_canary()
            .unwrap()
            .unwrap()
    } else {
        root.render_and_commit_host_output_unmount_for_canary()
            .unwrap()
            .unwrap()
    };
    let handoff = root
        .describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)
        .unwrap();
    let admission = root
        .describe_private_unmount_native_bridge_admission_for_canary(
            &unmount_outcome,
            Some(&handoff),
        )
        .unwrap();
    let identity = if to_tree {
        root.describe_private_to_tree_unmount_finished_work_identity_gate_for_canary(
            &unmounted,
            Some(&handoff),
        )
        .unwrap()
    } else {
        root.describe_private_to_json_unmount_finished_work_identity_gate_for_canary(
            &unmounted,
            Some(&handoff),
        )
        .unwrap()
    };

    (root, unmounted, handoff, admission, identity)
}

fn accepted_unmount_nested_source_report_gate_for_unmount_root(
    unmount_root: &TestRendererRoot,
    unmounted: &TestRendererUnmountedHostOutput,
    handoff: TestRendererUnmountDeletionCommitHandoffDiagnostics,
    admission: TestRendererUnmountNativeBridgeAdmission,
    unmount_identity: TestRendererPrivateSerializationFinishedWorkIdentityGate,
) -> TestRendererPrivateUnmountNestedSourceReportAdmissionGate {
    let (nested_root, nested_output, nested_route, nested_report, nested_identity) =
        nested_source_report_identity_inputs_for_canary();

    TestRendererRoot::describe_private_unmount_nested_source_report_admission_gate_for_canary(
        &nested_root,
        &nested_output,
        nested_route,
        Some(&nested_report),
        Some(nested_identity),
        unmount_root,
        unmounted,
        Some(handoff),
        admission,
        Some(unmount_identity),
    )
    .unwrap()
}

fn current_host_root_element(root: &TestRendererRoot) -> RootElementHandle {
    let current = root.store().root(root.root_id()).unwrap().current();
    let state = root
        .store()
        .fiber_arena()
        .get(current)
        .unwrap()
        .memoized_state();
    root.store()
        .host_root_states()
        .get(state)
        .unwrap()
        .element()
}

fn host_storage_counts(root: &TestRendererRoot) -> (usize, usize, usize) {
    (
        root.renderer.containers.len(),
        root.renderer.instances.len(),
        root.renderer.texts.len(),
    )
}

fn host_node_activity_counts(root: &TestRendererRoot) -> (usize, usize) {
    (
        root.host_nodes.active_total(),
        root.host_nodes.inactive_total(),
    )
}

fn render_and_commit_latest_host_root(
    root: &mut TestRendererRoot,
) -> (HostRootRenderPhaseRecord, HostRootCommitRecord) {
    let render = root
        .render_latest_scheduled_host_root_for_commit_handoff()
        .unwrap()
        .unwrap();
    let commit = root.commit_host_root_render_for_canary(render).unwrap();
    (render, commit)
}

fn assert_empty_root_update_callback_snapshot(
    commit: &HostRootCommitRecord,
    render: &HostRootRenderPhaseRecord,
) {
    let callbacks = commit.root_update_callbacks();

    assert_eq!(callbacks.queue(), render.work_in_progress_update_queue());
    assert!(callbacks.is_empty());
    assert!(callbacks.visible().is_empty());
    assert!(callbacks.hidden().is_empty());
    assert!(callbacks.deferred_hidden().is_empty());
}

fn assert_visible_root_update_callback_snapshot(
    commit: &HostRootCommitRecord,
    render: &HostRootRenderPhaseRecord,
    scheduled_update: &TestRendererRootScheduledUpdate,
    callback: RootUpdateCallbackHandle,
) {
    let callbacks = commit.root_update_callbacks();

    assert_eq!(callbacks.queue(), render.work_in_progress_update_queue());
    assert_eq!(callback_handles(callbacks.visible()), vec![callback]);
    assert_eq!(
        callbacks.visible()[0].queue(),
        render.work_in_progress_update_queue()
    );
    assert_eq!(
        callbacks.visible()[0].update(),
        scheduled_update.container_update().update()
    );
    assert_eq!(callbacks.visible()[0].sequence(), 0);
    assert_eq!(
        callbacks.visible()[0].visibility(),
        RootUpdateCallbackVisibility::Visible
    );
    assert!(callbacks.hidden().is_empty());
    assert!(callbacks.deferred_hidden().is_empty());
}

fn callback_handles(records: &[RootUpdateCallbackRecord]) -> Vec<RootUpdateCallbackHandle> {
    records.iter().map(|record| record.callback()).collect()
}
