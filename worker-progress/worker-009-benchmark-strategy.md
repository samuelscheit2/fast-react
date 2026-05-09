# worker-009-benchmark-strategy

## Objective

Design a benchmark strategy for Fast React that cannot make missing React semantics look like a speedup.

The root failure mode is not "bad benchmark tooling"; it is benchmarking incomplete work. A Rust implementation that skips owner metadata, key/ref semantics, update queues, effect ordering, context propagation, Suspense, lane priority behavior, hydration, portal work, host mutations, or JS boundary conversion can look fast while doing less than React. The benchmark program must therefore be a conformance-gated measurement system, not a standalone speed contest.

This report covers the assigned scope only. It does not implement project code and writes only this progress file.

## Sources and commands used

Local project sources read:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `docs/tasks/worker-009-benchmark-strategy.prompt.md`
- `worker-progress/README.md`

External documentation and registry sources consulted:

- npm registry metadata through `npm view` for `react`, `react-dom`, `@types/react`, `scheduler`, and `csstype`.
- React docs for `<Profiler>`: https://react.dev/reference/react/Profiler
- React docs for React Performance tracks: https://react.dev/reference/dev-tools/react-performance-tracks
- Node.js Node-API docs: https://nodejs.org/api/n-api.html
- Node.js `perf_hooks` docs: https://nodejs.org/api/perf_hooks.html

Commands run:

- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `rg --files`
- `git status --short`
- `find worker-progress -maxdepth 2 -type f -print | sort`
- `sed -n '1,260p' docs/tasks/worker-009-benchmark-strategy.prompt.md`
- `sed -n '1,200p' worker-progress/README.md`
- `git rev-parse --show-toplevel`
- `rg -n "benchmark|bench|conformance|performance|React 19|native|N-API|WASM|Profiler|profile|scheduler|lane|renderer" --glob '!ORCHESTRATOR.md'`
- `npm view react@19.2.6 version dist.tarball gitHead time --json`
- `npm view react-dom@19.2.6 version dist.tarball gitHead dependencies time --json`
- `npm view @types/react@19.2.14 version dist.tarball dependencies time --json`
- `npm view react@19.2.6 version time.19.2.6 dist.tarball --json`
- `npm view react-dom@19.2.6 version time.19.2.6 dependencies dist.tarball --json`
- `npm view @types/react@19.2.14 version time.19.2.14 dependencies dist.tarball --json`
- `npm view react@19.2.6 version dist.integrity dist.shasum --json`
- `npm view react-dom@19.2.6 version dependencies dist.integrity dist.shasum --json`
- `npm view @types/react@19.2.14 version dependencies dist.integrity dist.shasum --json`
- `npm view scheduler@0.27.0 version dist.integrity dist.shasum dist.tarball --json`
- `npm view csstype@3.2.2 version dist.integrity dist.shasum dist.tarball --json`
- `node --version && npm --version && uname -sm`
- `rustc --version && cargo --version && sysctl -n machdep.cpu.brand_string hw.ncpu hw.memsize 2>/dev/null`
- `node -p "JSON.stringify({node:process.version,v8:process.versions.v8,napi:process.versions.napi,modules:process.versions.modules,uv:process.versions.uv,platform:process.platform,arch:process.arch})"`
- `rg -n "^## " worker-progress/worker-009-benchmark-strategy.md`
- `git diff -- worker-progress/worker-009-benchmark-strategy.md`
- `sed -n '1,260p' worker-progress/worker-009-benchmark-strategy.md`
- `sed -n '261,360p' worker-progress/worker-009-benchmark-strategy.md`
- `rg -n "^## (Objective|Sources and commands used|Benchmark principles and anti-goals|React 19\\.2\\.6 baseline recommendation|Microbenchmark suite recommendation|Renderer and app benchmark recommendation|Profiling and regression tracking|Gating rules tied to conformance|Proposed follow-up implementation tasks|Completion checklist|Handoff summary)$" worker-progress/worker-009-benchmark-strategy.md`
- `wc -l worker-progress/worker-009-benchmark-strategy.md`
- `git status --short --untracked-files=all`
- `grep -n "ORCHESTRATOR" worker-progress/worker-009-benchmark-strategy.md || true`
- `python` checklist script for required strings, which failed because `python` is not installed in this shell.
- `perl -0ne ... worker-progress/worker-009-benchmark-strategy.md` checklist for required strings, which returned `missing=none`.

