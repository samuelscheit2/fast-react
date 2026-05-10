# Worker 369: React DOM Root Private Unmount Host Output

Date: 2026-05-10

## Goal State

- First action: `create_goal` was called before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: add private React DOM root bridge
  unmount host-output cleanup that clears fake-DOM children, detaches
  component-tree metadata, and reverts root marker/listener side effects
  deterministically.

## Summary

Added a private React DOM root bridge unmount host-output cleanup path. The new
cleanup record validates an admitted create/render path and a non-no-op
`root.unmount` request for the same private root, clears the fake-DOM container
through a new mutation cleanup record, detaches component-tree metadata from
the removed fake-DOM subtrees, and reuses the existing root marker/listener
side-effect reverter.

The path is idempotent per unmount request and keeps public unmount behavior,
native/Rust execution, reconciler deletion traversal, browser DOM
compatibility, events, hydration, refs, and passive effects explicitly
unclaimed.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/src/client/component-tree.js`
- `packages/react-dom/src/dom-host/mutation.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/smoke/react-dom-component-tree-map-shell.mjs`
- `tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `worker-progress/worker-369-react-dom-root-private-unmount-host-output.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read required reports present in this checkout: workers 168, 325, 338, 342,
  and 352.
- Worker reports 367 and 368 were not present; their task prompts were read
  instead.
- Inspected current private root bridge, component-tree, mutation adapter,
  private root bridge tests, component-tree smoke tests, and mutation smoke
  tests.
- Confirmed current public `react-dom/client` root placeholders remain inert in
  the focused package test.
- No nested agents or explorers were used.

## Commands Run

```sh
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/src/client/component-tree.js
node --check packages/react-dom/src/dom-host/mutation.js
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --check tests/smoke/react-dom-component-tree-map-shell.mjs
node --check tests/smoke/react-dom-mutation-adapter-shell.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node tests/smoke/react-dom-component-tree-map-shell.mjs
node tests/smoke/react-dom-mutation-adapter-shell.mjs
npm run check --workspace @fast-react/react-dom
git add --intent-to-add worker-progress/worker-369-react-dom-root-private-unmount-host-output.md
git diff --check
```

## Verification

- JS syntax checks passed for all touched JS/MJS files.
- Focused private root bridge package test passed: 9/9 tests.
- Focused component-tree smoke passed:
  `React DOM private component tree map shell smoke checks passed.`
- Focused mutation adapter smoke passed:
  `React DOM private mutation adapter shell smoke checks passed.`
- `npm run check --workspace @fast-react/react-dom` passed with 27 package
  tests plus the accepted entrypoint inventory smoke. npm printed the existing
  `minimum-release-age` warning.
- `git diff --check` passed, including this report via intent-to-add.

## Risks Or Blockers

- The cleanup is a private fake-DOM path only. It does not claim public
  `root.unmount`, browser DOM behavior, native/Rust handoff execution, full
  reconciler deletion traversal, refs, effects, hydration, or event behavior.
- Component-tree subtree detachment depends on fake DOM `childNodes` snapshots.
  Containers without child traversal support can still be cleared, but no
  descendant metadata can be discovered from the container alone.
- If a fake DOM `removeChild` or listener/marker revert throws mid-cleanup,
  no rollback path is claimed.

## Recommended Next Tasks

1. Wire future private initial/update host-output handoffs to produce explicit
   host-output records that this cleanup can consume instead of relying on
   container subtree discovery.
2. Add separate private gates for ref detach and passive unmount execution
   ordering after deletion traversal ownership is accepted.
3. Keep public root unmount rows blocked until create, render, update,
   unmount, listener cleanup, and real DOM mutation paths match the React DOM
   oracle through the public runtime.
