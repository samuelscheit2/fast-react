# Worker 645: DOM Live Controlled Input Admission Preflight

## Goal Evidence

- `create_goal` was the first action before file reads, research, implementation, or verification.
- Goal objective: Add a private admission/preflight gate for live DOM controlled input restoration that proves why live mutation remains blocked, without mutating real DOM or value trackers.
- Initial `get_goal` confirmed status `active` for the same objective.
- Final report-time `get_goal` again confirmed status `active` for the same objective.

## Summary

Added a private controlled input live-mutation preflight to the post-event restore queue gate. The preflight consumes the same input/change bridge, write execution, flush blocker, and wrapper mutation intent evidence as the fake-DOM execution path, but admits a DOM-like target only as preflight evidence.

The new record proves live restoration remains blocked by recording frozen blocker evidence for disabled queue writes/flushes, host wrapper invocation, host value reads/writes, descriptor installation, value-tracker writes, browser input mutation, and public compatibility claims. Tests use guarded live-node proxies that throw on `value`, `checked`, or `_valueTracker` access to prove the preflight does not touch live values or trackers.

## Changed Files

- `packages/react-dom/src/client/controlled-restore-queue.js`
- `packages/react-dom/src/resource-form-internals-gate.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `worker-progress/worker-645-dom-live-controlled-input-admission-preflight.md`

## Commands Run And Results

- `create_goal`: created the active worker goal before any file reads.
- `get_goal`: confirmed active status/objective at setup and report time.
- `sed -n '1,220p' WORKER_BRIEF.md`: read the required worker brief first.
- Targeted `rg`, `find`, and `sed` inspections over controlled restore queue, resource/form internals, focused tests, and worker reports: completed.
- React reference reads under `/Users/user/Developer/Developer/react-reference`: confirmed React 19.2.6 controlled restore queues nodes, resolves current props, invokes controlled wrappers, and may refresh radio value trackers.
- `node --check packages/react-dom/src/client/controlled-restore-queue.js`: passed.
- `node --check packages/react-dom/src/resource-form-internals-gate.js`: passed.
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`: passed, 45/45 tests.
- `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`: passed, 21/21 tests.
- `npm run check --workspace @fast-react/react-dom`: passed, including 125 package tests and import smoke checks. npm emitted the existing `minimum-release-age` config warning.
- `git diff --check`: passed.
- `git status --short`: showed only the scoped modified files before this report was written.

## Evidence Gathered

- Existing fake-DOM execution intentionally mutates only an admitted fake target and still rejects live DOM targets with `unsupported-live-dom-node`.
- The new live preflight accepts a live DOM-like target only in the admission record, keeps `liveDomTargetCaptured: false`, and never stores the target in the payload.
- Guarded proxy tests prove the preflight does not read or write `value`, `checked`, or `_valueTracker`.
- Side-effect evidence remains false for real restore queue writes/flushes, host wrapper invocation, descriptor installation, value tracker writes, host value reads/writes, browser input mutation, and compatibility claims.
- Resource/form internals now expose the same blocked live-restore preflight boundary in controlled restore diagnostics.
- Nested explorer check confirmed the local pattern for private queue records: constants, WeakMap, gate method, frozen payload, get/is helpers, summary fields, exports, and focused no-mutation assertions.

## Risks Or Blockers

- No blockers remain.
- The live preflight is metadata-only and does not claim public controlled input compatibility.
- The preflight intentionally supports the same narrow input/change text and checkbox source shape as the current fake-DOM execution path; radio group, multi-target, select, and textarea live execution remain blocked.

## Recommended Next Tasks

- Add a later browser/jsdom-backed controlled input restoration oracle before enabling real DOM mutation.
- Add a separate live value-tracker admission gate before allowing descriptor installation or tracker field writes.
- Extend live preflight coverage only after radio group ownership and form traversal gates exist.
