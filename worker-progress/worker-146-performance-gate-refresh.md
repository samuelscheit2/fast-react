# Worker 146 Performance Gate Refresh

## Goal Setup Evidence

- `create_goal` was the first action for this worker.
- `get_goal` was called immediately after goal creation.
- Goal thread: `019e0f9f-53b0-7270-b932-3a205a3ec767`
- Objective: Produce a report-only refresh for performance and profiling gates needed to show Fast React is faster without compromising compatibility evidence.
- Status after setup: `active`
- Report timestamp context: 2026-05-10, Europe/Berlin

## Summary

Fast React should not publish a speed claim from any path whose covered semantics are still unknown, unsupported, or only placeholder-backed. The first performance harnesses should therefore be admitted as a conformance-gated measurement stack:

1. Manifest and result schema gate: no timing claim, only scenario admission and status vocabulary.
2. Public package diagnostic harness: Node child-process measurements for package load and currently oracle-covered React public APIs, labeled diagnostic unless the covered compatibility claim is explicitly green.
3. Scheduler and root diagnostic harness: logical scheduler/root counters using existing Rust and Scheduler evidence, not user-facing renderer performance.
4. Test-renderer operation harness: first renderer-like harness once HostRoot render, commit, serialization, `act`, and error-surface gates are green.
5. React DOM jsdom harness: first DOM public-path harness once client roots, scheduler/update, DOM mutation, events, refs, and teardown gates are green.
6. Browser trace harness: headline-capable only after jsdom and browser-specific behavior gates are green and React/Fast React profiling lanes match.
7. Native boundary/Rust internal harnesses: diagnostic only unless they are included as a breakdown beside a public JS package result.

Compatibility evidence and benchmark evidence must stay separate in the result model. Conformance oracles may say "observed match", "known mismatch", or "compatibility claim false"; benchmark output may say "diagnostic timing" or "comparable timing". Only the intersection of a green compatibility gate and a stable comparable timing gate can produce "Fast React is faster" language.

## Evidence Gathered

Read-only project context:

- `WORKER_BRIEF.md` confirms the target versions, source-reference clone, worker rules, and requirement to record goal status before reading project files.
- `MASTER_PLAN.md` places M8 conformance/benchmark harness as active and M9 performance profiling as future, with worker 146 report-only.
- `MASTER_PROGRESS.md` confirms accepted history through worker 128 and the latest accepted verification using Rust gates plus `npm run check:js`.
- `worker-progress/worker-009-benchmark-strategy.md` already establishes the central rule: benchmarks fail closed when conformance evidence is absent or failing.
- `worker-progress/worker-074-benchmark-react-dom-baseline-plan.md` already establishes React DOM-specific admission gates, runner isolation, metrics, and scenario staging.
- `Cargo.toml` shows a Rust workspace with `fast-react-core`, `fast-react-host-config`, `fast-react-reconciler`, `fast-react-test-renderer`, and `fast-react-napi`; there are no Rust `benches/` or benchmark dependencies today.
- `package.json` exposes current gates: `npm run check`, `check:rust`, `check:js`, `test`, `test:smoke`, `test:conformance`, and `build:native`.
- `tests/conformance/package.json` runs `node --test test/*.test.mjs`; direct oracle generator/print scripts live under `tests/conformance/scripts`.
- `rg --files -g 'benchmarks/**' -g 'benches/**' -g 'criterion.toml'` returned no files, so no benchmark harness exists yet.
- `packages/react-dom/profiling.js` currently exports placeholder/unsupported React DOM profiling functions, not a real profiling renderer path.
- `packages/react/index.js`, `crates/fast-react-core/src/symbols.rs`, and `crates/fast-react-core/src/fiber.rs` expose Profiler symbols/tags and `FiberMode::PROFILE`, but there is no end-to-end Profiler timing path yet.
- `crates/fast-react-reconciler/src/root_scheduler.rs` and `scheduler_bridge.rs` already record scheduler callback, cancellation, and microtask requests that can seed non-headline diagnostic counters.
- `crates/fast-react-napi/src/lib.rs` marks the Node-API boundary as a placeholder; native boundary timings are not yet product-comparable.

