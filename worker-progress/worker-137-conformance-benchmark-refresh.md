# Worker 137 - Conformance And Benchmark Gate Refresh

## Summary

This is a report-only refresh for the first dual-run conformance and benchmark
gate needed before any root render/update/unmount compatibility claim.

Current result: **blocked**. The checked React DOM root render e2e oracle exists
and covers the right first fixture set, but Fast React observations are still
`unsupported-placeholder` and the checked artifact keeps
`fastReactBehaviorCompatible`, `fullDualRunOracleExists`, and
`compatibilityClaimed` false. Current package source also still exposes
placeholder `react-dom/client.createRoot`, `react-dom/client.hydrateRoot`, and
`react-dom.flushSync`. Root render/update/unmount compatibility must not be
claimed yet.

The first gate should be named `root-render-dual-run-gate-1` and should be a
fail-closed gate over:

- React DOM 19.2.6 root render/update/unmount e2e dual-run fixtures.
- Supporting React DOM public root, marker/listener, rootless `flushSync`, DOM
  mutation oracle, scheduler, and test-renderer canaries.
- Focused Rust internal gates for FiberRoot, HostRoot updates, root scheduler,
  commit/mutation, and test-renderer/fake-host paths.
- Benchmark admission state set to `blocked-by-conformance` until all required
  conformance evidence is green.

## Goal Setup Evidence

- `create_goal` called first with objective: "Produce a report-only refresh for the dual-run conformance and benchmark gates before any root render/update/unmount compatibility claim, writing only worker-progress/worker-137-conformance-benchmark-refresh.md".
- `get_goal` returned status `active` for the same objective.
- Goal thread id: `019e0f9e-4a3e-7800-82bf-007da3d7746f`.

## Progress Log

- Read `WORKER_BRIEF.md` after goal setup. It confirms the compatibility target is React/React DOM 19.2.6, the local React reference clone is `/Users/user/Developer/Developer/react-reference` at upstream tag `v19.2.6`, and this worker must only write this report file.

## Current Inputs

