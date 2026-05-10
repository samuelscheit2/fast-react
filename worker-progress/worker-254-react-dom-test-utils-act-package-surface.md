# Worker 254 - React DOM Test Utils Act Package Surface

## Goal Setup Evidence

- `create_goal` succeeded before research, file reads, implementation, or
  verification.
- `get_goal` returned status `active` with objective:
  `Tighten react-dom/test-utils.act package-surface and fail-closed behavior
  against the accepted oracle, preserving deterministic placeholder metadata
  without implementing public act, DOM root flushing, effect execution, or
  compatibility claims.`
- Final report-time `get_goal` still returned status `active` with the same
  objective.

## Summary

Tightened the local `react-dom/test-utils.act` guard without implementing
public `act` behavior.

The checked React DOM 19.2.6 oracle records a real deprecated wrapper that
delegates to `React.act` when available. Fast React still lacks public
`React.act`, DOM root flushing, effect execution, and renderer-backed act
draining, so this worker keeps `react-dom/test-utils.act` as a deterministic
unsupported placeholder while guarding the accepted package surface:

- Local `act` keeps the oracle-shaped export descriptor: enumerable writable
  CJS export, blank function name, length 1, and normal CJS dynamic-import
  interop.
- Placeholder metadata stays non-enumerable and deterministic:
  `__FAST_REACT_PLACEHOLDER__`, `__FAST_REACT_ENTRYPOINT__`, and
  `compatibilityTarget`.
- Calling `act(() => ...)` now has smoke/package-surface/conformance coverage
  proving it throws `FastReactDomUnimplementedError`, does not invoke the
  callback, emits no console warnings, and does not delegate to public
  `React.act`.

`packages/react-dom/test-utils.js` was left unchanged because the existing
placeholder already had the required package shape; the missing coverage was in
the guards.

## Changed Files

- `tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `tests/smoke/import-entrypoints.mjs`
- `tests/smoke/package-surface-guard.mjs`
- `tests/smoke/package-surface-snapshot.json`
- `worker-progress/worker-254-react-dom-test-utils-act-package-surface.md`

## Evidence Gathered

- Read required worker context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Inspected workers 054, 067, 097, 165, 231, and 253 context. Worker 067's
  oracle records the real `react-dom/test-utils.act` wrapper and its
  relationship to `React.act`; Worker 097 keeps public `React.act`
  compatibility false; Workers 165 and 231 established the strict
  package-surface snapshot pattern. The sibling Worker 253 branch had no local
  diff at inspection time.
- Inspected the checked
  `react-19.2.6-react-dom-test-utils-act-oracle.json` and confirmed the local
  placeholder should match only export shape, not wrapper behavior.
- No nested agents were spawned.

## Commands Run

Context and inspection:

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
rg -n 'Worker (054|067|097|165|231|253)|react-dom/test-utils|test-utils|act' MASTER_PROGRESS.md MASTER_PLAN.md worker-progress packages tests -g '!node_modules'
sed -n '<ranges>' worker-progress/worker-054-react-dom-root-export-implementation.md
sed -n '<ranges>' worker-progress/worker-067-react-dom-test-utils-act-oracle.md
sed -n '<ranges>' worker-progress/worker-097-react-act-oracle.md
sed -n '<ranges>' worker-progress/worker-165-package-surface-guard.md
sed -n '<ranges>' worker-progress/worker-231-package-surface-react-dom-subpath-tightening.md
git -C /Users/user/Developer/Developer/fast-react-worker-253-react-act-public-blocked-gate status --short --untracked-files=all
git -C /Users/user/Developer/Developer/fast-react-worker-253-react-act-public-blocked-gate diff --stat
sed -n '<ranges>' packages/react-dom/test-utils.js tests/smoke/import-entrypoints.mjs tests/smoke/package-surface-guard.mjs tests/smoke/package-surface-snapshot.json
sed -n '<ranges>' tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs tests/conformance/src/react-dom-test-utils-act-*.mjs
node - <<'NODE'
const pkg = require('./packages/react-dom/test-utils.js');
console.log(Object.keys(pkg));
console.log(Object.getOwnPropertyDescriptor(pkg, 'act'));
try { pkg.act(() => 'x'); } catch (error) { console.log(error.name, error.code, error.entrypoint, error.exportName); }
NODE
```

Verification:

```sh
node --check tests/smoke/package-surface-guard.mjs
node --check tests/smoke/import-entrypoints.mjs
node --check tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs
node --check packages/react-dom/test-utils.js
node -e "JSON.parse(require('node:fs').readFileSync('tests/smoke/package-surface-snapshot.json','utf8')); console.log('snapshot json ok')"
node --test tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
npm run check:js
git diff --check
git add --intent-to-add worker-progress/worker-254-react-dom-test-utils-act-package-surface.md && git diff --check; rc=$?; git reset -q -- worker-progress/worker-254-react-dom-test-utils-act-package-surface.md; exit $rc
git status --short --untracked-files=all
```

## Verification Results

- `node --check` passed for touched JS files and for
  `packages/react-dom/test-utils.js`.
- Package-surface snapshot JSON parsed successfully.
- `node --test tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
  passed: 12 tests, 0 failures.
- `npm run check:package-surface` passed.
- `node tests/smoke/import-entrypoints.mjs` passed.
- `npm run check:js` passed, including the package-surface guard, smoke
  entrypoints, benchmark gate, workspace checks, native loader checks, and 506
  conformance tests.
- `git diff --check` passed.
- npm emitted the existing `minimum-release-age` config warning; it did not
  affect results.

## Risks Or Blockers

- Fast React `react-dom/test-utils.act` intentionally does not match the real
  React DOM wrapper behavior yet. It only preserves export shape and fails
  closed.
- Future public `React.act` work from Worker 253 or later workers must not make
  this wrapper delegate until renderer root flushing, effect execution, and act
  queue draining are ready.
- The package-surface snapshot is stricter. When `react-dom/test-utils.act`
  becomes real, the `failClosed` snapshot metadata and the local conformance
  gate must be intentionally replaced with a dual-run comparison.

## Recommended Next Tasks

1. Keep `react-dom/test-utils.act` blocked until public `React.act`, DOM roots,
   sync flushing, and effect execution have compatible behavior.
2. Add a Fast React dual-run comparison for `react-dom/test-utils.act` only
   after renderer-backed flushing is implemented.
3. Update `tests/smoke/package-surface-snapshot.json` in the same change that
   intentionally removes the unsupported placeholder.
