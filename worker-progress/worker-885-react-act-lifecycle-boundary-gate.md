# Worker 885 React Act Lifecycle Boundary Gate

## Summary

- Replaced the React-minted lifecycle boundary row with a required
  React DOM private root public-facade lifecycle container snapshot from
  `packages/react-dom/src/client/root-bridge.js`.
- React private act now rejects scheduler-driven passive diagnostics unless
  they include root-bridge WeakMap-owned lifecycle evidence for the same root,
  with request identity tied to the snapshot source record and that source
  record still current for the root.
- React DOM `test-utils` now verifies the React consumption report carries the
  same root-bridge-owned lifecycle snapshot before accepting the private
  passive diagnostic route.
- Public `React.act`, `react-dom/test-utils.act`, public roots, public passive
  effect execution, Scheduler timing, renderer execution, and package
  compatibility remain blocked.

## Changed Files

- `packages/react/private-act-dispatcher-gate.js`
- `packages/react-dom/src/test-utils-act-gate.js`
- `packages/react-dom/test/react-dom-test-utils-act-gate.test.js`
- `tests/conformance/src/react-dom-source-owned-lifecycle-boundary.cjs`
- `tests/conformance/test/act-passive-local-gate.test.mjs`
- `tests/conformance/test/react-act-oracle.test.mjs`
- `tests/conformance/test/react-act-public-blocked-gate.mjs`
- `tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `worker-progress/worker-885-react-act-lifecycle-boundary-gate.md`

## Commands Run

- `node --check packages/react/private-act-dispatcher-gate.js`
- `node --check packages/react-dom/src/test-utils-act-gate.js`
- `node --check tests/conformance/src/react-dom-source-owned-lifecycle-boundary.cjs`
- `node --check packages/react-dom/test/react-dom-test-utils-act-gate.test.js`
- `node --check tests/conformance/test/react-act-public-blocked-gate.mjs`
- `node --check tests/conformance/test/act-passive-local-gate.test.mjs`
- `node --check tests/conformance/test/react-act-oracle.test.mjs`
- `node --check tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `node --test packages/react-dom/test/react-dom-test-utils-act-gate.test.js`
- `node --test tests/conformance/test/react-act-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `node --test tests/conformance/test/act-passive-local-gate.test.mjs`
- `node --test tests/conformance/test/react-act-public-blocked-gate.mjs`
- `node tests/conformance/test/react-act-public-blocked-gate.mjs`
- `node --test tests/conformance/test/private-admission-810-react-act-scheduler-diagnostics-ledger.test.mjs`
- `npm run check --workspace @fast-react/react`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence Gathered

- Positive React and React DOM private consumers now expose and validate
  `requiresSourceOwnedActiveLifecycleRequestBoundary`,
  `consumesRootLifecycleRequestBoundary`, root identity, ordering, and
  root-bridge source record evidence.
- Negative coverage rejects missing lifecycle boundaries, cloned/caller-built
  lifecycle snapshots, arbitrary lifecycle request id/sequence overrides, and
  cross-root lifecycle snapshots.
- Same-root stale lifecycle snapshots now reject after a later root.render
  update because the boundary source record must be the latest root-bridge
  request record and latest render/update record.
- Existing negative coverage continues to reject cloned top-level passive
  diagnostics, caller-built nested scheduler/passive records, missing Scheduler
  source proof, stale passive handoffs, cross-root scheduler/root rows, prose
  aliases, test-title/source-syntax aliases, and error-message aliases.
- Package surface and import smoke checks passed, confirming no public
  entrypoint or package compatibility surface was opened.

## Risks Or Blockers

- No known blockers.
- This is private diagnostic admission only. It does not execute public act,
  public root work, public passive effects, Scheduler public timing/flush
  behavior, renderer work, warnings, thenables, or package compatibility.
- Overlap risk remains with adjacent act/test-utils oracle tests and package
  private prerequisite manifests touched by other workers.

## Recommended Next Tasks

- Keep future private act consumers requiring source-owned lifecycle/request
  evidence when promoting scheduler/root metadata to current root-bound work.
- Re-run the focused act/test-utils oracle slice after merges that touch Worker
  857 passive diagnostics or Worker 874 lifecycle boundary hardening.
