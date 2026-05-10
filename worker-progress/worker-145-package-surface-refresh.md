# Worker 145 Package Surface Refresh

## Goal Setup Evidence

- `create_goal` called for objective: "Produce a report-only refresh of React, React DOM, scheduler, and future test-renderer package export/type surfaces affected by root render milestone work."
- `get_goal` confirmed status: `active`
- Goal thread: `019e0f9f-4f41-7871-8cbf-4f57af642ff3`
- Goal createdAt / updatedAt: `1778378585` / `1778378585`

## Summary

This is a report-only refresh. No source, package manifests, tests, prompts,
master docs, or lockfiles were edited.

The current React and React DOM export maps are already close to the pinned
runtime package maps. The risk is not missing root-render entrypoints; it is
claiming behavior or declaration parity too early. `react-dom/client`,
`react-dom/profiling`, `react-dom/test-utils`, and a future
`react-test-renderer` facade all depend on shared FiberRoot, HostRoot queue,
root scheduler, work-loop, commit, host mutation, sync flush, act, and
serialization internals that are not all present yet.

Scheduler is different: the local `scheduler` package has the real package name
and no `exports` map, matching `scheduler@0.27.0`. That no-exports shape is a
public surface. Future workers must not add an `exports` map or helper files
under `packages/scheduler` unless they intentionally accept new public deep
imports or blocked paths.

Type compatibility remains a separate product. No `packages/**` declaration
files exist locally. React and React DOM should continue to rely on a clear
policy around `@types/react@19.2.14` and `@types/react-dom@19.2.3`, or a later
Fast React-owned declaration package, before any TypeScript parity claim. A
future test-renderer package also needs its own type inventory; the current
published `@types/react-test-renderer` line tops out at `19.1.0`, not `19.2.x`.

## Changed Files

- `worker-progress/worker-145-package-surface-refresh.md`

Observed but excluded from the scoped path audit:

- `.worker-logs/worker-145-package-surface-refresh.log` as an untracked worker
  session artifact.

## Evidence Gathered

