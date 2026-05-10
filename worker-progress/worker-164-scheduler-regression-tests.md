# Worker 164 Scheduler Regression Tests

## Goal Setup Evidence

- `create_goal` called first with objective: add committed local-vs-`scheduler@0.27.0` regression tests for the public Scheduler package surfaces that already exist locally, without changing React lanes or reconciler root scheduling internals.
- `get_goal` returned status `active` for the same objective.

## Summary

Added committed local Fast React vs official `scheduler@0.27.0` comparison coverage for the public scheduler root entrypoint. The root oracle generator now copies local `packages/scheduler` under the isolated `fast-react-scheduler` alias, probes both targets for every existing root scheduler scenario in development and production, records scenario-by-scenario comparison results, and excludes local workspace package metadata from behavior comparison.

The checked root oracle now records 22 `matched-but-compatibility-not-claimed` comparisons across 11 root scenarios and 2 probe modes. Existing mock, post-task, and native scheduler regression tests already assert matched local comparisons; those tests remained intact. Broad Scheduler compatibility claims remain false, and the post-task oracle still explicitly does not claim browser task ordering or raw timing compatibility.

No React lanes, reconciler root scheduling internals, Rust files, or React DOM event-priority files were changed.

## Changed Files

- `tests/conformance/src/scheduler-root-targets.mjs`
- `tests/conformance/src/scheduler-root-oracle-generator.mjs`
- `tests/conformance/src/scheduler-root-oracle.mjs`
- `tests/conformance/scripts/generate-scheduler-root-oracle.mjs`
- `tests/conformance/scripts/print-scheduler-root-oracle.mjs`
- `tests/conformance/test/scheduler-root-oracle.test.mjs`
- `tests/conformance/oracles/scheduler-0.27.0-root-oracle.json`
- `worker-progress/worker-164-scheduler-regression-tests.md`

## Evidence Gathered

- Prior worker reports showed mock, post-task, and native entrypoint oracles already contained local comparison tracks with explicit matched status assertions.
- Worker 144 identified the root scheduler oracle as the remaining public Scheduler behavior track without committed local-vs-official comparison data.
- Direct tarball diffs confirmed local root CJS files match the published `scheduler@0.27.0` `scheduler.development.js` and `scheduler.production.js` artifacts.
- Regenerated root oracle summary:
  - `fastReactComparedToScheduler: true`
  - `fastReactBehaviorCompatible: false`
  - status counts: `{"matched-but-compatibility-not-claimed":22}`
  - observations per mode: 11 scheduler, 11 Fast React, 11 comparisons.

## Commands Run

```sh
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,240p' worker-progress/worker-120-scheduler-mock-source-implementation.md
sed -n '1,240p' worker-progress/worker-125-scheduler-post-task-implementation.md
sed -n '1,240p' worker-progress/worker-126-scheduler-native-entry-implementation.md
sed -n '1,260p' worker-progress/worker-144-scheduler-regression-refresh.md
rg --files packages/scheduler tests/conformance/src tests/conformance/scripts
git status --short
sed -n '1,620p' tests/conformance/test/scheduler-root-oracle.test.mjs
sed -n '1,520p' tests/conformance/src/scheduler-root-oracle-generator.mjs
sed -n '1,980p' tests/conformance/src/scheduler-root-probe-runner.mjs
sed -n '1,240p' tests/conformance/src/scheduler-root-targets.mjs
sed -n '1,260p' tests/conformance/src/scheduler-root-scenarios.mjs
sed -n '1,360p' tests/conformance/src/scheduler-mock-oracle-generator.mjs
sed -n '1,760p' tests/conformance/test/scheduler-mock-oracle.test.mjs
sed -n '1,780p' tests/conformance/test/scheduler-post-task-oracle.test.mjs
sed -n '1,880p' tests/conformance/test/scheduler-native-entry-oracle.test.mjs
cat package.json
cat packages/scheduler/package.json
curl -fsSL https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz | tar -xOzf - package/cjs/scheduler.development.js | diff -u - packages/scheduler/cjs/scheduler.development.js
curl -fsSL https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz | tar -xOzf - package/cjs/scheduler.production.js | diff -u - packages/scheduler/cjs/scheduler.production.js
node --check tests/conformance/src/scheduler-root-oracle-generator.mjs
node --check tests/conformance/src/scheduler-root-targets.mjs
node --check tests/conformance/src/scheduler-root-oracle.mjs
node --check tests/conformance/test/scheduler-root-oracle.test.mjs
node --check tests/conformance/scripts/generate-scheduler-root-oracle.mjs
node --check tests/conformance/scripts/print-scheduler-root-oracle.mjs
node tests/conformance/scripts/generate-scheduler-root-oracle.mjs --write
node -e "<root oracle comparison summary>"
node --test tests/conformance/test/scheduler-root-oracle.test.mjs tests/conformance/test/scheduler-variant-oracle.test.mjs tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/scheduler-post-task-oracle.test.mjs tests/conformance/test/scheduler-native-entry-oracle.test.mjs
npm run check:js
git diff --check
git diff --stat
```

Goal/tool actions:

- `create_goal` for this worker objective.
- `get_goal` immediately after goal setup.
- No nested managed agents were spawned.

## Verification

Passing:

```sh
node --check tests/conformance/src/scheduler-root-oracle-generator.mjs
node --check tests/conformance/src/scheduler-root-targets.mjs
node --check tests/conformance/src/scheduler-root-oracle.mjs
node --check tests/conformance/test/scheduler-root-oracle.test.mjs
node --check tests/conformance/scripts/generate-scheduler-root-oracle.mjs
node --check tests/conformance/scripts/print-scheduler-root-oracle.mjs
node tests/conformance/scripts/generate-scheduler-root-oracle.mjs --write
node --test tests/conformance/test/scheduler-root-oracle.test.mjs tests/conformance/test/scheduler-variant-oracle.test.mjs tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/scheduler-post-task-oracle.test.mjs tests/conformance/test/scheduler-native-entry-oracle.test.mjs
npm run check:js
git diff --check
```

Focused scheduler conformance passed 62 tests. `npm run check:js` passed with 416 conformance tests. npm emitted only the existing `minimum-release-age` warnings.

## Quality Review

- Maintainability: root comparison follows the established scheduler mock/post-task/native oracle pattern and reuses the existing root scenarios instead of adding a separate one-off harness.
- Compatibility boundary: local workspace package metadata remains excluded from behavior comparisons, and broad Scheduler compatibility claims remain false.
- Performance: oracle generation adds one extra local child-process probe per scenario and mode; checked tests read the committed artifact and remain fast.
- Security: generator still fetches the exact pinned npm tarball, verifies integrity and shasum evidence, uses temporary directories, and does not execute package lifecycle scripts.

## Risks Or Blockers

- The root oracle compares deterministic Node behavior and normalized timing buckets, not raw wall-clock latency.
- Package metadata compatibility is still not claimed because local `packages/scheduler/package.json` remains workspace-specific.
- Variant/deep-import package metadata coverage still documents official package shape but does not add a new local comparison track in this worker.

## Recommended Next Tasks

1. Keep package metadata compatibility as a separate Scheduler package-identity task if exact published metadata parity becomes a goal.
2. Add real browser-host post-task coverage before claiming browser Task Scheduling API ordering or timing compatibility.
3. Keep reconciler root scheduling and React lanes on their existing internal tracks; public Scheduler regression coverage should not be used as proof of render scheduling compatibility.