All `npm view` commands emitted this local npm warning: `Unknown user config "minimum-release-age"`. The queried metadata still returned successfully.

Delegated hypothesis checks:

- Nested explorer `019e0da9-179f-7143-b559-d51d7f1a4ba8` inspected repo state and benchmark anti-goals read-only. Result: confirmed there is no implementation scaffold or benchmark harness yet, M8 owns benchmark execution, and premature Rust-only or no-op-renderer benchmarks would hide missing semantics.
- Nested explorer `019e0da9-23bc-7581-8bb7-4bfbc1c38467` independently checked baseline pinning and native-boundary traps. Result: confirmed exact package and transitive dependency pinning are required, conformance must gate performance, and JS-to-Rust boundary overhead needs first-class measurement.

## Benchmark principles and anti-goals

Principles:

- Conformance comes before timing. Every benchmark case must have a paired React 19.2.6 oracle that verifies output, thrown errors, warnings where relevant, update order, lifecycle/effect order, scheduler-observable behavior, and host operations before timing is accepted.
- Compare equivalent build modes. Development, production, and production-profiling builds must be tracked separately. Do not compare Fast React release mode to React development mode.
- Measure through public integration paths first. The headline benchmark path should use the same JS package entrypoints and renderer boundary that users and conformance tests use. Rust-core-only timings are useful diagnostics, not product claims.
- Include representative semantic work in every tier. Static mount-only benchmarks are allowed only as a narrow diagnostic tier and must not headline performance.
- Record enough environment data for reruns: package tarballs and integrity hashes, lockfile, Node/V8/N-API versions, Rust toolchain, OS, CPU, memory, build profile, `NODE_ENV`, renderer path, GC policy, warmup policy, sample count, p50/p95/p99, variance, and trace artifacts.
- Treat benchmarks as regression tests for architecture. If profiler evidence shows boundary overhead or host callbacks dominate, the follow-up should change the boundary design rather than tune around noise.

Anti-goals:

- No performance claim from tests that skip conformance assertions.
- No Rust-only headline number that bypasses JS values, N-API/WASM conversion, package loading, or host-config callbacks.
- No no-op renderer result marketed as DOM or native renderer performance.
- No static tree benchmark that avoids updates, keyed reordering, deletes, refs, effects, context invalidation, Suspense, transitions, error recovery, portals, or hydration.
- No microbenchmark that replaces React semantics with simpler custom data structures unless it is explicitly labeled as an internal diagnostic.
- No benchmark that disables work in Fast React because a semantic area is incomplete. Incomplete semantics should block the benchmark lane or mark it "not comparable".

Breaking-change recommendation:

- The benchmark harness should fail closed. If a benchmark lacks a conformance oracle or its oracle fails, the harness should return a non-success status and omit speedup reporting for that case. This may break early developer workflows, but it prevents project decisions from being anchored on invalid speedups.

## React 19.2.6 baseline recommendation

Use exact, lockfile-pinned React baselines:

- `react@19.2.6`
  - Tarball: `https://registry.npmjs.org/react/-/react-19.2.6.tgz`
  - Integrity: `sha512-sfWGGfavi0xr8Pg0sVsyHMAOziVYKgPLNrS7ig+ivMNb3wbCBw3KxtflsGBAwD3gYQlE/AEZsTLgToRrSCjb0Q==`
  - Shasum: `3dadb8e12b2a7934c1d5317973e5dce1301f9a4d`
- `react-dom@19.2.6`
  - Tarball: `https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz`
  - Dependency observed: `scheduler: ^0.27.0`
  - Integrity: `sha512-0prMI+hvBbPjsWnxDLxlCGyM8PN6UuWjEUCYmZhO67xIV9Xasa/r/vDnq+Xyq4Lo27g8QSbO5YzARu0D1Sps3g==`
  - Shasum: `44a81b0bcca22da814c00847d09d01c8615529b7`
