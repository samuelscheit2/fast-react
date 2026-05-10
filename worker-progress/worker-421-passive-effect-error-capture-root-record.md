# Worker 421: Passive Effect Error Capture Root Record

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active status from `get_goal`: `active`.
- Active objective from `get_goal`: Add private root error capture records for
  passive create/destroy failures so the reconciler can prove scheduled error
  metadata before invoking public root error callbacks.

## Summary

- Added crate-private root error capture scheduling metadata for passive
  destroy and mount-create failures.
- Passive executor errors now produce ordered `PassiveEffectRootErrorCaptureRecord`
  values that carry effect/callback/error metadata plus the sync-lane root
  scheduling record.
- Root error propagation diagnostics now distinguish captured root update
  metadata from the still-blocked public root callback and public act paths.
- Kept renderer callbacks, public effects, public act, React DOM error facades,
  and public root error callbacks uninvoked.

## Changed Files

- `crates/fast-react-reconciler/src/passive_effects.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `worker-progress/worker-421-passive-effect-error-capture-root-record.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and requested
  worker reports 161, 173, 225, 301, 349, 361, 362, and 389.
- Inspected current passive executor/error diagnostics, root scheduler
  scheduling helpers, root commit passive handoff records, and root option
  error callback handles.
- Checked the local React 19.2.6 reference source for
  `captureCommitPhaseError`, `createRootErrorUpdate`, and passive hook
  create/destroy error capture behavior. React captures commit-phase errors,
  creates a sync root error update, marks the root updated, and schedules the
  root before root error callbacks are eventually invoked.
- No nested agents were used.

## Commands Run

```sh
cargo test -p fast-react-reconciler --all-features passive_effects --no-run
cargo fmt --all
cargo test -p fast-react-reconciler --all-features passive_effects
cargo test -p fast-react-reconciler --all-features root_scheduler
cargo test -p fast-react-reconciler --all-features root_commit
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features
git diff --check
git add --intent-to-add worker-progress/worker-421-passive-effect-error-capture-root-record.md && git diff --check; rc=$?; git reset -q HEAD -- worker-progress/worker-421-passive-effect-error-capture-root-record.md; exit "$rc"
```

## Verification Results

- `cargo fmt --all --check` passed.
- `cargo test -p fast-react-reconciler --all-features passive_effects` passed:
  21 focused tests.
- `cargo test -p fast-react-reconciler --all-features root_scheduler` passed:
  43 focused tests.
- `cargo test -p fast-react-reconciler --all-features root_commit` passed:
  33 focused tests.
- `cargo test -p fast-react-reconciler --all-features` passed: 345 unit tests
  and 1 compile-fail doc-test.
- `git diff --check` passed.
- Report-inclusive `git diff --check` with intent-to-add for the new progress
  file passed.

## Risks Or Blockers

- No blockers.
- Root error capture records schedule sync-lane metadata only. They do not yet
  create a real captured HostRoot update payload/callback entry in the update
  queue because public root error callback invocation remains blocked.
- The older test-control callback invocation gate still records its own
  diagnostics without scheduling root capture metadata because it does not own
  a mutable root store. The after-commit passive executor paths now own the
  scheduled capture proof.

## Recommended Next Tasks

- Add the real captured HostRoot update record shape when root error callback
  lifetime and update payload ownership are ready.
- Extend committed hook-effect ownership so passive error capture no longer
  depends on caller-supplied canary handoff metadata.
- Keep public root error callbacks, public act aggregation, and React DOM error
  facades behind separate conformance gates.
