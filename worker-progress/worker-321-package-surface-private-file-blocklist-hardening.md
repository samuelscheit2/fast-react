# Worker 321 - Package Surface Private File Blocklist Hardening

## Goal Evidence

- `create_goal` succeeded as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status: `active`.
- Active goal objective:
  `Harden package-surface guards for new private gate/source files so private diagnostics, bridge, metadata, dispatcher, and gate modules remain direct-file-only test fixtures and are not exported through package maps or public runtime keys.`

## Summary

Hardened the package-surface smoke checks around private direct-file fixtures.
The guard now rejects private-looking export-map subpaths, exact private
direct-file targets, and private runtime keys with `source` naming included in
the deny pattern. It also now covers the `@fast-react/native` binding package
map and runtime key set.

The import-entrypoint smoke now proves accepted React, React DOM, test-renderer,
scheduler, and native private fixtures remain blocked as package subpaths from
a temporary `node_modules` install. No private file was added to a public
`exports` map, and the accepted runtime key snapshots were preserved.

No package `package.json` files needed changes.

## Changed Files

- `tests/smoke/package-surface-guard.mjs`
- `tests/smoke/import-entrypoints.mjs`
- `worker-progress/worker-321-package-surface-private-file-blocklist-hardening.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`; did not
  read `ORCHESTRATOR.md`.
- Inspected workers 165, 258, and 290 to preserve the existing strict
  package-surface snapshot, no-exports react-test-renderer handling, and
  private diagnostics guard pattern.
- Inspected worker reports and current files for workers 277-292, plus sibling
  worktree status for 293-320. The current accepted package-private JS surface
  includes React act/hook dispatcher gates, React DOM `src/**` private helpers,
  embedded react-test-renderer route diagnostics, scheduler no-exports
  constraints, and the native binding loader package map.
- Confirmed current `packages/react/package.json`,
  `packages/react-dom/package.json`, `packages/react-test-renderer/package.json`,
  and `bindings/node/package.json` keep private files out of public exports.

## Commands Run

```sh
create_goal
get_goal
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,620p' MASTER_PROGRESS.md
rg -n "Worker (165|258|290|27[7-9]|28[0-9]|29[0-9]|3[0-1][0-9]|320)|private|package surface|package-surface" MASTER_PROGRESS.md worker-progress -g '*.md'
sed -n '<ranges>' tests/smoke/package-surface-guard.mjs
sed -n '<ranges>' tests/smoke/import-entrypoints.mjs
sed -n '<ranges>' packages/react/package.json packages/react-dom/package.json packages/react-test-renderer/package.json bindings/node/package.json
rg --files packages/react packages/react-dom packages/react-test-renderer packages/scheduler bindings/node
rg -n "private|diagnostic|diagnostics|gate|bridge|dispatcher|metadata|route|routes|source|secret" packages/react packages/react-dom packages/react-test-renderer packages/scheduler bindings/node tests/smoke -g '*.js' -g '*.mjs' -g '*.cjs' -g '*.json'
git worktree list --porcelain
git worktree list --porcelain | awk '/^worktree / && $2 ~ /fast-react-worker-(29[3-9]|3[01][0-9]|320)-/ {print $2}' | while read dir; do git -C "$dir" status --short --untracked-files=all | sed "s#^#${dir##*/} #"; done
node --check tests/smoke/package-surface-guard.mjs
node --check tests/smoke/import-entrypoints.mjs
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
npm run check:js
git add -N worker-progress/worker-321-package-surface-private-file-blocklist-hardening.md && git diff --check; rc=$?; git reset -q -- worker-progress/worker-321-package-surface-private-file-blocklist-hardening.md; exit $rc
```

## Verification Results

- `node --check tests/smoke/package-surface-guard.mjs`: passed.
- `node --check tests/smoke/import-entrypoints.mjs`: passed.
- `npm run check:package-surface`: passed with `package surface snapshot guard passed`.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `npm run check:js`: passed, including package-surface, import smoke,
  benchmark gates, workspace package checks, native loader checks, and 559
  conformance tests.
- `git diff --check`: passed with this new report included via
  intent-to-add.

npm printed the existing `minimum-release-age` config warning during npm
commands; it did not affect results.

## Risks Or Blockers

- The deny patterns are intentionally conservative for private diagnostic
  naming, including `source`. A future intentional public package subpath with
  those words will need a same-change guard update and rationale.
- `@fast-react/react-test-renderer` still intentionally has no `exports` map,
  so adding physical private JS files under that package remains a public
  subpath risk and should stay package-surface-owned.

## Recommended Next Tasks

1. Keep new private package files either outside no-exports packages or covered
   by an explicit package-surface decision in the same change.
2. If workers 304-320 add new JS private bridge/gate files, update the exact
   direct-file blocklists while preserving public runtime key snapshots.

## Delegated Checks

No nested agents were spawned.
