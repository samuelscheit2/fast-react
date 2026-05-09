You are worker-010-initial-scaffold for the Fast React project.

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, `worker-progress/worker-001-architecture.md`, `worker-progress/worker-002-conformance.md`, and `worker-progress/worker-003-scaffold.md` first. Do not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
Call `create_goal` for this worker task. If you create subtasks, call `create_goal` again for each subtask with context about the parent task. Do not call `update_goal(status: "complete")` until the whole worker task is complete.

Objective:
Implement the initial repository scaffold accepted from worker-003. Create the Cargo workspace, npm workspace, placeholder Rust crates, placeholder JS packages, smoke/conformance placeholders, and CI skeleton. Do not implement real React behavior yet; placeholders must compile or import where feasible and fail loudly for unimplemented React behavior.

Write scope:
Only modify these paths:

- `Cargo.toml`
- `rust-toolchain.toml`
- `package.json`
- `package-lock.json`
- `tsconfig.base.json`
- `.github/workflows/ci.yml`
- `crates/fast-react-core/**`
- `crates/fast-react-host-config/**`
- `crates/fast-react-reconciler/**`
- `crates/fast-react-test-renderer/**`
- `crates/fast-react-napi/**`
- `bindings/node/**`
- `packages/react/**`
- `tests/conformance/**`
- `tests/smoke/**`
- `worker-progress/worker-010-initial-scaffold.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, `WORKER_BRIEF.md`, `ORCHESTRATOR.md`, existing worker reports, or any other task prompts.
- Do not overlap with other workers.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses or verify work. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Keep real React behavior unimplemented except for minimal placeholder exports and smoke checks needed to prove the scaffold loads.
- Before finishing, review your work for quality, maintainability, performance, and security implications.

Required implementation:
- Root Cargo virtual workspace with resolver 3, edition 2024, Rust 1.95.0, and the five accepted crates.
- Root npm workspace using npm workspaces, not pnpm.
- Placeholder Rust crates for `fast-react-core`, `fast-react-host-config`, `fast-react-reconciler`, `fast-react-test-renderer`, and `fast-react-napi`.
- Node binding package under `bindings/node` with CJS and ESM loader placeholders.
- React compatibility package under `packages/react` with accepted subpaths: `.`, `./jsx-runtime`, `./jsx-dev-runtime`, `./compiler-runtime`, and `./package.json`.
- Smoke test that imports the placeholder React package entrypoints.
- Conformance package placeholder documenting the future dual-run oracle strategy.
- CI skeleton for Rust checks, JS install/smoke checks, and conformance placeholder.

Verification requirements:
- Run `cargo fmt --all --check`.
- Run `cargo test --workspace --all-features`.
- Run the package manager command needed to produce or validate `package-lock.json`.
- Run a smoke import check for `packages/react` entrypoints.
- If a command cannot run, document the exact reason and root cause.

Required report sections:
- Objective
- Sources and commands used
- Files created or changed
- Scaffold implementation summary
- Verification results
- Deviations from worker-003 recommendation, if any
- Risks and root causes
- Proposed follow-up implementation tasks
- Completion checklist
- Handoff summary

Handoff requirements:
- Summarize implementation.
- List changed files.
- List commands run.
- List unresolved risks or follow-up tasks.
