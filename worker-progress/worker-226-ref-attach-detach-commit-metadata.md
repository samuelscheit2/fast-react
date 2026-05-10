# Worker 226: Ref Attach/Detach Commit Metadata

## Goal Evidence

- Goal tool available: yes.
- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` reported status `active`.
- Active objective from `get_goal`: add deterministic, data-only ref
  attach/detach metadata to the private commit path using accepted host token
  lifecycle primitives, without calling JS refs, exposing public instances,
  mutating DOM/native output, running layout effects, or changing public
  renderer behavior.

## Summary

Added a private HostRoot commit ref metadata snapshot in
`root_commit.rs`. Successful HostRoot commits now collect inert ref detach and
attach records from the finished tree, then issue phase-scoped host tokens for
those records:

- ref attach metadata uses commit-phase instance tokens
- changed-ref and deleted-subtree detach metadata uses deletion-phase instance
  tokens
- records include only root, fiber, opaque state-node handle, opaque ref
  handle, token id, token phase/target, action, and detach reason

The implementation does not call JS refs, mutate object refs, resolve public
instances, run layout effects, call host operations, mutate DOM/native output,
or change public renderer behavior.

## Changed Files

- `crates/fast-react-reconciler/src/root_commit.rs`
- `worker-progress/worker-226-ref-attach-detach-commit-metadata.md`

## Evidence Gathered

- Read required project context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read required worker reports: 066, 139, 174, 187, 193, and 197.
- Inspected `root_commit.rs`, `host_tokens.rs`, `host_nodes.rs`,
  `fiber.rs`, `fiber_handles.rs`, `fiber_flags.rs`, `fiber_deletions.rs`,
  `fiber_store.rs`, `fiber_root.rs`, and related topology/work-loop helpers.
- Checked React 19.2.6 local source for ref commit sequencing: deletion refs
  detach in mutation traversal, changed refs detach during mutation, and host
  refs attach during layout after current switch.

## Implementation Notes

- Ref metadata collection runs after existing HostRoot commit validation and
  before current switching, so missing host state nodes fail before root commit
  state is mutated.
- Detach metadata traversal processes parent-owned deletion lists before child
  mutation traversal and records deleted HostComponent refs parent before
  child.
- Attach metadata traversal follows layout ordering: children before the
  HostComponent's own ref attach record.
- Token materialization validates every issued token against root, fiber,
  phase, and instance target. The token store remains the accepted lifecycle
  boundary.
- The metadata accessor is crate-private; no JS/public renderer surface was
  widened.

## Tests Added Or Updated

- Existing no-ref commit tests now assert the ref metadata snapshot is empty.
- Added attach metadata coverage with commit-phase instance token validation.
- Added changed-ref coverage showing old ref detach data and new ref attach
  data.
- Added deleted-subtree coverage showing parent-before-child detach metadata
  with deletion-phase instance tokens.
- Added fail-closed coverage for HostComponent ref metadata without a state
  node, proving current is not switched and no ref tokens are issued.

## Commands Run

```sh
cargo fmt --all
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features root_commit
cargo test -p fast-react-reconciler --all-features host_tokens
cargo test -p fast-react-reconciler --all-features
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
git diff --check
```

Inspection commands included focused `sed`, `rg`, `git status`, and `git diff`
reads for the required docs, worker reports, reconciler source files, and the
React 19.2.6 reference commit/ref lifecycle code.

## Verification Results

- `cargo fmt --all --check`: passed
- `cargo test -p fast-react-reconciler --all-features root_commit`: passed, 13
  matching tests
- `cargo test -p fast-react-reconciler --all-features host_tokens`: passed, 7
  matching tests
- `cargo test -p fast-react-reconciler --all-features`: passed, 155 unit tests
  plus 1 compile-fail doctest
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`:
  passed
- `git diff --check`: passed

## Quality, Maintainability, Performance, And Security Review

- Quality: metadata is deterministic and data-only, with focused tests for
  empty, attach, changed-ref detach, deleted-ref detach, and fail-closed
  missing-host-node cases.
- Maintainability: the new ref snapshot mirrors the existing callback/passive
  handoff style and stays scoped to `root_commit.rs`.
- Performance: traversal is flag-gated for normal changed-ref attach/detach
  paths and only records HostComponent refs; no host values are cloned or
  resolved.
- Security: no unsafe code, raw JS values, DOM nodes, native handles, public
  instances, callback invocation, or host mutation paths were introduced.

## Risks Or Blockers

- This is not a real ref implementation. Callback refs, cleanup returns,
  object ref mutation, public instance lookup, and root error callback routing
  remain blocked on future JS/value handle boundaries.
- The metadata is crate-private and currently consumed only by unit tests.
  Future commit/layout workers can widen internal consumption once they have a
  concrete private caller.
- HostText and class/component refs are intentionally not represented because
  this slice uses only instance-token HostComponent metadata.

## Recommended Next Tasks

1. Add a private ref store or callback/value handle boundary before any real JS
   callback ref or object ref mutation work.
2. Wire future mutation/layout commit slices to consume this metadata without
   exposing renderer public instances.
3. Keep DOM component-tree maps and test-renderer public serialization separate
   until host mutation commit output exists.

## Nested Agents

- No nested agents or explorer subagents were used.
