# worker-074-benchmark-react-dom-baseline-plan

## Objective

Produce a report-only benchmark plan for React DOM compatibility and performance baselines, including benchmark scenarios, semantic gates, React 19.2.6 comparison setup, runner isolation, metrics, and when not to benchmark yet.

Write scope honored: only `worker-progress/worker-074-benchmark-react-dom-baseline-plan.md` was written. No benchmark harness, source code, package metadata, tests, lockfiles, or generated artifacts were changed.

## Summary

React DOM benchmarking should start as a compatibility-gated measurement system, not as a timing suite. The root failure mode is measuring a placeholder, no-op renderer, direct DOM shortcut, or Rust-only internal path and treating missing React DOM work as a speedup.

Recommended sequence:

1. Add a benchmark manifest and gate checker that can record scenarios before they are runnable.
2. Add an isolated React 19.2.6 baseline installation and mode matrix for development, production, and profiling.
3. Admit scenario definitions only when they point to green React 19.2.6 comparison evidence for the semantics they exercise.
4. Start with root/package diagnostics and internal overhead counters, but keep them non-headline.
5. Add comparable client-root, DOM mutation, event/update-priority, hydration, resources/forms, and representative app benchmarks only after their compatibility oracles and implementation slices are merged.
6. Publish performance comparisons only with semantic status, timing statistics, host-operation counts, boundary counters, and profiler artifacts.

Active workers 046 through 052 are treated as unavailable for this report. Their expected topics are useful future gates, but no benchmark should depend on their output until the orchestrator has merged it.

## Evidence Used

- `worker-progress/worker-009-benchmark-strategy.md`: established fail-closed benchmark admission, React 19.2.6 baseline pinning, public-path measurement, mode separation, runner metadata, profiler artifacts, native-boundary counters, and the rule that semantically incomplete paths are `blocked-by-conformance`, not fast.
- `worker-progress/worker-033-react-dom-inventory.md`: split React DOM into package surface, client renderer behavior, and server/static behavior; identified public subpaths, exports, `react-server` throwing branches, type/runtime gaps, and behavior surfaces that require reconciler roots, DOM host config, events, hydration, resources, forms, and Fizz.
- `worker-progress/worker-040-dom-mutation-renderer-plan.md`: showed that DOM mutation requires namespace context, property/style diffing, controlled form logic, container/root markers, node-to-fiber maps, public instance lookup, focus diagnostics, and explicit capabilities. It also warned not to fake hydration/forms/resources/singletons/view transitions.
- `worker-progress/worker-044-react-dom-client-roots-plan.md`: showed that `createRoot`, root object `render`/`unmount`, `flushSync`, root update queues, event priority, scheduler callbacks, and error callbacks are scheduler/reconciler contracts, not public facade shortcuts.
- `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`: confirmed the project mission, React 19.2.6 target, worker rules, merged status of workers 009/033/040/044, active status of workers 046-052, and the rule that performance work waits on correctness.

## Benchmark Admission Gates

Every benchmark case should declare the semantic gates it covers. If any required gate is missing or red, the runner should record `blocked-by-conformance` and skip speedup reporting for that case.

