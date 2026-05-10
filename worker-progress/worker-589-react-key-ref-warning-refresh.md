# Worker 589: React Key/Ref Warning Refresh

## Goal

- Active goal status recorded after setup: `active`
- Active goal objective: Refresh React element key/ref warning diagnostics after cloneElement child-array freeze parity, keeping compatibility claims narrow and false.

## Progress

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Confirmed initial worktree was clean.
- Audited React 19.2.6 source and local element-object oracle coverage for key/ref warning getter behavior across `createElement`, `cloneElement`, `jsx`, `jsxs`, and `jsxDEV`.

## Summary

- Added focused element-object scenarios for `cloneElement`, `jsx`, `jsxs`, and `jsxDEV` key/ref warning access to complement the existing `createElement` key/ref warning scenarios.
- Regenerated the React 19.2.6 element-object oracle so the checked artifact records the new React and Fast React observations.
- Tightened oracle tests to assert development getter names, `isReactWarning`, access results, console error calls, cloneElement's missing cloned `props.key` warning getter, and exact Fast React normalized matches with compatibility claims still false.
- Preserved worker 564 cloneElement child-array freeze evidence: development Fast React clone arrays remain a known mismatch and production remains an exact normalized match without compatibility claimed.
- No production code change was needed in `packages/react/element-factory.js`.

## Evidence

- React 19.2.6 source at `/Users/user/Developer/Developer/react-reference/packages/react/src/jsx/ReactJSXElement.js` shows `createElement`, `jsx`, `jsxs`, and `jsxDEV` install `props.key` warning getters when the resolved key is truthy; `cloneElement` does not reinstall a key warning getter after copying props.
- The regenerated oracle records `clone-key-ref-warning-access`, `jsx-key-ref-warning-access`, `jsxs-key-ref-warning-access`, and `jsxdev-key-ref-warning-access` as `unexpected-match-compatibility-not-claimed` for Fast React in every probe mode.
- Development comparison assertions now explicitly cover `create-key-warning-access`, `create-ref-warning-access`, `clone-key-ref-warning-access`, `jsx-key-ref-warning-access`, `jsxs-key-ref-warning-access`, and `jsxdev-key-ref-warning-access`.
- A managed read-only explorer was spawned for an independent audit but did not complete before local verification finished; it was closed and did not affect conclusions.

## Changed Files

- `tests/conformance/src/element-object-scenarios.mjs`
- `tests/conformance/src/element-object-probe-runner.mjs`
- `tests/conformance/test/element-object-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-element-object-oracle.json`
- `worker-progress/worker-589-react-key-ref-warning-refresh.md`

## Verification

- `npm run element-object:generate --workspace @fast-react/conformance` passed.
- `node --test tests/conformance/test/element-object-oracle.test.mjs` passed.
- `npm run check --workspace @fast-react/react` passed.
- `git diff --check` passed.

## Risks Or Blockers

- The oracle artifact diff is large because adding four scenarios shifts generated JSON observations across all probe modes.
- Full element-object compatibility remains unclaimed: `fastReactBehaviorCompatible`, `fullDualRunOracleExists`, package behavior compatibility, and per-comparison compatibility flags remain false.

## Recommended Next Tasks

- Continue focused element-object diagnostics only where new probes expose real mismatches; do not promote this oracle to a full compatibility claim without broader local framework coverage.
