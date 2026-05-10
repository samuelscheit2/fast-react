# Worker 447: Function Component useCallback Private Path

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active status from `get_goal`: `active`.
- Active objective from `get_goal`: add a private `useCallback` render-path
  canary by reusing the accepted memo dependency machinery while keeping public
  hook dispatch blocked.

## Summary

- Added a private reconciler `useCallback` render path backed by the existing
  memo hook binding, opaque hook payload, and dependency status machinery.
- Added private callback hook request, mount/update records, render record, and
  current-list seeding helper while preserving `useMemo` behavior.
- Added focused canaries for mount, dependency match reuse, changed
  dependencies, missing dependencies as always changed, and metadata mismatch
  rejection through the memo record gate.
- Updated the React hook dispatcher so `useCallback` no longer forwards through
  a generic installed dispatcher. It now requires an internal marked private
  callback-hook dispatcher with blocked compatibility metadata.

## Changed Files

- `crates/fast-react-reconciler/src/function_component.rs`
- `packages/react/hook-dispatcher.js`
- `tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `worker-progress/worker-447-function-component-use-callback-private.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read requested worker reports 157, 158, 182, 388, and 419.
- Checked worker 358 for the accepted private `useMemo`/`useRef` render path
  and its public-facade boundary.
- Inspected current `function_component.rs` memo hook records, hook-list cursor
  handling, opaque payload storage, and unsupported hook tests.
- Inspected `packages/react/hook-dispatcher.js` and
  `tests/conformance/test/react-hook-dispatcher-guard.test.mjs` for existing
  private state/effect/context dispatcher gates.
- Checked React 19.2.6 reference source:
  `ReactFiberHooks.js` shows `mountCallback`/`updateCallback` storing
  `[callback, deps]` and reusing the previous callback when dependencies
  compare equal; `updateMemo` uses the same dependency comparison shape.

## Commands Run

```sh
cargo fmt --all
cargo test -p fast-react-reconciler --all-features function_component
node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features
npm run check --workspace @fast-react/react
git diff --check
```

Additional inspection used `rg`, `sed`, `git diff`, `git diff --stat`,
`git status --short`, `node --check packages/react/hook-dispatcher.js`, and
`get_goal`.

## Verification Results

- `cargo test -p fast-react-reconciler --all-features function_component`
  passed: 74 matching tests.
- `node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
  passed: 18 tests.
- `cargo fmt --all --check` passed.
- `cargo test -p fast-react-reconciler --all-features` passed: 366 unit tests
  plus 1 compile-fail doctest.
- `npm run check --workspace @fast-react/react` passed. npm emitted the
  existing `minimum-release-age` config warning.
- `git diff --check` passed.

## Risks Or Blockers

- No blockers.
- This remains a private metadata canary. It does not execute callback
  functions, expose a public hook implementation, schedule updates, integrate
  renderer dispatch, or claim `useCallback` compatibility.
- Dependency equality is still deterministic handle equality through
  `HookEffectDependencies`, not JS element-by-element `Object.is` comparison.
- The callback hook intentionally reuses opaque memo payload storage until a
  dedicated core payload type exists.

## Recommended Next Tasks

- Add a future multi-hook private dispatcher that can interleave callback,
  memo, ref, state, reducer, effect, and context hooks in real component call
  order.
- Keep public `useCallback` blocked until renderer-backed function component
  execution and JS dependency comparison semantics are admitted.
- Consider a dedicated core payload shape for memoized callback/memo values
  once hook payload compatibility work moves beyond private canaries.

## Nested Agents

- No nested agents were used.
