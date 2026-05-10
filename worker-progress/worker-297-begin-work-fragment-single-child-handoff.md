# Worker 297: Begin-Work Fragment Single-Child Handoff

## Goal Evidence

- `create_goal` was called as the first action before repository research,
  file reads, implementation, or verification.
- `get_goal` was available immediately after setup and returned status
  `active` with objective:
  `Add a narrow begin-work/root-work-loop canary for a Fragment with exactly one host child. Keep multi-child fragments, keyed fragments, arrays, portals, Suspense, Offscreen, and public renderer output fail-closed.`
- A later `get_goal` check before this report still returned status `active`
  for the same objective.

## Summary

Added a private Fragment begin-work canary that admits only an unkeyed
`Fragment` with exactly one existing direct `HostComponent` or `HostText`
child. The handoff records the fragment, host child, pending props, child
props, and render lanes, and updates only the Fragment memoized props.

Wired the root-work-loop preflight through that new `begin_work` result so a
HostRoot WIP child Fragment with exactly one host child is recognized without
invoking function components, completing host work, committing, mutating hosts,
or switching roots. Keyed fragments, multi-child fragments, fragment siblings,
fragment update/list shapes, Fragment children that are Portal/Suspense/
Offscreen, and function-component outputs that resolve to Fragment all remain
fail-closed.

No nested agents were spawned.

## Changed Files

- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `worker-progress/worker-297-begin-work-fragment-single-child-handoff.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`; did not
  read `ORCHESTRATOR.md`.
- Read worker reports 249, 282, 286, and 287 as required.
- Inspected `begin_work.rs`, `root_work_loop.rs`, `function_component.rs`,
  `host_work.rs`, core fiber topology helpers, unsupported feature markers,
  and React 19.2.6 `ReactFiberBeginWork.js`.
- React reference source routes Fragment begin-work through `updateFragment`,
  which reconciles `pendingProps` children and returns `workInProgress.child`.
  This worker models only the narrow private already-shaped single-host-child
  canary, not generic reconciliation.

## Commands Run

- `cargo fmt --all`
- `cargo test -p fast-react-reconciler --all-features begin_work`
- `cargo test -p fast-react-reconciler --all-features root_work_loop`
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`
- Supporting inspection commands: `sed`, `rg`, `git diff --stat`,
  `git status --short`, and `get_goal`.

## Verification

- `cargo test -p fast-react-reconciler --all-features begin_work`: passed, 18
  matching tests.
- `cargo test -p fast-react-reconciler --all-features root_work_loop`: passed,
  26 matching tests.
- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-reconciler --all-features`: passed, 243 unit tests
  plus 1 compile-fail doctest.
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`:
  passed.
- `git diff --check`: passed before and after report writing.

## Risks Or Blockers

- No blockers.
- This is still a private canary over pre-shaped fibers. It does not parse JS
  Fragment elements, create children from pending props, support keyed/list
  reconciliation, handle arrays, traverse grandchildren, complete host work
  under Fragment, commit host output, or change public DOM/test-renderer output.
- Fragment update shapes with a current child are deliberately rejected to
  avoid implying update/list reconciliation.

## Recommended Next Tasks

- Keep Fragment host completion and committed renderer output behind separate
  private gates with explicit topology and conformance evidence.
- Add real child reconciliation only after arrays, keys, portals, Suspense,
  Offscreen, and deletion/update ownership are designed together.
- Preserve the root preflight fail-closed checks when a future generic
  begin/complete traversal is introduced.