| Gate | Required evidence before timing counts | Blocks these benchmarks until green |
| --- | --- | --- |
| Package surface | Exact `react-dom@19.2.6` public subpaths, export keys, descriptors, condition branches, blocked physical subpaths, `react-server` throws, and version behavior. Runtime and TypeScript compatibility remain separate. | Import/load, facade, profiling-entry, and package-resolution benchmarks. |
| Direct facades | Oracle-covered behavior for `version`, exact unsupported errors, `unstable_batchedUpdates`, and `test-utils.act` only after `React.act` exists. | Any facade microbenchmark that would otherwise time placeholder errors or passthroughs as product performance. |
| Client root object | `createRoot` validation and warnings, root object shape, `_internalRoot` lifecycle, `render`/`unmount` behavior, option ingestion, duplicate-root handling, and `react-server` throw behavior. | Root creation, root render enqueue, root unmount, and profiling root benchmarks. |
| Root scheduler and updates | FiberRoot state, HostRoot update queue, lane selection, transition lane assignment, cross-root sync flush, callback node reuse/cancellation, and passive-effect flushing behavior. | `root.render`, `flushSync`, event-driven updates, transitions, Suspense reveal, and multi-root workloads. |
| DOM mutation host | Element/text creation, namespace switching, attribute/property/style diffing, custom elements, `dangerouslySetInnerHTML`, mutation operations, deletion cleanup, public instance lookup, refs, and host operation ordering. | Static mount, keyed update, text update, attribute/style update, portal render, ref ordering, and DOM operation-count benchmarks. |
| Events and priority | Delegated listener installation, event plugin dispatch, event-to-priority mapping, batching, `window.event` fallback behavior, selection/focus edge cases, portal listeners, and event-priority lane mapping. | Click/input/scroll/wheel benchmarks, controlled input workloads, event-heavy apps, `flushSync` from events, and transition interaction benchmarks. |
| Controlled forms | Input/select/textarea value tracking, post-commit controlled state restoration, form reset, submit/reset events, selection preservation, and React-owned form detection. | Form editor, controlled input latency, form-status/action, and reset benchmarks. |
| Hydration and server markers | Fizz/server output compatibility, hydratable marker matching, mismatch diagnostics, recoverable errors, explicit hydration targets, event replay, Suspense/Activity/form markers, and `hydrateRoot` behavior. | Hydration, resume, mismatch recovery, event replay, and server-to-client app benchmarks. |
| Resources, singletons, view transitions | Resource hint dispatcher behavior, hoistable resources, `html`/`head`/`body` singleton acquisition, view-transition names/measurement/lifecycle, and security-sensitive DOM rules. | Resource hint, streaming resource, singleton, and view-transition benchmarks. |
| Comparability and statistics | Same public entrypoint path, same dev/prod/profiling lane, minimum samples, warmup, variance limits, host/boundary counters, profiler artifacts, and root-cause notes for threshold changes. | Any headline comparison or dashboard speedup. |

Breaking recommendation: the future runner should fail closed. A benchmark with missing gate metadata, a failing oracle, or a known incomplete semantic area should exit non-success for that case and omit relative speed claims.

## React 19.2.6 Baseline Setup

Use the published npm tarballs as the runtime baseline, not React source metadata. Source tag evidence is useful to understand root causes, but the public package surface is the compatibility target.

Pinned runtime packages:

- `react@19.2.6`
  - Tarball: `https://registry.npmjs.org/react/-/react-19.2.6.tgz`
  - Integrity: `sha512-sfWGGfavi0xr8Pg0sVsyHMAOziVYKgPLNrS7ig+ivMNb3wbCBw3KxtflsGBAwD3gYQlE/AEZsTLgToRrSCjb0Q==`
- `react-dom@19.2.6`
  - Tarball: `https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz`
  - Integrity: `sha512-0prMI+hvBbPjsWnxDLxlCGyM8PN6UuWjEUCYmZhO67xIV9Xasa/r/vDnq+Xyq4Lo27g8QSbO5YzARu0D1Sps3g==`
  - Runtime dependency: `scheduler@^0.27.0`
- `scheduler@0.27.0`
  - Tarball: `https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz`
  - Integrity: `sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==`

Type evidence is not a performance baseline, but benchmark fixtures that compile TypeScript should record the declaration target separately:

- `@types/react@19.2.14`
- `@types/react-dom@19.2.3`

Baseline lanes:

- `react-js-dev`: `NODE_ENV=development`, development warnings preserved.
- `react-js-prod`: `NODE_ENV=production`, no profiling instrumentation.
- `react-js-profiling`: React DOM profiling entrypoints and profiling-compatible build path where profiler traces are required.
- `fast-react-dev`, `fast-react-prod`, and `fast-react-profiling`: admitted only when the same semantics and mode-specific behavior exist.

