# Worker 463: TestInstance findAll Private Query Gate

Objective: extend the private TestInstance bridge with deterministic `findAll`
query diagnostics for type, props, and predicate-like metadata while public
queries remain blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 333, 365, 426, and 440 if present.

Write scope: `packages/react-test-renderer/cjs/react-test-renderer.development.js`,
`packages/react-test-renderer/cjs/react-test-renderer.production.js`,
`crates/fast-react-test-renderer/src/lib.rs`, focused test-renderer tests, and
`worker-progress/worker-463-test-renderer-find-all-private-query.md`.

Do not open public TestInstance queries, change public package keys, or claim
react-test-renderer compatibility.

Verification: run focused test-renderer JS tests, `cargo test -p
fast-react-test-renderer --all-features`, `npm run check --workspace
@fast-react/react-test-renderer`, and `git diff --check`.
