# Worker 172: Resource/Form Unsupported Gates

- Goal status: active
- Goal objective: add tests/gates that keep React DOM resources, singletons, form actions, and controlled form behavior explicitly unsupported until their private adapter prerequisites exist.
- Goal recorded from create_goal/get_goal before research or file reads.

## Progress
- Initialized goal and progress report.

## Status

Complete after final verification and `update_goal(status: "complete")`.

## Summary

Added fail-closed conformance gates that keep React DOM resource hints,
singletons, form actions, and controlled form behavior explicitly unsupported in
Fast React until their adapter prerequisites exist.

The gates preserve the existing React 19.2.6 oracle artifacts. They add local
Fast React checks alongside those oracles instead of regenerating or broadening
the oracle fixtures.

## Gates Added

- Resource hints:
  - Assert `react-dom`, `react-dom/profiling`, and
    `react-dom.react-server.js` resource APIs remain structured
    `FAST_REACT_UNIMPLEMENTED` placeholders.
  - Freeze current public lengths, names, descriptors, versions, non-enumerable
    placeholder metadata, and private dispatcher placeholder keys.
  - Assert the private dispatcher methods `D`, `C`, `L`, `m`, `X`, `S`, `M`,
    plus reserved `f` and form reset `r`, remain unsupported throwers.
  - Scan `packages/react-dom/src` for resource/singleton implementation tokens
    such as hoistable/singleton classification and resource lifecycle helpers.
- Form actions:
  - Assert `requestFormReset`, `useFormState`, and `useFormStatus` remain
    unsupported placeholders on default and profiling entrypoints.
  - Assert react-server root continues to omit form-action APIs.
  - Assert private dispatcher `r` remains an unsupported placeholder.
  - Scan `packages/react-dom/src` for form reset, root form state, host
    transition, and `FormData`/submitter implementation tokens.
- Controlled form controls:
  - Assert the checked controlled-input oracle still has no Fast React
    comparison or compatibility claim and still records fake-DOM/browser gaps.
  - Scan `packages/react-dom/src` for value tracking, controlled restore,
    input/select/textarea wrappers, latest-props maps, and controlled event
    plugin implementation tokens.

## Changed Files

- `tests/conformance/src/react-dom-resource-hints-unsupported-gates.mjs`
- `tests/conformance/src/react-dom-form-actions-unsupported-gates.mjs`
- `tests/conformance/src/dom-controlled-input-unsupported-gates.mjs`
- `tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `worker-progress/worker-172-resource-form-unsupported-gates.md`

## Context Read

- `WORKER_BRIEF.md`
- `worker-progress/worker-143-resource-form-refresh.md`
- `worker-progress/worker-059-react-dom-resource-hints-oracle.md`
- `worker-progress/worker-060-react-dom-form-actions-oracle.md`
- `worker-progress/worker-064-dom-controlled-input-oracle.md`
- `packages/react-dom/index.js`
- `packages/react-dom/profiling.js`
- `packages/react-dom/react-dom.react-server.js`
- Relevant resource/form/controlled conformance test and source files.

## Commands Run

- Goal tools: `create_goal`, `get_goal`
- `sed` reads for the required brief, worker reports, React DOM placeholder
  files, conformance tests, and new gate files.
- `rg --files` and `rg -n` scans over React DOM package and conformance files.
- `git status --short`
- Focused conformance:
  - `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
  - `node --test tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
  - `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- Required verification:
  - `npm run test:conformance`
  - `npm run check:js`
  - `git diff --check`
- Additional hygiene:
  - No-index `git diff --check` over untracked worker files.
  - Scoped trailing-whitespace scan over worker files.
  - Scoped conflict-marker scan over worker files.

## Verification Results

- Focused resource hints test passed: 12/12.
- Focused form actions test passed: 13/13.
- Focused controlled input test passed: 12/12.
- `npm run test:conformance` passed: 420/420.
- `npm run check:js` passed, including smoke entrypoint checks and workspace
  JS checks. npm emitted an existing `minimum-release-age` warning.
- `git diff --check` passed after the report edit.
- No-index `git diff --check` over untracked worker files passed.
- Scoped trailing-whitespace and conflict-marker scans passed.

## Orchestrator Acceptance Verification

- Worker tmux pane reported `Goal achieved`.
- Merged current `main` into
  `worker/172-resource-form-unsupported-gates` without conflicts.
- `node --check` passed for all three new unsupported-gate source files.
- Focused resource hints test passed: 12/12.
- Focused form actions test passed: 13/13.
- Focused controlled input test passed: 12/12.
- `npm run test:conformance` passed with 433 conformance tests.
- `npm run check:js` passed on the integrated branch, including the package
  surface guard, import smoke, benchmark gate, workspace checks, and 433
  conformance tests.
- `git diff --check main...HEAD` passed.

## Evidence Gathered

- Current `packages/react-dom/index.js` and `profiling.js` expose resource and
  form APIs as unsupported placeholders with React 19.2.6-facing arities.
- Current react-server root keeps resource APIs as placeholders and omits form
  APIs.
- Current private DOM internals expose dispatcher placeholder methods on
  default/profiling and opaque internals under the react-server root.
- Current `packages/react-dom/src` contains container marker and listener shell
  helpers only; it does not contain resource, singleton, form action, or
  controlled form-control adapter helpers.
- Existing React oracle artifacts remain checked fixtures and were not
  regenerated.

## Risks Or Blockers

- Source-token gates are intentionally conservative. A future legitimate
  implementation of these areas must update or replace these gates with the
  adapter-prerequisite tests it satisfies.
- The controlled form gate remains a source/claim boundary, not a browser DOM
  oracle. Browser-native reset, autofill, validation, focus, selection, and
  user-input behavior remain out of scope.
- No blockers remain.

## Recommended Next Tasks

- Add DOM-effect resource and singleton oracles before enabling resource or
  singleton adapter hooks.
- Add client-owned form action and submit/reset event oracles before enabling
  form behavior.
- Add browser/jsdom-backed controlled-control oracles before enabling value
  tracking and controlled restore.
