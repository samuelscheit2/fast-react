# Worker 899 - Rust Test Renderer Direct Multi-Child Fiber Inspection

## Summary

- Added a narrow private committed-current fiber inspection proof for the direct `HostRoot -> HostComponent -> [HostText, HostText]` topology produced by the host-parent placement canary.
- The new report consumes Worker 895 route admission, lifecycle execution evidence, finished-work identity, and a source-owned direct row identity proof before validating current-root, lane, placement, and child/sibling topology from the root store.
- Addressed the audit finding that the bare multi-child host-output row was shape-only and replayable across same-shape roots by requiring a root/renderer/update/current/commit/lane/fiber-bound row identity proof.
- Kept generic reconciler direct multi-child inspection, public toJSON/toTree/TestInstance serialization, native bridge loading/execution, JS/CJS/package compatibility, React DOM, root/act/Scheduler, and broad multi-child compatibility closed.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `worker-progress/worker-899-rust-test-renderer-direct-multichild-fiber-inspection.md`

## Evidence Added

- Validates the accepted direct shape as exactly `["HostRoot", "HostComponent", "HostText", "HostText"]` with one root child, one host component, and two direct host text children.
- Requires accepted update route metadata, lifecycle source ownership, Worker 895 row identity, a direct source-owned row identity proof, finished-work/current-root identity, lane consistency, and host-parent placement handoff evidence.
- The direct row identity proof binds the host-output row to renderer owner, scheduled update sequence, render current/finished work, commit previous/current, store current, direct child fiber handles, commit lanes, and public/native/package blockers.
- The row identity builder mints the row from the owning root/output and does not accept a caller-provided bare row.
- Added a replay canary showing two same-shape roots can produce equal bare host-output rows while the foreign root's row identity is rejected by direct inspection before acceptance.
- Independently inspects committed current child topology from the store and matches component, stable text, placed text, props, state nodes, sibling order, and current root handles to the source output.
- Rejects missing/stale/replayed route evidence, caller-built lifecycle rows, wrong update kind, stale topology evidence, lane drift, cross-root/current mismatch, and public/native/package compatibility claims.

## Commands Run

- `cargo test -p fast-react-test-renderer --all-features direct_multi_child_host_text_committed_fiber_inspection --no-run`
- `cargo test -p fast-react-test-renderer --all-features direct_multi_child_host_text_committed_fiber_inspection`
- `cargo test -p fast-react-test-renderer --all-features multi_child_host_text`
- `cargo test -p fast-react-test-renderer --all-features root_private_multi_child_host_text`
- `cargo test -p fast-react-test-renderer --all-features root_private_root_lifecycle_execution`
- `cargo test -p fast-react-test-renderer --all-features root_private_to_json_native_execution`
- `cargo test -p fast-react-test-renderer --all-features root_private_to_tree_native_execution`
- `cargo check -p fast-react-test-renderer --all-features`
- `cargo test -p fast-react-test-renderer --all-features`
- `cargo fmt --all`
- `cargo fmt --all --check`
- `git diff --check`
- Audit fix rerun:
  - `cargo test -p fast-react-test-renderer --all-features direct_multi_child_host_text_committed_fiber_inspection`
  - `cargo fmt --all`
  - `cargo test -p fast-react-test-renderer --all-features multi_child_host_text`
  - `cargo test -p fast-react-test-renderer --all-features root_private_multi_child_host_text`
  - `cargo test -p fast-react-test-renderer --all-features root_private_root_lifecycle_execution`
  - `cargo test -p fast-react-test-renderer --all-features root_private_to_json_native_execution`
  - `cargo test -p fast-react-test-renderer --all-features root_private_to_tree_native_execution`
  - `cargo check -p fast-react-test-renderer --all-features`
  - `cargo test -p fast-react-test-renderer --all-features`
  - `cargo fmt --all --check`
  - `git diff --check`

## Results

- New direct multi-child committed-fiber inspection tests: `4 passed`.
- Worker 895 multi-child filters: `multi_child_host_text` `7 passed`; `root_private_multi_child_host_text` `3 passed`.
- Lifecycle/native regression filters: `root_private_root_lifecycle_execution` `3 passed`; `root_private_to_json_native_execution` `3 passed`; `root_private_to_tree_native_execution` `2 passed`.
- Full `fast-react-test-renderer` suite: `181 passed`, doc tests `0 passed`.
- `cargo check`, `cargo fmt --all --check`, and `git diff --check` passed.

## Risks Or Blockers

- This remains a source-owned test-renderer proof; generic `inspect_test_renderer_committed_fiber_tree` still rejects direct `HostComponent -> [HostText, HostText]` and should be extended in a separate reconciler-scoped worker.
- A bit-for-bit identical cloned lifecycle value is not distinguishable from the original Rust value; this proof rejects stale, tampered, caller-built, and source-ownership-missing lifecycle evidence.
- Bare host-output rows remain shape rows and can be equal across same-shape roots, but direct fiber inspection no longer accepts a bare row; it requires a source-owned direct row identity proof bound to the current renderer/fiber commit.
- Public serialization, native addon loading/execution, JS/CJS/package compatibility, React DOM, root/act/Scheduler, and broad multi-child compatibility remain intentionally closed.

## Recommended Next Tasks

- Add reconciler-level committed-fiber inspection support for direct `HostComponent -> [HostText, HostText]`.
- After that, wire the generic direct multi-child inspection into private serialization/native execution gates instead of relying on this source-owned proof.
