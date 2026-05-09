# worker-018-test-renderer-mutation-host

## Objective

Implement a minimal in-memory mutation test renderer in
`crates/fast-react-test-renderer` using the canonical capability-grouped
traits from `fast-react-host-config`. The renderer should prove the host
boundary is implementable without DOM/native behavior and without relying on
the legacy `HostConfig` shim.

Write scope honored:

- `crates/fast-react-test-renderer/**`
- `worker-progress/worker-018-test-renderer-mutation-host.md`

## Sources and commands used

Read first, as required:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-008-renderer-host-config.md`
- `worker-progress/worker-010-initial-scaffold.md`
- `worker-progress/worker-012-host-config-traits.md`

Other local sources inspected:

- `crates/fast-react-host-config/src/lib.rs`
- `crates/fast-react-test-renderer/Cargo.toml`
- `crates/fast-react-test-renderer/src/lib.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `Cargo.toml`
- `worker-progress/README.md`

Representative commands run:

- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '1,260p' worker-progress/worker-008-renderer-host-config.md`
- `sed -n '261,560p' worker-progress/worker-008-renderer-host-config.md`
- `sed -n '1,260p' worker-progress/worker-010-initial-scaffold.md`
- `sed -n '1,260p' worker-progress/worker-012-host-config-traits.md`
- `rg --files crates/fast-react-test-renderer crates/fast-react-host-config worker-progress | sort`
- `rg "render_to_tree_placeholder|TestHostConfig|fast-react-test-renderer|HostConfig" crates packages tests bindings worker-progress -g '!worker-progress/worker-018-test-renderer-mutation-host.md'`
- `cargo test -p fast-react-test-renderer --all-features`
- `cargo fmt --all --check`
- `cargo fmt --all`
- `cargo test --workspace --all-features`
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
- `git diff -- crates/fast-react-test-renderer/Cargo.toml crates/fast-react-test-renderer/src/lib.rs`
- `git status --short`

Delegated checks:

- Spawned one nested read-only explorer subagent to test whether the renderer
  could be implemented entirely in `crates/fast-react-test-renderer/**` using
  canonical traits and no legacy `HostConfig` shim. The explorer confirmed the
  viable shape: `TestRenderer` owns in-memory arenas, public handles remain
  opaque newtypes, snapshots expose inspectable data, and the crate can drop
  its `fast-react-reconciler` dependency. It also identified the main blocker:
  `HostResult<T>` only models `UnsupportedHostCapability`, so graceful
  invalid-handle or missing-child errors would require a future
  `fast-react-host-config` change outside this worker's write scope.

Did not read `ORCHESTRATOR.md`.

## Files changed

- `crates/fast-react-test-renderer/Cargo.toml`
- `crates/fast-react-test-renderer/src/lib.rs`
- `worker-progress/worker-018-test-renderer-mutation-host.md`

## Test renderer implementation summary

- Replaced the placeholder `TestHostConfig` implementation of the legacy
  `HostConfig` shim with `TestRenderer`, a canonical mutation renderer that
  implements:
  - `HostTypes`
  - `HostIdentityAndContext`
  - `HostCreation`
  - `HostCommit`
  - `MutationHost`
- Removed the test-renderer crate's unused dependencies on
  `fast-react-core` and `fast-react-reconciler`.
- Added renderer-owned in-memory storage for containers, instances, and text
  nodes.
- Added opaque public handle types:
  - `TestContainer`
  - `TestInstance`
  - `TestTextInstance`
- Added inspectable snapshot types so tests and future callers can observe the
  in-memory tree without accessing handle internals.
- Added minimal host-owned data types for element names, props, update payloads,
  host context, and commit state.
- Implemented mutation operations:
  - `append_initial_child`
  - `append_child`
  - `append_child_to_container`
  - `insert_before`
  - `insert_in_container_before`
  - `remove_child`
  - `remove_child_from_container`
  - `clear_container`
- Added a global single-parent move invariant for attach operations so moving a
  child handle between parents or between a parent and container detaches it
  from its previous owner instead of duplicating the node in snapshots.
- Implemented basic commit hooks for props updates, text updates,
  hide/unhide, text reset, commit state, and deleted instance detachment.
- Reported exactly mutation capability through `HostCapabilitySet`; persistence,
  hydration, resources, singletons, view transitions, and forms are explicit
  unsupported capability errors via canonical `require_capability()` or default
  host behavior.
- Did not implement real reconciliation, hooks, DOM, React Native, hydration,
  persistence, resources, singletons, diagnostics, or view transitions.

## Verification results

- `cargo test -p fast-react-test-renderer --all-features`: passed.
  - Final result: 11 unit tests passed; doc tests passed.
  - During iteration, the first new test run failed because one assertion
    helper expected all children to be text while the test intentionally used
    mixed element/text children. The assertion was corrected to verify mixed
    child order directly.
- Orchestrator audit found that the initial mutation attach helpers only
  removed an existing handle from the destination child list. That would allow
  moving a child from one parent/container to another while leaving the old
  snapshot link behind. The implementation now detaches the moving child from
  all current owners before each attach, and
  `moving_children_detaches_from_previous_parent_or_container` covers the
  regression.
- `cargo fmt --all --check`: passed after running `cargo fmt --all`.
  - Initial check reported rustfmt-only changes in
    `crates/fast-react-test-renderer/src/lib.rs`.
- `cargo test --workspace --all-features`: passed.
  - Final result: all workspace unit tests and doc tests passed, including the
    11 `fast-react-test-renderer` tests.
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`: passed.

Cargo generated a transient root `Cargo.lock` during verification. It is a
regenerable artifact and was left untracked, not staged into the worker diff.

## Deviations from worker-008 or worker-012 recommendations, if any

- No material deviation from worker-008's capability-grouped, opaque-handle,
  mutation-first recommendation.
- No material deviation from worker-012's follow-up recommendation to migrate
  `fast-react-test-renderer` from the legacy `HostConfig` shim to canonical
  `HostTypes` and capability traits.
- Deliberate breaking change from the initial scaffold: removed
  `TestHostConfig` and `render_to_tree_placeholder()` from the test-renderer
  crate. The root cause was that both existed only to route through the legacy
  `HostConfig` shim and `fast-react-reconciler::render_placeholder`, which this
  worker was explicitly asked not to rely on.

## Risks and root causes

- Invalid handle or missing-child operations currently panic in the test
  renderer. Root cause: the canonical `HostResult<T>` type currently only
  carries `UnsupportedHostCapability`, not renderer operation errors. This is
  acceptable for valid reconciler-driven host operations and focused unit
  tests, but richer diagnostics need a small host-config error extension.
- The renderer proves host operations directly, not reconciliation. Root cause:
  real reconciliation remains intentionally out of scope and is still a
  placeholder in `fast-react-reconciler`.
- Persistence and hydration are not implemented. Root cause: this worker owns
  only mutation-mode proof and is not allowed to change
  `fast-react-host-config` if future capabilities need broader API changes.
- Quality review: the implementation keeps handles opaque, avoids DOM/native
  assumptions, and uses the canonical capability traits rather than adding
  another shim.
- Maintainability review: snapshots separate inspection from storage internals,
  and unsupported features fail through the shared capability mechanism.
- Performance review: arena vectors and copyable handles are suitable for a
  lightweight test renderer and preserve the future monomorphized
  `MutationRenderer` path.
- Security review: no DOM, HTML, script/style, event, FFI, filesystem, or
  network behavior was added.

## Proposed follow-up implementation tasks

1. Extend `fast-react-host-config` with a renderer operation error type, or a
   second result type, if future test renderer callers need graceful invalid
   handle/missing-child diagnostics instead of invariant panics.
2. Finish removing the compatibility-only reconciler placeholder once all
   callers use canonical `HostTypes` plus `MutationRenderer` trait bounds.
3. Add a reconciler-driven smoke path that can build this test renderer's
   in-memory tree once real host effect traversal exists.
4. Add a capability matrix test at the reconciler boundary for mutation-only,
   persistence-only, conflicting modes, and unsupported hydration/resources.
5. Revisit persistence and hydration trait details only after fiber state for
   child sets and dehydrated boundaries exists.

## Completion checklist

- [x] Read required files first.
- [x] Avoided reading `ORCHESTRATOR.md`.
- [x] Modified only files inside the assigned write scope.
- [x] Implemented an in-memory mutation test renderer.
- [x] Used canonical `fast-react-host-config` traits.
- [x] Removed reliance on the legacy `HostConfig` shim from the test renderer.
- [x] Kept host handles opaque and renderer-owned.
- [x] Added explicit unsupported capability behavior for persistence,
      hydration, resources, singletons, view transitions, and forms.
- [x] Added tests for capability reporting.
- [x] Added tests for instance/text creation and snapshots.
- [x] Added tests for append, insert, remove, and clear mutation operations.
- [x] Added coverage that moved children detach from their previous owner
      instead of appearing under two parents or containers.
- [x] Added tests for structured unsupported capability errors.
- [x] Did not implement real reconciliation, hooks, DOM, React Native,
      hydration, persistence, resources, singletons, diagnostics, or view
      transitions.
- [x] Used a nested subagent to test the implementation hypothesis and
      summarized the result.
- [x] Ran `cargo fmt --all --check`.
- [x] Ran `cargo test -p fast-react-test-renderer --all-features`.
- [x] Ran `cargo test --workspace --all-features`.
- [x] Reviewed quality, maintainability, performance, and security
      implications.

## Handoff summary

`fast-react-test-renderer` now contains a minimal canonical mutation renderer
with opaque handles, in-memory tree storage, snapshots, mutation operations,
basic commit hooks, single-parent move behavior, and explicit unsupported
capability behavior. The crate no longer depends on `fast-react-core` or
`fast-react-reconciler`, and it no longer implements or imports the legacy
`HostConfig` shim.

Verification is green for formatting, focused test-renderer tests, full
workspace tests, and targeted clippy.
