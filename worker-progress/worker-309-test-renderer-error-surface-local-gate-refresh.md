# Worker 309 - Test Renderer Error Surface Local Gate Refresh

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup.
- Active goal status after setup: `active`.
- Active goal objective after setup:
  `Refresh the react-test-renderer error-surface local gate after accepted create/update/unmount, serialization, TestInstance, and act private gates. Admit only private diagnostic rows and keep public error behavior compatibility blocked.`
- `ORCHESTRATOR.md` was not read.
- No nested managed agents were spawned.

## Summary

Refreshed the local react-test-renderer error-surface gate around the accepted
private diagnostic prerequisites while keeping public error compatibility
blocked.

The gate now admits only private diagnostic rows for create routing, update,
unmount, private JSON serialization, committed-fiber/TestInstance diagnostics,
and act/Scheduler metadata. The checked React error-surface oracle remains
React-only, every public error-surface scenario remains a blocked row, and the
gate rejects premature public compatibility claims.

Public shallow and TestInstance error surfaces stay blocked explicitly.

## Changed Files

- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-309-test-renderer-error-surface-local-gate-refresh.md`

## Evidence Gathered

- Required context read: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Requested worker context inspected:
  - 265: private JSON diagnostics ready while public serialization stays
    blocked.
  - 267: TestInstance query/public serialization surfaces remain fail-closed.
  - 268: react-test-renderer act and Scheduler shell remain blocked.
  - 291: serialization local gate is ready for private diagnostics while public
    compatibility remains blocked.
  - 304-308: sibling worktrees exist, but no completed markdown progress
    reports were present; only codex logs were present and the branches still
    pointed at the queue commit.
- Current source evidence proves accepted private readiness through package
  routing metadata, Rust diagnostic symbols, private act queue metadata, and
  placeholder public package surfaces.
- The new gate keeps React oracle claims false and rejects a mutated oracle
  with `compatibilityClaimed: true`.

## Commands Run

```sh
create_goal
get_goal
pwd && ls
sed -n '<ranges>' WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md
rg --files worker-progress | rg 'worker-(265|267|268|291|304|305|306|307|308)([^0-9]|$)'
sed -n '<ranges>' worker-progress/worker-265-test-renderer-private-json-ready-diagnostics.md
sed -n '<ranges>' worker-progress/worker-267-test-renderer-testinstance-query-blocked-gate.md
sed -n '<ranges>' worker-progress/worker-268-react-test-renderer-act-blocked-gate.md
sed -n '<ranges>' worker-progress/worker-291-test-renderer-serialization-local-gate-ready-private.md
find /Users/user/Developer/Developer -maxdepth 1 -type d -name 'fast-react-worker-30[4-8]*' -print
find /Users/user/Developer/Developer/fast-react-worker-30[4-8]* -path '*/worker-progress/*30[4-8]*' -maxdepth 4 -type f -print
git -C <worker-304..308-worktree> status --short
sed -n '<ranges>' tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
sed -n '<ranges>' tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
sed -n '<ranges>' tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
sed -n '<ranges>' tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
sed -n '<ranges>' tests/conformance/test/react-test-renderer-act-oracle.test.mjs
sed -n '<ranges>' packages/react-test-renderer/index.js
sed -n '<ranges>' packages/react-test-renderer/shallow.js
rg -n '<react-test-renderer private/public gate patterns>' packages tests crates worker-progress
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
node --check tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --test tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --test tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs tests/conformance/test/react-test-renderer-act-oracle.test.mjs
node --input-type=module - <<'NODE' # inspect computed error-surface gate blockers
node --test tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs tests/conformance/test/react-test-renderer-act-oracle.test.mjs
npm run test:react-test-renderer:serialization --workspace @fast-react/conformance
npm run check:js
git add -N worker-progress/worker-309-test-renderer-error-surface-local-gate-refresh.md
git diff --check
git status --short
git diff --stat
```

## Verification Results

- `node --check` for the three touched `.mjs` files: passed.
- Focused error/create/serialization-local suite: passed, 24 tests.
- Focused error/create/serialization-local/serialization-oracle/act suite:
  passed, 48 tests.
- `npm run test:react-test-renderer:serialization --workspace @fast-react/conformance`:
  passed, 16 tests.
- `npm run check:js`: passed, including package-surface, smoke imports,
  benchmark gates, workspace checks, native loader checks, and 562 conformance
  tests.
- `git diff --check`: passed.

An initial focused run failed because the new act private diagnostic row relied
on a passive-effects source comment that the gate's source scanner strips. The
gate now uses code symbols plus absence of effect callback execution tokens.

## Risks Or Blockers

- The new local gate is source-pattern backed. Future symbol renames in the
  private Rust or JS diagnostic surfaces will need an explicit gate refresh.
- Public react-test-renderer error compatibility remains intentionally
  blocked. This change does not implement public create/update/unmount routing,
  public serialization, TestInstance wrappers, act/Scheduler behavior, shallow
  compatibility, or any native/Rust JS bridge execution.
- Worker 304-308 markdown reports were not present locally; conclusions use
  current source evidence plus accepted worker reports that were available.

## Recommended Next Tasks

1. Reopen public error-surface admissions only after public renderer routing,
   serialization, TestInstance wrappers, act/Scheduler behavior, and shallow
   error mapping have direct conformance evidence.
2. When 304-308 land with completed reports, record their final worker evidence
   in accepted progress so future gate refreshes do not need codex-log
   inspection.
3. Keep private diagnostic rows separate from public React oracle scenario
   admissions in future test-renderer gate work.
