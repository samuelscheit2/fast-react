# Worker 336 - Test Renderer Error Surface Public Blockers Refresh

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available and returned status `active`.
- Active goal objective after setup:
  `Refresh the react-test-renderer error-surface local gate after the new private root, TestInstance, serialization, and act work, admitting only private diagnostics and keeping every public error-surface scenario blocked.`
- `get_goal` was checked again during continuation and the same objective was
  active.
- No nested managed agents were spawned.

## Summary

Refreshed the focused react-test-renderer error-surface gate coverage after the
new private root, private toJSON, record-only TestInstance, and act/Scheduler
metadata work.

The error-surface oracle test now proves that private diagnostics are ready
only as private rows, every public scenario remains blocked with the full
public unblock list, and every public compatibility claim source is rejected.
The create-routing gate test now cross-checks the full private diagnostic row
set against the current runtime routing gate metadata while keeping public
compatibility false.

No public react-test-renderer error behavior was implemented.

## Changed Files

- `tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-336-test-renderer-error-surface-public-blockers-refresh.md`

## Commands Run

```sh
create_goal
get_goal
sed -n '<ranges>' WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md
sed -n '<ranges>' worker-progress/worker-210-react-test-renderer-js-create-failclosed.md
sed -n '<ranges>' worker-progress/worker-267-test-renderer-testinstance-query-blocked-gate.md
sed -n '<ranges>' worker-progress/worker-268-react-test-renderer-act-blocked-gate.md
sed -n '<ranges>' worker-progress/worker-291-test-renderer-serialization-local-gate-ready-private.md
sed -n '<ranges>' worker-progress/worker-309-test-renderer-error-surface-local-gate-refresh.md
rg --files docs worker-progress | rg '336|33[2-5]|test-renderer-error-surface'
sed -n '<ranges>' docs/tasks/worker-332-test-renderer-js-private-root-native-bridge.prompt.md
sed -n '<ranges>' docs/tasks/worker-333-test-renderer-tojson-host-output-private-path.prompt.md
sed -n '<ranges>' docs/tasks/worker-334-test-renderer-testinstance-private-query-path.prompt.md
sed -n '<ranges>' docs/tasks/worker-335-test-renderer-act-scheduler-flush-private-path.prompt.md
sed -n '<ranges>' docs/tasks/worker-336-test-renderer-error-surface-public-blockers-refresh.prompt.md
sed -n '<ranges>' tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
sed -n '<ranges>' tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
sed -n '<ranges>' tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
rg -n '<react-test-renderer private/public gate patterns>' tests packages
node --check tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --test tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
npm run check --workspace @fast-react/react-test-renderer
git diff --check
git add -N worker-progress/worker-336-test-renderer-error-surface-public-blockers-refresh.md
git diff --check
git status --short
git diff --stat
```

## Evidence Gathered

- Required context read: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Requested worker reports inspected where present: 210, 267, 268, 291, and
  309. Worker reports 332-335 were not present as markdown reports; their
  prompt files were inspected and current source/package metadata was used as
  evidence.
- Local gate evidence now asserted from the focused tests:
  private toJSON facade metadata is present and publicly blocked, private
  TestInstance wrapper metadata is record-only, act/passive metadata remains
  metadata-only, public JS facade routing is absent, and public toJSON, toTree,
  TestInstance, act/Scheduler, create/update/unmount, and shallow readiness are
  all false.
- Focused verification passed:
  `node --test tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
  with 22 passing tests.
- Package verification passed:
  `npm run check --workspace @fast-react/react-test-renderer`.
- `git diff --check` passed.
- Final `git diff --check` also passed after marking the new report
  intent-to-add.

## Risks Or Blockers

- The local gate remains source-pattern backed. Future symbol or metadata
  renames in the private react-test-renderer gate surfaces should refresh these
  assertions explicitly.
- Public react-test-renderer error compatibility remains intentionally blocked.
  This work does not implement public create/update/unmount routing, public
  serialization, public TestInstance wrappers, public act/Scheduler flushing,
  shallow compatibility, or Fast React/react-test-renderer dual-run claims.
- No completed worker 332-335 markdown reports were available in this worktree;
  conclusions use the current source and package metadata plus their prompts.

## Recommended Next Tasks

1. Reopen public error-surface scenario admissions only after public renderer
   routing, serialization, TestInstance wrappers, act/Scheduler behavior, and
   shallow error mapping each have direct conformance evidence.
2. Keep private diagnostic rows separate from public React oracle scenario
   admissions in future test-renderer gate work.
3. When worker 332-335 final reports land, preserve their exact evidence in
   accepted progress so later gate refreshes do not need prompt/source
   reconstruction.
