# Worker 958 - React DOM Input/Change Extraction Currentness

## Summary

- Hardened private input/change extraction preflight so it requires
  source-owned root listener currentness evidence tied to the dispatch
  container and native event type.
- Bound controlled restore queue bridge/execution records to source-owned
  dispatch payloads, root listener currentness, and controlled restore gate
  identity.
- Added focused private and conformance coverage for missing, cloned, stale,
  cross-root, cross-dispatch, hydration/resource/form alias, browser/public
  claim, and foreign restore-gate rejection paths.
- Kept public DOM events, SyntheticEvent creation, hydration replay,
  resource/form aliases, browser DOM mutation, and public controlled-input
  compatibility blocked.

## Changed Files

- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/client/controlled-restore-queue.js`
- `packages/react-dom/test/events-private.test.js`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `worker-progress/worker-958-react-dom-input-change-extraction-currentness.md`

## Currentness Path

1. Private root listener registration mints
   `createPrivateRootListenerCurrentnessGateRecord(...)` evidence.
2. `createInputChangeEventExtractionPreflightRecord` now requires that
   evidence, rejects cloned or aliased currentness records, verifies the
   dispatch target container and event listener row are current, and stores the
   source-owned dispatch payload in a hidden WeakMap payload.
3. Controlled restore intent, bridge, write execution, flush blocker, wrapper
   intent, and input/change execution records validate source dispatch payloads
   and controlled restore queue identity before accepting the row.
4. Input/change controlled restore execution revalidates the root listener
   currentness payload before mutating only an admitted fake-DOM target.

## Evidence Gathered

- Positive private tests assert root listener currentness, latest-props
  freshness, controlled restore queue identity, source-owned dispatch payloads,
  and fake-DOM-only controlled restore execution.
- Negative coverage rejects missing currentness, cloned dispatch/preflight
  records, cloned or stale currentness, cross-root currentness, wrong native
  event type, public/browser/SyntheticEvent claims, hydration replay aliases,
  resource/form aliases, cross-dispatch restore sources, foreign restore queue
  gates, and live DOM targets before mutation.
- The resource/form unsupported gate test was updated because the package
  workspace check exercises its private input/change helper paths; those paths
  now provide the same root listener currentness evidence and expect the new
  foreign restore-gate rejection reason.

## Commands Run

- `node --check packages/react-dom/src/events/plugin-event-system.js`
- `node --check packages/react-dom/src/client/controlled-restore-queue.js`
- `node --check packages/react-dom/test/events-private.test.js`
- `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --check tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `node --check tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `node --test packages/react-dom/test/events-private.test.js`
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

All commands passed.

## Risks Or Blockers

- No blockers found.
- `packages/react-dom/test/resource-form-unsupported-gates.test.js` was touched
  outside the initial narrow write list to keep the broadened React DOM
  workspace check green after the new required currentness option.
- Public React DOM event dispatch, controlled input compatibility, resource
  hints, form actions, hydration replay, and live DOM controlled restore remain
  blocked.

## Recommended Next Tasks

- Keep future input/change bridge callers threading root listener currentness
  through source-owned records before accepting controlled restore evidence.
- Re-run the React DOM workspace check after merging nearby root listener,
  resource/form, or hydration currentness workers.
