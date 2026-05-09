# Fast React Master Progress

Last updated: 2026-05-09

## Current State

- Repository initialized locally on branch `main`.
- No implementation code exists yet.
- Orchestrator instructions loaded from `ORCHESTRATOR.md`.
- Worker-facing role contract added in `WORKER_BRIEF.md` so workers do not read orchestrator-only instructions.
- Current npm compatibility target checked on 2026-05-09:
  - `react` 19.2.6
  - `react-dom` 19.2.6
  - `@types/react` 19.2.14

## Active Milestone

M0: Orchestration Foundation.

## Decisions

- Use `MASTER_PLAN.md` for project plan and task dependencies.
- Use `MASTER_PROGRESS.md` for project-wide progress and decisions.
- Use `worker-progress/<worker-id>.md` for each worker's progress.
- Workers should read `WORKER_BRIEF.md`, not `ORCHESTRATOR.md`.
- Top-level workers are real Codex subprocesses launched in tmux.
- Top-level tmux workers may spawn managed Codex subagents/explorers internally when useful. Those nested agents do not count against the 30 top-level tmux worker limit.
- Do not start implementation before architecture, conformance, and scaffold hypotheses have been tested by separate workers.
- Worker runner requests `gpt-5.5` with `model_reasoning_effort="xhigh"` and uses the local yolo-equivalent Codex flag.
- Accepted architecture direction from worker-001: Rust should own renderer-agnostic React semantics behind arena/generational handles, use a capability-grouped host-config boundary, and expose a JS-compatible package facade through N-API first. WASM and third-party `react-reconciler` compatibility are deferred until conformance evidence justifies them.
- Accepted conformance direction from worker-002: React 19.2.6 compatibility must be proven by generated inventories and black-box dual-run oracle scenarios, not export names alone. Benchmarks must link to green conformance scenario IDs before they count.
- Accepted scaffold direction from worker-003: create a Cargo workspace with `fast-react-core`, `fast-react-host-config`, `fast-react-reconciler`, `fast-react-test-renderer`, and `fast-react-napi`; use npm workspaces for `packages/react`, `bindings/node`, and tests; defer `react-dom`, browser WASM, and standalone scheduler crates until conformance evidence justifies them.

## Worker Roster

| Worker | Status | Assignment | Progress File |
| --- | --- | --- | --- |
| worker-001-architecture | merged | Test Rust core and renderer-boundary architecture hypotheses | `worker-progress/worker-001-architecture.md` |
| worker-002-conformance | merged | Design React 19.2.6 compatibility inventory and test strategy | `worker-progress/worker-002-conformance.md` |
| worker-003-scaffold | merged | Propose Cargo workspace, JS package scaffold, and worktree task split | `worker-progress/worker-003-scaffold.md` |
| worker-004-api-inventory | running in tmux worktree; nested subagents allowed | Build exact public API, runtime export, subpath, and type inventory | `../fast-react-worker-004-api-inventory/worker-progress/worker-004-api-inventory.md` |
| worker-005-upstream-tests | running in tmux worktree; nested subagents allowed | Assess upstream React 19.2.6 test reuse and harness requirements | `../fast-react-worker-005-upstream-tests/worker-progress/worker-005-upstream-tests.md` |
| worker-006-binding-strategy | running in tmux worktree; nested subagents allowed | Design JS-to-Rust binding and package artifact strategy | `../fast-react-worker-006-binding-strategy/worker-progress/worker-006-binding-strategy.md` |
| worker-007-scheduler-fiber | running in tmux worktree; nested subagents allowed | Investigate scheduler, lanes, fiber, update queue, and effect semantics | `../fast-react-worker-007-scheduler-fiber/worker-progress/worker-007-scheduler-fiber.md` |
| worker-008-renderer-host-config | running in tmux worktree; nested subagents allowed | Define renderer host-config boundary across DOM, native, hydration, and portals | `../fast-react-worker-008-renderer-host-config/worker-progress/worker-008-renderer-host-config.md` |
| worker-009-benchmark-strategy | running in tmux worktree; nested subagents allowed | Design conformance-gated benchmark and profiling strategy | `../fast-react-worker-009-benchmark-strategy/worker-progress/worker-009-benchmark-strategy.md` |

## Next Actions

