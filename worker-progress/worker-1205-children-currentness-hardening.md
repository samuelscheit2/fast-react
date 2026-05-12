# Worker 1205 Children Currentness Hardening

## Summary

Implemented one narrow false-green hardening for the private Children traversal currentness gate.

Found one concrete false-green gap: `createChildrenTraversalCurrentnessReport()` adds the returned report to the private `childrenTraversalCurrentnessReports` WeakSet after calling `freezeRecord()`, but `validateChildrenTraversalCurrentnessReport()` did not require the report itself, or the per-report `behaviorCurrentness` evidence object, to be frozen. If `Object.freeze` is tampered during creation, a mutable helper-created report passed source proof and exact-shape validation.

The validator now rejects non-frozen currentness reports with `children-traversal-currentness-not-frozen` and rejects non-frozen `behaviorCurrentness` evidence through the existing `children-traversal-currentness-behavior-probes` path. Focused negative tests create helper-owned reports while temporarily bypassing `Object.freeze` and prove those reports fail closed with all public compatibility flags still false through `assertCurrentnessRejected()`.

Repair after source audit: the first hardening checked `Object.isFrozen(report)` before source proof. That changed forged mutable caller-shaped objects from `children-traversal-currentness-source-proof` to `children-traversal-currentness-not-frozen`, and let hostile proxies throw from `Object.isFrozen` before the currentness gate could reject them. The validator now checks `childrenTraversalCurrentnessReports.has(report)` before `Object.isFrozen(report)`, so caller-shaped evidence fails source proof first while helper-owned mutable reports still fail with `children-traversal-currentness-not-frozen`.

## Evidence Gathered

- Read `WORKER_BRIEF.md`.
- Confirmed assigned worktree `/Users/user/Developer/Developer/fast-react-worktrees/worker-1205-children-currentness-hardening` on branch `worker/1205-children-currentness-hardening`.
- Inspected `packages/react/children-helper.js` currentness metadata, report creation, validation, consumption, `ownDataPropertyKeysEqual`, and direct Children traversal behavior probes.
- Inspected `tests/conformance/test/children-helper-currentness-gate.test.mjs` metadata assertions, public-root privacy checks, negative currentness gate tests, and public compatibility false-flag assertions.
- Probed the identified gap with a one-off Node script that temporarily replaced `Object.freeze` with identity during report creation. The resulting report and `behaviorCurrentness` were not frozen, but current validation returned `null` and `isChildrenTraversalCurrentnessReport()` returned `true`.
- Source audit found that the first hardening inspected caller-shaped objects with `Object.isFrozen()` before proving helper ownership.
- Added regression coverage for a mutable forged report and a hostile forged `Proxy` whose traps throw if validation inspects it before WeakSet source proof.

## Changed Files

- `packages/react/children-helper.js`
- `tests/conformance/test/children-helper-currentness-gate.test.mjs`
- `worker-progress/worker-1205-children-currentness-hardening.md`

## Commands Run

