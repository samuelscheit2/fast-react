# Worker 1017 Root Commit Deletions Split

## Summary

- Split deletion metadata, cleanup logs, traversal gates, cleanup-order gates, host-detachment plan types/errors, and deletion collection/materialization helpers from `root_commit.rs` into `root_commit/deletions.rs`.
- Kept existing `crate::root_commit::...` paths stable through `root_commit.rs` re-exports for public and crate-visible deletion types.
- Left mutation/effect/ref code in `root_commit.rs`; only parent-needed deletion helpers are exposed back as `pub(super)`.
- Audit repair: added explicit unused-import allow treatment for the preserved `HostRootDeletionCleanupRecord` and `HostRootDeletionSubtreeTraversalGateStatus` paths.

## Changed Files

- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/root_commit/deletions.rs`
- `worker-progress/worker-1017-root-commit-deletions-split.md`

## Commands Run

- `cargo test -p fast-react-reconciler root_commit_deletion --lib`
- `cargo test -p fast-react-reconciler root_commit_nested_deletion --lib`
- `cargo test -p fast-react-reconciler host_work_deletion --lib`
- `cargo test -p fast-react-reconciler host_work_applies_root_text_deletion_record --lib`
- `cargo test -p fast-react-reconciler host_work_managed_child_sibling_order_delete --lib`
- `cargo test -p fast-react-reconciler root_commit --lib`
- `cargo fmt --all`
- `cargo check -p fast-react-reconciler --lib --locked`
- `cargo fmt --all --check`
- `git diff --check`
- `git diff --cached --check`

## Evidence Gathered

- `root_commit_deletion`: 7 passed, 0 failed.
- `root_commit_nested_deletion`: 1 passed, 0 failed.
- `host_work_deletion`: 6 passed, 0 failed.
- `host_work_applies_root_text_deletion_record`: 1 passed, 0 failed.
- `host_work_managed_child_sibling_order_delete`: 2 passed, 0 failed.
- Broader `root_commit` filter: 108 passed, 0 failed.
- Audit repair `cargo check -p fast-react-reconciler --lib --locked`: passed without warnings.
- `cargo fmt --all --check`, `git diff --check`, and `git diff --cached --check` all completed cleanly.

## Audit Notes

- No nested agents were used.
- The split is behavior-preserving: moved code keeps the same data fields and helper bodies except for module visibility adjustments.
- `HostRootDeletionCleanupRecord`, `HostRootDeletionSubtreeTraversalGateRecord`, and `HostRootDeletionSubtreeTraversalGateStatus` remain re-exported with narrow unused-import allows because those preserved paths are part of the public/crate-visible deletion surface even when the parent module does not directly name them.
- `root_commit/deletions.rs` and this worker progress report are intentional new files to stage with the split.

## Risks Or Blockers

- `root_commit.rs` has a top-level `mod deletions` and re-export/import hunk that may overlap with other source-split workers, especially worker 1016 if it adds sibling modules in the same area.
- `git diff --check` does not include untracked files by default; `cargo fmt --all --check` covered the new Rust module.

## Recommended Next Tasks

- Merge this split before larger effect/ref splits when possible so later workers can layer sibling modules beside `root_commit/deletions.rs`.
- If the orchestrator stages worker diffs before merge, rerun `git diff --cached --check` after staging so the new file is included in the cached whitespace check.
