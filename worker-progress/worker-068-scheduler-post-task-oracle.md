# worker-068-scheduler-post-task-oracle

## Objective

Add deterministic `scheduler@0.27.0/unstable_post_task` behavior oracle files.

Write scope honored:

- `tests/conformance/src/scheduler-post-task-*.mjs`
- `tests/conformance/scripts/*scheduler-post-task*.mjs`
- `tests/conformance/test/scheduler-post-task-oracle.test.mjs`
- `tests/conformance/oracles/scheduler-0.27.0-post-task-oracle.json`
- `worker-progress/worker-068-scheduler-post-task-oracle.md`

## Summary

Implemented a checked oracle for the published `scheduler/unstable_post_task`
entrypoint. The oracle records export keys, constants, descriptors, plain Node
feature failures, shimmed `scheduler.postTask` behavior, public priority
context behavior, cancellation through `TaskController.abort`, continuation
scheduling fallback, and current Fast React compatibility boundaries. Fast
React compatibility remains false because this worker adds evidence only.

## Changed Files

- `tests/conformance/oracles/scheduler-0.27.0-post-task-oracle.json`
- `tests/conformance/scripts/generate-scheduler-post-task-oracle.mjs`
- `tests/conformance/scripts/print-scheduler-post-task-oracle.mjs`
- `tests/conformance/src/scheduler-post-task-oracle-generator.mjs`
- `tests/conformance/src/scheduler-post-task-oracle.mjs`
- `tests/conformance/src/scheduler-post-task-probe-runner.mjs`
- `tests/conformance/src/scheduler-post-task-scenarios.mjs`
- `tests/conformance/src/scheduler-post-task-targets.mjs`
- `tests/conformance/test/scheduler-post-task-oracle.test.mjs`
- `worker-progress/worker-068-scheduler-post-task-oracle.md`

## Evidence Gathered

- Used exact `scheduler@0.27.0` npm metadata and integrity-checked tarball
  evidence through the established scheduler oracle pattern.
- Recorded plain Node unsupported behavior separately from shimmed host
  behavior because the entrypoint expects browser-like `window` globals.
- Included controlled shims for `window.performance.now`, `TaskController`,
  `scheduler.postTask`, and optional `scheduler.yield`.
- A read-only nested agent checked post-task hypotheses and local oracle
  patterns; direct local tests were the source of truth.

## Commands Run

- `node tests/conformance/scripts/generate-scheduler-post-task-oracle.mjs --write`
- `node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs`
- Scoped local/temp path leak check over changed files.
- Scoped trailing-whitespace check over changed files.
- Scoped `git diff --check` over changed files.

## Verification

- Targeted oracle test passed: 11 tests passed.
- Scoped local/temp path leak check passed.
- Scoped trailing-whitespace check passed.
- Scoped `git diff --check` passed.

Full conformance should be run after merge with the other accepted oracle
workers.

## Risks Or Blockers

- This is a behavior oracle, not a Fast React implementation.
- Browser task priority ordering is intentionally not claimed; only controlled
  shimmed behavior and plain Node failures are recorded.
- Future implementation must keep public Scheduler priorities separate from
  React lane and event-priority internals.

## Recommended Next Tasks

- Use this oracle when replacing the Fast React post-task placeholder.
- Add implementation comparison only after the scheduler package can emulate
  the browser-post-task surface.

## Quality, Maintainability, Performance, And Security Review

- Quality: the oracle has focused schema, coverage, behavior, path hygiene, and
  print CLI tests.
- Maintainability: files use the `scheduler-post-task` prefix and follow the
  existing scheduler oracle split.
- Performance: normal tests read checked JSON and avoid package regeneration.
- Security: package tarball handling uses established integrity checks and no
  lifecycle scripts are introduced.
