//! Node-API boundary placeholder.
//!
//! This crate is the reserved native binding boundary. The initial scaffold
//! avoids pulling N-API dependencies until the binding strategy is implemented,
//! but no other Rust crate should grow Node-specific dependencies.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

pub const BINDING_PACKAGE_NAME: &str = "@fast-react/native";
pub const NAPI_BOUNDARY_STATUS: &str = "placeholder";
pub const NATIVE_ADDON_NAME: &str = "fast_react_napi";
pub const NODE_API_VERSION_FLOOR: u32 = 8;
pub const SUPPORTED_NODE_ENGINE_RANGE: &str = ">=22.0.0";
pub const PLATFORM_ARTIFACT_POLICY: &str =
    "future per-platform optional npm packages; no native addon is built or loaded yet";

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
}
