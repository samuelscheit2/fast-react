# Worker 454: DOM Text-Content Reset/Update Gate

Date: 2026-05-10

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and before this report.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: add a private fake-DOM gate
  for text-content reset and update ordering when host children switch between
  text and element children.
- No nested managed agents or explorer subagents were used.

## Summary

Added a private text-content reset/update transition gate for the element-owned
text-content path. The gate compares deterministic local fake-DOM operations
against the checked React DOM 19.2.6 oracle for the two host-child transition
orders that matter here:

- text-content shortcut to managed element child: reset the host element before
  appending the managed child;
- managed element child back to text-content shortcut: remove the managed child
  before applying the text-content update.

The existing `shouldSetTextContent` behavior and HostText commit gate remain
unchanged. Public roots, browser DOM compatibility, server rendering,
hydration, and generic child diffing remain blocked.

## Changed Files

- `packages/react-dom/src/dom-host/text-content.js`
- `packages/react-dom/src/dom-host/mutation.js`
- `tests/conformance/src/dom-text-content-local-gate.mjs`
- `tests/conformance/test/dom-text-content-local-gate.test.mjs`
- `worker-progress/worker-454-dom-text-content-reset-update-gate.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and worker reports 110, 152, 154, 323, 396, and 428.
- Inspected the existing private DOM text-content helper, mutation adapter,
  local text-content gate, checked DOM text-content oracle, and HostText commit
  conformance gate.
- Checked the oracle rows for `text-content-to-managed-child-boundary`:
  React DOM records `setTextContent(SECTION, "")` before `appendChild(SECTION,
  SPAN)`, and records `removeChild(SECTION, SPAN)` before the next
  `setTextContent(SECTION, "Plain text again")`.

## Commands Run

```sh
node --check packages/react-dom/src/dom-host/text-content.js
node --check packages/react-dom/src/dom-host/mutation.js
node --check tests/conformance/src/dom-text-content-local-gate.mjs
node --check tests/conformance/test/dom-text-content-local-gate.test.mjs
node --test tests/conformance/test/dom-text-content-local-gate.test.mjs
node --test tests/conformance/test/dom-host-text-commit-conformance-gate.test.mjs
node --test tests/conformance/test/dom-text-content-oracle.test.mjs
npm run dom-text-content:conformance --workspace @fast-react/conformance
npm run check --workspace @fast-react/react-dom
node tests/smoke/react-dom-mutation-adapter-shell.mjs
npm run check --workspace @fast-react/conformance
git diff --check
```

All commands passed. NPM emitted the existing `minimum-release-age` warning.

## Risks Or Blockers

- This is a private fake-DOM gate only. It does not implement public DOM child
  diffing, public root compatibility, browser DOM mutation, hydration, or
  server rendering.
- The local transition probes intentionally drive existing private mutation
  helpers in oracle order; they do not claim the reconciler can yet discover or
  schedule those operations from real HostComponent child changes.
- The broader DOM text-content conformance gate still reports unsupported DOM
  render/mutation rows and keeps compatibility claims false.

## Recommended Next Tasks

1. Wire reconciler HostComponent update metadata to emit text-content reset and
   child append/remove operations in the admitted order.
2. Admit a private root-commit handoff for these two transition rows only after
   ordered HostComponent child switch metadata exists.
3. Keep public React DOM root compatibility blocked until full child diffing,
   deletion cleanup, refs, events, hydration, and controlled form behavior are
   covered by separate gates.
