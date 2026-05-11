# Worker 995 React Children Portal Ref Owner Blockers

## Summary

- Added a separate private Children currentness blocker lane for portal, ref,
  owner stack, root/dispatcher, and Suspense/lazy renderer behavior.
- Preserved accepted direct Children traversal and lazy traversal evidence as
  private input only. Direct portal leaf traversal still does not admit
  ReactDOM portal creation, HostPortal reconciliation, ref lifecycle, owner
  stack, root scheduling, or Suspense renderer compatibility.
- Tightened currentness shape validation to use exact own data-property keys
  through `Reflect.ownKeys`, so source-created reports reject symbol/proxy
  aliases that `Object.keys` would hide.

## Sources Read

- `WORKER_BRIEF.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-950-react-children-traversal-blocker-currentness.md`
- `worker-progress/worker-972-children-lazy-traversal-oracle.md`
- `worker-progress/worker-976-children-lazy-renderer-blockers.md`
- `packages/react/children-helper.js`
- `tests/conformance/test/children-helper-currentness-gate.test.mjs`
- `tests/conformance/test/children-helper-oracle.test.mjs`
- `tests/conformance/src/children-helper-scenarios.mjs`
- `tests/conformance/src/children-helper-probe-runner.mjs`
- `/Users/user/Developer/Developer/react-reference/packages/react/src/ReactChildren.js`
- `/Users/user/Developer/Developer/react-reference/packages/shared/ReactSymbols.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-dom/src/shared/ReactDOM.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-dom/src/client/ReactDOMClientFB.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-dom/src/client/ReactDOMRoot.js`
- `/Users/user/Developer/Developer/react-reference/packages/react/src/ReactOwnerStack.js`
- `/Users/user/Developer/Developer/react-reference/packages/react/src/jsx/ReactJSXElement.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactPortal.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactChildFiber.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiber.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberBeginWork.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitEffects.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitWork.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberReconciler.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRoot.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberThrow.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberThenable.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js`

React reference clone remained at tag `v19.2.6`, commit
`eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`.

## Changes

- Added `portalRefOwnerBlockerSourceRows`, `portalRefOwnerBlockerRows`, and
  `portalRefOwnerBlockerEvidence` to the private Children traversal report.
- Pinned source-owned rows for direct portal leaf traversal, ReactDOM portal
  creation, HostPortal reconciliation, ref marking/commit lifecycle, owner
  stack capture, root/dispatcher prerequisites, and Suspense/lazy renderer
  separation.
- Added blocker rows rejecting caller-shaped portal/ref/owner/renderer
  evidence, direct Children leaf evidence used as renderer proof, cloned or
  stale reports, public compatibility flags, and root/dispatcher prerequisite
  smuggling.
- Added symbol/proxy alias rejection coverage for report shape and nested
  behavior probes.

## Evidence

- Existing direct Children helper behavior and the `children-lazy-values`
  oracle remain unchanged.
- Private consumption now includes a
  `portal-ref-owner-renderer-blockers` evidence area while keeping all public
  compatibility flags false.
- Currentness validation now rejects source-created reports with enumerable
  symbol keys or proxy-surfaced alias keys before accepting evidence.

## Commands Run

```sh
git status --short --branch
git log --oneline --decorate -5
rg -n "function createPortal|export function createPortal|createPortal\\(" /Users/user/Developer/Developer/react-reference/packages/react-dom/src/client/ReactDOMClientFB.js /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactPortal.js /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/ReactDOMContainer.js /Users/user/Developer/Developer/react-reference/packages/react-dom/src/shared/ReactDOM.js
rg -n "HostPortal|REACT_PORTAL_TYPE|createFiberFromPortal|updatePortal|reconcileSinglePortal|ChildReconciler|createChildReconciler" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactChildFiber.js /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiber.js /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactWorkTags.js /Users/user/Developer/Developer/react-reference/packages/shared/ReactSymbols.js
rg -n "markRef|coerceRef|safelyAttachRef|safelyDetachRef|commitAttachRef|detachFiberMutation|RefStatic|Ref\\b|refCleanup" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberBeginWork.js /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitEffects.js /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitWork.js /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberFlags.js /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberHooks.js
rg -n "captureOwnerStack|ReactOwnerStack|currentOwner|getOwner|debugOwner|ownerStackLimit|ReactCurrentFiber|setCurrentFiber|runWithFiberInDEV|getOwnerStack" /Users/user/Developer/Developer/react-reference/packages/react/src/ReactOwnerStack.js /Users/user/Developer/Developer/react-reference/packages/react/src/ReactClient.js /Users/user/Developer/Developer/react-reference/packages/react/src/jsx/ReactJSXElement.js /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactCurrentFiber.js /Users/user/Developer/Developer/react-reference/packages/shared/ReactComponentInfoStack.js /Users/user/Developer/Developer/react-reference/packages/shared/ReactComponentStackFrame.js
rg -n "createRoot\\(|ReactDOMRoot\\.prototype\\.render|function ReactDOMRoot|updateContainer\\(|createFiberRoot\\(|updateHostRoot|scheduleUpdateOnFiber|requestUpdateLane" /Users/user/Developer/Developer/react-reference/packages/react-dom/src/client/ReactDOMRoot.js /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberReconciler.js /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRoot.js /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberBeginWork.js /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js
rg -n "mountLazyComponent|resolveLazy|updateSuspenseComponent|throwException|attachPingListener" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberBeginWork.js /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberThenable.js /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberThrow.js /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js
node --check packages/react/children-helper.js
node --check tests/conformance/test/children-helper-currentness-gate.test.mjs
node --test tests/conformance/test/children-helper-currentness-gate.test.mjs
node --test tests/conformance/test/children-helper-currentness-gate.test.mjs tests/conformance/test/children-helper-oracle.test.mjs
npm run check --workspace @fast-react/react
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
git diff --check
```

## Risks Or Blockers

- This is private evidence only. It does not implement or admit real renderer
  portal traversal, ReactDOM portal creation, HostPortal commit behavior, ref
  attach/detach, owner stacks, root scheduling, Suspense wakeups, or public
  package compatibility.
- The new source rows intentionally overlap with renderer/root work areas only
  as blockers. Renderer-owned lanes still need to provide execution evidence
  before any public compatibility promotion.
- npm continues to print the existing `minimum-release-age` config warning
  during npm commands.

## Recommended Next Tasks

1. Add renderer-owned portal creation and HostPortal reconciliation currentness
   before promoting any portal compatibility.
2. Add a separate ref/owner stack execution lane that proves ref attach/detach
   and DEV owner stack behavior through renderer commits.
3. Keep Suspense lazy renderer wakeup evidence separate from direct
   `React.Children` lazy traversal.
