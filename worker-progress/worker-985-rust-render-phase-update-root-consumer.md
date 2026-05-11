# Worker 985 - Rust Render-Phase Update Root Consumer

Date: 2026-05-11

## Summary

- Added a private/test-only root-work-loop consumer for FunctionComponent
  render-phase update currentness in `root_work_loop.rs`.
- The positive path is intentionally narrow: a previously accepted
  FunctionComponent single-child mount, a new HostRoot render with the exact
  FunctionComponent work-in-progress alternate, an update-phase hook state, and
  source-owned FunctionComponent render-phase dispatch plus staging-drain
  evidence.
- The consumer validates root/current/work-in-progress/FunctionComponent
  identity, current and work-in-progress hook-list identity and owner, queue and
  update generations, render lanes, source labels, no caller-built rows, and no
  root scheduler escape before marking evidence consumed.
- The source record carries a private source token that is cleared on clone, so
  cloned evidence fails closed. Replay against the same source is rejected after
  first consumption.
- No public hook/root/renderer/Scheduler/act/package compatibility was opened.

## Changed Files

- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `worker-progress/worker-985-rust-render-phase-update-root-consumer.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PROGRESS.md`, and accepted worker reports for
  Workers 918, 943, 977, and 982.
- Confirmed the accepted FunctionComponent render-phase evidence path exposes
  source-owned dispatch and staging-drain records with attempt, staging
  generation, queue/update generations, render lanes, hook-list fields on the
  dispatch record, and explicit public compatibility blockers.
- Followed Worker 982 root-work-loop conventions for source records, request
  compatibility claims, validation before consumption, inert failure behavior,
  and narrow private canary naming.

## Tests Added

- Positive root-work-loop consumer proof for private FunctionComponent
  render-phase update currentness.
- Negative coverage for cloned tokenless evidence, caller-shaped evidence,
  replay/double consume, stale mount/root evidence, cross-root render evidence,
  cross-fiber work evidence, hook-list owner mismatch, public compatibility
  flags, Scheduler, act, root-prerequisite, renderer, and package smuggling.

## Commands Run

```sh
cargo fmt --all
cargo test -p fast-react-reconciler --all-features root_work_loop_function_component_render_phase_update -- --nocapture
cargo test -p fast-react-reconciler --all-features render_phase -- --nocapture
cargo test -p fast-react-reconciler --all-features root_work_loop -- --nocapture
cargo test -p fast-react-reconciler --all-features
cargo check -p fast-react-reconciler --all-features
cargo fmt --all --check
git diff --check
```

## Verification Results

- Focused new root-work-loop render-phase update filter: passed, 5 tests.
- `render_phase`: passed, 22 tests.
- `root_work_loop`: passed, 119 tests.
- Full `fast-react-reconciler` package: passed, 869 unit tests plus 1 doctest.
- `cargo check -p fast-react-reconciler --all-features`: passed.
- `cargo fmt --all --check`: passed.
- `git diff --check`: passed.

## Risks Or Blockers

- No blockers.
- This is private/test-only evidence. It does not claim public hook execution,
  root rendering compatibility, renderer behavior, Scheduler timing, `act`,
  package compatibility, effects, or host mutation execution.
- The consumer depends on existing FunctionComponent render-phase canary
  evidence; it does not promote those APIs to production/public surfaces.

## Recommended Next Tasks

- Keep this consumer as a regression gate when public hook dispatcher and root
  scheduling work begins.
- If a future worker admits public render-phase behavior, require this private
  currentness path plus renderer-backed public oracles before lifting blockers.
