# Worker 603: Context Provider Broad Subtree Traversal

## Objective

Replace one exact-shape context-provider diagnostic with a private subtree
traversal gate that can discover multiple consumers without public context
compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Worker 570 added exact nested and sibling multi-provider gates; this task
should generalize one internal traversal safely.

## Write Scope

- `crates/fast-react-reconciler/src/context.rs`
- `crates/fast-react-reconciler/src/begin_work.rs`
- Existing focused Rust tests in those files
- `worker-progress/worker-603-context-provider-broad-subtree-traversal.md`

Do not edit function-component hooks or JS packages.

## Requirements

- Add a private traversal diagnostic that walks a bounded provider subtree and
  records consumer dependency lanes for more than one child shape.
- Fail closed for portals, Suspense, class context, stale provider tokens, and
  unsupported dependency records.
- Preserve public `useContext` compatibility blockers.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features context_provider -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features context -- --nocapture`
- `git diff --check`
