# worker-003-scaffold

## Objective

Propose the initial repository scaffold for Fast React without implementing project code.

This proposal covers:

- Cargo workspace layout.
- JavaScript package layout.
- Rust-to-JavaScript binding strategy.
- Local developer commands and CI-ready test boundaries.
- Git worktree task splits that avoid overlapping writes.

## Summary

Recommend a minimal but explicit scaffold: a Rust workspace split into core, host-config, reconciler, test-renderer, and N-API crates; npm workspaces for the React compatibility wrapper, native addon loader, and conformance tests; N-API first with WASM deferred; and one scaffold/merge owner for root manifests. Do not create a standalone scheduler crate or broad `react-dom` package yet, because both would freeze unproven boundaries.

## Sources and commands used

Project files read:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `docs/tasks/worker-003-scaffold.prompt.md`
- `docs/tasks/worker-001-architecture.prompt.md`
- `docs/tasks/worker-002-conformance.prompt.md`
- `docs/tasks/worker-prompt-template.md`
- `scripts/run-worker.sh`
- `worker-progress/README.md`

Project files intentionally not read:

- `ORCHESTRATOR.md`

Commands run:

- `pwd && ls`
- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `rg --files -g '!ORCHESTRATOR.md'`
- `git status --short`
- `find worker-progress -maxdepth 2 -type f -print`
- `find docs scripts -maxdepth 2 -type f -print`
- `sed -n '1,220p' worker-progress/README.md`
- `sed -n '1,260p' docs/tasks/worker-003-scaffold.prompt.md`
- `sed -n '1,240p' docs/tasks/worker-prompt-template.md`
- `sed -n '1,220p' scripts/run-worker.sh`
- `cargo --version`
- `rustc --version`
- `node --version`
- `npm --version`
- `pnpm --version`
- `git branch --show-current`
- `node -p "process.versions.napi"`
- `git worktree list`
- `find . -maxdepth 2 -name Cargo.toml -o -name package.json -o -name pnpm-workspace.yaml -o -name package-lock.json`
- `git log --oneline --max-count=5`
- `sed -n '1,260p' docs/tasks/worker-001-architecture.prompt.md`
- `sed -n '1,260p' docs/tasks/worker-002-conformance.prompt.md`
- `ls -la`
- `npm view react@19.2.6 exports --json`
- `npm view react-dom@19.2.6 exports --json`
- `npm view @napi-rs/cli version`
- `grep -nP '[^\x00-\x7F]' worker-progress/worker-003-scaffold.md || true` (macOS `grep` rejected `-P`; replaced by Perl check below)
- `sed -n '1,260p' worker-progress/worker-003-scaffold.md`
- `git diff -- worker-progress/worker-003-scaffold.md`
- `perl -ne 'print "$.: $_" if /[^\x00-\x7F]/' worker-progress/worker-003-scaffold.md`
- `rg -n '^## ' worker-progress/worker-003-scaffold.md`
- `sed -n '240,520p' worker-progress/worker-003-scaffold.md`
- `wc -l worker-progress/worker-003-scaffold.md`
- `sed -n '35,75p' worker-progress/worker-003-scaffold.md`
- `rg -n '^(## Objective|## Summary|## Sources and commands used|## Proposed repository layout|## Cargo workspace recommendation|## JS package and binding recommendation|## Local commands and CI checks|## Worktree task split|## Files that should be created in the next implementation task|## Major risks and root causes|## Proposed follow-up implementation tasks|## Completion checklist|## Handoff summary)' worker-progress/worker-003-scaffold.md`

Observed local toolchain:

- `cargo 1.95.0`
- `rustc 1.95.0`
- `node v26.0.0`
- `npm 11.12.1`
- `pnpm` is not installed.
- Node reports `process.versions.napi` as `10`.
- Current branch is `worker/003-scaffold`.
- Existing worktrees are `main`, `worker/001-architecture`, `worker/002-conformance`, and `worker/003-scaffold`.
- No `Cargo.toml`, `package.json`, `pnpm-workspace.yaml`, or lockfile exists yet.

