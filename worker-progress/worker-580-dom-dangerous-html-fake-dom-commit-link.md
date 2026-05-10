# Worker 580: DOM Dangerous HTML Fake-DOM Commit Link

## Goal

- Status at report time: active
- Objective: Connect private dangerousHTML/text-reset diagnostics to fake-DOM host-output commit metadata while real DOM innerHTML/textContent writes stay blocked.
- `get_goal` was available and returned the active goal above.

## Summary

- Added private WeakMap-backed dangerousHTML/text-reset diagnostic payloads so root-bridge can validate the exact host tag, previous props, next props, rows, and accepted/unsupported state without exposing the props on the public diagnostic record.
- Added a root-bridge metadata-only handoff for dangerousHTML/text-reset HostComponent commit rows. It consumes accepted root commit HostComponent metadata and current fake-DOM host-output latest props, records sanitized fake-DOM commit rows for innerHTML set, HTML-to-text, text-to-HTML, and resetTextContent transitions, and keeps real/fake DOM writes, public root execution, latest-props publication, and compatibility claims blocked.
- Preserved fail-closed children conflict diagnostics and added stale-row/unsupported-payload rejection at the handoff boundary.

## Changed Files

- `packages/react-dom/src/client/dom-property-operations.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/dom-property-operations-private.test.js`
- `tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `worker-progress/worker-580-dom-dangerous-html-fake-dom-commit-link.md`

## Commands Run

- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/src/client/dom-property-operations.js`
- `node --check packages/react-dom/test/dom-property-operations-private.test.js`
- `node --check tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `node --test packages/react-dom/test/dom-property-operations-private.test.js`
- `node --test tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

## Evidence Gathered

- Private dangerousHTML diagnostics now expose hidden validation payloads while keeping the source diagnostic private and public compatibility false.
- Root-bridge tests cover accepted fake-DOM commit metadata rows for innerHTML set, HTML-to-text, text-to-HTML, and resetTextContent transitions.
- Rejection tests cover stale next-prop rows and unsupported children-conflict payloads without invoking `innerHTML` or `textContent` setters.
- Conformance tests connect the checked React 19.2.6 dangerousHTML update/removal oracle transitions to the new fake-DOM metadata-only handoff while keeping compatibility claims false.

## Risks Or Blockers

- No blockers.
- The handoff intentionally does not publish latest props for dangerousHTML/text reset rows because the actual DOM write remains blocked. Future work that admits real fake-DOM mutation will need to define rollback and latest-props ordering separately.

## Recommended Next Tasks

- Add a later worker to admit controlled fake-DOM `innerHTML`/`textContent` mutation only after rollback, latest-props publication, and browser/public compatibility gates are explicitly designed.
- Keep public `react-dom/client` roots blocked until this metadata path is wired into a real reconciler commit path with dual-run behavior evidence.

## Delegation

- No nested agents or subagents were used.
