# Worker 810 React Act Scheduler Diagnostics Ledger

## Summary

- Added a static/read-only private-admission ledger for accepted React act and
  Scheduler diagnostic handoffs from Workers 747, 772, 773, 775, 791, 792,
  793, and 798.
- The ledger pins durable worker IDs, diagnostic IDs, statuses, evidence kinds,
  delayed renderer-root scopes, Scheduler-owned validator ownership, and public
  blocker field names.
- Validation is source-token and manifest-only. It does not load or execute
  React, React DOM, Scheduler, renderer, effects, or package runtime code.
- Public React `act`, React DOM test-utils act routing, root behavior,
  Scheduler timing/flush helpers, renderer/effects execution, package
  compatibility, and public compatibility claims remain explicitly blocked.
- Audit follow-up replaced source syntax/expression evidence tokens with
  durable identifiers, status IDs, field names, and source-owned validator
  names only.
- The ledger now rejects non-durable evidence token shapes such as object API
  call snippets, weak collection implementation shapes, source collection
  method expressions, source declarations, field-value expressions, and block
  or statement syntax.
- Re-audit follow-up replaced the blacklist-only durability rule with a
  positive allowlist: evidence tokens must be JavaScript identifiers, field or
  function names, source-owned constants, or lower-case diagnostic/status IDs.
- Prose, test-title, and error-message evidence tokens now fail closed even
  when the text exists in a source or test file.
- Second re-audit follow-up pins the exact required evidence-role manifest per
  worker and fails closed on empty, missing, duplicate, or unexpected evidence
  roles.
- The `requirements` object is schema-closed against the exact required fields;
  unexpected public or renderer-like fields such as
  `publicSchedulerFlushBehaviorExecuted` and `executesRendererRoots` now fail
  the private admission gate.
- Focused regressions now confirm the evidence allowlist rejects snippet/member
  shapes including `Scheduler,`, string-literal snippets, member expressions,
  and member-call expressions.

## Changed Files

- `tests/conformance/src/private-admission-810-react-act-scheduler-diagnostics-ledger.mjs`
- `tests/conformance/test/private-admission-810-react-act-scheduler-diagnostics-ledger.test.mjs`
- `worker-progress/worker-810-react-act-scheduler-diagnostics-ledger.md`

## Commands Run

