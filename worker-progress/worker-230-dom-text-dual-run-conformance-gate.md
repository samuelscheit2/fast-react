# Worker 230 - DOM Text Dual-Run Conformance Gate

## Goal

- Status from `get_goal`: active.
- Objective from `get_goal`: add a fail-closed dual-run conformance gate around
  the accepted DOM text-content oracle so Fast React can compare only
  implemented private text-content behavior and explicitly skip unsupported DOM
  mutation/root paths.
- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available immediately after setup and again before writing
  this report.

## Summary

Added a focused fail-closed DOM text-content conformance gate around the checked
React DOM 19.2.6 text-content oracle.

Current gate result:

- Gate id: `dom-text-content-dual-run-gate-1`
- Admitted local private `shouldSetTextContent` rows compared: 14
- Skipped unsupported private rows: 3 (`BigInt`, `textarea`, `noscript`)
- Skipped unsupported server/client render and DOM mutation rows: 40
- Full DOM text-content compatibility claimed: false

The gate compares only the implemented private
`packages/react-dom/src/dom-host/text-content.js#shouldSetTextContent` helper
against the accepted oracle. Public root rendering, server rendering, HostText
creation/commit output, and DOM mutation/root paths remain explicitly skipped
until those implementation paths exist and scenario admission is updated.

No React DOM implementation, Rust crate, benchmark, oracle artifact, or master
doc files were changed.

## Changed Files

- `tests/conformance/src/dom-text-content-conformance-gate.mjs`
- `tests/conformance/scripts/check-dom-text-content-conformance.mjs`
- `tests/conformance/test/dom-text-content-oracle.test.mjs`
- `tests/conformance/package.json`
- `worker-progress/worker-230-dom-text-dual-run-conformance-gate.md`

## Evidence Gathered

- Required context read: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and worker reports 106, 121, 137, 163, and 201.
- Inspected the accepted root E2E gate pattern:
  `react-dom-root-render-e2e-conformance-gate.mjs`, its CLI, target metadata,
  and package script wiring.
- Inspected DOM text-content oracle/generator/probe/local-gate files and the
  checked text-content oracle shape.
- Inspected local private DOM host text helpers:
  `packages/react-dom/src/dom-host/text-content.js` and
  `packages/react-dom/src/dom-host/mutation.js`.
- Confirmed local private text-content support is narrower than React DOM for
  `BigInt`, `textarea`, and `noscript`; those rows are skipped instead of
  admitted as known mismatches.
- Spawned two read-only explorer subagents for the root gate pattern and text
  oracle shape. They did not return usable results before being closed, so no
  conclusions depend on nested-agent output.

## Commands Run

- `node --check tests/conformance/src/dom-text-content-conformance-gate.mjs`
- `node --check tests/conformance/scripts/check-dom-text-content-conformance.mjs`
- `node --check tests/conformance/test/dom-text-content-oracle.test.mjs`
- `node -e "JSON.parse(require('fs').readFileSync('tests/conformance/package.json','utf8')); console.log('package json ok')"`
- `npm run dom-text-content:conformance --workspace @fast-react/conformance`
- `node --test tests/conformance/test/dom-text-content-oracle.test.mjs`
- `npm run test:conformance`
- `npm run check:js`
- `tmpfile=$(mktemp); node tests/conformance/scripts/generate-dom-text-content-oracle.mjs > "$tmpfile" && cmp -s tests/conformance/oracles/react-19.2.6-dom-text-content-oracle.json "$tmpfile" && printf 'dom text-content oracle regeneration matches checked artifact\n'; rc=$?; rm -f "$tmpfile"; exit $rc`
- `git add --intent-to-add tests/conformance/src/dom-text-content-conformance-gate.mjs tests/conformance/scripts/check-dom-text-content-conformance.mjs`
- `git add --intent-to-add worker-progress/worker-230-dom-text-dual-run-conformance-gate.md && git diff --check && git status --short --untracked-files=all`

## Verification

Passed:

- Focused gate: `PASS`, with 14 admitted private helper rows, 3 skipped private
  rows, 40 skipped DOM render/mutation rows, and 0 failures.
- Focused DOM text-content test: 16 tests passed.
- Oracle regeneration byte-compare: passed.
- Full conformance: 483 tests passed.
- `npm run check:js`: passed, including package surface, smoke imports,
  benchmark checks, workspace checks, native loader checks, and conformance.
- `git diff --check`: passed after intent-to-add on the new files.

## Risks Or Blockers

- This is a private-helper gate, not a public DOM compatibility claim.
- `BigInt`, `textarea`, and `noscript` predicate rows are intentionally skipped
  until those slices are implemented or admitted explicitly.
- Server serialization, public React DOM root rendering, HostText
  creation/update/reset through commit, and fake/browser DOM mutation output
  remain skipped and compatibility-blocking.
- The checked oracle still records Fast React text-content compatibility claims
  as false; this gate adds current local comparison without regenerating or
  rewriting the accepted oracle artifact.

## Recommended Next Tasks

1. Add BigInt predicate support or keep it explicitly skipped until the local
   private helper is intentionally widened.
2. Admit server/client render rows only after public React DOM roots route
   through reconciler commit and DOM host mutation code.
3. Keep benchmark admission blocked until this gate and the root render E2E
   gate admit and match their relevant scenario rows.
