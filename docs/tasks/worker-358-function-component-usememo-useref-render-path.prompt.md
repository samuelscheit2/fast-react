# Worker 358: Function Component UseMemo UseRef Render Path

Objective: add private function-component render support for deterministic
`useMemo` and `useRef` hook records, preserving current unsupported public hook
facade behavior.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 157, 158, 159, 182, 243, 327, and 328
if present.

Write scope: `crates/fast-react-reconciler/src/function_component.rs`,
`crates/fast-react-reconciler/src/lib.rs`, focused Rust tests, and
`worker-progress/worker-358-function-component-usememo-useref-render-path.md`.

Do not wire the public React JS hook facade or DOM/test-renderer execution.

Verification: run `cargo fmt --all --check`, focused function-component tests,
`cargo test -p fast-react-reconciler --all-features`, and `git diff --check`.
