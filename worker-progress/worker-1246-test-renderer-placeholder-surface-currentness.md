# Worker 1246 - Test Renderer Placeholder Surface Currentness

## Summary

Hardened the react-test-renderer serialization local gate so
`placeholder-present` is accepted only when the canonical
`packages/react-test-renderer` package root and every required runtime
entrypoint still match the current placeholder/blocker surface.

The gate no longer accepts package-tree marker strings as sufficient evidence.
It now validates `package.json`, `index.js`,
`cjs/react-test-renderer.development.js`,
`cjs/react-test-renderer.production.js`, and `shallow.js` with exact
placeholder metadata/export/blocker checks while keeping public serialization,
TestInstance, native, package, and broad compatibility blocked.

## Changed Files

- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `worker-progress/worker-1246-test-renderer-placeholder-surface-currentness.md`

## Commands Run

```sh
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --test tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs
npm run test:react-test-renderer:serialization --workspace @fast-react/conformance
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
git diff --check
```

## Verification Results

- `node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`: passed, no output.
- `node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`: passed, no output.
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`: passed, 56 tests.
- `node --test tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs`: passed, 28 tests.
- `npm run test:react-test-renderer:serialization --workspace @fast-react/conformance`: passed, 84 tests; npm printed the existing `minimum-release-age` config warning.
- `npm run check:package-surface`: passed; npm printed the existing `minimum-release-age` config warning.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `git diff --check`: passed, no output.

## Evidence Gathered

- The placeholder package root must be the canonical
  `packages/react-test-renderer` root with exact package JSON values and no
  package exports/browser/module/types/native or compatibility claim fields.
- `placeholder-present` now requires all renderer entrypoints to preserve:
  - exact compatibility target, entrypoint name, and placeholder version;
  - non-enumerable `__FAST_REACT_PLACEHOLDER__`,
    `__FAST_REACT_ENTRYPOINT__`, and `compatibilityTarget` metadata;
  - exact blocked CommonJS export names;
  - blocked public `toJSON`, `toTree`, `.root`, `getInstance`, update,
    unmount, `unstable_flushSync`, `act`, and `unstable_batchedUpdates`
    surfaces.
- `shallow.js` must preserve its explicit shallow unsupported placeholder
  metadata and `module.exports = shallow` shape.
- Added hostile tests reject:
  - partial entrypoint drift where only the package root entrypoint keeps
    placeholder markers;
  - comment/string/template/regex marker spoofing;
  - package JSON public-package alias and `exports` smuggling;
  - sibling `packages/fast-react-test-renderer` alias package smuggling;
  - public/native/package export claim smuggling;
  - pre-metadata `exports.default`, `exports.native`, and
    `module.exports.default` alias smuggling.
  - trivia-split/bracketed `exports` mutations and
    `Object.defineProperty`/`Object.assign` export mutations;
  - simple CommonJS aliases such as `const out = exports; out.default = ...`;
  - executable template-expression export mutations, including mutations
    nested inside otherwise expected export assignment values;
  - repeated `module.exports` assignments after the expected shallow export.

## Audit And Review Notes

- Spawned a read-only nested audit for the local-gate changes.
- The audit found two false-green paths:
  - extra non-claim exports before `definePlaceholderMetadata`;
  - a sibling package-root alias under `packages/fast-react-test-renderer`.
- Both findings were repaired. Focused targeted tests for the repaired cases
  passed before the full verification rerun.
- A second repair audit found two remaining false-green paths:
  - CommonJS alias/export mutation smuggling through trivia, bracket access,
    `Object.defineProperty`, `Object.assign`, simple aliases, and executable
    template expressions;
  - repeated `module.exports` assignment after the expected
    `module.exports = shallow` shallow entrypoint export.
- The second repair replaced the narrow named-export substring scan with a
  CommonJS export-operation scanner that skips comments/string/regex trivia,
  scans executable template expressions, tracks simple `exports` and
  `module.exports` aliases, recognizes object export mutations, and requires
  the shallow entrypoint to contain exactly one `module.exports = shallow`
  assignment.
- Focused repair tests and the final full verification matrix passed after the
  second repair. A read-only nested scanner review reported no findings.

## Risks Or Blockers

- Local status remains `placeholder-present`; it is not a compatibility claim.
- The gate is intentionally strict about the current placeholder package
  layout. A future real react-test-renderer implementation must update the
  local status/oracle together instead of trying to preserve placeholder status.
- No package runtime entrypoints, Rust crates, package-surface snapshots, or
  native loading paths were changed.

## Recommended Next Tasks

- Keep public react-test-renderer compatibility blocked until serialization,
  TestInstance wrappers, native bridge routing, act/Scheduler behavior, and
  package compatibility are intentionally implemented and accepted.
