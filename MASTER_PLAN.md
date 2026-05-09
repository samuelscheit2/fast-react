# Fast React Master Plan

Last updated: 2026-05-10

## Mission

Build an almost 1-to-1 React reimplementation in Rust that is faster than the JavaScript implementation while remaining generic enough for `react-dom`, `react-native`, and other renderer-dependent ecosystems.

Current compatibility target discovered from npm on 2026-05-09:

- `react`: 19.2.6
- `react-dom`: 19.2.6
- `@types/react`: 19.2.14

Local source reference clone:

- `/Users/user/Developer/Developer/react-reference`
- Upstream `facebook/react` tag `v19.2.6`
- Commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`

Breaking changes are allowed when they remove root causes or enable a sound architecture. Compatibility gaps must be explicit, tested, and tracked.

## Operating Model

- Orchestrator owns planning, task decomposition, worker routing, merge decisions, and progress tracking.
- Workers own implementation or research tasks in isolated scopes.
- Workers read `WORKER_BRIEF.md`; `ORCHESTRATOR.md` is orchestrator-only.
- Workers must record progress in `worker-progress/<worker-id>.md`.
- Top-level workers are real Codex subprocesses launched in tmux by the orchestrator. New and relaunched workers should use the interactive Codex TUI wrapped by `script -q -F` so the tmux pane is readable while logs are captured.
- Top-level tmux workers may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside their sessions when useful for hypothesis testing or verification. Nested managed agents do not count against the orchestrator's 30 top-level tmux worker limit and may push the aggregate agent/process count above 30.
- Code work should happen in Git worktrees whenever possible.
- Workers must review their changes for quality, maintainability, performance, and security before reporting completion.
- Workers must use `/goal` (the Codex `create_goal` tool) immediately at task start using the objective in their assigned prompt, before research, file reads, implementation, or verification. They should verify with `get_goal`, record active goal status/objective in their report, and call `update_goal(status: "complete")` only after the whole worker task is complete.

## Architecture Hypotheses To Test

1. A Rust core should model React's element, fiber, lane, hook, context, and update queue semantics independently from any renderer.
2. Renderer integration should use a host-config boundary similar to React reconciler so `react-dom`, `react-native`, and future targets can provide platform behavior.
3. The first public integration should be a JS package that can run React-compatible tests through Node, likely using N-API first and WASM only if the benchmark or deployment constraints justify it.
4. Conformance should be anchored on observed React 19.2.6 behavior, not inferred API names.
5. Performance work should wait until correctness and representative benchmarks exist; otherwise speedups may only measure missing semantics.
6. Reference-source investigations should use the local `react-reference` clone, while conformance claims should still be backed by published package tarballs and runtime oracles.

## Milestones

### M0: Orchestration Foundation

Goal: Make the project runnable by workers without overlapping writes.

Deliverables:

- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `WORKER_BRIEF.md`
- Worker progress convention in `worker-progress/`
- Initial Git repository and worktree strategy
- First worker research reports for architecture, conformance, and scaffold strategy

Dependencies: none.

### M1: Compatibility Inventory

Goal: Define the compatibility surface and behavioral test strategy for React 19.2.6.

Deliverables:

- Public API inventory for `react` and relevant `react-dom` integration points
- Prioritized semantic inventory: elements, refs, children, hooks, context, memo/lazy, Suspense, transitions, `use`, cache, actions, server-related boundaries
- Test plan mapping React behavior to conformance tests
- Decisions on which upstream tests or fixtures can be reused

Dependencies: M0.

### M2: Rust Workspace Scaffold

Goal: Establish crate boundaries that allow core semantics to develop independently from JS bindings and renderers.

Likely deliverables:

- Cargo workspace
- Core crate for React data model and reconciler primitives
- Scheduler crate or module if lane scheduling needs isolation
- Renderer host-config crate or trait boundary
- JS binding package skeleton
- Basic CI commands and local test commands

Dependencies: M0, initial M1 findings.

### M3: Element And Runtime Model

Goal: Implement React-like element creation and runtime data structures.

Deliverables:

- Element model with keys, refs, props, owner metadata strategy, fragments, portals, and symbols or symbol-equivalent tagging
- Children traversal helpers
- Dev/prod mode policy
- Unit tests comparing observable JS behavior through the binding layer where applicable

Dependencies: M1, M2.

### M4: Fiber, Updates, And Scheduling

Goal: Implement the root reconciliation engine.

Deliverables:

- Fiber node model
- Update queues
- Lane priorities and scheduling model
- Begin/complete/commit phases
- Error and bailout semantics
- Tests for priority ordering and update consistency

Dependencies: M2, M3.

### M5: Hooks And Context

Goal: Implement modern function component semantics.

Deliverables:

- `useState`, `useReducer`, `useEffect`, `useLayoutEffect`, `useMemo`, `useCallback`, `useRef`, `useContext`, `useId`, `useSyncExternalStore`, `useTransition`, `useDeferredValue`, `useOptimistic`, `useActionState`, and `use`
- Rules-of-hooks diagnostics strategy
- Context propagation and invalidation
- Effect lifecycle tests

Dependencies: M4.

### M6: Renderer Host Boundary

Goal: Prove the core can target multiple renderer styles.

Deliverables:

- Host config trait/interface
- Minimal test renderer
- DOM-oriented proof renderer or adapter
- Mutation, persistence, hydration, and portal strategy decisions

Dependencies: M4, M5.

### M7: JS Package Integration

Goal: Expose the Rust implementation as React-compatible packages for test and benchmark consumers.

Deliverables:

- Package layout for `fast-react` and compatibility entrypoints
- N-API or WASM binding implementation
- TypeScript declarations or reuse strategy
- Module resolution and bundler behavior tests

Dependencies: M2, M3, M6.

### M8: Conformance And Benchmark Harness

Goal: Measure correctness and speed against React 19.2.6.

Deliverables:

- React behavior comparison suite
- Microbenchmarks for element creation, updates, hooks, context, and scheduler work
- Renderer benchmarks with representative app trees
- Regression tracking report

Dependencies: M3 through M7.

### M9: Iterative Compatibility Closure

Goal: Close the highest-impact gaps with evidence.

Deliverables:

- Compatibility dashboard
- Known divergence list
- Performance profiles and root-cause fixes
- Release candidate criteria

Dependencies: M8.

## Initial Worker Queue

| Worker                                        | Task                                                                                                               | Write Scope                                                                                                                                                                                                                                                                                                                                     | Depends On                              | Status  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------- |
| worker-001-architecture                       | Test architecture hypotheses against React 19.2.6 semantics and Rust constraints                                   | `worker-progress/worker-001-architecture.md`                                                                                                                                                                                                                                                                                                    | M0                                      | merged  |
| worker-002-conformance                        | Design the conformance inventory and test harness strategy                                                         | `worker-progress/worker-002-conformance.md`                                                                                                                                                                                                                                                                                                     | M0                                      | merged  |
| worker-003-scaffold                           | Propose initial Cargo and package scaffold with worktree-safe task splits                                          | `worker-progress/worker-003-scaffold.md`                                                                                                                                                                                                                                                                                                        | M0                                      | merged  |
| worker-004-api-inventory                      | Build exact public API, runtime export, subpath, and type inventory                                                | `worker-progress/worker-004-api-inventory.md`                                                                                                                                                                                                                                                                                                   | M0                                      | merged  |
| worker-005-upstream-tests                     | Assess upstream React 19.2.6 test reuse and harness requirements                                                   | `worker-progress/worker-005-upstream-tests.md`                                                                                                                                                                                                                                                                                                  | M0                                      | merged  |
| worker-006-binding-strategy                   | Design JS-to-Rust binding and package artifact strategy                                                            | `worker-progress/worker-006-binding-strategy.md`                                                                                                                                                                                                                                                                                                | M0                                      | merged  |
| worker-007-scheduler-fiber                    | Investigate scheduler, lanes, fiber, update queue, and effect semantics                                            | `worker-progress/worker-007-scheduler-fiber.md`                                                                                                                                                                                                                                                                                                 | M0                                      | merged  |
| worker-008-renderer-host-config               | Define renderer host-config boundary across DOM, native, hydration, and portals                                    | `worker-progress/worker-008-renderer-host-config.md`                                                                                                                                                                                                                                                                                            | M0                                      | merged  |
| worker-009-benchmark-strategy                 | Design conformance-gated benchmark and profiling strategy                                                          | `worker-progress/worker-009-benchmark-strategy.md`                                                                                                                                                                                                                                                                                              | M0                                      | merged  |
| worker-010-initial-scaffold                   | Implement initial Cargo/npm workspace, placeholder crates/packages, smoke checks, and CI skeleton                  | root scaffold paths plus `worker-progress/worker-010-initial-scaffold.md`                                                                                                                                                                                                                                                                       | workers 001-003                         | merged  |
| worker-011-core-element-model                 | Implement first Rust core element/model primitives                                                                 | `crates/fast-react-core/**`, `worker-progress/worker-011-core-element-model.md`                                                                                                                                                                                                                                                                 | workers 001,004,010                     | merged  |
| worker-012-host-config-traits                 | Implement first capability-grouped host-config trait skeleton                                                      | `crates/fast-react-host-config/**`, `worker-progress/worker-012-host-config-traits.md`                                                                                                                                                                                                                                                          | workers 008,010                         | merged  |
| worker-013-conformance-inventory-tooling      | Implement initial conformance inventory tooling placeholder                                                        | `tests/conformance/**`, `worker-progress/worker-013-conformance-inventory-tooling.md`                                                                                                                                                                                                                                                           | workers 002,004,010                     | merged  |
| worker-014-react-entrypoint-placeholders      | Improve React package placeholders and smoke tests from API inventory                                              | `packages/react/**`, `tests/smoke/**`, `worker-progress/worker-014-react-entrypoint-placeholders.md`                                                                                                                                                                                                                                            | workers 004,010                         | merged  |
| worker-015-native-loader-boundary             | Improve native loader and Rust N-API boundary placeholders                                                         | `bindings/node/**`, `crates/fast-react-napi/**`, `worker-progress/worker-015-native-loader-boundary.md`                                                                                                                                                                                                                                         | workers 006,010                         | merged  |
| worker-016-root-lockfile-sync                 | Synchronize root `package-lock.json` after package metadata changes                                                | `package-lock.json`, `worker-progress/worker-016-root-lockfile-sync.md`                                                                                                                                                                                                                                                                         | workers 013,014,015                     | merged  |
| worker-017-runtime-inventory-generation       | Generate deterministic React 19.2.6 runtime/package inventory artifacts                                            | `tests/conformance/**`, `worker-progress/worker-017-runtime-inventory-generation.md`                                                                                                                                                                                                                                                            | workers 002,004,013,014                 | merged  |
| worker-018-test-renderer-mutation-host        | Implement minimal canonical mutation test renderer                                                                 | `crates/fast-react-test-renderer/**`, `worker-progress/worker-018-test-renderer-mutation-host.md`                                                                                                                                                                                                                                               | workers 008,010,012                     | merged  |
| worker-019-reconciler-host-boundary-migration | Move reconciler placeholder API toward canonical host trait bounds                                                 | `crates/fast-react-reconciler/**`, `worker-progress/worker-019-reconciler-host-boundary-migration.md`                                                                                                                                                                                                                                           | workers 007,008,010,012                 | merged  |
| worker-020-element-object-conformance-probes  | Probe React 19.2.6 element object behavior and plan safe implementation                                            | `worker-progress/worker-020-element-object-conformance-probes.md`                                                                                                                                                                                                                                                                               | workers 001,004,011,014                 | merged  |
| worker-021-element-object-oracle              | Implement deterministic element-object conformance oracle and Fast React mismatch reporting                        | `tests/conformance/**`, `worker-progress/worker-021-element-object-oracle.md`                                                                                                                                                                                                                                                                   | workers 017,020                         | merged  |
| worker-022-host-operation-errors              | Add structured host operation errors for invalid test-renderer operations                                          | `crates/fast-react-host-config/**`, `crates/fast-react-test-renderer/**`, optional compile-only `crates/fast-react-reconciler/**`, `worker-progress/worker-022-host-operation-errors.md`                                                                                                                                                        | workers 018,019                         | merged  |
| worker-023-js-element-factory                 | Implement conformance-backed JS element factory behavior from the checked oracle                                   | `packages/react/**`, `tests/smoke/**`, `tests/conformance/**`, `worker-progress/worker-023-js-element-factory.md`                                                                                                                                                                                                                               | workers 014,020,021                     | merged  |
| worker-024-create-ref-behavior                | Add a deterministic `createRef` oracle and implement covered JS facade behavior                                    | `packages/react/**`, `tests/smoke/**`, `tests/conformance/**`, `worker-progress/worker-024-create-ref-behavior.md`                                                                                                                                                                                                                              | workers 014,017,023                     | merged  |
| worker-025-children-helpers                   | Add a deterministic `Children` helper oracle and implement covered JS facade behavior                              | `packages/react/**`, `tests/smoke/**`, `tests/conformance/**`, `worker-progress/worker-025-children-helpers.md`                                                                                                                                                                                                                                 | workers 014,017,023,024                 | merged  |
| worker-026-memo-lazy-behavior                 | Add a deterministic `memo`/`lazy` wrapper-object oracle and implement covered JS facade behavior                   | `packages/react/**`, `tests/smoke/**`, `tests/conformance/**`, `worker-progress/worker-026-memo-lazy-behavior.md`                                                                                                                                                                                                                               | workers 014,017,021,023,025             | merged  |
| worker-027-forward-ref-behavior               | Add a deterministic `forwardRef` wrapper-object oracle and implement covered JS facade behavior                    | `packages/react/**`, `tests/smoke/**`, `tests/conformance/**`, `worker-progress/worker-027-forward-ref-behavior.md`                                                                                                                                                                                                                             | workers 014,017,021,023,024,026         | merged  |
| worker-028-create-context-behavior            | Add a deterministic `createContext` object oracle and implement covered default-root JS facade behavior            | `packages/react/**`, `tests/smoke/**`, `tests/conformance/**`, `worker-progress/worker-028-create-context-behavior.md`                                                                                                                                                                                                                          | workers 014,017,021,023,024,025,026,027 | merged  |
| worker-029-component-class-behavior           | Add a deterministic `Component`/`PureComponent` class oracle and implement covered default-root JS facade behavior | `packages/react/**`, `tests/smoke/**`, `tests/conformance/**`, `worker-progress/worker-029-component-class-behavior.md`                                                                                                                                                                                                                         | workers 014,017,021,023,028             | merged  |
| worker-030-core-lane-model                    | Implement first React 19.2.6 lane bitset primitives in the Rust core                                               | `crates/fast-react-core/**`, `worker-progress/worker-030-core-lane-model.md`                                                                                                                                                                                                                                                                    | workers 007,011                         | merged  |
| worker-031-host-capability-diagnostics        | Improve host-config capability-set diagnostics and tests                                                           | `crates/fast-react-host-config/**`, `worker-progress/worker-031-host-capability-diagnostics.md`                                                                                                                                                                                                                                                 | workers 008,012,022                     | merged  |
| worker-032-native-boundary-guardrails         | Tighten native binding placeholder guardrails and platform target checks                                           | `bindings/node/**`, `crates/fast-react-napi/**`, `worker-progress/worker-032-native-boundary-guardrails.md`                                                                                                                                                                                                                                     | workers 006,015                         | merged  |
| worker-033-react-dom-inventory                | Build a report-only React DOM 19.2.6 package and behavior inventory                                                | `worker-progress/worker-033-react-dom-inventory.md`                                                                                                                                                                                                                                                                                             | workers 004,005,008,017                 | merged  |
| worker-034-scheduler-package-inventory        | Build a report-only public scheduler package behavior inventory                                                    | `worker-progress/worker-034-scheduler-package-inventory.md`                                                                                                                                                                                                                                                                                     | workers 007,017                         | merged  |
| worker-035-package-surface-scaffolds          | Add loud-placeholder package scaffolds for React DOM and scheduler surfaces without behavior implementation        | `packages/react-dom/**`, `packages/scheduler/**`, `tests/smoke/**`, optional root `package.json`/`package-lock.json`, `worker-progress/worker-035-package-surface-scaffolds.md`                                                                                                                                                                 | workers 033,034                         | merged  |
| worker-036-react-dom-export-oracle            | Add deterministic React DOM runtime export, descriptor, condition, and blocked-subpath oracle files                | `tests/conformance/src/react-dom-export-*.mjs`, `tests/conformance/scripts/*react-dom-export-oracle.mjs`, `tests/conformance/test/react-dom-export-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-export-oracle.json`, `worker-progress/worker-036-react-dom-export-oracle.md`                                             | workers 017,033                         | merged  |
| worker-037-react-dom-type-inventory           | Add deterministic React DOM declaration/runtime type-gap inventory files                                           | `tests/conformance/src/react-dom-type-*.mjs`, `tests/conformance/scripts/*react-dom-type-inventory.mjs`, `tests/conformance/test/react-dom-type-inventory.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-type-inventory.json`, `worker-progress/worker-037-react-dom-type-inventory.md`                                           | workers 033                             | merged  |
| worker-038-scheduler-root-oracle              | Add deterministic public `scheduler@0.27.0` root behavior oracle files                                             | `tests/conformance/src/scheduler-root-*.mjs`, `tests/conformance/scripts/*scheduler-root-oracle.mjs`, `tests/conformance/test/scheduler-root-oracle.test.mjs`, `tests/conformance/oracles/scheduler-0.27.0-root-oracle.json`, `worker-progress/worker-038-scheduler-root-oracle.md`                                                             | workers 017,034                         | merged  |
| worker-039-scheduler-variant-oracles          | Add deterministic scheduler variant/deep-import inventory and oracle files                                         | `tests/conformance/src/scheduler-variant-*.mjs`, `tests/conformance/scripts/*scheduler-variant-oracle.mjs`, `tests/conformance/test/scheduler-variant-oracle.test.mjs`, `tests/conformance/oracles/scheduler-0.27.0-variant-oracle.json`, `worker-progress/worker-039-scheduler-variant-oracles.md`                                             | workers 017,034                         | merged  |
| worker-040-dom-mutation-renderer-plan         | Produce a report-only DOM mutation host implementation plan                                                        | `worker-progress/worker-040-dom-mutation-renderer-plan.md`                                                                                                                                                                                                                                                                                      | workers 008,012,018,019,033             | merged  |
| worker-041-dom-events-priority-plan           | Produce a report-only DOM events, event priority, and hydration replay plan                                        | `worker-progress/worker-041-dom-events-priority-plan.md`                                                                                                                                                                                                                                                                                        | workers 007,008,030,033                 | merged  |
| worker-042-react-dom-server-fizz-plan         | Produce a report-only React DOM server/static Fizz compatibility plan                                              | `worker-progress/worker-042-react-dom-server-fizz-plan.md`                                                                                                                                                                                                                                                                                      | workers 005,033                         | merged  |
| worker-043-react-dom-hydration-plan           | Produce a report-only hydration model and marker compatibility plan                                                | `worker-progress/worker-043-react-dom-hydration-plan.md`                                                                                                                                                                                                                                                                                        | workers 008,033,042                     | merged  |
| worker-044-react-dom-client-roots-plan        | Produce a report-only client roots, update priority, and root object behavior plan                                 | `worker-progress/worker-044-react-dom-client-roots-plan.md`                                                                                                                                                                                                                                                                                     | workers 007,008,030,033                 | merged  |
| worker-045-scheduler-root-implementation      | Implement public `scheduler@0.27.0` root placeholder behavior against the checked root oracle                      | `packages/scheduler/**`, `tests/smoke/**`, `worker-progress/worker-045-scheduler-root-implementation.md`                                                                                                                                                                                                                                        | workers 034,035,038,039                 | merged  |
| worker-046-react-dom-client-root-oracle       | Add deterministic React DOM client root public behavior oracle files                                               | `tests/conformance/src/react-dom-client-root-*.mjs`, `tests/conformance/scripts/*react-dom-client-root*.mjs`, `tests/conformance/test/react-dom-client-root-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-client-root-oracle.json`, `worker-progress/worker-046-react-dom-client-root-oracle.md`                          | workers 033,036,044                     | running |
| worker-047-core-root-lane-bookkeeping         | Implement first core root lane bookkeeping helpers beyond the lane bitset primitives                               | `crates/fast-react-core/src/root_lanes.rs`, `crates/fast-react-core/src/lib.rs`, `worker-progress/worker-047-core-root-lane-bookkeeping.md`                                                                                                                                                                                                     | workers 007,030,044                     | running |
| worker-048-react-dom-event-priority-oracle    | Add deterministic React DOM event-name/update-priority oracle files                                                | `tests/conformance/src/react-dom-event-priority-*.mjs`, `tests/conformance/scripts/*react-dom-event-priority*.mjs`, `tests/conformance/test/react-dom-event-priority-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-event-priority-oracle.json`, `worker-progress/worker-048-react-dom-event-priority-oracle.md`           | workers 030,041                         | merged  |
| worker-049-react-dom-hydration-marker-oracle  | Add deterministic React DOM hydration marker and mismatch evidence oracle files                                    | `tests/conformance/src/react-dom-hydration-marker-*.mjs`, `tests/conformance/scripts/*react-dom-hydration-marker*.mjs`, `tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-hydration-marker-oracle.json`, `worker-progress/worker-049-react-dom-hydration-marker-oracle.md` | workers 033,043                         | running |
| worker-050-react-dom-server-static-oracle     | Add deterministic React DOM server/static surface behavior oracle files                                            | `tests/conformance/src/react-dom-server-static-*.mjs`, `tests/conformance/scripts/*react-dom-server-static*.mjs`, `tests/conformance/test/react-dom-server-static-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-server-static-oracle.json`, `worker-progress/worker-050-react-dom-server-static-oracle.md`                | workers 033,042                         | merged  |
| worker-051-dom-host-token-boundary            | Add first DOM host token boundary types to host-config without DOM implementation behavior                         | `crates/fast-react-host-config/**`, `worker-progress/worker-051-dom-host-token-boundary.md`                                                                                                                                                                                                                                                     | workers 008,012,040                     | merged  |
| worker-052-scheduler-mock-oracle              | Add deterministic `scheduler/unstable_mock` behavior oracle files                                                  | `tests/conformance/src/scheduler-mock-*.mjs`, `tests/conformance/scripts/*scheduler-mock*.mjs`, `tests/conformance/test/scheduler-mock-oracle.test.mjs`, `tests/conformance/oracles/scheduler-0.27.0-mock-oracle.json`, `worker-progress/worker-052-scheduler-mock-oracle.md`                                                                   | workers 034,038,039                     | merged  |
| worker-053-react-dom-types-policy             | Produce a report-only React DOM TypeScript declaration shipping policy                                             | `worker-progress/worker-053-react-dom-types-policy.md`                                                                                                                                                                                                                                                                                          | workers 033,037                         | merged  |
| worker-054-react-dom-root-export-implementation | Implement the lowest-risk React DOM root/profiling/test-utils export behavior against the checked export oracle | `packages/react-dom/index.js`, `packages/react-dom/profiling.js`, `packages/react-dom/test-utils.js`, `packages/react-dom/placeholder-utils.js`, `tests/smoke/react-dom-root-exports.mjs`, `worker-progress/worker-054-react-dom-root-export-implementation.md` | workers 033,035,036 | running |
| worker-055-react-dom-client-roots-implementation-plan | Produce a report-only implementation plan for React DOM client root objects, render/unmount semantics, and root lifecycle integration | `worker-progress/worker-055-react-dom-client-roots-implementation-plan.md` | workers 007,008,030,033,044 | merged |
| worker-056-react-dom-server-static-implementation-plan | Produce a report-only implementation plan for React DOM server/static rendering slices and Fizz-compatible boundaries | `worker-progress/worker-056-react-dom-server-static-implementation-plan.md` | workers 005,033,042,043 | merged |
| worker-057-react-dom-portal-oracle | Add deterministic React DOM `createPortal` public behavior oracle files | `tests/conformance/src/react-dom-portal-*.mjs`, `tests/conformance/scripts/*react-dom-portal*.mjs`, `tests/conformance/test/react-dom-portal-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-portal-oracle.json`, `worker-progress/worker-057-react-dom-portal-oracle.md` | workers 033,036,040 | merged |
| worker-058-react-dom-flush-sync-batching-oracle | Add deterministic React DOM `flushSync` and `unstable_batchedUpdates` public behavior oracle files | `tests/conformance/src/react-dom-flush-sync-batching-*.mjs`, `tests/conformance/scripts/*react-dom-flush-sync-batching*.mjs`, `tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-flush-sync-batching-oracle.json`, `worker-progress/worker-058-react-dom-flush-sync-batching-oracle.md` | workers 033,036,041,044 | merged |
| worker-059-react-dom-resource-hints-oracle | Add deterministic React DOM resource hint API oracle files | `tests/conformance/src/react-dom-resource-hints-*.mjs`, `tests/conformance/scripts/*react-dom-resource-hints*.mjs`, `tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-resource-hints-oracle.json`, `worker-progress/worker-059-react-dom-resource-hints-oracle.md` | workers 033,036 | merged |
| worker-060-react-dom-form-actions-oracle | Add deterministic React DOM form action and form-status API oracle files | `tests/conformance/src/react-dom-form-actions-*.mjs`, `tests/conformance/scripts/*react-dom-form-actions*.mjs`, `tests/conformance/test/react-dom-form-actions-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-form-actions-oracle.json`, `worker-progress/worker-060-react-dom-form-actions-oracle.md` | workers 033,036,041 | running |
| worker-061-dom-attribute-property-oracle | Add deterministic React DOM attribute/property serialization and mutation oracle files | `tests/conformance/src/dom-attribute-property-*.mjs`, `tests/conformance/scripts/*dom-attribute-property*.mjs`, `tests/conformance/test/dom-attribute-property-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-dom-attribute-property-oracle.json`, `worker-progress/worker-061-dom-attribute-property-oracle.md` | workers 033,040 | merged |
| worker-062-dom-style-dangerous-html-oracle | Add deterministic React DOM style and `dangerouslySetInnerHTML` oracle files | `tests/conformance/src/dom-style-dangerous-html-*.mjs`, `tests/conformance/scripts/*dom-style-dangerous-html*.mjs`, `tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-dom-style-dangerous-html-oracle.json`, `worker-progress/worker-062-dom-style-dangerous-html-oracle.md` | workers 033,040 | merged |
| worker-063-dom-namespace-svg-oracle | Add deterministic React DOM namespace, SVG, and MathML host output oracle files | `tests/conformance/src/dom-namespace-svg-*.mjs`, `tests/conformance/scripts/*dom-namespace-svg*.mjs`, `tests/conformance/test/dom-namespace-svg-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-dom-namespace-svg-oracle.json`, `worker-progress/worker-063-dom-namespace-svg-oracle.md` | workers 033,040 | merged |
| worker-064-dom-controlled-input-oracle | Add deterministic React DOM controlled input/select/textarea oracle files | `tests/conformance/src/dom-controlled-input-*.mjs`, `tests/conformance/scripts/*dom-controlled-input*.mjs`, `tests/conformance/test/dom-controlled-input-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-dom-controlled-input-oracle.json`, `worker-progress/worker-064-dom-controlled-input-oracle.md` | workers 033,040,041 | running |
| worker-065-dom-event-delegation-oracle | Add deterministic React DOM delegated event registration and dispatch behavior oracle files | `tests/conformance/src/dom-event-delegation-*.mjs`, `tests/conformance/scripts/*dom-event-delegation*.mjs`, `tests/conformance/test/dom-event-delegation-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-dom-event-delegation-oracle.json`, `worker-progress/worker-065-dom-event-delegation-oracle.md` | workers 033,041 | merged |
| worker-066-dom-ref-callback-oracle | Add deterministic React DOM ref callback attach/detach ordering oracle files | `tests/conformance/src/dom-ref-callback-*.mjs`, `tests/conformance/scripts/*dom-ref-callback*.mjs`, `tests/conformance/test/dom-ref-callback-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-dom-ref-callback-oracle.json`, `worker-progress/worker-066-dom-ref-callback-oracle.md` | workers 033,040,044 | merged |
| worker-067-react-dom-test-utils-act-oracle | Add deterministic React DOM `test-utils.act` behavior oracle files | `tests/conformance/src/react-dom-test-utils-act-*.mjs`, `tests/conformance/scripts/*react-dom-test-utils-act*.mjs`, `tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-test-utils-act-oracle.json`, `worker-progress/worker-067-react-dom-test-utils-act-oracle.md` | workers 033,036 | merged |
| worker-068-scheduler-post-task-oracle | Add deterministic `scheduler/unstable_post_task` behavior oracle files | `tests/conformance/src/scheduler-post-task-*.mjs`, `tests/conformance/scripts/*scheduler-post-task*.mjs`, `tests/conformance/test/scheduler-post-task-oracle.test.mjs`, `tests/conformance/oracles/scheduler-0.27.0-post-task-oracle.json`, `worker-progress/worker-068-scheduler-post-task-oracle.md` | workers 034,039 | merged |
| worker-069-scheduler-native-entry-oracle | Add deterministic `scheduler` native entrypoint behavior oracle files | `tests/conformance/src/scheduler-native-entry-*.mjs`, `tests/conformance/scripts/*scheduler-native-entry*.mjs`, `tests/conformance/test/scheduler-native-entry-oracle.test.mjs`, `tests/conformance/oracles/scheduler-0.27.0-native-entry-oracle.json`, `worker-progress/worker-069-scheduler-native-entry-oracle.md` | workers 034,039 | merged |
| worker-070-core-update-queue-plan | Produce a report-only implementation plan for React-compatible update queue data structures in Rust core | `worker-progress/worker-070-core-update-queue-plan.md` | workers 007,030 | merged |
| worker-071-core-fiber-flags-effect-plan | Produce a report-only implementation plan for Rust core fiber flags, effect lists, and commit phase metadata | `worker-progress/worker-071-core-fiber-flags-effect-plan.md` | workers 007,030 | merged |
| worker-072-reconciler-root-work-loop-plan | Produce a report-only implementation plan for reconciler root work loop, scheduling, and host commit integration | `worker-progress/worker-072-reconciler-root-work-loop-plan.md` | workers 007,008,019,030,040,044 | merged |
| worker-073-test-renderer-update-model-plan | Produce a report-only implementation plan for test-renderer updates, act integration, and tree serialization | `worker-progress/worker-073-test-renderer-update-model-plan.md` | workers 018,022,044 | merged |
| worker-074-benchmark-react-dom-baseline-plan | Produce a report-only benchmark plan for React DOM compatibility and performance baselines | `worker-progress/worker-074-benchmark-react-dom-baseline-plan.md` | workers 009,033,040,044 | merged |
| worker-075-core-event-priority | Implement lane-backed core event priority primitives | `crates/fast-react-core/src/event_priority.rs`, `crates/fast-react-core/src/lib.rs`, `worker-progress/worker-075-core-event-priority.md` | workers 030,041,055,073 | running |
| worker-076-core-fiber-flags | Implement core fiber and hook effect flag bitsets | `crates/fast-react-core/src/fiber_flags.rs`, `crates/fast-react-core/src/hook_effect_flags.rs`, `crates/fast-react-core/src/lib.rs`, `worker-progress/worker-076-core-fiber-flags.md` | workers 007,030,071,072 | running |
| worker-077-core-fiber-topology-plan | Produce a report-only plan for core fiber topology, IDs, alternates, and deletion storage | `worker-progress/worker-077-core-fiber-topology-plan.md` | workers 007,030,071,072 | merged |
| worker-078-hook-effect-ring-plan | Produce a report-only plan for per-fiber hook effect rings and effect callback storage | `worker-progress/worker-078-hook-effect-ring-plan.md` | workers 007,071,073 | merged |
| worker-079-reconciler-fiber-root-model-plan | Produce a report-only plan for reconciler FiberRoot and HostRoot records | `worker-progress/worker-079-reconciler-fiber-root-model-plan.md` | workers 019,044,055,072,073 | merged |
| worker-080-reconciler-host-root-update-queue-plan | Produce a report-only plan for HostRoot update queues and update_container APIs | `worker-progress/worker-080-reconciler-host-root-update-queue-plan.md` | workers 007,044,055,070,072,073 | merged |
| worker-081-reconciler-root-scheduler-act-plan | Produce a report-only plan for root scheduling, sync flushing, and act queue routing | `worker-progress/worker-081-reconciler-root-scheduler-act-plan.md` | workers 007,041,044,055,072,073 | merged |
| worker-082-reconciler-commit-ordering-plan | Produce a report-only plan for commit ordering, host mutation phase calls, and root.current switching | `worker-progress/worker-082-reconciler-commit-ordering-plan.md` | workers 018,019,022,071,072,073 | merged |
| worker-083-react-test-renderer-export-oracle | Add deterministic react-test-renderer package export and descriptor oracle files | `tests/conformance/src/react-test-renderer-export-*.mjs`, `tests/conformance/scripts/*react-test-renderer-export*.mjs`, `tests/conformance/test/react-test-renderer-export-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-test-renderer-export-oracle.json`, `worker-progress/worker-083-react-test-renderer-export-oracle.md` | workers 017,073 | running |
| worker-084-react-test-renderer-root-lifecycle-oracle | Add deterministic react-test-renderer create/update/unmount lifecycle oracle files | `tests/conformance/src/react-test-renderer-root-lifecycle-*.mjs`, `tests/conformance/scripts/*react-test-renderer-root-lifecycle*.mjs`, `tests/conformance/test/react-test-renderer-root-lifecycle-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-test-renderer-root-lifecycle-oracle.json`, `worker-progress/worker-084-react-test-renderer-root-lifecycle-oracle.md` | workers 017,073,083 | running |
| worker-085-react-test-renderer-serialization-oracle | Add deterministic react-test-renderer toJSON/toTree/TestInstance oracle files | `tests/conformance/src/react-test-renderer-serialization-*.mjs`, `tests/conformance/scripts/*react-test-renderer-serialization*.mjs`, `tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-test-renderer-serialization-oracle.json`, `worker-progress/worker-085-react-test-renderer-serialization-oracle.md` | workers 017,073,083 | running |
| worker-086-react-test-renderer-act-oracle | Add deterministic react-test-renderer act and flushSync scheduling oracle files | `tests/conformance/src/react-test-renderer-act-*.mjs`, `tests/conformance/scripts/*react-test-renderer-act*.mjs`, `tests/conformance/test/react-test-renderer-act-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-test-renderer-act-oracle.json`, `worker-progress/worker-086-react-test-renderer-act-oracle.md` | workers 017,041,073,083 | running |
| worker-087-react-test-renderer-error-surface-oracle | Add deterministic react-test-renderer public error surface oracle files | `tests/conformance/src/react-test-renderer-error-surface-*.mjs`, `tests/conformance/scripts/*react-test-renderer-error-surface*.mjs`, `tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-test-renderer-error-surface-oracle.json`, `worker-progress/worker-087-react-test-renderer-error-surface-oracle.md` | workers 017,022,073,083 | running |
| worker-088-dom-container-root-markers-oracle | Add deterministic React DOM container validation and root marker oracle files | `tests/conformance/src/react-dom-container-root-markers-*.mjs`, `tests/conformance/scripts/*react-dom-container-root-markers*.mjs`, `tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-container-root-markers-oracle.json`, `worker-progress/worker-088-dom-container-root-markers-oracle.md` | workers 033,044,055 | running |
| worker-089-dom-root-listener-installation-oracle | Add deterministic React DOM root and portal listener installation oracle files | `tests/conformance/src/react-dom-root-listener-installation-*.mjs`, `tests/conformance/scripts/*react-dom-root-listener-installation*.mjs`, `tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-root-listener-installation-oracle.json`, `worker-progress/worker-089-dom-root-listener-installation-oracle.md` | workers 041,044,055,065 | running |
| worker-090-dom-node-map-public-instance-plan | Produce a report-only plan for DOM node maps, public instance lookup, and cleanup | `worker-progress/worker-090-dom-node-map-public-instance-plan.md` | workers 040,041,044,051,055,072 | merged |
| worker-091-dom-mutation-minimum-plan | Produce a report-only plan for minimal DOM mutation host creation, context, and mutation operations | `worker-progress/worker-091-dom-mutation-minimum-plan.md` | workers 040,051,055,061,062,063 | merged |
| worker-092-react-dom-create-root-facade-plan | Produce a report-only plan for the React DOM createRoot public facade and root object | `worker-progress/worker-092-react-dom-create-root-facade-plan.md` | workers 036,044,055,088,089 | merged |
| worker-093-root-render-integration-plan | Produce a report-only plan for root.render integration with HostRoot updates and scheduling | `worker-progress/worker-093-root-render-integration-plan.md` | workers 044,055,080,081,092 | merged |
| worker-094-root-unmount-flushsync-plan | Produce a report-only plan for root.unmount and flushSync integration | `worker-progress/worker-094-root-unmount-flushsync-plan.md` | workers 044,055,058,081,092 | merged |
| worker-095-hydrate-root-facade-plan | Produce a report-only plan for hydrateRoot public facade, hydration root state, and replay hooks | `worker-progress/worker-095-hydrate-root-facade-plan.md` | workers 043,049,055,088,089 | merged |
| worker-096-native-root-boundary-plan | Produce a report-only plan for private native root handles and JS callback lifetime boundaries | `worker-progress/worker-096-native-root-boundary-plan.md` | workers 006,015,032,055,079 | merged |
| worker-097-react-act-oracle | Add deterministic React public act behavior oracle files | `tests/conformance/src/react-act-*.mjs`, `tests/conformance/scripts/*react-act*.mjs`, `tests/conformance/test/react-act-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-act-oracle.json`, `worker-progress/worker-097-react-act-oracle.md` | workers 017,025,067,073,086 | running |
| worker-098-dom-event-plugin-extraction-plan | Produce a report-only plan for DOM event plugin extraction, priority, batching, and controlled restore | `worker-progress/worker-098-dom-event-plugin-extraction-plan.md` | workers 041,048,065,089 | merged |
| worker-099-core-hook-state-queue-plan | Produce a report-only plan for hook state queues, eager state, render-phase updates, and optimistic updates | `worker-progress/worker-099-core-hook-state-queue-plan.md` | workers 007,070,078 | merged |
| worker-100-reconciler-function-component-render-plan | Produce a report-only plan for function component rendering, hooks dispatcher state, and bailout boundaries | `worker-progress/worker-100-reconciler-function-component-render-plan.md` | workers 007,070,071,078,081,099 | merged |
| worker-101-test-renderer-root-api-plan | Produce a report-only plan for Rust test-renderer root API create/update/unmount integration | `worker-progress/worker-101-test-renderer-root-api-plan.md` | workers 018,022,073,081,096 | merged |
| worker-102-test-renderer-serialization-plan | Produce a report-only plan for test-renderer toJSON/toTree/TestInstance serialization over committed fibers | `worker-progress/worker-102-test-renderer-serialization-plan.md` | workers 018,022,073,085,101 | merged |
| worker-103-scheduler-mock-implementation-plan | Produce a report-only plan for `scheduler/unstable_mock` compatibility and implementation gates | `worker-progress/worker-103-scheduler-mock-implementation-plan.md` | workers 034,039,045,052 | merged |
| worker-104-reconciler-root-model-implementation-plan | Produce a report-only implementation plan for the first reconciler FiberRoot/HostRoot data model slice | `worker-progress/worker-104-reconciler-root-model-implementation-plan.md` | workers 019,044,055,072,079,081,082,090,094,096 | running |
| worker-105-dom-mutation-host-implementation-plan | Produce a report-only implementation plan for the first minimal DOM mutation host slice | `worker-progress/worker-105-dom-mutation-host-implementation-plan.md` | workers 040,051,055,061,062,063,090,091 | running |
| worker-106-root-render-e2e-test-plan | Produce a report-only test plan for the first end-to-end root render/update/unmount path | `worker-progress/worker-106-root-render-e2e-test-plan.md` | workers 044,055,058,061,062,063,072,079,081,082,090,091,094 | running |
| worker-107-core-fiber-topology-implementation-plan | Produce a report-only implementation plan for first core fiber topology data structures | `worker-progress/worker-107-core-fiber-topology-implementation-plan.md` | workers 007,030,070,071,077,078,079,080,082 | running |
| worker-108-react-dom-root-facade-implementation-plan | Produce a report-only implementation plan for React DOM root facade behavior | `worker-progress/worker-108-react-dom-root-facade-implementation-plan.md` | workers 033,036,044,055,058,079,080,090,092,093,094,095 | running |
| worker-109-reconciler-commit-minimum-implementation-plan | Produce a report-only implementation plan for the minimal reconciler commit slice | `worker-progress/worker-109-reconciler-commit-minimum-implementation-plan.md` | workers 018,019,022,040,051,071,072,073,077,079,080,082,091,093 | running |
| worker-110-dom-text-content-host-plan | Produce a report-only plan for DOM text-content host behavior and tests | `worker-progress/worker-110-dom-text-content-host-plan.md` | workers 040,051,055,061,062,063,091 | running |
| worker-111-reconciler-sync-flush-act-plan | Produce a report-only implementation plan for reconciler sync flushing and act integration | `worker-progress/worker-111-reconciler-sync-flush-act-plan.md` | workers 007,041,044,055,058,067,073,080,081,094 | running |
| worker-112-core-hook-queue-implementation-plan | Produce a report-only implementation plan for first core hook state queues | `worker-progress/worker-112-core-hook-queue-implementation-plan.md` | workers 007,070,078,099,100 | running |
| worker-113-function-component-implementation-plan | Produce a report-only implementation plan for first function component rendering | `worker-progress/worker-113-function-component-implementation-plan.md` | workers 007,070,071,078,081,099,100 | running |
| worker-114-test-renderer-implementation-plan | Produce a report-only implementation plan for test-renderer root and serialization behavior | `worker-progress/worker-114-test-renderer-implementation-plan.md` | workers 018,022,073,083,084,085,086,101,102 | running |
| worker-115-scheduler-mock-source-plan | Produce a report-only source implementation plan for `scheduler/unstable_mock` | `worker-progress/worker-115-scheduler-mock-source-plan.md` | workers 034,038,039,045,052,068,069,103 | running |
| worker-116-dom-event-plugin-implementation-plan | Produce a report-only implementation plan for the first DOM event plugin extraction slice | `worker-progress/worker-116-dom-event-plugin-implementation-plan.md` | workers 041,048,065,090,098 | running |
| worker-117-root-render-implementation-sequencing-plan | Produce a report-only implementation sequencing plan for the first real root render milestone | `worker-progress/worker-117-root-render-implementation-sequencing-plan.md` | workers 077,079,080,091,092,093,094,095,098,099,100,101,102,103 | running |

## Merge Policy

1. A worker reports completion with changed files, tests run, and unresolved risks.
2. Orchestrator inspects the worktree diff and progress file.
3. If the scope is clean and verified, merge to `main`.
4. If scopes conflict, create a merge worker with ownership of only the merge conflict and integration tests.
5. Update `MASTER_PLAN.md` and `MASTER_PROGRESS.md` after each merge or material decision.

## Completion Audit Standard

A milestone is not complete unless each deliverable maps to concrete evidence: files, command output, tests, benchmark results, or documented decisions. Passing tests are supporting evidence only when the tests cover the stated deliverable.
