# Worker 279: React Effect Hook Passive Metadata Gate

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and again before this
  report. It returned status `active`.
- Active objective recorded by `get_goal`: Tighten the public React effect-hook
  private dispatcher gate with passive/layout/insertion metadata names aligned
  to accepted reconciler effect registration and passive handoff records,
  without executing effects, scheduling public act, or claiming compatibility.

## Summary

- Added frozen package-private effect-hook metadata descriptors for
  `useEffect`, `useLayoutEffect`, `useInsertionEffect`, and
  `useImperativeHandle`.
- Aligned descriptor names with accepted reconciler records:
  `FunctionComponentEffectPhase`, `HookEffectFlags`, `FiberFlags`,
  `FunctionComponentEffectRegistration`,
  `FunctionComponentPassiveEffectMetadata`,
  `FunctionComponentPendingPassiveCommitHandoff`, and
  `FunctionComponentPendingPassiveEffectCommitRecord`.
- Routed marked private effect dispatchers through the metadata map and passed
  the descriptor as an extra private dispatcher argument. Public hook function
  names and lengths remain unchanged.
- Kept the boundary inert: no effect callback execution, no public `act`
  scheduling, no DOM/test-renderer behavior changes, and no compatibility
  claim.

## Changed Files

- `packages/react/hook-dispatcher.js`
- `tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `worker-progress/worker-279-react-effect-hook-passive-metadata-gate.md`

`packages/react/index.js` was inspected and syntax-checked but did not need a
code change.

## Evidence Gathered

- Read required project context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`; did not read `ORCHESTRATOR.md`.
- Read worker context reports 157, 173, 197, 224, 225, 250, and 251.
- Also inspected workers 220 and 248 to confirm the existing private
  `useState`/`useReducer` and `useContext` dispatcher markers were preserved.
- Inspected current `packages/react/hook-dispatcher.js`,
  `packages/react/index.js`, and
  `tests/conformance/test/react-hook-dispatcher-guard.test.mjs`.
- Checked the pinned React 19.2.6 reference source for public effect hook
  forwarding and reconciler effect registration:
  `ReactHooks.js`, `ReactFiberHooks.js`, `ReactHookEffectTags.js`, and
  `ReactFiberFlags.js`.
- Confirmed accepted reconciler metadata names in
  `crates/fast-react-reconciler/src/function_component.rs`,
  `root_commit.rs`, and `root_config.rs`.
- No nested agents were used.

## Commands Run

```sh
node --check packages/react/hook-dispatcher.js
node --check packages/react/index.js
node --check tests/conformance/test/react-hook-dispatcher-guard.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs
node tests/smoke/import-entrypoints.mjs
npm run check:js
git diff --check
```

Additional inspection commands included `sed`, `rg`, `find`, `git status
--short`, `git branch --show-current`, `git log --oneline --decorate -n 20`,
and `git diff` reads of required docs, worker reports, package files, tests,
and pinned React reference/reconciler sources.

## Verification Results

- `node --check packages/react/hook-dispatcher.js`: passed.
- `node --check packages/react/index.js`: passed.
- `node --check tests/conformance/test/react-hook-dispatcher-guard.test.mjs`:
  passed.
- `node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs`:
  passed, 11 tests.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `npm run check:js`: passed, including package surface, benchmark, workspace,
  native loader, and conformance checks. npm printed existing
  `minimum-release-age` config warnings.
- `git diff --check`: passed.

## Risks Or Blockers

- The metadata descriptors are package-private JS plumbing only. They do not
  wire a real reconciler/native dispatcher or execute hook callbacks.
- Marked private dispatchers now receive one extra metadata argument for effect
  hooks. That is intentionally private surface area, but future private
  dispatchers should treat the descriptors as data-only names until real
  hook/effect ownership is wired.
- Passive handoff metadata is present only for `useEffect`. Layout,
  insertion, and imperative-handle descriptors explicitly keep passive handoff
  record names null/empty.

## Recommended Next Tasks

- Have a future private function-component effect dispatcher consume these
  descriptors when wiring JS hook calls to the accepted render metadata helpers.
- Keep passive flush scheduling and effect callback execution in reconciler
  workers after committed hook-effect ownership and traversal are ready.
- Revisit public compatibility oracles only after function-component render,
  commit traversal, passive flushing, and renderer roots can execute real
  effects.
