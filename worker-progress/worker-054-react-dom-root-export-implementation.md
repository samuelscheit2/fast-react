# worker-054-react-dom-root-export-implementation

## Status

Complete pending orchestrator review after narrow smoke follow-up.

Goal tools:

- `create_goal` succeeded for this worker objective before research, file
  reads, implementation, or verification.
- `get_goal` immediately after setup returned status `active` with objective:
  `Implement the lowest-risk react-dom root, profiling, and test-utils export
  behavior against the checked React DOM export oracle, replacing only
  placeholder behavior that can be made accurate without DOM rendering, client
  roots, hydration, events, or Fizz.`
- Continuation audit `get_goal` still returned the same objective with status
  `active` before final completion.
- Narrow follow-up `create_goal` succeeded before file reads or commands with
  objective: `Update the broad React DOM smoke expectations after the
  oracle-backed root export implementation so check:js passes.`
- Narrow follow-up `get_goal` immediately after setup returned status `active`
  with the same objective.

## Summary

Implemented the lowest-risk React DOM root, profiling, and test-utils export
behavior that can match the checked React DOM 19.2.6 export oracle without DOM
rendering, client roots, hydration, events, or Fizz.

Narrow follow-up: updated the broad import-entrypoints smoke so its React DOM
version expectation is entrypoint-aware. The smoke now expects `19.2.6` for the
implemented root and profiling entrypoints while preserving the old placeholder
version expectation for client/server/static/react-server files that still
export the scaffold value.

Implemented:

- `react-dom` and `react-dom/profiling` now export `version: "19.2.6"`.
- Root/profiling public function exports now match the checked oracle's blank
  public function names and arities for the covered entrypoints.
- Root/profiling private DOM internals now expose the oracle-covered object
  shape: `d`, `p`, and `findDOMNode`, with dispatcher keys
  `f`, `r`, `D`, `C`, `L`, `m`, `X`, `S`, and `M`.
- `unstable_batchedUpdates` is implemented as the React DOM 19.2.6 rootless
  passthrough: call the callback with the second argument, return its value, and
  propagate callback errors.
- `react-dom/test-utils.act` now matches the checked export descriptor shape
  while remaining loudly unsupported.

Intentionally unsupported:

- DOM rendering, portals, `flushSync`, resources, form/reset APIs, client roots,
  hydration roots, and profiling client-root APIs still throw
  `FastReactDomUnimplementedError`.
- DOM internals dispatcher functions throw loudly instead of pretending to
  dispatch resources, forms, events, roots, or Fizz work.
- `react-dom/test-utils.act` does not delegate yet. A direct React DOM 19.2.6
  probe confirmed the real wrapper warns once and delegates to `React.act`, but
  Fast React's public `React.act` is still unsupported, so delegation would only
  move the unsupported failure to another package and weaken the boundary.
- React-server React DOM branches were not changed because they are outside this
  worker's write scope.

## Changed Files

