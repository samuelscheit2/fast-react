use super::super::*;

impl TestRendererRoot {
    #[must_use]
    pub fn consume_private_act_pending_passive_flush_metadata_for_canary(
        &self,
        metadata: TestRendererPrivateActPendingPassiveFlushMetadata,
    ) -> TestRendererPrivateActPassiveEffectDrainDiagnostics {
        TestRendererPrivateActPassiveEffectDrainDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_STATUS,
            accepted_reconciler_records:
                TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_ACCEPTED_RECORDS,
            metadata,
            metadata_root_matches_renderer_root: metadata.root() == self.root_id,
            consumes_pending_passive_flush_metadata: true,
            consumes_accepted_scheduler_flush_metadata: true,
            private_scheduler_flush_request_metadata_consumed: true,
            consumes_accepted_native_update_execution: false,
            private_update_native_bridge_admission: None,
            host_output_produced_from_native_update: false,
            executes_passive_effects: false,
            invokes_effect_callbacks: false,
            invokes_act_callback: false,
            public_update_compatibility_claimed: false,
            public_act_compatibility_claimed: false,
            compatibility_claimed: false,
        }
    }

    #[must_use]
    pub fn consume_private_act_update_native_execution_and_pending_passive_flush_metadata_for_canary(
        &self,
        admission: TestRendererUpdateNativeBridgeAdmission,
        metadata: TestRendererPrivateActPendingPassiveFlushMetadata,
    ) -> TestRendererPrivateActPassiveEffectDrainDiagnostics {
        TestRendererPrivateActPassiveEffectDrainDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTIC_STATUS,
            accepted_reconciler_records:
                TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_ACCEPTED_RECORDS,
            metadata,
            metadata_root_matches_renderer_root: metadata.root() == self.root_id
                && admission.root() == self.root_id,
            consumes_pending_passive_flush_metadata: true,
            consumes_accepted_scheduler_flush_metadata: true,
            private_scheduler_flush_request_metadata_consumed: true,
            consumes_accepted_native_update_execution: admission.update_route_admission_accepted()
                && admission.lifecycle_evidence_accepted()
                && admission.root_work_loop_handoff_accepted()
                && admission.host_output_handoff_accepted()
                && admission.rust_execution_from_js()
                && admission.reconciler_execution_from_js(),
            private_update_native_bridge_admission: Some(admission),
            host_output_produced_from_native_update: admission.host_output_handoff_accepted()
                && admission.text_update_apply_recorded(),
            executes_passive_effects: false,
            invokes_effect_callbacks: false,
            invokes_act_callback: false,
            public_update_compatibility_claimed: false,
            public_act_compatibility_claimed: false,
            compatibility_claimed: false,
        }
    }

    pub fn describe_private_act_nested_scope_passive_flush_for_canary(
        &self,
        metadata: TestRendererPrivateActPendingPassiveFlushMetadata,
    ) -> Result<TestRendererPrivateActNestedScopePassiveFlushDiagnostics, TestRendererRootError>
    {
        if metadata.root() != self.root_id {
            return Err(
                TestRendererPrivateActNestedScopePassiveFlushError::RootMismatch {
                    expected: self.root_id,
                    actual: metadata.root(),
                }
                .into(),
            );
        }
        if metadata.pending_record_count() == 0 {
            return Err(
                TestRendererPrivateActNestedScopePassiveFlushError::RecordMismatch {
                    reason: "missing-pending-passive-work",
                }
                .into(),
            );
        }

        let passive_drain =
            self.consume_private_act_pending_passive_flush_metadata_for_canary(metadata);
        if !passive_drain.metadata_root_matches_renderer_root()
            || !passive_drain.consumes_pending_passive_flush_metadata()
            || !passive_drain.consumes_accepted_scheduler_flush_metadata()
            || !passive_drain.private_scheduler_flush_request_metadata_consumed()
        {
            return Err(
                TestRendererPrivateActNestedScopePassiveFlushError::RecordMismatch {
                    reason: "passive-drain-metadata-not-accepted",
                }
                .into(),
            );
        }
        if passive_drain.executes_passive_effects()
            || passive_drain.invokes_effect_callbacks()
            || passive_drain.invokes_act_callback()
            || passive_drain.public_act_compatibility_claimed()
            || passive_drain.compatibility_claimed()
        {
            return Err(
                TestRendererPrivateActNestedScopePassiveFlushError::PublicActOpened {
                    reason: "passive-drain-claimed-public-execution",
                }
                .into(),
            );
        }

        Ok(TestRendererPrivateActNestedScopePassiveFlushDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_DIAGNOSTIC_NAME,
            status: TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_STATUS,
            passive_drain,
            flush_order: TEST_RENDERER_PRIVATE_ACT_NESTED_SCOPE_PASSIVE_FLUSH_ORDER,
            outer_scope_depth: 1,
            inner_scope_depth: 2,
            passive_flush_order_index: 2,
            pending_unmount_count: metadata.pending_unmount_count(),
            pending_mount_count: metadata.pending_mount_count(),
            pending_passive_record_count: metadata.pending_record_count(),
            nested_scope_metadata_accepted: true,
            private_passive_flush_metadata_accepted: true,
            drains_accepted_pending_passive_flush_metadata: true,
            deterministic_flush_order: true,
            public_act_scope_depth_tracking_available: false,
            public_nested_act_queue_reuse_available: false,
            public_overlapping_act_warning_emission_available: false,
            invokes_act_callback: false,
            executes_passive_effects: false,
            invokes_effect_callbacks: false,
            public_act_compatibility_claimed: false,
            compatibility_claimed: false,
        })
    }
}
