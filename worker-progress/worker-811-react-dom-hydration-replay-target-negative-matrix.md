# Worker 811: Hydration Replay Target Negative Matrix

## Summary

Added focused negative coverage around accepted private hydrateRoot hydration
replay, target claiming, recoverable-error, and replay-error metadata rows.
The tests prove stale root/container evidence, unowned replay targets, copied
marker/listener/target rows, public compatibility claims, event dispatch/replay
drain claims, listener invocation claims, DOM mutation claims, and callback
invocation claims remain fail-closed.

Fixed real validator gaps in `root-bridge.js`: private hydration replay error
metadata now rejects cloned ownership diagnostics, nested replay queue
diagnostics, and queue/drain-order rows that claim compatibility, queueing,
replay queue draining, event replay, dispatch, or hydration effects.

Audit follow-up hardened the nested evidence checks further so cloned
ownership diagnostics reach the intended nested validators. Ownership rows now
reject compatibility claims, blocked target rows reject compatibility claims,
nested drain diagnostics reject compatibility claims, and replay queue drain
rows reject public recoverable-error callback claims.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydration-private.test.js`
- `tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `worker-progress/worker-811-react-dom-hydration-replay-target-negative-matrix.md`

## Evidence Gathered

- A local probe showed `createHydrationReplayErrorMetadata` accepted cloned
  ownership diagnostics with `compatibilityClaimed`, `eventsReplayed`, or
  `replayQueuesDrained` set to `true`.
- The new root-bridge validator checks the ownership diagnostic, nested replay
  queue diagnostic, blocked event replay targets, and drain-order rows for
  blocked public/replay/hydration effect fields before replay error metadata can
  be recorded.
- Audit negatives now mutate cloned nested rows directly:
  `ownershipRows[].compatibilityClaimed`,
  `replayQueueDrainOrderDiagnostics.compatibilityClaimed`,
  `blockedEventReplayTargets[].compatibilityClaimed`, and
  `replayQueueDrainOrderDiagnostics.drainOrder[].publicOnRecoverableErrorInvoked`.
  Each assertion matches the nested validator message so regressions cannot pass
  by failing earlier at payload identity.
- Package hydration-private tests now reject foreign container dispatch rows,
  unowned replay targets, public target-dispatch links, replayed ownership
  diagnostics, claimed target rows that say they executed, and copied replay
  execution rows that claim dispatch, replay draining, listener invocation, or
  public hydrateRoot support.
- Conformance tests now reject stale ownership root ids, foreign bridge-owned
  records, unowned replay targets, tampered marker/listener hydrateRoot records,
  wrong recoverable-error route metadata, and callback invocation claims.
- Public hydrateRoot behavior remains blocked; no package surface exports were
  changed.

## Commands Run

- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/hydration-private.test.js`
- `node --check tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test packages/react-dom/test/hydration-private.test.js`
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs packages/react-dom/test/hydration-private.test.js`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

## Audit Follow-Up

- The requested audit file path `/root/audit_811_hydration_replay_target_negative_matrix`
  was not present in this environment, so the follow-up used the explicit
  blocker details from the audit message.
- Preserved public hydrateRoot/root creation/replay/DOM/listener/callback
  blockers while adding row-level public callback and compatibility rejection
  for replay error metadata.
- Re-ran syntax checks, combined focused hydration tests, the react-dom
  workspace check, and whitespace validation after the nested validator changes.

## Verification

- Focused package hydration-private test passed: 11 tests.
- Focused hydration conformance test passed: 17 tests.
- Combined focused hydration command passed: 28 tests.
- `npm run check --workspace @fast-react/react-dom` passed: 178 package tests
  plus import-entrypoint smoke. npm emitted the existing unknown
  `minimum-release-age` config warning.
- `git diff --check` passed.

## Risks Or Blockers

- No blockers remain.
- Merge risk is limited to nearby hydrateRoot hydration replay, target claiming,
  and recoverable-error tests. Other workers have recently touched adjacent
  hydrateRoot preflight suites, but this worker only changed the assigned
  hydration-private/conformance files plus the root-bridge validator exposed by
  the fail-open probe.

## Recommended Next Tasks

- Re-run the focused hydration tests after merge conflict resolution if another
  worker also edits hydrateRoot replay or recoverable-error metadata validators.
- Keep future public hydrateRoot work gated behind these private evidence
  checks until real hydration root construction, listener installation, replay
  draining, DOM mutation, and callback timing are implemented together.
