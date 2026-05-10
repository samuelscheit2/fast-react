# Worker 475: Passive Effect Error Routing Gate

Objective: record private root error routing diagnostics when passive create or
destroy execution throws, preserving accepted root option callback metadata
without invoking public callbacks.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 416, 421, 445, 450, and 474 if
present.

Write scope: `crates/fast-react-reconciler/src/passive_effects.rs`,
`crates/fast-react-reconciler/src/root_commit.rs`, focused reconciler tests,
and `worker-progress/worker-475-passive-effect-error-routing-gate.md`.

Do not claim public error-boundary, public root callback, or public act
compatibility.

Verification: run focused passive-effect/root-error tests,
`cargo test -p fast-react-reconciler --all-features`, `cargo fmt --all --check`,
and `git diff --check`.
