# Worker 748: hydrateRoot Boundary Metadata Snapshot

## Summary

Extended the private `react-dom/client.hydrateRoot` facade preflight record so
it exposes the underlying unsupported hydration boundary's accepted private
metadata diagnostics snapshot.

The private hydrateRoot bridge request now carries
`acceptedPrivateMetadataDiagnostics`, `acceptedPrivateMetadataIds`, and
`acceptedPrivateMetadataGateIds` directly from the hydration boundary record.
The hydrateRoot facade preflight record mirrors the same frozen boundary-owned
snapshot. Validation now rejects hydrateRoot bridge records if the accepted
metadata diagnostics are missing, stale, from another boundary record, or claim
public compatibility. The validation now covers the umbrella public flags plus
the granular resource DOM insertion, stylesheet, form action, form reset, and
controlled input compatibility flags exposed by the hydration boundary gate.
It also validates every `metadataRows` entry against the accepted hydration
boundary metadata contracts and rejects malformed, foreign, or row-level public
compatibility claims.

Public `hydrateRoot` remains blocked. No listener attachment, marker write,
host mutation, native handoff, queue drain, event replay, public root object, or
compatibility claim was enabled.

Audit follow-ups: added focused tamper tests that temporarily load a fresh
`root-bridge.js` against a hydration-boundary stub. One fixture keeps top-level
flags false while `metadataRows[0].publicCompatibilityClaimed` is `true`; the
other keeps row-level flags clean while
`publicResourceDomInsertionCompatibilityClaimed` is `true`. The bridge rejects
both before producing a hydrateRoot request record.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-748-hydrateroot-boundary-metadata-snapshot.md`

## Commands Run

- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js --test-name-pattern "hydrateRoot|public facade"`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs --test-name-pattern "hydrateRoot|public facade"`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence

- Focused private React DOM shell test passed: 56 tests.
- Focused public facade blocked conformance test passed: 27 tests.
- `npm run check --workspace @fast-react/react-dom` passed: 159 package tests
  plus import-entrypoint smoke.
- Package surface guard passed with no export/package surface changes.
- Import entrypoint smoke passed.
- `git diff --check` passed.
- New assertions prove the hydrateRoot preflight record's
  `acceptedPrivateMetadataDiagnostics` is the same frozen object as
  `record.hydrationBoundaryRecord.acceptedPrivateMetadataDiagnostics`.
- New assertions prove the preflight metadata ids and gate ids are the same
  boundary-owned arrays, and that every exposed public compatibility flag on the
  accepted metadata diagnostic remains `false`.
- New row assertions prove each exposed metadata row matches the accepted
  metadata ids, gate ids, record types, and statuses, remains diagnostic-only
  and read-only, and keeps row-level compatibility and promotion flags `false`.
- Root bridge validation now checks accepted metadata kind, gate id, status,
  `rootRecordId`, same-boundary id snapshots, and all blocked public
  compatibility flags before admitting hydrateRoot request records.
- Root bridge validation now checks `metadataRows`, `metadataIds`, `gateIds`,
  `acceptedRecordTypes`, and `acceptedStatuses` against the accepted hydration
  boundary metadata contracts by index, and rejects row-level public
  compatibility claims.

## Risks Or Blockers

- No blockers found.
- The accepted metadata snapshot is intentionally shared by reference from the
  frozen hydration boundary record. This keeps the diagnostic stable and avoids
  inventing an independent public-compatible metadata shape.
- Public hydrateRoot behavior remains unsupported and still throws
  `FAST_REACT_UNIMPLEMENTED`.

## Recommended Next Tasks

- Keep public `hydrateRoot` blocked until a later worker proves real hydration
  root creation, marker consumption, recoverable error routing, event replay,
  queue draining, DOM mutation behavior, and React 19.2.6 compatibility.
- If a future worker adds native hydration handoff records, require a separate
  private gate rather than treating this diagnostic metadata snapshot as a
  public hydration compatibility admission.
