# Worker 536: Function Component useCallback Gate

## Objective

Add a private function-component `useCallback` render/update diagnostic that
records dependency reuse versus replacement without exposing public hook
compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted `useMemo`, hook queue, and hook dispatcher private gates.

## Write Scope

- `crates/fast-react-reconciler/src/function_component.rs`
- `packages/react/src/react-hooks.js` or the existing hook dispatcher gate only
  if needed
- Focused Rust and conformance tests for hook dispatcher metadata
- `worker-progress/worker-536-function-component-use-callback-gate.md`

## Requirements

- Record stable callback reuse when dependencies are equal and replacement when
  dependencies change.
- Do not invoke callbacks as behavior proof.
- Keep public dispatcher installation, render compatibility, effects, and
  compatibility claims blocked.

## Verification

- Focused function-component Rust tests for the new diagnostic
- Focused React hook dispatcher conformance test if JS metadata is touched
- `cargo fmt --all --check`
- `git diff --check`

