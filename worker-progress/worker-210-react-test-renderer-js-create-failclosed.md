# Worker 210: React Test Renderer JS Create Fail-Closed Surface

## Goal Evidence

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available after setup and again before this report.
- Active goal status: `active`.
- Active goal objective:
  `Tighten the @fast-react/react-test-renderer placeholder package so create, root update/unmount entrypoints, and related CJS surfaces fail loudly and deterministically against the accepted package shape, without wiring Rust test-renderer behavior, serialization, act, or React DOM.`

## Summary

- Tightened the `@fast-react/react-test-renderer` placeholder root/CJS modules
  so `create()` returns the accepted React Test Renderer root object key shape
  while every behaviorful root surface fails closed with structured
  `FastReactTestRendererUnimplementedError` errors.
- Added deterministic fail-closed coverage for `.root`, `toJSON`, `toTree`,
  `update`, `unmount`, `getInstance`, and `unstable_flushSync` on the placeholder
  renderer object.
- Preserved the public package export key set and no-exports physical file
  shape. The production CJS and production root package surface now keep
  `act` enumerable but `undefined`, matching the accepted React 19.2.6 oracle
  shape.
- Kept Rust test-renderer behavior, serialization, public `act`, React DOM, and
  compatibility claims unwired.

## Changed Files

- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/smoke/import-entrypoints.mjs`
- `worker-progress/worker-210-react-test-renderer-js-create-failclosed.md`

No package-surface snapshot change was needed because the public resolver files,
manifest fields, runtime export keys, and placeholder metadata stayed stable.

## Evidence Gathered

- Required context read after goal setup: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and worker reports 083, 084, 085,
  087, 178, and 202.
- The accepted root lifecycle oracle records renderer object keys:
  `_Scheduler`, `root`, `toJSON`, `toTree`, `update`, `unmount`,
  `getInstance`, and `unstable_flushSync`, with `root` as an enumerable
  configurable accessor.
- The accepted export oracle records the root module keys as `_Scheduler`,
  `act`, `create`, `unstable_batchedUpdates`, and `version`; production keeps
  the `act` key with value `undefined`.
- Local focused probe confirmed production root package behavior:
  `act` is `undefined`, `create(null)` returns the renderer key shape, and
  `.root` throws `FAST_REACT_UNIMPLEMENTED` with export name `create().root`.
- A nested explorer was spawned for read-only surface review, but it did not
  return usable findings before being closed, so it did not affect the
  implementation conclusions.

## Commands Run

```sh
create_goal
get_goal
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,560p' MASTER_PLAN.md
sed -n '1,560p' MASTER_PROGRESS.md
sed -n '<ranges>' worker-progress/worker-083-react-test-renderer-export-oracle.md
sed -n '<ranges>' worker-progress/worker-084-react-test-renderer-root-lifecycle-oracle.md
sed -n '<ranges>' worker-progress/worker-085-react-test-renderer-serialization-oracle.md
sed -n '<ranges>' worker-progress/worker-087-react-test-renderer-error-surface-oracle.md
sed -n '<ranges>' worker-progress/worker-178-test-renderer-serialization-gate.md
sed -n '<ranges>' worker-progress/worker-202-react-test-renderer-package-placeholder.md
rg --files packages/react-test-renderer tests
sed -n '<ranges>' packages/react-test-renderer/*.js packages/react-test-renderer/cjs/*.js
sed -n '<ranges>' tests/smoke/import-entrypoints.mjs tests/smoke/package-surface-guard.mjs tests/smoke/package-surface-snapshot.json
sed -n '<ranges>' tests/conformance/test/react-test-renderer-*.test.mjs tests/conformance/src/react-test-renderer-*.mjs
node --check packages/react-test-renderer/index.js
node --check packages/react-test-renderer/cjs/react-test-renderer.development.js
node --check packages/react-test-renderer/cjs/react-test-renderer.production.js
node --check packages/react-test-renderer/shallow.js
node --check tests/smoke/import-entrypoints.mjs
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
node --test tests/conformance/test/react-test-renderer-export-oracle.test.mjs tests/conformance/test/react-test-renderer-root-lifecycle-oracle.test.mjs tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs tests/conformance/test/react-test-renderer-act-oracle.test.mjs tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
npm run check:js
node --input-type=module -e '<production react-test-renderer placeholder probe>'
git diff --stat
git status --short
git diff --check
```

## Verification Results

- `node --check` passed for all touched JS files and unchanged
  `packages/react-test-renderer/shallow.js`.
- `npm run check:package-surface`: passed.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- Focused React Test Renderer oracle/gate run: passed, 58 tests.
- `npm run check:js`: passed, including package-surface guard, smoke imports,
  benchmark gate, workspace checks, native checks, and 480 conformance tests.
- `git diff --check`: passed, including the new report via intent-to-add.

npm printed the existing `minimum-release-age` config warning during npm
commands; it did not affect results.

## Risks Or Blockers

- `create()` now returns only a fail-closed renderer shell. It intentionally
  does not render, schedule, serialize, call `createNodeMock`, expose
  `TestInstance`, or route to Rust.
- The placeholder `_Scheduler` remains an opaque throwing proxy rather than the
  full mock Scheduler object; this preserves the worker 202 boundary and avoids
  claiming act/scheduler behavior.
- The implementation duplicates the small placeholder shell in the root and CJS
  files to avoid adding helper files that would become public physical subpaths
  in a no-exports-map package.

## Recommended Next Tasks

1. Keep serialization and `TestInstance` gates closed until committed
   test-renderer host output and fiber inspection APIs exist.
2. Add a real JS facade only when it can route `create`, `update`, `unmount`,
   and serialization through accepted Rust test-renderer/reconciler behavior.
3. Consider a later scheduler-specific slice if `_Scheduler` should expose
   shape-matched throwing mock Scheduler keys without enabling behavior.
