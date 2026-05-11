# Worker 828: hydrateRoot Text Claim Patch Bridge Execution

## Summary

- Commit: final hash recorded in the worker handoff.
- Added a private `postPreflightExecution` hydrateRoot public-facade method
  that consumes the accepted Worker 824 execution-preflight record.
- The bridge now executes the existing private hydration text-node claim patch
  path for the same hydration boundary and hydrateRoot options object.
- Added bridge-owned payload/type guards and record getters for the post-
  preflight text patch execution.
- Preserved public hydrateRoot/root object/native/reconciler/browser DOM
  mutation/listener/event replay/recoverable callback/package compatibility
  blockers while allowing only the existing private fake text-node patch.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydrate-root-text-claim-patch-bridge.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-828-hydrateroot-text-claim-patch-bridge-execution.md`

## Evidence

- The new bridge record consumes the WeakMap-owned execution-preflight payload
  and rejects cloned, foreign, wrong-stage, public-claim, stale-state, and
  wrong-options inputs.
- The text patch is produced by
  `createHydrationTextNodeClaimPatchExecutionRecord` through the owning
  hydration boundary gate.
- The bridge validates the returned patch record against the same boundary,
  accepted metadata, mismatch row, initial children, and hydration options.
- Tests assert durable status/type/gate fields and source-owned constants
  instead of relying on error message text for the new assertions.

## Verification

- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/hydrate-root-text-claim-patch-bridge.test.js`
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test packages/react-dom/test/hydrate-root-text-claim-patch-bridge.test.js`
- `node --test packages/react-dom/test/hydration-private.test.js`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test packages/react-dom/test/hydrate-root-text-claim-patch-bridge.test.js tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Risks Or Blockers

- No active blocker.
- The new method is private, but it does mutate a fake text node by design;
  consumers must keep using it only after the accepted execution preflight.

## Recommended Next Tasks

- Merge after orchestrator review with Worker 824 execution-preflight context.
- Consider a later admission row only if the orchestrator wants this private
  execution bridge represented in a broader static ledger.
