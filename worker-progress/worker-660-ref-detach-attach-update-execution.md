# Worker 660: Ref Detach Attach Update Execution

Date: 2026-05-10

## Goal Evidence

- `create_goal` was called as the first action before file reads, research,
  implementation, or verification.
- Initial `get_goal` returned status `active` with objective:
  `implement private reconciler evidence for ref detach/attach ordering during a HostComponent update, consuming existing ref metadata and keeping public ref callback compatibility blocked`.
- Final pre-verification `get_goal` returned the same active objective and
  status `active`.
- Final post-verification `get_goal` returned the same active objective and
  status `active`.

## Summary

- Added a crate-private HostComponent update/ref ordering diagnostic in
  `root_commit.rs`.
- The diagnostic consumes existing HostComponent mutation apply records and the
  existing ref callback execution handoff metadata.
- A focused root commit test now proves a changed HostComponent ref with an
  `UPDATE | REF` finished fiber records private order evidence as
  `ref-detach -> host-component-update -> ref-attach`.
- Public ref callback compatibility remains blocked: the existing ref callback
  handoff and cleanup-return gates still keep their blockers, and the new
  diagnostic reports no callback refs, object ref mutations, host mutations,
  public root touches, or React DOM ref compatibility claims.

## Changed Files

- `crates/fast-react-reconciler/src/root_commit.rs`
- `worker-progress/worker-660-ref-detach-attach-update-execution.md`

## Evidence Gathered

- Inspected existing root commit ref metadata, DOM ref callback gate, ref
  callback execution handoff, cleanup-return gate, HostComponent update apply
  records, and commit-order diagnostics.
- Checked prior worker reports for HostComponent update execution, ref callback
  handoffs, cleanup-return gates, and commit-order diagnostics.
- No nested agents or subagents were used.

## Completion Audit

- Private reconciler evidence: implemented
  `HostRootRefHostComponentUpdateOrderSnapshotForCanary` and exposed it through
  `HostRootCommitRecord::ref_host_component_update_order_for_canary()`.
- HostComponent update requirement: covered by
  `root_commit_records_ref_detach_update_attach_order_for_host_component_update`,
  which creates a finished HostComponent with `UPDATE | REF`, an alternate
  current fiber, and a reused state node.
- Existing ref metadata consumption: the collector derives records from
  `HostRootRefCallbackExecutionHandoffSnapshot` and matches them to existing
  HostComponent mutation apply records.
- Ordering proof: the test asserts the diagnostic sequence is
  `ref-detach`, `host-component-update`, `ref-attach`, with shared root,
  finished work, current fiber, updated fiber, and state node.
- Public ref compatibility blocked: the test asserts the existing handoff and
  cleanup-return blockers, and the new diagnostic reports no callback refs,
  object ref mutations, host mutations, public root touches, or React DOM ref
  compatibility claim.
- Scope audit: `git status --short` shows only `root_commit.rs` modified and
  this worker report added. No React DOM root option callbacks, test-renderer
  public refs, passive effects, or deletion subtree traversal files were
  modified. `host_nodes.rs` did not need a change because the required host-node
  update evidence already exists and was covered by the focused `host_nodes`
  tests.

## Verification

- `cargo test -p fast-react-reconciler root_commit_records_ref_detach_update_attach_order_for_host_component_update -- --nocapture`: passed.
- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-reconciler ref root_commit host_nodes -- --nocapture`: failed before running tests because Cargo accepts only one test filter and treated `root_commit` as an unexpected argument.
- Cargo-valid split focused coverage:
  - `cargo test -p fast-react-reconciler ref -- --nocapture`: passed, 32 tests.
  - `cargo test -p fast-react-reconciler root_commit -- --nocapture`: passed, 77 tests.
  - `cargo test -p fast-react-reconciler host_nodes -- --nocapture`: passed, 12 tests.
- `git diff --check`: passed.

## Risks Or Blockers

- No known blockers.
- The new path is metadata-only and root-commit-private. It does not execute ref
  callbacks, mutate object refs, expose public instances, route public root
  errors, modify React DOM root option callbacks, touch test-renderer public
  refs, alter passive effects, or change deletion subtree traversal.
