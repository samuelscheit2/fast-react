# Worker 416: Ref Callback Error Routing Private Records

## Goal Evidence

- Goal tool available: yes.
- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available after setup and before writing this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: add private root error routing records
  for callback ref attach and cleanup-return exceptions, proving captured error
  metadata without invoking public root error callbacks.

## Summary

Added private React DOM ref callback root-error-routing records on top of the
existing controlled invocation gate. The new ref gate snapshot runs the private
callback/cleanup invocation path, collects only thrown attach/null-detach/
cleanup-return records, exposes sanitized error metadata, and keeps raw thrown
values in WeakMap payloads.

Added a root bridge wrapper that consumes accepted root-commit ref metadata
records from private render/unmount requests, preserves root option callback
metadata for `onUncaughtError`, `onCaughtError`, and `onRecoverableError`, and
proves those public callbacks are not invoked. Root error update scheduling,
public root execution, object ref mutation, and compatibility claims remain
blocked.

## Changed Files

- `packages/react-dom/src/client/ref-callback-gate.js`
- `packages/react-dom/src/client/root-bridge.js`
- `tests/conformance/test/dom-ref-callback-oracle.test.mjs`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `worker-progress/worker-416-ref-callback-error-routing-private.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and worker reports 161, 245, 313, 340, 371, 385, and
  398.
- Inspected current `ref-callback-gate.js`, `root-bridge.js`, focused DOM ref
  callback conformance tests, and the private root bridge tests.
- Checked React 19.2.6 reference source: `safelyAttachRef` and
  `safelyDetachRef` capture callback/ref-cleanup exceptions through
  `captureCommitPhaseError`, which ultimately logs uncaught root errors through
  `root.onUncaughtError`. This worker records that routing privately only.

## Commands Run

```sh
node --check packages/react-dom/src/client/ref-callback-gate.js
node --check packages/react-dom/src/client/root-bridge.js
node --check tests/conformance/test/dom-ref-callback-oracle.test.mjs
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test tests/conformance/test/dom-ref-callback-oracle.test.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
npm run check --workspace @fast-react/react-dom
git diff --check
```

Additional inspection used `rg`, `sed`, `git status --short`, `git diff`, and
`get_goal`.

## Verification Results

- JS syntax checks passed for both touched private source files and both
  touched tests.
- Focused DOM ref callback conformance passed: 18 tests.
- Focused React DOM private root bridge test passed: 20 tests.
- `npm run check --workspace @fast-react/react-dom` passed: 44 package tests
  plus import-entrypoint smoke. npm printed the existing
  `minimum-release-age` warning.
- `git diff --check` passed with this progress report included via
  intent-to-add.

## Risks Or Blockers

- This is private diagnostic infrastructure only. It does not schedule root
  error updates, invoke root error callbacks, execute public React DOM roots,
  mutate object refs, or claim ref/error compatibility.
- The private routing snapshot executes test-supplied callback refs/cleanup
  returns through the existing controlled gate; callers must keep it behind the
  private admission boundary.
- Cleanup persistence is unchanged. Cleanup-return functions still arrive via
  private detach metadata rather than a committed cleanup handle store.

## Recommended Next Tasks

1. Add a private cleanup handle store/bridge so attach-returned cleanup
   functions can flow into later detach metadata without direct test plumbing.
2. Define the real commit-phase error capture path that schedules root error
   updates before enabling public root error callbacks.
3. Keep public React DOM ref compatibility blocked until public roots, DOM
   mutation, object refs, cleanup storage, and root error callback policy are
   all wired.

## Nested Agents

- No nested agents or explorer subagents were used.