- `scheduler@0.27.0`
  - Tarball: `https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz`
  - Integrity: `sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==`
  - Shasum: `0c4ef82d67d1e5c1e359e8fc76d3a87f045fe5bd`
- `@types/react@19.2.14`
  - Tarball: `https://registry.npmjs.org/@types/react/-/react-19.2.14.tgz`
  - Dependency observed: `csstype: ^3.2.2`
  - Integrity: `sha512-ilcTH/UniCkMdtexkoCN0bI7pMcJDvmQFPvuPvmEaYA/NSfFTAgdUSLAoVjaRJm7+6PvcM+q1zYOwS4wTYMF9w==`
  - Shasum: `39604929b5e3957e3a6fa0001dafb17c7af70bad`
- `csstype@3.2.2`
  - Tarball: `https://registry.npmjs.org/csstype/-/csstype-3.2.2.tgz`
  - Integrity: `sha512-D80T+tiqkd/8B0xNlbstWDG4x6aqVfO52+OlSUNIdkTvmNw0uQpJLeos2J/2XvpyidAFuTPmpad+tUxLndwj6g==`
  - Shasum: `6800c4d295639fbe03ac1f3df642e58506f9b65a`

Baseline lanes:

- `react-js-dev`: React 19.2.6 development build, `NODE_ENV=development`, warnings and validation preserved.
- `react-js-prod`: React 19.2.6 production build, `NODE_ENV=production`.
- `react-js-profiling`: React production profiling build when renderer/app traces need React `Profiler` and Performance track data. React docs state production profiling needs a special profiling build, and React Performance tracks are available in development and profiling builds.
- `fast-react-dev`, `fast-react-prod`, and `fast-react-profiling` should mirror those lanes only after equivalent semantics exist.

Environment snapshot from this worker:

- Node: `v26.0.0`
- npm: `11.12.1`
- V8: `14.6.202.33-node.19`
- N-API: `10`
- Rust: `rustc 1.95.0`, `cargo 1.95.0`
- OS/CPU: `Darwin arm64`, Apple M1 Ultra, 20 CPUs, 64 GiB memory

This snapshot is evidence for the research environment only. Benchmark CI should define its own pinned runners and should not treat this machine as the canonical baseline host.

## Microbenchmark suite recommendation

Microbenchmarks should exist to isolate root causes, not to replace renderer/app benchmarks. Every microbenchmark should record both an executable conformance assertion and a timing result.

Recommended microbenchmark groups:

- Element and children semantics:
  - `createElement` and JSX-runtime element creation with primitive, object, function, and array props.
  - Key/ref extraction, reserved prop behavior, default props if supported at the target surface, `$$typeof` tagging, owner/dev metadata, fragments, portals, and `isValidElement`.
  - `Children.map`, `Children.toArray`, nested arrays, holes, booleans, nulls, strings, numbers, key escaping, and traversal order.
- Clone and memo wrappers:
  - `cloneElement` prop merging, key/ref replacement, children replacement, and owner/ref behavior.
  - `memo`, `lazy`, and component identity wrappers where public behavior is observable.
- Hook update queues:
  - `useState`, `useReducer`, functional updates, eager bailout cases, batching, render-phase updates, nested updates, and invalid hook diagnostics.
  - `useMemo`/`useCallback` dependency comparison and bailout.
  - `useRef`, `useImperativeHandle`, `useId`, `useSyncExternalStore`, `useTransition`, `useDeferredValue`, `useOptimistic`, `useActionState`, and `use`.
- Effect lifecycle:
  - `useInsertionEffect`, `useLayoutEffect`, and `useEffect` mount, cleanup, remount, dependency changes, unmount, error paths, and StrictMode development behavior.
- Context propagation:
  - Many consumers under nested providers, provider value identity changes, bailout interactions, memoized consumers, and high fan-out invalidation.