Comparison rules:

- Do not compare Fast React release/Rust optimized paths against React development builds.
- Do not compare `react-dom/profiling` until normal client roots and profiling hooks are compatible.
- Do not compare a jsdom result as if it were a browser result. jsdom and real-browser DOM lanes should be separate.
- Do not compare a public React DOM path to a Rust-core diagnostic path. Internal Rust timings can explain root causes but cannot headline React DOM compatibility performance.

## Runner Isolation

The benchmark runner should isolate package resolution, global state, DOM state, environment mode, and profiler artifacts.

Required isolation rules:

- Use a dedicated baseline install with an exact lockfile and integrity checks for React 19.2.6 packages.
- Install or unpack baselines without lifecycle scripts.
- Run React and Fast React in separate processes for comparable timing, because `NODE_ENV`, package conditions, module cache, globals, scheduler state, React DOM internals, and DOM listener markers can leak across cases.
- Treat each implementation/mode pair as a fresh module graph. Do not switch between React and Fast React with aliases inside one Node process.
- Use a fresh DOM document/container per sample or per measured iteration group, and explicitly verify teardown leaves no root markers, listeners, pending scheduler tasks, or retained DOM nodes beyond expected globals.
- Separate Node/jsdom, browser, and future native-boundary runners. Each runner must record its environment and must not mix samples.
- Disable unrelated background work where possible, but record GC policy rather than hiding GC. If manual GC is used, report when it runs.
- Warm up imports and setup separately from measured render/update phases unless the scenario is explicitly an import/startup benchmark.
- Write one result JSON per implementation/mode/scenario run. Do not overwrite React baseline results with Fast React runs.

Manifest fields each case should declare:

- Stable scenario id and version.
- Required conformance gate ids and oracle commands.
- Runtime lane: dev, prod, or profiling.
- Runner type: Node/jsdom, browser, server/static, or internal diagnostic.
- Implementation entrypoints for React and Fast React.
- Setup, operation, assertion, teardown, and profiler steps.
- Expected DOM snapshots, warning/error records, host operation assertions, and event/effect/ref order assertions.
- Metrics to collect and thresholds for statistical stability.
- Whether the case is `headline`, `diagnostic`, or `blocked-by-conformance`.

## Metrics

Every result should carry semantic status next to timing. A fast run with fewer host operations, missing warnings, missing effects, missing listeners, or skipped scheduling is a compatibility failure first.

Core timing metrics:

- Import/setup time, when explicitly benchmarked.
- Mount render time, commit time, and passive effect flush time.
- Update render time, commit time, and passive effect flush time.
- Unmount time and cleanup completion time.
- Event dispatch to committed update latency.
- Hydration scan, mismatch recovery, replay, and commit timing once hydration is admitted.
- p50, p95, p99, mean, standard deviation, relative margin, sample count, warmup count, discarded samples, and timeout count.

React DOM semantic counters:

- Host operation counts: create element/text, append, insert, remove, clear, text update, prop/style update, hide/unhide, detach deleted instance, portal mount preparation.
- DOM output size: node count, text node count, attribute count, style mutation count, event listener count, and container/root marker count.
- Scheduler counters: lane chosen, priority source, Scheduler callback priority, yielded/continued tasks, canceled callbacks, sync flush count, passive effect flush count, transition lane reuse, and cross-root flush count.
- Event counters: native listener installation, delegated dispatch count, batched update count, `flushSync` calls, replay count, and event priority classification.
- Boundary counters: JS-to-Rust calls, Rust-to-JS callbacks, prop marshaling count, strings/symbols created, serialized payload bytes, external memory, finalizer count, and time per crossing.

Profiler artifacts:

