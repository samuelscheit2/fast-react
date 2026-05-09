# worker-049-react-dom-hydration-marker-oracle

## Objective

Add deterministic React DOM hydration marker and mismatch evidence oracle files.

## Goal Tool State

- `create_goal` succeeded for objective: Add deterministic React DOM hydration marker and mismatch evidence oracle files.
- `get_goal` succeeded immediately after setup; active goal status: `active`; active goal objective: Add deterministic React DOM hydration marker and mismatch evidence oracle files.

Write scope honored so far:

- `tests/conformance/src/react-dom-hydration-marker-*.mjs`
- `tests/conformance/scripts/generate-react-dom-hydration-marker-oracle.mjs`
- `tests/conformance/scripts/print-react-dom-hydration-marker-oracle.mjs`
- `tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-dom-hydration-marker-oracle.json`
- `worker-progress/worker-049-react-dom-hydration-marker-oracle.md`

## Progress

- Added deterministic React DOM hydration marker target data, source fingerprints, worker evidence requirements, marker contracts, and mismatch contracts.
- Added an oracle generator that reads the checked runtime inventory, downloads the exact `react-dom@19.2.6` tarball, verifies integrity and file list, validates published bundle snippets, reads workers 033/042/043, fetches React source from commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`, verifies pinned source SHA/line-count fingerprints, and extracts marker/mismatch evidence.
- Added checked-oracle read/stringify/markdown helpers plus generate and print CLIs.
- Added tests for schema, false compatibility claims, worker reconciliation, pinned source fingerprints, marker constants/chunks, inline runtime snippets, published bundle evidence, structured mismatch evidence, local path leaks, and print CLI behavior.
- Regenerated `tests/conformance/oracles/react-19.2.6-react-dom-hydration-marker-oracle.json`; byte-for-byte regeneration is deterministic.

## Nested agent use

Two nested explorer agents were started to test hypotheses:

- Source evidence check: hydration/Fizz marker and mismatch evidence from workers 033, 042, 043 and pinned React DOM/Fizz source.
- Harness pattern check: existing conformance oracle patterns and likely pitfalls in the partial worker files.

Results:

- Harness explorer confirmed the files follow local oracle patterns, the generator/print CLIs are deterministic, path leak handling is clean, and the new test passed.
- Source explorer confirmed the source/package target evidence is pinned and the marker claims look correct. It found two hardening gaps: source fingerprints were computed but not validated against fixed expected values, and two extracted mismatch booleans were only asserted by tests after generation. Both were fixed in the generator and tests. It also noted that regeneration is network-bound because it fetches npm and GitHub pinned sources; this matches existing source/tarball oracle style.

## Completion Audit

Objective restated as deliverables:

- Add deterministic React DOM hydration marker and mismatch evidence oracle source files, scripts, checked JSON artifact, test, and worker progress report.
- Use workers 033, 042, and 043 plus pinned React DOM/Fizz source evidence.
- Keep the work to marker/mismatch evidence and contracts, with no hydration or DOM implementation.
- Prove regeneration determinism, run the new test and full conformance workspace, and check local path leaks, trailing whitespace, and scoped diff/status.

Prompt-to-artifact checklist:

- `tests/conformance/src/react-dom-hydration-marker-*.mjs`: added target constants, generator, and checked-oracle helpers.
- `tests/conformance/scripts/generate-react-dom-hydration-marker-oracle.mjs`: added generator CLI with stdout default and `--write`.
- `tests/conformance/scripts/print-react-dom-hydration-marker-oracle.mjs`: added JSON/Markdown checked-artifact printer.
- `tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`: added 8 tests covering schema, claims, worker/source evidence, markers, mismatch evidence, path leaks, and print CLI behavior.
- `tests/conformance/oracles/react-19.2.6-react-dom-hydration-marker-oracle.json`: generated checked oracle artifact. Current SHA-256 from deterministic regeneration: `d3acf303be1c0b2c3bfb332dd79afe9d5bd1b1c0d61bb3ee7c5204cfedd13c62`.
- `worker-progress/worker-049-react-dom-hydration-marker-oracle.md`: this report.
- Workers 033/042/043: generator reads all three reports, validates required phrases, stores report SHA-256 values/evidence lines, and records the worker 042/043 reconciliation contract.
- Pinned React DOM/Fizz source evidence: generator fetches four React source files from commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401` and validates fixed SHA-256/line-count fingerprints before extracting evidence.
- Marker/mismatch contracts only: oracle keeps `realReactDomRuntimeBehaviorProbed`, `fastReactComparedToReactDom`, `fastReactHydrationCompatible`, `fullDualRunOracleExists`, and `compatibilityClaimed` false; no package, DOM, hydration, smoke, root metadata, or implementation files were modified.
- Determinism: two no-write generations matched each other and the checked artifact by `cmp`; both had SHA-256 `d3acf303be1c0b2c3bfb332dd79afe9d5bd1b1c0d61bb3ee7c5204cfedd13c62`.
- Verification: new test passed 8/8; full `npm test --workspace @fast-react/conformance` passed 141/141.
- Hygiene: scoped local path leak scan passed, scoped trailing whitespace scan passed, scoped no-index `git diff --check` passed, and `git status --short` lists only assigned write-scope files.

