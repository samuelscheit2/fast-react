    fn consume_native_root_bridge_cleanup_generation_evidence(
        executor: &NativeRootBridgeJsonBatchLifecycleExecutor,
        candidate_rows: &[NativeRootBridgeJsonBatchLifecycleExecutorRow],
        cleanup_hook_preflight: &NativeRootBridgeWorkerThreadCleanupHookPreflight,
    ) -> Result<Vec<NativeRootBridgeCleanupGenerationConsumerRow>, &'static str> {
        let rows = validate_native_root_bridge_cleanup_generation_source_evidence(
            executor,
            candidate_rows,
            cleanup_hook_preflight,
        )?;
        let key = native_root_bridge_cleanup_generation_consumption_key(&rows)?;
        let consumed_generations = CONSUMED_NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_EVIDENCE
            .get_or_init(|| Mutex::new(HashSet::new()));
        let mut consumed_generations = consumed_generations
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        if consumed_generations.insert(key) {
            return Ok(rows);
        }

        Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_REPLAYED_EVIDENCE_CODE)
    }

    fn validate_native_root_bridge_cleanup_generation_source_evidence(
        executor: &NativeRootBridgeJsonBatchLifecycleExecutor,
        candidate_rows: &[NativeRootBridgeJsonBatchLifecycleExecutorRow],
        cleanup_hook_preflight: &NativeRootBridgeWorkerThreadCleanupHookPreflight,
    ) -> Result<Vec<NativeRootBridgeCleanupGenerationConsumerRow>, &'static str> {
        validate_native_root_bridge_json_batch_lifecycle_executor_source_rows(
            executor,
            candidate_rows,
        )
        .map_err(cleanup_generation_executor_source_error_code)?;

        if has_native_root_bridge_cleanup_hook_preflight_public_native_claim(cleanup_hook_preflight)
        {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE,
            );
        }

        if !cleanup_hook_preflight.canonical_executable_evidence_accepted() {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE,
            );
        }

        let rows = cleanup_hook_preflight
            .rows()
            .iter()
            .copied()
            .filter(|row| cleanup_hook_accepted_canonical_role(*row).is_some())
            .map(|cleanup_hook_row| {
                native_root_bridge_cleanup_generation_consumer_row_for_cleanup_hook(
                    executor,
                    candidate_rows,
                    cleanup_hook_row,
                )
            })
            .collect::<Result<Vec<_>, _>>()?;

        if !native_root_bridge_cleanup_generation_consumer_has_root_and_value_rows(&rows) {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE,
            );
        }

        Ok(rows)
    }

    fn cleanup_generation_executor_source_error_code(code: &'static str) -> &'static str {
        if code
            == NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE
        {
            NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE
        } else {
            code
        }
    }

    fn native_root_bridge_cleanup_generation_consumer_row_for_cleanup_hook(
        executor: &NativeRootBridgeJsonBatchLifecycleExecutor,
        candidate_rows: &[NativeRootBridgeJsonBatchLifecycleExecutorRow],
        cleanup_hook_row: NativeRootBridgeWorkerThreadCleanupHookPreflightRow,
    ) -> Result<NativeRootBridgeCleanupGenerationConsumerRow, &'static str> {
        let Some(role) = cleanup_hook_accepted_canonical_role(cleanup_hook_row) else {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE,
            );
        };
        let Some(source_handle_environment_id) = cleanup_hook_row.source_handle_environment_id()
        else {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE,
            );
        };
        let Some(source_handle_slot) = cleanup_hook_row.source_handle_slot() else {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE,
            );
        };
        let Some(source_handle_generation) = cleanup_hook_row.source_handle_generation() else {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE,
            );
        };
        let Some(cleanup_hook_source_current_generation) =
            cleanup_hook_row.source_current_generation()
        else {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE,
            );
        };
        let Some(cleanup_hook_source_root_id) = cleanup_hook_row.source_root_id() else {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE,
            );
        };

        if cleanup_hook_row.status()
            != NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Accepted
            || !cleanup_hook_row.canonical_executable_evidence()
            || !cleanup_hook_row.cleanup_hook_order_private()
            || !cleanup_hook_row.cleanup_hook_identity_private()
            || cleanup_hook_row.source_error_code() != Some("FAST_REACT_NAPI_STALE_HANDLE")
            || cleanup_hook_row.source_boundary_error_code()
                != Some(super::NativeBoundaryErrorKind::RootBridgeStaleHandle.code())
            || cleanup_hook_row.source_environment_id() != executor.environment_id()
            || source_handle_environment_id != executor.environment_id()
            || cleanup_hook_source_root_id != executor.root_id().unwrap_or_default()
            || cleanup_hook_row.source_provenance_token()
                != Some(cleanup_hook_source_provenance_token_for_role(role))
        {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE,
            );
        }

        let source_handle = BridgeHandle::new(
            source_handle_environment_id,
            source_handle_slot,
            source_handle_generation,
            cleanup_hook_row.source_handle_kind(),
        );
        let Some(executor_row) = native_root_bridge_cleanup_generation_matching_executor_row(
            candidate_rows,
            cleanup_hook_row,
            source_handle,
            cleanup_hook_source_root_id,
        ) else {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE,
            );
        };
        let Some(executor_handle_current_generation) =
            executor_current_generation_for_cleanup_hook_source(executor_row, source_handle)
        else {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE,
            );
        };
        let Some(expected_cleanup_current_generation) =
            executor_handle_current_generation.checked_add(1)
        else {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE,
            );
        };

        if cleanup_hook_source_current_generation != expected_cleanup_current_generation {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE,
            );
        }

        Ok(NativeRootBridgeCleanupGenerationConsumerRow::new(
            executor.executor_generation(),
            executor_row,
            cleanup_hook_row,
            source_handle,
            executor_handle_current_generation,
            cleanup_hook_source_current_generation,
        ))
    }

    fn native_root_bridge_cleanup_generation_matching_executor_row<'a>(
        candidate_rows: &'a [NativeRootBridgeJsonBatchLifecycleExecutorRow],
        cleanup_hook_row: NativeRootBridgeWorkerThreadCleanupHookPreflightRow,
        source_handle: BridgeHandle,
        cleanup_hook_source_root_id: u64,
    ) -> Option<&'a NativeRootBridgeJsonBatchLifecycleExecutorRow> {
        candidate_rows.iter().find(|row| {
            row.kind() == "render"
                && row.source_environment_id() == cleanup_hook_row.source_environment_id()
                && row.source_root_id() == cleanup_hook_source_root_id
                && cleanup_generation_executor_row_matches_source_handle(row, source_handle)
        })
    }

    fn cleanup_generation_executor_row_matches_source_handle(
        row: &NativeRootBridgeJsonBatchLifecycleExecutorRow,
        source_handle: BridgeHandle,
    ) -> bool {
        match source_handle.kind() {
            BridgeHandleKind::Root => row.source_root_handle() == source_handle,
            BridgeHandleKind::Value => row.source_value_handle() == Some(source_handle),
        }
    }

    fn executor_current_generation_for_cleanup_hook_source(
        row: &NativeRootBridgeJsonBatchLifecycleExecutorRow,
        source_handle: BridgeHandle,
    ) -> Option<u64> {
        match source_handle.kind() {
            BridgeHandleKind::Root => (row.source_root_handle() == source_handle)
                .then_some(row.root_handle_current_generation()),
            BridgeHandleKind::Value => (row.source_value_handle() == Some(source_handle))
                .then_some(row.value_handle_current_generation())
                .flatten(),
        }
    }

    fn native_root_bridge_cleanup_generation_consumer_has_root_and_value_rows(
        rows: &[NativeRootBridgeCleanupGenerationConsumerRow],
    ) -> bool {
        let root_count = rows
            .iter()
            .filter(|row| row.source_handle_kind() == BridgeHandleKind::Root)
            .count();
        let value_count = rows
            .iter()
            .filter(|row| row.source_handle_kind() == BridgeHandleKind::Value)
            .count();

        root_count == 1 && value_count == 1
    }

    fn native_root_bridge_cleanup_generation_consumption_key(
        rows: &[NativeRootBridgeCleanupGenerationConsumerRow],
    ) -> Result<NativeRootBridgeCleanupGenerationConsumptionKey, &'static str> {
        let Some(root_row) = rows
            .iter()
            .find(|row| row.source_handle_kind() == BridgeHandleKind::Root)
        else {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE,
            );
        };
        let Some(value_row) = rows
            .iter()
            .find(|row| row.source_handle_kind() == BridgeHandleKind::Value)
        else {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE,
            );
        };

        if root_row.executor_generation() != value_row.executor_generation()
            || root_row.source_environment_id() != value_row.source_environment_id()
            || root_row.source_root_handle() != value_row.source_root_handle()
            || root_row.source_root_id() != value_row.source_root_id()
            || root_row.cleanup_hook_source_worker_thread_id() == 0
            || value_row.cleanup_hook_source_worker_thread_id() == 0
            || root_row.cleanup_hook_source_worker_thread_id()
                != value_row.cleanup_hook_source_worker_thread_id()
            || root_row.cleanup_hook_source_environment_id().is_none()
            || value_row.cleanup_hook_source_environment_id().is_none()
            || root_row.cleanup_hook_source_environment_id()
                != value_row.cleanup_hook_source_environment_id()
            || root_row.cleanup_hook_source_provenance_token()
                != Some(NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_SOURCE_PROVENANCE_TOKEN)
            || value_row.cleanup_hook_source_provenance_token()
                != Some(NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_SOURCE_PROVENANCE_TOKEN)
        {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE,
            );
        }

        Ok(NativeRootBridgeCleanupGenerationConsumptionKey {
            executor_generation: root_row.executor_generation(),
            source_environment_id: root_row.source_environment_id(),
            source_root_handle: root_row.source_root_handle(),
            source_root_id: root_row.source_root_id(),
            cleanup_hook_source_worker_thread_id: root_row.cleanup_hook_source_worker_thread_id(),
            cleanup_hook_source_environment_id: root_row.cleanup_hook_source_environment_id(),
            root_cleanup_hook_evidence_row_id: root_row.cleanup_hook_evidence_row_id(),
            root_cleanup_hook_source_row_id: root_row.cleanup_hook_source_row_id(),
            root_cleanup_hook_source_provenance_token: root_row
                .cleanup_hook_source_provenance_token(),
            root_handle_current_generation: root_row.executor_handle_current_generation(),
            root_cleanup_current_generation: root_row.cleanup_hook_source_current_generation(),
            value_cleanup_hook_evidence_row_id: value_row.cleanup_hook_evidence_row_id(),
            value_cleanup_hook_source_row_id: value_row.cleanup_hook_source_row_id(),
            value_cleanup_hook_source_provenance_token: value_row
                .cleanup_hook_source_provenance_token(),
            source_value_handle: value_row.source_handle(),
            value_handle_current_generation: value_row.executor_handle_current_generation(),
            value_cleanup_current_generation: value_row.cleanup_hook_source_current_generation(),
        })
    }

    #[cfg(test)]
    fn validate_native_root_bridge_cleanup_generation_currentness_rows(
        current_lifecycle_consumer: &NativeRootBridgeBatchLifecycleConsumer,
        cleanup_generation_consumer: &NativeRootBridgeCleanupGenerationConsumer,
        cleanup_hook_preflight: &NativeRootBridgeWorkerThreadCleanupHookPreflight,
        cleanup_handoff_rows: &[NativeRootBridgeCleanupGenerationConsumerRow],
    ) -> Result<Vec<NativeRootBridgeCleanupGenerationCurrentnessCanaryRow>, &'static str> {
        if has_native_root_bridge_cleanup_generation_currentness_public_native_claim(
            current_lifecycle_consumer,
            cleanup_generation_consumer,
            cleanup_hook_preflight,
            cleanup_handoff_rows,
        ) {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE,
            );
        }

        if !native_root_bridge_cleanup_generation_currentness_cleanup_hook_identity_current(
            cleanup_hook_preflight,
        ) {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_MISSING_CLEANUP_HOOK_IDENTITY_CODE,
            );
        }

        if !cleanup_generation_consumer.cleanup_generation_consumed()
            || cleanup_generation_consumer
                .cleanup_generation_error_code()
                .is_some()
            || !cleanup_generation_consumer.source_rows_validated()
            || !cleanup_generation_consumer.cleanup_hook_preflight_accepted()
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REPLAYED_OR_RETIRED_CODE);
        }

        if !current_lifecycle_consumer.json_batch_lifecycle_executor_source_rows_validated()
            || !current_lifecycle_consumer.json_batch_lifecycle_executor_replay_guard_consumed()
            || current_lifecycle_consumer
                .json_batch_lifecycle_executor_source_error_code()
                .is_some()
            || current_lifecycle_consumer.consumed_batch_record_count() == 0
            || current_lifecycle_consumer.accepted_batch_record_count()
                != current_lifecycle_consumer.consumed_batch_record_count()
            || !current_lifecycle_consumer.cleanup_hook_callable_preflight_accepted()
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE);
        }

        if current_lifecycle_consumer.json_batch_lifecycle_executor_generation()
            != cleanup_generation_consumer.executor_generation()
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_GENERATION_CODE);
        }

        if current_lifecycle_consumer.rows().iter().any(|row| {
            row.root_handle_state_after() == NativeRootBridgeRootHandleState::Retired
                || row.retired_root_source_error_code().is_some()
        }) {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_AFTER_RETIRE_CODE,
            );
        }

        if cleanup_handoff_rows.len()
            != cleanup_generation_consumer.consumed_cleanup_generation_count()
            || cleanup_handoff_rows.len() != cleanup_generation_consumer.rows().len()
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_FORGED_CLEANUP_ROW_CODE);
        }

        let Some(current_render_row) = native_root_bridge_cleanup_generation_currentness_render_row(
            current_lifecycle_consumer,
        ) else {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE);
        };

        let mut row_ids = HashSet::new();
        let mut saw_root = false;
        let mut saw_value = false;
        let mut rows = Vec::with_capacity(cleanup_handoff_rows.len());

        for cleanup_row in cleanup_handoff_rows {
            if !row_ids.insert(cleanup_row.id()) {
                return Err(
                    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_FORGED_CLEANUP_ROW_CODE,
                );
            }

            match cleanup_row.source_handle_kind() {
                BridgeHandleKind::Root => {
                    if saw_root {
                        return Err(
                            NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_FORGED_CLEANUP_ROW_CODE,
                        );
                    }
                    saw_root = true;
                }
                BridgeHandleKind::Value => {
                    if saw_value {
                        return Err(
                            NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_FORGED_CLEANUP_ROW_CODE,
                        );
                    }
                    saw_value = true;
                }
            }

            rows.push(
                native_root_bridge_cleanup_generation_currentness_row_for_handoff(
                    current_lifecycle_consumer,
                    current_render_row,
                    cleanup_hook_preflight,
                    cleanup_row,
                )?,
            );
        }

        if !saw_root || !saw_value {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_FORGED_CLEANUP_ROW_CODE);
        }

        let guard_key = native_root_bridge_cleanup_generation_currentness_reentry_guard_key(
            current_lifecycle_consumer,
            cleanup_generation_consumer,
            cleanup_hook_preflight,
            current_render_row,
            &rows,
        )?;
        consume_native_root_bridge_cleanup_generation_currentness_reentry_guard(guard_key)?;
        let rows = rows
            .into_iter()
            .map(
                NativeRootBridgeCleanupGenerationCurrentnessCanaryRow::with_cleanup_reentry_guard_consumed,
            )
            .collect();

        Ok(rows)
    }

    #[cfg(test)]
    fn native_root_bridge_cleanup_generation_currentness_reentry_guard_key(
        current_lifecycle_consumer: &NativeRootBridgeBatchLifecycleConsumer,
        cleanup_generation_consumer: &NativeRootBridgeCleanupGenerationConsumer,
        cleanup_hook_preflight: &NativeRootBridgeWorkerThreadCleanupHookPreflight,
        current_render_row: &NativeRootBridgeBatchLifecycleConsumerRow,
        rows: &[NativeRootBridgeCleanupGenerationCurrentnessCanaryRow],
    ) -> Result<NativeRootBridgeCleanupGenerationCurrentnessReentryGuardKey, &'static str> {
        if cleanup_hook_preflight.worker_thread_id() == 0
            || cleanup_hook_preflight.worker_environment_id().is_none()
        {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_MISSING_CLEANUP_HOOK_IDENTITY_CODE,
            );
        }

        let lifecycle_transition = current_render_row
            .lifecycle_transition()
            .ok_or(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE)?;
        let root_handle_state_before = current_render_row
            .root_handle_state_before()
            .ok_or(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_AFTER_RETIRE_CODE)?;
        let root_handle_state_after = current_render_row.root_handle_state_after();

        if lifecycle_transition != NativeRootBridgeLifecycleTransition::ActiveToActive
            || root_handle_state_before != NativeRootBridgeRootHandleState::Active
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE);
        }

        if root_handle_state_after != NativeRootBridgeRootHandleState::Active
            || current_lifecycle_consumer.rows().iter().any(|row| {
                row.root_handle_state_after() == NativeRootBridgeRootHandleState::Retired
                    || row.retired_root_source_error_code().is_some()
            })
        {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_AFTER_RETIRE_CODE,
            );
        }

        let Some(root_row) = rows
            .iter()
            .find(|row| row.source_handle_kind() == BridgeHandleKind::Root)
        else {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_FORGED_CLEANUP_ROW_CODE);
        };
        let Some(value_row) = rows
            .iter()
            .find(|row| row.source_handle_kind() == BridgeHandleKind::Value)
        else {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_FORGED_CLEANUP_ROW_CODE);
        };

        if root_row.cleanup_hook_source_worker_thread_id() == 0
            || value_row.cleanup_hook_source_worker_thread_id() == 0
            || root_row.cleanup_hook_source_environment_id().is_none()
            || value_row.cleanup_hook_source_environment_id().is_none()
        {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_MISSING_CLEANUP_HOOK_IDENTITY_CODE,
            );
        }

        if root_row.cleanup_hook_source_worker_thread_id()
            != value_row.cleanup_hook_source_worker_thread_id()
            || root_row.cleanup_hook_source_worker_thread_id()
                != cleanup_hook_preflight.worker_thread_id()
            || root_row.cleanup_hook_source_environment_id()
                != value_row.cleanup_hook_source_environment_id()
            || root_row.cleanup_hook_source_environment_id()
                != cleanup_hook_preflight.worker_environment_id()
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CROSS_WORKER_THREAD_CODE);
        }

        if !root_row.source_owned_cleanup_handoff()
            || !value_row.source_owned_cleanup_handoff()
            || !root_row.source_currentness_monotonic()
            || !value_row.source_currentness_monotonic()
        {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CALLER_BUILT_METADATA_CODE,
            );
        }

        if root_row.current_executor_generation()
            != current_lifecycle_consumer.json_batch_lifecycle_executor_generation()
            || value_row.current_executor_generation()
                != current_lifecycle_consumer.json_batch_lifecycle_executor_generation()
            || root_row.cleanup_executor_generation()
                != cleanup_generation_consumer.executor_generation()
            || value_row.cleanup_executor_generation()
                != cleanup_generation_consumer.executor_generation()
            || root_row.current_executor_generation() != root_row.cleanup_executor_generation()
            || value_row.current_executor_generation() != value_row.cleanup_executor_generation()
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_GENERATION_CODE);
        }

        if root_row.source_environment_id() != value_row.source_environment_id()
            || root_row.source_environment_id()
                != current_render_row.source_environment_id().ok_or(
                    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE,
                )?
            || root_row.source_root_handle() != value_row.source_root_handle()
            || root_row.source_root_handle()
                != current_render_row.source_root_handle().ok_or(
                    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE,
                )?
            || root_row.source_root_id() != value_row.source_root_id()
            || root_row.source_root_id()
                != current_render_row.source_root_id().ok_or(
                    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE,
                )?
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE);
        }

        if root_row.lifecycle_consumer_row_id() != value_row.lifecycle_consumer_row_id()
            || root_row.lifecycle_consumer_row_id() != current_render_row.id()
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE);
        }

        if root_row.cleanup_hook_evidence_row_id()
            != NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_EVIDENCE_ROW_ID
            || root_row.cleanup_hook_source_row_id()
                != NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_SOURCE_ROW_ID
            || value_row.cleanup_hook_evidence_row_id()
                != NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_EVIDENCE_ROW_ID
            || value_row.cleanup_hook_source_row_id()
                != NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_SOURCE_ROW_ID
            || root_row.cleanup_hook_source_provenance_token()
                != Some(NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_SOURCE_PROVENANCE_TOKEN)
            || value_row.cleanup_hook_source_provenance_token()
                != Some(NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_SOURCE_PROVENANCE_TOKEN)
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_FORGED_CLEANUP_ROW_CODE);
        }

        if root_row.handle_table_current_generation()
            != current_render_row.root_handle_current_generation()
            || value_row.handle_table_current_generation()
                != current_render_row.value_handle_current_generation().ok_or(
                    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE,
                )?
            || root_row.cleanup_current_generation()
                != root_row
                    .handle_table_current_generation()
                    .checked_add(1)
                    .ok_or(
                        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE,
                    )?
            || value_row.cleanup_current_generation()
                != value_row
                    .handle_table_current_generation()
                    .checked_add(1)
                    .ok_or(
                        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE,
                    )?
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE);
        }

        Ok(
            NativeRootBridgeCleanupGenerationCurrentnessReentryGuardKey {
                current_executor_generation: current_lifecycle_consumer
                    .json_batch_lifecycle_executor_generation(),
                cleanup_executor_generation: cleanup_generation_consumer.executor_generation(),
                lifecycle_consumer_row_id: current_render_row.id().to_owned(),
                source_environment_id: root_row.source_environment_id(),
                source_root_handle: root_row.source_root_handle(),
                source_root_id: root_row.source_root_id(),
                root_cleanup_handoff_row_id: root_row.cleanup_handoff_row_id().to_owned(),
                root_cleanup_hook_evidence_row_id: root_row.cleanup_hook_evidence_row_id(),
                root_cleanup_hook_source_row_id: root_row.cleanup_hook_source_row_id(),
                root_cleanup_hook_source_provenance_token: root_row
                    .cleanup_hook_source_provenance_token(),
                source_value_handle: value_row.source_handle(),
                value_cleanup_handoff_row_id: value_row.cleanup_handoff_row_id().to_owned(),
                value_cleanup_hook_evidence_row_id: value_row.cleanup_hook_evidence_row_id(),
                value_cleanup_hook_source_row_id: value_row.cleanup_hook_source_row_id(),
                value_cleanup_hook_source_provenance_token: value_row
                    .cleanup_hook_source_provenance_token(),
                cleanup_hook_source_worker_thread_id: root_row
                    .cleanup_hook_source_worker_thread_id(),
                cleanup_hook_source_environment_id: root_row.cleanup_hook_source_environment_id(),
                lifecycle_transition,
                root_handle_state_before,
                root_handle_state_after,
                root_handle_current_generation: root_row.handle_table_current_generation(),
                value_handle_current_generation: value_row.handle_table_current_generation(),
                root_cleanup_current_generation: root_row.cleanup_current_generation(),
                value_cleanup_current_generation: value_row.cleanup_current_generation(),
            },
        )
    }

    #[cfg(test)]
    fn consume_native_root_bridge_cleanup_generation_currentness_reentry_guard(
        guard_key: NativeRootBridgeCleanupGenerationCurrentnessReentryGuardKey,
    ) -> Result<(), &'static str> {
        let consumed_guards =
            CONSUMED_NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_GUARDS
                .get_or_init(|| Mutex::new(HashSet::new()));
        let mut consumed_guards = consumed_guards
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        if consumed_guards.insert(guard_key) {
            return Ok(());
        }

        Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_DUPLICATE_CLEANUP_CODE)
    }

    #[cfg(test)]
    fn native_root_bridge_cleanup_generation_currentness_row_for_handoff(
        current_lifecycle_consumer: &NativeRootBridgeBatchLifecycleConsumer,
        current_render_row: &NativeRootBridgeBatchLifecycleConsumerRow,
        cleanup_hook_preflight: &NativeRootBridgeWorkerThreadCleanupHookPreflight,
        cleanup_row: &NativeRootBridgeCleanupGenerationConsumerRow,
    ) -> Result<NativeRootBridgeCleanupGenerationCurrentnessCanaryRow, &'static str> {
        if !cleanup_row.source_owned_executor_row() {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CALLER_BUILT_METADATA_CODE,
            );
        }

        let expected_lifecycle_row_id = format!(
            "batch-lifecycle-consumer-{}-{}",
            current_render_row.batch_index(),
            current_render_row.kind()
        );
        let expected_cleanup_handoff_row_id = format!(
            "cleanup-generation-consumer-{}-{}",
            cleanup_row.batch_index(),
            bridge_handle_kind_code(cleanup_row.source_handle_kind())
        );
        let expected_executor_row_id = format!(
            "json-batch-lifecycle-executor-{}-{}",
            cleanup_row.batch_index(),
            cleanup_row.kind()
        );

        if current_render_row.id() != expected_lifecycle_row_id.as_str()
            || cleanup_row.id() != expected_cleanup_handoff_row_id.as_str()
            || cleanup_row.executor_row_id() != expected_executor_row_id.as_str()
        {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CALLER_BUILT_METADATA_CODE,
            );
        }

        if !cleanup_row.cleanup_hook_identity_private() {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_MISSING_CLEANUP_HOOK_IDENTITY_CODE,
            );
        }

        if !cleanup_row.cleanup_hook_order_private() || !cleanup_row.canonical_executable_evidence()
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_FORGED_CLEANUP_ROW_CODE);
        }

        if cleanup_hook_preflight.worker_thread_id() == 0
            || cleanup_hook_preflight.worker_environment_id().is_none()
            || cleanup_row.cleanup_hook_source_worker_thread_id() == 0
            || cleanup_row.cleanup_hook_source_environment_id().is_none()
        {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_MISSING_CLEANUP_HOOK_IDENTITY_CODE,
            );
        }

        if cleanup_row.cleanup_hook_source_worker_thread_id()
            != cleanup_hook_preflight.worker_thread_id()
            || cleanup_row.cleanup_hook_source_environment_id()
                != cleanup_hook_preflight.worker_environment_id()
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CROSS_WORKER_THREAD_CODE);
        }

        if cleanup_row.executor_generation()
            != current_lifecycle_consumer.json_batch_lifecycle_executor_generation()
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_GENERATION_CODE);
        }

        let (Some(source_environment_id), Some(source_root_handle), Some(source_root_id)) = (
            current_render_row.source_environment_id(),
            current_render_row.source_root_handle(),
            current_render_row.source_root_id(),
        ) else {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE);
        };

        if cleanup_row.batch_index() != current_render_row.batch_index()
            || cleanup_row.request_id() != current_render_row.request_id()
            || cleanup_row.kind() != current_render_row.kind()
            || cleanup_row.source_environment_id() != source_environment_id
            || cleanup_row.source_root_handle() != source_root_handle
            || cleanup_row.source_root_id() != source_root_id
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE);
        }

        let role = match cleanup_row.source_handle_kind() {
            BridgeHandleKind::Root => NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Root,
            BridgeHandleKind::Value => NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Value,
        };
        let Some(cleanup_hook_row) =
            native_root_bridge_cleanup_generation_currentness_preflight_row_for_role(
                cleanup_hook_preflight,
                role,
            )
        else {
            return Err(
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_MISSING_CLEANUP_HOOK_IDENTITY_CODE,
            );
        };

        if cleanup_hook_row.source_worker_thread_id()
            != cleanup_row.cleanup_hook_source_worker_thread_id()
            || cleanup_hook_row.source_environment_id()
                != cleanup_row.cleanup_hook_source_environment_id()
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CROSS_WORKER_THREAD_CODE);
        }

        if cleanup_row.cleanup_hook_evidence_row_id() != cleanup_hook_row.id()
            || cleanup_row.cleanup_hook_source_row_id() != cleanup_hook_row.source_row_id()
            || cleanup_row.cleanup_hook_source_provenance_token()
                != cleanup_hook_row.source_provenance_token()
            || cleanup_row.cleanup_hook_source_provenance_token()
                != Some(cleanup_hook_source_provenance_token_for_role(role))
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_FORGED_CLEANUP_ROW_CODE);
        }

        native_root_bridge_cleanup_generation_currentness_validate_handle_fields(
            current_render_row,
            cleanup_row,
            cleanup_hook_row,
        )?;

        Ok(NativeRootBridgeCleanupGenerationCurrentnessCanaryRow::new(
            current_render_row,
            cleanup_row,
            cleanup_hook_row,
            current_lifecycle_consumer.json_batch_lifecycle_executor_generation(),
        ))
    }

    #[cfg(test)]
    fn native_root_bridge_cleanup_generation_currentness_validate_handle_fields(
        current_render_row: &NativeRootBridgeBatchLifecycleConsumerRow,
        cleanup_row: &NativeRootBridgeCleanupGenerationConsumerRow,
        cleanup_hook_row: NativeRootBridgeWorkerThreadCleanupHookPreflightRow,
    ) -> Result<(), &'static str> {
        let expected_current_generation = match cleanup_row.source_handle_kind() {
            BridgeHandleKind::Root => current_render_row.root_handle_current_generation(),
            BridgeHandleKind::Value => current_render_row
                .value_handle_current_generation()
                .ok_or(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE)?,
        };
        let expected_cleanup_generation = expected_current_generation
            .checked_add(1)
            .ok_or(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE)?;

        if cleanup_row.executor_handle_current_generation() != expected_current_generation
            || cleanup_row.cleanup_hook_source_current_generation() != expected_cleanup_generation
            || cleanup_hook_row.source_current_generation() != Some(expected_cleanup_generation)
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE);
        }

        let expected_source_handle =
            match cleanup_row.source_handle_kind() {
                BridgeHandleKind::Root => current_render_row.source_root_handle().ok_or(
                    NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE,
                )?,
                BridgeHandleKind::Value => {
                    if current_render_row.cleanup_hook_evidence_status()
                        != NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Accepted
                            .code()
                        || current_render_row.cleanup_hook_evidence_row_id()
                            != Some(cleanup_hook_row.id())
                        || current_render_row.cleanup_hook_source_row_id()
                            != Some(cleanup_hook_row.source_row_id())
                        || current_render_row.cleanup_hook_source_handle_kind()
                            != Some(BridgeHandleKind::Value)
                        || current_render_row.cleanup_hook_canonical_executable_evidence()
                            != Some(true)
                    {
                        return Err(
                            NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE,
                        );
                    }

                    BridgeHandle::new(
                    current_render_row.cleanup_hook_source_handle_environment_id().ok_or(
                        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE,
                    )?,
                    current_render_row.cleanup_hook_source_handle_slot().ok_or(
                        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE,
                    )?,
                    current_render_row.cleanup_hook_source_handle_generation().ok_or(
                        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE,
                    )?,
                    BridgeHandleKind::Value,
                )
                }
            };

        if cleanup_row.source_handle() != expected_source_handle
            || cleanup_hook_row.source_handle_environment_id()
                != Some(cleanup_row.source_handle().environment_id())
            || cleanup_hook_row.source_handle_slot() != Some(cleanup_row.source_handle().slot())
            || cleanup_hook_row.source_handle_generation()
                != Some(cleanup_row.source_handle().generation())
        {
            return Err(NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE);
        }

        Ok(())
    }

    #[cfg(test)]
    fn native_root_bridge_cleanup_generation_currentness_render_row(
        current_lifecycle_consumer: &NativeRootBridgeBatchLifecycleConsumer,
    ) -> Option<&NativeRootBridgeBatchLifecycleConsumerRow> {
        current_lifecycle_consumer.rows().iter().find(|row| {
            row.kind() == NativeRootBridgeRequestKind::Render.code()
                && row.status() == NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted
                && row.lifecycle_transition()
                    == Some(NativeRootBridgeLifecycleTransition::ActiveToActive)
        })
    }

    #[cfg(test)]
    fn native_root_bridge_cleanup_generation_currentness_preflight_row_for_role(
        cleanup_hook_preflight: &NativeRootBridgeWorkerThreadCleanupHookPreflight,
        role: NativeRootBridgeWorkerThreadCleanupHookCanonicalRole,
    ) -> Option<NativeRootBridgeWorkerThreadCleanupHookPreflightRow> {
        cleanup_hook_preflight.rows().iter().copied().find(|row| {
            cleanup_hook_accepted_canonical_role(*row) == Some(role)
                && native_root_bridge_cleanup_generation_currentness_cleanup_hook_row_identity_current(
                    *row,
                )
        })
    }

    #[cfg(test)]
    fn native_root_bridge_cleanup_generation_currentness_cleanup_hook_identity_current(
        cleanup_hook_preflight: &NativeRootBridgeWorkerThreadCleanupHookPreflight,
    ) -> bool {
        cleanup_hook_preflight.canonical_executable_evidence_accepted()
            && cleanup_hook_preflight.accepted_cleanup_evidence_count()
                == usize::from(NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_COUNT)
            && cleanup_hook_preflight.cleanup_hook_order_private()
            && cleanup_hook_preflight.cleanup_hook_identity_private()
            && native_root_bridge_cleanup_generation_currentness_preflight_row_for_role(
                cleanup_hook_preflight,
                NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Root,
            )
            .is_some()
            && native_root_bridge_cleanup_generation_currentness_preflight_row_for_role(
                cleanup_hook_preflight,
                NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Value,
            )
            .is_some()
    }

    #[cfg(test)]
    fn native_root_bridge_cleanup_generation_currentness_cleanup_hook_row_identity_current(
        row: NativeRootBridgeWorkerThreadCleanupHookPreflightRow,
    ) -> bool {
        if !row.cleanup_hook_order_private() || !row.cleanup_hook_identity_private() {
            return false;
        }

        let Some(role) = cleanup_hook_accepted_canonical_role(row) else {
            return false;
        };
        let expected_identity = match role {
            NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Root => {
                NativeRootBridgeWorkerThreadCleanupHookExpectedIdentity::root()
            }
            NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Value => {
                NativeRootBridgeWorkerThreadCleanupHookExpectedIdentity::value()
            }
        };
        let evidence = NativeRootBridgeWorkerThreadCleanupHookEvidence::from_preflight_row(row);

        expected_identity.matches_evidence(evidence)
            && expected_identity.matches_order(evidence)
            && row.source_provenance_token()
                == Some(cleanup_hook_source_provenance_token_for_role(role))
    }

    #[cfg(test)]
    fn has_native_root_bridge_cleanup_generation_currentness_public_native_claim(
        current_lifecycle_consumer: &NativeRootBridgeBatchLifecycleConsumer,
        cleanup_generation_consumer: &NativeRootBridgeCleanupGenerationConsumer,
        cleanup_hook_preflight: &NativeRootBridgeWorkerThreadCleanupHookPreflight,
        cleanup_handoff_rows: &[NativeRootBridgeCleanupGenerationConsumerRow],
    ) -> bool {
        current_lifecycle_consumer.node_worker_threads_execution()
            || current_lifecycle_consumer.napi_cleanup_hook_execution()
            || current_lifecycle_consumer.native_addon_loaded()
            || current_lifecycle_consumer.native_execution()
            || current_lifecycle_consumer.renderer_execution()
            || current_lifecycle_consumer.reconciler_execution()
            || current_lifecycle_consumer.public_native_compatibility()
            || current_lifecycle_consumer.react_behavior_error()
            || current_lifecycle_consumer
                .rows()
                .iter()
                .any(has_native_root_bridge_batch_lifecycle_consumer_public_native_claim)
            || cleanup_generation_consumer.node_worker_threads_execution()
            || cleanup_generation_consumer.napi_cleanup_hook_execution()
            || cleanup_generation_consumer.native_addon_loaded()
            || cleanup_generation_consumer.native_execution()
            || cleanup_generation_consumer.renderer_execution()
            || cleanup_generation_consumer.reconciler_execution()
            || cleanup_generation_consumer.public_native_compatibility()
            || cleanup_generation_consumer.react_behavior_error()
            || cleanup_generation_consumer
                .rows()
                .iter()
                .any(has_native_root_bridge_cleanup_generation_consumer_row_public_native_claim)
            || has_native_root_bridge_cleanup_hook_preflight_public_native_claim(
                cleanup_hook_preflight,
            )
            || cleanup_handoff_rows
                .iter()
                .any(has_native_root_bridge_cleanup_generation_consumer_row_public_native_claim)
    }

    #[cfg(test)]
    fn has_native_root_bridge_cleanup_generation_consumer_row_public_native_claim(
        row: &NativeRootBridgeCleanupGenerationConsumerRow,
    ) -> bool {
        row.node_worker_threads_execution()
            || row.napi_cleanup_hook_execution()
            || row.native_addon_loaded()
            || row.native_execution()
            || row.renderer_execution()
            || row.reconciler_execution()
            || row.public_native_compatibility()
            || row.react_behavior_error()
    }
