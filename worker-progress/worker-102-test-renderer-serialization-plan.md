# worker-102-test-renderer-serialization-plan

## Objective

Produce a report-only plan for test-renderer `toJSON`, `toTree`, and
`TestInstance` serialization over committed fibers.

Write scope honored: this worker changes only
`worker-progress/worker-102-test-renderer-serialization-plan.md`. No source code
was implemented.

## Goal Tooling

- `create_goal` was available and was called before research, file reads,
  implementation planning, or verification for this objective:
  "Produce a report-only plan for test-renderer toJSON, toTree, and
  TestInstance serialization over committed fibers."
- `get_goal` was available immediately after goal setup and returned status
  `active` with that same objective.

## Summary

Fast React should implement test-renderer serialization as a read-only view over
the committed current fiber tree, with host storage consulted only for host
instance/text data. The root cause to avoid is treating
`TestRenderer::snapshot_container` as the public renderer output model. Host
snapshots are useful host-config tests, but they cannot represent composite
fibers, root wrapper behavior, `findCurrentFiber` freshness, Activity/hidden
subtrees, or `TestInstance` parent/children traversal.

The serializer should consume the root facade and reconciler inspection APIs
that root lifecycle workers provide. It should not implement `create`,
`update`, `unmount`, root scheduling, `flushSync`, or `act` flushing. Those stay
separate implementation slices. This worker's plan only covers the read side:
`to_json`, `to_tree`, `TestInstance` wrappers, traversal, query helpers, and the
typed error surface needed to map to React-compatible JS messages later.

## Evidence Gathered

Required reports read:

