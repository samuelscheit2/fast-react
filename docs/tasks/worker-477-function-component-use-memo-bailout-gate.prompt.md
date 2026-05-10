# Worker 477: Function Component useMemo Bailout Gate

Objective: add private function-component diagnostics for `useMemo` dependency
reuse versus recompute across updates, aligned with accepted hook queue and
render metadata.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 358, 387, 447, and 448 if present.

Write scope: `crates/fast-react-reconciler/src/function_component.rs`,
`packages/react/hook-dispatcher.js`, focused hook tests, conformance hook gates
if needed, and
`worker-progress/worker-477-function-component-use-memo-bailout-gate.md`.

Do not expose new public hook compatibility or change public hook errors.

Verification: run focused function-component/hook tests,
`cargo test -p fast-react-reconciler --all-features`, focused hook conformance
tests if touched, `npm run check --workspace @fast-react/react` if JS changes,
and `git diff --check`.
