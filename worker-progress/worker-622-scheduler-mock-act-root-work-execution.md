# Worker 622 Scheduler Mock Act Root Work Execution

## Goal Evidence

- `create_goal` was called first with objective: `Extend private scheduler mock diagnostics so an expired callback can hand off to accepted act/root work metadata without flushing arbitrary renderer work.`
- Initial `get_goal` returned status `active` for that objective.
- Final `get_goal` before report writing returned status `active` for the same objective.
- No nested managed agents were spawned.

## Summary

- Added a private `scheduler/unstable_mock` expired act/root work metadata path
  without adding public Scheduler export keys or changing public mock behavior.
- The new branded metadata links a single expired branded mock callback handle
  to a still-pending accepted internal act queue and metadata-only root work
  records.
- The handoff rejects unbranded callbacks, stale or already-drained act queues,
  stale callback handles, ambiguous expired callback sets, public
  compatibility claims, and renderer-work execution claims before draining.
- The accepted drain runs only the matched expired branded mock callback and
  accepted internal act queue records. Unrelated non-expired Scheduler work
  remains pending, and public compatibility claims stay false.

## Changed Files

- `packages/scheduler/unstable_mock.js`
- `tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `worker-progress/worker-622-scheduler-mock-act-root-work-execution.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Reviewed accepted scheduler mock reports for expired work, expired-lane
  flushing, and private act queue diagnostics: workers 377, 404, 469, 518, and
  585.
- Inspected `packages/react/private-act-dispatcher-gate.js` to align accepted
  act queue records, internal test queue brands, renderer-backed act metadata,
  and public compatibility blockers.
- Confirmed the existing top-level scheduler mock wrapper is the private
  diagnostic layer that can add metadata without changing public export keys.

## Commands Run

```sh
node --check packages/scheduler/unstable_mock.js
node --check tests/conformance/test/scheduler-mock-oracle.test.mjs
node --test tests/conformance/test/scheduler-mock-oracle.test.mjs
node --test tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs
node --test tests/conformance/test/react-act-oracle.test.mjs
npm run check --workspace scheduler
git diff --check
```

## Verification Results

- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs` passed
  21 tests, including accepted act/root handoff, stale act queue rejection,
  unbranded callback rejection, and public claim rejection.
- `node --test tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs`
  passed 3 tests, confirming the prior expired-lane path still works.
- `node --test tests/conformance/test/react-act-oracle.test.mjs` passed 15
  tests, confirming the React private act consumer still accepts the scheduler
  diagnostics shape.
- `npm run check --workspace scheduler` passed the accepted import-entrypoint
  smoke checks. npm printed only the existing `minimum-release-age` warning.
- `git diff --check` passed.

## Risks Or Blockers

- No blocker remains in this worker scope.
- The new path is a private diagnostic bridge only. It does not make public
  Scheduler timing, public React act, renderer roots, passive effects, or
  root scheduler compatibility available.
- Direct CJS mock entrypoints were left unchanged because the accepted private
  wrapper already owns shadow callback-handle metadata while preserving public
  CJS mock behavior.

## Recommended Next Tasks

- Keep public act/root compatibility blocked until renderer roots, passive
  effects, and public act queue semantics are admitted together.
- If future root schedulers emit real JS metadata, have them produce this
  branded act/root handoff shape instead of widening the expired mock drain.
