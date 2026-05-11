# Worker 992 - Test Renderer Act Scheduler Blocker Refresh

## Repair Addendum

- Repaired Scheduler helper source proof so CJS dev/prod no longer trust
  `schedulerMockExpiredActRootWorkSourceValidator` from the caller-provided
  diagnostics object being validated.
- Added CJS dev/prod trusted Scheduler mock module capture through a
  `scheduler/unstable_mock.js` source-proof load hook plus lazy refresh, and
  try the captured validator before refreshing so cache-deleted Scheduler
  instances remain provable.
- Broadened private act/Scheduler own-claim scanning so truthy `native*`
  aliases, including `nativeExecutionAvailable` and runtime-style aliases,
  reject as public/native claims.
- Added regression coverage for cloned Scheduler diagnostics with a fake frozen
  self-validator and native alias smuggling across both CJS dev/prod
  entrypoints.

## Repair Verification

- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `node --check tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- `git diff --cached --check`

## Repair Risks Or Blockers

- No blockers.
- The CJS bundles now install a Scheduler mock source-proof load hook matching
  the existing React private act gate pattern. This keeps cache-deleted
  Scheduler helper instances source-provable without accepting caller-shaped
  validator objects.

## Summary

- Added a CJS private `act`/Scheduler blocker-currentness diagnostic lane for
  `react-test-renderer` development and production builds.
- Made the lane accept only source-owned private act/update lifecycle evidence
  plus Scheduler-owned mock flush helper diagnostics from
  `packages/scheduler/unstable_mock.js`.
- Kept public `act`, Scheduler flush/timing behavior, native/root bridge
  execution, serialization compatibility, TestInstance broad compatibility,
  and package compatibility blocked.
- Hardened Scheduler helper metadata and currentness report validation against
  caller-shaped diagnostics, cloned reports, proxy-hidden public aliases,
  accessor/symbol/non-enumerable claims, native execution smuggling, and public
  act/Scheduler/package flags.

## Changed Files

- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-992-test-renderer-act-scheduler-blocker-refresh.md`

## Exact Private Currentness Path

1. `createPrivateActSchedulerBlockerCurrentnessReport(...)` describes the
   private act/update lifecycle boundary from accepted update execution,
   root lifecycle evidence, and finished-work identity.
2. The same report describes Scheduler helper metadata from a function carrier
   with the private `__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__`
   diagnostic property.
3. Scheduler diagnostics must be frozen, claim-free, and source-owned by the
   Scheduler mock source validator before they can be consumed.
4. Accepted currentness reports are recorded in a private WeakSet and
   `consumePrivateActSchedulerBlockerCurrentnessReport(...)` rejects cloned or
   stale shape-only rows before returning the consumption record.

## Commands Run

- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `node --check tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Results

- `react-test-renderer-act-oracle.test.mjs`: 13 tests passed.
- `react-test-renderer-create-routing-gate.test.mjs`: 41 tests passed.
- `npm run check --workspace @fast-react/react-test-renderer` passed through
  `tests/smoke/import-entrypoints.mjs`.
- `npm run check:package-surface` passed.
- Explicit `node tests/smoke/import-entrypoints.mjs` passed.
- `node --check` passed for both touched CJS bundles and both touched MJS
  conformance tests.
- `git diff --check` passed.

## Evidence Gathered

- CJS development and production expose the new static
  `react-test-renderer-act-scheduler-blocker-currentness-private-diagnostic`
  row and include Worker 992 in the private act/Scheduler gate ledger.
- The positive path consumes accepted update execution, source-owned lifecycle
  evidence, finished-work identity, and Scheduler-owned `unstable_flushExpired`
  helper diagnostics.
- Cloned currentness reports reject with
  `act-scheduler-blocker-currentness-source-proof`.
- Caller-shaped Scheduler diagnostics reject with
  `scheduler-diagnostics-source-proof`.
- Public/package flags, native execution smuggling, accessor claims, symbol
  claims, and proxy-hidden public claims reject before currentness acceptance.

## Risks Or Blockers

- No blockers.
- Worker 967 serialization-local output was not present in this worktree, so
  this change avoids depending on that unaccepted branch work.
- This remains a private diagnostic blocker lane only; it does not enable public
  act behavior, public Scheduler flushing/timing, serialization, TestInstance,
  native bridge execution, or package compatibility.

## Recommended Next Tasks

- If a later worker opens a real public act or Scheduler compatibility path,
  require this source-owned currentness lane and a separate public oracle before
  changing any public behavior.
- Keep future serialization-local repairs on their own source-owned evidence
  path rather than reusing this Scheduler blocker lane.
