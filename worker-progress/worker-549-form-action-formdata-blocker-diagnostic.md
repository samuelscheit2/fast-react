# Worker 549 - Form Action FormData Blocker Diagnostic

## Goal

- Active goal status from `get_goal`: `active`
- Active goal objective: Add private form action `FormData` blocker diagnostics
  that record why real form inspection and action invocation remain blocked
  while accepted submit/reset metadata is present.

## Summary

Added a private shared React DOM form-action diagnostic gate for the next
blocked layer after accepted submit event extraction and reset queue/commit
metadata. The new gate records form target shape, submitter shape, accepted
event/reset metadata ids, blocked form data construction, blocked action
invocation, reset execution blockers, and public compatibility blockers.

The gate rejects raw form/event/action/dispatcher/reset objects, does not read
real form fields, does not call previous dispatchers, does not enqueue reset
state, does not execute reset effects, and does not expose public compatibility.

## Changed Files

- `packages/react-dom/src/shared/form-actions.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
- `worker-progress/worker-549-form-action-formdata-blocker-diagnostic.md`

## Evidence Gathered

- Existing private form action/reset dispatcher gate records submit/requestSubmit
  action metadata and reset dispatcher ordering while blocking raw forms,
  form data construction, action invocation, previous dispatcher calls, reset
  queueing, and public compatibility.
- Existing event-extraction gate consumes only accepted submission intent
  metadata and keeps native event inspection, synthetic event creation, form
  data construction, action invocation, and host transition blocked.
- Existing reset queue/commit gate consumes only accepted reset intent metadata
  and records reset queue/commit ordering while keeping live fiber lookup,
  queue writes, React updates, after-mutation reset traversal, and real
  `form.reset()` blocked.
- React 19.2.6 reference source confirms form actions normally read form and
  submit control shape, construct form data, prevent default for function
  actions, and start host transitions. The new Fast React gate records those
  as blocked diagnostics only.
- Spawned one nested explorer for form-gate orientation. It did not return a
  usable summary before implementation, so no conclusions depended on it.

## Commands Run

```sh
node --check packages/react-dom/src/shared/form-actions.js
rg -n "\b(?:requestFormReset|useFormStatus|useFormState|resetFormInstance|reset_form_instance|HostTransition|hostTransition|startHostTransition|FormData|submitter|createFormDataWithSubmitter|formState|form_state)\b" packages/react-dom/src/shared/form-actions.js || true
node --test packages/react-dom/test/resource-form-unsupported-gates.test.js
node --test tests/conformance/test/react-dom-form-actions-oracle.test.mjs
npm run check --workspace @fast-react/react-dom
git diff --check
```

## Verification

- `node --check packages/react-dom/src/shared/form-actions.js` passed.
- Focused resource/form package test passed: 36 tests.
- Focused form-actions conformance test passed: 15 tests.
- React DOM workspace check passed: 79 package tests plus smoke import checks.
- `git diff --check` passed with the new source and progress files included
  via intent-to-add.

## Risks Or Blockers

- Public form action behavior remains intentionally blocked.
- The new private file is not wired into public React DOM entrypoints.
- Broader package-surface inventory was not updated because it was outside the
  assigned write scope and not part of the worker verification list.

## Recommended Next Tasks

1. Add a package-surface inventory admission for the new private source file
   when the next broad package-surface refresh is assigned.
2. Keep the public form action path blocked until real DOM form ownership,
   form data construction, host transition status, reset queueing, and reset
   commit traversal are all conformance-backed.
