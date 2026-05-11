# Worker 857 Progress

## Summary

- Consumed accepted scheduler-driven passive effect evidence from Workers 836
  and 837 in the React private act dispatcher gate and the React DOM
  `test-utils` private act gate.
- Linked root commit passive execution, pending passive handoff, scheduler
  passive flush request/gate/execution, and passive callback execution evidence
  into private act flushing diagnostics.
- Preserved Worker 834 and 846 Scheduler source-proof load ordering and
  descriptor/source validation by continuing to require the React private gate
  to load before fresh Scheduler mock evidence is accepted.
- Kept public `act`, public root execution, Scheduler timing compatibility,
  renderer/effects compatibility, and package surface compatibility blocked.
- Addressed audit blocker by requiring every nested passive diagnostic record to
  be frozen and source-owned by the same top-level scheduler-driven passive
  diagnostic, not only by top-level WeakSet ownership.

## Changed Files

- `packages/react/private-act-dispatcher-gate.js`
- `packages/react-dom/src/test-utils-act-gate.js`
- `packages/react-dom/test/react-dom-test-utils-act-gate.test.js`
- `tests/conformance/test/react-act-oracle.test.mjs`
- `tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `worker-progress/worker-857-react-dom-act-passive-consumer.md`

## Commands Run

- `node --test tests/conformance/test/react-act-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `node --test packages/react-dom/test/react-dom-test-utils-act-gate.test.js`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence

- React private act accepts only branded, frozen, source-owned
  scheduler-driven passive diagnostics linked to accepted Scheduler expired
  act/root diagnostics.
- React private act rejects missing Scheduler source proof, stale passive
  handoffs, cross-root passive commit evidence, cloned top-level diagnostics,
  public aliases, prose/test-title/source-syntax payloads, and error-message
  payloads.
- Audit follow-up added nested ownership tokens so a WeakSet-owned top-level
  diagnostic with caller-built nested passive records is rejected with
  `scheduler-driven-passive-diagnostics-nested-passive-ownership`.
- React DOM `test-utils` delegates scheduler-driven passive diagnostic
  admission to the React private gate and carries the same rejection behavior
  through its private consumer.
- Package-surface and import smoke checks passed, confirming no new public
  package surface was exposed.

## Risks Or Blockers

- No active blocker remains for this worker after the nested source-ownership
  audit fix.
- The route is intentionally package-private diagnostic plumbing. It does not
  execute public `React.act`, public root work, public passive effects, public
  Scheduler timing behavior, renderer work, or package compatibility.
- Coverage is focused on the private gates and conformance oracle tests touched
  by this worker; a full repository test suite was not run.

## Recommended Next Tasks

- Keep future private act consumers source-owned at every nested evidence layer;
  do not rely on top-level diagnostic branding alone.
- If public `act` passive draining is pursued later, require separate evidence
  for public callback ordering, warnings, thenable behavior, root execution,
  effect execution, and Scheduler timing compatibility.
- Preserve Scheduler source-proof load ordering in new React DOM focused tests
  by loading the React private act gate before fresh Scheduler mock modules.
