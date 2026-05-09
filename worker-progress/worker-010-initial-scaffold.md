# worker-010-initial-scaffold

## Objective

Implement the accepted initial scaffold from worker-003: Cargo and npm
workspaces, placeholder Rust crates, placeholder JS packages, smoke and
conformance placeholders, a CI skeleton, and verification evidence.

## Sources and commands used

- Read first, as required:
  - `WORKER_BRIEF.md`
  - `MASTER_PLAN.md`
  - `MASTER_PROGRESS.md`
  - `worker-progress/worker-001-architecture.md`
  - `worker-progress/worker-002-conformance.md`
  - `worker-progress/worker-003-scaffold.md`
- Did not read `ORCHESTRATOR.md`.
- Inspected current repository shape with `rg --files -g '!ORCHESTRATOR.md'`
  and `git status --short --branch`.
- Checked local toolchain:
  - `cargo --version` -> `cargo 1.95.0`
  - `rustc --version` -> `rustc 1.95.0`
  - `node --version` -> `v26.0.0`
  - `npm --version` -> `11.12.1`
- Used one nested read-only explorer subagent to review scaffold risks before
  implementation. The subagent confirmed the same structural constraints:
  no standalone scheduler crate, no `react-dom` scaffold, N-API isolated to the
  native crate/package boundary, npm workspaces, importable placeholders, and
  loud unimplemented errors.
- Representative commands run:
  - `npm install --package-lock-only --ignore-scripts`
  - `npm ci --package-lock-only --ignore-scripts`
  - `npm ci --ignore-scripts`
  - `cargo fmt --all --check`
  - `cargo fmt --all`
  - `cargo test --workspace --all-features`
  - `cargo clippy --workspace --all-targets --all-features -- -D warnings`
  - `node tests/smoke/import-entrypoints.mjs`
  - `npm run test:conformance`
  - `npm run check`
  - `npm test`
  - `npm run check:js`
  - `cargo metadata --no-deps --format-version 1`
  - `git status --short`

## Files created or changed

