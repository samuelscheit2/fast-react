# Worker 901 Progress

## Summary

- Added source-owned root lifecycle request-boundary admission for private public-facade render, update, nested update, and delayed render native-handoff consumers.
- Bound render/update diagnostics to the active root/container/source request, lifecycle request version, same-container currentness, and current fake-DOM lifecycle snapshots.
- Rejected caller-supplied lifecycle boundary and lifecycle snapshot evidence before render/update diagnostics can be accepted.
- Left public createRoot/root.render/hydrateRoot/browser/native/Rust compatibility surfaces blocked; accepted capability snapshots were not changed to avoid widening conformance gate admissions.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-901-react-dom-render-lifecycle-boundary-consumer.md`

## Checks

- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js` - passed
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` - passed
- `npm run check --workspace @fast-react/react-dom` - passed
- `npm run check:package-surface` - passed
- `node tests/smoke/import-entrypoints.mjs` - passed
- `node --check packages/react-dom/src/client/root-bridge.js` - passed
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js` - passed
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` - passed
- `git diff --check` - passed

## Evidence

- Render and update diagnostics now expose `lifecycleRequestAdmission`, `lifecycleRequestBoundary`, boundary status/source-owned/current flags, and retain the WeakMap-backed boundary payload.
- Native render handoff validates the render diagnostic's lifecycle boundary and fake-DOM snapshot are still current before mirroring native handoff metadata.
- Focused tests cover cloned/caller-supplied lifecycle boundaries, caller-supplied container snapshots, cross-root lifecycle boundary evidence, and stale same-container render-native handoff evidence.

## Risks Or Blockers

- Worker 891 may overlap in `root-bridge.js` around the unmount lifecycle consumer. This change intentionally leaves unmount accepted capabilities unchanged and documents the merge overlap.
- Nested host-output update now records render and update lifecycle boundaries, but its public accepted capability list remains unchanged for conformance stability.

## Recommended Next Tasks

- When Worker 891 lands, reconcile any duplicated lifecycle helper names or unmount boundary currentness logic with the shared helpers added here.
- Add an orchestrator-level merge check that render/update/unmount diagnostics expose consistent boundary field names after worker branches are combined.
