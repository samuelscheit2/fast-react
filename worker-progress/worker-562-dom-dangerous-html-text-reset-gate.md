# Worker 562: DOM Dangerous HTML Text Reset Gate

Date: 2026-05-10

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: Add private DOM
  `dangerouslySetInnerHTML` versus text reset diagnostics that record blocked
  host update rows without mutating real DOM.
- No nested managed agents or explorer subagents were used.

## Summary

Added a private React DOM client diagnostic module for host prop transitions
between `dangerouslySetInnerHTML`, primitive text children, and managed
non-text children. The diagnostic records:

- previous text/html and next text/html snapshots;
- the `shouldSetTextContent`-based reset decision;
- blocked `innerHTML`, `textContent`, and `resetTextContent` host update rows;
- fail-closed unsupported payload rows for children conflicts;
- false public compatibility and real-DOM mutation flags at record and row
  level.

The module is record-only. It does not accept or call a DOM node and does not
write `innerHTML` or `textContent`.

## Changed Files

- `packages/react-dom/src/client/dom-property-operations.js`
- `packages/react-dom/test/dom-property-operations-private.test.js`
- `tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `tests/smoke/package-surface-guard.mjs`
- `tests/smoke/package-surface-snapshot.json`
- `worker-progress/worker-562-dom-dangerous-html-text-reset-gate.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Inspected accepted DOM text-content reset/update and style/dangerous HTML
  payload/mutation gates, plus worker reports 213, 241, 242, 453, and 454.
- Checked React 19.2.6 reference source for `shouldSetTextContent`,
  `ContentReset`, `resetTextContent`, and `dangerouslySetInnerHTML` update
  behavior.
- Compared the new blocked diagnostic rows with the checked
  `dangerously-set-inner-html-update-and-removal` oracle phases:
  `setInnerHTML("<em>After</em>")` for HTML update and
  `setTextContent("Managed child")` for HTML-to-text.
- Ran the package-surface guard after adding the new private file. It failed
  only because the private implementation inventory did not list
  `src/client/dom-property-operations.js`; the snapshot and exact private-file
  guard were updated, and the guard then passed.

## Commands Run

```sh
node --check packages/react-dom/src/client/dom-property-operations.js
node --check packages/react-dom/test/dom-property-operations-private.test.js
node --check tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs
node --test packages/react-dom/test/dom-property-operations-private.test.js
node --test tests/conformance/test/dom-property-payload-helper.test.mjs
node --test tests/conformance/test/dom-text-content-local-gate.test.mjs
node --test tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs
npm run check --workspace @fast-react/react-dom
node --check tests/smoke/package-surface-guard.mjs
node tests/smoke/package-surface-guard.mjs
git add --intent-to-add packages/react-dom/src/client/dom-property-operations.js packages/react-dom/test/dom-property-operations-private.test.js worker-progress/worker-562-dom-dangerous-html-text-reset-gate.md && git diff --check; rc=$?; git reset -- packages/react-dom/src/client/dom-property-operations.js packages/react-dom/test/dom-property-operations-private.test.js worker-progress/worker-562-dom-dangerous-html-text-reset-gate.md >/dev/null; exit $rc
```

The first `node tests/smoke/package-surface-guard.mjs` run failed on the new
private file inventory entry, then passed after the inventory update. The npm
workspace check passed; npm emitted the existing `minimum-release-age` warning.

## Risks Or Blockers

- This is a private diagnostic gate only. It does not wire reconciler
  HostComponent updates, public roots, browser DOM mutation, hydration,
  Trusted Types, managed child diffing, events, resources, or controlled forms.
- The blocked row model is intentionally bounded to primitive text children,
  string `dangerouslySetInnerHTML.__html`, text reset decisions, and unsupported
  payload diagnostics already accepted by the local property/text helpers.
- Package-surface inventory was touched outside the initial narrow file list to
  keep the new private file explicitly non-public and avoid a known repo-level
  guard failure.

## Recommended Next Tasks

1. Wire future HostComponent update metadata to emit these diagnostic rows from
   reconciler-owned update records before applying any fake-DOM mutation.
2. Add private managed child placement/delete rows for dangerous-HTML to real
   element-child transitions once child diff ownership is ready.
3. Keep public React DOM compatibility blocked until real DOM mutation,
   hydration, events, controlled forms, resources, and error routing all have
   green oracle-backed gates.
