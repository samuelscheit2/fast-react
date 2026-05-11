# Worker 792 React Delayed Renderer Root Preflight

## Summary

- Taught `packages/react/private-act-dispatcher-gate.js` to accept Scheduler
  mock delayed act/root diagnostics produced from accepted delayed
  renderer-root metadata.
- The delayed preflight still treats the top-level delayed report as private
  context only: it consumes the nested expired act/root report through the
  existing expired diagnostic consumer and keeps
  `acceptsTopLevelDelayedActRootWorkAsPublicActEvidence` false.
- Renderer-root-produced delayed reports now require the Scheduler-owned
  top-level delayed source proof plus present renderer-root source summaries
  with `sourceEvidenceMatches: true`, producer kind/status, timing, root, act
  queue, and public-blocker fields intact.
- Root-produced delayed reports remain accepted by the same preflight, with
  renderer-root evidence marked absent and not owned.
- Public React act, public Scheduler timing, public root scheduler, public
  renderer, queued work, effects, renderer work, renderer roots, and package
  compatibility claims all remain false.

## Changed Files

- `packages/react/private-act-dispatcher-gate.js`
- `tests/conformance/test/react-act-oracle.test.mjs`
- `worker-progress/worker-792-react-delayed-renderer-root-preflight.md`

## Commands Run

- `node --check packages/react/private-act-dispatcher-gate.js` - passed.
- `node --check tests/conformance/test/react-act-oracle.test.mjs` - passed.
- `node --test tests/conformance/test/react-act-oracle.test.mjs` - passed,
  19 tests.
- `node --test tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
  - passed, 5 tests.
- `node --test tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs`
  - passed, 3 tests.
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs` -
  passed, 23 tests.
- `npm run check --workspace @fast-react/react` - passed; npm printed the
  existing `minimum-release-age` warning.
- `npm run check --workspace scheduler` - passed; npm printed the existing
  `minimum-release-age` warning.
- `npm run check:package-surface` - passed; npm printed the existing
  `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, Worker 765, Worker 772, and Worker 775 progress
  notes, `packages/react/private-act-dispatcher-gate.js`, focused React act
  tests, and Scheduler delayed/expired tests.
- Confirmed Scheduler already emits renderer-root producer summaries on delayed
  reports: `producedByPrivateDelayedRendererRootProducer`,
  `delayedRendererRootMetadata`, and nested expired act/root diagnostics.
- Confirmed React's expired consumer still rejects top-level delayed reports by
  delayed brand mismatch, so top-level delayed reports are not public act
  evidence.
- Added React test coverage that accepts a Scheduler-owned
  renderer-root-produced delayed report through the delayed preflight only,
  consumes the nested expired report, and rejects shallow clones, old-global
  forged top-level clones, deep old-global forged clones, missing top-level
  renderer-root source summaries, mutated renderer-root source summaries, and
  public React act claims.
- Confirmed the existing root-produced delayed preflight still accepts and now
  records `accepted-root-metadata` producer evidence with no renderer-root
  source evidence.

## Risks Or Blockers

- No blocker remains for this worker scope.
- Merge overlap risk is limited to ongoing React act/Scheduler delayed workers
  touching the same private diagnostics and conformance tests. The change does
  not modify Scheduler producer code.
- The new renderer-root acceptance remains private diagnostics-only and depends
  on Scheduler source-owned report identity; cloned or forged reports continue
  to reject.

## Recommended Next Tasks

- Keep public React act/root/renderer compatibility blocked until renderer
  roots, passive effects, and public act queue semantics are admitted together.
- If Scheduler changes the renderer-root summary shape, update this React
  preflight and its clone/forgery tests in the same change.
