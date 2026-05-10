You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Extend the Rust-only test-renderer private JSON diagnostic now that committed host output and committed-fiber inspection are both present: produce a deterministic private JSON node report for the one HostComponent plus HostText canary while keeping public `toJSON`, `toTree`, TestInstance wrappers, JS facade routing, `act`, and compatibility claims blocked.

Write scope:
- `crates/fast-react-test-renderer/src/lib.rs`
- `worker-progress/worker-265-test-renderer-private-json-ready-diagnostics.md`

Context to inspect:
Workers 208, 209, 234, 235, 236.

Constraints:
- Rust-only private diagnostics; no public JS package behavior.
- Reject stale or non-canary shapes fail-closed.
- Do not broaden beyond the current HostComponent plus HostText fixture.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-test-renderer --all-features root_private_json`
- `cargo test -p fast-react-test-renderer --all-features`
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