- Scheduler and lanes:
  - Sync updates, transitions, deferred work, interruption/resumption, Suspense fallback/reveal, starvation-sensitive workloads, cascading updates, and batched event updates.
- Reconciliation primitives:
  - Keyed insert/move/delete/reorder, type changes, bailout paths, text nodes, refs, portals, error boundaries, and subtree deletion cleanup.
- Boundary diagnostics:
  - N-API no-op call cost, JS function callback cost via `napi_call_function`, JS object property get/set cost, prop marshaling shapes, string/symbol creation, external buffer/finalizer behavior, batched host operation serialization, and per-fiber versus per-commit boundary crossing.

Output requirements per case:

- React and Fast React both run from the same benchmark case definition.
- The conformance assertion runs before timing and after warmup.
- The measurement reports operation count, warmup count, sample count, p50, p95, p99, mean, standard deviation, relative margin, GC mode, and whether samples were discarded.
- Internal diagnostic timings are labeled separately from public-path timings.

## Renderer and app benchmark recommendation

Renderer benchmarks should be introduced in tiers as implementation milestones become available:

- Test renderer tier:
  - Minimal host config that records host operations, not a silent no-op renderer.
  - Gate on exact host operation sequence compared with React 19.2.6 where possible.
  - Workloads: static mount, deep tree update, wide tree update, keyed list reorder, subtree deletion, ref attach/detach, effect-heavy tree, context fan-out, error recovery, Suspense fallback/reveal, transition update, and portal update.
- DOM-oriented tier:
  - Use `react-dom@19.2.6` baseline and the Fast React DOM adapter through equivalent entrypoints.
  - Workloads: list filtering/sorting, controlled inputs, form submission/status, table/grid updates, text-heavy updates, event-heavy updates, Suspense data reveal, hydration of server markup, portal modal updates, and frequent small updates.
  - Verify DOM output, event behavior, focus/selection preservation where applicable, hydration warnings/errors, and effect ordering before timing.
- Native/custom renderer tier:
  - Exercise host configs where host mutations are JS callbacks or native calls, because boundary shape may dominate.
  - Workloads: high-volume view creation, prop diffing with structured styles, event subscription churn, layout-like update bursts, keyed list virtualization, and bridge-batched commits.
  - Track host call count, serialized payload bytes, callback count, and time spent crossing JS/native/Rust boundaries.
- Representative app tier:
  - Small but semantic apps, not synthetic render loops: dashboard with context and memoization, editable list/form, Suspense-backed data view, router-like tab switch, modal/portal workflow, hydration page, and transition-heavy search.
  - Each app should expose deterministic scripts: mount, update, interaction, navigation, teardown.

No renderer/app benchmark should publish a speedup unless:

- It passes its paired conformance checks.
- It records host operation count and boundary crossing count.
- React and Fast React use equivalent dev/prod/profiling modes.
- The result includes trace artifacts or profiler summaries sufficient to explain where time went.

## Profiling and regression tracking

Profiling should answer "why is this faster or slower?" before a performance claim is accepted.

Required evidence:

- JavaScript user timing via `node:perf_hooks` or browser Performance APIs around benchmark phases.
- React `<Profiler>` data for renderer/app benchmarks where applicable. React's `onRender` callback exposes mount/update/nested-update phase, actual duration, base duration, start time, and commit time.
- Browser Performance traces for DOM/app benchmarks, including React Performance tracks in development/profiling lanes. The React docs identify Scheduler subtracks for blocking, transition, Suspense, and idle work, plus render, commit, and remaining effects phases.
- Native/Rust profiling for Fast React internals: CPU flamegraphs, allocation profiles, boundary call counts, and host operation histograms.
- Boundary-specific counters: N-API call count, JS callback count, object/property conversion count, string/symbol creation count, serialized bytes, external memory bytes, finalizer count, and time per crossing.

Regression tracking:

