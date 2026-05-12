Worker 1096 minimal root placement commit

- Branch: worker/1096-minimal-root-placement-commit
- Scope: private production-compiled minimal HostRoot placement executor only.
- Status: implemented and locally verified.

Notes:
- Added a crate-private executor that consumes minimal complete-work metadata, host node store evidence, and a HostRoot commit record.
- The executor validates the single append-to-container apply record and calls prepare_for_commit, append_child_to_container, and reset_after_commit.
- Public render wiring and global HostRoot host mutation gates remain blocked.
- Follow-up audit fix: successful placement now consumes detached HostComponent/HostText records to block replay.
- Follow-up audit fix: reset_after_commit is attempted after prepare even when append_child_to_container fails.

Verification:
- cargo test -p fast-react-reconciler complete_work_minimal_host
- cargo test -p fast-react-reconciler root_work_loop_complete_work_handoff_commits_host_component_tree_with_diagnostics
- cargo test -p fast-react-reconciler root_commit::tests::mutations
- cargo test -p fast-react-reconciler sync_flush
- cargo check -p fast-react-reconciler
- cargo fmt --all --check
- git diff --check
