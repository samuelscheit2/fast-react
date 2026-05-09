# worker-035-package-surface-scaffolds

## Objective

Add loud-placeholder package scaffolds for the public React DOM 19.2.6 and
scheduler 0.27.0 package surfaces, limited to the shared package, smoke, root
lockfile, and worker progress scope.

Write scope honored:

- `packages/react-dom/**`
- `packages/scheduler/**`
- `tests/smoke/**`
- `package-lock.json`
- `worker-progress/worker-035-package-surface-scaffolds.md`

No `tests/conformance/**` files were modified.

## Summary

Implemented a package-surface-only scaffold for `@fast-react/react-dom` and the
public `scheduler` package. All behaviorful React DOM and scheduler exports are
present for import/require resolution, but they fail loudly with deterministic
Fast React placeholder errors when called.

The React DOM export map mirrors the checked `react-dom@19.2.6` npm exports map,
including `react-server` condition branches. React-server-only unsupported
modules throw at module evaluation with the React Server Components unsupported
message plus Fast React metadata.

The scheduler scaffold keeps the published `scheduler@0.27.0` no-exports
package shape: root, `unstable_mock`, `unstable_post_task`, `index.native.js`,
`package.json`, and the shipped `cjs/*` physical deep imports are present.
Priority constants and `unstable_Profiling = null` are exported as constants;
all scheduler operations and test helpers throw unsupported placeholder errors.

## Implementation Notes

- Added `@fast-react/react-dom` with exact public subpaths under the scoped Fast
  React package name:
  - `.`
  - `./client`
  - `./server`, `./server.node`, `./server.browser`, `./server.edge`,
    `./server.bun`
  - `./static`, `./static.node`, `./static.browser`, `./static.edge`
  - `./profiling`
  - `./test-utils`
  - `./package.json`
- React DOM default/root, client, server, static, profiling, and test-utils
  entrypoints expose the accepted runtime key sets from worker 033.
- React DOM physical `.js` subpaths remain blocked by the package `exports` map,
  matching the published package resolver behavior.
- Added the `scheduler` workspace package at version `0.27.0` so
  `@fast-react/react-dom` can depend on `scheduler: ^0.27.0` without pulling the
  real npm package into this private workspace.
- Kept scheduler without `main` or `exports`, matching worker 034's package
  metadata finding. Node CJS resolves through `index.js`, and physical deep
  imports remain open.
- Updated smoke coverage to verify direct file loads, package specifier
  resolution, React DOM condition routing, blocked React DOM extension subpaths,
  scheduler physical deep imports, placeholder metadata, and unsupported errors.
- Synced `package-lock.json` after adding the new workspaces.

Intentional placeholder divergences:

- React DOM `version` exports use `0.0.0-fast-react-dom-placeholder`, not
  `19.2.6`, to avoid claiming DOM compatibility before conformance-backed
  direct facades are assigned.
- `scheduler/unstable_post_task` loads as a placeholder in this scaffold even
  though the real package's plain Node import depends on browser-like globals.
  This keeps the package surface inspectable while leaving variant behavior to
  the scheduler variant oracle workers.
- The public `scheduler` package name is used for workspace resolution because
  React DOM depends on `scheduler`, while React DOM itself remains scoped as
  `@fast-react/react-dom` to match the existing Fast React package naming
  policy.

## Delegated Checks

No nested agents were spawned. The continuation instruction for this worker
explicitly said not to spawn nested agents, so hypothesis checks were performed
locally with targeted smoke and workspace verification.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Used accepted worker 033 React DOM inventory for the exact npm export map,
  runtime keys, react-server throwing branches, blocked physical subpaths, and
  behavior root-cause boundaries.
- Used accepted worker 034 scheduler inventory for the public scheduler
  package identity, no-exports resolver behavior, physical file list, root/mock
  exports, native entrypoint, post-task caveat, constants, and public/internal
  scheduler separation.
