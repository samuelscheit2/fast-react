You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private eager-state dispatch metadata gate for function component state updates. Prove eager state fields are recorded, validated, and rebased deterministically without scheduling real JS updates or claiming public hook compatibility.

Write scope:
- `crates/fast-react-core/src/hook.rs`
- `crates/fast-react-reconciler/src/function_component.rs`
- `packages/react/hook-dispatcher.js`
- `tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `worker-progress/worker-300-function-component-dispatch-eager-state-gate.md`

Context to inspect:
Workers 158, 278, 283, and 299 if present.

Constraints:
- Do not implement render-phase updates or public dispatch functions.
- Keep lane, revert lane, eager state, and action metadata opaque and deterministic.
- Preserve package surface guard expectations.

Verification:
- `cargo fmt --all --check`
- Focused hook/function-component tests
- `node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `cargo test -p fast-react-reconciler --all-features`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
