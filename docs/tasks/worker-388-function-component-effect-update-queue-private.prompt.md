# Worker 388: Function Component Effect Update Queue Private

Objective: add a private function-component effect update queue canary that
records changed and unchanged effect dependencies across update renders and
hands the accepted metadata to pending passive records without running effects.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 157, 173, 284, 301, 326, 331, 349,
361, and 362 if present.

Write scope: `crates/fast-react-reconciler/src/function_component.rs`,
`crates/fast-react-reconciler/src/passive_effects.rs`, focused effect tests,
and `worker-progress/worker-388-function-component-effect-update-queue-private.md`.

Do not execute public effects, public `act`, DOM effects, or root error
routing.

Verification: run `cargo fmt --all --check`, focused `function_component` and
`passive_effects` tests, `cargo test -p fast-react-reconciler --all-features`,
and `git diff --check`.
