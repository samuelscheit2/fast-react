# worker-086-react-test-renderer-act-oracle

## Summary

Added a deterministic React test renderer 19.2.6 act, mock Scheduler, and
`unstable_flushSync` oracle. The oracle is generated from exact npm tarballs in
an isolated temporary `node_modules` tree and records public behavior only. It
does not compare Fast React to React test renderer and does not claim
compatibility.

Root cause addressed: act and `unstable_flushSync` behavior is shared
reconciler scheduling behavior surfaced through test renderer public APIs, so
the oracle probes observable update flushing, Scheduler exposure, warnings, and
error aggregation instead of relying on export names or source-code inference.

Write scope honored: only `tests/conformance/src/react-test-renderer-act-*.mjs`,
`tests/conformance/scripts/*react-test-renderer-act*.mjs`,
`tests/conformance/test/react-test-renderer-act-oracle.test.mjs`,
`tests/conformance/oracles/react-19.2.6-react-test-renderer-act-oracle.json`,
and this report were changed.

## Changed Files

- `tests/conformance/src/react-test-renderer-act-targets.mjs`
- `tests/conformance/src/react-test-renderer-act-scenarios.mjs`
- `tests/conformance/src/react-test-renderer-act-probe-runner.mjs`
- `tests/conformance/src/react-test-renderer-act-oracle-generator.mjs`
- `tests/conformance/src/react-test-renderer-act-oracle.mjs`
- `tests/conformance/scripts/generate-react-test-renderer-act-oracle.mjs`
- `tests/conformance/scripts/print-react-test-renderer-act-oracle.mjs`
- `tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-test-renderer-act-oracle.json`
- `worker-progress/worker-086-react-test-renderer-act-oracle.md`

## Evidence Gathered

- Active goal status after setup/check: `active`.
- Active goal objective after setup/check:
  `Add deterministic react-test-renderer act and flushSync scheduling oracle files.`
- Read required context first after `create_goal`: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, `MASTER_PROGRESS.md`,
  `worker-progress/worker-017-runtime-inventory-generation.md`,
  `worker-progress/worker-041-dom-events-priority-plan.md`, and
  `worker-progress/worker-073-test-renderer-update-model-plan.md`.
- `worker-progress/worker-083-react-test-renderer-export-oracle.md` was not
  present in this worktree.
- The generated oracle covers:
  - `react-test-renderer` export shape and `act === React.act`;
  - production `act` key with `undefined` value;
  - synchronous act flushing of root updates and effect-scheduled updates;
  - awaited async act return values and post-await flushing;
  - deterministic missing-act-environment and unawaited-async-act warnings;
  - `_Scheduler` exposure from `scheduler/unstable_mock`, virtual time, logging,
    scheduled callback flushing, and priority context;
  - root `unstable_flushSync` callback contracts, update flushing after callback
    return, falsy callback handling, truthy non-function errors, callback error
    propagation, and recovery;
  - sync callback throw propagation, async callback rejection, and
    `AggregateError` aggregation for multiple render errors in one act scope.
- The probes avoid private React internals, real wall-clock assertions, and
  concrete local or temporary path leakage.
- Package tarball metadata and integrity are checked for
  `react-test-renderer@19.2.6`, `react@19.2.6`, `scheduler@0.27.0`, and
  `react-is@19.2.6`.

## Completion Audit

Objective restated as concrete deliverables:

- Add deterministic `react-test-renderer` 19.2.6 act and `unstable_flushSync`
  oracle files under the assigned `tests/conformance` paths.
- Cover exported `act`, async act warnings where deterministic, update
  flushing, Scheduler exposure, root `unstable_flushSync`, and thrown error
  aggregation.
- Avoid flaky timing and prefer deterministic Scheduler/test-renderer
  observables.
- Keep Fast React compatibility claims false because this is a React-only
  oracle.
- Run targeted `node --test`, scoped path leak checks, trailing whitespace
  checks, and `git diff --check`.
- Record progress in this worker report without reading `ORCHESTRATOR.md`.

Prompt-to-artifact checklist:

