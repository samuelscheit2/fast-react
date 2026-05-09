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

## Active Or Recently Queued Workstreams

Recently merged source/oracle workers:

- React DOM/client-root, form/control, root marker/listener, and root export
  work: workers 046, 049, 054, 060, 064, 088, and 089.
- React test renderer and React `act` oracles: workers 083-087 and 097.

Merged core primitives:

- Workers 047, 075, and 076 added root lane bookkeeping, event priority,
  fiber flags, and hook effect flags to `fast-react-core`.

Merged implementation plans:

- Root/reconciler/DOM/test sequencing reports from workers 104-117 define the
  next conflict-safe implementation queue.
- Use worker 117's sequencing plan to order follow-up source workers after the
  prerequisite source/oracle slices are accepted.

Next queue:

- Slice 0 host-token compile alignment is the next serial Rust source task.
- Remaining Slice 1 core topology modules can be split into non-overlapping
  workers, but `fast-react-core/src/lib.rs` export edits must be serialized.
- Scheduler mock source implementation may run in parallel because it owns
  package-level scheduler files and must stay isolated from root scheduler
  state.

When new implementation workers are queued or accepted, update this plan with
only durable decisions and the next active queue. Do not re-add a full
historical worker roster.

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
