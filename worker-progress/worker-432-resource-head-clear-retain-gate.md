# Worker 432: Resource Head Clear/Retain Gate

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: add private resource head
  clear/retain diagnostics for singleton and resource hint rows, including
  deterministic blocked capabilities for stylesheet precedence.

## Summary

Added a private resource head clear/retain diagnostic downstream of the existing
fake-DOM resource insertion and head boundary gates. The new gate accepts one
private head-boundary record, scans an explicitly marked deterministic fake
head, emits singleton and resource-hint clear/retain rows, and records
deterministic blocked capabilities for head child removal, resource hoistable
retention, stylesheet precedence ordering, real head mutation, and public
resource/singleton compatibility.

No public resource hints, real document head mutation, real singleton
acquire/release, resource fetch, stylesheet precedence insertion, or public
compatibility claim was added.

## Changed Files

- `packages/react-dom/src/resource-form-internals-gate.js`
  - Added the private head clear/retain gate, record type, side-effect metadata,
    blocked capabilities, stylesheet precedence boundary, validation, error
    shape, and exports.
- `packages/react-dom/src/resource-form-gates.js`
  - Propagated the new blocked clear/retain metadata through the resource/form
    root boundary and source-adapter boundary summaries.
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - Added focused coverage for singleton/resource clear-retain rows, no fake or
    real head clearing, no raw resource or precedence value retention,
    deterministic stylesheet-precedence blocked capabilities, and root-boundary
    blocked metadata propagation.
- `tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
  - Extended the private fake-DOM resource diagnostic gate with clear/retain
    and stylesheet precedence blocked-capability assertions.
- `worker-progress/worker-432-resource-head-clear-retain-gate.md`
  - This report.

## Evidence Gathered

- Required context read: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and worker reports 219, 343, 374, 400, and 412.
- React 19.2.6 reference source inspected:
  - `ReactFiberConfigDOM.js` singleton release calls for preamble head
    contributions call `clearHead(head)`.
  - `clearHead` retains marked hoistables, scripts, styles, and stylesheet
    links while removing other head children.
  - Stylesheet precedence insertion uses per-root precedence maps and
    `querySelectorAll`/`insertBefore` ordering paths, which remain blocked here.
- Existing gates confirmed the accepted ladder: dispatcher metadata, fake-DOM
  adapter admission, one deterministic insertion, and head-boundary update.
- No nested agents were spawned.

## Commands Run

- Goal tools:
  - `create_goal`
  - `get_goal`
- Context and inspection:
  - `pwd`
  - `git status --short`
  - `rg --files`
  - `git status --short`
  - `sed -n` reads for required brief/master/report files and target files
  - targeted `rg -n` scans over React DOM resource/singleton/head references
  - `git diff` and `git diff --stat` review for touched files
- Syntax:
  - `node --check packages/react-dom/src/resource-form-internals-gate.js`
  - `node --check packages/react-dom/src/resource-form-gates.js`
  - `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --check tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- Focused tests:
  - `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
  - `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs tests/conformance/test/react-dom-form-actions-oracle.test.mjs tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- Workspace:
  - `npm run check --workspace @fast-react/react-dom`
  - `git add --intent-to-add worker-progress/worker-432-resource-head-clear-retain-gate.md`
  - `git diff --check`

## Verification Results

- JS syntax checks passed for all touched JS/MJS files.
- Package-local resource/form gate passed: 21/21 tests.
- Resource hint conformance gate passed: 13/13 tests.
- Focused resource/form/controlled conformance passed: 39/39 tests.
- React DOM workspace check passed: 44/44 package tests plus import-entrypoint
  smoke. npm emitted the existing `minimum-release-age` warning.
- `git diff --check` passed with this report included via intent-to-add.

## Risks Or Blockers

- No blockers remain.
- The clear/retain gate is diagnostic-only and does not remove even fake head
  children. Future work that admits actual fake or real clearing must add
  dedicated mutation evidence in the same change.
- Resource hint retain behavior remains blocked because the fake insertion gate
  does not apply React's internal hoistable marker.
- Stylesheet precedence remains blocked metadata only; no precedence map,
  document query, insertion ordering, loading, or suspended commit behavior is
  admitted.

## Recommended Next Tasks

- Add a dedicated private hoistable-marker retain gate before treating inserted
  fake resources as retained by `clearHead` policy.
- Add real React DOM/browser dual-run resource and singleton oracles before
  enabling public resource hints or public head singleton behavior.
- Add a separate stylesheet precedence ordering gate before admitting fake or
  real precedence-managed stylesheet insertion.
