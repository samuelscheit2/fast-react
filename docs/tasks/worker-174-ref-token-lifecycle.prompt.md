# Worker 174: Ref Token Lifecycle

You are worker 174 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-174-ref-token-lifecycle.md`.

Objective: strengthen host token/ref lifecycle tests and records for future ref
detach/attach commit phases without implementing ref callbacks or public
instance lookup.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-051-host-token-boundary.md`
- `worker-progress/worker-066-dom-ref-callback-oracle.md`
- `worker-progress/worker-139-passive-ref-refresh.md`
- `crates/fast-react-reconciler/src/host_tokens.rs`
- `crates/fast-react-reconciler/src/test_support.rs`

Write scope:
- `crates/fast-react-reconciler/src/host_tokens.rs`
- `crates/fast-react-reconciler/src/test_support.rs` only for focused tests
- `worker-progress/worker-174-ref-token-lifecycle.md`

Do not touch DOM node maps, public refs, commit traversal, or JS packages. You
are not alone in the codebase.

Requirements:
- Add or verify phase-scoped token validity for commit/deletion/ref phases.
- Add tests for stale tokens, wrong target, wrong phase, and invalidation.
- Keep host nodes opaque.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features host_tokens`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