Required context read after goal setup:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json`
- `tests/conformance/oracles/react-19.2.6-react-dom-export-oracle.json`
- `tests/conformance/oracles/react-19.2.6-react-dom-type-inventory.json`
- `tests/conformance/oracles/react-19.2.6-react-test-renderer-export-oracle.json`
- `packages/react/package.json`
- `packages/react-dom/package.json`
- `packages/scheduler/package.json`
- `tests/conformance/inventory/**`

Relevant worker reports read:

- Runtime/package inventory and surface scaffolds: workers 017, 034, 035.
- React DOM export/type/root evidence: workers 036, 037, 054, 121.
- Scheduler root/variant/mock/native/post-task evidence: workers 038, 039,
  045, 052, 120, 125, 126, 127, 128.
- Root render and test-renderer sequencing evidence: workers 073, 083, 084,
  085, 086, 087, 101, 102, 114, 117.

Local package evidence:

- `packages/react` is scoped as `@fast-react/react`, version `0.0.0`, CommonJS,
  and has exports for `.`, `./jsx-runtime`, `./jsx-dev-runtime`,
  `./compiler-runtime`, and `./package.json`.
- `packages/react-dom` is scoped as `@fast-react/react-dom`, version `0.0.0`,
  CommonJS, and its `exports` map matches the pinned `react-dom@19.2.6`
  runtime export map.
- `packages/scheduler` is named `scheduler`, version `0.27.0`, and intentionally
  has no `main`, no `exports`, and no `type`, matching the upstream resolver
  shape.
- `find packages -name '*.d.ts'` returned no declaration files.
- There is no `packages/react-test-renderer` package directory.

## Export And Type Gaps

React:

- No root-render package entrypoint gap was found for `@fast-react/react`.
  Runtime subpaths match the target set: `.`, JSX runtime, JSX dev runtime,
  compiler runtime, and package metadata.
- Root-render-adjacent exports such as `act`, `startTransition`, hooks, `use`,
  cache APIs, and effect hooks remain behavior placeholders or unimplemented
  and must not be treated as working merely because they are enumerable.
- The local package does not ship declarations. If it is aliased as `react`,
  TypeScript compatibility must come from `@types/react@19.2.14` or a later
  explicitly checked Fast React declaration surface.

React DOM:

- Runtime entrypoint coverage is present for root, client, server variants,
  static variants, profiling, test-utils, package metadata, and `react-server`
  branches.
- Root milestone sensitive exports are:
  - `react-dom/client`: `createRoot`, `hydrateRoot`, `version`.
  - `react-dom`: `flushSync`, `unstable_batchedUpdates`, and later
    `createPortal`.
  - `react-dom/profiling`: root-like `createRoot`, `hydrateRoot`, `flushSync`,
    and the same resource/form keys as root.
  - `react-dom/test-utils`: `act`, which should route through shared React/reconciler
    act behavior, not a DOM-only helper.
- Type inventory gaps from `@types/react-dom@19.2.3` remain explicit:
  - Runtime-only subpath: `./profiling`.
  - Declaration-only subpaths: `./canary`, `./experimental`.
  - Runtime exports missing declarations include root private internals,
    `./client` `version`, several server/static variant `version` keys,
    `server.browser`/`server.bun` `resume`, `static.browser`
    `resumeAndPrerender`, and every `./profiling` runtime key.
  - `react-server` condition types are not condition-specific: default
    declarations describe subpaths that throw under `react-server`, and root
    `react-server` exposes a narrower value surface than default.
- Therefore React DOM runtime work must not imply TypeScript declaration
  parity. Declaration policy should be settled after runtime behavior is
  actually implemented and compared.

Scheduler:

- The public root, mock, post-task, and native entrypoints now have separate
  oracle/implementation evidence in prior workers, but broad package metadata
  compatibility is still not claimed.
- The highest entrypoint risk is the lack of an `exports` map. Physical files
  such as `index.js`, `index.native.js`, `unstable_mock.js`,
  `unstable_post_task.js`, and shipped `cjs/*` files are public deep imports.
- Adding helper files under `packages/scheduler`, adding an `exports` map, or
  hiding physical subpaths would change observable package behavior.
- The local scheduler manifest still has workspace-specific metadata such as
  `engines: { "node": ">=26.0.0" }` and a minimal package description. This is
  not a root-render blocker, but it is a package metadata compatibility gap if
  the project later claims drop-in `scheduler@0.27.0` package parity.

Future `react-test-renderer`:

- No local JS package facade exists, which is the correct current state for the
  root milestone.
- The pinned runtime package has no `exports` map. Future package scaffolding
  must preserve legacy physical subpaths if it claims package-surface parity:
  `.`, `./index.js`, `./shallow`, `./shallow.js`, both shipped CJS files, and
  `./package.json`.
- Runtime export keys for the root/index/CJS entrypoints are `_Scheduler`,
  `act`, `create`, `unstable_batchedUpdates`, and `version`; production keeps
  the key shape but `act` is observed as `undefined`.
- `react-test-renderer/shallow` and `./shallow.js` load but throw the removed
  shallow-renderer error on use.
- `react-server` condition loading fails for the renderer root/index/CJS
  through the React peer. Do not replace this with a clean unsupported Fast
  React error if the goal is parity.
- Published types are not aligned to the runtime surface. As of the npm check
  run for this report, `@types/react-test-renderer` latest and latest 19.x are
  `19.1.0`; it declares `create`, `act`, and public test renderer interfaces,
  but not runtime keys such as `_Scheduler`, `unstable_batchedUpdates`, or
  `version`.

## Package Entrypoint Risks

- React and React DOM are scoped local packages (`@fast-react/react` and
  `@fast-react/react-dom`) with version `0.0.0`; upstream packages are
  `react` and `react-dom` at `19.2.6`. This is fine for the private workspace,
  but it is not a drop-in package identity claim.
- React DOM's peer dependency is `@fast-react/react: 0.0.0`, not
  `react: ^19.2.6`. Keep that explicit until publish/alias policy is assigned.
- React DOM root and profiling versions currently use the implemented React DOM
  target value, while many functions still throw. That is acceptable for export
  shape smoke tests, but behavior reports must keep compatibility false until
  the root-render oracle matches.
- React DOM physical `.js` and CJS subpaths remain blocked by its `exports`
  map. Missing local physical `server.js` and `static.js` files are not a
  runtime entrypoint gap because those paths are blocked by upstream package
  exports too.
- Scheduler must remain no-exports. This is the opposite of React DOM: physical
  deep importability is part of the public surface.
- Future test-renderer should also remain no-exports if added for package
  parity. A neat export map would be an observable breaking change from
  `react-test-renderer@19.2.6`.

## Safe Source-Worker Order

Recommended order to avoid claiming root or test-renderer surfaces before
internals exist:

1. Finish the HostRoot render-phase foundation after worker 128's accepted root
   scheduler foundation. This should consume HostRoot update queues and produce
   work, but still avoid package facade behavior claims.
2. Add the minimal work-loop, complete-work, and commit slice for HostRoot,
   host components, and host text. The gate is `root.current` switching only
   through commit, with host mutation operation logs proving ordering.
3. Add guarded sync flush and act routing in the reconciler scheduler. This is
   the prerequisite for `react-dom.flushSync`, `react-dom/test-utils.act`, and
   test-renderer `act`.
4. Use the Rust test renderer as the first canary host, but only as a host
   adapter over shared reconciler roots. Do not implement `create/update/unmount`
   by mutating test-renderer storage directly.
5. Add DOM mutation/text host behavior after the generic commit path is green.
   Container markers and listener shells can be consumed here, but events,
   hydration, forms, resources, portals, and server/static rendering stay out of
   the first root milestone.
6. Wire `@fast-react/react-dom/client.createRoot().render/unmount` and
   `react-dom.flushSync` only after steps 1-5 pass the root render/update/unmount
   oracle. Keep `hydrateRoot`, portals, server/static, resources/forms, and
   event plugin behavior as explicit unsupported surfaces.
7. Add a future `react-test-renderer` package facade only after shared
   test-renderer root lifecycle, serialization, `TestInstance`, `act`, and
   error-surface behavior can consume the existing oracles. The package scaffold
   should not land first as a broad compatibility signal.
8. Add TypeScript declaration inventory/policy last for any newly claimed JS
   package surface. Runtime parity and declaration parity should have separate
   checks and separate compatibility claims.

## Commands Run

```sh
create_goal
get_goal
sed -n '1,260p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,320p' MASTER_PROGRESS.md
sed -n '1,240p' packages/react/package.json
sed -n '1,260p' packages/react-dom/package.json
sed -n '1,240p' packages/scheduler/package.json
rg --files tests/conformance/inventory worker-progress | rg '(inventory|oracle|package-surface|type|react-dom|scheduler|test-renderer|runtime)'
jq 'keys' tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json
jq 'keys' tests/conformance/oracles/react-19.2.6-react-dom-export-oracle.json
jq 'keys' tests/conformance/oracles/react-19.2.6-react-dom-type-inventory.json
jq 'keys' tests/conformance/oracles/react-19.2.6-react-test-renderer-export-oracle.json
find packages/react packages/react-dom packages/scheduler -maxdepth 2 -type f | sort
jq '.packages' tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json
jq '.gaps' tests/conformance/oracles/react-19.2.6-react-dom-type-inventory.json
jq '.packageSurface, .coverage, .intentionalGaps, .unsupportedFastReactEvidence' tests/conformance/oracles/react-19.2.6-react-test-renderer-export-oracle.json
sed -n '1,260p' worker-progress/worker-017-runtime-inventory-generation.md
sed -n '1,260p' worker-progress/worker-034-scheduler-package-inventory.md
sed -n '1,260p' worker-progress/worker-035-package-surface-scaffolds.md
sed -n '1,320p' worker-progress/worker-036-react-dom-export-oracle.md
sed -n '1,320p' worker-progress/worker-037-react-dom-type-inventory.md
sed -n '1,320p' worker-progress/worker-083-react-test-renderer-export-oracle.md
sed -n '1,260p' worker-progress/worker-038-scheduler-root-oracle.md
sed -n '1,320p' worker-progress/worker-039-scheduler-variant-oracles.md
sed -n '1,260p' worker-progress/worker-052-scheduler-mock-oracle.md
sed -n '1,260p' worker-progress/worker-120-scheduler-mock-source-implementation.md
sed -n '1,260p' worker-progress/worker-125-scheduler-post-task-implementation.md
sed -n '1,260p' worker-progress/worker-126-scheduler-native-entry-implementation.md
sed -n '1,260p' worker-progress/worker-127-scheduler-native-smoke-integration.md
sed -n '1,260p' worker-progress/worker-045-scheduler-root-implementation.md
sed -n '1,260p' worker-progress/worker-128-reconciler-root-scheduler-foundation.md
sed -n '1,240p' worker-progress/worker-121-root-render-e2e-oracle.md
sed -n '1,320p' worker-progress/worker-117-root-render-implementation-sequencing-plan.md
sed -n '1,300p' worker-progress/worker-101-test-renderer-root-api-plan.md
sed -n '1,300p' worker-progress/worker-102-test-renderer-serialization-plan.md
sed -n '1,300p' worker-progress/worker-114-test-renderer-implementation-plan.md
sed -n '1,260p' worker-progress/worker-073-test-renderer-update-model-plan.md
sed -n '1,260p' worker-progress/worker-084-react-test-renderer-root-lifecycle-oracle.md
sed -n '1,260p' worker-progress/worker-085-react-test-renderer-serialization-oracle.md
sed -n '1,260p' worker-progress/worker-086-react-test-renderer-act-oracle.md
sed -n '1,260p' worker-progress/worker-087-react-test-renderer-error-surface-oracle.md
find packages -maxdepth 2 -type d | sort
find packages -name '*.d.ts' -o -name '*.d.mts' -o -name '*.d.cts'
npm view @types/react-test-renderer version dist.tarball dist.integrity peerDependencies dependencies types typings exports --json
npm view @types/react-test-renderer@19 version dist.tarball dist.integrity dependencies peerDependencies types typings exports --json
curl -fsSL https://registry.npmjs.org/@types/react-test-renderer/-/react-test-renderer-19.1.0.tgz | tar -xOzf - react-test-renderer/index.d.ts react-test-renderer/package.json
node - <<'NODE'
// Compared local React, React DOM, and scheduler package manifests to the
// checked runtime inventory package manifests.
NODE
node - <<'NODE'
// Printed local Object.keys() for React, React DOM, and scheduler entrypoints.
NODE
git status --short --untracked-files=all
git add -N worker-progress/worker-145-package-surface-refresh.md && git diff --check; rc=$?; git reset -q -- worker-progress/worker-145-package-surface-refresh.md; exit $rc
allowed='worker-progress/worker-145-package-surface-refresh.md'
files=$( { git diff --name-only; git ls-files --others --exclude-standard; } | grep -v '^\.worker-logs/' | sed '/^$/d' | sort -u )
printf '%s\n' "$files"
test "$files" = "$allowed"
```

No nested agents were used by this worker.

## Verification Results

- `git diff --check` passed after temporarily marking the report with
  `git add -N` and resetting the intent-to-add entry.
- Scoped changed-path check passed with exactly
  `worker-progress/worker-145-package-surface-refresh.md` after excluding the
  untracked `.worker-logs/` session artifact.
- `git status --short --untracked-files=all` shows only:
  - `.worker-logs/worker-145-package-surface-refresh.log`
  - `worker-progress/worker-145-package-surface-refresh.md`

## Risks Or Blockers

- Root render compatibility is still blocked on shared internals, not package
  file presence. Updating facades first would create a false compatibility
  signal.
- React DOM type/runtime gaps are known and should stay documented instead of
  being papered over by incomplete declarations.
- Scheduler package metadata cleanup is separate from root-render work. The
  no-exports shape must be protected.
- Future test-renderer package work has two blockers: no local JS facade and no
  local type inventory for `@types/react-test-renderer`.
- npm commands printed the existing local `minimum-release-age` config warning;
  it did not affect the registry reads.

## Recommended Next Tasks

1. Keep package files unchanged while the next source worker finishes the
   HostRoot render and minimal commit path.
2. Add a React DOM root facade implementation only after a dual-run
   root-render/update/unmount comparison can replace unsupported-placeholder
   rows.
3. Add a small package-surface guard that explicitly rejects accidental
   `exports` additions to `scheduler`.
4. Add a `react-test-renderer` type inventory before any JS facade scaffold,
   using `@types/react-test-renderer@19.1.0` as current published evidence
   unless the project chooses a different pinned type target.
5. Decide whether Fast React will reference DefinitelyTyped packages or ship
   first-party declarations for React DOM and future test-renderer surfaces.
