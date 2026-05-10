# Worker 260: Resource/Form Action Internals Gate

## Goal Evidence

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available and returned status `active`.
- Active objective recorded by `get_goal`: add a private resource/form action
  internals gate that keeps accepted React DOM resource hint, singleton, form
  action, and controlled form behavior unsupported with deterministic metadata,
  without dispatching resources, submitting forms, tracking controls, public
  roots, or compatibility claims.
- `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` were read after
  goal setup. `ORCHESTRATOR.md` was not read.

## Status

Complete after implementation and verification. Goal is still active until the
final worker handoff calls `update_goal(status: "complete")`.

## Summary

Added a private React DOM source gate for resource/form-action internals. The
new gate creates frozen, deterministic unsupported records for accepted
resource hint, host singleton, form action, and controlled form-control
requests.

The gate is metadata-only: it stores no raw DOM/form/control objects, does not
dispatch resource work, resolve singletons, submit or reset forms, track
controls, touch public roots, or claim compatibility. Public React DOM
entrypoints remain the existing unsupported placeholders.

## Changed Files

- `packages/react-dom/src/resource-form-internals-gate.js`
  - New private metadata-only gate with deterministic request records,
    accepted contract metadata, missing-prerequisite metadata, no-side-effect
    flags, private record validation, and private fail-closed errors.
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - Added direct package-local coverage for the private gate, deterministic
    records, metadata-only argument summaries, no-side-effect flags, private
    errors, and unknown-request failure.
  - Kept existing public resource/form/controlled unsupported gates and adjusted
    the source-token scan to allow only the new metadata gate file.
- `tests/conformance/src/react-dom-resource-hints-unsupported-gates.mjs`
  - Allowed the new metadata-only source file in the conformance source-token
    gate while leaving adapter implementation tokens blocked elsewhere.
- `worker-progress/worker-260-resource-form-action-internals-gate.md`
  - This report.

## Evidence Gathered

- Worker 059 established resource hint API and private dispatcher evidence, with
  Fast React comparison and compatibility claims false.
- Worker 060 established form action oracle evidence, with full client form
  action behavior and compatibility claims false.
- Worker 064 established controlled form-control oracle evidence, with fake DOM
  limitations and compatibility claims false.
- Worker 172 added conformance unsupported gates for resources, singletons, form
  actions, and controlled controls.
- Worker 219 added the package-local unsupported gate now extended here.
- Worker 231 tightened deterministic unsupported placeholder metadata checks.
- React reference source confirmed the relevant private dispatcher keys
  (`D`, `C`, `L`, `m`, `X`, `S`, `M`, `r`) and singleton tags
  (`html`, `head`, `body`).
- A nested read-only explorer was spawned, but it produced no result before two
  waits timed out; it was closed and did not affect conclusions.

## Commands Run

- Goal tools:
  - `create_goal`
  - `get_goal`
- Context and inspection:
  - `sed -n` reads for `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
    `MASTER_PROGRESS.md`, and worker reports 059, 060, 064, 172, 219, 231.
  - `git status --short`
  - `find packages/react-dom -maxdepth 4 -type f | sort`
  - `rg -n` scans for resource/form/controlled/internal tokens.
  - `sed -n` reads for React DOM entrypoints, placeholder utilities, existing
    package/conformance unsupported gates, and React reference resource/form
    source.
  - Node oracle metadata summary for resource, form, and controlled input
    artifacts.
- Syntax:
  - `node --check packages/react-dom/src/resource-form-internals-gate.js`
  - `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --check tests/conformance/src/react-dom-resource-hints-unsupported-gates.mjs`
- Focused verification:
  - `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
  - `node --test tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
  - `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- Required verification:
  - `npm run check --workspace @fast-react/react-dom`
  - `npm run check:js`
  - `git diff --check`
  - `git diff --no-index --check -- /dev/null <untracked worker files>`

## Verification Results

- `node --check` passed for all touched JS files.
- Package-local resource/form gate passed: 7/7 tests.
- Focused resource hints conformance passed: 12/12 tests.
- Focused form actions conformance passed: 13/13 tests.
- Focused controlled input conformance passed: 12/12 tests.
- `npm run check --workspace @fast-react/react-dom` passed, including the
  package-local gate and import-entrypoints smoke check.
- `npm run check:js` passed, including package surface, import smoke,
  benchmarks, all workspace JS checks, and 505 conformance tests.
- `git diff --check` passed.
- No-index `git diff --check` passed for the untracked new source module and
  report file.
- npm emitted the existing `minimum-release-age` warning during workspace
  commands; it did not fail verification.

## Risks Or Blockers

- The new gate is private and not wired to public React DOM entrypoints or root
  rendering. This is intentional for this metadata-only slice.
- The source-token scan now allow-lists exactly
  `packages/react-dom/src/resource-form-internals-gate.js`; future real adapter
  work must update the gates with stronger prerequisite coverage rather than
  broadening that exception.
- The private records summarize argument types only and deliberately do not
  retain raw form, DOM, resource, or control objects.
- No blockers remain.

## Recommended Next Tasks

- Add DOM/Fizz resource effect oracles before enabling resource dispatch.
- Add host singleton ownership and hydration/commit gates before resolving
  `html`, `head`, or `body` singletons.
- Add browser or jsdom-backed form action and controlled-control oracles before
  enabling form submission/reset, host transition status, value tracking, or
  controlled restore.
