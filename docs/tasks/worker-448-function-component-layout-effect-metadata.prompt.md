# Worker 448: Function Component Layout-Effect Metadata

Objective: add private function-component layout-effect metadata for mount and
update render paths, distinct from passive effect metadata and ready for commit
handoff.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 157, 388, 419, 420, and 443 if
present.

Write scope: `crates/fast-react-reconciler/src/function_component.rs`,
`crates/fast-react-core/src/hook_effect_ring.rs`, focused Rust tests, and
`worker-progress/worker-448-function-component-layout-effect-metadata.md`.

Do not execute layout callbacks, schedule effects, or expose public
`useLayoutEffect`.

Verification: run focused function-component effect tests, `cargo test -p
fast-react-reconciler --all-features`, `cargo fmt --all --check`, and `git
diff --check`.
