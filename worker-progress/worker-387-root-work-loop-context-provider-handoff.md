# Worker 387: Root Work Loop Context Provider Handoff

## Goal Evidence

- `create_goal` was called as the first action before repository research,
  file reads, implementation, or verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: Teach the private root work
  loop to carry the accepted ContextProvider begin-work handoff through
  complete-work diagnostics for one Provider to function-component consumer
  path.
- Final goal status after verification and report update: `complete`;
  `update_goal` reported 511 seconds used.

## Summary

Added a private root-work-loop canary that carries
`HostRoot -> ContextProvider -> FunctionComponent consumer` through the
accepted provider `use_context` begin-work handoff, single host-child output
reconciliation, and test-only complete-work diagnostics.

The new diagnostic records the original HostRoot render element, provider,
consumer function component, provider context read metadata, reconciled
HostComponent/HostText child output, and detached host complete-work counts
while preserving the Provider as the HostRoot child in the final topology.

The path remains private and exact-shape only. It does not broaden generic
begin-work traversal, Suspense/Offscreen behavior, public context objects,
public `useContext`, commit effects, DOM/test-renderer output, or public React
compatibility.

## Changed Files

- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `worker-progress/worker-387-root-work-loop-context-provider-handoff.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` after
  goal setup.
- Read requested worker reports 203, 293, 337, and 360. Worker 386's progress
  report was not present in this worktree.
- Inspected the current `begin_work.rs`, `root_work_loop.rs`, `host_work.rs`,
  and existing root-work-loop context/complete-work tests.
- Confirmed existing accepted pieces were separate: single-provider begin-work
  context propagation, nested provider `use_context` render, and direct
  FunctionComponent complete-work diagnostics.
- Added a narrow begin-work record that combines
  `ContextProviderUseContextBeginWorkRecord` with accepted single-child output
  reconciliation.
- Added a root-work-loop diagnostic helper that validates a HostRoot
  ContextProvider child, delegates the consumer render/reconciliation, reuses
  the accepted direct FunctionComponent complete-work fixture, restores the
  provider topology, and records Provider-aware complete-work metadata.
- Spawned one explorer (`/root/context_provider_complete_gap_scan`) to scan the
  gap, but it did not return a result before implementation and verification
  completed. It was closed without affecting conclusions.

## Verification

- `cargo fmt --all --check`: passed.
- Focused provider context complete-work tests:
  `cargo test -p fast-react-reconciler --all-features root_work_loop_context_provider_use_context`:
  passed, 3 matching tests.
- Focused context tests:
  `cargo test -p fast-react-reconciler --all-features context_provider_use_context`:
  passed, 8 matching tests.
- Focused root-work-loop tests:
  `cargo test -p fast-react-reconciler --all-features root_work_loop`: passed,
  41 matching tests.
- Full reconciler tests:
  `cargo test -p fast-react-reconciler --all-features`: passed, 330 unit
  tests plus 1 compile-fail doctest.
- `git diff --check`: passed before and after report creation.

## Commands Run

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
ls worker-progress && rg -n "Worker (203|293|337|360|386)|context|Provider|root work loop|handoff" worker-progress crates/fast-react-reconciler/src -g '*.md' -g '*.rs'
sed -n '1,240p' worker-progress/worker-203-root-work-loop-complete-work-handoff.md
sed -n '1,240p' worker-progress/worker-293-root-commit-host-parent-placement-apply-canary.md
sed -n '1,220p' worker-progress/worker-337-react-dom-root-private-create-render-admission.md
sed -n '1,240p' worker-progress/worker-360-context-consumer-propagation-function-render.md
ls worker-progress | rg '^worker-386' || true
rg -n "ContextProvider|UseContext|use_context|context_provider|Provider|complete|handoff|HostRootComplete|root_work_loop" crates/fast-react-reconciler/src/root_work_loop.rs
rg -n "ContextProvider|UseContext|use_context|context_provider|Provider|FunctionComponentSingleChild|NestedContext|Context" crates/fast-react-reconciler/src/begin_work.rs
sed -n '<ranges>' crates/fast-react-reconciler/src/root_work_loop.rs
sed -n '<ranges>' crates/fast-react-reconciler/src/begin_work.rs
sed -n '<ranges>' crates/fast-react-reconciler/src/host_work.rs
sed -n '<ranges>' crates/fast-react-reconciler/src/function_component.rs
sed -n '1,220p' worker-progress/worker-329-context-provider-propagation-through-root-work-loop.md
sed -n '1,220p' worker-progress/worker-282-context-provider-begin-work-handoff.md
cargo fmt --all
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features root_work_loop_context_provider_use_context
cargo test -p fast-react-reconciler --all-features begin_work_context_provider_use_context
cargo test -p fast-react-reconciler --all-features context_provider_use_context
git diff --check
git status --short
cargo test -p fast-react-reconciler --all-features root_work_loop
cargo test -p fast-react-reconciler --all-features
get_goal
```

## Risks Or Blockers

- No blockers.
- The complete-work diagnostic intentionally reuses the accepted direct
  FunctionComponent complete-work fixture, then restores Provider topology
  before exposing the root-loop record. This avoids changing `host_work.rs`,
  but it is still a canary rather than a real complete-work traversal.
- The path admits only one HostRoot child ContextProvider, one FunctionComponent
  consumer child, exactly one `use_context` read, and a HostComponent/HostText
  output registered in the test host tree.
- Provider identity still comes from explicit private handles. Public context
  object ownership, dependency tracking, renderer output, effects, commit, and
  DOM/native/test-renderer integration remain out of scope.

## Recommended Next Tasks

1. Add a real Provider-aware complete-work traversal only after provider
   unwind, siblings, arrays, keyed children, portals, and effects have explicit
   ownership.
2. Add context dependency metadata before exposing renderer-visible context
   propagation or public `useContext`.
3. Keep DOM/test-renderer public output gates fail-closed until committed host
   output consumes these private diagnostics through accepted commit paths.
