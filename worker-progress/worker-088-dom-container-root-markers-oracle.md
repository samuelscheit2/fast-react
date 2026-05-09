# worker-088-dom-container-root-markers-oracle

## Summary

Added a deterministic React DOM 19.2.6 oracle for `createRoot` container validation and root marker behavior. The oracle uses the checked runtime inventory, downloads and verifies the exact `react-dom`, `react`, and `scheduler` npm tarballs, extracts them into an isolated temporary `node_modules`, and probes `react-dom/client` in one child process per mode.

The probe uses a deterministic minimal DOM host rather than jsdom or a browser. That host implements only the DOM surface needed for this slice: container node types, owner document/window globals, listener registration compatibility, marker-property inspection, basic tree mutation hooks, and console capture. This keeps the artifact reproducible while still exercising the published React DOM runtime. Browser layout, parser, selection, custom elements, delegated listener details, render commits, and hydration remain intentional gaps for separate oracle tracks.

The checked artifact covers:

- valid `createRoot` containers: element, document, and document fragment
- invalid containers: `null`, `undefined`, plain object, text node, mount-point comment, and other comment
- development vs production invalid-container messages
- development-only duplicate `createRoot` and legacy `_reactRootContainer` warnings
- private root marker presence summarized without serializing randomized suffixes
- marker cleanup after empty-root `unmount()` and clean recreate behavior
- no DOM child mutation during `createRoot` before any `root.render`

No Fast React behavior compatibility is claimed. The oracle records pinned React DOM behavior only.

## Changed Files

- `tests/conformance/src/react-dom-container-root-markers-targets.mjs`
- `tests/conformance/src/react-dom-container-root-markers-oracle.mjs`
- `tests/conformance/src/react-dom-container-root-markers-oracle-generator.mjs`
- `tests/conformance/src/react-dom-container-root-markers-probe-runner.mjs`
- `tests/conformance/scripts/generate-react-dom-container-root-markers-oracle.mjs`
- `tests/conformance/scripts/print-react-dom-container-root-markers-oracle.mjs`
- `tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-dom-container-root-markers-oracle.json`
- `worker-progress/worker-088-dom-container-root-markers-oracle.md`

Write scope was honored. No `worker-046` `react-dom-client-root-*` files were touched.

## Evidence Gathered

- `create_goal` was set for the exact worker objective before any repo reads, implementation inspection, or verification.
- `get_goal` was available immediately after goal setup and reported objective `Add deterministic React DOM container validation and root marker oracle files.` with status `active`.
- Required context files were read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, `worker-progress/worker-033-react-dom-inventory.md`, `worker-progress/worker-044-react-dom-client-roots-plan.md`, and `worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`.
- Existing scoped untracked files were preserved and inspected rather than reverted.
- The oracle generator verifies tarball integrity against the checked runtime inventory and byte-compares tarball file lists before probing.
- The checked oracle omits local temporary roots, workspace paths, package-root absolute paths, and randomized `__reactContainer$...` suffixes.
- Nested read-only agents were spawned to test two hypotheses and both completed:
  - The React DOM marker-behavior agent confirmed the deterministic minimal DOM probe captures the intended React DOM 19.2.6 behavior, including accepted node types, invalid-container errors, development-only duplicate-root diagnostics, randomized marker suffixes, unmount marker nulling, recreate-without-warning, and no child mutation during `createRoot`.
  - The conformance-pattern agent confirmed the file set and architecture match existing oracle conventions and avoid worker 046 `react-dom-client-root-*` ownership and worker 089 listener-installation ownership.

## Commands Run

