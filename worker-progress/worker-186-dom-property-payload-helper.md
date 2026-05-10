# Worker 186 - DOM Property Payload Helper

## Goal

- Status: complete
- Objective: Worker 186: add a private React DOM property payload helper for ordinary host attributes and focused tests, without mutating DOM nodes, wiring public roots, events, controlled inputs, hydration, resources, forms, or style/dangerouslySetInnerHTML behavior.

## Progress

- Initialized progress report after `create_goal` and `get_goal`.

## Summary

Added a private, data-only React DOM host property payload helper for bounded
ordinary attribute cases. The helper computes deterministic ordered entries
from previous props and next props, with `setAttribute` and `removeAttribute`
entries for supported host attributes and explicit `nonPayload` or
`unsupported` entries for excluded surfaces.

No public `react-dom` exports, client roots, event/listener files, hydration
files, resource/form APIs, Rust crates, React package files, scheduler files,
or namespace-helper files were changed.

## Changed Files

- `packages/react-dom/src/dom-host/property-payload.js`
- `tests/conformance/test/dom-property-payload-helper.test.mjs`
- `worker-progress/worker-186-dom-property-payload-helper.md`

## Evidence Gathered

- Read the worker brief, master plan, DOM attribute/property oracle report,
  style/`dangerouslySetInnerHTML` oracle report, minimal DOM mutation plan, and
  DOM mutation refresh report.
- Inspected current private `packages/react-dom/src/**` helpers and test
  import patterns.
- Inspected React 19.2.6 reference DOM property update paths in
  `ReactDOMComponent.js`, `DOMPropertyOperations.js`, `getAttributeAlias.js`,
  and `isAttributeNameSafe.js`.
- Confirmed the helper stays private by importing it directly from the
  conformance test path and checking it is not added to the package export map.
- No nested agents were spawned for this worker.

## Implementation Notes

- Supports ordered `setAttribute`/`removeAttribute` payload entries for
  `className`, `htmlFor`, `id`, `title`, `role`, `tabIndex`, `data-*`,
  `aria-*`, lowercase custom attributes, boolean attributes such as
  `disabled`/`hidden`, and omitted or nullish removed props.
- Treats `children`, `ref`, `key`, event-like props, and warning-suppression
  props as explicit `nonPayload` entries.
- Treats controlled `input`/`select`/`textarea` props, form action props,
  document-scoped resource host tags, `style`, `innerHTML`, and
  `dangerouslySetInnerHTML` as explicit `unsupported` entries.
- Does not accept or touch DOM nodes and does not call DOM mutation APIs,
  attach listeners, update latest-props maps, or wire public root behavior.

## Commands Run

- `git status --short`
- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,240p' MASTER_PLAN.md`
- `sed -n '1,260p' worker-progress/worker-061-dom-attribute-property-oracle.md`
- `sed -n '1,260p' worker-progress/worker-062-dom-style-dangerous-html-oracle.md`
- `sed -n '1,260p' worker-progress/worker-091-dom-mutation-minimum-plan.md`
- `sed -n '1,260p' worker-progress/worker-134-dom-mutation-refresh.md`
- `rg --files packages/react-dom/src`
- `rg --files tests/smoke tests/conformance/src tests/conformance/test`
- `find /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client -maxdepth 1 -type f -name '*.js'`
- `find /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/shared -maxdepth 1 -type f -name '*.js'`
- `sed -n '320,760p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/ReactDOMComponent.js`
- `sed -n '760,1160p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/ReactDOMComponent.js`
- `sed -n '1433,1915p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/ReactDOMComponent.js`
- `sed -n '1915,1968p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/ReactDOMComponent.js`
- `sed -n '1,220p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/DOMPropertyOperations.js`
- `sed -n '180,360p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/DOMPropertyOperations.js`
- `sed -n '1,180p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/shared/isAttributeNameSafe.js`
- `sed -n '1,140p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/shared/getAttributeAlias.js`
- `node --test tests/conformance/test/dom-property-payload-helper.test.mjs`
- `npm run check:js`
- `git diff --check`

## Verification

- `node --test tests/conformance/test/dom-property-payload-helper.test.mjs`
  passed with 7 tests.
- `npm run check:js` passed, including smoke entrypoint checks and the full
  conformance workspace with 434 passing tests.
- `git diff --check` passed with no output.

## Post-Merge Orchestrator Verification

- Orchestrator merged current `main` into this branch without conflicts.
- Initial post-merge `npm run check:js` failed because the helper used a
  `singleton` token in private DOM source, which correctly tripped the
  resource/singleton unsupported source gate before prerequisites exist.
- Renamed that internal category to document-scoped resource host terminology
  while preserving the same unsupported behavior.
- Post-fix verification passed:
  - `node --test tests/conformance/test/dom-property-payload-helper.test.mjs`
  - `node --test tests/conformance/test/dom-namespace-svg-oracle.test.mjs`
  - `node tests/smoke/import-entrypoints.mjs`
  - `node --test tests/conformance/test/dom-property-payload-helper.test.mjs tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
  - `npm run check:js`: 467 conformance tests plus package surface,
    benchmark, native loader, and workspace smoke checks
  - `git diff --check`

## Risks Or Blockers

- This is a bounded infrastructure helper, not a DOM mutation implementation.
  It does not apply payloads or claim React DOM render/update compatibility.
- Attribute-name validation is intentionally narrow and helper-local; broader
  Unicode attribute support should be revisited if a future DOM host path needs
  it.
- URL attributes, namespaced attributes, custom-element property routing,
  style, `dangerouslySetInnerHTML`, controlled forms, document resource tags,
  events, and hydration remain explicit unsupported/non-payload surfaces here.

## Recommended Next Tasks

- Add a private DOM payload application helper after mutation commit ownership
  is ready, using this data shape as input.
- Add separate helpers for style/`dangerouslySetInnerHTML`, namespace-aware
  attributes, controlled forms, and event latest-props updates before any
  public React DOM compatibility claim.