Documents inspected:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-074-benchmark-react-dom-baseline-plan.md`
- `worker-progress/worker-106-root-render-e2e-test-plan.md`
- `worker-progress/worker-117-root-render-implementation-sequencing-plan.md`
- `worker-progress/worker-121-root-render-e2e-oracle.md`
- current `package.json` and `tests/conformance/package.json`
- current root render, test-renderer, and scheduler conformance oracle source,
  test, and checked JSON files
- current `packages/react-dom/client.js`, `packages/react-dom/index.js`, and
  `crates/fast-react-reconciler/src/lib.rs`

Accepted current project state from `MASTER_PROGRESS.md`:

- Worker 121 added the React DOM root render/update/unmount e2e oracle.
- Workers 123, 124, and 128 added internal FiberRoot/HostRoot/update queue/root
  scheduler foundations.
- Current React DOM public package files still have placeholder root facades,
  so public Fast React root behavior remains absent.

## First Dual-Run Gate

Gate id: `root-render-dual-run-gate-1`.

Scope:

- Non-hydration `createRoot`.
- Host-only `root.render`, follow-up update, replacement, `render(null)`,
  `root.unmount`, double unmount, render-after-unmount error, and
  `flushSync`-backed same-callback cross-root synchronous commit.
- Development-only warning boundaries for duplicate root, render second
  argument, and unmount callback.

Required modes:

- `default-node-development`
- `default-node-production`

Primary fixture files:

- `tests/conformance/src/react-dom-root-render-e2e-targets.mjs`
- `tests/conformance/src/react-dom-root-render-e2e-scenarios.mjs`
- `tests/conformance/src/react-dom-root-render-e2e-probe-runner.mjs`
- `tests/conformance/src/react-dom-root-render-e2e-oracle-generator.mjs`
- `tests/conformance/src/react-dom-root-render-e2e-oracle.mjs`
- `tests/conformance/scripts/generate-react-dom-root-render-e2e-oracle.mjs`
- `tests/conformance/scripts/print-react-dom-root-render-e2e-oracle.mjs`
- `tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-dom-root-render-e2e-oracle.json`

Exact primary scenarios:

| Scenario id | Gate role |
| --- | --- |
| `create-root-no-render` | Root object shape, marker/listener side effects, and no child mutation before render. |
| `initial-host-render` | `flushSync(() => root.render(host element with text))` returns `undefined` and commits host output synchronously. |
| `update-host-render` | Second render updates host props and text under the same root. |
| `replace-host-tree` | Root child replacement records remove/place behavior. |
| `render-null-clears-container` | `root.render(null)` clears children while leaving the root live. |
| `root-unmount` | `root.unmount()` returns `undefined`, clears children, nulls `_internalRoot`, and clears the container marker. |
| `double-unmount` | Second unmount returns `undefined` and does no further mutation. |
| `render-after-unmount` | Later render throws `Cannot update an unmounted root.` |
| `flush-sync-cross-root-render` | One `flushSync` callback commits two roots before return. |
| `development-warning-boundaries` | Duplicate-root, render-argument, and unmount-argument warnings are development-only. |

Current checked artifact status:

- `realReactDomBehaviorCompared: true`
- `fastReactComparedToReactDom: true`
- `fastReactBehaviorCompatible: false`
- `fullDualRunOracleExists: false`
- `compatibilityClaimed: false`
- Every current Fast React comparison is `unsupported-placeholder`.

Gate pass criteria:

1. The checked root e2e artifact must compare the local Fast React public
   `react-dom` package against React DOM 19.2.6 for every scenario in both
   modes.
2. No required scenario may be `unsupported-placeholder`, `known-mismatch`,
   missing, skipped, timeout-only, or masked by a diagnostic-only status.
3. Public root behavior must route through the reconciler root, HostRoot update
   queue, root scheduler, commit path, and DOM mutation host. A facade-level DOM
   shortcut is a gate failure even if final DOM snapshots match.
4. The deterministic regeneration byte-compare must pass for the checked
   artifact.
5. Focused root e2e tests and the full conformance workspace must pass.
6. Internal Rust root/update/scheduler/commit tests must pass for the source
   slices that enable the public behavior.
7. Unsupported areas must remain explicitly unclaimed: hydration, events,
   controlled forms, Suspense/Activity, hooks/effects, class lifecycles, refs
   lifecycle, portals, resources, Fizz/server, browser layout/focus/selection,
   and custom element lifecycle behavior.

## Supporting Fixtures

React DOM supporting fixtures required before a root claim:

- `react-dom-client-root-oracle`: public `createRoot` validation, root object,
  options, render/unmount public lifecycle, profiling boundary, and
  placeholder comparison status.
- `react-dom-container-root-markers-oracle`: valid/invalid containers,
  duplicate root diagnostics, marker clearing on unmount, and no child mutation
  before render.
- `react-dom-root-listener-installation-oracle`: listener installation and
  root listener marker behavior. This is lifecycle side-effect evidence only;
  event dispatch remains separate.
- `react-dom-flush-sync-batching-oracle`: rootless `flushSync` callback,
  input, error, nesting, and public Scheduler observations. This is necessary
  but not sufficient for root commit timing.
- DOM mutation oracle set used by the host-only root path:
  `dom-attribute-property`, `dom-style-dangerous-html`, and
  `dom-namespace-svg`.

Test-renderer supporting fixtures:

- `react-test-renderer-root-lifecycle`: `renderer-object-shape`,
  `raw-create-act-boundary`, `create-update-unmount-flow`,
  `root-access-boundaries`, `get-instance-boundaries`,
  `create-node-mock-ref-lifecycle`, and `strict-and-concurrent-options`.
- `react-test-renderer-serialization`: `host-tree-json-and-tree`,
  `text-root-json-and-tree`, `empty-root-nullish-output`,
  `array-root-json-and-tree`, `activity-hidden-json-and-tree`,
  `composite-to-tree`, and `test-instance-find-basics`.
- `react-test-renderer-act`: especially
  `react-test-renderer-act-sync-update-flushing`,
  `react-test-renderer-act-scheduler-exposure`, and
  `react-test-renderer-act-unstable-flush-sync`.
- `react-test-renderer-error-surface`: unmounted root access, invalid inputs,
  query errors, shallow removal, and unsupported `use()` messages.

Current limitation: the test-renderer oracles probe real
`react-test-renderer@19.2.6` but do not compare a local Fast React JS
`react-test-renderer` package. They are canary targets and behavior references,
not compatibility proof by themselves.

Scheduler supporting fixtures:

- `scheduler-root-oracle`: export shape, task object shape, priority ordering,
  FIFO, delayed callbacks, cancellation, continuations, `didTimeout`,
  priority context APIs, yielding/paint/frame-rate, and Node `setImmediate`
  transport.
- `scheduler-mock-oracle`: deterministic mock scheduler virtual time, logs,
  task shape, priority context, flush helpers, delayed/expired work,
  continuations, paint yielding, and reset behavior. Current Fast React mock
  behavior is compared, but broad compatibility remains false.
- `scheduler-native-entry-oracle`: native file surface, wrapper loading,
  descriptors, fallback runtime, native runtime delegation, default-entry
  relationship, and direct native CJS loading.
- `scheduler-post-task-oracle`: post-task export shape, environment failures,
  priority context, controlled Task Scheduling API shim behavior,
  cancellation, and continuations.
- `scheduler-variant-oracle`: package metadata/resolution, `unstable_mock`,
  `unstable_post_task`, native fallback/delegation, and physical CJS deep
  imports.

Scheduler evidence alone is not root render evidence. It only gates the public
Scheduler package and the scheduler behavior the root scheduler must not
contradict.

## Benchmark Baseline

No `benchmarks/` directory or benchmark runner exists in this worktree. The
benchmark baseline remains the worker 074 report plan and should stay
fail-closed.

Pinned runtime baseline packages from worker 074:

- `react@19.2.6`
  - Tarball: `https://registry.npmjs.org/react/-/react-19.2.6.tgz`
  - Integrity:
    `sha512-sfWGGfavi0xr8Pg0sVsyHMAOziVYKgPLNrS7ig+ivMNb3wbCBw3KxtflsGBAwD3gYQlE/AEZsTLgToRrSCjb0Q==`
