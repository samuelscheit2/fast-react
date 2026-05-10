# Worker 160 - Root Update Callback Commit Prep

## Goal
- status: complete
- objective: prepare HostRoot update callback collection for commit-time invocation with deterministic records, without invoking JS callbacks, adding error boundaries, or wiring public facades

## Progress
- Initialized worker goal and confirmed active goal state with `get_goal`.
- Read assigned context: `WORKER_BRIEF.md`, worker 124/129/138 reports,
  `update_queue.rs`, and `root_updates.rs`. `ORCHESTRATOR.md` was not read.
- Added deterministic HostRoot update callback records for future commit layout
  handoff without invoking callbacks or adding error-boundary/public facade
  behavior.

## Summary

Prepared HostRoot update callback collection for commit-time invocation as a
data-only slice.

The queue now tracks the source update for collected callback handles and can
produce deterministic callback records with queue handle, source update id,
collection sequence, callback handle, and visibility. New peek/take APIs expose
visible callback records for future layout-phase tests and move hidden callback
records into deferred storage without invoking anything.

## Changed Files

- `crates/fast-react-reconciler/src/root_callbacks.rs`
- `crates/fast-react-reconciler/src/update_queue.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-160-root-update-callback-commit-prep.md`

## Implementation Notes

- Added `RootUpdateCallbackRecord`, `RootUpdateCallbackSnapshot`, and
  `RootUpdateCallbackVisibility`.
- Added `UpdateQueueStore::peek_root_update_callback_records` for
  non-consuming commit-layout assertions.
- Added `UpdateQueueStore::take_root_update_callback_records` to drain visible
  callback invocation records exactly once and defer hidden records into the
  shared queue.
- Preserved skipped update callback handles and continued dropping callbacks
  from `NoLane` applied clones so rebased callbacks do not duplicate.
- Kept the work scoped to internal queue/record data. No JS callbacks, root
  error callbacks, public JS packages, native callback registries, host
  mutation, or commit traversal were wired.

## Evidence Gathered

- Worker 124 established the HostRoot queue model, including circular pending
  rings, base queue rebasing, skipped callback preservation, `NoLane` callback
  dropping, and hidden callback deferral.
- Worker 129 established render-phase queue processing on WIP HostRoot queues
  without commit, mutation, or root current switching.
- Worker 138 confirmed root update callbacks must remain separate from
  root error callbacks and are collected during queue processing, then invoked
  later during commit layout.
- React 19.2.6 reference source confirms update queue processing collects
  callbacks and commit callbacks are a later phase; hidden callbacks are
  deferred instead of invoked while hidden.
- No subagents were spawned for this worker.

## Commands Run

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,220p' worker-progress/worker-124-host-root-update-queue.md
sed -n '1,240p' worker-progress/worker-129-host-root-render-phase-foundation.md
sed -n '1,240p' worker-progress/worker-138-root-error-callback-refresh.md
sed -n '1,260p' crates/fast-react-reconciler/src/update_queue.rs
sed -n '1,260p' crates/fast-react-reconciler/src/root_updates.rs
sed -n '260,760p' crates/fast-react-reconciler/src/update_queue.rs
sed -n '260,620p' crates/fast-react-reconciler/src/root_updates.rs
sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs
rg -n "CollectedRootUpdateCallback|callbacks\\(|hidden_callbacks|process_update_queue|UpdateQueueProcessResult|refresh_update_queue_for_work_in_progress|root_work_loop|Root.*Callback" crates/fast-react-reconciler/src crates/fast-react-core/src
rg --files crates/fast-react-reconciler/src | sort
sed -n '1,380p' crates/fast-react-reconciler/src/root_work_loop.rs
rg -n "commit|layout|finished_work|finished|callback|root_callbacks" crates/fast-react-reconciler/src worker-progress | head -n 200
git status --short
sed -n '520,660p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberClassUpdateQueue.js
sed -n '650,780p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberClassUpdateQueue.js
cargo test -p fast-react-reconciler --all-features root_callbacks
cargo test -p fast-react-reconciler --all-features update_queue
git diff -- crates/fast-react-reconciler/src/root_callbacks.rs crates/fast-react-reconciler/src/update_queue.rs crates/fast-react-reconciler/src/lib.rs
rg -n "take_root_update_callback_records|peek_root_update_callback_records|hidden_callbacks|CollectedRootUpdateCallback" crates/fast-react-reconciler/src
cargo fmt --all
git diff -- crates/fast-react-reconciler/src/root_callbacks.rs crates/fast-react-reconciler/src/update_queue.rs crates/fast-react-reconciler/src/lib.rs
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features update_queue
cargo test -p fast-react-reconciler --all-features root_callbacks
cargo test -p fast-react-reconciler --all-features
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
git diff --check
git diff --stat
```

## Verification Results

Passed:

```sh
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features update_queue
cargo test -p fast-react-reconciler --all-features root_callbacks
cargo test -p fast-react-reconciler --all-features
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
git diff --check
```

Full reconciler result: 94 unit tests passed plus 1 doctest after integrating
current `main`.

## Integration With Current Main

- Merged current `main` after implementation, resolving the reconciler
  `lib.rs` module/export conflict by keeping root callback exports alongside
  accepted function-component, host-work, root-commit, and scheduler exports.
- Reran the full verification set above on the integrated worker branch.

## Risks Or Blockers

- The callback record API is a handoff only. Future commit work still needs to
  compute public instances, choose the correct callback context, and invoke
  handles through the appropriate renderer/native registry.
- Hidden callback records are deferred as data; reveal-time hidden callback
  commit behavior remains future work.
- Existing lower-level `take_callbacks` remains available for queue tests, but
  future commit layout code should use the deterministic record API.

## Recommended Next Tasks

- Wire commit layout tests to consume
  `take_root_update_callback_records` after the HostRoot current switch exists.
- Add reveal-time tests around deferred hidden callback records once Offscreen
  visibility commit behavior exists.
- Keep root update callback invocation separate from root error/recoverable
  error callback handling.
