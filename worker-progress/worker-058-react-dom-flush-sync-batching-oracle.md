# worker-058-react-dom-flush-sync-batching-oracle

## Objective

Add deterministic React DOM 19.2.6 `flushSync` and
`unstable_batchedUpdates` public behavior oracle files.

Write scope honored:

- `tests/conformance/src/react-dom-flush-sync-batching-*.mjs`
- `tests/conformance/scripts/*react-dom-flush-sync-batching*.mjs`
- `tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-dom-flush-sync-batching-oracle.json`
- `worker-progress/worker-058-react-dom-flush-sync-batching-oracle.md`

## Summary

Implemented a checked React DOM 19.2.6 oracle for root and profiling
`flushSync` / `unstable_batchedUpdates` behavior. The oracle records export
and callable shapes, callback return values and argument forwarding, falsy
callback errors, callback throw propagation, nested synchronous calls,
public Scheduler priority observations, and `react-server` condition
boundaries. Fast React compatibility remains false because the current React
DOM package surface still lacks real batching/root integration.

## Changed Files

- `tests/conformance/oracles/react-19.2.6-react-dom-flush-sync-batching-oracle.json`
- `tests/conformance/scripts/generate-react-dom-flush-sync-batching-oracle.mjs`
- `tests/conformance/scripts/print-react-dom-flush-sync-batching-oracle.mjs`
- `tests/conformance/src/react-dom-flush-sync-batching-oracle-generator.mjs`
- `tests/conformance/src/react-dom-flush-sync-batching-oracle.mjs`
- `tests/conformance/src/react-dom-flush-sync-batching-probe-runner.mjs`
- `tests/conformance/src/react-dom-flush-sync-batching-scenarios.mjs`
- `tests/conformance/src/react-dom-flush-sync-batching-targets.mjs`
- `tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs`
- `worker-progress/worker-058-react-dom-flush-sync-batching-oracle.md`

## Evidence Gathered

- Reused existing conformance oracle structure: target metadata, scenario
  metadata, isolated probe runner, generator, read/print helpers, checked JSON,
  and `node:test` assertions.
- Recorded root and profiling entrypoint behavior for default Node development
  and production modes, plus `react-server` unsupported boundaries.
- Kept Scheduler priority observations scoped to public Scheduler behavior and
  did not claim private lane/update-priority internals.
- A read-only nested explorer was used to check assumptions about
  `flushSync`, `unstable_batchedUpdates`, and conformance conventions.

## Commands Run

- `node --test tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs`
- Scoped local/temp path leak check over changed files.
- Scoped trailing-whitespace check over changed files.
- Scoped `git diff --check` over changed files.

## Verification

- Targeted oracle test passed: 12 tests passed.
- Scoped local/temp path leak check passed.
- Scoped trailing-whitespace check passed.
- Scoped `git diff --check` passed.

Full conformance should be run after merge with the other accepted oracle
workers.

## Risks Or Blockers

- This is a React-DOM-only behavior oracle; Fast React batching compatibility
  is not claimed.
- The oracle covers public root/profiling APIs and rootless callback behavior,
  not DOM root scheduling, lanes, event priority, or rendering work.
- Future implementation should wire these APIs through real root scheduler
  semantics rather than treating them as permanent pass-through helpers.

## Recommended Next Tasks

- Use this oracle when implementing `flushSync` and
  `unstable_batchedUpdates` in the React DOM facade.
- Add Fast React dual-run comparisons only after client roots, scheduler
  priority override handling, and cross-root sync flushing exist.

## Quality, Maintainability, Performance, And Security Review

- Quality: the checked artifact is generated and tested through focused
  scenarios with compatibility claims kept false.
- Maintainability: files use the `react-dom-flush-sync-batching` prefix and
  mirror existing conformance oracle patterns.
- Performance: normal tests read the checked artifact and avoid regeneration.
- Security: no package lifecycle scripts or native code paths are introduced.
