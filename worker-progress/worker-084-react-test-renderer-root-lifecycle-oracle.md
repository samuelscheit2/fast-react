# worker-084-react-test-renderer-root-lifecycle-oracle

## Objective

Add deterministic react-test-renderer create/update/unmount root lifecycle oracle files.

## Goal tool status

- `create_goal` was available and was called before file reads or verification.
- `get_goal` was available immediately after goal setup.
- Active goal objective recorded from `get_goal`: `Add deterministic react-test-renderer create/update/unmount root lifecycle oracle files.`
- Active goal status recorded from `get_goal`: `active`

## Summary

Added a deterministic React Test Renderer 19.2.6 root lifecycle oracle covering
`create()`, `update()`, `unmount()`, `getInstance()`, `.root` access,
`createNodeMock`, strict/concurrent options, React Native test environment
diagnostics, production act absence, and post-unmount behavior.

The oracle is generated from the checked React 19.2.6 runtime inventory plus
exact npm tarballs for `react-test-renderer@19.2.6`, `react@19.2.6`,
`scheduler@0.27.0`, and `react-is@19.2.6`. It keeps Fast React compatibility
claims explicitly false because this worker records pinned upstream behavior
only.

Write scope honored: only `tests/conformance/src/react-test-renderer-root-lifecycle-*.mjs`,
`tests/conformance/scripts/*react-test-renderer-root-lifecycle*.mjs`,
`tests/conformance/test/react-test-renderer-root-lifecycle-oracle.test.mjs`,
`tests/conformance/oracles/react-19.2.6-react-test-renderer-root-lifecycle-oracle.json`,
and this progress report were changed. `ORCHESTRATOR.md` was not read.

## Changed files

- `tests/conformance/src/react-test-renderer-root-lifecycle-targets.mjs`
- `tests/conformance/src/react-test-renderer-root-lifecycle-scenarios.mjs`
- `tests/conformance/src/react-test-renderer-root-lifecycle-probe-runner.mjs`
- `tests/conformance/src/react-test-renderer-root-lifecycle-oracle-generator.mjs`
- `tests/conformance/src/react-test-renderer-root-lifecycle-oracle.mjs`
- `tests/conformance/scripts/generate-react-test-renderer-root-lifecycle-oracle.mjs`
- `tests/conformance/scripts/print-react-test-renderer-root-lifecycle-oracle.mjs`
- `tests/conformance/test/react-test-renderer-root-lifecycle-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-test-renderer-root-lifecycle-oracle.json`
- `worker-progress/worker-084-react-test-renderer-root-lifecycle-oracle.md`

No shared package manifest was edited. The existing conformance `test/*.test.mjs`
glob exercises the new test, and the generator/print CLIs are runnable directly.

## Prompt-to-artifact completion audit

| Requirement | Evidence |
| --- | --- |
| Add deterministic oracle files | Generator omits timestamps, normalizes temp/workspace paths, isolates one Node child process per scenario/mode, and regenerates byte-for-byte against the checked artifact. |
| Cover `create()` | `raw-create-act-boundary`, `create-update-unmount-flow`, root boundary, instance, mock, and options scenarios call `TestRenderer.create()`. |
| Cover `update()` | `create-update-unmount-flow` records update replacement, and `create-node-mock-ref-lifecycle` records same-type and type-change updates. |
| Cover `unmount()` | `create-update-unmount-flow` and `create-node-mock-ref-lifecycle` record unmount behavior. |
| Cover `getInstance()` | `get-instance-boundaries` records host, function, and class roots; post-unmount and createNodeMock scenarios also record `getInstance()`. |
| Cover `.root` access | `root-access-boundaries`, raw create act-boundary, normal flow, and post-unmount checks record `.root` success and errors. |
| Cover `createNodeMock` | `create-node-mock-ref-lifecycle` records element argument shape, returned mock identity, ref attachment/detachment, and host public instances. |
| Cover strict/concurrent options | `strict-and-concurrent-options` records `unstable_strictMode`, `unstable_isConcurrent`, omitted/false/true concurrent options, and React Native test environment branch. |
| Cover post-unmount errors | `create-update-unmount-flow` records post-unmount `.root` error, `getInstance()` null, idempotent `update()`, and idempotent `unmount()`. |
| Keep scenarios deterministic and independent of implementation workers | Probes run exact upstream tarballs in temp `node_modules`; no Fast React package is loaded or compared. |
| Do not edit shared package manifests unless necessary | No manifest edits were made; direct script commands and conformance test glob cover the workflow. |
| Targeted `node --test` | `node --test tests/conformance/test/react-test-renderer-root-lifecycle-oracle.test.mjs` passed, 10/10. |
| Scoped local path leak checks | Oracle test path guard passed; manual scoped `rg` for local/temp paths in touched conformance files returned no matches. Final post-report scoped leak check is recorded below. |
| Trailing whitespace checks | Final scoped trailing whitespace check is recorded below. |
| `git diff --check` | Final scoped diff check is recorded below. |
| Record progress report | This file records summary, files, commands, evidence, risks/blockers, and follow-ups. |

