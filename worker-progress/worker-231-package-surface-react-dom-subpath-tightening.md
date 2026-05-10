# Worker 231 - Package Surface React DOM Subpath Tightening

## Goal Setup Evidence

- `create_goal` succeeded before research, file reads, implementation, or
  verification.
- `get_goal` returned status `active` with objective:
  `tighten package-surface smoke coverage for React DOM subpaths and placeholder boundaries introduced so far, ensuring unsupported server/static, profiling, test-utils, and client subpaths remain deterministic without implementing new runtime behavior`.

## Summary

Tightened the package-surface guard for React DOM without changing React DOM
runtime behavior.

The snapshot now records React DOM per-entrypoint version expectations,
unsupported placeholder exports, placeholder function names and arities, the
server.bun `resume: undefined` boundary, and exact React Server Components load
errors for client/server/static/profiling react-server files. The guard now
asserts those fields and verifies unsupported calls keep the deterministic
`FastReactDomUnimplementedError` metadata: code, entrypoint, export name,
compatibility target, and unsupported message.

No React DOM package files, Rust crates, conformance oracles, or master docs
were edited. No nested agents were spawned.

## Changed Files

- `tests/smoke/package-surface-guard.mjs`
- `tests/smoke/package-surface-snapshot.json`
- `worker-progress/worker-231-package-surface-react-dom-subpath-tightening.md`

## Commands Run

Context and evidence:

```sh
rg --files -g 'WORKER_BRIEF.md' -g 'MASTER_PLAN.md' -g 'MASTER_PROGRESS.md' -g 'worker-progress/worker-0{35,53,54,145,165,177,202}*.md' -g 'tests/smoke/package-surface-*' -g 'tests/smoke/import-entrypoints.mjs'
git status --short
sed -n '<ranges>' WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md
sed -n '<ranges>' worker-progress/worker-035-package-surface-scaffolds.md worker-progress/worker-053-react-dom-types-policy.md worker-progress/worker-054-react-dom-root-export-implementation.md worker-progress/worker-145-package-surface-refresh.md worker-progress/worker-165-package-surface-guard.md worker-progress/worker-177-react-dom-flush-sync-private-guard.md worker-progress/worker-202-react-test-renderer-package-placeholder.md
sed -n '<ranges>' tests/smoke/package-surface-guard.mjs tests/smoke/package-surface-snapshot.json tests/smoke/import-entrypoints.mjs
sed -n '<ranges>' packages/react-dom/package.json packages/react-dom/*.js
```

Verification:

```sh
node --check tests/smoke/package-surface-guard.mjs
node -e "JSON.parse(require('node:fs').readFileSync('tests/smoke/package-surface-snapshot.json','utf8')); console.log('snapshot json ok')"
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
npm run check:js
git diff --check
```

## Verification Results

- `node --check tests/smoke/package-surface-guard.mjs`: passed.
- JSON parse check for `tests/smoke/package-surface-snapshot.json`: passed.
- `npm run check:package-surface`: passed.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `npm run check:js`: passed, including package-surface, smoke imports,
  benchmark checks, workspace checks, native loader checks, and 480 conformance
  tests.
- `git diff --check`: passed after report creation.

## Evidence Gathered

- Worker 035 introduced the React DOM package scaffold and placeholder metadata
  conventions.
- Worker 053 kept React DOM declaration support deliberately deferred, so this
  change continues to guard declaration-file absence rather than adding types.
- Worker 054 made root/profiling `version` and selected function shapes
  oracle-backed while keeping many exports unsupported.
- Worker 145 highlighted the risk of claiming React DOM subpath behavior too
  early.
- Worker 165 established the package-surface guard and snapshot as the
  intentional drift detector.
- Worker 177 kept public `flushSync` placeholder-compatible.
- Worker 202 showed the current package-surface pattern for placeholder
  package additions and snapshot updates.
- Current React DOM client, server, static, profiling, test-utils, and
  react-server files already throw deterministic placeholder errors; this worker
  moved those boundaries into package-surface smoke coverage.

## Risks Or Blockers

- The snapshot is stricter. Future accepted React DOM behavior work must update
  the package-surface snapshot in the same change when a placeholder export
  becomes implemented or its function shape changes.
- Package-surface smoke coverage still does not replace behavior oracles for
  root rendering, Fizz/static output, hydration, resources, forms, or `act`.

## Recommended Next Tasks

1. Keep updating `tests/smoke/package-surface-snapshot.json` alongside any
   intentional React DOM public subpath behavior change.
2. Add behavior-specific conformance gates before removing any placeholder
   export from the unsupported list.
