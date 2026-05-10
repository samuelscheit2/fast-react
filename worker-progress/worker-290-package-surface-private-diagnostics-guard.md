# Worker 290 - Package Surface Private Diagnostics Guard

## Goal Evidence

- `create_goal` succeeded before research, file reads, implementation, or
  verification.
- `get_goal` was available after setup and returned status `active`.
- Active goal objective:
  `Tighten the package-surface guard so newly accepted private diagnostics for test-renderer, React DOM root bridge, scheduler mock, and React hook/act gates cannot leak as public package exports or physical public subpaths.`

## Summary

Tightened package-surface smoke coverage so private diagnostic/gate metadata
cannot become public package surface by accident.

The package-surface guard now rejects private-diagnostic-looking runtime export
names, including non-enumerable own properties, while still allowing the
accepted non-enumerable Fast React placeholder metadata. It also rejects
private diagnostic files if they become public resolver targets.

The entrypoint smoke now explicitly proves these private paths stay unreachable:
React hook/act dispatcher subpaths, React DOM root-bridge subpaths,
react-test-renderer private route/gate subpaths, and scheduler mock helper
subpaths. No package `package.json` files were changed because the guard did
not reveal an accepted public surface mismatch.

No nested agents were spawned.

## Changed Files

- `tests/smoke/package-surface-guard.mjs`
- `tests/smoke/import-entrypoints.mjs`
- `worker-progress/worker-290-package-surface-private-diagnostics-guard.md`

## Evidence Gathered

- Read required worker docs: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`. Did not read `ORCHESTRATOR.md`.
- Inspected accepted context reports for workers 165, 202, 231, 254, and 258.
  These established the strict package-surface snapshot pattern, the
  no-exports physical-subpath risk for `react-test-renderer`, and the existing
  React DOM/test-utils package-shape checks.
- Checked sibling worktrees for workers 266 and 277-280. Workers 277-280 had
  no local diffs or final reports; their Codex logs only supplied objective
  context. Worker 266 had in-progress diffs adding `updatePrivateRoute`,
  `unmountPrivateRoute`, and `privateRoutes` diagnostics to
  `react-test-renderer` thrown errors without changing public keys.
- Inspected current package files for React hook dispatcher internals, React
  DOM `src/client/root-bridge.js`, react-test-renderer route metadata, and
  scheduler mock physical files.

## Commands Run

```sh
create_goal
get_goal
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
rg -n "Worker (165|202|231|254|258|266|277|278|279|280)\\b" MASTER_PROGRESS.md MASTER_PLAN.md worker-progress -g '*.md'
sed -n '<ranges>' worker-progress/worker-165-package-surface-guard.md worker-progress/worker-202-react-test-renderer-package-placeholder.md worker-progress/worker-231-package-surface-react-dom-subpath-tightening.md worker-progress/worker-254-react-dom-test-utils-act-package-surface.md worker-progress/worker-258-react-test-renderer-package-surface-tightening.md
git worktree list --porcelain
find /Users/user/Developer/Developer -maxdepth 2 -type f \( -name 'worker-266*.md' -o -name 'worker-277*.md' -o -name 'worker-278*.md' -o -name 'worker-279*.md' -o -name 'worker-280*.md' \)
git -C /Users/user/Developer/Developer/fast-react-worker-266-test-renderer-js-update-unmount-routing-gate status --short --untracked-files=all
git -C /Users/user/Developer/Developer/fast-react-worker-266-test-renderer-js-update-unmount-routing-gate diff -- packages/react-test-renderer/index.js packages/react-test-renderer/cjs/react-test-renderer.development.js packages/react-test-renderer/cjs/react-test-renderer.production.js
git -C /Users/user/Developer/Developer/fast-react-worker-277-react-act-queue-private-dispatcher-gate status --short --untracked-files=all
git -C /Users/user/Developer/Developer/fast-react-worker-278-react-state-hook-private-dispatcher-lane-gate status --short --untracked-files=all
git -C /Users/user/Developer/Developer/fast-react-worker-279-react-effect-hook-passive-metadata-gate status --short --untracked-files=all
git -C /Users/user/Developer/Developer/fast-react-worker-280-scheduler-mock-flush-helper-gate status --short --untracked-files=all
sed -n '<ranges>' tests/smoke/package-surface-guard.mjs tests/smoke/import-entrypoints.mjs tests/smoke/package-surface-snapshot.json
sed -n '<ranges>' packages/react/hook-dispatcher.js packages/react-dom/src/client/root-bridge.js packages/react-test-renderer/cjs/react-test-renderer.development.js packages/scheduler/cjs/scheduler-unstable_mock.development.js
node --check tests/smoke/package-surface-guard.mjs tests/smoke/import-entrypoints.mjs
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
npm run check:js
```

Final verification:

```sh
git diff --check
```

## Verification Results

- `node --check tests/smoke/package-surface-guard.mjs tests/smoke/import-entrypoints.mjs`: passed.
- `npm run check:package-surface`: passed; package surface snapshot guard passed.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `npm run check:js`: passed, including package-surface, import smoke,
  benchmark checks, workspace checks, native loader checks, and 539
  conformance tests.
- `git diff --check`: passed after this report was added.

npm printed the existing `minimum-release-age` config warning during npm
commands; it did not affect results.

## Risks Or Blockers

- The runtime export deny pattern is intentionally conservative for names such
  as `private`, `diagnostic`, `gate`, `bridge`, `dispatcher`, `metadata`, and
  `route`. A future intentional public API with one of those words will need a
  deliberate guard update and a public-surface rationale.
- Worker 280's objective mentions `packages/scheduler/src/unstable_mock.js`;
  with scheduler's current no-exports package shape, adding that file would be
  a public physical subpath and should remain blocked unless the package
  surface is intentionally changed.

## Recommended Next Tasks

1. When workers 266 and 277-280 are merged or replayed, keep these smoke checks
   green by ensuring diagnostics stay on private errors/records, not package
   exports or new physical subpaths.
2. If an accepted implementation requires new package files under no-exports
   packages, decide whether to add an `exports` map or document the public
   subpath as intentional in the same change.
