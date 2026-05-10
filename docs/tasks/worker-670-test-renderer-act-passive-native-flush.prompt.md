# Worker 670: Test Renderer Act Passive Native Flush

Objective: advance private react-test-renderer act diagnostics to consume accepted native update execution plus passive-effect drain metadata for one path, without opening public `act()` compatibility.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

Write scope: `packages/react-test-renderer/cjs/react-test-renderer.development.js`, `tests/conformance/test/react-test-renderer-act-oracle.test.mjs`, `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`, targeted Rust test-renderer metadata if required, and `worker-progress/worker-670-test-renderer-act-passive-native-flush.md`.

Keep separate from Scheduler mock root-work handoff internals unless a narrow adapter assertion is necessary.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-test-renderer --all-features act -- --nocapture`, `node --test tests/conformance/test/react-test-renderer-act-oracle.test.mjs`, `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`, and `npm run check --workspace @fast-react/react-test-renderer`.
