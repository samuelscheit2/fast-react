# Worker 1202 Public Render Observable HTML After Lifecycle

## Status

Complete and committed as `1ad2caa8 Add public fake DOM observability evidence`.

## Summary

- Extended fake-DOM/public host-output observability for the accepted minimal public `createRoot` path only.
- Added observable `children`, `firstElementChild`, `innerHTML`, `tagName`, and escaped serialization evidence to the public facade test, shared private-root shell context helper, smoke test, and conformance public facade boundary.
- Kept the observable context helper public-only after verification showed generic `children` accessors disturb private nested-host-output prop matching.
- Kept production runtime source unchanged.

## Changed Files

- `packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell/context.js`
- `tests/smoke/react-dom-private-root-bridge-shell.mjs`
- `tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-1202-public-render-observable-html-after-lifecycle.md`

## Commands Run

- `node -v && npm -v` -> `v26.1.0`, `11.13.0`
- `git diff --check` -> pass
- `node --test packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js` -> pass, 4 tests
- `node tests/smoke/react-dom-private-root-bridge-shell.mjs` -> pass
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` -> initially failed 1 nested host-output diagnostic after generic `children` accessor change; pass after narrowing, 42 tests
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js` -> initially failed 1 nested host-output diagnostic after generic context `children` accessor change; pass after public-only decorator, 77 tests
- `npm --prefix packages/react-dom run check` -> pass, 236 package tests plus import-entrypoints smoke
- `npm --prefix tests/conformance run root-public-facade:conformance` -> pass, public facade blocked gate PASS, failures 0
- final `git diff --check` -> pass

## Verification Results

All required verification passed after narrowing observable `children` to public-only fake-DOM evidence in the shared context helper.

## Evidence Gathered

- Public fake-DOM text escaping now covers `&`, `<`, and `>`.
- Public fake-DOM `id` attribute escaping now covers `&`, `<`, `>`, and `"`.
- Unsupported `className` and non-string/non-number `id` render paths remain fail-closed with no observable host output, root marker, or listener marker leakage.
- Conformance public facade rows still report blocked public root, hydration, events, refs, Scheduler/act/flushSync, resources, forms, controlled inputs, browser DOM mutation, and compatibility claims.
- The older unaccepted Worker 1193 worktree was read only as comparison input; this branch keeps the newer Worker 1194/1200 lifecycle baseline.

## Risks Or Blockers

- No blockers.
- The `id` prop is the only accepted attribute path for the minimal public facade; broader attributes/props remain blocked and were not promoted.

## Recommended Next Tasks

- Continue with the next narrow public fake-DOM observable slice only after the orchestrator assigns one.
