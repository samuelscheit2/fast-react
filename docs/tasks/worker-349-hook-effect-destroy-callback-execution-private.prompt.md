# Worker 349: Hook Effect Destroy Callback Execution Private

Objective: add a private destroy-callback execution path for accepted passive
effect metadata, including ordering and error records, without public
`useEffect` compatibility or act flushing claims.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 157, 173, 224, 250, 279, 296, 301,
and 326 if present.

Write scope: `crates/fast-react-reconciler/src/passive_effects.rs`,
`crates/fast-react-reconciler/src/function_component.rs`, focused Rust tests,
and `worker-progress/worker-349-hook-effect-destroy-callback-execution-private.md`.

Do not alter React JS hook dispatchers.

Verification: run `cargo fmt --all --check`, focused passive/function
component tests, `cargo test -p fast-react-reconciler --all-features`, and
`git diff --check`.
