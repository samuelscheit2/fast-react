# Worker 891: React DOM root.unmount lifecycle consumer

## Summary

- Added a private `react-dom/client` public-facade `root.unmount()` lifecycle execution evidence record.
- The unmount cleanup diagnostic now requires source-owned lifecycle execution evidence before cleanup metadata is accepted.
- The consumer validates current root/container identity, request id/sequence, lifecycle request version, active host-output handoff, source-owned frozen rows, same entrypoint, current source snapshots, and replay rejection.
- Public `createRoot`, `root.render`, `root.unmount`, native/Rust execution, browser DOM compatibility, hydration, resources/forms, refs/events, and package compatibility remain blocked.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`

## Evidence

- Default `root.unmount()` cleanup diagnostics now expose and consume `rootUnmountLifecycleExecutionRecord`.
- Custom unmount lifecycle execution factories can create source-owned lifecycle rows and records.
- Negative coverage rejects caller-built lifecycle rows, cloned records, cross-root records, stale records, alias claim rows, and replayed consumed records before the private root is retired.
- The accepted record and payload expose source ownership, request-boundary currentness, snapshot ownership, same-entrypoint identity, blocked execution flags, and consumed state.

## Commands Run

- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Risks And Blockers

- `root-bridge.js` is an active overlap area for Workers 887 and 885; this change is scoped to the public-facade unmount lifecycle evidence path and may need a merge pass if act lifecycle work edits nearby option or cleanup code.
- The new consumer deliberately does not add public package surface or public root behavior.

## Recommended Next Tasks

- Merge with any Worker 887/885 lifecycle edits and rerun the focused bridge/conformance checks.
- Consider a later small refactor to share lifecycle expected-source helpers between render update and unmount consumers if more lifecycle consumers are added.
