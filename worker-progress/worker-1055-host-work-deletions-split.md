# Worker 1055: Host Work Deletions Split

## Summary

- Split deletion cleanup and deleted-subtree teardown execution out of `host_work.rs` into `host_work/deletions.rs`.
- Preserved the existing `crate::host_work::*` API with private/crate-visible re-exports from `host_work.rs`.
- Kept generic mutation child lookup and parent deletion mutation application in `host_work.rs` because placement, deletion, and `root_replacement.rs` all share those helpers.
- Left `host_work/root_replacement.rs`, payload, host update apply, root commit code, and tests untouched.

## Changed Files

- `crates/fast-react-reconciler/src/host_work.rs`
- `crates/fast-react-reconciler/src/host_work/deletions.rs`
- `worker-progress/worker-1055-host-work-deletions-split.md`

## Commands Run

- `sed -n '1,220p' /Users/user/Developer/Developer/fast-react/WORKER_BRIEF.md`
- `rg -n "deletion|Deletion|detached|cleanup|passive|ref" crates/fast-react-reconciler/src/host_work.rs`
- `cargo check -p fast-react-reconciler`
- `cargo fmt --all`
- `cargo test -p fast-react-reconciler host_work --lib`
- `cargo test -p fast-react-reconciler root_work_loop --lib`
- `cargo fmt --all --check`
- `git diff --check`
- `git diff --cached --check`
- Extra coverage: `cargo test -p fast-react-reconciler sync_flush --lib`

## Evidence Gathered

- `cargo test -p fast-react-reconciler host_work --lib`: 91 passed.
- `cargo test -p fast-react-reconciler root_work_loop --lib`: 119 passed.
- `cargo test -p fast-react-reconciler sync_flush --lib`: 76 passed.
- `cargo check -p fast-react-reconciler`: passed.
- `cargo fmt --all --check`: passed.
- `git diff --check` and `git diff --cached --check`: passed.
- Nested explorer mapped the deletion ranges and confirmed `OwnedDetachedHostChild`, `owned_detached_host_child_for_*`, `detached_host_child_for_apply_record`, and the deletion mutation arms should remain in `host_work.rs` to avoid widening the mutation/refactor scope.

## Risks Or Blockers

- No blockers.
- Expected integration risk: worker 1058 may also touch ref/passive cleanup APIs, and worker 1054 may touch root commit APIs imported by the new module. The split is behavior-preserving, but imports/reexports may need light conflict resolution if those branches alter the same symbols.
- Sync-flush deleted-subtree wrappers still live in `host_work.rs`; they use the moved request validation methods via `pub(super)` visibility. This avoids changing sync mutation helper visibility while keeping the core cleanup/teardown implementation in the new module.

## Recommended Next Tasks

- Merge with neighboring worker branches and resolve any import ordering or reexport conflicts.
- Run the same targeted suites plus full reconciler tests after integration.
