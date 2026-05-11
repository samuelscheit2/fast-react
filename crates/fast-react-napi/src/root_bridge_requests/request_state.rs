    #[derive(Debug, Clone)]
    pub(crate) struct NativeRootBridgeRequestSequenceValidator {
        root_handle: Option<BridgeHandle>,
        root_id: Option<u64>,
        last_request_id: Option<u64>,
        root_retired: bool,
    }

    impl Default for NativeRootBridgeRequestSequenceValidator {
        fn default() -> Self {
            Self::new()
        }
    }

    impl NativeRootBridgeRequestSequenceValidator {
        #[must_use]
        pub(crate) const fn new() -> Self {
            Self {
                root_handle: None,
                root_id: None,
                last_request_id: None,
                root_retired: false,
            }
        }

        #[must_use]
        pub(crate) const fn root_handle(&self) -> Option<BridgeHandle> {
            self.root_handle
        }

        #[must_use]
        pub(crate) const fn root_id(&self) -> Option<u64> {
            self.root_id
        }

        #[must_use]
        pub(crate) const fn last_request_id(&self) -> Option<u64> {
            self.last_request_id
        }

        #[must_use]
        pub(crate) const fn root_retired(&self) -> bool {
            self.root_retired
        }

        pub(crate) fn validate_next(
            &mut self,
            table: &BridgeHandleTable,
            request: NativeRootBridgeRequestRecord,
        ) -> Result<NativeRootBridgeRequestValidationRecord, NativeRootBridgeRequestError> {
            self.validate_request_order(request.request_id())?;

            if self.root_retired {
                return Err(NativeRootBridgeRequestError::RequestAfterUnmount {
                    request_id: request.request_id(),
                });
            }

            let validation = match self.root_handle {
                None => {
                    if request.kind() != NativeRootBridgeRequestKind::Create {
                        return Err(NativeRootBridgeRequestError::SequenceMustStartWithCreate {
                            actual: request.kind(),
                        });
                    }

                    validate_create_record(table, request)?
                }
                Some(root_handle) => {
                    if request.kind() == NativeRootBridgeRequestKind::Create {
                        return Err(NativeRootBridgeRequestError::CreateAfterRootCreated {
                            request_id: request.request_id(),
                        });
                    }

                    validate_sequence_root_identity(
                        request,
                        root_handle,
                        self.root_id
                            .expect("root id is present when root handle is set"),
                    )?;

                    match request.kind() {
                        NativeRootBridgeRequestKind::Create => {
                            unreachable!("create requests are rejected above")
                        }
                        NativeRootBridgeRequestKind::Render => {
                            validate_render_record(table, request)?
                        }
                        NativeRootBridgeRequestKind::Unmount => {
                            validate_unmount_record(table, request)?
                        }
                    }
                }
            };

            self.last_request_id = Some(request.request_id());

            if self.root_handle.is_none() {
                self.root_handle = Some(request.root_handle());
                self.root_id = Some(request.root_id());
            }

            if request.kind() == NativeRootBridgeRequestKind::Unmount {
                self.root_retired = true;
            }

            Ok(validation)
        }

        fn validate_request_order(
            &self,
            request_id: u64,
        ) -> Result<(), NativeRootBridgeRequestError> {
            let Some(previous_request_id) = self.last_request_id else {
                return Ok(());
            };

            if request_id > previous_request_id {
                return Ok(());
            }

            Err(NativeRootBridgeRequestError::RequestSequenceOutOfOrder {
                previous_request_id,
                request_id,
            })
        }
    }

    #[derive(Debug, Clone)]
    pub(crate) struct NativeRootBridgeRequestRecorder {
        next_request_id: u64,
    }

    impl Default for NativeRootBridgeRequestRecorder {
        fn default() -> Self {
            Self::new()
        }
    }

    impl NativeRootBridgeRequestRecorder {
        #[must_use]
        pub(crate) const fn new() -> Self {
            Self { next_request_id: 1 }
        }

        pub(crate) fn record_create_root(
            &mut self,
            table: &mut BridgeHandleTable,
            request: NativeRootBridgeCreateRequest,
        ) -> Result<NativeRootBridgeRequestRecord, NativeRootBridgeRequestError> {
            if let Some(container_handle) = request.container_handle() {
                table.get_value(container_handle)?;
            }

            let request_id = self.allocate_request_id()?;
            let root_handle = table.insert_root(PlaceholderRootRecord::new(request.root_id()));

            Ok(NativeRootBridgeRequestRecord::new(
                request_id,
                NativeRootBridgeRequestKind::Create,
                table.environment_id(),
                root_handle,
                request.root_id(),
                request.container_handle(),
                NativeRootBridgeRootHandleState::Active,
            ))
        }

        pub(crate) fn record_render(
            &mut self,
            table: &BridgeHandleTable,
            request: NativeRootBridgeRenderRequest,
        ) -> Result<NativeRootBridgeRequestRecord, NativeRootBridgeRequestError> {
            let root = table.get_root(request.root_handle())?;

            if let Some(element_handle) = request.element_handle() {
                table.get_value(element_handle)?;
            }

            let request_id = self.allocate_request_id()?;

            Ok(NativeRootBridgeRequestRecord::new(
                request_id,
                NativeRootBridgeRequestKind::Render,
                table.environment_id(),
                request.root_handle(),
                root.root_id(),
                request.element_handle(),
                NativeRootBridgeRootHandleState::Active,
            ))
        }

        pub(crate) fn record_unmount(
            &mut self,
            table: &mut BridgeHandleTable,
            request: NativeRootBridgeUnmountRequest,
        ) -> Result<NativeRootBridgeRequestRecord, NativeRootBridgeRequestError> {
            let root_id = table.get_root(request.root_handle())?.root_id();
            let request_id = self.allocate_request_id()?;
            let removed = table.remove_root(request.root_handle())?;
            debug_assert_eq!(removed.root_id(), root_id);

            Ok(NativeRootBridgeRequestRecord::new(
                request_id,
                NativeRootBridgeRequestKind::Unmount,
                table.environment_id(),
                request.root_handle(),
                root_id,
                None,
                NativeRootBridgeRootHandleState::Retired,
            ))
        }

        fn allocate_request_id(&mut self) -> Result<u64, NativeRootBridgeRequestError> {
            let request_id = self.next_request_id;
            self.next_request_id = self
                .next_request_id
                .checked_add(1)
                .ok_or(NativeRootBridgeRequestError::RequestSequenceExhausted)?;
            Ok(request_id)
        }
    }

    pub(crate) fn smoke_admit_js_native_root_bridge_handoff_records(
        requests: &[NativeRootBridgeRequestRecord],
    ) -> Result<NativeRootBridgeHandleTableAdmissionSmoke, NativeRootBridgeRequestError> {
        Ok(
            execute_native_root_bridge_json_batch_lifecycle_requests(requests)?
                .handle_table_admission_smoke(),
        )
    }

    pub(crate) fn native_root_bridge_json_batch_lifecycle_executor_for_json(
        json: &str,
    ) -> Result<NativeRootBridgeJsonBatchLifecycleExecutor, NativeRootBridgeJsonTransportParseError>
    {
        let (_, executor, _) = parse_json_transport_payload_for_gate(json)?;
        Ok(executor)
    }

    pub(crate) fn native_root_bridge_json_batch_lifecycle_executor_for_records(
        records: &[NativeRootBridgeJsonTransportRecord],
    ) -> Result<NativeRootBridgeJsonBatchLifecycleExecutor, NativeRootBridgeRequestError> {
        let requests = records
            .iter()
            .copied()
            .map(NativeRootBridgeJsonTransportRecord::decode)
            .collect::<Result<Vec<_>, _>>()?;

        execute_native_root_bridge_json_batch_lifecycle_requests(&requests)
    }

