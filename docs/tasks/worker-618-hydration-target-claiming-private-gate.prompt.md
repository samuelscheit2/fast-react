# Worker 618: Hydration Target Claiming Private Gate

## Objective

Add private hydration target-claiming diagnostics that connect marker parsing,
dehydrated ownership, and replay target metadata without public hydration.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Worker 583 accepted hydration replay target dispatch metadata.

## Write Scope

- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/src/client/hydration-marker-parser.js`
- `packages/react-dom/src/client/root-bridge.js` only for narrow metadata export
- `packages/react-dom/test/*.test.js`
- `worker-progress/worker-618-hydration-target-claiming-private-gate.md`

Do not edit event dispatch files unless a negative replay assertion is needed.

## Requirements

- Add private target-claiming metadata for one dehydrated host boundary.
- Reject stale markers, missing ownership rows, and unsupported target paths.
- Keep public `hydrateRoot` compatibility and replay queue draining blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test packages/react-dom/test/*.test.js`
- Any focused hydration conformance test touched
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`
