# Worker 584: Resource Modulepreload Order Commit Gate

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again after verification.
- Latest recorded goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: extend private resource-map commit
  diagnostics for modulepreload/preinitModule ordering across preload,
  preinit, and script rows without DOM insertion.

## Summary

Extended the private resource-map commit gate with record-only
modulepreload/preinitModule/script ordering evidence. Commit records now carry
explicit dedupe keys and resource-map dedupe keys, and the diagnostic exposes a
deterministic module resource-map order plus grouped dedupe-key rows.

The gate now validates module commit rows before admission and rejects
conflicting duplicate records, such as classic script preload and modulepreload
records targeting the same preload map key. Non-script modulepreload rows are
kept out of script/module ordering and rejected by the commit gate.

All behavior remains private and diagnostic-only. The change does not insert
into head, mutate real or fake resource maps, start fetch/preload work, apply
fetch-priority side effects, execute scripts, mutate stylesheet/script load
state, or claim React DOM compatibility.

## Changed Files

- `packages/react-dom/src/resource-form-internals-gate.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `worker-progress/worker-584-resource-modulepreload-order-commit-gate.md`

## Evidence Gathered

- Required context read: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Worker 546 report confirmed the accepted script/modulepreload/preinitModule
  private diagnostics and the existing resource-map commit classification.
- React 19.2.6 reference source inspected locally:
  - `ReactDOMFloat.js` for public `preloadModule`/`preinitModule` dispatcher
    normalization into private `m`/`M` calls.
  - `ReactFiberConfigDOM.js` for client preload props, hoistable script maps,
    modulepreload, preinit script, and preinit module script behavior.
  - `ReactDOMFloat-test.js` for published ordering/dedupe expectations around
    script and module resources.
- Package tests now cover module resource-map order rows, grouped dedupe-key
  rows, conflict validation, malformed non-script modulepreload rejection, and
  blocked public resource/script side effects.
- Conformance tests now assert the new record-only module order/dedupe evidence
  while keeping compatibility claims false.
- No nested managed agents were spawned; no conclusions depend on delegation.

## Commands Run

- Goal tools:
  - `create_goal`
  - `get_goal`
- Syntax:
  - `node --check packages/react-dom/src/resource-form-internals-gate.js`
  - `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --check tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- Focused verification:
  - `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- Workspace:
  - `npm run check --workspace @fast-react/react-dom`
- Hygiene:
  - `git diff --check`

## Verification Results

- Touched JS/MJS syntax checks passed.
- Focused React DOM resource/form gate passed: 39/39 tests.
- Focused resource hint conformance passed: 17/17 tests.
- React DOM workspace check passed: 95/95 package tests plus import-entrypoint
  smoke. npm emitted the existing `minimum-release-age` warning.
- `git diff --check` passed.

## Risks Or Blockers

- No blockers remain.
- The new diagnostic rejects non-script `preloadModule` rows at the
  resource-map commit stage. That is intentional for this private
  script/module ordering gate; broader worker/service-worker modulepreload
  behavior still needs a separate resource-map/storage design before it can be
  admitted.
- The evidence uses opaque diagnostic resource keys only. It still does not
  prove real DOM resource-map storage, browser fetch behavior, script
  execution, stylesheet load/error behavior, or public compatibility.

## Recommended Next Tasks

- Add root-owned resource map storage before opening real modulepreload or
  preinitModule dispatch behavior.
- Add browser/DOM dual-run tests before enabling network fetches, head
  insertion, or script execution.
- Keep public resource APIs placeholder-gated until resource maps, fake/real
  head ordering, stylesheet state, and script/module execution semantics are
  admitted together.
