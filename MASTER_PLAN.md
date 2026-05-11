# Fast React Master Plan

Last updated: 2026-05-11

This file owns current and future work only. Accepted history belongs in
`MASTER_PROGRESS.md`; durable orchestration policy belongs in `ORCHESTRATOR.md`;
worker-facing rules belong in `WORKER_BRIEF.md`.

## Planning Inputs

- Compatibility target: `react` 19.2.6, `react-dom` 19.2.6,
  `@types/react` 19.2.14.
- Source reference: `/Users/user/Developer/Developer/react-reference`, upstream
  `facebook/react` tag `v19.2.6`, commit
  `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`.
- Use source for internals research. Use npm tarballs and runtime oracles for
  published behavior claims.

## Active And Future Milestones

| Milestone | Focus | Status |
| --- | --- | --- |
| M3 | Element/runtime model and direct React facade behavior | Active |
| M4 | Fiber, root, update queues, lanes, scheduling, commit ordering | Active |
| M5 | Hooks, context, effects, function component render | Active |
| M6 | Host boundary, test renderer, DOM mutation proof renderer | Active |
| M7 | React DOM/test-renderer/scheduler public package integration | Active |
| M8 | Conformance and benchmark harness | Active |
| M9 | Iterative compatibility closure and performance profiling | Future |

## Current Objective

Drive toward a minimal real root render/update/unmount path:

1. Lane-backed priorities, root lane bookkeeping, fiber flags, topology, and
   hook queues.
2. FiberRoot/HostRoot records, HostRoot queues, function component render, sync
   flush/act routing, and minimal commit.
3. Token-aware host config, test-renderer integration, and minimal DOM
   mutation/text host behavior.
4. React DOM roots, hydration facade boundaries, test-renderer
   root/serialization/act/error surfaces, and scheduler package variants.
5. Dual-run conformance tests and focused Rust tests before any compatibility
   claim.

## Active Queue

Top-level cap: 30 workers. Accepted/merged baseline includes Workers 803-837,
842, 843, 845, 846, and 849-852. Accepted private evidence still keeps public
root, act, Scheduler timing, hydration, serialization, native execution,
package compatibility, and broad renderer compatibility blocked.

Current audit queue:

- Workers 844 and 853: competing test-renderer package-root native execution
  candidates under audit.
- Worker 848: React DOM nested facade native handoff under audit.
- Future workers may be spawned after these audit decisions. Do not treat
  Workers 844, 848, or 853 as accepted until a reviewed result is merged.

Future workers may intentionally overlap with accepted areas when that improves
throughput. Resolve merge conflicts by preserving accepted private blockers and
canonical evidence requirements.

## Near-Term Sequencing

1. Finish audit decisions for competing Workers 844/853 and pending Worker 848
   before spawning dependent native/package-root or nested facade follow-ups.
2. Prefer parallelizable independent proofs even when they may conflict in test
   files. Resolve conflicts during merge by keeping all accepted negative tests,
   blockers, and source-ownership checks.
3. Keep package-surface, benchmark, import-smoke, and broad Rust/JS checks green
   after each accepted merge batch.

## Next Queue Candidates

- Scheduler work can move beyond the accepted delayed renderer-root producer and
  React delayed mock preflight, descriptor/source-proof repair, and test-utils
  gate-first source route only after public Scheduler timing, public
  `act`/root semantics, renderer/effect execution, public flush helper
  behavior, and compatibility are proven together.
- Native worker-thread teardown can move beyond Worker 740's inert package
  mirror, cleanup callable preflights, native root batch lifecycle diagnostics,
  and JSON batch lifecycle links only after executable native addon loading,
  cleanup hooks, scheduling, renderer/reconciler output, and no-stale-value
  behavior are proven together.
- Public `hydrateRoot` remains blocked after accepted marker/listener,
  target-claiming, recoverable-error, replay-target preflights, private
  text-claim patch execution, and the text-patch admission ledger. Future
  hydration work must prove real root creation, marker/listener behavior,
  recoverable error routing, event replay, and DOM mutation semantics against
  React 19.2.6.
- Future sibling-text or package-root native execution work should consume the
  dedicated private sibling-text identity/admission gates and only the audited
  Worker 844/853 result if one is accepted. Public sibling-text serialization,
  package compatibility, native bridge loading/execution, and broad multichild
  identity remain blocked.
- Resource and form work remains private/fake after accepted root-map storage
  execution, fulfilled-reset fake execution, and the resource/form execution
  admission ledger. Public resources, forms, reset/action invocation, DOM/head
  mutation, and package compatibility remain blocked.
- React DOM facade/native handoffs remain private diagnostics after accepted
  update/unmount native handoff metadata. Worker 848's nested facade native
  handoff is still under audit and must not be used as accepted input yet.
- Additional private root/test-renderer bridge gates that require accepted
  `finished_work` / `finished_lanes` handoff before any wider serialization or
  native bridge execution.

Premature until later gates are green: public React DOM root render/unmount,
public `act`, public `flushSync`, public Scheduler timing, public hydration,
resources, forms, and controlled inputs.