- `node --check tests/conformance/src/private-admission-810-react-act-scheduler-diagnostics-ledger.mjs` - passed.
- `node --check tests/conformance/test/private-admission-810-react-act-scheduler-diagnostics-ledger.test.mjs` - passed.
- `node --test tests/conformance/test/private-admission-810-react-act-scheduler-diagnostics-ledger.test.mjs` - passed, 6 tests.
- `node --test tests/conformance/test/react-act-oracle.test.mjs tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs tests/conformance/test/scheduler-native-entry-oracle.test.mjs tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs` - passed, 82 tests.
- `npm run check:package-surface` - passed; npm printed the existing `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.
- Audit follow-up: attempted to read
  `/root/audit_810_react_act_scheduler_diagnostics_ledger`; the path is not
  present on this machine (`/root` does not exist).
- Audit follow-up: `node --check tests/conformance/src/private-admission-810-react-act-scheduler-diagnostics-ledger.mjs` - passed.
- Audit follow-up: `node --check tests/conformance/test/private-admission-810-react-act-scheduler-diagnostics-ledger.test.mjs` - passed.
- Audit follow-up: `node --test tests/conformance/test/private-admission-810-react-act-scheduler-diagnostics-ledger.test.mjs` - passed, 7 tests.
- Audit follow-up: `node --test tests/conformance/test/react-act-oracle.test.mjs tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs tests/conformance/test/scheduler-native-entry-oracle.test.mjs tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs` - passed, 82 tests.
- Audit follow-up: `npm run check:package-surface` - passed; npm printed the existing `minimum-release-age` warning.
- Audit follow-up: `node tests/smoke/import-entrypoints.mjs` - passed.
- Audit follow-up: `git diff --check` - passed.
- Re-audit follow-up: `node --check tests/conformance/src/private-admission-810-react-act-scheduler-diagnostics-ledger.mjs` - passed.
- Re-audit follow-up: `node --check tests/conformance/test/private-admission-810-react-act-scheduler-diagnostics-ledger.test.mjs` - passed.
- Re-audit follow-up: `node --test tests/conformance/test/private-admission-810-react-act-scheduler-diagnostics-ledger.test.mjs` - passed, 8 tests.
- Re-audit follow-up: read-only override smoke for the existing test title `scheduler mock rejects unsafe delayed renderer-root producer metadata` returned blocked status with `durableEvidenceTokensRecognized: false`.
- Re-audit follow-up: `node --test tests/conformance/test/react-act-oracle.test.mjs tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs tests/conformance/test/scheduler-native-entry-oracle.test.mjs tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs` - passed, 82 tests.
- Re-audit follow-up: `npm run check:package-surface` - passed; npm printed the existing `minimum-release-age` warning.
- Re-audit follow-up: `node tests/smoke/import-entrypoints.mjs` - passed.
- Re-audit follow-up: `git diff --check` - passed.
- Second re-audit follow-up: `node --check tests/conformance/src/private-admission-810-react-act-scheduler-diagnostics-ledger.mjs` - passed.
- Second re-audit follow-up: `node --check tests/conformance/test/private-admission-810-react-act-scheduler-diagnostics-ledger.test.mjs` - passed.
- Second re-audit follow-up: `node --test tests/conformance/test/private-admission-810-react-act-scheduler-diagnostics-ledger.test.mjs` - passed, 10 tests.
- Second re-audit follow-up: `node --test tests/conformance/test/react-act-oracle.test.mjs tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs tests/conformance/test/scheduler-native-entry-oracle.test.mjs tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs` - passed, 82 tests.
- Second re-audit follow-up: `npm run check:package-surface` - passed; npm printed the existing `minimum-release-age` warning.
- Second re-audit follow-up: `node tests/smoke/import-entrypoints.mjs` - passed.
- Second re-audit follow-up: `git diff --check` - passed.
- Second re-audit follow-up: `git diff --cached --check` - passed.

## Evidence Gathered

- Read `WORKER_BRIEF.md` and the progress reports for Workers 747, 772, 773,
  775, 791, 792, 793, and 798.
- Inspected current source identifiers in
  `packages/react/private-act-dispatcher-gate.js`,
  `packages/scheduler/unstable_mock.js`, and
  `packages/react-dom/src/test-utils-act-gate.js`.
- Inspected adjacent conformance coverage in React act, React DOM test-utils
  act, Scheduler mock delayed act/root, Scheduler mock oracle, native-entry,
  and expired-lane tests.
- The ledger evidence rows avoid prose/test-title/error-message tokens and use
  source identifiers, status IDs, diagnostic IDs, and field names instead.
- Audit follow-up confirmed the ledger source evidence token lists no longer
  contain the flagged source-syntax snippets, including object descriptor calls,
  weak collection declarations, source collection mutations, field-value
  expressions, or helper-call expressions.
- Focused negative coverage now injects those token shapes as row overrides and
  verifies the gate reports `non-durable-evidence-token-shape` while keeping
  source token presence checks separate.
- Re-audit negative coverage now injects the previously accepted Scheduler
  delayed renderer-root test title plus an existing React act gate error
  message and verifies both are rejected as
  `not-allowed-durable-token-class` without relying on missing-token behavior.
- Second re-audit coverage now removes one worker's evidence, removes a
  required evidence role from another worker, and adds an unexpected role to a
  third worker to verify the exact evidence-role manifest fails closed.
- Second re-audit coverage now injects unexpected `requirements` keys that look
  like public Scheduler flush and renderer-root admissions, and verifies the
  gate reports `requirement-field-mismatch`.
- Second re-audit coverage now injects `Scheduler,`, string-literal source
  snippets, member expressions, and member-call expressions, and verifies all
  are rejected by positive durable-token classification.

## Risks Or Blockers

- No blocker remains for this worker scope.
- Merge overlap risk remains around React act and Scheduler private diagnostic
  files because nearby workers touch the same contracts. This worker only adds
  a read-only conformance ledger and does not change runtime source.
- The ledger intentionally follows the current private diagnostic field names
  and statuses. Future private diagnostic shape changes should update the
  source ledger and focused test together.

## Recommended Next Tasks

- Re-run the focused Worker 810 ledger test and adjacent React act/Scheduler
  suite after merging branches that touch `packages/react/private-act-dispatcher-gate.js`
  or `packages/scheduler/unstable_mock.js`.
- Keep public React act/root/Scheduler/renderer/effects/package compatibility
  blocked until separate public-behavior admissions prove those surfaces.
