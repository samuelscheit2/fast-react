    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeJsonTransportParserGate {
        transport: &'static str,
        schema_version: u32,
        request_records: Vec<NativeRootBridgeJsonTransportRecord>,
        admission_smoke: NativeRootBridgeHandleTableAdmissionSmoke,
        json_batch_lifecycle_executor: NativeRootBridgeJsonBatchLifecycleExecutor,
        batched_record_gate: NativeRootBridgeBatchedJsonTransportGate,
        error_diagnostic_rows: Vec<NativeRootBridgeJsonTransportErrorDiagnosticRow>,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
    }

    impl NativeRootBridgeJsonTransportParserGate {
        #[must_use]
        pub(crate) fn transport(&self) -> &'static str {
            self.transport
        }

        #[must_use]
        pub(crate) fn schema_version(&self) -> u32 {
            self.schema_version
        }

        #[must_use]
        pub(crate) fn request_records(&self) -> &[NativeRootBridgeJsonTransportRecord] {
            &self.request_records
        }

        #[must_use]
        pub(crate) fn admission_smoke(&self) -> &NativeRootBridgeHandleTableAdmissionSmoke {
            &self.admission_smoke
        }

        #[must_use]
        pub(crate) fn json_batch_lifecycle_executor(
            &self,
        ) -> &NativeRootBridgeJsonBatchLifecycleExecutor {
            &self.json_batch_lifecycle_executor
        }

        #[must_use]
        pub(crate) fn batched_record_gate(&self) -> &NativeRootBridgeBatchedJsonTransportGate {
            &self.batched_record_gate
        }

        #[must_use]
        pub(crate) fn error_diagnostic_rows(
            &self,
        ) -> &[NativeRootBridgeJsonTransportErrorDiagnosticRow] {
            &self.error_diagnostic_rows
        }

        #[must_use]
        pub(crate) const fn native_execution(&self) -> bool {
            self.native_execution
        }

        #[must_use]
        pub(crate) const fn renderer_execution(&self) -> bool {
            self.renderer_execution
        }

        #[must_use]
        pub(crate) const fn reconciler_execution(&self) -> bool {
            self.reconciler_execution
        }
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeBatchedJsonTransportGate {
        status: &'static str,
        request_count: usize,
        lifecycle_rows: Vec<NativeRootBridgeBatchedJsonTransportLifecycleRow>,
        error_rows: Vec<NativeRootBridgeBatchedJsonTransportLifecycleRow>,
        response_sequence_gate: NativeRootBridgeBatchResponseSequenceGate,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
    }

    impl NativeRootBridgeBatchedJsonTransportGate {
        #[must_use]
        pub(crate) const fn status(&self) -> &'static str {
            self.status
        }

        #[must_use]
        pub(crate) const fn request_count(&self) -> usize {
            self.request_count
        }

        #[must_use]
        pub(crate) fn lifecycle_rows(&self) -> &[NativeRootBridgeBatchedJsonTransportLifecycleRow] {
            &self.lifecycle_rows
        }

        #[must_use]
        pub(crate) fn error_rows(&self) -> &[NativeRootBridgeBatchedJsonTransportLifecycleRow] {
            &self.error_rows
        }

        #[must_use]
        pub(crate) const fn response_sequence_gate(
            &self,
        ) -> &NativeRootBridgeBatchResponseSequenceGate {
            &self.response_sequence_gate
        }

        #[must_use]
        pub(crate) const fn native_addon_loaded(&self) -> bool {
            self.native_addon_loaded
        }

        #[must_use]
        pub(crate) const fn native_execution(&self) -> bool {
            self.native_execution
        }

        #[must_use]
        pub(crate) const fn renderer_execution(&self) -> bool {
            self.renderer_execution
        }

        #[must_use]
        pub(crate) const fn reconciler_execution(&self) -> bool {
            self.reconciler_execution
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeBatchedJsonTransportLifecycleState {
        None,
        Active,
        Retired,
    }

    impl NativeRootBridgeBatchedJsonTransportLifecycleState {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::None => "none",
                Self::Active => "active",
                Self::Retired => "retired",
            }
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeBatchedJsonTransportLifecycleStatus {
        Accepted,
        Error,
    }

    impl NativeRootBridgeBatchedJsonTransportLifecycleStatus {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::Accepted => "accepted",
                Self::Error => "error",
            }
        }
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeBatchedJsonTransportLifecycleRow {
        id: String,
        batch_index: usize,
        request_id: u64,
        kind: &'static str,
        source_environment_id: Option<BridgeEnvironmentId>,
        source_root_handle: Option<BridgeHandle>,
        source_root_id: Option<u64>,
        lifecycle_before: NativeRootBridgeBatchedJsonTransportLifecycleState,
        lifecycle_after: NativeRootBridgeBatchedJsonTransportLifecycleState,
        lifecycle_transition: Option<NativeRootBridgeLifecycleTransition>,
        status: NativeRootBridgeBatchedJsonTransportLifecycleStatus,
        code: Option<&'static str>,
        source_error_code: Option<&'static str>,
        boundary_error_code: Option<&'static str>,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeBatchedJsonTransportLifecycleRow {
        fn accepted(
            batch_index: usize,
            request: NativeRootBridgeRequestRecord,
            lifecycle_before: NativeRootBridgeBatchedJsonTransportLifecycleState,
            lifecycle_after: NativeRootBridgeBatchedJsonTransportLifecycleState,
            lifecycle_transition: NativeRootBridgeLifecycleTransition,
        ) -> Self {
            Self {
                id: format!("batch-record-{batch_index}-{}", request.kind().code()),
                batch_index,
                request_id: request.request_id(),
                kind: request.kind().code(),
                source_environment_id: Some(request.environment_id()),
                source_root_handle: Some(request.root_handle()),
                source_root_id: Some(request.root_id()),
                lifecycle_before,
                lifecycle_after,
                lifecycle_transition: Some(lifecycle_transition),
                status: NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted,
                code: None,
                source_error_code: None,
                boundary_error_code: None,
                native_addon_loaded: false,
                native_execution: false,
                renderer_execution: false,
                reconciler_execution: false,
                react_behavior_error: false,
            }
        }

        fn error(
            id: String,
            batch_index: usize,
            record: NativeRootBridgeJsonTransportRecord,
            lifecycle: NativeRootBridgeBatchedJsonTransportLifecycleState,
            error: &NativeRootBridgeRequestError,
        ) -> Self {
            Self {
                id,
                batch_index,
                request_id: record.request_id,
                kind: record.kind,
                source_environment_id: Some(BridgeEnvironmentId::from_raw(record.environment_id)),
                source_root_handle: record.root_handle.decode("root_handle.kind").ok(),
                source_root_id: Some(record.root_id),
                lifecycle_before: lifecycle,
                lifecycle_after: lifecycle,
                lifecycle_transition: None,
                status: NativeRootBridgeBatchedJsonTransportLifecycleStatus::Error,
                code: Some(error.code()),
                source_error_code: Some(error.code()),
                boundary_error_code: Some(boundary_code_for_batch_lifecycle_error(error)),
                native_addon_loaded: false,
                native_execution: false,
                renderer_execution: false,
                reconciler_execution: false,
                react_behavior_error: false,
            }
        }

        #[must_use]
        pub(crate) fn id(&self) -> &str {
            &self.id
        }

        #[must_use]
        pub(crate) const fn batch_index(&self) -> usize {
            self.batch_index
        }

        #[must_use]
        pub(crate) const fn request_id(&self) -> u64 {
            self.request_id
        }

        #[must_use]
        pub(crate) const fn kind(&self) -> &'static str {
            self.kind
        }

        #[must_use]
        pub(crate) const fn source_environment_id(&self) -> Option<BridgeEnvironmentId> {
            self.source_environment_id
        }

        #[must_use]
        pub(crate) const fn source_root_handle(&self) -> Option<BridgeHandle> {
            self.source_root_handle
        }

        #[must_use]
        pub(crate) const fn source_root_id(&self) -> Option<u64> {
            self.source_root_id
        }

        #[must_use]
        pub(crate) const fn lifecycle_before(
            &self,
        ) -> NativeRootBridgeBatchedJsonTransportLifecycleState {
            self.lifecycle_before
        }

        #[must_use]
        pub(crate) const fn lifecycle_after(
            &self,
        ) -> NativeRootBridgeBatchedJsonTransportLifecycleState {
            self.lifecycle_after
        }

        #[must_use]
        pub(crate) const fn lifecycle_transition(
            &self,
        ) -> Option<NativeRootBridgeLifecycleTransition> {
            self.lifecycle_transition
        }

        #[must_use]
        pub(crate) const fn status(&self) -> NativeRootBridgeBatchedJsonTransportLifecycleStatus {
            self.status
        }

        #[must_use]
        pub(crate) const fn code(&self) -> Option<&'static str> {
            self.code
        }

        #[must_use]
        pub(crate) const fn source_error_code(&self) -> Option<&'static str> {
            self.source_error_code
        }

        #[must_use]
        pub(crate) const fn boundary_error_code(&self) -> Option<&'static str> {
            self.boundary_error_code
        }

        #[must_use]
        pub(crate) const fn native_addon_loaded(&self) -> bool {
            self.native_addon_loaded
        }

        #[must_use]
        pub(crate) const fn native_execution(&self) -> bool {
            self.native_execution
        }

        #[must_use]
        pub(crate) const fn renderer_execution(&self) -> bool {
            self.renderer_execution
        }

        #[must_use]
        pub(crate) const fn reconciler_execution(&self) -> bool {
            self.reconciler_execution
        }

        #[must_use]
        pub(crate) const fn react_behavior_error(&self) -> bool {
            self.react_behavior_error
        }

        fn with_id(mut self, id: &'static str) -> Self {
            self.id = id.to_owned();
            self
        }

        #[cfg(test)]
        pub(crate) fn with_source_root_id_for_test(mut self, root_id: Option<u64>) -> Self {
            self.source_root_id = root_id;
            self
        }
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeBatchResponseSequenceGate {
        status: &'static str,
        batch_id: &'static str,
        request_count: usize,
        response_count: usize,
        error_row_count: usize,
        rows: Vec<NativeRootBridgeBatchResponseSequenceRow>,
        error_rows: Vec<NativeRootBridgeBatchResponseSequenceRow>,
        stream_roundtrip_gate: NativeRootBridgeJsonTransportStreamBatchRoundtripGate,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeBatchResponseSequenceGate {
        #[must_use]
        pub(crate) const fn status(&self) -> &'static str {
            self.status
        }

        #[must_use]
        pub(crate) const fn batch_id(&self) -> &'static str {
            self.batch_id
        }

        #[must_use]
        pub(crate) const fn request_count(&self) -> usize {
            self.request_count
        }

        #[must_use]
        pub(crate) const fn response_count(&self) -> usize {
            self.response_count
        }

        #[must_use]
        pub(crate) const fn error_row_count(&self) -> usize {
            self.error_row_count
        }

        #[must_use]
        pub(crate) fn rows(&self) -> &[NativeRootBridgeBatchResponseSequenceRow] {
            &self.rows
        }

        #[must_use]
        pub(crate) fn error_rows(&self) -> &[NativeRootBridgeBatchResponseSequenceRow] {
            &self.error_rows
        }

        #[must_use]
        pub(crate) const fn stream_roundtrip_gate(
            &self,
        ) -> &NativeRootBridgeJsonTransportStreamBatchRoundtripGate {
            &self.stream_roundtrip_gate
        }

        #[must_use]
        pub(crate) const fn native_addon_loaded(&self) -> bool {
            self.native_addon_loaded
        }

        #[must_use]
        pub(crate) const fn native_execution(&self) -> bool {
            self.native_execution
        }

        #[must_use]
        pub(crate) const fn renderer_execution(&self) -> bool {
            self.renderer_execution
        }

        #[must_use]
        pub(crate) const fn reconciler_execution(&self) -> bool {
            self.reconciler_execution
        }

        #[must_use]
        pub(crate) const fn react_behavior_error(&self) -> bool {
            self.react_behavior_error
        }

        #[cfg(test)]
        pub(crate) fn with_batch_id_for_test(mut self, batch_id: &'static str) -> Self {
            self.batch_id = batch_id;
            self
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeBatchResponseErrorRowStatus {
        NotError,
        Lifecycle,
        Deterministic,
    }

    impl NativeRootBridgeBatchResponseErrorRowStatus {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::NotError => "not-error-row",
                Self::Lifecycle => "lifecycle-error-row",
                Self::Deterministic => "deterministic-error-row",
            }
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeBatchResponseTeardownState {
        Uninitialized,
        Active,
        Retired,
    }

    impl NativeRootBridgeBatchResponseTeardownState {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::Uninitialized => "root-uninitialized",
                Self::Active => "root-active",
                Self::Retired => "root-retired",
            }
        }
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeBatchResponseSequenceRow {
        id: String,
        batch_id: &'static str,
        request_order: usize,
        response_order: usize,
        request_id: u64,
        kind: &'static str,
        source_environment_id: Option<BridgeEnvironmentId>,
        source_root_handle: Option<BridgeHandle>,
        source_root_id: Option<u64>,
        response_status: NativeRootBridgeBatchedJsonTransportLifecycleStatus,
        error_row_status: NativeRootBridgeBatchResponseErrorRowStatus,
        teardown_state: NativeRootBridgeBatchResponseTeardownState,
        code: Option<&'static str>,
        source_error_code: Option<&'static str>,
        boundary_error_code: Option<&'static str>,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeBatchResponseSequenceRow {
        fn from_lifecycle_row(
            response_order: usize,
            row: &NativeRootBridgeBatchedJsonTransportLifecycleRow,
        ) -> Self {
            let response_status = row.status();
            let error_row_status =
                if response_status == NativeRootBridgeBatchedJsonTransportLifecycleStatus::Error {
                    NativeRootBridgeBatchResponseErrorRowStatus::Lifecycle
                } else {
                    NativeRootBridgeBatchResponseErrorRowStatus::NotError
                };
            let id =
                if response_status == NativeRootBridgeBatchedJsonTransportLifecycleStatus::Error {
                    format!("batch-response-{response_order}-error")
                } else {
                    format!("batch-response-{response_order}-{}", row.kind())
                };

            Self::new(NativeRootBridgeBatchResponseSequenceRowInit {
                id,
                request_order: row.batch_index(),
                response_order,
                request_id: row.request_id(),
                kind: row.kind(),
                source_environment_id: row.source_environment_id(),
                source_root_handle: row.source_root_handle(),
                source_root_id: row.source_root_id(),
                response_status,
                error_row_status,
                teardown_state: teardown_state_for_batch_lifecycle_row(row),
                code: row.code(),
                source_error_code: row.source_error_code(),
                boundary_error_code: row.boundary_error_code(),
            })
        }

        fn from_deterministic_error_row(
            response_order: usize,
            row: &NativeRootBridgeBatchedJsonTransportLifecycleRow,
        ) -> Self {
            Self::new(NativeRootBridgeBatchResponseSequenceRowInit {
                id: row.id().to_owned(),
                request_order: row.batch_index(),
                response_order,
                request_id: row.request_id(),
                kind: row.kind(),
                source_environment_id: row.source_environment_id(),
                source_root_handle: row.source_root_handle(),
                source_root_id: row.source_root_id(),
                response_status: row.status(),
                error_row_status: NativeRootBridgeBatchResponseErrorRowStatus::Deterministic,
                teardown_state: teardown_state_for_batch_lifecycle_row(row),
                code: row.code(),
                source_error_code: row.source_error_code(),
                boundary_error_code: row.boundary_error_code(),
            })
        }

        fn new(init: NativeRootBridgeBatchResponseSequenceRowInit) -> Self {
            Self {
                id: init.id,
                batch_id: super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID,
                request_order: init.request_order,
                response_order: init.response_order,
                request_id: init.request_id,
                kind: init.kind,
                source_environment_id: init.source_environment_id,
                source_root_handle: init.source_root_handle,
                source_root_id: init.source_root_id,
                response_status: init.response_status,
                error_row_status: init.error_row_status,
                teardown_state: init.teardown_state,
                code: init.code,
                source_error_code: init.source_error_code,
                boundary_error_code: init.boundary_error_code,
                native_addon_loaded: false,
                native_execution: false,
                renderer_execution: false,
                reconciler_execution: false,
                react_behavior_error: false,
            }
        }

        #[must_use]
        pub(crate) fn id(&self) -> &str {
            &self.id
        }

        #[must_use]
        pub(crate) const fn batch_id(&self) -> &'static str {
            self.batch_id
        }

        #[must_use]
        pub(crate) const fn request_order(&self) -> usize {
            self.request_order
        }

        #[must_use]
        pub(crate) const fn response_order(&self) -> usize {
            self.response_order
        }

        #[must_use]
        pub(crate) const fn request_id(&self) -> u64 {
            self.request_id
        }

        #[must_use]
        pub(crate) const fn kind(&self) -> &'static str {
            self.kind
        }

        #[must_use]
        pub(crate) const fn source_environment_id(&self) -> Option<BridgeEnvironmentId> {
            self.source_environment_id
        }

        #[must_use]
        pub(crate) const fn source_root_handle(&self) -> Option<BridgeHandle> {
            self.source_root_handle
        }

        #[must_use]
        pub(crate) const fn source_root_id(&self) -> Option<u64> {
            self.source_root_id
        }

        #[must_use]
        pub(crate) const fn response_status(
            &self,
        ) -> NativeRootBridgeBatchedJsonTransportLifecycleStatus {
            self.response_status
        }

        #[must_use]
        pub(crate) const fn error_row_status(&self) -> NativeRootBridgeBatchResponseErrorRowStatus {
            self.error_row_status
        }

        #[must_use]
        pub(crate) const fn teardown_state(&self) -> NativeRootBridgeBatchResponseTeardownState {
            self.teardown_state
        }

        #[must_use]
        pub(crate) const fn code(&self) -> Option<&'static str> {
            self.code
        }

        #[must_use]
        pub(crate) const fn source_error_code(&self) -> Option<&'static str> {
            self.source_error_code
        }

        #[must_use]
        pub(crate) const fn boundary_error_code(&self) -> Option<&'static str> {
            self.boundary_error_code
        }

        #[must_use]
        pub(crate) const fn native_addon_loaded(&self) -> bool {
            self.native_addon_loaded
        }

        #[must_use]
        pub(crate) const fn native_execution(&self) -> bool {
            self.native_execution
        }

        #[must_use]
        pub(crate) const fn renderer_execution(&self) -> bool {
            self.renderer_execution
        }

        #[must_use]
        pub(crate) const fn reconciler_execution(&self) -> bool {
            self.reconciler_execution
        }

        #[must_use]
        pub(crate) const fn react_behavior_error(&self) -> bool {
            self.react_behavior_error
        }

        #[cfg(test)]
        pub(crate) fn with_batch_id_for_test(mut self, batch_id: &'static str) -> Self {
            self.batch_id = batch_id;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_source_root_id_for_test(mut self, root_id: Option<u64>) -> Self {
            self.source_root_id = root_id;
            self
        }
    }

    struct NativeRootBridgeBatchResponseSequenceRowInit {
        id: String,
        request_order: usize,
        response_order: usize,
        request_id: u64,
        kind: &'static str,
        source_environment_id: Option<BridgeEnvironmentId>,
        source_root_handle: Option<BridgeHandle>,
        source_root_id: Option<u64>,
        response_status: NativeRootBridgeBatchedJsonTransportLifecycleStatus,
        error_row_status: NativeRootBridgeBatchResponseErrorRowStatus,
        teardown_state: NativeRootBridgeBatchResponseTeardownState,
        code: Option<&'static str>,
        source_error_code: Option<&'static str>,
        boundary_error_code: Option<&'static str>,
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeJsonTransportStreamBatchRoundtripGate {
        status: &'static str,
        batch_id: &'static str,
        stream_id: &'static str,
        request_count: usize,
        chunk_count: usize,
        assembled_response_count: usize,
        error_row_count: usize,
        rows: Vec<NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow>,
        error_rows: Vec<NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow>,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        cross_environment_handle_reuse_blocked: bool,
        public_native_compatibility: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeJsonTransportStreamBatchRoundtripGate {
        #[must_use]
        pub(crate) const fn status(&self) -> &'static str {
            self.status
        }

        #[must_use]
        pub(crate) const fn batch_id(&self) -> &'static str {
            self.batch_id
        }

        #[must_use]
        pub(crate) const fn stream_id(&self) -> &'static str {
            self.stream_id
        }

        #[must_use]
        pub(crate) const fn request_count(&self) -> usize {
            self.request_count
        }

        #[must_use]
        pub(crate) const fn chunk_count(&self) -> usize {
            self.chunk_count
        }

        #[must_use]
        pub(crate) const fn assembled_response_count(&self) -> usize {
            self.assembled_response_count
        }

        #[must_use]
        pub(crate) const fn error_row_count(&self) -> usize {
            self.error_row_count
        }

        #[must_use]
        pub(crate) fn rows(&self) -> &[NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow] {
            &self.rows
        }

        #[must_use]
        pub(crate) fn error_rows(
            &self,
        ) -> &[NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow] {
            &self.error_rows
        }

        #[must_use]
        pub(crate) const fn native_addon_loaded(&self) -> bool {
            self.native_addon_loaded
        }

        #[must_use]
        pub(crate) const fn native_execution(&self) -> bool {
            self.native_execution
        }

        #[must_use]
        pub(crate) const fn renderer_execution(&self) -> bool {
            self.renderer_execution
        }

        #[must_use]
        pub(crate) const fn reconciler_execution(&self) -> bool {
            self.reconciler_execution
        }

        #[must_use]
        pub(crate) const fn cross_environment_handle_reuse_blocked(&self) -> bool {
            self.cross_environment_handle_reuse_blocked
        }

        #[must_use]
        pub(crate) const fn public_native_compatibility(&self) -> bool {
            self.public_native_compatibility
        }

        #[must_use]
        pub(crate) const fn react_behavior_error(&self) -> bool {
            self.react_behavior_error
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeJsonTransportStreamChunkKind {
        Metadata,
        Payload,
    }

    impl NativeRootBridgeJsonTransportStreamChunkKind {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::Metadata => "metadata",
                Self::Payload => "payload",
            }
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeJsonTransportStreamChunkStatus {
        Accepted,
        Error,
    }

    impl NativeRootBridgeJsonTransportStreamChunkStatus {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::Accepted => "accepted",
                Self::Error => "error",
            }
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeJsonTransportStreamAssemblyState {
        Partial,
        Assembled,
        Rejected,
    }

    impl NativeRootBridgeJsonTransportStreamAssemblyState {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::Partial => "partial",
                Self::Assembled => "assembled",
                Self::Rejected => "rejected",
            }
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeJsonTransportStreamTeardownBlocker {
        None,
        RootRetiredAfterAssembly,
        PostTeardownChunkBlocked,
    }

    impl NativeRootBridgeJsonTransportStreamTeardownBlocker {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::None => "none",
                Self::RootRetiredAfterAssembly => "root-retired-after-assembly",
                Self::PostTeardownChunkBlocked => "post-teardown-chunk-blocked",
            }
        }
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow {
        id: String,
        batch_id: &'static str,
        stream_id: &'static str,
        request_id: u64,
        request_order: usize,
        response_order: usize,
        source_environment_id: Option<BridgeEnvironmentId>,
        source_root_handle: Option<BridgeHandle>,
        source_root_id: Option<u64>,
        chunk_order: usize,
        batch_sequence: usize,
        chunk_kind: NativeRootBridgeJsonTransportStreamChunkKind,
        chunk_status: NativeRootBridgeJsonTransportStreamChunkStatus,
        response_status: NativeRootBridgeBatchedJsonTransportLifecycleStatus,
        assembly_state: NativeRootBridgeJsonTransportStreamAssemblyState,
        assembled_response: bool,
        teardown_state: NativeRootBridgeBatchResponseTeardownState,
        teardown_blocker: NativeRootBridgeJsonTransportStreamTeardownBlocker,
        code: Option<&'static str>,
        source_error_code: Option<&'static str>,
        boundary_error_code: Option<&'static str>,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        cross_environment_handle_reuse_blocked: bool,
        public_native_compatibility: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow {
        fn accepted(chunk: NativeRootBridgeJsonTransportStreamBatchRoundtripChunk) -> Self {
            let assembled_response =
                chunk.chunk_kind == NativeRootBridgeJsonTransportStreamChunkKind::Payload;
            let assembly_state = if assembled_response {
                NativeRootBridgeJsonTransportStreamAssemblyState::Assembled
            } else {
                NativeRootBridgeJsonTransportStreamAssemblyState::Partial
            };
            let teardown_blocker = if assembled_response
                && chunk.teardown_state == NativeRootBridgeBatchResponseTeardownState::Retired
            {
                NativeRootBridgeJsonTransportStreamTeardownBlocker::RootRetiredAfterAssembly
            } else {
                NativeRootBridgeJsonTransportStreamTeardownBlocker::None
            };

            Self::new(
                NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRowInit {
                    id: format!(
                        "stream-batch-chunk-{}-request-{}-{}",
                        chunk.batch_sequence,
                        chunk.request_id,
                        chunk.chunk_kind.code()
                    ),
                    chunk,
                    chunk_status: NativeRootBridgeJsonTransportStreamChunkStatus::Accepted,
                    assembly_state,
                    assembled_response,
                    teardown_blocker,
                    code: None,
                    source_error_code: None,
                    boundary_error_code: None,
                },
            )
        }

        fn rejected(
            id: &'static str,
            chunk: NativeRootBridgeJsonTransportStreamBatchRoundtripChunk,
            code: &'static str,
            teardown_blocker: NativeRootBridgeJsonTransportStreamTeardownBlocker,
        ) -> Self {
            Self::new(
                NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRowInit {
                    id: id.to_owned(),
                    chunk,
                    chunk_status: NativeRootBridgeJsonTransportStreamChunkStatus::Error,
                    assembly_state: NativeRootBridgeJsonTransportStreamAssemblyState::Rejected,
                    assembled_response: false,
                    teardown_blocker,
                    code: Some(code),
                    source_error_code: Some(code),
                    boundary_error_code: Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"),
                },
            )
        }

        fn new(init: NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRowInit) -> Self {
            Self {
                id: init.id,
                batch_id: super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID,
                stream_id:
                    super::NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_STREAM_ID,
                request_id: init.chunk.request_id,
                request_order: init.chunk.request_order,
                response_order: init.chunk.response_order,
                source_environment_id: init.chunk.source_environment_id,
                source_root_handle: init.chunk.source_root_handle,
                source_root_id: init.chunk.source_root_id,
                chunk_order: init.chunk.chunk_order,
                batch_sequence: init.chunk.batch_sequence,
                chunk_kind: init.chunk.chunk_kind,
                chunk_status: init.chunk_status,
                response_status: init.chunk.response_status,
                assembly_state: init.assembly_state,
                assembled_response: init.assembled_response,
                teardown_state: init.chunk.teardown_state,
                teardown_blocker: init.teardown_blocker,
                code: init.code,
                source_error_code: init.source_error_code,
                boundary_error_code: init.boundary_error_code,
                native_addon_loaded: false,
                native_execution: false,
                renderer_execution: false,
                reconciler_execution: false,
                cross_environment_handle_reuse_blocked: true,
                public_native_compatibility: false,
                react_behavior_error: false,
            }
        }

        #[must_use]
        pub(crate) fn id(&self) -> &str {
            &self.id
        }

        #[must_use]
        pub(crate) const fn batch_id(&self) -> &'static str {
            self.batch_id
        }

        #[must_use]
        pub(crate) const fn stream_id(&self) -> &'static str {
            self.stream_id
        }

        #[must_use]
        pub(crate) const fn request_id(&self) -> u64 {
            self.request_id
        }

        #[must_use]
        pub(crate) const fn request_order(&self) -> usize {
            self.request_order
        }

        #[must_use]
        pub(crate) const fn response_order(&self) -> usize {
            self.response_order
        }

        #[must_use]
        pub(crate) const fn source_environment_id(&self) -> Option<BridgeEnvironmentId> {
            self.source_environment_id
        }

        #[must_use]
        pub(crate) const fn source_root_handle(&self) -> Option<BridgeHandle> {
            self.source_root_handle
        }

        #[must_use]
        pub(crate) const fn source_root_id(&self) -> Option<u64> {
            self.source_root_id
        }

        #[must_use]
        pub(crate) const fn chunk_order(&self) -> usize {
            self.chunk_order
        }

        #[must_use]
        pub(crate) const fn batch_sequence(&self) -> usize {
            self.batch_sequence
        }

        #[must_use]
        pub(crate) const fn chunk_kind(&self) -> NativeRootBridgeJsonTransportStreamChunkKind {
            self.chunk_kind
        }

        #[must_use]
        pub(crate) const fn chunk_status(&self) -> NativeRootBridgeJsonTransportStreamChunkStatus {
            self.chunk_status
        }

        #[must_use]
        pub(crate) const fn response_status(
            &self,
        ) -> NativeRootBridgeBatchedJsonTransportLifecycleStatus {
            self.response_status
        }

        #[must_use]
        pub(crate) const fn assembly_state(
            &self,
        ) -> NativeRootBridgeJsonTransportStreamAssemblyState {
            self.assembly_state
        }

        #[must_use]
        pub(crate) const fn assembled_response(&self) -> bool {
            self.assembled_response
        }

        #[must_use]
        pub(crate) const fn teardown_state(&self) -> NativeRootBridgeBatchResponseTeardownState {
            self.teardown_state
        }

        #[must_use]
        pub(crate) const fn teardown_blocker(
            &self,
        ) -> NativeRootBridgeJsonTransportStreamTeardownBlocker {
            self.teardown_blocker
        }

        #[must_use]
        pub(crate) const fn code(&self) -> Option<&'static str> {
            self.code
        }

        #[must_use]
        pub(crate) const fn source_error_code(&self) -> Option<&'static str> {
            self.source_error_code
        }

        #[must_use]
        pub(crate) const fn boundary_error_code(&self) -> Option<&'static str> {
            self.boundary_error_code
        }

        #[must_use]
        pub(crate) const fn native_addon_loaded(&self) -> bool {
            self.native_addon_loaded
        }

        #[must_use]
        pub(crate) const fn native_execution(&self) -> bool {
            self.native_execution
        }

        #[must_use]
        pub(crate) const fn renderer_execution(&self) -> bool {
            self.renderer_execution
        }

        #[must_use]
        pub(crate) const fn reconciler_execution(&self) -> bool {
            self.reconciler_execution
        }

        #[must_use]
        pub(crate) const fn cross_environment_handle_reuse_blocked(&self) -> bool {
            self.cross_environment_handle_reuse_blocked
        }

        #[must_use]
        pub(crate) const fn public_native_compatibility(&self) -> bool {
            self.public_native_compatibility
        }

        #[must_use]
        pub(crate) const fn react_behavior_error(&self) -> bool {
            self.react_behavior_error
        }

        #[cfg(test)]
        pub(crate) fn with_batch_id_for_test(mut self, batch_id: &'static str) -> Self {
            self.batch_id = batch_id;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_stream_id_for_test(mut self, stream_id: &'static str) -> Self {
            self.stream_id = stream_id;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_source_root_id_for_test(mut self, root_id: Option<u64>) -> Self {
            self.source_root_id = root_id;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_chunk_kind_for_test(
            mut self,
            chunk_kind: NativeRootBridgeJsonTransportStreamChunkKind,
        ) -> Self {
            self.chunk_kind = chunk_kind;
            self
        }
    }

    struct NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRowInit {
        id: String,
        chunk: NativeRootBridgeJsonTransportStreamBatchRoundtripChunk,
        chunk_status: NativeRootBridgeJsonTransportStreamChunkStatus,
        assembly_state: NativeRootBridgeJsonTransportStreamAssemblyState,
        assembled_response: bool,
        teardown_blocker: NativeRootBridgeJsonTransportStreamTeardownBlocker,
        code: Option<&'static str>,
        source_error_code: Option<&'static str>,
        boundary_error_code: Option<&'static str>,
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    struct NativeRootBridgeJsonTransportStreamBatchRoundtripChunk {
        request_id: u64,
        request_order: usize,
        response_order: usize,
        source_environment_id: Option<BridgeEnvironmentId>,
        source_root_handle: Option<BridgeHandle>,
        source_root_id: Option<u64>,
        chunk_order: usize,
        batch_sequence: usize,
        chunk_kind: NativeRootBridgeJsonTransportStreamChunkKind,
        response_status: NativeRootBridgeBatchedJsonTransportLifecycleStatus,
        teardown_state: NativeRootBridgeBatchResponseTeardownState,
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeJsonBatchLifecycleExecutorSourceGuard {
        executor_generation: u64,
        batch_index: usize,
        request_id: u64,
        kind: &'static str,
        table_environment_id: BridgeEnvironmentId,
        source_root_handle: BridgeHandle,
        source_root_id: u64,
        root_handle_current_generation: u64,
        source_value_handle: Option<BridgeHandle>,
        value_handle_current_generation: Option<u64>,
    }

    impl NativeRootBridgeJsonBatchLifecycleExecutorSourceGuard {
        fn new(
            executor_generation: u64,
            batch_index: usize,
            request: NativeRootBridgeRequestRecord,
            admission_record: NativeRootBridgeHandleTableAdmissionSmokeRecord,
        ) -> Self {
            Self {
                executor_generation,
                batch_index,
                request_id: request.request_id(),
                kind: request.kind().code(),
                table_environment_id: request.environment_id(),
                source_root_handle: request.root_handle(),
                source_root_id: request.root_id(),
                root_handle_current_generation: admission_record.root_handle_current_generation(),
                source_value_handle: request.value_handle(),
                value_handle_current_generation: admission_record.value_handle_current_generation(),
            }
        }

        #[must_use]
        pub(crate) const fn executor_generation(self) -> u64 {
            self.executor_generation
        }

        #[must_use]
        pub(crate) const fn batch_index(self) -> usize {
            self.batch_index
        }

        #[must_use]
        pub(crate) const fn request_id(self) -> u64 {
            self.request_id
        }

        #[must_use]
        pub(crate) const fn kind(self) -> &'static str {
            self.kind
        }

        #[must_use]
        pub(crate) const fn table_environment_id(self) -> BridgeEnvironmentId {
            self.table_environment_id
        }

        #[must_use]
        pub(crate) const fn source_root_handle(self) -> BridgeHandle {
            self.source_root_handle
        }

        #[must_use]
        pub(crate) const fn source_root_id(self) -> u64 {
            self.source_root_id
        }

        #[must_use]
        pub(crate) const fn root_handle_current_generation(self) -> u64 {
            self.root_handle_current_generation
        }

        #[must_use]
        pub(crate) const fn source_value_handle(self) -> Option<BridgeHandle> {
            self.source_value_handle
        }

        #[must_use]
        pub(crate) const fn value_handle_current_generation(self) -> Option<u64> {
            self.value_handle_current_generation
        }

        #[cfg(test)]
        pub(crate) const fn with_executor_generation_for_test(
            mut self,
            executor_generation: u64,
        ) -> Self {
            self.executor_generation = executor_generation;
            self
        }

        #[cfg(test)]
        pub(crate) const fn with_source_value_handle_for_test(
            mut self,
            source_value_handle: Option<BridgeHandle>,
        ) -> Self {
            self.source_value_handle = source_value_handle;
            self
        }
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeJsonBatchLifecycleExecutor {
        status: &'static str,
        model: &'static str,
        validation_model: &'static str,
        handle_table_model: &'static str,
        transport: &'static str,
        executor_generation: u64,
        request_count: usize,
        executed_row_count: usize,
        environment_id: BridgeEnvironmentId,
        root_handle: Option<BridgeHandle>,
        root_id: Option<u64>,
        root_retired: bool,
        final_lifecycle_state: NativeRootBridgeBatchedJsonTransportLifecycleState,
        rows: Vec<NativeRootBridgeJsonBatchLifecycleExecutorRow>,
        admission_records: Vec<NativeRootBridgeHandleTableAdmissionSmokeRecord>,
        validation_records: Vec<NativeRootBridgeRequestValidationRecord>,
        source_owned_json_rows: bool,
        rust_state_machine_execution: bool,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        public_native_compatibility: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeJsonBatchLifecycleExecutor {
        #[must_use]
        pub(crate) const fn status(&self) -> &'static str {
            self.status
        }

        #[must_use]
        pub(crate) const fn model(&self) -> &'static str {
            self.model
        }

        #[must_use]
        pub(crate) const fn validation_model(&self) -> &'static str {
            self.validation_model
        }

        #[must_use]
        pub(crate) const fn handle_table_model(&self) -> &'static str {
            self.handle_table_model
        }

        #[must_use]
        pub(crate) const fn transport(&self) -> &'static str {
            self.transport
        }

        #[must_use]
        pub(crate) const fn executor_generation(&self) -> u64 {
            self.executor_generation
        }

        #[must_use]
        pub(crate) const fn request_count(&self) -> usize {
            self.request_count
        }

        #[must_use]
        pub(crate) const fn executed_row_count(&self) -> usize {
            self.executed_row_count
        }

        #[must_use]
        pub(crate) const fn environment_id(&self) -> BridgeEnvironmentId {
            self.environment_id
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
        pub(crate) const fn root_retired(&self) -> bool {
            self.root_retired
        }

        #[must_use]
        pub(crate) const fn final_lifecycle_state(
            &self,
        ) -> NativeRootBridgeBatchedJsonTransportLifecycleState {
            self.final_lifecycle_state
        }

        #[must_use]
        pub(crate) fn rows(&self) -> &[NativeRootBridgeJsonBatchLifecycleExecutorRow] {
            &self.rows
        }

        #[must_use]
        pub(crate) fn admission_records(
            &self,
        ) -> &[NativeRootBridgeHandleTableAdmissionSmokeRecord] {
            &self.admission_records
        }

        #[must_use]
        pub(crate) fn validation_records(&self) -> &[NativeRootBridgeRequestValidationRecord] {
            &self.validation_records
        }

        #[must_use]
        pub(crate) const fn source_owned_json_rows(&self) -> bool {
            self.source_owned_json_rows
        }

        #[must_use]
        pub(crate) const fn rust_state_machine_execution(&self) -> bool {
            self.rust_state_machine_execution
        }

        #[must_use]
        pub(crate) const fn native_addon_loaded(&self) -> bool {
            self.native_addon_loaded
        }

        #[must_use]
        pub(crate) const fn native_execution(&self) -> bool {
            self.native_execution
        }

        #[must_use]
        pub(crate) const fn renderer_execution(&self) -> bool {
            self.renderer_execution
        }

        #[must_use]
        pub(crate) const fn reconciler_execution(&self) -> bool {
            self.reconciler_execution
        }

        #[must_use]
        pub(crate) const fn public_native_compatibility(&self) -> bool {
            self.public_native_compatibility
        }

        #[must_use]
        pub(crate) const fn react_behavior_error(&self) -> bool {
            self.react_behavior_error
        }

        fn handle_table_admission_smoke(&self) -> NativeRootBridgeHandleTableAdmissionSmoke {
            NativeRootBridgeHandleTableAdmissionSmoke {
                environment_id: self.environment_id,
                root_handle: self.root_handle,
                root_id: self.root_id,
                root_retired: self.root_retired,
                admission_records: self.admission_records.clone(),
                validation_records: self.validation_records.clone(),
            }
        }
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeJsonBatchLifecycleExecutorRow {
        id: String,
        batch_index: usize,
        request_id: u64,
        kind: &'static str,
        source_environment_id: BridgeEnvironmentId,
        source_root_handle: BridgeHandle,
        source_root_id: u64,
        source_value_handle: Option<BridgeHandle>,
        lifecycle_before: NativeRootBridgeBatchedJsonTransportLifecycleState,
        lifecycle_after: NativeRootBridgeBatchedJsonTransportLifecycleState,
        lifecycle_transition: NativeRootBridgeLifecycleTransition,
        root_handle_state_before: Option<NativeRootBridgeRootHandleState>,
        root_handle_state_after: NativeRootBridgeRootHandleState,
        root_handle_action: NativeRootBridgeHandleAdmissionAction,
        root_handle_current_generation: u64,
        value_handle_action: Option<NativeRootBridgeHandleAdmissionAction>,
        value_handle_current_generation: Option<u64>,
        retired_root_source_error_code: Option<&'static str>,
        root_handle_validated: bool,
        value_handle_validated: bool,
        status: NativeRootBridgeBatchedJsonTransportLifecycleStatus,
        code: Option<&'static str>,
        source_error_code: Option<&'static str>,
        boundary_error_code: Option<&'static str>,
        source_owned_json_row: bool,
        rust_state_machine_execution: bool,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        public_native_compatibility: bool,
        react_behavior_error: bool,
        source_guard: NativeRootBridgeJsonBatchLifecycleExecutorSourceGuard,
    }

    impl NativeRootBridgeJsonBatchLifecycleExecutorRow {
        fn applied(
            executor_generation: u64,
            batch_index: usize,
            request: NativeRootBridgeRequestRecord,
            lifecycle_before: NativeRootBridgeBatchedJsonTransportLifecycleState,
            lifecycle_after: NativeRootBridgeBatchedJsonTransportLifecycleState,
            admission_record: NativeRootBridgeHandleTableAdmissionSmokeRecord,
            validation_record: NativeRootBridgeRequestValidationRecord,
        ) -> Self {
            Self {
                id: format!(
                    "json-batch-lifecycle-executor-{batch_index}-{}",
                    request.kind().code()
                ),
                batch_index,
                request_id: request.request_id(),
                kind: request.kind().code(),
                source_environment_id: request.environment_id(),
                source_root_handle: request.root_handle(),
                source_root_id: request.root_id(),
                source_value_handle: request.value_handle(),
                lifecycle_before,
                lifecycle_after,
                lifecycle_transition: validation_record.lifecycle_transition(),
                root_handle_state_before: admission_record.root_handle_state_before(),
                root_handle_state_after: admission_record.root_handle_state_after(),
                root_handle_action: admission_record.root_handle_action(),
                root_handle_current_generation: admission_record.root_handle_current_generation(),
                value_handle_action: admission_record.value_handle_action(),
                value_handle_current_generation: admission_record.value_handle_current_generation(),
                retired_root_source_error_code: admission_record.retired_root_source_error_code(),
                root_handle_validated: validation_record.root_handle_validated(),
                value_handle_validated: validation_record.value_handle_validated(),
                status: NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted,
                code: None,
                source_error_code: None,
                boundary_error_code: None,
                source_owned_json_row: true,
                rust_state_machine_execution: true,
                native_addon_loaded: false,
                native_execution: false,
                renderer_execution: false,
                reconciler_execution: false,
                public_native_compatibility: false,
                react_behavior_error: false,
                source_guard: NativeRootBridgeJsonBatchLifecycleExecutorSourceGuard::new(
                    executor_generation,
                    batch_index,
                    request,
                    admission_record,
                ),
            }
        }

        #[must_use]
        pub(crate) fn id(&self) -> &str {
            &self.id
        }

        #[must_use]
        pub(crate) const fn batch_index(&self) -> usize {
            self.batch_index
        }

        #[must_use]
        pub(crate) const fn request_id(&self) -> u64 {
            self.request_id
        }

        #[must_use]
        pub(crate) const fn kind(&self) -> &'static str {
            self.kind
        }

        #[must_use]
        pub(crate) const fn source_environment_id(&self) -> BridgeEnvironmentId {
            self.source_environment_id
        }

        #[must_use]
        pub(crate) const fn source_root_handle(&self) -> BridgeHandle {
            self.source_root_handle
        }

        #[must_use]
        pub(crate) const fn source_root_id(&self) -> u64 {
            self.source_root_id
        }

        #[must_use]
        pub(crate) const fn source_value_handle(&self) -> Option<BridgeHandle> {
            self.source_value_handle
        }

        #[must_use]
        pub(crate) const fn lifecycle_before(
            &self,
        ) -> NativeRootBridgeBatchedJsonTransportLifecycleState {
            self.lifecycle_before
        }

        #[must_use]
        pub(crate) const fn lifecycle_after(
            &self,
        ) -> NativeRootBridgeBatchedJsonTransportLifecycleState {
            self.lifecycle_after
        }

        #[must_use]
        pub(crate) const fn lifecycle_transition(&self) -> NativeRootBridgeLifecycleTransition {
            self.lifecycle_transition
        }

        #[must_use]
        pub(crate) const fn root_handle_state_before(
            &self,
        ) -> Option<NativeRootBridgeRootHandleState> {
            self.root_handle_state_before
        }

        #[must_use]
        pub(crate) const fn root_handle_state_after(&self) -> NativeRootBridgeRootHandleState {
            self.root_handle_state_after
        }

        #[must_use]
        pub(crate) const fn root_handle_action(&self) -> NativeRootBridgeHandleAdmissionAction {
            self.root_handle_action
        }

        #[must_use]
        pub(crate) const fn root_handle_current_generation(&self) -> u64 {
            self.root_handle_current_generation
        }

        #[must_use]
        pub(crate) const fn value_handle_action(
            &self,
        ) -> Option<NativeRootBridgeHandleAdmissionAction> {
            self.value_handle_action
        }

        #[must_use]
        pub(crate) const fn value_handle_current_generation(&self) -> Option<u64> {
            self.value_handle_current_generation
        }

        #[must_use]
        pub(crate) const fn retired_root_source_error_code(&self) -> Option<&'static str> {
            self.retired_root_source_error_code
        }

        #[must_use]
        pub(crate) const fn root_handle_validated(&self) -> bool {
            self.root_handle_validated
        }

        #[must_use]
        pub(crate) const fn value_handle_validated(&self) -> bool {
            self.value_handle_validated
        }

        #[must_use]
        pub(crate) const fn status(&self) -> NativeRootBridgeBatchedJsonTransportLifecycleStatus {
            self.status
        }

        #[must_use]
        pub(crate) const fn code(&self) -> Option<&'static str> {
            self.code
        }

        #[must_use]
        pub(crate) const fn source_error_code(&self) -> Option<&'static str> {
            self.source_error_code
        }

        #[must_use]
        pub(crate) const fn boundary_error_code(&self) -> Option<&'static str> {
            self.boundary_error_code
        }

        #[must_use]
        pub(crate) const fn source_owned_json_row(&self) -> bool {
            self.source_owned_json_row
        }

        #[must_use]
        pub(crate) const fn rust_state_machine_execution(&self) -> bool {
            self.rust_state_machine_execution
        }

        #[must_use]
        pub(crate) const fn native_addon_loaded(&self) -> bool {
            self.native_addon_loaded
        }

        #[must_use]
        pub(crate) const fn native_execution(&self) -> bool {
            self.native_execution
        }

        #[must_use]
        pub(crate) const fn renderer_execution(&self) -> bool {
            self.renderer_execution
        }

        #[must_use]
        pub(crate) const fn reconciler_execution(&self) -> bool {
            self.reconciler_execution
        }

        #[must_use]
        pub(crate) const fn public_native_compatibility(&self) -> bool {
            self.public_native_compatibility
        }

        #[must_use]
        pub(crate) const fn react_behavior_error(&self) -> bool {
            self.react_behavior_error
        }

        #[must_use]
        pub(crate) const fn source_guard(
            &self,
        ) -> NativeRootBridgeJsonBatchLifecycleExecutorSourceGuard {
            self.source_guard
        }

        #[cfg(test)]
        pub(crate) fn with_source_environment_id_for_test(
            mut self,
            environment_id: BridgeEnvironmentId,
        ) -> Self {
            self.source_environment_id = environment_id;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_source_root_id_for_test(mut self, root_id: u64) -> Self {
            self.source_root_id = root_id;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_root_handle_current_generation_for_test(
            mut self,
            current_generation: u64,
        ) -> Self {
            self.root_handle_current_generation = current_generation;
            self.source_guard.root_handle_current_generation = current_generation;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_source_guard_for_test(
            mut self,
            source_guard: NativeRootBridgeJsonBatchLifecycleExecutorSourceGuard,
        ) -> Self {
            self.source_guard = source_guard;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_source_owned_json_row_for_test(mut self, source_owned: bool) -> Self {
            self.source_owned_json_row = source_owned;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_native_execution_claim_for_test(mut self) -> Self {
            self.native_execution = true;
            self.public_native_compatibility = true;
            self
        }
    }

    #[derive(Debug, Clone)]
    struct NativeRootBridgeBatchedJsonTransportLifecycleValidator {
        lifecycle: NativeRootBridgeBatchedJsonTransportLifecycleState,
        root_handle: Option<BridgeHandle>,
        root_id: Option<u64>,
        last_request_id: Option<u64>,
    }

    impl NativeRootBridgeBatchedJsonTransportLifecycleValidator {
        const fn new() -> Self {
            Self {
                lifecycle: NativeRootBridgeBatchedJsonTransportLifecycleState::None,
                root_handle: None,
                root_id: None,
                last_request_id: None,
            }
        }

        fn validate_record(
            &mut self,
            batch_index: usize,
            record: NativeRootBridgeJsonTransportRecord,
        ) -> NativeRootBridgeBatchedJsonTransportLifecycleRow {
            let lifecycle_before = self.lifecycle;
            let request = match record.decode() {
                Ok(request) => request,
                Err(error) => {
                    return NativeRootBridgeBatchedJsonTransportLifecycleRow::error(
                        format!("batch-record-{batch_index}-error"),
                        batch_index,
                        record,
                        lifecycle_before,
                        &error,
                    );
                }
            };

            match self.validate_request(request) {
                Ok((lifecycle_transition, lifecycle_after)) => {
                    NativeRootBridgeBatchedJsonTransportLifecycleRow::accepted(
                        batch_index,
                        request,
                        lifecycle_before,
                        lifecycle_after,
                        lifecycle_transition,
                    )
                }
                Err(error) => NativeRootBridgeBatchedJsonTransportLifecycleRow::error(
                    format!("batch-record-{batch_index}-error"),
                    batch_index,
                    record,
                    lifecycle_before,
                    &error,
                ),
            }
        }

        fn validate_request(
            &mut self,
            request: NativeRootBridgeRequestRecord,
        ) -> Result<
            (
                NativeRootBridgeLifecycleTransition,
                NativeRootBridgeBatchedJsonTransportLifecycleState,
            ),
            NativeRootBridgeRequestError,
        > {
            if let Some(previous_request_id) = self.last_request_id
                && request.request_id() <= previous_request_id
            {
                return Err(NativeRootBridgeRequestError::RequestSequenceOutOfOrder {
                    previous_request_id,
                    request_id: request.request_id(),
                });
            }

            match self.lifecycle {
                NativeRootBridgeBatchedJsonTransportLifecycleState::None => {
                    if request.kind() != NativeRootBridgeRequestKind::Create {
                        return Err(NativeRootBridgeRequestError::SequenceMustStartWithCreate {
                            actual: request.kind(),
                        });
                    }
                }
                NativeRootBridgeBatchedJsonTransportLifecycleState::Active => {
                    if request.kind() == NativeRootBridgeRequestKind::Create {
                        return Err(NativeRootBridgeRequestError::CreateAfterRootCreated {
                            request_id: request.request_id(),
                        });
                    }

                    validate_sequence_root_identity(
                        request,
                        self.root_handle
                            .expect("root handle is set for active batched JSON lifecycle"),
                        self.root_id
                            .expect("root id is set for active batched JSON lifecycle"),
                    )?;
                }
                NativeRootBridgeBatchedJsonTransportLifecycleState::Retired => {
                    return Err(NativeRootBridgeRequestError::RequestAfterUnmount {
                        request_id: request.request_id(),
                    });
                }
            }

            let expected_root_handle_state = match request.kind() {
                NativeRootBridgeRequestKind::Create | NativeRootBridgeRequestKind::Render => {
                    NativeRootBridgeRootHandleState::Active
                }
                NativeRootBridgeRequestKind::Unmount => NativeRootBridgeRootHandleState::Retired,
            };
            if request.root_handle_state() != expected_root_handle_state {
                return Err(
                    NativeRootBridgeRequestError::RecordRootHandleStateMismatch {
                        expected: expected_root_handle_state,
                        actual: request.root_handle_state(),
                    },
                );
            }

            if request.kind() == NativeRootBridgeRequestKind::Unmount
                && let Some(value_handle) = request.value_handle()
            {
                return Err(NativeRootBridgeRequestError::UnexpectedValueHandle {
                    kind: request.kind(),
                    value_handle,
                });
            }

            let lifecycle_transition = get_lifecycle_transition_for_request(request.kind());
            let lifecycle_after = match request.kind() {
                NativeRootBridgeRequestKind::Create | NativeRootBridgeRequestKind::Render => {
                    NativeRootBridgeBatchedJsonTransportLifecycleState::Active
                }
                NativeRootBridgeRequestKind::Unmount => {
                    NativeRootBridgeBatchedJsonTransportLifecycleState::Retired
                }
            };

            self.last_request_id = Some(request.request_id());
            if self.root_handle.is_none() {
                self.root_handle = Some(request.root_handle());
                self.root_id = Some(request.root_id());
            }
            self.lifecycle = lifecycle_after;

            Ok((lifecycle_transition, lifecycle_after))
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    struct NativeRootBridgeBatchedJsonTransportDiagnosticCase {
        id: &'static str,
        json: &'static str,
        expected_code: &'static str,
    }

