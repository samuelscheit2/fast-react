# Worker 916: React Transition Hook Blocker Currentness

## Summary

- Added frozen `startTransition` rootless-currentness metadata in
  `packages/react/transition.js`.
- Extended private transition-hook dispatcher metadata with explicit blocker
  currentness and false compatibility flags for hook execution, public act,
  public Scheduler timing, renderer compatibility, scheduler integration, root
  lane integration, and root scheduling.
- Added focused conformance canaries proving `startTransition` keeps its
  current rootless depth/error behavior while `useTransition` and
  `useDeferredValue` remain placeholder-blocked.
- Added negative coverage for nested callback error depth restoration, source
  imports that would schedule root work, forged blocker currentness metadata,
  and compatibility flags flipped true.

## Changed Files

- `packages/react/transition.js`
- `packages/react/hook-dispatcher.js`
- `tests/conformance/test/react-transition-facade.test.mjs`
- `tests/conformance/test/react-hook-dispatcher-oracle.test.mjs`
- `worker-progress/worker-916-react-transition-hook-blocker-currentness.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md` and prior transition blocker reports for workers 183,
  557, 588, and 566.
- Inspected current `packages/react/transition.js`,
  `packages/react/hook-dispatcher.js`, `packages/react/index.js`, and focused
  transition/hook-dispatcher tests.
- Checked the React 19.2.6 reference `ReactStartTransition.js` to keep the
  public facade behavior aligned with the accepted rootless scope/error model.
- Confirmed this worker did not consume scheduler/root worker outputs beyond
  naming missing prerequisites and accepted record names already present in
  local blocker metadata.

## Commands Run

```sh
node --check packages/react/transition.js
node --check packages/react/hook-dispatcher.js
node --check tests/conformance/test/react-transition-facade.test.mjs
node --check tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
node --test tests/conformance/test/react-transition-facade.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
node --test tests/conformance/test/react-transition-facade.test.mjs tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
node tests/smoke/import-entrypoints.mjs
npm run check:package-surface
git diff --check
```

## Verification Results

- Focused transition facade conformance passed: 8 tests.
- Focused transition hook-dispatcher conformance passed: 9 tests.
- Combined focused transition/hook-dispatcher conformance passed: 17 tests.
- Import entrypoint smoke passed.
- Package surface guard passed with the existing npm
  `minimum-release-age` config warning.
- `git diff --check` passed.

## Risks Or Blockers

- No blockers.
- Public `React.startTransition` remains a rootless facade. It does not route
  through the hook dispatcher, request Scheduler lanes, mutate root lanes,
  schedule root work, execute Scheduler callbacks, or claim compatibility.
- Public `React.useTransition` and `React.useDeferredValue` remain
  createUnimplementedFunction placeholders.
- Overlap risk: active Scheduler/root/act workers may later add real
  transition-lane execution. Their changes should preserve these blocker flags
  until the public hook and renderer execution path is admitted end to end.

## Recommended Next Tasks

- Keep public transition hooks blocked until scheduler priority routing, root
  transition lane claiming, hook queue handoff, renderer execution, and public
  act timing are accepted together.
- When transition hook execution is admitted, replace these blocker/currentness
  records with source-owned execution evidence instead of flipping individual
  compatibility flags in isolation.
