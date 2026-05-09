# Fast React Master Plan

Last updated: 2026-05-10

## Mission

Build an almost 1-to-1 React reimplementation in Rust that is faster than the
JavaScript implementation while remaining generic enough for `react-dom`,
`react-native`, and other renderer-dependent ecosystems.

Compatibility target:

- `react` 19.2.6
- `react-dom` 19.2.6
- `@types/react` 19.2.14

Reference source:

- `/Users/user/Developer/Developer/react-reference`
- upstream `facebook/react` tag `v19.2.6`
- commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`

Use source for internals research. Use npm tarballs and runtime oracles for
published behavior claims.

## Operating Model

- The orchestrator owns task decomposition, worker routing, merge decisions, and
  progress tracking.
- Workers run as real tmux Codex subprocesses in isolated worktrees when
  possible.
- Top-level tmux worker cap: 30. Worker-internal nested agents are allowed and
  do not count against the cap.
- Workers read `WORKER_BRIEF.md`, set a goal first, stay within write scope,
  and report evidence in `worker-progress/<worker-id>.md`.
- Coordination docs stay compact. Detailed historical evidence belongs in git
  history and `worker-progress/*.md`.

## Architecture Direction

- Rust core owns renderer-agnostic React semantics: elements, fibers, lanes,
  updates, hooks, context, effects, and scheduler-facing state.
- Renderer integration uses host-config-style boundaries with opaque host
  handles/tokens. DOM, native, hydration, events, resources, and security
  behavior stay outside the core.
- JS package facades expose React-compatible entrypoints. N-API is the primary
  native boundary until benchmarks justify another path.
- Compatibility is proven by black-box React 19.2.6 oracles and published
  package probes, not by inferred source names alone.
- Performance claims wait until the relevant conformance scenarios are green.

## Milestones

| Milestone | Focus | Status |
| --- | --- | --- |
| M0 | Orchestration foundation, worker conventions, initial repo strategy | Done |
| M1 | Compatibility inventory and conformance strategy | Done |
| M2 | Cargo/npm scaffold and package boundaries | Done |
| M3 | Element/runtime model and direct React facade behavior | In progress |
| M4 | Fiber, root, update queues, lanes, scheduling, commit ordering | Active |
| M5 | Hooks, context, effects, function component render | Active |
| M6 | Host boundary, test renderer, DOM mutation proof renderer | Active |
| M7 | React DOM/test-renderer/scheduler public package integration | Active |
| M8 | Conformance and benchmark harness | Active |
| M9 | Iterative compatibility closure and performance profiling | Future |

## Current Focus

The current project push is a minimal real root render/update/unmount path:

1. Core data: lane-backed priorities, root lane bookkeeping, fiber flags,
   topology, hook queues.
2. Reconciler data and work: FiberRoot/HostRoot records, HostRoot queues,
   function component render, sync flush/act routing, minimal commit.
3. Host behavior: token-aware host config, test-renderer integration, minimal
   DOM mutation/text host behavior.
4. Public facades and oracles: React DOM roots, hydration facade boundaries,
   test renderer root/serialization/act/error surfaces, scheduler mock.
5. End-to-end gates: dual-run conformance tests and focused Rust tests before
   any compatibility claim.

## Current Queue

- Worker 118 is running Slice 0 host-token compile alignment.
- Worker 119 is running Slice 1 core fiber identity/topology foundation and owns
  `fast-react-core/src/lib.rs` for that tranche.
- Worker 120 is running scheduler mock source implementation in package-level
  scheduler files, isolated from root scheduler state.
- Worker 121 is running the React DOM root render/update/unmount e2e oracle.

## Near-Term Plan

1. Audit worker 118 first because its latest pane state showed a usage-limit
   stop; either resume it with its original goal or replace the slice before
   stacking dependent root work on top of it.
2. Keep worker 119 serialized around `fast-react-core/src/lib.rs`; do not queue
   another core-export tranche until its topology foundation is accepted or
   intentionally abandoned.
3. Let workers 120 and 121 continue in parallel because their write scopes are
   isolated from the core topology tranche.
4. After accepting any of workers 118-121, run the worker's scoped checks, merge
   with a no-fast-forward commit, then update this file with the next active
   queue and move completed facts to `MASTER_PROGRESS.md`.
5. Queue follow-up source slices from the accepted root/reconciler/DOM/test
   renderer sequencing reports only when their write scopes do not overlap with
   live workers.

## Merge Policy

1. Confirm worker pane is complete or intentionally stopped.
2. Inspect worktree status, changed files, report, verification commands, and
   goal evidence.
3. Verify scope-specific hygiene: path leaks, conflict markers, trailing
   whitespace, `git diff --check`, and relevant tests.
4. Commit the worker branch with only scoped changes.
5. Merge to `main` with a no-fast-forward merge commit.
6. Update `MASTER_PLAN.md` and `MASTER_PROGRESS.md` concisely.
7. Close the tmux session and remove/prune the accepted worktree unless needed
   for immediate follow-up.

## Completion Standard

A milestone is not complete unless every deliverable maps to concrete evidence:
files, command output, tests, benchmark results, or documented decisions.
Passing tests are supporting evidence only when they cover the stated
deliverable.