## Commands run

```sh
pwd && rg --files -g 'WORKER_BRIEF.md' -g 'MASTER_PLAN.md' -g 'MASTER_PROGRESS.md' -g 'worker-progress/worker-049-react-dom-hydration-marker-oracle.md'
git status --short
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,240p' worker-progress/worker-049-react-dom-hydration-marker-oracle.md
sed -n '1,260p' tests/conformance/src/react-dom-hydration-marker-oracle-generator.mjs
sed -n '261,620p' tests/conformance/src/react-dom-hydration-marker-oracle-generator.mjs
sed -n '621,980p' tests/conformance/src/react-dom-hydration-marker-oracle-generator.mjs
sed -n '1,260p' tests/conformance/src/react-dom-hydration-marker-targets.mjs
sed -n '261,620p' tests/conformance/src/react-dom-hydration-marker-targets.mjs
sed -n '1,260p' tests/conformance/src/react-dom-hydration-marker-oracle.mjs
sed -n '1,260p' tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs
sed -n '261,560p' tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs
sed -n '1,180p' tests/conformance/scripts/generate-react-dom-hydration-marker-oracle.mjs
sed -n '1,200p' tests/conformance/scripts/print-react-dom-hydration-marker-oracle.mjs
wc -l tests/conformance/oracles/react-19.2.6-react-dom-hydration-marker-oracle.json
sed -n '1,260p' tests/conformance/src/react-dom-export-oracle-generator.mjs
sed -n '1,220p' tests/conformance/src/react-dom-export-oracle.mjs
sed -n '1,220p' tests/conformance/test/react-dom-export-oracle.test.mjs
sed -n '1,220p' tests/conformance/package.json
sed -n '1,160p' tests/conformance/scripts/generate-react-dom-export-oracle.mjs
sed -n '1,160p' tests/conformance/scripts/print-react-dom-export-oracle.mjs
sed -n '220,520p' tests/conformance/test/react-dom-export-oracle.test.mjs
sed -n '1,260p' worker-progress/worker-033-react-dom-inventory.md
sed -n '1,320p' worker-progress/worker-042-react-dom-server-fizz-plan.md
sed -n '1,340p' worker-progress/worker-043-react-dom-hydration-plan.md
sed -n '1,220p' tests/conformance/src/scheduler-root-oracle.mjs
sed -n '1,160p' tests/conformance/scripts/generate-scheduler-root-oracle.mjs
sed -n '1,240p' tests/conformance/test/scheduler-root-oracle.test.mjs
node scripts/generate-react-dom-hydration-marker-oracle.mjs --write
node --test test/react-dom-hydration-marker-oracle.test.mjs
npm test --workspace @fast-react/conformance
node scripts/generate-react-dom-hydration-marker-oracle.mjs > <temp-oracle-a.json>
node scripts/generate-react-dom-hydration-marker-oracle.mjs > <temp-oracle-b.json>
cmp <temp-oracle-a.json> <temp-oracle-b.json>
cmp <temp-oracle-a.json> oracles/react-19.2.6-react-dom-hydration-marker-oracle.json
shasum -a 256 <temp-oracle-a.json> oracles/react-19.2.6-react-dom-hydration-marker-oracle.json
node -e '...' # scoped local path leak scan
node -e '...' # scoped trailing whitespace scan
git diff --check --no-index /dev/null <each scoped file>
git status --short && git ls-files --others --exclude-standard
rm -f <temp-oracle-a.json> <temp-oracle-b.json>
```

