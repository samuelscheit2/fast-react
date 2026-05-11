    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeCrossEnvironmentTeardownGate {
        status: &'static str,
        handle_table_model: &'static str,
        handle_table_diagnostics: BridgeHandleTableTeardownIsolationDiagnostics,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeCrossEnvironmentTeardownGate {
        #[must_use]
        pub(crate) const fn status(&self) -> &'static str {
            self.status
        }

        #[must_use]
        pub(crate) const fn handle_table_model(&self) -> &'static str {
            self.handle_table_model
        }

        #[must_use]
        pub(crate) const fn handle_table_diagnostics(
            &self,
        ) -> &BridgeHandleTableTeardownIsolationDiagnostics {
            &self.handle_table_diagnostics
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
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeTransportWorkerThreadTeardownGate {
        status: &'static str,
        transport: &'static str,
        worker_thread_id: u64,
        worker_environment_id: BridgeEnvironmentId,
        peer_environment_id: BridgeEnvironmentId,
        batched_record_gate: NativeRootBridgeBatchedJsonTransportGate,
        cross_environment_teardown_gate: NativeRootBridgeCrossEnvironmentTeardownGate,
        mismatched_teardown: BridgeEnvironmentTeardown,
        matched_teardown: BridgeEnvironmentTeardown,
        rows: Vec<NativeRootBridgeTransportWorkerThreadTeardownRow>,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeTransportWorkerThreadTeardownGate {
        #[must_use]
        pub(crate) const fn status(&self) -> &'static str {
            self.status
        }

        #[must_use]
        pub(crate) const fn transport(&self) -> &'static str {
            self.transport
        }

        #[must_use]
        pub(crate) const fn worker_thread_id(&self) -> u64 {
            self.worker_thread_id
        }

        #[must_use]
        pub(crate) const fn worker_environment_id(&self) -> BridgeEnvironmentId {
            self.worker_environment_id
        }

        #[must_use]
        pub(crate) const fn peer_environment_id(&self) -> BridgeEnvironmentId {
            self.peer_environment_id
        }

        #[must_use]
        pub(crate) const fn batched_record_gate(
            &self,
        ) -> &NativeRootBridgeBatchedJsonTransportGate {
            &self.batched_record_gate
        }

        #[must_use]
        pub(crate) const fn cross_environment_teardown_gate(
            &self,
        ) -> &NativeRootBridgeCrossEnvironmentTeardownGate {
            &self.cross_environment_teardown_gate
        }

        #[must_use]
        pub(crate) const fn mismatched_teardown(&self) -> BridgeEnvironmentTeardown {
            self.mismatched_teardown
        }

        #[must_use]
        pub(crate) const fn matched_teardown(&self) -> BridgeEnvironmentTeardown {
            self.matched_teardown
        }

        #[must_use]
        pub(crate) fn rows(&self) -> &[NativeRootBridgeTransportWorkerThreadTeardownRow] {
            &self.rows
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
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeWorkerThreadTeardownExecutablePreflight {
        status: &'static str,
        model: &'static str,
        execution_scope: &'static str,
        transport: &'static str,
        worker_thread_id: u64,
        worker_environment_id: BridgeEnvironmentId,
        peer_environment_id: BridgeEnvironmentId,
        transport_worker_thread_teardown_gate_status: &'static str,
        batched_record_gate_status: &'static str,
        cross_environment_teardown_gate_status: &'static str,
        accepted_batch_record_count: usize,
        cross_environment_teardown_row_count: usize,
        mismatched_teardown: BridgeEnvironmentTeardown,
        matched_teardown: BridgeEnvironmentTeardown,
        stale_worker_handle_rejection_count: usize,
        active_peer_handle_count: usize,
        root_validator_state_preserved: bool,
        rows: Vec<NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow>,
        preflight_evaluated: bool,
        node_worker_threads_execution: bool,
        napi_cleanup_hook_execution: bool,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        public_native_compatibility: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeWorkerThreadTeardownExecutablePreflight {
        #[must_use]
        pub(crate) const fn status(&self) -> &'static str {
            self.status
        }

        #[must_use]
        pub(crate) const fn model(&self) -> &'static str {
            self.model
        }

        #[must_use]
        pub(crate) const fn execution_scope(&self) -> &'static str {
            self.execution_scope
        }

        #[must_use]
        pub(crate) const fn transport(&self) -> &'static str {
            self.transport
        }

        #[must_use]
        pub(crate) const fn worker_thread_id(&self) -> u64 {
            self.worker_thread_id
        }

        #[must_use]
        pub(crate) const fn worker_environment_id(&self) -> BridgeEnvironmentId {
            self.worker_environment_id
        }

        #[must_use]
        pub(crate) const fn peer_environment_id(&self) -> BridgeEnvironmentId {
            self.peer_environment_id
        }

        #[must_use]
        pub(crate) const fn transport_worker_thread_teardown_gate_status(&self) -> &'static str {
            self.transport_worker_thread_teardown_gate_status
        }

        #[must_use]
        pub(crate) const fn batched_record_gate_status(&self) -> &'static str {
            self.batched_record_gate_status
        }

        #[must_use]
        pub(crate) const fn cross_environment_teardown_gate_status(&self) -> &'static str {
            self.cross_environment_teardown_gate_status
        }

        #[must_use]
        pub(crate) const fn accepted_batch_record_count(&self) -> usize {
            self.accepted_batch_record_count
        }

        #[must_use]
        pub(crate) const fn cross_environment_teardown_row_count(&self) -> usize {
            self.cross_environment_teardown_row_count
        }

        #[must_use]
        pub(crate) const fn mismatched_teardown(&self) -> BridgeEnvironmentTeardown {
            self.mismatched_teardown
        }

        #[must_use]
        pub(crate) const fn matched_teardown(&self) -> BridgeEnvironmentTeardown {
            self.matched_teardown
        }

        #[must_use]
        pub(crate) const fn stale_worker_handle_rejection_count(&self) -> usize {
            self.stale_worker_handle_rejection_count
        }

        #[must_use]
        pub(crate) const fn active_peer_handle_count(&self) -> usize {
            self.active_peer_handle_count
        }

        #[must_use]
        pub(crate) const fn root_validator_state_preserved(&self) -> bool {
            self.root_validator_state_preserved
        }

        #[must_use]
        pub(crate) fn rows(&self) -> &[NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow] {
            &self.rows
        }

        #[must_use]
        pub(crate) const fn preflight_evaluated(&self) -> bool {
            self.preflight_evaluated
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

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow {
        id: &'static str,
        operation: &'static str,
        assertion: &'static str,
        worker_thread_id: u64,
        handle_kind: BridgeHandleKind,
        table_environment_id: BridgeEnvironmentId,
        handle_environment_id: BridgeEnvironmentId,
        slot: u64,
        handle_generation: u64,
        current_generation: Option<u64>,
        record_id: Option<u64>,
        source_root_id: Option<u64>,
        source_error_code: Option<&'static str>,
        boundary_error_code: Option<&'static str>,
        rejected_by_boundary: bool,
        peer_invariant_preserved: bool,
        preflight_passed: bool,
        node_worker_threads_execution: bool,
        napi_cleanup_hook_execution: bool,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        public_native_compatibility: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow {
        fn rejected(init: NativeRootBridgeWorkerThreadTeardownPreflightRejectedRowInit) -> Self {
            Self::new(NativeRootBridgeWorkerThreadTeardownPreflightRowInit {
                id: init.id,
                operation: init.operation,
                assertion: init.assertion,
                worker_thread_id: init.worker_thread_id,
                handle: init.handle,
                table_environment_id: init.table_environment_id,
                current_generation: current_generation_for_handle_table_error(init.error),
                record_id: None,
                source_root_id: init.source_root_id,
                source_error_code: Some(init.error.code()),
                boundary_error_code: Some(boundary_error_code_for_handle_table_error(init.error)),
                rejected_by_boundary: true,
                peer_invariant_preserved: false,
                preflight_passed: matches!(
                    init.error,
                    BridgeHandleTableError::StaleHandle { .. }
                        | BridgeHandleTableError::DisposedHandle { .. }
                ),
            })
        }

        fn active_peer(
            id: &'static str,
            operation: &'static str,
            worker_thread_id: u64,
            table: &BridgeHandleTable,
            handle: BridgeHandle,
            record_id: u64,
        ) -> Self {
            Self::new(NativeRootBridgeWorkerThreadTeardownPreflightRowInit {
                id,
                operation,
                assertion: "peer-handle-remains-active-after-worker-teardown",
                worker_thread_id,
                handle,
                table_environment_id: table.environment_id(),
                current_generation: Some(handle.generation()),
                record_id: Some(record_id),
                source_root_id: if handle.kind() == BridgeHandleKind::Root {
                    Some(record_id)
                } else {
                    None
                },
                source_error_code: None,
                boundary_error_code: None,
                rejected_by_boundary: false,
                peer_invariant_preserved: true,
                preflight_passed: true,
            })
        }

        const fn new(init: NativeRootBridgeWorkerThreadTeardownPreflightRowInit) -> Self {
            Self {
                id: init.id,
                operation: init.operation,
                assertion: init.assertion,
                worker_thread_id: init.worker_thread_id,
                handle_kind: init.handle.kind(),
                table_environment_id: init.table_environment_id,
                handle_environment_id: init.handle.environment_id(),
                slot: init.handle.slot(),
                handle_generation: init.handle.generation(),
                current_generation: init.current_generation,
                record_id: init.record_id,
                source_root_id: init.source_root_id,
                source_error_code: init.source_error_code,
                boundary_error_code: init.boundary_error_code,
                rejected_by_boundary: init.rejected_by_boundary,
                peer_invariant_preserved: init.peer_invariant_preserved,
                preflight_passed: init.preflight_passed,
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
        pub(crate) const fn id(self) -> &'static str {
            self.id
        }

        #[must_use]
        pub(crate) const fn operation(self) -> &'static str {
            self.operation
        }

        #[must_use]
        pub(crate) const fn assertion(self) -> &'static str {
            self.assertion
        }

        #[must_use]
        pub(crate) const fn worker_thread_id(self) -> u64 {
            self.worker_thread_id
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
        pub(crate) const fn source_root_id(self) -> Option<u64> {
            self.source_root_id
        }

        #[must_use]
        pub(crate) const fn source_error_code(self) -> Option<&'static str> {
            self.source_error_code
        }

        #[must_use]
        pub(crate) const fn boundary_error_code(self) -> Option<&'static str> {
            self.boundary_error_code
        }

        #[must_use]
        pub(crate) const fn rejected_by_boundary(self) -> bool {
            self.rejected_by_boundary
        }

        #[must_use]
        pub(crate) const fn peer_invariant_preserved(self) -> bool {
            self.peer_invariant_preserved
        }

        #[must_use]
        pub(crate) const fn preflight_passed(self) -> bool {
            self.preflight_passed
        }

        #[must_use]
        pub(crate) const fn node_worker_threads_execution(self) -> bool {
            self.node_worker_threads_execution
        }

        #[must_use]
        pub(crate) const fn napi_cleanup_hook_execution(self) -> bool {
            self.napi_cleanup_hook_execution
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
        pub(crate) const fn public_native_compatibility(self) -> bool {
            self.public_native_compatibility
        }

        #[must_use]
        pub(crate) const fn react_behavior_error(self) -> bool {
            self.react_behavior_error
        }
    }

    struct NativeRootBridgeWorkerThreadTeardownPreflightRowInit {
        id: &'static str,
        operation: &'static str,
        assertion: &'static str,
        worker_thread_id: u64,
        handle: BridgeHandle,
        table_environment_id: BridgeEnvironmentId,
        current_generation: Option<u64>,
        record_id: Option<u64>,
        source_root_id: Option<u64>,
        source_error_code: Option<&'static str>,
        boundary_error_code: Option<&'static str>,
        rejected_by_boundary: bool,
        peer_invariant_preserved: bool,
        preflight_passed: bool,
    }

    struct NativeRootBridgeWorkerThreadTeardownPreflightRejectedRowInit<'a> {
        id: &'static str,
        operation: &'static str,
        assertion: &'static str,
        worker_thread_id: u64,
        handle: BridgeHandle,
        table_environment_id: BridgeEnvironmentId,
        error: &'a BridgeHandleTableError,
        source_root_id: Option<u64>,
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeWorkerThreadCleanupHookPreflight {
        status: &'static str,
        model: &'static str,
        execution_scope: &'static str,
        source_executable_preflight_status: &'static str,
        worker_thread_id: u64,
        worker_environment_id: BridgeEnvironmentId,
        peer_environment_id: BridgeEnvironmentId,
        canonical_executable_evidence_required: bool,
        canonical_executable_evidence_accepted: bool,
        cleanup_hook_registration_count: usize,
        cleanup_hook_execution_order: &'static str,
        accepted_cleanup_evidence_count: usize,
        rejected_cleanup_evidence_count: usize,
        stale_or_forged_cleanup_evidence_rejection_count: usize,
        cleanup_hook_order_private: bool,
        cleanup_hook_identity_private: bool,
        rows: Vec<NativeRootBridgeWorkerThreadCleanupHookPreflightRow>,
        node_worker_threads_execution: bool,
        napi_cleanup_hook_execution: bool,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        public_native_compatibility: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeWorkerThreadCleanupHookPreflight {
        #[must_use]
        pub(crate) const fn status(&self) -> &'static str {
            self.status
        }

        #[must_use]
        pub(crate) const fn model(&self) -> &'static str {
            self.model
        }

        #[must_use]
        pub(crate) const fn execution_scope(&self) -> &'static str {
            self.execution_scope
        }

        #[must_use]
        pub(crate) const fn source_executable_preflight_status(&self) -> &'static str {
            self.source_executable_preflight_status
        }

        #[must_use]
        pub(crate) const fn worker_thread_id(&self) -> u64 {
            self.worker_thread_id
        }

        #[must_use]
        pub(crate) const fn worker_environment_id(&self) -> BridgeEnvironmentId {
            self.worker_environment_id
        }

        #[must_use]
        pub(crate) const fn peer_environment_id(&self) -> BridgeEnvironmentId {
            self.peer_environment_id
        }

        #[must_use]
        pub(crate) const fn canonical_executable_evidence_required(&self) -> bool {
            self.canonical_executable_evidence_required
        }

        #[must_use]
        pub(crate) const fn canonical_executable_evidence_accepted(&self) -> bool {
            self.canonical_executable_evidence_accepted
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_registration_count(&self) -> usize {
            self.cleanup_hook_registration_count
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_execution_order(&self) -> &'static str {
            self.cleanup_hook_execution_order
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
        pub(crate) const fn stale_or_forged_cleanup_evidence_rejection_count(&self) -> usize {
            self.stale_or_forged_cleanup_evidence_rejection_count
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
        pub(crate) fn rows(&self) -> &[NativeRootBridgeWorkerThreadCleanupHookPreflightRow] {
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

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus {
        Accepted,
        Rejected,
    }

    impl NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::Accepted => "accepted",
                Self::Rejected => "rejected",
            }
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeWorkerThreadCleanupHookEvidence {
        id: &'static str,
        operation: &'static str,
        cleanup_hook_id: &'static str,
        cleanup_hook_function_identity_token: &'static str,
        cleanup_hook_argument_identity_token: &'static str,
        registration_order: u8,
        expected_execution_order: u8,
        source_preflight_status: &'static str,
        source_worker_thread_id: u64,
        source_environment_id: BridgeEnvironmentId,
        source_row_id: &'static str,
        source_provenance_token: Option<&'static str>,
        source_handle_kind: BridgeHandleKind,
        source_handle_environment_id: Option<BridgeEnvironmentId>,
        source_handle_slot: Option<u64>,
        source_handle_generation: Option<u64>,
        source_current_generation: Option<u64>,
        source_record_id: Option<u64>,
        source_root_id: Option<u64>,
        source_error_code: Option<&'static str>,
        source_boundary_error_code: Option<&'static str>,
        public_native_package_claimed: bool,
        preflight_row_status: Option<NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus>,
        preflight_row_code: Option<&'static str>,
    }

    impl NativeRootBridgeWorkerThreadCleanupHookEvidence {
        #[allow(clippy::too_many_arguments)]
        #[must_use]
        pub(crate) const fn new(
            id: &'static str,
            operation: &'static str,
            cleanup_hook_id: &'static str,
            cleanup_hook_function_identity_token: &'static str,
            cleanup_hook_argument_identity_token: &'static str,
            registration_order: u8,
            expected_execution_order: u8,
            source_preflight_status: &'static str,
            source_worker_thread_id: u64,
            source_environment_id: BridgeEnvironmentId,
            source_row_id: &'static str,
            source_handle_kind: BridgeHandleKind,
            source_error_code: Option<&'static str>,
            source_boundary_error_code: Option<&'static str>,
        ) -> Self {
            Self {
                id,
                operation,
                cleanup_hook_id,
                cleanup_hook_function_identity_token,
                cleanup_hook_argument_identity_token,
                registration_order,
                expected_execution_order,
                source_preflight_status,
                source_worker_thread_id,
                source_environment_id,
                source_row_id,
                source_provenance_token: None,
                source_handle_kind,
                source_handle_environment_id: None,
                source_handle_slot: None,
                source_handle_generation: None,
                source_current_generation: None,
                source_record_id: None,
                source_root_id: None,
                source_error_code,
                source_boundary_error_code,
                public_native_package_claimed: false,
                preflight_row_status: None,
                preflight_row_code: None,
            }
        }

        #[allow(clippy::too_many_arguments)]
        #[must_use]
        pub(crate) fn from_executable_preflight_row(
            id: &'static str,
            operation: &'static str,
            cleanup_hook_id: &'static str,
            cleanup_hook_function_identity_token: &'static str,
            cleanup_hook_argument_identity_token: &'static str,
            registration_order: u8,
            expected_execution_order: u8,
            preflight: &NativeRootBridgeWorkerThreadTeardownExecutablePreflight,
            source_row: NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow,
        ) -> Self {
            Self::new(
                id,
                operation,
                cleanup_hook_id,
                cleanup_hook_function_identity_token,
                cleanup_hook_argument_identity_token,
                registration_order,
                expected_execution_order,
                preflight.status(),
                preflight.worker_thread_id(),
                preflight.worker_environment_id(),
                source_row.id(),
                source_row.handle_kind(),
                source_row.source_error_code(),
                source_row.boundary_error_code(),
            )
            .with_source_identity_from_executable_preflight_row(source_row)
        }

        #[must_use]
        pub(crate) const fn from_preflight_row(
            row: NativeRootBridgeWorkerThreadCleanupHookPreflightRow,
        ) -> Self {
            Self {
                id: row.id(),
                operation: row.operation(),
                cleanup_hook_id: row.cleanup_hook_id(),
                cleanup_hook_function_identity_token: row.cleanup_hook_function_identity_token(),
                cleanup_hook_argument_identity_token: row.cleanup_hook_argument_identity_token(),
                registration_order: row.registration_order(),
                expected_execution_order: row.expected_execution_order(),
                source_preflight_status: row.source_preflight_status(),
                source_worker_thread_id: row.source_worker_thread_id(),
                source_environment_id: row.source_environment_id(),
                source_row_id: row.source_row_id(),
                source_provenance_token: row.source_provenance_token(),
                source_handle_kind: row.source_handle_kind(),
                source_handle_environment_id: row.source_handle_environment_id(),
                source_handle_slot: row.source_handle_slot(),
                source_handle_generation: row.source_handle_generation(),
                source_current_generation: row.source_current_generation(),
                source_record_id: row.source_record_id(),
                source_root_id: row.source_root_id(),
                source_error_code: row.source_error_code(),
                source_boundary_error_code: row.source_boundary_error_code(),
                public_native_package_claimed: false,
                preflight_row_status: Some(row.status()),
                preflight_row_code: row.code(),
            }
        }

        #[must_use]
        pub(crate) const fn with_public_native_package_claim(mut self) -> Self {
            self.public_native_package_claimed = true;
            self
        }

        #[cfg(test)]
        #[must_use]
        pub(crate) const fn with_source_provenance_token_for_test(
            mut self,
            token: Option<&'static str>,
        ) -> Self {
            self.source_provenance_token = token;
            self
        }

        #[cfg(test)]
        #[must_use]
        pub(crate) const fn with_id_for_test(mut self, id: &'static str) -> Self {
            self.id = id;
            self
        }

        fn with_source_identity_from_executable_preflight_row(
            mut self,
            row: NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow,
        ) -> Self {
            self.source_handle_environment_id = Some(row.handle_environment_id());
            self.source_handle_slot = Some(row.slot());
            self.source_handle_generation = Some(row.handle_generation());
            self.source_current_generation = row.current_generation();
            self.source_record_id = row.record_id();
            self.source_root_id = row.source_root_id();
            self.source_provenance_token =
                cleanup_hook_source_provenance_token_for_executable_preflight_row(row);
            self
        }

        #[cfg(test)]
        pub(crate) const fn with_source_identity_from_preflight_row_for_test(
            mut self,
            row: NativeRootBridgeWorkerThreadCleanupHookPreflightRow,
        ) -> Self {
            self.source_handle_environment_id = row.source_handle_environment_id();
            self.source_handle_slot = row.source_handle_slot();
            self.source_handle_generation = row.source_handle_generation();
            self.source_current_generation = row.source_current_generation();
            self.source_record_id = row.source_record_id();
            self.source_root_id = row.source_root_id();
            self.source_provenance_token = row.source_provenance_token();
            self
        }

        #[cfg(test)]
        pub(crate) fn with_source_identity_from_executable_preflight_row_for_test(
            self,
            row: NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow,
        ) -> Self {
            self.with_source_identity_from_executable_preflight_row(row)
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
        pub(crate) const fn cleanup_hook_id(self) -> &'static str {
            self.cleanup_hook_id
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_function_identity_token(self) -> &'static str {
            self.cleanup_hook_function_identity_token
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_argument_identity_token(self) -> &'static str {
            self.cleanup_hook_argument_identity_token
        }

        #[must_use]
        pub(crate) const fn registration_order(self) -> u8 {
            self.registration_order
        }

        #[must_use]
        pub(crate) const fn expected_execution_order(self) -> u8 {
            self.expected_execution_order
        }

        #[must_use]
        pub(crate) const fn source_preflight_status(self) -> &'static str {
            self.source_preflight_status
        }

        #[must_use]
        pub(crate) const fn source_worker_thread_id(self) -> u64 {
            self.source_worker_thread_id
        }

        #[must_use]
        pub(crate) const fn source_environment_id(self) -> BridgeEnvironmentId {
            self.source_environment_id
        }

        #[must_use]
        pub(crate) const fn source_row_id(self) -> &'static str {
            self.source_row_id
        }

        #[must_use]
        pub(crate) const fn source_provenance_token(self) -> Option<&'static str> {
            self.source_provenance_token
        }

        #[must_use]
        pub(crate) const fn source_handle_kind(self) -> BridgeHandleKind {
            self.source_handle_kind
        }

        #[must_use]
        pub(crate) const fn source_handle_environment_id(self) -> Option<BridgeEnvironmentId> {
            self.source_handle_environment_id
        }

        #[must_use]
        pub(crate) const fn source_handle_slot(self) -> Option<u64> {
            self.source_handle_slot
        }

        #[must_use]
        pub(crate) const fn source_handle_generation(self) -> Option<u64> {
            self.source_handle_generation
        }

        #[must_use]
        pub(crate) const fn source_current_generation(self) -> Option<u64> {
            self.source_current_generation
        }

        #[must_use]
        pub(crate) const fn source_record_id(self) -> Option<u64> {
            self.source_record_id
        }

        #[must_use]
        pub(crate) const fn source_root_id(self) -> Option<u64> {
            self.source_root_id
        }

        #[must_use]
        pub(crate) const fn source_error_code(self) -> Option<&'static str> {
            self.source_error_code
        }

        #[must_use]
        pub(crate) const fn source_boundary_error_code(self) -> Option<&'static str> {
            self.source_boundary_error_code
        }

        #[must_use]
        pub(crate) const fn public_native_package_claimed(self) -> bool {
            self.public_native_package_claimed
        }

        #[must_use]
        pub(crate) const fn preflight_row_status(
            self,
        ) -> Option<NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus> {
            self.preflight_row_status
        }

        #[must_use]
        pub(crate) const fn preflight_row_code(self) -> Option<&'static str> {
            self.preflight_row_code
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    enum NativeRootBridgeWorkerThreadCleanupHookCanonicalRole {
        Root,
        Value,
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    struct NativeRootBridgeWorkerThreadCleanupHookExpectedIdentity {
        role: NativeRootBridgeWorkerThreadCleanupHookCanonicalRole,
        cleanup_hook_id: &'static str,
        cleanup_hook_function_identity_token: &'static str,
        cleanup_hook_argument_identity_token: &'static str,
        registration_order: u8,
        expected_execution_order: u8,
    }

    impl NativeRootBridgeWorkerThreadCleanupHookExpectedIdentity {
        const fn root() -> Self {
            Self {
                role: NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Root,
                cleanup_hook_id: NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_ID,
                cleanup_hook_function_identity_token:
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_FUNCTION_IDENTITY_TOKEN,
                cleanup_hook_argument_identity_token:
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_ARGUMENT_IDENTITY_TOKEN,
                registration_order: 2,
                expected_execution_order: 1,
            }
        }

        const fn value() -> Self {
            Self {
                role: NativeRootBridgeWorkerThreadCleanupHookCanonicalRole::Value,
                cleanup_hook_id: NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_ID,
                cleanup_hook_function_identity_token:
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_FUNCTION_IDENTITY_TOKEN,
                cleanup_hook_argument_identity_token:
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_ARGUMENT_IDENTITY_TOKEN,
                registration_order: 1,
                expected_execution_order: 2,
            }
        }

        fn matches_evidence(
            self,
            evidence: NativeRootBridgeWorkerThreadCleanupHookEvidence,
        ) -> bool {
            evidence.cleanup_hook_id() == self.cleanup_hook_id
                && evidence.cleanup_hook_function_identity_token()
                    == self.cleanup_hook_function_identity_token
                && evidence.cleanup_hook_argument_identity_token()
                    == self.cleanup_hook_argument_identity_token
        }

        const fn matches_order(
            self,
            evidence: NativeRootBridgeWorkerThreadCleanupHookEvidence,
        ) -> bool {
            evidence.registration_order() == self.registration_order
                && evidence.expected_execution_order() == self.expected_execution_order
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeWorkerThreadCleanupHookPreflightRow {
        id: &'static str,
        operation: &'static str,
        cleanup_hook_id: &'static str,
        cleanup_hook_function_identity_token: &'static str,
        cleanup_hook_argument_identity_token: &'static str,
        registration_order: u8,
        expected_execution_order: u8,
        observed_execution_order: Option<u8>,
        status: NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus,
        code: Option<&'static str>,
        source_preflight_status: &'static str,
        source_worker_thread_id: u64,
        source_environment_id: BridgeEnvironmentId,
        source_row_id: &'static str,
        source_provenance_token: Option<&'static str>,
        source_handle_kind: BridgeHandleKind,
        source_handle_environment_id: Option<BridgeEnvironmentId>,
        source_handle_slot: Option<u64>,
        source_handle_generation: Option<u64>,
        source_current_generation: Option<u64>,
        source_record_id: Option<u64>,
        source_root_id: Option<u64>,
        source_error_code: Option<&'static str>,
        source_boundary_error_code: Option<&'static str>,
        canonical_executable_evidence: bool,
        cleanup_hook_order_private: bool,
        cleanup_hook_identity_private: bool,
        stale_or_forged_cleanup_evidence_rejected: bool,
        node_worker_threads_execution: bool,
        napi_cleanup_hook_execution: bool,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        public_native_compatibility: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeWorkerThreadCleanupHookPreflightRow {
        fn accepted(evidence: NativeRootBridgeWorkerThreadCleanupHookEvidence) -> Self {
            Self::new(NativeRootBridgeWorkerThreadCleanupHookPreflightRowInit {
                evidence,
                status: NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Accepted,
                code: None,
                observed_execution_order: Some(evidence.expected_execution_order()),
                canonical_executable_evidence: true,
                cleanup_hook_order_private: true,
                cleanup_hook_identity_private: true,
                stale_or_forged_cleanup_evidence_rejected: false,
            })
        }

        fn rejected(
            evidence: NativeRootBridgeWorkerThreadCleanupHookEvidence,
            code: &'static str,
        ) -> Self {
            Self::new(NativeRootBridgeWorkerThreadCleanupHookPreflightRowInit {
                evidence,
                status: NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Rejected,
                code: Some(code),
                observed_execution_order: None,
                canonical_executable_evidence: false,
                cleanup_hook_order_private: true,
                cleanup_hook_identity_private: true,
                stale_or_forged_cleanup_evidence_rejected: matches!(
                    code,
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_STALE_EVIDENCE_CODE
                        | NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_FORGED_EVIDENCE_CODE
                ),
            })
        }

        const fn new(init: NativeRootBridgeWorkerThreadCleanupHookPreflightRowInit) -> Self {
            let evidence = init.evidence;

            Self {
                id: evidence.id(),
                operation: evidence.operation(),
                cleanup_hook_id: evidence.cleanup_hook_id(),
                cleanup_hook_function_identity_token: evidence
                    .cleanup_hook_function_identity_token(),
                cleanup_hook_argument_identity_token: evidence
                    .cleanup_hook_argument_identity_token(),
                registration_order: evidence.registration_order(),
                expected_execution_order: evidence.expected_execution_order(),
                observed_execution_order: init.observed_execution_order,
                status: init.status,
                code: init.code,
                source_preflight_status: evidence.source_preflight_status(),
                source_worker_thread_id: evidence.source_worker_thread_id(),
                source_environment_id: evidence.source_environment_id(),
                source_row_id: evidence.source_row_id(),
                source_provenance_token: evidence.source_provenance_token(),
                source_handle_kind: evidence.source_handle_kind(),
                source_handle_environment_id: evidence.source_handle_environment_id(),
                source_handle_slot: evidence.source_handle_slot(),
                source_handle_generation: evidence.source_handle_generation(),
                source_current_generation: evidence.source_current_generation(),
                source_record_id: evidence.source_record_id(),
                source_root_id: evidence.source_root_id(),
                source_error_code: evidence.source_error_code(),
                source_boundary_error_code: evidence.source_boundary_error_code(),
                canonical_executable_evidence: init.canonical_executable_evidence,
                cleanup_hook_order_private: init.cleanup_hook_order_private,
                cleanup_hook_identity_private: init.cleanup_hook_identity_private,
                stale_or_forged_cleanup_evidence_rejected: init
                    .stale_or_forged_cleanup_evidence_rejected,
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
        pub(crate) const fn id(self) -> &'static str {
            self.id
        }

        #[must_use]
        pub(crate) const fn operation(self) -> &'static str {
            self.operation
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_id(self) -> &'static str {
            self.cleanup_hook_id
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_function_identity_token(self) -> &'static str {
            self.cleanup_hook_function_identity_token
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_argument_identity_token(self) -> &'static str {
            self.cleanup_hook_argument_identity_token
        }

        #[must_use]
        pub(crate) const fn registration_order(self) -> u8 {
            self.registration_order
        }

        #[must_use]
        pub(crate) const fn expected_execution_order(self) -> u8 {
            self.expected_execution_order
        }

        #[must_use]
        pub(crate) const fn observed_execution_order(self) -> Option<u8> {
            self.observed_execution_order
        }

        #[must_use]
        pub(crate) const fn status(
            self,
        ) -> NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus {
            self.status
        }

        #[must_use]
        pub(crate) const fn code(self) -> Option<&'static str> {
            self.code
        }

        #[must_use]
        pub(crate) const fn source_preflight_status(self) -> &'static str {
            self.source_preflight_status
        }

        #[must_use]
        pub(crate) const fn source_worker_thread_id(self) -> u64 {
            self.source_worker_thread_id
        }

        #[must_use]
        pub(crate) const fn source_environment_id(self) -> BridgeEnvironmentId {
            self.source_environment_id
        }

        #[must_use]
        pub(crate) const fn source_row_id(self) -> &'static str {
            self.source_row_id
        }

        #[must_use]
        pub(crate) const fn source_provenance_token(self) -> Option<&'static str> {
            self.source_provenance_token
        }

        #[must_use]
        pub(crate) const fn source_handle_kind(self) -> BridgeHandleKind {
            self.source_handle_kind
        }

        #[must_use]
        pub(crate) const fn source_handle_environment_id(self) -> Option<BridgeEnvironmentId> {
            self.source_handle_environment_id
        }

        #[must_use]
        pub(crate) const fn source_handle_slot(self) -> Option<u64> {
            self.source_handle_slot
        }

        #[must_use]
        pub(crate) const fn source_handle_generation(self) -> Option<u64> {
            self.source_handle_generation
        }

        #[must_use]
        pub(crate) const fn source_current_generation(self) -> Option<u64> {
            self.source_current_generation
        }

        #[must_use]
        pub(crate) const fn source_record_id(self) -> Option<u64> {
            self.source_record_id
        }

        #[must_use]
        pub(crate) const fn source_root_id(self) -> Option<u64> {
            self.source_root_id
        }

        #[must_use]
        pub(crate) const fn source_error_code(self) -> Option<&'static str> {
            self.source_error_code
        }

        #[must_use]
        pub(crate) const fn source_boundary_error_code(self) -> Option<&'static str> {
            self.source_boundary_error_code
        }

        #[must_use]
        pub(crate) const fn canonical_executable_evidence(self) -> bool {
            self.canonical_executable_evidence
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_order_private(self) -> bool {
            self.cleanup_hook_order_private
        }

        #[must_use]
        pub(crate) const fn cleanup_hook_identity_private(self) -> bool {
            self.cleanup_hook_identity_private
        }

        #[must_use]
        pub(crate) const fn stale_or_forged_cleanup_evidence_rejected(self) -> bool {
            self.stale_or_forged_cleanup_evidence_rejected
        }

        #[must_use]
        pub(crate) const fn node_worker_threads_execution(self) -> bool {
            self.node_worker_threads_execution
        }

        #[must_use]
        pub(crate) const fn napi_cleanup_hook_execution(self) -> bool {
            self.napi_cleanup_hook_execution
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
        pub(crate) const fn public_native_compatibility(self) -> bool {
            self.public_native_compatibility
        }

        #[must_use]
        pub(crate) const fn react_behavior_error(self) -> bool {
            self.react_behavior_error
        }
    }

    struct NativeRootBridgeWorkerThreadCleanupHookPreflightRowInit {
        evidence: NativeRootBridgeWorkerThreadCleanupHookEvidence,
        status: NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus,
        code: Option<&'static str>,
        observed_execution_order: Option<u8>,
        canonical_executable_evidence: bool,
        cleanup_hook_order_private: bool,
        cleanup_hook_identity_private: bool,
        stale_or_forged_cleanup_evidence_rejected: bool,
    }

