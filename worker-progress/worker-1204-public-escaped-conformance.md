# Worker 1204 Public Escaped Conformance

## Summary

- Updated the public root facade conformance lifecycle rows so the admitted fake-DOM div/text render path uses hostile `id = 'app&<>"'` and text containing `&`, `<`, and `>`.
- The conformance gate now expects escaped attribute/text serialization in `innerHTML` while preserving raw `textContent`, raw `getAttribute("id")`, same-root update reuse, rendered-root unmount cleanup, empty output after unmount, and zero listener/root-marker leaks.
- Added false-green coverage proving the gate fails when snapshots omit children, first-element-child fields, `innerHTML`, `tagName`, mutation logs, escaped serialized attr/text, or side-effect blockers.
- Repaired the source-audit finding that lifecycle API label evidence was self-referential: operation labels and validator expected labels now come from independent hostile-label constants, and lifecycle row `publicApi` labels must match those constants before rows can be admitted.
- Public compatibility remains blocked and `compatibilityClaimed: false`.

## Changed Files

- `tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-1204-public-escaped-conformance.md`

## Commands

- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `sed -n '1,320p' tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `git status --short --branch`
- `rg -n "renderDivText|renderUpdate|publicRootLifecycle|MINIMAL_PUBLIC_DIV_TEXT|hostNodeReused|mutationLog|firstElementChild|innerHTML|tagName|app|updated text" tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `sed -n '440,570p' tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `sed -n '2780,2925p' tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `sed -n '3260,3565p' tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `sed -n '3760,4195p' tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `rg -n "escape|escaped|&lt;|&quot;|hostile|public facade|createRoot\\(container\\).*React.createElement\\(\\\"div\\\"" packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `npm --prefix tests/conformance run root-public-facade:conformance`
- `node --test packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
- `git diff --check`
- `rg -n "LIFECYCLE_BLOCKED_ROWS\\[[123]\\]\\.publicApi|expectedLabel:\\s*REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS|label:\\s*REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS" tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `npm --prefix tests/conformance run root-public-facade:conformance`
- `node --test packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
- `git diff --check`

## Verification

- PASS: `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` (`42` tests passed) after the label repair.
- PASS: `npm --prefix tests/conformance run root-public-facade:conformance` (`Failures: 0`; public compatibility remains blocked) after the label repair.
- PASS: `node --test packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js` (`4` tests passed) after the label repair.
- PASS: `git diff --check` after the label repair.

## Evidence

- Package-level escaping evidence uses `id = 'app&<>"'`, initial text `hello & < >`, update text `again & < >`, and expects escaped `innerHTML` serialization.
- Conformance lifecycle rows now use the same hostile id/text values and expect `<div id="app&amp;&lt;&gt;&quot;">hello &amp; &lt; &gt;</div>` plus the analogous update output.
- The update row still asserts `hostNodeReused: true`.
- The unmount row still asserts empty controlled DOM output, cleanup mutation log, `duplicateRootTrackingCleared: true`, and zero listener/root-marker leaks.
- Negative cases mutate the local public facade boundary and fail the gate when required snapshot fields or side-effect blockers are missing/incorrect.
- The repair adds a stale-row negative case that mutates `public-create-root-render-div-text.publicApi` back to the simple `id="app"` / `"text"` label and proves the gate rejects it with `public-root-lifecycle-row-public-api-label-mismatch` without reporting that lifecycle row as valid.

## Audit, Review, Or Nested-Agent Findings

- No nested agents were used.
- Worker 1202 audit gap addressed: conformance rows no longer rely on simple `id="app"` / `text` values for the admitted public fake-DOM render path.
- Source audit finding addressed: lifecycle API label evidence no longer reads expected labels back from `REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS[n].publicApi`, and stale/simple public API labels now fail closed.

## Risks Or Blockers

- No current blockers.
- Remaining broad compatibility surfaces are intentionally still blocked: browser DOM, generic public root behavior, hydration, refs/listeners/events, Scheduler/act/flushSync, resources/forms, controlled inputs, test-renderer, and package/renderer compatibility.

## Recommended Next Tasks

- None required for this worker beyond orchestration review/merge.

## Commit

- `097304c7ab0efc4921babd0deae3542e6b002344` `Add escaped public facade conformance evidence`
- `971e72306d2d260a36e1c88fa8cc2a94881853db` `Decouple public facade lifecycle labels`