## Verification

- `node scripts/generate-react-dom-hydration-marker-oracle.mjs --write` passed.
- `node --test test/react-dom-hydration-marker-oracle.test.mjs` passed: 8 tests, 8 pass.
- `npm test --workspace @fast-react/conformance` passed: 141 tests, 141 pass. npm emitted the pre-existing warning about unknown user config `minimum-release-age`.
- Determinism passed: two no-write generations matched each other and the checked artifact by `cmp`; SHA-256 `d3acf303be1c0b2c3bfb332dd79afe9d5bd1b1c0d61bb3ee7c5204cfedd13c62`.
- Local path leak scan passed for the local home directory pattern, macOS private temp patterns, generic temp paths, and the oracle temp-prefix pattern.
- Scoped trailing whitespace scan passed.
- Scoped no-index `git diff --check` passed for every changed/untracked file.
- Scoped status is clean except assigned write-scope files.

## Changed Files

- `tests/conformance/src/react-dom-hydration-marker-targets.mjs`
- `tests/conformance/src/react-dom-hydration-marker-oracle-generator.mjs`
- `tests/conformance/src/react-dom-hydration-marker-oracle.mjs`
- `tests/conformance/scripts/generate-react-dom-hydration-marker-oracle.mjs`
- `tests/conformance/scripts/print-react-dom-hydration-marker-oracle.mjs`
- `tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-dom-hydration-marker-oracle.json`
- `worker-progress/worker-049-react-dom-hydration-marker-oracle.md`

## Evidence Gathered

- React DOM package target: `react-dom@19.2.6`, exact tarball URL and integrity from checked runtime inventory.
- React source target: `facebook/react` tag `v19.2.6`, commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`.
- Source files covered: `ReactFiberConfigDOM.js`, `ReactFizzConfigDOM.js`, `ReactFiberHydrationContext.js`, and `ReactDOMFizzInstructionSetInlineCodeStrings.js`.
- Marker coverage includes Activity, Suspense start/end/pending/queued/client-rendered, form state `F!`/`F`, preamble contribution markers, segment placeholders, and external runtime templates for complete segment/boundary/client render.
- Mismatch coverage includes fatal HTML mismatch, fatal text mismatch, internal hydration mismatch sentinel, recoverable error queueing, dev successful-hydration warning, `suppressHydrationWarning` text diff suppression, and form marker mismatch fallthrough.

## Risks or Blockers

- No blocker remains for this worker scope.
- Regeneration requires network access to npm and GitHub pinned URLs.
- This is a source/package evidence oracle, not a runtime DOM hydration dual-run oracle. Fast React hydration compatibility remains deliberately false.

## Recommended Next Tasks

- Add future runtime fixture oracles once a DOM/hydration harness exists.
- Use these marker and mismatch contracts when implementing Fizz marker emission and client hydration marker parsing.
- Keep mismatch evidence structured in future implementation work so recoverable errors, dev warnings, and internal sentinels do not collapse into console-string behavior.