- `react-dom@19.2.6`
  - Tarball: `https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz`
  - Integrity:
    `sha512-0prMI+hvBbPjsWnxDLxlCGyM8PN6UuWjEUCYmZhO67xIV9Xasa/r/vDnq+Xyq4Lo27g8QSbO5YzARu0D1Sps3g==`
- `scheduler@0.27.0`
  - Tarball: `https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz`
  - Integrity:
    `sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==`

First benchmark admission state:

- Gate id required on every root benchmark manifest:
  `root-render-dual-run-gate-1`.
- Result status before the gate passes: `blocked-by-conformance`.
- Allowed lanes before profiling exists: `react-js-dev`, `react-js-prod`,
  `fast-react-dev`, and `fast-react-prod`.
- `react-js-profiling` and `fast-react-profiling` stay blocked until normal
  root behavior is green and profiling entrypoints have their own compatible
  behavior.
- Any root benchmark must use public `react-dom/client` and `react-dom`
  entrypoints, not Rust-only diagnostics or direct DOM shortcuts.

First benchmark fixture set after the gate is green:

- `root-lifecycle/create-root-no-render`: diagnostic only, no render speed
  claim.
- `root-lifecycle/initial-host-render`: host/text mount through
  `flushSync(() => root.render(...))`.
- `root-lifecycle/update-host-render`: same-root host prop/text update.
- `root-lifecycle/replace-host-tree`: remove/place behavior with host
  operation counts.
- `root-lifecycle/render-null-and-unmount`: live-root `render(null)`,
  unmount, double unmount, and marker cleanup.
- `root-lifecycle/cross-root-flush-sync`: two public roots committed inside
  one `flushSync` callback.

Minimum benchmark evidence:

- React and Fast React run in separate child processes with fresh module
  graphs, fresh DOM shim/container state, explicit `NODE_ENV`, and isolated
  output files.
- Each result records the conformance gate status beside timing.
- Metrics include mount/update/unmount phase times, DOM mutation counts,
  scheduler callback/flush counts, root marker/listener cleanup checks,
  p50/p95/p99/mean/stddev/sample count, warmups, discarded samples, timeouts,
  and environment metadata.
- A fast result with fewer required mutations, missing warnings, missing root
  cleanup, or placeholder behavior is a compatibility failure, not a speedup.

## CI And Check Commands

Current conformance scripts:

- Root `package.json`: `npm run check`, `npm run check:rust`,
  `npm run check:js`, `npm run test:conformance`.
- `tests/conformance/package.json`: `npm test` / `npm run check` run
  `node --test test/*.test.mjs`.
- The root-render e2e generator and printer are present as direct files but
  are not exposed through `tests/conformance/package.json` scripts.

Focused root gate commands:

```sh
node --test tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs
tmp=$(mktemp); node tests/conformance/scripts/generate-react-dom-root-render-e2e-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-react-dom-root-render-e2e-oracle.json "$tmp"; rc=$?; rm -f "$tmp"; exit $rc
```

