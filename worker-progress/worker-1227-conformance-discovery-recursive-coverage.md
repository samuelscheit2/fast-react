# Worker 1227 Conformance Discovery Recursive Coverage

## Status

Complete.

## Summary

- Hardened `tests/conformance/test/conformance-test-discovery.test.mjs` so
  package-script coverage follows a deterministic static relative `.mjs` import
  graph from script-covered entries, not only direct wrapper imports.
- Repaired the sidecar bridge blocker: recursive static import discovery now
  follows only required executable conformance entries, and the coverage pass
  also ignores any supplied non-required import edge before enqueueing it.
- Preserved Worker 955 behavior: required executable gates remain
  `test/**/*.mjs` and `src/**/*.test.mjs`; direct `scripts.test` matches still
  count; direct wrapper imports still count; comments, strings, templates,
  dynamic imports, and bare/package imports do not create coverage.
- Kept coverage fail-closed: only required executable gate entries are counted
  as covered, and non-required sidecars under directories such as `fixtures/`
  cannot bridge coverage into a missed required gate.
- Added focused hostile fixtures for wrapper -> intermediate wrapper -> gate
  coverage, fixture-mediated bridge rejection, cyclic wrapper imports, and
  dynamic/comment/string false-green attempts that must not cover a missed gate.

## Changed Files

- `tests/conformance/test/conformance-test-discovery.test.mjs`
- `worker-progress/worker-1227-conformance-discovery-recursive-coverage.md`

## Commands Run

- PASS: `node --test tests/conformance/test/conformance-test-discovery.test.mjs`
- PASS: `node --check tests/conformance/test/conformance-test-discovery.test.mjs`
- PASS: `npm run check:package-surface`
- PASS: `node tests/smoke/import-entrypoints.mjs`
- PASS: `git diff --check`

## Evidence Gathered

- Read `WORKER_BRIEF.md` and Worker 955's accepted discovery-gate report.
- The focused discovery suite now passes with 12 tests.
- The transitive wrapper fixture proves `test/root-wrapper.test.mjs` covers
  `test/intermediate-wrapper.mjs`, which in turn covers
  `test/final-gate.mjs`.
- The sidecar bridge fixture proves `test/root-wrapper.test.mjs` importing
  `fixtures/sidecar.mjs`, which imports `test/missed-gate.mjs`, still leaves the
  missed required gate uncovered.
- The sidecar bridge fixture also checks the coverage analyzer directly with
  the old bridged map shape so a non-required sidecar cannot be enqueued as a
  bridge even if such an edge is supplied.
- The hostile recursive fixture proves a cycle between `test/cycle-a.mjs` and
  `test/cycle-b.mjs` terminates deterministically, while
  `test/missed-gate.mjs` stays uncovered when only mentioned by comments,
  string/template literals, or `import("./missed-gate.mjs")`.
- The hostile fixture still imports a non-required
  `fixtures/unrelated-sidecar.mjs`; it is excluded from recursive discovery and
  does not appear in `coveredEntries`.

## Audit, Review, Or Nested-Agent Findings

- Orchestrator review found the previous committed change only recursed
  filesystem discovery and still built wrapper coverage from direct static
  imports of direct-covered entries. This repair implements the missing
  transitive import traversal and adds regression coverage for that blocker.
- Follow-up audit found non-required sidecars could still bridge traversal into
  required missed gates. This repair constrains both discovery and coverage
  enqueueing to required conformance entries.
- No nested agents were used.

## Risks Or Blockers

- Full conformance workspace execution was not rerun for this repair; Worker
  955 documented pre-existing unrelated serialization/private-admission
  failures. This change is limited to conformance harness evidence and does not
  claim broad React runtime compatibility.
- The static import lexer remains intentionally conservative and is scoped to
  static relative `.mjs` imports inside the conformance tree.
- Overlap risk: this touches the same discovery gate file that other
  conformance-harness follow-up workers could reasonably edit.

## Recommended Next Tasks

- If future nested executable conformance gates are added, rely on this gate to
  fail closed unless the file is matched by `scripts.test` or reachable through
  a script-covered static relative `.mjs` import chain.
