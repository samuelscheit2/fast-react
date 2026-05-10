You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Refresh native package surface guards after accepted N-API batched JSON and
teardown diagnostics so JS loaders stay deterministic without requiring a
native addon.

Write scope:
- native package JS files
- `crates/fast-react-napi/src/lib.rs` only if Rust guard tests need updates
- native conformance/smoke tests
- `tests/smoke/import-entrypoints.mjs` only if inventory changes
- `worker-progress/worker-532-native-package-surface-guard-refresh.md`

Constraints:
- Do not require building or loading a native addon for package-surface tests.
- Keep public native behavior unchanged.

Verification:
- Run `cargo test -p fast-react-napi --all-features` if Rust changes.
- Run native workspace checks and import smoke.
- Run `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
