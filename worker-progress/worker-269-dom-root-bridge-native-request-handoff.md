# Worker 269 - DOM Root Bridge Native Request Handoff

## Goal Evidence

- `create_goal` was called first for objective:
  `Add a private React DOM root bridge handoff record that can mirror create/render/unmount request metadata into the accepted native root request record shape without invoking N-API, reconciler execution, DOM mutation, listeners, hydration, or public root behavior.`
- `get_goal` immediately after setup reported status `active` for that same
  objective.
- `ORCHESTRATOR.md` was not read.

## Summary

Added a private JS-only native request handoff record to the React DOM root
bridge. The handoff validates genuine private create/render/unmount bridge
records, then exposes a frozen `nativeRequestRecord` mirror with the accepted
native fields: numeric request id, request kind, environment id, root handle,
numeric root id, optional value handle, and root handle state.

The handoff remains inert. It does not load native artifacts, call N-API, run
the reconciler, mutate DOM, write root markers, install listeners, start
hydration, dispatch events, or change public `react-dom/client` placeholder
behavior. Raw source records and raw container/element/callback payloads stay
behind WeakMaps and do not enumerate or serialize.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `worker-progress/worker-269-dom-root-bridge-native-request-handoff.md`

No `packages/react-dom/src/client/root-bridge-native.js` module was needed.

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Inspected worker context 167, 215, 239, 256, and 262. Worker 256 established
  the native request shape in `fast-react-napi`: `request_id`, `kind`,
  `environment_id`, `root_handle`, `root_id`, `value_handle`, and
  `root_handle_state`.
- Inspected `crates/fast-react-napi/src/lib.rs` and
  `crates/fast-react-napi/src/handle_table.rs` to mirror only data shape, not
  execution or native bindings.
- Confirmed existing root bridge records already block native/reconciler/DOM
  work and preserve marker/listener/hydration/event compatibility gates.
- Added direct tests that assert handoff records are frozen, source payloads
  are hidden from `Object.keys()` and `JSON.stringify()`, public root exports
  still throw placeholders, and no container markers/listeners/mutations are
  produced.
- No nested agents were spawned.

## Commands Run

```sh
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
rg -n "Worker (167|215|239|256|262)\\b|root bridge|native root|root request" MASTER_PROGRESS.md MASTER_PLAN.md worker-progress packages/react-dom/src packages/react-dom/test tests -g '!ORCHESTRATOR.md'
sed -n '1,260p' worker-progress/worker-167-react-dom-private-root-bridge.md
sed -n '1,260p' worker-progress/worker-215-dom-root-bridge-private-update-path.md
sed -n '1,260p' worker-progress/worker-239-dom-root-bridge-request-admission-gate.md
sed -n '1,260p' worker-progress/worker-256-native-root-bridge-request-records.md
sed -n '1,220p' worker-progress/worker-262-root-render-e2e-private-bridge-dualrun-gate.md
sed -n '1,360p' crates/fast-react-napi/src/lib.rs
sed -n '1,260p' crates/fast-react-napi/src/handle_table.rs
sed -n '1,760p' packages/react-dom/src/client/root-bridge.js
sed -n '1,280p' tests/smoke/react-dom-private-root-bridge-shell.mjs
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node tests/smoke/react-dom-private-root-bridge-shell.mjs
node tests/smoke/import-entrypoints.mjs
npm run check:js
git add --intent-to-add packages/react-dom/test/react-dom-private-root-bridge-shell.test.js worker-progress/worker-269-dom-root-bridge-native-request-handoff.md && git diff --check; rc=$?; git reset -- packages/react-dom/test/react-dom-private-root-bridge-shell.test.js worker-progress/worker-269-dom-root-bridge-native-request-handoff.md >/dev/null; exit $rc
```

## Verification

- `node --check packages/react-dom/src/client/root-bridge.js`: passed.
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`:
  passed.
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`:
  passed, 3 tests.
- `node tests/smoke/react-dom-private-root-bridge-shell.mjs`: passed.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `npm run check:js`: passed, including package surface checks, import smoke,
  benchmark gates, workspace checks, native loader checks, and 539 conformance
  tests. NPM printed the existing `minimum-release-age` config warnings.
- Report-inclusive `git diff --check`: passed with the new test and progress
  report added via intent-to-add, then unstaged.

## Risks Or Blockers

- The handoff mirrors native record shape only. It is not evidence of real
  native execution, handle-table allocation, rooted JS value lifetime, N-API
  cleanup hooks, scheduler transport, reconciler work, commit, or DOM output.
- Synthetic JS handles are deterministic private metadata. Future native
  integration must replace them with real bridge-owned handles without exposing
  raw JS values publicly.
- Repeat unmount remains a JS private no-op request record; the native recorder
  currently retires root handles on unmount. Future integration must reconcile
  that lifecycle boundary before executing native unmounts.

## Recommended Next Tasks

- Add a private native boundary adapter only when a worker is explicitly scoped
  to loading or invoking native exports.
- Map this JS handoff record into the native error/handle-table family once
  real native request transport exists.
- Keep public `createRoot`, `hydrateRoot`, `root.render`, and `root.unmount`
  blocked until the reconciler, commit, listener setup, and DOM mutation path
  can match the accepted root E2E oracle.