Supporting conformance commands:

```sh
node --test \
  tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs \
  tests/conformance/test/react-test-renderer-root-lifecycle-oracle.test.mjs \
  tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs \
  tests/conformance/test/react-test-renderer-act-oracle.test.mjs \
  tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs \
  tests/conformance/test/scheduler-root-oracle.test.mjs \
  tests/conformance/test/scheduler-mock-oracle.test.mjs \
  tests/conformance/test/scheduler-native-entry-oracle.test.mjs \
  tests/conformance/test/scheduler-post-task-oracle.test.mjs
npm test --workspace @fast-react/conformance
```

Implementation-gate commands before any compatibility claim:

```sh
cargo fmt --all --check
cargo test -p fast-react-core --all-features
cargo test -p fast-react-reconciler --all-features
cargo test -p fast-react-test-renderer --all-features
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings
npm run check:js
npm run check
```

Report-scope hygiene commands for this worker:

```sh
git diff --check
git status --short --untracked-files=all -- worker-progress/worker-137-conformance-benchmark-refresh.md
```

## Evidence Enough For A Claim

Enough for a **scoped** root render/update/unmount claim:

- `root-render-dual-run-gate-1` passes for all ten primary scenarios in both
  required modes.
- The checked root e2e artifact contains real Fast React observations through
  public `react-dom` package entrypoints, all required comparisons match React
  DOM 19.2.6, and no comparison is placeholder, skipped, missing, timeout-only,
  or known mismatch.
- Focused supporting root, test-renderer, and scheduler oracle tests pass.
- Full conformance workspace passes.
- Focused Rust internals prove HostRoot update payloads, lane selection, root
  scheduling, sync flush across roots, commit ordering, DOM mutation host
  operations, and cleanup.
- `npm run check:js` and the full root `npm run check` pass.
- Benchmark manifests record the green conformance gate, but performance
  dashboards still label this as a narrow host-only root path.

Not enough:

- The current checked root e2e artifact as-is, because Fast React comparisons
  are `unsupported-placeholder` and compatibility claims are false.
- React-only oracle evidence without a local Fast React dual run.
- Passing `scheduler`, `scheduler/unstable_mock`, or scheduler native/post-task
  oracles alone.
- Passing rootless `flushSync` behavior without committed root work.
- DOM snapshots that match because `root.render` directly mutates DOM outside
  FiberRoot, HostRoot queue, scheduler, work loop, and commit.
- Test-renderer React-only root lifecycle/serialization/act/error oracle
  results without a local Fast React test-renderer package comparison.
- Any benchmark timing while the benchmark status is `blocked-by-conformance`.
- Any evidence involving deterministic DOM shims presented as browser layout,
  focus, selection, parser, CSS cascade, or custom-element lifecycle parity.

## Evidence Gathered

- The root render e2e checked artifact records React DOM 19.2.6 observations
  for the ten required scenarios in development and production, but current
  Fast React comparisons are unsupported placeholders and compatibility remains
  unclaimed.
- Current `packages/react-dom/client.js` exports placeholder `createRoot` and
  `hydrateRoot`; current `packages/react-dom/index.js` exports placeholder
  `flushSync`.
- Current `crates/fast-react-reconciler/src/lib.rs` exports FiberRoot,
  HostRoot update, root scheduler, update priority, and work-in-progress
  foundations, while the public mutation render entry point remains a loud
  unimplemented placeholder.
- `tests/conformance/package.json` only exposes generic `check` / `test` plus
  older oracle scripts; root render e2e generation currently requires direct
  `node tests/conformance/scripts/generate-react-dom-root-render-e2e-oracle.mjs`.
- Focused root/test-renderer/scheduler oracle run passed 105 tests.
- Full conformance workspace run passed 415 tests.
- No benchmark harness directory exists in the current worktree.

## Commands Run

