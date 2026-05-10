# Worker 386: Context Provider Begin Work Runtime Read

## Goal Evidence

- `create_goal` was called as the first action before repository reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and again before report
  writing.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: `advance ContextProvider begin-work
  integration so a private Provider boundary can push context, render one
  function component consumer, and unwind deterministically while public
  context compatibility remains blocked`.

## Summary

Advanced the private single-provider runtime context read path. A private
`ContextProvider` begin-work handoff now routes its function-component consumer
through a required-context `use_context` render helper, so the admitted
single-provider boundary accepts exactly one consumer read of the provider's
own typed context handle.

If the consumer reads a different context, the render fails before memoizing
props. The provider helper still restores the pushed provider snapshot, leaving
the provider stack back at default state. Public `React.useContext`,
`createContext` runtime compatibility, generic context trees, public Provider
element handling, and default `begin_work` support for `ContextProvider` remain
blocked.

## Changed Files

- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/begin_work.rs`
- `worker-progress/worker-386-context-provider-begin-work-runtime-read.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and worker
  reports 180, 293, 327, 337, and 360.
- Also inspected context-provider reports 282, 298, and 329 because they own
  the existing exact-shape provider handoffs.
- Checked `packages/react/context-object.js` and the current
  `tests/conformance/src/context-object-local-gate.mjs`; the local gate still
  requires public compatibility to remain blocked until Provider begin-work,
  runtime propagation, and function-component context reads are all integrated.
- Checked React 19.2.6 reference source: `updateContextProvider` pushes the
  provider value before reconciling children, and complete/unwind paths pop the
  provider.

## Implementation Notes

- Added `FunctionComponentRenderError::UnexpectedUseContextContext`.
- Added `render_function_component_with_required_use_context`, a private helper
  that reuses the runtime consumer reader but rejects a single read of the
  wrong context before setting `memoized_props`.
- Routed `begin_work_context_provider_use_context_child` through that required
  context helper.
- Added focused tests proving wrong-context consumer reads fail closed and the
  provider stack unwinds back to defaults.

## Commands Run

- `create_goal`
- `get_goal`
- `pwd`, `rg`, `sed`, `git status --short`
- `cargo fmt --all`
- `cargo test -p fast-react-reconciler --all-features function_component_use_context`
- `cargo test -p fast-react-reconciler --all-features context_provider_use_context_child`
- `cargo test -p fast-react-reconciler --all-features function_component_required_use_context`
- `cargo test -p fast-react-reconciler --all-features begin_work`
- `cargo test -p fast-react-reconciler --all-features function_component`
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `node --test tests/conformance/test/context-object-oracle.test.mjs`
- `git diff --check`

One exploratory `rg` command included a non-existent `packages/react/test`
path and exited with status 2; it did not affect implementation.

## Verification

- `cargo fmt --all --check`: passed.
- Focused `function_component_use_context`: passed, 4 tests.
- Focused `context_provider_use_context_child`: passed, 4 tests.
- Focused `function_component_required_use_context`: passed, 1 test.
- Focused `begin_work`: passed, 27 tests.
- Focused `function_component`: passed, 66 tests.
- `cargo test -p fast-react-reconciler --all-features`: passed, 329 unit tests
  plus 1 compile-fail doctest.
- `node --test tests/conformance/test/context-object-oracle.test.mjs`: passed,
  13 tests, proving compatibility claims remain blocked by the local gate.
- `git diff --check`: passed.

## Nested Agents

- Spawned one explorer (`/root/context_provider_runtime_gap_scan`) to scan for
  focused provider/runtime-read gaps. It did not return before implementation
  and verification were complete, so it was closed and no conclusions depend
  on it.

## Risks Or Blockers

- No blockers.
- This remains a private typed-handle path. It does not wire JS context object
  identity, public `React.useContext`, public Provider/Consumer rendering,
  dependency propagation, broad child traversal, siblings, arrays, keys,
  effects, host output, DOM/native/test-renderer integration, or public
  compatibility.
- The required-context helper is deliberately stricter than general React
  behavior and is only used by the single-provider private canary.

## Recommended Next Tasks

1. Add provider identity/dependency metadata before any renderer-visible
   context propagation claim.
2. Keep public `useContext` dispatcher integration blocked until a private
   render dispatcher can enter reconciler-owned context state safely.
3. Replace exact-shape provider handoffs with real begin/complete traversal
   only after provider unwind, siblings, arrays, keys, portals, Suspense, and
   effects have explicit ownership.