External references checked:

- Official Cargo workspace reference: virtual workspaces need an explicit resolver.
- Official npm workspaces docs: npm workspaces manage multiple local packages from a root `package.json`.
- Official Node-API docs: Node-API is stable and ABI-stable across Node versions.
- NAPI-RS CLI docs and npm metadata: `@napi-rs/cli` builds Rust code into `.node` addon output; current npm version observed as `3.6.2`.
- npm package metadata for `react@19.2.6` and `react-dom@19.2.6` export maps.

Nested delegated checks:

- Delegated a read-only Cargo workspace boundary review to a nested explorer. Result: recommend `core`, `host-config`, `reconciler`, `test-renderer`, and N-API binding crates; keep scheduler internal to the reconciler until the lane/update/work-loop boundary is proven reusable.
- Delegated a read-only JS package, binding, CI, and worktree split review to a nested explorer. Result: recommend npm workspaces, N-API first, thin JS wrappers around native functions, separate conformance tests, and one scaffold owner for root manifests.
- I used both checks. Where they disagreed on pnpm vs npm, I recommend npm workspaces initially because npm is installed locally, npm workspaces are sufficient for the first scaffold, and adopting pnpm before a concrete need would add a toolchain dependency without solving a root architectural problem.

## Proposed repository layout

Recommended first scaffold:

```text
.
|-- .github/
|   `-- workflows/
|       `-- ci.yml
|-- bindings/
|   `-- node/
|       |-- package.json
|       |-- index.cjs
|       |-- index.mjs
|       `-- README.md
|-- crates/
|   |-- fast-react-core/
|   |   |-- Cargo.toml
|   |   `-- src/lib.rs
|   |-- fast-react-host-config/
|   |   |-- Cargo.toml
|   |   `-- src/lib.rs
|   |-- fast-react-reconciler/
|   |   |-- Cargo.toml
|   |   `-- src/lib.rs
|   |-- fast-react-test-renderer/
|   |   |-- Cargo.toml
|   |   `-- src/lib.rs
|   `-- fast-react-napi/
|       |-- Cargo.toml
|       `-- src/lib.rs
|-- packages/
|   `-- react/
|       |-- package.json
|       |-- index.js
|       |-- jsx-runtime.js
|       |-- jsx-dev-runtime.js
|       |-- compiler-runtime.js
|       `-- README.md
|-- tests/
|   |-- conformance/
|   |   |-- package.json
|   |   `-- README.md
|   `-- smoke/
|       `-- import-entrypoints.mjs
|-- Cargo.toml
|-- package.json
|-- package-lock.json
|-- rust-toolchain.toml
`-- tsconfig.base.json
```

Defer these until the corresponding implementation questions are answered:

- `packages/react-dom/`: do not scaffold beyond a reserved plan yet. The `react-dom@19.2.6` export map is much wider than `react` and includes client, server, static, profiling, test-utils, and environment-specific entries. Creating a package too early will invite stub compatibility that does not prove renderer semantics.
- `crates/fast-react-scheduler/`: keep scheduling inside `fast-react-reconciler::scheduler` initially. The root cause is semantic coupling: lanes, update queues, hooks, batching, transitions, and work-loop behavior share invariants. Extract only after tests show a stable boundary.
- Browser WASM packages: defer until Node conformance and native ownership boundaries are working.

## Cargo workspace recommendation

Use a virtual Cargo workspace at the repository root:

```toml
[workspace]
resolver = "3"
members = [
  "crates/fast-react-core",
  "crates/fast-react-host-config",
  "crates/fast-react-reconciler",
  "crates/fast-react-test-renderer",
  "crates/fast-react-napi",
]

[workspace.package]
edition = "2024"
rust-version = "1.95.0"
# Add license once project publishing policy is decided.

[workspace.dependencies]
```

Recommended crate responsibilities:

