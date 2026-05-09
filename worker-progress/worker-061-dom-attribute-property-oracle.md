# worker-061-dom-attribute-property-oracle

## Status

Complete.

## Summary

Added a deterministic React DOM 19.2.6 DOM attribute/property oracle for common host props, booleanish attributes, custom attributes, warning observations, unknown props, `className`, `htmlFor`, data/aria props, and update/removal behavior.

The generator reads the checked React 19.2.6 runtime inventory, downloads and integrity-checks the exact `react`, `react-dom`, and `scheduler` tarballs listed there, extracts them into an isolated temporary `node_modules`, and runs one Node child process per mode, scenario, and probe kind. It records both `react-dom/server` serialization and `react-dom/client` mutation behavior against a deterministic fake DOM substrate.

## Changed Files

- `tests/conformance/src/dom-attribute-property-targets.mjs`
- `tests/conformance/src/dom-attribute-property-scenarios.mjs`
- `tests/conformance/src/dom-attribute-property-probe-runner.mjs`
- `tests/conformance/src/dom-attribute-property-oracle-generator.mjs`
- `tests/conformance/src/dom-attribute-property-oracle.mjs`
- `tests/conformance/scripts/generate-dom-attribute-property-oracle.mjs`
- `tests/conformance/scripts/print-dom-attribute-property-oracle.mjs`
- `tests/conformance/test/dom-attribute-property-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-dom-attribute-property-oracle.json`
- `worker-progress/worker-061-dom-attribute-property-oracle.md`

## Evidence Gathered

- Server serialization scenarios cover regular HTML attributes, React aliases, boolean and booleanish attributes, data/aria attributes, unknown/custom props, custom elements, and a two-phase update/removal case.
- Client mutation scenarios execute real React DOM 19.2.6 client code through `createRoot` and `flushSync`, recording attribute/property writes, removals, text updates, final fake DOM state, and development warnings.
- Development warning evidence includes contentEditable children, invalid aria prop, and unknown camel-case prop warnings.
- Determinism evidence includes pinned package versions, tarball integrity verification, tarball file-list matching against the checked runtime inventory, no lifecycle scripts, no root manifest/lockfile mutation, normalized paths, and a checked artifact byte-compare after regeneration.
- The oracle intentionally keeps Fast React compatibility claims false because this task records pinned React DOM behavior only.

## Commands Run

- `git status --short`
- `node --test tests/conformance/test/dom-attribute-property-oracle.test.mjs`
- `tmpfile="$(mktemp)"; node tests/conformance/scripts/generate-dom-attribute-property-oracle.mjs > "$tmpfile" && cmp -s "$tmpfile" tests/conformance/oracles/react-19.2.6-dom-attribute-property-oracle.json && echo 'dom attribute/property oracle regeneration matches checked artifact'; rm -f "$tmpfile"`
- `npm test --workspace @fast-react/conformance`

## Intentional Gaps

- Browser-native DOM behavior is not claimed. The client probe uses a deterministic fake DOM to record React DOM mutation calls and final state without adding a browser dependency.
- The fake DOM does not model HTML parsing, real `outerHTML`, layout, CSS cascade, focus, selection, accessibility tree behavior, custom element lifecycle callbacks, event dispatch, controlled form wrappers, selection restoration, or value tracking.
- Style diffing, `dangerouslySetInnerHTML`, SVG/MathML namespaces, controlled inputs/selects/textareas/forms, event delegation, hydration, resources, portals, and server/static Fizz behavior are left to separate oracle tracks.
- Fast React React DOM behavior is not compared in this artifact.

## Quality Review

- Maintainability: scenarios are declarative and reusable by both the generator and probe runner; target metadata and artifact paths live in a prefix-scoped target module.
- Performance: generation is bounded by short child-process and fetch timeouts; checked tests read the artifact instead of regenerating it.
- Security: downloaded tarballs are integrity checked against npm registry metadata captured by the checked runtime inventory; lifecycle scripts are not executed; temporary paths are normalized and removed after generation.
- Scope: all edits are under the assigned `dom-attribute-property` conformance paths and this worker report.

## Risks Or Blockers

- The fake DOM can under-model browser-specific behavior. This is documented in the oracle and should not be used as a browser serialization or layout oracle.
- Custom element property routing is observed only for deterministic existing fake-element properties; browser upgrade timing and lifecycle reactions are intentionally out of scope.
- Package-level conformance remains false until a future implementation worker compares Fast React React DOM behavior against this oracle.

## Recommended Next Tasks

- Use this oracle to drive the first Fast React DOM host-prop serialization and mutation implementation slice.
- Add separate oracles for style/`dangerouslySetInnerHTML`, namespaces, controlled inputs, events, refs, portals, and hydration before claiming broader React DOM compatibility.
