# worker-019-reconciler-host-boundary-migration

## Objective

Move the reconciler placeholder API toward the canonical host-config traits. The
reconciler should stop depending on the legacy `HostConfig` shim where feasible
and expose clear mutation-renderer entry points or blockers for the next
reconciliation implementation step.

Write scope honored: only `crates/fast-react-reconciler/**` and this progress
file were modified.

## Sources and commands used

Read first, as required:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-007-scheduler-fiber.md`
- `worker-progress/worker-008-renderer-host-config.md`
- `worker-progress/worker-010-initial-scaffold.md`
- `worker-progress/worker-012-host-config-traits.md`

Other local sources inspected:

- `crates/fast-react-reconciler/Cargo.toml`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-host-config/src/lib.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- `crates/fast-react-core/src/lib.rs`

Representative commands run:

- `rg --files crates/fast-react-reconciler worker-progress | sort`
- `sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs`
- `sed -n '1,320p' crates/fast-react-host-config/src/lib.rs`
- `sed -n '320,760p' crates/fast-react-host-config/src/lib.rs`
- `sed -n '760,1040p' crates/fast-react-host-config/src/lib.rs`
- `sed -n '1,240p' crates/fast-react-test-renderer/src/lib.rs`
- `rg -n "HostConfig|MutationRenderer|HostIdentityAndContext|render_placeholder|fast_react_reconciler" crates -g '*.rs'`
- `cargo fmt --all`
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo test --workspace --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff -- crates/fast-react-reconciler/src/lib.rs`
- `git status --short --untracked-files=all`

Delegated checks:

- Spawned a read-only explorer to test the migration and blocker risks. It
  confirmed that the reconciler diff removes the legacy `HostConfig` import,
  adds a canonical `MutationRenderer`-bounded entry point, and correctly leaves
  `fast-react-test-renderer` migration as an out-of-scope blocker. It also
  recommended compile-fail coverage and clearer mutation/persistence validation;
  both recommendations were implemented.
- Spawned a second read-only explorer for an independent hypothesis check. It
  did not return before final implementation decisions were needed and was
  shut down; no conclusions from that agent were used.

Did not read `ORCHESTRATOR.md`.

## Files changed

- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-019-reconciler-host-boundary-migration.md`

## Reconciler host-boundary migration summary

- Removed the reconciler crate's direct dependency on the legacy
  `fast_react_host_config::HostConfig` shim.
- Added `render_mutation_placeholder<H: MutationRenderer>()` as the canonical
  public placeholder entry point for mutation renderers.
- Added `validate_mutation_renderer_boundary<H: MutationRenderer>()` to enforce
  that a mutation renderer declares exactly the mutation tree update mode before
  future reconciliation work proceeds.
- Added `ReconcilerError` and `ReconcilerResult<T>` so future reconciler entry
  points can distinguish loud unimplemented React behavior from host-boundary
  capability failures.
- Preserved the existing `render_placeholder()` symbol as a compatibility-only
  scaffold function because `fast-react-test-renderer` still calls it and that
  crate is outside this worker's write scope.
- Added unit tests using a canonical in-crate mutation test host that implements
  `HostTypes`, `HostIdentityAndContext`, `HostCreation`, `HostCommit`, and
  `MutationHost`.
- Added a `compile_fail` doctest proving a type that only implements legacy
  `HostConfig` cannot call the canonical mutation placeholder entry point.
- Kept real rendering, fiber reconciliation, hooks, scheduler heaps, DOM,
  React Native, hydration, and persistence behavior unimplemented.

## Verification results

- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-reconciler --all-features`: passed.
  - 6 reconciler unit tests passed.
  - 1 reconciler compile-fail doctest passed.
