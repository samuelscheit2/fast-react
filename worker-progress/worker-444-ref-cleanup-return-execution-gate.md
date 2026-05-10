# Worker 444: Ref Cleanup-Return Execution Gate

## Goal Evidence

- Goal tool available: yes.
- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and before report writing.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: extend the private ref callback path
  so cleanup-return handles can be recorded and explicitly executed through a
  test-only gate with detach-before attach ordering evidence.

## Summary

Added a private cleanup-return execution gate on top of the existing ref
callback execution handoff.

On the Rust side, `HostRootCommitRecord` now carries a crate-private
`HostRootRefCleanupReturnExecutionGateSnapshot`. The snapshot is derived from
the existing DOM ref callback execution handoff, revalidates the same
commit/deletion instance tokens, records attach-side cleanup-return handle
recording gates, records detach-side cleanup-return execution gates, and
preserves changed-ref cleanup-before-attach evidence while keeping Rust
callback execution, object refs, public roots, root error routing, and React
DOM compatibility blocked.

On the React DOM private JS side, `ref-callback-gate.js` now exposes
`createRefCallbackCleanupReturnExecutionGateSnapshot`. It runs ordered private
metadata steps through the controlled invocation gate, records cleanup handles
from attach returns, explicitly consumes those handles on later detaches, and
proves cleanup-return execution happens before the changed-ref attach. The gate
uses fake host nodes and private component-tree latest-props updates only; it
does not use public roots or mutate browser DOM.

## Changed Files

- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/host_tokens.rs`
- `packages/react-dom/src/client/ref-callback-gate.js`
- `tests/conformance/test/dom-ref-callback-oracle.test.mjs`
- `worker-progress/worker-444-ref-cleanup-return-execution-gate.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and worker reports 174, 385, 398, 415, and 416.
- Confirmed worker 385 added Rust root-commit ref metadata and a private
  execution handoff without cleanup handle execution as a named gate.
- Confirmed worker 415 added the JS cleanup-return handle store keyed by the
  private `refHandle`, with one-shot handle consumption.
- Confirmed worker 416 routed ref callback attach/cleanup errors privately
  without invoking public root error callbacks.
- Confirmed current Rust root-commit ref metadata still uses commit/deletion
  instance tokens as the private validation boundary.
- Confirmed the new JS cleanup-return execution gate delegates to the existing
  controlled invocation path, so it does not duplicate callback invocation,
  fake-host-node creation, cleanup-handle validation, or error capture logic.

## Commands Run

```sh
create_goal
get_goal
rg --files
git status --short
sed inspections for required context, worker reports, source, and tests
node --check packages/react-dom/src/client/ref-callback-gate.js
node --check tests/conformance/test/dom-ref-callback-oracle.test.mjs
cargo fmt --all
cargo test -p fast-react-reconciler --all-features ref_cleanup_return_execution_gate
cargo test -p fast-react-reconciler --all-features root_commit_records_ref
cargo test -p fast-react-reconciler --all-features ref_callback_execution_handoff
node --test tests/conformance/test/dom-ref-callback-oracle.test.mjs
cargo test -p fast-react-reconciler --all-features root_commit
cargo fmt --all --check
npm run check --workspace @fast-react/react-dom
cargo test -p fast-react-reconciler --all-features host_tokens
git diff --check
ls/ps inspection for a transient git index lock
git add --intent-to-add worker-progress/worker-444-ref-cleanup-return-execution-gate.md
git diff --check
git reset -q HEAD -- worker-progress/worker-444-ref-cleanup-return-execution-gate.md
get_goal
```

## Verification Results

Passed:

```sh
node --check packages/react-dom/src/client/ref-callback-gate.js
node --check tests/conformance/test/dom-ref-callback-oracle.test.mjs
cargo test -p fast-react-reconciler --all-features ref_cleanup_return_execution_gate
cargo test -p fast-react-reconciler --all-features root_commit_records_ref
cargo test -p fast-react-reconciler --all-features ref_callback_execution_handoff
node --test tests/conformance/test/dom-ref-callback-oracle.test.mjs
cargo test -p fast-react-reconciler --all-features root_commit
cargo fmt --all --check
npm run check --workspace @fast-react/react-dom
cargo test -p fast-react-reconciler --all-features host_tokens
git diff --check
git add --intent-to-add worker-progress/worker-444-ref-cleanup-return-execution-gate.md
git diff --check
git reset -q HEAD -- worker-progress/worker-444-ref-cleanup-return-execution-gate.md
```

Focused results:

- `root_commit`: 39 tests passed.
- `host_tokens`: 7 tests passed.
- DOM ref callback conformance: 19 tests passed.
- React DOM workspace check: 53 package tests plus import-entrypoint smoke
  passed. npm printed the existing `minimum-release-age` warning.

## Quality, Maintainability, Performance, And Security Review

- Quality: Rust coverage now checks cleanup-return gate counts, token
  revalidation, and detach-before-attach evidence. JS coverage proves attach
  handles are recorded and then explicitly consumed on changed-ref and unmount
  cleanup detaches.
- Maintainability: the JS gate reuses the existing controlled invocation gate
  instead of creating a second callback execution implementation.
- Performance: the new gates are linear in already accepted metadata records
  and use existing Map/WeakMap cleanup-handle lookups.
- Security: public records still expose no ref values, cleanup functions, host
  nodes, latest props, or thrown values. Public roots remain untouched.

## Risks Or Blockers

- The Rust cleanup-return gate is metadata-only. Actual JS cleanup execution
  remains private and test-only.
- Object refs remain skipped/unmutated.
- Public React DOM ref compatibility remains blocked until public roots, DOM
  mutation, object refs, cleanup storage, and root error policy are all wired.

## Recommended Next Tasks

1. Connect future native/Rust root commit metadata to the JS cleanup-return
   execution gate using stable private ref handles.
2. Add public-root error scheduling only after commit-phase error capture is
   implemented outside this private diagnostic path.
3. Keep public React DOM ref compatibility blocked until object refs and public
   root mutation/ref ordering match React DOM oracles.

## Nested Agents

- Spawned two explorer subagents for Rust and JS ref cleanup context, but they
  did not return results before the implementation was complete. They were
  closed unused and did not affect conclusions.
