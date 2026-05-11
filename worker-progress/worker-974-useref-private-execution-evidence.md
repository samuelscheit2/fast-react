# Worker 974: useRef Private Execution Evidence

## Summary

- Added package-private `useRef` execution evidence on top of Worker 956's
  private dispatcher/currentness gate.
- The new evidence is generated only by `packages/react/hook-dispatcher.js`,
  installs a source-owned marked ref dispatcher, calls the root `React.useRef`
  facade twice, and records mount/update call records plus same-object ref
  identity where the update initial value is ignored.
- The gate rejects cloned reports, cloned dispatcher metadata, generic
  dispatcher execution, stale currentness reports, same-shaped fake `useRef`,
  caller-supplied ref objects, row overrides, public compatibility claims, and
  root/renderer prerequisite smuggling.
- Public `React.useRef` compatibility, root rendering, Scheduler timing, `act`,
  renderer/package compatibility, callback execution, external-store behavior,
  and id generation all remain blocked.

## Changed Files

- `packages/react/hook-dispatcher.js`
- `tests/conformance/test/react-hook-dispatcher-oracle.test.mjs`
- `worker-progress/worker-974-useref-private-execution-evidence.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md` and Worker 956's accepted progress report.
- Inspected existing hook dispatcher gates and focused guard/oracle tests.
- Checked React reference clone at
  `/Users/user/Developer/Developer/react-reference`:
  - commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`
  - tag `v19.2.6`
  - `packages/react/src/ReactHooks.js` routes `useRef` to
    `dispatcher.useRef(initialValue)`
  - `packages/react-reconciler/src/ReactFiberHooks.js` `mountRef` creates a
    ref object, stores it in `hook.memoizedState`, and `updateRef` returns that
    memoized object
  - mount/update dispatchers map `useRef` to `mountRef`/`updateRef`
- Ran a temp npm-tarball React oracle with `react@19.2.6`,
  `react-test-renderer@19.2.6`, and `scheduler@0.27.0`. The successful probe
  reported:
  - `reactVersion: "19.2.6"`
  - `refCount: 2`
  - `sameRefOnUpdate: true`
  - `currentAfterMount: "mount"`
  - `currentAfterUpdate: "mount"`
  - `renderedTextAfterUpdate: "mount"`

## Commands Run

```sh
node --check packages/react/hook-dispatcher.js
node --check tests/conformance/test/react-hook-dispatcher-guard.test.mjs
node --check tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
npm run check --workspace @fast-react/react
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
git diff --check
```

Additional source/oracle commands:

```sh
git -C /Users/user/Developer/Developer/react-reference rev-parse HEAD
git -C /Users/user/Developer/Developer/react-reference describe --tags --exact-match HEAD
sed -n '76,88p' /Users/user/Developer/Developer/react-reference/packages/react/src/ReactHooks.js
sed -n '2598,2616p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberHooks.js
sed -n '3894,3942p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberHooks.js
npm --userconfig /dev/null install --prefix "$tmpdir" --ignore-scripts --no-audit --no-fund react@19.2.6 react-test-renderer@19.2.6 scheduler@0.27.0
```

Two earlier temp npm oracle attempts failed because the user npm config applied
`minimum-release-age`; the successful retry used `--userconfig /dev/null`.

## Verification Results

- Hook dispatcher guard suite: passed, 32 tests.
- Hook dispatcher oracle suite: passed, 18 tests.
- Combined hook dispatcher suite: passed, 50 tests.
- React workspace check/import smoke: passed, with the existing npm
  `minimum-release-age` warning.
- Package surface guard: passed, with the existing npm `minimum-release-age`
  warning.
- Standalone import-entrypoint smoke: passed.
- `git diff --check`: passed.

## Risks Or Blockers

- No Rust files were changed, so no Rust checks were required.
- The new evidence is still package-private and source-owned. It proves the
  guarded facade can execute a private marked dispatcher and preserve one ref
  object across mount/update, but it does not admit public root rendering,
  renderer dispatcher lifecycle, Scheduler timing, `act`, or package
  compatibility.
- The source-owned evidence ref object is frozen after the probe to keep the
  evidence immutable. This intentionally does not claim public React ref object
  mutability compatibility.

## Recommended Next Tasks

1. Keep public `useRef` compatibility blocked until root `renderWithHooks`,
   committed hook-list rebinding, and renderer-owned dispatcher lifecycle are
   admitted together.
2. When public hook execution is admitted, replace this source-owned evidence
   with renderer/root-backed dual-run evidence before flipping compatibility
   flags.
