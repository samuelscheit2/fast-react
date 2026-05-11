    fn allocate_native_root_bridge_json_batch_lifecycle_executor_generation()
    -> Result<u64, NativeRootBridgeRequestError> {
        NEXT_NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_GENERATION
            .fetch_update(Ordering::Relaxed, Ordering::Relaxed, |generation| {
                generation.checked_add(1)
            })
            .map_err(|_| NativeRootBridgeRequestError::ExecutorGenerationExhausted)
    }

    fn validate_executor_value_handle_not_reused(
        consumed_value_handles: &mut HashSet<BridgeHandle>,
        request: NativeRootBridgeRequestRecord,
    ) -> Result<(), NativeRootBridgeRequestError> {
        let Some(value_handle) = request.value_handle() else {
            return Ok(());
        };

        if consumed_value_handles.insert(value_handle) {
            return Ok(());
        }

        Err(NativeRootBridgeRequestError::ReusedValueHandle { value_handle })
    }

    fn execute_native_root_bridge_json_batch_lifecycle_requests(
        requests: &[NativeRootBridgeRequestRecord],
    ) -> Result<NativeRootBridgeJsonBatchLifecycleExecutor, NativeRootBridgeRequestError> {
        let executor_generation =
            allocate_native_root_bridge_json_batch_lifecycle_executor_generation()?;
        let environment_id = requests
            .first()
            .map_or(BridgeEnvironmentId::NONE, |request| {
                request.environment_id()
            });
        let mut table = BridgeHandleTable::new(environment_id);
        let mut validator = NativeRootBridgeRequestSequenceValidator::new();
        let mut admission_records = Vec::with_capacity(requests.len());
        let mut validation_records = Vec::with_capacity(requests.len());
        let mut root_handle_state = None;
        let mut rows = Vec::with_capacity(requests.len());
        let mut consumed_value_handles = HashSet::new();

        for (batch_index, request) in requests.iter().copied().enumerate() {
            let lifecycle_before = lifecycle_state_for_root_handle_state(root_handle_state);
            prevalidate_handoff_lifecycle(&validator, request)?;
            validate_executor_value_handle_not_reused(&mut consumed_value_handles, request)?;
            let admission_record =
                admit_js_native_root_bridge_handoff_record(&mut table, request, root_handle_state)?;
            let validation_record = validator.validate_next(&table, request)?;
            let lifecycle_after =
                lifecycle_state_for_root_handle_state(Some(validation_record.root_handle_state()));

            root_handle_state = Some(validation_record.root_handle_state());
            rows.push(NativeRootBridgeJsonBatchLifecycleExecutorRow::applied(
                executor_generation,
                batch_index,
                request,
                lifecycle_before,
                lifecycle_after,
                admission_record,
                validation_record,
            ));
            admission_records.push(admission_record);
            validation_records.push(validation_record);
        }

        Ok(NativeRootBridgeJsonBatchLifecycleExecutor {
            status: NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STATUS,
            model: NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_MODEL,
            validation_model: super::NATIVE_ROOT_BRIDGE_REQUEST_VALIDATION_MODEL,
            handle_table_model: super::NATIVE_ROOT_BRIDGE_HANDLE_TABLE_MODEL,
            transport: super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_FORMAT,
            executor_generation,
            request_count: requests.len(),
            executed_row_count: rows.len(),
            environment_id,
            root_handle: validator.root_handle(),
            root_id: validator.root_id(),
            root_retired: validator.root_retired(),
            final_lifecycle_state: lifecycle_state_for_root_handle_state(root_handle_state),
            rows,
            admission_records,
            validation_records,
            source_owned_json_rows: true,
            rust_state_machine_execution: true,
            native_addon_loaded: false,
            native_execution: false,
            renderer_execution: false,
            reconciler_execution: false,
            public_native_compatibility: false,
            react_behavior_error: false,
        })
    }

    pub(crate) fn smoke_admit_js_native_root_bridge_json_transport_records(
        records: &[NativeRootBridgeJsonTransportRecord],
    ) -> Result<NativeRootBridgeHandleTableAdmissionSmoke, NativeRootBridgeRequestError> {
        Ok(
            native_root_bridge_json_batch_lifecycle_executor_for_records(records)?
                .handle_table_admission_smoke(),
        )
    }

    pub(crate) fn parse_native_root_bridge_json_transport_for_gate(
        json: &str,
    ) -> Result<NativeRootBridgeJsonTransportParserGate, NativeRootBridgeJsonTransportParseError>
    {
        let (envelope, json_batch_lifecycle_executor, admission_smoke) =
            parse_json_transport_payload_for_gate(json)?;

        Ok(NativeRootBridgeJsonTransportParserGate {
            transport: envelope.transport,
            schema_version: envelope.schema_version,
            batched_record_gate: native_root_bridge_batched_json_transport_gate(
                &envelope.request_records,
            ),
            request_records: envelope.request_records,
            admission_smoke,
            json_batch_lifecycle_executor,
            error_diagnostic_rows: native_root_bridge_json_transport_error_diagnostic_rows(),
            native_execution: false,
            renderer_execution: false,
            reconciler_execution: false,
        })
    }

    pub(crate) fn native_root_bridge_batched_json_transport_gate(
        records: &[NativeRootBridgeJsonTransportRecord],
    ) -> NativeRootBridgeBatchedJsonTransportGate {
        let lifecycle_rows = validate_batched_json_transport_lifecycle_rows(records);
        let error_rows = native_root_bridge_batched_json_transport_error_rows();
        let response_sequence_gate =
            native_root_bridge_batch_response_sequence_gate(&lifecycle_rows, &error_rows);

        NativeRootBridgeBatchedJsonTransportGate {
            status: super::NATIVE_ROOT_BRIDGE_BATCHED_JSON_TRANSPORT_GATE_STATUS,
            request_count: records.len(),
            lifecycle_rows,
            error_rows,
            response_sequence_gate,
            native_addon_loaded: false,
            native_execution: false,
            renderer_execution: false,
            reconciler_execution: false,
        }
    }

    pub(crate) fn native_root_bridge_batched_json_transport_error_rows()
    -> Vec<NativeRootBridgeBatchedJsonTransportLifecycleRow> {
        deterministic_batched_json_transport_diagnostic_cases()
            .iter()
            .copied()
            .map(|case| {
                let value = serde_json::from_str::<Value>(case.json)
                    .expect("deterministic batched JSON diagnostic payload parses");
                let envelope = parse_json_transport_envelope(&value)
                    .expect("deterministic batched JSON diagnostic payload has valid schema");
                validate_batched_json_transport_lifecycle_rows(&envelope.request_records)
                    .into_iter()
                    .find(|row| {
                        row.status() == NativeRootBridgeBatchedJsonTransportLifecycleStatus::Error
                    })
                    .filter(|row| row.code() == Some(case.expected_code))
                    .expect(
                        "deterministic batched JSON diagnostic payload produces expected error row",
                    )
                    .with_id(case.id)
            })
            .collect()
    }

    pub(crate) fn native_root_bridge_batch_response_sequence_gate(
        lifecycle_rows: &[NativeRootBridgeBatchedJsonTransportLifecycleRow],
        error_rows: &[NativeRootBridgeBatchedJsonTransportLifecycleRow],
    ) -> NativeRootBridgeBatchResponseSequenceGate {
        let rows = lifecycle_rows
            .iter()
            .enumerate()
            .map(|(response_order, row)| {
                NativeRootBridgeBatchResponseSequenceRow::from_lifecycle_row(response_order, row)
            })
            .collect::<Vec<_>>();
        let deterministic_error_rows = error_rows
            .iter()
            .enumerate()
            .map(|(response_order, row)| {
                NativeRootBridgeBatchResponseSequenceRow::from_deterministic_error_row(
                    response_order,
                    row,
                )
            })
            .collect::<Vec<_>>();
        let stream_roundtrip_gate =
            native_root_bridge_json_transport_stream_batch_roundtrip_gate(&rows);

        NativeRootBridgeBatchResponseSequenceGate {
            status: super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_GATE_STATUS,
            batch_id: super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID,
            request_count: lifecycle_rows.len(),
            response_count: rows.len(),
            error_row_count: deterministic_error_rows.len(),
            rows,
            error_rows: deterministic_error_rows,
            stream_roundtrip_gate,
            native_addon_loaded: false,
            native_execution: false,
            renderer_execution: false,
            reconciler_execution: false,
            react_behavior_error: false,
        }
    }

    pub(crate) fn native_root_bridge_json_transport_stream_batch_roundtrip_gate(
        response_rows: &[NativeRootBridgeBatchResponseSequenceRow],
    ) -> NativeRootBridgeJsonTransportStreamBatchRoundtripGate {
        let chunks = native_root_bridge_json_transport_stream_batch_roundtrip_chunks(response_rows);
        let rows =
            validate_native_root_bridge_json_transport_stream_batch_roundtrip_chunks(&chunks)
                .expect("deterministic native JSON stream batch roundtrip chunks are accepted");
        let error_rows =
            native_root_bridge_json_transport_stream_batch_roundtrip_error_rows(response_rows);

        NativeRootBridgeJsonTransportStreamBatchRoundtripGate {
            status: super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_GATE_STATUS,
            batch_id: super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID,
            stream_id: super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_STREAM_ID,
            request_count: response_rows.len(),
            chunk_count: rows.len(),
            assembled_response_count: rows.iter().filter(|row| row.assembled_response()).count(),
            error_row_count: error_rows.len(),
            rows,
            error_rows,
            native_addon_loaded: false,
            native_execution: false,
            renderer_execution: false,
            reconciler_execution: false,
            cross_environment_handle_reuse_blocked: true,
            public_native_compatibility: false,
            react_behavior_error: false,
        }
    }

    fn native_root_bridge_json_transport_stream_batch_roundtrip_chunks(
        response_rows: &[NativeRootBridgeBatchResponseSequenceRow],
    ) -> Vec<NativeRootBridgeJsonTransportStreamBatchRoundtripChunk> {
        response_rows
            .iter()
            .flat_map(|row| {
                [
                    native_root_bridge_json_transport_stream_batch_roundtrip_chunk(row, 0),
                    native_root_bridge_json_transport_stream_batch_roundtrip_chunk(row, 1),
                ]
            })
            .enumerate()
            .map(|(batch_sequence, mut chunk)| {
                chunk.batch_sequence = batch_sequence;
                chunk
            })
            .collect()
    }

    fn native_root_bridge_json_transport_stream_batch_roundtrip_chunk(
        row: &NativeRootBridgeBatchResponseSequenceRow,
        chunk_order: usize,
    ) -> NativeRootBridgeJsonTransportStreamBatchRoundtripChunk {
        let chunk_kind = if chunk_order == 0 {
            NativeRootBridgeJsonTransportStreamChunkKind::Metadata
        } else {
            NativeRootBridgeJsonTransportStreamChunkKind::Payload
        };
        let teardown_state = if row.kind() == NativeRootBridgeRequestKind::Unmount.code()
            && chunk_kind == NativeRootBridgeJsonTransportStreamChunkKind::Metadata
        {
            NativeRootBridgeBatchResponseTeardownState::Active
        } else {
            row.teardown_state()
        };

        NativeRootBridgeJsonTransportStreamBatchRoundtripChunk {
            request_id: row.request_id(),
            request_order: row.request_order(),
            response_order: row.response_order(),
            source_environment_id: row.source_environment_id(),
            source_root_handle: row.source_root_handle(),
            source_root_id: row.source_root_id(),
            chunk_order,
            batch_sequence: 0,
            chunk_kind,
            response_status: row.response_status(),
            teardown_state,
        }
    }

    #[allow(
        clippy::result_large_err,
        reason = "private stream validator returns the rejected chunk row as diagnostic evidence"
    )]
    fn validate_native_root_bridge_json_transport_stream_batch_roundtrip_chunks(
        chunks: &[NativeRootBridgeJsonTransportStreamBatchRoundtripChunk],
    ) -> Result<
        Vec<NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow>,
        NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow,
    > {
        let mut rows = Vec::with_capacity(chunks.len());
        let mut seen_chunks = HashSet::new();
        let mut expected_batch_sequence = 0;
        let mut expected_response_order = 0;
        let mut expected_chunk_order = 0;
        let mut teardown_seen = false;

        for chunk in chunks.iter().copied() {
            if chunk.batch_sequence != expected_batch_sequence {
                return Err(NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow::rejected(
                    "stream-chunk-out-of-order",
                    chunk,
                    super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_OUT_OF_ORDER_CHUNK_CODE,
                    NativeRootBridgeJsonTransportStreamTeardownBlocker::None,
                ));
            }

            if teardown_seen {
                return Err(NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow::rejected(
                    "stream-chunk-after-teardown",
                    chunk,
                    super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_POST_TEARDOWN_CHUNK_CODE,
                    NativeRootBridgeJsonTransportStreamTeardownBlocker::PostTeardownChunkBlocked,
                ));
            }

            if !seen_chunks.insert((chunk.response_order, chunk.chunk_order)) {
                return Err(
                    NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow::rejected(
                        "stream-chunk-duplicate",
                        chunk,
                        super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_DUPLICATE_CHUNK_CODE,
                        NativeRootBridgeJsonTransportStreamTeardownBlocker::None,
                    ),
                );
            }

            if chunk.response_order != expected_response_order
                || chunk.chunk_order != expected_chunk_order
            {
                return Err(NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow::rejected(
                    "stream-chunk-out-of-order",
                    chunk,
                    super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_OUT_OF_ORDER_CHUNK_CODE,
                    NativeRootBridgeJsonTransportStreamTeardownBlocker::None,
                ));
            }

            rows.push(NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow::accepted(chunk));
            expected_batch_sequence += 1;

            if chunk.chunk_kind == NativeRootBridgeJsonTransportStreamChunkKind::Payload {
                expected_response_order += 1;
                expected_chunk_order = 0;

                if chunk.teardown_state == NativeRootBridgeBatchResponseTeardownState::Retired {
                    teardown_seen = true;
                }
            } else {
                expected_chunk_order = 1;
            }
        }

        if expected_chunk_order != 0 {
            let previous = chunks
                .last()
                .copied()
                .expect("missing stream chunk requires an open response");
            let missing_chunk = NativeRootBridgeJsonTransportStreamBatchRoundtripChunk {
                chunk_order: expected_chunk_order,
                batch_sequence: expected_batch_sequence,
                chunk_kind: NativeRootBridgeJsonTransportStreamChunkKind::Payload,
                ..previous
            };

            return Err(
                NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow::rejected(
                    "stream-chunk-missing",
                    missing_chunk,
                    super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_MISSING_CHUNK_CODE,
                    NativeRootBridgeJsonTransportStreamTeardownBlocker::None,
                ),
            );
        }

        Ok(rows)
    }

    fn native_root_bridge_json_transport_stream_batch_roundtrip_error_rows(
        response_rows: &[NativeRootBridgeBatchResponseSequenceRow],
    ) -> Vec<NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow> {
        let Some(first_response_row) = response_rows.first() else {
            return Vec::new();
        };

        let first_metadata =
            native_root_bridge_json_transport_stream_batch_roundtrip_chunk(first_response_row, 0);
        let mut first_payload =
            native_root_bridge_json_transport_stream_batch_roundtrip_chunk(first_response_row, 1);
        first_payload.batch_sequence = 0;
        let mut duplicate_metadata = first_metadata;
        duplicate_metadata.batch_sequence = 1;

        let mut accepted_chunks =
            native_root_bridge_json_transport_stream_batch_roundtrip_chunks(response_rows);
        let last_response_row = response_rows.last().unwrap_or(first_response_row);
        if !accepted_chunks.iter().any(|chunk| {
            chunk.chunk_kind == NativeRootBridgeJsonTransportStreamChunkKind::Payload
                && chunk.teardown_state == NativeRootBridgeBatchResponseTeardownState::Retired
        }) {
            let synthetic_response_order = last_response_row.response_order().saturating_add(1);
            let synthetic_request_order = last_response_row.request_order().saturating_add(1);
            let synthetic_request_id = last_response_row.request_id().saturating_add(1);
            accepted_chunks.push(NativeRootBridgeJsonTransportStreamBatchRoundtripChunk {
                request_id: synthetic_request_id,
                request_order: synthetic_request_order,
                response_order: synthetic_response_order,
                source_environment_id: last_response_row.source_environment_id(),
                source_root_handle: last_response_row.source_root_handle(),
                source_root_id: last_response_row.source_root_id(),
                chunk_order: 0,
                batch_sequence: accepted_chunks.len(),
                chunk_kind: NativeRootBridgeJsonTransportStreamChunkKind::Metadata,
                response_status: NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted,
                teardown_state: NativeRootBridgeBatchResponseTeardownState::Active,
            });
            accepted_chunks.push(NativeRootBridgeJsonTransportStreamBatchRoundtripChunk {
                request_id: synthetic_request_id,
                request_order: synthetic_request_order,
                response_order: synthetic_response_order,
                source_environment_id: last_response_row.source_environment_id(),
                source_root_handle: last_response_row.source_root_handle(),
                source_root_id: last_response_row.source_root_id(),
                chunk_order: 1,
                batch_sequence: accepted_chunks.len(),
                chunk_kind: NativeRootBridgeJsonTransportStreamChunkKind::Payload,
                response_status: NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted,
                teardown_state: NativeRootBridgeBatchResponseTeardownState::Retired,
            });
        }
        let mut post_teardown_chunk =
            native_root_bridge_json_transport_stream_batch_roundtrip_chunk(last_response_row, 0);
        post_teardown_chunk.request_id = last_response_row.request_id().saturating_add(1);
        post_teardown_chunk.request_order = last_response_row.request_order().saturating_add(1);
        post_teardown_chunk.response_order = accepted_chunks.last().map_or(
            last_response_row.response_order().saturating_add(1),
            |chunk| chunk.response_order.saturating_add(1),
        );
        post_teardown_chunk.batch_sequence = accepted_chunks.len();
        post_teardown_chunk.teardown_state = NativeRootBridgeBatchResponseTeardownState::Retired;
        accepted_chunks.push(post_teardown_chunk);

        [
            (
                "stream-chunk-out-of-order",
                vec![first_payload],
                super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_OUT_OF_ORDER_CHUNK_CODE,
            ),
            (
                "stream-chunk-duplicate",
                vec![first_metadata, duplicate_metadata],
                super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_DUPLICATE_CHUNK_CODE,
            ),
            (
                "stream-chunk-missing",
                vec![first_metadata],
                super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_MISSING_CHUNK_CODE,
            ),
            (
                "stream-chunk-after-teardown",
                accepted_chunks,
                super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_POST_TEARDOWN_CHUNK_CODE,
            ),
        ]
        .into_iter()
        .map(|(id, chunks, expected_code)| {
            let row =
                validate_native_root_bridge_json_transport_stream_batch_roundtrip_chunks(&chunks)
                    .expect_err("deterministic stream batch roundtrip case must reject");
            assert_eq!(row.id(), id);
            assert_eq!(row.code(), Some(expected_code));
            row
        })
        .collect()
    }

    fn validate_batched_json_transport_lifecycle_rows(
        records: &[NativeRootBridgeJsonTransportRecord],
    ) -> Vec<NativeRootBridgeBatchedJsonTransportLifecycleRow> {
        let mut validator = NativeRootBridgeBatchedJsonTransportLifecycleValidator::new();
        let mut rows = Vec::with_capacity(records.len());

        for (batch_index, record) in records.iter().copied().enumerate() {
            let row = validator.validate_record(batch_index, record);
            let is_error =
                row.status() == NativeRootBridgeBatchedJsonTransportLifecycleStatus::Error;
            rows.push(row);

            if is_error {
                break;
            }
        }

        rows
    }

    const fn teardown_state_for_batch_lifecycle_row(
        row: &NativeRootBridgeBatchedJsonTransportLifecycleRow,
    ) -> NativeRootBridgeBatchResponseTeardownState {
        let lifecycle = match row.status() {
            NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted => row.lifecycle_after(),
            NativeRootBridgeBatchedJsonTransportLifecycleStatus::Error => row.lifecycle_before(),
        };

        match lifecycle {
            NativeRootBridgeBatchedJsonTransportLifecycleState::None => {
                NativeRootBridgeBatchResponseTeardownState::Uninitialized
            }
            NativeRootBridgeBatchedJsonTransportLifecycleState::Active => {
                NativeRootBridgeBatchResponseTeardownState::Active
            }
            NativeRootBridgeBatchedJsonTransportLifecycleState::Retired => {
                NativeRootBridgeBatchResponseTeardownState::Retired
            }
        }
    }

    pub(crate) fn native_root_bridge_json_transport_error_diagnostic_rows()
    -> Vec<NativeRootBridgeJsonTransportErrorDiagnosticRow> {
        deterministic_json_transport_diagnostic_cases()
            .iter()
            .copied()
            .map(|case| {
                let error = parse_json_transport_payload_for_gate(case.json).unwrap_err();
                NativeRootBridgeJsonTransportErrorDiagnosticRow::from_parse_error(case, &error)
            })
            .collect()
    }

    pub(crate) fn native_root_bridge_cross_environment_teardown_gate()
    -> NativeRootBridgeCrossEnvironmentTeardownGate {
        NativeRootBridgeCrossEnvironmentTeardownGate {
            status: super::NATIVE_ROOT_BRIDGE_CROSS_ENVIRONMENT_TEARDOWN_GATE_STATUS,
            handle_table_model: super::NATIVE_ROOT_BRIDGE_HANDLE_TABLE_MODEL,
            handle_table_diagnostics: bridge_handle_table_cross_environment_teardown_diagnostics(),
            native_addon_loaded: false,
            native_execution: false,
            renderer_execution: false,
            reconciler_execution: false,
            react_behavior_error: false,
        }
    }

    pub(crate) fn native_root_bridge_transport_worker_thread_teardown_gate()
    -> NativeRootBridgeTransportWorkerThreadTeardownGate {
        let value = serde_json::from_str::<Value>(worker_thread_teardown_json_transport_payload())
            .expect("worker-thread teardown diagnostic JSON payload parses");
        let envelope = parse_json_transport_envelope(&value)
            .expect("worker-thread teardown diagnostic JSON payload has valid schema");
        let worker_thread_id = 524;
        let worker_environment_id = BridgeEnvironmentId::from_raw(524);
        let peer_environment_id = BridgeEnvironmentId::from_raw(1524);
        let (mismatched_teardown, matched_teardown, rows) = transport_worker_thread_teardown_rows(
            worker_thread_id,
            worker_environment_id,
            peer_environment_id,
            &envelope.request_records,
        );

        NativeRootBridgeTransportWorkerThreadTeardownGate {
            status: super::NATIVE_ROOT_BRIDGE_TRANSPORT_WORKER_THREAD_TEARDOWN_GATE_STATUS,
            transport: envelope.transport,
            worker_thread_id,
            worker_environment_id,
            peer_environment_id,
            batched_record_gate: native_root_bridge_batched_json_transport_gate(
                &envelope.request_records,
            ),
            cross_environment_teardown_gate: native_root_bridge_cross_environment_teardown_gate(),
            mismatched_teardown,
            matched_teardown,
            rows,
            native_addon_loaded: false,
            native_execution: false,
            renderer_execution: false,
            reconciler_execution: false,
            react_behavior_error: false,
        }
    }

    pub(crate) fn native_root_bridge_worker_thread_teardown_executable_preflight()
    -> NativeRootBridgeWorkerThreadTeardownExecutablePreflight {
        let value = serde_json::from_str::<Value>(
            worker_thread_teardown_preflight_json_transport_payload(),
        )
        .expect("worker-thread teardown preflight JSON payload parses");
        let envelope = parse_json_transport_envelope(&value)
            .expect("worker-thread teardown preflight JSON payload has valid schema");
        let worker_thread_id = 764;
        let worker_environment_id = BridgeEnvironmentId::from_raw(764);
        let peer_environment_id = BridgeEnvironmentId::from_raw(1764);
        let batched_record_gate =
            native_root_bridge_batched_json_transport_gate(&envelope.request_records);
        let cross_environment_teardown_gate = native_root_bridge_cross_environment_teardown_gate();
        let (mismatched_teardown, matched_teardown, root_validator_state_preserved, rows) =
            worker_thread_teardown_executable_preflight_rows(
                worker_thread_id,
                worker_environment_id,
                peer_environment_id,
                &envelope.request_records,
            );
        let stale_worker_handle_rejection_count =
            rows.iter().filter(|row| row.rejected_by_boundary()).count();
        let active_peer_handle_count = rows
            .iter()
            .filter(|row| row.peer_invariant_preserved())
            .count();
        let accepted_batch_record_count = batched_record_gate
            .lifecycle_rows()
            .iter()
            .filter(|row| {
                row.status() == NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted
            })
            .count();

        NativeRootBridgeWorkerThreadTeardownExecutablePreflight {
            status: NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS,
            model: NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_PREFLIGHT_MODEL,
            execution_scope: NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_PREFLIGHT_EXECUTION_SCOPE,
            transport: envelope.transport,
            worker_thread_id,
            worker_environment_id,
            peer_environment_id,
            transport_worker_thread_teardown_gate_status:
                super::NATIVE_ROOT_BRIDGE_TRANSPORT_WORKER_THREAD_TEARDOWN_GATE_STATUS,
            batched_record_gate_status: batched_record_gate.status(),
            cross_environment_teardown_gate_status: cross_environment_teardown_gate.status(),
            accepted_batch_record_count,
            cross_environment_teardown_row_count: cross_environment_teardown_gate
                .handle_table_diagnostics()
                .rows()
                .len(),
            mismatched_teardown,
            matched_teardown,
            stale_worker_handle_rejection_count,
            active_peer_handle_count,
            root_validator_state_preserved,
            rows,
            preflight_evaluated: true,
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

    pub(crate) fn native_root_bridge_worker_thread_cleanup_hook_preflight()
    -> NativeRootBridgeWorkerThreadCleanupHookPreflight {
        let executable_preflight = native_root_bridge_worker_thread_teardown_executable_preflight();
        let evidence_rows =
            worker_thread_cleanup_hook_preflight_evidence_rows(&executable_preflight);

        validate_native_root_bridge_worker_thread_cleanup_hook_evidence_rows_for_preflight(
            &executable_preflight,
            evidence_rows,
        )
    }

    pub(crate) fn validate_native_root_bridge_worker_thread_cleanup_hook_preflight_rows(
        rows: impl IntoIterator<Item = NativeRootBridgeWorkerThreadCleanupHookPreflightRow>,
    ) -> NativeRootBridgeWorkerThreadCleanupHookPreflight {
        validate_native_root_bridge_worker_thread_cleanup_hook_evidence_rows(
            rows.into_iter()
                .map(NativeRootBridgeWorkerThreadCleanupHookEvidence::from_preflight_row),
        )
    }

    pub(crate) fn validate_native_root_bridge_worker_thread_cleanup_hook_evidence_rows(
        evidence_rows: impl IntoIterator<Item = NativeRootBridgeWorkerThreadCleanupHookEvidence>,
    ) -> NativeRootBridgeWorkerThreadCleanupHookPreflight {
        let executable_preflight = native_root_bridge_worker_thread_teardown_executable_preflight();

        validate_native_root_bridge_worker_thread_cleanup_hook_evidence_rows_for_preflight(
            &executable_preflight,
            evidence_rows,
        )
    }

    pub(crate) fn native_root_bridge_batch_lifecycle_consumer_for_json(
        json: &str,
    ) -> Result<NativeRootBridgeBatchLifecycleConsumer, NativeRootBridgeJsonTransportParseError>
    {
        let gate = parse_native_root_bridge_json_transport_for_gate(json)?;
        Ok(native_root_bridge_batch_lifecycle_consumer_for_gate(&gate))
    }

    pub(crate) fn native_root_bridge_cleanup_generation_consumer_for_json(
        json: &str,
        cleanup_hook_preflight: &NativeRootBridgeWorkerThreadCleanupHookPreflight,
    ) -> Result<NativeRootBridgeCleanupGenerationConsumer, NativeRootBridgeJsonTransportParseError>
    {
        let gate = parse_native_root_bridge_json_transport_for_gate(json)?;
        Ok(native_root_bridge_cleanup_generation_consumer_for_gate(
            &gate,
            cleanup_hook_preflight,
        ))
    }

    pub(crate) fn native_root_bridge_cleanup_generation_consumer_for_gate(
        gate: &NativeRootBridgeJsonTransportParserGate,
        cleanup_hook_preflight: &NativeRootBridgeWorkerThreadCleanupHookPreflight,
    ) -> NativeRootBridgeCleanupGenerationConsumer {
        native_root_bridge_cleanup_generation_consumer_for_sources(
            gate.json_batch_lifecycle_executor(),
            gate.json_batch_lifecycle_executor().rows(),
            cleanup_hook_preflight,
        )
    }

    pub(crate) fn native_root_bridge_cleanup_generation_consumer_for_sources(
        executor: &NativeRootBridgeJsonBatchLifecycleExecutor,
        candidate_rows: &[NativeRootBridgeJsonBatchLifecycleExecutorRow],
        cleanup_hook_preflight: &NativeRootBridgeWorkerThreadCleanupHookPreflight,
    ) -> NativeRootBridgeCleanupGenerationConsumer {
        let result = consume_native_root_bridge_cleanup_generation_evidence(
            executor,
            candidate_rows,
            cleanup_hook_preflight,
        );

        NativeRootBridgeCleanupGenerationConsumer::new(executor, cleanup_hook_preflight, result)
    }

    #[cfg(test)]
    pub(crate) fn native_root_bridge_cleanup_generation_currentness_canary_for_private_sources(
        current_lifecycle_consumer: &NativeRootBridgeBatchLifecycleConsumer,
        cleanup_generation_consumer: &NativeRootBridgeCleanupGenerationConsumer,
        cleanup_hook_preflight: &NativeRootBridgeWorkerThreadCleanupHookPreflight,
        cleanup_handoff_rows: &[NativeRootBridgeCleanupGenerationConsumerRow],
    ) -> NativeRootBridgeCleanupGenerationCurrentnessCanary {
        let result = validate_native_root_bridge_cleanup_generation_currentness_rows(
            current_lifecycle_consumer,
            cleanup_generation_consumer,
            cleanup_hook_preflight,
            cleanup_handoff_rows,
        );

        NativeRootBridgeCleanupGenerationCurrentnessCanary::new(
            current_lifecycle_consumer,
            cleanup_generation_consumer,
            cleanup_hook_preflight,
            result,
        )
    }

    pub(crate) fn native_root_bridge_batch_lifecycle_consumer_for_gate(
        gate: &NativeRootBridgeJsonTransportParserGate,
    ) -> NativeRootBridgeBatchLifecycleConsumer {
        let cleanup_hook_preflight =
            validate_native_root_bridge_worker_thread_cleanup_hook_preflight_rows(
                native_root_bridge_worker_thread_cleanup_hook_preflight()
                    .rows()
                    .iter()
                    .copied(),
            );
        let executor_source_error_code =
            validate_and_consume_native_root_bridge_json_batch_lifecycle_executor(
                gate.json_batch_lifecycle_executor(),
            )
            .err();
        let executor_source_rows_validated = executor_source_error_code.is_none();
        let rows = if executor_source_rows_validated {
            gate.batched_record_gate()
                .lifecycle_rows()
                .iter()
                .zip(
                    gate.json_batch_lifecycle_executor()
                        .admission_records()
                        .iter()
                        .copied(),
                )
                .map(|(lifecycle_row, smoke_record)| {
                    NativeRootBridgeBatchLifecycleConsumerRow::new(
                        lifecycle_row,
                        smoke_record,
                        cleanup_hook_row_for_batch_lifecycle_consumer(
                            lifecycle_row.kind(),
                            &cleanup_hook_preflight,
                        ),
                    )
                })
                .collect::<Vec<_>>()
        } else {
            Vec::new()
        };
        let accepted_batch_record_count = rows
            .iter()
            .filter(|row| {
                row.status() == NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted
            })
            .count();
        let json_batch_roundtrip_link =
            validate_native_root_bridge_batch_lifecycle_consumer_json_batch_roundtrip_link_rows(
                &rows,
                gate.batched_record_gate().lifecycle_rows(),
                gate.batched_record_gate().response_sequence_gate().rows(),
                gate.batched_record_gate()
                    .response_sequence_gate()
                    .stream_roundtrip_gate()
                    .rows(),
                gate.json_batch_lifecycle_executor().admission_records(),
            );

        NativeRootBridgeBatchLifecycleConsumer {
            status: NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_STATUS,
            model: NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_MODEL,
            validation_model: super::NATIVE_ROOT_BRIDGE_REQUEST_VALIDATION_MODEL,
            handle_table_model: super::NATIVE_ROOT_BRIDGE_HANDLE_TABLE_MODEL,
            batch_gate_status: gate.batched_record_gate().status(),
            cleanup_hook_preflight_status: cleanup_hook_preflight.status(),
            request_count: gate.request_records().len(),
            consumed_batch_record_count: rows.len(),
            accepted_batch_record_count,
            cleanup_hook_callable_preflight_accepted: cleanup_hook_preflight
                .canonical_executable_evidence_accepted(),
            accepted_cleanup_evidence_count: cleanup_hook_preflight
                .accepted_cleanup_evidence_count(),
            rejected_cleanup_evidence_count: cleanup_hook_preflight
                .rejected_cleanup_evidence_count(),
            json_batch_lifecycle_executor_generation: gate
                .json_batch_lifecycle_executor()
                .executor_generation(),
            json_batch_lifecycle_executor_source_rows_validated: executor_source_rows_validated,
            json_batch_lifecycle_executor_source_error_code: executor_source_error_code,
            json_batch_lifecycle_executor_replay_guard_consumed: executor_source_rows_validated,
            json_batch_roundtrip_link,
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

    pub(crate) fn validate_native_root_bridge_batch_lifecycle_consumer_json_batch_roundtrip_link_rows(
        consumer_rows: &[NativeRootBridgeBatchLifecycleConsumerRow],
        lifecycle_rows: &[NativeRootBridgeBatchedJsonTransportLifecycleRow],
        response_rows: &[NativeRootBridgeBatchResponseSequenceRow],
        stream_rows: &[NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow],
        smoke_records: &[NativeRootBridgeHandleTableAdmissionSmokeRecord],
    ) -> NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink {
        let batch_id = super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID;
        let stream_id = super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_STREAM_ID;
        let row_count = [
            consumer_rows.len(),
            lifecycle_rows.len(),
            response_rows.len(),
            stream_rows.len().div_ceil(2),
            smoke_records.len(),
        ]
        .into_iter()
        .max()
        .unwrap_or(0);
        let rows = (0..row_count)
            .map(|index| {
                NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRow::new(
                    index,
                    batch_id,
                    stream_id,
                    consumer_rows.get(index),
                    lifecycle_rows.get(index),
                    response_rows.get(index),
                    stream_rows.get(index * 2),
                    stream_rows.get(index * 2 + 1),
                    smoke_records.get(index).copied(),
                )
            })
            .collect::<Vec<_>>();
        let rejected_rows = rows
            .iter()
            .filter(|row| {
                row.status()
                    == NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowStatus::Rejected
            })
            .cloned()
            .collect::<Vec<_>>();
        let rejected_row_count = rejected_rows.len();
        let linked_row_count = rows.len().saturating_sub(rejected_row_count);

        NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink {
            link_status:
                NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_LINK_STATUS,
            model: NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_LINK_MODEL,
            validation_model: super::NATIVE_ROOT_BRIDGE_REQUEST_VALIDATION_MODEL,
            handle_table_model: super::NATIVE_ROOT_BRIDGE_HANDLE_TABLE_MODEL,
            consumer_status: NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_STATUS,
            batch_gate_status: super::NATIVE_ROOT_BRIDGE_BATCHED_JSON_TRANSPORT_GATE_STATUS,
            response_sequence_gate_status:
                super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_GATE_STATUS,
            stream_roundtrip_gate_status:
                super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_GATE_STATUS,
            batch_id,
            stream_id,
            validate_json_batch_roundtrip_link_rows_name:
                NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_VALIDATE_NAME,
            request_count: consumer_rows.len(),
            linked_row_count,
            rejected_row_count,
            source_owned_native_rows: rejected_row_count == 0,
            rows,
            rejected_rows,
            native_addon_loaded: false,
            native_execution: false,
            renderer_execution: false,
            reconciler_execution: false,
            node_worker_threads_execution: false,
            napi_cleanup_hook_execution: false,
            public_native_compatibility: false,
            react_behavior_error: false,
        }
    }

    fn get_native_root_bridge_batch_lifecycle_consumer_json_roundtrip_link_rejection_code(
        sources: NativeRootBridgeBatchLifecycleConsumerJsonRoundtripLinkRowSources<'_>,
    ) -> Option<&'static str> {
        let NativeRootBridgeBatchLifecycleConsumerJsonRoundtripLinkRowSources {
            index,
            batch_id,
            stream_id,
            consumer_row,
            lifecycle_row,
            response_row,
            stream_metadata_row,
            stream_payload_row,
            smoke_record,
        } = sources;
        let rows_claim_public_native = consumer_row
            .is_some_and(has_native_root_bridge_batch_lifecycle_consumer_public_native_claim)
            || lifecycle_row.is_some_and(
                has_native_root_bridge_batched_json_transport_lifecycle_public_native_claim,
            )
            || response_row
                .is_some_and(has_native_root_bridge_batch_response_sequence_public_native_claim)
            || stream_metadata_row.is_some_and(
                has_native_root_bridge_json_transport_stream_batch_roundtrip_public_native_claim,
            )
            || stream_payload_row.is_some_and(
                has_native_root_bridge_json_transport_stream_batch_roundtrip_public_native_claim,
            );

        if rows_claim_public_native {
            return Some(
                NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE,
            );
        }

        let (
            Some(consumer_row),
            Some(lifecycle_row),
            Some(response_row),
            Some(stream_metadata_row),
            Some(stream_payload_row),
            Some(smoke_record),
        ) = (
            consumer_row,
            lifecycle_row,
            response_row,
            stream_metadata_row,
            stream_payload_row,
            smoke_record,
        )
        else {
            return Some(
                NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_STALE_OR_FOREIGN_JSON_BATCH_ROW_CODE,
            );
        };

        if consumer_row.batch_index() != index
            || lifecycle_row.batch_index() != index
            || response_row.request_order() != index
            || response_row.response_order() != index
            || stream_metadata_row.request_order() != index
            || stream_metadata_row.response_order() != index
            || stream_metadata_row.chunk_order() != 0
            || stream_metadata_row.batch_sequence() != index * 2
            || stream_payload_row.request_order() != index
            || stream_payload_row.response_order() != index
            || stream_payload_row.chunk_order() != 1
            || stream_payload_row.batch_sequence() != index * 2 + 1
            || smoke_record.request_id() != consumer_row.request_id()
        {
            return Some(
                NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_ROW_ORDER_MISMATCH_CODE,
            );
        }

        let expected_kind = consumer_row.kind();
        let expected_consumer_row_id = format!("batch-lifecycle-consumer-{index}-{expected_kind}");
        let expected_lifecycle_row_id = format!("batch-record-{index}-{expected_kind}");
        let expected_response_row_id = format!("batch-response-{index}-{expected_kind}");
        let expected_metadata_row_id = format!(
            "stream-batch-chunk-{}-request-{}-metadata",
            index * 2,
            consumer_row.request_id()
        );
        let expected_payload_row_id = format!(
            "stream-batch-chunk-{}-request-{}-payload",
            index * 2 + 1,
            consumer_row.request_id()
        );

        if consumer_row.id() != expected_consumer_row_id
            || lifecycle_row.id() != expected_lifecycle_row_id
            || response_row.id() != expected_response_row_id
            || stream_metadata_row.id() != expected_metadata_row_id
            || stream_payload_row.id() != expected_payload_row_id
        {
            return Some(
                NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_ROW_ID_MISMATCH_CODE,
            );
        }

        if response_row.batch_id() != batch_id
            || stream_metadata_row.batch_id() != batch_id
            || stream_payload_row.batch_id() != batch_id
            || stream_metadata_row.stream_id() != stream_id
            || stream_payload_row.stream_id() != stream_id
            || response_row.error_row_status()
                != NativeRootBridgeBatchResponseErrorRowStatus::NotError
            || response_row.response_status()
                != NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted
            || stream_metadata_row.chunk_kind()
                != NativeRootBridgeJsonTransportStreamChunkKind::Metadata
            || stream_payload_row.chunk_kind()
                != NativeRootBridgeJsonTransportStreamChunkKind::Payload
            || stream_metadata_row.chunk_status()
                != NativeRootBridgeJsonTransportStreamChunkStatus::Accepted
            || stream_payload_row.chunk_status()
                != NativeRootBridgeJsonTransportStreamChunkStatus::Accepted
            || !stream_payload_row.assembled_response()
            || stream_payload_row.assembly_state()
                != NativeRootBridgeJsonTransportStreamAssemblyState::Assembled
            || !batch_lifecycle_consumer_rows_have_matching_source_root_identity(
                consumer_row,
                lifecycle_row,
                response_row,
                stream_metadata_row,
                stream_payload_row,
                smoke_record,
            )
        {
            return Some(
                NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_STALE_OR_FOREIGN_JSON_BATCH_ROW_CODE,
            );
        }

        let Some(expected_kind_enum) = native_root_bridge_request_kind_for_code(expected_kind)
        else {
            return Some(
                NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_KIND_TRANSITION_MISMATCH_CODE,
            );
        };
        let expected_lifecycle_transition =
            get_lifecycle_transition_for_request(expected_kind_enum);
        let Some(expected_handle_admission) =
            native_root_bridge_batch_lifecycle_consumer_expected_handle_admission(
                expected_kind_enum,
            )
        else {
            return Some(
                NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_KIND_TRANSITION_MISMATCH_CODE,
            );
        };

        if lifecycle_row.kind() != expected_kind
            || response_row.kind() != expected_kind
            || smoke_record.kind() != expected_kind_enum
            || lifecycle_row.request_id() != consumer_row.request_id()
            || response_row.request_id() != consumer_row.request_id()
            || stream_metadata_row.request_id() != consumer_row.request_id()
            || stream_payload_row.request_id() != consumer_row.request_id()
            || lifecycle_row.status() != consumer_row.status()
            || response_row.response_status() != consumer_row.status()
            || stream_metadata_row.response_status() != consumer_row.status()
            || stream_payload_row.response_status() != consumer_row.status()
            || lifecycle_row.lifecycle_transition() != consumer_row.lifecycle_transition()
            || consumer_row.lifecycle_transition() != Some(expected_lifecycle_transition)
            || smoke_record.lifecycle_transition() != expected_lifecycle_transition
            || consumer_row.root_handle_action() != smoke_record.root_handle_action()
            || consumer_row.root_handle_action() != expected_handle_admission.root_handle_action
            || smoke_record.root_handle_action() != expected_handle_admission.root_handle_action
            || consumer_row.root_handle_state_before()
                != expected_handle_admission.root_handle_state_before
            || smoke_record.root_handle_state_before()
                != expected_handle_admission.root_handle_state_before
            || consumer_row.root_handle_state_after()
                != expected_handle_admission.root_handle_state_after
            || smoke_record.root_handle_state_after()
                != expected_handle_admission.root_handle_state_after
            || consumer_row.root_handle_current_generation()
                != expected_handle_admission.root_handle_current_generation
            || smoke_record.root_handle_current_generation()
                != expected_handle_admission.root_handle_current_generation
            || consumer_row.value_handle_action() != expected_handle_admission.value_handle_action
            || smoke_record.value_handle_action() != expected_handle_admission.value_handle_action
            || consumer_row.value_handle_current_generation()
                != expected_handle_admission.value_handle_current_generation
            || smoke_record.value_handle_current_generation()
                != expected_handle_admission.value_handle_current_generation
            || consumer_row.retired_root_source_error_code()
                != expected_handle_admission.retired_root_source_error_code
            || smoke_record.retired_root_source_error_code()
                != expected_handle_admission.retired_root_source_error_code
        {
            return Some(
                NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_KIND_TRANSITION_MISMATCH_CODE,
            );
        }

        let Some(expected_cleanup_evidence) =
            native_root_bridge_batch_lifecycle_consumer_expected_cleanup_hook_evidence(
                expected_kind_enum,
            )
        else {
            return Some(
                NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_CLEANUP_STATUS_MISMATCH_CODE,
            );
        };
        if consumer_row.cleanup_hook_evidence_required()
            != expected_cleanup_evidence.cleanup_hook_evidence_required
            || consumer_row.cleanup_hook_evidence_status()
                != expected_cleanup_evidence.cleanup_hook_evidence_status
            || consumer_row.cleanup_hook_evidence_row_id()
                != expected_cleanup_evidence.cleanup_hook_evidence_row_id
            || consumer_row.cleanup_hook_source_row_id()
                != expected_cleanup_evidence.cleanup_hook_source_row_id
            || consumer_row.cleanup_hook_source_handle_kind()
                != expected_cleanup_evidence.cleanup_hook_source_handle_kind
            || consumer_row.cleanup_hook_source_handle_environment_id()
                != expected_cleanup_evidence.cleanup_hook_source_handle_environment_id
            || consumer_row.cleanup_hook_source_handle_slot()
                != expected_cleanup_evidence.cleanup_hook_source_handle_slot
            || consumer_row.cleanup_hook_source_handle_generation()
                != expected_cleanup_evidence.cleanup_hook_source_handle_generation
            || consumer_row.cleanup_hook_source_current_generation()
                != expected_cleanup_evidence.cleanup_hook_source_current_generation
            || consumer_row.cleanup_hook_source_record_id()
                != expected_cleanup_evidence.cleanup_hook_source_record_id
            || consumer_row.cleanup_hook_source_root_id()
                != expected_cleanup_evidence.cleanup_hook_source_root_id
            || consumer_row.cleanup_hook_canonical_executable_evidence()
                != expected_cleanup_evidence.cleanup_hook_canonical_executable_evidence
        {
            return Some(
                NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_CLEANUP_STATUS_MISMATCH_CODE,
            );
        }

        None
    }

    fn native_root_bridge_request_kind_for_code(kind: &str) -> Option<NativeRootBridgeRequestKind> {
        match kind {
            "create" => Some(NativeRootBridgeRequestKind::Create),
            "render" => Some(NativeRootBridgeRequestKind::Render),
            "unmount" => Some(NativeRootBridgeRequestKind::Unmount),
            _ => None,
        }
    }

    struct NativeRootBridgeBatchLifecycleConsumerExpectedHandleAdmission {
        root_handle_action: NativeRootBridgeHandleAdmissionAction,
        root_handle_state_before: Option<NativeRootBridgeRootHandleState>,
        root_handle_state_after: NativeRootBridgeRootHandleState,
        root_handle_current_generation: u64,
        value_handle_action: Option<NativeRootBridgeHandleAdmissionAction>,
        value_handle_current_generation: Option<u64>,
        retired_root_source_error_code: Option<&'static str>,
    }

    fn native_root_bridge_batch_lifecycle_consumer_expected_handle_admission(
        kind: NativeRootBridgeRequestKind,
    ) -> Option<NativeRootBridgeBatchLifecycleConsumerExpectedHandleAdmission> {
        match kind {
            NativeRootBridgeRequestKind::Create => Some(
                NativeRootBridgeBatchLifecycleConsumerExpectedHandleAdmission {
                    root_handle_action: NativeRootBridgeHandleAdmissionAction::AdmitRoot,
                    root_handle_state_before: None,
                    root_handle_state_after: NativeRootBridgeRootHandleState::Active,
                    root_handle_current_generation: 1,
                    value_handle_action: Some(NativeRootBridgeHandleAdmissionAction::AdmitValue),
                    value_handle_current_generation: Some(1),
                    retired_root_source_error_code: None,
                },
            ),
            NativeRootBridgeRequestKind::Render => Some(
                NativeRootBridgeBatchLifecycleConsumerExpectedHandleAdmission {
                    root_handle_action: NativeRootBridgeHandleAdmissionAction::ValidateActiveRoot,
                    root_handle_state_before: Some(NativeRootBridgeRootHandleState::Active),
                    root_handle_state_after: NativeRootBridgeRootHandleState::Active,
                    root_handle_current_generation: 1,
                    value_handle_action: Some(NativeRootBridgeHandleAdmissionAction::AdmitValue),
                    value_handle_current_generation: Some(1),
                    retired_root_source_error_code: None,
                },
            ),
            NativeRootBridgeRequestKind::Unmount => Some(
                NativeRootBridgeBatchLifecycleConsumerExpectedHandleAdmission {
                    root_handle_action: NativeRootBridgeHandleAdmissionAction::RetireRoot,
                    root_handle_state_before: Some(NativeRootBridgeRootHandleState::Active),
                    root_handle_state_after: NativeRootBridgeRootHandleState::Retired,
                    root_handle_current_generation: 2,
                    value_handle_action: None,
                    value_handle_current_generation: None,
                    retired_root_source_error_code: Some("FAST_REACT_NAPI_STALE_HANDLE"),
                },
            ),
        }
    }

    struct NativeRootBridgeBatchLifecycleConsumerExpectedCleanupHookEvidence {
        cleanup_hook_evidence_required: bool,
        cleanup_hook_evidence_status: &'static str,
        cleanup_hook_evidence_row_id: Option<&'static str>,
        cleanup_hook_source_row_id: Option<&'static str>,
        cleanup_hook_source_handle_kind: Option<BridgeHandleKind>,
        cleanup_hook_source_handle_environment_id: Option<BridgeEnvironmentId>,
        cleanup_hook_source_handle_slot: Option<u64>,
        cleanup_hook_source_handle_generation: Option<u64>,
        cleanup_hook_source_current_generation: Option<u64>,
        cleanup_hook_source_record_id: Option<u64>,
        cleanup_hook_source_root_id: Option<u64>,
        cleanup_hook_canonical_executable_evidence: Option<bool>,
    }

    fn native_root_bridge_batch_lifecycle_consumer_expected_cleanup_hook_evidence(
        kind: NativeRootBridgeRequestKind,
    ) -> Option<NativeRootBridgeBatchLifecycleConsumerExpectedCleanupHookEvidence> {
        match kind {
            NativeRootBridgeRequestKind::Create => Some(
                NativeRootBridgeBatchLifecycleConsumerExpectedCleanupHookEvidence {
                    cleanup_hook_evidence_required: false,
                    cleanup_hook_evidence_status:
                        NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_CLEANUP_HOOK_NOT_REQUIRED_STATUS,
                    cleanup_hook_evidence_row_id: None,
                    cleanup_hook_source_row_id: None,
                    cleanup_hook_source_handle_kind: None,
                    cleanup_hook_source_handle_environment_id: None,
                    cleanup_hook_source_handle_slot: None,
                    cleanup_hook_source_handle_generation: None,
                    cleanup_hook_source_current_generation: None,
                    cleanup_hook_source_record_id: None,
                    cleanup_hook_source_root_id: None,
                    cleanup_hook_canonical_executable_evidence: None,
                },
            ),
            NativeRootBridgeRequestKind::Render => {
                native_root_bridge_batch_lifecycle_consumer_cleanup_hook_evidence_from_source(
                    "cleanup-hook-worker-value-after-root-release",
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_SOURCE_ROW_ID,
                    BridgeHandleKind::Value,
                )
            }
            NativeRootBridgeRequestKind::Unmount => {
                native_root_bridge_batch_lifecycle_consumer_cleanup_hook_evidence_from_source(
                    "cleanup-hook-worker-root-before-value-release",
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_SOURCE_ROW_ID,
                    BridgeHandleKind::Root,
                )
            }
        }
    }

    fn native_root_bridge_batch_lifecycle_consumer_cleanup_hook_evidence_from_source(
        cleanup_hook_evidence_row_id: &'static str,
        cleanup_hook_source_row_id: &'static str,
        cleanup_hook_source_handle_kind: BridgeHandleKind,
    ) -> Option<NativeRootBridgeBatchLifecycleConsumerExpectedCleanupHookEvidence> {
        let preflight = native_root_bridge_worker_thread_cleanup_hook_preflight();
        let row = preflight.rows().iter().find(|row| {
            row.id() == cleanup_hook_evidence_row_id
                && row.source_row_id() == cleanup_hook_source_row_id
                && row.source_handle_kind() == cleanup_hook_source_handle_kind
                && row.status()
                    == NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Accepted
                && row.canonical_executable_evidence()
        })?;

        Some(
            NativeRootBridgeBatchLifecycleConsumerExpectedCleanupHookEvidence {
                cleanup_hook_evidence_required: true,
                cleanup_hook_evidence_status:
                    NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Accepted.code(),
                cleanup_hook_evidence_row_id: Some(cleanup_hook_evidence_row_id),
                cleanup_hook_source_row_id: Some(cleanup_hook_source_row_id),
                cleanup_hook_source_handle_kind: Some(cleanup_hook_source_handle_kind),
                cleanup_hook_source_handle_environment_id: row.source_handle_environment_id(),
                cleanup_hook_source_handle_slot: row.source_handle_slot(),
                cleanup_hook_source_handle_generation: row.source_handle_generation(),
                cleanup_hook_source_current_generation: row.source_current_generation(),
                cleanup_hook_source_record_id: row.source_record_id(),
                cleanup_hook_source_root_id: row.source_root_id(),
                cleanup_hook_canonical_executable_evidence: Some(true),
            },
        )
    }

    fn batch_lifecycle_consumer_rows_have_matching_source_root_identity(
        consumer_row: &NativeRootBridgeBatchLifecycleConsumerRow,
        lifecycle_row: &NativeRootBridgeBatchedJsonTransportLifecycleRow,
        response_row: &NativeRootBridgeBatchResponseSequenceRow,
        stream_metadata_row: &NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow,
        stream_payload_row: &NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow,
        smoke_record: NativeRootBridgeHandleTableAdmissionSmokeRecord,
    ) -> bool {
        let (Some(source_environment_id), Some(source_root_handle), Some(source_root_id)) = (
            consumer_row.source_environment_id(),
            consumer_row.source_root_handle(),
            consumer_row.source_root_id(),
        ) else {
            return false;
        };

        lifecycle_row.source_environment_id() == Some(source_environment_id)
            && lifecycle_row.source_root_handle() == Some(source_root_handle)
            && lifecycle_row.source_root_id() == Some(source_root_id)
            && response_row.source_environment_id() == Some(source_environment_id)
            && response_row.source_root_handle() == Some(source_root_handle)
            && response_row.source_root_id() == Some(source_root_id)
            && stream_metadata_row.source_environment_id() == Some(source_environment_id)
            && stream_metadata_row.source_root_handle() == Some(source_root_handle)
            && stream_metadata_row.source_root_id() == Some(source_root_id)
            && stream_payload_row.source_environment_id() == Some(source_environment_id)
            && stream_payload_row.source_root_handle() == Some(source_root_handle)
            && stream_payload_row.source_root_id() == Some(source_root_id)
            && smoke_record.source_environment_id() == source_environment_id
            && smoke_record.source_root_handle() == source_root_handle
            && smoke_record.source_root_id() == source_root_id
    }

    fn has_native_root_bridge_batch_lifecycle_consumer_public_native_claim(
        row: &NativeRootBridgeBatchLifecycleConsumerRow,
    ) -> bool {
        row.native_addon_loaded()
            || row.native_execution()
            || row.renderer_execution()
            || row.reconciler_execution()
            || row.node_worker_threads_execution()
            || row.napi_cleanup_hook_execution()
            || row.public_native_compatibility()
            || row.react_behavior_error()
    }

    fn has_native_root_bridge_batched_json_transport_lifecycle_public_native_claim(
        row: &NativeRootBridgeBatchedJsonTransportLifecycleRow,
    ) -> bool {
        row.native_addon_loaded()
            || row.native_execution()
            || row.renderer_execution()
            || row.reconciler_execution()
            || row.react_behavior_error()
    }

    fn has_native_root_bridge_batch_response_sequence_public_native_claim(
        row: &NativeRootBridgeBatchResponseSequenceRow,
    ) -> bool {
        row.native_addon_loaded()
            || row.native_execution()
            || row.renderer_execution()
            || row.reconciler_execution()
            || row.react_behavior_error()
    }

    fn has_native_root_bridge_json_transport_stream_batch_roundtrip_public_native_claim(
        row: &NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow,
    ) -> bool {
        row.native_addon_loaded()
            || row.native_execution()
            || row.renderer_execution()
            || row.reconciler_execution()
            || row.public_native_compatibility()
            || row.react_behavior_error()
    }

    fn has_native_root_bridge_json_batch_lifecycle_executor_public_native_claim(
        executor: &NativeRootBridgeJsonBatchLifecycleExecutor,
    ) -> bool {
        executor.native_addon_loaded()
            || executor.native_execution()
            || executor.renderer_execution()
            || executor.reconciler_execution()
            || executor.public_native_compatibility()
            || executor.react_behavior_error()
    }

    fn has_native_root_bridge_json_batch_lifecycle_executor_row_public_native_claim(
        row: &NativeRootBridgeJsonBatchLifecycleExecutorRow,
    ) -> bool {
        row.native_addon_loaded()
            || row.native_execution()
            || row.renderer_execution()
            || row.reconciler_execution()
            || row.public_native_compatibility()
            || row.react_behavior_error()
    }

    fn has_native_root_bridge_cleanup_hook_preflight_public_native_claim(
        preflight: &NativeRootBridgeWorkerThreadCleanupHookPreflight,
    ) -> bool {
        let preflight_claims_public_native = preflight.node_worker_threads_execution()
            || preflight.napi_cleanup_hook_execution()
            || preflight.native_addon_loaded()
            || preflight.native_execution()
            || preflight.renderer_execution()
            || preflight.reconciler_execution()
            || preflight.public_native_compatibility()
            || preflight.react_behavior_error();
        let row_claims_public_native = preflight.rows().iter().any(|row| {
            row.code()
                == Some(
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PUBLIC_NATIVE_PACKAGE_CLAIM_CODE,
                )
                || has_native_root_bridge_cleanup_hook_preflight_row_public_native_claim(row)
        });

        preflight_claims_public_native || row_claims_public_native
    }

    fn has_native_root_bridge_cleanup_hook_preflight_row_public_native_claim(
        row: &NativeRootBridgeWorkerThreadCleanupHookPreflightRow,
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

