# Worker 381: Conformance Root Public Blockers After Private Host Output

## Goal Evidence

- First action: `create_goal` was called before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and reported status `active`.
- Active objective recorded from `get_goal`: audit React DOM root public facade
  blockers after private host-output admissions so public `createRoot`, render,
  unmount, hydration, and portal claims stay fail-closed with explicit
  regression coverage.
- Final pre-report `get_goal` still reported status `active` for the same
  objective.

## Summary

Tightened the React DOM root public facade blockers after the private
host-output diagnostic admissions.

Public root compatibility remains blocked. The public facade gate now validates
that private host-output rows stay fake-DOM-only evidence, private bridge rows
stay record-only, public `hydrateRoot` remains a placeholder with no hydration
side effects, and portal root-render rows remain fail-closed. The public facade
CLI now reports the portal blocker count alongside private host-output counts.

No React DOM runtime behavior was admitted.

## Changed Files

- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `tests/conformance/test/react-dom-client-root-oracle.test.mjs`
- `tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs`
- `worker-progress/worker-381-conformance-root-public-blockers-after-private-host-output.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read required prior worker reports present in this checkout: 121, 163, 263,
  337, 342, and 352.
- Worker reports 367, 368, 369, and 380 were not present in this checkout.
- Inspected the current public placeholder entrypoint
  `packages/react-dom/client.js`, the private root bridge, root E2E gate,
  public facade blocked gate, root E2E tests, and client-root oracle tests.
- Spawned one read-only explorer for an independent audit. It did not return a
  result before implementation and verification, was closed, and did not affect
  conclusions.

## Implementation Notes

- Added explicit public facade boundary rows for public hydration and public
  portal root-render blockers.
- Added public facade validation for private host-output gate counts, admission
  sets, row-level non-public evidence flags, record-only root bridge evidence,
  and portal blocker compatibility flags.
- Added regression tests that mutate private host-output and portal rows into
  compatibility claims and prove the public facade gate fails closed.
- Added public `hydrateRoot` regression coverage and client-root placeholder
  assertions for Fast React `createRoot`/`hydrateRoot`.

## Commands Run

```sh
node --check tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs
node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
node --check tests/conformance/test/react-dom-client-root-oracle.test.mjs
node --check tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs
node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
node --test tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs
node --test tests/conformance/test/react-dom-client-root-oracle.test.mjs
npm run root-render-e2e:conformance --workspace @fast-react/conformance
npm run root-public-facade:conformance --workspace @fast-react/conformance
npm run check:js
git diff --check
```

## Verification

- Syntax checks passed for all touched JS modules/tests.
- Focused public facade test passed: 11 tests.
- Focused root E2E oracle/gate test passed: 14 tests.
- Focused client-root oracle test passed: 13 tests.
- `root-render-e2e:conformance` passed with 0 admitted public rows, 20 blocked
  public rows, 8 private host-output diagnostic rows admitted, 12 private
  host-output rows blocked, and 5 portal root-render rows blocked.
- `root-public-facade:conformance` passed with 12 blocked public facade rows,
  8 blocked private bridge rows, 8 private host-output diagnostics admitted,
  12 private host-output diagnostics blocked, and 5 portal rows blocked through
  the root-render gate.
- `npm run check:js` passed, including 590 conformance tests.
- `git diff --check` passed, including a rerun with the new report added via
  intent-to-add.
- npm printed the existing `minimum-release-age` warning during npm commands.

## Risks Or Blockers

- The private host-output rows remain fake-DOM diagnostics only; they do not
  prove public React DOM root behavior, browser DOM behavior, hydration, portal
  mounting, event dispatch, or compatibility.
- The public facade gate intentionally stays fail-closed until public
  `createRoot`, `hydrateRoot`, render, unmount, DOM mutation, listener setup,
  and portal mounting match the React 19.2.6 oracle through the public package
  path.
- No blockers remain for this worker scope.

## Recommended Next Tasks

- Keep public root rows blocked until public package-path root execution can be
  compared against the React 19.2.6 oracle.
- When future workers admit more private host-output scenarios, extend these
  public facade blocker assertions before changing any public compatibility
  claim.
