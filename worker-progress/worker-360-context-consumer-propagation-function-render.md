# Worker 360: Context Consumer Propagation Function Render

## Goal Evidence

- `create_goal` was called as the first action before repository research,
  file reads, implementation, or verification.
- `get_goal` was called immediately after setup and again before this report.
- Active goal status after setup: `active`.
- Latest active goal status before this report: `active`.
- Active goal objective recorded by the tool:
  `Extend private context provider propagation so a function-component consumer can read the nearest accepted provider value during render, with fail-closed diagnostics for unsupported shapes.`

## Summary

Added a private render-time `use_context` canary for function components. The
new function-component context reader is passed into a private consumer
invoker, so tests can model a component reading from reconciler-owned context
state during invocation and returning output derived from the read value.

Wired that through begin-work and a HostRoot nested-provider root-work-loop
handoff. The focused nested same-context tests prove
`ContextProvider -> ContextProvider -> FunctionComponent` reads the nearest
accepted provider value, unwinds provider snapshots, and leaves root commit,
host output, effects, and public context facade behavior untouched.

Unsupported consumer shapes fail closed: zero `use_context` reads, multiple
reads, unknown context handles, and root/provider shape mismatches return
structured diagnostics and do not memoize props or mutate host/root output.

## Changed Files

- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `worker-progress/worker-360-context-consumer-propagation-function-render.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read requested worker reports 180, 249, 286, 329, 350, and 351.
- Also read worker reports 247, 282, 297, and 298 for the accepted context
  read, provider begin-work, Fragment preflight, and nested provider canaries.
- Inspected current `function_component.rs`, `begin_work.rs`, and
  `root_work_loop.rs`.
- React 19.2.6 reference source in the local clone shows context providers push
  before reconciling children, context consumers call `readContext` during
  begin-work render, and context reads are recorded as dependencies. This
  worker only models the private typed-handle read path, not public dependency
  tracking or JS facade behavior.

## Commands Run

- `cargo fmt --all`
- `cargo test -p fast-react-reconciler --all-features function_component_use_context`
- `cargo test -p fast-react-reconciler --all-features use_context_child`
- `cargo test -p fast-react-reconciler --all-features root_work_loop_nested_context_provider_use_context`
- `cargo test -p fast-react-reconciler --all-features context_provider_use_context_child`
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features context`
- `cargo test -p fast-react-reconciler --all-features root_work_loop`
- `cargo test -p fast-react-reconciler --all-features`
- `git diff --check`

## Verification

- Focused `function_component_use_context`: passed, 4 tests.
- Focused `use_context_child`: passed, 2 tests.
- Focused `root_work_loop_nested_context_provider_use_context`: passed, 2
  tests.
- Focused `context_provider_use_context_child`: passed, 3 tests.
- `cargo fmt --all --check`: passed.
- Focused context tests:
  `cargo test -p fast-react-reconciler --all-features context`: passed, 32
  tests.
- Focused root-work-loop tests:
  `cargo test -p fast-react-reconciler --all-features root_work_loop`: passed,
  36 tests.
- `cargo test -p fast-react-reconciler --all-features`: passed, 307 unit
  tests plus 1 compile-fail doctest.
- `git diff --check`: passed.

## Nested Agents

- Spawned one explorer (`/root/context_render_gap_scan`) to scan the existing
  function-component/context/root-work-loop gaps. It did not return before
  implementation and verification were complete; it was closed without a
  result, so no conclusions depend on it.

## Risks Or Blockers

- No blockers.
- This remains a private canary. It does not wire public `React.useContext`,
  `Context.Consumer`, JS context object ownership, dependency tracking,
  general provider traversal, broad child reconciliation, effects, host
  output, DOM/native/test-renderer behavior, or compatibility claims.
- The new `use_context` path intentionally admits exactly one consumer read.
  Multiple reads stay unsupported until dependency tracking and hook dispatcher
  ownership are designed.

## Recommended Next Tasks

- Add context dependency metadata before exposing renderer-visible context
  propagation.
- Bridge public `useContext` only after a private render dispatcher can safely
  enter the reconciler-owned context reader.
- Replace exact nested-provider handoffs with real traversal only after
  provider unwind, siblings, arrays, keys, portals, Suspense, and effects have
  explicit ownership.
