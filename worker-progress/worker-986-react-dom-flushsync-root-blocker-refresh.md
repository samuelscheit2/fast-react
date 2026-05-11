# Worker 986 - React DOM FlushSync Root Blocker Refresh

Date: 2026-05-11

## Summary

- Refreshed the private public-`flushSync` blocked-currentness report with
  source-owned rows for `react-dom` and `react-dom/profiling`.
- Each source row now binds the blocked facade to the exact package file,
  placeholder factory source, export descriptor, non-enumerable placeholder
  metadata, accepted private blocker worker ids, and accepted prerequisite ids.
- The consumer now fails closed for cloned source rows, stale source rows,
  hidden public aliases, symbol/non-enumerable/accessor/inherited compatibility
  claims, root/Scheduler/act prerequisite smuggling, and extra accepted-worker
  smuggling.
- Audit repair: native/Rust/native-bridge/runtime aliases are now part of the
  descriptor-aware source-row claim scanner, including
  `publicNativeCompatibilityClaimed`, `nativeExecution`,
  `rustExecutionClaimed`, `nativeBridgeAvailable`, and
  `nativeRuntimeExecutionClaimed`.
- Follow-up repair: source-row claim scanning now also probes descriptor-hidden
  string claim fields through guarded `in` checks and property access, so
  proxy-wrapped entrypoints cannot expose native/Rust/native-bridge/runtime
  claims while hiding them from `ownKeys` and `getOwnPropertyDescriptor`.
- Blocker repair: descriptor-hidden native/Rust/native-bridge/runtime source-row
  claim probes are presence-based when property access returns any non-undefined
  value, including `false`, matching descriptor scanning for own
  `nativeExecution: false`-style keys.
- Public `flushSync` callback execution, return/thenable behavior, public
  Scheduler queue draining, root execution, DOM mutation, act/test-utils
  routing, profiling/package compatibility, and native/Rust behavior remain
  blocked.

## Changed Files

- `packages/react-dom/src/shared/flush-sync-guard.js`
- `packages/react-dom/test/react-dom-flush-sync-guard.test.js`
- `worker-progress/worker-986-react-dom-flushsync-root-blocker-refresh.md`

## Commands Run

- `node --check packages/react-dom/src/shared/flush-sync-guard.js`
- `node --check packages/react-dom/test/react-dom-flush-sync-guard.test.js`
- `node --check packages/react-dom/index.js`
- `node --check packages/react-dom/profiling.js`
- `node --test packages/react-dom/test/react-dom-flush-sync-guard.test.js`
- Ad hoc Node audit probe for non-enumerable
  `publicNativeCompatibilityClaimed`, `nativeExecution`,
  `rustExecutionClaimed`, `nativeBridgeAvailable`, and
  `nativeRuntimeExecutionClaimed` aliases
- `node --test tests/conformance/test/react-dom-flush-sync-private-guard.test.mjs`
- `node --test tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- `git diff --cached --check`

## Evidence Gathered

- `createPublicReactDomFlushSyncBlockedCurrentnessReport()` now records
  `sourceRows` for both public entrypoints.
- The source-row proof is stored in a gate-owned `WeakMap`, so direct cloned
  rows are rejected with
  `public-react-dom-flush-sync-currentness-source-rows-source-proof`.
- Stale row identity, wrong package source, extra accepted private blocker ids,
  and hidden alias rows are rejected with
  `public-react-dom-flush-sync-currentness-source-rows`.
- Regression coverage mutates the public entrypoint objects temporarily to
  prove hidden flushSync aliases, symbol claims, accessors that are not read,
  and inherited Scheduler/root claims are rejected before consumption.
- Audit repair coverage proves native/Rust claims are rejected as enumerable,
  non-enumerable, symbol, accessor, inherited, function-property, and
  proxy-hidden aliases before any public `flushSync` evidence is accepted.
- Proxy-hidden source-row regressions swap the cached `react-dom` and
  `react-dom/profiling` exports with proxies that keep the real `flushSync`
  descriptor visible while exposing `nativeExecution`,
  `publicNativeCompatibilityClaimed`, `rustExecutionClaimed`,
  `nativeBridgeAvailable`, and `nativeRuntimeExecutionClaimed` only through
  `has` or `get` traps, including `has` false / `get` false exposure for
  native/Rust/native-bridge/runtime claim keys.
- The accepted private blocker prerequisites remain limited to Workers 694,
  718, and 901; Worker 910 and later root/resource/form evidence cannot be
  smuggled into the public `flushSync` lane.

## Risks Or Blockers

- No blocker remains.
- The change is intentionally private and diagnostic-only; it does not expose a
  public API or change the public `flushSync` placeholder behavior.
- Merge overlap risk is limited to adjacent React DOM flushSync guard changes.
  Preserve the source-row `WeakMap` proof and entrypoint descriptor scan when
  resolving conflicts.
- npm emitted the existing unsupported `minimum-release-age` warning during npm
  checks.

## Recommended Next Tasks

- Keep public `flushSync` blocked until callback execution, root scheduling,
  Scheduler priority/queue behavior, act/test-utils routing, effects, DOM
  mutation, and package/profiling compatibility can be proven together.
- If a later worker opens any public root or Scheduler path, require a new
  source-owned `flushSync` report version rather than weakening these blocked
  source rows.
