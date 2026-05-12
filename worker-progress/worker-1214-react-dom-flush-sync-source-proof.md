# Worker 1214 - React DOM flushSync Source Proof

## Summary

Hardened the public `react-dom` / `react-dom/profiling` `flushSync`
blocked-currentness report validator so top-level report ownership is proven
with `publicFlushSyncBlockedCurrentnessReports` before any frozen-state, shape,
or source-row inspection. Non-object and null inputs still reject as
`public-react-dom-flush-sync-currentness-not-frozen`.

Nested `sourceRows` validation was left separate and unchanged; it already has
its own source-proof path and override/proxy coverage.

## Changed Files

- `packages/react-dom/src/shared/flush-sync-guard.js`
- `packages/react-dom/test/react-dom-flush-sync-guard.test.js`
- `worker-progress/worker-1214-react-dom-flush-sync-source-proof.md`

## Implementation Notes

- Reordered `validatePublicReactDomFlushSyncBlockedCurrentnessReport` from
  object/frozen first to object-like, top-level WeakSet source proof, then
  frozen-state inspection.
- Added hostile top-level report coverage:
  - frozen forged clone rejects with
    `public-react-dom-flush-sync-currentness-source-proof`
  - mutable forged clone rejects with
    `public-react-dom-flush-sync-currentness-source-proof`
  - hostile proxy rejects with source-proof and records zero `get`, `ownKeys`,
    `getOwnPropertyDescriptor`, and `isExtensible` traps
  - helper-owned report created while `Object.freeze` is bypassed rejects as
    `public-react-dom-flush-sync-currentness-not-frozen`

## Commands And Outcomes

- `node --check packages/react-dom/src/shared/flush-sync-guard.js` - passed
- `node --check packages/react-dom/test/react-dom-flush-sync-guard.test.js` - passed
- `node --test packages/react-dom/test/react-dom-flush-sync-guard.test.js` - passed, 4 tests
- `git diff --check` - passed
- `npm run check --workspace react-dom` - failed: npm reported no workspace named `react-dom`
- `npm run check --workspace @fast-react/react-dom` - passed, 236 package tests plus import smoke
- `npm run check:package-surface` - passed
- `node tests/smoke/import-entrypoints.mjs` - passed

## Compatibility Non-Claims Preserved

- No callback invocation was opened for public `flushSync`.
- No thenable return compatibility or return-value compatibility was claimed.
- No public root, Scheduler, act, renderer, effect, native, or DOM mutation
  execution path was opened.
- No public `react-dom` or `react-dom/profiling` compatibility claim was added.
- No package surface change was made.

## Evidence Gathered

- Focused tests prove unowned object-like top-level reports are rejected by
  source proof before freeze/shape/source-row access.
- The helper-owned mutable report proves source-owned reports still advance to
  frozen-state rejection after source proof succeeds.
- Package surface and import-entrypoint smoke checks remained unchanged.

## Risks Or Blockers

- No blocker remains. The change is intentionally scoped to the top-level
  public flushSync blocked-currentness gate.
- Potential overlap risk is limited to concurrent edits in the same guard/test
  files; this isolated worktree had no unrelated local changes.

## Recommended Next Tasks

- Orchestrator should merge alongside the other accepted source-proof-before-
  freeze hardening workers and watch for conflict resolution in the shared
  flush-sync guard tests.

## Final Commit

- Substantive implementation commit:
  `9ef36d3e6044827f67438dc0e3c4abc20e9788fb`
- This report was updated after the implementation commit to record the hash;
  the final branch `HEAD` is reported in the worker handoff.
