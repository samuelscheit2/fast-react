# Worker 1227 Conformance Discovery Recursive Coverage

## Status

Complete.

## Summary

- Hardened `tests/conformance/test/conformance-test-discovery.test.mjs` so
  required executable conformance gate discovery recurses under
  `tests/conformance/test` and `tests/conformance/src`.
- Preserved the Worker 955 fail-closed coverage model: gates must be covered by
  the workspace `scripts.test` command directly or through a covered static
  wrapper import.
- Added focused regression coverage proving nested `test/**/*.mjs` and
  `src/**/*.test.mjs` entries are discovered and reported uncovered when the
  script only uses top-level `test/*.mjs` and `src/*.test.mjs` globs.
- Added nested wrapper-import coverage proving a script-covered nested wrapper
  can cover its nested imported gate without broad refactoring.

## Changed Files

- `tests/conformance/test/conformance-test-discovery.test.mjs`
- `worker-progress/worker-1227-conformance-discovery-recursive-coverage.md`

## Commands Run

- PASS: `node --test tests/conformance/test/conformance-test-discovery.test.mjs`
- PASS: `node --check tests/conformance/test/conformance-test-discovery.test.mjs`
- PASS: `npm run check:package-surface`
- PASS: `node tests/smoke/import-entrypoints.mjs`
- PASS: `git diff --check`
- PASS: `find tests/conformance/test tests/conformance/src -mindepth 2 -type f \( -path '*/test/*.mjs' -o -path '*/src/*.test.mjs' \) | sort`

## Evidence Gathered

- Read `WORKER_BRIEF.md`.
- Inspected Worker 955's accepted pattern in
  `worker-progress/worker-955-conformance-test-discovery-gate.md` and the
  existing discovery gate helper tests.
- The focused discovery test passed with 9 tests, including the new recursive
  discovery and nested wrapper-import cases.
- The current checked-in conformance tree has no already-nested executable
  conformance gate entries matching the new recursive discovery criteria; the
  new temporary fixture test covers future nested additions.

## Audit, Review, Or Nested-Agent Findings

- Recursive discovery remains rooted only at `test` and `src`; the regression
  fixture includes `fixtures/` and `scripts/` files that are not discovered.
- `src` discovery still requires `.test.mjs`, so nested source helper modules
  such as `src/deep/source-helper.mjs` do not become required executable gates.
- Existing glob semantics are unchanged: `test/*.mjs` and `src/*.test.mjs`
  cover top-level files only, and the nested fixture entries remain uncovered
  unless the script uses a matching nested or recursive pattern.
- No nested agents were used.

## Risks Or Blockers

- Full conformance workspace execution still has unrelated baseline failures
  documented by Worker 955; this task used focused discovery, syntax,
  package-surface, import-smoke, and whitespace evidence only.
- This change does not claim broad conformance execution, public React
  compatibility, or performance compatibility.

## Recommended Next Tasks

- When adding future nested conformance gates, either include them directly in
  `scripts.test`, cover them through a script-covered wrapper import, or expect
  this discovery gate to fail closed.
