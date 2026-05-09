# worker-032-native-boundary-guardrails

## Summary

Tightened the native binding placeholder so the boundary remains explicit and deterministic while still refusing to load native code. The JS native package now exposes a frozen native binding manifest, a deterministic target matrix, per-target optional package names, per-target `.node` artifact names, and load-plan metadata. The Rust `fast-react-napi` placeholder mirrors the target matrix and includes tests that reject real N-API, V8, Node, libuv, or Cargo build-script dependencies.

No real N-API dependency was added. No `.node` file is loaded. No install lifecycle script, optional dependency, postinstall download path, child process path, or network module path was introduced.

The earlier nested explorer from the previous worker process did not return in time and was not used as evidence for this resumed completion.

## Changed Files

- `bindings/node/index.cjs`
  - Added frozen `nativeTargetMatrix`, `nativeBindingManifest`, per-target package/artifact metadata, and richer unavailable-error metadata.
  - Kept `loadNativeBinding()` as a loud placeholder that throws before any package or `.node` load.
- `bindings/node/index.mjs`
  - Re-exported the new manifest and target metadata through the existing CJS bridge.
- `bindings/node/package.json`
  - Added the focused no-native-load guard to the package `check` script.
- `bindings/node/README.md`
  - Documented manifest metadata and the absence of install/download/native-loading paths.
- `bindings/node/test/native-loader.test.cjs`
  - Added deterministic package, manifest, target-matrix, lifecycle-script, dependency, and load-plan assertions.
- `bindings/node/test/native-loader-esm.test.mjs`
  - Added ESM parity checks for the new manifest exports.
- `bindings/node/test/native-no-load-guard.test.cjs`
  - Added a guard that records and blocks attempted `.node`, platform package, child process, HTTP, or HTTPS loads and asserts none happen during CJS import, ESM import, load-plan creation, or `loadNativeBinding()`.
- `crates/fast-react-napi/src/lib.rs`
  - Added Rust-side native target metadata and tests for deterministic targets and forbidden native binding/build dependencies.
- `worker-progress/worker-032-native-boundary-guardrails.md`
  - This report.

`Cargo.lock` exists as an untracked regenerable root artifact from Cargo commands and was intentionally left alone.

## Commands Run

- `git status --short`
- `git diff --stat`
- `git diff --name-status`
- `git diff --color=never -- bindings/node/index.cjs bindings/node/index.mjs bindings/node/package.json bindings/node/README.md`
- `git diff --color=never -- bindings/node/test/native-loader.test.cjs bindings/node/test/native-loader-esm.test.mjs crates/fast-react-napi/src/lib.rs`
- `sed -n '1,260p' bindings/node/test/native-no-load-guard.test.cjs`
- `sed -n '1,220p' crates/fast-react-napi/Cargo.toml`
- `sed -n '1,280p' bindings/node/index.cjs`
- `sed -n '1,520p' crates/fast-react-napi/src/lib.rs`
- `rg -n "(postinstall|preinstall|install|prepare|optionalDependencies|dependencies|devDependencies|bundleDependencies|bundledDependencies|child_process|node:child_process|https?|fetch|download|\\.node|require\\(|import\\(|napi|napi-derive|napi-build|neon|node-sys|rusty_v8|\\bv8\\b|libuv|uv-sys)" bindings/node crates/fast-react-napi`
- `npm run check --workspace @fast-react/native`
- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features`
- `node bindings/node/test/native-no-load-guard.test.cjs`
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`
- `git add --intent-to-add bindings/node/test/native-no-load-guard.test.cjs worker-progress/worker-032-native-boundary-guardrails.md`
- `git diff --check -- bindings/node crates/fast-react-napi worker-progress/worker-032-native-boundary-guardrails.md`
- `git reset -- bindings/node/test/native-no-load-guard.test.cjs worker-progress/worker-032-native-boundary-guardrails.md`

## Verification

- `npm run check --workspace @fast-react/native` passed.
  - CJS loader placeholder checks passed.
  - Focused no-load guard passed.
  - ESM loader placeholder checks passed.
- `cargo fmt --all --check` passed.
- `cargo test -p fast-react-napi --all-features` passed.
  - 5 unit tests passed.
  - 0 doc tests.
- `node bindings/node/test/native-no-load-guard.test.cjs` passed as focused no-native-load evidence.
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings` passed.
- `git diff --check -- bindings/node crates/fast-react-napi worker-progress/worker-032-native-boundary-guardrails.md` passed. I used temporary intent-to-add for the two new files so the whitespace check covered the full scoped diff, then cleared the index marker.
- Static review found no runtime `require()`/`import()` path for native platform packages, `.node` artifacts, child process modules, or network modules. The only `.node` and N-API references are deterministic metadata strings and guard/test assertions.
- `crates/fast-react-napi/Cargo.toml` still has no dependency sections and no build script. Rust tests assert forbidden native binding dependencies remain absent.

## Risks And Follow-Ups

- The JS and Rust target matrices are duplicated. That is acceptable for this placeholder guardrail stage, but a future native-packaging worker should generate both from one manifest or add a cross-language parity check before shipping real artifacts.
- Linux libc detection remains intentionally narrow: explicit `musl` maps to musl, all other Linux libc values map to gnu. This is deterministic and tested, but real packaging may need a broader policy once binaries exist.
- The native package still advertises future optional package names without publishing those packages. That is intentional while the binding status is `placeholder`.

## Quality, Maintainability, Performance, And Security Review

- Quality: The boundary now has executable tests for package metadata, target selection, lifecycle scripts, dependency fields, native load plans, and Rust crate dependency hygiene.
- Maintainability: Target metadata is centralized inside frozen JS and Rust constants with accessors rather than scattered string construction. Remaining duplication is documented as a future generation/parity task.
- Performance: The placeholder performs only small in-memory metadata construction and process report inspection for Linux libc detection; no native load, filesystem probe, subprocess, or network call was added.
- Security: The package keeps install-time execution absent, avoids postinstall downloads, avoids optional native dependencies, and the focused guard fails if placeholder imports or `loadNativeBinding()` attempt `.node`, platform package, child process, HTTP, or HTTPS loads.
