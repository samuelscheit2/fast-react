    #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
    struct NativeRootBridgeCleanupGenerationConsumptionKey {
        executor_generation: u64,
        source_environment_id: BridgeEnvironmentId,
        source_root_handle: BridgeHandle,
        source_root_id: u64,
        cleanup_hook_source_worker_thread_id: u64,
        cleanup_hook_source_environment_id: BridgeEnvironmentId,
        root_cleanup_hook_evidence_row_id: &'static str,
        root_cleanup_hook_source_row_id: &'static str,
        root_cleanup_hook_source_provenance_token: Option<&'static str>,
        root_handle_current_generation: u64,
        root_cleanup_current_generation: u64,
        value_cleanup_hook_evidence_row_id: &'static str,
        value_cleanup_hook_source_row_id: &'static str,
        value_cleanup_hook_source_provenance_token: Option<&'static str>,
        source_value_handle: BridgeHandle,
        value_handle_current_generation: u64,
        value_cleanup_current_generation: u64,
    }

    #[cfg(test)]
    #[derive(Debug, Clone, PartialEq, Eq, Hash)]
    struct NativeRootBridgeCleanupGenerationCurrentnessReentryGuardKey {
        current_executor_generation: u64,
        cleanup_executor_generation: u64,
        lifecycle_consumer_row_id: String,
        source_environment_id: BridgeEnvironmentId,
        source_root_handle: BridgeHandle,
        source_root_id: u64,
        root_cleanup_handoff_row_id: String,
        root_cleanup_hook_evidence_row_id: &'static str,
        root_cleanup_hook_source_row_id: &'static str,
        root_cleanup_hook_source_provenance_token: Option<&'static str>,
        source_value_handle: BridgeHandle,
        value_cleanup_handoff_row_id: String,
        value_cleanup_hook_evidence_row_id: &'static str,
        value_cleanup_hook_source_row_id: &'static str,
        value_cleanup_hook_source_provenance_token: Option<&'static str>,
        cleanup_hook_source_worker_thread_id: u64,
        cleanup_hook_source_environment_id: BridgeEnvironmentId,
        lifecycle_transition: NativeRootBridgeLifecycleTransition,
        root_handle_state_before: NativeRootBridgeRootHandleState,
        root_handle_state_after: NativeRootBridgeRootHandleState,
        root_handle_current_generation: u64,
        value_handle_current_generation: u64,
        root_cleanup_current_generation: u64,
        value_cleanup_current_generation: u64,
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeCleanupGenerationConsumer {
        status: &'static str,
        model: &'static str,
        validation_model: &'static str,
        handle_table_model: &'static str,
        executor_status: &'static str,
        cleanup_hook_preflight_status: &'static str,
        executor_generation: u64,
        source_rows_validated: bool,
        cleanup_hook_preflight_accepted: bool,
        cleanup_generation_consumed: bool,
        cleanup_generation_error_code: Option<&'static str>,
        consumed_cleanup_generation_count: usize,
        rows: Vec<NativeRootBridgeCleanupGenerationConsumerRow>,
        node_worker_threads_execution: bool,
        napi_cleanup_hook_execution: bool,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        public_native_compatibility: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeCleanupGenerationConsumer {
        fn new(
            executor: &NativeRootBridgeJsonBatchLifecycleExecutor,
            cleanup_hook_preflight: &NativeRootBridgeWorkerThreadCleanupHookPreflight,
            result: Result<Vec<NativeRootBridgeCleanupGenerationConsumerRow>, &'static str>,
        ) -> Self {
            let cleanup_generation_error_code = result.as_ref().err().copied();
            let rows = result.unwrap_or_default();
            let cleanup_generation_consumed = cleanup_generation_error_code.is_none();

            Self {
                status: NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STATUS,
                model: NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_MODEL,
                validation_model: super::NATIVE_ROOT_BRIDGE_REQUEST_VALIDATION_MODEL,
                handle_table_model: super::NATIVE_ROOT_BRIDGE_HANDLE_TABLE_MODEL,
                executor_status: executor.status(),
                cleanup_hook_preflight_status: cleanup_hook_preflight.status(),
                executor_generation: executor.executor_generation(),
                source_rows_validated: cleanup_generation_consumed,
                cleanup_hook_preflight_accepted: cleanup_hook_preflight
                    .canonical_executable_evidence_accepted(),
                cleanup_generation_consumed,
                cleanup_generation_error_code,
                consumed_cleanup_generation_count: rows.len(),
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
        pub(crate) const fn executor_status(&self) -> &'static str {
            self.executor_status
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_preflight_status(&self) -> &'static str {
            self.cleanup_hook_preflight_status
        }

        #[must_use]
        pub(crate) const fn executor_generation(&self) -> u64 {
            self.executor_generation
        }

        #[must_use]
        pub(crate) const fn source_rows_validated(&self) -> bool {
            self.source_rows_validated
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_preflight_accepted(&self) -> bool {
            self.cleanup_hook_preflight_accepted
        }

        #[must_use]
        pub(crate) const fn cleanup_generation_consumed(&self) -> bool {
            self.cleanup_generation_consumed
        }

        #[must_use]
        pub(crate) const fn cleanup_generation_error_code(&self) -> Option<&'static str> {
            self.cleanup_generation_error_code
        }

        #[must_use]
        pub(crate) const fn consumed_cleanup_generation_count(&self) -> usize {
            self.consumed_cleanup_generation_count
        }

        #[must_use]
        pub(crate) fn rows(&self) -> &[NativeRootBridgeCleanupGenerationConsumerRow] {
            &self.rows
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
    pub(crate) struct NativeRootBridgeCleanupGenerationConsumerRow {
        id: String,
        executor_generation: u64,
        executor_row_id: String,
        cleanup_hook_evidence_row_id: &'static str,
        cleanup_hook_source_worker_thread_id: u64,
        cleanup_hook_source_environment_id: BridgeEnvironmentId,
        cleanup_hook_source_row_id: &'static str,
        cleanup_hook_source_provenance_token: Option<&'static str>,
        batch_index: usize,
        request_id: u64,
        kind: &'static str,
        source_environment_id: BridgeEnvironmentId,
        source_root_handle: BridgeHandle,
        source_root_id: u64,
        source_handle_kind: BridgeHandleKind,
        source_handle: BridgeHandle,
        executor_handle_current_generation: u64,
        cleanup_hook_source_current_generation: u64,
        source_owned_executor_row: bool,
        cleanup_hook_order_private: bool,
        cleanup_hook_identity_private: bool,
        canonical_executable_evidence: bool,
        node_worker_threads_execution: bool,
        napi_cleanup_hook_execution: bool,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        public_native_compatibility: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeCleanupGenerationConsumerRow {
        fn new(
            executor_generation: u64,
            executor_row: &NativeRootBridgeJsonBatchLifecycleExecutorRow,
            cleanup_hook_row: NativeRootBridgeWorkerThreadCleanupHookPreflightRow,
            source_handle: BridgeHandle,
            executor_handle_current_generation: u64,
            cleanup_hook_source_current_generation: u64,
        ) -> Self {
            let source_handle_kind = cleanup_hook_row.source_handle_kind();

            Self {
                id: format!(
                    "cleanup-generation-consumer-{}-{}",
                    executor_row.batch_index(),
                    bridge_handle_kind_code(source_handle_kind)
                ),
                executor_generation,
                executor_row_id: executor_row.id().to_owned(),
                cleanup_hook_evidence_row_id: cleanup_hook_row.id(),
                cleanup_hook_source_worker_thread_id: cleanup_hook_row.source_worker_thread_id(),
                cleanup_hook_source_environment_id: cleanup_hook_row.source_environment_id(),
                cleanup_hook_source_row_id: cleanup_hook_row.source_row_id(),
                cleanup_hook_source_provenance_token: cleanup_hook_row.source_provenance_token(),
                batch_index: executor_row.batch_index(),
                request_id: executor_row.request_id(),
                kind: executor_row.kind(),
                source_environment_id: executor_row.source_environment_id(),
                source_root_handle: executor_row.source_root_handle(),
                source_root_id: executor_row.source_root_id(),
                source_handle_kind,
                source_handle,
                executor_handle_current_generation,
                cleanup_hook_source_current_generation,
                source_owned_executor_row: executor_row.source_owned_json_row()
                    && executor_row.rust_state_machine_execution(),
                cleanup_hook_order_private: cleanup_hook_row.cleanup_hook_order_private(),
                cleanup_hook_identity_private: cleanup_hook_row.cleanup_hook_identity_private(),
                canonical_executable_evidence: cleanup_hook_row.canonical_executable_evidence(),
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
        pub(crate) const fn executor_generation(&self) -> u64 {
            self.executor_generation
        }

        #[must_use]
        pub(crate) fn executor_row_id(&self) -> &str {
            &self.executor_row_id
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_evidence_row_id(&self) -> &'static str {
            self.cleanup_hook_evidence_row_id
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_source_worker_thread_id(&self) -> u64 {
            self.cleanup_hook_source_worker_thread_id
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_source_environment_id(&self) -> BridgeEnvironmentId {
            self.cleanup_hook_source_environment_id
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_source_row_id(&self) -> &'static str {
            self.cleanup_hook_source_row_id
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_source_provenance_token(&self) -> Option<&'static str> {
            self.cleanup_hook_source_provenance_token
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
        pub(crate) const fn source_handle_kind(&self) -> BridgeHandleKind {
            self.source_handle_kind
        }

        #[must_use]
        pub(crate) const fn source_handle(&self) -> BridgeHandle {
            self.source_handle
        }

        #[must_use]
        pub(crate) const fn executor_handle_current_generation(&self) -> u64 {
            self.executor_handle_current_generation
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_source_current_generation(&self) -> u64 {
            self.cleanup_hook_source_current_generation
        }

        #[must_use]
        pub(crate) const fn source_owned_executor_row(&self) -> bool {
            self.source_owned_executor_row
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_order_private(&self) -> bool {
            self.cleanup_hook_order_private
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_identity_private(&self) -> bool {
            self.cleanup_hook_identity_private
        }

        #[must_use]
        pub(crate) const fn canonical_executable_evidence(&self) -> bool {
            self.canonical_executable_evidence
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
        pub(crate) fn with_executor_row_id_for_test(
            mut self,
            executor_row_id: &'static str,
        ) -> Self {
            self.executor_row_id = executor_row_id.to_owned();
            self
        }

        #[cfg(test)]
        pub(crate) fn with_source_environment_id_for_test(
            mut self,
            source_environment_id: BridgeEnvironmentId,
        ) -> Self {
            self.source_environment_id = source_environment_id;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_source_handle_for_test(mut self, source_handle: BridgeHandle) -> Self {
            self.source_handle = source_handle;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_cleanup_hook_source_worker_thread_id_for_test(
            mut self,
            source_worker_thread_id: u64,
        ) -> Self {
            self.cleanup_hook_source_worker_thread_id = source_worker_thread_id;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_cleanup_hook_source_environment_id_for_test(
            mut self,
            source_environment_id: BridgeEnvironmentId,
        ) -> Self {
            self.cleanup_hook_source_environment_id = source_environment_id;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_cleanup_hook_source_provenance_token_for_test(
            mut self,
            token: Option<&'static str>,
        ) -> Self {
            self.cleanup_hook_source_provenance_token = token;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_source_owned_executor_row_for_test(
            mut self,
            source_owned_executor_row: bool,
        ) -> Self {
            self.source_owned_executor_row = source_owned_executor_row;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_cleanup_hook_identity_private_for_test(
            mut self,
            cleanup_hook_identity_private: bool,
        ) -> Self {
            self.cleanup_hook_identity_private = cleanup_hook_identity_private;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_canonical_executable_evidence_for_test(
            mut self,
            canonical_executable_evidence: bool,
        ) -> Self {
            self.canonical_executable_evidence = canonical_executable_evidence;
            self
        }

        #[cfg(test)]
        pub(crate) fn with_native_execution_claim_for_test(mut self) -> Self {
            self.native_execution = true;
            self.public_native_compatibility = true;
            self
        }
    }

    #[cfg(test)]
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeCleanupGenerationCurrentnessCanary {
        status: &'static str,
        model: &'static str,
        lifecycle_consumer_status: &'static str,
        cleanup_generation_consumer_status: &'static str,
        cleanup_hook_preflight_status: &'static str,
        current_executor_generation: u64,
        cleanup_executor_generation: u64,
        cleanup_handoff_current: bool,
        cleanup_handoff_error_code: Option<&'static str>,
        cleanup_reentry_guard_consumed: bool,
        accepted_cleanup_handoff_count: usize,
        rows: Vec<NativeRootBridgeCleanupGenerationCurrentnessCanaryRow>,
        node_worker_threads_execution: bool,
        napi_cleanup_hook_execution: bool,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        public_native_compatibility: bool,
        react_behavior_error: bool,
    }

    #[cfg(test)]
    impl NativeRootBridgeCleanupGenerationCurrentnessCanary {
        fn new(
            lifecycle_consumer: &NativeRootBridgeBatchLifecycleConsumer,
            cleanup_generation_consumer: &NativeRootBridgeCleanupGenerationConsumer,
            cleanup_hook_preflight: &NativeRootBridgeWorkerThreadCleanupHookPreflight,
            result: Result<
                Vec<NativeRootBridgeCleanupGenerationCurrentnessCanaryRow>,
                &'static str,
            >,
        ) -> Self {
            let cleanup_handoff_error_code = result.as_ref().err().copied();
            let rows = result.unwrap_or_default();
            let cleanup_handoff_current = cleanup_handoff_error_code.is_none();

            Self {
                status: NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CANARY_STATUS,
                model: NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CANARY_MODEL,
                lifecycle_consumer_status: lifecycle_consumer.status(),
                cleanup_generation_consumer_status: cleanup_generation_consumer.status(),
                cleanup_hook_preflight_status: cleanup_hook_preflight.status(),
                current_executor_generation: lifecycle_consumer
                    .json_batch_lifecycle_executor_generation(),
                cleanup_executor_generation: cleanup_generation_consumer.executor_generation(),
                cleanup_handoff_current,
                cleanup_handoff_error_code,
                cleanup_reentry_guard_consumed: cleanup_handoff_current,
                accepted_cleanup_handoff_count: rows.len(),
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

        #[must_use]
        pub(crate) const fn status(&self) -> &'static str {
            self.status
        }

        #[must_use]
        pub(crate) const fn model(&self) -> &'static str {
            self.model
        }

        #[must_use]
        pub(crate) const fn lifecycle_consumer_status(&self) -> &'static str {
            self.lifecycle_consumer_status
        }

        #[must_use]
        pub(crate) const fn cleanup_generation_consumer_status(&self) -> &'static str {
            self.cleanup_generation_consumer_status
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_preflight_status(&self) -> &'static str {
            self.cleanup_hook_preflight_status
        }

        #[must_use]
        pub(crate) const fn current_executor_generation(&self) -> u64 {
            self.current_executor_generation
        }

        #[must_use]
        pub(crate) const fn cleanup_executor_generation(&self) -> u64 {
            self.cleanup_executor_generation
        }

        #[must_use]
        pub(crate) const fn cleanup_handoff_current(&self) -> bool {
            self.cleanup_handoff_current
        }

        #[must_use]
        pub(crate) const fn cleanup_handoff_error_code(&self) -> Option<&'static str> {
            self.cleanup_handoff_error_code
        }

        #[must_use]
        pub(crate) const fn cleanup_reentry_guard_consumed(&self) -> bool {
            self.cleanup_reentry_guard_consumed
        }

        #[must_use]
        pub(crate) const fn accepted_cleanup_handoff_count(&self) -> usize {
            self.accepted_cleanup_handoff_count
        }

        #[must_use]
        pub(crate) fn rows(&self) -> &[NativeRootBridgeCleanupGenerationCurrentnessCanaryRow] {
            &self.rows
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

    #[cfg(test)]
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeCleanupGenerationCurrentnessCanaryRow {
        id: String,
        lifecycle_consumer_row_id: String,
        cleanup_handoff_row_id: String,
        current_executor_generation: u64,
        cleanup_executor_generation: u64,
        batch_index: usize,
        request_id: u64,
        kind: &'static str,
        lifecycle_transition: NativeRootBridgeLifecycleTransition,
        root_handle_state_before: NativeRootBridgeRootHandleState,
        root_handle_state_after: NativeRootBridgeRootHandleState,
        source_environment_id: BridgeEnvironmentId,
        source_root_handle: BridgeHandle,
        source_root_id: u64,
        source_handle_kind: BridgeHandleKind,
        source_handle: BridgeHandle,
        handle_table_current_generation: u64,
        cleanup_current_generation: u64,
        cleanup_hook_evidence_row_id: &'static str,
        cleanup_hook_source_worker_thread_id: u64,
        cleanup_hook_source_environment_id: BridgeEnvironmentId,
        cleanup_hook_source_row_id: &'static str,
        cleanup_hook_source_provenance_token: Option<&'static str>,
        cleanup_hook_id: &'static str,
        cleanup_hook_function_identity_token: &'static str,
        cleanup_hook_argument_identity_token: &'static str,
        cleanup_reentry_guard_status: &'static str,
        source_owned_cleanup_handoff: bool,
        source_currentness_monotonic: bool,
        cleanup_hook_order_private: bool,
        cleanup_hook_identity_private: bool,
        canonical_executable_evidence: bool,
        node_worker_threads_execution: bool,
        napi_cleanup_hook_execution: bool,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        public_native_compatibility: bool,
        react_behavior_error: bool,
    }

    #[cfg(test)]
    impl NativeRootBridgeCleanupGenerationCurrentnessCanaryRow {
        fn new(
            lifecycle_row: &NativeRootBridgeBatchLifecycleConsumerRow,
            cleanup_row: &NativeRootBridgeCleanupGenerationConsumerRow,
            cleanup_hook_row: NativeRootBridgeWorkerThreadCleanupHookPreflightRow,
            current_executor_generation: u64,
        ) -> Self {
            Self {
                id: format!(
                    "cleanup-generation-currentness-canary-{}-{}",
                    cleanup_row.batch_index(),
                    bridge_handle_kind_code(cleanup_row.source_handle_kind())
                ),
                lifecycle_consumer_row_id: lifecycle_row.id().to_owned(),
                cleanup_handoff_row_id: cleanup_row.id().to_owned(),
                current_executor_generation,
                cleanup_executor_generation: cleanup_row.executor_generation(),
                batch_index: cleanup_row.batch_index(),
                request_id: cleanup_row.request_id(),
                kind: cleanup_row.kind(),
                lifecycle_transition: lifecycle_row
                    .lifecycle_transition()
                    .unwrap_or(NativeRootBridgeLifecycleTransition::ActiveToActive),
                root_handle_state_before: lifecycle_row
                    .root_handle_state_before()
                    .unwrap_or(NativeRootBridgeRootHandleState::Active),
                root_handle_state_after: lifecycle_row.root_handle_state_after(),
                source_environment_id: cleanup_row.source_environment_id(),
                source_root_handle: cleanup_row.source_root_handle(),
                source_root_id: cleanup_row.source_root_id(),
                source_handle_kind: cleanup_row.source_handle_kind(),
                source_handle: cleanup_row.source_handle(),
                handle_table_current_generation: cleanup_row.executor_handle_current_generation(),
                cleanup_current_generation: cleanup_row.cleanup_hook_source_current_generation(),
                cleanup_hook_evidence_row_id: cleanup_row.cleanup_hook_evidence_row_id(),
                cleanup_hook_source_worker_thread_id: cleanup_row
                    .cleanup_hook_source_worker_thread_id(),
                cleanup_hook_source_environment_id: cleanup_row
                    .cleanup_hook_source_environment_id(),
                cleanup_hook_source_row_id: cleanup_row.cleanup_hook_source_row_id(),
                cleanup_hook_source_provenance_token: cleanup_row
                    .cleanup_hook_source_provenance_token(),
                cleanup_hook_id: cleanup_hook_row.cleanup_hook_id(),
                cleanup_hook_function_identity_token: cleanup_hook_row
                    .cleanup_hook_function_identity_token(),
                cleanup_hook_argument_identity_token: cleanup_hook_row
                    .cleanup_hook_argument_identity_token(),
                cleanup_reentry_guard_status: "cleanup-generation-currentness-reentry-guard-pending",
                source_owned_cleanup_handoff: cleanup_row.source_owned_executor_row(),
                source_currentness_monotonic: cleanup_row.cleanup_hook_source_current_generation()
                    > cleanup_row.executor_handle_current_generation(),
                cleanup_hook_order_private: cleanup_row.cleanup_hook_order_private(),
                cleanup_hook_identity_private: cleanup_row.cleanup_hook_identity_private(),
                canonical_executable_evidence: cleanup_row.canonical_executable_evidence(),
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
        pub(crate) fn lifecycle_consumer_row_id(&self) -> &str {
            &self.lifecycle_consumer_row_id
        }

        #[must_use]
        pub(crate) fn cleanup_handoff_row_id(&self) -> &str {
            &self.cleanup_handoff_row_id
        }

        #[must_use]
        pub(crate) const fn current_executor_generation(&self) -> u64 {
            self.current_executor_generation
        }

        #[must_use]
        pub(crate) const fn cleanup_executor_generation(&self) -> u64 {
            self.cleanup_executor_generation
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
        pub(crate) const fn lifecycle_transition(&self) -> NativeRootBridgeLifecycleTransition {
            self.lifecycle_transition
        }

        #[must_use]
        pub(crate) const fn root_handle_state_before(&self) -> NativeRootBridgeRootHandleState {
            self.root_handle_state_before
        }

        #[must_use]
        pub(crate) const fn root_handle_state_after(&self) -> NativeRootBridgeRootHandleState {
            self.root_handle_state_after
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
        pub(crate) const fn source_handle_kind(&self) -> BridgeHandleKind {
            self.source_handle_kind
        }

        #[must_use]
        pub(crate) const fn source_handle(&self) -> BridgeHandle {
            self.source_handle
        }

        #[must_use]
        pub(crate) const fn handle_table_current_generation(&self) -> u64 {
            self.handle_table_current_generation
        }

        #[must_use]
        pub(crate) const fn cleanup_current_generation(&self) -> u64 {
            self.cleanup_current_generation
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_evidence_row_id(&self) -> &'static str {
            self.cleanup_hook_evidence_row_id
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_source_worker_thread_id(&self) -> u64 {
            self.cleanup_hook_source_worker_thread_id
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_source_environment_id(&self) -> BridgeEnvironmentId {
            self.cleanup_hook_source_environment_id
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_source_row_id(&self) -> &'static str {
            self.cleanup_hook_source_row_id
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_source_provenance_token(&self) -> Option<&'static str> {
            self.cleanup_hook_source_provenance_token
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_id(&self) -> &'static str {
            self.cleanup_hook_id
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_function_identity_token(&self) -> &'static str {
            self.cleanup_hook_function_identity_token
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_argument_identity_token(&self) -> &'static str {
            self.cleanup_hook_argument_identity_token
        }

        #[must_use]
        pub(crate) const fn cleanup_reentry_guard_status(&self) -> &'static str {
            self.cleanup_reentry_guard_status
        }

        #[must_use]
        pub(crate) const fn source_owned_cleanup_handoff(&self) -> bool {
            self.source_owned_cleanup_handoff
        }

        #[must_use]
        pub(crate) const fn source_currentness_monotonic(&self) -> bool {
            self.source_currentness_monotonic
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_order_private(&self) -> bool {
            self.cleanup_hook_order_private
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_identity_private(&self) -> bool {
            self.cleanup_hook_identity_private
        }

        #[must_use]
        pub(crate) const fn canonical_executable_evidence(&self) -> bool {
            self.canonical_executable_evidence
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

        fn with_cleanup_reentry_guard_consumed(mut self) -> Self {
            self.cleanup_reentry_guard_status =
                NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_GUARD_CONSUMED_STATUS;
            self
        }
    }