- Store one JSON result per benchmark run with schema version, git commit, benchmark version, package lock hash, environment metadata, conformance status, timing statistics, profiler artifact paths, and notes.
- Maintain a rolling baseline per lane and benchmark case. Use percentage and absolute thresholds because tiny microbenchmarks can have large percentage swings with no user impact.
- Require profiler evidence for any accepted regression waiver or claimed improvement over a threshold.
- Track semantic coverage and performance together: a benchmark result should show which conformance matrix rows it covers and whether any related rows are incomplete or skipped.
- Treat reduced work as a regression even if time improves. For example, fewer host operations than React may be a bug unless a conformance oracle proves equivalent observable behavior.

## Gating rules tied to conformance

Recommended gates:

- Gate 0: Benchmark case admission
  - A new benchmark must declare the React semantics it exercises, its React 19.2.6 oracle, build lanes, renderer path, expected host operation assertions, and profiler counters.
  - Cases without an oracle can land only under `diagnostic/` and cannot contribute to speedup dashboards.
- Gate 1: API and behavior parity
  - The benchmark lane runs only when the relevant conformance tests for public exports, element behavior, hooks, context, scheduler, renderer, or DOM behavior are passing.
  - If a semantic area is known incomplete, related benchmark cases are marked `blocked-by-conformance`, not `faster`.
- Gate 2: Same-boundary comparability
  - Public claims must use the public JS package and renderer boundary. Rust-core-only numbers are allowed as profiler breakdowns.
  - If Fast React uses a batched host boundary that React does not expose, report both the public-path total and the internal breakdown so architecture wins are visible without hiding conversion cost.
- Gate 3: Same-mode comparability
  - Development, production, and profiling builds compare only against matching build lanes.
  - StrictMode, profiling instrumentation, warnings, feature flags, and hydration settings must match the declared lane.
- Gate 4: Statistical stability
  - A result must meet minimum sample count, variance, and warmup criteria before comparison.
  - Benchmarks that are noise-bound should be retained only as diagnostics.
- Gate 5: Profile-backed interpretation
  - Any claimed speedup or regression above the configured threshold must include profiler evidence and a short root-cause note.
  - If the root cause is native boundary overhead, the follow-up should target boundary shape, batching, data layout, or ownership strategy rather than hiding the overhead from the benchmark.

Breaking-change recommendation:

- CI should fail performance lanes when conformance status regresses for a covered semantic area. This is intentionally strict: a "fast but semantically missing" benchmark is worse than no benchmark because it directs architecture work toward the wrong root cause.

## Proposed follow-up implementation tasks

- Create a benchmark manifest schema with fields for semantic coverage, React oracle command, Fast React command, build lane, renderer path, environment metadata, profiler requirements, and result thresholds.
- Build a small runner that executes conformance assertions first, then warmup, then timed samples, then profiler artifact collection.
- Add exact React 19.2.6 baseline lockfiles with tarball integrity hashes for React, React DOM, Scheduler, type declarations, and transitive type dependencies.
- Define the first diagnostic benchmark cases for element creation, children traversal, and N-API boundary overhead, but mark them non-headline until paired conformance oracles exist.
- Define host operation recording for the future test renderer so renderer benchmarks assert operation sequences before timing.
- Add result JSON schema, regression comparison script, and dashboard format that displays conformance status beside timing data.
- Add trace capture support for browser DOM benchmarks and Node/Rust profiling support for server or test-renderer benchmarks.
- Add explicit boundary counters to the JS binding layer once worker-006's binding strategy is accepted.
- Coordinate with conformance, upstream-test, scheduler/fiber, and renderer-host-config workers before implementing benchmark cases so benchmark coverage maps to accepted semantic inventories.

## Handoff summary

Summary:

- Benchmarks must be admitted and published only when paired conformance oracles prove they are timing React-equivalent work.
- The React 19.2.6 baseline should be exact-lockfile based, including transitive `scheduler` and type dependencies, with dev/prod/profiling lanes separated.
- Microbenchmarks should isolate root causes but stay non-headline unless they run through public semantics and boundary paths.
- Renderer and app benchmarks should verify host operations, DOM/native behavior, effects, Suspense, hydration, portals, and update behavior before timing.
- Native boundary overhead is a first-class performance risk; the strategy requires bridge-only diagnostics and boundary counters so architecture changes target the root cause.

