# Worker 544: DOM Focus/Blur Event Blocker Gate

## Objective

Add private focus/blur event blocker diagnostics that record capture/bubble
metadata without installing listeners or dispatching synthetic focus events.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted event delegation, propagation, currentTarget, and portal event
owner-root metadata.

## Write Scope

- `packages/react-dom/src/events/plugin-event-system.js`
- Focused React DOM event package tests
- `tests/conformance/test/dom-event-delegation-oracle.test.mjs`
- `worker-progress/worker-544-dom-focus-blur-event-blocker-gate.md`

## Requirements

- Record native `focusin`/`focusout` mapping, target/currentTarget blockers,
  capture/bubble phase metadata, and portal owner-root status when available.
- Keep listener installation, event object creation, dispatch, and compatibility
  claims blocked.

## Verification

- Focused package event tests
- Focused DOM event conformance tests
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