- `Cargo.toml`
- `rust-toolchain.toml`
- `package.json`
- `package-lock.json`
- `tsconfig.base.json`
- `.github/workflows/ci.yml`
- `crates/fast-react-core/Cargo.toml`
- `crates/fast-react-core/src/lib.rs`
- `crates/fast-react-host-config/Cargo.toml`
- `crates/fast-react-host-config/src/lib.rs`
- `crates/fast-react-reconciler/Cargo.toml`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-test-renderer/Cargo.toml`
- `crates/fast-react-test-renderer/src/lib.rs`
- `crates/fast-react-napi/Cargo.toml`
- `crates/fast-react-napi/src/lib.rs`
- `bindings/node/package.json`
- `bindings/node/index.cjs`
- `bindings/node/index.mjs`
- `bindings/node/README.md`
- `packages/react/package.json`
- `packages/react/index.js`
- `packages/react/jsx-runtime.js`
- `packages/react/jsx-dev-runtime.js`
- `packages/react/compiler-runtime.js`
- `packages/react/README.md`
- `tests/conformance/package.json`
- `tests/conformance/README.md`
- `tests/smoke/import-entrypoints.mjs`
- `worker-progress/worker-010-initial-scaffold.md`

## Scaffold implementation summary

- Added a root virtual Cargo workspace with resolver `3`, edition `2024`, Rust
  `1.95.0`, and the five accepted members: `fast-react-core`,
  `fast-react-host-config`, `fast-react-reconciler`,
  `fast-react-test-renderer`, and `fast-react-napi`.
- Added placeholder Rust crates that compile and test. The crates define only
  compatibility targets, boundary traits, placeholder render/scheduler/native
  functions, and explicit `UnimplementedReactBehavior` errors.
- Kept scheduler as an internal `fast-react-reconciler::scheduler` placeholder;
  no standalone scheduler crate was created.
- Added a root npm workspace using npm workspaces for `packages/*`,
  `bindings/*`, and `tests/*`.
- Added `@fast-react/native` under `bindings/node` with CJS and ESM loader
  placeholders. The loaders import successfully and throw a typed error only
  when `loadNativeBinding()` is called.
- Added `@fast-react/react` under `packages/react` with accepted subpaths `.`,
  `./jsx-runtime`, `./jsx-dev-runtime`, `./compiler-runtime`, and
  `./package.json`. Entrypoints import successfully; React behavior functions
  throw explicit unimplemented errors.
- Added a smoke import check that imports CJS and ESM entrypoints by file path,
  and also checks package specifiers when npm workspace links exist.
- Added `@fast-react/conformance` as a placeholder package documenting the
  future dual-run React oracle strategy.
- Added a CI skeleton with separate Rust, JS install/smoke, and conformance
  placeholder jobs.

## Verification results

- `cargo fmt --all --check`
  - Initial run found two rustfmt-only deltas.
  - Ran `cargo fmt --all`.
  - Re-ran `cargo fmt --all --check`: passed.
- `cargo test --workspace --all-features`: passed.
  - 10 Rust unit tests passed across the five crates.
  - Doc tests passed for all five crates.
- `cargo clippy --workspace --all-targets --all-features -- -D warnings`:
  passed.
- `npm install --package-lock-only --ignore-scripts`: passed and produced
  `package-lock.json`.
- `npm ci --package-lock-only --ignore-scripts`: passed and validated the
  lockfile without installing packages.
- `npm ci --ignore-scripts`: passed and created workspace links; removed
  `node_modules` after the smoke check to keep the worktree clean.
- `node tests/smoke/import-entrypoints.mjs`: passed before and after npm
  workspace links existed.
- `npm run test:conformance`: passed; it prints the conformance placeholder
  message and does not claim real conformance.
- `npm run check`: passed after fixing root script wiring so the smoke check is
  actually executed.
- `npm test`: passed; it ran Rust workspace tests and workspace package tests.
- npm printed warnings about a local `minimum-release-age` npm config being
  unknown. Root cause: local npm configuration, not the scaffold. The warnings
  did not affect installation, lockfile generation, smoke checks, or tests.
- Cargo commands generated transient `Cargo.lock` and `target/` artifacts.
  `Cargo.lock` is outside this worker's write scope, so it was removed after
  verification. `target/` was also removed after verification.

## Deviations from worker-003 recommendation, if any

- `fast-react-napi` is a `cdylib`/`rlib` boundary crate but does not depend on
  `napi` or `napi-rs` yet. This is intentional for the initial scaffold:
  adding a native binding dependency now would freeze a binding choice before
  worker-006 is accepted and would require lockfile handling outside the
  assigned Cargo write scope.
- The smoke test goes beyond the minimal file import check by also validating
  package specifiers when npm workspace links exist. This catches package
  export map mistakes without requiring `node_modules` to remain in the final
  worktree.
- No `Cargo.lock` is committed because it is not in this worker's write scope,
  even though Cargo generates it during verification.

## Risks and root causes

- Real React behavior is not implemented. Root cause: this worker owns only the
  initial scaffold. Mitigation: every placeholder behavior path throws an
  explicit unimplemented error, and the conformance package says it is a
  placeholder.
- Native binding behavior is not implemented. Root cause: N-API ownership,
  panic handling, JS handle lifetime, and binary artifact policy need their own
  accepted design. Mitigation: native loading is isolated to `bindings/node` and
  `fast-react-napi`; `loadNativeBinding()` fails loudly.
- Cargo lockfile tracking is unresolved. Root cause: Cargo generates
  `Cargo.lock` for workspace verification, but this worker's write scope does
  not include it. Mitigation: generated lockfiles were removed after
  verification; a future root-manifest owner should decide whether to track
  `Cargo.lock`.
- Package export compatibility is only a smoke check. Root cause: full React
  package resolution behavior requires the worker-004 inventory and the future
  dual-run conformance harness. Mitigation: accepted subpaths exist and import
  through CJS/ESM smoke paths.
- CI is a skeleton, not proven on GitHub Actions in this worktree. Root cause:
  local verification can prove commands but not hosted runner availability.
  Mitigation: the workflow uses the same local commands that passed here.

## Proposed follow-up implementation tasks

1. Decide whether root `Cargo.lock` should be added by a future root-manifest
   owner.
2. Accept worker-006 binding strategy, then add real N-API dependencies and
   native export wiring in `fast-react-napi` and `bindings/node`.
3. Implement `fast-react-core` element/tag primitives with oracle-backed tests
   for `createElement`, JSX runtimes, key/ref behavior, and dev/prod object
   shapes.
4. Define the first concrete `fast-react-host-config` trait groups after
   worker-008 host-boundary recommendations are accepted.
5. Build the deterministic test renderer and reconciler proof only after the
   initial fiber/lane/update model is accepted.
6. Replace the conformance placeholder with a dual-run harness that aliases
   Fast React to React public entrypoints and compares normalized observations.
7. Add TypeScript declaration strategy for `@fast-react/react` after the public
   API inventory is accepted.
8. Add `react-dom` only after host-config and test-renderer semantics are
   proven.

## Completion checklist

- [x] Read required source/progress files first.
- [x] Avoided reading `ORCHESTRATOR.md`.
- [x] Created the root Cargo virtual workspace with resolver `3`.
- [x] Set workspace edition `2024` and Rust version `1.95.0`.
- [x] Added all five accepted Rust crates.
- [x] Added npm workspaces using npm, not pnpm.
- [x] Added `package-lock.json` through npm.
- [x] Added `rust-toolchain.toml`.
- [x] Added `tsconfig.base.json`.
- [x] Added `bindings/node` CJS and ESM loader placeholders.
- [x] Added `packages/react` accepted subpaths.
- [x] Added smoke import checks for React package entrypoints.
- [x] Added conformance placeholder package and README strategy.
- [x] Added CI skeleton for Rust checks, JS install/smoke, and conformance.
- [x] Kept real React behavior unimplemented and explicit.
- [x] Did not add `packages/react-dom`.
- [x] Did not add a standalone scheduler crate.
- [x] Used a nested subagent to test scaffold hypotheses and summarized it.
- [x] Ran `cargo fmt --all --check`.
- [x] Ran `cargo test --workspace --all-features`.
- [x] Ran npm commands to produce and validate `package-lock.json`.
- [x] Ran smoke import checks.
- [x] Reviewed quality, maintainability, performance, and security risks.
- [x] Final changed files are inside the assigned write scope.

## Handoff summary

Implemented the initial Fast React scaffold accepted from worker-003. The repo
now has a Rust workspace, npm workspace, importable React package placeholders,
native binding loader placeholders, a conformance placeholder, smoke checks, and
CI skeleton jobs.

Changed files:

- `Cargo.toml`
- `rust-toolchain.toml`
- `package.json`
- `package-lock.json`
- `tsconfig.base.json`
- `.github/workflows/ci.yml`
- `crates/fast-react-core/**`
- `crates/fast-react-host-config/**`
- `crates/fast-react-reconciler/**`
- `crates/fast-react-test-renderer/**`
- `crates/fast-react-napi/**`
- `bindings/node/**`
- `packages/react/**`
- `tests/conformance/**`
- `tests/smoke/**`
- `worker-progress/worker-010-initial-scaffold.md`

Commands run:

- `npm install --package-lock-only --ignore-scripts`
- `npm ci --package-lock-only --ignore-scripts`
- `npm ci --ignore-scripts`
- `cargo fmt --all --check`
- `cargo fmt --all`
- `cargo test --workspace --all-features`
- `cargo clippy --workspace --all-targets --all-features -- -D warnings`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run test:conformance`
- `npm run check`
- `npm test`
- `npm run check:js`
- `cargo metadata --no-deps --format-version 1`

Unresolved risks and follow-up tasks:

- Decide whether to track `Cargo.lock`.
- Implement real N-API dependencies only after the binding strategy is accepted.
- Replace placeholders with conformance-backed React semantics in later
  workers.
- Keep `react-dom` and scheduler extraction deferred until their boundaries are
  proven by accepted research and tests.