| Requirement | Evidence |
| --- | --- |
| Use `/goal`/`create_goal` first | `create_goal` was called before any file reads; `get_goal` reported the active objective above. |
| Read required context, not `ORCHESTRATOR.md` | Required context files listed in Evidence Gathered; worker 083 report was absent; `ORCHESTRATOR.md` was not read. |
| Stay in write scope | `git diff --name-status`/`git status` show only the nine allowed `react-test-renderer-act` conformance files and this worker report. |
| Add target metadata and artifact path | `tests/conformance/src/react-test-renderer-act-targets.mjs` defines the checked artifact path, React/test-renderer/scheduler/react-is target versions, integrity, and probe modes. |
| Add scenario inventory | `tests/conformance/src/react-test-renderer-act-scenarios.mjs` defines seven scenarios: export shape, sync flushing, async contracts, warning surfaces, Scheduler exposure, `unstable_flushSync`, and error aggregation. |
| Add deterministic probe runner | `tests/conformance/src/react-test-renderer-act-probe-runner.mjs` runs public API probes only, captures console diagnostics, uses mock Scheduler logical flushes, and avoids private internals. |
| Add generator and checked artifact | `tests/conformance/src/react-test-renderer-act-oracle-generator.mjs` fetches exact tarballs, verifies integrity, extracts to temp `node_modules`, runs isolated child processes, normalizes paths, and produces `tests/conformance/oracles/react-19.2.6-react-test-renderer-act-oracle.json`. |
| Add print/read helpers and CLIs | `tests/conformance/src/react-test-renderer-act-oracle.mjs`, `scripts/generate-react-test-renderer-act-oracle.mjs`, and `scripts/print-react-test-renderer-act-oracle.mjs` read, print, and regenerate the checked artifact. |
| Add test coverage | `tests/conformance/test/react-test-renderer-act-oracle.test.mjs` asserts schema, targets, false compatibility claims, every scenario in every mode, behavior observations, path leak guard, and print CLI byte equality. |
| Probe exported act | Artifact `evidenceClaims.exportedActProbed` is true; tests assert development `act === React.act` and production `act` key with `undefined` value. |
| Probe async act warning surfaces where deterministic | Warning scenario captures missing `IS_REACT_ACT_ENVIRONMENT` and unawaited async `act` warnings via bounded microtask flushing, with no real timers. |
| Probe update flushing | Sync and async scenarios assert create/update/effect flush ordering and final `toJSON` output. |
| Probe Scheduler exposure | Scheduler scenario asserts `_Scheduler` mock keys, priorities, `unstable_now() === 0`, log/clear, schedule/flush, and runWithPriority behavior. |
| Probe `unstable_flushSync` | Root `unstable_flushSync` scenario asserts callback contract, deferred commit until callback return, falsy callback behavior, truthy non-function error, callback error propagation, and recovery. |
| Probe thrown error aggregation | Error scenario asserts sync callback throw, async callback rejection, and `AggregateError` with multiple render errors. |
| Avoid flaky timing | Coverage records `realTimersAvoided: true`; probes use microtasks and `scheduler/unstable_mock` logical flush APIs, not wall-clock assertions. |
| Avoid package manifest edits | No shared package manifest changes are present in `git diff --name-status` or `git status --short`. |
| Use subagents to test hypothesis | Nested explorer `019e0ee9-cad6-71e1-adcf-ff586d5bcd8e` audited oracle conventions and ran the targeted test; nested explorer `019e0ee9-f93f-7713-b91c-45112901960f` independently validated the scenario set, byte-regeneration, and conformance pass. |
| Targeted `node --test` | `node --test tests/conformance/test/react-test-renderer-act-oracle.test.mjs` passed: 12 tests. |
| Regeneration determinism | `node tests/conformance/scripts/generate-react-test-renderer-act-oracle.mjs` output byte-matched the checked JSON artifact. |
| Scoped path leak check | `rg -n '<temp-or-workspace-path-regex>' ...` returned no matches. |
| Scoped trailing whitespace check | `rg -n '[[:blank:]]$' ...` returned no matches. |
| Scoped `git diff --check` | `git diff --check -- ...` passed with no output. |

Audit result: all explicit deliverables and verification gates are covered by
current files and command results. No missing requirement remains.

## Commands Run

