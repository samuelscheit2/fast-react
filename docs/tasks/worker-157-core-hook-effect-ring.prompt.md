# Worker 157: Core Hook Effect Ring

You are worker 157 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-157-core-hook-effect-ring.md`.

Objective: implement pure core hook effect ring storage and iteration helpers
using existing `HookEffectFlags`, without integrating function component render
or commit phases.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-078-hook-effect-ring-plan.md`
- `worker-progress/worker-136-function-hooks-refresh.md`
- `worker-progress/worker-139-passive-ref-refresh.md`
- `crates/fast-react-core/src/hook_effect_flags.rs`
- React reference hook effect list code as needed.

Write scope:
- New core hook effect storage module under `crates/fast-react-core/src/`
- Minimal exports in `crates/fast-react-core/src/lib.rs`
- Focused unit tests
- `worker-progress/worker-157-core-hook-effect-ring.md`

Do not touch reconciler, hook dispatcher, commit, passive effect scheduler, DOM,
or JS packages. Worker 158 may add hook update queues in core; avoid sharing a
file except `lib.rs`. You are not alone in the codebase.

Implementation requirements:
- Provide handle-backed or arena-backed effect nodes consistent with existing
  core handle style.
- Support O(1) circular append with a tail handle, ordered iteration from
  first effect, and filtered iteration by `HookEffectFlags`.
- Preserve insertion order and reject stale/invalid handles if generations are
  used.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features hook_effect`
- `cargo test -p fast-react-core --all-features`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- `git diff --check`