- React `<Profiler>` data where applicable: phase, actual duration, base duration, start time, and commit time.
- Browser Performance traces for DOM/app scenarios, including React Performance tracks in development/profiling lanes.
- Node `perf_hooks` marks/measures around benchmark phases.
- Native/Rust CPU and allocation profiles for Fast React internals.
- Short root-cause notes for any accepted speedup or regression above threshold.

## Scenario Plan

The scenario matrix should grow in stages. Earlier stages may land scenario definitions and diagnostics without headline comparisons.

| Stage | Scenarios | Required gates | Result status before gates |
| --- | --- | --- | --- |
| 0. Harness diagnostics | Runner startup, manifest validation, result schema, baseline package load, empty-process overhead, profiler capture overhead. | Package baseline only. | Diagnostic only. No product speed claims. |
| 1. Package facades | `react-dom` import/export resolution, `react-server` throwing branches, `version`, direct unsupported errors, `unstable_batchedUpdates` passthrough once covered. | Package surface and direct facade gates. | Diagnostic or facade-only. Not DOM renderer performance. |
| 2. Client root lifecycle | `createRoot` invalid/valid containers, duplicate root warnings, root object shape, `render` enqueue, `unmount`, cross-root sync flush, root option callback storage. | Client root object, root scheduler/update, package surface gates. | Blocked until root semantics are green. |
| 3. DOM mutation primitives | Static mount, text update, keyed insert/move/delete, attribute/style update, custom element update, `dangerouslySetInnerHTML`, portal mount, ref attach/detach, subtree deletion cleanup. | DOM mutation host plus client root and scheduler gates. | Blocked until DOM host operations and root updates are green. |
| 4. Events and update priority | Click, input, continuous pointer/wheel/scroll, batched events, `flushSync` inside events, transition-triggered search, portal event dispatch, focus/selection behavior. | Events/priority, scheduler/update, DOM mutation gates. | Blocked until event priority and dispatch are green. |
| 5. Controlled forms | Controlled text input, checkbox/radio groups, select/textarea, reset/submit, selection preservation, form status/action paths when implemented. | Controlled forms plus events and mutation gates. | Blocked until value tracking and post-commit restore are green. |
| 6. Hydration | Hydrate server markup, text mismatch, attribute mismatch, Suspense reveal, event replay before hydration, recoverable errors, form markers, resume-compatible fixtures. | Hydration/server markers plus events, mutation, client root gates. | Blocked until Fizz marker and `hydrateRoot` compatibility are green. |
| 7. Resources and singletons | `preload`, `preinit`, `preconnect`, hoistable styles/scripts, singleton `head`/`body` behavior, resource dedupe, nonce/integrity behavior. | Resources/singletons gate. | Blocked until security-sensitive resource semantics are green. |
| 8. Representative apps | Editable list/form, table/grid sort/filter, dashboard with context and memoization, portal modal, transition-heavy search, Suspense data view, hydration page. | All semantic gates exercised by the app. | Headline only after all covered gates are green. |

Scenario design notes:

- Static mount is useful but should not be the headline because it avoids many React DOM semantics.
- List reordering must assert DOM identity/move behavior, not just final text content.
- Controlled input cases must assert value, selection, event order, and post-commit restoration.
- Transition cases must assert lane/scheduler behavior and visible output before measuring latency.
- Hydration cases must assert warnings/errors and replay semantics before timing hydration.

## When Not To Benchmark Yet

Do not benchmark for product comparison when:

