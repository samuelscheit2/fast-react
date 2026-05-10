# Worker 387: Root Work Loop Context Provider Handoff

Objective: teach the private root work loop to carry the accepted
ContextProvider begin-work handoff through complete-work diagnostics for one
Provider to function-component consumer path.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 203, 293, 337, 360, and 386 if
present.

Write scope: `crates/fast-react-reconciler/src/root_work_loop.rs`,
`crates/fast-react-reconciler/src/begin_work.rs`, focused root-work-loop tests,
and `worker-progress/worker-387-root-work-loop-context-provider-handoff.md`.

Do not broaden generic begin-work traversal, Suspense/Offscreen behavior, or
public React context compatibility.

Verification: run `cargo fmt --all --check`, focused `root_work_loop` context
tests, `cargo test -p fast-react-reconciler --all-features`, and
`git diff --check`.
