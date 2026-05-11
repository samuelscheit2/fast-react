    fn parse_json_transport_payload_for_gate(
        json: &str,
    ) -> Result<
        (
            ParsedJsonTransportEnvelope,
            NativeRootBridgeJsonBatchLifecycleExecutor,
            NativeRootBridgeHandleTableAdmissionSmoke,
        ),
        NativeRootBridgeJsonTransportParseError,
    > {
        let value = serde_json::from_str::<Value>(json).map_err(|error| {
            NativeRootBridgeJsonTransportParseError::InvalidJson {
                line: error.line(),
                column: error.column(),
            }
        })?;
        let envelope = parse_json_transport_envelope(&value)?;
        let json_batch_lifecycle_executor =
            native_root_bridge_json_batch_lifecycle_executor_for_records(&envelope.request_records)
                .map_err(NativeRootBridgeJsonTransportParseError::Validation)?;
        let admission_smoke = json_batch_lifecycle_executor.handle_table_admission_smoke();

        Ok((envelope, json_batch_lifecycle_executor, admission_smoke))
    }

    fn deterministic_json_transport_diagnostic_cases()
    -> &'static [NativeRootBridgeJsonTransportDiagnosticCase] {
        &[
            NativeRootBridgeJsonTransportDiagnosticCase {
                id: "malformed-payload",
                category: "malformed-payload",
                phase: "parse",
                json: "{",
                boundary_error_code: None,
            },
            NativeRootBridgeJsonTransportDiagnosticCase {
                id: "wrong-environment-root-handle",
                category: "wrong-environment",
                phase: "validation",
                json: r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":467,"root_handle":{"environment_id":468,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}"#,
                boundary_error_code: Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_ENVIRONMENT"),
            },
            NativeRootBridgeJsonTransportDiagnosticCase {
                id: "stale-value-handle-generation",
                category: "stale-handle",
                phase: "validation",
                json: r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":467,"root_handle":{"environment_id":467,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":467,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":467,"root_handle":{"environment_id":467,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":467,"slot":2,"generation":2,"kind":"value"},"root_handle_state":"active"}]}"#,
                boundary_error_code: Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
            },
            NativeRootBridgeJsonTransportDiagnosticCase {
                id: "render-before-create-lifecycle-order",
                category: "lifecycle-order",
                phase: "validation",
                json: r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"render","environment_id":467,"root_handle":{"environment_id":467,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}"#,
                boundary_error_code: Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"),
            },
        ]
    }

    fn deterministic_batched_json_transport_diagnostic_cases()
    -> &'static [NativeRootBridgeBatchedJsonTransportDiagnosticCase] {
        &[
            NativeRootBridgeBatchedJsonTransportDiagnosticCase {
                id: "batch-render-before-create-lifecycle-order",
                json: r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"render","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}"#,
                expected_code: "FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE",
            },
            NativeRootBridgeBatchedJsonTransportDiagnosticCase {
                id: "batch-root-handle-state-mismatch",
                json: r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"}]}"#,
                expected_code: "FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_STATE_MISMATCH",
            },
            NativeRootBridgeBatchedJsonTransportDiagnosticCase {
                id: "batch-create-after-create-lifecycle-order",
                json: r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"},{"request_id":2,"kind":"create","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}"#,
                expected_code: "FAST_REACT_NAPI_ROOT_REQUEST_CREATE_AFTER_ROOT_CREATED",
            },
            NativeRootBridgeBatchedJsonTransportDiagnosticCase {
                id: "batch-request-after-unmount-lifecycle-order",
                json: r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"},{"request_id":2,"kind":"unmount","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"},{"request_id":3,"kind":"render","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}"#,
                expected_code: "FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT",
            },
            NativeRootBridgeBatchedJsonTransportDiagnosticCase {
                id: "batch-request-id-out-of-order",
                json: r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":2,"kind":"create","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"},{"request_id":1,"kind":"render","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}"#,
                expected_code: "FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_OUT_OF_ORDER",
            },
        ]
    }

    #[derive(Debug)]
    struct ParsedJsonTransportEnvelope {
        transport: &'static str,
        schema_version: u32,
        request_records: Vec<NativeRootBridgeJsonTransportRecord>,
    }

    fn admit_js_native_root_bridge_handoff_record(
        table: &mut BridgeHandleTable,
        request: NativeRootBridgeRequestRecord,
        root_handle_state_before: Option<NativeRootBridgeRootHandleState>,
    ) -> Result<NativeRootBridgeHandleTableAdmissionSmokeRecord, NativeRootBridgeRequestError> {
        validate_record_environment(table, request)?;
        preflight_handoff_sequence_admission(request, root_handle_state_before)?;

        match request.kind() {
            NativeRootBridgeRequestKind::Create => {
                validate_root_handle_state(request, NativeRootBridgeRootHandleState::Active)?;

                let root_admission = table.admit_root_handoff_handle(
                    request.root_handle(),
                    PlaceholderRootRecord::new(request.root_id()),
                )?;
                let value_admission = if let Some(value_handle) = request.value_handle() {
                    Some(table.admit_value_handoff_handle(
                        value_handle,
                        PlaceholderValueRecord::new(request.request_id()),
                    )?)
                } else {
                    None
                };

                Ok(NativeRootBridgeHandleTableAdmissionSmokeRecord::new(
                    request,
                    NativeRootBridgeLifecycleTransition::NoneToActive,
                    root_handle_state_before,
                    NativeRootBridgeRootHandleState::Active,
                    NativeRootBridgeHandleAdmissionAction::AdmitRoot,
                    root_admission.current_generation(),
                    value_admission.map(value_handoff_admission_action),
                    value_admission.map(|admission| admission.current_generation()),
                    None,
                ))
            }
            NativeRootBridgeRequestKind::Render => {
                validate_root_handle_state(request, NativeRootBridgeRootHandleState::Active)?;
                let root = table.get_root(request.root_handle())?;
                validate_root_id(request, root.root_id())?;

                let value_admission = if let Some(value_handle) = request.value_handle() {
                    Some(table.admit_value_handoff_handle(
                        value_handle,
                        PlaceholderValueRecord::new(request.request_id()),
                    )?)
                } else {
                    None
                };

                Ok(NativeRootBridgeHandleTableAdmissionSmokeRecord::new(
                    request,
                    NativeRootBridgeLifecycleTransition::ActiveToActive,
                    root_handle_state_before,
                    NativeRootBridgeRootHandleState::Active,
                    NativeRootBridgeHandleAdmissionAction::ValidateActiveRoot,
                    request.root_handle().generation(),
                    value_admission.map(value_handoff_admission_action),
                    value_admission.map(|admission| admission.current_generation()),
                    None,
                ))
            }
            NativeRootBridgeRequestKind::Unmount => {
                validate_root_handle_state(request, NativeRootBridgeRootHandleState::Retired)?;

                if let Some(value_handle) = request.value_handle() {
                    return Err(NativeRootBridgeRequestError::UnexpectedValueHandle {
                        kind: request.kind(),
                        value_handle,
                    });
                }

                let root = table.get_root(request.root_handle())?;
                validate_root_id(request, root.root_id())?;
                table.remove_root(request.root_handle())?;

                let (retired_root_current_generation, retired_root_source_error_code) =
                    match table.get_root(request.root_handle()) {
                        Ok(_) => {
                            return Err(NativeRootBridgeRequestError::RootHandleStillActive {
                                handle: request.root_handle(),
                            });
                        }
                        Err(
                            error @ BridgeHandleTableError::StaleHandle {
                                current_generation, ..
                            },
                        ) => (current_generation, Some(error.code())),
                        Err(error) => return Err(NativeRootBridgeRequestError::HandleTable(error)),
                    };

                Ok(NativeRootBridgeHandleTableAdmissionSmokeRecord::new(
                    request,
                    NativeRootBridgeLifecycleTransition::ActiveToRetired,
                    root_handle_state_before,
                    NativeRootBridgeRootHandleState::Retired,
                    NativeRootBridgeHandleAdmissionAction::RetireRoot,
                    retired_root_current_generation,
                    None,
                    None,
                    retired_root_source_error_code,
                ))
            }
        }
    }

    fn preflight_handoff_sequence_admission(
        request: NativeRootBridgeRequestRecord,
        root_handle_state_before: Option<NativeRootBridgeRootHandleState>,
    ) -> Result<(), NativeRootBridgeRequestError> {
        match root_handle_state_before {
            None => {
                if request.kind() == NativeRootBridgeRequestKind::Create {
                    Ok(())
                } else {
                    Err(NativeRootBridgeRequestError::SequenceMustStartWithCreate {
                        actual: request.kind(),
                    })
                }
            }
            Some(NativeRootBridgeRootHandleState::Active) => {
                if request.kind() == NativeRootBridgeRequestKind::Create {
                    Err(NativeRootBridgeRequestError::CreateAfterRootCreated {
                        request_id: request.request_id(),
                    })
                } else {
                    Ok(())
                }
            }
            Some(NativeRootBridgeRootHandleState::Retired) => {
                Err(NativeRootBridgeRequestError::RequestAfterUnmount {
                    request_id: request.request_id(),
                })
            }
        }
    }

    fn prevalidate_handoff_lifecycle(
        validator: &NativeRootBridgeRequestSequenceValidator,
        request: NativeRootBridgeRequestRecord,
    ) -> Result<(), NativeRootBridgeRequestError> {
        if let Some(previous_request_id) = validator.last_request_id()
            && request.request_id() <= previous_request_id
        {
            return Err(NativeRootBridgeRequestError::RequestSequenceOutOfOrder {
                previous_request_id,
                request_id: request.request_id(),
            });
        }

        if validator.root_retired() {
            return Err(NativeRootBridgeRequestError::RequestAfterUnmount {
                request_id: request.request_id(),
            });
        }

        match (validator.root_handle(), request.kind()) {
            (None, NativeRootBridgeRequestKind::Create)
            | (
                Some(_),
                NativeRootBridgeRequestKind::Render | NativeRootBridgeRequestKind::Unmount,
            ) => Ok(()),
            (None, actual) => {
                Err(NativeRootBridgeRequestError::SequenceMustStartWithCreate { actual })
            }
            (Some(_), NativeRootBridgeRequestKind::Create) => {
                Err(NativeRootBridgeRequestError::CreateAfterRootCreated {
                    request_id: request.request_id(),
                })
            }
        }
    }

    const fn get_lifecycle_transition_for_request(
        kind: NativeRootBridgeRequestKind,
    ) -> NativeRootBridgeLifecycleTransition {
        match kind {
            NativeRootBridgeRequestKind::Create => {
                NativeRootBridgeLifecycleTransition::NoneToActive
            }
            NativeRootBridgeRequestKind::Render => {
                NativeRootBridgeLifecycleTransition::ActiveToActive
            }
            NativeRootBridgeRequestKind::Unmount => {
                NativeRootBridgeLifecycleTransition::ActiveToRetired
            }
        }
    }

    const fn lifecycle_state_for_root_handle_state(
        state: Option<NativeRootBridgeRootHandleState>,
    ) -> NativeRootBridgeBatchedJsonTransportLifecycleState {
        match state {
            None => NativeRootBridgeBatchedJsonTransportLifecycleState::None,
            Some(NativeRootBridgeRootHandleState::Active) => {
                NativeRootBridgeBatchedJsonTransportLifecycleState::Active
            }
            Some(NativeRootBridgeRootHandleState::Retired) => {
                NativeRootBridgeBatchedJsonTransportLifecycleState::Retired
            }
        }
    }

    pub(crate) fn validate_native_root_bridge_json_batch_lifecycle_executor_source_rows(
        executor: &NativeRootBridgeJsonBatchLifecycleExecutor,
        candidate_rows: &[NativeRootBridgeJsonBatchLifecycleExecutorRow],
    ) -> Result<(), &'static str> {
        if has_native_root_bridge_json_batch_lifecycle_executor_public_native_claim(executor) {
            return Err(
                NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE,
            );
        }

        let expected_rows = executor.rows();

        if candidate_rows.len() != expected_rows.len() {
            return Err(NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_CALLER_BUILT_ROW_CODE);
        }

        for (candidate, expected) in candidate_rows.iter().zip(expected_rows) {
            if has_native_root_bridge_json_batch_lifecycle_executor_row_public_native_claim(
                candidate,
            ) {
                return Err(
                    NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE,
                );
            }

            if !candidate.source_owned_json_row() || !candidate.rust_state_machine_execution() {
                return Err(NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_CALLER_BUILT_ROW_CODE);
            }

            if !native_root_bridge_json_batch_lifecycle_executor_source_guard_matches(
                executor, candidate,
            ) {
                return Err(
                    NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STALE_OR_FOREIGN_ROW_CODE,
                );
            }

            if !native_root_bridge_json_batch_lifecycle_executor_rows_match_source(
                candidate, expected,
            ) {
                return Err(
                    NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STALE_OR_FOREIGN_ROW_CODE,
                );
            }
        }

        Ok(())
    }

    fn validate_and_consume_native_root_bridge_json_batch_lifecycle_executor(
        executor: &NativeRootBridgeJsonBatchLifecycleExecutor,
    ) -> Result<(), &'static str> {
        validate_native_root_bridge_json_batch_lifecycle_executor_source_rows(
            executor,
            executor.rows(),
        )?;

        let consumed_generations =
            CONSUMED_NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_GENERATIONS
                .get_or_init(|| Mutex::new(HashSet::new()));
        let mut consumed_generations = consumed_generations
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        if consumed_generations.insert(executor.executor_generation()) {
            return Ok(());
        }

        Err(NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STALE_OR_FOREIGN_ROW_CODE)
    }

    fn native_root_bridge_json_batch_lifecycle_executor_source_guard_matches(
        executor: &NativeRootBridgeJsonBatchLifecycleExecutor,
        row: &NativeRootBridgeJsonBatchLifecycleExecutorRow,
    ) -> bool {
        let guard = row.source_guard();

        guard.executor_generation() == executor.executor_generation()
            && guard.batch_index() == row.batch_index()
            && guard.request_id() == row.request_id()
            && guard.kind() == row.kind()
            && guard.table_environment_id() == row.source_environment_id()
            && guard.source_root_handle() == row.source_root_handle()
            && guard.source_root_id() == row.source_root_id()
            && guard.root_handle_current_generation() == row.root_handle_current_generation()
            && guard.source_value_handle() == row.source_value_handle()
            && guard.value_handle_current_generation() == row.value_handle_current_generation()
    }

    fn native_root_bridge_json_batch_lifecycle_executor_rows_match_source(
        candidate: &NativeRootBridgeJsonBatchLifecycleExecutorRow,
        expected: &NativeRootBridgeJsonBatchLifecycleExecutorRow,
    ) -> bool {
        candidate.id() == expected.id()
            && candidate.batch_index() == expected.batch_index()
            && candidate.request_id() == expected.request_id()
            && candidate.kind() == expected.kind()
            && candidate.source_environment_id() == expected.source_environment_id()
            && candidate.source_root_handle() == expected.source_root_handle()
            && candidate.source_root_id() == expected.source_root_id()
            && candidate.source_value_handle() == expected.source_value_handle()
            && candidate.lifecycle_before() == expected.lifecycle_before()
            && candidate.lifecycle_after() == expected.lifecycle_after()
            && candidate.lifecycle_transition() == expected.lifecycle_transition()
            && candidate.root_handle_state_before() == expected.root_handle_state_before()
            && candidate.root_handle_state_after() == expected.root_handle_state_after()
            && candidate.root_handle_action() == expected.root_handle_action()
            && candidate.root_handle_current_generation()
                == expected.root_handle_current_generation()
            && candidate.value_handle_action() == expected.value_handle_action()
            && candidate.value_handle_current_generation()
                == expected.value_handle_current_generation()
            && candidate.retired_root_source_error_code()
                == expected.retired_root_source_error_code()
            && candidate.root_handle_validated() == expected.root_handle_validated()
            && candidate.value_handle_validated() == expected.value_handle_validated()
            && candidate.status() == expected.status()
            && candidate.code() == expected.code()
            && candidate.source_error_code() == expected.source_error_code()
            && candidate.boundary_error_code() == expected.boundary_error_code()
            && candidate.source_owned_json_row() == expected.source_owned_json_row()
            && candidate.source_guard() == expected.source_guard()
    }

    fn boundary_code_for_batch_lifecycle_error(
        error: &NativeRootBridgeRequestError,
    ) -> &'static str {
        match error {
            NativeRootBridgeRequestError::HandleTable(
                BridgeHandleTableError::WrongEnvironment { .. },
            )
            | NativeRootBridgeRequestError::RecordEnvironmentMismatch { .. } => {
                super::NativeBoundaryErrorKind::RootBridgeWrongEnvironment.code()
            }
            NativeRootBridgeRequestError::HandleTable(
                BridgeHandleTableError::StaleHandle { .. }
                | BridgeHandleTableError::DisposedHandle { .. },
            )
            | NativeRootBridgeRequestError::ReusedValueHandle { .. } => {
                super::NativeBoundaryErrorKind::RootBridgeStaleHandle.code()
            }
            NativeRootBridgeRequestError::RecordRootHandleStateMismatch { .. }
            | NativeRootBridgeRequestError::RootHandleStillActive { .. }
            | NativeRootBridgeRequestError::SequenceMustStartWithCreate { .. }
            | NativeRootBridgeRequestError::CreateAfterRootCreated { .. }
            | NativeRootBridgeRequestError::RequestAfterUnmount { .. }
            | NativeRootBridgeRequestError::RequestSequenceOutOfOrder { .. }
            | NativeRootBridgeRequestError::RequestSequenceExhausted
            | NativeRootBridgeRequestError::ExecutorGenerationExhausted => {
                super::NativeBoundaryErrorKind::RootBridgeWrongLifecycleOrder.code()
            }
            NativeRootBridgeRequestError::HandleTable(_)
            | NativeRootBridgeRequestError::RecordRootHandleMismatch { .. }
            | NativeRootBridgeRequestError::RecordRootIdMismatch { .. }
            | NativeRootBridgeRequestError::UnexpectedValueHandle { .. }
            | NativeRootBridgeRequestError::JsonTransportRecordInvalid { .. } => {
                super::NativeBoundaryErrorKind::RootBridgeValidationFailed.code()
            }
        }
    }

    fn value_handoff_admission_action(
        admission: crate::handle_table::BridgeHandleAdmission,
    ) -> NativeRootBridgeHandleAdmissionAction {
        match admission.outcome() {
            BridgeHandleAdmissionOutcome::Admitted => {
                NativeRootBridgeHandleAdmissionAction::AdmitValue
            }
            BridgeHandleAdmissionOutcome::Validated => {
                NativeRootBridgeHandleAdmissionAction::ValidateValue
            }
        }
    }

    fn validate_create_record(
        table: &BridgeHandleTable,
        request: NativeRootBridgeRequestRecord,
    ) -> Result<NativeRootBridgeRequestValidationRecord, NativeRootBridgeRequestError> {
        validate_record_environment(table, request)?;
        validate_root_handle_state(request, NativeRootBridgeRootHandleState::Active)?;

        let root = table.get_root(request.root_handle())?;
        validate_root_id(request, root.root_id())?;
        let value_handle_validated = validate_optional_value_handle(table, request)?;

        Ok(NativeRootBridgeRequestValidationRecord::from_request(
            request,
            NativeRootBridgeLifecycleTransition::NoneToActive,
            value_handle_validated,
        ))
    }

    fn validate_render_record(
        table: &BridgeHandleTable,
        request: NativeRootBridgeRequestRecord,
    ) -> Result<NativeRootBridgeRequestValidationRecord, NativeRootBridgeRequestError> {
        validate_record_environment(table, request)?;
        validate_root_handle_state(request, NativeRootBridgeRootHandleState::Active)?;

        let root = table.get_root(request.root_handle())?;
        validate_root_id(request, root.root_id())?;
        let value_handle_validated = validate_optional_value_handle(table, request)?;

        Ok(NativeRootBridgeRequestValidationRecord::from_request(
            request,
            NativeRootBridgeLifecycleTransition::ActiveToActive,
            value_handle_validated,
        ))
    }

    fn validate_unmount_record(
        table: &BridgeHandleTable,
        request: NativeRootBridgeRequestRecord,
    ) -> Result<NativeRootBridgeRequestValidationRecord, NativeRootBridgeRequestError> {
        validate_record_environment(table, request)?;
        validate_root_handle_state(request, NativeRootBridgeRootHandleState::Retired)?;

        if let Some(value_handle) = request.value_handle() {
            return Err(NativeRootBridgeRequestError::UnexpectedValueHandle {
                kind: request.kind(),
                value_handle,
            });
        }

        match table.get_root(request.root_handle()) {
            Ok(_) => Err(NativeRootBridgeRequestError::RootHandleStillActive {
                handle: request.root_handle(),
            }),
            Err(BridgeHandleTableError::StaleHandle { .. }) => {
                Ok(NativeRootBridgeRequestValidationRecord::from_request(
                    request,
                    NativeRootBridgeLifecycleTransition::ActiveToRetired,
                    false,
                ))
            }
            Err(error) => Err(NativeRootBridgeRequestError::HandleTable(error)),
        }
    }

    fn validate_sequence_root_identity(
        request: NativeRootBridgeRequestRecord,
        expected_root_handle: BridgeHandle,
        expected_root_id: u64,
    ) -> Result<(), NativeRootBridgeRequestError> {
        if request.root_handle() != expected_root_handle {
            return Err(NativeRootBridgeRequestError::RecordRootHandleMismatch {
                expected: expected_root_handle,
                actual: request.root_handle(),
            });
        }

        if request.root_id() != expected_root_id {
            return Err(NativeRootBridgeRequestError::RecordRootIdMismatch {
                expected: expected_root_id,
                actual: request.root_id(),
            });
        }

        Ok(())
    }

    fn validate_record_environment(
        table: &BridgeHandleTable,
        request: NativeRootBridgeRequestRecord,
    ) -> Result<(), NativeRootBridgeRequestError> {
        if request.environment_id() == table.environment_id() {
            return Ok(());
        }

        Err(NativeRootBridgeRequestError::RecordEnvironmentMismatch {
            record_environment_id: request.environment_id(),
            table_environment_id: table.environment_id(),
        })
    }

    fn validate_root_handle_state(
        request: NativeRootBridgeRequestRecord,
        expected: NativeRootBridgeRootHandleState,
    ) -> Result<(), NativeRootBridgeRequestError> {
        let actual = request.root_handle_state();
        if actual == expected {
            return Ok(());
        }

        Err(NativeRootBridgeRequestError::RecordRootHandleStateMismatch { expected, actual })
    }

    fn validate_root_id(
        request: NativeRootBridgeRequestRecord,
        actual: u64,
    ) -> Result<(), NativeRootBridgeRequestError> {
        if request.root_id() == actual {
            return Ok(());
        }

        Err(NativeRootBridgeRequestError::RecordRootIdMismatch {
            expected: request.root_id(),
            actual,
        })
    }

    fn validate_optional_value_handle(
        table: &BridgeHandleTable,
        request: NativeRootBridgeRequestRecord,
    ) -> Result<bool, NativeRootBridgeRequestError> {
        let Some(value_handle) = request.value_handle() else {
            return Ok(false);
        };

        table.get_value(value_handle)?;
        Ok(true)
    }

    fn parse_json_transport_envelope(
        value: &Value,
    ) -> Result<ParsedJsonTransportEnvelope, NativeRootBridgeJsonTransportParseError> {
        let object = expect_exact_json_object(
            value,
            "$",
            super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_ENVELOPE_FIELDS,
        )?;
        let transport = expect_exact_string_value(
            expect_json_field(
                object,
                "$",
                super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_ENVELOPE_FIELDS[0],
            )?,
            "$.transport",
            super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_FORMAT,
        )?;
        let schema_version = expect_exact_schema_version(expect_json_field(
            object,
            "$",
            super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_ENVELOPE_FIELDS[1],
        )?)?;
        let request_records = expect_json_array(
            expect_json_field(
                object,
                "$",
                super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_ENVELOPE_FIELDS[2],
            )?,
            "$.requestRecords",
        )?
        .iter()
        .enumerate()
        .map(|(index, record)| parse_json_transport_record(record, index))
        .collect::<Result<Vec<_>, _>>()?;

        Ok(ParsedJsonTransportEnvelope {
            transport,
            schema_version,
            request_records,
        })
    }

    fn parse_json_transport_record(
        value: &Value,
        index: usize,
    ) -> Result<NativeRootBridgeJsonTransportRecord, NativeRootBridgeJsonTransportParseError> {
        let path = format!("$.requestRecords[{index}]");
        let object = expect_exact_json_object(
            value,
            &path,
            super::NATIVE_ROOT_BRIDGE_RUST_REQUEST_RECORD_FIELDS,
        )?;
        let request_id = expect_positive_u64(
            expect_json_field(
                object,
                &path,
                super::NATIVE_ROOT_BRIDGE_RUST_REQUEST_RECORD_FIELDS[0],
            )?,
            &format!("{path}.request_id"),
        )?;
        let kind = expect_string_code(
            expect_json_field(
                object,
                &path,
                super::NATIVE_ROOT_BRIDGE_RUST_REQUEST_RECORD_FIELDS[1],
            )?,
            &format!("{path}.kind"),
            super::NATIVE_ROOT_BRIDGE_REQUEST_KIND_CODES,
        )?;
        let environment_id = expect_positive_u64(
            expect_json_field(
                object,
                &path,
                super::NATIVE_ROOT_BRIDGE_RUST_REQUEST_RECORD_FIELDS[2],
            )?,
            &format!("{path}.environment_id"),
        )?;
        let root_handle = parse_json_transport_handle(
            expect_json_field(
                object,
                &path,
                super::NATIVE_ROOT_BRIDGE_RUST_REQUEST_RECORD_FIELDS[3],
            )?,
            &format!("{path}.root_handle"),
        )?;
        let root_id = expect_positive_u64(
            expect_json_field(
                object,
                &path,
                super::NATIVE_ROOT_BRIDGE_RUST_REQUEST_RECORD_FIELDS[4],
            )?,
            &format!("{path}.root_id"),
        )?;
        let value_handle_value = expect_json_field(
            object,
            &path,
            super::NATIVE_ROOT_BRIDGE_RUST_REQUEST_RECORD_FIELDS[5],
        )?;
        let value_handle = if value_handle_value.is_null() {
            None
        } else {
            Some(parse_json_transport_handle(
                value_handle_value,
                &format!("{path}.value_handle"),
            )?)
        };
        let root_handle_state = expect_string_code(
            expect_json_field(
                object,
                &path,
                super::NATIVE_ROOT_BRIDGE_RUST_REQUEST_RECORD_FIELDS[6],
            )?,
            &format!("{path}.root_handle_state"),
            super::NATIVE_ROOT_BRIDGE_ROOT_HANDLE_STATE_CODES,
        )?;

        Ok(NativeRootBridgeJsonTransportRecord::new(
            request_id,
            kind,
            environment_id,
            root_handle,
            root_id,
            value_handle,
            root_handle_state,
        ))
    }

    fn parse_json_transport_handle(
        value: &Value,
        path: &str,
    ) -> Result<NativeRootBridgeJsonTransportHandle, NativeRootBridgeJsonTransportParseError> {
        let object =
            expect_exact_json_object(value, path, super::NATIVE_ROOT_BRIDGE_RUST_HANDLE_FIELDS)?;
        let environment_id = expect_positive_u64(
            expect_json_field(
                object,
                path,
                super::NATIVE_ROOT_BRIDGE_RUST_HANDLE_FIELDS[0],
            )?,
            &format!("{path}.environment_id"),
        )?;
        let slot = expect_positive_u64(
            expect_json_field(
                object,
                path,
                super::NATIVE_ROOT_BRIDGE_RUST_HANDLE_FIELDS[1],
            )?,
            &format!("{path}.slot"),
        )?;
        let generation = expect_positive_u64(
            expect_json_field(
                object,
                path,
                super::NATIVE_ROOT_BRIDGE_RUST_HANDLE_FIELDS[2],
            )?,
            &format!("{path}.generation"),
        )?;
        let kind = expect_string_code(
            expect_json_field(
                object,
                path,
                super::NATIVE_ROOT_BRIDGE_RUST_HANDLE_FIELDS[3],
            )?,
            &format!("{path}.kind"),
            super::NATIVE_ROOT_BRIDGE_HANDLE_KIND_CODES,
        )?;

        Ok(NativeRootBridgeJsonTransportHandle::new(
            environment_id,
            slot,
            generation,
            kind,
        ))
    }

    fn expect_exact_json_object<'a>(
        value: &'a Value,
        path: &str,
        expected_fields: &[&'static str],
    ) -> Result<&'a Map<String, Value>, NativeRootBridgeJsonTransportParseError> {
        let Value::Object(object) = value else {
            return Err(NativeRootBridgeJsonTransportParseError::ExpectedObject {
                path: path.to_owned(),
                actual: json_transport_value_kind(value),
            });
        };

        for field in expected_fields {
            if !object.contains_key(*field) {
                return Err(NativeRootBridgeJsonTransportParseError::MissingField {
                    path: path.to_owned(),
                    field,
                });
            }
        }

        if let Some(field) = object
            .keys()
            .find(|field| !expected_fields.contains(&field.as_str()))
        {
            return Err(NativeRootBridgeJsonTransportParseError::UnexpectedField {
                path: path.to_owned(),
                field: field.clone(),
            });
        }

        Ok(object)
    }

    fn expect_json_field<'a>(
        object: &'a Map<String, Value>,
        path: &str,
        field: &'static str,
    ) -> Result<&'a Value, NativeRootBridgeJsonTransportParseError> {
        object
            .get(field)
            .ok_or_else(|| NativeRootBridgeJsonTransportParseError::MissingField {
                path: path.to_owned(),
                field,
            })
    }

    fn expect_json_array<'a>(
        value: &'a Value,
        path: &str,
    ) -> Result<&'a [Value], NativeRootBridgeJsonTransportParseError> {
        match value {
            Value::Array(items) => Ok(items),
            _ => Err(NativeRootBridgeJsonTransportParseError::InvalidFieldType {
                path: path.to_owned(),
                expected: "array",
                actual: json_transport_value_kind(value),
            }),
        }
    }

    fn expect_positive_u64(
        value: &Value,
        path: &str,
    ) -> Result<u64, NativeRootBridgeJsonTransportParseError> {
        let Some(number) = value.as_u64() else {
            return Err(NativeRootBridgeJsonTransportParseError::InvalidFieldType {
                path: path.to_owned(),
                expected: "positive integer",
                actual: json_transport_value_kind(value),
            });
        };

        if number > 0 {
            return Ok(number);
        }

        Err(
            NativeRootBridgeJsonTransportParseError::UnsupportedFieldValue {
                path: path.to_owned(),
                expected: "positive integer",
                actual: number.to_string(),
            },
        )
    }

    fn expect_exact_schema_version(
        value: &Value,
    ) -> Result<u32, NativeRootBridgeJsonTransportParseError> {
        let Some(number) = value.as_u64() else {
            return Err(NativeRootBridgeJsonTransportParseError::InvalidFieldType {
                path: "$.schemaVersion".to_owned(),
                expected: "integer",
                actual: json_transport_value_kind(value),
            });
        };

        if number == u64::from(super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_SCHEMA_VERSION) {
            return Ok(super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_SCHEMA_VERSION);
        }

        Err(
            NativeRootBridgeJsonTransportParseError::UnsupportedFieldValue {
                path: "$.schemaVersion".to_owned(),
                expected: "1",
                actual: number.to_string(),
            },
        )
    }

    fn expect_exact_string_value(
        value: &Value,
        path: &str,
        expected: &'static str,
    ) -> Result<&'static str, NativeRootBridgeJsonTransportParseError> {
        let Some(actual) = value.as_str() else {
            return Err(NativeRootBridgeJsonTransportParseError::InvalidFieldType {
                path: path.to_owned(),
                expected: "string",
                actual: json_transport_value_kind(value),
            });
        };

        if actual == expected {
            return Ok(expected);
        }

        Err(
            NativeRootBridgeJsonTransportParseError::UnsupportedFieldValue {
                path: path.to_owned(),
                expected,
                actual: actual.to_owned(),
            },
        )
    }

    fn expect_string_code(
        value: &Value,
        path: &str,
        codes: &[&'static str],
    ) -> Result<&'static str, NativeRootBridgeJsonTransportParseError> {
        let Some(actual) = value.as_str() else {
            return Err(NativeRootBridgeJsonTransportParseError::InvalidFieldType {
                path: path.to_owned(),
                expected: "string",
                actual: json_transport_value_kind(value),
            });
        };

        codes
            .iter()
            .copied()
            .find(|code| *code == actual)
            .ok_or_else(
                || NativeRootBridgeJsonTransportParseError::UnsupportedFieldValue {
                    path: path.to_owned(),
                    expected: "known code",
                    actual: actual.to_owned(),
                },
            )
    }

    fn json_transport_value_kind(value: &Value) -> NativeRootBridgeJsonTransportValueKind {
        match value {
            Value::Null => NativeRootBridgeJsonTransportValueKind::Null,
            Value::Bool(_) => NativeRootBridgeJsonTransportValueKind::Boolean,
            Value::Number(_) => NativeRootBridgeJsonTransportValueKind::Number,
            Value::String(_) => NativeRootBridgeJsonTransportValueKind::String,
            Value::Array(_) => NativeRootBridgeJsonTransportValueKind::Array,
            Value::Object(_) => NativeRootBridgeJsonTransportValueKind::Object,
        }
    }

    fn decode_json_transport_request_kind(
        field: &'static str,
        value: &'static str,
    ) -> Result<NativeRootBridgeRequestKind, NativeRootBridgeRequestError> {
        match value {
            "create" => Ok(NativeRootBridgeRequestKind::Create),
            "render" => Ok(NativeRootBridgeRequestKind::Render),
            "unmount" => Ok(NativeRootBridgeRequestKind::Unmount),
            _ => Err(NativeRootBridgeRequestError::JsonTransportRecordInvalid { field, value }),
        }
    }

    fn decode_json_transport_handle_kind(
        field: &'static str,
        value: &'static str,
    ) -> Result<crate::handle_table::BridgeHandleKind, NativeRootBridgeRequestError> {
        match value {
            "root" => Ok(crate::handle_table::BridgeHandleKind::Root),
            "value" => Ok(crate::handle_table::BridgeHandleKind::Value),
            _ => Err(NativeRootBridgeRequestError::JsonTransportRecordInvalid { field, value }),
        }
    }

    fn decode_json_transport_root_handle_state(
        field: &'static str,
        value: &'static str,
    ) -> Result<NativeRootBridgeRootHandleState, NativeRootBridgeRequestError> {
        match value {
            "active" => Ok(NativeRootBridgeRootHandleState::Active),
            "retired" => Ok(NativeRootBridgeRootHandleState::Retired),
            _ => Err(NativeRootBridgeRequestError::JsonTransportRecordInvalid { field, value }),
        }
    }

