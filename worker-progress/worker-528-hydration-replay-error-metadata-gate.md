# Worker 528: Hydration Replay Error Metadata Gate

## Goal

- Final pane closeout observed by orchestrator: complete (tmux reported `Goal achieved`).
- Active goal status from `get_goal`: `active`
- Active goal objective from `get_goal`: Add private hydration replay error
  metadata diagnostics that connect accepted hydration replay target
  ownership/order records with root option error metadata without replaying
  real browser events or enabling hydration compatibility.

## Summary

Added a private React DOM root-bridge diagnostic for hydration replay error
metadata. The new record accepts only a private `hydrateRoot` bridge record and
hydration replay ownership diagnostics whose event queue, dehydrated target
resolution, and drain-order metadata are accepted and whose ownership rows
retain dehydrated root/boundary ownership through drain order.

The diagnostic records root option callback metadata for
`onUncaughtError`, `onCaughtError`, and `onRecoverableError` without invoking
callbacks, reporting global errors, replaying browser events, mutating DOM,
scheduling root errors, or claiming hydration compatibility. It fails closed for
empty replay targets, foreign/mismatched hydration records, unowned replay
targets, queued/replayed rows, and missing dehydrated boundary ownership.

No nested agents were used.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
  - Added `FastReactDomPrivateRootHydrationReplayErrorMetadataRecord`.
  - Added private bridge methods and exports:
    `createHydrationReplayErrorMetadataRecord`,
    `getPrivateRootHydrationReplayErrorMetadataPayload`, and
    `isPrivateRootHydrationReplayErrorMetadataRecord`.
  - Added accepted/blocked capability metadata and fail-closed validation for
    retained hydration replay ownership/order diagnostics.
- `packages/react-dom/test/hydration-boundary.test.js`
  - Added package-local coverage for the accepted metadata path and fail-closed
    unowned/empty ownership paths.
- `tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
  - Added focused conformance coverage proving the same private metadata gate
    remains record-only and callback-free.

## Evidence Gathered

- Existing hydration replay gates already produced:
  - dehydrated root/boundary owner records,
  - blocked replay target queue records,
  - drain-order rows sorted by dehydrated metadata,
  - ownership rows proving root/boundary ownership retention.
- Existing root-bridge error routing gates already preserved root option
  callbacks as metadata without public callback invocation or global reporting.
- Reference React 19.2.6 source confirms hydration replay and hydrate root root
  options are tied to the real `hydrateRoot` path, which remains unsupported in
  Fast React.

## Commands Run

Research/context:

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
git status --short
rg --files packages/react-dom/src packages/react-dom/test conformance
rg -n "hydration|replay|dehydrated|recoverable|root option|onRecoverable|onCaught|onUncaught|error metadata|listener error|private" packages/react-dom/src packages/react-dom/test conformance worker-progress -g '*.js' -g '*.md'
rg -n "queueExplicitHydrationTarget|attemptSynchronousHydration|blockedOn|onRecoverableError|onUncaughtError|onCaughtError|reportGlobalError|replay" packages/react-dom-bindings packages/react-dom -g '*.js'
```

Syntax and focused verification:

```sh
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/test/hydration-boundary.test.js
node --check tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs
node --test packages/react-dom/test/hydration-boundary.test.js
node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs
node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
npm run check --workspace @fast-react/react-dom
git diff --check
```

## Verification Results

- `node --check packages/react-dom/src/client/root-bridge.js`: passed.
- `node --check packages/react-dom/test/hydration-boundary.test.js`: passed.
- `node --check tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`: passed.
- `node --test packages/react-dom/test/hydration-boundary.test.js`: 8 passed.
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`: 12 passed.
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`: 23 passed.
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`: 30 passed.
- `npm run check --workspace @fast-react/react-dom`: 69 package tests passed and import-entrypoint smoke passed.
- `git diff --check`: passed.

## Risks Or Blockers

- This is a private metadata-only diagnostic. It does not implement hydration,
  event replay queues, event dispatch, Suspense hydration, root error updates,
  public root callbacks, or global error reporting.
- The diagnostic intentionally requires retained dehydrated ownership rows. If
  future replay diagnostics change ownership row names or status strings, this
  gate should be refreshed rather than relaxed.
- Root options are stored as private payload references for tests and diagnostics
  only; no public callback is invoked.

## Recommended Next Tasks

1. Add broader private hydration replay metadata only after more replay target
   families have accepted dehydrated ownership records.
2. Keep public `hydrateRoot` and browser event replay blocked until real
   hydratable instance ownership, scheduling, and root error routing exist.
3. Add a separate public compatibility gate when hydration replay can run
   through real DOM events and public root callbacks.
