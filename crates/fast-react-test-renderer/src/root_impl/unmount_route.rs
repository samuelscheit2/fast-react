use super::super::*;

impl TestRendererRoot {
    pub fn describe_private_unmount_deletion_commit_handoff_for_canary(
        &self,
        output: &TestRendererUnmountedHostOutput,
    ) -> Result<TestRendererUnmountDeletionCommitHandoffDiagnostics, TestRendererRootError> {
        self.validate_serialization_gate_commit(output.commit())?;

        let Some(last_update) = self.scheduled_updates.last() else {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Unmount,
                actual: TestRendererRootUpdateKind::Create,
            });
        };
        if last_update.kind() != TestRendererRootUpdateKind::Unmount {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Unmount,
                actual: last_update.kind(),
            });
        }

        let current_snapshot = self.diagnostic_container_snapshot()?;
        if current_snapshot != *output.snapshot() {
            return Err(TestRendererPrivateJsonSerializationError::HostOutputSnapshotStale.into());
        }

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

        let commit = output.commit();
        let render = output.render();
        let deleted = output.deleted_fibers();
        let commit_current = commit.current();
        let commit_previous_current = commit.previous_current();
        let render_finished_work = render.finished_work();
        let store_current = self.store.root(self.root_id)?.current();
        let cleanup_log = commit.host_node_deletion_cleanup_log();
        let cleanup_report = output.host_node_cleanup();
        let passive_ref_cleanup_order =
            Self::passive_ref_cleanup_order_evidence_for_canary(commit, cleanup_report);
        let cleanup_records_match_deletion_commit = cleanup_report.root() == commit.root()
            && cleanup_report.len() == cleanup_log.len()
            && cleanup_report
                .records()
                .iter()
                .zip(cleanup_log.records())
                .all(|(report_record, commit_record)| {
                    report_record.sequence() == commit_record.sequence()
                        && report_record.root() == commit_record.root()
                        && report_record.deletion_list_index()
                            == commit_record.deletion_list_index()
                        && report_record.deleted_index() == commit_record.deleted_index()
                        && report_record.subtree_index() == commit_record.subtree_index()
                        && report_record.parent() == fiber_handle!(commit_record.parent())
                        && report_record.deleted_root()
                            == fiber_handle!(commit_record.deleted_root())
                        && report_record.fiber() == fiber_handle!(commit_record.fiber())
                        && report_record.state_node_raw() == commit_record.state_node().raw()
                        && report_record.token_raw() == commit_record.token().raw()
                        && report_record.token_phase() == commit_record.token_phase()
                });
        let deletion_list_count = output.commit_diagnostics().deletion_lists().len();
        let deleted_root_count = output
            .commit_diagnostics()
            .deletion_lists()
            .iter()
            .map(|record| record.deleted().len())
            .sum();
        let host_child_detachment_blockers = TestRendererUnmountHostChildDetachmentBlockers {
            detached_instance: output.detached_instance_snapshot().is_detached(),
            detached_instance_child_count: output.detached_instance_snapshot().children().len(),
            host_node_cleanup_invalidated_count: cleanup_report
                .records()
                .iter()
                .filter(|record| record.status() == TestRendererHostNodeCleanupStatus::Invalidated)
                .count(),
            host_node_cleanup_already_inactive_count: cleanup_report
                .records()
                .iter()
                .filter(|record| {
                    record.status() == TestRendererHostNodeCleanupStatus::AlreadyInactive
                })
                .count(),
            host_node_cleanup_missing_host_node_count: cleanup_report
                .records()
                .iter()
                .filter(|record| {
                    record.status() == TestRendererHostNodeCleanupStatus::MissingHostNode
                })
                .count(),
            host_node_cleanup_missing_state_node_count: cleanup_report
                .records()
                .iter()
                .filter(|record| {
                    record.status() == TestRendererHostNodeCleanupStatus::MissingStateNode
                })
                .count(),
            broad_host_child_detachment_blocked: true,
            public_host_teardown_compatibility_claimed: false,
            public_unmount_compatibility_claimed: cleanup_report
                .public_unmount_compatibility_claimed(),
            act_flushing_claimed: false,
        };

        Ok(TestRendererUnmountDeletionCommitHandoffDiagnostics {
            diagnostic_id: TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID,
            status: TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_STATUS,
            root: commit.root(),
            lifecycle: self.lifecycle,
            scheduled_update_kind: last_update.kind(),
            scheduled_element: last_update.element(),
            scheduled_element_is_none: last_update.element() == RootElementHandle::NONE,
            render_current: fiber_handle!(render.current()),
            commit_previous_current: fiber_handle!(commit_previous_current),
            commit_current: fiber_handle!(commit_current),
            render_finished_work: fiber_handle!(render_finished_work),
            render_lanes_bits: render.render_lanes().bits(),
            commit_finished_lanes_bits: commit.finished_lanes().bits(),
            deleted_root: fiber_handle!(deleted.host_root()),
            deleted_component: fiber_handle!(deleted.deleted_component()),
            deleted_text: fiber_handle!(deleted.deleted_text()),
            commit_current_is_store_current: commit_current == store_current,
            render_current_matches_commit_previous_current: render.current()
                == commit_previous_current,
            render_finished_work_matches_commit_current: render_finished_work == commit_current,
            deletion_list_count,
            deleted_root_count,
            host_node_cleanup_count: cleanup_report.len(),
            cleanup_records_match_deletion_commit,
            cleanup_order_record_count: commit.deletion_cleanup_order_gate_for_canary().len(),
            public_unmount_compatibility_claimed: cleanup_report
                .public_unmount_compatibility_claimed(),
            public_host_teardown_compatibility_claimed: false,
            act_flushing_claimed: false,
            host_child_detachment_blockers,
            passive_ref_cleanup_order,
        })
    }

    pub fn describe_private_unmount_native_bridge_admission_for_canary(
        &self,
        route_outcome: &TestRendererRootUpdateOutcome,
        handoff: Option<&TestRendererUnmountDeletionCommitHandoffDiagnostics>,
    ) -> Result<TestRendererUnmountNativeBridgeAdmission, TestRendererRootError> {
        let Some(scheduled_update) = route_outcome.scheduled() else {
            return Err(match route_outcome {
                TestRendererRootUpdateOutcome::AlreadyUnmountScheduled => {
                    TestRendererPrivateUnmountNativeBridgeAdmissionError::AlreadyUnmountedRoot
                }
                TestRendererRootUpdateOutcome::IgnoredAfterUnmount => {
                    TestRendererPrivateUnmountNativeBridgeAdmissionError::UnexpectedRouteOutcome {
                        actual: route_outcome.code(),
                    }
                }
                TestRendererRootUpdateOutcome::Scheduled(_) => unreachable!(),
            }
            .into());
        };
        if scheduled_update.kind() != TestRendererRootUpdateKind::Unmount {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::UnexpectedScheduledUpdateKind {
                    actual: scheduled_update.kind(),
                }
                .into(),
            );
        }
        if self.scheduled_updates.last() != Some(scheduled_update) {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::StaleRouteOutcome.into(),
            );
        }

        let Some(handoff) = handoff.copied() else {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingDeletionCommitHandoff
                    .into(),
            );
        };
        self.validate_private_unmount_native_bridge_handoff_for_canary(scheduled_update, handoff)?;
        let passive_ref_cleanup_order = handoff.passive_ref_cleanup_order();

        Ok(TestRendererUnmountNativeBridgeAdmission {
            diagnostic_id: TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            status: TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS,
            root: self.root_id,
            renderer_id: self.renderer.renderer_id,
            route_dependency_id: TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID,
            deletion_commit_handoff_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID,
            cleanup_handoff_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID,
            scheduled_update_sequence: self.scheduled_updates.len(),
            lifecycle: handoff.lifecycle(),
            scheduled_update_kind: scheduled_update.kind(),
            scheduled_element_is_none: scheduled_update.element() == RootElementHandle::NONE,
            render_current: handoff.render_current(),
            render_finished_work: handoff.render_finished_work(),
            commit_previous_current: handoff.commit_previous_current(),
            commit_current: handoff.commit_current(),
            render_lanes_bits: handoff.render_lanes_bits(),
            commit_finished_lanes_bits: handoff.commit_finished_lanes_bits(),
            deletion_commit_handoff_accepted: true,
            cleanup_handoff_accepted: true,
            lifecycle_evidence_accepted: true,
            cleanup_blockers_accepted: true,
            passive_ref_cleanup_order_accepted: true,
            host_node_cleanup_count: handoff.host_node_cleanup_count(),
            ref_cleanup_return_count: passive_ref_cleanup_order.ref_cleanup_return_count(),
            passive_destroy_count: passive_ref_cleanup_order.passive_destroy_count(),
            cleanup_order_record_count: handoff.cleanup_order_record_count(),
            native_cleanup_after_ref_and_passive_ordering: passive_ref_cleanup_order
                .native_cleanup_after_ref_and_passive_ordering(),
            rust_unmount_cleanup_handoff_executed: true,
            host_output_produced: true,
            minimal_tree_cleanup_handoff: handoff.host_node_cleanup_count() == 2
                && handoff.cleanup_order_record_count() == 2
                && passive_ref_cleanup_order.minimal_tree_ordering_is_host_cleanup_only()
                && passive_ref_cleanup_order.native_cleanup_after_ref_and_passive_ordering(),
            rejects_already_unmounted_roots: true,
            rejects_stale_deletion_handoffs: true,
            rejects_missing_cleanup_blockers: true,
            public_unmount_compatibility_claimed: false,
            public_host_teardown_compatibility_claimed: false,
            act_flushing_claimed: false,
            native_bridge_available: false,
            native_execution: false,
        })
    }

    pub fn execute_private_unmount_native_bridge_cleanup_handoff_for_canary(
        &mut self,
    ) -> Result<TestRendererUnmountNativeBridgeCleanupHandoff, TestRendererRootError> {
        self.execute_private_unmount_native_bridge_cleanup_handoff_inner_for_canary(false)
    }

    pub fn execute_private_unmount_native_bridge_cleanup_handoff_with_ref_passive_cleanup_for_canary(
        &mut self,
    ) -> Result<TestRendererUnmountNativeBridgeCleanupHandoff, TestRendererRootError> {
        self.execute_private_unmount_native_bridge_cleanup_handoff_inner_for_canary(true)
    }

    fn execute_private_unmount_native_bridge_cleanup_handoff_inner_for_canary(
        &mut self,
        include_ref_passive_cleanup: bool,
    ) -> Result<TestRendererUnmountNativeBridgeCleanupHandoff, TestRendererRootError> {
        let route_outcome = self.unmount()?;
        let unmounted = if include_ref_passive_cleanup {
            self.render_and_commit_host_output_unmount_with_ref_passive_cleanup_for_canary()?
        } else {
            self.render_and_commit_host_output_unmount_for_canary()?
        };
        let Some(unmounted) = unmounted else {
            return Err(
                TestRendererPrivateUnmountNativeBridgeAdmissionError::MissingDeletionCommitHandoff
                    .into(),
            );
        };
        let handoff =
            self.describe_private_unmount_deletion_commit_handoff_for_canary(&unmounted)?;
        let admission = self.describe_private_unmount_native_bridge_admission_for_canary(
            &route_outcome,
            Some(&handoff),
        )?;
        let previous_root_child_count = unmounted.previous_snapshot().children().len();
        let current_root_child_count = unmounted.snapshot().children().len();
        let detached_instance = unmounted.detached_instance_snapshot().is_detached();
        let detached_instance_child_count = unmounted.detached_instance_snapshot().children().len();
        let passive_ref_cleanup_order = handoff.passive_ref_cleanup_order();
        let minimal_tree_cleanup_handoff = previous_root_child_count == 1
            && current_root_child_count == 0
            && detached_instance
            && detached_instance_child_count == 0
            && handoff.host_node_cleanup_count() == 2
            && handoff.cleanup_order_record_count() == 2
            && passive_ref_cleanup_order.minimal_tree_ordering_is_host_cleanup_only()
            && passive_ref_cleanup_order.native_cleanup_after_ref_and_passive_ordering();

        Ok(TestRendererUnmountNativeBridgeCleanupHandoff {
            diagnostic_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID,
            status: TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_STATUS,
            root: self.root_id,
            route_outcome: route_outcome.code(),
            route_dependency_id: TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID,
            deletion_commit_handoff_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID,
            admission_diagnostic_id:
                TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            lifecycle: handoff.lifecycle(),
            scheduled_update_kind: handoff.scheduled_update_kind(),
            scheduled_element_is_none: handoff.scheduled_element_is_none(),
            previous_root_child_count,
            current_root_child_count,
            detached_instance,
            detached_instance_child_count,
            host_node_cleanup_count: handoff.host_node_cleanup_count(),
            ref_cleanup_return_count: passive_ref_cleanup_order.ref_cleanup_return_count(),
            passive_destroy_count: passive_ref_cleanup_order.passive_destroy_count(),
            cleanup_order_record_count: handoff.cleanup_order_record_count(),
            native_cleanup_after_ref_and_passive_ordering: passive_ref_cleanup_order
                .native_cleanup_after_ref_and_passive_ordering(),
            minimal_tree_cleanup_handoff,
            rust_unmount_cleanup_handoff_executed: true,
            host_output_produced: true,
            passive_ref_cleanup_order,
            deletion_commit_handoff: handoff,
            native_bridge_admission: admission,
            public_unmount_compatibility_claimed: false,
            public_host_teardown_compatibility_claimed: false,
            act_flushing_claimed: false,
            native_bridge_available: false,
            native_execution: false,
        })
    }
}
