# Worker 867 - Deleted Subtree Teardown Execution

## Scope
- Added a crate-private deleted-subtree teardown execution request and diagnostic in `host_work`.
- Wired test-control execution to consume root commit handoff metadata, run deleted ref cleanup returns, flush deleted passive destroys, detach the host subtree, then apply host-node cleanup.
- Added root-work-loop canaries for successful ordered execution, cross-root source rejection, and caller-built stale evidence rejection.
- Added a root commit handoff helper to record deleted-subtree passive metadata on the source-owned commit record.

## Verification
- `cargo test -p fast-react-reconciler --all-features deleted_subtree`
- `cargo test -p fast-react-reconciler --all-features passive_effects`
- `cargo test -p fast-react-reconciler --all-features host_work_deletion`
- `cargo test -p fast-react-reconciler --all-features root_commit_deletion`
- `cargo check -p fast-react-reconciler --all-features`
- `cargo fmt --all --check`
- `git diff --check`
