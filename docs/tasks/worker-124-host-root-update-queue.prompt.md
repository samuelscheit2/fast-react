You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.
When reference source is useful, inspect the local React source clone at `/Users/user/Developer/Developer/react-reference` (`facebook/react` tag `v19.2.6`, commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`). Use npm tarball/runtime oracles for published package behavior claims.

Objective:
Implement the internal HostRoot update queue and `update_container` / `update_container_sync` slice on top of the accepted FiberRoot/HostRoot model. Root render and unmount must become queued HostRoot `{element}` updates. Do not implement root scheduler execution, work loop, begin/complete work, commit traversal, DOM behavior, public React DOM roots, test-renderer root APIs, hydration, or event dispatch.

Write scope:
- `crates/fast-react-reconciler/src/update_queue.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- `crates/fast-react-reconciler/src/update_priority.rs`
- `crates/fast-react-reconciler/src/concurrent_updates.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/fiber_store.rs`
- `crates/fast-react-reconciler/src/test_support.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-124-host-root-update-queue.md`

Do not modify:
- `crates/fast-react-core/**`
- `crates/fast-react-host-config/**`
- `crates/fast-react-test-renderer/**`
- `packages/**`
- `tests/conformance/**`
- `tests/smoke/**`
- `Cargo.lock`, `package-lock.json`, `node_modules/**`, `target/**`, or generated build output

Context to read after goal setup:
- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-080-reconciler-host-root-update-queue-plan.md`
- `worker-progress/worker-117-root-render-implementation-sequencing-plan.md`, especially "### 3. HostRoot Update Queue And `update_container`"
- `worker-progress/worker-123-reconciler-fiber-root-host-root.md`
- `crates/fast-react-reconciler/src/root_config.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/fiber_store.rs`
- `crates/fast-react-core/src/lane.rs`
- `crates/fast-react-core/src/root_lanes.rs`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberClassUpdateQueue.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberReconciler.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberConcurrentUpdates.js`

Constraints:
- Do not modify files outside your write scope.
- Treat accepted worker 123 as available: use `FiberRootStore`, `FiberRootId`, `HostRootState`, `RootElementHandle`, core `UpdateQueueHandle`, core `Lane`/`Lanes`, and `RootLaneState` instead of duplicating root/fiber state.
- Add only narrow `fiber_root.rs` / `fiber_store.rs` mutators if the queue APIs need them; do not refactor the root model.
- Model HostRoot updates as class/root-style update queues: shared circular pending ring, base queue, skipped-lane rebasing, `NoLane` applied clones, callback storage, transition lane tracking, and explicit concurrent staging hooks.
- Preserve `{element}` semantics for root render and unmount. A null/unmount update must be represented as a typed `RootUpdatePayload` with `element: RootElementHandle::NONE`, not as a missing payload and not as host mutation.
- `update_container` must choose a lane through `update_priority`; `update_container_sync` must enqueue a `Lane::SYNC` update through the same implementation and must not flush work.
- Enqueue should mark source fiber/root lanes and expose scheduler/entanglement hooks or records, but it must not run a scheduler, render work, call host config, mutate containers, or switch `root.current`.
- Optional callback handles may be stored and later collected by queue processing, but no callback may be invoked in this slice.
- Hidden/offscreen behavior may be represented as data hooks and tests for stripping `Lane::OFFSCREEN`; do not claim full Offscreen compatibility.
- Preserve existing loud placeholder render APIs.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Record progress in `worker-progress/worker-124-host-root-update-queue.md`.
- After goal setup, call `get_goal` if available and record the active goal status/objective; if unavailable, state that explicitly.
- Before finishing, review your work for quality, maintainability, performance, and security.

Verification required:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features update_queue`
- `cargo test -p fast-react-reconciler --all-features root_updates`
- `cargo test -p fast-react-reconciler --all-features update_priority`
- `cargo test -p fast-react-reconciler --all-features concurrent_updates`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`
- scoped path, conflict-marker, trailing-whitespace, and no-host-mutation denylist checks over all changed files

Handoff requirements:
- Summarize implementation.
- List changed files.
- List commands run.
- Include goal evidence.
- Include a prompt-to-artifact checklist.
- List unresolved risks or follow-up tasks.
