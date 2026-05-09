# worker-015-native-loader-boundary

## Objective

Improve the native binding loader and Rust N-API boundary placeholders without
adding real N-API dependencies or implementing native behavior. The goal was to
make package-level failure behavior explicit, document the future platform
package shape, separate Rust native-boundary errors from React behavior errors,
and add tests proving native behavior remains loudly unimplemented.

## Sources and commands used

Read first, as required:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-006-binding-strategy.md`
- `worker-progress/worker-010-initial-scaffold.md`

Did not read `ORCHESTRATOR.md`.

Implementation sources inspected:

- `bindings/node/package.json`
- `bindings/node/index.cjs`
- `bindings/node/index.mjs`
- `bindings/node/README.md`
- `crates/fast-react-napi/Cargo.toml`
- `crates/fast-react-napi/src/lib.rs`
- Root scripts in `package.json` for verification only

Delegated check:

- Spawned one managed read-only explorer subagent
  `019e0dbb-4950-71a3-8dc5-35540524b4e8`.
- The subagent checked the hypothesis that the loader should stay importable,
  avoid real `.node` loading, report future platform package metadata, and that
  Rust should use native-boundary-specific errors.
- Its findings matched the implementation direction and called out the native
  package engine mismatch with worker-006 (`>=26` versus `>=22`), missing
  platform metadata, and the Rust error-type mismatch.

Commands run:

- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '1,260p' worker-progress/worker-006-binding-strategy.md`
- `sed -n '1,260p' worker-progress/worker-010-initial-scaffold.md`
- `rg --files bindings/node crates/fast-react-napi worker-progress`
- `rg -n "native|napi|bindingStatus|loadNativeBinding|FastReactNative" bindings/node crates/fast-react-napi packages tests -g '!ORCHESTRATOR.md'`
- `git status --short --branch`
- `node -p "process.platform + ' ' + process.arch + ' ' + (process.report?.getReport?.().header?.glibcVersionRuntime || 'no-glibc')"`
- `npm run check --workspace @fast-react/native`
- `npm run check`
- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features`
- `node -e "require('./bindings/node/index.cjs')"`
- `node --input-type=module -e "await import('./bindings/node/index.mjs')"`
- `git diff --check`
- `git diff -- bindings/node crates/fast-react-napi`

## Files changed

- `bindings/node/README.md`
- `bindings/node/index.cjs`
- `bindings/node/index.mjs`
- `bindings/node/package.json`
- `bindings/node/test/native-loader.test.cjs`
- `bindings/node/test/native-loader-esm.test.mjs`
- `crates/fast-react-napi/Cargo.toml`
- `crates/fast-react-napi/src/lib.rs`
- `worker-progress/worker-015-native-loader-boundary.md`

## Native loader implementation summary

- Kept the package importable through both CJS and ESM.
- Kept real native loading disabled: `loadNativeBinding()` always throws
  `FastReactNativeBindingUnavailableError`.
- Added `getNativeBindingLoadPlan()` so the placeholder can report the future
  target triple, optional platform package, `.node` filename, N-API floor, and
  supported Node range without attempting package resolution yet.
- Documented the planned per-platform optional package shape:
  `darwin-{arm64,x64}`, `linux-{arm64,x64}-{gnu,musl}`, and
  `win32-{arm64,x64}-msvc`.
- Changed `bindings/node` package engines to `node >=22.0.0` to match the
  accepted worker-006 native binding strategy.
- Made ESM import the CJS module and re-export the same singleton contract, so
  future CJS/ESM native state does not diverge.
- Added JS tests proving:
  - CJS and ESM expose the same placeholder contract.
  - known target plans resolve to the expected future package and artifact
    names.
  - unsupported platforms get a clear unsupported-platform placeholder plan.
  - `loadNativeBinding()` throws the typed placeholder error.
  - the placeholder loader does not attempt to load future platform packages.
- Replaced the Rust crate's dependency on `fast-react-core` with local native
  boundary metadata and a `NativeBoundaryError` type. This keeps native
  artifact/export failures distinct from React semantic placeholder failures.

## Verification results

- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-napi --all-features`: passed.
  - 3 unit tests passed.
  - 0 doc tests.
- `node -e "require('./bindings/node/index.cjs')"`: passed.
- `node --input-type=module -e "await import('./bindings/node/index.mjs')"`:
  passed.
- `npm run check --workspace @fast-react/native`: passed.
  - CJS loader placeholder checks passed.
  - ESM loader placeholder checks passed.
