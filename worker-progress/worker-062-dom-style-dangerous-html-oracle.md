# worker-062-dom-style-dangerous-html-oracle

## Status

Complete.

## Summary

Added a deterministic React DOM 19.2.6 oracle for DOM `style` prop and `dangerouslySetInnerHTML` behavior.

The oracle is generated from the checked runtime inventory and exact npm tarballs for `react@19.2.6`, `react-dom@19.2.6`, and `scheduler@0.27.0`. It probes `react-dom/server` serialization and real `react-dom/client` mutation behavior through `createRoot` and `flushSync` against a deterministic fake DOM substrate.

## Changed Files

- `tests/conformance/src/dom-style-dangerous-html-targets.mjs`
- `tests/conformance/src/dom-style-dangerous-html-scenarios.mjs`
- `tests/conformance/src/dom-style-dangerous-html-probe-runner.mjs`
- `tests/conformance/src/dom-style-dangerous-html-oracle-generator.mjs`
- `tests/conformance/src/dom-style-dangerous-html-oracle.mjs`
- `tests/conformance/scripts/generate-dom-style-dangerous-html-oracle.mjs`
- `tests/conformance/scripts/print-dom-style-dangerous-html-oracle.mjs`
- `tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-dom-style-dangerous-html-oracle.json`
- `worker-progress/worker-062-dom-style-dangerous-html-oracle.md`

## Oracle Coverage

- Style serialization: normal camel-case properties, vendor-prefixed properties, numeric px suffixing, unitless numeric styles, zero numeric values, CSS custom properties, and escaped server string output.
- Style update/removal: two-phase client updates that clear removed normal properties, clear removed custom properties, update retained properties, and preserve active style state in the final fake DOM dump.
- Invalid style diagnostics: development warnings for `NaN`, `Infinity`, and hyphenated style names, with production warning absence recorded.
- Style prop shape validation: server throw shape and client `onUncaughtError` root error shape for string `style`.
- `dangerouslySetInnerHTML` serialization: valid raw HTML output and `null` `__html` empty-output behavior.
- `dangerouslySetInnerHTML` update/removal: assigned `innerHTML` replacement followed by switching back to managed text children.
- `dangerouslySetInnerHTML` validation: non-object, missing `__html`, and children-conflict cases across server throws and client root errors.

## Evidence Gathered

- The generator validates the checked runtime inventory, downloads exact tarballs from that inventory, verifies tarball integrity, matches tarball file lists, extracts into an isolated temporary `node_modules`, runs no lifecycle scripts, and mutates no root manifests or lockfiles.
- Server probes execute `ReactDOMServer.renderToString` in development and production modes for every scenario phase.
- Client probes execute real React DOM 19.2.6 `createRoot` and `flushSync` behavior in development and production modes, recording mutation calls, warnings, root errors, and final fake DOM state.
- The fake DOM records element/text creation, style property assignment, `style.setProperty`, `style.removeProperty`, `innerHTML` assignment, text updates, append/insert/remove operations, and final active style properties.
- Generated stack paths are normalized to stable package-relative paths or generic temporary placeholders, and the checked artifact has a no-temp/local-path-leak test.
- A nested read-only explorer was launched to test the pattern hypothesis, but it did not return within the wait window. No conclusions depend on that unfinished result.

## Commands Run

- `git status --short`
- `rg --files tests/conformance/src tests/conformance/scripts tests/conformance/test tests/conformance/oracles worker-progress | rg 'dom-style-dangerous-html|dom-attribute-property|react-dom-portal|react-dom-client-root|react-dom-resource-hints'`
- `node tests/conformance/scripts/generate-dom-style-dangerous-html-oracle.mjs --write`
- `node --test tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `npm test --workspace @fast-react/conformance`
- `node --input-type=module - <<'NODE' ... generateDomStyleDangerousHtmlOracle byte-compare ... NODE`
- `rg -n '(/Users/user|/private/var|/var/folders|/tmp/|file:///Users)' ...`
- `git diff --check`

## Intentional Gaps

- Fast React React DOM behavior is not compared here. The artifact records pinned React DOM behavior only and keeps compatibility claims false.
- Browser-native DOM behavior is not claimed. Client probes run real React DOM mutation code against a deterministic fake DOM, not a browser.
- The fake DOM does not model native HTML parsing, real `outerHTML`, CSS parsing, CSS cascade, computed styles, layout, focus, selection, accessibility, event dispatch, custom element lifecycle, controlled form wrappers, selection restoration, or value tracking.
- SVG/MathML namespaces, hydration, resources, events, controlled inputs, refs, portals, and server/static Fizz behavior remain separate oracle tracks.

## Quality Review

- Maintainability: scenarios are declarative and shared by server/client probes; target metadata, artifact paths, generator, printer, and test helpers are all prefix-scoped under `dom-style-dangerous-html`.
- Performance: checked tests read the generated artifact rather than regenerating it; generation uses bounded child process and fetch timeouts.
- Security: package tarballs are integrity checked against the checked inventory; lifecycle scripts are not run; raw HTML behavior is observed without string-building a Fast React implementation path; temporary directories are removed after generation.
- Scope: all changes are within the assigned write scope and do not modify package metadata, shared conformance helpers, or Fast React implementation files.

## Risks Or Blockers

- Fake DOM behavior can under-model browser-specific CSSOM and parser behavior. This is documented in the oracle and should not be used as a browser layout, parser, or computed-style oracle.
- Stack frame names are normalized and useful for diagnostics, but exact stack depth should not be treated as a compatibility contract.
- Package-level compatibility remains false until a future implementation worker compares Fast React React DOM behavior against this oracle.

## Recommended Next Tasks

- Use this oracle to drive a focused Fast React DOM style diffing and `dangerouslySetInnerHTML` implementation slice.
- Add browser-backed probes only if future implementation work needs evidence for real CSSOM parsing, native HTML parser behavior, or layout-dependent behavior.