- The Fast React path throws a loud unsupported placeholder or skips semantic work.
- The scenario has no paired React 19.2.6 oracle.
- The only available path is a no-op renderer, direct DOM mutation shortcut, facade stub, or Rust-core-only diagnostic.
- The benchmark would time package import or unsupported-error construction and present it as React DOM rendering performance.
- The relevant active workers 046-052 are still unmerged and their expected evidence is needed for the gate.
- `createRoot` does not enqueue HostRoot updates through lane scheduling.
- `root.unmount` does not use sync null updates and cross-root sync flushing.
- `flushSync` is implemented as a standalone facade helper rather than a root scheduler priority boundary.
- DOM mutation support lacks namespace, props/style diffing, deletion cleanup, node maps, or public instance/ref behavior.
- Events are not delegated through React DOM-compatible listener setup and priority mapping.
- Controlled forms lack value tracking, selection preservation, event/change handling, and restore semantics.
- Hydration lacks server marker compatibility, mismatch diagnostics, recoverable errors, and event replay.
- Resource hints, singletons, view transitions, or `dangerouslySetInnerHTML` are involved without security-oriented oracles.
- React and Fast React are not running through equivalent public entrypoints, modes, or profiler configurations.

## Future Mergeable Slices

These are benchmark/tooling slices, not source implementation slices. They are independently mergeable and should remain fail-closed.

1. `worker-benchmark-manifest-schema`
   - Write scope: `benchmarks/react-dom/README.md`, `benchmarks/react-dom/manifest.schema.json`, `benchmarks/react-dom/scenarios/example.blocked.json`, `worker-progress/worker-benchmark-manifest-schema.md`.
   - Task: define the scenario manifest schema, gate vocabulary, lane names, result status names, and blocked example.
   - Verification: schema validates the example; required fields reject a missing gate; no source tests.

2. `worker-benchmark-react-19-baseline-lock`
   - Write scope: `benchmarks/baselines/react-19.2.6/**`, `worker-progress/worker-benchmark-react-19-baseline-lock.md`.
   - Task: add exact baseline package metadata, lockfile, integrity record, install instructions, and mode matrix for React, React DOM, and Scheduler.
   - Verification: baseline install works with lifecycle scripts disabled; tarball integrities match; package export probes match worker 033 evidence.

3. `worker-benchmark-gate-checker`
   - Write scope: `benchmarks/tools/gate-check.mjs`, `benchmarks/tools/test-fixtures/**`, `worker-progress/worker-benchmark-gate-checker.md`.
   - Task: implement a manifest preflight that maps scenario gates to conformance status and fails closed for missing/red gates.
   - Verification: fixture manifests cover green, red, missing, and diagnostic-only cases; red gates skip speedup output.

4. `worker-benchmark-result-schema`
   - Write scope: `benchmarks/results/schema.json`, `benchmarks/tools/compare-results.mjs`, `benchmarks/tools/test-fixtures/results/**`, `worker-progress/worker-benchmark-result-schema.md`.
   - Task: define result JSON, statistical fields, artifact references, conformance status, and comparison threshold behavior.
   - Verification: fixture result comparison reports stable, regression, improvement, noise-bound, and not-comparable statuses.

5. `worker-benchmark-process-runner`
   - Write scope: `benchmarks/tools/run-react-dom-benchmark.mjs`, `benchmarks/tools/process-runner/**`, `worker-progress/worker-benchmark-process-runner.md`.
   - Task: run one implementation/mode/scenario per child process with fresh module graphs, environment variables, and result files.
   - Verification: fixture packages prove module-cache isolation, `NODE_ENV` isolation, nonzero exit handling, timeout handling, and no mixed React/Fast React globals.

6. `worker-benchmark-jsdom-dom-runner`
   - Write scope: `benchmarks/tools/jsdom-runner/**`, `benchmarks/react-dom/runners/jsdom.md`, `worker-progress/worker-benchmark-jsdom-dom-runner.md`.
   - Task: define the Node/jsdom DOM runner contract, fresh document/container lifecycle, root marker cleanup checks, and DOM snapshot capture.
   - Verification: fixture scenarios prove fresh DOM setup/teardown and blocked status when a semantic assertion fails.

