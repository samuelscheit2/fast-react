# Worker 593: Root Render E2E Real Handoff Gate

## Objective

Refresh root-render E2E conformance gates to include accepted root work-loop and
commit handoff diagnostics without claiming public root compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 534, 565, 578, and 556 area work should show the path toward real root
handoff while public roots remain placeholders.

## Write Scope

- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-593-root-render-e2e-real-handoff-gate.md`

Avoid runtime implementation files unless a narrow private metadata field is
required to make the gate truthful.

## Requirements

- Add root work-loop/commit handoff rows to the private root-render E2E gate.
- Keep public createRoot/render/update/unmount/hydrateRoot compatibility false.
- Add negative tests for accidental promotion of real-handoff metadata.
- Preserve existing 503-564 private promotion rows and portal/resource/form/
  controlled/test-renderer blockers.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `git diff --check`
