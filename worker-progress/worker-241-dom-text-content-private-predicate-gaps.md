# Worker 241 - DOM Text-Content Private Predicate Gaps

## Goal

- `create_goal` was available and was called before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: close or explicitly justify the
  private `shouldSetTextContent` predicate gaps currently skipped by the DOM
  text dual-run gate, especially BigInt, `textarea`, and `noscript`, using
  accepted React DOM oracle evidence while keeping public roots, server
  rendering, HostText commit, DOM mutation, and compatibility claims blocked.

## Summary

Closed the stale BigInt private predicate skip and made the remaining private
skips prove they are still real local gaps.

- Admitted `should-set-bigint-child` into the dual-run private
  `shouldSetTextContent` comparison because the local helper already matches
  the checked React DOM 19.2.6 oracle for BigInt children.
- Kept `textarea` and `noscript` skipped, but made those skips explicit
  oracle-backed mismatches: React DOM's private predicate returns `true`, while
  the local helper intentionally returns `false` until textarea/form and
  noscript behavior are implemented.
- Tightened the conformance gate so unsupported private predicate rows fail if
  local behavior later matches the checked oracle but the row is still skipped.
- Left public roots, server rendering, HostText commit, DOM mutation paths, and
  compatibility claims blocked.

## Changed Files

- `packages/react-dom/src/dom-host/text-content.js`
- `tests/conformance/src/dom-text-content-conformance-gate.mjs`
- `tests/conformance/test/dom-text-content-oracle.test.mjs`
- `worker-progress/worker-241-dom-text-content-private-predicate-gaps.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and worker
  reports 110, 154, 201, 211, and 230.
- Inspected React reference source
  `/Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js`.
  The private React DOM predicate returns true for `textarea`, `noscript`,
  string children, number children, BigInt children, and non-null
  `dangerouslySetInnerHTML.__html`.
- Confirmed the current local helper already returns true for BigInt children
  but returns false for `textarea` and `noscript`.
- Baseline gate before edits passed with 14 admitted private predicate rows and
  3 skipped private rows. After edits it passes with 15 admitted private rows
  and 2 skipped private rows.
- No nested agents were spawned.

## Commands Run

- Tool actions: `create_goal`, `get_goal`.
- Context/research: `sed -n` reads of required docs and worker reports;
  `find worker-progress ...`; `rg` over React reference source and local text
  conformance files; `git status --short --untracked-files=all`.
- Baseline: `npm run dom-text-content:conformance --workspace
  @fast-react/conformance`.
- Syntax checks:
  - `node --check packages/react-dom/src/dom-host/text-content.js`
  - `node --check tests/conformance/src/dom-text-content-conformance-gate.mjs`
  - `node --check tests/conformance/test/dom-text-content-oracle.test.mjs`
- Focused verification:
  - `npm run dom-text-content:conformance --workspace
    @fast-react/conformance`
  - `node --test tests/conformance/test/dom-text-content-oracle.test.mjs`
- Broad verification:
  - `npm run check:js`
  - `git diff --check`
  - `git add --intent-to-add
    worker-progress/worker-241-dom-text-content-private-predicate-gaps.md &&
    git diff --check`

## Verification

- `node --check` passed for all touched JS files.
- Focused DOM text-content conformance passed:
  - admitted private `shouldSetTextContent` rows: 15
  - skipped unsupported private `shouldSetTextContent` rows: 2
  - skipped DOM render/mutation rows: 40
  - failures: 0
- Focused oracle test passed: 16 tests.
- `npm run check:js` passed, including 505 conformance tests.
- `git diff --check` passed before writing this report and again after adding
  the report with intent-to-add so the new report file was included.

## Risks Or Blockers

- `textarea` and `noscript` remain intentionally blocked private predicate
  rows. This keeps the existing local gate aligned with the absence of
  controlled textarea/defaultValue/value tracking and noscript browser/server
  behavior.
- This worker did not change public React DOM roots, server rendering,
  HostText complete/commit wiring, DOM mutation output, or dangerous HTML
  property behavior.
- Full DOM text-content compatibility remains false and fail-closed.

## Recommended Next Tasks

- Admit `textarea` only after the textarea/form behavior slice can make the
  local helper and render behavior match the accepted controlled input and text
  oracle evidence.
- Admit `noscript` only after dedicated browser/server noscript behavior is
  implemented and checked.
- Keep Worker 261's HostText commit work separate; this gate now focuses only
  on private predicate admission and skip hygiene.