## Evidence gathered

- The checked artifact has 2 probe modes:
  - `default-node-development`
  - `default-node-production`
- The checked artifact has 7 scenarios and 14 total observations:
  - `renderer-object-shape`
  - `raw-create-act-boundary`
  - `create-update-unmount-flow`
  - `root-access-boundaries`
  - `get-instance-boundaries`
  - `create-node-mock-ref-lifecycle`
  - `strict-and-concurrent-options`
- Checked package versions:
  - `react-test-renderer@19.2.6`
  - `react@19.2.6`
  - `scheduler@0.27.0`
  - `react-is@19.2.6`
- Checked oracle SHA-256:
  `fe47da8ea41e15d6ed267a74f1a82de948ac9d682b3b1959bebc2ed0456fccf0`
- Conformance claims remain false for Fast React:
  - `fastReactComparedToReactTestRenderer: false`
  - `fastReactBehaviorCompatible: false`
  - `fullDualRunOracleExists: false`
  - `compatibilityClaimed: false`

## Commands run

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-017-runtime-inventory-generation.md
sed -n '1,260p' worker-progress/worker-073-test-renderer-update-model-plan.md
if [ -f worker-progress/worker-083-react-test-renderer-export-oracle.md ]; then sed -n '1,260p' worker-progress/worker-083-react-test-renderer-export-oracle.md; else printf 'MISSING\n'; fi
git status --short
rg --files tests/conformance | rg 'react-test-renderer|react-dom-client-root|react-dom-portal|scheduler-root'
sed -n '1,260p' tests/conformance/src/react-test-renderer-root-lifecycle-targets.mjs
sed -n '1,280p' tests/conformance/src/react-test-renderer-root-lifecycle-scenarios.mjs
sed -n '1,320p' tests/conformance/src/react-test-renderer-root-lifecycle-probe-runner.mjs
sed -n '321,760p' tests/conformance/src/react-test-renderer-root-lifecycle-oracle-generator.mjs
sed -n '1,280p' tests/conformance/test/react-test-renderer-root-lifecycle-oracle.test.mjs
sed -n '1,220p' tests/conformance/src/react-test-renderer-root-lifecycle-oracle.mjs
node --test tests/conformance/test/react-test-renderer-root-lifecycle-oracle.test.mjs
tmp=$(mktemp) && node tests/conformance/scripts/generate-react-test-renderer-root-lifecycle-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-react-test-renderer-root-lifecycle-oracle.json "$tmp" && rm "$tmp"
scoped local/temp path leak guard over touched source, script, test, oracle, and report files
wc -l tests/conformance/src/react-test-renderer-root-lifecycle-targets.mjs tests/conformance/src/react-test-renderer-root-lifecycle-scenarios.mjs tests/conformance/src/react-test-renderer-root-lifecycle-probe-runner.mjs tests/conformance/src/react-test-renderer-root-lifecycle-oracle-generator.mjs tests/conformance/src/react-test-renderer-root-lifecycle-oracle.mjs tests/conformance/scripts/generate-react-test-renderer-root-lifecycle-oracle.mjs tests/conformance/scripts/print-react-test-renderer-root-lifecycle-oracle.mjs tests/conformance/test/react-test-renderer-root-lifecycle-oracle.test.mjs tests/conformance/oracles/react-19.2.6-react-test-renderer-root-lifecycle-oracle.json
node tests/conformance/scripts/print-react-test-renderer-root-lifecycle-oracle.mjs --format=markdown
npm test --workspace @fast-react/conformance
shasum -a 256 tests/conformance/oracles/react-19.2.6-react-test-renderer-root-lifecycle-oracle.json
scoped trailing whitespace guard over touched source, script, test, oracle, and report files
git add -N -- <scoped files> && git diff --check -- <scoped files> && git reset -q -- <scoped files>
node completion audit for required file existence, scenario IDs, mode observations, evidence claims, and false Fast React compatibility claims
```

Verification results so far:

- `node --test tests/conformance/test/react-test-renderer-root-lifecycle-oracle.test.mjs`: passed, 10/10.
- Regeneration byte-compare with checked artifact: passed.
- Scoped local/temp path leak check over conformance source/script/test/oracle paths: no matches.
- `npm test --workspace @fast-react/conformance`: passed, 251/251. npm printed the existing local `minimum-release-age` config warning.
- Final scoped local/temp path leak check including this report: passed, no matches.
- Final scoped trailing whitespace check: passed, no matches.
- Final scoped `git diff --check` including untracked files via intent-to-add: passed.
- Final objective-level audit script: passed, confirming 10 required files, 7 scenarios, and development/production observations.

Note: one first attempt at the intent-to-add `git diff --check` wrapper used
the shell variable name `status`, which is read-only under this shell. The
wrapper was rerun with `rc`, reset the scoped index entries, and passed.

## Delegated checks

Nested read-only explorer `019e0ee9-bb98-7b51-9bac-50c27997b329` independently
audited the oracle files and reported:

- Scenario definitions cover object shape, raw create/act boundary,
  create/update/unmount, `.root`, `getInstance`, `createNodeMock`, and
  strict/concurrent options.
- Probe implementations exercise the required public paths directly.
- Tests assert post-unmount `.root` error, `getInstance()` null, idempotent
  `update()`/`unmount()`, `createNodeMock`, strict replay, concurrent options,
  and production act absence.
- Two fresh generation runs compared byte-for-byte with each other and the
  checked oracle, all with SHA-256
  `fe47da8ea41e15d6ed267a74f1a82de948ac9d682b3b1959bebc2ed0456fccf0`.
- `node --test test/react-test-renderer-root-lifecycle-oracle.test.mjs` passed
  and `npm test` passed 251/251 in the conformance workspace.
- The only gap found was this missing progress report, now addressed.

## Risks or blockers

- No blocker remains for this scoped oracle.
- The oracle does not compare Fast React to React Test Renderer. That is
  intentional and recorded in `conformanceClaims`; future implementation
  workers should consume this oracle.
- The production `react-test-renderer` path records public behavior where
  `React.act` is absent and raw root work remains unflushed. Tests assert this
  explicitly so later workers do not incorrectly infer development act behavior
  from production.
- No shared package manifest script was added because the worker write scope did
  not include package manifests and the direct scripts/tests are sufficient.

## Recommended next tasks

1. Add the serialization oracle from worker 085 and cross-check root lifecycle
   `.root`/`toJSON` assumptions against `toTree` and `TestInstance` coverage.
2. Use this oracle to gate any future `react-test-renderer` JS facade and Rust
   root lifecycle implementation.
3. Add a later dual-run oracle once Fast React exposes a public
   `react-test-renderer` package entrypoint.

## Completion checklist

- [x] Did not read `ORCHESTRATOR.md`.
- [x] Read required worker documents after goal setup.
- [x] Preserved scoped existing untracked oracle work instead of reverting it.
- [x] Added deterministic generator, print helper, probe runner, source helpers,
  checked oracle artifact, and test file in the assigned scope.
- [x] Covered create/update/unmount, getInstance, `.root`, createNodeMock,
  strict/concurrent options, and post-unmount behavior.
- [x] Kept scenarios independent of Fast React implementation workers.
- [x] Kept Fast React compatibility claims false.
- [x] Used a nested subagent to test the coverage/determinism hypothesis.
- [x] Ran targeted `node --test`.
- [x] Ran oracle regeneration byte-compare.
- [x] Ran conformance workspace `npm test`.
- [x] Ran final scoped local path leak check including this report.
- [x] Ran final scoped trailing whitespace check.
- [x] Ran final scoped `git diff --check`.
