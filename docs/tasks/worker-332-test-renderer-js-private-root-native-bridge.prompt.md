# Worker 332: Test Renderer JS Private Root Native Bridge

Objective: connect the accepted react-test-renderer JS private root request
records to current Rust canary metadata through a record-only private bridge,
without loading native addons or opening public create/update/unmount behavior.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 153, 188, 195, 208, 234, 265, 304,
306, and 307.

Write scope: `packages/react-test-renderer/index.js`,
`packages/react-test-renderer/cjs/react-test-renderer.development.js`,
`packages/react-test-renderer/cjs/react-test-renderer.production.js`,
focused conformance tests, and
`worker-progress/worker-332-test-renderer-js-private-root-native-bridge.md`.

Do not change Rust crates unless the bridge needs a small metadata export.

Verification: run `node --check` on touched JS files, focused
react-test-renderer create/routing tests, `npm run check --workspace
@fast-react/react-test-renderer`, and `git diff --check`.
