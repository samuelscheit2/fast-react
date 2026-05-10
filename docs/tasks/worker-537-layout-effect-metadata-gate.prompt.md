# Worker 537: Layout Effect Metadata Gate

## Objective

Add private layout-effect mount/update metadata that records create/destroy
handoff ordering without executing layout effects or exposing public effect
compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted passive effect, effect ring, and layout-effect handoff diagnostics.

## Write Scope

- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/root_commit.rs`
- Focused Rust tests
- `worker-progress/worker-537-layout-effect-metadata-gate.md`

## Requirements

- Record hook tag, dependency phase, destroy/create metadata order, and commit
  phase ownership.
- Keep layout callback invocation, DOM mutation side effects, refs, and public
  effect compatibility blocked.
- Reject stale or mismatched fiber/effect records.

## Verification

- `cargo test -p fast-react-reconciler --all-features layout_effect -- --nocapture`
- `cargo fmt --all --check`
- `git diff --check`