- `packages/react-dom/index.js`
- `packages/react-dom/profiling.js`
- `packages/react-dom/test-utils.js`
- `packages/react-dom/placeholder-utils.js`
- `tests/smoke/import-entrypoints.mjs`
- `tests/smoke/react-dom-root-exports.mjs`
- `worker-progress/worker-054-react-dom-root-export-implementation.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Used worker 033's inventory to preserve root-cause boundaries: client roots,
  hydration, events, resources, form actions, portals, and Fizz remain deeper
  renderer work.
- Used worker 036's checked export oracle for root/profiling/test-utils export
  key sets, descriptors, function names, function arities, `version`, and
  private internals shape.
- Directly probed React DOM 19.2.6 from registry tarballs extracted into a
  temporary `node_modules`:
  - `unstable_batchedUpdates.name === ""`
  - `unstable_batchedUpdates.length === 2`
  - `unstable_batchedUpdates(fn, "payload")` returns `fn("payload")`
  - invalid callback throws `TypeError`
  - `react-dom/test-utils.act.name === ""`
  - `react-dom/test-utils.act.length === 1`
  - `react-dom/test-utils.act` warns and returns a thenable from `React.act`
- Nested explorers independently inspected the export oracle and
  batching/`act` hypothesis without editing files or reading `ORCHESTRATOR.md`.
  They confirmed the implemented root/profiling export shapes and
  `unstable_batchedUpdates` passthrough. The `act` explorer confirmed real
  React DOM 19.2.6 delegates to `React.act`, but Fast React's public `React.act`
  is still unsupported in the current scoped code, so this worker kept
  `react-dom/test-utils.act` loudly unsupported rather than claiming behavior
  that cannot yet be made accurate.
- Narrow follow-up explorer independently confirmed the failing broad smoke
  assertions in the direct-file and package probe paths, and recommended the
  same entrypoint-aware version expectation: `index.js` and `profiling.js`
  should expect `19.2.6`, while currently unmigrated React DOM surfaces should
  keep `0.0.0-fast-react-dom-placeholder`.

## Completion Audit

Objective restated as success criteria:

- Implement only React DOM root/profiling/test-utils behavior that the checked
  React DOM 19.2.6 export oracle proves and that does not require DOM
  rendering, client roots, hydration, events, or Fizz.
- Update the broad React DOM import-entrypoints smoke expectations so the
  root/profiling `version` assertions match the oracle-backed implementation
  and `npm run check:js` passes.
- Preserve loud unsupported behavior for renderer, root, hydration, portal,
  resource, form/reset, server/static, and `act` behavior that is not
  implementable in this scope.
- Modify only the scoped files, add/keep a scoped smoke test, record this
  report, run required verification, and document unresolved risks.

Prompt-to-artifact checklist:

- Write scope: `git status --short` shows changes only in
  `packages/react-dom/index.js`, `packages/react-dom/profiling.js`,
  `packages/react-dom/test-utils.js`,
  `packages/react-dom/placeholder-utils.js`,
  `tests/smoke/import-entrypoints.mjs`,
  `tests/smoke/react-dom-root-exports.mjs`, and this report. An existing
  untracked `.worker-logs/worker-054-continuation.log` is outside this
  follow-up's write scope and was left untouched.
- Forbidden files: no changes under package metadata, lockfiles,
  `tests/conformance/**`, `packages/react-dom/client.js`, server/static
  entrypoints, or react-server entrypoints.
- Export oracle behavior: `tests/smoke/react-dom-root-exports.mjs` reads
  `tests/conformance/oracles/react-19.2.6-react-dom-export-oracle.json` and
  checks root/profiling/test-utils export keys, descriptor flags, function
  names/arities, ESM/CJS interop, `version`, internals shape, and
  `unstable_batchedUpdates` rootless passthrough.
- Unsupported boundary: root/profiling unsupported public APIs and DOM internals
  dispatchers still throw `FastReactDomUnimplementedError`; `test-utils.act`
  remains loudly unsupported with the reason documented above.
- `unstable_batchedUpdates`: direct oracle/tarball probe and scoped smoke both
  confirm blank name, arity 2, `callback(a)` return behavior, callback error
  propagation, and invalid-callback `TypeError`.
- Broad smoke expectation: `tests/smoke/import-entrypoints.mjs` now carries an
  optional `expectedVersion` on React DOM entrypoint metadata. Direct-file and
  package specifier probes expect `19.2.6` only for root/profiling, falling back
  to `0.0.0-fast-react-dom-placeholder` for currently unmigrated surfaces.
- Required verification: `node tests/smoke/react-dom-root-exports.mjs`,
  `node --check tests/smoke/react-dom-root-exports.mjs`,
  `node tests/smoke/import-entrypoints.mjs`, and `npm run check:js` passed
  after the broad smoke update; scoped conflict-marker, whitespace, concrete
  path, and `git diff --check` checks passed.
- Quality review: completed in the final section below; no DOM, HTML, resource,
  form, event, or stream behavior was added.

## Commands Run

Context, status, and evidence:

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
git status --short
git diff -- packages/react-dom/index.js packages/react-dom/profiling.js packages/react-dom/test-utils.js packages/react-dom/placeholder-utils.js tests/smoke/react-dom-root-exports.mjs worker-progress/worker-054-react-dom-root-export-implementation.md
ls -la packages/react-dom tests/smoke worker-progress
sed -n '1,240p' packages/react-dom/index.js
sed -n '1,260p' packages/react-dom/profiling.js
sed -n '1,260p' packages/react-dom/placeholder-utils.js
sed -n '1,220p' packages/react-dom/test-utils.js
sed -n '1,260p' tests/smoke/react-dom-root-exports.mjs
sed -n '261,520p' tests/smoke/react-dom-root-exports.mjs
sed -n '1,260p' worker-progress/worker-054-react-dom-root-export-implementation.md
find tests/conformance -maxdepth 4 -type f | sort | rg 'react-dom-export|react-dom.*oracle'
sed -n '1,260p' worker-progress/worker-036-react-dom-export-oracle.md
node - <<'NODE'
const oracle=require('./tests/conformance/oracles/react-19.2.6-react-dom-export-oracle.json');
for (const subpath of ['.','./profiling','./test-utils']) {
  const obs=oracle.runtimeExportObservations['default-node-development'].find(o=>o.subpath===subpath);
  console.log(subpath, obs.require.exportKeys);
}
NODE
sed -n '1,220p' package.json
sed -n '1,260p' worker-progress/worker-033-react-dom-inventory.md
sed -n '221,460p' worker-progress/worker-033-react-dom-inventory.md
sed -n '1,220p' worker-progress/worker-035-package-surface-scaffolds.md
sed -n '1,260p' packages/react/index.js
sed -n '1,260p' packages/react/placeholder-utils.js
sed -n '1,260p' packages/react-dom/package.json
rg -n "react-dom-root-exports|import-entrypoints|placeholder-utils|createUnsupportedFunction|unstable_batchedUpdates|test-utils" -S . --glob '!ORCHESTRATOR.md' --glob '!node_modules/**' --glob '!target/**'
node -e "const React=require('./packages/react'); console.log(typeof React.act, React.act.name, React.act.length); try{React.act(()=>{})}catch(e){console.log(e.name,e.code,e.exportName)}"
sed -n '160,330p' tests/smoke/import-entrypoints.mjs
sed -n '330,560p' tests/smoke/import-entrypoints.mjs
sed -n '580,760p' tests/smoke/import-entrypoints.mjs
sed -n '1580,1635p' tests/smoke/import-entrypoints.mjs
sed -n '2210,2260p' tests/smoke/import-entrypoints.mjs
```

Continuation audit and rerun commands:

```sh
node tests/smoke/react-dom-root-exports.mjs
node --check tests/smoke/react-dom-root-exports.mjs
npm run check:js
perl -ne 'print "$ARGV:$.:$_" if /[ \t]$/; close ARGV if eof' packages/react-dom/index.js packages/react-dom/profiling.js packages/react-dom/test-utils.js packages/react-dom/placeholder-utils.js tests/smoke/react-dom-root-exports.mjs worker-progress/worker-054-react-dom-root-export-implementation.md
scoped conflict-marker scan over changed files
scoped concrete local workspace/temp path scan over the smoke test and report
git add --intent-to-add tests/smoke/react-dom-root-exports.mjs worker-progress/worker-054-react-dom-root-export-implementation.md && git diff --check -- packages/react-dom/index.js packages/react-dom/profiling.js packages/react-dom/test-utils.js packages/react-dom/placeholder-utils.js tests/smoke/react-dom-root-exports.mjs worker-progress/worker-054-react-dom-root-export-implementation.md; rc=$?; git reset -- tests/smoke/react-dom-root-exports.mjs worker-progress/worker-054-react-dom-root-export-implementation.md >/dev/null; exit $rc
git diff --name-only
git status --short --untracked-files=all
```

Narrow follow-up commands:

```sh
pwd && ls
sed -n '1,220p' WORKER_BRIEF.md
git status --short
sed -n '1,260p' tests/smoke/import-entrypoints.mjs
sed -n '1,220p' tests/smoke/react-dom-root-exports.mjs
sed -n '1,260p' worker-progress/worker-054-react-dom-root-export-implementation.md
sed -n '200,430p' tests/smoke/import-entrypoints.mjs
sed -n '430,760p' tests/smoke/import-entrypoints.mjs
rg -n "fast-react-dom-placeholder|reactDom|profiling|version|placeholder" tests/smoke/import-entrypoints.mjs
node tests/smoke/import-entrypoints.mjs
sed -n '1570,1665p' tests/smoke/import-entrypoints.mjs
sed -n '2200,2265p' tests/smoke/import-entrypoints.mjs
node - <<'NODE'
const path = require('node:path');
const entries = [
  ['index.js'],
  ['client.js'],
  ['server.node.js'],
  ['server.browser.js'],
  ['server.edge.js'],
  ['server.bun.js'],
  ['static.node.js'],
  ['static.browser.js'],
  ['static.edge.js'],
  ['profiling.js'],
  ['react-dom.react-server.js']
];
for (const [file] of entries) {
  const mod = require(path.resolve('packages/react-dom', file));
  console.log(file, Object.hasOwn(mod, 'version') ? mod.version : '<no version>');
}
NODE
node tests/smoke/react-dom-root-exports.mjs
node --check tests/smoke/react-dom-root-exports.mjs
node tests/smoke/import-entrypoints.mjs
npm run check:js
git diff -- tests/smoke/import-entrypoints.mjs
git status --short --untracked-files=all
perl -ne 'print "$ARGV:$.:$_" if /[ \t]$/; close ARGV if eof' packages/react-dom/index.js packages/react-dom/profiling.js packages/react-dom/test-utils.js packages/react-dom/placeholder-utils.js tests/smoke/import-entrypoints.mjs tests/smoke/react-dom-root-exports.mjs worker-progress/worker-054-react-dom-root-export-implementation.md
rg -n "^(<<<<<<<|=======|>>>>>>>)" packages/react-dom/index.js packages/react-dom/profiling.js packages/react-dom/test-utils.js packages/react-dom/placeholder-utils.js tests/smoke/import-entrypoints.mjs tests/smoke/react-dom-root-exports.mjs worker-progress/worker-054-react-dom-root-export-implementation.md
scoped concrete local workspace/temp path scan over changed files
git add --intent-to-add tests/smoke/react-dom-root-exports.mjs worker-progress/worker-054-react-dom-root-export-implementation.md && git diff --check -- packages/react-dom/index.js packages/react-dom/profiling.js packages/react-dom/test-utils.js packages/react-dom/placeholder-utils.js tests/smoke/import-entrypoints.mjs tests/smoke/react-dom-root-exports.mjs worker-progress/worker-054-react-dom-root-export-implementation.md; rc=$?; git reset -- tests/smoke/react-dom-root-exports.mjs worker-progress/worker-054-react-dom-root-export-implementation.md >/dev/null; exit $rc
git diff --name-only -- packages/react-dom/index.js packages/react-dom/profiling.js packages/react-dom/test-utils.js packages/react-dom/placeholder-utils.js tests/smoke/import-entrypoints.mjs tests/smoke/react-dom-root-exports.mjs worker-progress/worker-054-react-dom-root-export-implementation.md
git status --short --untracked-files=all
```

Verification:

```sh
node tests/smoke/react-dom-root-exports.mjs
node --check tests/smoke/react-dom-root-exports.mjs
node tests/smoke/import-entrypoints.mjs
node - <<'NODE'
const dom = require('./packages/react-dom');
const profiling = require('./packages/react-dom/profiling.js');
for (const [label, mod] of [['root', dom], ['profiling', profiling]]) {
  console.log(label, mod.version, mod.unstable_batchedUpdates.name, mod.unstable_batchedUpdates.length, mod.unstable_batchedUpdates((x) => x + '!', 'ok'));
  console.log(label, Object.keys(mod.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE).join(','));
  console.log(label, Object.keys(mod.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.d).join(','));
}
const utils = require('./packages/react-dom/test-utils.js');
console.log('test-utils', Object.keys(utils).join(','), utils.act.name, utils.act.length);
NODE
npm run check:js
tmp="$(mktemp -d)"; rc=0; (mkdir -p "$tmp/node_modules/react" "$tmp/node_modules/react-dom" "$tmp/node_modules/scheduler" && curl -fsSL https://registry.npmjs.org/react/-/react-19.2.6.tgz | tar -xz --strip-components=1 -C "$tmp/node_modules/react" && curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xz --strip-components=1 -C "$tmp/node_modules/react-dom" && curl -fsSL https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz | tar -xz --strip-components=1 -C "$tmp/node_modules/scheduler" && NODE_PATH="$tmp/node_modules" node <probe script>) || rc=$?; rm -rf "$tmp"; exit "$rc"
```

Results:

- `node tests/smoke/react-dom-root-exports.mjs` passed.
- `node --check tests/smoke/react-dom-root-exports.mjs` passed.
- `node tests/smoke/import-entrypoints.mjs` passed after the version
  expectation update.
- Direct local shape/passthrough probe passed.
- Direct React DOM 19.2.6 registry tarball probe passed.
- `npm run check:js` passed after the broad smoke file was updated.

Continuation verification rerun:

- Re-read the checked export oracle for `.`, `./profiling`, and `./test-utils`
  and confirmed the local implementation matches the relevant export key,
  descriptor, function name/arity, `version`, and private internals shape.
- Re-ran `node tests/smoke/react-dom-root-exports.mjs`; it passed.
- Re-ran `node --check tests/smoke/react-dom-root-exports.mjs`; it passed.
- Re-ran `node tests/smoke/import-entrypoints.mjs`; it passed.
- Re-ran `npm run check:js`; it passed.
- Re-ran a direct React DOM 19.2.6 registry tarball probe. The first attempt
  used an overly narrow warning-message assertion for `test-utils.act`; the
  corrected probe passed and confirmed `unstable_batchedUpdates` is a rootless
  callback passthrough while `test-utils.act` is a deprecated wrapper around
  `React.act`.
- Scoped conflict-marker, trailing-whitespace, concrete local-path, and
  `git diff --check` checks passed over the changed files, including the
  untracked smoke/report files via `git add --intent-to-add`.
- Final scoped status remained limited to the seven files in this worker's
  write scope. The existing untracked `.worker-logs/worker-054-continuation.log`
  remains outside the scoped diff and was not removed.

## Risks And Follow-Ups
- Add a dedicated `react-dom/test-utils.act` oracle and implementation only
  after Fast React public `React.act` exists.
- Add dedicated oracles before implementing `flushSync`, resource hints, form
  APIs, client roots, hydration, portals, or server/static behavior.
- React-server React DOM branches still expose older placeholder version and
  function-shape behavior; fixing those needs a separate scoped task because the
  react-server files were not in this worker's write scope.

## Quality, Maintainability, Performance, And Security Review

- Quality: The implementation is descriptor-backed and covered by a smoke test
  that reads the checked oracle instead of duplicating export keys by hand.
- Maintainability: Function shape and passthrough behavior are centralized in
  `placeholder-utils.js`; unsupported renderer APIs keep the existing structured
  error metadata.
- Performance: New behavior is allocation-light and synchronous. The only
  callable implementation, `unstable_batchedUpdates`, is a direct callback
  passthrough.
- Security: No DOM, HTML, resource, form, event, or stream behavior was added.
  The registry probe used downloaded tarballs only for local verification and
  did not run package lifecycle scripts.
