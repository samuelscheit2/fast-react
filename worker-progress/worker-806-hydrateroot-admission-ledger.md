# Worker 806: hydrateRoot Admission Ledger

## Goal Evidence

- Active goal inspected with `get_goal` before file reads or edits.
- Work ran in the assigned worktree:
  `/Users/user/Developer/Developer/fast-react-worker-806-hydrateroot-admission-ledger`.
- Branch confirmed as `worker/806-hydrateroot-admission-ledger`.
- Scope stayed limited to a new static conformance ledger, focused ledger test,
  and this progress report.

## Summary

- Added a static/read-only private-admission ledger for accepted
  `react-dom/client.hydrateRoot` preflight evidence from Workers 762, 770, 776,
  786, and 797.
- The ledger pins durable worker ids, record types, gate ids/statuses,
  accepted capability ids, field names, and the ownership chain from
  marker/listener preconditions through target claiming, recoverable-error
  preflight, event replay preflight, and the matrix payload checks.
- The evaluator token-checks source/test/package-surface evidence only. It
  does not execute hydrateRoot, create roots, install listeners, mutate DOM,
  dispatch events, drain replay queues, invoke callbacks, or claim package or
  public hydration compatibility.
- The focused test covers positive recognition plus tampered source evidence,
  package-surface evidence drift, status/id/field/ownership drift, and public
  hydrateRoot/root/DOM/listener/replay/callback/package/hydration claim leaks.

## Changed Files

- `tests/conformance/src/private-admission-806-hydrateroot-preflight-ledger.mjs`
- `tests/conformance/test/private-admission-806-hydrateroot-preflight-ledger.test.mjs`
- `worker-progress/worker-806-hydrateroot-admission-ledger.md`

## Commands Run

- `node --check tests/conformance/src/private-admission-806-hydrateroot-preflight-ledger.mjs`
- `node --check tests/conformance/test/private-admission-806-hydrateroot-preflight-ledger.test.mjs`
- `node --test tests/conformance/test/private-admission-806-hydrateroot-preflight-ledger.test.mjs`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs --test-name-pattern "hydrateRoot preflight|target-claiming|event replay|recoverable"`
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs --test-name-pattern "recoverable-error preflight|target claiming|claimed replay|recoverable-error routing"`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- `git add --intent-to-add tests/conformance/src/private-admission-806-hydrateroot-preflight-ledger.mjs tests/conformance/test/private-admission-806-hydrateroot-preflight-ledger.test.mjs worker-progress/worker-806-hydrateroot-admission-ledger.md`
- `git diff --cached --check`
- `git commit -m "Add hydrateRoot private admission ledger"`
- `git commit --amend --no-edit`

## Verification

- New ledger syntax check passed.
- New ledger test passed: 5 tests.
- Focused root-public-facade hydrateRoot/root-facade checks passed: 31 tests.
- Focused hydration-boundary checks passed: 16 tests.
- Package surface guard passed. npm emitted the existing unknown
  `minimum-release-age` warning.
- Import-entrypoint smoke passed.
- `git diff --check` passed with the new files included via intent-to-add.
- `git diff --cached --check` passed before commit.

## Evidence Gathered

- Worker 762 evidence is pinned through marker/listener record type/status,
  marker/listener precondition field names, unchanged marker/listener state,
  and blockers for public hydrateRoot, root marker writes, root listener
  installation, event replay, recoverable-error routing, and compatibility.
- Worker 770 evidence is pinned through target-claiming gate id/status,
  canonical immutable target-claiming evidence, target-dispatch link and
  ownership diagnostics, retained target path fields, and blockers for target
  execution, public target claiming, hydrate instance work, replay drain, event
  dispatch, and hydration compatibility.
- Worker 776 evidence is pinned through recoverable-error preflight gate
  id/status, accepted boundary metadata, recoverable row counts, queued/would
  queue fields, and blocked callback invocation fields.
- Worker 786 evidence is pinned through event replay preflight status, claimed
  replay target-dispatch execution gate id/status, canonical replay execution
  metadata, blocked dispatch records, click replay dispatch diagnostics, and
  blocked dispatch/listener/callback fields.
- Worker 797 evidence is pinned through the matrix payload chain:
  preflight record arrays, marker/listener payload identity, recoverable-error
  payload identity, target-claim payload identity, and replay execution payload
  identity.
- Package compatibility remains blocked by checking `react-dom/client.js`,
  `packages/react-dom/package.json`, package surface guard metadata, and import
  smoke private-symbol assertions.

## Risks Or Blockers

- No blockers found.
- This is a static ledger only. It intentionally does not promote public
  `hydrateRoot`, public hydration compatibility, real root creation, DOM
  mutation, listener installation, replay queue drain/dispatch, callback
  invocation, or package export compatibility.
- Merge overlap risk is limited to conformance private-admission ledger files;
  active React DOM hydrateRoot implementation/test changes should not need to
  edit this ledger unless they intentionally change accepted durable ids or
  field names.

## Recommended Next Tasks

- Re-run the new ledger test after any worker changes hydrateRoot preflight
  record names, statuses, blocker fields, or ownership payload identity.
- Keep public `hydrateRoot` blocked until a later execution worker proves the
  full hydration root, DOM mutation, listener, event replay, recoverable-error,
  and compatibility path together.

## Audit Follow-up

- Follow-up blocker received after commit `c46b717`. The requested audit file
  `/root/audit_806_hydrateroot_ledger` was not present in this environment, so
  the fix followed the explicit blocker bullets from the orchestrator message.
- Removed self-populated `observedFieldNames` and all-false
  `publicBlockerClaims` from base ledger rows.
- Field coverage is now derived from evaluated evidence rows via durable
  function names, constants, statuses, and field names.
- Public blocker coverage is now derived from one evidence row per required
  blocker field, including `publicRootCreated`, `canHydrate`,
  `replayQueueDrained`, `packageCompatibilityClaimed`, package export blocking,
  root creation, DOM mutation, listener installation, replay drain/dispatch,
  callback invocation, and public hydration compatibility fields.
- Replaced brittle evidence tokens such as exact `assert.equal(...)` snippets,
  object-literal value snippets, and local scenario strings with source-owned
  function names, constants, statuses, and field names.
- Added negative coverage for missing public blocker evidence so a missing
  blocker token now fails the gate.

### Audit Verification

- `node --check tests/conformance/src/private-admission-806-hydrateroot-preflight-ledger.mjs`: passed.
- `node --check tests/conformance/test/private-admission-806-hydrateroot-preflight-ledger.test.mjs`: passed.
- `node --test tests/conformance/test/private-admission-806-hydrateroot-preflight-ledger.test.mjs`: passed, 5 tests.
- `npm run check:package-surface`: passed with the existing
  `minimum-release-age` npm warning.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `git diff --check`: passed.
