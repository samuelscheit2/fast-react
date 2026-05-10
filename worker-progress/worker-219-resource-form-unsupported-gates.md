# Worker 219: Resource/Form Unsupported Gates

## Goal Evidence

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available and returned status `active`.
- Active objective recorded by `get_goal`: add focused fail-closed local gates
  for React DOM resource hint, form action, and controlled-control unsupported
  paths using accepted oracles, without implementing resource side effects,
  form submission, controlled value tracking, public root integration, or
  compatibility claims.

## Status

Complete after implementation and verification.

## Summary

Added a package-local React DOM gate for resource hints, form actions, and
controlled-control unsupported paths. The test reads the accepted React 19.2.6
oracle artifacts and keeps Fast React fail-closed by asserting:

- Resource hint APIs on `react-dom` and `react-dom/profiling` preserve the
  accepted public function shape while throwing Fast React unsupported errors.
- Resource hint calls do not invoke the private resource dispatcher.
- Form action APIs preserve the accepted public function shape while throwing
  without inspecting form/action arguments or invoking private form reset
  dispatchers.
- The react-server root keeps resource placeholders fail-closed and omits form
  action APIs.
- Controlled-control paths remain blocked through public `createRoot` and
  `hydrateRoot`, and React DOM `src` has no resource, form action, or
  controlled-control adapter tokens.

No resource side effects, form submission, controlled value tracking, public
root integration, or compatibility claims were implemented.

## Changed Files

- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - New package-local gate tied to the accepted resource hint, form action, and
    controlled input oracle artifacts.
- `packages/react-dom/package.json`
  - Wires the new gate into the React DOM workspace `check` and `test` scripts
    before the existing import-entrypoint smoke check.
- `worker-progress/worker-219-resource-form-unsupported-gates.md`
  - This report.

## Evidence Gathered

- Required context read:
  - `WORKER_BRIEF.md`
  - `MASTER_PLAN.md`
  - `MASTER_PROGRESS.md`
  - worker reports 059, 060, 064, 143, and 172
- Inspected React DOM public entrypoints and placeholder utilities:
  - `packages/react-dom/index.js`
  - `packages/react-dom/profiling.js`
  - `packages/react-dom/react-dom.react-server.js`
  - `packages/react-dom/client.js`
  - `packages/react-dom/placeholder-utils.js`
- Inspected accepted resource/form/controlled conformance oracle files and the
  existing unsupported conformance gates.
- The new package-local gate passed directly and through
  `npm run check --workspace @fast-react/react-dom`.
- No nested agents were spawned.

## Commands Run

- Goal tools: `create_goal`, `get_goal`
- Context and inspection:
  - `git status --short`
  - `sed` reads for required brief/master/report files
  - `find packages/react-dom -maxdepth 4 -type f | sort`
  - `rg --files packages/react-dom tests/conformance`
  - `sed` reads for React DOM entrypoints, placeholder utilities, package
    manifest, oracle targets, oracle tests, and unsupported gates
  - Node summaries of accepted resource/form/controlled oracle metadata
- Focused verification:
  - `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `npm run check --workspace @fast-react/react-dom`
  - `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
  - `node --test tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
  - `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- Required verification:
  - `npm run check:js`
  - `git diff --check`

## Verification Results

- New package-local gate passed: 5/5 tests.
- React DOM workspace check passed; npm emitted the existing
  `minimum-release-age` warning.
- Focused resource hints conformance test passed: 12/12.
- Focused form actions conformance test passed: 13/13.
- Focused controlled input conformance test passed: 12/12.
- `npm run check:js` passed, including package surface guard, import
  entrypoints, benchmark gates, all workspace JS checks, and 480 conformance
  tests. npm emitted existing `minimum-release-age` warnings.
- `git diff --check` passed after the report edit.
- No-index `git diff --check` passed for the new package-local gate file and
  this untracked report.

## Risks Or Blockers

- The package-local source-token scan is intentionally conservative. Future
  legitimate resource, form, singleton, or controlled-control implementation
  work must replace or update the gate in the same change that adds the
  prerequisite adapter tests.
- The controlled-control gate remains a local fail-closed boundary, not a
  browser DOM compatibility oracle.
- No blockers remain.

## Recommended Next Tasks

- Add DOM-effect resource and singleton oracles before enabling resource or
  singleton adapter hooks.
- Add client-owned form action and submit/reset event oracles before enabling
  form behavior.
- Add browser/jsdom-backed controlled-control oracles before enabling value
  tracking and controlled restore.
