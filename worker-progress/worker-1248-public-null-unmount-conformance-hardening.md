# Worker 1248 - Public Null/Unmount Conformance Hardening

## Summary

- Added explicit public-facade lifecycle rows for the accepted fake-DOM
  `root.render(null)` cleanup path and unmount-after-null idempotence path.
- Hardened validation so those rows require ordered source rows, escaped
  host-output cleanup snapshots, latest-props cleanup, repeated `render(null)`
  no-op evidence, same-root rerender after null, unmount-after-null and repeated
  unmount `undefined` returns, stale `render(null)` after unmount fail-closed
  behavior, duplicate-root cleanup, and no marker/listener/ownerDocument leaks.
- Added hostile false-green coverage for stale/missing/wrong-order rows, stale
  host output/latest props, missing or extra mutation logs, marker/listener and
  ownerDocument leaks, duplicate-root tracking drift, second-unmount throw or
  mutation, stale render-null success, and public/browser/native/root
  compatibility alias leaks.
- No runtime behavior changed.

## Changed Files

- `tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-1248-public-null-unmount-conformance-hardening.md`

## Commands Run

- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
  - First run exposed two local assertion/list expectation issues after the new
    rows; fixed and reran successfully.
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
  - Pass: 46/46.
- `npm --workspace @fast-react/conformance run root-public-facade:conformance`
  - Pass: public facade blocked gate PASS, 61 blocked public facade rows,
    failures 0.
- `node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
  - Pass: 11/11.
- `node --test packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
  - Pass: 5/5.
- `node tests/smoke/react-dom-private-root-bridge-shell.mjs`
  - Pass.
- `npm run check:package-surface`
  - Pass.
- `node tests/smoke/import-entrypoints.mjs`
  - Pass.
- `git diff --check`
  - Pass.

## Evidence Gathered

- `public-create-root-render-null-cleanup` records hostile escaped div/text
  render, first null cleanup, repeated null no-op, same-root rerender after
  null, and final null cleanup while compatibility and alias claims remain
  false.
- `public-create-root-unmount-after-null-idempotent` records render-null cleanup,
  unmount-after-null, repeated unmount, stale `render(null)` after unmount
  throwing `FAST_REACT_UNIMPLEMENTED`, duplicate-root tracking cleanup, and no
  extra mutation.
- The executable render-null test now uses the hostile escaped id/text constants
  and verifies latest-props cleanup and unchanged mutation logs around repeated
  null/unmount behavior.

## Audit / Review Notes

- No nested agents were used.
- The change stayed within the assigned conformance files plus this report.

## Risks Or Blockers

- Residual risk is limited to added conformance/test volume in an already large
  gate file.
- Browser DOM compatibility, native/N-API execution, hydration, events,
  refs, Scheduler/act/flushSync, resources/forms, controlled inputs,
  components, arrays/fragments/nested rendering, and package compatibility
  remain blocked.

## Recommended Next Tasks

- None for this worker scope.
