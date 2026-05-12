use super::*;

#[test]
fn root_private_serialization_finished_work_identity_gate_rejects_missing_evidence() {
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

    let error = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(output.render()),
            Some(output.commit()),
            None,
        )
        .unwrap_err();

    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected private serialization finished-work identity error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateSerializationFinishedWorkIdentityError::MissingSerializationEvidence {
            public_surface: "create().toJSON"
        }
    ));
}

#[test]
fn root_private_serialization_finished_work_identity_gate_rejects_foreign_evidence() {
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
    let mut report = root
        .describe_private_json_serialization_for_canary(&output)
        .unwrap();
    report.gate.commit.root = FiberRootId::new(root.root_id().raw() + 1).unwrap();

    let error = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(output.render()),
            Some(output.commit()),
            Some(&report),
        )
        .unwrap_err();

    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected private serialization finished-work identity error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateSerializationFinishedWorkIdentityError::ForeignFinishedWorkIdentity {
            reason: "serialization-report-root-mismatch"
        }
    ));
}

#[test]
fn root_private_serialization_finished_work_identity_gate_rejects_stale_evidence() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    let stale_output = root
        .render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    let stale_report = root
        .describe_private_json_serialization_for_canary(&stale_output)
        .unwrap();
    root.update_host_component_with_text_for_canary("span", "goodbye")
        .unwrap();
    root.render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();

    let error = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(stale_output.render()),
            Some(stale_output.commit()),
            Some(&stale_report),
        )
        .unwrap_err();

    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected private serialization finished-work identity error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
            reason: "commit-current-not-root-current"
        }
    ));
}

#[test]
fn root_private_serialization_finished_work_identity_gate_rejects_stale_update_evidence() {
    let mut root = TestRendererRoot::create_host_component_with_text_for_canary(
        "span",
        "hello",
        TestRendererOptions::new(),
    )
    .unwrap();
    root.render_and_commit_host_output_for_canary()
        .unwrap()
        .unwrap();
    root.update_host_component_with_text_for_canary("span", "goodbye")
        .unwrap();
    let stale_update = root
        .render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();
    let stale_report = root
        .describe_private_json_serialization_after_update_for_canary(&stale_update)
        .unwrap();
    root.update_host_component_with_text_for_canary("span", "later")
        .unwrap();
    root.render_and_commit_host_output_update_for_canary()
        .unwrap()
        .unwrap();

    let error = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(stale_update.render()),
            Some(stale_update.commit()),
            Some(&stale_report),
        )
        .unwrap_err();

    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected private serialization finished-work identity error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateSerializationFinishedWorkIdentityError::StaleFinishedWorkIdentity {
            reason: "commit-current-not-root-current"
        }
    ));
}

#[test]
fn root_private_serialization_finished_work_identity_gate_rejects_non_committed_identity() {
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
    let report = root
        .describe_private_json_serialization_for_canary(&output)
        .unwrap();
    root.update_host_component_with_text_for_canary("span", "goodbye")
        .unwrap();
    let render = root
        .render_latest_scheduled_host_root_for_commit_handoff()
        .unwrap()
        .unwrap();

    let error = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(render),
            Some(output.commit()),
            Some(&report),
        )
        .unwrap_err();

    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected private serialization finished-work identity error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateSerializationFinishedWorkIdentityError::NonCommittedFinishedWorkIdentity {
            reason: "commit-current-finished-work-mismatch"
        }
    ));
}

#[test]
fn root_private_serialization_finished_work_identity_gate_rejects_lane_mismatch() {
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
    let mut report = root
        .describe_private_json_serialization_for_canary(&output)
        .unwrap();
    report.gate.commit.finished_lanes_bits = 0;

    let error = root
        .describe_private_to_json_finished_work_identity_gate_for_canary(
            Some(output.render()),
            Some(output.commit()),
            Some(&report),
        )
        .unwrap_err();

    let TestRendererRootError::PrivateSerializationFinishedWorkIdentity(error) = error else {
        panic!("expected private serialization finished-work identity error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererPrivateSerializationFinishedWorkIdentityError::LaneMismatch {
            render_lanes_bits: 0,
            commit_finished_lanes_bits
        } if *commit_finished_lanes_bits != 0
    ));
}

#[test]
fn root_serialization_gate_sees_private_committed_fiber_inspection_after_host_output() {
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
    let commit = output.commit();

    let report = root
        .require_serialization_gate_ready_for_canary(commit)
        .unwrap();
    let requirements = report.requirements();
    let fiber_inspection = report.fiber_inspection().unwrap();

    assert_eq!(
        report.status(),
        TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
    );
    assert!(report.is_ready());
    assert!(requirements.root_commit_diagnostics_available());
    assert!(requirements.real_host_output_available());
    assert!(requirements.committed_fiber_inspection_available());
    assert!(requirements.private_serialization_ready());
    assert!(!report.oracle().compatibility_claimed());
    assert_eq!(report.host_output().container_child_count(), 1);
    assert_eq!(report.host_output().instance_count(), 1);
    assert_eq!(report.host_output().text_count(), 1);
    assert_eq!(fiber_inspection.current(), commit.current());
    assert_eq!(
        fiber_inspection.host_component().fiber(),
        output.completed_fibers().component()
    );
    assert_eq!(
        fiber_inspection.host_text().fiber(),
        output.completed_fibers().text()
    );
}