Verification evidence:

- `npm run test:conformance` passed with 415 tests, 415 passes, 0 failures, and duration `1043.112292ms`.
- npm emitted the existing local warning `Unknown user/env config "minimum-release-age"`; the conformance run still completed successfully.

## First Benchmark Harnesses

### Harness 0: Manifest And Gate Preflight

Purpose:

- Define benchmark scenario metadata before timing code exists.
- Read conformance gate status and refuse speedup output for blocked or diagnostic scenarios.
- Produce one result status per implementation/lane/scenario: `blocked-by-conformance`, `diagnostic-only`, `compared-not-compatible`, `comparable`, `noise-bound`, `regression`, or `improvement`.

First inputs:

- Root scripts: `npm run test:conformance`, `npm run test:smoke`, `npm run check:js`, `npm run check:rust`.
- Oracle artifacts under `tests/conformance/oracles`.
- A future manifest field that names the relevant oracle/test file, semantic area, implementation entrypoint, runtime lane, profiler hooks, and required counters.

Claim boundary:

- This harness never says Fast React is faster. It only decides whether a benchmark case may be timed, blocked, or reported as diagnostic.

### Harness 1: Public Package Diagnostics

Purpose:

- Measure import/load, element creation, children traversal, ref/context/wrapper object helpers, Scheduler public package operations, and currently oracle-covered public package paths through the same JS entrypoints users import.
- Use one child process per implementation/lane/scenario to avoid module cache, `NODE_ENV`, condition-resolution, and global Scheduler leakage.

Allowed first scenarios:

- `react` public API diagnostics where Fast React already has comparison observations, such as element object, children helper, ref object, context object, component class, forwardRef, and wrapper object.
- Scheduler diagnostics for root, mock, post-task, native-entry, and variant surfaces where current oracles already separate observed matches from broad compatibility.
- React DOM package/export diagnostics, including `react-dom/profiling` load shape, only as package-surface timings.

Required assertions before timing:

- The scenario's oracle test passes.
- The result records the oracle's compatibility claim separately from timing.
- Placeholder unsupported paths are marked `unsupported-placeholder`, not `faster`.

Claim boundary:

- Import or facade timings are package diagnostics. They are not React render performance, React DOM performance, or compatibility claims.

### Harness 2: Scheduler And Root Diagnostics

Purpose:

- Measure lane selection, root schedule insertion, callback reuse/cancellation, sync flush planning, and scheduler bridge request volume once the active root-render foundation can produce stable records.

Counters:

- Pending lanes, next lanes, event priority, callback priority, scheduler priority, callback-node reuse, cancellation count, microtask request count, sync flush plan count, and cross-root scheduling count.

Required assertions before timing:

- Focused Rust tests for the exact scheduler/root slice pass.
- Public Scheduler conformance stays green.
- The diagnostic result states whether it covers internal Rust-only behavior, public Scheduler behavior, or a future public root path.

Claim boundary:

- Rust-only scheduler/root numbers can explain architecture cost. They cannot headline "Fast React versus React" because React's equivalent path includes JS package and renderer boundary behavior.

### Harness 3: Test Renderer Operation Harness

Purpose:

- Provide the first renderer-like benchmark with deterministic host operation logs and serialization, before DOM/browser noise enters the system.

Admit only after:

- HostRoot render, minimal commit, sync flush/act routing, test-renderer root lifecycle, serialization, act, and error-surface implementation gates are green.
- React test renderer 19.2.6 oracles for export, root lifecycle, serialization, `act`, and error surface are mapped into scenario manifests.

First scenarios:

- Static mount, update, render-null, unmount, repeated unmount, root serialization, nested host text, ref attach/detach, error during render, and effect/act flush once those semantics exist.

Required assertions before timing:

- Operation sequence, serialized output, root object behavior, warning/error behavior, and teardown all match the oracle expectations for the chosen lane.

Claim boundary:

- Test renderer results can support "test renderer path faster" only after all covered test renderer gates are compatible. They still do not imply React DOM or native renderer performance.

### Harness 4: React DOM jsdom Harness

Purpose:

- Measure public `react-dom` and `react-dom/client` paths in Node/jsdom once the DOM adapter is real enough to compare root render/update/unmount and host mutations.