```sh
create_goal objective="Add deterministic react-test-renderer act and flushSync scheduling oracle files."
get_goal
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,220p' worker-progress/worker-017-runtime-inventory-generation.md
sed -n '1,220p' worker-progress/worker-041-dom-events-priority-plan.md
sed -n '1,260p' worker-progress/worker-073-test-renderer-update-model-plan.md
ls worker-progress/worker-083-react-test-renderer-export-oracle.md
wc -l MASTER_PLAN.md
wc -l MASTER_PROGRESS.md
wc -l worker-progress/worker-017-runtime-inventory-generation.md
wc -l worker-progress/worker-041-dom-events-priority-plan.md
wc -l worker-progress/worker-073-test-renderer-update-model-plan.md
sed -n '261,320p' MASTER_PLAN.md
sed -n '261,380p' MASTER_PROGRESS.md
sed -n '221,340p' worker-progress/worker-017-runtime-inventory-generation.md
sed -n '221,520p' worker-progress/worker-041-dom-events-priority-plan.md
git status --short --untracked-files=all
rg --files tests/conformance
sed -n '1,220p' tests/conformance/package.json
sed -n '1,260p' tests/conformance/src/runtime-inventory.mjs
sed -n '1,260p' tests/conformance/src/runtime-inventory-generator.mjs
sed -n '1,260p' tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs
sed -n '1,260p' tests/conformance/src/react-test-renderer-act-targets.mjs
sed -n '1,320p' tests/conformance/src/react-test-renderer-act-scenarios.mjs
sed -n '1,360p' tests/conformance/src/react-test-renderer-act-probe-runner.mjs
sed -n '1,320p' tests/conformance/src/react-test-renderer-act-oracle-generator.mjs
sed -n '1,260p' tests/conformance/src/react-test-renderer-act-oracle.mjs
sed -n '1,360p' tests/conformance/test/react-test-renderer-act-oracle.test.mjs
sed -n '361,760p' tests/conformance/src/react-test-renderer-act-probe-runner.mjs
sed -n '321,720p' tests/conformance/src/react-test-renderer-act-oracle-generator.mjs
sed -n '361,760p' tests/conformance/test/react-test-renderer-act-oracle.test.mjs
sed -n '1,180p' tests/conformance/scripts/generate-react-test-renderer-act-oracle.mjs
sed -n '1,220p' tests/conformance/scripts/print-react-test-renderer-act-oracle.mjs
sed -n '1,80p' tests/conformance/oracles/react-19.2.6-react-test-renderer-act-oracle.json
node --test tests/conformance/test/react-test-renderer-act-oracle.test.mjs
tmpfile=$(mktemp); node tests/conformance/scripts/generate-react-test-renderer-act-oracle.mjs > "$tmpfile"; cmp -s tests/conformance/oracles/react-19.2.6-react-test-renderer-act-oracle.json "$tmpfile"; cmp_status=$?; rm -f "$tmpfile"; exit "$cmp_status"
npm test --workspace @fast-react/conformance
node tests/conformance/scripts/print-react-test-renderer-act-oracle.mjs --format=markdown | sed -n '1,120p'
git diff --name-status
git diff --stat
git status --short --untracked-files=all
git add -N worker-progress/worker-086-react-test-renderer-act-oracle.md
rg -n 'exportedActProbed|syncActUpdateFlushingProbed|asyncActContractsProbed|deterministicActWarningsProbed|schedulerExposureProbed|unstableFlushSyncProbed|thrownErrorAggregationProbed|fastReactBehaviorCompatible|realTimersAvoided|privateInternalsAvoided|react-test-renderer-act-' tests/conformance/oracles/react-19.2.6-react-test-renderer-act-oracle.json tests/conformance/test/react-test-renderer-act-oracle.test.mjs tests/conformance/src/react-test-renderer-act-scenarios.mjs tests/conformance/src/react-test-renderer-act-oracle-generator.mjs
rg -n '<temp-or-workspace-path-regex>' tests/conformance/oracles/react-19.2.6-react-test-renderer-act-oracle.json tests/conformance/src/react-test-renderer-act-*.mjs tests/conformance/scripts/*react-test-renderer-act*.mjs tests/conformance/test/react-test-renderer-act-oracle.test.mjs worker-progress/worker-086-react-test-renderer-act-oracle.md
rg -n '[[:blank:]]$' tests/conformance/src/react-test-renderer-act-*.mjs tests/conformance/scripts/*react-test-renderer-act*.mjs tests/conformance/test/react-test-renderer-act-oracle.test.mjs tests/conformance/oracles/react-19.2.6-react-test-renderer-act-oracle.json worker-progress/worker-086-react-test-renderer-act-oracle.md
git diff --check -- tests/conformance/src/react-test-renderer-act-targets.mjs tests/conformance/src/react-test-renderer-act-scenarios.mjs tests/conformance/src/react-test-renderer-act-probe-runner.mjs tests/conformance/src/react-test-renderer-act-oracle-generator.mjs tests/conformance/src/react-test-renderer-act-oracle.mjs tests/conformance/scripts/generate-react-test-renderer-act-oracle.mjs tests/conformance/scripts/print-react-test-renderer-act-oracle.mjs tests/conformance/test/react-test-renderer-act-oracle.test.mjs tests/conformance/oracles/react-19.2.6-react-test-renderer-act-oracle.json worker-progress/worker-086-react-test-renderer-act-oracle.md
```

