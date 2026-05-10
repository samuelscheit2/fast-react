# Worker 341: Hydration Marker Root Bridge Replay Boundary

## Goal Tool State

- `create_goal` succeeded as the first action before research, file reads,
  implementation, or verification.
- `get_goal` succeeded immediately after setup and again before this report.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: Refresh the private
  hydration marker/root bridge boundary so hydrateRoot records carry marker
  parser evidence and event replay blockers after accepted root and event
  gates, without opening public hydration.

## Summary

- Refreshed unsupported private `hydrateRoot` boundary records with a compact
  marker parser evidence record derived from the existing read-only marker
  diagnostics.
- Added deterministic event replay blocker contracts that reference the
  accepted private event dispatch blocked reason codes while keeping replay,
  explicit hydration target queues, form replay, listener installation, and
  hydration execution disabled.
- Threaded marker parser evidence and event replay blockers through private
  root bridge hydrate records and hydrate admission records, with validation
  proving they still come from the matching private hydration boundary record.
- Kept public `react-dom/client.hydrateRoot` unsupported and side-effect free.

## Changed Files

- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `worker-progress/worker-341-hydration-marker-root-bridge-replay-boundary.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 049, 169, 218, 246, 275, and 314.
- Worker reports 337 and 339 were requested if present, but no matching report
  files were present in this checkout. The corresponding task prompts were
  inspected instead.
- Inspected current private hydration, marker parser, root bridge, root
  listener, and event dispatch/plugin skeleton modules.
- Confirmed the current private event dispatch skeleton exports blocked reason
  codes for event dispatch, target resolution, and hydration replay.
- Confirmed the existing public `hydrateRoot` placeholder remains unchanged.

## Commands Run

```sh
node --check packages/react-dom/src/client/hydration-boundary-gate.js
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/test/hydration-boundary.test.js
node --test packages/react-dom/test/hydration-boundary.test.js
npm run check --workspace @fast-react/react-dom
git add --intent-to-add worker-progress/worker-341-hydration-marker-root-bridge-replay-boundary.md && git diff --check
```

## Verification

- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`:
  passed.
- `node --check packages/react-dom/src/client/root-bridge.js`: passed.
- `node --check packages/react-dom/test/hydration-boundary.test.js`: passed.
- `node --test packages/react-dom/test/hydration-boundary.test.js`: passed,
  3 tests.
- `npm run check --workspace @fast-react/react-dom`: passed, 21 package
  tests plus entrypoint smoke. npm emitted the existing unknown
  `minimum-release-age` config warning.
- `git diff --check`: passed with the new progress report included via
  intent-to-add.

## Risks Or Blockers

- Event replay remains explicitly blocked. The new records are diagnostic
  metadata only and do not create replay queues, retry hooks, explicit
  hydration targets, or dispatch routes.
- Hydration remains blocked on a real hydration root constructor, dehydrated
  HostRoot and boundary state, hydratable cursors, marker consumption, boundary
  DOM operations, and recoverable mismatch handling.
- The blocker contract imports private event dispatch blocked reason codes, so
  future event gate reshaping should update these focused hydration tests
  together.

## Recommended Next Tasks

- Keep public hydration blocked until reconciler hydration root state and DOM
  marker consumption exist.
- Add real event replay only after dehydrated root or boundary ownership can be
  produced and cleared without DOM mutation.
- When worker 337 or 339 reports are later written, reconcile this hydration
  boundary report against their accepted terminology if needed.

## Nested Agents

- None spawned.
