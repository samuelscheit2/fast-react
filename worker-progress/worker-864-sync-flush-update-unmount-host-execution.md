# Worker 864 - Sync Flush Update/Unmount Host Execution

Date: 2026-05-11

## Summary

Extended Worker 860's private opt-in sync-flush host mutation execution path
beyond root placement. The same source-owned request rebuild now covers
HostText update, HostComponent update, and root unmount/delete shapes while
default sync flush remains inert.

## Changed Files

- `crates/fast-react-reconciler/src/host_work.rs`
- `crates/fast-react-reconciler/src/sync_flush.rs`
- `worker-progress/worker-864-sync-flush-update-unmount-host-execution.md`

## Evidence Gathered

- Added crate-private host-work retargeting helpers that rebuild finished work
  from the existing `HostWorkResult` and source records for root text update,
  root component update, and root child deletion.
- Extended sync-flush opt-in execution diagnostics with deletion cleanup apply
  count, and routed deletion cleanup after accepted mutation application.
- Added sync-flush tests proving:
  - text update commits are inert until explicit opt-in, then call
    `commit_text_update`;
  - component update commits are inert until explicit opt-in, then call
    `commit_update`;
  - root unmount commits are inert until explicit opt-in, then call
    `remove_child_from_container` and deletion cleanup;
  - existing stale evidence, mismatched root/lane, mismatched `HostWorkResult`,
    and missing metadata rejection coverage remains intact.

## Verification Results

```sh
cargo fmt --all
cargo test -p fast-react-reconciler --all-features sync_flush_private_host_mutation_execution
cargo test -p fast-react-reconciler --all-features sync_flush
cargo test -p fast-react-reconciler --all-features host_work
cargo test -p fast-react-reconciler --all-features root_scheduler
cargo check -p fast-react-reconciler --all-features
cargo fmt --all --check
git diff --check
```

All commands passed.

## Risks Or Blockers

- This is still a private canary path. It does not expose public React DOM,
  test-renderer, package, or scheduler behavior.
- The new unmount execution applies host-node deletion cleanup only through the
  explicit sync-flush private opt-in executor.

## Audit Follow-up - 2026-05-11

- Merged current `origin/main`; branch was already up to date.
- Added source-owned replay protection to `HostWorkResult` for sync-flush host
  mutation execution. Each accepted execution records an identity derived from
  the rebuilt source request and the host-work epoch before entering the host
  applier.
- Added HostText and HostComponent update replay assertions proving a reused
  committed diagnostics/request/host-work tuple returns
  `ReplayedHostMutationExecution` without recording another host operation.

## Follow-up Verification Results

```sh
git fetch origin main
git merge origin/main --no-edit
cargo fmt --all
cargo test -p fast-react-reconciler --all-features sync_flush_private_host_mutation_execution
cargo test -p fast-react-reconciler --all-features sync_flush
cargo test -p fast-react-reconciler --all-features host_work
cargo check -p fast-react-reconciler --all-features
cargo fmt --all --check
git diff --check
```

All follow-up commands passed.
