# Worker 742: Scheduler Mock Delayed Act/Root Continuation

## Goal Evidence

- Initial `get_goal` status: `active`.
- Initial objective: add a private Scheduler mock diagnostic path for a
  delayed branded callback carrying accepted act/root metadata, while keeping
  public Scheduler timing, public act/root, renderer execution, and public
  flush-helper compatibility claims blocked.
- No nested managed agents were spawned.

## Summary

- Added a private `scheduler/unstable_mock` delayed act/root work metadata and
  diagnostics route behind the existing non-enumerable private flush diagnostic
  export.
- The route accepts only branded internal test callbacks and accepted expired
  act/root metadata, validates the delayed handle, delay, start time,
  expiration time, and priority timeout metadata, then advances mock virtual
  time to the callback expiration point.
- After virtual-time promotion, the route reuses the existing accepted expired
  act/root work drain and records promotion evidence, consumed root work
  records, act queue drain details, and preserved public-compatibility blocks.
- Fixed the audit finding where a branded delayed callback could return an
  unbranded function and let the source mock Scheduler install and execute that
  public continuation. The private expired act/root drain now guards the
  scheduled callback at drain time, revalidates every returned function before
  it can be installed, and recursively guards accepted branded continuations.
- The delayed route passes its delayed metadata error factory into the reused
  expired route, so delayed continuation-brand failures reject as delayed
  act/root diagnostic failures.
- Added focused conformance coverage for the successful delayed promotion path
  and rejection of unbranded callbacks, cancelled handles, wrong delay or
  expiration metadata, ambiguous pending delayed work, and public compatibility
  claims.
- Added focused negative conformance coverage for a branded delayed callback
  returning an unbranded continuation. The test proves the unbranded
  continuation does not run, public Scheduler work does not run, and accepted
  act/root metadata is not consumed after the rejection.

## Changed Files

- `packages/scheduler/unstable_mock.js`
- `tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
- `worker-progress/worker-742-scheduler-mock-delayed-act-root-continuation.md`

## Commands Run

- `node --check packages/scheduler/unstable_mock.js` - passed.
- `node --check tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs` - passed.
- `node --test tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs` - passed, 3 tests.
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs` - passed, 23 tests.
- `node --test tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs` - passed, 3 tests.
- `npm run check --workspace scheduler` - passed; npm printed the existing `minimum-release-age` warning.
- `npm run check:package-surface` - passed; npm printed the existing `minimum-release-age` warning.
- `git add -N tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs worker-progress/worker-742-scheduler-mock-delayed-act-root-continuation.md && git diff --check; rc=$?; git reset -q -- tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs worker-progress/worker-742-scheduler-mock-delayed-act-root-continuation.md; exit $rc` - passed.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, existing Scheduler mock wrapper diagnostics, focused
  Scheduler mock conformance tests, and recent related worker reports for
  expired-lane/root continuation and postTask delayed act/root metadata.
- Confirmed the existing private expired act/root route already consumes
  accepted root work records and accepted private act queues without public
  Scheduler, React act, root, renderer, or effect compatibility claims.
- Confirmed delayed mock Scheduler tasks expose `startTime`, `expirationTime`,
  and `sortIndex`, and advancing mock virtual time to the expiration point
  promotes the delayed timer into expired scheduler work without executing it
  until the private drain is called.
- Confirmed the source mock Scheduler installs any returned function as the
  task continuation without branding checks, which allowed the delayed
  act/root route to execute an unbranded returned continuation before this fix.
- Confirmed the new guard rejects
  `callback-continuation-not-branded-internal-test-callback` during the delayed
  private route before unbranded continuation work, public Scheduler work, root
  record consumption, or private act queue consumption occurs.
- Confirmed no Scheduler module export keys or package subpaths were added.

## Risks Or Blockers

- No blocker remains for this worker scope.
- The delayed route is private diagnostic metadata only. It does not claim
  public Scheduler timing compatibility, public React act compatibility, public
  root scheduler compatibility, public renderer compatibility, effect
  execution, or renderer-root execution.
- The validator intentionally rejects ambiguous delayed or soon-expired work
  before advancing virtual time, because promoting to the target expiration
  could otherwise let unrelated expired work run through the existing source
  expired-work drain.
- A malicious branded private test callback body can still perform arbitrary
  side effects before it returns. This diagnostic continues to trust the
  private brand for callback bodies, and now fail-closes on any returned
  unbranded/public continuation before that continuation is installed or run.

## Recommended Next Tasks

1. Keep public act/root compatibility blocked until renderer roots, passive
   effects, and public act queue semantics can be admitted together.
2. If future root metadata producers generate delayed Scheduler mock handoffs,
   have them emit this private delayed metadata shape rather than relying on
   public flush helpers or broad Scheduler timing claims.
