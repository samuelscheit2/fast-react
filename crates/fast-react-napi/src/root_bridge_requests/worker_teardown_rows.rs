    #[derive(Debug, Clone, Copy)]
    struct NativeRootBridgeBatchLifecycleConsumerJsonRoundtripLinkRowSources<'a> {
        index: usize,
        batch_id: &'static str,
        stream_id: &'static str,
        consumer_row: Option<&'a NativeRootBridgeBatchLifecycleConsumerRow>,
        lifecycle_row: Option<&'a NativeRootBridgeBatchedJsonTransportLifecycleRow>,
        response_row: Option<&'a NativeRootBridgeBatchResponseSequenceRow>,
        stream_metadata_row: Option<&'a NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow>,
        stream_payload_row: Option<&'a NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow>,
        smoke_record: Option<NativeRootBridgeHandleTableAdmissionSmokeRecord>,
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeTransportWorkerThreadTeardownRow {
        id: &'static str,
        operation: &'static str,
        worker_thread_id: u64,
        transport: &'static str,
        source_batch_index: Option<usize>,
        request_id: Option<u64>,
        handle_kind: BridgeHandleKind,
        table_environment_id: BridgeEnvironmentId,
        handle_environment_id: BridgeEnvironmentId,
        slot: u64,
        handle_generation: u64,
        current_generation: Option<u64>,
        record_id: Option<u64>,
        error_code: Option<&'static str>,
        boundary_error_code: Option<&'static str>,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeTransportWorkerThreadTeardownRow {
        fn active_root(
            id: &'static str,
            operation: &'static str,
            worker_thread_id: u64,
            table: &BridgeHandleTable,
            handle: BridgeHandle,
            record_id: u64,
        ) -> Self {
            Self::new(NativeRootBridgeTransportWorkerThreadTeardownRowInit {
                id,
                operation,
                worker_thread_id,
                source_batch_index: None,
                request_id: None,
                handle,
                table_environment_id: table.environment_id(),
                current_generation: Some(handle.generation()),
                record_id: Some(record_id),
                error_code: None,
                boundary_error_code: None,
            })
        }

        fn rejected(init: NativeRootBridgeTransportWorkerThreadTeardownRejectedRowInit) -> Self {
            let current_generation = match init.error {
                BridgeHandleTableError::StaleHandle {
                    current_generation, ..
                } => Some(current_generation),
                _ => None,
            };
            let boundary_error_code = match init.error {
                BridgeHandleTableError::WrongEnvironment { .. } => {
                    Some(super::NativeBoundaryErrorKind::RootBridgeWrongEnvironment.code())
                }
                BridgeHandleTableError::StaleHandle { .. }
                | BridgeHandleTableError::DisposedHandle { .. } => {
                    Some(super::NativeBoundaryErrorKind::RootBridgeStaleHandle.code())
                }
                _ => Some(super::NativeBoundaryErrorKind::RootBridgeValidationFailed.code()),
            };

            Self::new(NativeRootBridgeTransportWorkerThreadTeardownRowInit {
                id: init.id,
                operation: init.operation,
                worker_thread_id: init.worker_thread_id,
                source_batch_index: Some(init.source_batch_index),
                request_id: Some(init.request_id),
                handle: init.handle,
                table_environment_id: init.table_environment_id,
                current_generation,
                record_id: None,
                error_code: Some(init.error.code()),
                boundary_error_code,
            })
        }

        const fn new(init: NativeRootBridgeTransportWorkerThreadTeardownRowInit) -> Self {
            Self {
                id: init.id,
                operation: init.operation,
                worker_thread_id: init.worker_thread_id,
                transport: super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_FORMAT,
                source_batch_index: init.source_batch_index,
                request_id: init.request_id,
                handle_kind: init.handle.kind(),
                table_environment_id: init.table_environment_id,
                handle_environment_id: init.handle.environment_id(),
                slot: init.handle.slot(),
                handle_generation: init.handle.generation(),
                current_generation: init.current_generation,
                record_id: init.record_id,
                error_code: init.error_code,
                boundary_error_code: init.boundary_error_code,
                native_addon_loaded: false,
                native_execution: false,
                renderer_execution: false,
                reconciler_execution: false,
                react_behavior_error: false,
            }
        }

        #[must_use]
        pub(crate) const fn id(self) -> &'static str {
            self.id
        }

        #[must_use]
        pub(crate) const fn operation(self) -> &'static str {
            self.operation
        }

        #[must_use]
        pub(crate) const fn worker_thread_id(self) -> u64 {
            self.worker_thread_id
        }

        #[must_use]
        pub(crate) const fn transport(self) -> &'static str {
            self.transport
        }

        #[must_use]
        pub(crate) const fn source_batch_index(self) -> Option<usize> {
            self.source_batch_index
        }

        #[must_use]
        pub(crate) const fn request_id(self) -> Option<u64> {
            self.request_id
        }

        #[must_use]
        pub(crate) const fn handle_kind(self) -> BridgeHandleKind {
            self.handle_kind
        }

        #[must_use]
        pub(crate) const fn table_environment_id(self) -> BridgeEnvironmentId {
            self.table_environment_id
        }

        #[must_use]
        pub(crate) const fn handle_environment_id(self) -> BridgeEnvironmentId {
            self.handle_environment_id
        }

        #[must_use]
        pub(crate) const fn slot(self) -> u64 {
            self.slot
        }

        #[must_use]
        pub(crate) const fn handle_generation(self) -> u64 {
            self.handle_generation
        }

        #[must_use]
        pub(crate) const fn current_generation(self) -> Option<u64> {
            self.current_generation
        }

        #[must_use]
        pub(crate) const fn record_id(self) -> Option<u64> {
            self.record_id
        }

        #[must_use]
        pub(crate) const fn error_code(self) -> Option<&'static str> {
            self.error_code
        }

        #[must_use]
        pub(crate) const fn boundary_error_code(self) -> Option<&'static str> {
            self.boundary_error_code
        }

        #[must_use]
        pub(crate) const fn native_addon_loaded(self) -> bool {
            self.native_addon_loaded
        }

        #[must_use]
        pub(crate) const fn native_execution(self) -> bool {
            self.native_execution
        }

        #[must_use]
        pub(crate) const fn renderer_execution(self) -> bool {
            self.renderer_execution
        }

        #[must_use]
        pub(crate) const fn reconciler_execution(self) -> bool {
            self.reconciler_execution
        }

        #[must_use]
        pub(crate) const fn react_behavior_error(self) -> bool {
            self.react_behavior_error
        }
    }

    struct NativeRootBridgeTransportWorkerThreadTeardownRowInit {
        id: &'static str,
        operation: &'static str,
        worker_thread_id: u64,
        source_batch_index: Option<usize>,
        request_id: Option<u64>,
        handle: BridgeHandle,
        table_environment_id: BridgeEnvironmentId,
        current_generation: Option<u64>,
        record_id: Option<u64>,
        error_code: Option<&'static str>,
        boundary_error_code: Option<&'static str>,
    }

    struct NativeRootBridgeTransportWorkerThreadTeardownRejectedRowInit {
        id: &'static str,
        operation: &'static str,
        worker_thread_id: u64,
        source_batch_index: usize,
        request_id: u64,
        handle: BridgeHandle,
        table_environment_id: BridgeEnvironmentId,
        error: BridgeHandleTableError,
    }

