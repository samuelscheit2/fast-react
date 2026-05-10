# worker-182-react-hook-dispatcher-guard

## Objective

Replace selected public React hook placeholders with a shared dispatcher guard
that models React's invalid-hook-call boundary without implementing hook state
or rendering.

## Goal Setup

- `create_goal` was called as the first action for this objective.
- `get_goal` was called immediately after goal setup and returned status
  `active` with objective `replace selected public React hook placeholders
  with a shared dispatcher guard that models React's invalid-hook-call boundary
  without implementing hook state or rendering`.
- The worker goal was marked complete after implementation and verification.

## Progress

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, the required worker progress
  reports, and the current `packages/react` entrypoints.
- Checked React 19.2.6 source reference:
  `packages/react/src/ReactHooks.js` for `resolveDispatcher` and public hook
  forwarding, `packages/react/src/ReactSharedInternalsClient.js` and
  `ReactSharedInternalsServer.js` for the `H` dispatcher holder, and
  `packages/react-reconciler/src/ReactFiberHooks.js` for the invalid hook call
  message used by invalid dispatchers.
- Added `packages/react/hook-dispatcher.js` with a shared `H` holder,
  `ReactCurrentDispatcher.current` accessors, resolver, invalid-hook-call
  error factory, and arity/name-shaped hook forwarding functions.
- Wired the default React entrypoint hooks `useState`, `useReducer`, `useRef`,
  `useEffect`, `useLayoutEffect`, `useMemo`, `useCallback`, `useContext`, and
  `use` through the dispatcher guard.
- Wired the react-server entrypoint hooks available on that surface:
  `use`, `useCallback`, and `useMemo`.
- Kept hook queues, effects, function component rendering, DOM packages,
  test-renderer packages, scheduler packages, and Rust sources out of scope.
- Added focused conformance coverage for invalid hook call errors, verified
  hook export names/lengths against the checked React 19.2.6 runtime inventory,
  and tested forwarding to an installed test dispatcher.
- Updated the smoke entrypoint test to expect the new invalid-hook-call
  boundary for `useRef` and to keep the new internal file blocked as a public
  package subpath.

## Verification

- `node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
  passed.
- `node tests/smoke/import-entrypoints.mjs` passed.
- `npm run check:js` passed.
- `git diff --check` passed.
- Orchestrator merged current `main` into this branch without conflicts.
- Post-merge orchestrator verification passed:
  - `node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
  - `node tests/smoke/import-entrypoints.mjs`
  - `npm run check:js`: 445 conformance tests plus package surface,
    benchmark, native loader, and workspace smoke checks
  - `git diff --check`

## Risks And Notes

- This intentionally installs only a dispatcher guard. It does not implement
  hook state, reducer queues, effects, function component render, or any
  compatibility claim.
- Public React private internals remain the existing opaque placeholder shape;
  the shared dispatcher holder is package-private for this slice and is used
  directly by the focused test dispatcher.