- `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- `worker-progress/worker-018-test-renderer-mutation-host.md`: current
  test-renderer storage is an in-memory mutation host with opaque handles,
  snapshots, hidden flags, text nodes, and direct mutation operations. It is
  not a reconciler.
- `worker-progress/worker-022-host-operation-errors.md`: invalid handles,
  missing targets, impossible mutations, and unsupported capabilities are
  structured host errors. Serialization should preserve those typed errors
  instead of panicking or stringifying them too early.
- `worker-progress/worker-073-test-renderer-update-model-plan.md`: root updates,
  lifecycle, scheduler integration, and `act` belong in shared reconciler
  semantics. Serialization and `TestInstance` querying are renderer-specific
  but fiber-aware.
- Sibling worker 085 report: the serialization oracle covers host JSON, text
  roots, null/false roots, array roots, Activity hidden output, composite
  `toTree`, and `TestInstance` find basics against exact
  `react-test-renderer@19.2.6` tarballs.
- No local `worker-progress/worker-101-*.md` report is present in this
  checkout. A sibling worker 101 report was inspected as external sequencing
  context, but local evidence and required read-gates do not depend on it.

Current source evidence:

- `fast-react-test-renderer` is currently host-only. It owns containers,
  instances, texts, snapshots, props, hidden flags, and direct host mutation
  operations, but it has no root facade, committed fiber handle, operation log,
  `toJSON`, `toTree`, or `TestInstance`.
- `fast-react-reconciler` is still a placeholder. It validates the mutation
  renderer boundary and preserves host operation errors, but it has no
  `FiberRoot`, HostRoot update queue, work loop, commit traversal, or read-only
  committed-fiber inspection API.
- `fast-react-host-config` already has `HostFiberToken` and
  `HostFiberTokenRef` plumbing. Source inspection shows
  `fast-react-test-renderer` still implements the older host-config method
  signatures and omits `HostTypes::HostFiberToken`. That is a prerequisite
  migration, not something this report-only worker can patch.
- Worker 082 says `root.current` must switch only after mutation and host reset
  and before layout. Serialization must read only after that switch, never from
  a render-in-progress or partially committed tree.
- Worker 081 keeps cross-root sync flushing and `act` queue routing in the
  reconciler root scheduler. Serialization can expose null/error behavior for
  current root state, but it must not flush work on its own.

React 19.2.6 behavior evidence from the exact `react-test-renderer@19.2.6`
development bundle and worker 085 oracle:

- `toJSON` walks committed test container host children. It returns `null` for
  hidden host nodes, returns strings for text instances, omits `children` from
  host JSON props, filters hidden children out of output, and brands host JSON
  objects with `Symbol.for("react.test.json")`.
- Root `toJSON` returns `null` when root/container/current is missing or the
  committed container has no children. Multiple visible root children return an
  array after hidden children are filtered.
- `toTree` starts from `root.current`, returns strings for text fibers, returns
  host nodes with `nodeType: "host"` and props including `children`, returns
  class/function/memo-like composite nodes with `nodeType: "component"`, and
  throws for unsupported tags such as the observed Activity tag.
- `ReactTestInstance` wraps fibers, not raw host handles. `.props` and
  `.children` resolve the current fiber through the slow path before reading;
  `.type`, `.instance`, and `.parent` read from the stored wrapper fiber,
  return link, or state node path.
- Hidden Activity traversal is mode-sensitive in the oracle evidence:
  development queries see hidden Activity host output even though `toJSON`
  omits it, while production probes observed only visible children.
- `find` and `findBy*` call `findAll` and then require exactly one result.
  Zero matches throw "No instances found ..."; multiple matches throw
  "Expected 1 but found N instances ...". The Rust layer should preserve a
  typed query error that the JS facade can format exactly.
- `.root` throws "Can't access .root on unmounted test renderer" when the
  wrapper is invalidated or the committed output has no children. `toJSON` and
  `toTree` return `null` for unmounted/null roots. Stale old wrapper access is
  not uniform: `.props` and `.children` can throw the unmounted-component
  current-fiber error, `.type` can remain readable, `.parent` can become
  `null`, and `.instance` may fail through a null state-node path.

## Root-Cause Design

### Serialization anchor

Add a reconciler read-only inspection boundary before public serialization:

- `CommittedRootView`: root id, lifecycle state, generation, current HostRoot
  fiber id, and root container handle.
- `CommittedFiberView`: fiber id, tag, element type, key if needed later,
  memoized props, state node/public instance handle, child/sibling/return
  links, hidden or offscreen visibility, and alternate/current validation.
- `CommittedHostChildView`: host component or text fiber plus the renderer host
  handle needed to read test-renderer data.

The inspection API must be immutable and phase-guarded. It should reject
render-in-progress fibers and stale wrappers instead of silently reading a work
in progress tree.

### JSON output

`to_json` should read the committed root state plus committed test container
host children, not raw snapshots or render-in-progress fibers:

- Empty, null, false, and unmounted roots return `Ok(TestJson::Null)`.
- A committed text root returns `TestJson::String`.
- A single visible host root child returns one host JSON object.
- Multiple visible root children return `TestJson::Array`.
- Hidden host nodes return `TestJson::Null` and are filtered from parent
  `children`.
- Host JSON props are cloned from the committed host props with `children`
  excluded. `toTree` and `TestInstance.props` must not use this filtered props
  object.
- Host JSON objects carry a Rust marker such as `TestJsonBrand::ReactTestJson`.
  The later JS facade should translate that marker into a non-enumerable
  `$$typeof` value of `Symbol.for("react.test.json")`.

### Tree output

`to_tree` should start at `root.current`:

- HostRoot and portal-like fibers return their children via the same
  children-to-tree flattening rule.
- Host component fibers return `TestTreeNode::Host` with `node_type`, type,
  unfiltered memoized props, `instance: None` for current test-renderer
  behavior, and rendered children.
- Host text fibers return strings.
- Function, class, memo, forward-ref, context, fragment, and other pass-through
  wrapper fibers should match React's observed branch behavior: either emit a
  component node or return flattened children.
- Activity/offscreen support should be explicit. The first implementation can
  return a typed unsupported-fiber-tag serialization error for Activity, matching
  the oracle's public `toTree` error, while still allowing `toJSON` hidden
  filtering and `TestInstance` traversal.

### TestInstance wrappers

`TestInstance` should store `root_id`, root generation, and `fiber_id`, not a
host snapshot. Accessors should mirror React's mixed freshness behavior rather
than blindly snapshotting host storage:

- `.type` returns the wrapper fiber type for host and composite fibers.
- `.props` resolves the current fiber and returns `memoizedProps`, including
  `children`.
- `.instance` asks the host renderer for the public instance for host fibers
  and returns state node data for component fibers when that model exists,
  preserving a typed stale-state-node failure for the JS facade when needed.
- `.parent` climbs return links until it finds a wrapper-valid fiber. For the
  HostRoot, it returns `null` when there is only one public child and returns a
  root wrapper for multi-child roots.
- `.children` resolves the current fiber, descends through non-wrapper fibers,
  wraps wrapper-valid fibers, and emits text children as strings.
- Hidden Activity/offscreen traversal should be versioned and mode-aware:
  development probes show hidden host children in `TestInstance` queries, while
  production probes currently show only visible output.
- Root generation and lifecycle checks should be available, but the public JS
  mapping must preserve React's mixed stale behavior: root access throws the
  unmounted-root message, `toJSON`/`toTree` return null, stale `.props` and
  `.children` can throw an unmounted-component current-fiber error, and `.type`
  may remain readable.

### Query helpers

Implement query helpers on top of `TestInstance.children`, not raw fiber scans:

- `find_all(predicate, options)` walks depth-first. The default is deep search.
  If the current node matches and `deep` is false, it returns that node without
  visiting its descendants.
- `find(predicate)` uses `find_all(predicate, { deep: false })` and requires
  exactly one result.
- `find_all_by_type`, `find_by_type`, `find_all_by_props`, and `find_by_props`
  should be thin typed wrappers around the same traversal.
- Query errors should carry `QueryKind`, expected count, actual count, and a
  display context. The JS layer can format exact React messages from that
  structured data.

## Separate Slices

Root lifecycle remains separate:

- `TestRendererRoot::create`, `update`, `unmount`, root invalidation, and
  `flush_sync` are worker 101/root API work. Serialization consumes root state
  and generation tokens but does not enqueue updates or clear containers.

Act flushing remains separate:

- Scheduler act queues, async act recursion, warning hooks, and flushSync
  priority scopes are worker 081/root scheduler and future test-renderer act
  integration work. Serialization can assume the caller has already flushed if
  deterministic output is required.

Error-surface and JS facade remain separate:

- Rust should expose typed errors first. Exact public JS `Error` messages,
  symbol branding, property descriptors, package exports, and deprecation
  warnings should be wired by the future `packages/react-test-renderer` facade
  against oracle files.

## Future Implementation Slices

### 1. Host token and test-renderer compile migration

Write scope:

- `crates/fast-react-test-renderer/src/lib.rs`
- optionally `crates/fast-react-test-renderer/src/fiber_token.rs`
- matching worker progress report

Task:

- Add `type HostFiberToken` to `TestRenderer`.
- Update `create_instance`, `create_text_instance`, `commit_mount`,
  `commit_update`, and `detach_deleted_instance` to accept
  `HostFiberTokenRef`.
- Store or validate token metadata only as far as needed for current host tests.

Focused Rust tests:

- creation calls accept creation-phase instance/text tokens;
- commit calls reject wrong phase or wrong target through
  `HostOperationErrorKind::InvalidFiberToken`;
- existing direct host mutation tests still pass;
- `cargo test -p fast-react-test-renderer --all-features` passes.

### 2. Reconciler committed-fiber inspection API

Write scope:

- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/inspection.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- matching worker progress report

Task:

- Expose immutable committed-root and current-fiber views after root model,
  update queues, work loop, and commit switching exist.
- Include generation and lifecycle checks for root-owned wrappers.
- Include enough tag, props, type, child/sibling/return, visibility, and state
  node data for test-renderer serialization without exposing mutable fibers.

Focused Rust tests:

- inspection returns the current tree only after `root.current` switches;
- work-in-progress and stale alternate fibers are rejected;
- HostRoot, host component, host text, function component, fragment, and
  Activity/offscreen fixture tags are distinguishable;
- unmounted roots and generation mismatches produce typed inspection errors.

### 3. Test-renderer JSON and tree serialization

Write scope:

- `crates/fast-react-test-renderer/src/serialization.rs`
- `crates/fast-react-test-renderer/src/error.rs`
- `crates/fast-react-test-renderer/src/root.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- matching worker progress report

