# worker-085-react-test-renderer-serialization-oracle

## Objective

Add deterministic React 19.2.6 `react-test-renderer` serialization oracle
files for `toJSON`, `toTree`, and `TestInstance` query behavior.

Continuation objective for this refresh:

`Refresh react-test-renderer serialization oracle report with create_goal evidence and current verification.`

Current goal evidence:

- `create_goal` was called before file reads or commands with objective
  `Refresh react-test-renderer serialization oracle report with create_goal evidence and current verification.`
- `get_goal` immediately after setup returned status `active` and the same
  objective.
- `ORCHESTRATOR.md` was not read.

Write scope honored for this refresh: only this progress report changed. The
existing worker 085 serialization oracle files were inspected and verified, but
not edited because no real issue was found.

## Summary

- Refreshed this report with current policy evidence from `create_goal` and
  `get_goal`.
- Re-verified the existing worker 085 oracle files without broadening the
  implementation.
- Confirmed the scoped oracle still provides deterministic, exact-tarball
  React 19.2.6 `react-test-renderer` evidence for `toJSON`, `toTree`, and
  `TestInstance` query behavior.
- Confirmed local Fast React comparison remains explicitly out of scope because
  no JS `@fast-react/react-test-renderer` package is present.

## Changed Files

- `worker-progress/worker-085-react-test-renderer-serialization-oracle.md`

Existing scoped oracle files verified but not changed:

- `tests/conformance/src/react-test-renderer-serialization-targets.mjs`
- `tests/conformance/src/react-test-renderer-serialization-scenarios.mjs`
- `tests/conformance/src/react-test-renderer-serialization-probe-runner.mjs`
- `tests/conformance/src/react-test-renderer-serialization-oracle-generator.mjs`
- `tests/conformance/src/react-test-renderer-serialization-oracle.mjs`
- `tests/conformance/scripts/generate-react-test-renderer-serialization-oracle.mjs`
- `tests/conformance/scripts/print-react-test-renderer-serialization-oracle.mjs`
- `tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-test-renderer-serialization-oracle.json`

## Evidence Gathered

- `git status --short` shows only scoped worker 085 oracle/report files plus
  `.worker-logs/` as untracked. No tracked or staged implementation diff exists.
- The oracle target metadata pins:
  `react-test-renderer@19.2.6`, `react@19.2.6`,
  `scheduler@0.27.0`, and `react-is@19.2.6` with exact tarball URLs and
  integrity hashes.
- The scenario inventory contains seven scenarios across host serialization,
  text roots, empty roots, array roots, hidden `React.Activity`, composite
  `toTree`, and `TestInstance` find/findAll basics.
- The checked JSON artifact has schema version 1, two probe modes, seven
  scenarios, and seven observations per mode.
- The oracle generator records no timestamps, no lifecycle script execution, no
  root manifest or lockfile mutation, one child process per scenario/mode, and
  path normalization for temp/workspace roots.
- The checked tests assert explicit false Fast React compatibility claims and
  explicit local status `not-present-in-workspace`.

## Delegated Hypothesis Check

Nested read-only subagent `019e0f08-0145-7a62-a922-085f5a691cbd` tested the
hypothesis that only the report needed updating. It did not edit, stage, remove,
or clean files.

Subagent result:

- Confirmed active goal status/objective matched this refresh objective.
- Identified the same scoped worker 085 oracle/report files from `git status`.
- `node --test tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs`:
  passed, 10/10.
- `npm test --workspace @fast-react/conformance`: passed, 251/251, with only
  npm's `minimum-release-age` config warning.
- Scoped trailing whitespace, conflict-marker, local-path, tracked
  `git diff --check`, and untracked `git diff --check --no-index` checks passed.
- Found no real issue requiring implementation edits.

## Commands Run

