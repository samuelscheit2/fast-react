//! Node-API boundary placeholder.
//!
//! This crate is the reserved native binding boundary. The initial scaffold
//! avoids pulling N-API dependencies until the binding strategy is implemented,
//! but no other Rust crate should grow Node-specific dependencies.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

mod handle_table;

#[allow(dead_code)]
mod root_bridge_requests {
    //! Private native root request records.
    //!
    //! The records in this module are inert diagnostics for the future native
    //! bridge. They only retain handle-table metadata and do not store raw
    //! JavaScript values, invoke the reconciler, or perform host work.

    use std::collections::HashSet;
    use std::error::Error;
    use std::fmt::{self, Display, Formatter};

    use serde_json::{Map, Value};

    use crate::handle_table::{
        BridgeEnvironmentId, BridgeEnvironmentTeardown, BridgeHandle, BridgeHandleAdmissionOutcome,
        BridgeHandleKind, BridgeHandleTable, BridgeHandleTableError,
        BridgeHandleTableTeardownIsolationDiagnostics, PlaceholderRootRecord,
        PlaceholderValueRecord, bridge_handle_table_cross_environment_teardown_diagnostics,
    };

    pub(crate) const NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS: &str =
        "preflighted-native-root-bridge-worker-thread-teardown-boundary";
    pub(crate) const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PREFLIGHT_STATUS: &str =
        "preflighted-native-root-bridge-worker-thread-cleanup-hook-order";
    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_PREFLIGHT_MODEL: &str =
        "fast-react-napi.WorkerThreadTeardownPreflight";
    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_PREFLIGHT_EXECUTION_SCOPE: &str =
        "rust-only-handle-table-preflight-no-node-worker-thread-no-napi-cleanup-hook";
    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PREFLIGHT_MODEL: &str =
        "fast-react-napi.WorkerThreadCleanupHookOrderPreflight";
    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PREFLIGHT_EXECUTION_SCOPE: &str = "rust-only-cleanup-hook-order-preflight-no-node-worker-thread-no-napi-cleanup-hook-execution";
    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_STALE_EVIDENCE_CODE: &str =
        "FAST_REACT_NAPI_CLEANUP_HOOK_STALE_EXECUTABLE_PREFLIGHT";
    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_FORGED_EVIDENCE_CODE: &str =
        "FAST_REACT_NAPI_CLEANUP_HOOK_FORGED_EVIDENCE";
    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ORDER_MISMATCH_CODE: &str =
        "FAST_REACT_NAPI_CLEANUP_HOOK_ORDER_MISMATCH";
    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_IDENTITY_MISMATCH_CODE: &str =
        "FAST_REACT_NAPI_CLEANUP_HOOK_IDENTITY_MISMATCH";
    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_SOURCE_ROW_ID: &str =
        "worker-render-root-stale-executable-preflight";
    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_SOURCE_ROW_ID: &str =
        "worker-render-value-stale-executable-preflight";
    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_ID: &str =
        "worker-root-handle-cleanup-hook";
    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_ID: &str =
        "worker-value-handle-cleanup-hook";
    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_FUNCTION_IDENTITY_TOKEN: &str =
        "private-cleanup-hook-fn:worker-root-handle-teardown";
    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_FUNCTION_IDENTITY_TOKEN: &str =
        "private-cleanup-hook-fn:worker-value-handle-teardown";
    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_ARGUMENT_IDENTITY_TOKEN: &str =
        "private-cleanup-hook-arg:worker-764-root-slot-1";
    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_ARGUMENT_IDENTITY_TOKEN: &str =
        "private-cleanup-hook-arg:worker-764-value-slot-3";
    const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_COUNT: u8 = 2;

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeRequestKind {
        Create,
        Render,
        Unmount,
    }

    impl NativeRootBridgeRequestKind {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::Create => "create",
                Self::Render => "render",
                Self::Unmount => "unmount",
            }
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeRootHandleState {
        Active,
        Retired,
    }

    impl NativeRootBridgeRootHandleState {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::Active => "active",
                Self::Retired => "retired",
            }
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeLifecycleTransition {
        NoneToActive,
        ActiveToActive,
        ActiveToRetired,
    }

    impl NativeRootBridgeLifecycleTransition {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::NoneToActive => "none->active",
                Self::ActiveToActive => "active->active",
                Self::ActiveToRetired => "active->retired",
            }
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeCreateRequest {
        root_id: u64,
        container_handle: Option<BridgeHandle>,
    }

    impl NativeRootBridgeCreateRequest {
        #[must_use]
        pub(crate) const fn new(root_id: u64) -> Self {
            Self {
                root_id,
                container_handle: None,
            }
        }

        #[must_use]
        pub(crate) const fn with_container_handle(mut self, handle: BridgeHandle) -> Self {
            self.container_handle = Some(handle);
            self
        }

        #[must_use]
        pub(crate) const fn root_id(self) -> u64 {
            self.root_id
        }

