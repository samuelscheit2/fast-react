You are a worker for the Fast React project.

Read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md first. Do not read ORCHESTRATOR.md unless explicitly asked.
Call create_goal for this worker task. Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Implement first core root lane bookkeeping helpers beyond the lane bitset primitives, staying independent from fibers, DOM, public Scheduler, and host rendering.

Write scope:
`crates/fast-react-core/src/root_lanes.rs`
`crates/fast-react-core/src/lib.rs`
`worker-progress/worker-047-core-root-lane-bookkeeping.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify scheduler packages, React DOM packages, host-config, reconciler, or conformance JS files.
- Use worker 007, worker 030, and worker 044 evidence.
- Implement only root lane state/helper primitives that can be tested in `fast-react-core` without fibers or root scheduler behavior.
- Keep public `scheduler` priorities separate from internal lanes.
- Record progress in `worker-progress/worker-047-core-root-lane-bookkeeping.md`.

Verification:
- Run `cargo fmt --all --check`.
- Run `cargo test -p fast-react-core --all-features`.
- Run `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings` if practical.
- Run scoped whitespace/diff checks.

Handoff requirements:
- Summarize implementation and excluded behavior.
- List changed files and commands run.
- List unresolved risks or follow-up tasks.
