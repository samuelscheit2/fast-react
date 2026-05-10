# Worker 618: Hydration Target Claiming Private Gate

## Summary

Added private hydration target-claiming diagnostics that connect accepted marker
parser rows, retained dehydrated boundary ownership rows, and hydration replay
target-dispatch link metadata. The diagnostic records one inert claim for a
direct dehydrated host boundary target while keeping public hydration, event
dispatch, queue mutation, and replay queue draining blocked.

## Goal Status Evidence

- `create_goal` was called before file reads or implementation.
- `get_goal` reported status `active` for objective:
  `Add private hydration target-claiming diagnostics that connect marker parsing, dehydrated ownership, and replay target metadata without public hydration.`

## Changed Files

- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/src/client/hydration-marker-parser.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `packages/react-dom/test/hydration-private.test.js`
- `worker-progress/worker-618-hydration-target-claiming-private-gate.md`

## What Changed

- Added stable `markerId` values to hydration marker parser rows and parser
  evidence.
- Added `FastReactDomHydrationTargetClaimingDiagnostic` plus private payload
  helpers and fail-closed validation.
- The target-claiming gate accepts one direct root-container child target inside
  a marker-owned Suspense or Activity dehydrated boundary.
- The gate rejects stale marker rows, missing retained ownership rows, and
  unsupported nested target paths.
- Re-exported only the new target-claiming metadata helpers from
  `root-bridge.js`.
- Added focused private hydration tests for the accepted claim and negative
  stale/missing/unsupported cases.

## Commands Run

- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`
- `node --check packages/react-dom/src/client/hydration-marker-parser.js`
- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/hydration-private.test.js`
- `node --test packages/react-dom/test/hydration-private.test.js`
- `node --test packages/react-dom/test/hydration-boundary.test.js`
- `node --test packages/react-dom/test/*.test.js`
- `npm run check --workspace @fast-react/react-dom`
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `git diff --check`

## Evidence Gathered

- Full React DOM package tests passed: 108 tests.
- React DOM workspace check passed, including import-entrypoint smoke checks.
- Focused hydration private and boundary tests passed.
- Focused hydration conformance test passed: 12 tests.
- `git diff --check` passed.
- The nested explorer inspected existing patterns and confirmed the diagnostic
  should follow frozen private payload-backed gates, fail closed, keep replay
  drains blocked, and add tests beside hydration target-dispatch link coverage.

## Risks Or Blockers

- The new claim intentionally supports only direct root-container child target
  paths. Nested target claiming remains unsupported until real hydration target
  traversal exists.
- Public `hydrateRoot` compatibility, host hydration, event dispatch, and replay
  queue draining remain blocked by design.

## Recommended Next Tasks

- Add execution diagnostics only after real hydration target traversal and
  boundary claim ownership exist in the renderer path.
- Extend the private target-claiming gate for nested host paths once dehydrated
  subtree ownership metadata can be represented safely.
