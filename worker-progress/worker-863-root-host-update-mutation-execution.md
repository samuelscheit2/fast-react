# Worker 863 - Root Host Update Mutation Execution

Date: 2026-05-11

## Summary

Executed private root-level HostText and HostComponent update mutations after a
prior root mount.

The new root-work-loop canaries now prove:

- root HostText updates flow through source-owned render/update/commit evidence
  and execute `commit_text_update`
- root HostComponent updates flow through the same evidence and execute
  `commit_update`
- style rows are committed to the private host-node store only, publishing
  latest props without claiming public DOM property compatibility
- text-content rows conflicting with a pending HostText update are rejected
  before any host mutation call
- cross-root/caller-built finished-work records are rejected before commit or
  host mutation

## Changed Files

- `crates/fast-react-reconciler/src/host_work.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `worker-progress/worker-863-root-host-update-mutation-execution.md`

## Commands Run

```sh
cargo test -p fast-react-reconciler --all-features root_work_loop_host_update
cargo test -p fast-react-reconciler --all-features host_work_host_text_update
cargo test -p fast-react-reconciler --all-features root_commit_host_component_update
cargo fmt --all
cargo test -p fast-react-reconciler --all-features root_work_loop_host_update
cargo test -p fast-react-reconciler --all-features host_work_host_text_update
cargo test -p fast-react-reconciler --all-features root_commit_host_component_update
cargo check -p fast-react-reconciler --all-features
cargo fmt --all --check
git diff --check
cargo test -p fast-react-reconciler --all-features host_work_host_component_update
```

## Evidence Gathered

- Read Worker 855 and Worker 860 progress notes before extending their private
  root host mutation execution path.
- Reused the existing single-update commit handoff validator so root update
  execution requires source-owned mutation records, payloads, current/finished
  work, lanes, and host-node evidence.
- Added root update host-work helpers that carry detached host records from the
  prior mount into the update render, instead of accepting caller-built host
  nodes.
- Exposed only crate-private canary diagnostics and inspection helpers for the
  tests; no public renderer or DOM property compatibility surface was added.

## Verification Results

- `root_work_loop_host_update`: passed, 5 tests.
- `host_work_host_text_update`: passed, 2 tests.
- `root_commit_host_component_update`: passed, 1 test.
- `host_work_host_component_update`: passed, 3 tests.
- `cargo check -p fast-react-reconciler --all-features`: passed.
- `cargo fmt --all --check`: passed.
- `git diff --check`: passed.

## Risks Or Blockers

- The execution remains private test-host canary code only.
- Public React DOM, react-test-renderer, hydration, refs/effects, native, and
  package behavior remain intentionally blocked.
- The HostComponent update helper covers same-root private update rows and does
  not claim broad DOM property compatibility.
