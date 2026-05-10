# Worker 371: React DOM Ref Attach/Detach Order Private

## Goal Evidence

- Goal tool available: yes.
- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available immediately after setup and before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: add private React DOM ref
  attach/detach ordering diagnostics across host-output update/unmount
  canaries, proving callback identity and cleanup without public root
  execution.

## Summary

Added a private React DOM ref callback host-output ordering diagnostic layer.
The ref gate can now run multiple private host-output steps, apply step-scoped
latest-props boundaries, and record callback attach, cleanup-return detach,
callback identity changes, same-host reuse, and cleanup-return identity matches
without exposing refs, cleanup functions, host nodes, latest props, or claiming
public compatibility.

The root bridge now wraps that ref ordering snapshot with private root request
evidence and requires an update render request before a real unmount request.
The diagnostic remains record-only for public roots: no public root object is
created, no reconciler execution is admitted, no public DOM mutation is
claimed, object refs remain unwritten, and root error routing remains blocked.

## Changed Files

- `packages/react-dom/src/client/ref-callback-gate.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/dom-ref-callback-oracle.test.mjs`
- `worker-progress/worker-371-react-dom-ref-attach-detach-order-private.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read worker reports present in this checkout: 174, 245, 271, and 340.
  Reports 367, 368, and 369 were not present.
- Also inspected accepted context for workers 313, 337, 338, and 352 because
  they define the current DOM ref gate, root bridge, latest-props handoff, and
  host-output diagnostic boundaries.
- Checked React 19.2.6 reference commit ref behavior in the local reference
  clone: callback attach stores cleanup returns, cleanup detach replaces
  callback-null detach when present, and detach/attach stays commit-phase
  ordered.
- The prompt named `tests/conformance/test/react-dom-ref-callback-oracle.test.mjs`;
  the existing focused file in this checkout is
  `tests/conformance/test/dom-ref-callback-oracle.test.mjs`.

## Commands Run

```sh
create_goal
get_goal
ls
rg --files -g 'WORKER_BRIEF.md' -g 'MASTER_PLAN.md' -g 'MASTER_PROGRESS.md' -g 'worker-progress/*174*' -g 'worker-progress/*245*' -g 'worker-progress/*271*' -g 'worker-progress/*340*' -g 'worker-progress/*367*' -g 'worker-progress/*368*' -g 'worker-progress/*369*'
git status --short
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,240p' worker-progress/worker-174-ref-token-lifecycle.md
sed -n '1,260p' worker-progress/worker-245-dom-ref-callback-commit-gate.md
sed -n '1,260p' worker-progress/worker-271-dom-property-payload-mutation-adapter.md
sed -n '1,280p' worker-progress/worker-340-dom-ref-callback-private-invocation-gate.md
rg --files worker-progress | rg 'worker-(367|368|369)'
sed -n '1,320p' packages/react-dom/src/client/ref-callback-gate.js
sed -n '321,760p' packages/react-dom/src/client/ref-callback-gate.js
sed -n '760,1160p' packages/react-dom/src/client/ref-callback-gate.js
sed -n '1161,1520p' packages/react-dom/src/client/ref-callback-gate.js
sed -n '1,360p' packages/react-dom/src/client/root-bridge.js
sed -n '361,760p' packages/react-dom/src/client/root-bridge.js
sed -n '761,1240p' packages/react-dom/src/client/root-bridge.js
sed -n '1241,1720p' packages/react-dom/src/client/root-bridge.js
sed -n '1721,2200p' packages/react-dom/src/client/root-bridge.js
sed -n '2201,2460p' packages/react-dom/src/client/root-bridge.js
rg --files tests/conformance/test | rg 'ref.*callback|callback.*ref|react-dom-ref'
sed -n '1,900p' tests/conformance/test/dom-ref-callback-oracle.test.mjs
rg -n 'commitAttachRef|safelyDetachRef|refCleanup|commitLayoutEffectOnFiber' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitEffects.js
sed -n '740,920p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitEffects.js
rg -n 'safe|safelyDetachRef|Ref' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitWork.js
sed -n '1,1160p' packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --check packages/react-dom/src/client/ref-callback-gate.js
node --check packages/react-dom/src/client/root-bridge.js
node --check tests/conformance/test/dom-ref-callback-oracle.test.mjs
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test tests/conformance/test/dom-ref-callback-oracle.test.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
npm run check --workspace @fast-react/react-dom
git diff --check
git add --intent-to-add worker-progress/worker-371-react-dom-ref-attach-detach-order-private.md && git diff --check; rc=$?; git reset -- worker-progress/worker-371-react-dom-ref-attach-detach-order-private.md >/dev/null; exit $rc
get_goal
```

## Verification

- JS syntax checks passed for both touched private source files and both
  touched tests.
- Focused ref callback conformance passed: 16 tests.
- Focused React DOM root bridge package test passed: 9 tests.
- `npm run check --workspace @fast-react/react-dom` passed: 27 package tests
  plus import-entrypoint smoke. npm printed the existing
  `minimum-release-age` warning.
- `git diff --check` passed, including this report via `git add
  --intent-to-add` and reset.

## Risks Or Blockers

- This is still private diagnostic infrastructure. It does not wire public
  `react-dom/client` root execution, real reconciler commit traversal, browser
  DOM mutation, object ref writes, or root error callback reporting.
- The new diagnostic can execute callback refs only through the existing
  controlled private gate with fake host nodes. Callers must keep it behind the
  private admission boundary.
- Step-scoped latest-props updates are private component-tree metadata changes;
  they are rolled back on diagnostic construction errors, but successful
  diagnostics intentionally leave the modeled private latest-props state in
  place for the canary.

## Recommended Next Tasks

1. Feed real root commit ref metadata into this diagnostic once a DOM root
   host-output update/unmount bridge can provide ordered HostComponent records.
2. Add a private cleanup handle store so callback cleanup returns can move from
   attach records to later detach records without direct test plumbing.
3. Keep public React DOM ref compatibility blocked until public root execution,
   DOM mutation, object refs, and root error routing all match React DOM
   oracles.

## Nested Agents

- No nested agents or explorer subagents were used.
