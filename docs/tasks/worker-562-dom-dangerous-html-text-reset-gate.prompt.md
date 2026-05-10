# Worker 562: DOM Dangerous HTML Text Reset Gate

## Objective

Add private DOM `dangerouslySetInnerHTML` versus text reset diagnostics that
record blocked host update rows without mutating real DOM.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted text content reset/update and DOM style/dangerous HTML oracles.

## Write Scope

- `packages/react-dom/src/client/dom-property-operations.js`
- React DOM private property/text package tests
- `tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `worker-progress/worker-562-dom-dangerous-html-text-reset-gate.md`

## Requirements

- Record previous text/html, next text/html, reset decision, blocked mutation
  rows, and compatibility false flags.
- Keep real DOM `innerHTML` writes and public compatibility blocked.

## Verification

- Focused package tests for text/html/property operations
- Focused DOM style/dangerous HTML conformance tests
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

