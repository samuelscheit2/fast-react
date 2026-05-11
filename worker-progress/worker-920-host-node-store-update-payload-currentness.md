# Worker 920: Host Node Store Update Payload Currentness

## Summary

- Strengthened private `HostNodeStore` update payloads with fail-closed source-owned currentness and monotonic replay rejection.
- Added bound currentness evidence to applied property updates, text updates, and latest-props rows.
- Threaded scoped update currentness through real host-work component property and text update commit paths.
- Added negative canaries for stale invalidated handles, removed handles, wrong handle/root/fiber/token/phase/target payload identity, replayed property updates after latest props advance, replayed text updates after text currentness advance, cross-target payload application, missing/sequence-only currentness, and public DOM compatibility claims.

## Changed Files

- `crates/fast-react-reconciler/src/host_nodes.rs`
- `crates/fast-react-reconciler/src/host_work.rs`

## Source And Currentness Fields

- Input currentness: `HostNodeUpdateCurrentness`
  - `source_sequence`
  - required-at-bind `handle`
  - required-at-bind `root_id`
  - required-at-bind `fiber_id`
  - required-at-bind `token_id`
  - required-at-bind `phase`
  - required-at-bind `target`
- Applied/bound currentness: `HostNodeAppliedUpdateCurrentness`
  - `source_sequence`
  - `handle`
  - `root_id`
  - `fiber_id`
  - `token_id`
  - `phase`
  - `target`
- Store currentness state:
  - per-record `last_update_source_sequence`
  - per-text-record `latest_text`
  - existing per-instance `latest_props`
- Host-work call-site threading:
  - `DetachedHostRecords::commit_test_host_text_record` passes `HostNodeUpdateCurrentness::for_scope(handle, scope, TextInstance)`.
  - `host_node_property_update_for_component_payload` now accepts `handle` and `scope` and passes `HostNodeUpdateCurrentness::for_scope(handle, scope, Instance)` for both private style/latest-props and host-call property rows.

## Commands Run

- `cargo test -p fast-react-reconciler --all-features host_nodes`
- `cargo test -p fast-react-reconciler --all-features currentness`
- `cargo test -p fast-react-reconciler --all-features update_payload`
- `cargo test -p fast-react-reconciler --all-features host_work_rejects_sequence_only`
- `cargo test -p fast-react-reconciler --all-features host_work_applies`
- `cargo check -p fast-react-reconciler --all-features`
- `cargo fmt --all`
- `cargo fmt --all --check`
- `git diff --check`

## Evidence Gathered

- `host_nodes` filter: 21 passed, 731 filtered.
- `currentness` filter: 7 passed, 745 filtered.
- `update_payload` filter: 8 passed, 744 filtered.
- `host_work_rejects_sequence_only` filter: 2 passed, 750 filtered.
- `host_work_applies` filter: 12 passed, 740 filtered.
- `cargo check`, `cargo fmt --all --check`, and `git diff --check` passed.

## Risks Or Blockers

- The source sequence is process-global and monotonic, while replay rejection is per host node record. This deliberately rejects out-of-order source payload application for the same host node.
- Default update constructors still create sequence-only payload objects, but `HostNodeStore` now rejects them with `MissingCurrentness`; real host-work paths attach scoped identity before store application.
- Public DOM/test-renderer/native execution, renderer compatibility, root public behavior, and package compatibility remain private/blocking surfaces; this worker did not widen those claims.
- Overlap risk: other reconciler workers touching host commit/update paths must propagate explicit `HostNodeUpdateCurrentness::for_scope` or equivalent full identity before calling `HostNodeStore` update APIs.

## Recommended Next Tasks

- If future host update payloads survive across commit phases, persist scoped currentness with the payload rather than recreating it only at application time.
- Add broader integration canaries if additional renderer paths start calling `HostNodeStore` update APIs directly.
