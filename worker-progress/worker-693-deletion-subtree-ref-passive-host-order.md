# Worker 693 - Deletion Subtree Ref/Passive/Host Order

## Goal

- Status at setup: active
- Objective: broaden private Rust deletion-subtree evidence to cover ref cleanup, passive destroy scheduling, and host child detachment order for a nested host subtree, while public unmount/passive behavior remains blocked

## Summary

- Added a nested deleted HostComponent subtree fixture in `root_commit.rs` with a mounted HostComponent parent, deleted outer HostComponent ref, nested HostComponent ref, function passive destroy metadata, and HostText leaf.
- Added private root-commit assertions proving:
  - deleted ref cleanup metadata is collected for outer and nested host refs before passive destroy metadata,
  - deleted-subtree passive unmount scheduling records the mounted HostComponent ancestor,
  - host cleanup metadata remains child-before-parent,
  - the host child detachment plan selects the outer deleted HostComponent as the direct host child and keeps public unmount compatibility blocked.
- Added private passive-effects execution assertions proving both deleted ref cleanup gates execute before the deleted-subtree passive destroy callback for the nested host fixture.
- No public React DOM/test-renderer unmount or passive facade behavior was changed or claimed.

## Changed Files

- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/passive_effects.rs`

## Commands Run

- `cargo fmt --all`
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_commit_nested_deletion_orders_ref_cleanup_passive_schedule_and_host_detach_plan -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features deletion_ref_passive_cleanup_execution_orders_nested_host_refs_before_passive_destroy -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features deletion -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features passive -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_commit -- --nocapture`
- `rg -n "^(<<<<<<<|=======|>>>>>>>)" .` (exit 1, no matches)
- `git diff --check`

## Evidence Gathered

- `deletion` filter: 24 passed.
- `passive` filter: 75 passed.
- `root_commit` filter: 83 passed.
- New root-commit canary checks 2 deleted ref cleanup records, 1 passive unmount destroy record, 3 host cleanup records, and host detachment plan coordinates for the nested host subtree.
- New passive-effects canary checks execution events in order: outer host ref cleanup, nested host ref cleanup, then passive destroy.
- Public blockers remain asserted false for unmount/passive/ref compatibility claims.

## Risks Or Blockers

- Evidence remains crate-private and test-controlled; public unmount/passive behavior is still blocked.
- The host child detachment application path itself remains covered by existing host-work canaries; this worker only broadened root-commit/passive private evidence in the assigned files.
- No `host_nodes.rs` changes were needed.

## Recommended Next Tasks

- If this lands cleanly, connect the nested private evidence to any future test-renderer unmount admission gate without relaxing public facade blockers.
- Keep broader Suspense/Offscreen/Portal deletion subtree host detachment blocked until those teardown semantics have dedicated evidence.
