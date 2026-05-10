# Worker 415: Ref Callback Cleanup Handle Store

## Goal Evidence

- Goal tool available: yes.
- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and before report writing.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: add a private cleanup-return handle
  store so callback ref attach returns can be recorded and later consumed by
  detach metadata without tests passing cleanup functions directly.

## Summary

Added a private React DOM ref callback cleanup-return handle store. Callback ref
attach returns that are functions now create opaque cleanup-return handles,
store the cleanup function in a private payload, and associate the handle with
the existing private `refHandle`.

Detach execution now resolves cleanup returns from that store when detach
metadata only carries the same `refHandle`, so focused tests no longer pass
cleanup functions directly through detach metadata. Cleanup handles are consumed
after cleanup invocation, removed from the ref-handle store, and counted in the
controlled invocation, execution handoff, host-output ordering, and root-bridge
diagnostic records.

Object refs remain skipped/unmutated. Public root execution, public React DOM
ref compatibility, and root error routing remain blocked.

## Changed Files

- `packages/react-dom/src/client/ref-callback-gate.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/dom-ref-callback-oracle.test.mjs`
- `worker-progress/worker-415-ref-callback-cleanup-handle-store.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read prior worker reports 245, 340, 371, 385, and 398.
- Inspected the current React DOM private ref gate and root bridge metadata
  admission paths.
- Checked React 19.2.6 reference behavior in
  `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitEffects.js`:
  callback attach stores `refCleanup`, detach calls cleanup first when present,
  and cleanup references are nulled after invocation.
- Confirmed the existing root-bridge ordering diagnostic admits ref metadata
  before running the controlled per-step ref invocations, so detach cleanup
  resolution needed to happen at detach execution time, not only at metadata
  creation time.

## Implementation Notes

- Added private cleanup-return handle branding, payload accessors, and
  `isPrivateRefCallbackCleanupReturnHandle`.
- Attach callback returns now record cleanup handles when the return value is a
  function.
- Detach callback execution resolves cleanup from either an explicit private
  cleanup handle or the stored handle associated with the detach `refHandle`.
- Cleanup handles are validated against root owner, host owner, host instance,
  ref handle, and callback identity before use.
- Cleanup handles are consumed and removed after invocation, including erroring
  cleanup callbacks, matching React's one-shot cleanup clearing behavior.
- Host-output ordering diagnostics now compare cleanup handle identity as well
  as cleanup function identity.
- Root-bridge diagnostics expose handle record/consume counts while continuing
  to report public root execution and compatibility as false.

## Commands Run

```sh
create_goal
get_goal
pwd
rg --files | rg '^(WORKER_BRIEF|MASTER_PLAN|MASTER_PROGRESS)\.md$|^worker-progress/worker-(245|340|371|385|398).*\.md$|^packages/react-dom/src/client/(ref-callback-gate|root-bridge)\.js$'
git status --short
sed inspections for required context, prior worker reports, source files, tests, and React reference commit ref behavior
rg inspections for ref cleanup, root commit metadata, and focused test locations
node --check packages/react-dom/src/client/ref-callback-gate.js
node --check packages/react-dom/src/client/root-bridge.js
node --check tests/conformance/test/dom-ref-callback-oracle.test.mjs
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test tests/conformance/test/dom-ref-callback-oracle.test.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
npm run check --workspace @fast-react/react-dom
git status --short
git diff --stat
git add --intent-to-add worker-progress/worker-415-ref-callback-cleanup-handle-store.md
git diff --check
get_goal
```

## Verification Results

Passed:

```sh
node --check packages/react-dom/src/client/ref-callback-gate.js
node --check packages/react-dom/src/client/root-bridge.js
node --check tests/conformance/test/dom-ref-callback-oracle.test.mjs
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test tests/conformance/test/dom-ref-callback-oracle.test.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
npm run check --workspace @fast-react/react-dom
```

Focused DOM ref callback conformance passed: 17 tests.
Focused React DOM private root bridge test passed: 19 tests.
React DOM workspace check passed: 43 package tests plus import-entrypoint
smoke. npm printed the existing `minimum-release-age` warning.

`git diff --check` passed with this progress report included via
intent-to-add.

## Quality, Maintainability, Performance, And Security Review

- Quality: the handle store is covered by controlled invocation, direct
  execution handoff, and root-bridge host-output ordering tests. Tests no
  longer pass cleanup functions directly through detach metadata.
- Maintainability: cleanup storage is layered inside the existing private ref
  gate and keyed by the already-present private `refHandle`, avoiding a new
  public surface or root facade behavior.
- Performance: lookup and consumption are constant-time Map/WeakMap operations
  along the existing per-record ref callback gate path.
- Security: cleanup functions remain in private WeakMap payloads. Public
  records expose only opaque handles/counts and keep `exposesRefCleanup`,
  public root execution, and compatibility claims false.

## Risks Or Blockers

- This is still private diagnostic infrastructure. Public React DOM roots do
  not execute refs, object refs remain unmutated, and root error routing remains
  blocked.
- The store is process-local JS state keyed by private `refHandle` identity.
  Future native/Rust root metadata handoff must preserve stable private ref
  handles for detach cleanup resolution.
- Direct private `refCleanup` input remains accepted for backwards-compatible
  private callers, but focused tests now exercise the handle-store path.

## Recommended Next Tasks

1. Add private root error routing records for callback attach and cleanup
   exceptions.
2. Connect future native/Rust root commit metadata to this JS cleanup handle
   path with stable private ref handles.
3. Keep public React DOM ref compatibility blocked until public roots, DOM
   mutation, object refs, cleanup storage, and root error policy all match the
   React DOM oracles.

## Nested Agents

- No nested agents or explorer subagents were used.