Task:

- Add `TestJson`, `TestJsonObject`, `TestJsonBrand`, `TestTree`,
  `TestTreeNode`, and `TestSerializationError`.
- Implement `TestRendererRoot::to_json` and `to_tree` by using committed-fiber
  inspection and host data reads.

Focused Rust tests:

- host `to_json` returns type, filtered props, children, and brand marker;
- JSON props exclude `children`, while tree props still include `children`;
- text roots and text children serialize as strings;
- null, false, empty, and unmounted roots return null for JSON/tree methods;
- hidden host output is omitted from JSON but visible output remains;
- multiple visible root children serialize as arrays;
- function component `to_tree` returns a component node with rendered host
  subtree;
- Activity `to_tree` returns the typed unsupported-tag error until real support
  is implemented.

### 4. TestInstance wrapper and traversal

Write scope:

- `crates/fast-react-test-renderer/src/test_instance.rs`
- `crates/fast-react-test-renderer/src/error.rs`
- `crates/fast-react-test-renderer/src/root.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- matching worker progress report

Task:

- Add `TestInstance` wrappers over current fibers with root generation checks.
- Implement `type`, `props`, `instance`, `parent`, and `children` accessors.
- Add `.root` resolution on `TestRendererRoot`.

Focused Rust tests:

- single host root returns that host `TestInstance` from `.root`;
- text-only root returns a text value according to the Rust API shape chosen
  for text roots;
- null/false roots and unmounted roots return the unmounted-root error for
  `.root`;
- composite roots expose component props and host child traversal;
- development hidden Activity host children are returned by `children` and can
  be found by props, while production behavior remains visible-only until a
  later oracle update proves otherwise;
- stale wrappers preserve the mixed React behavior: `.props`/`.children` fail
  through current-fiber lookup, `.type` can remain readable, and `.parent` may
  become `null`.

### 5. TestInstance query helpers

Write scope:

- `crates/fast-react-test-renderer/src/test_instance.rs`
- `crates/fast-react-test-renderer/src/query.rs`
- `crates/fast-react-test-renderer/src/error.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- matching worker progress report

