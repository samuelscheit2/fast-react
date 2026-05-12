# Worker 1213 React DOM test-utils act source proof

## Summary

- Hardened `validatePublicReactDomTestUtilsActBlockedCurrentnessReport()` so object-like caller reports must prove ownership through `publicTestUtilsActBlockedCurrentnessReports` before `Object.isFrozen()` or shape/property inspection.
- Preserved the existing primitive/null `public-react-dom-test-utils-act-currentness-not-frozen` rejection.
- Preserved helper-owned mutable report rejection as `public-react-dom-test-utils-act-currentness-not-frozen` after source proof succeeds.
- Added focused hostile coverage for frozen forged clone, mutable forged clone, a no-trap proxy, and helper-owned mutable report creation with `Object.freeze` temporarily bypassed.

## Changed Files

- `packages/react-dom/src/test-utils-act-gate.js`
- `packages/react-dom/test/react-dom-test-utils-act-gate.test.js`
- `worker-progress/worker-1213-react-dom-test-utils-act-source-proof.md`

## Evidence Gathered

- The prior validator checked `Object.isFrozen(report)` before `publicTestUtilsActBlockedCurrentnessReports.has(report)`, so mutable caller-shaped reports rejected as not-frozen and hostile proxies could trigger frozen/shape traps before source proof.
- The fixed order matches the accepted Worker 1207 React.act pattern: non-object reports reject as not frozen; object-like reports prove WeakSet ownership; only source-owned reports are inspected for frozen state and shape.
- The hostile proxy test asserts zero `get`, `getOwnPropertyDescriptor`, `isExtensible`, and `ownKeys` traps, proving source proof occurs before frozen-state or shape inspection.
- The helper-owned mutable test pre-creates and passes the nested public React.act blocked-currentness consumption before bypassing `Object.freeze`, so the nested React.act validator cannot fail first and the React DOM validator remains the tested boundary.
- Scout finding incorporated: mutable clone currently returns not-frozen before the reorder, and hostile proxy would throw from `Object.isFrozen`; the added tests cover that failure class.

## Compatibility Non-Claims

- No public `react-dom/test-utils.act` callback invocation support is claimed or opened.
- No thenable return support is claimed or opened.
- No public React.act or public test-utils act compatibility is claimed.
- No public Scheduler queue drain, React act queue drain, Scheduler flush helper execution, root execution, renderer execution, effect execution, or passive-effect drain is claimed.
- No package-surface change is claimed; package-surface guard passed.

## Commands Run

- `git diff --check` - passed.
- `node --check packages/react-dom/src/test-utils-act-gate.js` - passed.
- `node --check packages/react-dom/test/react-dom-test-utils-act-gate.test.js` - passed.
- `node --test packages/react-dom/test/react-dom-test-utils-act-gate.test.js` - passed, 10 tests.
- `node tests/smoke/import-entrypoints.mjs` - passed, accepted inventory and smoke checks matched.
- `npm run check --workspace react-dom` - failed before running checks because this checkout has no workspace named `react-dom`.
- `npm run check --workspace @fast-react/react-dom` - passed, 236 React DOM tests plus entrypoint smoke.
- `npm run check:package-surface` - passed.

## Risks Or Blockers

- No blockers found.
- Overlap risk is limited to nearby workers editing the same `react-dom/test-utils.act` gate or tests; preserve the source-proof-before-freeze ordering during conflict resolution.
- The no-trap proxy regression covers the top-level report object. Nested fields remain protected by existing source-owned helper reports and shape validations after top-level ownership is proven.

## Recommended Next Tasks

- Merge with adjacent React.act and React DOM act gate hardening work only after confirming conflict resolution keeps this top-level WeakSet proof before frozen-state inspection.

## Commit

- Source-proof hardening commit: `75d83fe40c69553b03ef6c0a74d4887008ca9dfb` (`Harden React DOM test-utils act source proof`).