- `pwd && git status --short --branch`
- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' packages/react/children-helper.js`
- `sed -n '260,620p' packages/react/children-helper.js`
- `sed -n '620,1080p' packages/react/children-helper.js`
- `sed -n '1080,1480p' packages/react/children-helper.js`
- `sed -n '1460,1680p' packages/react/children-helper.js`
- `sed -n '1680,1840p' packages/react/children-helper.js`
- `sed -n '1840,2120p' packages/react/children-helper.js`
- `sed -n '1,320p' tests/conformance/test/children-helper-currentness-gate.test.mjs`
- `sed -n '320,760p' tests/conformance/test/children-helper-currentness-gate.test.mjs`
- `sed -n '760,1180p' tests/conformance/test/children-helper-currentness-gate.test.mjs`
- `sed -n '1180,1320p' tests/conformance/test/children-helper-currentness-gate.test.mjs`
- `sed -n '1320,1500p' tests/conformance/test/children-helper-currentness-gate.test.mjs`
- `rg -n "Currentness|currentness|compatibilityClaimed|isChildrenTraversalCurrentnessReport|validateChildrenTraversalCurrentnessReport|consumeChildrenTraversalCurrentnessReport|privateChildrenTraversalCurrentnessMetadata" packages/react tests/conformance/test/children-helper-currentness-gate.test.mjs`
- `rg -n "function (create|validate|is|consume)ChildrenTraversalCurrentnessReport|childrenTraversalCurrentnessReports|childrenTraversalCurrentnessReport|currentnessReport|hasSame|freezeRecord|freezeRecordArray|normalizeChildrenTraversalCurrentnessOverrides|OverrideKeys" packages/react/children-helper.js`
- `rg -n "function ownDataPropertyKeysEqual|function arraysEqual|function shallowRecordEqual|function hasSame|Reflect.ownKeys|Object.keys|Object.getOwnProperty" packages/react/children-helper.js packages/react/hook-dispatcher.js`
- `node - <<'NODE' ... Object.freeze tamper probe ... NODE`
- `node --test tests/conformance/test/children-helper-currentness-gate.test.mjs`
- `git diff -- packages/react/children-helper.js tests/conformance/test/children-helper-currentness-gate.test.mjs worker-progress/worker-1205-children-currentness-hardening.md`
- `git status --short`
- `node --test tests/conformance/test/children-helper-oracle.test.mjs`
- `npm run check --workspace @fast-react/react`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- Repair pass:
- `git status --short --branch`
- `sed -n '1464,1620p' packages/react/children-helper.js`
- `sed -n '820,900p' tests/conformance/test/children-helper-currentness-gate.test.mjs`
- `sed -n '1,220p' worker-progress/worker-1205-children-currentness-hardening.md`
- `node --test tests/conformance/test/children-helper-currentness-gate.test.mjs`
- `node --test tests/conformance/test/children-helper-oracle.test.mjs`
- `npm run check --workspace @fast-react/react`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- `git diff -- packages/react/children-helper.js tests/conformance/test/children-helper-currentness-gate.test.mjs worker-progress/worker-1205-children-currentness-hardening.md`
- `git status --short`

## Verification Results

- `node --test tests/conformance/test/children-helper-currentness-gate.test.mjs` passed: 5 tests.
- `node --test tests/conformance/test/children-helper-oracle.test.mjs` passed: 13 tests.
- `npm run check --workspace @fast-react/react` passed. npm emitted the existing `minimum-release-age` config warning.
- `npm run check:package-surface` passed. npm emitted the existing `minimum-release-age` config warning.
- `node tests/smoke/import-entrypoints.mjs` passed.
- `git diff --check` passed.
- Repair verification repeated all required commands after the validation-order fix:
- `node --test tests/conformance/test/children-helper-currentness-gate.test.mjs` passed: 5 tests.
- `node --test tests/conformance/test/children-helper-oracle.test.mjs` passed: 13 tests.
- `npm run check --workspace @fast-react/react` passed. npm emitted the existing `minimum-release-age` config warning.
- `npm run check:package-surface` passed. npm emitted the existing `minimum-release-age` config warning.
- `node tests/smoke/import-entrypoints.mjs` passed.
- `git diff --check` passed.

## Risks / Blockers

- Public package compatibility, renderer/root/portal execution, owner/ref integration, Suspense/lazy renderer, and package-wide React behavior remain blocked.
- The task allows no oracle JSON, generator/probe, public export, or unrelated test changes.
- This hardening does not broaden public `React.Children` compatibility and does not change package exports.

## Recommended Next Tasks

- Continue auditing other private currentness gates for the same immutability precondition if they do not already reject non-frozen source-owned reports.
- Keep renderer/root/portal execution, owner/ref integration, Suspense/lazy renderer, public package compatibility, and package-wide React behavior blocked until separately source-owned and verified.

## Commit

- Implementation commit: `bcb3fb84c3eb98e21f66ce2eff80f06fdadbc1d8`.
- Repair commit: `832dba1c1250dd131fd7500e123bc763f6747963`.
