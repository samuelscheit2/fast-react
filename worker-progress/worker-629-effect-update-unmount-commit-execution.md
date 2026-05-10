# Worker 629: Effect Update/Unmount Commit Execution

## Goal Evidence

- `create_goal` was called first with objective: "Add private effect lifecycle execution evidence for update and unmount ordering that consumes accepted layout/passive metadata and keeps public effect compatibility blocked."
- `get_goal` confirmed the active goal status was `active` for the same objective before implementation.
- No nested managed agents were spawned.

## Summary

- Added a crate-private effect lifecycle execution evidence snapshot in `passive_effects.rs`.
- The update evidence gate consumes accepted effect-list metadata, the private layout callback execution gate, and the accepted committed passive callback gate. It records layout-destroy metadata, layout-create callback execution, passive destroy callback execution, and passive create callback execution in deterministic order.
- The deleted-subtree unmount evidence gate consumes accepted deleted-subtree passive metadata, deletion cleanup order metadata, and the private deleted-subtree passive destroy executor result. It records passive destroy metadata/callback evidence before host cleanup metadata.
- Public effect execution, public effect compatibility, public act compatibility, and scheduler-driven passive execution all remain explicitly false.

## Changed Files

- `crates/fast-react-reconciler/src/passive_effects.rs`
- `worker-progress/worker-629-effect-update-unmount-commit-execution.md`

## Commands Run And Results

- `sed -n '1,220p' WORKER_BRIEF.md`: inspected worker rules.
- `get_goal`: active goal confirmed for this worker objective.
- `rg`/`sed` inspections of related worker reports, `root_commit.rs`, `passive_effects.rs`, `function_component.rs`, and React 19.2.6 reference commit/passive effect sources.
- `cargo fmt --all`: passed.
- `cargo test -p fast-react-reconciler --all-features passive_effects_update_lifecycle_execution_evidence_orders_layout_before_passive_callbacks -- --nocapture`: passed, 1 test.
- `cargo test -p fast-react-reconciler --all-features passive_effects_deleted_subtree_unmount_lifecycle_execution_evidence_consumes_cleanup_order_metadata -- --nocapture`: passed, 1 test.
- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-reconciler layout -- --nocapture`: passed, 9 tests.
- `cargo test -p fast-react-reconciler passive -- --nocapture`: passed, 69 tests.
- `git diff --check`: passed.

## Evidence Gathered

- React 19.2.6 reference shows layout unmount effects are destroyed in mutation phase, layout mount effects run in layout phase, and passive flush runs passive unmounts before passive mounts.
- The update lifecycle test proves the accepted metadata and private execution gates compose in this order: layout destroy metadata, layout create callback, passive destroy callback, passive create callback.
- The deleted-subtree unmount lifecycle test proves the private passive destroy executor consumed accepted deleted-subtree passive metadata and matched the cleanup order gate before host cleanup metadata.
- Tests assert no host operations, no new scheduler callback/act queue requests, cleared pending passive state after private flush, and false public compatibility flags.

## Risks Or Blockers

- This remains private diagnostic evidence only. It does not execute public `useEffect` or `useLayoutEffect`, does not enable public act behavior, and does not claim renderer compatibility.
- The update gate is intentionally narrow: one accepted update-phase function component with layout create execution and passive destroy/create execution.
- The unmount gate is scoped to the accepted deleted-subtree passive destroy path and cleanup order metadata; broad unmount traversal remains blocked.

## Recommended Next Tasks

- Add committed effect ownership/traversal broadening only after each extra fiber shape has accepted metadata and fail-closed validation.
- Keep public React effect compatibility blocked until renderer roots, scheduling, error routing, and public act behavior have end-to-end evidence.
