# Worker 307 - Test Renderer Update/Unmount Private JS Bridge

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: Extend the private
  react-test-renderer JS root bridge with update and unmount request records
  that match the accepted Rust `TestRendererRoot` lifecycle diagnostics. Keep
  public `update()` and `unmount()` methods fail-closed.
- `ORCHESTRATOR.md` was not read.

## Summary

Extended the placeholder `react-test-renderer` root shell with a private,
JS-only TestRendererRoot request-record layer for create, update, unmount,
repeat unmount, and update-after-unmount diagnostics.

The public renderer object shape is unchanged, public `create().update()` and
`create().unmount()` still throw deterministic
`FastReactTestRendererUnimplementedError` errors, and all route availability
flags remain false. The thrown update/unmount diagnostics now carry frozen
private root request records that mirror the accepted Rust lifecycle outcomes:
`Scheduled`, `AlreadyUnmountScheduled`, and `IgnoredAfterUnmount`, with
`Active` and `UnmountScheduled` lifecycle transitions, `RootElementHandle::NONE`
for unmount, blocked native/reconciler/host-output capabilities, and no native
loading or Rust execution.

Worker 266's accepted update/unmount private-route metadata was preserved.

## Changed Files

- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-307-test-renderer-update-unmount-private-js-bridge.md`

## Evidence Gathered

- Read required coordination files: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read worker 234 and worker 266 progress reports.
- Searched for worker 304 progress/private bridge context; no worker 304 report
  or merged react-test-renderer private root bridge code was present in this
  worktree.
- Inspected Rust `fast-react-test-renderer` lifecycle diagnostics:
  `TestRendererRootLifecycle`, `TestRendererRootUpdateKind`,
  `TestRendererRootUpdateOutcome`, `TestRendererRootScheduledUpdate`,
  `TestRendererCommitDiagnostics`, `TestRendererRoot::update`,
  `TestRendererRoot::unmount`, and the focused lifecycle tests for update,
  sync unmount, idempotent unmount, and update-after-unmount.
- Inspected the accepted React DOM private root bridge as a local pattern for
  frozen inert request records while keeping public roots blocked.
- No nested agents or explorers were spawned.

## Commands Run

```sh
node --check packages/react-test-renderer/index.js
node --check packages/react-test-renderer/cjs/react-test-renderer.development.js
node --check packages/react-test-renderer/cjs/react-test-renderer.production.js
node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
npm run check:js
git diff --check
git status --short
git diff --stat
```

Research and implementation support commands included `sed`, `rg`, `nl`,
`diff`, and a mechanical sync of the root placeholder implementation into the
two physical CJS variants before restoring their entrypoint and `act` variant
differences.

## Verification Results

- All four `node --check` commands passed.
- Focused create routing gate passed: 6 tests.
- `npm run check:js` passed, including package-surface guard, import smoke,
  benchmark gate, workspace checks, native loader checks, and 560 conformance
  tests.
- `git diff --check` passed.

`npm run check:js` printed the existing `minimum-release-age` npm config
warning; it did not affect the result.

## Risks Or Blockers

- The private JS request records are diagnostic only. They do not create a
  native handle, call Rust, schedule reconciler work, mutate host output,
  serialize output, integrate `act`, or claim compatibility.
- The private records intentionally describe JS-side lifecycle requests with
  opaque JS element summaries; they do not expose real Rust
  `RootElementHandle`, queue, lane, callback, or fiber handles.
- Future real routing must replace these inert diagnostics deliberately once a
  native/Rust TestRendererRoot bridge is accepted.

## Recommended Next Tasks

1. Add a real native/Rust TestRendererRoot handoff only after create, update,
   unmount, and callback handles can cross the bridge without public behavior
   claims.
2. Keep `toJSON`, `toTree`, `TestInstance`, `act`, and Scheduler flushing
   blocked until committed host output, fiber inspection, serialization, and
   act prerequisites are all accepted.
3. When public routing becomes real, replace this static/private diagnostic
   gate with dual-run React 19.2.6 conformance for root lifecycle behavior.