- `fast-react-core`: React value model only. Elements, keys, refs, owner metadata strategy, symbols or symbol-equivalent tags, shared errors, shared IDs, and data structures that have no renderer, fiber, or JS FFI dependency.
- `fast-react-host-config`: renderer boundary traits and shared host types. It should depend on `fast-react-core`, not on DOM or Node.
- `fast-react-reconciler`: fiber nodes, lanes, hook state, context propagation, update queues, render and commit phases, and an internal scheduler module. It depends on `core` and `host-config`.
- `fast-react-test-renderer`: deterministic in-memory renderer for Rust-side reconciliation tests and later conformance probes. It depends on `core`, `host-config`, and `reconciler`.
- `fast-react-napi`: `cdylib` crate for Node-API exports. It is the only Rust crate allowed to depend on N-API crates. It should catch panics at the FFI boundary and convert Rust errors to JavaScript exceptions.

Workspace rules:

- Keep `core` free of `napi`, DOM concepts, timers, async runtime dependencies, and renderer mutation APIs.
- Keep `host-config` free of concrete DOM/native implementations.
- Keep `reconciler` generic over host behavior rather than importing Node or browser concerns.
- Keep all N-API-specific ownership, lifetime, and exception translation in `fast-react-napi`.
- Use workspace dependencies from the root to prevent version drift.
- Add a separate scheduler crate only when an implementation can prove the API is stable under lane, transition, hook, and update queue tests.

## JS package and binding recommendation

Use npm workspaces initially:

```json
{
  "private": true,
  "workspaces": [
    "packages/*",
    "bindings/*",
    "tests/*"
  ]
}
```

Reasons:

- npm is already installed locally; pnpm is not.
- npm workspaces are enough for linking package wrappers, the native binding package, and conformance tests.
- Avoiding pnpm now reduces setup friction and root lockfile churn. If release packaging later needs pnpm's workspace or filtering behavior, that should be a deliberate breaking tooling change with evidence.

Package boundaries:

- `bindings/node`: private npm package, recommended name `@fast-react/native`, responsible for loading the `.node` addon built from `crates/fast-react-napi`. It should expose a small, stable JS loader surface and hide platform-specific loading details.
- `packages/react`: compatibility wrapper, recommended internal package name `@fast-react/react` until publishing policy is decided. Its export map should mirror `react@19.2.6`: `.`, `./jsx-runtime`, `./jsx-dev-runtime`, `./compiler-runtime`, and `./package.json`, including `react-server` conditions where supported.
- `tests/conformance`: executable behavior comparison package. It should be able to import the real `react@19.2.6` oracle and the Fast React candidate through explicit aliases.

Binding strategy:

- Use N-API first through NAPI-RS.
- Keep JS wrappers around native functions; do not expose raw native symbols directly as the public React package API.
- The wrapper owns module format, conditional exports, dev/prod routing, feature flags, and error messages.
- The native addon owns fast paths and Rust object handles, but JavaScript-visible object identity, thrown thenables/errors, and symbol behavior must be tested at the JS wrapper boundary.
- Defer WASM. WASM may be useful for browser distribution later, but it does not solve the first root problem: React-compatible semantics under Node tests with correct object identity, scheduler callbacks, and exception behavior.

Compatibility package naming:

- Do not publish a package named `react`.
- Use `@fast-react/react` or `fast-react` as the publishable package.
- For conformance, alias the candidate to `react` in test fixtures when the test needs drop-in import behavior. That tests compatibility without creating package-name ambiguity.

## Local commands and CI checks

Recommended local commands after the scaffold exists:

```sh
npm ci
npm run check
npm run test
npm run test:conformance
cargo fmt --all --check
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo test --workspace --all-features
npm run build:native --workspace @fast-react/native
node tests/smoke/import-entrypoints.mjs
```

Recommended root npm scripts:

