# Worker 443: Root Commit Layout-Effect Handoff

Objective: add a private root-commit layout-effect handoff canary that records
layout effect metadata in React commit order without invoking callbacks or
opening public hook behavior.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 157, 388, 419, 420, 421, and 443 if
present.

Write scope: `crates/fast-react-core/src/hook_effect_flags.rs`,
`crates/fast-react-reconciler/src/function_component.rs`,
`crates/fast-react-reconciler/src/root_commit.rs`, focused Rust tests in those
modules, and
`worker-progress/worker-443-root-commit-layout-effect-handoff.md`.

Do not run layout callbacks, schedule passive work, mutate host output, or
claim public `useLayoutEffect` compatibility.

Verification: run focused reconciler tests for function-component/root-commit
effects, `cargo test -p fast-react-reconciler --all-features`, `cargo fmt --all
--check`, and `git diff --check`.