1. Collect the six active research workers' progress files and final recommendations.
2. Launch the scaffold implementation worker with ownership of root manifests, initial crates, package wrappers, and smoke/conformance placeholders.
3. Update the master plan with accepted findings from workers 004-009.

## Risks And Open Questions

- React internals and public behavior are large; compatibility must be prioritized by user-visible semantics.
- Native bindings may constrain memory ownership, scheduler integration, and async behavior.
- Upstream React tests may not be reusable without a compatibility layer.
- A faster implementation can become meaningless if benchmarked before semantic parity is defined.

## Evidence Log

- 2026-05-09: `npm view react version` returned `19.2.6`.
- 2026-05-09: `npm view react-dom version` returned `19.2.6`.
- 2026-05-09: `npm view @types/react version` returned `19.2.14`.
- 2026-05-09: `tmux -V` returned `tmux 3.6a`.
- 2026-05-09: `codex --version` returned `codex-cli 0.0.0`.
- 2026-05-09: `cargo --version` returned `cargo 1.95.0`.
- 2026-05-09: `rustc --version` returned `rustc 1.95.0`.
- 2026-05-09: Initial tmux worker launch failed before doing work because `codex exec` rejected `--search`. Relaunch will omit `--search`.
- 2026-05-09: Second tmux worker launch failed before doing work because this `codex exec` build rejected `-a`. Runner now uses `--dangerously-bypass-approvals-and-sandbox` instead.
- 2026-05-09: `ORCHESTRATOR.md` was updated to move model/yolo guidance into a general guideline section. Worker brief now carries only worker-safe assumption-checking guidance.
- 2026-05-09: Relaunched workers 001, 002, and 003 in tmux with corrected worker prompts and runner flags.
- 2026-05-09: tmux worker 001 hit a Codex CLI usage-limit failure before writing `worker-progress/worker-001-architecture.md`.
- 2026-05-09: tmux workers 002 and 003 were briefly reassigned to managed subagents after CLI usage-limit failures. This violated the real-tmux-worker orchestration requirement. Those managed agents were shut down, and their generated reports were moved to `worker-progress/quarantine/` and excluded from canonical progress.
- 2026-05-09: Next valid step is to relaunch 001, 002, and 003 as real Codex processes in tmux only. Any quarantined managed-subagent content must be independently audited or regenerated by tmux workers before it can count.
- 2026-05-09: Worker relaunch plan changed to one Git worktree per worker: `../fast-react-worker-001-architecture`, `../fast-react-worker-002-conformance`, and `../fast-react-worker-003-scaffold`.
- 2026-05-09: Relaunched workers 001, 002, and 003 as real `codex --yolo` processes inside tmux, using `script` to provide a TTY and capture logs.
- 2026-05-09: Stopped tmux workers 001, 002, and 003 after observing managed internal explorer/subagent use inside their tmux Codex sessions. No canonical worker reports had been written.
- 2026-05-09: Updated `WORKER_BRIEF.md`, task prompts, prompt template, and `scripts/run-worker.sh` to explicitly forbid managed Codex subagents/explorers inside worker sessions. Independent hypothesis tests must be requested in reports and launched by the orchestrator as separate tmux workers.
- 2026-05-09: Relaunched workers 001, 002, and 003 as real `codex --yolo` tmux processes with the explicit managed-subagent prohibition included in both worker files and the launcher prompt.
- 2026-05-09: Policy corrected: top-level workers still launch as real tmux Codex processes, but workers may spawn managed internal subagents/explorers for their own hypothesis testing. Those nested agents do not count against the 30 top-level tmux worker cap.
- 2026-05-09: Stopped the three workers before accepting reports written under the superseded managed-subagent prohibition.
- 2026-05-09: Relaunched workers 001, 002, and 003 as real `codex --yolo` tmux processes with nested managed subagents allowed.
- 2026-05-09: Added six more non-overlapping research workers: public API inventory, upstream test reuse, binding strategy, scheduler/fiber model, renderer host config, and benchmark strategy.
- 2026-05-09: Accepted and merged worker-001 architecture report in commit `b5a0da1`. Closed the worker-001 tmux session after merge.
- 2026-05-09: Accepted and merged worker-002 conformance report in commit `a468c5f`. Closed the worker-002 tmux session after merge.
- 2026-05-09: Accepted and merged worker-003 scaffold report in commit `93dfe83`. Closed the worker-003 tmux session after merge.
