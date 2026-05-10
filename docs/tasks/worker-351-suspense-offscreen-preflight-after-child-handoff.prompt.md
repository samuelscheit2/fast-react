# Worker 351: Suspense/Offscreen Preflight After Child Handoff

Objective: harden Suspense, Offscreen, Activity, ViewTransition, Portal, and
Fragment fail-closed preflight after any new child handoff paths, proving
unsupported tags still do not schedule children, mutate host output, or claim
compatibility.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 175, 227, 287, 297, 329, and 350 if
present.

Write scope: `crates/fast-react-reconciler/src/unsupported_features.rs`,
`crates/fast-react-reconciler/src/begin_work.rs`,
`crates/fast-react-reconciler/src/root_work_loop.rs`, focused Rust tests, and
`worker-progress/worker-351-suspense-offscreen-preflight-after-child-handoff.md`.

Do not implement Suspense, Offscreen, Activity, ViewTransition, or portals.

Verification: run `cargo fmt --all --check`, focused unsupported-feature and
root-work-loop tests, `cargo test -p fast-react-reconciler --all-features`,
and `git diff --check`.