Admit only after:

- Client root object, root scheduler/update, DOM mutation host, attribute/style/namespace/dangerous HTML, refs, events/root listeners, controlled inputs, portals, and teardown gates are green for the covered scenario.

First scenarios:

- `createRoot` no-render side effects, initial render, update, render-null, unmount, duplicate-root warning, keyed list update, text update, style/attribute update, ref attach/detach, portal container listener setup, and controlled input update once each gate is green.

Required assertions before timing:

- DOM snapshot, listener/root markers, host operation counts, ref/effect ordering, warnings/errors, and cleanup all match the React 19.2.6 oracle for the selected mode.

Claim boundary:

- jsdom results are Node/jsdom DOM measurements. They cannot be reported as browser layout/paint performance.

### Harness 5: Browser Trace Harness

Purpose:

- Collect browser Performance traces and React Performance tracks for DOM/app scenarios in a real browser.

Admit only after:

- The matching jsdom scenario is green.
- Browser-only behavior is covered: event propagation, focus/selection, layout-sensitive form behavior, hydration/replay, resources, and singleton behavior where relevant.
- React and Fast React have matching dev/prod/profiling lanes.

First scenarios:

- Small interaction apps: editable list, controlled input, table sort/filter, transition search, portal modal, Suspense reveal, and hydration page. Each app must expose deterministic mount, update, interaction, and teardown scripts.

Required artifacts:

- Browser trace, user timing marks, React profiling data where applicable, host operation count, boundary count, environment metadata, and root-cause summary for any threshold-crossing result.

Claim boundary:

- Browser results can headline only for the exact app/scenario/lane whose compatibility gates passed.

### Harness 6: Native Boundary And Rust Internal Diagnostics

Purpose:

- Measure N-API no-op calls, JS-to-Rust value marshaling, Rust-to-JS callbacks, host operation batching, allocation cost, and core Rust algorithms.

Admit only after:

- The native binding stops being a placeholder and has conformance tests for loading, error propagation, callback lifetime, ownership/finalizer behavior, and value conversion.

First scenarios:

- N-API no-op call, string/symbol conversion, prop object conversion, array children conversion, JS callback invocation, batched host operation serialization, fiber arena allocation, lane/root-lane operations, update queue operations, and host operation recorder serialization.

Claim boundary:

- These are diagnostic breakdowns. They can explain why a public result is faster or slower, but they do not independently compare Fast React to React.

## Comparison Baselines

Pinned runtime baselines:

- `react@19.2.6`
- `react-dom@19.2.6`
- `scheduler@0.27.0`
- `react-test-renderer@19.2.6` for test renderer scenarios.
- `react-is@19.2.6` where test renderer package evidence requires it.
- `@types/react@19.2.14` and current React DOM declarations only for TypeScript fixture gates, not runtime performance baselines.

Baseline lanes:

- `react-js-dev`: published React package, `NODE_ENV=development`.
- `react-js-prod`: published React package, `NODE_ENV=production`.
- `react-js-profiling`: published React profiling-capable path when Profiler or React Performance tracks are required.
- `fast-react-js-dev`: Fast React public JS package path in development mode.
- `fast-react-js-prod`: Fast React public JS package path in production mode.
- `fast-react-js-profiling`: Fast React public JS package path with equivalent profiling hooks and overhead.
- `fast-react-rust-diagnostic`: internal Rust measurements only, with no React speedup claim.
- `fast-react-native-boundary-diagnostic`: native boundary measurements only, with no React speedup claim.

Isolation rules:

- React and Fast React run in separate processes.
- Each process has a fresh module graph, fresh globals, fresh DOM container/document when relevant, and explicit `NODE_ENV`.
- Import/setup time is only included in scenarios that declare startup/import measurement.
- Baseline package tarballs, integrity hashes, lockfile hash, Node/npm versions, Rust version, OS/CPU, runner type, and git commit must be recorded in every result.
- jsdom and browser runners never share result lanes.

## Profiler Hooks

JS and Node hooks:

