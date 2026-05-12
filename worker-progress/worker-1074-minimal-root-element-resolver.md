## worker-1074-minimal-root-element-resolver

- Added a production-facing, bridge-oriented root element resolver surface in `root_config.rs`.
- The admitted shape is intentionally narrow: `RootElementHandle::NONE` resolves to null; non-null handles must resolve to one host component with an optional single text child.
- Added fail-closed errors for unknown handles, missing required opaque handles, source-level unsupported shapes, and requested/resolved handle mismatches.
- Exported the resolver types and helper from `fast-react-reconciler`.
- Added focused `root_config` tests for null, host component with and without text, missing/mismatched handles, constructor validation, and unsupported source shapes.

## verification

- `cargo fmt --check`
- `cargo test -p fast-react-reconciler root_config`
