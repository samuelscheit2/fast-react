# Worker 464: Test Renderer getInstance Class Diagnostic

Objective: add private `getInstance` diagnostics for class component root
shapes in react-test-renderer while function and host roots stay fail-closed as
public behavior.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 153, 159, 184, 425, and 463 if
present.

Write scope: `packages/react-test-renderer/cjs/react-test-renderer.development.js`,
`packages/react-test-renderer/cjs/react-test-renderer.production.js`,
`crates/fast-react-test-renderer/src/lib.rs`, focused test-renderer tests, and
`worker-progress/worker-464-test-renderer-get-instance-class-gate.md`.

Do not implement public class component rendering, public `getInstance`, or
serialization compatibility.

Verification: run focused test-renderer lifecycle/error tests, `cargo test -p
fast-react-test-renderer --all-features`, `npm run check --workspace
@fast-react/react-test-renderer`, and `git diff --check`.
