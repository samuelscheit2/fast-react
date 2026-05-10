# Worker 580: DOM Dangerous HTML Fake-DOM Commit Link

## Objective

Connect private dangerousHTML/text-reset diagnostics to fake-DOM host-output
commit metadata while real DOM `innerHTML`/`textContent` writes stay blocked.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Worker 562 added dangerous HTML/text reset diagnostics. This task should create
the fake-DOM commit handoff row.

## Write Scope

- `packages/react-dom/src/client/dom-property-operations.js`
- `packages/react-dom/src/client/root-bridge.js` only for the narrow fake-DOM
  handoff row
- `packages/react-dom/test/dom-property-operations-private.test.js`
- `tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `worker-progress/worker-580-dom-dangerous-html-fake-dom-commit-link.md`

Do not edit scheduler, native, test-renderer, or React core.

## Requirements

- Record innerHTML set, HTML-to-text, text-to-HTML, and resetTextContent rows as
  fake-DOM commit metadata.
- Keep browser DOM mutation, public root execution, and compatibility claims
  false.
- Preserve fail-closed children conflict handling.
- Reject stale host-output rows and unsupported dangerousHTML payloads.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test packages/react-dom/test/dom-property-operations-private.test.js`
- `node --test tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`
