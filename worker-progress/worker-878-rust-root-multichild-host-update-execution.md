# Worker 878 - Rust Root Multi-Child Host Update Execution

Date: 2026-05-11

## Summary

Extended the private Rust HostRoot test-host execution canary from single-root
update/delete shapes to a narrow multi-child HostRoot HostText update/delete
proof.

- Added test-only HostRoot sibling update/delete builders that start from an
  already committed multi-child HostRoot output, update or delete one selected
  HostText child, and preserve stable root siblings as WIP alternates.
- Added root-work-loop canary fixtures that execute a middle HostText update
  and deletion with stable siblings, validating root/current identity, finished
  work handoff, lanes, sibling topology, mutation apply records, detached host
  records, public blockers, and replay behavior before fake host calls.
- Added negative coverage for stale update/delete pending records, wrong
  finished sibling topology, and cross-root mount evidence.

## Changed Files

- `crates/fast-react-reconciler/src/host_work.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `worker-progress/worker-878-rust-root-multichild-host-update-execution.md`

## Evidence Gathered

- New HostRoot sibling update/delete helpers are in `host_work.rs` at
  `update_test_host_root_sibling_text_child_work_for_canary` and
  `delete_test_host_root_sibling_child_for_canary`.
- New root-work-loop multi-child fixtures validate committed root identity,
  stable sibling alternates, HostRoot mutation sources, finished lanes, and
  public compatibility blockers before execution.
- Success tests prove one `commit_text_update` and one
  `remove_child_from_container` host call, stable sibling metadata remains
  active, deletion cleanup invalidates only the deleted HostText, and replay is
  rejected before a second host call.
- Negative tests reject stale update/delete pending records, wrong finished
  sibling topology, and cross-root mount evidence before fake host calls.

## Commands Run

```sh
cargo test -p fast-react-reconciler --all-features root_work_loop_multichild_host
cargo test -p fast-react-reconciler --all-features root_work_loop_host_update
cargo test -p fast-react-reconciler --all-features root_work_loop_root_unmount
cargo test -p fast-react-reconciler --all-features host_work_host_text_update_rejects_replayed_commit_record_before_second_host_call
cargo test -p fast-react-reconciler --all-features root_commit_finished_work_handoff
cargo check -p fast-react-reconciler --all-features
cargo fmt --all --check
git diff --check
```

## Verification

- `root_work_loop_multichild_host`: passed, 6 tests.
- `root_work_loop_host_update`: passed, 5 tests.
- `root_work_loop_root_unmount`: passed, 4 tests.
- `host_work_host_text_update_rejects_replayed_commit_record_before_second_host_call`: passed, 1 test.
- `root_commit_finished_work_handoff`: passed, 6 tests.
- `cargo check -p fast-react-reconciler --all-features`: passed.
- `cargo fmt --all --check`: passed.
- `git diff --check`: passed.

## Risks Or Blockers

- This remains a private test-host canary. Public React DOM, test-renderer,
  native, root rendering, and flushSync compatibility remain blocked.
- The canary is intentionally narrow: it proves HostText update/delete with
  stable HostText siblings, not broad HostComponent or nested multi-child
  reconciliation.
- Delete preparation currently relies on existing deletion marking behavior
  that changes current sibling traversal, so the delete topology validator
  checks the stable-before -> deleted-current link and validates the
  stable-after node through its WIP alternate.

## Recommended Next Tasks

- Add a sibling-aware HostComponent multi-child update/delete proof once
  HostComponent payload style/text reset cases need root-sibling coverage.
- Compose this canary with sync-flush/root facade consumers only after their
  source-owned lifecycle evidence remains current and replay-safe.
