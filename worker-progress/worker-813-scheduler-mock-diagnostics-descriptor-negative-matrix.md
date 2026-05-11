# Worker 813 - Scheduler Mock Diagnostics Descriptor Negative Matrix

## Status

Complete.

## Summary

Hardened Scheduler mock private brand validation so inherited or tampered
private brands no longer satisfy Scheduler-owned private diagnostics checks.
Added focused conformance coverage for locked private diagnostics descriptors,
absent helper aliases/symbols, inherited/tampered act queue brands, inherited
and tampered expired lane metadata, expired act/root metadata, delayed
act/root metadata, and delayed renderer-root source metadata.

## Changed Files

- `packages/scheduler/cjs/scheduler-unstable_mock.development.js`
- `packages/scheduler/cjs/scheduler-unstable_mock.production.js`
- `packages/scheduler/unstable_mock.js`
- `tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
- `tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs`
- `worker-progress/worker-813-scheduler-mock-diagnostics-descriptor-negative-matrix.md`

## Evidence Gathered

- Baseline focused Scheduler tests passed before changes.
- Local probe showed inherited private brands were accepted by Scheduler mock
  act-queue and expired act/root metadata validators before the hardening.
- Focused tests passed after hardening and new coverage.

## Verification

- `node --check packages/scheduler/cjs/scheduler-unstable_mock.development.js`
- `node --check packages/scheduler/cjs/scheduler-unstable_mock.production.js`
- `node --check packages/scheduler/unstable_mock.js`
- `node --check tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `node --check tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
- `node --check tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs`
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs`
- `npm run check --workspace scheduler`
- `node -e "...scheduler mock import smoke..."`
- `git diff --check`

## Risks Or Blockers

- `packages/scheduler/unstable_mock.js` was touched to fix the real fail-closed
  routing/validator bug found by probes, even though the prompt's primary source
  ownership named the CJS files. This overlaps with other Scheduler workers and
  should be reviewed during merge.

## Recommended Next Tasks

- Keep React private act dispatcher gate brand admission aligned with the
  stricter Scheduler-owned validator expectations in a separate React-owned
  pass if needed.
