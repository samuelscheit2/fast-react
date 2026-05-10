# Worker 144 Scheduler Regression Refresh

## Goal Setup Evidence

- `create_goal` called first with objective: Produce a report-only audit of public scheduler package regression coverage after workers 120, 125, 126, and 127, separated from reconciler-internal root scheduling, writing only `worker-progress/worker-144-scheduler-regression-refresh.md`.
- `get_goal` returned status `active` for the same objective.

## Summary

This is a report-only audit. No source, test, package, prompt, master-doc, or
lockfile changes were made.

Public `packages/scheduler` regression coverage is now split across five
evidence tracks:

- Root scheduler entrypoint: implemented earlier by worker 045 and covered by
  the root oracle plus smoke behavior checks. The checked root oracle still
  records `fastReactComparedToScheduler: false`, so exact local-vs-oracle
  comparison is not a committed conformance gate for the root entrypoint.
- `scheduler/unstable_mock`: worker 120 implemented it and the checked oracle
  records 18 local Fast React comparisons as
  `matched-but-compatibility-not-claimed`.
- `scheduler/unstable_post_task`: worker 125 implemented browser
  Task-Scheduling-API-backed behavior under controlled shims and the checked
  oracle records 12 local comparisons as
  `matched-but-compatibility-not-claimed`.
- `scheduler/index.native.js` and native CJS files: worker 126 implemented the
  native entrypoint, worker 127 updated smoke coverage, and the checked oracle
  records 14 local comparisons as `matched-but-compatibility-not-claimed`.
- Variant/deep-import inventory: worker 039 covers package metadata, physical
  subpath exposure, and CJS deep import behavior for the published
  `scheduler@0.27.0` tarball, but it still has no Fast React comparison track.

The public Scheduler package remains deliberately separate from
reconciler-internal root scheduling. `crates/fast-react-reconciler` owns a
deterministic `SchedulerBridge` and `root_scheduler` model for callback
identity, priority, cancellation, and root-schedule microtask records. That
bridge is not the public `scheduler` package and does not prove public
Scheduler API compatibility.

## Changed Files

- `worker-progress/worker-144-scheduler-regression-refresh.md`

Observed but excluded from the write-scope check:

- `.worker-logs/` was already untracked when this worker started; it was not
  created, modified, staged, or removed by this audit.

## Covered Public Scheduler Surfaces

- Package files present under `packages/scheduler`: root wrapper, native
  wrapper, mock wrapper, post-task wrapper, root CJS dev/prod, mock CJS
  dev/prod, post-task CJS dev/prod, native CJS dev/prod, and package metadata.
- Root public API behavior covered by worker 038's oracle and current smoke
  checks: export keys/descriptors, priority constants, task object shape,
  ready/delayed sort indexes, cancellation tombstones, priority ordering, FIFO
  same-priority work, delayed work, continuations, `didTimeout`,
  `unstable_runWithPriority`, `unstable_next`, `unstable_wrapCallback`,
  `unstable_shouldYield`, `unstable_requestPaint`,
  `unstable_forceFrameRate`, and Node `setImmediate` transport evidence.
- Mock public API behavior covered after worker 120: full mock export list,
  virtual time, log/clearLog, disabled yield values, task shape, priority
  context APIs, priority flush ordering, all flush helpers,
  `unstable_hasPendingWork`, delayed/expired/cancelled work, continuations,
  paint yielding, and `reset` behavior.
- Post-task public API behavior covered after worker 125: export shape,
  descriptors, plain Node `ReferenceError: window is not defined`, missing
  Task Scheduling API failure, no-op paint/frame APIs, priority context APIs,
  priority-to-`postTask` mapping, delay normalization, returned task node
  descriptors, `TaskController.abort` cancellation, controlled deadline
  `shouldYield`, continuations via `scheduler.yield`, and fallback
  continuations via `scheduler.postTask`.
- Native public API behavior covered after workers 126 and 127: published
  native files, native file resolution, `NODE_ENV` file selection, native
  export shape/descriptors, fallback task scheduling runtime, unsupported
  priority-context helper throwers, `nativeRuntimeScheduler` delegation,
  default-entrypoint relationship, direct native CJS require behavior, and
  smoke assertions for native import inventory and representative behavior.
