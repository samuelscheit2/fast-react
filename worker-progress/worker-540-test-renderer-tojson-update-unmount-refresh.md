# Worker 540: Test Renderer toJSON Update/Unmount Refresh

## Goal

- Active goal status: active
- Active goal objective: Refresh private react-test-renderer toJSON diagnostics so update and unmount host-output rows are explicit while public serialization remains blocked.

## Progress

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Confirmed the repo started with a clean worktree.
- Found existing Rust `toJSON` diagnostics for create/update, existing stale snapshot rejection, and no unmount-specific private `toJSON` row.
- Found the CJS development facade keeps public `toJSON`, TestInstance, native execution, and compatibility claims blocked, but private `toJSON` metadata only admits `Create`/`Update` and does not validate explicit update/unmount row ids.
- Added Rust private `toJSON` update and unmount host-output row ids, dependency diagnostics, public-blocker metadata, update row propagation, and unmount empty-snapshot validation.
- Added Rust rejection coverage for stale unmount snapshots and mismatched update/unmount row records.
- Refreshed the CJS development private `toJSON` facade/gate with update/unmount row metadata, dependency metadata, `Unmount` private diagnostic admission, and row-kind mismatch rejection.
- Updated serialization local gate and create-routing focused tests while keeping public `toJSON`, TestInstance, native execution, and compatibility claims blocked.
- Spawned two read-only inspector agents for Rust and JS gate orientation. They did not return actionable final content before local inspection completed, so no conclusions depended on their output.

## Plan

1. Add Rust private update/unmount row ids plus dependency metadata and focused stale/mismatch tests. Done.
2. Refresh the CJS development private `toJSON` facade/gate to expose those rows and reject mismatched update/unmount records. Done.
3. Update serialization/create-routing conformance gates while keeping public surfaces blocked. Done.
4. Run the assigned verification commands and record results. Done.

## Verification

- `cargo test -p fast-react-test-renderer --all-features to_json -- --nocapture` passed: 8 passed, 70 filtered out.
- Extra coverage: `cargo test -p fast-react-test-renderer --all-features -- --nocapture` passed: 78 passed.
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs` passed: 7 tests passed.
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs` passed: 15 tests passed.
- `npm run check --workspace @fast-react/react-test-renderer` passed.
- `cargo fmt --all --check` passed after applying `cargo fmt --all`.
- `git diff --check` passed.

## Risks

- The unmount row is still private diagnostic metadata only; it does not make the public `toJSON` path execute.
- The CJS development facade has the refreshed private rows. Main and production package files were left unchanged to stay within this worker's package write scope.
