# Worker 721: DOM Text Reset / Dangerous HTML Fake-DOM Execution Gate

## Goal

- Status: completed
- Objective: add a dedicated private fake-DOM execution path for admitted DOM
  text reset and `dangerouslySetInnerHTML` update/removal evidence, while
  keeping public React DOM roots, text-content, dangerousHTML, hydration, and
  browser DOM compatibility blocked.

## Source Evidence Inspected

- `WORKER_BRIEF.md`
- `worker-progress/worker-704-dom-root-update-style-dangerous-html-execution.md`
- `worker-progress/worker-562-dom-dangerous-html-text-reset-gate.md`
- `worker-progress/worker-454-dom-text-content-reset-update-gate.md`
- `worker-progress/worker-242-dom-style-dangerous-html-applier-gate.md`
- `worker-progress/worker-453-dom-style-dangerous-html-mutation-gate.md`
- `worker-progress/worker-614-react-dom-root-update-property-text-execution.md`
- `worker-progress/worker-703-dom-root-render-hosttext-component-execution.md`
- `packages/react-dom/src/dom-host/mutation.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/src/client/dom-property-operations.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/src/dom-text-content-local-gate.mjs`
- `tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`

## Implementation Summary

- Added a private `applyDangerousHtmlTextResetFakeDomRows` mutation helper in
  `packages/react-dom/src/dom-host/mutation.js`. It prevalidates diagnostic
  rows, admits only fake-DOM `innerHTML`, `setTextContent`, and
  `resetTextContent` rows, records hidden mutation payloads, and rolls back
  partial writes.
- Added a private WeakSet admission marker for dangerousHTML/text-reset
  fake-DOM targets. The execution helper now rejects unadmitted live-like nodes
  before reading `innerHTML`, reading `textContent`, validating row target
  properties, snapshotting rollback state, or writing DOM fields.
- Added text-content rollback snapshots that restore previous `innerHTML` when
  a text reset/removal row is rolled back after a dangerousHTML source.
- Added a dedicated private root-bridge handoff in
  `packages/react-dom/src/client/root-bridge.js` for dangerousHTML/text-reset
  fake-DOM commit execution. The handoff consumes accepted HostComponent commit
  metadata plus the existing private diagnostic, rejects stale rows, applies
  fake-DOM mutation, and publishes latest props only after mutation succeeds.
- Kept the existing metadata-only dangerousHTML/text reset path intact; public
  roots, browser DOM, hydration, events, refs, public text-content, and public
  dangerousHTML compatibility remain blocked.
- Added package tests for update, removal-to-text, reset-to-managed-child,
  stale latest-props rollback, unsupported rows, and stale diagnostic fail
  closed behavior. Added regression coverage for an unadmitted live-like host
  attached through the component tree, proving the bridge rejects before DOM
  access and leaves latest props unchanged.
- Added conformance coverage in the style/dangerousHTML oracle gate and the
  text-content local gate for the new private execution and rollback evidence,
  including a low-level unadmitted target rejection that records no reads or
  writes.

## Changed Files

- `packages/react-dom/src/dom-host/mutation.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `tests/conformance/test/dom-text-content-local-gate.test.mjs`
- `worker-progress/worker-721-dom-text-reset-dangerous-html-fake-dom-execution-gate.md`

## Verification

- `node --check packages/react-dom/src/dom-host/mutation.js`
- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --check tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `node --check tests/conformance/test/dom-text-content-local-gate.test.mjs`
- `node --test packages/react-dom/test/dom-property-operations-private.test.js`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test tests/conformance/test/dom-text-content-local-gate.test.mjs`
- `node --test tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `node --test tests/conformance/test/dom-text-content-local-gate.test.mjs tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm test --workspace @fast-react/conformance`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check`
- `rg -n "^(<<<<<<<|=======|>>>>>>>)" ...touched files...`
- `git add --intent-to-add worker-progress/worker-721-dom-text-reset-dangerous-html-fake-dom-execution-gate.md`
- `git diff --check`

All verification passed. NPM emitted the existing `minimum-release-age` warning.

## Risks

- This is private fake-DOM evidence only. It does not open public
  `react-dom/client.createRoot`, browser DOM, hydration, event, ref, controlled
  input, resource, or generic child reconciliation compatibility.
- DangerousHTML/text-reset execution requires private WeakSet admission. Plain
  objects, browser-like elements, and component-tree attached nodes are rejected
  unless the private fake-DOM fixture explicitly marks them first.
- The reset-to-managed-child path executes the admitted reset row and publishes
  private latest props, but it does not append or reconcile the managed child;
  public text-content compatibility remains explicitly blocked.
- The new rollback behavior is scoped to deterministic fake-DOM records with
  `innerHTML`, `textContent`, and optional array-backed `childNodes`.

## Recommended Next Tasks

- Wire reconciler-produced HostComponent dangerousHTML/text-reset rows into this
  private handoff only after the JS/Rust metadata envelope is stable.
- Add managed child placement/delete execution evidence separately before
  claiming any full dangerousHTML-to-managed-child update behavior.
- Keep public React DOM compatibility blocked until browser DOM, hydration,
  events, refs, controlled inputs, resources, and child reconciliation are all
  oracle-backed.
