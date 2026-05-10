# Worker 440 - Package-Surface Private Facade Audit

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: audit and tighten package-surface
  guards around the private runtime facades added for react-test-renderer,
  React act, React DOM root output, and Scheduler diagnostics.

## Summary

Tightened the package-surface and import-entrypoint guards around accepted
private runtime facades without changing public export keys or package maps.

The package-surface snapshot now records the React DOM
`client.createRoot` symbol-only private facade adapter, the accepted
react-test-renderer `_Scheduler` private act-queue diagnostic string property
on flush helpers, and the Scheduler mock package's same private diagnostic
properties. The guard now verifies those private markers remain non-enumerable,
non-configurable, non-writable, frozen diagnostic records or symbol-only facade
properties, and absent from public string keys.

`import-entrypoints.mjs` now checks the same accepted private markers in both
local file imports and temporary `node_modules` package-resolution probes.

## Changed Files

- `tests/smoke/package-surface-guard.mjs`
- `tests/smoke/import-entrypoints.mjs`
- `tests/smoke/package-surface-snapshot.json`
- `worker-progress/worker-440-package-surface-private-facade-audit.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read requested reports present in this checkout: workers 258, 290, 321, 346,
  378, 408, 391, 392, 393, and 395.
- Also read worker 394 because it owns the current react-test-renderer private
  Scheduler act diagnostic consumer relevant to this audit.
- Worker reports 437 and 438 were not present in `worker-progress/`; their task
  prompts were present under `docs/tasks/` and were inspected.
- Inspected current runtime files for `react-test-renderer`, `react-dom/client`,
  React private act dispatcher gates, and Scheduler mock diagnostics.
- Confirmed current React act private dispatcher behavior remains package-private
  through `packages/react/private-act-dispatcher-gate.js` and existing blocked
  subpath guards; there was no new public `React.act` marker in this checkout.

## Commands Run

```sh
create_goal
get_goal
sed -n '<ranges>' WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md
sed -n '<ranges>' worker-progress/worker-258-react-test-renderer-package-surface-tightening.md
sed -n '<ranges>' worker-progress/worker-290-package-surface-private-diagnostics-guard.md
sed -n '<ranges>' worker-progress/worker-321-package-surface-private-file-blocklist-hardening.md
sed -n '<ranges>' worker-progress/worker-346-package-surface-new-private-gates-audit.md
sed -n '<ranges>' worker-progress/worker-378-package-surface-private-root-execution-audit.md
sed -n '<ranges>' worker-progress/worker-408-package-surface-private-root-output-audit.md
sed -n '<ranges>' worker-progress/worker-391-test-renderer-public-tojson-private-facade.md
sed -n '<ranges>' worker-progress/worker-392-test-renderer-public-totree-private-facade.md
sed -n '<ranges>' worker-progress/worker-393-test-renderer-update-unmount-js-private-routing.md
sed -n '<ranges>' worker-progress/worker-394-test-renderer-act-private-scheduler-consumption.md
sed -n '<ranges>' worker-progress/worker-395-react-dom-private-root-public-facade-adapter.md
sed -n '<ranges>' docs/tasks/worker-437-react-act-renderer-backed-private-drain.prompt.md
sed -n '<ranges>' docs/tasks/worker-438-react-dom-test-utils-act-flush-warning-refresh.prompt.md
sed -n '<ranges>' tests/smoke/package-surface-guard.mjs
sed -n '<ranges>' tests/smoke/import-entrypoints.mjs
sed -n '<ranges>' tests/smoke/package-surface-snapshot.json
sed -n '<ranges>' packages/react-dom/client.js
sed -n '<ranges>' packages/react-dom/src/client/root-bridge.js
sed -n '<ranges>' packages/react-test-renderer/index.js
sed -n '<ranges>' packages/react/private-act-dispatcher-gate.js
sed -n '<ranges>' packages/scheduler/cjs/scheduler-unstable_mock.development.js
rg --files worker-progress docs packages tests/smoke
rg -n '<private facade patterns>' packages tests/smoke worker-progress
node --check tests/smoke/package-surface-guard.mjs
node --check tests/smoke/import-entrypoints.mjs
node --input-type=module -e "<parse package-surface snapshot JSON>"
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
npm run check:js
git add -N worker-progress/worker-440-package-surface-private-facade-audit.md
git diff --check
get_goal
```

## Verification Results

- `node --check tests/smoke/package-surface-guard.mjs`: passed.
- `node --check tests/smoke/import-entrypoints.mjs`: passed.
- package-surface snapshot JSON parse check: passed.
- `npm run check:package-surface`: passed.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `npm run check:js`: passed, including package surface, import smoke,
  benchmark gates, workspace package checks, native loader checks, and 610
  conformance tests.
- `git diff --check`: passed with this report included via intent-to-add.

npm printed the existing `minimum-release-age` config warning during npm
commands; it did not affect results.

## Risks Or Blockers

- No blocker remains for this worker objective.
- The new descriptor checks are intentionally strict for accepted private
  runtime facades. Future accepted private markers on public objects/functions
  need same-change snapshot updates and rationale.
- Worker 437 and 438 implementation reports were not present, so this audit
  covers the currently accepted checkout plus their task prompts, not completed
  future changes.

## Recommended Next Tasks

1. Re-run this audit after workers 437 and 438 land if they add public-object
   private markers for React act or React DOM test-utils act.
2. Keep private runtime diagnostics either behind non-enumerable symbols/string
   properties with explicit snapshot coverage or in package-private files that
   remain blocked as public subpaths.

## Delegated Checks

- Spawned read-only explorer `private_facade_surface_audit` to look for missed
  private facade markers. It did not return before direct inspection,
  implementation, and verification completed, so it was closed and did not
  affect conclusions.
