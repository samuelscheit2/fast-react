//! Node-API boundary placeholder.
//!
//! This crate is the reserved native binding boundary. The initial scaffold
//! avoids pulling N-API dependencies until the binding strategy is implemented,
//! but no other Rust crate should grow Node-specific dependencies.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

mod handle_table;

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
