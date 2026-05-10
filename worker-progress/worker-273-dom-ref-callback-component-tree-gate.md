# Worker 273: DOM Ref Callback Component Tree Gate

## Goal Evidence

- Goal tool available: yes.
- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available immediately after setup.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: "Add a private DOM ref
  callback component-tree gate that validates accepted ref attach/detach
  metadata against component-tree mounted/latest-props maps without invoking
  callback refs, object refs, layout effects, DOM mutation, public roots, or
  compatibility claims."

## Summary

Added a private React DOM ref callback component-tree gate in
`packages/react-dom/src/client/ref-callback-gate.js`.

The gate accepts only branded private ref attach/detach metadata records,
validates them against the private component-tree mounted host-token map and
latest-props map, and returns deterministic blocked gate snapshots/records.
Validation checks action ordering, commit/deletion instance token scope,
mounted host instance token state, root/host owner agreement, latest-props
presence, and latest `ref` identity.

The public gate records expose only metadata such as action, token phase,
status, and blocked capabilities. Raw host nodes, latest props, callback refs,
object refs, and component-tree tokens stay in WeakMap payloads for private
callers. The gate does not invoke callback refs, mutate object refs, run layout
effects, mutate DOM output, touch public roots, or claim React DOM ref
compatibility.

## Changed Files

- `packages/react-dom/src/client/ref-callback-gate.js`
- `tests/smoke/react-dom-component-tree-map-shell.mjs`
- `worker-progress/worker-273-dom-ref-callback-component-tree-gate.md`

`packages/react-dom/src/client/component-tree.js` was inspected and reused
unchanged; the existing private mounted-token and latest-props helpers were
sufficient for this slice.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read required worker reports 168, 214, 226, 245, and 259.
- Also read ref lifecycle context from workers 066, 139, and 174.
- Inspected `packages/react-dom/src/client/component-tree.js`,
  `packages/react-dom/src/dom-host/mutation.js`, related private gate modules,
  and the DOM ref callback oracle tests.
- Inspected the accepted Rust ref metadata and DOM ref callback commit gate in
  `crates/fast-react-reconciler/src/root_commit.rs` to mirror detach-before-
  attach ordering, commit/deletion token phases, blocked status, and no
  behaviorful ref execution.

## Commands Run

```sh
create_goal
get_goal
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,220p' worker-progress/worker-168-*
sed -n '1,220p' worker-progress/worker-214-*
sed -n '1,220p' worker-progress/worker-226-*
sed -n '1,220p' worker-progress/worker-245-*
sed -n '1,240p' worker-progress/worker-259-*
sed -n / rg inspections for component-tree, mutation, ref callback oracle, and root_commit refs
node --check packages/react-dom/src/client/ref-callback-gate.js
node --check packages/react-dom/src/client/component-tree.js
node --check tests/smoke/react-dom-component-tree-map-shell.mjs
node --check tests/conformance/test/dom-ref-callback-oracle.test.mjs
node tests/smoke/react-dom-component-tree-map-shell.mjs
node --test tests/conformance/test/dom-ref-callback-oracle.test.mjs
npm run check:js
git diff --check
```

## Verification

- `node --check packages/react-dom/src/client/ref-callback-gate.js` passed.
- `node --check packages/react-dom/src/client/component-tree.js` passed.
- `node --check tests/smoke/react-dom-component-tree-map-shell.mjs` passed.
- `node tests/smoke/react-dom-component-tree-map-shell.mjs` passed:
  `React DOM private component tree map shell smoke checks passed.`
- `node --check tests/conformance/test/dom-ref-callback-oracle.test.mjs`
  passed.
- `node --test tests/conformance/test/dom-ref-callback-oracle.test.mjs`
  passed: 12 tests, 0 failures.
- `npm run check:js` passed, including package-surface guard, import smoke,
  benchmark checks, workspace package checks, native loader checks, and 539
  conformance tests. npm printed the existing `minimum-release-age` config
  warnings.
- `git diff --check` passed.

## Risks Or Blockers

- This is still a private, blocked gate. It does not implement callback ref
  invocation, cleanup return handling, object ref writes, layout effect
  execution, public instance lookup, DOM mutation integration, or React DOM ref
  compatibility.
- The JS gate models the accepted metadata boundary with private branded
  records and a component-tree host token; a future native/Rust bridge still
  needs an explicit handle mapping before real commit records can feed this
  module.
- Latest-props validation intentionally requires a current `ref` field. Future
  clearing-ref scenarios should be admitted explicitly once the DOM commit
  adapter publishes that shape.

## Recommended Next Tasks

1. Add a private bridge from Rust ref commit/gate metadata to DOM component-tree
   host tokens before any public root or renderer execution path consumes this
   gate.
2. Add a ref value/cleanup handle store that can distinguish callback refs,
   object refs, and cleanup returns without storing raw JS values in Rust.
3. Keep real callback invocation, object ref mutation, layout effect ordering,
   public instance lookup, and compatibility claims behind separate
   conformance gates.

## Nested Agents

- No nested agents or explorer subagents were used.
