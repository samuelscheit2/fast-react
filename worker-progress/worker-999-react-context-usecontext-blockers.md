# Worker 999: React Context/useContext Blockers

## Summary

- Added source-owned context object provenance in `packages/react/context-object.js`
  without changing direct `createContext` object shape or root exports.
- Added a package-private context/useContext renderer readiness blocker report in
  `packages/react/hook-dispatcher.js`.
- The new report consumes a source-owned `createContext` object through a
  source-owned marked private context dispatcher, then keeps public `useContext`,
  Provider rendering, renderer root scheduling, Suspense/context propagation,
  `act`, Scheduler timing, and package compatibility blocked.
- The gate rejects cloned/stale reports, caller-shaped context objects,
  caller-shaped dispatchers, provider/readiness row overrides, hidden/proxy
  public compatibility aliases, root/renderer/Scheduler prerequisite smuggling,
  and public package compatibility flags.
- Repaired the stale-readiness validation gap: report validation now rechecks the
  current root `useContext` export and compares the live source-owned context
  object Provider, Consumer, `$$typeof`, and value fields against a
  package-private source snapshot instead of trusting captured booleans.
- Added regressions for stale reports after replacing `React.useContext`, plus
  post-report source context object mutations of Provider, Consumer, `$$typeof`,
  and `_currentValue`.
- Refreshed the context-object local gate so the source-owned blocker rows are
  visible before private context readiness can be treated as accepted progress.

## Changed Files

- `packages/react/context-object.js`
- `packages/react/hook-dispatcher.js`
- `tests/conformance/src/context-object-local-gate.mjs`
- `tests/conformance/test/context-object-oracle.test.mjs`
- `tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `tests/conformance/test/react-hook-dispatcher-oracle.test.mjs`
- `worker-progress/worker-999-react-context-usecontext-blockers.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, Worker 028, Worker 248, Worker 409,
  Worker 417, Worker 525, Worker 956, Worker 974, and Worker 988 reports.
- Used two nested explorers:
  - `context_gate_explorer` confirmed the local context gate shape and the
    narrow add point for source-owned useContext/Provider blocker rows.
  - `hook_dispatcher_patterns_explorer` summarized the accepted `useRef`
    source-owned report pattern and current `useContext` dispatcher metadata.
- Inspected current context-object oracle tests, hook-dispatcher guard/oracle
  tests, public React root wiring, package surface guards, and import smoke
  expectations.

## Commands Run

```sh
node --check packages/react/context-object.js
node --check packages/react/hook-dispatcher.js
node --check tests/conformance/src/context-object-local-gate.mjs
node --check tests/conformance/test/context-object-oracle.test.mjs
node --check tests/conformance/test/react-hook-dispatcher-guard.test.mjs
node --check tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
node --test tests/conformance/test/context-object-oracle.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
node --test tests/conformance/test/context-object-oracle.test.mjs tests/conformance/test/react-hook-dispatcher-guard.test.mjs tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
npm run check --workspace @fast-react/react
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
git diff --check
git diff --cached --check
```

## Verification Results

- Context-object oracle suite passed: 13 tests.
- Hook dispatcher guard suite passed: 33 tests.
- Hook dispatcher oracle suite passed: 27 tests.
- Combined focused suite passed: 73 tests.
- React workspace check/import smoke passed. npm printed the existing
  `minimum-release-age` config warning.
- Package-surface guard passed. npm printed the existing `minimum-release-age`
  config warning.
- Standalone import-entrypoints smoke passed.
- `git diff --check` and `git diff --cached --check` passed.

## Risks Or Blockers

- No blockers.
- This is package-private blocker/readiness evidence only. It does not admit
  public `React.useContext` compatibility, public Provider rendering, renderer
  root scheduling, Suspense/context propagation, `act`, Scheduler timing, or
  package compatibility.
- `context-object.js` now tracks source-owned context object identity with a
  WeakSet. This does not add root React exports or mutate the observable
  `createContext` object shape covered by the oracle.

## Recommended Next Tasks

1. Keep public context compatibility blocked until renderer-owned dispatcher
   installation, Provider begin-work traversal, context dependency propagation,
   and root scheduling are admitted together.
2. Replace exact private provider handoffs with broad renderer/root context
   propagation evidence before lifting any Provider/useContext blockers.
