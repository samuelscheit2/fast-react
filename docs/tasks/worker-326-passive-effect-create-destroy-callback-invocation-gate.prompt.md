# Worker 326: Passive Effect Create/Destroy Callback Invocation Gate

Objective: add a private passive-effect callback invocation gate that consumes
accepted create/destroy callback handles only under explicit test control,
records callback ordering and errors, and keeps public effect execution and
act compatibility blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 173, 197, 224, 250, 279, 296, 301,
and 303.

Write scope: `crates/fast-react-reconciler/src/passive_effects.rs`,
`crates/fast-react-reconciler/src/function_component.rs`,
focused Rust tests, and
`worker-progress/worker-326-passive-effect-create-destroy-callback-invocation-gate.md`.

Do not wire public React hooks or React DOM/test-renderer `act`.

Verification: run `cargo fmt --all --check`, focused passive-effect tests,
`cargo test -p fast-react-reconciler --all-features`, and `git diff --check`.
