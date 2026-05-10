# Worker 393 - Test Renderer Update/Unmount JS Private Routing

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: extend the react-test-renderer JS
  facade routing gate so private update and unmount requests can consume
  accepted Rust lifecycle diagnostics without changing public
  create/update/unmount behavior.

## Summary

Extended the private react-test-renderer JS routing gate for update/unmount
request diagnostics.

The hidden private root request bridge now records accepted Rust lifecycle
diagnostic metadata for update and unmount requests and exposes symbol-hidden
helpers to validate/consume accepted `TestRendererRootLifecycle`,
`TestRendererRootUpdateKind`, `TestRendererRootUpdateOutcome`, and
`TestRendererRootScheduledUpdate` shaped diagnostics. The gate accepts the
scheduled update path, idempotent unmount, and update-after-unmount outcomes
while preserving record-only behavior.

Public behavior is unchanged: `create`, `create().update`, and
`create().unmount` still expose the same public package keys and still throw
the placeholder `FastReactTestRendererUnimplementedError`. No native bridge,
Rust execution, reconciler execution, host-output production, or public root
lifecycle compatibility claim was added.

## Changed Files

- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-393-test-renderer-update-unmount-js-private-routing.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read requested prior worker reports present in this checkout: 307, 363, 364,
  and 366.
- Worker reports 391 and 392 were requested but not present in this checkout.
- Inspected Rust lifecycle diagnostics in `crates/fast-react-test-renderer`,
  including `TestRendererRootLifecycle`, `TestRendererRootUpdateKind`,
  `TestRendererRootUpdateOutcome`, `TestRendererRootScheduledUpdate`,
  `TestRendererRoot::update`, `TestRendererRoot::unmount`,
  `root_unmount_is_idempotent`, and
  `root_update_after_unmount_does_not_mutate_or_reschedule`.
- Confirmed package-surface constraints guard against new public private
  diagnostic exports.

## Commands Run

```sh
node --check packages/react-test-renderer/index.js
node --check packages/react-test-renderer/cjs/react-test-renderer.development.js
node --check packages/react-test-renderer/cjs/react-test-renderer.production.js
node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
npm run test:react-test-renderer:serialization --workspace @fast-react/conformance
npm run check --workspace @fast-react/react-test-renderer
npm run check:package-surface
git diff --check
```

Additional inspection used `rg`, `sed`, `diff`, `wc`, `git status --short`,
`git diff --stat`, and `npm pkg get scripts --workspace
@fast-react/conformance`.

## Verification Results

- JS syntax checks passed for all touched JS/MJS files.
- Focused create/routing gate passed: 10 tests.
- Focused serialization local gate passed: 7 tests.
- React-test-renderer serialization workspace test passed: 18 tests.
- `npm run check --workspace @fast-react/react-test-renderer`: passed.
- `npm run check:package-surface`: passed.
- `git diff --check`: passed after adding this report with `git add -N`.
- NPM printed the existing `minimum-release-age` config warning during npm
  commands; it did not affect results.

## Risks Or Blockers

- No blocker remains for this worker objective.
- The lifecycle diagnostic consumption is private and record-only. It validates
  accepted Rust-shaped lifecycle diagnostics but does not call native/Rust code
  or execute reconciler updates.
- The hidden bridge methods are reachable only through the existing private
  symbol on `create`; no new public package keys or subpaths were added.

## Recommended Next Tasks

1. Replace record-only diagnostic consumption with a real native/Rust handoff
   only after the bridge can execute root work without changing public
   behavior.
2. Keep public root lifecycle compatibility blocked until create, update,
   unmount, serialization, TestInstance, and act behavior are dual-run against
   React 19.2.6.
3. Refresh the routing gate if worker 391 or 392 land additional public
   toJSON/toTree private facade metadata in a later merge.

## Nested Agents

- Spawned one read-only explorer to inspect the routing gate shape. It did not
  return a usable result before implementation and verification completed, so
  it was closed and did not affect conclusions.
