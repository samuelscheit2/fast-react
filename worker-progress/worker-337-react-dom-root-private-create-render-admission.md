# Worker 337: React DOM Root Private Create/Render Admission

## Goal State

- First action: `create_goal` was called before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and reported status `active`.
- Active objective recorded from `get_goal`: Add a private React DOM root
  admission path that combines accepted createRoot mark/listen records with
  private root bridge create/render records without exposing public root
  objects or mutating real DOM.
- Final pre-report `get_goal` still reported status `active` for the same
  objective.

## Summary

Added a private React DOM create/render admission path on the root bridge. The
new path accepts only a bridge-owned createRoot record, an active private
createRoot mark/listen side-effect record, and a same-root private root.render
record. It returns a frozen create/render admission record with hidden payload
links for the raw container and element.

The path records marker/listener prerequisites as accepted, while native
execution, reconciler execution, scheduling, DOM child/text/attribute mutation,
hydration, event dispatch, public root object exposure, and compatibility
claims remain blocked.

Public `react-dom/client` exports were not changed.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `worker-progress/worker-337-react-dom-root-private-create-render-admission.md`

No changes were needed in `packages/react-dom/src/client/dom-container.js` or
`packages/react-dom/src/client/root-markers.js`; their existing helpers covered
container description, owner document lookup, and root marker validation.

## Evidence Gathered

- Read required context after goal setup: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and worker reports 167, 215, 239,
  240, 269, 310, 315, and 318.
- Confirmed the current bridge already had private create/render/unmount
  request records, record-only request admission, native request handoff
  metadata, and explicit reversible createRoot mark/listen side effects.
- Added `admitCreateRenderPath` on private bridge shells plus top-level
  `admitPrivateCreateRenderPath`.
- Added `FastReactDomPrivateRootCreateRenderAdmissionRecord`, payload accessors,
  accepted marker/listener capability metadata, and blocked execution/DOM/
  compatibility capability metadata.
- Validation requires same bridge shell, same root handle, create before
  render, an active side-effect record for the create record, matching root
  marker owner, and root/owner-document listening markers.
- Focused tests prove no public root object is created, raw container/element
  values stay hidden from the admission record, listener/marker records are
  accepted prerequisites, and DOM mutation logs remain empty.
- No nested agents were spawned.

## Commands Run

```sh
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --check packages/react-dom/src/client/dom-container.js
node --check packages/react-dom/src/client/root-markers.js
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node tests/smoke/react-dom-private-root-bridge-shell.mjs
node tests/smoke/react-dom-container-listener-shell.mjs
npm run check --workspace @fast-react/react-dom
git diff --check
git add --intent-to-add worker-progress/worker-337-react-dom-root-private-create-render-admission.md && git diff --check; rc=$?; git reset -- worker-progress/worker-337-react-dom-root-private-create-render-admission.md >/dev/null; exit $rc
```

## Verification

- JS syntax checks passed for touched bridge/test files and scoped
  `dom-container.js` / `root-markers.js`.
- Focused private bridge test passed: 7 tests.
- Private bridge smoke and container/listener smoke checks passed.
- `npm run check --workspace @fast-react/react-dom` passed: 23 tests plus
  import-entrypoint smoke.
- `git diff --check` passed, including a report-inclusive rerun with this new
  progress file added via intent-to-add.

## Risks Or Blockers

- This is still a private admission record path. It does not schedule or run
  reconciler work, commit host output, mutate DOM children/text/attributes, or
  prove public React DOM root compatibility.
- The admission validates listener markers and registration records, but does
  not dispatch events or model production listener lifetime policy.
- Public `createRoot`, `hydrateRoot`, `root.render`, and `root.unmount` remain
  blocked placeholders.

## Recommended Next Tasks

- Feed this private create/render admission record into future native or
  reconciler preflight only after those paths can consume private handles
  without exposing public root objects.
- Keep public root facade rows blocked until marker/listener setup,
  scheduling, commit, unmount cleanup, and DOM mutation match the accepted
  React DOM root E2E oracle.
