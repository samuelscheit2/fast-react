# Worker 396 - React DOM Host Output Attribute Update Gate

## Goal

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available after setup and returned status `active`.
- Active goal objective recorded from `get_goal`: "Extend the private React DOM
  host-output update handoff to cover ordinary attribute/style update and
  removal rows backed by property-payload evidence, while keeping browser DOM
  compatibility, events, refs, hydration, and public roots blocked."
- `update_goal(status: "complete")` was called after implementation,
  verification, and report writing; the tool reported time used: 576 seconds.
- No nested managed agents were spawned.

## Summary

Extended the private React DOM host-output update handoff so a later private
`root.render` can apply property-backed fake-DOM HostComponent updates without
requiring a HostText update canary. The bridge now accepts property-only
attribute/style update and removal rows when children text remains stable,
publishes latest props after the admitted property mutation, and records
sanitized property-payload evidence counts on the handoff.

The DOM latest-props mutation path now admits reversible style set/remove rows,
including rollback support, while `dangerouslySetInnerHTML`, controlled form
props, document-resource hosts, invalid style rows, events, refs, hydration,
browser DOM compatibility, and public root execution remain blocked.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/src/dom-host/property-payload.js`
- `packages/react-dom/src/dom-host/mutation.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/dom-property-payload-helper.test.mjs`
- `tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `worker-progress/worker-396-react-dom-host-output-attribute-update-gate.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and worker reports 186, 213, 271, 337, 368, and 375.
- Confirmed the existing bridge update handoff required `textUpdate` and only
  published latest props through ordinary attribute/property plus non-payload
  rows.
- Confirmed worker 213 had property-payload style rows and worker 271 had an
  admitted style applier, but latest-props publication still blocked style rows.
- Used the existing React DOM reference evidence from worker 368: property
  mutation happens before latest-props publication, with text mutation still
  private and fake-DOM-only here.
- Focused tests now prove:
  - latest-props handoff accepts style update/removal rows;
  - style rows roll back with attribute rows on later mutation failure;
  - private root host-output update admits attribute/style set and removal rows
    without a text canary when text children are stable;
  - public `react-dom/client` placeholders remain inert.

## Implementation Notes

- Added `isStylePropertyPayloadEntry` to the private property-payload helper.
- Extended latest-props-safe mutation rows to include `setStyle` and
  `removeStyle`, with style rollback snapshots for property assignment and
  `style.setProperty` rows.
- Kept `setInnerHTML` out of latest-props-safe mutation rows.
- Made root-bridge host-output text updates optional. Without text metadata,
  previous and next primitive children must be stable, and at least one
  mutating property-payload row is required.
- Added sanitized property-payload evidence counts to the root host-output
  update record; raw props, fake nodes, and mutation records stay hidden in
  WeakMap payloads.

## Commands Run

- Goal tools: `create_goal`, `get_goal`, `update_goal(status: "complete")`
- Context/research: `rg --files`, `git status --short`, `sed -n`, `rg -n`,
  and `git diff` over required docs, worker reports, source, and tests
- Syntax:
  - `node --check packages/react-dom/src/client/root-bridge.js`
  - `node --check packages/react-dom/src/dom-host/property-payload.js`
  - `node --check packages/react-dom/src/dom-host/mutation.js`
  - `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
  - `node --check tests/conformance/test/dom-property-payload-helper.test.mjs`
  - `node --check tests/smoke/react-dom-mutation-adapter-shell.mjs`
- Focused tests:
  - `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
  - `node --test tests/conformance/test/dom-property-payload-helper.test.mjs`
  - `node tests/smoke/react-dom-mutation-adapter-shell.mjs`
- Workspace:
  - `npm run check --workspace @fast-react/react-dom`
- Hygiene:
  - `git diff --check`
  - `git add --intent-to-add worker-progress/worker-396-react-dom-host-output-attribute-update-gate.md && git diff --check; rc=$?; git reset -- worker-progress/worker-396-react-dom-host-output-attribute-update-gate.md >/dev/null; exit $rc`

## Verification Results

- JS syntax checks passed for all touched JS/MJS files.
- Private root bridge focused test passed: 17/17 tests.
- DOM property-payload focused conformance passed: 24/24 tests.
- React DOM private mutation adapter smoke passed.
- `npm run check --workspace @fast-react/react-dom` passed: 38/38 package
  tests plus import-entrypoint smoke. NPM emitted the existing
  `minimum-release-age` warning.
- `git diff --check` passed, including the worker report after retrying the
  report-inclusive check sequentially. The first parallel report-inclusive
  attempt hit a transient Git `index.lock`.

## Risks Or Blockers

- This remains private fake-DOM infrastructure. It does not execute public
  roots, native/Rust root execution, generic reconciler commit traversal,
  browser DOM compatibility, event dispatch, refs, hydration, controlled forms,
  resources, portals, or public React DOM compatibility.
- Property-only updates require stable primitive children because HostText
  creation/reconciliation is still outside this handoff.
- Style support is limited to the existing oracle-backed property-payload style
  slice. Broader CSS diagnostics, shorthand interactions, namespace/custom
  element routing, and live browser CSSOM behavior remain future work.

## Recommended Next Tasks

- Add a private HostComponent update handoff from real commit metadata once
  root commit traversal owns ordered HostComponent update records.
- Add separate gates for browser/jsdom style behavior before any public DOM
  compatibility claim.
- Keep event latest-props, refs, hydration replay, controlled forms, and
  resource host behavior behind their dedicated private gates.
