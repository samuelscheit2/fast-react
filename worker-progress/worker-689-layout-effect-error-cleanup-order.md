# Worker 689: Layout Effect Error Cleanup Order

## Goal Evidence

- `create_goal` was called before file reads, research, implementation, or verification.
- `get_goal` was available immediately after setup and again before this report.
- Latest active goal status from `get_goal`: `active`.
- Latest active goal objective from `get_goal`: add private Rust commit evidence for layout-effect destroy/create ordering when a layout callback throws, including fail-closed error metadata and no public effect compatibility claim.

## Assigned Objective

Add private Rust commit evidence for layout-effect destroy/create ordering when a layout callback throws, including fail-closed error metadata and no public effect compatibility claim.

## Write Scope

- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/function_component.rs` only for test fixtures if needed
- `worker-progress/worker-689-layout-effect-error-cleanup-order.md`

## Summary

- Added crate-private fail-closed predicates for layout-effect callback error capture metadata.
- Added `public_effect_compatibility_claimed()` false diagnostics to the private layout callback gate and error capture record.
- Added a focused root-commit canary where the layout destroy callback completes, the layout create callback throws through test control, and the recorded order remains destroy-before-create before passive metadata.
- Confirmed the error metadata preserves configured root error option handles but does not schedule root error work, invoke root error callbacks, touch scheduler queues, aggregate public act errors, run passive callbacks, or claim public effect compatibility.
- No passive-effect queue behavior, JS packages, or `function_component.rs` changes were made.

## Changed Files

- `crates/fast-react-reconciler/src/root_commit.rs`
- `worker-progress/worker-689-layout-effect-error-cleanup-order.md`

## Commands Run

- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `git status --short`
- `rg -n "layout|Layout|effect|destroy|create|panic|throw|error" crates/fast-react-reconciler/src/root_commit.rs`
- `rg -n "layout|Layout|effect|destroy|create|panic|throw|error" crates/fast-react-reconciler/src/function_component.rs`
- `sed` and `rg` focused reads of `root_commit.rs`, `function_component.rs`, existing worker reports, and React reference commit-effect source.
- `cargo fmt --all`: passed.
- `cargo test -p fast-react-reconciler --all-features root_commit_layout_create_throw_preserves_destroy_before_create_order_and_fail_closed_metadata -- --nocapture`: passed, 1 test.
- `cargo test -p fast-react-reconciler --all-features layout -- --nocapture`: passed, 11 tests.
- `cargo test -p fast-react-reconciler --all-features root_commit -- --nocapture`: passed, 83 tests.
- `cargo fmt --all --check`: passed.
- `rg -n "^(<<<<<<<|=======|>>>>>>>)" --glob '!target/**' --glob '!node_modules/**'`: no matches; `rg` exited 1 for no matches.
- `git diff --check`: passed.

## Evidence Gathered

- React 19.2.6 source reference notes layout unmount effects run in the mutation phase so all destroy functions run before create functions, and layout mount create errors are captured with commit-phase error routing.
- New canary `root_commit_layout_create_throw_preserves_destroy_before_create_order_and_fail_closed_metadata` proves:
  - invocation order is layout destroy at order 0, then layout create at order 1;
  - the destroy callback completed and the create callback produced one private error handle;
  - the create error capture points at the layout phase, same root, finished work, function fiber, previous effect, callback, and commit error option handles;
  - fail-closed metadata remains inert and public effect compatibility remains false;
  - scheduler callback and act queue request counts are unchanged;
  - commit-order diagnostics still place mutation layout destroy/callback before layout create/callback and before passive unmount/mount metadata.

## Risks Or Blockers

- This remains private test-control evidence only. It does not execute public `useLayoutEffect`, public act behavior, scheduler-driven effect work, or passive callbacks.
- No blockers.

## Recommended Next Tasks

- Future workers can connect this private error evidence to broader commit error routing only after public error-boundary and act semantics have dedicated compatibility gates.

## Nested Agents

- No nested managed agents were spawned.