        #[must_use]
        pub(crate) const fn container_handle(self) -> Option<BridgeHandle> {
            self.container_handle
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeRenderRequest {
        root_handle: BridgeHandle,
        element_handle: Option<BridgeHandle>,
    }

    impl NativeRootBridgeRenderRequest {
        #[must_use]
        pub(crate) const fn new(root_handle: BridgeHandle) -> Self {
            Self {
                root_handle,
                element_handle: None,
            }
        }

        #[must_use]
        pub(crate) const fn with_element_handle(mut self, handle: BridgeHandle) -> Self {
            self.element_handle = Some(handle);
            self
        }

        #[must_use]
        pub(crate) const fn root_handle(self) -> BridgeHandle {
            self.root_handle
        }

        #[must_use]
        pub(crate) const fn element_handle(self) -> Option<BridgeHandle> {
            self.element_handle
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeUnmountRequest {
        root_handle: BridgeHandle,
    }

    impl NativeRootBridgeUnmountRequest {
        #[must_use]
        pub(crate) const fn new(root_handle: BridgeHandle) -> Self {
            Self { root_handle }
        }

        #[must_use]
        pub(crate) const fn root_handle(self) -> BridgeHandle {
            self.root_handle
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeRequestRecord {
        request_id: u64,
        kind: NativeRootBridgeRequestKind,
        environment_id: BridgeEnvironmentId,
        root_handle: BridgeHandle,
        root_id: u64,
        value_handle: Option<BridgeHandle>,
        root_handle_state: NativeRootBridgeRootHandleState,
    }

    impl NativeRootBridgeRequestRecord {
        const fn new(
            request_id: u64,
            kind: NativeRootBridgeRequestKind,
            environment_id: BridgeEnvironmentId,
            root_handle: BridgeHandle,
            root_id: u64,
            value_handle: Option<BridgeHandle>,
            root_handle_state: NativeRootBridgeRootHandleState,
        ) -> Self {
            Self {
                request_id,
                kind,
                environment_id,
                root_handle,
                root_id,
                value_handle,
                root_handle_state,
            }
        }

        #[must_use]
        pub(crate) const fn from_js_native_handoff_record(
            request_id: u64,
            kind: NativeRootBridgeRequestKind,
            environment_id: BridgeEnvironmentId,
            root_handle: BridgeHandle,
            root_id: u64,
            value_handle: Option<BridgeHandle>,
            root_handle_state: NativeRootBridgeRootHandleState,
        ) -> Self {
            Self::new(
                request_id,
                kind,
                environment_id,
                root_handle,
                root_id,
                value_handle,
                root_handle_state,
            )
        }

        #[must_use]
        pub(crate) const fn request_id(self) -> u64 {
            self.request_id
        }

        #[must_use]
        pub(crate) const fn kind(self) -> NativeRootBridgeRequestKind {
            self.kind
        }

        #[must_use]
        pub(crate) const fn environment_id(self) -> BridgeEnvironmentId {
            self.environment_id
        }

        #[must_use]
        pub(crate) const fn root_handle(self) -> BridgeHandle {
            self.root_handle
        }

        #[must_use]
        pub(crate) const fn root_id(self) -> u64 {
            self.root_id
        }

        #[must_use]
        pub(crate) const fn value_handle(self) -> Option<BridgeHandle> {
            self.value_handle
        }

        #[must_use]
        pub(crate) const fn root_handle_state(self) -> NativeRootBridgeRootHandleState {
            self.root_handle_state
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeJsonTransportHandle {
        environment_id: u64,
        slot: u64,
        generation: u64,
        kind: &'static str,
    }

    impl NativeRootBridgeJsonTransportHandle {
        #[must_use]
        pub(crate) const fn new(
            environment_id: u64,
            slot: u64,
            generation: u64,
            kind: &'static str,
        ) -> Self {
            Self {
                environment_id,
                slot,
                generation,
                kind,
            }
        }

        fn decode(self, field: &'static str) -> Result<BridgeHandle, NativeRootBridgeRequestError> {
            Ok(BridgeHandle::new(
                BridgeEnvironmentId::from_raw(self.environment_id),
                self.slot,
                self.generation,
                decode_json_transport_handle_kind(field, self.kind)?,
            ))
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeJsonTransportRecord {
        request_id: u64,
        kind: &'static str,
        environment_id: u64,
        root_handle: NativeRootBridgeJsonTransportHandle,
        root_id: u64,
        value_handle: Option<NativeRootBridgeJsonTransportHandle>,
        root_handle_state: &'static str,
    }

    impl NativeRootBridgeJsonTransportRecord {
        #[allow(clippy::too_many_arguments)]
        #[must_use]
        pub(crate) const fn new(
            request_id: u64,
            kind: &'static str,
            environment_id: u64,
            root_handle: NativeRootBridgeJsonTransportHandle,
            root_id: u64,
            value_handle: Option<NativeRootBridgeJsonTransportHandle>,
            root_handle_state: &'static str,
        ) -> Self {
            Self {
                request_id,
                kind,
                environment_id,
                root_handle,
                root_id,
                value_handle,
                root_handle_state,
            }
        }

        fn decode(self) -> Result<NativeRootBridgeRequestRecord, NativeRootBridgeRequestError> {
            Ok(
                NativeRootBridgeRequestRecord::from_js_native_handoff_record(
                    self.request_id,
                    decode_json_transport_request_kind("kind", self.kind)?,
                    BridgeEnvironmentId::from_raw(self.environment_id),
                    self.root_handle.decode("root_handle.kind")?,
                    self.root_id,
                    self.value_handle
                        .map(|handle| handle.decode("value_handle.kind"))
                        .transpose()?,
                    decode_json_transport_root_handle_state(
                        "root_handle_state",
                        self.root_handle_state,
                    )?,
                ),
            )
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeRequestValidationRecord {
        request_id: u64,
        kind: NativeRootBridgeRequestKind,
        environment_id: BridgeEnvironmentId,
        root_handle: BridgeHandle,
        root_id: u64,
        value_handle: Option<BridgeHandle>,
        root_handle_state: NativeRootBridgeRootHandleState,
        lifecycle_transition: NativeRootBridgeLifecycleTransition,
        root_handle_validated: bool,
        value_handle_validated: bool,
    }

    impl NativeRootBridgeRequestValidationRecord {
        const fn from_request(
            request: NativeRootBridgeRequestRecord,
            lifecycle_transition: NativeRootBridgeLifecycleTransition,
            value_handle_validated: bool,
        ) -> Self {
            Self {
                request_id: request.request_id(),
                kind: request.kind(),
                environment_id: request.environment_id(),
                root_handle: request.root_handle(),
                root_id: request.root_id(),
                value_handle: request.value_handle(),
                root_handle_state: request.root_handle_state(),
                lifecycle_transition,
                root_handle_validated: true,
                value_handle_validated,
            }
        }

        #[must_use]
        pub(crate) const fn request_id(self) -> u64 {
            self.request_id
        }

        #[must_use]
        pub(crate) const fn kind(self) -> NativeRootBridgeRequestKind {
            self.kind
        }

        #[must_use]
        pub(crate) const fn environment_id(self) -> BridgeEnvironmentId {
            self.environment_id
        }

        #[must_use]
        pub(crate) const fn root_handle(self) -> BridgeHandle {
            self.root_handle
        }

        #[must_use]
        pub(crate) const fn root_id(self) -> u64 {
            self.root_id
        }

        #[must_use]
        pub(crate) const fn value_handle(self) -> Option<BridgeHandle> {
            self.value_handle
        }

        #[must_use]
        pub(crate) const fn root_handle_state(self) -> NativeRootBridgeRootHandleState {
            self.root_handle_state
        }

        #[must_use]
        pub(crate) const fn lifecycle_transition(self) -> NativeRootBridgeLifecycleTransition {
            self.lifecycle_transition
        }

        #[must_use]
        pub(crate) const fn root_handle_validated(self) -> bool {
            self.root_handle_validated
        }

        #[must_use]
        pub(crate) const fn value_handle_validated(self) -> bool {
            self.value_handle_validated
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeHandleAdmissionAction {
        AdmitRoot,
        AdmitValue,
        ValidateActiveRoot,
        ValidateValue,
        RetireRoot,
        ValidateRetiredRoot,
    }

    impl NativeRootBridgeHandleAdmissionAction {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::AdmitRoot => "admit-root-handle",
                Self::AdmitValue => "admit-value-handle",
                Self::ValidateActiveRoot => "validate-active-root-handle",
                Self::ValidateValue => "validate-value-handle",
                Self::RetireRoot => "retire-root-handle",
                Self::ValidateRetiredRoot => "validate-retired-root-handle",
            }
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeHandleTableAdmissionSmokeRecord {
        request_id: u64,
        kind: NativeRootBridgeRequestKind,
        lifecycle_transition: NativeRootBridgeLifecycleTransition,
        root_handle_state_before: Option<NativeRootBridgeRootHandleState>,
        root_handle_state_after: NativeRootBridgeRootHandleState,
        root_handle_action: NativeRootBridgeHandleAdmissionAction,
        root_handle_current_generation: u64,
        value_handle_action: Option<NativeRootBridgeHandleAdmissionAction>,
        value_handle_current_generation: Option<u64>,
        retired_root_source_error_code: Option<&'static str>,
    }

    impl NativeRootBridgeHandleTableAdmissionSmokeRecord {
        #[allow(clippy::too_many_arguments)]
        const fn new(
            request: NativeRootBridgeRequestRecord,
            lifecycle_transition: NativeRootBridgeLifecycleTransition,
            root_handle_state_before: Option<NativeRootBridgeRootHandleState>,
            root_handle_state_after: NativeRootBridgeRootHandleState,
            root_handle_action: NativeRootBridgeHandleAdmissionAction,
            root_handle_current_generation: u64,
            value_handle_action: Option<NativeRootBridgeHandleAdmissionAction>,
            value_handle_current_generation: Option<u64>,
            retired_root_source_error_code: Option<&'static str>,
        ) -> Self {
            Self {
                request_id: request.request_id(),
                kind: request.kind(),
                lifecycle_transition,
                root_handle_state_before,
                root_handle_state_after,
                root_handle_action,
                root_handle_current_generation,
                value_handle_action,
                value_handle_current_generation,
                retired_root_source_error_code,
            }
        }

        #[must_use]
        pub(crate) const fn request_id(self) -> u64 {
            self.request_id
        }

        #[must_use]
        pub(crate) const fn kind(self) -> NativeRootBridgeRequestKind {
            self.kind
        }

        #[must_use]
        pub(crate) const fn lifecycle_transition(self) -> NativeRootBridgeLifecycleTransition {
            self.lifecycle_transition
        }

        #[must_use]
        pub(crate) const fn root_handle_state_before(
            self,
        ) -> Option<NativeRootBridgeRootHandleState> {
            self.root_handle_state_before
        }

        #[must_use]
        pub(crate) const fn root_handle_state_after(self) -> NativeRootBridgeRootHandleState {
            self.root_handle_state_after
        }

        #[must_use]
        pub(crate) const fn root_handle_action(self) -> NativeRootBridgeHandleAdmissionAction {
            self.root_handle_action
        }

        #[must_use]
        pub(crate) const fn root_handle_current_generation(self) -> u64 {
            self.root_handle_current_generation
        }

        #[must_use]
        pub(crate) const fn value_handle_action(
            self,
        ) -> Option<NativeRootBridgeHandleAdmissionAction> {
            self.value_handle_action
        }

        #[must_use]
        pub(crate) const fn value_handle_current_generation(self) -> Option<u64> {
            self.value_handle_current_generation
        }

        #[must_use]
        pub(crate) const fn retired_root_source_error_code(self) -> Option<&'static str> {
            self.retired_root_source_error_code
        }
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeHandleTableAdmissionSmoke {
        environment_id: BridgeEnvironmentId,
        root_handle: Option<BridgeHandle>,
        root_id: Option<u64>,
        root_retired: bool,
        admission_records: Vec<NativeRootBridgeHandleTableAdmissionSmokeRecord>,
        validation_records: Vec<NativeRootBridgeRequestValidationRecord>,
    }

    impl NativeRootBridgeHandleTableAdmissionSmoke {
        #[must_use]
        pub(crate) fn environment_id(&self) -> BridgeEnvironmentId {
            self.environment_id
        }

        #[must_use]
        pub(crate) fn root_handle(&self) -> Option<BridgeHandle> {
            self.root_handle
        }

        #[must_use]
        pub(crate) fn root_id(&self) -> Option<u64> {
            self.root_id
        }

        #[must_use]
        pub(crate) fn root_retired(&self) -> bool {
            self.root_retired
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
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeJsonTransportParserGate {
        transport: &'static str,
        schema_version: u32,
        request_records: Vec<NativeRootBridgeJsonTransportRecord>,
        admission_smoke: NativeRootBridgeHandleTableAdmissionSmoke,
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
    }

    struct NativeRootBridgeBatchResponseSequenceRowInit {
        id: String,
        request_order: usize,
        response_order: usize,
        request_id: u64,
        kind: &'static str,
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
        chunk_order: usize,
        batch_sequence: usize,
        chunk_kind: NativeRootBridgeJsonTransportStreamChunkKind,
        response_status: NativeRootBridgeBatchedJsonTransportLifecycleStatus,
        teardown_state: NativeRootBridgeBatchResponseTeardownState,
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
        source_handle_kind: BridgeHandleKind,
        source_error_code: Option<&'static str>,
        source_boundary_error_code: Option<&'static str>,
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
                source_handle_kind,
                source_error_code,
                source_boundary_error_code,
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
        pub(crate) const fn source_handle_kind(self) -> BridgeHandleKind {
            self.source_handle_kind
        }

        #[must_use]
        pub(crate) const fn source_error_code(self) -> Option<&'static str> {
            self.source_error_code
        }

        #[must_use]
        pub(crate) const fn source_boundary_error_code(self) -> Option<&'static str> {
            self.source_boundary_error_code
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    struct NativeRootBridgeWorkerThreadCleanupHookExpectedIdentity {
        cleanup_hook_id: &'static str,
        cleanup_hook_function_identity_token: &'static str,
        cleanup_hook_argument_identity_token: &'static str,
    }

    impl NativeRootBridgeWorkerThreadCleanupHookExpectedIdentity {
        const fn root() -> Self {
            Self {
                cleanup_hook_id: NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_ID,
                cleanup_hook_function_identity_token:
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_FUNCTION_IDENTITY_TOKEN,
                cleanup_hook_argument_identity_token:
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_ARGUMENT_IDENTITY_TOKEN,
            }
        }

        const fn value() -> Self {
            Self {
                cleanup_hook_id: NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_ID,
                cleanup_hook_function_identity_token:
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_FUNCTION_IDENTITY_TOKEN,
                cleanup_hook_argument_identity_token:
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_ARGUMENT_IDENTITY_TOKEN,
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
        source_handle_kind: BridgeHandleKind,
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
                source_handle_kind: evidence.source_handle_kind(),
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
        pub(crate) const fn source_handle_kind(self) -> BridgeHandleKind {
            self.source_handle_kind
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

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeJsonTransportValueKind {
        Null,
        Boolean,
        Number,
        String,
        Array,
        Object,
    }

    impl NativeRootBridgeJsonTransportValueKind {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::Null => "null",
                Self::Boolean => "boolean",
                Self::Number => "number",
                Self::String => "string",
                Self::Array => "array",
                Self::Object => "object",
            }
        }
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeRequestError {
        HandleTable(BridgeHandleTableError),
        RecordEnvironmentMismatch {
            record_environment_id: BridgeEnvironmentId,
            table_environment_id: BridgeEnvironmentId,
        },
        RecordRootHandleMismatch {
            expected: BridgeHandle,
            actual: BridgeHandle,
        },
        RecordRootHandleStateMismatch {
            expected: NativeRootBridgeRootHandleState,
            actual: NativeRootBridgeRootHandleState,
        },
        RecordRootIdMismatch {
            expected: u64,
            actual: u64,
        },
        RootHandleStillActive {
            handle: BridgeHandle,
        },
        UnexpectedValueHandle {
            kind: NativeRootBridgeRequestKind,
            value_handle: BridgeHandle,
        },
        SequenceMustStartWithCreate {
            actual: NativeRootBridgeRequestKind,
        },
        CreateAfterRootCreated {
            request_id: u64,
        },
        RequestAfterUnmount {
            request_id: u64,
        },
        RequestSequenceOutOfOrder {
            previous_request_id: u64,
            request_id: u64,
        },
        RequestSequenceExhausted,
        JsonTransportRecordInvalid {
            field: &'static str,
            value: &'static str,
        },
    }

    impl NativeRootBridgeRequestError {
        #[must_use]
        pub(crate) const fn code(&self) -> &'static str {
            match self {
                Self::HandleTable(error) => error.code(),
                Self::RecordEnvironmentMismatch { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_RECORD_ENVIRONMENT_MISMATCH"
                }
                Self::RecordRootHandleMismatch { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_MISMATCH"
                }
                Self::RecordRootHandleStateMismatch { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_STATE_MISMATCH"
                }
                Self::RecordRootIdMismatch { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_RECORD_ROOT_ID_MISMATCH"
                }
                Self::RootHandleStillActive { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_RETIRED_HANDLE_STILL_ACTIVE"
                }
                Self::UnexpectedValueHandle { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_UNEXPECTED_VALUE_HANDLE"
                }
                Self::SequenceMustStartWithCreate { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE"
                }
                Self::CreateAfterRootCreated { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_CREATE_AFTER_ROOT_CREATED"
                }
                Self::RequestAfterUnmount { .. } => "FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT",
                Self::RequestSequenceOutOfOrder { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_OUT_OF_ORDER"
                }
                Self::RequestSequenceExhausted => "FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_EXHAUSTED",
                Self::JsonTransportRecordInvalid { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_RECORD_INVALID"
                }
            }
        }
    }

    impl From<BridgeHandleTableError> for NativeRootBridgeRequestError {
        fn from(error: BridgeHandleTableError) -> Self {
            Self::HandleTable(error)
        }
    }

    impl Display for NativeRootBridgeRequestError {
        fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
            match self {
                Self::HandleTable(error) => Display::fmt(error, formatter),
                Self::RecordEnvironmentMismatch {
                    record_environment_id,
                    table_environment_id,
                } => write!(
                    formatter,
                    "native root bridge request record belongs to environment {}, expected environment {}",
                    record_environment_id.raw(),
                    table_environment_id.raw()
                ),
                Self::RecordRootHandleMismatch { expected, actual } => write!(
                    formatter,
                    "native root bridge request record uses root handle slot {}, expected slot {}",
                    actual.slot(),
                    expected.slot()
                ),
                Self::RecordRootHandleStateMismatch { expected, actual } => write!(
                    formatter,
                    "native root bridge request record has root handle state {:?}, expected {:?}",
                    actual, expected
                ),
                Self::RecordRootIdMismatch { expected, actual } => write!(
                    formatter,
                    "native root bridge request record has root id {actual}, expected {expected}"
                ),
                Self::RootHandleStillActive { handle } => write!(
                    formatter,
                    "native root bridge unmount record did not retire root handle slot {}",
                    handle.slot()
                ),
                Self::UnexpectedValueHandle { kind, .. } => write!(
                    formatter,
                    "native root bridge {} record cannot carry a value handle",
                    kind.code()
                ),
                Self::SequenceMustStartWithCreate { actual } => write!(
                    formatter,
                    "native root bridge request sequence must start with create, got {}",
                    actual.code()
                ),
                Self::CreateAfterRootCreated { request_id } => write!(
                    formatter,
                    "native root bridge request {request_id} attempted to create another root in an active sequence"
                ),
                Self::RequestAfterUnmount { request_id } => write!(
                    formatter,
                    "native root bridge request {request_id} was recorded after root unmount"
                ),
                Self::RequestSequenceOutOfOrder {
                    previous_request_id,
                    request_id,
                } => write!(
                    formatter,
                    "native root bridge request id {request_id} must be greater than previous request id {previous_request_id}"
                ),
                Self::RequestSequenceExhausted => formatter
                    .write_str("native root bridge request sequence cannot allocate another id"),
                Self::JsonTransportRecordInvalid { field, value } => write!(
                    formatter,
                    "native root bridge JSON transport record has unsupported {field} value {value}"
                ),
            }
        }
    }

    impl Error for NativeRootBridgeRequestError {}

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeJsonTransportParseError {
        InvalidJson {
            line: usize,
            column: usize,
        },
        ExpectedObject {
            path: String,
            actual: NativeRootBridgeJsonTransportValueKind,
        },
        MissingField {
            path: String,
            field: &'static str,
        },
        UnexpectedField {
            path: String,
            field: String,
        },
        InvalidFieldType {
            path: String,
            expected: &'static str,
            actual: NativeRootBridgeJsonTransportValueKind,
        },
        UnsupportedFieldValue {
            path: String,
            expected: &'static str,
            actual: String,
        },
        Validation(NativeRootBridgeRequestError),
    }

    impl NativeRootBridgeJsonTransportParseError {
        #[must_use]
        pub(crate) const fn code(&self) -> &'static str {
            match self {
                Self::InvalidJson { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_JSON"
                }
                Self::ExpectedObject { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_EXPECTED_OBJECT"
                }
                Self::MissingField { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_MISSING_FIELD"
                }
                Self::UnexpectedField { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNEXPECTED_FIELD"
                }
                Self::InvalidFieldType { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_FIELD_TYPE"
                }
                Self::UnsupportedFieldValue { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNSUPPORTED_FIELD_VALUE"
                }
                Self::Validation(error) => error.code(),
            }
        }

        #[must_use]
        pub(crate) const fn source_error_code(&self) -> Option<&'static str> {
            match self {
                Self::Validation(error) => Some(error.code()),
                _ => None,
            }
        }
    }

    impl Display for NativeRootBridgeJsonTransportParseError {
        fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
            match self {
                Self::InvalidJson { line, column } => write!(
                    formatter,
                    "native root bridge JSON transport payload is invalid JSON at line {line}, column {column}"
                ),
                Self::ExpectedObject { path, actual } => write!(
                    formatter,
                    "native root bridge JSON transport expected object at {path}, got {}",
                    actual.code()
                ),
                Self::MissingField { path, field } => write!(
                    formatter,
                    "native root bridge JSON transport object at {path} is missing required field {field}"
                ),
                Self::UnexpectedField { path, field } => write!(
                    formatter,
                    "native root bridge JSON transport object at {path} has unexpected field {field}"
                ),
                Self::InvalidFieldType {
                    path,
                    expected,
                    actual,
                } => write!(
                    formatter,
                    "native root bridge JSON transport field {path} expected {expected}, got {}",
                    actual.code()
                ),
                Self::UnsupportedFieldValue {
                    path,
                    expected,
                    actual,
                } => write!(
                    formatter,
                    "native root bridge JSON transport field {path} has unsupported value {actual}, expected {expected}"
                ),
                Self::Validation(error) => write!(
                    formatter,
                    "native root bridge JSON transport failed validation: {error}"
                ),
            }
        }
    }

    impl Error for NativeRootBridgeJsonTransportParseError {
        fn source(&self) -> Option<&(dyn Error + 'static)> {
            match self {
                Self::Validation(error) => Some(error),
                _ => None,
            }
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    struct NativeRootBridgeJsonTransportDiagnosticCase {
        id: &'static str,
        category: &'static str,
        phase: &'static str,
        json: &'static str,
        boundary_error_code: Option<&'static str>,
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeJsonTransportErrorDiagnosticRow {
        id: &'static str,
        category: &'static str,
        phase: &'static str,
        code: &'static str,
        source_error_code: Option<&'static str>,
        boundary_error_code: Option<&'static str>,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeJsonTransportErrorDiagnosticRow {
        const fn from_parse_error(
            case: NativeRootBridgeJsonTransportDiagnosticCase,
            error: &NativeRootBridgeJsonTransportParseError,
        ) -> Self {
            Self {
                id: case.id,
                category: case.category,
                phase: case.phase,
                code: error.code(),
                source_error_code: error.source_error_code(),
                boundary_error_code: case.boundary_error_code,
                native_addon_loaded: false,
                native_execution: false,
                renderer_execution: false,
                reconciler_execution: false,
                react_behavior_error: false,
            }
        }

        #[must_use]
        pub(crate) const fn id(&self) -> &'static str {
            self.id
        }

        #[must_use]
        pub(crate) const fn category(&self) -> &'static str {
            self.category
        }

        #[must_use]
        pub(crate) const fn phase(&self) -> &'static str {
            self.phase
        }

        #[must_use]
        pub(crate) const fn code(&self) -> &'static str {
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
    }

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

        for request in requests.iter().copied() {
            prevalidate_handoff_lifecycle(&validator, request)?;
            let admission_record =
                admit_js_native_root_bridge_handoff_record(&mut table, request, root_handle_state)?;
            let validation_record = validator.validate_next(&table, request)?;

            root_handle_state = Some(validation_record.root_handle_state());
            admission_records.push(admission_record);
            validation_records.push(validation_record);
        }

        Ok(NativeRootBridgeHandleTableAdmissionSmoke {
            environment_id,
            root_handle: validator.root_handle(),
            root_id: validator.root_id(),
            root_retired: validator.root_retired(),
            admission_records,
            validation_records,
        })
    }

    pub(crate) fn smoke_admit_js_native_root_bridge_json_transport_records(
        records: &[NativeRootBridgeJsonTransportRecord],
    ) -> Result<NativeRootBridgeHandleTableAdmissionSmoke, NativeRootBridgeRequestError> {
        let requests = records
            .iter()
            .copied()
            .map(NativeRootBridgeJsonTransportRecord::decode)
            .collect::<Result<Vec<_>, _>>()?;

        smoke_admit_js_native_root_bridge_handoff_records(&requests)
    }

    pub(crate) fn parse_native_root_bridge_json_transport_for_gate(
        json: &str,
    ) -> Result<NativeRootBridgeJsonTransportParserGate, NativeRootBridgeJsonTransportParseError>
    {
        let (envelope, admission_smoke) = parse_json_transport_payload_for_gate(json)?;

        Ok(NativeRootBridgeJsonTransportParserGate {
            transport: envelope.transport,
            schema_version: envelope.schema_version,
            batched_record_gate: native_root_bridge_batched_json_transport_gate(
                &envelope.request_records,
            ),
            request_records: envelope.request_records,
            admission_smoke,
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
        let rows = worker_thread_cleanup_hook_preflight_rows(&executable_preflight);
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
        let canonical_executable_evidence_accepted = accepted_cleanup_evidence_count
            == usize::from(NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_COUNT)
            && rows
                .iter()
                .filter(|row| {
                    row.status()
                        == NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Accepted
                })
                .all(|row| row.canonical_executable_evidence());

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

    fn worker_thread_cleanup_hook_preflight_rows(
        executable_preflight: &NativeRootBridgeWorkerThreadTeardownExecutablePreflight,
    ) -> Vec<NativeRootBridgeWorkerThreadCleanupHookPreflightRow> {
        let root_stale_row = executable_preflight_row(
            executable_preflight,
            NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_SOURCE_ROW_ID,
        );
        let value_stale_row = executable_preflight_row(
            executable_preflight,
            NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_SOURCE_ROW_ID,
        );

        vec![
            validate_native_root_bridge_worker_thread_cleanup_hook_evidence_for_preflight(
                executable_preflight,
                NativeRootBridgeWorkerThreadCleanupHookEvidence::from_executable_preflight_row(
                    "cleanup-hook-worker-root-before-value-release",
                    "cleanup-hook-order-preflight",
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_ID,
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_FUNCTION_IDENTITY_TOKEN,
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_ARGUMENT_IDENTITY_TOKEN,
                    2,
                    1,
                    executable_preflight,
                    root_stale_row,
                ),
            ),
            validate_native_root_bridge_worker_thread_cleanup_hook_evidence_for_preflight(
                executable_preflight,
                NativeRootBridgeWorkerThreadCleanupHookEvidence::from_executable_preflight_row(
                    "cleanup-hook-worker-value-after-root-release",
                    "cleanup-hook-order-preflight",
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_ID,
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_FUNCTION_IDENTITY_TOKEN,
                    NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_ARGUMENT_IDENTITY_TOKEN,
                    1,
                    2,
                    executable_preflight,
                    value_stale_row,
                ),
            ),
            validate_native_root_bridge_worker_thread_cleanup_hook_evidence_for_preflight(
                executable_preflight,
                NativeRootBridgeWorkerThreadCleanupHookEvidence::new(
                    "cleanup-hook-stale-worker-transport-evidence-rejected",
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
            ),
            validate_native_root_bridge_worker_thread_cleanup_hook_evidence_for_preflight(
                executable_preflight,
                NativeRootBridgeWorkerThreadCleanupHookEvidence::new(
                    "cleanup-hook-forged-peer-active-evidence-rejected",
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
        if source_row.id() == NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_SOURCE_ROW_ID
            && source_row.handle_kind() == BridgeHandleKind::Root
        {
            Some(NativeRootBridgeWorkerThreadCleanupHookExpectedIdentity::root())
        } else if source_row.id()
            == NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_SOURCE_ROW_ID
            && source_row.handle_kind() == BridgeHandleKind::Value
        {
            Some(NativeRootBridgeWorkerThreadCleanupHookExpectedIdentity::value())
        } else {
            None
        }
    }

    pub(crate) fn validate_native_root_bridge_worker_thread_cleanup_hook_evidence_for_preflight(
        executable_preflight: &NativeRootBridgeWorkerThreadTeardownExecutablePreflight,
        evidence: NativeRootBridgeWorkerThreadCleanupHookEvidence,
    ) -> NativeRootBridgeWorkerThreadCleanupHookPreflightRow {
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

        NativeRootBridgeWorkerThreadCleanupHookPreflightRow::accepted(evidence)
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

    fn parse_json_transport_payload_for_gate(
        json: &str,
    ) -> Result<
        (
            ParsedJsonTransportEnvelope,
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
        let admission_smoke =
            smoke_admit_js_native_root_bridge_json_transport_records(&envelope.request_records)
                .map_err(NativeRootBridgeJsonTransportParseError::Validation)?;

        Ok((envelope, admission_smoke))
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
            ) => super::NativeBoundaryErrorKind::RootBridgeStaleHandle.code(),
            NativeRootBridgeRequestError::RecordRootHandleStateMismatch { .. }
            | NativeRootBridgeRequestError::RootHandleStillActive { .. }
            | NativeRootBridgeRequestError::SequenceMustStartWithCreate { .. }
            | NativeRootBridgeRequestError::CreateAfterRootCreated { .. }
            | NativeRootBridgeRequestError::RequestAfterUnmount { .. }
            | NativeRootBridgeRequestError::RequestSequenceOutOfOrder { .. }
            | NativeRootBridgeRequestError::RequestSequenceExhausted => {
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

    #[cfg(test)]
    mod tests {
        use super::*;
        use crate::handle_table::{
            BridgeHandleKind, BridgeHandleTableError, PlaceholderRootRecord,
        };

        fn admitted_create_sequence() -> (
            BridgeHandleTable,
            NativeRootBridgeRequestSequenceValidator,
            BridgeEnvironmentId,
            BridgeHandle,
            BridgeHandle,
        ) {
            let environment_id = BridgeEnvironmentId::from_raw(468);
            let root_handle = BridgeHandle::new(environment_id, 1, 1, BridgeHandleKind::Root);
            let value_handle = BridgeHandle::new(environment_id, 2, 1, BridgeHandleKind::Value);
            let create = NativeRootBridgeRequestRecord::from_js_native_handoff_record(
                1,
                NativeRootBridgeRequestKind::Create,
                environment_id,
                root_handle,
                1,
                Some(value_handle),
                NativeRootBridgeRootHandleState::Active,
            );
            let mut table = BridgeHandleTable::new(environment_id);
            let mut validator = NativeRootBridgeRequestSequenceValidator::new();

            admit_js_native_root_bridge_handoff_record(&mut table, create, None).unwrap();
            validator.validate_next(&table, create).unwrap();

            (table, validator, environment_id, root_handle, value_handle)
        }

        #[test]
        fn sequence_teardown_rejects_late_create_without_reviving_next_generation_handles() {
            let (mut table, mut validator, environment_id, root_handle, value_handle) =
                admitted_create_sequence();
            let teardown = table.teardown_environment(environment_id);
            let late_root_handle = BridgeHandle::new(
                environment_id,
                root_handle.slot(),
                root_handle.generation() + 1,
                BridgeHandleKind::Root,
            );
            let late_value_handle = BridgeHandle::new(
                environment_id,
                value_handle.slot(),
                value_handle.generation() + 1,
                BridgeHandleKind::Value,
            );
            let late_create = NativeRootBridgeRequestRecord::from_js_native_handoff_record(
                2,
                NativeRootBridgeRequestKind::Create,
                environment_id,
                late_root_handle,
                1,
                Some(late_value_handle),
                NativeRootBridgeRootHandleState::Active,
            );

            assert!(teardown.environment_matched());
            assert_eq!(teardown.root_handles_invalidated(), 1);
            assert_eq!(teardown.value_handles_invalidated(), 1);

            let admission_error = admit_js_native_root_bridge_handoff_record(
                &mut table,
                late_create,
                Some(NativeRootBridgeRootHandleState::Active),
            )
            .unwrap_err();
            let validation_error = validator.validate_next(&table, late_create).unwrap_err();

            assert_eq!(
                admission_error,
                NativeRootBridgeRequestError::CreateAfterRootCreated { request_id: 2 }
            );
            assert_eq!(validation_error, admission_error);
            assert_eq!(
                table.get_root(root_handle).unwrap_err(),
                BridgeHandleTableError::StaleHandle {
                    handle: root_handle,
                    current_generation: 2,
                }
            );
            assert_eq!(
                table.get_value(value_handle).unwrap_err(),
                BridgeHandleTableError::StaleHandle {
                    handle: value_handle,
                    current_generation: 2,
                }
            );
            assert_eq!(
                table.get_root(late_root_handle).unwrap_err(),
                BridgeHandleTableError::StaleHandle {
                    handle: late_root_handle,
                    current_generation: 2,
                }
            );
            assert_eq!(
                table.get_value(late_value_handle).unwrap_err(),
                BridgeHandleTableError::StaleHandle {
                    handle: late_value_handle,
                    current_generation: 2,
                }
            );
        }

        #[test]
        fn sequence_teardown_keeps_root_value_and_transport_handles_stale() {
            let (mut table, _validator, environment_id, root_handle, value_handle) =
                admitted_create_sequence();
            table.teardown_environment(environment_id);

            let stale_root_render = NativeRootBridgeRequestRecord::from_js_native_handoff_record(
                2,
                NativeRootBridgeRequestKind::Render,
                environment_id,
                root_handle,
                1,
                Some(value_handle),
                NativeRootBridgeRootHandleState::Active,
            );
            let stale_root_error = admit_js_native_root_bridge_handoff_record(
                &mut table,
                stale_root_render,
                Some(NativeRootBridgeRootHandleState::Active),
            )
            .unwrap_err();

            assert_eq!(
                stale_root_error,
                NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::StaleHandle {
                    handle: root_handle,
                    current_generation: 2,
                })
            );

            let stale_root_transport_record = NativeRootBridgeJsonTransportRecord::new(
                3,
                "render",
                environment_id.raw(),
                NativeRootBridgeJsonTransportHandle::new(
                    environment_id.raw(),
                    root_handle.slot(),
                    root_handle.generation(),
                    "root",
                ),
                1,
                None,
                "active",
            );
            let stale_root_transport_request = stale_root_transport_record.decode().unwrap();
            let stale_root_transport_error = admit_js_native_root_bridge_handoff_record(
                &mut table,
                stale_root_transport_request,
                Some(NativeRootBridgeRootHandleState::Active),
            )
            .unwrap_err();

            assert_eq!(
                stale_root_transport_error,
                NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::StaleHandle {
                    handle: root_handle,
                    current_generation: 2,
                })
            );

            let replacement_root = table.insert_root(PlaceholderRootRecord::new(1));
            let stale_value_render = NativeRootBridgeRequestRecord::from_js_native_handoff_record(
                4,
                NativeRootBridgeRequestKind::Render,
                environment_id,
                replacement_root,
                1,
                Some(value_handle),
                NativeRootBridgeRootHandleState::Active,
            );
            let stale_value_error = admit_js_native_root_bridge_handoff_record(
                &mut table,
                stale_value_render,
                Some(NativeRootBridgeRootHandleState::Active),
            )
            .unwrap_err();

            assert_eq!(
                stale_value_error,
                NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::StaleHandle {
                    handle: value_handle,
                    current_generation: 2,
                })
            );

            let transport_record = NativeRootBridgeJsonTransportRecord::new(
                5,
                "render",
                environment_id.raw(),
                NativeRootBridgeJsonTransportHandle::new(
                    environment_id.raw(),
                    replacement_root.slot(),
                    replacement_root.generation(),
                    "root",
                ),
                1,
                Some(NativeRootBridgeJsonTransportHandle::new(
                    environment_id.raw(),
                    value_handle.slot(),
                    value_handle.generation(),
                    "value",
                )),
                "active",
            );
            let transport_request = transport_record.decode().unwrap();
            let transport_error = admit_js_native_root_bridge_handoff_record(
                &mut table,
                transport_request,
                Some(NativeRootBridgeRootHandleState::Active),
            )
            .unwrap_err();

            assert_eq!(
                transport_error,
                NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::StaleHandle {
                    handle: value_handle,
                    current_generation: 2,
                })
            );
            assert_eq!(
                table.get_value(value_handle).unwrap_err(),
                BridgeHandleTableError::StaleHandle {
                    handle: value_handle,
                    current_generation: 2,
                }
            );
        }
    }
}

#[allow(dead_code)]
mod test_renderer_root_execution_bridge {
    //! Private test-renderer root execution bridge.
    //!
    //! This is a Rust-owned bridge shape for the future native boundary. It
    //! deliberately has no Node-API dependency and is not exported as a `.node`
    //! binding, but it does call the accepted `TestRendererRoot` create/update/
    //! unmount execution boundary so JS private request records have a concrete
    //! Rust target to hand off to later.

    use std::error::Error;
    use std::fmt::{self, Display, Formatter};

    use fast_react_reconciler::{FiberRootId, RootElementHandle};
    use fast_react_test_renderer::{
        TestRendererOptions, TestRendererRoot, TestRendererRootError, TestRendererRootLifecycle,
        TestRendererRootScheduledUpdate, TestRendererRootUpdateKind,
    };

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct TestRendererNativeRootScheduledExecution {
        kind: TestRendererRootUpdateKind,
        element: RootElementHandle,
        container_update_api: &'static str,
        root_schedule_api: &'static str,
        sync: bool,
    }

    impl TestRendererNativeRootScheduledExecution {
        #[must_use]
        pub(crate) fn from_scheduled_update(update: &TestRendererRootScheduledUpdate) -> Self {
            let kind = update.kind();
            Self {
                kind,
                element: update.element(),
                container_update_api: kind.container_update_api(),
                root_schedule_api: "ensure_root_is_scheduled",
                sync: kind.sync(),
            }
        }

        #[must_use]
        pub(crate) const fn kind(self) -> TestRendererRootUpdateKind {
            self.kind
        }

        #[must_use]
        pub(crate) const fn element(self) -> RootElementHandle {
            self.element
        }

        #[must_use]
        pub(crate) const fn container_update_api(self) -> &'static str {
            self.container_update_api
        }

        #[must_use]
        pub(crate) const fn root_schedule_api(self) -> &'static str {
            self.root_schedule_api
        }

        #[must_use]
        pub(crate) const fn sync(self) -> bool {
            self.sync
        }
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct TestRendererNativeRootExecutionRecord {
        request_id: u64,
        operation: TestRendererRootUpdateKind,
        root_id: FiberRootId,
        lifecycle_before: Option<TestRendererRootLifecycle>,
        lifecycle_after: TestRendererRootLifecycle,
        update_outcome: &'static str,
        scheduled_update: Option<TestRendererNativeRootScheduledExecution>,
        private_root_request_execution: bool,
        rust_root_execution_boundary_called: bool,
        native_addon_loaded: bool,
        native_execution: bool,
        reconciler_execution: bool,
        host_output_produced: bool,
        public_create_update_unmount_available: bool,
        compatibility_claimed: bool,
    }

    impl TestRendererNativeRootExecutionRecord {
        fn new(
            request_id: u64,
            operation: TestRendererRootUpdateKind,
            root_id: FiberRootId,
            lifecycle_before: Option<TestRendererRootLifecycle>,
            lifecycle_after: TestRendererRootLifecycle,
            update_outcome: &'static str,
            scheduled_update: Option<TestRendererNativeRootScheduledExecution>,
        ) -> Self {
            Self {
                request_id,
                operation,
                root_id,
                lifecycle_before,
                lifecycle_after,
                update_outcome,
                scheduled_update,
                private_root_request_execution: true,
                rust_root_execution_boundary_called: true,
                native_addon_loaded: false,
                native_execution: false,
                reconciler_execution: scheduled_update.is_some(),
                host_output_produced: false,
                public_create_update_unmount_available: false,
                compatibility_claimed: false,
            }
        }

        #[must_use]
        pub(crate) const fn request_id(&self) -> u64 {
            self.request_id
        }

        #[must_use]
        pub(crate) const fn operation(&self) -> TestRendererRootUpdateKind {
            self.operation
        }

        #[must_use]
        pub(crate) const fn root_id(&self) -> FiberRootId {
            self.root_id
        }

        #[must_use]
        pub(crate) const fn lifecycle_before(&self) -> Option<TestRendererRootLifecycle> {
            self.lifecycle_before
        }

        #[must_use]
        pub(crate) const fn lifecycle_after(&self) -> TestRendererRootLifecycle {
            self.lifecycle_after
        }

        #[must_use]
        pub(crate) const fn update_outcome(&self) -> &'static str {
            self.update_outcome
        }

        #[must_use]
        pub(crate) const fn scheduled_update(
            &self,
        ) -> Option<TestRendererNativeRootScheduledExecution> {
            self.scheduled_update
        }

        #[must_use]
        pub(crate) const fn private_root_request_execution(&self) -> bool {
            self.private_root_request_execution
        }

        #[must_use]
        pub(crate) const fn rust_root_execution_boundary_called(&self) -> bool {
            self.rust_root_execution_boundary_called
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
        pub(crate) const fn reconciler_execution(&self) -> bool {
            self.reconciler_execution
        }

        #[must_use]
        pub(crate) const fn host_output_produced(&self) -> bool {
            self.host_output_produced
        }

        #[must_use]
        pub(crate) const fn public_create_update_unmount_available(&self) -> bool {
            self.public_create_update_unmount_available
        }

        #[must_use]
        pub(crate) const fn compatibility_claimed(&self) -> bool {
            self.compatibility_claimed
        }
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) enum TestRendererNativeRootExecutionBridgeError {
        RootAlreadyCreated,
        MissingRoot,
        MissingScheduledUpdate {
            operation: TestRendererRootUpdateKind,
        },
        RequestSequenceExhausted,
        Root(TestRendererRootError),
    }

    impl Display for TestRendererNativeRootExecutionBridgeError {
        fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
            match self {
                Self::RootAlreadyCreated => formatter.write_str(
                    "test-renderer native root execution bridge already owns a root",
                ),
                Self::MissingRoot => formatter.write_str(
                    "test-renderer native root execution bridge has no root to update or unmount",
                ),
                Self::MissingScheduledUpdate { operation } => write!(
                    formatter,
                    "test-renderer native root execution bridge did not receive a scheduled {:?} update from TestRendererRoot",
                    operation
                ),
                Self::RequestSequenceExhausted => formatter.write_str(
                    "test-renderer native root execution bridge request sequence cannot allocate another id",
                ),
                Self::Root(error) => Display::fmt(error, formatter),
            }
        }
    }

    impl Error for TestRendererNativeRootExecutionBridgeError {
        fn source(&self) -> Option<&(dyn Error + 'static)> {
            match self {
                Self::Root(error) => Some(error),
                Self::RootAlreadyCreated
                | Self::MissingRoot
                | Self::MissingScheduledUpdate { .. }
                | Self::RequestSequenceExhausted => None,
            }
        }
    }

    impl From<TestRendererRootError> for TestRendererNativeRootExecutionBridgeError {
        fn from(error: TestRendererRootError) -> Self {
            Self::Root(error)
        }
    }

    pub(crate) struct TestRendererNativeRootExecutionBridge {
        root: Option<TestRendererRoot>,
        next_request_id: u64,
    }

    impl Default for TestRendererNativeRootExecutionBridge {
        fn default() -> Self {
            Self::new()
        }
    }

    impl TestRendererNativeRootExecutionBridge {
        #[must_use]
        pub(crate) const fn new() -> Self {
            Self {
                root: None,
                next_request_id: 1,
            }
        }

        pub(crate) fn execute_create(
            &mut self,
            element: RootElementHandle,
            options: TestRendererOptions,
        ) -> Result<TestRendererNativeRootExecutionRecord, TestRendererNativeRootExecutionBridgeError>
        {
            if self.root.is_some() {
                return Err(TestRendererNativeRootExecutionBridgeError::RootAlreadyCreated);
            }

            let request_id = self.allocate_request_id()?;
            let root = TestRendererRoot::create(element, options)?;
            let scheduled_update = root
                .last_scheduled_update()
                .map(TestRendererNativeRootScheduledExecution::from_scheduled_update)
                .ok_or(
                    TestRendererNativeRootExecutionBridgeError::MissingScheduledUpdate {
                        operation: TestRendererRootUpdateKind::Create,
                    },
                )?;
            let root_id = root.root_id();
            let lifecycle_after = root.lifecycle();
            self.root = Some(root);

            Ok(TestRendererNativeRootExecutionRecord::new(
                request_id,
                TestRendererRootUpdateKind::Create,
                root_id,
                None,
                lifecycle_after,
                "Scheduled",
                Some(scheduled_update),
            ))
        }

        pub(crate) fn execute_update(
            &mut self,
            element: RootElementHandle,
        ) -> Result<TestRendererNativeRootExecutionRecord, TestRendererNativeRootExecutionBridgeError>
        {
            if self.root.is_none() {
                return Err(TestRendererNativeRootExecutionBridgeError::MissingRoot);
            }
            let request_id = self.allocate_request_id()?;
            let root = self
                .root
                .as_mut()
                .expect("root presence checked before request id allocation");
            let root_id = root.root_id();
            let lifecycle_before = root.lifecycle();
            let outcome = root.update(element)?;
            let scheduled_update = outcome
                .scheduled()
                .map(TestRendererNativeRootScheduledExecution::from_scheduled_update);
            let lifecycle_after = root.lifecycle();

            Ok(TestRendererNativeRootExecutionRecord::new(
                request_id,
                TestRendererRootUpdateKind::Update,
                root_id,
                Some(lifecycle_before),
                lifecycle_after,
                outcome.code(),
                scheduled_update,
            ))
        }

        pub(crate) fn execute_unmount(
            &mut self,
        ) -> Result<TestRendererNativeRootExecutionRecord, TestRendererNativeRootExecutionBridgeError>
        {
            if self.root.is_none() {
                return Err(TestRendererNativeRootExecutionBridgeError::MissingRoot);
            }
            let request_id = self.allocate_request_id()?;
            let root = self
                .root
                .as_mut()
                .expect("root presence checked before request id allocation");
            let root_id = root.root_id();
            let lifecycle_before = root.lifecycle();
            let outcome = root.unmount()?;
            let scheduled_update = outcome
                .scheduled()
                .map(TestRendererNativeRootScheduledExecution::from_scheduled_update);
            let lifecycle_after = root.lifecycle();

            Ok(TestRendererNativeRootExecutionRecord::new(
                request_id,
                TestRendererRootUpdateKind::Unmount,
                root_id,
                Some(lifecycle_before),
                lifecycle_after,
                outcome.code(),
                scheduled_update,
            ))
        }

        #[must_use]
        pub(crate) fn root(&self) -> Option<&TestRendererRoot> {
            self.root.as_ref()
        }

        fn allocate_request_id(
            &mut self,
        ) -> Result<u64, TestRendererNativeRootExecutionBridgeError> {
            let request_id = self.next_request_id;
            self.next_request_id = self
                .next_request_id
                .checked_add(1)
                .ok_or(TestRendererNativeRootExecutionBridgeError::RequestSequenceExhausted)?;
            Ok(request_id)
        }
    }
}

pub const BINDING_PACKAGE_NAME: &str = "@fast-react/native";
pub const NAPI_BOUNDARY_STATUS: &str = "placeholder";
pub const NATIVE_ADDON_NAME: &str = "fast_react_napi";
pub const NODE_API_VERSION_FLOOR: u32 = 8;
pub const SUPPORTED_NODE_ENGINE_RANGE: &str = ">=22.0.0";
pub const PLATFORM_ARTIFACT_POLICY: &str =
    "future per-platform optional npm packages; no native addon is built or loaded yet";
pub const OPTIONAL_PACKAGE_PREFIX: &str = "@fast-react/native-";
pub const NATIVE_ROOT_BRIDGE_JS_REQUEST_SHAPE_GATE_STATUS: &str =
    "admitted-native-root-bridge-js-request-shape";
pub const NATIVE_ROOT_BRIDGE_HANDLE_ADMISSION_PREFLIGHT_STATUS: &str =
    "preflighted-native-root-bridge-real-handle-admission";
pub const NATIVE_ROOT_BRIDGE_RUST_HANDLE_TABLE_ADMISSION_SMOKE_STATUS: &str =
    "mirrored-native-root-bridge-rust-handle-table-admission-smoke";
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_SMOKE_STATUS: &str =
    "smoked-native-root-bridge-js-to-rust-json-transport";
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_PARSER_GATE_STATUS: &str =
    "parsed-native-root-bridge-json-transport-schema";
pub const NATIVE_ROOT_BRIDGE_CROSS_ENVIRONMENT_TEARDOWN_GATE_STATUS: &str =
    "diagnosed-native-root-bridge-cross-environment-teardown-isolation";
pub const NATIVE_ROOT_BRIDGE_BATCHED_JSON_TRANSPORT_GATE_STATUS: &str =
    "validated-native-root-bridge-batched-json-transport-records";
pub const NATIVE_ROOT_BRIDGE_TRANSPORT_WORKER_THREAD_TEARDOWN_GATE_STATUS: &str =
    "diagnosed-native-root-bridge-transport-worker-thread-teardown";
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_GATE_STATUS: &str =
    "diagnosed-native-root-bridge-json-batch-response-sequence";
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID: &str =
    "native-root-bridge-json-batch-552";
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_GATE_STATUS: &str =
    "diagnosed-native-root-bridge-json-stream-batch-roundtrip";
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_STREAM_ID: &str =
    "native-root-bridge-json-stream-batch-roundtrip-587";
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_OUT_OF_ORDER_CHUNK_CODE: &str =
    "FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_CHUNK_OUT_OF_ORDER";
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_DUPLICATE_CHUNK_CODE: &str =
    "FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_DUPLICATE_CHUNK";
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_MISSING_CHUNK_CODE: &str =
    "FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_MISSING_CHUNK";
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_POST_TEARDOWN_CHUNK_CODE: &str =
    "FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_CHUNK_AFTER_TEARDOWN";
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_FORMAT: &str = "json";
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_SCHEMA_VERSION: u32 = 1;
pub const TEST_RENDERER_NATIVE_ROOT_EXECUTION_BRIDGE_STATUS: &str =
    "admitted-private-test-renderer-native-root-execution-bridge";
pub const TEST_RENDERER_NATIVE_ROOT_EXECUTION_BOUNDARY: &str =
    "fast-react-test-renderer.TestRendererRoot";
pub const TEST_RENDERER_NATIVE_ROOT_EXECUTION_PUBLIC_STATUS: &str =
    "blocked-public-react-test-renderer-create-update-unmount";
pub const NATIVE_ROOT_BRIDGE_REQUEST_VALIDATION_MODEL: &str =
    "fast-react-napi.NativeRootBridgeRequestSequenceValidator";
pub const NATIVE_ROOT_BRIDGE_HANDLE_TABLE_MODEL: &str = "fast-react-napi.BridgeHandleTable";
pub const NATIVE_ROOT_BRIDGE_JS_REQUEST_RECORD_FIELDS: &[&str] = &[
    "requestId",
    "kind",
    "environmentId",
    "rootHandle",
    "rootId",
    "valueHandle",
    "rootHandleState",
];
pub const NATIVE_ROOT_BRIDGE_RUST_REQUEST_RECORD_FIELDS: &[&str] = &[
    "request_id",
    "kind",
    "environment_id",
    "root_handle",
    "root_id",
    "value_handle",
    "root_handle_state",
];
pub const NATIVE_ROOT_BRIDGE_RUST_VALIDATION_RECORD_FIELDS: &[&str] = &[
    "request_id",
    "kind",
    "environment_id",
    "root_handle",
    "root_id",
    "value_handle",
    "root_handle_state",
    "lifecycle_transition",
    "root_handle_validated",
    "value_handle_validated",
];
pub const NATIVE_ROOT_BRIDGE_JS_HANDLE_FIELDS: &[&str] =
    &["environmentId", "slot", "generation", "kind"];
pub const NATIVE_ROOT_BRIDGE_RUST_HANDLE_FIELDS: &[&str] =
    &["environment_id", "slot", "generation", "kind"];
pub const NATIVE_ROOT_BRIDGE_REQUEST_KIND_CODES: &[&str] = &["create", "render", "unmount"];
pub const NATIVE_ROOT_BRIDGE_HANDLE_KIND_CODES: &[&str] = &["root", "value"];
pub const NATIVE_ROOT_BRIDGE_ROOT_HANDLE_STATE_CODES: &[&str] = &["active", "retired"];
pub const NATIVE_ROOT_BRIDGE_LIFECYCLE_TRANSITION_CODES: &[&str] =
    &["none->active", "active->active", "active->retired"];
pub const NATIVE_ROOT_BRIDGE_HANDLE_ADMISSION_ACTION_CODES: &[&str] = &[
    "admit-root-handle",
    "admit-value-handle",
    "validate-active-root-handle",
    "validate-value-handle",
    "retire-root-handle",
    "validate-retired-root-handle",
];
pub const NATIVE_ROOT_BRIDGE_RUST_HANDLE_TABLE_ADMISSION_SMOKE_RECORD_FIELDS: &[&str] = &[
    "request_id",
    "kind",
    "lifecycle_transition",
    "root_handle_state_before",
    "root_handle_state_after",
    "root_handle_action",
    "root_handle_current_generation",
    "value_handle_action",
    "value_handle_current_generation",
    "retired_root_source_error_code",
];
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_ENVELOPE_FIELDS: &[&str] =
    &["transport", "schemaVersion", "requestRecords"];
pub const NATIVE_ROOT_BRIDGE_CROSS_ENVIRONMENT_TEARDOWN_DIAGNOSTIC_FIELDS: &[&str] = &[
    "id",
    "operation",
    "handle_kind",
    "table_environment_id",
    "handle_environment_id",
    "slot",
    "handle_generation",
    "current_generation",
    "record_id",
    "error_code",
    "native_addon_loaded",
    "native_execution",
    "renderer_execution",
    "reconciler_execution",
    "react_behavior_error",
];
pub const NATIVE_ROOT_BRIDGE_BATCHED_JSON_TRANSPORT_LIFECYCLE_ROW_FIELDS: &[&str] = &[
    "id",
    "batch_index",
    "request_id",
    "kind",
    "lifecycle_before",
    "lifecycle_after",
    "lifecycle_transition",
    "status",
    "code",
    "source_error_code",
    "boundary_error_code",
    "native_addon_loaded",
    "native_execution",
    "renderer_execution",
    "reconciler_execution",
    "react_behavior_error",
];
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_ROW_FIELDS: &[&str] = &[
    "id",
    "batch_id",
    "request_order",
    "response_order",
    "request_id",
    "kind",
    "response_status",
    "error_row_status",
    "teardown_state",
    "code",
    "source_error_code",
    "boundary_error_code",
    "native_addon_loaded",
    "native_execution",
    "renderer_execution",
    "reconciler_execution",
    "react_behavior_error",
];
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_ERROR_ROW_STATUSES: &[&str] = &[
    "not-error-row",
    "lifecycle-error-row",
    "deterministic-error-row",
];
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_TEARDOWN_STATES: &[&str] =
    &["root-uninitialized", "root-active", "root-retired"];
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_CHUNK_ROW_FIELDS: &[&str] = &[
    "id",
    "batch_id",
    "stream_id",
    "request_id",
    "request_order",
    "response_order",
    "chunk_order",
    "batch_sequence",
    "chunk_kind",
    "chunk_status",
    "response_status",
    "assembly_state",
    "assembled_response",
    "teardown_state",
    "teardown_blocker",
    "code",
    "source_error_code",
    "boundary_error_code",
    "native_addon_loaded",
    "native_execution",
    "renderer_execution",
    "reconciler_execution",
    "cross_environment_handle_reuse_blocked",
    "public_native_compatibility",
    "react_behavior_error",
];
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_ERROR_CASE_IDS: &[&str] = &[
    "stream-chunk-out-of-order",
    "stream-chunk-duplicate",
    "stream-chunk-missing",
    "stream-chunk-after-teardown",
];
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_CHUNK_KINDS: &[&str] =
    &["metadata", "payload"];
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_CHUNK_STATUSES: &[&str] =
    &["accepted", "error"];
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_ASSEMBLY_STATES: &[&str] =
    &["partial", "assembled", "rejected"];
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_TEARDOWN_BLOCKERS: &[&str] = &[
    "none",
    "root-retired-after-assembly",
    "post-teardown-chunk-blocked",
];
pub const NATIVE_ROOT_BRIDGE_TRANSPORT_WORKER_THREAD_TEARDOWN_ROW_FIELDS: &[&str] = &[
    "id",
    "operation",
    "worker_thread_id",
    "transport",
    "source_batch_index",
    "request_id",
    "handle_kind",
    "table_environment_id",
    "handle_environment_id",
    "slot",
    "handle_generation",
    "current_generation",
    "record_id",
    "error_code",
    "boundary_error_code",
    "native_addon_loaded",
    "native_execution",
    "renderer_execution",
    "reconciler_execution",
    "react_behavior_error",
];
pub const TEST_RENDERER_NATIVE_ROOT_EXECUTION_RECORD_FIELDS: &[&str] = &[
    "request_id",
    "operation",
    "root_id",
    "lifecycle_before",
    "lifecycle_after",
    "update_outcome",
    "scheduled_update",
    "private_root_request_execution",
    "rust_root_execution_boundary_called",
    "native_addon_loaded",
    "native_execution",
    "reconciler_execution",
    "host_output_produced",
    "public_create_update_unmount_available",
    "compatibility_claimed",
];
pub const NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_PARSE_ERROR_CODES: &[&str] = &[
    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_JSON",
    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_EXPECTED_OBJECT",
    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_MISSING_FIELD",
    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNEXPECTED_FIELD",
    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_FIELD_TYPE",
    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNSUPPORTED_FIELD_VALUE",
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct NativeTargetMetadata {
    native_target: &'static str,
    platform: &'static str,
    architecture: &'static str,
    libc: Option<&'static str>,
    toolchain: Option<&'static str>,
    optional_package_name: &'static str,
    native_file_name: &'static str,
}

impl NativeTargetMetadata {
    #[must_use]
    pub const fn native_target(&self) -> &'static str {
        self.native_target
    }

    #[must_use]
    pub const fn platform(&self) -> &'static str {
        self.platform
    }

    #[must_use]
    pub const fn architecture(&self) -> &'static str {
        self.architecture
    }

    #[must_use]
    pub const fn libc(&self) -> Option<&'static str> {
        self.libc
    }

    #[must_use]
    pub const fn toolchain(&self) -> Option<&'static str> {
        self.toolchain
    }

    #[must_use]
    pub const fn optional_package_name(&self) -> &'static str {
        self.optional_package_name
    }

    #[must_use]
    pub const fn native_file_name(&self) -> &'static str {
        self.native_file_name
    }
}

pub const NATIVE_TARGET_MATRIX: &[NativeTargetMetadata] = &[
    NativeTargetMetadata {
        native_target: "darwin-arm64",
        platform: "darwin",
        architecture: "arm64",
        libc: None,
        toolchain: None,
        optional_package_name: "@fast-react/native-darwin-arm64",
        native_file_name: "fast_react_napi.darwin-arm64.node",
    },
    NativeTargetMetadata {
        native_target: "darwin-x64",
        platform: "darwin",
        architecture: "x64",
        libc: None,
        toolchain: None,
        optional_package_name: "@fast-react/native-darwin-x64",
        native_file_name: "fast_react_napi.darwin-x64.node",
    },
    NativeTargetMetadata {
        native_target: "linux-arm64-gnu",
        platform: "linux",
        architecture: "arm64",
        libc: Some("gnu"),
        toolchain: None,
        optional_package_name: "@fast-react/native-linux-arm64-gnu",
        native_file_name: "fast_react_napi.linux-arm64-gnu.node",
    },
    NativeTargetMetadata {
        native_target: "linux-arm64-musl",
        platform: "linux",
        architecture: "arm64",
        libc: Some("musl"),
        toolchain: None,
        optional_package_name: "@fast-react/native-linux-arm64-musl",
        native_file_name: "fast_react_napi.linux-arm64-musl.node",
    },
    NativeTargetMetadata {
        native_target: "linux-x64-gnu",
        platform: "linux",
        architecture: "x64",
        libc: Some("gnu"),
        toolchain: None,
        optional_package_name: "@fast-react/native-linux-x64-gnu",
        native_file_name: "fast_react_napi.linux-x64-gnu.node",
    },
    NativeTargetMetadata {
        native_target: "linux-x64-musl",
        platform: "linux",
        architecture: "x64",
        libc: Some("musl"),
        toolchain: None,
        optional_package_name: "@fast-react/native-linux-x64-musl",
        native_file_name: "fast_react_napi.linux-x64-musl.node",
    },
    NativeTargetMetadata {
        native_target: "win32-arm64-msvc",
        platform: "win32",
        architecture: "arm64",
        libc: None,
        toolchain: Some("msvc"),
        optional_package_name: "@fast-react/native-win32-arm64-msvc",
        native_file_name: "fast_react_napi.win32-arm64-msvc.node",
    },
    NativeTargetMetadata {
        native_target: "win32-x64-msvc",
        platform: "win32",
        architecture: "x64",
        libc: None,
        toolchain: Some("msvc"),
        optional_package_name: "@fast-react/native-win32-x64-msvc",
        native_file_name: "fast_react_napi.win32-x64-msvc.node",
    },
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct NativeBoundaryMetadata {
    package_name: &'static str,
    status: &'static str,
    native_addon_name: &'static str,
    node_api_version_floor: u32,
    supported_node_engine_range: &'static str,
    platform_artifact_policy: &'static str,
}

impl NativeBoundaryMetadata {
    #[must_use]
    pub const fn package_name(&self) -> &'static str {
        self.package_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn native_addon_name(&self) -> &'static str {
        self.native_addon_name
    }

    #[must_use]
    pub const fn node_api_version_floor(&self) -> u32 {
        self.node_api_version_floor
    }

    #[must_use]
    pub const fn supported_node_engine_range(&self) -> &'static str {
        self.supported_node_engine_range
    }

    #[must_use]
    pub const fn platform_artifact_policy(&self) -> &'static str {
        self.platform_artifact_policy
    }

    #[must_use]
    pub const fn native_target_count(&self) -> usize {
        NATIVE_TARGET_MATRIX.len()
    }
}

#[must_use]
pub const fn boundary_metadata() -> NativeBoundaryMetadata {
    NativeBoundaryMetadata {
        package_name: BINDING_PACKAGE_NAME,
        status: NAPI_BOUNDARY_STATUS,
        native_addon_name: NATIVE_ADDON_NAME,
        node_api_version_floor: NODE_API_VERSION_FLOOR,
        supported_node_engine_range: SUPPORTED_NODE_ENGINE_RANGE,
        platform_artifact_policy: PLATFORM_ARTIFACT_POLICY,
    }
}

#[must_use]
pub const fn binding_status() -> &'static str {
    NAPI_BOUNDARY_STATUS
}

#[must_use]
pub const fn native_target_matrix() -> &'static [NativeTargetMetadata] {
    NATIVE_TARGET_MATRIX
}

#[must_use]
pub fn native_target_metadata(native_target: &str) -> Option<&'static NativeTargetMetadata> {
    NATIVE_TARGET_MATRIX
        .iter()
        .find(|target| target.native_target() == native_target)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NativeBoundaryErrorKind {
    NativeExportsNotBuilt,
    RootBridgeWrongEnvironment,
    RootBridgeStaleHandle,
    RootBridgeWrongLifecycleOrder,
    RootBridgeValidationFailed,
}

impl NativeBoundaryErrorKind {
    #[must_use]
    pub const fn code(self) -> &'static str {
        match self {
            Self::NativeExportsNotBuilt => "FAST_REACT_NAPI_EXPORTS_NOT_BUILT",
            Self::RootBridgeWrongEnvironment => "FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_ENVIRONMENT",
            Self::RootBridgeStaleHandle => "FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE",
            Self::RootBridgeWrongLifecycleOrder => {
                "FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"
            }
            Self::RootBridgeValidationFailed => "FAST_REACT_NAPI_ROOT_BRIDGE_VALIDATION_FAILED",
        }
    }

    #[must_use]
    pub const fn reason(self) -> &'static str {
        match self {
            Self::NativeExportsNotBuilt => {
                "Fast React native exports are intentionally unavailable until N-API dependencies are added"
            }
            Self::RootBridgeWrongEnvironment => {
                "A native root bridge request referenced the wrong bridge environment"
            }
            Self::RootBridgeStaleHandle => {
                "A native root bridge request referenced a stale or retired bridge handle"
            }
            Self::RootBridgeWrongLifecycleOrder => {
                "A native root bridge request arrived in an invalid root lifecycle order"
            }
            Self::RootBridgeValidationFailed => {
                "A native root bridge request failed private boundary validation"
            }
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NativeBoundaryError {
    export_name: &'static str,
    kind: NativeBoundaryErrorKind,
    source_error_code: Option<&'static str>,
}

impl NativeBoundaryError {
    #[must_use]
    pub const fn native_exports_not_built(export_name: &'static str) -> Self {
        Self {
            export_name,
            kind: NativeBoundaryErrorKind::NativeExportsNotBuilt,
            source_error_code: None,
        }
    }

    #[must_use]
    pub(crate) const fn root_bridge_validation_failure(
        export_name: &'static str,
        kind: NativeBoundaryErrorKind,
        source_error_code: &'static str,
    ) -> Self {
        Self {
            export_name,
            kind,
            source_error_code: Some(source_error_code),
        }
    }

    #[must_use]
    pub const fn export_name(&self) -> &'static str {
        self.export_name
    }

    #[must_use]
    pub const fn kind(&self) -> NativeBoundaryErrorKind {
        self.kind
    }

    #[must_use]
    pub const fn code(&self) -> &'static str {
        self.kind.code()
    }

    #[must_use]
    pub const fn reason(&self) -> &'static str {
        self.kind.reason()
    }

    #[must_use]
    pub const fn source_error_code(&self) -> Option<&'static str> {
        self.source_error_code
    }

    #[must_use]
    pub const fn metadata(&self) -> NativeBoundaryMetadata {
        boundary_metadata()
    }
}

impl Display for NativeBoundaryError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        write!(
            formatter,
            "{}: {} ({}, package={}, addon={}, node_api_floor={}",
            self.export_name,
            self.reason(),
            self.code(),
            self.metadata().package_name(),
            self.metadata().native_addon_name(),
            self.metadata().node_api_version_floor()
        )?;

        if let Some(source_error_code) = self.source_error_code {
            write!(formatter, ", source={source_error_code}")?;
        }

        formatter.write_str(")")
    }
}

impl Error for NativeBoundaryError {}

pub fn native_export_placeholder(export_name: &'static str) -> Result<(), NativeBoundaryError> {
    Err(NativeBoundaryError::native_exports_not_built(export_name))
}

#[allow(dead_code)]
pub(crate) fn native_root_bridge_validation_placeholder(
    export_name: &'static str,
    error: &root_bridge_requests::NativeRootBridgeRequestError,
) -> NativeBoundaryError {
    NativeBoundaryError::root_bridge_validation_failure(
        export_name,
        native_boundary_kind_for_root_bridge_request_error(error),
        error.code(),
    )
}

fn native_boundary_kind_for_root_bridge_request_error(
    error: &root_bridge_requests::NativeRootBridgeRequestError,
) -> NativeBoundaryErrorKind {
    match error {
        root_bridge_requests::NativeRootBridgeRequestError::HandleTable(
            handle_table::BridgeHandleTableError::WrongEnvironment { .. },
        )
        | root_bridge_requests::NativeRootBridgeRequestError::RecordEnvironmentMismatch {
            ..
        } => NativeBoundaryErrorKind::RootBridgeWrongEnvironment,
        root_bridge_requests::NativeRootBridgeRequestError::HandleTable(
            handle_table::BridgeHandleTableError::StaleHandle { .. }
            | handle_table::BridgeHandleTableError::DisposedHandle { .. },
        ) => NativeBoundaryErrorKind::RootBridgeStaleHandle,
        root_bridge_requests::NativeRootBridgeRequestError::RecordRootHandleStateMismatch {
            ..
        }
        | root_bridge_requests::NativeRootBridgeRequestError::RootHandleStillActive { .. }
        | root_bridge_requests::NativeRootBridgeRequestError::SequenceMustStartWithCreate {
            ..
        }
        | root_bridge_requests::NativeRootBridgeRequestError::CreateAfterRootCreated { .. }
        | root_bridge_requests::NativeRootBridgeRequestError::RequestAfterUnmount { .. }
        | root_bridge_requests::NativeRootBridgeRequestError::RequestSequenceOutOfOrder {
            ..
        }
        | root_bridge_requests::NativeRootBridgeRequestError::RequestSequenceExhausted => {
            NativeBoundaryErrorKind::RootBridgeWrongLifecycleOrder
        }
        root_bridge_requests::NativeRootBridgeRequestError::HandleTable(_)
        | root_bridge_requests::NativeRootBridgeRequestError::RecordRootHandleMismatch { .. }
        | root_bridge_requests::NativeRootBridgeRequestError::RecordRootIdMismatch { .. }
        | root_bridge_requests::NativeRootBridgeRequestError::UnexpectedValueHandle { .. }
        | root_bridge_requests::NativeRootBridgeRequestError::JsonTransportRecordInvalid {
            ..
        } => NativeBoundaryErrorKind::RootBridgeValidationFailed,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::handle_table::{
        BridgeEnvironmentId, BridgeHandle, BridgeHandleKind, BridgeHandleTable,
        BridgeHandleTableError, PlaceholderRootRecord, PlaceholderValueRecord,
    };
    use crate::root_bridge_requests::{
        NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PREFLIGHT_STATUS,
        NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS,
        NativeRootBridgeBatchResponseErrorRowStatus, NativeRootBridgeBatchResponseTeardownState,
        NativeRootBridgeBatchedJsonTransportLifecycleState,
        NativeRootBridgeBatchedJsonTransportLifecycleStatus, NativeRootBridgeCreateRequest,
        NativeRootBridgeHandleAdmissionAction, NativeRootBridgeJsonTransportHandle,
        NativeRootBridgeJsonTransportParseError, NativeRootBridgeJsonTransportRecord,
        NativeRootBridgeJsonTransportStreamAssemblyState,
        NativeRootBridgeJsonTransportStreamChunkKind,
        NativeRootBridgeJsonTransportStreamChunkStatus,
        NativeRootBridgeJsonTransportStreamTeardownBlocker, NativeRootBridgeJsonTransportValueKind,
        NativeRootBridgeLifecycleTransition, NativeRootBridgeRenderRequest,
        NativeRootBridgeRequestError, NativeRootBridgeRequestKind, NativeRootBridgeRequestRecord,
        NativeRootBridgeRequestRecorder, NativeRootBridgeRequestSequenceValidator,
        NativeRootBridgeRootHandleState, NativeRootBridgeUnmountRequest,
        NativeRootBridgeWorkerThreadCleanupHookEvidence,
        NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus,
        native_root_bridge_batched_json_transport_error_rows,
        native_root_bridge_cross_environment_teardown_gate,
        native_root_bridge_json_transport_error_diagnostic_rows,
        native_root_bridge_transport_worker_thread_teardown_gate,
        native_root_bridge_worker_thread_cleanup_hook_preflight,
        native_root_bridge_worker_thread_teardown_executable_preflight,
        parse_native_root_bridge_json_transport_for_gate,
        smoke_admit_js_native_root_bridge_handoff_records,
        smoke_admit_js_native_root_bridge_json_transport_records,
        validate_native_root_bridge_worker_thread_cleanup_hook_evidence_for_preflight,
    };
    use crate::test_renderer_root_execution_bridge::{
        TestRendererNativeRootExecutionBridge, TestRendererNativeRootExecutionBridgeError,
    };
    use fast_react_reconciler::RootElementHandle;
    use fast_react_test_renderer::{
        TestRendererOptions, TestRendererRootLifecycle, TestRendererRootUpdateKind,
    };
    use std::path::Path;

    #[test]
    fn native_boundary_is_a_placeholder() {
        let metadata = boundary_metadata();

        assert_eq!(binding_status(), "placeholder");
        assert_eq!(metadata.package_name(), "@fast-react/native");
        assert_eq!(metadata.native_addon_name(), "fast_react_napi");
        assert_eq!(metadata.node_api_version_floor(), 8);
        assert_eq!(metadata.supported_node_engine_range(), ">=22.0.0");
        assert!(
            metadata
                .platform_artifact_policy()
                .contains("per-platform optional npm packages")
        );
        assert_eq!(metadata.native_target_count(), 8);
    }

    #[test]
    fn native_target_matrix_is_deterministic() {
        let targets = native_target_matrix();

        assert_eq!(targets.len(), 8);
        assert_eq!(targets[0].native_target(), "darwin-arm64");
        assert_eq!(targets[0].platform(), "darwin");
        assert_eq!(targets[0].architecture(), "arm64");
        assert_eq!(targets[0].libc(), None);
        assert_eq!(targets[0].toolchain(), None);
        assert_eq!(
            targets[0].optional_package_name(),
            "@fast-react/native-darwin-arm64"
        );
        assert_eq!(
            targets[0].native_file_name(),
            "fast_react_napi.darwin-arm64.node"
        );

        assert_eq!(targets[1].native_target(), "darwin-x64");
        assert_eq!(
            native_target_metadata("linux-arm64-gnu")
                .expect("linux-arm64-gnu target metadata")
                .optional_package_name(),
            "@fast-react/native-linux-arm64-gnu"
        );
        assert_eq!(
            native_target_metadata("linux-arm64-musl")
                .expect("linux-arm64-musl target metadata")
                .native_file_name(),
            "fast_react_napi.linux-arm64-musl.node"
        );
        assert_eq!(
            native_target_metadata("linux-x64-gnu")
                .expect("linux-x64-gnu target metadata")
                .libc(),
            Some("gnu")
        );
        assert_eq!(
            native_target_metadata("linux-x64-musl")
                .expect("linux-x64-musl target metadata")
                .libc(),
            Some("musl")
        );
        assert_eq!(
            native_target_metadata("win32-arm64-msvc")
                .expect("win32-arm64-msvc target metadata")
                .toolchain(),
            Some("msvc")
        );
        assert_eq!(
            native_target_metadata("win32-x64-msvc")
                .expect("win32-x64-msvc target metadata")
                .optional_package_name(),
            "@fast-react/native-win32-x64-msvc"
        );
        assert!(native_target_metadata("freebsd-x64").is_none());
    }

    #[test]
    fn native_exports_fail_loudly() {
        let error = native_export_placeholder("native.createElement").unwrap_err();
        assert_eq!(error.export_name(), "native.createElement");
        assert_eq!(error.kind(), NativeBoundaryErrorKind::NativeExportsNotBuilt);
        assert_eq!(error.code(), "FAST_REACT_NAPI_EXPORTS_NOT_BUILT");
        assert_eq!(error.source_error_code(), None);
        assert!(error.reason().contains("N-API dependencies"));
        assert!(error.to_string().contains("@fast-react/native"));
        assert!(error.to_string().contains("fast_react_napi"));
    }

    #[test]
    fn native_boundary_unsupported_native_execution_stays_distinct_from_root_validation() {
        let error = native_export_placeholder("native.root.render").unwrap_err();

        assert_eq!(error.kind(), NativeBoundaryErrorKind::NativeExportsNotBuilt);
        assert_eq!(error.code(), "FAST_REACT_NAPI_EXPORTS_NOT_BUILT");
        assert_eq!(error.source_error_code(), None);
        assert!(!error.to_string().contains("FAST_REACT_UNIMPLEMENTED"));
        assert!(!error.to_string().contains("React behavior"));
        assert_ne!(
            error.code(),
            NativeBoundaryErrorKind::RootBridgeWrongEnvironment.code()
        );
        assert_ne!(
            error.code(),
            NativeBoundaryErrorKind::RootBridgeStaleHandle.code()
        );
        assert_ne!(
            error.code(),
            NativeBoundaryErrorKind::RootBridgeWrongLifecycleOrder.code()
        );
    }

    #[test]
    fn native_boundary_errors_are_not_react_behavior_errors() {
        let error = native_export_placeholder("native.processWork").unwrap_err();

        assert!(!error.to_string().contains("React behavior"));
        assert_eq!(error.metadata(), boundary_metadata());
    }

    #[test]
    fn native_root_bridge_boundary_maps_wrong_environment_and_stale_handles() {
        let mut first = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(319));
        let second = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(320));
        let mut first_recorder = NativeRootBridgeRequestRecorder::new();
        let mut second_recorder = NativeRootBridgeRequestRecorder::new();
        let create = first_recorder
            .record_create_root(&mut first, NativeRootBridgeCreateRequest::new(7901))
            .unwrap();

        let wrong_environment = second_recorder
            .record_render(
                &second,
                NativeRootBridgeRenderRequest::new(create.root_handle()),
            )
            .unwrap_err();
        let wrong_environment_boundary =
            native_root_bridge_validation_placeholder("native.root.render", &wrong_environment);

        assert_eq!(
            wrong_environment_boundary.kind(),
            NativeBoundaryErrorKind::RootBridgeWrongEnvironment
        );
        assert_eq!(
            wrong_environment_boundary.code(),
            "FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_ENVIRONMENT"
        );
        assert_eq!(
            wrong_environment_boundary.source_error_code(),
            Some("FAST_REACT_NAPI_WRONG_ENVIRONMENT")
        );
        assert!(
            wrong_environment_boundary
                .reason()
                .contains("wrong bridge environment")
        );
        assert!(
            wrong_environment_boundary
                .to_string()
                .contains("source=FAST_REACT_NAPI_WRONG_ENVIRONMENT")
        );
        assert!(
            !wrong_environment_boundary
                .to_string()
                .contains("React behavior")
        );

        let unmount = first_recorder
            .record_unmount(
                &mut first,
                NativeRootBridgeUnmountRequest::new(create.root_handle()),
            )
            .unwrap();
        let stale = first_recorder
            .record_render(
                &first,
                NativeRootBridgeRenderRequest::new(unmount.root_handle()),
            )
            .unwrap_err();
        let stale_boundary =
            native_root_bridge_validation_placeholder("native.root.render", &stale);

        assert_eq!(
            stale_boundary.kind(),
            NativeBoundaryErrorKind::RootBridgeStaleHandle
        );
        assert_eq!(
            stale_boundary.code(),
            "FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"
        );
        assert_eq!(
            stale_boundary.source_error_code(),
            Some("FAST_REACT_NAPI_STALE_HANDLE")
        );
        assert!(stale_boundary.reason().contains("stale or retired"));
        assert!(!stale_boundary.to_string().contains("React behavior"));
    }

