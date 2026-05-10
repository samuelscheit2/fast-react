# Worker 165 - Package Surface Guard

## Goal Setup Evidence

- `create_goal` called before project reads for objective: "add a small package-surface guard that detects accidental public export/type changes while root render internals are still being built"
- `get_goal` confirmed status: `active`

## Summary

Added a focused package-surface guard for the current local public packages:
`@fast-react/react`, `@fast-react/react-dom`, and `scheduler`.

The guard fails closed on accidental public package-surface drift by comparing
the current package directories, selected public `package.json` fields,
resolver-facing files, declaration files, runtime export keys, and placeholder
metadata against a checked-in snapshot. React and React DOM are guarded through
their `exports` maps plus `main`; scheduler is guarded through physical
resolver files because its lack of an `exports` map is itself public surface.

No new React DOM or test-renderer APIs were implemented. Rust code was not
touched. No nested agents were spawned.

## Changed Files

- `package.json`
- `tests/smoke/package-surface-guard.mjs`
- `tests/smoke/package-surface-snapshot.json`
- `worker-progress/worker-165-package-surface-guard.md`

## Evidence Gathered

Required context read:

- `WORKER_BRIEF.md`
- `worker-progress/worker-145-package-surface-refresh.md`
- `worker-progress/worker-035-package-surface-scaffolds.md`
- Root `package.json`
- `packages/react/package.json`
- `packages/react-dom/package.json`
- `packages/scheduler/package.json`
- `tests/smoke/import-entrypoints.mjs`

Additional local evidence:

- Existing package directories are exactly `react`, `react-dom`, and
  `scheduler`.
- React and React DOM public resolver files are the files reachable through
  their `exports` map targets plus `main`.
- Scheduler has no `exports` map, so every package `.js`/`.json` resolver file
  remains guarded as public physical surface.
- No `.d.ts`, `.d.mts`, or `.d.cts` declaration files exist under the guarded
  packages.
- React and React DOM runtime entrypoints still expose non-enumerable
  placeholder metadata with `compatibilityTarget` values for the pinned
  package targets.

## Implementation Notes

- Added `tests/smoke/package-surface-snapshot.json` as the intentional update
  point for future accepted public API changes.
- Added `tests/smoke/package-surface-guard.mjs` to compare live package
  metadata and entrypoint modules to that snapshot.
- Added root `check:package-surface` and wired it into `check:js` and
  `test:smoke`.
- The guard checks React DOM react-server throwing files and scheduler
  post-task plain-Node load failures as part of the current public surface.

## Commands Run

```sh
create_goal
get_goal
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,240p' worker-progress/worker-145-package-surface-refresh.md
sed -n '1,240p' worker-progress/worker-035-package-surface-scaffolds.md
sed -n '1,220p' package.json
sed -n '1,220p' packages/react/package.json
sed -n '1,220p' packages/react-dom/package.json
sed -n '1,220p' packages/scheduler/package.json
sed -n '1,260p' tests/smoke/import-entrypoints.mjs
sed -n '261,620p' tests/smoke/import-entrypoints.mjs
sed -n '621,980p' tests/smoke/import-entrypoints.mjs
sed -n '981,1340p' tests/smoke/import-entrypoints.mjs
rg --files tests packages/react packages/react-dom packages/scheduler
npm pkg get scripts
find packages -maxdepth 1 -mindepth 1 -type d -print
find packages/react -maxdepth 2 -type f -print
find packages/react-dom -maxdepth 2 -type f -print
find packages/scheduler -maxdepth 2 -type f -print
find packages -name '*.d.ts' -o -name '*.d.mts' -o -name '*.d.cts'
rg "const entrypoint|definePlaceholderMetadata" packages/react packages/react-dom -n
rg "definePlaceholderMetadata|__FAST_REACT_PLACEHOLDER__|compatibilityTarget" packages/scheduler -n
npm run check:package-surface
npm run check:js
git add -N tests/smoke/package-surface-guard.mjs tests/smoke/package-surface-snapshot.json worker-progress/worker-165-package-surface-guard.md
git diff --check
git reset -q -- tests/smoke/package-surface-guard.mjs tests/smoke/package-surface-snapshot.json worker-progress/worker-165-package-surface-guard.md
git status --short --untracked-files=all
```

## Verification Results

- `npm run check:package-surface` passed.
- `npm run check:js` passed, including the new package-surface guard, existing
  smoke import test, workspace checks, and 415 conformance tests.
- `git diff --check` passed after marking new files intent-to-add so the
  untracked guard files were included in the whitespace check.
- npm printed the existing `minimum-release-age` config warning during npm
  commands; it did not affect results.

## Risks Or Blockers

- The new snapshot is intentionally strict. Future accepted package/API changes
  need to update `tests/smoke/package-surface-snapshot.json` in the same change.
- The guard protects package metadata, public resolver files, declaration-file
  presence, export keys, and placeholder metadata. It does not replace the
  behavior-focused import smoke or conformance oracles.

## Recommended Next Tasks

1. Keep this guard green while root render internals are built.
2. When the orchestrator intentionally accepts a new public package API, update
   the snapshot and document the accepted surface in the worker report.
