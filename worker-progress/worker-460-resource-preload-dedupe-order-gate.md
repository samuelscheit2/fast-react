# Worker 460: Resource Preload Dedupe/Order Gate

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: extend private resource hint
  diagnostics with preload/preinit dedupe, precedence, and head insertion order
  evidence while public resource APIs stay record-only.

## Summary

Added a private preload/preinit dedupe and head-order diagnostic gate downstream
of fake-DOM resource hint adapter admissions. The new gate accepts explicit
private adapter admission records for `preload`, `preinit-style`, and
`preinit-script`, requires opaque diagnostic resource/precedence keys, records
preload/preinit dedupe rows, planned stylesheet-precedence insertion order,
observed fake-head order rows, and blocked resource-map/precedence capabilities.

The diagnostic scans only explicitly marked deterministic fake heads. It does
not dispatch public resource hints, does not mutate real DOM, does not mutate
fake head order, does not create resource maps, does not fetch resources, and
does not claim public resource compatibility.

## Changed Files

- `packages/react-dom/src/resource-form-internals-gate.js`
- `packages/react-dom/src/resource-form-gates.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `worker-progress/worker-460-resource-preload-dedupe-order-gate.md`

## Evidence Gathered

- Required context read: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and worker reports 172, 374, 400, 432, and 440.
- Existing accepted ladder confirmed: dispatcher metadata, fake-DOM adapter
  admission, one deterministic fake insertion, head boundary update, and
  clear/retain diagnostics.
- React 19.2.6 reference source inspected:
  - `ReactFiberConfigDOM.js` keys style/script preloads under the resource keys
    later used by preinit resources, skips duplicate preloads/preinits, and
    inserts stylesheets through `insertStylesheet`.
  - `insertStylesheet` groups by first-observed `data-precedence` and inserts
    matching precedence peers before later precedence groups while appending
    non-stylesheet preloads/scripts normally.
  - `ReactDOMFloat-test.js` covers preload dedupe, preinit style/script
    behavior, existing-resource preload skips, and stylesheet precedence order.
- Two nested explorers were spawned for code/reference inspection but did not
  return usable summaries before timing out; they were closed and did not
  affect conclusions.

## Commands Run

- Goal tools: `create_goal`, `get_goal`
- Context/source inspection: `pwd`, `rg --files`, targeted `rg -n`, and
  `sed -n` reads over required briefs/reports, target source/tests, and React
  reference resource code/tests.
- Syntax checks:
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
  - `git diff --check`

## Verification Results

- Touched JS/MJS syntax checks passed.
- Package-local resource/form gate passed: 23/23 tests.
- Focused resource hint conformance passed: 14/14 tests.
- Focused resource/form/controlled conformance passed: 41/41 tests.
- React DOM workspace check passed: 54/54 package tests plus import-entrypoint
  smoke. npm printed the existing `minimum-release-age` warning.
- `git diff --check` passed with this report included via intent-to-add.

## Risks Or Blockers

- No blockers remain.
- The new dedupe/order evidence uses explicit opaque diagnostic keys because
  dispatcher metadata intentionally redacts raw URLs and values. It proves the
  private boundary shape and ordering rules without committing real resource
  records.
- Stylesheet precedence remains diagnostic-only: no querySelector,
  insertBefore, loading/error state, suspension, or public ordering behavior is
  admitted.

## Recommended Next Tasks

- Add real DOM/browser dual-run resource hint oracles before admitting public
  preload/preinit insertion behavior.
- Add a separate resource-map commit gate before creating root-owned preload,
  style, or script resource maps.
- Keep public resource APIs placeholder-gated until real resource effects and
  root integration are admitted together.
