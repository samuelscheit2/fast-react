# Worker 887 - HydrateRoot Lifecycle Boundary Admission

## Summary

- Added a private hydrateRoot lifecycle request-boundary record in `root-bridge.js`.
- Threaded the boundary through hydrateRoot marker/listener, target-claiming, event-replay, execution-preflight, and text-claim patch execution records.
- The text-claim patch now validates source-owned active lifecycle boundary evidence and the original lifecycle container snapshot before applying the fake text-node write.
- Added same-container currentness tracking so a newer hydrateRoot request invalidates older lifecycle boundary/preflight/text-patch evidence before fake text mutation.
- Added runtime negative coverage for cloned lifecycle boundaries, cloned lifecycle snapshots, foreign lifecycle boundaries, source-token string aliases, stale marker/listener state, newer same-container hydrateRoot requests, and unchanged fake text before accepted execution.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydrate-root-text-claim-patch-bridge.test.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-887-hydrateroot-lifecycle-boundary-admission.md`

## Evidence

- The lifecycle boundary is WeakMap-backed and tied to the exact hydrateRoot request admission, bridge, request record, hydration boundary record, container, and source-owned lifecycle container snapshot.
- The currentness guard records the latest lifecycle request boundary per container in both the active preflight state and module-level container WeakMap, then requires exact boundary identity plus request id, request sequence, and hydrate id before any later stage can consume the evidence.
- The lifecycle container snapshot preserves the active host output `nodeSnapshot` and adds text-content evidence; its JSON diagnostics stay limited to child-count, marker/listener state, and text content so raw DOM-like node cycles are not serialized.
- Each hydrateRoot preflight stage retains the same lifecycle boundary while keeping public hydrateRoot, root object, native, reconciler, browser DOM mutation, event replay, callback, and compatibility claims blocked.
- The final text patch rejects caller-built/cloned lifecycle records and snapshots, foreign-root boundary evidence, string/source-token aliases, and stale same-container request order before the fake text node is mutated.

## Checks

- `node --check packages/react-dom/src/client/root-bridge.js && node --check packages/react-dom/test/hydrate-root-text-claim-patch-bridge.test.js && node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js && node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test packages/react-dom/test/hydrate-root-text-claim-patch-bridge.test.js`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js packages/react-dom/test/hydration-private.test.js packages/react-dom/test/hydration-boundary.test.js tests/conformance/test/private-admission-806-hydrateroot-preflight-ledger.test.mjs tests/conformance/test/private-admission-849-hydrateroot-text-patch-ledger.test.mjs tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`
- `node --test packages/react-dom/test/hydrate-root-text-claim-patch-bridge.test.js tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs tests/conformance/test/private-admission-806-hydrateroot-preflight-ledger.test.mjs tests/conformance/test/private-admission-849-hydrateroot-text-patch-ledger.test.mjs`
- `node --test tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Risks Or Blockers

- `root-bridge.js` is high-overlap with other active workers; merge review should keep the hydrateRoot lifecycle boundary fields aligned with any concurrent root facade changes.
- This is private hardening only and does not claim public `hydrateRoot`, public root compatibility, native/Rust execution, or browser DOM hydration.

## Recommended Next Tasks

- Keep future hydrateRoot evidence consumers requiring `lifecycleRequestBoundary` before treating private hydration rows as root-bound mutation evidence.
- If the static private-admission ledgers are expanded for Worker 887, include the new lifecycle boundary record type, status, and capability ids as required tokens.