- `node:perf_hooks` marks/measures around setup, oracle assertion, warmup, measured mount/update/unmount, effect flush, and teardown.
- `PerformanceObserver` for marks/measures when the runner keeps events instead of manual duration math.
- `process.hrtime.bigint()` only for narrow internal runner timing, with conversion and timer source recorded.
- Optional `--expose-gc` with explicit GC policy recorded before/after warmup or samples, not hidden.
- `process.resourceUsage()`, `process.memoryUsage()`, and `v8.getHeapStatistics()` snapshots for diagnostic allocation pressure.

React hooks:

- `<Profiler onRender>` for renderer/app scenarios once the renderer supports it, recording id, phase, actual duration, base duration, start time, commit time, and nested update phase where present.
- React production profiling build only in the profiling lane; do not compare profiling results to non-profiling production results.
- Development StrictMode and warning behavior must remain lane-specific because they affect both work and timings.

Browser hooks:

- Performance marks/measures around deterministic app phases.
- Chrome/Browser trace artifacts for render, commit, effects, event handling, and layout/paint-sensitive cases.
- React Performance tracks only in development/profiling lanes where the baseline exposes them.

Fast React Rust hooks:

- Phase counters around lane selection, root scheduling, begin/complete work, commit mutation/layout/passive phases, host operation recording, and serialization.
- Rust CPU and allocation profiles using platform tooling when a result crosses a threshold.
- Scheduler bridge counters already present in `SchedulerBridge`: callback requests, cancellation records, and microtask requests.

Boundary hooks:

- JS-to-Rust call count, Rust-to-JS callback count, object/property reads/writes, string/symbol creation, serialized payload bytes, external memory bytes, handle-scope churn, finalizer count, host operation batch count, and elapsed time per crossing group.

## Measurement Pitfalls

- Missing semantics can look faster. A skipped effect, ref, warning, host mutation, event listener, hydration step, or boundary conversion invalidates the speed claim.
- Placeholder unsupported functions can be very fast. Unsupported-error construction and package facade loading must not be labeled renderer performance.
- Fewer host operations can be a bug. Host operation count differences need oracle-backed explanation before being treated as an optimization.
- Rust-only paths omit JS package resolution, value conversion, N-API/WASM overhead, renderer callbacks, and user-observable scheduling behavior.
- No-op renderer timings hide commit and host work.
- Development, production, and profiling lanes have different work and overhead.
- jsdom and real browsers differ in layout, focus, event dispatch, timers, microtasks, and tracing.
- `NODE_ENV`, condition resolution, module cache, globals, scheduler state, DOM listener markers, and root internals leak if React and Fast React share a process.
- Warmup, JIT tiering, GC, CPU frequency, thermal state, and background work can dominate microbenchmarks.
- Timer precision and logical-time shims are useful for conformance but not interchangeable with wall-clock performance.
- React `act`, passive effects, transitions, Suspense, hydration, and StrictMode development replay can move work outside the obvious render call.
- Profiling instrumentation adds overhead and must be compared only against an equivalent profiling lane.
- TypeScript/declaration compatibility is separate from runtime behavior and should not block runtime timings unless the scenario compiles fixtures as part of its declared surface.

## Merge Gates

Gate 0: Scenario Admission

- Scenario has a manifest, stable id, version, lane, runner type, public entrypoints, conformance gates, profiler requirements, metrics, and status policy.
- Scenario without a React 19.2.6 oracle lands only as `diagnostic-only`.

Gate 1: Compatibility Preflight

- Required oracle tests and targeted implementation tests pass before timing.
- If an oracle records `fastReactBehaviorCompatible: false`, the timing result cannot be headline even if individual observations match.
- Known incomplete areas are `blocked-by-conformance`, not `faster`.

Gate 2: Same Path And Same Mode

- React and Fast React use equivalent public entrypoints and matching dev/prod/profiling lanes.
- Internal Rust/native measurements appear only as breakdowns or diagnostics.

Gate 3: Required Counters And Artifacts

- Host operation counts and boundary counters are present when the scenario crosses host or native boundaries.
- Profiler artifacts are present for any renderer/app result that claims a threshold-crossing improvement or regression.

Gate 4: Statistical Stability

