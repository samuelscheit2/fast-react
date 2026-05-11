# Worker 955 Conformance Test Discovery Gate

## Status

Complete.

## Summary

- Added `test/conformance-test-discovery.test.mjs` to fail closed when
  executable conformance test gates are not covered by the workspace
  `scripts.test` command.
- Repaired wrapper coverage detection after audit: covered wrappers are now
  scanned with a conservative static-import lexer instead of raw regex matching,
  so commented-out imports and import-looking string/template literals do not
  mark gates as covered.
- Updated `tests/conformance/package.json` so `npm run test:conformance`
  directly runs `test/react-act-public-blocked-gate.mjs`, which was outside
  the previous `test/*.test.mjs` glob and had no covered wrapper test.
- The discovery gate also recognizes `test/react-dom-root-render-e2e-conformance-gate.mjs`
  as covered through its script-covered wrapper import,
  `test/react-dom-root-render-e2e-conformance-gate.test.mjs`, avoiding duplicate
  root-render gate execution.

## Discovered Gaps

- `test/react-act-public-blocked-gate.mjs` was an executable gate outside the
  workspace test glob and was not otherwise covered by the test script.
- `test/react-dom-root-render-e2e-conformance-gate.mjs` is outside the glob but
  is already run through a covered wrapper test import.

## Verification

- PASS: `node --test tests/conformance/test/conformance-test-discovery.test.mjs`
- PASS: `node --check tests/conformance/test/conformance-test-discovery.test.mjs`
- PASS: `npm run check:package-surface`
- PASS: `node tests/smoke/import-entrypoints.mjs`
- PASS: `git diff --check`
- FAIL, pre-existing comparison: `node --test test/*.test.mjs src/react-test-renderer-serialization-local-gate.test.mjs`
  from `tests/conformance` fails in existing react-test-renderer serialization
  and private-admission 727/739/804 areas, while the discovery test itself
  passes in that run.
- FAIL, same pre-existing areas: `npm test --workspace @fast-react/conformance`
  now runs the discovery gate and public blocked gate, but still fails on the
  same react-test-renderer serialization/private-admission baseline failures as
  the old command shape. The repaired discovery gate passes in that run.

## Residual Risks

- The full conformance workspace is not green on this branch baseline. The
  focused discovery gate and smoke checks pass, and the old command shape
  reproduces the unrelated failures.
