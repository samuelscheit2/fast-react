# Worker 592: Conformance Private Admission Refresh 534-564

## Objective

Refresh conformance private-admission gates after queue 534-564 so accepted
private diagnostics are tracked and still cannot promote public compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 555 and 556 extended public facade/root-render gates. This task should
refresh the central private-admission inventory.

## Write Scope

- `tests/conformance/src/private-admission-*.mjs`
- `tests/conformance/test/*private*admission*.mjs` or existing matching tests
- Any checked conformance oracle/snapshot directly owned by the private-admission
  gate
- `worker-progress/worker-592-conformance-private-admission-refresh-534-564.md`

Do not edit runtime implementations unless the conformance gate exposes a real
missing private metadata field that must be added narrowly.

## Requirements

- Add accepted queue 534-564 private diagnostic ids to the admission gate.
- Keep all public compatibility and promotion flags false.
- Add failure cases for accidental promotion to public root/render/act/resource/
  form/controlled/test-renderer compatibility.
- Preserve existing 503-533 admission rows.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- Run the focused private-admission conformance tests.
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
