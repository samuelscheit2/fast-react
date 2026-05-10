# Worker 555: Conformance Public Facade Refresh 503-533

## Objective

Refresh public facade blocker conformance so accepted private diagnostics from
503-533 cannot promote public root/render/hydration/event/resource/form/
controlled/test-renderer compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. This
is a conformance gate refresh, not an implementation worker.

## Write Scope

- `tests/conformance/src/`
- `tests/conformance/test/`
- `worker-progress/worker-555-conformance-public-facade-refresh-503-533.md`

## Requirements

- Add explicit rejected promotion rows for new accepted private metadata.
- Keep public compatibility claims false.
- Avoid duplicating current queue/future plan text in progress docs.

## Verification

- Focused public facade/root-render/test-renderer conformance tests touched
- `npm run check --workspace @fast-react/conformance` if available; otherwise
  run the focused scripts covering touched gates
- `git diff --check`

