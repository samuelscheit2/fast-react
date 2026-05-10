# Worker 492: Form Submit Action Metadata Gate

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: Add private form diagnostics
  for submit/requestSubmit action metadata and reset-dispatcher ordering
  without inspecting real form elements.

## Summary

Extended the existing private form action/reset dispatcher gate with
metadata-only diagnostics for submit/requestSubmit action handling and reset
dispatcher ordering.

Submission intent records now distinguish `submit`, `requestSubmit`, replay, and
unknown triggers, and include primitive-only action metadata for resolved action
kind/source, form action kind, submitter action kind, submitter override intent,
and whether the submitter value would be included in FormData. Reset intent
records now include a deterministic ordering summary for current dispatcher
entry, React-owned form ownership check before previous-dispatcher fallback,
action-completion reset-before-action ordering, and commit reset ordering.

The gate remains private and diagnostic-only. It does not accept real forms,
raw events, action functions, FormData, submitters, or submit controls; does not
inspect form elements; does not construct FormData or SyntheticEvents; does not
invoke actions, start host transitions, call previous dispatchers, enqueue reset
state, commit resets, dispatch real resets, touch public roots, or claim
compatibility.

## Changed Files

- `packages/react-dom/src/resource-form-internals-gate.js`
  - Added accepted primitive metadata enums for submit/requestSubmit triggers,
    action metadata, and reset ordering.
  - Added submission `actionMetadata` records and reset
    `resetDispatcherOrdering` records.
  - Added summary and contract flags for the new private diagnostics.
  - Kept all raw input rejection and execution side-effect flags fail-closed.
- `packages/react-dom/src/resource-form-gates.js`
  - Propagated the new metadata availability through the source adapter
    boundary summary.
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - Added focused assertions for submit/requestSubmit action metadata, reset
    dispatcher ordering, no live form inspection, and no reset side effects.
- `tests/conformance/src/react-dom-form-actions-unsupported-gates.mjs`
  - Extended the form-action unsupported gate to assert the new private
    diagnostics remain metadata-only.
- `worker-progress/worker-492-form-submit-action-metadata-gate.md`
  - This report.

## Evidence Gathered

- Required context read:
  - `WORKER_BRIEF.md`
  - `MASTER_PLAN.md`
  - `MASTER_PROGRESS.md`
  - `worker-progress/worker-461-form-action-reset-dispatcher-gate.md`
  - resource/form oracle reports present in this worktree, including workers
    060, 172, 219, and 260.
- React 19.2.6 reference source confirms:
  - `FormActionEventPlugin.js` extracts submit events, resolves form and
    submitter action metadata, creates FormData/SyntheticEvent, prevents
    default for function actions, and starts host transitions in the real path.
  - `ReactDOMFormActions.js` forwards `requestFormReset` to dispatcher key `r`.
  - `ReactFiberConfigDOM.js` tries React-owned form reset first, then delegates
    to `previousDispatcher.r` after ownership miss.
  - `ReactFiberHooks.js` requests form reset before invoking the action during
    action-completion host transitions.
  - `ReactFiberCommitWork.js` performs real form resets later during commit.
- The implemented Fast React gate records those ordering facts as private
  primitive metadata only and keeps every execution/inspection flag false.
- A nested read-only explorer was spawned for current gate context, but it did
  not return a result before timeout and was closed. No delegated findings
  affected the implementation.

## Commands Run

- Goal tools:
  - `create_goal`
  - `get_goal`
- Context and inspection:
  - `pwd`
  - `git status --short`
  - `rg --files`
  - targeted `rg -n` scans over React DOM source, tests, conformance gates, and
    the React 19.2.6 reference clone
  - `sed -n` reads for required docs/reports, target files, tests,
    conformance gates, and React reference source
  - `git diff --stat`
  - scoped `git diff` review
- Syntax:
  - `node --check packages/react-dom/src/resource-form-internals-gate.js`
  - `node --check packages/react-dom/src/resource-form-gates.js`
  - `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --check tests/conformance/src/react-dom-form-actions-unsupported-gates.mjs`
- Focused tests:
  - `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --test tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
- Required workspace verification:
  - `npm run check --workspace @fast-react/react-dom`
  - `git add -N worker-progress/worker-492-form-submit-action-metadata-gate.md`
  - `git diff --check`

## Verification Results

- JS syntax checks passed for all touched JS/MJS files.
- Package-local React DOM resource/form gate passed: 26/26 tests.
- Focused form-actions conformance passed: 13/13 tests.
- React DOM workspace check passed: 60/60 package tests plus import-entrypoint
  smoke checks. npm emitted the existing `minimum-release-age` warning.
- `git diff --check` passed with this report included via intent-to-add.

## Risks Or Blockers

- No blockers remain.
- This remains metadata-only evidence. It does not prove browser submit,
  requestSubmit, submitter value inclusion, FormData mutation, SyntheticEvent
  behavior, action invocation, host transition status, previous-dispatcher
  delegation, reset queueing, or commit-time `form.reset()` behavior.
- Future real form action work must keep public compatibility false until
  live DOM form ownership, event extraction, action execution, reset queueing,
  and commit reset behavior are separately admitted with browser/jsdom-backed
  oracles.

## Recommended Next Tasks

- Add a private form action event-extraction gate that consumes event metadata
  without creating SyntheticEvents or FormData.
- Add a reset queue/commit metadata gate before enabling any real form reset
  scheduling or `form.reset()` behavior.
- Add browser or jsdom-backed submit/requestSubmit form action oracles before
  claiming public form compatibility.
