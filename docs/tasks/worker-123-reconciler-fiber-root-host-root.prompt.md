You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.
When reference source is useful, inspect the local React source clone at `/Users/user/Developer/Developer/react-reference` (`facebook/react` tag `v19.2.6`, commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`). Use npm tarball/runtime oracles for published package behavior claims.

Objective:
Implement the first reconciler FiberRoot and HostRoot model slice on top of the accepted core fiber topology primitives. This is internal Rust source only: create root configuration, root records, root store/arena, HostRoot current fiber initialization, current/work-in-progress alternate helpers, and phase-scoped host token metadata. Do not implement HostRoot update queues, scheduling, work loop, commit traversal, DOM behavior, public React DOM roots, or test-renderer root APIs.

Write scope:
- `crates/fast-react-reconciler/src/root_config.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/fiber_store.rs`
- `crates/fast-react-reconciler/src/work_in_progress.rs`
- `crates/fast-react-reconciler/src/host_tokens.rs`
- `crates/fast-react-reconciler/src/test_support.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-123-reconciler-fiber-root-host-root.md`

Do not modify:
- `crates/fast-react-core/**`
- `crates/fast-react-host-config/**`
- `crates/fast-react-test-renderer/**`
- `packages/**`
- `tests/conformance/**`
- `tests/smoke/**`
- `Cargo.lock`, `package-lock.json`, or generated build output

Context to read after goal setup:
- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-079-reconciler-fiber-root-model-plan.md`
- `worker-progress/worker-080-reconciler-host-root-update-queue-plan.md`
- `worker-progress/worker-090-dom-node-map-public-instance-plan.md`
- `worker-progress/worker-104-reconciler-root-model-implementation-plan.md`
- `worker-progress/worker-117-root-render-implementation-sequencing-plan.md`
- `worker-progress/worker-118-host-token-compile-alignment.md`
- `worker-progress/worker-119-core-fiber-topology-foundation.md`

Constraints:
- Do not modify files outside your write scope.
- Treat accepted worker 118 host-token alignment and worker 119 core topology as available dependencies.
- Use `fast-react-core` fiber IDs, arenas, tags, modes, lanes, flags, opaque handles, alternates, and bubbling primitives instead of duplicating them in the reconciler.
- Keep root construction side-effect free: tests must prove creating a root does not call host creation, mutation, commit, scheduling, DOM, or listener APIs.
- Add `RootTag`, `RootKind::Client`, reserved unsupported hydration kind, `RootOptions`, lifecycle/work-status enums, typed opaque callback/scheduler handles, `FiberRootId`, root storage, HostRoot state shell, and `root.current`.
- Add HostRoot current fiber initialization and a helper to create/reuse a HostRoot work-in-progress alternate without switching `root.current`.
- Add phase-scoped host token generation/validation metadata sufficient for later host creation/commit/deletion calls, without exposing raw fibers or DOM nodes.
- Preserve the existing placeholder render APIs as loud unsupported scaffolding. Do not grow them into facade shortcuts.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Record progress in `worker-progress/worker-123-reconciler-fiber-root-host-root.md`.
- After goal setup, call `get_goal` if available and record the active goal status/objective; if unavailable, state that explicitly.
- Before finishing, review your work for quality, maintainability, performance, and security.

Verification required:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_config`
- `cargo test -p fast-react-reconciler --all-features fiber_root`
- `cargo test -p fast-react-reconciler --all-features host_tokens`
- `cargo test -p fast-react-reconciler --all-features work_in_progress`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`
- scoped path, conflict-marker, trailing-whitespace, and layering-denylist checks over all changed files

Handoff requirements:
- Summarize implementation.
- List changed files.
- List commands run.
- Include goal evidence.
- Include a prompt-to-artifact checklist.
- List unresolved risks or follow-up tasks.