Task:

- Implement `find`, `find_all`, `find_by_type`, `find_all_by_type`,
  `find_by_props`, and `find_all_by_props` over `TestInstance` traversal.

Focused Rust tests:

- `find` returns the one matching component or host instance;
- zero-match `find` returns a typed no-match query error;
- multiple-match `find` returns a typed multiple-match query error with count;
- `find_all` preserves depth-first order;
- `find_all(..., deep: false)` stops at matched nodes but still searches
  descendants of non-matching nodes;
- `find_by_props` uses partial exact prop matching and reports multiple matches
  with the query props.

### 6. JS facade and conformance comparison

Write scope:

- `packages/react-test-renderer/**`
- `tests/conformance/src/react-test-renderer-*.mjs`
- `tests/conformance/scripts/*react-test-renderer*.mjs`
- `tests/conformance/test/react-test-renderer-*.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-test-renderer-*.json`
- matching worker progress report

Task:

- Map Rust serialization data and errors into the public JS
  `react-test-renderer` facade.
- Use worker 083/084/085/086/087 oracle coverage before claiming
  compatibility.

Focused tests:

- JS host JSON objects have non-enumerable `$$typeof` with
  `Symbol.for("react.test.json")`;
- public `.root`, `find*`, `toJSON`, and `toTree` messages match oracle
  fixtures;
- local Fast React comparison remains explicit and compatibility remains false
  until the full stack passes the oracle.

## Risks Or Blockers

- The current test-renderer crate does not compile against the token-aware
  host-config trait signatures. Serialization work should not start until that
  migration lands or it will stack new code on a broken host boundary.
