# Worker 558: Suspense Thenable Ping Blocker Refresh

## Objective

Refresh private Suspense thenable/ping blocker diagnostics with lane and retry
metadata while keeping Suspense rendering compatibility blocked.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted Suspense/Offscreen blocker diagnostics and pinged retry scheduler
metadata.

## Write Scope

- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- Focused Rust tests
- `worker-progress/worker-558-suspense-thenable-ping-blocker-refresh.md`

## Requirements

- Record thenable identity class, ping lane, retry queue metadata, and blocked
  fallback/primary child rendering.
- Keep public Suspense, Offscreen, hydration, and compatibility claims blocked.

## Verification

- Focused Suspense/Offscreen/ping Rust tests
- `cargo fmt --all --check`
- `git diff --check`

