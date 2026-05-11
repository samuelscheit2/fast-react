# Worker 778 Resource Root-Map Storage Preflight

## Summary

- Added a private React DOM resource root-map storage preflight gate that
  consumes an accepted private resource-map commit diagnostic and records
  root-owned `hoistableStyles` and `hoistableScripts` rows as metadata only.
- Recorded canonical root-map storage rows, skipped `preload-props` rows, root
  resource storage shape evidence, public blocker boundaries, and side-effect
  flags without creating or mutating real/fake resource maps or DOM/head nodes.
- Added validation for stale source commit ids, stale expected source rows,
  duplicate root-map storage keys, foreign root ownership, raw root/map/DOM
  targets, and public resource dispatch claims.
- Kept the change private: no public resource dispatch, DOM/head mutation,
  package export change, or package compatibility claim.

## Changed Files

- `packages/react-dom/src/resource-form-internals-gate.js`
  - Added root-map storage preflight constants, contracts, blocked
    capabilities, missing prerequisites, payload branding, gate creation,
    descriptors, unsupported error shaping, source validation, admission
    normalization, row/plan builders, and exports.
  - Added `publicResourceMapCommitBehavior: false` to the resource-map commit
    plan summary so downstream private validators can assert the public commit
    blocker directly.
- `packages/react-dom/src/resource-form-gates.js`
  - Added the root-map preflight side-effect blockers and gate descriptor to the
    root/source-adapter boundary metadata.
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - Added canonical row coverage, skipped preload-props coverage, public blocker
    assertions, stale/duplicate/foreign rejection coverage, raw target
    rejection, invalid record checks, and updated exact boundary snapshots.
  - Follow-up audit coverage added direct public-claim rejection cases for all
    root-map preflight public dispatch/compatibility claim fields, every raw
    target field blocked by the admission validator, malformed
    `expectedSourceResourceMapCommitRowIds`, and assertions that fake head state
    and package exports remain unchanged after rejection.
- `worker-progress/worker-778-resource-root-map-storage-preflight.md`
  - Recorded this handoff.

## Commands Run

- `node --check packages/react-dom/src/resource-form-internals-gate.js`
- `node --check packages/react-dom/src/resource-form-gates.js`
- `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --check tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `node tests/smoke/package-surface-guard.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence Gathered

- React reference `ReactDOMComponentTree.js` stores root resources under the
  private root resources key with `hoistableStyles` and `hoistableScripts` maps.
- React reference `ReactFiberConfigDOM.js` reads those maps for stylesheet and
  script hoistable resource work.
- Current Fast React resource-map commit diagnostics already provide
  deterministic private rows with map kinds for `hoistable-styles`,
  `hoistable-scripts`, and `preload-props`; the new preflight only derives
  metadata from those accepted rows.

## Verification

Passed:

- `node --check packages/react-dom/src/resource-form-internals-gate.js`
- `node --check packages/react-dom/src/resource-form-gates.js`
- `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --check tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - 53 tests passed.
- `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
  - 18 tests passed.
- `npm run check --workspace @fast-react/react-dom`
  - 167 package tests plus import smoke passed.
- `node tests/smoke/package-surface-guard.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

`npm` printed the existing `minimum-release-age` warning; it did not affect the
results.

## Risks Or Blockers

- No blocker remains in this worker scope.
- This is private diagnostic metadata only. It does not implement public
  resource APIs, real root resource storage, resource map mutation, DOM/head
  insertion, stylesheet load state dispatch, script/module execution, or
  package compatibility.
- The preflight depends on the current private resource-map commit row shape.
  If that contract changes, the root-map storage preflight validator and focused
  tests should be updated together.

## Recommended Next Tasks

- Keep public resource compatibility blocked until root-owned storage,
  stylesheet/script lifecycle work, public dispatcher behavior, and real DOM
  mutations are admitted together with end-to-end evidence.
- Preserve the stale, duplicate, foreign, raw-target, malformed-admission, and
  public-claim rejection tests as invariants for any future
  implementation-backed root resource path.
