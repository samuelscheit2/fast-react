# Worker 163: Root E2E Conformance Gate

## Goal
- Status at setup: active
- Objective: add a fail-closed conformance gate around the existing React DOM root render/update/unmount oracle so Fast React cannot accidentally claim root E2E compatibility before the internal commit/DOM path exists.

## Progress
- Initialized worker goal via create_goal and confirmed active state via get_goal.

## Summary

Added a fail-closed root render/update/unmount E2E conformance gate around the
existing React DOM 19.2.6 oracle. The gate regenerates current local Fast React
observations, compares local output to the checked React DOM oracle only for
explicitly admitted scenarios, and keeps every current root E2E scenario blocked
as unsupported placeholder behavior.

Current admission state:

- Gate id: `root-render-dual-run-gate-1`
- Admitted scenario-mode rows: 0
- Blocked unsupported scenario-mode rows: 20
- Compatibility claimed: false

No React DOM implementation or Rust code was changed.

## Changed Files

- `tests/conformance/src/react-dom-root-render-e2e-targets.mjs`
- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/scripts/check-react-dom-root-render-e2e-conformance.mjs`
- `tests/conformance/package.json`
- `worker-progress/worker-163-root-e2e-conformance-gate.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md` after goal setup.
- Read prior root E2E oracle and gate-refresh notes:
  `worker-progress/worker-121-root-render-e2e-oracle.md` and
  `worker-progress/worker-137-conformance-benchmark-refresh.md`.
- Confirmed the checked oracle currently records 10 scenarios in each of
  `default-node-development` and `default-node-production`, and every current
  Fast React comparison is `unsupported-placeholder`.
- Confirmed the existing root oracle test still passes after adding the
  non-serialized gate metadata.
- No nested subagents were used.

## Verification

Passed:

```sh
node --check tests/conformance/src/react-dom-root-render-e2e-targets.mjs
node --check tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs
node --check tests/conformance/scripts/check-react-dom-root-render-e2e-conformance.mjs
node --test tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs
npm run root-render-e2e:conformance --workspace @fast-react/conformance
tmp=$(mktemp); node tests/conformance/scripts/generate-react-dom-root-render-e2e-oracle.mjs > "$tmp"; cmp tests/conformance/oracles/react-19.2.6-react-dom-root-render-e2e-oracle.json "$tmp"; rm -f "$tmp"
npm run test:conformance
npm run check:js
git diff --check
```

Results:

- Focused gate: PASS, with 0 admitted rows, 20 blocked unsupported rows, and 0
  failures.
- Focused root oracle test: 11 tests passed.
- Full conformance: 427 tests passed.
- JS check: passed, including benchmark and conformance workspace checks.
- Oracle regeneration byte-compare: passed.
- `git diff --check`: passed after marking new files intent-to-add so they were
  included in whitespace checks.

## Risks Or Blockers

- The current gate intentionally admits no root E2E scenarios. It is a harness
  and admission guard, not compatibility proof.
- The focused gate regenerates current observations, which requires network
  access to the pinned npm tarballs through the existing oracle generator.
- Future root compatibility work must update the admission metadata only after
  the internal reconciler commit and DOM mutation path exists; otherwise the gate
  will keep treating local output as blocked unsupported behavior.

## Recommended Next Tasks

- After the internal root commit/DOM path lands, admit scenarios incrementally in
  `REACT_DOM_ROOT_RENDER_E2E_LOCAL_FAST_REACT_BEHAVIOR` and use
  `npm run root-render-e2e:conformance --workspace @fast-react/conformance` to
  compare admitted rows against the React DOM 19.2.6 oracle.
- Keep benchmark admission blocked until this gate has admitted and matched all
  required root render/update/unmount scenarios in both probe modes.