- The reconciler lacks the required root and committed-fiber model. A
  serializer implemented now would have to invent fake fibers or rely on host
  snapshots, which would patch symptoms rather than model React's public API.
- Activity/offscreen semantics need care: `toJSON` hides hidden host output,
  development `TestInstance` traversal sees hidden host instances, production
  traversal currently sees only visible children, and `toTree` reports an
  unsupported Activity tag in the oracle.
- Exact JS messages and object descriptors belong in the JS facade; Rust should
  preserve structured data so that later mapping is deterministic.
- Native callback/root lifetime policy from worker 096 applies once
  `createNodeMock`, refs, or JS predicates cross the Rust boundary.

## Recommended Next Tasks

1. Land the host-token migration for `fast-react-test-renderer` so the existing
   crate compiles again.
2. Merge reconciler prerequisites: root lane bookkeeping, `FiberRoot`, HostRoot
   update queues, root scheduler/act routing, and commit ordering with
   `root.current` switch timing.
3. Add the read-only committed-fiber inspection API before implementing public
   serialization.
4. Implement `to_json`/`to_tree` first, then `TestInstance` traversal and query
   helpers as separate test-renderer slices.
5. Wire the JS facade only after Rust serialization passes focused tests and
   the oracle-backed package surface exists.

## Delegated Checks

Nested read-only agents were launched to test the plan:

- Source-boundary check: inspect current Rust crates and reports to test
  whether serialization must read committed fibers instead of raw host
  snapshots.
- React behavior check: inspect worker 085/oracle and upstream
  `react-test-renderer@19.2.6` behavior for JSON, tree, `TestInstance`, query,
  and unmounted-root semantics.

Source-boundary check returned:

- Evidence: `fast-react-test-renderer` explicitly documents itself as an
  in-memory mutation host, not a reconciler. Its public read helpers are
  `snapshot_container`, `snapshot_instance`, and `snapshot_text` over
  renderer-owned arenas, so those snapshots can only describe committed host
  handles and hidden/detached host flags.
- Evidence: `fast-react-reconciler` is still a placeholder: it validates the
  mutation renderer boundary and then returns `Reconciler.render.mutation`
  unimplemented. There is no local `FiberRoot`, root update queue, work loop,
  commit traversal, `root.current`, or committed-fiber inspection API for a
  serializer to consume yet.
- Evidence: worker 073 independently reaches the same boundary: public test
  renderer serialization and wrapper APIs are renderer-specific, but they must
  sit over the current fiber tree; raw host snapshots cannot represent
  composites, wrappers, Suspense/Activity/offscreen behavior, current-fiber
  freshness, or `TestInstance` parent/children traversal.
- Blocker: the current test-renderer implementation is stale against the
  token-aware host-config trait surface. `HostTypes` now requires
  `HostFiberToken`, and `create_instance`, `create_text_instance`,
  `commit_mount`, `commit_update`, and `detach_deleted_instance` receive
  `HostFiberTokenRef`, while the test renderer still implements the older
  signatures.
- Prerequisite: add the committed-fiber inspection boundary only after root
  model, HostRoot update queue, work loop, and commit switching exist. A
  serializer implemented before then would either fake fibers or wrongly
  promote host snapshots into the public API model.
- Correction: no local worker 101 progress report is present. Keep references
  to worker 101 out of the local evidence list, or label them as external
  sibling evidence rather than worktree evidence.

React behavior check returned:

- The report's broad conclusions match exact React 19.2.6 tarball behavior and
  worker 085's oracle for JSON host output, text/null roots, props excluding
  `children`, composite `toTree`, query errors, branding, and `.root`
  unmounted behavior.
- Correction folded in: root `toJSON` walks committed host container children;
  `toTree` starts from `root.current`; `TestInstance` wraps fibers.
- Correction folded in: hidden Activity traversal is mode-sensitive, with
  development queries seeing hidden host children and production probes seeing
  only visible children.
- Correction folded in: stale `ReactTestInstance` access is mixed rather than
  one uniform stale-generation error.
