# Worker 649: Hydration Recoverable Error Callback Execution

## Goal Evidence

- `create_goal` was called as the first action before file reads, research,
  implementation, or verification.
- Active goal status from `get_goal` after setup: `active`.
- Active goal objective from `get_goal` after setup: advance private hydration
  recoverable-error routing to a gated callback invocation proof that records
  root option ownership while public hydrateRoot compatibility remains blocked.
- `get_goal` before this report was available and returned the same objective
  with status `active`.

## Summary

- Added a private root-bridge hydration recoverable-error callback invocation
  gate.
- The gate consumes the existing metadata-only hydration recoverable-error
  routing record, requires `enableCallbackInvocation: true`, verifies the
  caller is using the original hydrateRoot options object, and invokes only the
  owned `onRecoverableError` option.
- The returned invocation proof records root option ownership, callback
  argument/error-info summaries, callback return/error status, and hidden
  payload identity, while public hydrateRoot execution, hydration compatibility,
  queueRecoverableErrors, DOM mutation, root error update scheduling, and public
  callback compatibility remain blocked.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `worker-progress/worker-649-hydration-recoverable-error-callback-execution.md`

## Commands Run And Results

- `node --check packages/react-dom/src/client/root-bridge.js`: passed.
- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`:
  passed.
- `node --check packages/react-dom/test/hydration-private.test.js`: passed.
- `node --check packages/react-dom/test/hydration-boundary.test.js`: passed.
- `node --test packages/react-dom/test/hydration-private.test.js`: passed, 5
  tests.
- `node --test packages/react-dom/test/hydration-boundary.test.js`: passed, 10
  tests.
- `npm run check --workspace @fast-react/react-dom`: passed, 126 package tests
  and entrypoint smoke checks. npm printed the existing unknown
  `minimum-release-age` config warning.
- `git diff --check`: passed.

## Evidence Gathered

- Read `WORKER_BRIEF.md` before implementation-file inspection.
- Read worker reports 619, 445, 138, and 161 for the existing hydration
  recoverable-error route and root error option ownership context.
- Inspected `hydration-boundary-gate.js`, `root-bridge.js`,
  `hydration-private.test.js`, and `hydration-boundary.test.js`.
- Checked the local React 19.2.6 reference source:
  `ReactDOMRoot.js` stores `onRecoverableError` from hydrateRoot options, and
  `ReactFiberWorkLoop.js` invokes `root.onRecoverableError(error, errorInfo)`
  after committed recoverable errors.
- The new test proves the private gate rejects missing gate enablement, rejects
  a different root options object, invokes exactly one owned
  `onRecoverableError`, records root option ownership, and leaves public
  hydrateRoot compatibility flags false.

## Risks Or Blockers

- No blocker remains for this worker scope.
- The invocation gate is private and explicit. It does not mutate the source
  frozen routing metadata, so repeated private calls would create separate
  invocation proofs; public compatibility remains blocked either way.
- Callback throw handling is recorded in the private proof but is not a React
  public error reporting claim.

## Recommended Next Tasks

- Add a later private commit-phase recoverable-error bridge once real
  reconciler recoverable error queues exist.
- Keep public `hydrateRoot` compatibility false until hydration roots,
  hydratable target claiming, text patching, boundary clearing, and public
  callback timing are all proven together.

## Nested Agents

- No nested agents were used.
