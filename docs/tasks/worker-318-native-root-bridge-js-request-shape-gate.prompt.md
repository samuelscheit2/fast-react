You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a native bridge request-shape gate that maps the JS private root bridge create/render/unmount records onto the accepted `fast-react-napi` handle validation model, without loading a native addon or executing renderer work.

Write scope:
- `crates/fast-react-napi/src/lib.rs`
- `bindings/node/index.cjs`
- `bindings/node/index.mjs`
- `bindings/node/test/native-loader.test.cjs`
- `bindings/node/test/native-loader-esm.test.mjs`
- `worker-progress/worker-318-native-root-bridge-js-request-shape-gate.md`

Context to inspect:
Workers 166, 256, 269, and 281.

Constraints:
- Native loader remains a placeholder/no-load guard.
- No `.node` load, N-API registration, or real renderer execution.
- Request-shape metadata must match Rust handle validation tests.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features`
- Focused native loader JS tests
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