- One nested source-boundary agent unexpectedly edited the scoped report while
  performing a read-only check. The edit touched only this worker's report file,
  and its findings were audited and retained or corrected here.

## Commands Run

Read-only context and source commands included:

```sh
git status --short
create_goal for the worker objective
get_goal for active status/objective
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-018-test-renderer-mutation-host.md
sed -n '1,260p' worker-progress/worker-022-host-operation-errors.md
sed -n '1,320p' worker-progress/worker-073-test-renderer-update-model-plan.md
rg --files worker-progress
sed -n '1,360p' sibling worker 085 progress report
sed -n '1,760p' sibling worker 101 progress report
rg --files crates/fast-react-test-renderer crates/fast-react-reconciler crates/fast-react-host-config crates/fast-react-core
sed -n '1,1040p' crates/fast-react-test-renderer/src/lib.rs
sed -n '1,240p' crates/fast-react-reconciler/src/lib.rs
sed -n '560,980p' crates/fast-react-host-config/src/lib.rs
sed -n '1,220p' crates/fast-react-core/src/element.rs
source-inspection check for token-aware host-config/test-renderer mismatch
cargo test -p fast-react-test-renderer --all-features
curl -fsSL https://registry.npmjs.org/react-test-renderer/-/react-test-renderer-19.2.6.tgz | tar -xOzf - package/cjs/react-test-renderer.development.js | nl -ba | sed -n '14985,15165p'
curl -fsSL https://registry.npmjs.org/react-test-renderer/-/react-test-renderer-19.2.6.tgz | tar -xOzf - package/cjs/react-test-renderer.development.js | nl -ba | sed -n '17180,17515p'
```

The focused cargo command failed as expected for the current checkout because
`fast-react-test-renderer` is stale against token-aware host-config traits:
`HostTypes::HostFiberToken` is missing, and lifecycle methods still use the old
signatures without `HostFiberTokenRef`.

Final scoped verification after the report edits:

- Local path leak scan over this report: passed.
- Trailing-whitespace scan over this report: passed.
- `git diff --check`: passed.
- `git status --short --untracked-files=all`: only the regenerable root
  `Cargo.lock` and this worker report are untracked.

## Completion Audit

- Report-only deliverable: satisfied by the single changed report file listed
  below; no source code was modified.
- Required reads: satisfied for `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, workers 018, 022, and 073. Local workers 085 and 101
  are absent; sibling reports were inspected as external context where
  available.
- Required behavior coverage: satisfied in the Evidence, Root-Cause Design, and
  Future Implementation Slices sections for JSON host output, text nodes,
  hidden/null output, props excluding `children`, composite `toTree`,
  `TestInstance` traversal, `find`/`findAll` errors, and unmounted root
  behavior.
- Separation requirements: satisfied by keeping root lifecycle and act flushing
  in separate slices.
- Future implementation guidance: satisfied by explicit future write scopes and
  focused Rust tests for host-token migration, committed-fiber inspection,
  serialization, `TestInstance`, query helpers, and the JS facade.
- Verification gates: scoped path-leak, trailing-whitespace, and `git diff
  --check` gates passed. Because the report is untracked, the report itself was
  covered by the separate path and whitespace scans.

## Changed Files

- `worker-progress/worker-102-test-renderer-serialization-plan.md`

## Verification Checklist

- [x] Called `create_goal` before research and file reads.
- [x] Read required files and sibling dependency reports when present.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Kept this worker report-only.
- [x] Covered JSON host output, text nodes, hidden/null output, props excluding
      children, composite `toTree`, `TestInstance` traversal, find/findAll
      errors, and unmounted root behavior.
- [x] Kept root lifecycle and act flushing as separate implementation slices.
- [x] Included future write scopes and focused Rust tests.
- [x] Folded in returned source-boundary nested-agent findings.
- [x] Folded in returned React behavior nested-agent findings.
- [x] Ran scoped no-local-path-leak check.
- [x] Ran trailing-whitespace check.
- [x] Ran `git diff --check`.
