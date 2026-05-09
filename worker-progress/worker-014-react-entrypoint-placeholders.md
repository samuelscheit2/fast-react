# worker-014-react-entrypoint-placeholders

## Objective

Improve the JavaScript React package placeholders and smoke tests using the
accepted worker-004 API inventory. The package should expose a more useful
runtime surface for upcoming conformance work while keeping all unproven React
behavior explicitly unimplemented.

## Sources and commands used

Read required sources:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-004-api-inventory.md`
- `worker-progress/worker-010-initial-scaffold.md`

`worker-progress/worker-011-core-element-model.md` was not present in this
worktree. I did not read `ORCHESTRATOR.md`.

Inspected implementation and test files:

- `packages/react/package.json`
- `packages/react/index.js`
- `packages/react/jsx-runtime.js`
- `packages/react/jsx-dev-runtime.js`
- `packages/react/compiler-runtime.js`
- `packages/react/README.md`
- `tests/smoke/import-entrypoints.mjs`
- root `package.json` scripts only for verification command behavior

Nested subagent:

- Spawned one read-only managed Codex explorer to independently test the
  hypothesis that the placeholders should align exact enumerable runtime key
  sets and `react-server` package conditions with worker-004. The subagent
  confirmed the target key sets and package export map, recommended stricter
  smoke checks, and identified a private-internals proxy invariant risk. I used
  that result to add reflection checks and fix the proxy root cause.

Commands run:

```bash
node tests/smoke/import-entrypoints.mjs
npm run check:js
npm run check
git status --short
git diff -- packages/react tests/smoke
```

`npm run check` generated transient `Cargo.lock` and `target/` artifacts while
running the Rust check script. They were removed after verification because
they are outside this worker's write scope.

## Files changed

- `packages/react/package.json`
- `packages/react/README.md`
- `packages/react/placeholder-utils.js`
- `packages/react/index.js`
- `packages/react/react.react-server.js`
- `packages/react/jsx-runtime.js`
- `packages/react/jsx-runtime.react-server.js`
- `packages/react/jsx-dev-runtime.js`
- `packages/react/jsx-dev-runtime.react-server.js`
- `packages/react/compiler-runtime.js`
- `tests/smoke/import-entrypoints.mjs`
- `worker-progress/worker-014-react-entrypoint-placeholders.md`

## React entrypoint implementation summary

- Updated `packages/react/package.json` so `react-server` conditions resolve to
  separate placeholder files for `.`, `./jsx-runtime`, and `./jsx-dev-runtime`.
  `./compiler-runtime` remains the same file for default and `react-server`,
  matching worker-004.
- Added default `react` enumerable runtime exports from the accepted
  `react@19.2.6` inventory, including `act`,
  `__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`, and
  `__COMPILER_RUNTIME`.
- Added a dedicated `react.react-server.js` placeholder with the narrower
  worker-004 `react-server` export set and server internals placeholder.
- Added `jsx-runtime.react-server.js` and
  `jsx-dev-runtime.react-server.js`, each exporting `Fragment`, `jsx`,
  `jsxDEV`, and `jsxs` under the `react-server` condition.
- Centralized placeholder errors in `placeholder-utils.js`. Behavior exports now
  throw `FastReactUnimplementedError` with `code`,
  `entrypoint`, `exportName`, and `compatibilityTarget` fields.
- Kept scaffold metadata available as non-enumerable properties so
  `Object.keys()` can track React runtime inventory without Fast React debug
  markers masking export-surface divergences.
- Added private internals placeholders that are intentionally opaque and throw
  on property access. Reflection on them returns an empty key set without Proxy
  invariant failures.

Breaking changes introduced intentionally:

- `__FAST_REACT_PLACEHOLDER__` and `compatibilityTarget` are no longer
  enumerable runtime exports. Root cause: enumerable scaffold metadata made
  `Object.keys()` diverge from the accepted React inventory.
- `react-server` package conditions no longer alias the default files. Root
  cause: worker-004 showed the condition branches expose materially different
  runtime keys.
- Placeholder error text and shape changed from generic `Error` messages to a
  typed unimplemented error. Root cause: upcoming conformance work needs
  structured diagnostics that distinguish deliberate placeholders from accidental
  runtime failures.

## Verification results

- `node tests/smoke/import-entrypoints.mjs`: passed.
  - Verifies direct CJS and ESM imports for default and `react-server`
    placeholder files.
  - Verifies exact enumerable key arrays for `react`,
    `react/jsx-runtime`, `react/jsx-dev-runtime`, and
    `react/compiler-runtime` under default and `react-server` conditions.
  - Verifies `package.json` export-map targets.
  - Verifies package specifier resolution through a temporary
    `node_modules/@fast-react/react` copy under default Node conditions and
    `--conditions=react-server`.
  - Verifies physical `.js`, helper, and condition files are not public package
    subpaths.
  - Verifies structured unimplemented errors and private-internals reflection.
- `npm run check:js`: passed.
  - Runs the smoke test at the root and through workspace `check` scripts.
- `npm run check`: passed.
  - Runs `cargo fmt --all --check`,
    `cargo clippy --workspace --all-targets --all-features -- -D warnings`, and
    `npm run check:js`.
- npm emitted local config warnings for `minimum-release-age`. This was already
  observed by worker-010 and did not affect command success.

## Deviations from worker-004 recommendation, if any

No deviations from worker-004's accepted runtime export key inventory or
package condition map for the React entrypoints in this worker's scope.

Scope-limited differences remain deliberate:

- The package is still the scaffold package `@fast-react/react`, not a claim of
  full `react` package compatibility.
- `version` remains `0.0.0-fast-react-placeholder` rather than `19.2.6` to avoid
  claiming behavioral compatibility.
- Type declarations are not implemented here because worker-004 identified type
  compatibility as a separate artifact owned by external declaration packages.
- All behavior remains explicitly unimplemented pending conformance-backed
  implementation work.

## Risks and root causes

Quality and maintainability:

- Root cause fixed: the prior smoke test proved importability only, so export
  names, condition branches, private internals, and blocked physical subpaths
  could drift silently. The new test asserts those surfaces directly.
- Root cause fixed: private internals placeholders used a Proxy shape that could
  fail reflection invariants. The hidden `Symbol.toStringTag` is now
  configurable, and smoke tests cover `Object.keys()` and `Reflect.ownKeys()`.
- Residual risk: runtime key arrays are manually transcribed from worker-004.
  A future generated inventory snapshot should replace the duplication.

Performance:

- The placeholders do no eager native loading or heavy initialization. Smoke
  tests copy only the small `packages/react` directory into a temporary package
  install and remove it afterward.

Security:

- No real rendering, SSR, script/resource hint, or DOM behavior is implemented.
  This avoids accidental XSS/resource-injection semantics while those APIs are
  unproven.
- Private internals exist only as throwing opaque placeholders and should not be
  documented as supported Fast React APIs.

## Proposed follow-up implementation tasks

1. Generate the React runtime inventory from exact npm tarballs and consume it
   from smoke/conformance tests instead of maintaining duplicated arrays.
2. Implement conformance-backed `createElement` and JSX runtime behavior against
   the Rust core element model once worker-011 lands.
3. Define the private internals object shapes only after React DOM/native
   integration requirements are observed; do not expand them from guesses.
4. Add a TypeScript declaration strategy separately, tracking worker-004's
   runtime/type divergence findings.
5. Add tests for Node dynamic `import()` namespace shape if the project decides
   to treat Node CJS interop keys as a compatibility surface.
6. Replace placeholder `version` only when the package can make an explicit
   compatibility claim.

## Completion checklist

- [x] Read all required project and worker source files available in this
  worktree.
- [x] Avoided reading `ORCHESTRATOR.md`.
- [x] Kept edits inside `packages/react/**`, `tests/smoke/**`, and this worker
  progress file.
- [x] Used the accepted worker-004 runtime inventory for exact export keys and
  package conditions.
- [x] Kept unproven React behavior explicitly unimplemented.
- [x] Made error messages and error metadata more useful for future conformance
  work.
- [x] Added `react-server` condition-specific placeholder entrypoints.
- [x] Added smoke coverage for default and `react-server` package resolution.
- [x] Added smoke coverage for blocked physical package subpaths.
- [x] Used a nested subagent to test the API-surface hypothesis and summarized
  the result.
- [x] Reviewed quality, maintainability, performance, and security
  implications.
- [x] Ran `node tests/smoke/import-entrypoints.mjs`.
- [x] Ran `npm run check:js`.
- [x] Ran `npm run check`.
- [x] Removed generated `Cargo.lock` and `target/` artifacts after verification.

## Handoff summary

`@fast-react/react` now has inventory-aligned placeholder runtime surfaces for
the accepted React entrypoints under both default Node and `react-server`
conditions. Behavior remains deliberately unimplemented, but failures are now
structured and explicit.

The smoke test has been upgraded from import-only checks to a package-surface
guard that verifies exact keys, package export conditions, condition-specific
resolution, private helper subpath rejection, hidden scaffold metadata, and
opaque private internals behavior.

Required verification passed:

- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `npm run check`
