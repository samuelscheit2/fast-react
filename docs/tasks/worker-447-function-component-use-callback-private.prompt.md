# Worker 447: Function Component useCallback Private Path

Objective: add a private `useCallback` render-path canary by reusing the
accepted memo dependency machinery while keeping public hook dispatch blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 157, 158, 182, 388, and 419 if
present.

Write scope: `crates/fast-react-reconciler/src/function_component.rs`,
`packages/react/hook-dispatcher.js`, focused hook tests, and
`worker-progress/worker-447-function-component-use-callback-private.md`.

Do not open public `useCallback`, change `useMemo` semantics, or claim hook
compatibility.

Verification: run focused function-component hook tests, focused React hook
dispatcher tests, `cargo test -p fast-react-reconciler --all-features`, `npm run
check --workspace @fast-react/react`, and `git diff --check`.
