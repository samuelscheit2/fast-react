Worker 1120 - export minimal diagnostic API

Status: implemented in isolated worktree.

Changes:
- Added a doc-hidden reconciler diagnostic entrypoint for the private HostRoot -> HostComponent -> HostText render/complete/placement canary.
- Kept private render, complete handoff, host-node store, and placement commit records unexported.
- Exposed only value/string/boolean metadata needed by the native bridge follow-up.
- Added focused tests for successful metadata export and adapter-error fail-closed behavior.

Verification:
- `cargo test -p fast-react-reconciler --all-features root_work_loop`
- `cargo test -p fast-react-reconciler --lib root_work_loop_minimal_render_complete_placement_commit`
- `cargo check -p fast-react-reconciler --all-features`
- `cargo fmt --all --check`
- `git diff --check`