- Smoke import coverage now exercises direct-file and installed-package probes
  for root, mock, native, post-task plain-Node unsupported behavior, and deep
  CJS files.

## Uncovered Or Partially Covered Scheduler Package Surfaces

- Root local-vs-oracle conformance is partial. Smoke checks representative
  behavior and worker 045 reported a local root probe comparison, but the
  checked root oracle still has no `fastReactObservations`,
  `fastReactComparisons`, or implementation comparison status counts.
- Variant/deep-import local comparison is partial. Worker 039 documents the
  published `scheduler@0.27.0` package shape and CJS deep imports, but the
  variant oracle still records `fastReactComparedToScheduler: false`.
- Package metadata compatibility is not claimed. Local
  `packages/scheduler/package.json` is workspace-specific (`private: true`,
  Fast React placeholder description, local `scripts`, and `engines`), while
  the published package oracle expects no `main`, no `exports`, no `type`, no
  runtime dependencies, no `engines`, published description/repository/bugs,
  and package tarball metadata.
- Post-task browser host ordering and raw timing are explicitly uncovered. The
  post-task oracle uses controlled Node shims and marks `browserTaskOrdering`
  and `rawTiming` as false.
- React Native host integration is not covered. The native oracle covers
  Node-controlled fallback/delegation behavior, not a real React Native
  runtime.
- ESM package-subpath behavior remains limited by the package's no-exports-map
  CJS shape. Smoke records CJS named import/default interop where applicable
  and expected `ERR_MODULE_NOT_FOUND` for extensionless mock/post-task package
  subpaths, but broad ESM compatibility is not separately claimed.
- Broad public Scheduler API compatibility is still unclaimed for every
  scheduler oracle. Even where local behavior matches, the checked artifacts
  keep `compatibilityClaimed: false` and `fastReactBehaviorCompatible: false`.

## Root Render Versus Public Scheduler API Impact

Gaps that matter for near-term root render work:

- Internal reconciler root scheduling must keep using
  `crates/fast-react-reconciler/src/scheduler_bridge.rs` and
  `root_scheduler.rs` as its current deterministic foundation until a real work
  loop owns callback execution. Public `packages/scheduler` tests do not prove
  render, commit, HostRoot queue processing, `root.current` switching, or act
  routing.
- Public Scheduler priority constants should not be treated as React lanes or
  event priorities. Worker 128's bridge maps internal callback decisions
  separately, and React DOM event-priority oracles keep Scheduler priority
  observations scoped to public Scheduler state.
- Mock scheduler coverage is useful for future upstream-style deterministic
  test-renderer/act harness work, but it does not itself schedule reconciler
  roots.
- Post-task and native package gaps do not block the current DOM/root render
  path unless a future renderer explicitly chooses those public package
  variants as host scheduling backends.

Gaps that matter primarily for public Scheduler API compatibility:

- Add committed local-vs-oracle comparisons for the root scheduler entrypoint.
- Add local comparison coverage for variant/deep-import/package metadata
  behavior, or explicitly document which physical deep imports are supported
  without claiming metadata parity.
- Decide whether package metadata should match `scheduler@0.27.0` or remain
  workspace-specific with compatibility claims kept false.
- Add real browser-host post-task coverage before claiming post-task timing or
  browser task ordering compatibility.
- Add React Native host runtime tests before claiming native-host Scheduler
  compatibility.

## Commands Run