- Result includes warmup count, sample count, discarded samples, p50, p95, p99, mean, standard deviation, relative margin, timeout count, GC policy, and environment metadata.
- Noise-bound cases remain diagnostic until stable.
- Thresholds use both absolute time and percentage change.

Gate 5: Claim Review

- Benchmark dashboard displays semantic status beside timing status.
- Any "faster" claim names the exact scenario, runner, lane, baseline package versions, commit, and profiler explanation.
- Compatibility claims continue to come only from conformance evidence, not benchmark results.

Gate 6: CI And Merge Checks

- Harness/tooling PRs must run `npm run test:conformance`, relevant smoke/workspace checks, `cargo fmt --all --check`, relevant Rust tests/clippy where Rust code changes, `git diff --check`, and a scoped changed-path audit.
- Report-only refreshes like this worker must run `git diff --check` and a scoped check proving only the assigned report file changed.

## Recommended Next Tasks

1. Add benchmark manifest and result schema with explicit semantic status and timing status fields.
2. Add a gate checker that reads scenario manifests and conformance status, then fails closed for missing/red gates.
3. Add an exact React 19.2.6 baseline lock/install area with integrity verification for React, React DOM, Scheduler, React Test Renderer, and related packages.
4. Add a child-process public package diagnostic runner with `node:perf_hooks` and fresh module graphs.
5. Add blocked scenario manifests for test renderer root/serialization/act/error cases, then unblock only after implementation gates are green.
6. Add blocked scenario manifests for React DOM root lifecycle, DOM mutation, events, refs, forms, portals, hydration, and resources.
7. Add boundary counter requirements before native binding implementation so N-API design choices are measurable from the start.
8. Add dashboard/report formatting that always shows compatibility status next to timing status.

## Risks Or Blockers

- Real render benchmarks remain blocked until HostRoot render, commit, host mutation, test renderer, and React DOM integration slices land.
- `react-dom/profiling` is currently a placeholder path, so profiling-entry timings would be facade diagnostics only.
- Native boundary profiling is blocked by `fast-react-napi` being a placeholder.
- Existing conformance artifacts intentionally keep many Fast React compatibility claims false; this is correct and must not be papered over by benchmark wording.
- A benchmark harness that defaults to permissive timing will recreate the original invalid-speedup risk.

## Commands Run

