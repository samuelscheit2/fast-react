You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Tighten native boundary error-code mapping for root bridge validation failures. Add deterministic Rust and JS placeholder evidence for wrong environment, stale handles, wrong lifecycle order, and unsupported native execution without changing package load behavior.

Write scope:
- `crates/fast-react-napi/src/lib.rs`
- `bindings/node/index.cjs`
- `bindings/node/index.mjs`
- `bindings/node/test/native-no-load-guard.test.cjs`
- `worker-progress/worker-319-native-boundary-error-code-mapping.md`

Context to inspect:
Workers 166, 281, and native package smoke tests.

Constraints:
- Keep native addon loading disabled.
- Do not expose React behavior errors as native boundary errors.
- Preserve existing package surface and no-load guard behavior.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features`
- Focused native JS tests
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
