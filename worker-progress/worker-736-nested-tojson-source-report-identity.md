# Worker 736 Nested toJSON Source Report Identity

## Summary

Implemented Rust-only nested `toJSON` source-report finished-work identity generation for the accepted nested host-parent text placement shape. The nested native `toJSON` identity now comes from a private JSON serialization report backed by committed nested fiber inspection instead of the removed test-only identity helper.

Integrated the branch onto current `main` (`cdc4aee`, including Worker 734 and Worker 735). The audit finding is resolved in the integrated tree: the committed `fiber_inspection` for `TestRendererNestedHostParentPlacedHostOutput` is bound inside `render_and_commit_nested_host_parent_text_placement_for_canary`, so the nested output return owns the inspection value in scope while Worker 735's sibling snapshot blocker remains intact.

## Changed Files

- `crates/fast-react-reconciler/src/private_fiber_inspection.rs`
  - Added nested host component inspection support for `HostRoot -> HostComponent -> HostComponent -> [HostText, HostText]`, plus a one-text nested committed shape needed by the initial nested host output handoff before placement.
  - Added accessors for nested host component inspection.
  - Added a committed-fiber inspection test covering the two-text nested shape.
- `crates/fast-react-test-renderer/src/lib.rs`
  - Stored outer/inner current fiber handles and committed fiber inspection on nested committed/update output handoffs.
  - Added a nested private JSON serialization path that validates outer/inner current fibers against committed inspection and emits four source nodes for the nested update.
  - Added `describe_private_to_json_nested_finished_work_identity_gate_for_canary` using the shared finished-work identity builder.
  - Removed `accepted_nested_to_json_identity_for_root` and updated nested native tests to consume the generated serialization report identity.
- `worker-progress/worker-736-nested-tojson-source-report-identity.md`
  - This report.

## Commands Run

- `cargo test -p fast-react-reconciler committed_fiber_inspection --lib` - passed, 6 tests.
- `cargo test -p fast-react-test-renderer root_private_to_json_nested --lib` - passed, 4 tests.
- `cargo test -p fast-react-test-renderer serialization_finished_work_identity --lib` - passed, 10 tests.
- `cargo test -p fast-react-test-renderer sibling_snapshot --lib` - passed, 2 tests.
- `cargo test -p fast-react-test-renderer to_json --lib` - passed, 26 tests.
- `cargo fmt --all --check` - passed.
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings` - passed.
- `npm run check:package-surface` - passed; npm emitted the existing `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.
- Scoped conflict marker scan over this worker's changed files - passed.

## Evidence Gathered

- Reconciler committed inspection now records nested host component order, parent/child/sibling links, state-node presence, and two committed HostText nodes for the nested placement shape.
- The nested private JSON source report asserts `NestedHostText`, four source nodes, two committed host components, and two committed text fibers before the identity gate consumes the report.
- The integrated `root_private_to_json_nested` compile/test path passes after applying Worker 736 on top of Worker 735, covering the previously reported out-of-scope `fiber_inspection` failure area.
- Worker 735's `sibling_snapshot` blocker tests pass unchanged in the integrated tree.
- Package surface and entrypoint smoke checks still pass, so JS/CJS/public package surface compatibility remains blocked and unchanged.

## Risks Or Blockers

- No blockers.
- The initial nested committed output still needs one-text nested inspection so the later two-text update handoff can carry committed inspection consistently. The actual nested `toJSON` source-report identity path remains strict about the two-text update shape.
- Sibling snapshot finished-work identity remains intentionally blocked by Worker 735's fail-closed diagnostic; this worker preserves that behavior.

## Recommended Next Tasks

- Orchestrator can review and merge this integrated Worker 736 branch.
- Continue sibling snapshot identity work separately once a committed-fiber-backed source report exists for that shape.
