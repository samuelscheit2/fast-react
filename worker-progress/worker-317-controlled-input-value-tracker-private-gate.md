# Worker 317: Controlled Input Value Tracker Private Gate

## Goal Evidence

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available after setup and again before this report.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: add a private controlled input
  value-tracker gate that records deterministic tracker metadata for
  input/select/textarea scenarios while public controlled form behavior and
  post-event restore remain blocked.
- Required docs read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`. `ORCHESTRATOR.md` was not read.

## Summary

Added a private, metadata-only controlled input value-tracker gate under the
existing React DOM resource/form internals gate. It records deterministic
records for input value, input checked, select single, select multiple, and
textarea value scenarios, including normalized prop-shape metadata, oracle
coverage, blocked post-event restore metadata, and blocked public controlled
behavior metadata.

The gate does not attach live trackers, read or write host values, patch
property descriptors, observe change events, queue post-event restore, invoke
source adapters, touch public roots, or claim compatibility. Public
resource/form/controlled entrypoints remain unsupported placeholders.

## Changed Files

- `packages/react-dom/src/resource-form-internals-gate.js`
- `packages/react-dom/src/resource-form-gates.js`
- `packages/react-dom/src/dom-host/property-payload.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/dom-property-payload-helper.test.mjs`
- `worker-progress/worker-317-controlled-input-value-tracker-private-gate.md`

## Evidence Gathered

- Worker 172 established resource/form/controlled unsupported gates and
  compatibility claims false.
- Worker 213 added the data-only style and `dangerouslySetInnerHTML` property
  payload slice while keeping controlled props unsupported.
- Worker 260 added the metadata-only resource/form internals gate.
- Worker 271 wired admitted ordinary property payload rows into the private
  fake-DOM mutation adapter while keeping controlled rows fail-closed.
- Worker 276 added the root bridge blocked boundary over the internals gate.
- React 19.2.6 reference source confirms controlled input value tracking and
  post-event restore are separate live DOM/event paths; this worker records only
  deterministic private metadata and leaves those paths blocked.

## Commands Run

- Goal tools:
  - `create_goal`
  - `get_goal`
- Context/research:
  - `sed -n` reads for required docs, worker reports 172/213/260/271/276,
    write-scope source/tests, controlled-input oracle scenarios, and focused
    React reference files.
  - `rg --files`, `rg -n`, `git status --short --untracked-files=all`, and
    `git diff` inspection commands.
- Syntax:
  - `node --check packages/react-dom/src/resource-form-internals-gate.js`
  - `node --check packages/react-dom/src/resource-form-gates.js`
  - `node --check packages/react-dom/src/dom-host/property-payload.js`
  - `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --check tests/conformance/test/dom-property-payload-helper.test.mjs`
- Focused verification:
  - `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --test tests/conformance/test/dom-property-payload-helper.test.mjs`
  - `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs tests/conformance/test/react-dom-form-actions-oracle.test.mjs tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- Broader verification:
  - `npm run check --workspace @fast-react/react-dom`
  - `npm run check:js`
  - `git add --intent-to-add worker-progress/worker-317-controlled-input-value-tracker-private-gate.md`
  - `git diff --check`

## Verification Results

- `node --check` passed for all touched JS files.
- Package-local resource/form gate passed: 11/11 tests.
- Focused DOM property payload helper passed: 18/18 tests.
- Focused resource/form/controlled conformance passed: 37/37 tests.
- `npm run check --workspace @fast-react/react-dom` passed: 16/16 package tests
  plus import-entrypoint smoke checks.
- `npm run check:js` passed, including package surface, import smoke,
  benchmark gates, all JS workspace checks, native loader checks, and 559
  conformance tests.
- `git diff --check` passed with the new worker report included via
  intent-to-add.
- npm emitted the existing `minimum-release-age` warning; it did not fail
  verification.

## Risks Or Blockers

- The value-tracker gate is private and metadata-only. It does not prove React
  DOM controlled input/select/textarea compatibility.
- Select metadata is represented as deterministic selected-option state, not a
  live DOM descriptor tracker. That is intentional while select wrapper and
  event paths remain blocked.
- The ordinary property payload helper now annotates controlled unsupported
  rows with boundary metadata, but still rejects them and the mutation adapter
  still fails before mutation.
- No blockers remain.

## Recommended Next Tasks

- Add a browser or jsdom-backed controlled form dual-run gate before enabling
  live tracker attachment or wrapper property writes.
- Add explicit change-event extraction and latest-props lookup gates before
  admitting post-event controlled restore.
- Admit controlled input, select, and textarea behavior separately, keeping
  compatibility claims false until public root rows match React DOM.
