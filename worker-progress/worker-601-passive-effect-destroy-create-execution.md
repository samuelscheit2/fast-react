# Worker 601: Passive Effect Destroy Create Execution

## Goal

- Status: active
- Objective: Move one private passive-effect flush path from metadata-only order diagnostics to deterministic test callback execution for accepted committed fibers.
- Goal tooling: `create_goal` and `get_goal` were available; `get_goal` confirmed the objective above before implementation.

## Summary

- Added a private committed-function-component passive callback gate that requires one update-phase committed function component, validates the committed fiber is still in the accepted finished-work subtree, rejects missing commit handoff, and rejects wrong phase before invoking callbacks.
- Routed the existing committed-fiber callback wrapper through the stricter accepted gate so it cannot bypass the new checks.
- Kept public effect execution, scheduler-driven public behavior, and public act compatibility blocked through existing gate blocker metadata.
- Added pending passive count helpers for clearer handoff validation and focused root-config assertions.

## Changed Files

- `crates/fast-react-reconciler/src/passive_effects.rs`
- `crates/fast-react-reconciler/src/root_config.rs`
- `worker-progress/worker-601-passive-effect-destroy-create-execution.md`

## Commands Run

- `cargo fmt --all`
- `cargo test -p fast-react-reconciler --all-features passive_effect -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_config_pending_passive -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_commit_committed_passive_execution_gate_runs_callbacks_under_test_control -- --nocapture`
- `cargo fmt --all --check`
- `git diff --check`

## Evidence Gathered

- `passive_effect`: 33 passed, 0 failed.
- `root_config_pending_passive`: 5 passed, 0 failed.
- `root_commit_committed_passive_execution_gate_runs_callbacks_under_test_control`: 1 passed, 0 failed.
- `cargo fmt --all --check`: passed.
- `git diff --check`: passed.
- Existing public flush remains metadata-only; the new accepted committed-fiber gate reports test-control-only blockers and false public effect/act/scheduler execution flags.

## Delegation

- Spawned explorer `passive_gate_gap_check` to review the scoped gap. It identified that the older committed-fiber callback wrapper could bypass the stricter accepted-fiber checks, so I routed that wrapper through the new gate and kept a negative test on the older name.

## Risks Or Blockers

- The gate is intentionally private and update-phase only. Mount-only passive creates still require a separate admission path before public compatibility can be claimed.
- Wrong effect-phase records are guarded in code, but current safe constructors do not make an invalid phase/order pair easy to construct directly in scoped tests.

## Recommended Next Tasks

- Add the next private gate that stores returned destroy callbacks back into hook effect instances once public passive flushing is ready to advance.
- Extend accepted committed-fiber execution from one function component to ordered multi-fiber traversal after broader commit traversal ownership is settled.
