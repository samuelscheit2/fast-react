# Worker 363: Test Renderer Update ToJSON Private Host Output

Objective: extend the private react-test-renderer `toJSON` diagnostics from the
single initial host-output canary to a narrow update-after-commit canary with
stale snapshot rejection.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 153, 234, 265, 310, 332, 333, 353, and
356 if present.

Write scope: `crates/fast-react-test-renderer/src/lib.rs`,
`packages/react-test-renderer/index.js`,
`packages/react-test-renderer/cjs/react-test-renderer.development.js`,
`packages/react-test-renderer/cjs/react-test-renderer.production.js`,
focused tests, and
`worker-progress/worker-363-test-renderer-update-tojson-private-host-output.md`.

Keep public `create().toJSON()` blocked.

Verification: run `cargo fmt --all --check`, focused test-renderer Rust tests,
JS syntax checks, focused react-test-renderer serialization tests,
`npm run check --workspace @fast-react/react-test-renderer`, and
`git diff --check`.
