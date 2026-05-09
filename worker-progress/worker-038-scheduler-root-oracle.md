# worker-038-scheduler-root-oracle

## Objective

Add deterministic public `scheduler@0.27.0` root behavior oracle files.

## Progress

- Started from `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Confirmed write scope is limited to scheduler-root conformance files and this progress report.
- Read worker 034's scheduler package inventory and used `scheduler@0.27.0` as the pinned public root baseline.
- Implemented the oracle source files, exact-tarball generator, checked-artifact printer, checked-artifact tests, and this progress report.
- Tightened the scheduler oracle test to cover the print CLI and local/temp path leak guards, matching the existing conformance oracle convention.

## Coverage

- Root export keys, descriptors, public priority constants, `unstable_Profiling`, and absence of `unstable_NoPriority`.
- Scheduled task object keys/descriptors, ready and delayed `sortIndex` roles, priority timeout buckets, and cancellation tombstones.
- Priority ordering across all public priorities and FIFO ordering for equal-priority work.
- Delayed callback ordering and delayed cancellation.
- Continuation callbacks returning functions and running before later same-priority work.
- `didTimeout` categories for Immediate, UserBlocking after a generous event-loop block, and Normal under the same block.
- `unstable_runWithPriority`, invalid priority coercion, priority restoration after throws, `unstable_next`, and `unstable_wrapCallback`.
- `unstable_shouldYield`, `unstable_requestPaint`, `unstable_forceFrameRate`, and development console errors for invalid frame rates.
- Node host callback transport evidence by instrumenting `setImmediate` before requiring `scheduler`.

## Subagent Checks

- No nested subagents were used. The worker brief allows them, but the orchestrator continuation note for this resumed task said not to spawn nested agents.
- Reviewed existing conformance oracle conventions locally and matched the generator/oracle/printer/test layout.
- Reviewed worker 034 scheduler package inventory locally and matched the recorded `scheduler@0.27.0` root behavior areas.

## Verification

- `node tests/conformance/scripts/generate-scheduler-root-oracle.mjs > <temp-generated-oracle.json>`
- `cmp -s tests/conformance/oracles/scheduler-0.27.0-root-oracle.json <temp-generated-oracle.json>` passed with exit code 0.
- `node --test tests/conformance/test/scheduler-root-oracle.test.mjs` passed with 13 tests.
- `npm test --workspace @fast-react/conformance` passed with 94 tests.
- `grep -nE '[[:blank:]]$' ...scheduler-root files...` found no trailing whitespace.
- Scoped path-leak grep across the scheduler-root files found no local or temp path leaks.
- `git diff --check -- tests/conformance/test/scheduler-root-oracle.test.mjs` passed for the tracked patch surface.

## Notes

- The oracle intentionally does not compare against local Fast React scheduler code because worker 035 may not be merged.
- Raw wall-clock timestamps are not stored; probes record logical ordering, timeout buckets, and boolean categories.
- The didTimeout probe blocks the event loop for at least 400ms, comfortably beyond UserBlocking's 250ms timeout and far below Normal's 5000ms timeout.
- Delayed callback probes use generous waits and assert order/cancellation categories rather than exact millisecond delivery.
- Quality review: the generator uses the exact npm tarball, verifies `dist.integrity`, avoids lifecycle scripts and root manifest changes, normalizes path-bearing error messages, and removes temporary extraction directories in `finally`.
- Unresolved risks: the oracle covers the public Node root entrypoint only; variant entrypoints such as `scheduler/unstable_mock`, `scheduler/unstable_post_task`, native delegation, and future Fast React comparisons remain separate worker scope.