Changed files:

- `worker-progress/worker-009-benchmark-strategy.md`

Evidence gathered:

- Local project plan and worker brief establish that no implementation code exists yet, benchmark work belongs to M8, and performance work must wait for correctness and representative benchmarks.
- npm metadata verified the React 19.2.6 package baseline and integrity hashes for React, React DOM, Scheduler, `@types/react`, and `csstype`.
- React docs verified the relevance and caveats of `<Profiler>` and React Performance tracks for profiling lanes.
- Node docs verified Node-API and `perf_hooks` as relevant sources for native boundary and timing instrumentation.
- Two nested read-only explorers independently confirmed the conformance-gating and boundary-overhead hypotheses.

Risks or blockers:

- Final benchmark thresholds should wait for accepted conformance inventory and scaffold decisions.
- Exact CI hardware, browser matrix, and benchmark runner schema are not defined yet.
- Upstream React test reuse may change which conformance oracles are cheapest to run.
- Binding choice and host-config design may require additional boundary benchmark cases.

Recommended next tasks:

- Define the benchmark manifest schema and result JSON schema after conformance/scaffold recommendations are accepted.
- Build exact React 19.2.6 baseline lockfiles and a conformance-first runner.
- Add initial diagnostic cases for element creation, children traversal, host operation recording, and N-API boundary overhead.

## Completion checklist

- Objective addressed: benchmark strategy is conformance-first and designed to prevent missing React semantics from appearing as speedups.
- Required section present: Objective.
- Required section present: Sources and commands used.
- Required section present: Benchmark principles and anti-goals.
- Required section present: React 19.2.6 baseline recommendation.
- Required section present: Microbenchmark suite recommendation.
- Required section present: Renderer and app benchmark recommendation.
- Required section present: Profiling and regression tracking.
- Required section present: Gating rules tied to conformance.
- Required section present: Proposed follow-up implementation tasks.
- Required section present: Completion checklist.
- React 19.2.6 baseline covered with exact package versions, tarballs, integrity hashes, transitive `scheduler`, and type dependencies.
- Microbenchmark recommendations cover element creation, children, hooks, context, scheduler/lanes, reconciliation, effects, and native boundary diagnostics.
- Renderer/app recommendations cover test renderer, DOM-oriented, native/custom renderer, hydration, portals, Suspense, events, forms, and representative apps.
- Profiling recommendations cover React `<Profiler>`, React Performance tracks, Node timing APIs, native/Rust profiling, boundary counters, and regression artifacts.
- Gating rules explicitly tie benchmark admission and publication to conformance status.
- Native boundary overhead is treated as a first-class benchmark and architecture risk, not hidden from results.
- Delegated checks summarized with agent IDs and how their results affected this report.
- Quality review: the strategy avoids invalid speed claims and keeps benchmark semantics auditable through manifests and oracles.
- Maintainability review: benchmark cases are organized into tiers with manifest-driven metadata so future workers can add cases without changing policy.
- Performance review: profiler evidence and boundary counters are required to distinguish real Rust wins from reduced work or measurement artifacts.
- Security review: external baselines should be pinned by tarball integrity; native boundary tests should include type-validation and external-memory/finalizer behavior because Node-API misuse can become memory-safety risk.
- Changed files: `worker-progress/worker-009-benchmark-strategy.md`.
- Files intentionally not modified: all files outside the assigned write scope.
- Implementation code changed: none.
- Unresolved risks and follow-up tasks:
  - Final benchmark thresholds should wait for accepted conformance inventory and scaffold decisions.
  - Exact CI hardware and browser matrix are not defined yet.
  - Upstream React test reuse may change which conformance oracles are cheapest to run.
  - Binding choice and host-config design may require additional boundary benchmark cases.
  - React 19.2.6 package metadata was verified on 2026-05-09, but future target upgrades must regenerate lockfiles and baseline artifacts.
