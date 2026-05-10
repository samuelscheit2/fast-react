# Worker 747 React Private Act Expired Scheduler Consumer

## Summary

- Added a package-private React act consumer for the existing
  `scheduler/unstable_mock` expired act/root diagnostic report.
- The consumer accepts only frozen, branded
  `fast-react.scheduler.mock-expired-act-root-work-diagnostics` version 1
  reports from the current Scheduler mock diagnostic route.
- Acceptance requires private act queue drain evidence, consumed root-work
  records with no remainder, the private flushAll/flushExpired route evidence,
  and source expired-work drain evidence.
- Public React act, public Scheduler timing, public root scheduler, public
  renderer, renderer work, renderer roots, queued work, and effects
  compatibility claims remain false/blocked.
- Added React act conformance coverage for a real Scheduler mock expired
  act/root report plus fail-closed cloned reports for missing brand, wrong
  version, stale/unconsumed root work, invalid act queue drain evidence, public
  compatibility claims, public queue drain claims, and ambiguous diagnostics.
- Fresh-audit follow-up tightened nested evidence validation so top-level
  frozen branded clones no longer pass with mutable or weakened
  `rootWorkRecords`, consumed root-work evidence, or `actQueueDrainReport`
  evidence. The validator now requires the currently frozen Scheduler arrays,
  frozen records, exact root-work record key shape, frozen act queue drain
  reports, frozen drain records/continuation arrays, and current private
  callback/continuation evidence fields.
- Second post-fix audit follow-up added Scheduler-owned identity/payload
  linkage under the report's source drain evidence. The gate now rejects
  frozen cloned consumed-record arrays, frozen cloned consumed records, frozen
  cloned drained-record arrays, frozen cloned drained records, altered
  callback summaries, and altered continuation source fields, while still
  preserving the public compatibility blockers.
- Final audit hardening moved the source proof fully into
  `scheduler/unstable_mock` for the expired act/root diagnostic graph. React now
  validates Scheduler-owned WeakSet membership through a Scheduler-owned
  closure validator attached to existing mock flush helpers with a local
  non-global symbol; the old `globalThis`/`Symbol.for` proof token and source
  set are no longer used by production code.
- Added clone-first negative coverage before the valid report is accepted, so
  cloned consumed-record arrays, cloned consumed records, cloned
  drained-record arrays, cloned drained records, cloned source drain reports,
  shortened/prefix drain counts, and malformed nested drain evidence fail with
  controlled gate errors instead of relying on first-seen identity behavior.
- Added same-realm forgery probes proving top-level cloned and fully
  deep-cloned diagnostics remain rejected even when test code recreates the old
  global `Symbol.for` source proof, token, and WeakSet shape and marks the
  clones with it.
- Latest audit hardening made Scheduler's wrapped function export slots
  non-writable and non-configurable, freezes the wrapped functions after
  private validator descriptors are installed, and makes React reject validator
  discovery unless `Scheduler.unstable_flushExpired` is still the immutable
  Scheduler-owned function slot. Focused probes now try to replace every flush
  helper carrying the private validator and try to attach fake validator symbols
  to the frozen helpers before proving cloned diagnostics still reject.

## Changed Files

- `packages/react/private-act-dispatcher-gate.js`
- `packages/scheduler/unstable_mock.js`
- `tests/conformance/test/react-act-oracle.test.mjs`
- `worker-progress/worker-747-react-private-act-expired-scheduler-consumer.md`

## Commands Run

- `node --check packages/react/private-act-dispatcher-gate.js` - passed.
- `node --check packages/scheduler/unstable_mock.js` - passed.
- `node --check tests/conformance/test/react-act-oracle.test.mjs` - passed.
- `node --test tests/conformance/test/react-act-oracle.test.mjs` - passed,
  16 tests. Reruns after the unforgeable Scheduler validator hardening also
  passed, including reruns after immutable Scheduler function-slot hardening.
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs` -
  passed, 23 tests. Reruns after the unforgeable Scheduler validator hardening
  also passed, including reruns after immutable Scheduler function-slot
  hardening.
- `npm run check --workspace @fast-react/react` - passed; npm printed the
  existing `minimum-release-age` warning. Rerun after the unforgeable
  Scheduler validator hardening and immutable function-slot hardening also
  passed.
- `npm run check:package-surface` - passed; npm printed the existing
  `minimum-release-age` warning. Rerun after the unforgeable Scheduler
  validator hardening and immutable function-slot hardening also passed.
- `node tests/smoke/import-entrypoints.mjs` - passed. Rerun after the
  unforgeable Scheduler validator hardening and immutable function-slot
  hardening also passed.
- `git diff --check` - passed.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `packages/react/private-act-dispatcher-gate.js`,
  `tests/conformance/test/react-act-oracle.test.mjs`, and Scheduler mock
  conformance coverage.
- Reviewed and updated Scheduler mock source report construction in
  `packages/scheduler/unstable_mock.js` so the expired act/root diagnostic
  report and nested Scheduler-owned objects are enrolled in Scheduler-owned
  closure state before freezing.
- Rechecked Scheduler mock CJS act queue drain report construction to match the
  frozen `drainedRecords`, `recordedContinuations`, and `executedContinuations`
  evidence shape.
- Replaced the previous global `Symbol.for` source proof with a local-symbol
  Scheduler validator path and verified the old global token/set forgery no
  longer admits cloned reports.
- Hardened the public Scheduler wrapper against validator swapping by freezing
  wrapped functions, defining wrapped function export properties as
  non-writable/non-configurable, and requiring those descriptors during React's
  validator lookup.
- Reviewed prior worker evidence for Workers 683, 694, 712, and 718.
- The Worker 742 progress filename from the prompt was not present in this
  checkout; no substitute file was found by `rg --files`.

## Risks Or Blockers

- No blocker remains for this worker scope.
- This is private diagnostic consumption only. It does not expose new public
  React exports or package subpaths and does not claim public act, Scheduler
  timing, root execution, renderer compatibility, renderer work, effects, or
  package compatibility.
- The final source-proof hardening required editing Scheduler mock internals
  beyond the original React/test-only file list because React cannot
  distinguish Scheduler-owned nested evidence from clone-first frozen objects
  without Scheduler-owned closure state.
- The latest immutable function-slot hardening intentionally tightens public
  Scheduler mock function descriptors to protect private diagnostic proof
  lookup; package surface and import smoke checks still pass.
- The consumer intentionally follows the current Scheduler mock report brand,
  kind, version, and nested evidence shape; future Scheduler diagnostic shape
  changes should update this gate and its focused conformance tests together.

## Recommended Next Tasks

- Keep public React act and root/render compatibility blocked until renderer
  roots, passive effects, and public act queue semantics are admitted together.
- If future workers add new Scheduler mock expired act/root record kinds,
  extend this consumer only after the Scheduler diagnostic shape and
  conformance tests prove the new records remain private and fully consumed.
