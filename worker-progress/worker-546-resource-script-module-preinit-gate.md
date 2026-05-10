# Worker 546: Resource Script Module Preinit Gate

## Goal Evidence

- `create_goal` was called as the first action by this worker session before
  research, file reads, implementation, or verification.
- `get_goal` was available after setup and again after implementation.
- Latest recorded `get_goal` status before final closeout: `active`.
- Active goal objective from `get_goal`: add private resource diagnostics for
  script/modulepreload/preinit metadata, dedupe, and fake-head ordering without
  dispatching public resource work.

## Summary

Added private, record-only diagnostics for script, modulepreload, and
preinitModule resource metadata on top of the accepted dispatcher metadata,
fake-DOM adapter, preload/preinit order, stylesheet precedence, and
resource-map commit gates.

The diagnostic now records normalized private dispatcher shapes for
`preloadModule` (`m`) and `preinitModule` (`M`), admits their deterministic
fake-head adapter contracts, emits script/module preinit rows with opaque
dedupe keys, records script/module fake-head order, and carries explicit
blocked public dispatch flags. Resource-map commit diagnostics now classify
modulepreload rows as preload records and preinitModule rows as script records
while preserving module/classic script metadata.

All new behavior remains private and diagnostic-only. It does not fetch,
insert into real DOM, mutate fake head outside existing diagnostics, execute
scripts, install load/error handlers, mutate resource maps, or claim public
resource compatibility.

## Changed Files

- `packages/react-dom/src/resource-form-internals-gate.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `worker-progress/worker-546-resource-script-module-preinit-gate.md`

## Evidence Gathered

- Required context read: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- The prompt's `packages/react-dom/src/shared/resource-hints.js` path does not
  exist in this repo; the active resource diagnostics live in
  `packages/react-dom/src/resource-form-internals-gate.js` and are re-exported
  through `resource-form-gates.js`.
- React 19.2.6 reference source inspected locally:
  - `ReactDOMFloat.js` for public `preloadModule`/`preinitModule` validation
    and private dispatcher calls `m`/`M`.
  - `ReactFiberConfigDOM.js` for client `modulepreload`,
    `preinitScript`, and `preinitModuleScript` behavior.
  - `ReactFizzConfigDOM.js` for server-side modulepreload/preinit references.
- Package tests now cover:
  - normalized `m`/`M` dispatcher shapes and adapter contracts,
  - script/module dedupe rows and opaque dedupe keys,
  - planned and observed script/module fake-head order,
  - blocked public script/module resource dispatch flags,
  - modulepreload/preinitModule resource-map commit classification,
  - no raw href, integrity, nonce, or precedence leakage.
- Conformance tests now cover record-only script/module diagnostics in both
  preload/preinit order and resource-map commit flows.
- One inherited read-only explorer was still live when this session resumed but
  did not return usable results before implementation or verification; no
  conclusions depend on nested-agent output.

## Commands Run

- Goal tools:
  - `create_goal`
  - `get_goal`
- Syntax:
  - `node --check packages/react-dom/src/resource-form-internals-gate.js`
  - `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --check tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- Focused tests:
  - `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- Workspace check:
  - `npm run check --workspace @fast-react/react-dom`
- Hygiene:
  - `git add --intent-to-add worker-progress/worker-546-resource-script-module-preinit-gate.md`
  - `git diff --check`

## Verification Results

- Touched JS/MJS syntax checks passed.
- Focused React DOM resource/form gate passed: 35/35 tests.
- Focused resource hint conformance passed: 17/17 tests.
- React DOM workspace check passed: 78/78 package tests plus import-entrypoint
  smoke. npm emitted the existing `minimum-release-age` warning.
- `git diff --check` passed.

## Risks Or Blockers

- No blockers remain.
- The new rows intentionally model metadata only. They do not prove real React
  DOM modulepreload fetching, script execution, hoistable script ownership,
  real resource-map mutation, load/error behavior, or public API
  compatibility.
- Future workers should keep using opaque diagnostic resource keys and avoid
  retaining raw href, integrity, nonce, or precedence values.

## Recommended Next Tasks

- Add root-owned resource map storage before opening real modulepreload or
  preinitModule dispatch behavior.
- Add browser/DOM dual-run resource tests before enabling network fetches,
  real head insertion, or script execution.
- Keep public resource APIs placeholder-gated until resource maps, fake/real
  head ordering, stylesheet state, and script/module execution semantics are
  admitted together.