- `npm run check`: passed.
  - Ran `cargo fmt --all --check`.
  - Ran `cargo clippy --workspace --all-targets --all-features -- -D warnings`.
  - Ran React placeholder smoke imports.
  - Ran workspace checks including native loader tests.
- `git diff --check`: passed.

Notes:

- npm printed the existing local config warning:
  `Unknown user config "minimum-release-age"`. This was already observed by
  worker-010 and did not affect checks.
- Cargo generated an untracked root `Cargo.lock` during verification. It was
  removed because root lockfiles are outside this worker's write scope.

## Deviations from worker-006 recommendation, if any

No intentional deviations in this worker's owned scope.

- The native package now uses `node >=22.0.0`, matching worker-006.
- The placeholder records N-API 8 as the future floor, matching worker-006's
  conservative N-API recommendation.
- The loader does not add postinstall downloads, optional dependencies, or real
  `.node` loading yet.
- The JS facade remains in charge of package-level loading behavior.

## Risks and root causes

- Real native behavior remains unimplemented by design. Root cause: this worker
  was asked to improve placeholders before adding N-API dependencies. Mitigation:
  every native execution path still throws a typed unavailable error.
- `package-lock.json` still contains the old workspace metadata for
  `bindings/node` because root lockfiles are outside this worker's write scope.
  Root cause: the accepted `node >=22` fix belongs in the native package file,
  but lockfile synchronization requires a root-scope owner.
- The platform package list is documented and tested but not yet declared as
  `optionalDependencies`. Root cause: declaring non-existent platform packages
  would break installs. Mitigation: the loader exposes metadata only and never
  resolves those packages yet.
- Linux libc detection uses Node process reports when available and falls back
  to `musl`. Root cause: this is only diagnostic metadata for an unimplemented
  loader, not a release-grade install detector. Future real loading should use
  package-manager-selected platform packages rather than broad filesystem
  probing.
- Performance impact is negligible in the current state because no native
  module is loaded and no hot React API crosses the boundary.
- Security posture is intentionally conservative: there is no dynamic
  filesystem probing, no postinstall download, no native code execution, and no
  real N-API dependency.

## Proposed follow-up implementation tasks

1. Have a root-scope owner regenerate and review `package-lock.json` after the
   native package engine change.
2. Add real `napi-rs` dependencies only when the binding implementation worker
   is authorized to own lockfile updates.
3. Create real per-platform optional package manifests with exact synchronized
   versions, `os`, `cpu`, and `libc` metadata.
4. Replace the placeholder throw with package-resolution-based loading after at
   least one platform package exists, while preserving the current error shape
   for missing optional dependencies and unsupported platforms.
5. Add install tests for normal install, omitted optional dependencies, and
   unsupported platform behavior across npm, pnpm, and Yarn.
6. Add CI guards that reject direct V8, Node C++, or libuv headers in native
   binding code.
7. Add boundary microbenchmarks before moving any hot public React API through
   N-API.

## Completion checklist

- [x] Read all required worker and progress files first.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Modified only `bindings/node/**`, `crates/fast-react-napi/**`, and this
      worker progress file.
- [x] Did not modify root manifests or lockfiles.
- [x] Did not add N-API dependencies.
- [x] Did not implement real native binding behavior.
- [x] Used a managed subagent to test the implementation hypothesis.
- [x] Added clear package-level native loader failure behavior.
- [x] Documented and tested future platform package metadata.
- [x] Kept the CJS and ESM loaders importable.
- [x] Kept `loadNativeBinding()` loudly unimplemented.
- [x] Added native-loader tests.
- [x] Added Rust native-boundary-specific metadata and errors.
- [x] Kept Rust native exports loudly unimplemented.
- [x] Ran `cargo fmt --all --check`.
- [x] Ran `cargo test -p fast-react-napi --all-features`.
- [x] Ran `node -e "require('./bindings/node/index.cjs')"`.
- [x] Ran an ESM import check for `bindings/node/index.mjs`.
- [x] Ran `npm run check`.
- [x] Reviewed quality, maintainability, performance, and security implications.

## Handoff summary

The native loader boundary now fails closed with useful package-level metadata
instead of a generic placeholder message. CJS and ESM share the same singleton
contract, target/package/artifact names are explicit, the native package engine
matches worker-006's `node >=22` recommendation, and tests verify that no real
platform package or `.node` file is loaded yet.

The Rust `fast-react-napi` crate now owns native-boundary metadata and a
native-specific placeholder error type. It no longer reuses
`UnimplementedReactBehavior`, so native artifact/export failures are separated
from React semantic gaps before real N-API dependencies are introduced.
