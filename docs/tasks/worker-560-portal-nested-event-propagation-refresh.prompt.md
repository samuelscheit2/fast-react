# Worker 560: Portal Nested Event Propagation Refresh

## Objective

Refresh private portal nested event propagation diagnostics for owner-root and
portal-container paths without enabling public portal event bubbling.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted portal event owner-root, portal error routing, and broader event
type diagnostics.

## Write Scope

- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/client/root-bridge.js` only if portal root metadata
  must be read
- Focused portal/event package and conformance tests
- `worker-progress/worker-560-portal-nested-event-propagation-refresh.md`

## Requirements

- Record portal owner root, event path, nested portal container identity, and
  blocked public bubbling/dispatch flags.
- Keep listener invocation, global error reporting, and compatibility claims
  blocked.

## Verification

- Focused portal/event tests
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

