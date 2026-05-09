# worker-064-dom-controlled-input-oracle

## Status

Complete.

## Goal Tool State

- `create_goal` was called before research, file reads, implementation, or verification.
- `get_goal` confirmed active status for objective: Add deterministic React DOM 19.2.6 controlled input/select/textarea oracle files, covering controlled/uncontrolled warnings, value/defaultValue behavior, checked/defaultChecked behavior, select multiple behavior, textarea children behavior, and update behavior where practical.

## Summary

Added deterministic React DOM 19.2.6 controlled input/select/textarea oracle files. The generator reads the checked runtime inventory, downloads and integrity-checks exact `react@19.2.6`, `react-dom@19.2.6`, and `scheduler@0.27.0` tarballs, extracts them into an isolated temporary `node_modules`, and probes `react-dom/server` serialization plus `react-dom/client` form-control behavior.

The checked oracle covers 25 scenarios across development and production modes. Coverage includes text input `value`/`defaultValue`, checkbox `checked`/`defaultChecked`, controlled/default prop conflict warnings, read-only warnings, uncontrolled-to-controlled and controlled-to-uncontrolled update warnings, single and multiple select selected option behavior, textarea `value`/`defaultValue`, textarea children warnings, and synchronous update behavior through `ReactDOM.flushSync`.

## Changed Files

- `tests/conformance/src/dom-controlled-input-targets.mjs`
- `tests/conformance/src/dom-controlled-input-scenarios.mjs`
- `tests/conformance/src/dom-controlled-input-probe-runner.mjs`
- `tests/conformance/src/dom-controlled-input-oracle-generator.mjs`
- `tests/conformance/src/dom-controlled-input-oracle.mjs`
- `tests/conformance/scripts/generate-dom-controlled-input-oracle.mjs`
- `tests/conformance/scripts/print-dom-controlled-input-oracle.mjs`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-dom-controlled-input-oracle.json`
- `worker-progress/worker-064-dom-controlled-input-oracle.md`

## Completion Audit

- Objective deliverable: deterministic React DOM 19.2.6 oracle files for controlled inputs/selects/textareas. Evidence: prefix-scoped source, scripts, test, checked JSON artifact, and this report exist under the assigned write scope.
- Exact package evidence: generator verifies checked runtime inventory, tarball integrity, and tarball file lists before probing exact `react`, `react-dom`, and `scheduler` packages.
- Controlled/uncontrolled warnings: development server/client warning matrices are asserted; production no-warning behavior is asserted; full console argument tuples are asserted for formatted warnings.
- `value`/`defaultValue`: text input and textarea controlled/default scenarios assert server output, client form state, and update behavior.
- `checked`/`defaultChecked`: checkbox controlled/default scenarios assert client checked/defaultChecked form state and update behavior.
- Select multiple: controlled multiple and default multiple scenarios record option `selected`/`defaultSelected` state; single select update behavior is also covered.
- Textarea children: server serialization and development warning behavior are asserted for children-based textarea content.
- Update behavior where practical: two-phase scenarios cover controlled value updates, default prop updates, controlled/uncontrolled transitions, checkbox updates, select updates, and textarea updates through synchronous `flushSync`.
- Determinism and path normalization: generator records no timestamps, uses isolated child processes, normalizes temporary/package/workspace paths, deletes temporary roots, and the checked artifact has a path leak test.
- Write-scope compliance: `git status --short` shows only the assigned `dom-controlled-input` paths and this worker report.
- Manifest/package constraints: no package metadata, shared conformance helpers, or Fast React implementation files were modified.

## Evidence Gathered

- The oracle has 25 scenarios in 2 probe modes.
- Development warnings observed: 9 server warnings and 13 client warnings.
- Production warnings observed: 0 server warnings and 0 client warnings.
- Targeted test result: `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs` passed 11/11 tests.
- Regeneration result: `node tests/conformance/scripts/generate-dom-controlled-input-oracle.mjs` output byte-matched `tests/conformance/oracles/react-19.2.6-dom-controlled-input-oracle.json`.
- Workspace conformance result: `npm test --workspace @fast-react/conformance` passed 209/209 tests.
- Scoped hygiene checks found no trailing whitespace, no conflict markers, no concrete temp/local path leaks in the checked artifact/report, and no out-of-scope changed files.
- Nested hypothesis testing:
  - Explorer check found no blocking coverage or determinism gaps and noted this progress report needed completion.
  - Explorer check flagged fake-DOM dirty reflection and warning-argument risks. I hardened the fake DOM's input/option dirty reflection and added full warning-argument assertions. Regeneration stayed byte-stable.

## Commands Run

- `git status --short`
- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '1,260p' worker-progress/worker-064-dom-controlled-input-oracle.md`
- `rg --files tests/conformance/src tests/conformance/scripts tests/conformance/test tests/conformance/oracles | rg '(dom-attribute-property|dom-style-dangerous-html|dom-namespace-svg|react-dom-client-root|react-dom-portal|controlled-input)'`
- `find tests/conformance -maxdepth 2 -type f | sort | sed -n '1,220p'`
- `cat tests/conformance/package.json`
- `rg -n "path leak|local path|normalize|oracle" tests/conformance/src tests/conformance/scripts tests/conformance/test | head -n 120`
- `sed -n '1,260p' tests/conformance/src/dom-controlled-input-targets.mjs`
- `sed -n '1,640p' tests/conformance/src/dom-controlled-input-scenarios.mjs`
- `sed -n '1,1220p' tests/conformance/src/dom-controlled-input-probe-runner.mjs`
- `sed -n '1,760p' tests/conformance/src/dom-controlled-input-oracle-generator.mjs`
- `sed -n '1,260p' tests/conformance/src/dom-controlled-input-oracle.mjs`
- `sed -n '1,760p' tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `sed -n '1,220p' tests/conformance/scripts/generate-dom-controlled-input-oracle.mjs`
- `sed -n '1,220p' tests/conformance/scripts/print-dom-controlled-input-oracle.mjs`
- `node -e "const o=require('./tests/conformance/oracles/react-19.2.6-dom-controlled-input-oracle.json'); console.log({kind:o.oracleKind, scenarios:o.scenarios.length, modes:o.probeModes.map(m=>m.id), server:Object.fromEntries(Object.entries(o.serverSerializationObservations).map(([k,v])=>[k,v.length])), client:Object.fromEntries(Object.entries(o.clientFormStateObservations).map(([k,v])=>[k,v.length])), gaps:o.intentionalGaps?.length})"`
- `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `tmpfile="$(mktemp)"; node tests/conformance/scripts/generate-dom-controlled-input-oracle.mjs > "$tmpfile" && cmp -s "$tmpfile" tests/conformance/oracles/react-19.2.6-dom-controlled-input-oracle.json && echo 'dom controlled input oracle regeneration matches checked artifact'; rm -f "$tmpfile"`
- `npm test --workspace @fast-react/conformance`
- `node tests/conformance/scripts/generate-dom-controlled-input-oracle.mjs --write`
- `files=(tests/conformance/oracles/react-19.2.6-dom-controlled-input-oracle.json tests/conformance/scripts/generate-dom-controlled-input-oracle.mjs tests/conformance/scripts/print-dom-controlled-input-oracle.mjs tests/conformance/src/dom-controlled-input-oracle-generator.mjs tests/conformance/src/dom-controlled-input-oracle.mjs tests/conformance/src/dom-controlled-input-probe-runner.mjs tests/conformance/src/dom-controlled-input-scenarios.mjs tests/conformance/src/dom-controlled-input-targets.mjs tests/conformance/test/dom-controlled-input-oracle.test.mjs worker-progress/worker-064-dom-controlled-input-oracle.md); if rg -n '[[:blank:]]+$' "${files[@]}"; then echo 'trailing whitespace found'; exit 1; else echo 'no trailing whitespace in scoped files'; fi`
- `files=(tests/conformance/oracles/react-19.2.6-dom-controlled-input-oracle.json tests/conformance/scripts/generate-dom-controlled-input-oracle.mjs tests/conformance/scripts/print-dom-controlled-input-oracle.mjs tests/conformance/src/dom-controlled-input-oracle-generator.mjs tests/conformance/src/dom-controlled-input-oracle.mjs tests/conformance/src/dom-controlled-input-probe-runner.mjs tests/conformance/src/dom-controlled-input-scenarios.mjs tests/conformance/src/dom-controlled-input-targets.mjs tests/conformance/test/dom-controlled-input-oracle.test.mjs worker-progress/worker-064-dom-controlled-input-oracle.md); if rg -n '^(<<<<<<<|=======|>>>>>>>)' "${files[@]}"; then echo 'conflict marker found'; exit 1; else echo 'no conflict markers in scoped files'; fi`
- Scoped path-leak guard over the checked oracle artifact and progress report. The concrete regex is intentionally omitted here so the report does not embed the sentinel path strings it checks for.
- `bad=0; while read -r flag path; do case "$path" in tests/conformance/src/dom-controlled-input-*.mjs|tests/conformance/scripts/*dom-controlled-input*.mjs|tests/conformance/test/dom-controlled-input-oracle.test.mjs|tests/conformance/oracles/react-19.2.6-dom-controlled-input-oracle.json|worker-progress/worker-064-dom-controlled-input-oracle.md) ;; *) echo "out-of-scope change: $flag $path"; bad=1 ;; esac; done < <(git status --short); if [ "$bad" -ne 0 ]; then exit 1; fi; echo 'git status is limited to worker scope'`

