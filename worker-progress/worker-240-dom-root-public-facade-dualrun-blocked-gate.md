# Worker 240 - DOM Root Public Facade Dual-Run Blocked Gate

## Goal Evidence

- `create_goal` was called before research, file reads, implementation, or
  verification for objective:
  `Add a fail-closed dual-run gate for public React DOM root facade behavior that compares accepted oracle prerequisites and current Fast React placeholder/root-bridge boundaries, while keeping createRoot, hydrateRoot, render, unmount, DOM mutation, listener setup, and compatibility claims blocked.`
- `get_goal` after setup reported status `active` with the same objective.
- Continuation `get_goal` also reported status `active` for the same objective
  before final verification and report work.

## Summary

Added a fail-closed public React DOM root facade gate on top of the accepted
client-root and root render E2E oracle prerequisites. The gate keeps public
`react-dom/client` root behavior blocked while checking the current local
boundary:

- accepted client-root oracle rows are present and non-compatible;
- accepted root-render E2E rows still flow through the existing fail-closed
  root-render gate with 0 admitted rows and 20 blocked rows;
- public `createRoot` and `hydrateRoot` remain placeholders that throw
  `FAST_REACT_UNIMPLEMENTED`;
- `root.render` and `root.unmount` remain unreachable through the public
  facade;
- public facade probes produce no DOM mutation, container marker writes, or
  listener registrations;
- private root bridge create/render/unmount records stay record-only with
  `nativeExecution: false` and no public side effects;
- compatibility claims are rejected while any public facade or bridge rows are
  blocked.

No runtime React DOM root behavior was implemented.

## Changed Files

- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
  - Added the public facade blocked gate metadata, runner, formatter,
    public-placeholder inspector, private root-bridge boundary inspector, and
    fail-closed validation helpers.
- `tests/conformance/scripts/check-react-dom-root-public-facade-blocked-gate.mjs`
  - Added the focused CLI with `--format=text|json`.
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
  - Added focused tests for the successful blocked gate, explicit admission
    metadata, placeholder inspection, premature public behavior rejection,
    private bridge side-effect rejection, compatibility-claim rejection, and
    record-only private bridge evidence.
- `tests/conformance/package.json`
  - Added `root-public-facade:conformance`.
- `worker-progress/worker-240-dom-root-public-facade-dualrun-blocked-gate.md`
  - This report.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`; did not
  read `ORCHESTRATOR.md`.
- Read accepted context reports for workers 046, 054, 121, 122, 163, 167, and
  215.
- Inspected sibling reports/status for workers 239 and 262. Their worktrees now
  contain active local diffs and reports, but those changes are not present in
  this worker's current worktree; this gate was written against the current
  checked-in public placeholder and private root-bridge boundaries.
- Inspected the updated gate source, new CLI, new test, package script, git
  status, and diff.
- No nested managed agents were spawned.

## Commands Run

```sh
node --check tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs
node --check tests/conformance/scripts/check-react-dom-root-public-facade-blocked-gate.mjs
node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
npm run root-public-facade:conformance --workspace @fast-react/conformance
npm run root-render-e2e:conformance --workspace @fast-react/conformance
npm run check:js
git add --intent-to-add tests/conformance/scripts/check-react-dom-root-public-facade-blocked-gate.mjs tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs worker-progress/worker-240-dom-root-public-facade-dualrun-blocked-gate.md && git diff --check; rc=$?; git reset -- tests/conformance/scripts/check-react-dom-root-public-facade-blocked-gate.mjs tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs worker-progress/worker-240-dom-root-public-facade-dualrun-blocked-gate.md >/dev/null; exit $rc
```

Additional audit/context commands included:

```sh
git status --short --untracked-files=all
git diff --stat
git diff -- tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs tests/conformance/scripts/check-react-dom-root-public-facade-blocked-gate.mjs tests/conformance/package.json
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,220p' worker-progress/worker-046-react-dom-client-root-oracle.md
sed -n '1,220p' worker-progress/worker-054-react-dom-root-export-implementation.md
sed -n '1,220p' worker-progress/worker-121-root-render-e2e-oracle.md
sed -n '1,220p' worker-progress/worker-122-dom-container-listener-shell.md
sed -n '1,220p' worker-progress/worker-163-root-e2e-conformance-gate.md
sed -n '1,260p' worker-progress/worker-167-react-dom-private-root-bridge.md
sed -n '1,220p' worker-progress/worker-215-dom-root-bridge-private-update-path.md
sed -n '1,260p' /Users/user/Developer/Developer/fast-react-worker-239-dom-root-bridge-request-admission-gate/worker-progress/worker-239-dom-root-bridge-request-admission-gate.md
sed -n '1,280p' /Users/user/Developer/Developer/fast-react-worker-262-root-render-e2e-private-bridge-dualrun-gate/worker-progress/worker-262-root-render-e2e-private-bridge-dualrun-gate.md
```

## Verification Results

- Syntax checks passed for all touched JS files.
- Focused public facade test passed: 6 tests.
- `npm run root-public-facade:conformance --workspace @fast-react/conformance`
  passed:
  - 44 accepted client-root scenario-mode rows checked;
  - 20 accepted root-render scenario-mode rows checked;
  - 20 blocked root-render rows;
  - 7 blocked public facade rows;
  - 4 blocked private bridge rows;
  - 0 failures.
- `npm run root-render-e2e:conformance --workspace @fast-react/conformance`
  passed with 0 admitted rows, 20 blocked unsupported rows, and 0 failures.
- `npm run check:js` passed, including package-surface checks, smoke imports,
  benchmark gates, workspace checks, native loader checks, and 511
  conformance tests.
- Report-inclusive `git diff --check` passed with new files included via
  intent-to-add.

## Completion Audit

Objective restated as concrete deliverables:

- Add a fail-closed dual-run gate for public React DOM root facade behavior.
- Compare accepted client-root oracle prerequisites and accepted root-render
  E2E oracle/gate prerequisites with the current Fast React public placeholder
  and private root-bridge boundaries.
- Keep `createRoot`, `hydrateRoot`, public `root.render`, public
  `root.unmount`, DOM mutation, listener setup, and compatibility claims
  blocked.
- Keep scenario admission explicit and compatibility false.
- Stay inside the assigned write scope and avoid runtime root behavior.
- Add a focused gate script/test if needed, wire the package script, verify
  syntax, focused tests, existing root-render gate, full JS checks, and diff
  hygiene.

Prompt-to-artifact checklist:

- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`:
  contains `REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_GATE`, explicit blocked
  scenario admissions, boundary rows, the public facade blocked gate runner,
  evaluator, formatter, public placeholder inspection, private bridge
  inspection, and compatibility-claim rejection.