An earlier regeneration command used `status=$?` in this shell and failed
because `status` is read-only under zsh. The command was rerun successfully with
`cmp_status`.

## Verification Results

- `node --test tests/conformance/test/react-test-renderer-act-oracle.test.mjs`:
  passed, 12 tests.
- Regeneration byte-compare:
  `node tests/conformance/scripts/generate-react-test-renderer-act-oracle.mjs`
  output matched the checked JSON artifact exactly.
- `npm test --workspace @fast-react/conformance`: passed, 253 tests. npm
  printed the existing local `minimum-release-age` config warning.
- Scoped local/temp path leak check: passed with no matches.
- Scoped trailing whitespace check: passed with no matches.
- Scoped `git diff --check`: passed with no output.

## Delegated Checks

- Nested read-only explorer `019e0ee9-cad6-71e1-adcf-ff586d5bcd8e` audited the
  existing conformance oracle conventions and confirmed that the current file
  names, schema shape, generator pattern, leak checks, and test assertions match
  the local oracle style. It also ran the targeted act oracle test with 12
  passes.
- Nested read-only explorer `019e0ee9-f93f-7713-b91c-45112901960f`
  independently validated the scenario set, regenerated the checked artifact
  byte-for-byte, and ran the conformance suite with 253 passes. It called out
  the same flaky surfaces to avoid: wall-clock timers, private React internals,
  production act behavior beyond the `undefined` export, and Fast React
  compatibility claims.

## Risks Or Blockers

- React test renderer is deprecated upstream, but it remains a published React
  19.2.6 runtime target and a useful conformance source for root scheduling
  semantics.
- The oracle intentionally does not probe `react-server` conditions. Worker 083
  was not present locally, and condition/package-loading coverage belongs to the
  export oracle track.
- The oracle records React test renderer behavior only; Fast React remains
  uncompared and compatibility claims remain false.
- Warning checks rely on React's deterministic microtask warning path, not real
  timers. If React changes that behavior in a future target, this oracle should
  be regenerated with a new versioned artifact rather than loosened.

## Recommended Next Tasks

- Use this oracle to gate future test-renderer root scheduler and act
  integration work.
- Add a separate export oracle once worker 083 is available or merged, then
  reconcile any duplicated package-surface assertions.
- After Fast React has a JS test-renderer facade, add dual-run comparison rows
  instead of changing this React-only oracle's compatibility claims.

## Completion Checklist

- [x] Called `create_goal` before research, file reads, implementation, or
      verification.
- [x] Read all required worker context files and did not read `ORCHESTRATOR.md`.
- [x] Preserved valid scoped continuation work already present in the worktree.
- [x] Added deterministic oracle generator, print command, probe runner, checked
      artifact, and tests.
- [x] Avoided shared package manifest edits.
- [x] Used nested subagents to test hypotheses.
- [x] Ran targeted `node --test`.
- [x] Ran conformance workspace tests.
- [x] Regenerated and byte-compared the oracle artifact.
- [x] Ran final scoped local path leak checks.
- [x] Ran final trailing whitespace checks.
- [x] Ran final `git diff --check`.
