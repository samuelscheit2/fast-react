# Worker 704: DOM Root Update Style/Dangerous HTML Execution

## Goal

- Status: active
- Objective: add private React DOM root-update evidence that applies accepted style and `dangerouslySetInnerHTML` fake-DOM update rows through the root bridge, preserving rollback/fail-closed behavior and no public root compatibility

## Summary

- Admitted validated `setInnerHTML` rows into the private latest-props mutation handoff so accepted `dangerouslySetInnerHTML` updates can execute on fake DOM nodes and publish latest props only after mutation succeeds.
- Added root-bridge hidden dangerous HTML fake-DOM commit evidence next to the existing style diff commit evidence, with public-safe metadata that omits raw HTML and keeps browser/public compatibility flags false.
- Preserved fail-closed behavior for unsupported dangerous HTML payload rows and strengthened root-update rollback evidence to include mutation-helper rollback diagnostics when a payload write fails before a handoff record can be returned.
- Added private and conformance coverage for combined style plus dangerous HTML root updates, rollback after a failing fake `innerHTML` setter, unsupported-row fail-closed behavior, and public-root facade blocked status.

## Changed Files

- `packages/react-dom/src/dom-host/property-payload.js`
- `packages/react-dom/src/dom-host/mutation.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/dom-property-operations-private.test.js`
- `tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `worker-progress/worker-704-dom-root-update-style-dangerous-html-execution.md`

## Commands Run

- `node --test packages/react-dom/test/dom-property-operations-private.test.js`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `node --test tests/conformance/test/dom-property-payload-helper.test.mjs`
- `git diff --check`
- Scoped conflict-marker scans over the touched files

## Evidence Gathered

- Private DOM property tests prove style rows and `dangerouslySetInnerHTML` rows execute through `bridge.applyHostOutputUpdate`, publish latest props after mutation, hide raw HTML from public JSON, and keep public compatibility false.
- Rollback evidence proves a failing fake `innerHTML` write rolls back previously applied style rows and leaves latest props at the previous object.
- Unsupported dangerous HTML shape rows still fail closed before style or HTML mutation.
- Style/dangerousHTML conformance confirms the private fake-DOM update rows mirror the checked React DOM oracle rows while preserving no public compatibility claim.
- Root public facade blocked conformance remains green.

## Risks Or Blockers

- This only admits string `dangerouslySetInnerHTML.__html` update rows on explicit private fake-DOM paths. Text reset, managed-child replacement, hydration, browser DOM, public roots, events, refs, resources/forms, and controlled inputs remain blocked.
- Public root compatibility remains intentionally unclaimed.

## Recommended Next Tasks

- Add reconciler-produced root commit evidence for dangerous HTML update rows once the HostComponent update metadata path carries concrete innerHTML payload rows.
- Keep removal/reset transitions on the existing metadata-only dangerousHTML/text-reset gate until a dedicated fake-DOM reset/text-content execution path is admitted.