```sh
create_goal
get_goal
sed -n '1,220p' WORKER_BRIEF.md
git status --short
sed -n '1,260p' worker-progress/worker-085-react-test-renderer-serialization-oracle.md
rg --files | rg 'react-test-renderer-serialization-oracle|worker-085|serialization-oracle|react-test-renderer'
sed -n '1,260p' docs/tasks/worker-085-react-test-renderer-serialization-oracle.prompt.md
sed -n '1,260p' tests/conformance/src/react-test-renderer-serialization-targets.mjs
sed -n '1,320p' tests/conformance/src/react-test-renderer-serialization-scenarios.mjs
sed -n '1,260p' tests/conformance/src/react-test-renderer-serialization-oracle.mjs
sed -n '1,760p' tests/conformance/src/react-test-renderer-serialization-probe-runner.mjs
sed -n '1,760p' tests/conformance/src/react-test-renderer-serialization-oracle-generator.mjs
sed -n '1,700p' tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs
sed -n '1,220p' tests/conformance/scripts/generate-react-test-renderer-serialization-oracle.mjs
sed -n '1,260p' tests/conformance/scripts/print-react-test-renderer-serialization-oracle.mjs
node -e "const f='tests/conformance/oracles/react-19.2.6-react-test-renderer-serialization-oracle.json'; const o=require('fs').readFileSync(f,'utf8'); const j=JSON.parse(o); console.log({schemaVersion:j.schemaVersion, oracleKind:j.oracleKind, modes:j.probeModes.length, scenarios:j.scenarios.length, obs:Object.fromEntries(Object.entries(j.observations).map(([k,v])=>[k,v.length])), bytes:o.length});"
node --test tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs
npm test --workspace @fast-react/conformance
rg -n '[[:blank:]]$' <scoped worker 085 files>
rg -n '^(<<<<<<<|=======|>>>>>>>)' <scoped worker 085 files>
rg -n '<local/temp path leak patterns>' <scoped worker 085 files>
git diff --check --no-index /dev/null tests/conformance/src/react-test-renderer-serialization-targets.mjs
git diff --check -- <tracked scoped files>
git diff --check --no-index /dev/null <untracked scoped file>
```

## Verification Results

- `node --test tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs`:
  passed, 10 tests.
- `npm test --workspace @fast-react/conformance`: passed, 251 tests. The only
  warning was npm's unknown user config `minimum-release-age`.
- Scoped trailing whitespace check over the worker 085 oracle files and report:
  passed, no matches.
- Scoped conflict-marker check over the worker 085 oracle files and report:
  passed, no matches.
- Scoped local-path/temp-path leak check over the worker 085 oracle files and
  report: passed, no matches.
- Scoped `git diff --check` for tracked files and `git diff --check --no-index`
  for untracked worker 085 files: passed, no whitespace/error output.
- A calibration run confirmed `git diff --check --no-index /dev/null <new-file>`
  returns exit code 1 for normal new-file differences even when it emits no
  whitespace/error output; the scoped no-index check therefore treated any
  non-empty output as failure.

## Completion Audit

Success criteria for this refresh:

- Goal setup uses the exact refresh objective before file reads or commands.
- `get_goal` evidence records active status and objective.
- `WORKER_BRIEF.md` is read after goal setup, and `ORCHESTRATOR.md` is not read.
- Implementation scope is not broadened; only the report is updated unless
  verification exposes a real issue.
- Required targeted test passes.
- Required full conformance workspace test passes.
- Scoped trailing whitespace, conflict-marker, local-path, and `git diff --check`
  gates cover the worker 085 oracle files, including untracked files.
- Report includes changed files, commands, results, risks, and goal evidence.

Prompt-to-artifact checklist:

- Goal evidence: satisfied by `create_goal` and `get_goal`; active objective
  recorded above exactly as requested.
- Read-order policy: satisfied; `WORKER_BRIEF.md` was read after goal setup,
  and no command opened `ORCHESTRATOR.md`.
- Write scope: satisfied; this refresh changed only this report. Existing oracle
  files were not edited because both local and delegated verification found no
  issue.
- Oracle file scope: satisfied; the scoped files listed under Changed Files are
  the worker 085 serialization oracle files discovered from status and file
  search.
- Targeted test: satisfied; 10/10 tests passed.
- Full conformance test: satisfied; 251/251 tests passed.
- Hygiene checks: satisfied; scoped trailing whitespace, conflict-marker,
  local-path, tracked `git diff --check`, and untracked no-index checks passed.
- Delegated hypothesis testing: satisfied; the read-only subagent independently
  verified the same hypothesis and found no implementation issue.
- Report deliverables: satisfied; this report records summary, changed files,
  commands, evidence, verification results, risks/blockers, recommended next
  tasks, and goal evidence.

No missing or weakly verified refresh requirement remains after this audit.

## Risks Or Blockers

- This remains a React oracle only. There is still no local JS
  `@fast-react/react-test-renderer` package to compare against, so Fast React
  compatibility remains unclaimed by design.
- Future React target updates may change hidden `React.Activity` serialization
  or public `toTree()` error behavior; this artifact is intentionally pinned to
  React 19.2.6.
- Production probes rely on public `unstable_flushSync` because production
  `react-test-renderer` does not expose callable `act`; this is documented in
  the oracle metadata.

## Recommended Next Tasks

1. Add a JS `@fast-react/react-test-renderer` facade only after the reconciler
   root/update/serialization implementation exists.
2. Use this oracle to gate future serializer implementation for hidden output,
   props-without-children JSON, composite `toTree`, and `TestInstance` query
   semantics.
3. Keep lifecycle, `act` scheduling, and public error-surface behavior in their
   dedicated react-test-renderer oracle workers rather than expanding this
   serialization artifact.
