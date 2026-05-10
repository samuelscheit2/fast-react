# Worker 444: Ref Cleanup-Return Execution Gate

Objective: extend the private ref callback path so cleanup-return handles can
be recorded and explicitly executed through a test-only gate with detach-before
attach ordering evidence.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 174, 385, 398, 415, and 416 if
present.

Write scope: `crates/fast-react-reconciler/src/root_commit.rs`,
`crates/fast-react-reconciler/src/host_tokens.rs`,
`packages/react-dom/src/client/ref-callback-gate.js`, focused ref callback
tests, and
`worker-progress/worker-444-ref-cleanup-return-execution-gate.md`.

Do not invoke public refs, mutate browser DOM, or expose cleanup execution
through public React DOM roots.

Verification: run focused Rust root-commit/ref tests, focused React DOM ref
callback tests, `npm run check --workspace @fast-react/react-dom`, and `git
diff --check`.
