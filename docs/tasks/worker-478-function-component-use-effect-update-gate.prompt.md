# Worker 478: Function Component useEffect Update Gate

Objective: add private render metadata proving `useEffect` mount/update
dependency handling records passive effect phase data without public effect
execution.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 361, 388, 419, 420, 448, and 474 if
present.

Write scope: `crates/fast-react-reconciler/src/function_component.rs`,
`packages/react/hook-dispatcher.js`, focused hook/effect tests, conformance hook
gates if needed, and
`worker-progress/worker-478-function-component-use-effect-update-gate.md`.

Do not run effect callbacks or claim public `useEffect` compatibility.

Verification: run focused function-component/effect tests,
`cargo test -p fast-react-reconciler --all-features`, focused hook conformance
tests if touched, `npm run check --workspace @fast-react/react` if JS changes,
and `git diff --check`.
