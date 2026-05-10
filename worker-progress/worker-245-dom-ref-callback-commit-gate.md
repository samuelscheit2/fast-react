# Worker 245: DOM Ref Callback Commit Gate

## Goal Evidence

- Goal tool available: yes.
- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` reported status `active`.
- Active objective from `get_goal`: add a fail-closed DOM ref callback commit
  gate that connects accepted ref attach/detach metadata to deterministic
  private gate records without invoking callback refs, mutating object refs,
  running layout effects, exposing public instances, or claiming React DOM ref
  compatibility.

## Summary

Added a reconciler-private DOM ref callback commit gate snapshot to
`HostRootCommitRecord`. The gate consumes the accepted worker 226 ref
attach/detach metadata and emits deterministic blocked records in the same
detach-before-attach order.

Each gate record preserves only opaque metadata already present in the private
ref commit record: root, fiber, state-node handle, ref handle, source token,
token scope, action, detach reason, and a deterministic sequence number. The
gate validates every source token with the existing phase-scoped host token
store, requires detach records to use deletion instance tokens, requires attach
records to use commit instance tokens, and rejects malformed metadata shapes.

The gate is data-only. It does not invoke callback refs, mutate object refs,
run layout effects, expose public instances, touch DOM/native/test-renderer
output, add JS package behavior, or claim React DOM ref compatibility.

## Changed Files

- `crates/fast-react-reconciler/src/root_commit.rs`
- `worker-progress/worker-245-dom-ref-callback-commit-gate.md`

No private JS conformance gate files were added.

## Evidence Gathered

- Read required project context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read worker context for workers 066, 174, 226, plus adjacent root commit
  reports for callback/passive/mutation handoff.
- Inspected the current `root_commit.rs` ref metadata path and DOM ref callback
  oracle tests under `tests/conformance/test` and `tests/conformance/src`.
- Confirmed worker 226 already records inert HostComponent attach/detach ref
  metadata with commit/deletion instance tokens; this worker layers a private
  DOM ref callback gate over that metadata rather than changing collection.
- Confirmed worker 174 made token metadata reads and invalidation phase/target
  scoped, so the gate can reuse `host_tokens().validate(...)` as the accepted
  lifecycle boundary.

## Implementation Notes

- Added `HostRootDomRefCallbackCommitGateSnapshot` and
  `HostRootDomRefCallbackCommitGateRecord` as crate-private data.
- Added blocked-only gate status and explicit blockers for callback invocation,
  object-ref mutation, layout effect execution, public instance exposure, and
  React DOM ref compatibility claims.
- Added `RootCommitError` variants for malformed private gate metadata while
  keeping public error payloads free of crate-private enum types.
- `commit_finished_host_root` now materializes ref metadata, validates it
  through the DOM ref callback gate, and stores both snapshots on the commit
  record.
- Focused tests assert deterministic attach, changed-ref detach/attach, and
  deleted-subtree detach gate rows; inert no-ref commits stay empty.
- Fail-closed tests cover stale source tokens and invalid attach metadata with
  a detach reason.

## Commands Run

```sh
create_goal
get_goal
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
rg -n 'Worker 0?66|Worker 174|Worker 226|ref|Ref|callback ref|DOM ref' MASTER_PROGRESS.md worker-progress tests/conformance crates/fast-react-reconciler crates/fast-react-core packages/react-dom -g '!node_modules' -g '!target'
sed -n '1,280p' crates/fast-react-reconciler/src/root_commit.rs
rg --files worker-progress tests/conformance/src tests/conformance/test crates/fast-react-reconciler/src | rg '(066|174|226|245|ref|root_commit|commit)'
git status --short
sed -n '281,760p' crates/fast-react-reconciler/src/root_commit.rs
sed -n '760,1320p' crates/fast-react-reconciler/src/root_commit.rs
sed -n '1320,2060p' crates/fast-react-reconciler/src/root_commit.rs
sed -n '2060,2800p' crates/fast-react-reconciler/src/root_commit.rs
sed -n '1,240p' worker-progress/worker-174-ref-token-lifecycle.md
sed -n '1,260p' worker-progress/worker-226-ref-attach-detach-commit-metadata.md
sed -n '1,220p' worker-progress/worker-066-dom-ref-callback-oracle.md
sed -n '1,260p' worker-progress/worker-205-root-commit-mutation-log-skeleton.md
sed -n '1,260p' worker-progress/worker-193-root-commit-callback-handoff.md
sed -n '1,220p' worker-progress/worker-139-passive-ref-refresh.md
sed -n '1,260p' tests/conformance/test/dom-ref-callback-oracle.test.mjs
sed -n '1,260p' tests/conformance/src/dom-ref-callback-targets.mjs
sed -n '1,260p' tests/conformance/src/dom-ref-callback-oracle.mjs
rg -n 'fail-closed|fail closed|blocked gate|gate|compatibilityClaimed|private gate|admission|claimed|claim' tests/conformance/src tests/conformance/test worker-progress crates/fast-react-reconciler/src packages/react-dom/src -g '!node_modules' -g '!target'
rg -n 'HostRootRefCommit|ref_commit_metadata|RefCommit|RefDetach|RefAttach|HostFiberTokenPhase::Commit|HostFiberTokenPhase::Deletion' crates/fast-react-reconciler/src tests/conformance/src tests/conformance/test packages/react-dom/src -g '!node_modules'
sed -n '1,220p' crates/fast-react-reconciler/src/host_tokens.rs
sed -n '220,360p' crates/fast-react-reconciler/src/host_tokens.rs
cargo fmt --all
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features root_commit
cargo test -p fast-react-reconciler --all-features
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
git diff --check
git diff -- crates/fast-react-reconciler/src/root_commit.rs
git status --short
```

I also opened the existing `.codex.log` for this worker while checking for
prior local notes; it was terminal capture noise and did not affect the
implementation.

## Verification Results

Passed:

```sh
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features root_commit
cargo test -p fast-react-reconciler --all-features
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
git diff --check
```

Focused root commit result: 20 matching tests passed.

Full reconciler result: 187 unit tests passed plus 1 compile-fail doctest.

Focused JS gate: not run because no JS gate files were added.

## Quality, Maintainability, Performance, And Security Review

- Quality: the gate is deterministic and covered for empty, attach, changed
  ref, deleted ref, stale-token, and malformed-metadata paths.
- Maintainability: the new gate is layered after existing ref metadata
  materialization, so future DOM commit workers can consume a private blocked
  record stream without changing metadata collection.
- Performance: the gate is linear in existing ref metadata length and only
  validates opaque token records; it does not traverse the fiber tree again.
- Security: no unsafe code, raw JS values, public instances, DOM nodes, native
  handles, callback invocation, object ref mutation, or host mutation paths
  were introduced.

## Risks Or Blockers

- This is not a real DOM ref implementation. Callback invocation, cleanup
  returns, object ref writes, public instance lookup, root error routing, and
  React DOM compatibility remain blocked.
- The snapshot is crate-private and currently consumed only by unit tests.
  Future DOM commit workers need an explicit private consumer before widening
  any API.
- Gate validation currently runs after ref token materialization in the
  existing HostRoot commit flow. The generated records are validated
  immediately, but broader commit atomicity remains owned by future commit
  sequencing work.

## Recommended Next Tasks

1. Add a private JS/ref value handle boundary that can distinguish callback
   refs from object refs without storing raw JS values in Rust arenas.
2. Add a renderer-specific public instance lookup boundary guarded by commit
   and deletion instance tokens before any callback attach/detach work.
3. Convert the React DOM ref callback oracle into a dual-run gate only after
   DOM root render, host mutation commit output, callback routing, and error
   handling exist.

## Nested Agents

- No nested agents or explorer subagents were used.
