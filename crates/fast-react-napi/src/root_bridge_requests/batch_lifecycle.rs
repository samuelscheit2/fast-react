    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeBatchLifecycleConsumer {
        status: &'static str,
        model: &'static str,
        validation_model: &'static str,
        handle_table_model: &'static str,
        batch_gate_status: &'static str,
        cleanup_hook_preflight_status: &'static str,
        request_count: usize,
        consumed_batch_record_count: usize,
        accepted_batch_record_count: usize,
        cleanup_hook_callable_preflight_accepted: bool,
        accepted_cleanup_evidence_count: usize,
        rejected_cleanup_evidence_count: usize,
        json_batch_lifecycle_executor_generation: u64,
        json_batch_lifecycle_executor_source_rows_validated: bool,
        json_batch_lifecycle_executor_source_error_code: Option<&'static str>,
        json_batch_lifecycle_executor_replay_guard_consumed: bool,
        json_batch_roundtrip_link: NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink,
        rows: Vec<NativeRootBridgeBatchLifecycleConsumerRow>,
        node_worker_threads_execution: bool,
        napi_cleanup_hook_execution: bool,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        public_native_compatibility: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeBatchLifecycleConsumer {
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
        pub(crate) const fn batch_gate_status(&self) -> &'static str {
            self.batch_gate_status
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_preflight_status(&self) -> &'static str {
            self.cleanup_hook_preflight_status
        }

        #[must_use]
        pub(crate) const fn request_count(&self) -> usize {
            self.request_count
        }

        #[must_use]
        pub(crate) const fn consumed_batch_record_count(&self) -> usize {
            self.consumed_batch_record_count
        }

        #[must_use]
        pub(crate) const fn accepted_batch_record_count(&self) -> usize {
            self.accepted_batch_record_count
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_callable_preflight_accepted(&self) -> bool {
            self.cleanup_hook_callable_preflight_accepted
        }

        #[must_use]
        pub(crate) const fn accepted_cleanup_evidence_count(&self) -> usize {
            self.accepted_cleanup_evidence_count
        }

        #[must_use]
        pub(crate) const fn rejected_cleanup_evidence_count(&self) -> usize {
            self.rejected_cleanup_evidence_count
        }

        #[must_use]
        pub(crate) const fn json_batch_lifecycle_executor_generation(&self) -> u64 {
            self.json_batch_lifecycle_executor_generation
        }

        #[must_use]
        pub(crate) const fn json_batch_lifecycle_executor_source_rows_validated(&self) -> bool {
            self.json_batch_lifecycle_executor_source_rows_validated
        }

        #[must_use]
        pub(crate) const fn json_batch_lifecycle_executor_source_error_code(
            &self,
        ) -> Option<&'static str> {
            self.json_batch_lifecycle_executor_source_error_code
        }

        #[must_use]
        pub(crate) const fn json_batch_lifecycle_executor_replay_guard_consumed(&self) -> bool {
            self.json_batch_lifecycle_executor_replay_guard_consumed
        }

        #[must_use]
        pub(crate) const fn json_batch_roundtrip_link(
            &self,
        ) -> &NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink {
            &self.json_batch_roundtrip_link
        }

        #[must_use]
        pub(crate) fn rows(&self) -> &[NativeRootBridgeBatchLifecycleConsumerRow] {
            &self.rows
        }

        #[cfg(test)]
        pub(crate) fn with_rows_for_test(
            mut self,
            rows: Vec<NativeRootBridgeBatchLifecycleConsumerRow>,
        ) -> Self {
            self.consumed_batch_record_count = rows.len();
            self.accepted_batch_record_count = rows
                .iter()
                .filter(|row| {
                    row.status() == NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted
                })
                .count();
            self.rows = rows;
            self
        }

        #[must_use]
        pub(crate) const fn node_worker_threads_execution(&self) -> bool {
            self.node_worker_threads_execution
        }

        #[must_use]
        pub(crate) const fn napi_cleanup_hook_execution(&self) -> bool {
            self.napi_cleanup_hook_execution
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
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeBatchLifecycleConsumerRow {
        id: String,
        batch_index: usize,
        request_id: u64,
        kind: &'static str,
        source_environment_id: Option<BridgeEnvironmentId>,
        source_root_handle: Option<BridgeHandle>,
        source_root_id: Option<u64>,
        lifecycle_transition: Option<NativeRootBridgeLifecycleTransition>,
        root_handle_action: NativeRootBridgeHandleAdmissionAction,
        root_handle_state_before: Option<NativeRootBridgeRootHandleState>,
        root_handle_state_after: NativeRootBridgeRootHandleState,
        root_handle_current_generation: u64,
        value_handle_action: Option<NativeRootBridgeHandleAdmissionAction>,
        value_handle_current_generation: Option<u64>,
        retired_root_source_error_code: Option<&'static str>,
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
        status: NativeRootBridgeBatchedJsonTransportLifecycleStatus,
        code: Option<&'static str>,
        source_error_code: Option<&'static str>,
        boundary_error_code: Option<&'static str>,
        node_worker_threads_execution: bool,
        napi_cleanup_hook_execution: bool,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        public_native_compatibility: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeBatchLifecycleConsumerRow {
        fn new(
            lifecycle_row: &NativeRootBridgeBatchedJsonTransportLifecycleRow,
            smoke_record: NativeRootBridgeHandleTableAdmissionSmokeRecord,
            cleanup_hook_row: Option<NativeRootBridgeWorkerThreadCleanupHookPreflightRow>,
        ) -> Self {
            Self {
                id: format!(
                    "batch-lifecycle-consumer-{}-{}",
                    lifecycle_row.batch_index(),
                    lifecycle_row.kind()
                ),
                batch_index: lifecycle_row.batch_index(),
                request_id: lifecycle_row.request_id(),
                kind: lifecycle_row.kind(),
                source_environment_id: lifecycle_row.source_environment_id(),
                source_root_handle: lifecycle_row.source_root_handle(),
                source_root_id: lifecycle_row.source_root_id(),
                lifecycle_transition: lifecycle_row.lifecycle_transition(),
                root_handle_action: smoke_record.root_handle_action(),
                root_handle_state_before: smoke_record.root_handle_state_before(),
                root_handle_state_after: smoke_record.root_handle_state_after(),
                root_handle_current_generation: smoke_record.root_handle_current_generation(),
                value_handle_action: smoke_record.value_handle_action(),
                value_handle_current_generation: smoke_record.value_handle_current_generation(),
                retired_root_source_error_code: smoke_record.retired_root_source_error_code(),
                cleanup_hook_evidence_required: cleanup_hook_row.is_some(),
                cleanup_hook_evidence_status: cleanup_hook_row.map_or(
                    NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_CLEANUP_HOOK_NOT_REQUIRED_STATUS,
                    |row| row.status().code(),
                ),
                cleanup_hook_evidence_row_id: cleanup_hook_row.map(|row| row.id()),
                cleanup_hook_source_row_id: cleanup_hook_row.map(|row| row.source_row_id()),
                cleanup_hook_source_handle_kind: cleanup_hook_row
                    .map(|row| row.source_handle_kind()),
                cleanup_hook_source_handle_environment_id: cleanup_hook_row
                    .and_then(|row| row.source_handle_environment_id()),
                cleanup_hook_source_handle_slot: cleanup_hook_row
                    .and_then(|row| row.source_handle_slot()),
                cleanup_hook_source_handle_generation: cleanup_hook_row
                    .and_then(|row| row.source_handle_generation()),
                cleanup_hook_source_current_generation: cleanup_hook_row
                    .and_then(|row| row.source_current_generation()),
                cleanup_hook_source_record_id: cleanup_hook_row
                    .and_then(|row| row.source_record_id()),
                cleanup_hook_source_root_id: cleanup_hook_row.and_then(|row| row.source_root_id()),
                cleanup_hook_canonical_executable_evidence: cleanup_hook_row
                    .map(|row| row.canonical_executable_evidence()),
                status: lifecycle_row.status(),
                code: lifecycle_row.code(),
                source_error_code: lifecycle_row.source_error_code(),
                boundary_error_code: lifecycle_row.boundary_error_code(),
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
        pub(crate) const fn lifecycle_transition(
            &self,
        ) -> Option<NativeRootBridgeLifecycleTransition> {
            self.lifecycle_transition
        }

        #[must_use]
        pub(crate) const fn root_handle_action(&self) -> NativeRootBridgeHandleAdmissionAction {
            self.root_handle_action
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
        pub(crate) const fn cleanup_hook_evidence_required(&self) -> bool {
            self.cleanup_hook_evidence_required
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_evidence_status(&self) -> &'static str {
            self.cleanup_hook_evidence_status
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_evidence_row_id(&self) -> Option<&'static str> {
            self.cleanup_hook_evidence_row_id
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_source_row_id(&self) -> Option<&'static str> {
            self.cleanup_hook_source_row_id
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_source_handle_kind(&self) -> Option<BridgeHandleKind> {
            self.cleanup_hook_source_handle_kind
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_source_handle_environment_id(
            &self,
        ) -> Option<BridgeEnvironmentId> {
            self.cleanup_hook_source_handle_environment_id
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_source_handle_slot(&self) -> Option<u64> {
            self.cleanup_hook_source_handle_slot
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_source_handle_generation(&self) -> Option<u64> {
            self.cleanup_hook_source_handle_generation
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_source_current_generation(&self) -> Option<u64> {
            self.cleanup_hook_source_current_generation
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_source_record_id(&self) -> Option<u64> {
            self.cleanup_hook_source_record_id
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_source_root_id(&self) -> Option<u64> {
            self.cleanup_hook_source_root_id
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_canonical_executable_evidence(&self) -> Option<bool> {
            self.cleanup_hook_canonical_executable_evidence
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
        pub(crate) const fn node_worker_threads_execution(&self) -> bool {
            self.node_worker_threads_execution
        }

        #[must_use]
        pub(crate) const fn napi_cleanup_hook_execution(&self) -> bool {
            self.napi_cleanup_hook_execution
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

        #[cfg(test)]
        pub(crate) fn with_id_for_test(mut self, id: &'static str) -> Self {
            self.id = id.to_owned();
            self
        }

        #[cfg(test)]
        pub(crate) fn with_source_root_id_for_test(mut self, root_id: Option<u64>) -> Self {
            self.source_root_id = root_id;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_lifecycle_transition_for_test(
            mut self,
            lifecycle_transition: Option<NativeRootBridgeLifecycleTransition>,
        ) -> Self {
            self.lifecycle_transition = lifecycle_transition;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_root_handle_action_for_test(
            mut self,
            root_handle_action: NativeRootBridgeHandleAdmissionAction,
        ) -> Self {
            self.root_handle_action = root_handle_action;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_value_handle_action_for_test(
            mut self,
            value_handle_action: Option<NativeRootBridgeHandleAdmissionAction>,
        ) -> Self {
            self.value_handle_action = value_handle_action;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_value_handle_current_generation_for_test(
            mut self,
            value_handle_current_generation: Option<u64>,
        ) -> Self {
            self.value_handle_current_generation = value_handle_current_generation;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_retired_root_source_error_code_for_test(
            mut self,
            retired_root_source_error_code: Option<&'static str>,
        ) -> Self {
            self.retired_root_source_error_code = retired_root_source_error_code;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_cleanup_hook_evidence_status_for_test(
            mut self,
            cleanup_hook_evidence_status: &'static str,
        ) -> Self {
            self.cleanup_hook_evidence_status = cleanup_hook_evidence_status;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_cleanup_hook_evidence_row_id_for_test(
            mut self,
            cleanup_hook_evidence_row_id: Option<&'static str>,
        ) -> Self {
            self.cleanup_hook_evidence_row_id = cleanup_hook_evidence_row_id;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_cleanup_hook_source_row_id_for_test(
            mut self,
            cleanup_hook_source_row_id: Option<&'static str>,
        ) -> Self {
            self.cleanup_hook_source_row_id = cleanup_hook_source_row_id;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_cleanup_hook_source_handle_kind_for_test(
            mut self,
            cleanup_hook_source_handle_kind: Option<BridgeHandleKind>,
        ) -> Self {
            self.cleanup_hook_source_handle_kind = cleanup_hook_source_handle_kind;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_cleanup_hook_source_handle_slot_for_test(
            mut self,
            cleanup_hook_source_handle_slot: Option<u64>,
        ) -> Self {
            self.cleanup_hook_source_handle_slot = cleanup_hook_source_handle_slot;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_native_execution_claim_for_test(mut self) -> Self {
            self.native_execution = true;
            self.public_native_compatibility = true;
            self
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowStatus {
        Linked,
        Rejected,
    }

    impl NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowStatus {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::Linked => {
                    NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_LINKED_STATUS
                }
                Self::Rejected => {
                    NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_REJECTED_STATUS
                }
            }
        }
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink {
        link_status: &'static str,
        model: &'static str,
        validation_model: &'static str,
        handle_table_model: &'static str,
        consumer_status: &'static str,
        batch_gate_status: &'static str,
        response_sequence_gate_status: &'static str,
        stream_roundtrip_gate_status: &'static str,
        batch_id: &'static str,
        stream_id: &'static str,
        validate_json_batch_roundtrip_link_rows_name: &'static str,
        request_count: usize,
        linked_row_count: usize,
        rejected_row_count: usize,
        rows: Vec<NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRow>,
        rejected_rows: Vec<NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRow>,
        source_owned_native_rows: bool,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        node_worker_threads_execution: bool,
        napi_cleanup_hook_execution: bool,
        public_native_compatibility: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink {
        #[must_use]
        pub(crate) const fn link_status(&self) -> &'static str {
            self.link_status
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
        pub(crate) const fn consumer_status(&self) -> &'static str {
            self.consumer_status
        }

        #[must_use]
        pub(crate) const fn batch_gate_status(&self) -> &'static str {
            self.batch_gate_status
        }

        #[must_use]
        pub(crate) const fn response_sequence_gate_status(&self) -> &'static str {
            self.response_sequence_gate_status
        }

        #[must_use]
        pub(crate) const fn stream_roundtrip_gate_status(&self) -> &'static str {
            self.stream_roundtrip_gate_status
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
        pub(crate) const fn validate_json_batch_roundtrip_link_rows_name(&self) -> &'static str {
            self.validate_json_batch_roundtrip_link_rows_name
        }

        #[must_use]
        pub(crate) const fn row_statuses(&self) -> &'static [&'static str] {
            NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_ROW_STATUSES
        }

        #[must_use]
        pub(crate) const fn rejection_case_ids(&self) -> &'static [&'static str] {
            NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_REJECTION_CASE_IDS
        }

        #[must_use]
        pub(crate) const fn request_count(&self) -> usize {
            self.request_count
        }

        #[must_use]
        pub(crate) const fn linked_row_count(&self) -> usize {
            self.linked_row_count
        }

        #[must_use]
        pub(crate) const fn rejected_row_count(&self) -> usize {
            self.rejected_row_count
        }

        #[must_use]
        pub(crate) fn rows(
            &self,
        ) -> &[NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRow] {
            &self.rows
        }

        #[must_use]
        pub(crate) fn rejected_rows(
            &self,
        ) -> &[NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRow] {
            &self.rejected_rows
        }

        #[must_use]
        pub(crate) const fn source_owned_native_rows(&self) -> bool {
            self.source_owned_native_rows
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
        pub(crate) const fn node_worker_threads_execution(&self) -> bool {
            self.node_worker_threads_execution
        }

        #[must_use]
        pub(crate) const fn napi_cleanup_hook_execution(&self) -> bool {
            self.napi_cleanup_hook_execution
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

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRow {
        id: String,
        consumer_row_id: Option<String>,
        lifecycle_row_id: Option<String>,
        response_row_id: Option<String>,
        stream_metadata_row_id: Option<String>,
        stream_payload_row_id: Option<String>,
        batch_id: &'static str,
        stream_id: &'static str,
        batch_index: Option<usize>,
        request_id: Option<u64>,
        kind: String,
        lifecycle_transition: Option<NativeRootBridgeLifecycleTransition>,
        root_handle_action: Option<NativeRootBridgeHandleAdmissionAction>,
        cleanup_hook_evidence_status: Option<&'static str>,
        request_order: Option<usize>,
        response_order: Option<usize>,
        metadata_batch_sequence: Option<usize>,
        payload_batch_sequence: Option<usize>,
        metadata_chunk_kind: Option<NativeRootBridgeJsonTransportStreamChunkKind>,
        payload_chunk_kind: Option<NativeRootBridgeJsonTransportStreamChunkKind>,
        response_status: Option<NativeRootBridgeBatchedJsonTransportLifecycleStatus>,
        payload_assembly_state: Option<NativeRootBridgeJsonTransportStreamAssemblyState>,
        teardown_state: Option<NativeRootBridgeBatchResponseTeardownState>,
        status: NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowStatus,
        code: Option<&'static str>,
        source_owned_native_row: bool,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        node_worker_threads_execution: bool,
        napi_cleanup_hook_execution: bool,
        public_native_compatibility: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRow {
        #[allow(clippy::too_many_arguments)]
        fn new(
            index: usize,
            batch_id: &'static str,
            stream_id: &'static str,
            consumer_row: Option<&NativeRootBridgeBatchLifecycleConsumerRow>,
            lifecycle_row: Option<&NativeRootBridgeBatchedJsonTransportLifecycleRow>,
            response_row: Option<&NativeRootBridgeBatchResponseSequenceRow>,
            stream_metadata_row: Option<&NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow>,
            stream_payload_row: Option<&NativeRootBridgeJsonTransportStreamBatchRoundtripChunkRow>,
            smoke_record: Option<NativeRootBridgeHandleTableAdmissionSmokeRecord>,
        ) -> Self {
            let code =
                get_native_root_bridge_batch_lifecycle_consumer_json_roundtrip_link_rejection_code(
                    NativeRootBridgeBatchLifecycleConsumerJsonRoundtripLinkRowSources {
                        index,
                        batch_id,
                        stream_id,
                        consumer_row,
                        lifecycle_row,
                        response_row,
                        stream_metadata_row,
                        stream_payload_row,
                        smoke_record,
                    },
                );
            let kind = consumer_row
                .map(|row| row.kind())
                .or_else(|| lifecycle_row.map(|row| row.kind()))
                .or_else(|| response_row.map(|row| row.kind()))
                .or_else(|| smoke_record.map(|record| record.kind().code()))
                .unwrap_or("missing");
            let status = if code.is_none() {
                NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowStatus::Linked
            } else {
                NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowStatus::Rejected
            };

            Self {
                id: format!("batch-lifecycle-consumer-json-roundtrip-link-{index}-{kind}"),
                consumer_row_id: consumer_row.map(|row| row.id().to_owned()),
                lifecycle_row_id: lifecycle_row.map(|row| row.id().to_owned()),
                response_row_id: response_row.map(|row| row.id().to_owned()),
                stream_metadata_row_id: stream_metadata_row.map(|row| row.id().to_owned()),
                stream_payload_row_id: stream_payload_row.map(|row| row.id().to_owned()),
                batch_id: response_row
                    .map_or(batch_id, NativeRootBridgeBatchResponseSequenceRow::batch_id),
                stream_id: stream_metadata_row.map_or_else(
                    || stream_payload_row.map_or(stream_id, |row| row.stream_id()),
                    |row| row.stream_id(),
                ),
                batch_index: consumer_row
                    .map(|row| row.batch_index())
                    .or_else(|| lifecycle_row.map(|row| row.batch_index())),
                request_id: consumer_row
                    .map(|row| row.request_id())
                    .or_else(|| lifecycle_row.map(|row| row.request_id()))
                    .or_else(|| response_row.map(|row| row.request_id())),
                kind: kind.to_owned(),
                lifecycle_transition: consumer_row
                    .and_then(|row| row.lifecycle_transition())
                    .or_else(|| lifecycle_row.and_then(|row| row.lifecycle_transition())),
                root_handle_action: consumer_row.map(|row| row.root_handle_action()),
                cleanup_hook_evidence_status: consumer_row
                    .map(|row| row.cleanup_hook_evidence_status()),
                request_order: response_row.map(|row| row.request_order()),
                response_order: response_row.map(|row| row.response_order()),
                metadata_batch_sequence: stream_metadata_row.map(|row| row.batch_sequence()),
                payload_batch_sequence: stream_payload_row.map(|row| row.batch_sequence()),
                metadata_chunk_kind: stream_metadata_row.map(|row| row.chunk_kind()),
                payload_chunk_kind: stream_payload_row.map(|row| row.chunk_kind()),
                response_status: response_row.map(|row| row.response_status()),
                payload_assembly_state: stream_payload_row.map(|row| row.assembly_state()),
                teardown_state: response_row
                    .map(|row| row.teardown_state())
                    .or_else(|| stream_payload_row.map(|row| row.teardown_state())),
                status,
                code,
                source_owned_native_row: code.is_none(),
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

        #[must_use]
        pub(crate) fn id(&self) -> &str {
            &self.id
        }

        #[must_use]
        pub(crate) fn consumer_row_id(&self) -> Option<&str> {
            self.consumer_row_id.as_deref()
        }

        #[must_use]
        pub(crate) fn lifecycle_row_id(&self) -> Option<&str> {
            self.lifecycle_row_id.as_deref()
        }

        #[must_use]
        pub(crate) fn response_row_id(&self) -> Option<&str> {
            self.response_row_id.as_deref()
        }

        #[must_use]
        pub(crate) fn stream_metadata_row_id(&self) -> Option<&str> {
            self.stream_metadata_row_id.as_deref()
        }

        #[must_use]
        pub(crate) fn stream_payload_row_id(&self) -> Option<&str> {
            self.stream_payload_row_id.as_deref()
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
        pub(crate) const fn batch_index(&self) -> Option<usize> {
            self.batch_index
        }

        #[must_use]
        pub(crate) const fn request_id(&self) -> Option<u64> {
            self.request_id
        }

        #[must_use]
        pub(crate) fn kind(&self) -> &str {
            &self.kind
        }

        #[must_use]
        pub(crate) const fn lifecycle_transition(
            &self,
        ) -> Option<NativeRootBridgeLifecycleTransition> {
            self.lifecycle_transition
        }

        #[must_use]
        pub(crate) const fn root_handle_action(
            &self,
        ) -> Option<NativeRootBridgeHandleAdmissionAction> {
            self.root_handle_action
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_evidence_status(&self) -> Option<&'static str> {
            self.cleanup_hook_evidence_status
        }

        #[must_use]
        pub(crate) const fn request_order(&self) -> Option<usize> {
            self.request_order
        }

        #[must_use]
        pub(crate) const fn response_order(&self) -> Option<usize> {
            self.response_order
        }

        #[must_use]
        pub(crate) const fn metadata_batch_sequence(&self) -> Option<usize> {
            self.metadata_batch_sequence
        }

        #[must_use]
        pub(crate) const fn payload_batch_sequence(&self) -> Option<usize> {
            self.payload_batch_sequence
        }

        #[must_use]
        pub(crate) const fn metadata_chunk_kind(
            &self,
        ) -> Option<NativeRootBridgeJsonTransportStreamChunkKind> {
            self.metadata_chunk_kind
        }

        #[must_use]
        pub(crate) const fn payload_chunk_kind(
            &self,
        ) -> Option<NativeRootBridgeJsonTransportStreamChunkKind> {
            self.payload_chunk_kind
        }

        #[must_use]
        pub(crate) const fn response_status(
            &self,
        ) -> Option<NativeRootBridgeBatchedJsonTransportLifecycleStatus> {
            self.response_status
        }

        #[must_use]
        pub(crate) const fn payload_assembly_state(
            &self,
        ) -> Option<NativeRootBridgeJsonTransportStreamAssemblyState> {
            self.payload_assembly_state
        }

        #[must_use]
        pub(crate) const fn teardown_state(
            &self,
        ) -> Option<NativeRootBridgeBatchResponseTeardownState> {
            self.teardown_state
        }

        #[must_use]
        pub(crate) const fn status(
            &self,
        ) -> NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowStatus {
            self.status
        }

        #[must_use]
        pub(crate) const fn code(&self) -> Option<&'static str> {
            self.code
        }

        #[must_use]
        pub(crate) const fn source_owned_native_row(&self) -> bool {
            self.source_owned_native_row
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
        pub(crate) const fn node_worker_threads_execution(&self) -> bool {
            self.node_worker_threads_execution
        }

        #[must_use]
        pub(crate) const fn napi_cleanup_hook_execution(&self) -> bool {
            self.napi_cleanup_hook_execution
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