7. `worker-benchmark-browser-trace-runner`
   - Write scope: `benchmarks/tools/browser-runner/**`, `benchmarks/react-dom/runners/browser.md`, `worker-progress/worker-benchmark-browser-trace-runner.md`.
   - Task: add browser-runner design and trace capture hooks for Performance traces and React profiling lanes.
   - Verification: local browser smoke fixture captures trace metadata and records lane/mode/environment without publishing product numbers.

8. `worker-benchmark-root-lifecycle-scenarios`
   - Write scope: `benchmarks/react-dom/scenarios/root-lifecycle/**`, `worker-progress/worker-benchmark-root-lifecycle-scenarios.md`.
   - Task: add blocked scenario manifests for `createRoot`, `root.render`, `root.unmount`, duplicate-root warnings, and `flushSync` once root gates are green.
   - Verification: gate checker marks scenarios blocked until merged client-root/root-scheduler evidence exists.

9. `worker-benchmark-dom-mutation-scenarios`
   - Write scope: `benchmarks/react-dom/scenarios/dom-mutation/**`, `worker-progress/worker-benchmark-dom-mutation-scenarios.md`.
   - Task: add blocked scenario manifests for static mount, keyed update, text update, props/styles, custom elements, deletion cleanup, refs, and portals.
   - Verification: gate checker requires DOM mutation, client-root, scheduler, and relevant portal/ref gates.

10. `worker-benchmark-event-form-hydration-scenarios`
    - Write scope: `benchmarks/react-dom/scenarios/events/**`, `benchmarks/react-dom/scenarios/forms/**`, `benchmarks/react-dom/scenarios/hydration/**`, `worker-progress/worker-benchmark-event-form-hydration-scenarios.md`.
    - Task: add blocked scenario manifests for event priority, controlled forms, and hydration/replay workloads.
    - Verification: gate checker keeps all scenarios blocked until event, form, hydration, and server marker evidence is merged.

11. `worker-benchmark-boundary-counters-plan`
    - Write scope: `benchmarks/react-dom/instrumentation/boundary-counters.md`, `worker-progress/worker-benchmark-boundary-counters-plan.md`.
    - Task: specify boundary counters needed from JS packages, N-API, Rust internals, and host adapters before headline React DOM results.
    - Verification: review-only report with counter names, owners, and privacy/security notes.

12. `worker-benchmark-dashboard-report`
    - Write scope: `benchmarks/react-dom/dashboard-format.md`, `benchmarks/results/examples/**`, `worker-progress/worker-benchmark-dashboard-report.md`.
    - Task: define how reports display conformance gates beside timings and profiler artifacts.
    - Verification: example dashboard shows blocked, diagnostic, comparable, regression, and improvement cases without hiding semantic status.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan is anchored in merged worker evidence and treats active workers 046-052 as unavailable.
- It separates package, root, mutation, event, form, hydration, resource, and app benchmarks so a green result in one area cannot imply broader compatibility.
- It keeps direct facades and diagnostics from becoming headline DOM rendering claims.

Maintainability:

- Benchmark scenarios are manifest-driven and gate-driven, which lets future workers add definitions before implementation without changing runner code.
- Future tooling slices have concrete write scopes and verification criteria.
- Runtime compatibility and TypeScript compatibility remain separate to avoid conflating declaration gaps with runtime performance.

Performance:

- Public-path measurement is prioritized for product claims, while internal Rust and boundary timings are preserved as diagnostic evidence.
- The metrics require host operation counts, boundary counters, and profiler artifacts so performance changes can be traced to root causes.
- Mode separation prevents invalid comparisons between React development builds and Fast React optimized builds.

Security:

- Baseline installs should disable lifecycle scripts and verify tarball integrity.
- DOM benchmarks touching `dangerouslySetInnerHTML`, URL-like attributes, resource hints, singletons, hydration, server markers, form actions, or view transitions require dedicated compatibility and security evidence before timing.
- Runner isolation should avoid leaking DOM nodes, JS callback handles, fiber/root tokens, or profiler artifacts across samples.