```sh
pwd && rg --files | rg '^(WORKER_BRIEF\.md|MASTER_PLAN\.md|MASTER_PROGRESS\.md|Cargo\.toml|package\.json|worker-progress/worker-(009-benchmark-strategy|074-benchmark-react-dom-baseline-plan|146-performance-gate-refresh)\.md)$'
test -f worker-progress/worker-146-performance-gate-refresh.md && sed -n '1,200p' worker-progress/worker-146-performance-gate-refresh.md || true
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-009-benchmark-strategy.md
sed -n '1,280p' worker-progress/worker-074-benchmark-react-dom-baseline-plan.md
sed -n '281,420p' worker-progress/worker-074-benchmark-react-dom-baseline-plan.md
sed -n '1,260p' package.json
sed -n '1,260p' Cargo.toml
rg -n '"scripts"|check:|test|conformance|oracle|bench|benchmark|profile|profil|perf|criterion|vitest|node --test|cargo test|cargo bench|playwright|jsdom' --glob '!ORCHESTRATOR.md' --glob '!target/**' --glob '!node_modules/**'
rg --files -g '*test*' -g '*conformance*' -g '*oracle*' -g '*bench*' -g '*profile*' -g '*perf*' -g 'scripts/**' -g 'packages/**' -g 'crates/**' -g 'tests/**' | sort
rg --files -g 'package.json' | sort
sed -n '1,220p' tests/conformance/package.json
sed -n '1,180p' bindings/node/package.json
sed -n '1,180p' packages/react/package.json && sed -n '1,180p' packages/react-dom/package.json && sed -n '1,180p' packages/scheduler/package.json
for f in crates/*/Cargo.toml; do printf '\n## %s\n' "$f"; sed -n '1,220p' "$f"; done
rg --files -g 'benchmarks/**' -g 'benches/**' -g 'criterion.toml' -g '.github/workflows/**' | sort
rg -n 'test\(|describe\(|node --test|conformanceClaims|evidenceClaims|behaviorCompatibilityClaimed|fastReactCompared|performance|Profiler|profiling|unstable_Profiling' tests/conformance/test tests/conformance/src tests/smoke bindings/node/test packages/react packages/react-dom packages/scheduler crates --glob '!target/**'
rg -n 'Profiler|profiling|performance|unstable_Profiling|actualDuration|baseDuration|commitTime|startTime|scheduler|lane|callback|yield|flushSync|act|root render|root scheduler' packages tests/conformance/src tests/conformance/test crates --glob '!target/**'
sed -n '1,120p' packages/react-dom/profiling.js
sed -n '1,120p' packages/react/index.js
sed -n '1,170p' crates/fast-react-core/src/symbols.rs && sed -n '1,130p' crates/fast-react-core/src/fiber.rs
sed -n '1,220p' crates/fast-react-reconciler/src/root_scheduler.rs && sed -n '1,220p' crates/fast-react-reconciler/src/scheduler_bridge.rs
sed -n '1,220p' crates/fast-react-napi/src/lib.rs
npm run test:conformance
git status --short --untracked-files=all -- worker-progress/worker-146-performance-gate-refresh.md
git diff --check --no-index -- /dev/null worker-progress/worker-146-performance-gate-refresh.md
git diff --check
git status --short --untracked-files=all
changed=$(git status --short --untracked-files=all | awk '{print $2}'); printf '%s\n' "$changed"; test "$changed" = 'worker-progress/worker-146-performance-gate-refresh.md'
scoped=$(git status --short --untracked-files=all -- worker-progress/worker-146-performance-gate-refresh.md); printf '%s\n' "$scoped"; test "$scoped" = '?? worker-progress/worker-146-performance-gate-refresh.md'
git diff --check --no-index -- /dev/null worker-progress/worker-146-performance-gate-refresh.md >/tmp/worker146-diff-check.out 2>&1; code=$?; cat /tmp/worker146-diff-check.out; test "$code" -eq 1 && test ! -s /tmp/worker146-diff-check.out
```

Notes:

- The broad `rg` scans were intentionally read-only and included `--glob '!ORCHESTRATOR.md'`.
- The initial `git diff --check --no-index` probe found a blank line at EOF in the stub report; this full report replaces that stub before final verification.
- The global untracked-path check also showed `.worker-logs/worker-146-performance-gate-refresh.log`, which is outside this worker's write scope and was left untouched. The scoped allowed report path check passed.

## Changed Files

- `worker-progress/worker-146-performance-gate-refresh.md`

## Quality, Maintainability, Performance, And Security Review

Quality:

- The report keeps speedup claims blocked unless conformance and timing gates are both green.
- It separates package diagnostics, renderer benchmarks, browser traces, native boundary measurements, and Rust internals.

Maintainability:

- The proposed manifest/result split lets future workers add scenarios without changing runner logic.
- The gate vocabulary makes compatibility status explicit instead of hiding it in benchmark labels.

Performance:

- Public-path measurements are reserved for claims, while Rust/native diagnostics remain available for root-cause analysis.
- Profiler artifacts and counters are required before threshold-crossing claims are accepted.

Security:

- Baseline installs should verify tarball integrity and avoid lifecycle scripts.
- Hydration, resource, singleton, form action, `dangerouslySetInnerHTML`, URL-like attributes, and native-boundary scenarios stay blocked until their security-sensitive behavior has oracle evidence.

## Completion Checklist

- [x] Called `create_goal` first.
- [x] Called `get_goal` after goal setup and recorded active status/objective.
- [x] Read `WORKER_BRIEF.md` after goal setup.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Wrote only `worker-progress/worker-146-performance-gate-refresh.md`.
- [x] Inspected required context files and current test/conformance scripts.
- [x] Defined first benchmark harnesses, comparison baselines, profiler hooks, measurement pitfalls, and merge gates.
- [x] Kept benchmark claims separate from compatibility claims.
- [x] Ran `npm run test:conformance` as evidence baseline.
- [x] Run final `git diff --check`.
- [x] Run final scoped changed-path check for the single allowed report file.
