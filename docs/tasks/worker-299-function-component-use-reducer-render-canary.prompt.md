You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private function-component `useReducer` render canary that shares the accepted hook queue machinery with `useState`, including mount, update render, skipped-lane rebase, and dispatch metadata. Keep JS public hooks package-private and blocked unless marked by the private dispatcher.

Write scope:
- `crates/fast-react-reconciler/src/function_component.rs`
- `packages/react/hook-dispatcher.js`
- `tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `worker-progress/worker-299-function-component-use-reducer-render-canary.md`

Context to inspect:
Workers 158, 182, 278, 283, and 290.

Constraints:
- No public renderer integration or compatibility claim.
- Do not broaden hook ordering beyond the existing private canary model.
- State and reducer dispatch records must remain deterministic data.

Verification:
- `cargo fmt --all --check`
- Focused `function_component` Rust tests
- `node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `cargo test -p fast-react-reconciler --all-features`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
