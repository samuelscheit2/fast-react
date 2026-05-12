# Worker 1065 Root Render Source Scanner Repair

## Summary

- Repaired stale root-render conformance source scanners after the recent Rust
  module/test splits.
- Updated root-render diagnostics to scan split locations for portal preflight,
  sync-flush cross-root evidence, root work-loop commit handoff evidence, root
  commit handoff tests, and passive scheduler flush tests.
- Refreshed the private root-output gate note for the restored
  `flush-sync-cross-root-render` private host-output rows.

## Changed Files

- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/gates/private-root-output-gate.md`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-1065-root-render-source-scanner-repair.md`

## Verification

- `npm run root-render-e2e:conformance --workspace @fast-react/conformance`
  passed under Node 26.1.0.
- `npm run root-public-facade:conformance --workspace @fast-react/conformance`
  passed under Node 26.1.0.
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
  was updated for the current hydrateRoot replay blocker capability.
- `git diff --check` passed.

## Notes

- This repair keeps public React DOM compatibility blocked. The passing gates
  admit only private diagnostic/source evidence.
- The fix originated from scout 1065, which unexpectedly applied the scanner
  change directly in the main checkout while investigating the cross-root drift.
