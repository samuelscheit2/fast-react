# Worker 169: Hydration Boundary Skeleton

You are worker 169 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-169-hydration-boundary-skeleton.md`.

Objective: add fail-closed internal hydration boundary state and tests so
future `hydrateRoot` work has typed placeholders, without enabling public
hydration or DOM marker consumption.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-140-hydration-boundary-refresh.md`
- `worker-progress/worker-095-hydrate-root-facade-plan.md`
- `crates/fast-react-reconciler/src/root_config.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- Hydration references in `/Users/user/Developer/Developer/react-reference`

Write scope:
- `crates/fast-react-reconciler/src/root_config.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- Focused tests in those modules
- `worker-progress/worker-169-hydration-boundary-skeleton.md`

Do not touch public React DOM packages, host-config hydration traits, events,
or DOM marker parsing. You are not alone in the codebase.

Requirements:
- Keep client roots non-hydrated by default.
- Preserve existing unsupported hydration kind behavior.
- Add typed records/accessors for future hydration state if missing.
- Add tests proving hydration remains unsupported/fail-closed.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_config`
- `cargo test -p fast-react-reconciler --all-features fiber_root`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