- Read the existing `@fast-react/react` package and smoke test style to preserve
  current React behavior and placeholder metadata conventions.

## Commands Run

Context and inventory reads:

```sh
pwd
git status --short
rg --files -g 'WORKER_BRIEF.md' -g 'MASTER_PLAN.md' -g 'MASTER_PROGRESS.md' -g 'worker-progress/**' -g 'package.json' -g 'packages/**' -g 'tests/smoke/**'
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,620p' worker-progress/worker-033-react-dom-inventory.md
sed -n '1,620p' worker-progress/worker-034-scheduler-package-inventory.md
sed -n '1,260p' packages/react/package.json
sed -n '1,260p' packages/react/placeholder-utils.js
sed -n '1,320p' packages/react/index.js
sed -n '1,180p' package-lock.json
node - <<'NODE'
const fs = require('node:fs');
const inv = JSON.parse(fs.readFileSync('tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json', 'utf8'));
console.log(JSON.stringify(inv.packages['react-dom'].packageJson.exports, null, 2));
NODE
```

Implementation and metadata sync:

```sh
mkdir -p packages/react-dom packages/scheduler/cjs
npm install --package-lock-only --ignore-scripts
```

Verification:

```sh
node tests/smoke/import-entrypoints.mjs
npm run check:js
git diff --check -- package-lock.json tests/smoke/import-entrypoints.mjs
if rg -n '[ \t]+$' packages/react-dom packages/scheduler tests/smoke/import-entrypoints.mjs package-lock.json; then exit 1; fi
if rg -n '^(<<<<<<<|=======|>>>>>>>)' packages/react-dom packages/scheduler tests/smoke/import-entrypoints.mjs package-lock.json; then exit 1; fi
npm ci --ignore-scripts --dry-run
git status --short
if rg -n '[ \t]+$' packages/react-dom packages/scheduler tests/smoke/import-entrypoints.mjs package-lock.json worker-progress/worker-035-package-surface-scaffolds.md; then exit 1; fi
if rg -n '^(<<<<<<<|=======|>>>>>>>)' packages/react-dom packages/scheduler tests/smoke/import-entrypoints.mjs package-lock.json worker-progress/worker-035-package-surface-scaffolds.md; then exit 1; fi
if rg -n '/private/[v]ar|/[v]ar/folders|/[Tt]mp/|fast-react-smoke-[A-Za-z0-9]+' worker-progress/worker-035-package-surface-scaffolds.md; then exit 1; fi
```

Results:

- Targeted smoke passed.
- `npm run check:js` passed, including the new `@fast-react/react-dom` and
  `scheduler` workspace checks plus the existing 81 conformance tests.
- Scoped whitespace/conflict-marker checks passed.
- `npm ci --ignore-scripts --dry-run` passed.
- npm printed the existing local `minimum-release-age` config warning during npm
  commands; it did not affect results.

## Changed Files

Root metadata:

- `package-lock.json`

Smoke tests:

- `tests/smoke/import-entrypoints.mjs`

React DOM scaffold:

- `packages/react-dom/package.json`
- `packages/react-dom/placeholder-utils.js`
- `packages/react-dom/index.js`
- `packages/react-dom/react-dom.react-server.js`
- `packages/react-dom/client.js`
- `packages/react-dom/client.react-server.js`
- `packages/react-dom/server.node.js`
- `packages/react-dom/server.browser.js`
- `packages/react-dom/server.edge.js`
- `packages/react-dom/server.bun.js`
- `packages/react-dom/server.react-server.js`
- `packages/react-dom/static.node.js`
- `packages/react-dom/static.browser.js`
- `packages/react-dom/static.edge.js`
- `packages/react-dom/static.react-server.js`
- `packages/react-dom/profiling.js`
- `packages/react-dom/profiling.react-server.js`
- `packages/react-dom/test-utils.js`

Scheduler scaffold:

