# Worker 1058 Passive Effects Deleted Subtree Split

Status: complete

## Summary

- Split deleted-subtree ref/passive cleanup records, executor-facing request/result/error types, cleanup execution helpers, and the committed deleted-subtree passive validator into `crates/fast-react-reconciler/src/passive_effects/deleted_subtree.rs`.
- Moved the deleted-subtree unmount lifecycle evidence function and `EffectLifecycleExecutionSnapshot::proves_deleted_subtree_unmount_destroy_order` into the new child module.
- Kept existing crate-visible paths available from `passive_effects` via a private module plus `pub(crate)` re-exports.
- Left unrelated passive queueing, scheduler flush, function-component callback execution, and tests in `passive_effects.rs`.

## Changed Files

- `crates/fast-react-reconciler/src/passive_effects.rs`
- `crates/fast-react-reconciler/src/passive_effects/deleted_subtree.rs`
- `worker-progress/worker-1058-passive-effects-deleted-subtree-split.md`

## Commands Run

- `cargo check -p fast-react-reconciler` before cleanup: passed with one intentional re-export warning.
- `cargo fmt --all`: passed.
- `cargo test -p fast-react-reconciler passive_effects --lib`: passed, 44 passed, 0 failed, 842 filtered out.
- `cargo check -p fast-react-reconciler`: passed without warnings.
- `cargo fmt --all --check`: passed.
- `git diff --check && git diff --cached --check`: passed.

## Evidence Gathered

- Focused passive-effects tests covered deleted-subtree destroy execution, ref/passive cleanup ordering, and deleted-subtree unmount lifecycle evidence after the split.
- The parent flush path now calls `deleted_subtree::validate_committed_deleted_subtree_passive_effects` for `PassiveEffectRecordSource::CommittedDeletedSubtreeEffects`.
- Crate-visible callers can still resolve the moved canary types/functions through `crate::passive_effects::*` re-exports.

## Audit Or Nested-Agent Findings

- No nested agents were used.
- The only warning found during compile was from preserved crate-visible re-exports in the plain lib target; it is now scoped with an `unused_imports` allow and an explicit reason.

## Risks Or Blockers

- Expected integration risk: worker 1055 may touch host-work integration paths that call deleted-subtree passive cleanup helpers. The exported paths are preserved, but merge conflicts are possible around `passive_effects.rs` imports/re-exports or the deleted-subtree validator call.
- `crates/fast-react-reconciler/src/passive_effects/deleted_subtree.rs` is a new untracked file in this worktree until staged by the orchestrator.

## Recommended Next Tasks

- Merge with worker 1055 host-work changes and rerun the same passive-effects test filter plus any affected host-work integration tests.
