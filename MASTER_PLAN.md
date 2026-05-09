# Fast React Master Plan

Last updated: 2026-05-09

## Mission

Build an almost 1-to-1 React reimplementation in Rust that is faster than the JavaScript implementation while remaining generic enough for `react-dom`, `react-native`, and other renderer-dependent ecosystems.

Current compatibility target discovered from npm on 2026-05-09:

- `react`: 19.2.6
- `react-dom`: 19.2.6
- `@types/react`: 19.2.14

Breaking changes are allowed when they remove root causes or enable a sound architecture. Compatibility gaps must be explicit, tested, and tracked.

## Operating Model

- Orchestrator owns planning, task decomposition, worker routing, merge decisions, and progress tracking.
- Workers own implementation or research tasks in isolated scopes.
- Workers read `WORKER_BRIEF.md`; `ORCHESTRATOR.md` is orchestrator-only.
- Workers must record progress in `worker-progress/<worker-id>.md`.
- Top-level workers are real Codex subprocesses launched in tmux by the orchestrator.
- Top-level tmux workers may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside their sessions when useful for hypothesis testing or verification. Nested managed agents do not count against the orchestrator's 30 top-level tmux worker limit.
- Code work should happen in Git worktrees whenever possible.
- Workers must review their changes for quality, maintainability, performance, and security before reporting completion.
- Workers should call `create_goal` when starting their assigned task. They should call `update_goal(status: "complete")` only after the whole worker task is complete.

## Architecture Hypotheses To Test

1. A Rust core should model React's element, fiber, lane, hook, context, and update queue semantics independently from any renderer.
2. Renderer integration should use a host-config boundary similar to React reconciler so `react-dom`, `react-native`, and future targets can provide platform behavior.
3. The first public integration should be a JS package that can run React-compatible tests through Node, likely using N-API first and WASM only if the benchmark or deployment constraints justify it.
4. Conformance should be anchored on observed React 19.2.6 behavior, not inferred API names.
5. Performance work should wait until correctness and representative benchmarks exist; otherwise speedups may only measure missing semantics.

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

| Worker | Task | Write Scope | Depends On | Status |
| --- | --- | --- | --- | --- |
| worker-001-architecture | Test architecture hypotheses against React 19.2.6 semantics and Rust constraints | `worker-progress/worker-001-architecture.md` | M0 | merged |
| worker-002-conformance | Design the conformance inventory and test harness strategy | `worker-progress/worker-002-conformance.md` | M0 | merged |
| worker-003-scaffold | Propose initial Cargo and package scaffold with worktree-safe task splits | `worker-progress/worker-003-scaffold.md` | M0 | merged |
| worker-004-api-inventory | Build exact public API, runtime export, subpath, and type inventory | `worker-progress/worker-004-api-inventory.md` | M0 | running |
| worker-005-upstream-tests | Assess upstream React 19.2.6 test reuse and harness requirements | `worker-progress/worker-005-upstream-tests.md` | M0 | running |
| worker-006-binding-strategy | Design JS-to-Rust binding and package artifact strategy | `worker-progress/worker-006-binding-strategy.md` | M0 | running |
| worker-007-scheduler-fiber | Investigate scheduler, lanes, fiber, update queue, and effect semantics | `worker-progress/worker-007-scheduler-fiber.md` | M0 | running |
| worker-008-renderer-host-config | Define renderer host-config boundary across DOM, native, hydration, and portals | `worker-progress/worker-008-renderer-host-config.md` | M0 | running |
| worker-009-benchmark-strategy | Design conformance-gated benchmark and profiling strategy | `worker-progress/worker-009-benchmark-strategy.md` | M0 | running |
| worker-010-initial-scaffold | Implement initial Cargo/npm workspace, placeholder crates/packages, smoke checks, and CI skeleton | root scaffold paths plus `worker-progress/worker-010-initial-scaffold.md` | workers 001-003 | queued |

## Merge Policy

1. A worker reports completion with changed files, tests run, and unresolved risks.
2. Orchestrator inspects the worktree diff and progress file.
3. If the scope is clean and verified, merge to `main`.
4. If scopes conflict, create a merge worker with ownership of only the merge conflict and integration tests.
5. Update `MASTER_PLAN.md` and `MASTER_PROGRESS.md` after each merge or material decision.

## Completion Audit Standard

A milestone is not complete unless each deliverable maps to concrete evidence: files, command output, tests, benchmark results, or documented decisions. Passing tests are supporting evidence only when the tests cover the stated deliverable.
