# Worker 642: React DOM Root Update Facade Execution

## Goal Evidence

- `create_goal` was called as the first action before file reads, research,
  implementation, or verification.
- Objective passed to `create_goal`: `Advance React DOM root.render update
  private facade execution to mutate one fake-DOM text/property path through
  accepted update evidence while public compatibility remains blocked.`
- `get_goal` was available after setup and reported status `active` for that
  objective.
- Final `get_goal` before this report also reported status `active` for the
  same objective.

## Summary

Added focused conformance coverage proving the hidden React DOM client facade
update path uses a `root.render` update record to mutate one fake-DOM
HostComponent attribute path and the attached HostText path, publishes latest
props after property/text mutation, and keeps public compatibility flags false.

Also refreshed the root-render conformance fixture expectation for the existing
private facade unmount cleanup diagnostic, whose accepted capability list now
includes root-unmount admission and fake-DOM container cleanup metadata.

No public `react-dom/client.createRoot` behavior was enabled.

## Changed Files

- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `worker-progress/worker-642-react-dom-root-update-facade-execution.md`

## Commands Run And Results

```sh
sed -n '1,220p' WORKER_BRIEF.md
git status --short
rg -n "root\\.render|private root|root-bridge|update facade|accepted update|fake-DOM|fake DOM|textContent|prop" worker-progress packages/react-dom tests/conformance -g '*.md' -g '*.js' -g '*.mjs'
```

Inspection only. Initial worktree was clean.

```sh
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/src/dom-host/mutation.js
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --check tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs
node --check tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs
```

All syntax checks passed.

```sh
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
```

Passed: 41/41 tests.

```sh
node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs
```

Passed after the fixture refresh and new update evidence test: 5/5 tests.

```sh
npm run check --workspace @fast-react/react-dom
```

Passed: 125/125 package tests plus import-entrypoint smoke. npm printed the
existing `minimum-release-age` warning.

```sh
npm run root-render-e2e:conformance --workspace @fast-react/conformance
npm run root-public-facade:conformance --workspace @fast-react/conformance
```

Both passed. Root-render reported 38 private React DOM metadata rows admitted
and 0 failures. Public facade reported 21 blocked public facade rows, 8 blocked
private bridge rows, and 0 failures.

## Evidence Gathered

- The hidden `react-dom/client` private facade adapter already separates
  record-only public-shaped `root.render` calls from explicit private execution.
- `adapter.updateHostOutput(root, nextElement)` consumes an active private
  host-output render diagnostic, calls the facade root's `render()` for the
  update request, then applies the accepted fake-DOM host-output update handoff.
- The new conformance test asserts:
  - update request type is `root.render`
  - accepted capabilities include `fake-dom-property-update`,
    `fake-dom-text-update`, and `latest-props-after-mutation`
  - exactly one mutating attribute row is applied
  - HostText text content changes to `updated conformance update`
  - latest props are published after property and text mutation
  - public root execution, browser DOM mutation, native execution, reconciler
    execution, and compatibility claims all remain false
  - public `reactDomClient.createRoot(...)` still throws
    `FAST_REACT_UNIMPLEMENTED`
- A read-only explorer subagent inspected the root bridge and confirmed the
  facade update implementation is already in `root-bridge.js`, with mutation
  performed through `applyPrivateRootHostOutputUpdateWithBridge()` and DOM host
  mutation helpers. I used that result to keep changes to conformance evidence
  rather than broadening the runtime surface.

## Risks Or Blockers

- Public React DOM compatibility remains blocked. This evidence is private
  fake-DOM only and does not prove browser DOM behavior, public root scheduling,
  reconciler traversal, hydration, listener setup, event dispatch, refs, or
  public `createRoot` behavior.
- The conformance fixture refresh for worker-512 unmount cleanup was required
  because the focused conformance test was red before this worker's new test.
  The refresh only admits existing private cleanup metadata and does not change
  public compatibility.

## Recommended Next Tasks

- Keep public root-render compatibility blocked until the public package path
  can execute createRoot/render/update through accepted runtime scheduling,
  commit, DOM mutation, listener, and cleanup paths.
- When the real public root surface is opened, preserve this hidden facade
  update evidence as a private diagnostic guard instead of treating it as a
  public browser compatibility oracle.
