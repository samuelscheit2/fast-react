# Worker 386: Context Provider Begin Work Runtime Read

Objective: advance ContextProvider begin-work integration so a private
Provider boundary can push context, render one function component consumer, and
unwind deterministically while public context compatibility remains blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 180, 293, 327, 337, 360, and the
latest context-object gate changes if present.

Write scope: `crates/fast-react-reconciler/src/begin_work.rs`,
`crates/fast-react-reconciler/src/function_component.rs`, focused context tests,
and `worker-progress/worker-386-context-provider-begin-work-runtime-read.md`.

Do not admit generic context trees, public React context compatibility, or
unsupported Provider shapes.

Verification: run `cargo fmt --all --check`, focused `begin_work` and
`function_component` context tests,
`cargo test -p fast-react-reconciler --all-features`, and `git diff --check`.