```sh
sed -n '1,220p' WORKER_BRIEF.md
ls -la worker-progress && (test -f worker-progress/worker-137-conformance-benchmark-refresh.md && sed -n '1,220p' worker-progress/worker-137-conformance-benchmark-refresh.md || true)
test -e worker-progress/worker-137-conformance-benchmark-refresh.md; printf '%s\n' $?
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,280p' MASTER_PROGRESS.md
sed -n '1,260p' package.json
rg --files | rg '(^|/)package.json$|conformance|benchmark|bench'
sed -n '1,260p' tests/conformance/package.json
sed -n '1,260p' tests/conformance/README.md
sed -n '1,260p' worker-progress/worker-074-benchmark-react-dom-baseline-plan.md
sed -n '1,260p' worker-progress/worker-106-root-render-e2e-test-plan.md
sed -n '261,620p' worker-progress/worker-106-root-render-e2e-test-plan.md
sed -n '1,320p' worker-progress/worker-117-root-render-implementation-sequencing-plan.md
sed -n '1,260p' worker-progress/worker-121-root-render-e2e-oracle.md
sed -n '1,260p' tests/conformance/src/react-dom-root-render-e2e-scenarios.mjs
sed -n '1,320p' tests/conformance/src/react-dom-root-render-e2e-oracle.mjs
sed -n '1,320p' tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs
sed -n '1,260p' tests/conformance/src/react-dom-root-render-e2e-targets.mjs
sed -n '1,260p' tests/conformance/src/react-dom-root-render-e2e-oracle-generator.mjs
sed -n '321,680p' tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs
sed -n '1,260p' packages/react-dom/client.js
sed -n '1,280p' packages/react-dom/index.js
sed -n '1,320p' crates/fast-react-reconciler/src/lib.rs
rg -n "createRoot|flushSync|update_container|FiberRoot|HostRoot|flush_sync|commit|root scheduler|unsupported|placeholder" packages crates tests/conformance/src tests/conformance/test | sed -n '1,260p'
find . -maxdepth 3 -type d \( -name 'bench*' -o -name 'benchmark*' \) -print | sort
rg -n 'benchmark|bench|baseline|react-js-dev|react-js-prod|blocked-by-conformance|headline|gate|React 19\.2\.6 Baseline|Runner Isolation|Scenario Plan|When Not To Benchmark' worker-progress/worker-074-benchmark-react-dom-baseline-plan.md | sed -n '1,260p'
sed -n '260,620p' worker-progress/worker-074-benchmark-react-dom-baseline-plan.md
rg -n 'react-dom-root-render-e2e|client-root|flush-sync|test-renderer|scheduler|conformanceClaims|unsupported-placeholder|Fast React compatibility|fullDualRunOracleExists|compatibilityClaimed' tests/conformance/src tests/conformance/test tests/conformance/oracles | sed -n '1,320p'
for f in tests/conformance/src/react-test-renderer-*-scenarios.mjs tests/conformance/src/scheduler-*-scenarios.mjs; do [ -f "$f" ] && printf '\n%s\n' "$f" && sed -n '1,220p' "$f"; done
for f in tests/conformance/src/react-test-renderer-*-targets.mjs tests/conformance/src/scheduler-*-targets.mjs; do [ -f "$f" ] && printf '\n%s\n' "$f" && sed -n '1,180p' "$f"; done
rg -n 'conformanceClaims|fullDualRunOracleExists|compatibilityClaimed|unsupported-placeholder|matched-but|known-mismatch|unstable_flushSync|root|scheduler|scenario|mode|ReactTestRenderer|fastReact' tests/conformance/test/react-test-renderer-*.test.mjs tests/conformance/test/scheduler-*.test.mjs | sed -n '1,360p'
node -e "const fs=require('fs'); for (const f of ['tests/conformance/oracles/react-19.2.6-react-test-renderer-root-lifecycle-oracle.json','tests/conformance/oracles/react-19.2.6-react-test-renderer-serialization-oracle.json','tests/conformance/oracles/react-19.2.6-react-test-renderer-act-oracle.json','tests/conformance/oracles/react-19.2.6-react-test-renderer-error-surface-oracle.json','tests/conformance/oracles/scheduler-0.27.0-root-oracle.json','tests/conformance/oracles/scheduler-0.27.0-mock-oracle.json','tests/conformance/oracles/scheduler-0.27.0-variant-oracle.json','tests/conformance/oracles/scheduler-0.27.0-native-entry-oracle.json','tests/conformance/oracles/scheduler-0.27.0-post-task-oracle.json']) { const o=JSON.parse(fs.readFileSync(f,'utf8')); console.log('\n'+f); console.log({oracleKind:o.oracleKind, claims:o.conformanceClaims, modes:(o.probeModes||o.modes||[]).map(m=>m.id||m), scenarios:(o.scenarios||[]).map(s=>s.id||s), coverage:o.coverage, evidence:o.evidenceClaims}); }"
node -e "const fs=require('fs'); const f='tests/conformance/oracles/react-19.2.6-react-dom-root-render-e2e-oracle.json'; const o=JSON.parse(fs.readFileSync(f,'utf8')); console.log({oracleKind:o.oracleKind, claims:o.conformanceClaims, modes:o.probeModes.map(m=>m.id), scenarios:o.scenarios.map(s=>s.id), coverage:o.coverage, evidence:o.evidenceClaims, intentionalGaps:o.intentionalGaps.map(g=>g.id)});"
node --test tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs tests/conformance/test/react-test-renderer-root-lifecycle-oracle.test.mjs tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs tests/conformance/test/react-test-renderer-act-oracle.test.mjs tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs tests/conformance/test/scheduler-root-oracle.test.mjs tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/scheduler-native-entry-oracle.test.mjs tests/conformance/test/scheduler-post-task-oracle.test.mjs
npm test --workspace @fast-react/conformance
git status --short --untracked-files=all
rg -n '[ \t]$|^(<<<<<<<|=======|>>>>>>>)' worker-progress/worker-137-conformance-benchmark-refresh.md
git diff --check
out=$(git diff --check --no-index /dev/null worker-progress/worker-137-conformance-benchmark-refresh.md 2>&1 || true); if [ -n "$out" ]; then printf '%s\n' "$out"; exit 1; fi
git status --short --untracked-files=all -- worker-progress/worker-137-conformance-benchmark-refresh.md
{ git diff --name-only; git ls-files --others --exclude-standard -- worker-progress/worker-137-conformance-benchmark-refresh.md; } | sort -u
```

