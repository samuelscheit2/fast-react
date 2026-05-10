# Worker 699: Test Renderer TestInstance Class Query Execution

Objective: add private react-test-renderer TestInstance query evidence for class-component roots and updated host children, while public `root`, `find*`, and TestInstance behavior stay blocked.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

After goal setup, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do not read `ORCHESTRATOR.md`.

Write scope: `crates/fast-react-test-renderer/src/lib.rs`, `packages/react-test-renderer/cjs/react-test-renderer.development.js`, `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`, `tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs` only if the blocked error gate needs new accepted metadata, and `worker-progress/worker-699-test-renderer-testinstance-class-query-execution.md`.

Constraints: do not touch serialization facades unless necessary to share a private class-root diagnostic. No public compatibility claims.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-test-renderer --all-features test_instance class -- --nocapture` split into valid Cargo filters if needed, focused create-routing/error-surface conformance, `npm run check --workspace @fast-react/react-test-renderer`, conflict-marker scan, and `git diff --check`.