```json
{
  "scripts": {
    "check": "npm run check:rust && npm run check:js --workspaces --if-present",
    "check:rust": "cargo fmt --all --check && cargo clippy --workspace --all-targets --all-features -- -D warnings",
    "test": "cargo test --workspace --all-features && npm test --workspaces --if-present",
    "test:conformance": "npm test --workspace @fast-react/conformance",
    "build:native": "npm run build --workspace @fast-react/native"
  }
}
```

CI-ready boundaries:

- Rust formatting and clippy job: no Node required.
- Rust unit test job: no Node required except tests inside `fast-react-napi`; if that crate needs Node at test time, put those checks in the binding job instead of contaminating the whole Rust job.
- Native binding build job: Node plus Rust required; builds `crates/fast-react-napi` through `bindings/node`.
- JS package smoke job: imports every exported `packages/react` subpath in both CJS and ESM where applicable.
- Conformance job: runs candidate-vs-oracle behavior tests against pinned `react@19.2.6`.
- Benchmark job: non-blocking until conformance gates exist. Performance numbers are not meaningful if they measure missing semantics.

Initial smoke checks should cover:

- `import "@fast-react/react"`
- `import "@fast-react/react/jsx-runtime"`
- `import "@fast-react/react/jsx-dev-runtime"`
- `import "@fast-react/react/compiler-runtime"`
- `require("@fast-react/react")`
- Candidate alias resolution as `react` inside conformance fixtures.

## Worktree task split

Root cause of likely merge conflicts: root manifests and shared CI files are singleton files. They must have one owner per change window.

Recommended split:

- Scaffold worker owns only the initial root files and empty/minimal manifests: `Cargo.toml`, `package.json`, `package-lock.json`, `rust-toolchain.toml`, `.github/workflows/ci.yml`, `tsconfig.base.json`, `crates/*/Cargo.toml`, `crates/*/src/lib.rs`, `bindings/node/*`, `packages/react/*`, and `tests/*` skeleton files.
- Core worker owns `crates/fast-react-core/**`.
- Host-config worker owns `crates/fast-react-host-config/**`.
- Reconciler worker owns `crates/fast-react-reconciler/**`.
- Test-renderer worker owns `crates/fast-react-test-renderer/**`.
- N-API worker owns `crates/fast-react-napi/**` and `bindings/node/**`.
- React package wrapper worker owns `packages/react/**`.
- Conformance worker owns `tests/conformance/**` and may add test fixtures under `tests/fixtures/**` if assigned.
- CI worker owns `.github/workflows/**` and root scripts only after the initial scaffold has merged.
- Merge worker owns root manifest updates when multiple workers need dependency or workspace changes.

Rules for implementation worktrees:

- No worker other than the current scaffold or merge owner should edit root `Cargo.toml`, root `package.json`, lockfiles, or CI files.
- If a crate needs a new shared dependency, record it in that worker's progress report and let the merge/scaffold owner update `[workspace.dependencies]`.
- If a JS package needs a new root dev dependency, record it and let the root manifest owner update it.
- Keep conformance tests out of crate directories; keep Rust unit tests out of JS package directories.

## Files that should be created in the next implementation task

Create only scaffold and placeholder files, not real React implementation code:

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

The placeholder source files should compile and import, but they should fail clearly for unimplemented React behavior. Silent partial behavior would hide compatibility gaps.

## Major risks and root causes

- Risk: over-splitting scheduler into its own crate too early.
  Root cause: scheduler behavior is not independent from lanes, updates, hooks, transitions, and work-loop semantics yet. A premature crate boundary would freeze guesses as API.

- Risk: under-splitting renderer host config.
  Root cause: without a host-config crate, DOM/native assumptions will leak into the core and reconciler, violating the project's renderer-independent mission.

- Risk: JS package identity and module resolution bugs.
  Root cause: React compatibility depends on singleton-like dispatcher state, symbols, subpath exports, and exact import behavior. A native implementation can pass Rust unit tests while failing real package resolution.

- Risk: N-API memory and panic unsafety.
  Root cause: Rust ownership and JavaScript garbage collection have different lifetime models. Native boundaries must avoid raw JS handles escaping Rust lifetimes, catch panics, and convert errors deliberately.