    #[test]
    fn native_root_bridge_boundary_maps_wrong_lifecycle_order() {
        let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(319));
        let manual_root = table.insert_root(PlaceholderRootRecord::new(7902));
        let mut recorder = NativeRootBridgeRequestRecorder::new();
        let mut validator = NativeRootBridgeRequestSequenceValidator::new();
        let render_before_create = recorder
            .record_render(&table, NativeRootBridgeRenderRequest::new(manual_root))
            .unwrap();

        let missing_create = validator
            .validate_next(&table, render_before_create)
            .unwrap_err();
        let boundary =
            native_root_bridge_validation_placeholder("native.root.render", &missing_create);

        assert_eq!(
            boundary.kind(),
            NativeBoundaryErrorKind::RootBridgeWrongLifecycleOrder
        );
        assert_eq!(
            boundary.code(),
            "FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"
        );
        assert_eq!(
            boundary.source_error_code(),
            Some("FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE")
        );
        assert!(boundary.reason().contains("invalid root lifecycle order"));
        assert!(
            boundary
                .to_string()
                .contains("source=FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE")
        );
        assert!(!boundary.to_string().contains("FAST_REACT_UNIMPLEMENTED"));
        assert!(!boundary.to_string().contains("React behavior"));
    }

    #[test]
    fn native_root_bridge_records_create_and_render_inert_handle_metadata() {
        let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(256));
        let container_handle = table.insert_value(PlaceholderValueRecord::new(9001));
        let element_handle = table.insert_value(PlaceholderValueRecord::new(9002));
        let mut recorder = NativeRootBridgeRequestRecorder::new();

        let create = recorder
            .record_create_root(
                &mut table,
                NativeRootBridgeCreateRequest::new(7001).with_container_handle(container_handle),
            )
            .unwrap();

        assert_eq!(create.request_id(), 1);
        assert_eq!(create.kind(), NativeRootBridgeRequestKind::Create);
        assert_eq!(create.kind().code(), "create");
        assert_eq!(create.environment_id(), table.environment_id());
        assert_eq!(create.root_id(), 7001);
        assert_eq!(create.value_handle(), Some(container_handle));
        assert_eq!(
            create.root_handle_state(),
            NativeRootBridgeRootHandleState::Active
        );
        assert_eq!(
            table.get_root(create.root_handle()).unwrap().root_id(),
            7001
        );
        assert_eq!(table.get_value(container_handle).unwrap().value_id(), 9001);

        let render = recorder
            .record_render(
                &table,
                NativeRootBridgeRenderRequest::new(create.root_handle())
                    .with_element_handle(element_handle),
            )
            .unwrap();

        assert_eq!(render.request_id(), 2);
        assert_eq!(render.kind(), NativeRootBridgeRequestKind::Render);
        assert_eq!(render.kind().code(), "render");
        assert_eq!(render.environment_id(), table.environment_id());
        assert_eq!(render.root_handle(), create.root_handle());
        assert_eq!(render.root_id(), 7001);
        assert_eq!(render.value_handle(), Some(element_handle));
        assert_eq!(
            render.root_handle_state(),
            NativeRootBridgeRootHandleState::Active
        );
        assert_eq!(
            table.get_root(render.root_handle()).unwrap().root_id(),
            7001
        );
        assert_eq!(table.get_value(element_handle).unwrap().value_id(), 9002);
    }

    #[test]
    fn native_root_bridge_unmount_record_retires_root_without_touching_values() {
        let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(256));
        let container_handle = table.insert_value(PlaceholderValueRecord::new(9101));
        let element_handle = table.insert_value(PlaceholderValueRecord::new(9102));
        let mut recorder = NativeRootBridgeRequestRecorder::new();
        let create = recorder
            .record_create_root(
                &mut table,
                NativeRootBridgeCreateRequest::new(7101).with_container_handle(container_handle),
            )
            .unwrap();

        recorder
            .record_render(
                &table,
                NativeRootBridgeRenderRequest::new(create.root_handle())
                    .with_element_handle(element_handle),
            )
            .unwrap();
        let unmount = recorder
            .record_unmount(
                &mut table,
                NativeRootBridgeUnmountRequest::new(create.root_handle()),
            )
            .unwrap();

        assert_eq!(unmount.request_id(), 3);
        assert_eq!(unmount.kind(), NativeRootBridgeRequestKind::Unmount);
        assert_eq!(unmount.kind().code(), "unmount");
        assert_eq!(unmount.root_id(), 7101);
        assert_eq!(unmount.root_handle(), create.root_handle());
        assert_eq!(unmount.value_handle(), None);
        assert_eq!(
            unmount.root_handle_state(),
            NativeRootBridgeRootHandleState::Retired
        );
        assert_eq!(
            table.get_root(create.root_handle()).unwrap_err(),
            BridgeHandleTableError::StaleHandle {
                handle: create.root_handle(),
                current_generation: create.root_handle().generation() + 1,
            }
        );
        assert_eq!(table.get_value(container_handle).unwrap().value_id(), 9101);
        assert_eq!(table.get_value(element_handle).unwrap().value_id(), 9102);
    }

    #[test]
    fn native_root_bridge_records_reject_wrong_environment_stale_and_wrong_kind_handles() {
        let mut first = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(256));
        let second = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(257));
        let wrong_kind_handle = first.insert_value(PlaceholderValueRecord::new(9201));
        let mut first_recorder = NativeRootBridgeRequestRecorder::new();
        let mut second_recorder = NativeRootBridgeRequestRecorder::new();
        let create = first_recorder
            .record_create_root(&mut first, NativeRootBridgeCreateRequest::new(7201))
            .unwrap();

        let wrong_environment = second_recorder
            .record_render(
                &second,
                NativeRootBridgeRenderRequest::new(create.root_handle()),
            )
            .unwrap_err();

        assert_eq!(
            wrong_environment,
            NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::WrongEnvironment {
                handle: create.root_handle(),
                expected: second.environment_id()
            })
        );
        assert_eq!(
            wrong_environment.code(),
            "FAST_REACT_NAPI_WRONG_ENVIRONMENT"
        );

        let wrong_kind = first_recorder
            .record_render(
                &first,
                NativeRootBridgeRenderRequest::new(wrong_kind_handle),
            )
            .unwrap_err();

        assert_eq!(
            wrong_kind,
            NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::WrongKind {
                handle: wrong_kind_handle,
                expected: BridgeHandleKind::Root,
                actual: BridgeHandleKind::Value
            })
        );
        assert_eq!(wrong_kind.code(), "FAST_REACT_NAPI_WRONG_HANDLE_KIND");

        let unmount = first_recorder
            .record_unmount(
                &mut first,
                NativeRootBridgeUnmountRequest::new(create.root_handle()),
            )
            .unwrap();
        let stale = first_recorder
            .record_render(
                &first,
                NativeRootBridgeRenderRequest::new(unmount.root_handle()),
            )
            .unwrap_err();

        assert_eq!(
            stale,
            NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::StaleHandle {
                handle: create.root_handle(),
                current_generation: create.root_handle().generation() + 1
            })
        );
        assert_eq!(stale.code(), "FAST_REACT_NAPI_STALE_HANDLE");
    }

    #[test]
    fn native_root_bridge_records_preserve_environment_teardown_stale_guarantee() {
        let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(256));
        let element_handle = table.insert_value(PlaceholderValueRecord::new(9301));
        let mut recorder = NativeRootBridgeRequestRecorder::new();
        let create = recorder
            .record_create_root(&mut table, NativeRootBridgeCreateRequest::new(7301))
            .unwrap();
        let teardown = table.teardown_environment(table.environment_id());

        assert!(teardown.environment_matched());
        assert_eq!(teardown.root_handles_invalidated(), 1);
        assert_eq!(teardown.value_handles_invalidated(), 1);

        let stale_root = recorder
            .record_render(
                &table,
                NativeRootBridgeRenderRequest::new(create.root_handle())
                    .with_element_handle(element_handle),
            )
            .unwrap_err();

        assert_eq!(
            stale_root,
            NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::StaleHandle {
                handle: create.root_handle(),
                current_generation: create.root_handle().generation() + 1
            })
        );
        assert_eq!(
            table.get_value(element_handle).unwrap_err(),
            BridgeHandleTableError::StaleHandle {
                handle: element_handle,
                current_generation: element_handle.generation() + 1
            }
        );
    }

    #[test]
    fn native_root_bridge_sequence_validator_admits_create_render_unmount_against_handle_table() {
        let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(281));
        let container_handle = table.insert_value(PlaceholderValueRecord::new(9401));
        let element_handle = table.insert_value(PlaceholderValueRecord::new(9402));
        let mut recorder = NativeRootBridgeRequestRecorder::new();
        let mut validator = NativeRootBridgeRequestSequenceValidator::new();

        let create = recorder
            .record_create_root(
                &mut table,
                NativeRootBridgeCreateRequest::new(7401).with_container_handle(container_handle),
            )
            .unwrap();
        let create_validation = validator.validate_next(&table, create).unwrap();

        assert_eq!(create_validation.request_id(), create.request_id());
        assert_eq!(
            create_validation.kind(),
            NativeRootBridgeRequestKind::Create
        );
        assert_eq!(create_validation.environment_id(), table.environment_id());
        assert_eq!(create_validation.root_handle(), create.root_handle());
        assert_eq!(create_validation.root_id(), 7401);
        assert_eq!(create_validation.value_handle(), Some(container_handle));
        assert_eq!(
            create_validation.root_handle_state(),
            NativeRootBridgeRootHandleState::Active
        );
        assert_eq!(
            create_validation.lifecycle_transition(),
            NativeRootBridgeLifecycleTransition::NoneToActive
        );
        assert_eq!(
            create_validation.lifecycle_transition().code(),
            "none->active"
        );
        assert!(create_validation.root_handle_validated());
        assert!(create_validation.value_handle_validated());
        assert_eq!(validator.root_handle(), Some(create.root_handle()));
        assert_eq!(validator.root_id(), Some(7401));
        assert_eq!(validator.last_request_id(), Some(create.request_id()));
        assert!(!validator.root_retired());

        let render = recorder
            .record_render(
                &table,
                NativeRootBridgeRenderRequest::new(create.root_handle())
                    .with_element_handle(element_handle),
            )
            .unwrap();
        let render_validation = validator.validate_next(&table, render).unwrap();

        assert_eq!(render_validation.request_id(), render.request_id());
        assert_eq!(
            render_validation.kind(),
            NativeRootBridgeRequestKind::Render
        );
        assert_eq!(render_validation.value_handle(), Some(element_handle));
        assert_eq!(
            render_validation.lifecycle_transition(),
            NativeRootBridgeLifecycleTransition::ActiveToActive
        );
        assert_eq!(
            render_validation.lifecycle_transition().code(),
            "active->active"
        );
        assert!(render_validation.root_handle_validated());
        assert!(render_validation.value_handle_validated());
        assert_eq!(validator.last_request_id(), Some(render.request_id()));
        assert!(!validator.root_retired());

        let unmount = recorder
            .record_unmount(
                &mut table,
                NativeRootBridgeUnmountRequest::new(create.root_handle()),
            )
            .unwrap();
        let unmount_validation = validator.validate_next(&table, unmount).unwrap();

        assert_eq!(
            unmount_validation.kind(),
            NativeRootBridgeRequestKind::Unmount
        );
        assert_eq!(unmount_validation.root_handle(), create.root_handle());
        assert_eq!(unmount_validation.value_handle(), None);
        assert_eq!(
            unmount_validation.root_handle_state(),
            NativeRootBridgeRootHandleState::Retired
        );
        assert_eq!(
            unmount_validation.lifecycle_transition(),
            NativeRootBridgeLifecycleTransition::ActiveToRetired
        );
        assert_eq!(
            unmount_validation.lifecycle_transition().code(),
            "active->retired"
        );
        assert!(unmount_validation.root_handle_validated());
        assert!(!unmount_validation.value_handle_validated());
        assert_eq!(validator.last_request_id(), Some(unmount.request_id()));
        assert!(validator.root_retired());
        assert_eq!(
            table.get_root(create.root_handle()).unwrap_err(),
            BridgeHandleTableError::StaleHandle {
                handle: create.root_handle(),
                current_generation: create.root_handle().generation() + 1
            }
        );
    }

    #[test]
    fn native_root_bridge_js_handoff_records_smoke_admit_through_rust_handle_table() {
        let environment_id = BridgeEnvironmentId::from_raw(376);
        let root_handle = BridgeHandle::new(environment_id, 1, 1, BridgeHandleKind::Root);
        let container_handle = BridgeHandle::new(environment_id, 2, 1, BridgeHandleKind::Value);
        let element_handle = BridgeHandle::new(environment_id, 3, 1, BridgeHandleKind::Value);
        let requests = [
            NativeRootBridgeRequestRecord::from_js_native_handoff_record(
                1,
                NativeRootBridgeRequestKind::Create,
                environment_id,
                root_handle,
                1,
                Some(container_handle),
                NativeRootBridgeRootHandleState::Active,
            ),
            NativeRootBridgeRequestRecord::from_js_native_handoff_record(
                2,
                NativeRootBridgeRequestKind::Render,
                environment_id,
                root_handle,
                1,
                Some(element_handle),
                NativeRootBridgeRootHandleState::Active,
            ),
            NativeRootBridgeRequestRecord::from_js_native_handoff_record(
                3,
                NativeRootBridgeRequestKind::Unmount,
                environment_id,
                root_handle,
                1,
                None,
                NativeRootBridgeRootHandleState::Retired,
            ),
        ];

        let smoke = smoke_admit_js_native_root_bridge_handoff_records(&requests).unwrap();
        let admission_records = smoke.admission_records();
        let validation_records = smoke.validation_records();

        assert_eq!(smoke.environment_id(), environment_id);
        assert_eq!(smoke.root_handle(), Some(root_handle));
        assert_eq!(smoke.root_id(), Some(1));
        assert!(smoke.root_retired());
        assert_eq!(admission_records.len(), 3);
        assert_eq!(validation_records.len(), 3);
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.request_id())
                .collect::<Vec<_>>(),
            [1, 2, 3]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.kind().code())
                .collect::<Vec<_>>(),
            ["create", "render", "unmount"]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.lifecycle_transition().code())
                .collect::<Vec<_>>(),
            ["none->active", "active->active", "active->retired"]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.root_handle_state_before().map(|state| state.code()))
                .collect::<Vec<_>>(),
            [None, Some("active"), Some("active")]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.root_handle_state_after().code())
                .collect::<Vec<_>>(),
            ["active", "active", "retired"]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.root_handle_action().code())
                .collect::<Vec<_>>(),
            [
                NativeRootBridgeHandleAdmissionAction::AdmitRoot.code(),
                NativeRootBridgeHandleAdmissionAction::ValidateActiveRoot.code(),
                NativeRootBridgeHandleAdmissionAction::RetireRoot.code()
            ]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.root_handle_current_generation())
                .collect::<Vec<_>>(),
            [1, 1, 2]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.value_handle_action().map(|action| action.code()))
                .collect::<Vec<_>>(),
            [
                Some(NativeRootBridgeHandleAdmissionAction::AdmitValue.code()),
                Some(NativeRootBridgeHandleAdmissionAction::AdmitValue.code()),
                None
            ]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.value_handle_current_generation())
                .collect::<Vec<_>>(),
            [Some(1), Some(1), None]
        );
        assert_eq!(
            admission_records[2].retired_root_source_error_code(),
            Some("FAST_REACT_NAPI_STALE_HANDLE")
        );
        assert_eq!(
            validation_records
                .iter()
                .map(|record| record.lifecycle_transition().code())
                .collect::<Vec<_>>(),
            ["none->active", "active->active", "active->retired"]
        );
        assert_eq!(
            validation_records
                .iter()
                .map(|record| record.root_handle_state().code())
                .collect::<Vec<_>>(),
            ["active", "active", "retired"]
        );
        assert_eq!(validation_records[0].value_handle(), Some(container_handle));
        assert_eq!(validation_records[1].value_handle(), Some(element_handle));
        assert_eq!(validation_records[2].value_handle(), None);
        assert!(validation_records[0].value_handle_validated());
        assert!(validation_records[1].value_handle_validated());
        assert!(!validation_records[2].value_handle_validated());
    }

    #[test]
    fn native_root_bridge_json_transport_records_smoke_admit_through_handle_table() {
        let records = [
            NativeRootBridgeJsonTransportRecord::new(
                1,
                "create",
                403,
                NativeRootBridgeJsonTransportHandle::new(403, 1, 1, "root"),
                1,
                Some(NativeRootBridgeJsonTransportHandle::new(403, 2, 1, "value")),
                "active",
            ),
            NativeRootBridgeJsonTransportRecord::new(
                2,
                "render",
                403,
                NativeRootBridgeJsonTransportHandle::new(403, 1, 1, "root"),
                1,
                Some(NativeRootBridgeJsonTransportHandle::new(403, 3, 1, "value")),
                "active",
            ),
            NativeRootBridgeJsonTransportRecord::new(
                3,
                "unmount",
                403,
                NativeRootBridgeJsonTransportHandle::new(403, 1, 1, "root"),
                1,
                None,
                "retired",
            ),
        ];

        let smoke = smoke_admit_js_native_root_bridge_json_transport_records(&records).unwrap();
        let admission_records = smoke.admission_records();
        let validation_records = smoke.validation_records();

        assert_eq!(smoke.environment_id(), BridgeEnvironmentId::from_raw(403));
        assert_eq!(smoke.root_id(), Some(1));
        assert!(smoke.root_retired());
        assert_eq!(admission_records.len(), 3);
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.lifecycle_transition().code())
                .collect::<Vec<_>>(),
            ["none->active", "active->active", "active->retired"]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.root_handle_action().code())
                .collect::<Vec<_>>(),
            [
                "admit-root-handle",
                "validate-active-root-handle",
                "retire-root-handle"
            ]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.root_handle_current_generation())
                .collect::<Vec<_>>(),
            [1, 1, 2]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.value_handle_action().map(|action| action.code()))
                .collect::<Vec<_>>(),
            [Some("admit-value-handle"), Some("admit-value-handle"), None]
        );
        assert_eq!(
            admission_records[2].retired_root_source_error_code(),
            Some("FAST_REACT_NAPI_STALE_HANDLE")
        );
        assert_eq!(
            validation_records
                .iter()
                .map(|record| record.kind().code())
                .collect::<Vec<_>>(),
            ["create", "render", "unmount"]
        );
        assert!(validation_records[0].value_handle_validated());
        assert!(validation_records[1].value_handle_validated());
        assert!(!validation_records[2].value_handle_validated());
    }

    #[test]
    fn native_root_bridge_json_transport_records_reject_unknown_codes() {
        let records = [NativeRootBridgeJsonTransportRecord::new(
            1,
            "update",
            403,
            NativeRootBridgeJsonTransportHandle::new(403, 1, 1, "root"),
            1,
            None,
            "active",
        )];

        let error = smoke_admit_js_native_root_bridge_json_transport_records(&records).unwrap_err();

        assert_eq!(
            error,
            NativeRootBridgeRequestError::JsonTransportRecordInvalid {
                field: "kind",
                value: "update"
            }
        );
        assert_eq!(
            error.code(),
            "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_RECORD_INVALID"
        );
    }

    #[test]
    fn native_root_bridge_json_transport_parser_gate_accepts_schema_and_admits_handles() {
        let json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":435,"root_handle":{"environment_id":435,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":435,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":435,"root_handle":{"environment_id":435,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":435,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":3,"kind":"unmount","environment_id":435,"root_handle":{"environment_id":435,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"}]}"#;

        let gate = parse_native_root_bridge_json_transport_for_gate(json).unwrap();
        let admission_records = gate.admission_smoke().admission_records();
        let validation_records = gate.admission_smoke().validation_records();

        assert_eq!(gate.transport(), "json");
        assert_eq!(gate.schema_version(), 1);
        assert_eq!(gate.request_records().len(), 3);
        assert!(!gate.native_execution());
        assert!(!gate.renderer_execution());
        assert!(!gate.reconciler_execution());
        assert_eq!(
            gate.admission_smoke().environment_id(),
            BridgeEnvironmentId::from_raw(435)
        );
        assert_eq!(gate.admission_smoke().root_id(), Some(1));
        assert!(gate.admission_smoke().root_retired());
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.root_handle_action().code())
                .collect::<Vec<_>>(),
            [
                "admit-root-handle",
                "validate-active-root-handle",
                "retire-root-handle"
            ]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.root_handle_current_generation())
                .collect::<Vec<_>>(),
            [1, 1, 2]
        );
        assert_eq!(
            validation_records
                .iter()
                .map(|record| record.kind().code())
                .collect::<Vec<_>>(),
            ["create", "render", "unmount"]
        );
        assert_eq!(
            admission_records[2].retired_root_source_error_code(),
            Some("FAST_REACT_NAPI_STALE_HANDLE")
        );
        assert_eq!(
            gate.batched_record_gate().status(),
            NATIVE_ROOT_BRIDGE_BATCHED_JSON_TRANSPORT_GATE_STATUS
        );
        assert_eq!(gate.batched_record_gate().request_count(), 3);
        assert_eq!(gate.batched_record_gate().lifecycle_rows().len(), 3);
        assert_eq!(gate.batched_record_gate().error_rows().len(), 5);
        assert!(!gate.batched_record_gate().native_addon_loaded());
        assert!(!gate.batched_record_gate().native_execution());
        assert!(!gate.batched_record_gate().renderer_execution());
        assert!(!gate.batched_record_gate().reconciler_execution());
        assert_eq!(gate.error_diagnostic_rows().len(), 4);
        assert!(gate.error_diagnostic_rows().iter().all(|row| {
            !row.native_addon_loaded()
                && !row.native_execution()
                && !row.renderer_execution()
                && !row.reconciler_execution()
                && !row.react_behavior_error()
        }));
    }

    #[test]
    fn native_root_bridge_json_transport_parser_gate_reports_deterministic_parse_errors() {
        let invalid_json = parse_native_root_bridge_json_transport_for_gate("{").unwrap_err();
        assert_eq!(
            invalid_json.code(),
            "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_JSON"
        );
        assert!(matches!(
            invalid_json,
            NativeRootBridgeJsonTransportParseError::InvalidJson { .. }
        ));
        assert_eq!(invalid_json.source_error_code(), None);

        let expected_object = parse_native_root_bridge_json_transport_for_gate("[]").unwrap_err();
        assert_eq!(
            expected_object,
            NativeRootBridgeJsonTransportParseError::ExpectedObject {
                path: "$".to_owned(),
                actual: NativeRootBridgeJsonTransportValueKind::Array
            }
        );
        assert_eq!(
            expected_object.code(),
            "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_EXPECTED_OBJECT"
        );

        let missing_field = parse_native_root_bridge_json_transport_for_gate(
            r#"{"transport":"json","schemaVersion":1}"#,
        )
        .unwrap_err();
        assert_eq!(
            missing_field,
            NativeRootBridgeJsonTransportParseError::MissingField {
                path: "$".to_owned(),
                field: "requestRecords"
            }
        );
        assert_eq!(
            missing_field.code(),
            "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_MISSING_FIELD"
        );

        let unexpected_field = parse_native_root_bridge_json_transport_for_gate(
            r#"{"transport":"json","schemaVersion":1,"requestRecords":[],"extra":true}"#,
        )
        .unwrap_err();
        assert_eq!(
            unexpected_field,
            NativeRootBridgeJsonTransportParseError::UnexpectedField {
                path: "$".to_owned(),
                field: "extra".to_owned()
            }
        );
        assert_eq!(
            unexpected_field.code(),
            "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNEXPECTED_FIELD"
        );

        let wrong_records_type = parse_native_root_bridge_json_transport_for_gate(
            r#"{"transport":"json","schemaVersion":1,"requestRecords":{}}"#,
        )
        .unwrap_err();
        assert_eq!(
            wrong_records_type,
            NativeRootBridgeJsonTransportParseError::InvalidFieldType {
                path: "$.requestRecords".to_owned(),
                expected: "array",
                actual: NativeRootBridgeJsonTransportValueKind::Object
            }
        );
        assert_eq!(
            wrong_records_type.code(),
            "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_FIELD_TYPE"
        );

        let wrong_transport = parse_native_root_bridge_json_transport_for_gate(
            r#"{"transport":"binary","schemaVersion":1,"requestRecords":[]}"#,
        )
        .unwrap_err();
        assert_eq!(
            wrong_transport,
            NativeRootBridgeJsonTransportParseError::UnsupportedFieldValue {
                path: "$.transport".to_owned(),
                expected: "json",
                actual: "binary".to_owned()
            }
        );
        assert_eq!(
            wrong_transport.code(),
            "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNSUPPORTED_FIELD_VALUE"
        );

        let unknown_kind =
            parse_native_root_bridge_json_transport_for_gate(
                r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"hydrate","environment_id":435,"root_handle":{"environment_id":435,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}"#,
            )
            .unwrap_err();
        assert_eq!(
            unknown_kind,
            NativeRootBridgeJsonTransportParseError::UnsupportedFieldValue {
                path: "$.requestRecords[0].kind".to_owned(),
                expected: "known code",
                actual: "hydrate".to_owned()
            }
        );
        assert_eq!(
            unknown_kind.code(),
            "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNSUPPORTED_FIELD_VALUE"
        );
        assert!(!unknown_kind.to_string().contains("React behavior"));
    }

    #[test]
    fn native_root_bridge_batched_json_transport_reports_per_record_lifecycle_rows() {
        let json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":495,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":495,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":3,"kind":"unmount","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"}]}"#;

        let gate = parse_native_root_bridge_json_transport_for_gate(json).unwrap();
        let batch_gate = gate.batched_record_gate();
        let rows = batch_gate.lifecycle_rows();

        assert_eq!(
            rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
            [
                "batch-record-0-create",
                "batch-record-1-render",
                "batch-record-2-unmount"
            ]
        );
        assert_eq!(
            rows.iter().map(|row| row.batch_index()).collect::<Vec<_>>(),
            [0, 1, 2]
        );
        assert_eq!(
            rows.iter().map(|row| row.request_id()).collect::<Vec<_>>(),
            [1, 2, 3]
        );
        assert_eq!(
            rows.iter().map(|row| row.kind()).collect::<Vec<_>>(),
            ["create", "render", "unmount"]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.lifecycle_before().code())
                .collect::<Vec<_>>(),
            ["none", "active", "active"]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.lifecycle_after().code())
                .collect::<Vec<_>>(),
            ["active", "active", "retired"]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row
                    .lifecycle_transition()
                    .map(|transition| transition.code()))
                .collect::<Vec<_>>(),
            [
                Some("none->active"),
                Some("active->active"),
                Some("active->retired")
            ]
        );
        assert!(rows.iter().all(|row| {
            row.status() == NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted
                && row.code().is_none()
                && row.source_error_code().is_none()
                && row.boundary_error_code().is_none()
                && !row.native_addon_loaded()
                && !row.native_execution()
                && !row.renderer_execution()
                && !row.reconciler_execution()
                && !row.react_behavior_error()
        }));

        let response_gate = batch_gate.response_sequence_gate();
        let response_rows = response_gate.rows();
        assert_eq!(
            response_gate.status(),
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_GATE_STATUS
        );
        assert_eq!(
            response_gate.batch_id(),
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID
        );
        assert_eq!(response_gate.request_count(), 3);
        assert_eq!(response_gate.response_count(), 3);
        assert_eq!(response_gate.error_row_count(), 5);
        assert!(!response_gate.native_addon_loaded());
        assert!(!response_gate.native_execution());
        assert!(!response_gate.renderer_execution());
        assert!(!response_gate.reconciler_execution());
        assert!(!response_gate.react_behavior_error());
        assert_eq!(
            response_rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
            [
                "batch-response-0-create",
                "batch-response-1-render",
                "batch-response-2-unmount"
            ]
        );
        assert_eq!(
            response_rows
                .iter()
                .map(|row| row.batch_id())
                .collect::<Vec<_>>(),
            [
                NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID,
                NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID,
                NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID
            ]
        );
        assert_eq!(
            response_rows
                .iter()
                .map(|row| row.request_order())
                .collect::<Vec<_>>(),
            [0, 1, 2]
        );
        assert_eq!(
            response_rows
                .iter()
                .map(|row| row.response_order())
                .collect::<Vec<_>>(),
            [0, 1, 2]
        );
        assert_eq!(
            response_rows
                .iter()
                .map(|row| row.request_id())
                .collect::<Vec<_>>(),
            [1, 2, 3]
        );
        assert_eq!(
            response_rows
                .iter()
                .map(|row| row.response_status().code())
                .collect::<Vec<_>>(),
            ["accepted", "accepted", "accepted"]
        );
        assert_eq!(
            response_rows
                .iter()
                .map(|row| row.error_row_status().code())
                .collect::<Vec<_>>(),
            ["not-error-row", "not-error-row", "not-error-row"]
        );
        assert_eq!(
            response_rows
                .iter()
                .map(|row| row.teardown_state().code())
                .collect::<Vec<_>>(),
            ["root-active", "root-active", "root-retired"]
        );
        assert!(response_rows.iter().all(|row| {
            row.code().is_none()
                && row.source_error_code().is_none()
                && row.boundary_error_code().is_none()
                && !row.native_addon_loaded()
                && !row.native_execution()
                && !row.renderer_execution()
                && !row.reconciler_execution()
                && !row.react_behavior_error()
        }));
    }

    #[test]
    fn native_root_bridge_batched_json_transport_reports_deterministic_lifecycle_error_rows() {
        let rows = native_root_bridge_batched_json_transport_error_rows();

        assert_eq!(rows.len(), 5);
        assert_eq!(
            rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
            [
                "batch-render-before-create-lifecycle-order",
                "batch-root-handle-state-mismatch",
                "batch-create-after-create-lifecycle-order",
                "batch-request-after-unmount-lifecycle-order",
                "batch-request-id-out-of-order"
            ]
        );
        assert_eq!(
            rows.iter().map(|row| row.batch_index()).collect::<Vec<_>>(),
            [0, 0, 1, 2, 1]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.lifecycle_before().code())
                .collect::<Vec<_>>(),
            ["none", "none", "active", "retired", "active"]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.lifecycle_after().code())
                .collect::<Vec<_>>(),
            ["none", "none", "active", "retired", "active"]
        );
        assert_eq!(
            rows.iter().map(|row| row.code()).collect::<Vec<_>>(),
            [
                Some("FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE"),
                Some("FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_STATE_MISMATCH"),
                Some("FAST_REACT_NAPI_ROOT_REQUEST_CREATE_AFTER_ROOT_CREATED"),
                Some("FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT"),
                Some("FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_OUT_OF_ORDER")
            ]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.source_error_code())
                .collect::<Vec<_>>(),
            [
                Some("FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE"),
                Some("FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_STATE_MISMATCH"),
                Some("FAST_REACT_NAPI_ROOT_REQUEST_CREATE_AFTER_ROOT_CREATED"),
                Some("FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT"),
                Some("FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_OUT_OF_ORDER")
            ]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.boundary_error_code())
                .collect::<Vec<_>>(),
            [
                Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"),
                Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"),
                Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"),
                Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"),
                Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER")
            ]
        );
        assert!(rows.iter().all(|row| {
            row.status() == NativeRootBridgeBatchedJsonTransportLifecycleStatus::Error
                && row.lifecycle_transition().is_none()
                && !row.native_addon_loaded()
                && !row.native_execution()
                && !row.renderer_execution()
                && !row.reconciler_execution()
                && !row.react_behavior_error()
        }));
        assert_eq!(
            NativeRootBridgeBatchedJsonTransportLifecycleState::None.code(),
            "none"
        );
        assert_eq!(
            NativeRootBridgeBatchedJsonTransportLifecycleStatus::Error.code(),
            "error"
        );
    }

    #[test]
    fn native_root_bridge_batch_response_sequence_reports_deterministic_error_rows() {
        let json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":552,"root_handle":{"environment_id":552,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":552,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":552,"root_handle":{"environment_id":552,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":552,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":3,"kind":"unmount","environment_id":552,"root_handle":{"environment_id":552,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"}]}"#;
        let gate = parse_native_root_bridge_json_transport_for_gate(json).unwrap();
        let response_gate = gate.batched_record_gate().response_sequence_gate();
        let rows = response_gate.error_rows();

        assert_eq!(rows.len(), 5);
        assert_eq!(
            rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
            [
                "batch-render-before-create-lifecycle-order",
                "batch-root-handle-state-mismatch",
                "batch-create-after-create-lifecycle-order",
                "batch-request-after-unmount-lifecycle-order",
                "batch-request-id-out-of-order"
            ]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.request_order())
                .collect::<Vec<_>>(),
            [0, 0, 1, 2, 1]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.response_order())
                .collect::<Vec<_>>(),
            [0, 1, 2, 3, 4]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.response_status().code())
                .collect::<Vec<_>>(),
            ["error", "error", "error", "error", "error"]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.error_row_status().code())
                .collect::<Vec<_>>(),
            [
                "deterministic-error-row",
                "deterministic-error-row",
                "deterministic-error-row",
                "deterministic-error-row",
                "deterministic-error-row"
            ]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.teardown_state().code())
                .collect::<Vec<_>>(),
            [
                "root-uninitialized",
                "root-uninitialized",
                "root-active",
                "root-retired",
                "root-active"
            ]
        );
        assert_eq!(
            rows.iter().map(|row| row.code()).collect::<Vec<_>>(),
            [
                Some("FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE"),
                Some("FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_STATE_MISMATCH"),
                Some("FAST_REACT_NAPI_ROOT_REQUEST_CREATE_AFTER_ROOT_CREATED"),
                Some("FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT"),
                Some("FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_OUT_OF_ORDER")
            ]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.boundary_error_code())
                .collect::<Vec<_>>(),
            [
                Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"),
                Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"),
                Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"),
                Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"),
                Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER")
            ]
        );
        assert!(rows.iter().all(|row| {
            row.batch_id() == NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID
                && row.source_error_code() == row.code()
                && !row.native_addon_loaded()
                && !row.native_execution()
                && !row.renderer_execution()
                && !row.reconciler_execution()
                && !row.react_behavior_error()
        }));
    }

    #[test]
    fn native_root_bridge_json_transport_stream_batch_roundtrip_reports_chunk_assembly() {
        let json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":587,"root_handle":{"environment_id":587,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":587,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":587,"root_handle":{"environment_id":587,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":587,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":3,"kind":"unmount","environment_id":587,"root_handle":{"environment_id":587,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"}]}"#;
        let gate = parse_native_root_bridge_json_transport_for_gate(json).unwrap();
        let stream_gate = gate
            .batched_record_gate()
            .response_sequence_gate()
            .stream_roundtrip_gate();
        let rows = stream_gate.rows();

        assert_eq!(
            stream_gate.status(),
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_GATE_STATUS
        );
        assert_eq!(
            stream_gate.batch_id(),
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID
        );
        assert_eq!(
            stream_gate.stream_id(),
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_STREAM_ID
        );
        assert_eq!(stream_gate.request_count(), 3);
        assert_eq!(stream_gate.chunk_count(), 6);
        assert_eq!(stream_gate.assembled_response_count(), 3);
        assert_eq!(stream_gate.error_row_count(), 4);
        assert!(!stream_gate.native_addon_loaded());
        assert!(!stream_gate.native_execution());
        assert!(!stream_gate.renderer_execution());
        assert!(!stream_gate.reconciler_execution());
        assert!(stream_gate.cross_environment_handle_reuse_blocked());
        assert!(!stream_gate.public_native_compatibility());
        assert!(!stream_gate.react_behavior_error());
        assert_eq!(
            rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
            [
                "stream-batch-chunk-0-request-1-metadata",
                "stream-batch-chunk-1-request-1-payload",
                "stream-batch-chunk-2-request-2-metadata",
                "stream-batch-chunk-3-request-2-payload",
                "stream-batch-chunk-4-request-3-metadata",
                "stream-batch-chunk-5-request-3-payload"
            ]
        );
        assert_eq!(
            rows.iter().map(|row| row.request_id()).collect::<Vec<_>>(),
            [1, 1, 2, 2, 3, 3]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.request_order())
                .collect::<Vec<_>>(),
            [0, 0, 1, 1, 2, 2]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.response_order())
                .collect::<Vec<_>>(),
            [0, 0, 1, 1, 2, 2]
        );
        assert_eq!(
            rows.iter().map(|row| row.chunk_order()).collect::<Vec<_>>(),
            [0, 1, 0, 1, 0, 1]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.batch_sequence())
                .collect::<Vec<_>>(),
            [0, 1, 2, 3, 4, 5]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.chunk_kind().code())
                .collect::<Vec<_>>(),
            [
                "metadata", "payload", "metadata", "payload", "metadata", "payload"
            ]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.chunk_status().code())
                .collect::<Vec<_>>(),
            [
                "accepted", "accepted", "accepted", "accepted", "accepted", "accepted"
            ]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.response_status().code())
                .collect::<Vec<_>>(),
            [
                "accepted", "accepted", "accepted", "accepted", "accepted", "accepted"
            ]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.assembly_state().code())
                .collect::<Vec<_>>(),
            [
                "partial",
                "assembled",
                "partial",
                "assembled",
                "partial",
                "assembled"
            ]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.assembled_response())
                .collect::<Vec<_>>(),
            [false, true, false, true, false, true]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.teardown_state().code())
                .collect::<Vec<_>>(),
            [
                "root-active",
                "root-active",
                "root-active",
                "root-active",
                "root-active",
                "root-retired"
            ]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.teardown_blocker().code())
                .collect::<Vec<_>>(),
            [
                "none",
                "none",
                "none",
                "none",
                "none",
                "root-retired-after-assembly"
            ]
        );
        assert!(rows.iter().all(|row| {
            row.batch_id() == NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID
                && row.stream_id()
                    == NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_STREAM_ID
                && row.code().is_none()
                && row.source_error_code().is_none()
                && row.boundary_error_code().is_none()
                && !row.native_addon_loaded()
                && !row.native_execution()
                && !row.renderer_execution()
                && !row.reconciler_execution()
                && row.cross_environment_handle_reuse_blocked()
                && !row.public_native_compatibility()
                && !row.react_behavior_error()
        }));
    }

    #[test]
    fn native_root_bridge_json_transport_stream_batch_roundtrip_rejects_bad_chunks() {
        let json = r#"{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":587,"root_handle":{"environment_id":587,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":587,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":587,"root_handle":{"environment_id":587,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":587,"slot":3,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":3,"kind":"unmount","environment_id":587,"root_handle":{"environment_id":587,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"}]}"#;
        let gate = parse_native_root_bridge_json_transport_for_gate(json).unwrap();
        let rows = gate
            .batched_record_gate()
            .response_sequence_gate()
            .stream_roundtrip_gate()
            .error_rows();

        assert_eq!(
            rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
            [
                "stream-chunk-out-of-order",
                "stream-chunk-duplicate",
                "stream-chunk-missing",
                "stream-chunk-after-teardown"
            ]
        );
        assert_eq!(
            rows.iter().map(|row| row.request_id()).collect::<Vec<_>>(),
            [1, 1, 1, 4]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.response_order())
                .collect::<Vec<_>>(),
            [0, 0, 0, 3]
        );
        assert_eq!(
            rows.iter().map(|row| row.chunk_order()).collect::<Vec<_>>(),
            [1, 0, 1, 0]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.batch_sequence())
                .collect::<Vec<_>>(),
            [0, 1, 1, 6]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.chunk_kind().code())
                .collect::<Vec<_>>(),
            ["payload", "metadata", "payload", "metadata"]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.chunk_status().code())
                .collect::<Vec<_>>(),
            ["error", "error", "error", "error"]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.assembly_state().code())
                .collect::<Vec<_>>(),
            ["rejected", "rejected", "rejected", "rejected"]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.assembled_response())
                .collect::<Vec<_>>(),
            [false, false, false, false]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.teardown_blocker().code())
                .collect::<Vec<_>>(),
            ["none", "none", "none", "post-teardown-chunk-blocked"]
        );
        assert_eq!(
            rows.iter().map(|row| row.code()).collect::<Vec<_>>(),
            [
                Some(NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_OUT_OF_ORDER_CHUNK_CODE),
                Some(NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_DUPLICATE_CHUNK_CODE),
                Some(NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_MISSING_CHUNK_CODE),
                Some(NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_POST_TEARDOWN_CHUNK_CODE)
            ]
        );
        assert!(rows.iter().all(|row| {
            row.source_error_code() == row.code()
                && row.boundary_error_code()
                    == Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER")
                && !row.native_addon_loaded()
                && !row.native_execution()
                && !row.renderer_execution()
                && !row.reconciler_execution()
                && row.cross_environment_handle_reuse_blocked()
                && !row.public_native_compatibility()
                && !row.react_behavior_error()
        }));
    }

    #[test]
    fn native_root_bridge_json_transport_parser_gate_reports_error_diagnostic_rows() {
        let rows = native_root_bridge_json_transport_error_diagnostic_rows();

        assert_eq!(rows.len(), 4);
        assert_eq!(
            rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
            [
                "malformed-payload",
                "wrong-environment-root-handle",
                "stale-value-handle-generation",
                "render-before-create-lifecycle-order"
            ]
        );
        assert_eq!(
            rows.iter().map(|row| row.category()).collect::<Vec<_>>(),
            [
                "malformed-payload",
                "wrong-environment",
                "stale-handle",
                "lifecycle-order"
            ]
        );
        assert_eq!(
            rows.iter().map(|row| row.phase()).collect::<Vec<_>>(),
            ["parse", "validation", "validation", "validation"]
        );
        assert_eq!(
            rows.iter().map(|row| row.code()).collect::<Vec<_>>(),
            [
                "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_JSON",
                "FAST_REACT_NAPI_WRONG_ENVIRONMENT",
                "FAST_REACT_NAPI_STALE_HANDLE",
                "FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE"
            ]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.source_error_code())
                .collect::<Vec<_>>(),
            [
                None,
                Some("FAST_REACT_NAPI_WRONG_ENVIRONMENT"),
                Some("FAST_REACT_NAPI_STALE_HANDLE"),
                Some("FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE")
            ]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.boundary_error_code())
                .collect::<Vec<_>>(),
            [
                None,
                Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_ENVIRONMENT"),
                Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
                Some("FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER")
            ]
        );
        for row in rows {
            assert!(!row.native_addon_loaded());
            assert!(!row.native_execution());
            assert!(!row.renderer_execution());
            assert!(!row.reconciler_execution());
            assert!(!row.react_behavior_error());
        }
    }

    #[test]
    fn native_root_bridge_cross_environment_teardown_gate_reports_inert_rows() {
        fn row<'a>(
            rows: &'a [crate::handle_table::BridgeHandleTableTeardownIsolationDiagnosticRow],
            id: &str,
        ) -> &'a crate::handle_table::BridgeHandleTableTeardownIsolationDiagnosticRow {
            rows.iter()
                .find(|row| row.id() == id)
                .expect("diagnostic row exists")
        }

        let gate = native_root_bridge_cross_environment_teardown_gate();
        let diagnostics = gate.handle_table_diagnostics();
        let rows = diagnostics.rows();

        assert_eq!(
            gate.status(),
            NATIVE_ROOT_BRIDGE_CROSS_ENVIRONMENT_TEARDOWN_GATE_STATUS
        );
        assert_eq!(
            gate.handle_table_model(),
            NATIVE_ROOT_BRIDGE_HANDLE_TABLE_MODEL
        );
        assert!(!gate.native_addon_loaded());
        assert!(!gate.native_execution());
        assert!(!gate.renderer_execution());
        assert!(!gate.reconciler_execution());
        assert!(!gate.react_behavior_error());
        assert!(!diagnostics.mismatched_teardown().environment_matched());
        assert_eq!(
            diagnostics
                .mismatched_teardown()
                .total_handles_invalidated(),
            0
        );
        assert!(diagnostics.matched_teardown().environment_matched());
        assert_eq!(diagnostics.matched_teardown().root_handles_invalidated(), 1);
        assert_eq!(
            diagnostics.matched_teardown().value_handles_invalidated(),
            1
        );
        assert_eq!(rows.len(), 12);
        assert_eq!(
            rows.iter()
                .filter(|row| row.error_code() == Some("FAST_REACT_NAPI_STALE_HANDLE"))
                .count(),
            4
        );
        assert_eq!(
            rows.iter()
                .filter(|row| row.error_code() == Some("FAST_REACT_NAPI_WRONG_ENVIRONMENT"))
                .count(),
            2
        );
        assert_eq!(
            rows.iter()
                .filter(|row| !row.rejected_by_handle_table())
                .count(),
            6
        );

        let first_root = row(rows, "first-root-stale-after-own-teardown");
        let first_value = row(rows, "first-value-stale-after-own-teardown");
        assert_eq!(first_root.handle_kind(), BridgeHandleKind::Root);
        assert_eq!(first_root.current_generation(), Some(2));
        assert_eq!(first_value.handle_kind(), BridgeHandleKind::Value);
        assert_eq!(first_value.current_generation(), Some(2));
        assert_eq!(
            first_root.table_environment_id(),
            BridgeEnvironmentId::from_raw(496)
        );
        assert_eq!(
            first_value.table_environment_id(),
            BridgeEnvironmentId::from_raw(496)
        );

        let peer_root = row(rows, "peer-root-active-after-first-teardown");
        let replacement_root = row(rows, "replacement-root-active-after-slot-reuse");
        assert_eq!(peer_root.record_id(), Some(149601));
        assert_eq!(peer_root.current_generation(), Some(1));
        assert_eq!(
            peer_root.handle_environment_id(),
            BridgeEnvironmentId::from_raw(1496)
        );
        assert_eq!(replacement_root.record_id(), Some(49603));
        assert_eq!(replacement_root.current_generation(), Some(2));
        assert_eq!(
            replacement_root.handle_environment_id(),
            BridgeEnvironmentId::from_raw(496)
        );
    }

    #[test]
    fn native_root_bridge_transport_worker_thread_teardown_reports_inert_rows() {
        fn row<'a>(
            rows: &'a [crate::root_bridge_requests::NativeRootBridgeTransportWorkerThreadTeardownRow],
            id: &str,
        ) -> &'a crate::root_bridge_requests::NativeRootBridgeTransportWorkerThreadTeardownRow
        {
            rows.iter()
                .find(|row| row.id() == id)
                .expect("worker-thread teardown row exists")
        }

        let gate = native_root_bridge_transport_worker_thread_teardown_gate();
        let rows = gate.rows();
        let batch_gate = gate.batched_record_gate();
        let cross_environment_gate = gate.cross_environment_teardown_gate();

        assert_eq!(
            gate.status(),
            NATIVE_ROOT_BRIDGE_TRANSPORT_WORKER_THREAD_TEARDOWN_GATE_STATUS
        );
        assert_eq!(gate.transport(), NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_FORMAT);
        assert_eq!(gate.worker_thread_id(), 524);
        assert_eq!(
            gate.worker_environment_id(),
            BridgeEnvironmentId::from_raw(524)
        );
        assert_eq!(
            gate.peer_environment_id(),
            BridgeEnvironmentId::from_raw(1524)
        );
        assert!(!gate.native_addon_loaded());
        assert!(!gate.native_execution());
        assert!(!gate.renderer_execution());
        assert!(!gate.reconciler_execution());
        assert!(!gate.react_behavior_error());

        assert_eq!(
            batch_gate.status(),
            NATIVE_ROOT_BRIDGE_BATCHED_JSON_TRANSPORT_GATE_STATUS
        );
        assert_eq!(batch_gate.request_count(), 2);
        assert_eq!(
            batch_gate
                .lifecycle_rows()
                .iter()
                .map(|row| row.id())
                .collect::<Vec<_>>(),
            ["batch-record-0-create", "batch-record-1-render"]
        );
        assert!(batch_gate.lifecycle_rows().iter().all(|row| {
            row.status() == NativeRootBridgeBatchedJsonTransportLifecycleStatus::Accepted
                && !row.native_addon_loaded()
                && !row.native_execution()
                && !row.renderer_execution()
                && !row.reconciler_execution()
                && !row.react_behavior_error()
        }));

        assert!(
            !gate.mismatched_teardown().environment_matched(),
            "worker teardown must not affect the peer table"
        );
        assert_eq!(gate.mismatched_teardown().total_handles_invalidated(), 0);
        assert!(gate.matched_teardown().environment_matched());
        assert_eq!(gate.matched_teardown().root_handles_invalidated(), 1);
        assert_eq!(gate.matched_teardown().value_handles_invalidated(), 2);
        assert_eq!(
            cross_environment_gate.status(),
            NATIVE_ROOT_BRIDGE_CROSS_ENVIRONMENT_TEARDOWN_GATE_STATUS
        );
        assert_eq!(
            cross_environment_gate
                .handle_table_diagnostics()
                .rows()
                .len(),
            12
        );
        assert_eq!(
            cross_environment_gate
                .handle_table_diagnostics()
                .matched_teardown()
                .root_handles_invalidated(),
            1
        );
        assert_eq!(
            cross_environment_gate
                .handle_table_diagnostics()
                .matched_teardown()
                .value_handles_invalidated(),
            1
        );

        assert_eq!(rows.len(), 4);
        assert_eq!(
            rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
            [
                "worker-root-stale-after-thread-teardown",
                "worker-create-value-stale-after-thread-teardown",
                "worker-render-value-stale-after-thread-teardown",
                "peer-root-active-after-worker-thread-teardown"
            ]
        );
        assert_eq!(
            rows.iter().map(|row| row.transport()).collect::<Vec<_>>(),
            ["json", "json", "json", "json"]
        );
        assert_eq!(
            rows.iter()
                .map(|row| row.worker_thread_id())
                .collect::<Vec<_>>(),
            [524, 524, 524, 524]
        );

        let worker_root = row(rows, "worker-root-stale-after-thread-teardown");
        let create_value = row(rows, "worker-create-value-stale-after-thread-teardown");
        let render_value = row(rows, "worker-render-value-stale-after-thread-teardown");
        let peer_root = row(rows, "peer-root-active-after-worker-thread-teardown");

        assert_eq!(worker_root.operation(), "worker-thread-teardown");
        assert_eq!(worker_root.source_batch_index(), Some(0));
        assert_eq!(worker_root.request_id(), Some(1));
        assert_eq!(worker_root.handle_kind(), BridgeHandleKind::Root);
        assert_eq!(
            worker_root.table_environment_id(),
            BridgeEnvironmentId::from_raw(524)
        );
        assert_eq!(
            worker_root.handle_environment_id(),
            BridgeEnvironmentId::from_raw(524)
        );
        assert_eq!(worker_root.slot(), 1);
        assert_eq!(worker_root.handle_generation(), 1);
        assert_eq!(worker_root.current_generation(), Some(2));
        assert_eq!(worker_root.record_id(), None);
        assert_eq!(
            worker_root.error_code(),
            Some("FAST_REACT_NAPI_STALE_HANDLE")
        );
        assert_eq!(
            worker_root.boundary_error_code(),
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE")
        );

        assert_eq!(create_value.source_batch_index(), Some(0));
        assert_eq!(create_value.request_id(), Some(1));
        assert_eq!(create_value.handle_kind(), BridgeHandleKind::Value);
        assert_eq!(create_value.slot(), 2);
        assert_eq!(create_value.current_generation(), Some(2));
        assert_eq!(
            create_value.error_code(),
            Some("FAST_REACT_NAPI_STALE_HANDLE")
        );
        assert_eq!(render_value.source_batch_index(), Some(1));
        assert_eq!(render_value.request_id(), Some(2));
        assert_eq!(render_value.handle_kind(), BridgeHandleKind::Value);
        assert_eq!(render_value.slot(), 3);
        assert_eq!(render_value.current_generation(), Some(2));
        assert_eq!(
            render_value.boundary_error_code(),
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE")
        );

        assert_eq!(peer_root.operation(), "peer-environment-isolation");
        assert_eq!(peer_root.source_batch_index(), None);
        assert_eq!(peer_root.request_id(), None);
        assert_eq!(peer_root.handle_kind(), BridgeHandleKind::Root);
        assert_eq!(
            peer_root.table_environment_id(),
            BridgeEnvironmentId::from_raw(1524)
        );
        assert_eq!(
            peer_root.handle_environment_id(),
            BridgeEnvironmentId::from_raw(1524)
        );
        assert_eq!(peer_root.current_generation(), Some(1));
        assert_eq!(peer_root.record_id(), Some(152401));
        assert_eq!(peer_root.error_code(), None);
        assert_eq!(peer_root.boundary_error_code(), None);

        for row in rows {
            assert!(!row.native_addon_loaded());
            assert!(!row.native_execution());
            assert!(!row.renderer_execution());
            assert!(!row.reconciler_execution());
            assert!(!row.react_behavior_error());
        }
    }

    #[test]
    fn native_root_bridge_worker_thread_teardown_executable_preflight_rejects_stale_handles() {
        fn row<'a>(
            rows: &'a [crate::root_bridge_requests::NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow],
            id: &str,
        ) -> &'a crate::root_bridge_requests::NativeRootBridgeWorkerThreadTeardownExecutablePreflightRow
        {
            rows.iter()
                .find(|row| row.id() == id)
                .expect("worker-thread teardown preflight row exists")
        }

        let preflight = native_root_bridge_worker_thread_teardown_executable_preflight();
        let rows = preflight.rows();

        assert_eq!(
            preflight.status(),
            NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS
        );
        assert_eq!(
            preflight.model(),
            "fast-react-napi.WorkerThreadTeardownPreflight"
        );
        assert_eq!(
            preflight.execution_scope(),
            "rust-only-handle-table-preflight-no-node-worker-thread-no-napi-cleanup-hook"
        );
        assert_eq!(
            preflight.transport(),
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_FORMAT
        );
        assert_eq!(preflight.worker_thread_id(), 764);
        assert_eq!(
            preflight.worker_environment_id(),
            BridgeEnvironmentId::from_raw(764)
        );
        assert_eq!(
            preflight.peer_environment_id(),
            BridgeEnvironmentId::from_raw(1764)
        );
        assert_eq!(
            preflight.transport_worker_thread_teardown_gate_status(),
            NATIVE_ROOT_BRIDGE_TRANSPORT_WORKER_THREAD_TEARDOWN_GATE_STATUS
        );
        assert_eq!(
            preflight.batched_record_gate_status(),
            NATIVE_ROOT_BRIDGE_BATCHED_JSON_TRANSPORT_GATE_STATUS
        );
        assert_eq!(
            preflight.cross_environment_teardown_gate_status(),
            NATIVE_ROOT_BRIDGE_CROSS_ENVIRONMENT_TEARDOWN_GATE_STATUS
        );
        assert_eq!(preflight.accepted_batch_record_count(), 2);
        assert_eq!(preflight.cross_environment_teardown_row_count(), 12);
        assert!(preflight.preflight_evaluated());
        assert!(preflight.root_validator_state_preserved());
        assert!(!preflight.node_worker_threads_execution());
        assert!(!preflight.napi_cleanup_hook_execution());
        assert!(!preflight.native_addon_loaded());
        assert!(!preflight.native_execution());
        assert!(!preflight.renderer_execution());
        assert!(!preflight.reconciler_execution());
        assert!(!preflight.public_native_compatibility());
        assert!(!preflight.react_behavior_error());

        assert!(
            !preflight.mismatched_teardown().environment_matched(),
            "worker teardown must not invalidate peer handles"
        );
        assert_eq!(
            preflight.mismatched_teardown().requested_environment_id(),
            BridgeEnvironmentId::from_raw(764)
        );
        assert_eq!(
            preflight.mismatched_teardown().table_environment_id(),
            BridgeEnvironmentId::from_raw(1764)
        );
        assert_eq!(
            preflight.mismatched_teardown().total_handles_invalidated(),
            0
        );
        assert!(preflight.matched_teardown().environment_matched());
        assert_eq!(
            preflight.matched_teardown().requested_environment_id(),
            BridgeEnvironmentId::from_raw(764)
        );
        assert_eq!(
            preflight.matched_teardown().table_environment_id(),
            BridgeEnvironmentId::from_raw(764)
        );
        assert_eq!(preflight.matched_teardown().root_handles_invalidated(), 1);
        assert_eq!(preflight.matched_teardown().value_handles_invalidated(), 2);
        assert_eq!(preflight.stale_worker_handle_rejection_count(), 3);
        assert_eq!(preflight.active_peer_handle_count(), 2);

        assert_eq!(rows.len(), 5);
        assert_eq!(
            rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
            [
                "worker-render-root-stale-executable-preflight",
                "worker-create-value-stale-executable-preflight",
                "worker-render-value-stale-executable-preflight",
                "peer-root-active-executable-preflight",
                "peer-value-active-executable-preflight"
            ]
        );
        assert!(rows.iter().all(|row| row.preflight_passed()));
        assert_eq!(
            rows.iter()
                .filter(|row| row.rejected_by_boundary())
                .map(|row| row.source_error_code())
                .collect::<Vec<_>>(),
            [
                Some("FAST_REACT_NAPI_STALE_HANDLE"),
                Some("FAST_REACT_NAPI_STALE_HANDLE"),
                Some("FAST_REACT_NAPI_STALE_HANDLE")
            ]
        );
        assert_eq!(
            rows.iter()
                .filter(|row| row.rejected_by_boundary())
                .map(|row| row.boundary_error_code())
                .collect::<Vec<_>>(),
            [
                Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
                Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
                Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE")
            ]
        );
        assert_eq!(
            rows.iter()
                .filter(|row| row.peer_invariant_preserved())
                .map(|row| row.record_id())
                .collect::<Vec<_>>(),
            [Some(176401), Some(176402)]
        );

        let stale_root = row(rows, "worker-render-root-stale-executable-preflight");
        assert_eq!(
            stale_root.operation(),
            "post-teardown-render-boundary-validation"
        );
        assert_eq!(
            stale_root.assertion(),
            "stale-worker-root-rejected-without-mutating-validator"
        );
        assert_eq!(stale_root.worker_thread_id(), 764);
        assert_eq!(stale_root.handle_kind(), BridgeHandleKind::Root);
        assert_eq!(
            stale_root.table_environment_id(),
            BridgeEnvironmentId::from_raw(764)
        );
        assert_eq!(
            stale_root.handle_environment_id(),
            BridgeEnvironmentId::from_raw(764)
        );
        assert_eq!(stale_root.slot(), 1);
        assert_eq!(stale_root.handle_generation(), 1);
        assert_eq!(stale_root.current_generation(), Some(2));
        assert_eq!(stale_root.record_id(), None);
        assert!(stale_root.rejected_by_boundary());
        assert!(!stale_root.peer_invariant_preserved());

        let create_value = row(rows, "worker-create-value-stale-executable-preflight");
        let render_value = row(rows, "worker-render-value-stale-executable-preflight");
        assert_eq!(create_value.handle_kind(), BridgeHandleKind::Value);
        assert_eq!(create_value.slot(), 2);
        assert_eq!(create_value.current_generation(), Some(2));
        assert_eq!(render_value.handle_kind(), BridgeHandleKind::Value);
        assert_eq!(render_value.slot(), 3);
        assert_eq!(render_value.current_generation(), Some(2));

        let peer_root = row(rows, "peer-root-active-executable-preflight");
        let peer_value = row(rows, "peer-value-active-executable-preflight");
        assert_eq!(peer_root.operation(), "post-teardown-peer-root-validation");
        assert_eq!(peer_root.handle_kind(), BridgeHandleKind::Root);
        assert_eq!(
            peer_root.table_environment_id(),
            BridgeEnvironmentId::from_raw(1764)
        );
        assert_eq!(peer_root.current_generation(), Some(1));
        assert_eq!(peer_root.record_id(), Some(176401));
        assert_eq!(peer_root.source_error_code(), None);
        assert_eq!(peer_root.boundary_error_code(), None);
        assert!(!peer_root.rejected_by_boundary());
        assert!(peer_root.peer_invariant_preserved());

        assert_eq!(
            peer_value.operation(),
            "post-teardown-peer-value-validation"
        );
        assert_eq!(peer_value.handle_kind(), BridgeHandleKind::Value);
        assert_eq!(
            peer_value.table_environment_id(),
            BridgeEnvironmentId::from_raw(1764)
        );
        assert_eq!(peer_value.current_generation(), Some(1));
        assert_eq!(peer_value.record_id(), Some(176402));
        assert_eq!(peer_value.source_error_code(), None);
        assert_eq!(peer_value.boundary_error_code(), None);
        assert!(!peer_value.rejected_by_boundary());
        assert!(peer_value.peer_invariant_preserved());

        for row in rows {
            assert!(!row.node_worker_threads_execution());
            assert!(!row.napi_cleanup_hook_execution());
            assert!(!row.native_addon_loaded());
            assert!(!row.native_execution());
            assert!(!row.renderer_execution());
            assert!(!row.reconciler_execution());
            assert!(!row.public_native_compatibility());
            assert!(!row.react_behavior_error());
        }
    }

    #[test]
    fn native_root_bridge_worker_thread_cleanup_hook_preflight_records_private_order_identity() {
        fn row<'a>(
            rows: &'a [crate::root_bridge_requests::NativeRootBridgeWorkerThreadCleanupHookPreflightRow],
            id: &str,
        ) -> &'a crate::root_bridge_requests::NativeRootBridgeWorkerThreadCleanupHookPreflightRow
        {
            rows.iter()
                .find(|row| row.id() == id)
                .expect("cleanup-hook preflight row exists")
        }

        let preflight = native_root_bridge_worker_thread_cleanup_hook_preflight();
        let rows = preflight.rows();

        assert_eq!(
            preflight.status(),
            NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PREFLIGHT_STATUS
        );
        assert_eq!(
            preflight.model(),
            "fast-react-napi.WorkerThreadCleanupHookOrderPreflight"
        );
        assert_eq!(
            preflight.execution_scope(),
            "rust-only-cleanup-hook-order-preflight-no-node-worker-thread-no-napi-cleanup-hook-execution"
        );
        assert_eq!(
            preflight.source_executable_preflight_status(),
            NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS
        );
        assert_eq!(preflight.worker_thread_id(), 764);
        assert_eq!(
            preflight.worker_environment_id(),
            BridgeEnvironmentId::from_raw(764)
        );
        assert_eq!(
            preflight.peer_environment_id(),
            BridgeEnvironmentId::from_raw(1764)
        );
        assert!(preflight.canonical_executable_evidence_required());
        assert!(preflight.canonical_executable_evidence_accepted());
        assert_eq!(preflight.cleanup_hook_registration_count(), 2);
        assert_eq!(
            preflight.cleanup_hook_execution_order(),
            "reverse-registration-order"
        );
        assert_eq!(preflight.accepted_cleanup_evidence_count(), 2);
        assert_eq!(preflight.rejected_cleanup_evidence_count(), 2);
        assert_eq!(
            preflight.stale_or_forged_cleanup_evidence_rejection_count(),
            2
        );
        assert!(preflight.cleanup_hook_order_private());
        assert!(preflight.cleanup_hook_identity_private());

        assert_eq!(rows.len(), 4);
        assert_eq!(
            rows.iter().map(|row| row.id()).collect::<Vec<_>>(),
            [
                "cleanup-hook-worker-root-before-value-release",
                "cleanup-hook-worker-value-after-root-release",
                "cleanup-hook-stale-worker-transport-evidence-rejected",
                "cleanup-hook-forged-peer-active-evidence-rejected"
            ]
        );

        let root_cleanup = row(rows, "cleanup-hook-worker-root-before-value-release");
        let value_cleanup = row(rows, "cleanup-hook-worker-value-after-root-release");

        assert_eq!(
            root_cleanup.status(),
            NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Accepted
        );
        assert_eq!(
            root_cleanup.status().code(),
            NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Accepted.code()
        );
        assert_eq!(root_cleanup.operation(), "cleanup-hook-order-preflight");
        assert_eq!(
            root_cleanup.cleanup_hook_id(),
            "worker-root-handle-cleanup-hook"
        );
        assert_eq!(
            root_cleanup.cleanup_hook_function_identity_token(),
            "private-cleanup-hook-fn:worker-root-handle-teardown"
        );
        assert_eq!(
            root_cleanup.cleanup_hook_argument_identity_token(),
            "private-cleanup-hook-arg:worker-764-root-slot-1"
        );
        assert_eq!(root_cleanup.registration_order(), 2);
        assert_eq!(root_cleanup.expected_execution_order(), 1);
        assert_eq!(root_cleanup.observed_execution_order(), Some(1));
        assert_eq!(
            root_cleanup.source_preflight_status(),
            NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS
        );
        assert_eq!(root_cleanup.source_worker_thread_id(), 764);
        assert_eq!(
            root_cleanup.source_environment_id(),
            BridgeEnvironmentId::from_raw(764)
        );
        assert_eq!(
            root_cleanup.source_row_id(),
            "worker-render-root-stale-executable-preflight"
        );
        assert_eq!(root_cleanup.source_handle_kind(), BridgeHandleKind::Root);
        assert_eq!(
            root_cleanup.source_error_code(),
            Some("FAST_REACT_NAPI_STALE_HANDLE")
        );
        assert_eq!(
            root_cleanup.source_boundary_error_code(),
            Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE")
        );
        assert!(root_cleanup.canonical_executable_evidence());
        assert!(root_cleanup.cleanup_hook_order_private());
        assert!(root_cleanup.cleanup_hook_identity_private());
        assert!(!root_cleanup.stale_or_forged_cleanup_evidence_rejected());

        assert_eq!(
            value_cleanup.status(),
            NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Accepted
        );
        assert_eq!(
            value_cleanup.cleanup_hook_id(),
            "worker-value-handle-cleanup-hook"
        );
        assert_eq!(
            value_cleanup.cleanup_hook_function_identity_token(),
            "private-cleanup-hook-fn:worker-value-handle-teardown"
        );
        assert_eq!(
            value_cleanup.cleanup_hook_argument_identity_token(),
            "private-cleanup-hook-arg:worker-764-value-slot-3"
        );
        assert_eq!(value_cleanup.registration_order(), 1);
        assert_eq!(value_cleanup.expected_execution_order(), 2);
        assert_eq!(value_cleanup.observed_execution_order(), Some(2));
        assert_eq!(
            value_cleanup.source_row_id(),
            "worker-render-value-stale-executable-preflight"
        );
        assert_eq!(value_cleanup.source_handle_kind(), BridgeHandleKind::Value);
        assert!(value_cleanup.canonical_executable_evidence());
        assert!(value_cleanup.cleanup_hook_order_private());
        assert!(value_cleanup.cleanup_hook_identity_private());
    }

    #[test]
    fn native_root_bridge_worker_thread_cleanup_hook_preflight_keeps_public_native_blockers_false()
    {
        let preflight = native_root_bridge_worker_thread_cleanup_hook_preflight();

        assert!(!preflight.node_worker_threads_execution());
        assert!(!preflight.napi_cleanup_hook_execution());
        assert!(!preflight.native_addon_loaded());
        assert!(!preflight.native_execution());
        assert!(!preflight.renderer_execution());
        assert!(!preflight.reconciler_execution());
        assert!(!preflight.public_native_compatibility());
        assert!(!preflight.react_behavior_error());

        for row in preflight.rows() {
            assert!(!row.node_worker_threads_execution());
            assert!(!row.napi_cleanup_hook_execution());
            assert!(!row.native_addon_loaded());
            assert!(!row.native_execution());
            assert!(!row.renderer_execution());
            assert!(!row.reconciler_execution());
            assert!(!row.public_native_compatibility());
            assert!(!row.react_behavior_error());
        }
    }

    #[test]
    fn native_root_bridge_worker_thread_cleanup_hook_preflight_rejects_stale_and_forged_evidence() {
        fn row<'a>(
            rows: &'a [crate::root_bridge_requests::NativeRootBridgeWorkerThreadCleanupHookPreflightRow],
            id: &str,
        ) -> &'a crate::root_bridge_requests::NativeRootBridgeWorkerThreadCleanupHookPreflightRow
        {
            rows.iter()
                .find(|row| row.id() == id)
                .expect("cleanup-hook rejection row exists")
        }

        let executable_preflight = native_root_bridge_worker_thread_teardown_executable_preflight();
        let cleanup_preflight = native_root_bridge_worker_thread_cleanup_hook_preflight();
        let rows = cleanup_preflight.rows();

        let stale = row(
            rows,
            "cleanup-hook-stale-worker-transport-evidence-rejected",
        );
        assert_eq!(
            stale.status(),
            NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Rejected
        );
        assert_eq!(
            stale.status().code(),
            NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Rejected.code()
        );
        assert_eq!(
            stale.code(),
            Some("FAST_REACT_NAPI_CLEANUP_HOOK_STALE_EXECUTABLE_PREFLIGHT")
        );
        assert_eq!(
            stale.source_preflight_status(),
            NATIVE_ROOT_BRIDGE_TRANSPORT_WORKER_THREAD_TEARDOWN_GATE_STATUS
        );
        assert_eq!(stale.source_worker_thread_id(), 524);
        assert_eq!(
            stale.source_environment_id(),
            BridgeEnvironmentId::from_raw(524)
        );
        assert_eq!(
            stale.source_row_id(),
            "worker-root-stale-after-thread-teardown"
        );
        assert!(!stale.canonical_executable_evidence());
        assert!(stale.stale_or_forged_cleanup_evidence_rejected());
        assert_eq!(stale.observed_execution_order(), None);

        let forged = row(rows, "cleanup-hook-forged-peer-active-evidence-rejected");
        assert_eq!(
            forged.status(),
            NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Rejected
        );
        assert_eq!(
            forged.code(),
            Some("FAST_REACT_NAPI_CLEANUP_HOOK_FORGED_EVIDENCE")
        );
        assert_eq!(
            forged.source_preflight_status(),
            NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS
        );
        assert_eq!(forged.source_worker_thread_id(), 764);
        assert_eq!(
            forged.source_environment_id(),
            BridgeEnvironmentId::from_raw(764)
        );
        assert_eq!(
            forged.source_row_id(),
            "peer-root-active-executable-preflight"
        );
        assert_eq!(forged.source_error_code(), None);
        assert_eq!(forged.source_boundary_error_code(), None);
        assert!(!forged.canonical_executable_evidence());
        assert!(forged.stale_or_forged_cleanup_evidence_rejected());

        let wrong_order =
            validate_native_root_bridge_worker_thread_cleanup_hook_evidence_for_preflight(
                &executable_preflight,
                NativeRootBridgeWorkerThreadCleanupHookEvidence::new(
                    "cleanup-hook-wrong-order-rejected",
                    "cleanup-hook-evidence-preflight-rejection",
                    "worker-root-handle-cleanup-hook",
                    "private-cleanup-hook-fn:worker-root-handle-teardown",
                    "private-cleanup-hook-arg:worker-764-root-slot-1",
                    2,
                    2,
                    executable_preflight.status(),
                    executable_preflight.worker_thread_id(),
                    executable_preflight.worker_environment_id(),
                    "worker-render-root-stale-executable-preflight",
                    BridgeHandleKind::Root,
                    Some("FAST_REACT_NAPI_STALE_HANDLE"),
                    Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
                ),
            );
        assert_eq!(
            wrong_order.status(),
            NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Rejected
        );
        assert_eq!(
            wrong_order.code(),
            Some("FAST_REACT_NAPI_CLEANUP_HOOK_ORDER_MISMATCH")
        );
        assert!(!wrong_order.canonical_executable_evidence());
        assert!(!wrong_order.stale_or_forged_cleanup_evidence_rejected());
        assert_eq!(wrong_order.observed_execution_order(), None);
    }

    #[test]
    fn native_root_bridge_worker_thread_cleanup_hook_preflight_rejects_identity_tampering() {
        #[derive(Clone, Copy)]
        struct CleanupHookIdentityTamperCase {
            id: &'static str,
            cleanup_hook_id: &'static str,
            cleanup_hook_function_identity_token: &'static str,
            cleanup_hook_argument_identity_token: &'static str,
            registration_order: u8,
            expected_execution_order: u8,
            source_row_id: &'static str,
            source_handle_kind: BridgeHandleKind,
        }

        let executable_preflight = native_root_bridge_worker_thread_teardown_executable_preflight();
        let cases = [
            CleanupHookIdentityTamperCase {
                id: "cleanup-hook-root-id-tamper-rejected",
                cleanup_hook_id: "arbitrary-root-cleanup-hook",
                cleanup_hook_function_identity_token: "private-cleanup-hook-fn:worker-root-handle-teardown",
                cleanup_hook_argument_identity_token: "private-cleanup-hook-arg:worker-764-root-slot-1",
                registration_order: 2,
                expected_execution_order: 1,
                source_row_id: "worker-render-root-stale-executable-preflight",
                source_handle_kind: BridgeHandleKind::Root,
            },
            CleanupHookIdentityTamperCase {
                id: "cleanup-hook-root-function-token-tamper-rejected",
                cleanup_hook_id: "worker-root-handle-cleanup-hook",
                cleanup_hook_function_identity_token: "private-cleanup-hook-fn:arbitrary-root-handle-teardown",
                cleanup_hook_argument_identity_token: "private-cleanup-hook-arg:worker-764-root-slot-1",
                registration_order: 2,
                expected_execution_order: 1,
                source_row_id: "worker-render-root-stale-executable-preflight",
                source_handle_kind: BridgeHandleKind::Root,
            },
            CleanupHookIdentityTamperCase {
                id: "cleanup-hook-root-argument-token-tamper-rejected",
                cleanup_hook_id: "worker-root-handle-cleanup-hook",
                cleanup_hook_function_identity_token: "private-cleanup-hook-fn:worker-root-handle-teardown",
                cleanup_hook_argument_identity_token: "private-cleanup-hook-arg:worker-764-root-slot-99",
                registration_order: 2,
                expected_execution_order: 1,
                source_row_id: "worker-render-root-stale-executable-preflight",
                source_handle_kind: BridgeHandleKind::Root,
            },
            CleanupHookIdentityTamperCase {
                id: "cleanup-hook-value-id-tamper-rejected",
                cleanup_hook_id: "arbitrary-value-cleanup-hook",
                cleanup_hook_function_identity_token: "private-cleanup-hook-fn:worker-value-handle-teardown",
                cleanup_hook_argument_identity_token: "private-cleanup-hook-arg:worker-764-value-slot-3",
                registration_order: 1,
                expected_execution_order: 2,
                source_row_id: "worker-render-value-stale-executable-preflight",
                source_handle_kind: BridgeHandleKind::Value,
            },
            CleanupHookIdentityTamperCase {
                id: "cleanup-hook-value-function-token-tamper-rejected",
                cleanup_hook_id: "worker-value-handle-cleanup-hook",
                cleanup_hook_function_identity_token: "private-cleanup-hook-fn:arbitrary-value-handle-teardown",
                cleanup_hook_argument_identity_token: "private-cleanup-hook-arg:worker-764-value-slot-3",
                registration_order: 1,
                expected_execution_order: 2,
                source_row_id: "worker-render-value-stale-executable-preflight",
                source_handle_kind: BridgeHandleKind::Value,
            },
            CleanupHookIdentityTamperCase {
                id: "cleanup-hook-value-argument-token-tamper-rejected",
                cleanup_hook_id: "worker-value-handle-cleanup-hook",
                cleanup_hook_function_identity_token: "private-cleanup-hook-fn:worker-value-handle-teardown",
                cleanup_hook_argument_identity_token: "private-cleanup-hook-arg:worker-764-value-slot-99",
                registration_order: 1,
                expected_execution_order: 2,
                source_row_id: "worker-render-value-stale-executable-preflight",
                source_handle_kind: BridgeHandleKind::Value,
            },
        ];

        for case in cases {
            let tampered =
                validate_native_root_bridge_worker_thread_cleanup_hook_evidence_for_preflight(
                    &executable_preflight,
                    NativeRootBridgeWorkerThreadCleanupHookEvidence::new(
                        case.id,
                        "cleanup-hook-evidence-preflight-rejection",
                        case.cleanup_hook_id,
                        case.cleanup_hook_function_identity_token,
                        case.cleanup_hook_argument_identity_token,
                        case.registration_order,
                        case.expected_execution_order,
                        executable_preflight.status(),
                        executable_preflight.worker_thread_id(),
                        executable_preflight.worker_environment_id(),
                        case.source_row_id,
                        case.source_handle_kind,
                        Some("FAST_REACT_NAPI_STALE_HANDLE"),
                        Some("FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"),
                    ),
                );

            assert_eq!(
                tampered.status(),
                NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Rejected,
                "{}",
                case.id
            );
            assert_eq!(
                tampered.code(),
                Some("FAST_REACT_NAPI_CLEANUP_HOOK_IDENTITY_MISMATCH"),
                "{}",
                case.id
            );
            assert_eq!(
                tampered.source_preflight_status(),
                executable_preflight.status()
            );
            assert_eq!(
                tampered.source_worker_thread_id(),
                executable_preflight.worker_thread_id()
            );
            assert_eq!(
                tampered.source_environment_id(),
                executable_preflight.worker_environment_id()
            );
            assert_eq!(tampered.source_row_id(), case.source_row_id);
            assert_eq!(tampered.source_handle_kind(), case.source_handle_kind);
            assert_eq!(tampered.registration_order(), case.registration_order);
            assert_eq!(
                tampered.expected_execution_order(),
                case.expected_execution_order
            );
            assert_eq!(tampered.observed_execution_order(), None);
            assert!(!tampered.canonical_executable_evidence());
            assert!(tampered.cleanup_hook_order_private());
            assert!(tampered.cleanup_hook_identity_private());
            assert!(!tampered.stale_or_forged_cleanup_evidence_rejected());
            assert!(!tampered.node_worker_threads_execution());
            assert!(!tampered.napi_cleanup_hook_execution());
            assert!(!tampered.native_addon_loaded());
            assert!(!tampered.native_execution());
            assert!(!tampered.renderer_execution());
            assert!(!tampered.reconciler_execution());
            assert!(!tampered.public_native_compatibility());
            assert!(!tampered.react_behavior_error());
        }
    }

    #[test]
    fn native_root_bridge_js_request_shape_metadata_matches_handle_validation_model() {
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JS_REQUEST_SHAPE_GATE_STATUS,
            "admitted-native-root-bridge-js-request-shape"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_HANDLE_ADMISSION_PREFLIGHT_STATUS,
            "preflighted-native-root-bridge-real-handle-admission"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_RUST_HANDLE_TABLE_ADMISSION_SMOKE_STATUS,
            "mirrored-native-root-bridge-rust-handle-table-admission-smoke"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_SMOKE_STATUS,
            "smoked-native-root-bridge-js-to-rust-json-transport"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_PARSER_GATE_STATUS,
            "parsed-native-root-bridge-json-transport-schema"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_CROSS_ENVIRONMENT_TEARDOWN_GATE_STATUS,
            "diagnosed-native-root-bridge-cross-environment-teardown-isolation"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_BATCHED_JSON_TRANSPORT_GATE_STATUS,
            "validated-native-root-bridge-batched-json-transport-records"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_GATE_STATUS,
            "diagnosed-native-root-bridge-json-batch-response-sequence"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_BATCH_ID,
            "native-root-bridge-json-batch-552"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_GATE_STATUS,
            "diagnosed-native-root-bridge-json-stream-batch-roundtrip"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_STREAM_ID,
            "native-root-bridge-json-stream-batch-roundtrip-587"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_OUT_OF_ORDER_CHUNK_CODE,
            "FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_CHUNK_OUT_OF_ORDER"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_DUPLICATE_CHUNK_CODE,
            "FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_DUPLICATE_CHUNK"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_MISSING_CHUNK_CODE,
            "FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_MISSING_CHUNK"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_POST_TEARDOWN_CHUNK_CODE,
            "FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_CHUNK_AFTER_TEARDOWN"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_TRANSPORT_WORKER_THREAD_TEARDOWN_GATE_STATUS,
            "diagnosed-native-root-bridge-transport-worker-thread-teardown"
        );
        assert_eq!(NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_FORMAT, "json");
        assert_eq!(NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_SCHEMA_VERSION, 1);
        assert_eq!(
            NATIVE_ROOT_BRIDGE_REQUEST_VALIDATION_MODEL,
            "fast-react-napi.NativeRootBridgeRequestSequenceValidator"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_HANDLE_TABLE_MODEL,
            "fast-react-napi.BridgeHandleTable"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JS_REQUEST_RECORD_FIELDS,
            &[
                "requestId",
                "kind",
                "environmentId",
                "rootHandle",
                "rootId",
                "valueHandle",
                "rootHandleState"
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_RUST_REQUEST_RECORD_FIELDS,
            &[
                "request_id",
                "kind",
                "environment_id",
                "root_handle",
                "root_id",
                "value_handle",
                "root_handle_state"
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_RUST_VALIDATION_RECORD_FIELDS,
            &[
                "request_id",
                "kind",
                "environment_id",
                "root_handle",
                "root_id",
                "value_handle",
                "root_handle_state",
                "lifecycle_transition",
                "root_handle_validated",
                "value_handle_validated"
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JS_HANDLE_FIELDS,
            &["environmentId", "slot", "generation", "kind"]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_RUST_HANDLE_FIELDS,
            &["environment_id", "slot", "generation", "kind"]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_REQUEST_KIND_CODES,
            &[
                NativeRootBridgeRequestKind::Create.code(),
                NativeRootBridgeRequestKind::Render.code(),
                NativeRootBridgeRequestKind::Unmount.code()
            ]
        );
        assert_eq!(NATIVE_ROOT_BRIDGE_HANDLE_KIND_CODES, &["root", "value"]);
        assert_eq!(BridgeHandleKind::Root.to_string(), "root");
        assert_eq!(BridgeHandleKind::Value.to_string(), "value");
        assert_eq!(
            NATIVE_ROOT_BRIDGE_ROOT_HANDLE_STATE_CODES,
            &[
                NativeRootBridgeRootHandleState::Active.code(),
                NativeRootBridgeRootHandleState::Retired.code()
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_LIFECYCLE_TRANSITION_CODES,
            &[
                NativeRootBridgeLifecycleTransition::NoneToActive.code(),
                NativeRootBridgeLifecycleTransition::ActiveToActive.code(),
                NativeRootBridgeLifecycleTransition::ActiveToRetired.code()
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_HANDLE_ADMISSION_ACTION_CODES,
            &[
                NativeRootBridgeHandleAdmissionAction::AdmitRoot.code(),
                NativeRootBridgeHandleAdmissionAction::AdmitValue.code(),
                NativeRootBridgeHandleAdmissionAction::ValidateActiveRoot.code(),
                NativeRootBridgeHandleAdmissionAction::ValidateValue.code(),
                NativeRootBridgeHandleAdmissionAction::RetireRoot.code(),
                NativeRootBridgeHandleAdmissionAction::ValidateRetiredRoot.code()
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_RUST_HANDLE_TABLE_ADMISSION_SMOKE_RECORD_FIELDS,
            &[
                "request_id",
                "kind",
                "lifecycle_transition",
                "root_handle_state_before",
                "root_handle_state_after",
                "root_handle_action",
                "root_handle_current_generation",
                "value_handle_action",
                "value_handle_current_generation",
                "retired_root_source_error_code"
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_ENVELOPE_FIELDS,
            &["transport", "schemaVersion", "requestRecords"]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_CROSS_ENVIRONMENT_TEARDOWN_DIAGNOSTIC_FIELDS,
            &[
                "id",
                "operation",
                "handle_kind",
                "table_environment_id",
                "handle_environment_id",
                "slot",
                "handle_generation",
                "current_generation",
                "record_id",
                "error_code",
                "native_addon_loaded",
                "native_execution",
                "renderer_execution",
                "reconciler_execution",
                "react_behavior_error"
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_BATCHED_JSON_TRANSPORT_LIFECYCLE_ROW_FIELDS,
            &[
                "id",
                "batch_index",
                "request_id",
                "kind",
                "lifecycle_before",
                "lifecycle_after",
                "lifecycle_transition",
                "status",
                "code",
                "source_error_code",
                "boundary_error_code",
                "native_addon_loaded",
                "native_execution",
                "renderer_execution",
                "reconciler_execution",
                "react_behavior_error"
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_SEQUENCE_ROW_FIELDS,
            &[
                "id",
                "batch_id",
                "request_order",
                "response_order",
                "request_id",
                "kind",
                "response_status",
                "error_row_status",
                "teardown_state",
                "code",
                "source_error_code",
                "boundary_error_code",
                "native_addon_loaded",
                "native_execution",
                "renderer_execution",
                "reconciler_execution",
                "react_behavior_error"
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_ERROR_ROW_STATUSES,
            &[
                NativeRootBridgeBatchResponseErrorRowStatus::NotError.code(),
                NativeRootBridgeBatchResponseErrorRowStatus::Lifecycle.code(),
                NativeRootBridgeBatchResponseErrorRowStatus::Deterministic.code()
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_BATCH_RESPONSE_TEARDOWN_STATES,
            &[
                NativeRootBridgeBatchResponseTeardownState::Uninitialized.code(),
                NativeRootBridgeBatchResponseTeardownState::Active.code(),
                NativeRootBridgeBatchResponseTeardownState::Retired.code()
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_CHUNK_ROW_FIELDS,
            &[
                "id",
                "batch_id",
                "stream_id",
                "request_id",
                "request_order",
                "response_order",
                "chunk_order",
                "batch_sequence",
                "chunk_kind",
                "chunk_status",
                "response_status",
                "assembly_state",
                "assembled_response",
                "teardown_state",
                "teardown_blocker",
                "code",
                "source_error_code",
                "boundary_error_code",
                "native_addon_loaded",
                "native_execution",
                "renderer_execution",
                "reconciler_execution",
                "cross_environment_handle_reuse_blocked",
                "public_native_compatibility",
                "react_behavior_error"
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_ERROR_CASE_IDS,
            &[
                "stream-chunk-out-of-order",
                "stream-chunk-duplicate",
                "stream-chunk-missing",
                "stream-chunk-after-teardown"
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_CHUNK_KINDS,
            &[
                NativeRootBridgeJsonTransportStreamChunkKind::Metadata.code(),
                NativeRootBridgeJsonTransportStreamChunkKind::Payload.code()
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_CHUNK_STATUSES,
            &[
                NativeRootBridgeJsonTransportStreamChunkStatus::Accepted.code(),
                NativeRootBridgeJsonTransportStreamChunkStatus::Error.code()
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_ASSEMBLY_STATES,
            &[
                NativeRootBridgeJsonTransportStreamAssemblyState::Partial.code(),
                NativeRootBridgeJsonTransportStreamAssemblyState::Assembled.code(),
                NativeRootBridgeJsonTransportStreamAssemblyState::Rejected.code()
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_STREAM_BATCH_ROUNDTRIP_TEARDOWN_BLOCKERS,
            &[
                NativeRootBridgeJsonTransportStreamTeardownBlocker::None.code(),
                NativeRootBridgeJsonTransportStreamTeardownBlocker::RootRetiredAfterAssembly.code(),
                NativeRootBridgeJsonTransportStreamTeardownBlocker::PostTeardownChunkBlocked.code()
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_TRANSPORT_WORKER_THREAD_TEARDOWN_ROW_FIELDS,
            &[
                "id",
                "operation",
                "worker_thread_id",
                "transport",
                "source_batch_index",
                "request_id",
                "handle_kind",
                "table_environment_id",
                "handle_environment_id",
                "slot",
                "handle_generation",
                "current_generation",
                "record_id",
                "error_code",
                "boundary_error_code",
                "native_addon_loaded",
                "native_execution",
                "renderer_execution",
                "reconciler_execution",
                "react_behavior_error"
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JSON_TRANSPORT_PARSE_ERROR_CODES,
            &[
                "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_JSON",
                "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_EXPECTED_OBJECT",
                "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_MISSING_FIELD",
                "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNEXPECTED_FIELD",
                "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_FIELD_TYPE",
                "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNSUPPORTED_FIELD_VALUE"
            ]
        );
        assert_eq!(
            TEST_RENDERER_NATIVE_ROOT_EXECUTION_BRIDGE_STATUS,
            "admitted-private-test-renderer-native-root-execution-bridge"
        );
        assert_eq!(
            TEST_RENDERER_NATIVE_ROOT_EXECUTION_BOUNDARY,
            "fast-react-test-renderer.TestRendererRoot"
        );
        assert_eq!(
            TEST_RENDERER_NATIVE_ROOT_EXECUTION_PUBLIC_STATUS,
            "blocked-public-react-test-renderer-create-update-unmount"
        );
        assert_eq!(
            TEST_RENDERER_NATIVE_ROOT_EXECUTION_RECORD_FIELDS,
            &[
                "request_id",
                "operation",
                "root_id",
                "lifecycle_before",
                "lifecycle_after",
                "update_outcome",
                "scheduled_update",
                "private_root_request_execution",
                "rust_root_execution_boundary_called",
                "native_addon_loaded",
                "native_execution",
                "reconciler_execution",
                "host_output_produced",
                "public_create_update_unmount_available",
                "compatibility_claimed"
            ]
        );
    }

    #[test]
    fn test_renderer_native_root_execution_bridge_calls_create_update_unmount_boundary() {
        let mut bridge = TestRendererNativeRootExecutionBridge::new();
        let create = bridge
            .execute_create(RootElementHandle::from_raw(11), TestRendererOptions::new())
            .unwrap();
        let create_scheduled = create
            .scheduled_update()
            .expect("create schedules a TestRendererRoot update");

        assert_eq!(create.request_id(), 1);
        assert_eq!(create.operation(), TestRendererRootUpdateKind::Create);
        assert_eq!(create.lifecycle_before(), None);
        assert_eq!(create.lifecycle_after(), TestRendererRootLifecycle::Active);
        assert_eq!(create.update_outcome(), "Scheduled");
        assert_eq!(create_scheduled.kind(), TestRendererRootUpdateKind::Create);
        assert_eq!(create_scheduled.element(), RootElementHandle::from_raw(11));
        assert_eq!(create_scheduled.container_update_api(), "update_container");
        assert_eq!(
            create_scheduled.root_schedule_api(),
            "ensure_root_is_scheduled"
        );
        assert!(!create_scheduled.sync());
        assert!(create.private_root_request_execution());
        assert!(create.rust_root_execution_boundary_called());
        assert!(!create.native_addon_loaded());
        assert!(!create.native_execution());
        assert!(create.reconciler_execution());
        assert!(!create.host_output_produced());
        assert!(!create.public_create_update_unmount_available());
        assert!(!create.compatibility_claimed());

        let update = bridge
            .execute_update(RootElementHandle::from_raw(12))
            .unwrap();
        let update_scheduled = update
            .scheduled_update()
            .expect("update schedules a TestRendererRoot update");

        assert_eq!(update.request_id(), 2);
        assert_eq!(update.root_id(), create.root_id());
        assert_eq!(update.operation(), TestRendererRootUpdateKind::Update);
        assert_eq!(
            update.lifecycle_before(),
            Some(TestRendererRootLifecycle::Active)
        );
        assert_eq!(update.lifecycle_after(), TestRendererRootLifecycle::Active);
        assert_eq!(update.update_outcome(), "Scheduled");
        assert_eq!(update_scheduled.kind(), TestRendererRootUpdateKind::Update);
        assert_eq!(update_scheduled.element(), RootElementHandle::from_raw(12));
        assert_eq!(update_scheduled.container_update_api(), "update_container");
        assert!(!update_scheduled.sync());
        assert!(update.private_root_request_execution());
        assert!(update.rust_root_execution_boundary_called());
        assert!(!update.native_execution());
        assert!(update.reconciler_execution());
        assert!(!update.public_create_update_unmount_available());

        let unmount = bridge.execute_unmount().unwrap();
        let unmount_scheduled = unmount
            .scheduled_update()
            .expect("unmount schedules a sync TestRendererRoot update");

        assert_eq!(unmount.request_id(), 3);
        assert_eq!(unmount.root_id(), create.root_id());
        assert_eq!(unmount.operation(), TestRendererRootUpdateKind::Unmount);
        assert_eq!(
            unmount.lifecycle_before(),
            Some(TestRendererRootLifecycle::Active)
        );
        assert_eq!(
            unmount.lifecycle_after(),
            TestRendererRootLifecycle::UnmountScheduled
        );
        assert_eq!(unmount.update_outcome(), "Scheduled");
        assert_eq!(
            unmount_scheduled.kind(),
            TestRendererRootUpdateKind::Unmount
        );
        assert_eq!(unmount_scheduled.element(), RootElementHandle::NONE);
        assert_eq!(
            unmount_scheduled.container_update_api(),
            "update_container_sync"
        );
        assert!(unmount_scheduled.sync());
        assert!(unmount.rust_root_execution_boundary_called());
        assert!(!unmount.native_execution());
        assert!(unmount.reconciler_execution());
        assert!(!unmount.host_output_produced());
        assert!(!unmount.compatibility_claimed());
    }

    #[test]
    fn test_renderer_native_root_execution_bridge_preserves_fail_closed_lifecycle_outcomes() {
        let mut bridge = TestRendererNativeRootExecutionBridge::new();
        let missing_root = bridge
            .execute_update(RootElementHandle::from_raw(21))
            .unwrap_err();

        assert_eq!(
            missing_root,
            TestRendererNativeRootExecutionBridgeError::MissingRoot
        );

        let create = bridge
            .execute_create(RootElementHandle::from_raw(21), TestRendererOptions::new())
            .unwrap();
        let create_again = bridge
            .execute_create(RootElementHandle::from_raw(22), TestRendererOptions::new())
            .unwrap_err();

        assert_eq!(
            create_again,
            TestRendererNativeRootExecutionBridgeError::RootAlreadyCreated
        );

        let first_unmount = bridge.execute_unmount().unwrap();
        let second_unmount = bridge.execute_unmount().unwrap();
        let late_update = bridge
            .execute_update(RootElementHandle::from_raw(23))
            .unwrap();

        assert_eq!(first_unmount.root_id(), create.root_id());
        assert_eq!(first_unmount.update_outcome(), "Scheduled");
        assert!(first_unmount.scheduled_update().is_some());
        assert_eq!(second_unmount.request_id(), 3);
        assert_eq!(
            second_unmount.lifecycle_before(),
            Some(TestRendererRootLifecycle::UnmountScheduled)
        );
        assert_eq!(
            second_unmount.lifecycle_after(),
            TestRendererRootLifecycle::UnmountScheduled
        );
        assert_eq!(second_unmount.update_outcome(), "AlreadyUnmountScheduled");
        assert!(second_unmount.rust_root_execution_boundary_called());
        assert!(!second_unmount.reconciler_execution());
        assert_eq!(second_unmount.scheduled_update(), None);
        assert_eq!(late_update.request_id(), 4);
        assert_eq!(
            late_update.lifecycle_before(),
            Some(TestRendererRootLifecycle::UnmountScheduled)
        );
        assert_eq!(
            late_update.lifecycle_after(),
            TestRendererRootLifecycle::UnmountScheduled
        );
        assert_eq!(late_update.update_outcome(), "IgnoredAfterUnmount");
        assert!(late_update.rust_root_execution_boundary_called());
        assert!(!late_update.native_execution());
        assert!(!late_update.reconciler_execution());
        assert_eq!(late_update.scheduled_update(), None);
    }

    #[test]
    fn native_root_bridge_sequence_validator_rejects_value_handles_invalidated_after_recording() {
        let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(281));
        let element_handle = table.insert_value(PlaceholderValueRecord::new(9501));
        let mut recorder = NativeRootBridgeRequestRecorder::new();
        let mut validator = NativeRootBridgeRequestSequenceValidator::new();
        let create = recorder
            .record_create_root(&mut table, NativeRootBridgeCreateRequest::new(7501))
            .unwrap();

        validator.validate_next(&table, create).unwrap();
        let render = recorder
            .record_render(
                &table,
                NativeRootBridgeRenderRequest::new(create.root_handle())
                    .with_element_handle(element_handle),
            )
            .unwrap();
        table.remove_value(element_handle).unwrap();

        let stale_value = validator.validate_next(&table, render).unwrap_err();

        assert_eq!(
            stale_value,
            NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::StaleHandle {
                handle: element_handle,
                current_generation: element_handle.generation() + 1
            })
        );
        assert_eq!(stale_value.code(), "FAST_REACT_NAPI_STALE_HANDLE");
        assert_eq!(validator.last_request_id(), Some(create.request_id()));
        assert!(!validator.root_retired());
    }

    #[test]
    fn native_root_bridge_sequence_validator_rejects_wrong_environment_records() {
        let mut first = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(281));
        let second = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(282));
        let mut recorder = NativeRootBridgeRequestRecorder::new();
        let mut validator = NativeRootBridgeRequestSequenceValidator::new();
        let create = recorder
            .record_create_root(&mut first, NativeRootBridgeCreateRequest::new(7601))
            .unwrap();

        let wrong_environment = validator.validate_next(&second, create).unwrap_err();

        assert_eq!(
            wrong_environment,
            NativeRootBridgeRequestError::RecordEnvironmentMismatch {
                record_environment_id: first.environment_id(),
                table_environment_id: second.environment_id()
            }
        );
        assert_eq!(
            wrong_environment.code(),
            "FAST_REACT_NAPI_ROOT_REQUEST_RECORD_ENVIRONMENT_MISMATCH"
        );
        assert_eq!(validator.last_request_id(), None);
        assert_eq!(
            first.get_root(create.root_handle()).unwrap().root_id(),
            7601
        );
    }

    #[test]
    fn native_root_bridge_sequence_validator_rejects_invalid_lifecycle_order() {
        let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(281));
        let manual_root = table.insert_root(PlaceholderRootRecord::new(7701));
        let mut recorder = NativeRootBridgeRequestRecorder::new();
        let mut validator = NativeRootBridgeRequestSequenceValidator::new();
        let render_before_create = recorder
            .record_render(&table, NativeRootBridgeRenderRequest::new(manual_root))
            .unwrap();

        let missing_create = validator
            .validate_next(&table, render_before_create)
            .unwrap_err();

        assert_eq!(
            missing_create,
            NativeRootBridgeRequestError::SequenceMustStartWithCreate {
                actual: NativeRootBridgeRequestKind::Render
            }
        );
        assert_eq!(
            missing_create.code(),
            "FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE"
        );

        let create = recorder
            .record_create_root(&mut table, NativeRootBridgeCreateRequest::new(7702))
            .unwrap();
        validator.validate_next(&table, create).unwrap();

        let out_of_order = validator
            .validate_next(&table, render_before_create)
            .unwrap_err();

        assert_eq!(
            out_of_order,
            NativeRootBridgeRequestError::RequestSequenceOutOfOrder {
                previous_request_id: create.request_id(),
                request_id: render_before_create.request_id()
            }
        );

        let foreign_root = table.insert_root(PlaceholderRootRecord::new(7703));
        let foreign_render = recorder
            .record_render(&table, NativeRootBridgeRenderRequest::new(foreign_root))
            .unwrap();
        let handle_mismatch = validator.validate_next(&table, foreign_render).unwrap_err();

        assert_eq!(
            handle_mismatch,
            NativeRootBridgeRequestError::RecordRootHandleMismatch {
                expected: create.root_handle(),
                actual: foreign_root
            }
        );
        assert_eq!(
            handle_mismatch.code(),
            "FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_MISMATCH"
        );

        let unmount = recorder
            .record_unmount(
                &mut table,
                NativeRootBridgeUnmountRequest::new(create.root_handle()),
            )
            .unwrap();
        validator.validate_next(&table, unmount).unwrap();
        let create_after_unmount = recorder
            .record_create_root(&mut table, NativeRootBridgeCreateRequest::new(7704))
            .unwrap();
        let after_unmount = validator
            .validate_next(&table, create_after_unmount)
            .unwrap_err();

        assert_eq!(
            after_unmount,
            NativeRootBridgeRequestError::RequestAfterUnmount {
                request_id: create_after_unmount.request_id()
            }
        );
        assert_eq!(
            after_unmount.code(),
            "FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT"
        );
    }

    #[test]
    fn crate_manifest_has_no_real_native_binding_or_build_dependency() {
        let manifest = include_str!("../Cargo.toml");
        let dependency_names = dependency_names_from_manifest(manifest);
        let forbidden_dependencies = [
            "napi",
            "napi-derive",
            "napi-build",
            "neon",
            "node-sys",
            "v8",
            "rusty_v8",
            "libuv",
            "uv-sys",
        ];

        for dependency_name in dependency_names {
            assert!(
                !forbidden_dependencies.contains(&dependency_name),
                "{dependency_name} would make the placeholder depend on native Node/V8/libuv binding APIs"
            );
        }

        assert!(
            !manifest
                .lines()
                .any(|line| line.trim_start().starts_with("build =")),
            "the placeholder crate must not run a Cargo build script"
        );
        assert!(
            !Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("build.rs")
                .exists(),
            "the placeholder crate must not add build.rs while no N-API binding exists"
        );
    }

    fn dependency_names_from_manifest(manifest: &str) -> Vec<&str> {
        let mut names = Vec::new();
        let mut in_dependency_section = false;

        for line in manifest.lines() {
            let trimmed = line.trim();

            if trimmed.starts_with('[') {
                in_dependency_section = trimmed == "[dependencies]"
                    || trimmed == "[dev-dependencies]"
                    || trimmed == "[build-dependencies]"
                    || trimmed.starts_with("[target.")
                        && (trimmed.ends_with(".dependencies]")
                            || trimmed.ends_with(".dev-dependencies]")
                            || trimmed.ends_with(".build-dependencies]"));

                if let Some(rest) = trimmed.strip_prefix("[dependencies.") {
                    names.push(rest.trim_end_matches(']'));
                }
                if let Some(rest) = trimmed.strip_prefix("[dev-dependencies.") {
                    names.push(rest.trim_end_matches(']'));
                }
                if let Some(rest) = trimmed.strip_prefix("[build-dependencies.") {
                    names.push(rest.trim_end_matches(']'));
                }

                continue;
            }

            if !in_dependency_section || trimmed.is_empty() || trimmed.starts_with('#') {
                continue;
            }

            if let Some((name, _value)) = trimmed.split_once('=') {
                names.push(name.trim().trim_matches('"'));
            }
        }

        names
    }
}
