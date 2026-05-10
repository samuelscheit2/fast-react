# Worker 765: Scheduler Mock Delayed Root Producer Gate

## Goal Evidence

- Initial `get_goal` status: `active`.
- Initial objective: add the next private Scheduler mock delayed root/act
  producer gate building on Worker 742, proving accepted root metadata can
  produce and consume the delayed mock diagnostic shape without public Scheduler
  flush helpers or public React act/root compatibility.
- Spawned two read-only explorer agents:
  - `explore_scheduler_delayed_gate` inspected the Worker 742 delayed Scheduler
    route and confirmed the delayed metadata shape, timing checks, and minimal
    producer plug-in points.
  - `explore_react_private_act` inspected the React private act gate and
    confirmed `packages/react/private-act-dispatcher-gate.js` owns act queue
    branding but does not produce root metadata.

## Summary

- Added a Scheduler-private delayed act/root metadata producer on the existing
  non-enumerable private mock diagnostics object:
  `createDelayedActRootWorkMetadataFromAcceptedRootMetadataForDiagnostics`.
- The producer accepts branded expired act/root metadata, validates the delayed
  callback handle, priority, delay, start time, expiration time, priority
  timeout, act queue, and root work records, then emits Worker 742's delayed
  mock metadata shape.
- Produced delayed metadata is source-owned through a module-private `WeakMap`.
  The delayed drain path now rejects otherwise valid hand-branded or cloned
  delayed evidence that was not emitted by the private producer.
- Acceptance audit follow-up: the producer now snapshots produced-time nested
  act queue/root work evidence and the delayed route rejects later array
  replacement, record replacement, count changes, and missing act queue pending
  counts before injected records can run or drain.
- The delayed route still rejects unbranded callbacks/continuations, public
  compatibility claims, renderer/effect execution claims, stale handles, stale
  act queues, and ambiguous delayed/expired callback handles before any public
  Scheduler flush helper or public React act/root behavior is admitted.
- No public Scheduler exports, public React act behavior, renderer execution, or
  package entrypoints were changed.

## Changed Files

- `packages/scheduler/unstable_mock.js`
- `tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
- `worker-progress/worker-765-scheduler-mock-delayed-root-producer-gate.md`

## Commands Run

- `node --check packages/scheduler/unstable_mock.js` - passed.
- `node --check tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs` - passed.
- `node --test tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs` - passed, 4 tests.
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs` - passed, 23 tests.
- `node --test tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs` - passed, 3 tests.
- `node --test tests/conformance/test/scheduler-post-task-root-continuation.test.mjs` - passed, 5 tests.
- `node --test tests/conformance/test/private-admission-739-745-gate.test.mjs` - passed, 7 tests.
- `node --test tests/conformance/test/private-admission-746-753-gate.test.mjs` - passed, 8 tests.
- `npm run check --workspace scheduler` - passed; npm printed the existing `minimum-release-age` warning.
- `npm run check --workspace @fast-react/react` - passed; npm printed the existing `minimum-release-age` warning.
- `npm run check:package-surface` - passed; npm printed the existing `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, Worker 742 progress, Worker 585/622/712 prompts,
  `packages/scheduler/unstable_mock.js`,
  `packages/react/private-act-dispatcher-gate.js`, and focused Scheduler
  mock/postTask/root continuation tests.
- Confirmed Worker 742's delayed route already validates timing metadata and
  drains through the expired act/root route, but successful tests hand-built the
  delayed metadata shape directly.
- Confirmed the React private act dispatcher gate brands act queues/tasks/
  callbacks and consumes Scheduler private act diagnostics, but does not own
  delayed Scheduler mock root metadata production.
- Confirmed the new producer can create branded delayed metadata from accepted
  expired root metadata and that the delayed drain consumes it through the
  existing expired route.
- Confirmed cloned delayed metadata with the correct public `Symbol.for` brand
  is rejected as
  `metadata-not-produced-by-private-delayed-root-producer`.
- Confirmed post-production mutation of root work records rejects as
  `metadata-source-root-work-record-count-mismatch`, leaves the delayed callback
  unrun, and does not consume root or act records.
- Confirmed post-production replacement of an act queue task rejects as
  `metadata-source-act-queue-record-0-identity-mismatch` and the injected
  branded act callback does not run.
- Confirmed the private delayed producer rejects expired act/root metadata that
  omits the exact expected act queue pending count.
- Confirmed stale produced metadata is rejected after the delayed drain has
  consumed the callback, root work records, and act queue.
- Confirmed public Scheduler work remains pending and public flush-helper
  compatibility claims remain false.

## Risks Or Blockers

- No blocker remains for this worker scope.
- The producer is still private diagnostics-only. It does not claim public
  Scheduler timing compatibility, public React act compatibility, public root
  scheduler compatibility, public renderer compatibility, renderer work, or
  effect execution.
- The producer intentionally validates accepted expired act/root metadata at
  the delayed callback expiration time. Future renderer-owned delayed producers
  should preserve that exact callback handle and root metadata identity rather
  than cloning evidence.

## Recommended Next Tasks

1. Wire renderer-owned private root request producers to call this Scheduler
   delayed producer when a delayed mock callback should be promoted through the
   private act/root route.
2. Keep public act/root compatibility blocked until renderer roots, passive
   effects, and public act queue semantics can be admitted together.
