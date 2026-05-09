You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless explicitly asked.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Add first DOM host token boundary types to `fast-react-host-config` without implementing DOM behavior.

Write scope:
`crates/fast-react-host-config/**`
`worker-progress/worker-051-dom-host-token-boundary.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify test-renderer, reconciler, core, packages, or conformance files.
- Use workers 008, 012, and 040.
- Add typed boundaries/diagnostics that make future DOM host handles explicit without forcing DOM logic into renderer-agnostic core.
- Breaking changes are allowed if they remove unit placeholders or ambiguous host-handle types, but document why.
- Record progress in `worker-progress/worker-051-dom-host-token-boundary.md`.

Verification:
- Run `cargo fmt --all --check`.
- Run `cargo test -p fast-react-host-config --all-features`.
- Run `cargo clippy -p fast-react-host-config --all-targets --all-features -- -D warnings` if practical.
- Run scoped whitespace/diff checks.

Handoff requirements:
- Summarize implementation and excluded DOM behavior.
- List changed files and commands run.
- List unresolved risks or follow-up tasks.