```sh
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,240p' MASTER_PLAN.md
sed -n '1,240p' MASTER_PROGRESS.md
sed -n '1,240p' worker-progress/worker-033-react-dom-inventory.md
sed -n '1,260p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '1,260p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
git status --short
sed -n '1,260p' tests/conformance/src/react-dom-container-root-markers-oracle.mjs
sed -n '1,320p' tests/conformance/src/react-dom-container-root-markers-oracle-generator.mjs
sed -n '1,320p' tests/conformance/src/react-dom-container-root-markers-probe-runner.mjs
sed -n '1,260p' tests/conformance/src/react-dom-container-root-markers-targets.mjs
sed -n '1,260p' tests/conformance/scripts/generate-react-dom-container-root-markers-oracle.mjs
sed -n '1,260p' tests/conformance/scripts/print-react-dom-container-root-markers-oracle.mjs
sed -n '1,320p' tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs
sed -n '1,220p' tests/conformance/oracles/react-19.2.6-react-dom-container-root-markers-oracle.json
sed -n '240,560p' tests/conformance/src/react-dom-container-root-markers-oracle-generator.mjs
sed -n '240,620p' tests/conformance/src/react-dom-container-root-markers-probe-runner.mjs
sed -n '620,1040p' tests/conformance/src/react-dom-container-root-markers-probe-runner.mjs
sed -n '220,520p' tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs
rg -n "byte|regener|generate.*oracle|--write|diff|print.*oracle|path leak|local path" tests/conformance/test tests/conformance/scripts tests/conformance/src -g '*oracle*.mjs'
rg --files tests/conformance
sed -n '1,220p' tests/conformance/package.json
sed -n '1,120p' package.json
sed -n '1,120p' tests/conformance/src/react-dom-portal-probe-runner.mjs
sed -n '1,180p' tests/conformance/src/react-dom-portal-oracle-generator.mjs
sed -n '1,120p' tests/conformance/test/react-dom-portal-oracle.test.mjs
find tests/conformance -maxdepth 2 -type f -name '*react-dom-client-root*' -print
node --test tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs
node --input-type=module -e 'import { generateReactDomContainerRootMarkersOracle } from "./tests/conformance/src/react-dom-container-root-markers-oracle-generator.mjs"; import { readCheckedReactDomContainerRootMarkersOracleText, stringifyReactDomContainerRootMarkersOracle } from "./tests/conformance/src/react-dom-container-root-markers-oracle.mjs"; const generated = stringifyReactDomContainerRootMarkersOracle(await generateReactDomContainerRootMarkersOracle()); const checked = readCheckedReactDomContainerRootMarkersOracleText(); if (generated !== checked) { console.error("Generated React DOM container root markers oracle differs from checked artifact"); process.exit(1); }'
rg -n '<local-path and randomized-root-marker leak pattern>' tests/conformance/oracles/react-19.2.6-react-dom-container-root-markers-oracle.json worker-progress/worker-088-dom-container-root-markers-oracle.md
perl -ne 'print "$ARGV:$.: trailing whitespace\n" if /[ \t]$/' tests/conformance/src/react-dom-container-root-markers-*.mjs tests/conformance/scripts/*react-dom-container-root-markers*.mjs tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs tests/conformance/oracles/react-19.2.6-react-dom-container-root-markers-oracle.json worker-progress/worker-088-dom-container-root-markers-oracle.md
git diff --check
for f in tests/conformance/src/react-dom-container-root-markers-*.mjs tests/conformance/scripts/*react-dom-container-root-markers*.mjs tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs tests/conformance/oracles/react-19.2.6-react-dom-container-root-markers-oracle.json worker-progress/worker-088-dom-container-root-markers-oracle.md; do out=$(git diff --check --no-index /dev/null "$f" 2>&1 || true); if [ -n "$out" ]; then printf '%s\n' "$out"; exit 1; fi; done
git status --short -- tests/conformance/src/react-dom-container-root-markers-oracle-generator.mjs tests/conformance/src/react-dom-container-root-markers-oracle.mjs tests/conformance/src/react-dom-container-root-markers-probe-runner.mjs tests/conformance/src/react-dom-container-root-markers-targets.mjs tests/conformance/scripts/generate-react-dom-container-root-markers-oracle.mjs tests/conformance/scripts/print-react-dom-container-root-markers-oracle.mjs tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs tests/conformance/oracles/react-19.2.6-react-dom-container-root-markers-oracle.json worker-progress/worker-088-dom-container-root-markers-oracle.md
```

## Verification

- `node --test tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs` passed: 9 tests.
- Generator byte-compare passed: regenerated oracle text matched the checked JSON exactly.
- Local path/randomized-marker leak scan on the oracle artifact and worker report returned no matches.
- Trailing whitespace scan across all scoped files returned no matches.
- `git diff --check` passed.
- Per-file `git diff --check --no-index` across all new untracked scoped files passed, covering the gap that plain `git diff --check` does not inspect untracked files.
- `find tests/conformance -maxdepth 2 -type f -name '*react-dom-client-root*' -print` returned no files, confirming this worker did not introduce worker 046 file names.

## Completion Audit

Objective restated: add deterministic React DOM container validation and root marker oracle files that record React DOM 19.2.6 behavior without claiming Fast React compatibility.

Prompt-to-artifact checklist:

- Write scope: exactly the `react-dom-container-root-markers-*` source, script, test, JSON oracle, and worker report files are untracked as this worker's scoped diff. No files outside the allowed prefixes were changed.
- Required setup: `create_goal` was called first, `get_goal` reported the exact objective with status `active`, and the required context files were read after goal setup. `ORCHESTRATOR.md` was not read.
- Required probes: the checked test asserts accepted containers, rejected containers, development/production invalid-container errors, duplicate-root warnings, legacy-root warning distinction, summarized root marker side effects, unmount marker cleanup, recreate-without-warning, and no `createRoot` child mutation before render.
- Deterministic evidence choice: the generator documents and uses exact npm tarballs from the checked runtime inventory plus a deterministic minimal DOM host. It verifies integrity and tarball file lists before running React DOM.
- Marker determinism: raw randomized `__reactContainer$...` suffixes are never serialized; marker evidence is summarized by prefix/count/value state.
- No worker 046 overlap: no `react-dom-client-root-*` files exist in this worktree; this worker uses only `react-dom-container-root-markers-*` names.
- Verification gates: targeted `node --test`, oracle regeneration byte-compare, local path/random-marker leak scan, trailing whitespace scan, plain `git diff --check`, and no-index diff checks for untracked files all passed.

No missing or weakly verified prompt requirement remains.

## Risks Or Blockers

- The minimal DOM host is intentionally narrow. It is strong evidence for `createRoot` validation, marker side effects, duplicate-root warnings, empty-root unmount cleanup, and no pre-render child mutation, but it is not evidence for delegated listener registration details, real browser event dispatch, hydration, or commit-time DOM mutation.
- The oracle summarizes private root-marker properties because the randomized suffix is intentionally nondeterministic. It captures public duplicate-root warning behavior to anchor the marker side effects.
- `root.unmount()` on an empty element container records a `textContent = ""` mutation. This is expected React DOM behavior in the probe and is scoped to unmount cleanup, not `createRoot` pre-render mutation.

## Recommended Next Tasks

- Keep worker 089 responsible for exact root and portal listener installation behavior.
- Use this oracle as input for the future DOM adapter root-marker implementation slice, alongside worker 090 node-map planning and worker 092 create-root facade planning.
- Add a Fast React dual-run comparison only after Fast React has a real DOM container marker layer; this worker intentionally does not claim that compatibility.
