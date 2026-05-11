# Worker 920: Host Node Store Update Payload Currentness

## Summary

- Strengthened private `HostNodeStore` update payloads with source-owned currentness and monotonic replay rejection.
- Added bound currentness evidence to applied property updates, text updates, and latest-props rows.
- Added negative canaries for stale invalidated handles, removed handles, wrong token/root/phase payload identity, replayed property updates after latest props advance, replayed text updates after text currentness advance, cross-target payload application, missing currentness, and public DOM compatibility claims.

## Changed Files

- `crates/fast-react-reconciler/src/host_nodes.rs`

## Source And Currentness Fields

- Input currentness: `HostNodeUpdateCurrentness`
  - `source_sequence`
  - optional `handle`
  - optional `root_id`
  - optional `fiber_id`
  - optional `token_id`
  - optional `phase`
  - optional `target`
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

## Commands Run

- `cargo test -p fast-react-reconciler --all-features host_nodes`
- `cargo test -p fast-react-reconciler --all-features currentness`
- `cargo test -p fast-react-reconciler --all-features update_payload`
- `cargo check -p fast-react-reconciler --all-features`
- `cargo fmt --all`
- `cargo fmt --all --check`
- `git diff --check`

## Evidence Gathered

- `host_nodes` filter: 20 passed, 729 filtered.
- `currentness` filter: 4 passed, 745 filtered.
- `update_payload` filter: 7 passed, 742 filtered.
- `cargo check`, `cargo fmt --all --check`, and `git diff --check` passed.

## Risks Or Blockers

- The source sequence is process-global and monotonic, while replay rejection is per host node record. This deliberately rejects out-of-order source payload application for the same host node.
- Default update constructors attach sequence-only currentness to preserve existing host work call sites; explicit root/fiber/token/phase/target validation is available when local source identity is provided.
- Public DOM/test-renderer/native execution, renderer compatibility, root public behavior, and package compatibility remain private/blocking surfaces; this worker did not widen those claims.
- Overlap risk: other reconciler workers touching host commit/update paths may need to propagate explicit `HostNodeUpdateCurrentness::for_scope` if they introduce payload objects that outlive local commit validation.

## Recommended Next Tasks

- Thread explicit `HostNodeUpdateCurrentness::for_scope` through host work payload creation sites once those payloads are ready to carry root/fiber/token/phase identity directly.
- Add integration-level canaries around host commit handoff payload persistence if future workers make update payloads survive across commit phases.