- `tests/conformance/scripts/check-react-dom-root-public-facade-blocked-gate.mjs`:
  present and used by the focused npm script.
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`:
  present and passed, covering successful blocked status plus failure cases for
  premature public behavior, private bridge side effects, and compatibility
  claims.
- `tests/conformance/package.json`: contains
  `root-public-facade:conformance`.
- Public facade blocked behavior: focused test and CLI prove
  `createRoot`/`hydrateRoot` throw `FAST_REACT_UNIMPLEMENTED`, no root object
  is created, `render`/`unmount` are unreachable, and no mutation, marker, or
  listener side effects occur.
- Private root bridge boundary: focused test and CLI prove create/render/
  unmount records are record-only with `nativeExecution: false`, deferred
  marker/listener guards, render-after-unmount still blocked, and no public
  side effects.
- Accepted oracle prerequisites: the gate checks the accepted client-root
  oracle shape/counts and composes with the existing accepted root-render E2E
  conformance gate before admitting any blocked public facade rows.
- Runtime scope: `git status --short --untracked-files=all` shows only the
  scoped conformance package/source/script/test files plus this report.
- Verification: syntax checks, focused test, focused public facade gate,
  existing root-render gate, `npm run check:js`, and report-inclusive
  `git diff --check` passed.

## Risks Or Blockers

- This is conformance gate work only. It does not prove public React DOM root
  compatibility and does not implement scheduling, rendering, commit, DOM
  mutation, listener setup, hydration, native/Rust execution, or public root
  lifecycle behavior.
- The gate is intentionally pinned to the current placeholder metadata and
  private bridge record-only shape. Future accepted changes from workers 239 or
  262 may require conflict resolution in the shared root-render conformance
  gate file.
- The public facade inspection uses a narrow fake DOM/event-target surface to
  detect accidental marker/listener/mutation side effects. It is not browser
  behavior evidence.

## Recommended Next Tasks

- Reconcile this public facade blocked gate with worker 239's private
  root-bridge admission metadata and worker 262's private bridge dual-run gate
  if those branches are accepted.
- Keep public root facade admission blocked until Fast React can match the
  checked React DOM root render E2E oracle through the real reconciler, commit,
  DOM mutation, and listener setup paths.
- When runtime root behavior is authorized, update scenario admission metadata
  incrementally and require the gate to compare admitted rows against the
  accepted React DOM 19.2.6 oracle before any compatibility claim.