## Intentional Gaps

- Fast React React DOM behavior is not compared in this artifact; conformance claims remain false.
- Client probes execute real React DOM 19.2.6 code, but the target is a deterministic fake DOM focused on form-control property writes and final fake form state. Browser layout, focus, selection, native form reset, autofill, validation, input type sanitization, and real event dispatch are not claimed.
- Scenarios use synchronous `flushSync` for deterministic mount/update observations. Asynchronous scheduling, hydration replay, composition events, and user-initiated input tracking are out of scope.
- Form action APIs, form submission, radio group cross-node behavior, event delegation, hydration, server/static Fizz behavior, and browser-native validation are left to separate oracle tracks.

## Quality Review

- Maintainability: scenario descriptors are declarative and reused by server/client probes; target metadata and artifact path constants are prefix-scoped.
- Performance: generation uses bounded fetch and child-process timeouts; checked tests read the artifact instead of regenerating it.
- Security: downloaded tarballs are integrity checked against the checked inventory; lifecycle scripts are not executed; temporary roots are removed after generation; concrete local paths are normalized before serialization.
- Scope: all edits are under the assigned `dom-controlled-input` conformance paths and this worker report.

## Risks Or Blockers

- No blockers remain.
- Residual risk: fake-DOM final form state is not a browser matrix. Future browser-backed or jsdom-backed form-control oracles should be added before claiming full browser DOM compatibility.

## Recommended Next Tasks

- Use this oracle to drive a future Fast React DOM controlled form implementation slice.
- Add a later browser-backed oracle for user input, selection restoration, native reset/autofill, radio group behavior, and input type sanitization.
