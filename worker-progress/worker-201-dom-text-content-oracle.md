# Worker 201 - DOM Text Content Oracle

## Goal

- Status at setup: active.
- Objective recorded from `get_goal`: add a dedicated React DOM 19.2.6
  text-content oracle/gate for `shouldSetTextContent`, host text
  creation/update boundaries, and `dangerouslySetInnerHTML` exclusions, without
  implementing Fast React DOM text mutation behavior, changing React DOM
  package exports, or claiming DOM compatibility.
- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available immediately after setup and returned the active
  objective above.

## Summary

Added a dedicated React DOM 19.2.6 DOM text-content oracle and fail-closed
local Fast React gate. The generator uses the checked runtime inventory and
exact npm tarballs, extracts `react-dom@19.2.6`, evaluates the internal
`shouldSetTextContent` predicate from the extracted development bundle, and
probes real React DOM server/client behavior against focused deterministic
fake DOM scenarios.

The checked artifact records primitive text-content shortcuts, HostText
sibling creation/update/deletion/insertion boundaries, namespace-aware text
creation under SVG and `foreignObject`, SVG container child context, and
`dangerouslySetInnerHTML` leaf/exclusion/error behavior. Compatibility claims
remain false, and the local gate keeps all scenarios blocked until public root
rendering, DOM HostText creation, commit wiring, and dangerous HTML property
boundaries exist.

No `packages/react-dom/**`, Rust crates, Scheduler packages, React facades,
package exports, or master docs were changed.

## Changed Files

- `tests/conformance/src/dom-text-content-targets.mjs`
- `tests/conformance/src/dom-text-content-scenarios.mjs`
- `tests/conformance/src/dom-text-content-probe-runner.mjs`
- `tests/conformance/src/dom-text-content-oracle-generator.mjs`
- `tests/conformance/src/dom-text-content-oracle.mjs`
- `tests/conformance/src/dom-text-content-local-gate.mjs`
- `tests/conformance/scripts/generate-dom-text-content-oracle.mjs`
- `tests/conformance/scripts/print-dom-text-content-oracle.mjs`
- `tests/conformance/test/dom-text-content-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-dom-text-content-oracle.json`
- `worker-progress/worker-201-dom-text-content-oracle.md`

## Evidence Gathered

- Required context read: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and worker reports 061, 091, 110, 154, 185, and 186.
- Existing oracle patterns inspected under `tests/conformance/src`,
  `tests/conformance/test`, `tests/conformance/scripts`,
  `tests/conformance/oracles`, `tests/conformance/package.json`, and root
  `package.json`.
- React reference source inspected for `shouldSetTextContent`,
  `createTextInstance`, `resetTextContent`, `commitTextUpdate`,
  `setTextContent`, and `dangerouslySetInnerHTML` validation boundaries.
- Exact `react-dom@19.2.6`, `react@19.2.6`, and `scheduler@0.27.0` package
  artifacts were fetched through the checked inventory tarball URLs and
  integrity/file-list checks in the generator.
- The oracle artifact contains 17 `shouldSetTextContent` predicate rows, 10
  render scenarios, and development/production server plus client observations
  for every render scenario.
- No nested agents were spawned.

## Commands Run

- Tool actions: `create_goal`, then `get_goal`.
- Context/research commands included `rg --files` and `sed -n` reads for
  `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, worker reports
  061, 091, 110, 154, 185, and 186, conformance oracle source/test/script
  patterns, `tests/conformance/package.json`, and root `package.json`.
- React reference/source inspection used `rg` and `sed -n` over
  `ReactFiberConfigDOM.js`, `ReactDOMComponent.js`, and `setTextContent.js`.
- `node --check tests/conformance/src/dom-text-content-targets.mjs`
- `node --check tests/conformance/src/dom-text-content-scenarios.mjs`
- `node --check tests/conformance/src/dom-text-content-probe-runner.mjs`
- `node --check tests/conformance/src/dom-text-content-oracle-generator.mjs`
- `node --check tests/conformance/src/dom-text-content-oracle.mjs`
- `node --check tests/conformance/src/dom-text-content-local-gate.mjs`
- `node --check tests/conformance/scripts/generate-dom-text-content-oracle.mjs`
- `node --check tests/conformance/scripts/print-dom-text-content-oracle.mjs`
- `node --check tests/conformance/test/dom-text-content-oracle.test.mjs`
- `node tests/conformance/scripts/generate-dom-text-content-oracle.mjs --write`
- `node --test tests/conformance/test/dom-text-content-oracle.test.mjs`
- `tmpfile=$(mktemp); node tests/conformance/scripts/generate-dom-text-content-oracle.mjs > "$tmpfile" && cmp -s "$tmpfile" tests/conformance/oracles/react-19.2.6-dom-text-content-oracle.json && printf 'dom text-content oracle regeneration matches checked artifact\n'; rm -f "$tmpfile"`
- `npm run test:conformance -- --runInBand`
  - Passed with 480 conformance tests. npm warned that `--runInBand` is an
    unknown npm config, but the conformance runner still executed.
- `npm run check:js`
  - Passed, including package-surface guard, smoke imports, benchmark checks,
    workspace checks, native loader checks, and 480 conformance tests.
- `git diff --check`
- Trailing-whitespace scan over the new source/script/test/report files.
- Local/temp path leak scan over the new source/script/test files and checked
  JSON artifact.
- `git status --short --untracked-files=all`

## Verification

- Focused test passed: `node --test
  tests/conformance/test/dom-text-content-oracle.test.mjs` with 13 tests.
- Byte-stable artifact regeneration passed.
- Full conformance passed through `npm run test:conformance -- --runInBand`
  with 480 tests.
- `npm run check:js` passed.
- `git diff --check` passed.
- Path leak and trailing whitespace scans produced no matches.

## Risks Or Blockers

- The client oracle uses a deterministic fake DOM. It records React DOM calls
  and fake DOM state, not browser parser, layout, CSSOM, focus, selection,
  accessibility, or custom-element lifecycle behavior.
- `dangerouslySetInnerHTML` is recorded as a leaf shortcut and managed-child
  exclusion only; this worker does not implement or claim raw HTML parsing or
  browser DOM compatibility.
- React DOM's internal predicate includes `textarea` and `noscript`, but the
  local gate keeps textarea/controlled form and noscript behavior excluded
  until dedicated implementation work exists.
- Fast React DOM text compatibility remains blocked because public client
  roots are unsupported and DOM HostText creation/commit/dangerous HTML
  boundaries are not wired.

## Recommended Next Tasks

1. Use this oracle when implementing DOM text-content helpers and HostText
   create/update/reset behavior.
2. Keep scenario admission closed until public React DOM root rendering routes
   through reconciler commit and DOM host mutation code.
3. Add/update implementation gates per scenario after DOM HostText creation,
   text deletion cleanup, dangerous HTML property handling, and namespace host
   creation are actually wired.
