# worker-1023-function-component-hook-records-split

## Summary

- Split the function-component hook record/render request DTO block into
  `crates/fast-react-reconciler/src/function_component/records.rs`.
- Re-exported the private child module from `function_component.rs` so existing
  `crate::function_component::TypeName` paths remain valid.
- Kept hook-store orchestration, render-phase gates, render control flow, and
  effect/context/single-child behavior in `function_component.rs`.
- Used `pub(super)` fields for moved DTOs so the parent module and its tests can
  keep constructing records without broadening to `pub(crate)` fields.

Moved type groups include:

- `FunctionComponentStateUpdateRenderLanes`.
- Memo/callback/ref hook records, update records, diagnostics, and dependency
  status.
- `useState`/`useReducer`/`useMemo`/`useCallback`/`useEffect`/`useRef` render
  request DTOs.
- State/reducer update render records.
- `FunctionComponentUse*HookRenderRecord` enums and accessors for state,
  reducer, memo, callback, effect, and ref hooks.

## Changed Files

- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/function_component/records.rs`
- `worker-progress/worker-1023-function-component-hook-records-split.md`

## Commands Run

- `cargo test -p fast-react-reconciler function_component --lib`
  - Passed: 149 tests, 737 filtered.
- `cargo fmt --all`
  - Completed.
- `cargo test -p fast-react-reconciler`
  - Passed: 886 unit tests and 1 doc test.
- `cargo fmt --all --check`
  - Passed.
- `git diff --check`
  - Passed.
- `git diff --cached --check`
  - Passed.

## Evidence Gathered

- The targeted function-component filter exercises the moved hook record and
  request types across private `useState`, `useReducer`, `useEffect`,
  `useMemo`, `useCallback`, and `useRef` render paths.
- The full reconciler package test covers the crate-visible re-exported paths
  used by `begin_work`, `root_work_loop`, `root_commit`, and
  `passive_effects`.
- `cargo fmt --all --check` and diff checks are clean on the final shape.

## Nested Agent Findings

- A read-only explorer mapped candidate groups and confirmed the low-risk split:
  hook record/request DTOs are suitable for a private child module with
  `pub(crate) use records::*`.
- The explorer also flagged the important privacy detail: moved fields need
  `pub(super)` or new constructors because the parent module constructs several
  records with field literals. I used `pub(super)` to avoid behavior changes and
  keep the visibility narrower than crate-wide.
- The explorer recommended leaving `FunctionComponentRenderPhaseUpdateGate` and
  hook-store internals in the parent; this change follows that recommendation.

## Risks Or Blockers

- No current blockers.
- Merge risk is mostly mechanical: `function_component.rs` is an active cleanup
  hotspot, so nearby concurrent edits may need a simple rebase around the
  removed record block and new `records` module declaration.

## Recommended Next Tasks

- Consider a later, separate split for state/reducer dispatch request/root
  reschedule DTOs.
- Consider effect metadata and context record modules as separate follow-ups;
  both are coherent but more coupled to existing effect/context logic than this
  DTO-only move.
