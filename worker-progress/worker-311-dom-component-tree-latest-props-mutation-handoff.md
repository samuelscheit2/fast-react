# Worker 311: DOM Component Tree Latest Props Mutation Handoff

## Goal

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: "Wire the private DOM mutation adapter
  to the component-tree latest-props map through a data-only commit handoff.
  Prove ordinary admitted property payloads update latest props only after
  successful mutation records."

## Summary

Added a private data-only latest-props handoff from the DOM property mutation
adapter to the component-tree latest-props map.

The mutation adapter now has a latest-props-specific property payload path that
prevalidates ordinary set/remove attribute, set/remove property, and non-payload
records; applies only ordinary mutation records; and creates an opaque handoff
only after those fake-DOM mutations succeed. The handoff exposes metadata only,
with hidden WeakMap payloads carrying mutation records and the existing
latest-props commit record.

The component-tree helper now consumes single or batched mutation handoffs and
publishes latest props only after validating every handoff and every attached
host node. Unsupported style, dangerous HTML, controlled form, form action,
resource-host, malformed, and throwing mutation paths do not update latest
props.

No public React DOM root behavior, event dispatch, hydration, refs, controlled
form behavior, resource handling, or compatibility claim was changed.

## Changed Files

- `packages/react-dom/src/client/component-tree.js`
- `packages/react-dom/src/dom-host/mutation.js`
- `tests/smoke/react-dom-component-tree-map-shell.mjs`
- `tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `tests/conformance/test/dom-property-payload-helper.test.mjs`
- `worker-progress/worker-311-dom-component-tree-latest-props-mutation-handoff.md`

## Evidence Gathered

- Read required project context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`; did not read `ORCHESTRATOR.md`.
- Read required worker reports for workers 168, 259, 271, 272, and 274.
- Inspected scoped component-tree, mutation adapter, mutation smoke, component
  tree smoke, and property payload conformance tests.
- Checked the React 19.2.6 reference source for `commitUpdate` ordering:
  `updateProperties` runs before `updateFiberProps`, matching this private
  "mutate first, then publish latest props" handoff.
- No nested agents were spawned.

## Commands Run

- Tool actions: `create_goal`, then `get_goal`; final pre-report `get_goal`.
- Context/research: `sed -n`, `rg --files`, `rg`, `git status --short`, and
  `git diff` over the required docs, worker reports, source, tests, and React
  reference files.
- Syntax checks:
  - `node --check packages/react-dom/src/client/component-tree.js`
  - `node --check packages/react-dom/src/dom-host/mutation.js`
  - `node --check tests/smoke/react-dom-component-tree-map-shell.mjs`
  - `node --check tests/smoke/react-dom-mutation-adapter-shell.mjs`
  - `node --check tests/conformance/test/dom-property-payload-helper.test.mjs`
- Focused tests:
  - `node tests/smoke/react-dom-component-tree-map-shell.mjs`
  - `node tests/smoke/react-dom-mutation-adapter-shell.mjs`
  - `node --test tests/conformance/test/dom-property-payload-helper.test.mjs`
- Full JS gate:
  - `npm run check:js`
- Hygiene:
  - `git add --intent-to-add worker-progress/worker-311-dom-component-tree-latest-props-mutation-handoff.md && git diff --check`
  - `git reset -- worker-progress/worker-311-dom-component-tree-latest-props-mutation-handoff.md`

## Verification

- `node --check` passed for all touched JS/MJS files.
- Component-tree smoke passed:
  `React DOM private component tree map shell smoke checks passed.`
- Mutation adapter smoke passed:
  `React DOM private mutation adapter shell smoke checks passed.`
- Focused property payload conformance passed with 21 tests.
- `npm run check:js` passed, including package-surface guard, import smoke,
  benchmark checks, workspace package checks, native loader checks, and 562
  conformance tests. npm printed the existing `minimum-release-age` warnings.
- `git diff --check` passed with the new worker progress report included via
  intent-to-add.

## Risks Or Blockers

- This is still private fake-DOM infrastructure. It is not wired to public
  roots, real browser DOM commit traversal, event dispatch, hydration replay,
  controlled form wrappers, resource handling, or refs.
- The latest-props handoff intentionally rejects style and dangerous HTML even
  though the broader admitted mutation adapter can apply those records. Those
  paths need their own safe publication boundary before latest props can be
  updated from them.
- A fake-DOM mutator can still partially mutate the fake node before throwing;
  this handoff guarantees no latest-props publication record is created after
  that failure, not rollback of already-started fake DOM effects.

## Recommended Next Tasks

1. Wire future DOM HostComponent commit traversal to create these handoffs only
   after ordered payload mutation succeeds.
2. Add a separate safe publication boundary for style and
   `dangerouslySetInnerHTML` after their mutation semantics are proven.
3. Keep controlled forms, form actions, document resources, hydration, events,
   refs, and public roots behind their existing dedicated gates.