- `packages/scheduler/package.json`
- `packages/scheduler/index.js`
- `packages/scheduler/index.native.js`
- `packages/scheduler/unstable_mock.js`
- `packages/scheduler/unstable_post_task.js`
- `packages/scheduler/cjs/scheduler.development.js`
- `packages/scheduler/cjs/scheduler.production.js`
- `packages/scheduler/cjs/scheduler.native.development.js`
- `packages/scheduler/cjs/scheduler.native.production.js`
- `packages/scheduler/cjs/scheduler-unstable_mock.development.js`
- `packages/scheduler/cjs/scheduler-unstable_mock.production.js`
- `packages/scheduler/cjs/scheduler-unstable_post_task.development.js`
- `packages/scheduler/cjs/scheduler-unstable_post_task.production.js`

Progress:

- `worker-progress/worker-035-package-surface-scaffolds.md`

## Quality, Maintainability, Performance, And Security Review

Quality:

- Public package keys and condition paths are explicit in smoke tests instead
  of inferred from implementation helper code.
- Unsupported behavior is deterministic and includes package target,
  entrypoint, export name, and error code metadata.
- Existing `@fast-react/react` behavior is preserved by keeping its tests in the
  same smoke flow and running the full JS workspace check.

Maintainability:

- React DOM uses a shared placeholder utility because its package `exports` map
  blocks private helper deep imports.
- Scheduler intentionally does not add helper files because it has no `exports`
  map; extra physical files would become new public deep imports.
- Production scheduler CJS files delegate to development placeholder files only
  because this slice does not implement production-specific runtime behavior.

Performance:

- No runtime scheduling, rendering, DOM mutation, hydration, or server/Fizz work
  was added. Placeholders throw immediately.
- Scheduler behavior work still needs the heap and host callback design from
  worker 034 before any performance-sensitive implementation should be claimed.

Security:

- No package lifecycle scripts were run.
- React DOM server/static APIs remain unsupported, avoiding unsafe partial HTML
  serialization, nonce, headers, resource, Suspense marker, or resume-state
  behavior.
- React DOM private internals are opaque throwing proxies rather than mutable
  placeholder objects that could invite accidental coupling.

## Risks Or Blockers

- React DOM rendering behavior remains blocked on reconciler roots, lanes,
  update queues, DOM host config, event priority, hydration, resources/forms,
  and server/Fizz work.
- `react-dom/profiling` is only a surface placeholder; it cannot be compatible
  before normal client roots are implemented.
- `react-dom/test-utils.act` still throws because `React.act` behavior and
  warning policy are not covered by this worker.
- Scheduler root/mock behavior remains unimplemented; future workers need
  conformance oracles before replacing placeholders with heap/timer behavior.
- Scheduler no-exports behavior means CJS `require('scheduler/unstable_mock')`
  resolves, but Node ESM import needs a physical `.js` subpath. Smoke now
  records this so future workers do not accidentally add an `exports` map.

## Recommended Next Tasks

- Worker 036: React DOM export, descriptor, condition, and blocked-subpath
  oracle.
- Worker 037: React DOM declaration/runtime type-gap inventory.
- Worker 038 and 039: scheduler root and variant oracles before runtime
  behavior implementation.
- Later React DOM workers should implement direct facades such as `version` and
  `unstable_batchedUpdates` only after dedicated oracles accept those slices.

## Completion Checklist

- [x] Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Called `create_goal` for this worker task.
- [x] Stayed within assigned write scope.
- [x] Did not modify `tests/conformance/**`.
- [x] Added React DOM 19.2.6 package-surface placeholders.
- [x] Added scheduler 0.27.0 package-surface placeholders.
- [x] Kept unsupported behavior loud and deterministic.
- [x] Synced package lock metadata.
- [x] Ran targeted smoke/package checks.
- [x] Ran `npm run check:js`.
- [x] Ran scoped whitespace/conflict checks.
- [x] Reviewed quality, maintainability, performance, and security.