## Commands Run

```sh
pwd && rg --files -g 'WORKER_BRIEF.md' -g 'MASTER_PLAN.md' -g 'MASTER_PROGRESS.md' -g 'AGENTS.md' -g 'worker-progress/**'
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-009-benchmark-strategy.md
sed -n '1,320p' worker-progress/worker-033-react-dom-inventory.md
sed -n '1,320p' worker-progress/worker-040-dom-mutation-renderer-plan.md
sed -n '1,320p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '320,760p' worker-progress/worker-033-react-dom-inventory.md
sed -n '320,760p' worker-progress/worker-044-react-dom-client-roots-plan.md
rg -n "benchmark|performance|Profiler|profiling|gate|oracle|conformance|placeholder|blocked|not comparable|React 19\\.2\\.6|19\\.2\\.6|runner|isolation|metrics|sample|warmup|variance|speed|boundary|DOM|createRoot|hydrateRoot|flushSync|portal|mutation|event|scheduler|lane|controlled|hydration" worker-progress/worker-009-benchmark-strategy.md worker-progress/worker-033-react-dom-inventory.md worker-progress/worker-040-dom-mutation-renderer-plan.md worker-progress/worker-044-react-dom-client-roots-plan.md
git status --short --untracked-files=all
test -e worker-progress/worker-074-benchmark-react-dom-baseline-plan.md && sed -n '1,80p' worker-progress/worker-074-benchmark-react-dom-baseline-plan.md || true
```

Nested read-only hypothesis checks were started with managed explorer agents:

- Compatibility gates: asked the agent to inspect workers 009, 033, 040, and 044 and return required gates before performance numbers count.
- Runner/tooling: asked the agent to inspect workers 009, 033, 040, and 044 and return requirements for React 19.2.6 comparison setup, runner isolation, metrics, and future benchmark/tooling slices.

No source tests were run because this task is report-only. No temporary local probes were created.

## Changed Files

- `worker-progress/worker-074-benchmark-react-dom-baseline-plan.md`

## Risks And Follow-Up Tasks

- React DOM benchmarks will remain mostly blocked until client root, root scheduler, DOM mutation, event priority, controlled form, hydration, resource, and server marker evidence is merged.
- The first tooling workers must preserve fail-closed behavior; a permissive runner would recreate the invalid speedup risk identified by worker 009.
- Browser benchmarking needs a separate runner from Node/jsdom because layout, Performance traces, event behavior, and browser scheduling are different enough to affect conclusions.
- Boundary counters require cooperation from future package, N-API, Rust, and host-adapter implementations; without them, profiler interpretation will be too coarse.
- Hydration and resource scenarios are security-sensitive and should not be admitted before dedicated mismatch/resource/serialization evidence exists.

Recommended next tasks:

- Start with `worker-benchmark-manifest-schema`, `worker-benchmark-react-19-baseline-lock`, and `worker-benchmark-gate-checker`.
- Add result schema and process runner only after the gate checker can block missing compatibility evidence.
- Add root, DOM mutation, event/form/hydration scenario manifests as blocked definitions, then unblock each only when the corresponding conformance and implementation workers are merged.

## Completion Checklist

- [x] Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Called `create_goal` for this worker task.
- [x] Wrote only `worker-progress/worker-074-benchmark-react-dom-baseline-plan.md`.
- [x] Used merged evidence from workers 009, 033, 040, and 044.
- [x] Treated active workers 046 through 052 as unavailable.
- [x] Gated benchmark plans by compatibility evidence and did not optimize placeholder behavior.
- [x] Split future work into independently mergeable benchmark/tooling slices with concrete write scopes and verification.
- [x] Covered benchmark scenarios, semantic gates, React 19.2.6 comparison setup, runner isolation, metrics, and when not to benchmark yet.
- [x] Reviewed quality, maintainability, performance, and security implications.
