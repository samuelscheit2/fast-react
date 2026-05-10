# Worker 351: Suspense/Offscreen Preflight After Child Handoff

## Goal Evidence

- `create_goal` was the first tool action before repository research, file
  reads, implementation, or verification.
- `get_goal` immediately after setup returned status `active` with objective:
  `harden Suspense, Offscreen, Activity, ViewTransition, Portal, and Fragment fail-closed preflight after any new child handoff paths, proving unsupported tags still do not schedule children, mutate host output, or claim compatibility.`
- A later `get_goal` before report writing still returned status `active` for
  the same objective.

## Summary

- Hardened the private HostRoot complete-work handoff so it first runs the
  existing root-child preflight and refuses to overwrite any existing
  HostRoot child. Unsupported Suspense, Offscreen, Activity, ViewTransition,
  SuspenseList, and Portal children now return the same fail-closed preflight
  diagnostics before host creation can run; Fragment root children return an
  explicit existing-child error without invoking Fragment begin-work.
- Hardened the private function-component single-child complete-work handoff
  so a root child must be `FunctionComponent` after preflight. A Fragment root
  child now fails closed with a structured error instead of reaching the
  function-component-only begin-work path.
- Expanded begin-work and root-work-loop regression coverage for Activity,
  ViewTransition, and SuspenseList in unsupported Fragment-child paths.
- Did not implement Suspense, Offscreen, Activity, ViewTransition, portals, or
  general Fragment reconciliation.

## Changed Files

- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `worker-progress/worker-351-suspense-offscreen-preflight-after-child-handoff.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and worker
  reports 175, 227, 287, and 297.
- Worker reports 329 and 350 were requested if present, but no matching files
  were present under `worker-progress/` in this worktree.
- Worker 175 and 227 established unsupported markers and lane/preflight
  coverage for Suspense, Offscreen, Activity, ViewTransition, and SuspenseList.
- Worker 287 established root preflight regressions for unsupported root
  children and function-component outputs after prior handoffs.
- Worker 297 introduced the narrow unkeyed Fragment-with-one-host-child
  begin-work canary, which made Fragment root children a path that later
  handoffs must reject deliberately when they require a FunctionComponent or a
  fresh HostRoot child.
- Local inspection found two root-work-loop handoff gaps: direct HostRoot
  complete-work could overwrite an existing root child, and the
  function-component complete-work handoff did not reject non-FunctionComponent
  root children before calling the function-component-only begin-work helper.

## Commands Run

- `git status --short`
- `rg --files ...`
- `sed -n ...` for the worker brief, master plan/progress, worker reports, and
  reconciler source files.
- `rg -n ...` for unsupported tags, preflight paths, and child handoff paths.
- `cargo fmt --all`
- `cargo test -p fast-react-reconciler --all-features root_work_loop`
- `cargo test -p fast-react-reconciler --all-features begin_work`
- `cargo test -p fast-react-reconciler --all-features unsupported_features`
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `git diff --check`

## Verification

- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-reconciler --all-features root_work_loop`: passed,
  30 tests.
- `cargo test -p fast-react-reconciler --all-features begin_work`: passed, 21
  matching tests.
- `cargo test -p fast-react-reconciler --all-features unsupported_features`:
  passed, 2 tests.
- `cargo test -p fast-react-reconciler --all-features`: passed, 274 unit tests
  plus 1 compile-fail doctest.
- `cargo fmt --all --check`: rerun after report writing and passed.
- `git diff --check`: passed before and after report writing.

## Nested Agents

- Spawned one explorer (`/root/gap_scan`) to independently scan fail-closed
  coverage. It did not return before the implementation and verification were
  complete, and it was closed without a result, so it did not affect the
  conclusions in this report.

## Risks Or Blockers

- No blockers.
- The new guards are private test-handoff hardening. They intentionally do not
  add public renderer behavior, host mutation, Suspense retry behavior,
  Offscreen visibility handling, Activity/ViewTransition behavior, portal
  mounting, or general Fragment/list reconciliation.
- Reports for workers 329 and 350 were not available in this worktree, so this
  report records source-level evidence from the current branch instead.

## Recommended Next Tasks

- Keep running the root-child preflight before any future handoff that can
  create host output or consume a specific child tag.
- Add feature oracles before replacing any fail-closed marker with real
  Suspense, Offscreen, Activity, ViewTransition, Portal, or Fragment behavior.