Tool actions:

- `create_goal`
- `get_goal`
- `apply_patch` for this report file only

## Verification

Passed:

```sh
node --test tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs tests/conformance/test/react-test-renderer-root-lifecycle-oracle.test.mjs tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs tests/conformance/test/react-test-renderer-act-oracle.test.mjs tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs tests/conformance/test/scheduler-root-oracle.test.mjs tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/scheduler-native-entry-oracle.test.mjs tests/conformance/test/scheduler-post-task-oracle.test.mjs
```

Result: 105 tests passed.

Passed:

```sh
npm test --workspace @fast-react/conformance
```

Result: 415 tests passed.

Passed:

```sh
git diff --check
```

Passed after trimming one extra EOF blank line caught by the first no-index
run:

```sh
out=$(git diff --check --no-index /dev/null worker-progress/worker-137-conformance-benchmark-refresh.md 2>&1 || true); if [ -n "$out" ]; then printf '%s\n' "$out"; exit 1; fi
```

Scoped changed-path check:

```sh
git status --short --untracked-files=all -- worker-progress/worker-137-conformance-benchmark-refresh.md
{ git diff --name-only; git ls-files --others --exclude-standard -- worker-progress/worker-137-conformance-benchmark-refresh.md; } | sort -u
```

Result: only `worker-progress/worker-137-conformance-benchmark-refresh.md`
appears in the scoped report-file audit.

Broad status also shows the tmux worker log
`.worker-logs/worker-137-conformance-benchmark-refresh.log` as untracked; it is
not part of this report deliverable or scoped audit.

## Risks Or Blockers

- Root public package behavior is still placeholder-backed.
- The primary root e2e oracle currently proves the target behavior and
  placeholder boundary, not Fast React compatibility.
- Test-renderer conformance remains React-only until a local JS
  `react-test-renderer` compatibility package or equivalent dual-run adapter
  exists.
- Benchmark tooling is not present yet and must be fail-closed when introduced.
- The deterministic DOM shim is not browser evidence.
- Any future root benchmark can accidentally hide missing work if it times a
  shortcut path, direct DOM mutation, or Rust-only diagnostic.

## Recommended Next Tasks

- Implement public root behavior only after the internal FiberRoot, HostRoot
  update queue, scheduler, work loop, commit, and DOM host paths are wired.
- Update/regenerate the root e2e oracle only when Fast React can run the same
  public scenarios; keep claims false until all comparisons pass.
- Add package scripts for root e2e oracle generation/printing if the
  conformance package wants script parity with older oracle families.
- Add fail-closed benchmark manifest/schema/gate-checker work before adding any
  timing runner.
- Add root lifecycle benchmark manifests as blocked definitions only after the
  gate vocabulary exists.

## Changed Files

- `worker-progress/worker-137-conformance-benchmark-refresh.md`
