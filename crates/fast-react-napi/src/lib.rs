//! Node-API boundary placeholder.
//!
//! This crate is the reserved native binding boundary. The initial scaffold
//! avoids pulling N-API dependencies until the binding strategy is implemented,
//! but no other Rust crate should grow Node-specific dependencies.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{ElementTypeHandle, Lanes, PropsHandle};

mod handle_table;

#[allow(dead_code)]
mod root_work_loop_metadata;

#[allow(dead_code)]
mod root_bridge_requests;

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
        )
        | root_bridge_requests::NativeRootBridgeRequestError::ReusedValueHandle { .. } => {
            NativeBoundaryErrorKind::RootBridgeStaleHandle
        }
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
        | root_bridge_requests::NativeRootBridgeRequestError::RequestSequenceExhausted
        | root_bridge_requests::NativeRootBridgeRequestError::ExecutorGenerationExhausted => {
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

struct NativeRootMinimalPlacementElementSource {
    element: fast_react_reconciler::RootElementHandle,
    element_type: ElementTypeHandle,
    props: PropsHandle,
    text_props: PropsHandle,
}

impl NativeRootMinimalPlacementElementSource {
    const TEXT: &'static str = "text";

    #[must_use]
    const fn new() -> Self {
        Self {
            element: fast_react_reconciler::RootElementHandle::from_raw(1_129),
            element_type: ElementTypeHandle::from_raw(1_130),
            props: PropsHandle::from_raw(1_131),
            text_props: PropsHandle::from_raw(1_132),
        }
    }
}

impl fast_react_reconciler::RootElementSource for NativeRootMinimalPlacementElementSource {
    fn resolve_root_host_component(
        &self,
        element: fast_react_reconciler::RootElementHandle,
    ) -> Result<
        Option<fast_react_reconciler::RootHostComponentElement>,
        fast_react_reconciler::RootElementResolutionError,
    > {
        if element != self.element {
            return Ok(None);
        }

        let text_child =
            fast_react_reconciler::RootHostTextChild::new(Self::TEXT, self.text_props)?;
        let component = fast_react_reconciler::RootHostComponentElement::new(
            element,
            self.element_type,
            self.props,
        )?
        .with_text_child(text_child);

        Ok(Some(component))
    }
}

#[allow(dead_code)]
pub(crate) fn native_root_work_loop_minimal_placement_diagnostic_for_private_bridge()
-> fast_react_reconciler::MinimalHostRootRenderCompletePlacementDiagnostic {
    use fast_react_reconciler::{
        FiberRootStore, RootOptions,
        describe_minimal_host_root_render_complete_placement_for_private_bridge, update_container,
    };
    use fast_react_test_renderer::{TestElementType, TestProps, TestRenderer};

    let source = NativeRootMinimalPlacementElementSource::new();
    let mut host = TestRenderer::new();
    let container = host.create_container();
    let mut store = FiberRootStore::<TestRenderer>::new();
    let root_id = store
        .create_client_root(container, RootOptions::new())
        .expect("test renderer client root creation should succeed");

    update_container(&mut store, root_id, source.element, None)
        .expect("test renderer diagnostic root update should schedule");

    describe_minimal_host_root_render_complete_placement_for_private_bridge(
        &mut store,
        &mut host,
        root_id,
        Lanes::DEFAULT,
        &source,
        |id| id.raw(),
        |_element, _element_type| {
            Ok::<Option<TestElementType>, &'static str>(Some(TestElementType::new("div")))
        },
        |_element, _props| Ok::<Option<TestProps>, &'static str>(Some(TestProps::new())),
    )
    .expect("test renderer should produce minimal placement diagnostic")
}

#[cfg(test)]
mod tests;