```sh
ls -ld worker-progress && test -f worker-progress/worker-144-scheduler-regression-refresh.md && sed -n '1,120p' worker-progress/worker-144-scheduler-regression-refresh.md || true
sed -n '1,220p' WORKER_BRIEF.md
rg --files | rg '(^MASTER_(PLAN|PROGRESS)\.md$|worker-progress/.*(038|039|052|068|069|120|125|126|127).*\.md$|packages/scheduler|scheduler|Scheduler)'
git status --short
find packages/scheduler -maxdepth 4 -type f | sort
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,300p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-038-scheduler-root-oracle.md
sed -n '1,260p' worker-progress/worker-039-scheduler-variant-oracles.md
sed -n '1,280p' worker-progress/worker-052-scheduler-mock-oracle.md
sed -n '1,280p' worker-progress/worker-068-scheduler-post-task-oracle.md
sed -n '1,280p' worker-progress/worker-069-scheduler-native-entry-oracle.md
sed -n '1,320p' worker-progress/worker-120-scheduler-mock-source-implementation.md
sed -n '1,340p' worker-progress/worker-125-scheduler-post-task-implementation.md
sed -n '1,340p' worker-progress/worker-126-scheduler-native-entry-implementation.md
sed -n '1,340p' worker-progress/worker-127-scheduler-native-smoke-integration.md
cat packages/scheduler/package.json
sed -n '1,260p' packages/scheduler/cjs/scheduler.development.js
sed -n '1,220p' packages/scheduler/cjs/scheduler.production.js
sed -n '1,260p' packages/scheduler/cjs/scheduler-unstable_mock.development.js
sed -n '1,260p' packages/scheduler/cjs/scheduler-unstable_post_task.development.js
sed -n '260,620p' packages/scheduler/cjs/scheduler.development.js
sed -n '220,520p' packages/scheduler/cjs/scheduler.production.js
sed -n '260,700p' packages/scheduler/cjs/scheduler-unstable_mock.development.js
sed -n '1,320p' packages/scheduler/cjs/scheduler.native.development.js
sed -n '320,740p' packages/scheduler/cjs/scheduler.native.development.js
sed -n '1,360p' packages/scheduler/cjs/scheduler.native.production.js
for f in packages/scheduler/index.js packages/scheduler/index.native.js packages/scheduler/unstable_mock.js packages/scheduler/unstable_post_task.js; do printf '%s\n' '---' "$f"; sed -n '1,120p' "$f"; done
sed -n '1,260p' tests/smoke/import-entrypoints.mjs
rg -n "scheduler|Scheduler|unstable_post_task|native" tests/smoke/import-entrypoints.mjs
sed -n '1,260p' tests/conformance/test/scheduler-root-oracle.test.mjs
sed -n '1,280p' tests/conformance/test/scheduler-mock-oracle.test.mjs
sed -n '1,280p' tests/conformance/test/scheduler-post-task-oracle.test.mjs
sed -n '1,300p' tests/conformance/test/scheduler-native-entry-oracle.test.mjs
sed -n '1,280p' tests/conformance/test/scheduler-variant-oracle.test.mjs
sed -n '490,680p' tests/smoke/import-entrypoints.mjs
sed -n '786,1160p' tests/smoke/import-entrypoints.mjs
sed -n '2010,2090p' tests/smoke/import-entrypoints.mjs
sed -n '2794,3235p' tests/smoke/import-entrypoints.mjs
rg -n "scheduler-root|fastReact|implementationComparison|fastReactCompared|scheduler root" tests/conformance/src tests/conformance/test worker-progress packages/scheduler | head -n 200
rg -n "afterWorker|implementationComparison|compatibilityClaimed|fastReactBehaviorCompatible|coverage" tests/conformance/oracles/scheduler-0.27.0-*.json
rg --files worker-progress | rg 'scheduler.*(implementation|source|root)|worker-0(3[4-9]|4[0-9]|5[0-9])|worker-1(0[3-9]|1[0-9]|2[0-9])'
sed -n '1,220p' docs/tasks/worker-144-scheduler-regression-refresh.prompt.md
sed -n '1,320p' worker-progress/worker-128-reconciler-root-scheduler-foundation.md
sed -n '1,320p' crates/fast-react-reconciler/src/scheduler_bridge.rs
sed -n '1,360p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '1,220p' worker-progress/worker-045-scheduler-root-implementation.md
for f in $(find packages/scheduler -name '*.js' -type f | sort); do node --check "$f"; done
node tests/smoke/import-entrypoints.mjs
node --test tests/conformance/test/scheduler-root-oracle.test.mjs tests/conformance/test/scheduler-variant-oracle.test.mjs tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/scheduler-post-task-oracle.test.mjs tests/conformance/test/scheduler-native-entry-oracle.test.mjs
node -e "const fs=require('fs'); for (const name of ['root','variant','mock','post-task','native-entry']) { const p='tests/conformance/oracles/scheduler-0.27.0-'+name+'-oracle.json'; const o=JSON.parse(fs.readFileSync(p,'utf8')); console.log(name, JSON.stringify({claims:o.conformanceClaims, coverage:o.coverage, implementationComparison:o.implementationComparison||null})); }"
npm run check:js
git diff --check
git diff --check --no-index /dev/null worker-progress/worker-144-scheduler-regression-refresh.md; rc=$?; test "$rc" -eq 1
allowed='worker-progress/worker-144-scheduler-regression-refresh.md'; files=$( { git diff --name-only; git ls-files --others --exclude-standard; } | grep -v '^\.worker-logs/' || true ); printf '%s\n' "$files" | sed '/^$/d'; bad=$(printf '%s\n' "$files" | sed '/^$/d' | grep -vx "$allowed" || true); test -z "$bad"
```

