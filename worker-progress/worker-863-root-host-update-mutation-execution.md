# Worker 863 - Root Host Update Mutation Execution

Date: 2026-05-11

## Summary

Executed private root-level HostText and HostComponent update mutations after a
prior root mount.

The new root-work-loop canaries now prove:

- root HostText updates flow through source-owned render/update/commit evidence
  and execute `commit_text_update`
- root HostComponent updates flow through the same evidence and execute
  `commit_update`
- style rows are committed to the private host-node store only, publishing
  latest props without claiming public DOM property compatibility
- text-content rows conflicting with a pending HostText update are rejected
  before any host mutation call
- cross-root/caller-built finished-work records are rejected before commit or
  host mutation

## Changed Files

- `crates/fast-react-reconciler/src/host_work.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `worker-progress/worker-863-root-host-update-mutation-execution.md`

## Commands Run

```sh
cargo test -p fast-react-reconciler --all-features root_work_loop_host_update
cargo test -p fast-react-reconciler --all-features host_work_host_text_update
cargo test -p fast-react-reconciler --all-features root_commit_host_component_update
cargo fmt --all
cargo test -p fast-react-reconciler --all-features root_work_loop_host_update
cargo test -p fast-react-reconciler --all-features host_work_host_text_update
cargo test -p fast-react-reconciler --all-features root_commit_host_component_update
cargo check -p fast-react-reconciler --all-features
cargo fmt --all --check
git diff --check
cargo test -p fast-react-reconciler --all-features host_work_host_component_update
```

## Evidence Gathered

- Read Worker 855 and Worker 860 progress notes before extending their private
  root host mutation execution path.
- Reused the existing single-update commit handoff validator so root update
  execution requires source-owned mutation records, payloads, current/finished
  work, lanes, and host-node evidence.
- Added root update host-work helpers that carry detached host records from the
  prior mount into the update render, instead of accepting caller-built host
  nodes.
- Exposed only crate-private canary diagnostics and inspection helpers for the
  tests; no public renderer or DOM property compatibility surface was added.

## Verification Results

- `root_work_loop_host_update`: passed, 5 tests.
- `host_work_host_text_update`: passed, 2 tests.
- `root_commit_host_component_update`: passed, 1 test.
- `host_work_host_component_update`: passed, 3 tests.
- `cargo check -p fast-react-reconciler --all-features`: passed.
- `cargo fmt --all --check`: passed.
- `git diff --check`: passed.

## Audit Follow-Up - Consumed Update Payloads

Added private consumed-update tracking for root HostComponent and HostText
mutation records. `apply_test_host_root_commit_mutations` now preflights update
records against consumed payload evidence before any host mutation loop, and the
per-record application helpers retain the same guard at the call boundary.

Successful HostComponent updates, private style-store updates, and HostText
updates now consume their private payload evidence. Replaying the same accepted
update commit record returns `ConsumedHostUpdatePayload` before another
`commit_update` or `commit_text_update` can run.

Added negative canaries for replayed HostComponent and HostText update commit
records. They assert the replay error kind and prove the second apply leaves
host operations, host tokens, and text update counts unchanged.

Merged current `origin/main` before verification; the branch was already up to
date.

### Audit Commands Run

```sh
git fetch origin main && git merge origin/main --no-edit
cargo fmt --all
cargo test -p fast-react-reconciler --all-features root_work_loop_host_update
cargo test -p fast-react-reconciler --all-features host_work_host_text_update
cargo test -p fast-react-reconciler --all-features root_commit_host_component_update
cargo test -p fast-react-reconciler --all-features host_work_host_component_update
cargo check -p fast-react-reconciler --all-features
cargo fmt --all --check
git diff --check
```

### Audit Verification Results

- `root_work_loop_host_update`: passed, 5 tests.
- `host_work_host_text_update`: passed, 3 tests.
- `root_commit_host_component_update`: passed, 1 test.
- `host_work_host_component_update`: passed, 4 tests.
- `cargo check -p fast-react-reconciler --all-features`: passed.
- `cargo fmt --all --check`: passed.
- `git diff --check`: passed.

## Integration Follow-Up - Local Main Merge

Merged current local `main` (`5d352f904473449ed8deb34da05281de6b5d4200`)
into the worker branch and resolved conflicts in `host_work.rs` and
`root_work_loop.rs`.

The resolution preserves Worker 864's `HostWorkResult` sync-flush execution
identity fields and replay guard, while keeping this worker's consumed
HostComponent/HostText update payload guard before root update host calls. The
root-update `HostWorkResult` constructors now initialize the sync-flush replay
identity state from main.

The resolution also keeps Worker 866's function-component update host execution
helpers/tests and Worker 867's deletion teardown evidence gates. The
root-work-loop test conflict was resolved by retaining both main's
function-component update rejection canaries and this worker's five
root-level HostComponent/HostText update canaries.

### Integration Commands Run

```sh
git merge main --no-edit
cargo fmt --all
cargo test -p fast-react-reconciler --all-features root_work_loop_host_update
cargo test -p fast-react-reconciler --all-features host_work_host_text_update
cargo test -p fast-react-reconciler --all-features root_commit_host_component_update
cargo test -p fast-react-reconciler --all-features host_work_host_component_update
cargo test -p fast-react-reconciler --all-features sync_flush_private_host_mutation_execution
cargo check -p fast-react-reconciler --all-features
cargo fmt --all --check
git diff --check
```

### Integration Verification Results

- `root_work_loop_host_update`: passed, 5 tests.
- `host_work_host_text_update`: passed, 3 tests.
- `root_commit_host_component_update`: passed, 1 test.
- `host_work_host_component_update`: passed, 4 tests.
- `sync_flush_private_host_mutation_execution`: passed, 7 tests.
- `cargo check -p fast-react-reconciler --all-features`: passed.
- `cargo fmt --all --check`: passed.
- `git diff --check`: passed.

## Risks Or Blockers

- The execution remains private test-host canary code only.
- Public React DOM, react-test-renderer, hydration, refs/effects, native, and
  package behavior remain intentionally blocked.
- The HostComponent update helper covers same-root private update rows and does
  not claim broad DOM property compatibility.
