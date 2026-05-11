# Worker 976 Children Lazy Renderer Blockers

## Summary

- Added a private, source-owned blocker lane to `packages/react/children-helper.js`
  for lazy renderer, Suspense wakeup, and root render behavior around lazy
  children.
- Kept Worker 972 direct `React.Children` lazy traversal as accepted private
  input evidence only. The new lane explicitly records that direct helper
  traversal does not imply renderer lazy component execution, Suspense fallback
  and retry wakeups, root scheduling, portal creation, owner stacks, or ref
  lifecycle compatibility.
- Extended the currentness gate to reject caller-shaped renderer/Suspense/root
  evidence, cloned reports, stale source rows, blocker row overrides, public
  compatibility claims, and renderer/root/portal/ref prerequisite smuggling.

## Sources Read

- `WORKER_BRIEF.md`
- `packages/react/children-helper.js`
- `tests/conformance/test/children-helper-currentness-gate.test.mjs`
- `tests/conformance/test/children-helper-oracle.test.mjs`
- `tests/conformance/src/children-helper-scenarios.mjs`
- `worker-progress/worker-950-react-children-traversal-blocker-currentness.md`
- `worker-progress/worker-972-children-lazy-traversal-oracle.md`
- `/Users/user/Developer/Developer/react-reference/packages/react/src/ReactChildren.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberBeginWork.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberThenable.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberThrow.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRoot.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-dom/src/client/ReactDOMRoot.js`

React reference clone was at tag `v19.2.6`, commit
`eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`.

## Changes

- Added `lazyRendererBlockerSourceRows`, `lazyRendererBlockerRows`, and
  `lazyRendererBlockerEvidence` to the private Children currentness report.
- Pinned source rows for direct `ReactChildren.mapIntoArray` lazy traversal,
  reconciler `mountLazyComponent`/`resolveLazy`, Suspense
  `updateSuspenseComponent`/`throwException` plus the `attachPingListener`
  implementation owner in `ReactFiberWorkLoop.js`, and
  DOM/root `createRoot`/`root.render`/`createFiberRoot`/`updateHostRoot`.
- Added report and consumption flags that keep lazy renderer, Suspense, and root
  behavior blocked while direct lazy traversal remains supported privately.
- Added currentness-gate assertions for source-owned rows, blocker rows,
  evidence identity, fail-closed public/prerequisite flags, Map warning
  preservation, and private API absence from public React roots.

## Commands Run

- `git rev-parse HEAD && git describe --tags --exact-match HEAD` in
  `/Users/user/Developer/Developer/react-reference`
- `rg -n "resolveLazy|mountLazy|updateSuspenseComponent|updateHostRoot|throwException|lazyComponent|REACT_LAZY_TYPE|init\\(" packages/react/src packages/react-reconciler/src packages/react-dom/src` in the React reference clone
- `node --check packages/react/children-helper.js`
- `node --check tests/conformance/test/children-helper-currentness-gate.test.mjs`
- `node --check tests/conformance/test/children-helper-oracle.test.mjs`
- `node --test tests/conformance/test/children-helper-currentness-gate.test.mjs`
- `node --test tests/conformance/test/children-helper-oracle.test.mjs`
- `node --test tests/conformance/test/children-helper-currentness-gate.test.mjs tests/conformance/test/children-helper-oracle.test.mjs`
- `npm run check --workspace @fast-react/react`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence

- Direct lazy traversal remains covered by the existing `children-lazy-values`
  oracle scenario and remains `matched-but-compatibility-not-claimed`.
- The new private report rejects source-row drift, blocker-row overrides, and
  caller-shaped lazy renderer/Suspense/root evidence by object identity before
  accepting the report.
- The Suspense wakeup row now includes both `ReactFiberThrow.js` call/import
  evidence and `ReactFiberWorkLoop.js`, the source owner for
  `attachPingListener`; a negative test rejects the caller/import-only row.
- Public React roots still expose only the normal `Children` helpers; the
  private currentness APIs remain reachable only through `children-helper.js`.
- The currentness probe still preserves the module-level Map warning state.
- Final verification passed. npm printed the existing
  `minimum-release-age` config warning during npm commands.

## Risks Or Blockers

- This is private conformance evidence only. It does not implement or admit
  renderer lazy component execution, Suspense retry/wakeup behavior, root
  scheduling, portal creation, owner stack behavior, or ref lifecycles.
- Renderer-owned evidence should be added in renderer/root lanes before any
  public compatibility promotion.

## Recommended Next Tasks

1. Add renderer-owned lazy component begin-work evidence before promoting any
   lazy renderer behavior.
2. Keep Suspense wakeup/root scheduling admission separate from direct
   `React.Children` helper traversal evidence.
