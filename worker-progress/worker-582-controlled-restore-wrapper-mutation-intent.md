# Worker 582: Controlled Restore Wrapper Mutation Intent

## Goal

- Status: active
- Objective: Add private controlled input wrapper mutation-intent diagnostics after accepted restore write execution and flush blocker records, without real wrapper writes.
- `get_goal`: available; active goal/objective matched this worker task.

## Summary

Added a private controlled post-event restore wrapper mutation-intent gate that
consumes accepted write-execution and flush-blocker records together. The new
record cross-checks that both source records come from the same accepted
preflight rows, records wrapper operation names and per-target/control
metadata, and captures intended value or checked updates as metadata only.

The gate keeps all live behavior blocked: no restore queue writes or flushes,
no wrapper invocation, no wrapper property writes, no host value reads/writes,
no value tracker writes, no radio group lookup, no browser control mutation,
and no public compatibility claim.

## Changed Files

- `packages/react-dom/src/client/controlled-restore-queue.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `worker-progress/worker-582-controlled-restore-wrapper-mutation-intent.md`

## Evidence Gathered

- Required context read after goal setup: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Worker 547 report confirmed accepted write-execution records model queue
  mutation intent without live queue writes, flushing, wrappers, DOM reads, or
  radio lookup.
- Worker 548 report confirmed accepted flush-blocker records model the queue
  snapshot, intended flush order, wrapper operation names, and blocker reasons
  while actual wrapper restore remains blocked.
- React 19.2.6 reference reads confirmed the public ordering remains event
  batch exit, restore queue snapshot, and host wrapper restore dispatch; this
  worker records only the private wrapper mutation intent boundary.
- The new tests cover accepted value/checked wrapper intents plus stale,
  foreign, and wrong-record rejection paths.
- Source token scan of `controlled-restore-queue.js` found no newly introduced
  live controlled adapter/helper tokens.

## Verification

- `node --check packages/react-dom/src/client/controlled-restore-queue.js`
- `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --check tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `node --test --test-name-pattern='private controlled restore wrapper mutation intent consumes execution and flush blockers only' packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test --test-name-pattern='private controlled restore wrapper mutation intent records blocked value and checked updates' tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

All verification commands passed. npm emitted the existing
`minimum-release-age` warning during workspace verification; it did not fail the
run.

## Risks Or Blockers

- No blockers remain.
- The new wrapper intent gate is private metadata only and intentionally does
  not prove public controlled input/select/textarea compatibility.
- The wrapper intent source pair must share the same accepted preflight. Older
  flush blockers and foreign flush blockers are rejected to avoid stitching
  unrelated queue diagnostics together.

## Recommended Next Tasks

- Add a later private gate only when actual wrapper execution can be modeled
  behind fake-DOM adapters without opening public controlled behavior.
- Keep radio group lookup, live value tracking, and browser DOM mutation as
  separate gates before any compatibility claim.
