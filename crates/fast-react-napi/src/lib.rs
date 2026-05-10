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

    use std::error::Error;
    use std::fmt::{self, Display, Formatter};

    use crate::handle_table::{
        BridgeEnvironmentId, BridgeHandle, BridgeHandleTable, BridgeHandleTableError,
        PlaceholderRootRecord,
    };

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

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeRequestError {
        HandleTable(BridgeHandleTableError),
        RequestSequenceExhausted,
    }

    impl NativeRootBridgeRequestError {
        #[must_use]
        pub(crate) const fn code(&self) -> &'static str {
            match self {
                Self::HandleTable(error) => error.code(),
                Self::RequestSequenceExhausted => "FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_EXHAUSTED",
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
                Self::RequestSequenceExhausted => formatter
                    .write_str("native root bridge request sequence cannot allocate another id"),
            }
        }
    }

    impl Error for NativeRootBridgeRequestError {}

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
}

pub const BINDING_PACKAGE_NAME: &str = "@fast-react/native";
pub const NAPI_BOUNDARY_STATUS: &str = "placeholder";
pub const NATIVE_ADDON_NAME: &str = "fast_react_napi";
pub const NODE_API_VERSION_FLOOR: u32 = 8;
pub const SUPPORTED_NODE_ENGINE_RANGE: &str = ">=22.0.0";
pub const PLATFORM_ARTIFACT_POLICY: &str =
    "future per-platform optional npm packages; no native addon is built or loaded yet";
pub const OPTIONAL_PACKAGE_PREFIX: &str = "@fast-react/native-";

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
}

impl NativeBoundaryErrorKind {
    #[must_use]
    pub const fn code(self) -> &'static str {
        match self {
            Self::NativeExportsNotBuilt => "FAST_REACT_NAPI_EXPORTS_NOT_BUILT",
        }
    }

    #[must_use]
    pub const fn reason(self) -> &'static str {
        match self {
            Self::NativeExportsNotBuilt => {
                "Fast React native exports are intentionally unavailable until N-API dependencies are added"
            }
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NativeBoundaryError {
    export_name: &'static str,
    kind: NativeBoundaryErrorKind,
    metadata: NativeBoundaryMetadata,
}

impl NativeBoundaryError {
    #[must_use]
    pub const fn native_exports_not_built(export_name: &'static str) -> Self {
        Self {
            export_name,
            kind: NativeBoundaryErrorKind::NativeExportsNotBuilt,
            metadata: boundary_metadata(),
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
    pub const fn metadata(&self) -> NativeBoundaryMetadata {
        self.metadata
    }
}

impl Display for NativeBoundaryError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        write!(
            formatter,
            "{}: {} ({}, package={}, addon={}, node_api_floor={})",
            self.export_name,
            self.reason(),
            self.code(),
            self.metadata.package_name(),
            self.metadata.native_addon_name(),
            self.metadata.node_api_version_floor()
        )
    }
}

impl Error for NativeBoundaryError {}

pub fn native_export_placeholder(export_name: &'static str) -> Result<(), NativeBoundaryError> {
    Err(NativeBoundaryError::native_exports_not_built(export_name))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::handle_table::{
        BridgeEnvironmentId, BridgeHandleKind, BridgeHandleTable, BridgeHandleTableError,
        PlaceholderValueRecord,
    };
    use crate::root_bridge_requests::{
        NativeRootBridgeCreateRequest, NativeRootBridgeRenderRequest, NativeRootBridgeRequestError,
        NativeRootBridgeRequestKind, NativeRootBridgeRequestRecorder,
        NativeRootBridgeRootHandleState, NativeRootBridgeUnmountRequest,
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
        assert!(error.reason().contains("N-API dependencies"));
        assert!(error.to_string().contains("@fast-react/native"));
        assert!(error.to_string().contains("fast_react_napi"));
    }

    #[test]
    fn native_boundary_errors_are_not_react_behavior_errors() {
        let error = native_export_placeholder("native.processWork").unwrap_err();

        assert!(!error.to_string().contains("React behavior"));
        assert_eq!(error.metadata(), boundary_metadata());
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
