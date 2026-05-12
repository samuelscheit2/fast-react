# Worker 1249 Conformance Discovery Template Import False-Green

## Status

Complete.

## Summary

- Hardened the conformance discovery static-import lexer so an import-looking
  line inside a nested template literal is skipped with the rest of the
  template and cannot cover a missed required gate.
- Added a direct hostile regression proving the fake nested-template import is
  uncovered while a real top-level static import after the template is still
  discovered.
- Added a transitive wrapper graph regression proving traversal does not bridge
  through a fake nested-template import into another required gate.
- Preserved existing recursive import graph, sidecar rejection,
  dynamic/comment/string false-green, and cycle-safe behavior.

## Changed Files

- `tests/conformance/test/conformance-test-discovery.test.mjs`
- `worker-progress/worker-1249-conformance-discovery-template-import-false-green.md`

## Commands Run

- PASS: `node --check tests/conformance/test/conformance-test-discovery.test.mjs`
- PASS: `node --test tests/conformance/test/conformance-test-discovery.test.mjs`
- PASS: `npm run check:package-surface`
- PASS: `node tests/smoke/import-entrypoints.mjs`
- PASS: `git diff --check`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, Worker 955's discovery-gate
  report, and Worker 1227's recursive-coverage report before editing.
- The focused discovery suite now passes 14 tests.
- The direct nested-template fixture produces only `test/real-gate.mjs` as a
  discovered import and leaves `test/template-false-green-gate.mjs` uncovered.
- The transitive graph fixture visits only
  `test/root-wrapper.test.mjs -> test/template-wrapper.mjs -> test/real-leaf.mjs`;
  `test/bridge-wrapper.mjs` and `test/missed-gate.mjs` remain uncovered, proving
  the fake nested-template import does not bridge coverage.
- The lexer now skips `${...}` template expressions recursively, including
  nested template literals, comments, and quoted strings inside expressions.

## Audit/Review Or Nested-Agent Findings

- A read-only nested explorer reviewed the diff and found no blockers.
- The explorer independently reran
  `node --test tests/conformance/test/conformance-test-discovery.test.mjs` and
  `git diff --check`, both passing.
- Residual review note: the scanner remains intentionally lightweight rather
  than a full JavaScript parser, so exotic syntax outside this conservative
  conformance-discovery scope can still require future hardening.

## Risks/Blockers

- No blockers.
- This remains conformance harness maintenance only. It does not change Rust,
  React DOM behavior, test-renderer behavior, package facades, or public
  compatibility claims.
- Worker label was retitled from the launched Worker 1245 prompt to Worker 1249
  by coordination update to avoid a duplicate worker id; the assigned worktree
  and branch path were left unchanged.

## Recommended Next Tasks

- Keep future discovery-gate hardening focused on fail-closed lexical cases that
  can otherwise mark required executable conformance gates as covered without
  actually executing them.
