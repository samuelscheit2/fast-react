# Worker 187: Host Node Store Boundary

You are worker 187 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-187-host-node-store-boundary.md`.

Objective: add a private reconciler-owned host node store boundary for detached
host instance/text records, keyed by opaque `StateNodeHandle`s and scoped by
host token metadata, without implementing commit traversal, DOM adapters,
public renderers, function components, hooks, or JS facades.

Context to read:
- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `worker-progress/worker-051-dom-host-token-boundary.md`
- `worker-progress/worker-151-host-complete-work-skeleton.md`
- `worker-progress/worker-174-ref-token-lifecycle.md`
- `crates/fast-react-reconciler/src/host_tokens.rs`
- `crates/fast-react-reconciler/src/host_work.rs`
- `crates/fast-react-reconciler/src/test_support.rs`
- `crates/fast-react-host-config/src/lib.rs`

Write scope:
- `crates/fast-react-reconciler/src/host_nodes.rs`
- Minimal wiring in `crates/fast-react-reconciler/src/lib.rs`
- Focused tests in `host_nodes.rs`; only touch `host_work.rs` or
  `test_support.rs` if a very small integration check is useful.
- `worker-progress/worker-187-host-node-store-boundary.md`

Do not touch DOM packages, test-renderer packages, scheduler packages, root
commit traversal, public JS facades, function component rendering, hook files,
or native bridge files. You are not alone in the codebase; do not revert other
workers' changes.

Implementation requirements:
- Add a generic private store that can own detached `HostTypes::Instance` and
  `HostTypes::TextInstance` values behind opaque `StateNodeHandle`s.
- Store enough metadata to validate root id, fiber id, token id, phase, and
  target before returning a detached host value.
- Preserve host token opacity: no raw fiber references, DOM nodes, or renderer
  internals should be exposed through errors or metadata beyond typed IDs.
- Provide insertion, lookup, mutable lookup, and removal/invalidation paths for
  instance and text records.
- Validate wrong handle, wrong root/fiber, wrong token, wrong phase, and wrong
  target behavior with focused tests.
- Keep commit traversal out of scope; this is a storage/validation boundary
  that later workers can consume.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features host_nodes`
- `cargo test -p fast-react-reconciler --all-features host_work`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`
