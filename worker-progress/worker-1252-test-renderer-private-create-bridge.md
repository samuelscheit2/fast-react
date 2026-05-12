# Worker 1252 - Test Renderer Private Create Bridge

## Summary

- Added a hidden package-root `react-test-renderer.create(...)` private bridge
  path through the existing non-enumerable root request bridge symbol.
- The bridge exposes package-root private root-create preflight and
  create-route admission, consumes source-owned admission evidence plus private
  create native host-output handoff evidence, and returns frozen evidence with
  the private root handle.
- Hardened the package-root create bridge so it revalidates source-owned
  admission consumption, requires matching embedded admission/preflight handoff
  evidence, and rejects stale request/lane metadata plus public/native/package,
  serialization, TestInstance, hidden/proxy, source-smuggled, and
  JS-produced-host-output claims.
- Public `create()`, `.root`, `toJSON`, `toTree`, `ReactTestInstance`, query
  methods, `act`, Scheduler behavior, native addon loading/execution, JS/CJS
  package compatibility, and broad renderer compatibility remain blocked.

## Changed Files

- `packages/react-test-renderer/index.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-1252-test-renderer-private-create-bridge.md`
- Existing branch history also contains a small
  `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
  fixture shape adjustment from earlier in-branch work; this final repair did
  not edit that file.

## Commands Run

- `node --check packages/react-test-renderer/index.js` - passed
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs` - passed
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs` - passed, 42/42
- `npm run check --workspace @fast-react/react-test-renderer` - passed; npm printed the existing `minimum-release-age` warning
- `npm run check:package-surface` - passed; npm printed the existing `minimum-release-age` warning
- `node tests/smoke/import-entrypoints.mjs` - passed
- `git diff --check` - passed

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, the dirty
  diff, and relevant accepted reports for Workers 539, 573, 610, 844, and 872.
- Confirmed package-root public keys and renderer method surfaces remain
  unchanged; the new bridge stays behind the existing private root request
  bridge symbol.
- Positive coverage proves the package-root bridge returns frozen private
  root-handle evidence only after consuming source-owned create-route admission
  plus matching create native host-output handoff evidence.
- Negative coverage rejects caller-shaped/cloned admission consumption,
  cross-request/stale source-owned admission, stale handoff request sequence,
  stale handoff lanes, missing embedded admission, mismatched admission
  metadata, mismatched handoff preflight lanes, public serialization aliases,
  hidden/proxy compatibility aliases, source-smuggled TestInstance claims, and
  host-output produced-from-JS aliases.
- Existing update/unmount private route behavior, lifecycle evidence
  consumption, serialization/TestInstance/act blockers, package-surface guard,
  and import smoke remain green.

## Audit/Review Or Nested-Agent Findings

- No nested agents were spawned in this final repair pass.
- The accepted Worker 539/573/610 reports shaped the required source-owned
  create preflight, work-loop finished-work, and create-route admission
  metadata checks.
- The accepted Worker 844/872 reports shaped the package-root source-owned
  evidence and public/native/package compatibility blocker expectations.

## Risks/Blockers

- No blocker remains for the assigned objective.
- This remains diagnostic evidence only: no real `.node` addon load, native
  bridge execution from JS, public serialization, public TestInstance, public
  act/Scheduler behavior, or broad renderer compatibility is claimed.
- CJS bundles were intentionally not edited for this package-root bridge path.

## Recommended Next Tasks

- Add an explicit private JSON/native transport row consumer only if a later
  worker is assigned to connect transport rows to this same private result.
- Keep public test-renderer compatibility blocked until root, serialization,
  TestInstance, act, Scheduler, and native execution semantics are promoted
  together with dual-run oracle coverage.
