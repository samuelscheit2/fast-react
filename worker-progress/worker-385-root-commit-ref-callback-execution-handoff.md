# Worker 385: Root Commit Ref Callback Execution Handoff

## Goal Evidence

- Goal tool available: yes.
- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` succeeded after setup and before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: connect root-commit ref attach/detach
  metadata to a private callback-ref execution handoff record that proves
  attach, cleanup-return detach, and changed-ref ordering without invoking
  public roots.

## Summary

Connected the accepted root-commit ref attach/detach metadata to a new private
callback-ref execution handoff layer.

On the Rust side, `HostRootCommitRecord` now carries a crate-private
`HostRootRefCallbackExecutionHandoffSnapshot` derived from the already
validated DOM ref callback commit gate. The handoff preserves source gate
sequence, root/fiber/state-node/ref handle, token scope, action, detach reason,
and changed-ref detach-before-attach proof while keeping callback invocation,
object ref mutation, public roots, root error routing, and React DOM ref
compatibility false/blocked.

On the React DOM private JS side, `ref-callback-gate.js` now exposes a private
`createRefCallbackExecutionHandoffRecord` helper. It consumes root-commit ref
metadata records, delegates to the controlled invocation gate, and wraps the
result in a handoff record that proves cleanup-return detach happens before the
changed-ref attach without public root execution.

## Changed Files

- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/host_tokens.rs`
- `packages/react-dom/src/client/ref-callback-gate.js`
- `tests/conformance/test/dom-ref-callback-oracle.test.mjs`
- `worker-progress/worker-385-root-commit-ref-callback-execution-handoff.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and worker reports 174, 245, 340, 371, and 377.
- Confirmed worker 245 already materialized root-commit ref metadata and a
  blocked DOM ref callback commit gate from commit/deletion instance tokens.
- Confirmed worker 340 already added controlled private callback invocation and
  cleanup-return execution from explicit private metadata.
- Confirmed worker 371 already proved host-output update/unmount ref ordering
  through a higher-level private diagnostic, but not a direct root-commit
  execution handoff record.
- Confirmed `HostFiberTokenStore` remains the right scoped validation boundary:
  commit instance tokens for attach and deletion instance tokens for detach.

## Commands Run

```sh
create_goal
get_goal
rg --files -g 'WORKER_BRIEF.md' -g 'MASTER_PLAN.md' -g 'MASTER_PROGRESS.md' -g 'worker-progress/*174*' -g 'worker-progress/*245*' -g 'worker-progress/*340*' -g 'worker-progress/*371*' -g 'worker-progress/*377*' -g 'worker-progress/*385*'
git status --short
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,220p' worker-progress/worker-174-ref-token-lifecycle.md
sed -n '1,240p' worker-progress/worker-245-dom-ref-callback-commit-gate.md
sed -n '1,240p' worker-progress/worker-340-dom-ref-callback-private-invocation-gate.md
sed -n '1,240p' worker-progress/worker-371-react-dom-ref-attach-detach-order-private.md
sed -n '1,240p' worker-progress/worker-377-scheduler-act-queue-flush-helper-private.md
sed -n '1,280p' crates/fast-react-reconciler/src/root_commit.rs
sed -n '281,760p' crates/fast-react-reconciler/src/root_commit.rs
sed -n '761,1320p' crates/fast-react-reconciler/src/root_commit.rs
sed -n '1321,2000p' crates/fast-react-reconciler/src/root_commit.rs
sed -n '1990,2090p' crates/fast-react-reconciler/src/root_commit.rs
sed -n '6140,6475p' crates/fast-react-reconciler/src/root_commit.rs
sed -n '6501,6905p' crates/fast-react-reconciler/src/root_commit.rs
sed -n '1,360p' crates/fast-react-reconciler/src/host_tokens.rs
sed -n '1,360p' packages/react-dom/src/client/ref-callback-gate.js
sed -n '361,840p' packages/react-dom/src/client/ref-callback-gate.js
sed -n '841,1320p' packages/react-dom/src/client/ref-callback-gate.js
sed -n '1321,1880p' packages/react-dom/src/client/ref-callback-gate.js
sed -n '1,360p' tests/conformance/test/dom-ref-callback-oracle.test.mjs
sed -n '361,900p' tests/conformance/test/dom-ref-callback-oracle.test.mjs
rg -n 'HostRootDomRef|dom_ref|ref_commit|RefCallback|callback' crates/fast-react-reconciler/src/root_commit.rs tests/conformance/test/dom-ref-callback-oracle.test.mjs packages/react-dom/src/client/ref-callback-gate.js
rg -n 'root-commit|execution handoff|handoff|execution' packages/react-dom/src/client packages/react-dom/test tests/conformance/test crates/fast-react-reconciler/src worker-progress -g '!node_modules' -g '!target'
sed -n '1,360p' crates/fast-react-reconciler/src/root_callbacks.rs
sed -n '1,220p' worker-progress/worker-326-passive-effect-create-destroy-callback-invocation-gate.md
sed -n '1,180p' worker-progress/worker-349-hook-effect-destroy-callback-execution-private.md
rg -n 'ExecutionHandoff|execution handoff|ControlledInvocation|private.*execution|callback.*handoff' crates packages tests worker-progress -g '!node_modules' -g '!target'
node --check packages/react-dom/src/client/ref-callback-gate.js
node --check tests/conformance/test/dom-ref-callback-oracle.test.mjs
cargo fmt --all
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features root_commit_records_ref
cargo test -p fast-react-reconciler --all-features dom_ref_callback_gate
cargo test -p fast-react-reconciler --all-features ref_callback_execution_handoff
cargo test -p fast-react-reconciler --all-features root_commit_records_changed_ref_detach_before_new_ref_attach_metadata
cargo test -p fast-react-reconciler --all-features root_commit_records_deleted_ref_detach_metadata_in_parent_before_child_order
cargo test -p fast-react-reconciler --all-features root_commit_switches_current_to_completed_host_root_wip
cargo test -p fast-react-reconciler --all-features root_commit
node --test tests/conformance/test/dom-ref-callback-oracle.test.mjs
npm run check --workspace @fast-react/react-dom
get_goal
cargo fmt --all --check
git diff --check
git status --short
git add --intent-to-add worker-progress/worker-385-root-commit-ref-callback-execution-handoff.md && git diff --check; rc=$?; git reset -q HEAD -- worker-progress/worker-385-root-commit-ref-callback-execution-handoff.md; exit $rc
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
```

## Verification Results

Passed:

```sh
node --check packages/react-dom/src/client/ref-callback-gate.js
node --check tests/conformance/test/dom-ref-callback-oracle.test.mjs
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features root_commit_records_ref
cargo test -p fast-react-reconciler --all-features dom_ref_callback_gate
cargo test -p fast-react-reconciler --all-features ref_callback_execution_handoff
cargo test -p fast-react-reconciler --all-features root_commit_records_changed_ref_detach_before_new_ref_attach_metadata
cargo test -p fast-react-reconciler --all-features root_commit_records_deleted_ref_detach_metadata_in_parent_before_child_order
cargo test -p fast-react-reconciler --all-features root_commit_switches_current_to_completed_host_root_wip
cargo test -p fast-react-reconciler --all-features root_commit
node --test tests/conformance/test/dom-ref-callback-oracle.test.mjs
npm run check --workspace @fast-react/react-dom
cargo fmt --all --check
git diff --check
git add --intent-to-add worker-progress/worker-385-root-commit-ref-callback-execution-handoff.md && git diff --check; rc=$?; git reset -q HEAD -- worker-progress/worker-385-root-commit-ref-callback-execution-handoff.md; exit $rc
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
```

Focused results:

- `root_commit`: 31 tests passed.
- Ref callback conformance: 17 tests passed.
- React DOM workspace check: 37 package tests plus import-entrypoint smoke
  passed. npm printed the existing `minimum-release-age` warning.
- Final `cargo fmt --all --check`, tracked `git diff --check`, and
  report-inclusive intent-to-add `git diff --check` passed.
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
  passed.

## Quality, Maintainability, Performance, And Security Review

- Quality: the handoff is built from existing validated metadata and has
  focused tests for attach, deleted detach, changed-ref ordering, stale-token
  rejection, and JS cleanup-return detach before attach.
- Maintainability: Rust keeps the root-commit handoff data-only and scoped to
  existing commit/deletion instance tokens. JS layers the execution handoff on
  the existing controlled invocation gate instead of duplicating callback
  invocation logic.
- Performance: both new handoff paths are linear in the existing ref metadata
  length and do not add new tree traversal beyond current metadata collection.
- Security: no raw DOM node, ref value, cleanup return, latest props, public
  root object, or root error callback is exposed on public records. Hidden
  payloads remain WeakMap-private.

## Risks Or Blockers

- This is still private infrastructure. Public React DOM roots remain inert and
  public ref compatibility remains blocked.
- Rust records opaque `RefHandle` values only; actual JS callback values and
  cleanup-return functions are still supplied to the private JS gate under test
  control.
- Object refs are counted/skipped by the JS controlled gate and remain
  unwritten. Public root error routing remains blocked.

## Recommended Next Tasks

1. Add a private cleanup-return store/handle bridge so attach-returned cleanup
   functions can flow into later detach metadata without direct test plumbing.
2. Add private root error routing records for callback attach and cleanup
   exceptions before admitting any public root error behavior.
3. Keep public React DOM ref compatibility blocked until public roots, DOM
   mutation, object refs, cleanup storage, and root error policy are all wired.

## Nested Agents

- No nested agents or explorer subagents were used.