- `cargo test --workspace --all-features`: passed.
  - 33 workspace unit tests passed across the five Rust crates.
  - 1 reconciler compile-fail doctest passed.
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`: passed.

Cargo generated a transient root `Cargo.lock` during verification. It was
removed afterward because it is outside this worker's write scope and would
otherwise pollute the scoped status. Ignored `target/` build output remains.

## Deviations from worker-007, worker-008, or worker-012 recommendations, if any

- No material deviation from worker-008 or worker-012: the new reconciler
  mutation entry point uses the canonical capability-grouped traits and keeps
  host handles opaque.
- No material deviation from worker-007's scheduler/fiber guidance: scheduler
  behavior remains a loud placeholder and no simplified fiber, lane, queue, or
  commit model was introduced.
- Deliberate temporary deviation from the ideal migration end state:
  `render_placeholder()` remains as a compatibility-only function because the
  current `fast-react-test-renderer` still uses the legacy shim and that crate
  cannot be modified by this worker.
- Blocker documented for the next real render entry point: worker-007 and
  worker-008 imply real root rendering will need host scheduling/event-priority
  hooks. Worker-012's current `MutationRenderer` aggregate does not include
  `HostScheduling`, so the first real root API should introduce a reconciler
  aggregate such as `MutationReconcilerHost: MutationRenderer + HostScheduling`
  or update the host-config aggregate in a scoped follow-up.

## Risks and root causes

- Real render behavior is still unimplemented. Root cause: this worker owns
  only the host-boundary migration placeholder, not fiber reconciliation,
  update queues, commit traversal, hooks, scheduler heaps, DOM, native,
  hydration, or persistence.
- The legacy shim still exists in the workspace through
  `fast-react-host-config` and `fast-react-test-renderer`. Root cause:
  dependent crates are outside this worker's write scope. Mitigation:
  `fast-react-reconciler` no longer imports `HostConfig`, and the new
  canonical entry point rejects legacy-only hosts at compile time.
- `MutationRenderer` does not yet include host scheduling. Root cause:
  worker-012 intentionally kept trait groups separate before a real reconciler
  caller existed. Mitigation: the current mutation placeholder validates only
  tree-update capability and documents the scheduling aggregate blocker.
- Current tests prove the public placeholder boundary and capability failures,
  not React reconciliation semantics. Root cause: semantic implementation is
  intentionally deferred.
- Quality review: the new error type keeps host-boundary failures separate from
  unimplemented React behavior and avoids collapsing capability errors into
  generic placeholders.
- Maintainability review: the canonical entry point uses compile-time trait
  bounds and a small validation helper rather than dynamic dispatch or fake
  no-op host methods.
- Performance review: the boundary keeps the monomorphized `MutationRenderer`
  path open for hot reconciler work; no allocation-heavy scheduler/fiber
  structures were added.
- Security review: renderer-owned host handles remain opaque, and no DOM,
  native, event, hydration, resource, or callback lifetime behavior was added.

## Proposed follow-up implementation tasks

1. Migrate `fast-react-test-renderer` from the legacy `HostConfig` shim to the
   canonical `HostTypes` and `MutationRenderer` traits.
2. Mark or remove the compatibility-only `render_placeholder()` once all
   dependent scaffold crates call `render_mutation_placeholder()`.
3. Define the first real reconciler host bound, likely
   `MutationReconcilerHost: MutationRenderer + HostScheduling`, before adding
   root scheduling or event priority behavior.
4. Add reconciler root and host container placeholder types that carry opaque
   host containers without exposing renderer internals.
5. Add future capability tests for persistence and hydration blockers once
   those entry points exist, without implementing their behavior prematurely.

## Completion checklist

- [x] Read required files first.
- [x] Avoided reading `ORCHESTRATOR.md`.
- [x] Modified only `crates/fast-react-reconciler/**` and this progress file.
- [x] Stopped direct reconciler imports of the legacy `HostConfig` shim.
- [x] Added a mutation-renderer placeholder entry point using canonical host
      trait bounds.
- [x] Preserved loud unimplemented behavior for real rendering.
- [x] Preferred compile-time trait bounds over dynamic dispatch.
- [x] Added tests proving the canonical placeholder API uses canonical host
      trait bounds.
- [x] Added compile-fail coverage proving legacy-only `HostConfig` is rejected
      by the canonical mutation entry point.
- [x] Documented blockers requiring changes outside this worker's write scope.
- [x] Did not modify `fast-react-host-config` or `fast-react-test-renderer`.
- [x] Did not implement full fiber reconciliation, hooks, scheduler heaps, DOM,
      React Native, hydration, or persistence behavior.
- [x] Used nested subagents to test hypotheses and summarized the useful result.
- [x] Ran `cargo fmt --all --check`.
- [x] Ran `cargo test -p fast-react-reconciler --all-features`.
- [x] Ran `cargo test --workspace --all-features`.
- [x] Reviewed quality, maintainability, performance, and security
      implications.

## Handoff summary

`fast-react-reconciler` now exposes a canonical mutation-renderer placeholder
entry point bounded on `MutationRenderer` instead of the legacy `HostConfig`
shim. Boundary validation rejects missing, persistence-only, and conflicting
tree update modes before returning the loud unimplemented render error. The
legacy `render_placeholder()` remains only to keep out-of-scope scaffold
dependents compiling until the test renderer migrates.

Verification is green for formatting, reconciler package tests, full workspace
tests, and reconciler clippy with warnings denied.
