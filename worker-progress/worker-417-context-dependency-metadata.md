# Worker 417: Context Dependency Metadata

## Goal Setup

- `create_goal` was called as the first action before repository research,
  file reads, implementation, or verification.
- `get_goal` was available after setup and before report writing.
- Latest active goal status: `active`.
- Latest active goal objective:
  `record private context dependency metadata for function-component runtime reads so Provider/useContext diagnostics can prove dependency identity without exposing renderer-visible propagation`.

## Summary

Added private context dependency metadata for function-component context reads.
Each accepted runtime read now records a private dependency handle, context
identity, memoized value, read index, render-read index, render lanes, no-lane
dependency metadata, and a private next pointer.

Provider/useContext begin-work diagnostics can now surface the child context
dependency handle and verify it matches the runtime read. The path deliberately
does not set `FiberNode.dependencies`, `NeedsPropagation`, dependency lanes, or
any renderer-visible propagation marker.

The context-object local gate now records this dependency metadata as accepted
private progress while keeping public context compatibility blocked.

## Changed Files

- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/begin_work.rs`
- `tests/conformance/src/context-object-local-gate.mjs`
- `tests/conformance/test/context-object-oracle.test.mjs`
- `worker-progress/worker-417-context-dependency-metadata.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 180, 222, 300, 360, 386, 387, and 409.
- React 19.2.6 reference source shows `readContextForConsumer` records a
  context dependency item with context identity and memoized value, then sets
  `NeedsPropagation`; this worker records the identity/value metadata only and
  keeps propagation private/inert.
- Existing core fibers already have `DependenciesHandle` and
  `FiberFlags::NEEDS_PROPAGATION`, so tests explicitly prove the new private
  metadata does not write those fields.
- No nested managed agents were used.

## Commands Run

- `cargo test -p fast-react-reconciler --all-features function_component_use_context --no-fail-fast`
- `cargo test -p fast-react-reconciler --all-features context_provider_use_context --no-fail-fast`
- `node --check tests/conformance/src/context-object-local-gate.mjs`
- `node --check tests/conformance/test/context-object-oracle.test.mjs`
- `node --test tests/conformance/test/context-object-oracle.test.mjs`
- `cargo fmt --all`
- `cargo test -p fast-react-reconciler --all-features function_component --no-fail-fast`
- `cargo test -p fast-react-reconciler --all-features context --no-fail-fast`
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `git diff --check`

## Verification

- Focused `function_component_use_context`: passed, 4 tests.
- Focused `context_provider_use_context`: passed, 9 tests.
- Focused `function_component`: passed, 67 tests.
- Focused `context`: passed, 37 tests.
- Context-object gate syntax and oracle tests: passed, 13 tests.
- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-reconciler --all-features`: passed, 344 unit tests
  plus 1 compile-fail doctest.
- `git diff --check`: passed.

## Risks Or Blockers

- No blockers.
- The metadata is private diagnostic state only. It does not implement public
  `React.useContext`, broad `ContextProvider` begin-work traversal, consumer
  bailout invalidation, provider propagation, DOM/test-renderer output, or
  public compatibility.
- The private dependency list is scoped to the function-component context
  render store; it does not yet back the core fiber `DependenciesHandle`.

## Recommended Next Tasks

1. Add a later private bailout/check-if-context-changed gate once context
   dependencies have an owned fiber-level store.
2. Keep public `React.useContext` compatibility blocked until renderer-backed
   execution can safely enter the private context reader.
3. Replace exact Provider/useContext canaries with real traversal only after
   provider unwind, siblings, arrays, keys, portals, Suspense, and effects have
   explicit ownership.
