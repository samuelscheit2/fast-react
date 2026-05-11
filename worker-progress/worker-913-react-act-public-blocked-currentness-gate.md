# Worker 913 React Act Public Blocked Currentness Gate

## Summary

- Added a source-owned private currentness report/consumer for public
  `React.act` in `packages/react/private-act-dispatcher-gate.js`.
- The report probes current package behavior for rootless sync, async, error,
  and thenable callback shapes and accepts only the unsupported placeholder:
  callbacks stay uninvoked, no act thenable is returned, no console/warning
  compatibility is claimed, and React Server keeps `act` absent.
- The gate uses accepted Workers 857 and 885 only as background for private
  passive/lifecycle boundary evidence and explicitly excludes Worker 902.
- Public `React.act`, React DOM/test-renderer act behavior, Scheduler timing,
  root work, passive effect execution, warnings, thenable behavior, renderer
  behavior, and package compatibility remain blocked.

## Changed Files

- `packages/react/private-act-dispatcher-gate.js`
- `tests/conformance/test/react-act-oracle.test.mjs`
- `tests/conformance/test/react-act-public-blocked-gate.mjs`
- `worker-progress/worker-913-react-act-public-blocked-currentness-gate.md`

## Evidence Gathered

- Positive currentness path:
  `createPublicReactActBlockedCurrentnessReport()` ->
  `isAcceptedPublicReactActBlockedCurrentnessReport()` ->
  `consumePublicReactActBlockedCurrentnessReport()`.
- Accepted report status:
  `blocked-public-react-act-unsupported-placeholder-currentness`; consumption
  status: `accepted-blocked-public-react-act-currentness`.
- Covered rootless scenarios:
  `rootless-sync-callback`, `rootless-async-callback`,
  `rootless-error-callback`, and `rootless-thenable-callback`.
- Negative canaries reject source-proof clones, forged compatibility flags,
  callback invocation, act thenable return, root/private prerequisite
  smuggling, public warning compatibility claims, and React Server `act`
  export drift.

## Commands Run

- `node --check packages/react/private-act-dispatcher-gate.js`
- `node --check tests/conformance/test/react-act-public-blocked-gate.mjs`
- `node --check tests/conformance/test/react-act-oracle.test.mjs`
- `node tests/conformance/test/react-act-public-blocked-gate.mjs`
- `node --test tests/conformance/test/react-act-public-blocked-gate.mjs`
- `node --test tests/conformance/test/react-act-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `npm run check --workspace @fast-react/react`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Risks Or Blockers

- No known blockers.
- The new gate is private diagnostic currentness evidence only. It does not
  execute public act callbacks, drain public act queues, return public act
  thenables, execute public roots/effects, admit public warnings, or claim
  package compatibility.
- Overlap risk: future Worker 902/react-test-renderer private act lifecycle
  evidence is still excluded and should not be treated as accepted input until
  merged by the orchestrator.

## Recommended Next Tasks

- Keep public React.act blocked until separate evidence proves callback
  ordering, async thenables, warning behavior, root execution, passive effects,
  Scheduler timing, and DOM/test-renderer renderer behavior together.
- Re-run the focused act gates after any merge that changes Worker 857 passive
  diagnostics, Worker 885 lifecycle boundaries, or public package shape.