#[test]
fn root_serialization_gate_reports_committed_diagnostics_and_missing_host_output() {
    let callback = RootUpdateCallbackHandle::from_raw(101);
    let mut root = TestRendererRoot::create_with_root_update_callback_for_canary(
        root_element(10),
        TestRendererOptions::new(),
        callback,
    )
    .unwrap();
    let (render, commit) = render_and_commit_latest_host_root(&mut root);

    let report = root
        .describe_serialization_gate_for_canary(&commit)
        .unwrap();
    let requirements = report.requirements();
    let oracle = report.oracle();
    let commit_diagnostics = report.commit();
    let callback_diagnostics = commit_diagnostics.root_update_callbacks();
    let host_output = report.host_output();

    assert_eq!(
        report.gate_name(),
        TEST_RENDERER_SERIALIZATION_CANARY_GATE_NAME
    );
    assert_eq!(
        report.status(),
        TestRendererSerializationGateStatus::ClosedMissingHostOutput
    );
    assert!(report.is_closed());
    assert!(!report.is_ready());
    assert!(requirements.root_commit_diagnostics_available());
    assert!(!requirements.real_host_output_available());
    assert!(!requirements.committed_fiber_inspection_available());
    assert!(!requirements.private_serialization_ready());
    assert!(report.fiber_inspection().is_none());
    assert_eq!(
        oracle.oracle_kind(),
        TEST_RENDERER_SERIALIZATION_ORACLE_KIND
    );
    assert_eq!(
        oracle.probe_mode_count(),
        TEST_RENDERER_SERIALIZATION_ORACLE_PROBE_MODE_COUNT
    );
    assert_eq!(
        oracle.scenario_count(),
        TEST_RENDERER_SERIALIZATION_ORACLE_SCENARIO_COUNT
    );
    assert!(!oracle.compatibility_claimed());
    assert_eq!(commit_diagnostics.root(), root.root_id());
    assert_eq!(
        commit_diagnostics.lifecycle(),
        TestRendererRootLifecycle::Active
    );
    assert_eq!(
        commit_diagnostics.last_update_kind(),
        Some(TestRendererRootUpdateKind::Create)
    );
    assert_eq!(
        commit_diagnostics.last_scheduled_element(),
        Some(root_element(10))
    );
    assert_eq!(
        commit_diagnostics.previous_current().slot(),
        commit.previous_current().slot().get()
    );
    assert_eq!(
        commit_diagnostics.current().slot(),
        commit.current().slot().get()
    );
    assert_eq!(
        commit_diagnostics.finished_work().slot(),
        commit.finished_work().slot().get()
    );
    assert_eq!(
        commit_diagnostics.current(),
        commit_diagnostics.finished_work()
    );
    assert_eq!(commit.current(), render.finished_work());
    assert!(!commit_diagnostics.finished_lanes_empty());
    assert!(!commit_diagnostics.finished_lanes_include_sync());
    assert!(commit_diagnostics.remaining_lanes_empty());
    assert!(commit_diagnostics.pending_lanes_empty());
    assert!(!commit_diagnostics.has_remaining_work());
    assert!(!callback_diagnostics.is_empty());
    assert_eq!(callback_diagnostics.visible_count(), 1);
    assert_eq!(callback_diagnostics.hidden_count(), 0);
    assert_eq!(callback_diagnostics.deferred_hidden_count(), 0);
    assert_eq!(host_output.container_child_count(), 0);
    assert_eq!(host_output.instance_count(), 0);
    assert_eq!(host_output.text_count(), 0);
    assert!(!host_output.real_host_output_available());
}

#[test]
fn root_serialization_gate_fails_closed_before_real_host_output() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    let (_render, commit) = render_and_commit_latest_host_root(&mut root);

    let error = root
        .require_serialization_gate_ready_for_canary(&commit)
        .unwrap_err();

    let TestRendererRootError::SerializationGate(error) = error else {
        panic!("expected serialization gate closure");
    };
    let TestRendererSerializationGateError::Closed(report) = error.as_ref() else {
        panic!("expected serialization gate closure");
    };
    assert_eq!(
        report.status(),
        TestRendererSerializationGateStatus::ClosedMissingHostOutput
    );
    assert_eq!(report.commit().root(), root.root_id());
    assert_eq!(report.host_output().container_child_count(), 0);
    assert!(!report.requirements().real_host_output_available());
    assert!(report.fiber_inspection().is_none());
}

#[test]
fn root_serialization_gate_rejects_stale_commit_diagnostics() {
    let mut root = TestRendererRoot::create(root_element(1), TestRendererOptions::new()).unwrap();
    let (_create_render, create_commit) = render_and_commit_latest_host_root(&mut root);
    root.update(root_element(2)).unwrap();
    render_and_commit_latest_host_root(&mut root);

    let error = root
        .describe_serialization_gate_for_canary(&create_commit)
        .unwrap_err();

    let TestRendererRootError::SerializationGate(error) = error else {
        panic!("expected serialization gate error");
    };
    assert!(matches!(
        error.as_ref(),
        TestRendererSerializationGateError::CommitIsNotCurrent { root: error_root, .. }
            if *error_root == root.root_id()
    ));
}
