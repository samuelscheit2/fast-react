    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_STALE_REJECTED_EVIDENCE_ROW_ID: &str =
        "cleanup-hook-stale-worker-transport-evidence-rejected";
    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_FORGED_REJECTED_EVIDENCE_ROW_ID: &str =
        "cleanup-hook-forged-peer-active-evidence-rejected";

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    enum NativeRootBridgeWorkerThreadCleanupHookExpectedRejection {
        StaleWorkerTransport,
        ForgedPeerActive,
    }

    const fn bridge_handle_kind_code(kind: BridgeHandleKind) -> &'static str {
        match kind {
            BridgeHandleKind::Root => "root",
            BridgeHandleKind::Value => "value",
        }
    }

    fn validate_native_root_bridge_worker_thread_cleanup_hook_evidence_rows_for_preflight(
        executable_preflight: &NativeRootBridgeWorkerThreadTeardownExecutablePreflight,
        evidence_rows: impl IntoIterator<Item = NativeRootBridgeWorkerThreadCleanupHookEvidence>,
    ) -> NativeRootBridgeWorkerThreadCleanupHookPreflight {
        let rows = evidence_rows
            .into_iter()
            .map(|evidence| {
                validate_native_root_bridge_worker_thread_cleanup_hook_evidence_for_preflight(
                    executable_preflight,
                    evidence,
                )
            })
            .collect::<Vec<_>>();
        let rows = enforce_cleanup_hook_canonical_evidence_set(rows);
        let accepted_cleanup_evidence_count = rows
            .iter()
            .filter(|row| {
                row.status() == NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Accepted
            })
            .count();
        let rejected_cleanup_evidence_count = rows
            .iter()
            .filter(|row| {
                row.status() == NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Rejected
            })
            .count();
        let stale_or_forged_cleanup_evidence_rejection_count = rows
            .iter()
            .filter(|row| row.stale_or_forged_cleanup_evidence_rejected())
            .count();
        let canonical_executable_evidence_accepted =
            cleanup_hook_has_exact_canonical_evidence_set(&rows);

        NativeRootBridgeWorkerThreadCleanupHookPreflight {
            status: NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PREFLIGHT_STATUS,
            model: NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PREFLIGHT_MODEL,
            execution_scope:
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PREFLIGHT_EXECUTION_SCOPE,
            source_executable_preflight_status: executable_preflight.status(),
            worker_thread_id: executable_preflight.worker_thread_id(),
            worker_environment_id: executable_preflight.worker_environment_id(),
            peer_environment_id: executable_preflight.peer_environment_id(),
            canonical_executable_evidence_required: true,
            canonical_executable_evidence_accepted,
            cleanup_hook_registration_count: usize::from(
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_COUNT,
            ),
            cleanup_hook_execution_order: "reverse-registration-order",
            accepted_cleanup_evidence_count,
            rejected_cleanup_evidence_count,
            stale_or_forged_cleanup_evidence_rejection_count,
            cleanup_hook_order_private: true,
            cleanup_hook_identity_private: true,
            rows,
            node_worker_threads_execution: false,
            napi_cleanup_hook_execution: false,
            native_addon_loaded: false,
            native_execution: false,
            renderer_execution: false,
            reconciler_execution: false,
            public_native_compatibility: false,
            react_behavior_error: false,
        }
    }

    fn enforce_cleanup_hook_canonical_evidence_set(
        rows: Vec<NativeRootBridgeWorkerThreadCleanupHookPreflightRow>,
    ) -> Vec<NativeRootBridgeWorkerThreadCleanupHookPreflightRow> {
        if cleanup_hook_has_exact_canonical_evidence_set(&rows) {
            return rows;
        }

        rows.into_iter()
            .map(|row| {
                if row.status()
                    == NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Accepted
                    && row.canonical_executable_evidence()
                {
                    NativeRootBridgeWorkerThreadCleanupHookPreflightRow::rejected(
                        NativeRootBridgeWorkerThreadCleanupHookEvidence::from_preflight_row(row),
                        NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_CANONICAL_SET_MISMATCH_CODE,
                    )
                } else {
                    row
                }
            })
            .collect()
    }

    fn cleanup_hook_has_exact_canonical_evidence_set(
        rows: &[NativeRootBridgeWorkerThreadCleanupHookPreflightRow],
    ) -> bool {
        if rows.len() != 4 {
            return false;
        }

        let mut root_count = 0;
        let mut value_count = 0;
        let mut stale_rejection_count = 0;
        let mut forged_rejection_count = 0;

        for row in rows {
            match cleanup_hook_accepted_canonical_role(*row) {
                Some(NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Root) => {
                    root_count += 1;
                    continue;
                }
                Some(NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Value) => {
                    value_count += 1;
                    continue;
                }
                None => {}
            }

            match cleanup_hook_expected_rejected_canonical_evidence(*row) {
                Some(NativeRootBridgeWorkerThreadCleanupHookExpectedRejection::StaleWorkerTransport) => {
                    stale_rejection_count += 1;
                }
                Some(NativeRootBridgeWorkerThreadCleanupHookExpectedRejection::ForgedPeerActive) => {
                    forged_rejection_count += 1;
                }
                None => return false,
            }
        }

        root_count == 1
            && value_count == 1
            && stale_rejection_count == 1
            && forged_rejection_count == 1
    }

    fn cleanup_hook_accepted_canonical_role(
        row: NativeRootBridgeWorkerThreadCleanupHookPreflightRow,
    ) -> Option<NativeRootBridgeWorkerThreadCleanupHookCanonicalRole> {
        if row.status() != NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Accepted
            || !row.canonical_executable_evidence()
        {
            return None;
        }

        let role =
            cleanup_hook_canonical_role_for_source(row.source_row_id(), row.source_handle_kind())?;

        (row.id() == cleanup_hook_expected_evidence_row_id(role)
            && row.operation() == "cleanup-hook-order-preflight"
            && row.code().is_none()
            && row.observed_execution_order() == Some(row.expected_execution_order())
            && cleanup_hook_expected_identity_for_role(role).matches_row(row)
            && cleanup_hook_accepted_source_fields_match_expected_role(row, role)
            && cleanup_hook_row_keeps_private_non_execution_guards(row)
            && !row.stale_or_forged_cleanup_evidence_rejected())
        .then_some(role)
    }

    fn cleanup_hook_expected_rejected_canonical_evidence(
        row: NativeRootBridgeWorkerThreadCleanupHookPreflightRow,
    ) -> Option<NativeRootBridgeWorkerThreadCleanupHookExpectedRejection> {
        if row.status() != NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Rejected
            || row.canonical_executable_evidence()
            || row.observed_execution_order().is_some()
            || !row.stale_or_forged_cleanup_evidence_rejected()
            || !cleanup_hook_row_keeps_private_non_execution_guards(row)
        {
            return None;
        }

        if cleanup_hook_matches_expected_stale_transport_rejection(row) {
            Some(NativeRootBridgeWorkerThreadCleanupHookExpectedRejection::StaleWorkerTransport)
        } else if cleanup_hook_matches_expected_forged_peer_active_rejection(row) {
            Some(NativeRootBridgeWorkerThreadCleanupHookExpectedRejection::ForgedPeerActive)
        } else {
            None
        }
    }

    fn cleanup_hook_matches_expected_stale_transport_rejection(
        row: NativeRootBridgeWorkerThreadCleanupHookPreflightRow,
    ) -> bool {
        row.id() == NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_STALE_REJECTED_EVIDENCE_ROW_ID
            && row.operation() == "cleanup-hook-evidence-preflight-rejection"
            && row.cleanup_hook_id() == "stale-worker-transport-cleanup-hook"
            && row.cleanup_hook_function_identity_token()
                == "private-cleanup-hook-fn:stale-worker-teardown"
            && row.cleanup_hook_argument_identity_token()
                == "private-cleanup-hook-arg:worker-524-root-slot-1"
            && row.registration_order() == 2
            && row.expected_execution_order() == 1
            && row.code() == Some(NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_STALE_EVIDENCE_CODE)
            && row.source_preflight_status()
                == super::NATIVE_ROOT_BRIDGE_TRANSPORT_WORKER_THREAD_TEARDOWN_GATE_STATUS
            && row.source_worker_thread_id() == 524
            && row.source_environment_id() == BridgeEnvironmentId::from_raw(524)
            && row.source_row_id() == "worker-root-stale-after-thread-teardown"
            && row.source_provenance_token().is_none()
            && row.source_handle_kind() == BridgeHandleKind::Root
            && cleanup_hook_row_has_no_source_identity(row)
            && row.source_error_code() == Some("FAST_REACT_NAPI_STALE_HANDLE")
            && row.source_boundary_error_code()
                == Some(super::NativeBoundaryErrorKind::RootBridgeStaleHandle.code())
    }

    fn cleanup_hook_matches_expected_forged_peer_active_rejection(
        row: NativeRootBridgeWorkerThreadCleanupHookPreflightRow,
    ) -> bool {
        row.id() == NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_FORGED_REJECTED_EVIDENCE_ROW_ID
            && row.operation() == "cleanup-hook-evidence-preflight-rejection"
            && row.cleanup_hook_id() == "forged-peer-active-cleanup-hook"
            && row.cleanup_hook_function_identity_token()
                == "private-cleanup-hook-fn:forged-peer-active"
            && row.cleanup_hook_argument_identity_token()
                == "private-cleanup-hook-arg:worker-1764-peer-root"
            && row.registration_order() == 1
            && row.expected_execution_order() == 2
            && row.code()
                == Some(NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_FORGED_EVIDENCE_CODE)
            && row.source_preflight_status()
                == NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS
            && row.source_worker_thread_id() == 764
            && row.source_environment_id() == BridgeEnvironmentId::from_raw(764)
            && row.source_row_id() == "peer-root-active-executable-preflight"
            && row.source_provenance_token().is_none()
            && row.source_handle_kind() == BridgeHandleKind::Root
            && cleanup_hook_row_has_no_source_identity(row)
            && row.source_error_code().is_none()
            && row.source_boundary_error_code().is_none()
    }

    fn cleanup_hook_accepted_source_fields_match_expected_role(
        row: NativeRootBridgeWorkerThreadCleanupHookPreflightRow,
        role: NativeRootBridgeWorkerThreadCleanupHookCanonicalRole,
    ) -> bool {
        match role {
            NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Root => {
                row.source_preflight_status()
                    == NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS
                    && row.source_worker_thread_id() == 764
                    && row.source_environment_id() == BridgeEnvironmentId::from_raw(764)
                    && row.source_provenance_token()
                        == Some(NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_SOURCE_PROVENANCE_TOKEN)
                    && row.source_handle_environment_id()
                        == Some(BridgeEnvironmentId::from_raw(764))
                    && row.source_handle_slot() == Some(1)
                    && row.source_handle_generation() == Some(1)
                    && row.source_current_generation() == Some(2)
                    && row.source_record_id().is_none()
                    && row.source_root_id() == Some(1)
                    && row.source_error_code() == Some("FAST_REACT_NAPI_STALE_HANDLE")
                    && row.source_boundary_error_code()
                        == Some(super::NativeBoundaryErrorKind::RootBridgeStaleHandle.code())
            }
            NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Value => {
                row.source_preflight_status()
                    == NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS
                    && row.source_worker_thread_id() == 764
                    && row.source_environment_id() == BridgeEnvironmentId::from_raw(764)
                    && row.source_provenance_token()
                        == Some(NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_SOURCE_PROVENANCE_TOKEN)
                    && row.source_handle_environment_id()
                        == Some(BridgeEnvironmentId::from_raw(764))
                    && row.source_handle_slot() == Some(3)
                    && row.source_handle_generation() == Some(1)
                    && row.source_current_generation() == Some(2)
                    && row.source_record_id().is_none()
                    && row.source_root_id() == Some(1)
                    && row.source_error_code() == Some("FAST_REACT_NAPI_STALE_HANDLE")
                    && row.source_boundary_error_code()
                        == Some(super::NativeBoundaryErrorKind::RootBridgeStaleHandle.code())
            }
        }
    }

    fn cleanup_hook_row_has_no_source_identity(
        row: NativeRootBridgeWorkerThreadCleanupHookPreflightRow,
    ) -> bool {
        row.source_handle_environment_id().is_none()
            && row.source_handle_slot().is_none()
            && row.source_handle_generation().is_none()
            && row.source_current_generation().is_none()
            && row.source_record_id().is_none()
            && row.source_root_id().is_none()
    }

    fn cleanup_hook_row_keeps_private_non_execution_guards(
        row: NativeRootBridgeWorkerThreadCleanupHookPreflightRow,
    ) -> bool {
        row.cleanup_hook_order_private()
            && row.cleanup_hook_identity_private()
            && !row.node_worker_threads_execution()
            && !row.napi_cleanup_hook_execution()
            && !row.native_addon_loaded()
            && !row.native_execution()
            && !row.renderer_execution()
            && !row.reconciler_execution()
            && !row.public_native_compatibility()
            && !row.react_behavior_error()
    }

    const fn cleanup_hook_expected_identity_for_role(
        role: NativeRootBridgeWorkerThreadCleanupHookCanonicalRole,
    ) -> NativeRootBridgeWorkerThreadCleanupHookExpectedIdentity {
        match role {
            NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Root => {
                NativeRootBridgeWorkerThreadCleanupHookExpectedIdentity::root()
            }
            NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Value => {
                NativeRootBridgeWorkerThreadCleanupHookExpectedIdentity::value()
            }
        }
    }

    impl NativeRootBridgeWorkerThreadCleanupHookExpectedIdentity {
        fn matches_row(self, row: NativeRootBridgeWorkerThreadCleanupHookPreflightRow) -> bool {
            row.cleanup_hook_id() == self.cleanup_hook_id
                && row.cleanup_hook_function_identity_token()
                    == self.cleanup_hook_function_identity_token
                && row.cleanup_hook_argument_identity_token()
                    == self.cleanup_hook_argument_identity_token
                && row.registration_order() == self.registration_order
                && row.expected_execution_order() == self.expected_execution_order
                && cleanup_hook_canonical_role_for_source(
                    row.source_row_id(),
                    row.source_handle_kind(),
                ) == Some(self.role)
        }
    }

    const fn cleanup_hook_expected_evidence_row_id(
        role: NativeRootBridgeWorkerThreadCleanupHookCanonicalRole,
    ) -> &'static str {
        match role {
            NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Root => {
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_EVIDENCE_ROW_ID
            }
            NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Value => {
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_EVIDENCE_ROW_ID
            }
        }
    }

    fn cleanup_hook_row_for_batch_lifecycle_consumer(
        kind: &str,
        cleanup_hook_preflight: &NativeRootBridgeWorkerThreadCleanupHookPreflight,
    ) -> Option<NativeRootBridgeWorkerThreadCleanupHookPreflightRow> {
        let expected_handle_kind = match kind {
            "render" => BridgeHandleKind::Value,
            "unmount" => BridgeHandleKind::Root,
            _ => return None,
        };

        cleanup_hook_preflight.rows().iter().copied().find(|row| {
            row.status() == NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Accepted
                && row.canonical_executable_evidence()
                && row.source_handle_kind() == expected_handle_kind
                && cleanup_hook_accepted_canonical_role(*row).is_some()
        })
    }

    fn worker_thread_teardown_json_transport_payload() -> &'static str {
        r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":524,"root_handle":{"environment_id":524,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":524,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":524,"root_handle":{"environment_id":524,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":524,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"}]}"#
    }

    fn worker_thread_teardown_preflight_json_transport_payload() -> &'static str {
        r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":764,"root_handle":{"environment_id":764,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":764,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":764,"root_handle":{"environment_id":764,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":764,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"}]}"#
    }

    fn transport_worker_thread_teardown_rows(
        worker_thread_id: u64,
        worker_environment_id: BridgeEnvironmentId,
        peer_environment_id: BridgeEnvironmentId,
        records: &[NativeRootBridgeJsonTransportRecord],
    ) -> (
        BridgeEnvironmentTeardown,
        BridgeEnvironmentTeardown,
        Vec<NativeRootBridgeTransportWorkerThreadTeardownRow>,
    ) {
        let mut worker_table = BridgeHandleTable::new(worker_environment_id);
        let mut validator = NativeRootBridgeRequestSequenceValidator::new();
        let mut root_handle_state = None;
        let mut tracked_handles = Vec::new();

        for (batch_index, record) in records.iter().copied().enumerate() {
            let request = record
                .decode()
                .expect("worker-thread teardown records decode");
            prevalidate_handoff_lifecycle(&validator, request)
                .expect("worker-thread teardown lifecycle prevalidates");
            admit_js_native_root_bridge_handoff_record(
                &mut worker_table,
                request,
                root_handle_state,
            )
            .expect("worker-thread teardown record admits into table");
            let validation_record = validator
                .validate_next(&worker_table, request)
                .expect("worker-thread teardown record validates after admission");

            if batch_index == 0 {
                tracked_handles.push((
                    "worker-root-stale-after-thread-teardown",
                    batch_index,
                    request.request_id(),
                    request.root_handle(),
                ));
            }
            if let Some(value_handle) = request.value_handle() {
                tracked_handles.push((
                    match request.kind() {
                        NativeRootBridgeRequestKind::Create => {
                            "worker-create-value-stale-after-thread-teardown"
                        }
                        NativeRootBridgeRequestKind::Render => {
                            "worker-render-value-stale-after-thread-teardown"
                        }
                        NativeRootBridgeRequestKind::Unmount => {
                            "worker-unmount-value-stale-after-thread-teardown"
                        }
                    },
                    batch_index,
                    request.request_id(),
                    value_handle,
                ));
            }

            root_handle_state = Some(validation_record.root_handle_state());
        }

        let mut peer_table = BridgeHandleTable::new(peer_environment_id);
        let peer_root = peer_table.insert_root(PlaceholderRootRecord::new(152401));
        let mismatched_teardown = peer_table.teardown_environment(worker_environment_id);
        let matched_teardown = worker_table.teardown_environment(worker_environment_id);

        let mut rows = Vec::with_capacity(tracked_handles.len() + 1);
        for (id, batch_index, request_id, handle) in tracked_handles {
            let error = match handle.kind() {
                BridgeHandleKind::Root => worker_table
                    .get_root(handle)
                    .expect_err("worker root is stale after thread teardown"),
                BridgeHandleKind::Value => worker_table
                    .get_value(handle)
                    .expect_err("worker value is stale after thread teardown"),
            };
            rows.push(NativeRootBridgeTransportWorkerThreadTeardownRow::rejected(
                NativeRootBridgeTransportWorkerThreadTeardownRejectedRowInit {
                    id,
                    operation: "worker-thread-teardown",
                    worker_thread_id,
                    source_batch_index: batch_index,
                    request_id,
                    handle,
                    table_environment_id: worker_table.environment_id(),
                    error,
                },
            ));
        }

        let peer_record_id = peer_table
            .get_root(peer_root)
            .expect("peer root survives worker thread teardown")
            .root_id();
        rows.push(
            NativeRootBridgeTransportWorkerThreadTeardownRow::active_root(
                "peer-root-active-after-worker-thread-teardown",
                "peer-environment-isolation",
                worker_thread_id,
                &peer_table,
                peer_root,
                peer_record_id,
            ),
        );

        (mismatched_teardown, matched_teardown, rows)
    }

    fn worker_thread_teardown_executable_preflight_rows(
        worker_thread_id: u64,
        worker_environment_id: BridgeEnvironmentId,
        peer_environment_id: BridgeEnvironmentId,
        records: &[NativeRootBridgeJsonTransportRecord],
    ) -> (
        BridgeEnvironmentTeardown,
        BridgeEnvironmentTeardown,
        bool,
        Vec<NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow>,
    ) {
        let mut worker_table = BridgeHandleTable::new(worker_environment_id);
        let mut validator = NativeRootBridgeRequestSequenceValidator::new();
        let mut root_handle_state = None;
        let mut root_handle = None;
        let mut root_id = None;
        let mut value_handles = Vec::new();

        for record in records.iter().copied() {
            let request = record
                .decode()
                .expect("worker-thread teardown preflight records decode");
            prevalidate_handoff_lifecycle(&validator, request)
                .expect("worker-thread teardown preflight lifecycle prevalidates");
            admit_js_native_root_bridge_handoff_record(
                &mut worker_table,
                request,
                root_handle_state,
            )
            .expect("worker-thread teardown preflight record admits into table");
            let validation_record = validator
                .validate_next(&worker_table, request)
                .expect("worker-thread teardown preflight record validates after admission");

            if root_handle.is_none() {
                root_handle = Some(request.root_handle());
                root_id = Some(request.root_id());
            }

            if let Some(value_handle) = request.value_handle() {
                value_handles.push((
                    match request.kind() {
                        NativeRootBridgeRequestKind::Create => {
                            "worker-create-value-stale-executable-preflight"
                        }
                        NativeRootBridgeRequestKind::Render => {
                            "worker-render-value-stale-executable-preflight"
                        }
                        NativeRootBridgeRequestKind::Unmount => {
                            "worker-unmount-value-stale-executable-preflight"
                        }
                    },
                    value_handle,
                ));
            }

            root_handle_state = Some(validation_record.root_handle_state());
        }

        let root_handle =
            root_handle.expect("worker-thread teardown preflight records contain create root");
        let root_id = root_id.expect("worker-thread teardown preflight records contain root id");
        let validator_root_handle_before_teardown = validator.root_handle();
        let validator_root_id_before_teardown = validator.root_id();
        let validator_last_request_id_before_teardown = validator.last_request_id();
        let validator_root_retired_before_teardown = validator.root_retired();

        let mut peer_table = BridgeHandleTable::new(peer_environment_id);
        let peer_root = peer_table.insert_root(PlaceholderRootRecord::new(176401));
        let peer_value = peer_table.insert_value(PlaceholderValueRecord::new(176402));
        let mismatched_teardown = peer_table.teardown_environment(worker_environment_id);
        let matched_teardown = worker_table.teardown_environment(worker_environment_id);

        let late_render = NativeRootBridgeRequestRecord::from_js_native_handoff_record(
            validator_last_request_id_before_teardown
                .expect("worker-thread teardown preflight records were validated")
                .saturating_add(1),
            NativeRootBridgeRequestKind::Render,
            worker_environment_id,
            root_handle,
            root_id,
            value_handles.last().map(|(_, handle)| *handle),
            NativeRootBridgeRootHandleState::Active,
        );
        let late_render_error = validator
            .validate_next(&worker_table, late_render)
            .expect_err("post-teardown render must reject the stale worker root handle");
        let root_validator_state_preserved = validator.root_handle()
            == validator_root_handle_before_teardown
            && validator.root_id() == validator_root_id_before_teardown
            && validator.last_request_id() == validator_last_request_id_before_teardown
            && validator.root_retired() == validator_root_retired_before_teardown;

        let mut rows = Vec::with_capacity(value_handles.len() + 3);
        let NativeRootBridgeRequestError::HandleTable(root_error) = &late_render_error else {
            panic!("post-teardown render rejection must come from the handle table");
        };
        rows.push(
            NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow::rejected(
                NativeRootBridgeWorkerThreadTeardownPreflightRejectedRowInit {
                    id: "worker-render-root-stale-executable-preflight",
                    operation: "post-teardown-render-boundary-validation",
                    assertion: "stale-worker-root-rejected-without-mutating-validator",
                    worker_thread_id,
                    handle: root_handle,
                    table_environment_id: worker_table.environment_id(),
                    error: root_error,
                    source_root_id: Some(root_id),
                },
            ),
        );

        for (id, handle) in value_handles {
            let error = worker_table
                .get_value(handle)
                .expect_err("worker value is stale after executable teardown preflight");
            rows.push(
                NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow::rejected(
                    NativeRootBridgeWorkerThreadTeardownPreflightRejectedRowInit {
                        id,
                        operation: "post-teardown-value-boundary-validation",
                        assertion: "stale-worker-value-rejected-after-worker-teardown",
                        worker_thread_id,
                        handle,
                        table_environment_id: worker_table.environment_id(),
                        error: &error,
                        source_root_id: Some(root_id),
                    },
                ),
            );
        }

        let peer_root_record_id = peer_table
            .get_root(peer_root)
            .expect("peer root survives worker-thread teardown preflight")
            .root_id();
        rows.push(
            NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow::active_peer(
                "peer-root-active-executable-preflight",
                "post-teardown-peer-root-validation",
                worker_thread_id,
                &peer_table,
                peer_root,
                peer_root_record_id,
            ),
        );
        let peer_value_record_id = peer_table
            .get_value(peer_value)
            .expect("peer value survives worker-thread teardown preflight")
            .value_id();
        rows.push(
            NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow::active_peer(
                "peer-value-active-executable-preflight",
                "post-teardown-peer-value-validation",
                worker_thread_id,
                &peer_table,
                peer_value,
                peer_value_record_id,
            ),
        );

        (
            mismatched_teardown,
            matched_teardown,
            root_validator_state_preserved,
            rows,
        )
    }

    fn worker_thread_cleanup_hook_preflight_evidence_rows(
        executable_preflight: &NativeRootBridgeWorkerThreadTeardownExecutablePreflight,
    ) -> Vec<NativeRootBridgeWorkerThreadCleanupHookEvidence> {
        let root_stale_row = executable_preflight_row(
            executable_preflight,
            NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_SOURCE_ROW_ID,
        );
        let value_stale_row = executable_preflight_row(
            executable_preflight,
            NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_SOURCE_ROW_ID,
        );

        vec![
            NativeRootBridgeWorkerThreadCleanupHookEvidence::from_executable_preflight_row(
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_EVIDENCE_ROW_ID,
                "cleanup-hook-order-preflight",
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_ID,
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_FUNCTION_IDENTITY_TOKEN,
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_ARGUMENT_IDENTITY_TOKEN,
                2,
                1,
                executable_preflight,
                root_stale_row,
            ),
            NativeRootBridgeWorkerThreadCleanupHookEvidence::from_executable_preflight_row(
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_EVIDENCE_ROW_ID,
                "cleanup-hook-order-preflight",
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_ID,
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_FUNCTION_IDENTITY_TOKEN,
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_ARGUMENT_IDENTITY_TOKEN,
                1,
                2,
                executable_preflight,
                value_stale_row,
            ),
            NativeRootBridgeWorkerThreadCleanupHookEvidence::new(
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_STALE_REJECTED_EVIDENCE_ROW_ID,
                "cleanup-hook-evidence-preflight-rejection",
                "stale-worker-transport-cleanup-hook",
                "private-cleanup-hook-fn:stale-worker-teardown",
                "private-cleanup-hook-arg:worker-524-root-slot-1",
                2,
                1,
                super::NATIVE_ROOT_BRIDGE_TRANSPORT_WORKER_THREAD_TEARDOWN_GATE_STATUS,
                524,
                BridgeEnvironmentId::from_raw(524),
                "worker-root-stale-after-thread-teardown",
                BridgeHandleKind::Root,
                Some("FAST_REACT_NAPI_STALE_HANDLE"),
                Some(super::NativeBoundaryErrorKind::RootBridgeStaleHandle.code()),
            ),
            NativeRootBridgeWorkerThreadCleanupHookEvidence::new(
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_FORGED_REJECTED_EVIDENCE_ROW_ID,
                "cleanup-hook-evidence-preflight-rejection",
                "forged-peer-active-cleanup-hook",
                "private-cleanup-hook-fn:forged-peer-active",
                "private-cleanup-hook-arg:worker-1764-peer-root",
                1,
                2,
                executable_preflight.status(),
                executable_preflight.worker_thread_id(),
                executable_preflight.worker_environment_id(),
                "peer-root-active-executable-preflight",
                BridgeHandleKind::Root,
                None,
                None,
            ),
        ]
    }

    fn executable_preflight_row(
        executable_preflight: &NativeRootBridgeWorkerThreadTeardownExecutablePreflight,
        id: &'static str,
    ) -> NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow {
        *executable_preflight
            .rows()
            .iter()
            .find(|row| row.id() == id)
            .expect("canonical executable preflight row exists")
    }

    fn cleanup_hook_expected_identity_for_executable_preflight_row(
        source_row: NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow,
    ) -> Option<NativeRootBridgeWorkerThreadCleanupHookExpectedIdentity> {
        match cleanup_hook_canonical_role_for_source(source_row.id(), source_row.handle_kind()) {
            Some(NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Root) => {
                Some(NativeRootBridgeWorkerThreadCleanupHookExpectedIdentity::root())
            }
            Some(NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Value) => {
                Some(NativeRootBridgeWorkerThreadCleanupHookExpectedIdentity::value())
            }
            None => None,
        }
    }

    fn cleanup_hook_canonical_role_for_source(
        source_row_id: &str,
        source_handle_kind: BridgeHandleKind,
    ) -> Option<NativeRootBridgeWorkerThreadCleanupHookCanonicalRole> {
        if source_row_id == NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_SOURCE_ROW_ID
            && source_handle_kind == BridgeHandleKind::Root
        {
            Some(NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Root)
        } else if source_row_id == NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_SOURCE_ROW_ID
            && source_handle_kind == BridgeHandleKind::Value
        {
            Some(NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Value)
        } else {
            None
        }
    }

    const fn cleanup_hook_source_provenance_token_for_role(
        role: NativeRootBridgeWorkerThreadCleanupHookCanonicalRole,
    ) -> &'static str {
        match role {
            NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Root => {
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_SOURCE_PROVENANCE_TOKEN
            }
            NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Value => {
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_SOURCE_PROVENANCE_TOKEN
            }
        }
    }

    fn cleanup_hook_source_provenance_token_for_executable_preflight_row(
        row: NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow,
    ) -> Option<&'static str> {
        cleanup_hook_canonical_role_for_source(row.id(), row.handle_kind())
            .map(cleanup_hook_source_provenance_token_for_role)
    }

    pub(crate) fn validate_native_root_bridge_worker_thread_cleanup_hook_evidence_for_preflight(
        executable_preflight: &NativeRootBridgeWorkerThreadTeardownExecutablePreflight,
        evidence: NativeRootBridgeWorkerThreadCleanupHookEvidence,
    ) -> NativeRootBridgeWorkerThreadCleanupHookPreflightRow {
        if evidence.preflight_row_status()
            == Some(NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Rejected)
        {
            return NativeRootBridgeWorkerThreadCleanupHookPreflightRow::rejected(
                evidence,
                evidence
                    .preflight_row_code()
                    .unwrap_or(NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_FORGED_EVIDENCE_CODE),
            );
        }

        if evidence.preflight_row_code().is_some() {
            return NativeRootBridgeWorkerThreadCleanupHookPreflightRow::rejected(
                evidence,
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_FORGED_EVIDENCE_CODE,
            );
        }

        if evidence.public_native_package_claimed() {
            return NativeRootBridgeWorkerThreadCleanupHookPreflightRow::rejected(
                evidence,
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PUBLIC_NATIVE_PACKAGE_CLAIM_CODE,
            );
        }

        if executable_preflight.status()
            != NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS
            || evidence.source_preflight_status()
                != NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS
            || evidence.source_worker_thread_id() != executable_preflight.worker_thread_id()
            || evidence.source_environment_id() != executable_preflight.worker_environment_id()
        {
            return NativeRootBridgeWorkerThreadCleanupHookPreflightRow::rejected(
                evidence,
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_STALE_EVIDENCE_CODE,
            );
        }

        let Some(source_row) = executable_preflight
            .rows()
            .iter()
            .find(|row| row.id() == evidence.source_row_id())
        else {
            return NativeRootBridgeWorkerThreadCleanupHookPreflightRow::rejected(
                evidence,
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_FORGED_EVIDENCE_CODE,
            );
        };

        if !cleanup_hook_evidence_matches_executable_preflight_source(evidence, *source_row) {
            return NativeRootBridgeWorkerThreadCleanupHookPreflightRow::rejected(
                evidence,
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_FORGED_EVIDENCE_CODE,
            );
        }

        if !source_row.preflight_passed()
            || !source_row.rejected_by_boundary()
            || source_row.worker_thread_id() != evidence.source_worker_thread_id()
            || source_row.table_environment_id() != evidence.source_environment_id()
            || source_row.handle_kind() != evidence.source_handle_kind()
            || source_row.source_error_code() != evidence.source_error_code()
            || source_row.boundary_error_code() != evidence.source_boundary_error_code()
            || source_row.source_error_code() != Some("FAST_REACT_NAPI_STALE_HANDLE")
            || source_row.boundary_error_code()
                != Some(super::NativeBoundaryErrorKind::RootBridgeStaleHandle.code())
        {
            return NativeRootBridgeWorkerThreadCleanupHookPreflightRow::rejected(
                evidence,
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_FORGED_EVIDENCE_CODE,
            );
        }

        if evidence.registration_order() == 0
            || evidence.registration_order() > NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_COUNT
            || evidence.expected_execution_order()
                != NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_COUNT + 1
                    - evidence.registration_order()
        {
            return NativeRootBridgeWorkerThreadCleanupHookPreflightRow::rejected(
                evidence,
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ORDER_MISMATCH_CODE,
            );
        }

        let Some(expected_identity) =
            cleanup_hook_expected_identity_for_executable_preflight_row(*source_row)
        else {
            return NativeRootBridgeWorkerThreadCleanupHookPreflightRow::rejected(
                evidence,
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_IDENTITY_MISMATCH_CODE,
            );
        };

        if !expected_identity.matches_evidence(evidence) {
            return NativeRootBridgeWorkerThreadCleanupHookPreflightRow::rejected(
                evidence,
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_IDENTITY_MISMATCH_CODE,
            );
        }

        if !expected_identity.matches_order(evidence) {
            return NativeRootBridgeWorkerThreadCleanupHookPreflightRow::rejected(
                evidence,
                NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ORDER_MISMATCH_CODE,
            );
        }

        NativeRootBridgeWorkerThreadCleanupHookPreflightRow::accepted(evidence)
    }

    fn cleanup_hook_evidence_matches_executable_preflight_source(
        evidence: NativeRootBridgeWorkerThreadCleanupHookEvidence,
        source_row: NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow,
    ) -> bool {
        evidence.source_handle_environment_id() == Some(source_row.handle_environment_id())
            && evidence.source_handle_slot() == Some(source_row.slot())
            && evidence.source_handle_generation() == Some(source_row.handle_generation())
            && evidence.source_current_generation() == source_row.current_generation()
            && evidence.source_record_id() == source_row.record_id()
            && evidence.source_root_id() == source_row.source_root_id()
            && evidence.source_provenance_token()
                == cleanup_hook_source_provenance_token_for_executable_preflight_row(source_row)
    }

    const fn current_generation_for_handle_table_error(
        error: &BridgeHandleTableError,
    ) -> Option<u64> {
        match error {
            BridgeHandleTableError::StaleHandle {
                current_generation, ..
            } => Some(*current_generation),
            _ => None,
        }
    }

    const fn boundary_error_code_for_handle_table_error(
        error: &BridgeHandleTableError,
    ) -> &'static str {
        match error {
            BridgeHandleTableError::WrongEnvironment { .. } => {
                super::NativeBoundaryErrorKind::RootBridgeWrongEnvironment.code()
            }
            BridgeHandleTableError::StaleHandle { .. }
            | BridgeHandleTableError::DisposedHandle { .. } => {
                super::NativeBoundaryErrorKind::RootBridgeStaleHandle.code()
            }
            _ => super::NativeBoundaryErrorKind::RootBridgeValidationFailed.code(),
        }
    }
