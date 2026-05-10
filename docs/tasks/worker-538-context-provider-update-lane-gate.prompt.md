# Worker 538: Context Provider Update Lane Gate

## Objective

Add private context provider update diagnostics that record changed provider
value propagation to two consumers with lane evidence, without opening public
context compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted nested provider and multi-consumer propagation gates.

## Write Scope

- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/context.rs`
- Focused Rust tests
- `worker-progress/worker-538-context-provider-update-lane-gate.md`

## Requirements

- Record provider stack push/pop, old/new values, dependent consumer order, and
  lane marking.
- Keep public `useContext` compatibility and real rerender execution blocked.
- Fail closed for stale provider tokens and mismatched dependency paths.

## Verification

- Focused context and begin-work Rust tests
- `cargo fmt --all --check`
- `git diff --check`