Goal/tool actions:

- `create_goal` for this worker objective.
- `get_goal` immediately after goal setup.

## Verification Results

Passed:

```sh
for f in $(find packages/scheduler -name '*.js' -type f | sort); do node --check "$f"; done
node tests/smoke/import-entrypoints.mjs
node --test tests/conformance/test/scheduler-root-oracle.test.mjs tests/conformance/test/scheduler-variant-oracle.test.mjs tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/scheduler-post-task-oracle.test.mjs tests/conformance/test/scheduler-native-entry-oracle.test.mjs
npm run check:js
git diff --check
git diff --check --no-index /dev/null worker-progress/worker-144-scheduler-regression-refresh.md; rc=$?; test "$rc" -eq 1
scoped changed-path check allowing only worker-progress/worker-144-scheduler-regression-refresh.md, excluding pre-existing .worker-logs/
```

Focused scheduler conformance passed 61 tests. `npm run check:js` passed with
415 conformance tests. npm emitted only the existing `minimum-release-age`
warnings.

## Evidence Gathered

- `MASTER_PROGRESS.md` records workers 120, 125, 126, and 127 as merged and
  states that worker 127 integration passed `npm run check:js` with 415
  conformance tests.
- Worker 120 replaced the mock placeholder and regenerated the mock oracle with
  18 matching local comparisons.
- Worker 125 replaced post-task throwing stubs with Task Scheduling API-backed
  behavior and regenerated the post-task oracle with 12 matching local
  comparisons.
- Worker 126 replaced the native placeholder and regenerated the native-entry
  oracle with 14 matching local comparisons.
- Worker 127 updated the smoke harness for native scheduler entrypoints and
  restored `npm run check:js`.
- Current `packages/scheduler/package.json` remains workspace-specific and does
  not match the published scheduler metadata even though name/version and
  physical no-exports-map resolution are covered by smoke/oracle checks.
- Current oracle summaries confirm that root and variant oracles still lack
  Fast React comparison tracks, while mock, post-task, and native-entry oracles
  compare local behavior but keep compatibility claims false.
- Current smoke import tests pass and cover direct-file and installed-package
  scheduler entrypoints.
- Current scheduler-focused conformance and broad JS checks pass.
- Worker 128 and the reconciler source show internal root scheduling is a Rust
  data model and bridge recorder, not the public JS Scheduler package.

## Risks Or Blockers

- Broad `scheduler@0.27.0` compatibility is not claimable yet because every
  scheduler oracle intentionally keeps compatibility claims false.
- Root public scheduler behavior lacks a committed local-vs-oracle conformance
  comparison even though smoke behavior and worker 045 evidence are strong.
- Package metadata parity is the clearest remaining package-surface mismatch.
- Post-task behavior is proven only under controlled Node shims; real browser
  task ordering and raw timing remain open.
- Native behavior is proven only through Node-controlled fallback/delegation;
  React Native host integration remains open.
- Public Scheduler package regressions should not be used as proof that
  reconciler root rendering works. The internal root scheduler still stops
  before render, commit, host mutation, HostRoot queue processing, and
  `root.current` switching.

## Recommended Next Tasks

1. Add a committed root scheduler local-vs-`scheduler@0.27.0` comparison track
   to the root oracle, matching the later mock/post-task/native pattern.
2. Add a package metadata/deep-import comparison decision: either make local
   package metadata match the published scheduler package or document the
   supported workspace-specific metadata boundary explicitly in tests.
3. Keep public Scheduler priority constants, React lanes, React DOM event
   priorities, and reconciler callback priorities separated in future root
   render work.
4. Defer post-task browser ordering and native host runtime claims until there
   are real browser/React Native harnesses.
5. For root render, continue from the reconciler work-loop/commit slices rather
   than changing public `packages/scheduler` unless a concrete regression test
   fails.
