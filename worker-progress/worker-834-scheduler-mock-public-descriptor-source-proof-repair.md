# Worker 834 - Scheduler Mock Public Descriptor Source Proof Repair

## Status

Complete; ready for handoff.

## Progress

- Read `WORKER_BRIEF.md`.
- Inspected `packages/scheduler/unstable_mock.js`,
  `packages/react/private-act-dispatcher-gate.js`, and focused
  Scheduler/React act tests.
- Baseline focused oracle tests pass, but runtime probes confirm
  `packages/scheduler/unstable_mock.js` currently locks public function export
  descriptors while the checked Scheduler mock oracle expects writable and
  configurable descriptors.
- Updated `packages/scheduler/unstable_mock.js` to keep public mock exports
  writable/configurable while installing a locked Scheduler-owned module-cache
  source-validator record.
- Updated `packages/react/private-act-dispatcher-gate.js` to consume the
  Scheduler-owned module-cache record instead of treating public helper export
  descriptor immutability as proof.
- Added focused coverage for oracle-compatible public flush helper descriptors
  and for fake validator/replaced helper source-proof rejection.

## Verification So Far

- `node --check packages/scheduler/unstable_mock.js && node --check packages/react/private-act-dispatcher-gate.js`
- `node --check tests/conformance/test/scheduler-mock-oracle.test.mjs && node --check tests/conformance/test/react-act-oracle.test.mjs`
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/react-act-oracle.test.mjs`
- `npm run check --workspace scheduler`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- `git diff --cached --check`

## Changed Files

- `packages/scheduler/unstable_mock.js`
- `packages/react/private-act-dispatcher-gate.js`
- `tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `tests/conformance/test/react-act-oracle.test.mjs`
- `worker-progress/worker-834-scheduler-mock-public-descriptor-source-proof-repair.md`

## Evidence Gathered

- Runtime probes before the fix showed
  `packages/scheduler/unstable_mock.js` exposed
  `unstable_flushExpired` as `writable: false` and
  `configurable: false`, while the checked Scheduler mock oracle records
  `writable: true` and `configurable: true`.
- Runtime probes after the fix showed
  `unstable_flushExpired` is `writable: true`,
  `configurable: true`, and still has locked private helper diagnostics.
- React act focused coverage now confirms replacing the public
  `unstable_flushExpired` helper with a fake diagnostics-bearing helper does
  not let a cloned expired act/root report satisfy Scheduler-owned source
  proof.

## Risks Or Blockers

- No blocker remains in this worker scope.
- The React gate now reads a Scheduler-owned module-cache record. That keeps
  public Scheduler exports oracle-compatible, but it remains a package-private
  CommonJS contract and should be rerun if the Scheduler mock entrypoint is
  converted away from CommonJS module records.

## Recommended Next Tasks

- Re-run the focused Scheduler/React act suite after merging adjacent workers
  that touch `packages/scheduler/unstable_mock.js` or
  `packages/react/private-act-dispatcher-gate.js`.
