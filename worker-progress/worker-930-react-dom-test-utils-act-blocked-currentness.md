# Worker 930 - React DOM Test Utils Act Blocked Currentness

## Summary

- Added a source-owned blocked-currentness report for public
  `react-dom/test-utils.act` in
  `packages/react-dom/src/test-utils-act-gate.js`.
- The positive path is
  `createPublicReactDomTestUtilsActBlockedCurrentnessReport()` ->
  `isAcceptedPublicReactDomTestUtilsActBlockedCurrentnessReport()` ->
  `consumePublicReactDomTestUtilsActBlockedCurrentnessReport()`.
- Accepted currentness status:
  `blocked-public-react-dom-test-utils-act-unsupported-placeholder-currentness`.
  Consumption status:
  `accepted-blocked-public-react-dom-test-utils-act-currentness`.
- The report probes rootless sync, async, error, and thenable callback shapes.
  The public test-utils act placeholder still throws before invoking callbacks,
  returns no thenable, emits no warning output, and claims no public/package
  compatibility.
- The gate consumes Worker 913 public `React.act` blocked-currentness as
  background evidence and keeps accepted passive/lifecycle/root diagnostics
  private. Worker 910 is explicitly excluded.

## Changed Files

- `packages/react-dom/src/test-utils-act-gate.js`
- `packages/react-dom/test/react-dom-test-utils-act-gate.test.js`
- `tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `worker-progress/worker-930-react-dom-test-utils-act-blocked-currentness.md`

## Evidence Gathered

- Positive currentness path accepts only source-owned reports tracked by the
  gate WeakSet.
- Negative canaries reject source clones, forged public compatibility flags,
  callback invocation, thenable return, warning compatibility claims,
  Scheduler/root/passive prerequisite smuggling, Worker 910 evidence, and
  package compatibility claims.
- Public blockers remain false: public React act readiness, test-utils act
  readiness, private routing, Scheduler queue draining, React act queue
  draining, passive drain/effect execution, public root execution, renderer
  execution, warnings, and package compatibility.
- Package surface remains unchanged; new helpers are private gate exports only.

## Commands Run

- `node --check packages/react-dom/src/test-utils-act-gate.js`
- `node --check packages/react-dom/test/react-dom-test-utils-act-gate.test.js`
- `node --check tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `node --test packages/react-dom/test/react-dom-test-utils-act-gate.test.js`
- `node --test tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `node --test tests/conformance/test/react-act-public-blocked-gate.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Risks Or Blockers

- No known blockers.
- This is diagnostic/currentness evidence only. It does not execute public
  callbacks, drain Scheduler or React act queues, execute roots or passive
  effects, compare public warning behavior, or claim package compatibility.
- Overlap risk: Worker 910 remains unaccepted and is intentionally excluded;
  future private root or hydration evidence must not be consumed by this public
  act currentness gate until accepted separately.

## Recommended Next Tasks

1. Keep public `react-dom/test-utils.act` blocked until public React act,
   warning behavior, callback/thenable semantics, root execution, Scheduler
   draining, and passive effects are admitted together.
2. Re-run this gate after any merge touching Worker 913 currentness, private
   passive diagnostics, lifecycle boundaries, or React DOM test-utils package
   surface.