- Risk: benchmark-driven false progress.
  Root cause: a fast implementation with missing semantics will beat React for the wrong reason. Benchmarks should not gate until conformance has meaningful coverage.

- Risk: root manifest conflicts across worktrees.
  Root cause: Cargo and npm workspace definitions are singleton files touched by many tasks. Assign a single owner or merge worker for root changes.

- Risk: `react-dom` stubs become misleading.
  Root cause: `react-dom` has multiple environment-specific entrypoints and renderer semantics. A broad package scaffold before host behavior exists would create compatibility theater.

Quality, maintainability, performance, and security review:

- Quality: the scaffold separates semantic crates from FFI and package wrappers, so tests can target root behavior instead of accidental integration details.
- Maintainability: workspace dependencies and one root manifest owner reduce dependency drift and merge conflicts.
- Performance: N-API first is appropriate for Node conformance and native benchmarks; scheduler extraction is deferred until evidence supports it.
- Security: FFI is isolated to one crate/package boundary, making panic handling, unsafe code review, native loading, and platform binary policy auditable.

## Proposed follow-up implementation tasks

1. Create the scaffold files listed above in a single worktree and verify `cargo fmt`, `cargo test`, `npm ci`, and import smoke checks.
2. Implement `fast-react-core` element primitives and tags with tests against observed React `createElement` and JSX runtime behavior.
3. Define `fast-react-host-config` traits with a minimal in-memory host target and no DOM assumptions.
4. Add the first `fast-react-test-renderer` proof that a host implementation can render a simple element tree through the reconciler boundary.
5. Add `bindings/node` and `fast-react-napi` smoke exports with explicit panic-to-JS-error conversion tests.
6. Add `packages/react` entrypoint wrappers that mirror the `react@19.2.6` export map and fail loudly for unimplemented APIs.
7. Create the conformance harness with a pinned React oracle and candidate aliasing.
8. Add CI after the scaffold and first smoke tests are stable.
9. Re-evaluate whether a standalone scheduler crate is justified after lane/update/hook tests exist.
10. Re-evaluate `packages/react-dom` only after the host-config and test-renderer boundaries are proven.

## Completion checklist

- [x] Read required worker files.
- [x] Avoided reading `ORCHESTRATOR.md`.
- [x] Used nested managed agents to test scaffold hypotheses.
- [x] Summarized delegated checks and how they affected conclusions.
- [x] Checked current repository shape.
- [x] Checked local Rust and Node toolchain availability.
- [x] Checked current React and React DOM export maps through npm metadata.
- [x] Proposed Cargo workspace layout.
- [x] Proposed JS package layout.
- [x] Proposed N-API-first binding strategy.
- [x] Proposed local commands and CI-ready boundaries.
- [x] Proposed worktree-safe implementation split.
- [x] Listed files for the next implementation task.
- [x] Reviewed quality, maintainability, performance, and security implications.
- [x] Modified only `worker-progress/worker-003-scaffold.md`.

## Handoff summary

Recommended scaffold: a Cargo workspace with `fast-react-core`, `fast-react-host-config`, `fast-react-reconciler`, `fast-react-test-renderer`, and `fast-react-napi`; npm workspaces for `packages/react`, `bindings/node`, and conformance/smoke tests; N-API first with WASM deferred; scheduler kept internal until its API is proven.

Changed files:

- `worker-progress/worker-003-scaffold.md`

Commands run:

- Listed in the "Sources and commands used" section.

Unresolved risks and follow-up tasks:

- Architecture and conformance workers may refine crate boundaries; reconcile before implementation.
- Publishing name policy is unresolved: prefer `@fast-react/react` or `fast-react`, with test aliasing to `react`.
- `react-dom` should remain deferred until renderer semantics are proven.
- Scheduler extraction should remain deferred until lane/update/hook tests prove a stable API.
- Native binary packaging and prebuild policy are not decided; first prove local N-API build and import behavior.
