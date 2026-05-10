# Worker 313: DOM Ref Callback Private Attach/Detach Gate

## Goal Evidence

- Goal tool available: yes.
- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` reported status `active`.
- Active objective from `get_goal`: "Add a private DOM ref callback
  attach/detach gate that uses component-tree host node records and root commit
  ref metadata to produce deterministic callback/object-ref records without
  invoking user refs."

## Summary

Added a private React DOM ref attach/detach gate on top of the existing ref
metadata and component-tree validation boundary.

`component-tree.js` now exposes private mounted host-instance node records with
raw DOM nodes and latest props kept in WeakMap payloads. The records expose only
private metadata such as token, owner identities, node type, latest-props/ref
presence, and no-host-node/no-latest-props exposure flags.

`ref-callback-gate.js` now accepts root-commit-shaped ref metadata snapshots,
validates them through the component-tree host node records, and emits
deterministic attach/detach records that classify callback refs separately from
object refs. The records preserve detach-before-attach ordering metadata and
mark root error propagation as blocked. The gate remains data-only: it does not
call callback refs, mutate object refs, run layout effects, mutate DOM output,
touch public roots, or claim React DOM ref compatibility.

## Changed Files

- `packages/react-dom/src/client/component-tree.js`
- `packages/react-dom/src/client/ref-callback-gate.js`
- `tests/smoke/react-dom-component-tree-map-shell.mjs`
- `tests/conformance/test/dom-ref-callback-oracle.test.mjs`
- `worker-progress/worker-313-dom-ref-callback-private-attach-detach-gate.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 174, 245, and 273.
- Inspected worker 226 root commit ref metadata context and focused
  `root_commit.rs` tests for attach metadata, changed-ref detach-before-attach
  metadata, deleted-subtree parent-before-child detach metadata, token
  revalidation, and malformed metadata rejection.
- Inspected the React 19.2.6 reference commit ref attach/detach code paths for
  callback refs, object refs, cleanup returns, and root error routing.
- Confirmed the existing DOM ref callback oracle remains non-compatibility
  evidence; the new test only adds a private blocked-gate assertion.

## Verification

Passed:

```sh
node --check packages/react-dom/src/client/ref-callback-gate.js
node --check packages/react-dom/src/client/component-tree.js
node --check tests/smoke/react-dom-component-tree-map-shell.mjs
node --check tests/conformance/test/dom-ref-callback-oracle.test.mjs
node tests/smoke/react-dom-component-tree-map-shell.mjs
node --test tests/conformance/test/dom-ref-callback-oracle.test.mjs
npm run check:js
git diff --check
```

Focused DOM ref callback oracle result: 13 tests passed.

`npm run check:js` passed, including package surface, import smoke, benchmark
checks, workspace checks, native loader checks, and 560 conformance tests. npm
printed the existing `minimum-release-age` config warnings.

## Risks Or Blockers

- No public root commit integration was added. The JS gate still consumes
  private JS-shaped metadata records, not live Rust commit output.
- Real callback invocation, callback cleanup-return handling, object ref
  writes, public instance lookup, and root error callback reporting remain
  blocked.
- Component-tree host node records intentionally keep raw nodes/latest props in
  WeakMap payloads for private callers. A future native/Rust bridge still needs
  explicit handle mapping before real commit records feed this gate.

## Recommended Next Tasks

1. Add a private Rust-to-JS/root-commit metadata bridge that maps
   `HostRootRefCommitRecord` and DOM host-instance tokens into this gate.
2. Add a ref value/cleanup handle store before admitting callback cleanup
   returns or object ref writes.
3. Keep root error reporting and public root integration behind separate
   conformance gates.

## Nested Agents

- No nested agents or explorer subagents were used.
